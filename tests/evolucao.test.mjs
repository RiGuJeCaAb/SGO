// A leitura escrita da evolução das frentes.
//
// A seta no mapa diz para onde a frente aponta. Isto diz o que se segue. O que se testa
// aqui é sobretudo **o que a leitura não pode dizer**: sem velocidade de propagação não há
// distância percorrida nem hora de chegada, e uma leitura que as afirmasse seria pior do
// que não existir.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const LINHA = [[41.10, -7.82], [41.10, -7.81]];

function comTeatro(n = 2) {
  janela.eval('O = novoEstado(); SERIE = []');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,0975'; O.meta.lon = '-7,8103';
  const e = janela.estObj(); e.n = n;
  janela.renderSetores();
  return O;
}

function tracarFrente(tipo, rumo, linha) {
  janela.iniciarTraco(-1, 'frente');
  (linha || LINHA).forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  const t = janela.document.getElementById('frente-tipo');
  t.innerHTML = '<option value="cabeca"></option><option value="flanco"></option><option value="retaguarda"></option>';
  t.value = tipo || 'cabeca';
  janela.document.getElementById('frente-rumo').value = rumo === undefined ? '' : String(rumo);
  return janela.fecharTraco();
}

beforeEach(async () => { if (janela) await janela.largarTeclado(); janela?.largarTraco(); });

/* ---- o que a leitura nunca diz ---- */

test('a leitura não afirma distância percorrida, hora de chegada nem área', semAplicacao, () => {
  /* É a fronteira do que a aplicação sustenta. Sem a velocidade básica do combustível não
     há nenhuma das três, e escrever qualquer uma seria inventar. */
  comTeatro();
  tracarFrente('cabeca', 135);
  janela.eval('O.dados.topo.orient = "S"; O.dados.topo.eps = "1"; SERIE = [{h:14,d:"31-08",ws:25,wd:315},{h:15,d:"31-08",ws:30,wd:340}]');
  const t = janela.evolucaoEmTexto();
  assert.ok(t.length > 50, 'leitura vazia');
  [/\bem \d+ ?h(oras)?\b/i, /chega\b/i, /\bàs \d+h\d* o fogo/i, /hectares previstos/i, /vai percorrer/i]
    .forEach((re) => assert.ok(!re.test(t), 'a leitura afirmou o que não sabe: ' + re));
  /* e di-lo por escrito */
  assert.match(t, /O que esta leitura não afirma/);
  assert.match(t, /velocidade básica do combustível/);
});

test('sem frentes não há leitura, e diz-se', semAplicacao, () => {
  comTeatro();
  assert.equal(janela.leituraDaEvolucao().vazio, true);
  assert.equal(janela.evolucaoEmTexto(), '');
});

/* ---- o que a leitura diz ---- */

test('a leitura de uma cabeça dá secção, extensão e rumo com a sua origem', semAplicacao, () => {
  comTeatro();
  tracarFrente('cabeca', 135);
  const L = janela.leituraDaEvolucao();
  assert.equal(L.frentes.length, 1);
  const t = L.frentes[0].texto;
  assert.match(t, /Cabeça/);
  assert.match(t, /m de extensão/);
  assert.match(t, /Progride para SE \(135°\), rumo indicado/);
});

test('a retaguarda diz porque não tem progressão, e cita a fonte', semAplicacao, () => {
  comTeatro();
  tracarFrente('retaguarda');
  const t = janela.leituraDaEvolucao().frentes[0].texto;
  assert.match(t, /não tem direção de progressão/);
  assert.match(t, /Fernandes \(2003\)/);
  assert.ok(!/Progride para/.test(t));
});

