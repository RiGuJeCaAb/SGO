// A r0100 do plano de 5 de setembro: acessibilidade e pintura.
//
// O que a revisão mediu: os 31 <h2> com role="button" — um só cabeçalho para um leitor de
// ecrã; 16 controlos sem nome e até 42 campos gerados por setor sem rótulo; 144 notas de
// ajuda sem aria-describedby; nenhuma mensagem anunciada; a gravidade dos avisos só na
// cor; uma repintura completa por tecla; a fita do tempo regenerada inteira a cada
// passagem; o cartão do PEA em vigor a destruir o foco de 30 em 30 segundos.
//
// E uma coisa que o relatório dizia e não era: os 160 botões de frases na ordem de
// tabulação. Os grupos inativos já ficavam `hidden`. Fica aqui provado em vez de corrigido.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());
const av = (e) => avaliar(janela, e);
const molde = readFileSync('fonte/molde.html', 'utf8');
beforeEach(() => { if (janela) av('O = novoEstado(); escreverForm();'); });

/* ---- cabeçalhos ---- */

test('os 31 títulos de cartão continuam a ser cabeçalhos', semAplicacao, () => {
  assert.equal(av('document.querySelectorAll("h2[role]").length'), 0, 'nenhum h2 pode ter role');
  assert.ok(av('document.querySelectorAll(".card h2").length') >= 31);
});

test('cada cartão dobrável tem um botão dentro do título, com aria-expanded e aria-controls', semAplicacao, () => {
  const maus = av(`[...document.querySelectorAll(".card.dobravel")].filter(c => {
    const b = c.querySelector(":scope > h2 > button.cd-btn");
    return !b || !b.hasAttribute("aria-expanded") || !document.getElementById(b.getAttribute("aria-controls") || "");
  }).length`);
  assert.equal(maus, 0);
});

test('o botão do título abre e fecha o cartão, e diz que o fez', semAplicacao, () => {
  const r = av(`(()=>{ const c = document.querySelector(".card.dobravel"); const b = c.querySelector(":scope > h2 > .cd-btn");
    const antes = c.classList.contains("aberto"); b.click();
    return JSON.stringify({ antes, depois: c.classList.contains("aberto"), aria: b.getAttribute("aria-expanded") }); })()`);
  const q = JSON.parse(r);
  assert.notEqual(q.antes, q.depois);
  assert.equal(q.aria, String(q.depois));
});

/* ---- nomes e notas ---- */

test('nenhum controlo visível fica sem nome acessível', semAplicacao, () => {
  const sem = av(`[...document.querySelectorAll("input,select,textarea")].filter(c => {
    if (c.type === "hidden" || c.hidden) return false;
    const id = c.id; const temFor = id && document.querySelector('label[for="' + id + '"]');
    return !(temFor || c.closest("label") || c.getAttribute("aria-label") || c.getAttribute("aria-labelledby"));
  }).map(c => (c.id || c.tagName) + " " + c.outerHTML.slice(0, 90) + " em " + (c.parentElement.id || c.parentElement.className)).join(" | ")`);
  assert.equal(sem, '', 'controlos sem nome: ' + sem);
});

test('os campos gerados por setor têm rótulo, e os do quadro de tipologias também', semAplicacao, () => {
  av('estObj().n = 2; renderSetores();');
  const sem = av(`[...document.querySelectorAll("#s-lista input,#s-lista select")].filter(c =>
    !(c.closest("label") || c.getAttribute("aria-label") || (c.id && document.querySelector('label[for="' + c.id + '"]')))).length`);
  assert.equal(sem, 0);
  assert.equal(av('document.querySelectorAll("#s-lista .set-row label.set-c").length'), 12, 'seis campos por setor, dois setores');
  assert.equal(av('document.querySelector("#s-lista .set-l").textContent'), 'Estado');
});

test('a nota de ajuda de um campo fica-lhe ligada', semAplicacao, () => {
  assert.equal(av('$("o-inicio").getAttribute("aria-describedby")'), 'o-inicio-info');
  assert.ok(av('document.querySelectorAll("[aria-describedby]").length') >= 20);
});

test('os botões de uma letra dizem a frase inteira', semAplicacao, () => {
  const maus = av(`[...document.querySelectorAll(".fr.mini")].filter(b => b.getAttribute("aria-label") !== b.getAttribute("data-fr")).length`);
  assert.equal(maus, 0);
  assert.ok(av('document.querySelectorAll(".fr.mini").length') >= 14);
});

test('só um grupo de frases está visível de cada vez — os outros já eram hidden', semAplicacao, () => {
  assert.equal(av('[...document.querySelectorAll("#evo-frases .fr-g")].filter(g => !g.hidden).length'), 1);
});

/* ---- anúncios ---- */

test('um erro é um alert e uma confirmação é um status', semAplicacao, () => {
  av('aviso("msg-occ","err","x")'); assert.equal(av('$("msg-occ").getAttribute("role")'), 'alert');
  av('aviso("msg-occ","ok","x")'); assert.equal(av('$("msg-occ").getAttribute("role")'), 'status');
});

test('as duas faixas do topo são anunciadas', () => {
  assert.match(molde, /id="pint-q" role="alert" aria-live="assertive"/);
  assert.match(molde, /id="leitura-faixa" role="alert" aria-live="assertive"/);
});

