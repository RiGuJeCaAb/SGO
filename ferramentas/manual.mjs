// Confere que o manual continua a descrever a aplicação que existe.
//
// Um manual apodrece em silêncio: muda-se o rótulo de um botão, e o manual passa a mandar
// o leitor procurar uma coisa que já não está lá. Foi por não se dar com uma secção que
// este manual nasceu, e seria irónico que ele próprio ficasse a mentir.
//
// A regra é simples e obriga a disciplina ao escrever: **as aspas angulares «...» são só
// para texto que existe na aplicação.** Tudo o que estiver entre elas é procurado na
// entrega, e o que não aparecer faz falhar a verificação. Aspas normais para o resto.

import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { revisaoMaisRecente } from './verificar.mjs';

const MANUAL = 'docs/MANUAL.md';

/** Todo o texto visível da aplicação, normalizado, para procurar rótulos nele. */
function textosDaEntrega(html) {
  const { window } = new JSDOM(html, { runScripts: 'outside-only' });
  const doc = window.document;
  const fora = new Set(['SCRIPT', 'STYLE']);
  const textos = new Set();
  const arruma = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  /* Rótulos de controlos, opções, cabeçalhos e legendas — que é onde estão os nomes por
     que uma pessoa procura uma coisa no ecrã. */
  doc.querySelectorAll('button, label, option, h1, h2, h3, .stit, summary, a, th').forEach((el) => {
    if (fora.has(el.tagName)) return;
    const t = arruma(el.textContent);
    if (t) textos.add(t);
  });
  /* Os textos de espera dos campos contam: «deixar vazio se não for conhecida» é a
     instrução que a pessoa lê. */
  doc.querySelectorAll('[placeholder]').forEach((el) => textos.add(arruma(el.getAttribute('placeholder'))));
  window.close();
  return textos;
}

/**
 * Um rótulo do manual encontra-se na entrega?
 *
 * Aceita-se que o rótulo do manual seja o princípio do texto do elemento: um botão pode
 * trazer uma contagem colada ao nome, e exigir igualdade exata obrigaria o manual a
 * reproduzir o que o ecrã mostra num instante concreto.
 */
function existe(rotulo, textos) {
  for (const t of textos) if (t === rotulo || t.startsWith(rotulo + ' ') || t.includes(rotulo)) return true;
  return false;
}

/**
 * Rótulos que só existem depois de a aplicação correr.
 *
 * A leitura acima é do HTML estático: vê o que está escrito no molde e não vê o que um
 * módulo escreve em `innerHTML` quando alguém carrega num botão. O painel dos avisos do
 * IPMA nasce vazio e só ganha texto depois da consulta, e por isso os seus rótulos — que
 * são rótulos do ecrã como quaisquer outros — ficavam de fora.
 *
 * Não se abre a mão da verificação: cada rótulo declara **em que módulo é escrito**, e o
 * texto tem de lá estar tal e qual. Um botão renomeado continua a fazer falhar a
 * verificação, porque o literal deixa de aparecer no ficheiro onde se disse que estava.
 */
const RENDIDOS = [
  { rotulo: 'Consultar agora',   ficheiro: 'fonte/3-planeamento/13-avisos-ipma.js' },
  { rotulo: 'Atualizar',         ficheiro: 'fonte/3-planeamento/13-avisos-ipma.js' },
  { rotulo: 'por confirmar',     ficheiro: 'fonte/3-planeamento/13-avisos-ipma.js' },
  { rotulo: 'previsto',          ficheiro: 'fonte/3-planeamento/13-avisos-ipma.js' },
  { rotulo: 'distrito presumido', ficheiro: 'fonte/3-planeamento/13-avisos-ipma.js' },
];

/** Confere que cada rótulo declarado está mesmo escrito no módulo que se disse. */
async function rotulosRendidos() {
  const achados = new Set(), faltam = [];
  for (const r of RENDIDOS) {
    const fonte = await readFile(r.ficheiro, 'utf8').catch(() => '');
    if (fonte.includes(r.rotulo)) achados.add(r.rotulo);
    else faltam.push(r);
  }
  return { achados, faltam };
}

const alvo = process.argv[2] || (await revisaoMaisRecente());
const html = await readFile(alvo, 'utf8');
const md = await readFile(MANUAL, 'utf8');

const textos = textosDaEntrega(html);
const rendidos = await rotulosRendidos();
rendidos.achados.forEach((t) => textos.add(t));
if (rendidos.faltam.length) {
  console.log('Rótulos declarados como escritos em tempo de execução que já lá não estão:');
  rendidos.faltam.forEach((r) => console.log('  «' + r.rotulo + '» — declarado em ' + r.ficheiro));
  process.exit(1);
}
/* As aspas angulares do manual. Ignoram-se as que estão dentro de blocos de código, que
   são exemplos de ficheiro e não rótulos do ecrã. */
const semCodigo = md.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
/* O espaço branco colapsa: um manual com linhas a noventa colunas parte rótulos ao meio,
   e um rótulo partido pela mudança de linha continua a ser o mesmo rótulo. */
const citados = [...semCodigo.matchAll(/«([^»]+)»/g)].map((m) => m[1].replace(/\s+/g, ' ').trim());
const unicos = [...new Set(citados)];
const perdidos = unicos.filter((r) => !existe(r, textos));

console.log(`${MANUAL}: ${unicos.length} rótulo(s) citados da aplicação, ${perdidos.length} sem correspondência.`);
if (perdidos.length) {
  console.log('\nO manual cita texto que a entrega não tem:');
  perdidos.forEach((r) => console.log('  «' + r + '»'));
  console.log('\nOu o rótulo mudou e o manual ficou para trás, ou as aspas angulares foram usadas');
  console.log('para outra coisa que não um rótulo do ecrã. As angulares são só para rótulos.');
  process.exit(1);
}
