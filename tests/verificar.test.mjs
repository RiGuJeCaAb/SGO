import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verificarSintaxe, verificarHTML, revisaoMaisRecente } from '../ferramentas/verificar.mjs';

const valido = await readFile(new URL('./fixtures/valido.html', import.meta.url), 'utf8');
const partido = await readFile(new URL('./fixtures/partido.html', import.meta.url), 'utf8');

test('código correto passa', () => {
  assert.equal(verificarSintaxe('const a = 1;'), null);
});

test('código partido é apanhado', () => {
  const falha = verificarSintaxe('const 1a = 2;');
  assert.ok(falha, 'devia ter falhado');
  assert.match(falha.mensagem, /token/i);
});

test('o código não é executado', () => {
  globalThis.__efeito = 'intacto';
  verificarSintaxe('globalThis.__efeito = "executado";');
  assert.equal(globalThis.__efeito, 'intacto');
  delete globalThis.__efeito;
});

test('HTML válido não acusa erros', () => {
  const { blocos, erros } = verificarHTML(valido);
  assert.equal(blocos, 1);
  assert.deepEqual(erros, []);
});

test('o erro aponta à linha certa do HTML', () => {
  const { erros } = verificarHTML(partido);
  assert.equal(erros.length, 1);
  assert.equal(erros[0].linhaHTML, 6);
});

test('pasta sem revisões devolve null', async () => {
  assert.equal(await revisaoMaisRecente('pasta-que-nao-existe'), null);
});

test('escolhe a revisão de numeração mais alta', async () => {
  const { mkdtemp, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const pasta = await mkdtemp(join(tmpdir(), 'pea-'));
  for (const nome of [
    'CSREPCDouro_r0009_202608010900_EstacaoPEA_CLD.html',
    'CSREPCDouro_r0010_202608020900_EstacaoPEA_CLD.html',
    'LEIAME.md',
  ]) {
    await writeFile(join(pasta, nome), '<script>const a = 1;</script>');
  }
  const escolhida = await revisaoMaisRecente(pasta);
  assert.match(escolhida, /r0010/);
});
