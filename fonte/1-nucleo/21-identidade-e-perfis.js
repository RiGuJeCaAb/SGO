/* ================= NÚCLEO · identidade de quem regista, e perfis =================
   **Isto não é autenticação, e não se chama assim em lado nenhum.**

   Sem serviço, qualquer palavra-passe verificada dentro deste ficheiro é teatro: o
   segredo teria de viajar com a aplicação, e quem a abre lê-o. O que se pode fazer sem
   servidor — e que vale por si — é **atribuir** o registo: quem está ao teclado declara-se
   no início do turno, e cada ato de comando fica com esse nome, em vez de ficar anónimo.

   A diferença entre um registo anónimo e um registo atribuído é grande; a diferença entre
   um registo atribuído e um registo autenticado também. A aplicação diz as duas coisas,
   nas palavras certas, e não deixa ninguém pensar que tem a segunda quando tem a primeira.

   Os perfis são a outra metade: nem toda a gente que passa pelo PCO deve poder aprovar um
   PEA ou encerrar o registo. O perfil escolhe-se — não se prova — e por isso **previne o
   engano, não impede o abuso**. Está escrito no ecrã com essas palavras.

   Quando o serviço da VCOC existir, é aqui que ele entra: a sessão passa a vir dele, com
   conta, palavra-passe e segundo fator, e este ramo passa a ser o seu reflexo local.
   Ver `docs/interop/` — contrato do serviço. */

const SESSAO_CHAVE = "peaapp:sessao";

/**
 * Os perfis, com o que cada um pode fazer.
 *
 * A tabela é declarativa de propósito: uma capacidade nova acrescenta-se aqui e vale em
 * todos os sítios que a consultem, em vez de nascer espalhada por `if`s.
 */
const PERFIS = [
  { k:"observador",  n:"Observador",              pode:[] },
  { k:"operador",    n:"Operador de registo",     pode:["escrever"] },
  { k:"planeamento", n:"Célula de planeamento",   pode:["escrever","elaborar"] },
  { k:"operacoes",   n:"Célula de operações",     pode:["escrever"] },
  { k:"logistica",   n:"Célula de logística",     pode:["escrever"] },
  { k:"cos",         n:"COS ou adjunto de comando", pode:["escrever","elaborar","aprovar","encerrar"] },
  { k:"admin",       n:"Administração",           pode:["escrever","elaborar","aprovar","encerrar","configurar"] },
];
const PERFIL_DEF = "operador";

/** @type {{nome:string, posto:string, perfil:string, desde:string, id:string}} */
let SESSAO = { nome:"", posto:"", perfil:"", desde:"", id:"" };

/** Uma sessão sem ninguém ao teclado. */
function novaSessao(){ return { nome:"", posto:"", perfil:"", desde:"", id:"" }; }
/** O perfil com esta chave, ou o de omissão. Nunca devolve nada: sem perfil não há guarda. */
function perfilDe(k){ return PERFIS.find(p=>p.k === k) || PERFIS.find(p=>p.k === PERFIL_DEF); }

/** Há alguém declarado ao teclado? */
function haSessao(){ return !!String(SESSAO.nome||"").trim(); }

/**
 * O nome a atribuir a um ato, na forma como se escreve num processo.
 *
 * @returns {string} «Cmdt Silva» ou «posto Nome», vazio se não houver ninguém declarado
 */
function quemRegista(){
  const posto = String(SESSAO.posto||"").trim(), nome = String(SESSAO.nome||"").trim();
  return nome? (posto? posto+" "+nome : nome) : "";
}

/**
 * Pode quem está ao teclado fazer isto?
 *
 * Sem ninguém declarado, **pode tudo**: a aplicação não se transforma num obstáculo por
 * causa de um campo por preencher, e um PCO a meio de uma ocorrência não pára para se
 * apresentar. O que a aplicação faz nesse caso é pedir a identidade no momento do ato.
 */
function podeFazer(cap){
  if(!haSessao()) return true;
  return perfilDe(SESSAO.perfil).pode.indexOf(cap) >= 0;
}

/** A recusa, com a razão e sem fingir que é mais do que é. */
function motivoPerfil(cap){
  const p = perfilDe(SESSAO.perfil);
  return "O perfil declarado — " + p.n + " — não inclui esta ação. "
    + "Quem estiver ao teclado com competência para a praticar declara-se em «Quem regista», "
    + "na célula de Comando.";
}

/**
 * Repõe quem estava ao teclado neste dispositivo.
 *
 * Um perfil que já não exista cai no de omissão — o mais restrito. Herdar um perfil
 * desconhecido como se fosse amplo seria dar acesso por engano.
 */
async function carregarSessao(){
  try{ const r = await ARMAZEM.get(SESSAO_CHAVE); SESSAO = Object.assign(novaSessao(), JSON.parse(r.value)||{}); }
  catch(e){ SESSAO = novaSessao(); }
  if(!perfilDe(SESSAO.perfil) || !SESSAO.perfil) SESSAO.perfil = PERFIL_DEF;
  return SESSAO;
}
/** Guarda quem está ao teclado. É definição do posto, e não da ocorrência. */
async function gravarSessao(){
  try{ await ARMAZEM.set(SESSAO_CHAVE, JSON.stringify(SESSAO)); return true; }
  catch(e){ return false; }
}

/** Assume o teclado: fica declarado quem regista a partir de agora. */
async function assumirTeclado(nome, posto, perfil){
  const n = String(nome||"").trim();
  if(!n) return { ok:false, motivo:"Indica o nome de quem regista." };
  SESSAO = { nome:n, posto:String(posto||"").trim(), perfil: perfilDe(perfil).k,
    desde: gdhAgora(), id: SESSAO.id || ("s"+Date.now().toString(36)) };
  await gravarSessao();
  fita("Ao teclado: "+quemRegista()+" ("+perfilDe(SESSAO.perfil).n+")");
  return { ok:true };
}

/** Larga o teclado. O registo volta a ser anónimo, e a aplicação di-lo. */
async function largarTeclado(){
  if(haSessao()) fita("Deixou o teclado: "+quemRegista());
  SESSAO = novaSessao();
  await gravarSessao();
}
