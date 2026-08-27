// Análise estática do JavaScript da aplicação.
//
// Extrai o código do HTML e corre o ESLint sobre ele. O objetivo declarado é
// apanhar, sem executar nada, a função que ficou órfã e a chamada a função que
// já não existe — a regressão registada na especificação.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { ESLint } from 'eslint';
import { extrairScripts, juntar, linhaOrigem } from './extrair.mjs';
import { revisaoMaisRecente } from './verificar.mjs';

const DESTINO = '.tmp/app.js';

/**
 * Corre o ESLint sobre o código de uma aplicação já extraído.
 *
 * @param {string} codigo
 * @returns {Promise<{regra:string|null, linha:number, mensagem:string, gravidade:number}[]>}
 */
export async function analisar(codigo) {
  const eslint = new ESLint({ overrideConfigFile: 'eslint.config.mjs' });
  const [resultado] = await eslint.lintText(codigo, { filePath: DESTINO });
  return (resultado?.messages ?? []).map((m) => ({
    regra: m.ruleId,
    linha: m.line,
    mensagem: m.message,
    gravidade: m.severity,
  }));
}

/**
 * Extrai o código de um ficheiro HTML, analisa-o e devolve os problemas já com
 * a linha do HTML de origem.
 */
export async function analisarHTML(html) {
  const { codigo, mapa } = juntar(extrairScripts(html));
  const problemas = await analisar(codigo);
  return problemas.map((p) => ({ ...p, linhaHTML: linhaOrigem(mapa, p.linha) }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const alvo = process.argv[2] ?? (await revisaoMaisRecente());
  if (!alvo) {
    console.log('Sem revisões em app/. Nada a analisar.');
    process.exit(0);
  }

  const html = await readFile(alvo, 'utf8');
  await mkdir('.tmp', { recursive: true });
  await writeFile(DESTINO, juntar(extrairScripts(html)).codigo, 'utf8');

  const problemas = await analisarHTML(html);
  for (const p of problemas) {
    const tipo = p.gravidade === 2 ? 'erro' : 'aviso';
    console.error(`${alvo}:${p.linhaHTML ?? '?'} — ${tipo} — ${p.mensagem} [${p.regra ?? 'sem regra'}]`);
  }

  const erros = problemas.filter((p) => p.gravidade === 2).length;
  console.log(`${alvo}: ${problemas.length} problema(s), ${erros} erro(s).`);
  process.exit(erros ? 1 : 0);
}
