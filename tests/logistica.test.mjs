// A célula de logística e finanças com ramo próprio — estado na versão 5.
//
// Veio da linhagem paralela no p0006, com a sua bateria (t0006). Está aqui porque um
// teste que não corre em `npm run tudo` não protege nada.
//
// O que isto fixa: `dados.est` reclamava ser o dispositivo e guardava lá dentro a
// reserva e a zona de apoio, que são áreas da zona de concentração e reserva e
// portanto matéria de Logística — art. 32.º, n.º 1, al. b), e DL n.º 90-A/2022,
// art. 13.º, al. c). Enquanto partilhavam objeto com os setores, uma escrita em bloco
// atravessava a fronteira sem se ver.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const VERSAO = janela ? avaliar(janela, 'VERSAO_ESTADO') : 0;
const daqui = (x) => JSON.parse(JSON.stringify(x));
const estado = () => avaliar(janela, 'O');

beforeEach(() => {
  if (!janela) return;
  janela.eval('O = novoEstado()');
});

/* ---- a fronteira, no próprio estado ---- */

test('o dispositivo só contém matéria de Operações', semAplicacao, () => {
  const est = Object.keys(daqui(janela.novoEstado().dados.est));
  assert.deepEqual(est.sort(), ['aer', 'aerL', 'livre', 'n', 'setores']);
});

test('a logística tem ramo próprio com as três matérias', semAplicacao, () => {
  const L = daqui(janela.novoEstado().logistica);
  assert.deepEqual(Object.keys(L).sort(), ['pontoTransito', 'reserva', 'zonaApoio']);
  assert.deepEqual(L.reserva, { m: '', o: '' });
  assert.equal(L.pontoTransito.des, '');
  assert.equal(janela.novoEstado().dados.pt, undefined, 'a origem foi limpa');
});

/* ---- a escada de migrações ---- */

test('a versão subiu para 5 e há um degrau por versão', semAplicacao, () => {
  assert.equal(VERSAO, 5);
  assert.equal(avaliar(janela, 'MIGRACOES').length, VERSAO);
});

test('um estado da versão 4 migra sem perder um único valor', semAplicacao, () => {
  const m = janela.migrarGravado({
    versao: 4, meta: { num: '2026/500' }, pco: { funcoes: [] },
    dados: { est: { n: 1, setores: [], res: { m: '3', o: '12' }, za: { m: '1', o: '4' } },
      pt: { des: 'Rotunda da EN226', resp: 'Adj. Pinto', ct: '', cd: '', obs: '' } },
  });
  assert.equal(m.versao, VERSAO);
  assert.deepEqual(daqui(m.logistica.reserva), { m: '3', o: '12' });
  assert.deepEqual(daqui(m.logistica.zonaApoio), { m: '1', o: '4' });
  assert.equal(m.logistica.pontoTransito.des, 'Rotunda da EN226');
  assert.equal(m.dados.est.res, undefined, 'a origem é limpa: não ficam duas verdades');
  assert.equal(m.dados.pt, undefined);
});

test('a migração atravessa a escada inteira desde a versão zero', semAplicacao, () => {
  const m = janela.migrarGravado({
    meta: { num: '2026/501' },
    dados: { est: { n: 2, res: { m: '5', o: '20' } } },
  });
  assert.equal(m.versao, VERSAO);
  assert.deepEqual(daqui(m.logistica.reserva), { m: '5', o: '20' });
  assert.equal(typeof m.turno, 'object', 'o degrau 3 para 4 também correu');
});

test('a migração é idempotente', semAplicacao, () => {
  const uma = janela.migrarGravado({ versao: 4, dados: { est: { res: { m: '2', o: '9' } } } });
  const duas = janela.migrarGravado(JSON.parse(JSON.stringify(uma)));
  assert.deepEqual(daqui(duas.logistica), daqui(uma.logistica));
});

test('o que já estava na logística vence o que restar na origem', semAplicacao, () => {
  // Vazio não é migrado: é vazio. Testar só a existência do ramo faria uma ocorrência
  // anterior à versão 1 perder a reserva em silêncio.
  const m = janela.migrarGravado({
    versao: 4,
    logistica: { reserva: { m: '9', o: '40' } },
    dados: { est: { res: { m: '1', o: '1' } } },
  });
  assert.deepEqual(daqui(m.logistica.reserva), { m: '9', o: '40' });

  const vazio = janela.migrarGravado({
    versao: 4,
    logistica: { reserva: { m: '', o: '' } },
    dados: { est: { res: { m: '7', o: '30' } } },
  });
  assert.deepEqual(daqui(vazio.logistica.reserva), { m: '7', o: '30' }, 'o vazio não venceu');
});

/* ---- acessores ---- */

test('ptObj mantém o nome e passa a devolver da logística', semAplicacao, () => {
  // Nove pontos de chamada não mudaram uma linha: mudou o que a função devolve.
  janela.logisticaObj().pontoTransito.des = 'Rotunda';
  assert.equal(janela.ptObj().des, 'Rotunda');
  assert.equal(estado().logistica.pontoTransito.des, 'Rotunda');
});

