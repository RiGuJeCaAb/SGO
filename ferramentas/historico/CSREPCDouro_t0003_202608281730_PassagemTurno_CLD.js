/* t0003 — testes do patch p0003 (versão de estado 3 -> 4) */
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const ALVO = process.argv[2] || "r0027.html";
const html = fs.readFileSync(ALVO, "utf-8");

let passou = 0, falhou = 0;
const t = (n, fn) => { try { fn(); console.log("  ok   " + n); passou++; }
  catch (e) { console.log("  FALHA " + n + " -> " + e.message); falhou++; } };
const ig = (a, b, m) => { const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error((m || "") + " esperava " + B + ", obtive " + A); };
const ok = (c, m) => { if (!c) throw new Error(m || "condicao falsa"); };

function arrancar(url) {
  const d = new JSDOM(html, { runScripts: "dangerously", url, virtualConsole: new VirtualConsole() });
  d.window.Element.prototype.scrollIntoView = function () {};
  return { w: d.window, ev: c => d.window.eval("(function(){ return (" + c + "); })()") };
}
const { w, ev } = arrancar("https://exemplo.test/pea");

console.log("\n— A · estado versao 4 —");
t("VERSAO_ESTADO subiu para 4", () => ig(ev("VERSAO_ESTADO"), 4));
t("a escada ganhou um degrau sem perder os anteriores", () => {
  ok(ev("MIGRACOES.length") >= 4, "escada com " + ev("MIGRACOES.length") + " degraus");
});
t("um estado novo nasce com o ramo turno", () => {
  ig(ev("Object.keys(novoEstado().turno).sort()"), ["celulas","entregas","equipa","inicio"]);
  ig(ev("novoEstado().versao"), 4);
});
t("as quatro linhas do PCO estao declaradas", () => {
  ig(ev("CELULAS_PCO().map(x=>x.k)"), ["comando","operacoes","planeamento","logistica"]);
});
t("migrarGravado sobe da versao 3 para a 4 acrescentando o turno", () => {
  const r = ev('(function(){ var g = novoEstado(); g.versao = 3; delete g.turno;' +
    'var e = migrarGravado(g); return {v:e.versao, tem:!!e.turno, cel:Object.keys(e.turno.celulas).length}; })()');
  ig(r.v, 4); ok(r.tem, "sem ramo turno"); ig(r.cel, 4);
});
t("a migracao normaliza solicitado nas funcoes ja nomeadas", () => {
  const r = ev('(function(){ var g = novoEstado(); g.versao = 3; delete g.turno;' +
    'g.pco.funcoes = [{f:"Oficial de Operações", nome:"X", g:"281200AGO26"}];' +
    'var e = migrarGravado(g); return {sol:e.pco.funcoes[0].solicitado, g:e.pco.funcoes[0].g, nome:e.pco.funcoes[0].nome}; })()');
  ig(r.sol, "", "solicitado devia nascer vazio:");
  ig(r.g, "281200AGO26", "a nomeacao nao pode mudar:");
  ig(r.nome, "X");
});
t("a migracao e idempotente e nao apaga entregas", () => {
  const r = ev('(function(){ var g = novoEstado(); g.versao = 4;' +
    'g.turno.entregas = [{g:"281200AGO26", de:"A", para:"B"}];' +
    'var e = migrarGravado(g); return e.turno.entregas.length; })()');
  ig(r, 1, "entregas perdidas:");
});
t("estado de versao futura continua a ser recusado", () => {
  const r = ev('(function(){ var g = novoEstado(); g.versao = 99;' +
    'try{ migrarGravado(g); return {erro:false}; }catch(e){ return {erro:true, fut:e.futuro}; } })()');
  ok(r.erro, "aceitou versao futura"); ig(r.fut, 99);
});

