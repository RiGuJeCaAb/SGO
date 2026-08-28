/* ================= PLANEAMENTO · emissão do PEA (art. 46.º) ================= */
async function emitirPEA(){
  const falta = pendencias().filter(x=>!x.ok&&x.ob);
  if(falta.length){ renderCheck(); aviso("msg-ia","err","Em falta: "+falta.map(f=>f.c).join(", ")+". Usa os botões Preencher acima."); return; }
  lerForm();
  const btn=$("b-gerar"); btn.disabled=true; btn.innerHTML='<span class="spin"></span> Planeamento…';
  const n = O.peas.length+1;
  const novas = evoDesdeUltimoPEA();
  const anterior = O.peas.length? O.peas[O.peas.length-1] : null;
  let plano=null, ordens=null, modo=LLM.rot+" · planeamento elabora, operações transmite";
  try{
    plano = await gerarPEA(n,novas,anterior);
    btn.innerHTML='<span class="spin"></span> Ordens de missão…';
    ordens = await gerarOrdens(n,novas,anterior,plano);
  }catch(e){
    modo="Determinística";
    aviso("msg-ia", LLM.modo==="manual"?"ok":"err",
      (LLM.modo==="manual"
        ? "Sem acesso a modelo neste modo de arranque — PEA elaborado por regras determinísticas."
        : "Modelo indisponível ("+String(e).slice(0,80)+") — emitida a versão determinística completa."));
    const d = detCompleto(novas,anterior); plano = d.pea; ordens = d.ordens;
  }
  const mm = metricas();
  const pea = { n, g:gdhAgora(), ts:Date.now(), validoTs:horizonteValidade(mm),
    base:baseVigor(), ctrl:controloMissoes(Object.assign({}, plano, ordens)), ultVerd:"vigor",
    modo, json:{pea:plano, ordens}, met:mm,
    serie:SERIE.map(p=>({d:p.d,h:p.h,t:p.t,rh:p.rh,wd:p.wd,ws:p.ws,pr:p.pr})),
    dados:JSON.parse(JSON.stringify(O.dados)), evoIdx:O.evolucao.length, meta:{...O.meta},
    don:(()=>{ try{ return verificacoesDON(); }catch(e){ return []; } })(),
    pco:(()=>{ try{ return JSON.parse(JSON.stringify(pcoObj())); }catch(e){ return {funcoes:[],canais:{}}; } })(),
    nivelDECIR:(O.meta.nivel || nivelDECIR(parseGDH(O.meta.inicio) || new Date())) };
  O.peas.push(pea);
  fita("PEA n.º "+n+" emitido ("+modo+"); válido até "+gdhDe(pea.validoTs)+", "+pea.ctrl.length+" missões em controlo");
  await persistir(false);
  btn.disabled=false; btn.textContent="Emitir proposta de PEA";
  verPEA(n);
}


/* ██████ OPERAÇÕES ██████ */
