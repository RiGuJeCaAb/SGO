/* ================= arrumação da casa por célula =================
   Cada cartão pertence à célula a quem a lei atribui a matéria, e é aí que aparece.
   O registo é declarativo e auditado: um cartão sem célula, ou uma célula declarada
   para um cartão que não existe, parte `auditarArrumacao()`. A chave é o texto do
   cabeçalho — e é por isso que a auditoria existe, porque um título que mude sem o
   registo acompanhar deixaria o cartão para trás em silêncio. */
const ARRUMACAO = [
  /* --- Comando: arts. 14.º e 15.º; aprovação do PEA, art. 8.º, n.º 2, al. e) --- */
  { h:"Identificação da ocorrência",              cel:"comando",     r:"art. 14.º" },
  { h:"Estrutura do posto de comando",            cel:"comando",     r:"art. 14.º, n.os 1 a 5" },
  { h:"Avisos ativos",                            cel:"comando",     r:"art. 8.º, n.º 2 — determinações do COS" },
  { h:"Conformidade verificada",                  cel:"comando",     r:"prova documental da ocorrência" },
  { h:"Arquivo de ocorrências",                   cel:"comando",     r:"—" },
  { h:"Estado das integrações",                   cel:"comando",     r:"—" },
  { h:"Encerramento da ocorrência",               cel:"comando",     r:"art. 8.º, n.º 2; art. 2.º, al. c)" },
  { h:"Catálogo de elementos",                    cel:"comando",     r:"art. 14.º — quem ocupa as funções do PCO" },
  /* --- Planeamento: arts. 26.º a 30.º --- */
  { h:"Dados operacionais da ocorrência",         cel:"planeamento", r:"art. 28.º — análise da zona de intervenção" },
  { h:"Leitura do terreno",                       cel:"planeamento", r:"art. 28.º" },
  { h:"Perfil de elevação",                       cel:"planeamento", r:"art. 28.º" },
  { h:"Previsão meteorológica",                   cel:"planeamento", r:"art. 29.º — núcleo de antecipação" },
  { h:"Análise determinística",                   cel:"planeamento", r:"art. 29.º" },
  { h:"Verificação de conformidade dos dados",    cel:"planeamento", r:"art. 46.º" },
  { h:"Elaborar proposta de PEA",                 cel:"planeamento", r:"art. 27.º, n.º 1, al. a)" },
  { h:"Histórico de propostas de PEA",            cel:"planeamento", r:"art. 27.º, n.º 1, al. a)" },
  /* --- Operações: arts. 16.º a 25.º --- */
  { h:"Dispositivo e setorização",                cel:"operacoes",   r:"art. 17.º, n.º 1, als. a) e d)" },
  { h:"Registo de evolução da situação operacional", cel:"operacoes", r:"art. 17.º, n.º 1, al. a)" },
  { h:"Linha de evolução",                        cel:"operacoes",   r:"art. 17.º, n.º 1, al. a)" },
  { h:"Fita do tempo",                            cel:"operacoes",   r:"art. 17.º, n.º 1, al. g)" },
  /* --- Logística e Finanças: arts. 31.º a 35.º --- */
  { h:"Plano de comunicações",                    cel:"logistica",   r:"art. 32.º, n.º 1, al. d); art. 34.º" },
  { h:"Pacote de canais",                         cel:"logistica",   r:"art. 34.º" },
  { h:"Ponto de trânsito",                        cel:"logistica",   r:"art. 32.º, n.º 1, al. b); DON 2, 7.d.(5), (7) e (8)" },
  { h:"Controlo de tempos e rendições",           cel:"logistica",   r:"art. 33.º; DON 2, 7.e.(5)(r)" }
];

/* A ajuda no ecrã, um bloco por separador. Vive dentro do painel da célula desde o
   princípio, e por isso não precisa de ser movida — mas precisa de ser auditada.

   Até à r0040 os blocos de ajuda estavam nos painéis antigos e a arrumação só movia
   cartões: ficaram sete presos dentro de contentores com `display:none`, e o botão de
   ajuda passou a alternar uma classe que já não mostrava nada. Nada rebentava, e não
   havia como saber. É por isso que a chave é declarada aqui e verificada. */
const AJUDAS = [
  { k:"comando",     r:"arts. 14.º e 15.º" },
  { k:"planeamento", r:"arts. 26.º a 30.º e 46.º" },
  { k:"operacoes",   r:"arts. 16.º a 25.º" },
  { k:"logistica",   r:"arts. 31.º a 35.º" },
  { k:"turno",       r:"DON n.º 2 / DECIR 2026, ponto 7.d.(30)" }
];

