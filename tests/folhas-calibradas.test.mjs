// Folhas de carta calibradas: uma imagem colocada no terreno.
//
// A absorção do trabalho da linhagem paralela, guiada pelas 53 asserções do `t0001` do
// ramo #002 — e não traduzida do remendo, que foi a decisão de 2 de setembro depois de
// três traduções terem produzido três defeitos. O guião do ramo fica em
// `ferramentas/historico/` e continua a correr de fora contra a entrega.
//
// Estes testes cobrem o que o guião não podia cobrir: **o desenho**. As 53 asserções
// verificam a transformação folha → terreno; nenhuma verifica terreno → ecrã, que é onde
// a folha pode acabar no sítio errado depois de estar bem calibrada.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/* Folha de ensaio: 4000×3000 px a 2,5 m/px, canto superior esquerdo no Douro. É a mesma
   do `t0001`, para que os dois falem dos mesmos números. */
const MUNDO = { A: 2.5, D: 0, B: 0, E: -2.5, C: 30000, F: 185000 };
const desc = (extra) => Object.assign({
  id: 'ensaio', nome: 'folha de ensaio', largura: 4000, altura: 3000,
  mundo: MUNDO, grelha: 'pttm06', proveniencia: 'ensaio do projeto', pontos: 0,
}, extra || {});

/* ---- a colocação ---- */

test('a vírgula decimal no ficheiro de referenciação é recusada, não interpretada', semAplicacao, () => {
  /* `Number("2,5")` é NaN mas `parseFloat("2,5")` é 2, e uma folha a 2 m/px em vez de 2,5
     fica 20 % fora de escala — erro que só aparece depois de alguém medir uma distância
     de segurança por cima dela. */
  assert.equal(janela.lerFicheiroReferenciacao('2,5\n0\n0\n-2,5\n30000\n185000'), null);
  assert.ok(janela.lerFicheiroReferenciacao('2.5\n0\n0\n-2.5\n30000\n185000'));
});

test('dois pontos dão semelhança, e a semelhança inverte o eixo vertical', semAplicacao, () => {
  const w = janela.calibrarPorDoisPontos(
    { px: 100, py: 100, E: 30250, N: 184750 },
    { px: 3100, py: 2100, E: 37750, N: 179750 });
  assert.equal(w.A, 2.5);
  assert.equal(w.E, -2.5, 'py cresce para baixo e o Norte decresce');
  assert.equal(w.D, 0);
  assert.equal(w.B, 0);
  assert.equal(w.C, 30000);
  assert.equal(w.F, 185000);
});

test('com rotação, os dois pontos continuam a recolocar-se sobre si próprios', semAplicacao, () => {
  /* Uma folha fotografada de esguelha tem rotação, e é o caso que distingue uma semelhança
     de uma escala pura. Os pontos escolhidos ficam sobre uma diagonal rodada 30°. */
  const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
  const p1 = { px: 100, py: 100, E: 30000 + 2.5 * (c * 100 + s * 100), N: 185000 + 2.5 * (s * 100 - c * 100) };
  const p2 = { px: 3100, py: 2100, E: 30000 + 2.5 * (c * 3100 + s * 2100), N: 185000 + 2.5 * (s * 3100 - c * 2100) };
  const w = janela.calibrarPorDoisPontos(p1, p2);
  const f = janela.folhaCalibrada(desc({ mundo: w }));
  [p1, p2].forEach((p) => {
    const m = f.paraMundo(p.px, p.py);
    assert.ok(Math.abs(m.E - p.E) < 1e-6 && Math.abs(m.N - p.N) < 1e-6,
      'ponto (' + p.px + ',' + p.py + ') recolocado em ' + m.E + ',' + m.N);
  });
});

test('as quatro recusas dizem respeito a coisas que falhariam em silêncio', semAplicacao, () => {
  assert.equal(janela.folhaCalibrada(desc({ id: '' })), null, 'sem id a escrita na loja falha em silêncio');
  assert.equal(janela.folhaCalibrada(desc({ grelha: undefined })), null, 'os seis números não dizem em que projeção estão');
  assert.equal(janela.folhaCalibrada(desc({ proveniencia: '' })), null, 'uma imagem anónima a fazer de carta');
  assert.equal(janela.folhaCalibrada(desc({ mundo: { A: 2.5, D: 2.5, B: 2.5, E: 2.5, C: 0, F: 0 } })), null,
    'determinante nulo: paraPixel devolveria infinito em vez de erro');
});

