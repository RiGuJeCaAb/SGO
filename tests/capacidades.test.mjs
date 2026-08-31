// As capturas de GetCapabilities dos serviços reais, e o que o interpretador faz com elas.
//
// Estes ficheiros são prova de proveniência: foram obtidos dos serviços em 31 de agosto de
// 2026 e valem por serem o que o servidor respondeu. Um ficheiro editado à mão deixa de
// ser prova, e por isso a primeira coisa que aqui se confere é o resumo de cada um.
//
// O resto do ficheiro exercita o interpretador contra eles. É a diferença entre uma
// captura inventada, que confirma o que se acredita, e uma captura real, que já mostrou
// quatro coisas em que se acreditava e eram falsas.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { abrirAplicacao } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/* Os objetos vêm do outro reino do jsdom: um `Array` de lá não é o `Array` de cá, e o
   `deepEqual` recusa-os sem olhar ao conteúdo. */
const daqui = (x) => JSON.parse(JSON.stringify(x));
const RAIZ = new URL('./fixtures/capacidades/', import.meta.url);
const RESUMOS = JSON.parse(await readFile(new URL('resumos.json', RAIZ), 'utf8'));
const ler = (rel) => readFile(new URL(rel, RAIZ), 'utf8');

/* ---- a prova continua a ser prova ---- */

test('cada captura continua a ter o resumo que o manifesto registou', async () => {
  for (const [rel, sha] of Object.entries(RESUMOS)) {
    const bytes = await readFile(new URL(rel, RAIZ));
    const meu = createHash('sha256').update(bytes).digest('hex');
    assert.equal(meu, sha, rel + ' foi alterado depois de capturado: deixou de ser prova');
  }
});

test('não há capturas por registar nem registos sem captura', async () => {
  const achados = [];
  for (const pasta of ['wmts', 'wms', 'cabecalhos']) {
    for (const f of await readdir(new URL(pasta + '/', RAIZ))) achados.push(pasta + '/' + f);
  }
  assert.deepEqual(achados.sort(), Object.keys(RESUMOS).sort(),
    'o manifesto e a pasta divergiram');
});

/* ---- o que as capturas provam ---- */

test('das cinco capturas de WMTS, uma só é um WMTS', semAplicacao, async () => {
  /* O ponto de partida do trabalho de cartografia era que havia vários serviços WMTS
     oficiais para escolher. Havia um. Os outros quatro respondem erro — e respondem-no com
     HTTP 200, que é a razão de o interpretador não poder confiar no código de estado. */
  const lidos = [], recusados = [];
  for (const f of (await readdir(new URL('wmts/', RAIZ))).sort()) {
    try { janela.lerCapacidadesWMTS(await ler('wmts/' + f)); lidos.push(f); }
    catch (e) { recusados.push([f, e.message]); }
  }
  assert.deepEqual(lidos, ['wmts_dgt_ortos2018.xml']);
  assert.equal(recusados.length, 4);
  /* e cada recusa diz o que o servidor disse, e não uma mensagem genérica */
  recusados.forEach(([f, m]) => assert.ok(m.length > 40, f + ' recusado sem explicação: ' + m));
});

test('um erro pode vir com HTTP 200, e os cabeçalhos guardados provam-no', async () => {
  for (const f of ['wmts_dgt_ortos2021', 'wmts_dgt_ortosat2023', 'wmts_icnf_bdg', 'wmts_icnf_gwc']) {
    const h = await ler('cabecalhos/headers_' + f + '.txt');
    assert.match(h.split('\n')[0], /^HTTP\/1\.[01] 200 OK/, f + ' não era 200');
  }
});

test('a página de erro do MapServer é reconhecida como erro e não como capacidades', semAplicacao, async () => {
  /* Duas destas respostas são HTML servido com `Content-Type: text/html`, e uma delas ainda
     traz os cabeçalhos HTTP repetidos dentro do corpo. Nenhuma tem raiz `Capabilities`. */
  await assert.rejects(async () => janela.lerCapacidadesWMTS(await ler('wmts/wmts_dgt_ortos2021.xml')),
    /página de erro/);
  await assert.rejects(async () => janela.lerCapacidadesWMTS(await ler('wmts/wmts_dgt_ortosat2023.xml')),
    /página de erro/);
});

