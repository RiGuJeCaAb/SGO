// As reparações visuais da r0098 — o que se vê, e o que se mede em vez de se olhar.
//
// A revisão de 5 de setembro mediu no ecrã real: o texto de ajuda dava 2,69:1 no tema
// claro sobre o fundo dos cartões, o âmbar 2,80, o verde 3,39 — o mínimo AA é 4,5. Onze
// campos de ficheiro mostravam o botão do sistema dentro da caixa do tema. Um rótulo com
// espaço rígido servia de calço a um botão. E `aviso()` apagava as classes do elemento,
// partindo o cartão da intensidade ao primeiro erro.
//
// O contraste confere-se aqui a partir dos tokens do molde, sem navegador: é aritmética
// sobre os hexadecimais, e é o que decide. O que o navegador acrescenta — o alfa das
// tintas, o fundo efetivo — mede o ramo #005 em Chromium.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());
const av = (e) => avaliar(janela, e);
const molde = readFileSync('fonte/molde.html', 'utf8');

/* ---- contraste dos tokens ---- */

/** Luminância relativa de um `#rrggbb`, pela fórmula do WCAG. */
function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/** Os tokens `--nome:#hex` de um bloco de CSS. */
function tokens(bloco) {
  const out = {};
  for (const m of bloco.matchAll(/--([a-z0-9-]+):(#[0-9A-Fa-f]{6})/g)) out[m[1]] = m[2];
  return out;
}
const escuro = tokens(molde.slice(molde.indexOf(':root{'), molde.indexOf('html[data-tema="claro"]')));
const claro = tokens(molde.slice(molde.indexOf('html[data-tema="claro"]{'), molde.indexOf('*{box-sizing')));
const TEXTO = ['tx', 'tx2', 'tx3', 'agua', 'madeira', 'fogo', 'terra', 'laranja', 'metal'];

for (const [nome, T] of [['claro', claro], ['escuro', escuro]]) {
  test(`tema ${nome}: todos os tokens de texto passam 4,5:1 sobre as duas superfícies`, () => {
    const falhas = [];
    for (const k of TEXTO) {
      if (!T[k]) { falhas.push(k + ' (sem valor hexadecimal)'); continue; }
      for (const f of ['surf', 'surf2']) {
        const c = contraste(T[k], T[f]);
        if (c < 4.5) falhas.push(`${k} ${T[k]} sobre ${f} ${T[f]}: ${c.toFixed(2)}`);
      }
    }
    assert.deepEqual(falhas, []);
  });
  test(`tema ${nome}: os botões laranja e azul passam 4,5:1 com o texto que o tema lhes dá`, () => {
    // O texto do botão segue o tema: escuro sobre os tons claros do tema escuro, branco
    // sobre os tons escuros do tema claro. A regra está em `.btn-o`/`.btn-b` e na
    // sobreposição `html[data-tema="claro"]`.
    const texto = nome === 'claro' ? '#FFFFFF' : '#14100A';
    for (const k of ['agua', 'laranja']) {
      const c = contraste(T[k], texto);
      assert.ok(c >= 4.5, `${k} ${T[k]} com ${texto}: ${c.toFixed(2)}`);
    }
  });
}

test('a hierarquia tx > tx2 > tx3 mantém-se nos dois temas', () => {
  assert.ok(contraste(claro.tx, claro.surf2) > contraste(claro.tx2, claro.surf2));
  assert.ok(contraste(claro.tx2, claro.surf2) > contraste(claro.tx3, claro.surf2));
  assert.ok(contraste(escuro.tx, escuro.surf2) > contraste(escuro.tx2, escuro.surf2));
  assert.ok(contraste(escuro.tx2, escuro.surf2) > contraste(escuro.tx3, escuro.surf2));
});

test('a cor do texto dos botões está declarada por tema', () => {
  assert.match(molde, /html\[data-tema="claro"\] \.btn-o, html\[data-tema="claro"\] \.btn-b\{color:#fff\}/);
});

test('a referência legal do cartão já não vive a 0,62 de opacidade', () => {
  assert.doesNotMatch(molde, /\.card h2 \.tag\{[^}]*opacity:\.62/);
});

/* ---- alturas em tokens, calços apagados ---- */

test('a altura dos controlos é um token, e a regra da grelha desapareceu', () => {
  assert.match(molde, /--ctl-h:45px/);
  assert.doesNotMatch(molde, /\.grid > div > input, \.grid > div > select\{height:45px/);
  assert.match(molde, /input:not\(\[type=checkbox\]\)[^{]*\{height:var\(--ctl-h\)/);
  assert.match(molde, /\.btn\{[^}]*min-height:var\(--ctl-h\)/);
});

test('nenhum rótulo com espaço rígido serve de calço, e nenhuma etiqueta faz de campo', () => {
  assert.doesNotMatch(molde, /<label>&nbsp;<\/label>/);
  assert.doesNotMatch(molde, /class="occ-tag" id="tn-dec"/);
  assert.match(molde, /class="campo-leitura" id="tn-dec"/);
});

test('as ações de remover têm alvo de 24 px', () => {
  assert.match(molde, /\.cat-r \.x,\.tchip button,\.lk,\.av-atual\{min-width:24px;min-height:24px/);
});

/* ---- os campos de ficheiro ---- */

test('todos os campos de ficheiro visíveis têm a mesma forma', semAplicacao, () => {
  const maus = av(`[...document.querySelectorAll('input[type=file]:not([hidden])')].filter(i => {
    const c = i.closest('.campo-ficheiro');
    return !c || !c.querySelector('label.btn[for="' + i.id + '"]') || !c.querySelector('.cf-nome');
  }).map(i => i.id).join(',')`);
  assert.equal(maus, '', 'campos de ficheiro fora da forma: ' + maus);
  assert.ok(av(`document.querySelectorAll('input[type=file]:not([hidden])').length`) >= 8);
});

test('o nome do ficheiro escolhido aparece ao lado do botão', semAplicacao, () => {
  av(`(()=>{ const i = $("foc-fich");
    /* Com a forma de um File: o ouvinte real do campo lê o CSV assim que o change dispara,
       e um objeto sem text() rebentava fora do teste. */
    Object.defineProperty(i, "files", { configurable:true, value:[{ name:"focos.csv", size:0, type:"text/csv", text: async()=>"" }] });
    i.dispatchEvent(new Event("change", { bubbles:true })); })()`);
  assert.equal(av(`$("foc-fich").closest(".campo-ficheiro").querySelector(".cf-nome").textContent`), 'focos.csv');
  av(`(()=>{ const i = $("d-anexos");
    Object.defineProperty(i, "files", { configurable:true, value:["a.pdf","b.pdf","c.pdf"].map(n=>({ name:n, size:0, type:"application/pdf", text: async()=>"" })) });
    i.dispatchEvent(new Event("change", { bubbles:true })); })()`);
  assert.equal(av(`$("d-anexos").closest(".campo-ficheiro").querySelector(".cf-nome").textContent`), '3 ficheiros');
});

test('o campo dos focos e o seu botão alinham pelo fundo, e não pelo centro da pilha', semAplicacao, () => {
  assert.equal(av(`$("foc-limpar").parentElement.classList.contains("par-campo-botao")`), true);
  assert.equal(av(`$("foc-fich").closest(".par-campo-botao > div") !== null`), true);
});

/* ---- aviso() ---- */

test('aviso() não apaga as classes que o elemento já tinha', semAplicacao, () => {
  av('aviso("pr-saida","err","erro de propósito")');
  const cls = av('$("pr-saida").className');
  assert.match(cls, /\bev-f\b/, 'a classe de origem tem de sobreviver: ' + cls);
  assert.match(cls, /\bmsg\b/); assert.match(cls, /\berr\b/);
});

test('depois de um erro, a estimativa seguinte volta a aparecer', semAplicacao, () => {
  av('aviso("pr-saida","err","erro de propósito")');
  av('$("pr-saida").style.display = "none"');   /* o que o temporizador antigo fazia */
  av('pintarEstimativa()');
  assert.notEqual(av('$("pr-saida").style.display'), 'none');
  assert.doesNotMatch(av('$("pr-saida").className'), /\bmsg\b/);
  assert.match(av('$("pr-saida").textContent'), /estimativa/i);
});

test('um erro não expira; uma confirmação expira; e a confirmação anterior não apaga o erro', semAplicacao, () => {
  av('aviso("msg-occ","ok","guardado")');
  assert.equal(av('AVISO_TEMPOS.has($("msg-occ"))'), true, 'a confirmação tem temporizador');
  av('aviso("msg-occ","err","falhou")');
  assert.equal(av('AVISO_TEMPOS.has($("msg-occ"))'), false, 'o erro não tem, e cancelou o da confirmação');
  assert.equal(av('$("msg-occ").style.display'), 'block');
});
