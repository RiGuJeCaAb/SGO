// O croqui do teatro de operações e os cartões dobráveis — o desenho que fica quando
// não há rede, e os dois cartões que cresciam sem limite.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));

/** Um quadrado de lado aproximado `ladoM`, centrado em (41,-7,7). */
function quadrado(ladoM = 1000, vertices = 4) {
  const lat = 41, lon = -7.7;
  const dLat = ladoM / 2 / 111320, dLon = ladoM / 2 / (111320 * Math.cos((lat * Math.PI) / 180));
  const cantos = [[lon - dLon, lat - dLat], [lon + dLon, lat - dLat],
    [lon + dLon, lat + dLat], [lon - dLon, lat + dLat]];
  /* densifica o anel, para haver o que simplificar */
  const anel = [];
  for (let i = 0; i < 4; i++) {
    const a = cantos[i], b = cantos[(i + 1) % 4];
    for (let k = 0; k < vertices; k++)
      anel.push([a[0] + ((b[0] - a[0]) * k) / vertices, a[1] + ((b[1] - a[1]) * k) / vertices]);
  }
  anel.push(anel[0]);
  return { type: 'Polygon', coordinates: [anel] };
}

function comPerimetro(gj = quadrado(), nome = 'perimetro.geojson') {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41'; O.meta.lon = '-7,7';
  janela.guardarPerimetro(gj, nome);
  return O;
}

/* ---- a geometria que fica gravada ---- */

test('o perímetro fica gravado, e não só a área', semAplicacao, () => {
  const O = comPerimetro();
  const P = janela.perimObj();
  assert.ok(P, 'a geometria devia ficar em O.dados.perim');
  assert.equal(P.nome, 'perimetro.geojson');
  assert.equal(P.aneis.length, 1);
  assert.equal(P.bbox.length, 4);
  assert.ok(P.g, 'sem GDH de carregamento');
  assert.equal(P, O.dados.perim, 'perimObj devia devolver o ramo gravado, e não uma cópia');
});

test('um anel de milhares de vértices é simplificado antes de ser gravado', semAplicacao, () => {
  comPerimetro(quadrado(4000, 400));
  const P = janela.perimObj();
  assert.ok(P.verticesOriginais > 1000, 'a fixture devia trazer muitos vértices');
  assert.ok(P.vertices < P.verticesOriginais / 10,
    `simplificou pouco: ${P.vertices} de ${P.verticesOriginais}`);
  assert.equal(P.toleranciaM, 15);
});

test('a simplificação não corta um anel que já é mínimo', semAplicacao, () => {
  const anel = [[-7.7, 41], [-7.69, 41], [-7.69, 41.01], [-7.7, 41.01], [-7.7, 41]];
  assert.equal(janela.simplificarAnel(anel, 15, 41).length, anel.length);
});

test('a simplificação nunca devolve menos de quatro pontos', semAplicacao, () => {
  /* um anel quase degenerado: com tolerância enorme, o Douglas-Peucker deixaria dois */
  const anel = [[-7.7, 41], [-7.6999, 41], [-7.6999, 41.0001], [-7.7, 41.0001], [-7.7, 41]];
  assert.ok(janela.simplificarAnel(anel, 100000, 41).length >= 4);
});

test('lê o polígono venha ele em Feature, FeatureCollection ou geometria solta', semAplicacao, () => {
  const g = quadrado();
  const formas = [g, { type: 'Feature', geometry: g },
    { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: g }] },
    { type: 'GeometryCollection', geometries: [g] },
    { type: 'MultiPolygon', coordinates: [g.coordinates] }];
  formas.forEach((f, i) => assert.equal(janela.aneisDeGeoJSON(f).length, 1, 'forma ' + i));
});

test('um GeoJSON sem polígono não grava nada', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  assert.equal(janela.guardarPerimetro({ type: 'Point', coordinates: [-7.7, 41] }, 'x'), null);
  assert.equal(avaliar(janela, 'O').dados.perim, null);
});

/* ---- o desenho ---- */

test('sem perímetro e sem deteção não se desenha caixa nenhuma', semAplicacao, () => {
  janela.eval('O = novoEstado(); O.meta.lat="41"; O.meta.lon="-7,7"');
  assert.equal(janela.croquiSVG(640, 400), '', 'um triângulo sozinho não é um croqui');
});

