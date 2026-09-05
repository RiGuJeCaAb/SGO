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
/**
 * A hora escrita — «18», «18h» — no próximo instante em que ela acontece.
 *
 * Passada de hoje passa a ser de amanhã: quem escreve uma hora de validade às 22h a
 * pensar nas 6h está a falar de amanhã, e interpretá-la como já passada daria uma
 * validade expirada à nascença.
 */
function instanteDaHora(txt, ts){
  const h = parseInt(String(txt||"").replace(/\D/g,""),10);
  if(!isFinite(h) || h>23) return null;
  const ref = ts==null? agora() : ts;
  const d = new Date(ref); d.setMinutes(0,0,0); d.setHours(h);
  if(d.getTime() <= ref) d.setDate(d.getDate()+1);
  return d.getTime();
}
/**
 * Até quando o plano vale: teto de seis horas, antecipado pelo primeiro gatilho.
 *
 * Havia aqui um `Math.max(ts, agora + 3600000)` — mínimo de uma hora de vigência, para que
 * um plano não nascesse a expirar. **Saiu.** Medido: às 17h50, com a janela a fechar às
 * 18h00, o chão empurrava a validade para as 18h50 e o plano passava a declarar-se válido
 * cinquenta minutos para lá do gatilho que o própria aplicação identificou. Um limite de
 * segurança não se prolonga para o documento ficar mais confortável de ler.
 *
 * O que fica no lugar não é nada: é dizer a verdade. Quando o horizonte é curto, é curto, e
 * `validadeCurta` diz a quem lê que o plano nasce com pouco tempo e porquê — que é a
 * informação que a hora inventada escondia.
 *
 * **Recebe o instante.** Lia o relógio, e o teste da r0095 só o exercitava substituindo
 * `Date.now` — sinal de que a API estava errada. Com o instante em argumento, o caso das
 * 17h50 escreve-se como qualquer outro.
 *
 * @param {any} m as métricas da previsão, com a janela e as rotações
 * @param {number} [ts] instante de referência; sem ele, o relógio
 */
function horizonteValidade(m, ts){
  const ref = ts==null? agora() : ts;
  let fim = ref + 6*3600000;
  if(m && m.janela){ const f = instanteDaHora(m.janela.fim, ref); if(f && f>ref && f<fim) fim=f; }
  if(m && m.rotacoes) m.rotacoes.forEach(r=>{ const t=instanteDaHora(r.h, ref); if(t && t>ref && t<fim) fim=t; });
  return fim;
}

/** Minutos de vigência com que um plano nasce, abaixo dos quais se avisa. */
const VALIDADE_CURTA_MIN = 60;

/**
 * O aviso de um plano que nasce com pouco tempo, ou vazio se não for o caso.
 *
 * Substitui o chão de uma hora que existia antes. A diferença é toda: o chão **alterava** a
 * validade para a fazer parecer razoável; isto deixa-a como é e diz que é curta. Num PCO,
 * saber que o plano vale dez minutos é a informação útil — é o que obriga a rever já.
 *
 * @param {number} ts instante de fim de validade
 * @param {number} agora instante corrente; entra, não se lê o relógio aqui
 * @returns {string}
 */
function avisoValidadeCurta(ts, agora){
  const min = Math.round((ts - agora)/60000);
  if(!Number.isFinite(min) || min >= VALIDADE_CURTA_MIN) return "";
  return min <= 0
    ? "Validade esgotada à nascença: o gatilho seguinte já passou. Rever o plano antes de o entregar."
    : "Validade curta: " + min + (min===1? " minuto" : " minutos") + " até ao primeiro gatilho. Prever já a revisão.";
}
/**
 * O retrato do dispositivo no momento em que o plano foi aprovado.
 *
 * É contra isto que se mede a divergência. Sem uma fotografia do que era, «o dispositivo
 * mudou» não tem como ser afirmado.
 */
function baseVigor(){
  const r = retratoOperacional();
  return { fase:O.meta.fase||"", nivel:O.meta.nivel||"",
    setores:r.setores.map(x=>({n:x.n, estado:x.estado, m:x.m})),
    m:r.c.m, op:r.c.op, ar:r.c.ar, mr:r.c.mr, reserva:r.reserva,
    pt:ptObj().des||"", cmd:canaisObj().cmd||"", tat:canaisObj().tat||"",
    evoIdx:O.evolucao.length };
}
/**
 * As missões e propostas do plano, em itens de controlo por cumprir.
 *
 * **A chave de um item de controlo é a identidade da regra, não a sua posição.** Fazia
 * `k: x.id || "P"`, e o `id` é renumerado por posição no fim do `detDecisao` — logo P3 no
 * PEA n.º 4 não era a mesma proposta que P3 no n.º 5. Bastava uma proposta cair entre
 * planos — a reserva constitui-se, a linha estreita é alargada — para tudo o que estava por
 * baixo subir uma posição, e «cumprimos a P2» deixava de ter significado estável num
 * documento que é aprovado, executado e auditado.
 *
 * Guarda-se também o `ord`, que é o número com que a proposta saiu **naquele** PEA: é o que
 * está escrito no papel que o COS aprovou, e sem ele não se liga o item de controlo ao
 * documento impresso.
 *
 * Uma proposta sem chave declarada é da via do modelo de linguagem, que não tem regras.
 * Essa fica com a chave derivada do próprio texto — estável enquanto o texto não mudar, que
 * é a única promessa honesta que se pode fazer sobre ela.
 */
function controloMissoes(ops){
  const out = [];
  /* A chave da missão é declarada, como a da proposta, e não a sua posição na lista. Uma
     missão condicional — a rotação, os meios aéreos, o ponto de trânsito — aparece e
     desaparece conforme o dispositivo, e com chave posicional a M4 do PEA n.º 4 não era a
     M4 do n.º 5. Era o mesmo defeito que se corrigiu nas propostas, deixado por corrigir
     aqui. O recurso ao texto fica para as missões que uma pessoa escreveu à mão. */
  (ops.missoes||[]).forEach((x,i)=>out.push({k:x.ch || chaveDoTexto(x.texto||""), ord:"M"+(i+1),
    tipo:x.tipo||"Missão", texto:x.texto||"", estado:0}));
  (ops.propostas||[]).forEach(x=>out.push({k:x.ch || chaveDoTexto(x.texto||""), ord:x.id||"P",
    tipo:"Proposta", texto:x.texto||"", estado:0}));
  return out;
}

