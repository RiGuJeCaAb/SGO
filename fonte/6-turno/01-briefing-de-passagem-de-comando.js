/* ================= TURNO · briefing de passagem de comando ================= */
/* Documento de passagem, gerado a partir do que já está registado: identificação,
   dispositivo, estrutura do posto de comando, plano de comunicações, tempos de
   empenhamento, conformidade, PEA em vigor e evolução desde então.

   Determinístico, sem modelo. Não é opinião sobre a ocorrência: é o que está no
   estado, arrumado pela ordem por que se entrega um comando.

   **Não altera a ocorrência.** Nenhuma linha aqui escreve no estado, e não há ramo
   novo: o instante vem de fora, e o resultado é devolvido, não guardado. Os acessores
   que consulta podem reparar invariantes de forma — `aerLista()` mantém a contagem de
   aeronaves em sintonia com a lista, e é aí que migra ocorrências antigas —, mas isso
   acontece igualmente sempre que um painel se desenha, e nunca toca em conteúdo.

   É por isso que pode ser chamado de fora, por quem venha a construir a rotatividade
   de funções da EPCO: o briefing é o conteúdo da passagem, não o mecanismo dela. */

/** Concordância de número. É um documento que se lê em voz alta num posto de comando. */
function plural(n, singular, pluralForma){
  return n+" "+(Math.abs(+n)===1? singular : (pluralForma || singular+"s"));
}

/** Uma secção do briefing. `linhas` é o corpo; `vazia` diz se não há o que dizer. */
function seccaoBriefing(titulo, linhas, nota){
  const uteis = (linhas||[]).filter(Boolean);
  return { titulo, linhas: uteis, nota: nota||"", vazia: !uteis.length };
}

/**
 * Compõe o briefing.
 *
 * @param {number} [ts] instante da passagem; sem ele, o relógio corrente
 * @returns {{gdh:string, instante:number, ocorrencia:string, seccoes:{titulo:string,linhas:string[],nota:string,vazia:boolean}[], pendencias:string[]}}
 */
