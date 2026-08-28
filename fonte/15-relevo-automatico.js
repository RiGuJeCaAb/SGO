/* ================= relevo automático (Open-Meteo Elevation) ================= */
async function analisarRelevo(){
  const lat = parseFloat($("o-lat").value.replace(",",".")), lon = parseFloat($("o-lon").value.replace(",","."));
  if(Number.isNaN(lat)||Number.isNaN(lon)){ $("t-relevo-info").textContent="Sem coordenadas na secção 1 — preenche-as primeiro."; irPara("p-occ"); return; }
  const btn=$("b-relevo"); btn.disabled=true; const rot=btn.textContent; btn.innerHTML='<span class="spin"></span> A amostrar o terreno...';
  try{
    const RUMOS=["N","NE","E","SE","S","SO","O","NO"], DIST=[400,800,1200];
    const lats=[lat], lons=[lon];
    RUMOS.forEach((r,k)=>{ const b=k*45*Math.PI/180;
      DIST.forEach(d=>{ lats.push(lat + d*Math.cos(b)/111320); lons.push(lon + d*Math.sin(b)/(111320*Math.cos(lat*Math.PI/180))); }); });
    const r = await fetchT("https://api.open-meteo.com/v1/elevation?latitude="+lats.map(v=>v.toFixed(5)).join(",")+"&longitude="+lons.map(v=>v.toFixed(5)).join(","), {}, 9000);
    if(!r.ok) throw "HTTP "+r.status;
    const e = (await r.json()).elevation;
    if(!e || e.length!==lats.length) throw "resposta incompleta";
    const e0=e[0], grad={};
    RUMOS.forEach((rm,k)=>{ let soma=0;
      DIST.forEach((d,j)=>{ soma += 100*(e[1+k*3+j]-e0)/d; });
      grad[rm]=soma/DIST.length; });
    const perfis = {}; RUMOS.forEach((rm,k)=>{ perfis[rm]=DIST.map((d,j)=>e[1+k*3+j]); });
    O.dados.relevo = {e0, grad, perfis, dist:DIST};
    const maxAbs = Math.max(...Object.values(grad).map(Math.abs));
    let orient="planalto", declive="suave";
    if(maxAbs>=3){
      orient = RUMOS.reduce((a,b)=>grad[a]<grad[b]?a:b);            // rumo de descida mais pronunciada = exposição
      declive = maxAbs<10? "suave" : maxAbs<20? "moderado" : maxAbs<35? "acentuado" : "muito";
    }
    const resumo = RUMOS.map(rm=>rm+" "+(grad[rm]>=0?"+":"")+grad[rm].toFixed(0)+"%").join(" · ");
    $("t-orient").value = orient==="planalto"? "planalto" : orient;
    $("t-declive").value = declive;
    $("t-obs").value = "Cota do ponto ~"+Math.round(e0)+" m; gradientes: "+resumo;
    lerForm();
    $("t-relevo-info").textContent = "Relevo amostrado: exposição dominante "+(orient==="planalto"?"indiferenciada (planalto)":orient)+", declive "+declive+" (máx. "+maxAbs.toFixed(0)+" %).";
    fita("Relevo analisado automaticamente (Elevation API): exposição "+orient+", declive "+declive);
    pintarRelevo();
    persistir(false);
    if(ANALISE) pintarAnalise();
  }catch(err){
    $("t-relevo-info").textContent = "Amostragem do relevo indisponível: "+motivoRede(err)+" — preenche manualmente pela carta.";
  }
  btn.disabled=false; btn.textContent=rot;
}
$("b-relevo").addEventListener("click", analisarRelevo);

