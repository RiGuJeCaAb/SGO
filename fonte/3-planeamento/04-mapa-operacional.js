/* ================= PLANEAMENTO · mapa operacional do TO =================
   O croqui mostra a forma. O mapa mostra-a **sobre a carta**: onde o incêndio pega, que
   povoações tem à volta, por onde correm as estradas. É a diferença entre saber que o
   perímetro tem seiscentos hectares e ver a que distância fica a aldeia.

   Escrito no projeto, sem biblioteca nenhuma, porque a entrega é um ficheiro único que
   abre em `file://`: uma biblioteca de mapas obrigaria a servidor ou a `<script src>`, e
   nem uma coisa nem outra existem aqui. São cerca de trezentas linhas de projeção de
   Mercator, aritmética de mosaicos e um SVG por cima — que é tudo o que um mapa é.

   **A carta é de terceiros e a licença exige que se diga.** A atribuição fica sempre à
   vista por baixo do mapa, e a fonte está declarada em `CARTAS` com os termos de uso.

   **Sem rede, o mapa não desaparece.** Os mosaicos já descarregados ficam no IndexedDB e
   voltam a servir. Sem rede e sem mosaicos guardados, fica o croqui, que não precisa de
   nada — e a aplicação di-lo em vez de mostrar um retângulo cinzento.

   Um mapa de apoio à decisão não é uma carta de navegação: não substitui a M888. */

/**
 * As cartas de fundo, com a atribuição que a licença obriga a mostrar.
 *
 * Uma só, e declarada. Acrescentar outra é acrescentar uma linha — mas cada linha tem de
 * trazer a atribuição e os termos, que é o que torna legítimo usá-la.
 */
const CARTAS = [
  { k:"osm", n:"OpenStreetMap",
    u:"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    atrib:"© contribuidores do OpenStreetMap",
    termos:"https://www.openstreetmap.org/copyright",
    zMax:19 }
];

/** Lado do mosaico, em pixéis. É o do esquema de mosaicos, não uma escolha nossa. */
const MOSAICO_PX = 256;
/** Ao fim de quanto tempo um mosaico guardado se considera velho. */
const MOSAICO_DIAS = 60;

/* ---- projeção de Mercator esférica, a do esquema de mosaicos ----
   Repare-se que **não é** a projeção do croqui. O croqui é equirrectangular local, que
   chega para desenhar sozinho; o mosaico vem projetado em Mercator e o que se desenha
   por cima tem de vir na mesma projeção, ou fica ao lado do sítio. */

/** Pixel do mundo, em X, de uma longitude ao nível de ampliação `z`. */
function merX(lon, z){ return ((lon+180)/360) * MOSAICO_PX * Math.pow(2, z); }
/** Pixel do mundo, em Y, de uma latitude ao nível de ampliação `z`. */
function merY(lat, z){
  const f = Math.min(Math.max(Math.sin(lat*Math.PI/180), -0.9999), 0.9999);
  return (0.5 - Math.log((1+f)/(1-f))/(4*Math.PI)) * MOSAICO_PX * Math.pow(2, z);
}
/** A longitude de um pixel do mundo. */
function merLon(x, z){ return x/(MOSAICO_PX*Math.pow(2, z))*360 - 180; }
/** A latitude de um pixel do mundo. */
function merLat(y, z){
  const n = Math.PI * (1 - 2*y/(MOSAICO_PX*Math.pow(2, z)));
  return 180/Math.PI * Math.atan(0.5*(Math.exp(n) - Math.exp(-n)));
}
/** Metros por pixel a uma latitude e ampliação. */
function merEscala(lat, z){
  return 156543.03392 * Math.cos(lat*Math.PI/180) / Math.pow(2, z);
}

/* ---- o estado da vista ----
   Não é estado da ocorrência: é para onde a pessoa está a olhar. Não se grava e não vai
   no PEA. O que vai no PEA é o croqui, que é o desenho e não a vista. */
const MAPA = { z:0, cx:0, cy:0, larg:0, alt:0, alvo:"", carta:"osm", pronto:false, falhas:0 };
/** Os endereços temporários dos mosaicos desenhados, para os libertar no render seguinte. */
let MAPA_URLS = [];

