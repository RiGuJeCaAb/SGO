// Verificação de tipos sem compilação.
//
// O TypeScript verifica JavaScript comum, com as formas declaradas em tipos/*.d.ts e
// anotações curtas na aplicação. Não transpila, não produz nada: o ficheiro entregue
// continua a ser JavaScript com comentários, e o navegador nunca sabe que isto existe.
//
// O estreitamento de tipos do DOM está fora do alvo desta camada — o valor está em
// apanhar campo de estado mal escrito, campo que se assume existir e não existe, e
// valor que pode ser nulo e não é tratado. Esses diagnósticos ficam numa linha de base
// declarada em tipos/baseline.json; o que a exceder faz falhar a verificação.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extrairScripts, juntar, linhaOrigem } from './extrair.mjs';
import { revisaoMaisRecente } from './verificar.mjs';

const correr = promisify(execFile);
const BASE = 'tipos/baseline.json';
const DESTINO = '.tmp/app.js';

/** Um diagnóstico do compilador, com a linha já traduzida para o HTML. */
const LINHA = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

/** A assinatura ignora a linha: o código muda de sítio, o defeito é o mesmo. */
export const assinatura = (d) => `${d.codigo} ${d.mensagem}`;

export function lerDiagnosticos(saida, mapa) {
  const fora = [];
  for (const linha of saida.split('\n')) {
    const m = LINHA.exec(linha.trim());
    if (!m) continue;
    fora.push({
      linha: mapa ? linhaOrigem(mapa, Number(m[2])) : Number(m[2]),
      codigo: m[4],
      mensagem: m[5],
    });
  }
  return fora;
}

/** Compara com a linha de base. Devolve o que é novo e o que já lá não está. */
export function comparar(diagnosticos, base) {
  const contar = (lista) => lista.reduce((c, d) => c.set(d, (c.get(d) || 0) + 1), new Map());
  const agora = contar(diagnosticos.map(assinatura));
  const antes = new Map(Object.entries(base));
  const novos = [], resolvidos = [];

  for (const [sig, n] of agora) {
    const esperado = antes.get(sig) || 0;
    if (n > esperado) novos.push({ sig, n, esperado });
  }
  for (const [sig, n] of antes) {
    const ha = agora.get(sig) || 0;
    if (ha < n) resolvidos.push({ sig, n, ha });
  }
  return { novos, resolvidos };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const registar = process.argv.includes('--registar');
  const alvo = process.argv.slice(2).find((x) => !x.startsWith('--')) ?? (await revisaoMaisRecente());
  if (!alvo) {
    console.log('Sem revisões em app/. Nada a verificar.');
    process.exit(0);
  }

  const { codigo, mapa } = juntar(extrairScripts(await readFile(alvo, 'utf8')));
  await mkdir('.tmp', { recursive: true });
  await writeFile(DESTINO, codigo, 'utf8');

  let saida = '';
  try {
    await correr('npx', ['tsc', '-p', 'tsconfig.json'], { cwd: process.cwd() });
  } catch (e) {
    saida = String(e.stdout || '') + String(e.stderr || '');
  }
  const diagnosticos = lerDiagnosticos(saida, mapa);

  if (registar) {
    const base = {};
    for (const d of diagnosticos) base[assinatura(d)] = (base[assinatura(d)] || 0) + 1;
    await writeFile(BASE, JSON.stringify(base, null, 1) + '\n', 'utf8');
    console.log(`Linha de base registada: ${diagnosticos.length} diagnóstico(s) tolerados.`);
    process.exit(0);
  }

  let base = {};
  try { base = JSON.parse(await readFile(BASE, 'utf8')); } catch { base = {}; }
  const { novos, resolvidos } = comparar(diagnosticos, base);

  for (const n of novos) console.error(`novo — ${n.sig} (${n.n} ocorrência(s), toleradas ${n.esperado})`);
  for (const d of diagnosticos) {
    if (novos.some((n) => n.sig === assinatura(d))) console.error(`  ${alvo}:${d.linha ?? '?'}`);
  }
  for (const r of resolvidos) console.log(`resolvido — ${r.sig} (eram ${r.n}, são ${r.ha})`);

  console.log(`${alvo}: ${diagnosticos.length} diagnóstico(s), ${novos.length} novo(s) face à linha de base.`);
  if (resolvidos.length) console.log('Há diagnósticos resolvidos: correr com --registar para baixar a linha de base.');
  process.exit(novos.length ? 1 : 0);
}