test('com perímetro sai SVG, com escala, norte e o ponto do PCO', semAplicacao, () => {
  comPerimetro();
  const svg = janela.croquiSVG(640, 400);
  assert.match(svg, /^<svg /);
  assert.match(svg, /viewBox="0 0 640 \d+"/);
  assert.match(svg, /<path d="M[\d.,\sLZ-]+"/, 'sem traçado do perímetro');
  assert.ok(svg.includes('>PCO<'), 'sem marca do posto de comando');
  assert.ok(svg.includes('>N<'), 'sem rosa dos ventos');
  assert.match(svg, />(\d+ m|[\d.]+ km)</, 'sem barra de escala rotulada');
});

test('o nome de um aglomerado não escapa do SVG', semAplicacao, () => {
  comPerimetro();
  avaliar(janela, 'O').dados.sensDet = { origem: 'teste', g: '301200AGO26', raioKm: 3,
    itens: [{ nome: '</text><script>x</script>', tipo: 'aldeia', dist: 1, rumo: 'N', sens: false }] };
  const svg = janela.croquiSVG(640, 400);
  assert.ok(!svg.includes('<script>'), 'texto do OSM entrou como marcação');
  assert.ok(svg.includes('&lt;/text&gt;'));
});

test('um perímetro minúsculo não faz a escala rebentar', semAplicacao, () => {
  comPerimetro(quadrado(20));
  const svg = janela.croquiSVG(640, 400);
  const barra = /x2="([\d.]+)"/.exec(svg);
  assert.ok(barra, 'sem barra de escala');
  assert.ok(Number(barra[1]) <= 640, 'a barra saiu para fora do desenho: ' + barra[1]);
});

test('a escala redonda cabe sempre em menos de um terço da largura', semAplicacao, () => {
  [0.1, 1, 5, 40, 500, 20000].forEach((mpp) => {
    const E = janela.escalaRedonda(mpp, 640);
    assert.ok(E.px <= 640 / 3 + 0.001, `mpp ${mpp} deu ${E.px} px`);
    assert.match(E.rot, /^\d+(\.\d+)? (m|km)$/);
  });
});

test('a projeção e o seu inverso dão a volta completa', semAplicacao, () => {
  comPerimetro(quadrado(4000));
  const Q = janela.enquadrarCroqui(640, 400);
  const lat = 41.005, lon = -7.695;
  assert.ok(Math.abs(Q.latDe(Q.Y(lat)) - lat) < 1e-9, 'latitude não deu a volta');
  assert.ok(Math.abs(Q.lonDe(Q.X(lon)) - lon) < 1e-9, 'longitude não deu a volta');
});

test('o rumo cardinal recoloca o ponto na direção certa', semAplicacao, () => {
  const norte = janela.pontoPorRumo(41, -7.7, 1, 'N');
  assert.ok(norte.lat > 41 && Math.abs(norte.lon + 7.7) < 1e-9);
  const este = janela.pontoPorRumo(41, -7.7, 1, 'E');
  assert.ok(este.lon > -7.7 && Math.abs(este.lat - 41) < 1e-9);
  assert.equal(janela.pontoPorRumo(41, -7.7, 1, 'XPTO'), null, 'rumo inventado devia recusar');
});

test('a legenda diz de onde veio o desenho e que não é uma carta', semAplicacao, () => {
  comPerimetro();
  const L = janela.croquiLegenda();
  assert.ok(L.some((t) => t.includes('perimetro.geojson')));
  assert.ok(L.some((t) => /não substitui a carta militar/.test(t)));
});

/* ---- os cartões dobráveis ---- */

const cartao = (h) => janela.cartaoPorTitulo(h);

test('os dois cartões que crescem sem limite estão declarados, com norma e razão', semAplicacao, () => {
  const D = avaliar(janela, 'CARTOES_DOBRAVEIS');
  assert.deepEqual(daqui(D.map((x) => x.h)), ['Fita do tempo', 'Linha de evolução']);
  D.forEach((x) => {
    assert.equal(x.celula, 'operacoes', x.h);
    assert.match(x.r, /art\./, x.h + ' sem citação');
    assert.ok(x.porque && x.porque.length > 20, x.h + ' sem razão declarada');
  });
});

test('a auditoria dos dobráveis não acusa nada', semAplicacao, () => {
  const a = janela.auditarDobraveis();
  assert.deepEqual(daqui(a.semCartao), []);
  assert.deepEqual(daqui(a.semDobrar), []);
  assert.deepEqual(daqui(a.semRazao), []);
});

