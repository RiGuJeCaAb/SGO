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

/* Carga e estado de cada setor, para a análise da repartição do dispositivo.

   `ativo` é o setor onde o fogo ainda pede meios — em curso, ou reativado.
   `libertavel` é aquele cujo estado já não os justifica na mesma medida — em conclusão,
   ou em vigilância ativa. **Não quer dizer vazio:** a vigilância ativa e o rescaldo
   exigem presença, e por isso a análise nunca conta meios parados em absoluto — compara
   uns setores com os outros. O estado intermédio, em resolução (dominado), não é nem um
   nem outro: ainda consolida, e não se mexe nele. */
function cargaDosSetores(){
  const ATIVOS = [ESTADOS_SETOR[0], ESTADOS_SETOR[4]];
  const LIBERTAVEIS = [ESTADOS_SETOR[2], ESTADOS_SETOR[3]];
  return (estObj().setores||[]).map((s,i)=>{
    const t = totSetor(s);
    return { i, nome:NOMES_SETOR[i] || ("Setor "+(i+1)), estado:s.estado||"",
      m:t.m, op:t.o, forcas:(s.tip||[]).length, cmd:s.cmd||"",
      ativo: ATIVOS.indexOf(s.estado) >= 0,
      reativado: s.estado === ESTADOS_SETOR[4],
      libertavel: LIBERTAVEIS.indexOf(s.estado) >= 0 };
  });
}
