/* t0018 — testes do patch p0018 (cartões dobráveis) */
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const ALVO = process.argv[2] || "r0063b.html";

let passou = 0, falhou = 0;
const t = (n, fn) => { try { fn(); console.log("  ok   " + n); passou++; }
  catch (e) { console.log("  FALHA " + n + " -> " + e.message); falhou++; } };
const ig = (a, b, m) => { const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error((m || "") + " esperava " + B + ", obtive " + A); };
const ok = (c, m) => { if (!c) throw new Error(m || "condicao falsa"); };

const d = new JSDOM(fs.readFileSync(ALVO, "utf-8"),
  { runScripts: "dangerously", url: "https://exemplo.test/pea", virtualConsole: new VirtualConsole() });
d.window.Element.prototype.scrollIntoView = function () {};
const w = d.window, ev = c => w.eval("(function(){ return (" + c + "); })()");
const cartao = h => w.eval('cartaoPorTitulo(' + JSON.stringify(h) + ')');

console.log("\n— A · o registo e a auditoria —");
t("os dois cartoes estao declarados", () => {
  ig(ev("CARTOES_DOBRAVEIS.map(x=>x.h)"), ["Fita do tempo", "Linha de evolução"]);
});
t("cada um declara a celula, a norma e a razao", () => {
  const r = ev("CARTOES_DOBRAVEIS.map(x=>({h:x.h, c:x.celula, r:x.r, p:x.porque}))");
  r.forEach(x => {
    ig(x.c, "operacoes", x.h + " devia ser de Operacoes:");
    ok(/art\./.test(x.r), x.h + " sem citacao: " + x.r);
    ok(x.p && x.p.length > 20, x.h + " sem razao declarada");
  });
});
t("a auditoria nao acusa nada", () => {
  const a = ev("auditarDobraveis()");
  ig(a.semCartao, [], "declarados sem cartao:");
  ig(a.semDobrar, [], "cartoes que nao dobraram:");
  ig(a.semRazao, [], "sem razao:");
  ig(a.n, 2);
});
t("um titulo que mude sem o registo acompanhar e apanhado", () => {
  const r = ev('(function(){ var c=cartaoPorTitulo("Fita do tempo");' +
    'var h=c.querySelector("h2"); var antes=h.childNodes[0].textContent;' +
    'h.childNodes[0].textContent="Fita renomeada";' +
    'var a=auditarDobraveis();' +
    'h.childNodes[0].textContent=antes; return a.semCartao; })()');
  ig(r, ["Fita do tempo"]);
});

console.log("— B · fechados por omissao, com contagem a vista —");
t("os dois nascem fechados", () => {
  ["Fita do tempo", "Linha de evolução"].forEach(h => {
    const c = cartao(h);
    ok(c.classList.contains("dobravel"), h + " nao dobrou");
    ok(!c.classList.contains("aberto"), h + " nasceu aberto");
    ig(c.querySelector("h2").getAttribute("aria-expanded"), "false", h + ":");
  });
});
t("o corpo existe e esta escondido", () => {
  ["Fita do tempo", "Linha de evolução"].forEach(h => {
    const c = cartao(h), corpo = c.querySelector(":scope > .cd-corpo");
    ok(corpo, h + " sem corpo");
    ok(corpo.children.length >= 1, h + " com corpo vazio — o conteudo nao mudou de sitio");
  });
});
t("o cabecalho continua a dizer o titulo", () => {
  ["Fita do tempo", "Linha de evolução"].forEach(h => {
    ok(cartao(h).querySelector("h2").textContent.indexOf(h) === 0,
       cartao(h).querySelector("h2").textContent.slice(0, 40));
  });
});
t("fechado, a contagem diz quantos registos ha", () => {
  const r = ev('(function(){ O=novoEstado();' +
    'O.fita=[{g:"301200AGO26",e:"a"},{g:"301201AGO26",e:"b"},{g:"301202AGO26",e:"c"}];' +
    'O.evolucao=[{g:"301200AGO26",tipo:"posit",txt:"x"}];' +
    /* a contagem da fita e pintada por pintarContagens; a da evolucao por quem a criou */
    'pintarTudo();' +
    'return {f:cartaoPorTitulo("Fita do tempo").querySelector(".cd-cnt").textContent,' +
    'e:cartaoPorTitulo("Linha de evolução").querySelector(".cd-cnt").textContent}; })()');
  ig(r.f, "3 registos"); ig(r.e, "1 registo", "singular na contagem da evolucao:");
});
t("sem registos diz-lo em vez de mentir com um zero", () => {
  const r = ev('(function(){ O.fita=[]; O.evolucao=[]; pintarContagens();' +
    'return cartaoPorTitulo("Fita do tempo").querySelector(".cd-cnt").textContent; })()');
  ig(r, "sem registos");
});
t("cada cabecalho tem uma contagem so — nao duas a dizer o mesmo", () => {
  ["Fita do tempo", "Linha de evolução"].forEach(h => {
    const c = cartao(h);
    ig(c.querySelectorAll(":scope > h2 > .cd-cnt").length, 1, h + " contagens:");
    /* a etiqueta legal da fita nao e contagem; a da evolucao foi reaproveitada */
    /* a etiqueta reaproveitada tem as duas classes: nao conta como segunda contagem */
    const tags = [...c.querySelectorAll(":scope > h2 > .tag")].filter(x => !x.classList.contains("cd-cnt"));
    tags.forEach(x => ok(!/\d+ registos?/.test(x.textContent),
      h + " tem uma segunda contagem: " + x.textContent));
  });
});