/**
 * As propostas genéricas que uma proposta específica torna dispensável — ou faz mentir.
 *
 * Um PEA com sete prioridades táticas em que duas dizem a mesma coisa por palavras
 * diferentes não é um plano mais completo: é um plano mais difícil de executar, e quem o lê
 * às três da manhã tem de decidir qual das duas manda. Pior ainda quando a genérica
 * **contradiz** a específica, que é o caso das duas abaixo.
 *
 * A retirada **não é silenciosa**. Uma proposta que desaparece sem rasto é indistinguível
 * de uma que ninguém pensou, e o plano passa a dizer menos do que sabe. O que sai fica
 * registado em `retiradas` e é escrito no documento, com a específica que a substituiu.
 *
 * **Cada par declara o seu porquê, e o porquê é auditado.** Sem isso, isto seria um sítio
 * onde alguém apaga uma proposta incómoda com aparência de método.
 */
const SUBSTITUICOES = [
  { gen:"DEFENSIVA", esp:"LIM-INTERDITO",
    porque:"«Postura defensiva fora da janela» diz, por contraste, que dentro da janela a "
      +"postura não é defensiva. Com a cabeça interdita acima dos 4 000 kW/m não há postura "
      +"ofensiva à cabeça a hora nenhuma, e a genérica enfraquece a interdição em vez de a "
      +"acompanhar. A segunda metade — sem ataque direto descendente com vento de drenagem "
      +"— já está por extenso na lista de segurança, e essa não se retira." },
  { gen:"M-RENDICOES", esp:"RENDICAO-VENCIDA",
    porque:"«Rendições faseadas no início e fecho da janela» é a cadência normal. Havendo "
      +"equipas com o tempo de empenhamento já vencido, mandar esperar pelo fecho da janela "
      +"é mandar manter no terreno quem devia já ter saído. A proposta específica nomeia-as "
      +"e manda rendê-las agora." },
];

/**
 * Retira as genéricas que uma específica presente substitui, e diz quais foram.
 *
 * As chaves procuram-se nas duas listas ao mesmo tempo — uma proposta pode substituir uma
 * missão e vice-versa, porque a redundância não conhece a fronteira entre o plano e as
 * ordens. É a mesma fronteira do art. 46.º, e ela reparte o documento, não o raciocínio.
 */
function retirarGenericas(propostas, missoes){
  const presentes = new Set(propostas.concat(missoes).map(x=>x.ch).filter(Boolean));
  const retiradas = [];
  const filtra = lista => lista.filter(x=>{
    const sub = SUBSTITUICOES.find(y=>y.gen === x.ch && presentes.has(y.esp));
    if(!sub) return true;
    retiradas.push({ ch:x.ch, esp:sub.esp, porque:sub.porque, texto:x.texto });
    return false;
  });
  return { propostas:filtra(propostas), missoes:filtra(missoes), retiradas };
}

/**
 * A linha que diz o que foi retirado do plano e porquê.
 *
 * **Existe para que a retirada seja uma decisão visível e não um desaparecimento.** Quem lê
 * o PEA impresso tem de poder verificar que a genérica saiu porque outra a cobre melhor, e
 * não porque alguém a achou incómoda. Vazio quando não se retirou nada — uma secção sempre
 * presente e quase sempre vazia treina quem lê a saltá-la.
 */
function textoRetiradas(retiradas){
  const R = Array.isArray(retiradas)? retiradas : [];
  if(!R.length) return "";
  return '<div class="pd-ret"><b>Retirado por proposta mais específica</b>'
    + R.map(x=>'<p>' + esc(x.texto) + ' <span class="fund">Substituída por ' + esc(x.esp)
        + ': ' + esc(x.porque) + '</span></p>').join("")
    + '</div>';
}

/**
 * Uma chave estável derivada do texto, para as propostas que não declaram a sua.
 *
 * Não é criptografia e não precisa de ser: precisa de dar a mesma chave para o mesmo texto e
 * chaves diferentes para textos diferentes, dentro de um plano com meia dúzia de propostas.
 * O prefixo `T-` diz de onde veio — ninguém deve confundir uma chave derivada do texto com
 * uma chave declarada numa regra, porque a primeira muda quando alguém reescreve a frase.
 */
function chaveDoTexto(txt){
  let h = 0;
  const s = String(txt).trim().toLowerCase().replace(/\s+/g, " ");
  for(let i=0;i<s.length;i++){ h = (h*31 + s.charCodeAt(i)) | 0; }
  return "T-" + Math.abs(h).toString(36).toUpperCase().slice(0, 6);
}
/* ================= os três estados de uma proposta de PEA =================
   A elaboração é da célula de planeamento; a aprovação e a determinação são do COS —
   art. 8.º, n.º 2, al. e), e art. 46.º. Até à r0061 a aplicação não modelava a diferença:
   emitia a proposta e produzia as ordens de missão no instante seguinte, dizendo ao
   modelo de linguagem que «o COS aprovou-o». Não tinha aprovado nada.

   E há um facto operacional que o modelo tem de respeitar: **o COS aprova depois de ter
   o PEA impresso à sua frente.** A aplicação não é o sítio onde a aprovação acontece; é
   o sítio onde ela fica registada, com quem a determinou, a função e o GDH.

     proposta  elaborada pela célula, ainda não saiu do ecrã
     análise   entregue ao COS, em apreciação — o documento está impresso e com ele
     aprovado  determinado pelo COS; só aqui nascem as ordens de missão

   `peaVigor()` passa a ser o último **aprovado**: o que está em vigor é o que o COS
   determinou, e não o último que a célula produziu. */
