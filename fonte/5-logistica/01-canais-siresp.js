/* ================= LOGÍSTICA · canais SIRESP (art. 34.º) ================= */
const PASTAS = {
  nacional:{t:"NACIONAL", d:"âmbito nacional — existe em qualquer teatro de operações"},
  distrito:{t:"DISTRITO OP", d:"âmbito distrital — a pasta do distrito onde decorre a ocorrência"},
  subregiao:{t:"SUB-REGIÃO", d:"âmbito sub-regional — só existe na sub-região indicada"},
  municipio:{t:"MUNICÍPIO", d:"âmbito municipal — só existe no concelho indicado"},
  local:{t:"LOCAL", d:"canal próprio de entidade ou de ocorrência"}
};
/* A pasta sub-regional do pacote que esta Estação traz carregado. É a do CSREPC Douro,
   e chama-se «Douro Op» — que é como está programada nos terminais, e não «Douro».

   **O pacote é do posto, não da ocorrência.** Um teatro de operações pode ser em
   qualquer ponto do país, e a pasta sub-regional de outra sub-região tem outros grupos,
   que esta Estação não conhece. Quando o TO fica fora desta sub-região, os canais
   sub-regionais deixam de ser aplicáveis e a aplicação di-lo, em vez de os oferecer como
   se servissem. Ver `docs/ESTADO.md`, pontos por confirmar em fonte. */
const SUBREGIAO_PACOTE = "Douro Op";
function semAcento(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }
/* um canal é aplicável se não tiver área própria ou se a área bater com o TO */
/** Sub-região declarada para o teatro de operações. Vazia enquanto não for indicada. */
function subregiaoTO(){ return String(O.meta.subregiao||"").trim(); }

/**
 * Um canal é aplicável se não tiver área própria, ou se a área bater com o TO.
 *
 * Para a pasta sub-regional o termo de comparação é a sub-região **do teatro de
 * operações**, e não a do posto: é lá que se vai operar. Enquanto ela não for indicada,
 * o canal sub-regional fica por confirmar em vez de se dar por bom.
 */
function canalAplicavel(x){
  if(!x || !x.area) return true;
  const a = semAcento(x.area);
  if((x.pasta||"") === "subregiao") return semAcento(subregiaoTO()) === a;
  return [O.meta.distrito, O.meta.concelho].some(v=>v && semAcento(v)===a);
}
const NIVEIS = {comando:"Comando", tatico:"Tático", manobra:"Manobra", aereo:"Aéreo"};
/* Pacote distrital: 50 grupos de conversação SIRESP de âmbito distrital — 5 de comando,
   15 táticos e 30 de manobra (pasta DISTRITO OP), com equivalência aos canais táticos e de
   manobra da ROB em simplex. Os canais de banda alta acompanham a mesma numeração. */
