/* ================= NÚCLEO · forma de uma ocorrência importada =================
   Um pacote que entra por ficheiro era aceite com três perguntas: é JSON, é objeto, tem
   `meta`. Daí seguia para as migrações e para o ecrã. Tudo o resto — tipos, listas,
   enumerações, o que lá estivesse a mais — entrava como viesse.

   O que se faz aqui **não é recusar**. Num posto de comando, um ficheiro com um campo
   estragado ainda é a ocorrência, e recusá-lo inteiro pode ser a diferença entre ter o
   registo e não ter nada. Corrige-se a forma, conta-se o que se corrigiu, e diz-se a
   quem importou — que decide o que fazer com a informação.

   A recusa fica para o que não é uma ocorrência de todo, e essa continua onde estava.

   Isto é também redução de superfície do problema do XSS: um `evolucao` que não é lista,
   ou um `txt` que é um objeto, chegavam aos construtores de HTML como viessem. */

/**
 * A forma esperada de cada ramo do estado.
 *
 * `t` é o tipo: `"texto"`, `"lista"`, `"objeto"` ou `"numero"`. `campos` descreve os
 * campos obrigatórios dos elementos de uma lista, e `podeVazio` diz que a lista pode não
 * existir. O que aqui não está é deixado como veio: a tabela é o chão, não a fronteira.
 */
const FORMA_OCORRENCIA = [
  { p:"meta",          t:"objeto" },
  { p:"dados",         t:"objeto" },
  { p:"logistica",     t:"objeto" },
  { p:"pco",           t:"objeto" },
  { p:"turno",         t:"objeto" },
  { p:"encerramento",  t:"objeto" },
  { p:"integridade",   t:"objeto" },
  { p:"cumprimentos",  t:"objeto" },
  { p:"meteo",         t:"objeto" },
  { p:"csv",           t:"texto"  },
  { p:"evolucao",      t:"lista", campos:{ g:"texto", tipo:"texto", txt:"texto" } },
  { p:"fita",          t:"lista", campos:{ g:"texto", e:"texto" } },
  { p:"peas",          t:"lista", campos:{ n:"numero" } },
  /* Os ramos interiores que o mapa e a setorização interpolam em HTML, e que até à r0099
     chegavam lá como viessem: nove dos treze ramos de cima só se conferiam como «é
     objeto?». `campos:{}` exige que cada elemento seja um objeto; um campo com tipo exige
     que exista com esse tipo. Os caminhos são por pontos e resolvem-se em `ramoDe`. */
  { p:"dados.est.setores", t:"lista", campos:{ estado:"texto" } },
  { p:"dados.pontos",      t:"lista", campos:{ tipo:"texto" } },
  { p:"dados.frentes",     t:"lista", campos:{} },
  { p:"dados.linhas",      t:"lista", campos:{} },
  { p:"dados.notas",       t:"lista", campos:{} },
  { p:"dados.anexos",      t:"lista", campos:{} },
  { p:"pco.funcoes",       t:"lista", campos:{ f:"texto" } },
];

/** O valor num caminho por pontos, ou `undefined` se um dos pais não existir. */
function ramoDe(e, caminho){
  return caminho.split(".").reduce((o,k)=>(o && typeof o === "object")? o[k] : undefined, e);
}

/** Escreve num caminho por pontos. Sem pai não escreve nada: a escada de migrações é quem
    cria os pais, e a forma confere-se depois dela. Devolve se escreveu. */
function porRamo(e, caminho, v){
  const ks = caminho.split("."), ult = ks.pop();
  const pai = ks.reduce((o,k)=>(o && typeof o === "object")? o[k] : undefined, e);
  if(!pai || typeof pai !== "object") return false;
  pai[ult] = v; return true;
}

/** O tipo de um valor, no vocabulário da tabela. */
function tipoDe(v){
  if(Array.isArray(v)) return "lista";
  if(v === null || v === undefined) return "vazio";
  if(typeof v === "object") return "objeto";
  if(typeof v === "number") return isFinite(v)? "numero" : "vazio";
  return typeof v === "string"? "texto" : typeof v;
}

/** O valor por omissão de cada tipo. */
const VAZIO_DE = { texto:"", lista:[], objeto:{}, numero:0 };

/**
 * Confere e corrige a forma de um estado importado.
 *
 * Devolve a lista do que teve de ser corrigido, em português e por caminho, para que
 * quem importou saiba o que recebeu. Lista vazia significa que a forma estava certa.
 *
 * @param {any} e estado, corrigido no lugar
 * @returns {string[]}
 */
function conferirForma(e){
  const probs = [];
  if(!e || typeof e !== "object" || Array.isArray(e)) return ["o ficheiro não contém uma ocorrência"];

  FORMA_OCORRENCIA.forEach(f=>{
    const t = tipoDe(ramoDe(e, f.p));
    if(t === f.t) return;
    if(t === "vazio"){
      /* Um ramo em falta não é defeito do ficheiro: pode ser de uma versão anterior, e a
         escada de migrações trata disso. Repõe-se o vazio do tipo e segue. */
      porRamo(e, f.p, JSON.parse(JSON.stringify(VAZIO_DE[f.t])));
      return;
    }
    if(porRamo(e, f.p, JSON.parse(JSON.stringify(VAZIO_DE[f.t]))))
      probs.push("«"+f.p+"» era "+t+" e devia ser "+f.t+"; reposto vazio");
  });

  /* Elementos de lista com a forma errada saem da lista. Um registo de evolução sem
     texto, ou cujo texto é um objeto, não é registo nenhum — e é o que chegaria ao ecrã. */
  FORMA_OCORRENCIA.filter(f=>f.t === "lista" && f.campos).forEach(f=>{
    const lista = ramoDe(e, f.p);
    if(!Array.isArray(lista)) return;
    const antes = lista.length;
    const limpa = lista.filter(x=>{
      if(!x || typeof x !== "object" || Array.isArray(x)) return false;
      return Object.keys(f.campos).every(k=>tipoDe(x[k]) === f.campos[k]);
    });
    porRamo(e, f.p, limpa);
    const fora = antes - limpa.length;
    if(fora) probs.push(fora + (fora===1? " entrada de «" : " entradas de «") + f.p + "» sem a forma esperada; retirada"
      + (fora===1? "" : "s"));
  });

  return probs;
}
