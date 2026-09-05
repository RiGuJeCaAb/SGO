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
  { h:"Cópias de segurança e diário do posto",     cel:"comando",     r:"art. 2.º, al. c) — registo temporal explícito e completo" },
  { h:"Estado das integrações",                   cel:"comando",     r:"—" },
  { h:"Encerramento da ocorrência",               cel:"comando",     r:"art. 8.º, n.º 2; art. 2.º, al. c)" },
  { h:"Catálogo de elementos",                    cel:"comando",     r:"art. 14.º — quem ocupa as funções do PCO" },
  { h:"Quem regista",                             cel:"comando",     r:"art. 2.º, al. c) — o registo é atribuído a quem o faz" },
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

/**
 * O título de um cartão: o primeiro nó de texto do `h2`, sem a etiqueta legal ao lado.
 *
 * É por ele que os registos encontram os cartões. Um título que mude sem o registo
 * acompanhar parte a auditoria — de propósito.
 */
function tituloCartao(c){
  const h = c.querySelector("h2"); if(!h) return "";
  /* Num cartão já dobrado o título vive dentro do botão, e o botão é o primeiro filho do
     <h2>: o texto lê-se de dentro dele, ou o título passava a trazer a etiqueta legal. */
  const raiz = h.querySelector(":scope > .cd-btn") || h;
  return raiz.childNodes[0]? raiz.childNodes[0].textContent.trim() : "";
}
/** O cartão com este título, ou nada. */
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
  ["pea-vigor","pea-estado","pea-view"].forEach(id=>{ const n = document.getElementById(id); if(n && pl) pl.appendChild(n); });

  /* os painéis antigos ficam vazios e saem da vista */
  Object.keys(ATALHOS_PANE).forEach(id=>{ const p = document.getElementById(id); if(p) p.classList.add("husk"); });
}

/* ================= cartões dobráveis =================
   Os cartões que crescem sem limite abrem a pedido. O cabeçalho fica sempre à vista,
   com a contagem: fechar não é esconder que existe, é não deixar que ocupe o painel.

   Ao fim de umas horas de ocorrência a fita do tempo tem dezenas de registos e a linha
   de evolução outras tantas, e o painel de Operações passa a ser uma coluna de milhares
   de pixéis onde nada mais se encontra.

   `contar` devolve o rótulo que aparece no cabeçalho fechado. Devolver vazio significa
   que não há nada lá dentro, e o cabeçalho di-lo em vez de mentir com um zero. */
const CARTOES_DOBRAVEIS = [
  { h:"Fita do tempo", celula:"operacoes", r:"art. 2.º, al. c); art. 17.º, n.º 1, al. g)",
    porque:"cresce a cada registo e ao fim de horas ocupa o painel inteiro",
    contar:()=>{ const n=(O.fita||[]).length; return n? n+(n===1? " registo":" registos") : "sem registos"; } },
  { h:"Linha de evolução", celula:"operacoes", r:"art. 17.º, n.º 1, al. a)",
    porque:"cresce a cada ponto de situação e a cada alteração de estado de setor",
    /* Este cartão já trazia a contagem na etiqueta do cabeçalho. Reaproveita-se a que
       existe em vez de acrescentar uma segunda que diria o mesmo ao lado. */
    cnt:"evo-count" }
];

/* ================= a linha de estado do cabeçalho fechado =================
   **O cabeçalho fechado é linha de estado, não título.** É a regra que decide todo este
   mecanismo, e é o contrário do que um acordeão costuma fazer.

   A aplicação inteira está construída para dizer o que falta. Um dobrável comum esconde o
   conteúdo e deixa o título: quem fechasse um cartão deixava de ver que lá dentro há dois
   campos obrigatórios por preencher, e passaria a emitir o PEA convencido de que estava
   completo. Fechar tem de continuar a dizer o que lá está por fazer — o que se ganha é
   espaço, não silêncio.

   Daí as três regras:

   1. Todo o cartão fechado diz o seu estado, e **um cartão sem nada a assinalar di-lo
      também**: «nada a assinalar» distingue-se de um cabeçalho mudo, que não diz se
      alguém verificou ou se ninguém olhou.
   2. **O que tem obrigatório em falta abre sozinho**, e a preferência guardada não o
      fecha. A pendência ganha sempre.
   3. A preferência vive no `ARMAZEM`, **nunca no estado da ocorrência**. Ter o cartão da
      logística fechado é uma conveniência de quem está ao teclado, não um facto da
      ocorrência, e não tem nada que viajar na exportação nem na passagem de turno. */

