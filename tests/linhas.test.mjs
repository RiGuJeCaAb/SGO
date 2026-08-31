// Linhas de contenção e de apoio.
//
// O que distingue isto de um traço bonito é a conta: Byram (1959), por Fernandes (2003),
// dá a largura mínima para suster uma frente — uma vez e meia o comprimento da chama. Uma
// linha desenhada confronta-se com essa largura, e a aplicação diz se aguenta.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));
const TRACO_L = [[41.09, -7.83], [41.09, -7.80]];

function comTeatro() {
  janela.eval('O = novoEstado(); SERIE = []');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,0975'; O.meta.lon = '-7,8103';
  const e = janela.estObj(); e.n = 2; janela.renderSetores();
  return O;
}

function tracarLinha(tipo, larg, pontos) {
  janela.iniciarTraco(-1, 'linha');
  (pontos || TRACO_L).forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  const t = janela.document.getElementById('linha-tipo');
  t.innerHTML = '<option value="contencao"></option><option value="apoio"></option>';
  t.value = tipo || 'contencao';
  janela.document.getElementById('linha-larg').value = larg === undefined ? '' : String(larg);
  return janela.fecharTraco();
}

/* Uma intensidade que exige 3,3 m de largura: 240 m/h × 12 t/ha = 1440 kW/m, chama 2,19 m. */
function comIntensidade() {
  const O = avaliar(janela, 'O');
  O.dados.fogo.r = '240'; O.dados.fogo.w = '12';
}

beforeEach(async () => { if (janela) await janela.largarTeclado(); janela?.largarTraco(); });

/* ---- as espécies ---- */

