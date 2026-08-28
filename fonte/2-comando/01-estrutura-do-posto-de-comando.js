/* ================= COMANDO · estrutura do posto de comando (art. 14.º) ================= */
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
