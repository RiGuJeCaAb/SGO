// Exercita o caminho alterado na r0015: a leitura operacional ponto-a-ponto
// tem de chegar à legenda do meteograma. Perdeu-se uma vez; não se perde outra.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar, CSV_ENSAIO } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };

// A aplicação arma temporizadores — a conformidade é reavaliada a cada 30 segundos.
// Sem fechar a janela, o processo de teste nunca termina.
after(() => janela?.close());

test('a aplicação carrega e expõe as funções do meteograma', semAplicacao, () => {
  assert.equal(typeof janela.parseCSV, 'function');
  assert.equal(typeof janela.analisar, 'function');
  assert.equal(typeof janela.svgMeteo, 'function');
  assert.equal(typeof janela.leitura, 'function');
});

test('a leitura classifica cada hora da série', semAplicacao, () => {
  const S = janela.parseCSV(CSV_ENSAIO);
  const a = janela.analisar(S);
  const leituras = S.map((p) => janela.leitura(p, a));

  assert.match(leituras[1], /Crítico/);
  assert.match(leituras[3], /ABERTURA da janela/);
  assert.match(leituras[4], /Assinatura convectiva/);
  assert.equal(leituras[0], '', 'hora sem nada a assinalar não inventa leitura');
});

test('a leitura chega à legenda do meteograma', semAplicacao, () => {
  const S = janela.parseCSV(CSV_ENSAIO);
  const svg = janela.svgMeteo(S, janela.analisar(S));
  const titulos = svg.match(/<title>[^<]*<\/title>/g) ?? [];

  assert.equal(titulos.length, S.length, 'uma legenda por hora');
  assert.match(titulos[1], /HR 15 % .* — Crítico/, 'dados e leitura na mesma legenda');
  assert.match(titulos[4], /Assinatura convectiva/);
});

test('a hora sem leitura mantém a legenda só com os dados', semAplicacao, () => {
  const S = janela.parseCSV(CSV_ENSAIO);
  const svg = janela.svgMeteo(S, janela.analisar(S));
  const primeiro = (svg.match(/<title>[^<]*<\/title>/g) ?? [])[0];

  assert.match(primeiro, /T 30 °C · HR 25 %/);
  assert.ok(primeiro.endsWith('0 mm</title>'), 'termina nos dados, sem sufixo de leitura');
});

test('corRH foi removida e não deixou quem a chamasse', semAplicacao, () => {
  assert.equal(typeof janela.corRH, 'undefined');
});

test('a separação de segmentos do topónimo continua a funcionar', semAplicacao, () => {
  // A correção do escape na classe de caracteres não pode alterar o comportamento.
  const partes = 'Vila Chã de Caria - Moimenta da Beira/Leomil'.split(/[—–,\-/]+/);
  assert.deepEqual(
    partes.map((x) => x.trim()).filter(Boolean),
    ['Vila Chã de Caria', 'Moimenta da Beira', 'Leomil'],
  );
});

/* ---- limiares declarados ---- */

/** Série horária mínima: `h` hora, `t` temperatura, `rh` HR, `wd` rumo, `ws` vento, `pr` precipitação. */
const serie = (linhas) => linhas.map((x, i) => ({
  h: i, d: '28AGO26', t: 30, rh: 40, wd: 0, ws: 20, pr: 0, ...x,
}));

test('uma rotação com vento fraco não é rotação', semAplicacao, () => {
  const L = avaliar(janela, 'LIMIARES_METEO');
  // 350° -> 30° são 40° pelo caminho curto: abaixo do limiar, seja qual for o vento
  assert.equal(janela.analisar(serie([{ wd: 350 }, { wd: 30 }])).rot.length, 0);

  // 350° -> 90° são 100°, mas com vento de 3 km/h a direção oscila sozinha
  const fraco = janela.analisar(serie([{ wd: 350, ws: 3 }, { wd: 90, ws: 3 }]));
  assert.equal(fraco.rot.length, 0, 'com vento fraco a direção não é sinal');

  const forte = janela.analisar(serie([{ wd: 350, ws: 22 }, { wd: 90, ws: 22 }]));
  assert.equal(forte.rot.length, 1);
  assert.equal(forte.rot[0].g, 100, 'a diferença é circular: 350 para 90 são 100 graus');
  assert.ok(forte.rot[0].ws >= L.rotVentoMin);
});

