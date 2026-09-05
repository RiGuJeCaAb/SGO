/**
 * #004 · t0018c — A folha em Web Mercator, na reimplementação afim.
 *
 * Substitui o t0018b, que foi escrito contra o desenho anterior e **não se aplica**: a
 * r0086 guarda a folha como afim de seis coeficientes numa grelha declarada, e
 * `compativel()` recusa-a nas outras. A concordância entre grelhas que o t0018b afere é
 * uma propriedade que este desenho deliberadamente não tem, e testá-la seria reprovar uma
 * decisão em vez de um defeito.
 *
 * O que continua por cobrir, e é o que este guião faz:
 *
 *   1. a composição inteira — folha, terreno, grelha — com `grelha:"mercator"`, num pixel
 *      que **não** é canto de referência;
 *   2. a matriz do SVG, verificada contra a projeção feita ponto a ponto;
 *   3. a invariância na ampliação, nas duas grelhas;
 *   4. o `mpp` em Web Mercator, que é onde estão as duas asserções que reprovam.
 *
 * Corre: node '#004_..._t0018c_FolhaMercatorAfim_CLD.js' r0086.html
 */
const fs = require("fs");

const ficheiro = process.argv[2] || "r0086.html";
const src = fs.readFileSync(ficheiro, "utf-8");
const js = (src.match(/<script>[\s\S]*?<\/script>/g) || [])
  .map(b => b.slice(8, -9)).sort((a, b) => b.length - a.length)[0];

let passou = 0, falhou = 0;
function t(nome, cond, det){
  if(cond){ passou++; console.log("  ok   " + nome); }
  else { falhou++; console.log("  FALHA " + nome + (det ? "  → " + det : "")); }
}
function perto(a, b, tol, nome){ t(nome, Math.abs(a - b) <= tol, a + " vs " + b + " (tol " + tol + ")"); }

function bloco(marca){
  const i = js.indexOf(marca);
  if(i < 0) throw new Error("não encontrei: " + marca);
  let d = 0;
  for(let k = js.indexOf("{", i); k < js.length; k++){
    if(js[k] === "{") d++;
    else if(js[k] === "}"){ d--; if(!d) return js.slice(i, k + 1); }
  }
  throw new Error("sem fecho: " + marca);
}
const linha = re => { const m = js.match(re); if(!m) throw new Error("não encontrei: " + re); return m[0]; };

const A = eval(`
${linha(/const MOSAICO_PX\s*=\s*\d+/)};
${linha(/const MERCATOR_MEIO\s*=\s*[\d.]+/)};
${linha(/const WMTS_PIXEL_OGC\s*=\s*[\d.]+/)};
${linha(/const TM06_A = [\d.]+/)};
${linha(/const TM06_F = [^;\n]+/)};
${linha(/const TM06_LAT0 = [^;\n]+/)};
${linha(/const TM06_LON0 = [^;\n]+/)};
${linha(/const TM06_E2 = [^;\n]+/)};
${linha(/const TM06_EP2 = [^;\n]+/)};
${bloco("function tm06Arco(")};
${linha(/const TM06_M0 = [^;\n]+/)};
${bloco("function paraTM06(lat, lon){")};
${bloco("function deTM06(E, Nn){")};
${bloco("function distanciaM(lat1, lon1, lat2, lon2){")};
${bloco("const GRELHAS = {")};
${linha(/const ENVELOPE_PTTM06 = \{[^}]*\}/)};
${linha(/const AFERICAO_DESVIO_MAX = [^;\n]+/)};
${bloco("function folhaCalibrada(desc){")};
${js.indexOf("function gDeGrelha") > 0 ? bloco("function gDeGrelha") : "function gDeGrelha(G,E,N){ const q=G.metros(E,N,15); return G.de(q.x,q.y,15); }"};
${bloco("function folhaAfericao(f){")};
({GRELHAS, paraTM06, deTM06, distanciaM, folhaCalibrada, folhaAfericao, AFERICAO_DESVIO_MAX})
`);

