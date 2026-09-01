/**
 * t0018 — Folha de carta calibrada.
 *
 * Não testa que o código existe: testa que a conta está certa. Extraem-se as funções de
 * projeção e de calibração do ficheiro, monta-se uma folha fictícia com coordenadas reais
 * do Douro, e verifica-se que um pixel conhecido cai onde tem de cair — nas duas grelhas.
 *
 * Corre: node CSREPCDouro_202608312030_t0018_FolhaCalibrada_CLD.js r0072.html
 */
const fs = require("fs");
const { JSDOM } = require("jsdom");

const ficheiro = process.argv[2] || "r0072.html";
const src = fs.readFileSync(ficheiro, "utf-8");
const js = (src.match(/<script>[\s\S]*?<\/script>/g) || [])
  .map(b => b.slice(8, -9)).sort((a, b) => b.length - a.length)[0];

let passou = 0, falhou = 0;
function t(nome, cond, detalhe){
  if(cond){ passou++; console.log("  ok   " + nome); }
  else { falhou++; console.log("  FALHA " + nome + (detalhe ? "  → " + detalhe : "")); }
}
function perto(a, b, tol, nome){ t(nome, Math.abs(a - b) <= tol, a + " vs " + b + " (tol " + tol + ")"); }

/* ---- extrair blocos equilibrados ------------------------------------------------- */
function bloco(marca){
  const i = js.indexOf(marca);
  if(i < 0) throw new Error("não encontrei: " + marca);
  let d = 0, k = js.indexOf(marca[marca.length - 1] === "{" ? "{" : "{", i);
  for(; k < js.length; k++){
    if(js[k] === "{") d++;
    else if(js[k] === "}"){ d--; if(!d) return js.slice(i, k + 1); }
  }
  throw new Error("sem fecho: " + marca);
}
function linha(re){
  const m = js.match(re);
  if(!m) throw new Error("não encontrei: " + re);
  return m[0];
}

const pedacos = [
  linha(/const MOSAICO_PX\s*=\s*\d+/),
  linha(/const WMTS_PIXEL_OGC\s*=\s*[\d.]+/),
  bloco("const GRELHAS = {"),
  linha(/const TM06_A = [\d.]+/),
  linha(/const TM06_F = [^;\n]+/),
  linha(/const TM06_LAT0 = [^;\n]+/),
  linha(/const TM06_LON0 = [^;\n]+/),
  linha(/const TM06_E2 = [^;\n]+/),
  linha(/const TM06_EP2 = [^;\n]+/),
  bloco("function tm06Arco("),
  linha(/const TM06_M0 = [^;\n]+/),
  bloco("function paraTM06(lat, lon){"),
  bloco("function deTM06(E, Nn){"),
  bloco("function distanciaM(lat1, lon1, lat2, lon2){"),
  bloco("function folhaCalibrada(f){"),
  bloco("function folhaSemelhanca(f, z){"),
  bloco("function folhaAfericao(f){"),
  bloco("function lerWorldFile(txt){"),
  bloco("function pontosDoWorldFile(w, larg, alt, sistema){")
];

/* A grelha entra por variável, para poder trocar-se nos testes. */
const sandbox = `
${pedacos.join(";\n")}
let _G = GRELHAS.mercator;
function grelhaAtual(){ return _G; }
function gPara(lat, lon, z){ return _G.para(lat, lon, z); }
function gDe(x, y, z){ return _G.de(x, y, z); }
function gEscala(lat, z){ return _G.escala(lat, z); }
({ GRELHAS, paraTM06, deTM06, distanciaM, folhaCalibrada, folhaSemelhanca, folhaAfericao,
   lerWorldFile, pontosDoWorldFile, gPara, gDe, gEscala,
   usar: k => { _G = GRELHAS[k]; } })
`;
const A = eval(sandbox);

/* ---- 0. a ida e volta da projeção portuguesa ------------------------------------- */
{
  const lat = 41.2033, lon = -7.4533;            /* algures no vale do Douro */
  const c = A.paraTM06(lat, lon), v = A.deTM06(c.E, c.N);
  perto(v.lat, lat, 1e-6, "PT-TM06 ida e volta mantém a latitude");
  perto(v.lon, lon, 1e-6, "PT-TM06 ida e volta mantém a longitude");
}

/* ---- 1. rejeição de calibrações impossíveis -------------------------------------- */
t("recusa folha sem pontos", !A.folhaCalibrada({ pts: [] }));
t("recusa folha com um ponto só", !A.folhaCalibrada({ pts: [{ u:0, v:0, lat:41, lon:-7 }] }));
t("recusa pontos no mesmo pixel",
  !A.folhaCalibrada({ pts: [{ u:10, v:10, lat:41, lon:-7 }, { u:11, v:10, lat:41.1, lon:-7.1 }] }),
  "dois pontos juntos dividem por quase zero e dão escala absurda");
t("aceita dois pontos afastados",
  A.folhaCalibrada({ pts: [{ u:0, v:0, lat:41.25, lon:-7.55 }, { u:1600, v:1000, lat:41.15, lon:-7.40 }] }));

/* ---- 2. a semelhança recoloca os próprios pontos de controlo --------------------- */
const folha = {
  larg: 1600, alt: 1000,
  pts: [{ u:100, v:80, lat:41.2400, lon:-7.5200 },
        { u:1480, v:920, lat:41.1600, lon:-7.4100 }]
};
["mercator", "pttm06"].forEach(g => {
  A.usar(g);
  const z = 15, S = A.folhaSemelhanca(folha, z);
  t("[" + g + "] a semelhança calcula-se", !!S);
  folha.pts.forEach((p, i) => {
    const x = S.a * p.u - S.b * p.v + S.tx;
    const y = S.b * p.u + S.a * p.v + S.ty;
    const alvo = A.gPara(p.lat, p.lon, z);
    perto(x, alvo.x, 1e-6, "[" + g + "] ponto " + (i + 1) + " assenta no pixel certo em x");
    perto(y, alvo.y, 1e-6, "[" + g + "] ponto " + (i + 1) + " assenta no pixel certo em y");
  });
});

