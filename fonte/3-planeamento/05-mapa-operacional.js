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
 * O serviço de mosaicos em uso. Nulo enquanto não for configurado — e é o que está.
 *
 * **A primeira versão vinha com `tile.openstreetmap.org` escrito no código, e estava
 * errada.** Aquele serviço é dos voluntários do OpenStreetMap, para uso do próprio
 * OpenStreetMap, e a política de uso exige que a aplicação se identifique num cabeçalho
 * `User-Agent` ou `Referer` próprio. Uma página aberta em `file://` não pode fazer nem
 * uma coisa nem outra: o navegador manda a sua própria identificação e origem nula. O
 * servidor responde com um mosaico que diz «Access blocked», e a aplicação colava-o como
 * se fosse carta.
 *
 * Não é defeito de código: era uma escolha ilegítima. Por isso **não vem serviço nenhum
 * configurado de origem**. Nenhum serviço público de mosaicos que se conheça permita uso
 * anónimo a partir de ficheiro local está confirmado, e escolher um seria dar por
 * assente o que não está — a mesma regra que vale para as designações de canal e para os
 * números de artigo.
 *
 * O endereço, a atribuição e os termos declaram-se na aplicação e ficam guardados **no
 * dispositivo**, não na ocorrência: é definição do posto, como o tema. A VCOC ou a
 * Direção-Geral do Território indicam o serviço; enquanto não indicarem, fica o croqui,
 * que não precisa de rede nem de licença de ninguém.
 *
 * @type {null|{tipo:string, atrib:string, termos:string, zMin:number, zMax:number, por:string, g:string, [outro:string]:any}}
 */
let CARTA = null;
const CARTA_CHAVE = "peaapp:carta";

/** Lê o serviço configurado neste dispositivo. */
async function carregarCarta(){
  try{
    const r = await ARMAZEM.get(CARTA_CHAVE);
    const c = JSON.parse(r.value);
    /* Duas espécies válidas: o modelo `{z}/{x}/{y}` escrito à mão, e o WMTS lido de um
       GetCapabilities. Uma declaração que não seja nem uma nem outra ignora-se — vale
       mais ficar sem carta do que pedir mosaicos a um endereço que não se percebe. */
    if(c && c.tipo === "wmts" && c.camada && (c.modelo || c.kvp)) CARTA = c;
    else if(c && typeof c.u === "string" && c.u.includes("{z}")) CARTA = Object.assign({tipo:"xyz", zMin:3}, c);
  }catch(e){ CARTA = null; }
  return CARTA;
}

/**
 * Declara o serviço de mosaicos.
 *
 * Exige a atribuição e os termos, e não por formalidade: uma carta de terceiros mostrada
 * sem dizer de quem é não se pode mostrar. Quem configura fica registado, porque é uma
 * decisão do posto e não um acaso.
 */
