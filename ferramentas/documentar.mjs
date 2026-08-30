// Cobertura de documentação: quantas funções dizem o que prometem.
//
// Não mede a qualidade do que está escrito — isso não se mede. Mede o que se pode medir:
// se cada função de topo tem alguma coisa escrita imediatamente antes dela. Uma função
// sem uma linha a dizer o que promete obriga quem a lê a reconstruir a intenção a partir
// do corpo, e é assim que se muda uma função julgando que ela faz outra coisa.
//
// **O limiar não desce.** É o mesmo princípio da linha de base dos tipos: uma revisão
// pode acrescentar funções, mas não pode deixar cair a cobertura que já tinha. Foi assim
// que 135 funções ficaram sem uma linha sem que ninguém desse por isso.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const FONTE = 'fonte';
/** Quantas funções de topo podem ficar sem comentário. Zero, e é para ficar zero. */
export const TOLERADAS = 0;

/**
 * As funções de topo de um módulo, e se trazem comentário imediatamente antes.
 *
 * «Imediatamente antes» é o critério porque é o que se lê: um comentário três linhas
 * acima, com código pelo meio, documenta o código pelo meio e não a função.
 */
export function funcoesDe(texto) {
  const L = texto.split('\n');
  const out = [];
  for (let i = 0; i < L.length; i++) {
    const m = /^(?:async )?function (\w+)/.exec(L[i]);
    if (!m) continue;
    let j = i - 1;
    while (j >= 0 && !L[j].trim()) j--;
    const a = j >= 0 ? L[j].trim() : '';
    const documentada = a.endsWith('*/') || a.startsWith('//') || a.startsWith('*') || a.startsWith('/*');
    out.push({ nome: m.group ? m.group(1) : m[1], linha: i + 1, documentada });
  }
  return out;
}

/** Percorre a fonte e conta. */
export async function medir(pasta = FONTE) {
  const zonas = (await readdir(pasta, { withFileTypes: true }))
    .filter((e) => e.isDirectory()).map((e) => e.name).sort();
  let total = 0;
  const semComentario = [];
  for (const zona of zonas) {
    const ficheiros = (await readdir(join(pasta, zona))).filter((n) => n.endsWith('.js')).sort();
    for (const nome of ficheiros) {
      const texto = await readFile(join(pasta, zona, nome), 'utf8');
      for (const f of funcoesDe(texto)) {
        total++;
        if (!f.documentada) semComentario.push(`${zona}/${nome}:${f.linha} ${f.nome}`);
      }
    }
  }
  return { total, semComentario };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await medir();
  const pct = r.total ? Math.round(((r.total - r.semComentario.length) / r.total) * 100) : 100;
  if (r.semComentario.length) {
    console.log(`${r.semComentario.length} função(ões) de topo sem uma linha a dizer o que prometem:`);
    r.semComentario.forEach((x) => console.log('  ' + x));
  }
  console.log(`fonte/: ${r.total} funções de topo, ${pct} % com comentário`
    + ` (${r.semComentario.length} sem, toleradas ${TOLERADAS}).`);
  process.exit(r.semComentario.length > TOLERADAS ? 1 : 0);
}
