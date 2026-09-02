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

/* ---- os números do ramo #001, verificados contra o PROJ 3.7.2 ---- */

/* Uma folha 1:25 000 do Douro, com dois pontos reconhecíveis e o pixel onde caem. Os E/N
   e os lat/lon vieram do PROJ 3.7.2, entregues pelo ramo #001 a 2 de setembro num guião
   independente do que guiou esta implementação. **Duas especificações escritas em separado
   concordam sobre estes números**, e é isso que lhes dá o valor: nenhum saiu daqui. */
const DOURO = {
  c1: { px: 240, py: 1580, E: 28889.2955, N: 165859.4864 },   /* 41,1614 N · 7,7889 W */
  c2: { px: 2180, py: 760, E: 55189.0477, N: 178716.7074 },   /* 41,2758 N · 7,4744 W */
  mpp: 13.899234,                                             /* 29 274,3079 m / 2106,1814 px */
  ensaio: { px: 1210, py: 1170, E: 42039.1716, N: 172288.0969 },
  canto: { px: 0, py: 0, E: 24355.6029, N: 187604.5913 },
};

const folhaDouro = () => {
  const w = janela.calibrarPorDoisPontos(DOURO.c1, DOURO.c2);
  return janela.folhaCalibrada({ id: 'douro', nome: 'CMP 1:25 000, folha 116', largura: 2500,
    altura: 2000, mundo: w, grelha: 'pttm06', proveniencia: 'ensaio do ramo #001',
    pontos: 2, controlos: [DOURO.c1, DOURO.c2] });
};

test('os dois pontos do Douro recolocam-se sobre si próprios, ao centímetro', semAplicacao, () => {
  const f = folhaDouro();
  [DOURO.c1, DOURO.c2].forEach((c) => {
    const m = f.paraMundo(c.px, c.py);
    assert.ok(Math.abs(m.E - c.E) < 0.01 && Math.abs(m.N - c.N) < 0.01,
      'controlo (' + c.px + ',' + c.py + ') caiu em ' + m.E.toFixed(4) + ', ' + m.N.toFixed(4));
  });
});

test('um ponto entre os controlos cai onde o PROJ o põe', semAplicacao, () => {
  const m = folhaDouro().paraMundo(DOURO.ensaio.px, DOURO.ensaio.py);
  assert.ok(Math.abs(m.E - DOURO.ensaio.E) < 0.01, 'Este: ' + m.E);
  assert.ok(Math.abs(m.N - DOURO.ensaio.N) < 0.01, 'Norte: ' + m.N);
});

test('o canto da folha, que extrapola para fora do segmento, também', semAplicacao, () => {
  /* É onde uma semelhança mal ajustada se afasta primeiro: entre os dois controlos, um
     erro de rotação quase não se vê; fora deles, cresce com a distância. */
  const m = folhaDouro().paraMundo(DOURO.canto.px, DOURO.canto.py);
  assert.ok(Math.abs(m.E - DOURO.canto.E) < 0.01, 'Este: ' + m.E);
  assert.ok(Math.abs(m.N - DOURO.canto.N) < 0.01, 'Norte: ' + m.N);
});

test('pixéis igualmente espaçados dão pontos igualmente espaçados', semAplicacao, () => {
  /* Uma semelhança é linear. Troços desiguais denunciariam uma transformação com mais
     graus de liberdade — uma afim de três pontos, ou uma projetiva — e a folha deixaria de
     ter escala única, que é a propriedade de que depende medir por cima dela. */
  const f = folhaDouro();
  const P = [0, 500, 1000, 1500].map((px) => f.paraMundo(px, 900));
  const d = [];
  for (let i = 1; i < P.length; i++) d.push(Math.hypot(P[i].E - P[i - 1].E, P[i].N - P[i - 1].N));
  d.forEach((v, i) => assert.ok(Math.abs(v - d[0]) < 0.01, 'troço ' + (i + 1) + ': ' + v));
  assert.ok(Math.abs(d[0] - 500 * DOURO.mpp) < 0.05, '500 px a ' + DOURO.mpp + ' m/px: ' + d[0]);
});

/* ---- a aferição ---- */

test('a aferição do Douro dá 13,899234 m/px', semAplicacao, () => {
  assert.ok(Math.abs(janela.folhaAfericao(folhaDouro()).mpp - DOURO.mpp) < 1e-5);
});

