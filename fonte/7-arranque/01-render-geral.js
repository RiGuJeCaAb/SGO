/* ================= ARRANQUE · render geral ================= */
function pintarTudo(){
  try{ renderTurno(); }catch(e){}
  pintarArquivo(); try{ renderCheck(); }catch(e){}
  try{ autoNivelDECIR(); renderPCO(); renderComs(); renderCatalogo(); pintarDON(); renderVigor(); renderEstadoPEA(); pintarAmpulhetas(); pintarPerfil(); }catch(e){}
  try{ pintarEvoCtx(); }catch(e){}
  try{ pintarGuia(); }catch(e){}
  try{ pintarAvisos(); }catch(e){}
  $("occ-tag").innerHTML = O.meta.num? `Ocorrência <b>${esc(O.meta.num)}</b> · ${O.peas.length} PEA · ${O.evolucao.length} registos` : "sem ocorrência carregada";
  $("evo-count").textContent = O.evolucao.length+" registos";
  $("evo-list").innerHTML = O.evolucao.length? O.evolucao.slice().reverse().map(e=>
    `<div class="evo-i tipo-${esc(e.tipo)}"><div class="g">${esc(e.g)}</div><div class="tp">${esc(e.tipo)}</div><div class="t">${esc(e.txt)}</div></div>`).join("")
    : '<p class="hint">Sem registos. Cada novo PEA incorpora automaticamente os registos posteriores ao PEA anterior.</p>';
  $("prox-n").textContent = "n.º "+(O.peas.length+1);
  const apr = O.peas.filter(p=>estadoPEA(p)==="aprovado").length;
  $("pea-count").textContent = O.peas.length+" elaboradas · "+apr+" aprovadas";
  $("pea-list").innerHTML = O.peas.length? O.peas.slice().reverse().map(p=>
    `<div class="pea-li" onclick="verPEA(${p.n})"><div class="nn">${p.n}</div><div class="info"><b>PEA n.º ${p.n}</b><p>${esc(p.g)} · janela ${p.met.janela? p.met.janela.inicio+"–"+p.met.janela.fim : "—"} · ${p.n>1? "substitui o n.º "+(p.n-1):"inicial"}</p></div><div class="modo">${esc(PEA_ROT[estadoPEA(p)])}</div></div>`).join("")
    : '<p class="hint">Nenhuma proposta elaborada nesta ocorrência.</p>';
  $("fita").innerHTML = "<tr><th style='text-align:left;color:var(--tx2);font-size:11px;padding:6px 10px'>GDH</th><th style='text-align:left;color:var(--tx2);font-size:11px'>Evento</th></tr>"+
    O.fita.slice().reverse().map(f=>`<tr><td>${esc(f.g)}</td><td>${esc(f.e)}</td></tr>`).join("");
  try{ pintarEncerramento(); }catch(e){}
}

