/* ================= NÚCLEO · o estado da gravação, e uma aba a escrever de cada vez =================
   Duas faltas que as auditorias de 4 de setembro apontaram e que se confirmaram na fonte.

   A primeira: `persistir` nunca lançava e 70 das 81 chamadas não esperavam por ela, com
   `nota` a `false` em quase todas. Uma gravação falhada era, para quem estava ao teclado,
   **indistinguível de uma gravação boa** — o ecrã continuava a pintar e nada dizia que o
   que se via não estava em lado nenhum. A resposta não é ir às 70 chamadas: é o estado
   da gravação ser uma coisa só, global, pintada no cabeçalho, alimentada por `persistir`
   seja quem for que a chame.

   A segunda: duas abas na mesma ocorrência escreviam a mesma chave, e a última a fechar
   ganhava, em silêncio. Sondado a 5 de setembro num Chromium a partir de `file://`: as
   abas partilham a origem, o `BroadcastChannel` atravessa, o `navigator.locks` funciona,
   `ifAvailable` responde «ocupado», o `steal` funciona e quem perde o trinco recebe
   `AbortError`. É com isso que se faz: **uma aba escreve, as outras leem**, e qualquer
   uma pode assumir a escrita — a que a perde fica a saber.

   O trinco é **por aplicação e não por ocorrência**. Parecia natural trancar
   `peaapp:occ:<n>`, mas `peaapp:index` e `peaapp:ultima` são de todas as ocorrências, e
   duas escritoras em ocorrências diferentes pisavam-se lá na mesma. */

/** O nome do trinco. Uma só aba o segura de cada vez. */
const TRINCO_ESCRITA = "peaapp:escrita";

/**
 * O estado da última gravação, que o cabeçalho pinta.
 *
 * `estado` é `nada` antes de haver o que gravar, `a-gravar` enquanto há escritas em curso,
 * `gravado` quando a última acabou bem, `falhou` quando não, e `leitura` quando esta aba
 * não escreve. `emCurso` conta as escritas a decorrer — várias chamadas seguidas a
 * `persistir` sobrepõem-se, e o indicador só volta a «gravado» quando a última acabar.
 */
const GRAVACAO = { estado:"nada", g:"", erro:"", emCurso:0 };

/** Se esta aba está em leitura, e porquê. */
const LEITURA = { ativa:false, motivo:"" };

/** O canal entre abas, ou nada onde não exista. Só serve para avisar; nunca para decidir. */
const CANAL_ABAS = (()=>{ try{ return new BroadcastChannel("peaapp:abas"); }catch(e){ return null; } })();

/** Esta aba está a ler e não a escrever? */
function emLeitura(){ return LEITURA.ativa; }

/**
 * Regista o resultado de uma gravação e repinta o indicador.
 *
 * Recebe o que `persistir` devolve. Um `ok` limpa o erro anterior; um `ok:false` guarda o
 * motivo, porque «não gravado» sem razão manda quem lê procurar às cegas.
 */
function registarGravacao(r){
  if(GRAVACAO.emCurso > 0) GRAVACAO.emCurso--;
  if(emLeitura()){ GRAVACAO.estado = "leitura"; }
  else if(r && r.ok){ GRAVACAO.estado = GRAVACAO.emCurso? "a-gravar" : "gravado"; GRAVACAO.g = gdhAgora(); GRAVACAO.erro = ""; }
  else { GRAVACAO.estado = "falhou"; GRAVACAO.erro = String((r && r.erro) || "motivo desconhecido").slice(0,120); }
  pintarGravacao();
}

/** Marca o início de uma gravação: o indicador passa a «a gravar» até ela acabar. */
function iniciarGravacao(){
  GRAVACAO.emCurso++;
  if(!emLeitura()) GRAVACAO.estado = "a-gravar";
  pintarGravacao();
}

/**
 * Pinta o indicador do cabeçalho.
 *
 * Permanente e não uma caixa de aviso, pela mesma razão do carimbo do navegador: o estado
 * da gravação é uma condição contínua, e uma caixa que se fecha esconde o que continua a
 * ser verdade. A hora vai com o «gravado» porque «gravado» sem hora não distingue há um
 * segundo de há uma hora — e num PCO essa diferença é o que interessa.
 */
function pintarGravacao(){
  const el = $("grav"); if(!el) return;
  const E = GRAVACAO;
  const hora = E.g? E.g.slice(2,6).replace(/(\d\d)(\d\d)/, "$1:$2") : "";
  const R = {
    "nada":     ["", "Sem gravação ainda", "Ainda não houve nada para gravar nesta sessão."],
    "a-gravar": ["ag", "A gravar", "Há uma gravação em curso."],
    "gravado":  ["ok", "Gravado " + hora, "Última gravação bem-sucedida às " + hora + "."],
    "falhou":   ["falhou", "NÃO GRAVADO", "A última gravação falhou: " + E.erro + ". O que está no ecrã pode não estar em lado nenhum."],
    "leitura":  ["leitura", "Só leitura", LEITURA.motivo],
  }[E.estado] || ["", E.estado, ""];
  el.className = "grav " + R[0];
  el.textContent = R[1];
  el.title = R[2];
  el.setAttribute("aria-label", "Estado da gravação: " + R[2]);
}

