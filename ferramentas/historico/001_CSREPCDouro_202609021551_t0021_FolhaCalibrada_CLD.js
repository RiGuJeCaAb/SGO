/**
 * 001-t-0021 — Folha de carta calibrada.
 * CSREPC Douro · Estação PEA · ramo #001 (CLD)
 *
 * Correr:   node 001_CSREPCDouro_202609021551_t_FolhaCalibrada_CLD.js r0083.html
 * Depende:  jsdom
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE FICHEIRO É
 *
 * Um guião executável. Não é um patch, não traz âncoras de texto no HTML e não
 * diz onde escrever nada. Carrega o ficheiro único compilado e exercita-o de
 * fora, como o t0017 e o t0019.
 *
 * ESTADO ESPERADO CONTRA A r0083: 16 verdes, 37 vermelhos.
 *
 * Os 16 verdes são o grupo A — a projeção PT-TM06, que já existe na r0083 e é
 * a fundação sobre a qual a folha assenta. Se algum deles ficar vermelho, a
 * folha é o menor dos problemas.
 *
 * Os 37 vermelhos são a funcionalidade ausente. É o alvo.
 *
 * ---------------------------------------------------------------------------
 * NÃO ABRE A IndexedDB
 *
 * Nenhuma das 53 asserções abre a base. A armadilha do VersionError assíncrono
 * não se aplica aqui por construção e não por cuidado. A loja `folhas`, a
 * migração aditiva e a religação ao retratoDoFogo ficam por testar de
 * propósito: são código de fonte/ e foram declarados fora do âmbito deste `t`.
 *
 * ---------------------------------------------------------------------------
 * PROVENIÊNCIA DOS NÚMEROS
 *
 * Cada limiar traz a fonte na própria linha. As três origens são:
 *
 *   EPSG:3763   parâmetros e valores E/N calculados com PROJ 3.7.2 sobre a
 *               definição da base EPSG. Verificado contra a aritmética da
 *               r0083 em 02SET26: concordância de 31 µm no Norte, exacta às
 *               seis casas no Este.
 *   ESRI-WF     ordem e semântica dos seis coeficientes do world file.
 *   CONSTRUÍDO  casos em que o esperado é exacto por construção — a escala, a
 *               rotação e a translação estão declaradas na linha, e o ponto de
 *               ensaio sai da definição, não de uma medição.
 *
 * Nenhum valor foi escrito de memória. Um número sem proveniência é pior do
 * que nenhum número, e isso vale para os testes tanto como para a aplicação.
 * ---------------------------------------------------------------------------
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ALVO = process.argv[2] || "r0083.html";

/* =========================================================================
   CONTRATO — a única suposição estrutural deste ficheiro.

   Tudo o resto são asserções sobre comportamento. Se a implementação usar
   outros nomes ou outra forma, muda-se este bloco e mais nada: são seis
   linhas, e não cinquenta e três.

   Forma esperada:
     FOLHAS                    array de folhas no espaço global
     folhaCalibrada(f)         -> boolean
     folhaSemelhanca(pts)      -> { para(x,y) -> {lat,lon}, mpp }   pts = 2 controlos
     folhaAfericao(f)          -> { mpp } | null
     lerWorldFile(texto)       -> { A, D, B, E, C, F } | null

   Um controlo é { x, y, lat, lon }: o pixel na imagem e o ponto no terreno.
   ========================================================================= */
const CONTRATO = {
  FOLHAS:          ()  => ev("FOLHAS"),
  folhaCalibrada:  f   => chama("folhaCalibrada", f),
  folhaSemelhanca: pts => chama("folhaSemelhanca", pts),
  folhaAfericao:   f   => chama("folhaAfericao", f),
  lerWorldFile:    txt => chama("lerWorldFile", txt)
};

/* Os nomes resolvem-se por `eval` no âmbito do script, e não por propriedade de
   `window`. Um `const` no topo de um script clássico não cria propriedade em
   `window` — só `var` e as declarações de função o fazem. Aceder por `window.X`
   daria vermelho a código já implementado, se estivesse declarado com `const`
   ou como função de seta. O teste tem de ser indiferente ao estilo de
   declaração: julga comportamento, não forma. */
function ev(expr){ return w.eval("(function(){ return (" + expr + "); })()"); }
function chama(nome, ...args){
  return w.eval("(function(){ return " + nome + ".apply(null, " + JSON.stringify(args) + "); })()");
}
function existe(nome){ return ev("typeof " + nome) !== "undefined"; }

