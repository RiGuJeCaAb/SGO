/* ================= COMANDO · exportação e importação da ocorrência ================= */
/* O ARMAZEM pode cair em memória de sessão, e aí o estado perde-se ao fechar. Perder o
   registo de uma ocorrência em curso é perder a fita do tempo, as propostas emitidas e a
   prova das decisões de comando. A exportação não depende do armazenamento: funciona em
   file://, e dá ao oficial uma cópia que ele controla e pode levar para outro posto. */
function nomeExportacao(){
  const num = String(O.meta.num||"sem-num").replace(/[^\w.-]+/g,"-");
  return "CSREPCDouro_ocorrencia-"+num+"_"+carimboFich()+"_EstacaoPEA_CLD.json";
}

function pacoteOcorrencia(){
  lerForm();
  return {tipo:"peaapp:ocorrencia", versao:VERSAO_ESTADO, g:gdhAgora(), estado:O};
}

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
  return migrarGravado(estado);
}

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
  O = estado;
  escreverForm(); pintarTudo();
  if(O.csv){ $("f-csv").value=O.csv; try{ analisarCSV(false); }catch(e){} }
  fita("Ocorrência importada de ficheiro"+(O.meta.num? " (n.º "+O.meta.num+")":""));
  await persistir(false);
  aviso("msg-occ","ok","Ocorrência "+(O.meta.num||"sem número")+" importada ("+O.peas.length+" PEA, "+O.evolucao.length+" registos).");
  return true;
}

/* ██████ PLANEAMENTO ██████ */
