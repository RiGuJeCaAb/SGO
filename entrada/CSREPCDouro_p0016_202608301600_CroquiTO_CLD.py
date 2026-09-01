#!/usr/bin/env python3
"""
p0016 — croqui do teatro de operações, em SVG, sem rede
CSREPC Douro · Estação PEA · versão de estado 13 -> 14

Base legal: Despacho n.º 4067/2024, art. 28.º (núcleo de informações — análise da zona
de intervenção) e art. 46.º (plano estratégico de ação).

Achado que decide o patch: a aplicação lê o GeoJSON do perímetro, calcula a área e
**deita fora a geometria**. Guarda o nome do ficheiro e os hectares. Não há como
desenhar o que não se guardou.

E o mesmo vale para a deteção de aglomerados: os resultados ficam em
`window.__sensLista`, que é memória volátil — some ao recarregar a página e não entra
na exportação da ocorrência.

  A  `dados.perim` passa a guardar a geometria: anéis em WGS84, caixa envolvente, nome
     do ficheiro e GDH de carregamento. Simplificada por Douglas-Peucker antes de
     gravar, com tolerância de 15 m, para que uma exportação com perímetro continue a
     ser um ficheiro que se manda por correio.
  B  `dados.sensDet` passa a guardar o que a deteção encontrou — distância e rumo em
     relação ao ponto da ocorrência —, com a origem e o GDH. Deixa de se perder.
  C  `croquiSVG()`: perímetro, ponto da ocorrência, aglomerados e pontos sensíveis
     colocados por distância e rumo, ponto de trânsito, escala em quilómetros, norte e
     a caixa de coordenadas. Tudo desenhado a partir do que já está no estado — nem um
     pedido de rede, nem uma biblioteca.
  D  Entra na análise da ZI em Planeamento e no PEA impresso, em linha própria.

Escolha declarada: projecção equirrectangular local, com a longitude corrigida pelo
cosseno da latitude média. Num teatro de operações de dezenas de quilómetros o erro é
inferior à espessura do traço; é a mesma aproximação que a app já usa para calcular a
área e para as distâncias dos aglomerados. Um croqui não é uma carta — não substitui a
M888 nem serve para navegar. Serve para ver a forma e a dimensão, que é o que falta.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0061.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0062.html"

s = io.open(SRC, encoding="utf-8").read()
N = [0]

def troca(ancora, novo, nome):
    global s
    c = s.count(ancora)
    assert c == 1, "[%s] ancora encontrada %d vezes, esperava 1:\n%s" % (nome, c, ancora[:180])
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print("  ok  " + nome)

# ═══════════════════════════════════════════════════════════════════
# A + B — o estado passa a guardar a geometria e a deteção
# ═══════════════════════════════════════════════════════════════════
troca(
    '    dados:{area:"", perimNome:"", setores:"", sensiveis:"", anexos:[],',
    '''    dados:{area:"", perimNome:"", perim:null, sensDet:null, setores:"", sensiveis:"", anexos:[],''',
    "A1 ramos novos no estado"
)

# A migração entra depois do ÚLTIMO degrau existente, e não antes de `migrarGravado`:
# o Code tem degraus declarados depois dessa função, e âncorar aí punha o meu no meio
# da escada — o índice saía trocado e a migração corria na versão errada.
ult = s.rindex("MIGRACOES.push(")
fecho = s.index("\n});\n", ult) + len("\n});\n")
DEGRAU = """
/* 13 -> 14 · A geometria do perímetro e a deteção de aglomerados passam a ficar
   gravadas. Antes calculava-se a área e deitava-se fora o polígono, e a deteção vivia
   em `window.__sensLista`, que morre ao recarregar. Nascem vazios: uma ocorrência
   anterior a esta versão não traz a geometria, e reconstruí-la a partir dos hectares
   seria inventar. Quem quiser o croqui volta a carregar o ficheiro. */
