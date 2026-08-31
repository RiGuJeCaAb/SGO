// As frentes de fogo: a linha com direção de que se decide.
//
// O estado do setor é uma palavra. Na carta que o posto anota à mão a frente é uma linha
// com sentido de marcha, e é dela que se decide para onde vai o incêndio e de que lado se
// ataca. A nomenclatura — cabeça, flanco, retaguarda — é a de Fernandes (2003).

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));

/* Uma linha a correr de poente para nascente, a norte de Lamego. */
const LINHA = [[41.10, -7.82], [41.10, -7.81], [41.101, -7.80]];

function comTeatro(n = 2) {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,0975'; O.meta.lon = '-7,8103';
  const e = janela.estObj(); e.n = n;
  janela.renderSetores();
  return O;
}

function tracar(pontos, tipo, rumo) {
  janela.iniciarTraco(-1, 'frente');
  pontos.forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  if (janela.document.getElementById('frente-tipo')) {
    janela.document.getElementById('frente-tipo').innerHTML =
      '<option value="cabeca"></option><option value="flanco"></option><option value="retaguarda"></option>';
    janela.document.getElementById('frente-tipo').value = tipo || 'cabeca';
    janela.document.getElementById('frente-rumo').value = rumo === undefined ? '' : String(rumo);
  }
  return janela.fecharTraco();
}

beforeEach(async () => { if (janela) await janela.largarTeclado(); janela?.largarTraco(); });

/* ---- as secções ---- */

