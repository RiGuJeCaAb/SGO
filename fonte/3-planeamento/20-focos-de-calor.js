/* ================= PLANEAMENTO · focos de calor detetados por satélite =================
   O relatório de fontes internacionais concluiu, e a r0072 confirmou por execução, que o
   fogo ativo não vem por mosaicos: as camadas de anomalias térmicas do GIBS são mosaico
   vetorial, que não é imagem. **Os focos de calor são pontos.** E um ponto reprojeta-se
   para PT-TM06 com a aritmética que já está escrita, ao contrário de um mosaico já
   desenhado.

   Este módulo lê a lista de focos. Faz três coisas e recusa fazer uma quarta.

   **Não inventa o endereço do serviço.** É a mesma decisão que se tomou para a cartografia,
   e pela mesma razão: o modelo `{z}/{x}/{y}` foi escrito de cor, não existia naquela forma,
   e o campo ficou uma fechadura sem chave até se passar a perguntar ao serviço. Aqui o
   endereço declara-se, com a chave lá dentro, e quem o declara fica registado. Escrever no
   código um endereço que ninguém confirmou seria repetir o erro com outro nome.

   **O ficheiro serve sem rede.** Um CSV descarregado no gabinete e trazido no dispositivo é
   o caminho que um PCO tem quase sempre, e é o único que não depende de coisa nenhuma.

   O formato é o que a NASA escreve, e lê-se **pelo nome das colunas** — como já se faz com
   a série meteorológica. Um CSV traz o seu próprio cabeçalho: não há nada a adivinhar. */

/**
 * As colunas que interessam, e por que nome se procuram.
 *
 * Só a latitude e a longitude são obrigatórias: sem elas não há ponto, e o resto é o que o
 * ficheiro trouxer. O VIIRS e o MODIS não escrevem as mesmas colunas, e exigir as de um
 * recusava as do outro.
 */
const FIRMS_COLUNAS = [
  { k:"lat",   nomes:["latitude"],                obrig:true },
  { k:"lon",   nomes:["longitude"],               obrig:true },
  { k:"data",  nomes:["acq_date"] },
  { k:"hora",  nomes:["acq_time"] },
  { k:"sat",   nomes:["satellite"] },
  { k:"instr", nomes:["instrument"] },
  { k:"conf",  nomes:["confidence"] },
  { k:"frp",   nomes:["frp"] },
  { k:"dn",    nomes:["daynight"] },
  { k:"tb",    nomes:["bright_ti4", "brightness"] }
];

/**
 * A confiança da deteção, normalizada em três degraus.
 *
 * **Os dois sensores exprimem-na de maneiras diferentes**: o VIIRS escreve `l`, `n` ou `h`;
 * o MODIS escreve um número de 0 a 100. Converter um no outro seria inventar equivalência
 * onde não a há, e por isso guarda-se o texto original ao lado do degrau — quem lê vê o que
 * o satélite escreveu.
 *
 * Os cortes em 30 e 80 são os que a NASA usa para descrever as classes do MODIS na sua
 * documentação de produto; para o VIIRS a correspondência é direta e não precisa de corte.
 */
function confiancaDoFoco(v){
  const t = String(v==null? "" : v).trim().toLowerCase();
  if(t === "") return { grau:"", txt:"" };
  if(t === "l" || t === "low")     return { grau:"baixa",   txt:t };
  if(t === "n" || t === "nominal") return { grau:"nominal", txt:t };
  if(t === "h" || t === "high")    return { grau:"alta",    txt:t };
  const n = parseFloat(t);
  if(!Number.isFinite(n)) return { grau:"", txt:t };
  return { grau: n < 30 ? "baixa" : (n < 80 ? "nominal" : "alta"), txt:t + " %" };
}

/**
 * Lê um CSV de focos de calor.
 *
 * Por nome de coluna e não por posição, que é como o projeto já lê a série meteorológica: o
 * que chega é o que a NASA escreveu, e não um formato nosso.
 *
 * @param {string} txt o CSV, tal como veio
 * @returns {{focos:any[], colunas:string[], lidas:number, semCoordenada:number}}
 * @throws quando falta a latitude ou a longitude, dizendo que colunas encontrou
 */
