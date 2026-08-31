// O mapa operacional: a projeção de Mercator, o enquadramento, os pontos notáveis e o
// que acontece quando não há carta nenhuma.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));

function comTeatro() {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,0975'; O.meta.lon = '-7,8103';
  const lat = 41.0975, lon = -7.8103, d = 0.012;
  const c = [[lon - d, lat - d], [lon + d, lat - d], [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]];
  janela.guardarPerimetro({ type: 'Polygon', coordinates: [c] }, 'to.geojson');
  const e = janela.estObj(); e.n = 2;
  janela.escreverForm();
  return O;
}

beforeEach(async () => { if (janela) await janela.largarTeclado(); });

/* ---- as grelhas ---- */

test('cada grelha declara o sistema em que trabalha', semAplicacao, () => {
  const G = avaliar(janela, 'GRELHAS');
  Object.entries(G).forEach(([k, g]) => {
    assert.equal(g.k, k, 'a chave e o nome da grelha divergem: ' + k);
    assert.match(g.crs, /^EPSG:\d+$/, k + ' sem sistema declarado');
    assert.ok(g.n && g.n.length > 3, k + ' sem nome legível');
    assert.ok(g.zMax > g.zMin, k);
  });
  assert.equal(G.mercator.crs, 'EPSG:3857');
  assert.equal(G.pttm06.crs, 'EPSG:3763');
});

test('sem carta o mapa trabalha na grelha portuguesa', semAplicacao, async () => {
  await janela.retirarCarta();
  assert.equal(janela.grelhaAtual().k, 'pttm06');
});

test('um serviço {z}/{x}/{y} arrasta consigo o Web Mercator', semAplicacao, async () => {
  assert.ok((await janela.guardarCarta('https://c/{z}/{x}/{y}.png', 'Entidade X', 'https://t', 19)).ok);
  assert.equal(janela.grelhaAtual().k, 'mercator', 'o esquema de mosaicos da Internet é Mercator por definição');
  await janela.retirarCarta();
});

test('em qualquer grelha, projetar e desprojetar dá a volta', semAplicacao, () => {
  /* A ida e volta é feita **em par**: a Transversa de Mercator não separa os eixos, e uma
     primeira versão que projetou cada um sozinho pôs um ponto do Douro a trinta
     quilómetros do sítio. O teste chama `para` e `de` com o par, que é como o código
     corre. */
  const G = avaliar(janela, 'GRELHAS');
  const pontos = [[41.0975, -7.8103], [38.7223, -9.1393], [41.8, -6.7], [37.0, -8.9]];
  Object.keys(G).forEach((k) => {
    pontos.forEach(([la, lo]) => {
      [G[k].zMin, 12, G[k].zMax].forEach((z) => {
        const q = janela.eval(`(function(){ const g = GRELHAS.${k};
          const p = g.para(${la}, ${lo}, ${z}); return g.de(p.x, p.y, ${z}); })()`);
        assert.ok(Math.abs(q.lat - la) < 1e-7, `${k} z${z} lat ${la}: veio ${q.lat}`);
        assert.ok(Math.abs(q.lon - lo) < 1e-7, `${k} z${z} lon ${lo}: veio ${q.lon}`);
      });
    });
  });
});

/* ---- a projeção portuguesa ---- */

test('a origem de PT-TM06 cai exatamente em zero', semAplicacao, () => {
  /* EPSG:3763 não tem falsa origem: a origem das coordenadas é o próprio ponto central,
     39° 40′ 05,73″ N, 8° 07′ 59,19″ W. Se o arco do meridiano estivesse errado, era aqui
     que se via. */
  const o = janela.paraTM06(39 + 40 / 60 + 5.73 / 3600, -(8 + 7 / 60 + 59.19 / 3600));
  assert.ok(Math.abs(o.E) < 1e-6, 'Este da origem: ' + o.E);
  assert.ok(Math.abs(o.N) < 1e-6, 'Norte da origem: ' + o.N);
});

test('o Este depende da latitude e o Norte da longitude', semAplicacao, () => {
  /* O que a primeira versão deu por assente e não é verdade. Se estes dois valores fossem
     iguais, a projeção estaria a ser tratada como separável — e voltava o erro. */
  const a = janela.paraTM06(41.1, -7.8), b = janela.paraTM06(38.7, -7.8);
  assert.notEqual(a.E, b.E, 'o Este não mexeu com a latitude');
  const c = janela.paraTM06(41.1, -9.1);
  assert.notEqual(a.N, c.N, 'o Norte não mexeu com a longitude');
});

