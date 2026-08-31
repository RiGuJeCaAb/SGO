/**
 * t0019 — Motor de propagação e catálogo de modelos de combustível.
 *
 * Não testa que o código corre: testa que os números que saem são os dos quadros
 * publicados. Uma tabela mal transcrita passa em qualquer teste de fumo e produz
 * comportamento do fogo errado com toda a confiança do mundo.
 *
 * Corre: node CSREPCDouro_202608312230_t0019_Propagacao_CLD.js r0073.html
 */
const fs = require("fs");
const { JSDOM } = require("jsdom");

const ficheiro = process.argv[2] || "r0073.html";
const src = fs.readFileSync(ficheiro, "utf-8");
const js = (src.match(/<script>[\s\S]*?<\/script>/g) || [])
  .map(b => b.slice(8, -9)).sort((a, b) => b.length - a.length)[0];

let passou = 0, falhou = 0;
function t(nome, cond, det){
  if(cond){ passou++; console.log("  ok   " + nome); }
  else { falhou++; console.log("  FALHA " + nome + (det ? "  → " + det : "")); }
}
function perto(a, b, tol, nome){ t(nome, Math.abs(a - b) <= tol, a + " vs " + b); }

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
function lista(nome){
  const i = js.indexOf("const " + nome + " ");
  if(i < 0) throw new Error("não encontrei: " + nome);
  let d = 0;
  for(let k = js.indexOf("[", i); k < js.length; k++){
    if(js[k] === "[") d++;
    else if(js[k] === "]"){ d--; if(!d) return "const " + nome + " = " + js.slice(js.indexOf("[", i), k + 1) + ";"; }
  }
  throw new Error("sem fecho: " + nome);
}

const A = eval(`
${lista("MODELOS_COMB").replace("const MODELOS_COMB =", "const MODELOS_COMB =")}
${lista("Q_HCM_HR")} ${lista("Q_HCM_D")} ${lista("Q_HCM")}
${js.match(/const HCM_TEMP_MAX = \d+;/)[0]}
${lista("Q_MAT_U")} ${lista("Q_MAT_H")} ${lista("Q_MAT_R")}
${lista("Q_MAT_ALT")} ${lista("Q_MAT_DECL")}
${lista("Q_PIN_U")} ${lista("Q_PIN_H")} ${lista("Q_PIN_R")} ${lista("Q_PIN_DECL")}
${js.match(/const Q_PIN_TIPO = \{[^}]*\};/)[0]}
${bloco("function modeloComb(c){")}
${bloco("function interpPares(tab, x){")}
${bloco("function posEixo(eixo, x){")}
${bloco("function interpMatriz(eixoL, eixoC, mat, xl, xc){")}
${bloco("function ventoSuperficie(u10){")}
${bloco("function humidadeCombustivel(hr, dias, tempC){")}
${bloco("function propagacaoMatos(u2, hcm, altura, declive){")}
${bloco("function propagacaoPinhal(u2, hcm, declive, tipo){")}
${bloco("function epsilonDosQuadros(u2, hcm, declive){")}
({MODELOS_COMB, Q_MAT_R, Q_MAT_U, Q_MAT_H, Q_MAT_ALT, Q_MAT_DECL, Q_PIN_R, Q_PIN_U, Q_PIN_H, Q_PIN_DECL, Q_HCM, Q_HCM_HR, Q_HCM_D, HCM_TEMP_MAX, Q_PIN_TIPO,
  modeloComb, interpPares, interpMatriz, ventoSuperficie, humidadeCombustivel,
  propagacaoMatos, propagacaoPinhal, epsilonDosQuadros})
`);

/* ---- 1. forma das tabelas -------------------------------------------------------- */
t("o catálogo tem os 18 modelos", A.MODELOS_COMB.length === 18, String(A.MODELOS_COMB.length));
t("todos os códigos são únicos", new Set(A.MODELOS_COMB.map(m => m.c)).size === 18);
t("todos os códigos FARSITE estão na gama 211–237",
  A.MODELOS_COMB.every(m => m.n >= 211 && m.n <= 237));
t("Q_MAT_R tem 21 linhas de vento", A.Q_MAT_R.length === 21);
t("Q_MAT_R tem 12 colunas de humidade", A.Q_MAT_R.every(l => l.length === 12));
t("Q_PIN_R tem 18 linhas de humidade", A.Q_PIN_R.length === 18);
t("Q_PIN_R tem 12 colunas de vento", A.Q_PIN_R.every(l => l.length === 12));
t("Q_HCM tem 16 linhas de HR", A.Q_HCM.length === 16);
t("Q_HCM tem 7 colunas de dias", A.Q_HCM.every(l => l.length === 7));

