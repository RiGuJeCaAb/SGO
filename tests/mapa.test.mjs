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

/* ---- a projeção ---- */

test('a projeção de Mercator e o seu inverso dão a volta', semAplicacao, () => {
  [[41.0975, -7.8103], [-33.9, 18.4], [0, 0], [60.2, 24.9]].forEach(([la, lo]) => {
    [8, 12, 16].forEach((z) => {
      assert.ok(Math.abs(janela.merLat(janela.merY(la, z), z) - la) < 1e-6, `lat ${la} z${z}`);
      assert.ok(Math.abs(janela.merLon(janela.merX(lo, z), z) - lo) < 1e-6, `lon ${lo} z${z}`);
    });
  });
});

test('um grau de longitude vale sempre o mesmo, em qualquer latitude', semAplicacao, () => {
  const a = janela.merX(1, 12) - janela.merX(0, 12);
  const b = janela.merX(101, 12) - janela.merX(100, 12);
  assert.ok(Math.abs(a - b) < 1e-9);
});

test('a escala aperta com a latitude e com a ampliação', semAplicacao, () => {
  assert.ok(janela.merEscala(41, 12) < janela.merEscala(0, 12), 'a 41 graus o pixel vale menos metros');
  assert.ok(janela.merEscala(41, 13) < janela.merEscala(41, 12));
  /* referência conhecida: no equador, ao nível 0, o pixel vale cerca de 156 km */
  assert.ok(Math.abs(janela.merEscala(0, 0) - 156543) < 1);
});

test('os polos não fazem a projeção rebentar', semAplicacao, () => {
  [90, -90, 89.999].forEach((la) => assert.ok(isFinite(janela.merY(la, 10)), 'lat ' + la));
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
  const w = janela.merX(P.bbox[2], M.z) - janela.merX(P.bbox[0], M.z);
  const h = janela.merY(P.bbox[1], M.z) - janela.merY(P.bbox[3], M.z);
  assert.ok(w <= M.larg + 0.5 && h <= M.alt + 0.5, `não coube: ${w}x${h} em ${M.larg}x${M.alt}`);
  /* e uma ampliação acima já não caberia */
  const w2 = janela.merX(P.bbox[2], M.z + 1) - janela.merX(P.bbox[0], M.z + 1);
  const h2 = janela.merY(P.bbox[1], M.z + 1) - janela.merY(P.bbox[3], M.z + 1);
  assert.ok(w2 > M.larg || h2 > M.alt, 'ficou mais afastado do que precisava');
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
  assert.ok(Math.abs(janela.merLon(M.cx, M.z) - (P.bbox[0] + P.bbox[2]) / 2) < 1e-6);
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
  await janela.guardarCarta('https://c/{z}/{x}/{y}.png', 'X', 'https://t', '15');
  comTeatro();
  janela.enquadrarMapa(2000, 620);
  assert.ok(avaliar(janela, 'MAPA').z <= 15, 'passou da ampliação que o serviço dá');
});

test('retirar o serviço leva com ele os mosaicos que dele vieram', semAplicacao, async () => {
  await janela.guardarCarta('https://c/{z}/{x}/{y}.png', 'X', 'https://t', 19);
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
