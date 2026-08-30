/* ================= PLANEAMENTO · perímetro e área da ZI (art. 28.º) ================= */
/**
 * Área em hectares de um perímetro GeoJSON.
 *
 * Até à r0052 devolvia **o maior anel** e mais nada. Um incêndio raramente é um polígono
 * só: parte-se em manchas separadas (MultiPolygon) e deixa ilhas por arder dentro do
 * perímetro (anéis interiores). O maior anel subestimava a área nas manchas separadas e
 * contava as ilhas como ardidas. A área vai no PEA e no ponto de situação — é número que
 * se transmite, não estimativa de gabinete.
 *
 * Agora: soma os anéis exteriores de todos os polígonos de todas as geometrias, e desconta
 * os interiores. Continua a ser planar com correção de latitude, que a esta escala chega:
 * o erro da projeção é muito menor do que o do próprio traçado do perímetro.
 *
 * @param {any} gj GeoJSON: FeatureCollection, Feature, GeometryCollection ou geometria
 * @returns {number} hectares, arredondados
 */
function areaGeoJSON(gj){
  if(!gj || typeof gj!=="object") return 0;
  /** Área planar de um anel, em m², sem sinal. */
  const areaAnel = anel => {
    if(!Array.isArray(anel) || anel.length < 4) return 0;
    const lats = anel.map(p=>+p[1]).filter(x=>isFinite(x));
    if(!lats.length) return 0;
    const latM = lats.reduce((a,b)=>a+b,0)/lats.length;
    const mLat = 111320, mLon = 111320*Math.cos(latM*Math.PI/180);
    let a = 0;
    for(let i=0;i<anel.length-1;i++){
      const p1=anel[i], p2=anel[i+1];
      if(!p1 || !p2) continue;
      a += (p1[0]*mLon)*(p2[1]*mLat) - (p2[0]*mLon)*(p1[1]*mLat);
    }
    return Math.abs(a/2);
  };
  /* Um polígono é o anel exterior menos as ilhas que traz dentro. */
  const areaPoligono = aneis => !Array.isArray(aneis) || !aneis.length? 0
    : Math.max(0, areaAnel(aneis[0]) - aneis.slice(1).reduce((t,a)=>t+areaAnel(a), 0));

  const somaGeometria = g => {
    if(!g || typeof g!=="object") return 0;
    if(g.type==="Polygon") return areaPoligono(g.coordinates);
    if(g.type==="MultiPolygon") return (g.coordinates||[]).reduce((t,p)=>t+areaPoligono(p), 0);
    if(g.type==="GeometryCollection") return (g.geometries||[]).reduce((t,x)=>t+somaGeometria(x), 0);
    return 0;
  };

  let feats;
  if(gj.type==="FeatureCollection") feats = gj.features||[];
  else if(gj.type==="Feature") feats = [gj];
  else feats = [{geometry:gj}];
  const m2 = feats.reduce((t,f)=>t + somaGeometria(f && f.geometry), 0);
  return Math.round(m2/10000);
}
$("d-perim").onchange = e=>{
  const f=e.target.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload = ()=>{ try{
      const gj=JSON.parse(String(rd.result)); const ha=areaGeoJSON(gj);
      O.dados.perimNome=f.name; if(ha>0){ O.dados.area=String(ha); $("d-area").value=ha; }
      /* A geometria fica gravada: sem ela não há croqui nem mapa, e até aqui era
         deitada fora assim que a área saía do polígono. */
      const gp = guardarPerimetro(gj, f.name);
      if(gp) fita("Perímetro guardado: "+gp.vertices+" vértices"+(gp.verticesOriginais>gp.vertices? " (simplificado de "+gp.verticesOriginais+")":""));
      try{ pintarCroqui(); }catch(e){}
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
$("p-limpar").onclick = ()=>{ O.dados.perimNome=""; O.dados.perim=null; try{ pintarCroqui(); }catch(e){} $("d-perim").value=""; $("d-perim-info").textContent="Nenhum perímetro carregado. Sem ficheiro, a área preenche-se à mão; com ficheiro, é calculada do polígono."; fita("Perímetro removido"); persistir(false); };
$("a-limpar").onclick = ()=>{ O.dados.anexos=[]; $("d-anexos").value=""; $("d-anexos-info").textContent="Anexadas por nome ao PEA (leitura automática do relevo: Fase 3 — agente de topografia)."; fita("Anexos removidos"); persistir(false); };
["t-orient","t-declive","t-obs"].forEach(id=>$(id).addEventListener("change", ()=>{
  lerForm();
  fita("Análise topográfica expedita atualizada ("+(O.dados.topo.orient||"—")+", "+(O.dados.topo.declive||"—")+")");
  persistir(false);
  if(ANALISE) pintarAnalise();
}));

