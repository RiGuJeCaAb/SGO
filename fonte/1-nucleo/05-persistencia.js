/* ================= NÚCLEO · persistência ================= */
function chave(){ return "peaapp:occ:"+(O.meta.num||"sem-num"); }
async function persistir(nota){
  lerForm();
  try{
    /* Numa transação só. O estado ia numa chave e o índice noutra: uma falha entre as
       duas deixava o arquivo a apontar para uma ocorrência que não ficou gravada, ou uma
       ocorrência gravada que o arquivo não conhecia. Onde não houver transação, escreve-se
       na mesma ordem de sempre — e `ARMAZEM.atomico` diz qual dos dois casos é. */
    const pares = [[chave(), JSON.stringify(O)], ["peaapp:ultima", O.meta.num]];
    if(O.meta.num){
      INDEX = INDEX.filter(x=>x.num!==O.meta.num);
      INDEX.push({num:O.meta.num, local:O.meta.local, pasta:O.meta.pasta||"Sem pasta", pco:O.meta.pco, g:gdhAgora(), peas:O.peas.length});
      pares.push(["peaapp:index", JSON.stringify(INDEX)]);
    }
    await ARMAZEM.setVarias(pares);
    if(nota) aviso("msg-occ","ok","Ocorrência "+O.meta.num+" guardada.");
  }catch(e){ if(nota) aviso("msg-occ","err","Não foi possível guardar ("+e+")."); }
  try{ await copiaSeDevida(); }catch(e){}
  pintarTudo();
}
async function carregar(num){
  try{
    if(!num){ const u=await ARMAZEM.get("peaapp:ultima"); num=u?u.value:null; }
    if(!num){ aviso("msg-occ","err","Nenhuma ocorrência guardada neste dispositivo."); return; }
    const r = await ARMAZEM.get("peaapp:occ:"+num);
    O = migrarGravado(JSON.parse(r.value));
    escreverForm(); pintarTudo();
    if(O.csv){ $("f-csv").value=O.csv; analisarCSV(false); }
    aviso("msg-occ","ok","Ocorrência "+num+" reposta ("+O.peas.length+" PEA, "+O.evolucao.length+" registos).");
    setTimeout(()=>{ try{ atualizarDistrito(); }catch(e){} }, 0);
  }catch(e){ aviso("msg-occ","err", e && e.futuro
      ? "Ocorrência gravada por uma revisão posterior (versão "+e.futuro+"). Abre-a na revisão mais recente; esta não lhe toca."
      : "Sem estado guardado para repor."); }
}
/* Cada campo do formulário declara em data-campo o caminho do seu lugar no estado,
   e escreve só nesse lugar. Nada é reconstruído — e por isso não há campos derivados
   para preservar à mão: distrito, concelho e distritoChave nunca são tocados, porque
   nada passa por eles. Acrescentar um campo derivado deixou de exigir cuidado aqui. */
function escreverCaminho(raiz, caminho, valor){
  const partes = caminho.split(".");
  let alvo = raiz;
  for(let i=0;i<partes.length-1;i++){
    if(!alvo[partes[i]] || typeof alvo[partes[i]]!=="object") alvo[partes[i]] = {};
    alvo = alvo[partes[i]];
  }
  alvo[partes[partes.length-1]] = valor;
}
function lerCampo(el){ escreverCaminho(O, el.dataset.campo, String(el.value==null? "" : el.value).trim()); }
function lerForm(){
  document.querySelectorAll("[data-campo]").forEach(lerCampo);
  /* Única exceção: os setores em texto livre só valem com o modo livre ligado.
     De contrário a lista estruturada é a fonte, e este campo não conta. */
  if(estObj().livre) O.dados.setores=$("d-setores").value.trim();
}
/* O estado acompanha o formulário à medida que é preenchido, e não só ao gravar. */
["input","change"].forEach(ev=>document.addEventListener(ev, ev2=>{
  const el = ev2.target && ev2.target.closest ? ev2.target.closest("[data-campo]") : null;
  if(el) lerCampo(el);
}, true));
function escreverForm(){
  const m=O.meta; $("o-num").value=m.num; $("o-local").value=m.local; $("o-pco").value=m.pco; $("o-fase").value=m.fase; $("o-lat").value=m.lat; $("o-lon").value=m.lon; $("o-pasta").value=m.pasta||""; $("o-inicio").value=m.inicio||""; $("o-nivel").value=m.nivel||""; try{ renderFormats(); }catch(e){}
  const d=O.dados; $("d-area").value=d.area||""; $("d-sensiveis").value=d.sensiveis||"";
  const PTe=ptObj(); $("pt-des").value=PTe.des; $("pt-resp").value=PTe.resp;
  $("pt-ct").value=PTe.ct; $("pt-cd").value=PTe.cd; $("pt-obs").value=PTe.obs;
  d.topo = d.topo||{orient:"",declive:"",obs:"",eps:""}; $("t-orient").value=d.topo.orient||""; $("t-declive").value=d.topo.declive||""; $("t-obs").value=d.topo.obs||""; if($("t-eps")) $("t-eps").value=d.topo.eps||""; try{ pintarRelevo(); }catch(e){} if(d.est&&d.est.livre&&d.setores)$("d-setores").value=d.setores; try{ renderSetores(); }catch(e){}
  $("d-perim-info").textContent = d.perimNome? "Carregado: "+d.perimNome+(d.area? " · área estimada "+d.area+" ha":"") : "Nenhum perímetro carregado. Sem ficheiro, a área preenche-se à mão; com ficheiro, é calculada do polígono.";
  $("d-anexos-info").textContent = d.anexos.length? "Anexos: "+d.anexos.join(", ") : "Anexadas por nome ao PEA (leitura automática do relevo: Fase 3 — agente de topografia).";
}
function aviso(id,cls,txt){ const e=$(id); e.className="msg "+cls; e.textContent=txt; e.style.display="block"; setTimeout(()=>e.style.display="none", 5500); }
/* A fita vive dentro da ocorrência; o diário do posto vive fora dela e sobrevive-lhe.
   Um só sítio a escrever nos dois, para não haver eventos que só entrem num. */
