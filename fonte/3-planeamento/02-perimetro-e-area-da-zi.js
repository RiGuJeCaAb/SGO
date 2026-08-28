/* ================= PLANEAMENTO · perímetro e área da ZI (art. 28.º) ================= */
function areaGeoJSON(gj){
  // devolve hectares (aprox. planar com correção de latitude) do maior polígono
  let feats=[];
  if(gj.type==="FeatureCollection") feats=gj.features;
  else if(gj.type==="Feature") feats=[gj];
  else feats=[{geometry:gj}];
  let melhor=0;
  for(const f of feats){
    const g=f.geometry; if(!g) continue;
    const polys = g.type==="Polygon"? [g.coordinates] : (g.type==="MultiPolygon"? g.coordinates : []);
    for(const rings of polys){
      const ring=rings[0]; if(!ring||ring.length<4) continue;
      const lat0 = ring[0][1]*Math.PI/180, mLat=111320, mLon=111320*Math.cos(lat0);
      let a=0;
      for(let i=0;i<ring.length-1;i++){
        const x1=ring[i][0]*mLon, y1=ring[i][1]*mLat, x2=ring[i+1][0]*mLon, y2=ring[i+1][1]*mLat;
        a += x1*y2 - x2*y1;
      }
      melhor = Math.max(melhor, Math.abs(a/2)/10000);
    }
  }
  return Math.round(melhor);
}
$("d-perim").onchange = e=>{
  const f=e.target.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload = ()=>{ try{
      const gj=JSON.parse(String(rd.result)); const ha=areaGeoJSON(gj);
      O.dados.perimNome=f.name; if(ha>0){ O.dados.area=String(ha); $("d-area").value=ha; }
      $("d-perim-info").textContent="Carregado: "+f.name+(ha>0? " · área estimada "+ha+" ha":" · sem polígono legível — introduz a área manualmente");
      fita("Perímetro carregado: "+f.name+(ha>0?" ("+ha+" ha est.)":""));
      persistir(false);
    }catch(err){ $("d-perim-info").textContent="Ficheiro inválido — esperado GeoJSON."; } };
  rd.readAsText(f);
};
$("d-anexos").onchange = e=>{
  O.dados.anexos = Array.from(e.target.files).map(f=>f.name);
  $("d-anexos-info").textContent = "Anexos: "+O.dados.anexos.join(", ");
  fita("Anexos registados: "+O.dados.anexos.join(", "));
  persistir(false);
};
$("b-dados").onclick = ()=>{ lerForm(); fita("Dados da ocorrência atualizados (setores/área/sensíveis)"); persistir(false); aviso("msg-dados","ok","Dados guardados — entram no próximo PEA."); };
$("p-limpar").onclick = ()=>{ O.dados.perimNome=""; $("d-perim").value=""; $("d-perim-info").textContent="Nenhum ficheiro carregado. A área é estimada automaticamente a partir do polígono."; fita("Perímetro removido"); persistir(false); };
$("a-limpar").onclick = ()=>{ O.dados.anexos=[]; $("d-anexos").value=""; $("d-anexos-info").textContent="Anexadas por nome ao PEA (leitura automática do relevo: Fase 3 — agente de topografia)."; fita("Anexos removidos"); persistir(false); };
["t-orient","t-declive","t-obs"].forEach(id=>$(id).addEventListener("change", ()=>{
  lerForm();
  fita("Análise topográfica expedita atualizada ("+(O.dados.topo.orient||"—")+", "+(O.dados.topo.declive||"—")+")");
  persistir(false);
  if(ANALISE) pintarAnalise();
}));