/* ---- 2. monotonia: o que a física obriga ----------------------------------------- */
{
  let okU = true, okH = true;
  for(let c = 0; c < 12; c++)
    for(let l = 1; l < 21; l++) if(A.Q_MAT_R[l][c] < A.Q_MAT_R[l-1][c]) okU = false;
  for(let l = 0; l < 21; l++)
    for(let c = 1; c < 12; c++) if(A.Q_MAT_R[l][c] > A.Q_MAT_R[l-0][c-1] + 1e-9) { /* ok */ }
  for(let l = 0; l < 21; l++)
    for(let c = 1; c < 12; c++) if(A.Q_MAT_R[l][c] > A.Q_MAT_R[l][c-1]) okH = false;
  t("matos: mais vento nunca dá menos propagação", okU);
  t("matos: mais humidade nunca dá mais propagação", okH);
}
{
  let okU = true, okH = true;
  for(let l = 0; l < 18; l++)
    for(let c = 1; c < 12; c++){
      const a = A.Q_PIN_R[l][c-1], b = A.Q_PIN_R[l][c];
      if(a !== null && b !== null && b < a) okU = false;
    }
  for(let c = 0; c < 12; c++)
    for(let l = 1; l < 18; l++){
      const a = A.Q_PIN_R[l-1][c], b = A.Q_PIN_R[l][c];
      if(a !== null && b !== null && b > a) okH = false;
    }
  t("pinhal: mais vento nunca dá menos propagação", okU);
  t("pinhal: mais humidade nunca dá mais propagação", okH);
}
{
  let ok = true;
  for(let l = 1; l < 16; l++)
    for(let c = 0; c < 7; c++) if(A.Q_HCM[l][c] < A.Q_HCM[l-1][c]) ok = false;
  t("humidade: ar mais húmido nunca dá combustível mais seco", ok);
  ok = true;
  for(let l = 0; l < 16; l++)
    for(let c = 1; c < 7; c++) if(A.Q_HCM[l][c] > A.Q_HCM[l][c-1]) ok = false;
  t("humidade: mais dias sem chuva nunca dá combustível mais húmido", ok);
}

/* ---- 3. leituras exatas dos quadros publicados ----------------------------------- */
perto(A.interpMatriz([0.5,1,2,3,4,5,6,7,8,9,10,12,14,16,18,20,22,24,26,28,30],
  [8,10,12,14,16,18,20,22,25,30,35,40], A.Q_MAT_R, 10, 8).v, 11.5, 1e-9,
  "Quadro 3.4.1 · 10 km/h e 8 % dá 11,5 m/min");
perto(A.interpMatriz(A.Q_MAT_U, A.Q_MAT_H, A.Q_MAT_R, 30, 40).v, 5.5, 1e-9,
  "Quadro 3.4.1 · canto inferior direito é 5,5 m/min");
perto(A.interpMatriz(A.Q_MAT_U, A.Q_MAT_H, A.Q_MAT_R, 0.5, 8).v, 0.4, 1e-9,
  "Quadro 3.4.1 · canto superior esquerdo é 0,4 m/min");
perto(A.interpPares([[0.2,0.3],[0.4,0.5],[0.6,0.6],[0.8,0.9],[1.0,1.0],[1.2,1.2],[1.4,1.3],
  [1.6,1.5],[1.8,1.6],[2.0,1.8],[2.5,2.1],[3.0,2.5]], 1.0).v, 1.0, 1e-9,
  "Quadro 3.4.2 · vegetação de 1 m é o valor de referência, factor 1,0");
perto(A.interpPares([[-40,0.3],[-20,0.5],[-5,1.0],[5,1.0],[10,1.2],[15,1.3],[20,1.5],
  [25,1.6],[30,1.8],[35,2.0],[40,2.1],[45,2.4],[50,2.6]], 35).v, 2.0, 1e-9,
  "Quadro 3.4.3 · declive de 35 % duplica a propagação");
perto(A.interpMatriz(A.Q_PIN_H, A.Q_PIN_U, A.Q_PIN_R, 12, 0.5).v, 54, 1e-9,
  "Quadro 7.1 · 12 % e 0,5 km/h dá 54 m/h");
perto(A.interpMatriz(A.Q_PIN_H, A.Q_PIN_U, A.Q_PIN_R, 12, 6.0).v, 177, 1e-9,
  "Quadro 7.1 · 12 % e 6,0 km/h dá 177 m/h");

