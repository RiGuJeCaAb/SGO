// Auditoria visual: transbordo horizontal e exceções, em todos os separadores,
// nas duas larguras que interessam e nos dois temas.
//
// Foi assim que se encontrou o transbordo do cabeçalho, corrigido na r0016.
// Precisa do Playwright e de um Chromium; sem eles, sai sem falhar, porque a
// verificação corrente não pode depender de um navegador instalado.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { revisaoMaisRecente } from './verificar.mjs';

const LARGURAS = [380, 480, 768, 1440];

/** Procura um Chromium utilizável. A variável PEA_CHROMIUM tem precedência. */
export function procurarChromium() {
  if (process.env.PEA_CHROMIUM) return process.env.PEA_CHROMIUM;
  const raiz = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(raiz)) return null;
  const pasta = readdirSync(raiz).filter((n) => n.startsWith('chromium-')).sort().at(-1);
  if (!pasta) return null;
  const caminho = join(raiz, pasta, 'chrome-linux', 'chrome');
  return existsSync(caminho) ? caminho : null;
}

/**
 * Corre a auditoria sobre um ficheiro HTML.
 *
 * @returns {Promise<{largura:number, separador:string, culpados:string[]}[]>}
 */
export async function auditar(chromium, ficheiro, executablePath) {
  const navegador = await chromium.launch(executablePath ? { executablePath } : {});
  const achados = [];
  const excecoes = [];

  for (const largura of LARGURAS) {
    const pagina = await navegador.newPage({ viewport: { width: largura, height: 900 } });
    pagina.on('pageerror', (e) => excecoes.push(`${largura}px: ${e.message}`));
    await pagina.goto('file://' + ficheiro, { waitUntil: 'load' });
    await pagina.waitForTimeout(700);

    const separadores = await pagina.locator('nav button').count();
    for (let i = 0; i < separadores; i++) {
      await pagina.locator('nav button').nth(i).click();
      await pagina.waitForTimeout(200);
      const nome = (await pagina.locator('nav button').nth(i).textContent()).trim().replace(/\s+/g, ' ');
      const culpados = await pagina.evaluate(() => {
        const limite = window.innerWidth;
        /* O que vive dentro de uma faixa que desliza de propósito não fura o ecrã: a barra
           de separadores, abaixo de 640 px, é `overflow-x:auto` desde a r0100, e os botões
           que ficam para lá da margem alcançam-se a deslizar. O que se exige é que a
           **faixa** caiba; o que está dentro dela é dela. Sem isto a auditoria acusava oito
           transbordos que eram o desenho. */
        const dentroDeFaixa = (el) => {
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const ox = window.getComputedStyle(a).overflowX;
            if ((ox === 'auto' || ox === 'scroll') && a.getBoundingClientRect().right <= limite + 1) return true;
          }
          return false;
        };
        return [...new Set(
          [...document.querySelectorAll('body *')]
            .filter((el) => el.getClientRects().length > 0)
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ r }) => r.width > 0 && r.right > limite + 1)
            .filter(({ el }) => !dentroDeFaixa(el))
            .map(({ el, r }) => {
              const cls = typeof el.className === 'string' && el.className.trim()
                ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
              return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls} (+${Math.round(r.right - limite)}px)`;
            }),
        )];
      });
      if (culpados.length) achados.push({ largura, separador: nome, culpados });
    }

    // O tema alterna por botão, não por preferência do sistema.
    await pagina.click('#b-tema');
    await pagina.waitForTimeout(300);
    await pagina.close();
  }

  await navegador.close();
  return { achados, excecoes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.log('Playwright não instalado. Auditoria visual saltada.');
    process.exit(0);
  }

  const executavel = procurarChromium();
  if (!executavel) console.log('Sem Chromium conhecido; a usar o predefinido do Playwright.');

  const alvo = process.argv[2] ?? (await revisaoMaisRecente());
  if (!alvo) {
    console.log('Sem revisões em app/. Nada a auditar.');
    process.exit(0);
  }

  const caminho = alvo.startsWith('/') ? alvo : join(process.cwd(), alvo);
  const { achados, excecoes } = await auditar(chromium, caminho, executavel);

  for (const a of achados) {
    console.error(`${a.largura}px · ${a.separador} — transbordo: ${a.culpados.join(' | ')}`);
  }
  for (const e of excecoes) console.error(`exceção — ${e}`);

  const total = achados.length + excecoes.length;
  console.log(`${alvo}: ${total ? total + ' problema(s)' : 'sem transbordo nem exceções em ' + LARGURAS.join('/') + ' px'}.`);
  process.exit(total ? 1 : 0);
}
