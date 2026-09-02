// Os avisos do IPMA: que distrito, o que está em vigor, e a que horas.
//
// Três defeitos confirmados por leitura da r0081, todos da mesma família — a aplicação
// afirmava mais do que sabia. Escolhia o distrito pelo ponto de referência mais próximo
// quando já tinha o distrito determinado; chamava «em vigor» a um aviso que ainda não
// começara; e convertia horas de um fuso que o serviço não declara.
//
// A `api.ipma.pt` não é alcançável do ambiente onde estes testes correm — está bloqueada
// pela política de rede, comprovado com `curl` (403 no CONNECT). Por isso os dados aqui
// são construídos à mão, com a forma que o serviço publica, e a convenção de fuso **não
// é dada por assente em lado nenhum**: é essa a questão em prova.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/* A lista do IPMA, na forma que o serviço publica: um ponto de referência por distrito,
   que é o da capital. Estes três chegam para o que se prova. */
const DISTRITOS = [
  { idAreaAviso: 'VRL', local: 'Vila Real', latitude: '41.3006', longitude: '-7.7441' },
  { idAreaAviso: 'VIS', local: 'Viseu', latitude: '40.6610', longitude: '-7.9097' },
  { idAreaAviso: 'PTG', local: 'Portalegre', latitude: '39.2906', longitude: '-7.4256' },
];

/* Moimenta da Beira: 40,983 N, 7,613 W. É concelho do distrito de Viseu e fica a cerca de
   35 km da capital de Vila Real e a 45 km da de Viseu. É o caso que denuncia o método. */
const MOIMENTA = { lat: 40.983, lon: -7.613 };

/* ---- o distrito ---- */

test('o distrito declarado vale mais do que o ponto de referência mais próximo', semAplicacao, () => {
  const a = janela.areaDeAviso(DISTRITOS, 'Viseu', MOIMENTA.lat, MOIMENTA.lon);
  assert.equal(a.cod, 'VIS');
  assert.equal(a.presumido, false);
});

test('sem distrito determinado, a proximidade responde — e sai marcada como presumida', semAplicacao, () => {
  const a = janela.areaDeAviso(DISTRITOS, '', MOIMENTA.lat, MOIMENTA.lon);
  /* O ponto mais próximo é o de Vila Real, e Moimenta da Beira é de Viseu. É exatamente
     este resultado errado que a marca de presunção existe para não deixar passar por
     certo. Se um dia a proximidade acertar aqui, o teste falha e alguém tem de olhar. */
  assert.equal(a.cod, 'VRL');
  assert.equal(a.presumido, true);
});

test('o nome do distrito compara-se sem acentos nem caixa', semAplicacao, () => {
  const lista = [{ idAreaAviso: 'BGC', local: 'Bragança', latitude: '41.8', longitude: '-6.76' }];
  assert.equal(janela.areaDeAviso(lista, 'BRAGANCA', 41.8, -6.76).cod, 'BGC');
  assert.equal(janela.areaDeAviso(lista, 'Bragança', 41.8, -6.76).presumido, false);
});

test('sem lista e sem coordenada não se inventa área nenhuma', semAplicacao, () => {
  assert.equal(janela.areaDeAviso([], 'Viseu', MOIMENTA.lat, MOIMENTA.lon), null);
  assert.equal(janela.areaDeAviso(DISTRITOS, '', NaN, NaN), null);
});

/* ---- a hora, e o que dela se sabe ---- */

test('uma marca com designador de fuso não tem margem nenhuma', semAplicacao, () => {
  const i = janela.instanteAviso('2026-09-02T18:00:00Z');
  assert.equal(i.fuso, true);
  assert.equal(i.min, i.max);
  assert.equal(i.min, Date.UTC(2026, 8, 2, 18, 0, 0));
  const j = janela.instanteAviso('2026-09-02T18:00:00+01:00');
  assert.equal(j.fuso, true);
  assert.equal(j.min, Date.UTC(2026, 8, 2, 17, 0, 0));
});

test('uma marca sem designador devolve o intervalo entre as duas leituras possíveis', semAplicacao, () => {
  /* Não se escolhe UTC nem hora legal: não há fonte que o diga e o serviço não é
     alcançável daqui. O que se devolve é o que se sabe — que o instante está entre as
     duas. Numa máquina em UTC as duas coincidem, e aí a margem é legitimamente zero. */
  const i = janela.instanteAviso('2026-09-02T18:00:00');
  assert.equal(i.fuso, false);
  assert.ok(i.min <= i.max);
  assert.ok(i.min === Date.UTC(2026, 8, 2, 18, 0, 0) || i.max === Date.UTC(2026, 8, 2, 18, 0, 0),
    'uma das leituras tem de ser a leitura em UTC dos algarismos publicados');
});