test('os dois nascem fechados, com o corpo lá dentro', semAplicacao, () => {
  ['Fita do tempo', 'Linha de evolução'].forEach((h) => {
    const c = cartao(h);
    assert.ok(c.classList.contains('dobravel'), h + ' não dobrou');
    assert.ok(!c.classList.contains('aberto'), h + ' nasceu aberto');
    assert.equal(c.querySelector('h2').getAttribute('aria-expanded'), 'false', h);
    const corpo = c.querySelector(':scope > .cd-corpo');
    assert.ok(corpo && corpo.children.length >= 1, h + ' com corpo vazio');
  });
});

test('fechado, o cabeçalho diz quantos registos há — e no singular quando é um', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.fita = [{ g: '301200AGO26', e: 'a' }, { g: '301201AGO26', e: 'b' }];
  O.evolucao = [{ g: '301200AGO26', tipo: 'posit', txt: 'x' }];
  janela.pintarTudo();
  assert.equal(cartao('Fita do tempo').querySelector('.cd-cnt').textContent, '2 registos');
  assert.equal(cartao('Linha de evolução').querySelector('.cd-cnt').textContent, '1 registo');
});

test('sem registos di-lo, em vez de mentir com um zero — nos dois', semAplicacao, () => {
  const O = avaliar(janela, 'O');
  O.fita = []; O.evolucao = [];
  janela.pintarTudo();
  assert.equal(cartao('Fita do tempo').querySelector('.cd-cnt').textContent, 'sem registos');
  assert.equal(cartao('Linha de evolução').querySelector('.cd-cnt').textContent, 'sem registos');
});

test('em ecrã estreito a contagem não é escondida com a etiqueta legal', semAplicacao, () => {
  /* A regra que esconde `.tag` no cabeçalho estreito apanhava também a contagem
     reaproveitada da evolução, que continua a ser uma `.tag`. */
  const css = janela.document.querySelector('style').textContent;
  assert.match(css, /h2\.cd-cab \.tag:not\(\.cd-cnt\)\{display:none\}/,
    'a regra do cabeçalho estreito devia poupar a contagem');
});

test('cada cabeçalho tem uma contagem só', semAplicacao, () => {
  ['Fita do tempo', 'Linha de evolução'].forEach((h) => {
    assert.equal(cartao(h).querySelectorAll(':scope > h2 > .cd-cnt').length, 1, h);
  });
});

test('o cabeçalho abre e fecha, ao rato e ao teclado', semAplicacao, () => {
  const c = cartao('Fita do tempo'), h2 = c.querySelector('h2');
  assert.equal(h2.getAttribute('role'), 'button');
  assert.equal(h2.getAttribute('tabindex'), '0');
  h2.dispatchEvent(new janela.MouseEvent('click', { bubbles: true }));
  assert.ok(c.classList.contains('aberto'), 'o clique não abriu');
  h2.dispatchEvent(new janela.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.ok(!c.classList.contains('aberto'), 'o Enter não fechou');
  assert.equal(h2.getAttribute('aria-expanded'), 'false');
});

test('abrir um não fecha o outro', semAplicacao, () => {
  const f = cartao('Fita do tempo'), e = cartao('Linha de evolução');
  janela.abrirCartao(f, true); janela.abrirCartao(e, true);
  assert.ok(f.classList.contains('aberto') && e.classList.contains('aberto'),
    'acordeão exclusivo obrigaria a fechar a fita para ver a evolução');
  janela.abrirCartao(f, false); janela.abrirCartao(e, false);
});

test('dobrar duas vezes não duplica o corpo nem a contagem', semAplicacao, () => {
  janela.dobrarCartoes(); janela.dobrarCartoes();
  const c = cartao('Fita do tempo');
  assert.equal(c.querySelectorAll(':scope > .cd-corpo').length, 1);
  assert.equal(c.querySelectorAll(':scope > h2 > .cd-cnt').length, 1);
});

test('os dobráveis continuam em Operações e a arrumação sem órfãos', semAplicacao, () => {
  ['Fita do tempo', 'Linha de evolução'].forEach((h) =>
    assert.ok(cartao(h).closest('#p-operacoes'), h + ' saiu de Operações'));
  const a = janela.auditarArrumacao();
  assert.deepEqual(daqui(a.semCelula), []);
  assert.deepEqual(daqui(a.semCartao), []);
});
