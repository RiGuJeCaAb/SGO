/* ================= NÚCLEO · arrumação da casa e guia de preenchimento ================= */
function pendencias(){
  const v = id => $(id).value.trim();
  return [
    {c:"N.º de ocorrência", ok:!!v("o-num"), p:"p-occ", ob:true},
    {c:"Local", ok:!!v("o-local"), p:"p-occ", ob:true},
    {c:"PCO", ok:!!v("o-pco"), p:"p-occ", ob:true},
    {c:"Fase SGO", ok:!!v("o-fase"), p:"p-occ", ob:true},
    {c:"Pasta de arquivo (localização)", ok:!!v("o-pasta"), p:"p-occ", ob:false},
    {c: COORD_APROX? "Coordenadas (origem estimada — confirmar)" : "Coordenadas (lat/lon)", ok:(!!v("o-lat")&&!!v("o-lon"))&&!COORD_APROX, p:"p-occ", ob:false},
    {c:"Área ardida (ha)", ok:!!v("d-area"), p:"p-fontes", ob:true},
    {c:"Setores e meios", ok:!!v("d-setores"), p:"p-fontes", ob:true},
    {c:"Pontos sensíveis", ok:!!v("d-sensiveis"), p:"p-fontes", ob:false},
    {c:"Início da ocorrência (GDH)", ok:!!v("o-inicio"), p:"p-occ", ob:false},
    {c:"Estrutura do PCO — funções exigíveis nomeadas", ok:(()=>{ try{ return funcoesExigiveis().every(x=>x.preenchida); }catch(e){ return true; } })(), p:"p-pco", ob:true},
    {c:"Plano de comunicações — canal de comando", ok:(()=>{ try{ return !!pcoObj().canais.cmd || !(estObj().setores||[]).length; }catch(e){ return true; } })(), p:"p-pco", ob:true},
    {c:"Canais de manobra por setor", ok:(()=>{ try{ return (estObj().setores||[]).every(x=>!!x.siresp); }catch(e){ return true; } })(), p:"p-pco", ob:false},
    {c:"Meteograma analisado", ok:!!ANALISE, p:"p-meteo", ob:true},
    {c:"Evolução registada desde o último PEA", ok:O.peas.length===0||evoDesdeUltimoPEA().length>0, p:"p-evo", ob:false}
  ];
}
