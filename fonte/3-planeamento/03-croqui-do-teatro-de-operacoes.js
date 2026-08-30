/* ================= PLANEAMENTO · croqui do teatro de operações =================
   Desenho a partir do que está gravado, sem rede e sem bibliotecas. Projeção
   equirrectangular local com a longitude corrigida pelo cosseno da latitude média:
   num TO de dezenas de quilómetros o erro fica abaixo da espessura do traço, e é a
   mesma aproximação com que a aplicação calcula a área e as distâncias dos aglomerados.
   Um croqui não é uma carta: não substitui a M888 nem serve para navegar.

   O croqui é o desenho de base sobre o qual o mapa operacional assenta. Quando não há
   rede, ou não há mosaicos guardados, é ele que fica — e é por isso que o desenho e o
   fundo estão separados em dois módulos. */

/**
 * Douglas-Peucker sobre coordenadas geográficas, com tolerância em metros.
 *
 * Um perímetro de incêndio traz por vezes milhares de vértices; guardá-los todos fazia
 * da exportação da ocorrência um ficheiro que não se manda por correio.
 *
 * @param {number[][]} anel pares [lon, lat]
 * @param {number} tolM tolerância, em metros
 * @param {number} latRef latitude de referência para a correção da longitude
 */
function simplificarAnel(anel, tolM, latRef){
  if(!Array.isArray(anel) || anel.length < 4) return anel;
  const mLat = 111320, mLon = 111320*Math.cos((latRef||41)*Math.PI/180);
  const dist2 = (p, a, b) => {
    const ax=a[0]*mLon, ay=a[1]*mLat, bx=b[0]*mLon, by=b[1]*mLat, px=p[0]*mLon, py=p[1]*mLat;
    const dx=bx-ax, dy=by-ay, L=dx*dx+dy*dy;
    if(!L) return (px-ax)*(px-ax)+(py-ay)*(py-ay);
    let t=((px-ax)*dx+(py-ay)*dy)/L; t=Math.max(0,Math.min(1,t));
    const qx=ax+t*dx, qy=ay+t*dy;
    return (px-qx)*(px-qx)+(py-qy)*(py-qy);
  };
  const tol2 = tolM*tolM;
  const dp = (pts, i, j, marca) => {
    let pior = -1, k = -1;
    for(let m=i+1;m<j;m++){ const d = dist2(pts[m], pts[i], pts[j]); if(d>pior){ pior=d; k=m; } }
    if(pior > tol2){ marca[k]=1; dp(pts,i,k,marca); dp(pts,k,j,marca); }
  };
  const marca = new Array(anel.length).fill(0);
  marca[0] = marca[anel.length-1] = 1;
  dp(anel, 0, anel.length-1, marca);
  const out = anel.filter((_,i)=>marca[i]);
  return out.length >= 4 ? out : anel;
}

/** Extrai os anéis exteriores de um GeoJSON, seja qual for a forma em que venha. */
function aneisDeGeoJSON(gj){
  const out = [];
  if(!gj || typeof gj!=="object") return out;
  const daGeometria = g => {
    if(!g || typeof g!=="object") return;
    if(g.type==="Polygon" && Array.isArray(g.coordinates)) out.push(g.coordinates[0]);
    else if(g.type==="MultiPolygon" && Array.isArray(g.coordinates)) g.coordinates.forEach(p=>{ if(p&&p[0]) out.push(p[0]); });
    else if(g.type==="GeometryCollection" && Array.isArray(g.geometries)) g.geometries.forEach(daGeometria);
  };
  if(gj.type==="FeatureCollection" && Array.isArray(gj.features)) gj.features.forEach(f=>daGeometria(f && f.geometry));
  else if(gj.type==="Feature") daGeometria(gj.geometry);
  else daGeometria(gj);
  return out.filter(a=>Array.isArray(a) && a.length>=4);
}

/** O perímetro gravado, ou nada quando não há geometria utilizável. */
function perimObj(){
  const p = O.dados.perim;
  return (p && Array.isArray(p.aneis) && p.aneis.length) ? p : null;
}

/**
 * Guarda a geometria do perímetro, simplificada, com a caixa envolvente já calculada.
 *
 * Até à absorção deste módulo a aplicação calculava a área e deitava fora o polígono:
 * ao recarregar não havia por onde desenhar nada, e a exportação da ocorrência não
 * levava a forma do incêndio. Fica gravado — simplificado a 15 m, que é muito abaixo
 * da incerteza do próprio traçado e faz a diferença entre um ficheiro que se manda por
 * correio e um que não se manda.
 */
