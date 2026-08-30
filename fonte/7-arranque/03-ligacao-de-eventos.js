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
try{ dobrarAjudas(); }catch(e){ console.error("ajudas:", e); }
try{ dobrarCartoes(); }catch(e){ console.error("cartões dobráveis:", e); }
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
(async()=>{
  /* Antes de ler o que quer que seja: passar ao IndexedDB, se este navegador o der, e
     trazer com ele o que estava guardado na camada anterior. */
  try{ await prepararArmazem(); }catch(e){}
  try{ await diarioRetomar(); }catch(e){}
  try{ await carregarIndex(); }catch(e){} 
  try{ await carregarCanais(); }catch(e){}
  try{ initCatalogo(); }catch(e){}
  try{ montarFrases(); }catch(e){}
  try{ ligarCamposGDH(); }catch(e){}
  try{ await carregarSessao(); pintarSessao(); }catch(e){}
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

/* catálogo de elementos — vive fora da ocorrência */
function pintarElementos(termo){
  const el = $("el-lista"); if(!el) return;
  const L = procurarElementos(termo);
  if(!L.length){
    el.innerHTML = ELEMENTOS.length
      ? '<p class="hint">Nenhum elemento corresponde à procura.</p>'
      : '<p class="hint">Catálogo vazio. Guardar aqui, ou recolher os que já estão nomeados nesta ocorrência.</p>';
    return;
  }
  el.innerHTML = L.map(x=>
    '<div class="arq-i"><div><b>'+esc(x.nome)+(x.entidade? " — "+esc(x.entidade):"")+'</b>'
    + '<p>'+esc(x.funcao||"função por indicar")+(x.ct? " · "+esc(x.ct):"")
    + (x.nota? " · "+esc(x.nota):"")+'</p></div>'
    + '<div class="acts"><button class="btn btn-b" type="button" data-el-usar="'+esc(x.id)+'">Nomear</button>'
    + '<button class="btn btn-g" type="button" data-el-editar="'+esc(x.id)+'">Editar</button>'
    + '<button class="btn btn-r" type="button" data-el-apagar="'+esc(x.id)+'">Apagar</button></div></div>').join("");

  /* «Editar» traz o registo de volta ao formulário deste cartão e fixa o `id` que se
     está a corrigir. Sem esse `id`, mudar o nome criava um segundo elemento em vez de
     corrigir o primeiro, porque a gravação procura por nome e entidade. Corrigir um
     contacto obrigava a apagar e reescrever, e apagar é destrutivo onde bastava
     corrigir. */
  el.querySelectorAll("[data-el-editar]").forEach(b=>b.addEventListener("click", ()=>{
    const x = ELEMENTOS.find(y=>y.id === b.getAttribute("data-el-editar")); if(!x) return;
    const campos = {"el-nome":x.nome, "el-ent":x.entidade, "el-ct":x.ct, "el-fn":x.funcao, "el-nota":x.nota};
    Object.keys(campos).forEach(id=>{ const c = $(id); if(c) c.value = campos[id] || ""; });
    EL_EDICAO = x.id;
    const g = $("el-add");
    if(g) g.textContent = "Guardar alterações";
    const cx = $("el-cancelar"); if(cx) cx.style.display = "";
    aviso("el-msg","ok","A corrigir «"+x.nome+"». Guardar substitui este registo; cancelar deixa-o como está.");
    const c = $("el-nome"); if(c){ c.focus(); try{ c.scrollIntoView({block:"center",behavior:"smooth"}); }catch(e){} }
  }));

  /* «Nomear» leva o elemento ao formulário da estrutura do PCO. Não nomeia sozinho:
     a função e o GDH são decisão de quem comanda. */
  el.querySelectorAll("[data-el-usar]").forEach(b=>b.addEventListener("click", ()=>{
    const x = ELEMENTOS.find(y=>y.id === b.getAttribute("data-el-usar")); if(!x) return;
    if($("pc-n")) $("pc-n").value = x.nome;
    if($("pc-e")) $("pc-e").value = x.entidade;
    if($("pc-c")) $("pc-c").value = x.ct;
    irPara("p-comando");
    const alvo = $("pc-f"); if(alvo) alvo.focus();
  }));
  el.querySelectorAll("[data-el-apagar]").forEach(b=>b.addEventListener("click", async ()=>{
    const id = b.getAttribute("data-el-apagar");
    const x = ELEMENTOS.find(y=>y.id === id); if(!x) return;
    if(!window.confirm("Apagar "+x.nome+" do catálogo? A ocorrência não é tocada.")) return;
    await apagarElemento(id); pintarElementos($("el-proc")? $("el-proc").value : "");
  }));
}

(function(){
  const dizer = (cls, txt) => { const m = $("el-msg"); if(!m) return;
    m.className = "msg "+cls; m.textContent = txt; m.style.display = "block"; };
  const campos = ["el-nome","el-ent","el-ct","el-fn","el-nota"];
  const bA = $("el-add");
  if(bA) bA.addEventListener("click", async ()=>{
    const corrigia = EL_EDICAO;
    const r = await guardarElemento({ id: EL_EDICAO || "", nome:$("el-nome").value, entidade:$("el-ent").value,
      ct:$("el-ct").value, funcao:$("el-fn").value, nota:$("el-nota").value });
    if(!r.ok){ dizer("err", r.motivo); return; }
    dizer("ok", corrigia? "Registo corrigido."
      : (r.novo? "Elemento guardado no catálogo." : "Elemento já existia; os campos preenchidos foram atualizados."));
    campos.forEach(id=>{ const e=$(id); if(e) e.value=""; });
    sairDaEdicaoElemento();
    pintarElementos($("el-proc").value);
  });
  const bC = $("el-cancelar");
  if(bC) bC.addEventListener("click", ()=>{
    campos.forEach(id=>{ const e=$(id); if(e) e.value=""; });
    sairDaEdicaoElemento();
    dizer("ok", "Correção cancelada; o registo ficou como estava.");
  });
  const bR = $("el-recolher");
  if(bR) bR.addEventListener("click", async ()=>{
    const fora = elementosPorRecolher();
    if(!fora.length){ dizer("ok", "Nada por recolher: quem está nomeado nesta ocorrência já está no catálogo."); return; }
    if(!window.confirm("Guardar no catálogo "+fora.length+" elemento(s) desta ocorrência?\n\n"
      + fora.map(x=>"· "+x.nome+(x.entidade? " ("+x.entidade+")":"")).join("\n"))) return;
    for(const x of fora) await guardarElemento(x);
    dizer("ok", fora.length+(fora.length===1? " elemento recolhido." : " elementos recolhidos."));
    pintarElementos($("el-proc").value);
  });
  const bP = $("el-proc");
  if(bP) bP.addEventListener("input", ()=>pintarElementos(bP.value));
  carregarElementos().then(()=>pintarElementos(""));
})();

/* ---- quem regista: identidade declarada ---- */
function pintarSessao(){
  const sel = $("id-perfil");
  if(sel && !sel.options.length){
    sel.innerHTML = PERFIS.map(p=>'<option value="'+esc(p.k)+'">'+esc(p.n)+'</option>').join("");
  }
  if(sel) sel.value = SESSAO.perfil || PERFIL_DEF;
  if($("id-posto")) $("id-posto").value = SESSAO.posto || "";
  if($("id-nome")) $("id-nome").value = SESSAO.nome || "";
  const e = $("id-estado");
  if(e){
    e.textContent = haSessao()
      ? "Ao teclado desde " + SESSAO.desde + ": " + quemRegista() + " · " + perfilDe(SESSAO.perfil).n
        + ". Os atos registados levam este nome."
      : "Ninguém declarado ao teclado — os atos ficam sem nome atribuído, e a aplicação pede-o no momento.";
    e.style.color = haSessao()? "" : "var(--terra)";
  }
  const bL = $("id-largar"); if(bL) bL.style.display = haSessao()? "" : "none";
  const bA = $("id-assumir"); if(bA) bA.textContent = haSessao()? "Atualizar" : "Assumir o teclado";
}
(()=>{
  const bA = $("id-assumir");
  if(bA) bA.addEventListener("click", async ()=>{
    const r = await assumirTeclado($("id-nome").value, $("id-posto").value, $("id-perfil").value);
    if(!r.ok){ aviso("id-msg","err",r.motivo); return; }
    aviso("id-msg","ok","Ao teclado: "+quemRegista()+" ("+perfilDe(SESSAO.perfil).n+").");
    pintarSessao(); persistir(false);
  });
  const bL = $("id-largar");
  if(bL) bL.addEventListener("click", async ()=>{ await largarTeclado(); pintarSessao(); persistir(false); });
})();

/* ---- cópias de segurança e diário ---- */
async function pintarCopias(){
  const el = $("cp-lista"); if(!el) return;
  const modo = $("cp-modo");
  if(modo){
    modo.textContent = ARMAZEM.modo === "indexeddb"
      ? "Armazenamento: IndexedDB — escrita do estado e do arquivo numa só transação, e espaço para o diário e para as cópias."
      : "Armazenamento: " + (ARMAZEM.modo === "claude"? "do ambiente" : ARMAZEM.modo === "browser"? "localStorage" : "memória da sessão")
        + " — sem transação conjunta; o diário fica limitado às últimas " + DIARIO_MAX_LEVE
        + " linhas e guarda-se uma cópia apenas. Exportar para ficheiro com regularidade é aqui ainda mais importante.";
    modo.style.color = ARMAZEM.modo === "indexeddb"? "" : "var(--terra)";
  }
  const L = await copiasListar();
  el.innerHTML = L.length
    ? L.map(c=>`<div class="arq-i"><div><b>${esc(c.g)}</b> — ${esc(c.num||"sem número")}${c.local? " · "+esc(c.local):""}
        <p>${esc(c.motivo)} · carimbo ${esc(resumoCurto(c.sha))}</p></div>
        <div class="acts"><button class="btn btn-b" type="button" data-cp-repor="${esc(c.id)}">Repor</button></div></div>`).join("")
    : '<p class="hint">Sem cópias guardadas. A primeira é guardada assim que a ocorrência tiver número.</p>';
  el.querySelectorAll("[data-cp-repor]").forEach(b=>b.addEventListener("click", async ()=>{
    const c = L.find(x=>x.id === b.getAttribute("data-cp-repor"));
    if(!window.confirm("Repor a cópia de "+(c? c.g : "")+"?\n\nO estado atual é guardado como cópia antes de ser substituído.")) return;
    const r = await copiaRepor(b.getAttribute("data-cp-repor"));
    aviso("cp-msg", r.ok? "ok":"err", r.ok? "Cópia de "+r.copia.g+" reposta. O estado anterior ficou guardado." : r.motivo);
    pintarCopias();
  }));
}
(()=>{
  const bG = $("cp-guardar");
  if(bG) bG.addEventListener("click", async ()=>{
    const c = await copiaGuardar("guardada à mão");
    aviso("cp-msg", c? "ok":"err", c? "Cópia guardada ("+resumoCurto(c.sha)+")." : "Não foi possível guardar a cópia.");
    pintarCopias();
  });
  const bC = $("cp-conferir");
  if(bC) bC.addEventListener("click", async ()=>{
    const r = await diarioConferir();
    aviso("cp-msg", r.ok? "ok":"err", r.ok
      ? "Diário com "+r.linhas+" linhas; a cadeia confere de ponta a ponta."
      : "ATENÇÃO: a cadeia do diário parte "+(r.partidas.length===1? "na linha ":"nas linhas ")+r.partidas.join(", ")
        +". O registo do posto foi alterado ou está corrompido.");
  });
})();

/* ---- declaração da fase ---- */
(()=>{
  const b = $("fase-declarar");
  if(b) b.addEventListener("click", ()=>{
    const r = declararFase(b.getAttribute("data-fase"), {});
    if(!r.ok){ aviso("fase-msg","err",r.motivo); return; }
    aviso("fase-msg","ok","Fase "+b.getAttribute("data-fase")+" declarada e registada na evolução.");
    persistir(false);
  });
  const sel = $("o-fase");
  if(sel) sel.addEventListener("change", ()=>{ try{ pintarFase(); }catch(e){} });
})();