test('um décimo de milímetro não é assinatura convectiva', semAplicacao, () => {
  assert.equal(janela.analisar(serie([{ pr: 0.1 }, { pr: 0.1 }])).conv.length, 0);
  assert.equal(janela.analisar(serie([{ pr: 0.4 }, { pr: 0 }])).conv.length, 1);
});

test('uma hora isolada acima dos 50 % não é janela de consolidação', semAplicacao, () => {
  const isolada = janela.analisar(serie([{ rh: 40 }, { rh: 55 }, { rh: 40 }]));
  assert.equal(isolada.jan, null, 'não se monta um ataque numa hora');

  const util = janela.analisar(serie([{ rh: 40 }, { rh: 55 }, { rh: 60 }, { rh: 40 }]));
  assert.ok(util.jan, 'duas horas seguidas já são janela');
  assert.equal(util.jan.i.rh, 55);
  assert.equal(util.jan.f.rh, 60);
});

/* ---- a última previsão fica, e diz a idade ---- */

const doc = () => janela.document;
const est = () => avaliar(janela, 'O');

test('a previsão obtida guarda de onde veio, e para que ponto', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  doc().getElementById('f-csv').value = CSV_ENSAIO;
  janela.marcarMeteo('Open-Meteo', 'síntese ECMWF/ICON/GFS', '41.2029', '-7.2149', 36);
  const M = est().meteo;
  assert.equal(M.fonte, 'Open-Meteo');
  assert.equal(M.modelo, 'síntese ECMWF/ICON/GFS');
  assert.equal(M.lat, '41.2029');
  assert.equal(M.horas, 36);
  assert.ok(M.ts > 0 && M.g, 'sem instante não há idade');
  assert.match(M.sha, /^[0-9a-f]{64}$/, 'o resumo da série é o que denuncia a alteração à mão');
  assert.equal(M.mexido, false);
});

test('a idade lê-se, e passadas três horas avisa', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const M = janela.meteoObj();
  assert.equal(janela.idadeMeteo(), null, 'sem previsão não há idade nenhuma');

  M.fonte = 'Open-Meteo'; M.g = '301200AGO26';
  M.ts = janela.agora() - 1.5 * 3600000;
  assert.equal(janela.idadeMeteo().velha, false);
  janela.pintarMeteoIdade();
  assert.match(doc().getElementById('meteo-idade').textContent, /obtida há 1 h 30 min/);

  M.ts = janela.agora() - 5 * 3600000;
  assert.equal(janela.idadeMeteo().velha, true);
  janela.pintarMeteoIdade();
  const linha = doc().getElementById('meteo-idade');
  assert.match(linha.textContent, /DESATUALIZADA/);
  assert.equal(linha.style.fontWeight, '700', 'uma previsão velha não pode ler-se como uma fresca');
});

test('uma série mexida à mão depois de obtida é assinalada', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  doc().getElementById('f-csv').value = CSV_ENSAIO;
  janela.marcarMeteo('Open-Meteo', '', '41.2', '-7.2', 36);
  janela.analisarCSV(false);
  assert.equal(est().meteo.mexido, false, 'analisar o que veio não é mexer');

  // o oficial corrige uma linha antes de analisar — é para isso que o campo é editável
  doc().getElementById('f-csv').value = CSV_ENSAIO.replace(',30,25,', ',30,45,');
  janela.analisarCSV(false);
  assert.equal(est().meteo.mexido, true);
  assert.ok(est().fita.some((x) => /alterada à mão/.test(x.e)), 'a alteração tem de ficar na fita');

  janela.pintarMeteoIdade();
  assert.match(doc().getElementById('meteo-idade').textContent, /SÉRIE ALTERADA À MÃO/);
});

test('a previsão atravessa a migração com a proveniência vazia', semAplicacao, () => {
  const m = janela.migrarGravado({ versao: 13, meta: { num: '1' }, csv: 'x' });
  assert.equal(m.meteo.fonte, '', 'não se inventa de onde veio');
  assert.equal(m.meteo.ts, 0);
  assert.equal(m.meteo.mexido, false);
});