function guardarPerimetro(gj, nome){
  const brutos = aneisDeGeoJSON(gj);
  if(!brutos.length) return null;
  let minLon=Infinity, minLat=Infinity, maxLon=-Infinity, maxLat=-Infinity;
  brutos.forEach(a=>a.forEach(c=>{
    const x=+c[0], y=+c[1];
    if(!isFinite(x)||!isFinite(y)) return;
    if(x<minLon) minLon=x; if(x>maxLon) maxLon=x;
    if(y<minLat) minLat=y; if(y>maxLat) maxLat=y;
  }));
  if(!isFinite(minLon)) return null;
  const latRef = (minLat+maxLat)/2;
  const aneis = brutos.map(a=>simplificarAnel(a, 15, latRef).map(c=>[+(+c[0]).toFixed(6), +(+c[1]).toFixed(6)]));
  const vertBrutos = brutos.reduce((t,a)=>t+a.length,0);
  const vert = aneis.reduce((t,a)=>t+a.length,0);
  O.dados.perim = { nome:nome||"", aneis, bbox:[minLon,minLat,maxLon,maxLat],
    g:gdhAgora(), vertices:vert, verticesOriginais:vertBrutos, toleranciaM:15 };
  return O.dados.perim;
}

/* Aglomerados e sensíveis: a deteção guarda distância e rumo em relação ao ponto da
   ocorrência, e é daí que se recoloca cada um no croqui. O rumo vem em cardinal. */
const RUMO_GRAUS = {N:0,NNE:22.5,NE:45,ENE:67.5,E:90,ESE:112.5,SE:135,SSE:157.5,
  S:180,SSO:202.5,SO:225,OSO:247.5,O:270,ONO:292.5,NO:315,NNO:337.5};

/** Recoloca um ponto a partir do rumo cardinal e da distância em quilómetros. */
function pontoPorRumo(lat, lon, distKm, rumo){
  const g = RUMO_GRAUS[String(rumo||"").toUpperCase()];
  if(g===undefined || !isFinite(distKm)) return null;
  const r = g*Math.PI/180, m = distKm*1000;
  return { lat: lat + (m*Math.cos(r))/111320,
           lon: lon + (m*Math.sin(r))/(111320*Math.cos(lat*Math.PI/180)) };
}

/** Escala redonda: 100 m, 200, 500, 1 km, 2, 5, 10, 20, 50. */
function escalaRedonda(metrosPorPx, larguraPx){
  const alvo = metrosPorPx * larguraPx * 0.28;
  const passos = [10,20,50,100,200,500,1000,2000,5000,10000,20000,50000,100000];
  /* O primeiro passo redondo que não ultrapasse um terço da largura. O teto não
     depende de o alvo estar certo: mesmo com uma escala absurda, a barra continua
     dentro do desenho e com rótulo à vista. */
  const teto = larguraPx/3;
  let m = passos.find(x=>x>=alvo && x/metrosPorPx<=teto);
  if(m===undefined){
    const cabem = passos.filter(x=>x/metrosPorPx<=teto);
    m = cabem.length? cabem[cabem.length-1] : passos[0];
  }
  return { m, px: Math.min(m/metrosPorPx, teto), rot: m>=1000? (m/1000)+" km" : m+" m" };
}

/**
 * A geometria do enquadramento do croqui: caixa envolvente, escala e projeção.
 *
 * Separado do desenho porque o mapa operacional precisa exatamente do mesmo cálculo
 * para saber que mosaicos pedir e onde os colar. Duas contas iguais em dois sítios
 * seriam duas contas a divergir.
 *
 * @returns {null|{larg:number, alt:number, X:(lo:number)=>number, Y:(la:number)=>number,
 *   lonDe:(x:number)=>number, latDe:(y:number)=>number, mpp:number, marg:number,
 *   minLon:number, minLat:number, maxLon:number, maxLat:number,
 *   lat0:number, lon0:number, temPonto:boolean, marcas:any[], P:any}}
 */
