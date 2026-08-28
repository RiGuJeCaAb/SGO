/* ================= meios aéreos nominais ================= */
function aerLista(){
  const e = estObj();
  if(!Array.isArray(e.aerL)){
    e.aerL = [];
    /* migração: ocorrências antigas guardavam apenas a contagem em e.aer */
    const n = parseInt(e.aer,10);
    if(n>0) for(let k=0;k<n;k++) e.aerL.push({t:"HEBL", ind:"", g:"", ts:0});
  }
  e.aer = String(e.aerL.length||"");
  return e.aerL;
}
function renderAereos(){
  const box = $("s-aer-box"); if(!box) return;
  const e = estObj(), L = aerLista();
  box.style.display = e.livre? "none" : "";
  const sel = $("aer-t");
  if(sel && !sel.options.length){
    sel.innerHTML = CATALOGO.filter(c=>c.ar)
      .map(c=>'<option value="'+c.t+'"'+(c.c? ' title="'+esc(c.c)+'"':'')+'>'+c.t+(c.ind? " · "+c.ind:"")+'</option>').join("");
  }
  const ch = $("aer-chips"); if(!ch) return;
  ch.innerHTML = L.length? L.map((a,j)=>{
    const d = catDef(a.t);
    const h = a.ts? (Date.now()-a.ts)/3600000 : null;
    const lim = limiares().aer;
    const cor = h===null? "var(--tx2)" : (h>=lim? "var(--fogo)" : (h>=Math.max(1,lim-2)? "var(--terra)" : "var(--tx2)"));
    return `<span class="tchip"><b>${esc(a.ind||d.ind||a.t)}</b> ${esc(a.t)}${h!==null? ` <span style="color:${cor};font-weight:600">${h.toFixed(1)} h</span>`:""}
      <button type="button" data-aerdel="${j}" aria-label="remover">×</button></span>`;
  }).join("") : '<span class="hint">Sem meios aéreos registados.</span>';
  ch.querySelectorAll("[data-aerdel]").forEach(b=>b.addEventListener("click", ()=>{
    const j=+b.dataset.aerdel, a=L[j];
    fita("Meio aéreo desmobilizado: "+(a.ind||a.t)+(a.ts? " ("+((Date.now()-a.ts)/3600000).toFixed(1)+" h no TO)":""));
    L.splice(j,1); aerLista(); renderAereos(); comporSetores(); pintarDON(); persistir(false);
  }));
}

