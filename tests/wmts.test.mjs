// Leitura de um serviço WMTS.
//
// O que se testa aqui é sobretudo o que me correu mal: o modelo `{z}/{x}/{y}` é uma
// convenção do OpenStreetMap, e a cartografia oficial publica WMTS — onde a linha vem
// antes da coluna, o nível não é um número e a projeção pode não ser Mercator. Cada uma
// destas três diferenças punha a carta no sítio errado, e as três têm teste.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));
const XML = await readFile(new URL('./fixtures/wmts-capacidades.xml', import.meta.url), 'utf8');
const cap = () => janela.lerCapacidadesWMTS(XML);

/* ---- a ponte entre a escala do WMTS e a ampliação do mapa ---- */

test('a escala do nível 0 bate com a resolução que o mapa usa', semAplicacao, () => {
  /* O WMTS fala em escalas, o mapa em níveis. A ponte é o pixel de 0,28 mm da OGC. Se uma
     das duas constantes mudar sem a outra, a carta aparece com a ampliação errada. */
  const escala0 = avaliar(janela, 'WMTS_ESCALA_0');
  assert.ok(Math.abs(escala0 * 0.00028 - janela.eval('GRELHAS.mercator.escala(0, 0)')) < 0.01,
    'a escala 0 do WMTS deixou de corresponder ao nível 0 do mapa');
});

test('o nível deriva da escala, e não do nome da matriz', semAplicacao, () => {
  /* «EPSG:3857:14» é um nome; 34123,75 é um número que significa sempre o mesmo. */
  assert.equal(janela.nivelPorEscala(avaliar(janela, 'WMTS_ESCALA_0'), avaliar(janela, 'WMTS_ESCALA_0')), 0);
  assert.equal(janela.nivelPorEscala(34123.751696, avaliar(janela, 'WMTS_ESCALA_0')), 14);
  assert.equal(janela.nivelPorEscala(2132.7344810, avaliar(janela, 'WMTS_ESCALA_0')), 18);
  assert.equal(janela.nivelPorEscala(2000000, avaliar(janela, 'WMTS_ESCALA_0')), null, 'uma escala que não é de nenhum nível');
  assert.equal(janela.nivelPorEscala('não é número', avaliar(janela, 'WMTS_ESCALA_0')), null);
});

test('o código do sistema de coordenadas lê-se em qualquer das formas', semAplicacao, () => {
  ['urn:ogc:def:crs:EPSG::3857', 'EPSG:3857', 'http://www.opengis.net/def/crs/EPSG/0/3857']
    .forEach((t) => assert.equal(janela.wmtsCRS(t), 'EPSG:3857', t));
});

/* ---- ler o documento ---- */

test('lê o serviço, as camadas e os conjuntos de matrizes', semAplicacao, () => {
  const c = cap();
  assert.equal(c.titulo, 'Serviço de cartografia de exemplo');
  assert.equal(c.atribuicao, 'Entidade de exemplo');
  assert.equal(c.termos, 'https://exemplo.test/termos');
  assert.equal(c.kvp, 'https://exemplo.test/wmts?');
  assert.deepEqual(daqui(c.camadas.map((x) => x.id)), ['ortos', 'cm25', 'cos']);
  assert.deepEqual(daqui(Object.keys(c.conjuntos)).sort(), ['EPSG:3857', 'PT-TM06']);
});

test('o elo de uma camada para um conjunto não é ele próprio um conjunto', semAplicacao, () => {
  /* `TileMatrixSetLink` tem lá dentro um `TileMatrixSet`, e apanhá-lo fazia nascerem
     conjuntos vazios com o mesmo nome dos verdadeiros. */
  const c = cap();
  Object.values(c.conjuntos).forEach((cj) => assert.ok(cj.matrizes.length, cj.id + ' entrou vazio'));
});

test('o que não é um GetCapabilities de WMTS é recusado com motivo', semAplicacao, () => {
  assert.throws(() => janela.lerCapacidadesWMTS('<html><body>erro 404</body></html>'), /página de erro/i);
  assert.throws(() => janela.lerCapacidadesWMTS('isto não é xML <<'), /XML válido|GetCapabilities/i);
  assert.throws(() => janela.lerCapacidadesWMTS(
    '<Capabilities xmlns="http://www.opengis.net/wmts/1.0"><Contents/></Capabilities>'), /nenhuma camada/i);
});

/* ---- o que serve e o que não serve ---- */

