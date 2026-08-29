// Comportamento do fogo — composição vetorial de declive e vento.
// Viegas (2004), IJWF 13, 143-156, equações 4 e 5. Ver docs/FONTES.md, chave FOGO.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const perto = (a, b, tol = 0.01) => Math.abs(a - b) < tol;

test('a exposição da encosta é o sentido descendente; a subida é a oposta', semAplicacao, () => {
  // Encosta exposta a sul sobe para norte. Vento de norte empurra para sul.
  const g = janela.betaFogo('S', 0);
  assert.equal(g.subida, 0, 'a encosta sobe para N');
  assert.equal(g.empurra, 180, 'vento de N empurra para S');
  assert.equal(g.beta, 180, 'declive e vento em oposição direta');
});

test('vento a subir a encosta dá ângulo nulo', semAplicacao, () => {
  // Encosta exposta a sul (sobe para N) com vento de sul (empurra para N).
  const g = janela.betaFogo('S', 180);
  assert.equal(g.beta, 0);
});

test('β fica sempre entre zero e 180 graus', semAplicacao, () => {
  for (const orient of ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']) {
    for (let wd = 0; wd < 360; wd += 15) {
      const g = janela.betaFogo(orient, wd);
      assert.ok(g.beta >= 0 && g.beta <= 180, `${orient}/${wd} deu ${g.beta}`);
    }
  }
});

test('sem exposição conhecida não há composição', semAplicacao, () => {
  assert.equal(janela.betaFogo('planalto', 90), null);
  assert.equal(janela.betaFogo('', 90), null);
  assert.equal(janela.betaFogo('N', NaN), null);
});

test('com ε igual a 1 o desvio é metade do ângulo — resultado fechado do artigo', semAplicacao, () => {
  for (const beta of [0, 30, 60, 90, 120, 150, 180]) {
    assert.ok(perto(janela.deflexaoFogo(1, beta), beta / 2, 0.001), `β=${beta}`);
  }
});

test('sem declive a compor, a frente segue o vento', semAplicacao, () => {
  // ε = 0: não há propagação induzida pelo declive; o desvio é o próprio β e ξ é 1.
  assert.ok(perto(janela.deflexaoFogo(0, 70), 70));
  assert.ok(perto(janela.razaoFogo(0, 70), 1));
});

test('com vento e declive alinhados as velocidades somam-se', semAplicacao, () => {
  // β = 0: ξ = ε + 1, e não há desvio.
  assert.ok(perto(janela.razaoFogo(3, 0), 4));
  assert.ok(perto(janela.deflexaoFogo(3, 0), 0));
});

test('em oposição direta a frente resulta da diferença', semAplicacao, () => {
  // β = 180: ξ = |ε - 1|.
  assert.ok(perto(janela.razaoFogo(3, 180), 2));
  assert.ok(perto(janela.razaoFogo(0.4, 180), 0.6));
});

test('as equações 4 e 5 batem certo entre si', semAplicacao, () => {
  // ξ² = (ε + cos β)² + sen² β, e tan δ = sen β / (ε + cos β).
  for (const eps of [0.25, 0.57, 1, 2, 4.1]) {
    for (const beta of [15, 45, 90, 135, 170]) {
      const b = (beta * Math.PI) / 180;
      assert.ok(perto(janela.razaoFogo(eps, beta) ** 2, (eps + Math.cos(b)) ** 2 + Math.sin(b) ** 2, 1e-9));
      const d = (janela.deflexaoFogo(eps, beta) * Math.PI) / 180;
      assert.ok(perto(Math.tan(d), Math.sin(b) / (eps + Math.cos(b)), 1e-9), `ε=${eps} β=${beta}`);
    }
  }
});

test('a cabeça desvia-se para o lado do vento', semAplicacao, () => {
  // Encosta exposta a S (sobe para N=0°), vento de SO (225°) empurra para NE (45°).
  const c = janela.comportamentoFogo({ orient: 'S', rumoVento: 225, eps: 1 });
  assert.equal(c.beta, 45);
  assert.ok(perto(c.delta, 22.5, 0.001), 'com ε=1 o desvio é metade');
  assert.ok(perto(c.cabeca, 22.5, 0.001), 'a cabeça fica entre a subida e o vento');
});

