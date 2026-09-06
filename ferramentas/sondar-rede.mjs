// Sonda as origens de rede que a aplicação declara, **a partir da própria entrega aberta de
// `file://` num Chromium**, que é a condição do posto: origem opaca, sem cabeçalho de
// identificação, e o CORS a decidir antes de o código ver a resposta.
//
// É a resposta possível às tarefas 11 e 14 do plano: validar as fontes reais e o serviço de
// focos. Daqui não se consegue — a política de rede do ambiente de trabalho recusa tudo
// com 403, e uma lista de 403 não prova nada sobre o posto. Esta ferramenta corre-se onde
// há rede, e o que ela escreve é a prova: `entrada/` recebe um JSON com o carimbo, para que
// a sessão seguinte o leia e o arrume.
//
// A lista de origens sai da fonte, e não de uma lista escrita à mão: um serviço novo entra
// na sonda sem ninguém se lembrar. As consultas de amostra por anfitrião estão abaixo — um
// endereço-base sem parâmetros responde 400 em muitos serviços, e 400 com CORS aberto é
// prova de que se chega lá; sem CORS não é prova de nada.
//
//   npm run sondar                          — as origens da fonte
//   npm run sondar -- --url <endereço> ...  — mais estes, tal como escritos (o WMTS do
//                                             posto, o serviço de focos com a chave)
//   FOCOS_URL=<endereço com chave> npm run sondar
//
// A chave do serviço de focos nunca é escrita no ficheiro de saída: o endereço regista-se
// com a chave substituída por «…».

/* Do lado da página, dentro de `pagina.evaluate`: o eslint lê este ficheiro do lado do Node. */
/* global performance, AbortController, fetch, Image */

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { procurarChromium } from './visual.mjs';
import { revisaoMaisRecente } from './verificar.mjs';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('sem playwright instalado: não se corre a sonda.'); process.exit(2); }

/** Uma consulta pequena e válida por anfitrião, para a resposta ser a do serviço e não a de um pedido mal feito. */
const AMOSTRAS = {
  'api.open-meteo.com': '/v1/forecast?latitude=41.16&longitude=-7.79&hourly=temperature_2m&forecast_days=1',
  'geocoding-api.open-meteo.com': '/v1/search?name=Lamego&count=1&language=pt&format=json',
  'photon.komoot.io': '/api/?q=Lamego&limit=1',
  'nominatim.openstreetmap.org': '/search?q=Lamego&format=json&limit=1',
  'api.ipma.pt': '/open-data/distrits-islands.json',
};
/** Anfitriões com um caminho próprio de amostra, quando o endereço da fonte é só o interpretador. */
const OVERPASS = '?data=%5Bout%3Ajson%5D%3Bnode(41.16%2C-7.79%2C41.161%2C-7.789)%3Bout%201%3B';

/** As origens escritas na fonte, sem os exemplos nem os prefixos vazios. */
async function origensDaFonte() {
  const urls = new Set();
  for (const zona of (await readdir('fonte', { withFileTypes: true })).filter((d) => d.isDirectory())) {
    for (const f of (await readdir(join('fonte', zona.name))).filter((f) => f.endsWith('.js'))) {
      const texto = await readFile(join('fonte', zona.name, f), 'utf8');
      for (const m of texto.matchAll(/https:\/\/[A-Za-z0-9.-]+\.[a-z]{2,}(?:\/[A-Za-z0-9./_-]*)?/g)) urls.add(m[0]);
    }
  }
  return [...urls]
    .filter((u) => !/exemplo|anthropic\.com|w3\.org/.test(u))
    .map((u) => {
      const { host, pathname } = new URL(u);
      if (AMOSTRAS[host] && (pathname === '/' || pathname === '')) return u.replace(/\/$/, '') + AMOSTRAS[host];
      if (/overpass/.test(host)) return u + OVERPASS;
      if (host === 'api.open-meteo.com' && pathname === '/v1/elevation') return u + '?latitude=41.16&longitude=-7.79';
      if (host === 'api.open-meteo.com' && pathname === '/v1/forecast') return u + AMOSTRAS[host].slice('/v1/forecast'.length);
      if (host === 'geocoding-api.open-meteo.com') return u + AMOSTRAS[host].slice('/v1/search'.length);
      if (host === 'photon.komoot.io') return u + (pathname.includes('reverse') ? '?lat=41.16&lon=-7.79' : '?q=Lamego&limit=1');
      if (host === 'nominatim.openstreetmap.org') return u + (pathname.includes('reverse') ? '?lat=41.16&lon=-7.79&format=json' : '?q=Lamego&format=json&limit=1');
      return u;
    })
    .sort();
}

