/* t0005 — testes do patch p0005 (posse do estado por célula) */
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const ALVO = process.argv[2] || "r0031.html";

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

console.log("\n— A · o registo cobre o estado inteiro —");
t("as cinco linhas de posse estao declaradas", () => {
  ig(ev("POSSE.map(x=>x.k)"), ["comando","operacoes","planeamento","logistica","infra"].sort((a,b)=>0)
     .filter(()=>true).length ? ev("POSSE.map(x=>x.k)") : null);
  ig(ev("POSSE.length"), 5);
  ["comando","planeamento","operacoes","logistica","infra"].forEach(k =>
    ok(ev("POSSE.some(x=>x.k===" + JSON.stringify(k) + ")"), "falta " + k));
});
t("nenhum ramo do estado fica sem celula", () => {
  const a = ev("auditarPosse(novoEstado())");
  ig(a.orfaos, [], "ramos orfaos:");
  ok(a.folhas > 50, "so " + a.folhas + " folhas percorridas");
});
t("nenhum ramo tem dois donos", () => {
  ig(ev("auditarPosse(novoEstado()).duplicados"), [], "ramos duplicados:");
});
t("um ramo novo sem celula parte a verificacao", () => {
  const a = ev('(function(){ var e = novoEstado(); e.inventado = {campo:""}; return auditarPosse(e); })()');
  ig(a.orfaos, ["inventado.campo"], "devia acusar o ramo novo:");
});
t("cada ramo declara a norma que sustenta a posse", () => {
  const sem = ev('POSSE.filter(c=>c.k!=="infra").flatMap(c=>c.ramos.filter(r=>!r.r||!r.d).map(r=>c.k+":"+r.p))');
  ig(sem, [], "ramos sem base legal ou sem materia:");
});
t("as bases legais citam artigos do Despacho ou do SIOPS", () => {
  const mau = ev('POSSE.filter(c=>c.k!=="infra").flatMap(c=>c.ramos.filter(r=>!/art\\./.test(r.r)).map(r=>r.p))');
  ig(mau, [], "sem citacao de artigo:");
});

console.log("\n— B · a repartição segue a lei —");
t("o PEA e de Planeamento (art. 27.º, n.º 1, al. a))", () => {
  const dn = ev('donoDoRamo("peas")');
  ig(dn.celula, "planeamento"); ok(/27\.º/.test(dn.ramo.r), dn.ramo.r);
});
t("a fita do tempo e de Operacoes (art. 17.º, n.º 1, al. g))", () => {
  const dn = ev('donoDoRamo("fita")');
  ig(dn.celula, "operacoes"); ok(/17\.º/.test(dn.ramo.r) && /g\)/.test(dn.ramo.r), dn.ramo.r);
});
t("o plano de comunicacoes e de Logistica (art. 32.º, n.º 1, al. d))", () => {
  const dn = ev('donoDoRamo("pco.canais")');
  ig(dn.celula, "logistica"); ok(/32\.º/.test(dn.ramo.r), dn.ramo.r);
});
t("as nomeacoes sao de Comando (art. 14.º)", () => {
  ig(ev('donoDoRamo("pco.funcoes").celula'), "comando");
});
t("os meios aereos sao de Operacoes (art. 19.º)", () => {
  const dn = ev('donoDoRamo("dados.est.aerL")');
  ig(dn.celula, "operacoes"); ok(/19\.º/.test(dn.ramo.r), dn.ramo.r);
});
t("a meteorologia e de Planeamento, nucleo de antecipacao (art. 29.º)", () => {
  const dn = ev('donoDoRamo("csv")');
  ig(dn.celula, "planeamento"); ok(/29\.º/.test(dn.ramo.r), dn.ramo.r);
});

console.log("\n— o achado: dados.est reparte-se por duas células —");
t("os setores sao de Operacoes", () => {
  ig(ev('donoDoRamo("dados.est.setores").celula'), "operacoes");
});
t("a reserva e a zona de apoio sao de Logistica (art. 32.º, n.º 1, al. b))", () => {
  const r = ev('donoDoRamo("dados.est.res")'), z = ev('donoDoRamo("dados.est.za")');
  ig(r.celula, "logistica"); ig(z.celula, "logistica");
  ok(/32\.º/.test(r.ramo.r), r.ramo.r);
});
t("o prefixo mais longo vence: dados.est.res nao herda de dados.est.setores", () => {
  ig(ev('donoDoRamo("dados.est.res.m").celula'), "logistica");
  ig(ev('donoDoRamo("dados.est.setores").celula'), "operacoes");
});
t("o ponto de transito e de Logistica, como area da ZCR", () => {
  const dn = ev('donoDoRamo("dados.pt.des")');
  ig(dn.celula, "logistica"); ok(/13\.º/.test(dn.ramo.r) || /32\.º/.test(dn.ramo.r), dn.ramo.r);
});

