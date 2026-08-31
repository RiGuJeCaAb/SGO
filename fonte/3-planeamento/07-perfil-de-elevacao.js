/* ================= perfil de elevação =================
   Corte do terreno ao longo de um eixo, amostrado na Elevation API (Open-Meteo).
   O declive ao longo do eixo é a variável que comanda a velocidade de propagação
   ascendente e o tempo de fuga disponível: por isso o perfil é lido em termos
   operacionais e não apenas desenhado. */
const RUMOS16 = [["N",0],["NNE",22.5],["NE",45],["ENE",67.5],["E",90],["ESE",112.5],["SE",135],["SSE",157.5],
  ["S",180],["SSO",202.5],["SO",225],["OSO",247.5],["O",270],["ONO",292.5],["NO",315],["NNO",337.5]];
/** `n` pontos igualmente espaçados entre dois extremos, para amostrar o terreno. */
function pontosDoEixo(latA, lonA, latB, lonB, n){
  const P = [];
  for(let i=0;i<n;i++){ const t=i/(n-1);
    P.push({lat: latA+(latB-latA)*t, lon: lonA+(lonB-lonA)*t}); }
  return P;
}
/** Distância em quilómetros, planar com correção de latitude — chega a esta escala. */
function distKm(latA, lonA, latB, lonB){
  const dx=(lonB-lonA)*111320*Math.cos((latA+latB)/2*Math.PI/180), dy=(latB-latA)*111320;
  return Math.sqrt(dx*dx+dy*dy)/1000;
}
/**
 * Lê um par de coordenadas escrito à mão, com vírgula, ponto e vírgula ou espaço.
 *
 * Recusa o que não couber nos limites de latitude e longitude, em vez de devolver números
 * que passariam por coordenadas.
 */
function parPar(txt){
  const m = String(txt||"").split(/[,;\s]+/).map(x=>parseFloat(x.replace(",","."))).filter(x=>isFinite(x));
  return (m.length>=2 && Math.abs(m[0])<=90 && Math.abs(m[1])<=180)? {lat:m[0], lon:m[1]} : null;
}
/**
 * Traça o perfil do terreno ao longo de um eixo, por amostragem de altimetria.
 *
 * O eixo dá-se por rumo e distância, ou por um segundo ponto. Serve à análise da ZI: uma
 * encosta alinhada com o vento previsto lê-se aqui antes de se ver no terreno.
 */
async function tracarPerfil(){
  const info = $("pf-info");
  const base = parPar($("pf-a").value) || (()=>{ const p=parPar($("o-lat").value+","+$("o-lon").value); return p; })();
  if(!base){ info.textContent = "Sem coordenadas em Comando nem origem indicada."; irPara("p-occ"); return; }
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
/** Desenha o perfil gravado em SVG, com a escala vertical e a leitura por baixo. */
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
  if(t.orient) leitura.push("A exposição dominante registada na análise de relevo é "+t.orient+", declive "+(t.declive||"—")+": cruza este perfil com a previsão de vento em Planeamento antes de fixar o eixo de esforço.");
  L.innerHTML = `<div class="pf-m">${cartoes}</div>
    <p class="hint" style="margin-top:12px">${leitura.map(esc).join(" ")}</p>
    <p class="hint">Cotas da Elevation API do Open-Meteo, 100 amostras no eixo, resolução do modelo de terreno na ordem dos 30 m: serve para leitura de forma e de declive, não substitui a carta militar para medições finas.</p>`;
}

