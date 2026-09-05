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
/** Um turno vazio, com uma entrada por célula do posto — a forma que a entrega espera. */
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

/**
 * Sobe um estado gravado até à versão que esta revisão lê, degrau a degrau.
 *
 * Lança quando o estado veio de uma revisão **posterior**, e o erro leva `futuro` com a
 * versão que encontrou: descer de versão exigiria desfazer migrações que não têm inversa,
 * e adivinhar o que fazer com campos que não conhece seria pior do que recusar. Quem
 * apanha o erro diz ao oficial para abrir a ocorrência na revisão mais recente.
 *
 * @param {any} guardado o objeto tal como saiu do armazenamento
 * @returns {any} o mesmo estado, na versão corrente
 */
function migrarGravado(guardado){
  if(!guardado || typeof guardado!=="object") throw new Error("estado gravado ilegível");
  /* Antes de qualquer migração, porque é a migração 0 que faz o `Object.assign` onde a
     chave se torna perigosa. Aqui porque é o sítio por onde passam os três caminhos de
     entrada — ficheiro importado, arquivo do dispositivo e cópia de recuperação — e um
     estado envenenado numa revisão antiga continua no arquivo depois de a porta fechar.
     A contagem devolve-se a quem importou por `lerPacoteDeObjeto`, que corre isto antes;
     aqui a segunda passagem devolve zero e serve só de rede. */
  limparChavesRecusadas(guardado, 0);
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

/* 14 -> 15. A solicitação de rendição de cada unidade.
   A aplicação media o tempo e dizia quando a rendição era devida; o pedido acontecia
   fora dela e não deixava rasto. Cada unidade — de setor e aérea — ganha o ramo, vazio
   no que já existe: não se sabe o que foi pedido antes disto, e inventar seria pior. */
MIGRACOES.push(e => {
  /* E a declaração da fase passa a ser ato com autor e hora, e não um campo que muda em
     silêncio. Vazio no que já existe: a fase que lá está foi escolhida, não declarada. */
  if(e.meta && typeof e.meta === "object"){
    if(typeof e.meta.faseG !== "string") e.meta.faseG = "";
    if(typeof e.meta.fasePor !== "string") e.meta.fasePor = "";
  }
  const vazio = ()=>({ g:"", por:"", nota:"" });
  const por = it => { if(it && typeof it === "object" && (!it.rend || typeof it.rend !== "object")) it.rend = vazio(); };
  const est = (e.dados && e.dados.est) || {};
  (est.setores||[]).forEach(s=>(s.tip||[]).forEach(por));
  (est.aerL||[]).forEach(por);
  return e;
});

/* 15 -> 16 · A geometria do perímetro e a deteção de aglomerados passam a ficar
   gravadas. Até aqui calculava-se a área e deitava-se fora o polígono, e a deteção
   vivia em `window.__sensLista`, que morre ao recarregar: ao voltar à ocorrência não
   havia por onde desenhar nada, e a exportação não levava a forma do incêndio.
   Nascem vazios — uma ocorrência anterior a esta versão não traz a geometria, e
   reconstruí-la a partir dos hectares seria inventar. Quem quiser o croqui volta a
   carregar o ficheiro. */
MIGRACOES.push(e => {
  e.dados = e.dados || {};
  if(!("perim" in e.dados)) e.dados.perim = null;
  if(!("sensDet" in e.dados)) e.dados.sensDet = null;
  return e;
});

/* 16 -> 17 · O teatro de operações ganha coordenadas.
   Os setores existiam sem sítio: sabia-se quem os comandava e o que lá estava, e não
   onde ficavam. Os pontos notáveis — ZCR, ponto de trânsito, zona de apoio, pontos de
   água — viviam em texto corrido, que serve para os ler e não serve para os ver.
   Nascem vazios: uma coordenada que não foi marcada não se adivinha do nome. */
MIGRACOES.push(e => {
  e.dados = e.dados || {};
  if(!Array.isArray(e.dados.pontos)) e.dados.pontos = [];
  const est = e.dados.est || {};
  (est.setores||[]).forEach(s=>{
    if(s && typeof s === "object"){
      if(typeof s.lat !== "string") s.lat = "";
      if(typeof s.lon !== "string") s.lon = "";
    }
  });
  return e;
});

/* 17 -> 18 · Limite traçado do setor. Até aqui o setor tinha um ponto e mais nada, e um
   ponto não diz onde acaba a responsabilidade de quem comanda um nem começa a do outro.
   Campo novo, sem valor que se possa presumir: fica vazio. Um setor sem limite é um setor
   **por delimitar** — não é um setor de área nula, e a aplicação não o desenha. */
MIGRACOES.push(e => {
  const est = e.dados && e.dados.est;
  if(est && Array.isArray(est.setores))
    est.setores.forEach(s=>{ if(s && !Array.isArray(s.limite)) s.limite = []; });
  return e;
});

/* 18 -> 19 · As frentes de fogo do teatro. O estado do setor era uma palavra; a frente é
   uma linha com direção, e é dela que se decide para onde vai o incêndio. Lista nova,
   vazia no que já existe: não se inventa uma frente a partir de um estado de setor. */
MIGRACOES.push(e => {
  e.dados = e.dados || {};
  if(!Array.isArray(e.dados.frentes)) e.dados.frentes = [];
  return e;
});

/* 19 -> 20 · A velocidade de propagação e a carga de combustível, que destrancam a
   intensidade da frente e tudo o que ela decide na manobra. Campos novos, sem valor que se
   possa presumir: ficam vazios. A aplicação não os estima — exigiriam um modelo de
   combustível calibrado para a vegetação do território, e não existe. */
MIGRACOES.push(e => {
  e.dados = e.dados || {};
  e.dados.fogo = Object.assign({r:"", w:""}, e.dados.fogo||{});
  return e;
});

/* 20 -> 21 · As linhas de contenção e de apoio. Lista nova, vazia no que já existe: não se
   deduz uma linha de contenção do texto de um plano antigo. */
MIGRACOES.push(e => {
  e.dados = e.dados || {};
  if(!Array.isArray(e.dados.linhas)) e.dados.linhas = [];
  return e;
});

/* 21 -> 22 · Identificador e posição em cada unidade do dispositivo. O identificador tem de
   ser atribuído aqui e não à primeira vez que faça falta: sem ele, uma unidade só se poderia
   apontar pela posição na lista, e essa muda quando alguém a move de setor — a coordenada
   passava para a unidade errada, em silêncio. A posição fica vazia: não se deduz onde
   estava um meio a partir do setor a que foi atribuído. */
MIGRACOES.push(e => {
  const est = e.dados && e.dados.est;
  if(est && Array.isArray(est.setores)) est.setores.forEach(s=>{
    if(!s || !Array.isArray(s.tip)) return;
    s.tip.forEach((it, k)=>{
      if(!it) return;
      if(!it.id) it.id = "u" + ((it.ts||0) + k).toString(36) + Math.random().toString(36).slice(2, 6);
      if(!("lat" in it)){ it.lat = null; it.lon = null; it.posG = ""; it.posPor = ""; }
    });
  });
  return e;
});

/* 22 -> 23 · As notas escritas no mapa. Lista nova, vazia no que já existe: uma nota é o que
   alguém viu e quis deixar dito, e não se deduz de campo nenhum. */
MIGRACOES.push(e => {
  e.dados = e.dados || {};
  if(!Array.isArray(e.dados.notas)) e.dados.notas = [];
  return e;
});

/* 23 -> 24 · Os focos de calor detetados por satélite. Ramo novo, vazio no que já existe:
   uma lista de focos é uma fotografia de um instante, e não se reconstrói para trás. */
MIGRACOES.push(e => {
  e.dados = e.dados || {};
  e.dados.focos = Object.assign({itens:[], origem:"", g:"", por:"", nota:""}, e.dados.focos||{});
  if(!Array.isArray(e.dados.focos.itens)) e.dados.focos.itens = [];
  return e;
});

/* 24 -> 25 · As entradas da estimativa de propagação. Ramo novo e vazio: o R que estivesse
   escrito continua a ser de quem o escreveu, e uma migração que lhe atribuísse origem
   calculada estaria a inventar proveniência para um número que ninguém calculou. */
MIGRACOES.push(e => {
  e.dados = e.dados || {};
  e.dados.fogo = Object.assign({r:"", w:""}, e.dados.fogo||{});
  if(!e.dados.fogo.est || typeof e.dados.fogo.est !== "object")
    e.dados.fogo.est = { modelo:"", altura:"", dias:"", hcm:"", hcmOrigem:"", u10:"",
      declive:"", tipoPin:"", rEst:"", wMin:"", wMax:"", g:"", por:"", avisos:[] };
  return e;
});

/* 25 -> 26 · Os avisos do IPMA passaram a distinguir o que está em vigor do que ainda não
   começou, e a dizer como foi escolhido o distrito. O que estava gravado tinha só `lista`,
   e essa lista podia trazer avisos futuros misturados com os em vigor — era esse o defeito.
   Não se reclassifica aqui: a triagem precisa das marcas de tempo confrontadas com o
   instante da consulta, e o instante certo é o da próxima consulta, não o da migração.
   Acrescentam-se as prateleiras vazias e marca-se o distrito como presumido, porque a
   revisão que gravou aquilo escolhia-o sempre por proximidade. */
MIGRACOES.push(e => {
  if(e.avisos && typeof e.avisos === "object"){
    if(!Array.isArray(e.avisos.lista)) e.avisos.lista = [];
    if(!Array.isArray(e.avisos.previstos)) e.avisos.previstos = [];
    if(!Array.isArray(e.avisos.margem)) e.avisos.margem = [];
    if(typeof e.avisos.porProximidade !== "boolean") e.avisos.porProximidade = true;
    if(typeof e.avisos.semFuso !== "boolean") e.avisos.semFuso = true;
    e.avisos.lista.forEach(a => { if(!a.est) a.est = "vigor"; });
  }
  return e;
});

/* 26 -> 27 · Dois campos que se escreviam sem estar declarados.
   `dados.relevo` era escrito por `analisarRelevo` e não existia em `novoEstado` nem em
   `tipos/`: passava pelo `[outro: string]: any`, e um nome mal escrito nunca seria
   apanhado. Fica declarado, nulo enquanto não se amostrar; o que já lá estiver com a forma
   certa mantém-se, e o que não a tiver sai — repete-se a amostragem, que é um botão.
   `meta.id` é o identificador interno da ocorrência, distinto do número: o número é
   rótulo, escrito à mão, mudável e às vezes ausente, e era a chave do arquivo — uma
   ocorrência sem número gravava em `sem-num`, com `peaapp:ultima` vazio, e nunca mais se
   repunha. Ao que já existe dá-se um identificador agora; da chave antiga do arquivo
   trata `persistir`, que a lembra e a apaga depois de gravar na nova. */
MIGRACOES.push(e => {
  if(e.meta && typeof e.meta === "object" && !(typeof e.meta.id === "string" && e.meta.id))
    e.meta.id = novoIdOcorrencia();
  if(e.dados && typeof e.dados === "object"){
    const r = e.dados.relevo;
    const boa = !!(r && typeof r === "object" && Number.isFinite(r.e0) && r.grad && typeof r.grad === "object"
      && r.perfis && typeof r.perfis === "object" && Array.isArray(r.dist));
    e.dados.relevo = boa? r : null;
  }
  return e;
});

/* `let O` só depois do último degrau. Estava a meio da escada, com sete degraus antes e
   dezasseis depois: latente, porque `novoEstado` não corre a escada, mas é a classe de
   defeito que o comentário da escada regista ter custado caro — um degrau declarado depois
   de `O` nascer é o convite a pô-lo no sítio errado. Aqui, um degrau abaixo de `O` vê-se. */
/** @type {Estado} */
let O = novoEstado();
let SERIE = [], ANALISE = null;

/**
 * Um identificador novo: um prefixo e doze caracteres ao acaso, de `crypto.getRandomValues`.
 *
 * **Não do relógio.** O ramo #001 mediu na r0093: cinquenta gerações de
 * o identificador da folha a sair do instante em base 36, cinquenta vezes num ciclo, deu um só — e a loja das
 * folhas tem `keyPath:"id"`, pelo que a segunda escrevia por cima da primeira e retirar uma
 * retirava as duas. O instante já vive no GDH, que é onde deve estar; o identificador só
 * tem de ser único. Não `crypto.randomUUID`: exige contexto seguro, e `file://` é onde esta
 * aplicação vive — se conta como origem fidedigna é medição do #005, e isto não depende
 * da resposta. Sem `crypto` — não há navegador do mínimo declarado sem ele — recua para
 * `Math.random`, que chega para não colidir e não chega para mais nada.
 */
function novoIdentificador(prefixo){
  const alf = "0123456789abcdefghijklmnopqrstuvwxyz";
  let bytes;
  try{ bytes = new Uint8Array(12); crypto.getRandomValues(bytes); }
  catch(e){ bytes = Array.from({ length:12 }, ()=>Math.floor(Math.random()*256)); }
  let s = ""; for(const b of bytes) s += alf[b % 36];
  return String(prefixo || "") + s;
}
/**
 * O identificador interno de uma ocorrência nova. Não é o número da ocorrência — esse é o
 * rótulo do SADO, escrito à mão — e não se mostra: é a chave do arquivo, do canal entre
 * abas e das folhas de carta, e não muda quando o número é corrigido ou chega tarde.
 */
function novoIdOcorrencia(){ return novoIdentificador("o"); }

/**
 * O estado de uma ocorrência por começar.
 *
 * É a **referência da forma**: o que aqui não estiver não existe, e a primeira migração
 * usa-o para normalizar o que vem de fora. Cada ramo está na célula a quem a lei atribui
 * a matéria — ver `POSSE`, que é auditado contra isto.
 */
function novoEstado(){
  return { meta:{id:novoIdOcorrencia(),num:"",local:"",pco:"",fase:"",faseG:"",fasePor:"",lat:"",lon:"",coordFonte:"",pasta:"",inicio:"",nivel:"",subregiao:"",distrito:"",concelho:"",distritoChave:""},
    avisos:null,
    dados:{area:"", perimNome:"", perim:null, sensDet:null, pontos:[], frentes:[], linhas:[], notas:[], focos:{itens:[], origem:"", g:"", por:"", nota:""}, fogo:{r:"", w:"", est:{modelo:"", altura:"", dias:"", hcm:"", hcmOrigem:"", u10:"", declive:"", tipoPin:"", rEst:"", wMin:"", wMax:"", g:"", por:"", avisos:[]}}, setores:"", sensiveis:"", anexos:[],
      perfil:null,
      topo:{orient:"", declive:"", obs:"", eps:""},
      /* O relevo amostrado à volta do ponto; nulo até se carregar no botão da análise do relevo. */
      relevo:null,
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
 * sítios foram convertidos para `data-` e `addEventListener`. **Esta linha dizia «nenhum
 * resta» e estava errada:** restavam seis controlos com `onclick` embutido, em quatro
 * listas repintadas. Nenhum deles interpolava texto de campo — levavam índices e números
 * que a aplicação gera —, pelo que a afirmação sobre o XSS mantinha-se de pé; a
 * afirmação sobre a forma é que não. Saíram todos, e são hoje `<button>` ligados por
 * delegação em `ligarListasRepintadas`.
 */
const ESCAPES = {"<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;", "'":"&#39;"};
const esc = s => String(s??"").replace(/[<>&"']/g, c=>ESCAPES[c]);
const MES = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
/** O GDH doutrinário do instante corrente: DDHHMM, mês em três letras, ano em duas. */
function gdhAgora(){ const d=new Date(agora());
  return String(d.getDate()).padStart(2,"0")+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+MES[d.getMonth()]+String(d.getFullYear()).slice(2); }
/** O mesmo, para um instante qualquer. Toda a hora escrita passa por aqui. */
function gdhDe(ts){ const d=new Date(ts);
  return String(d.getDate()).padStart(2,"0")+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+MES[d.getMonth()]+String(d.getFullYear()).slice(2); }

