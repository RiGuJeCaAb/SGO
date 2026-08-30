/* ================= PLANEAMENTO · emissão do PEA (art. 46.º) ================= */
async function emitirPEA(){
  if(!podeFazer("elaborar")){ aviso("msg-ia","err",motivoPerfil("elaborar")); return; }
  const falta = pendencias().filter(x=>!x.ok&&x.ob);
  if(falta.length){ renderCheck(); aviso("msg-ia","err","Em falta: "+falta.map(f=>f.c).join(", ")+". Usa os botões Preencher acima."); return; }
  lerForm();
  const btn=$("b-gerar"); btn.disabled=true; btn.innerHTML='<span class="spin"></span> Planeamento…';
  const n = O.peas.length+1;
  const novas = evoDesdeUltimoPEA();
  const anterior = O.peas.length? O.peas[O.peas.length-1] : null;
  /* **Só a proposta.** As ordens de missão nascem na aprovação, não aqui: quem as
     transmite é a célula de operações, e só depois de o COS aprovar o plano — art. 17.º,
     n.º 1, al. c). Produzi-las agora era dar por adquirido um ato de comando que ainda
     não aconteceu, e era isso que a aplicação fazia. */
  let plano=null, modo=LLM.rot+" · elaboração da célula de planeamento";
  try{
    plano = await gerarPEA(n,novas,anterior);
  }catch(e){
    modo="Determinística";
    aviso("msg-ia", LLM.modo==="manual"?"ok":"err",
      (LLM.modo==="manual"
        ? "Sem acesso a modelo neste modo de arranque — proposta elaborada por regras determinísticas."
        : "Modelo indisponível ("+String(e).slice(0,80)+") — emitida a versão determinística da proposta."));
    plano = detCompleto(novas,anterior).pea;
  }
  const mm = metricas();
  const pea = { n, g:gdhAgora(), ts:Date.now(), validoTs:horizonteValidade(mm),
    base:baseVigor(), ctrl:[], ultVerd:"",
    /* Nasce proposta. O controlo de missões fica vazio porque ainda não há missões:
       chegam com a aprovação, junto com as ordens. */
    estado:"proposta", analise:{g:""}, aprovacao:{g:"",por:"",funcao:"",nota:""},
    modo, json:{pea:plano, ordens:null}, met:mm,
    serie:SERIE.map(p=>({d:p.d,h:p.h,t:p.t,rh:p.rh,wd:p.wd,ws:p.ws,pr:p.pr})),
    dados:JSON.parse(JSON.stringify(O.dados)), evoIdx:O.evolucao.length, meta:{...O.meta},
    /* O croqui é congelado com o plano, pela mesma razão que o resto do instantâneo:
       um PEA emitido é documento, e o documento tem de continuar a mostrar o teatro
       como ele estava à hora em que foi emitido, e não como está agora. */
    croqui:(()=>{ try{ return croquiSVG(560, 330); }catch(e){ return ""; } })(),
    croquiLeg:(()=>{ try{ return (perimObj()||O.dados.sensDet)? croquiLegenda() : []; }catch(e){ return []; } })(),
    don:(()=>{ try{ return verificacoesDON(); }catch(e){ return []; } })(),
    /* O PEA emitido é um documento congelado, e a sua forma não muda porque o estado
       vivo mudou de arrumação: continua a levar `{funcoes, canais}`, que é o que os PEA
       já emitidos trazem e o que a impressão lê. O plano de comunicações vem agora da
       logística, mas entra no instantâneo pelo mesmo nome. */
    pco:(()=>{ try{ return JSON.parse(JSON.stringify({ funcoes:pcoObj().funcoes, canais:canaisObj() })); }
               catch(e){ return {funcoes:[],canais:{}}; } })(),
    nivelDECIR:(O.meta.nivel || nivelDECIR(parseGDH(O.meta.inicio) || new Date())) };
  O.peas.push(pea);
  O.evolucao.push({g:pea.g, tipo:"posit",
    txt:"Proposta de PEA n.º "+n+" elaborada pela célula de planeamento, para apreciação e determinação do COS."});
  fita("Proposta de PEA n.º "+n+" elaborada ("+modo+"); válida até "+gdhDe(pea.validoTs)+", por aprovar");
  await persistir(false);
  btn.disabled=false; btn.textContent="Elaborar proposta de PEA";
  verPEA(n);
}

/**
 * Produz e anexa as ordens de missão de um PEA aprovado.
 *
 * Separada da emissão porque é outro ato, de outra célula, e depois de outra decisão. É
 * aqui — e só aqui — que o contexto entregue ao modelo pode dizer que o plano está
 * aprovado, porque a essa altura está mesmo, com nome e GDH.
 */
async function produzirOrdens(p){
  const novas = evoDesdeUltimoPEA();
  const anterior = O.peas.length>1? O.peas[O.peas.length-2] : null;
  let ordens = null;
  try{
    ordens = await gerarOrdens(p.n, novas, anterior, p.json.pea);
  }catch(e){
    ordens = detCompleto(novas, anterior).ordens;
    aviso("msg-ia", LLM.modo==="manual"?"ok":"err",
      (LLM.modo==="manual"
        ? "Sem acesso a modelo neste modo de arranque — ordens de missão por regras determinísticas."
        : "Modelo indisponível ("+String(e).slice(0,80)+") — ordens de missão na versão determinística."));
  }
  p.json.ordens = ordens;
  p.ctrl = controloMissoes(Object.assign({}, p.json.pea, ordens));
  fita("Ordens de missão do PEA n.º "+p.n+" produzidas: "+p.ctrl.length+" em controlo");
  return p.ctrl.length;
}


/* ██████ OPERAÇÕES ██████ */