function letrasV(txt){
  return txt.toUpperCase().split("").map(c=>c===" "? '<span style="height:7px"></span>' : c).join("<br>");
}
window.verPEA = function(n){
  const p=O.peas.find(x=>x.n===n); if(!p) return;
  const _pc = pecas(p);
  const plan = _pc.pea;                                  /* célula de planeamento — art. 27.º */
  const ops  = Object.assign({}, _pc.pea, _pc.ordens);   /* + ordens de missão — art. 17.º, al. c) */
  const linhas=p.serie.map(s=>{
    const cls = s.rh>=50? ' style="background:#EAF6EA"' : (s.rh<=20? ' style="background:#FBEAEA"' : "");
    return `<tr${cls}><td>${esc(s.d.slice(0,5))} ${hh(s.h)}</td><td>${s.t}</td><td>${s.rh}</td><td>${card(s.wd)}</td><td>${s.ws}</td><td>${s.pr||0}</td></tr>`;}).join("");
  const evoBloco = p.n>1 ? (()=>{ const prev=O.peas.find(x=>x.n===p.n-1);
      const regs=O.evolucao.slice(prev?prev.evoIdx:0, p.evoIdx);
      return regs.length? `<div class="evohist"><b>Evolução incorporada desde o PEA n.º ${p.n-1}:</b><br>${regs.map(e=>esc(e.g)+" ["+esc(e.tipo)+"] "+esc(e.txt)).join("<br>")}</div>`:""; })() : "";
  const setoresDash = (p.dados&&p.dados.setores)? p.dados.setores.split(/\n/).map(l=>{
    const m2 = l.match(/^Setor (\S+) — ([^;]+);?\s*(.*)$/);
    if(!m2) return `<p style="margin-bottom:4px">${esc(l)}</p>`;
    const est = m2[2].trim();
    const cls = (est.startsWith("Em curso")||est==="Reativação")? "fa" : (est.startsWith("Em resolução")? "ec":"rv");
    let det = m2[3]||"", meios="";
    const mm = det.match(/(\d+ meios \/ \d+ op\.)/);
    if(mm){ meios = mm[1]; det = det.replace(mm[1],"").replace(/;\s*$/,"").replace(/;\s*;/g,";").trim().replace(/;$/,""); }
    return `<div class="pd-set"><span class="sn">Setor ${esc(m2[1])}</span><span class="se ${cls}">${esc(est)}</span><span class="sd">${esc(det)}</span>${meios? `<span class="sm">${esc(meios)}</span>`:""}</div>`;
  }).join("") : "";
  const setoresHTML = (p.dados&&p.dados.setores)? p.dados.setores.split(/\n/).map(l=>`<p style="margin-bottom:4px">${esc(l)}</p>`).join("") : "<p>____________________</p>";
  const missoesHTML = (ops.missoes||[]).map(m=>`<tr><td style="font-weight:700;color:${m.tipo&&m.tipo.includes("decisiva")?"#C00000":"#005CA9"}">${esc(m.tipo||"")}</td><td>${esc(m.texto||"")}</td><td>${esc(m.atribuida||"")}</td><td style="font-weight:700">${esc(m.gdh||"")}</td></tr>`).join("");
  const jan = p.met.janela;
  $("pea-view").innerHTML = `
    <div class="row no-print" style="margin-top:8px;justify-content:flex-end">
      <span class="occ-tag">Redação: <b>${esc(p.modo)}</b></span>
      <button class="btn btn-b" onclick="window.print()">Imprimir / PDF</button>
    </div>
    <div class="pea-dash">
      <div class="pd-head">
        <span class="n">PEA ${p.n}</span>
        <span class="t">${esc(PEA_ROT[estadoPEA(p)])} — Ocorrência ${esc(p.meta.num)}</span>
        <span class="meta">${esc(p.meta.local)} · PCO ${esc(p.meta.pco)} · Fase ${esc(p.meta.fase)} · ${esc((p.dados&&p.dados.area)||"—")} ha · Elaborado ${esc(p.g)} · ${p.n>1? "substitui o n.º "+(p.n-1):"inicial"} · Validade proposta: ${jan? jan.fim+" (fecho da janela)":"a determinar"}${(p.meta.lat&&p.meta.lon)? " · "+fmtGMS(+p.meta.lat,true)+" "+fmtGMS(+p.meta.lon,false):""}</span>
      </div>
      <div class="pd-grid">
        <div class="pd pd-plan"><span class="pt">Célula de Planeamento · <b>Situação</b></span>
          <div class="pd-body">
            ${evoBloco? evoBloco.replace('class="evohist"','class="pd-evo"'):""}
            <div class="pd-in"><p><span style="color:var(--fogo);font-weight:700">POSIT:</span> ${esc(plan.situacao||"")}</p></div>
          </div>
        </div>
        <div class="pd pd-plan"><span class="pt">Célula de Planeamento · <b>Análise das ZI</b></span>
          <div class="pd-body"><div class="pd-in">
            <p>${esc(plan.analise_zi||"")}</p>
            ${(p.dados&&p.dados.sensiveis)? "<p><b>Sensíveis:</b> "+esc(p.dados.sensiveis)+"</p>":""}
            ${(p.dados&&p.dados.topo&&(p.dados.topo.orient||p.dados.topo.declive))? "<p><b>Relevo:</b> exposição "+esc(p.dados.topo.orient||"—")+" · declive "+esc(p.dados.topo.declive||"—")+"</p>":""}
          </div></div>
        </div>
        <div class="pd pd-plan"><span class="pt">Célula de Planeamento · <b>Previsão</b></span>
          <div class="rel-chips" style="margin-top:0">
            <div class="rel-c"><div class="k">Janela</div><div class="v" style="color:${p.met.janela?'var(--madeira)':'var(--fogo)'}">${p.met.janela? p.met.janela.inicio+"–"+p.met.janela.fim:"—"}</div></div>
            <div class="rel-c"><div class="k">HR mínima</div><div class="v" style="color:var(--fogo)">${p.met.hr_min.v} %</div></div>
            <div class="rel-c"><div class="k">T máxima</div><div class="v" style="color:var(--laranja)">${p.met.t_max.v} °C</div></div>
            <div class="rel-c"><div class="k">Rotações</div><div class="v">${p.met.rotacoes.length}</div></div>
            <div class="rel-c"><div class="k">Convectivo</div><div class="v" style="color:${p.met.convectivo.length?'var(--fogo)':'var(--madeira)'}">${p.met.convectivo.length?"SIM":"não"}</div></div>
          </div>
          <div class="pd-body"><div class="pd-in"><p>${esc(plan.previsao||"")}</p></div></div>
          <details><summary>Tabela horária do instantâneo meteorológico (${p.serie.length} h)</summary>
            <table class="pd-t" style="margin-top:8px"><tr><th>GDH</th><th>T °C</th><th>HR %</th><th>Vento</th><th>km/h</th><th>mm</th></tr>
            ${p.serie.map(sr=>`<tr><td>${esc(sr.d.slice(0,5))} ${hh(sr.h)}</td><td>${sr.t}</td><td>${sr.rh}</td><td>${card(sr.wd)}</td><td>${sr.ws}</td><td>${sr.pr||0}</td></tr>`).join("")}</table>
          </details>
        </div>
        ${setoresDash? `<div class="pd pd-ops"><span class="pt">Célula de Operações · <b>Organização do TO</b></span>${setoresDash}</div>`:""}
        <div class="pd pd-plan"><span class="pt">Célula de Planeamento · <b>Segurança das forças</b></span>
          <div class="pd-body"><div class="pd-in">${(plan.seguranca||[]).map(x=>`<p>${esc(x)}</p>`).join("")}</div></div>
        </div>
        <div class="pd pd-plan"><span class="pt">Célula de Planeamento · <b>Prioridades táticas</b></span>
          ${(plan.propostas||[]).map(x=>`<div class="pd-p"><span class="pid">${esc(x.id)}</span>${esc(x.texto)}<span class="fund">Fundamento: ${esc(x.fundamento||"")}</span></div>`).join("")}
        </div>
        ${(p.don&&p.don.filter(x=>x.n!=="ok").length)? `<div class="pd pd-ops"><span class="pt">Verificações de conformidade · <b>DON n.º 2 / DECIR 2026</b></span>
          <div class="pd-body">${p.don.filter(x=>x.n!=="ok").map(x=>`<div class="pd-don ${x.n}">
            <div class="dt"><span class="dn">${x.n==="ob"?"Obrigação legal":"Antecipação"}</span>${esc(x.t)}</div>
            <div class="dl"><span class="dk">Situação</span><div class="dv">${esc(x.s||"")}</div></div>
            <div class="dl"><span class="dk">Determinação</span><div class="dv">${esc(x.a||"")}</div></div>
            <div class="dr">${esc(x.r)}</div>
          </div>`).join("")}</div>
        </div>`:""}
        <div class="pd-obj"><span class="pt">Objetivo</span>${esc(ops.objetivo||"")}</div>
        <div class="pd pd-ops"><span class="pt">Missões</span>
          <table class="pd-t"><tr><th style="width:14%">Tipo</th><th>Missão</th><th style="width:22%">Atribuída a</th><th style="width:13%">Até (GDH)</th></tr>
          ${(ops.missoes||[]).map(m2=>`<tr><td class="${(m2.tipo||"").includes("decisiva")?"dec":"mold"}">${esc(m2.tipo||"")}</td><td>${esc(m2.texto||"")}</td><td>${esc(m2.atribuida||"")}</td><td><b>${esc(m2.gdh||"")}</b></td></tr>`).join("")}</table>
        </div>
        ${(p.pco&&p.pco.funcoes&&p.pco.funcoes.length)? `<div class="pd pd-ops"><span class="pt">Célula de Operações · <b>Estrutura do posto de comando</b></span>
          <table class="pd-t"><tr><th style="width:32%">Função</th><th>Quem ocupa</th><th style="width:16%">Contacto</th><th style="width:16%">Canal</th><th style="width:15%">Nomeado</th></tr>
          ${p.pco.funcoes.map(f=>`<tr><td><b>${esc(f.f)}</b></td><td>${esc(f.nome||"—")}${f.entidade? " · "+esc(f.entidade):""}</td><td>${esc(f.ct||"—")}</td><td>${esc(f.siresp||"—")}</td><td>${esc(f.g||"—")}</td></tr>`).join("")}</table>
        </div>`:""}
        ${(p.pco&&p.pco.canais&&p.pco.canais.cmd)? `<div class="pd pd-log"><span class="pt">Logística e Finanças · <b>Plano de comunicações</b></span>
          <table class="pd-t"><tr><th style="width:18%">Nível</th><th>Âmbito</th><th style="width:22%">SIRESP</th><th style="width:18%">Banda alta</th></tr>
            ${(!p.pco.canais.niveis || p.pco.canais.niveis.comando)? `<tr><td><b>Comando</b></td><td>COS, células do PCO e ligação ao CSREPC</td><td>${esc(p.pco.canais.cmd)}</td><td>${esc(p.pco.canais.ba||"—")}</td></tr>`:""}
            ${(!p.pco.canais.niveis || p.pco.canais.niveis.tatico)? `<tr><td><b>Tático</b></td><td>Comandantes de setor, de frente e de área, e coordenadores</td><td>${esc(p.pco.canais.tat||"—")}</td><td>${esc(p.pco.canais.tatba||"—")}</td></tr>`+
              ((p.dados&&p.dados.est&&p.dados.est.setores)||[]).map((s,i)=>s.tat? `<tr><td><b>Tático</b></td><td>Setor ${esc(NOMES_SETOR[i])}${s.cmd? " — "+esc(s.cmd):""}</td><td>${esc(s.tat)}</td><td>${esc(s.tatba||"—")}</td></tr>`:"").join("") :""}
            ${((!p.pco.canais.niveis || p.pco.canais.niveis.manobra)? ((p.dados&&p.dados.est&&p.dados.est.setores)||[]).map((s,i)=>s.siresp? `<tr><td><b>Manobra</b></td><td>Equipas do setor ${esc(NOMES_SETOR[i])}${s.cmd? " — "+esc(s.cmd):""}</td><td>${esc(s.siresp)}</td><td>${esc(s.ba||"—")}</td></tr>`:"").join("") : "")}
            ${((!p.pco.canais.niveis || p.pco.canais.niveis.aereo) && (p.pco.canais.aero||p.pco.canais.opar||p.pco.canais.cmar))? `<tr><td><b>Aéreo</b></td><td>Ligação terra/ar/terra${p.pco.canais.aero? " — frequência do ar "+esc(p.pco.canais.aero)+" (prioritária)":""}</td><td>${esc(p.pco.canais.opar||"—")}</td><td>${esc(p.pco.canais.cmar||"—")}</td></tr>`:""}
          </table>
          ${p.meta&&p.meta.distrito? `<p style="margin-top:8px">Grupos de conversação da pasta DISTRITO OP — ${esc(p.meta.distrito)}.</p>`:""}
        </div>`:""}
        <div class="pd pd-log"><span class="pt">Logística e Finanças · <b>Plano logístico</b></span>
          <table class="pd-t"><tr><th style="width:32%">Localização</th><th>Estado</th></tr>
            <tr><td><b>Ponto de Trânsito</b> (art. 7.º)</td><td>ATIVO — entrada do TO; reporta ao oficial de logística e finanças</td></tr>
            <tr><td><b>Local Estratégico de Reserva</b></td><td>${jan? "Pré-posicionamento 2 h antes da janela ("+jan.inicio+")":"A definir"}</td></tr>
            <tr><td><b>Área de Alimentação</b></td><td>${jan? "Reforço no início da janela ("+jan.inicio+")":"Conforme plano"}</td></tr>
            <tr><td><b>Apoio Médico-Sanitário</b></td><td>EPCO INEM no PCO; prevenção CVP/SIV</td></tr></table>
          <p style="margin-top:10px"><b>Validade e revisão:</b> ${esc(ops.validade||"")}</p>
          ${p.dados&&p.dados.anexos&&p.dados.anexos.length? `<p><b>Anexos (referência):</b> ${p.dados.anexos.map(esc).join("; ")}</p>`:""}
        </div>
      </div>
    </div>
    <div class="paper">
      <div class="p-tit">${estadoPEA(p)==="aprovado"? "Plano Estratégico de Ação n.º "+p.n : "Proposta de Plano Estratégico de Ação n.º "+p.n}</div>
      <div class="p-sub">Ocorrência n.º ${esc(p.meta.num)} — Classificação 3102 (Incêndio Rural)</div>
      <div class="p-sub2">${esc(p.meta.local||"")}${p.meta.pco? " · "+esc(p.meta.pco):""}</div>
      <div class="p-apr">${estadoPEA(p)==="aprovado"
        ? "Aprovado e determinado por "+esc((p.aprovacao.funcao||"COS")+" "+p.aprovacao.por)+" — "+esc(p.aprovacao.g)
        : "Aprovado — O COS: ____________________"}</div>
      <div class="p-rodape"><span>PEA n.º ${p.n} — Ocorrência ${esc(p.meta.num||"")}${p.meta.local? " · "+esc(p.meta.local):""}</span><span>Este documento tem carácter: RESERVADO</span></div>
      <div class="hz">${"<i></i>".repeat(36)}</div>
      <table class="p-cab">
        <tr><td class="l">Elaborado (GDH):</td><td>${esc(p.g)}</td><td class="l">Nome do COS:</td><td>${estadoPEA(p)==="aprovado" && p.aprovacao.por? esc(p.aprovacao.por) : "____________________"}</td></tr>
        <tr><td class="l">Válido até (GDH):</td><td>${jan? jan.fim+" (proposta — fecho da janela; confirmação do COS)" : "____________________"}</td><td class="l">Substitui o PEA:</td><td>${p.n>1? "N.º "+(p.n-1):"N.º 0 (inicial)"}</td></tr>
      </table>
      <table class="p-pco"><tr>
        <td class="azul" style="width:9%">PCO</td>
        <td class="cz" style="width:8%">Fase</td><td style="width:7%">${esc(p.meta.fase)}${p.nivelDECIR? " · DECIR "+esc(p.nivelDECIR):""}</td>
        <td class="cz" style="width:13%">Coordenadas</td>
        <td style="width:30%;white-space:nowrap">${(p.meta.lat&&p.meta.lon)? fmtGMS(+p.meta.lat,true)+"&nbsp;&nbsp;"+fmtGMS(+p.meta.lon,false) : "____________"}</td>
        <td class="cz" style="width:8%">Local</td><td>${esc(p.meta.pco)}</td>
      </tr></table>

      <div class="cel pl">
      <div class="cel-tit">Célula de Planeamento</div>
      
        <div class="cel-v vd">${letrasV("CÉLULA DE PLANEAMENTO")}</div>
        <div class="cel-body">
          <div class="cel-row"><div class="cel-lab">Situação</div><div class="cel-con">
            ${evoBloco}
            <p><span class="pos2">POSIT:</span> ${esc(plan.situacao||"")}</p>
            <p>Local: ${esc(p.meta.local)} · Área estimada: ${esc((p.dados&&p.dados.area)||"—")} ha${(p.dados&&p.dados.perimNome)? " · Perímetro: "+esc(p.dados.perimNome):""}</p>
          </div></div>
          <div class="cel-row"><div class="cel-lab">Análise das ZI</div><div class="cel-con"><p>${esc(plan.analise_zi||"")}</p>
            ${(p.dados&&p.dados.sensiveis)? "<p><b>Aglomerados / pontos sensíveis:</b> "+esc(p.dados.sensiveis)+"</p>":""}
          </div></div>
          <div class="cel-row"><div class="cel-lab">Previsão</div><div class="cel-con">
            <p>${esc(plan.previsao||"")}</p>
            <table class="t-of"><tr><th>GDH</th><th>T °C</th><th>HR %</th><th>Vento</th><th>km/h</th><th>mm</th></tr>${linhas}</table>
          </div></div>
          <div class="cel-row"><div class="cel-lab">Objetivo</div><div class="cel-con"><div class="obj2"><span class="al">Objetivo:</span> ${esc(plan.objetivo||"")}</div></div></div>
          <div class="cel-row"><div class="cel-lab">Prioridades táticas</div><div class="cel-con">
            ${(plan.propostas||[]).map(x=>`<p><span class="pid2">${esc(x.id)}</span> — ${esc(x.texto)} <span class="fund2">Fundamento: ${esc(x.fundamento||"")}</span></p>`).join("")}
          </div></div>
          <div class="cel-row"><div class="cel-lab">Segurança das forças</div><div class="cel-con">
            ${(plan.seguranca||[]).map(x=>`<p>• ${esc(x)}</p>`).join("")}
          </div></div>
        </div>
      </div>

      <div class="cel op">
      <div class="cel-tit">Célula de Operações</div>
      
        <div class="cel-v az">${letrasV("CÉLULA DE OPERAÇÕES")}</div>
        <div class="cel-body">
          <div class="cel-row"><div class="cel-lab">Organização do TO</div><div class="cel-con">${setoresHTML}</div></div>
          <div class="cel-row"><div class="cel-lab">Ordens de missão</div><div class="cel-con">
            <table class="t-of"><tr><th style="width:14%"></th><th>Missão</th><th style="width:22%">Atribuída a</th><th style="width:14%">Até (GDH)</th></tr>${missoesHTML}</table>
          </div></div>
        </div>
      </div>

      ${(p.don&&p.don.filter(x=>x.n==="ob").length)? `<table class="t-of"><tr><th class="lr" style="width:26%">Verificações da DON n.º 2 / DECIR 2026</th><th class="lr">Determinação</th></tr>
        ${p.don.filter(x=>x.n==="ob").map(x=>`<tr><td><b>${esc(x.t)}</b><br><span style="font-size:9px">${esc(x.r)}</span></td><td>${esc(x.s||"")}<br><b>Determinação:</b> ${esc(x.a||"")}</td></tr>`).join("")}</table>`:""}

      <div class="cel lg">
      <div class="cel-tit">Célula de Logística e Finanças — Plano Logístico</div>
      
        <div class="cel-v lr">${letrasV("LOGÍSTICA E FINANÇAS")}</div>
        <div class="cel-body">
          <div class="cel-row"><div class="cel-lab">Plano Logístico</div><div class="cel-con">
            <table class="t-of"><tr><th class="lr" style="width:34%">Localização</th><th class="lr">Estado</th></tr>
              <tr><td><b>Ponto de Trânsito</b> (obrigatório — art. 7.º)</td><td>ATIVO — entrada do TO; reporta ao oficial de logística e finanças</td></tr>
              <tr><td><b>Local Estratégico de Reserva</b></td><td>${jan? "Pré-posicionamento da reserva 2 h antes da janela ("+jan.inicio+")":"A definir pelo oficial de logística e finanças"}</td></tr>
              <tr><td><b>Área de Alimentação</b></td><td>${jan? "Reforço alimentar no início da janela ("+jan.inicio+")":"Conforme plano logístico"}</td></tr>
              <tr><td><b>Apoio Médico-Sanitário</b></td><td>EPCO INEM no PCO; prevenção CVP/SIV</td></tr>
            </table>
          </div></div>
        </div>
      </div>
      <p><b>Validade e revisão:</b> ${esc(ops.validade||"")}</p>
      ${p.dados&&p.dados.anexos&&p.dados.anexos.length? `<p><b>Anexos (referência documental):</b> ${p.dados.anexos.map(esc).join("; ")}</p>`:""}

      <p class="p-nota">Proposta gerada automaticamente (${esc(p.modo)}) a partir de métricas determinísticas, dos dados carregados e da evolução registada. Não substitui o reconhecimento do TO nem a decisão do COS — arts. 8.º, 27.º e 46.º do Despacho n.º 4067/2024 · DL n.º 90-A/2022. Projeto do Núcleo de Apoio às Operações — CSREPC DOURO, com a cooperação de Claude (Anthropic).</p>
      <div class="hz">${"<i></i>".repeat(36)}</div>
      <div class="p-res">Este documento tem carácter: <b>RESERVADO</b></div>
    </div>`;
  document.querySelectorAll(".pane").forEach(x=>x.classList.remove("print-target"));
  /* O alvo é o painel que contém a vista do PEA, não o identificador antigo:
     depois da arrumação por células a vista vive em Planeamento. */
  const vistaPEA = document.getElementById("pea-view");
  const painelPEA = (vistaPEA && vistaPEA.closest(".pane")) || $("p-planeamento") || $("p-pea");
  if(painelPEA) painelPEA.classList.add("print-target");
  if(vistaPEA) vistaPEA.scrollIntoView({behavior:"smooth"});
};

