/* ================= eventos ================= */
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
$("b-gerar").onclick=emitirPEA;
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
