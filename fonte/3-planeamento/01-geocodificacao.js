/* ================= PLANEAMENTO · geocodificação (art. 28.º) ================= */
function fixarCoords(lat, lon, nome, fonte){
  $("o-lat").value = (+lat).toFixed(5); $("o-lon").value = (+lon).toFixed(5);
  $("geo-opts").innerHTML = "";
  renderFormats();
  if(COORD_APROX){
    $("geo-info").innerHTML = "Coordenadas de "+esc(nome)+" ("+esc(fonte)+"). <span style=\"color:var(--terra);font-weight:600\">Origem estimada — confirma no mapa antes de usar no meteograma.</span>";
  } else {
    $("geo-info").textContent = "Coordenadas de "+nome+" ("+fonte+").";
  }
  fita("Coordenadas obtidas: "+nome+" "+(+lat).toFixed(4)+", "+(+lon).toFixed(4)+" ("+fonte+")");
  persistir(false);
  setTimeout(()=>{ try{ atualizarDistrito(true); }catch(e){} }, 0);
}
function mostrarCandidatos(lista, fonte){
  if(lista.length===1){ const c=lista[0]; fixarCoords(c.lat, c.lon, c.nome, fonte); return; }
  $("geo-info").textContent = "Vários resultados — escolhe o correto:";
  $("geo-opts").innerHTML = lista.map((c,i)=>
    `<div class="geo-c" onclick="escolherGeo(${i})"><b>${esc(c.nome)}</b><span>${(+c.lat).toFixed(4)}, ${(+c.lon).toFixed(4)}</span></div>`).join("");
  window.__geoLista = lista; window.__geoFonte = fonte;
}
window.escolherGeo = i => { const c=window.__geoLista[i]; fixarCoords(c.lat, c.lon, c.nome, window.__geoFonte); };
let COORD_APROX = false;
