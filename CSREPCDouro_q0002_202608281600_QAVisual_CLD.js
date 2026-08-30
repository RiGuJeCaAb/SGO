/* q0001 — QA visual do r0023 (patch p0001)
   Chromium 149 empacotado via @sparticuz/chromium; playwright-core como condutor. */
const { chromium } = require("playwright-core");
const fs = require("fs");

const EXEC = "/home/claude/pea/chrome/headless_shell";
const FICH = "file:///home/claude/pea/r0024.html";
const OUT = "/home/claude/pea/qa";
fs.mkdirSync(OUT, { recursive: true });

let passou = 0, falhou = 0;
const t = (n, c, det) => { if (c) { console.log("  ok   " + n); passou++; }
  else { console.log("  FALHA " + n + (det ? " -> " + det : "")); falhou++; } };

(async () => {
  const b = await chromium.launch({ executablePath: EXEC,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--font-render-hinting=none"] });

  for (const tema of ["escuro", "claro"]) {
    console.log("\n═══ tema " + tema + " ═══");
    const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    const erros = [];
    pg.on("pageerror", e => erros.push(e.message.split("\n")[0]));
    pg.on("console", m => { if (m.type() === "error") erros.push("console: " + m.text().slice(0, 120)); });

    await pg.goto(FICH, { waitUntil: "load" });
    await pg.waitForTimeout(900);
    await pg.evaluate(t => aplicarTema(t), tema);
    await pg.waitForTimeout(300);

    // preencher uma ocorrência e emitir um PEA determinístico
    await pg.evaluate(() => {
      O = novoEstado();
      O.meta.num = "2026080123"; O.meta.local = "Alijó"; O.meta.pco = "Vila Real";
      O.meta.fase = "IV"; O.meta.lat = "41.27"; O.meta.lon = "-7.47";
      O.dados.area = "120"; O.dados.sensiveis = "Aldeia de Vilarinho a 800 m do flanco norte";
      O.dados.setores = "Setor A — Em curso; 6 meios / 24 op.\nSetor B — Em resolução; 3 meios / 12 op.";
      escreverForm();
      const d = detCompleto([], null);
      O.peas.push({ n: 1, g: gdhAgora(), ts: Date.now(), validoTs: Date.now() + 6 * 3.6e6,
        modo: "Determinística", json: { pea: d.pea, ordens: d.ordens }, met: metricas(), serie: [],
        ctrl: controloMissoes(Object.assign({}, d.pea, d.ordens)), ultVerd: "vigor", base: null,
        dados: JSON.parse(JSON.stringify(O.dados)), evoIdx: 0, meta: Object.assign({}, O.meta),
        don: [], pco: { funcoes: [], canais: {} } });
      pintarTudo();
    });
    await pg.waitForTimeout(400);

    const tirar = async (painel, nome) => {
      await pg.evaluate(p => irPara(p), painel);
      await pg.waitForTimeout(450);
      await pg.screenshot({ path: `${OUT}/${nome}_${tema}.png`, fullPage: true });
    };

    // ── painel do PEA: indicador de modo + PEA renderizado ──
    await pg.evaluate(() => { verPEA(1); });
    await tirar("p-pea", "pea");

    const ind = await pg.evaluate(() => {
      const e = document.getElementById("llm-modo");
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      return { txt: e.textContent, vis: cs.display, w: r.width, h: r.height,
               cor: cs.color, fundo: cs.backgroundColor, cls: e.className };
    });
    t("indicador de modo visível e com área", ind.vis !== "none" && ind.w > 200 && ind.h > 10,
      JSON.stringify({ vis: ind.vis, w: ind.w, h: ind.h }));
    t("indicador declara modo manual em file://", /Determinística/.test(ind.txt) && /err/.test(ind.cls),
      ind.txt.slice(0, 70));
    t("indicador tem contraste (cor != fundo)", ind.cor !== ind.fundo, ind.cor + " sobre " + ind.fundo);

    const pea = await pg.evaluate(() => {
      const v = document.getElementById("pea-view");
      const secs = [...v.querySelectorAll(".pd-body, .pd-obj, .pd-p, table")];
      return { alt: v.getBoundingClientRect().height, blocos: secs.length,
               vazios: secs.filter(s => !s.textContent.trim()).length,
               txt: v.textContent };
    });
    t("PEA renderizado com altura real", pea.alt > 800, "altura " + Math.round(pea.alt));
    t("sem blocos vazios no PEA", pea.vazios === 0, pea.vazios + " vazios de " + pea.blocos);
    t("PEA mostra objetivo e ordens de missão",
      /Objetivo/.test(pea.txt) && /decisiva/i.test(pea.txt));
    t("sem 'undefined' visível", !/undefined/.test(pea.txt));

    // ── etiquetas de célula: têm de dizer a verdade doutrinária ──
    const etq = await pg.evaluate(() => {
      const v = document.getElementById("pea-view");
      const cabecalhos = [...v.querySelectorAll(".pd .pt")].map(e => e.textContent.trim());
      const oficiais = [...v.querySelectorAll(".cel")].map(c => ({
        celula: c.querySelector(".cel-v").textContent.replace(/\s+/g, " ").trim(),
        linhas: [...c.querySelectorAll(".cel-lab")].map(l => l.textContent.trim())
      }));
      const vazios = [...v.querySelectorAll(".pd")].filter(d => {
        const t = d.textContent.replace(d.querySelector(".pt") ? d.querySelector(".pt").textContent : "", "");
        return !t.trim();
      }).map(d => d.querySelector(".pt") ? d.querySelector(".pt").textContent.trim() : "?");
      return { cabecalhos, oficiais, vazios };
    });
    const temCab = x => etq.cabecalhos.some(c => c.replace(/\s+/g, " ").includes(x));
    t("segurança das forças sob Célula de Planeamento (art. 27.º, al. a))",
      temCab("Célula de Planeamento · Segurança das forças"), etq.cabecalhos.join(" / "));
    t("prioridades táticas sob Célula de Planeamento",
      temCab("Célula de Planeamento · Prioridades táticas"), etq.cabecalhos.join(" / "));
    t("já não existe 'Célula de Operações · Proposta de planeamento'",
      !temCab("Célula de Operações · Proposta de planeamento"));
    t("nenhum bloco do painel com cabeçalho e sem conteúdo",
      etq.vazios.length === 0, etq.vazios.join(" / "));
    const plane = etq.oficiais.find(o => /PLANEAMENTO/.test(o.celula));
    const opera = etq.oficiais.find(o => /OPERAÇÕES/.test(o.celula));
    t("formato oficial: planeamento tem situação, análise, previsão, objetivo, prioridades e segurança",
      plane && ["Situação","Análise das ZI","Previsão","Objetivo","Prioridades táticas","Segurança das forças"]
        .every(x => plane.linhas.includes(x)), plane ? plane.linhas.join(", ") : "bloco ausente");
    t("formato oficial: operações tem organização do TO e ordens de missão",
      opera && ["Organização do TO","Ordens de missão"].every(x => opera.linhas.includes(x)),
      opera ? opera.linhas.join(", ") : "bloco ausente");
    t("formato oficial: operações não reclama o objetivo nem a segurança",
      opera && !opera.linhas.includes("Objetivo") && !opera.linhas.includes("Segurança das forças"),
      opera ? opera.linhas.join(", ") : "bloco ausente");

    // ── painel do PCO: os quatro núcleos novos na lista ──
    await tirar("p-pco", "pco");
    const sel = await pg.evaluate(() => {
      const s = document.getElementById("pc-f");
      return { n: s.options.length, txt: [...s.options].map(o => o.value),
               grupos: [...s.querySelectorAll("optgroup")].map(g => g.label),
               larg: s.getBoundingClientRect().width };
    });
    ["Núcleo de Especialistas", "Núcleo de Segurança", "Núcleo de Emergência Médica",
     "Núcleo de Apoio Psicológico e Social de Emergência"].forEach(x =>
      t("selector oferece " + x.replace("Núcleo de ", "núcleo "), sel.txt.includes(x)));
    t("selector do PCO com largura utilizável", sel.larg > 200, "largura " + Math.round(sel.larg));
    t("núcleos agrupados por prioridade", sel.grupos.length >= 2, sel.grupos.join(" | "));

    // ── nomear os quatro núcleos e ver a lista pintada ──
    await pg.evaluate(() => {
      ["Núcleo de Especialistas", "Núcleo de Segurança", "Núcleo de Emergência Médica",
       "Núcleo de Apoio Psicológico e Social de Emergência"].forEach((f, i) => {
        pcoObj().funcoes.push({ f, n: "Elemento " + (i + 1), g: gdhAgora() });
      });
      renderPCO();
    });
    await pg.waitForTimeout(350);
    await pg.screenshot({ path: `${OUT}/pco_nucleos_${tema}.png`, fullPage: true });

    const trans = await pg.evaluate(() => {
      const el = [...document.querySelectorAll("#p-pco *")].filter(e => e.children.length === 0 && e.textContent.trim());
      let mau = 0, ex = "";
      for (const e of el) {
        const r = e.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (e.scrollWidth > e.clientWidth + 4 && getComputedStyle(e).overflow === "visible") {
          mau++; if (!ex) ex = e.textContent.trim().slice(0, 40);
        }
      }
      return { mau, ex };
    });
    t("sem texto a transbordar no painel do PCO", trans.mau === 0, trans.mau + " casos, ex: " + trans.ex);

    // ── impressão: o formato oficial ANEPC ──
    await pg.emulateMedia({ media: "print" });
    await pg.waitForTimeout(300);
    await pg.pdf({ path: `${OUT}/pea_impresso_${tema}.pdf`, format: "A4", printBackground: true });
    const impr = await pg.evaluate(() => {
      const v = document.getElementById("pea-view");
      const nao = [...document.querySelectorAll(".no-print")]
        .filter(e => getComputedStyle(e).display !== "none").length;
      return { alt: v.getBoundingClientRect().height, noPrintVisiveis: nao };
    });
    t("elementos .no-print escondidos na impressão", impr.noPrintVisiveis === 0,
      impr.noPrintVisiveis + " visíveis");
    t("PEA mantém conteúdo em modo impressão", impr.alt > 500, "altura " + Math.round(impr.alt));
    await pg.emulateMedia({ media: "screen" });

    t("nenhum erro de JavaScript no arranque e uso", erros.length === 0, erros.slice(0, 3).join(" | "));
    await ctx.close();
  }

  // ── telemóvel, tema escuro ──
  console.log("\n═══ viewport estreita (390 px) ═══");
  const ctxm = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const pm = await ctxm.newPage();
  await pm.goto(FICH, { waitUntil: "load" }); await pm.waitForTimeout(900);
  await pm.evaluate(() => irPara("p-pea"));
  await pm.waitForTimeout(400);
  await pm.screenshot({ path: `${OUT}/pea_movel.png`, fullPage: true });
  const hs = await pm.evaluate(() => ({
    scroll: document.documentElement.scrollWidth, view: document.documentElement.clientWidth,
    ind: document.getElementById("llm-modo").getBoundingClientRect().width }));
  t("sem deslocamento horizontal a 390 px", hs.scroll <= hs.view + 2, hs.scroll + " > " + hs.view);
  t("indicador de modo cabe na largura estreita", hs.ind > 100 && hs.ind <= hs.view, "largura " + Math.round(hs.ind));
  await ctxm.close();

  await b.close();
  console.log("\n" + passou + " passaram, " + falhou + " falharam");
  console.log("capturas em " + OUT);
  process.exit(falhou ? 1 : 0);
})();
