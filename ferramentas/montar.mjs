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

/** Lê os módulos por ordem alfabética, que é a ordem de montagem. */
export async function lerModulos(pasta = FONTE) {
  const nomes = (await readdir(pasta)).filter((n) => n.endsWith('.js')).sort();
  const partes = [];
  for (const nome of nomes) partes.push(await readFile(join(pasta, nome), 'utf8'));
  return { nomes, texto: partes.join('') };
}

/** Substitui a marca do molde pelos módulos e carimba a revisão. */
export function montar(molde, modulos, revisao, ficheiro) {
  if (!molde.includes(MARCA)) throw new Error(`o molde não tem a marca ${MARCA}`);
  return molde
    .replace(MARCA, () => modulos)
    .replace('@REVISAO@', revisao)
    .replace('@FICHEIRO@', ficheiro);
}

/** Devolve o número da revisão seguinte, a partir do que já existe em `app/`. */
export async function proximaRevisao(pasta = 'app') {
  const recente = await revisaoMaisRecente(pasta);
  const m = recente && /_r(\d{4})_/.exec(recente);
  return m ? Number(m[1]) + 1 : 1;
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

  console.log(`${nomes.length} módulos montados em ${saida} (${revisao}).`);
}
