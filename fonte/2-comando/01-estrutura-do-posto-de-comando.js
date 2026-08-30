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
  {f:"Núcleo de Segurança", r:"art. 23.º", g:"Operações", fase:3, ext:"força de segurança territorialmente competente", extC:"força de segurança"},
  {f:"Núcleo de Emergência Médica", r:"art. 24.º", g:"Operações", fase:4, ext:"INEM, I.P.", extC:"INEM"},
  {f:"Núcleo de Apoio Psicológico e Social de Emergência", r:"art. 25.º", g:"Operações", fase:5, ext:"Instituto da Segurança Social, I.P.", extC:"Segurança Social"},
  {f:"Núcleo de Antecipação", r:"art. 29.º", g:"Planeamento", fase:4},
  {f:"Núcleo de Informações", r:"art. 28.º", g:"Planeamento", fase:4},
  {f:"Núcleo de Especialistas", r:"art. 30.º · DON 2, ponto 7.e.(27)", g:"Planeamento", fase:4},
  {f:"Oficial de ligação de entidade", r:"art. 37.º, n.º 2", g:"Ligação"},
  {f:"Outra função", r:"—", g:"Ligação"}
];
const ORDEM_FASE = {"":0,"I":1,"II":2,"III":3,"IV":4,"V":5,"VI":6};
/** @returns {{funcoes:FuncaoPCO[]}} */
/* Comando: as nomeações do art. 14.º. O plano de comunicações saiu daqui na versão 6
   do estado — é do art. 32.º, n.º 1, al. d) — e lê-se por `canaisObj()`. */
function pcoObj(){
  if(!O.pco) O.pco = {funcoes:[]};
  if(!Array.isArray(O.pco.funcoes)) O.pco.funcoes = [];
  return O.pco;
}
/* O recurso leva `f` vazio de propósito: quem chama distingue por ele a função
   conhecida da improvisada. */
function pcoDef(f){ return FUNCOES_PCO.find(x=>x.f===f) || {f:"", r:"—", g:"—"}; }
/** A nomeação cujo cargo começa por este prefixo, ou nada. */
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
/**
 * Que peso tem esta função no dispositivo que está no terreno.
 *
 * `e` exigível pela fase declarada, `r` recomendada pelo que já lá está — meios aéreos a
 * pedir COPAR, um efetivo a caminho da fase seguinte —, `m` matéria de escolha. Decide a
 * ordem por que as funções aparecem e a cor da barra: quem nomeia vê primeiro o que a lei
 * exige, e não a lista por ordem alfabética.
 */
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
/**
 * As funções por nomear, as exigíveis à frente.
 *
 * Deixa de fora as que já estão ocupadas, salvo as que a lei admite repetir — há mais do
 * que um comandante de setor.
 */
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
  /* O rótulo leva a forma curta e o título a designação da lei por inteiro. A longa
     — «força de segurança territorialmente competente» — quebrava em duas linhas e
     desalinhava o campo dos vizinhos na grelha. A designação não se abrevia no que
     conta: fica no `title`, no aviso e no PEA. */
  if(lab && d.ext){
    lab.textContent = "GDH da solicitação a " + (d.extC || d.ext);
    lab.title = "Solicitação do COS a " + d.ext + " — " + d.r;
  }
}
/**
 * Desenha a estrutura do posto de comando: quem está nomeado e o que falta nomear.
 *
 * Preserva a função escolhida na caixa antes de a reconstruir. Repintar debaixo da mão de
 * quem estava a preencher perde o que ele já tinha escolhido.
 */
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

/* ================= COMANDO · declaração da fase do SGO (art. 39.º) =================
   A fase enquadra a capacidade de comando e controlo exigida e a estrutura do posto de
   comando a implementar. Estava num campo do formulário que mudava em silêncio: ninguém
   sabia quem a tinha declarado, nem quando, nem se acompanhava o dispositivo.

   Passa a ser ato: a aplicação **sugere** a partir do efetivo registado, quem comanda
   **declara**, e a declaração fica com autor e GDH. A sugestão nunca se aplica sozinha —
   o efetivo é o que está registado na aplicação, e o que manda é o que está no terreno. */

/** Declara a fase do SGO, com autor e hora. */
function declararFase(f, quem){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de declarar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  if(ordemFase(f) < 0) return { ok:false, motivo:"Fase desconhecida." };
  const g = String((quem&&quem.g)||"").trim() || gdhAgora();
  if(!parseGDH(g)) return { ok:false, motivo:motivoGDH(g) };
  const antes = O.meta.fase || "";
  if(antes === f) return { ok:false, motivo:"A fase "+f+" já está declarada." };

  O.meta.fase = f;
  O.meta.faseG = g;
  O.meta.fasePor = String((quem&&quem.por)||"").trim() || quemRegista();
  const el = $("o-fase"); if(el) el.value = f;
  O.evolucao.push({ g, tipo:"decisao",
    txt:"Fase do SGO declarada: "+f+(antes? " (era "+antes+")" : "")
      +(O.meta.fasePor? ", por "+O.meta.fasePor : "")+"." });
  fita("Fase do SGO declarada: "+f+(antes? " (era "+antes+")":""));
  return { ok:true };
}

/**
 * A linha da fase: o que o dispositivo pede, o que está declarado, e o que falta.
 *
 * A comparação é com o efetivo **registado na aplicação** — se o dispositivo não estiver
 * todo lançado, a sugestão fica curta, e isso diz-se em vez de se esconder.
 */
function pintarFase(){
  const el = $("fase-info"); if(!el) return;
  const c = (()=>{ try{ return contarDispositivo(); }catch(e){ return {op:0}; } })();
  const decl = O.meta.fase || "";
  const sug = faseParaEfetivo(c.op);
  const b = $("fase-declarar");

  if(!c.op && !decl){
    el.textContent = "Sem efetivo registado: a fase declara-se à mão, e a sugestão aparece assim que houver meios atribuídos aos setores.";
    el.style.color = ""; if(b) b.style.display = "none";
    return;
  }
  /* Só há fase ultrapassada onde há fase declarada: sem ela, o que falta é declará-la,
     e dizer que «o dispositivo ultrapassou a fase declarada» seria falar de uma coisa
     que não existe. */
  const atrasada = !!decl && ordemFase(sug) > ordemFase(decl);
  el.innerHTML = (decl
      ? "Declarada: <b>fase "+esc(decl)+"</b>"
        + (O.meta.faseG? " a "+esc(O.meta.faseG)+(O.meta.fasePor? " por "+esc(O.meta.fasePor):"") : " (escolhida sem registo de quem a declarou)")
      : "<b>Fase por declarar.</b>")
    + " · Pelo efetivo registado — "+c.op+" operacionais — corresponde a <b>fase "+esc(sug)+"</b>."
    + (atrasada? " O dispositivo já ultrapassou a fase declarada." : "");
  el.style.color = atrasada || !decl? "var(--terra)" : "";
  el.style.fontWeight = atrasada || !decl? "700" : "";
  if(b){
    b.style.display = (sug !== decl)? "" : "none";
    b.textContent = "Declarar fase "+sug;
    b.setAttribute("data-fase", sug);
  }
}
