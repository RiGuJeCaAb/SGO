// As notas escritas no mapa.
//
// A carta anotada de Cabeça Boa está cheia de frases escritas à mão sobre o traçado:
// «interdito a VFCI», «inversão de marcha», «incêndio subterrâneo». Nenhuma cabe num campo
// de formulário e nenhuma se deduz de coisa nenhuma — são o que quem esteve ali viu.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));

function comTeatro() {
  janela.eval('O = novoEstado(); SERIE = []');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,0975'; O.meta.lon = '-7,8103';
  const e = janela.estObj(); e.n = 2; janela.renderSetores();
  return O;
}

beforeEach(async () => { if (janela) await janela.largarTeclado(); });

/* ---- as espécies ---- */

test('as espécies de nota não se apresentam como doutrina', semAplicacao, () => {
  /* A doutrina classifica pontos de água e zonas de concentração. Não classifica bilhetes
     que alguém escreve na margem de uma carta, e a aplicação não finge que sim: nenhuma
     destas espécies cita artigo nenhum. */
  const T = avaliar(janela, 'TIPOS_NOTA');
  /* Quatro desde a r0103: o percurso de fuga ou zona de segurança, que alerta (ramo #006). */
  assert.equal(T.length, 4);
  T.forEach((t) => {
    assert.ok(t.n && t.d, t.k);
    assert.ok(!/art\.|n\.º|DON|Despacho/i.test(t.n + ' ' + t.d),
      'a espécie «' + t.k + '» está a citar doutrina que não existe para isto');
  });
  /* Só o aviso tem consequência para quem lá vai, e é por isso que se distingue. */
  assert.equal(T.find((t) => t.k === 'aviso').alerta, true);
  assert.equal(T.find((t) => t.k === 'seguranca').alerta, true, 'o E e o S do LACES no caminho da frente não passam em silêncio');
  assert.equal(T.find((t) => t.k === 'obs').alerta, false);
  assert.equal(T.find((t) => t.k === 'manobra').alerta, false);
});

test('uma espécie desconhecida cai em observação', semAplicacao, () => {
  assert.equal(janela.defNota('inventada').k, 'obs');
});

/* ---- escrever ---- */

test('uma nota sem texto não se escreve', semAplicacao, () => {
  /* Uma nota vazia é um ponto sem informação, e o mapa já tem tipos de ponto para marcar
     sítios. */
  comTeatro();
  const r = janela.escreverNota('aviso', 41.09, -7.81, '   ');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /sem texto/);
  assert.equal(janela.notasLista().length, 0);
});

test('escrever uma nota grava o texto, o sítio, o GDH e quem', semAplicacao, () => {
  const O = comTeatro();
  const r = janela.escreverNota('aviso', 41.09, -7.81, 'interdito a VFCI');
  assert.ok(r.ok, r.motivo);
  assert.equal(r.nota.txt, 'interdito a VFCI');
  assert.equal(r.nota.lat, 41.09);
  assert.ok(r.nota.g, 'sem GDH');
  assert.ok(O.evolucao.some((x) => /«interdito a VFCI»/.test(x.txt)));
});

test('o texto normaliza-se e trunca-se, porque tem de caber sobre a carta', semAplicacao, () => {
  /* Uma nota que precise de três linhas é um registo de evolução e não uma anotação. */
  comTeatro();
  const r = janela.escreverNota('obs', 41.09, -7.81, '  não   ardido\n  a norte  ');
  assert.equal(r.nota.txt, 'não ardido a norte');
  const longa = janela.escreverNota('obs', 41.09, -7.81, 'x'.repeat(300));
  assert.equal(longa.nota.txt.length, avaliar(janela, 'NOTA_MAX'));
});

test('uma coordenada que não é número é recusada', semAplicacao, () => {
  comTeatro();
  assert.equal(janela.escreverNota('aviso', NaN, -7.81, 'x').ok, false);
});

test('a nota sabe em que setor caiu, quando há limites', semAplicacao, () => {
  comTeatro();
  janela.iniciarTraco(0, 'limite');
  [[41.08, -7.84], [41.08, -7.79], [41.10, -7.79], [41.10, -7.84]].forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  janela.fecharTraco();
  assert.equal(janela.escreverNota('manobra', 41.09, -7.81, 'inversão de marcha').nota.setor, 'Alfa');
  assert.equal(janela.escreverNota('manobra', 41.30, -7.50, 'longe').nota.setor, '');
});

test('uma nota que deixou de ser verdade sai da carta', semAplicacao, () => {
  const O = comTeatro();
  const r = janela.escreverNota('obs', 41.09, -7.81, 'não ardido');
  assert.ok(janela.apagarNota(r.nota.id).ok);
  assert.equal(janela.notasLista().length, 0);
  assert.ok(O.evolucao.some((x) => /Retirada a nota/.test(x.txt)));
  assert.equal(janela.apagarNota('inexistente').ok, false);
});