console.log("\n— B · nomeacao externa em dois instantes —");
t("o campo da solicitacao existe e nasce escondido", () => {
  const b = w.document.getElementById("pc-sol-box");
  ok(b, "falta pc-sol-box"); ig(b.style.display, "none");
});
t("o campo aparece so nas funcoes de nomeacao externa", () => {
  const r = ev('(function(){ var out={};' +
    '["Oficial de Operações","Núcleo de Segurança","Núcleo de Emergência Médica","Núcleo de Especialistas"]' +
    '.forEach(function(f){ $("pc-f").innerHTML=\'<option value="\'+f+\'">\'+f+"</option>";' +
    '$("pc-f").value=f; pintarCampoSolicitacao();' +
    'out[f]=$("pc-sol-box").style.display; }); return out; })()');
  ig(r["Oficial de Operações"], "none", "oficial de operacoes nao e nomeacao externa:");
  ig(r["Núcleo de Especialistas"], "none", "especialistas nao e nomeacao externa:");
  ok(r["Núcleo de Segurança"] !== "none", "seguranca devia mostrar o campo");
  ok(r["Núcleo de Emergência Médica"] !== "none", "medica devia mostrar o campo");
});
t("a etiqueta nomeia a entidade nomeadora", () => {
  const txt = ev('(function(){ $("pc-f").innerHTML=\'<option value="Núcleo de Emergência Médica"></option>\';' +
    '$("pc-f").value="Núcleo de Emergência Médica"; pintarCampoSolicitacao();' +
    'return $("pc-sol-box").querySelector("label").textContent; })()');
  ok(/INEM/.test(txt), "etiqueta: " + txt);
});
t("um pedido sem nome fica pendente: solicitado preenchido, g vazio", () => {
  const r = ev('(function(){ O = novoEstado();' +
    '$("pc-f").innerHTML=\'<option value="Núcleo de Segurança"></option>\'; $("pc-f").value="Núcleo de Segurança";' +
    '$("pc-n").value=""; $("pc-e").value=""; $("pc-c").value=""; $("pc-g").value=""; $("pc-sol").value="281310AGO26";' +
    '$("pc-add").click();' +
    'var x = O.pco.funcoes[0]; return {f:x.f, sol:x.solicitado, g:x.g, nome:x.nome}; })()');
  ig(r.f, "Núcleo de Segurança"); ig(r.sol, "281310AGO26");
  ig(r.g, "", "g devia ficar vazio enquanto pendente:");
});
t("a fita distingue solicitacao de nomeacao", () => {
  ok(ev('O.fita.some(x=>/Solicitação de nomeação/.test(x.e))'),
     ev("JSON.stringify(O.fita.map(x=>x.e))"));
});
t("nomear depois preserva o instante da solicitacao", () => {
  const r = ev('(function(){' +
    '$("pc-f").innerHTML=\'<option value="Núcleo de Segurança"></option>\'; $("pc-f").value="Núcleo de Segurança";' +
    '$("pc-n").value="Sarg. Silva"; $("pc-e").value="GNR"; $("pc-c").value="910000000";' +
    '$("pc-g").value="281352AGO26"; $("pc-sol").value="";' +
    '$("pc-add").click();' +
    'var x = O.pco.funcoes.find(y=>y.f==="Núcleo de Segurança");' +
    'return {sol:x.solicitado, g:x.g, nome:x.nome, n:O.pco.funcoes.length}; })()');
  ig(r.sol, "281310AGO26", "a solicitacao perdeu-se ao nomear:");
  ig(r.g, "281352AGO26"); ig(r.nome, "Sarg. Silva");
  ig(r.n, 1, "duplicou o registo:");
});
t("uma nomeacao interna sem GDH continua a receber a hora corrente", () => {
  const r = ev('(function(){' +
    '$("pc-f").innerHTML=\'<option value="Oficial de Operações"></option>\'; $("pc-f").value="Oficial de Operações";' +
    '$("pc-n").value="Cmdt Costa"; $("pc-g").value="";' +
    '$("pc-add").click();' +
    'var x = O.pco.funcoes.find(y=>y.f==="Oficial de Operações"); return {g:x.g, sol:x.solicitado}; })()');
  ok(r.g && r.g.length >= 9, "GDH nao preenchido: " + r.g);
  ig(r.sol, "", "funcao interna nao devia ter solicitado:");
});