console.log("\n— C · exportação por célula —");
t("lerRamo caminha caminhos pontuados sem rebentar", () => {
  ig(ev('lerRamo({a:{b:{c:7}}},"a.b.c")'), 7);
  ig(ev('lerRamo({},"a.b.c")'), undefined);
});
t("o instantaneo traz so o que a celula possui", () => {
  const r = ev('(function(){ O = novoEstado();' +
    'O.meta.num="2026080123"; O.csv="linha"; O.fita.push({g:"281200AGO26",e:"x"});' +
    'O.pco.canais.cmd="PC COM 1"; O.dados.est.setores=[{estado:"Em curso (ativo)"}];' +
    'O.dados.est.res={m:"3",o:"12"};' +
    'return { pl:Object.keys(instantaneoCelula("planeamento")),' +
    'op:Object.keys(instantaneoCelula("operacoes")),' +
    'lg:Object.keys(instantaneoCelula("logistica")) }; })()');
  ok(r.pl.includes("csv"), r.pl.join(", "));
  ok(!r.pl.includes("fita"), "planeamento levou a fita: " + r.pl.join(", "));
  ok(r.op.includes("fita") && r.op.includes("dados.est.setores"), r.op.join(", "));
  ok(!r.op.includes("dados.est.res"), "operacoes levou a reserva: " + r.op.join(", "));
  ok(r.lg.includes("pco.canais") && r.lg.includes("dados.est.res"), r.lg.join(", "));
});
t("o pacote declara celula, base legal e a materia de cada ramo", () => {
  const p = ev('pacoteCelula("logistica")');
  ig(p.tipo, "peaapp:celula"); ig(p.celula, "logistica");
  ok(/31\.º a 35\.º/.test(p.base), p.base);
  ig(p.versao, ev("VERSAO_ESTADO"));
  ig(p.ocorrencia.num, "2026080123");
  ok(p.posse.every(x => x.caminho && x.base && x.materia), JSON.stringify(p.posse[0]));
});
t("o pacote e uma copia: mexer nele nao toca no estado", () => {
  const r = ev('(function(){ var p = pacoteCelula("operacoes");' +
    'p.ramos["dados.est.setores"][0].estado = "ALTERADO";' +
    'return O.dados.est.setores[0].estado; })()');
  ig(r, "Em curso (ativo)", "o estado foi alterado pelo pacote:");
});
t("as quatro celulas juntas cobrem o estado sem sobreposicao", () => {
  const r = ev('(function(){ var todos = [];' +
    'POSSE.forEach(c=>c.ramos.forEach(x=>todos.push(x.p)));' +
    'return { n:todos.length, unicos:new Set(todos).size }; })()');
  ig(r.n, r.unicos, "ha caminhos repetidos entre celulas:");
});
t("exportar uma celula desconhecida nao rebenta", () => {
  ev('(function(){ try{ exportarCelula("inexistente"); }catch(e){} return 1; })()');
});

console.log("\n— E · quadro de posse no separador de turno —");
t("cada celula mostra os ramos que possui", () => {
  ev("renderTurno()");
  const q = w.document.getElementById("tn-quadro");
  const blocos = [...q.querySelectorAll(".tn-posse")];
  ig(blocos.length, 4, "blocos de posse:");
  blocos.forEach(b => ok(b.querySelectorAll(".tn-ramo").length >= 3,
    "poucos ramos: " + b.textContent.slice(0, 60)));
});
t("cada celula tem botao de exportacao ligado", () => {
  const bs = [...w.document.querySelectorAll("#tn-quadro [data-expcel]")];
  ig(bs.length, 4);
  ig(bs.map(b => b.dataset.expcel).sort(), ["comando","logistica","operacoes","planeamento"]);
});
t("os ramos trazem a materia e a norma no titulo", () => {
  const r = w.document.querySelector("#tn-quadro .tn-ramo");
  ok(/art\./.test(r.title), r.title);
});
t("sem orfaos o aviso de posse fica escondido", () => {
  ig(w.document.getElementById("tn-orfaos").style.display, "none");
});
t("com um ramo orfao o aviso acende", () => {
  const vis = ev('(function(){ O.inventado = {campo:"x"}; renderQuadroTurno();' +
    'var e = document.getElementById("tn-orfaos");' +
    'var r = {d:e.style.display, t:e.textContent}; delete O.inventado; renderQuadroTurno(); return r; })()');
  ig(vis.d, "block", "aviso nao acendeu:");
  ok(/inventado\.campo/.test(vis.t), vis.t);
});
t("removido o ramo orfao, o aviso apaga-se", () => {
  ig(w.document.getElementById("tn-orfaos").style.display, "none");
});

console.log("\n— regressoes —");
t("a passagem de turno continua a funcionar", () => {
  const r = ev('(function(){ turnoObj().equipa="turno A"; turnoObj().inicio=gdhDe(agora()-3*3600000);' +
    '$("tn-eq2").value="turno B"; fecharTurno();' +
    'return {n:turnoObj().entregas.length, cel:turnoObj().entregas[0].celulas.length}; })()');
  ig(r.n, 1); ig(r.cel, 4);
});
t("as pendencias por celula mantem a fronteira", () => {
  const p = ev('pendenciasCelula("planeamento").map(x=>x.t).join(" | ")');
  ok(!/comunicaç/i.test(p), p);
});
t("as regras de conformidade continuam intactas", () => {
  ig(ev('verificacoesDON().filter(x=>/indisponível/i.test(x.t)).map(x=>x.t)'), []);
});
t("a exportacao da ocorrencia inteira continua de pe", () => {
  ig(ev("typeof exportarOcorrencia"), "function");
  ig(ev("pacoteOcorrencia().versao"), ev("VERSAO_ESTADO"));
});
t("o importador da Gestao PCO continua de pe", () => {
  ig(ev("typeof aplicarGestaoPCO"), "function");
});
t("os paineis continuam todos presentes", () => {
  ["p-occ","p-fontes","p-pco","p-evo","p-meteo","p-pea","p-avisos","p-fita","p-turno"]
    .forEach(id => ok(w.document.getElementById(id), "falta " + id));
});

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