function pacoteBase(){
  const e = [];
  for(let i=1;i<=5;i++)  e.push({rede:"siresp", des:"PC COM "+i, niv:"comando", nota:"grupo distrital de comando", pasta:"distrito", area:"", pk:true});
  for(let i=1;i<=15;i++) e.push({rede:"siresp", des:"PC TAT "+i, niv:"tatico",  nota:"equivalente ao tático "+i+" da ROB em simplex", pasta:"distrito", area:"", pk:true});
  for(let i=1;i<=30;i++) e.push({rede:"siresp", des:"PC MAN "+i, niv:"manobra", nota:"equivalente ao manobra "+i+" da ROB em simplex", pasta:"distrito", area:"", pk:true});
  e.push({rede:"siresp", des:"OPAR 01", niv:"aereo", nota:"grupo da sub-região; alternativa e emergência terra/ar/terra", pasta:"subregiao", area:SUBREGIAO_PACOTE, pk:true});
  for(let i=1;i<=5;i++)  e.push({rede:"ba", des:"CC"+i, niv:"comando", nota:"canal de comando da ROB, banda alta de VHF", pasta:"nacional", area:"", pk:true});
  for(let i=1;i<=15;i++) e.push({rede:"ba", des:"CT"+i, niv:"tatico",  nota:"canal tático da ROB, banda alta de VHF", pasta:"nacional", area:"", pk:true});
  for(let i=1;i<=30;i++) e.push({rede:"ba", des:"CM"+i, niv:"manobra", nota:(i===4? "manobra 4 da ROB; alternativa terra/ar/terra":"canal de manobra da ROB, banda alta de VHF"), pasta:"nacional", area:"", pk:true});
  return e;
}
const PACOTE_V = 2;
let CANAIS = {v:2, pv:PACOTE_V, ent:pacoteBase()};
/* acrescenta ao pacote gravado as séries que a revisão trouxe, sem tocar no resto */
function fundirPacote(){
  const base = pacoteBase(); let n = 0;
  base.forEach(b=>{ if(!canalExiste(b.rede,b.des)){ CANAIS.ent.push(b); n++; } });
  if(n) ordenarCanais();
  CANAIS.pv = PACOTE_V; guardarCanais();
  return n;
}
async function carregarCanais(){
  try{ const r = await ARMAZEM.get("peaapp:canais"); const c = JSON.parse(r.value);
    if(c && Array.isArray(c.ent)){
      CANAIS = {v:2, pv:c.pv||0, ent:c.ent.filter(x=>x&&x.des&&REDES[x.rede])};
      /* migração de versões anteriores: repõe o pacote distrital se não existir */
      if(!CANAIS.ent.some(x=>x.pk)){
        const ex = CANAIS.ent.slice(), base = pacoteBase();
        CANAIS.ent = base.concat(ex.filter(x=>!base.some(p=>p.rede===x.rede && p.des.toUpperCase()===String(x.des).toUpperCase())));
        ordenarCanais(); CANAIS.pv = PACOTE_V; guardarCanais();
      } else if(CANAIS.pv < PACOTE_V){
        const n = fundirPacote();
        if(n) fita("Pacote de canais atualizado: "+n+" canais acrescentados pela revisão");
      }
    }
  }catch(e){}
}
async function guardarCanais(){ try{ await ARMAZEM.set("peaapp:canais", JSON.stringify(CANAIS)); }catch(e){} }
function ordenarCanais(){
  const r = Object.keys(REDES);
  CANAIS.ent.sort((a,b)=> a.rede===b.rede
    ? String(a.des).localeCompare(String(b.des),"pt",{numeric:true,sensitivity:"base"})
    : r.indexOf(a.rede)-r.indexOf(b.rede));
}
function canalExiste(rede,des){ return CANAIS.ent.some(x=>x.rede===rede && String(x.des).toUpperCase()===String(des).toUpperCase()); }
function canalAdd(rede,des,niv,nota,pasta,area){
  des = String(des||"").trim().replace(/\s+/g," ");
  if(!des || !REDES[rede] || canalExiste(rede,des)) return false;
  CANAIS.ent.push({rede, des, niv:niv||"", nota:String(nota||"").trim(),
    pasta:pasta||"local", area:String(area||"").trim()});
  ordenarCanais(); guardarCanais(); return true;
}
function atribSet(){ try{ return new Set((canaisObj().atrib||[]).map(x=>String(x).toUpperCase())); }catch(e){ return new Set(); } }
function optsCanal(rede, niv, val){
  const lista = CANAIS.ent.filter(x=>x.rede===rede && canalAplicavel(x)), V = String(val||"").toUpperCase(), A = atribSet();
  const op = x => '<option value="'+esc(x.des)+'" title="'+esc(x.nota||"")+'"'+(V===String(x.des).toUpperCase()? " selected":"")+'>'+esc(x.des)+'</option>';
  const grupo = (rot, arr) => arr.length? '<optgroup label="'+esc(rot)+'">'+arr.map(op).join("")+'</optgroup>' : "";
  const noNivel = x => !niv || x.niv===niv;
  const atr = lista.filter(x=>A.has(String(x.des).toUpperCase()));
  const res = lista.filter(x=>!A.has(String(x.des).toUpperCase()));
  let h = '<option value="">— não atribuído —</option>';
  if(atr.length){
    h += grupo("atribuídos ao TO"+(niv? " · "+(NIVEIS[niv]||niv):""), atr.filter(noNivel));
    h += grupo("atribuídos ao TO · outros níveis", atr.filter(x=>!noNivel(x)));
  } else {
    h += grupo("pacote"+(niv? " · "+(NIVEIS[niv]||niv):""), res.filter(noNivel));
    if(niv) h += grupo("pacote · outros níveis", res.filter(x=>!noNivel(x)));
  }
  if(val && !canalExiste(rede,val)) h += '<optgroup label="fora do pacote"><option value="'+esc(val)+'" selected>'+esc(val)+'</option></optgroup>';
  h += '<option value="__novo__">outro — acrescentar ao pacote…</option>';
  return h;
}
function pintarSel(el, val){
  if(!el) return;
  const v = (val!==undefined? val : el.value) || "";
  el.innerHTML = optsCanal(el.dataset.rede||"siresp", el.dataset.niv||"", v);
  el.value = v;
}
function pintarSelTodos(){ document.querySelectorAll("select.cs").forEach(el=>pintarSel(el)); }
/* escolher "outro" abre o campo de texto; o valor escrito entra no catálogo */
document.addEventListener("change", ev=>{
  const el = ev.target;
  if(el && el.classList && el.classList.contains("cs") && el.value==="__novo__"){
    ev.stopPropagation();
    const inp = el.parentElement? el.parentElement.querySelector("input.cwo") : null;
    if(!inp){ pintarSel(el,""); return; }
    el.hidden = true; inp.hidden = false; inp.value = ""; inp.focus();
  }
}, true);
function fecharNovoCanal(inp){
  const w = inp.parentElement, sel = w? w.querySelector("select.cs") : null;
  if(!sel) return;
  const des = inp.value.trim();
  inp.hidden = true; inp.value = ""; sel.hidden = false;
  if(des){
    if(canalAdd(sel.dataset.rede||"siresp", des, sel.dataset.niv||"", "", "local", O.meta.distrito||""))
      fita("Canal acrescentado ao pacote: "+des+(O.meta.distrito? " (âmbito local, "+O.meta.distrito+")":""));
    pintarSelTodos(); renderCatalogo(); pintarSel(sel, des);
    sel.dispatchEvent(new Event("change",{bubbles:true}));
  } else pintarSel(sel, "");
}
document.addEventListener("change", ev=>{ const t=ev.target;
  if(t && t.classList && t.classList.contains("cwo") && !t.hidden) fecharNovoCanal(t); });