test('o nível 0 da grelha portuguesa dá a folha do continente', semAplicacao, () => {
  /* 2402,34375 m por pixel × 256 pixéis = 615 000 m redondos de lado, que é o que a DGT
     declara no conjunto PTTM_06. Um número redondo é a prova de que a escala do nível 0
     foi lida certa. */
  const lado = janela.eval('GRELHAS.pttm06.res(0) * MOSAICO_PX');
  assert.ok(Math.abs(lado - 615000) < 1, 'lado do nível 0: ' + lado);
  /* e os níveis seguintes são metades exatas */
  const r = janela.eval('[GRELHAS.pttm06.res(0), GRELHAS.pttm06.res(1), GRELHAS.pttm06.res(14)]');
  assert.ok(Math.abs(r[0] / 2 - r[1]) < 1e-9);
  assert.ok(Math.abs(r[0] / Math.pow(2, 14) - r[2]) < 1e-12);
});

test('na grelha portuguesa o metro do mapa é o metro do terreno', semAplicacao, () => {
  /* Ao contrário do Mercator, a escala não depende da latitude: é isso que deixa ler
     distâncias de manobra da barra de escala sem correção nenhuma. */
  const G = avaliar(janela, 'GRELHAS');
  assert.equal(janela.eval('GRELHAS.pttm06.escala(37, 14)'), janela.eval('GRELHAS.pttm06.escala(42, 14)'));
  assert.ok(G.pttm06.zMin === 0, 'o nível 0 é a folha inteira, e serve');
});

/* ---- a projeção de Mercator ---- */

test('um grau de longitude vale sempre o mesmo, em qualquer latitude', semAplicacao, () => {
  const x = (lo) => janela.eval(`GRELHAS.mercator.para(0, ${lo}, 12).x`);
  assert.ok(Math.abs((x(1) - x(0)) - (x(101) - x(100))) < 1e-9);
});

test('a escala do Mercator aperta com a latitude e com a ampliação', semAplicacao, () => {
  const e = (la, z) => janela.eval(`GRELHAS.mercator.escala(${la}, ${z})`);
  assert.ok(e(41, 12) < e(0, 12), 'a 41 graus o pixel vale menos metros');
  assert.ok(e(41, 13) < e(41, 12));
  /* referência conhecida: no equador, ao nível 0, o pixel vale cerca de 156 km */
  assert.ok(Math.abs(e(0, 0) - 156543) < 1);
});

test('os polos não fazem a projeção de Mercator rebentar', semAplicacao, () => {
  [90, -90, 89.999].forEach((la) =>
    assert.ok(isFinite(janela.eval(`GRELHAS.mercator.para(${la}, 0, 10).y`)), 'lat ' + la));
});

/* ---- o enquadramento ---- */

test('sem teatro não há o que enquadrar', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  assert.equal(janela.enquadrarMapa(640, 420), false);
});

test('o enquadramento escolhe a maior ampliação em que o teatro cabe', semAplicacao, () => {
  comTeatro();
  assert.equal(janela.enquadrarMapa(640, 620), true);
  const M = avaliar(janela, 'MAPA');
  const P = janela.perimObj();
  /* Os cantos projetam-se como pontos, e não eixo a eixo: é assim que o enquadramento
     mede, e medir de outra maneira dava outro retângulo. */
  const caixa = (z) => {
    const sd = janela.gPara(P.bbox[3], P.bbox[2], z), ie = janela.gPara(P.bbox[1], P.bbox[0], z);
    return { w: Math.abs(sd.x - ie.x), h: Math.abs(ie.y - sd.y) };
  };
  const a = caixa(M.z);
  assert.ok(a.w <= M.larg + 0.5 && a.h <= M.alt + 0.5, `não coube: ${a.w}x${a.h} em ${M.larg}x${M.alt}`);
  /* e uma ampliação acima já não caberia */
  const b = caixa(M.z + 1);
  assert.ok(b.w > M.larg || b.h > M.alt, 'ficou mais afastado do que precisava');
});