/* dashboard do relevo: leitura operacional + rosa + perfis */
function pintarRelevo(){
  const R = O.dados.relevo; const el=$("relevo-dash"); if(!el) return;
  if(!R){ el.innerHTML=""; return; }
  const RUMOS=["N","NE","E","SE","S","SO","O","NO"];
  const OPOSTO={N:"S",NE:"SO",E:"O",SE:"NO",S:"N",SO:"NE",O:"E",NO:"SE"};
  const maxAbs = Math.max(...Object.values(R.grad).map(Math.abs));
  const descidas = RUMOS.filter(r=>R.grad[r]<=-3).sort((a,b)=>R.grad[a]-R.grad[b]);
  const subidas  = RUMOS.filter(r=>R.grad[r]>=3).sort((a,b)=>R.grad[b]-R.grad[a]);
  const dom = descidas[0]||null;
  const todas=[R.e0, ...Object.values(R.perfis).flat()];
  const eMin=Math.min(...todas), eMax=Math.max(...todas);

  /* leitura operacional em português */
  let leitura;
  if(!dom && maxAbs<3) leitura = "Terreno praticamente plano num raio de 1200 m (gradientes < 3 %) — o vento manda; o relevo não condiciona a propagação.";
  else {
    leitura = "O terreno desce para "+descidas.map(r=>r+" ("+R.grad[r].toFixed(0)+" %)").join(", ")
      + (subidas.length? " e sobe para "+subidas.map(r=>r+" (+"+R.grad[r].toFixed(0)+" %)").join(", ") : "")
      + ". Encostas expostas a "+descidas.join("/")
      + " — com vento de "+dom+", o fogo corre encosta acima para "+OPOSTO[dom]
      + "; o cruzamento com a previsão horária está na secção 5.";
  }

  const chips = '<div class="rel-chips">'
    + '<div class="rel-c"><div class="k">Cota do ponto</div><div class="v">'+Math.round(R.e0)+' m</div></div>'
    + '<div class="rel-c"><div class="k">Amplitude (1200 m)</div><div class="v">'+Math.round(eMax-eMin)+' m</div></div>'
    + '<div class="rel-c"><div class="k">Declive máximo</div><div class="v">'+maxAbs.toFixed(0)+' %</div></div>'
    + '<div class="rel-c"><div class="k">Exposição dominante</div><div class="v" style="color:'+(dom?'var(--fogo)':'var(--madeira)')+'">'+(dom||"plano")+'</div></div>'
    + '</div>';

  /* rosa de gradientes — escala adaptativa */
  const esc10 = Math.max(10, Math.ceil(maxAbs/5)*5);
  const cx=160, cy=160, rMax=112;
  const rr=[];
  rr.push('<svg viewBox="0 0 320 320" width="100%" style="max-width:330px;font-family:JetBrains Mono,monospace">');
  [0.5,1].forEach(f=>rr.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+(rMax*f)+'" fill="none" stroke="var(--line)"/>'
    +'<text x="'+(cx+5)+'" y="'+(cy-rMax*f-3)+'" font-size="9" fill="var(--tx3)">'+(esc10*f).toFixed(0)+'%</text>'));
  RUMOS.forEach((rm,k)=>{
    const b=(k*45-90)*Math.PI/180, g=R.grad[rm];
    const L=Math.max(8, Math.min(1,Math.abs(g)/esc10)*rMax);
    const x2=cx+L*Math.cos(b), y2=cy+L*Math.sin(b);
    const cor=g<0?"var(--fogo)":"var(--madeira)";
    rr.push('<line x1="'+cx+'" y1="'+cy+'" x2="'+x2+'" y2="'+y2+'" stroke="'+cor+'" stroke-width="'+(rm===dom?9:6)+'" stroke-linecap="round"/>');
    const xt=cx+(rMax+24)*Math.cos(b), yt=cy+(rMax+24)*Math.sin(b);
    rr.push('<text x="'+xt+'" y="'+(yt)+'" text-anchor="middle" font-size="11" font-weight="700" fill="'+(rm===dom?"var(--fogo)":"var(--tx)")+'">'+rm+'</text>');
    rr.push('<text x="'+xt+'" y="'+(yt+12)+'" text-anchor="middle" font-size="9.5" fill="'+cor+'">'+(g>=0?"+":"")+g.toFixed(0)+'%</text>');
  });
  rr.push('<circle cx="'+cx+'" cy="'+cy+'" r="4" fill="var(--tx)"/>');
  rr.push('</svg>');

  /* perfis radiais com etiquetas sem sobreposição */
  const px0=52, pw=700, py0=20, ph=180;
  const amp=Math.max(10,eMax-eMin);
  const X=j=> px0 + pw*([0,...R.dist][j])/R.dist[R.dist.length-1];
  const Y=v=> py0 + ph*(1-(v-eMin)/amp);
  const pp=[];
  pp.push('<svg viewBox="0 0 810 240" width="100%" style="font-family:JetBrains Mono,monospace">');
  [eMin,(eMin+eMax)/2,eMax].forEach(v=>{ pp.push('<line x1="'+px0+'" y1="'+Y(v)+'" x2="'+(px0+pw)+'" y2="'+Y(v)+'" stroke="var(--line)"/>'
    +'<text x="'+(px0-6)+'" y="'+(Y(v)+3)+'" text-anchor="end" font-size="9.5" fill="var(--tx3)">'+Math.round(v)+' m</text>'); });
  const fins = RUMOS.map(rm=>({rm, y:Y(R.perfis[rm][2])})).sort((a,b)=>a.y-b.y);
  for(let i=1;i<fins.length;i++){ if(fins[i].y-fins[i-1].y<12) fins[i].y=fins[i-1].y+12; }
  const yFim={}; fins.forEach(f=>yFim[f.rm]=f.y);
  RUMOS.forEach(rm=>{
    const pts=[[X(0),Y(R.e0)], ...R.perfis[rm].map((v,j)=>[X(j+1),Y(v)])];
    const forte = rm===dom;
    pp.push('<polyline points="'+pts.map(p=>p.join(",")).join(" ")+'" fill="none" stroke="'+(forte?"var(--fogo)":"var(--tx3)")+'" stroke-width="'+(forte?3.2:1.4)+'" opacity="'+(forte?1:0.6)+'"/>');
    pp.push('<text x="'+(px0+pw+8)+'" y="'+(yFim[rm]+3)+'" font-size="10" font-weight="'+(forte?'700':'400')+'" fill="'+(forte?"var(--fogo)":"var(--tx2)")+'">'+rm+' '+Math.round(R.perfis[rm][2])+'</text>');
  });
  [0,400,800,1200].forEach((d,j)=>pp.push('<text x="'+X(j)+'" y="'+(py0+ph+18)+'" text-anchor="middle" font-size="9.5" fill="var(--tx3)">'+d+' m</text>'));
  pp.push('</svg>');

  el.innerHTML = chips
    + '<div class="rel-read"><b>Leitura operacional:</b> '+esc(leitura)+'</div>'
    + '<div class="rel-grids">'
    + '<div class="rel-g"><span class="gt">Rosa de gradientes — vermelho: terreno desce (encosta exposta); verde: sobe</span>'+rr.join("")+'</div>'
    + '<div class="rel-g"><span class="gt">Perfis de cota nos 8 rumos (0–1200 m) — exposição dominante destacada</span>'+pp.join("")+'</div>'
    + '</div>';
}

