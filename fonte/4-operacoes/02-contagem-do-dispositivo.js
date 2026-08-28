/* ================= OPERAÇÕES · contagem do dispositivo (art. 17.º, al. a)) ================= */
function contarDispositivo(){
  const e = (O.dados && O.dados.est) || {n:0,setores:[],aer:"",aerL:[],livre:false};
  let ar = 0, mr = 0, m = 0, op = 0, arCombSet = 0;
  (e.setores||[]).forEach(x=>{
    (x.tip||[]).forEach(it=>{
      const d = catDef(it.t), q = +it.q||0;
      ar += q * (+it.ar || d.ar || 0);
      if(d.comb) arCombSet += q;
      mr += q * (+it.mr || d.mr || 0);
      m  += q * (+it.mu || 1);
      op += q * (+it.ou || 0);
    });
    if(!(x.tip||[]).length){ m += +x.m||0; op += +x.o||0; }
  });
  let arComb = arCombSet, arCoord = 0;
  aerLista().forEach(x=>{ const d = catDef(x.t); ar++; if(d.comb) arComb++; if(x.t==="HERAC"||x.t==="AVRAC") arCoord++; });
  const RS = reservaObj(), ZA = zaObj();
  m  += (+RS.m || 0) + (+ZA.m || 0);
  op += (+RS.o || 0) + (+ZA.o || 0);
  return {ar, arComb, arCoord, mr, m, op, setores:(e.setores||[]).length};
}