test('a tela toma a proporção do teatro, e não uma proporção fixa', semAplicacao, () => {
  comTeatro();
  janela.enquadrarMapa(980, 620);
  const M = avaliar(janela, 'MAPA');
  /* um teatro quadrado em graus é mais alto do que largo no terreno, a esta latitude */
  assert.ok(M.alt > M.larg, `${M.larg}x${M.alt}: a tela devia acompanhar a forma`);
  assert.ok(M.alt <= 620 && M.larg <= 980);
});

test('o centro do enquadramento é o centro do teatro', semAplicacao, () => {
  comTeatro();
  janela.enquadrarMapa(640, 620);
  const M = avaliar(janela, 'MAPA');
  const P = janela.perimObj();
  assert.ok(Math.abs(janela.gDe(M.cx, M.cy, M.z).lon - (P.bbox[0] + P.bbox[2]) / 2) < 1e-6);
});

/* ---- a carta e a atribuição ---- */

test('não vem serviço de mosaicos nenhum escrito no código', semAplicacao, async () => {
  /* A primeira versão trazia `tile.openstreetmap.org`, e estava errada: aquele serviço
     exige que a aplicação se identifique num cabeçalho próprio, e uma página aberta em
     `file://` não o consegue fazer. Escolher um serviço sem direito de uso confirmado é
     dar por assente o que não está. */
  await janela.retirarCarta();
  assert.equal(avaliar(janela, 'CARTA'), null);
  assert.equal(janela.mosaicoURL(14, 7729, 6216), '', 'sem serviço não se pede nada a ninguém');
  assert.equal(await janela.mosaicoBlob(14, 7729, 6216), null);
});

test('declarar o serviço exige endereço de mosaicos, atribuição e termos', semAplicacao, async () => {
  assert.equal((await janela.guardarCarta('ftp://x/{z}/{x}/{y}.png', 'a', 'https://t', 19)).ok, false);
  assert.equal((await janela.guardarCarta('https://x/mapa.png', 'a', 'https://t', 19)).ok, false,
    'sem {z}/{x}/{y} não é esquema de mosaicos');
  assert.equal((await janela.guardarCarta('https://x/{z}/{x}/{y}.png', '', 'https://t', 19)).ok, false,
    'carta de terceiros não se mostra sem dizer de quem é');
  assert.equal((await janela.guardarCarta('https://x/{z}/{x}/{y}.png', 'Serviço X', 'nao-e-url', 19)).ok, false);
});

test('o serviço declarado fica com quem o declarou, e monta o endereço', semAplicacao, async () => {
  const r = await janela.guardarCarta('https://carta.exemplo.pt/{z}/{x}/{y}.png',
    'Cartografia da entidade X', 'https://carta.exemplo.pt/termos', '17');
  assert.ok(r.ok, r.motivo);
  const C = avaliar(janela, 'CARTA');
  assert.equal(C.zMax, 17);
  assert.ok(C.g, 'sem GDH da declaração');
  assert.equal(janela.mosaicoURL(14, 7729, 6216), 'https://carta.exemplo.pt/14/7729/6216.png');
});

test('a ampliação máxima é a que o serviço declarou', semAplicacao, async () => {
  assert.ok((await janela.guardarCarta('https://c/{z}/{x}/{y}.png', 'Entidade X', 'https://t', '15')).ok);
  comTeatro();
  janela.enquadrarMapa(2000, 620);
  assert.ok(avaliar(janela, 'MAPA').z <= 15, 'passou da ampliação que o serviço dá');
});

test('retirar o serviço leva com ele os mosaicos que dele vieram', semAplicacao, async () => {
  assert.ok((await janela.guardarCarta('https://c/{z}/{x}/{y}.png', 'Entidade X', 'https://t', 19)).ok);
  await janela.retirarCarta();
  assert.equal(avaliar(janela, 'CARTA'), null);
});

test('a impressão digital distingue bytes iguais de bytes diferentes', semAplicacao, async () => {
  const B = (s) => new janela.Blob([s]);
  const a = await janela.impressaoMosaico(B('quadrado um'));
  const b = await janela.impressaoMosaico(B('quadrado um'));
  const c = await janela.impressaoMosaico(B('quadrado dois'));
  assert.equal(a, b, 'os mesmos bytes deviam dar a mesma impressão');
  assert.notEqual(a, c);
  assert.match(a, /^[0-9a-f]+-\d+$/);
});

