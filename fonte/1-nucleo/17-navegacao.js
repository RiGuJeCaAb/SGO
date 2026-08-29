/* ================= NÚCLEO · navegação ================= */
$("b-sinal").addEventListener("click", ()=>{
  document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));
  document.querySelectorAll(".pane").forEach(x=>x.classList.remove("on"));
  const bC = document.querySelector('nav button[data-p="p-comando"]');
  if(bC) bC.classList.add("on");
  $("p-comando").classList.add("on");
  try{ pintarDON(); }catch(e){}
  /* O `scrollTo(0)` que aqui estava desfazia o `scrollIntoView` do cartão: o sinal
     abria Comando e ficava no topo da página, longe dos avisos que o acenderam.
     Rolar depois de pintar, e uma vez só. */
  const av = cartaoPorTitulo("Avisos ativos");
  if(av) requestAnimationFrame(()=>{ try{ av.scrollIntoView({block:"start",behavior:"smooth"}); }catch(e){ window.scrollTo(0, /** @type {HTMLElement} */ (av).offsetTop); } });
  else window.scrollTo({top:0,behavior:"smooth"});
});
["r-av","r-lim","r-aer"].forEach(id=>{ const el=$(id); if(el) el.addEventListener("change", ()=>{ try{ pintarDON(); renderAereos(); }catch(e){} }); });
document.querySelectorAll("nav button").forEach(b=>{
  b.onclick=()=>{ document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));
    document.querySelectorAll(".pane").forEach(x=>x.classList.remove("on"));
    b.classList.add("on"); $(b.dataset.p).classList.add("on"); if(b.dataset.p==="p-planeamento") renderCheck(); };
});


/* ██████ COMANDO ██████ */
