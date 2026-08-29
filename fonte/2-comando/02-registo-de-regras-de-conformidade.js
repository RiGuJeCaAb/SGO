/* ================= COMANDO · registo de regras de conformidade ================= */
/* Cada verificação é um objeto autónomo: os identificadores que emite, as fontes
   doutrinárias que invoca — as chaves estão em docs/FONTES.md — e uma função do
   contexto que devolve os itens. Cresce por acrescento de regras, não por
   acrescento dentro de uma função, e cada regra exercita-se sozinha. */
/* Obrigações que se cumprem **fora** da aplicação, e que por isso ela não vê acontecer:
   notificar o CSREPC, propor a ativação do PMEPC. Sem forma de as fechar, ficavam
   vermelhas para sempre — e uma obrigação que nunca fecha ensina o oficial a ignorar o
   vermelho, que é o pior que um motor de conformidade pode fazer.

   Só entram aqui as que são mesmo ato externo. Uma obrigação que a aplicação consegue
   observar no estado — um PEA emitido, um canal atribuído, uma função nomeada — fecha-se
   fazendo a coisa, e não declarando que se fez. Declarar o que se pode observar seria
   abrir a porta a dar por cumprido o que não está. */
const CUMPRIVEIS = {
  notif: { rot:"Registar a confirmação ao CSREPC",
           d:"notificação SINOP difundida às entidades gestoras do território" },
  pmepc: { rot:"Registar a proposta de ativação",
           d:"proposta de ativação do PMEPC apresentada ao CSREPC" }
};

/** O cumprimento registado para uma obrigação, ou null. */
function cumprimentoDe(id){
  const C = O.cumprimentos || {};
  const x = C[id];
  return (x && typeof x === "object" && x.g)? x : null;
}

/**
 * Dá uma obrigação por cumprida, com GDH e quem. Fica na evolução e na fita, como
 * qualquer outro facto — o que se declara cumprido é prova documental, e prova sem
 * autor nem hora não é prova.
 */
async function registarCumprimento(id, por, nota, ts){
  if(!CUMPRIVEIS[id]) return { ok:false, motivo:"Esta obrigação não se declara cumprida: cumpre-se fazendo a coisa." };
  const quem = String(por||"").trim();
  if(!quem) return { ok:false, motivo:"Indicar quem confirma o cumprimento." };
  O.cumprimentos = O.cumprimentos || {};
  const g = gdhDe(ts==null? agora() : ts);
  O.cumprimentos[id] = { g, por:quem, nota:String(nota||"").trim() };
  O.evolucao.push({g, tipo:"decisao",
    txt:"Cumprimento registado — "+CUMPRIVEIS[id].d+" — por "+quem
      + (String(nota||"").trim()? " — "+String(nota).trim() : "")});
  fita("Obrigação dada por cumprida: "+CUMPRIVEIS[id].d+" · "+quem+" · "+g);
  await persistir(false);
  return { ok:true, g };
}

/** Retira o registo. As circunstâncias mudam, e o que estava cumprido pode deixar de estar. */
async function retirarCumprimento(id, por){
  const x = cumprimentoDe(id); if(!x) return { ok:false, motivo:"Não há cumprimento registado." };
  delete O.cumprimentos[id];
  O.evolucao.push({g:gdhAgora(), tipo:"agravamento",
    txt:"Cumprimento retirado — "+(CUMPRIVEIS[id]? CUMPRIVEIS[id].d : id)
      +", registado a "+x.g+" por "+x.por+(String(por||"").trim()? "; retirado por "+String(por).trim() : "")});
  fita("Cumprimento retirado: "+(CUMPRIVEIS[id]? CUMPRIVEIS[id].d : id));
  await persistir(false);
  return { ok:true };
}