test('sem ε informado não se inventa desvio nem velocidade', semAplicacao, () => {
  const c = janela.comportamentoFogo({ orient: 'S', rumoVento: 225 });
  assert.equal(c.delta, null);
  assert.equal(c.xi, null);
  assert.equal(c.cabeca, null);
  assert.equal(c.deltaSeIguais, 22.5, 'mas dá o caso de igual peso, que o artigo fecha');
});

test('a leitura diz de onde vem cada número e o que o modelo não dá', semAplicacao, () => {
  const t = janela.leituraComportamentoFogo({ orient: 'S', rumoVento: 225, eps: 1 });
  assert.match(t, /ângulo de 45°/);
  assert.match(t, /desvia-se 23°|desvia-se 22°/);
  assert.match(t, /Viegas \(2004\), equações 4 e 5/);
  assert.match(t, /não dá velocidade absoluta/);
});

test('a leitura distingue reforço, cruzamento e oposição', semAplicacao, () => {
  const com = (wd) => janela.leituraComportamentoFogo({ orient: 'S', rumoVento: wd });
  assert.match(com(180), /Reforçam-se/);
  assert.match(com(270), /Cruzam-se/);
  assert.match(com(0), /Opõem-se/);
});

/* ---- área do perímetro ---- */

// Um quadrado de 0,01° de lado à latitude 41 N: ~1113 m × ~840 m ≈ 93,5 ha. Serve de
// unidade de medida para os casos compostos abaixo.
const quadrado = (lat, lon, d = 0.01) => [[
  [lon, lat], [lon + d, lat], [lon + d, lat + d], [lon, lat + d], [lon, lat],
]];

test('a área soma as manchas separadas em vez de ficar pela maior', semAplicacao, () => {
  // Um incêndio parte-se em manchas. Até à r0052 a área era a do maior anel, e as
  // outras manchas simplesmente não contavam.
  const uma = janela.areaGeoJSON({ type: 'Polygon', coordinates: quadrado(41, -7.5) });
  assert.ok(uma > 80 && uma < 110, 'quadrado de referência: ' + uma + ' ha');

  const duas = janela.areaGeoJSON({
    type: 'MultiPolygon',
    coordinates: [quadrado(41, -7.5), quadrado(41, -7.4)],
  });
  // o arredondamento é ao hectare, por isso compara-se com essa tolerância
  assert.ok(Math.abs(duas - uma * 2) <= 1, `${duas} ha não é o dobro de ${uma} ha`);
});

test('a área desconta as ilhas por arder dentro do perímetro', semAplicacao, () => {
  const lat = 41, lon = -7.5;
  const cheio = janela.areaGeoJSON({ type: 'Polygon', coordinates: quadrado(lat, lon) });
  const ilha = quadrado(lat + 0.002, lon + 0.002, 0.005)[0];
  const comIlha = janela.areaGeoJSON({
    type: 'Polygon', coordinates: [quadrado(lat, lon)[0], ilha],
  });
  assert.ok(comIlha < cheio, 'a ilha não foi descontada');
  // a ilha é metade do lado, portanto um quarto da área
  assert.ok(Math.abs(comIlha - cheio * 0.75) <= 1, `${comIlha} ha contra ${cheio} ha`);
});

test('a área percorre coleções e geometrias soltas sem se enganar', semAplicacao, () => {
  const um = janela.areaGeoJSON({ type: 'Polygon', coordinates: quadrado(41, -7.5) });
  const colecao = janela.areaGeoJSON({
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Polygon', coordinates: quadrado(41, -7.5) } },
      { type: 'Feature', geometry: { type: 'GeometryCollection', geometries: [
        { type: 'Polygon', coordinates: quadrado(41, -7.4) },
      ] } },
      { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-7.5, 41], [-7.4, 41]] } },
      { type: 'Feature', geometry: null },
    ],
  });
  assert.ok(Math.abs(colecao - um * 2) <= 1, 'linhas e geometrias vazias não são área');
  assert.equal(janela.areaGeoJSON(null), 0);
  assert.equal(janela.areaGeoJSON({ type: 'Polygon', coordinates: [[[-7.5, 41], [-7.4, 41]]] }), 0,
    'um anel com dois pontos não fecha polígono nenhum');
});
