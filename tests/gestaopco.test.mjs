// Importação da Gestão PCO — contrato `pco:dispositivo` versão 1.
// docs/CSREPCDouro_d0002_202608281630_ContratoGestaoPCO_CLD.md

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const ler = (n) => readFile(new URL(`../docs/exemplos/${n}`, import.meta.url), 'utf8');
const V1 = await ler('pco-dispositivo_v1_exemplo.json');
const V0 = await ler('pco-dispositivo_v0_esboco.json');
const estado = () => avaliar(janela, 'O');
const converter = (t) => janela.converterGestaoPCO(janela.lerContratoGestaoPCO(t));

beforeEach(() => {
  if (!janela) return;
  janela.eval('O = novoEstado()');
  janela.confirm = () => true;
});

test('regra 1 — recusa tipo diferente e versão superior à conhecida', semAplicacao, () => {
  assert.throws(() => janela.lerContratoGestaoPCO('{"tipo":"outra","versao":1}'), /não é "pco:dispositivo"/);
  assert.throws(() => janela.lerContratoGestaoPCO('{"tipo":"pco:dispositivo","versao":99}'), /versão 99/);
  assert.throws(() => janela.lerContratoGestaoPCO('{"tipo":"pco:dispositivo","versao":"1"}'), /número inteiro/);
  assert.throws(() => janela.lerContratoGestaoPCO('não é json'), /não é JSON válido/);
  assert.throws(() => janela.lerContratoGestaoPCO('[]'), /forma esperada/);
});

test('uma recusa não toca no estado corrente', semAplicacao, () => {
  estado().dados.est.n = 4;
  assert.throws(() => janela.prepararGestaoPCO('{"tipo":"outra","versao":1}'));
  assert.equal(estado().dados.est.n, 4);
});

test('o exemplo do contrato lê-se com o que a origem manda registar', semAplicacao, () => {
  const r = converter(V1).resumo;
  assert.equal(r.versao, 1);
  assert.equal(r.setores, 2);
  assert.equal(r.forcas, 3);
  assert.equal(r.aereos, 2);
  assert.equal(r.funcoes, 4, 'duas funções e dois núcleos externos');
  assert.equal(r.app, 'Gestão PCO');
  assert.equal(r.operador, 'Adj. Sousa');
  assert.equal(r.posto, 'PCO Vila Real');
  assert.ok(r.emitido, 'o instante de emissão vira GDH');
});

test('a identificação chega aos campos certos, e o distrito não se perde', semAplicacao, () => {
  const c = converter(V1);
  assert.equal(c.meta.num, '2026080123');
  assert.equal(c.meta.fase, 'IV');
  assert.equal(c.meta.nivel, 'DELTA');
  assert.equal(c.meta.concelho, 'Alijó');
  assert.equal(c.meta.distrito, 'Vila Real');
  assert.equal(c.meta.pasta, 'Douro');
  assert.equal(c.meta.pco, 'Vila Real');
  assert.match(c.meta.inicio, /^\d{6}[A-Z]{3}\d{2}$/, 'instante ISO vira GDH doutrinário');
});

test('instantes ISO 8601 com fuso são lidos como instantes', semAplicacao, () => {
  assert.equal(janela.instanteISO('2026-08-28T12:30:00+01:00'), Date.parse('2026-08-28T12:30:00+01:00'));
  assert.equal(janela.instanteISO(null), null);
  assert.equal(janela.instanteISO('ontem à tarde'), null);
});

test('tipologia antes de contagem: os efetivos vêm do catálogo', semAplicacao, () => {
  const f = converter(V1).est.setores[0].tip[0];
  assert.equal(f.t, 'ECIN');
  assert.equal(f.q, 2);
  assert.equal(f.mu, janela.catDef('ECIN').mu, 'veículos do Anexo 1');
  assert.ok(f.ts, 'com instante de empenhamento');
});

test('sem tipologia usa-se a contagem livre, e só aí', semAplicacao, () => {
  const f = converter(V1).est.setores[1].tip[0];
  assert.equal(f.t, '');
  assert.equal(f.livre, true);
  assert.equal(f.mu, 2);
  assert.equal(f.ou, 6);
});

test('uma estimativa assinalada é registada como tal', semAplicacao, () => {
  assert.match(converter(V1).avisos.join(' | '), /estimativa assinalada pela origem/);
});

test('um núcleo solicitado e por nomear é assinalado', semAplicacao, () => {
  assert.match(converter(V1).avisos.join(' | '), /Núcleo de Emergência Médica.*por nomear/);
});

test('as funções do PCO entram com a designação exata', semAplicacao, () => {
  const f = converter(V1).funcoes;
  assert.equal(f[0].f, 'Oficial de Operações');
  assert.equal(f[0].siresp, 'PC TAT 1');
  assert.ok(f[0].g, 'com o GDH de nomeação');
  assert.equal(f[2].f, 'Núcleo de Segurança');
  assert.equal(f[2].entidade, 'GNR');
});

