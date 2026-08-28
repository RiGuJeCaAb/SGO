/* ================= evolução: contexto e inserção rápida ================= */
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
  if(e.res.m||e.res.o) chips.push(`<span class="tchip" style="cursor:pointer" data-ins="Reserva: "><b>Reserva</b> ${esc(e.res.m||"?")}m/${esc(e.res.o||"?")}op</span>`);
  el.innerHTML = chips.join("");
  el.querySelectorAll("[data-ins]").forEach(c=>c.addEventListener("click", ()=>inserirEvo(c.dataset.ins)));
}
document.querySelectorAll("#evo-frases [data-fr]").forEach(b=>b.addEventListener("click", ()=>{
  inserirEvo(b.dataset.fr+"; ");
  if(b.dataset.tp) $("e-tipo").value = b.dataset.tp;
}));



/* ================= estrutura do posto de comando — Despacho n.º 4067/2024 =================
   ob: função obrigatória a partir de determinada fase | cond: predicado sobre o dispositivo */
const FUNCOES_PCO = [
  {f:"Coordenador do PCO", r:"art. 14.º, n.º 1, al. a)", g:"Comando", fase:3},
  {f:"Oficial de Operações", r:"art. 14.º, n.º 1, al. b) e art. 17.º", g:"Comando", fase:2},
  {f:"Oficial de Planeamento", r:"art. 14.º, n.º 1, al. c) e art. 27.º", g:"Comando", fase:2},
  {f:"Oficial de Logística e Finanças", r:"art. 14.º, n.º 1, al. d) e art. 32.º", g:"Comando", fase:2},
  {f:"Adjunto de Segurança", r:"art. 14.º, n.º 1, al. e) e art. 36.º", g:"Comando", fase:3},
  {f:"Adjunto de Ligação", r:"art. 14.º, n.º 1, al. f) e art. 37.º", g:"Comando", fase:4},
  {f:"Adjunto de Relações Públicas", r:"art. 14.º, n.º 1, al. g) e art. 38.º", g:"Comando", fase:4},
  {f:"OPAR — Oficial de Operações Aéreas", r:"art. 19.º", g:"Meios aéreos", cond:"opar"},
  {f:"COPAR-T — Coordenador em terra", r:"art. 20.º, n.º 6 · DON 2, 7.d.(18)", g:"Meios aéreos", cond:"copart"},
  {f:"COPAR-A — Coordenador a bordo", r:"art. 20.º, n.º 7 · DON 2, 7.d.(20)", g:"Meios aéreos", cond:"copara"},
  {f:"OPESP — Oficial de Operações de Meios Especiais", r:"art. 21.º", g:"Meios especiais", cond:"opesp"},
  {f:"COPESP — Coordenador de Meios Especiais", r:"art. 22.º · DON 2, 7.d.(23)", g:"Meios especiais", cond:"copesp"},
  {f:"Núcleo de Comunicações e Sistemas de Informação", r:"art. 34.º", g:"Logística", fase:4},
  {f:"Núcleo de Meios e Recursos", r:"art. 33.º", g:"Logística", fase:4},
  {f:"Núcleo de Finanças", r:"art. 35.º", g:"Logística", fase:5},
  {f:"Núcleo de Monitorização e Controlo", r:"art. 18.º, n.º 1 — obrigatório na fase IV ou superior", g:"Operações", fase:4},
  {f:"Núcleo de Segurança", r:"art. 23.º", g:"Operações", fase:3, ext:"força de segurança territorialmente competente"},
  {f:"Núcleo de Emergência Médica", r:"art. 24.º", g:"Operações", fase:4, ext:"INEM, I.P."},
  {f:"Núcleo de Apoio Psicológico e Social de Emergência", r:"art. 25.º", g:"Operações", fase:5, ext:"Instituto da Segurança Social, I.P."},
  {f:"Núcleo de Antecipação", r:"art. 29.º", g:"Planeamento", fase:4},
  {f:"Núcleo de Informações", r:"art. 28.º", g:"Planeamento", fase:4},
  {f:"Núcleo de Especialistas", r:"art. 30.º · DON 2, ponto 7.e.(27)", g:"Planeamento", fase:4},
  {f:"Oficial de ligação de entidade", r:"art. 37.º, n.º 2", g:"Ligação"},
  {f:"Outra função", r:"—", g:"Ligação"}
];
const ORDEM_FASE = {"":0,"I":1,"II":2,"III":3,"IV":4,"V":5,"VI":6};
/** @returns {{funcoes:FuncaoPCO[], canais:Canais}} */
function pcoObj(){ if(!O.pco) O.pco = {funcoes:[], canais:{cmd:"",tat:"",ba:"",tatba:"",aero:"",opar:"",cmar:"",atrib:[],niveis:null}}; if(!Array.isArray(O.pco.funcoes)) O.pco.funcoes=[];
  O.pco.canais = Object.assign({cmd:"",tat:"",ba:"",tatba:"",aero:"",opar:"",cmar:"",atrib:[],niveis:null}, O.pco.canais||{});
  if(!Array.isArray(O.pco.canais.atrib)) O.pco.canais.atrib=[]; return O.pco; }
