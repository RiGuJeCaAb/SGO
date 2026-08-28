/* ================= TURNO · passagem de turno ================= */
function turnoObj(){
  if(!O.turno || typeof O.turno!=="object") O.turno = novoTurno();
  if(!Array.isArray(O.turno.entregas)) O.turno.entregas = [];
  O.turno.celulas = Object.assign(novoTurno().celulas, O.turno.celulas||{});
  return O.turno;
}
const LIMITE_TURNO_H = 12;   /* DON n.º 2, ponto 7.d.(30) */

function horasDeTurno(){
  const t = turnoObj(), d = parseGDH(t.inicio);
  return d ? (agora() - d.getTime())/3600000 : null;
}

/* Pendências compostas do que a aplicação já sabe. Cada célula lê apenas o que a
   lei lhe atribui — é aqui que a separação deixa de ser doutrina e passa a ser código. */
function pendenciasCelula(k){
  const out = [];
  const push = (t, x, falta) => out.push({t, x, falta:!!falta});
  try{
    if(k==="comando"){
      const emFalta = funcoesExigiveis().filter(x=>!x.preenchida);
      /* numa passagem de turno, catorze funções num parágrafo não se leem:
         mostram-se as primeiras e conta-se o resto */
      if(emFalta.length) push("Funções exigíveis por nomear",
        emFalta.slice(0,6).map(x=>x.f).concat(emFalta.length>6? ["e mais "+(emFalta.length-6)+" — ver o separador do PCO"] : []), true);
      const pend = (pcoObj().funcoes||[]).filter(x=>x.solicitado && !x.g);
      if(pend.length) push("Nomeações solicitadas e pendentes",
        pend.map(x=>x.f+" a "+(x.entidade||pcoDef(x.f).ext||"entidade")+", solicitada "+x.solicitado), true);
      push("Fase do SGO e nível DECIR", (O.meta.fase||"por declarar")+" · "+(O.meta.nivel||"por declarar"));
      const nom = (pcoObj().funcoes||[]).filter(x=>x.g).length;
      push("Funções nomeadas", String(nom));
    }
    if(k==="planeamento"){
      const p = peaVigor();
      if(!p) push("PEA", "Nenhum PEA emitido nesta ocorrência.");
      else {
        push("PEA em vigor", "n.º "+p.n+", emitido "+p.g+", válido até "+gdhDe(p.validoTs)
          + (p.validoTs < agora() ? " — VENCIDO" : ""));
        try{ const d = divergencia(p); if(d && d.itens && d.itens.length)
          push("Divergência face ao plano", d.itens.map(x=>x.txt||x).join("; ")); }catch(e){}
      }
      push("Meteorologia", (SERIE && SERIE.length)? SERIE.length+" horas carregadas" : "sem previsão carregada");
      push("Pontos sensíveis", O.dados.sensiveis || "por identificar");
      const esp = nomeado("Núcleo de Especialistas");
      push("Núcleo de especialistas", esp? ("ativado — "+(esp.nome||"sem nome")) : "não ativado (art. 30.º; DON 2, 7.e.(27))");
    }
    if(k==="operacoes"){
      const e = estObj();
      const porEstado = {};
      (e.setores||[]).forEach((x,i)=>{ const s2=x.estado||"—"; (porEstado[s2]=porEstado[s2]||[]).push(NOMES_SETOR[i]); });
      const chaves = Object.keys(porEstado);
      push("Setores", chaves.length? chaves.map(c2=>c2+": "+porEstado[c2].join(", ")).join(" · ") : "sem setorização registada");
      const p = peaVigor();
      if(p && p.ctrl){
        const porFazer = p.ctrl.filter(x=>x.estado===0), emCurso = p.ctrl.filter(x=>x.estado===1);
        push("Execução do PEA n.º "+p.n,
          p.ctrl.filter(x=>x.estado===2).length+" de "+p.ctrl.length+" cumpridas"
          + (emCurso.length? "; em execução "+emCurso.map(x=>x.k).join(", ") : "")
          + (porFazer.length? "; por iniciar "+porFazer.map(x=>x.k).join(", ") : ""));
      }
      const mp = minutosDesde(ultimoPOSIT());
      push("Último POSIT", mp===null? "nenhum registado" : ("há "+mp+" min"));
      push("Fita do tempo", (O.fita||[]).length+" registos");
      const AL = aerLista();
      if(AL.length) push("Meios aéreos no TO", AL.map(a=>a.ind||a.t).join(", "));
    }
    if(k==="logistica"){
      const P = pcoObj();
      const at = (P.canais && P.canais.atrib)? P.canais.atrib.length : 0;
      push("Plano de comunicações", at? at+" canais atribuídos" : "por elaborar (art. 32.º, n.º 1, al. d))");
      const pt = ptObj();
      push("Ponto de trânsito", pt.des? (pt.des + (pt.resp? " — "+pt.resp:"")) : "por estabelecer (DON 2, 7.d.(5), (7) e (8))");
      push("Reserva e zona de apoio",
        "reserva "+((reservaObj().m||"?")+" meios / "+(reservaObj().o||"?")+" op.")+" · ZA "+((zaObj().m||"?")+" meios / "+(zaObj().o||"?")+" op."));
      const R = rendicoes(), venc = R.filter(x=>x.nivel==="r"), avi = R.filter(x=>x.nivel==="a");
      push("Rendições",
        venc.length? ("VENCIDAS: "+venc.map(x=>x.nome+" ("+x.txt+")").join("; "))
        : (avi.length? ("a preparar: "+avi.map(x=>x.nome+" ("+x.txt+")").join("; ")) : (R.length? "nenhuma vencida":"sem meios em contagem")));
    }
  }catch(err){ push("Leitura incompleta", "algumas verificações não puderam ser compostas: "+String(err).slice(0,80)); }
  return out;
}