/* Uma folha do Douro, a 10 m/px reais, na mesma zona de sempre. Constrói-se em cada
   grelha a partir do MESMO canto no terreno, para as duas descreverem a mesma imagem. */
function folhaEm(grelha, mppProj, larg, alt){
  const G = A.GRELHAS[grelha];
  const cantoLat = 41.2600, cantoLon = -7.5600;
  let C, F;
  if(grelha === "pttm06"){ const c = A.paraTM06(cantoLat, cantoLon); C = c.E; F = c.N; }
  else {
    /* Metros de EPSG:3857 a partir do pixel da grelha, invertendo `metros`. */
    const p = G.para(cantoLat, cantoLon, 14);
    const r = 2*eval("MERCATOR_MEIO_V") / (256 * Math.pow(2, 14));
    C = p.x*r - eval("MERCATOR_MEIO_V"); F = eval("MERCATOR_MEIO_V") - p.y*r;
  }
  return A.folhaCalibrada({ id:"ensaio-"+grelha, nome:"ensaio", largura:larg, altura:alt,
    grelha, proveniencia:"guião #004", pontos:0,
    mundo:{ A:mppProj, D:0, B:0, E:-mppProj, C, F } });
}
const MERCATOR_MEIO_V = eval(linha(/const MERCATOR_MEIO\s*=\s*[\d.]+/).split("=")[1]);

console.log("— a composição inteira em Web Mercator, num pixel que não é o canto —");
{
  /* 10 m/px no terreno a 41,26 N são 10/cos(lat) metros de projeção em EPSG:3857. */
  const mppTerreno = 10, mppProj = mppTerreno / Math.cos(41.26*Math.PI/180);
  const f = folhaEm("mercator", mppProj, 1200, 800);
  t("a folha em Mercator constrói-se", !!f);

  const G = A.GRELHAS.mercator, z = 15;
  /* Onde o pixel (900, 600) da imagem aterra, pela via da aplicação. */
  const m = f.paraMundo(900, 600);
  const q = G.metros(m.E, m.N, z);
  const c = G.de(q.x, q.y, z);
  t("o pixel (900,600) resolve para terreno", isFinite(c.lat) && isFinite(c.lon));

  /* E onde devia aterrar, pela via independente: 900 e 600 pixéis de imagem a partir do
     canto valem 9000 e 6000 metros de terreno, a leste e a sul. */
  const canto = G.de(G.metros(f.mundo.C, f.mundo.F, z).x, G.metros(f.mundo.C, f.mundo.F, z).y, z);
  const dE = A.distanciaM(c.lat, canto.lon, c.lat, c.lon);
  const dN = A.distanciaM(canto.lat, c.lon, c.lat, c.lon);
  perto(dE, 9000, 30, "900 px a leste do canto valem 9 000 m no terreno");
  perto(dN, 6000, 30, "600 px a sul do canto valem 6 000 m no terreno");
}

console.log("\n— a matriz do SVG bate com a projeção ponto a ponto —");
{
  /* Reproduz-se a conta do `camadaMapa` e confronta-se com `metros` feito diretamente.
     Se a amostragem do `ppm` num só ponto estiver errada, os cantos afastados divergem. */
  ["mercator", "pttm06"].forEach(g => {
    const mppProj = g === "mercator" ? 10/Math.cos(41.26*Math.PI/180) : 10;
    const f = folhaEm(g, mppProj, 1200, 800), G = A.GRELHAS[g], z = 15;
    const m = f.mundo, canto = G.metros(m.C, m.F, z);
    const ppm = G.metros(m.C + 1, m.F, z).x - canto.x;
    const M6 = [m.A*ppm, -m.D*ppm, m.B*ppm, -m.E*ppm, canto.x, canto.y];
    let pior = 0;
    [[0,0],[1199,0],[0,799],[1199,799],[900,600]].forEach(([px,py])=>{
      const sx = M6[0]*px + M6[2]*py + M6[4], sy = M6[1]*px + M6[3]*py + M6[5];
      const d = f.paraMundo(px, py), r = G.metros(d.E, d.N, z);
      pior = Math.max(pior, Math.hypot(sx-r.x, sy-r.y));
    });
    /* 1e-4 px, e não 1e-6, porque o `ppm` sai de uma DIFERENÇA de dois números grandes:
       em PT-TM06 a z15 o canto está a 2,7 milhões de pixéis da origem da grelha e a
       diferença de um metro vale 13,6 — cancelamento catastrófico que deixa ~1e-9 de erro
       relativo, amplificado pela largura da folha até 3,5e-6 px. É real, é medido, e é
       inofensivo: um erro de 3,5 milionésimos de pixel não desloca imagem nenhuma.
       Fica registado porque a via exata existe e é mais curta — `1/res(z)` em PT-TM06 e a
       constante analítica em Mercator dão o mesmo `ppm` sem subtrair nada. */
    t("[" + g + "] a matriz coloca os cinco pontos a menos de 1e-4 px do cálculo direto",
      pior < 1e-4, pior.toExponential(2) + " px");
    console.log("    (erro por cancelamento no ppm: " + pior.toExponential(2) + " px)");
  });
}