/**
 * Enquadra o mapa na caixa envolvente do croqui.
 *
 * Reaproveita `enquadrarCroqui` **pela caixa**, e não pela projeção: é lá que está a
 * regra da extensão mínima, que impede um ponto sozinho de dar uma escala absurda. Duas
 * caixas calculadas em dois sítios seriam duas caixas a divergir.
 *
 * @returns {boolean} se houve por onde enquadrar
 */
function enquadrarMapa(larg, altMax){
  const Q = enquadrarCroqui(larg||MAPA.larg||640, altMax||MAPA.alt||420);
  if(!Q) return false;
  MAPA.larg = larg || MAPA.larg || 640;
  /* A altura segue a proporção do teatro, e não uma proporção fixa. Um incêndio quase
     quadrado numa tela deitada obrigava a afastar até caber na altura, e metade do mapa
     ficava vazia dos lados — via-se o dobro do que interessa e metade do detalhe. */
  const zRef = 14;
  const lg = Math.max(1, merX(Q.maxLon, zRef) - merX(Q.minLon, zRef));
  const al = Math.max(1, merY(Q.minLat, zRef) - merY(Q.maxLat, zRef));
  const teto = altMax || 620, prop = al/lg;
  let L = MAPA.larg, A = Math.round(L*prop);
  /* Quando a altura ideal não cabe, é a largura que cede — e não a proporção. Deixar a
     largura toda e cortar só a altura punha o teatro num retângulo deitado com margens
     vazias dos dois lados, que é ver menos detalhe do que a tela dava. */
  if(A > teto){ A = teto; L = Math.round(A/prop); }
  MAPA.larg = Math.max(280, L);
  MAPA.alt = Math.max(260, A);
  const zMax = (cartaAtual().zMax) || 19;
  /* O maior nível de ampliação em que a caixa ainda cabe na tela. */
  let z = 5;
  for(let t=zMax; t>=3; t--){
    const w = merX(Q.maxLon, t) - merX(Q.minLon, t);
    const h = merY(Q.minLat, t) - merY(Q.maxLat, t);
    if(w <= MAPA.larg && h <= MAPA.alt){ z = t; break; }
  }
  MAPA.z = z;
  MAPA.cx = (merX(Q.minLon, z) + merX(Q.maxLon, z))/2;
  MAPA.cy = (merY(Q.minLat, z) + merY(Q.maxLat, z))/2;
  return true;
}

/** A carta em uso. */
function cartaAtual(){ return CARTAS.find(c=>c.k === MAPA.carta) || CARTAS[0]; }

/** O endereço de um mosaico. */
function mosaicoURL(z, x, y){
  return cartaAtual().u.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
}

/**
 * Um mosaico, do arquivo local ou da rede.
 *
 * O arquivo primeiro, sempre: poupa a rede de quem a cedeu e é o que faz o mapa
 * sobreviver à ligação que cai. Falhar devolve `null` — nunca lança, porque um mapa que
 * parte a página por um quadrado que não veio é pior do que um mapa com um buraco.
 *
 * @returns {Promise<Blob|null>}
 */
async function mosaicoBlob(z, x, y){
  const chave = cartaAtual().k+"/"+z+"/"+x+"/"+y;
  if(IDB){
    try{
      const g = await _idb("mosaicos", "readonly", st=>st.get(chave));
      if(g && g.b && (Date.now() - (g.ts||0)) < MOSAICO_DIAS*86400000) return g.b;
    }catch(e){}
  }
  try{
    const r = await fetchT(mosaicoURL(z, x, y), {}, 12000);
    if(!r.ok) return null;
    const b = await r.blob();
    if(IDB){ try{ await _idb("mosaicos","readwrite", st=>st.put({b, ts:Date.now()}, chave)); }catch(e){} }
    return b;
  }catch(e){ return null; }
}

/** Quantos mosaicos estão guardados, e desde quando. */
async function mosaicosGuardados(){
  if(!IDB) return { n:0, desde:0 };
  try{
    const L = (await _idb("mosaicos","readonly", st=>st.getAll())) || [];
    const ts = L.map(x=>x.ts||0).filter(Boolean);
    return { n:L.length, desde: ts.length? Math.min(...ts) : 0 };
  }catch(e){ return { n:0, desde:0 }; }
}

