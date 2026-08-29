/* ================= NÚCLEO · modelo de células e turno ================= */
/* As quatro linhas do posto de comando: o comando e as três células do art. 12.º,
   n.º 2 do SIOPS. Declaração de função — sobe, e por isso novoEstado() pode usá-la. */
function CELULAS_PCO(){
  return [
    {k:"comando",     n:"Comando",              r:"arts. 14.º e 15.º"},
    {k:"operacoes",   n:"Operações",            r:"arts. 16.º a 25.º"},
    {k:"planeamento", n:"Planeamento",          r:"arts. 26.º a 30.º"},
    {k:"logistica",   n:"Logística e Finanças", r:"arts. 31.º a 35.º"}
  ];
}
function novoTurno(){
  const c = {};
  CELULAS_PCO().forEach(x=>{ c[x.k] = {n:"", ct:"", nota:""}; });
  return { equipa:"", inicio:"", celulas:c, entregas:[] };
}

/* 3 -> 4 · Passagem de turno e nomeação externa em dois instantes.
   Acrescentada por push para não depender do conteúdo do literal de MIGRACOES:
   o índice sai correto seja qual for o número de migrações já existentes.
   Puramente aditiva — não reinterpreta nem apaga nada do que estava gravado.
   `g` mantém o significado de GDH da nomeação; `solicitado` nasce vazio, porque
   uma ocorrência gravada antes desta versão não traz marca que permita saber
   quando o COS solicitou, e adivinhar seria pior do que deixar em branco. */
MIGRACOES.push(e => {
  if(!e.turno || typeof e.turno!=="object") e.turno = novoTurno();
  if(!Array.isArray(e.turno.entregas)) e.turno.entregas = [];
  e.turno.celulas = Object.assign(novoTurno().celulas, e.turno.celulas||{});
  e.pco = e.pco || {funcoes:[]};
  (e.pco.funcoes||[]).forEach(f=>{ if(typeof f.solicitado!=="string") f.solicitado = ""; });
  return e;
});

/* Devolve o estado migrado até à versão desta revisão. Recusa — sem tocar em nada —
   o que tenha sido gravado por uma revisão posterior, porque não o sabe ler. */
/** @param {any} guardado @returns {Estado} */
/* 4 -> 5 · A célula de logística e finanças passa a ter ramo próprio.
   Move a reserva, a zona de apoio e o ponto de trânsito para `logistica`, limpando a
   origem para que não fiquem duas verdades. Nada se perde: muda o dono, e o dono passa
   a ser o que a lei indica. O plano de comunicações seguiu no degrau seguinte. */
MIGRACOES.push(e => {
  /* O destino só vence a origem quando tem conteúdo. O degrau 0 já cria `logistica`
     com os valores por omissão — faz Object.assign sobre novoEstado() —, e testar
     apenas a existência do ramo faria uma ocorrência anterior à versão 1 perder a
     reserva em silêncio. Vazio não é migrado: é vazio. */
  const cheio = o => !!o && Object.keys(o).some(k => o[k] !== "" && o[k] != null);
  const est = (e.dados && e.dados.est) || {};
  const L = e.logistica = Object.assign({}, e.logistica||{});
  L.reserva       = Object.assign({m:"",o:""}, cheio(L.reserva)?   L.reserva   : (est.res||{}));
  L.zonaApoio     = Object.assign({m:"",o:""}, cheio(L.zonaApoio)? L.zonaApoio : (est.za||{}));
  L.pontoTransito = Object.assign({des:"",resp:"",ct:"",cd:"",obs:""},
                      cheio(L.pontoTransito)? L.pontoTransito : ((e.dados&&e.dados.pt)||{}));
  delete est.res; delete est.za;
  if(e.dados) delete e.dados.pt;
  return e;
});