/* O recurso leva `f` vazio de propósito: quem chama distingue por ele a função
   conhecida da improvisada. */
function pcoDef(f){ return FUNCOES_PCO.find(x=>x.f===f) || {f:"", r:"—", g:"—"}; }
function nomeado(fPrefixo){
  return pcoObj().funcoes.find(x=>x.f.indexOf(fPrefixo)===0) || null;
}
/* funções exigíveis face à fase declarada e ao dispositivo registado */
function funcoesExigiveis(){
  const c = contarDispositivo(), fase = ORDEM_FASE[O.meta.fase]||0, out = [];
  FUNCOES_PCO.forEach(x=>{
    let devida = false, motivo = "";
    if(x.fase && fase >= x.fase){ devida = true; motivo = "fase "+O.meta.fase+" do SGO"; }
    if(x.cond==="copart" && c.arComb>2){ devida = true; motivo = c.arComb+" aeronaves de combate no TO"; }
    if(x.cond==="copara" && c.arComb>=4){ devida = true; motivo = c.arComb+" aeronaves de combate no TO"; }
    if(x.cond==="opar" && c.ar>=4){ devida = true; motivo = "atividade aérea continuada com "+c.ar+" aeronaves"; }
    if(x.cond==="copesp" && c.mr>2){ devida = true; motivo = c.mr+" máquinas de rasto no dispositivo"; }
    if(x.cond==="opesp" && c.mr>=4){ devida = true; motivo = c.mr+" máquinas de rasto no dispositivo"; }
    if(devida) out.push({...x, motivo, preenchida: !!pcoObj().funcoes.find(y=>y.f===x.f)});
  });
  return out;
}
/* funções que podem ser nomeadas mais do que uma vez */
const FUNCOES_REPETIVEIS = ["Oficial de ligação de entidade","Outra função"];
/* prioridade face à fase declarada e ao dispositivo: e = essencial, r = recomendada, m = menor */
const PRIO_ROT = {e:{t:"Essencial — exigível agora", c:"var(--fogo)"},
                  r:{t:"Recomendada — próxima fase ou limiar próximo", c:"var(--terra)"},
                  m:{t:"De menor importância neste momento", c:"var(--madeira)"}};
