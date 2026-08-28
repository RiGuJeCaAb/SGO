/* ================= verificação de dados ================= */
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
window.irPara = pid => { document.querySelector('nav button[data-p="'+pid+'"]').click(); };
const NOMES_PANE = {"p-occ":"secção 1 · Ocorrência","p-fontes":"secção 2 · Fontes de dados","p-pco":"secção 3 · PCO e comunicações","p-evo":"secção 4 · Evolução","p-meteo":"secção 5 · Meteograma","p-pea":"secção 6 · PEA","p-avisos":"secção de avisos"};
function pintarGuia(){
  const L = pendencias();
  // estado por separador
  ["p-occ","p-fontes","p-pco","p-evo","p-meteo"].forEach(p=>{
    const btn = document.querySelector('nav button[data-p="'+p+'"]'); if(!btn) return;
    const itens = L.filter(x=>x.p===p);
    const falta = itens.filter(x=>!x.ok&&x.ob).length, rec = itens.filter(x=>!x.ok&&!x.ob).length;
    let nb = btn.querySelector(".nb");
    if(!nb){ nb=document.createElement("span"); nb.className="nb"; btn.appendChild(nb); }
    /* o distintivo só aparece quando há algo por fazer: a ausência é o sinal de secção completa */
    if(falta){ nb.className="nb f"; nb.textContent=String(falta); btn.title=falta+(falta===1? " campo obrigatório em falta nesta secção":" campos obrigatórios em falta nesta secção"); }
    else if(rec){ nb.className="nb r"; nb.textContent=String(rec); btn.title=rec+(rec===1? " campo recomendado por preencher; nada obrigatório em falta":" campos recomendados por preencher; nada obrigatório em falta"); }
    else { nb.className="nb c"; nb.textContent=""; btn.title="Secção completa"; }
  });
  // próximo passo
  const g=$("guia"), gt=$("guia-txt"), gi=$("guia-ir");
  const prim = L.find(x=>!x.ok&&x.ob);
  if(prim){
    g.className="guia-in falta";
    gt.textContent = prim.c+" ("+(NOMES_PANE[prim.p]||prim.p)+")";
    gi.style.display=""; gi.onclick=()=>irPara(prim.p);
  } else {
    g.className="guia-in ok";
    gt.textContent = "Dados obrigatórios completos — podes emitir a proposta de PEA na secção 6.";
    gi.style.display=""; gi.onclick=()=>irPara("p-pea");
  }
}
async function alternarAjuda(on){
  document.documentElement.classList.toggle("ajuda", on);
  $("b-ajuda").setAttribute("aria-pressed", on? "true":"false");
  $("b-ajuda").textContent = on? "Ocultar" : "Ajuda";
  $("b-ajuda").title = on? "Ocultar a ajuda no ecrã" : "Mostrar a ajuda no ecrã";
  try{ await ARMAZEM.set("peaapp:ajuda", on? "1":"0"); }catch(e){}
}
$("b-ajuda").addEventListener("click", ()=>alternarAjuda(!document.documentElement.classList.contains("ajuda")));
(async()=>{ let on=true; try{ const r=await ARMAZEM.get("peaapp:ajuda"); on = r.value!=="0"; }catch(e){}
  alternarAjuda(on); })();
["o-inicio","o-fase","o-nivel"].forEach(id=>{
  const el=$(id); if(el){ el.addEventListener("change", ()=>{ try{ autoNivelDECIR(); pintarDON(); }catch(e){} }); el.addEventListener("input", ()=>{ try{ autoNivelDECIR(); pintarDON(); }catch(e){} }); }
});
/* a banda de conformidade depende do relógio: reavaliação a cada 30 segundos */
setInterval(()=>{ try{ pintarDON(); renderVigor(); }catch(e){} }, 30000);
["o-num","o-local","o-pco","o-fase","o-pasta","o-lat","o-lon","o-inicio","o-nivel","d-area","d-sensiveis"].forEach(id=>{
  const el=$(id); if(el) el.addEventListener("change", ()=>{ try{ pintarGuia(); renderCheck(); }catch(e){} });
});
["o-lat","o-lon"].forEach(id=>{ const el=$(id); if(el) el.addEventListener("change", ()=>{ try{ atualizarDistrito(); }catch(e){} }); });
function renderCheck(){
  const L = pendencias();
  const falta = L.filter(x=>!x.ok&&x.ob).length;
  $("chk-list").innerHTML = L.map(x=>{
    const cls = x.ok? "ok" : (x.ob? "falta":"rec");
    const rot = x.ok? "COMPLETO" : (x.ob? "EM FALTA":"RECOMENDADO");
    return `<div class="chk"><span class="est ${cls}">${rot}</span><span class="cmp">${esc(x.c)}</span>${x.ok? "" : `<button class="ir" onclick="irPara('${x.p}')">Preencher</button>`}</div>`;
  }).join("") + (falta? `<p class="hint" style="margin-top:10px;color:var(--fogo)">Faltam ${falta} dados obrigatórios — o PEA não pode ser emitido sem eles.</p>`
                       : `<p class="hint" style="margin-top:10px;color:var(--madeira)">Dados obrigatórios completos — pronto para emitir.</p>`);
}

