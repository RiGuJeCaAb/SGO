// Arnês de teste da aplicação.
//
// Carrega a revisão mais recente de `app/` num DOM simulado e devolve a janela,
// para que os testes possam chamar diretamente as funções da aplicação.

import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
import { revisaoMaisRecente } from '../ferramentas/verificar.mjs';

/**
 * Exceções lançadas pelo script da aplicação durante o carregamento. Uma lista não
 * vazia significa que a aplicação rebentou ao arrancar, e nenhum outro teste vale.
 * @type {string[]}
 */
export const excecoesDeArranque = [];

/**
 * Abre a revisão mais recente. Devolve null se não houver nenhuma em `app/`,
 * para que os testes que dependem da aplicação possam ser saltados.
 *
 * @returns {Promise<Window|null>}
 */
export async function abrirAplicacao() {
  const caminho = await revisaoMaisRecente();
  if (!caminho) return null;

  // A aplicação tenta alcançar a rede e desenhar; isso não interessa. Uma exceção
  // do próprio script interessa muito, e fica registada.
  const consola = new VirtualConsole();
  consola.on('jsdomError', (e) => {
    if (/Uncaught/.test(e.message)) excecoesDeArranque.push(e.message);
  });

  const dom = new JSDOM(await readFile(caminho, 'utf8'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'file:///estacao.html',
    virtualConsole: consola,
  });
  return dom.window;
}

/** Série meteorológica de ensaio, em CSV, com os casos que interessam à leitura. */
export const CSV_ENSAIO = [
  'HOURLY,HOUR,TEMP,RH,WD,WS,PRECIP',
  '2026-08-27,09,30,25,180,10,0',
  '2026-08-27,10,34,15,180,10,0',
  '2026-08-27,11,33,18,180,10,0',
  '2026-08-27,12,28,55,180,10,0',
  '2026-08-27,13,26,60,180,10,2',
].join('\n');

/**
 * Lê uma declaração `let` ou `const` do topo do script da aplicação.
 * Essas não ficam em `window` — vivem no âmbito lexical global —, por isso não
 * bastam os acessos por propriedade.
 *
 * @param {Window} janela
 * @param {string} expressao
 */
export function avaliar(janela, expressao) {
  return janela.eval(expressao);
}