/** Esquece os mosaicos guardados. */
async function esquecerMosaicos(){
  if(!IDB) return 0;
  const antes = (await mosaicosGuardados()).n;
  try{ await _idb("mosaicos","readwrite", st=>st.clear()); }catch(e){}
  return antes;
}

/* ---- os pontos notáveis ---- */

/**
 * Os tipos de ponto que se marcam no mapa, com a norma que os institui.
 *
 * **Cada citação é a que o projeto já usa para a mesma matéria noutro sítio**, e não uma
 * alínea escolhida por parecer bem: o registo de posse e o da arrumação já citam a ZCR, a
 * zona de apoio e o ponto de trânsito, e é de lá que estas vêm. Onde não há citação
 * confirmada, diz-se — o ponto de água é figura corrente na manobra e não se lhe achou o
 * artigo, e por isso fica declarado como por confirmar, em vez de se inventar a alínea.
 * Ver `docs/FONTES.md`, «Fontes por confirmar».
 */
const TIPOS_PONTO = [
  { k:"zcr",    n:"Zona de concentração e reserva", r:"art. 32.º, n.º 1, al. b)", cor:"#4E8B6E" },
  { k:"za",     n:"Zona de apoio",                  r:"art. 32.º, n.º 1, al. b)", cor:"#4E8B6E" },
  { k:"pt",     n:"Ponto de trânsito",              r:"art. 32.º, n.º 1, al. b); DON 2, 7.d.(5), (7) e (8)", cor:"#B08A2E" },
  { k:"agua",   n:"Ponto de água",                  r:"fonte por confirmar", cor:"#3E7CB1" },
  { k:"sens",   n:"Ponto sensível",                 r:"art. 28.º; art. 27.º, n.º 1, al. b)", cor:"#B84B3F" },
  { k:"outro",  n:"Outro ponto notável",            r:"sem designação legal fixada", cor:"#8A9099" }
];

/** O tipo de ponto, com omissão segura para o que vier de fora. */
function defPonto(k){ return TIPOS_PONTO.find(t=>t.k === k) || TIPOS_PONTO[TIPOS_PONTO.length-1]; }

/** A lista dos pontos notáveis, sempre um array. */
function pontosLista(){
  if(!Array.isArray(O.dados.pontos)) O.dados.pontos = [];
  return O.dados.pontos;
}

/**
 * Marca um ponto notável no mapa.
 *
 * @param {string} tipo chave de TIPOS_PONTO
 * @param {number} lat
 * @param {number} lon
 * @param {string} [nome]
 */
function marcarPonto(tipo, lat, lon, nome){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de marcar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  if(!isFinite(lat) || !isFinite(lon)) return { ok:false, motivo:"Coordenada fora do mapa." };
  const d = defPonto(tipo);
  const p = { id:"p"+Date.now().toString(36), tipo:d.k, nome:String(nome||d.n),
    lat:+lat.toFixed(6), lon:+lon.toFixed(6), g:gdhAgora(), por:quemRegista(), nota:"" };
  pontosLista().push(p);
  O.evolucao.push({ g:p.g, tipo:"posit",
    txt:d.n+" marcado no mapa"+(nome? " ("+nome+")":"")+": "+fmtDec(p.lat, p.lon)+"." });
  fita(d.n+" marcado: "+fmtDec(p.lat, p.lon));
  return { ok:true, ponto:p };
}

/** Retira um ponto marcado — porque uma marca errada também é facto que se corrige. */
function apagarPonto(id){
  const L = pontosLista(), i = L.findIndex(p=>p.id === id);
  if(i < 0) return { ok:false, motivo:"Ponto não encontrado." };
  const [p] = L.splice(i, 1);
  fita("Retirada a marca de "+defPonto(p.tipo).n+" ("+fmtDec(p.lat, p.lon)+")");
  return { ok:true, ponto:p };
}