test('as duas espécies de linha são as que a carta anotada distingue', semAplicacao, () => {
  const T = avaliar(janela, 'TIPOS_LINHA');
  assert.equal(T.length, 2);
  assert.equal(T.find((t) => t.k === 'contencao').obra, true, 'a de contenção é obra a abrir');
  assert.equal(T.find((t) => t.k === 'apoio').obra, false, 'a de apoio já lá está');
  T.forEach((t) => assert.match(t.cor, /^#[0-9A-Fa-f]{6}$/, t.k));
});

test('uma espécie desconhecida cai em apoio', semAplicacao, () => {
  assert.equal(janela.defLinha('inventada').k, 'apoio');
});

/* ---- traçar ---- */

test('uma linha precisa de dois vértices', semAplicacao, () => {
  comTeatro();
  janela.iniciarTraco(-1, 'linha');
  janela.pontoDoTraco(41.09, -7.83);
  assert.equal(janela.faltamAoTraco(), 1);
  assert.equal(janela.fecharTraco().ok, false);
});

test('o mesmo traçado serve os três desenhos, com mínimos próprios', semAplicacao, () => {
  comTeatro();
  [['limite', 3, 0], ['frente', 2, -1], ['linha', 2, -1]].forEach(([t, min, i]) => {
    janela.largarTraco();
    assert.ok(janela.iniciarTraco(i, t).ok, t);
    assert.equal(janela.faltamAoTraco(), min, t);
  });
});

test('uma linha de contenção nasce por abrir; uma de apoio nasce aberta', semAplicacao, () => {
  /* É a diferença entre o que está no plano e o que já está no terreno. */
  comTeatro();
  assert.equal(tracarLinha('contencao', 4).linha.aberta, false);
  assert.equal(tracarLinha('apoio', 6).linha.aberta, true);
});

test('a largura por indicar não é largura zero', semAplicacao, () => {
  comTeatro();
  const l = tracarLinha('contencao').linha;
  assert.equal(l.larguraM, null);
  assert.equal(janela.linhaBasta(l), null, 'julgou uma linha sem largura declarada');
});

test('traçar grava comprimento, setor e evolução', semAplicacao, () => {
  const O = comTeatro();
  janela.iniciarTraco(0, 'limite');
  [[41.08, -7.84], [41.08, -7.79], [41.10, -7.79], [41.10, -7.84]].forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  janela.fecharTraco();
  const r = tracarLinha('contencao', '4,5');
  assert.ok(r.ok, r.motivo);
  assert.equal(r.linha.setor, 'Alfa');
  assert.ok(r.linha.m > 2000 && r.linha.m < 3000, 'comprimento ' + r.linha.m);
  assert.equal(r.linha.larguraM, 4.5, 'não aceitou a vírgula decimal');
  assert.ok(O.evolucao.some((x) => /Linha de contenção traçada no setor Alfa/.test(x.txt)));
});

/* ---- o confronto com a intensidade ---- */

test('a linha que aguenta di-lo, com a fonte do número', semAplicacao, () => {
  comTeatro(); comIntensidade();
  const l = tracarLinha('contencao', 5).linha;
  const b = janela.linhaBasta(l);
  assert.equal(b.basta, true);
  assert.ok(Math.abs(b.precisa - 3.3) < 0.1, 'precisa ' + b.precisa);
  const t = janela.leituraDasLinhas();
  assert.match(t, /Aguenta: 5 m para os 3,3 m/);
  assert.match(t, /Byram 1959/);
});

test('a linha que não aguenta é destacada, e diz-se quanto lhe falta', semAplicacao, () => {
  comTeatro(); comIntensidade();
  tracarLinha('contencao', 2);
  const t = janela.leituraDasLinhas();
  assert.match(t, /\*\*Não aguenta: 2 m para os 3,3 m/);
});

test('sem intensidade não se julga a linha, e diz-se porquê', semAplicacao, () => {
  comTeatro();
  tracarLinha('contencao', 5);
  assert.match(janela.leituraDasLinhas(), /Sem a intensidade da frente não há com que dizer se aguenta/);
});

test('a leitura repete o pressuposto de Byram sobre as faúlhas', semAplicacao, () => {
  /* É o que falha primeiro num incêndio de verão no Douro: com projeção de faúlhas com
     capacidade de ignição, nenhuma destas larguras garante o que promete. */
  comTeatro(); comIntensidade();
  tracarLinha('contencao', 5);
  assert.match(janela.leituraDasLinhas(), /projeção de faúlhas com capacidade de ignição/);
});

test('o que não aguenta vem à frente do que está por abrir, e este do resto', semAplicacao, () => {
  /* Numa leitura em voz alta o que interessa vem à cabeça. */
  comTeatro(); comIntensidade();
  tracarLinha('apoio', 9);                 /* aguenta e está aberta: fica para o fim */
  tracarLinha('contencao', 8);             /* aguenta, por abrir: fica no meio */
  tracarLinha('contencao', 1, [[41.11, -7.83], [41.11, -7.80]]);  /* não aguenta: vem primeiro */
  const t = janela.leituraDasLinhas();
  /* Compara-se pela largura de cada uma, que é única: procurar «Por abrir» não serve,
     porque a linha que não aguenta também está por abrir e traz as duas frases. */
  const onde = larg => t.indexOf('por ' + larg + ' m de largura útil');
  assert.ok(onde(1) >= 0 && onde(8) >= 0 && onde(9) >= 0, t);
  assert.ok(onde(1) < onde(8), 'a que não aguenta devia vir primeiro');
  assert.ok(onde(8) < onde(9), 'a que está por abrir devia vir antes da que já está aberta');
});

/* ---- abrir, retirar, encerrar ---- */

test('uma linha de contenção dá-se por aberta, e volta atrás', semAplicacao, () => {
  const O = comTeatro();
  const l = tracarLinha('contencao', 4).linha;
  assert.ok(janela.abrirLinha(l.id, true).ok);
  assert.equal(janela.linhasLista()[0].aberta, true);
  assert.ok(O.evolucao.some((x) => /dada por aberta/.test(x.txt)));
  janela.abrirLinha(l.id, false);
  assert.equal(janela.linhasLista()[0].aberta, false);
  assert.equal(janela.abrirLinha('inexistente', true).ok, false);
});

test('uma linha pode ser retirada', semAplicacao, () => {
  comTeatro();
  const l = tracarLinha('apoio', 6).linha;
  assert.ok(janela.apagarLinha(l.id).ok);
  assert.equal(janela.linhasLista().length, 0);
  assert.equal(janela.apagarLinha('inexistente').ok, false);
});

test('com o registo encerrado não se traça, não se abre nem se retira', semAplicacao, () => {
  comTeatro();
  const l = tracarLinha('contencao', 4).linha;
  const O = avaliar(janela, 'O');
  O.encerramento.g = '311200AGO26'; O.encerramento.por = 'Cmdt A';
  assert.equal(tracarLinha('contencao', 4).ok, false);
  assert.equal(janela.abrirLinha(l.id, true).ok, false);
  assert.equal(janela.apagarLinha(l.id).ok, false);
  O.encerramento.g = ''; O.encerramento.por = '';
});

/* ---- o estado ---- */

test('uma ocorrência da versão 20 abre sem linhas, e não as deduz', semAplicacao, () => {
  const m = janela.migrarGravado({
    versao: 20, meta: { num: '2026/900' }, pco: { funcoes: [] },
    dados: { est: { n: 1, setores: [{}] } },
  });
  assert.equal(m.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.deepEqual(daqui(m.dados.linhas), []);
});

test('as linhas viajam na exportação, e entram na leitura da evolução', semAplicacao, () => {
  comTeatro(); comIntensidade();
  tracarLinha('contencao', '4,5');
  const txt = janela.exportarOcorrencia();
  const v = JSON.parse(typeof txt === 'string' ? txt : JSON.stringify(txt));
  const LN = (v.estado || v).dados.linhas;
  assert.equal(LN.length, 1);
  assert.equal(LN[0].larguraM, 4.5);
  /* e a leitura da evolução inclui as linhas mesmo sem frentes traçadas */
  assert.match(janela.evolucaoEmTexto(), /Linha de contenção/);
});