test('o ExceptionReport da OGC dá o código e o texto do próprio serviço', semAplicacao, async () => {
  await assert.rejects(async () => janela.lerCapacidadesWMTS(await ler('wmts/wmts_icnf_bdg.xml')),
    /InvalidParameterValue.*No service/s);
  await assert.rejects(async () => janela.lerCapacidadesWMTS(await ler('wmts/wmts_icnf_gwc.xml')),
    /NoApplicableCode.*gwc\/service/s);
});

/* ---- a captura que é mesmo um WMTS ---- */

test('o WMTS da DGT está em PT-TM06, e não em Web Mercator', semAplicacao, async () => {
  /* É o facto que obrigou o mapa a deixar de ser só de Mercator. O serviço publica um
     conjunto de matrizes `PTTM_06` em EPSG:3763; lê-lo como Mercator punha a ortofoto a
     centenas de quilómetros do sítio. */
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_dgt_ortos2018.xml'));
  assert.equal(c.camadas.length, 1);
  /* Os conjuntos vêm indexados pelo identificador que o serviço lhes deu, e não em lista:
     é por esse nome que cada camada os refere. */
  const nomes = Object.keys(c.conjuntos);
  const nome = nomes.find((x) => /PTTM/i.test(x));
  assert.ok(nome, 'o conjunto PTTM_06 não foi lido; vieram ' + nomes.join(', '));
  assert.equal(c.conjuntos[nome].crs, 'EPSG:3763');
  assert.ok(!nomes.some((x) => c.conjuntos[x].crs === 'EPSG:3857'), 'não há Mercator neste serviço');
});

test('a camada da DGT é servida na grelha portuguesa, do nível 0 ao 19', semAplicacao, async () => {
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_dgt_ortos2018.xml'));
  const nome = Object.keys(c.conjuntos).find((x) => /PTTM/i.test(x));
  const comp = janela.wmtsCompativel(c.conjuntos[nome]);
  assert.ok(comp.ok, comp.motivo);
  assert.equal(comp.grelha, 'pttm06');
  assert.equal(comp.zMin, 0);
  assert.equal(comp.zMax, 19);
});

test('os números da grelha portuguesa saem do documento, e não da minha memória', semAplicacao, async () => {
  /* A grelha `pttm06` traz três constantes escritas no código — o canto e a escala do nível
     0. Escritas à mão, envelhecem em silêncio: se a DGT republicar o conjunto com outra
     origem, a carta desloca-se e nada avisa. Aqui confrontam-se com o que a captura declara,
     matriz a matriz. */
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_dgt_ortos2018.xml'));
  const conj = c.conjuntos[Object.keys(c.conjuntos).find((x) => /PTTM/i.test(x))];
  const g = janela.eval('({ E0: GRELHAS.pttm06.E0, N0: GRELHAS.pttm06.N0, escala0: GRELHAS.pttm06.escala0 })');

  const m0 = conj.matrizes.find((m) => m.id === '00');
  assert.ok(m0, 'o nível 00 não veio; vieram ' + conj.matrizes.map((m) => m.id).join(', '));
  assert.deepEqual(daqui(m0.canto), [g.E0, g.N0], 'o canto declarado deixou de ser o do código');
  assert.equal(m0.escala, g.escala0, 'a escala do nível 0 deixou de ser a do código');

  /* e a progressão é binária exata em todos os vinte níveis */
  assert.equal(conj.matrizes.length, 20);
  conj.matrizes.forEach((m) => {
    const z = Number(m.id);
    /* O serviço arredonda os denominadores de escala que publica, e por isso a comparação
       é por proporção e não por igualdade: a matriz 02 declara 600,5859375012 m/px onde a
       progressão exata dá 600,5859374998. São catorze algarismos de acordo, e exigir o
       décimo quinto seria exigir que a DGT publicasse mais casas do que publica. */
    assert.ok(Math.abs(m.escala * 0.00028 / janela.eval(`GRELHAS.pttm06.res(${z})`) - 1) < 1e-9,
      'a matriz ' + m.id + ' não cai no nível que o mapa lhe dá');
    assert.equal(janela.nivelPorEscala(m.escala, g.escala0), z,
      'a ponte da escala para o nível falhou na matriz ' + m.id);
    assert.deepEqual(daqui(m.canto), [g.E0, g.N0], 'a matriz ' + m.id + ' começa noutro canto');
    assert.equal(m.larguraMosaico, 256, m.id);
  });
});