function enquadrarCroqui(larg, alt){
  larg = larg||640; alt = alt||400;
  const P = perimObj();
  const lat0 = parseFloat(String(O.meta.lat).replace(",",".")),
        lon0 = parseFloat(String(O.meta.lon).replace(",","."));
  const temPonto = isFinite(lat0) && isFinite(lon0);
  const det = (O.dados.sensDet && Array.isArray(O.dados.sensDet.itens)) ? O.dados.sensDet.itens : [];
  /* Um triângulo sozinho não é um croqui: sem perímetro e sem nada detetado à volta
     não há forma nem dimensão para mostrar, e a caixa só ocupava espaço. */
  if(!P && !det.length) return null;
  if(!P && !temPonto) return null;

  /* caixa envolvente: perímetro, ponto da ocorrência e sensíveis detetados */
  let minLon, minLat, maxLon, maxLat;
  if(P){ [minLon,minLat,maxLon,maxLat] = P.bbox; }
  else { minLon=lon0; maxLon=lon0; minLat=lat0; maxLat=lat0; }
  const juntar = (la,lo)=>{ if(lo<minLon)minLon=lo; if(lo>maxLon)maxLon=lo; if(la<minLat)minLat=la; if(la>maxLat)maxLat=la; };
  if(temPonto) juntar(lat0, lon0);

  const marcas = [];
  if(temPonto) det.forEach(x=>{
    const p = pontoPorRumo(lat0, lon0, +x.dist, x.rumo);
    if(p){ marcas.push({ lat:p.lat, lon:p.lon, nome:x.nome, sens:!!x.sens, tipo:x.tipo, dist:+x.dist }); juntar(p.lat, p.lon); }
  });

  const latM = (minLat+maxLat)/2;
  const mLat = 111320, mLon = 111320*Math.cos(latM*Math.PI/180);

  /* Extensão mínima. Uma caixa envolvente degenerada — um ponto só, ou um perímetro
     de poucas dezenas de metros — fazia a escala dividir por quase zero, e a barra
     saía com dezenas de milhares de pixéis numa tela de seiscentos. Abre-se em torno
     do centro até dar dois quilómetros, que é a menor extensão em que uma escala
     ainda diz alguma coisa a quem lê. */
  const MIN_M = 2000;
  const abrir = (min, max, metrosPorGrau) => {
    const atual = (max-min)*metrosPorGrau;
    if(atual >= MIN_M) return [min, max];
    const c = (min+max)/2, meio = (MIN_M/2)/metrosPorGrau;
    return [c-meio, c+meio];
  };
  [minLon, maxLon] = abrir(minLon, maxLon, mLon);
  [minLat, maxLat] = abrir(minLat, maxLat, mLat);

  const lgM = Math.max(1, (maxLon-minLon)*mLon), alM = Math.max(1, (maxLat-minLat)*mLat);
  const marg = 34;
  /* A proporção segue o conteúdo: um incêndio comprido e estreito deixa de vir dentro
     de um quadrado com margens enormes. A altura é limitada para o croqui não passar
     a ocupar meio painel. */
  alt = Math.round(Math.max(200, Math.min(alt, (larg-2*marg) * (alM/lgM) + 2*marg)));
  const esc = Math.min((larg-2*marg)/lgM, (alt-2*marg)/alM);
  const cx = larg/2, cy = alt/2, cLon = (minLon+maxLon)/2, cLat = (minLat+maxLat)/2;

  return { larg, alt, marg, mpp:1/esc, minLon, minLat, maxLon, maxLat,
    lat0, lon0, temPonto, marcas, P,
    X: lo => cx + (lo-cLon)*mLon*esc,
    Y: la => cy - (la-cLat)*mLat*esc,
    lonDe: x => cLon + (x-cx)/(mLon*esc),
    latDe: y => cLat - (y-cy)/(mLat*esc) };
}

/**
 * O croqui. Devolve SVG como texto — entra no ecrã e no documento impresso sem
 * diferença, e viaja na exportação da ocorrência porque é só texto.
 */
