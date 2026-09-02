/**
 * t0001 · ramo #002 — Folhas de carta calibradas
 * ============================================================================
 * CSREPC Douro · Estação PEA
 *
 * Guião de teste executável. Não é um patch. Não contém âncoras de texto, não
 * altera o ficheiro e não diz como implementar — diz apenas o que tem de ser
 * verdade quando estiver implementado.
 *
 * USO
 *   node "#002_CSREPCDouro_202609021600_t0001_FolhasCalibradas_CLD.js" r0083.html
 *
 * COMO CARREGA
 *   Lê o HTML compilado, extrai o maior bloco <script>, acrescenta-lhe em
 *   memória um epílogo que exporta os símbolos de topo (as declarações `const`
 *   não se colam ao objeto global num `vm`, as `function` sim), e corre tudo
 *   num contexto com um DOM simulado. O ficheiro em disco não é tocado.
 *
 * COR ESPERADA NO r0083
 *   VERMELHO nas 44 asserções da funcionalidade ausente.
 *   VERDE    nas 9 que verificam alicerces que o r0083 já tem — projeção
 *            PT-TM06, grelha PTTM_06, abertura da base sem versão fixa.
 *            Se alguma destas estiver vermelha, o problema é anterior às
 *            folhas e tem de ser resolvido primeiro.
 *
 * PROVENIÊNCIA
 *   Cada asserção com limiar numérico traz a fonte na própria linha. Quatro
 *   origens, todas declaradas:
 *     [EPSG]  Registo EPSG, código 3763 — ETRS89 / Portugal TM06.
 *             Falso Este 0, falso Norte 0, fator de escala 1, origem em
 *             39° 40′ 05,73″ N / 8° 07′ 59,19″ W, elipsoide GRS80.
 *     [DGT-W] GetCapabilities WMTS da DGT, conjunto PTTM_06, capturado em
 *             31AGO26 de cartografia.dgterritorio.gov.pt/ortos2018/service.
 *     [DGT-M] GetCapabilities WMS 1.3.0 da altimetria da DGT, camada
 *             Curva_de_nivel, capturado em 31AGO26 de geo2.dgterritorio.gov.pt.
 *     [ESRI]  Especificação do ficheiro de referenciação (world file):
 *             seis linhas, ordem A, D, B, E, C, F; C e F designam o **centro**
 *             do pixel superior esquerdo.
 *     [IDEM]  Coerência interna — ida e volta, sem verdade externa. Declarado
 *             como tal: não deteta erro sistemático, só incoerência.
 *
 * SUPERFÍCIE PÚBLICA QUE ESTE GUIÃO PRESSUPÕE
 *   Não afirma estrutura interna. Afirma que estes nomes existem e o que fazem:
 *
 *     lerFicheiroReferenciacao(texto)      -> {A,D,B,E,C,F} | null
 *     calibrarPorDoisPontos(p1, p2)        -> {A,D,B,E,C,F} | null
 *                                             p = {px,py,E,N}
 *     folhaCalibrada(desc)                 -> folha | null
 *         desc  = {id, nome, largura, altura, mundo:{A,D,B,E,C,F},
 *                  grelha:"pttm06"|"mercator", proveniencia, pontos}
 *         folha = { paraMundo(px,py) -> {E,N}
 *                   paraPixel(E,N)   -> {px,py}
 *                   dentro(px,py)    -> boolean
 *                   ...os campos de desc }
 *     FOLHAS                               -> Array das folhas colocadas
 *     IDB_LOJAS                            -> deve conter ["folhas",{keyPath:"id"}]
 *
 *   Se preferires outros nomes, muda-os aqui num sítio só — o bloco SUPERFICIE
 *   logo abaixo. O que não se negoceia é o comportamento.
 * ============================================================================
 */

"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");

/* ---------------------------------------------------------------- SUPERFICIE
   O único sítio onde este guião nomeia coisas. Alterar aqui se a superfície
   pública do r0084 usar outros nomes. */
const SUPERFICIE = {
  lerWorldFile : "lerFicheiroReferenciacao",
  calibrar2p   : "calibrarPorDoisPontos",
  folha        : "folhaCalibrada",
  coleccao     : "FOLHAS",
  lojas        : "IDB_LOJAS",
  criarLojas   : "criarLojasIDB",
  abrirIDB     : "abrirIDB",
  grelhas      : "GRELHAS",
  paraTM06     : "paraTM06",
  deTM06       : "deTM06",
  grelhaAtual  : "grelhaAtual",
  retrato      : "retratoDoFogo"
};

/* ------------------------------------------------------------------- DOM nu
   Suficiente para o ficheiro carregar até ao fim sem tocar em rede nem em
   armazenamento. Nada aqui participa nas asserções. */
function noh(tag){
  const o = {
    tagName:(tag||"div").toUpperCase(), nodeName:(tag||"div").toUpperCase(),
    style:new Proxy({},{get:()=>"",set:()=>true}), dataset:{},
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    children:[], childNodes:[], attributes:[], value:"", textContent:"",
    innerHTML:"", innerText:"", checked:false, disabled:false, files:[],
    options:[], selectedIndex:-1, width:0, height:0,
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){return true;},
    appendChild(c){return c;}, removeChild(c){return c;}, insertBefore(c){return c;},
    replaceChildren(){}, remove(){}, click(){}, focus(){}, blur(){},
    setAttribute(){}, getAttribute:()=>null, removeAttribute(){}, hasAttribute:()=>false,
    querySelector:()=>noh("div"), querySelectorAll:()=>[], closest:()=>null,
    getBoundingClientRect:()=>({top:0,left:0,width:800,height:600,right:800,bottom:600}),
    getContext:()=>({ save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},
      stroke(){},fill(){},arc(){},rect(){},clearRect(){},fillRect(){},drawImage(){},
      setTransform(){},transform(){},translate(){},scale(){},rotate(){},closePath(){},
      fillText(){},strokeText(){},measureText:()=>({width:10}),clip(){},
      createLinearGradient:()=>({addColorStop(){}}),putImageData(){},
      getImageData:()=>({data:new Uint8ClampedArray(4)}) }),
    toDataURL:()=>"data:,", insertAdjacentHTML(){}, scrollIntoView(){},
    cloneNode(){return noh(tag);}
  };
  return new Proxy(o,{
    get:(t,k)=> (k in t ? t[k] : (typeof k==="string" && /^on/.test(k) ? null : undefined)),
    set:(t,k,v)=>{ t[k]=v; return true; }
  });
}