/* =========================================================================
   TOLERÂNCIAS — medidas, não estimadas.
   ========================================================================= */
const TOL_M      = 0.001;    /* 1 mm · a r0083 declara erro sub-milimétrico; medido 31 µm contra PROJ 3.7.2 */
const TOL_GRAUS  = 1e-7;     /* ~1,1 cm em latitude · folga de duas ordens sobre o desvio medido            */
const TOL_VOLTA  = 1e-8;     /* fecho da ida e volta · desvio medido na r0083: 6,0e-10 graus                */
const TOL_REL    = 0.0025;   /* 0,25 % · discrepância medida plano TM06 vs distanciaM esférico: 0,189 %     */

/* =========================================================================
   REFERÊNCIAS
   ========================================================================= */

/* EPSG:3763 · parâmetros da definição oficial, cada um com a fonte na linha. */
const EPSG3763 = {
  a:    6378137.0,                    /* EPSG:3763 · GRS80, semi-eixo maior em metros            */
  invF: 298.257222101,                /* EPSG:3763 · GRS80, inverso do achatamento               */
  lat0:   39 + 40/60 +  5.73/3600,    /* EPSG:3763 · latitude da origem, 39° 40' 05,73" N        */
  lon0: -(8  +  7/60 + 59.19/3600)    /* EPSG:3763 · meridiano central,  8° 07' 59,19" W         */
};

/* EPSG:3763 · E/N calculados com PROJ 3.7.2. Entrada e esperado à vista. */
const PONTOS = [
  { n:"origem da projeção",       lat: 39.668258333333, lon: -8.133108333333, E:      0.0000, N:      0.0000 },
  { n:"meridiano central a 41 N", lat: 41.000000000000, lon: -8.133108333333, E:      0.0000, N: 147878.0183 },
  { n:"Vila Real",                lat: 41.300600000000, lon: -7.744100000000, E:  32580.1720, N: 181334.6951 },
  { n:"Peso da Régua",            lat: 41.161400000000, lon: -7.788900000000, E:  28889.2955, N: 165859.4864 },
  { n:"Alijó",                    lat: 41.275800000000, lon: -7.474400000000, E:  55189.0477, N: 178716.7074 }
];

/* CONSTRUÍDO · casos de semelhança. Para cada um: escala s em m/px, rotação θ,
   translação t. Os dois controlos e o ponto de ensaio saem da definição —
   E = s(cosθ·x + senθ·y) + tx ; N = s(senθ·x − cosθ·y) + ty — cujo determinante
   é −s², cabendo aí a inversão do eixo Y da imagem face ao Norte do terreno. */
const SEMELHANCA = [
  { n:"norte em cima, 1 m/px",  s:1,  th:0,    tx:0,     ty:0,
    c1:{x:0,   y:0  , E:0.000000,      N:0.000000},      c2:{x:100,  y:100, E:100.000000,   N:-100.000000},
    px:{x:40,  y:60},  E:40.000000,      N:-60.000000 },
  { n:"escala pura, 25 m/px",   s:25, th:0,    tx:0,     ty:0,
    c1:{x:0,   y:0  , E:0.000000,      N:0.000000},      c2:{x:200,  y:0,   E:5000.000000,  N:0.000000},
    px:{x:0,   y:200}, E:0.000000,       N:-5000.000000 },
  { n:"translação, 1 m/px",     s:1,  th:0,    tx:1000,  ty:2000,
    c1:{x:10,  y:10 , E:1010.000000,   N:1990.000000},   c2:{x:110,  y:10,  E:1110.000000,  N:1990.000000},
    px:{x:10,  y:110}, E:1010.000000,    N:1890.000000 },
  { n:"rotação 90°, 2 m/px",    s:2,  th:90,   tx:0,     ty:0,
    c1:{x:0,   y:0  , E:0.000000,      N:0.000000},      c2:{x:50,   y:0,   E:0.000000,     N:100.000000},
    px:{x:0,   y:50},  E:100.000000,     N:0.000000 },
  { n:"folha real, 5 m/px",     s:5,  th:1.5,  tx:30000, ty:180000,
    c1:{x:100, y:100, E:30512.917137,  N:179513.259812}, c2:{x:1100, y:100, E:35511.203762, N:179644.144553},
    px:{x:600, y:700}, E:33090.591294,   N:176579.730208 }
];

