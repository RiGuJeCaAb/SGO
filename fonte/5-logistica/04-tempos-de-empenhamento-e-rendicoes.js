/* ================= LOGÍSTICA · tempos de empenhamento e rendições (art. 33.º) ================= */
function limiares(){
  const n = (id,d)=>{ const el=$(id); const x = el? parseFloat(el.value) : NaN; return isNaN(x)? d : x; };
  return { av:n("r-av",8), lim:n("r-lim",12), aer:n("r-aer",6) };
}
function rendicoes(ts){
  const e = estObj(), L = limiares(), out = [];
  const instante = (ts==null? agora() : ts);
  (e.setores||[]).forEach((x,i)=>{
    (x.tip||[]).forEach(it=>{
      if(!it.ts) return;
      const d = catDef(it.t);
      const aereo = !!(it.ar || d.ar);
      const teto = aereo? L.aer : L.lim, avi = aereo? Math.max(1,L.aer-2) : L.av;
      const h = (instante-it.ts)/3600000;
      out.push({
        /* Uma linha por unidade: a rendição pede-se ao CSREPC por veículo, com a hora
           de saída e a de chegada ao destino — DON n.º 2, ponto 7.e.(5)(r). Um bloco de
           três com um relógio só não permitia pedir a rendição de uma delas. */
        nome: it.t+(it.ent? " · "+it.ent : ""), local:"Setor "+NOMES_SETOR[i], op: (+it.ou||0),
        h, txt: fmtH(h), aereo, teto, avi, ts: it.ts,
        nivel: h>=teto? "r" : (h>=avi? "a":"v"),
        limite: new Date(it.ts + teto*3600000)
      });
    });
  });
  aerLista().forEach(a=>{
    if(!a.ts) return;
    const h = (instante-a.ts)/3600000;
    out.push({
      nome: (a.ind||a.t)+(a.ind? " ("+a.t+")":""), local:"Meios aéreos", op:0,
      h, txt: fmtH(h), aereo:true, teto:L.aer, avi:Math.max(1,L.aer-2), ts:a.ts,
      nivel: h>=L.aer? "r" : (h>=Math.max(1,L.aer-2)? "a":"v"),
      limite: new Date(a.ts + L.aer*3600000)
    });
  });
  return out.sort((p,q)=>q.h-p.h);
}
/* descreve uma lista de aeronaves agrupando as que não têm indicativo próprio */
function descreverAer(L){
  const nomeadas = L.filter(a=>a.ind).map(a=>a.ind);
  const anon = {};
  L.filter(a=>!a.ind).forEach(a=>{ anon[a.t] = (anon[a.t]||0)+1; });
  const grupos = Object.keys(anon).map(t=> anon[t]+"× "+t);
  return nomeadas.concat(grupos).join(", ");
}
function fmtH(h){ const t=Math.round(h*60); return Math.floor(t/60)+" h "+String(t%60).padStart(2,"0")+" min"; }

/* Os destinos continuam a ser os identificadores antigos: a tabela de atalhos
   traduz-os para o painel da célula. Só os rótulos precisavam de deixar de mentir. */
