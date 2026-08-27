import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extrairScripts, juntar, linhaOrigem } from '../ferramentas/extrair.mjs';

const valido = await readFile(new URL('./fixtures/valido.html', import.meta.url), 'utf8');

test('ignora scripts externos e blocos de dados', () => {
  const blocos = extrairScripts(valido);
  assert.equal(blocos.length, 1);
  assert.match(blocos[0].codigo, /const saudacao/);
});

test('regista a linha do HTML em que o bloco começa', () => {
  const [bloco] = extrairScripts(valido);
  assert.equal(bloco.linha, 8);
});

test('reconhece o tipo module', () => {
  const blocos = extrairScripts('<script type="module">const x = 1;</script>');
  assert.equal(blocos.length, 1);
});

test('não confunde um atributo src de outro elemento', () => {
  const blocos = extrairScripts('<img src="a.png">\n<script>const y = 1;</script>');
  assert.equal(blocos.length, 1);
});

test('junta os blocos anotando a origem', () => {
  const { codigo } = juntar(extrairScripts(valido));
  assert.match(codigo, /origem: linha 8 do HTML/);
});

test('o mapa traduz a linha do código junto de volta ao HTML', () => {
  const { codigo, mapa } = juntar(extrairScripts(valido));
  const linhaDaConstante = codigo.split('\n').findIndex((l) => l.includes('const saudacao')) + 1;
  assert.equal(linhaOrigem(mapa, linhaDaConstante), 9);
});

test('a linha de anotação não tem origem no HTML', () => {
  const { mapa } = juntar(extrairScripts(valido));
  assert.equal(linhaOrigem(mapa, 1), null);
});

test('ficheiro sem scripts devolve lista vazia', () => {
  assert.deepEqual(extrairScripts('<p>sem código</p>'), []);
});
