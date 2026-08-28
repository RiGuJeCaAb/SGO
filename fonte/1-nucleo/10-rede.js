/* ================= NÚCLEO · rede ================= */
/* Num posto de comando a ligação é intermitente: a falha de rede é o comportamento
   normal, não o excecional. Todo o acesso passa por aqui, com prazo máximo de espera,
   cancelamento, classificação da falha e cache de pedidos idênticos — um pedido igual
   não se repete enquanto a resposta anterior ainda serve, e dois pedidos iguais em
   simultâneo partilham a mesma ida à rede. Sem prazo máximo, um pedido pendente deixa
   a interface à espera de algo que não vem. */
const REDE = {
  espera: 6000,      /* prazo por omissão, em milissegundos */
  validade: 90000,   /* durante quanto tempo uma resposta idêntica ainda serve */
  cache: new Map(),
  ultimo: null       /* último desfecho, para diagnóstico */
};

/** @param {string} motivo @param {string} texto @returns {Error & {motivo:string, estado?:number}} */
function erroRede(motivo, texto){ const e = /** @type {Error & {motivo:string}} */ (new Error(texto)); e.motivo = motivo; return e; }

/* Frase pronta a mostrar, a partir do motivo da falha. O utilizador tem de saber se
   ficou sem rede, se a origem demorou, ou se recusou. */
function motivoRede(err){
  const m = err && err.motivo;
  if(m==="sem-rede") return "sem ligação de dados";
  if(m==="tempo-esgotado") return "a origem não respondeu dentro do prazo";
  if(m==="recusado") return "a origem recusou o pedido"+(err.estado? " ("+err.estado+")":"");
  return "falha de rede";
}

function semRede(){ return typeof navigator!=="undefined" && navigator.onLine===false; }

