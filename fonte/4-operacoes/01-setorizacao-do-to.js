/* ================= OPERAÇÕES · setorização do TO (art. 17.º, al. d)) ================= */
/**
 * Muda o estado de um setor pelo caminho único, seja qual for a porta por onde a
 * mudança entrou — o menu da linha do setor, ou uma frase-tipo da evolução.
 *
 * A mudança de estado é facto operacional, e por isso deixa registo sozinha: entra na
 * evolução como automática e na fita do tempo. Um segundo caminho que não fizesse isto
 * daria um dispositivo a mudar sem que a evolução o contasse — e a análise da repartição
 * lê o dispositivo, portanto passaria a analisar o que ninguém registou.
 *
 * @param {number} i índice do setor
 * @param {string} novo estado, dos cinco do ponto 7.f da DON n.º 2
 * @returns {boolean} se o estado mudou de facto
 */
function mudarEstadoSetor(i, novo){
  const e = estObj(), x = e.setores[i];
  if(!x || ESTADOS_SETOR.indexOf(novo) < 0 || x.estado === novo) return false;
  if(encerrada()) return false;   /* registo fechado: reabrir antes de alterar */
  const anterior = x.estado || "\u2014";
  const tipoEvo = (novo===ESTADOS_SETOR[0] || novo===ESTADOS_SETOR[4])? "agravamento" : "melhoria";
  x.estado = novo;
  O.evolucao.push({g:gdhAgora(), tipo:tipoEvo,
    txt:"Setor "+NOMES_SETOR[i]+" \u2014 estado alterado de \""+anterior+"\" para \""+novo+"\" (registo automático)"});
  fita("Evolução automática: Setor "+NOMES_SETOR[i]+" -> "+novo);
  comporSetores(); persistir(false);
  return true;
}
/* Desde a versão 10 do estado, cada entrada de `tip` é **uma unidade**: não há
   quantidade a multiplicar. Duas viaturas iguais são duas entradas, porque podem vir de
   corpos diferentes e ter entrado no TO a horas diferentes. */
function totSetor(x){
  const tip = x.tip||[];
  return { m: tip.reduce((a,i)=>a+(+i.mu||1),0), o: tip.reduce((a,i)=>a+(+i.ou||0),0) };
}

/**
 * Agrupa as unidades por tipologia, para onde um resumo é o que serve — o texto do PEA,
 * o briefing, a linha do setor. O estado continua por unidade; agrupa-se para mostrar,
 * nunca para guardar.
 *
 * @returns {{t:string, n:number, m:number, o:number}[]}
 */
function agruparTip(tip){
  const por = {};
  (tip||[]).forEach(it=>{
    const k = it.t || "";
    if(!por[k]) por[k] = { t:k, n:0, m:0, o:0 };
    por[k].n++; por[k].m += (+it.mu||1); por[k].o += (+it.ou||0);
  });
  return Object.keys(por).map(k=>por[k]);
}
/**
 * Medidor do tempo de uma unidade no teatro de operações: uma razão contra um limite,
 * que é a forma certa para «quanto falta até à rendição» — pista e marca na mesma escala,
 * sem donut e sem ícone.
 *
 * A cor diz o estado; **o número ao lado diz quanto, em tinta de texto e não na cor da
 * marca**, para que a leitura não dependa de distinguir cores. O limiar é o mesmo que o
 * quadro de rendições usa, e o título traz a hora-limite por extenso.
 */
function medidorTempo(it){
  if(!it || !it.ts) return '<span class="med-h" title="sem instante de empenhamento: esta unidade não conta tempo no TO">sem relógio</span>';
  const L = limiares(), d = catDef(it.t);
  const teto = (it.ar || d.ar)? L.aer : L.lim;
  const avi  = (it.ar || d.ar)? Math.max(1, L.aer-2) : L.av;
  const h = (Date.now() - it.ts)/3600000;
  const nivel = h>=teto? "r" : (h>=avi? "a" : "v");
  const pct = Math.max(0, Math.min(100, (h/teto)*100));
  const limite = gdhDe(it.ts + teto*3600000);
  const titulo = h.toFixed(1)+" h no TO desde "+gdhDe(it.ts)+" · limite de "+teto+" h · rendição prevista para "+limite;
  return '<span class="med '+nivel+'" title="'+esc(titulo)+'">'
    + '<span class="med-p"><span class="med-f" style="width:'+pct.toFixed(0)+'%"></span></span>'
    + '<span class="med-h">'+h.toFixed(1)+' h</span></span>';
}