test('estar em EPSG:3763 não chega: tem de ser a grelha que a DGT publica', semAplicacao, () => {
  /* Este conjunto está no sistema certo e é recusado à mesma, porque começa noutro canto.
     É a recusa que interessa ter: o sistema de coordenadas diz em que unidades estão os
     números, e não onde fica a origem nem que escalas a grelha usa. Aceitá-lo por ter o
     código certo punha a ortofoto cinquenta quilómetros ao lado. */
  const r = janela.wmtsCompativel(cap().conjuntos['PT-TM06']);
  assert.equal(r.ok, false);
  assert.match(r.motivo, /começa em \(-120000, 300000\)/, 'o motivo devia dar o canto lido: ' + r.motivo);
  assert.match(r.motivo, /PT-TM06.*começa em \(-170000, 290000\)/, r.motivo);
});

test('um sistema que não é nenhuma das grelhas é recusado a nomear as duas', semAplicacao, () => {
  const c = daqui(cap().conjuntos['PT-TM06']);
  c.crs = 'EPSG:4326';
  const r = janela.wmtsCompativel(c);
  assert.equal(r.ok, false);
  assert.match(r.motivo, /EPSG:4326/);
  assert.match(r.motivo, /EPSG:3857.*EPSG:3763|EPSG:3763.*EPSG:3857/, r.motivo);
});

test('um conjunto em Web Mercator é aceite, com o mapa dos níveis', semAplicacao, () => {
  const r = janela.wmtsCompativel(cap().conjuntos['EPSG:3857']);
  assert.equal(r.ok, true, r.motivo);
  assert.equal(r.zMin, 8);
  assert.equal(r.zMax, 18);
  assert.equal(r.niveis[14], 'EPSG:3857:14', 'o nível 14 tem de saber o nome da sua matriz');
});

test('mosaicos que não sejam de 256 px, ou fora do canto do mundo, são recusados', semAplicacao, () => {
  const base = cap().conjuntos['EPSG:3857'];
  const grande = daqui(base); grande.matrizes.forEach((m) => { m.larguraMosaico = 512; m.alturaMosaico = 512; });
  assert.match(janela.wmtsCompativel(grande).motivo, /512×512/);

  const torto = daqui(base); torto.matrizes.forEach((m) => { m.canto = [0, 0]; });
  assert.match(janela.wmtsCompativel(torto).motivo, /começa em \(0, 0\)/);
});

test('o inventário mostra as camadas que não servem, com o motivo', semAplicacao, () => {
  const L = janela.wmtsInventario(cap());
  const cm = L.find((x) => x.id === 'cm25');
  assert.equal(cm.serve, false);
  assert.match(cm.motivo, /começa em/, cm.motivo);
  assert.equal(L.find((x) => x.id === 'ortos').serve, true);
  assert.equal(L.filter((x) => x.serve).length, 2);
});

/* ---- o endereço do mosaico ---- */

test('o modelo RESTful preenche-se com a linha antes da coluna', semAplicacao, () => {
  /* É aqui que se troca tudo: TileRow é y, TileCol é x — o contrário do XYZ. */
  const r = janela.wmtsCarta(cap(), 'ortos');
  assert.ok(r.ok, r.motivo);
  const u = janela.wmtsEndereco(r.carta, 14, 7835, 6135);
  assert.equal(u, 'https://exemplo.test/rest/ortos/default/EPSG:3857/EPSG:3857:14/6135/7835.png');
  assert.ok(u.endsWith('/6135/7835.png'), 'a linha (y) tem de vir antes da coluna (x)');
});

test('sem modelo RESTful, o pedido sai em KVP e com o nome certo da matriz', semAplicacao, () => {
  const r = janela.wmtsCarta(cap(), 'cos');
  assert.ok(r.ok, r.motivo);
  const u = janela.wmtsEndereco(r.carta, 14, 7835, 6135);
  assert.match(u, /^https:\/\/exemplo\.test\/wmts\?SERVICE=WMTS/);
  assert.match(u, /TILEMATRIX=EPSG%3A3857%3A14/, 'o nível vai pelo nome que o serviço lhe deu');
  assert.match(u, /TILEROW=6135/);
  assert.match(u, /TILECOL=7835/);
  assert.match(u, /STYLE=cores/, 'o estilo declarado pela camada');
});

test('a carta adotada traz a atribuição do serviço, e não uma escrita à mão', semAplicacao, () => {
  const r = janela.wmtsCarta(cap(), 'ortos');
  assert.equal(r.carta.atrib, 'Entidade de exemplo');
  assert.equal(r.carta.termos, 'https://exemplo.test/termos');
  assert.equal(r.carta.formato, 'image/png', 'prefere-se PNG quando a camada o oferece');
  assert.ok(r.carta.g, 'sem GDH de adoção');
});

