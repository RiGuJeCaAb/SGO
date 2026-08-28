/* ================= versão do estado gravado ================= */
/* Uma ocorrência gravada é prova documental de decisões de comando: não se abre à
   sorte. Cada alteração à forma de O acrescenta uma migração ao fim de MIGRACOES e
   sobe VERSAO_ESTADO em um. O índice i migra da versão i para a versão i+1.
   Declarado antes de `let O`, que corre no arranque e já precisa da versão. */
const VERSAO_ESTADO = 4;

const MIGRACOES = [
  /* 0 -> 1 · Primeira versão numerada. Preenche contra os valores por omissão os
     ramos que o carregamento antigo deixava por normalizar — meta, pco e os ramos
     de dados —, sem sobrepor nenhum valor já gravado.
     Não reinterpreta a semântica dos canais: uma ocorrência gravada antes de
     siresp/ba passarem a ser o nível de manobra não traz marca que permita
     distingui-la, e adivinhar seria pior do que não mexer. */
  e => {
    /* `base` fica intacto: serve de referência dos valores por omissão. O estado
       a devolver é outro exemplar, para que juntar o topo não apague as omissões. */
    const base = novoEstado();
    const guardado = e;
    e = Object.assign(novoEstado(), guardado);
    e.meta = Object.assign({}, base.meta, guardado.meta||{});
    e.dados = Object.assign({}, base.dados, guardado.dados||{});
    e.dados.est = Object.assign({}, base.dados.est, e.dados.est||{});
    e.dados.est.res = Object.assign({}, base.dados.est.res, e.dados.est.res||{});
    e.dados.est.za = Object.assign({}, base.dados.est.za, e.dados.est.za||{});
    e.dados.pt = Object.assign({}, base.dados.pt, e.dados.pt||{});
    e.dados.topo = Object.assign({}, base.dados.topo, e.dados.topo||{});
    e.pco = Object.assign({}, base.pco, guardado.pco||{});
    e.pco.canais = Object.assign({}, base.pco.canais, e.pco.canais||{});
    [[e.dados,"anexos"],[e.dados.est,"setores"],[e.dados.est,"aerL"],[e.pco,"funcoes"],
     [e.pco.canais,"atrib"],[e,"evolucao"],[e,"peas"],[e,"fita"]]
      .forEach(([dono,ramo])=>{ if(!Array.isArray(dono[ramo])) dono[ramo]=[]; });
    return e;
  },
  /* 1 -> 2 · Repartição do PEA pelas células que a lei lhe atribui. Até aqui o plano
     era gravado em json {plan,ops}, com o objetivo, as prioridades, a segurança e a
     validade do lado de operações. O art. 27.º, n.º 1, al. a) do Despacho n.º
     4067/2024 põe o plano estratégico de ação inteiro na célula de planeamento; a
     operações cabe transmitir as ordens de missão (art. 17.º, n.º 1, al. c)).
     Passa a gravar-se json {pea,ordens}. Nenhum conteúdo se perde: muda o dono.
     pecas() reconhece os dois formatos, pelo que a conversão é idempotente. */
  e => {
    (e.peas||[]).forEach(p=>{
      if(p && p.json && !p.json.pea){ const c = pecas(p); p.json = {pea:c.pea, ordens:c.ordens}; }
    });
    return e;
  },
  /* 2 -> 3 · Razão declive/vento da composição de Viegas (2004), acrescentada à
     análise topográfica. Campo novo, sem valor por omissão que se possa presumir:
     fica vazio, e enquanto o estiver a aplicação não calcula o desvio da cabeça. */
  e => {
    e.dados = e.dados || {};
    e.dados.topo = Object.assign({orient:"", declive:"", obs:"", eps:""}, e.dados.topo||{});
    return e;
  }
];

/* ================= passagem de turno ================= */
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
  return { meta:{num:"",local:"",pco:"",fase:"",lat:"",lon:"",pasta:"",inicio:"",nivel:"",distrito:"",concelho:"",distritoChave:""},
    avisos:null,
    dados:{area:"", perimNome:"", setores:"", sensiveis:"", anexos:[],
      pt:{des:"", resp:"", ct:"", cd:"", obs:""}, perfil:null,
      topo:{orient:"", declive:"", obs:"", eps:""},
      est:{n:0, setores:[], aer:"", aerL:[], res:{m:"",o:""}, za:{m:"",o:""}, livre:false}},
    pco:{funcoes:[], canais:{cmd:"",tat:"",ba:"",tatba:"",aero:"",opar:"",cmar:"",atrib:[],niveis:null}},
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