/**
 * Põe esta aba em leitura.
 *
 * Não inventa outro mecanismo: os campos ficam inertes por `aplicarFechoDeEscrita`, que é o
 * que o encerramento já usa, e que passa a olhar também para aqui. A faixa do topo diz o
 * motivo e oferece o botão para assumir a escrita.
 */
function entrarEmLeitura(motivo){
  LEITURA.ativa = true; LEITURA.motivo = String(motivo || "Outra aba está a escrever.");
  GRAVACAO.estado = "leitura";
  document.documentElement.classList.add("leitura");
  const f = $("leitura-faixa");
  if(f){
    const t = $("leitura-txt"); if(t) t.textContent = LEITURA.motivo + " Esta aba mostra e não grava: o que aqui se escrever perde-se.";
    f.style.display = "block";
  }
  try{ aplicarFechoDeEscrita(); }catch(e){}
  pintarGravacao();
}

/** Devolve esta aba à escrita, depois de o trinco ser dela. */
function sairDeLeitura(){
  LEITURA.ativa = false; LEITURA.motivo = "";
  GRAVACAO.estado = GRAVACAO.g? "gravado" : "nada";
  document.documentElement.classList.remove("leitura");
  const f = $("leitura-faixa"); if(f) f.style.display = "none";
  try{ aplicarFechoDeEscrita(); }catch(e){}
  pintarGravacao();
}

/** O que acontece quando outra aba rouba o trinco a esta. */
function perderEscrita(){
  entrarEmLeitura("Outra aba assumiu a escrita desta aplicação.");
  fita("Esta aba passou a leitura: outra aba assumiu a escrita");
}

/**
 * Pede o trinco de escrita ao arrancar.
 *
 * Devolve `obtido`, `ocupado` ou `sem-trincos`. Com `ifAvailable` a resposta é imediata
 * — nunca se fica à espera de uma aba que pode não fechar. Quem o obtém segura-o numa
 * promessa que nunca resolve, isto é, até a aba fechar; se outra o roubar, o pedido
 * rejeita com `AbortError` e esta aba passa a leitura.
 *
 * Sem `navigator.locks` — o jsdom dos testes, um navegador abaixo do mínimo — assume-se a
 * escrita, que é o comportamento de sempre. O mínimo do navegador já está declarado
 * noutro sítio e não se repete aqui.
 */
async function pedirTrincoDeEscrita(){
  if(!(navigator.locks && navigator.locks.request)) return "sem-trincos";
  return new Promise(res=>{
    navigator.locks.request(TRINCO_ESCRITA, { ifAvailable:true }, lock=>{
      if(!lock){ res("ocupado"); return; }
      res("obtido");
      return new Promise(()=>{});
    }).catch(e=>{ if(e && e.name === "AbortError") perderEscrita(); });
  });
}

/**
 * Assume a escrita, roubando o trinco à aba que o tem.
 *
 * `steal` liberta o trinco da outra aba, que recebe `AbortError` e passa a leitura por
 * `perderEscrita`. É deliberado que não haja confirmação: quem carrega no botão está a
 * dizer que é esta a aba que manda, e a outra fica a saber pela faixa.
 */
async function assumirEscrita(){
  if(!(navigator.locks && navigator.locks.request)){ sairDeLeitura(); return "sem-trincos"; }
  return new Promise(res=>{
    navigator.locks.request(TRINCO_ESCRITA, { steal:true }, lock=>{
      if(!lock){ res("recusado"); return; }
      sairDeLeitura();
      fita("Esta aba assumiu a escrita");
      res("obtido");
      return new Promise(()=>{});
    }).catch(e=>{ if(e && e.name === "AbortError") perderEscrita(); else res("recusado"); });
  });
}

/** Diz às outras abas que esta gravou, para a que está a ler se atualizar. */
function avisarOutrasAbas(num){
  try{ if(CANAL_ABAS) CANAL_ABAS.postMessage({ tipo:"gravado", num:String(num||"") }); }catch(e){}
}

/**
 * O que uma aba em leitura faz quando a outra grava: repõe do arquivo e repinta.
 *
 * Só a aba em leitura reage — a que escreve é a fonte, e repor-se a si própria a partir
 * do que acabou de gravar seria um ciclo. E só se for a mesma ocorrência: a outra aba pode
 * estar noutra, e essa não é para aqui.
 */
async function receberDeOutraAba(m){
  if(!m || m.tipo !== "gravado" || !emLeitura()) return false;
  const minha = String(O.meta.num || "");
  if(minha && m.num && m.num !== minha) return false;
  try{ await carregar(m.num || null); }catch(e){}
  try{ aplicarFechoDeEscrita(); }catch(e){}
  return true;
}

/**
 * Arranque: pede o trinco, e liga o canal e o botão.
 *
 * Corre depois de o armazém estar pronto e antes da primeira pintura, para a aba nascer já
 * no estado certo em vez de piscar de escrita para leitura.
 */
async function arrancarEscritaPorUmaAba(){
  if(CANAL_ABAS) CANAL_ABAS.onmessage = ev=>{ receberDeOutraAba(ev.data); };
  const b = $("leitura-assumir");
  if(b) b.addEventListener("click", ()=>{ b.disabled = true; assumirEscrita().finally(()=>{ b.disabled = false; }); });
  const r = await pedirTrincoDeEscrita();
  if(r === "ocupado") entrarEmLeitura("Outra aba desta aplicação já está a escrever.");
  pintarGravacao();
  return r;
}
