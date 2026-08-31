// A abertura da base local, e o que acontece quando outra linhagem já lá mexeu.
//
// A base do IndexedDB é partilhada por origem, não por entrega: duas entregas abertas no
// mesmo navegador vão à mesma base. A linhagem paralela subiu a versão dela para 3, com uma
// loja `folhas`, e esta entrega abria com o número 2 escrito à mão — o que dá `VersionError`
// e, aqui dentro, um `null` silencioso: sem diário, sem cópias de recuperação e sem
// mosaicos de carta, e nada no ecrã a dizer porquê.
//
// **O modelo de `indexedDB` abaixo não é o do navegador.** É uma imitação das regras de
// versão que interessam, e foi conferida uma vez contra o Chromium a sério por
// `ferramentas/prova-idb.mjs`, que fica no repositório para poder ser corrida outra vez.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/**
 * Um `indexedDB` de imitação, com as regras de versão que esta abertura tem de respeitar:
 * abrir sem versão adota a existente, abrir acima faz subir, e abrir abaixo é `VersionError`.
 */
function fingirIndexedDB(bases) {
  const disparar = (alvo, evento) => { const f = alvo['on' + evento]; if (f) f.call(alvo); };
  return {
    open(nome, versao) {
      const pedido = { result: null, error: null };
      const base = bases[nome];
      queueMicrotask(() => {
        if (base && versao !== undefined && versao < base.version) {
          pedido.error = { name: 'VersionError' };
          return disparar(pedido, 'error');
        }
        const alvo = base || (bases[nome] = { version: 0, lojas: new Set() });
        const nova = versao === undefined ? (alvo.version || 1) : versao;
        pedido.result = {
          get version() { return alvo.version; },
          objectStoreNames: { contains: (n) => alvo.lojas.has(n) },
          createObjectStore: (n) => alvo.lojas.add(n),
          close() {},
        };
        if (nova > alvo.version) { alvo.version = nova; disparar(pedido, 'upgradeneeded'); }
        disparar(pedido, 'success');
      });
      return pedido;
    },
  };
}

/** Corre `abrirIDB` da entrega contra um conjunto de bases de imitação. */
async function abrirCom(bases) {
  janela.indexedDB = fingirIndexedDB(bases);
  return janela.abrirIDB();
}

const LOJAS = ['chaves', 'diario', 'copias', 'mosaicos'];

test('numa base que não existe, cria-se com todas as lojas', semAplicacao, async () => {
  const bases = {};
  const db = await abrirCom(bases);
  assert.ok(db, 'tinha de abrir');
  for (const n of LOJAS) assert.ok(bases.peaapp.lojas.has(n), `falta a loja ${n}`);
});

test('uma base deixada pela linhagem paralela na versão 3 abre, e não se perde nada dela',
  semAplicacao, async () => {
    // É o caso real: do lado de lá a base vai na 3, com `folhas` do p0018, e sem `mosaicos`,
    // que é trabalho deste lado. Antes desta correção isto devolvia `null` em silêncio.
    const bases = { peaapp: { version: 3, lojas: new Set(['chaves', 'diario', 'copias', 'folhas']) } };
    const db = await abrirCom(bases);
    assert.ok(db, 'uma base mais recente do que a que esta entrega conhece tem de servir');
    assert.ok(bases.peaapp.version > 3, 'sobe-se um degrau para criar o que falta');
    assert.ok(bases.peaapp.lojas.has('mosaicos'), 'a loja que faltava foi criada');
    assert.ok(bases.peaapp.lojas.has('folhas'), 'e a da outra linhagem ficou onde estava');
  });

test('uma base com tudo o que é preciso serve como está, sem subir de versão', semAplicacao, async () => {
  const bases = { peaapp: { version: 7, lojas: new Set([...LOJAS, 'folhas']) } };
  assert.ok(await abrirCom(bases));
  assert.equal(bases.peaapp.version, 7, 'subir sem necessidade obrigaria as outras abas a fechar');
});

test('sem IndexedDB neste navegador, devolve-se nada em vez de rebentar', semAplicacao, async () => {
  const guardado = janela.indexedDB;
  try {
    delete janela.indexedDB;
    assert.equal(await janela.abrirIDB(), null);
  } finally { janela.indexedDB = guardado; }
});

test('a versão da base não está escrita à mão em lado nenhum', semAplicacao, () => {
  // O defeito era exatamente esse: um número fixo só funciona enquanto uma única linhagem
  // escrever na base.
  assert.equal(avaliar(janela, 'typeof IDB_VERSAO'), 'undefined');
});
