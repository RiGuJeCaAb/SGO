/* ================= PLANEAMENTO · elaboração determinística do PEA ================= */
/* retrato do dispositivo no momento da emissão — alimenta as propostas determinísticas */
function retratoOperacional(){
  const e = estObj(), c = contarDispositivo(), PT = ptObj();
  const setores = (e.setores||[]).map((x,i)=>({n:NOMES_SETOR[i], estado:x.estado||"", cmd:x.cmd||"",
    m:totSetor(x).m, o:totSetor(x).o, tip:agruparTip(x.tip).map(g=>g.n+"× "+g.t)}));
  const conta = est => setores.filter(x=>x.estado===est).length;
  const ativos = setores.filter(x=>x.estado===ESTADOS_SETOR[0]);
  const reativados = setores.filter(x=>x.estado===ESTADOS_SETOR[4]);
  const R = (()=>{ try{ return rendicoes(); }catch(err){ return []; } })();
  return { setores, c, PT,
    nAtivos:ativos.length, ativos, reativados,
    nResolucao:conta(ESTADOS_SETOR[1]), nConclusao:conta(ESTADOS_SETOR[2]), nVigilancia:conta(ESTADOS_SETOR[3]),
    reserva:(+reservaObj().m||0), reservaOp:(+reservaObj().o||0),
    za:(+zaObj().m||0),
    excedidas:R.filter(x=>x.nivel==="r"), aviso:R.filter(x=>x.nivel==="a"),
    aereos:aerLista().length };
}
/** O dispositivo numa frase: quantos setores, em que estados, com que meios. */
function resumoRetrato(r){
  const p = [];
  p.push(r.setores.length+(r.setores.length===1? " setor":" setores"));
  if(r.nAtivos) p.push(r.nAtivos+" em curso");
  if(r.nResolucao) p.push(r.nResolucao+" em resolução");
  if(r.nConclusao) p.push(r.nConclusao+" em conclusão");
  if(r.nVigilancia) p.push(r.nVigilancia+" em vigilância ativa");
  if(r.reativados.length) p.push(r.reativados.length+" em reativação");
  return p.join(", ")+"; "+r.c.m+" meios e "+r.c.op+" operacionais"
    + (r.aereos? ", "+r.aereos+(r.aereos===1? " meio aéreo":" meios aéreos"):"")
    + (r.c.mr? ", "+r.c.mr+(r.c.mr===1? " máquina de rasto":" máquinas de rasto"):"")
    + (r.reserva? "; reserva de "+r.reserva+" meios":"; sem reserva constituída")+".";
}
/* o que mudou desde a proposta anterior — comparação com a fotografia guardada */
function diferencasDesde(anterior){
  if(!anterior || !anterior.dados || !anterior.dados.est) return [];
  const ant = anterior.dados.est, e = estObj(), out = [];
  (e.setores||[]).forEach((x,i)=>{
    const a = (ant.setores||[])[i];
    if(!a){ out.push("setor "+NOMES_SETOR[i]+" criado ("+(x.estado||"")+")"); return; }
    if((a.estado||"")!==(x.estado||"")) out.push("setor "+NOMES_SETOR[i]+": "+(a.estado||"—").toLowerCase()+" para "+(x.estado||"—").toLowerCase());
    const ma = totSetor(a).m, mx = totSetor(x).m;
    if(ma!==mx) out.push("setor "+NOMES_SETOR[i]+": "+ma+" para "+mx+" meios");
    if((a.cmd||"")!==(x.cmd||"") && x.cmd) out.push("setor "+NOMES_SETOR[i]+" com novo comandante");
  });
  if((ant.setores||[]).length > (e.setores||[]).length)
    out.push(((ant.setores||[]).length-(e.setores||[]).length)+" setores encerrados");
  const arA = (ant.aerL||[]).length, arX = aerLista().length;
  if(arA!==arX) out.push("meios aéreos: "+arA+" para "+arX);
  const resA = +((ant.res||{}).m)||0, resX = +reservaObj().m||0;
  if(resA!==resX) out.push("reserva: "+resA+" para "+resX+" meios");
  if((anterior.meta||{}).fase !== O.meta.fase) out.push("fase do SGO: "+((anterior.meta||{}).fase||"—")+" para "+(O.meta.fase||"—"));
  if((anterior.nivelDECIR||"") !== (O.meta.nivel||"") && O.meta.nivel) out.push("nível DECIR: "+(anterior.nivelDECIR||"—")+" para "+O.meta.nivel);
  return out;
}
