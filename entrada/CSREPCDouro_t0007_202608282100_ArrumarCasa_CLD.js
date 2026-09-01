/* t0007 — testes do patch p0007 (interface arrumada por célula do PCO) */
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const ALVO = process.argv[2] || "real_r0036.html";

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
const cartoes = k => ev('[...document.querySelectorAll("#p-' + k + ' > .card")].map(tituloCartao)');

console.log("\n— A · a casa esta arrumada por celula —");
t("ha um separador por celula, e um para a passagem de turno", () => {
  const n = ev('[...document.querySelectorAll("nav button")].map(b=>b.dataset.p)');
  ig(n, ["p-comando","p-planeamento","p-operacoes","p-logistica","p-turno"]);
});
t("nenhum cartao ficou sem celula", () => {
  ig(ev("auditarArrumacao().semCelula"), [], "cartoes orfaos:");
});
t("nenhum registo aponta para cartao inexistente", () => {
  ig(ev("auditarArrumacao().semCartao"), [], "registos sem cartao:");
});
t("cada cartao declara a norma que o coloca ali", () => {
  ig(ev("auditarArrumacao().semNorma"), [], "sem norma:");
});
t("um titulo que mude sem o registo acompanhar e apanhado", () => {
  const r = ev('(function(){' +
    'var c = cartaoPorTitulo("Ponto de trânsito");' +
    'var h = c.querySelector("h2"); var antes = h.childNodes[0].textContent;' +
    'h.childNodes[0].textContent = "Ponto de transito renomeado";' +
    'var a = auditarArrumacao();' +
    'h.childNodes[0].textContent = antes;' +
    'return {semCartao:a.semCartao, semCelula:a.semCelula}; })()');
  ig(r.semCartao, ["Ponto de trânsito"], "o registo devia acusar o cartao em falta:");
});

console.log("\n— B · cada materia na sala da sua celula —");
t("Comando tem a identificacao, o PCO e os avisos", () => {
  const c = cartoes("comando");
  ["Identificação da ocorrência","Estrutura do posto de comando","Avisos ativos"]
    .forEach(x => ok(c.includes(x), x + " nao esta em Comando: " + c.join(" | ")));
});
t("Planeamento tem a meteorologia, o terreno e o PEA", () => {
  const c = cartoes("planeamento");
  ["Previsão meteorológica","Análise determinística","Leitura do terreno",
   "Elaborar proposta de PEA","Histórico de propostas de PEA","Perfil de elevação"]
    .forEach(x => ok(c.includes(x), x + " nao esta em Planeamento: " + c.join(" | ")));
});
t("Operacoes tem o dispositivo, a evolucao e a fita do tempo", () => {
  const c = cartoes("operacoes");
  ["Dispositivo e setorização","Registo de evolução da situação operacional","Fita do tempo"]
    .forEach(x => ok(c.includes(x), x + " nao esta em Operacoes: " + c.join(" | ")));
});
t("Logistica tem as comunicacoes, o ponto de transito e as rendicoes", () => {
  const c = cartoes("logistica");
  ["Plano de comunicações","Pacote de canais","Ponto de trânsito","Tempos de empenhamento e rendições"]
    .forEach(x => ok(c.includes(x), x + " nao esta em Logistica: " + c.join(" | ")));
});
t("o plano de comunicacoes saiu do separador do PCO (art. 32.º, al. d))", () => {
  ok(!cartoes("comando").includes("Plano de comunicações"), "continua em Comando");
  ok(cartoes("logistica").includes("Plano de comunicações"));
});
t("a fita do tempo saiu de painel neutro para Operacoes (art. 17.º, al. g))", () => {
  ok(cartoes("operacoes").includes("Fita do tempo"));
  ig(ev('document.querySelectorAll("#p-fita > .card").length'), 0, "restou cartao no painel antigo:");
});