/** O endereço sem a chave, para o registo: tudo o que pareça uma chave fica «…». */
function semChave(u) {
  return u.replace(/(api\/area\/csv\/)[^/]+/i, '$1…').replace(/([?&](?:key|chave|api_key|token)=)[^&]+/gi, '$1…');
}

const extras = [];
for (let i = 0; i < process.argv.length; i++) if (process.argv[i] === '--url' && process.argv[i + 1]) extras.push(process.argv[++i]);
if (process.env.FOCOS_URL) extras.push(process.env.FOCOS_URL);

const ficheiro = process.argv.find((a, i) => i >= 2 && a.endsWith('.html')) || (await revisaoMaisRecente());
if (!ficheiro) { console.error('sem revisão em app/'); process.exit(1); }
const alvos = [...(await origensDaFonte()), ...extras];

const exe = procurarChromium();
const nav = await chromium.launch(exe ? { executablePath: exe } : {});
const linhas = [];
try {
  const ctx = await nav.newContext();
  const pagina = await ctx.newPage();
  /* O `fetch` que falha só diz «Failed to fetch»; a razão — CORS fechado, conteúdo misto,
     ligação recusada — está na consola do navegador, e é isso que se quer no registo. */
  let consola = [];
  pagina.on('console', (m) => { if (m.type() === 'error') consola.push(m.text().slice(0, 240)); });
  pagina.on('requestfailed', (r) => consola.push('pedido falhado: ' + (r.failure() && r.failure().errorText)));
  await pagina.goto(pathToFileURL(resolve(ficheiro)).href, { waitUntil: 'load' });
  for (const u of alvos) {
    consola = [];
    const r = await pagina.evaluate(async (url) => {
      const t0 = performance.now();
      try {
        const ctl = new AbortController();
        const prazo = setTimeout(() => ctl.abort(), 20000);
        const resp = await fetch(url, { signal: ctl.signal });
        clearTimeout(prazo);
        const corpo = await resp.text().catch(() => '');
        return { ok: true, estado: resp.status, tipo: resp.headers.get('content-type') || '', bytes: corpo.length, ms: Math.round(performance.now() - t0) };
      } catch (e) {
        /* Sem CORS, ou sem rede, o fetch rejeita antes de haver estado: é isto que a página vê. */
        return { ok: false, erro: String(e && e.message || e).slice(0, 120), ms: Math.round(performance.now() - t0) };
      }
    }, u);
    /* Sem CORS há ainda um caminho, o `<img>`: prova-se também, para a sonda dizer se a carta
       se veria em modo direto. Só para o que parece imagem, e só quando o fetch falhou. */
    let imagem = null;
    if (!r.ok) imagem = await pagina.evaluate((url) => new Promise((res) => {
      const i = new Image(); const t = setTimeout(() => res('sem resposta em 15 s'), 15000);
      i.onload = () => { clearTimeout(t); res('imagem ' + i.naturalWidth + '×' + i.naturalHeight); };
      i.onerror = () => { clearTimeout(t); res('não é imagem, ou não veio'); };
      i.src = url;
    }), u);
    const razao = consola.filter((c) => !/Failed to load resource/.test(c)).join(' | ');
    linhas.push({ url: semChave(u), ...r, razao: razao || undefined, imagem: imagem || undefined });
    console.log((r.ok ? `HTTP ${r.estado}` : 'FALHOU').padEnd(9) + ' ' + String(r.ms).padStart(6) + ' ms  ' + semChave(u)
      + (r.ok ? `  (${r.tipo.split(';')[0] || 'sem tipo'}, ${r.bytes} bytes)` : `  ${r.erro}`)
      + (razao ? `\n           razão do navegador: ${razao}` : '')
      + (imagem ? `\n           por <img>, sem CORS: ${imagem}` : ''));
  }
  await ctx.close();
} finally {
  await nav.close();
}

const chegaram = linhas.filter((l) => l.ok).length;
const carimbo = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
await mkdir('entrada', { recursive: true });
const saida = join('entrada', `CSREPCDouro_${carimbo}_SondaDeRede_CLD.json`);
await writeFile(saida, JSON.stringify({ entrega: ficheiro, quando: new Date().toISOString(), plataforma: process.platform, chegaram, total: linhas.length, linhas }, null, 2) + '\n');
console.log(`\n${chegaram} de ${linhas.length} origens responderam de file://. Registo em ${saida} — arruma-se na sessão seguinte.`);
if (!chegaram) { console.error('nenhuma origem respondeu: ou esta máquina está sem rede, ou tudo lhe é recusado.'); process.exit(1); }