/* ---- 4. conversão de vento ------------------------------------------------------- */
perto(A.ventoSuperficie(30), 20, 1e-9, "Quadro 3.3.1 · 30 km/h a 10 m dá 20 km/h à superfície");
perto(A.ventoSuperficie(0), 0, 1e-9, "vento nulo continua nulo");

/* ---- 5. a recusa acima de 25 graus ----------------------------------------------- */
t("o limite do Quadro 3.2.1 é 25 °C", A.HCM_TEMP_MAX === 25);
{
  const r = A.humidadeCombustivel(40, 5, 32);
  t("recusa a estimativa de humidade a 32 °C", r.v === null && !!r.recusa,
    "é a fronteira entre o fogo controlado e o DECIR");
  t("a recusa diz o limite e a temperatura", /25 °C/.test(r.recusa) && /32/.test(r.recusa));
  const ok = A.humidadeCombustivel(40, 5, 18);
  t("aceita a 18 °C", ok.v !== null);
  perto(ok.v, 17, 1e-9, "Quadro 3.2.1 · HR 40 % e 5 dias dá 17 %");
  const semT = A.humidadeCombustivel(40, 5, NaN);
  t("sem temperatura conhecida não recusa", semT.v !== null,
    "a recusa é sobre uma temperatura sabida, não sobre a ignorância dela");
  perto(A.humidadeCombustivel(40, 12, 18).v, 14, 1e-9,
    "mais de 7 dias sem chuva prende-se à coluna dos 7");
}

/* ---- 6. os buracos do quadro do pinhal não viram zeros --------------------------- */
{
  t("o canto sem dados do Quadro 7.1 é nulo, não zero", A.Q_PIN_R[17][0] === null);
  const r = A.propagacaoPinhal(0.5, 55, 0, 1);
  t("propagacaoPinhal recusa onde a fonte não dá propagação sustentada", r === null,
    "tratar a ausência como zero produziria fogo lento onde não há fogo nenhum");
  const ok = A.propagacaoPinhal(4.0, 55, 0, 1);
  t("mas calcula onde a fonte dá", ok !== null);
}

/* ---- 7. os motores, com números feitos à mão ------------------------------------- */
{
  /* matos de 1 m (factor 1,0), humidade 10 %, vento 10 km/h a 2 m, declive 35 % (factor 2,0)
     R = 10,0 m/min × 1,0 × 2,0 × 60 = 1200 m/h */
  const p = A.propagacaoMatos(10, 10, 1.0, 35);
  perto(p.r, 1200, 1e-6, "matos · 10 km/h, 10 %, 1 m, 35 % dá 1200 m/h");
  perto(p.fDecl, 2.0, 1e-9, "o factor de declive é 2,0");
  t("dentro do domínio não há avisos", p.fora.length === 0);

  const fora = A.propagacaoMatos(45, 10, 1.0, 35);
  t("acima dos 30 km/h assinala que saiu do quadro", fora.fora.length > 0);
  t("o aviso nomeia o quadro", /3\.4\.1/.test(fora.fora.join(" ")));
  /* 45 km/h prende-se aos 30 do quadro: 33,5 m/min × 1,0 × 2,0 × 60 = 4020 m/h */
  perto(fora.r, 33.5 * 1.0 * 2.0 * 60, 1e-6,
    "e prende-se à última linha em vez de extrapolar");

  const alta = A.propagacaoMatos(10, 10, 3.5, 35);
  t("altura acima de 3 m assinala o Quadro 3.4.2", /3\.4\.2/.test(alta.fora.join(" ")));
}
{
  /* pinhal, tipo 2 (arbustos/folhada, aditivo −6), humidade 20 %, vento 3,0 km/h,
     declive 0 (factor 1,0): 104 × 1,0 − 6 = 98 m/h */
  const p = A.propagacaoPinhal(3.0, 20, 0, 2);
  perto(p.r, 98, 1e-6, "pinhal · 3,0 km/h, 20 %, plano, tipo 2 dá 98 m/h");
  perto(A.Q_PIN_TIPO[3], 71, 1e-9, "o tipo 3 (herbáceas/fetos) soma 71 m/h");
  /* o aditivo entra depois do multiplicativo: 104 × 2,0 − 6 = 202, e não (104−6) × 2,0 = 196 */
  const d = A.propagacaoPinhal(3.0, 20, 30, 2);
  perto(d.r, 202, 1e-6, "o ajuste de tipo é aditivo e entra depois do declive");
  /* 1,0 km/h, 50 %, declive de −40 %, tipo 1: 31 × 0,4 − 35 = −22,6, que se corta a zero.
     Um fogo a recuar por uma encosta abaixo em combustível húmido pode não se propagar; o
     que não pode é propagar-se para trás, e o aditivo do quadro consegue lá chegar. */
  const neg = A.propagacaoPinhal(1.0, 50, -40, 1);
  t("a combinação existe no quadro", neg !== null);
  t("nunca devolve propagação negativa", neg && neg.r >= 0);
  perto(neg.r, 0, 1e-9, "o aditivo do tipo 1 leva-a abaixo de zero e é cortada");
}