function renderTurno(){
  const box = $("tn-celulas"); if(!box) return;
  const t = turnoObj();
  if($("tn-eq") && document.activeElement!==$("tn-eq")) $("tn-eq").value = t.equipa||"";
  if($("tn-ini") && document.activeElement!==$("tn-ini")) $("tn-ini").value = t.inicio||"";
  const h = horasDeTurno();
  const dec = $("tn-dec");
  if(dec){
    dec.textContent = h===null? "GDH de início por preencher" : fmtH(h) + (h>=LIMITE_TURNO_H? " — acima das 12 h":"");
    dec.style.borderLeftColor = h===null? "var(--line)" : (h>=LIMITE_TURNO_H? "var(--fogo)" : (h>=LIMITE_TURNO_H-2? "var(--terra)":"var(--madeira)"));
  }
  box.innerHTML = '<div class="grid g2">' + CELULAS_PCO().map(c=>`
    <div class="sub" data-cel="${c.k}"><span class="stit">${esc(c.n)} <span class="hint" style="font-weight:400">${esc(c.r)}</span></span>
      <div class="grid g2">
        <div><label for="tn-n-${c.k}">Quem assegura</label><input id="tn-n-${c.k}" data-tn="${c.k}" data-f="n" value="${esc(t.celulas[c.k].n||"")}" placeholder="posto, nome"></div>
        <div><label for="tn-c-${c.k}">Contacto</label><input id="tn-c-${c.k}" data-tn="${c.k}" data-f="ct" value="${esc(t.celulas[c.k].ct||"")}" placeholder="telemóvel" inputmode="tel"></div>
      </div>
    </div>`).join("") + '</div>';
  box.querySelectorAll("[data-tn]").forEach(el=>el.addEventListener("change", ()=>{
    turnoObj().celulas[el.dataset.tn][el.dataset.f] = el.value.trim();
    persistir(false);
  }));
  renderQuadroTurno();
  renderHistTurno();
}