/* 5 -> 6 · O plano de comunicações passa para a célula de logística e finanças.
   Compete ao CSREPC e ao CNEPC atribuir os canais rádio de cada TO, e ao COS
   implementar com base neles um plano de comunicações — DON n.º 2, ponto 10, n.os (1)
   a (3). A sustentação é matéria do art. 32.º, n.º 1, al. d), e do art. 34.º, e não
   das nomeações do art. 14.º, que é o que resta em `pco`.

   Era o último ramo por mover, e estava declarado como pendente no registo de posse.
   Mesma regra dos degraus anteriores: o destino só vence a origem quando tem conteúdo,
   e a origem limpa-se para não ficarem duas verdades. */
MIGRACOES.push(e => {
  const cheio = o => !!o && Object.keys(o).some(k => {
    const v = o[k];
    return Array.isArray(v) ? v.length > 0 : (v !== "" && v != null);
  });
  const L = e.logistica = Object.assign({}, e.logistica||{});
  const origem = (e.pco && e.pco.canais) || {};
  L.comunicacoes = Object.assign({cmd:"",tat:"",ba:"",tatba:"",aero:"",opar:"",cmar:"",atrib:[],niveis:null},
    cheio(L.comunicacoes)? L.comunicacoes : origem);
  if(!Array.isArray(L.comunicacoes.atrib)) L.comunicacoes.atrib = [];
  if(e.pco) delete e.pco.canais;
  return e;
});

/* 6 -> 7 · Encerramento do registo da ocorrência.
   Nasce vazio, e vazio significa aberta: uma ocorrência gravada antes desta versão não
   traz marca de encerramento, e presumi-la encerrada seria fechar à força o que ninguém
   fechou. O caminho seguro é o que deixa a ocorrência trabalhável. */
MIGRACOES.push(e => {
  const E = e.encerramento;
  e.encerramento = { g:"", por:"", nota:"" };
  if(E && typeof E === "object") Object.assign(e.encerramento, E);
  ["g","por","nota"].forEach(k=>{ if(typeof e.encerramento[k] !== "string") e.encerramento[k] = ""; });
  return e;
});

/* 7 -> 8 · Sub-região do teatro de operações.
   O pacote de canais traz a pasta sub-regional do posto, e o TO pode ser noutra
   sub-região, com outros grupos. Nasce vazia de propósito: **não se deduz do concelho**,
   porque a composição das sub-regiões não está confirmada em fonte neste projeto, e
   adivinhá-la punha a aplicação a afirmar uma pasta de rádio que ninguém verificou. */
MIGRACOES.push(e => {
  e.meta = e.meta || {};
  if(typeof e.meta.subregiao !== "string") e.meta.subregiao = "";
  return e;
});

/* 8 -> 9 · Registo de cumprimento de obrigações que são ato externo.
   Várias obrigações da DON cumprem-se fora da aplicação — notificar o CSREPC, propor a
   ativação do PMEPC. A Estação não as vê acontecer, e por isso ficavam vermelhas para
   sempre. Uma obrigação que nunca fecha ensina o oficial a ignorar o vermelho, que é o
   pior que um motor de conformidade pode fazer. Nasce vazio. */
MIGRACOES.push(e => {
  if(!e.cumprimentos || typeof e.cumprimentos !== "object" || Array.isArray(e.cumprimentos)){
    e.cumprimentos = {};
  }
  return e;
});

/* 9 -> 10 · Cada meio é uma unidade, e não um bloco com quantidade.
   Três viaturas do mesmo tipo num setor podem vir de corpos diferentes e ter entrado no
   teatro a horas diferentes. Enquanto partilhavam um bloco com `q:3` e um único instante,
   o relógio da rendição era o mesmo para as três — e a rendição pede-se por unidade, ao
   CSREPC, indicando o veículo e a hora de saída (DON n.º 2, ponto 7.e.(5)(r)).

   A migração reparte: um bloco de `q` unidades dá `q` entradas iguais, cada uma com o seu
   instante e a sua origem, que a partir daqui divergem. Nada se perde — o que se perde é
   a falsa igualdade entre unidades que só estavam juntas por comodidade de escrita. */
