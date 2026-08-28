/* t0006 — testes do patch p0006 (versão de estado 4 -> 5, ramo da logística) */
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const ALVO = process.argv[2] || "r0032.html";

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

console.log("\n— A · a conflacao esta resolvida —");
t("dados.est deixou de conter a reserva e a zona de apoio", () => {
  const k = ev("Object.keys(novoEstado().dados.est).sort()");
  ig(k, ["aer","aerL","livre","n","setores"], "chaves de dados.est:");
});
t("dados.est so contem materia de Operacoes", () => {
  const donos = ev('Object.keys(novoEstado().dados.est).map(k=>donoDoRamo("dados.est."+k).celula)');
  ig([...new Set(donos)], ["operacoes"], "celulas presentes em dados.est:");
});
t("a logistica tem ramo proprio com as tres materias", () => {
  ig(ev("Object.keys(novoEstado().logistica).sort()"), ["pontoTransito","reserva","zonaApoio"]);
});
t("dados.pt desapareceu da origem", () => {
  ok(!("pt" in ev("novoEstado().dados")), "dados.pt ainda existe");
});

console.log("\n— B · migracao 4 -> 5 —");
t("VERSAO_ESTADO subiu para 5 e a escada tem cinco degraus", () => {
  ig(ev("VERSAO_ESTADO"), 5);
  ok(ev("MIGRACOES.length") >= 5, "escada com " + ev("MIGRACOES.length"));
});
t("um estado da versao 4 migra sem perder um unico valor", () => {
  const r = ev('(function(){' +
    'var g = novoEstado(); g.versao = 4;' +
    'delete g.logistica;' +
    'g.dados.est.res = {m:"6", o:"24"};' +
    'g.dados.est.za  = {m:"2", o:"8"};' +
    'g.dados.pt = {des:"Rotunda EN226", resp:"Adj. Pinto", ct:"910000000", cd:"", obs:"nota"};' +
    'g.dados.est.setores = [{estado:"Em curso (ativo)"}];' +
    'var e = migrarGravado(g);' +
    'return {v:e.versao, res:e.logistica.reserva, za:e.logistica.zonaApoio,' +
    'pt:e.logistica.pontoTransito, set:e.dados.est.setores.length,' +
    'restaRes:("res" in e.dados.est), restaZa:("za" in e.dados.est), restaPt:("pt" in e.dados)}; })()');
  ig(r.v, 5);
  ig(r.res, {m:"6",o:"24"}, "reserva:");
  ig(r.za, {m:"2",o:"8"}, "zona de apoio:");
  ig(r.pt.des, "Rotunda EN226"); ig(r.pt.resp, "Adj. Pinto"); ig(r.pt.obs, "nota");
  ig(r.set, 1, "setores perdidos:");
  ok(!r.restaRes && !r.restaZa && !r.restaPt, "a origem nao foi limpa: duas verdades");
});
t("a migracao atravessa a escada inteira desde a versao 0", () => {
  const r = ev('(function(){' +
    'var g = {meta:{num:"1"}, dados:{est:{n:1, setores:[{estado:"Frente ativa"}], res:{m:"3",o:"12"}},' +
    'pt:{des:"PT antigo"}}, pco:{funcoes:[{f:"Oficial de Operações", nome:"X", g:"281200AGO26"}]}};' +
    'var e = migrarGravado(g);' +
    'return {v:e.versao, res:e.logistica.reserva.m, pt:e.logistica.pontoTransito.des,' +
    'turno:!!e.turno, sol:e.pco.funcoes[0].solicitado}; })()');
  ig(r.v, 5); ig(r.res, "3"); ig(r.pt, "PT antigo");
  ok(r.turno, "o ramo do turno perdeu-se"); ig(r.sol, "");
});
t("a migracao e idempotente", () => {
  const r = ev('(function(){ var g = novoEstado(); g.versao = 5;' +
    'g.logistica.reserva = {m:"9",o:"30"};' +
    'var e = migrarGravado(migrarGravado(g)); return e.logistica.reserva; })()');
  ig(r, {m:"9",o:"30"});
});
t("o que ja estava em logistica vence o que restar na origem", () => {
  const r = ev('(function(){ var g = novoEstado(); g.versao = 4;' +
    'g.logistica = {reserva:{m:"NOVO",o:""}};' +
    'g.dados.est.res = {m:"VELHO",o:""};' +
    'return migrarGravado(g).logistica.reserva.m; })()');
  ig(r, "NOVO", "a origem sobrepos o destino:");
});
t("estado de versao futura continua recusado", () => {
  const r = ev('(function(){ var g = novoEstado(); g.versao = 99;' +
    'try{ migrarGravado(g); return {erro:false}; }catch(e){ return {erro:true, fut:e.futuro}; } })()');
  ok(r.erro); ig(r.fut, 99);
});

console.log("\n— C · acessores —");
t("ptObj mantem o nome e devolve da logistica", () => {
  const r = ev('(function(){ O = novoEstado(); ptObj().des = "Rotunda";' +
    'return {L:O.logistica.pontoTransito.des, semPt:!("pt" in O.dados)}; })()');
  ig(r.L, "Rotunda"); ok(r.semPt, "escreveu no sitio antigo");
});
t("reservaObj e zaObj escrevem no ramo da logistica", () => {
  const r = ev('(function(){ O = novoEstado(); reservaObj().m="6"; zaObj().o="8";' +
    'return {r:O.logistica.reserva.m, z:O.logistica.zonaApoio.o,' +
    'estLimpo:!("res" in O.dados.est) && !("za" in O.dados.est)}; })()');
  ig(r.r, "6"); ig(r.z, "8"); ok(r.estLimpo, "dados.est voltou a ganhar res/za");
});
t("os acessores normalizam ramo em falta sem rebentar", () => {
  const r = ev('(function(){ O = novoEstado(); delete O.logistica;' +
    'return {r:reservaObj(), p:ptObj().des}; })()');
  ig(r.r, {m:"",o:""}); ig(r.p, "");
});

