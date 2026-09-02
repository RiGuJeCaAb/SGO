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

test('o index.html da raiz é a entrega mais recente, byte a byte', semRevisao, async () => {
  /* É a cópia que o GitHub serve. Foi posta à mão a 2 de setembro e já nasceu a envelhecer:
     ficaria a servir a r0081 no dia em que a r0083 saiu, sem nada que o denunciasse — que é
     a pior espécie de defeito neste projeto, o que só se descobre no terreno. A montagem
     reescreve-a; este teste é quem confere que foi reescrita. */
  const [servido, entregue] = await Promise.all([
    readFile('index.html', 'utf8'),
    readFile(recente, 'utf8'),
  ]);
  assert.equal(servido, entregue,
    'o index.html não é a entrega mais recente — correr `npm run montar`');
});

/* ---- o que a comparação byte a byte não pode apanhar ---- */

/* Apontado pelo ramo #005 a 2 de setembro, e a leitura estava certa: **a montagem é o
   componente de maior risco do sistema e era o que tinha menos verificação própria.** É a
   peça que transforma módulos corretos num ficheiro que arranca num PCO às três da manhã.

   O teste da reprodução byte a byte não chega, e a razão é subtil: monta a partir de
   `lerModulos()` e compara com uma entrega montada a partir de `lerModulos()`. **Um módulo
   que o leitor deixe cair é deixado cair dos dois lados**, os bytes batem, e o teste passa
   sobre uma entrega a que falta código. Só um confronto com o disco o vê. */

async function ficheirosDeFonte(pasta = 'fonte') {
  const { readdir } = await import('node:fs/promises');
  const entradas = await readdir(pasta, { withFileTypes: true });
  const out = [];
  for (const e of entradas) {
    const caminho = pasta + '/' + e.name;
    if (e.isDirectory()) out.push(...(await ficheirosDeFonte(caminho)));
    else if (/\.(js|mjs|cjs)$/i.test(e.name)) out.push(caminho);
  }
  return out;
}

test('todo o módulo que está no disco entra na montagem', semRevisao, async () => {
  /* Percorre `fonte/` até ao fim, e não uma camada só. `lerModulos` lê as zonas e os `.js`
     lá dentro: um módulo numa subpasta de zona, ou com extensão `.mjs`, é ignorado sem uma
     palavra. Não é hipótese académica — é como um módulo se perde numa reorganização. */
  const noDisco = (await ficheirosDeFonte()).sort();
  const { nomes } = await lerModulos();
  const lidos = nomes.map((n) => 'fonte/' + n).sort();
  assert.deepEqual(lidos, noDisco,
    'a montagem não leu tudo o que está em fonte/, ou leu o que lá não está');
});

test('o código de cada módulo está mesmo dentro da entrega', semRevisao, async () => {
  /* A verificação que o ramo #005 pediu: pegar no artefacto final e confirmar que cada
     módulo declarado está presente. Confronta-se contra o disco, e não contra a lista que
     a própria montagem produziu — de outro modo seria a montagem a certificar-se a si. */
  const entregue = await readFile(recente, 'utf8');
  const ficheiros = await ficheirosDeFonte();
  const faltam = [];
  for (const f of ficheiros) {
    const corpo = (await readFile(f, 'utf8')).trim();
    if (corpo && !entregue.includes(corpo)) faltam.push(f);
  }
  assert.equal(faltam.join(', '), '', 'módulos ausentes da entrega');
  assert.ok(ficheiros.length >= 70, 'só ' + ficheiros.length + ' módulos — a leitura falhou');
});
