/* #005-q0001 — auditoria de portabilidade, Chromium limpo, file://, perfil vazio.
   Sem --allow-file-access-from-files: replica o duplo-clique do colega. */
const {chromium} = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const FICH = 'file://' + path.resolve(__dirname, 'r0093.html');

(async () => {
  const ctx = await chromium.launchPersistentContext('/tmp/perfil-vazio-' + Date.now(), {
    headless: true,
    args: ['--no-sandbox', '--font-render-hinting=none']
  });
  const page = await ctx.newPage();

  const erros = [], avisos = [], rede = [], logs = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + (e && e.message)));
  page.on('console', m => {
    const t = m.type(), x = m.text();
    if (t === 'error') erros.push('CONSOLE.ERROR: ' + x);
    else if (t === 'warning') avisos.push('WARN: ' + x);
    else logs.push(t + ': ' + x);
  });
  page.on('requestfailed', r => rede.push(r.url().slice(0, 110) + ' :: ' + (r.failure() || {}).errorText));

  await page.goto(FICH, {waitUntil: 'load'});
  await page.waitForTimeout(6000);   // deixar prepararArmazem() resolver

  const sonda = await page.evaluate(async () => {
    const out = {};
    out.protocolo = location.protocol;
    out.origem = location.origin;
    out.revisao = (typeof REVISAO_APP !== 'undefined') ? REVISAO_APP : null;
    out.versaoEstado = (typeof VERSAO_ESTADO !== 'undefined') ? VERSAO_ESTADO : null;
    out.armazemModo = (typeof ARMAZEM !== 'undefined') ? ARMAZEM.modo : null;
    out.armazemAtomico = (typeof ARMAZEM !== 'undefined') ? ARMAZEM.atomico : null;
    out.idbPresente = (typeof IDB !== 'undefined' && IDB) ? {nome: IDB.name, versao: IDB.version, lojas: [...IDB.objectStoreNames]} : null;
    out.llmModo = (typeof LLM !== 'undefined') ? LLM.modo : null;
    out.cryptoSubtle = !!(window.crypto && window.crypto.subtle);
    out.contextoSeguro = window.isSecureContext;

    // localStorage cru
    try { localStorage.setItem('__probe', '1'); out.localStorage = 'disponivel'; localStorage.removeItem('__probe'); }
    catch (e) { out.localStorage = 'BLOQUEADO: ' + e.name; }

    // IndexedDB cru, base independente da app
    out.idbCru = await new Promise(res => {
      let done = false; const fim = v => { if (!done) { done = true; res(v); } };
      setTimeout(() => fim('SEM RESPOSTA em 3s'), 3000);
      let p; try { p = indexedDB.open('__sonda_cru', 1); }
      catch (e) { return fim('EXCEPCAO SINCRONA: ' + e.name + ' — ' + e.message); }
      p.onupgradeneeded = () => p.result.createObjectStore('s');
      p.onerror = () => fim('ONERROR: ' + (p.error ? p.error.name + ' — ' + p.error.message : '?'));
      p.onsuccess = () => {
        const db = p.result;
        try {
          const tx = db.transaction('s', 'readwrite');
          tx.objectStore('s').put('valor', 'k');
          tx.oncomplete = () => fim('ABRE E ESCREVE (versao ' + db.version + ')');
          tx.onerror = () => fim('ESCRITA FALHOU: ' + tx.error);
        } catch (e) { fim('TRANSACAO FALHOU: ' + e.name); }
      };
    });

    // superfícies que a app pode precisar
    out.apis = {
      structuredClone: typeof structuredClone === 'function',
      OffscreenCanvas: typeof OffscreenCanvas === 'function',
      createImageBitmap: typeof createImageBitmap === 'function',
      performanceMemory: !!(performance && performance.memory)
    };
    if (performance && performance.memory) out.memoria = {
      usadaMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1),
      limiteMB: +(performance.memory.jsHeapSizeLimit / 1048576).toFixed(1)
    };
    out.titulo = document.title;
    out.nosDOM = document.querySelectorAll('*').length;
    return out;
  });

  const res = {chromium: 'Chromium 141', ficheiro: FICH, sonda, erros, avisos: avisos.slice(0, 15), rede, logs: logs.slice(0, 20)};
  fs.writeFileSync(__dirname + '/resultado.json', JSON.stringify(res, null, 2));
  console.log(JSON.stringify(res, null, 2));
  await page.screenshot({path: __dirname + '/qa_arranque.png', fullPage: false});
  await ctx.close();
})();