function prioridadeFuncao(x, exigiveis){
  const ex = exigiveis || funcoesExigiveis();
  if(ex.some(y=>y.f===x.f)) return "e";
  const c = contarDispositivo(), fase = ORDEM_FASE[O.meta.fase]||0;
  if(x.fase && fase+1 >= x.fase) return "r";
  if(x.cond==="copart" && c.arComb>0) return "r";
  if(x.cond==="copara" && c.arComb>2) return "r";
  if(x.cond==="opar"   && c.ar>0) return "r";
  if(x.cond==="copesp" && c.mr>0) return "r";
  if(x.cond==="opesp"  && c.mr>2) return "r";
  return "m";
}
function pcoOptions(){
  const ex = funcoesExigiveis();
  const ocupadas = pcoObj().funcoes.map(y=>y.f);
  const livres = FUNCOES_PCO.filter(x=>FUNCOES_REPETIVEIS.includes(x.f) || !ocupadas.includes(x.f));
  const ordem = {e:0,r:1,m:2};
  const marcadas = livres.map(x=>({...x, p:prioridadeFuncao(x, ex)}))
    .sort((a,b)=> ordem[a.p]-ordem[b.p] || FUNCOES_PCO.indexOf(FUNCOES_PCO.find(y=>y.f===a.f))-FUNCOES_PCO.indexOf(FUNCOES_PCO.find(y=>y.f===b.f)));
  return ["e","r","m"].map(p=>{
    const arr = marcadas.filter(x=>x.p===p);
    if(!arr.length) return "";
    return '<optgroup label="'+esc(PRIO_ROT[p].t)+'">'+arr.map(x=>
      '<option value="'+esc(x.f)+'" title="'+esc(x.r)+'" style="color:'+PRIO_ROT[p].c+'">'+esc(x.f)+'</option>').join("")+'</optgroup>';
  }).join("") || '<option value="">— todas as funções já nomeadas —</option>';
}
/* O campo da solicitação só faz sentido nos núcleos que uma entidade externa nomeia
   a pedido do COS — arts. 23.º, n.º 2, 24.º, n.º 2 e 25.º, n.º 2. */
function pintarCampoSolicitacao(){
  const sel = $("pc-f"), box = $("pc-sol-box"); if(!sel || !box) return;
  const d = pcoDef(sel.value);
  box.style.display = d.ext ? "" : "none";
  const lab = box.querySelector("label");
  if(lab && d.ext) lab.textContent = "GDH da solicitação a " + d.ext;
}
function renderPCO(){
  const sel = $("pc-f"); if(!sel) return;
  const escolhida = sel.value;
  sel.innerHTML = pcoOptions();
  if(escolhida && [...sel.options].some(o=>o.value===escolhida)) sel.value = escolhida;
  try{ pintarCampoSolicitacao(); }catch(e){}
  const P = pcoObj(), exig = funcoesExigiveis();
  const emFalta = exig.filter(x=>!x.preenchida);
  const tag = $("pco-tag");
  if(tag) tag.textContent = emFalta.length
    ? emFalta.length+(emFalta.length===1? " função exigível por nomear":" funções exigíveis por nomear")
    : (P.funcoes.length? P.funcoes.length+(P.funcoes.length===1? " função nomeada":" funções nomeadas") : "artigo 14.º do Despacho n.º 4067/2024");

  const listaFalta = emFalta.length? `<div class="pco-falta"><span class="k">Exigíveis por nomear</span>${
    emFalta.map(x=>`<div class="pf pf-e"><b>${esc(x.f)}</b><span class="m">${esc(x.motivo)}</span><span class="r">${esc(x.r)}</span></div>`).join("")}</div>` : "";
  const recom = FUNCOES_PCO.filter(x=>!P.funcoes.some(y=>y.f===x.f) && prioridadeFuncao(x, exig)==="r");
  const listaRec = recom.length? `<div class="pco-falta pco-rec"><span class="k">Recomendadas — próxima fase ou limiar próximo</span>${
    recom.map(x=>`<div class="pf pf-r"><b>${esc(x.f)}</b><span class="m">${esc(x.g)}</span><span class="r">${esc(x.r)}</span></div>`).join("")}</div>` : "";

  const linhas = P.funcoes.length? P.funcoes.map((x,i)=>`<div class="pco-r pri-${prioridadeFuncao(pcoDef(x.f).f? pcoDef(x.f) : {f:x.f, r:"—", g:"—"}, exig)}">
      <div class="pf-n"><b>${esc(x.f)}</b><small>${esc(pcoDef(x.f).r)}</small></div>
      <div class="pf-p">${esc(x.nome||"—")}${x.entidade? `<small>${esc(x.entidade)}</small>`:""}</div>
      <div class="pf-c">${esc(x.ct||"—")}</div>
      <div class="pf-k">${x.siresp? "SIRESP "+esc(x.siresp):"—"}${x.ba? "<small>BA "+esc(x.ba)+"</small>":""}</div>
      <div class="pf-g">${esc(x.g||"—")}</div>
      <button type="button" class="pf-x" data-pcodel="${i}" aria-label="remover">×</button>
    </div>`).join("") : '<div class="avd-vazio">Nenhuma função registada. A estrutura do PCO é a base do plano de comunicações e do briefing de passagem de comando.</div>';

  $("pco-lista").innerHTML = listaFalta + listaRec + (P.funcoes.length? `<div class="pco-h"><span>Função</span><span>Quem ocupa</span><span>Contacto</span><span>Canais</span><span>Nomeado (GDH)</span><span></span></div>`:"") + linhas;
  $("pco-lista").querySelectorAll("[data-pcodel]").forEach(b=>b.addEventListener("click", ()=>{
    const x = P.funcoes[+b.dataset.pcodel];
    fita("Nomeação removida: "+x.f+(x.nome? " ("+x.nome+")":""));
    P.funcoes.splice(+b.dataset.pcodel,1); renderPCO(); renderComs(); pintarDON(); persistir(false);
  }));
}
/* ================= catálogo de canais =================
   A atribuição dos canais rádio de cada TO compete aos CSREPC e ao CNEPC
   (DON n.º 2 / DECIR 2026, ponto 10(1)). O catálogo é local ao dispositivo,
   partilhado por todas as ocorrências e exportável para difusão. */