function lerFocosCSV(txt){
  const L = String(txt||"").trim().split(/\r?\n/).filter(l=>l.trim());
  if(L.length < 2) throw new Error("O ficheiro não tem linhas de dados — só cabeçalho, ou nem isso.");
  const sep = L[0].includes(";") ? ";" : (L[0].includes("\t") ? "\t" : ",");
  const H = L[0].split(sep).map(h=>h.trim().toLowerCase().replace(/^"|"$/g, ""));

  const ix = {};
  FIRMS_COLUNAS.forEach(c=>{
    const i = H.findIndex(h=>c.nomes.includes(h));
    if(i >= 0) ix[c.k] = i;
  });
  const faltam = FIRMS_COLUNAS.filter(c=>c.obrig && ix[c.k] === undefined).map(c=>c.nomes[0]);
  if(faltam.length)
    throw new Error("Falta a coluna " + faltam.join(" e a ") + ". O ficheiro traz: "
      + H.slice(0, 12).join(", ") + (H.length > 12 ? ", …" : "")
      + ". Um CSV de focos do FIRMS traz latitude e longitude com esses nomes.");

  const focos = [];
  let semCoord = 0;
  for(let i=1;i<L.length;i++){
    const c = L[i].split(sep).map(x=>x.trim().replace(/^"|"$/g, ""));
    const lat = parseFloat(c[ix.lat]), lon = parseFloat(c[ix.lon]);
    if(!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180){
      semCoord++; continue;
    }
    const v = k => ix[k] === undefined ? "" : (c[ix[k]] || "");
    /* A hora vem como `HHMM` sem separador, e às vezes com menos de quatro dígitos —
       `59` são as 00:59. Escrever `59` na leitura era dizer outra hora. */
    const hh = String(v("hora")).padStart(4, "0");
    focos.push({
      lat:+lat.toFixed(5), lon:+lon.toFixed(5),
      data:v("data"),
      hora: /^\d{4}$/.test(hh) ? hh.slice(0,2)+":"+hh.slice(2) : v("hora"),
      sat:v("sat"), instr:v("instr"),
      conf:confiancaDoFoco(v("conf")),
      frp: Number.isFinite(parseFloat(v("frp"))) ? parseFloat(v("frp")) : null,
      dn:v("dn"), tb:v("tb")
    });
  }
  return { focos, colunas:H, lidas:L.length-1, semCoordenada:semCoord };
}

/** Os focos guardados na ocorrência, criados à primeira vez que fazem falta. */
function focosObj(){
  if(!O.dados.focos || typeof O.dados.focos !== "object")
    O.dados.focos = { itens:[], origem:"", g:"", por:"", nota:"" };
  if(!Array.isArray(O.dados.focos.itens)) O.dados.focos.itens = [];
  return O.dados.focos;
}

/** A lista de focos. */
function focosLista(){ return focosObj().itens; }

/**
 * Guarda os focos lidos, substituindo os que lá estavam.
 *
 * **Substitui e não acumula.** Uma lista de focos é uma fotografia de um instante; juntar a
 * de agora à de há três horas dava um mapa com o dobro dos focos e nenhum instante.
 */
function guardarFocos(focos, origem){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de carregar focos." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const f = focosObj();
  f.itens = focos;
  f.origem = String(origem||"").trim();
  f.g = gdhAgora(); f.por = quemRegista();
  O.evolucao.push({ g:f.g, tipo:"posit",
    txt:focos.length+" focos de calor carregados"+(f.origem? " ("+f.origem+")" : "")+"." });
  fita(focos.length+" focos de calor carregados");
  return { ok:true, n:focos.length };
}

/** Esquece os focos. Uma fotografia velha no mapa é pior do que nenhuma. */
function esquecerFocos(){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de alterar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const f = focosObj();
  const n = f.itens.length;
  f.itens = []; f.origem = ""; f.g = ""; f.por = "";
  fita("Focos de calor retirados do mapa ("+n+")");
  return { ok:true, n };
}

