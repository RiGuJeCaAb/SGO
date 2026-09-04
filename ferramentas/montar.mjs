// Montagem da aplicação.
//
// A fonte vive em `fonte/`: um módulo por subsistema, pela mesma divisão que os
// comentários de secção já faziam dentro do ficheiro único. Esta ferramenta junta-os
// pela ordem dos nomes e escreve-os para dentro do molde, produzindo a entrega.
//
// O que chega ao posto de comando não muda: um ficheiro HTML autónomo, que abre com
// duplo clique, sem servidor, sem instalação e sem rede. O Node é preciso para
// produzir uma entrega, não para a usar. É a diferença entre a bancada de trabalho e
// a ferramenta que vai para o teatro de operações.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { revisaoMaisRecente } from './verificar.mjs';

const FONTE = 'fonte';
const MOLDE = 'fonte/molde.html';
const MARCA = '@MODULOS@';

/**
 * Lê os módulos por ordem alfabética, que é a ordem de montagem.
 *
 * A fonte está repartida por célula do posto de comando: uma pasta por zona, com
 * prefixo numérico, e dentro de cada uma um módulo por subsistema, também numerado.
 * A ordem é a das pastas e depois a dos ficheiros, e é essa a ordem por que o código
 * corre — o núcleo primeiro, o arranque no fim.
 *
 * Um `.js` solto na raiz de `fonte/` é recusado: ficaria sem zona e sem lugar
 * determinado na montagem, e a ordem deixaria de se ler na árvore.
 */
export async function lerModulos(pasta = FONTE) {
  const entradas = await readdir(pasta, { withFileTypes: true });

  const soltos = entradas.filter((e) => e.isFile() && e.name.endsWith('.js')).map((e) => e.name);
  if (soltos.length) {
    throw new Error(`módulo sem zona na raiz de ${pasta}: ${soltos.join(', ')}`
      + ' — cada módulo vive na pasta da célula a que pertence');
  }

  const zonas = entradas.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const nomes = [], partes = [];
  for (const zona of zonas) {
    const ficheiros = (await readdir(join(pasta, zona))).filter((n) => n.endsWith('.js')).sort();
    for (const nome of ficheiros) {
      nomes.push(`${zona}/${nome}`);
      partes.push(await readFile(join(pasta, zona, nome), 'utf8'));
    }
  }
  return { nomes, texto: partes.join('') };
}

/** Substitui a marca do molde pelos módulos e carimba a revisão. */
export function montar(molde, modulos, revisao, ficheiro) {
  if (!molde.includes(MARCA)) throw new Error(`o molde não tem a marca ${MARCA}`);
  return molde
    .replace(MARCA, () => modulos)
    /* A revisão e o nome aparecem no rodapé e outra vez no cabeçalho do script: são
       duas ocorrências cada, e uma substituição só carimbava a primeira. */
    .replaceAll('@REVISAO@', revisao)
    .replaceAll('@FICHEIRO@', ficheiro);
}

/**
 * O número mais alto reservado por outra linhagem, declarado em `app/RESERVADAS.md`.
 *
 * A numeração é uma só e é partilhada. Quando a outra linhagem já entregou revisões que
 * ainda não chegaram aqui, os números delas não existem em `app/` — e a montagem
 * reatribuía-os. Foi assim que passaram a existir duas r0058 diferentes.
 */
export async function revisaoReservada(pasta = 'app') {
  let texto = '';
  try { texto = await readFile(join(pasta, 'RESERVADAS.md'), 'utf8'); }
  catch { return 0; }
  const nums = [...texto.matchAll(/^\s{4,}r(\d{4})\b/gm)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) : 0;
}

/**
 * Devolve o número da revisão seguinte: o mais alto que existe em `app/` ou que está
 * reservado por outra linhagem, mais um. Nunca reatribui um número que já saiu.
 */
export async function proximaRevisao(pasta = 'app') {
  const recente = await revisaoMaisRecente(pasta);
  const m = recente && /_r(\d{4})_/.exec(recente);
  const aqui = m ? Number(m[1]) : 0;
  return Math.max(aqui, await revisaoReservada(pasta)) + 1;
}

/** Carimbo AAAAMMDDHHMM na hora de Lisboa, que é a do posto de comando. */
export function carimbo(agora = new Date()) {
  const partes = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(agora);
  return partes.replace(/\D/g, '').slice(0, 12);
}

function opcao(nome) {
  const i = process.argv.indexOf('--' + nome);
  return i >= 0 ? process.argv[i + 1] : null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const numero = Number(opcao('revisao') ?? (await proximaRevisao()));
  const revisao = 'r' + String(numero).padStart(4, '0');
  const ficheiro = opcao('ficheiro') ?? `CSREPCDouro_${revisao}_${carimbo()}_EstacaoPEA_CLD.html`;
  const saida = opcao('saida') ?? join('app', ficheiro);

  const { nomes, texto } = await lerModulos();
  const html = montar(await readFile(MOLDE, 'utf8'), texto, revisao, ficheiro);
  await writeFile(saida, html, 'utf8');

  /* O `index.html` da raiz é a cópia que o GitHub serve, e foi lá posto à mão a 2 de
     setembro. Uma cópia à mão envelhece: ficou a servir a r0081 no dia em que a r0083
     saiu, e ninguém dava por isso porque nada a confere. Passa a ser reescrita por cada
     montagem — nunca se edita, e nunca fica atrás da entrega mais recente. Só quando a
     entrega vai para `app/`: uma montagem de trabalho com `--saida` não mexe no que
     está publicado. */
  if (saida === join('app', ficheiro)) await writeFile('index.html', html, 'utf8');

  console.log(`${nomes.length} módulos montados em ${saida} (${revisao}).`);
}
