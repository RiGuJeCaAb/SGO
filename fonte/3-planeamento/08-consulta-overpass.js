/* ================= consulta Overpass =================
   Vários espelhos, POST em vez de GET (evita URL longos e alguns bloqueios de CORS)
   e diagnóstico legível: com o ficheiro aberto em file:// há espelhos que recusam
   o pedido, e nesse caso o que interessa é dizê-lo e passar ao seguinte. */
/**
 * Grava o que a deteção encontrou, com a proveniência e a hora.
 *
 * Guarda-se a distância e o rumo, e não a coordenada: é assim que a deteção os calcula,
 * é assim que o oficial os lê no ecrã, e é o que basta para recolocar cada ponto no
 * croqui a partir do ponto da ocorrência. Guardar a coordenada além disso era guardar
 * duas verdades sobre a mesma coisa.
 */
function guardarDetecao(itens, origem, raioKm){
  if(!Array.isArray(itens) || !itens.length) return null;
  O.dados.sensDet = {
    itens: itens.map(x=>({ nome:x.nome, tipo:x.tipo, dist:x.dist, rumo:x.rumo, sens:!!x.sens })),
    origem, g:gdhAgora(), raioKm };
  try{ pintarCroqui(); }catch(e){}
  return O.dados.sensDet;
}

const OVERPASS = [
  {u:"https://overpass-api.de/api/interpreter", n:"overpass-api.de"},
  {u:"https://overpass.kumi.systems/api/interpreter", n:"kumi.systems"},
  {u:"https://overpass.private.coffee/api/interpreter", n:"private.coffee"},
  {u:"https://overpass.osm.jp/api/interpreter", n:"osm.jp"}
];
/**
 * Uma consulta ao Overpass, por espelhos em cadeia até um responder.
 *
 * Vários espelhos porque, com o ficheiro aberto em `file://`, há servidores que recusam o
 * pedido — e nesse caso o que interessa é dizê-lo e passar ao seguinte. Quando falham
 * todos, o erro traz o que cada um respondeu: um diagnóstico legível vale mais do que
 * «indisponível».
 *
 * @param {string} q a consulta, na linguagem do Overpass
 * @param {(t:string)=>void} [aviso] para ir dizendo por onde vai
 */
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
/**
 * Procura candidatos a ponto de trânsito na carta, entre 1,5 e 8 km da ocorrência.
 *
 * Quartéis primeiro, depois espaços amplos — parques e postos de combustível —, porque é
 * essa a ordem em que se procura no terreno. **Sugere, não adota**: o ponto de trânsito é
 * decisão da logística.
 */
async function sugerirPT(){
  const lat = parseFloat($("o-lat").value.replace(",",".")), lon = parseFloat($("o-lon").value.replace(",","."));
  if(Number.isNaN(lat)||Number.isNaN(lon)){ $("pt-info").textContent="Sem coordenadas na ocorrência — preenche-as em Comando."; irPara("p-occ"); return; }
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
        '<button type="button" class="tchip" style="cursor:pointer'+(it.tipo==="fire_station"?';border-color:var(--madeira)':'')+'" data-pt="'+esc(i)+'">'
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
        '<button type="button" class="tchip" style="cursor:pointer" data-pt="'+esc(i)+'"><b>'+esc(it.nome)+'</b> '+esc(it.rot)+' · '+it.dist.toFixed(1)+' km a '+it.rumo+'</button>').join("");
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
/**
 * Procura aglomerados e equipamentos sensíveis num raio de 3 km.
 *
 * Escolas, creches, hospitais e lares a vermelho: são os que obrigam a defesa perimétrica
 * e, se for caso, a evacuação — art. 27.º, n.º 1, al. b). Cada um vem com a distância e o
 * rumo, que é como se transmitem e como o croqui os recoloca.
 */
async function detetarSensiveis(){
  const lat = parseFloat($("o-lat").value.replace(",",".")), lon = parseFloat($("o-lon").value.replace(",","."));
  if(Number.isNaN(lat)||Number.isNaN(lon)){ $("sens-info").textContent="Sem coordenadas na ocorrência — preenche-as em Comando."; irPara("p-occ"); return; }
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
      /* A deteção fica gravada. Vivia só em `window.__sensLista`, que morre ao
         recarregar: quem voltasse à ocorrência perdia o que já tinha sido detetado, e
         o croqui ficava sem nada à volta do perímetro. */
      guardarDetecao(itens, "Overpass/OSM", 3);
      $("sens-info").textContent = itens.length+" detetados — clica para adicionar (equipamentos sensíveis a vermelho):";
      $("sens-sug").innerHTML = itens.map((it,i)=>
        '<button type="button" class="tchip" style="cursor:pointer'+(it.sens?';border-color:var(--fogo)':'')+'" data-sens="'+esc(i)+'"><b'+(it.sens?' style="color:var(--fogo)"':'')+'>'+esc(it.nome)+'</b> '+esc(it.tipo)+' · '+it.dist.toFixed(1)+' km a '+it.rumo+'</button>').join("")
        + '<button type="button" class="tchip" style="cursor:pointer;border-color:var(--agua)" data-sens-todos="1"><b>Adicionar todos</b></button>';
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
      guardarDetecao(itens, "Photon", 6);
      $("sens-info").textContent = itens.length+" detetados pelo Photon (Overpass indisponível) — clica para adicionar:";
      $("sens-sug").innerHTML = itens.map((it,i)=>
        '<button type="button" class="tchip" style="cursor:pointer'+(it.sens?';border-color:var(--fogo)':'')+'" data-sens="'+esc(i)+'"><b'+(it.sens?' style="color:var(--fogo)"':'')+'>'+esc(it.nome)+'</b> '+esc(it.tipo)+' · '+it.dist.toFixed(1)+' km a '+it.rumo+'</button>').join("")
        + '<button type="button" class="tchip" style="cursor:pointer;border-color:var(--agua)" data-sens-todos="1"><b>Adicionar todos</b></button>';
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