const PEA_ESTADOS = ["proposta", "analise", "aprovado"];
const PEA_ROT = { proposta:"Proposta", analise:"Em análise pelo COS", aprovado:"Aprovado pelo COS" };

/** O estado de uma proposta, com omissão segura para o que vier de antes. */
function estadoPEA(p){
  const e = p && p.estado;
  return PEA_ESTADOS.indexOf(e) >= 0? e : "proposta";
}
/** A última proposta produzida, esteja em que estado estiver. */
function peaUltimo(){ return O.peas.length? O.peas[O.peas.length-1] : null; }
/** O PEA em vigor: o último que o COS aprovou. */
function peaVigor(){
  for(let i=O.peas.length-1; i>=0; i--){ if(estadoPEA(O.peas[i]) === "aprovado") return O.peas[i]; }
  return null;
}

/**
 * Entrega a proposta ao COS. Passa de «proposta» a «em análise».
 *
 * Não é ato de comando: é o registo de que o documento saiu da célula e está com quem
 * decide. Serve para se saber há quanto tempo espera.
 */
function entregarPEA(n, ts){
  const p = O.peas.find(x=>x.n === n);
  if(!p || estadoPEA(p) !== "proposta") return { ok:false, motivo:"Só uma proposta por entregar pode passar a análise." };
  p.estado = "analise";
  p.analise = { g: gdhDe(ts==null? agora() : ts) };
  O.evolucao.push({g:p.analise.g, tipo:"posit",
    txt:"Proposta de PEA n.º "+n+" entregue ao COS para apreciação."});
  fita("PEA n.º "+n+" entregue ao COS ("+p.analise.g+")");
  return { ok:true };
}

/**
 * Regista a aprovação do COS, e só então produz as ordens de missão.
 *
 * A ordem importa e é doutrinária: a célula de operações transmite as ordens de missão
 * **depois** de o plano estar aprovado — art. 17.º, n.º 1, al. c). Enquanto não houver
 * aprovação registada, não há ordens nenhumas para transmitir.
 *
 * @param {number} n número da proposta
 * @param {{por:string, funcao:string, nota?:string, g?:string}} quem
 */
function aprovarPEA(n, quem){
  const p = O.peas.find(x=>x.n === n);
  if(!p) return { ok:false, motivo:"Proposta não encontrada." };
  if(!podeFazer("aprovar")) return { ok:false, motivo:motivoPerfil("aprovar") };
  if(estadoPEA(p) === "aprovado") return { ok:false, motivo:"O PEA n.º "+n+" já está aprovado." };
  const por = String((quem&&quem.por)||"").trim();
  if(!por) return { ok:false, motivo:"Indicar quem determina a aprovação." };
  const g = String((quem&&quem.g)||"").trim() || gdhAgora();
  if(!parseGDH(g)) return { ok:false, motivo:motivoGDH(g) };

  p.estado = "aprovado";
  p.aprovacao = { g, por, funcao:String((quem&&quem.funcao)||"COS").trim() || "COS",
    nota:String((quem&&quem.nota)||"").trim() };
  p.ultVerd = "vigor";
  O.evolucao.push({g, tipo:"decisao",
    txt:"PEA n.º "+n+" aprovado e determinado por "+p.aprovacao.funcao+" "+por
      + (p.aprovacao.nota? " — "+p.aprovacao.nota : "")+"."});
  fita("PEA n.º "+n+" aprovado por "+por+" ("+g+")");
  return { ok:true, pea:p };
}

/**
 * O que mudou desde que o plano em vigor foi aprovado, e quanto pesa.
 *
 * Cada item traz a norma que o torna relevante, porque a conclusão a tirar — rever o
 * plano, ou não — é do COS, e uma lista de diferenças sem fundamento não o ajuda a
 * decidir.
 *
 * @param {any} p o plano em vigor
 * @param {number} [ts] instante de referência para a caducidade; sem ele, o relógio
 */
function divergencia(p, ts){
  if(!p || !p.base) return null;
  const ref = ts==null? agora() : ts;
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
  const restante = p.validoTs? p.validoTs - ref : null;
  const expirado = restante !== null && restante <= 0;
  const verd = expirado? "caducado" : (score>=40? "rever" : (score>=20? "atencao":"vigor"));
  return {itens:it.sort((a,b2)=>b2.peso-a.peso), score, restante, expirado, verd,
    total: p.validoTs && p.ts? p.validoTs-p.ts : null};
}
const MS_EST = [{r:"por iniciar",c:""},{r:"em execução",c:"exec"},{r:"cumprida",c:"feita"}];
/**
 * O veredicto do plano em vigor, registado se mudou. Devolve se mudou.
 *
 * Vivia dentro de `renderVigor`: a pintura escrevia `p.ultVerd` e empurrava para a fita, de
 * 30 em 30 segundos pelo temporizador, **sem gravar** — a mudança ficava em memória até
 * alguém carregar num botão, e uma aba fechada levava-a. Sai da pintura e entra em
 * `persistir`, que é onde já se grava; a reavaliação periódica pergunta a `veredictoPendente`
 * se há veredicto por registar e, se houver, grava em vez de só pintar.
 */