/** Dá coordenada a um setor. */
function marcarSetor(i, lat, lon){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de marcar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const e = estObj(), s = e.setores[i];
  if(!s) return { ok:false, motivo:"Setor não encontrado." };
  s.lat = String(lat.toFixed(6)); s.lon = String(lon.toFixed(6));
  O.evolucao.push({ g:gdhAgora(), tipo:"posit",
    txt:"Setor "+NOMES_SETOR[i]+" localizado em "+fmtDec(s.lat, s.lon)+"." });
  fita("Setor "+NOMES_SETOR[i]+" localizado: "+fmtDec(s.lat, s.lon));
  return { ok:true, setor:s };
}

/* ---- o desenho ---- */

/** O que se desenha por cima da carta, já em pixéis da tela. */
function camadaMapa(){
  const z = MAPA.z, ox = MAPA.cx - MAPA.larg/2, oy = MAPA.cy - MAPA.alt/2;
  const X = lo => merX(lo, z) - ox, Y = la => merY(la, z) - oy;
  const n = v => Math.round(v*10)/10;
  const P = perimObj();
  let g = "";

  if(P) P.aneis.forEach(a=>{
    const d = a.map((c,i)=>(i?"L":"M")+n(X(c[0]))+","+n(Y(c[1]))).join(" ")+" Z";
    g += '<path d="'+d+'" fill="#B84B3F" fill-opacity=".22" stroke="#B00000" stroke-width="2" stroke-linejoin="round"/>';
  });

  /* Os aglomerados detetados, recolocados por distância e rumo a partir do ponto da
     ocorrência — a mesma conta do croqui, porque é a mesma informação. */
  const lat0 = parseFloat(String(O.meta.lat).replace(",",".")),
        lon0 = parseFloat(String(O.meta.lon).replace(",","."));
  const temPonto = isFinite(lat0) && isFinite(lon0);
  const det = (O.dados.sensDet && Array.isArray(O.dados.sensDet.itens))? O.dados.sensDet.itens : [];
  if(temPonto) det.forEach(x=>{
    const p = pontoPorRumo(lat0, lon0, +x.dist, x.rumo); if(!p) return;
    const x0 = n(X(p.lon)), y0 = n(Y(p.lat));
    g += x.sens
      ? '<rect x="'+n(x0-4)+'" y="'+n(y0-4)+'" width="8" height="8" fill="#B08A2E" stroke="#fff" stroke-width="1.4"/>'
      : '<circle cx="'+x0+'" cy="'+y0+'" r="3.8" fill="#5A5A5A" stroke="#fff" stroke-width="1.4"/>';
    g += rotulo(x0+7, y0+3.5, x.nome, 9);
  });

  /* Os pontos notáveis marcados à mão. */
  pontosLista().forEach(p=>{
    const x0 = n(X(p.lon)), y0 = n(Y(p.lat)), d = defPonto(p.tipo);
    g += '<circle cx="'+x0+'" cy="'+y0+'" r="6" fill="'+d.cor+'" stroke="#fff" stroke-width="1.8"/>';
    g += rotulo(x0+9, y0+4, p.nome, 10);
  });

  /* Os setores com coordenada. */
  (estObj().setores||[]).forEach((s,i)=>{
    const la = parseFloat(String(s.lat||"").replace(",",".")), lo = parseFloat(String(s.lon||"").replace(",","."));
    if(!isFinite(la) || !isFinite(lo)) return;
    const x0 = n(X(lo)), y0 = n(Y(la));
    g += '<rect x="'+n(x0-9)+'" y="'+n(y0-9)+'" width="18" height="18" rx="3" fill="#1F4E79" stroke="#fff" stroke-width="1.8"/>';
    g += '<text x="'+x0+'" y="'+n(y0+4)+'" font-size="11" font-weight="700" text-anchor="middle" fill="#fff">'
       + esc(String(NOMES_SETOR[i]||"").slice(0,1)) + '</text>';
    g += rotulo(x0+13, y0+4, "Setor "+NOMES_SETOR[i], 10);
  });

  if(temPonto){
    const x0 = n(X(lon0)), y0 = n(Y(lat0));
    g += '<path d="M'+x0+','+n(y0-11)+' L'+n(x0+9.5)+','+n(y0+5.5)+' L'+n(x0-9.5)+','+n(y0+5.5)+' Z" fill="#005CA9" stroke="#fff" stroke-width="1.6"/>';
    g += rotulo(x0+13, y0+5, "PCO", 11, true);
  }

  /* Escala e norte, calculados na latitude do centro — em Mercator a escala muda com a
     latitude, e uma barra desenhada com a escala do equador mentiria. */
  const E = escalaRedonda(merEscala(merLat(MAPA.cy, z), z), MAPA.larg);
  const ex = 14, ey = MAPA.alt - 16;
  g += '<rect x="'+(ex-6)+'" y="'+(ey-15)+'" width="'+(E.px+62)+'" height="24" fill="#fff" fill-opacity=".78" rx="4"/>'
     + '<line x1="'+ex+'" y1="'+ey+'" x2="'+n(ex+E.px)+'" y2="'+ey+'" stroke="#1A1A1A" stroke-width="2.5"/>'
     + '<line x1="'+ex+'" y1="'+(ey-5)+'" x2="'+ex+'" y2="'+(ey+5)+'" stroke="#1A1A1A" stroke-width="2.5"/>'
     + '<line x1="'+n(ex+E.px)+'" y1="'+(ey-5)+'" x2="'+n(ex+E.px)+'" y2="'+(ey+5)+'" stroke="#1A1A1A" stroke-width="2.5"/>'
     + '<text x="'+n(ex+E.px+7)+'" y="'+(ey+4)+'" font-size="11" font-weight="700" fill="#1A1A1A">'+E.rot+'</text>';
  const nx = MAPA.larg - 22, ny = 26;
  g += '<circle cx="'+nx+'" cy="'+(ny-3)+'" r="15" fill="#fff" fill-opacity=".78"/>'
     + '<path d="M'+nx+','+(ny-15)+' L'+(nx+5)+','+(ny+2)+' L'+nx+','+(ny-2)+' L'+(nx-5)+','+(ny+2)+' Z" fill="#1A1A1A"/>'
     + '<text x="'+nx+'" y="'+(ny+14)+'" font-size="10" font-weight="700" text-anchor="middle" fill="#1A1A1A">N</text>';

  return '<svg class="mp-svg" viewBox="0 0 '+MAPA.larg+' '+MAPA.alt+'" width="'+MAPA.larg+'" height="'+MAPA.alt+'" '
    + 'xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sobreposição operacional do mapa">'+g+'</svg>';
}

