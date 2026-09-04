// Uma pintura que rebenta não pode levar as outras com ela, nem calar-se.
//
// Havia nove pinturas num só `try{ ... }catch(e){}`: uma exceção em `autoNivelDECIR`
// apagava em silêncio a estrutura do PCO, o plano de comunicações, o catálogo, a
// conformidade DON, o PEA em vigor, o estado da proposta, as ampulhetas e o perfil. O
// ecrã ficava com a pintura anterior — dados velhos com ar de dados novos — e não dizia
// nada. É a regressão silenciosa que este projeto já teve uma vez, com botões a perder
// listeners dentro de um `try`.
//
// Isolar sozinho não chega: uma pintura que falha em silêncio continua a mentir, só que
// sozinha. Por isso o que aqui se exige são as duas coisas — as outras pintam, e o ecrã
// diz qual é que não pintou.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);

/** Corre `fn` com `nome` substituída por uma função que rebenta, e repõe-na no fim. */
function comFuncaoPartida(nome, fn) {
  av(`window.__g = ${nome}; ${nome} = function(){ throw new Error("rebentei de propósito"); }`);
  try {
    return fn();
  } finally {
    av(`${nome} = window.__g; delete window.__g; pintarTudo();`);
  }
}

test('a pintura que rebenta não leva as seguintes com ela', semAplicacao, () => {
  // `autoNivelDECIR` era a primeira das nove do bloco comum. `renderComs` vinha três
  // depois, e era das que se perdiam.
  av('$("pc-f").innerHTML = ""; $("pco-tag").textContent = ""; $("cm-dist").innerHTML = "";');
  comFuncaoPartida('autoNivelDECIR', () => av('pintarTudo()'));
  assert.notEqual(av('$("pc-f").innerHTML'), '', 'a estrutura do PCO vinha a seguir e tem de ter pintado');
  assert.notEqual(av('$("pco-tag").textContent'), '', 'e a sua etiqueta com ela');
  assert.notEqual(av('$("cm-dist").innerHTML'), '', 'o plano de comunicações vinha três depois');
});

test('o ecrã diz qual é a pintura que não correu', semAplicacao, () => {
  const texto = comFuncaoPartida('autoNivelDECIR', () => {
    av('pintarTudo()');
    return av('$("pint-q").textContent');
  });
  assert.match(texto, /não foi atualizada/, 'a faixa tem de aparecer');
  assert.match(texto, /nível DECIR/, 'e tem de nomear a pintura que falhou');
  assert.match(texto, /rebentei de propósito/, 'com o motivo');
});

test('a faixa desaparece quando a pintura volta a correr', semAplicacao, () => {
  comFuncaoPartida('autoNivelDECIR', () => av('pintarTudo()'));
  assert.equal(av('$("pint-q").style.display'), 'none', 'reposta a função, a faixa tem de fechar');
  assert.equal(av('PINTURAS_QUEBRADAS.length'), 0);
});

test('a entrada e a saída ficam na fita, uma vez cada', semAplicacao, () => {
  av('O.fita = [];');
  comFuncaoPartida('autoNivelDECIR', () => {
    av('pintarTudo(); pintarTudo(); pintarTudo();');
  });
  const linhas = av('O.fita.map(x=>x.e)');
  const quebras = [...linhas].filter((x) => /Pintura do ecrã com falhas/.test(x));
  const reposicoes = [...linhas].filter((x) => /Pintura do ecrã reposta/.test(x));
  assert.equal(quebras.length, 1, 'três passagens seguidas com a mesma falha dão uma linha, não três');
  assert.equal(reposicoes.length, 1, 'e a reposição dá outra');
  av('O.fita = [];');
});

test('nenhuma pintura ficou agrupada com outra num só try', semAplicacao, async () => {
  const { readFile } = await import('node:fs/promises');
  const fonte = await readFile('fonte/7-arranque/01-render-geral.js', 'utf8');
  const corpo = fonte.slice(fonte.indexOf('function pintarTudo()'));
  const fim = corpo.indexOf('\n}\n');
  const dentro = corpo.slice(0, fim);
  assert.equal(
    /try\s*\{/.test(dentro),
    false,
    'voltou a haver um try dentro de pintarTudo: cada pintura corre por `pintura()`, que a isola e a relata',
  );
});
