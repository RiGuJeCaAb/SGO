/* ================= coordenadas: conversões WGS84 (decimal · GMD · GMS) ================= */
function fmtDec(lat,lon){ return (+lat).toFixed(5)+", "+(+lon).toFixed(5); }
function fmtGMD(v,isLat){
  const h = isLat ? (v>=0?"N":"S") : (v>=0?"E":"W");
  const a=Math.abs(v), d=Math.floor(a), m=(a-d)*60;
  return String(d).padStart(isLat?2:3,"0")+"\u00B0 "+m.toFixed(3).padStart(6,"0")+"' "+h;
}
function fmtGMS(v,isLat){
  const h = isLat ? (v>=0?"N":"S") : (v>=0?"E":"W");
  const a=Math.abs(v), d=Math.floor(a), mF=(a-d)*60, m=Math.floor(mF), sec=(mF-m)*60;
  return String(d).padStart(isLat?2:3,"0")+"\u00B0 "+String(m).padStart(2,"0")+"' "+sec.toFixed(1).padStart(4,"0")+"'' "+h;
}
function renderFormats(){
  const lat=parseFloat($("o-lat").value.replace(",",".")), lon=parseFloat($("o-lon").value.replace(",","."));
  const el=$("coord-formats");
  if(Number.isNaN(lat)||Number.isNaN(lon)){ el.innerHTML=""; return; }
  el.innerHTML = `
    <div class="cfmt"><span class="lab">Decimal (WGS84)</span><span class="val">${fmtDec(lat,lon)}</span><span class="uso">APIs · SpotWX · Open-Meteo</span></div>
    <div class="cfmt"><span class="lab">Graus e minutos (GMD)</span><span class="val">${fmtGMD(lat,true)} &nbsp; ${fmtGMD(lon,false)}</span><span class="uso">comunicacao radio · meios aereos</span></div>
    <div class="cfmt"><span class="lab">Graus, minutos e segundos</span><span class="val">${fmtGMS(lat,true)} &nbsp; ${fmtGMS(lon,false)}</span><span class="uso">documento PEA · cartas</span></div>`;
}
function parseCoordAny(txt){
  // devolve {lat,lon} ou null — aceita decimal, GMD e GMS, com N/S/E/W/O
  let t = txt.toUpperCase().replace(/[\u00B0\u2019\u2032\u2033"']+/g," ").replace(/,/g," , ").trim();
  // separar em duas metades: por letras de hemisferio ou por virgula
  const hemis = t.match(/[NSEWO](?![A-Z])/g) || [];
  let partes;
  const iNS = Math.max(t.indexOf("N"), t.indexOf("S"));
  const iEWOs = ["E","W","O"].map(c=>t.indexOf(c)).filter(i=>i>=0);
  const iL = iEWOs.length? Math.min(...iEWOs) : -1;
  if(hemis.length>=2 && iNS>=0 && iL>=0){
    if(iNS<=2 && iL>iNS){ partes=[t.slice(0,iL), t.slice(iL)]; }   // prefixo: N ... W ...
    else { partes=[t.slice(0,iNS+1), t.slice(iNS+1)]; }            // sufixo: ... N ... W
  } else if(t.includes(",")){
    partes = t.split(",").filter(x=>x.trim());
  } else {
    const nums = t.match(/-?\d+(?:\.\d+)?/g)||[];
    if(nums.length===2) partes=[nums[0], nums[1]];
    else if(nums.length===4) partes=[nums[0]+" "+nums[1], nums[2]+" "+nums[3]];
    else if(nums.length===6) partes=[nums.slice(0,3).join(" "), nums.slice(3).join(" ")];
    else return null;
  }
  if(!partes || partes.length<2) return null;
  function umLado(p, isLat){
    const neg = /[SWO](?![A-Z])/.test(p) || /^\s*-/.test(p);
    const nums = (p.match(/\d+(?:\.\d+)?/g)||[]).map(Number);
    if(!nums.length) return NaN;
    let v;
    if(nums.length===1) v=nums[0];
    else if(nums.length===2) v=nums[0]+nums[1]/60;
    else v=nums[0]+nums[1]/60+nums[2]/3600;
    v = neg? -v : v;
    const lim = isLat?90:180;
    return (Math.abs(v)<=lim)? v : NaN;
  }
  let lat=umLado(partes[0],true), lon=umLado(partes[1],false);
  if(Number.isNaN(lat)||Number.isNaN(lon)) return null;
  // salvaguarda: par trocado (lon, lat) no continente — deteta e corrige com aviso
  let nota = "";
  if(lat>=-10 && lat<=-6 && lon>=36 && lon<=43){ const tmp=lat; lat=lon; lon=tmp; nota="ordem lat/lon trocada — corrigida automaticamente"; }
  // salvaguarda: fora do território nacional (continente, Açores, Madeira) — aceita mas avisa
  const dentroPT = (lat>=29 && lat<=43 && lon>=-32 && lon<=-6);
  if(!dentroPT && !nota) nota = "fora dos limites de Portugal — confirma antes de usar";
  return {lat,lon,nota};
}
$("c-any").addEventListener("change", ()=>{
  const r = parseCoordAny($("c-any").value);
  if(!r){ $("geo-info").textContent = "Formato de coordenadas nao reconhecido — verifica o exemplo do campo."; return; }
  $("o-lat").value = r.lat.toFixed(5); $("o-lon").value = r.lon.toFixed(5);
  COORD_APROX = false;
  $("c-any").value = "";
  renderFormats();
  fita("Coordenadas introduzidas manualmente: "+fmtDec(r.lat,r.lon)+(r.nota? " ("+r.nota+")":""));
  persistir(false);
  setTimeout(()=>{ try{ atualizarDistrito(true); }catch(e){} }, 0);
  $("geo-info").textContent = "Coordenadas convertidas e fixadas (WGS84)."+(r.nota? " ATENCAO: "+r.nota+".":"");
});
$("o-lat").addEventListener("input", renderFormats);
$("o-lon").addEventListener("input", renderFormats);