/* ---- 3. um pixel a meio caminho cai a meio caminho ------------------------------- */
{
  A.usar("pttm06");
  const z = 15, S = A.folhaSemelhanca(folha, z);
  const mu = (folha.pts[0].u + folha.pts[1].u) / 2, mv = (folha.pts[0].v + folha.pts[1].v) / 2;
  const x = S.a * mu - S.b * mv + S.tx, y = S.b * mu + S.a * mv + S.ty;
  const c = A.gDe(x, y, z);
  const d0 = A.distanciaM(c.lat, c.lon, folha.pts[0].lat, folha.pts[0].lon);
  const d1 = A.distanciaM(c.lat, c.lon, folha.pts[1].lat, folha.pts[1].lon);
  perto(d0, d1, 3, "o pixel central fica equidistante dos dois pontos de controlo");
}

/* ---- 4. a aferição diz uma escala plausível -------------------------------------- */
{
  A.usar("pttm06");
  const a = A.folhaAfericao(folha);
  t("a aferição devolve resultado", !!a);
  t("escala de extrato de carta (0,05 a 60 m/px)", a.mpp > 0.05 && a.mpp < 60, a.mpp + " m/px");
  t("a largura no terreno é da ordem dos quilómetros", a.largM > 5000 && a.largM < 40000, a.largM + " m");
  t("a separação dos pontos é a distância real",
    Math.abs(a.sepM - A.distanciaM(folha.pts[0].lat, folha.pts[0].lon, folha.pts[1].lat, folha.pts[1].lon)) < 1);
}

/* ---- 5. pontos trocados dão rotação grande, que é o sinal de alarme -------------- */
{
  A.usar("pttm06");
  const trocada = { larg:1600, alt:1000, pts:[
    { u:folha.pts[0].u, v:folha.pts[0].v, lat:folha.pts[1].lat, lon:folha.pts[1].lon },
    { u:folha.pts[1].u, v:folha.pts[1].v, lat:folha.pts[0].lat, lon:folha.pts[0].lon }] };
  const a = A.folhaAfericao(trocada);
  t("pontos trocados saem com rotação enorme", Math.abs(a.rot) > 90,
    a.rot.toFixed(1) + "° — é este número que o painel avisa");
}

/* ---- 6. world file ---------------------------------------------------------------- */
{
  t("recusa world file incompleto", A.lerWorldFile("2.5\n0\n0\n-2.5\n") === null);
  const w = A.lerWorldFile("2.5\n0.0\n0.0\n-2.5\n25000.0\n205000.0\n");
  t("lê os seis números", !!w);
  perto(w.A, 2.5, 1e-9, "escala em x");
  perto(w.E, -2.5, 1e-9, "escala em y é negativa");
  perto(w.C, 25000, 1e-9, "coordenada do centro do pixel superior esquerdo");
  t("aceita notação científica", !!A.lerWorldFile("2.5e0\n0\n0\n-2.5e0\n2.5e4\n2.05e5\n"));

  const pts = A.pontosDoWorldFile(w, 1600, 1000, "tm06");
  t("o world file dá dois pontos", !!pts && pts.length === 2);
  t("o primeiro ponto é o canto superior esquerdo", pts[0].u === 0 && pts[0].v === 0);
  t("o segundo é o canto oposto", pts[1].u === 1599 && pts[1].v === 999);
  t("o ponto 2 fica a sul do ponto 1", pts[1].lat < pts[0].lat,
    "escala em y negativa: a linha cresce para sul");
  t("o ponto 2 fica a leste do ponto 1", pts[1].lon > pts[0].lon);

  A.usar("pttm06");
  const fw = { larg:1600, alt:1000, pts };
  const a = A.folhaAfericao(fw);
  perto(a.mpp, 2.5, 0.02, "a escala lida do world file bate com os 2,5 m/px declarados");
  t("rotação praticamente nula num world file sem rotação", Math.abs(a.rot) < 0.5, a.rot + "°");
}

/* ---- 7. a interface existe e está ligada ---------------------------------------- */
{
  const doc = new JSDOM(src, { runScripts: "outside-only" }).window.document;
  ["fl-b", "fl-f", "fl-lista", "fl-cal", "fl-tela", "fl-sist", "fl-alvo", "fl-c1", "fl-c2", "fl-cal-ok"]
    .forEach(id => t("existe #" + id, !!doc.getElementById(id)));
  t("o campo aceita world files", /pgw/.test(doc.getElementById("fl-f").getAttribute("accept")));
  t("a base subiu de versão para a loja nova", /IDB_VERSAO = 3/.test(js));
  t("a loja das folhas é criada", /createObjectStore\("folhas"/.test(js));
  t("as folhas são desenhadas no mapa", /camadaFolhas\(\) \+ camadaMapa\(\)/.test(js));
  t("as folhas acompanham o arrasto", /if\(fls\) fls\.style\.transform/.test(js));
  t("uma folha sozinha abre o cartão do mapa", /FOLHAS\.forEach\(fo=>\{[\s\S]{0,200}juntar\(p\.lat, p\.lon\)/.test(js));
  t("as folhas são lidas ao arranque", /await carregarFolhas\(\)/.test(js));
  t("calibrar fica na fita do tempo", /fita\("Folha de carta calibrada/.test(js));
}

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
