// Os limites de setor: a área que separa a responsabilidade de quem comanda um da de
// quem comanda o outro.
//
// Na carta que o posto anota à mão, o Alfa e o Bravo estão separados por uma linha que
// segue o terreno. Até à r0070 o setor tinha um ponto e mais nada, e um ponto não diz
// onde acaba um setor.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));

/* Um quadrado de cerca de 1,1 km de lado junto a Lamego, e o seu vizinho a nascente. */
const ALFA = [[-7.82, 41.09], [-7.81, 41.09], [-7.81, 41.10], [-7.82, 41.10], [-7.82, 41.09]];
const BRAVO = [[-7.81, 41.09], [-7.80, 41.09], [-7.80, 41.10], [-7.81, 41.10], [-7.81, 41.09]];

function comSetores(n) {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,095'; O.meta.lon = '-7,815';
  const e = janela.estObj();
  e.n = n;
  /* É `renderSetores` que cria os setores em falta, e não `comporSetores` — essa compõe
     o texto do quadro a partir dos que já existem. */
  janela.renderSetores();
  return O;
}

beforeEach(async () => { if (janela) await janela.largarTeclado(); janela?.largarTraco(); });

/* ---- o traçado ---- */

test('um setor nasce sem limite, e isso não é um setor de área nula', semAplicacao, () => {
  comSetores(2);
  assert.equal(janela.limiteSetor(0), null);
  assert.equal(janela.areaSetorHa(0), 0);
  assert.deepEqual(daqui(janela.estObj().setores[0].limite), []);
});

test('traçar precisa de três vértices, e dois não fazem figura', semAplicacao, () => {
  comSetores(2);
  assert.ok(janela.iniciarTraco(0, 'limite').ok);
  janela.pontoDoTraco(41.09, -7.82);
  janela.pontoDoTraco(41.09, -7.81);
  const r = janela.fecharTraco();
  assert.equal(r.ok, false);
  assert.match(r.motivo, /três vértices/);
  assert.equal(janela.limiteSetor(0), null, 'gravou uma figura que não existe');
});

test('o traçado a meio não é facto: não entra no estado nem na evolução', semAplicacao, () => {
  const O = comSetores(2);
  janela.iniciarTraco(0, 'limite');
  [[41.09, -7.82], [41.09, -7.81], [41.10, -7.81]].forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  assert.equal(janela.limiteSetor(0), null, 'gravou antes de fechar');
  assert.equal(O.evolucao.filter((x) => /[Ll]imite/.test(x.txt)).length, 0);
  /* e largar não deixa rasto */
  janela.largarTraco();
  assert.equal(janela.limiteSetor(0), null);
  assert.equal(avaliar(janela, 'TRACO').setor, -1);
});

test('fechar grava o limite, a área e a linha de evolução', semAplicacao, () => {
  const O = comSetores(2);
  janela.iniciarTraco(0, 'limite');
  ALFA.slice(0, 4).forEach(([lo, la]) => janela.pontoDoTraco(la, lo));
  const r = janela.fecharTraco();
  assert.ok(r.ok, r.motivo);
  const anel = daqui(janela.limiteSetor(0));
  assert.equal(anel.length, 5, 'o anel tem de fechar sobre o primeiro vértice');
  assert.deepEqual(anel[0], anel[4]);
  /* cerca de 1,1 km × 0,84 km — perto de 93 ha; o que importa é a ordem de grandeza */
  assert.ok(r.area > 60 && r.area < 130, 'área ' + r.area + ' ha fora do esperado');
  assert.ok(O.evolucao.some((x) => /Limite do setor Alfa traçado/.test(x.txt)));
  assert.equal(avaliar(janela, 'TRACO').setor, -1, 'o traçado devia ter desaparecido');
});

test('desfazer retira o último vértice, e não mais', semAplicacao, () => {
  comSetores(1);
  janela.iniciarTraco(0, 'limite');
  [[41.09, -7.82], [41.09, -7.81], [41.10, -7.81]].forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  assert.equal(janela.desfazerTraco().n, 2);
  assert.equal(avaliar(janela, 'TRACO').pontos.length, 2);
  janela.desfazerTraco(); janela.desfazerTraco();
  assert.equal(janela.desfazerTraco().ok, false, 'desfez o que já não havia');
});

test('um limite traçado pode ser retirado', semAplicacao, () => {
  comSetores(1);
  janela.iniciarTraco(0, 'limite');
  ALFA.slice(0, 4).forEach(([lo, la]) => janela.pontoDoTraco(la, lo));
  janela.fecharTraco();
  assert.ok(janela.apagarLimite(0).ok);
  assert.equal(janela.limiteSetor(0), null);
  assert.equal(janela.apagarLimite(0).ok, false, 'retirou o que já não havia');
});

/* ---- a geometria ---- */

function comDoisLimites() {
  comSetores(2);
  [[0, ALFA], [1, BRAVO]].forEach(([i, anel]) => {
    janela.iniciarTraco(i, 'limite');
    anel.slice(0, 4).forEach(([lo, la]) => janela.pontoDoTraco(la, lo));
    janela.fecharTraco();
  });
}