/** Um rótulo legível sobre a carta: texto branco por baixo, texto escuro por cima. */
function rotulo(x, y, txt, tam, forte){
  const t = esc(String(txt||""));
  const c = 'x="'+x+'" y="'+y+'" font-size="'+tam+'"'+(forte? ' font-weight="700"':'');
  return '<text '+c+' stroke="#fff" stroke-width="3" stroke-linejoin="round" fill="none">'+t+'</text>'
       + '<text '+c+' fill="#1A1A1A">'+t+'</text>';
}

/**
 * Desenha o mapa: os mosaicos, e a camada operacional por cima.
 *
 * Os mosaicos são pedidos em paralelo e colados à medida que chegam. Um que não venha
 * deixa um quadrado vazio e conta-se; se **nenhum** vier, não se mostra um retângulo
 * cinzento a fingir que é mapa — diz-se que não há carta e fica o croqui.
 */
async function pintarMapa(){
  const cx = $("mapa-tela"); if(!cx) return;
  if(!enquadrarMapa(MAPA.larg, MAPA.alt)){ cx.innerHTML = ""; return; }

  MAPA_URLS.forEach(u=>{ try{ URL.revokeObjectURL(u); }catch(e){} });
  MAPA_URLS = [];

  const z = MAPA.z, ox = MAPA.cx - MAPA.larg/2, oy = MAPA.cy - MAPA.alt/2;
  const x0 = Math.floor(ox/MOSAICO_PX), y0 = Math.floor(oy/MOSAICO_PX);
  const x1 = Math.floor((ox+MAPA.larg)/MOSAICO_PX), y1 = Math.floor((oy+MAPA.alt)/MOSAICO_PX);
  const lim = Math.pow(2, z);

  cx.style.width = MAPA.larg+"px"; cx.style.height = MAPA.alt+"px";
  cx.innerHTML = '<div class="mp-mos"></div>' + camadaMapa();
  const fundo = cx.querySelector(".mp-mos");

  const pedidos = [];
  for(let x=x0; x<=x1; x++) for(let y=y0; y<=y1; y++){
    if(y < 0 || y >= lim) continue;
    const xw = ((x % lim) + lim) % lim;
    const img = document.createElement("img");
    img.className = "mp-t"; img.alt = ""; img.decoding = "async";
    img.style.left = (x*MOSAICO_PX - ox)+"px";
    img.style.top = (y*MOSAICO_PX - oy)+"px";
    fundo.appendChild(img);
    pedidos.push(mosaicoBlob(z, xw, y).then(b=>{
      if(!b){ img.classList.add("mp-falta"); return false; }
      const u = URL.createObjectURL(b);
      MAPA_URLS.push(u); img.src = u;
      return true;
    }));
  }

  const r = await Promise.all(pedidos);
  const vieram = r.filter(Boolean).length;
  MAPA.falhas = r.length - vieram;
  MAPA.pronto = vieram > 0;
  pintarEstadoMapa(vieram, r.length);
}

