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
/* 10 -> 11. Dois campos que faltavam para se saber de onde vêm as coisas.
   `meta.coordFonte` guarda **como** a coordenada foi parar ali — escrita à mão, achada
   pela geocodificação, ou trazida da Gestão PCO. Estava na fita do tempo e mais lado
   nenhum, e a fita não acompanha o campo quando o pacote muda de posto.
   `encerramento.sha` é o carimbo de integridade do registo no momento em que fechou.
   Nenhum dos dois se pode inventar para trás: ficam vazios no que já existe, que é a
   resposta honesta — não se sabe. */
MIGRACOES.push(e => {
  if(e.meta && typeof e.meta === "object" && typeof e.meta.coordFonte !== "string"){
    e.meta.coordFonte = "";
  }
  if(e.encerramento && typeof e.encerramento === "object" && typeof e.encerramento.sha !== "string"){
    e.encerramento.sha = "";
  }
  return e;   /* a escada é `e = MIGRACOES[v](e)`: um degrau que não devolve parte-a */
});

/* 11 -> 12. Os três estados de uma proposta de PEA.
   O que já está emitido foi-o num modelo em que emitir valia por aprovar: as ordens de
   missão nasciam no mesmo instante. Marcá-los «proposta» seria reescrever a história —
   deixaria de haver PEA em vigor em ocorrências que o têm, e as regras de conformidade
   mudariam de veredicto sobre factos passados. Ficam **aprovados**, com o GDH da emissão
   e a nota de que a aprovação não foi registada à parte, que é a verdade. */
MIGRACOES.push(e => {
  (e.peas||[]).forEach(p=>{
    if(!p || typeof p !== "object") return;
    if(typeof p.estado !== "string" || !p.estado){
      p.estado = "aprovado";
      p.analise = { g:"" };
      p.aprovacao = { g:p.g||"", por:"", funcao:"",
        nota:"registo anterior ao modelo de aprovação: a emissão valia por aprovação" };
    }
    if(!p.analise || typeof p.analise !== "object") p.analise = { g:"" };
    if(!p.aprovacao || typeof p.aprovacao !== "object") p.aprovacao = { g:"", por:"", funcao:"", nota:"" };
  });
  return e;
});

/* 12 -> 13. A proveniência de uma ocorrência importada.
   Uma ocorrência que entrou por ficheiro com o carimbo a não conferir não pode ficar
   indistinguível de uma que nasceu aqui — e o aviso do ecrã desaparece ao fim de cinco
   segundos e meio. O que fica não desaparece. Vazio, em tudo o que já existe: não se
   sabe de onde veio, e inventar seria pior. */
MIGRACOES.push(e => {
  if(!e.integridade || typeof e.integridade !== "object"){
    e.integridade = { estado:"", g:"", sha:"", app:"", ficheiro:"" };
  }
  ["estado","g","sha","app","ficheiro"].forEach(k=>{
    if(typeof e.integridade[k] !== "string") e.integridade[k] = "";
  });
  return e;
});

/* 13 -> 14. A proveniência da previsão meteorológica.
   O CSV já sobrevivia ao fecho da página, dentro de `csv`. O que se perdia era tudo o
   resto: de que fonte veio, a que horas, para que ponto, e se alguém lhe mexeu depois de
   chegar. Sem isso, uma previsão de ontem lê-se igual a uma de há dez minutos — e num TO
   isso não é detalhe. */
MIGRACOES.push(e => {
  if(!e.meteo || typeof e.meteo !== "object"){
    e.meteo = { fonte:"", modelo:"", g:"", ts:0, lat:"", lon:"", horas:0, sha:"", mexido:false };
  }
  ["fonte","modelo","g","lat","lon","sha"].forEach(k=>{ if(typeof e.meteo[k] !== "string") e.meteo[k] = ""; });
  if(typeof e.meteo.ts !== "number") e.meteo.ts = 0;
  if(typeof e.meteo.horas !== "number") e.meteo.horas = 0;
  e.meteo.mexido = !!e.meteo.mexido;
  return e;
});

function novoEstado(){
  return { meta:{num:"",local:"",pco:"",fase:"",lat:"",lon:"",coordFonte:"",pasta:"",inicio:"",nivel:"",subregiao:"",distrito:"",concelho:"",distritoChave:""},
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
    encerramento:{ g:"", por:"", nota:"", sha:"" },
    /* De onde veio este estado, quando veio de fora. Vazio significa que nasceu aqui. */
    integridade:{ estado:"", g:"", sha:"", app:"", ficheiro:"" },
    /* A última previsão obtida, com a sua proveniência. O CSV vive em `csv`; aqui fica
       de onde veio, quando, para que ponto e se foi mexido à mão depois de chegar. */
    meteo:{ fonte:"", modelo:"", g:"", ts:0, lat:"", lon:"", horas:0, sha:"", mexido:false },
    /* Obrigações dadas por cumpridas: id da regra -> {g, por, nota}. Só as que são ato
       externo, que a aplicação não consegue observar. Ver CUMPRIVEIS. */
    cumprimentos:{},
    evolucao:[], csv:"", peas:[], fita:[], turno:novoTurno(), versao:VERSAO_ESTADO };
}
/* O acessor devolve qualquer elemento; a verificação de tipos incide sobre o estado,
   não sobre o DOM. Ver tipos/estacao.d.ts. */
/** @type {(id:string)=>any} */
const $ = id => document.getElementById(id);
/**
 * Escape de HTML, para texto **e para atributos**.
 *
 * Até à r0061 escapava `<`, `>` e `&` e deixava passar as aspas. Isso chega a texto entre
 * etiquetas e não chega a nada dentro de um atributo, que é onde a aplicação também o
 * usa: `value="${esc(x.cmd)}"`. Uma aspa no nome de um comandante de setor — escrita à
 * mão ou vinda de um ficheiro importado — fechava o atributo e abria outro. Comprovado:
 * `x" onfocus="..." autofocus zz="` num campo de comandante produzia um `<input>` com os
 * atributos `onfocus` e `autofocus` a sério.
 *
 * Escapar as duas aspas fecha essa porta em todos os sítios de uma vez. **Não dispensa**
 * tirar os dados de dentro do HTML concatenado, que é o trabalho de fundo — e não chega
 * sozinho onde o dado cai dentro de uma *string de JavaScript* num atributo `onclick`,
 * porque aí o navegador desfaz a entidade antes de o JavaScript ver o texto. Esses
 * sítios foram convertidos para `data-` e `addEventListener`; nenhum resta.
 */
const ESCAPES = {"<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;", "'":"&#39;"};
const esc = s => String(s??"").replace(/[<>&"']/g, c=>ESCAPES[c]);
const MES = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
function gdhAgora(){ const d=new Date(agora());
  return String(d.getDate()).padStart(2,"0")+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+MES[d.getMonth()]+String(d.getFullYear()).slice(2); }
function gdhDe(ts){ const d=new Date(ts);
  return String(d.getDate()).padStart(2,"0")+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+MES[d.getMonth()]+String(d.getFullYear()).slice(2); }