/* ---- 8. a ponte para o ε --------------------------------------------------------- */
{
  /* R0 = 0,4 (0,5 km/h, 10 %); R(7) = 7,0; f_decl(35) = 2,0
     ε = 0,4 × (2,0 − 1) / (7,0 − 0,4) = 0,0606 */
  perto(A.epsilonDosQuadros(7, 10, 35), 0.4 * 1.0 / 6.6, 1e-6,
    "ε dos quadros bate com a ponte declarada");
  t("mais vento dá menos ε", A.epsilonDosQuadros(18, 10, 35) < A.epsilonDosQuadros(7, 10, 35));
  t("mais declive dá mais ε", A.epsilonDosQuadros(7, 10, 40) > A.epsilonDosQuadros(7, 10, 20));
  t("sem vento não há razão nenhuma", A.epsilonDosQuadros(0.5, 10, 35) === null,
    "o denominador anula-se e um ε infinito seria pior do que nenhum");
}

/* ---- 9. catálogo: quem tem motor e quem não tem ---------------------------------- */
{
  t("V-MAb usa o guia dos matos", A.modeloComb("V-MAb").motor === "matos");
  t("M-PIN usa o guia do pinhal, tipo 2", A.modeloComb("M-PIN").motor === "pinhal"
    && A.modeloComb("M-PIN").tipoPin === 2);
  t("F-PIN é tipo 1 (folhada, sub-bosque < 30 %)", A.modeloComb("F-PIN").tipoPin === 1);
  t("M-F é tipo 3 (fetos sobre folhada)", A.modeloComb("M-F").tipoPin === 3);
  t("o eucaliptal não tem motor português", A.modeloComb("M-EUC").motor === null,
    "e a aplicação tem de o dizer em vez de usar o quadro errado");
  t("as folhosas não têm motor", A.modeloComb("M-CAD").motor === null);
  t("as herbáceas não têm motor", A.modeloComb("V-Ha").motor === null);
  perto(A.modeloComb("V-MAb").w[0], 7, 1e-9, "V-MAb carrega 7 t/ha no mínimo");
  perto(A.modeloComb("V-MAb").w[1], 14, 1e-9, "V-MAb carrega 14 t/ha no máximo");
  perto(A.modeloComb("V-MAa").w[1], 27, 1e-9, "V-MAa chega a 27 t/ha");
  t("V-MH não traz carga publicada", A.modeloComb("V-MH").w[0] === null);
  t("todos os modelos com carga têm mínimo não superior ao máximo",
    A.MODELOS_COMB.every(m => m.w[0] === null || m.w[0] <= m.w[1]));
  t("todos os modelos com motor de matos trazem altura de referência",
    A.MODELOS_COMB.filter(m => m.motor === "matos").every(m => m.alt > 0));
  t("todos os modelos com motor de pinhal trazem tipo válido",
    A.MODELOS_COMB.filter(m => m.motor === "pinhal").every(m => [1,2,3].indexOf(m.tipoPin) >= 0));
}

/* ---- 10. a interface e o estado -------------------------------------------------- */
{
  const doc = new JSDOM(src, { runScripts: "outside-only" }).window.document;
  ["pr-modelo","pr-alt","pr-decl","pr-u10","pr-hr","pr-dias","pr-hcm","pr-calc","pr-meteo","pr-usar","pr-saida"]
    .forEach(id => t("existe #" + id, !!doc.getElementById(id)));
  t("o estado subiu para a versão 22", /VERSAO_ESTADO = 22/.test(js));
  t("há migração para o ramo da estimativa", /e\.dados\.fogo\.est = \{/.test(js));
  t("o ramo novo tem posse declarada", /p:"dados\.fogo\.est"/.test(js));
  t("usar a estimativa deixa registo na fita",
    /fita\("Velocidade de propagação estimada/.test(js));
  t("a fita diz que a carga é o extremo superior",
    /extremo superior do modelo/.test(js));
  t("a proveniência das fontes está no ecrã",
    /Fernandes, Botelho e Loureiro \(2002b\)/.test(src) && /Fernandes e Loureiro \(2021\)/.test(src));
  t("o ecrã diz que são guias de fogo controlado",
    /São guias de fogo controlado/.test(src));
}

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