test('a gravidade dos avisos vai por extenso no botão', semAplicacao, () => {
  av('window.__v = verificacoesDON;');
  try {
    av('verificacoesDON = () => [{n:"ob", t:"x"}, {n:"av", t:"y"}]; pintarDON();');
    assert.equal(av('$("sinal-rot").textContent'), 'Em incumprimento');
    assert.match(av('$("b-sinal").getAttribute("aria-label")'), /1 obrigação em incumprimento/);
    av('verificacoesDON = () => [{n:"av", t:"y"}]; pintarDON();');
    assert.equal(av('$("sinal-rot").textContent'), 'A antecipar');
    av('verificacoesDON = () => []; pintarDON();');
    assert.equal(av('$("sinal-rot").textContent'), 'Avisos');
  } finally {
    av('verificacoesDON = window.__v; delete window.__v; pintarDON();');
  }
});

/* ---- pintura ---- */

test('escrever seguido no GDH de início só repinta uma vez', semAplicacao, async () => {
  av('window.__p = pintarDON; window.__n = 0; pintarDON = () => { window.__n++; };');
  try {
    av('for (let i = 0; i < 6; i++) $("o-inicio").dispatchEvent(new Event("input", { bubbles: true }));');
    assert.equal(av('window.__n'), 0, 'nada ainda: a repintura é adiada');
    await new Promise((r) => setTimeout(r, 400));
    assert.equal(av('window.__n'), 1, 'seis teclas, uma repintura');
  } finally {
    av('pintarDON = window.__p; delete window.__p; delete window.__n;');
  }
});

test('a fita do tempo acrescenta a linha nova sem reconstruir as antigas', semAplicacao, () => {
  av('O.fita = [{g:"010000SET26", e:"um"}, {g:"010100SET26", e:"dois"}]; pintarTudo();');
  const antes = av('$("fita").rows.length');
  av('window.__linha = $("fita").rows[2];');           // a mais antiga, «um»
  av('fita("três"); pintarTudo();');
  assert.equal(av('$("fita").rows.length'), antes + 1);
  assert.equal(av('document.contains(window.__linha)'), true, 'a linha antiga tem de ser o mesmo nó');
  assert.match(av('$("fita").rows[1].textContent'), /três/, 'a nova entra por cima, a seguir ao cabeçalho');
  av('O.fita = []; pintarTudo();');
  assert.equal(av('$("fita").rows.length'), 1, 'sem registos fica só o cabeçalho');
  av('delete window.__linha;');
});

test('repor uma ocorrência diferente repinta a lista inteira', semAplicacao, () => {
  av('O.evolucao = [{g:"010000SET26", tipo:"posit", txt:"a"}]; pintarTudo();');
  av('O.evolucao = [{g:"020000SET26", tipo:"posit", txt:"b"}]; pintarTudo();');
  assert.equal(av('$("evo-list").querySelectorAll(".evo-i").length'), 1);
  assert.match(av('$("evo-list").textContent'), /b/);
  assert.doesNotMatch(av('$("evo-list").textContent'), /\ba\b/);
});

test('a reavaliação periódica não reconstrói o PEA em vigor com o foco lá dentro', semAplicacao, () => {
  av('window.__rv = renderVigor; window.__n = 0; renderVigor = () => { window.__n++; };');
  try {
    av('$("pea-vigor").innerHTML = "<button id=\\"__foco\\" type=\\"button\\">x</button>"; $("__foco").focus();');
    av('reavaliarPeriodicamente()');
    assert.equal(av('window.__n'), 0, 'com o foco dentro não se repinta');
    av('document.activeElement.blur(); reavaliarPeriodicamente();');
    assert.equal(av('window.__n'), 1, 'sem o foco dentro repinta-se');
  } finally {
    av('renderVigor = window.__rv; delete window.__rv; delete window.__n; $("pea-vigor").innerHTML = "";');
  }
});

test('o catálogo de elementos liga o ouvinte uma vez, por delegação', semAplicacao, () => {
  av(`ELEMENTOS = [{ id:"e1", nome:"Ana Teste", entidade:"CB", ct:"9", funcao:"", nota:"" }];
      pintarElementos(""); pintarElementos("");`);
  assert.equal(av('$("el-lista").dataset.ligado'), '1');
  av('$("el-lista").querySelector("[data-el-editar]").click()');
  assert.equal(av('$("el-nome").value'), 'Ana Teste');
  assert.equal(av('EL_EDICAO'), 'e1');
  av('ELEMENTOS = []; EL_EDICAO = ""; pintarElementos("");');
});

/* ---- responsividade, no CSS ---- */

test('as regras de largura reduzida existem, e os estilos inline de largura saíram', () => {
  assert.match(molde, /@media\(max-width:640px\)\{\s*\/\*[^*]*\*\/\s*nav\{flex-wrap:nowrap;overflow-x:auto/);
  assert.match(molde, /@media\(max-width:1000px\)\{\.g4\{grid-template-columns:repeat\(2,1fr\)\}\}/);
  assert.match(molde, /:where\(button,a,\[tabindex\],input,select,textarea,summary\):focus-visible/);
  assert.doesNotMatch(molde, /style="width:130px"|style="width:160px"|style="width:150px"|style="max-width:200px"/);
});
