import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analisarHTML, globaisPublicadas } from '../ferramentas/lint.mjs';

const orfa = await readFile(new URL('./fixtures/orfa.html', import.meta.url), 'utf8');
const valido = await readFile(new URL('./fixtures/valido.html', import.meta.url), 'utf8');

test('apanha a função órfã', async () => {
  const problemas = await analisarHTML(orfa);
  const achado = problemas.find((p) => p.regra === 'no-unused-vars');
  assert.ok(achado, 'a função órfã devia ter sido apanhada');
  assert.match(achado.mensagem, /orfa/);
  assert.equal(achado.linhaHTML, 5);
});

test('apanha a chamada a função que não existe', async () => {
  const problemas = await analisarHTML(orfa);
  const achado = problemas.find((p) => p.regra === 'no-undef');
  assert.ok(achado, 'a chamada em falso devia ter sido apanhada');
  assert.match(achado.mensagem, /desaparecida/);
  assert.equal(achado.linhaHTML, 10);
});

test('reconhece os globais do navegador', async () => {
  const problemas = await analisarHTML('<script>document.title = window.name;</script>');
  assert.deepEqual(problemas, []);
});

test('código são não levanta problemas', async () => {
  const problemas = await analisarHTML(valido);
  const erros = problemas.filter((p) => p.gravidade === 2 && p.regra !== 'no-unused-vars');
  assert.deepEqual(erros, []);
});

test('recolhe os nomes publicados em window', () => {
  const globais = globaisPublicadas('window.abrir = 1; function fechar(){} window.fechar = fechar;');
  assert.deepEqual(Object.keys(globais), ['abrir']);
});

test('reconhece as funções publicadas em window', async () => {
  const html = '<script>window.abrir = () => 1; document.body.onclick = () => abrir();</script>';
  assert.deepEqual(await analisarHTML(html), []);
});

test('não colide com o nome que também é declarado', async () => {
  const html = '<script>function abrir(){ return 1; } window.abrir = abrir;</script>';
  const problemas = await analisarHTML(html);
  assert.equal(problemas.filter((p) => p.regra === 'no-redeclare').length, 0);
});

test('continua a apanhar o que nunca foi publicado nem declarado', async () => {
  const problemas = await analisarHTML('<script>window.a = () => inexistente();</script>');
  assert.ok(problemas.some((p) => p.regra === 'no-undef' && /inexistente/.test(p.mensagem)));
});