test('a rotação não toca na escala: uma semelhança é isotrópica', semAplicacao, () => {
  /* Rotação de 90° a 2 m/px. Se a escala mexesse com a rotação, entrara anisotropia e a
     folha teria escalas diferentes nos dois eixos. */
  const w = janela.calibrarPorDoisPontos({ px: 0, py: 0, E: 0, N: 0 }, { px: 50, py: 0, E: 0, N: 100 });
  const f = janela.folhaCalibrada(desc({ mundo: w }));
  assert.ok(Math.abs(janela.folhaAfericao(f).mpp - 2) < 1e-6);
});

test('não haver aferição distingue-se de haver uma má', semAplicacao, () => {
  /* Devolver 0, ou NaN, punha no ecrã uma escala que ninguém pode ler. É `null`, e o
     chamador tem de tratar a ausência. Apontado pelo ramo #001. */
  assert.equal(janela.folhaAfericao(null), null);
  assert.equal(janela.folhaAfericao({ nome: 'sem coeficientes' }), null);
  assert.equal(janela.folhaAfericao({ mundo: { A: 2.5, D: 2.5, B: 2.5, E: 2.5, C: 0, F: 0 } }), null,
    'determinante nulo não tem escala');
});

test('sem pontos de controlo há escala e não há confronto', semAplicacao, () => {
  /* Uma folha vinda de ficheiro de referenciação não traz pontos. Tem `mpp` e não tem com
     que o comparar — e diz isso, em vez de inventar um desvio de zero. */
  const a = janela.folhaAfericao(janela.folhaCalibrada(desc()));
  assert.equal(a.mpp, 2.5);
  assert.equal(a.esferico, null);
  assert.equal(a.desvio, null);
  assert.equal(a.suspeita, false);
});

test('a aferição do Douro acorda com a distância esférica a menos de meio por cento', semAplicacao, () => {
  /* `distanciaM` é esférica com R = 6 371 008,8 m e a aferição é plana em PT-TM06: não têm
     de coincidir, têm de não divergir. A divergência que a geometria explica nesta folha é
     de 0,19 %. */
  const a = janela.folhaAfericao(folhaDouro());
  assert.ok(a.desvio < 0.005, 'divergência de ' + (a.desvio * 100).toFixed(4) + ' %');
  assert.equal(a.suspeita, false);
});

test('a aferição NÃO deteta uma coordenada mal escrita, e isso fica provado', semAplicacao, () => {
  /* Este teste existe para impedir que alguém volte a anunciar esta conta como uma
     verificação das coordenadas escritas à mão. Numa folha fixada por dois pontos, a escala
     é *definida* por esses dois pontos: `mpp·dpx` é identicamente a distância entre eles.
     O que sobra é a diferença entre o plano e a esfera, e essa quase não mexe com o erro.

     Um erro de 40 km no Este de um controlo — um dígito trocado à escala de um distrito —
     leva o desvio de 0,19 % a 0,25 %, e passa. A primeira versão desta asserção esperava
     que disparasse, e foi ela que denunciou a afirmação falsa. */
  const mau = { px: 2180, py: 760, E: DOURO.c2.E + 40000, N: DOURO.c2.N };
  const w = janela.calibrarPorDoisPontos(DOURO.c1, mau);
  const f = janela.folhaCalibrada(desc({ mundo: w, controlos: [DOURO.c1, mau] }));
  const a = janela.folhaAfericao(f);
  assert.ok(a.mpp > 30, 'a escala disparou para ' + a.mpp.toFixed(2) + ' m/px, como devia');
  assert.ok(a.desvio < 0.005, 'e mesmo assim o desvio é de ' + (a.desvio * 100).toFixed(2) + ' %');
  assert.equal(a.suspeita, false, 'a conta não vê o erro, e o código não pode afirmar que vê');
});

test('o que a aferição deteta é a fundação partida', semAplicacao, () => {
  /* Se o plano e a esfera deixarem de concordar, é porque uma das duas aritméticas se
     partiu. É esse o alarme, e é o único que esta conta pode dar. Simulado a pôr uma escala
     que não vem dos controlos: uma folha colocada por ficheiro de referenciação a quem se
     acrescentam controlos que dizem outra coisa. */
  const w = { A: 25, D: 0, B: 0, E: -25, C: 0, F: 0 };
  const f = janela.folhaCalibrada(desc({ mundo: w, controlos: [DOURO.c1, DOURO.c2] }));
  const a = janela.folhaAfericao(f);
  assert.equal(a.suspeita, true, 'desvio de ' + (a.desvio * 100).toFixed(1) + ' %');
});