console.log("\n— D · o registo de posse acompanhou —");
t("a auditoria continua sem orfaos nem duplicados", () => {
  const a = ev("auditarPosse(novoEstado())");
  ig(a.orfaos, [], "orfaos:"); ig(a.duplicados, [], "duplicados:");
});
t("os caminhos novos tem dono, os antigos ja nao existem", () => {
  ig(ev('donoDoRamo("logistica.reserva").celula'), "logistica");
  ig(ev('donoDoRamo("logistica.zonaApoio").celula'), "logistica");
  ig(ev('donoDoRamo("logistica.pontoTransito.des").celula'), "logistica");
  ok(!ev('POSSE.some(c=>c.ramos.some(r=>r.p==="dados.est.res"))'), "dados.est.res ainda declarado");
});
t("o plano de comunicacoes esta declarado como movimento pendente", () => {
  const m = ev("auditarPosse(novoEstado()).porMover");
  ig(m.length, 1, "movimentos pendentes:");
  ig(m[0].de, "pco.canais"); ig(m[0].para, "logistica.comunicacoes");
  ok(m[0].porque.length > 20, "sem razao declarada: " + m[0].porque);
});
t("o instantaneo da logistica traz as tres materias", () => {
  const r = ev('(function(){ O = novoEstado(); reservaObj().m="6"; ptObj().des="Rotunda";' +
    'O.pco.canais.cmd="PC COM 1";' +
    'return Object.keys(instantaneoCelula("logistica")).sort(); })()');
  ig(r, ["logistica.pontoTransito","logistica.reserva","logistica.zonaApoio","pco.canais"]);
});
t("operacoes deixou de levar a reserva no instantaneo", () => {
  const r = ev('Object.keys(instantaneoCelula("operacoes"))');
  ok(!r.some(x => /^(res|za|reserva|zonaApoio|pt|pontoTransito)$/.test(x.split(".").pop())), r.join(", "));
});

console.log("\n— E · o dispositivo continua a contar certo —");
t("contarDispositivo soma a reserva e a ZA do ramo novo", () => {
  const r = ev('(function(){ O = novoEstado();' +
    'O.dados.est.setores = [{tip:[{t:"ECIN",q:2,mu:1,ou:5}]}];' +
    'reservaObj().m="6"; reservaObj().o="24"; zaObj().m="2"; zaObj().o="8";' +
    'return contarDispositivo(); })()');
  ig(r.m, 10, "meios (2 ECIN + 6 reserva + 2 ZA):");
  ig(r.op, 42, "operacionais (10 + 24 + 8):");
});
t("comporSetores descreve a reserva e a ZA", () => {
  const r = ev('(function(){ comporSetores(); return O.dados.setores; })()');
  ok(/Reserva: 6 meios \/ 24 op\./.test(r), r);
  ok(/ZA: 2 meios \/ 8 op\./.test(r), r);
});
t("retratoOperacional le do ramo novo", () => {
  const r = ev("retratoOperacional()");
  ig(r.reserva, 6); ig(r.reservaOp, 24); ig(r.za, 2);
});
t("as pendencias de logistica mostram a reserva e o ponto de transito", () => {
  const r = ev('pendenciasCelula("logistica").map(x=>x.t+": "+(Array.isArray(x.x)?x.x.join("; "):x.x)).join(" | ")');
  ok(/reserva 6 meios \/ 24 op\./.test(r), r);
  ok(/trânsito/i.test(r), r);
});

console.log("\n— regressoes —");
t("a exportacao da ocorrencia declara a versao 5 e leva a logistica", () => {
  const p = ev("pacoteOcorrencia()");
  ig(p.versao, 5); ok(p.estado.logistica, "sem ramo da logistica no pacote");
});
t("exportar e reimportar preserva a reserva e o ponto de transito", () => {
  const r = ev('(function(){ O = novoEstado(); O.meta.num="1"; reservaObj().m="7"; ptObj().des="Rotunda";' +
    'var txt = JSON.stringify(pacoteOcorrencia());' +
    'O = novoEstado();' +
    'var e = lerPacoteOcorrencia(txt); O = e;' +
    'return {r:reservaObj().m, p:ptObj().des, v:O.versao}; })()');
  ig(r.r, "7"); ig(r.p, "Rotunda"); ig(r.v, 5);
});
t("a passagem de turno continua a funcionar", () => {
  const r = ev('(function(){ O = novoEstado(); turnoObj().equipa="A"; turnoObj().inicio=gdhDe(agora()-3*3600000);' +
    '$("tn-eq2").value="B"; fecharTurno(); return turnoObj().entregas.length; })()');
  ig(r, 1);
});
t("nenhuma regra de conformidade rebentou", () => {
  ig(ev('verificacoesDON().filter(x=>/indisponível/i.test(x.t)).map(x=>x.t)'), []);
});
t("o importador da Gestao PCO continua de pe", () => {
  ig(ev("typeof aplicarGestaoPCO"), "function");
  ig(ev("typeof diferencialGestaoPCO"), "function");
});
t("os paineis continuam todos presentes", () => {
  ["p-occ","p-fontes","p-pco","p-evo","p-meteo","p-pea","p-avisos","p-fita","p-turno"]
    .forEach(id => ok(w.document.getElementById(id), "falta " + id));
});

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