/** A linha por baixo do mapa: a atribuição, o que veio e o que não veio. */
function pintarEstadoMapa(vieram, total){
  const el = $("mapa-info"); if(!el) return;
  const c = cartaAtual();
  const partes = [c.atrib + " — " + c.termos];
  if(!MAPA.pronto) partes.push("Sem carta: nenhum mosaico veio da rede nem do arquivo local. Fica o croqui, que não precisa de rede.");
  else if(MAPA.falhas) partes.push(MAPA.falhas+" de "+total+" quadrados não vieram — o mapa está incompleto.");
  partes.push("Ampliação "+MAPA.z+" · "+Math.round(merEscala(merLat(MAPA.cy, MAPA.z), MAPA.z))+" m por pixel."
    + " Mapa de apoio à decisão: não substitui a carta militar nem serve para navegação.");
  el.innerHTML = partes.map(t=>'<div>'+esc(t)+'</div>').join("");
}

/** Mostra ou esconde o cartão do mapa consoante haja o que enquadrar. */
function pintarMapaCartao(){
  const box = $("mapa-box"); if(!box) return;
  const ha = !!enquadrarCroqui(640, 420);
  box.style.display = ha? "block" : "none";
  if(!ha){ MAPA.pronto = false; return; }
  pintarAlvos();
  if(MAPA.pronto || MAPA.z) { try{ pintarMapa(); }catch(e){} }
}

/** As opções de «marcar no mapa»: os setores declarados e os tipos de ponto. */
function pintarAlvos(){
  const sel = $("mapa-alvo"); if(!sel) return;
  const e = estObj();
  const antes = sel.value;
  sel.innerHTML = '<option value="">— clicar no mapa não marca nada —</option>'
    + '<option value="occ">Ponto da ocorrência (PCO)</option>'
    + (e.setores||[]).map((s,i)=>'<option value="s:'+i+'">Setor '+esc(NOMES_SETOR[i])+(s.lat? " (já marcado)":"")+'</option>').join("")
    + TIPOS_PONTO.map(t=>'<option value="t:'+t.k+'">'+esc(t.n)+' — '+esc(t.r)+'</option>').join("");
  if([...sel.options].some(o=>o.value === antes)) sel.value = antes;
}