/**
 * A leitura escrita dos focos.
 *
 * O que interessa a quem lê é **quando foi visto** e **com que confiança**, e não a
 * contagem: cinquenta focos de baixa confiança de há oito horas dizem menos do que três de
 * alta confiança de há vinte minutos.
 */
function leituraDosFocos(){
  const f = focosObj();
  if(!f.itens.length) return "";
  const por = { alta:0, nominal:0, baixa:0, "":0 };
  let frpMax = null, datas = new Set();
  f.itens.forEach(x=>{
    por[x.conf.grau] = (por[x.conf.grau]||0) + 1;
    if(x.frp !== null && (frpMax === null || x.frp > frpMax)) frpMax = x.frp;
    if(x.data) datas.add(x.data + (x.hora? " " + x.hora : ""));
  });
  const inst = [...datas].sort();
  const p = [f.itens.length + " focos de calor no mapa"
    + (f.origem? ", de " + f.origem : "") + ", carregados às " + f.g + "."];
  const graus = ["alta","nominal","baixa"].filter(g=>por[g]).map(g=>por[g] + " de confiança " + g);
  if(graus.length) p.push("Confiança: " + graus.join(", ") + (por[""]? ", " + por[""] + " sem confiança declarada" : "") + ".");
  if(inst.length) p.push("Deteções entre " + inst[0] + " e " + inst[inst.length-1] + ", em hora UTC — como o satélite as escreveu.");
  if(frpMax !== null) p.push("Potência radiativa máxima observada: " + frpMax + " MW.");
  p.push("**Um foco é uma deteção, não um incêndio confirmado**, e a ausência de focos não é ausência de fogo: a passagem do satélite tem hora, o fumo espesso tapa, e a resolução do sensor é de centenas de metros.");
  return p.join(" ");
}

/* ---- o endereço do serviço, que é definição do posto e não da ocorrência ----
   A chave de acesso vive aqui e **não** no estado da ocorrência. Um ficheiro de ocorrência
   passa entre postos, vai por correio e fica arquivado; uma chave dentro dele saía de casa
   sem ninguém dar por isso. Fica no armazém do dispositivo, como a declaração da carta. */
let FOCOS_URL = "";
const FOCOS_URL_CHAVE = "peaapp:focosurl";

/** Lê o endereço guardado neste dispositivo. */
async function carregarFocosURL(){
  try{ const r = await ARMAZEM.get(FOCOS_URL_CHAVE); FOCOS_URL = String(r.value||""); }
  catch(e){ FOCOS_URL = ""; }
  return FOCOS_URL;
}