/* Caso realista. Dois pontos do Douro reconhecíveis numa folha 1:25000, com o
   pixel onde caem. Os E/N vêm do PROJ 3.7.2; os lat/lon do ponto de ensaio vêm
   da inversa do mesmo PROJ sobre o ajuste. Escala e rotação são resultado do
   ajuste, não entrada — estão aqui para se ver onde diverge quando divergir. */
const DOURO = {
  c1: { x:240,  y:1580, lat:41.1614, lon:-7.7889 },   /* EPSG:3763 · E= 28889.2955  N=165859.4864 */
  c2: { x:2180, y:760,  lat:41.2758, lon:-7.4744 },   /* EPSG:3763 · E= 55189.0477  N=178716.7074 */
  mpp: 13.899234,                                      /* ajuste · 29274,3079 m / 2106,1814 px    */
  theta: 3.139901,                                     /* ajuste · graus                          */
  ensaio: { x:1210, y:1170, lat:41.2187084, lon:-7.6317862 },  /* PROJ 3.7.2 · E=42039.1716 N=172288.0969 */
  canto:  { x:0,    y:0,    lat:41.3573441, lon:-7.8420491 }   /* PROJ 3.7.2 · E=24355.6029 N=187604.5913 */
};

/* ESRI-WF · world file de uma folha a 25 m/px, norte em cima.
   Ordem no ficheiro: A, D, B, E, C, F — e não A, B, C, D, E, F.
   C e F designam o CENTRO do pixel superior esquerdo, não o seu canto. */
const WORLDFILE = {
  texto: "25.0\n0.0\n0.0\n-25.0\n30012.5\n180487.5\n",
  A: 25.0, D: 0.0, B: 0.0, E: -25.0, C: 30012.5, F: 180487.5,
  aplica: [                                    /* X = A·x + B·y + C ; Y = D·x + E·y + F */
    { x:0,   y:0,  X: 30012.5, Y: 180487.5 },
    { x:1,   y:0,  X: 30037.5, Y: 180487.5 },
    { x:0,   y:1,  X: 30012.5, Y: 180462.5 },
    { x:100, y:80, X: 32512.5, Y: 178487.5 }
  ],
  cantoSE: { X: 30000.0, Y: 180500.0 }         /* C − A/2 , F − E/2 */
};

/* =========================================================================
   ARNÊS
   ========================================================================= */

let passou = 0, falhou = 0;
const falhas = [];

function t(nome, fn){
  try { fn(); console.log("  ok    " + nome); passou++; }
  catch (e) {
    console.log("  FALHA " + nome + "\n          " + e.message);
    falhou++; falhas.push(nome);
  }
}
function ok(c, m){ if(!c) throw new Error(m || "condição falsa"); }
function perto(obtido, esperado, tol, m){
  if (typeof obtido !== "number" || !isFinite(obtido))
    throw new Error((m||"") + " — obtive " + JSON.stringify(obtido) + ", que não é número");
  const d = Math.abs(obtido - esperado);
  if (d > tol) throw new Error((m||"") + " — esperava " + esperado + ", obtive " + obtido +
    " (desvio " + d.toExponential(3) + ", tolerância " + tol + ")");
}
/** Falha com uma mensagem que nomeia o que falta, em vez de um ReferenceError cru. */
function precisa(nome){
  if (!existe(nome))
    throw new Error("`" + nome + "` não existe nesta revisão — é o que há para implementar");
  return ev(nome);
}
function grupo(titulo){ console.log("\n— " + titulo + " —"); }

/* =========================================================================
   CARGA
   ========================================================================= */

if (!fs.existsSync(ALVO)){
  console.error("Não encontrei " + path.resolve(ALVO));
  process.exit(2);
}

console.log("001-t-0021 · Folha de carta calibrada");
console.log("alvo: " + ALVO + " (" + fs.statSync(ALVO).size + " bytes)");

const dom = new JSDOM(fs.readFileSync(ALVO, "utf-8"), {
  runScripts: "dangerously",
  url: "https://exemplo.test/pea",
  virtualConsole: new VirtualConsole()
});
const w = dom.window;
w.Element.prototype.scrollIntoView = function(){};

/* O arranque da aplicação é assíncrono. 2,5 s cobre com folga o que se mediu
   nesta revisão (3,8 s de construção do DOM, arranque concluído bem antes). */
setTimeout(correr, 2500);