test('marca vazia ou ilegível não vira instante', semAplicacao, () => {
  assert.equal(janela.instanteAviso(''), null);
  assert.equal(janela.instanteAviso(null), null);
  assert.equal(janela.instanteAviso('ontem à tarde'), null);
});

test('a hora curta não converte o que o serviço não datou', semAplicacao, () => {
  /* Sem designador mostram-se os algarismos publicados, tal e qual. É a única coisa
     verdadeira que se pode escrever sem saber a convenção. */
  assert.equal(janela.fmtAvisoT('2026-08-30T18:00:00'), '30/08 18h');
  assert.equal(janela.fmtAvisoT('2026-08-30 18:00:00'), '30/08 18h');
  /* Com designador, formata-se na hora do posto — que é a que quem lê tem no relógio. */
  const d = new Date(Date.UTC(2026, 7, 30, 18, 0, 0));
  const esperado = String(d.getDate()).padStart(2, '0') + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + 'h';
  assert.equal(janela.fmtAvisoT('2026-08-30T18:00:00Z'), esperado);
});

/* ---- o que está em vigor ---- */

/* Marcas com designador: aqui a questão em prova é a triagem, e não o fuso. */
const marca = (h) => new Date(Date.UTC(2026, 8, 2, h, 0, 0)).toISOString();
const AGORA = Date.UTC(2026, 8, 2, 12, 0, 0);

const bruto = (cod, nivel, ini, fim, tipo) => ({
  idAreaAviso: cod, awarenessLevelID: nivel, awarenessTypeName: tipo || 'Agitação marítima',
  startTime: ini, endTime: fim, text: 'texto do aviso',
});

test('um aviso que só começa amanhã não está em vigor', semAplicacao, () => {
  /* Era este o defeito: o filtro pedia `endTime >= agora` e não olhava para o `startTime`.
     Um aviso vermelho de amanhã aparecia no painel como estando a decorrer. */
  const t = janela.triarAvisos([
    bruto('VIS', 'red', marca(20), marca(23), 'Tempo quente'),
    bruto('VIS', 'orange', marca(9), marca(18), 'Vento'),
  ], 'VIS', AGORA);
  assert.equal(t.lista.map((a) => a.tipo).join(', '), 'Vento');
  assert.equal(t.previstos.map((a) => a.tipo).join(', '), 'Tempo quente');
  assert.equal(t.margem.length, 0);
});

test('o que já terminou desaparece, e o verde nunca entra', semAplicacao, () => {
  const t = janela.triarAvisos([
    bruto('VIS', 'yellow', marca(2), marca(6), 'Já foi'),
    bruto('VIS', 'green', marca(9), marca(18), 'Verde'),
    bruto('VRL', 'red', marca(9), marca(18), 'Doutro distrito'),
  ], 'VIS', AGORA);
  assert.equal(t.lista.length + t.previstos.length + t.margem.length, 0);
});

test('os avisos em vigor saem ordenados pelo nível, do vermelho para o amarelo', semAplicacao, () => {
  const t = janela.triarAvisos([
    bruto('VIS', 'yellow', marca(9), marca(18), 'Am'),
    bruto('VIS', 'red', marca(9), marca(18), 'Vm'),
    bruto('VIS', 'orange', marca(9), marca(18), 'Lr'),
  ], 'VIS', AGORA);
  assert.equal(t.lista.map((a) => a.tipo).join(', '), 'Vm, Lr, Am');
});

test('com designador de fuso não há avisos por confirmar', semAplicacao, () => {
  const t = janela.triarAvisos([bruto('VIS', 'orange', marca(9), marca(18), 'Vento')], 'VIS', AGORA);
  assert.equal(t.presumido, false);
  assert.equal(t.margem.length, 0);
});

test('sem designador, um aviso que acaba dentro da margem do fuso não é dado por findo', semAplicacao, () => {
  /* O fim escrito é 12:00. Lido como UTC ou como hora legal, isso são dois instantes
     diferentes, e o instante corrente cai entre eles. Dizer «terminado» seria escolher
     uma convenção; dizer «em vigor» seria escolher a outra. Diz-se «por confirmar». */
  const t = janela.triarAvisos([
    { idAreaAviso: 'VIS', awarenessLevelID: 'orange', awarenessTypeName: 'Vento',
      startTime: '2026-09-02T06:00:00', endTime: '2026-09-02T12:00:00', text: '' },
  ], 'VIS', AGORA);
  const total = t.lista.length + t.margem.length;
  assert.equal(total, 1, 'o aviso não pode desaparecer por causa do fuso');
  assert.equal(t.presumido, true, 'a falta de designador tem de ficar assinalada');
  const fim = janela.instanteAviso('2026-09-02T12:00:00');
  /* Numa máquina em UTC as duas leituras coincidem e a resposta certa é «terminado à
     tabela»; fora de UTC a margem existe e o aviso fica por confirmar. O teste exige a
     resposta certa para o fuso em que corre, e não uma delas por acaso. */
  if (fim.min === fim.max) assert.equal(t.margem.length + t.lista.length, 1);
  else assert.equal(t.margem.length, 1, 'com margem, o estado é «por confirmar»');
});

