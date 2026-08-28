/* ================= PEA em vigor =================
   O plano determinado pelo COS não é um documento fechado: vigora por um tempo,
   diverge do terreno à medida que a situação evolui e tem de ser revisto quando
   essa divergência o justifica (art. 46.º do Despacho n.º 4067/2024). */
const VERD_ROT = {
  vigor:{t:"Em vigor", d:"o plano descreve o teatro de operações"},
  atencao:{t:"Em vigor com divergências", d:"o terreno começou a afastar-se do plano"},
  rever:{t:"Revisão devida", d:"a divergência acumulada já altera a base de planeamento"},
  caducado:{t:"Caducado — revisão obrigatória", d:"esgotou-se a validade fixada na proposta"}
};
function instanteDaHora(txt){
  const h = parseInt(String(txt||"").replace(/\D/g,""),10);
  if(!isFinite(h) || h>23) return null;
  const d = new Date(); d.setMinutes(0,0,0); d.setHours(h);
  if(d.getTime() <= Date.now()) d.setDate(d.getDate()+1);
  return d.getTime();
}
/* validade: teto de 6 h, antecipado pelo fecho da janela ou pela próxima rotação de vento */
function horizonteValidade(m){
  const agora = Date.now();
  let ts = agora + 6*3600000;
  if(m && m.janela){ const f = instanteDaHora(m.janela.fim); if(f && f>agora && f<ts) ts=f; }
  if(m && m.rotacoes) m.rotacoes.forEach(r=>{ const t=instanteDaHora(r.h); if(t && t>agora && t<ts) ts=t; });
  /* um plano não nasce a expirar: mínimo de uma hora de vigência */
  return Math.max(ts, agora + 3600000);
}
function baseVigor(){
  const r = retratoOperacional();
  return { fase:O.meta.fase||"", nivel:O.meta.nivel||"",
    setores:r.setores.map(x=>({n:x.n, estado:x.estado, m:x.m})),
    m:r.c.m, op:r.c.op, ar:r.c.ar, mr:r.c.mr, reserva:r.reserva,
    pt:ptObj().des||"", cmd:canaisObj().cmd||"", tat:canaisObj().tat||"",
    evoIdx:O.evolucao.length };
}
function controloMissoes(ops){
  const out = [];
  (ops.missoes||[]).forEach((x,i)=>out.push({k:"M"+(i+1), tipo:x.tipo||"Missão", texto:x.texto||"", estado:0}));
  (ops.propostas||[]).forEach(x=>out.push({k:x.id||"P", tipo:"Proposta", texto:x.texto||"", estado:0}));
  return out;
}
function peaVigor(){ return O.peas.length? O.peas[O.peas.length-1] : null; }
function divergencia(p){
  if(!p || !p.base) return null;
  const b = p.base, r = retratoOperacional(), it = [];
  const add = (peso,t,sit,ref) => it.push({peso,t,s:sit,r:ref});
  if((O.meta.fase||"") !== b.fase)
    add(40,"Fase do SGO alterada", (b.fase||"—")+" para "+(O.meta.fase||"—"),
      "Despacho n.º 4067/2024, art. 46.º — o PEA acompanha a fase em que o SGO opera");
  if(O.meta.nivel && (O.meta.nivel||"") !== b.nivel)
    add(20,"Nível DECIR alterado", (b.nivel||"—")+" para "+O.meta.nivel, "DON n.º 2 / DECIR 2026");
  r.setores.forEach((x,i)=>{
    const a = b.setores[i];
    if(!a){ add(25,"Setor criado depois da emissão","Setor "+x.n+", "+(x.estado||"").toLowerCase(),
      "Despacho n.º 4067/2024, art. 5.º — a setorização é base do PEA"); return; }
    if(a.estado !== x.estado){
      const rea = x.estado === ESTADOS_SETOR[4];
      add(rea? 40:20, rea? "Reativação de setor":"Estado de setor alterado",
        "Setor "+x.n+": "+String(a.estado||"—").toLowerCase()+" para "+String(x.estado||"—").toLowerCase(),
        "DON n.º 2 / DECIR 2026, ponto 7.f");
    }
  });
  if(b.setores.length > r.setores.length)
    add(25,"Setores encerrados", (b.setores.length-r.setores.length)+" desde a emissão","Despacho n.º 4067/2024, art. 5.º");
  if(b.m ? Math.abs(r.c.m-b.m)/b.m >= 0.3 : r.c.m>0)
    add(20,"Dispositivo alterado em mais de 30 %", b.m+" para "+r.c.m+" meios e "+b.op+" para "+r.c.op+" operacionais",
      "Despacho n.º 4067/2024, art. 46.º — o quadro de meios é parte do plano");
  if(b.ar !== r.c.ar) add(15,"Meios aéreos alterados", b.ar+" para "+r.c.ar+" no TO","DON n.º 4 / DIRACAERO");
  if(b.mr !== r.c.mr) add(10,"Máquinas de rasto alteradas", b.mr+" para "+r.c.mr,"DON n.º 2, pontos 7.d.(22) e 7.d.(23)");
  if(b.reserva !== r.reserva) add(10,"Reserva alterada", b.reserva+" para "+r.reserva+" meios","Despacho n.º 4067/2024, art. 17.º");
  if(r.excedidas.length) add(15,"Tempos de empenhamento excedidos",
    r.excedidas.length+(r.excedidas.length===1? " unidade acima do limite":" unidades acima do limite"),
    "DON n.º 2 / DECIR 2026 — rendições");
  const novos = O.evolucao.length - (b.evoIdx||0);
  if(novos >= 3) add(10, novos+" registos de evolução desde a emissão","a situação relatada já não é a que fundamentou o plano","DON n.º 2 / DECIR 2026 — POSIT");
  if((canaisObj().cmd||"") !== b.cmd || (canaisObj().tat||"") !== b.tat)
    add(10,"Plano de comunicações alterado","canais gerais do TO diferentes dos que constam do PEA","Despacho n.º 4067/2024, art. 32.º, al. d)");
  if((ptObj().des||"") !== b.pt) add(5,"Ponto de trânsito alterado", ptObj().des||"removido","DON n.º 2, ponto 7.d.(5)");
  const score = it.reduce((t,x)=>t+x.peso,0);
  const restante = p.validoTs? p.validoTs - Date.now() : null;
  const expirado = restante !== null && restante <= 0;
  const verd = expirado? "caducado" : (score>=40? "rever" : (score>=20? "atencao":"vigor"));
  return {itens:it.sort((a,b2)=>b2.peso-a.peso), score, restante, expirado, verd,
    total: p.validoTs && p.ts? p.validoTs-p.ts : null};
}
const MS_EST = [{r:"por iniciar",c:""},{r:"em execução",c:"exec"},{r:"cumprida",c:"feita"}];
function renderVigor(){
  const C = $("pea-vigor"); if(!C) return;
  const p = peaVigor();
  if(!p){ C.innerHTML = ""; return; }
  const D = divergencia(p);
  if(!D){ C.innerHTML = ""; return; }
  if(p.ultVerd !== D.verd){
    if(p.ultVerd) fita("PEA n.º "+p.n+" — "+VERD_ROT[D.verd].t.toLowerCase()+" (divergência "+D.score+")");
    p.ultVerd = D.verd;
  }
  const emVigorH = p.ts? (Date.now()-p.ts)/3600000 : 0;
  const pct = (D.total && D.restante!==null)? Math.max(0, Math.min(100, 100*D.restante/D.total)) : 0;
  const ctrl = p.ctrl||[];
  const feitas = ctrl.filter(x=>x.estado===2).length;
  const divBloco = D.itens.length
    ? D.itens.map(x=>`<div class="dv-r ${x.peso>=25? "alta":(x.peso>=15? "media":"")}">
        <span class="dv-p">${x.peso}</span>
        <span><span class="dv-t">${esc(x.t)}</span><span class="dv-s">${esc(x.s)}</span><span class="dv-f">${esc(x.r)}</span></span>
      </div>`).join("")
    : '<p class="hint">Sem divergências registadas: o dispositivo é o que fundamentou o plano.</p>';
  const msBloco = ctrl.length
    ? ctrl.map((x,i)=>`<div class="ms-r ${x.estado===2? "feita":""}">
        <span class="ms-t"><small>${esc(x.k)} · ${esc(x.tipo)}</small>${esc(x.texto)}</span>
        <button type="button" class="ms-b ${MS_EST[x.estado].c}" data-ms="${i}">${MS_EST[x.estado].r}</button>
      </div>`).join("")
    : '<p class="hint">Esta proposta não trouxe missões com controlo de execução.</p>';
  C.innerHTML = `<div class="card">
    <h2>PEA em vigor <span class="tag">art. 46.º · aprovação e determinação pelo COS — art. 8.º, n.º 2, al. e)</span></h2>
    <div class="vg-top">
      <span class="vg-n">n.º ${p.n}<small>${esc(p.g)}</small></span>
      <span class="vg-b ${D.verd}">${VERD_ROT[D.verd].t}</span>
      <span class="vg-t">${VERD_ROT[D.verd].d}. Em vigor há <b>${fmtH(emVigorH)}</b>${
        D.expirado? "; validade esgotada" : (D.restante!==null? "; restam <b>"+fmtH(D.restante/3600000)+"</b>":"")}. Divergência acumulada <b>${D.score}</b>.</span>
      <button class="btn btn-o" type="button" id="vg-rev">Emitir revisão</button>
    </div>
    <div class="vg-bar"><i class="${D.verd}" style="width:${pct.toFixed(1)}%"></i></div>
    <div class="vg-leg"><span>emitido ${esc(p.g)}</span><span>validade até ${p.validoTs? esc(gdhDe(p.validoTs)):"—"}</span></div>
    <div class="sub">
      <span class="stit">Divergência entre o plano e o terreno</span>
      ${divBloco}
    </div>
    <div class="sub">
      <span class="stit">Controlo de execução — ${feitas} de ${ctrl.length} cumpridas</span>
      ${msBloco}
    </div>
    <p class="hint">A revisão é obrigatória à mudança de fase do SGO, ao fecho da janela operacional e sempre que a divergência altere a base de planeamento. O que aqui se marca entra na fita do tempo e alimenta a situação da proposta seguinte.</p>
  </div>`;
  const bRev = $("vg-rev");
  if(bRev) bRev.addEventListener("click", ()=>{ irPara("p-pea"); const g=$("b-gerar"); if(g){ g.scrollIntoView({block:"center"}); g.focus(); } });
  C.querySelectorAll("[data-ms]").forEach(b=>b.addEventListener("click", ()=>{
    const x = p.ctrl[+b.dataset.ms]; if(!x) return;
    x.estado = (x.estado+1)%3;
    fita("PEA n.º "+p.n+" · "+x.k+" "+MS_EST[x.estado].r+": "+x.texto.slice(0,70));
    renderVigor(); pintarDON(); persistir(false);
  }));
}
function detSituacao(novas, anterior){
  const m=metricas(), dif=diferencasDesde(anterior);
  return {
    situacao: (novas.length? novas.length+" registos de evolução incorporados desde o PEA n.º "+(anterior?anterior.n:0)+" (quadro de evolução acima). " : (anterior? "Sem registos novos desde o PEA n.º "+anterior.n+". ":"Primeiro PEA da ocorrência. "))
      + "Dispositivo à data desta proposta: " + resumoRetrato(retratoOperacional())
      + (dif.length? " Alterações desde a proposta anterior: "+dif.join("; ")+"." : (anterior? " Sem alterações no dispositivo desde a proposta anterior.":""))
      + (anterior && anterior.ctrl && anterior.ctrl.length? (()=>{
          const f = anterior.ctrl.filter(x=>x.estado===2), e = anterior.ctrl.filter(x=>x.estado===1), z = anterior.ctrl.filter(x=>x.estado===0);
          return " Execução do PEA n.º "+anterior.n+": "+f.length+" de "+anterior.ctrl.length+" missões cumpridas"
            + (e.length? "; em execução "+e.map(x=>x.k).join(", ") : "")
            + (z.length? "; por iniciar "+z.map(x=>x.k).join(", ") : "")+".";
        })() : ""),
    analise_zi: `Área de ${O.dados.area||"?"} ha com pontos sensíveis: ${O.dados.sensiveis||"a identificar"}. `
      +(ptObj().des? `Ponto de trânsito em ${ptObj().des}${ptObj().resp? ", responsável "+ptObj().resp:""}. ` : "")+(m.janela? `A meteorologia concentra a vantagem operacional na janela ${m.janela.inicio}–${m.janela.fim}; fora dela, contenção e defesa.` : "Sem janela de HR ≥ 50 %: postura defensiva contínua."),
    previsao:`HR mínima ${m.hr_min.v} % às ${m.hr_min.h} (${m.hr_min.d}); recuperação até ${m.hr_max.v} % às ${m.hr_max.h}. T máxima ${m.t_max.v} °C às ${m.t_max.h} (${m.t_max.d}). Rotações: ${m.rotacoes.map(r=>r.h+" "+r.de+"→"+r.para).join("; ")||"sem rotações relevantes"}. ${m.convectivo.length? "Assinatura convectiva às "+m.convectivo.map(c=>c.h).join(" e ")+" — risco de rajadas erráticas.":"Sem precipitação prevista."} Nota: ${m.nota}.`
  };
}
function detDecisao(novas, anterior){
  const m=metricas(), jan=m.janela, r=retratoOperacional(), dif=diferencasDesde(anterior);
  const nomes = a => a.map(x=>x.n).join(", ");
  const fimJ = jan? jan.fim : null;
  const gdhLim = (()=>{ if(!fimJ) return "______";
    const partes = (m.t_max.d||"").split("/");
    const sufixo = partes.length===3 ? MES[(+partes[1])-1]+partes[2].slice(2) : "";
    return partes[0]+fimJ.replace("h","").padStart(2,"0")+"00"+sufixo; })();
  return {
    propostas:[
      r.reativados.length&&{id:"PR",texto:`Prioridade absoluta à reativação em ${nomes(r.reativados)}: reforço imediato, reavaliação do perímetro e confirmação de rotas de fuga antes de qualquer outro empenho.`,fundamento:`Setor${r.reativados.length>1?"es":""} em reativação no quadro de estados; a reativação altera a ordem de esforço fixada na proposta anterior.`},
      (r.nAtivos===0 && r.setores.length>0)&&{id:"PC",texto:`Sem frentes ativas: transição para consolidação de rescaldo e vigilância ativa em ${nomes(r.setores)}, com desmobilização faseada a começar pelos meios com mais horas de empenhamento.`,fundamento:`Nenhum setor em curso; ${r.nResolucao} em resolução, ${r.nConclusao} em conclusão, ${r.nVigilancia} em vigilância ativa.`},
      (r.nAtivos>0 && r.reserva===0 && r.c.m>=10)&&{id:"PV",texto:`Constituição de reserva tática fora da zona de intervenção, com um mínimo de dois grupos, antes de novo empenho no esforço principal.`,fundamento:`${r.c.m} meios no TO com ${r.nAtivos} setor${r.nAtivos>1?"es":""} em curso e sem reserva constituída.`},
      (r.c.m>=10 && !r.PT.des)&&{id:"PT",texto:`Estabelecimento do ponto de trânsito e sua difusão a todos os meios em despacho, com atribuição de missão nos primeiros 15 minutos após a chegada.`,fundamento:"O pedido de reforço implica ponto de trânsito que garanta o controlo das entradas e saídas do TO — DON n.º 2, pontos 7.d.(5), 7.d.(7) e 7.d.(8)."},
      r.excedidas.length&&{id:"PH",texto:`Rendição imediata de ${r.excedidas.slice(0,3).map(x=>x.nome+" ("+x.local+", "+x.txt+")").join("; ")}${r.excedidas.length>3? " e mais "+(r.excedidas.length-3):""}.`,fundamento:"Tempo de empenhamento acima do limite; equipas exaustas degradam a segurança e o rendimento."},
      (!r.excedidas.length && r.aviso.length)&&{id:"PH",texto:`Preparar a rendição de ${r.aviso.slice(0,3).map(x=>x.nome+" ("+x.local+", "+x.txt+")").join("; ")} antes de atingirem o limite.`,fundamento:"Tempo de empenhamento em aviso; a substituição planeada evita quebras de dispositivo."},
      (r.c.mr>2 && !nomeado("COPESP"))&&{id:"PM",texto:`Nomeação do COPESP e integração das ${r.c.mr} máquinas de rasto no plano, com faixa de contenção atribuída e veículo de combate de apoio a cada máquina.`,fundamento:"Mais de duas máquinas de rasto no dispositivo — DON n.º 2, pontos 7.d.(22) e 7.d.(23)."},
      jan&&{id:"P1",texto:`Empenho da reserva no esforço principal${r.ativos.length? " em "+nomes(r.ativos):""} na janela ${jan.inicio}–${jan.fim}.`,fundamento:`HR ${jan.hr_inicio} % → ${jan.hr_max} % — mínimo de intensidade do ciclo.`},
      {id:"P2",texto:"Postura defensiva fora da janela; sem ataque direto descendente com vento de drenagem estabelecido.",fundamento:"LACES exige rotas de fuga que a encosta noturna não garante."},
      (m.alinhamento_relevo_vento&&m.alinhamento_relevo_vento.horas.length)&&{id:"PX",texto:`Nos períodos ${resumoHoras(m.alinhamento_relevo_vento.horas)}, proibição de posicionamento acima da frente nas encostas expostas a ${m.alinhamento_relevo_vento.orient}; ancoragens pelos flancos.`,fundamento:`Alinhamento fogo-declive-vento previsto (${m.alinhamento_relevo_vento.nota||"escoamento ascendente"})${m.alinhamento_relevo_vento.criticas.length? "; crítico com HR < 30 % às "+resumoHoras(m.alinhamento_relevo_vento.criticas):""}.`},
      m.rotacoes.length&&{id:"P3",texto:`Liquidação de pontos quentes concluída antes da rotação de ${m.rotacoes[m.rotacoes.length-1].h}.`,fundamento:"Após a rotação, o bordo a sotavento pode virar cabeça."},
      {id:"P4",texto:`Defesa perimétrica dos pontos sensíveis (${O.dados.sensiveis||"a validar pelo ERAS"}), confinamento/evacuação em articulação com SMPC, INEM, CVP e GNR.`,fundamento:"Art. 8.º, n.º 2, als. l) e m) do Despacho 4067/2024."},
      m.convectivo.length&&{id:"P5",texto:`Vigilância convectiva desde 2 h antes de ${m.convectivo[0].h}; retirada de zonas alinhadas se confirmada trovoada.`,fundamento:"Precipitação residual com rotação — assinatura convectiva."},
      {id:"P6",texto:`Vigias em todos os ${r.setores.length||""} setores; pontos de situação de 3 em 3 horas; rendições no início e fecho da janela.`,fundamento:`Máxima de ${m.t_max.v} °C em ${m.t_max.d} — a fase crítica exige equipas frescas.`},
      dif.length&&{id:"PD",texto:`Difusão da alteração do dispositivo aos comandantes de setor no próximo ponto de situação: ${dif.join("; ")}.`,fundamento:"As alterações registadas desde a proposta anterior mudam a base de planeamento e têm de ser conhecidas em todo o TO."}
    ].filter(Boolean).map((p,i)=>({...p, id:"P"+(i+1)})),
    objetivo: r.reativados.length
      ? `Dominar a reativação em ${nomes(r.reativados)} e restabelecer o perímetro${jan? ", com empenho da reserva na janela "+jan.inicio+"–"+jan.fim:""}.`
      : (r.nAtivos===0 && r.setores.length
        ? `Concluir o rescaldo e assegurar a vigilância ativa em ${nomes(r.setores)}, com desmobilização faseada e sem reacendimentos.`
        : (jan? `Dominar as frentes ativas${r.ativos.length? " em "+nomes(r.ativos):""} e fechar o perímetro até às ${jan.fim} de ${m.t_max.d}, com empenho da reserva na janela ${jan.inicio}–${jan.fim}.`
              : `Conter as frentes ativas${r.ativos.length? " em "+nomes(r.ativos):""} e proteger aglomerados até revisão do PEA.`)),
    missoes:[
      {tipo:"Ação decisiva",
        texto: r.reativados.length? `Dominar a reativação em ${nomes(r.reativados)} e restabelecer o perímetro.`
             : (r.nAtivos===0 && r.setores.length? "Concluir o rescaldo e consolidar a vigilância ativa, sem reacendimentos."
             : (jan? `Dominar as frentes ativas${r.ativos.length? " em "+nomes(r.ativos):""} e fechar o perímetro na janela ${jan.inicio}–${jan.fim}.`:"Conter as frentes ativas e proteger aglomerados.")),
        atribuida: r.reativados.length? "Setor"+(r.reativados.length>1?"es":"")+" "+nomes(r.reativados)+" + Reserva"
                 : (r.ativos.length? "Setor"+(r.ativos.length>1?"es":"")+" "+nomes(r.ativos)+" + Reserva" : "Setores empenhados + Reserva"),
        gdh:gdhLim},
      {tipo:"Ação de moldagem", texto:"Defesa preventiva dos aglomerados expostos; contenção defensiva no período noturno.", atribuida:"Setor da frente ativa + meios de proteção civil", gdh: jan? gdhLim:"______"},
      m.rotacoes.length? {tipo:"Ação de moldagem", texto:`Liquidação dos pontos quentes antes da rotação de ${m.rotacoes[m.rotacoes.length-1].h}.`, atribuida:"Setores em consolidação", gdh:"______"}:null,
      r.aereos? {tipo:"Ação de moldagem", texto:`Meios aéreos (${r.aereos} no TO): último ciclo nas frentes ativas até ao ocaso; reativação ao nascer do sol.`, atribuida:"Meios aéreos — OPAR/COPAR", gdh:"______"}:null,
      r.PT.des? {tipo:"Ação de moldagem", texto:`Controlo das entradas e saídas pelo ponto de trânsito em ${r.PT.des}; missão atribuída a cada equipa nos primeiros 15 minutos.`, atribuida:r.PT.resp||"Ponto de trânsito", gdh:"______"}:null,
      {tipo:"Ação de moldagem", texto:"Rendições faseadas com meios frescos no início e fecho da janela; reposicionamento antes da rotação.", atribuida:"Todos os setores + Reserva", gdh:"______"}
    ].filter(Boolean),
    seguranca:["Protocolo LACES e EPI florestal obrigatórios em todos os setores.",
      "Proibição de ataque direto descendente em encosta com catabático estabelecido sem rota de fuga confirmada.",
      ...m.rotacoes.slice(0,2).map(r=>`Máxima atenção às ${r.h} (${r.de}→${r.para}) — transição de regime, comportamento errático.`),
      ...(m.convectivo.length?["Se confirmada trovoada: retirada imediata de zonas alinhadas e suspensão de operações em cumeada."]:[]),
      "Trabalho noturno: iluminação individual, movimentação em equipa, atenção a árvores enfraquecidas."],
    validade: jan? `Validade até ${jan.fim}; revisão obrigatória no fecho da janela, a cada rotação observada e a cada agravamento registado.` : "Validade máxima 6 h; revisão a cada alteração do vento."
  };
}