/* Painéis antigos que continuam a ser alvo de `irPara` e dos botões `data-ir`.
   Nenhuma das quarenta e tal referências espalhadas pelo código precisou de mudar:
   traduzem-se aqui, e levam ao cartão que antes encabeçava a secção. */
const ATALHOS_PANE = {
  "p-occ":    { pane:"p-comando",     h:"Identificação da ocorrência" },
  "p-fontes": { pane:"p-planeamento", h:"Dados operacionais da ocorrência" },
  "p-pco":    { pane:"p-comando",     h:"Estrutura do posto de comando" },
  "p-evo":    { pane:"p-operacoes",   h:"Registo de evolução da situação operacional" },
  "p-meteo":  { pane:"p-planeamento", h:"Previsão meteorológica" },
  "p-pea":    { pane:"p-planeamento", h:"Elaborar proposta de PEA" },
  "p-avisos": { pane:"p-comando",     h:"Avisos ativos" },
  "p-fita":   { pane:"p-operacoes",   h:"Fita do tempo" }
};

function tituloCartao(c){ const h = c.querySelector("h2"); return h? h.childNodes[0].textContent.trim() : ""; }
function cartaoPorTitulo(h){
  return [...document.querySelectorAll(".card")].find(c=>tituloCartao(c) === h) || null;
}

/* Move cada cartão para o painel da sua célula. `appendChild` move o nó e preserva
   os ouvintes já ligados, por isso a arrumação não parte um único botão. */
function arrumarCasa(){
  /* a importação do dispositivo acompanha a setorização */
  const imp = document.querySelector('[data-move-ops]');
  const disp = cartaoPorTitulo("Dispositivo e setorização");
  if(imp && disp && !disp.contains(imp)) disp.appendChild(imp);

  /* O briefing de passagem de comando estava dentro do cartão do plano de comunicações
     por acidente de construção. É matéria de continuidade de comando — DON n.º 2, ponto
     7.d.(30) — e o seu lugar é junto da passagem de turno. */
  const brf = document.querySelector('[data-move-turno]'), pt = document.getElementById("p-turno");
  if(brf && pt){
    const cx = document.createElement("div");
    cx.className = "card";
    cx.innerHTML = '<h2>Briefing de passagem de comando <span class="tag">DON n.º 2, ponto 7.d.(30) — composição determinística</span></h2>';
    cx.appendChild(brf);
    pt.insertBefore(cx, pt.querySelector(".card:nth-of-type(2)") || null);
  }

  ARRUMACAO.forEach(a=>{
    const c = cartaoPorTitulo(a.h), destino = document.getElementById("p-"+a.cel);
    if(c && destino) destino.appendChild(c);
  });
  /* Um só quadro de rendições. O `amp-quadro` e o `amp-quadro-2` nasceram em painéis
     diferentes e recebiam ambos o mesmo ciclo; juntos na célula de logística passaram
     a mostrar a mesma tabela duas vezes. Fica o cartão dos limiares, que é o que
     permite agir, e recebe a explicação das barras do que se retira. */
  const cTempos = cartaoPorTitulo("Tempos de empenhamento e rendições");
  const cCtrl = cartaoPorTitulo("Controlo de tempos e rendições");
  if(cTempos && cCtrl){
    const q2 = cTempos.querySelector("#amp-quadro-2");
    cTempos.querySelectorAll(":scope > .hint, :scope > p").forEach(p=>{
      if(!cCtrl.querySelector('[data-mov-nota]')){ p.setAttribute("data-mov-nota","1"); cCtrl.appendChild(p); }
    });
    if(q2) q2.remove();
    cTempos.remove();
    const tg = cCtrl.querySelector(".tag");
    if(tg) tg.textContent = "art. 33.º · DON n.º 2, pontos 7.d.(14) e 7.e.(5)(r)";
  }

  /* o relógio do PEA em vigor e a vista do PEA emitido não são cartões: são caixas
     que se preenchem sozinhas. Seguem a célula que elabora o plano — art. 27.º. */
  const pl = document.getElementById("p-planeamento");
  ["pea-vigor","pea-view"].forEach(id=>{ const n = document.getElementById(id); if(n && pl) pl.appendChild(n); });

  /* os painéis antigos ficam vazios e saem da vista */
  Object.keys(ATALHOS_PANE).forEach(id=>{ const p = document.getElementById(id); if(p) p.classList.add("husk"); });
}

