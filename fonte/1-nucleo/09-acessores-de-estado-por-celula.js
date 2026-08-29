/* ================= NÚCLEO · acessores de estado por célula ================= */
function ptObj(){ return logisticaObj().pontoTransito; }
/** @returns {Dispositivo} */
function estObj(){
  O.dados.est = Object.assign({n:0,setores:[],aer:"",aerL:[],livre:false}, O.dados.est||{});
  if(!Array.isArray(O.dados.est.setores)) O.dados.est.setores=[];
  if(!Array.isArray(O.dados.est.aerL)) O.dados.est.aerL=[];
  return O.dados.est;
}
/* Célula de logística e finanças — arts. 31.º a 35.º. Ramo próprio desde a versão 5
   do estado: a reserva e a zona de apoio são áreas da zona de concentração e reserva
   (art. 32.º, n.º 1, al. b); DL n.º 90-A/2022, art. 13.º, al. c)) e não pertencem ao
   dispositivo que a célula de operações setoriza. */
function logisticaObj(){
  const L = /** @type {Logistica} */ (Object.assign({}, O.logistica||{}));
  L.reserva = Object.assign({m:"",o:""}, L.reserva||{});
  L.zonaApoio = Object.assign({m:"",o:""}, L.zonaApoio||{});
  L.pontoTransito = Object.assign({des:"",resp:"",ct:"",cd:"",obs:""}, L.pontoTransito||{});
  L.comunicacoes = Object.assign({cmd:"",tat:"",ba:"",tatba:"",aero:"",opar:"",cmar:"",atrib:[],niveis:null}, L.comunicacoes||{});
  O.logistica = L;
  return O.logistica;
}
/* Plano de comunicações — art. 32.º, n.º 1, al. d), e art. 34.º. Ramo da logística
   desde a versão 6 do estado. Este é o acessor único: nenhum sítio deve alcançar o
   ramo pelo caminho, porque foi assim que o ponto de trânsito se perdeu quando mudou
   de dono e cinco campos do formulário ficaram para trás. */
function canaisObj(){
  const C = logisticaObj();
  C.comunicacoes = Object.assign({cmd:"",tat:"",ba:"",tatba:"",aero:"",opar:"",cmar:"",atrib:[],niveis:null}, C.comunicacoes||{});
  if(!Array.isArray(C.comunicacoes.atrib)) C.comunicacoes.atrib = [];
  return C.comunicacoes;
}
/* Encerramento do registo da ocorrência — acessor único, como os outros. */
function encObj(){
  O.encerramento = Object.assign({g:"",por:"",nota:""}, O.encerramento||{});
  return O.encerramento;
}
/** A ocorrência está encerrada quando tem GDH de encerramento, e só então. */
function encerrada(){ return !!encObj().g; }
function reservaObj(){ return logisticaObj().reserva; }
function zaObj(){ return logisticaObj().zonaApoio; }