test('fora do envelope do continente avisa, e não recusa', semAplicacao, () => {
  /* Pode ser dos Açores, da Madeira ou de Espanha. Recusar seria decidir por quem está no
     PCO que a folha está errada. */
  const f = janela.folhaCalibrada(desc({ mundo: Object.assign({}, MUNDO, { C: 900000, F: 900000 }) }));
  assert.ok(f, 'não pode recusar');
  assert.equal(f.foraDoEnvelope, true);
  assert.equal(janela.folhaCalibrada(desc()).foraDoEnvelope, false);
});

test('o aviso do envelope olha para os quatro cantos, não só para o de referência', semAplicacao, () => {
  /* Uma folha grande pode ter o canto dentro e o resto fora. Com 4000 px a 2,5 m/px são
     10 km de lado, e o canto a 160 000 m de Este põe o outro lado a 170 000. */
  const f = janela.folhaCalibrada(desc({ mundo: Object.assign({}, MUNDO, { C: 160000, F: 100000 }) }));
  assert.equal(f.foraDoEnvelope, true, 'o canto está dentro e a folha sai');
});

/* ---- o desenho, que o guião do ramo não cobre ---- */

/* A composição folha → terreno → grelha, tal como `camadaMapa` a monta para o SVG. É
   reproduzida aqui a partir da mesma superfície pública, e confrontada com o caminho
   longo — projetar o ponto e converter — que é lento mas indiscutível. */
function matrizDaFolha(f, z) {
  const m = f.mundo;
  const canto = janela.gMetros(m.C, m.F, z);
  const ppm = janela.gMetros(m.C + 1, m.F, z).x - canto.x;
  return { M: [m.A * ppm, -m.D * ppm, m.B * ppm, -m.E * ppm, canto.x, canto.y], ppm };
}

/* A tolerância mede-se **no terreno e não em pixéis**. Um pixel do nível 14 vale 15 cm e um
   do nível 4 vale 150 m, e a mesma tolerância em pixéis significaria coisas mil vezes
   diferentes conforme a ampliação. Um milímetro no terreno é folga para o ruído do vírgula
   flutuante e é fina de mais para esconder qualquer erro de composição, que se contaria em
   metros ou em quilómetros. */
function concordam(pela, pelo, ppm, onde) {
  const dm = Math.max(Math.abs(pela.x - pelo.x), Math.abs(pela.y - pelo.y)) / ppm;
  assert.ok(dm < 0.001, onde + ': ' + dm.toExponential(3) + ' m de divergência no terreno');
}

test('a matriz de desenho leva cada pixel da folha ao mesmo sítio que o caminho longo', semAplicacao, () => {
  /* É o teste que faltava. Uma folha bem calibrada pode ser desenhada no sítio errado se a
     composição com a grelha estiver mal montada, e nada em `folhaCalibrada` daria por isso. */
  const f = janela.folhaCalibrada(desc());
  const z = 12;
  const { M, ppm } = matrizDaFolha(f, z);
  [[0, 0], [1, 0], [0, 1], [2000, 1500], [3999, 2999]].forEach(([px, py]) => {
    const m = f.paraMundo(px, py);
    concordam({ x: M[0] * px + M[2] * py + M[4], y: M[1] * px + M[3] * py + M[5] },
      janela.gMetros(m.E, m.N, z), ppm, 'pixel (' + px + ',' + py + ')');
  });
});

test('uma folha rodada também é desenhada onde o caminho longo a põe', semAplicacao, () => {
  const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
  const f = janela.folhaCalibrada(desc({
    mundo: { A: 2.5 * c, D: 2.5 * s, B: 2.5 * s, E: -2.5 * c, C: 30000, F: 185000 } }));
  const z = 14, { M, ppm } = matrizDaFolha(f, z);
  [[0, 0], [1000, 800], [3999, 2999]].forEach(([px, py]) => {
    const m = f.paraMundo(px, py);
    concordam({ x: M[0] * px + M[2] * py + M[4], y: M[1] * px + M[3] * py + M[5] },
      janela.gMetros(m.E, m.N, z), ppm, 'pixel (' + px + ',' + py + ')');
  });
});

test('a grelha de Mercator mede em metros da sua própria projeção', semAplicacao, () => {
  /* A origem do quadrado é o canto noroeste do mundo, e não o meridiano de Greenwich: um
     erro de meia largura punha a folha no outro lado do Atlântico. */
  const G = avaliar(janela, 'GRELHAS');
  const meio = janela.eval('MERCATOR_MEIO');
  const centro = G.mercator.metros(0, 0, 0);
  assert.ok(Math.abs(centro.x - 128) < 1e-9, 'o meridiano zero cai a meio do nível 0');
  assert.ok(Math.abs(centro.y - 128) < 1e-9, 'o equador cai a meio do nível 0');
  assert.ok(Math.abs(G.mercator.metros(-meio, meio, 0).x) < 1e-9, 'o canto noroeste é a origem');
});