function briefingPassagem(ts){
  const instante = (ts == null? agora() : ts);
  const gdh = gdhDe(instante);
  const e = estObj(), P = pcoObj(), c = contarDispositivo();
  const ini = parseGDH(O.meta.inicio);
  const decorrido = minutosDesde(ini, instante);
  const dur = m => { const h=Math.floor(m/60), mm=m%60; return h? h+" h "+String(mm).padStart(2,"0")+" min" : mm+" min"; };

  /* ---- 1. situação ---- */
  const situacao = [
    "Ocorrência n.º "+(O.meta.num||"por registar")+(O.meta.local? " — "+O.meta.local : ""),
    O.meta.pco? "Posto de comando em "+O.meta.pco : "Posto de comando por registar",
    ini? "Início às "+O.meta.inicio+(decorrido!==null? ", decorre há "+dur(decorrido) : "")
       : "GDH de início por registar — sem ele não há contagem de prazos",
    "Fase do SGO: "+(O.meta.fase||"por declarar")+" · Nível DECIR: "+(O.meta.nivel||nivelDECIR(ini||new Date(instante))),
    O.dados.area? "Área ardida estimada: "+O.dados.area+" ha" : null,
    (O.meta.concelho||O.meta.distrito)? "Localização: "+[O.meta.concelho, O.meta.distrito].filter(Boolean).join(", ") : null
  ];

  /* ---- 2. dispositivo ---- */
  const porSetor = (e.setores||[]).map((s,i)=>{
    const t = totSetor(s);
    const meios = resumoTip(s.tip);
    return "Setor "+NOMES_SETOR[i]+" — "+(s.estado||"estado por declarar")
      + (s.cmd? ", comando "+s.cmd : ", sem comando nomeado")
      + (meios? ". Meios: "+meios : ". Sem meios registados")
      + " ("+plural(t.m,"veículo")+", "+plural(t.o,"operacional","operacionais")+").";
  });
  const RSb = reservaObj(), ZAb = zaObj();
  const dispositivo = porSetor.concat([
    e.livre && O.dados.setores? "Setorização em texto livre: "+O.dados.setores : null,
    "Totais: "+plural(c.m,"veículo")+", "+plural(c.op,"operacional","operacionais")+", "+plural(c.ar,"aeronave")
      + (c.mr? ", "+plural(c.mr,"máquina de rasto","máquinas de rasto") : "")+".",
    (RSb.m||RSb.o)? "Reserva: "+plural(RSb.m||0,"veículo")+", "+plural(RSb.o||0,"operacional","operacionais")+"." : null,
    (ZAb.m||ZAb.o)? "Zona de apoio: "+plural(ZAb.m||0,"veículo")+", "+plural(ZAb.o||0,"operacional","operacionais")+"." : null,
    (e.aerL||[]).length? "Meios aéreos: "+descreverAer(e.aerL) : null
  ]);

  /* ---- 3. estrutura do posto de comando ---- */
  const nomeadas = (P.funcoes||[]).map(f=>
    f.f+(f.nome? " — "+f.nome : "")+(f.entidade? " ("+f.entidade+")" : "")
      + (f.ct? ", "+f.ct : "")+(f.siresp? ", escuta "+f.siresp : "")
      + (f.g? ", nomeado às "+f.g : ""));
  let emFalta = [];
  try{ emFalta = funcoesExigiveis().filter(x=>!x.preenchida).map(x=>x.f+" — exigível por "+x.motivo); }
  catch(err){ emFalta = []; }

  /* ---- 4. plano de comunicações ---- */
  /* Leitura defensiva, e não `nivObj()`: esse acessor normaliza, e portanto escreve.
     Um briefing não inicializa estado — só relata o que encontra. */
  const N = (canaisObj() && canaisObj().niveis) || {comando:false,tatico:false,manobra:false,aereo:false,ba:false,tocado:false};
  const ch = canaisObj() || {cmd:"",tat:"",ba:"",tatba:"",aero:"",opar:"",cmar:"",atrib:[],niveis:null};
  const niveis = [
    N.comando? "Comando: "+(ch.cmd||"por atribuir") : null,
    N.tatico? "Tático: "+(ch.tat||"por atribuir") : null,
    N.manobra? "Manobra: por setor" : null,
    N.aereo? "Terra/ar/terra: "+(ch.aero||"por definir") : null,
    N.ba? "Banda alta em paralelo ativa" : null
  ];
  const setoresSemCanal = (e.setores||[]).map((s,i)=>({s,i})).filter(o=>!o.s.siresp)
    .map(o=>NOMES_SETOR[o.i]);

  /* ---- 5. tempos e rendições ---- */
  let R = [];
  try{ R = rendicoes(instante); }catch(err){ R = []; }
  const vencidas = R.filter(x=>x.nivel==="r"), proximas = R.filter(x=>x.nivel==="a");
  const tempos = [
    vencidas.length? "Rendição vencida: "+vencidas.map(x=>x.nome+" ("+x.local+"), "+x.txt).join("; ")+"." : null,
    proximas.length? "Rendição a preparar: "+proximas.map(x=>x.nome+" ("+x.local+"), "+x.txt).join("; ")+"." : null,
    (R.length && !vencidas.length && !proximas.length)? plural(R.length,"meio")+" em contagem; o mais antigo há "+R[0].txt+"." : null,
    !R.length? "Sem instantes de empenhamento registados — não há projeção de rendições." : null
  ];

  /* ---- 6. conformidade ---- */
  let don = [];
  try{ don = verificacoesDON(instante); }catch(err){ don = []; }
  const obrigacoes = don.filter(x=>x.n==="ob");
  const avisosDON = don.filter(x=>x.n==="av");

  /* ---- 7. PEA em vigor e evolução ---- */
  const ultimo = O.peas.length? O.peas[O.peas.length-1] : null;
  const restante = (ultimo && ultimo.validoTs)? (ultimo.validoTs - instante)/3600000 : null;
  const pea = [
    ultimo? "PEA n.º "+ultimo.n+", emitido às "+ultimo.g+(ultimo.modo? " ("+ultimo.modo+")" : "") : "Nenhum PEA emitido.",
    (restante !== null)? (restante > 0
      ? "Validade: mais "+fmtH(restante)+"."
      : "Validade excedida há "+fmtH(-restante)+" — revisão devida.") : null
  ];
  const desde = (()=>{ try{ return evoDesdeUltimoPEA(); }catch(err){ return []; } })();
  const evolucao = desde.slice(-8).map(x=>x.g+" — "+(x.t||x.e||""));

  /* ---- 8. o que fica por decidir ---- */
  const pendencias = []
    .concat(obrigacoes.map(x=>x.t+" — "+x.a))
    .concat(emFalta.length? ["Funções do PCO por nomear: "+emFalta.join("; ")] : [])
    .concat(setoresSemCanal.length? ["Setores sem canal de manobra: "+setoresSemCanal.join(", ")] : [])
    .concat(vencidas.length? ["Rendições vencidas por solicitar ao CSREPC"] : [])
    .concat((restante !== null && restante <= 0)? ["Emitir revisão do PEA: a validade está excedida"] : []);

  return {
    gdh, instante,
    ocorrencia: (O.meta.num||"sem número")+(O.meta.local? " — "+O.meta.local : ""),
    seccoes: [
      seccaoBriefing("1. Situação", situacao),
      seccaoBriefing("2. Dispositivo", dispositivo),
      seccaoBriefing("3. Estrutura do posto de comando", nomeadas,
        emFalta.length? "Por nomear: "+emFalta.join("; ") : ""),
      seccaoBriefing("4. Plano de comunicações", niveis,
        setoresSemCanal.length? "Sem canal de manobra: setores "+setoresSemCanal.join(", ") : ""),
      seccaoBriefing("5. Tempos de empenhamento", tempos),
      seccaoBriefing("6. Conformidade", obrigacoes.map(x=>"OBRIGAÇÃO — "+x.t+": "+x.s)
        .concat(avisosDON.map(x=>"Aviso — "+x.t+": "+x.s)),
        don.length? "" : "Nenhuma verificação disponível."),
      seccaoBriefing("7. PEA em vigor", pea),
      seccaoBriefing("8. Evolução desde o último PEA", evolucao,
        desde.length > 8? "Mostrados os últimos 8 de "+desde.length+" registos." : "")
    ],
    pendencias
  };
}

