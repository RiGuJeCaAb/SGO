// A arrumação do repositório, conferida à máquina.
//
// Os catálogos das pastas — `docs/qa/LEIAME.md`, `ferramentas/historico/README.md`,
// `docs/cartografia/LEIAME.md`, `docs/FONTES.md` — são escritos à mão e apodrecem por
// omissão: entra um ficheiro, ninguém escreve a linha, e meses depois ninguém sabe o que
// aquilo é. Havia 47 ficheiros nessa situação quando esta verificação nasceu.

import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, rm } from 'node:fs/promises';
import { arrumado, citado } from '../ferramentas/arrumado.mjs';

test('o repositório está arrumado: nome de convenção e linha no catálogo', async () => {
  const queixas = await arrumado();
  assert.deepEqual(queixas, [], `por arrumar:\n  ${queixas.join('\n  ')}`);
});

test('um ficheiro por catalogar é apanhado, e um mal nomeado também', async () => {
  // Provar que a verificação vê alguma coisa, e não que passa por não olhar. Escreve-se um
  // ficheiro em `docs/qa/` e confere-se que a queixa aparece — e depois apaga-se.
  const intruso = 'docs/qa/CSREPCDouro_qa9999_209912312359_Intruso_CLD.png';
  const malNomeado = 'docs/qa/rascunho.png';
  await writeFile(intruso, '');
  await writeFile(malNomeado, '');
  try {
    const q = await arrumado();
    assert.ok(q.some((x) => x.includes('Intruso') && x.includes('catálogo')),
      'um ficheiro com nome certo mas sem linha no catálogo tem de ser apanhado');
    assert.ok(q.some((x) => x.includes('rascunho.png') && x.includes('convenção')),
      'um ficheiro com nome de rascunho tem de ser apanhado');
  } finally {
    await rm(intruso, { force: true });
    await rm(malNomeado, { force: true });
  }
  assert.deepEqual(await arrumado(), [], 'e a pasta volta ao que estava');
});

test('a citação com reticências no lugar do carimbo conta como catalogada', () => {
  // Os catálogos citam assim famílias de ficheiros da mesma revisão, e sempre citaram:
  // exigir o carimbo por extenso obrigaria a reescrever catálogos que estão bem.
  const nome = 'CSREPCDouro_qa0009_202608282100_Planeamento_CLD.png';
  assert.ok(citado(nome, 'linha: `CSREPCDouro_qa0009_..._Planeamento_CLD.png` — o separador'));
  assert.ok(citado(nome, `linha com o nome inteiro: ${nome}`));
  assert.ok(!citado(nome, 'um catálogo que fala de outra coisa'),
    'as reticências substituem o carimbo, não o nome');
  assert.ok(!citado(nome, '`CSREPCDouro_qa0009_..._Operacoes_CLD.png`'),
    'a citação de um irmão não cataloga este');
});
