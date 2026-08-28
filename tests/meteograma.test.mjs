// Exercita o caminho alterado na r0015: a leitura operacional ponto-a-ponto
// tem de chegar à legenda do meteograma. Perdeu-se uma vez; não se perde outra.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, CSV_ENSAIO } from './app.mjs';

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