/* Um cartão que fique de fora, ou um registo que aponte para cartão inexistente, é
   defeito visível — e não um cartão que ninguém encontra. */
function auditarArrumacao(){
  const VIVOS = "#p-comando,#p-planeamento,#p-operacoes,#p-logistica,#p-turno";
  const semCelula = [...document.querySelectorAll(".card")]
    .filter(c=>!c.closest(VIVOS))
    .map(tituloCartao);
  const semCartao = ARRUMACAO.filter(a=>!cartaoPorTitulo(a.h)).map(a=>a.h);

  /* A ajuda que fica fora de um painel vivo não se vê, e o botão que a liga passa a
     mentir. Conta como defeito, pela mesma razão que um cartão perdido. */
  const ajudaForaDeCelula = [...document.querySelectorAll(".help")]
    .filter(b=>!b.closest(VIVOS))
    .map(b=>b.getAttribute("data-ajuda") || "(sem chave)");
  const ajudaEmFalta = AJUDAS
    .filter(a=>!document.querySelector('.help[data-ajuda="'+a.k+'"]'))
    .map(a=>a.k);
  const semNorma = ARRUMACAO.filter(a=>!a.r).map(a=>a.h);
  return { cartoes:document.querySelectorAll(".card").length, semCelula, semCartao, semNorma,
    ajudas:document.querySelectorAll(".help").length, ajudaForaDeCelula, ajudaEmFalta };
}

window.irPara = pid => {
  const a = ATALHOS_PANE[pid], alvo = a? a.pane : pid;
  const b = document.querySelector('nav button[data-p="'+alvo+'"]');
  if(!b) return;
  b.click();
  if(a && a.h){ const c = cartaoPorTitulo(a.h); if(c) try{ c.scrollIntoView({block:"start",behavior:"smooth"}); }catch(e){} }
};
const NOMES_PANE = {"p-occ":"Comando · identificação","p-fontes":"Planeamento · dados da ocorrência","p-pco":"Comando · estrutura do PCO","p-evo":"Operações · evolução","p-meteo":"Planeamento · meteorologia","p-pea":"Planeamento · PEA","p-avisos":"Comando · avisos","p-turno":"Passagem de turno"};
function pintarGuia(){
  const L = pendencias();
  // estado por separador
  ["p-occ","p-fontes","p-pco","p-evo","p-meteo"].forEach(p=>{
    const btn = document.querySelector('nav button[data-p="'+p+'"]'); if(!btn) return;
    const itens = L.filter(x=>x.p===p);
    const falta = itens.filter(x=>!x.ok&&x.ob).length, rec = itens.filter(x=>!x.ok&&!x.ob).length;
    let nb = btn.querySelector(".nb");
    if(!nb){ nb=document.createElement("span"); nb.className="nb"; btn.appendChild(nb); }
    /* o distintivo só aparece quando há algo por fazer: a ausência é o sinal de secção completa */
    if(falta){ nb.className="nb f"; nb.textContent=String(falta); btn.title=falta+(falta===1? " campo obrigatório em falta nesta secção":" campos obrigatórios em falta nesta secção"); }
    else if(rec){ nb.className="nb r"; nb.textContent=String(rec); btn.title=rec+(rec===1? " campo recomendado por preencher; nada obrigatório em falta":" campos recomendados por preencher; nada obrigatório em falta"); }
    else { nb.className="nb c"; nb.textContent=""; btn.title="Secção completa"; }
  });
  // próximo passo
  const g=$("guia"), gt=$("guia-txt"), gi=$("guia-ir");
  const prim = L.find(x=>!x.ok&&x.ob);
  if(prim){
    g.className="guia-in falta";
    gt.textContent = prim.c+" ("+(NOMES_PANE[prim.p]||prim.p)+")";
    gi.style.display=""; gi.onclick=()=>irPara(prim.p);
  } else {
    g.className="guia-in ok";
    gt.textContent = "Dados obrigatórios completos — podes emitir a proposta de PEA em Planeamento.";
    gi.style.display=""; gi.onclick=()=>irPara("p-pea");
  }
}
/* Transforma cada bloco de ajuda num dobrável: o título vira botão e o resto do
   conteúdo vai para um contentor que abre a pedido. Sem tocar no HTML — os nós são
   movidos, como na arrumação por células, e mover preserva o que estiver ligado. */