console.log("\n— C · passagem de turno —");
t("o painel e o separador existem", () => {
  ok(w.document.getElementById("p-turno"), "falta o painel");
  ok(w.document.querySelector('nav button[data-p="p-turno"]'), "falta o separador");
});
t("as quatro celulas tem campos de quem assegura", () => {
  ev("renderTurno()");
  ["comando","operacoes","planeamento","logistica"].forEach(k =>
    ok(w.document.getElementById("tn-n-" + k), "falta tn-n-" + k));
});
t("horasDeTurno mede desde o GDH declarado", () => {
  ig(ev("horasDeTurno()"), null, "sem inicio devia ser nulo:");
  const h = ev('(function(){ var d=new Date(agora()-5*3600000);' +
    'turnoObj().inicio = gdhDe(d.getTime()); return horasDeTurno(); })()');
  ok(Math.abs(h - 5) < 0.1, "5 h esperadas, obtive " + h);
});
t("as pendencias compoem-se por celula, cada uma do que a lei lhe atribui", () => {
  const r = ev('(function(){ return {' +
    'c:pendenciasCelula("comando").map(x=>x.t),' +
    'o:pendenciasCelula("operacoes").map(x=>x.t),' +
    'p:pendenciasCelula("planeamento").map(x=>x.t),' +
    'l:pendenciasCelula("logistica").map(x=>x.t)}; })()');
  ok(r.c.some(x => /Funções/.test(x)), "comando: " + r.c.join(", "));
  ok(r.o.some(x => /Setores/.test(x)), "operacoes: " + r.o.join(", "));
  ok(r.p.some(x => /PEA/.test(x)), "planeamento: " + r.p.join(", "));
  ok(r.l.some(x => /comunicações/i.test(x)), "logistica: " + r.l.join(", "));
});
t("planeamento nao reclama o plano de comunicacoes (art. 32.º, al. d))", () => {
  const p = ev('pendenciasCelula("planeamento").map(x=>x.t).join(" | ")');
  ok(!/comunicaç/i.test(p), "planeamento inclui comunicacoes: " + p);
});
t("operacoes nao reclama as rendicoes nem o ponto de transito", () => {
  const o = ev('pendenciasCelula("operacoes").map(x=>x.t).join(" | ")');
  ok(!/Rendições|trânsito/i.test(o), "operacoes inclui logistica: " + o);
});
t("comando ve a nomeacao externa pendente", () => {
  const r = ev('(function(){ O.pco.funcoes.push({f:"Núcleo de Emergência Médica", nome:"", solicitado:"281400AGO26", g:""});' +
    'return pendenciasCelula("comando").map(x=>x.t+": "+x.x).join(" | "); })()');
  ok(/pendentes/i.test(r) && /Emergência Médica/.test(r), r);
});
t("fechar a passagem exige a equipa que entra", () => {
  const r = ev('(function(){ $("tn-eq2").value=""; fecharTurno();' +
    'return {n:turnoObj().entregas.length, msg:$("msg-turno").textContent}; })()');
  ig(r.n, 0, "registou sem equipa:");
  ok(/equipa que entra/i.test(r.msg), r.msg);
});
t("a passagem grava as quatro celulas com as suas pendencias", () => {
  const r = ev('(function(){ turnoObj().equipa="EPCO Douro — turno A";' +
    'turnoObj().celulas.operacoes.n="Cmdt Sousa"; turnoObj().celulas.operacoes.nota="setor B com acesso cortado";' +
    '$("tn-eq2").value="EPCO Douro — turno B"; $("tn-g").value="282000AGO26"; fecharTurno();' +
    'var x = turnoObj().entregas[0];' +
    'return {n:turnoObj().entregas.length, de:x.de, para:x.para, cel:x.celulas.length,' +
    'quem:x.celulas.find(c=>c.k==="operacoes").quem, nota:x.celulas.find(c=>c.k==="operacoes").nota,' +
    'pend:x.celulas.find(c=>c.k==="operacoes").pendencias.length, g:x.g}; })()');
  ig(r.n, 1); ig(r.de, "EPCO Douro — turno A"); ig(r.para, "EPCO Douro — turno B");
  ig(r.cel, 4, "celulas gravadas:"); ig(r.quem, "Cmdt Sousa");
  ig(r.nota, "setor B com acesso cortado");
  ok(r.pend >= 1, "operacoes sem pendencias gravadas");
  ig(r.g, "282000AGO26");
});
t("a equipa que entra passa a ser a corrente e o relogio reinicia", () => {
  ig(ev("turnoObj().equipa"), "EPCO Douro — turno B");
  ig(ev("turnoObj().inicio"), "282000AGO26");
});
t("as notas limpam-se mas as pessoas ficam", () => {
  ig(ev('turnoObj().celulas.operacoes.nota'), "", "nota nao limpou:");
  ig(ev('turnoObj().celulas.operacoes.n'), "Cmdt Sousa", "pessoa apagada:");
});
t("a passagem fica na fita do tempo e na evolucao", () => {
  ok(ev('O.fita.some(x=>/Passagem de turno/.test(x.e))'), "sem registo na fita");
  ok(ev('O.evolucao.some(x=>/Passagem de turno/.test(x.txt))'), "sem registo na evolucao");
});
t("o historico mostra a passagem registada", () => {
  ev("renderHistTurno()");
  const h = w.document.getElementById("tn-hist").innerHTML;
  ok(/turno A/.test(h) && /turno B/.test(h), "historico: " + h.slice(0, 160));
});

