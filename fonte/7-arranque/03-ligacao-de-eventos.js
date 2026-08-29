/* ================= ARRANQUE · ligação de eventos ================= */
$("b-guardar").onclick=()=>{ fita("Identificação da ocorrência guardada"); persistir(true); };
async function guardarGlobal(){
  const b=$("b-save"); const rot=b.textContent;
  await persistir(false);
  fita("Estado guardado manualmente (botão global)");
  b.textContent="Guardado"; b.disabled=true;
  setTimeout(()=>{ b.textContent=rot; b.disabled=false; }, 1600);
}
$("b-save").addEventListener("click", guardarGlobal);
document.addEventListener("keydown", e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="s"){ e.preventDefault(); guardarGlobal(); }
});
$("b-carregar").onclick=()=>carregar(null);
$("b-nova").onclick=()=>{ O=novoEstado(); escreverForm(); $("f-csv").value=""; $("c-analise").style.display="none"; SERIE=[]; ANALISE=null; $("pea-view").innerHTML=""; pintarTudo(); aviso("msg-occ","ok","Estado limpo — nova ocorrência."); };
$("b-evo").onclick=addEvo;
$("b-analisar").onclick=()=>analisarCSV(true);
$("m-horas").addEventListener("change", ()=>{ if($("f-csv").value.trim()) analisarCSV(false); });
try{ arrumarCasa(); }catch(e){ console.error("arrumação:", e); }
$("b-gerar").onclick=emitirPEA;
(function(){
  const eq=$("tn-eq"), ini=$("tn-ini"), fx=$("tn-fechar");
  if(eq) eq.addEventListener("change", ()=>{ turnoObj().equipa = eq.value.trim(); persistir(false); });
  if(ini) ini.addEventListener("change", ()=>{ turnoObj().inicio = ini.value.trim(); renderTurno(); pintarDON(); persistir(false); });
  if(fx) fx.addEventListener("click", fecharTurno);
})();
try{ pintarModoLLM(); }catch(e){}

/* tema claro/escuro com memória */
async function aplicarTema(t){
  document.documentElement.dataset.tema = t;
  $("b-tema").textContent = t==="claro" ? "Escuro" : "Claro";
  $("b-tema").title = t==="claro" ? "Mudar para o tema escuro" : "Mudar para o tema claro";
  try{ await ARMAZEM.set("peaapp:tema", t); }catch(e){}
}
$("b-tema").onclick = ()=> aplicarTema(document.documentElement.dataset.tema==="claro" ? "escuro" : "claro");
(async()=>{ try{ const r=await ARMAZEM.get("peaapp:tema"); if(r&&r.value) aplicarTema(r.value); else $("b-tema").textContent="Claro"; }catch(e){ $("b-tema").textContent="Claro"; } })();

/* arranque: app abre vazia; índice de arquivo é carregado para consulta */
(async()=>{ try{ await carregarIndex(); }catch(e){} 
  try{ await carregarCanais(); }catch(e){}
  try{ initCatalogo(); }catch(e){}
  if(ARMAZEM.modo==="sessao"){
    fita("AVISO: armazenamento indisponivel neste ambiente — o estado perde-se ao fechar a pagina");
    /* Aviso permanente, não uma mensagem que passa: aqui a exportação deixa de ser
       conveniência e passa a ser a única forma de não perder a ocorrência. */
    const h = $("occ-armazem");
    if(h) h.textContent = "ATENÇÃO: este dispositivo não tem armazenamento disponível — o estado perde-se ao fechar a página. Exporta a ocorrência para ficheiro com regularidade; é a única forma de não a perder.";
  }
  const bExpO = $("b-exportar");
  if(bExpO) bExpO.addEventListener("click", ()=>exportarOcorrencia());
  const bImpO = $("b-importar-b"), fImpO = $("b-importar");
  if(bImpO && fImpO){
    bImpO.addEventListener("click", ()=>fImpO.click());
    fImpO.addEventListener("change", async ()=>{
      const f = fImpO.files && fImpO.files[0]; if(!f) return;
      try{ await importarOcorrencia(await f.text()); }
      catch(e){ aviso("msg-occ","err","Não foi possível ler o ficheiro ("+e+")."); }
      fImpO.value = "";
    });
  }
  pintarTudo(); })();

/* ---- importação da Gestão PCO ---- */
(()=>{
  const bF = $("gp-b"), inF = $("gp-f"), cx = $("gp-colar"), caixa = $("gp-colar-x"), bLer = $("gp-ler");
  if(bF && inF){
    bF.addEventListener("click", ()=>inF.click());
    inF.addEventListener("change", async ()=>{
      const f = inF.files && inF.files[0]; if(!f) return;
      try{ await importarGestaoPCO(await f.text()); }
      catch(e){ aviso("gp-msg","err","Não foi possível ler o ficheiro ("+e+")."); }
      inF.value = "";
    });
  }
  if(cx && caixa) cx.addEventListener("change", ()=>{ caixa.style.display = cx.checked? "":"none"; });
  if(bLer) bLer.addEventListener("click", async ()=>{
    const t = ($("gp-txt").value||"").trim();
    if(!t){ aviso("gp-msg","err","Cola primeiro o conteúdo exportado pela Gestão PCO."); return; }
    if(await importarGestaoPCO(t)) $("gp-txt").value = "";
  });
})();

/* ---- briefing de passagem de comando ---- */
(()=>{
  const bG = $("br-gerar"), bD = $("br-baixar");
  if(bG) bG.addEventListener("click", ()=>{ try{ gerarBriefing(); }catch(e){ aviso("msg-occ","err","Não foi possível elaborar o briefing ("+e+")."); } });
  if(bD) bD.addEventListener("click", ()=>{ try{ descarregarBriefing(); }catch(e){ aviso("msg-occ","err","Não foi possível descarregar ("+e+")."); } });
})();

/* encerramento da ocorrência — art. 8.º, n.º 2 */
(function(){
  const bE = $("enc-encerrar"), bR = $("enc-reabrir");
  const dizer = (cls, txt) => { const m = $("enc-msg"); if(!m) return;
    m.className = "msg "+cls; m.textContent = txt; m.style.display = "block"; };
  if(bE) bE.addEventListener("click", async ()=>{
    const v = verificarEncerramento();
    const aviso = v.reservas.length? "\n\nCom reservas:\n· "+v.reservas.join("\n· ") : "";
    if(!window.confirm("Encerrar o registo da ocorrência "+(O.meta.num||"")+"?"
      +"\n\nO registo fica fechado à escrita. Não encerra a ocorrência no SADO."+aviso)) return;
    const r = await encerrarOcorrencia($("enc-por").value, $("enc-nota").value);
    if(!r.ok){ dizer("err", r.motivo); pintarEncerramento(); return; }
    dizer("ok", "Registo encerrado."+(r.reservas.length? " "+r.reservas.length+" reserva(s) ficaram no processo." : ""));
    pintarTudo();
  });
  if(bR) bR.addEventListener("click", async ()=>{
    const motivo = window.prompt("Motivo da reabertura (fica no registo):", "");
    if(motivo === null) return;
    const r = await reabrirOcorrencia($("enc-por").value, motivo);
    if(!r.ok){ dizer("err", r.motivo); return; }
    dizer("ok", "Registo reaberto.");
    pintarTudo();
  });
})();