function croquiSVG(larg, alt){
  const Q = enquadrarCroqui(larg, alt);
  if(!Q) return "";
  const { X, Y, P, marcas, temPonto, lat0, lon0, marg } = Q;
  larg = Q.larg; alt = Q.alt;

  const e = t => String(t==null?"":t).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  let g = "";

  if(P) P.aneis.forEach(a=>{
    const d = a.map((c,i)=>(i?"L":"M")+X(c[0]).toFixed(1)+","+Y(c[1]).toFixed(1)).join(" ")+" Z";
    g += '<path d="'+d+'" fill="var(--cq-area,#B84B3F)" fill-opacity=".16" stroke="var(--cq-area,#B84B3F)" stroke-width="1.6" stroke-linejoin="round"/>';
  });

  /* As coordenadas ficam em número até ao momento de as escrever. Somar a uma cadeia
     já arredondada dava concatenação onde se queria aritmética — e o verificador de
     tipos apanha-o. `n()` arredonda só à saída. */
  const n = v => (Math.round(v*10)/10);

  marcas.forEach(m=>{
    const x = X(m.lon), y = Y(m.lat);
    const cor = m.sens? "var(--cq-sens,#B08A2E)" : "var(--cq-agl,#8A9099)";
    g += m.sens
      ? '<rect x="'+n(x-4)+'" y="'+n(y-4)+'" width="8" height="8" fill="'+cor+'" stroke="#fff" stroke-width="1"/>'
      : '<circle cx="'+n(x)+'" cy="'+n(y)+'" r="3.6" fill="'+cor+'" stroke="#fff" stroke-width="1"/>';
    g += '<text x="'+n(x+7)+'" y="'+n(y+3.5)+'" font-size="9" fill="var(--cq-tx,#5A5A5A)">'+e(m.nome)+'</text>';
  });

  if(temPonto){
    const x = X(lon0), y = Y(lat0);
    g += '<path d="M'+n(x)+','+n(y-9)+' L'+n(x+7.8)+','+n(y+4.5)+' L'+n(x-7.8)+','+n(y+4.5)+' Z" fill="var(--cq-pco,#005CA9)" stroke="#fff" stroke-width="1.2"/>';
    g += '<text x="'+n(x+11)+'" y="'+n(y+4)+'" font-size="9.5" font-weight="700" fill="var(--cq-pco,#005CA9)">PCO</text>';
  }

  const E = escalaRedonda(Q.mpp, larg);
  const ex = marg, ey = alt-16, efim = n(ex+E.px);
  g += '<line x1="'+ex+'" y1="'+ey+'" x2="'+efim+'" y2="'+ey+'" stroke="var(--cq-tx,#5A5A5A)" stroke-width="2"/>'
     + '<line x1="'+ex+'" y1="'+(ey-4)+'" x2="'+ex+'" y2="'+(ey+4)+'" stroke="var(--cq-tx,#5A5A5A)" stroke-width="2"/>'
     + '<line x1="'+efim+'" y1="'+(ey-4)+'" x2="'+efim+'" y2="'+(ey+4)+'" stroke="var(--cq-tx,#5A5A5A)" stroke-width="2"/>'
     + '<text x="'+n(ex+E.px+6)+'" y="'+(ey+3.5)+'" font-size="9.5" fill="var(--cq-tx,#5A5A5A)">'+E.rot+'</text>';

  const nx = larg-marg+4, ny = 26;
  g += '<path d="M'+nx+','+(ny-14)+' L'+(nx+5)+','+(ny+2)+' L'+nx+','+(ny-2)+' L'+(nx-5)+','+(ny+2)+' Z" fill="var(--cq-tx,#5A5A5A)"/>'
     + '<text x="'+nx+'" y="'+(ny+14)+'" font-size="9.5" font-weight="700" text-anchor="middle" fill="var(--cq-tx,#5A5A5A)">N</text>';

  const cantos = fmtGMS(Q.maxLat,true)+"  "+fmtGMS(Q.minLon,false);
  g += '<text x="'+marg+'" y="16" font-size="8.5" fill="var(--cq-tx,#5A5A5A)" font-family="monospace">'+e(cantos)+'</text>';

  return '<svg viewBox="0 0 '+larg+' '+alt+'" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" '
    + 'role="img" aria-label="Croqui do teatro de operações">'
    + '<rect width="'+larg+'" height="'+alt+'" fill="var(--cq-fundo,none)"/>' + g + '</svg>';
}

/** Legenda do croqui, em texto: o que está desenhado e de onde veio. */
function croquiLegenda(){
  const P = perimObj(), S = O.dados.sensDet;
  const p = [];
  if(P) p.push("Perímetro: "+(P.nome||"ficheiro sem nome")+", carregado "+P.g
    + " · "+P.vertices+" vértices"+(P.verticesOriginais>P.vertices? " (simplificado de "+P.verticesOriginais+", tolerância "+P.toleranciaM+" m)":""));
  else p.push("Sem perímetro carregado — o croqui mostra apenas o ponto da ocorrência e o que a deteção encontrou.");
  if(S && Array.isArray(S.itens) && S.itens.length)
    p.push("Aglomerados e sensíveis: "+S.itens.length+" itens de "+(S.origem||"deteção")+", "+S.g
      + " · colocados por distância e rumo em relação ao ponto da ocorrência.");
  p.push("Projeção equirrectangular local. Croqui de apoio à análise da ZI — não substitui a carta militar nem serve para navegação.");
  return p;
}

/** O croqui redesenha-se sempre que o perímetro ou a deteção mudam. */
function pintarCroqui(){
  const box = $("croqui-box"), alvo = $("croqui-svg"), leg = $("croqui-leg");
  if(!box || !alvo) return;
  let svg = "";
  try{ svg = croquiSVG(640, 400); }catch(e){ svg = ""; }
  box.style.display = svg? "block" : "none";
  alvo.innerHTML = svg;
  if(leg) leg.innerHTML = svg? croquiLegenda().map(t=>"<div>"+esc(t)+"</div>").join("") : "";
}