/** @type {RegraDON[]} */
const REGRAS_DON = [
  /* Rotatividade de funções da EPCO — DON n.º 2 / DECIR 2026, pontos 7.d.(29) e 7.d.(30) */
  { id:"turno", ids:["turno"], t:"Rotatividade de funções da EPCO", fontes:["DON2"],
    avaliar(x){ const v = []; const { decorrido, dur, instante } = x;
      const T = turnoObj(), d = parseGDH(T.inicio);
      const ht = d ? (instante - d.getTime())/3600000 : null;
      if(ht === null){
        if(decorrido !== null && decorrido > 180)
          v.push({n:"av", id:"turno", t:"Turno do PCO por declarar",
            s:"A ocorrência decorre há "+dur(decorrido)+" e não há GDH de início de turno registado.",
            f:"De forma a garantir uma efetiva capacidade de comando e controlo, a EPCO deve assegurar continuidade de trabalho pelo período necessário, em espelho, garantindo a rotatividade de funções a cada 12 horas.",
            a:"Declarar a equipa e o GDH de início do turno no separador de passagem de turno, para que o relógio das 12 horas possa correr.",
            r:"DON n.º 2 / DECIR 2026, pontos 7.d.(29) e 7.d.(30)"});
      } else if(ht >= LIMITE_TURNO_H){
        v.push({n:"ob", id:"turno", t:"Rotatividade de funções vencida",
          s:"O turno "+(T.equipa||"corrente")+" começou às "+T.inicio+" e dura há "+fmtH(ht)+", acima do limite de "+LIMITE_TURNO_H+" horas.",
          f:"De forma a garantir uma efetiva capacidade de comando e controlo, a EPCO deve assegurar continuidade de trabalho pelo período necessário, em espelho, garantindo a rotatividade de funções a cada 12 horas.",
          a:"Registar a passagem de turno com o estado e as pendências declarados por cada célula, e comunicar ao CSREPC a equipa que assume.",
          r:"DON n.º 2 / DECIR 2026, ponto 7.d.(30)"});
      } else if(ht >= LIMITE_TURNO_H - 2){
        v.push({n:"av", id:"turno", t:"Rotatividade de funções a vencer em "+fmtH(LIMITE_TURNO_H-ht),
          s:"O turno "+(T.equipa||"corrente")+" dura há "+fmtH(ht)+".",
          f:"A rotatividade de funções da EPCO faz-se a cada 12 horas, em espelho.",
          a:"Preparar a passagem: rever o estado e as pendências de cada célula e articular a equipa que entra.",
          r:"DON n.º 2 / DECIR 2026, ponto 7.d.(30)"});
      } else {
        v.push({n:"ok", id:"turno", t:"Rotatividade dentro do período",
          s:"Turno "+(T.equipa||"corrente")+" há "+fmtH(ht)+"; rotatividade prevista às "+gdhMais(d, LIMITE_TURNO_H*60)+"."
            + ((T.entregas||[]).length? " Passagens registadas nesta ocorrência: "+T.entregas.length+"." : ""),
          f:"A EPCO assegura continuidade em espelho, com rotatividade de funções a cada 12 horas.",
          a:"Manter o estado das células atualizado, para que a passagem seja composta sem trabalho adicional.",
          r:"DON n.º 2 / DECIR 2026, ponto 7.d.(30)"});
      }
      return v; } },

  /* Núcleos nomeados por entidade externa a pedido do COS — arts. 23.º, 24.º e 25.º */
  { id:"nomext", ids:["nomext"], t:"Nomeação externa de núcleos da célula de operações", fontes:["SGO4067"],
    avaliar(x){ const v = []; const { dur, P, instante } = x;
      const pend = (P.funcoes||[]).filter(f=>f.solicitado && !f.g);
      if(!pend.length) return v;
      v.push({n:"av", id:"nomext", t:"Nomeação externa pendente em "+pend.length+" "+(pend.length===1?"núcleo":"núcleos"),
        s:pend.map(f=>{
          const ds = parseGDH(f.solicitado), ms = minutosDesde(ds, instante);
          return f.f+" — solicitado a "+(f.entidade||pcoDef(f.f).ext||"entidade competente")+" em "+f.solicitado+(ms!==null? " (há "+dur(ms)+")":"");
        }).join("; ")+".",
        f:"Os responsáveis pelos núcleos de segurança, de emergência médica e de coordenação do apoio psicológico e social de emergência são nomeados, respetivamente, pela força de segurança territorialmente competente, pelo INEM, I. P., e pelo Instituto da Segurança Social, I. P., por solicitação do COS, e reportam ao oficial de operações.",
        a:"Reiterar a solicitação junto da entidade nomeadora e registar a nomeação assim que comunicada. Enquanto o núcleo não estiver ativado, as suas competências são exercidas pela célula de operações.",
        r:"Despacho n.º 4067/2024, arts. 17.º, n.º 1, al. h), 23.º, n.º 2, 24.º, n.º 2 e 25.º, n.º 2"});
      return v; } },

  { id:"ata", ids:["ata"], t:"Prazo de ataque inicial e ampliado", fontes:["DON2"],
    avaliar(x){ const v = []; const { ini, decorrido, dur } = x;
      /* 1. Regra dos 90 minutos: transição de ATI para ATA.

         A obrigação cumpre-se emitindo o PEA, e a aplicação **vê** o PEA emitido: fecha
         sozinha, sem ninguém ter de declarar nada. Até à r0046 não fechava — ficava
         vermelha para sempre, mesmo com o plano emitido e difundido. */
      if(decorrido !== null){
        const limiar = ini? ini.getTime() + 90*60000 : null;
        const peaDepois = limiar === null? null
          : O.peas.filter(p=>p.ts && p.ts >= limiar).slice(-1)[0];
        if(decorrido >= 90 && peaDepois){
          v.push({n:"ok", id:"ata", t:"Ataque ampliado com PEA formal emitido",
            s:"A ocorrência decorre há "+dur(decorrido)+", e o PEA n.º "+peaDepois.n+" foi emitido a "+peaDepois.g+", depois do limiar dos 90 minutos, às "+gdhMais(ini,90)+".",
            f:"Ultrapassados os 90 minutos, é exigível um PEA formalmente elaborado e partilhado com todas as entidades presentes no TO.",
            a:"Manter o plano difundido e em vigor; a validade e as divergências são acompanhadas na verificação própria.",
            r:"DON n.º 2 / DECIR 2026, pontos 7.e.(4)(t) e 7.e.(5)(a)"});
        } else if(decorrido >= 90){
          v.push({n:"ob", id:"ata", t:"Ataque ampliado — PEA formal obrigatório",
            s:"A ocorrência decorre há "+dur(decorrido)+", contados a partir do GDH de início "+O.meta.inicio+". O limiar dos 90 minutos foi ultrapassado às "+gdhMais(ini,90)+".",
            f:"Sempre que a ocorrência ultrapasse os 90 minutos, ou na previsão de tal acontecer, o COS deve solicitar atempadamente o reforço de meios e aumentar a capacidade de comando e controlo, assegurando a implementação de um PEA formalmente elaborado e partilhado com todas as entidades presentes no TO, com informação sobre a proteção de pessoas e bens e sobre a gestão do incêndio em espaço rural, com alocação de meios e comando específico a cada setor.",
            a:"Emitir e difundir o PEA a todas as entidades no TO. Assegurar em paralelo a reposição da capacidade de ataque inicial, desmobilizando ESF, ECNAF, EHATI e meios terrestres da UEPS para os locais de origem, em coordenação com o CSREPC.",
            r:"DON n.º 2 / DECIR 2026, pontos 7.e.(4)(t) e 7.e.(5)(a)"});
        } else {
          v.push({n:"ok", id:"ata", t:"Ataque inicial dentro do prazo",
            s:"A ocorrência decorre há "+dur(decorrido)+". Faltam "+(90-decorrido)+" minutos para o limiar dos 90 minutos, previsto para as "+gdhMais(ini,90)+".",
            f:"Até aos 90 minutos a ocorrência mantém-se em ataque inicial, sem exigência de PEA formalmente elaborado.",
            a:"Antecipar a mobilização de meios de reforço se a ocorrência apresentar potencial de desenvolvimento para ataque ampliado.",
            r:"DON n.º 2 / DECIR 2026, ponto 7.e.(5)"});
        }
      }

      return v; } },
  { id:"notif", ids:["notif","pmepc"], t:"Domínio do incêndio às 2 e às 24 horas", fontes:["DON2"],
    avaliar(x){ const v = []; const { ini, decorrido, dur } = x;
      /* 1-B. Estado de domínio do incêndio às 2 e às 24 horas */
      if(decorrido !== null){
        const st = (estObj().setores||[]).map(x=>x.estado||"");
        const naoDominado = !st.length || st.some(e=>e.startsWith("Em curso") || e==="Reativação");

        /* Estas duas cumprem-se fora da aplicação — notificar, propor. Declarado o
           cumprimento, com GDH e autor, a obrigação fecha e fica a prova de quem a
           fechou. As circunstâncias mudam, e por isso a nota diz o que a repõe. */
        const cPmepc = x.cumprido("pmepc"), cNotif = x.cumprido("notif");
        if(decorrido >= 1440 && naoDominado && cPmepc){
          v.push({n:"ok", id:"pmepc", t:"Ativação do PMEPC proposta",
            s:"Proposta apresentada a "+cPmepc.g+" por "+cPmepc.por+(cPmepc.nota? " — "+cPmepc.nota : "")+".",
            f:"Recomenda-se que o Plano Municipal de Emergência de Proteção Civil seja ativado sempre que um incêndio não dominado atinja o período de duração de 24 horas.",
            a:"Acompanhar a decisão da Autoridade Municipal de Proteção Civil. Retirar o registo se a proposta tiver de ser refeita.",
            r:"DON n.º 2 / DECIR 2026, pontos 7.l.(1) e 7.l.(2)"});
        } else if(decorrido >= 120 && naoDominado && cNotif && decorrido < 1440){
          v.push({n:"ok", id:"notif", t:"Notificação das duas horas confirmada",
            s:"Confirmada a "+cNotif.g+" por "+cNotif.por+(cNotif.nota? " — "+cNotif.nota : "")+".",
            f:"As organizações públicas ou privadas responsáveis pela gestão do território onde se desenvolve o incêndio são notificadas pelo CSREPC.",
            a:"Manter. Uma reativação repõe a obrigação: nesse caso, retirar o registo e confirmar de novo.",
            r:"DON n.º 2 / DECIR 2026, pontos 7.k.(1) e 7.k.(2)"});
        } else if(decorrido >= 1440 && naoDominado){
          v.push({n:"ob", id:"pmepc", t:"Ativação do PMEPC a recomendar",
            s:"O incêndio decorre há "+dur(decorrido)+" sem estar dominado. "+(st.length? "Setores ainda em curso ou em reativação: "+st.map((e,i)=>({e,i})).filter(o=>o.e.startsWith("Em curso")||o.e==="Reativação").map(o=>NOMES_SETOR[o.i]).join(", ")+"." : "Não há setorização registada."),
            f:"Recomenda-se que o Plano Municipal de Emergência de Proteção Civil seja ativado sempre que um incêndio não dominado atinja o período de duração de 24 horas, ou se preveja que tal possa acontecer. Recomenda-se ainda a ativação do plano de nível superior sempre que existam mais do que 2 PMEPC ativados na mesma área de jurisdição, quando se trate do mesmo incêndio.",
            a:"Propor ao CSREPC a articulação com a Autoridade Municipal de Proteção Civil para ativação do PMEPC. A ativação transfere a coordenação institucional para a comissão municipal, sem prejuízo do comando da operação pelo COS.",
            r:"DON n.º 2 / DECIR 2026, pontos 7.l.(1) e 7.l.(2)"});
        } else if(decorrido >= 120 && naoDominado){
          v.push({n:"ob", id:"notif", t:"Notificação das duas horas por confirmar",
            s:"O incêndio decorre há "+dur(decorrido)+" sem estar dominado. O limiar das 2 horas foi ultrapassado às "+gdhMais(ini,120)+".",
            f:"As organizações públicas ou privadas responsáveis pela gestão do território onde se desenvolve o incêndio são notificadas pelo CSREPC, conforme a NOP sobre o Sistema de Notificações Operacionais, sempre que um incêndio atinja ou se preveja que atinja o limite de 2 horas sem estar dominado. Os Presidentes das Câmaras Municipais, enquanto Autoridade Municipal de Proteção Civil, são informados nos mesmos termos.",
            a:"Confirmar junto do CSREPC que a notificação SINOP foi difundida às entidades gestoras do território e que a Autoridade Municipal de Proteção Civil foi informada. Registar a confirmação na fita do tempo.",
            r:"DON n.º 2 / DECIR 2026, pontos 7.k.(1) e 7.k.(2)"});
        } else if(decorrido >= 90 && decorrido < 120 && naoDominado){
          v.push({n:"av", id:"notif", t:"Notificação das duas horas em "+(120-decorrido)+" minutos",
            s:"O incêndio decorre há "+dur(decorrido)+" sem estar dominado. O limiar das 2 horas ocorre às "+gdhMais(ini,120)+".",
            f:"A notificação às entidades gestoras do território e à Autoridade Municipal de Proteção Civil é devida quando o incêndio atinja, ou se preveja que atinja, as 2 horas sem estar dominado.",
            a:"Antecipar o POSIT ao CSREPC com a previsão de evolução, para que a notificação seja difundida com base em informação atual.",
            r:"DON n.º 2 / DECIR 2026, ponto 7.k.(1)"});
        } else if(decorrido >= 120 && !naoDominado){
          v.push({n:"ok", id:"notif", t:"Incêndio dominado antes do limiar de notificação",
            s:"Nenhum setor se encontra em curso ou em reativação ao fim de "+dur(decorrido)+".",
            f:"A notificação das 2 horas às entidades gestoras do território e à Autoridade Municipal de Proteção Civil aplica-se a incêndios que atinjam esse limite sem estarem dominados.",
            a:"Manter o registo do estado dos setores atualizado; uma reativação repõe a obrigação de notificação.",
            r:"DON n.º 2 / DECIR 2026, ponto 7.k.(1)"});
        }
      }

      return v; } },
  { id:"posit", ids:["posit"], t:"Cadência do POSIT", fontes:["DON2"],
    avaliar(x){ const v = []; const { decorrido, dur } = x;
      /* 2. Cadência do POSIT */
      const posits = O.evolucao.filter(x=>x.tipo==="posit");
      const up = ultimoPOSIT(), mp = minutosDesde(up);
      if(mp === null){
        if(decorrido !== null && decorrido > 60) v.push({n:"ob", id:"posit", t:"POSIT em falta desde a abertura",
          s:"Não há qualquer ponto de situação registado, com a ocorrência a decorrer há "+dur(decorrido)+".",
          f:"O COS deve assegurar informação permanente ao CSREPC, comunicando o POSIT atualizado com periodicidade máxima de 1 hora, ou sempre que se verifique alteração significativa, para inserção na fita de tempo da ocorrência na plataforma de gestão de operações.",
          a:"Registar o ponto de situação na secção 4 com o tipo POSIT e transmitir ao CSREPC para inserção no SADO.",
          r:"DON n.º 2 / DECIR 2026, ponto 7.e.(4)(o)"});
      } else if(mp >= 60){
        v.push({n:"ob", id:"posit", t:"POSIT vencido há "+(mp-60)+" minutos",
          s:"O último POSIT foi registado às "+posits[posits.length-1].g+", há "+dur(mp)+". A periodicidade máxima de 1 hora está ultrapassada.",
          f:"O COS deve assegurar informação permanente ao CSREPC, comunicando o POSIT atualizado com periodicidade máxima de 1 hora, ou sempre que se verifique alteração significativa.",
          a:"Transmitir POSIT imediato ao CSREPC e registá-lo na secção 4. Em ataque ampliado, assegurar também POSIT dirigido aos órgãos de comunicação social em hora previamente acordada, através do adjunto de relações públicas.",
          r:"DON n.º 2 / DECIR 2026, pontos 7.e.(4)(o) e 7.e.(5)(t)"});
      } else if(mp >= 45){
        v.push({n:"av", id:"posit", t:"POSIT a vencer em "+(60-mp)+" minutos",
          s:"O último POSIT foi registado às "+posits[posits.length-1].g+", há "+dur(mp)+".",
          f:"A periodicidade máxima entre pontos de situação é de 1 hora.",
          a:"Preparar o próximo ponto de situação com base no estado dos setores e na evolução registada desde o anterior.",
          r:"DON n.º 2 / DECIR 2026, ponto 7.e.(4)(o)"});
      } else {
        v.push({n:"ok", id:"posit", t:"Cadência de POSIT cumprida",
          s:"Último POSIT às "+posits[posits.length-1].g+", há "+dur(mp)+". Total de "+posits.length+" registos na ocorrência.",
          f:"A periodicidade máxima entre pontos de situação é de 1 hora, sem prejuízo de comunicação imediata em caso de alteração significativa.",
          a:"Manter a cadência; registar de imediato qualquer alteração significativa da situação.",
          r:"DON n.º 2 / DECIR 2026, ponto 7.e.(4)(o)"});
      }

      return v; } },
  { id:"coparar", ids:["coparar","copart"], t:"Coordenação de meios aéreos", fontes:["SGO4067","DON2"],
    avaliar(x){ const v = []; const { c } = x;
      /* 3. Coordenação de meios aéreos */
      const listaAer = descreverAer(aerLista().filter(a=>(catDef(a.t)||{}).comb)) || (c.arComb+" aeronaves");
      const semInd = aerLista().filter(a=>!a.ind).length;
      const nCopart = nomeado("COPAR-T"), nCopara = nomeado("COPAR-A");
      if(c.arComb > 2 && nCopart) v.push({n:"ok", id:"copart", t:"Coordenador de Operações Aéreas terrestre nomeado",
        s:"COPAR-T: "+(nCopart.nome||"nome por registar")+(nCopart.entidade? ", "+nCopart.entidade:"")+(nCopart.ct? ", contacto "+nCopart.ct:"")+". Nomeado às "+nCopart.g+", com "+c.arComb+" aeronaves de combate no TO"+(nCopart.siresp? "; canal SIRESP "+nCopart.siresp:"")+".",
        f:"Deve ser nomeado um COPAR-T que assegure a coordenação dos meios aéreos e o apoio técnico especializado sempre que estejam envolvidas no teatro de operações mais de duas aeronaves.",
        a:"Manter a nomeação registada e o canal atribuído no plano de comunicações. Com a continuidade da atividade aérea, ponderar a ativação do núcleo de meios aéreos e a nomeação do OPAR.",
        r:"Despacho n.º 4067/2024, art. 20.º, n.º 6 · DON n.º 2, ponto 7.d.(18)"});
      else if(c.arComb > 2) v.push({n:"ob", id:"copart", t:"Coordenador de Operações Aéreas terrestre por nomear",
        s:"Estão registadas "+c.arComb+" aeronaves de combate no TO: "+listaAer+"."+(c.arCoord? " Acresce "+c.arCoord+" aeronave"+(c.arCoord>1?"s":"")+" de reconhecimento e coordenação, que não conta para este limiar.":"")+(semInd? " Há "+semInd+" aeronave"+(semInd>1?"s":"")+" sem indicativo de chamada nem hora de entrada registados na secção 2, o que impede a contagem de tempo no TO.":""),
        f:"O COS deve nomear um Coordenador de Operações Aéreas (COPAR-T) que assegure a coordenação dos meios aéreos e o apoio técnico especializado no caso de estarem envolvidas na operação mais de 2 aeronaves de combate a incêndios. Com a continuidade da atividade aérea e a evolução do SGO, deve ser nomeado um Oficial de Operações Aéreas (OPAR). Até à nomeação, a coordenação deve ser assegurada, preferencialmente, pelo chefe da equipa helitransportada.",
        a:"Nomear o COPAR-T e registar a nomeação na secção 3, com nome, entidade, contacto e canal. O emprego dos meios aéreos deve constar do PEA.",
        r:"DON n.º 2 / DECIR 2026, pontos 7.d.(17), 7.d.(18) e 7.d.(19)"});
      if(c.arComb >= 4){
        if(nCopara) v.push({n:"ok", id:"coparar", t:"Coordenação aérea a partir do ar nomeada",
          s:"COPAR-A: "+(nCopara.nome||"nome por registar")+(nCopara.entidade? ", "+nCopara.entidade:"")+(nCopara.ct? ", contacto "+nCopara.ct:"")+". Nomeado às "+nCopara.g+(c.arCoord? "; há "+c.arCoord+" aeronave"+(c.arCoord>1?"s":"")+" de reconhecimento e coordenação no TO":"; sem HERAC nem AVRAC registado")+".",
          f:"Sempre que estejam a operar quatro ou mais aeronaves no teatro de operações, a coordenação dos meios aéreos é assegurada por um COPAR-A, que articula toda a operação com o COPAR-T.",
          a:"Confirmar que o COPAR-A está a bordo de aeronave de coordenação e que a articulação com o COPAR-T consta do plano de comunicações.",
          r:"Despacho n.º 4067/2024, art. 20.º, n.º 7 · DON n.º 2, ponto 7.d.(20)"});
        else if(c.arCoord) v.push({n:"av", id:"coparar", t:"Coordenador a bordo por registar",
          s:"Com "+c.arComb+" aeronaves de combate, o limiar de 4 está atingido, e há "+c.arCoord+" aeronave"+(c.arCoord>1?"s":"")+" de reconhecimento e coordenação no TO.",
          f:"Sempre que estejam a operar 4 ou mais aeronaves de combate a incêndios no mesmo TO, deve ser assegurado, se disponível, um HERAC ou um AVRAC dotado de um COPAR a bordo (COPAR-Ar), que articula toda a operação com o COPAR-T.",
          a:"Confirmar que o COPAR-Ar está efetivamente a bordo e que a articulação com o COPAR-T consta do plano de comunicações.",
          r:"DON n.º 2 / DECIR 2026, ponto 7.d.(20)"});
        else v.push({n:"ob", id:"coparar", t:"Coordenação aérea a partir do ar por assegurar",
          s:"Com "+c.arComb+" aeronaves de combate em operação, o limiar de 4 está atingido e não há HERAC nem AVRAC registado no TO.",
          f:"Sempre que estejam a operar 4 ou mais aeronaves de combate a incêndios no mesmo TO, deve ser assegurado, se disponível, um HERAC ou um AVRAC dotado de um COPAR a bordo (COPAR-Ar), que articula toda a operação com o COPAR-T.",
          a:"Solicitar HERAC ou AVRAC ao CSREPC e estabelecer a articulação COPAR-Ar com COPAR-T no plano de comunicações.",
          r:"DON n.º 2 / DECIR 2026, ponto 7.d.(20)"});
      }

      return v; } },
  { id:"copesp", ids:["copesp"], t:"Coordenação de meios especiais", fontes:["SGO4067","DON2"],
    avaliar(x){ const v = []; const { c, nCopesp } = x;
      /* 4. Coordenação de meios especiais */
      if(c.mr > 2 && nCopesp) v.push({n:"ok", id:"copesp", t:"Coordenador de Operações com Meios Especiais nomeado",
        s:"COPESP: "+(nCopesp.nome||"nome por registar")+(nCopesp.entidade? ", "+nCopesp.entidade:"")+(nCopesp.ct? ", contacto "+nCopesp.ct:"")+". Nomeado às "+nCopesp.g+", com "+c.mr+" máquinas de rasto no dispositivo.",
        f:"O COPESP coordena a operação dos meios especiais empenhados no teatro de operações e garante a existência de equipa de apoio ao trabalho a efetuar por esses meios.",
        a:"Manter no PEA as missões de maquinaria e assegurar que cada máquina tem equipa de apoio e via de fuga identificada.",
        r:"Despacho n.º 4067/2024, art. 22.º · DON n.º 2, ponto 7.d.(23)"});
      else if(c.mr > 2) v.push({n:"ob", id:"copesp", t:"Coordenador de Operações com Meios Especiais por nomear",
        s:"Estão registadas "+c.mr+" máquinas de rasto no dispositivo, distribuídas pelas tipologias atribuídas aos setores.",
        f:"O emprego de maquinaria, particularmente de máquinas de rasto e de tratores agrícolas, deve estar integrado no PEA para garantir a máxima eficiência no emprego destes recursos. O COS deve nomear um Coordenador de Operações com Meios Especiais (COPESP) no caso de estarem envolvidas mais de 2 máquinas de rasto.",
        a:"Nomear o COPESP e inscrever no PEA as missões de maquinaria, com faixas de contenção, acessos e apoio de veículo de combate a cada máquina.",
        r:"DON n.º 2 / DECIR 2026, pontos 7.d.(22) e 7.d.(23)"});

      return v; } },
  { id:"pt", ids:["pt"], t:"Ponto de trânsito", fontes:["DON2"],
    avaliar(x){ const v = []; const { c } = x;
      /* 5. Ponto de trânsito */
      const PT = ptObj();
      if(c.m >= 10 && PT.des) v.push({n:"ok", id:"pt", t:"Ponto de trânsito estabelecido",
        s:PT.des+(PT.resp? "; responsável "+PT.resp:"; responsável por indicar")+(PT.cd? "; "+PT.cd:"")+".",
        f:"O ponto de trânsito garante o controlo das entradas e saídas do TO e a atribuição de missão a todas as equipas que chegam.",
        a:PT.resp? "Difundir a localização e o contacto no plano de comunicações e ao CSREPC." : "Indicar o responsável e o contacto do ponto de trânsito na secção 2.",
        r:"DON n.º 2 / DECIR 2026, pontos 7.d.(5), 7.d.(7) e 7.d.(8)"});
      else if(c.m >= 10) v.push({n:"av", id:"pt", t:"Ponto de trânsito por definir",
        s:"O dispositivo soma "+c.m+" meios no TO, o que pressupõe pedido de reforço, e não há ponto de trânsito registado.",
        f:"O pedido de reforço de meios implica o estabelecimento de um ponto de trânsito para os restantes meios despachados para a ocorrência, que garanta o controlo das entradas e saídas do TO. Todas as equipas despachadas devem contactar à chegada o ponto de trânsito ou o COS para receberem missão.",
        a:"Definir a localização e o responsável do ponto de trânsito na secção 2 — há sugestão automática a partir da carta — e inscrevê-los no plano logístico do PEA. Garantir a atribuição de missão nos primeiros 15 minutos após a chegada de cada equipa.",
        r:"DON n.º 2 / DECIR 2026, pontos 7.d.(5), 7.d.(7) e 7.d.(8)"});

      return v; } },
  { id:"fase", ids:["fase"], t:"Capacidade de comando e controlo face à fase do SGO", fontes:["SGO4067","DON2"],
    avaliar(x){ const v = []; const { c } = x;
      /* 6. Capacidade de comando e controlo face à fase do SGO */
      const REF = {I:36, II:40, III:119, IV:356, V:713};
      const lim = REF[O.meta.fase];
      if(lim && c.op > lim) v.push({n:"av", id:"fase", t:"Fase "+O.meta.fase+" excedida pelo efetivo no TO",
        s:"Estão registados "+c.op+" operacionais, acima da referência de "+lim+" da fase "+O.meta.fase+" declarada na secção 1.",
        f:"O COS deve garantir o reforço da organização do PCO e da capacidade de comando e controlo sempre que o número de meios humanos e materiais mobilizados ultrapasse a capacidade de comando e controlo implementada. O aumento dessa capacidade deve ser acompanhado pelo aumento da capacidade de análise e planeamento, através da ativação do núcleo de especialistas na célula de planeamento.",
        a:"Rever a fase declarada, reforçar as células do PCO e ponderar a solicitação de EPCO, e de EAUF da FEPC ou EGFR do ICNF ao CNEPC.",
        r:"Despacho n.º 4067/2024, Anexo I; DON n.º 2, pontos 7.d.(25)(d) e 7.d.(27)"});

      return v; } },
  /* Repartição do dispositivo pelos setores. As regras anteriores medem prazos e
     nomeações; esta lê o dispositivo contra si próprio, e faz a pergunta que o COS faz
     de hora a hora: os meios estão onde está o fogo?

     Compara setores uns com os outros e nunca conta meios em absoluto — um setor em
     vigilância ativa tem de ter presença, e o rescaldo também. O que se assinala é a
     desproporção: um setor cujo estado já não justifica a força que lá está, havendo
     outro em curso com menos.

     Propõe, e não determina. Quem move meios é o COS — art. 8.º, n.º 2 —, e é ele que
     sabe o que a carta não diz. */
  { id:"reparticao", ids:["reparticao"], t:"Repartição dos meios pelos setores", fontes:["SGO4067","DON2"],
    avaliar(x){ const v = [], { c } = x;
      const S = cargaDosSetores();
      if(!S.length) return v;
      const ativos = S.filter(s=>s.ativo), libertaveis = S.filter(s=>s.libertavel);
      const nomes = L => L.map(s=>s.nome+" ("+s.m+(s.m===1? " veículo":" veículos")+")").join(", ");

      /* Sem frente ativa nenhuma, e ainda com meios no TO: é hora de repor a capacidade
         de ataque inicial, que é obrigação declarada da DON e não opinião. */
      if(!ativos.length && c.m > 0){
        v.push({n:"av", id:"reparticao", t:"Dispositivo sem frente ativa, com meios no TO",
          s:"Nenhum dos "+S.length+(S.length===1? " setor está":" setores está")+" em curso ou reativado, e o TO soma "
            +c.m+(c.m===1? " veículo e ":" veículos e ")+c.op+(c.op===1? " operacional":" operacionais")+".",
          f:"Assegurar em paralelo a reposição da capacidade de ataque inicial, desmobilizando meios para os locais de origem, em coordenação com o CSREPC.",
          a:"Iniciar a desmobilização faseada, mantendo o efetivo que a vigilância ativa e o rescaldo exigem, e registar cada saída na evolução. Confirmar a libertação com o CSREPC.",
          r:"DON n.º 2 / DECIR 2026, pontos 7.e.(4)(t) e 7.e.(5)(a)"});
        return v;
      }
      if(!ativos.length) return v;

      /* O termo de comparação é o setor em curso mais desguarnecido: é para lá que a
         proposta aponta, salvo havendo reativação, que tem precedência. */
      const maisFraco = ativos.reduce((a,s)=> s.m < a.m ? s : a);
      const reativado = ativos.find(s=>s.reativado && s.m <= maisFraco.m) || ativos.find(s=>s.reativado);
      const excedentes = libertaveis.filter(s=>s.m > maisFraco.m);

      if(excedentes.length){
        const destino = reativado || maisFraco;
        const disp = excedentes.reduce((a,s)=>a+s.m,0);
        v.push({n:"av", id:"reparticao",
          t: reativado? "Reativação com menos meios do que um setor já concluído"
                      : "Meios concentrados em setor que já não os exige",
          s: nomes(excedentes)+" "+(excedentes.length===1? "está":"estão")+" em conclusão ou vigilância ativa, "
            +"e "+destino.nome+", "+(destino.reativado? "reativado":"em curso")+", tem "+destino.m
            +(destino.m===1? " veículo":" veículos")+".",
          f: reativado
            ? "A reativação de um setor repõe a exigência de meios que o seu estado anterior já não justificava, e a célula de operações executa e implementa as decisões do plano, transmitindo as ordens de missão aos comandantes de setor."
            : "A célula de operações executa e implementa as decisões do plano quanto à setorização e às forças atribuídas, transmitindo as ordens de missão aos comandantes de setor.",
          a: "Ponderar deslocar meios de "+excedentes.map(s=>s.nome).join(", ")+" para "+destino.nome
            +(destino.cmd? ", ao cuidado de "+destino.cmd : "")+", mantendo em cada setor o efetivo que a vigilância ativa e o rescaldo exigem. "
            +"Até "+disp+(disp===1? " veículo":" veículos")+" em causa. Registar a decisão na evolução, com o tipo «alteração de meios».",
          r:"Despacho n.º 4067/2024, art. 17.º, n.º 1, als. a) e d); DON n.º 2 / DECIR 2026, ponto 7.f"});
      } else if(c.m > 0){
        v.push({n:"ok", id:"reparticao", t:"Meios repartidos conforme a atividade",
          s: ativos.length+(ativos.length===1? " setor em curso":" setores em curso")
            +(libertaveis.length? ", e nenhum setor em conclusão ou vigilância com mais meios do que o mais desguarnecido dos ativos" : "")+".",
          f:"A célula de operações executa e implementa as decisões do plano quanto à setorização e às forças atribuídas.",
          a:"Manter, e reavaliar a cada mudança de estado de setor.",
          r:"Despacho n.º 4067/2024, art. 17.º, n.º 1, als. a) e d)"});
      }
      return v; } },
  { id:"pco", ids:["pco"], t:"Estrutura do posto de comando", fontes:["SGO4067"],
    avaliar(x){ const v = []; void x;
      /* 6-B. Estrutura do posto de comando */
      const exig = funcoesExigiveis(), falta = exig.filter(x=>!x.preenchida && !/COPAR|COPESP/.test(x.f));
      if(falta.length) v.push({n:"av", id:"pco", t:falta.length+(falta.length===1? " função do PCO por nomear":" funções do PCO por nomear"),
        s:falta.map(x=>x.f+" ("+x.motivo+")").join("; ")+".",
        f:"O posto de comando operacional pode ser composto por coordenador do PCO, oficial de operações, oficial de planeamento, oficial de logística e finanças, adjunto de segurança, adjunto de ligação e adjunto de relações públicas, em função das fases de desenvolvimento do SGO. A instalação do posto de comando operacional é obrigatória a partir da fase II.",
        a:"Registar na secção 3 quem ocupa cada função, com entidade, contacto e GDH de nomeação. Sem esse registo, a passagem de comando fica sem base documental.",
        r:"Despacho n.º 4067/2024, artigos 13.º, n.º 2, e 14.º, n.º 1"});

      return v; } },
  { id:"placom", ids:["placom"], t:"Plano de comunicações", fontes:["SGO4067","DON1"],
    avaliar(x){ const v = []; const { NV } = x;
      /* 6-C. Plano de comunicações */
      const setsSemCanal = (estObj().setores||[]).map((x,i)=>({x,i})).filter(o=>!o.x.siresp);
      if(!canaisObj().cmd && (estObj().setores||[]).length){
        v.push({n:"ob", id:"placom", t:"Plano de comunicações por elaborar",
          s:"Não há canal de comando atribuído, com "+(estObj().setores||[]).length+" setores ativados no TO.",
          f:"Compete à célula de logística e finanças elaborar o plano de comunicações, para aprovação pelo COS, e assegurar a sua permanente atualização. A célula de operações transmite as ordens de missão e o plano de comunicações aos comandantes de setor, de frente e de área. Os canais de comando, táticos e de manobra são decididos pelo COS em articulação com o CSREPC.",
          a:"Atribuir o canal de comando e os canais táticos na secção 3 e difundi-los aos comandantes de setor. Cada teatro de operações é um núcleo isolado: o contacto rádio com o exterior faz-se em exclusivo pelo PCO.",
          r:"Despacho n.º 4067/2024, art. 32.º, al. d), art. 17.º, al. c), e art. 34.º"});
      } else if(NV.manobra && setsSemCanal.length){
        v.push({n:"av", id:"placom", t:setsSemCanal.length+(setsSemCanal.length===1? " setor sem canal de manobra":" setores sem canal de manobra"),
          s:"Sem canal atribuído: "+setsSemCanal.map(o=>NOMES_SETOR[o.i]).join(", ")+". Canal de comando em vigor: "+canaisObj().cmd+".",
          f:"A hierarquização das comunicações no teatro de operações adequa-se aos diversos níveis de comando e chefia colocados a funcionar por decisão do COS. O nível de manobra determina e executa tarefas específicas.",
          a:"Atribuir canal de manobra a cada setor na secção 3 e confirmar a sua difusão aos chefes de equipa.",
          r:"Despacho n.º 4067/2024, art. 4.º, n.º 4 · DON n.º 1 / DIOPS, organização das comunicações"});
      } else if(canaisObj().cmd){
        v.push({n:"ok", id:"placom", t:"Plano de comunicações atribuído",
          s:"Canal de comando "+canaisObj().cmd+(canaisObj().tat? "; canal tático "+canaisObj().tat:"")+(canaisObj().ba? "; banda alta de recurso "+canaisObj().ba:"")+". Todos os setores ativados têm canal de manobra.",
          f:"O plano de comunicações é elaborado pela célula de logística e finanças e aprovado pelo COS, sendo transmitido aos comandantes de setor pela célula de operações.",
          a:"Manter o plano atualizado a cada alteração de setorização ou de nomeação, e anexá-lo ao PEA.",
          r:"Despacho n.º 4067/2024, art. 32.º, al. d), e art. 17.º, al. c)"});
      }

      return v; } },
  { id:"placom", ids:["placom"], t:"Coerência do plano de comunicações", fontes:["SGO4067","DON1","DON2"],
    avaliar(x){ const v = []; const { NV, SUG, P } = x;
      /* 6-D. Coerência do plano de comunicações */
      const nvFalta = NIVEL_ORD.filter(k=>SUG[k] && !NV[k]);
      if(nvFalta.length) v.push({n:"av", id:"placom", t:nvFalta.length===1? "Nível de comunicações por ativar":"Níveis de comunicações por ativar",
        s:nvFalta.map(k=>NIVEL_ROT[k].t.toLowerCase()+" ("+NIVEL_ROT[k].d+")").join("; ")+".",
        f:"As comunicações no teatro de operações são hierarquizadas e adequadas aos diversos níveis de comando e chefia colocados a funcionar por decisão do COS. Com setores ativados exigem-se os níveis tático e de manobra; com meios aéreos no teatro de operações exige-se a ligação terra/ar/terra.",
        a:"Ativar o nível na secção 3 e atribuir os canais correspondentes, ou registar a razão de não o colocar a funcionar.",
        r:"Despacho n.º 4067/2024, art. 4.º · DON n.º 1 / DIOPS, organização das comunicações, al. e)"});
      const setsCom = (estObj().setores||[]);
      const man = NV.manobra? setsCom.map((x,i)=>({d:(x.siresp||"").trim(), n:NOMES_SETOR[i]})).filter(o=>o.d) : [];
      const conflito = [];
      if(canaisObj().cmd) man.filter(o=>o.d.toUpperCase()===canaisObj().cmd.toUpperCase()).forEach(o=>conflito.push("o canal de comando "+canaisObj().cmd+" está atribuído ao nível de manobra do setor "+o.n));
      if(canaisObj().tat) man.filter(o=>o.d.toUpperCase()===canaisObj().tat.toUpperCase()).forEach(o=>conflito.push("o canal tático "+canaisObj().tat+" está atribuído ao nível de manobra do setor "+o.n));
      if(conflito.length) v.push({n:"av", id:"placom", t:"Canal repetido em níveis diferentes",
        s:conflito.join("; ")+".",
        f:"As comunicações no teatro de operações são hierarquizadas e adequadas aos diversos níveis de comando e chefia colocados a funcionar por decisão do COS. O nível de comando, o nível tático e o nível de manobra têm âmbitos distintos e não devem partilhar o mesmo canal.",
        a:"Atribuir canais distintos a cada nível na secção 3 e difundir a correção aos comandantes de setor e aos chefes de equipa.",
        r:"Despacho n.º 4067/2024, art. 4.º · DON n.º 1 / DIOPS, organização das comunicações, al. e)"});
      const partilha = {};
      man.forEach(o=>{ const k=o.d.toUpperCase(); (partilha[k]=partilha[k]||[]).push(o.n); });
      const rep2 = Object.keys(partilha).filter(k=>partilha[k].length>1);
      if(rep2.length) v.push({n:"av", id:"placom", t:"Canal de manobra partilhado por vários setores",
        s:rep2.map(k=>partilha[k].join(" e ")+" no mesmo canal").join("; ")+".",
        f:"O nível de manobra determina e executa tarefas específicas dentro de cada setor. A partilha do mesmo canal por setores distintos satura a rede e confunde a origem das mensagens em situação de emergência.",
        a:"Atribuir um canal de manobra próprio a cada setor sempre que o catálogo o permita; se a partilha for inevitável, registá-la no plano de comunicações e adverti-la no briefing.",
        r:"Despacho n.º 4067/2024, art. 4.º, n.º 4 · DON n.º 2 / DECIR 2026, ponto 10(3)"});
      const ATR = (canaisObj().atrib||[]).map(x=>String(x).toUpperCase());
      if(ATR.length){
        const fora = [];
        const chk = (d,onde)=>{ d=(d||"").trim(); if(d && !ATR.includes(d.toUpperCase())) fora.push(d+" — "+onde); };
        chk(canaisObj().cmd,"canal de comando"); chk(canaisObj().tat,"canal tático"); chk(canaisObj().opar,"alternativa SIRESP");
        if(NV.manobra) setsCom.forEach((x,i)=>chk(x.siresp,"manobra do setor "+NOMES_SETOR[i]));
        if(NV.tatico) setsCom.forEach((x,i)=>chk(x.tat,"tático do setor "+NOMES_SETOR[i]));
        P.funcoes.forEach(x=>chk(x.siresp, x.f));
        if(fora.length) v.push({n:"av", id:"placom", t:"Canal em uso fora dos atribuídos ao teatro de operações",
          s:fora.join("; ")+".",
          f:"Compete aos CSREPC e ao CNEPC a atribuição dos canais rádio para responder às necessidades de cada teatro de operações. No teatro de operações deve existir apenas um plano de comunicações, não devendo ser utilizados canais rádio que nele não se encontrem previstos.",
          a:"Confirmar a atribuição com o CSREPC e marcar os canais em causa como atribuídos, ou substituí-los por canais do conjunto atribuído.",
          r:"DON n.º 2 / DECIR 2026, pontos 10(1), 10(2) e 10(3)"});
      }
      let nAer = 0; try{ nAer = aerLista().length; }catch(e){}
      if(nAer && NV.aereo && !canaisObj().aero) v.push({n:"av", id:"placom", t:"Ligação terra/ar/terra por definir",
        s:nAer+(nAer===1? " meio aéreo no TO":" meios aéreos no TO")+" sem frequência do ar registada"+(canaisObj().opar? "; "+canaisObj().opar+" registado como alternativa SIRESP":"")+".",
        f:"O canal prioritário de ligação terra/ar/terra é a frequência do ar (banda aeronáutica) atribuída ao incêndio, sendo o canal SIRESP OPAR 01 da sub-região onde decorre a ocorrência um canal alternativo e/ou de emergência, bem como o manobra 4 (CM4) da Rede Operacional dos Bombeiros.",
        a:"Registar na secção 3 a frequência do ar atribuída à ocorrência e confirmar a alternativa SIRESP e de banda alta com o COPAR e com todos os meios aéreos empenhados.",
        r:"DON n.º 2 / DECIR 2026, ponto 10(5)"});

      return v; } },
  { id:"vigor", ids:["vigor"], t:"Vigência do PEA determinado", fontes:["SGO4067"],
    avaliar(x){ const v = []; void x;
      /* 6-E. Vigência do PEA determinado */
      const pv = peaVigor(), dv = pv? divergencia(pv) : null;
      if(dv){
        const detalhe = dv.itens.slice(0,4).map(x=>x.t.toLowerCase()).join("; ");
        if(dv.verd==="caducado") v.push({n:"ob", id:"vigor", t:"PEA n.º "+pv.n+" caducado",
          s:"A validade fixada na proposta esgotou-se"+(dv.itens.length? "; divergência acumulada de "+dv.score+" ("+detalhe+")":"")+".",
          f:"O plano estratégico de ação vigora enquanto descrever o teatro de operações. Esgotada a validade, o dispositivo passa a operar sem plano determinado que o sustente.",
          a:"Emitir a revisão do PEA na secção 6 e submetê-la à aprovação e determinação do COS.",
          r:"Despacho n.º 4067/2024, art. 46.º e art. 8.º, n.º 2, al. e)"});
        else if(dv.verd==="rever") v.push({n:"ob", id:"vigor", t:"Revisão do PEA n.º "+pv.n+" devida",
          s:"Divergência acumulada de "+dv.score+": "+detalhe+".",
          f:"A base de planeamento do PEA em vigor deixou de corresponder ao dispositivo e à situação registados. A revisão é obrigatória à mudança de fase do SGO e sempre que a alteração da situação o justifique.",
          a:"Emitir a revisão do PEA na secção 6, incorporando as alterações listadas no cartão do PEA em vigor.",
          r:"Despacho n.º 4067/2024, art. 46.º"});
        else if(dv.verd==="atencao") v.push({n:"av", id:"vigor", t:"PEA n.º "+pv.n+" com divergências",
          s:"Divergência acumulada de "+dv.score+": "+detalhe+".",
          f:"O terreno começou a afastar-se do plano determinado. A divergência ainda não impõe revisão, mas tem de ser acompanhada.",
          a:"Acompanhar a divergência no cartão do PEA em vigor e preparar a revisão para o fecho da janela operacional.",
          r:"Despacho n.º 4067/2024, art. 46.º"});
        else {
          const porFazer = (pv.ctrl||[]).filter(x=>x.estado!==2).length;
          v.push({n:"ok", id:"vigor", t:"PEA n.º "+pv.n+" em vigor",
            s:"Sem divergências face ao dispositivo registado"+(pv.ctrl&&pv.ctrl.length? "; "+((pv.ctrl.length-porFazer))+" de "+pv.ctrl.length+" missões cumpridas":"")+".",
            f:"O plano determinado descreve o teatro de operações e mantém-se dentro da validade fixada.",
            a:"Manter o controlo de execução das missões e rever no fecho da janela operacional.",
            r:"Despacho n.º 4067/2024, art. 46.º"});
        }
      }

      return v; } },
  { id:"rend", ids:["rend"], t:"Rendições", fontes:["DON2"],
    avaliar(x){ const v = []; const { instante } = x;
      /* 7. Rendições — derivado do quadro de tempos */
      const R = rendicoes(instante);
      const venc = R.filter(x=>x.nivel==="r"), prox = R.filter(x=>x.nivel==="a");
      if(venc.length) v.push({n:"ob", id:"rend", t:"Rendição vencida em "+venc.length+" "+(venc.length===1?"meio":"meios"),
        s:venc.map(x=>x.nome+" ("+x.local+"), "+x.txt+" no TO").join("; ")+".",
        f:"As forças devem acautelar a segurança, a alimentação e hidratação, os períodos de descanso e a rotatividade dos seus recursos humanos, informando sempre o COS e o CSREPC dessa rotatividade. Através do controlo dos tempos de trabalho dos operacionais e das funções do PCO, o COS assegura, através do CSREPC, a rendição de meios.",
        a:"Solicitar a rendição ao CSREPC indicando o número de elementos da rendição, o veículo que entra no TO, a hora de saída dos elementos rendidos e a hora prevista de chegada ao destino final. A rendição dos meios de reforço deve fazer-se, sempre que possível, por transporte coletivo.",
        r:"DON n.º 2 / DECIR 2026, pontos 7.d.(14), 7.d.(30) e 7.e.(5)(r)"});
      else if(prox.length) v.push({n:"av", id:"rend", t:"Rendição a preparar em "+prox.length+" "+(prox.length===1?"meio":"meios"),
        s:prox.map(x=>x.nome+" ("+x.local+"), "+x.txt+" no TO").join("; ")+".",
        f:"A rotatividade dos recursos humanos deve ser acautelada antes de esgotado o período de trabalho, com comunicação ao COS e ao CSREPC.",
        a:"Antecipar o pedido de rendição ao CSREPC e articular o transporte coletivo, de modo que a substituição ocorra antes do limite.",
        r:"DON n.º 2 / DECIR 2026, pontos 7.d.(14) e 7.e.(5)(r)"});
      else if(R.length) v.push({n:"ok", id:"rend", t:"Tempos de empenhamento controlados",
        s:R.length+" meios em contagem; o mais antigo está no TO há "+R[0].txt+".",
        f:"O controlo dos tempos de trabalho dos operacionais sustenta o pedido de rendição ao CSREPC.",
        a:"Manter o registo das horas de atribuição de cada meio à medida que entram no TO.",
        r:"DON n.º 2 / DECIR 2026, ponto 7.e.(5)(r)"});

      return v; } },
];