function contextoNu(){
  const ctx = { console, Math, Date, JSON, Promise, Object, Array, String, Number,
    Boolean, RegExp, Error, TypeError, RangeError, Map, Set, WeakMap, WeakSet, Symbol,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    encodeURI, decodeURI, URL, URLSearchParams, TextEncoder, TextDecoder,
    Uint8Array, Uint8ClampedArray, Int8Array, Int32Array, Float32Array, Float64Array,
    ArrayBuffer, DataView, Intl,
    setTimeout:()=>0, clearTimeout(){}, setInterval:()=>0, clearInterval(){},
    queueMicrotask:f=>f, requestAnimationFrame:()=>0, cancelAnimationFrame(){},
    fetch:()=>Promise.reject(new Error("sem rede no guião de teste")),
    alert(){}, confirm:()=>false, prompt:()=>null,
    atob:s=>Buffer.from(s,"base64").toString("binary"),
    btoa:s=>Buffer.from(s,"binary").toString("base64"),
    crypto:{ getRandomValues:a=>a, randomUUID:()=>"00000000-0000-4000-8000-000000000000",
             subtle:{ digest:()=>Promise.resolve(new ArrayBuffer(32)) } },
    performance:{ now:()=>0 },
    indexedDB:undefined, DOMParser:undefined,
    localStorage:{ _m:{}, getItem(k){return this._m[k]??null;},
      setItem(k,v){this._m[k]=String(v);}, removeItem(k){delete this._m[k];},
      clear(){this._m={};}, key:()=>null, length:0 },
    sessionStorage:{ getItem:()=>null, setItem(){}, removeItem(){}, clear(){} },
    navigator:{ userAgent:"node", language:"pt-PT", languages:["pt-PT"], onLine:false,
                clipboard:{ writeText:()=>Promise.resolve() } },
    location:{ href:"file:///pea.html", protocol:"file:", search:"", hash:"", pathname:"/pea.html" },
    history:{ pushState(){}, replaceState(){} },
    matchMedia:()=>({ matches:false, addEventListener(){}, addListener(){} }),
    Image:function(){ return noh("img"); },
    FileReader:function(){ return { readAsText(){}, readAsDataURL(){}, readAsArrayBuffer(){},
                                    addEventListener(){}, result:null }; },
    Blob:function(){ return {}; }, File:function(){ return {}; },
    FormData:function(){ return { append(){} }; },
    Element:function(){}, HTMLElement:function(){}, Node:function(){},
    Event:function(){}, CustomEvent:function(){}, MutationObserver:function(){
      return { observe(){}, disconnect(){} }; },
    ResizeObserver:function(){ return { observe(){}, disconnect(){} }; }
  };
  const doc = noh("document");
  doc.documentElement = noh("html"); doc.body = noh("body"); doc.head = noh("head");
  doc.createElement = t=>noh(t); doc.createElementNS = (n,t)=>noh(t);
  doc.createTextNode = ()=>noh("#text"); doc.createDocumentFragment = ()=>noh("#fragment");
  doc.getElementById = ()=>noh("div"); doc.getElementsByClassName = ()=>[];
  doc.getElementsByTagName = ()=>[]; doc.getElementsByName = ()=>[];
  doc.querySelector = ()=>noh("div"); doc.querySelectorAll = ()=>[];
  doc.readyState = "complete"; doc.title = ""; doc.cookie = "";
  ctx.document = doc;
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; ctx.top = ctx; ctx.parent = ctx;
  ctx.URL.createObjectURL = ()=>"blob:teste"; ctx.URL.revokeObjectURL = ()=>{};
  return ctx;
}

/* --------------------------------------------------------------- Carregar */
function carregar(ficheiro){
  const html = fs.readFileSync(ficheiro, "utf8");
  const blocos = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  if(!blocos.length) throw new Error("nenhum bloco <script> no ficheiro");
  let js = blocos.sort((a,b)=>b.length-a.length)[0];

  /* Epílogo. As declarações `const` de topo ficam no âmbito do script e não no
     objeto global — sem isto, metade da superfície é invisível. O `typeof`
     evita que a ausência de um símbolo rebente o carregamento inteiro: um nome
     em falta tem de dar uma asserção vermelha, não um ficheiro que não corre. */
  const nomes = Object.values(SUPERFICIE);
  js += "\n;globalThis.__PEA = {" +
        nomes.map(n=>`${JSON.stringify(n)}:(typeof ${n}!=="undefined"?${n}:undefined)`).join(",") +
        "};";

  const ctx = contextoNu();
  vm.createContext(ctx);
  let erroCarga = null;
  try { vm.runInContext(js, ctx, { filename:path.basename(ficheiro), timeout:20000 }); }
  catch(e){ erroCarga = e; }
  return { ctx, api:(ctx.__PEA||{}), erroCarga };
}

/* ------------------------------------------------------------ Contabilidade */
const R = [];
function t(id, grupo, cor, desc, fn){
  let ok=false, nota="";
  try {
    const r = fn();
    if(r === true){ ok = true; }
    else if(r && typeof r === "object"){ ok = !!r.ok; nota = r.nota||""; }
    else { ok = false; nota = "asserção devolveu "+JSON.stringify(r); }
  } catch(e){ ok = false; nota = "excepção: " + (e && e.message ? e.message : String(e)); }
  R.push({ id, grupo, cor, desc, ok, nota });
}
const existe = v => typeof v !== "undefined" && v !== null;
function perto(a, b, tol){
  if(typeof a !== "number" || !isFinite(a)) return { ok:false, nota:"obtido não é número finito: "+a };
  const d = Math.abs(a-b);
  return { ok: d <= tol, nota: `esperado ${b} ± ${tol} · obtido ${a} · desvio ${d.toExponential(3)}` };
}
const ausente = nome => ({ ok:false, nota:`ausente: ${nome}()` });

/* ============================================================== EXECUÇÃO === */
const alvo = process.argv[2];
if(!alvo){ console.error("uso: node <este ficheiro> <caminho do HTML compilado>"); process.exit(2); }
const { ctx, api, erroCarga } = carregar(alvo);