test('a grelha portuguesa mede a partir do canto que a DGT declara', semAplicacao, () => {
  const G = avaliar(janela, 'GRELHAS');
  const o = G.pttm06.metros(-170000, 290000, 0);
  assert.ok(Math.abs(o.x) < 1e-9 && Math.abs(o.y) < 1e-9, 'TopLeftCorner do conjunto PTTM_06');
});

/* ---- o que a folha diz de si, e onde isso aparece ---- */

test('a folha declara a grelha e recusa desenhar-se noutra', semAplicacao, () => {
  const f = janela.folhaCalibrada(desc({ grelha: 'mercator' }));
  assert.equal(f.compativel('mercator'), true);
  assert.equal(f.compativel('pttm06'), false);
});

test('o retrato do fogo nomeia cada folha, a sua proveniência e como foi fixada', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  janela.eval('FOLHAS = []');
  const antes = janela.retratoDoFogo().carta.folhas;
  assert.equal(antes.length, 0, 'sem folhas, uma lista vazia — não um ramo em falta');
  janela.eval('FOLHAS.push(folhaCalibrada({id:"x", nome:"folha 128", largura:10, altura:10,'
    + ' mundo:{A:2.5,D:0,B:0,E:-2.5,C:30000,F:185000}, grelha:"pttm06",'
    + ' proveniencia:"CIGeoE, digitalizada no PCO", pontos:2}))');
  const c = janela.retratoDoFogo().carta.folhas;
  assert.equal(c.length, 1);
  assert.equal(c[0].proveniencia, 'CIGeoE, digitalizada no PCO');
  assert.equal(c[0].pontos, 2);
  const texto = janela.resumoDoFogo(janela.retratoDoFogo());
  assert.match(texto, /folha 128/);
  assert.match(texto, /2 pontos de controlo/);
  assert.match(texto, /CIGeoE, digitalizada no PCO/);
  janela.eval('FOLHAS = []');
});

test('sem carta declarada, a grelha do mapa é a da folha colocada', semAplicacao, () => {
  janela.eval('O = novoEstado(); CARTA = null; CARTA_LOCAL = null; FOLHAS = []');
  assert.equal(janela.grelhaAtual().k, 'pttm06', 'sem nada, a portuguesa');
  janela.eval('FOLHAS.push(folhaCalibrada({id:"y", nome:"m", largura:10, altura:10,'
    + ' mundo:{A:1,D:0,B:0,E:-1,C:0,F:0}, grelha:"mercator", proveniencia:"ensaio", pontos:0}))');
  assert.equal(janela.grelhaAtual().k, 'mercator', 'a folha é a única projeção declarada que resta');
  janela.eval('FOLHAS = []');
});

/* ---- a loja ---- */

test('a loja das folhas entrou sem mexer nas que já existiam', semAplicacao, () => {
  /* A migração da base é aditiva: nenhuma pode apagar o diário, que só acrescenta. */
  const nomes = avaliar(janela, 'IDB_LOJAS').map((l) => l[0]);
  assert.equal(nomes.join(', '), 'chaves, diario, copias, mosaicos, folhas');
  const folhas = avaliar(janela, 'IDB_LOJAS').find((l) => l[0] === 'folhas');
  assert.equal(folhas[1].keyPath, 'id');
});

test('o que se grava é a colocação e não a imagem', semAplicacao, () => {
  /* Uma imagem de folha pesa megabytes. O pacote da ocorrência viaja por ficheiro de
     texto, e a imagem volta a escolher-se — a colocação é que não se pode perder. */
  const f = janela.folhaCalibrada(desc());
  f.img = 'data:image/png;base64,AAAA';
  const guardado = janela.colocacaoDaFolha(f);
  assert.equal(guardado.img, undefined);
  assert.equal(guardado.proveniencia, 'ensaio do projeto');
  assert.equal(JSON.stringify(guardado.mundo), JSON.stringify(MUNDO));
  /* E o que se relê reconstrói uma folha inteira, com métodos e tudo. */
  const volta = janela.folhaCalibrada(JSON.parse(JSON.stringify(guardado)));
  assert.equal(typeof volta.paraMundo, 'function');
  assert.equal(volta.paraMundo(0, 0).E, 30000);
});