/* Devolve a resposta tal como o fetch a daria: quem chama continua a verificar r.ok. */
async function fetchT(url, opts={}, ms){
  const prazo = ms || REDE.espera;
  const metodo = String(opts.method||"GET").toUpperCase();
  const guardavel = metodo==="GET" && !opts.semCache;
  const inicio = agora();

  if(guardavel){
    const guardado = REDE.cache.get(url);
    if(guardado && (inicio-guardado.ts) < REDE.validade) return (await guardado.p).clone();
    if(guardado) REDE.cache.delete(url);
  }

  /* Sem rede não se espera pelo prazo: responde-se já, com o motivo certo. */
  if(semRede()){
    REDE.ultimo = {url, ok:false, motivo:"sem-rede", ts:inicio};
    throw erroRede("sem-rede", "sem ligação de dados");
  }

  const pedido = {}; for(const k in opts){ if(k!=="semCache") pedido[k]=opts[k]; }
  const ac = new AbortController();
  const t = setTimeout(()=>ac.abort(), prazo);
  const p = fetch(url, {...pedido, signal:ac.signal}).then(r=>{
    REDE.ultimo = {url, ok:r.ok, motivo:r.ok? null:"recusado", estado:r.status, ts:agora()};
    if(!r.ok) REDE.cache.delete(url);   /* recusa não se guarda */
    return r;
  }).catch(err=>{
    const motivo = (err && err.name==="AbortError")? "tempo-esgotado" : "falhou";
    REDE.ultimo = {url, ok:false, motivo, ts:agora()};
    REDE.cache.delete(url);
    throw erroRede(motivo, String((err && err.message) || err));
  }).finally(()=>clearTimeout(t));

  if(guardavel) REDE.cache.set(url, {ts:inicio, p});
  return (await p).clone();
}
function variantes(local){
  // "Vila Chã de Caria - Moimenta da Beira" -> segmentos e reduções do primeiro
  const segs = local.split(/[\u2014\u2013,\-/]+/).map(x=>x.trim()).filter(Boolean);
  const v = [];
  if(segs[0]){
    v.push(segs[0]);
    const pal = segs[0].split(/\s+/);
    if(pal.length>2) v.push(pal.slice(-2).join(" "));
    if(pal.length>1) v.push(pal[pal.length-1]);
  }
  segs.slice(1).forEach(x=>v.push(x));
  return [...new Set(v.filter(x=>x.length>2))];
}
async function geoOpenMeteo(local){
  for(const q of variantes(local)){
    try{
      const r = await fetchT("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(q)+"&count=5&language=pt&format=json");
      if(!r.ok) continue;
      const d = await r.json();
      const res = (d.results||[]).filter(x=>x.country_code==="PT");
      if(res.length) return res.map(x=>({lat:x.latitude, lon:x.longitude, nome:[x.name,x.admin2||x.admin1].filter(Boolean).join(", ")+(q!==variantes(local)[0]? " (via \""+q+"\")":"")}));
    }catch(e){}
  }
  throw "sem resultados";
}
async function geoPhoton(local){
  const segs = local.split(/[\u2014\u2013,\-/]+/).map(x=>x.trim()).filter(Boolean);
  const q = segs.join(", ");
  const r = await fetchT("https://photon.komoot.io/api/?q="+encodeURIComponent(q)+"&limit=5&lang=default");
  if(!r.ok) throw "HTTP "+r.status;
  const d = await r.json();
  const res = (d.features||[]).filter(f=>f.properties && f.properties.countrycode==="PT");
  if(!res.length) throw "sem resultados";
  return res.map(f=>({lat:f.geometry.coordinates[1], lon:f.geometry.coordinates[0],
    nome:[f.properties.name, f.properties.city||f.properties.county, f.properties.state].filter(Boolean).join(", ")}));
}
async function geoNominatim(local){
  const segs = local.split(/[\u2014\u2013,\-/]+/).map(x=>x.trim()).filter(Boolean);
  const r = await fetchT("https://nominatim.openstreetmap.org/search?q="+encodeURIComponent(segs.join(", ")+", Portugal")+"&format=json&limit=5&countrycodes=pt",
    {headers:{"Accept":"application/json"}});
  if(!r.ok) throw "HTTP "+r.status;
  const d = await r.json();
  if(!d.length) throw "sem resultados";
  return d.map(x=>({lat:x.lat, lon:x.lon, nome:x.display_name.split(",").slice(0,3).join(",")}));
}
async function geoModelo(q){
  const j = await llm(`Indica as coordenadas geográficas aproximadas (WGS84, graus decimais) da localidade portuguesa "${q}". Responde APENAS JSON válido: {"lat":41.0,"lon":-7.0,"nome":"nome normalizado"}. Se não conheceres a localidade com confiança razoável, responde {"erro":"desconhecida"}.`);
  if(j.erro || typeof j.lat!=="number") throw "modelo sem resposta fiável";
  return [{lat:j.lat, lon:j.lon, nome:j.nome+" — aproximadas"}];
}
async function geocodificar(){
  const q0 = $("o-local").value.trim();
  if(!q0){ $("geo-info").textContent = "Escreve primeiro o local."; return; }
  $("geo-opts").innerHTML = "";
  COORD_APROX = false;
  const passos = [
    ["Photon/OSM", ()=>geoPhoton(q0)],
    ["Open-Meteo", ()=>geoOpenMeteo(q0)],
    ["OpenStreetMap", ()=>geoNominatim(q0)],
  ];
  const falhas = [];
  for(const [nome, fn] of passos){
    $("geo-info").textContent = "A procurar coordenadas de "+q0+" ("+nome+")...";
    try{ mostrarCandidatos(await fn(), nome); return; }
    catch(e){ falhas.push(nome); }
  }
  $("geo-info").textContent = "Motores geográficos sem resposta ("+falhas.join(", ")+") — a tentar estimativa pelo modelo...";
  try{ COORD_APROX = true; mostrarCandidatos(await geoModelo(q0), "modelo — APROXIMADAS, verificar no mapa"); return; }catch(e){}
  COORD_APROX = false;
  $("geo-info").textContent = "Sem coordenadas automáticas ("+falhas.join(", ")+" e modelo indisponíveis) — cola do Google Maps/carta no campo abaixo, em qualquer formato.";
}
/* ================= distrito do teatro de operações =================
   Determinado a partir das coordenadas do TO; qualifica o pacote de canais aplicável,
   já que os grupos de conversação são de âmbito distrital, sob gestão e direção do comando. */
const DISTRITOS_PT = ["Aveiro","Beja","Braga","Bragança","Castelo Branco","Coimbra","Évora","Faro","Guarda","Leiria","Lisboa","Portalegre","Porto","Santarém","Setúbal","Viana do Castelo","Vila Real","Viseu","Angra do Heroísmo","Horta","Ponta Delgada","Funchal"];
function normalizarDistrito(txt){
  if(!txt) return "";
  const t = String(txt).replace(/^distrito\s+d[eoa]s?\s+/i,"").trim();
  const achado = DISTRITOS_PT.find(d=>d.toLowerCase()===t.toLowerCase())
    || DISTRITOS_PT.find(d=>t.toLowerCase().indexOf(d.toLowerCase())>=0);
  return achado || t;
}
async function distritoPorCoords(lat, lon){
  try{
    const r = await fetchT("https://photon.komoot.io/reverse?lat="+lat+"&lon="+lon+"&lang=default&limit=1");
    if(r.ok){
      const d = await r.json(), p = (d.features&&d.features[0])? d.features[0].properties : null;
      if(p && p.countrycode==="PT"){
        const dd = normalizarDistrito(p.state||"");
        if(dd) return {distrito:dd, concelho:p.county||p.city||"", fonte:"Photon/OSM"};
      }
    }
  }catch(e){}
  try{
    const r = await fetchT("https://nominatim.openstreetmap.org/reverse?format=json&zoom=8&lat="+lat+"&lon="+lon,
      {headers:{"Accept":"application/json"}});
    if(r.ok){
      const d = await r.json(), a = d.address||{};
      const dd = normalizarDistrito(a.state || a.county || "");
      if(dd) return {distrito:dd, concelho:a.municipality||a.county||"", fonte:"OpenStreetMap"};
    }
  }catch(e){}
  return null;
}
async function atualizarDistrito(forcar){
  const lat = parseFloat(String($("o-lat").value).replace(",",".")),
        lon = parseFloat(String($("o-lon").value).replace(",","."));
  if(!isFinite(lat) || !isFinite(lon)) return;
  const ch = lat.toFixed(3)+","+lon.toFixed(3);
  if(!forcar && O.meta.distrito && O.meta.distritoChave===ch) return;
  const r = await distritoPorCoords(lat, lon);
  if(!r) return;
  const antes = O.meta.distrito||"";
  O.meta.distrito = r.distrito; O.meta.concelho = r.concelho||""; O.meta.distritoChave = ch;
  if(antes && antes!==r.distrito) fita("Distrito do TO alterado: "+antes+" para "+r.distrito+" ("+r.fonte+")");
  else if(!antes) fita("Distrito do TO determinado por coordenadas: "+r.distrito+(r.concelho? ", concelho de "+r.concelho:"")+" ("+r.fonte+")");
  try{ renderCatalogo(); renderComs(); }catch(e){}
  persistir(false);
}
$("b-geo").onclick = geocodificar;
function autoGeo(){ if($("o-local").value.trim() && !$("o-lat").value.trim() && !$("o-lon").value.trim()) geocodificar(); }
$("o-local").addEventListener("blur", autoGeo);
$("o-local").addEventListener("change", autoGeo);

