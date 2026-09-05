/* ================= PLANEAMENTO · relevo e perfil de elevação (art. 28.º) ================= */
async function analisarRelevo(){
  const c0 = coordenadaDoFormulario(), lat = c0? c0.lat : NaN, lon = c0? c0.lon : NaN;
  if(Number.isNaN(lat)||Number.isNaN(lon)){ $("t-relevo-info").textContent="Sem coordenadas na ocorrência — preenche-as em Comando."; irPara("p-occ"); return; }
  const btn=$("b-relevo"); btn.disabled=true; const rot=btn.textContent; btn.innerHTML='<span class="spin"></span> A amostrar o terreno...';
  try{
    const RUMOS=ROSA8, DIST=[400,800,1200];
    const lats=[lat], lons=[lon];
    RUMOS.forEach((r,k)=>{ DIST.forEach(d=>{ const q = pontoADistancia(lat, lon, k*45, d); lats.push(q.lat); lons.push(q.lon); }); });
    const r = await fetchT("https://api.open-meteo.com/v1/elevation?latitude="+lats.map(v=>v.toFixed(5)).join(",")+"&longitude="+lons.map(v=>v.toFixed(5)).join(","), { repetir:true }, 9000);
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
    const resumo = RUMOS.map(rm=>rm+" "+(grad[rm]>=0?"+":"")+fmtPT(grad[rm])+"%").join(" · ");
    $("t-orient").value = orient==="planalto"? "planalto" : orient;
    $("t-declive").value = declive;
    $("t-obs").value = "Cota do ponto ~"+Math.round(e0)+" m; gradientes: "+resumo;
    lerForm();
    $("t-relevo-info").textContent = "Relevo amostrado: exposição dominante "+(orient==="planalto"?"indiferenciada (planalto)":orient)+", declive "+declive+" (máx. "+fmtPT(maxAbs)+" %).";
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
  const RUMOS=ROSA8;
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
    leitura = "O terreno desce para "+descidas.map(r=>r+" ("+fmtPT(R.grad[r])+" %)").join(", ")
      + (subidas.length? " e sobe para "+subidas.map(r=>r+" (+"+fmtPT(R.grad[r])+" %)").join(", ") : "")
      + ". Encostas expostas a "+descidas.join("/")
      + " — com vento de "+dom+", o fogo corre encosta acima para "+rumoOposto(dom)
      + "; o cruzamento com a previsão horária está em Planeamento.";
  }

  const chips = '<div class="rel-chips">'
    + '<div class="rel-c"><div class="k">Cota do ponto</div><div class="v">'+Math.round(R.e0)+' m</div></div>'
    + '<div class="rel-c"><div class="k">Amplitude (1200 m)</div><div class="v">'+Math.round(eMax-eMin)+' m</div></div>'
    + '<div class="rel-c"><div class="k">Declive máximo</div><div class="v">'+fmtPT(maxAbs)+' %</div></div>'
    + '<div class="rel-c"><div class="k">Exposição dominante</div><div class="v" style="color:'+(dom?'var(--fogo)':'var(--madeira)')+'">'+(dom||"plano")+'</div></div>'
    + '</div>';

  /* rosa de gradientes — escala adaptativa */
  const esc10 = Math.max(10, Math.ceil(maxAbs/5)*5);
  const cx=160, cy=160, rMax=112;
  const rr=[];
  rr.push('<svg viewBox="0 0 320 320" width="100%" style="max-width:330px;font-family:JetBrains Mono,monospace">');
  [0.5,1].forEach(f=>rr.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+(rMax*f)+'" fill="none" stroke="var(--line)"/>'
    +'<text x="'+(cx+5)+'" y="'+(cy-rMax*f-3)+'" font-size="9" fill="var(--tx3)">'+fmtPT(esc10*f)+'%</text>'));
  RUMOS.forEach((rm,k)=>{
    const b=(k*45-90)*Math.PI/180, g=R.grad[rm];
    const L=Math.max(8, Math.min(1,Math.abs(g)/esc10)*rMax);
    const x2=cx+L*Math.cos(b), y2=cy+L*Math.sin(b);
    const cor=g<0?"var(--fogo)":"var(--madeira)";
    rr.push('<line x1="'+cx+'" y1="'+cy+'" x2="'+x2+'" y2="'+y2+'" stroke="'+cor+'" stroke-width="'+(rm===dom?9:6)+'" stroke-linecap="round"/>');
    const xt=cx+(rMax+24)*Math.cos(b), yt=cy+(rMax+24)*Math.sin(b);
    rr.push('<text x="'+xt+'" y="'+(yt)+'" text-anchor="middle" font-size="11" font-weight="700" fill="'+(rm===dom?"var(--fogo)":"var(--tx)")+'">'+rm+'</text>');
    rr.push('<text x="'+xt+'" y="'+(yt+12)+'" text-anchor="middle" font-size="9.5" fill="'+cor+'">'+(g>=0?"+":"")+fmtPT(g)+'%</text>');
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

  /* Composição de declive e vento, na hora de vento mais forte da série carregada.
     Sem série não há vento, e a leitura cala-se. */
  const horaVento = (SERIE||[]).reduce((a,b)=>(b && a && b.ws>a.ws)? b : a, (SERIE||[])[0] || null);
  const fogo = horaVento ? leituraComportamentoFogo({
    orient: O.dados.topo.orient, rumoVento: horaVento.wd, eps: O.dados.topo.eps
  }) : "";

  el.innerHTML = chips
    + '<div class="rel-read"><b>Leitura operacional:</b> '+esc(leitura)+'</div>'
    + (fogo? '<div class="rel-read"><b>Declive e vento ('+esc(hh(horaVento.h))+', vento mais forte da série):</b> '+esc(fogo)+'</div>' : '')
    + '<div class="rel-grids">'
    + '<div class="rel-g"><span class="gt">Rosa de gradientes — vermelho: terreno desce (encosta exposta); verde: sobe</span>'+rr.join("")+'</div>'
    + '<div class="rel-g"><span class="gt">Perfis de cota nos 8 rumos (0–1200 m) — exposição dominante destacada</span>'+pp.join("")+'</div>'
    + '</div>';
}

/* deteção de aglomerados e sensíveis (Overpass/OSM) */
const TIPO_OSM = {village:"aldeia", hamlet:"lugar", town:"vila", suburb:"bairro", locality:"localidade",
  school:"escola", kindergarten:"jardim de infância", hospital:"unidade de saúde", nursing_home:"lar de idosos"};
