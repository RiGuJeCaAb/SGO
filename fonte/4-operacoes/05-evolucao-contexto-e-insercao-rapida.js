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
    return `<span class="tchip" style="cursor:pointer" data-set="${i}" data-ins="Setor ${NOMES_SETOR[i]}: "><b>${NOMES_SETOR[i]}</b> ${esc(x.estado||"")}${mo? " · "+mo:""}</span>`;
  });
  const AL = (()=>{ try{ return aerLista(); }catch(err){ return []; } })();
  if(AL.length) chips.push(`<span class="tchip" style="cursor:pointer" data-ins="Meios aéreos: "><b>Aéreos</b> ${AL.length} · ${esc(AL.map(a=>a.ind||a.t).join(", "))}</span>`);
  const RSc = reservaObj();
  if(RSc.m||RSc.o) chips.push(`<span class="tchip" style="cursor:pointer" data-ins="Reserva: "><b>Reserva</b> ${esc(RSc.m||"?")}m/${esc(RSc.o||"?")}op</span>`);
  el.innerHTML = chips.join("");
  el.querySelectorAll("[data-ins]").forEach(c=>c.addEventListener("click", ()=>{
    inserirEvo(c.dataset.ins);
    const iSet = c.getAttribute("data-set");
    EVO_SETOR = (iSet != null)? +iSet : null;
    el.querySelectorAll("[data-set]").forEach(o=>o.classList.toggle("on", o === c));
    const ef = $("evo-efeito"); if(ef) ef.style.display = "none";
  }));
}
/* Setor a que o registo em composição se refere. Fica marcado quando o oficial clica
   no atalho do setor, que é a ordem natural: escolhe-se o setor e depois diz-se o que
   lá aconteceu. Sem setor escolhido, uma frase-tipo é só texto. */
let EVO_SETOR = null;

/**
 * Algumas das frases-tipo nomeiam, no seu próprio texto, um dos cinco estados de setor do
 * ponto 7.f da DON n.º 2. Dizer «frente dominada» na evolução e deixar o setor «em
 * curso» no dispositivo é ter duas verdades — e a análise da repartição lê o dispositivo,
 * não a prosa. A frase passa por isso a propor a mudança.
 *
 * **Propõe, não aplica.** O registo da evolução é narrativa do oficial; o estado do setor
 * é facto que entra no PEA e dispara regras de conformidade. Uma coisa não muda a outra
 * sem alguém dizer que sim.
 */
function proporEstadoDaFrase(estado){
  const el = $("evo-efeito"); if(!el) return;
  const e = estObj();
  if(!estado || EVO_SETOR === null || !e.setores[EVO_SETOR]){ el.style.display = "none"; return; }
  const s = e.setores[EVO_SETOR], nome = NOMES_SETOR[EVO_SETOR];
  if(s.estado === estado){
    el.className = "msg ok"; el.style.display = "block";
    el.textContent = "O setor "+nome+" já está em \u00ab"+estado+"\u00bb.";
    return;
  }
  el.className = "msg av"; el.style.display = "block";
  el.innerHTML = "O setor "+esc(nome)+" está em \u00ab"+esc(s.estado||"sem estado")+"\u00bb. "
    + "A frase diz outra coisa \u2014 passar a \u00ab"+esc(estado)+"\u00bb? "
    + '<button class="btn btn-o" type="button" id="evo-aplicar" style="margin-left:10px">Alterar o estado do setor</button>';
  const b = $("evo-aplicar");
  if(b) b.addEventListener("click", ()=>{
    if(mudarEstadoSetor(EVO_SETOR, estado)){
      el.className = "msg ok";
      el.textContent = "Setor "+nome+" passou a \u00ab"+estado+"\u00bb, com registo automático na evolução e na fita.";
      pintarTudo();
    }
  });
}

/**
 * Arruma o léxico: uma barra de grupos por cima, um grupo de cada vez por baixo, e uma
 * caixa de procura que corta transversalmente.
 *
 * Oitenta frases todas à vista são um muro — o oficial procura com os olhos aquilo que
 * a barra lhe dá num clique. A barra é composta a partir dos próprios grupos do HTML,
 * e não de uma lista à parte: grupo novo aparece sozinho, sem nada mais a alterar.
 */
function montarFrases(){
  const cx = $("evo-frases"), barra = $("fr-grupos"), procura = $("fr-q");
  if(!cx || !barra || !procura) return;
  const grupos = [...cx.querySelectorAll(".fr-g")].map(g=>({
    el: g,
    nome: (g.querySelector(".fr-l")||{textContent:""}).textContent.trim(),
    frases: [...g.querySelectorAll("[data-fr]")]
  }));
  if(!grupos.length) return;

  /* Mostra um grupo, ou o resultado da procura quando há termo. Sem correspondência,
     diz-se; um ecrã vazio sem explicação é defeito. */
  function mostrar(){
    const q = procura.value.trim().toLowerCase();
    cx.classList.toggle("q", !!q);
    let achados = 0;
    grupos.forEach((g,i)=>{
      if(!q){
        g.el.hidden = i !== FR_GRUPO;
        g.frases.forEach(b=>{ b.hidden = false; });
        return;
      }
      let visiveis = 0;
      g.frases.forEach(b=>{
        const alvo = (b.textContent + " " + (b.getAttribute("data-fr")||"")).toLowerCase();
        const bate = alvo.indexOf(q) >= 0;
        b.hidden = !bate;
        if(bate) visiveis++;
      });
      g.el.hidden = visiveis === 0;
      achados += visiveis;
    });
    const vazio = $("fr-vazio"); if(vazio) vazio.style.display = (q && !achados)? "block" : "none";
    barra.querySelectorAll("[data-g]").forEach(b=>
      b.classList.toggle("on", !q && +b.getAttribute("data-g") === FR_GRUPO));
  }

  barra.innerHTML = grupos.map((g,i)=>
    '<button type="button" class="fr-t" data-g="'+i+'">'+esc(g.nome)+'<span class="n">'+g.frases.length+'</span></button>').join("");
  barra.querySelectorAll("[data-g]").forEach(b=>b.addEventListener("click", ()=>{
    FR_GRUPO = +b.getAttribute("data-g"); procura.value = ""; mostrar();
  }));
  procura.addEventListener("input", mostrar);
  mostrar();
}
/* Grupo do léxico à vista. Combate é o primeiro porque é o que se regista mais vezes. */
let FR_GRUPO = 0;

document.querySelectorAll("#evo-frases [data-fr]").forEach(b=>b.addEventListener("click", ()=>{
  inserirEvo(b.dataset.fr+"; ");
  if(b.dataset.tp) $("e-tipo").value = b.dataset.tp;
  proporEstadoDaFrase(b.getAttribute("data-est") || "");
}));



/* ================= estrutura do posto de comando — Despacho n.º 4067/2024 =================
   ob: função obrigatória a partir de determinada fase | cond: predicado sobre o dispositivo */