const lerWF   = api[SUPERFICIE.lerWorldFile];
const cal2p   = api[SUPERFICIE.calibrar2p];
const mkFolha = api[SUPERFICIE.folha];
const FOLHAS  = api[SUPERFICIE.coleccao];
const LOJAS   = api[SUPERFICIE.lojas];
const criarL  = api[SUPERFICIE.criarLojas];
const GRELHAS = api[SUPERFICIE.grelhas];
const paraTM  = api[SUPERFICIE.paraTM06];
const deTM    = api[SUPERFICIE.deTM06];
const retrato = api[SUPERFICIE.retrato];

/* Dados de ensaio, fixos e à vista. Folha de 4000×3000 px a 2,5 m/px, canto
   superior esquerdo no Douro, sem rotação. */
const WF_TEXTO = ["2.5","0.0","0.0","-2.5","30000.0","185000.0"].join("\n") + "\n";
const WF_ESPERADO = { A:2.5, D:0.0, B:0.0, E:-2.5, C:30000.0, F:185000.0 };
const FOLHA_LARG = 4000, FOLHA_ALT = 3000;

/* Origem da projeção, em graus decimais. */
const LAT0 = 39 + 40/60 + 5.73/3600;          // fonte: [EPSG] 3763 · 39° 40′ 05,73″ N
const LON0 = -(8 + 7/60 + 59.19/3600);        // fonte: [EPSG] 3763 · 8° 07′ 59,19″ W

/* ------------------------------------------------------------------ carga */
t("L00","Carga","VERDE","O ficheiro carrega até ao fim sem excepção", ()=>
  erroCarga ? { ok:false, nota:"parou em: "+erroCarga.message } : true);

/* ===================== A · Ficheiro de referenciação (9) ================== */
t("A01","A · World file","VERMELHO","lerFicheiroReferenciacao existe", ()=>
  existe(lerWF) ? true : ausente(SUPERFICIE.lerWorldFile));

t("A02","A · World file","VERMELHO","Seis linhas lidas na ordem A, D, B, E, C, F", ()=>{ // fonte: [ESRI] ordem canónica do world file
  if(!existe(lerWF)) return ausente(SUPERFICIE.lerWorldFile);
  const w = lerWF(WF_TEXTO);
  if(!w) return { ok:false, nota:"devolveu null para um ficheiro válido" };
  const maus = Object.keys(WF_ESPERADO).filter(k=>Math.abs(w[k]-WF_ESPERADO[k])>1e-9);
  return { ok:maus.length===0, nota:maus.length? "divergem: "+maus.join(",")+" · obtido "+JSON.stringify(w) : "" };
});

t("A03","A · World file","VERMELHO","A é a dimensão do pixel em Este: 2,5 m", ()=>{ // fonte: [ESRI] linha 1 = tamanho do pixel em x
  if(!existe(lerWF)) return ausente(SUPERFICIE.lerWorldFile);
  const w = lerWF(WF_TEXTO); return w ? perto(w.A, 2.5, 1e-9) : { ok:false, nota:"null" };
});

t("A04","A · World file","VERMELHO","E é negativo: a imagem cresce para sul, o Norte decresce", ()=>{ // fonte: [ESRI] linha 4 = tamanho do pixel em y, negativo em imagem de topo para baixo
  if(!existe(lerWF)) return ausente(SUPERFICIE.lerWorldFile);
  const w = lerWF(WF_TEXTO); return w ? perto(w.E, -2.5, 1e-9) : { ok:false, nota:"null" };
});

