/* ================= construtor de setores (art. 5.º — referência alfabética) ================= */
const NOMES_SETOR = ["Alfa","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India","Juliett","Kilo","Lima"];
const ESTADOS_SETOR = ["Em curso (ativo)","Em resolução (dominado)","Em conclusão (extinto)","Vigilância ativa e consolidação de rescaldo","Reativação"];
/* Migração de estados antigos para a nomenclatura oficial da DON n.º 2 / DECIR 2026, ponto 7.f */
const MAPA_ESTADOS = {"Frente ativa":"Em curso (ativo)","Em consolidação":"Em resolução (dominado)","Rescaldo":"Em conclusão (extinto)","Vigilância ativa":"Vigilância ativa e consolidação de rescaldo"};
function migrarEstado(v){ return MAPA_ESTADOS[v] || (ESTADOS_SETOR.includes(v)? v : ESTADOS_SETOR[0]); }
/* ================= catálogo de tipologias — DON n.º 2 / DECIR 2026, Anexo 1 =================
   mu: veículos/meios técnicos por unidade | ou: operacionais por unidade
   mr: máquinas de rasto incluídas | ar: meio aéreo | v: constituição variável | c: composição (DON) */
const CATALOGO = [
  /* --- Equipas dos Corpos de Bombeiros --- */
  {g:"Equipas — Corpos de Bombeiros", t:"EIP", mu:1, ou:5, c:"1 VCI + 5 bombeiros"},
  {g:"Equipas — Corpos de Bombeiros", t:"ECIN", mu:1, ou:5, c:"1 VCI + 5 bombeiros"},
  {g:"Equipas — Corpos de Bombeiros", t:"ECIN R", mu:1, ou:5, c:"1 VCI + 5 bombeiros (reforço de outro CB)"},
  {g:"Equipas — Corpos de Bombeiros", t:"ELAC", mu:1, ou:2, c:"1 meio técnico de apoio logístico + 2 ou 3 bombeiros"},
  {g:"Equipas — Corpos de Bombeiros", t:"ELAC R", mu:1, ou:2, c:"1 meio técnico de apoio logístico + 2 ou 3 bombeiros (reforço)"},
  {g:"Equipas — Corpos de Bombeiros", t:"EMR (CB)", mu:3, ou:4, mr:1, c:"1 MR + 1 porta-máquinas + 1 veículo de apoio; chefe, operador e 2 condutores"},
  {g:"Equipas — Corpos de Bombeiros", t:"ERAS", mu:1, ou:2, c:"2 elementos para avaliação e apoio operacional"},
  {g:"Equipas — Corpos de Bombeiros", t:"EPCO", mu:1, ou:6, v:1, c:"constituição variável: coordenador do PCO, células e núcleos conforme a fase do SGO"},
  {g:"Equipas — Corpos de Bombeiros", t:"EMIF", mu:1, ou:5, c:"1 VCI + até 5 elementos (municipal, acionada pelo CSREPC)"},
  /* --- Brigadas dos Corpos de Bombeiros --- */
  {g:"Brigadas — Corpos de Bombeiros", t:"BCIN", mu:3, ou:12, c:"2 ECIN + 1 ELAC; máx. 12 bombeiros"},
  {g:"Brigadas — Corpos de Bombeiros", t:"BCIN R", mu:4, ou:14, c:"2 ECIN-R + 1 ELAC-R + 1 VCOT; máx. 14 bombeiros"},
  {g:"Brigadas — Corpos de Bombeiros", t:"BRIR", mu:4, ou:14, c:"1 VCOT + 2 ECIN + 1 ELAC; 14 bombeiros (Sub-regiões adjacentes)"},
  {g:"Brigadas — Corpos de Bombeiros", t:"BRMAQ", mu:6, ou:15, mr:1, c:"1 EMR com 2.º operador + 2 VCI + 1 VCOT; máx. 15 bombeiros"},
  /* --- Grupos e Companhias dos Corpos de Bombeiros --- */
  {g:"Grupos e Companhias — CB", t:"GCIN", mu:7, ou:26, c:"2 BCIN + 1 VCOT; máx. 26 bombeiros"},
  {g:"Grupos e Companhias — CB", t:"GCIN R", mu:7, ou:26, c:"4 ECIN-R + 2 ELAC-R + 1 VCOT; máx. 26 bombeiros"},
  {g:"Grupos e Companhias — CB", t:"GRIR", mu:10, ou:32, c:"4 VCI + 2 VTT + 2 VCOT + 1 apoio logístico + 1 ABSC; 32 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GRUATA", mu:18, ou:53, mr:1, c:"6 VFCI + 3 VTT + 1 VTGC/VALE + 3 VCOT + 2 apoio logístico + 1 ABSC + 1 MR e transporte; 53 bombeiros + 1 guia; força não divisível"},
  {g:"Grupos e Companhias — CB", t:"GCPI", mu:9, ou:32, c:"4 VCI urbanos + 1 VLCI cat. 3 + 2 VTT + 1 VCOT + 1 ABSC; 32 bombeiros"},
  {g:"Grupos e Companhias — CB", t:"GRPI", mu:11, ou:36, c:"4 VCI urbanos + 1 VLCI cat. 3 + 2 VTT + 2 VCOT + 1 apoio logístico + 1 ABSC; 36 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GREL", mu:6, ou:24, c:"4 VLCI + 1 VTT + 1 VCOT; 24 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GRMAQ", mu:13, ou:32, mr:2, c:"2 BRMAQ + 1 VCOT; 32 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GRRA", mu:6, ou:12, c:"5 veículos tanque > 15.000 l + 1 VCOT; 12 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GREPH", mu:13, ou:26, c:"1 VCOT + 12 ABSC; 26 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GRES", mu:13, ou:26, c:"6 ABTD + 6 ABTM + 1 VCOT; máx. 26 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"CRIR", mu:40, ou:124, mr:1, v:1, c:"comando + 3 GCIN + 1 GREL + 1 GRRA + 1 EMR + 2 apoio logístico + 1 ABSC; até 40 veículos e 124 bombeiros + 1 guia"},
  /* --- UEPS da GNR --- */
  {g:"UEPS da GNR", t:"ETATI", mu:1, ou:4, c:"1 VLCI + 4 militares; apoio terrestre a EHATI/BHATI"},
  {g:"UEPS da GNR", t:"PATE", mu:6, ou:22, v:1, c:"nível máximo: 1 VCOT + 2 VLCI + 2 VFCI + 1 VTTR; até 22 operacionais; força não divisível"},
  {g:"UEPS da GNR", t:"GRUATA (UEPS)", mu:11, ou:44, v:1, c:"nível máximo: 2 VCOT + 4 VLCI + 4 VFCI + 1 VTTR (+1 VCOC); até 44 operacionais; força não divisível"},
  /* --- ICNF, I.P. --- */
  {g:"ICNF, I.P.", t:"ESF", mu:1, ou:5, c:"1 VLCI + 4 ou 5 elementos; 1.ª intervenção, rescaldo e vigilância ativa"},
  {g:"ICNF, I.P.", t:"EFSBF", mu:1, ou:5, c:"1 VLCI ou VFCI + 4 ou 5 sapadores bombeiros florestais"},
  {g:"ICNF, I.P.", t:"ECNAF", mu:1, ou:4, c:"1 VLCI + mín. 4 elementos; regime florestal e áreas classificadas"},
  {g:"ICNF, I.P.", t:"EGFR", mu:1, ou:3, c:"até 3 elementos; suporte às células de planeamento e operações do PCO"},
  {g:"ICNF, I.P.", t:"BSF", mu:3, ou:15, c:"3 VLCI + 12 a 15 elementos"},
  {g:"ICNF, I.P.", t:"BFSBF", mu:3, ou:15, c:"2 VLCI + 1 VFCI ou 3 VLCI; 12 a 15 sapadores bombeiros florestais"},
  {g:"ICNF, I.P.", t:"EMR (ICNF)", mu:3, ou:3, mr:1, c:"1 MR + 1 porta-máquinas + 1 veículo de apoio; chefe, operador e condutor"},
  /* --- FEPC da ANEPC --- */
  {g:"FEPC da ANEPC", t:"EAUF", mu:1, ou:3, c:"3 elementos; análise e uso do fogo, suporte às células do PCO"},
  {g:"FEPC da ANEPC", t:"EMR (FEPC)", mu:3, ou:4, mr:1, c:"1 MR + 1 porta-máquinas + 1 veículo de apoio; chefe, operador e 2 condutores"},
  /* --- AFOCELCA --- */
  {g:"AFOCELCA", t:"ECL", mu:1, ou:3, c:"1 VLCI + 3 operacionais com ferramentas manuais"},
  {g:"AFOCELCA", t:"ECT", mu:1, ou:5, c:"1 VFCI + 5 operacionais com ferramentas manuais"},
  {g:"AFOCELCA", t:"EAT", mu:1, ou:2, c:"1 VTT + 2 operacionais"},
  {g:"AFOCELCA", t:"EMR (AFOCELCA)", mu:3, ou:2, mr:1, c:"1 MR + 1 porta-máquinas + 1 veículo de apoio; condutor e manobrador"},
  /* --- Meios aéreos --- */
  {g:"Meios aéreos", t:"HEBL", mu:1, ou:0, ar:1, comb:1, ind:"HOTEL", c:"até 1.000 l; indicativo HOTEL (ANEPC)"},
  {g:"Meios aéreos", t:"HEBM", mu:1, ou:0, ar:1, comb:1, ind:"HOTEL", c:"1.000 a 2.500 l; indicativo HOTEL (ANEPC)"},
  {g:"Meios aéreos", t:"HEBP", mu:1, ou:0, ar:1, comb:1, ind:"KILO", c:"superior a 2.500 l; indicativo KILO"},
  {g:"Meios aéreos", t:"HERAC", mu:1, ou:0, ar:1, ind:"FIRE", c:"reconhecimento, avaliação e coordenação, com COPAR-Ar; indicativo FIRE"},
  {g:"Meios aéreos", t:"AVBM", mu:1, ou:0, ar:1, comb:1, ind:"ALFA", c:"3.000 a 5.000 l; indicativo ALFA"},
  {g:"Meios aéreos", t:"AVBP", mu:1, ou:0, ar:1, comb:1, ind:"BRAVO", c:"superior a 5.000 l; indicativo BRAVO"},
  {g:"Meios aéreos", t:"AVRAC", mu:1, ou:0, ar:1, ind:"OSCAR", c:"reconhecimento e avaliação, pode levar COPAR-Ar; indicativo OSCAR"},
  {g:"Meios aéreos", t:"UAS", mu:1, ou:2, ar:1, c:"aeronave não tripulada com equipa e equipamento de controlo"},
  {g:"Meios aéreos", t:"EHATI", mu:0, ou:5, c:"5 operacionais transportados em HEBL; ataque inicial"},
  {g:"Meios aéreos", t:"BHATI", mu:0, ou:8, c:"8 ou mais operacionais transportados em HEBM; ataque inicial"},
  {g:"Meios aéreos", t:"ECH (AFOCELCA)", mu:0, ou:5, ind:"CELCA", c:"5 operacionais transportados em HEBL; indicativo CELCA"},
  /* --- Viaturas isoladas --- */
  {g:"Viaturas isoladas", t:"VFCI", mu:1, ou:5}, {g:"Viaturas isoladas", t:"VECI", mu:1, ou:5},
  {g:"Viaturas isoladas", t:"VRCI", mu:1, ou:5}, {g:"Viaturas isoladas", t:"VLCI", mu:1, ou:4},
  {g:"Viaturas isoladas", t:"VUCI", mu:1, ou:3}, {g:"Viaturas isoladas", t:"VTT", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"VTTR", mu:1, ou:2}, {g:"Viaturas isoladas", t:"VTTU", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"VTGC", mu:1, ou:2}, {g:"Viaturas isoladas", t:"VALE", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"VCOT", mu:1, ou:1}, {g:"Viaturas isoladas", t:"VCOC", mu:1, ou:3},
  {g:"Viaturas isoladas", t:"VPCC", mu:1, ou:3}, {g:"Viaturas isoladas", t:"VTPT", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"VOPE", mu:1, ou:2}, {g:"Viaturas isoladas", t:"ABSC", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"ABTD", mu:1, ou:2}, {g:"Viaturas isoladas", t:"ABTM", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"MR isolada", mu:1, ou:1, mr:1, c:"máquina de rasto isolada"},
  {g:"Viaturas isoladas", t:"Trator agrícola/florestal", mu:1, ou:1},
  {g:"Outro", t:"Outro", mu:1, ou:1}
];
function catOptions(){
  const grupos = [...new Set(CATALOGO.map(c=>c.g))];
  return grupos.map(g=>'<optgroup label="'+g+'">'+CATALOGO.filter(c=>c.g===g).map(c=>'<option value="'+c.t+'"'+(c.c? ' title="'+esc(c.c)+'"':'')+'>'+c.t+(c.v?' (variável)':'')+'</option>').join("")+'</optgroup>').join("");
}
/* As entradas do catálogo variam de forma conforme a tipologia; o tipo é aberto
   de propósito. Ver o Anexo 1 da DON n.º 2. */
/** @param {string} t @returns {any} */
function catDef(t){ return CATALOGO.find(c=>c.t===t) || {mu:1,ou:1}; }
function ptObj(){
  if(!O.dados.pt || typeof O.dados.pt!=="object") O.dados.pt = {des:"",resp:"",ct:"",cd:"",obs:""};
  O.dados.pt = Object.assign({des:"",resp:"",ct:"",cd:"",obs:""}, O.dados.pt);
  return O.dados.pt;
}
/** @returns {Dispositivo} */
function estObj(){ O.dados.est = O.dados.est || {n:0,setores:[],aer:"",aerL:[],res:{m:"",o:""},za:{m:"",o:""},livre:false}; return O.dados.est; }
function totSetor(x){
  const tip = x.tip||[];
  return { m: tip.reduce((a,i)=>a+(+i.q||0)*(+i.mu||1),0), o: tip.reduce((a,i)=>a+(+i.q||0)*(+i.ou||0),0) };
}
function renderSetores(){
  const e = estObj();
  $("s-n").value = String(e.n||0);
  renderAereos();
  $("s-res").checked = !!(e.res.m||e.res.o); $("s-res-x").style.display = $("s-res").checked? "":"none"; $("s-res-m").value=e.res.m; $("s-res-o").value=e.res.o;
  $("s-za").checked = !!(e.za.m||e.za.o); $("s-za-x").style.display = $("s-za").checked? "":"none"; $("s-za-m").value=e.za.m; $("s-za-o").value=e.za.o;
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
        <button class="btn btn-g" type="button" data-add="${i}">Atribuir</button>
      </div>
      <div class="tip-chips" id="tc-${i}">${(x.tip||[]).map((it,j)=>{
        const h = it.ts? (Date.now()-it.ts)/3600000 : 0;
        const hc = h>=12? "var(--fogo)" : (h>=8? "var(--terra)" : "var(--tx2)");
        const hTxt = it.ts? `<span style="color:${hc};font-weight:600">${h.toFixed(1)} h</span>` : "";
        const destinos = ['<option value="">mover…</option>']
          .concat(e.setores.map((_,k)=>k!==i? `<option value="${k}">→ ${NOMES_SETOR[k]}</option>`:"").filter(Boolean))
          .concat(['<option value="D">Desmobilizar</option>']).join("");
        return `<span class="tchip"><b>${it.q}×${esc(it.t)}</b> ${it.q*(it.mu||1)}m/${it.q*(it.ou||0)}op ${hTxt}
          <select data-mv="${i}" data-j="${j}" class="mv">${destinos}</select>
          <button type="button" data-del="${i}" data-j="${j}" aria-label="remover">×</button></span>`;
      }).join("")}</div></div>`;
    }).join("");
  // eventos das linhas
  L.querySelectorAll(".set-row input,.set-row select").forEach(el=>{
    el.addEventListener("change", ()=>{
      const x=e.setores[+el.dataset.i];
      if(el.dataset.f==="estado" && x.estado!==el.value){
        const tipoEvo = (el.value==="Em curso (ativo)"||el.value==="Reativação")? "agravamento" : (el.value==="Em resolução (dominado)"||el.value==="Em conclusão (extinto)"||el.value.startsWith("Vigilância")? "melhoria" : "posit");
        O.evolucao.push({g:gdhAgora(), tipo:tipoEvo, txt:"Setor "+NOMES_SETOR[+el.dataset.i]+" — estado alterado de \""+(x.estado||"—")+"\" para \""+el.value+"\" (registo automático)."});
        fita("Evolução automática: Setor "+NOMES_SETOR[+el.dataset.i]+" -> "+el.value);
      }
      x[el.dataset.f]=el.value; comporSetores(); persistir(false); });
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
      const d=catDef(t);
      e.setores[i].tip.push({t, q, mu:d.mu, ou, mr:d.mr||0, ar:d.ar||0, ts:Date.now()});
      fita("Atribuído "+q+"×"+t+" ao Setor "+NOMES_SETOR[i]);
      renderSetores(); pintarDON(); persistir(false);
    });
  });
  L.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const it = e.setores[+b.dataset.del].tip[+b.dataset.j];
      fita("Removido "+it.q+"×"+it.t+" do Setor "+NOMES_SETOR[+b.dataset.del]);
      e.setores[+b.dataset.del].tip.splice(+b.dataset.j,1); renderSetores(); persistir(false); });
  });
  L.querySelectorAll("[data-mv]").forEach(sel=>{
    sel.addEventListener("change", ()=>{
      const i=+sel.dataset.mv, j=+sel.dataset.j, dest=sel.value;
      if(dest===""){ return; }
      const it = e.setores[i].tip[j];
      if(dest==="D"){
        fita("Desmobilizado "+it.q+"×"+it.t+" (Setor "+NOMES_SETOR[i]+", "+((Date.now()-(it.ts||Date.now()))/3600000).toFixed(1)+" h de empenhamento)");
        e.setores[i].tip.splice(j,1);
      } else {
        const k=+dest;
        fita("Movimento: "+it.q+"×"+it.t+" de "+NOMES_SETOR[i]+" para "+NOMES_SETOR[k]);
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
      partes.push(tip.map(it=>it.q+" "+it.t).join(", "));
      const t=totSetor(x); partes.push(t.m+" meios / "+t.o+" op.");
    } else if(x.m||x.o) partes.push((x.m||"?")+" meios / "+(x.o||"?")+" op.");
    return partes.join("; ");
  });
  const extra=[];
  const AL = aerLista();
  if(AL.length) extra.push("Meios aéreos: "+AL.length+" ("+AL.map(a=>a.ind||a.t).join(", ")+").");
  if(e.res.m||e.res.o) extra.push("Reserva: "+(e.res.m||"?")+" meios / "+(e.res.o||"?")+" op.");
  if(e.za.m||e.za.o) extra.push("ZA: "+(e.za.m||"?")+" meios / "+(e.za.o||"?")+" op.");
  O.dados.setores = [...linhas, extra.join(" ")].filter(x=>x&&x.trim()).join("\n");
  $("d-setores").value = O.dados.setores;
  const tm = e.setores.reduce((a,x)=>{const t=totSetor(x); return a+((x.tip||[]).length? t.m : (+x.m||0));},0)+(+e.res.m||0)+(+e.za.m||0);
  const to = e.setores.reduce((a,x)=>{const t=totSetor(x); return a+((x.tip||[]).length? t.o : (+x.o||0));},0)+(+e.res.o||0)+(+e.za.o||0);
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
$("s-res").addEventListener("change", ()=>{ const e=estObj(); if(!$("s-res").checked) e.res={m:"",o:""}; else e.res.m=e.res.m||"0"; renderSetores(); persistir(false); });
["s-res-m","s-res-o"].forEach(id=>$(id).addEventListener("change", ()=>{ estObj().res={m:$("s-res-m").value,o:$("s-res-o").value}; comporSetores(); persistir(false); }));
$("s-za").addEventListener("change", ()=>{ const e=estObj(); if(!$("s-za").checked) e.za={m:"",o:""}; else e.za.m=e.za.m||"0"; renderSetores(); persistir(false); });
["s-za-m","s-za-o"].forEach(id=>$(id).addEventListener("change", ()=>{ estObj().za={m:$("s-za-m").value,o:$("s-za-o").value}; comporSetores(); persistir(false); }));
$("s-livre").addEventListener("change", ()=>{ estObj().livre=$("s-livre").checked; renderSetores(); persistir(false); });
$("d-setores").addEventListener("change", ()=>{ if(estObj().livre){ O.dados.setores=$("d-setores").value.trim(); persistir(false); } });

/* pontos sensíveis: adição rápida */
$("ps-add").addEventListener("click", ()=>{
  const n=$("ps-nome").value.trim(); if(!n) return;
  const atual=$("d-sensiveis").value.trim();
  $("d-sensiveis").value = (atual? atual+"; ":"") + n + " (" + $("ps-pri").value + ")";
  $("ps-nome").value=""; O.dados.sensiveis=$("d-sensiveis").value; persistir(false);
});

