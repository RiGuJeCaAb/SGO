// O mínimo exigido ao navegador, declarado em vez de suposto.
//
// Achado do ramo #005 na auditoria de portabilidade da r0087, medido em Chromium 141 com
// perfil vazio a partir de `file://`. O código está em ES2020 — Chrome 80 —, mas a folha de
// estilo usa `color-mix()`, que é de Chrome 111. É o CSS que fixa o mínimo, e não o
// JavaScript, o que não é intuitivo e por isso fica escrito.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { abrirAplicacao, avaliar } from './app.mjs';
import { revisaoMaisRecente } from '../ferramentas/verificar.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const recente = await revisaoMaisRecente();
const APP = recente ? await readFile(recente, 'utf8') : '';

test('o mínimo declarado é o que o CSS exige, e não o que o JavaScript exige', semAplicacao, () => {
  const M = avaliar(janela, 'MINIMO_NAVEGADOR');
  assert.match(M.versao, /111/, 'o `color-mix` é de Chrome/Edge 111');
  assert.match(M.prova, /color-mix/, 'a prova tem de ser a construção que fixa o mínimo');
});

test('o mínimo não se declara ao acaso: o color-mix está mesmo na folha de estilo', semAplicacao, () => {
  /* Se alguém tirar o `color-mix` do CSS, o mínimo desce e esta declaração passa a mentir
     para cima — a exigir de um posto um navegador que já não faz falta. */
  const estilo = APP.slice(0, APP.indexOf('</style>'));
  const n = (estilo.match(/color-mix\(/g) || []).length;
  assert.ok(n > 0, 'não há `color-mix` na folha de estilo, e o mínimo declarado deixou de valer');
});

test('a deteção pergunta ao motor, e não ao userAgent', semAplicacao, () => {
  /* O `userAgent` é reescrito por qualquer coisa — extensões, políticas de empresa, o
     próprio utilizador. `CSS.supports` responde pelo motor. */
  const fonte = APP;
  assert.match(fonte, /CSS\.supports\(/);
  assert.doesNotMatch(fonte.slice(fonte.indexOf('function navegadorAcimaDoMinimo'), fonte.indexOf('function navegadorAcimaDoMinimo') + 400),
    /userAgent/, 'a deteção não pode olhar para o userAgent');
});

test('num navegador que suporta color-mix, o carimbo não aparece', semAplicacao, () => {
  janela.eval('window.CSS = { supports: () => true }');
  janela.carimbarMinimoNavegador();
  const el = janela.document.getElementById('min-nav');
  assert.equal(el.style.display, 'none');
  assert.equal(el.innerHTML, '');
});

test('num navegador abaixo do mínimo, o carimbo aparece e diz o que se perde', semAplicacao, () => {
  /* A degradação não é cosmética: um campo inválido que perde o anel vermelho continua a
     parecer normal, e uma caixa de aviso sem cor deixa de avisar. É pior do que falhar. */
  janela.eval('window.CSS = { supports: () => false }');
  janela.carimbarMinimoNavegador();
  const el = janela.document.getElementById('min-nav');
  assert.notEqual(el.style.display, 'none');
  assert.match(el.textContent, /NAVEGADOR ABAIXO DO MÍNIMO/);
  assert.match(el.textContent, /111/);
  assert.match(el.textContent, /sem cor/);
  assert.match(el.textContent, /O resto funciona/, 'declara-se, não se bloqueia');
});

test('sem CSS.supports conta como abaixo do mínimo, e não rebenta', semAplicacao, () => {
  /* Um navegador sem `CSS.supports` é anterior a tudo o que interessa. E a deteção não pode
     lançar: seria uma exceção no arranque por causa de umas cores. */
  janela.eval('window.CSS = undefined');
  assert.equal(janela.navegadorAcimaDoMinimo(), false);
  janela.carimbarMinimoNavegador();
  assert.match(janela.document.getElementById('min-nav').textContent, /ABAIXO DO MÍNIMO/);
});

test('o carimbo vive no rodapé e não numa caixa que se feche', semAplicacao, () => {
  /* É uma condição permanente da máquina, não um acontecimento. Uma caixa que se fecha
     esconderia o que não deixa de ser verdade; uma que não se fecha tapava o trabalho. */
  assert.match(APP, /<div id="min-nav" class="min-nav"[^>]*><\/div>\s*<footer>/);
});