t("A05","A · World file","VERMELHO","C e F situam o CENTRO do pixel superior esquerdo, não o canto", ()=>{ // fonte: [ESRI] C,F = coordenadas do centro do pixel (0,0)
  if(!existe(lerWF) || !existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const f = mkFolha({ id:"a05", nome:"ensaio", largura:FOLHA_LARG, altura:FOLHA_ALT,
                      mundo:lerWF(WF_TEXTO), grelha:"pttm06", proveniencia:"ensaio t0001", pontos:0 });
  if(!f) return { ok:false, nota:"folhaCalibrada devolveu null" };
  const m = f.paraMundo(0,0);
  const dE = perto(m.E, 30000.0, 1e-6), dN = perto(m.N, 185000.0, 1e-6);   // esperado: E=30000,000 N=185000,000
  return { ok:dE.ok&&dN.ok, nota:"E: "+dE.nota+" | N: "+dN.nota };
});

t("A06","A · World file","VERMELHO","Sem rotação, D e B são exactamente zero", ()=>{ // fonte: [ESRI] linhas 2 e 3 = rotação/inclinação
  if(!existe(lerWF)) return ausente(SUPERFICIE.lerWorldFile);
  const w = lerWF(WF_TEXTO);
  return w ? { ok: w.D===0 && w.B===0, nota:`D=${w.D} B=${w.B}` } : { ok:false, nota:"null" };
});

t("A07","A · World file","VERMELHO","Ficheiro com cinco linhas é recusado", ()=>{ // fonte: [ESRI] o world file tem exactamente seis linhas
  if(!existe(lerWF)) return ausente(SUPERFICIE.lerWorldFile);
  const r = lerWF("2.5\n0\n0\n-2.5\n30000\n");
  return { ok:r===null, nota:"obtido "+JSON.stringify(r) };
});

t("A08","A · World file","VERMELHO","Linha não numérica é recusada, sem lançar", ()=>{ // fonte: [ESRI] as seis linhas são números
  if(!existe(lerWF)) return ausente(SUPERFICIE.lerWorldFile);
  const r = lerWF("2.5\n0\n0\n-2.5\nnorte\n185000\n");
  return { ok:r===null, nota:"obtido "+JSON.stringify(r) };
});

t("A09","A · World file","VERMELHO","Vírgula decimal é recusada, não interpretada", ()=>{ // fonte: [ESRI] separador decimal é o ponto; aceitar vírgula torna «2,5» ambíguo com lista
  if(!existe(lerWF)) return ausente(SUPERFICIE.lerWorldFile);
  const r = lerWF("2,5\n0\n0\n-2,5\n30000\n185000\n");
  return { ok:r===null, nota:"obtido "+JSON.stringify(r)+" — aceitar vírgula silenciosamente coloca a folha a 2 m em vez de 2,5" };
});

/* ========================= B · Transformação afim (8) ==================== */
function folhaEnsaio(id, mundo){
  if(!existe(mkFolha)) return null;
  return mkFolha({ id, nome:"ensaio", largura:FOLHA_LARG, altura:FOLHA_ALT,
                   mundo: mundo||WF_ESPERADO, grelha:"pttm06",
                   proveniencia:"ensaio t0001 ramo #002", pontos:0 });
}

t("B01","B · Afim","VERMELHO","folhaCalibrada existe e devolve objeto com paraMundo, paraPixel e dentro", ()=>{
  if(!existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const f = folhaEnsaio("b01");
  if(!f) return { ok:false, nota:"devolveu null para descrição válida" };
  const faltam = ["paraMundo","paraPixel","dentro"].filter(k=>typeof f[k]!=="function");
  return { ok:faltam.length===0, nota:faltam.length? "faltam métodos: "+faltam.join(", ") : "" };
});

t("B02","B · Afim","VERMELHO","paraMundo(1,0) avança A em Este e nada em Norte", ()=>{ // esperado: E=30002,5 N=185000,0 · fonte: [ESRI] E = A·px + B·py + C
  const f = folhaEnsaio("b02"); if(!f) return ausente(SUPERFICIE.folha);
  const m = f.paraMundo(1,0);
  const a = perto(m.E, 30002.5, 1e-6), b = perto(m.N, 185000.0, 1e-6);
  return { ok:a.ok&&b.ok, nota:"E: "+a.nota+" | N: "+b.nota };
});

t("B03","B · Afim","VERMELHO","paraMundo(0,1) desce 2,5 m em Norte e nada em Este", ()=>{ // esperado: E=30000,0 N=184997,5 · fonte: [ESRI] N = D·px + E·py + F
  const f = folhaEnsaio("b03"); if(!f) return ausente(SUPERFICIE.folha);
  const m = f.paraMundo(0,1);
  const a = perto(m.E, 30000.0, 1e-6), b = perto(m.N, 184997.5, 1e-6);
  return { ok:a.ok&&b.ok, nota:"E: "+a.nota+" | N: "+b.nota };
});

t("B04","B · Afim","VERMELHO","Canto inferior direito da folha 4000×3000 a 2,5 m/px", ()=>{ // esperado: E=30000+3999·2,5=39997,5 N=185000−2999·2,5=177502,5
  const f = folhaEnsaio("b04"); if(!f) return ausente(SUPERFICIE.folha);
  const m = f.paraMundo(FOLHA_LARG-1, FOLHA_ALT-1);
  const a = perto(m.E, 39997.5, 1e-6), b = perto(m.N, 177502.5, 1e-6);
  return { ok:a.ok&&b.ok, nota:"E: "+a.nota+" | N: "+b.nota };
});

t("B05","B · Afim","VERMELHO","paraPixel desfaz paraMundo em nove pontos da folha", ()=>{ // tolerância 1e-6 px · fonte: [IDEM] coerência interna
  const f = folhaEnsaio("b05"); if(!f) return ausente(SUPERFICIE.folha);
  const amostra=[[0,0],[1,1],[2000,1500],[3999,2999],[0,2999],[3999,0],[123,456],[2500,10],[7,2900]];
  let pior=0, ondePior=null;
  for(const [px,py] of amostra){
    const m=f.paraMundo(px,py), v=f.paraPixel(m.E,m.N);
    const d=Math.max(Math.abs(v.px-px),Math.abs(v.py-py));
    if(d>pior){ pior=d; ondePior=[px,py]; }
  }
  return { ok:pior<=1e-6, nota:`pior desvio ${pior.toExponential(3)} px em (${ondePior})` };
});

t("B06","B · Afim","VERMELHO","Com rotação de 30°, a ida e volta mantém-se exacta", ()=>{ // A=2,5cos30=2,165064 D=1,25 B=1,25 E=−2,165064 · fonte: [ESRI] termos D e B não nulos
  const c=Math.cos(Math.PI/6), s=Math.sin(Math.PI/6);
  const mundo={ A:2.5*c, D:2.5*s, B:2.5*s, E:-2.5*c, C:30000, F:185000 };
  const f = folhaEnsaio("b06", mundo); if(!f) return ausente(SUPERFICIE.folha);
  let pior=0;
  for(const [px,py] of [[0,0],[1000,800],[3999,2999],[50,2000]]){
    const m=f.paraMundo(px,py), v=f.paraPixel(m.E,m.N);
    pior=Math.max(pior,Math.abs(v.px-px),Math.abs(v.py-py));
  }
  return { ok:pior<=1e-6, nota:`pior desvio ${pior.toExponential(3)} px` };
});

t("B07","B · Afim","VERMELHO","Determinante nulo é recusado: A·E − D·B = 0 não é invertível", ()=>{ // A=2,5 E=2,5 D=2,5 B=2,5 → det=0 · fonte: [IDEM] sem inversa não há paraPixel
  if(!existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const f = mkFolha({ id:"b07", nome:"degenerada", largura:10, altura:10,
    mundo:{A:2.5,D:2.5,B:2.5,E:2.5,C:0,F:0}, grelha:"pttm06", proveniencia:"ensaio", pontos:0 });
  return { ok:f===null, nota:"obtido "+(f===null?"null":"uma folha — a inversa não existe e paraPixel vai devolver Infinity") };
});

t("B08","B · Afim","VERMELHO","dentro() distingue pixel da folha de pixel fora dela", ()=>{ // limites 0..3999 e 0..2999 · fonte: [IDEM]
  const f = folhaEnsaio("b08"); if(!f) return ausente(SUPERFICIE.folha);
  const casos=[[0,0,true],[3999,2999,true],[4000,0,false],[0,3000,false],[-1,0,false],[2000,1500,true]];
  const maus=casos.filter(([x,y,esp])=>f.dentro(x,y)!==esp);
  return { ok:maus.length===0, nota:maus.length? "erram: "+JSON.stringify(maus) : "" };
});

/* ===================== C · Calibração por dois pontos (10) =============== */
/* Dois pontos de controlo, à vista. Pixel (100,100) fica em (30250, 184750);
   pixel (3100,2100) fica em (37750, 179750). Isso é 2,5 m/px sem rotação. */
const PC1 = { px:100,  py:100,  E:30250, N:184750 };
const PC2 = { px:3100, py:2100, E:37750, N:179750 };

t("C01","C · Dois pontos","VERMELHO","calibrarPorDoisPontos existe", ()=>
  existe(cal2p) ? true : ausente(SUPERFICIE.calibrar2p));

t("C02","C · Dois pontos","VERMELHO","Dois pontos com o mesmo pixel são recusados", ()=>{ // fonte: [IDEM] sem separação em pixel não há escala
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const r = cal2p({px:100,py:100,E:30250,N:184750},{px:100,py:100,E:37750,N:179750});
  return { ok:r===null, nota:"obtido "+JSON.stringify(r) };
});

t("C03","C · Dois pontos","VERMELHO","Dois pontos com o mesmo mundo são recusados", ()=>{ // fonte: [IDEM] escala nula colapsa a folha num ponto
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const r = cal2p({px:100,py:100,E:30250,N:184750},{px:3100,py:2100,E:30250,N:184750});
  return { ok:r===null, nota:"obtido "+JSON.stringify(r) };
});

t("C04","C · Dois pontos","VERMELHO","Escala derivada é 2,5 m/px", ()=>{ // distância mundo 9013,878 m ÷ distância pixel 3605,551 px = 2,5 · fonte: [IDEM]
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const w = cal2p(PC1, PC2); if(!w) return { ok:false, nota:"devolveu null" };
  const escala = Math.sqrt(Math.abs(w.A*w.E - w.D*w.B));
  return perto(escala, 2.5, 1e-6);
});

t("C05","C · Dois pontos","VERMELHO","Sem rotação, D e B saem nulos a menos de 1e-9", ()=>{ // os dois pontos alinham-se em pixel e em mundo · fonte: [IDEM]
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const w = cal2p(PC1, PC2); if(!w) return { ok:false, nota:"devolveu null" };
  return { ok: Math.abs(w.D)<=1e-9 && Math.abs(w.B)<=1e-9, nota:`D=${w.D} B=${w.B}` };
});

t("C06","C · Dois pontos","VERMELHO","O ponto de controlo 1 recoloca-se sobre si próprio", ()=>{ // entrada px=100 py=100 · esperado E=30250,000 N=184750,000 · tolerância 0,01 m
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const w = cal2p(PC1, PC2); if(!w) return { ok:false, nota:"calibração devolveu null" };
  const f = folhaEnsaio("c06", w); if(!f) return ausente(SUPERFICIE.folha);
  const m = f.paraMundo(PC1.px, PC1.py);
  const a = perto(m.E, PC1.E, 0.01), b = perto(m.N, PC1.N, 0.01);
  return { ok:a.ok&&b.ok, nota:"E: "+a.nota+" | N: "+b.nota };
});

t("C07","C · Dois pontos","VERMELHO","O ponto de controlo 2 recoloca-se sobre si próprio", ()=>{ // entrada px=3100 py=2100 · esperado E=37750,000 N=179750,000 · tolerância 0,01 m
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const w = cal2p(PC1, PC2); if(!w) return { ok:false, nota:"calibração devolveu null" };
  const f = folhaEnsaio("c07", w); if(!f) return ausente(SUPERFICIE.folha);
  const m = f.paraMundo(PC2.px, PC2.py);
  const a = perto(m.E, PC2.E, 0.01), b = perto(m.N, PC2.N, 0.01);
  return { ok:a.ok&&b.ok, nota:"E: "+a.nota+" | N: "+b.nota };
});

t("C08","C · Dois pontos","VERMELHO","A semelhança preserva a razão de aspecto: |A| = |E|", ()=>{ // dois pontos só dão semelhança, nunca afim geral · fonte: [IDEM]
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const w = cal2p(PC1, PC2); if(!w) return { ok:false, nota:"devolveu null" };
  return perto(Math.abs(w.A), Math.abs(w.E), 1e-9);
});

t("C09","C · Dois pontos","VERMELHO","Imagem com y para baixo produz E negativo", ()=>{ // py cresce, N decresce · fonte: [ESRI] convenção do world file
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const w = cal2p(PC1, PC2); if(!w) return { ok:false, nota:"devolveu null" };
  return { ok: w.E < 0, nota:`E=${w.E} — positivo põe a folha invertida no eixo Norte` };
});

t("C10","C · Dois pontos","VERMELHO","Calibração por dois pontos e world file equivalente coincidem", ()=>{ // ambos descrevem 2,5 m/px com canto em (30000,185000) · tolerância 0,01 m
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const w = cal2p(PC1, PC2); if(!w) return { ok:false, nota:"devolveu null" };
  const fa = folhaEnsaio("c10a", w), fb = folhaEnsaio("c10b", WF_ESPERADO);
  if(!fa || !fb) return ausente(SUPERFICIE.folha);
  let pior=0;
  for(const [px,py] of [[0,0],[2000,1500],[3999,2999]]){
    const a=fa.paraMundo(px,py), b=fb.paraMundo(px,py);
    pior=Math.max(pior,Math.abs(a.E-b.E),Math.abs(a.N-b.N));
  }
  return { ok:pior<=0.01, nota:`pior divergência ${pior.toFixed(4)} m` };
});

/* ============================ D · PT-TM06 (9) =========================== */
t("D01","D · PT-TM06","VERDE","A origem da projeção cai em (0, 0) exactos", ()=>{ // entrada lat=39,668258333 lon=−8,133108333 · esperado E=0,000 N=0,000 · fonte: [EPSG] 3763, falso Este e falso Norte iguais a zero
  if(!existe(paraTM)) return ausente(SUPERFICIE.paraTM06);
  const c = paraTM(LAT0, LON0);
  const a = perto(c.E, 0, 1e-6), b = perto(c.N, 0, 1e-6);
  return { ok:a.ok&&b.ok, nota:"E: "+a.nota+" | N: "+b.nota };
});

t("D02","D · PT-TM06","VERDE","Ida e volta em cinco pontos do território fica abaixo do milímetro", ()=>{ // Vila Real 41,30/−7,75 · Douro Sup. 41,10/−7,00 · Lisboa 38,7223/−9,1393 · Minho 42,15/−8,20 · Algarve 37,02/−7,93 · fonte: [IDEM]
  if(!existe(paraTM) || !existe(deTM)) return ausente(SUPERFICIE.paraTM06);
  const pts=[[41.30,-7.75],[41.10,-7.00],[38.7223,-9.1393],[42.15,-8.20],[37.02,-7.93]];
  let pior=0, onde=null;
  for(const [la,lo] of pts){
    const c=paraTM(la,lo), v=deTM(c.E,c.N);
    const dm = Math.hypot((v.lat-la)*111320, (v.lon-lo)*111320*Math.cos(la*Math.PI/180));
    if(dm>pior){ pior=dm; onde=[la,lo]; }
  }
  return { ok:pior<=0.001, nota:`pior desvio ${pior.toExponential(3)} m em (${onde}) · limiar 0,001 m` };
});

t("D03","D · PT-TM06","VERDE","O Norte cresce com o raio meridional na origem", ()=>{ // Δφ=0,01° na origem · M(φ0)=6 361 451 m para GRS80 · esperado ΔN=1110,283 m ± 0,002 · fonte: [EPSG] elipsoide GRS80, a=6378137, 1/f=298,257222101
  if(!existe(paraTM)) return ausente(SUPERFICIE.paraTM06);
  const a=6378137.0, f=1/298.257222101, e2=f*(2-f), p=LAT0*Math.PI/180;
  const M = a*(1-e2)/Math.pow(1-e2*Math.sin(p)*Math.sin(p),1.5);
  const esperado = M*0.01*Math.PI/180;
  const obtido = paraTM(LAT0+0.01, LON0).N;
  return perto(obtido, esperado, 0.002);
});

t("D04","D · PT-TM06","VERDE","O nível 0 da grelha PTTM_06 tem 615 000 m de lado", ()=>{ // ScaleDenominator 8579799,10714 × 0,00028 × 256 · fonte: [DGT-W] TileMatrix 00 do conjunto PTTM_06
  if(!existe(GRELHAS) || !GRELHAS.pttm06) return { ok:false, nota:"ausente: GRELHAS.pttm06" };
  return perto(GRELHAS.pttm06.res(0)*256, 615000, 1);
});

t("D05","D · PT-TM06","VERDE","A origem da grelha é o canto declarado pela DGT", ()=>{ // TopLeftCorner −170000,0 290000,0 · fonte: [DGT-W] conjunto PTTM_06
  if(!existe(GRELHAS) || !GRELHAS.pttm06) return { ok:false, nota:"ausente: GRELHAS.pttm06" };
  const g=GRELHAS.pttm06;
  return { ok: g.E0===-170000 && g.N0===290000 && g.crs==="EPSG:3763",
           nota:`E0=${g.E0} N0=${g.N0} crs=${g.crs}` };
});

t("D06","D · PT-TM06","VERDE","Envelope da altimetria da DGT: cantos geográficos caem dentro do envelope projetado", ()=>{ // CRS:84 −9,604040510/36,947472359 a −6,172532911/42,153445212 · BoundingBox 3763 −121593,53/−300466,24 a 162089,617/276014,55 · tolerância 10 km porque um envelope projetado não é a projeção dos cantos · fonte: [DGT-M] camada Curva_de_nivel
  if(!existe(paraTM)) return ausente(SUPERFICIE.paraTM06);
  const a = paraTM(36.94747235880243, -9.604040509761266);
  const b = paraTM(42.15344521232816, -6.172532911356066);
  const dec = { minx:-121593.53, miny:-300466.24, maxx:162089.61674883147, maxy:276014.55 };
  const d = Math.max(Math.abs(a.E-dec.minx), Math.abs(a.N-dec.miny),
                     Math.abs(b.E-dec.maxx), Math.abs(b.N-dec.maxy));
  return { ok:d<=10000, nota:`maior divergência ${(d/1000).toFixed(2)} km · limiar 10 km` };
});

t("D07","D · PT-TM06","VERMELHO","Folha em PT-TM06: pixel → E,N → lat,lon → E,N devolve o mesmo", ()=>{ // tolerância 0,001 m · fonte: [IDEM] a folha não pode introduzir erro além do da projeção
  const f = folhaEnsaio("d07"); if(!f) return ausente(SUPERFICIE.folha);
  if(!existe(paraTM) || !existe(deTM)) return ausente(SUPERFICIE.paraTM06);
  let pior=0;
  for(const [px,py] of [[0,0],[2000,1500],[3999,2999]]){
    const m=f.paraMundo(px,py), g=deTM(m.E,m.N), v=paraTM(g.lat,g.lon);
    pior=Math.max(pior, Math.abs(v.E-m.E), Math.abs(v.N-m.N));
  }
  return { ok:pior<=0.001, nota:`pior desvio ${pior.toExponential(3)} m` };
});

t("D08","D · PT-TM06","VERMELHO","A folha declara a sua grelha e recusa descrição sem ela", ()=>{ // os seis coeficientes não dizem em que projeção estão · fonte: [IDEM] o ficheiro não traz essa informação
  if(!existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const semGrelha = mkFolha({ id:"d08", nome:"sem grelha", largura:10, altura:10,
    mundo:WF_ESPERADO, proveniencia:"ensaio", pontos:0 });
  return { ok:semGrelha===null, nota:"obtido "+(semGrelha===null?"null":"uma folha sem projeção declarada") };
});

t("D09","D · PT-TM06","VERMELHO","Folha em grelha diferente da activa não é desenhada", ()=>{ // mosaicos já desenhados não se reprojetam · fonte: [IDEM] mesma razão que a aplicação já invoca para o WMTS
  if(!existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const f = mkFolha({ id:"d09", nome:"mercator", largura:10, altura:10,
    mundo:WF_ESPERADO, grelha:"mercator", proveniencia:"ensaio", pontos:0 });
  if(!f) return { ok:false, nota:"não aceitou uma folha em Mercator, que é legítima" };
  if(typeof f.compativel !== "function") return { ok:false, nota:"ausente: folha.compativel(grelha)" };
  return { ok: f.compativel("mercator")===true && f.compativel("pttm06")===false,
           nota:`compativel(mercator)=${f.compativel("mercator")} compativel(pttm06)=${f.compativel("pttm06")}` };
});

/* ============================ E · Persistência (8) ====================== */
t("E01","E · Persistência","VERMELHO","IDB_LOJAS contém a loja folhas", ()=>{ // fonte: [IDEM] sem loja não há folha depois de fechar a aplicação
  if(!existe(LOJAS)) return { ok:false, nota:"ausente: "+SUPERFICIE.lojas };
  const nomes = LOJAS.map(l=>l[0]);
  return { ok:nomes.includes("folhas"), nota:"lojas declaradas: "+nomes.join(", ") };
});

t("E02","E · Persistência","VERMELHO","A loja folhas tem keyPath \"id\"", ()=>{ // fonte: [IDEM] a folha identifica-se por id, como as cópias
  if(!existe(LOJAS)) return { ok:false, nota:"ausente: "+SUPERFICIE.lojas };
  const l = LOJAS.find(x=>x[0]==="folhas");
  if(!l) return { ok:false, nota:"loja folhas não declarada" };
  return { ok: l[1] && l[1].keyPath==="id", nota:"opções: "+JSON.stringify(l[1]) };
});

t("E03","E · Persistência","VERDE","As quatro lojas anteriores mantêm-se: a migração é aditiva", ()=>{ // chaves, diario, copias, mosaicos · fonte: [IDEM] nenhuma migração pode apagar o diário, que é append-only
  if(!existe(LOJAS)) return { ok:false, nota:"ausente: "+SUPERFICIE.lojas };
  const nomes = LOJAS.map(l=>l[0]);
  const faltam = ["chaves","diario","copias","mosaicos"].filter(n=>!nomes.includes(n));
  return { ok:faltam.length===0, nota:faltam.length? "desapareceram: "+faltam.join(", ") : "" };
});

t("E04","E · Persistência","VERMELHO","criarLojasIDB cria folhas numa base que não a tem", ()=>{ // fonte: [IDEM]
  if(!existe(criarL)) return ausente(SUPERFICIE.criarLojas);
  const criadas=[];
  const db = { objectStoreNames:{ _l:["chaves","diario","copias","mosaicos"],
                                  contains(n){ return this._l.includes(n); } },
               createObjectStore(n,o){ criadas.push(n); this.objectStoreNames._l.push(n); } };
  criarL(db);
  return { ok:criadas.includes("folhas"), nota:"criou: "+(criadas.join(", ")||"nada") };
});

t("E05","E · Persistência","VERDE","criarLojasIDB não recria lojas que já existem", ()=>{ // fonte: [IDEM] recriar apaga o conteúdo
  if(!existe(criarL)) return ausente(SUPERFICIE.criarLojas);
  const criadas=[];
  const db = { objectStoreNames:{ _l:["chaves","diario","copias","mosaicos","folhas"],
                                  contains(n){ return this._l.includes(n); } },
               createObjectStore(n){ criadas.push(n); } };
  criarL(db);
  return { ok:criadas.length===0, nota:"recriou: "+(criadas.join(", ")||"nada") };
});

t("E06","E · Persistência","VERDE","Nenhum pedido de abertura desce abaixo da versão existente", ()=>{ // fonte: [IDEM] subir é legítimo, descer nunca é
  const fonte = fs.readFileSync(alvo, "utf8");
  /* Varre o código com os comentários fora: um `indexedDB.open(IDB_NOME, 2)` citado
     num comentário a explicar o defeito não é o defeito. */
  const semComentarios = fonte
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^[ \t]*\*.*$/gm, " ");
  const fixo = /indexedDB\s*\.\s*open\s*\(\s*IDB_NOME\s*,\s*\d+\s*\)/.test(semComentarios);
  return { ok:!fixo, nota: fixo? "encontrado indexedDB.open(IDB_NOME, <número literal>) fora de comentário"
                              : "abre sem versão e sobe um degrau quando falta loja" };
});

t("E07","E · Persistência","VERMELHO","Uma folha guardada e relida devolve os seis coeficientes intactos", ()=>{ // A=2,5 D=0 B=0 E=−2,5 C=30000 F=185000 · fonte: [IDEM] serialização não pode perder precisão
  const f = folhaEnsaio("e07"); if(!f) return ausente(SUPERFICIE.folha);
  const volta = JSON.parse(JSON.stringify(f.mundo || {}));
  const maus = Object.keys(WF_ESPERADO).filter(k=>volta[k]!==WF_ESPERADO[k]);
  return { ok:maus.length===0, nota:maus.length? "divergem após serializar: "+maus.join(",") : "" };
});

t("E08","E · Persistência","VERMELHO","Folha sem id não é aceite", ()=>{ // fonte: [IDEM] a loja tem keyPath id; sem id a escrita falha em silêncio
  if(!existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const f = mkFolha({ nome:"sem id", largura:10, altura:10, mundo:WF_ESPERADO,
                      grelha:"pttm06", proveniencia:"ensaio", pontos:0 });
  return { ok:f===null, nota:"obtido "+(f===null?"null":"uma folha sem id") };
});

/* ============================= F · Integração (5) ======================= */
t("F01","F · Integração","VERMELHO","FOLHAS existe e é uma lista", ()=>{
  if(!existe(FOLHAS)) return { ok:false, nota:"ausente: "+SUPERFICIE.coleccao };
  return { ok:Array.isArray(FOLHAS), nota:"tipo: "+typeof FOLHAS };
});

t("F02","F · Integração","VERMELHO","grelhaAtual respeita a grelha da folha quando não há carta", ()=>{ // fonte: [IDEM] a projeção da folha é a única informação disponível nesse caso
  const ga = api[SUPERFICIE.grelhaAtual];
  if(!existe(ga) || !existe(FOLHAS) || !Array.isArray(FOLHAS)) return { ok:false, nota:"ausente: "+SUPERFICIE.coleccao+" ou "+SUPERFICIE.grelhaAtual };
  const f = folhaEnsaio("f02"); if(!f) return ausente(SUPERFICIE.folha);
  FOLHAS.length = 0; FOLHAS.push(f);
  const g = ga();
  FOLHAS.length = 0;
  return { ok: g && g.k==="pttm06", nota:"grelha devolvida: "+(g&&g.k) };
});

t("F03","F · Integração","VERMELHO","retratoDoFogo traz as folhas na cartografia", ()=>{ // fonte: [IDEM] o p0020 listava-as e o r0083 deixou o ramo a apontar para o vazio
  if(!existe(retrato)) return ausente(SUPERFICIE.retrato);
  let r; try{ r = retrato(); }catch(e){ return { ok:false, nota:"lançou: "+e.message }; }
  const c = r && (r.cartografia || r.carta);
  return { ok: !!(c && "folhas" in c), nota:"cartografia do retrato: "+JSON.stringify(c||null).slice(0,180) };
});

t("F04","F · Integração","VERMELHO","O retrato nomeia cada folha e a sua proveniência", ()=>{ // fonte: [IDEM] regra do projeto: um número sem proveniência é pior do que nenhum número
  if(!existe(retrato) || !existe(FOLHAS) || !Array.isArray(FOLHAS)) return { ok:false, nota:"ausente: "+SUPERFICIE.retrato+" ou "+SUPERFICIE.coleccao };
  const f = folhaEnsaio("f04"); if(!f) return ausente(SUPERFICIE.folha);
  FOLHAS.length = 0; FOLHAS.push(f);
  let r; try{ r = retrato(); }catch(e){ FOLHAS.length=0; return { ok:false, nota:"lançou: "+e.message }; }
  FOLHAS.length = 0;
  const s = JSON.stringify(r||{});
  return { ok: s.includes("ensaio t0001 ramo #002"), nota:"proveniência não aparece no retrato" };
});

t("F05","F · Integração","VERMELHO","A folha declara quantos pontos de controlo a fixaram", ()=>{ // 0 = ficheiro de referenciação, 2 = calibração manual · fonte: [IDEM] a confiança na colocação depende disto
  const f = folhaEnsaio("f05"); if(!f) return ausente(SUPERFICIE.folha);
  return { ok: typeof f.pontos === "number", nota:"pontos = "+JSON.stringify(f.pontos) };
});

/* ======================= G · Recusas e proveniência (4) ================= */
t("G01","G · Recusas","VERMELHO","Folha sem proveniência declarada é recusada", ()=>{ // fonte: [IDEM] regra do projeto aplicada às folhas: sem origem, não entra
  if(!existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const f = mkFolha({ id:"g01", nome:"anónima", largura:10, altura:10,
                      mundo:WF_ESPERADO, grelha:"pttm06", pontos:0 });
  return { ok:f===null, nota:"obtido "+(f===null?"null":"uma folha sem proveniência") };
});

t("G02","G · Recusas","VERMELHO","Dimensão de pixel zero é recusada", ()=>{ // A=0 colapsa a folha numa linha · fonte: [IDEM]
  if(!existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const f = mkFolha({ id:"g02", nome:"nula", largura:10, altura:10,
    mundo:{A:0,D:0,B:0,E:-2.5,C:30000,F:185000}, grelha:"pttm06", proveniencia:"ensaio", pontos:0 });
  return { ok:f===null, nota:"obtido "+(f===null?"null":"uma folha de largura nula") };
});

t("G03","G · Recusas","VERMELHO","Folha fora do continente avisa mas não é recusada", ()=>{ // envelope PT-TM06 do continente: E de −130000 a 165000, N de −302000 a 280000 · fonte: [DGT-M] BoundingBox da Curva_de_nivel, alargado
  if(!existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const f = mkFolha({ id:"g03", nome:"longe", largura:10, altura:10,
    mundo:{A:2.5,D:0,B:0,E:-2.5,C:900000,F:900000}, grelha:"pttm06",
    proveniencia:"ensaio t0001", pontos:0 });
  if(f===null) return { ok:false, nota:"recusou — pode ser Açores, Madeira ou fronteira, e recusar é excessivo" };
  return { ok: f.foraDoEnvelope===true, nota:"foraDoEnvelope = "+JSON.stringify(f.foraDoEnvelope) };
});

t("G04","G · Recusas","VERMELHO","Calibração por dois pontos marca a folha com pontos = 2", ()=>{ // fonte: [IDEM] distingue colocação medida de colocação declarada por ficheiro
  if(!existe(cal2p)) return ausente(SUPERFICIE.calibrar2p);
  const w = cal2p(PC1, PC2); if(!w) return { ok:false, nota:"calibração devolveu null" };
  if(!existe(mkFolha)) return ausente(SUPERFICIE.folha);
  const f = mkFolha({ id:"g04", nome:"por pontos", largura:FOLHA_LARG, altura:FOLHA_ALT,
                      mundo:w, grelha:"pttm06", proveniencia:"dois pontos de controlo", pontos:2 });
  if(!f) return { ok:false, nota:"folhaCalibrada devolveu null" };
  return { ok: f.pontos===2, nota:"pontos = "+JSON.stringify(f.pontos) };
});

/* =============================== RELATÓRIO ============================== */
const larg = 78;
const linha = c => c.repeat(larg);
console.log(linha("="));
console.log("t0001 · ramo #002 — Folhas de carta calibradas");
console.log("alvo: " + path.basename(alvo));
console.log(linha("="));

let g = null;
for(const r of R){
  if(r.grupo !== g){ g = r.grupo; console.log("\n" + g); console.log(linha("-")); }
  const marca = r.ok ? "  verde  " : "VERMELHO ";
  console.log(`${marca} ${r.id}  ${r.desc}`);
  if(r.nota) console.log(`           ${r.nota}`);
}

const verdes = R.filter(r=>r.ok).length;
const vermelhos = R.length - verdes;
const espVermelho = R.filter(r=>r.cor==="VERMELHO");
const espVerde = R.filter(r=>r.cor==="VERDE");
const alicerceMau = espVerde.filter(r=>!r.ok);
const jaVerde = espVermelho.filter(r=>r.ok);

console.log("\n" + linha("="));
const asserc = R.filter(r=>r.id!=="L00");
console.log(`asserções ${asserc.length} (+1 verificação de carga) · verdes ${verdes} · vermelhas ${vermelhos}`);
console.log(`alicerces (devem estar verdes no r0083): ${espVerde.length-alicerceMau.length}/${espVerde.length}`);
console.log(`funcionalidade (deve estar vermelha no r0083): ${espVermelho.length-jaVerde.length}/${espVermelho.length} por implementar`);
if(alicerceMau.length){
  console.log("\nATENÇÃO — alicerce partido, resolver antes das folhas:");
  alicerceMau.forEach(r=>console.log("   " + r.id + "  " + r.desc));
}
if(jaVerde.length){
  console.log("\nJá implementado (esperava-se vermelho):");
  jaVerde.forEach(r=>console.log("   " + r.id + "  " + r.desc));
}
console.log(linha("="));
process.exit(vermelhos ? 1 : 0);
