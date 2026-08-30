/* ================= NÚCLEO · diário do posto e cópias de recuperação =================
   Duas coisas diferentes, que se resolvem no mesmo sítio.

   **O diário** é o registo append-only do posto de comando, e não da ocorrência. A fita
   do tempo vive dentro da ocorrência e desaparece com ela — se alguém a apagar, ou se o
   estado se corromper, não fica nada a dizer que existiu. O diário fica: cada linha leva
   o resumo da anterior, e por isso uma linha retirada pelo meio deixa a cadeia partida e
   vê-se. Não impede quem tem acesso ao equipamento de reescrever o diário inteiro — isso
   exige o serviço, e está escrito no contrato —, mas apanha o que acontece a sério: a
   corrupção, o apagamento parcial, a cópia mal feita.

   **As cópias** são instantâneos do estado, guardados de tempos a tempos. Servem para o
   caso que mais mete medo num PCO: a ocorrência que se estraga a meio e não há por onde
   voltar atrás. São locais e não substituem a exportação para ficheiro — um instantâneo
   no mesmo disco não sobrevive ao disco.

   Ambos preferem o IndexedDB. Sem ele, ficam numa chave do armazenamento e limitados aos
   últimos registos, porque o `localStorage` não tem espaço para mais. Menos é melhor do
   que nada, desde que se diga qual dos dois se tem. */

const DIARIO_CHAVE = "peaapp:diario", COPIAS_CHAVE = "peaapp:copias";
/** Quantos ficam quando não há IndexedDB. */
const DIARIO_MAX_LEVE = 200, COPIAS_MAX = 20;
/** Minutos entre cópias automáticas. */
const COPIA_CADA_MIN = 10;

let DIARIO_N = 0, DIARIO_ULT = "";
let COPIA_ULT_TS = 0;

/** O resumo de uma linha do diário, que encadeia na anterior. */
function selarLinha(l){
  return sha256([l.n, l.g, l.num, l.quem, l.evento, l.anterior].join(""));
}

/**
 * Acrescenta uma linha ao diário. Nunca lança: um diário que parte o registo que devia
 * proteger é pior do que não haver diário.
 */
/**
 * Acrescenta uma linha no IndexedDB, **lendo a cauda dentro da própria transação**.
 *
 * A primeira versão numerava a partir de um contador em memória e escrevia com `put`:
 * com dois separadores abertos, dois processos chegavam ao mesmo número e o segundo
 * apagava o primeiro. A segunda usava `add` e repetia em caso de choque — e ainda assim
 * perdeu três linhas em trinta, na prova com duas abas em simultâneo. Um registo que
 * existe para não perder linhas não pode perder três em trinta.
 *
 * As transações do IndexedDB são serializadas pelo navegador. Ler o último registo e
 * escrever o seguinte **dentro da mesma transação** dá o número e o elo certos sem
 * contadores, sem fechaduras e sem repetições.
 */
function diarioAdicionarIDB(base){
  return new Promise((res, rej)=>{
    let tx;
    try{ tx = IDB.transaction("diario","readwrite"); }catch(e){ return rej(e); }
    const st = tx.objectStore("diario");
    const cur = st.openCursor(null, "prev");
    let linha = null;
    cur.onsuccess = ()=>{
      const c = cur.result, u = c? c.value : null;
      linha = Object.assign({}, base, { n:(u? u.n : 0)+1, anterior:(u? u.sha : "") });
      linha.sha = selarLinha(linha);
      st.add(linha);
    };
    tx.oncomplete = ()=>res(linha);
    tx.onerror = ()=>rej(tx.error);
    tx.onabort = ()=>rej(tx.error || "transação abortada");
  });
}

/**
 * Acrescenta uma linha ao diário. Nunca lança: um diário que parte o registo que devia
 * proteger é pior do que não haver diário.
 */
async function diarioAcrescentar(evento){
  const base = { g: gdhAgora(), ts: Date.now(),
    num: (O && O.meta && O.meta.num) || "", quem: quemRegista(), evento: String(evento||"") };
  try{
    if(IDB){
      const l = await diarioAdicionarIDB(base);
      DIARIO_N = l.n; DIARIO_ULT = l.sha;
      return l;
    }
    /* Sem IndexedDB não há transação onde ler a cauda: fica o contador em memória, que
       chega para um separador só — que é o que este caminho consegue prometer. */
    const l = Object.assign({}, base, { n: ++DIARIO_N, anterior: DIARIO_ULT });
    l.sha = selarLinha(l);
    const L = await diarioLer();
    L.push(l);
    await ARMAZEM.set(DIARIO_CHAVE, JSON.stringify(L.slice(-DIARIO_MAX_LEVE)));
    DIARIO_ULT = l.sha;
    return l;
  }catch(e){ return null; }
}