/* **Não há exceções.** Cheguei a deixar de fora a identificação da ocorrência, com o
   argumento de que é o cartão de que tudo o resto depende. Vista no ecrã, a exceção não se
   defendia: é o cartão mais alto da aplicação e ocupava o primeiro ecrã inteiro, que é
   precisamente a queixa que trouxe este trabalho. E o argumento era desnecessário — a regra
   da pendência já o mantém aberto enquanto lhe faltar um obrigatório, e depois de
   preenchido não há razão para ocupar espaço. */

/**
 * O estado de um cartão: o que lhe falta, e se isso o obriga a abrir.
 *
 * As pendências localizam-se pelo elemento que cada uma declara, e não por uma tabela
 * de cartões escrita à mão — ver `pendencias()`. O que aqui se faz é agrupá-las pelo
 * cartão onde o elemento está.
 */
function estadoDoCartao(c){
  let falta = 0, rec = 0;
  try{
    pendencias().forEach(x=>{
      if(x.ok || !x.el) return;
      const el = document.getElementById(x.el); if(!el) return;
      if(el.closest(".card") !== c) return;
      if(x.ob) falta++; else rec++;
    });
  }catch(e){ /* antes de o estado existir não há pendências a contar */ }

  const d = CARTOES_DOBRAVEIS.find(x=>x.h === tituloCartao(c));
  let cont = "";
  if(d && d.contar){ try{ cont = d.contar() || ""; }catch(e){ cont = ""; } }

  const p = [];
  if(falta) p.push(falta + (falta===1? " obrigatório em falta" : " obrigatórios em falta"));
  if(rec)   p.push(rec + (rec===1? " recomendado por preencher" : " recomendados por preencher"));
  /* A contagem de um cartão que a pinta no seu próprio elemento não se repete aqui: já
     está no cabeçalho, ao lado. */
  if(cont && !(d && d.cnt)) p.push(cont);

  /* «Nada a assinalar» só se diz quando não há mais nada a dizer. Num cartão que traz
     contagem própria — «sem registos» na linha de evolução — a contagem já é a linha de
     estado, e acrescentar-lhe «nada a assinalar» ao lado é ruído a dizer o mesmo. */
  const texto = p.length ? p.join(" · ") : (cont || "nada a assinalar");

  /* Só o obrigatório obriga a abrir. Se o recomendado também obrigasse, tudo ficaria
     sempre aberto e o mecanismo não serviria para nada — que é o mesmo que não o ter. */
  return { texto, falta, rec, pendente: falta > 0 };
}

/** A chave onde vive a preferência de dobra. Local ao dispositivo, fora da ocorrência. */
const DOBRA_CHAVE = "peaapp:dobra";
let DOBRA = {};

/** Lê a preferência guardada. Falhar não é erro: a aplicação abre com a regra por omissão. */
async function carregarDobra(){
  try{ const r = await ARMAZEM.get(DOBRA_CHAVE); DOBRA = JSON.parse(r.value || "{}") || {}; }
  catch(e){ DOBRA = {}; }
}

/** Grava a preferência. O que se guarda é o título do cartão, que é o que o utilizador vê. */
async function guardarDobra(h, on){
  DOBRA[h] = on? 1 : 0;
  try{ await ARMAZEM.set(DOBRA_CHAVE, JSON.stringify(DOBRA)); }catch(e){}
}