test('um aviso a que falte a marca de tempo não é deitado fora', semAplicacao, () => {
  /* Um vermelho não se descarta por lhe faltar um campo. Fica por confirmar, que é o
     que ele é. */
  const t = janela.triarAvisos([
    { idAreaAviso: 'VIS', awarenessLevelID: 'red', awarenessTypeName: 'Tempo quente',
      startTime: '', endTime: '', text: '' },
  ], 'VIS', AGORA);
  assert.equal(t.margem.map((a) => a.tipo).join(', '), 'Tempo quente');
  assert.equal(t.presumido, true);
});

/* ---- o que o estado guarda ---- */

test('a migração 25 para 26 abre as prateleiras novas sem reclassificar nada', semAplicacao, () => {
  const antigo = {
    versao: 25,
    avisos: { distrito: 'Vila Real', cod: 'VRL', g: '021200SET26',
      lista: [{ tipo: 'Vento', nivel: 'orange', ini: '2026-09-02T20:00:00', fim: '2026-09-02T23:00:00', txt: '' }] },
  };
  const m = janela.migrarGravado(antigo);
  assert.equal(m.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.equal(m.avisos.previstos.length, 0);
  assert.equal(m.avisos.margem.length, 0);
  /* O que estava gravado foi escolhido por proximidade e datado sem fuso, porque era assim
     que a revisão que o gravou trabalhava. Diz-se isso, em vez de o dar por bom. */
  assert.equal(m.avisos.porProximidade, true);
  assert.equal(m.avisos.semFuso, true);
  /* E não se reclassifica: a triagem precisa do instante da consulta, e esse já passou. */
  assert.equal(m.avisos.lista.length, 1);
  assert.equal(m.avisos.lista[0].est, 'vigor');
});

test('um estado sem avisos atravessa a migração sem ganhar um objeto', semAplicacao, () => {
  const m = janela.migrarGravado({ versao: 25, avisos: null });
  assert.equal(m.avisos, null);
});

/* ---- o que se vê no painel ---- */

function pintar(avisos) {
  janela.eval('O = novoEstado()');
  avaliar(janela, 'O').avisos = avisos;
  janela.pintarAvisos();
  return janela.document.getElementById('avisos-ipma').innerHTML;
}

test('o painel diz que o distrito é presumido quando o é', semAplicacao, () => {
  const h = pintar({ distrito: 'Vila Real', cod: 'VRL', g: '021200SET26',
    porProximidade: true, semFuso: false, lista: [], previstos: [], margem: [] });
  assert.match(h, /presumido/);
  assert.match(h, /capital de distrito/);
  assert.match(h, /Determina-o pelas coordenadas em Comando/);
});

test('com o distrito determinado, o painel não fala em presunção nenhuma', semAplicacao, () => {
  const h = pintar({ distrito: 'Viseu', cod: 'VIS', g: '021200SET26',
    porProximidade: false, semFuso: false, lista: [], previstos: [], margem: [] });
  assert.doesNotMatch(h, /presumido/);
  assert.match(h, /Sem avisos acima de verde em vigor/);
});

test('o previsto e o por confirmar aparecem escritos por palavras, e não só pela cor', semAplicacao, () => {
  /* Sem ícones e sem depender do traço: quem lê a correr tem de saber pelo texto se o
     aviso já conta para a manobra em curso. */
  const h = pintar({ distrito: 'Viseu', cod: 'VIS', g: '021200SET26',
    porProximidade: false, semFuso: true,
    lista: [{ tipo: 'Vento', nivel: 'orange', ini: '', fim: '2026-09-02T18:00:00', est: 'vigor', txt: '' }],
    previstos: [{ tipo: 'Tempo quente', nivel: 'red', ini: '2026-09-03T09:00:00', fim: '', est: 'previsto', txt: '' }],
    margem: [{ tipo: 'Trovoada', nivel: 'yellow', ini: '', fim: '', est: 'margem', txt: '' }] });
  assert.match(h, /previsto · de 03\/09 09h/);
  assert.match(h, /por confirmar · /);
  assert.match(h, /não declaram fuso horário/);
  assert.match(h, /não para a manobra em curso/);
});

test('um painel gravado por uma revisão antiga não parte por lhe faltarem prateleiras', semAplicacao, () => {
  /* A migração abre-as, mas um estado importado de fora pode chegar sem elas, e o painel
     não é sítio para rebentar. */
  const h = pintar({ distrito: 'Viseu', cod: 'VIS', g: '021200SET26', lista: [] });
  assert.match(h, /Sem avisos acima de verde em vigor/);
});
