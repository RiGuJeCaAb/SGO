// Confere, num Chromium a sério, o que o modelo de `indexedDB` de `tests/armazem-idb.test.mjs`
// finge saber.
//
// O jsdom não traz IndexedDB, e um teste contra uma imitação prova a lógica mas não prova
// que a imitação é fiel. Esta ferramenta corre as duas coisas que interessam num navegador:
// que abrir abaixo da versão existente dá `VersionError` — o defeito que isto veio corrigir —
// e que a abertura da entrega sobrevive a uma base deixada pela linhagem paralela.
//
// Não entra no `npm run tudo`: precisa de navegador e de uma origem HTTP, porque o Chromium
// não dá IndexedDB em `file://`. Corre-se à mão quando se mexer na abertura da base.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { procurarChromium } from './visual.mjs';

const FONTE = 'fonte/1-nucleo/01-armazenamento.js';

/** O troço da fonte que abre a base, para o correr tal como está escrito. */
async function corpoDaAbertura() {
  const t = await readFile(FONTE, 'utf8');
  return t.slice(t.indexOf('const IDB_NOME'), t.indexOf('/**\n * Uma operação sobre uma loja'));
}

const corpo = await corpoDaAbertura();
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('sem playwright instalado: não se corre a prova.'); process.exit(2); }

const servidor = createServer((_p, r) => { r.setHeader('content-type', 'text/html'); r.end('<title>prova</title>'); });
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const exe = procurarChromium();
const navegador = await chromium.launch(exe ? { executablePath: exe } : {});
const pagina = await navegador.newPage();
await pagina.goto(`http://127.0.0.1:${servidor.address().port}/`);

const r = await pagina.evaluate(async ({ corpo }) => {
  const abrirCru = (nome, v) => new Promise((res) => {
    let q;
    try { q = v ? indexedDB.open(nome, v) : indexedDB.open(nome); }
    catch (e) { return res({ via: 'excecao', nome: String(e) }); }
    q.onupgradeneeded = () => { const db = q.result;
      ['chaves', 'diario', 'copias', 'folhas'].forEach((n) => {
        if (!db.objectStoreNames.contains(n)) db.createObjectStore(n); }); };
    q.onsuccess = () => { q.result.close(); res({ via: 'sucesso', versao: q.result.version }); };
    q.onerror = () => res({ via: 'erro', nome: q.error && q.error.name });
    q.onblocked = () => res({ via: 'bloqueado' });
  });

  /* A base como a linhagem paralela a deixa: versão 3, com `folhas`, sem `mosaicos`. */
  const paralela = await abrirCru('peaapp', 3);
  /* O defeito, tal como era: abrir por um número fixo mais baixo. */
  const descer = await abrirCru('peaapp', 2);

  eval(corpo);                                                    // eslint-disable-line no-eval
  const db = await abrirIDB();                                    // eslint-disable-line no-undef
  if (!db) return { paralela, descer, aberta: false };
  const fim = { paralela, descer, aberta: true, versao: db.version,
                lojas: [...db.objectStoreNames].sort() };
  fim.escreveu = await new Promise((res) => {
    const tx = db.transaction('mosaicos', 'readwrite');
    tx.objectStore('mosaicos').put('quadrado', 'z/x/y');
    tx.oncomplete = () => res(true); tx.onerror = () => res(false);
  });
  db.close();
  return fim;
}, { corpo });

await navegador.close();
servidor.close();

const queixas = [];
if (r.descer.nome !== 'VersionError')
  queixas.push(`abrir abaixo da versão existente devia dar VersionError, deu ${JSON.stringify(r.descer)}`);
if (!r.aberta) queixas.push('a abertura da entrega não sobreviveu à base da linhagem paralela');
if (r.aberta && !r.lojas.includes('mosaicos')) queixas.push('a loja que faltava não foi criada');
if (r.aberta && !r.lojas.includes('folhas')) queixas.push('a loja da outra linhagem perdeu-se');
if (r.aberta && !r.escreveu) queixas.push('a base abriu mas não se consegue escrever nela');

if (queixas.length) { queixas.forEach((q) => console.error(`  ${q}`)); process.exit(1); }
console.log(`base da linhagem paralela na versão ${r.paralela.versao}; abrir na 2 dá ${r.descer.nome};`
  + ` a entrega abre na ${r.versao} com ${r.lojas.join(', ')}.`);