/* Repartição determinística pela fronteira do Despacho n.º 4067/2024: tudo o que é
   plano vai para planeamento; só as ordens de missão ficam em operações. */
function detCompleto(novas, anterior){
  const a = detSituacao(novas, anterior), b = detDecisao(novas, anterior);
  return {
    pea: {situacao:a.situacao, analise_zi:a.analise_zi, previsao:a.previsao,
          objetivo:b.objetivo, propostas:b.propostas, seguranca:b.seguranca, validade:b.validade},
    ordens: {missoes:b.missoes}
  };
}
/* Leitura normalizada de um PEA, seja qual for o formato em que foi gravado.
   Antes da versão 2 do estado: json {plan,ops} ou json plano à raiz.
   A partir da versão 2: json {pea,ordens}. Pura — não toca no estado global,
   e por isso é utilizável de dentro de MIGRACOES. */
function pecas(p){
  const j = (p && p.json) || {};
  if(j.pea) return {pea:j.pea, ordens:j.ordens || {missoes:[]}};
  const plan = j.plan || {situacao:j.situacao, analise_zi:j.analise||"", previsao:j.previsao};
  const ops  = j.ops  || j;
  return {
    pea: {situacao:plan.situacao, analise_zi:plan.analise_zi, previsao:plan.previsao,
          objetivo:ops.objetivo, propostas:ops.propostas||[], seguranca:ops.seguranca||[], validade:ops.validade},
    ordens: {missoes:ops.missoes||[]}
  };
}
