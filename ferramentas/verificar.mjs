// Verificação de sintaxe do JavaScript embutido na aplicação.
//
// Compila cada bloco <script> sem o executar. Um erro de sintaxe passa a ser
// apanhado em segundos, antes da entrega, em vez de num posto de comando.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import vm from 'node:vm';
import { extrairScripts } from './extrair.mjs';

const PASTA_APP = 'app';

/**
 * Compila o código sem o executar. Devolve null se estiver bem formado,
 * ou a mensagem e a linha do erro.
 *
 * @param {string} codigo
 * @returns {{mensagem:string, linha:number|null}|null}
 */
export function verificarSintaxe(codigo) {
  try {
    new vm.Script(codigo);
    return null;
  } catch (erro) {
    const linha = Number(String(erro.stack ?? '').match(/^.*?:(\d+)$/m)?.[1]) || null;
    return { mensagem: erro.message, linha };
  }
}

/**
 * Verifica todos os blocos de um ficheiro HTML.
 *
 * @param {string} html
 * @returns {{blocos:number, erros:{linhaHTML:number, mensagem:string}[]}}
 */
export function verificarHTML(html) {
  const blocos = extrairScripts(html);
  const erros = [];
  for (const bloco of blocos) {
    const falha = verificarSintaxe(bloco.codigo);
    if (!falha) continue;
    erros.push({
      linhaHTML: bloco.linha + (falha.linha ? falha.linha - 1 : 0),
      mensagem: falha.mensagem,
    });
  }
  return { blocos: blocos.length, erros };
}

/** Devolve o caminho da revisão mais recente em `app/`, ou null se não houver nenhuma. */
export async function revisaoMaisRecente(pasta = PASTA_APP) {
  let entradas;
  try {
    entradas = await readdir(pasta);
  } catch {
    return null;
  }
  const revisoes = entradas.filter((n) => n.toLowerCase().endsWith('.html')).sort();
  return revisoes.length ? join(pasta, revisoes.at(-1)) : null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const alvos = process.argv.slice(2);
  if (!alvos.length) {
    const recente = await revisaoMaisRecente();
    if (!recente) {
      console.log('Sem revisões em app/. Nada a verificar.');
      process.exit(0);
    }
    alvos.push(recente);
  }

  let falhou = false;
  for (const alvo of alvos) {
    const { blocos, erros } = verificarHTML(await readFile(alvo, 'utf8'));
    if (erros.length) {
      falhou = true;
      for (const erro of erros) console.error(`${alvo}:${erro.linhaHTML} — ${erro.mensagem}`);
    } else {
      console.log(`${alvo}: ${blocos} bloco(s), sintaxe correta.`);
    }
  }
  process.exit(falhou ? 1 : 0);
}
