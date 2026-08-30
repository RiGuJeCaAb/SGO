/* ================= COMANDO · exportação e importação da ocorrência ================= */
/* O ARMAZEM pode cair em memória de sessão, e aí o estado perde-se ao fechar. Perder o
   registo de uma ocorrência em curso é perder a fita do tempo, as propostas emitidas e a
   prova das decisões de comando. A exportação não depende do armazenamento: funciona em
   file://, e dá ao oficial uma cópia que ele controla e pode levar para outro posto. */
function nomeExportacao(){
  const num = String(O.meta.num||"sem-num").replace(/[^\w.-]+/g,"-");
  const rev = String(REVISAO_APP||"").replace(/[^\w]+/g,"");
  return "CSREPCDouro_ocorrencia-"+num+"_"+carimboFich()+(rev? "_"+rev : "")+"_EstacaoPEA_CLD.json";
}

/**
 * O pacote que sai para ficheiro.
 *
 * Leva a revisão da aplicação que o escreveu — um pacote sem ela não se sabe de onde veio
 * — e o **resumo do estado no momento em que saiu**. O resumo é do estado, não do pacote:
 * o pacote leva-o dentro, e um resumo de si próprio não fecha.
 */
function pacoteOcorrencia(){
  lerForm();
  return {tipo:"peaapp:ocorrencia", versao:VERSAO_ESTADO, app:REVISAO_APP,
    ficheiro:FICHEIRO_APP, g:gdhAgora(), sha:resumoEstado(O), estado:O};
}

/**
 * Escreve a ocorrência num ficheiro que não depende deste dispositivo.
 *
 * É a única cópia que sobrevive ao disco, e é por isso que a mensagem manda guardá-lo
 * fora daqui. O nome leva número, GDH e versão do estado; o pacote leva o carimbo.
 */
function exportarOcorrencia(){
  const pacote = pacoteOcorrencia();
  descarregar(nomeExportacao(), JSON.stringify(pacote, null, 1));
  fita("Ocorrência exportada para ficheiro");
  aviso("msg-occ","ok","Ocorrência exportada. Guarda o ficheiro fora deste dispositivo.");
  persistir(false);
  return pacote;
}

/* Um pacote importado é dados, nunca código: valida-se a forma, migra-se pelo mesmo
   caminho do estado gravado, e o que não se reconhece é recusado com motivo. */
/** @param {string} texto @returns {Estado} */
function lerPacoteOcorrencia(texto){
  let pacote;
  try{ pacote = JSON.parse(texto); }
  catch(e){ throw new Error("o ficheiro não é JSON válido"); }
  if(!pacote || typeof pacote!=="object") throw new Error("o ficheiro não tem a forma esperada");
  const estado = (pacote.tipo==="peaapp:ocorrencia")? pacote.estado : pacote;
  if(!estado || typeof estado!=="object" || !estado.meta || typeof estado.meta!=="object"){
    throw new Error("o ficheiro não contém uma ocorrência");
  }
  const migrado = migrarGravado(estado);
  /* A forma confere-se **depois** da migração: antes dela um estado antigo tem
     legitimamente ramos que ainda não existiam, e acusá-los seria acusar a idade. */
  migrado.__forma = conferirForma(migrado);
  return migrado;
}

/**
 * Repõe uma ocorrência a partir de um ficheiro exportado.
 *
 * Confere o carimbo e **avisa sem recusar**: um pacote que não bate pode ser um ficheiro
 * corrompido ou um estado mexido à mão, e recusá-lo deixaria o oficial sem a ocorrência
 * em vez de o deixar decidir. O que não se pode é entrar em silêncio.
 */