console.log("\n— invariância na ampliação —");
{
  ["mercator", "pttm06"].forEach(g => {
    const mppProj = g === "mercator" ? 10/Math.cos(41.26*Math.PI/180) : 10;
    const f = folhaEm(g, mppProj, 1200, 800), G = A.GRELHAS[g];
    const onde = z => { const m = f.paraMundo(900, 600), q = G.metros(m.E, m.N, z); return G.de(q.x, q.y, z); };
    const a = onde(10), b = onde(15), c = onde(19);
    perto(A.distanciaM(a.lat, a.lon, b.lat, b.lon), 0, 0.5, "[" + g + "] z10 e z15 dão o mesmo terreno");
    perto(A.distanciaM(b.lat, b.lon, c.lat, c.lon), 0, 0.5, "[" + g + "] z15 e z19 dão o mesmo terreno");
  });
}

console.log("\n— o mpp em Web Mercator: corrigido na r0093, defendido contra regressão —");
{
  /* Uma folha de 10 m/px NO TERRENO, produzida em EPSG:3857 a 41,26 N. O world file traz
     13,29 metros de projeção por pixel, porque é isso que ela mede na projeção. */
  const mppTerreno = 10, mppProj = mppTerreno / Math.cos(41.26*Math.PI/180);
  const f = folhaEm("mercator", mppProj, 1200, 800);
  const af = A.folhaAfericao(f);
  t("a aferição devolve resultado", !!af);
  console.log("    world file: " + mppProj.toFixed(3) + " m de projeção/px"
    + " · terreno real: " + mppTerreno.toFixed(3) + " m/px"
    + " · a aplicação mostra: " + af.mpp.toFixed(3) + " m/px");

  /* Confronto independente: mede-se no elipsóide o que a folha cobre de facto. */
  const G = A.GRELHAS.mercator, z = 15;
  const p0 = (px,py)=>{ const m = f.paraMundo(px,py), q = G.metros(m.E,m.N,z); return G.de(q.x,q.y,z); };
  const a = p0(0,400), b = p0(1199,400);
  const real = A.distanciaM(a.lat, a.lon, b.lat, b.lon)/1199;

  perto(real, mppTerreno, 0.05, "no elipsóide a folha cobre mesmo 10 m por pixel");

  /* CORRIGIDO NA r0093. Antes mostrava-se o metro da PROJEÇÃO — 13,30 onde o terreno vale
     10,00, inflado 33 % a 41 N. A r0093 divide por 1/cos(φ) na latitude de referência e
     guarda `mppProj` e `escalaProj` à parte. Estas duas asserções passam a defender a
     correção contra regressão, e o nome delas diz agora o que verificam. */
  const desvio = Math.abs(af.mpp/real - 1);
  t("o m/px mostrado é o metro DO TERRENO, a menos de 1 % (" + (100*desvio).toFixed(2) + " %)",
    desvio < 0.01, "mostra " + af.mpp.toFixed(3) + " e o terreno vale " + real.toFixed(3));
  t("e o metro da projeção fica guardado à parte, não misturado",
    Math.abs(af.mppProj - mppProj) < 1e-6 && Math.abs(af.escalaProj - 1/Math.cos(41.26*Math.PI/180)) < 0.02,
    "mppProj=" + (af.mppProj||0).toFixed(3) + " escalaProj=" + (af.escalaProj||0).toFixed(4));
  t("e a latitude de referência da correção é declarada", af.latRef !== null && af.latRef !== undefined,
    "sem ela ninguém pode reconferir a conta");
}

