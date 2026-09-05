/* ================= NÚCLEO · armazenamento =================
   Três camadas, por esta ordem: o armazenamento do ambiente Claude, o do navegador, e a
   memória da sessão. A quarta — o IndexedDB — não pode entrar aqui porque abrir uma base
   é assíncrono e isto corre no arranque; entra logo a seguir, em `prepararArmazem()`, e
   substitui a camada escolhida sem que ninguém tenha de saber.

   O que o IndexedDB traz e o `localStorage` não tem: **escrita de várias chaves numa só
   transação** — hoje o estado vai numa chave e o índice noutra, e uma falha entre as duas
   deixa o arquivo a apontar para uma ocorrência que não ficou gravada —, espaço com outra
   ordem de grandeza, e lugar para o diário e para as cópias de segurança.

   Verificado: o IndexedDB abre e escreve em `file://` no Chromium. Onde não abrir — e há
   navegadores onde não abre — fica a camada de trás, e tudo continua a funcionar. */

/** Escreve várias chaves uma a uma. É o recuo de quem não tem transação. */
async function _setSequencial(escrever, pares){
  for(const [k,v] of pares) await escrever(k, v);
  return { atomico:false };
}

const ARMAZEM = (()=>{
  if (typeof window!=="undefined" && window.storage && typeof window.storage.set==="function"){
    const set = (k,v)=>window.storage.set(k,v);
    return { modo:"claude", atomico:false,
      get:k=>window.storage.get(k),
      set,
      setVarias:pares=>_setSequencial(set, pares),
      del:k=>window.storage.delete(k) };
  }
  try{
    localStorage.setItem("__t","1"); localStorage.removeItem("__t");
    const set = async (k,v)=>{ localStorage.setItem(k,v); return {key:k,value:v}; };
    return { modo:"browser", atomico:false,
      get:async k=>{ const v=localStorage.getItem(k); if(v===null) throw "sem chave"; return {key:k,value:v}; },
      set,
      setVarias:pares=>_setSequencial(set, pares),
      del:async k=>{ localStorage.removeItem(k); return {key:k,deleted:true}; } };
  }catch(e){}
  const M={};
  const set = async (k,v)=>{ M[k]=v; return {key:k,value:v}; };
  return { modo:"sessao", atomico:false,
    get:async k=>{ if(!(k in M)) throw "sem chave"; return {key:k,value:M[k]}; },
    set,
    setVarias:pares=>_setSequencial(set, pares),
    del:async k=>{ delete M[k]; return {key:k,deleted:true}; } };
})();

/* A base do IndexedDB, quando existir. `chaves` guarda o que o ARMAZEM guardava;
   `diario` é o registo append-only do posto; `copias` são os instantâneos de recuperação;
   `mosaicos` são os quadrados de carta já descarregados, que é o que faz o mapa continuar
   a existir quando a ligação de dados cai — e num PCO cai. */
const IDB_NOME = "peaapp";
/* A loja `folhas` guarda a colocação de cada folha de carta calibrada, não a imagem: a
   imagem pesa megabytes e volta a escolher-se, a colocação é que não se pode perder.
   Entrou a 2 de setembro, na absorção do trabalho da linhagem paralela — e é aditiva, que
   é o que `abrirIDB` sabe tratar sem descer de versão. */
const IDB_LOJAS = [["chaves", null], ["diario", {keyPath:"n"}], ["copias", {keyPath:"id"}], ["mosaicos", null], ["folhas", {keyPath:"id"}]];
let IDB = null;

/** Cria as lojas que faltarem. Corre dentro do `onupgradeneeded`, que é o único sítio onde
    isso é possível. */
function criarLojasIDB(db){
  IDB_LOJAS.forEach(([nome, opc])=>{
    if(!db.objectStoreNames.contains(nome)) db.createObjectStore(nome, opc || undefined);
  });
}

/**
 * Abre a base, ou devolve `null` se este navegador não a der em `file://`.
 *
 * **Abre-se pela versão que a base tiver, e nunca por um número fixo.** Havia aqui um
 * `indexedDB.open(IDB_NOME, 2)`, e um número fixo só funciona enquanto uma única linhagem
 * escrever na base. A linhagem paralela subiu a dela para 3 com uma loja `folhas`, e quem
 * corresse as duas entregas no mesmo navegador levava com um `VersionError` — «The
 * requested version (2) is less than the existing version (3)» — que chega pelo `onerror`
 * e aqui virava um `null`. A partir daí não havia diário, não havia cópias de recuperação
 * e não havia mosaicos de carta guardados, **e nada no ecrã dizia porquê**: só o painel da
 * carta pré-descarregada se queixa quando não há base.
 *
 * A regra passa a ser: adota-se a versão existente; se faltar alguma loja, sobe-se um
 * degrau acima do que lá está para a criar. Assim uma base mais recente do que a que esta
 * entrega conhece serve na mesma, e a versão nunca desce.
 */
