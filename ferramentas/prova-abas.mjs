// Confere, num Chromium a sério e a partir de `file://`, o que `tests/escrita-por-uma-aba`
// prova com um `navigator.locks` de mentira: dois separadores da mesma entrega, um a
// escrever e outro em leitura, o roubo do trinco, e o aviso entre abas.
//
// Não entra no `npm run tudo`: precisa de navegador. Corre-se à mão quando se mexer no
// trinco ou no canal, e deixa as provas em `docs/qa/` quando se lhe pede `--qa`.
//
// A sonda de 5 de setembro que fez o desenho possível está aqui repetida como primeira
// verificação: se um dia o Chromium deixar de partilhar a origem entre abas `file://`, é
// este o sítio que o diz antes de alguém o descobrir num posto de comando.

/* Os nomes seguintes existem só dentro de `page.evaluate`, isto é, no navegador, onde a
   entrega os define. Para o eslint, que só vê este ficheiro em Node, são desconhecidos: é
   por isso que se declaram aqui, e não porque exista alguma coisa a importar. */
/* global emLeitura, LEITURA, O, $, aplicarTema, persistir */

import { resolve } from 'node:path';
import { procurarChromium } from './visual.mjs';
import { revisaoMaisRecente } from './verificar.mjs';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('sem playwright instalado: não se corre a prova.'); process.exit(2); }

const qa = process.argv.includes('--qa');
const carimbo = process.argv[process.argv.indexOf('--qa') + 1] || '';
const f = resolve(await revisaoMaisRecente());
const exe = procurarChromium();
const nav = await chromium.launch(exe ? { executablePath: exe } : {});
const queixas = [];
const exigir = (cond, txt) => { if (!cond) queixas.push(txt); };

for (const [tema, sufixo] of [['claro', 'TemaClaro'], ['escuro', 'TemaEscuro']]) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const A = await ctx.newPage(); await A.goto('file://' + f, { waitUntil: 'load' });
  await A.waitForTimeout(900);
  await A.evaluate((t) => aplicarTema(t), tema);
  const B = await ctx.newPage(); await B.goto('file://' + f, { waitUntil: 'load' });
  await B.waitForTimeout(900);
  await B.evaluate((t) => aplicarTema(t), tema);

  // 1. A escreve, B nasce em leitura.
  const eA = await A.evaluate(() => ({ leitura: emLeitura(), grav: $('grav').textContent }));
  const eB = await B.evaluate(() => ({ leitura: emLeitura(), grav: $('grav').textContent, faixa: $('leitura-faixa').style.display, campo: $('o-num').disabled }));
  exigir(eA.leitura === false, tema + ': a primeira aba devia escrever');
  exigir(eB.leitura === true && eB.faixa === 'block' && eB.campo === true, tema + ': a segunda aba devia nascer em leitura, com faixa e campos inertes: ' + JSON.stringify(eB));

  // 2. A grava; B recebe pelo canal e repõe.
  await A.evaluate(async () => { $('o-num').value = '2026-PROVA'; $('o-local').value = 'Sonda'; await persistir(false); });
  await B.waitForTimeout(600);
  const numB = await B.evaluate(() => O.meta.num);
  exigir(numB === '2026-PROVA', tema + ': a aba em leitura devia ter reposto a ocorrência gravada pela outra; tem «' + numB + '»');
  const gravA = await A.evaluate(() => $('grav').textContent);
  exigir(/^Gravado \d\d:\d\d$/.test(gravA), tema + ': o indicador de A devia dizer «Gravado hh:mm»; diz «' + gravA + '»');

  if (qa) {
    await B.screenshot({ path: `docs/qa/CSREPCDouro_qa0033_${carimbo}_SegundaAbaEmLeitura${sufixo}_CLD.png`, clip: { x: 0, y: 0, width: 1440, height: 260 } });
  }

  // 3. B assume a escrita; A passa a leitura.
  await B.click('#leitura-assumir');
  await B.waitForTimeout(500);
  const dB = await B.evaluate(() => ({ leitura: emLeitura(), campo: $('o-num').disabled }));
  const dA = await A.evaluate(() => ({ leitura: emLeitura(), motivo: LEITURA.motivo, faixa: $('leitura-faixa').style.display }));
  exigir(dB.leitura === false && dB.campo === false, tema + ': B devia ter assumido a escrita: ' + JSON.stringify(dB));
  exigir(dA.leitura === true && /assumiu/.test(dA.motivo) && dA.faixa === 'block', tema + ': A devia ter passado a leitura por roubo: ' + JSON.stringify(dA));

  if (qa) {
    await A.screenshot({ path: `docs/qa/CSREPCDouro_qa0033_${carimbo}_AbaQuePerdeuAEscrita${sufixo}_CLD.png`, clip: { x: 0, y: 0, width: 1440, height: 260 } });
  }
  await ctx.close();
}
await nav.close();

if (queixas.length) { console.error('prova das abas: ' + queixas.length + ' queixa(s)'); queixas.forEach((q) => console.error('  ' + q)); process.exit(1); }
console.log('prova das abas: duas abas em file://, uma a escrever e outra em leitura, roubo do trinco e aviso entre abas conferidos nos dois temas.');