/* Contexto comum às regras: calculado uma vez, passado a todas. */
function contextoDON(ts){
  const instante = (ts==null? agora() : ts);
  const ini = parseGDH(O.meta.inicio);
  return { instante, ini, c: contarDispositivo(),
    decorrido: minutosDesde(ini, instante),
    dur: m => { const h=Math.floor(m/60), mm=m%60; return h? h+" h "+String(mm).padStart(2,"0")+" min" : mm+" min"; },
    nCopesp: nomeado("COPESP"),
    /* Leitura defensiva: verificar conformidade não pode escrever no estado. O
       `nivObj()` normaliza, e uma verificação que altera o que verifica já não é de
       confiança. Os valores lidos são os mesmos. */
    NV: (canaisObj() && canaisObj().niveis) || {comando:false,tatico:false,manobra:false,aereo:false,ba:false,tocado:false},
    SUG: niveisSugeridos(), P: pcoObj(),
    /* O que já foi dado por cumprido, para as regras que representam ato externo. */
    cumprido: cumprimentoDe };
}

/* Percorre o registo. Uma regra que rebente não leva as outras atrás: passa a aviso
   próprio, porque uma verificação que falha não pode passar por conformidade. */
/** @param {number} [ts] @returns {ItemDON[]} */
function verificacoesDON(ts){
  const x = contextoDON(ts), v = [];
  for(const regra of REGRAS_DON){
    try{ (regra.avaliar(x)||[]).forEach(i=>v.push(i)); }
    catch(err){ v.push({n:"av", id:regra.id, t:"Verificação indisponível: "+regra.t,
      s:"A regra não pôde ser avaliada ("+err+").",
      f:"Uma verificação que falha não pode passar por conformidade verificada.",
      a:"Confirmar a matéria à mão junto da fonte e registar a ocorrência do erro.", r:""}); }
  }
  return v;
}
function gdhMais(d, min){
  if(!d) return "—";
  const x = new Date(d.getTime()+min*60000);
  return String(x.getDate()).padStart(2,"0")+String(x.getHours()).padStart(2,"0")+String(x.getMinutes()).padStart(2,"0")+MES[x.getMonth()]+String(x.getFullYear()).slice(2);
}
function hhmm(d){ return d? String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0") : "—"; }

