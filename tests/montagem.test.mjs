// Camada 2 — a fonte em módulos e a entrega em ficheiro único.
// A entrega é gerada: se alguém editar o HTML de `app/` à mão, a fonte e a entrega
// divergem em silêncio. Este teste não deixa.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { lerModulos, montar, carimbo } from '../ferramentas/montar.mjs';
import { revisaoMaisRecente } from '../ferramentas/verificar.mjs';

const recente = await revisaoMaisRecente();
const semRevisao = { skip: recente ? false : 'sem revisão em app/' };

test('o molde tem a marca onde entram os módulos', async () => {
  const molde = await readFile('fonte/molde.html', 'utf8');
  assert.ok(molde.includes('@MODULOS@'));
  assert.ok(molde.includes('@REVISAO@') && molde.includes('@FICHEIRO@'));
});

test('a fonte está repartida por célula do posto de comando', async () => {
  const { nomes } = await lerModulos();
  assert.ok(nomes.length >= 20, `esperava pelo menos 20 módulos, há ${nomes.length}`);
  assert.deepEqual(nomes, [...nomes].sort(), 'a ordem dos nomes é a ordem de montagem');
  for (const nome of nomes) {
    assert.match(nome, /^\d-[a-z]+\/\d\d-[a-z0-9-]+\.js$/, `nome fora de padrão: ${nome}`);
  }

  // A ordem das zonas é a ordem por que o código corre. O núcleo primeiro, porque é o
  // que o arranque precisa de ter avaliado; o arranque no fim, porque corre sobre tudo
  // o resto. Entre um e outro, as células pela ordem do art. 12.º, n.º 2 do SIOPS.
  const zonas = [...new Set(nomes.map((n) => n.split('/')[0]))];
  assert.deepEqual(zonas, ['1-nucleo', '2-comando', '3-planeamento', '4-operacoes',
    '5-logistica', '6-turno', '7-arranque']);
});

test('um módulo sem zona na raiz da fonte é recusado', async () => {
  // Ficaria sem célula e sem lugar determinado na montagem, e a ordem deixaria de se
  // ler na árvore. Vale a pena parar em vez de o montar num sítio qualquer.
  const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const raiz = await mkdtemp(join(tmpdir(), 'fonte-'));
  await mkdir(join(raiz, '1-nucleo'));
  await writeFile(join(raiz, '1-nucleo', '01-a.js'), 'const a = 1;\n');
  await writeFile(join(raiz, 'solto.js'), 'const b = 2;\n');
  await assert.rejects(() => lerModulos(raiz), /módulo sem zona/);
});

test('montar a fonte reproduz a revisão mais recente, byte a byte', semRevisao, async () => {
  const entregue = await readFile(recente, 'utf8');
  const ficheiro = basename(recente);
  const revisao = /_r(\d{4})_/.exec(ficheiro)[0].slice(1, 6);

  const { texto } = await lerModulos();
  const montado = montar(await readFile('fonte/molde.html', 'utf8'), texto, revisao, ficheiro);

  assert.equal(montado, entregue,
    'a entrega em app/ não corresponde à fonte em fonte/ — não editar o HTML à mão');
});

test('o carimbo tem doze dígitos', () => {
  assert.match(carimbo(new Date('2026-08-28T12:50:00Z')), /^\d{12}$/);
});

test('montar sem a marca recusa em vez de produzir lixo', async () => {
  assert.throws(() => montar('<html></html>', 'código', 'r0001', 'x.html'), /marca/);
});