/** A lista do que está marcado, com o GDH e por quem, e um botão para retirar. */
function pintarPontos(){
  const el = $("mapa-pontos"); if(!el) return;
  const L = pontosLista(), e = estObj();
  const setores = (e.setores||[]).map((s,i)=>({s,i})).filter(x=>x.s.lat && x.s.lon);
  if(!L.length && !setores.length){
    el.innerHTML = '<p class="hint">Nada marcado. Escolhe o que marcar e clica no mapa.</p>';
    return;
  }
  el.innerHTML = setores.map(({s,i})=>
      '<div class="mp-li"><b>Setor '+esc(NOMES_SETOR[i])+'</b><span class="mono">'+esc(fmtDec(s.lat, s.lon))+'</span>'
      + '<button type="button" class="lk" data-desmarcar-setor="'+i+'">retirar a coordenada</button></div>').join("")
    + L.map(p=>
      '<div class="mp-li"><b>'+esc(p.nome)+'</b> <span class="hint">'+esc(defPonto(p.tipo).n)+' · '+esc(defPonto(p.tipo).r)+'</span>'
      + '<span class="mono">'+esc(fmtDec(p.lat, p.lon))+'</span>'
      + '<span class="hint">'+esc(p.g)+(p.por? " · "+esc(p.por):"")+'</span>'
      + '<button type="button" class="lk" data-apagar-ponto="'+esc(p.id)+'">retirar</button></div>').join("");
  el.querySelectorAll("[data-apagar-ponto]").forEach(b=>b.addEventListener("click", ()=>{
    const r = apagarPonto(b.dataset.apagarPonto);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    persistir(false); pintarPontos(); pintarMapa(); pintarCroqui();
  }));
  el.querySelectorAll("[data-desmarcar-setor]").forEach(b=>b.addEventListener("click", ()=>{
    const s = estObj().setores[+b.dataset.desmarcarSetor];
    if(!s) return;
    s.lat = ""; s.lon = "";
    fita("Retirada a coordenada do setor "+NOMES_SETOR[+b.dataset.desmarcarSetor]);
    persistir(false); pintarPontos(); pintarAlvos(); pintarMapa();
  }));
}

/** O que um clique no mapa faz, consoante o alvo escolhido. */
function cliqueNoMapa(px, py){
  const alvo = ($("mapa-alvo")||{}).value || "";
  if(!alvo) return;
  const z = MAPA.z, ox = MAPA.cx - MAPA.larg/2, oy = MAPA.cy - MAPA.alt/2;
  const lon = merLon(ox + px, z), lat = merLat(oy + py, z);

  if(alvo === "occ"){
    if(!podeFazer("escrever")){ aviso("mapa-msg","err",motivoPerfil("escrever")); return; }
    O.meta.lat = lat.toFixed(6); O.meta.lon = lon.toFixed(6);
    marcarOrigemCoord("marcada no mapa");
    escreverForm();
    fita("Ponto da ocorrência marcado no mapa: "+fmtDec(lat, lon));
    aviso("mapa-msg","ok","Ponto da ocorrência em "+fmtDec(lat, lon)+".");
  } else if(alvo.startsWith("s:")){
    const r = marcarSetor(+alvo.slice(2), lat, lon);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    aviso("mapa-msg","ok","Setor "+NOMES_SETOR[+alvo.slice(2)]+" em "+fmtDec(lat, lon)+".");
  } else {
    const t = defPonto(alvo.slice(2));
    const nome = String(($("mapa-nome")||{}).value || "").trim();
    const r = marcarPonto(t.k, lat, lon, nome);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    if($("mapa-nome")) $("mapa-nome").value = "";
    aviso("mapa-msg","ok",t.n+" marcado em "+fmtDec(lat, lon)+".");
  }
  persistir(false);
  pintarAlvos(); pintarPontos(); pintarMapa(); pintarCroqui();
}

/* ---- ligação ao ecrã ----
   O mapa **não se carrega sozinho**. Um PCO trabalha com ligação intermitente e por
   vezes tarifada; pedir dezenas de quadrados de carta assim que a página abre é gastar
   a ligação de alguém sem ela ter pedido nada. Carrega-se a pedido, e depois fica. */

/** Ajusta a tela à largura disponível, sem passar do que cabe. */
function medirMapa(){
  /* Mede-se uma caixa vizinha de largura normal, e não o contentor da tela: esse
     encolhe até ela (`width:fit-content`), e medi-lo era medir a largura de ontem — o
     mapa ia estreitando a cada carregamento. Também não serve o cartão: traz o
     enchimento, e a tela ficava mais larga do que o espaço, a ser esmagada pela folha
     de estilo enquanto os mosaicos ficavam no tamanho natural. */
  const ref = $("mapa-info") || $("mapa-box"); if(!ref) return;
  const disp = Math.floor(ref.getBoundingClientRect().width) || 640;
  MAPA.larg = Math.max(280, Math.min(disp, 980));
  /* A altura é decidida pelo enquadramento, que conhece a forma do teatro. Aqui fica só
     o teto: um mapa mais alto do que o ecrã obrigaria a rolar para o ver inteiro. */
  MAPA.alt = 620;
}

