const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const html = fs.readFileSync("r0016.html", "utf-8");

let passou = 0, falhou = 0;
function t(nome, fn) {
  try { fn(); console.log("  ok   " + nome); passou++; }
  catch (e) { console.log("  FALHA " + nome + " -> " + e.message); falhou++; }
}
function ig(a, b, m) { const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error((m || "") + " esperava " + B + ", obtive " + A); }
function ok(c, m) { if (!c) throw new Error(m || "condicao falsa"); }

function arrancar(url) {
  const vc = new VirtualConsole();
  const d = new JSDOM(html, { runScripts: "dangerously", url, virtualConsole: vc });
  const w = d.window;
  // const/let de topo vivem no ambito do script, nao em window: avaliar la dentro
  const ev = code => w.eval("(function(){ return (" + code + "); })()");
  return { w, ev };
}

const { w, ev } = arrancar("https://exemplo.test/pea");

console.log("\n— P1  nucleos das celulas —");
t("FUNCOES_PCO inclui os quatro nucleos em falta em r0015", () => {
  const nomes = ev("FUNCOES_PCO.map(x=>x.f)");
  ["Núcleo de Especialistas", "Núcleo de Segurança", "Núcleo de Emergência Médica",
   "Núcleo de Apoio Psicológico e Social de Emergência"].forEach(n =>
    ok(nomes.includes(n), "falta " + n));
});
t("especialistas pertence a Planeamento (art. 30.º)", () => {
  ig(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Especialistas").g'), "Planeamento");
  ok(/art\. 30\.º/.test(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Especialistas").r')));
});
t("seguranca, medica e psicossocial pertencem a Operacoes", () => {
  ["Núcleo de Segurança", "Núcleo de Emergência Médica",
   "Núcleo de Apoio Psicológico e Social de Emergência"].forEach(n =>
    ig(ev('FUNCOES_PCO.find(y=>y.f==="' + n + '").g'), "Operações", n));
});
t("os tres nucleos de nomeacao externa declaram a entidade nomeadora", () => {
  ig(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Segurança").ext'),
     "força de segurança territorialmente competente");
  ig(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Emergência Médica").ext'), "INEM, I.P.");
  ig(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Apoio Psicológico e Social de Emergência").ext'),
     "Instituto da Segurança Social, I.P.");
});
t("informacoes e o art. 28.º e antecipacao o art. 29.º", () => {
  ok(/art\. 28\.º/.test(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Informações").r')), "informacoes");
  ok(/art\. 29\.º/.test(ev('FUNCOES_PCO.find(y=>y.f==="Núcleo de Antecipação").r')), "antecipacao");
});
t("monitorizacao e controlo e exigivel na fase IV, nao antes (art. 18.º, n.º 1)", () => {
  ev('(O.meta.fase="IV")');
  ok(ev('funcoesExigiveis().map(x=>x.f)').includes("Núcleo de Monitorização e Controlo"),
     "nao exigivel na fase IV");
  ev('(O.meta.fase="II")');
  ok(!ev('funcoesExigiveis().map(x=>x.f)').includes("Núcleo de Monitorização e Controlo"),
     "exigivel ja na fase II");
  ev('(O.meta.fase="")');
});

console.log("\n— P2  autoria do PEA —");
t("gerarPEA e gerarOrdens existem; gerarPlan e gerarOps ja nao", () => {
  ig(ev("typeof gerarPEA"), "function"); ig(ev("typeof gerarOrdens"), "function");
  ig(ev("typeof gerarPlan"), "undefined"); ig(ev("typeof gerarOps"), "undefined");
});
t("gerarOrdens recebe o plano aprovado como quarto argumento", () => {
  ig(ev("gerarOrdens.length"), 4, "aridade:");
});
t("detCompleto reparte pela fronteira legal", () => {
  const d = ev("detCompleto([],null)");
  ok(d.pea && d.ordens, "faltam as duas partes");
  ["situacao", "analise_zi", "previsao", "objetivo", "propostas", "seguranca", "validade"]
    .forEach(k => ok(k in d.pea, "o plano devia conter " + k));
  ig(Object.keys(d.ordens), ["missoes"], "ordens so tem missoes:");
  ok(!("missoes" in d.pea), "missoes vazaram para o plano");
  ok(!("objetivo" in d.ordens), "o objetivo vazou para as ordens");
});
t("o plano deterministico traz objetivo, prioridades e seguranca", () => {
  const p = ev("detCompleto([],null).pea");
  ok(typeof p.objetivo === "string" && p.objetivo.length > 10, "objetivo vazio");
  ok(Array.isArray(p.propostas) && p.propostas.length >= 3, "poucas prioridades");
  ok(Array.isArray(p.seguranca) && p.seguranca.length >= 3, "poucas medidas de seguranca");
});
t("as ordens de missao saem executaveis e atribuidas", () => {
  const m = ev("detCompleto([],null).ordens.missoes");
  ok(m.length >= 2, "poucas missoes");
  ok(m.some(x => /decisiva/i.test(x.tipo)), "sem acao decisiva");
  m.forEach(x => ok(x.atribuida && x.atribuida.length, "missao sem atribuicao: " + x.texto));
});

console.log("\n— P3  esquema versionado e migracao —");
t("um estado novo nasce no esquema 2", () => { ig(ev("novoEstado().esquema"), 2); });
t("pecas() le o esquema 1 com {plan,ops}", () => {
  const c = ev('pecas({json:{plan:{situacao:"S",analise_zi:"A",previsao:"P"},' +
    'ops:{objetivo:"O",propostas:[{id:"P1",texto:"x"}],missoes:[{tipo:"Ação decisiva",texto:"m"}],' +
    'seguranca:["s"],validade:"V"}}})');
  ig(c.pea.situacao, "S"); ig(c.pea.objetivo, "O"); ig(c.pea.validade, "V");
  ig(c.ordens.missoes.length, 1);
  ok(!("missoes" in c.pea), "missoes vazaram para o plano");
});
t("pecas() le o esquema 1 antigo, plano a raiz do json", () => {
  const c = ev('pecas({json:{situacao:"S",analise:"A",previsao:"P",objetivo:"O",' +
    'missoes:[{texto:"m"}],propostas:[],seguranca:[],validade:"V"}})');
  ig(c.pea.situacao, "S"); ig(c.pea.analise_zi, "A"); ig(c.ordens.missoes.length, 1);
});
t("pecas() le o esquema 2 sem o alterar", () => {
  const c = ev('pecas({json:{pea:{situacao:"S",objetivo:"O"},ordens:{missoes:[{texto:"m"}]}}})');
  ig(c.pea.objetivo, "O"); ig(c.ordens.missoes.length, 1);
});
t("pecas() sobrevive a um PEA sem json", () => {
  const c = ev("pecas({})"); ig(c.ordens.missoes, []); ig(c.pea.propostas, []);
});
t("migrarEsquema converte PEA gravados no esquema 1", () => {
  const r = ev('(function(){' +
    'O = novoEstado(); O.esquema = 1;' +
    'O.peas = [{n:1, json:{plan:{situacao:"S",analise_zi:"A",previsao:"P"},' +
    'ops:{objetivo:"O",missoes:[{texto:"m"}],propostas:[],seguranca:[],validade:"V"}}}];' +
    'var n = migrarEsquema();' +
    'return {n:n, esq:O.esquema, tem:!!O.peas[0].json.pea, obj:O.peas[0].json.pea.objetivo,' +
    'miss:O.peas[0].json.ordens.missoes.length, velho:!!O.peas[0].json.plan}; })()');
  ig(r.n, 1, "PEA convertidos:"); ig(r.esq, 2, "esquema:");
  ok(r.tem, "nao gravou em {pea,ordens}"); ig(r.obj, "O");
  ig(r.miss, 1); ok(!r.velho, "restou o formato antigo");
});
t("migrarEsquema e idempotente", () => {
  ig(ev("migrarEsquema()"), 0, "segunda passagem converteu de novo:");
  ig(ev("O.esquema"), 2);
});
t("a migracao fica registada na fita do tempo", () => {
  ok(ev("O.fita.some(x=>/esquema 1 para 2/.test(x.e))"), "sem registo na fita");
});

console.log("\n— P4  adaptador de modelo —");
t("origem http e reconhecida como rele local", () => {
  ig(ev("LLM.modo"), "rele");
  ig(ev("LLM.url"), "https://exemplo.test/pea/llm");
});
t("o modo e declarado ao operador, nao silencioso", () => {
  const e = w.document.getElementById("llm-modo");
  ok(e, "falta o elemento indicador");
  ok(e.textContent.indexOf("Modo de redacção") === 0, "indicador vazio: " + e.textContent);
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

console.log("\n— regressoes —");
t("os oito paineis continuam presentes", () => {
  ["p-occ","p-fontes","p-pco","p-evo","p-meteo","p-pea","p-avisos","p-fita"]
    .forEach(id => ok(w.document.getElementById(id), "falta " + id));
});
t("o botao de emissao continua ligado a emitirPEA", () => {
  ig(ev("typeof emitirPEA"), "function");
  ok(w.document.getElementById("b-gerar").onclick, "onclick perdido");
});
t("os separadores continuam a comutar paineis", () => {
  const nav = w.document.querySelector('nav button[data-p="p-pea"]');
  nav.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok(w.document.getElementById("p-pea").classList.contains("on"), "painel nao abriu");
});
t("controloMissoes conta missoes e prioridades do conjunto", () => {
  const r = ev('(function(){ var d=detCompleto([],null);' +
    'var c=controloMissoes(Object.assign({},d.pea,d.ordens));' +
    'return {m:c.filter(x=>x.k[0]==="M").length, p:c.filter(x=>x.tipo==="Proposta").length,' +
    'nm:d.ordens.missoes.length, np:d.pea.propostas.length}; })()');
  ig(r.m, r.nm, "missoes no controlo:"); ig(r.p, r.np, "prioridades no controlo:");
});
t("o rodape anuncia r0016", () => {
  ok(/r0016/.test(w.document.body.innerHTML), "revisao nao actualizada");
});

(async () => {
  try {
    await w2.eval("llm('teste')");
    console.log("  FALHA llm() em modo manual devia rejeitar"); falhou++;
  } catch (e) {
    ok(/manual/.test(String(e)), "motivo nao declarado");
    console.log("  ok   llm() em modo manual rejeita sem tocar na rede"); passou++;
  }
  console.log("\n" + passou + " passaram, " + falhou + " falharam");
  process.exit(falhou ? 1 : 0);
})();
