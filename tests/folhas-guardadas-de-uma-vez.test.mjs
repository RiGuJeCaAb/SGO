// Duas pequenas dos ramos, sobre as folhas de carta: a colocação grava-se numa transação
// só (#001), e uma folha pesada entra mas diz-se que pesa (#005).
//
// Achado do ramo #001: `guardarFolhas` fazia `clear()` numa transação e um `put()` por folha
// em transações seguintes. Entre o `clear()` e o primeiro `put()` a loja estava vazia, e
// quem lesse nesse instante — a outra aba, um `carregarFolhas` depois de um fecho
// abrupto — lia «sem folhas» e era verdade. Dentro da mesma transação o IndexedDB aplica
// tudo ou nada.
//
// O jsdom não tem IndexedDB: substitui-se `_idb` por um que conta transações e regista o
// que cada uma faz à loja. O que se exige é uma transação, com o `getAll`, o `clear` e os
// `put` lá dentro, por esta ordem — desde a r0103 a loja guarda as folhas de todas as
// ocorrências, e a gravação lê as das outras para as escrever de volta (ramo #001: a
// decisão «guardar e repor» estava tomada à entrada e desfeita à saída).

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);

test('guardarFolhas faz tudo numa transação: clear e depois os put, pela ordem das folhas', semAplicacao, async () => {
  av(`
    window.__idb = _idb; window.__tx = [];
    /* O getAll de mentira responde no microtask seguinte, como o verdadeiro responde no
       onsuccess, e traz o que a base tivesse: uma folha de outra ocorrência e uma velha desta. */
    window.__naBase = [
      { id:"fZ", nome:"de outra", ocorrencia:"oOUTRA", num:"" },
      { id:"fVelha", nome:"desta, de antes", ocorrencia:O.meta.id, num:"" },
    ];
    _idb = async (loja, modo, fn) => {
      const ops = [];
      fn({ clear(){ ops.push("clear"); }, put(x){ ops.push("put:" + x.id); },
           getAll(){ ops.push("getAll"); const r = { result: window.__naBase }; queueMicrotask(()=>{ if(r.onsuccess) r.onsuccess(); }); return r; } });
      window.__tx.push({ loja, modo, ops });
    };
    FOLHAS.length = 0;
    FOLHAS.push({ id:"f1", nome:"A", largura:10, altura:10, mundo:{A:1,B:0,C:0,D:0,E:-1,F:0}, grelha:"pttm06", proveniencia:"p", pontos:0, controlos:[] });
    FOLHAS.push({ id:"f2", nome:"B", largura:10, altura:10, mundo:{A:1,B:0,C:0,D:0,E:-1,F:0}, grelha:"pttm06", proveniencia:"p", pontos:0, controlos:[] });
  `);
  await av('guardarFolhas()');
  await new Promise((r) => setTimeout(r, 0));
  const tx = av('JSON.stringify(window.__tx)');
  av('_idb = window.__idb; delete window.__idb; delete window.__tx; delete window.__naBase; FOLHAS.length = 0;');
  /* Só as de escrita: o `carregarFolhas` do arranque, que é de leitura, pode calhar aqui. */
  const T = JSON.parse(tx).filter((t) => t.modo === 'readwrite');
  assert.equal(T.length, 1, 'uma transação, e não uma por folha mais uma para limpar: ' + tx);
  assert.equal(T[0].loja, 'folhas');
  assert.equal(T[0].modo, 'readwrite');
  assert.deepEqual(T[0].ops.join(','), 'getAll,clear,put:fZ,put:f1,put:f2',
    'lê-se a loja, limpa-se, voltam as das outras ocorrências e entram as desta; a velha desta sai');
});

test('sem folhas, a transação limpa a loja e não escreve nada', semAplicacao, async () => {
  av(`window.__idb = _idb; window.__tx = [];
      _idb = async (loja, modo, fn) => { const ops = []; fn({ clear(){ ops.push("clear"); }, put(x){ ops.push("put:" + x.id); },
        getAll(){ ops.push("getAll"); const r = { result: [] }; queueMicrotask(()=>{ if(r.onsuccess) r.onsuccess(); }); return r; } }); window.__tx.push(ops); };
      FOLHAS.length = 0;`);
  await av('guardarFolhas()');
  await new Promise((r) => setTimeout(r, 0));
  const tx = av('JSON.stringify(window.__tx)');
  av('_idb = window.__idb; delete window.__idb; delete window.__tx;');
  assert.equal(tx, '[["getAll","clear"]]');
});

test('o que se grava é a colocação e não a imagem', semAplicacao, async () => {
  // Uma folha com `url` (a blob: da imagem) grava-se sem ela: a imagem pesa megabytes e não
  // cabe na loja, e volta a escolher-se ao abrir.
  av(`window.__idb = _idb; window.__gravado = null;
      _idb = async (loja, modo, fn) => { fn({ clear(){}, put(x){ window.__gravado = x; },
        getAll(){ const r = { result: [] }; queueMicrotask(()=>{ if(r.onsuccess) r.onsuccess(); }); return r; } }); };
      FOLHAS.length = 0;
      FOLHAS.push({ id:"f9", nome:"C", largura:5, altura:5, mundo:{A:1,B:0,C:0,D:0,E:-1,F:0}, grelha:"pttm06", proveniencia:"p", pontos:0, controlos:[], url:"blob:x", paraMundo(){}, dentro(){} });`);
  await av('guardarFolhas()');
  await new Promise((r) => setTimeout(r, 0));
  const g = av('JSON.stringify(Object.keys(window.__gravado).sort())');
  av('_idb = window.__idb; delete window.__idb; delete window.__gravado; FOLHAS.length = 0;');
  assert.equal(JSON.parse(g).includes('url'), false, 'a blob: URL não pode ir para a loja');
  assert.equal(JSON.parse(g).includes('paraMundo'), false, 'nem as funções');
});

/* ---- a guarda de tamanho: declara, não bloqueia ---- */

test('abaixo do limiar não há aviso; acima há, com o custo em memória', semAplicacao, () => {
  assert.equal(av('avisoFolhaPesada(3500, 2500)'), '', 'uma carta a 300 ppp anda pelos 9 Mpx e passa calada');
  const a = av('avisoFolhaPesada(7000, 5000)');
  assert.match(a, /35 Mpx/, '7000×5000 são 35 Mpx');
  assert.match(a, /140 MB/, 'quatro bytes por pixel: 35 Mpx são 140 MB');
  assert.match(a, /300 ppp|recorta/, 'e diz o que fazer');
  assert.equal(av('avisoFolhaPesada(5000, 5000)'), '', 'no limiar exacto, 25 Mpx, ainda não avisa');
  assert.notEqual(av('avisoFolhaPesada(5001, 5000)'), '', 'um pixel acima avisa');
});

test('uma folha pesada entra na mesma: o aviso é texto, não recusa', semAplicacao, () => {
  // `avisoFolhaPesada` só devolve texto; quem coloca a folha usa-o na mensagem e na fita e
  // continua. Se um dia alguém o transformar numa recusa, é este o teste que o diz.
  assert.equal(av('typeof avisoFolhaPesada(9000, 9000)'), 'string');
  assert.equal(av('FOLHA_PESADA_MPX'), 25);
});