document.addEventListener("blur", ev=>{ const t=ev.target;
  if(t && t.classList && t.classList.contains("cwo") && !t.hidden) fecharNovoCanal(t); }, true);

/* percorre o pacote por rede e nível, na ordem doutrinária */
function porGrupos(lista, fn){
  Object.keys(REDES).forEach(r=>{
    Object.keys(NIVEIS).concat([""]).forEach(n=>{
      const arr = lista.filter(x=>x.rede===r && (x.niv||"")===n);
      if(arr.length) fn(REDES[r]+" · "+(NIVEIS[n]||"sem nível"), arr, r, n);
    });
  });
}
/* resumo por rede e nível, com o intervalo de designações de cada série */
function resumoPacote(){
  const pk = CANAIS.ent.filter(x=>x.pk), out = [];
  Object.keys(REDES).forEach(r=>{
    const partes = [];
    Object.keys(NIVEIS).forEach(n=>{
      const arr = pk.filter(x=>x.rede===r && x.niv===n);
      if(!arr.length) return;
      partes.push(arr.length===1
        ? "<em>"+esc(arr[0].des)+"</em>"
        : arr.length+" de "+NIVEIS[n].toLowerCase()+" (<em>"+esc(arr[0].des)+"</em> a <em>"+esc(arr[arr.length-1].des)+"</em>)");
    });
    if(partes.length) out.push({r:REDES[r], t:partes.join(" · ")});
  });
  return out;
}
function renderCatalogo(){
  const L = $("cat-lista"); if(!L) return;
  const pk = CANAIS.ent.filter(x=>x.pk), ex = CANAIS.ent.filter(x=>!x.pk);
  const t = $("cat-tag");
  if(t) t.textContent = CANAIS.ent.length
    ? CANAIS.ent.length+" canais"+(ex.length? " · "+ex.length+" fora do pacote":"")+(O.meta.distrito? " · "+O.meta.distrito:"")
    : "pacote vazio";
  let h = '<div class="pk-r"><span class="k">Distrito</span><span class="v">'+(O.meta.distrito
      ? esc(O.meta.distrito)+(O.meta.concelho? ", concelho de "+esc(O.meta.concelho):"")+' <span class="pend">— determinado pelas coordenadas do teatro de operações</span>'
      : '<span class="pend">por determinar — depende das coordenadas do TO, em Comando</span>')+'</span></div>';
  h += '<div class="pk-r"><span class="k">Sub-região do TO</span><span class="v">'+(subregiaoTO()
      ? esc(subregiaoTO())+(semAcento(subregiaoTO())===semAcento(SUBREGIAO_PACOTE)
          ? ' <span class="pend">— a do pacote carregado neste posto</span>'
          : ' <span class="fora">— o pacote carregado é o de '+esc(SUBREGIAO_PACOTE)+'; os canais sub-regionais desta pasta não servem este TO</span>')
      : '<span class="pend">por indicar, em Comando — a pasta sub-regional depende dela</span>')+'</span></div>';
  Object.keys(PASTAS).forEach(k=>{
    const arr = CANAIS.ent.filter(x=>(x.pasta||"local")===k);
    if(!arr.length) return;
    const fora = arr.filter(x=>!canalAplicavel(x));
    const areas = [...new Set(arr.map(x=>x.area).filter(Boolean))];
    h += '<div class="pk-r"><span class="k">'+esc(PASTAS[k].t)+'</span><span class="v">'+arr.length+
      (arr.length===1? " canal":" canais")+(areas.length? " · "+esc(areas.join(", ")):"")+
      (fora.length? ' <span class="fora">'+fora.length+" fora do âmbito deste TO"+(fora.length<=3? ": "+esc(fora.map(x=>x.des).join(", ")):"")+"</span>":"")+
      '</span></div>';
  });
  resumoPacote().forEach(x=>{ h += '<div class="pk-r"><span class="k">'+esc(x.r)+'</span><span class="v">'+x.t+'</span></div>'; });
  if(!pk.length) h += '<p class="cat-vaz">Pacote do distrito por repor.</p>';
  if(ex.length) h += '<div class="atr-g" style="margin-top:14px"><span class="atr-t">fora do pacote · '+ex.length+'</span></div>'+
    '<div class="cat-h"><span>Rede</span><span>Designação</span><span>Nível</span><span>Nota</span><span></span></div>'+
    ex.map(x=>{ const i = CANAIS.ent.indexOf(x);
      return `<div class="cat-r${canalAplicavel(x)? "":" fora"}"><span class="rd">${esc(PASTAS[x.pasta||"local"].t)}</span><span class="des">${esc(x.des)}</span><span class="nv">${esc(NIVEIS[x.niv]||"—")}</span><span class="nt">${esc(x.area? "âmbito: "+x.area+(canalAplicavel(x)? "":" — não existe neste TO"):(x.nota||""))}</span><button type="button" class="x" data-catdel="${i}" aria-label="remover">×</button></div>`;
    }).join("");
  L.innerHTML = h;
  L.querySelectorAll("[data-catdel]").forEach(b=>b.addEventListener("click", ()=>{
    const x = CANAIS.ent[+b.dataset.catdel]; if(!x) return;
    CANAIS.ent.splice(+b.dataset.catdel,1); guardarCanais();
    fita("Canal removido do pacote: "+x.des);
    renderCatalogo(); pintarSelTodos();
  }));
}