test('a divergência entre o rumo declarado e o previsto é assinalada', semAplicacao, () => {
  /* É a pergunta que se faz a quem está no terreno: mudou o vento, ou o rumo precisa de
     ser revisto? Não é uma correção automática — quem vê o fogo tem razões que o modelo
     não tem. */
  comTeatro();
  janela.eval('O.dados.topo.orient = "S"; O.dados.topo.eps = "1"; SERIE = [{h:14,d:"31-08",ws:25,wd:0}]');
  const prev = janela.rumoPrevistoDaCabeca();
  assert.ok(prev, 'sem rumo previsto este teste não diz nada');
  /* declara-se um rumo a mais de 20° do previsto */
  tracarFrente('cabeca', janela.normalizarGraus(prev.rumo + 90));
  const t = janela.leituraDaEvolucao().frentes[0].texto;
  assert.match(t, /\*\*A composição de declive e vento dá/, 'a divergência devia estar destacada');
  assert.match(t, /Ou o vento mudou|rumo precisa de ser revisto/);
});

test('quando o rumo declarado bate com o previsto, diz-se que confirma', semAplicacao, () => {
  comTeatro();
  janela.eval('O.dados.topo.orient = "S"; O.dados.topo.eps = "1"; SERIE = [{h:14,d:"31-08",ws:25,wd:0}]');
  const prev = janela.rumoPrevistoDaCabeca();
  tracarFrente('cabeca', Math.round(prev.rumo));
  assert.match(janela.leituraDaEvolucao().frentes[0].texto, /confirma o rumo declarado/);
});

/* ---- o corredor de progressão ---- */

test('o que está no corredor sai por distância, e o que está atrás não sai', semAplicacao, () => {
  comTeatro();
  /* a frente corre de poente para nascente a 41,10; progride para sul (180°) */
  tracarFrente('cabeca', 180);
  /* um ponto a sul, no corredor; outro a norte, atrás dela */
  janela.marcarPonto('agua', 41.085, -7.815, 'charca ao sul');
  janela.marcarPonto('zcr', 41.120, -7.815, 'ZCR ao norte');
  const t = janela.leituraDaEvolucao().frentes[0].texto;
  assert.match(t, /charca ao sul/);
  assert.ok(!/ZCR ao norte/.test(t), 'pôs no corredor o que está atrás da frente');
});

test('o corredor é uma janela declarada, e cada item traz o seu rumo', semAplicacao, () => {
  /* A meia-abertura é uma escolha de leitura, não uma afirmação sobre a largura da frente.
     Por isso cada item sai com o rumo a que está: quem lê julga por si. */
  assert.equal(avaliar(janela, 'CORREDOR_GRAUS'), 30);
  comTeatro();
  tracarFrente('cabeca', 180);
  janela.marcarPonto('agua', 41.085, -7.815, 'charca');
  assert.match(janela.leituraDaEvolucao().frentes[0].texto, /charca \(ponto de água\) a 1,7 km, SSE/);
});

test('corredor vazio não é terreno livre, e a leitura não o confunde', semAplicacao, () => {
  comTeatro();
  tracarFrente('cabeca', 180);
  const t = janela.leituraDaEvolucao().frentes[0].texto;
  assert.match(t, /não que o terreno esteja livre/);
});

test('um setor delimitado à frente entra no corredor', semAplicacao, () => {
  comTeatro();
  janela.iniciarTraco(1, 'limite');
  [[41.07, -7.83], [41.07, -7.79], [41.09, -7.79], [41.09, -7.83]].forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  janela.fecharTraco();
  tracarFrente('cabeca', 180);
  assert.match(janela.leituraDaEvolucao().frentes[0].texto, /Setor Bravo \(setor\)/);
});

/* ---- o giro da cabeça ao longo da série ---- */

test('sem a razão declive/vento não há giro nenhum, nem um giro de zero graus', semAplicacao, () => {
  /* `isFinite(null)` é `true` em JavaScript, porque `Number(null)` é zero. Sem ε a
     composição devolve `cabeca` a `null`, e o `isFinite` global deixava-o passar por um
     rumo de 0°: a leitura escrevia «a cabeça mantém-se a norte» quando a verdade era que
     não havia com que a calcular. Este teste existe por causa disso. */
  comTeatro();
  tracarFrente('cabeca', 135);
  janela.eval('O.dados.topo.orient = "S"; SERIE = [{h:12,d:"31-08",ws:10,wd:0},{h:14,d:"31-08",ws:28,wd:90}]');
  assert.equal(janela.rumoPrevistoDaCabeca(), null);
  assert.equal(janela.giroDaCabeca(), null);
  assert.equal(janela.leituraDaEvolucao().giro, '');
});