function abrirIDB(){
  return new Promise(res=>{
    if(typeof indexedDB === "undefined") return res(null);
    let respondido = false;
    const responder = v=>{ if(!respondido){ respondido = true; res(v); } };
    /* Um único prazo para a operação inteira, e não um por tentativa: nem sempre há erro,
       às vezes não há resposta nenhuma. */
    setTimeout(()=>responder(null), 3000);

    const tentar = versao=>{
      let p;
      try{ p = versao? indexedDB.open(IDB_NOME, versao) : indexedDB.open(IDB_NOME); }
      catch(e){ return responder(null); }
      p.onupgradeneeded = ()=>criarLojasIDB(p.result);
      p.onsuccess = ()=>{
        const db = p.result;
        if(IDB_LOJAS.every(([nome])=>db.objectStoreNames.contains(nome))) return responder(db);
        /* Base de outra linhagem, sem as lojas desta. Sobe-se um degrau e criam-se — subir
           é sempre legítimo, descer é que não é. */
        const seguinte = db.version + 1;
        db.close();
        tentar(seguinte);
      };
      p.onerror = ()=>responder(null);
      p.onblocked = ()=>responder(null);
    };
    tentar(0);
  });
}

/**
 * Uma operação sobre uma loja, embrulhada em promessa.
 *
 * O valor **colhe-se no `onsuccess` do pedido**, e não do objeto devolvido. À primeira
 * escrevi `r.result !== undefined? r.result : r`, e isso devolvia o próprio `IDBRequest`
 * sempre que a chave não existia: o `get` deixava de lançar «sem chave» e passava a
 * devolver `[object IDBRequest]`, que ninguém consegue interpretar. Foi o navegador que
 * o mostrou — em jsdom não há IndexedDB, e este caminho não corre lá.
 */
function _idb(loja, modo, fn){
  return new Promise((res, rej)=>{
    if(!IDB) return rej("sem base");
    let tx;
    try{ tx = IDB.transaction(loja, modo); }catch(e){ return rej(e); }
    let valor;
    const pedido = fn(tx.objectStore(loja), tx);
    if(pedido && typeof pedido === "object" && "onsuccess" in pedido){
      pedido.onsuccess = ()=>{ valor = pedido.result; };
    }
    tx.oncomplete = ()=>res(valor);
    tx.onerror = ()=>rej(tx.error);
    tx.onabort = ()=>rej(tx.error || "transação abortada");
  });
}

/**
 * Passa o armazenamento para o IndexedDB, se este navegador o der.
 *
 * O que já estava guardado vem com ele: sem isto, quem abrisse a aplicação depois desta
 * revisão encontrava o arquivo vazio, com as ocorrências todas na camada anterior.
 * Falhar aqui não é falhar: mantém-se o que estava, e a aplicação nem dá por isso.
 *
 * @returns {Promise<boolean>} se o IndexedDB ficou a servir
 */
async function prepararArmazem(){
  if(ARMAZEM.modo === "claude") return false;   /* o ambiente Claude tem o seu, e é melhor */
  IDB = await abrirIDB();
  if(!IDB) return false;

  const anterior = { get:ARMAZEM.get, set:ARMAZEM.set, del:ARMAZEM.del, modo:ARMAZEM.modo };
  ARMAZEM.modo = "indexeddb";
  ARMAZEM.atomico = true;
  ARMAZEM.get = async k=>{
    const v = await _idb("chaves", "readonly", st=>st.get(k));
    if(v === undefined || v === null) throw "sem chave";
    return { key:k, value:String(v) };
  };
  ARMAZEM.set = async (k,v)=>{ await _idb("chaves","readwrite", st=>st.put(String(v), k)); return {key:k,value:v}; };
  ARMAZEM.setVarias = async pares=>{
    await _idb("chaves","readwrite", st=>{ pares.forEach(([k,v])=>st.put(String(v), k)); });
    return { atomico:true };
  };
  ARMAZEM.del = async k=>{ await _idb("chaves","readwrite", st=>st.delete(k)); return {key:k,deleted:true}; };

  /* Trazer o que estava na camada anterior. Só o que ainda não existir aqui: uma
     segunda passagem não pode desfazer o trabalho de hoje com a cópia de ontem. */
  if(anterior.modo === "browser"){
    try{
      const chaves = [];
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if(k && k.indexOf("peaapp:") === 0) chaves.push(k);
      }
      for(const k of chaves){
        let ja = true;
        try{ await ARMAZEM.get(k); }catch(e){ ja = false; }
        if(!ja) await ARMAZEM.set(k, localStorage.getItem(k));
      }
    }catch(e){
      /* Uma passagem a meio deixava as ocorrências na camada de trás e o arquivo a
         parecer vazio, sem uma palavra. A camada de trás não se perde — volta a tentar-se
         no próximo arranque — mas diz-se onde se possa. */
      ARMAZEM.passagemIncompleta = String((e && e.message) || e).slice(0,80);
      if(typeof aviso === "function" && typeof $ === "function" && $("msg-occ"))
        aviso("msg-occ","err","A passagem do arquivo antigo para a base ficou a meio ("+ARMAZEM.passagemIncompleta+"). O que faltar volta a passar no próximo arranque.");
    }
  }
  return true;
}