test('a folha do continente cobre o continente, e a contagem de mosaicos prova-o', semAplicacao, async () => {
  /* `MatrixWidth` e `MatrixHeight` não são potências de dois: são os mosaicos que a DGT
     publica de facto, e ao nível 02 são 3×4 e não 4×4. Tomá-los por potências de dois pedia
     mosaicos que não existem, e cada um voltava erro. */
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_dgt_ortos2018.xml'));
  const conj = c.conjuntos[Object.keys(c.conjuntos).find((x) => /PTTM/i.test(x))];
  const m2 = conj.matrizes.find((m) => m.id === '02');
  assert.equal(m2.colunas, 3);
  assert.equal(m2.linhas, 4);
});

test('um ponto do Douro cai no mosaico que a grelha lhe dá', semAplicacao, async () => {
  /* Conferido à mão contra o que se sabe do terreno: Lamego fica a cerca de 27 km a leste
     do meridiano central de PT-TM06 e a cerca de 159 km a norte da sua origem. Ao nível 14
     o mosaico vale 37,5 m de lado, e é isso que dá a coluna 5251 e a linha 3496. Se algum
     dia isto der outro par, ou a projeção mudou ou a grelha mudou. */
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_dgt_ortos2018.xml'));
  const r = await janela.wmtsCarta(c, c.camadas[0].id);
  assert.ok(r.ok, r.motivo);
  const p = janela.gPara(41.0975, -7.8103, 14);
  assert.equal(Math.floor(p.x / 256), 5251);
  assert.equal(Math.floor(p.y / 256), 3496);
  /* e o endereço leva a linha antes da coluna, que é a convenção do WMTS */
  const u = janela.wmtsEndereco(r.carta, 14, 5251, 3496);
  assert.match(u, /TILEROW=3496/);
  assert.match(u, /TILECOL=5251/);
  assert.match(u, /TILEMATRIX=14&/, 'o nome que a DGT deu à matriz 14: ' + u);
  await janela.retirarCarta();
});

test('adotar a camada leva a grelha consigo, e o mapa passa a trabalhar nela', semAplicacao, async () => {
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_dgt_ortos2018.xml'));
  const r = await janela.wmtsCarta(c, c.camadas[0].id);
  assert.ok(r.ok, r.motivo);
  assert.equal(janela.grelhaAtual().k, 'pttm06');
  /* e um ponto do Douro cai no mosaico que lhe pertence, com a linha antes da coluna */
  const p = janela.gPara(41.0975, -7.8103, 14);
  assert.ok(p.x > 0 && p.y > 0, 'fora da folha: ' + JSON.stringify(p));
  const q = janela.gDe(p.x, p.y, 14);
  assert.ok(Math.abs(q.lat - 41.0975) < 1e-7 && Math.abs(q.lon - (-7.8103)) < 1e-7);
  await janela.retirarCarta();
});

test('a DGT abre o CORS e o ICNF não, que é o que decide o que é utilizável', async () => {
  /* Uma página em `file://` tem origem opaca: sem `Access-Control-Allow-Origin` o navegador
     recusa a resposta antes de o código a ver. O manifesto dizia, ao princípio, que todos
     os anfitriões o abriam — não abrem. Os seis dos serviços do ICNF não trazem cabeçalho
     nenhum de CORS, e por isso nenhum deles é legível desta aplicação, mesmo o que responde
     capacidades válidas. Não é defeito do interpretador e não se corrige em código. */
  const semCORS = [], comCORS = [], vazios = [];
  for (const f of (await readdir(new URL('cabecalhos/', RAIZ))).sort()) {
    const h = await ler('cabecalhos/' + f);
    if (!h.trim()) { vazios.push(f); continue; }
    (/Access-Control-Allow-Origin:\s*\*/i.test(h) ? comCORS : semCORS).push(f);
  }
  assert.equal(comCORS.length, 17, 'os serviços da DGT abriam todos o CORS');
  assert.deepEqual(semCORS, [
    'headers_icnf_areas_ardidas_130.txt',
    'headers_icnf_bdg_111.txt',
    'headers_icnf_bdg_130.txt',
    'headers_wmts_icnf_bdg.txt',
    'headers_wmts_icnf_gwc.txt'
  ], 'mudou quem abre o CORS: rever o que a aplicação pode ler');
  /* uma das capturas ficou sem cabeçalhos nenhuns, e fica registado que ficou */
  assert.deepEqual(vazios, ['headers_icnf_areas_ardidas_111.txt']);
});
