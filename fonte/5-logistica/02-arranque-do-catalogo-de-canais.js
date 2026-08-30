/* ================= LOGÍSTICA · arranque do catálogo de canais ================= */
function initCatalogo(){
  const oR = Object.keys(REDES).map(k=>'<option value="'+k+'">'+esc(REDES[k])+'</option>').join("");
  const oN = '<option value="">— sem nível —</option>'+Object.keys(NIVEIS).map(k=>'<option value="'+k+'">'+esc(NIVEIS[k])+'</option>').join("");
  if($("cat-rede")) $("cat-rede").innerHTML = oR;
  if($("cat-niv"))  $("cat-niv").innerHTML  = oN;
  if($("cat-pasta")) $("cat-pasta").innerHTML = Object.keys(PASTAS).map(k=>'<option value="'+k+'"'+(k==="local"?" selected":"")+'>'+esc(PASTAS[k].t)+' — '+esc(PASTAS[k].d)+'</option>').join("");
  const bAdd = $("cat-add");
  if(bAdd) bAdd.addEventListener("click", ()=>{
    const des = $("cat-des").value.trim();
    if(!des){ aviso("msg-occ","err","Indica a designação do canal."); return; }
    if(!canalAdd($("cat-rede").value, des, $("cat-niv").value, $("cat-nota").value,
                 $("cat-pasta").value, $("cat-area").value)){
      aviso("msg-occ","err","Já existe \""+des+"\" nessa rede."); return; }
    $("cat-des").value=""; $("cat-nota").value=""; $("cat-area").value="";
    fita("Canal acrescentado fora do pacote: "+des);
    renderCatalogo(); renderComs(); pintarSelTodos();
    aviso("msg-occ","ok","Canal "+des+" acrescentado.");
  });
  const bRep = $("cat-repor");
  if(bRep) bRep.addEventListener("click", ()=>{
    const base = pacoteBase(), ex = CANAIS.ent.filter(x=>!x.pk);
    CANAIS.ent = base.concat(ex.filter(x=>!base.some(p=>p.rede===x.rede && p.des.toUpperCase()===String(x.des).toUpperCase())));
    ordenarCanais(); guardarCanais(); fita("Pacote de canais do distrito reposto");
    renderCatalogo(); renderComs(); pintarSelTodos();
    aviso("msg-occ","ok","Pacote reposto: "+CANAIS.ent.filter(x=>x.pk).length+" canais, mais "+ex.length+" fora do pacote.");
  });
  const bExp = $("cat-exp");
  if(bExp) bExp.addEventListener("click", ()=>{
    descarregar("CSREPCDouro_"+carimboFich()+"_PacoteCanais_CLD.json",
      JSON.stringify({v:2, g:gdhAgora(), origem:"CSREPC Douro — Estação PEA", ent:CANAIS.ent}, null, 2));
    aviso("msg-occ","ok","Pacote exportado ("+CANAIS.ent.length+" canais).");
  });
  const bImpB = $("cat-imp-b"), fImp = $("cat-imp");
  if(bImpB && fImp){
    bImpB.addEventListener("click", ()=>fImp.click());
    fImp.addEventListener("change", ()=>{
      const f = fImp.files && fImp.files[0]; if(!f) return;
      const r = new FileReader();
      r.onload = () => {
        try{
          const c = JSON.parse(String(r.result));
          const ent = Array.isArray(c)? c : (c && Array.isArray(c.ent)? c.ent : null);
          if(!ent) throw "formato inesperado";
          let n=0; ent.forEach(x=>{ if(x && x.des && REDES[x.rede] && canalAdd(x.rede, x.des, x.niv, x.nota, x.pasta, x.area)) n++; });
          fita("Pacote de canais importado: "+n+" novos canais de "+f.name);
          renderCatalogo(); renderComs(); pintarSelTodos();
          aviso("msg-occ","ok", n? n+(n===1? " canal importado.":" canais importados."):"Nenhum canal novo no ficheiro.");
        }catch(e){ aviso("msg-occ","err","Ficheiro de pacote inválido ("+e+")."); }
        fImp.value="";
      };
      r.readAsText(f);
    });
  }
  const bLim = $("cat-limpar");
  if(bLim) bLim.addEventListener("click", ()=>{
    if(!confirm("Esvaziar o pacote de canais deste dispositivo? Os canais já atribuídos na ocorrência mantêm-se.")) return;
    CANAIS.ent = []; guardarCanais(); fita("Pacote de canais esvaziado");
    renderCatalogo(); renderComs(); pintarSelTodos();
  });
  renderCatalogo(); pintarSelTodos();
}

/* ================= plano de comunicações =================
   O COS decide que níveis coloca a funcionar; cada nível abre o painel com os canais
   a atribuir e os interlocutores que existem no dispositivo (art. 4.º do Despacho
   n.º 4067/2024; DON n.º 1 / DIOPS, organização das comunicações). */