/** O briefing em texto corrido, para ler em voz alta ou colar noutro sítio. */
function textoBriefing(b){
  const linhas = [
    "BRIEFING DE PASSAGEM DE COMANDO",
    b.ocorrencia,
    "Elaborado às "+b.gdh,
    ""
  ];
  b.seccoes.forEach(s=>{
    linhas.push(s.titulo);
    if(s.vazia) linhas.push("  Sem registo.");
    else s.linhas.forEach(l=>linhas.push("  "+l));
    if(s.nota) linhas.push("  "+s.nota);
    linhas.push("");
  });
  linhas.push("O QUE FICA POR DECIDIR");
  if(!b.pendencias.length) linhas.push("  Nada em aberto no momento da passagem.");
  else b.pendencias.forEach((p,i)=>linhas.push("  "+(i+1)+". "+p));
  return linhas.join("\n");
}

/** Desenha o briefing no painel próprio. */
function pintarBriefing(b){
  const el = $("br-doc"); if(!el) return;
  el.innerHTML =
    '<div class="br-cab"><b>Briefing de passagem de comando</b>'
    + '<span class="hint" style="margin:0">'+esc(b.ocorrencia)+' · elaborado às '+esc(b.gdh)+'</span></div>'
    + b.seccoes.map(s=>
        '<div class="br-s"><span class="stit">'+esc(s.titulo)+'</span>'
        + (s.vazia? '<p class="hint" style="margin:4px 0 0 0">Sem registo.</p>'
                  : '<ul style="margin:6px 0 0 18px">'+s.linhas.map(l=>'<li>'+esc(l)+'</li>').join("")+'</ul>')
        + (s.nota? '<p class="hint" style="margin:6px 0 0 0">'+esc(s.nota)+'</p>' : '')
        + '</div>').join("")
    + '<div class="br-s br-pend"><span class="stit">O que fica por decidir</span>'
    + (b.pendencias.length
        ? '<ol style="margin:6px 0 0 18px">'+b.pendencias.map(p=>'<li>'+esc(p)+'</li>').join("")+'</ol>'
        : '<p class="hint" style="margin:4px 0 0 0">Nada em aberto no momento da passagem.</p>')
    + '</div>';
  el.style.display = "block";
}

/** Gera, desenha e regista na fita. A passagem de comando é ato de comando. */
function gerarBriefing(){
  const b = briefingPassagem();
  pintarBriefing(b);
  fita("Briefing de passagem de comando elaborado ("+b.pendencias.length+" ponto(s) por decidir)");
  persistir(false);
  return b;
}

/** Descarrega o briefing em texto, com o nome pela convenção do projeto. */
function descarregarBriefing(){
  const b = briefingPassagem();
  const num = String(O.meta.num||"sem-num").replace(/[^\w.-]+/g,"-");
  descarregar("CSREPCDouro_briefing-"+num+"_"+carimboFich()+"_EstacaoPEA_CLD.txt",
    textoBriefing(b), "text/plain;charset=utf-8");
  fita("Briefing de passagem descarregado");
  return b;
}
