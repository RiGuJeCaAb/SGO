/* ================= LOGÍSTICA · plano de comunicações (art. 32.º, al. d)) ================= */
const NIVEL_ROT = {
  comando:{t:"Comando", d:"COS, células do posto de comando e ligação ao CSREPC"},
  tatico :{t:"Tático",  d:"comandantes de setor, de frente e de área, e coordenadores"},
  manobra:{t:"Manobra", d:"equipas e veículos dentro de cada setor"},
  aereo  :{t:"Aéreo",   d:"ligação terra/ar/terra com os meios aéreos empenhados"}
};
const NIVEL_ORD = ["comando","tatico","manobra","aereo"];
function nivObj(){
  const P = pcoObj();
  if(!P.canais.niveis || typeof P.canais.niveis!=="object")
    P.canais.niveis = {comando:false,tatico:false,manobra:false,aereo:false,ba:false,tocado:false};
  return P.canais.niveis;
}
function nAereos(){ try{ return aerLista().length; }catch(e){ return 0; } }
function niveisSugeridos(){
  const ns = (estObj().setores||[]).length;
  return {comando:true, tatico:ns>0, manobra:ns>0, aereo:nAereos()>0};
}
function autoNiveis(){
  const N = nivObj();
  if(!N.tocado){ const g = niveisSugeridos(); NIVEL_ORD.forEach(k=>N[k]=!!g[k]); }
  return N;
}
function nivelDaFuncao(f){
  const g = pcoDef(f).g;
  return g==="Meios aéreos"? "aereo" : (g==="Meios especiais"? "tatico" : "comando");
}
function renderNiveis(){
  const el = $("cm-niveis"); if(!el) return;
  const N = autoNiveis(), P = pcoObj(), g = niveisSugeridos();
  const ns = (estObj().setores||[]).length, na = nAereos(), nf = P.funcoes.length;
  const nota = {
    comando: nf? nf+(nf===1? " função nomeada":" funções nomeadas") : "sem funções nomeadas",
    tatico : ns? ns+(ns===1? " setor ativado":" setores ativados") : "sem setores ativados",
    manobra: ns? ns+(ns===1? " setor ativado":" setores ativados") : "sem setores ativados",
    aereo  : na? na+(na===1? " meio aéreo no TO":" meios aéreos no TO") : "sem meios aéreos no TO"
  };
  const caixa = k => `<label class="nvb ${N[k]? "on ":""}${k}${(!N[k]&&g[k])? " falta":""}">
      <input type="checkbox" data-nvl="${k}"${N[k]? " checked":""}>
      <span class="t">${NIVEL_ROT[k].t}</span>
      <span class="d">${NIVEL_ROT[k].d}</span>
      <span class="q">${esc(nota[k])}${(!N[k]&&g[k])? " · exigido pelo dispositivo":""}</span></label>`;
  el.innerHTML = `<div class="nvg">${NIVEL_ORD.map(caixa).join("")}
    <label class="nvb ${N.ba? "on ":""}rede"><input type="checkbox" data-nvl="ba"${N.ba? " checked":""}>
      <span class="t">Banda alta</span><span class="d">rede operacional dos bombeiros em paralelo ao SIRESP</span>
      <span class="q">${N.ba? "colunas de banda alta visíveis":"apenas SIRESP"}</span></label></div>`;
  el.querySelectorAll("[data-nvl]").forEach(b=>b.addEventListener("change", ()=>{
    const M = nivObj(), k = b.dataset.nvl; M.tocado = true; M[k] = b.checked;
    fita((b.checked? "Nível ativado":"Nível desativado")+" no plano de comunicações: "+(NIVEL_ROT[k]? NIVEL_ROT[k].t : "banda alta"));
    renderComs(); pintarDON(); persistir(false);
  }));
}
function renderAtrib(){
  const el = $("cm-atrib"); if(!el) return;
  const A = atribSet(), N = nivObj();
  const ativo = x => canalAplicavel(x) && (x.rede!=="ba" || N.ba) && (N[x.niv==="tatico"? "tatico" : x.niv] === true);
  const lista = CANAIS.ent.filter(ativo);
  let h = "";
  porGrupos(lista, (rot,arr,r,n)=>{
    h += '<div class="atr-g"><span class="atr-t">'+esc(rot)+'</span><div class="atr-c">'+
      arr.map(x=>'<button type="button" class="atc'+(A.has(String(x.des).toUpperCase())? " on "+(n||"") : "")+
        '" data-atr="'+esc(x.des)+'" title="'+esc(x.des+(x.nota? " — "+x.nota:""))+'">'+esc(x.des)+'</button>').join("")+'</div></div>';
  });
  if(!lista.length) h = '<p class="hint">Escolhe primeiro os níveis a utilizar e aparecem aqui os canais do pacote correspondentes.</p>';
  const nAtr = CANAIS.ent.filter(x=>A.has(String(x.des).toUpperCase())).length;
  el.innerHTML = h + (lista.length? '<p class="atr-n">'+(nAtr
    ? nAtr+(nAtr===1? " canal atribuído ao teatro de operações.":" canais atribuídos ao teatro de operações.")
    : "Nenhum canal atribuído; enquanto assim for, as listas mostram o pacote completo.")+'</p>' : "");
  el.querySelectorAll("[data-atr]").forEach(b=>b.addEventListener("click", ()=>{
    const P = pcoObj(), d = b.dataset.atr;
    const i = P.canais.atrib.findIndex(x=>String(x).toUpperCase()===d.toUpperCase());
    if(i>=0){ P.canais.atrib.splice(i,1); fita("Canal libertado do TO: "+d); }
    else { P.canais.atrib.push(d); fita("Canal atribuído ao TO: "+d); }
    renderComs(); pintarDON(); persistir(false);
  }));
}
function renderComs(){
  const P = pcoObj(), e = estObj(), N = autoNiveis();
  renderNiveis(); renderAtrib();

  const D = $("cm-dist");
  const sel = (attrs, rede, niv) => `<span class="cw"><select class="cs" ${attrs} data-rede="${rede}" data-niv="${niv||""}"></select><input class="cwo" hidden placeholder="designação do canal"></span>`;
  const cls = duplo => "cm-f"+((duplo && N.ba)? "" : " nb");
  const cab = duplo => `<div class="${cls(duplo)} cm-fh"><span class="atr-t">Interlocutor</span><span class="atr-t">SIRESP</span>${(duplo&&N.ba)? '<span class="atr-t">Banda alta</span>':""}</div>`;
  const linha = (nome, det, s1, s2) => `<div class="${cls(!!s2)}">
      <span class="nm">${esc(nome)}${det? `<small>${esc(det)}</small>`:""}</span>${s1}${(s2&&N.ba)? s2 : ""}</div>`;
  const painel = (k, corpo, nota) => `<div class="sub"><span class="stit">Nível ${NIVEL_ROT[k].t} — canais e interlocutores</span>${corpo}${nota? `<p class="hint">${nota}</p>`:""}</div>`;
  const fnDo = k => P.funcoes.map((x,i)=>({x,i})).filter(o=>nivelDaFuncao(o.x.f)===k);
  const linhaFuncao = o => linha(o.x.f, (o.x.nome||"por nomear")+(o.x.entidade? " · "+o.x.entidade:""),
      sel(`data-cf="${o.i}" data-f="siresp"`, "siresp", nivelDaFuncao(o.x.f)),
      sel(`data-cf="${o.i}" data-f="ba"`, "ba", ""));

  if(D){
    let h = "";
    if(N.comando){
      let c = cab(true) + linha("Geral do teatro de operações", "COS e ligação ao CSREPC; único contacto rádio com o exterior do TO",
        sel('data-cg="cmd"', "siresp", "comando"), sel('data-cg="ba"', "ba", ""));
      c += fnDo("comando").map(linhaFuncao).join("");
      h += painel("comando", c, "Cada teatro de operações é um núcleo isolado: o contacto rádio com o exterior é feito em exclusivo pelo PCO. Sem canal próprio, a função usa o canal geral de comando.");
    }
    if(N.tatico){
      let c = cab(true) + linha("Geral do teatro de operações", "ligação do PCO aos comandantes de setor, de frente e de área",
        sel('data-cg="tat"', "siresp", "tatico"), sel('data-cg="tatba"', "ba", "tatico"));
      c += (e.setores||[]).map((x,i)=>linha("Setor "+NOMES_SETOR[i], x.cmd||"comandante por designar",
            sel(`data-cs="${i}" data-f="tat"`, "siresp", "tatico"),
            sel(`data-cs="${i}" data-f="tatba"`, "ba", "tatico"))).join("");
      c += fnDo("tatico").map(linhaFuncao).join("");
      if(!(e.setores||[]).length) c += '<p class="hint">Define os setores na secção 2 e aparecem aqui.</p>';
      h += painel("tatico", c, "A célula de operações transmite as ordens de missão e o plano de comunicações aos comandantes de setor, de frente e de área. Sem canal próprio, o setor usa o canal tático geral.");
    }
    if(N.manobra){
      let c = (e.setores||[]).length
        ? cab(true) + (e.setores||[]).map((x,i)=>linha("Equipas do setor "+NOMES_SETOR[i], x.cmd||"comandante por designar",
            sel(`data-cs="${i}" data-f="siresp"`, "siresp", "manobra"),
            sel(`data-cs="${i}" data-f="ba"`, "ba", "manobra"))).join("")
        : '<p class="hint">Define os setores na secção 2 e aparecem aqui para atribuição de canal de manobra.</p>';
      h += painel("manobra", c, "O nível de manobra é interno a cada setor. Setores distintos no mesmo canal saturam a rede e confundem a origem das mensagens.");
    }
    if(N.aereo){
      let c = cab(false)
        + linha("Frequência do ar", "banda aeronáutica atribuída ao incêndio; canal prioritário terra/ar/terra", sel('data-cg="aero"', "aero", ""))
        + linha("Alternativa SIRESP", "OPAR da sub-região; alternativa e emergência", sel('data-cg="opar"', "siresp", "aereo"))
        + linha("Alternativa banda alta", "manobra 4 (CM4) da Rede Operacional dos Bombeiros", sel('data-cg="cmar"', "ba", "manobra"));
      c += fnDo("aereo").map(o=>linha(o.x.f, (o.x.nome||"por nomear")+(o.x.entidade? " · "+o.x.entidade:""),
            sel(`data-cf="${o.i}" data-f="siresp"`, "siresp", "aereo"))).join("");
      h += painel("aereo", c, "O canal prioritário de ligação terra/ar/terra é a frequência do ar atribuída ao incêndio (DON n.º 2 / DECIR 2026, ponto 10(5)).");
    }
    if(!h) h = '<div class="sub"><p class="hint">Nenhum nível ativado. Escolhe acima os níveis de comunicação a colocar a funcionar.</p></div>';
    D.innerHTML = h;
    D.querySelectorAll("select.cs").forEach(el=>{
      let val = "";
      if(el.dataset.cg) val = P.canais[el.dataset.cg]||"";
      else if(el.dataset.cf!==undefined) val = (P.funcoes[+el.dataset.cf]||{})[el.dataset.f]||"";
      else if(el.dataset.cs!==undefined) val = ((e.setores||[])[+el.dataset.cs]||{})[el.dataset.f]||"";
      pintarSel(el, val);
      el.addEventListener("change", ()=>{
        if(el.value==="__novo__") return;
        const v = el.value.trim();
        if(el.dataset.cg) P.canais[el.dataset.cg] = v;
        else if(el.dataset.cf!==undefined) P.funcoes[+el.dataset.cf][el.dataset.f] = v;
        else if(el.dataset.cs!==undefined) e.setores[+el.dataset.cs][el.dataset.f] = v;
        renderPCO(); renderComs(); pintarDON(); persistir(false);
      });
    });
  }

  const Q = $("cm-quadro"); if(!Q) return;
  const lin = (nivel,quem,detalhe,si,ba) => `<div class="cm-r"><span class="lv ${nivel.toLowerCase()}">${nivel}</span>
    <span class="qm">${esc(quem)}${detalhe? `<small>${esc(detalhe)}</small>`:""}</span>
    <span class="ch">${si? esc(si):'<i>por atribuir</i>'}</span><span class="ch">${ba? esc(ba):"—"}</span></div>`;
  let corpo = "";
  if(N.comando){
    corpo += lin("Comando","COS","comando da operação; único contacto rádio com o exterior do TO", P.canais.cmd, P.canais.ba);
    corpo += fnDo("comando").map(o=>lin("Comando", o.x.f, o.x.nome||"", o.x.siresp||P.canais.cmd, o.x.ba||P.canais.ba)).join("");
  }
  if(N.tatico){
    corpo += (e.setores||[]).map((x,i)=>lin("Tático","Setor "+NOMES_SETOR[i], x.cmd||"", x.tat||P.canais.tat, x.tatba||P.canais.tatba||"")).join("");
    corpo += fnDo("tatico").map(o=>lin("Tático", o.x.f, o.x.nome||"", o.x.siresp||P.canais.tat, o.x.ba||"")).join("");
  }
  if(N.manobra){
    corpo += (e.setores||[]).filter(x=>x.siresp).map(x=>lin("Manobra","Equipas do setor "+NOMES_SETOR[(e.setores||[]).indexOf(x)], "", x.siresp, x.ba||"")).join("");
  }
  if(N.aereo){
    corpo += `<div class="cm-r"><span class="lv aéreo">Aéreo</span>
      <span class="qm">Ligação terra/ar/terra<small>frequência do ar${P.canais.aero? ": "+esc(P.canais.aero) : " por atribuir"} — canal prioritário; SIRESP e banda alta em alternativa e emergência</small></span>
      <span class="ch">${P.canais.opar? esc(P.canais.opar):'<i>por atribuir</i>'}</span><span class="ch">${P.canais.cmar? esc(P.canais.cmar):"—"}</span></div>`;
    corpo += fnDo("aereo").map(o=>lin("Aéreo", o.x.f, o.x.nome||"", o.x.siresp||P.canais.opar, o.x.ba||P.canais.cmar||"")).join("");
  }
  Q.innerHTML = corpo
    ? `<div class="cm-h"><span>Nível</span><span>Interlocutor</span><span>SIRESP</span><span>Banda alta</span></div>${corpo}
    ${O.meta.distrito? `<p class="hint" style="margin-top:10px">Grupos de conversação da pasta DISTRITO OP — ${esc(O.meta.distrito)}.</p>`:""}
    <p class="hint" style="margin-top:12px">O nível de comando liga o COS ao CSREPC e às células; o nível tático liga o PCO aos comandantes de setor e aos coordenadores; o nível de manobra é interno a cada setor. Onde não há canal próprio vale o canal geral do nível.</p>`
    : "";
}

/* ================= verificações automáticas — DON n.º 2 / DECIR 2026 =================
   Regras determinísticas derivadas do dispositivo introduzido na secção 2 e do relógio.
   Cada verificação transporta a referência do ponto da DON que a fundamenta. */