MIGRACOES.push(e => {
  e.dados = e.dados || {};
  if(!("perim" in e.dados)) e.dados.perim = null;
  if(!("sensDet" in e.dados)) e.dados.sensDet = null;
  return e;
});
"""
s = s[:fecho] + DEGRAU + s[fecho:]
N[0] += 1
print("  ok  A2 migração acrescentada depois do último degrau")

troca(
    "const VERSAO_ESTADO = 13;",
    "const VERSAO_ESTADO = 14;",
    "A3 VERSAO_ESTADO 13 -> 14"
)

troca(
    '      { p:"dados.perimNome",  r:"art. 28.º",                d:"Perímetro carregado" },',
    '''      { p:"dados.perimNome",  r:"art. 28.º",                d:"Perímetro carregado" },
      { p:"dados.perim",      r:"art. 28.º",                d:"Geometria do perímetro em WGS84" },
      { p:"dados.sensDet",    r:"art. 28.º; art. 27.º, n.º 1, al. b)", d:"Aglomerados e sensíveis detetados, com distância e rumo" },''',
    "A4 os ramos novos entram no registo de posse"
)

# ═══════════════════════════════════════════════════════════════════
# C — o motor do croqui
# ═══════════════════════════════════════════════════════════════════
troca(
    'function areaGeoJSON(gj){',
    '''/* ================= PLANEAMENTO · croqui do teatro de operações =================
   Desenho a partir do que está gravado, sem rede e sem bibliotecas. Projeção
   equirrectangular local com a longitude corrigida pelo cosseno da latitude média:
   num TO de dezenas de quilómetros o erro fica abaixo da espessura do traço, e é a
   mesma aproximação com que a app calcula a área e as distâncias dos aglomerados.
   Um croqui não é uma carta: não substitui a M888 nem serve para navegar. */

/* Douglas-Peucker sobre coordenadas geográficas, com tolerância em metros. Um
   perímetro de incêndio traz por vezes milhares de vértices; guardá-los todos fazia
   da exportação da ocorrência um ficheiro que não se manda por correio. */
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

/* Extrai os anéis exteriores de um GeoJSON, seja qual for a forma em que venha. */
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

function perimObj(){
  const p = O.dados.perim;
  return (p && Array.isArray(p.aneis) && p.aneis.length) ? p : null;
}

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
function pontoPorRumo(lat, lon, distKm, rumo){
  const g = RUMO_GRAUS[String(rumo||"").toUpperCase()];
  if(g===undefined || !isFinite(distKm)) return null;
  const r = g*Math.PI/180, m = distKm*1000;
  return { lat: lat + (m*Math.cos(r))/111320,
           lon: lon + (m*Math.sin(r))/(111320*Math.cos(lat*Math.PI/180)) };
}

/* Escala redonda: 100 m, 200, 500, 1 km, 2, 5, 10, 20, 50. */
function escalaRedonda(metrosPorPx, larguraPx){
  const alvo = metrosPorPx * larguraPx * 0.28;
  const passos = [100,200,500,1000,2000,5000,10000,20000,50000,100000];
  const m = passos.find(x=>x>=alvo) || passos[passos.length-1];
  return { m, px: m/metrosPorPx, rot: m>=1000? (m/1000)+" km" : m+" m" };
}

/* O croqui. Devolve SVG como texto — entra no ecrã e no documento impresso sem
   diferença, e viaja na exportação da ocorrência porque é só texto. */
function croquiSVG(larg, alt){
  larg = larg||640; alt = alt||400;
  const P = perimObj();
  const lat0 = parseFloat(String(O.meta.lat).replace(",",".")),
        lon0 = parseFloat(String(O.meta.lon).replace(",","."));
  const temPonto = isFinite(lat0) && isFinite(lon0);
  if(!P && !temPonto) return "";

  /* caixa envolvente: perímetro, ponto da ocorrência e sensíveis detetados */
  let minLon, minLat, maxLon, maxLat;
  if(P){ [minLon,minLat,maxLon,maxLat] = P.bbox; }
  else { minLon=lon0; maxLon=lon0; minLat=lat0; maxLat=lat0; }
  const juntar = (la,lo)=>{ if(lo<minLon)minLon=lo; if(lo>maxLon)maxLon=lo; if(la<minLat)minLat=la; if(la>maxLat)maxLat=la; };
  if(temPonto) juntar(lat0, lon0);

  const sens = (O.dados.sensDet && Array.isArray(O.dados.sensDet.itens)) ? O.dados.sensDet.itens : [];
  const marcas = [];
  if(temPonto) sens.forEach(x=>{
    const p = pontoPorRumo(lat0, lon0, +x.dist, x.rumo);
    if(p){ marcas.push({...p, nome:x.nome, sens:!!x.sens, tipo:x.tipo, dist:+x.dist}); juntar(p.lat, p.lon); }
  });

  const latM = (minLat+maxLat)/2;
  const mLat = 111320, mLon = 111320*Math.cos(latM*Math.PI/180);
  const lgM = Math.max(1, (maxLon-minLon)*mLon), alM = Math.max(1, (maxLat-minLat)*mLat);
  const marg = 34;
  const esc = Math.min((larg-2*marg)/lgM, (alt-2*marg)/alM);
  const mpp = 1/esc;
  const cx = larg/2, cy = alt/2, cLon = (minLon+maxLon)/2, cLat = (minLat+maxLat)/2;
  const X = lo => cx + (lo-cLon)*mLon*esc;
  const Y = la => cy - (la-cLat)*mLat*esc;

  const e = t => String(t==null?"":t).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  let g = "";

  if(P) P.aneis.forEach(a=>{
    const d = a.map((c,i)=>(i?"L":"M")+X(c[0]).toFixed(1)+","+Y(c[1]).toFixed(1)).join(" ")+" Z";
    g += '<path d="'+d+'" fill="var(--cq-area,#B84B3F)" fill-opacity=".16" stroke="var(--cq-area,#B84B3F)" stroke-width="1.6" stroke-linejoin="round"/>';
  });

  marcas.forEach(m=>{
    const x=X(m.lon).toFixed(1), y=Y(m.lat).toFixed(1);
    const cor = m.sens? "var(--cq-sens,#B08A2E)" : "var(--cq-agl,#8A9099)";
    g += m.sens
      ? '<rect x="'+(x-4)+'" y="'+(y-4)+'" width="8" height="8" fill="'+cor+'" stroke="#fff" stroke-width="1"/>'
      : '<circle cx="'+x+'" cy="'+y+'" r="3.6" fill="'+cor+'" stroke="#fff" stroke-width="1"/>';
    g += '<text x="'+(+x+7)+'" y="'+(+y+3.5)+'" font-size="9" fill="var(--cq-tx,#5A5A5A)">'+e(m.nome)+'</text>';
  });

  if(temPonto){
    const x=X(lon0).toFixed(1), y=Y(lat0).toFixed(1);
    g += '<path d="M'+x+','+(+y-9)+' L'+(+x+7.8)+','+(+y+4.5)+' L'+(+x-7.8)+','+(+y+4.5)+' Z" fill="var(--cq-pco,#005CA9)" stroke="#fff" stroke-width="1.2"/>';
    g += '<text x="'+(+x+11)+'" y="'+(+y+4)+'" font-size="9.5" font-weight="700" fill="var(--cq-pco,#005CA9)">PCO</text>';
  }

  const E = escalaRedonda(mpp, larg);
  const ex = marg, ey = alt-16;
  g += '<line x1="'+ex+'" y1="'+ey+'" x2="'+(ex+E.px).toFixed(1)+'" y2="'+ey+'" stroke="var(--cq-tx,#5A5A5A)" stroke-width="2"/>'
     + '<line x1="'+ex+'" y1="'+(ey-4)+'" x2="'+ex+'" y2="'+(ey+4)+'" stroke="var(--cq-tx,#5A5A5A)" stroke-width="2"/>'
     + '<line x1="'+(ex+E.px).toFixed(1)+'" y1="'+(ey-4)+'" x2="'+(ex+E.px).toFixed(1)+'" y2="'+(ey+4)+'" stroke="var(--cq-tx,#5A5A5A)" stroke-width="2"/>'
     + '<text x="'+(ex+E.px+6).toFixed(1)+'" y="'+(ey+3.5)+'" font-size="9.5" fill="var(--cq-tx,#5A5A5A)">'+E.rot+'</text>';

  const nx = larg-marg+4, ny = 26;
  g += '<path d="M'+nx+','+(ny-14)+' L'+(nx+5)+','+(ny+2)+' L'+nx+','+(ny-2)+' L'+(nx-5)+','+(ny+2)+' Z" fill="var(--cq-tx,#5A5A5A)"/>'
     + '<text x="'+nx+'" y="'+(ny+14)+'" font-size="9.5" font-weight="700" text-anchor="middle" fill="var(--cq-tx,#5A5A5A)">N</text>';

  const cantos = fmtGMS? (fmtGMS(maxLat,true)+"  "+fmtGMS(minLon,false)) : "";
  g += '<text x="'+marg+'" y="16" font-size="8.5" fill="var(--cq-tx,#5A5A5A)" font-family="monospace">'+e(cantos)+'</text>';

  return '<svg viewBox="0 0 '+larg+' '+alt+'" width="100%" xmlns="http://www.w3.org/2000/svg" '
    + 'role="img" aria-label="Croqui do teatro de operações">'
    + '<rect width="'+larg+'" height="'+alt+'" fill="var(--cq-fundo,none)"/>' + g + '</svg>';
}

/* Legenda do croqui, em texto: o que está desenhado e de onde veio. */
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

function areaGeoJSON(gj){''',
    "C1 motor do croqui"
)

# ═══════════════════════════════════════════════════════════════════
# D — ligações: guardar, mostrar e imprimir
# ═══════════════════════════════════════════════════════════════════
troca(
    '      const gj=JSON.parse(String(rd.result)); const ha=areaGeoJSON(gj);\n'
    '      O.dados.perimNome=f.name; if(ha>0){ O.dados.area=String(ha); $("d-area").value=ha; }',
    '      const gj=JSON.parse(String(rd.result)); const ha=areaGeoJSON(gj);\n'
    '      O.dados.perimNome=f.name; if(ha>0){ O.dados.area=String(ha); $("d-area").value=ha; }\n'
    '      /* a geometria fica gravada: sem ela não há croqui, e até aqui era deitada fora */\n'
    '      const gp = guardarPerimetro(gj, f.name);\n'
    '      if(gp) fita("Perímetro guardado: "+gp.vertices+" vértices"+(gp.verticesOriginais>gp.vertices? " (simplificado de "+gp.verticesOriginais+")":""));',
    "D1 a geometria do perímetro fica gravada"
)

# a deteção deixa de morrer em window
for marca, origem, rot in [
    ('$("sens-info").textContent = itens.length+" detetados — clica para adicionar (equipamentos sensíveis a vermelho):";', "Overpass/OSM", "D2 deteção OSM gravada"),
    ('$("sens-info").textContent = itens.length+" detetados pelo Photon (Overpass indisponível) — clica para adicionar:";', "Photon", "D3 deteção Photon gravada"),
]:
    troca(marca,
        'O.dados.sensDet = { itens: itens.map(x=>({nome:x.nome, tipo:x.tipo, dist:x.dist, rumo:x.rumo, sens:!!x.sens})),\n'
        '        origem:"' + origem + '", g:gdhAgora(), raioKm:3 };\n      ' + marca,
        rot)

troca(
    '$("p-limpar").onclick = ()=>{ O.dados.perimNome=""; ',
    '$("p-limpar").onclick = ()=>{ O.dados.perimNome=""; O.dados.perim=null; try{ pintarCroqui(); }catch(e){} ',
    "D4 limpar o perímetro limpa a geometria"
)

# o croqui no ecrã, dentro da análise da ZI em Planeamento
troca(
    '            <div class="hint" id="d-perim-info">',
    '            <div id="croqui-box" style="display:none;margin:12px 0 4px">\n'
    '              <span class="stit">Croqui do teatro de operações <span class="hint" style="font-weight:400">art. 28.º — apoio à análise da ZI</span></span>\n'
    '              <div id="croqui-svg" class="croqui"></div>\n'
    '              <div id="croqui-leg" class="hint"></div>\n'
    '      </div>\n'
    '            <div class="hint" id="d-perim-info">',
    "D5 caixa do croqui no painel de Planeamento"
)

troca(
    "  .hint{font-size:13px;color:var(--tx3);margin-top:6px}",
    "  .hint{font-size:13px;color:var(--tx3);margin-top:6px}\n"
    "  /* croqui: as cores vêm das variáveis do tema, para funcionar nos dois e no papel */\n"
    "  .croqui{border:1px solid var(--line);border-radius:10px;background:var(--surf2);padding:6px;\n"
    "    --cq-area:var(--fogo);--cq-pco:var(--agua);--cq-sens:var(--terra);--cq-agl:var(--metal);--cq-tx:var(--tx2)}\n"
    "  .croqui svg{display:block}",
    "D6 estilo do croqui"
)

troca(
    "function renderSetores(){",
    "/* O croqui redesenha-se sempre que o perímetro ou a deteção mudam. */\n"
    "function pintarCroqui(){\n"
    "  const box = $(\"croqui-box\"), alvo = $(\"croqui-svg\"), leg = $(\"croqui-leg\");\n"
    "  if(!box || !alvo) return;\n"
    "  let svg = \"\";\n"
    "  try{ svg = croquiSVG(640, 400); }catch(e){ svg = \"\"; }\n"
    "  box.style.display = svg? \"block\" : \"none\";\n"
    "  alvo.innerHTML = svg;\n"
    "  if(leg) leg.innerHTML = svg? croquiLegenda().map(t=>\"<div>\"+esc(t)+\"</div>\").join(\"\") : \"\";\n"
    "}\n"
    "function renderSetores(){",
    "D7 pintarCroqui"
)

troca(
    "function pintarTudo(){\n  try{ renderTurno(); }catch(e){}",
    "function pintarTudo(){\n  try{ renderTurno(); }catch(e){}\n  try{ pintarCroqui(); }catch(e){}",
    "D8 croqui no ciclo de render"
)

# o croqui no PEA impresso, em linha própria da célula de planeamento
# O croqui entra no PEA em linha própria da célula de planeamento. O instantâneo é
# gravado com o PEA: um plano emitido tem de continuar a mostrar o croqui que tinha na
# hora em que foi emitido, e não o de agora.
troca(
    '          <div class="cel-row"><div class="cel-lab">Previsão</div>',
    '          ${p.croqui? `<div class="cel-row"><div class="cel-lab">Croqui do TO</div><div class="cel-con">'
    '<div class="croqui croqui-papel">${p.croqui}</div>'
    '${(p.croquiLeg||[]).map(t=>`<p class="cq-leg">${esc(t)}</p>`).join("")}</div></div>`:""}\n'
    '          <div class="cel-row"><div class="cel-lab">Previsão</div>',
    "D9 croqui no PEA impresso"
)
troca(
    "  const pea = { n, g:gdhAgora(), ts:Date.now(), validoTs:horizonteValidade(mm),\n"
    "    base:baseVigor(), ctrl:[], ultVerd:\"\",",
    "  const pea = { n, g:gdhAgora(), ts:Date.now(), validoTs:horizonteValidade(mm),\n"
    "    base:baseVigor(), ctrl:[], ultVerd:\"\",\n"
    "    /* O croqui é congelado com o plano, pela mesma razão que o resto do instantâneo:\n"
    "       um PEA emitido tem de continuar a mostrar o teatro que tinha na hora em que\n"
    "       foi emitido, e não o de agora. */\n"
    "    croqui:(()=>{ try{ return croquiSVG(560, 330); }catch(e){ return \"\"; } })(),\n"
    "    croquiLeg:(()=>{ try{ return (perimObj()||O.dados.sensDet)? croquiLegenda() : []; }catch(e){ return []; } })(),",
    "D10 o instantâneo do PEA leva o croqui"
)
troca(
    "  .croqui svg{display:block}",
    "  .croqui svg{display:block}\n"
    "  .cq-leg{font-size:11px;color:var(--tx3);margin:4px 0 0}",
    "D11 estilo da legenda"
)
# no papel, o croqui em tons neutros e a legenda pequena
troca(
    "  .paper .cel-con p:last-child{margin-bottom:0!important}",
    "  .paper .cel-con p:last-child{margin-bottom:0!important}\n"
    "  /* No papel o croqui perde as cores do tema e fica em tons de impressão. */\n"
    "  .paper .croqui-papel{border:0.75pt solid #404040!important;background:#fff!important;padding:3pt!important;\n"
    "    --cq-area:#B00000;--cq-pco:#005CA9;--cq-sens:#8A6D1F;--cq-agl:#767676;--cq-tx:#404040;--cq-fundo:#fff}\n"
    "  .paper .croqui-papel svg{max-height:78mm!important}\n"
    "  .paper .cq-leg{font-size:7.5pt!important;color:#595959!important;margin:3pt 0 0!important}",
    "D12 croqui em tons de impressão"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s" % (N[0], DST))