/** Muda a ampliação mantendo o centro, dentro do que a carta dá. */
function ampliarMapa(d){
  const z = Math.max(3, Math.min((cartaAtual().zMax)||19, MAPA.z + d));
  if(z === MAPA.z) return;
  const lat = merLat(MAPA.cy, MAPA.z), lon = merLon(MAPA.cx, MAPA.z);
  MAPA.z = z; MAPA.cx = merX(lon, z); MAPA.cy = merY(lat, z);
  pintarMapa();
}

$("mapa-carregar").addEventListener("click", async ()=>{
  medirMapa();
  if(!enquadrarMapa(MAPA.larg, MAPA.alt)){ aviso("mapa-msg","err","Sem perímetro e sem ponto da ocorrência não há o que enquadrar."); return; }
  aviso("mapa-msg","ok","A pedir a carta...");
  await pintarMapa();
  pintarPontos();
  await pintarArquivoMapa();
  if(MAPA.pronto) aviso("mapa-msg","ok","Carta carregada. Escolhe o que marcar e clica no mapa.");
  else aviso("mapa-msg","err","Sem carta: nem a rede nem o arquivo local deram um único quadrado. O croqui continua a servir.");
});
$("mapa-mais").addEventListener("click", ()=>ampliarMapa(+1));
$("mapa-menos").addEventListener("click", ()=>ampliarMapa(-1));
$("mapa-enquadrar").addEventListener("click", ()=>{ medirMapa(); enquadrarMapa(MAPA.larg, MAPA.alt); pintarMapa(); });
$("mapa-esquecer").addEventListener("click", async ()=>{
  const n = await esquecerMosaicos();
  await pintarArquivoMapa();
  aviso("mapa-msg","ok", n? n+" quadrados de carta esquecidos." : "Não havia carta guardada.");
});

/** Diz quanta carta está guardada — é espaço no disco de quem trabalha. */
async function pintarArquivoMapa(){
  const el = $("mapa-arquivo"); if(!el) return;
  const a = await mosaicosGuardados();
  el.textContent = a.n
    ? a.n+" quadrados guardados"+(a.desde? ", o mais antigo de "+gdhDe(a.desde) : "")+" — servem sem rede."
    : "Nada guardado ainda.";
}

/* Arrastar para deslocar, clicar para marcar. Distinguem-se pela distância percorrida:
   um clique com o rato a tremer três pixéis continua a ser um clique. */
(function ligarMapa(){
  const tela = $("mapa-tela"); if(!tela) return;
  let a = null;
  tela.addEventListener("pointerdown", ev=>{
    a = { x:ev.clientX, y:ev.clientY, cx:MAPA.cx, cy:MAPA.cy, mov:0 };
    tela.setPointerCapture(ev.pointerId);
  });
  tela.addEventListener("pointermove", ev=>{
    if(!a) return;
    const dx = ev.clientX - a.x, dy = ev.clientY - a.y;
    a.mov = Math.max(a.mov, Math.abs(dx)+Math.abs(dy));
    MAPA.cx = a.cx - dx; MAPA.cy = a.cy - dy;
    const svg = tela.querySelector(".mp-svg"), mos = tela.querySelector(".mp-mos");
    /* Enquanto se arrasta desloca-se o que já está desenhado, que é imediato; os
       quadrados novos vêm quando o dedo levanta. Redesenhar a cada movimento pedia
       carta à rede dezenas de vezes por segundo. */
    if(mos) mos.style.transform = "translate("+dx+"px,"+dy+"px)";
    if(svg) svg.style.transform = "translate("+dx+"px,"+dy+"px)";
  });
  const largar = ev=>{
    if(!a) return;
    const mov = a.mov, r = tela.getBoundingClientRect();
    a = null;
    if(mov > 4){ pintarMapa(); return; }
    cliqueNoMapa(ev.clientX - r.left, ev.clientY - r.top);
  };
  tela.addEventListener("pointerup", largar);
  tela.addEventListener("pointercancel", ()=>{ a = null; pintarMapa(); });
})();
