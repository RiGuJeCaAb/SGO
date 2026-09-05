/**
 * #004 · t0021 — A chave do arquivo de mosaicos não sabe de que carta veio o mosaico.
 *
 * VERMELHO PRIMEIRO. Este guião falha contra a r0093 e é essa a razão de existir.
 *
 * `chaveMosaico(z,x,y)` devolve `"m/z/x/y"`, com o comentário «Uma só, seja qual for a sua
 * proveniência». É essa a frase que está errada: a proveniência é precisamente o que
 * distingue dois mosaicos que partilham z, x e y — e eles partilham-nos sempre, porque a
 * numeração dos quadrados é a mesma em todas as grelhas. Foi isso que o p0017 estabeleceu
 * para a pasta pré-descarregada, e o arquivo de rede voltou a abrir o mesmo buraco.
 *
 * Três consequências, todas demonstradas abaixo:
 *
 *   1. declarar um serviço novo **não** limpa o arquivo do anterior — só o `retirarCarta`
 *      o faz — pelo que o mapa serve mosaicos do serviço antigo debaixo da atribuição do
 *      novo;
 *   2. se as duas cartas estiverem em grelhas diferentes, os mosaicos do primeiro serviço
 *      são desenhados com a aritmética do segundo, e ficam fora do sítio;
 *   3. o PEA impresso leva a atribuição de um serviço sobre os pixéis de outro, o que num
 *      documento aprovado pelo COS é declaração falsa de origem, não é imprecisão.
 *
 * Corre: node '#004_..._t0021_ChaveMosaicos_CLD.js' <build.html>
 */
const path = require("path");
const chromium = require("@sparticuz/chromium").default;
const { chromium: pw } = require("playwright-core");

const ficheiro = process.argv[2] || "r0093.html";

let passou = 0, falhou = 0;
function t(nome, cond, det){
  if(cond){ passou++; console.log("  ok   " + nome); }
  else { falhou++; console.log("  FALHA " + nome + (det ? "  → " + det : "")); }
}

(async () => {
  const exec = await chromium.executablePath();
  const b = await pw.launch({ executablePath: exec, args: chromium.args, headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on("pageerror", e => console.log("  [erro] " + String(e).slice(0, 200)));
  await p.goto("file://" + path.resolve(ficheiro));
  await p.waitForTimeout(2500);

  console.log("— a chave, lida directamente —");
  {
    const k = await p.evaluate(() => chaveMosaico(10, 500, 380));
    console.log("    chaveMosaico(10,500,380) = " + JSON.stringify(k));
    t("a chave distingue a grelha", /pttm06|mercator|3763|3857/.test(k),
      "duas grelhas numeram os quadrados do mesmo modo; sem a grelha na chave, colidem");
    t("a chave distingue o serviço", k.length > 12 && !/^m\/\d+\/\d+\/\d+$/.test(k),
      "dois serviços diferentes escrevem no mesmo sítio do arquivo");
  }

  console.log("\n— a colisão, demonstrada com bytes —");
  {
    const r = await p.evaluate(async () => {
      const bytes = n => new Blob([new Uint8Array(Array(64).fill(n))], { type:"image/png" });
      const ler = async bl => { const a = new Uint8Array(await bl.arrayBuffer()); return a[0]; };

      /* Serviço A: OSM, Web Mercator. Um quadrado do Douro entra no arquivo. */
      const a = await guardarCarta("https://a.exemplo.pt/{z}/{x}/{y}.png",
        "Serviço A, Web Mercator", "https://a.exemplo.pt/termos", 19);
      if(!a.ok) return { erro: "guardarCarta A: " + a.motivo };
      await guardarMosaico(10, 500, 380, bytes(65));   /* 'A' */

      /* Serviço B: outro fornecedor, outra atribuição. Declarado sem retirar o anterior,
         que é o que qualquer pessoa faz — o campo está lá e escreve-se por cima. */
      const c = await guardarCarta("https://b.exemplo.pt/{z}/{x}/{y}.png",
        "Serviço B, cartografia oficial", "https://b.exemplo.pt/termos", 19);
      if(!c.ok) return { erro: "guardarCarta B: " + c.motivo };

      const servido = await mosaicoBlob(10, 500, 380);
      return {
        atribuicaoActual: CARTA.atrib,
        urlActual: CARTA.u,
        primeiroByte: servido? await ler(servido) : null,
        chave: chaveMosaico(10, 500, 380)
      };
    });

    if(r.erro){ console.log("  [preparação falhou] " + r.erro); }
    else {
      console.log("    carta declarada agora: " + r.atribuicaoActual);
      console.log("    mosaico servido: " + (r.primeiroByte === 65 ? "o do Serviço A"
        : r.primeiroByte === null ? "nenhum" : "byte " + r.primeiroByte));
      t("declarar carta nova não serve mosaicos da carta antiga", r.primeiroByte !== 65,
        "o mapa mostra o Serviço A com a atribuição do Serviço B; num PEA impresso isso é "
        + "declaração falsa de origem");
    }
  }

  console.log("\n— e a pasta pré-descarregada partilha o mesmo espaço —");
  {
    const r = await p.evaluate(async () => {
      const k = chaveMosaico(12, 2010, 1520);
      /* A carta local declara a sua grelha desde o p0017. A chave não a leva. */
      await declararCartaLocal("pttm06", "Ortos DGT, PT-TM06");
      const kLocal = chaveMosaico(12, 2010, 1520);
      return { igual: k === kLocal, k, grelhaDeclarada: CARTA_LOCAL? CARTA_LOCAL.grelha : null };
    });
    console.log("    grelha declarada para a carta local: " + r.grelhaDeclarada);
    t("a chave muda quando a grelha declarada muda", !r.igual,
      "o p0017 obrigou a declarar a grelha da pasta; a chave continua a ignorá-la, "
      + "e uma pasta PT-TM06 escreve por cima de mosaicos Web Mercator já arquivados");
  }

  console.log("\n— o que já está bem e não deve regredir —");
  {
    const r = await p.evaluate(async () => {
      await retirarCarta();
      const depois = await mosaicoBlob(10, 500, 380);
      return { limpou: depois === null };
    });
    t("retirar a carta esvazia o arquivo", r.limpou,
      "esta parte está certa: o `retirarCarta` chama `esquecerMosaicos`");
  }

  await b.close();
  console.log("\n" + passou + " passaram, " + falhou + " falharam");
  process.exit(falhou ? 1 : 0);
})().catch(e => { console.error(String(e).slice(0, 600)); process.exit(1); });
