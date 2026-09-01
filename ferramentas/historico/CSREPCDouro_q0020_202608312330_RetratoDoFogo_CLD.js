/**
 * q0020 — o ambiente de fogo tem de aparecer no plano, com número e com origem.
 *
 * Monta uma ocorrência com terreno, combustível, perfil, frentes e linhas; corre a
 * estimativa; emite o PEA determinístico; e lê as propostas para ver se citam os factos
 * em vez de repetirem regras genéricas. Depois baixa a intensidade e verifica que o plano
 * muda de veredicto — que é a prova de que está a ler os dados e não a decorar frases.
 */
const path = require("path");
const chromium = require("@sparticuz/chromium").default;
const { chromium: pw } = require("playwright-core");

(async () => {
  const exec = await chromium.executablePath();
  const b = await pw.launch({ executablePath: exec, args: chromium.args, headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
  p.on("pageerror", e => console.log("  [erro] " + String(e).slice(0, 220)));
  await p.goto("file://" + path.resolve("r0074.html"));
  await p.waitForTimeout(2500);

  const montar = (r, w) => p.evaluate(({ r, w }) => {
    O.meta.num = "2026/12345"; O.meta.local = "Cabeça Boa, Armamar";
    O.meta.lat = "41.0094"; O.meta.lon = "-7.6050"; O.meta.fase = "III";
    O.dados.area = "180";
    O.dados.sensiveis = "Aglomerado de Vilarinho a 900 m NE";
    O.dados.topo = { orient: "E", declive: "acentuado", obs: "linha de água a sul", eps: "" };
    O.dados.fogo.r = String(r); O.dados.fogo.w = String(w);
    O.dados.fogo.est = Object.assign(O.dados.fogo.est, {
      modelo: "V-MAa", altura: "1,5", declive: "10", u10: "27", hcm: "10",
      hcmOrigem: "declarada", rEst: String(r), wMin: "12", wMax: "27" });
    /* perfil com uma quebra de 35 % a 1,4 km, para exercitar a regra do salto de classe */
    /* 4 km em 100 cotas: passo de ~40 m. Patamar suave até 1,4 km, depois uma quebra
       de 35 % durante 400 m, e o resto em declive moderado. */
    const e = []; let z = 835;
    for (let i = 0; i < 100; i++) {
      e.push(z);
      const km = i * 4.0 / 99;
      z -= (km < 1.4 ? 1.6 : (km < 1.8 ? 14.1 : 3.2));
    }
    O.dados.perfil = { a: { lat: 41.0094, lon: -7.605 }, b: { lat: 41.0094, lon: -7.56 },
      rot: "E (90°)", total: 4.0, e };
    O.dados.frentes = [{ id: "f1", tipo: "cabeca", linha: [[-7.60, 41.01], [-7.59, 41.02]],
      rumo: 45, rumoFonte: "sugerido pelo traçado", setor: "A", m: 1200, g: "", por: "" }];
    O.dados.linhas = [
      { id: "l1", tipo: "contencao", linha: [[-7.60, 41.00], [-7.58, 41.00]], larguraM: 3,
        m: 1800, setor: "A", g: "", por: "" },
      { id: "l2", tipo: "contencao", linha: [[-7.61, 41.00], [-7.60, 41.01]], larguraM: null,
        m: 900, setor: "B", g: "", por: "" }];
    O.dados.sensDet = { itens: [
      { nome: "Lar de Vilarinho", dist: 900, rumo: 45, sens: true, tipo: "lar" },
      { nome: "Depósito de gás", dist: 1400, rumo: 120, sens: true, tipo: "industria" }] };
    return retratoDoFogo();
  }, { r, w });

  console.log("=== caso 1: 3192 m/h sobre 27 t/ha ===");
  const rf = await montar(3192, 27);
  console.log("  I = " + Math.round(rf.lim.i) + " kW/m · chama " + rf.lim.chama.toFixed(1)
    + " m · segurança " + rf.lim.seguranca + " m · contenção " + rf.lim.contencao + " m");
  console.log("  origem do R: " + rf.r.origem);
  console.log("  perfil: declive máx " + rf.perfil.declMaxPc + " % a " + rf.perfil.kmDeclMax + " km"
    + (rf.perfil.salto ? " · SALTO ×" + rf.perfil.salto.k : " · sem salto"));
  console.log("  linhas estreitas: " + rf.linhas.filter(l => l.estreita).length
    + " · sem largura: " + rf.linhas.filter(l => l.semLargura).length);
  console.log("  sensíveis por validar: " + rf.detetados.porValidar.length);

  const plano = await p.evaluate(() => {
    const d = detDecisao([], null), sit = detSituacao([], null);
    return { propostas: d.propostas.map(x => x.id + " · " + x.texto + "  ||  " + x.fundamento),
             seguranca: d.seguranca, analise: sit.analise_zi };
  });
  console.log("\n  — análise das ZI —");
  console.log("  " + plano.analise.replace(/\s+/g, " ").slice(0, 900));
  console.log("\n  — propostas (as três primeiras) —");
  plano.propostas.slice(0, 6).forEach(x => console.log("  " + x.replace(/\s+/g, " ").slice(0, 340)));
  console.log("\n  — segurança —");
  plano.seguranca.slice(0, 4).forEach(x => console.log("  · " + x.slice(0, 200)));

  console.log("\n=== caso 2: mesma ocorrência a 300 m/h sobre 5 t/ha ===");
  const rf2 = await montar(300, 5);
  console.log("  I = " + Math.round(rf2.lim.i) + " kW/m · ataque direto admissível: " + rf2.lim.direto);
  const plano2 = await p.evaluate(() => detDecisao([], null).propostas
    .map(x => x.id + " · " + x.texto + "  ||  " + x.fundamento));
  console.log("  " + plano2[0].replace(/\s+/g, " ").slice(0, 320));

  console.log("\n=== caso 3: sem dados de comportamento ===");
  await p.evaluate(() => { O.dados.fogo.r = ""; O.dados.fogo.w = ""; });
  const vazio = await p.evaluate(() => detSituacao([], null).analise_zi);
  console.log("  " + vazio.replace(/\s+/g, " ").slice(0, 420));

  await b.close();
})().catch(e => { console.error(String(e).slice(0, 600)); process.exit(1); });
