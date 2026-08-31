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

test('dos cinco endereços nacionais de WMTS, um só é um WMTS', semAplicacao, async () => {
  /* O ponto de partida do trabalho de cartografia era que havia vários serviços WMTS
     oficiais para escolher. Havia um. Os outros quatro respondem erro — e respondem-no com
     HTTP 200, que é a razão de o interpretador não poder confiar no código de estado.

     O sexto ficheiro desta pasta é o do NASA GIBS, capturado depois e por outra razão: é
     internacional, e entrou como teste de esforço. Conta-se à parte para a proporção
     nacional continuar a dizer o que dizia. */
  const lidos = [], recusados = [];
  for (const f of (await readdir(new URL('wmts/', RAIZ))).sort()) {
    if (/gibs/.test(f)) continue;
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

test('a DGT e a NASA abrem o CORS; o ICNF não, e é isso que decide o que é utilizável', async () => {
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
  assert.equal(comCORS.length, 18, 'os serviços da DGT e o GIBS abriam todos o CORS');
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

/* ---- o documento grande ---- */

test('o maior GetCapabilities conhecido lê-se em tempo de posto de comando', semAplicacao, async () => {
  /* O NASA GIBS publica 5,8 MB, 62 034 elementos e 1 315 camadas. É o teste de esforço do
     interpretador, e apanhou um defeito que nenhum documento pequeno apanhava: a travessia
     fazia `[...el.getElementsByTagName("*")]`, e espalhar uma coleção *viva* faz o motor
     voltar a percorrer a árvore a cada passo do iterador. Não terminava em cinco minutos.

     Com a caminhada por `firstElementChild` lê-se em cerca de dois segundos. O limite aqui
     é generoso de propósito — a máquina de um posto é mais lenta do que esta, e o que se
     quer travar é a regressão para tempo quadrático, não afinar milissegundos. */
  const xml = await ler('wmts/wmts_gibs_3857.xml');
  const t0 = Date.now();
  const c = janela.lerCapacidadesWMTS(xml);
  const lido = Date.now() - t0;
  assert.ok(lido < 20000, 'leu em ' + lido + ' ms: alguma travessia voltou a ser quadrática');
  assert.equal(c.camadas.length, 1315);
  assert.equal(Object.keys(c.conjuntos).length, 7);
  assert.equal(c.atribuicao, 'National Aeronautics and Space Administration');

  /* e o inventário das 1 315 camadas não pode ser mais caro do que a leitura */
  const t1 = Date.now();
  const L = janela.wmtsInventario(c);
  assert.ok(Date.now() - t1 < 5000, 'o inventário demorou ' + (Date.now() - t1) + ' ms');
  assert.equal(L.length, 1315);
});

test('o GIBS é todo Web Mercator, e por isso a grelha portuguesa não o serve', semAplicacao, async () => {
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_gibs_3857.xml'));
  Object.values(c.conjuntos).forEach((cj) => assert.equal(cj.crs, 'EPSG:3857', cj.id));
  /* O `SupportedCRS` vem em URN longo com versão de autoridade — `urn:ogc:def:crs:EPSG:6.18:3:3857`
     — e é aí que o leitor de códigos tem de acertar no último segmento. */
  const comp = janela.wmtsCompativel(c.conjuntos.GoogleMapsCompatible_Level8);
  assert.equal(comp.ok, true, comp.motivo);
  assert.equal(comp.grelha, 'mercator');
  assert.equal(comp.zMax, 8, 'as anomalias térmicas param no nível 8, a 611 m por pixel');
});

test('o eixo temporal deixou de ser motivo de recusa, e o GIBS abre', semAplicacao, async () => {
  /* Antes da r0072 uma camada com dimensão era recusada por completo: 1 210 das 1 315 do
     GIBS ficavam de fora. Com a dimensão lida e indicada no pedido, a maior parte serve. */
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_gibs_3857.xml'));
  const L = janela.wmtsInventario(c);
  assert.ok(L.filter((x) => x.serve).length > 1000, 'servem ' + L.filter((x) => x.serve).length);
  const tc = L.find((x) => x.id === 'VIIRS_NOAA20_CorrectedReflectance_TrueColor');
  assert.equal(tc.serve, true, tc.motivo);
});

test('as anomalias térmicas continuam de fora — e não é pelo tempo, é pelo formato', semAplicacao, async () => {
  /* **Correção ao que se esperava.** O relatório de fontes internacionais e o registo desta
     linhagem davam a entender que ler o eixo `Time` traria o fogo ativo do GIBS para dentro
     do mapa. Não traz: as dezoito camadas de anomalias térmicas são servidas **só** em
     `application/vnd.mapbox-vector-tile`, que não é imagem e que este mapa não desenha.

     A conclusão do §4 do relatório fica reforçada, e é ela que vale: a via para focos de
     calor é a API de pontos do FIRMS, não o mosaico do GIBS. */
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_gibs_3857.xml'));
  const term = janela.wmtsInventario(c).filter((x) => /Thermal_Anomalies/.test(x.id));
  assert.equal(term.length, 18);
  term.forEach((x) => {
    assert.equal(x.serve, false, x.id);
    assert.match(x.motivo, /nenhum formato desenhável/, x.id);
    assert.match(x.motivo, /mapbox-vector-tile/, x.id);
    assert.ok(!/eixo/.test(x.motivo), 'ainda recusada pelo tempo: ' + x.id);
  });
});

test('o pedido leva a data, e a linha continua antes da coluna', semAplicacao, async () => {
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_gibs_3857.xml'));
  const r = await janela.wmtsCarta(c, 'VIIRS_NOAA20_CorrectedReflectance_TrueColor');
  assert.ok(r.ok, r.motivo);
  assert.equal(r.carta.dim.id, 'Time');
  assert.equal(r.carta.dim.valor, '2026-08-31', 'o valor por omissão do serviço');
  const u = janela.wmtsEndereco(r.carta, 7, 61, 48);
  assert.match(u, /\/2026-08-31\//, 'o {Time} do modelo não foi preenchido: ' + u);
  assert.ok(u.endsWith('/48/61.jpeg'), 'a linha tem de vir antes da coluna: ' + u);
  assert.ok(!/\{/.test(u), 'ficou um marcador por preencher: ' + u);
});

test('os buracos declarados pelo GIBS são buracos, e a aplicação vê-os', semAplicacao, async () => {
  /* Os intervalos das anomalias térmicas têm falhas — entre 2024-03-19 e 2024-03-25 não há
     nada. Um mapa que não distinga «não há dados nesse dia» de «não há deteções» induz em
     erro por omissão, e a segunda coisa a aplicação não a pode saber de todo. */
  const c = janela.lerCapacidadesWMTS(await ler('wmts/wmts_gibs_3857.xml'));
  const cam = c.camadas.find((x) => x.id === 'VIIRS_NOAA20_Thermal_Anomalies_375m_All');
  const dim = cam.dimensoes[0];
  assert.equal(dim.id, 'Time');
  assert.equal(janela.dataNaDimensao(dim, '2024-03-18'), true, 'dentro do intervalo');
  assert.equal(janela.dataNaDimensao(dim, '2024-03-22'), false, 'está no buraco declarado');
  assert.equal(janela.dataNaDimensao(dim, '2019-06-01'), false, 'antes do primeiro intervalo');
  assert.equal(janela.dataNaDimensao(dim, 'ontem'), false, 'uma data que não é data');
  assert.equal(janela.ultimaDataDaDimensao(dim), '2026-08-31');
});