const AV_DESTINO = {
  ata:{p:"p-pea", l:"Elaborar o PEA em Planeamento"},
  posit:{p:"p-evo", l:"Registar POSIT em Operações"},
  copart:{p:"p-pco", l:"Nomear em Comando"},
  coparar:{p:"p-pco", l:"Nomear em Comando"},
  copesp:{p:"p-pco", l:"Nomear em Comando"},
  pt:{p:"p-logistica", l:"Definir em Logística e Finanças"},
  vigor:{p:"p-pea", l:"Ver o PEA em vigor em Planeamento"},
  fase:{p:"p-occ", l:"Rever a fase em Comando"},
  notif:{p:"p-fita", l:"Registar confirmação na fita do tempo"},
  pmepc:{p:"p-evo", l:"Registar o pedido em Operações"},
  pco:{p:"p-pco", l:"Nomear em Comando"},
  placom:{p:"p-logistica", l:"Atribuir canais em Logística e Finanças"},
  reparticao:{p:"p-fontes", l:"Ver o dispositivo em Operações"}
};
function caixaAviso(x){
  const rot = x.n==="ob"? "Obrigação legal" : (x.n==="av"? "Antecipação" : "Conformidade verificada");
  const d = AV_DESTINO[x.id];
  /* Só as obrigações que são ato externo ganham o botão de dar por cumprido, e só
     enquanto estiverem por cumprir. O que a aplicação consegue observar cumpre-se
     fazendo a coisa. */
  const feito = cumprimentoDe(x.id);
  const cump = (x.n === "ob" && CUMPRIVEIS[x.id] && !feito)? CUMPRIVEIS[x.id] : null;
  return `<div class="avd-b ${x.n}">
    <span class="avd-n">${rot}</span>
    <div class="avd-t">${esc(x.t)}</div>
    <div class="avd-s"><span class="avd-k">Situação</span><div class="avd-v">${esc(x.s)}</div></div>
    <div class="avd-s"><span class="avd-k">Fundamento</span><div class="avd-v">${esc(x.f)}</div></div>
    <div class="avd-s"><span class="avd-k">Determinação</span><div class="avd-v">${esc(x.a)}</div></div>
    <div class="avd-f">
      <span class="avd-r">${esc(x.r)}</span>
      ${cump? `<button type="button" class="avd-go" data-cump="${esc(x.id)}">${esc(cump.rot)}</button>`:""}
      ${feito? `<button type="button" class="avd-go" data-descump="${esc(x.id)}">Retirar o registo de ${esc(feito.g)}</button>`:""}
      ${d? `<button type="button" class="avd-go" data-ir="${esc(d.p)}">${esc(d.l)}</button>`:""}
    </div>
  </div>`;
}
/* Quem confirma, por omissão: o COS se estiver nomeado. Poupa escrita e evita que o
   campo fique com o nome de quem não determinou. */
function quemConfirma(){
  const n = (()=>{ try{ return nomeado("Comandante das Operações") || nomeado("COS"); }catch(e){ return null; } })();
  return (n && n.nome) || "";
}

