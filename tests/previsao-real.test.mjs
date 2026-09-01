// Uma previsão real, do princípio ao fim da cadeia.
//
// O `CSV_ENSAIO` que os outros testes usam é escrito à mão: tem as horas que interessam e
// nada mais. Serve para exercitar a leitura, não para provar que a aplicação aguenta um
// ficheiro como os que saem do serviço — 240 horas seguidas, com decimais, precipitação a
// zeros e uma data que muda de mês a meio.
//
// Este ficheiro é uma exportação verdadeira do SpotWx, chegada com o descarregamento de 1 de
// setembro. **Não se edita**: um ficheiro alterado à mão deixa de provar o que o serviço
// devolve.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { abrirAplicacao } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const CSV = await readFile(new URL('./fixtures/spotwx-previsao-real.csv', import.meta.url), 'utf8');

test('a previsão real lê-se inteira, sem hora perdida pelo caminho', semAplicacao, () => {
  const S = janela.parseCSV(CSV);
  const linhas = CSV.trim().split(/\r?\n/).length - 1;
  assert.equal(S.length, linhas, 'toda a linha do ficheiro tem de dar uma hora da série');
  assert.ok(S.length > 200, `só ${S.length} horas: o ficheiro tem dez dias`);
});

test('todos os campos saem como número, e nenhum sai NaN', semAplicacao, () => {
  // Uma hora com NaN não rebenta nada: desenha-se em branco no meteograma e desaparece da
  // análise. É a forma mais silenciosa de perder previsão.
  for (const p of janela.parseCSV(CSV)) {
    for (const k of ['t', 'rh', 'wd', 'ws', 'pr']) {
      assert.ok(Number.isFinite(p[k]), `${k} não é número na hora ${p.d} ${p.h}: ${p[k]}`);
    }
    assert.ok(p.h >= 0 && p.h <= 23, `hora fora de horas: ${p.h}`);
    assert.ok(p.rh >= 0 && p.rh <= 100, `humidade fora de escala: ${p.rh}`);
    assert.ok(p.wd >= 0 && p.wd <= 360, `rumo fora da rosa: ${p.wd}`);
  }
});

test('a série atravessa a mudança de mês sem se desordenar', semAplicacao, () => {
  // O ficheiro vai de 26 de agosto a 5 de setembro. Uma ordenação por texto poria setembro
  // antes de agosto, e a janela de trabalho sairia trocada.
  const S = janela.parseCSV(CSV);
  const dias = [...new Set(S.map((p) => p.d))];
  assert.ok(dias.some((d) => /^2[6-9]\/08/.test(d)), 'tem dias de agosto');
  assert.ok(dias.some((d) => /\/09/.test(d)), 'e dias de setembro');
  assert.equal(S[0].d, dias[0], 'a primeira hora é do primeiro dia');
});

test('a análise pronuncia-se sobre a previsão real, em vez de se calar', semAplicacao, () => {
  const S = janela.parseCSV(CSV);
  const a = janela.analisar(S);
  assert.ok(Number.isFinite(a.rhMin.rh) && Number.isFinite(a.tMax.t),
    'os extremos do ciclo têm de sair da série real');
  assert.ok(a.rhMin.rh < a.rhMax.rh, 'o mínimo de humidade é menor que a recuperação');
  assert.ok(a.tMax.t > a.tMin.t, 'e a máxima é maior que a mínima');
  const leituras = S.map((p) => janela.leitura(p, a));
  assert.ok(leituras.some((l) => l), 'dez dias de previsão sem uma única leitura seria suspeito');
});

test('o meteograma desenha a previsão real sem rebentar', semAplicacao, () => {
  // A série de ensaio tem cinco horas. Esta tem duzentas e quarenta, e é onde uma escala mal
  // calculada ou uma divisão por zero aparece.
  const S = janela.parseCSV(CSV);
  const svg = janela.svgMeteo(S, janela.analisar(S));
  assert.match(svg, /^<svg/, 'tem de sair SVG');
  assert.ok(!/NaN|Infinity|undefined/.test(svg), 'nenhuma coordenada pode sair NaN ou Infinity');
});
