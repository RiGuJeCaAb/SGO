/* ================= NÚCLEO · navegação ================= */
$("b-sinal").addEventListener("click", ()=>{
  document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));
  document.querySelectorAll(".pane").forEach(x=>x.classList.remove("on"));
  const bC = document.querySelector('nav button[data-p="p-comando"]');
  if(bC) bC.classList.add("on");
  $("p-comando").classList.add("on");
  const av = cartaoPorTitulo("Avisos ativos"); if(av) try{ av.scrollIntoView({block:"start",behavior:"smooth"}); }catch(e){}
  try{ pintarDON(); }catch(e){}
  window.scrollTo({top:0,behavior:"smooth"});
});
["r-av","r-lim","r-aer"].forEach(id=>{ const el=$(id); if(el) el.addEventListener("change", ()=>{ try{ pintarDON(); renderAereos(); }catch(e){} }); });
document.querySelectorAll("nav button").forEach(b=>{
  b.onclick=()=>{ document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));
    document.querySelectorAll(".pane").forEach(x=>x.classList.remove("on"));
    b.classList.add("on"); $(b.dataset.p).classList.add("on"); if(b.dataset.p==="p-planeamento") renderCheck(); };
});


/* ██████ COMANDO ██████ */