test('a carta pré-descarregada reconhece a árvore {z}/{x}/{y}', semAplicacao, () => {
  assert.deepEqual(daqui(janela.mosaicoDoCaminho('carta/14/7835/6135.png')), { z: 14, x: 7835, y: 6135 });
  assert.deepEqual(daqui(janela.mosaicoDoCaminho('14/7835/6135.jpg')), { z: 14, x: 7835, y: 6135 });
  assert.deepEqual(daqui(janela.mosaicoDoCaminho('d/viseu/carta/9/247/193.webp')), { z: 9, x: 247, y: 193 });
});

test('e ignora o que vem à boleia na mesma pasta', semAplicacao, () => {
  ['carta/leia-me.txt', 'carta/14/7835/legenda.png', 'carta/7835/6135.png',
    'carta/14/7835/6135.pdf', 'carta/99/1/1.png']
    .forEach((c) => assert.equal(janela.mosaicoDoCaminho(c), null, c + ' passou e não devia'));
});

test('carregar carta local conta o que entrou e o que ficou de fora', semAplicacao, async () => {
  /* jsdom não dá IndexedDB: nada fica guardado, e é isso que `semArquivo` diz — separado
     do que foi recusado por não seguir a árvore, que é outra coisa. */
  const f = (caminho) => {
    const x = new janela.File(['x'], caminho.split('/').pop(), { type: 'image/png' });
    Object.defineProperty(x, 'webkitRelativePath', { value: caminho });
    return x;
  };
  const r = await janela.carregarMosaicosLocais([
    f('carta/14/7835/6135.png'), f('carta/14/7835/6136.png'), f('carta/leia-me.txt')
  ]);
  assert.equal(r.ignorados, 1, 'um só não seguia a árvore');
  assert.equal(r.n + r.semArquivo, 2, 'os outros dois eram mosaicos');
});

/* ---- os pontos notáveis ---- */

test('cada tipo de ponto declara a norma que o institui', semAplicacao, () => {
  const T = avaliar(janela, 'TIPOS_PONTO');
  assert.ok(T.length >= 5);
  T.forEach((t) => {
    assert.ok(t.n && t.n.length > 3, t.k);
    assert.ok(t.r, t.k + ' sem norma declarada');
    assert.match(t.cor, /^#[0-9A-Fa-f]{6}$/, t.k);
  });
  /* Nenhuma citação é inventada: ou traz artigo, ou diz que a fonte está por confirmar.
     Uma alínea escolhida por parecer bem é pior do que uma lacuna assumida. */
  T.forEach((t) => {
    if (/art\./.test(t.r)) return;
    assert.match(t.r, /por confirmar|sem designação legal fixada/,
      t.k + ' cita o que não tem: ' + t.r);
  });
  assert.equal(T.find((t) => t.k === 'agua').r, 'fonte por confirmar');
  /* e a citação do ponto de trânsito é a que o projeto já usa noutro sítio */
  assert.match(T.find((t) => t.k === 'pt').r, /art\. 32\.º, n\.º 1, al\. b\)/);
});

test('um tipo desconhecido cai em «outro» em vez de rebentar', semAplicacao, () => {
  assert.equal(janela.defPonto('inventado').k, 'outro');
});

test('marcar um ponto grava a coordenada, o GDH e quem o marcou', semAplicacao, () => {
  comTeatro();
  const r = janela.marcarPonto('agua', 41.1, -7.81, 'charca de Cambres');
  assert.ok(r.ok, r.motivo);
  const p = avaliar(janela, 'O').dados.pontos[0];
  assert.equal(p.tipo, 'agua');
  assert.equal(p.nome, 'charca de Cambres');
  assert.equal(p.lat, 41.1);
  assert.ok(p.g, 'sem GDH');
  assert.ok(avaliar(janela, 'O').evolucao.some((e) => /Ponto de água marcado/.test(e.txt)),
    'a marca devia entrar na evolução');
});

test('sem nome, o ponto fica com o nome do seu tipo', semAplicacao, () => {
  comTeatro();
  janela.marcarPonto('zcr', 41.1, -7.81, '');
  assert.equal(avaliar(janela, 'O').dados.pontos[0].nome, 'Zona de concentração e reserva');
});

