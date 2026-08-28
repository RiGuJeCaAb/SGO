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
        nome: it.q+"× "+it.t, local:"Setor "+NOMES_SETOR[i], op: it.q*(+it.ou||0),
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

const AV_DESTINO = {
  ata:{p:"p-pea", l:"Ir à secção 6 · PEA"},
  posit:{p:"p-evo", l:"Registar POSIT na secção 4"},
  copart:{p:"p-pco", l:"Nomear na secção 3"},
  coparar:{p:"p-pco", l:"Nomear na secção 3"},
  copesp:{p:"p-pco", l:"Nomear na secção 3"},
  pt:{p:"p-fontes", l:"Definir na secção 2"},
  vigor:{p:"p-pea", l:"Ver o PEA em vigor na secção 6"},
  fase:{p:"p-occ", l:"Rever a fase na secção 1"},
  notif:{p:"p-fita", l:"Registar confirmação na fita do tempo"},
  pmepc:{p:"p-evo", l:"Registar o pedido na secção 4"},
  pco:{p:"p-pco", l:"Nomear na secção 3"},
  placom:{p:"p-pco", l:"Atribuir canais na secção 3"}
};
function caixaAviso(x){
  const rot = x.n==="ob"? "Obrigação legal" : (x.n==="av"? "Antecipação" : "Conformidade verificada");
  const d = AV_DESTINO[x.id];
  return `<div class="avd-b ${x.n}">
    <span class="avd-n">${rot}</span>
    <div class="avd-t">${esc(x.t)}</div>
    <div class="avd-s"><span class="avd-k">Situação</span><div class="avd-v">${esc(x.s)}</div></div>
    <div class="avd-s"><span class="avd-k">Fundamento</span><div class="avd-v">${esc(x.f)}</div></div>
    <div class="avd-s"><span class="avd-k">Determinação</span><div class="avd-v">${esc(x.a)}</div></div>
    <div class="avd-f">
      <span class="avd-r">${esc(x.r)}</span>
      ${d? `<button type="button" class="avd-go" data-ir="${d.p}">${esc(d.l)}</button>`:""}
    </div>
  </div>`;
}
function ligarIr(el){
  if(!el) return;
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
      : '<div class="avd-vazio">Ainda sem verificações confirmadas. Preencher o GDH de início na secção 1 e o dispositivo na secção 2.</div>';
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
    el.innerHTML = '<div class="avd-vazio">Nenhum meio em contagem. Os relógios arrancam ao atribuir tipologias aos setores na secção 2 e ao registar meios aéreos com hora de entrada.</div>';
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
      <div class="amp-bar" title="capacidade restante até ao limite de ${x.teto} h; aviso a ${x.teto-x.avi} h do fim">
        <span class="amp-fill" style="width:${pct.toFixed(1)}%;background:${cor}"></span>
        <span class="amp-mk" style="left:${mkAv.toFixed(1)}%"></span>
      </div>
      <div class="amp-e">rendição às ${hhmm(x.limite)}</div>
      <div class="amp-s ${x.nivel}">${rot}</div>
    </div>`;
  }).join("");
  el.innerHTML = `<div class="amp-h"><span>Meio</span><span>Resta</span><span>Decorrido</span><span>Capacidade restante</span><span>Rendição prevista</span><span>Estado</span></div>${linhas}
    <p class="amp-leg">Cada barra nasce cheia à entrada no TO e esvazia-se até ao limite de empenhamento: o que se vê é a capacidade que resta, não o tempo já gasto. A marca vertical assinala o momento em que a rendição deve começar a ser preparada, ${L.av} h de trabalho em terra e ${Math.max(1,L.aer-2)} h no ar, sobre limites de ${L.lim} h e ${L.aer} h. A hora de rendição prevista é a hora de entrada somada ao limite, e é o valor a transmitir ao CSREPC no pedido de substituição, junto com o número de elementos, o veículo que entra e a hora de saída dos rendidos.</p>`;
}
/* nível DECIR derivado da data, quando não imposto manualmente */
function autoNivelDECIR(){
  const sel = $("o-nivel"); if(!sel) return;
  const base = parseGDH($("o-inicio").value.trim()) || new Date();
  const n = nivelDECIR(base);
  const inf = $("o-inicio-info");
  if(inf) inf.textContent = "Base do cálculo dos 90 minutos (ATI para ATA, DON n.º 2, ponto 7.e.(5)). Nível DECIR para esta data: " + n + ".";
}


/* ██████ TURNO ██████ */