function renderQuadroTurno(){
  const q = $("tn-quadro"); if(!q) return;
  const t = turnoObj();
  q.innerHTML = CELULAS_PCO().map(c=>{
    const P = pendenciasCelula(c.k);
    return `<div class="sub" data-cel="${c.k}">
      <span class="stit">${esc(c.n)} <span class="hint" style="font-weight:400">${esc(c.r)}</span>${t.celulas[c.k].n? ' — <b>'+esc(t.celulas[c.k].n)+'</b>':''}</span>
      <dl class="tn-l">${P.map(x=>`<dt>${esc(x.t)}</dt><dd class="${x.falta?"falta":""}">${Array.isArray(x.x)? "<ul>"+x.x.map(i=>`<li>${esc(i)}</li>`).join("")+"</ul>" : esc(x.x)}</dd>`).join("")}</dl>
      <div class="tn-posse">
        <span class="tn-pt">Possui ${(function(){ const R=ramosDaCelula(c.k); return R.length+" ramo"+(R.length===1?"":"s"); })()}</span>
        ${ramosDaCelula(c.k).map(r=>`<span class="tn-ramo" title="${esc(r.d)} — ${esc(r.r)}">${esc(r.p)}</span>`).join("")}
        <button class="btn btn-g" type="button" data-expcel="${c.k}">Exportar o que esta célula possui</button>
      </div>
      <label for="tn-nota-${c.k}">Notas da célula para quem entra</label>
      <textarea id="tn-nota-${c.k}" data-tnota="${c.k}" rows="2" placeholder="o que a aplicação não pode saber">${esc(t.celulas[c.k].nota||"")}</textarea>
    </div>`;
  }).join("");
  q.querySelectorAll("[data-tnota]").forEach(el=>el.addEventListener("change", ()=>{
    turnoObj().celulas[el.dataset.tnota].nota = el.value.trim(); persistir(false);
  }));
  q.querySelectorAll("[data-expcel]").forEach(b=>b.addEventListener("click", ()=>exportarCelula(b.dataset.expcel)));
  /* Nem um ramo do estado nem um cartão da interface podem ficar sem célula: a posse
     por célula é a base da entrega de turno e da exportação, e um cartão que ninguém
     encontra é o mesmo defeito visto do outro lado.

     A `auditarArrumacao` existia e não era chamada por ninguém — declarava-se defeito
     visível e não se via em lado nenhum. Passa a acender o mesmo aviso que a posse. */
  try{
    const a = auditarPosse(O), c = auditarArrumacao(), av = document.getElementById("tn-orfaos");
    if(av){
      const partes = [];
      if(a.orfaos.length) partes.push(a.orfaos.length+" ramo(s) do estado sem célula atribuída — "+a.orfaos.slice(0,6).join(", "));
      if(a.duplicados.length) partes.push("ramo(s) com dois donos — "+a.duplicados.join(", "));
      if(c.semCelula.length) partes.push(c.semCelula.length+" cartão(ões) fora de célula — "+c.semCelula.slice(0,6).join(", "));
      if(c.semCartao.length) partes.push("célula declarada para cartão inexistente — "+c.semCartao.slice(0,6).join(", "));
      if(c.semNorma.length) partes.push("cartão(ões) sem norma declarada — "+c.semNorma.slice(0,6).join(", "));
      av.style.display = partes.length? "block" : "none";
      av.className = "msg err";
      if(partes.length) av.textContent = "Posse por confirmar: " + partes.join(" · ");
    }
  }catch(e){}
}

function renderHistTurno(){
  const el = $("tn-hist"); if(!el) return;
  const t = turnoObj(), L = t.entregas||[];
  const tag = $("tn-hist-tag"); if(tag) tag.textContent = L.length + (L.length===1? " registada":" registadas");
  if(!L.length){ el.innerHTML = '<p class="hint">Nenhuma passagem registada nesta ocorrência.</p>'; return; }
  el.innerHTML = L.slice().reverse().map(x=>`<div class="sub">
    <span class="stit">${esc(x.g)} — ${esc(x.de||"—")} entrega a ${esc(x.para||"—")}${x.horas? " · turno de "+esc(fmtH(x.horas)):""}</span>
    <dl class="tn-l">${(x.celulas||[]).map(c=>`<dt>${esc(c.n)}</dt><dd>${esc(c.quem||"—")}${c.nota? " · "+esc(c.nota):""}<br><span class="hint">${esc((c.pendencias||[]).map(p=>p.t+": "+(Array.isArray(p.x)? p.x.join("; ") : p.x)).join(" · "))}</span></dd>`).join("")}</dl>
  </div>`).join("");
}

function fecharTurno(){
  const t = turnoObj();
  const para = ($("tn-eq2")? $("tn-eq2").value.trim() : "");
  if(!para){ aviso("msg-turno","err","Indica a equipa que entra antes de registar a passagem."); return; }
  const g = ($("tn-g")? $("tn-g").value.trim() : "") || gdhAgora();
  const h = horasDeTurno();
  const registo = {
    g, de: t.equipa || "—", para, horas: h,
    celulas: CELULAS_PCO().map(c=>({
      k:c.k, n:c.n, quem: t.celulas[c.k].n, ct: t.celulas[c.k].ct,
      nota: t.celulas[c.k].nota, pendencias: pendenciasCelula(c.k)
    }))
  };
  t.entregas.push(registo);
  /* a equipa que entra passa a ser a corrente; as notas de célula limpam-se, as
     pessoas não, porque a rotatividade é de funções e nem todas mudam ao mesmo tempo */
  t.equipa = para; t.inicio = g;
  CELULAS_PCO().forEach(c=>{ t.celulas[c.k].nota = ""; });
  if($("tn-eq2")) $("tn-eq2").value = ""; if($("tn-g")) $("tn-g").value = "";
  fita("Passagem de turno: "+registo.de+" entrega a "+para+" ("+g+")"
    + (h!=null? "; turno de "+fmtH(h):"") + "; " + registo.celulas.length + " células declaradas");
  O.evolucao.push({g, tipo:"posit", txt:"Passagem de turno do PCO: "+registo.de+" entrega a "+para+", com estado e pendências declarados por célula."});
  aviso("msg-turno","ok","Passagem registada. O turno corrente passa a ser "+para+".");
  renderTurno(); pintarDON(); persistir(false);
}


/* ██████ ARRANQUE ██████ */