/** Guarda o endereço neste dispositivo. */
async function guardarFocosURL(u){
  const url = String(u||"").trim();
  if(url && !/^https:\/\//.test(url))
    return { ok:false, motivo:"O endereço tem de começar por https:// — uma chave de acesso não viaja em claro." };
  FOCOS_URL = url;
  try{ await ARMAZEM.set(FOCOS_URL_CHAVE, url); }catch(e){}
  return { ok:true };
}

/** Esquece o endereço, e com ele a chave. */
async function esquecerFocosURL(){
  FOCOS_URL = "";
  try{ await ARMAZEM.del(FOCOS_URL_CHAVE); }catch(e){}
}

/**
 * O endereço a pedir, com os campos que a aplicação sabe preencher.
 *
 * Substituem-se os marcadores que estiverem escritos: a caixa envolvente do teatro e a data
 * de hoje. **O que não tiver marcador fica como está** — a aplicação não reescreve o
 * endereço de ninguém, só preenche o que lhe pediram para preencher.
 */
function focosEndereco(base){
  const P = perimObj();
  const lat0 = parseFloat(String(O.meta.lat).replace(",", ".")),
        lon0 = parseFloat(String(O.meta.lon).replace(",", "."));
  let bb = "";
  if(P) bb = P.bbox.join(",");
  else if(Number.isFinite(lat0) && Number.isFinite(lon0)){
    /* Sem perímetro, uma caixa de meio grau à volta do ponto: é a ordem de grandeza de um
       teatro de operações e evita pedir o país inteiro. */
    const d = 0.25;
    bb = [lon0-d, lat0-d, lon0+d, lat0+d].map(x=>x.toFixed(4)).join(",");
  }
  const hoje = new Date(agora()).toISOString().slice(0, 10);
  return String(base||"")
    .replace(/\{bbox\}/gi, bb)
    .replace(/\{data\}|\{date\}/gi, hoje);
}

/* ---- ao ecrã ---- */

/** Pinta a leitura dos focos e repõe o endereço guardado. */
function pintarFocos(){
  const el = $("foc-info"); if(!el) return;
  const t = leituraDosFocos();
  el.innerHTML = t
    ? esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    : '<span class="hint">Nenhum foco carregado. Carrega um CSV do FIRMS, ou declara o endereço do serviço.</span>';
  if($("foc-url") && !$("foc-url").value) $("foc-url").value = FOCOS_URL;
}

/** Lê um CSV, guarda o que dele saiu e diz o que se passou. */
function usarFocosCSV(txt, origem){
  let r;
  try{ r = lerFocosCSV(txt); }
  catch(e){ aviso("foc-msg","err", String(e.message||e)); return false; }
  if(!r.focos.length){
    aviso("foc-msg","err","O ficheiro tem "+r.lidas+" linhas e nenhuma com coordenada utilizável.");
    return false;
  }
  const g = guardarFocos(r.focos, origem);
  if(!g.ok){ aviso("foc-msg","err",g.motivo); return false; }
  aviso("foc-msg","ok", r.focos.length+" focos carregados"
    + (r.semCoordenada? " · "+r.semCoordenada+" linhas sem coordenada utilizável, ignoradas" : "")
    + ". Carregar a carta para os ver no mapa.");
  return true;
}

$("foc-fich").addEventListener("change", async ev=>{
  const f = ev.target.files && ev.target.files[0]; if(!f) return;
  if(usarFocosCSV(await f.text(), f.name)){ persistir(false); pintarFocos(); pintarPontos(); pintarMapa(); pintarEvolucao(); }
  ev.target.value = "";
});

$("foc-ler").addEventListener("click", async ()=>{
  const g = await guardarFocosURL($("foc-url").value);
  if(!g.ok){ aviso("foc-msg","err",g.motivo); return; }
  if(!FOCOS_URL){ aviso("foc-msg","err","Sem endereço declarado não há a quem pedir. Ou declara um, ou carrega o ficheiro."); return; }
  const u = focosEndereco(FOCOS_URL);
  aviso("foc-msg","ok","A pedir ao serviço...");
  try{
    const r = await fetchT(u, {}, 25000);
    if(!r.ok){ aviso("foc-msg","err","O serviço respondeu HTTP "+r.status+"."); return; }
    const txt = await r.text();
    /* O FIRMS responde erro em texto simples com 200, como tantos outros. Se não vier
       cabeçalho com latitude, o leitor di-lo — e a mensagem dele é melhor do que uma nossa. */
    if(usarFocosCSV(txt, "serviço declarado")){ persistir(false); pintarFocos(); pintarPontos(); pintarMapa(); pintarEvolucao(); }
  }catch(e){
    /* Em `file://` há serviços que recusam o pedido de outra origem, e não há como
       contornar isso do lado da aplicação. O ficheiro é o caminho que resta. */
    aviso("foc-msg","err","Não foi possível pedir ao serviço ("+String(e).slice(0,90)
      +"). Descarrega o CSV e carrega-o do ficheiro.");
  }
});

$("foc-esquecer").addEventListener("click", async ()=>{
  await esquecerFocosURL();
  if($("foc-url")) $("foc-url").value = "";
  aviso("foc-msg","ok","Endereço esquecido, e com ele a chave.");
});

$("foc-limpar").addEventListener("click", ()=>{
  const r = esquecerFocos();
  if(!r.ok){ aviso("foc-msg","err",r.motivo); return; }
  persistir(false);
  aviso("foc-msg","ok","Retirados "+r.n+" focos.");
  pintarFocos(); pintarPontos(); pintarMapa(); pintarEvolucao();
});
