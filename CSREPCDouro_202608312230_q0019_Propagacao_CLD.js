/**
 * q0019 — evidência de que a estimativa corre e alimenta a cadeia de interpretação.
 *
 * Percorre o caso do vale do Douro: matos altos, vento da tarde, declive da quebra, e
 * verifica que a leitura da intensidade sai com o veredicto do Alexander. Fotografa o
 * painel nos dois temas e o caso de recusa acima de 25 °C.
 */
const path = require("path");
const chromium = require("@sparticuz/chromium").default;
const { chromium: pw } = require("playwright-core");

const set = (id, v) => {
  const e = document.getElementById(id);
  e.value = v;
  e.dispatchEvent(new Event("input", { bubbles: true }));
  e.dispatchEvent(new Event("change", { bubbles: true }));
};

(async () => {
  const exec = await chromium.executablePath();
  const b = await pw.launch({ executablePath: exec, args: chromium.args, headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
  p.on("pageerror", e => console.log("  [erro] " + String(e).slice(0, 200)));
  await p.goto("file://" + path.resolve("r0073.html"));
  await p.waitForTimeout(2500);

  const abrir = async () => p.evaluate(() => {
    let n = document.getElementById("pr-saida");
    while (n && n !== document.body) {
      if (n.style && n.style.display === "none") n.style.display = "";
      if (n.classList && n.classList.contains("pane")) n.classList.add("on");
      n = n.parentElement;
    }
  });
  await abrir();

  const preencher = async (modelo, alt, decl, u10, hcm) => p.evaluate(
    ({ modelo, alt, decl, u10, hcm, setSrc }) => {
      const set = eval("(" + setSrc + ")");
      set("pr-modelo", modelo);
      if (alt !== null) set("pr-alt", alt);
      set("pr-decl", decl); set("pr-u10", u10); set("pr-hcm", hcm);
      document.getElementById("pr-calc").click();
      return document.getElementById("pr-saida").textContent.slice(0, 400);
    }, { modelo, alt, decl, u10, hcm, setSrc: set.toString() });

  console.log("— matos altos, 27 km/h, 35 %, HCM 10 % —");
  console.log("  " + await preencher("V-MAa", "1,5", "35", "27", "10"));
  await p.waitForTimeout(400);

  const cadeia = await p.evaluate(() => {
    document.getElementById("pr-usar").click();
    return { r: document.getElementById("fg-r").value,
             w: document.getElementById("fg-w").value,
             leitura: document.getElementById("fg-leitura").textContent.slice(0, 460) };
  });
  console.log("  passado: R=" + cadeia.r + " m/h · w=" + cadeia.w + " t/ha");
  console.log("  cadeia: " + cadeia.leitura);
  await p.waitForTimeout(400);
  await abrir();

  const painel = await p.evaluateHandle(() => document.getElementById("pr-saida").closest(".sub"));
  await painel.asElement().scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await painel.asElement().screenshot({ path: "qa0019_propagacao_escuro.png" });
  console.log("gravado qa0019_propagacao_escuro.png");

  console.log("— eucaliptal: sem motor português —");
  console.log("  " + (await preencher("M-EUC", null, "35", "27", "10")).slice(0, 260));

  console.log("— recusa da humidade acima de 25 °C —");
  const recusa = await p.evaluate(() => {
    SERIE = [{ d: "31AGO", h: 16, t: 34, rh: 21, wd: 225, ws: 27, pr: 0 }];
    document.getElementById("pr-hr").value = "21";
    document.getElementById("pr-dias").value = "9";
    document.getElementById("pr-hcm-calc").click();
    return document.getElementById("pr-saida").textContent.slice(0, 300);
  });
  console.log("  " + recusa);
  await p.waitForTimeout(300);
  await abrir();
  const cx = await p.evaluateHandle(() => document.getElementById("pr-saida").closest(".sub"));
  await cx.asElement().scrollIntoViewIfNeeded();
  await p.waitForTimeout(200);
  await cx.asElement().screenshot({ path: "qa0019_recusa.png" });
  console.log("gravado qa0019_recusa.png");

  await p.evaluate(() => {
    const b = document.getElementById("b-tema");
    if (b) b.click(); else document.documentElement.setAttribute("data-tema", "claro");
  });
  await p.waitForTimeout(700);
  await abrir();
  await preencher("V-MAa", "1,5", "35", "27", "10");
  await p.waitForTimeout(400);
  await abrir();
  const claro = await p.evaluateHandle(() => document.getElementById("pr-saida").closest(".sub"));
  await claro.asElement().scrollIntoViewIfNeeded();
  await p.waitForTimeout(200);
  await claro.asElement().screenshot({ path: "qa0019_propagacao_claro.png" });
  console.log("gravado qa0019_propagacao_claro.png");

  await b.close();
})().catch(e => { console.error(String(e).slice(0, 600)); process.exit(1); });
