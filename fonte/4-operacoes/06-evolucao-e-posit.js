/* ================= OPERAÇÕES · evolução e POSIT (art. 17.º, al. a)) ================= */
function addEvo(){
  const t=$("e-txt").value.trim(); if(!t) return;
  O.evolucao.push({g:$("e-gdh").value.trim()||gdhAgora(), tipo:$("e-tipo").value, txt:t});
  $("e-txt").value=""; $("e-gdh").value="";
  fita("Evolução registada ("+O.evolucao[O.evolucao.length-1].tipo+")");
  try{ pintarDON(); }catch(e){}
  persistir(false);
}
function evoDesdeUltimoPEA(){
  const marca = O.peas.length? O.peas[O.peas.length-1].evoIdx : 0;
  return O.evolucao.slice(marca);
}


/* ██████ LOGÍSTICA ██████ */
