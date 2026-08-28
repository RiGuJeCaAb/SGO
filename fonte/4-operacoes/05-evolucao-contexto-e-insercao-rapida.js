/* ================= OPERAÇÕES · evolução: contexto e inserção rápida ================= */
function inserirEvo(txt){
  const ta = $("e-txt");
  const atual = ta.value;
  ta.value = atual + (atual && !atual.endsWith(" ") && !atual.endsWith(": ")? " ":"") + txt;
  ta.focus();
}
function pintarEvoCtx(){
  const e = O.dados && O.dados.est;
  const el = $("evo-ctx"); if(!el) return;
  if(!e || !e.n){ el.innerHTML = '<span class="hint">Define os setores na secção 2 e aparecem aqui como atalhos.</span>'; return; }
  const chips = e.setores.map((x,i)=>{
    const t = totSetor(x);
    const mo = (x.tip||[]).length? t.m+"m/"+t.o+"op" : ((x.m||x.o)? (x.m||"?")+"m/"+(x.o||"?")+"op" : "");
    return `<span class="tchip" style="cursor:pointer" data-ins="Setor ${NOMES_SETOR[i]}: "><b>${NOMES_SETOR[i]}</b> ${esc(x.estado||"")}${mo? " · "+mo:""}</span>`;
  });
  const AL = (()=>{ try{ return aerLista(); }catch(err){ return []; } })();
  if(AL.length) chips.push(`<span class="tchip" style="cursor:pointer" data-ins="Meios aéreos: "><b>Aéreos</b> ${AL.length} · ${esc(AL.map(a=>a.ind||a.t).join(", "))}</span>`);
  const RSc = reservaObj();
  if(RSc.m||RSc.o) chips.push(`<span class="tchip" style="cursor:pointer" data-ins="Reserva: "><b>Reserva</b> ${esc(RSc.m||"?")}m/${esc(RSc.o||"?")}op</span>`);
  el.innerHTML = chips.join("");
  el.querySelectorAll("[data-ins]").forEach(c=>c.addEventListener("click", ()=>inserirEvo(c.dataset.ins)));
}
document.querySelectorAll("#evo-frases [data-fr]").forEach(b=>b.addEventListener("click", ()=>{
  inserirEvo(b.dataset.fr+"; ");
  if(b.dataset.tp) $("e-tipo").value = b.dataset.tp;
}));



/* ================= estrutura do posto de comando — Despacho n.º 4067/2024 =================
   ob: função obrigatória a partir de determinada fase | cond: predicado sobre o dispositivo */
