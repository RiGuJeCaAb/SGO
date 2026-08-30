/* t0001 — testes do patch p0001 (r0022 -> r0023)
   Executar em /home/claude/pea com r0023.html presente. */
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const html = fs.readFileSync("r0023.html", "utf-8");

let passou = 0, falhou = 0;
const t = (n, fn) => { try { fn(); console.log("  ok   " + n); passou++; }
  catch (e) { console.log("  FALHA " + n + " -> " + e.message); falhou++; } };
const ig = (a, b, m) => { const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error((m || "") + " esperava " + B + ", obtive " + A); };
const ok = (c, m) => { if (!c) throw new Error(m || "condicao falsa"); };

function arrancar(url) {
  const d = new JSDOM(html, { runScripts: "dangerously", url, virtualConsole: new VirtualConsole() });
  d.window.Element.prototype.scrollIntoView = function () {};
  // const/let de topo vivem no ambito do script, nao em window
  return { w: d.window, ev: c => d.window.eval("(function(){ return (" + c + "); })()") };
}
const { w, ev } = arrancar("https://exemplo.test/pea");

console.log("\n— A · nucleos das celulas —");
t("os quatro nucleos em falta desde r0015 estao presentes", () => {
  const n = ev("FUNCOES_PCO.map(x=>x.f)");
  ["Núcleo de Especialistas", "Núcleo de Segurança", "Núcleo de Emergência Médica",
   "Núcleo de Apoio Psicológico e Social de Emergência"].forEach(x => ok(n.includes(x), "falta " + x));
});
t("especialistas em Planeamento, art. 30.º (DON 2, 7.e.(27))", () => {
  ig(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Especialistas").g'), "Planeamento");
  ok(/art\. 30\.º/.test(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Especialistas").r')));
});
t("seguranca, medica e psicossocial em Operacoes (arts. 23.º a 25.º)", () => {
  ["Núcleo de Segurança", "Núcleo de Emergência Médica",
   "Núcleo de Apoio Psicológico e Social de Emergência"].forEach(x =>
    ig(ev('FUNCOES_PCO.find(y=>y.f==="' + x + '").g'), "Operações", x));
});
t("os nucleos de nomeacao externa declaram a entidade nomeadora", () => {
  ig(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Segurança").ext'),
     "força de segurança territorialmente competente");
  ig(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Emergência Médica").ext'), "INEM, I.P.");
  ig(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Apoio Psicológico e Social de Emergência").ext'),
     "Instituto da Segurança Social, I.P.");
});
t("informacoes e o art. 28.º; antecipacao e o art. 29.º", () => {
  ok(/art\. 28\.º/.test(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Informações").r')), "informacoes");
  ok(/art\. 29\.º/.test(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Antecipação").r')), "antecipacao");
});
t("monitorizacao e controlo exigivel na fase IV, nao na II (art. 18.º, n.º 1)", () => {
  ev('(O.meta.fase="IV")');
  ok(ev('funcoesExigiveis().map(x=>x.f)').includes("Núcleo de Monitorização e Controlo"), "fase IV");
  ev('(O.meta.fase="II")');
  ok(!ev('funcoesExigiveis().map(x=>x.f)').includes("Núcleo de Monitorização e Controlo"), "fase II");
  ev('(O.meta.fase="")');
});

console.log("\n— B · autoria do PEA —");
t("gerarPEA e gerarOrdens substituiram gerarPlan e gerarOps", () => {
  ig(ev("typeof gerarPEA"), "function"); ig(ev("typeof gerarOrdens"), "function");
  ig(ev("typeof gerarPlan"), "undefined"); ig(ev("typeof gerarOps"), "undefined");
});
t("gerarOrdens recebe o plano aprovado como quarto argumento", () => {
  ig(ev("gerarOrdens.length"), 4, "aridade:");
});
t("detCompleto reparte pela fronteira legal", () => {
  const d = ev("detCompleto([],null)");
  ["situacao", "analise_zi", "previsao", "objetivo", "propostas", "seguranca", "validade"]
    .forEach(k => ok(k in d.pea, "o plano devia conter " + k));
  ig(Object.keys(d.ordens), ["missoes"], "ordens so tem missoes:");
  ok(!("missoes" in d.pea), "missoes vazaram para o plano");
  ok(!("objetivo" in d.ordens), "o objetivo vazou para as ordens");
});
t("o plano deterministico traz objetivo, prioridades e seguranca", () => {
  const p = ev("detCompleto([],null).pea");
  ok(typeof p.objetivo === "string" && p.objetivo.length > 10, "objetivo vazio");
  ok(p.propostas.length >= 3, "poucas prioridades");
  ok(p.seguranca.length >= 3, "poucas medidas");
});
t("as ordens saem executaveis, com tipo e atribuicao", () => {
  const m = ev("detCompleto([],null).ordens.missoes");
  ok(m.length >= 2, "poucas missoes");
  ok(m.some(x => /decisiva/i.test(x.tipo)), "sem acao decisiva");
  m.forEach(x => ok(x.atribuida && x.atribuida.length, "missao sem atribuicao"));
});

console.log("\n— C · migracao pela escada de r0022 —");
t("VERSAO_ESTADO subiu para 2", () => { ig(ev("VERSAO_ESTADO"), 2); });
t("existem duas migracoes na escada", () => { ig(ev("MIGRACOES.length"), 2); });
t("um estado novo nasce na versao 2", () => { ig(ev("novoEstado().versao"), 2); });
t("migrarGravado converte um estado da versao 1 para {pea,ordens}", () => {
  const r = ev('(function(){' +
    'var g = novoEstado(); g.versao = 1;' +
    'g.peas = [{n:1, json:{plan:{situacao:"S",analise_zi:"A",previsao:"P"},' +
    'ops:{objetivo:"O",propostas:[{id:"P1",texto:"x"}],missoes:[{texto:"m",tipo:"Ação decisiva"}],' +
    'seguranca:["s"],validade:"V"}}}];' +
    'var e = migrarGravado(g);' +
    'return {v:e.versao, tem:!!e.peas[0].json.pea, obj:e.peas[0].json.pea.objetivo,' +
    'prop:e.peas[0].json.pea.propostas.length, seg:e.peas[0].json.pea.seguranca.length,' +
    'val:e.peas[0].json.pea.validade, miss:e.peas[0].json.ordens.missoes.length,' +
    'velho:!!e.peas[0].json.plan}; })()');
  ig(r.v, 2, "versao final:"); ok(r.tem, "nao gravou em {pea,ordens}");
  ig(r.obj, "O"); ig(r.prop, 1); ig(r.seg, 1); ig(r.val, "V"); ig(r.miss, 1);
  ok(!r.velho, "restou o formato antigo");
});
t("migrarGravado atravessa a escada inteira desde a versao 0", () => {
  const r = ev('(function(){' +
    'var g = {meta:{num:"1"}, peas:[{n:1, json:{situacao:"S",analise:"A",previsao:"P",' +
    'objetivo:"O",missoes:[{texto:"m"}],propostas:[],seguranca:[],validade:"V"}}]};' +
    'var e = migrarGravado(g);' +
    'return {v:e.versao, obj:e.peas[0].json.pea.objetivo, azi:e.peas[0].json.pea.analise_zi,' +
    'miss:e.peas[0].json.ordens.missoes.length}; })()');
  ig(r.v, 2); ig(r.obj, "O"); ig(r.azi, "A"); ig(r.miss, 1);
});
t("a migracao nao perde conteudo nenhum", () => {
  const r = ev('(function(){' +
    'var antes = {situacao:"S",analise_zi:"A",previsao:"P",objetivo:"O",' +
    'propostas:[{id:"P1",texto:"x",fundamento:"f"}],seguranca:["s1","s2"],validade:"V",' +
    'missoes:[{tipo:"T",texto:"m",atribuida:"Setor A",gdh:"G"}]};' +
    'var g = novoEstado(); g.versao = 1;' +
    'g.peas = [{n:1, json:{plan:{situacao:antes.situacao,analise_zi:antes.analise_zi,previsao:antes.previsao},' +
    'ops:{objetivo:antes.objetivo,propostas:antes.propostas,seguranca:antes.seguranca,' +
    'validade:antes.validade,missoes:antes.missoes}}}];' +
    'var e = migrarGravado(g); var d = e.peas[0].json;' +
    'var junto = Object.assign({}, d.pea, d.ordens);' +
    'return Object.keys(antes).every(function(k){ return JSON.stringify(junto[k])===JSON.stringify(antes[k]); }); })()');
  ok(r, "algum campo mudou de valor na migracao");
});
t("migrarGravado recusa estado de versao futura sem lhe tocar", () => {
  const r = ev('(function(){ var g = novoEstado(); g.versao = 99;' +
    'try{ migrarGravado(g); return {erro:false}; }catch(e){ return {erro:true, fut:e.futuro}; } })()');
  ok(r.erro, "aceitou versao futura"); ig(r.fut, 99);
});
t("pecas() e idempotente sobre o formato ja convertido", () => {
  const c = ev('pecas({json:{pea:{situacao:"S",objetivo:"O"},ordens:{missoes:[{texto:"m"}]}}})');
  ig(c.pea.objetivo, "O"); ig(c.ordens.missoes.length, 1);
});
t("pecas() sobrevive a um PEA sem json", () => {
  const c = ev("pecas({})"); ig(c.ordens.missoes, []); ig(c.pea.propostas, []);
});

console.log("\n— D · adaptador de modelo —");
t("origem http e reconhecida como rele local", () => {
  ig(ev("LLM.modo"), "rele"); ig(ev("LLM.url"), "https://exemplo.test/pea/llm");
});
t("o modo e declarado ao operador, nao silencioso", () => {
  const e = w.document.getElementById("llm-modo");
  ok(e, "falta o indicador");
  ok(e.textContent.indexOf("Modo de redação") === 0, "indicador vazio: " + e.textContent);
  ig(e.style.display, "block");
});
const { w: w2, ev: ev2 } = arrancar("file:///D:/EstacaoPEA.html");
t("arranque de file:// cai em modo manual, sem URL de rede", () => {
  ig(ev2("LLM.modo"), "manual"); ig(ev2("LLM.url"), null);
});
t("modo manual e sinalizado como aviso, nao como sucesso", () => {
  const e = w2.document.getElementById("llm-modo");
  ok(/err/.test(e.className), "classe: " + e.className);
  ok(/sem acesso a modelo/i.test(e.textContent), e.textContent);
});

console.log("\n— regressoes sobre r0022 —");
t("os oito paineis continuam presentes", () => {
  ["p-occ","p-fontes","p-pco","p-evo","p-meteo","p-pea","p-avisos","p-fita"]
    .forEach(id => ok(w.document.getElementById(id), "falta " + id));
});
t("o botao de emissao continua ligado a emitirPEA", () => {
  ig(ev("typeof emitirPEA"), "function");
  ok(w.document.getElementById("b-gerar").onclick, "onclick perdido");
});
t("os separadores continuam a comutar paineis", () => {
  w.document.querySelector('nav button[data-p="p-pea"]')
    .dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok(w.document.getElementById("p-pea").classList.contains("on"), "painel nao abriu");
});
t("exportacao e importacao de r0022 continuam de pe", () => {
  ig(ev("typeof exportarOcorrencia"), "function");
  ig(ev("typeof importarOcorrencia"), "function");
  ig(ev("pacoteOcorrencia().versao"), 2, "o pacote exportado devia declarar a versao 2:");
});
t("controloMissoes conta missoes e prioridades do conjunto", () => {
  const r = ev('(function(){ var d=detCompleto([],null);' +
    'var c=controloMissoes(Object.assign({},d.pea,d.ordens));' +
    'return {m:c.filter(x=>x.k[0]==="M").length, p:c.filter(x=>x.tipo==="Proposta").length,' +
    'nm:d.ordens.missoes.length, np:d.pea.propostas.length}; })()');
  ig(r.m, r.nm, "missoes:"); ig(r.p, r.np, "prioridades:");
});
t("o rodape anuncia r0023", () => { ok(/r0023/.test(w.document.body.innerHTML)); });

console.log("\n— renderizacao —");
ev('(function(){ O = novoEstado();' +
   'O.meta.num="2026080123"; O.meta.local="Alijó"; O.meta.pco="Vila Real"; O.meta.fase="III";' +
   'O.dados.area="120"; O.dados.sensiveis="Aldeia de Vilarinho a 800 m";' +
   'O.dados.setores="Setor A — Em curso; 6 meios / 24 op.\\nSetor B — Em resolução; 3 meios / 12 op.";' +
   'var dd = detCompleto([],null);' +
   'O.peas.push({n:1, g:gdhAgora(), ts:Date.now(), validoTs:Date.now()+6*3.6e6, modo:"Determinística",' +
   'json:{pea:dd.pea, ordens:dd.ordens}, met:metricas(), serie:[],' +
   'ctrl:controloMissoes(Object.assign({},dd.pea,dd.ordens)), ultVerd:"vigor", base:null,' +
   'dados:JSON.parse(JSON.stringify(O.dados)), evoIdx:0, meta:Object.assign({},O.meta), don:[],' +
   'pco:{funcoes:[],canais:{}}}); verPEA(1); return 1; })()');
const h = w.document.getElementById("pea-view").innerHTML;
t("o PEA renderiza completo (" + h.length + " car.)", () => { ok(h.length > 2000); });
t("mostra POSIT, objetivo, prioridades, ordens, seguranca e validade", () => {
  [/POSIT/, /Objetivo/, /Fundamento/, /decisiva/i, /LACES/, /Validade/]
    .forEach(r => ok(r.test(h), "em falta: " + r));
});
t("nao deixou undefined no documento", () => { ok(!/undefined/.test(h)); });
t("sem emojis nem icones", () => {
  ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(h), "caracter pictografico");
});
t("um PEA gravado no formato antigo renderiza identico", () => {
  ev('(function(){ var c=pecas(O.peas[0]);' +
     'O.peas[0].json={plan:{situacao:c.pea.situacao,analise_zi:c.pea.analise_zi,previsao:c.pea.previsao},' +
     'ops:{objetivo:c.pea.objetivo,propostas:c.pea.propostas,seguranca:c.pea.seguranca,' +
     'validade:c.pea.validade,missoes:c.ordens.missoes}}; verPEA(1); return 1; })()');
  ig(w.document.getElementById("pea-view").innerHTML, h, "renderizacao divergente:");
});

(async () => {
  try { await w2.eval("llm('teste')");
    console.log("  FALHA llm() em modo manual devia rejeitar"); falhou++; }
  catch (e) { ok(/manual/.test(String(e)), "motivo nao declarado");
    console.log("  ok   llm() em modo manual rejeita sem tocar na rede"); passou++; }
  console.log("\n" + passou + " passaram, " + falhou + " falharam");
  process.exit(falhou ? 1 : 0);
})();
