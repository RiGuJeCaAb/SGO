// A análise de código morto: o que está escrito e ninguém usa.
//
// A ferramenta só vale se a lista que imprime for de confiar. Um falso positivo ensina
// quem a lê a ignorá-la, e um falso negativo deixa passar o que ela existe para apanhar.
// É por isso que o que se testa aqui é sobretudo a leitura do código — saber em que
// cadeia se está, reconhecer uma expressão regular, entrar num ${...}.

import test from 'node:test';
import assert from 'node:assert/strict';
import { textoDosLiterais, textoDosAtributos, aparece, idsNoEstilo, classesDefinidas,
  idsDefinidos, idsProcurados, podeSerExpressao, SABIDOS, analisar } from '../ferramentas/morto.mjs';
import { revisaoMaisRecente } from '../ferramentas/verificar.mjs';

/* ---- ler cadeias ---- */

test('apanha os literais simples, das três espécies', () => {
  const t = textoDosLiterais('a("um"); b(\'dois\'); c(`três`);');
  assert.ok(t.includes('um') && t.includes('dois') && t.includes('três'));
});

test('uma aspa dentro de plicas não abre uma cadeia', () => {
  /* Era este o defeito: `'<path class="'` abria um par falso que engolia o literal
     seguinte, e classes vivas apareciam mortas. */
  const t = textoDosLiterais('x = \'<path class="\'+(v? "gm":"gm-x")+\'"/>\';');
  assert.ok(aparece(t, 'gm'), 'perdeu gm');
  assert.ok(aparece(t, 'gm-x'), 'perdeu gm-x');
});

test('entra no ${...} de uma cadeia de crase e lê o que lá está', () => {
  const t = textoDosLiterais('h = `<td class="${d? "dec" : "mold"}">${esc(x)}</td>`;');
  assert.ok(aparece(t, 'dec'), 'perdeu dec');
  assert.ok(aparece(t, 'mold'), 'perdeu mold');
  assert.ok(aparece(t, 'td'), 'perdeu o texto de fora do buraco');
});

test('um ${...} com chavetas lá dentro não desalinha a leitura', () => {
  const t = textoDosLiterais('h = `<i class="${ (function(){ return "viva"; })() }">fim</i>`;');
  assert.ok(aparece(t, 'viva'));
  assert.ok(aparece(t, 'fim'), 'não voltou à cadeia depois do buraco');
});

test('as aspas de uma expressão regular não abrem cadeia', () => {
  const t = textoDosLiterais('s.replace(/[&<>"]/g, c=>M[c]); id("vivo");');
  assert.ok(aparece(t, 'vivo'), 'a expressão regular desalinhou a leitura');
});

test('distingue a barra que divide da que abre expressão', () => {
  assert.equal(podeSerExpressao('x = /ab/', 4), true);
  assert.equal(podeSerExpressao('return /ab/', 7), true);
  assert.equal(podeSerExpressao('a / b', 2), false, 'depois de um valor, a barra divide');
});

test('o escapado não fecha a cadeia', () => {
  /* O código analisado é `x = "diz \" e continua"; y("depois");` — a aspa escapada fica
     dentro da cadeia, e o literal seguinte tem de ser lido na mesma. */
  const t = textoDosLiterais(String.raw`x = "diz \" e continua"; y("depois");`);
  assert.ok(aparece(t, 'depois'), 'a aspa escapada fechou a cadeia');
  assert.ok(aparece(t, 'continua'), 'perdeu o resto da cadeia');
});

test('o que está em comentário não conta como dado', () => {
  const t = textoDosLiterais('// "fantasma"\nx("real");');
  assert.ok(aparece(t, 'real'));
  assert.ok(!aparece(t, 'fantasma'));
});

/* ---- ler o HTML e a folha de estilo ---- */

test('o valor de id não conta como uso de si próprio', () => {
  const t = textoDosAtributos('<div id="x" class="y" data-z="w"></div>');
  assert.ok(!aparece(t, 'x'), 'o id contava-se a si próprio e a análise dava zero');
  assert.ok(aparece(t, 'y') && aparece(t, 'w'));
});

test('uma cor em hexadecimal não é um identificador', () => {
  const s = idsNoEstilo('.a{color:#B00000;background:#fff}#mesmo{top:0}');
  assert.deepEqual([...s], ['mesmo']);
});

test('as classes lêem-se do seletor, não das declarações', () => {
  const s = classesDefinidas('.a .b{background:url(x.b)}');
  assert.deepEqual([...s].sort(), ['a', 'b']);
});

test('os id do HTML e os que o código procura', () => {
  assert.ok(idsDefinidos('<i id="a"><b id="b">').has('b'));
  const p = idsProcurados('$("um"); document.getElementById("dois");');
  assert.deepEqual([...p].sort(), ['dois', 'um']);
});

test('«aparece» exige a palavra inteira', () => {
  assert.equal(aparece('classe evo-i tipo', 'evo-i'), true);
  assert.equal(aparece('evo-item', 'evo'), false, 'prefixo não é a palavra');
  assert.equal(aparece('a evo', 'evo'), true);
});

/* ---- o que a ferramenta sabe que não vê ---- */

test('cada exceção declarada diz onde é composta, ou porque fica', () => {
  SABIDOS.classes.forEach((x) => {
    assert.match(x.prefixo, /-$/, x.prefixo + ' devia ser prefixo');
    assert.ok(x.onde && x.onde.length > 10, x.prefixo + ' sem o sítio que a compõe');
  });
  SABIDOS.ids.forEach((x) => assert.ok(x.porque && x.porque.length > 10, x.id + ' sem razão'));
});

/* ---- sobre a entrega ---- */

const alvo = await revisaoMaisRecente('app');
const semAplicacao = { skip: alvo ? false : 'sem revisão em app/' };

test('a entrega não procura um identificador que não exista', semAplicacao, async () => {
  /* É o defeito que já aconteceu: a lista do fecho à escrita apontava para três
     identificadores que já não existiam, e a exportação ficava bloqueada em silêncio. */
  const r = await analisar(alvo);
  assert.deepEqual(r.idsQueFaltam, []);
  assert.deepEqual(r.idsSoNoEstilo, []);
});

test('a entrega não tem código morto por ler', semAplicacao, async () => {
  const r = await analisar(alvo);
  assert.deepEqual(r.idsSemUso, []);
  assert.deepEqual(r.classesSemUso, []);
  assert.deepEqual(r.funcoesSoDeclaradas, []);
});
