/* ================= NÚCLEO · catálogo de elementos =================
   As pessoas que passam pelo teatro de operações repetem-se de ocorrência para
   ocorrência: o mesmo comandante, o mesmo adjunto, o mesmo responsável de núcleo. O
   catálogo guarda quem são, para não se voltar a escrever à mão o que já se escreveu.

   **Vive fora da ocorrência.** É um registo do dispositivo humano da sub-região, não
   um ramo do estado — não entra no PEA, não entra na exportação da ocorrência, não tem
   dono no registo de posse por célula, e sobrevive ao encerramento. Guarda-se em chave
   própria do ARMAZEM.

   **Não guarda canal.** O canal de cada função atribui-se no plano de comunicações, a
   partir dos canais que o CSREPC atribui ao TO — DON n.º 2, ponto 10 —, e muda de
   ocorrência para ocorrência. Guardá-lo aqui criaria uma segunda verdade para uma coisa
   que a doutrina manda ter fonte única, que é a mesma razão por que a v1.2 da ligação à
   Gestão PCO deixou as comunicações de fora. */

const ELEM_CHAVE = "peaapp:elementos";
/** @type {{id:string,nome:string,entidade:string,ct:string,funcao:string,nota:string,g:string}[]} */
let ELEMENTOS = [];
/* Identificador do registo em correção. Vazio, guardar cria ou funde pelo nome;
   preenchido, guardar substitui aquele registo — e só assim se pode corrigir o nome. */
let EL_EDICAO = "";
/** Larga a edição em curso e devolve o formulário ao modo de acrescentar. */
function sairDaEdicaoElemento(){
  EL_EDICAO = "";
  const g = $("el-add"); if(g) g.textContent = "Guardar no catálogo";
  const cx = $("el-cancelar"); if(cx) cx.style.display = "none";
}

/** Um elemento por preencher — a forma que o catálogo do posto guarda. */
function novoElemento(){ return { id:"", nome:"", entidade:"", ct:"", funcao:"", nota:"", g:"" }; }

/** Chave de identidade: nome e entidade. Duas pessoas com o mesmo nome em corpos
    diferentes são duas pessoas; a mesma pessoa registada duas vezes é um erro. */
function chaveElemento(x){
  return (String(x.nome||"").trim()+"|"+String(x.entidade||"").trim()).toLowerCase();
}

/**
 * Lê o catálogo de elementos deste dispositivo.
 *
 * Normaliza contra a forma corrente e deita fora o que não tem nome: um elemento sem nome
 * não serve para nomear ninguém, e ficaria a ocupar a lista.
 */
async function carregarElementos(){
  try{ const r = await ARMAZEM.get(ELEM_CHAVE); ELEMENTOS = JSON.parse(r.value) || []; }
  catch(e){ ELEMENTOS = []; }
  if(!Array.isArray(ELEMENTOS)) ELEMENTOS = [];
  ELEMENTOS = ELEMENTOS.map(x=>Object.assign(novoElemento(), x)).filter(x=>x.nome);
  return ELEMENTOS;
}
/** Grava o catálogo. Devolve se conseguiu — quem chama decide o que dizer ao operador. */
async function gravarElementos(){
  try{ await ARMAZEM.set(ELEM_CHAVE, JSON.stringify(ELEMENTOS)); return true; }
  catch(e){ return false; }
}

/**
 * Guarda um elemento, ou atualiza o que já existe com o mesmo nome e entidade.
 * Campo vazio não sobrepõe o que está: vale a mesma regra da fusão de funções do PCO —
 * vazio é ausência, não informação.
 *
 * @returns {Promise<{ok:boolean, novo:boolean, motivo?:string}>}
 */
async function guardarElemento(dados){
  const x = Object.assign(novoElemento(), dados||{});
  x.nome = String(x.nome||"").trim();
  x.entidade = String(x.entidade||"").trim();
  if(!x.nome) return { ok:false, novo:false, motivo:"O elemento precisa de nome." };

  /* A correção manda sobre a fusão por nome: quando se está a corrigir um registo
     conhecido, é esse que se substitui, mesmo que o nome mude. */
  const i = (dados && dados.id)
    ? ELEMENTOS.findIndex(y=>y.id === dados.id)
    : ELEMENTOS.findIndex(y=>chaveElemento(y) === chaveElemento(x));
  if(i < 0){
    x.id = "e"+agora().toString(36)+Math.random().toString(36).slice(2,6);
    x.g = gdhAgora();
    ELEMENTOS.push(x);
  } else {
    const atual = ELEMENTOS[i];
    /* Ao corrigir, um campo esvaziado é para ficar vazio; ao fundir dois registos com
       o mesmo nome, um campo vazio não deve apagar o que já lá estava. */
    const corrigir = !!(dados && dados.id);
    ["nome","entidade","ct","funcao","nota"].forEach(k=>{ if(corrigir || x[k]) atual[k] = x[k]; });
  }
  ELEMENTOS.sort((a,b)=>a.nome.localeCompare(b.nome, "pt"));
  await gravarElementos();
  return { ok:true, novo: i < 0 };
}

/** Retira um elemento do catálogo. Falso quando não havia nada com esse identificador. */
async function apagarElemento(id){
  const antes = ELEMENTOS.length;
  ELEMENTOS = ELEMENTOS.filter(x=>x.id !== id);
  if(ELEMENTOS.length === antes) return false;
  await gravarElementos();
  return true;
}

/** Procura por nome, entidade ou função. Sem termo, devolve tudo. */
function procurarElementos(termo){
  const t = String(termo||"").trim().toLowerCase();
  if(!t) return ELEMENTOS.slice();
  return ELEMENTOS.filter(x=>
    (x.nome+" "+x.entidade+" "+x.funcao+" "+x.nota).toLowerCase().indexOf(t) >= 0);
}

/**
 * Recolhe do dispositivo desta ocorrência quem lá está e ainda não está no catálogo:
 * as funções do PCO e os comandantes de setor. Devolve, não guarda — quem decide o que
 * fica no catálogo da sub-região é o oficial, não a importação de um pacote.
 */
function elementosPorRecolher(){
  const vistos = {}, fora = [];
  const juntar = (nome, entidade, funcao) => {
    const n = String(nome||"").trim(); if(!n) return;
    const x = { nome:n, entidade:String(entidade||"").trim(), funcao:String(funcao||"").trim() };
    const k = chaveElemento(x);
    if(vistos[k]) return;
    vistos[k] = true;
    if(!ELEMENTOS.some(y=>chaveElemento(y) === k)) fora.push(x);
  };
  pcoObj().funcoes.forEach(f=>juntar(f.nome, f.entidade, f.f));
  (estObj().setores||[]).forEach((s,i)=>{
    juntar(s.cmd, "", "Comandante do setor "+(NOMES_SETOR[i]||(i+1)));
    juntar(s.adj, "", "Adjunto do setor "+(NOMES_SETOR[i]||(i+1)));
  });
  return fora;
}