async function importarOcorrencia(texto){
  let estado;
  try{ estado = lerPacoteOcorrencia(texto); }
  catch(e){
    aviso("msg-occ","err", e && e.futuro
      ? "Ficheiro exportado por uma revisão posterior (versão "+e.futuro+"). Abre-o na revisão mais recente."
      : "Não foi possível importar: "+(e && e.message || e)+".");
    return false;
  }
  if(O.meta.num && O.meta.num!==estado.meta.num &&
     !window.confirm("Substituir a ocorrência "+O.meta.num+" em memória pela ocorrência "+(estado.meta.num||"sem número")+" do ficheiro?")){
    return false;
  }
  /* Conferir antes de importar: depois de `O = estado` o ficheiro já não é o que está
     à frente, e a fita a escrever teria de ser a do estado novo. */
  const q = conferirCarimbo(texto);

  /* Um carimbo que não confere passa a exigir decisão expressa. Continua a não haver
     recusa automática — num PCO pode ser preferível recuperar um ficheiro suspeito do
     que ficar sem nada —, mas a decisão é de quem está ao teclado, e não da aplicação.
     E o aviso do ecrã apaga-se ao fim de cinco segundos e meio: o que fica é o ramo da
     proveniência, que acompanha a ocorrência e sai nas exportações seguintes. */
  if(q.bate === false && !window.confirm(
      "O carimbo de integridade deste ficheiro não confere.\n\n"
      + "O conteúdo foi alterado depois de exportado, ou o ficheiro está truncado.\n\n"
      + "Importar como CONTEÚDO NÃO VERIFICADO? A ocorrência fica marcada como tal, e a "
      + "marca acompanha-a nas exportações seguintes.")){
    aviso("msg-occ","err","Importação cancelada: o carimbo não confere e não foi autorizada a importação de conteúdo não verificado.");
    return false;
  }

  const problemas = estado.__forma || [];
  delete estado.__forma;
  O = estado;
  const pacote = (()=>{ try{ return JSON.parse(texto); }catch(e){ return {}; } })();
  O.integridade = {
    estado: q.bate === true? "valida" : (q.bate === false? "falhou" : "legado"),
    g: gdhAgora(),
    sha: String(pacote.sha || ""),
    app: String(pacote.app || ""),
    ficheiro: String(pacote.ficheiro || ""),
  };
  escreverForm(); pintarTudo();
  if(O.csv){ $("f-csv").value=O.csv; try{ analisarCSV(false); }catch(e){} }
  fita("Ocorrência importada de ficheiro"+(O.meta.num? " (n.º "+O.meta.num+")":""));
  await persistir(false);
  if(q.bate === true) fita("Carimbo de integridade confere: "+resumoCurto(JSON.parse(texto).sha));
  else if(q.bate === false) fita("ATENÇÃO: o carimbo de integridade do ficheiro importado não confere");
  if(problemas.length){
    fita("Forma corrigida na importação: "+problemas.join("; "));
    O.evolucao.push({g:gdhAgora(), tipo:"posit",
      txt:"Ocorrência importada com correções de forma: "+problemas.join("; ")+"."});
  }
  aviso("msg-occ", (q.bate===false || problemas.length)? "av" : "ok",
    "Ocorrência "+(O.meta.num||"sem número")+" importada ("+O.peas.length+" PEA, "+O.evolucao.length+" registos). "+q.nota
    + (problemas.length? " Forma corrigida em "+problemas.length+(problemas.length===1? " ponto: ":" pontos: ")+problemas.join("; ")+"." : ""));
  return true;
}

/**
 * Confere o carimbo de um pacote **contra o estado que vem dentro do próprio pacote**.
 *
 * É esta a comparação que faz sentido, e enganei-me nela à primeira: comparar contra o
 * estado em memória não prova nada e acusa sempre. O estado em memória muda no instante
 * em que se importa — a própria importação escreve na fita do tempo —, e o carimbo
 * passava a não bater em todas as importações legítimas. O que se confere é se o ficheiro
 * está consistente consigo mesmo: se o estado que lá está é o que foi carimbado quando
 * saiu. É isso que apanha o ficheiro truncado, o editado à mão e a cópia mal copiada.
 *
 * Por isso também não há caso especial para pacotes de versões anteriores: o carimbo
 * cobre o estado **como foi escrito**, e a migração só acontece depois de se conferir.
 *
 * **Avisa, não recusa.** Recusar podia ser a diferença entre ter a ocorrência e não ter
 * nada. Diz-se o que se sabe, fica na fita do tempo, e quem decide é quem está no PCO.
 *
 * @param {string} texto o pacote como veio do ficheiro
 * @returns {{bate:(boolean|null), nota:string}}
 */
function conferirCarimbo(texto){
  let p = null;
  try{ p = JSON.parse(texto); }catch(e){ p = null; }
  if(!p || typeof p !== "object") return { bate:null, nota:"" };
  const sha = p.sha;
  if(!sha) return { bate:null, nota:"O ficheiro não traz carimbo de integridade: foi exportado por uma revisão anterior à que passou a carimbar." };
  const nosso = resumoEstado(p.estado !== undefined? p.estado : p);
  if(sha === nosso){
    return { bate:true, nota:"Carimbo de integridade confere ("+resumoCurto(sha)+")." };
  }
  return { bate:false, nota:"ATENÇÃO: o carimbo de integridade não confere — o ficheiro diz "
    +resumoCurto(sha)+" e o conteúdo dá "+resumoCurto(nosso)
    +". Foi alterado depois de exportado, ou está truncado. Confere antes de o usar como prova." };
}

/* ██████ PLANEAMENTO ██████ */