test('o rumo da cabeça roda com o vento, e é isso que se prevê', semAplicacao, () => {
  /* A previsão que a aplicação sustenta: não quando o fogo chega, mas para onde vai estar
     a apontar de hora a hora. */
  comTeatro();
  tracarFrente('cabeca', 135);
  janela.eval('O.dados.topo.orient = "S"; O.dados.topo.eps = "1"; SERIE = [{h:12,d:"31-08",ws:10,wd:0},{h:14,d:"31-08",ws:28,wd:90},{h:16,d:"31-08",ws:20,wd:180}]');
  const L = janela.leituraDaEvolucao();
  assert.ok(L.giro, 'sem leitura de giro');
  assert.match(L.giro, /roda \d+°/);
  assert.match(L.giro, /É a direção que muda, não a hora de chegada/);
  assert.match(L.giro, /Vento mais forte às 14h \(28 km\/h/);
});

test('vento que não roda diz que não roda, em vez de calar', semAplicacao, () => {
  comTeatro();
  tracarFrente('cabeca', 135);
  janela.eval('O.dados.topo.orient = "S"; O.dados.topo.eps = "1"; SERIE = [{h:12,d:"31-08",ws:10,wd:270},{h:14,d:"31-08",ws:12,wd:272}]');
  assert.match(janela.leituraDaEvolucao().giro, /mantém-se em/);
});

test('sem série não há giro, e a falta é declarada', semAplicacao, () => {
  comTeatro();
  tracarFrente('cabeca', 135);
  const L = janela.leituraDaEvolucao();
  assert.equal(L.giro, '');
  assert.ok(L.limites.some((x) => /Sem série meteorológica/.test(x)));
});

test('as faltas que apertariam a previsão são ditas, uma a uma', semAplicacao, () => {
  comTeatro();
  tracarFrente('cabeca', 135);
  const L = janela.leituraDaEvolucao();
  assert.ok(L.limites.some((x) => /razão declive\/vento/.test(x)), 'não pediu o ε');
  assert.ok(L.limites.some((x) => /limites de setor/.test(x)), 'não disse que faltam limites');
  /* e deixam de ser ditas quando deixam de faltar */
  janela.eval('O.dados.topo.eps = "1,5"');
  assert.ok(!janela.leituraDaEvolucao().limites.some((x) => /razão declive\/vento/.test(x)));
});

/* ---- a geometria de apoio ---- */

test('a diferença de rumos dá sempre a volta pelo lado curto', semAplicacao, () => {
  assert.equal(janela.difRumo(10, 350), 20);
  assert.equal(janela.difRumo(350, 10), 20);
  assert.equal(janela.difRumo(0, 180), 180);
  assert.equal(janela.difRumo(90, 90), 0);
});

test('a distância mede-se da ponta mais próxima da frente, não do meio', semAplicacao, () => {
  /* Uma frente de dois quilómetros medida pelo meio poria a mil metros o que está
     encostado à ponta. */
  const linha = [[-7.82, 41.10], [-7.80, 41.10]];
  const p = janela.pontaMaisProxima(linha, 41.10, -7.8201);
  assert.ok(p.d < 20, 'mediu ' + p.d + ' m ao que está encostado à ponta');
  assert.ok(Math.abs(p.lon - (-7.82)) < 1e-9);
});

/* ---- a intensidade da frente ---- */

test('sem os dois números não há intensidade, e diz-se quais faltam', semAplicacao, () => {
  comTeatro();
  const t = janela.leituraDaIntensidade();
  assert.match(t, /velocidade de propagação/);
  assert.match(t, /carga de combustível/);
  assert.match(t, /não os\s+estima|não os estima/);
  /* e diz porquê, que é o que impede a pergunta seguinte */
  assert.match(t, /modelo de combustível calibrado/);
});

test('a intensidade de Byram sai da velocidade e da carga', semAplicacao, () => {
  /* I = R·w/2, com R em m/h e w em t/ha — Byram (1959) via Fernandes (2003).
     240 m/h × 12 t/ha / 2 = 1440 kW/m. */
  assert.equal(janela.intensidadeByram(240, 12), 1440);
  assert.equal(janela.intensidadeByram(0, 12), null, 'aceitou velocidade nula');
  assert.equal(janela.intensidadeByram(240, ''), null);
});

test('o comprimento da chama bate com as duas formulações correntes', semAplicacao, () => {
  /* I = 300·L² dá 3,65 m para 4000 kW/m; a outra formulação corrente, I = 258·L^2,17, dá
     3,54 m. As duas concordam onde interessa, que é o limite de ataque direto. */
  const L = janela.comprimentoDaChama(4000);
  assert.ok(Math.abs(L - 3.65) < 0.05, 'chama ' + L);
  const outra = Math.pow(4000 / 258, 1 / 2.17);
  assert.ok(Math.abs(L - outra) < 0.2, L + ' contra ' + outra);
});

test('os limites de manobra saem da intensidade, com as suas fontes', semAplicacao, () => {
  const m = janela.limitesDeManobra(240, 12);
  assert.equal(m.i, 1440);
  /* segurança: quatro vezes a altura da chama — Butler e Cohen (1998) */
  assert.equal(m.seguranca, Math.ceil(4 * m.chama));
  /* contenção: uma vez e meia o comprimento — Byram (1959) */
  assert.ok(Math.abs(m.contencao - 1.5 * m.chama) < 0.1);
  assert.equal(m.direto, true, '1440 kW/m está abaixo dos 4000');
});

test('acima dos 4000 kW/m o ataque direto à cabeça é desaconselhado, e destacado', semAplicacao, () => {
  comTeatro();
  const O = avaliar(janela, 'O');
  O.dados.fogo.r = '900'; O.dados.fogo.w = '15';
  const m = janela.limitesDeManobra('900', '15');
  assert.equal(m.i, 6750);
  assert.equal(m.direto, false);
  const t = janela.leituraDaIntensidade();
  assert.match(t, /\*\*Acima dos 4 000 kW\/m/);
  assert.match(t, /Alexander 2000/);
  assert.match(t, /Butler e Cohen 1998/);
  assert.match(t, /Byram 1959/);
});

test('a classe de dificuldade acompanha a intensidade', semAplicacao, () => {
  assert.match(janela.classeDaIntensidade(200).t, /ferramentas manuais/);
  assert.match(janela.classeDaIntensidade(1000).t, /Autotanques/);
  assert.match(janela.classeDaIntensidade(2500).t, /muito difícil/);
  assert.match(janela.classeDaIntensidade(9000).t, /extremos/);
});

test('a intensidade entra na leitura da evolução, e não numa leitura à parte', semAplicacao, () => {
  comTeatro();
  tracarFrente('cabeca', 175);
  const O = avaliar(janela, 'O');
  O.dados.fogo.r = '240'; O.dados.fogo.w = '12';
  assert.match(janela.evolucaoEmTexto(), /1 440 kW\/m|1440 kW\/m/);
});

/* ---- a vírgula decimal ---- */

test('a razão declive/vento aceita a vírgula, que é como se escreve em português', semAplicacao, () => {
  /* Defeito que já lá estava: `Number("1,5")` é NaN, e o efeito era pior do que um erro —
     a razão entrava como se estivesse por preencher, e a aplicação dizia «sem ε informado»
     a quem acabara de a informar, sem aviso nenhum. */
  const comVirgula = janela.comportamentoFogo({ orient: 'S', rumoVento: 315, eps: '1,5' });
  const comPonto = janela.comportamentoFogo({ orient: 'S', rumoVento: 315, eps: '1.5' });
  assert.equal(comVirgula.eps, 1.5);
  assert.equal(comVirgula.cabeca, comPonto.cabeca);
  /* e um campo mesmo vazio continua a não dar previsão nenhuma */
  assert.equal(janela.comportamentoFogo({ orient: 'S', rumoVento: 315, eps: '' }).cabeca, null);
});