/**
 * Transforma cada cartão declarado num dobrável.
 *
 * Os nós são movidos, não recriados: mover preserva os ouvintes já ligados, como na
 * arrumação por células. Correr duas vezes não duplica nada — o cartão já dobrado
 * reconhece-se pela classe.
 */
function dobrarCartoes(){
  /* Todos os cartões dos painéis vivos, e já não só os declarados: o problema que isto
     veio resolver é que **todos** cresceram, e não só a fita do tempo. Os declarados
     continuam a valer — é deles que vem a contagem que o cabeçalho mostra. */
  const VIVOS = "#p-comando,#p-planeamento,#p-operacoes,#p-logistica,#p-turno";
  [...document.querySelectorAll(".card")]
    .filter(c=>c.closest(VIVOS))
    .forEach(c=>dobrarCartao(c));
  pintarContagens();
}

/** Dobra um cartão. Correr duas vezes não duplica nada — o dobrado reconhece-se pela classe. */
function dobrarCartao(c){
  if(c.classList.contains("dobravel")) return;
  const h2 = c.querySelector("h2"); if(!h2) return;
  /* Sem recuo para `{}`: um recuo com forma diferente da real alarga o tipo até deixar
     de dizer nada, e o verificador passaria a não saber que o cartão declarado tem `cnt`.
     Nem todo o cartão está declarado, e é isso que o `d &&` diz. */
  const d = CARTOES_DOBRAVEIS.find(x=>x.h === tituloCartao(c));
  c.classList.add("dobravel");

  /* O conteúdo vai para um contentor próprio; o cabeçalho fica de fora, **e fica
     cabeçalho**. Até à r0099 o `<h2>` recebia `role="button"`, e isso apagava-lhe o papel:
     os 31 títulos de cartão desapareciam da árvore de acessibilidade e a aplicação ficava
     com um só cabeçalho, o `<h1>`. O botão vai agora para dentro do `<h2>`, com o título lá
     dentro — é o que a ajuda já fazia com o `.hb`. O `<button>` traz o foco, a tecla e o
     papel de graça, e o `<h2>` continua a ser o que um leitor de ecrã salta para. */
  const corpo = document.createElement("div");
  corpo.className = "cd-corpo";
  corpo.id = "cd-corpo-" + (++DOBRA_N);
  while(h2.nextSibling) corpo.appendChild(h2.nextSibling);
  c.appendChild(corpo);
  h2.classList.add("cd-cab");
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "cd-btn";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", corpo.id);
  while(h2.firstChild) btn.appendChild(h2.firstChild);
  h2.appendChild(btn);

  /* Procura-se dentro do próprio cartão e não pelo documento: a arrumação por células
     move os cartões, e um `getElementById` no momento errado apanha o elemento antes de
     estar onde vai ficar — ou não o apanha, e ficam duas contagens a dizer o mesmo lado
     a lado. */
  const ex = (d && d.cnt) ? c.querySelector("#" + d.cnt) : null;
  if(ex){ ex.classList.add("cd-cnt", "cd-cnt-ex"); h2.appendChild(ex); }
  else { const cnt = document.createElement("span"); cnt.className = "cd-cnt"; h2.appendChild(cnt); }

  /* Fechar um cartão com obrigatório em falta não fica guardado: a pendência ganha
     sempre, e da próxima vez volta a abrir. Guardar essa preferência seria deixar o
     utilizador esconder de si próprio o que a aplicação existe para lhe dizer. */
  const alternar = ()=>{
    const on = !c.classList.contains("aberto");
    abrirCartao(c, on);
    if(!estadoDoCartao(c).pendente) guardarDobra(tituloCartao(c), on);
  };
  /* Um só ouvinte, no `<h2>`: o clique no botão sobe até aqui, e a tecla no botão é um
     clique nativo — não há segundo ouvinte de teclado a disparar duas vezes. Clicar na
     contagem, fora do botão, também alterna, como antes. */
  h2.addEventListener("click", alternar);
}

/** Contador dos corpos dobráveis, para cada `aria-controls` apontar para um `id` seu. */
let DOBRA_N = 0;