test('uma camada só na quadrícula nacional não vira carta', semAplicacao, () => {
  const r = janela.wmtsCarta(cap(), 'cm25');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /Nenhum conjunto/);
});

/* ---- o mapa usa-a ---- */

test('o mapa monta o endereço pela espécie da carta, e limita-se às ampliações que ela dá',
  semAplicacao, async () => {
    const r = janela.wmtsCarta(cap(), 'ortos');
    const g = await janela.adotarCartaWMTS(r.carta);
    assert.ok(g.ok, g.motivo);
    assert.equal(janela.mosaicoURL(14, 7835, 6135),
      'https://exemplo.test/rest/ortos/default/EPSG:3857/EPSG:3857:14/6135/7835.png');
    assert.equal(janela.cartaZMin(), 8);
    assert.equal(janela.cartaZMax(), 18);
    await janela.retirarCarta();
  });

test('sem atribuição a carta não é adotada', semAplicacao, async () => {
  const r = janela.wmtsCarta(cap(), 'ortos');
  r.carta.atrib = '';
  const g = await janela.adotarCartaWMTS(r.carta);
  assert.equal(g.ok, false);
  assert.match(g.motivo, /sem dizer de quem é/);
});

test('a leitura pela interface lista as camadas e diz o que não serve', semAplicacao, () => {
  assert.equal(janela.usarCapacidadesWMTS(XML), true);
  const t = janela.document.getElementById('wm-camadas').textContent;
  assert.match(t, /Ortos definitivos/);
  assert.match(t, /Carta militar 1:25 000/);
  assert.match(t, /não serve/);
  assert.match(janela.document.getElementById('wm-servico').textContent, /Entidade de exemplo/);
});

test('um documento que não presta deixa a lista vazia e di-lo', semAplicacao, () => {
  assert.equal(janela.usarCapacidadesWMTS('<html>404</html>'), false);
  assert.equal(janela.document.getElementById('wm-camadas').innerHTML, '');
  assert.match(janela.document.getElementById('wm-msg').textContent, /Não foi possível ler o serviço/);
});

test('a linha de estado lê-se como frase, com ou sem quem a declarou', semAplicacao, async () => {
  /* Sem ninguém ao teclado dizia «ampliação 8 a 18 a 310002AGO26». */
  const r = janela.wmtsCarta(cap(), 'ortos');
  r.carta.por = '';
  await janela.adotarCartaWMTS(r.carta);
  janela.pintarCarta();
  const t = janela.document.getElementById('carta-estado').textContent;
  assert.match(t, /declarada \d{6}[A-Z]{3}\d{2}$/, t);
  assert.doesNotMatch(t, /ampliação \d+ a \d+ a /);
  await janela.retirarCarta();
});

test('uma carta WMTS não escreve nos campos do serviço {z}/{x}/{y}', semAplicacao, async () => {
  /* Copiava `CARTA.u`, que uma carta WMTS não tem: o campo ficava com «undefined» e a
     atribuição de um serviço aparecia nos campos do outro. */
  const el = (id) => janela.document.getElementById(id);
  ['carta-u', 'carta-atrib', 'carta-termos', 'carta-zmax'].forEach((id) => { el(id).value = ''; });
  await janela.adotarCartaWMTS(janela.wmtsCarta(cap(), 'ortos').carta);
  janela.pintarCarta();
  assert.equal(el('carta-u').value, '');
  assert.equal(el('carta-atrib').value, '', 'a atribuição do WMTS foi parar ao campo do outro serviço');
  assert.equal(el('carta-zmax').value, '');
  await janela.retirarCarta();
});

test('mas uma carta {z}/{x}/{y} continua a preencher os seus', semAplicacao, async () => {
  const el = (id) => janela.document.getElementById(id);
  ['carta-u', 'carta-atrib', 'carta-termos', 'carta-zmax'].forEach((id) => { el(id).value = ''; });
  await janela.guardarCarta('https://c.test/{z}/{x}/{y}.png', 'Serviço X', 'https://c.test/termos', '17');
  janela.pintarCarta();
  assert.equal(el('carta-u').value, 'https://c.test/{z}/{x}/{y}.png');
  assert.equal(el('carta-zmax').value, '17');
  await janela.retirarCarta();
});