function registarVeredicto(){
  const p = peaVigor(); if(!p) return false;
  const D = divergencia(p); if(!D || p.ultVerd === D.verd) return false;
  if(p.ultVerd) fita("PEA n.º "+p.n+" — "+VERD_ROT[D.verd].t.toLowerCase()+" (divergência "+D.score+")");
  p.ultVerd = D.verd;
  return true;
}
/** Há veredicto por registar? Pergunta sem escrever nada. */
function veredictoPendente(){
  const p = peaVigor(); if(!p) return false;
  const D = divergencia(p);
  return !!D && p.ultVerd !== D.verd;
}
/** Mostra o veredicto sobre o plano em vigor. Só mostra: registá-lo é de `registarVeredicto`. */
function renderVigor(){
  const C = $("pea-vigor"); if(!C) return;
  const p = peaVigor();
  if(!p){ C.innerHTML = ""; return; }
  const D = divergencia(p);
  if(!D){ C.innerHTML = ""; return; }
  const emVigorH = p.ts? (agora()-p.ts)/3600000 : 0;
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
        <span class="ms-t"><small>${esc(x.k)}${x.ord && x.ord !== x.k? " · "+esc(x.ord)+" no papel" : ""} · ${esc(x.tipo)}</small>${esc(x.texto)}</span>
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
/**
 * A situação, redigida a partir do que está registado — sem modelo de linguagem.
 *
 * Incorpora os registos de evolução posteriores ao plano anterior, o dispositivo à data e
 * o que mudou desde então. É composição, não redação: cada frase sai de um facto gravado.
 */
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
      +(ptObj().des? `Ponto de trânsito em ${ptObj().des}${ptObj().resp? ", responsável "+ptObj().resp:""}. ` : "")+(m.janela? `A meteorologia concentra a vantagem operacional na janela ${m.janela.inicio}–${m.janela.fim}; fora dela, contenção e defesa.` : "Sem janela de HR ≥ 50 %: postura defensiva contínua.")
      + " " + resumoDoFogo(retratoDoFogo()),
    previsao:`HR mínima ${m.hr_min.v} % às ${m.hr_min.h} (${m.hr_min.d}); recuperação até ${m.hr_max.v} % às ${m.hr_max.h}. T máxima ${m.t_max.v} °C às ${m.t_max.h} (${m.t_max.d}). Rotações: ${m.rotacoes.map(r=>r.h+" "+r.de+"→"+r.para).join("; ")||"sem rotações relevantes"}. ${m.convectivo.length? "Assinatura convectiva às "+m.convectivo.map(c=>c.h).join(" e ")+" — risco de rajadas erráticas.":"Sem precipitação prevista."} Nota: ${m.nota}.`
  };
}
/** A decisão e as missões, compostas do mesmo modo — do dispositivo e da janela. */
function detDecisao(novas, anterior){
  const m=metricas(), jan=m.janela, r=retratoOperacional(), dif=diferencasDesde(anterior);
  /* O ambiente de fogo entra aqui com o mesmo estatuto do dispositivo e da meteorologia.
     As propostas que dele saem vêm **à frente** das genéricas: a intensidade da frente
     decide se há sequer ataque à cabeça, e essa decisão precede a ordem de esforço. */
  const F = retratoDoFogo();
  /* A postura de manobra decide-se **num sítio só**, e o objetivo, a ação decisiva e as
     propostas de limite derivam dela. Antes eram dois blocos a decidir a mesma coisa por
     critérios diferentes, e o documento contradizia-se a si próprio. */
  const P = posturaDeManobra(F);
  const nomes = a => a.map(x=>x.n).join(", ");
  const fimJ = jan? jan.fim : null;
  const gdhLim = (()=>{ if(!fimJ) return "______";
    const partes = (m.t_max.d||"").split("/");
    const sufixo = partes.length===3 ? MES[(+partes[1])-1]+partes[2].slice(2) : "";
    return partes[0]+fimJ.replace("h","").padStart(2,"0")+"00"+sufixo; })();
  const bruto = {
    propostas:[
      /* Limite de manobra antes de tudo o resto. O número existe, tem fonte e tem origem
         declarada; deixá-lo fora do plano para repetir uma regra genérica era a falha que
         este trabalho corrige.
         **Qual destas dispara vem de `P.k`, e não de uma segunda leitura da intensidade.**
         Reavaliar aqui os mesmos limiares que a postura já avaliou era o que permitia ao
         objetivo dizer «dominar» enquanto a proposta dizia «interdito». */
      (P.k === "interdito")&&{id:"PI", ch:"LIM-INTERDITO",
        texto:`Interdição de ataque direto à cabeça: a intensidade frontal estimada é de ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m. `
          +`Ataque à cabeça apenas por meios aéreos ou indiretamente, com ancoragem pelos flancos e pela retaguarda. `
          +`Ninguém a menos de ${F.lim.seguranca} m da frente de chamas.`,
        fundamento:`${Math.round(F.r.v)} m/h (${F.r.origem}) sobre ${F.w.v} t/ha dão ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m e chama de ${fmtPT(F.lim.chama, 1)} m — acima dos 4 000 kW/m o controlo frontal é impossível (Alexander 2000, via Fernandes 2003); DON n.º 2, Anexo 3, situação n.º 10.`},
      (P.k === "aereo")&&{id:"PI", ch:"LIM-AEREO",
        texto:`Ataque à cabeça com apoio de meios aéreos; vigilância permanente de focos secundários a sotavento, com equipa dedicada.`,
        fundamento:`Intensidade frontal de ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m (${Math.round(F.r.v)} m/h, ${F.r.origem}): acima dos 2 000 kW/m a projeção de faúlhas é expectável e acima dos 4 000 o fogo de copas é quase certo (Alexander 2000).`},
      (P.k === "terrestre")&&{id:"PI", ch:"LIM-TERRESTRE",
        texto:`Ataque direto à cabeça admissível com meios terrestres sob pressão de água; máquinas de rasto em apoio à abertura de faixas, com veículo de combate a acompanhar cada máquina.`,
        fundamento:`Intensidade frontal de ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m (${Math.round(F.r.v)} m/h, ${F.r.origem}): entre 500 e 2 000 kW/m os meios terrestres são eficazes (Alexander 2000, via Fernandes 2003).`},
      (P.k === "manual")&&{id:"PI", ch:"LIM-MANUAL",
        texto:`Supressão com equipamento de sapador nas frentes de menor intensidade; reservar os meios com água para os troços de maior desenvolvimento.`,
        fundamento:`Intensidade frontal de ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m — abaixo dos 500 kW/m o equipamento manual é eficaz (Alexander 2000).`},
      (F.perfil && F.perfil.salto)&&{id:"PQ", ch:"SALTO-DECLIVE",
        texto:`Suspender a validade da previsão de propagação a partir da quebra de ${F.perfil.salto.para} % a ${String(F.perfil.salto.km).replace(".", ",")} km segundo ${F.perfil.rot}; reconhecimento obrigatório antes de empenhar meios para lá desse ponto.`,
        fundamento:`Passar de ${F.perfil.salto.deRef} % para ${F.perfil.salto.para} % multiplica a componente de declive por cerca de ${String(F.perfil.salto.k).replace(".", ",")}. A razão entre declives é independente do modelo de combustível, pelo que o salto é afirmável mesmo sem ele.`},
      (F.lim && F.linhas.some(l=>l.estreita))&&{id:"PL", ch:"LINHA-ESTREITA",
        texto:`Alargar as linhas de contenção com menos de ${String(F.lim.contencao).replace(".", ",")} m de largura útil antes de as considerar ancoragem: ${F.linhas.filter(l=>l.estreita).map(l=>(l.setor? "setor "+l.setor+", ":"")+String(l.larguraM).replace(".", ",")+" m").join("; ")}.`,
        fundamento:`Uma linha de contenção precisa de pelo menos uma vez e meia o comprimento da chama (${fmtPT(F.lim.chama, 1)} m), e só se não houver projeção de faúlhas com capacidade de ignição (regra atribuída a Byram 1959 por Fernandes 2003, por confirmar na fonte).`},
      (F.linhas.some(l=>l.semLargura))&&{id:"PW", ch:"LINHA-SEM-LARGURA",
        texto:`Declarar a largura útil das linhas já traçadas sem dimensão indicada${F.linhas.filter(l=>l.semLargura).some(l=>l.setor)? " ("+F.linhas.filter(l=>l.semLargura&&l.setor).map(l=>"setor "+l.setor).join(", ")+")":""}: sem largura não é possível aferir se servem de ancoragem.`,
        fundamento:"Linhas traçadas no teatro sem largura útil registada; a largura decide se a linha suporta a frente ou se apenas a atrasa."},
      (F.frentes.some(f=>f.rumoFonte === "sugerido pelo traçado"))&&{id:"PN", ch:"RUMO-POR-CONFIRMAR",
        texto:`Confirmar por observação o rumo de progressão das frentes cujo rumo foi deduzido do traçado antes de fixar a ordem de esforço.`,
        fundamento:`${F.frentes.filter(f=>f.rumoFonte === "sugerido pelo traçado").length} frente(s) com rumo sugerido pela geometria e não observado; a ordem de esforço assenta na direção de progressão.`},
      (F.detetados.porValidar.length)&&{id:"PS", ch:"SENSIVEIS-DETETADOS",
        texto:`Validar com o ERAS os pontos sensíveis detetados e ainda não constantes do plano: ${F.detetados.porValidar.slice(0,4).join("; ")}${F.detetados.porValidar.length>4? " e mais "+(F.detetados.porValidar.length-4):""}.`,
        fundamento:"Instalações sensíveis identificadas na deteção cartográfica e ausentes do campo de pontos sensíveis — art. 27.º, n.º 1, al. b)."},
      r.reativados.length&&{id:"PR", ch:"REATIVACAO",texto:`Prioridade absoluta à reativação em ${nomes(r.reativados)}: reforço imediato, reavaliação do perímetro e confirmação de rotas de fuga antes de qualquer outro empenho.`,fundamento:`Setor${r.reativados.length>1?"es":""} em reativação no quadro de estados; a reativação altera a ordem de esforço fixada na proposta anterior.`},
      (r.nAtivos===0 && r.setores.length>0)&&{id:"PC", ch:"CONSOLIDACAO",texto:`Sem frentes ativas: transição para consolidação de rescaldo e vigilância ativa em ${nomes(r.setores)}, com desmobilização faseada a começar pelos meios com mais horas de empenhamento.`,fundamento:`Nenhum setor em curso; ${r.nResolucao} em resolução, ${r.nConclusao} em conclusão, ${r.nVigilancia} em vigilância ativa.`},
      (r.nAtivos>0 && r.reserva===0 && r.c.m>=10)&&{id:"PV", ch:"RESERVA",texto:`Constituição de reserva tática fora da zona de intervenção, com um mínimo de dois grupos, antes de novo empenho no esforço principal.`,fundamento:`${r.c.m} meios no TO com ${r.nAtivos} setor${r.nAtivos>1?"es":""} em curso e sem reserva constituída.`},
      (r.c.m>=10 && !r.PT.des)&&{id:"PT", ch:"PONTO-TRANSITO",texto:`Estabelecimento do ponto de trânsito e sua difusão a todos os meios em despacho, com atribuição de missão nos primeiros 15 minutos após a chegada.`,fundamento:"O pedido de reforço implica ponto de trânsito que garanta o controlo das entradas e saídas do TO — DON n.º 2, pontos 7.d.(5), 7.d.(7) e 7.d.(8)."},
      r.excedidas.length&&{id:"PH", ch:"RENDICAO-VENCIDA",texto:`Rendição imediata de ${r.excedidas.slice(0,3).map(x=>x.nome+" ("+x.local+", "+x.txt+")").join("; ")}${r.excedidas.length>3? " e mais "+(r.excedidas.length-3):""}.`,fundamento:"Tempo de empenhamento acima do limite; equipas exaustas degradam a segurança e o rendimento."},
      (!r.excedidas.length && r.aviso.length)&&{id:"PH", ch:"RENDICAO-A-PREPARAR",texto:`Preparar a rendição de ${r.aviso.slice(0,3).map(x=>x.nome+" ("+x.local+", "+x.txt+")").join("; ")} antes de atingirem o limite.`,fundamento:"Tempo de empenhamento em aviso; a substituição planeada evita quebras de dispositivo."},
      (r.c.mr>2 && !nomeado("COPESP"))&&{id:"PM", ch:"COPESP",texto:`Nomeação do COPESP e integração das ${r.c.mr} máquinas de rasto no plano, com faixa de contenção atribuída e veículo de combate de apoio a cada máquina.`,fundamento:"Mais de duas máquinas de rasto no dispositivo — DON n.º 2, pontos 7.d.(22) e 7.d.(23)."},
      jan&&{id:"P1", ch:"JANELA",texto:`Empenho da reserva no esforço principal${r.ativos.length? " em "+nomes(r.ativos):""} na janela ${jan.inicio}–${jan.fim}.`,fundamento:`HR ${jan.hr_inicio} % → ${jan.hr_max} % — mínimo de intensidade do ciclo.`},
      {id:"P2", ch:"DEFENSIVA",texto:"Postura defensiva fora da janela; sem ataque direto descendente com vento de drenagem estabelecido.",fundamento:"LACES exige rotas de fuga que a encosta noturna não garante."},
      (m.alinhamento_relevo_vento&&m.alinhamento_relevo_vento.horas.length)&&{id:"PX", ch:"ALINHAMENTO",texto:`Nos períodos ${resumoHoras(m.alinhamento_relevo_vento.horas)}, proibição de posicionamento acima da frente nas encostas expostas a ${m.alinhamento_relevo_vento.orient}; ancoragens pelos flancos.`,fundamento:`Alinhamento fogo-declive-vento previsto (${m.alinhamento_relevo_vento.nota||"escoamento ascendente"})${m.alinhamento_relevo_vento.criticas.length? "; crítico com HR < 30 % às "+resumoHoras(m.alinhamento_relevo_vento.criticas):""}.`},
      m.rotacoes.length&&{id:"P3", ch:"ROTACAO",texto:`Liquidação de pontos quentes concluída antes da rotação de ${m.rotacoes[m.rotacoes.length-1].h}.`,fundamento:"Após a rotação, o bordo a sotavento pode virar cabeça."},
      {id:"P4", ch:"SENSIVEIS-PLANO",texto:`Defesa perimétrica dos pontos sensíveis (${O.dados.sensiveis||"a validar pelo ERAS"}), confinamento/evacuação em articulação com SMPC, INEM, CVP e GNR.`,fundamento:"Art. 8.º, n.º 2, als. l) e m) do Despacho 4067/2024."},
      m.convectivo.length&&{id:"P5", ch:"CONVECTIVO",texto:`Vigilância convectiva desde 2 h antes de ${m.convectivo[0].h}; retirada de zonas alinhadas se confirmada trovoada.`,fundamento:"Precipitação residual com rotação — assinatura convectiva."},
      /* A cláusula das rendições sai quando há equipas com o tempo já vencido: mandar
         esperar pelo fecho da janela seria contradizer a proposta que manda rendê-las
         agora. As vigias e a cadência de pontos de situação não dependem disso e ficam —
         é por isso que esta se estreita em vez de ser retirada por `SUBSTITUICOES`. */
      {id:"P6", ch:"VIGIA",texto:`Vigias em todos os ${r.setores.length||""} setores; pontos de situação de 3 em 3 horas`
        +(r.excedidas.length? "." : "; rendições no início e fecho da janela."),/* Sem previsão carregada, `t_max` vem a «—» e o fundamento saía «Máxima de — °C em
           — — a fase crítica exige equipas frescas», num documento aprovado. Um fundamento
           que não se lê é pior do que um fundamento genérico: parece que houve leitura. */
        fundamento: m.t_max.v === "—"
          ? "Sem previsão carregada não há máxima do ciclo; a vigilância e a cadência de pontos de situação não dependem dela."
          : `Máxima de ${m.t_max.v} °C em ${m.t_max.d} — a fase crítica exige equipas frescas.`},
      dif.length&&{id:"PD", ch:"DIFUSAO",texto:`Difusão da alteração do dispositivo aos comandantes de setor no próximo ponto de situação: ${dif.join("; ")}.`,fundamento:"As alterações registadas desde a proposta anterior mudam a base de planeamento e têm de ser conhecidas em todo o TO."}
    /* O `id` é **de apresentação** e continua posicional: dentro de um PEA, «P2» é o
       segundo item da lista, e é assim que se lê no papel. A `ch` é a **identidade**, vem
       declarada na regra e atravessa revisões — é ela que responde a «cumprimos aquilo?»
       quando o plano já vai na quinta versão. Confundir as duas foi o defeito: o controlo
       de execução usava o número da posição, e P3 no PEA n.º 4 não era P3 no n.º 5. */
    ].filter(Boolean),
    objetivo: r.reativados.length
      ? `${P.verbo} a reativação em ${nomes(r.reativados)} e restabelecer o perímetro${P.fecho? " "+P.fecho:""}${jan? ", com empenho da reserva na janela "+jan.inicio+"–"+jan.fim:""}.`
      : (r.nAtivos===0 && r.setores.length
        ? `Concluir o rescaldo e assegurar a vigilância ativa em ${nomes(r.setores)}, com desmobilização faseada e sem reacendimentos.`
        : (jan? `${P.verbo} as frentes ativas${r.ativos.length? " em "+nomes(r.ativos):""} e fechar o perímetro${P.fecho? " "+P.fecho:""} até às ${jan.fim} de ${m.t_max.d}, com empenho da reserva na janela ${jan.inicio}–${jan.fim}.`
              : `${P.verbo} as frentes ativas${r.ativos.length? " em "+nomes(r.ativos):""}${P.fecho? ", "+P.fecho+",":""} e proteger aglomerados até revisão do PEA.`)),
    missoes:[
      {tipo:"Ação decisiva", ch:"M-DECISIVA",
        /* O verbo e o modo de fecho vêm da postura, e a razão vai com eles: quem lê a ação
           decisiva tem de saber porque é «conter» e não «dominar», sem ter de a cruzar com
           as propostas mais abaixo. */
        texto: (r.reativados.length? `${P.verbo} a reativação em ${nomes(r.reativados)} e restabelecer o perímetro${P.fecho? " "+P.fecho:""}.`
             : (r.nAtivos===0 && r.setores.length? "Concluir o rescaldo e consolidar a vigilância ativa, sem reacendimentos."
             : (jan? `${P.verbo} as frentes ativas${r.ativos.length? " em "+nomes(r.ativos):""} e fechar o perímetro${P.fecho? " "+P.fecho:""} na janela ${jan.inicio}–${jan.fim}.`
                   : `${P.verbo} as frentes ativas${P.fecho? ", "+P.fecho+",":""} e proteger aglomerados.`)))
             + (P.k !== "sem-dados"? " " + P.porque : ""),
        atribuida: r.reativados.length? "Setor"+(r.reativados.length>1?"es":"")+" "+nomes(r.reativados)+" + Reserva"
                 : (r.ativos.length? "Setor"+(r.ativos.length>1?"es":"")+" "+nomes(r.ativos)+" + Reserva" : "Setores empenhados + Reserva"),
        gdh:gdhLim},
      /* Uma ação que não nomeia ninguém não é uma ação específica — art. 46.º, n.º 1.
         Os aglomerados vêm do que está registado; não havendo nada registado, diz-se isso
         em vez de se mandar defender «os expostos», que não identifica coisa nenhuma. */
      {tipo:"Ação de moldagem", ch:"M-AGLOMERADOS",
        texto: (O.dados.sensiveis||"").trim()
          ? `Defesa preventiva de ${String(O.dados.sensiveis).trim()}; contenção defensiva no período noturno.`
          : "Reconhecimento e listagem dos aglomerados expostos antes de lhes atribuir defesa preventiva: nenhum está registado na ocorrência. Contenção defensiva no período noturno.",
        atribuida:"Setor da frente ativa + meios de proteção civil", gdh: jan? gdhLim:"______"},
      m.rotacoes.length? {tipo:"Ação de moldagem", ch:"M-ROTACAO", texto:`Liquidação dos pontos quentes antes da rotação de ${m.rotacoes[m.rotacoes.length-1].h}.`, atribuida:"Setores em consolidação", gdh:"______"}:null,
      r.aereos? {tipo:"Ação de moldagem", ch:"M-AEREOS", texto:`Meios aéreos (${r.aereos} no TO): último ciclo nas frentes ativas até ao ocaso; reativação ao nascer do sol.`, atribuida:"Meios aéreos — OPAR/COPAR", gdh:"______"}:null,
      r.PT.des? {tipo:"Ação de moldagem", ch:"M-PONTO-TRANSITO", texto:`Controlo das entradas e saídas pelo ponto de trânsito em ${r.PT.des}; missão atribuída a cada equipa nos primeiros 15 minutos.`, atribuida:r.PT.resp||"Ponto de trânsito", gdh:"______"}:null,
      {tipo:"Ação de moldagem", ch:"M-RENDICOES", texto:"Rendições faseadas com meios frescos no início e fecho da janela; reposicionamento antes da rotação.", atribuida:"Todos os setores + Reserva", gdh:"______"}
    ].filter(Boolean),
    seguranca:["Protocolo LACES e EPI florestal obrigatórios em todos os setores.",
      /* A distância deixa de ser princípio e passa a ser número. É a diferença entre uma
         medida que se lê e uma que se cumpre. */
      ...(F.lim? [`Distância mínima à frente de chamas: ${F.lim.seguranca} m — quatro vezes a altura da chama, tomada igual ao comprimento por se desconhecer a inclinação, para a tolerância de 7 kW/m² de radiação incidente (Butler e Cohen 1998, por Fernandes 2003). ${AVISO_SEGURANCA}`] : []),
      ...(F.lim && !F.lim.direto? [`Intensidade frontal acima dos 4 000 kW/m: nenhuma equipa à frente da cabeça, em nenhuma circunstância. Reavaliar se a intensidade descer.`] : []),
      ...(F.lim && F.lim.i >= 2000? [`Projeção de faúlhas expectável acima dos 2 000 kW/m: vigia dedicado a sotavento e reconhecimento periódico da retaguarda.`] : []),
      "Proibição de ataque direto descendente em encosta com catabático estabelecido sem rota de fuga confirmada.",
      ...m.rotacoes.slice(0,2).map(r=>`Máxima atenção às ${r.h} (${r.de}→${r.para}) — transição de regime, comportamento errático.`),
      ...(m.convectivo.length?["Se confirmada trovoada: retirada imediata de zonas alinhadas e suspensão de operações em cumeada."]:[]),
      "Trabalho noturno: iluminação individual, movimentação em equipa, atenção a árvores enfraquecidas."],
    validade: jan? `Validade até ${jan.fim}; revisão obrigatória no fecho da janela, a cada rotação observada e a cada agravamento registado.` : "Validade máxima 6 h; revisão a cada alteração do vento."
  };
  /* As genéricas saem depois de tudo composto, e não durante: uma específica pode nascer de
     um ramo que só se avalia mais abaixo na lista, e filtrar a meio deixaria passar a
     genérica por a específica ainda não existir no momento do teste. */
  const limpo = retirarGenericas(bruto.propostas, bruto.missoes);
  /* A numeração de apresentação refaz-se **depois** da retirada. `P3` tem de ser o terceiro
     item do documento impresso; com a renumeração antes, ficava um buraco onde a genérica
     esteve e o papel saltava de P2 para P4. */
  return Object.assign(bruto, {
    propostas: limpo.propostas.map((p,i)=>({...p, id:"P"+(i+1)})),
    missoes: limpo.missoes,
    retiradas: limpo.retiradas,
  });
}