async function guardarCarta(u, atrib, termos, zMax){
  const url = String(u||"").trim();
  if(!/^https:\/\//.test(url)) return { ok:false, motivo:"O endereço tem de começar por https://." };
  if(!(url.includes("{z}") && url.includes("{x}") && url.includes("{y}")))
    return { ok:false, motivo:"O endereço tem de trazer {z}, {x} e {y} — é o esquema de mosaicos." };
  const a = String(atrib||"").trim();
  if(a.length < 4) return { ok:false, motivo:"Indicar a atribuição que a licença do serviço obriga a mostrar." };
  const t = String(termos||"").trim();
  if(!/^https:\/\//.test(t)) return { ok:false, motivo:"Indicar o endereço dos termos de uso do serviço." };
  const z = Math.max(3, Math.min(22, parseInt(String(zMax||"19"), 10) || 19));
  CARTA = { tipo:"xyz", u:url, atrib:a, termos:t, zMin:3, zMax:z, por:quemRegista(), g:gdhAgora() };
  try{ await ARMAZEM.set(CARTA_CHAVE, JSON.stringify(CARTA)); }catch(e){}
  fita("Serviço de mosaicos declarado: "+a);
  return { ok:true, carta:CARTA };
}

/**
 * Adota como carta uma camada de um serviço WMTS já lido.
 *
 * Não pede atribuição nem termos a quem escolhe: vêm do próprio serviço, que é quem os
 * tem de declarar. Pedi-los à mão seria pedir a quem escolhe que copiasse o que já está
 * escrito no documento — e copiar mal.
 */
async function adotarCartaWMTS(carta){
  if(!carta || carta.tipo !== "wmts") return { ok:false, motivo:"Carta inválida." };
  if(!carta.atrib) return { ok:false, motivo:"O serviço não declara atribuição, e carta de terceiros não se mostra sem dizer de quem é." };
  CARTA = carta;
  try{ await ARMAZEM.set(CARTA_CHAVE, JSON.stringify(CARTA)); }catch(e){}
  fita("Carta WMTS adotada: "+carta.camadaTitulo+" ("+carta.atrib+")");
  return { ok:true, carta:CARTA };
}

/** Retira o serviço configurado, e com ele os mosaicos que dele vieram. */
async function retirarCarta(){
  CARTA = null;
  try{ await ARMAZEM.del(CARTA_CHAVE); }catch(e){}
  await esquecerMosaicos();
  return { ok:true };
}

/** Lado do mosaico, em pixéis. É o do esquema de mosaicos, não uma escolha nossa. */
const MOSAICO_PX = 256;
/** Ao fim de quanto tempo um mosaico guardado se considera velho. */
const MOSAICO_DIAS = 60;

/* ---- as grelhas de mosaicos ----
   Um mapa de mosaicos é uma projeção mais uma grelha: onde começa, que resolução tem cada
   nível, e de que tamanho são os quadrados. Estão aqui as duas que interessam, declaradas,
   e o resto do módulo trabalha em **pixéis da grelha em uso** sem saber qual é.

   Não é «dois motores» — é um motor com a grelha como parâmetro. Tinha de ser assim de
   qualquer modo: o serviço `{z}/{x}/{y}` é Web Mercator por definição, e a cartografia
   oficial portuguesa é PT-TM06. Escolher uma só deixava a outra de fora.

   Repare-se que nenhuma delas é a projeção do croqui, que é equirrectangular local e
   desenha sozinho. Aqui o que se desenha vai por cima de mosaicos já projetados, e tem de
   ir na projeção deles ou fica ao lado do sítio. */
const GRELHAS = {
  /* A do esquema de mosaicos do OpenStreetMap, e de quase toda a cartografia da Internet. */
  mercator: {
    k:"mercator", crs:"EPSG:3857", n:"Web Mercator",
    /* O mundo inteiro num quadrado, e por isso a origem é a mesma em qualquer nível. */
    para:(lat, lon, z)=>{
      const f = Math.min(Math.max(Math.sin(lat*Math.PI/180), -0.9999), 0.9999);
      const n = MOSAICO_PX * Math.pow(2, z);
      return { x:((lon+180)/360)*n, y:(0.5 - Math.log((1+f)/(1-f))/(4*Math.PI))*n };
    },
    de:(x, y, z)=>{
      const n = MOSAICO_PX * Math.pow(2, z);
      const t = Math.PI * (1 - 2*y/n);
      return { lat:180/Math.PI * Math.atan(0.5*(Math.exp(t) - Math.exp(-t))), lon:x/n*360 - 180 };
    },
    /* A escala varia com a latitude: a 41° N o metro do mapa vale 0,755 do metro do
       terreno, e uma barra de escala desenhada sem isto mentiria em 32 %. */
    escala:(lat, z)=>156543.03392 * Math.cos(lat*Math.PI/180) / Math.pow(2, z),
    zMin:3, zMax:19
  },
  /* A da cartografia oficial portuguesa. Origem no canto superior esquerdo da folha, em
     metros de PT-TM06, e resolução que não depende da latitude — o metro do mapa é o
     metro do terreno em toda a folha, que é o que se quer para ler distâncias de manobra. */
  pttm06: {
    k:"pttm06", crs:"EPSG:3763", n:"PT-TM06 (ETRS89)",
    /* Declarados pelo serviço da DGT no conjunto `PTTM_06`: o canto e a escala do nível 0.
       O nível 0 dá 615 000 m redondos de lado, que é a folha do continente. */
    E0:-170000, N0:290000, escala0:8579799.10714,
    res(z){ return this.escala0 * WMTS_PIXEL_OGC / Math.pow(2, z); },
    /* **A Transversa de Mercator não é separável**: a coordenada Este depende também da
       latitude, e a Norte também da longitude. A primeira versão projetou cada eixo
       sozinho — `paraTM06(0, lon)` para o Este — e a ida e volta de um ponto do Douro
       saiu a trinta quilómetros do sítio. O par entra e sai junto. */
    para(lat, lon, z){
      const c = paraTM06(lat, lon), r = this.res(z);
      return { x:(c.E - this.E0)/r, y:(this.N0 - c.N)/r };
    },
    de(x, y, z){
      const r = this.res(z);
      return deTM06(this.E0 + x*r, this.N0 - y*r);
    },
    escala(lat, z){ return this.res(z); },
    zMin:0, zMax:19
  }
};

/** O pixel normalizado da OGC, 0,28 mm: é o que liga um denominador de escala a metros. */
const WMTS_PIXEL_OGC = 0.00028;

/**
 * Quantas camadas de um serviço se pintam de uma vez.
 *
 * Vinte cabem num ecrã de posto sem obrigar a percorrer a página. Acima disso aparece o
 * campo de procura, e diz-se quantas ficaram de fora — que é diferente de não as ter.
 */
const WMTS_LISTA_MAX = 20;

/**
 * A grelha em que o mapa está a trabalhar.
 *
 * Decide-a a carta: um serviço `{z}/{x}/{y}` é Web Mercator por definição, um WMTS traz a
 * sua no conjunto de matrizes. Sem carta fica a portuguesa, que é a do teatro onde esta
 * aplicação trabalha.
 */
function grelhaAtual(){
  if(CARTA && CARTA.grelha && GRELHAS[CARTA.grelha]) return GRELHAS[CARTA.grelha];
  if(CARTA && CARTA.tipo === "xyz") return GRELHAS.mercator;
  return GRELHAS.pttm06;
}

/* Os nomes curtos que o resto do módulo usa. A projeção da grelha corrente, e nada mais:
   quem desenha não precisa de saber em que sistema está. Entram e saem **em par**, porque
   nem todas as projeções deixam separar os eixos. */
/** O pixel da grelha de um ponto, ao nível `z`. */
function gPara(lat, lon, z){ return grelhaAtual().para(lat, lon, z); }
/** O ponto de um pixel da grelha. */
function gDe(x, y, z){ return grelhaAtual().de(x, y, z); }
/** Metros por pixel, à latitude dada quando a grelha o exigir. */
function gEscala(lat, z){ return grelhaAtual().escala(lat, z); }

/* ---- o estado da vista ----
   Não é estado da ocorrência: é para onde a pessoa está a olhar. Não se grava e não vai
   no PEA. O que vai no PEA é o croqui, que é o desenho e não a vista. */
const MAPA = { z:0, cx:0, cy:0, larg:0, alt:0, alvo:"", pronto:false, falhas:0, recusados:0 };
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
  /* A caixa do croqui é o ponto de partida — é lá que está a regra da extensão mínima —,
     mas **não chega**: o croqui não desenha frentes nem limites de setor, e o mapa desenha.
     Uma frente traçada fora daquela caixa ficava fora do ecrã, e o cartão do mapa nem
     abria numa ocorrência que só tivesse frentes traçadas. Alarga-se aqui, num sítio só. */
  const Q0 = enquadrarCroqui(larg||MAPA.larg||640, altMax||MAPA.alt||420);
  const Q = Q0 || { minLat:Infinity, maxLat:-Infinity, minLon:Infinity, maxLon:-Infinity };
  const juntar = (la, lo)=>{
    if(!Number.isFinite(la) || !Number.isFinite(lo)) return;
    if(la < Q.minLat) Q.minLat = la; if(la > Q.maxLat) Q.maxLat = la;
    if(lo < Q.minLon) Q.minLon = lo; if(lo > Q.maxLon) Q.maxLon = lo;
  };
  frentesLista().forEach(f=>(f.linha||[]).forEach(c=>juntar(c[1], c[0])));
  (estObj().setores||[]).forEach((_,i)=>{ const a = limiteSetor(i); if(a) a.forEach(c=>juntar(c[1], c[0])); });
  if(!Number.isFinite(Q.minLat) || !Number.isFinite(Q.minLon)) return false;
  /* Sem a caixa do croqui, a regra da extensão mínima não passou por aqui: um par de
     frentes muito juntas dava uma escala absurda, como daria um ponto sozinho. */
  if(!Q0){
    const MIN = 2000, mLat = 111320, mLon = 111320*Math.cos((Q.minLat+Q.maxLat)/2*Math.PI/180);
    const abrir = (min, max, mPorGrau)=>{
      const falta = MIN - (max-min)*mPorGrau;
      if(falta <= 0) return [min, max];
      const meio = (min+max)/2, meia = MIN/2/mPorGrau;
      return [meio-meia, meio+meia];
    };
    [Q.minLat, Q.maxLat] = abrir(Q.minLat, Q.maxLat, mLat);
    [Q.minLon, Q.maxLon] = abrir(Q.minLon, Q.maxLon, mLon);
  }
  MAPA.larg = larg || MAPA.larg || 640;
  /* A altura segue a proporção do teatro, e não uma proporção fixa. Um incêndio quase
     quadrado numa tela deitada obrigava a afastar até caber na altura, e metade do mapa
     ficava vazia dos lados — via-se o dobro do que interessa e metade do detalhe. */
  const zRef = 14;
  /* Os cantos da caixa projetam-se como **pontos**. Tomar o Este do canto direito com a
     latitude do esquerdo dá um retângulo que não é o do teatro. */
  const sd = gPara(Q.maxLat, Q.maxLon, zRef), ie = gPara(Q.minLat, Q.minLon, zRef);
  const lg = Math.max(1, Math.abs(sd.x - ie.x));
  const al = Math.max(1, Math.abs(ie.y - sd.y));
  const teto = altMax || 620, prop = al/lg;
  let L = MAPA.larg, A = Math.round(L*prop);
  /* Quando a altura ideal não cabe, é a largura que cede — e não a proporção. Deixar a
     largura toda e cortar só a altura punha o teatro num retângulo deitado com margens
     vazias dos dois lados, que é ver menos detalhe do que a tela dava. */
  if(A > teto){ A = teto; L = Math.round(A/prop); }
  MAPA.larg = Math.max(280, L);
  MAPA.alt = Math.max(260, A);
  const zMax = cartaZMax();
  /* O maior nível de ampliação em que a caixa ainda cabe na tela. */
  let z = cartaZMin();
  const zMin = cartaZMin();
  for(let t=zMax; t>=zMin; t--){
    const A = gPara(Q.maxLat, Q.maxLon, t), B = gPara(Q.minLat, Q.minLon, t);
    const w = Math.abs(A.x - B.x), h = Math.abs(B.y - A.y);
    if(w <= MAPA.larg && h <= MAPA.alt){ z = t; break; }
  }
  MAPA.z = z;
  const C = gPara((Q.minLat+Q.maxLat)/2, (Q.minLon+Q.maxLon)/2, z);
  MAPA.cx = C.x; MAPA.cy = C.y;
  return true;
}

/**
 * O endereço de um mosaico. Vazio sem serviço configurado.
 *
 * Duas espécies de serviço, e a diferença não é de detalhe: no `xyz` a coluna vem antes da
 * linha e o nível é um número; no `wmts` é ao contrário, e o nível tem o nome que o
 * serviço lhe deu. Trocá-los desenha a carta noutro sítio do mundo.
 */
function mosaicoURL(z, x, y){
  if(!CARTA) return "";
  if(CARTA.tipo === "wmts") return wmtsEndereco(CARTA, z, x, y);
  return CARTA.u.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
}

/* Sem carta declarada, os limites são os da grelha e não um par de números escritos à
   mão. Estavam fixos em 3 e 19, que são os do Web Mercator: na grelha portuguesa o nível
   0 já é a folha do continente, e recusá-lo afastava o enquadramento sem razão. */
/** O menor nível de ampliação que a carta em uso dá. */
function cartaZMin(){ return (CARTA && isFinite(CARTA.zMin))? CARTA.zMin : grelhaAtual().zMin; }
/** O maior. Sem carta, o da grelha em uso. */
function cartaZMax(){ return (CARTA && isFinite(CARTA.zMax))? CARTA.zMax : grelhaAtual().zMax; }

/** A chave de um mosaico no arquivo local. Uma só, seja qual for a sua proveniência. */
function chaveMosaico(z, x, y){ return "m/"+z+"/"+x+"/"+y; }

/**
 * Uma impressão digital dos bytes de um mosaico, para reconhecer o que se repete.
 *
 * Um servidor que recusa o pedido responde muitas vezes com **a mesma imagem para todos
 * os quadrados** — a que diz «Access blocked», por exemplo. Isso chega ao ecrã como se
 * fosse carta, e a aplicação dizia que o mapa estava completo. Mosaicos diferentes de
 * sítios diferentes não são byte a byte iguais; se três o forem, não é carta.
 *
 * FNV-1a, que não é criptográfica e não precisa de o ser: aqui só se pergunta se dois
 * blocos de bytes são o mesmo bloco.
 */
async function impressaoMosaico(b){
  try{
    const v = new Uint8Array(await b.arrayBuffer());
    let h = 0x811c9dc5;
    for(let i=0;i<v.length;i++){ h ^= v[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16)+"-"+v.length;
  }catch(e){ return ""; }
}

/**
 * Um mosaico, do arquivo local ou do serviço configurado.
 *
 * O arquivo primeiro, sempre: é o que permite trabalhar sem rede, e é para lá que vai a
 * carta pré-descarregada. Sem serviço configurado, não se pede nada a ninguém.
 *
 * @returns {Promise<Blob|null>}
 */
async function mosaicoBlob(z, x, y){
  const chave = chaveMosaico(z, x, y);
  if(IDB){
    try{
      const g = await _idb("mosaicos", "readonly", st=>st.get(chave));
      /* A carta carregada de ficheiro não caduca: foi posta ali de propósito, para o
         teatro, e apagá-la ao fim de dois meses seria dar cabo do que se preparou. */
      if(g && g.b && (g.local || (Date.now() - (g.ts||0)) < MOSAICO_DIAS*86400000)) return g.b;
    }catch(e){}
  }
  if(!CARTA) return null;
  try{
    const r = await fetchT(mosaicoURL(z, x, y), {}, 12000);
    if(!r.ok) return null;
    const b = await r.blob();
    /* Não se guarda já: só depois de se saber que é carta e não uma recusa repetida.
       Guardar a recusa seria ficar com ela no arquivo a servir sem rede. */
    return b;
  }catch(e){ return null; }
}

/** Guarda um mosaico vindo do serviço, depois de reconhecido como carta. */
async function guardarMosaico(z, x, y, b){
  if(!IDB) return;
  try{ await _idb("mosaicos","readwrite", st=>st.put({b, ts:Date.now()}, chaveMosaico(z, x, y))); }catch(e){}
}

/**
 * Carrega carta pré-descarregada, de ficheiros no disco.
 *
 * É o caminho que a especificação prevê para o agente de topografia (Fase 3): fontes
 * pré-descarregadas por distrito, para funcionar sem rede no TO. Aceita a árvore de
 * pastas do esquema de mosaicos — `.../{z}/{x}/{y}.png` —, que é como praticamente todas
 * as ferramentas de exportação as escrevem.
 *
 * @param {FileList|File[]} ficheiros
 * @returns {Promise<{n:number, ignorados:number, semArquivo:number, niveis:number[]}>}
 */
async function carregarMosaicosLocais(ficheiros){
  const L = Array.from(ficheiros||[]);
  let n = 0, semArvore = 0, semArquivo = 0;
  const niveis = new Set();
  for(const f of L){
    const t = mosaicoDoCaminho(f.webkitRelativePath || f.name);
    if(!t){ semArvore++; continue; }
    if(!IDB){ semArquivo++; continue; }
    try{
      await _idb("mosaicos","readwrite", st=>st.put({ b:f, ts:Date.now(), local:true }, chaveMosaico(t.z, t.x, t.y)));
      niveis.add(t.z); n++;
    }catch(e){ semArquivo++; }
  }
  return { n, ignorados:semArvore, semArquivo, niveis:[...niveis].sort((a,b)=>a-b) };
}

/**
 * O mosaico que um caminho de ficheiro designa, ou nada.
 *
 * Separado do carregamento para ser verificável sem base de dados: é aqui que se decide
 * o que é carta e o que é um ficheiro que veio à boleia na mesma pasta.
 *
 * @param {string} caminho
 * @returns {null|{z:number, x:number, y:number}}
 */
function mosaicoDoCaminho(caminho){
  const m = /(?:^|\/)(\d{1,2})\/(\d{1,7})\/(\d{1,7})\.(?:png|jpe?g|webp)$/i.exec(String(caminho||""));
  if(!m) return null;
  const z = +m[1];
  return (z >= 0 && z <= 22)? { z, x:+m[2], y:+m[3] } : null;
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
  /* Se houver limites traçados, diz-se em que setor o ponto caiu. É a pergunta que se faz
     a seguir a marcar — «isso é de quem?» — e a resposta está na geometria que já existe.
     Sem limites traçados não se diz nada, em vez de dizer «setor desconhecido», que daria
     a entender que havia setores e o ponto não caiu em nenhum. */
  const iS = setorDoPonto(p.lat, p.lon);
  const noSetor = iS >= 0 ? ", no setor "+NOMES_SETOR[iS] : "";
  p.setor = iS >= 0 ? NOMES_SETOR[iS] : "";
  O.evolucao.push({ g:p.g, tipo:"posit",
    txt:d.n+" marcado no mapa"+(nome? " ("+nome+")":"")+": "+fmtDec(p.lat, p.lon)+noSetor+"." });
  fita(d.n+" marcado: "+fmtDec(p.lat, p.lon)+noSetor);
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
  /* Cada ponto projeta-se de uma vez, e devolve o pixel do ecrã. `P` já é o perímetro. */
  const pxy = (la, lo) => { const q = gPara(la, lo, z); return { x:q.x - ox, y:q.y - oy }; };
  const n = v => Math.round(v*10)/10;
  const P = perimObj();
  let g = "";

  if(P) P.aneis.forEach(a=>{
    const d = a.map((c,i)=>{ const q = pxy(c[1], c[0]); return (i?"L":"M")+n(q.x)+","+n(q.y); }).join(" ")+" Z";
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
    const q = pxy(p.lat, p.lon), x0 = n(q.x), y0 = n(q.y);
    g += x.sens
      ? '<rect x="'+n(x0-4)+'" y="'+n(y0-4)+'" width="8" height="8" fill="#B08A2E" stroke="#fff" stroke-width="1.4"/>'
      : '<circle cx="'+x0+'" cy="'+y0+'" r="3.8" fill="#5A5A5A" stroke="#fff" stroke-width="1.4"/>';
    g += rotulo(x0+7, y0+3.5, x.nome, 9);
  });

  /* As linhas de contenção e de apoio. Traço diferente por espécie, como na carta anotada:
     a de contenção a cheio quando está aberta e a tracejado enquanto está por abrir — que é
     a diferença entre o que está no terreno e o que está no plano. */
  linhasLista().forEach(l=>{
    if(!Array.isArray(l.linha) || l.linha.length < 2) return;
    const d = defLinha(l.tipo);
    const q = l.linha.map(c=>pxy(c[1], c[0]));
    g += '<path d="'+q.map((p,k)=>(k?"L":"M")+n(p.x)+","+n(p.y)).join(" ")
       + '" fill="none" stroke="'+d.cor+'" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"'
       + (l.aberta? "" : ' stroke-dasharray="9 5"')+'/>';
    const meio = q[Math.floor(q.length/2)];
    g += rotulo(meio.x + 8, meio.y - 6,
      (d.obra? "Contenção" : "Apoio") + (l.larguraM? " "+String(l.larguraM).replace(".", ",")+" m" : "")
      + (d.obra && !l.aberta? " (por abrir)" : ""), 9.5);
  });

  /* As frentes de fogo, por cima dos limites e por baixo dos pontos: são a informação
     mais viva do mapa e não podem ficar escondidas, mas também não devem tapar uma marca. */
  frentesLista().forEach(f=>{
    if(!Array.isArray(f.linha) || f.linha.length < 2) return;
    const d = defFrente(f.tipo);
    const q = f.linha.map(c=>pxy(c[1], c[0]));
    g += '<path d="'+q.map((p,k)=>(k?"L":"M")+n(p.x)+","+n(p.y)).join(" ")
       + '" fill="none" stroke="'+d.cor+'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
    /* A seta de progressão sai do meio da linha, na direção do rumo. Uma seta por frente e
       não uma por segmento: o rumo é da frente inteira, e uma seta em cada vértice daria a
       entender que cada troço progride para o seu lado. */
    if(f.rumo !== null && isFinite(f.rumo) && d.avanca){
      const meio = q[Math.floor(q.length/2)];
      const a = (f.rumo - 90) * Math.PI/180;
      const ux = Math.cos(a), uy = Math.sin(a), L = 26;
      const x1 = meio.x + ux*L, y1 = meio.y + uy*L;
      g += '<path d="M'+n(meio.x)+','+n(meio.y)+' L'+n(x1)+','+n(y1)+'" stroke="'+d.cor+'" stroke-width="2.4"/>';
      /* A ponta, com as duas hastes a 150° do sentido de marcha. */
      [150, -150].forEach(ang=>{
        const b = a + ang*Math.PI/180;
        g += '<path d="M'+n(x1)+','+n(y1)+' L'+n(x1 + Math.cos(b)*9)+','+n(y1 + Math.sin(b)*9)
           + '" stroke="'+d.cor+'" stroke-width="2.4" stroke-linecap="round"/>';
      });
    }
    /* O rótulo vai para **trás** da frente, do lado que já ardeu, e não para o vértice
       inicial: duas frentes que comecem perto uma da outra punham dois rótulos em cima um
       do outro, e atrás da frente não há nada para tapar. */
    const meio0 = q[Math.floor(q.length/2)];
    const recuo = (f.rumo !== null && Number.isFinite(f.rumo) && d.avanca)
      ? { x:-Math.cos((f.rumo-90)*Math.PI/180)*16, y:-Math.sin((f.rumo-90)*Math.PI/180)*16 }
      : { x:8, y:-6 };
    g += rotulo(meio0.x + recuo.x, meio0.y + recuo.y, d.n + (f.rumo !== null? " "+Math.round(f.rumo)+"°" : ""), 10);
  });

  /* Os pontos notáveis marcados à mão. */
  pontosLista().forEach(p=>{
    const q = pxy(p.lat, p.lon), x0 = n(q.x), y0 = n(q.y), d = defPonto(p.tipo);
    g += '<circle cx="'+x0+'" cy="'+y0+'" r="6" fill="'+d.cor+'" stroke="#fff" stroke-width="1.8"/>';
    g += rotulo(x0+9, y0+4, p.nome, 10);
  });

  /* Os limites de setor, **por baixo de tudo o que se marca**: são superfície, e uma
     superfície desenhada por cima esconde os pontos que lhe estão dentro. Por isso este
     bloco vem antes na cadeia de desenho e o preenchimento é fraco. */
  (estObj().setores||[]).forEach((s,i)=>{
    const anel = limiteSetor(i); if(!anel) return;
    const d = anel.map((c,k)=>{ const q = pxy(c[1], c[0]); return (k?"L":"M")+n(q.x)+","+n(q.y); }).join(" ")+" Z";
    g += '<path d="'+d+'" fill="#1F4E79" fill-opacity=".10" stroke="#1F4E79" stroke-width="2.2"'
       + ' stroke-dasharray="7 4" stroke-linejoin="round"/>';
    /* O rótulo vai ao centróide da área, e não ao ponto do setor: o ponto é onde está o
       comando do setor, o centróide é onde a figura se lê. */
    const c = centroAnel(anel); if(!c) return;
    const q = pxy(c.lat, c.lon);
    g += '<text x="'+n(q.x)+'" y="'+n(q.y)+'" font-size="15" font-weight="700" text-anchor="middle"'
       + ' fill="#1F4E79" stroke="#fff" stroke-width="3.5" paint-order="stroke">'
       + esc(String(NOMES_SETOR[i]||"")) + '</text>';
  });

  /* O traçado em curso, se houver: os vértices já pousados e a linha entre eles. Não é
     estado da ocorrência e por isso desenha-se de outra maneira — linha fina e contínua,
     com os vértices à vista, para se distinguir de um limite fechado. */
  if(TRACO.setor >= 0 && TRACO.pontos.length){
    const q0 = TRACO.pontos.map(c=>pxy(c[1], c[0]));
    if(q0.length > 1)
      g += '<path d="'+q0.map((q,k)=>(k?"L":"M")+n(q.x)+","+n(q.y)).join(" ")
         + '" fill="none" stroke="#B00000" stroke-width="1.8"/>';
    q0.forEach(q=>{ g += '<circle cx="'+n(q.x)+'" cy="'+n(q.y)+'" r="3.4" fill="#B00000" stroke="#fff" stroke-width="1.4"/>'; });
  }

  /* Os setores com coordenada. */
  (estObj().setores||[]).forEach((s,i)=>{
    const la = parseFloat(String(s.lat||"").replace(",",".")), lo = parseFloat(String(s.lon||"").replace(",","."));
    if(!isFinite(la) || !isFinite(lo)) return;
    const q = pxy(la, lo), x0 = n(q.x), y0 = n(q.y);
    g += '<rect x="'+n(x0-9)+'" y="'+n(y0-9)+'" width="18" height="18" rx="3" fill="#1F4E79" stroke="#fff" stroke-width="1.8"/>';
    g += '<text x="'+x0+'" y="'+n(y0+4)+'" font-size="11" font-weight="700" text-anchor="middle" fill="#fff">'
       + esc(String(NOMES_SETOR[i]||"").slice(0,1)) + '</text>';
    g += rotulo(x0+13, y0+4, "Setor "+NOMES_SETOR[i], 10);
  });

  if(temPonto){
    const q = pxy(lat0, lon0), x0 = n(q.x), y0 = n(q.y);
    g += '<path d="M'+x0+','+n(y0-11)+' L'+n(x0+9.5)+','+n(y0+5.5)+' L'+n(x0-9.5)+','+n(y0+5.5)+' Z" fill="#005CA9" stroke="#fff" stroke-width="1.6"/>';
    g += rotulo(x0+13, y0+5, "PCO", 11, true);
  }

  /* Escala e norte, calculados na latitude do centro — em Mercator a escala muda com a
     latitude, e uma barra desenhada com a escala do equador mentiria. */
  const E = escalaRedonda(gEscala(gDe(MAPA.cx, MAPA.cy, z).lat, z), MAPA.larg);
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
    pedidos.push(mosaicoBlob(z, xw, y).then(async b=>{
      if(!b) return { img, ok:false };
      return { img, ok:true, b, z, x:xw, y, imp: await impressaoMosaico(b) };
    }));
  }

  const r = await Promise.all(pedidos);
  const vindos = r.filter(t=>t.ok);

  /* Quadrados diferentes com exatamente os mesmos bytes não são carta: são a mesma
     imagem de recusa repetida. Foi assim que o servidor do OpenStreetMap respondeu, e a
     aplicação colava «Access blocked» como se fosse cartografia. */
  const contas = {};
  vindos.forEach(t=>{ if(t.imp) contas[t.imp] = (contas[t.imp]||0) + 1; });
  const repetida = Object.keys(contas).find(k=>contas[k] >= 3);
  const recusados = repetida? vindos.filter(t=>t.imp === repetida) : [];
  MAPA.recusados = recusados.length;

  const carta = vindos.filter(t=>t.imp !== repetida);
  recusados.forEach(t=>t.img.classList.add("mp-falta"));
  r.filter(t=>!t.ok).forEach(t=>t.img.classList.add("mp-falta"));
  carta.forEach(t=>{
    const u = URL.createObjectURL(t.b);
    MAPA_URLS.push(u); t.img.src = u;
    guardarMosaico(t.z, t.x, t.y, t.b);
  });

  MAPA.falhas = r.length - carta.length;
  MAPA.pronto = carta.length > 0;
  pintarEstadoMapa(carta.length, r.length);
}

/** A linha por baixo do mapa: a atribuição, o que veio e o que não veio. */
function pintarEstadoMapa(vieram, total){
  const el = $("mapa-info"); if(!el) return;
  const partes = [];
  if(CARTA) partes.push(CARTA.atrib + (CARTA.termos? " — " + CARTA.termos : "")
    + (CARTA.tipo === "wmts"? " · " + CARTA.camadaTitulo + " (WMTS)" : ""));
  else if(MAPA.pronto) partes.push("Carta pré-descarregada, do arquivo deste dispositivo."
    + " A atribuição é a de quem a forneceu — não há serviço declarado que a possa dizer aqui.");
  else partes.push("Sem serviço de mosaicos configurado. A carta declara-se abaixo, ou carrega-se de ficheiro.");

  if(MAPA.recusados >= 3)
    partes.push("O serviço devolveu " + MAPA.recusados + " vezes a mesma imagem em vez de carta — está a recusar os"
      + " pedidos. Serviços de mosaicos de uso comunitário exigem que a aplicação se identifique, e uma página"
      + " aberta em ficheiro local não o consegue fazer. Usar um serviço que o posto tenha direito a consultar,"
      + " ou carta pré-descarregada.");
  else if(!MAPA.pronto && CARTA)
    partes.push("Sem carta: nenhum quadrado veio do serviço nem do arquivo local. Fica o croqui, que não precisa de rede.");
  else if(MAPA.falhas)
    partes.push(MAPA.falhas+" de "+total+" quadrados não vieram — o mapa está incompleto.");

  /* Quanto do teatro está delimitado. Um comandante que veja «412 ha de 1 260» sabe que
     dois terços da área não têm setor a quem pertençam, que é informação de comando e não
     de desenho. Só aparece quando há limites: sem eles a frase não diria nada. */
  const haSet = areaSetorizadaHa();
  if(haSet > 0){
    const P0 = perimObj();
    const total = P0 ? areaGeoJSON({ type:"Polygon", coordinates:P0.aneis }) : 0;
    partes.push("Setorizado: "+haSet+" ha"+(total > 0 ? " de "+total+" ha da ZI" : "")+".");
  }
  partes.push("Ampliação "+MAPA.z+" · "+gEscala(gDe(MAPA.cx, MAPA.cy, MAPA.z).lat, MAPA.z).toFixed(2)+" m por pixel."
    + " Mapa de apoio à decisão: não substitui a carta militar nem serve para navegação.");
  el.innerHTML = partes.map(t=>'<div>'+esc(t)+'</div>').join("");
}

/** Mostra ou esconde o cartão do mapa consoante haja o que enquadrar. */
function pintarMapaCartao(){
  const box = $("mapa-box"); if(!box) return;
  /* Pergunta-se ao enquadramento do mapa, e não ao do croqui: o mapa mostra coisas que o
     croqui não mostra, e o cartão tem de abrir para elas. */
  const ha = !!enquadrarMapa(MAPA.larg||640, MAPA.alt||420);
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
    + (e.setores||[]).map((s,i)=>'<option value="L:'+i+'">Limite do setor '+esc(NOMES_SETOR[i])
        +(limiteSetor(i)? " (traçado — recomeça)":"")+'</option>').join("")
    + '<option value="F">Frente de fogo (traçar linha)</option>'
    + TIPOS_LINHA.map(t=>'<option value="C:'+t.k+'">'+esc(t.n)+' — '+esc(t.d)+'</option>').join("")
    + TIPOS_PONTO.map(t=>'<option value="t:'+t.k+'">'+esc(t.n)+' — '+esc(t.r)+'</option>').join("");
  if([...sel.options].some(o=>o.value === antes)) sel.value = antes;
}

/**
 * A barra do traçado em curso: quantos vértices há e o que se pode fazer com eles.
 *
 * Só aparece enquanto se traça. Uma barra de botões sempre visível para uma coisa que
 * quase nunca está a acontecer é ruído no ecrã de quem está a comandar.
 */
function pintarTraco(){
  const box = $("mapa-traco"); if(!box) return;
  const ativo = tracoEmCurso();
  box.style.display = ativo ? "" : "none";
  if(!ativo){ if($("frente-op")) $("frente-op").style.display = "none"; return; }
  const n = TRACO.pontos.length, falta = faltamAoTraco();
  const eFrente = TRACO.tipo === "frente";
  const oQue = eFrente ? "A traçar uma frente"
    : TRACO.tipo === "linha" ? "A traçar uma linha"
    : "A traçar o limite do setor " + NOMES_SETOR[TRACO.setor];
  $("mapa-traco-txt").textContent = oQue
    + " — " + n + " vértice(s)" + (falta ? ", falta" + (falta > 1 ? "m " : " ") + falta + " para fechar" : "");
  $("mapa-traco-fechar").disabled = falta > 0;
  $("mapa-traco-desfazer").disabled = n < 1;

  const opL = $("linha-op");
  if(opL){
    opL.style.display = TRACO.tipo === "linha" ? "" : "none";
    if(TRACO.tipo === "linha" && !$("linha-tipo").options.length)
      $("linha-tipo").innerHTML = TIPOS_LINHA.map(t=>'<option value="'+t.k+'">'+esc(t.n)+'</option>').join("");
  }
  const op = $("frente-op");
  if(op){
    op.style.display = eFrente ? "" : "none";
    if(eFrente){
      if(!$("frente-tipo").options.length)
        $("frente-tipo").innerHTML = TIPOS_FRENTE.map(t=>'<option value="'+t.k+'">'+esc(t.n)+' — '+esc(t.r)+'</option>').join("");
      /* O rumo que o comportamento do fogo prevê aparece como **proposta**, com a hora e o
         que a sustenta. Não se escreve no campo: quem comanda é que decide se é aquele. */
      const p = rumoPrevistoDaCabeca();
      $("frente-previsto").textContent = p
        ? "A composição de declive e vento dá " + Math.round(p.rumo) + "° para a cabeça"
          + (p.hora ? " (vento mais forte da série, " + p.hora + ")" : "")
          + (p.eps ? "" : " — sem a razão declive/vento informada, é o que a geometria dá sozinha")
          + ". É uma proposta: o rumo que fica é o que for indicado aqui."
        : "Sem exposição dominante ou sem série de vento não há rumo previsto. Indicar à mão, ou deixar vazio para o traçado sugerir.";
    }
  }
}

/** A lista do que está marcado, com o GDH e por quem, e um botão para retirar. */
function pintarPontos(){
  const el = $("mapa-pontos"); if(!el) return;
  const L = pontosLista(), e = estObj();
  const setores = (e.setores||[]).map((s,i)=>({s,i})).filter(x=>x.s.lat && x.s.lon);
  const limites = (e.setores||[]).map((s,i)=>i).filter(i=>limiteSetor(i));
  const F = frentesLista(), LN = linhasLista();
  if(!L.length && !setores.length && !limites.length && !F.length && !LN.length){
    el.innerHTML = '<p class="hint">Nada marcado. Escolhe o que marcar e clica no mapa.</p>';
    return;
  }
  el.innerHTML = LN.map(l=>
      '<div class="mp-li"><b>'+esc(defLinha(l.tipo).n)+'</b>'
      + (l.setor? ' <span class="hint">setor '+esc(l.setor)+'</span>' : "")
      + '<span class="mono">'+l.m+' m</span>'
      + '<span class="mono">'+(l.larguraM? String(l.larguraM).replace(".", ",")+" m larg." : "largura por indicar")+'</span>'
      + (defLinha(l.tipo).obra
          ? '<button type="button" class="lk" data-abrir-linha="'+esc(l.id)+'">'+(l.aberta? "dar por abrir" : "dar por aberta")+'</button>' : "")
      + '<button type="button" class="lk" data-apagar-linha="'+esc(l.id)+'">retirar</button></div>').join("")
    + F.map(f=>
      '<div class="mp-li"><b>'+esc(defFrente(f.tipo).n)+'</b>'
      + (f.setor? ' <span class="hint">setor '+esc(f.setor)+'</span>' : "")
      + '<span class="mono">'+f.m+' m</span>'
      + (f.rumo !== null? '<span class="mono">'+Math.round(f.rumo)+'°</span>'
          + '<span class="hint">'+esc(f.rumoFonte)+'</span>' : '<span class="hint">sem progressão</span>')
      + '<span class="hint">'+esc(f.g)+(f.por? " · "+esc(f.por):"")+'</span>'
      + (defFrente(f.tipo).avanca
          ? '<button type="button" class="lk" data-rumo-frente="'+esc(f.id)+'">corrigir o rumo</button>' : "")
      + '<button type="button" class="lk" data-apagar-frente="'+esc(f.id)+'">retirar</button></div>').join("")
    + limites.map(i=>
      '<div class="mp-li"><b>Limite do setor '+esc(NOMES_SETOR[i])+'</b>'
      + '<span class="hint">'+(limiteSetor(i).length-1)+' vértices</span>'
      + '<span class="mono">'+areaSetorHa(i)+' ha</span>'
      + '<button type="button" class="lk" data-apagar-limite="'+i+'">retirar o limite</button></div>').join("")
    + setores.map(({s,i})=>
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
  /* A leitura da evolução lê exatamente o que esta lista mostra: repinta-se com ela, e
     não em cinco sítios diferentes. */
  try{ pintarEvolucao(); }catch(e){}
  el.querySelectorAll("[data-apagar-linha]").forEach(b=>b.addEventListener("click", ()=>{
    const r = apagarLinha(b.dataset.apagarLinha);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    persistir(false); pintarPontos(); pintarMapa();
  }));
  el.querySelectorAll("[data-abrir-linha]").forEach(b=>b.addEventListener("click", ()=>{
    const l = linhasLista().find(x=>x.id === b.dataset.abrirLinha); if(!l) return;
    const r = abrirLinha(l.id, !l.aberta);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    persistir(false); pintarPontos(); pintarMapa();
  }));
  el.querySelectorAll("[data-apagar-frente]").forEach(b=>b.addEventListener("click", ()=>{
    const r = apagarFrente(b.dataset.apagarFrente);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    persistir(false); pintarPontos(); pintarMapa();
  }));
  el.querySelectorAll("[data-rumo-frente]").forEach(b=>b.addEventListener("click", ()=>{
    const f = frentesLista().find(x=>x.id === b.dataset.rumoFrente); if(!f) return;
    const v = prompt("Rumo de progressão em graus de norte (0 a 360):", f.rumo === null? "" : String(Math.round(f.rumo)));
    if(v === null) return;
    const r = rumoDaFrente(f.id, v);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    persistir(false); pintarPontos(); pintarMapa();
  }));
  el.querySelectorAll("[data-apagar-limite]").forEach(b=>b.addEventListener("click", ()=>{
    const r = apagarLimite(+b.dataset.apagarLimite);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    persistir(false); pintarPontos(); pintarAlvos(); pintarMapa();
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
  const { lat, lon } = gDe(ox + px, oy + py, z);

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
  } else if(alvo === "F"){
    /* Como o limite: pousar um vértice não grava nada. A frente entra no estado ao fechar. */
    if(TRACO.tipo !== "frente"){
      const r0 = iniciarTraco(-1, "frente");
      if(!r0.ok){ aviso("mapa-msg","err",r0.motivo); return; }
    }
    const r = pontoDoTraco(lat, lon);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    const falta = faltamAoTraco();
    aviso("mapa-msg","ok","Frente: "+r.n+" vértice(s). "+(falta? "Falta "+falta+" para poder fechar." : "Já dá para fechar."));
    pintarTraco(); pintarMapa();
    return;
  } else if(alvo.startsWith("C:")){
    if(TRACO.tipo !== "linha"){
      const r0 = iniciarTraco(-1, "linha");
      if(!r0.ok){ aviso("mapa-msg","err",r0.motivo); return; }
      if($("linha-tipo")) $("linha-tipo").value = alvo.slice(2);
    }
    const r = pontoDoTraco(lat, lon);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    const falta = faltamAoTraco();
    aviso("mapa-msg","ok", defLinha(alvo.slice(2)).n+": "+r.n+" vértice(s). "
      + (falta? "Falta "+falta+" para poder fechar." : "Já dá para fechar."));
    pintarTraco(); pintarMapa();
    return;
  } else if(alvo.startsWith("L:")){
    /* Traçar não é marcar: um clique pousa um vértice e não grava nada. O limite só entra
       no estado quando se fecha, e por isso aqui não se persiste — persistir a meio
       gravava uma figura que ainda não existe. */
    const i = +alvo.slice(2);
    if(TRACO.setor !== i){
      const r0 = iniciarTraco(i);
      if(!r0.ok){ aviso("mapa-msg","err",r0.motivo); return; }
    }
    const r = pontoDoTraco(lat, lon);
    if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
    aviso("mapa-msg","ok","Limite do setor "+NOMES_SETOR[i]+": "+r.n+" vértice(s). "
      + (r.n >= 3 ? "Já dá para fechar." : "Faltam "+(3-r.n)+" para poder fechar."));
    pintarTraco(); pintarMapa();
    return;
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
  const z = Math.max(cartaZMin(), Math.min(cartaZMax(), MAPA.z + d));
  if(z === MAPA.z) return;
  const c = gDe(MAPA.cx, MAPA.cy, MAPA.z);
  const p = grelhaAtual().para(c.lat, c.lon, z);
  MAPA.z = z; MAPA.cx = p.x; MAPA.cy = p.y;
  pintarMapa();
}

$("mapa-traco-fechar").addEventListener("click", ()=>{
  const r = fecharTraco();
  if(!r.ok){ aviso("mapa-msg","err",r.motivo); return; }
  persistir(false);
  aviso("mapa-msg","ok", r.frente
    ? defFrente(r.frente.tipo).n+" traçada: "+r.frente.m+" m"
      + (r.frente.rumo !== null? ", rumo "+Math.round(r.frente.rumo)+"° ("+r.frente.rumoFonte+")" : "")+"."
    : r.linha ? defLinha(r.linha.tipo).n+" traçada: "+r.linha.m+" m."
    : "Limite traçado: "+r.area+" ha.");
  if($("linha-larg")) $("linha-larg").value = "";
  if($("frente-rumo")) $("frente-rumo").value = "";
  pintarTraco(); pintarAlvos(); pintarPontos(); pintarMapa();
});

$("mapa-traco-desfazer").addEventListener("click", ()=>{
  desfazerTraco(); pintarTraco(); pintarMapa();
});

$("mapa-traco-largar").addEventListener("click", ()=>{
  largarTraco();
  if($("mapa-alvo")) $("mapa-alvo").value = "";
  aviso("mapa-msg","ok","Traçado largado. Nada foi gravado.");
  pintarTraco(); pintarMapa();
});

$("mapa-carregar").addEventListener("click", async ()=>{
  medirMapa();
  if(!CARTA && !(await mosaicosGuardados()).n){
    aviso("mapa-msg","err","Sem serviço de mosaicos declarado e sem carta pré-descarregada. Ver «De onde vem a carta», aqui abaixo.");
    return;
  }
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

/* ---- o serviço de mosaicos ---- */

/** Diz qual é o serviço declarado, quem o declarou e quando. */
function pintarCarta(){
  const el = $("carta-estado"); if(!el) return;
  el.textContent = CARTA
    ? (CARTA.tipo === "wmts"
        ? "WMTS: "+CARTA.camadaTitulo+" · "+CARTA.servico+" · conjunto "+CARTA.conjunto
          + " · ampliação "+CARTA.zMin+" a "+CARTA.zMax
        : "Serviço declarado: "+CARTA.atrib+" · até à ampliação "+CARTA.zMax)
      /* Sem ninguém ao teclado o «por» vem vazio, e a frase ficava «ampliação 8 a 18 a
         310002AGO26». A hora sozinha diz-se como hora, não como continuação da frase. */
      + (CARTA.g? (CARTA.por? " · declarada por "+CARTA.por+", "+CARTA.g : " · declarada "+CARTA.g) : "")
    : "Nenhum serviço declarado. Sem serviço e sem carta pré-descarregada, fica o croqui.";
  const b = $("carta-retirar"); if(b) b.style.display = CARTA? "" : "none";
  /* Os campos abaixo são do serviço `{z}/{x}/{y}`, e só se preenchem com uma carta dessa
     espécie. Uma carta WMTS não tem endereço com `{z}` nenhum: copiá-la para ali escrevia
     «undefined» no campo e punha lá a atribuição de um serviço que não é aquele. */
  if(CARTA && CARTA.tipo === "xyz"){
    if($("carta-u") && !$("carta-u").value) $("carta-u").value = CARTA.u;
    if($("carta-atrib") && !$("carta-atrib").value) $("carta-atrib").value = CARTA.atrib;
    if($("carta-termos") && !$("carta-termos").value) $("carta-termos").value = CARTA.termos;
    if($("carta-zmax") && !$("carta-zmax").value) $("carta-zmax").value = String(CARTA.zMax);
  }
}

$("carta-guardar").addEventListener("click", async ()=>{
  const r = await guardarCarta($("carta-u").value, $("carta-atrib").value,
    $("carta-termos").value, $("carta-zmax").value);
  if(!r.ok){ aviso("carta-msg","err",r.motivo); return; }
  pintarCarta();
  aviso("carta-msg","ok","Serviço declarado. Carregar a carta para o experimentar.");
});
$("carta-retirar").addEventListener("click", async ()=>{
  await retirarCarta();
  ["carta-u","carta-atrib","carta-termos","carta-zmax"].forEach(id=>{ if($(id)) $(id).value = ""; });
  pintarCarta(); await pintarArquivoMapa();
  aviso("carta-msg","ok","Serviço retirado, e com ele os mosaicos que dele vieram.");
});

$("carta-fich").addEventListener("change", async ev=>{
  const el = $("carta-fich-info");
  if(!IDB){ el.textContent = "Este navegador não deu base de dados local: a carta pré-descarregada não pode ficar guardada."; return; }
  el.textContent = "A guardar...";
  const r = await carregarMosaicosLocais(ev.target.files);
  el.textContent = r.n
    ? r.n+" quadrados guardados, ampliações "+r.niveis.join(", ")
      + (r.ignorados? " · "+r.ignorados+" ficheiros ignorados por não seguirem {z}/{x}/{y}" : "")
      + " — servem sem rede."
    : "Nenhum ficheiro seguia a árvore {z}/{x}/{y}. Nada foi guardado.";
  if(r.n) fita("Carta pré-descarregada: "+r.n+" quadrados guardados no dispositivo");
  await pintarArquivoMapa();
  if(r.n) pintarMapa();
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

/* ---- ler um serviço WMTS e escolher dele uma camada ---- */

/** O que o último GetCapabilities lido trouxe. Vive só enquanto se escolhe. */
let WMTS_LIDO = null;

/**
 * Mostra o que o serviço oferece: as camadas que servem, e as que não servem com o motivo.
 *
 * As que não servem aparecem na mesma. Saber que a carta militar existe mas está numa
 * projeção que o mapa não desenha é informação; escondê-la deixava quem escolhe a pensar
 * que o serviço não a tinha.
 */
function pintarCamadasWMTS(){
  const el = $("wm-camadas"), sv = $("wm-servico");
  if(!el || !sv) return;
  if(!WMTS_LIDO){ el.innerHTML = ""; sv.textContent = ""; return; }
  sv.textContent = (WMTS_LIDO.titulo || "serviço sem título")
    + (WMTS_LIDO.atribuicao? " · " + WMTS_LIDO.atribuicao : "")
    + " · " + WMTS_LIDO.camadas.length + " camadas";
  /* **Um catálogo grande não se resolve com uma lista branca de nomes.** O relatório de
     cartografia propunha-a, e não se seguiu: escrever aqui os nomes das camadas que se
     acha que um serviço tem é dar por assente o que não se confirmou, e é o que este
     projeto não faz — além de esconder, sem o dizer, camadas que o serviço realmente
     publica.

     O problema que a proposta via é real: a base de dados geográfica do ICNF declara 385
     camadas, e uma lista de 385 linhas num posto de comando não se lê. Resolve-se por
     ordem e por procura, não por censura: as que servem primeiro, um campo para filtrar,
     e um limite ao que se pinta de uma vez — com a conta do que ficou de fora à vista,
     para ninguém supor que o serviço só tem aquilo. */
  const L = wmtsInventario(WMTS_LIDO);
  const filtro = ($("wm-filtro") && $("wm-filtro").value || "").trim().toLowerCase();
  const linha = $("wm-filtro-linha");
  if(linha) linha.style.display = L.length > WMTS_LISTA_MAX ? "" : "none";
  const casa = c => !filtro || (c.titulo+" "+c.id).toLowerCase().includes(filtro);
  const achadas = L.filter(casa).sort((a,b)=>(b.serve?1:0)-(a.serve?1:0));
  const mostradas = achadas.slice(0, WMTS_LISTA_MAX);
  const escondidas = achadas.length - mostradas.length;
  el.innerHTML = mostradas.map(c=>'<div class="wm-c">'
    + '<span class="wm-t">'+esc(c.titulo)+'</span>'
    + '<span class="wm-id">'+esc(c.id)+'</span>'
    + (c.serve
        ? '<span class="hint" style="margin:0">ampliação '+c.zMin+' a '+c.zMax+'</span>'
          + '<button type="button" class="btn btn-g" data-wm-usar="'+esc(c.id)+'">Usar esta</button>'
        : '<span class="wm-nao">não serve — '+esc(c.motivo)+'</span>')
    + '</div>').join("")
    + (escondidas > 0
        ? '<p class="hint" style="margin:8px 0 0 0">Mais '+escondidas+' camada(s) neste serviço, não mostradas. '
          + 'Escreve parte do nome para as procurar.</p>'
        : "")
    + (achadas.length === 0
        ? '<p class="hint" style="margin:8px 0 0 0">Nenhuma camada com «'+esc(filtro)+'» no nome, '
          + 'de '+L.length+' que o serviço tem.</p>'
        : "");
  el.querySelectorAll("[data-wm-usar]").forEach(b=>b.addEventListener("click", async ()=>{
    const r = wmtsCarta(WMTS_LIDO, b.getAttribute("data-wm-usar"));
    if(!r.ok){ aviso("wm-msg","err",r.motivo); return; }
    const g = await adotarCartaWMTS(r.carta);
    if(!g.ok){ aviso("wm-msg","err",g.motivo); return; }
    pintarCarta();
    aviso("wm-msg","ok","Carta adotada: "+r.carta.camadaTitulo+". Carregar a carta para a ver.");
    medirMapa(); if(enquadrarMapa(MAPA.larg, MAPA.alt)) pintarMapa();
  }));
}

/** Lê um GetCapabilities já em texto, venha de onde vier. */
function usarCapacidadesWMTS(xml){
  try{ WMTS_LIDO = lerCapacidadesWMTS(xml); }
  catch(e){ WMTS_LIDO = null; pintarCamadasWMTS(); aviso("wm-msg","err","Não foi possível ler o serviço: "+(e.message||e)); return false; }
  pintarCamadasWMTS();
  const serve = wmtsInventario(WMTS_LIDO).filter(c=>c.serve).length;
  if(serve) aviso("wm-msg","ok", serve+" de "+WMTS_LIDO.camadas.length+" camadas podem ser desenhadas. Escolhe uma.");
  else aviso("wm-msg","err","O serviço tem "+WMTS_LIDO.camadas.length+" camadas e nenhuma pode ser desenhada — ver os motivos abaixo.");
  return true;
}

$("wm-ler").addEventListener("click", async ()=>{
  const u = String($("wm-url").value||"").trim();
  if(!/^https?:\/\//.test(u)){ aviso("wm-msg","err","Indica o endereço do GetCapabilities do serviço."); return; }
  aviso("wm-msg","ok","A ler o serviço...");
  try{
    const r = await fetchT(u, {}, 20000);
    if(!r.ok){ aviso("wm-msg","err","O serviço respondeu HTTP "+r.status+"."); return; }
    usarCapacidadesWMTS(await r.text());
  }catch(e){
    /* Em `file://` há serviços que recusam o pedido de outra origem, e não há como
       contornar isso do lado da aplicação. O ficheiro guardado é o caminho que resta, e é
       o que serve num posto sem rede. */
    aviso("wm-msg","err","Não foi possível ler o serviço ("+String(e).slice(0,90)+"). Guarda o XML e carrega-o do ficheiro.");
  }
});

/* A procura repinta a lista à medida que se escreve. Sem `debounce`: a lista já está em
   memória, não se pede nada a ninguém, e um serviço com 385 camadas repinta-se num
   instante. */
$("wm-filtro").addEventListener("input", ()=>pintarCamadasWMTS());

$("wm-fich").addEventListener("change", async ev=>{
  const f = ev.target.files && ev.target.files[0]; if(!f) return;
  try{ usarCapacidadesWMTS(await f.text()); }
  catch(e){ aviso("wm-msg","err","Não foi possível ler o ficheiro ("+e+")."); }
});