console.log("\n— a folha que o mapa enquadra e não desenha —");
{
  /* Leitura estrutural, não execução: `enquadrarMapa` precisa de estado a mais para correr
     aqui. O que se afere é o que o código diz.

     `enquadrarMapa` inclui os quatro cantos de CADA folha, convertidos pela grelha DA
     FOLHA — o que está certo, dá a posição geográfica verdadeira seja qual for a grelha do
     mapa. `camadaMapa` desenha só as compatíveis, e sai por `return` sem dizer nada.

     Compostas, as duas dão o modo de falha que este projeto passou a semana a caçar: o
     mapa **aproxima-se de uma folha que nunca vai mostrar**, o operador vê terreno vazio
     onde acabou de colocar uma carta, e nada no ecrã explica porquê. */
  const enq = js.slice(js.indexOf("function enquadrarMapa"));
  const enqCorpo = enq.slice(0, enq.indexOf("\n}"));
  t("enquadrarMapa inclui os cantos das folhas", /FOLHAS\.forEach/.test(enqCorpo));
  t("e NÃO verifica a compatibilidade de grelha ao fazê-lo", !/compativel/.test(enqCorpo),
    "enquadra por folhas que o mapa não desenha");
  const cam = js.slice(js.indexOf("function camadaMapa"));
  const camFolhas = cam.slice(0, cam.indexOf("if(P) P.aneis"));
  t("camadaMapa recusa a folha incompatível", /compativel\(grelhaAtual\(\)\.k\)/.test(camFolhas));
  t("e a recusa é silenciosa: não há mensagem nem pendência",
    !/pend|aviso|recusa|incompat/i.test(camFolhas),
    "o utilizador não fica a saber porque é que a folha não aparece");
  t("a lista de folhas também não assinala a incompatibilidade",
    !/compativel/.test(js.slice(js.indexOf("function pintarFolhas"), js.indexOf("function pintarFolhas") + 1800)),
    "nem no mapa nem na lista — em lado nenhum");
}

console.log("\n— o que continua bem, e é a maior parte —");
{
  const f = folhaEm("pttm06", 10, 1200, 800);
  const af = A.folhaAfericao(f);
  perto(af.mpp, 10, 1e-9, "[pttm06] o m/px do determinante é o metro do terreno");
  t("[pttm06] sem pontos de controlo não há confronto, e diz-se", af.esferico === null && af.desvio === null);
  t("uma folha sem grelha declarada é recusada", A.folhaCalibrada({id:"x", largura:10, altura:10,
    proveniencia:"p", mundo:{A:1,D:0,B:0,E:-1,C:0,F:0}}) === null);
  t("uma folha sem proveniência é recusada", A.folhaCalibrada({id:"x", largura:10, altura:10,
    grelha:"pttm06", mundo:{A:1,D:0,B:0,E:-1,C:0,F:0}}) === null);
  t("determinante nulo é recusado", A.folhaCalibrada({id:"x", largura:10, altura:10,
    grelha:"pttm06", proveniencia:"p", mundo:{A:1,D:0,B:1,E:0,C:0,F:0}}) === null);
  t("uma folha em Mercator não se desenha em PT-TM06", folhaEm("mercator", 13, 100, 100).compativel("pttm06") === false);
  t("e desenha-se em Mercator", folhaEm("mercator", 13, 100, 100).compativel("mercator") === true);
}

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
