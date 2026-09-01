/**
 * q0018 — evidência de que a folha calibrada aparece no mapa, e no sítio.
 *
 * Fabrica uma imagem com uma quadrícula conhecida, entrega-a ao campo como se fosse um
 * ficheiro escolhido, calibra-a com duas coordenadas do vale do Douro, e fotografa o
 * painel e o mapa. Se a folha aparecer torta, esbatida ou fora do enquadramento, vê-se.
 */
const path = require("path");
const chromium = require("@sparticuz/chromium").default;
const { chromium: pw } = require("playwright-core");

(async () => {
  const exec = await chromium.executablePath();
  const b = await pw.launch({ executablePath: exec, args: chromium.args, headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
  p.on("console", m => { if (m.type() === "error") console.log("  [console] " + m.text().slice(0, 160)); });
  await p.goto("file://" + path.resolve("r0072.html"));
  await p.waitForTimeout(2500);

  const abrir = async () => p.evaluate(() => {
    let n = document.getElementById("fl-lista");
    while (n && n !== document.body) {
      if (n.style && n.style.display === "none") n.style.display = "";
      if (n.classList && n.classList.contains("pane")) n.classList.add("on");
      n = n.parentElement;
    }
  });
  await abrir();

  /* ---- fabricar a imagem e entregá-la ao campo ---- */
  const carregou = await p.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 1200; c.height = 800;
    const g = c.getContext("2d");
    g.fillStyle = "#efe7d6"; g.fillRect(0, 0, 1200, 800);
    g.strokeStyle = "#7a6a4a"; g.lineWidth = 1;
    for (let x = 0; x <= 1200; x += 100) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 800); g.stroke(); }
    for (let y = 0; y <= 800; y += 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(1200, y); g.stroke(); }
    g.fillStyle = "#8a3a2a"; g.font = "bold 34px sans-serif";
    g.fillText("FOLHA DE ENSAIO — quadrícula de 100 px", 40, 60);
    g.fillStyle = "#1d4d2b";
    [[200, 200], [1000, 600]].forEach(([x, y], i) => {
      g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill();
      g.font = "bold 26px sans-serif"; g.fillText("P" + (i + 1), x + 18, y + 8);
    });
    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    const f = new File([blob], "ensaio_cabecaboa.png", { type: "image/png" });
    const dt = new DataTransfer(); dt.items.add(f);
    const inp = document.getElementById("fl-f");
    inp.files = dt.files;
    inp.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  });
  console.log("imagem entregue: " + carregou);
  await p.waitForTimeout(1500);

  /* ---- calibrar: clicar os dois pontos e escrever as coordenadas ---- */
  await p.evaluate(() => {
    const b = document.querySelector("[data-fl-cal]");
    if (b) b.click();
  });
  await p.waitForTimeout(600);
  await abrir();

  const cal = await p.evaluate(() => {
    const tela = document.getElementById("fl-tela");
    const im = tela.querySelector("img");
    if (!im) return "sem imagem na tela de calibração";
    const r = im.getBoundingClientRect();
    const clicar = (u, v) => {
      const ev = new MouseEvent("click", { bubbles: true,
        clientX: r.left + r.width * u / 1200, clientY: r.top + r.height * v / 800 });
      tela.dispatchEvent(ev);
    };
    document.getElementById("fl-alvo").value = "0";
    clicar(200, 200);
    clicar(1000, 600);
    const escrever = (id, t) => {
      const e = document.getElementById(id);
      e.value = t; e.dispatchEvent(new Event("change", { bubbles: true }));
    };
    escrever("fl-c1", "41.2400 -7.5200");
    escrever("fl-c2", "41.20401 -7.42447");
    document.getElementById("fl-cal-ok").click();
    return document.getElementById("fl-cal-info").textContent.slice(0, 220);
  });
  console.log("aferição: " + cal);
  await p.waitForTimeout(1800);
  await abrir();

  const painel = await p.evaluateHandle(() => document.getElementById("fl-cal"));
  await painel.asElement().scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await painel.asElement().screenshot({ path: "qa0018_calibracao.png" });
  console.log("gravado qa0018_calibracao.png");

  /* ---- o mapa ---- */
  const estado = await p.evaluate(async () => {
    try { pintarMapaCartao(); await pintarMapa(); } catch (e) { return "erro: " + e.message; }
    const fl = document.querySelector(".mp-fl img");
    return fl ? "folha desenhada · " + fl.style.transform.slice(0, 90) : "nenhuma folha na camada";
  });
  console.log("mapa: " + estado);
  await p.waitForTimeout(900);
  const info = await p.evaluate(()=>document.getElementById("mapa-info").textContent.slice(0,300));
  console.log("rodapé: " + info);
  const cxm = await p.$("#mapa-box");
  if (cxm) {
    await cxm.scrollIntoViewIfNeeded();
    await p.waitForTimeout(300);
    await cxm.screenshot({ path: "qa0018_mapa.png" });
    console.log("gravado qa0018_mapa.png");
  }

  await b.close();
})().catch(e => { console.error(String(e).slice(0, 500)); process.exit(1); });
