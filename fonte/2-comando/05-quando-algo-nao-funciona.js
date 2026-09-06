/* ================= COMANDO · quando algo não funciona =================
   O dono, a 6 de setembro, depois de dois dias a lutar com uma carta que não vinha: «quando
   algo não funciona a app deveria poder limpar dados e recomeçar». Tinha razão: havia
   «Esquecer a carta guardada» no cartão do mapa, e mais nada. O serviço declarado, a pasta
   local, o endereço dos focos e o arquivo inteiro do dispositivo só se limpavam um a um,
   cada qual no seu cartão, ou pelas ferramentas do navegador.

   Dois graus, e a diferença entre eles é o que se perde. O primeiro limpa **a carta e o
   mapa** — o que é do dispositivo e volta a declarar-se em dois minutos — e não toca na
   ocorrência. O segundo repõe **a aplicação inteira neste dispositivo**: o arquivo das
   ocorrências vai com ele, e é por isso que pede confirmação com o número delas à vista e
   manda exportar antes. Nenhum dos dois apaga um ficheiro exportado: é para isso que ele
   existe. */

/**
 * Limpa tudo o que diz respeito à carta neste dispositivo: o serviço declarado, a pasta
 * pré-descarregada e a sua projeção, os mosaicos guardados e o endereço dos focos.
 *
 * Não toca na ocorrência nem nas folhas calibradas: essas são informação de quem as pôs, e
 * a regra é não descartar informação. A ocorrência continua onde estava, a carta volta a
 * ser «nenhuma», e o mapa volta a enquadrar-se quando houver carta outra vez.
 */
async function limparCartaEMapa(){
  const antes = { servico: !!CARTA, local: !!CARTA_LOCAL, focos: !!FOCOS_URL };
  let mosaicos = 0;
  try{ mosaicos = await esquecerMosaicos(); }catch(e){ mosaicos = 0; }
  await retirarCarta();
  await esquecerCartaLocal();
  await esquecerFocosURL();
  MAPA.enquadrado = false; MAPA.pronto = false; MAPA.falhas = 0; MAPA.recusados = 0; MAPA.ultimaFalha = null;
  const feito = [
    antes.servico? "serviço de carta retirado" : "",
    antes.local? "pasta pré-descarregada esquecida" : "",
    mosaicos? mosaicos+" quadrados de carta apagados" : "",
    antes.focos? "endereço dos focos esquecido" : ""
  ].filter(Boolean);
  fita("Carta e mapa limpos neste dispositivo: " + (feito.length? feito.join(", ") : "não havia nada declarado"));
  return { ok:true, feito, mosaicos };
}

/**
 * Repõe a aplicação neste dispositivo: apaga a base e todas as chaves do armazém, e
 * recarrega a página, que arranca como no primeiro dia.
 *
 * A base apaga-se com `deleteDatabase`, que fica **bloqueada** enquanto outra aba a tiver
 * aberta — e aí não se finge: diz-se que há outra aba e não se apaga metade. As chaves da
 * camada de trás (`localStorage`) vão também, porque é de lá que `prepararArmazem` volta
 * a trazer o que encontrar. O `recarregar` recebe-se por argumento para o arnês o poder
 * substituir: no jsdom `location.reload` não existe a sério.
 *
 * @param {{recarregar?:()=>void}} [opc]
 * @returns {Promise<{ok:boolean, motivo?:string}>}
 */
async function reporDispositivo(opc){
  const recarregar = (opc && opc.recarregar) || (()=>{ try{ location.reload(); }catch(e){} });
  /* Primeiro a base, que é onde está quase tudo. Fechar antes de apagar: uma ligação aberta
     nesta mesma aba bloqueava a própria eliminação. */
  if(IDB){ try{ IDB.close(); }catch(e){} IDB = null; }
  if(typeof indexedDB !== "undefined"){
    const r = await new Promise(res=>{
      let p;
      try{ p = indexedDB.deleteDatabase(IDB_NOME); }catch(e){ return res({ ok:false, motivo:"a base não se deixou apagar: "+String(e).slice(0,80) }); }
      p.onsuccess = ()=>res({ ok:true });
      p.onerror = ()=>res({ ok:false, motivo:"a base não se deixou apagar: "+String((p.error&&p.error.message)||p.error||"erro").slice(0,80) });
      p.onblocked = ()=>res({ ok:false, motivo:"há outra aba desta aplicação aberta neste navegador, e ela segura a base. Fechar as outras abas e voltar a tentar." });
      setTimeout(()=>res({ ok:false, motivo:"a base não respondeu ao pedido de eliminação." }), 5000);
    });
    if(!r.ok) return r;
  }
  /* Depois a camada de trás, chave a chave: é de lá que o arranque repõe o que encontrar. */
  try{
    const chaves = [];
    for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k && k.indexOf("peaapp:") === 0) chaves.push(k); }
    chaves.forEach(k=>localStorage.removeItem(k));
  }catch(e){}
  recarregar();
  return { ok:true };
}

/** O número de ocorrências no arquivo deste dispositivo, para o dizer antes de as apagar. */
async function ocorrenciasNoArquivo(){
  try{ const r = await ARMAZEM.get("peaapp:index"); const L = JSON.parse(r.value); return Array.isArray(L)? L.length : 0; }
  catch(e){ return 0; }
}

/* ---- os dois botões ---- */

$("b-limpar-carta").addEventListener("click", async ()=>{
  if(!window.confirm("Limpar a carta e o mapa neste dispositivo?\n\nSai o serviço de carta declarado, a pasta pré-descarregada, os quadrados guardados e o endereço dos focos. A ocorrência e as folhas calibradas ficam.")) return;
  const r = await limparCartaEMapa();
  try{ pintarCarta(); pintarDimensaoDaCarta(); await pintarArquivoMapa(); pintarMapaCartao(); if($("mapa-tela")) $("mapa-tela").innerHTML = ""; if($("mapa-info")) $("mapa-info").textContent = ""; pintarFocos(); }catch(e){}
  if($("foc-url")) $("foc-url").value = "";
  persistir(false);
  aviso("msg-manut","ok", r.feito.length? "Limpo: "+r.feito.join(", ")+". Declarar a carta de novo em Planeamento." : "Não havia carta nem endereço declarados; nada a limpar.");
});

$("b-repor").addEventListener("click", async ()=>{
  const n = await ocorrenciasNoArquivo();
  const aviso1 = "Repor a aplicação neste dispositivo?\n\nApaga TUDO o que está guardado aqui: "
    + (n? n+(n===1? " ocorrência guardada" : " ocorrências guardadas") : "o arquivo de ocorrências (vazio)")
    + ", o diário, as cópias, a carta, os quadrados, as folhas, a identidade e as preferências. Um ficheiro exportado não é tocado.\n\nExportou o que precisa?";
  if(!window.confirm(aviso1)) return;
  if(n && !window.confirm("Segunda confirmação: "+n+(n===1? " ocorrência vai" : " ocorrências vão")+" ser apagadas deste dispositivo. Continuar?")) return;
  const r = await reporDispositivo();
  if(!r.ok) aviso("msg-manut","err","Não se repôs: "+r.motivo);
});
