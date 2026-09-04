// O mínimo estrutural da página, que não custa nada e que faltava por inteiro.
//
// A auditoria externa de 4 de setembro apontou três faltas, e as três confirmaram-se pela
// contagem: `lang="pt"` em vez de `pt-PT`, zero elementos `<main>` e zero `<h1>` em todo
// o molde. Nenhuma delas é uma questão de gosto — sem `<h1>` e sem `<main>` um leitor de
// ecrã não tem por onde saltar para o conteúdo, e com `lang="pt"` a variante que ele
// escolhe por omissão não é a europeia, que é a única em que esta aplicação está escrita.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);
const doc = () => janela.document;

test('a língua declarada é a europeia, e não «português» sem mais', semAplicacao, () => {
  assert.equal(doc().documentElement.lang, 'pt-PT');
});

test('há um <h1>, e é o título da aplicação', semAplicacao, () => {
  const h1 = doc().querySelectorAll('h1');
  assert.equal(h1.length, 1, 'um só: mais do que um deixa de haver título da página');
  assert.match(h1[0].textContent, /Estação PEA/);
});

test('há um <main>, e o conteúdo está lá dentro', semAplicacao, () => {
  const main = doc().querySelectorAll('main');
  assert.equal(main.length, 1);
  // Os separadores de célula são o conteúdo. Se algum ficar de fora do <main>, o salto
  // para o conteúdo passa a saltar para meio dele.
  const fora = [...doc().querySelectorAll('section.pane')].filter((s) => !s.closest('main'));
  assert.equal(fora.length, 0, 'separadores fora do <main>: ' + fora.map((s) => s.id).join(', '));
});

test('o rodapé fica fora do <main>, que é onde pertence', semAplicacao, () => {
  const rodape = doc().querySelector('footer');
  assert.ok(rodape, 'tem de haver rodapé');
  assert.equal(rodape.closest('main'), null);
});

test('o <h1> não herda as margens que o cabeçalho não previa', semAplicacao, () => {
  // O título era um `div`. Trocá-lo por `h1` traz margens de bloco por omissão que
  // empurravam a barra do cabeçalho; a folha põe-nas a zero e é isso que se confere.
  const estilo = av('getComputedStyle(document.querySelector("h1.htit")).margin');
  assert.match(String(estilo), /^0(px)?( 0(px)?)*$/, 'margem do h1: ' + estilo);
});

test('a faixa das pinturas quebradas existe e nasce fechada', semAplicacao, () => {
  const f = doc().getElementById('pint-q');
  assert.ok(f, 'sem este elemento, uma pintura que rebente volta a falhar em silêncio');
  assert.equal(f.style.display, 'none');
  assert.equal(f.closest('main'), null, 'a faixa desmente o conteúdo: não pode viver dentro dele');
});