test('com o registo encerrado não se anota nem se apaga', semAplicacao, () => {
  comTeatro();
  const r = janela.escreverNota('aviso', 41.09, -7.81, 'incêndio subterrâneo');
  const O = avaliar(janela, 'O');
  O.encerramento.g = '311200AGO26'; O.encerramento.por = 'Cmdt A';
  assert.equal(janela.escreverNota('aviso', 41.09, -7.81, 'outra').ok, false);
  assert.equal(janela.apagarNota(r.nota.id).ok, false);
  O.encerramento.g = ''; O.encerramento.por = '';
});

/* ---- o que entra na leitura, e o que não entra ---- */

test('só os avisos entram na leitura da evolução', semAplicacao, () => {
  /* «Não ardido» à frente do fogo não é notícia; «incêndio subterrâneo» é decisão. */
  comTeatro();
  janela.escreverNota('aviso', 41.085, -7.812, 'incêndio subterrâneo');
  janela.escreverNota('obs', 41.084, -7.813, 'não ardido');
  janela.escreverNota('manobra', 41.083, -7.814, 'estrada para entrada de meios');
  assert.equal(janela.avisosNoMapa().length, 1);

  janela.iniciarTraco(-1, 'frente');
  [[41.10, -7.82], [41.10, -7.80]].forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  const t = janela.document.getElementById('frente-tipo');
  t.innerHTML = '<option value="cabeca"></option>';
  t.value = 'cabeca';
  janela.document.getElementById('frente-rumo').value = '180';
  janela.fecharTraco();

  const texto = janela.leituraDaEvolucao().frentes[0].texto;
  assert.match(texto, /\*\*Avisos anotados no caminho: «incêndio subterrâneo»/);
  assert.ok(!/não ardido/.test(texto), 'uma observação entrou na leitura');
  assert.ok(!/estrada para entrada/.test(texto), 'uma nota de manobra entrou na leitura');
});

/* ---- o veneno ---- */

test('nenhum veneno entra pela nota, que é texto livre dentro de um SVG', semAplicacao, () => {
  /* É a superfície mais exposta de todas as que se acrescentaram: texto que quem regista
     escreve à mão e que é desenhado por inteiro sobre a carta. Julga-se o SVG depois de o
     navegador o interpretar, e não por procura de texto: o texto escapado contém a palavra
     «onerror» como texto, e isso é inofensivo — o que não pode existir é o atributo. */
  comTeatro();
  const VENENOS = ['" onfocus="window.__mau=1" autofocus zz="',
    "' onfocus='window.__mau=1' autofocus zz='",
    '<img src=x onerror="window.__mau=1">'];
  VENENOS.forEach((v, i) => janela.escreverNota('aviso', 41.09 + i / 1000, -7.81, v));
  janela.enquadrarMapa(640, 620);
  const caixa = janela.document.createElement('div');
  caixa.innerHTML = janela.camadaMapa();
  const PROIBIDO = '[onfocus],[onerror],[onclick],[onload],[autofocus],[zz],img,script,iframe';
  assert.deepEqual([...caixa.querySelectorAll(PROIBIDO)].map((x) => x.tagName.toLowerCase()), [],
    'o texto da nota criou marcação no SVG');
  VENENOS.forEach((v) => assert.ok(!janela.camadaMapa().includes(v),
    'veneno intacto no SVG: ' + v.slice(0, 20)));

  /* e a lista, que é a outra saída */
  janela.pintarPontos();
  const lista = janela.document.getElementById('mapa-pontos');
  assert.deepEqual([...lista.querySelectorAll(PROIBIDO)].map((x) => x.tagName.toLowerCase()), []);
});

/* ---- o estado ---- */

test('uma ocorrência da versão 22 abre sem notas, e não as deduz', semAplicacao, () => {
  const m = janela.migrarGravado({
    versao: 22, meta: { num: '2026/900' }, pco: { funcoes: [] },
    dados: { est: { n: 1, setores: [{}] } },
  });
  assert.equal(m.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.deepEqual(daqui(m.dados.notas), []);
});

test('as notas viajam na exportação', semAplicacao, () => {
  comTeatro();
  janela.escreverNota('aviso', 41.09, -7.81, 'interdito a VFCI');
  const txt = janela.exportarOcorrencia();
  const v = JSON.parse(typeof txt === 'string' ? txt : JSON.stringify(txt));
  const N = (v.estado || v).dados.notas;
  assert.equal(N.length, 1);
  assert.equal(N[0].txt, 'interdito a VFCI');
  assert.equal(N[0].tipo, 'aviso');
});
