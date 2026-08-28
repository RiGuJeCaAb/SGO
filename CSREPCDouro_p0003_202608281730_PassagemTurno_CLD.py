#!/usr/bin/env python3
"""
p0003 — passagem de turno por célula e nomeação externa em dois instantes
CSREPC Douro · Estação PEA · versão de estado 3 -> 4

Base legal: DON n.º 2 — DECIR/2026, ponto 7.d.(29) e (30) (EPCO, continuidade em
espelho, rotatividade a cada 12 horas); Despacho n.º 4067/2024, arts. 14.º, 15.º,
17.º, 23.º n.º 2, 24.º n.º 2, 25.º n.º 2, 27.º e 32.º.

  A  Estado versão 4: ramo O.turno; campo `solicitado` em O.pco.funcoes.
  B  Nomeação externa em dois instantes — solicitação do COS e nomeação pela entidade.
     `solicitado` é o GDH do pedido; `g` passa a ser exclusivamente o GDH da nomeação
     e fica vazio enquanto o pedido estiver pendente. Estado pendente é derivado.
  C  Painel de passagem de turno, com estado e pendências compostos por célula a
     partir do que a aplicação já sabe. Não se entrega a aplicação: entrega-se uma célula.
  D  Verificações: núcleo solicitado e por nomear; turno acima das 12 horas.

Notas de rebase
  A migração é acrescentada por MIGRACOES.push(), não por edição do literal do
  array — assim o patch não precisa de conhecer as migrações que já lá estejam.
  Âncoras desenvolvidas contra uma base sintética equivalente ao r0026; as
  asserções confirmam-nas contra o ficheiro real no momento da aplicação.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0026sim.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0027.html"

s = io.open(SRC, encoding="utf-8").read()
N = [0]

def troca(ancora, novo, nome):
    global s
    c = s.count(ancora)
    assert c == 1, "[%s] ancora encontrada %d vezes, esperava 1:\n%s" % (nome, c, ancora[:200])
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print("  ok  " + nome)

# ═══════════════════════════════════════════════════════════════════
# A — estado versão 4
# ═══════════════════════════════════════════════════════════════════
troca("const VERSAO_ESTADO = 3;", "const VERSAO_ESTADO = 4;", "A1 VERSAO_ESTADO 3 -> 4")

troca(
    'fita:[], versao:VERSAO_ESTADO };',
    'fita:[], turno:novoTurno(), versao:VERSAO_ESTADO };',
    "A2 ramo turno no estado novo"
)

# A migração entra por push: não é preciso conhecer o literal do array.
troca(
    '''function migrarGravado(guardado){''',
    '''/* 3 -> 4 · Passagem de turno e nomeação externa em dois instantes.
   Acrescentada por push para não depender do conteúdo do literal de MIGRACOES:
   o índice sai correto seja qual for o número de migrações já existentes.
   Puramente aditiva — não reinterpreta nem apaga nada do que estava gravado.
   `g` mantém o significado de GDH da nomeação; `solicitado` nasce vazio, porque
   uma ocorrência gravada antes desta versão não traz marca que permita saber
   quando o COS solicitou, e adivinhar seria pior do que deixar em branco. */
MIGRACOES.push(e => {
  if(!e.turno || typeof e.turno!=="object") e.turno = novoTurno();
  if(!Array.isArray(e.turno.entregas)) e.turno.entregas = [];
  e.turno.celulas = Object.assign(novoTurno().celulas, e.turno.celulas||{});
  e.pco = e.pco || {funcoes:[]};
  (e.pco.funcoes||[]).forEach(f=>{ if(typeof f.solicitado!=="string") f.solicitado = ""; });
  return e;
});

function migrarGravado(guardado){''',
    "A3 MIGRACOES.push — versão 4"
)

# ═══════════════════════════════════════════════════════════════════
# B — nomeação externa em dois instantes
# ═══════════════════════════════════════════════════════════════════
troca(
    '          <div><label for="pc-g">GDH da nomeação</label><input id="pc-g" placeholder="vazio = agora"></div>',
    '          <div><label for="pc-g">GDH da nomeação</label><input id="pc-g" placeholder="vazio = agora"></div>\n'
    '          <div id="pc-sol-box" style="display:none"><label for="pc-sol">GDH da solicitação à entidade</label><input id="pc-sol" placeholder="quando o COS pediu"></div>',
    "B1 campo da solicitação"
)

troca(
    '    siresp:(ant&&ant.siresp)||"", ba:(ant&&ant.ba)||"", g:$("pc-g").value.trim()||gdhAgora() };',
    '''    siresp:(ant&&ant.siresp)||"", ba:(ant&&ant.ba)||"",
    /* Dois instantes distintos nos núcleos de nomeação externa (arts. 23.º n.º 2,
       24.º n.º 2 e 25.º n.º 2): o COS solicita, a entidade nomeia. `g` fica vazio
       enquanto o pedido estiver pendente — sem nome não há nomeação. */
    solicitado: ($("pc-sol")? $("pc-sol").value.trim() : "") || (ant&&ant.solicitado) || "",
    g: $("pc-g").value.trim() || (nome? gdhAgora() : "") };''',
    "B2 registo guarda os dois instantes"
)

troca(
    '''  [\"pc-n\",\"pc-e\",\"pc-c\",\"pc-g\"].forEach(id=>$(id).value=\"\");''',
    '''  ["pc-n","pc-e","pc-c","pc-g","pc-sol"].forEach(id=>{ const el=$(id); if(el) el.value=""; });''',
    "B3 limpar também o campo da solicitação"
)

troca(
    '  fita("Nomeação: "+f+(nome? " — "+nome:"")+" ("+reg.g+")");',
    '''  fita(reg.g
    ? "Nomeação: "+f+(nome? " — "+nome:"")+" ("+reg.g+")"
    : "Solicitação de nomeação: "+f+" a "+(pcoDef(f).ext||reg.entidade||"entidade competente")+" ("+(reg.solicitado||gdhAgora())+") — por nomear");''',
    "B4 registo na fita distingue solicitação de nomeação"
)

troca(
    '  O.evolucao.push({g:reg.g, tipo:"posit", txt:"Nomeação de "+f+(nome? ": "+nome:"")+(reg.ct? " ("+reg.ct+")":"")+"."});',
    '''  O.evolucao.push({g: reg.g || reg.solicitado || gdhAgora(), tipo:"posit",
    txt: reg.g
      ? "Nomeação de "+f+(nome? ": "+nome:"")+(reg.ct? " ("+reg.ct+")":"")+"."
      : "Solicitação de nomeação de "+f+" a "+(pcoDef(f).ext||"entidade competente")+", por nomear."});''',
    "B5 registo de evolução distingue os dois momentos"
)

# mostrar o campo da solicitação só quando a função escolhida é de nomeação externa
troca(
    '''function renderPCO(){
  const sel = $("pc-f"); if(!sel) return;''',
    '''/* O campo da solicitação só faz sentido nos núcleos que uma entidade externa nomeia
   a pedido do COS — arts. 23.º, n.º 2, 24.º, n.º 2 e 25.º, n.º 2. */
function pintarCampoSolicitacao(){
  const sel = $("pc-f"), box = $("pc-sol-box"); if(!sel || !box) return;
  const d = pcoDef(sel.value);
  box.style.display = d.ext ? "" : "none";
  const lab = box.querySelector("label");
  if(lab && d.ext) lab.textContent = "GDH da solicitação a " + d.ext;
}
function renderPCO(){
  const sel = $("pc-f"); if(!sel) return;''',
    "B6 campo condicional à função"
)

troca(
    '  const P = pcoObj(), exig = funcoesExigiveis();',
    '  try{ pintarCampoSolicitacao(); }catch(e){}\n  const P = pcoObj(), exig = funcoesExigiveis();',
    "B7 pintar o campo ao render"
)

troca(
    '$("pc-add").addEventListener("click", ()=>{',
    '(function(){ const sf=$("pc-f"); if(sf) sf.addEventListener("change", ()=>{ try{ pintarCampoSolicitacao(); }catch(e){} }); })();\n$("pc-add").addEventListener("click", ()=>{',
    "B8 reagir à mudança de função"
)

# ═══════════════════════════════════════════════════════════════════
# C — passagem de turno
# ═══════════════════════════════════════════════════════════════════
troca(
    '    <button data-p="p-fita">Fita do tempo</button>',
    '    <button data-p="p-turno" title="Continuidade em espelho e rotatividade de funções — DON n.º 2, ponto 7.d.(30)">Passagem de turno</button>\n    <button data-p="p-fita">Fita do tempo</button>',
    "C1 separador de passagem de turno"
)

# CSS próprio: a .av-l do r0015 foi removida no r0022, e depender de classes de
# outro painel é como este patch descobriu — cai para empilhamento sem avisar.
troca(
    '</style>',
    """  /* passagem de turno */
  .tn-l{display:grid;grid-template-columns:190px 1fr;gap:6px 16px;font-size:13.5px;line-height:1.5;margin:2px 0 12px}
  .tn-l dt{font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;color:var(--tx2);padding-top:3px}
  .tn-l dd{color:var(--tx);margin:0}
  .tn-l dd.falta{color:var(--fogo)}
  .tn-l dd ul{margin:0;padding-left:18px} .tn-l dd li{margin:1px 0}
  @media(max-width:820px){ .tn-l{grid-template-columns:1fr;gap:2px 0} .tn-l dt{padding-top:8px} }