test('cada secção da frente declara a fonte da sua nomenclatura', semAplicacao, () => {
  const T = avaliar(janela, 'TIPOS_FRENTE');
  assert.equal(T.length, 3);
  T.forEach((t) => {
    assert.ok(t.n && t.n.length > 3, t.k);
    assert.match(t.r, /Fernandes \(2003\)/, t.k + ' sem fonte: ' + t.r);
    assert.match(t.cor, /^#[0-9A-Fa-f]{6}$/, t.k);
  });
  /* A retaguarda não avança: arde para trás do que já ardeu, e uma seta ali diria uma
     coisa que não é verdade. */
  assert.equal(T.find((t) => t.k === 'retaguarda').avanca, false);
  assert.equal(T.find((t) => t.k === 'cabeca').avanca, true);
});

test('uma secção desconhecida cai em flanco em vez de rebentar', semAplicacao, () => {
  assert.equal(janela.defFrente('inventada').k, 'flanco');
});

/* ---- o traçado ---- */

test('uma frente precisa de dois vértices, e um não faz linha', semAplicacao, () => {
  comTeatro();
  janela.iniciarTraco(-1, 'frente');
  janela.pontoDoTraco(41.10, -7.82);
  assert.equal(janela.faltamAoTraco(), 1);
  const r = janela.fecharTraco();
  assert.equal(r.ok, false);
  assert.match(r.motivo, /dois vértices/);
});

test('o mesmo traçado serve limites e frentes, com mínimos diferentes', semAplicacao, () => {
  /* Duas mecânicas de traçado quase iguais em dois sítios acabariam a divergir. O que
     muda entre elas é o mínimo e o que se faz ao fechar. */
  comTeatro();
  janela.iniciarTraco(0, 'limite');
  assert.equal(janela.faltamAoTraco(), 3);
  janela.largarTraco();
  janela.iniciarTraco(-1, 'frente');
  assert.equal(janela.faltamAoTraco(), 2);
  assert.equal(janela.iniciarTraco(0, 'inventado').ok, false);
});

test('traçar uma cabeça grava a linha, o comprimento e a evolução', semAplicacao, () => {
  const O = comTeatro();
  const r = tracar(LINHA, 'cabeca');
  assert.ok(r.ok, r.motivo);
  assert.equal(r.frente.tipo, 'cabeca');
  assert.equal(daqui(r.frente.linha).length, 3);
  /* cerca de 1,7 km a esta latitude; o que importa é a ordem de grandeza */
  assert.ok(r.frente.m > 1200 && r.frente.m < 2200, 'comprimento ' + r.frente.m + ' m');
  assert.ok(O.evolucao.some((x) => /Cabeça traçada/.test(x.txt)));
  assert.equal(avaliar(janela, 'TRACO').tipo, '', 'o traçado devia ter desaparecido');
});

/* ---- o rumo, e de onde ele veio ---- */

test('o rumo indicado à mão fica como indicado', semAplicacao, () => {
  comTeatro();
  const r = tracar(LINHA, 'cabeca', 45);
  assert.equal(r.frente.rumo, 45);
  assert.equal(r.frente.rumoFonte, 'indicado');
});

test('sem rumo indicado, o traçado sugere-o — e diz que foi sugerido', semAplicacao, () => {
  /* É a distinção que impede uma sugestão de passar por observação três turnos depois. */
  comTeatro();
  const r = tracar(LINHA, 'cabeca');
  assert.ok(r.frente.rumo !== null);
  assert.equal(r.frente.rumoFonte, 'sugerido pelo traçado');
  /* a linha corre para nascente, e a perpendicular à direita aponta a sul */
  assert.ok(Math.abs(r.frente.rumo - 180) < 15, 'rumo sugerido ' + r.frente.rumo);
});

test('a retaguarda não tem direção de progressão, e não se lhe inventa uma', semAplicacao, () => {
  comTeatro();
  const r = tracar(LINHA, 'retaguarda', 45);
  assert.equal(r.frente.rumo, null, 'deu rumo a uma retaguarda');
  assert.equal(r.frente.rumoFonte, '');
  assert.equal(janela.rumoDaFrente(r.frente.id, 90).ok, false);
});

test('o rumo corrige-se sem voltar a traçar, e passa a indicado', semAplicacao, () => {
  const O = comTeatro();
  const r = tracar(LINHA, 'cabeca');
  assert.equal(r.frente.rumoFonte, 'sugerido pelo traçado');
  assert.ok(janela.rumoDaFrente(r.frente.id, '75,5').ok);
  const f = janela.frentesLista()[0];
  assert.ok(Math.abs(f.rumo - 75.5) < 1e-9);
  assert.equal(f.rumoFonte, 'indicado');
  assert.ok(O.evolucao.some((x) => /rumo de progressão corrigido/i.test(x.txt)));
  assert.equal(janela.rumoDaFrente('inexistente', 10).ok, false);
  assert.equal(janela.rumoDaFrente(r.frente.id, 'norte').ok, false, 'aceitou um rumo que não é número');
});

test('o rumo dá sempre a volta ao círculo', semAplicacao, () => {
  comTeatro();
  const r = tracar(LINHA, 'cabeca');
  janela.rumoDaFrente(r.frente.id, 370);
  assert.equal(janela.frentesLista()[0].rumo, 10);
  janela.rumoDaFrente(r.frente.id, -90);
  assert.equal(janela.frentesLista()[0].rumo, 270);
});

/* ---- a geometria ---- */

test('o rumo entre dois pontos é o rumo do terreno', semAplicacao, () => {
  /* Norte, este, sul e oeste a partir do mesmo ponto. */
  assert.ok(Math.abs(janela.rumoEntre(41.0, -7.8, 41.1, -7.8) - 0) < 0.5);
  assert.ok(Math.abs(janela.rumoEntre(41.0, -7.8, 41.0, -7.7) - 90) < 0.5);
  assert.ok(Math.abs(janela.rumoEntre(41.0, -7.8, 40.9, -7.8) - 180) < 0.5);
  assert.ok(Math.abs(janela.rumoEntre(41.0, -7.8, 41.0, -7.9) - 270) < 0.5);
});

test('o comprimento da linha soma os troços, e não a corda entre as pontas', semAplicacao, () => {
  /* Uma linha em cotovelo é mais comprida do que a distância entre os seus extremos. */
  const reta = janela.comprimentoLinhaM([[-7.82, 41.10], [-7.80, 41.10]]);
  const cotovelo = janela.comprimentoLinhaM([[-7.82, 41.10], [-7.81, 41.11], [-7.80, 41.10]]);
  assert.ok(cotovelo > reta, cotovelo + ' não é maior do que ' + reta);
  assert.equal(janela.comprimentoLinhaM([[-7.8, 41.0]]), 0, 'um ponto não tem comprimento');
});

/* ---- o que a frente sabe do resto ---- */

test('a frente traçada dentro de um limite sabe em que setor está', semAplicacao, () => {
  comTeatro();
  janela.iniciarTraco(0, 'limite');
  [[41.09, -7.83], [41.09, -7.79], [41.11, -7.79], [41.11, -7.83]].forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  janela.fecharTraco();
  const r = tracar(LINHA, 'cabeca');
  assert.equal(r.frente.setor, 'Alfa');
});

test('sem limites traçados a frente não inventa setor', semAplicacao, () => {
  comTeatro();
  assert.equal(tracar(LINHA, 'cabeca').frente.setor, '');
});

test('o rumo previsto é proposta, e não se escreve em lado nenhum', semAplicacao, () => {
  /* Sem exposição dominante nem série de vento não há previsão — e é isso que se diz, em
     vez de se propor um rumo qualquer. */
  comTeatro();
  assert.equal(janela.rumoPrevistoDaCabeca(), null);
  const O = avaliar(janela, 'O');
  O.dados.topo.orient = 'S';
  janela.eval('SERIE = [{h:"14:00", ws:30, wd:315}]');
  const p = janela.rumoPrevistoDaCabeca();
  assert.ok(p && isFinite(p.rumo), JSON.stringify(p));
  assert.equal(p.hora, '14:00');
  /* e nada disto tocou no estado */
  assert.deepEqual(daqui(O.dados.frentes), []);
});

/* ---- retirar, encerrar, gravar ---- */

test('uma frente pode ser retirada', semAplicacao, () => {
  comTeatro();
  const r = tracar(LINHA, 'flanco');
  assert.ok(janela.apagarFrente(r.frente.id).ok);
  assert.equal(janela.frentesLista().length, 0);
  assert.equal(janela.apagarFrente('inexistente').ok, false);
});

test('com o registo encerrado não se traça nem se corrige nem se retira', semAplicacao, () => {
  comTeatro();
  const r = tracar(LINHA, 'cabeca');
  const O = avaliar(janela, 'O');
  O.encerramento.g = '311200AGO26'; O.encerramento.por = 'Cmdt A';
  assert.equal(tracar(LINHA, 'cabeca').ok, false);
  assert.equal(janela.rumoDaFrente(r.frente.id, 90).ok, false);
  assert.equal(janela.apagarFrente(r.frente.id).ok, false);
  O.encerramento.g = ''; O.encerramento.por = '';
});

test('uma ocorrência da versão 18 abre sem frentes, e não as inventa', semAplicacao, () => {
  const m = janela.migrarGravado({
    versao: 18, meta: { num: '2026/900' }, pco: { funcoes: [] },
    dados: { est: { n: 1, setores: [{}] } },
  });
  assert.equal(m.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.deepEqual(daqui(m.dados.frentes), []);
});

test('as frentes viajam na exportação da ocorrência', semAplicacao, () => {
  comTeatro();
  tracar(LINHA, 'cabeca', 210);
  const txt = janela.exportarOcorrencia();
  const v = JSON.parse(typeof txt === 'string' ? txt : JSON.stringify(txt));
  const F = (v.estado || v).dados.frentes;
  assert.equal(F.length, 1);
  assert.equal(F[0].rumo, 210);
  assert.equal(F[0].rumoFonte, 'indicado');
  assert.equal(F[0].linha.length, 3);
});