test('reservaObj e zaObj escrevem no ramo da logística', semAplicacao, () => {
  janela.reservaObj().m = '4';
  janela.zaObj().o = '11';
  assert.equal(estado().logistica.reserva.m, '4');
  assert.equal(estado().logistica.zonaApoio.o, '11');
});

test('os acessores normalizam um ramo em falta sem rebentar', semAplicacao, () => {
  janela.eval('delete O.logistica');
  assert.doesNotThrow(() => janela.reservaObj());
  assert.deepEqual(daqui(estado().logistica.reserva), { m: '', o: '' });
});

/* ---- o mapa de posse acompanhou ---- */

test('os caminhos novos têm dono e os antigos já não existem', semAplicacao, () => {
  assert.equal(janela.donoDoRamo('logistica.reserva').celula, 'logistica');
  assert.equal(janela.donoDoRamo('logistica.pontoTransito').celula, 'logistica');
  const a = daqui(janela.auditarPosse(janela.novoEstado()));
  assert.deepEqual(a.orfaos, []);
  assert.deepEqual(a.duplicados, []);
});

test('o plano de comunicações está declarado como movimento pendente', semAplicacao, () => {
  // Declarar o que falta é melhor do que fingir que está feito: `pco.canais` tem 52
  // pontos de leitura e o instantâneo do PEA copia o ramo `pco` inteiro.
  const a = daqui(janela.auditarPosse(janela.novoEstado()));
  const p = (a.porMover || []).find((x) => x.de === 'pco.canais');
  assert.ok(p, 'o movimento pendente não está declarado');
  assert.equal(p.celula, 'logistica');
  assert.ok(p.porque && p.porque.length > 20, 'sem razão declarada');
});

test('o instantâneo da logística leva as três matérias, e Operações não leva a reserva',
  semAplicacao, () => {
    const lg = Object.keys(janela.instantaneoCelula('logistica'));
    const op = Object.keys(janela.instantaneoCelula('operacoes'));
    ['logistica.reserva', 'logistica.zonaApoio', 'logistica.pontoTransito']
      .forEach((r) => assert.ok(lg.includes(r), lg.join(', ')));
    assert.ok(!op.some((r) => r.startsWith('logistica.')), op.join(', '));
  });

/* ---- a ocorrência sobrevive à ida e volta ---- */

test('exportar e reimportar preserva a reserva e o ponto de trânsito', semAplicacao, () => {
  // Pelo formulário, que é por onde o oficial escreve: `pacoteOcorrencia()` lê o
  // formulário antes de compor o pacote, e um valor posto só no estado seria apagado
  // por ele. Já custou um teste errado neste projeto.
  janela.reservaObj().m = '6';
  const el = janela.document.getElementById('pt-des');
  el.value = 'Rotunda da EN226';
  el.dispatchEvent(new janela.Event('change', { bubbles: true }));
  const pacote = JSON.parse(JSON.stringify(janela.pacoteOcorrencia()));
  assert.equal(pacote.versao, VERSAO);

  janela.eval('O = novoEstado()');
  janela.importarOcorrencia(JSON.stringify(pacote));
  assert.equal(janela.reservaObj().m, '6');
  assert.equal(janela.ptObj().des, 'Rotunda da EN226');
});

/* ---- o formulário tem de escrever no ramo novo ---- */

test('o ponto de trânsito escrito à mão chega ao ramo da logística', semAplicacao, () => {
  // A versão 5 moveu o ramo e o acessor, e os cinco campos do formulário continuaram
  // a apontar para `dados.pt`, que deixou de existir. O que o oficial escrevia ia para
  // um ramo morto: `ptObj()` devolvia vazio, e o ponto de trânsito não chegava ao PEA,
  // nem ao briefing, nem às pendências. Falha silenciosa, corrigida na r0039.
  const el = janela.document.getElementById('pt-des');
  el.value = 'Largo da Igreja de Leomil';
  el.dispatchEvent(new janela.Event('change', { bubbles: true }));

  assert.equal(janela.ptObj().des, 'Largo da Igreja de Leomil');
  assert.equal(estado().dados.pt, undefined, 'o ramo morto não pode voltar a nascer');
  assert.deepEqual(daqui(janela.auditarPosse(estado())).orfaos, []);
});

test('o ponto de trânsito volta ao formulário quando se reabre a ocorrência',
  semAplicacao, () => {
    janela.logisticaObj().pontoTransito.des = 'Rotunda da EN226';
    janela.escreverForm();
    assert.equal(janela.document.getElementById('pt-des').value, 'Rotunda da EN226');
  });

test('o ponto de trânsito chega às pendências da célula de logística', semAplicacao, () => {
  janela.logisticaObj().pontoTransito.des = 'Rotunda da EN226';
  const p = daqui(janela.pendenciasCelula('logistica')).find((x) => /trânsito/i.test(x.t));
  assert.ok(p, 'o ponto de trânsito não aparece nas pendências');
  assert.match(p.x, /Rotunda da EN226/);
});