function fita(evento){
  O.fita.push({g:gdhAgora(), e:evento});
  try{ diarioAcrescentar(evento); }catch(e){}
}

/* A proveniência de uma ocorrência que entrou por ficheiro. Fica à vista enquanto a
   ocorrência existir — ao contrário do aviso, que se apaga ao fim de cinco segundos. */
const PROV_ROT = {
  valida: p => "Importada de ficheiro a "+p.g+" — carimbo de integridade confere ("+resumoCurto(p.sha)+")"
    + (p.app? ", exportada pela "+p.app : "")+".",
  legado: p => "Importada de ficheiro a "+p.g+" — o ficheiro não trazia carimbo de integridade,"
    + " por ser de uma revisão anterior à que passou a carimbar.",
  falhou: p => "ATENÇÃO: conteúdo não verificado. Importada de ficheiro a "+p.g
    + " com o carimbo de integridade a não conferir ("+resumoCurto(p.sha)+"), por decisão de quem a importou."
    + " O conteúdo pode ter sido alterado depois de exportado.",
};
function pintarProveniencia(){
  const el = $("occ-proveniencia"); if(!el) return;
  const p = (O && O.integridade) || { estado:"", g:"", sha:"", app:"", ficheiro:"" };
  const f = PROV_ROT[p.estado];
  el.textContent = f? f(p) : "";
  el.style.color = p.estado === "falhou"? "var(--fogo)" : "";
  el.style.fontWeight = p.estado === "falhou"? "700" : "";
}

let INDEX = [];
async function carregarIndex(){ try{ const r=await ARMAZEM.get("peaapp:index"); INDEX=JSON.parse(r.value)||[]; }catch(e){ INDEX=[]; } }
function pintarArquivo(){
  const el=$("arq-list");
  if(!INDEX.length){ el.innerHTML='<p class="hint">Sem ocorrências guardadas neste dispositivo.</p>'; return; }
  const pastas={};
  INDEX.slice().sort((a,b)=>a.pasta.localeCompare(b.pasta)).forEach(x=>{ (pastas[x.pasta]=pastas[x.pasta]||[]).push(x); });
  el.innerHTML = Object.keys(pastas).map(p=>
    `<div class="arq-p">${esc(p)}</div>`+
    pastas[p].map(x=>`<div class="arq-i"><div><b>${esc(x.num)} — ${esc(x.local||"")}</b><p>PCO ${esc(x.pco||"—")} · ${x.peas} PEA · atualizada ${esc(x.g)}</p></div>
      <div class="acts"><button class="btn btn-b" data-enc-livre data-occ-abrir="${esc(x.num)}">Abrir</button>
      <button class="btn btn-r" data-enc-livre data-occ-apagar="${esc(x.num)}">Apagar</button></div></div>`).join("")
  ).join("");

  /* `data-enc-livre`: o arquivo lista **outras** ocorrências, e o fecho protege o registo
     desta. Com a ocorrência encerrada continuava a ver-se o arquivo e não se conseguia
     abrir nada dele — que é o contrário do que o fecho quer dizer.

     Ouvintes em vez de `onclick="abrirOcc('...')"`. O número da ocorrência é campo
     livre e caía dentro de uma string de JavaScript: uma plica bastava para executar o
     que se quisesse, e o escape de HTML não o impede — o navegador desfaz a entidade
     antes de o JavaScript ver o texto. Aqui o valor nunca é código: é o conteúdo de um
     atributo, lido com `getAttribute`. */
  el.querySelectorAll("[data-occ-abrir]").forEach(b=>
    b.addEventListener("click", ()=>carregar(b.getAttribute("data-occ-abrir"))));
  el.querySelectorAll("[data-occ-apagar]").forEach(b=>
    b.addEventListener("click", ()=>window.apagarOcc(b.getAttribute("data-occ-apagar"))));
}
window.abrirOcc = num => carregar(num);
window.apagarOcc = async num => {
  if(!window.confirm("Apagar a ocorrência "+num+" e todos os seus PEA deste dispositivo?")) return;
  try{ await ARMAZEM.del("peaapp:occ:"+num); }catch(e){}
  INDEX = INDEX.filter(x=>x.num!==num);
  try{ await ARMAZEM.set("peaapp:index", JSON.stringify(INDEX)); }catch(e){}
  if(O.meta.num===num){ O=novoEstado(); escreverForm(); }
  pintarTudo();
};