console.log("\n— C · o cartao que misturava duas celulas foi dividido —");
t("area, terreno e exposicao ficaram em Planeamento", () => {
  const c = cartoes("planeamento");
  ok(c.includes("Dados operacionais da ocorrência") && c.includes("Leitura do terreno"), c.join(" | "));
});
t("a setorizacao passou a cartao proprio, em Operacoes", () => {
  ok(cartoes("operacoes").includes("Dispositivo e setorização"));
});
t("a setorizacao ja nao esta no cartao de Planeamento", () => {
  const r = ev('cartaoPorTitulo("Dados operacionais da ocorrência").textContent');
  ok(!/Setorização do TO/.test(r), "a setorizacao ficou em Planeamento");
});
t("a importacao da Gestao PCO acompanha o dispositivo", () => {
  const r = ev('cartaoPorTitulo("Dispositivo e setorização").textContent');
  ok(/Importação da Gestão PCO/.test(r), "a importacao nao acompanhou o dispositivo");
});
t("os controlos da setorizacao continuam a responder depois de mudados de painel", () => {
  const r = ev('(function(){ O = novoEstado();' +
    'var sel = document.getElementById("s-n");' +
    'ok = sel && sel.closest("#p-operacoes");' +
    'sel.value = "2"; sel.dispatchEvent(new Event("change", {bubbles:true}));' +
    'return {noPainel:!!ok, n:estObj().n, linhas:document.querySelectorAll("#s-lista .set-box").length}; })()');
  ok(r.noPainel, "o controlo nao esta no painel de Operacoes");
  ig(r.n, 2, "o ouvinte perdeu-se ao mover o no:");
});

console.log("\n— D · a navegacao antiga continua a funcionar —");
t("os identificadores antigos resolvem para a celula certa", () => {
  const m = ev("ATALHOS_PANE");
  ig(m["p-fontes"].pane, "p-planeamento");
  ig(m["p-pco"].pane, "p-comando");
  ig(m["p-evo"].pane, "p-operacoes");
  ig(m["p-fita"].pane, "p-operacoes");
  ig(m["p-pea"].pane, "p-planeamento");
});
t("irPara com identificador antigo abre a celula certa", () => {
  ev('irPara("p-fontes")');
  ok(w.document.getElementById("p-planeamento").classList.contains("on"), "nao abriu Planeamento");
  ev('irPara("p-evo")');
  ok(w.document.getElementById("p-operacoes").classList.contains("on"), "nao abriu Operacoes");
});
t("irPara com identificador novo continua a funcionar", () => {
  ev('irPara("p-logistica")');
  ok(w.document.getElementById("p-logistica").classList.contains("on"));
});
t("irPara com identificador desconhecido nao rebenta", () => {
  ev('irPara("p-inexistente")');
});
t("os paineis antigos ficaram vazios e fora da vista", () => {
  ["p-occ","p-fontes","p-pco","p-evo","p-meteo","p-pea","p-avisos","p-fita"].forEach(id=>{
    const e = w.document.getElementById(id);
    ok(e, "o identificador " + id + " desapareceu");
    ok(e.classList.contains("husk"), id + " nao foi marcado como vazio");
    ig(e.querySelectorAll(".card").length, 0, id + " ainda tem cartoes:");
  });
});
t("o sinal do cabecalho abre Comando e nao um painel vazio", () => {
  w.document.getElementById("b-sinal").dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
  ok(w.document.getElementById("p-comando").classList.contains("on"), "nao abriu Comando");
});
t("os nomes dos destinos falam de celulas", () => {
  const n = ev("NOMES_PANE");
  ok(/Planeamento/.test(n["p-meteo"]), n["p-meteo"]);
  ok(/Operações/.test(n["p-evo"]), n["p-evo"]);
});

console.log("\n— regressoes —");
t("o botao de emitir PEA continua ligado", () => {
  const b = w.document.getElementById("b-gerar");
  ok(b && b.onclick, "onclick perdido ao mover o cartao");
  ok(b.closest("#p-planeamento"), "o botao nao esta em Planeamento");
});
t("as caixas dinamicas do PEA seguiram Planeamento", () => {
  ["pea-vigor","pea-view"].forEach(id=>{
    const e = w.document.getElementById(id);
    ok(e && e.closest("#p-planeamento"), id + " nao esta em Planeamento");
  });
});
t("a posse por celula continua auditada e limpa", () => {
  const a = ev("auditarPosse(novoEstado())");
  ig(a.orfaos, []); ig(a.duplicados, []);
});
t("a passagem de turno continua a mostrar as quatro celulas", () => {
  ev("renderTurno()");
  ig(w.document.querySelectorAll("#tn-quadro .sub").length, 4);
});
t("nenhuma regra de conformidade rebentou", () => {
  ig(ev('verificacoesDON().filter(x=>/indisponível/i.test(x.t)).map(x=>x.t)'), []);
});
t("o importador da Gestao PCO continua de pe", () => {
  ig(ev("typeof aplicarGestaoPCO"), "function");
  ok(w.document.getElementById("gp-txt") || ev('cartaoPorTitulo("Dispositivo e setorização")'), "bloco de importacao perdido");
});

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
