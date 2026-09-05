// Arranca a entrega num Chromium a sério, a partir de `file://`, com perfil vazio e sem
// opções de linha de comando — o duplo clique de quem recebe o ficheiro —, e afirma três
// coisas que nenhum dos nove portões afirma: que a consola está limpa, que **todos** os
// símbolos de topo declarados em `fonte/` existem no artefacto montado, e que o armazém e
// a base abriram.
//
// É este o portão que fecha a lacuna da ordem (ramo #005, q005): os testes de disco provam
// que cada módulo está presente; nenhum prova que a concatenação não pôs uma dependência
// depois de quem a usa, porque em disco o módulo está lá na mesma. Só arrancar o artefacto
// o diz. A lista de símbolos sai de `fonte/` e não de uma lista escrita à mão, para que um
// módulo novo entre na prova sem ninguém se lembrar.
//
// Corre na CI, no trabalho `navegador`, e à mão com `npm run prova-arranque`.

import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { revisaoMaisRecente } from './verificar.mjs';

/* Os globais do lado da página, dentro de `pagina.evaluate`: o eslint lê o ficheiro do lado do Node. */
/* global location, REVISAO_APP, VERSAO_ESTADO, ARMAZEM, IDB, GRAVACAO */

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('sem playwright instalado: não se corre a prova.'); process.exit(2); }

/** Os nomes de topo de cada módulo: funções, constantes e variáveis declaradas à margem. */
async function simbolosDaFonte() {
  const nomes = [];
  for (const zona of (await readdir('fonte', { withFileTypes: true })).filter((d) => d.isDirectory())) {
    for (const f of (await readdir(join('fonte', zona.name))).filter((f) => f.endsWith('.js'))) {
      const texto = await readFile(join('fonte', zona.name, f), 'utf8');
      for (const m of texto.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let)\s+([A-Za-z_$][\w$]*)/gm)) {
        nomes.push({ nome: m[1] || m[2], modulo: join(zona.name, f) });
      }
    }
  }
  return nomes;
}

/** Abre o Chromium: o que o playwright instalou, ou o pré-instalado do contentor. */
async function abrirNavegador() {
  try { return await chromium.launch(); }
  catch (e) {
    const exe = process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium';
    try { return await chromium.launch({ executablePath: exe }); }
    catch { throw e; }
  }
}

const ficheiro = process.argv[2] || (await revisaoMaisRecente());
if (!ficheiro) { console.error('sem revisão em app/'); process.exit(1); }
const simbolos = await simbolosDaFonte();
const queixas = [];

const nav = await abrirNavegador();
try {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pagina = await ctx.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push('exceção: ' + (e && e.message)));
  pagina.on('console', (m) => { if (m.type() === 'error') erros.push('console.error: ' + m.text()); });
  await pagina.goto(pathToFileURL(resolve(ficheiro)).href, { waitUntil: 'load' });
  /* O arranque é assíncrono: o armazém, a base, a carta. Espera-se por ele em vez de por um
     tempo fixo, com um teto para não ficar pendurado numa promessa que não resolve. */
  await pagina.waitForFunction(() => typeof GRAVACAO !== 'undefined' && document.querySelectorAll('.card.dobravel').length > 0, null, { timeout: 15000 })
    .catch(() => queixas.push('o arranque não chegou ao fim em 15 s: os cartões não dobraram'));

  const sonda = await pagina.evaluate((nomes) => {
    const faltam = nomes.filter(({ nome }) => {
      try { return (0, eval)('typeof ' + nome) === 'undefined'; } catch { return true; }
    });
    return {
      protocolo: location.protocol,
      revisao: typeof REVISAO_APP !== 'undefined' ? REVISAO_APP : null,
      versaoEstado: typeof VERSAO_ESTADO !== 'undefined' ? VERSAO_ESTADO : null,
      armazem: typeof ARMAZEM !== 'undefined' ? ARMAZEM.modo : null,
      base: typeof IDB !== 'undefined' && IDB ? [...IDB.objectStoreNames] : null,
      contextoSeguro: window.isSecureContext,
      cripto: !!(window.crypto && window.crypto.subtle),
      cartoes: document.querySelectorAll('.card.dobravel').length,
      faltam,
    };
  }, simbolos);

  if (sonda.protocolo !== 'file:') queixas.push('abriu por ' + sonda.protocolo + ' e não por file:');
  if (!sonda.revisao) queixas.push('REVISAO_APP não existe: o rodapé não sabe que revisão é');
  if (!sonda.armazem) queixas.push('ARMAZEM não abriu');
  if (!sonda.base) queixas.push('a base IndexedDB não abriu em file://');
  if (!sonda.cripto) queixas.push('crypto.subtle não existe: o carimbo SHA-256 não se calcula');
  if (sonda.faltam.length) queixas.push(sonda.faltam.length + ' símbolo(s) declarados na fonte e ausentes no artefacto: '
    + sonda.faltam.map((x) => x.nome + ' (' + x.modulo + ')').join(', '));
  erros.forEach((e) => queixas.push(e));

  console.log(`${ficheiro}: ${sonda.revisao || '?'}, estado v${sonda.versaoEstado}, armazém ${sonda.armazem}, base ${sonda.base ? sonda.base.length + ' lojas' : 'ausente'}, `
    + `${simbolos.length} símbolos conferidos, ${sonda.cartoes} cartões dobrados, consola ${erros.length ? erros.length + ' erro(s)' : 'limpa'}.`);
  await ctx.close();
} finally {
  await nav.close();
}

if (queixas.length) { console.error('prova do arranque: ' + queixas.length + ' queixa(s)'); queixas.forEach((q) => console.error('  ' + q)); process.exit(1); }