</style>""",
    "C0 estilo próprio da lista de pendências"
)

troca(
    '  <section class="pane" id="p-fita">',
    '''  <section class="pane" id="p-turno">
    <div class="help"><span class="ht">Passagem de turno — continuidade em espelho</span>
      <p class="hd">A EPCO deve assegurar continuidade de trabalho pelo período necessário, em espelho, garantindo a rotatividade de funções a cada 12 horas — DON n.º 2 / DECIR 2026, ponto 7.d.(30).</p>
      <ul>
        <li><b>Não se entrega a aplicação, entrega-se uma célula.</b> Cada célula declara o seu estado e as suas pendências, e quem entra assume-as por escrito.</li>
        <li><b>As pendências compõem-se sozinhas</b> a partir do que a aplicação já sabe — funções por nomear, PEA em vigor e sua validade, missões por cumprir, rendições vencidas, canais por atribuir. Quem sai corrige e acrescenta o que a aplicação não pode saber.</li>
        <li><b>A passagem fica na fita do tempo</b> e no processo da ocorrência. É prova documental de que a continuidade de comando não se quebrou.</li>
      </ul></div>

    <div class="card">
      <h2>Turno corrente <span class="tag" id="turno-tag">DON n.º 2, pontos 7.d.(29) e 7.d.(30)</span></h2>
      <div class="grid g3">
        <div><label for="tn-eq">Designação da equipa</label><input id="tn-eq" placeholder="ex.: EPCO Douro — turno A"></div>
        <div><label for="tn-ini">GDH de início do turno</label><input id="tn-ini" placeholder="vazio = agora"></div>
        <div><label>Decorrido</label><div class="occ-tag" id="tn-dec" style="min-height:40px;display:flex;align-items:center">—</div></div>
      </div>
      <div id="tn-celulas" style="margin-top:14px"></div>
      <p class="hint">O limite de 12 horas é o da rotatividade de funções da EPCO. Ultrapassado, nasce um aviso na secção respetiva.</p>
    </div>

    <div class="card">
      <h2>Estado e pendências por célula <span class="tag">composição automática — corrigir e acrescentar</span></h2>
      <div id="tn-quadro"></div>
    </div>

    <div class="card">
      <h2>Fechar a passagem <span class="tag">a equipa que entra assume as pendências declaradas</span></h2>
      <div class="grid g3">
        <div><label for="tn-eq2">Equipa que entra</label><input id="tn-eq2" placeholder="ex.: EPCO Douro — turno B"></div>
        <div><label for="tn-g">GDH da passagem</label><input id="tn-g" placeholder="vazio = agora"></div>
        <div><label>&nbsp;</label><button class="btn btn-o" type="button" id="tn-fechar" style="width:100%">Registar passagem de turno</button></div>
      </div>
      <div class="msg" id="msg-turno"></div>
    </div>

    <div class="card">
      <h2>Passagens registadas <span class="tag" id="tn-hist-tag">0 registadas</span></h2>
      <div id="tn-hist"></div>
    </div>
  </section>

  <section class="pane" id="p-fita">''',
    "C2 painel de passagem de turno"
)

# motor da passagem de turno, colocado antes de migrarGravado para que novoTurno()
# exista quando novoEstado() corre no arranque (declaração de função, sobe)
troca(
    '''/* 3 -> 4 · Passagem de turno e nomeação externa em dois instantes.''',
    '''/* ================= passagem de turno ================= */
/* As quatro linhas do posto de comando: o comando e as três células do art. 12.º,
   n.º 2 do SIOPS. Declaração de função — sobe, e por isso novoEstado() pode usá-la. */
function CELULAS_PCO(){
  return [
    {k:"comando",     n:"Comando",              r:"arts. 14.º e 15.º"},
    {k:"operacoes",   n:"Operações",            r:"arts. 16.º a 25.º"},
    {k:"planeamento", n:"Planeamento",          r:"arts. 26.º a 30.º"},
    {k:"logistica",   n:"Logística e Finanças", r:"arts. 31.º a 35.º"}
  ];
}
function novoTurno(){
  const c = {};
  CELULAS_PCO().forEach(x=>{ c[x.k] = {n:"", ct:"", nota:""}; });
  return { equipa:"", inicio:"", celulas:c, entregas:[] };
}

/* 3 -> 4 · Passagem de turno e nomeação externa em dois instantes.''',
    "C3 modelo de células e turno"
)

# o resto do motor entra junto do render geral
troca(
    '''/* ================= render geral ================= */''',
    '''/* ================= passagem de turno — motor ================= */
function turnoObj(){
  if(!O.turno || typeof O.turno!=="object") O.turno = novoTurno();
  if(!Array.isArray(O.turno.entregas)) O.turno.entregas = [];
  O.turno.celulas = Object.assign(novoTurno().celulas, O.turno.celulas||{});
  return O.turno;
}
const LIMITE_TURNO_H = 12;   /* DON n.º 2, ponto 7.d.(30) */

function horasDeTurno(){
  const t = turnoObj(), d = parseGDH(t.inicio);
  return d ? (agora() - d.getTime())/3600000 : null;
}

/* Pendências compostas do que a aplicação já sabe. Cada célula lê apenas o que a
   lei lhe atribui — é aqui que a separação deixa de ser doutrina e passa a ser código. */
function pendenciasCelula(k){
  const out = [];
  const push = (t, x, falta) => out.push({t, x, falta:!!falta});
  try{
    if(k==="comando"){
      const emFalta = funcoesExigiveis().filter(x=>!x.preenchida);
      /* numa passagem de turno, catorze funções num parágrafo não se leem:
         mostram-se as primeiras e conta-se o resto */
      if(emFalta.length) push("Funções exigíveis por nomear",
        emFalta.slice(0,6).map(x=>x.f).concat(emFalta.length>6? ["e mais "+(emFalta.length-6)+" — ver o separador do PCO"] : []), true);
      const pend = (pcoObj().funcoes||[]).filter(x=>x.solicitado && !x.g);
      if(pend.length) push("Nomeações solicitadas e pendentes",
        pend.map(x=>x.f+" a "+(pcoDef(x.f).ext||x.entidade||"entidade")+", solicitada "+x.solicitado), true);
      push("Fase do SGO e nível DECIR", (O.meta.fase||"por declarar")+" · "+(O.meta.nivel||"por declarar"));
      const nom = (pcoObj().funcoes||[]).filter(x=>x.g).length;
      push("Funções nomeadas", String(nom));
    }
    if(k==="planeamento"){
      const p = peaVigor();
      if(!p) push("PEA", "Nenhum PEA emitido nesta ocorrência.");
      else {
        push("PEA em vigor", "n.º "+p.n+", emitido "+p.g+", válido até "+gdhDe(p.validoTs)
          + (p.validoTs < agora() ? " — VENCIDO" : ""));
        try{ const d = divergencia(p); if(d && d.itens && d.itens.length)
          push("Divergência face ao plano", d.itens.map(x=>x.txt||x).join("; ")); }catch(e){}
      }
      push("Meteorologia", (SERIE && SERIE.length)? SERIE.length+" horas carregadas" : "sem previsão carregada");
      push("Pontos sensíveis", O.dados.sensiveis || "por identificar");
      const esp = nomeado("Núcleo de Especialistas");
      push("Núcleo de especialistas", esp? ("ativado — "+(esp.nome||"sem nome")) : "não ativado (art. 30.º; DON 2, 7.e.(27))");
    }
    if(k==="operacoes"){
      const e = estObj();
      const porEstado = {};
      (e.setores||[]).forEach((x,i)=>{ const s2=x.estado||"—"; (porEstado[s2]=porEstado[s2]||[]).push(NOMES_SETOR[i]); });
      const chaves = Object.keys(porEstado);
      push("Setores", chaves.length? chaves.map(c2=>c2+": "+porEstado[c2].join(", ")).join(" · ") : "sem setorização registada");
      const p = peaVigor();
      if(p && p.ctrl){
        const porFazer = p.ctrl.filter(x=>x.estado===0), emCurso = p.ctrl.filter(x=>x.estado===1);
        push("Execução do PEA n.º "+p.n,
          p.ctrl.filter(x=>x.estado===2).length+" de "+p.ctrl.length+" cumpridas"
          + (emCurso.length? "; em execução "+emCurso.map(x=>x.k).join(", ") : "")
          + (porFazer.length? "; por iniciar "+porFazer.map(x=>x.k).join(", ") : ""));
      }
      const mp = minutosDesde(ultimoPOSIT());
      push("Último POSIT", mp===null? "nenhum registado" : ("há "+mp+" min"));
      push("Fita do tempo", (O.fita||[]).length+" registos");
      const AL = aerLista();
      if(AL.length) push("Meios aéreos no TO", AL.map(a=>a.ind||a.t).join(", "));
    }
    if(k==="logistica"){
      const P = pcoObj();
      const at = (P.canais && P.canais.atrib)? P.canais.atrib.length : 0;
      push("Plano de comunicações", at? at+" canais atribuídos" : "por elaborar (art. 32.º, n.º 1, al. d))");
      const pt = ptObj();
      push("Ponto de trânsito", pt.des? (pt.des + (pt.resp? " — "+pt.resp:"")) : "por estabelecer (DON 2, 7.d.(5), (7) e (8))");
      const e = estObj();
      push("Reserva e zona de apoio",
        "reserva "+((e.res.m||"?")+" meios / "+(e.res.o||"?")+" op.")+" · ZA "+((e.za.m||"?")+" meios / "+(e.za.o||"?")+" op."));
      const R = rendicoes(), venc = R.filter(x=>x.nivel==="r"), avi = R.filter(x=>x.nivel==="a");
      push("Rendições",
        venc.length? ("VENCIDAS: "+venc.map(x=>x.nome+" ("+x.txt+")").join("; "))
        : (avi.length? ("a preparar: "+avi.map(x=>x.nome+" ("+x.txt+")").join("; ")) : (R.length? "nenhuma vencida":"sem meios em contagem")));
    }
  }catch(err){ push("Leitura incompleta", "algumas verificações não puderam ser compostas: "+String(err).slice(0,80)); }
  return out;
}

function renderTurno(){
  const box = $("tn-celulas"); if(!box) return;
  const t = turnoObj();
  if($("tn-eq") && document.activeElement!==$("tn-eq")) $("tn-eq").value = t.equipa||"";
  if($("tn-ini") && document.activeElement!==$("tn-ini")) $("tn-ini").value = t.inicio||"";
  const h = horasDeTurno();
  const dec = $("tn-dec");
  if(dec){
    dec.textContent = h===null? "GDH de início por preencher" : fmtH(h) + (h>=LIMITE_TURNO_H? " — acima das 12 h":"");
    dec.style.borderLeftColor = h===null? "var(--line)" : (h>=LIMITE_TURNO_H? "var(--fogo)" : (h>=LIMITE_TURNO_H-2? "var(--terra)":"var(--madeira)"));
  }
  box.innerHTML = '<div class="grid g2">' + CELULAS_PCO().map(c=>`
    <div class="sub"><span class="stit">${esc(c.n)} <span class="hint" style="font-weight:400">${esc(c.r)}</span></span>
      <div class="grid g2">
        <div><label for="tn-n-${c.k}">Quem assegura</label><input id="tn-n-${c.k}" data-tn="${c.k}" data-f="n" value="${esc(t.celulas[c.k].n||"")}" placeholder="posto, nome"></div>
        <div><label for="tn-c-${c.k}">Contacto</label><input id="tn-c-${c.k}" data-tn="${c.k}" data-f="ct" value="${esc(t.celulas[c.k].ct||"")}" placeholder="telemóvel" inputmode="tel"></div>
      </div>
    </div>`).join("") + '</div>';
  box.querySelectorAll("[data-tn]").forEach(el=>el.addEventListener("change", ()=>{
    turnoObj().celulas[el.dataset.tn][el.dataset.f] = el.value.trim();
    persistir(false);
  }));
  renderQuadroTurno();
  renderHistTurno();
}

function renderQuadroTurno(){
  const q = $("tn-quadro"); if(!q) return;
  const t = turnoObj();
  q.innerHTML = CELULAS_PCO().map(c=>{
    const P = pendenciasCelula(c.k);
    return `<div class="sub">
      <span class="stit">${esc(c.n)} <span class="hint" style="font-weight:400">${esc(c.r)}</span>${t.celulas[c.k].n? ' — <b>'+esc(t.celulas[c.k].n)+'</b>':''}</span>
      <dl class="tn-l">${P.map(x=>`<dt>${esc(x.t)}</dt><dd class="${x.falta?"falta":""}">${Array.isArray(x.x)? "<ul>"+x.x.map(i=>`<li>${esc(i)}</li>`).join("")+"</ul>" : esc(x.x)}</dd>`).join("")}</dl>
      <label for="tn-nota-${c.k}">Notas da célula para quem entra</label>
      <textarea id="tn-nota-${c.k}" data-tnota="${c.k}" rows="2" placeholder="o que a aplicação não pode saber">${esc(t.celulas[c.k].nota||"")}</textarea>
    </div>`;
  }).join("");
  q.querySelectorAll("[data-tnota]").forEach(el=>el.addEventListener("change", ()=>{
    turnoObj().celulas[el.dataset.tnota].nota = el.value.trim(); persistir(false);
  }));
}

function renderHistTurno(){
  const el = $("tn-hist"); if(!el) return;
  const t = turnoObj(), L = t.entregas||[];
  const tag = $("tn-hist-tag"); if(tag) tag.textContent = L.length + (L.length===1? " registada":" registadas");
  if(!L.length){ el.innerHTML = '<p class="hint">Nenhuma passagem registada nesta ocorrência.</p>'; return; }
  el.innerHTML = L.slice().reverse().map(x=>`<div class="sub">
    <span class="stit">${esc(x.g)} — ${esc(x.de||"—")} entrega a ${esc(x.para||"—")}${x.horas? " · turno de "+esc(fmtH(x.horas)):""}</span>
    <dl class="tn-l">${(x.celulas||[]).map(c=>`<dt>${esc(c.n)}</dt><dd>${esc(c.quem||"—")}${c.nota? " · "+esc(c.nota):""}<br><span class="hint">${esc((c.pendencias||[]).map(p=>p.t+": "+(Array.isArray(p.x)? p.x.join("; ") : p.x)).join(" · "))}</span></dd>`).join("")}</dl>
  </div>`).join("");
}

function fecharTurno(){
  const t = turnoObj();
  const para = ($("tn-eq2")? $("tn-eq2").value.trim() : "");
  if(!para){ aviso("msg-turno","err","Indica a equipa que entra antes de registar a passagem."); return; }
  const g = ($("tn-g")? $("tn-g").value.trim() : "") || gdhAgora();
  const h = horasDeTurno();
  const registo = {
    g, de: t.equipa || "—", para, horas: h,
    celulas: CELULAS_PCO().map(c=>({
      k:c.k, n:c.n, quem: t.celulas[c.k].n, ct: t.celulas[c.k].ct,
      nota: t.celulas[c.k].nota, pendencias: pendenciasCelula(c.k)
    }))
  };
  t.entregas.push(registo);
  /* a equipa que entra passa a ser a corrente; as notas de célula limpam-se, as
     pessoas não, porque a rotatividade é de funções e nem todas mudam ao mesmo tempo */
  t.equipa = para; t.inicio = g;
  CELULAS_PCO().forEach(c=>{ t.celulas[c.k].nota = ""; });
  if($("tn-eq2")) $("tn-eq2").value = ""; if($("tn-g")) $("tn-g").value = "";
  fita("Passagem de turno: "+registo.de+" entrega a "+para+" ("+g+")"
    + (h!=null? "; turno de "+fmtH(h):"") + "; " + registo.celulas.length + " células declaradas");
  O.evolucao.push({g, tipo:"posit", txt:"Passagem de turno do PCO: "+registo.de+" entrega a "+para+", com estado e pendências declarados por célula."});
  aviso("msg-turno","ok","Passagem registada. O turno corrente passa a ser "+para+".");
  renderTurno(); pintarDON(); persistir(false);
}

/* ================= render geral ================= */''',
    "C4 motor da passagem de turno"
)

# ligações de eventos e render no ciclo geral
troca(
    '$("b-gerar").onclick=emitirPEA;',
    '''$("b-gerar").onclick=emitirPEA;
(function(){
  const eq=$("tn-eq"), ini=$("tn-ini"), fx=$("tn-fechar");
  if(eq) eq.addEventListener("change", ()=>{ turnoObj().equipa = eq.value.trim(); persistir(false); });
  if(ini) ini.addEventListener("change", ()=>{ turnoObj().inicio = ini.value.trim(); renderTurno(); pintarDON(); persistir(false); });
  if(fx) fx.addEventListener("click", fecharTurno);
})();''',
    "C5 ligações do painel de turno"
)

troca(
    '''function pintarTudo(){
  pintarArquivo();''',
    '''function pintarTudo(){
  try{ renderTurno(); }catch(e){}
  pintarArquivo();''',
    "C6 turno no ciclo de render"
)

# ═══════════════════════════════════════════════════════════════════
# D — verificações, como regras do motor introduzido em r0022
#
#     Não se acrescenta código depois do ciclo de REGRAS_DON: uma regra tem de
#     poder rebentar sozinha sem levar as outras atrás, e é isso que o motor
#     garante. As duas novas entram no registo pela mesma porta que as outras.
# ═══════════════════════════════════════════════════════════════════
troca(
    """const REGRAS_DON = [
  { id:"ata", ids:["ata"], t:"Prazo de ataque inicial e ampliado", fontes:["DON2"],""",
    """const REGRAS_DON = [
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
          return f.f+" — solicitado a "+(pcoDef(f.f).ext||f.entidade||"entidade competente")+" em "+f.solicitado+(ms!==null? " (há "+dur(ms)+")":"");
        }).join("; ")+".",
        f:"Os responsáveis pelos núcleos de segurança, de emergência médica e de coordenação do apoio psicológico e social de emergência são nomeados, respetivamente, pela força de segurança territorialmente competente, pelo INEM, I. P., e pelo Instituto da Segurança Social, I. P., por solicitação do COS, e reportam ao oficial de operações.",
        a:"Reiterar a solicitação junto da entidade nomeadora e registar a nomeação assim que comunicada. Enquanto o núcleo não estiver ativado, as suas competências são exercidas pela célula de operações.",
        r:"Despacho n.º 4067/2024, arts. 17.º, n.º 1, al. h), 23.º, n.º 2, 24.º, n.º 2 e 25.º, n.º 2"});
      return v; } },

  { id:"ata", ids:["ata"], t:"Prazo de ataque inicial e ampliado", fontes:["DON2"],""",
    "D1 duas regras novas no registo REGRAS_DON"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