test('cada ponto cai no setor a que pertence, e só nesse', semAplicacao, () => {
  comDoisLimites();
  assert.equal(janela.setorDoPonto(41.095, -7.815), 0, 'devia cair no Alfa');
  assert.equal(janela.setorDoPonto(41.095, -7.805), 1, 'devia cair no Bravo');
  assert.equal(janela.setorDoPonto(41.20, -7.50), -1, 'caiu num setor e está longe dos dois');
});

test('a área somada é a dos dois, e não a de um contado duas vezes', semAplicacao, () => {
  comDoisLimites();
  const a = janela.areaSetorHa(0), b = janela.areaSetorHa(1);
  assert.ok(a > 0 && b > 0);
  assert.equal(janela.areaSetorizadaHa(), a + b);
});

test('o centróide de um quadrado é o seu centro', semAplicacao, () => {
  /* A tolerância é de 1e-7 de grau, cerca de um centímetro. A fórmula do centróide soma
     produtos de coordenadas inteiras de grau e divide pela área, que aqui é dez mil vezes
     menor: perde-se precisão na subtração, e exigir 1e-9 seria exigir do vírgula flutuante
     o que ele não dá. Um centímetro é muito abaixo do erro de quem traça o limite. */
  const c = janela.centroAnel(daqui(ALFA));
  assert.ok(Math.abs(c.lon - (-7.815)) < 1e-7, 'lon ' + c.lon);
  assert.ok(Math.abs(c.lat - 41.095) < 1e-7, 'lat ' + c.lat);
});

test('um anel degenerado não divide por zero', semAplicacao, () => {
  /* Três vértices em linha têm área nula, e a fórmula do centróide divide pela área.
     Aí serve a média, que é o melhor que há. */
  const c = janela.centroAnel([[-7.8, 41.0], [-7.7, 41.0], [-7.6, 41.0], [-7.8, 41.0]]);
  assert.ok(isFinite(c.lat) && isFinite(c.lon), JSON.stringify(c));
  assert.ok(Math.abs(c.lat - 41.0) < 1e-9);
});

/* ---- o que o limite muda no resto ---- */

test('marcar um ponto diz em que setor caiu', semAplicacao, () => {
  comDoisLimites();
  const r = janela.marcarPonto('agua', 41.095, -7.805, 'charca');
  assert.ok(r.ok, r.motivo);
  assert.equal(r.ponto.setor, 'Bravo');
  const O = avaliar(janela, 'O');
  assert.ok(O.evolucao.some((x) => /no setor Bravo/.test(x.txt)), 'a evolução devia dizê-lo');
});

test('sem limites traçados não se inventa setor nenhum', semAplicacao, () => {
  /* Dizer «setor desconhecido» daria a entender que havia setores e o ponto não caiu em
     nenhum. Não havia. */
  comSetores(2);
  const r = janela.marcarPonto('agua', 41.095, -7.805, 'charca');
  assert.equal(r.ponto.setor, '');
  const O = avaliar(janela, 'O');
  assert.ok(!O.evolucao.some((x) => /setor/i.test(x.txt) && /marcado no mapa/.test(x.txt)));
});

test('com o registo encerrado não se traça nem se apaga', semAplicacao, () => {
  comDoisLimites();
  const O = avaliar(janela, 'O');
  O.encerramento.g = '311200AGO26'; O.encerramento.por = 'Cmdt A';
  janela.iniciarTraco(0, 'limite');
  ALFA.slice(0, 4).forEach(([lo, la]) => janela.pontoDoTraco(la, lo));
  assert.equal(janela.fecharTraco().ok, false);
  assert.equal(janela.apagarLimite(1).ok, false);
  O.encerramento.g = ''; O.encerramento.por = '';
});

/* ---- o estado gravado ---- */

test('uma ocorrência da versão 17 abre com os setores sem limite', semAplicacao, () => {
  const m = janela.migrarGravado({
    versao: 17, meta: { num: '2026/900' }, pco: { funcoes: [] },
    dados: { est: { n: 2, setores: [{ estado: 'Em curso (ativo)', cmd: 'Cmdt B' }, {}] } },
  });
  assert.equal(m.versao, avaliar(janela, 'VERSAO_ESTADO'));
  m.dados.est.setores.forEach((s) => assert.deepEqual(daqui(s.limite), []));
  assert.equal(m.dados.est.setores[0].cmd, 'Cmdt B', 'a migração não pode perder o que lá estava');
});

test('o limite viaja na exportação da ocorrência', semAplicacao, () => {
  comDoisLimites();
  const txt = janela.exportarOcorrencia();
  const v = JSON.parse(typeof txt === 'string' ? txt : JSON.stringify(txt));
  const est = (v.estado || v).dados.est;
  assert.equal(est.setores[0].limite.length, 5);
  assert.deepEqual(est.setores[0].limite[0], est.setores[0].limite[4]);
});