console.log("\n— D · verificacoes —");
t("turno acima das 12 h gera obrigacao (ponto 7.d.(30))", () => {
  const r = ev('(function(){ turnoObj().inicio = gdhDe(agora()-13*3600000);' +
    'var v = verificacoesDON().find(x=>x.id==="turno");' +
    'return {n:v.n, t:v.t, r:v.r}; })()');
  ig(r.n, "ob", "nivel:"); ok(/[Rr]otatividade/.test(r.t), r.t);
  ok(/7\.d\.\(30\)/.test(r.r), r.r);
});
t("turno por declarar avisa depois de 3 h de ocorrencia", () => {
  const r = ev('(function(){ turnoObj().inicio="";' +
    'O.meta.inicio = gdhDe(agora()-4*3600000);' +
    'var v = verificacoesDON().find(x=>x.id==="turno"); return v? {n:v.n, t:v.t} : null; })()');
  ok(r, "verificacao ausente — o ramo do turno por declarar nao corre");
  ig(r.n, "av"); ok(/por declarar/.test(r.t), r.t);
});
t("nenhuma regra rebentou e virou aviso de indisponibilidade", () => {
  const maus = ev('verificacoesDON().filter(x=>/Verificação indisponível/.test(x.t)).map(x=>x.t+" :: "+x.s)');
  ig(maus, [], "regras a falhar:");
});
t("turno acima das 10 h antecipa", () => {
  ig(ev('(function(){ turnoObj().inicio = gdhDe(agora()-10.5*3600000);' +
    'return verificacoesDON().find(x=>x.id==="turno").n; })()'), "av");
});
t("turno dentro do periodo confirma conformidade e projeta a hora", () => {
  const r = ev('(function(){ turnoObj().inicio = gdhDe(agora()-3*3600000);' +
    'var v = verificacoesDON().find(x=>x.id==="turno"); return {n:v.n, s:v.s}; })()');
  ig(r.n, "ok"); ok(/prevista/.test(r.s), r.s);
});
t("nomeacao externa pendente gera antecipacao com a entidade nomeadora", () => {
  const v = ev('verificacoesDON().find(x=>x.id==="nomext")');
  ok(v, "verificacao ausente");
  ig(v.n, "av");
  ok(/INEM/.test(v.s) || /INEM/.test(v.f), "sem entidade: " + v.s);
  ok(/23\.º/.test(v.r) && /24\.º/.test(v.r), v.r);
});
t("sem pendencias externas a verificacao desaparece", () => {
  ok(!ev('(function(){ O.pco.funcoes = O.pco.funcoes.filter(x=>!(x.solicitado && !x.g));' +
     'return !!verificacoesDON().find(x=>x.id==="nomext"); })()'), "verificacao persistiu");
});

console.log("\n— regressoes —");
t("os paineis anteriores continuam presentes", () => {
  ["p-occ","p-fontes","p-pco","p-evo","p-meteo","p-pea","p-avisos","p-fita","p-turno"]
    .forEach(id => ok(w.document.getElementById(id), "falta " + id));
});
t("o separador de turno comuta o painel", () => {
  w.document.querySelector('nav button[data-p="p-turno"]')
    .dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok(w.document.getElementById("p-turno").classList.contains("on"), "painel nao abriu");
});
t("a repartição do PEA pelas celulas manteve-se", () => {
  const d = ev("detCompleto([],null)");
  ok(!("missoes" in d.pea), "missoes vazaram para o plano");
  ig(Object.keys(d.ordens), ["missoes"]);
});
t("exportacao e importacao continuam de pe e declaram a versao 4", () => {
  ig(ev("typeof exportarOcorrencia"), "function");
  ig(ev("pacoteOcorrencia().versao"), 4);
  ok(ev("!!pacoteOcorrencia().estado.turno"), "o pacote nao leva o turno");
});
t("o adaptador de modelo continua a declarar o modo", () => {
  ig(ev("LLM.modo"), "rele");
  ok(w.document.getElementById("llm-modo").textContent.length > 10);
});

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