/* Repartição determinística pela fronteira do Despacho n.º 4067/2024: tudo o que é
   plano vai para planeamento; só as ordens de missão ficam em operações. */
function detCompleto(novas, anterior){
  const a = detSituacao(novas, anterior), b = detDecisao(novas, anterior);
  return {
    pea: {situacao:a.situacao, analise_zi:a.analise_zi, previsao:a.previsao,
          objetivo:b.objetivo, propostas:b.propostas, retiradas:b.retiradas,
          seguranca:b.seguranca, validade:b.validade},
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

/**
 * O cartão do estado da última proposta: onde ela está e o que falta para andar.
 *
 * Vive por cima da vista do PEA, porque é a pergunta que se faz primeiro ao olhar para
 * um plano: já foi aprovado?
 */
function renderEstadoPEA(){
  const C = $("pea-estado"); if(!C) return;
  const p = peaUltimo();
  if(!p){ C.innerHTML = ""; return; }
  const est = estadoPEA(p);
  const ap = p.aprovacao || {};

  const corpo = est === "proposta"
    ? `<p class="hint" style="margin:0 0 12px 0">A proposta está elaborada e por entregar. O COS aprecia o plano <b>a partir do documento impresso</b>: imprime a proposta, entrega-a, e regista aqui a entrega.</p>
       <div class="row"><button class="btn btn-o" type="button" id="pe-entregar">Entregar ao COS para apreciação</button></div>`
    : est === "analise"
    ? `<p class="hint" style="margin:0 0 12px 0">Entregue ao COS a <b>${esc(p.analise.g||"—")}</b>. A aprovação é ato de comando e acontece fora desta aplicação: aqui regista-se quem a determinou, com que função e a que horas. <b>As ordens de missão são produzidas no momento em que a aprovação fica registada</b> — antes disso não há ordens para transmitir.</p>
       <div class="grid g3">
         <div><label for="pe-por">Quem determina</label><input id="pe-por" placeholder="posto, nome e apelido" value="${esc(quemRegista())}"></div>
         <div><label for="pe-fn">Função</label><input id="pe-fn" placeholder="COS" value="COS"></div>
         <div><label for="pe-g">GDH da aprovação</label><input id="pe-g" placeholder="vazio = agora"></div>
       </div>
       <div style="margin-top:12px"><label for="pe-nota">Nota para o processo</label><input id="pe-nota" placeholder="opcional — determinações do COS na aprovação"></div>
       <div class="row" style="margin-top:12px"><button class="btn btn-o" type="button" id="pe-aprovar">Registar aprovação do COS</button></div>`
    : `<p class="hint" style="margin:0">Aprovado e determinado por <b>${esc((ap.funcao||"COS")+" "+(ap.por||"—"))}</b> a <b>${esc(ap.g||"—")}</b>${ap.nota? " — "+esc(ap.nota) : ""}.${
         (p.ctrl&&p.ctrl.length)? " Ordens de missão produzidas: "+p.ctrl.length+" em controlo de execução." : ""}</p>`
      + (p.semOrdens
         ? `<div class="msg err" style="display:block;margin-top:10px">Este PEA está aprovado <b>sem ordens de missão</b>: ${esc(p.semOrdens.motivo)} (${esc(p.semOrdens.g)}). Enquanto assim estiver, não há controlo de execução nesta aplicação e a transmissão das missões faz-se fora dela.</div>`
           + `<div class="row" style="margin-top:10px"><button class="btn btn-o" type="button" id="pe-ordens">Produzir ordens de missão</button></div>`
         : "");

  C.innerHTML = `<div class="card">
    <h2>Estado da proposta n.º ${p.n} <span class="tag">elaboração da célula · aprovação e determinação do COS — art. 8.º, n.º 2, al. e)</span></h2>
    <div class="pe-fx">${PEA_ESTADOS.map(k=>`<span class="pe-e ${k===est? "on":""}${PEA_ESTADOS.indexOf(k)<PEA_ESTADOS.indexOf(est)? " feita":""}">${esc(PEA_ROT[k])}</span>`).join("")}</div>
    ${corpo}
    <div class="msg" id="pe-msg" style="display:none"></div>
  </div>`;

  const bE = $("pe-entregar");
  if(bE) bE.addEventListener("click", ()=>{
    const r = entregarPEA(p.n);
    if(!r.ok){ aviso("pe-msg","err",r.motivo); return; }
    persistir(false); pintarTudo();
  });
  const bO = $("pe-ordens");
  if(bO) bO.addEventListener("click", async ()=>{
    bO.disabled = true; bO.innerHTML = '<span class="spin"></span> Ordens de missão…';
    const q = await produzirOrdensDoAprovado(p);
    await persistir(false); pintarTudo();
    if(q.ok) aviso("msg-ia","ok","Ordens de missão do PEA n.º "+p.n+" produzidas: "+q.n+" em controlo de execução.");
    else aviso("pe-msg","err","Continua sem ordens de missão: "+q.motivo+".");
  });
  const bA = $("pe-aprovar");
  if(bA) bA.addEventListener("click", async ()=>{
    const q = gdhDoCampo("pe-g", "pe-msg");
    if(!q.ok) return;
    const r = aprovarPEA(p.n, { por:$("pe-por").value, funcao:$("pe-fn").value,
      nota:$("pe-nota").value, g:($("pe-g").value.trim()? q.g : "") });
    if(!r.ok){ aviso("pe-msg","err",r.motivo); return; }
    bA.disabled = true; bA.innerHTML = '<span class="spin"></span> Ordens de missão…';
    /* `ord` e não `q`: `q` já é o GDH conferido, três linhas acima. */
    const ord = await produzirOrdensDoAprovado(r.pea);
    await persistir(false);
    pintarTudo();
    if(ord.ok) aviso("msg-ia","ok","PEA n.º "+p.n+" aprovado. Ordens de missão produzidas: "+ord.n+" em controlo de execução.");
    else aviso("msg-ia","err","PEA n.º "+p.n+" APROVADO, mas SEM ORDENS DE MISSÃO: "+ord.motivo
      + ". A aprovação do COS está registada; a transmissão das missões tem de ser feita fora da aplicação até as ordens serem produzidas.");
  });
}