/* Abrir um não fecha os outros: não é acordeão exclusivo, que obrigaria a fechar a
   fita para ver a evolução, e num PCO isso é trabalho a mais. */
function abrirCartao(c, on){
  if(!c) return;
  c.classList.toggle("aberto", !!on);
  const btn = c.querySelector(":scope > h2 > .cd-btn");
  if(btn) btn.setAttribute("aria-expanded", on? "true":"false");
}

/* A contagem no cabeçalho tem de acompanhar o que está lá dentro, aberto ou fechado:
   é a única coisa que se vê quando o cartão está fechado. */
function pintarContagens(){
  document.querySelectorAll(".card.dobravel").forEach(c=>{
    const el = c.querySelector(":scope > h2 > .cd-cnt"); if(!el) return;
    const e = estadoDoCartao(c);

    /* A contagem que o cartão já trazia é de quem a criou e não se escreve por cima —
       é o caso da linha de evolução, que tem a sua própria etiqueta no cabeçalho. Nesses
       o estado vai para um segundo elemento, ao lado. */
    const proprio = el.classList.contains("cd-cnt-ex");
    let alvo = el;
    if(proprio){
      alvo = c.querySelector(":scope > h2 > .cd-est");
      if(!alvo){ alvo = document.createElement("span"); alvo.className = "cd-cnt cd-est"; el.after(alvo); }
    }
    /* Num cartão de contagem própria, o estado só fala quando tem algo a dizer: a
       contagem que já lá está é a linha de estado, e «sem registos · nada a assinalar»
       são duas maneiras de dizer o mesmo lado a lado. */
    alvo.textContent = (proprio && !e.falta && !e.rec) ? "" : e.texto;
    alvo.classList.toggle("cd-falta", e.falta > 0);
    alvo.classList.toggle("cd-rec", e.falta === 0 && e.rec > 0);

    /* A pendência abre o cartão e mantém-no aberto. Fora disso vale a preferência
       guardada, e na ausência dela o cartão fica fechado — que é o ponto de tudo isto:
       um painel só com o que precisa de atenção aberto. */
    const h = tituloCartao(c);
    if(e.pendente) abrirCartao(c, true);
    else if(!c.classList.contains("cd-tocado")) abrirCartao(c, DOBRA[h] === 1);
    c.classList.add("cd-tocado");
  });
}

/* Um cartão declarado que não exista, ou que exista e não tenha dobrado, é defeito
   visível — e não um cartão que ninguém consegue abrir. */
function auditarDobraveis(){
  const semCartao = CARTOES_DOBRAVEIS.filter(d=>!cartaoPorTitulo(d.h)).map(d=>d.h);
  const semDobrar = CARTOES_DOBRAVEIS.filter(d=>{
    const c = cartaoPorTitulo(d.h); return c && !c.classList.contains("dobravel");
  }).map(d=>d.h);
  const semRazao = CARTOES_DOBRAVEIS.filter(d=>!d.r || !d.porque).map(d=>d.h);
  return { n:CARTOES_DOBRAVEIS.length, semCartao, semDobrar, semRazao };
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
/**
 * Acende, em cada separador, quantos dados obrigatórios lhe faltam.
 *
 * Um PEA não sai sem os obrigatórios, e descobri-lo só no momento de o emitir é descobri-lo
 * tarde. O que falta aparece onde se preenche.
 */
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
/** Abre ou fecha um bloco de ajuda, e acerta o que o botão diz. */
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

/**
 * Liga e desliga a ajuda no ecrã, e guarda a escolha no dispositivo.
 *
 * @param {boolean} on mostrar a ajuda
 */
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
  const el=$(id); if(el){ el.addEventListener("change", ()=>{ try{ autoNivelDECIR(); pintarDON(); }catch(e){ /* ignorado: a repintura falhada relata-se em pintarTudo */ } }); el.addEventListener("input", agendarPintarDON); }
});
/* a banda de conformidade depende do relógio: reavaliação a cada 30 segundos */
setInterval(reavaliarPeriodicamente, 30000);