const REDES  = {siresp:"SIRESP", ba:"Banda alta (ROB)", aero:"Banda aeronáutica"};
/* pastas à imagem da organização dos terminais; o âmbito de cada pasta determina
   onde o canal existe. Um grupo de âmbito sub-regional ou municipal não existe fora
   da sua área e não pode ser proposto num TO de outra região. */
const PASTAS = {
  nacional:{t:"NACIONAL", d:"âmbito nacional — existe em qualquer teatro de operações"},
  distrito:{t:"DISTRITO OP", d:"âmbito distrital — a pasta do distrito onde decorre a ocorrência"},
  subregiao:{t:"SUB-REGIÃO", d:"âmbito sub-regional — só existe na sub-região indicada"},
  municipio:{t:"MUNICÍPIO", d:"âmbito municipal — só existe no concelho indicado"},
  local:{t:"LOCAL", d:"canal próprio de entidade ou de ocorrência"}
};
const SUBREGIAO_ESTACAO = "Douro";
function semAcento(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }
/* um canal é aplicável se não tiver área própria ou se a área bater com o TO */
function canalAplicavel(x){
  if(!x || !x.area) return true;
  const a = semAcento(x.area);
  return [O.meta.distrito, O.meta.concelho, SUBREGIAO_ESTACAO].some(v=>v && semAcento(v)===a);
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
  e.push({rede:"siresp", des:"OPAR 01", niv:"aereo", nota:"grupo da sub-região; alternativa e emergência terra/ar/terra", pasta:"subregiao", area:SUBREGIAO_ESTACAO, pk:true});
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
function atribSet(){ try{ return new Set((pcoObj().canais.atrib||[]).map(x=>String(x).toUpperCase())); }catch(e){ return new Set(); } }
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
      : '<span class="pend">por determinar — depende das coordenadas do TO, na secção 1</span>')+'</span></div>';
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
function descarregar(nome, texto, tipo){
  try{
    const b = new Blob([texto], {type:tipo||"application/json;charset=utf-8"});
    const u = URL.createObjectURL(b), a = document.createElement("a");
    a.href = u; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(u); a.remove(); }, 500);
  }catch(e){ aviso("msg-occ","err","Não foi possível exportar ("+e+")."); }
}
function carimboFich(){ const d=new Date(agora()), p=n=>String(n).padStart(2,"0");
  return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes()); }

