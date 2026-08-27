// Extração dos blocos <script> embutidos num ficheiro HTML.
//
// A aplicação é entregue como ficheiro único, mas as ferramentas de verificação
// trabalham sobre JavaScript. Este módulo faz a ponte, preservando o número da
// linha em que cada bloco começa, para que os erros apontem ao sítio certo no HTML.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const BLOCO = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const TIPOS_JS = new Set(['', 'module', 'text/javascript', 'application/javascript']);

/**
 * Devolve os blocos de script embutidos, por ordem de aparecimento.
 * Ignora scripts externos (com `src`) e blocos de dados (`type` não executável).
 *
 * @param {string} html
 * @returns {{codigo:string, linha:number, tipo:string}[]}
 */
export function extrairScripts(html) {
  const blocos = [];
  for (const achado of html.matchAll(BLOCO)) {
    const [, atributos, codigo] = achado;
    if (/\bsrc\s*=/i.test(atributos)) continue;

    const tipo = (atributos.match(/\btype\s*=\s*["']?([^"'\s>]*)/i)?.[1] ?? '').toLowerCase();
    if (!TIPOS_JS.has(tipo)) continue;

    const inicioCodigo = achado.index + achado[0].indexOf(codigo);
    const linha = contarLinhas(html.slice(0, inicioCodigo)) + 1;
    blocos.push({ codigo, linha, tipo });
  }
  return blocos;
}

function contarLinhas(texto) {
  let n = 0;
  for (let i = 0; i < texto.length; i++) if (texto[i] === '\n') n++;
  return n;
}

/**
 * Junta os blocos num só ficheiro de JavaScript e devolve, com ele, o mapa que
 * permite traduzir uma linha do resultado de volta à linha do HTML de origem.
 *
 * @param {{codigo:string, linha:number}[]} blocos
 * @returns {{codigo:string, mapa:{saidaInicio:number, saidaFim:number, htmlInicio:number}[]}}
 */
export function juntar(blocos) {
  const linhas = [];
  const mapa = [];
  for (const bloco of blocos) {
    linhas.push(`// origem: linha ${bloco.linha} do HTML`);
    const codigo = bloco.codigo.split('\n');
    mapa.push({
      saidaInicio: linhas.length + 1,
      saidaFim: linhas.length + codigo.length,
      htmlInicio: bloco.linha,
    });
    linhas.push(...codigo);
  }
  return { codigo: linhas.join('\n'), mapa };
}

/**
 * Traduz uma linha do código junto para a linha correspondente do HTML.
 * Devolve null se a linha for uma anotação e não código.
 *
 * @param {{saidaInicio:number, saidaFim:number, htmlInicio:number}[]} mapa
 * @param {number} linhaSaida
 * @returns {number|null}
 */
export function linhaOrigem(mapa, linhaSaida) {
  const troco = mapa.find((m) => linhaSaida >= m.saidaInicio && linhaSaida <= m.saidaFim);
  return troco ? troco.htmlInicio + (linhaSaida - troco.saidaInicio) : null;
}

// Uso como comando: node ferramentas/extrair.mjs <ficheiro.html> <destino.js>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [origem, destino] = process.argv.slice(2);
  if (!origem || !destino) {
    console.error('Uso: node ferramentas/extrair.mjs <ficheiro.html> <destino.js>');
    process.exit(2);
  }
  const blocos = extrairScripts(await readFile(origem, 'utf8'));
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, juntar(blocos).codigo, 'utf8');
  console.log(`${blocos.length} bloco(s) extraído(s) de ${origem} para ${destino}`);
}