function correr(){

console.log("revisão declarada: " + ev("REVISAO_APP") + " · versão do estado: " + ev("VERSAO_ESTADO"));
console.log("\nEsperado contra a r0083: 16 verdes (grupo A) e 37 vermelhos (grupos B a E).");

/* =========================================================================
   A · A PROJEÇÃO PT-TM06 — A FUNDAÇÃO
   Existe na r0083. Deve passar. É o chão em que a folha assenta: se a folha
   ficar fora do sítio, é aqui que se vê primeiro se a culpa é da fundação.
   ========================================================================= */
grupo("A · projeção ETRS89 / PT-TM06 (EPSG:3763) — deve estar verde");

t("A1 · a grelha portuguesa declara-se EPSG:3763", () => {
  ok(existe("GRELHAS") && ev("GRELHAS.pttm06"), "não há grelha `pttm06`");
  ok(ev("GRELHAS.pttm06.crs") === "EPSG:3763", "declara " + ev("GRELHAS.pttm06.crs"));   /* EPSG:3763 */
});

t("A2 · semi-eixo maior do GRS80 = 6 378 137 m", () => {
  perto(ev("TM06_A"), EPSG3763.a, 1e-9, "TM06_A");                                    /* EPSG:3763 · GRS80 */
});

t("A3 · inverso do achatamento do GRS80 = 298,257222101", () => {
  perto(1/ev("TM06_F"), EPSG3763.invF, 1e-9, "1/TM06_F");                             /* EPSG:3763 · GRS80 */
});

t("A4 · latitude da origem = 39° 40' 05,73\" N", () => {
  perto(ev("TM06_LAT0"), EPSG3763.lat0, 1e-12, "TM06_LAT0");                          /* EPSG:3763 */
});

t("A5 · meridiano central = 8° 07' 59,19\" W", () => {
  perto(ev("TM06_LON0"), EPSG3763.lon0, 1e-12, "TM06_LON0");                          /* EPSG:3763 */
});

t("A6 · a origem da projeção dá Este exactamente zero", () => {
  const c = chama("paraTM06", PONTOS[0].lat, PONTOS[0].lon);
  perto(c.E, 0, TOL_M, "E da origem");                                            /* EPSG:3763 · falso Este = 0 */
});

t("A7 · a origem da projeção dá Norte exactamente zero", () => {
  const c = chama("paraTM06", PONTOS[0].lat, PONTOS[0].lon);
  perto(c.N, 0, TOL_M, "N da origem");                                            /* EPSG:3763 · falso Norte = 0 */
});

t("A8 · no meridiano central o Este anula-se a qualquer latitude", () => {
  const c = chama("paraTM06", PONTOS[1].lat, PONTOS[1].lon);
  perto(c.E, PONTOS[1].E, TOL_M, "E a 41 N sobre o meridiano central");            /* PROJ 3.7.2 · E = 0,0000 */
});

t("A9 · a 41 N o Norte vale 147 878,0183 m", () => {
  const c = chama("paraTM06", PONTOS[1].lat, PONTOS[1].lon);
  perto(c.N, PONTOS[1].N, TOL_M, "N a 41 N sobre o meridiano central");            /* PROJ 3.7.2 · N = 147878,0183 */
});

[2, 3, 4].forEach((i, k) => {
  const p = PONTOS[i];
  t("A" + (10+k) + " · " + p.n + " → E=" + p.E + " N=" + p.N, () => {
    const c = chama("paraTM06", p.lat, p.lon);
    perto(c.E, p.E, TOL_M, "Este de " + p.n);                                      /* PROJ 3.7.2 sobre EPSG:3763 */
    perto(c.N, p.N, TOL_M, "Norte de " + p.n);                                     /* PROJ 3.7.2 sobre EPSG:3763 */
  });
});

[2, 3, 4].forEach((i, k) => {
  const p = PONTOS[i];
  t("A" + (13+k) + " · ida e volta fecha em " + p.n, () => {
    const c = chama("paraTM06", p.lat, p.lon), v = chama("deTM06", c.E, c.N);
    perto(v.lat, p.lat, TOL_VOLTA, "latitude de volta");                           /* fecho medido: 6,0e-10 graus */
    perto(v.lon, p.lon, TOL_VOLTA, "longitude de volta");                          /* fecho medido: 6,1e-12 graus */
  });
});

t("A16 · a escala do PT-TM06 não depende da latitude", () => {
  const a = ev("GRELHAS.pttm06.escala(40, 10)"), b = ev("GRELHAS.pttm06.escala(42, 10)");
  perto(a, b, 1e-12, "escala a 40 N e a 42 N ao nível 10");
  /* É a razão de ser da escolha: em Web Mercator a 41 N a distância inflaciona
     cerca de 32 %, e num mapa onde se lêem distâncias de manobra isso não é
     detalhe. Aqui o metro do mapa é o metro do terreno em toda a folha. */
});

/* =========================================================================
   B · LEITURA DO WORLD FILE
   ========================================================================= */
grupo("B · leitura do world file — ausente na r0083");

t("B1 · `lerWorldFile` existe", () => { precisa("lerWorldFile"); });

t("B2 · devolve os seis coeficientes", () => {
  const r = CONTRATO.lerWorldFile(WORLDFILE.texto);
  ok(r, "devolveu " + JSON.stringify(r));
  ["A","D","B","E","C","F"].forEach(k => ok(typeof r[k] === "number", "falta o coeficiente " + k));
});

t("B3 · respeita a ordem A, D, B, E, C, F do ficheiro", () => {
  const r = CONTRATO.lerWorldFile(WORLDFILE.texto);
  perto(r.A, WORLDFILE.A, 1e-9, "A · 1.ª linha");     /* ESRI-WF · dimensão do pixel em x   */
  perto(r.D, WORLDFILE.D, 1e-9, "D · 2.ª linha");     /* ESRI-WF · rotação em torno de y    */
  perto(r.B, WORLDFILE.B, 1e-9, "B · 3.ª linha");     /* ESRI-WF · rotação em torno de x    */
  perto(r.E, WORLDFILE.E, 1e-9, "E · 4.ª linha");     /* ESRI-WF · dimensão do pixel em y   */
  perto(r.C, WORLDFILE.C, 1e-9, "C · 5.ª linha");     /* ESRI-WF · Este  do pixel superior esquerdo */
  perto(r.F, WORLDFILE.F, 1e-9, "F · 6.ª linha");     /* ESRI-WF · Norte do pixel superior esquerdo */
  /* Ler isto como A,B,C,D,E,F é o erro clássico do formato: troca as rotações
     pelas dimensões do pixel e a folha aparece esticada em vez de fora do sítio,
     que é a avaria mais difícil de ver a olho. */
});

t("B4 · a dimensão do pixel em y é negativa numa folha com norte em cima", () => {
  const r = CONTRATO.lerWorldFile(WORLDFILE.texto);
  ok(r.E < 0, "E = " + r.E + " — o Y da imagem cresce para baixo e o Norte para cima");  /* ESRI-WF */
});

WORLDFILE.aplica.forEach((c, k) => {
  t("B" + (5+k) + " · px(" + c.x + "," + c.y + ") → E=" + c.X + " N=" + c.Y, () => {
    const r = CONTRATO.lerWorldFile(WORLDFILE.texto);
    perto(r.A*c.x + r.B*c.y + r.C, c.X, TOL_M, "Este");    /* ESRI-WF · X = A·x + B·y + C */
    perto(r.D*c.x + r.E*c.y + r.F, c.Y, TOL_M, "Norte");   /* ESRI-WF · Y = D·x + E·y + F */
  });
});

t("B9 · C e F designam o centro do pixel superior esquerdo, não o canto", () => {
  const r = CONTRATO.lerWorldFile(WORLDFILE.texto);
  perto(r.C - r.A/2, WORLDFILE.cantoSE.X, TOL_M, "Este do canto");    /* ESRI-WF · canto = C − A/2 */
  perto(r.F - r.E/2, WORLDFILE.cantoSE.Y, TOL_M, "Norte do canto");   /* ESRI-WF · canto = F − E/2 */
  /* Meio pixel a 25 m/px são 12,5 m. Não desalinha nada que se veja no ecrã e
     desloca tudo o que se meça a partir da folha. */
});

t("B10 · recusa um ficheiro com menos de seis linhas", () => {
  const r = CONTRATO.lerWorldFile("25.0\n0.0\n0.0\n-25.0\n");
  ok(r === null || r === undefined, "devolveu " + JSON.stringify(r) + " em vez de recusar");
  /* Um world file truncado lido pela metade coloca a folha em coordenadas
     inventadas e nada no ecrã o diz. Recusar é a única saída honesta. */
});

/* =========================================================================
   C · SEMELHANÇA POR DOIS PONTOS DE CONTROLO
   ========================================================================= */
grupo("C · recolocação por dois pontos de controlo — ausente na r0083");

t("C1 · `folhaSemelhanca` existe", () => { precisa("folhaSemelhanca"); });

SEMELHANCA.forEach((c, k) => {
  t("C" + (2+k) + " · " + c.n + " (s=" + c.s + " m/px, θ=" + c.th + "°, t=(" + c.tx + "," + c.ty + ")) · " +
    "px(" + c.px.x + "," + c.px.y + ") → E=" + c.E + " N=" + c.N, () => {
    const pts = [
      { x:c.c1.x, y:c.c1.y, ...chama("deTM06", c.c1.E, c.c1.N) },
      { x:c.c2.x, y:c.c2.y, ...chama("deTM06", c.c2.E, c.c2.N) }
    ];
    const s = CONTRATO.folhaSemelhanca(pts);
    ok(s && typeof s.para === "function", "não devolveu transformação com `para`");
    const g = s.para(c.px.x, c.px.y);
    const m = chama("paraTM06", g.lat, g.lon);
    perto(m.E, c.E, 0.01, "Este do ponto de ensaio");    /* CONSTRUÍDO · 1 cm, folga sobre o erro da projeção */
    perto(m.N, c.N, 0.01, "Norte do ponto de ensaio");   /* CONSTRUÍDO · 1 cm                                 */
  });
});

t("C7 · a transformação inverte o eixo Y da imagem", () => {
  const pts = [ { x:0, y:0, ...chama("deTM06", 0, 0) }, { x:100, y:100, ...chama("deTM06", 100, -100) } ];
  const s = CONTRATO.folhaSemelhanca(pts);
  ok(s && typeof s.para === "function", "não devolveu transformação com `para`");
  const p0 = s.para(0, 0), p1 = s.para(0, 100);
  const a = chama("paraTM06", p0.lat, p0.lon), b = chama("paraTM06", p1.lat, p1.lon);
  ok(b.N < a.N, "descer na imagem tem de descer em latitude · N(y=0)=" + a.N + " N(y=100)=" + b.N);
  /* CONSTRUÍDO · o Y da imagem cresce para baixo, o Norte para cima: o
     determinante da transformação é negativo. Uma semelhança sem reflexão
     espelha a folha e ninguém dá por isso numa carta quase simétrica. */
});

t("C8 · recusa um único ponto de controlo", () => {
  const r = tenta(() => CONTRATO.folhaSemelhanca([{ x:0, y:0, lat:41.16, lon:-7.79 }]));
  ok(r === null || r === undefined || r instanceof Error, "devolveu " + JSON.stringify(r));
  /* Um ponto fixa a translação e deixa escala e rotação por determinar. */
});

t("C9 · recusa dois pontos de controlo coincidentes no terreno", () => {
  const p = { lat:41.1614, lon:-7.7889 };
  const r = tenta(() => CONTRATO.folhaSemelhanca([{ x:10, y:10, ...p }, { x:900, y:640, ...p }]));
  ok(r === null || r === undefined || r instanceof Error, "devolveu " + JSON.stringify(r));
  /* Distância nula no terreno e não nula na imagem dá escala zero: a folha
     colapsa num ponto. Melhor recusar do que desenhar. */
});

t("C10 · Douro · o controlo 1 recoloca-se sobre si próprio · px(240,1580) → 41,1614 N 7,7889 W", () => {
  const s = ajusteDouro();
  const g = s.para(DOURO.c1.x, DOURO.c1.y);
  perto(g.lat, DOURO.c1.lat, TOL_GRAUS, "latitude");     /* PROJ 3.7.2 · E=28889,2955 N=165859,4864 */
  perto(g.lon, DOURO.c1.lon, TOL_GRAUS, "longitude");    /* PROJ 3.7.2                              */
});

t("C11 · Douro · o controlo 2 recoloca-se sobre si próprio · px(2180,760) → 41,2758 N 7,4744 W", () => {
  const s = ajusteDouro();
  const g = s.para(DOURO.c2.x, DOURO.c2.y);
  perto(g.lat, DOURO.c2.lat, TOL_GRAUS, "latitude");     /* PROJ 3.7.2 · E=55189,0477 N=178716,7074 */
  perto(g.lon, DOURO.c2.lon, TOL_GRAUS, "longitude");    /* PROJ 3.7.2                              */
});

t("C12 · Douro · px(1210,1170) → 41,2187084 N 7,6317862 W", () => {
  const s = ajusteDouro();
  const g = s.para(DOURO.ensaio.x, DOURO.ensaio.y);
  perto(g.lat, DOURO.ensaio.lat, TOL_GRAUS, "latitude");   /* PROJ 3.7.2 · E=42039,1716 N=172288,0969 */
  perto(g.lon, DOURO.ensaio.lon, TOL_GRAUS, "longitude");  /* PROJ 3.7.2                              */
});

t("C13 · Douro · o canto px(0,0) → 41,3573441 N 7,8420491 W", () => {
  const s = ajusteDouro();
  const g = s.para(DOURO.canto.x, DOURO.canto.y);
  perto(g.lat, DOURO.canto.lat, TOL_GRAUS, "latitude");    /* PROJ 3.7.2 · E=24355,6029 N=187604,5913 */
  perto(g.lon, DOURO.canto.lon, TOL_GRAUS, "longitude");   /* PROJ 3.7.2                              */
  /* Extrapola para fora do segmento entre os controlos, que é onde uma
     semelhança mal ajustada se afasta primeiro. */
});

t("C14 · pixels igualmente espaçados dão pontos igualmente espaçados", () => {
  const s = ajusteDouro();
  const P = [0, 500, 1000, 1500].map(x => {
    const g = s.para(x, 900); return chama("paraTM06", g.lat, g.lon);
  });
  const d = [];
  for (let i = 1; i < P.length; i++) d.push(Math.hypot(P[i].E - P[i-1].E, P[i].N - P[i-1].N));
  d.forEach((v, i) => perto(v, d[0], 0.01, "troço " + (i+1) + " de 500 px"));
  perto(d[0], 500 * DOURO.mpp, 0.05, "500 px a " + DOURO.mpp + " m/px");   /* ajuste · 6949,617 m */
  /* Uma semelhança é linear. Se os troços não forem iguais, entrou por engano
     uma transformação de mais graus de liberdade — uma afim de três pontos,
     ou uma projectiva — e a folha deixa de ter escala única. */
});

/* =========================================================================
   D · AFERIÇÃO
   ========================================================================= */
grupo("D · aferição da folha — ausente na r0083");

t("D1 · `folhaAfericao` existe", () => { precisa("folhaAfericao"); });

t("D2 · Douro · 2106,1814 px sobre 29 274,3079 m → 13,899234 m/px", () => {
  const a = CONTRATO.folhaAfericao(folhaDouro());
  ok(a && typeof a.mpp === "number", "devolveu " + JSON.stringify(a));
  perto(a.mpp, DOURO.mpp, 1e-5, "metros por pixel");     /* ajuste · 29274,3079 / 2106,1814 */
});

t("D3 · escala pura · 200 px sobre 5 000 m → 25 m/px", () => {
  const a = CONTRATO.folhaAfericao(folhaDe(SEMELHANCA[1]));
  perto(a.mpp, 25, 1e-6, "metros por pixel");            /* CONSTRUÍDO · s = 25 */
});

t("D4 · rotação de 90° não altera a escala · 50 px sobre 100 m → 2 m/px", () => {
  const a = CONTRATO.folhaAfericao(folhaDe(SEMELHANCA[3]));
  perto(a.mpp, 2, 1e-6, "metros por pixel");             /* CONSTRUÍDO · s = 2, θ = 90° */
  /* Uma semelhança tem escala isotrópica: a rotação não a toca. Se tocar,
     entrou anisotropia e a folha tem escalas diferentes nos dois eixos. */
});

t("D5 · a aferição acorda com `distanciaM` a menos de 0,25 %", () => {
  const a = CONTRATO.folhaAfericao(folhaDouro());
  const dpx = Math.hypot(DOURO.c2.x - DOURO.c1.x, DOURO.c2.y - DOURO.c1.y);
  const esf = chama("distanciaM", DOURO.c1.lat, DOURO.c1.lon, DOURO.c2.lat, DOURO.c2.lon);
  const rel = Math.abs(a.mpp * dpx - esf) / esf;
  ok(rel < TOL_REL, "divergência de " + (rel*100).toFixed(4) + " %");
  /* Medido nesta revisão: 0,189 %. `distanciaM` é esférica com R=6 371 008,8 m
     e a aferição é plana em PT-TM06 — não têm de coincidir, têm de não
     divergir. Acima de 0,25 % a suspeita deixa de ser a esfera. */
});

t("D6 · uma folha sem calibração não devolve aferição", () => {
  const r = CONTRATO.folhaAfericao({ nome:"sem controlos", pts:[] });
  ok(r === null || r === undefined, "devolveu " + JSON.stringify(r));
  /* Devolver zero, ou NaN, deixa a folha entrar no ecrã com uma escala que
     ninguém pode ler. Não haver aferição tem de se distinguir de haver uma má. */
});

/* =========================================================================
   E · FORMA E ESTADO DA FOLHA
   ========================================================================= */
grupo("E · forma e estado da folha — ausente na r0083");

t("E1 · `FOLHAS` existe e é uma lista", () => {
  const F = precisa("FOLHAS");
  ok(Array.isArray(F) || ev("Array.isArray(FOLHAS)"), "FOLHAS é " + typeof F);
});

t("E2 · `folhaCalibrada` existe", () => { precisa("folhaCalibrada"); });

t("E3 · duas referências com lat/lon dão folha calibrada", () => {
  ok(CONTRATO.folhaCalibrada(folhaDouro()) === true, "não reconheceu a folha do Douro");
});

t("E4 · um único ponto de controlo não calibra", () => {
  ok(CONTRATO.folhaCalibrada({ nome:"um só", pts:[DOURO.c1] }) === false, "aceitou um ponto só");
});

t("E5 · um ponto sem coordenadas no terreno não calibra", () => {
  const f = { nome:"sem terreno", pts:[ DOURO.c1, { x:2180, y:760 } ] };
  ok(CONTRATO.folhaCalibrada(f) === false, "aceitou um controlo sem lat/lon");
  /* Um controlo colocado na imagem e por identificar no terreno é trabalho a
     meio, não calibração. Entra no ecrã como se estivesse pronto. */
});

t("E6 · dois controlos no mesmo pixel não calibram", () => {
  const f = { nome:"pixel repetido", pts:[
    { x:240, y:1580, lat:41.1614, lon:-7.7889 },
    { x:240, y:1580, lat:41.2758, lon:-7.4744 } ] };
  ok(CONTRATO.folhaCalibrada(f) === false, "aceitou dois controlos no mesmo pixel");
  /* Distância nula na imagem e não nula no terreno dá escala infinita. */
});

t("E7 · uma folha sem proveniência declarada não é admitida", () => {
  const f = folhaDouro();
  delete f.por; delete f.g;
  ok(CONTRATO.folhaCalibrada(f) === false, "admitiu uma folha sem autor nem GDH");
  /* Despacho n.º 4067/2024, art. 2.º, al. c) — o registo é explícito e completo.
     Uma folha colocada à mão é uma afirmação sobre onde as coisas estão, e a sua
     posição vale o que valem as coordenadas que lhe foram dadas: sem saber quem
     as deu e quando, a afirmação não é conferível e não deve entrar no ecrã.

     A primeira versão desta asserção verificava `nome`, `por` e `g` no objeto
     construído pelo próprio teste — passava a verde sem tocar na aplicação, e
     certificava a fixture em vez do código. Ficou registado por ser o mesmo
     defeito que este projeto apanhou noutro teste na mesma semana. */
});

/* =========================================================================
   AUXILIARES
   ========================================================================= */

function tenta(fn){ try { return fn(); } catch (e) { return e; } }

function folhaDouro(){
  return { nome:"CMP 1:25000 · folha 116 (ensaio)", por:"Abreu, C.", g:"021545SET26",
           ver:true, pts:[ DOURO.c1, DOURO.c2 ] };
}
function folhaDe(c){
  return { nome:c.n, por:"ensaio", g:"021545SET26", ver:true, pts:[
    { x:c.c1.x, y:c.c1.y, ...chama("deTM06", c.c1.E, c.c1.N) },
    { x:c.c2.x, y:c.c2.y, ...chama("deTM06", c.c2.E, c.c2.N) } ] };
}
function ajusteDouro(){
  const s = CONTRATO.folhaSemelhanca([ DOURO.c1, DOURO.c2 ]);
  if (!s || typeof s.para !== "function")
    throw new Error("`folhaSemelhanca` não devolveu transformação com `para`");
  return s;
}

/* =========================================================================
   CONTAGEM
   ========================================================================= */

console.log("\n" + "=".repeat(66));
console.log("  " + passou + " a passar · " + falhou + " a falhar · " + (passou+falhou) + " asserções");
if (falhou) console.log("\n  por implementar:\n    " + falhas.join("\n    "));
console.log("=".repeat(66));
process.exit(falhou ? 1 : 0);

}