function dobrarAjudas(){
  document.querySelectorAll(".help").forEach(h=>{
    if(h.querySelector(":scope > .hb")) return;              /* já dobrado */
    const ht = h.querySelector(":scope > .ht") || h.querySelector(":scope > h3");
    const titulo = ht ? ht.textContent.trim() : "Ajuda desta secção";
    const corpo = document.createElement("div");
    corpo.className = "hc";
    while(h.firstChild) corpo.appendChild(h.firstChild);
    const b = document.createElement("button");
    b.type = "button"; b.className = "hb"; b.setAttribute("aria-expanded", "false");
    b.innerHTML = '<span></span><span class="hseta">mostrar</span>';
    b.firstChild.textContent = titulo;
    b.addEventListener("click", ()=>abrirAjuda(h, !h.classList.contains("aberta")));
    h.appendChild(b); h.appendChild(corpo);
  });
}
function abrirAjuda(h, on){
  h.classList.toggle("aberta", !!on);
  const b = h.querySelector(":scope > .hb");
  if(b){
    b.setAttribute("aria-expanded", on? "true":"false");
    const st = b.querySelector(".hseta"); if(st) st.textContent = on? "ocultar" : "mostrar";
  }
}
/* O botão do cabeçalho continua a valer para tudo: abre ou fecha todos de uma vez. */
function todasAsAjudas(on){
  document.querySelectorAll(".help").forEach(h=>abrirAjuda(h, on));
}

async function alternarAjuda(on){
  document.documentElement.classList.toggle("ajuda", on);
  /* Dobrados **sempre fechados** ao ligar a ajuda. O guião que trouxe os dobráveis
     prometia «fechado por omissão», e depois abria-os todos por o interruptor global
     estar ligado — que é o estado normal. O muro voltava inteiro no primeiro arranque.
     O interruptor mostra e esconde a ajuda; cada título abre o seu corpo. */
  try{ dobrarAjudas(); todasAsAjudas(false); }catch(e){}
  $("b-ajuda").setAttribute("aria-pressed", on? "true":"false");
  $("b-ajuda").textContent = on? "Ocultar" : "Ajuda";
  $("b-ajuda").title = on? "Ocultar a ajuda no ecrã" : "Mostrar a ajuda no ecrã";
  try{ await ARMAZEM.set("peaapp:ajuda", on? "1":"0"); }catch(e){}
}
$("b-ajuda").addEventListener("click", ()=>alternarAjuda(!document.documentElement.classList.contains("ajuda")));
(async()=>{ let on=true; try{ const r=await ARMAZEM.get("peaapp:ajuda"); on = r.value!=="0"; }catch(e){}
  alternarAjuda(on); })();
["o-inicio","o-fase","o-nivel"].forEach(id=>{
  const el=$(id); if(el){ el.addEventListener("change", ()=>{ try{ autoNivelDECIR(); pintarDON(); }catch(e){} }); el.addEventListener("input", ()=>{ try{ autoNivelDECIR(); pintarDON(); }catch(e){} }); }
});
/* a banda de conformidade depende do relógio: reavaliação a cada 30 segundos */
setInterval(()=>{ try{ pintarDON(); renderVigor(); }catch(e){} }, 30000);
["o-num","o-local","o-pco","o-fase","o-pasta","o-lat","o-lon","o-inicio","o-nivel","d-area","d-sensiveis"].forEach(id=>{
  const el=$(id); if(el) el.addEventListener("change", ()=>{ try{ pintarGuia(); renderCheck(); }catch(e){} });
});
["o-lat","o-lon"].forEach(id=>{ const el=$(id); if(el) el.addEventListener("change", ()=>{ try{ atualizarDistrito(); }catch(e){} }); });
function renderCheck(){
  const L = pendencias();
  const falta = L.filter(x=>!x.ok&&x.ob).length;
  $("chk-list").innerHTML = L.map(x=>{
    const cls = x.ok? "ok" : (x.ob? "falta":"rec");
    const rot = x.ok? "COMPLETO" : (x.ob? "EM FALTA":"RECOMENDADO");
    return `<div class="chk"><span class="est ${cls}">${rot}</span><span class="cmp">${esc(x.c)}</span>${x.ok? "" : `<button class="ir" onclick="irPara('${x.p}')">Preencher</button>`}</div>`;
  }).join("") + (falta? `<p class="hint" style="margin-top:10px;color:var(--fogo)">Faltam ${falta} dados obrigatórios — o PEA não pode ser emitido sem eles.</p>`
                       : `<p class="hint" style="margin-top:10px;color:var(--madeira)">Dados obrigatórios completos — pronto para emitir.</p>`);
}

