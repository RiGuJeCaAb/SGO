/**
 * t0017 — Carta pré-descarregada: árvore, grelha declarada, diagnóstico.
 *
 * Exercita os caminhos que o p0017 mexeu, e um que ele não mexeu mas que era a causa
 * real da avaria: o campo tem de pedir uma pasta, senão o browser não devolve caminho
 * nenhum e o filtro rejeita tudo por construção.
 *
 * Corre: node CSREPCDouro_202608311900_t0017_CartaLocal_CLD.js r0071.html
 */
const fs = require("fs");
const { JSDOM } = require("jsdom");

const ficheiro = process.argv[2] || "r0071.html";
const src = fs.readFileSync(ficheiro, "utf-8");

let passou = 0, falhou = 0;
function t(nome, cond, detalhe){
  if(cond){ passou++; console.log("  ok   " + nome); }
  else { falhou++; console.log("  FALHA " + nome + (detalhe? "  → " + detalhe : "")); }
}

/* ---- 1. o campo pede uma pasta ---------------------------------------------------- */
const dom = new JSDOM(src, { runScripts: "outside-only" });
const campo = dom.window.document.getElementById("carta-fich");
t("o campo da carta existe", !!campo);
t("o campo pede uma pasta (webkitdirectory)",
  campo && campo.hasAttribute("webkitdirectory"),
  "sem este atributo webkitRelativePath vem vazio e nenhum ficheiro casa com {z}/{x}/{y}");
t("existe selector de projeção da árvore", !!dom.window.document.getElementById("carta-loc-grelha"));
t("existe campo de origem da carta", !!dom.window.document.getElementById("carta-loc-atrib"));

/* ---- 2. o filtro de caminhos ------------------------------------------------------ */
const js = (src.match(/<script>([\s\S]*?)<\/script>/g) || [])
  .map(b => b.replace(/^<script>/, "").replace(/<\/script>$/, ""))
  .sort((a, b) => b.length - a.length)[0];

function extrair(nome){
  const i = js.indexOf("function " + nome + "(");
  if(i < 0) throw new Error("função " + nome + " não encontrada");
  let d = 0, j = js.indexOf("{", i);
  for(let k = j; k < js.length; k++){
    if(js[k] === "{") d++;
    else if(js[k] === "}"){ d--; if(!d) return js.slice(i, k + 1); }
  }
  throw new Error("função " + nome + " sem fecho");
}

const mosaicoDoCaminho = eval("(" + extrair("mosaicoDoCaminho") + ")");

t("aceita a árvore com a pasta de topo à frente",
  JSON.stringify(mosaicoDoCaminho("tiles/12/2010/1520.png")) === '{"z":12,"x":2010,"y":1520}');
t("aceita a árvore com dois níveis de pasta à frente",
  JSON.stringify(mosaicoDoCaminho("Douro/ortos/12/2010/1520.jpg")) === '{"z":12,"x":2010,"y":1520}');
t("aceita .webp", !!mosaicoDoCaminho("t/9/250/190.webp"));
t("aceita maiúsculas na extensão", !!mosaicoDoCaminho("t/9/250/190.PNG"));
t("rejeita ficheiro solto, sem caminho", mosaicoDoCaminho("1520.png") === null,
  "é exatamente o que acontecia sem webkitdirectory");
t("rejeita nível fora de 0..22", mosaicoDoCaminho("t/40/1/1.png") === null);
t("rejeita ficheiro que veio à boleia", mosaicoDoCaminho("tiles/leiame.txt") === null);
t("rejeita árvore incompleta", mosaicoDoCaminho("tiles/12/1520.png") === null);

/* ---- 3. carregarMosaicosLocais devolve exemplo do que recusou --------------------- */
const fonteCarga = extrair("carregarMosaicosLocais");
t("a carga recolhe um exemplo do caminho recusado", /exemplo/.test(fonteCarga));
t("o exemplo sai no retorno", /return \{ n, ignorados:semArvore, semArquivo, exemplo,/.test(fonteCarga));

/* ---- 4. a grelha da carta local decide o desenho ---------------------------------- */
const fonteGrelha = extrair("grelhaAtual");
t("grelhaAtual consulta a carta local antes de assumir PT-TM06",
  fonteGrelha.indexOf("CARTA_LOCAL") > 0 &&
  fonteGrelha.indexOf("CARTA_LOCAL") < fonteGrelha.indexOf("return GRELHAS.pttm06"),
  "sem isto uma árvore do OSM é desenhada com aritmética portuguesa e fica fora do sítio");

t("existe declararCartaLocal", /function declararCartaLocal\(/.test(js));
t("existe esquecerCartaLocal", /function esquecerCartaLocal\(/.test(js));
t("a declaração é lida ao arranque", /await carregarCartaLocal\(\)/.test(js));
t("esquecer a carta esquece a declaração",
  /esquecerMosaicos\(\);[\s\S]{0,400}?esquecerCartaLocal\(\)/.test(js));

/* ---- 5. a declaração só se grava quando entraram quadrados ------------------------ */
const handler = js.slice(js.indexOf('$("carta-fich").addEventListener'));
const fim = handler.indexOf("\n});");
const h = handler.slice(0, fim);
t("a projeção só se declara se algum quadrado entrou",
  h.indexOf("if(r.n){") < h.indexOf("declararCartaLocal"),
  "declarar a grelha de uma carga que falhou descreveria uma carta que não existe");
t("a mensagem de falha mostra o que foi lido", /r\.exemplo/.test(h));
t("a fita regista o sistema de coordenadas", /fita\([\s\S]{0,200}GRELHAS\[g\]\.crs/.test(h));

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