/* deteção de aglomerados e sensíveis (Overpass/OSM) */
const TIPO_OSM = {village:"aldeia", hamlet:"lugar", town:"vila", suburb:"bairro", locality:"localidade",
  school:"escola", kindergarten:"jardim de infância", hospital:"unidade de saúde", nursing_home:"lar de idosos"};
/* ================= perfil de elevação =================
   Corte do terreno ao longo de um eixo, amostrado na Elevation API (Open-Meteo).
   O declive ao longo do eixo é a variável que comanda a velocidade de propagação
   ascendente e o tempo de fuga disponível: por isso o perfil é lido em termos
   operacionais e não apenas desenhado. */
const RUMOS16 = [["N",0],["NNE",22.5],["NE",45],["ENE",67.5],["E",90],["ESE",112.5],["SE",135],["SSE",157.5],
  ["S",180],["SSO",202.5],["SO",225],["OSO",247.5],["O",270],["ONO",292.5],["NO",315],["NNO",337.5]];
function pontosDoEixo(latA, lonA, latB, lonB, n){
  const P = [];
  for(let i=0;i<n;i++){ const t=i/(n-1);
    P.push({lat: latA+(latB-latA)*t, lon: lonA+(lonB-lonA)*t}); }
  return P;
}
function distKm(latA, lonA, latB, lonB){
  const dx=(lonB-lonA)*111320*Math.cos((latA+latB)/2*Math.PI/180), dy=(latB-latA)*111320;
  return Math.sqrt(dx*dx+dy*dy)/1000;
}
function parPar(txt){
  const m = String(txt||"").split(/[,;\s]+/).map(x=>parseFloat(x.replace(",","."))).filter(x=>isFinite(x));
  return (m.length>=2 && Math.abs(m[0])<=90 && Math.abs(m[1])<=180)? {lat:m[0], lon:m[1]} : null;
}
async function tracarPerfil(){
  const info = $("pf-info");
  const base = parPar($("pf-a").value) || (()=>{ const p=parPar($("o-lat").value+","+$("o-lon").value); return p; })();
  if(!base){ info.textContent = "Sem coordenadas na secção 1 nem origem indicada."; irPara("p-occ"); return; }
  let fim = null, rot = "";
  if($("pf-modo").value === "rumo"){
    const g = parseFloat($("pf-rumo").value), km = Math.max(0.5, Math.min(25, parseFloat($("pf-dist").value)||4));
    const b = g*Math.PI/180;
    fim = {lat: base.lat + km*1000*Math.cos(b)/111320,
           lon: base.lon + km*1000*Math.sin(b)/(111320*Math.cos(base.lat*Math.PI/180))};
    rot = (RUMOS16.find(r=>r[1]===g)||["",""])[0]+" · "+km.toFixed(1)+" km";
  } else {
    fim = parPar($("pf-b").value);
    if(!fim){ info.textContent = "Indica as coordenadas de destino."; return; }
    rot = "entre coordenadas";
  }
  const btn = $("b-perfil"); btn.disabled=true; const rb=btn.textContent;
  btn.innerHTML='<span class="spin"></span> A amostrar o terreno...';
  info.textContent = "A pedir 100 cotas à Elevation API...";
  try{
    const N = 100, P = pontosDoEixo(base.lat, base.lon, fim.lat, fim.lon, N);
    const r = await fetchT("https://api.open-meteo.com/v1/elevation?latitude="+P.map(p=>p.lat.toFixed(5)).join(",")
      +"&longitude="+P.map(p=>p.lon.toFixed(5)).join(","), {}, 12000);
    if(!r.ok) throw "HTTP "+r.status;
    const e = (await r.json()).elevation;
    if(!e || e.length!==N) throw "resposta incompleta";
    const total = distKm(base.lat, base.lon, fim.lat, fim.lon);
    O.dados.perfil = {a:base, b:fim, rot, total, e};
    pintarPerfil();
    fita("Perfil de elevação traçado: "+rot+", "+total.toFixed(1)+" km, cotas de "+Math.round(Math.min(...e))+" a "+Math.round(Math.max(...e))+" m");
    info.textContent = "Perfil traçado sobre "+N+" cotas reais.";
    persistir(false);
  }catch(err){ info.textContent = "Perfil do terreno indisponível: "+motivoRede(err)+" — tenta novamente quando houver ligação."; }
  btn.disabled=false; btn.textContent=rb;
}
function pintarPerfil(){
  const S = $("pf-svg"), L = $("pf-leitura"); if(!S) return;
  const p = O.dados.perfil;
  if(!p || !p.e || !p.e.length){ S.innerHTML=""; if(L) L.innerHTML=""; return; }
  const e = p.e, N = e.length, total = p.total;
  const passo = total/(N-1)*1000;
  const min = Math.min(...e), max = Math.max(...e);
  const W = 1000, H = 300, mL = 58, mR = 16, mT = 16, mB = 40;
  const gW = W-mL-mR, gH = H-mT-mB;
  const banda = Math.max(20, max-min);
  const y0 = Math.floor((min-banda*0.12)/20)*20, y1 = Math.ceil((max+banda*0.12)/20)*20;
  const X = i => mL + gW*i/(N-1);
  const Y = v => mT + gH*(1-(v-y0)/(y1-y0));
  /* declives entre pontos consecutivos, em percentagem */
  const dec = []; for(let i=1;i<N;i++) dec.push(100*(e[i]-e[i-1])/passo);
  const decAbs = dec.map(Math.abs);
  const maxD = Math.max(...decAbs), iMax = decAbs.indexOf(maxD);
  const subida = e.reduce((t,v,i)=> i? t+Math.max(0,v-e[i-1]) : 0, 0);
  const descida = e.reduce((t,v,i)=> i? t+Math.max(0,e[i-1]-v) : 0, 0);
  const medio = 100*(e[N-1]-e[0])/(total*1000);
  const cor = d => d>=35? "var(--fogo)" : d>=20? "var(--laranja)" : d>=10? "var(--terra)" : "var(--madeira)";
  const segs = dec.map((d,i)=>`<line x1="${X(i).toFixed(1)}" y1="${Y(e[i]).toFixed(1)}" x2="${X(i+1).toFixed(1)}" y2="${Y(e[i+1]).toFixed(1)}" stroke="${cor(Math.abs(d))}" stroke-width="2.4" stroke-linecap="round"/>`).join("");
  const area = `M${X(0).toFixed(1)},${Y(e[0]).toFixed(1)} `+e.map((v,i)=>`L${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")
    +` L${X(N-1).toFixed(1)},${(mT+gH).toFixed(1)} L${X(0).toFixed(1)},${(mT+gH).toFixed(1)} Z`;
  const passoY = Math.max(20, Math.round((y1-y0)/6/20)*20);
  let eixoY = "";
  for(let v=y0; v<=y1; v+=passoY) eixoY += `<line x1="${mL}" y1="${Y(v).toFixed(1)}" x2="${W-mR}" y2="${Y(v).toFixed(1)}" stroke="var(--line)" stroke-width="0.6" opacity="0.55"/>`
    +`<text x="${mL-9}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" font-family="var(--mono)" font-size="11" fill="var(--tx3)">${v} m</text>`;
  const nX = total<=2? 4 : total<=6? 6 : 8;
  let eixoX = "";
  for(let k=0;k<=nX;k++){ const t=k/nX, x=mL+gW*t;
    eixoX += `<line x1="${x.toFixed(1)}" y1="${mT}" x2="${x.toFixed(1)}" y2="${(mT+gH).toFixed(1)}" stroke="var(--line)" stroke-width="0.5" opacity="0.35"/>`
      +`<text x="${x.toFixed(1)}" y="${(mT+gH+20).toFixed(1)}" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--tx3)">${(total*t).toFixed(1)}</text>`; }
  const mk = `<line x1="${X(iMax).toFixed(1)}" y1="${mT}" x2="${X(iMax).toFixed(1)}" y2="${(mT+gH).toFixed(1)}" stroke="var(--fogo)" stroke-width="1" stroke-dasharray="4 3" opacity="0.8"/>
    <text x="${(X(iMax)+6).toFixed(1)}" y="${(mT+14).toFixed(1)}" font-family="var(--mono)" font-size="11" fill="var(--fogo)">declive máx. ${maxD.toFixed(0)} %</text>`;
  const orig = `<circle cx="${X(0).toFixed(1)}" cy="${Y(e[0]).toFixed(1)}" r="5" fill="var(--fogo)" stroke="var(--surf)" stroke-width="2"/>
    <text x="${(X(0)+9).toFixed(1)}" y="${(Y(e[0])-9).toFixed(1)}" font-family="var(--disp)" font-weight="700" font-size="12.5" fill="var(--fogo)">TO ${Math.round(e[0])} m</text>`;
  S.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    <defs><linearGradient id="pfg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--laranja)" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="var(--laranja)" stop-opacity="0.03"/></linearGradient></defs>
    ${eixoY}${eixoX}<path d="${area}" fill="url(#pfg)"/>${segs}${mk}${orig}
    <text x="${(mL+gW/2).toFixed(1)}" y="${H-6}" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--tx3)">distância ao longo do eixo (km) — ${esc(p.rot)}</text>
  </svg>`;
  if(!L) return;
  const dir = medio>=0? "sub-i" : "desc";
  const cartoes = [
    {k:"Extensão", v:total.toFixed(1), u:"km"},
    {k:"Cota inicial", v:Math.round(e[0]), u:"m"},
    {k:"Cota final", v:Math.round(e[N-1]), u:"m"},
    {k:"Desnível líquido", v:(e[N-1]-e[0]>=0? "+":"")+Math.round(e[N-1]-e[0]), u:"m", c:dir},
    {k:"Declive médio", v:(medio>=0? "+":"")+medio.toFixed(1), u:"%", c:dir},
    {k:"Declive máximo", v:maxD.toFixed(0), u:"%", c:maxD>=20? "sub-i":""},
    {k:"Subida acumulada", v:Math.round(subida), u:"m"},
    {k:"Descida acumulada", v:Math.round(descida), u:"m"}
  ].map(x=>`<div class="pf-c ${x.c||""}"><span class="k">${esc(x.k)}</span><span class="v">${esc(String(x.v))}<small>${esc(x.u)}</small></span></div>`).join("");
  const kmMax = (total*iMax/(N-1));
  const leitura = [];
  leitura.push(medio>=0
    ? "O eixo é ascendente no seu conjunto, com "+Math.abs(medio).toFixed(0)+" % de declive médio: o fogo que progrida nesta direção ganha velocidade e o tempo de fuga a montante encurta."
    : "O eixo é descendente no seu conjunto, com "+Math.abs(medio).toFixed(0)+" % de declive médio: a progressão nesta direção é mais lenta, mas o ataque descendente fica desaconselhado sem rota de fuga confirmada.");
  if(maxD>=35) leitura.push("Há um troço de "+maxD.toFixed(0)+" % ao quilómetro "+kmMax.toFixed(1)+": declive muito acentuado, sem condições para progressão a pé com carga nem para veículo fora de estrada.");
  else if(maxD>=20) leitura.push("O troço mais inclinado tem "+maxD.toFixed(0)+" % ao quilómetro "+kmMax.toFixed(1)+": exige cadência reduzida e vigia próprio.");
  if(subida>50 && descida>50) leitura.push("O perfil alterna subidas e descidas ("+Math.round(subida)+" m a subir, "+Math.round(descida)+" m a descer): há linhas de água e cumeadas intermédias, com inversões de vento local e mudanças bruscas de comportamento em cada uma.");
  const t = O.dados.topo||{orient:"",declive:"",obs:""};
  if(t.orient) leitura.push("A exposição dominante registada na análise de relevo é "+t.orient+", declive "+(t.declive||"—")+": cruza este perfil com a previsão de vento na secção 5 antes de fixar o eixo de esforço.");
  L.innerHTML = `<div class="pf-m">${cartoes}</div>
    <p class="hint" style="margin-top:12px">${leitura.map(esc).join(" ")}</p>
    <p class="hint">Cotas da Elevation API do Open-Meteo, 100 amostras no eixo, resolução do modelo de terreno na ordem dos 30 m: serve para leitura de forma e de declive, não substitui a carta militar para medições finas.</p>`;
}

/* ================= consulta Overpass =================
   Vários espelhos, POST em vez de GET (evita URL longos e alguns bloqueios de CORS)
   e diagnóstico legível: com o ficheiro aberto em file:// há espelhos que recusam
   o pedido, e nesse caso o que interessa é dizê-lo e passar ao seguinte. */
const OVERPASS = [
  {u:"https://overpass-api.de/api/interpreter", n:"overpass-api.de"},
  {u:"https://overpass.kumi.systems/api/interpreter", n:"kumi.systems"},
  {u:"https://overpass.private.coffee/api/interpreter", n:"private.coffee"},
  {u:"https://overpass.osm.jp/api/interpreter", n:"osm.jp"}
];
async function overpass(q, aviso){
  const falhas = [];
  for(let i=0;i<OVERPASS.length;i++){
    const sv = OVERPASS[i];
    if(aviso) aviso("A consultar OSM em "+sv.n+" ("+(i+1)+" de "+OVERPASS.length+", até 25 s)...");
    try{
      const r = await fetchT(sv.u, {method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:"data="+encodeURIComponent(q)}, 25000);
      if(!r.ok){ falhas.push(sv.n+" HTTP "+r.status); continue; }
      const j = await r.json();
      if(j && j.elements) return j;
      falhas.push(sv.n+" resposta vazia");
    }catch(e){
      falhas.push(sv.n+" "+((e&&e.name==="AbortError")? "tempo esgotado" : String(e.message||e).slice(0,40)));
    }
  }
  throw falhas.join("; ");
}
/* recurso quando todos os espelhos falham: pesquisa por nome no Photon, com viés
   nas coordenadas do TO e filtro por etiqueta OSM */
async function photonPerto(lat, lon, tags, limite){
  const out = [];
  for(const t of tags){
    try{
      const r = await fetchT("https://photon.komoot.io/api/?q="+encodeURIComponent(t.q)
        +"&lat="+lat+"&lon="+lon+"&limit="+(limite||10)+"&lang=default"
        +(t.osm? "&osm_tag="+encodeURIComponent(t.osm):""), {}, 12000);
      if(!r.ok) continue;
      const j = await r.json();
      (j.features||[]).forEach(f=>{
        const p=f.properties||{}, c=f.geometry&&f.geometry.coordinates;
        if(!c || p.countrycode!=="PT") return;
        out.push({tags:{name:p.name, amenity:p.osm_value, __rot:t.rot}, lat:c[1], lon:c[0]});
      });
    }catch(e){}
  }
  return out;
}

/* candidatos a ponto de trânsito: espaços de concentração com acesso rodoviário,
   fora da zona de intervenção mas próximos do TO */
const TIPO_PT = {fire_station:"quartel", parking:"parque de estacionamento", fuel:"posto de combustível",
  rest_area:"área de repouso", services:"área de serviço", pitch:"campo de jogos",
  sports_centre:"complexo desportivo", stadium:"estádio", industrial:"zona industrial",
  village:"aldeia", town:"vila", hamlet:"lugar"};
async function sugerirPT(){
  const lat = parseFloat($("o-lat").value.replace(",",".")), lon = parseFloat($("o-lon").value.replace(",","."));
  if(Number.isNaN(lat)||Number.isNaN(lon)){ $("pt-info").textContent="Sem coordenadas na secção 1."; irPara("p-occ"); return; }
  const btn=$("b-pt"); btn.disabled=true; const rot=btn.textContent; btn.innerHTML='<span class="spin"></span> A consultar OSM...';
  try{
    const A = "(around:8000,"+lat+","+lon+")";
    const q = '[out:json][timeout:20];('
      + 'node'+A+'[amenity~"^(fire_station|parking|fuel)$"];way'+A+'[amenity~"^(fire_station|parking|fuel)$"];'
      + 'node'+A+'[leisure~"^(pitch|sports_centre|stadium)$"];way'+A+'[leisure~"^(pitch|sports_centre|stadium)$"];'
      + 'node'+A+'[highway~"^(rest_area|services)$"];way'+A+'[landuse=industrial];'
      + ');out center 80;';
    const d = await overpass(q, t=>{ $("pt-info").textContent = t; });
    const peso = t => t==="fire_station"? 0 : (t==="industrial"||t==="parking"||t==="services"||t==="rest_area")? 1 : 2;
    const itens = (d.elements||[]).map(e=>{
      const c = e.center || e, tg = e.tags||{};
      if(typeof c.lat!=="number" || typeof c.lon!=="number") return null;
      const tipo = tg.amenity || tg.leisure || tg.highway || tg.landuse || "";
      if(!TIPO_PT[tipo]) return null;
      const dx=(c.lon-lon)*111320*Math.cos(lat*Math.PI/180), dy=(c.lat-lat)*111320;
      const dist=Math.sqrt(dx*dx+dy*dy)/1000;
      if(dist < 1.5 || dist > 8) return null;
      return {nome: tg.name || TIPO_PT[tipo], tipo, rot:TIPO_PT[tipo], dist,
        rumo: card((Math.atan2(dx,dy)*180/Math.PI+360)%360), lat:c.lat, lon:c.lon, p:peso(tipo)};
    }).filter(Boolean)
      .sort((a,b)=> a.p!==b.p? a.p-b.p : a.dist-b.dist)
      .filter((x,i,arr)=>arr.findIndex(y=>y.nome===x.nome && Math.abs(y.dist-x.dist)<0.2)===i)
      .slice(0,12);
    if(!itens.length){ $("pt-info").textContent="Sem candidatos na carta entre 1,5 e 8 km — define manualmente."; $("pt-sug").innerHTML=""; }
    else{
      window.__ptLista = itens;
      $("pt-info").textContent = itens.length+" candidatos — clica para adotar (quartéis primeiro, depois espaços amplos):";
      $("pt-sug").innerHTML = itens.map((it,i)=>
        '<span class="tchip" style="cursor:pointer'+(it.tipo==="fire_station"?';border-color:var(--madeira)':'')+'" onclick="adotarPT('+i+')">'
        +'<b'+(it.tipo==="fire_station"?' style="color:var(--madeira)"':'')+'>'+esc(it.nome)+'</b> '+esc(it.rot)+' · '+it.dist.toFixed(1)+' km a '+it.rumo+'</span>').join("");
      fita("Sugestão de ponto de trânsito: "+itens.length+" candidatos na carta entre 1,5 e 8 km");
    }
  }catch(err){
    $("pt-info").textContent = "Overpass indisponível ("+String(err).slice(0,90)+") — a tentar o Photon...";
    try{
      const alt = await photonPerto(lat, lon, [
        {q:"quartel de bombeiros", osm:"amenity:fire_station", rot:"quartel"},
        {q:"parque de estacionamento", osm:"amenity:parking", rot:"parque de estacionamento"},
        {q:"campo de futebol", osm:"leisure:pitch", rot:"campo de jogos"}], 8);
      const itens = alt.map(e=>{
        const dx=(e.lon-lon)*111320*Math.cos(lat*Math.PI/180), dy=(e.lat-lat)*111320;
        const dist=Math.sqrt(dx*dx+dy*dy)/1000;
        if(dist<1.5 || dist>12) return null;
        return {nome:e.tags.name||e.tags.__rot, tipo:"", rot:e.tags.__rot, dist,
          rumo:card((Math.atan2(dx,dy)*180/Math.PI+360)%360), lat:e.lat, lon:e.lon, p:1};
      }).filter(Boolean).sort((a,b)=>a.dist-b.dist).slice(0,10);
      if(!itens.length) throw "sem candidatos";
      window.__ptLista = itens;
      $("pt-info").textContent = itens.length+" candidatos pelo Photon (Overpass indisponível) — clica para adotar:";
      $("pt-sug").innerHTML = itens.map((it,i)=>
        '<span class="tchip" style="cursor:pointer" onclick="adotarPT('+i+')"><b>'+esc(it.nome)+'</b> '+esc(it.rot)+' · '+it.dist.toFixed(1)+' km a '+it.rumo+'</span>').join("");
      fita("Sugestão de ponto de trânsito pelo Photon: "+itens.length+" candidatos");
    }catch(e2){
      $("pt-info").textContent = "Sem resposta dos servidores de cartografia ("+String(err).slice(0,70)+") — define o ponto de trânsito manualmente.";
    }
  }
  btn.disabled=false; btn.textContent=rot;
}
window.adotarPT = i => {
  const it = (window.__ptLista||[])[i]; if(!it) return;
  $("pt-des").value = it.nome+" ("+it.rot+"), a "+it.dist.toFixed(1)+" km "+it.rumo+" do TO";
  $("pt-cd").value = it.lat.toFixed(5)+", "+it.lon.toFixed(5);
  lerForm(); persistir(false); pintarDON(); renderCheck();
  fita("Ponto de trânsito definido: "+it.nome+" a "+it.dist.toFixed(1)+" km "+it.rumo);
  aviso("msg-pt","ok","Ponto de trânsito adotado. Falta indicar o responsável e o contacto.");
};
async function detetarSensiveis(){
  const lat = parseFloat($("o-lat").value.replace(",",".")), lon = parseFloat($("o-lon").value.replace(",","."));
  if(Number.isNaN(lat)||Number.isNaN(lon)){ $("sens-info").textContent="Sem coordenadas na secção 1."; irPara("p-occ"); return; }
  const btn=$("b-sens"); btn.disabled=true; const rot=btn.textContent; btn.innerHTML='<span class="spin"></span> A consultar OSM...';
  try{
    const q = '[out:json][timeout:12];(node(around:3000,'+lat+','+lon+')[place~"^(village|hamlet|town|suburb|locality)$"];node(around:3000,'+lat+','+lon+')[amenity~"^(school|kindergarten|hospital|nursing_home)$"];);out body 40;';
    const d = await overpass(q, t=>{ $("sens-info").textContent = t; });
    const itens = (d.elements||[]).filter(e=>e.tags&&e.tags.name).map(e=>{
      const dx=(e.lon-lon)*111320*Math.cos(lat*Math.PI/180), dy=(e.lat-lat)*111320;
      const dist=Math.sqrt(dx*dx+dy*dy)/1000;
      const rumo=card((Math.atan2(dx,dy)*180/Math.PI+360)%360);
      const tipo=TIPO_OSM[e.tags.place||e.tags.amenity]||"";
      return {nome:e.tags.name, tipo, dist, rumo, sens:!!e.tags.amenity};
    }).sort((a,b)=>a.dist-b.dist).slice(0,14);
    if(!itens.length){ $("sens-info").textContent="Sem povoações ou equipamentos OSM num raio de 3 km."; $("sens-sug").innerHTML=""; }
    else{
      window.__sensLista = itens;
      $("sens-info").textContent = itens.length+" detetados — clica para adicionar (equipamentos sensíveis a vermelho):";
      $("sens-sug").innerHTML = itens.map((it,i)=>
        '<span class="tchip" style="cursor:pointer'+(it.sens?';border-color:var(--fogo)':'')+'" onclick="addSens('+i+')"><b'+(it.sens?' style="color:var(--fogo)"':'')+'>'+esc(it.nome)+'</b> '+esc(it.tipo)+' · '+it.dist.toFixed(1)+' km a '+it.rumo+'</span>').join("")
        + '<span class="tchip" style="cursor:pointer;border-color:var(--agua)" onclick="addSensTodos()"><b>Adicionar todos</b></span>';
      fita("Deteção OSM: "+itens.length+" aglomerados/sensíveis num raio de 3 km");
    }
  }catch(err){
    $("sens-info").textContent = "Overpass indisponível ("+String(err).slice(0,90)+") — a tentar o Photon...";
    try{
      const alt = await photonPerto(lat, lon, [
        {q:"aldeia", osm:"place:village", rot:"aldeia"},
        {q:"lugar", osm:"place:hamlet", rot:"lugar"},
        {q:"escola", osm:"amenity:school", rot:"escola"},
        {q:"lar de idosos", osm:"amenity:nursing_home", rot:"lar"}], 8);
      const itens = alt.map(e=>{
        const dx=(e.lon-lon)*111320*Math.cos(lat*Math.PI/180), dy=(e.lat-lat)*111320;
        const dist=Math.sqrt(dx*dx+dy*dy)/1000;
        if(dist>6) return null;
        const sens = ["school","nursing_home","hospital","kindergarten"].includes(e.tags.amenity);
        return {nome:e.tags.name||e.tags.__rot, tipo:e.tags.__rot, dist,
          rumo:card((Math.atan2(dx,dy)*180/Math.PI+360)%360), sens};
      }).filter(Boolean).sort((a,b)=>a.dist-b.dist).slice(0,14);
      if(!itens.length) throw "sem candidatos";
      window.__sensLista = itens;
      $("sens-info").textContent = itens.length+" detetados pelo Photon (Overpass indisponível) — clica para adicionar:";
      $("sens-sug").innerHTML = itens.map((it,i)=>
        '<span class="tchip" style="cursor:pointer'+(it.sens?';border-color:var(--fogo)':'')+'" onclick="addSens('+i+')"><b'+(it.sens?' style="color:var(--fogo)"':'')+'>'+esc(it.nome)+'</b> '+esc(it.tipo)+' · '+it.dist.toFixed(1)+' km a '+it.rumo+'</span>').join("")
        + '<span class="tchip" style="cursor:pointer;border-color:var(--agua)" onclick="addSensTodos()"><b>Adicionar todos</b></span>';
      fita("Deteção pelo Photon: "+itens.length+" aglomerados/sensíveis");
    }catch(e2){
      $("sens-info").textContent = "Sem resposta dos servidores de cartografia ("+String(err).slice(0,70)+") — introduz manualmente.";
    }
  }
  btn.disabled=false; btn.textContent=rot;
}
window.addSens = i => {
  const it = window.__sensLista[i];
  const atual = $("d-sensiveis").value.trim();
  const entrada = it.nome+" ("+(it.sens?"prioridade":"vigilância")+" — "+(it.tipo? it.tipo+", ":"")+it.dist.toFixed(1)+" km a "+it.rumo+")";
  if(atual.includes(it.nome)) return;
  $("d-sensiveis").value = (atual? atual+"; ":"")+entrada;
  O.dados.sensiveis = $("d-sensiveis").value; persistir(false);
};
window.addSensTodos = () => { (window.__sensLista||[]).forEach((_,i)=>addSens(i)); };
$("b-sens").addEventListener("click", detetarSensiveis);
$("b-pt").addEventListener("click", sugerirPT);
$("b-perfil").addEventListener("click", tracarPerfil);
$("pf-rumo").innerHTML = RUMOS16.map(r=>'<option value="'+r[1]+'"'+(r[0]==="N"?" selected":"")+'>'+r[0]+' ('+r[1]+'\u00b0)</option>').join("");
$("pf-modo").addEventListener("change", ()=>{
  const porRumo = $("pf-modo").value==="rumo";
  $("pf-w-rumo").style.display = porRumo? "":"none";
  $("pf-w-dist").style.display = porRumo? "":"none";
  $("pf-w-a").style.display = porRumo? "none":"";
  $("pf-w-b").style.display = porRumo? "none":"";
});
["pt-des","pt-resp","pt-ct","pt-cd","pt-obs"].forEach(id=>{ const el=$(id); if(el)
  el.addEventListener("change", ()=>{ lerForm(); persistir(false); pintarDON(); renderCheck(); }); });