test('uma coordenada que não é número é recusada', semAplicacao, () => {
  comTeatro();
  const r = janela.marcarPonto('agua', NaN, -7.81, 'x');
  assert.equal(r.ok, false);
  assert.equal(avaliar(janela, 'O').dados.pontos.length, 0);
});

test('um ponto marcado pode ser retirado', semAplicacao, () => {
  comTeatro();
  const r = janela.marcarPonto('pt', 41.1, -7.81, 'ponto de trânsito');
  assert.ok(janela.apagarPonto(r.ponto.id).ok);
  assert.equal(avaliar(janela, 'O').dados.pontos.length, 0);
  assert.equal(janela.apagarPonto('inexistente').ok, false);
});

test('com o registo encerrado não se marca nada', semAplicacao, () => {
  comTeatro();
  const O = avaliar(janela, 'O');
  O.encerramento.g = '301200AGO26'; O.encerramento.por = 'Cmdt A';
  assert.equal(janela.marcarPonto('agua', 41.1, -7.81, 'x').ok, false);
  assert.equal(janela.marcarSetor(0, 41.1, -7.81).ok, false);
  O.encerramento.g = ''; O.encerramento.por = '';
});

/* ---- os setores ---- */

test('marcar um setor dá-lhe coordenada e deixa registo', semAplicacao, () => {
  comTeatro();
  const r = janela.marcarSetor(0, 41.0935, -7.8019);
  assert.ok(r.ok, r.motivo);
  const s = janela.estObj().setores[0];
  assert.equal(s.lat, '41.093500');
  assert.ok(avaliar(janela, 'O').evolucao.some((e) => /Setor Alfa localizado/.test(e.txt)));
});

test('um setor que não existe não se marca', semAplicacao, () => {
  comTeatro();
  assert.equal(janela.marcarSetor(9, 41.1, -7.81).ok, false);
});

test('os setores nascem com o campo da coordenada, vazio', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const e = janela.estObj(); e.n = 1;
  janela.renderSetores();
  assert.equal(e.setores[0].lat, '');
  assert.equal(e.setores[0].lon, '');
});

/* ---- a camada operacional ---- */

test('a sobreposição traz o perímetro, o PCO, os pontos e os setores', semAplicacao, () => {
  comTeatro();
  janela.marcarPonto('agua', 41.1, -7.81, 'charca');
  janela.marcarSetor(0, 41.0935, -7.8019);
  janela.enquadrarMapa(640, 620);
  const svg = janela.camadaMapa();
  assert.match(svg, /^<svg /);
  assert.ok(svg.includes('>PCO<'), 'sem PCO');
  assert.ok(svg.includes('>charca<'), 'sem o ponto de água');
  assert.ok(svg.includes('>Setor Alfa<'), 'sem o setor');
  assert.match(svg, /<path d="M[\d.,\sLZ-]+" fill="#B84B3F"/, 'sem o perímetro');
});

test('o nome de um ponto não escapa do SVG', semAplicacao, () => {
  comTeatro();
  janela.marcarPonto('outro', 41.1, -7.81, '</text><script>x</script>');
  janela.enquadrarMapa(640, 620);
  const svg = janela.camadaMapa();
  assert.ok(!svg.includes('<script>'), 'o nome entrou como marcação');
});

test('o rótulo leva contorno branco por baixo, para se ler sobre a carta', semAplicacao, () => {
  const r = janela.rotulo(10, 20, 'Cambres', 10);
  assert.equal((r.match(/<text/g) || []).length, 2, 'devia haver contorno e texto');
  assert.match(r, /stroke="#fff"/);
});

/* ---- sem carta ---- */

test('sem serviço declarado a aplicação di-lo, e o croqui continua a servir', semAplicacao, async () => {
  await janela.retirarCarta();
  comTeatro();
  janela.enquadrarMapa(640, 620);
  const M = avaliar(janela, 'MAPA');
  M.pronto = false; M.falhas = 4; M.recusados = 0;
  janela.pintarEstadoMapa(0, 4);
  const t = janela.document.getElementById('mapa-info').textContent;
  assert.match(t, /Sem serviço de mosaicos configurado/);
  assert.notEqual(janela.croquiSVG(640, 400), '', 'o croqui não devia depender da carta');
});

