/* ================= NÚCLEO · acessores de estado por célula ================= */

/**
 * Garante num objeto do estado os campos que o molde declara, **sem o trocar**.
 *
 * Os acessores faziam `O.ramo = Object.assign({...padrão}, O.ramo)`, o que devolvia um
 * objeto novo a cada chamada e deixava órfã qualquer referência guardada antes. Escrever
 * numa referência assim não dá erro nenhum: escreve-se, e o estado fica na mesma. Foi
 * assim que o carimbo do encerramento se perdeu — calculado sobre uma referência que
 * `pintarEncerramento` tinha entretanto destacado, ao chamar o acessor outra vez.
 *
 * É a mesma família do ponto de trânsito perdido na r0039: alguma coisa mudou de sítio e
 * ficou um ponteiro para o sítio antigo. Aqui o ponteiro nem sequer era de ninguém em
 * particular — era de toda a gente que tivesse chamado o acessor antes.
 *
 * A semântica de preenchimento é a de antes: o que já lá está vence o padrão, mesmo com
 * o tipo trocado; só se acrescenta o que falta.
 *
 * @template {object} T
 * @param {T} alvo objeto do estado, mutado no lugar
 * @param {object} molde campos e valores por omissão
 * @returns {T} o próprio `alvo`
 */
function preencher(alvo, molde){
  Object.keys(molde).forEach(k=>{
    const v = molde[k];
    const objeto = v && typeof v === "object" && !Array.isArray(v);
    if(!(k in alvo)){
      alvo[k] = Array.isArray(v)? v.slice() : (objeto? preencher({}, v) : v);
    } else if(objeto){
      if(!alvo[k] || typeof alvo[k] !== "object") alvo[k] = preencher({}, v);
      else preencher(alvo[k], v);
    }
  });
  return alvo;
}

/** O ponto de trânsito, na ZCR — art. 32.º, n.º 1, al. b). */
function ptObj(){ return logisticaObj().pontoTransito; }
/** @returns {Dispositivo} */
function estObj(){
  /* o molde a seguir enche-o já; a conversão é a promessa de que a linha seguinte corre */
  if(!O.dados.est || typeof O.dados.est !== "object") O.dados.est = /** @type {Dispositivo} */ ({});
  const E = preencher(O.dados.est, {n:0,setores:[],aer:"",aerL:[],livre:false});
  if(!Array.isArray(E.setores)) E.setores=[];
  if(!Array.isArray(E.aerL)) E.aerL=[];
  return E;
}
/* Célula de logística e finanças — arts. 31.º a 35.º. Ramo próprio desde a versão 5
   do estado: a reserva e a zona de apoio são áreas da zona de concentração e reserva
   (art. 32.º, n.º 1, al. b); DL n.º 90-A/2022, art. 13.º, al. c)) e não pertencem ao
   dispositivo que a célula de operações setoriza. */
function logisticaObj(){
  if(!O.logistica || typeof O.logistica !== "object") O.logistica = /** @type {Logistica} */ ({});
  return /** @type {Logistica} */ (preencher(O.logistica, {
    reserva:{m:"",o:""},
    zonaApoio:{m:"",o:""},
    pontoTransito:{des:"",resp:"",ct:"",cd:"",obs:""},
    comunicacoes:{cmd:"",tat:"",ba:"",tatba:"",aero:"",opar:"",cmar:"",atrib:[],niveis:null},
  }));
}
/* Plano de comunicações — art. 32.º, n.º 1, al. d), e art. 34.º. Ramo da logística
   desde a versão 6 do estado. Este é o acessor único: nenhum sítio deve alcançar o
   ramo pelo caminho, porque foi assim que o ponto de trânsito se perdeu quando mudou
   de dono e cinco campos do formulário ficaram para trás. */
function canaisObj(){
  const C = logisticaObj();
  if(!Array.isArray(C.comunicacoes.atrib)) C.comunicacoes.atrib = [];
  return C.comunicacoes;
}
/* Encerramento do registo da ocorrência — acessor único, como os outros. */
function encObj(){
  if(!O.encerramento || typeof O.encerramento !== "object") O.encerramento = /** @type {Estado["encerramento"]} */ ({});
  return preencher(O.encerramento, {g:"",por:"",nota:"",sha:""});
}
/** A ocorrência está encerrada quando tem GDH de encerramento, e só então. */
function encerrada(){ return !!encObj().g; }
/** A reserva tática — art. 32.º, n.º 1, al. b), e art. 33.º. */
function reservaObj(){ return logisticaObj().reserva; }
/** A zona de apoio. Também é área da ZCR, e não dispositivo de Operações. */
function zaObj(){ return logisticaObj().zonaApoio; }