test('uma designação de função inventada não cruza em silêncio', semAplicacao, () => {
  const p = JSON.parse(V1);
  p.pco.funcoes[0].funcao = 'Chefe de tudo';
  assert.match(converter(JSON.stringify(p)).avisos.join(' | '), /Chefe de tudo.*não corresponde/);
});

test('um sexto estado de setor não degrada em silêncio', semAplicacao, () => {
  const p = JSON.parse(V1);
  p.dispositivo.setores[0].estado = 'Fogo bonito';
  const c = converter(JSON.stringify(p));
  assert.equal(c.est.setores[0].estado, 'Em curso (ativo)');
  assert.match(c.avisos.join(' | '), /não é um dos cinco do ponto 7\.f/);
});

test('estados antigos são normalizados antes de validar — regra 3', semAplicacao, () => {
  const p = JSON.parse(V1);
  p.dispositivo.setores[0].estado = 'Frente ativa';
  const c = converter(JSON.stringify(p));
  assert.equal(c.est.setores[0].estado, 'Em curso (ativo)');
  assert.match(c.avisos.join(' | '), /convertido para/);
});

test('o indicativo do meio aéreo é confrontado com a tipologia que a DON lhe fixa', semAplicacao, () => {
  const p = JSON.parse(V1);
  p.dispositivo.aereos[0].indicativo = 'KILO 09';
  assert.match(converter(JSON.stringify(p)).avisos.join(' | '), /KILO está fixado para HEBP/);
});

test('o ponto de trânsito chega ao seu lugar', semAplicacao, () => {
  const pt = converter(V1).pt;
  assert.match(pt.des, /Largo da igreja/);
  assert.equal(pt.resp, 'Adj. Pinto');
  assert.match(pt.cd, /41\.2755/);
  assert.match(pt.obs, /Ativo desde/);
});

test('uma ZCR ativa é assinalada, por não haver onde a registar', semAplicacao, () => {
  const p = JSON.parse(V1);
  p.dispositivo.zcr = { ativa: true, local: 'Sabrosa', areas: [] };
  assert.match(converter(JSON.stringify(p)).avisos.join(' | '), /zona de concentração e reserva ativa/);
});

test('secção 8 — o esboço anterior lê-se como versão 0', semAplicacao, () => {
  const c = converter(V0);
  assert.equal(c.resumo.versao, 0);
  assert.equal(c.est.setores.length, 2);
  assert.match(c.est.setores[0].livre, /frente norte/);
  assert.equal(c.est.res.m, '4');
  assert.equal(c.est.res.o, '18');
  assert.equal(c.est.aerL.length, 2);
  assert.equal(c.est.aerL[0].t, 'HEBL');
  assert.equal(c.est.aerL[0].ts, null);
  assert.match(c.avisos.join(' | '), /não serve para operar/);
});

test('regra 6 — havendo dispositivo registado, há diferencial antes de aplicar', semAplicacao, () => {
  const vazio = janela.prepararGestaoPCO(V1);
  assert.equal(vazio.diferencial.length, 0, 'sem nada registado não há o que comparar');

  janela.aplicarGestaoPCO(vazio.conversao);
  const p = JSON.parse(V1);
  p.dispositivo.setores.pop();
  const segundo = janela.prepararGestaoPCO(JSON.stringify(p));

  assert.ok(segundo.diferencial.length, 'agora há diferencial');
  const setores = segundo.diferencial.find((l) => l.rot === 'Setores');
  assert.equal(setores.antes, 2);
  assert.equal(setores.depois, 1);
});

test('preparar não escreve nada no estado', semAplicacao, () => {
  janela.prepararGestaoPCO(V1);
  assert.equal(estado().dados.est.n, 0);
  assert.equal(estado().meta.num, '');
});

test('aplicar escreve o dispositivo e não toca no que é da Estação', semAplicacao, () => {
  const O = estado();
  O.evolucao.push({ g: '281200AGO26', tipo: 'posit', t: 'registo anterior' });
  O.peas.push({ n: 1 });
  O.csv = 'série já carregada';

  janela.aplicarGestaoPCO(janela.prepararGestaoPCO(V1).conversao);

  assert.equal(estado().meta.num, '2026080123');
  assert.equal(estado().dados.est.n, 2);
  assert.equal(estado().dados.est.aerL.length, 2);
  assert.equal(estado().pco.funcoes.length, 4);
  assert.equal(estado().dados.area, '120');

  assert.equal(estado().evolucao.length, 1, 'a evolução é da Estação');
  assert.equal(estado().peas.length, 1, 'os PEA são da Estação');
  assert.equal(estado().csv, 'série já carregada', 'o meteograma é da Estação');
});