test('um serviço que devolve sempre a mesma imagem é recusa, e não carta', semAplicacao, async () => {
  await janela.guardarCarta('https://c/{z}/{x}/{y}.png', 'Serviço X', 'https://t', 19);
  comTeatro();
  janela.enquadrarMapa(640, 620);
  const M = avaliar(janela, 'MAPA');
  M.pronto = false; M.recusados = 9; M.falhas = 9;
  janela.pintarEstadoMapa(0, 9);
  const t = janela.document.getElementById('mapa-info').textContent;
  assert.match(t, /a mesma imagem em vez de carta/);
  assert.match(t, /está a recusar os pedidos/);
});

test('a atribuição do serviço aparece sempre que há serviço', semAplicacao, async () => {
  await janela.guardarCarta('https://c/{z}/{x}/{y}.png', 'Cartografia da entidade X', 'https://t/uso', 19);
  comTeatro();
  janela.enquadrarMapa(640, 620);
  const M = avaliar(janela, 'MAPA');
  M.pronto = true; M.falhas = 0; M.recusados = 0;
  janela.pintarEstadoMapa(12, 12);
  const t = janela.document.getElementById('mapa-info').textContent;
  assert.match(t, /Cartografia da entidade X/);
  assert.match(t, /https:\/\/t\/uso/);
  assert.match(t, /não substitui a carta militar/);
});

test('um mapa incompleto diz quantos quadrados faltaram', semAplicacao, () => {
  comTeatro();
  janela.enquadrarMapa(640, 620);
  const M = avaliar(janela, 'MAPA');
  M.pronto = true; M.falhas = 3;
  janela.pintarEstadoMapa(9, 12);
  assert.match(janela.document.getElementById('mapa-info').textContent, /3 de 12 quadrados não vieram/);
});

test('o cartão do mapa esconde-se quando não há teatro', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  janela.pintarMapaCartao();
  assert.equal(janela.document.getElementById('mapa-box').style.display, 'none');
});

/* ---- ida e volta ---- */

test('a geometria, os pontos e as coordenadas dos setores viajam na exportação', semAplicacao, () => {
  comTeatro();
  janela.marcarPonto('agua', 41.1, -7.81, 'charca de Cambres');
  janela.marcarSetor(0, 41.093, -7.802);
  const texto = JSON.stringify(janela.pacoteOcorrencia());

  janela.eval('O = novoEstado()');
  janela.escreverForm();
  const lido = janela.lerPacoteOcorrencia(texto);

  assert.equal(lido.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.equal(lido.dados.pontos.length, 1);
  assert.equal(lido.dados.pontos[0].nome, 'charca de Cambres');
  assert.ok(lido.dados.perim && lido.dados.perim.aneis.length, 'o perímetro não viajou');
  assert.equal(lido.dados.est.setores[0].lat, '41.093000');
});

test('uma ocorrência da versão 15 abre sem geometria e sem pontos, e não os inventa', semAplicacao, () => {
  const lido = janela.lerPacoteOcorrencia(JSON.stringify({
    versao: 15, meta: { num: '2026/900', lat: '41', lon: '-7,8' },
    dados: { area: '120', est: { n: 1, setores: [{ estado: 'Em curso (ativo)', cmd: 'Cmdt A', tip: [] }] } }
  }));
  assert.equal(lido.dados.perim, null, 'não se reconstrói a forma a partir dos hectares');
  assert.deepEqual(daqui(lido.dados.pontos), []);
  assert.equal(lido.dados.est.setores[0].lat, '', 'o setor ganha o campo, vazio');
  assert.equal(lido.versao, avaliar(janela, 'VERSAO_ESTADO'));
});

test('com carta do arquivo e sem serviço, di-lo em vez de dizer que não há carta', semAplicacao, async () => {
  await janela.retirarCarta();
  comTeatro();
  janela.enquadrarMapa(640, 620);
  const M = avaliar(janela, 'MAPA');
  M.pronto = true; M.falhas = 0; M.recusados = 0;
  janela.pintarEstadoMapa(12, 12);
  const t = janela.document.getElementById('mapa-info').textContent;
  assert.match(t, /Carta pré-descarregada/);
  assert.doesNotMatch(t, /Sem serviço de mosaicos configurado/,
    'o mapa estava a mostrar carta e a linha dizia que não havia');
});