/** O temporizador da repintura adiada, para uma tecla cancelar a anterior. */
let PINTAR_DON_T = null;

/**
 * Repinta a conformidade daqui a um quarto de segundo, e não a cada tecla.
 *
 * `pintarDON` reconstrói o PEA em vigor, todas as caixas DON e as ampulhetas. O GDH de
 * início tem onze caracteres: eram onze reconstruções completas por preenchimento. Com o
 * atraso, quem escreve seguido só paga uma, no fim.
 */
function agendarPintarDON(){
  if(PINTAR_DON_T) clearTimeout(PINTAR_DON_T);
  PINTAR_DON_T = setTimeout(()=>{ PINTAR_DON_T = null; try{ autoNivelDECIR(); pintarDON(); }catch(e){ /* ignorado: a repintura falhada relata-se em pintarTudo */ } }, 250);
}

/**
 * A reavaliação periódica da conformidade, que depende do relógio.
 *
 * Só `pintarDON`: era `pintarDON(); renderVigor();`, e `pintarDON` já repinta o PEA em
 * vigor por si — a segunda chamada reconstruía o cartão duas vezes por passagem. E é
 * `pintarDON` que sabe não repintar o cartão quando o foco está lá dentro.
 */
function reavaliarPeriodicamente(){
  try{ pintarDON(); }catch(e){ /* ignorado: a repintura falhada relata-se em pintarTudo */ }
}
["o-num","o-local","o-pco","o-fase","o-pasta","o-lat","o-lon","o-inicio","o-nivel","d-area","d-sensiveis"].forEach(id=>{
  const el=$(id); if(el) el.addEventListener("change", ()=>{ try{ pintarGuia(); renderCheck(); }catch(e){} });
});
["o-lat","o-lon"].forEach(id=>{ const el=$(id); if(el) el.addEventListener("change", ()=>{ try{ atualizarDistrito(); }catch(e){} }); });
/** Desenha a lista de verificação dos dados da ocorrência, com o atalho para preencher. */
function renderCheck(){
  const L = pendencias();
  const falta = L.filter(x=>!x.ok&&x.ob).length;
  $("chk-list").innerHTML = L.map(x=>{
    /* Três estados, não dois. Uma pendência que não se conseguiu avaliar bloqueia como
       uma que falta — falha fechada —, mas não se diz «em falta»: não é o campo que está
       vazio, é a verificação que rebentou, e mandar preencher seria mandar para o sítio
       errado. */
    const cls = x.ok? "ok" : (x.erro? "falta" : (x.ob? "falta":"rec"));
    const rot = x.ok? "COMPLETO" : (x.erro? "POR VERIFICAR" : (x.ob? "EM FALTA":"RECOMENDADO"));
    const nota = x.erro? ` <span class="hint">não foi possível verificar: ${esc(x.erro)}</span>` : "";
    return `<div class="chk"><span class="est ${cls}">${rot}</span><span class="cmp">${esc(x.c)}${nota}</span>${(x.ok||x.erro)? "" : `<button class="ir" data-ir="${esc(x.p)}">Preencher</button>`}</div>`;
  }).join("") + (falta? `<p class="hint" style="margin-top:10px;color:var(--fogo)">Faltam ${falta} dados obrigatórios — o PEA não pode ser emitido sem eles.</p>`
                       : `<p class="hint" style="margin-top:10px;color:var(--madeira)">Dados obrigatórios completos — pronto para emitir.</p>`);
  /* Sem `onclick="irPara('...')"`: o destino é interno, mas a forma é a mesma que
     deixava executar código pelo número da ocorrência. Uma forma perigosa não se
     mantém porque hoje o valor é de confiança — mantém-se ou não se mantém. */
  $("chk-list").querySelectorAll("[data-ir]").forEach(b=>
    b.addEventListener("click", ()=>irPara(b.getAttribute("data-ir"))));
}