/** Lê o diário inteiro, por ordem. */
async function diarioLer(){
  try{
    if(IDB) return (await _idb("diario","readonly", st=>st.getAll())) || [];
    const r = await ARMAZEM.get(DIARIO_CHAVE);
    const L = JSON.parse(r.value);
    return Array.isArray(L)? L : [];
  }catch(e){ return []; }
}

/** Retoma a numeração e o último elo, para que a cadeia continue entre sessões. */
async function diarioRetomar(){
  const L = await diarioLer();
  const u = L[L.length-1];
  DIARIO_N = u? u.n : 0;
  DIARIO_ULT = u? u.sha : "";
  return L.length;
}

/**
 * Confere a cadeia do diário.
 *
 * @returns {Promise<{linhas:number, ok:boolean, partidas:number[]}>} onde partiu, se partiu
 */
async function diarioConferir(){
  const L = await diarioLer();
  const partidas = [];
  let anterior = "";
  L.forEach(l=>{
    const esperado = selarLinha(Object.assign({}, l, { anterior }));
    if(l.anterior !== anterior || l.sha !== esperado) partidas.push(l.n);
    anterior = l.sha;
  });
  return { linhas:L.length, ok:partidas.length === 0, partidas };
}

/* ---- cópias de recuperação ---- */

/** Guarda um instantâneo do estado. `motivo` diz porque foi guardado. */
async function copiaGuardar(motivo){
  try{
    lerForm();
    const c = { id:"c"+Date.now().toString(36), ts:Date.now(), g:gdhAgora(),
      num:(O.meta.num||""), local:(O.meta.local||""), motivo:String(motivo||"automática"),
      sha:resumoEstado(O), estado:JSON.parse(JSON.stringify(O)) };
    if(IDB) await _idb("copias","readwrite", st=>st.put(c));
    else {
      const L = await copiasListar(true);
      L.push(c);
      /* Sem IndexedDB não cabem vinte estados numa chave: fica a última, que é a que
         responde ao caso que interessa. */
      await ARMAZEM.set(COPIAS_CHAVE, JSON.stringify(L.slice(-1)));
    }
    COPIA_ULT_TS = c.ts;
    await copiasPodar();
    return c;
  }catch(e){ return null; }
}

/** Lista as cópias, da mais recente para a mais antiga. Sem o estado, salvo se `cheio`. */
async function copiasListar(cheio){
  try{
    let L;
    if(IDB) L = (await _idb("copias","readonly", st=>st.getAll())) || [];
    else { const r = await ARMAZEM.get(COPIAS_CHAVE); L = JSON.parse(r.value); }
    if(!Array.isArray(L)) L = [];
    L.sort((a,b)=>b.ts-a.ts);
    return cheio? L : L.map(c=>({id:c.id, ts:c.ts, g:c.g, num:c.num, local:c.local, motivo:c.motivo, sha:c.sha}));
  }catch(e){ return []; }
}

/** Deixa ficar as `COPIAS_MAX` mais recentes. */
async function copiasPodar(){
  if(!IDB) return;
  try{
    const L = await copiasListar();
    for(const c of L.slice(COPIAS_MAX)) await _idb("copias","readwrite", st=>st.delete(c.id));
  }catch(e){}
}

/**
 * Repõe uma cópia como estado corrente.
 *
 * **Guarda o que lá está antes de o substituir.** Recuperar não pode ser destrutivo: se
 * alguém recupera a cópia errada, o que estava tem de continuar a existir.
 */
async function copiaRepor(id){
  const L = await copiasListar(true);
  const c = L.find(x=>x.id === id);
  if(!c) return { ok:false, motivo:"Cópia não encontrada." };
  await copiaGuardar("antes de repor a cópia de "+c.g);
  O = migrarGravado(JSON.parse(JSON.stringify(c.estado)));
  escreverForm();
  fita("Reposta a cópia de segurança de "+c.g+" ("+resumoCurto(c.sha)+")");
  await persistir(false);
  pintarTudo();
  return { ok:true, copia:c };
}

/** Guarda uma cópia se já passou o intervalo. Chamado a cada gravação. */
async function copiaSeDevida(){
  if(!O || !O.meta || !O.meta.num) return null;          /* sem ocorrência não há o que copiar */
  if(Date.now() - COPIA_ULT_TS < COPIA_CADA_MIN*60000) return null;
  return copiaGuardar("automática");
}