/** O resumo em texto: «2× ECIN, 1× VFCI». */
function resumoTip(tip){ return agruparTip(tip).map(g=>g.n+"× "+g.t).join(", "); }
function renderSetores(){
  const e = estObj();
  $("s-n").value = String(e.n||0);
  renderAereos();
  const RS = reservaObj(), ZA = zaObj();
  $("s-res").checked = !!(RS.m||RS.o); $("s-res-x").style.display = $("s-res").checked? "":"none"; $("s-res-m").value=RS.m; $("s-res-o").value=RS.o;
  $("s-za").checked = !!(ZA.m||ZA.o); $("s-za-x").style.display = $("s-za").checked? "":"none"; $("s-za-m").value=ZA.m; $("s-za-o").value=ZA.o;
  $("s-livre").checked = !!e.livre;
  $("d-setores").style.display = e.livre? "":"none";
  $("s-lista").style.display = e.livre? "none":"";
  while(e.setores.length < e.n) e.setores.push({estado:ESTADOS_SETOR[0],cmd:"",ct:"",adj:"",m:"",o:"",tip:[]});
  e.setores.length = e.n;
  e.setores.forEach(x=>{ x.tip = x.tip||[]; x.estado = migrarEstado(x.estado); });
  const L = $("s-lista");
  if(!e.n){ L.innerHTML = e.livre? "" : '<p class="hint">Escolhe o número de setores e a estrutura é criada automaticamente.</p>'; comporSetores(); return; }
  L.innerHTML = '<div class="set-head"><span>Setor</span><span>Estado</span><span>Comandante de setor (art. 10.º)</span><span>Adjunto (n.º 4)</span><span>Contacto</span><span>Meios</span><span>Op.</span></div>' +
    e.setores.map((x,i)=>{
      const auto = (x.tip||[]).length>0, t = totSetor(x);
      const mVal = auto? t.m : (x.m||""), oVal = auto? t.o : (x.o||"");
      return `<div class="set-box"><div class="set-row">
        <span class="nm">${NOMES_SETOR[i]}</span>
        <select data-i="${i}" data-f="estado">${ESTADOS_SETOR.map(o=>`<option${o===x.estado?" selected":""}>${o}</option>`).join("")}</select>
        <input data-i="${i}" data-f="cmd" value="${esc(x.cmd)}" placeholder="ex.: Cmdt CB ...">
        <input data-i="${i}" data-f="adj" value="${esc(x.adj||"")}" placeholder="adjunto (opcional)">
        <input data-i="${i}" data-f="ct" value="${esc(x.ct)}" placeholder="9........." inputmode="tel">
        <input data-i="${i}" data-f="m" value="${mVal}" placeholder="0" inputmode="numeric"${auto?" readonly title=\"calculado das tipologias\"":""}>
        <input data-i="${i}" data-f="o" value="${oVal}" placeholder="0" inputmode="numeric"${auto?" readonly title=\"calculado das tipologias\"":""}>
      </div>
      <div class="tip-add">
        <select id="ta-t-${i}">${catOptions()}</select>
        <span class="lbl">QTD</span><input id="ta-q-${i}" type="number" min="1" value="1">
        <span class="lbl">OP/UNID</span><input id="ta-o-${i}" type="number" min="0" value="5">
        <span class="lbl">ORIGEM</span><input id="ta-e-${i}" placeholder="corpo de bombeiros ou entidade" style="width:180px">
        <button class="btn btn-g" type="button" data-add="${i}">Atribuir</button>
      </div>
      <div class="tip-chips" id="tc-${i}">${(x.tip||[]).map((it,j)=>{
        const destinos = ['<option value="">mover…</option>']
          .concat(e.setores.map((_,k)=>k!==i? `<option value="${k}">→ ${NOMES_SETOR[k]}</option>`:"").filter(Boolean))
          .concat(['<option value="D">Desmobilizar</option>']).join("");
        return `<span class="tchip"><b>${esc(it.t)}</b>${it.ent? ` <span class="ent">${esc(it.ent)}</span>`:""} ${(it.mu||1)}m/${(it.ou||0)}op ${medidorTempo(it)}
          <select data-mv="${i}" data-j="${j}" class="mv">${destinos}</select>
          <button type="button" data-del="${i}" data-j="${j}" aria-label="remover">×</button></span>`;
      }).join("")}</div></div>`;
    }).join("");
  // eventos das linhas
  L.querySelectorAll(".set-row input,.set-row select").forEach(el=>{
    el.addEventListener("change", ()=>{
      const i = +el.dataset.i;
      if(el.dataset.f==="estado"){ mudarEstadoSetor(i, el.value); return; }
      e.setores[i][el.dataset.f]=el.value; comporSetores(); persistir(false); });
  });
  // selects de tipologia: pré-preencher op/unid do catálogo
  e.setores.forEach((x,i)=>{
    const st=$("ta-t-"+i), so=$("ta-o-"+i);
    st.addEventListener("change", ()=>{ so.value = catDef(st.value).ou; });
    so.value = catDef(st.value).ou;
  });
  L.querySelectorAll("[data-add]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const i=+b.dataset.add, t=$("ta-t-"+i).value, q=+$("ta-q-"+i).value||1, ou=+$("ta-o-"+i).value||0;
      const ent = ($("ta-e-"+i)? $("ta-e-"+i).value.trim() : "");
      const d=catDef(t), ts=Date.now();
      /* A quantidade é comodidade de escrita, não forma do estado: cria n unidades
         independentes, cada uma com o seu relógio e a sua origem daí para a frente. */
      for(let k=0;k<Math.max(1,Math.round(q));k++){
        e.setores[i].tip.push({t, mu:d.mu, ou, mr:d.mr||0, ar:d.ar||0, ts, ent});
      }
      fita("Atribuído "+q+"× "+t+(ent? " ("+ent+")":"")+" ao Setor "+NOMES_SETOR[i]);
      renderSetores(); pintarDON(); persistir(false);
    });
  });
  L.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const it = e.setores[+b.dataset.del].tip[+b.dataset.j];
      fita("Removido "+it.t+(it.ent? " ("+it.ent+")":"")+" do Setor "+NOMES_SETOR[+b.dataset.del]);
      e.setores[+b.dataset.del].tip.splice(+b.dataset.j,1); renderSetores(); persistir(false); });
  });
  L.querySelectorAll("[data-mv]").forEach(sel=>{
    sel.addEventListener("change", ()=>{
      const i=+sel.dataset.mv, j=+sel.dataset.j, dest=sel.value;
      if(dest===""){ return; }
      const it = e.setores[i].tip[j];
      if(dest==="D"){
        fita("Desmobilizado "+it.t+(it.ent? " ("+it.ent+")":"")+" (Setor "+NOMES_SETOR[i]+", "+((Date.now()-(it.ts||Date.now()))/3600000).toFixed(1)+" h de empenhamento)");
        e.setores[i].tip.splice(j,1);
      } else {
        const k=+dest;
        fita("Movimento: "+it.t+(it.ent? " ("+it.ent+")":"")+" de "+NOMES_SETOR[i]+" para "+NOMES_SETOR[k]);
        e.setores[i].tip.splice(j,1);
        e.setores[k].tip.push(it); // mantém ts original: as horas de empenhamento no TO não se apagam com a mudança de setor
      }
      renderSetores(); persistir(false);
    });
  });
  comporSetores();
}
function comporSetores(){
  const e = estObj();
  if(e.livre){ O.dados.setores = $("d-setores").value.trim(); $("s-tot").textContent=""; return; }
  const linhas = e.setores.map((x,i)=>{
    const partes = ["Setor "+NOMES_SETOR[i]+" — "+(x.estado||"")];
    if(x.cmd) partes.push("Man: "+x.cmd+(x.ct? " ("+x.ct+")":""));
    if(x.adj) partes.push("Adj: "+x.adj);
    const tip=x.tip||[];
    if(tip.length){
      partes.push(agruparTip(tip).map(g=>g.n+" "+g.t).join(", "));
      const t=totSetor(x); partes.push(t.m+" meios / "+t.o+" op.");
    } else if(x.m||x.o) partes.push((x.m||"?")+" meios / "+(x.o||"?")+" op.");
    return partes.join("; ");
  });
  const extra=[];
  const AL = aerLista();
  if(AL.length) extra.push("Meios aéreos: "+AL.length+" ("+AL.map(a=>a.ind||a.t).join(", ")+").");
  const RS = reservaObj(), ZA = zaObj();
  if(RS.m||RS.o) extra.push("Reserva: "+(RS.m||"?")+" meios / "+(RS.o||"?")+" op.");
  if(ZA.m||ZA.o) extra.push("ZA: "+(ZA.m||"?")+" meios / "+(ZA.o||"?")+" op.");
  O.dados.setores = [...linhas, extra.join(" ")].filter(x=>x&&x.trim()).join("\n");
  $("d-setores").value = O.dados.setores;
  const tm = e.setores.reduce((a,x)=>{const t=totSetor(x); return a+((x.tip||[]).length? t.m : (+x.m||0));},0)+(+RS.m||0)+(+ZA.m||0);
  const to = e.setores.reduce((a,x)=>{const t=totSetor(x); return a+((x.tip||[]).length? t.o : (+x.o||0));},0)+(+RS.o||0)+(+ZA.o||0);
  $("s-tot").textContent = e.n? "Totais calculados: "+tm+" meios · "+to+" operacionais"+(aerLista().length? " · "+aerLista().length+" meios aéreos":"")+". Efetivos por unidade conforme o Anexo 1 da DON n.º 2 / DECIR 2026; o campo OP/UNID pode ser corrigido para o efetivo real da força." : "";
}
$("s-n").addEventListener("change", ()=>{ estObj().n = +$("s-n").value; renderSetores(); persistir(false); });
(function(){ const sf=$("pc-f"); if(sf) sf.addEventListener("change", ()=>{ try{ pintarCampoSolicitacao(); }catch(e){} }); })();
$("pc-add").addEventListener("click", ()=>{
  const f = $("pc-f").value, nome = $("pc-n").value.trim();
  const P = pcoObj();
  const idx = P.funcoes.findIndex(x=>x.f===f && f!=="Oficial de ligação de entidade" && f!=="Outra função");
  const ant = idx>=0? P.funcoes[idx] : null;
  const reg = { f, nome, entidade:$("pc-e").value.trim(), ct:$("pc-c").value.trim(),
    siresp:(ant&&ant.siresp)||"", ba:(ant&&ant.ba)||"",
    /* Dois instantes distintos nos núcleos de nomeação externa (arts. 23.º n.º 2,
       24.º n.º 2 e 25.º n.º 2): o COS solicita, a entidade nomeia. `g` fica vazio
       enquanto o pedido estiver pendente — sem nome não há nomeação. */
    solicitado: ($("pc-sol")? $("pc-sol").value.trim() : "") || (ant&&ant.solicitado) || "",
    g: $("pc-g").value.trim() || (nome? gdhAgora() : "") };
  if(idx>=0) P.funcoes[idx] = reg; else P.funcoes.push(reg);
  ["pc-n","pc-e","pc-c","pc-g","pc-sol"].forEach(id=>{ const el=$(id); if(el) el.value=""; });
  fita(reg.g
    ? "Nomeação: "+f+(nome? " — "+nome:"")+" ("+reg.g+")"
    : "Solicitação de nomeação: "+f+" a "+(reg.entidade||pcoDef(f).ext||"entidade competente")+" ("+(reg.solicitado||gdhAgora())+") — por nomear");
  O.evolucao.push({g: reg.g || reg.solicitado || gdhAgora(), tipo:"posit",
    txt: reg.g
      ? "Nomeação de "+f+(nome? ": "+nome:"")+(reg.ct? " ("+reg.ct+")":"")+"."
      : "Solicitação de nomeação de "+f+" a "+(pcoDef(f).ext||"entidade competente")+", por nomear."});
  renderPCO(); renderComs(); pintarDON(); persistir(false);
});
$("aer-add").addEventListener("click", ()=>{
  const t = $("aer-t").value, ind = $("aer-i").value.trim();
  const g = $("aer-g").value.trim(), d = parseGDH(g);
  aerLista().push({t, ind, g: g||gdhAgora(), ts: (d? d.getTime() : Date.now())});
  $("aer-i").value=""; $("aer-g").value="";
  fita("Meio aéreo registado no TO: "+(ind||t)+" ("+t+")");
  renderAereos(); comporSetores(); pintarDON(); persistir(false);
});
$("s-res").addEventListener("change", ()=>{ const R=reservaObj(); if(!$("s-res").checked){ R.m=""; R.o=""; } else R.m=R.m||"0"; renderSetores(); persistir(false); });
["s-res-m","s-res-o"].forEach(id=>$(id).addEventListener("change", ()=>{ const R=reservaObj(); R.m=$("s-res-m").value; R.o=$("s-res-o").value; comporSetores(); persistir(false); }));
$("s-za").addEventListener("change", ()=>{ const Z=zaObj(); if(!$("s-za").checked){ Z.m=""; Z.o=""; } else Z.m=Z.m||"0"; renderSetores(); persistir(false); });
["s-za-m","s-za-o"].forEach(id=>$(id).addEventListener("change", ()=>{ const Z=zaObj(); Z.m=$("s-za-m").value; Z.o=$("s-za-o").value; comporSetores(); persistir(false); }));
$("s-livre").addEventListener("change", ()=>{ estObj().livre=$("s-livre").checked; renderSetores(); persistir(false); });
$("d-setores").addEventListener("change", ()=>{ if(estObj().livre){ O.dados.setores=$("d-setores").value.trim(); persistir(false); } });

/* pontos sensíveis: adição rápida */
$("ps-add").addEventListener("click", ()=>{
  const n=$("ps-nome").value.trim(); if(!n) return;
  const atual=$("d-sensiveis").value.trim();
  $("d-sensiveis").value = (atual? atual+"; ":"") + n + " (" + $("ps-pri").value + ")";
  $("ps-nome").value=""; O.dados.sensiveis=$("d-sensiveis").value; persistir(false);
});

