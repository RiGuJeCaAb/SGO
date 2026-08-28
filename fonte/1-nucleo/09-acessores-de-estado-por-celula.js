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
  O.logistica = L;
  return O.logistica;
}
function reservaObj(){ return logisticaObj().reserva; }
function zaObj(){ return logisticaObj().zonaApoio; }