function ligarIr(el){
  if(!el) return;
  el.querySelectorAll("[data-cump]").forEach(b=>b.addEventListener("click", async ()=>{
    const id = b.getAttribute("data-cump"), c = CUMPRIVEIS[id]; if(!c) return;
    const por = window.prompt("Quem confirma que "+c.d+"?\n\nFica registado com o GDH corrente, na evolução e na fita.", quemConfirma());
    if(por === null) return;
    const nota = window.prompt("Nota para o processo (opcional):", "");
    if(nota === null) return;
    const r = await registarCumprimento(id, por, nota);
    if(!r.ok){ window.alert(r.motivo); return; }
    pintarDON();
  }));
  el.querySelectorAll("[data-descump]").forEach(b=>b.addEventListener("click", async ()=>{
    const id = b.getAttribute("data-descump"), x = cumprimentoDe(id); if(!x) return;
    if(!window.confirm("Retirar o cumprimento registado a "+x.g+" por "+x.por+"?\n\nA obrigação volta a estar por cumprir.")) return;
    await retirarCumprimento(id, quemConfirma());
    pintarDON();
  }));
  el.querySelectorAll("[data-ir]").forEach(b=>b.addEventListener("click", ()=>{ window.irPara(b.dataset.ir); window.scrollTo({top:0,behavior:"smooth"}); }));
}
function pintarDON(){
  try{ if(typeof renderVigor==="function" && !window.__emVigor){ window.__emVigor=1; renderVigor(); window.__emVigor=0; } }catch(e){ window.__emVigor=0; }
  try{ O.meta.inicio = $("o-inicio").value.trim(); O.meta.fase = $("o-fase").value.trim(); }catch(err){}
  let v = [];
  try{ v = verificacoesDON(); }catch(err){ v = []; }
  const ativos = v.filter(x=>x.n!=="ok"), conformes = v.filter(x=>x.n==="ok");
  const ob = ativos.filter(x=>x.n==="ob").length, av = ativos.filter(x=>x.n==="av").length;

  /* sinal no cabeçalho */
  const b = $("b-sinal");
  if(b){
    b.className = "sinal " + (ob? "r" : (av? "a" : "v"));
    const q = $("sinal-qt"); if(q) q.textContent = ativos.length? String(ativos.length) : "0";
    b.title = ob? (ob+" obrigação"+(ob>1?"ões":"")+" em incumprimento — abrir a secção de avisos")
      : (av? (av+" aviso"+(av>1?"s":"")+" de antecipação — abrir a secção de avisos") : "Sem avisos ativos — abrir a secção de avisos");
  }

  /* caixas */
  const L = $("av-lista");
  if(L){
    L.innerHTML = ativos.length
      ? '<div class="avd-g">'+ativos.map(caixaAviso).join("")+'</div>'
      : '<div class="avd-vazio">Sem avisos ativos. Todas as verificações aplicáveis ao estado atual da ocorrência estão cumpridas.</div>';
    ligarIr(L);
  }
  const K = $("av-ok");
  if(K){
    K.innerHTML = conformes.length
      ? '<div class="avd-g">'+conformes.map(caixaAviso).join("")+'</div>'
      : '<div class="avd-vazio">Ainda sem verificações confirmadas. Preencher o GDH de início em Comando e o dispositivo em Operações.</div>';
    ligarIr(K);
  }
  const T = $("av-tag");
  if(T) T.textContent = ativos.length? (ob+" em incumprimento · "+av+" a antecipar") : "sem avisos ativos";
  const T2 = $("av-ok-tag");
  if(T2) T2.textContent = conformes.length+(conformes.length===1? " verificação confirmada":" verificações confirmadas");

  pintarAmpulhetas();
}
function pintarAmpulhetas(){
  const alvos = [$("amp-quadro"), $("amp-quadro-2")].filter(Boolean);
  if(!alvos.length) return;
  const el = { set innerHTML(v){ alvos.forEach(a=>a.innerHTML=v); } };
  let R = [];
  try{ R = rendicoes(); }catch(e){ R = []; }
  const tg = $("amp2-tag");
  if(tg){ const venc = R.filter(x=>x.nivel==="r").length, avi = R.filter(x=>x.nivel==="a").length;
    tg.textContent = R.length? (R.length+(R.length===1? " meio em contagem":" meios em contagem")
      +(venc? " · "+venc+" com rendição vencida":"")+(avi? " · "+avi+" a preparar":""))
      : "nenhum meio em contagem"; }
  if(!R.length){
    el.innerHTML = '<div class="avd-vazio">Nenhum meio em contagem. Os relógios arrancam ao atribuir tipologias aos setores em Operações e ao registar meios aéreos com hora de entrada.</div>';
    return;
  }
  const L = limiares();
  const esc2 = t=>esc(t);
  const linhas = R.map(x=>{
    /* a barra representa o que RESTA até ao limite: nasce cheia e esvazia */
    const resta = Math.max(0, x.teto - x.h);
    const pct = Math.min(100, (resta/x.teto)*100);
    const cor = x.nivel==="r"? "var(--fogo)" : (x.nivel==="a"? "var(--terra)" : "var(--madeira)");
    const mkAv = Math.min(100,((x.teto-x.avi)/x.teto)*100);
    const rot = x.nivel==="r"? "Vencida" : (x.nivel==="a"? "A preparar" : "Em curso");
    const rTxt = resta>0? fmtH(resta) : "esgotada";
    return `<div class="amp-r">
      <div class="amp-m">${esc2(x.nome)}<small>${esc2(x.local)}${x.op? " · "+x.op+" op.":""}${x.aereo? " · aéreo":""}</small></div>
      <div class="amp-t" style="color:${cor}">${esc2(rTxt)}</div>
      <div class="amp-e">${esc2(x.txt)} no TO</div>
      <div class="amp-bar" title="capacidade restante até ao limite de ${esc(x.teto)} h; aviso a ${esc(x.teto-x.avi)} h do fim">
        <span class="amp-fill" style="width:${pct.toFixed(1)}%;background:${cor}"></span>
        <span class="amp-mk" style="left:${mkAv.toFixed(1)}%"></span>
      </div>
      <div class="amp-e">rendição às ${hhmm(x.limite)}</div>
      <div class="amp-s ${x.nivel}">${rot}</div>
    </div>`;
  }).join("");
  /* O bloco da ação, por cima do quadro: quem está para além do limite e ainda não tem
     rendição pedida, e quem já tem. É a leitura que interessa a quem comanda — o quadro
     diz os tempos, isto diz o que falta fazer com eles. */
  const RD = (()=>{ try{ return estadoDasRendicoes(); }catch(e){ return {pedidas:[],porPedir:[]}; } })();
  const acao = (!RD.porPedir.length && !RD.pedidas.length)? ""
    : `<div class="sub" style="margin-bottom:14px">
        <span class="stit">Solicitações de rendição ao CSREPC</span>
        ${RD.porPedir.length? `<p class="hint" style="margin:0 0 8px 0">${RD.porPedir.length===1
            ? "Um meio está para além do limite de empenhamento e ainda não tem rendição solicitada."
            : RD.porPedir.length+" meios estão para além do limite de empenhamento e ainda não têm rendição solicitada."}</p>
          <div class="tip-chips" style="margin-left:0">${RD.porPedir.map(x=>
            `<button type="button" class="btn btn-o" data-rend="${esc(x.alvo)}">Solicitar rendição — ${esc(x.nome)} · ${esc(x.onde)}</button>`).join("")}</div>` : ""}
        ${RD.pedidas.length? `<p class="hint" style="margin:8px 0 0 0">Solicitadas: ${RD.pedidas.map(x=>
            esc(x.nome)+" ("+esc(x.onde)+", "+esc(x.g)+")").join("; ")}.</p>` : ""}
      </div>`;
  el.innerHTML = acao + `<div class="amp-h"><span>Meio</span><span>Resta</span><span>Decorrido</span><span>Capacidade restante</span><span>Rendição prevista</span><span>Estado</span></div>${linhas}
    <p class="amp-leg">Cada barra nasce cheia à entrada no TO e esvazia-se até ao limite de empenhamento: o que se vê é a capacidade que resta, não o tempo já gasto. A marca vertical assinala o momento em que a rendição deve começar a ser preparada, ${L.av} h de trabalho em terra e ${Math.max(1,L.aer-2)} h no ar, sobre limites de ${L.lim} h e ${L.aer} h. A hora de rendição prevista é a hora de entrada somada ao limite, e é o valor a transmitir ao CSREPC no pedido de substituição, junto com o número de elementos, o veículo que entra e a hora de saída dos rendidos.</p>`;
  alvos.forEach(a=>a.querySelectorAll("[data-rend]").forEach(b=>
    b.addEventListener("click", ()=>{ irPara("p-operacoes"); abrirRendicao(b.getAttribute("data-rend")); })));
}
/* nível DECIR derivado da data, quando não imposto manualmente */
function autoNivelDECIR(){
  const sel = $("o-nivel"); if(!sel) return;
  const base = parseGDH($("o-inicio").value.trim()) || new Date();
  const n = nivelDECIR(base);
  const inf = $("o-inicio-info");
  if(inf) inf.textContent = "Base do cálculo dos 90 minutos (ATI para ATA, DON n.º 2, ponto 7.e.(5)). "
    + (n? "Nível DECIR para esta data: "+n+" ("+fonteDECIR(base)+")."
        : "Nível DECIR: não há tabela de períodos para "+base.getFullYear()
          +" nesta revisão da aplicação — escolhe-o à mão, pela diretiva do ano.");
}


/* ██████ TURNO ██████ */