MIGRACOES.push(e => {
  const est = (e.dados && e.dados.est) || {};
  (est.setores||[]).forEach(s=>{
    if(!Array.isArray(s.tip)) { s.tip = []; return; }
    const fora = [];
    s.tip.forEach(it=>{
      if(!it || typeof it !== "object") return;
      const n = Math.max(1, Math.round(+it.q || 1));
      for(let k=0;k<n;k++){
        const u = Object.assign({}, it);
        delete u.q;
        if(typeof u.ent !== "string") u.ent = "";
        fora.push(u);
      }
    });
    s.tip = fora;
  });
  return e;
});

function migrarGravado(guardado){
  if(!guardado || typeof guardado!=="object") throw new Error("estado gravado ilegível");
  const de = Number.isInteger(guardado.versao)? guardado.versao : 0;
  if(de > VERSAO_ESTADO){
    const erro = /** @type {Error & {futuro:number}} */ (new Error("gravado na versão "+de+"; esta revisão lê até à "+VERSAO_ESTADO));
    erro.futuro = de; throw erro;
  }
  let e = guardado;
  for(let v=de; v<VERSAO_ESTADO; v++) e = MIGRACOES[v](e);
  e.versao = VERSAO_ESTADO;
  return e;
}

/** @type {Estado} */
let O = novoEstado();
let SERIE = [], ANALISE = null;

/** @returns {Estado} */
function novoEstado(){
  return { meta:{num:"",local:"",pco:"",fase:"",lat:"",lon:"",pasta:"",inicio:"",nivel:"",subregiao:"",distrito:"",concelho:"",distritoChave:""},
    avisos:null,
    dados:{area:"", perimNome:"", setores:"", sensiveis:"", anexos:[],
      perfil:null,
      topo:{orient:"", declive:"", obs:"", eps:""},
      est:{n:0, setores:[], aer:"", aerL:[], livre:false}},
    /* Célula de logística e finanças. A reserva e a zona de apoio são áreas da ZCR
       (art. 32.º, n.º 1, al. b)) e não fazem parte do dispositivo de Operações; o plano
       de comunicações é do art. 32.º, n.º 1, al. d), e do art. 34.º. */
    logistica:{ reserva:{m:"",o:""}, zonaApoio:{m:"",o:""},
      pontoTransito:{des:"",resp:"",ct:"",cd:"",obs:""},
      comunicacoes:{cmd:"",tat:"",ba:"",tatba:"",aero:"",opar:"",cmar:"",atrib:[],niveis:null} },
    /* Comando: as nomeações do art. 14.º, e mais nada. */
    pco:{funcoes:[]},
    /* Encerramento do registo da ocorrência nesta Estação. Vazio enquanto aberta. */
    encerramento:{ g:"", por:"", nota:"" },
    /* Obrigações dadas por cumpridas: id da regra -> {g, por, nota}. Só as que são ato
       externo, que a aplicação não consegue observar. Ver CUMPRIVEIS. */
    cumprimentos:{},
    evolucao:[], csv:"", peas:[], fita:[], turno:novoTurno(), versao:VERSAO_ESTADO };
}
/* O acessor devolve qualquer elemento; a verificação de tipos incide sobre o estado,
   não sobre o DOM. Ver tipos/estacao.d.ts. */
/** @type {(id:string)=>any} */
const $ = id => document.getElementById(id);
const esc = s => String(s??"").replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]));
const MES = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
function gdhAgora(){ const d=new Date(agora());
  return String(d.getDate()).padStart(2,"0")+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+MES[d.getMonth()]+String(d.getFullYear()).slice(2); }
function gdhDe(ts){ const d=new Date(ts);
  return String(d.getDate()).padStart(2,"0")+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+MES[d.getMonth()]+String(d.getFullYear()).slice(2); }