test('regra 5 — a fita regista origem, operador, emissão e o que faltou', semAplicacao, () => {
  const p = JSON.parse(V1);
  delete p.dispositivo.setores[0].forcas[0].empenhado;
  janela.aplicarGestaoPCO(janela.prepararGestaoPCO(JSON.stringify(p)).conversao);

  const linha = estado().fita.at(-1).e;
  assert.match(linha, /origem Gestão PCO r0042/);
  assert.match(linha, /operador Adj\. Sousa/);
  assert.match(linha, /posto PCO Vila Real/);
  assert.match(linha, /emitido \d{6}[A-Z]{3}\d{2}/);
  assert.match(linha, /importado \d{6}[A-Z]{3}\d{2}/);
  assert.match(linha, /2 setores, 3 forças/);
  assert.match(linha, /1 força\(s\) sem instante de empenhamento/);
});

/* ---- especificação v1.1, o esquema que governa ---- */

const V11 = await ler('EspecificacaoJSON_v1.1_exemplo.json');

test('a v1.1 é reconhecida pelo seu próprio envelope', semAplicacao, () => {
  const r = converter(V11).resumo;
  assert.equal(r.esquema, 'especificação');
  assert.equal(r.versao, '1.1');
  assert.equal(r.setores, 2);
  assert.equal(r.forcas, 3);
  assert.equal(r.aereos, 2);
});

test('a v1.1 entra sem um único ponto a confirmar', semAplicacao, () => {
  const c = converter(V11);
  assert.equal(c.avisos.length, 0, c.avisos.join(' | '));
});

test('a versão da v1.1 compara-se por partes, não por cadeia', semAplicacao, () => {
  // "1.10" é posterior a "1.9"; a comparação de cadeias diria o contrário.
  const p = JSON.parse(V11);
  p.versao = '1.10';
  assert.throws(() => janela.lerPacoteGestaoPCO(JSON.stringify(p)), /versão 1\.10/);
  p.versao = '1.0';
  assert.doesNotThrow(() => janela.lerPacoteGestaoPCO(JSON.stringify(p)));
  p.versao = 'x.y';
  assert.throws(() => janela.lerPacoteGestaoPCO(JSON.stringify(p)), /ilegível/);
});

test('a v1.1 traz os pontos sensíveis, que o contrato não tem', semAplicacao, () => {
  assert.match(converter(V11).sensiveis, /Leomil/);
  janela.aplicarGestaoPCO(janela.prepararGestaoPCO(V11).conversao);
  assert.match(estado().dados.sensiveis, /Leomil/);
});

test('as siglas descontinuadas da v1.1 continuam a ser convertidas', semAplicacao, () => {
  const p = JSON.parse(V11);
  p.setores[0].meios[0].tipologia = 'GRIF';
  const c = converter(JSON.stringify(p));
  assert.equal(c.est.setores[0].tip[0].t, 'GRIR');
  assert.match(c.avisos.join(' | '), /descontinuada/);
});

test('os três envelopes desembocam na mesma forma interna', semAplicacao, () => {
  for (const texto of [V11, V1, V0]) {
    const c = converter(texto);
    for (const campo of ['meta', 'est', 'funcoes', 'pt', 'avisos', 'resumo']) {
      assert.ok(c[campo] !== undefined, `${c.resumo.esquema}: falta ${campo}`);
    }
    assert.ok(Array.isArray(c.est.setores));
    assert.ok(Array.isArray(c.est.aerL));
  }
});

test('um envelope que não se reconhece é recusado', semAplicacao, () => {
  assert.throws(() => janela.lerPacoteGestaoPCO('{"qualquer":"coisa"}'), /não se reconhece o envelope/);
});

test('as funções importadas fundem-se, e não apagam as nomeadas à mão', semAplicacao, () => {
  const P = janela.pcoObj();
  P.funcoes.push({ f: 'Coordenador do PCO', nome: 'COS Almeida', entidade: 'CB Alijó',
    ct: '910000099', siresp: 'PC COM 1', ba: '', g: '281100AGO26' });

  janela.aplicarGestaoPCO(janela.prepararGestaoPCO(V1).conversao);

  const f = estado().pco.funcoes;
  assert.equal(f.length, 5, 'quatro importadas mais a que já lá estava');
  const cos = f.find((x) => x.f === 'Coordenador do PCO');
  assert.equal(cos.nome, 'COS Almeida', 'a nomeada à mão sobreviveu intacta');
  assert.ok(f.find((x) => x.f === 'Oficial de Operações'), 'as importadas entraram');
});

test('reimportar a mesma função atualiza-a em vez de a duplicar', semAplicacao, () => {
  janela.aplicarGestaoPCO(janela.prepararGestaoPCO(V1).conversao);
  const antes = estado().pco.funcoes.length;
  janela.aplicarGestaoPCO(janela.prepararGestaoPCO(V1).conversao);
  assert.equal(estado().pco.funcoes.length, antes, 'sem duplicados');
});
