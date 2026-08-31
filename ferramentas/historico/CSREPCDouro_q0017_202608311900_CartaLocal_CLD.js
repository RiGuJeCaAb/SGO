/**
 * q0017 — evidência visual do painel «Carta pré-descarregada» depois do p0017.
 * Abre a app em file://, salta para o cartão do mapa e fotografa o painel nos dois temas.
 */
const path = require("path");
const chromium = require("@sparticuz/chromium").default;
const { chromium: pw } = require("playwright-core");

(async () => {
  const exec = await chromium.executablePath();
  const b = await pw.launch({ executablePath: exec, args: chromium.args, headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto("file://" + path.resolve("r0071.html"));
  await p.waitForTimeout(2500);

  for (const tema of ["escuro", "claro"]) {
    if (tema === "claro") {
      await p.evaluate(() => {
        const b = document.getElementById("b-tema");
        if (b) b.click(); else document.documentElement.setAttribute("data-tema", "claro");
      });
      await p.waitForTimeout(700);
    }
    /* O cartão do mapa só abre quando há o que enquadrar, e o painel vive numa aba
       inativa. Abre-se à força: o que se quer fotografar é o painel, não o percurso. */
    const painel = await p.evaluateHandle(() => {
      const c = document.getElementById("carta-fich");
      let n = c;
      while (n && n !== document.body) {
        if (n.style && n.style.display === "none") n.style.display = "";
        if (n.classList && n.classList.contains("pane")) n.classList.add("on");
        n = n.parentElement;
      }
      return c.closest(".sub");
    });
    await painel.asElement().scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    const f = "qa0017_cartalocal_" + tema + ".png";
    await painel.asElement().screenshot({ path: f });
    console.log("gravado " + f);
  }
  await b.close();
})().catch(e => { console.error(String(e).slice(0, 400)); process.exit(1); });
