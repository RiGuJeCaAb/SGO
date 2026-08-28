/* ================= avisos IPMA por distrito do TO ================= */
let DISTRITOS_IPMA = null;
const NIVEL_AVISO = {yellow:{c:"am",n:"AMARELO"}, orange:{c:"lr",n:"LARANJA"}, red:{c:"vm",n:"VERMELHO"}};
function fmtAvisoT(iso){ const d=new Date(iso); return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+" "+String(d.getHours()).padStart(2,"0")+"h"; }
async function obterAvisos(silencioso){
  const lat = parseFloat($("o-lat").value.replace(",",".")), lon = parseFloat($("o-lon").value.replace(",","."));
  const el = $("avisos-ipma");
  if(Number.isNaN(lat)||Number.isNaN(lon)){ if(!silencioso){ el.innerHTML='<div class="av-box"><span class="avt">Avisos IPMA</span><span class="hint" style="margin:0">Sem coordenadas na secção 1.</span></div>'; } return; }
  try{
    if(!DISTRITOS_IPMA){
      const rd = await fetchT("https://api.ipma.pt/open-data/distrits-islands.json", {}, 8000);
      if(!rd.ok) throw "HTTP "+rd.status;
      DISTRITOS_IPMA = (await rd.json()).data;
    }
    let melhor=null, dmin=1e12;
    DISTRITOS_IPMA.forEach(d=>{
      const dx=(parseFloat(d.longitude)-lon)*Math.cos(lat*Math.PI/180), dy=parseFloat(d.latitude)-lat;
      const dd=dx*dx+dy*dy; if(dd<dmin){ dmin=dd; melhor=d; }
    });
    const ra = await fetchT("https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json", {}, 8000);
    if(!ra.ok) throw "HTTP "+ra.status;
    const agora = Date.now();
    const lista = (await ra.json())
      .filter(a=>a.idAreaAviso===melhor.idAreaAviso && a.awarenessLevelID!=="green" && new Date(a.endTime).getTime()>=agora)
      .map(a=>({tipo:a.awarenessTypeName, nivel:a.awarenessLevelID, ini:a.startTime, fim:a.endTime, txt:(a.text||"").slice(0,220)}))
      .sort((a,b)=>({red:0,orange:1,yellow:2}[a.nivel]-{red:0,orange:1,yellow:2}[b.nivel]));
    O.avisos = {distrito:melhor.local, cod:melhor.idAreaAviso, g:gdhAgora(), lista};
    pintarAvisos();
    fita("Avisos IPMA consultados — distrito "+melhor.local+": "+(lista.length? lista.map(a=>a.tipo+" "+NIVEL_AVISO[a.nivel].n).join("; ") : "sem avisos acima de verde"));
    persistir(false);
  }catch(e){
    if(!silencioso) el.innerHTML='<div class="av-box"><span class="avt">Avisos IPMA</span><span class="hint" style="margin:0">Indisponíveis ('+esc(String(e).slice(0,50))+') — consultar ipma.pt.</span></div>';
  }
}
function pintarAvisos(){
  const el = $("avisos-ipma"); if(!el) return;
  const A = O.avisos;
  if(!A){ el.innerHTML='<div class="av-box"><span class="avt">Avisos IPMA</span><span class="hint" style="margin:0">Obtidos automaticamente com a previsão, para o distrito do TO.</span><button class="av-atual" onclick="obterAvisos(false)">Consultar agora</button></div>'; return; }
  const chips = A.lista.length
    ? '<span class="av-chips">'+A.lista.map(a=>'<span class="av-c '+NIVEL_AVISO[a.nivel].c+'" title="'+esc(a.txt)+'">'+esc(a.tipo)+' — '+NIVEL_AVISO[a.nivel].n+'<small>até '+fmtAvisoT(a.fim)+'</small></span>').join("")+'</span>'
    : '<span class="av-ok">Sem avisos acima de verde em vigor.</span>';
  el.innerHTML = '<div class="av-box"><span class="avt">Avisos IPMA · '+esc(A.distrito)+' <small style="font-family:var(--mono);font-weight:500">('+esc(A.g)+')</small></span>'+chips+'<button class="av-atual" onclick="obterAvisos(false)">Atualizar</button></div>';
}
window.obterAvisos = obterAvisos;