console.log("— C · abrir e fechar —");
t("clicar no cabecalho abre", () => {
  const c = cartao("Fita do tempo");
  c.querySelector("h2").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok(c.classList.contains("aberto"), "nao abriu");
  ig(c.querySelector("h2").getAttribute("aria-expanded"), "true");
});
t("clicar outra vez fecha", () => {
  const c = cartao("Fita do tempo");
  c.querySelector("h2").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok(!c.classList.contains("aberto"), "nao fechou");
  ig(c.querySelector("h2").getAttribute("aria-expanded"), "false");
});
t("abrir um nao fecha o outro", () => {
  const f = cartao("Fita do tempo"), e = cartao("Linha de evolução");
  f.querySelector("h2").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  e.querySelector("h2").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok(f.classList.contains("aberto") && e.classList.contains("aberto"),
     "acordeao exclusivo: obrigaria a fechar a fita para ver a evolucao");
});
t("o teclado abre e fecha", () => {
  const c = cartao("Linha de evolução"), h2 = c.querySelector("h2");
  ig(h2.getAttribute("role"), "button");
  ig(h2.getAttribute("tabindex"), "0");
  const antes = c.classList.contains("aberto");
  h2.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  ok(c.classList.contains("aberto") !== antes, "Enter nao alternou");
  h2.dispatchEvent(new w.KeyboardEvent("keydown", { key: " ", bubbles: true }));
  ig(c.classList.contains("aberto"), antes, "Espaco nao alternou de volta:");
});
t("abrirCartao com um cartao inexistente nao rebenta", () => {
  ev('abrirCartao(null, true)');
});
t("dobrar duas vezes nao duplica o corpo nem os ouvintes", () => {
  const r = ev('(function(){ dobrarCartoes(); dobrarCartoes();' +
    'var c=cartaoPorTitulo("Fita do tempo");' +
    'return {corpos:c.querySelectorAll(":scope > .cd-corpo").length,' +
    'cnts:c.querySelectorAll(":scope > h2 > .cd-cnt").length}; })()');
  ig(r.corpos, 1, "corpos:"); ig(r.cnts, 1, "contagens:");
});

console.log("— regressoes —");
t("os cartoes continuam em Operacoes", () => {
  ["Fita do tempo", "Linha de evolução"].forEach(h =>
    ok(cartao(h).closest("#p-operacoes"), h + " saiu de Operacoes"));
});
t("a arrumacao por celulas continua sem orfaos", () => {
  ig(ev("auditarArrumacao().semCelula"), []);
  ig(ev("auditarArrumacao().semCartao"), []);
});
t("a fita do tempo continua a receber registos", () => {
  const n = ev('(function(){ O=novoEstado(); fita("registo de teste"); pintarContagens();' +
    'return {n:O.fita.length, cnt:cartaoPorTitulo("Fita do tempo").querySelector(".cd-cnt").textContent}; })()');
  ig(n.n, 1); ig(n.cnt, "1 registo");
});
t("a posse continua limpa e na versao 14", () => {
  ig(ev("VERSAO_ESTADO"), 14);
  const a = ev("auditarPosse(novoEstado())");
  ig(a.orfaos, []); ig(a.duplicados, []);
});
t("o croqui continua de pe", () => { ig(ev("typeof croquiSVG"), "function"); });
t("o rodape anuncia r0063b", () => {
  ok(/r0063b/.test(w.document.body.innerHTML), "revisao nao actualizada");
});

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
