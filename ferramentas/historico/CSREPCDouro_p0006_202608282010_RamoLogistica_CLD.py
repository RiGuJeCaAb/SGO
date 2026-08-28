#!/usr/bin/env python3
"""
p0006 — a Logística passa a ter ramo próprio; resolve-se a conflação de `dados.est`
CSREPC Douro · Estação PEA · versão de estado 4 -> 5

Base legal: DL n.º 90-A/2022, art. 13.º, al. c); Despacho n.º 4067/2024, arts. 17.º,
19.º, 32.º, n.º 1, als. b) e d), 33.º e 34.º; DON n.º 2 — DECIR/2026, pontos 7.d.(5),
(7) e (8).

O achado que o registo de posse expôs, e que agora se corrige no próprio estado:
`dados.est` reclama ser o dispositivo e guarda lá dentro a reserva e a zona de apoio,
que são áreas da zona de concentração e reserva e portanto matéria da célula de
logística e finanças. Enquanto partilham objeto com os setores, qualquer escrita em
bloco atravessa a fronteira sem se ver — e é isso que `aplicarGestaoPCO` faz hoje,
numa linha só, ao repor `e.res` e `e.za` a meio da importação do dispositivo.

  A  `O.logistica` nasce com `reserva`, `zonaApoio` e `pontoTransito`.
  B  MIGRACOES[4], versão 4 -> 5: move o que estava, sem perder nada, e limpa a origem.
  C  Acessores: `logisticaObj()`, `reservaObj()`, `zaObj()`. O `ptObj()` mantém o nome
     e os nove pontos de chamada não mudam — muda o que devolve.
  D  Registo de posse actualizado, com os caminhos novos.
  E  `pco.canais` fica onde está, declarado no mapa como movimento pendente. Tem 52
     pontos de leitura por `P.canais` e o instantâneo do PEA copia o `pco` inteiro:
     mover agora exigia tocar em código que esta linhagem não tem à frente. Declarar
     o que falta é melhor do que fingir que está feito.

Âncoras em território que a v1.2 mexeu, e que podem exigir rebase: as do importador —
`converterEsbocoGestaoPCO`, `converterV11GestaoPCO`, `diferencialGestaoPCO` e
`aplicarGestaoPCO`. As restantes são de código estável desde a r0015.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0031.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0032.html"

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
# A — o ramo nasce; a origem deixa de o declarar
# ═══════════════════════════════════════════════════════════════════
troca(
    '      est:{n:0, setores:[], aer:"", aerL:[], res:{m:"",o:""}, za:{m:"",o:""}, livre:false}},',
    '      est:{n:0, setores:[], aer:"", aerL:[], livre:false}},\n'
    '    /* Célula de logística e finanças. A reserva e a zona de apoio são áreas da ZCR\n'
    '       (art. 32.º, n.º 1, al. b)) e não fazem parte do dispositivo de Operações. */\n'
    '    logistica:{ reserva:{m:"",o:""}, zonaApoio:{m:"",o:""},\n'
    '      pontoTransito:{des:"",resp:"",ct:"",cd:"",obs:""} },',
    "A1 ramo da logística no estado novo"
)


# A2 - o ponto de transito tambem sai da origem. Faltava, e foi a auditoria de posse
#      a apanha-lo: cinco orfaos em dados.pt.* logo que o registo deixou de o declarar la.
troca(
    '      pt:{des:"", resp:"", ct:"", cd:"", obs:""}, perfil:null,',
    '      perfil:null,',
    "A2 dados.pt sai do estado novo"
)

# ═══════════════════════════════════════════════════════════════════
# C — acessores
# ═══════════════════════════════════════════════════════════════════
troca(
    '''function estObj(){ O.dados.est = O.dados.est || {n:0,setores:[],aer:"",aerL:[],res:{m:"",o:""},za:{m:"",o:""},livre:false}; return O.dados.est; }''',
    '''function estObj(){
  O.dados.est = Object.assign({n:0,setores:[],aer:"",aerL:[],livre:false}, O.dados.est||{});
  if(!Array.isArray(O.dados.est.setores)) O.dados.est.setores=[];
  if(!Array.isArray(O.dados.est.aerL)) O.dados.est.aerL=[];
  return O.dados.est;
}
/* Célula de logística e finanças — arts. 31.º a 35.º. Ramo próprio desde a versão 5
   do estado: a reserva e a zona de apoio são áreas da zona de concentração e reserva
   (art. 32.º, n.º 1, al. b); DL n.º 90-A/2022, art. 13.º, al. c)) e não pertencem ao
   dispositivo que a célula de operações setoriza. */
function logisticaObj(){
  O.logistica = Object.assign({}, O.logistica||{});
  O.logistica.reserva = Object.assign({m:"",o:""}, O.logistica.reserva||{});
  O.logistica.zonaApoio = Object.assign({m:"",o:""}, O.logistica.zonaApoio||{});
  O.logistica.pontoTransito = Object.assign({des:"",resp:"",ct:"",cd:"",obs:""}, O.logistica.pontoTransito||{});
  return O.logistica;
}
function reservaObj(){ return logisticaObj().reserva; }
function zaObj(){ return logisticaObj().zonaApoio; }''',
    "C1 estObj sem reserva e ZA; acessores da logística"
)

troca(
    '''function ptObj(){
  if(!O.dados.pt || typeof O.dados.pt!=="object") O.dados.pt = {des:"",resp:"",ct:"",cd:"",obs:""};
  O.dados.pt = Object.assign({des:"",resp:"",ct:"",cd:"",obs:""}, O.dados.pt);
  return O.dados.pt;
}''',
    '''/* Ponto de trânsito. O nome mantém-se — nove pontos de chamada não mudam — mas passou
   a viver na célula de logística e finanças: é local da ZCR e o seu responsável reporta
   ao oficial de logística e finanças. */
function ptObj(){ return logisticaObj().pontoTransito; }''',
    "C2 ptObj passa a devolver da logística"
)

# ═══════════════════════════════════════════════════════════════════
# B — migração 4 -> 5
# ═══════════════════════════════════════════════════════════════════
troca("const VERSAO_ESTADO = 4;", "const VERSAO_ESTADO = 5;", "B1 VERSAO_ESTADO 4 -> 5")

troca(
    '''function migrarGravado(guardado){''',
    '''/* 4 -> 5 · A célula de logística e finanças passa a ter ramo próprio.
   Move a reserva, a zona de apoio e o ponto de trânsito para `logistica`, limpando a
   origem para que não fiquem duas verdades. Nada se perde: muda o dono, e o dono passa
   a ser o que a lei indica. O plano de comunicações fica em `pco.canais` até haver
   revisão que o mova — está declarado como pendente no registo de posse. */
MIGRACOES.push(e => {
  /* O destino só vence a origem quando tem conteúdo. O degrau 0 já cria `logistica`
     com os valores por omissão — faz Object.assign sobre novoEstado() —, e testar
     apenas a existência do ramo faria uma ocorrência anterior à versão 1 perder a
     reserva em silêncio. Vazio não é migrado: é vazio. */
  const cheio = o => !!o && Object.keys(o).some(k => o[k] !== "" && o[k] != null);
  const est = (e.dados && e.dados.est) || {};
  const L = e.logistica = Object.assign({}, e.logistica||{});
  L.reserva       = Object.assign({m:"",o:""}, cheio(L.reserva)?   L.reserva   : (est.res||{}));
  L.zonaApoio     = Object.assign({m:"",o:""}, cheio(L.zonaApoio)? L.zonaApoio : (est.za||{}));
  L.pontoTransito = Object.assign({des:"",resp:"",ct:"",cd:"",obs:""},
                      cheio(L.pontoTransito)? L.pontoTransito : ((e.dados&&e.dados.pt)||{}));
  delete est.res; delete est.za;
  if(e.dados) delete e.dados.pt;
  return e;
});

function migrarGravado(guardado){''',
    "B2 MIGRACOES.push — versão 5"
)

# ═══════════════════════════════════════════════════════════════════
# pontos de leitura — dispositivo
# ═══════════════════════════════════════════════════════════════════
troca(
    '  $("s-res").checked = !!(e.res.m||e.res.o); $("s-res-x").style.display = $("s-res").checked? "":"none"; $("s-res-m").value=e.res.m; $("s-res-o").value=e.res.o;\n'
    '  $("s-za").checked = !!(e.za.m||e.za.o); $("s-za-x").style.display = $("s-za").checked? "":"none"; $("s-za-m").value=e.za.m; $("s-za-o").value=e.za.o;',
    '  const RS = reservaObj(), ZA = zaObj();\n'
    '  $("s-res").checked = !!(RS.m||RS.o); $("s-res-x").style.display = $("s-res").checked? "":"none"; $("s-res-m").value=RS.m; $("s-res-o").value=RS.o;\n'
    '  $("s-za").checked = !!(ZA.m||ZA.o); $("s-za-x").style.display = $("s-za").checked? "":"none"; $("s-za-m").value=ZA.m; $("s-za-o").value=ZA.o;',
    "R1 renderSetores"
)

troca(
    '  if(e.res.m||e.res.o) extra.push("Reserva: "+(e.res.m||"?")+" meios / "+(e.res.o||"?")+" op.");\n'
    '  if(e.za.m||e.za.o) extra.push("ZA: "+(e.za.m||"?")+" meios / "+(e.za.o||"?")+" op.");',
    '  const RS = reservaObj(), ZA = zaObj();\n'
    '  if(RS.m||RS.o) extra.push("Reserva: "+(RS.m||"?")+" meios / "+(RS.o||"?")+" op.");\n'
    '  if(ZA.m||ZA.o) extra.push("ZA: "+(ZA.m||"?")+" meios / "+(ZA.o||"?")+" op.");',
    "R2 comporSetores — descrição"
)

troca(
    '  const tm = e.setores.reduce((a,x)=>{const t=totSetor(x); return a+((x.tip||[]).length? t.m : (+x.m||0));},0)+(+e.res.m||0)+(+e.za.m||0);\n'
    '  const to = e.setores.reduce((a,x)=>{const t=totSetor(x); return a+((x.tip||[]).length? t.o : (+x.o||0));},0)+(+e.res.o||0)+(+e.za.o||0);',
    '  const tm = e.setores.reduce((a,x)=>{const t=totSetor(x); return a+((x.tip||[]).length? t.m : (+x.m||0));},0)+(+RS.m||0)+(+ZA.m||0);\n'
    '  const to = e.setores.reduce((a,x)=>{const t=totSetor(x); return a+((x.tip||[]).length? t.o : (+x.o||0));},0)+(+RS.o||0)+(+ZA.o||0);',
    "R3 comporSetores — totais"
)

troca(
    '$("s-res").addEventListener("change", ()=>{ const e=estObj(); if(!$("s-res").checked) e.res={m:"",o:""}; else e.res.m=e.res.m||"0"; renderSetores(); persistir(false); });\n'
    '["s-res-m","s-res-o"].forEach(id=>$(id).addEventListener("change", ()=>{ estObj().res={m:$("s-res-m").value,o:$("s-res-o").value}; comporSetores(); persistir(false); }));\n'
    '$("s-za").addEventListener("change", ()=>{ const e=estObj(); if(!$("s-za").checked) e.za={m:"",o:""}; else e.za.m=e.za.m||"0"; renderSetores(); persistir(false); });\n'
    '["s-za-m","s-za-o"].forEach(id=>$(id).addEventListener("change", ()=>{ estObj().za={m:$("s-za-m").value,o:$("s-za-o").value}; comporSetores(); persistir(false); }));',
    '$("s-res").addEventListener("change", ()=>{ const R=reservaObj(); if(!$("s-res").checked){ R.m=""; R.o=""; } else R.m=R.m||"0"; renderSetores(); persistir(false); });\n'
    '["s-res-m","s-res-o"].forEach(id=>$(id).addEventListener("change", ()=>{ const R=reservaObj(); R.m=$("s-res-m").value; R.o=$("s-res-o").value; comporSetores(); persistir(false); }));\n'
    '$("s-za").addEventListener("change", ()=>{ const Z=zaObj(); if(!$("s-za").checked){ Z.m=""; Z.o=""; } else Z.m=Z.m||"0"; renderSetores(); persistir(false); });\n'
    '["s-za-m","s-za-o"].forEach(id=>$(id).addEventListener("change", ()=>{ const Z=zaObj(); Z.m=$("s-za-m").value; Z.o=$("s-za-o").value; comporSetores(); persistir(false); }));',
    "R4 ouvintes da reserva e da ZA"
)

troca(
    '  m  += (+((e.res||{m:"",o:""}).m) || 0) + (+((e.za||{m:"",o:""}).m) || 0);\n'
    '  op += (+((e.res||{m:"",o:""}).o) || 0) + (+((e.za||{m:"",o:""}).o) || 0);',
    '  const RS = reservaObj(), ZA = zaObj();\n'
    '  m  += (+RS.m || 0) + (+ZA.m || 0);\n'
    '  op += (+RS.o || 0) + (+ZA.o || 0);',
    "R5 contarDispositivo"
)

troca(
    '  const e = (O.dados && O.dados.est) || {n:0,setores:[],aer:"",aerL:[],res:{m:"",o:""},za:{m:"",o:""},livre:false};',
    '  const e = (O.dados && O.dados.est) || {n:0,setores:[],aer:"",aerL:[],livre:false};',
    "R6 contarDispositivo — recurso"
)

troca(
    '    reserva:(+((e.res||{}).m)||0), reservaOp:(+((e.res||{}).o)||0),\n'
    '    za:(+((e.za||{}).m)||0),',
    '    reserva:(+reservaObj().m||0), reservaOp:(+reservaObj().o||0),\n'
    '    za:(+zaObj().m||0),',
    "R7 retratoOperacional"
)

troca(
    '  const resA = +((ant.res||{}).m)||0, resX = +((estObj().res||{}).m)||0;',
    '  const resA = +((ant.res||{}).m)||0, resX = +reservaObj().m||0;',
    "R8 diferencasDesde"
)

troca(
    '  if(e.res.m||e.res.o) chips.push(`<span class="tchip" style="cursor:pointer" data-ins="Reserva: "><b>Reserva</b> ${esc(e.res.m||"?")}m/${esc(e.res.o||"?")}op</span>`);',
    '  const RSc = reservaObj();\n'
    '  if(RSc.m||RSc.o) chips.push(`<span class="tchip" style="cursor:pointer" data-ins="Reserva: "><b>Reserva</b> ${esc(RSc.m||"?")}m/${esc(RSc.o||"?")}op</span>`);',
    "R9 contexto da evolução"
)

troca(
    '        "reserva "+((e.res.m||"?")+" meios / "+(e.res.o||"?")+" op.")+" · ZA "+((e.za.m||"?")+" meios / "+(e.za.o||"?")+" op."));',
    '        "reserva "+((reservaObj().m||"?")+" meios / "+(reservaObj().o||"?")+" op.")+" · ZA "+((zaObj().m||"?")+" meios / "+(zaObj().o||"?")+" op."));',
    "R10 pendências da logística"
)


# R11 - briefingPassagem(). So aparece contra o r0034 real: e codigo que nao existia
#       na linhagem onde este patch foi desenhado. Lia `e.res` e `e.za`, que passariam
#       a undefined - a reserva e a zona de apoio sairiam do briefing sem erro nenhum.
#       Falha silenciosa, que e o modo de falha que este projeto ja documentou como o pior.
troca(
    '    (e.res && (e.res.m||e.res.o))? "Reserva: "+plural(e.res.m||0,"veículo")+", "+plural(e.res.o||0,"operacional","operacionais")+"." : null,\n'
    '    (e.za && (e.za.m||e.za.o))? "Zona de apoio: "+plural(e.za.m||0,"veículo")+", "+plural(e.za.o||0,"operacional","operacionais")+"." : null,',
    '    (RSb.m||RSb.o)? "Reserva: "+plural(RSb.m||0,"veículo")+", "+plural(RSb.o||0,"operacional","operacionais")+"." : null,\n'
    '    (ZAb.m||ZAb.o)? "Zona de apoio: "+plural(ZAb.m||0,"veículo")+", "+plural(ZAb.o||0,"operacional","operacionais")+"." : null,',
    "R11 briefing de passagem — reserva e ZA"
)
troca(
    '  const dispositivo = porSetor.concat([',
    '  const RSb = reservaObj(), ZAb = zaObj();\n  const dispositivo = porSetor.concat([',
    "R12 briefing — acessores em âmbito"
)

# ═══════════════════════════════════════════════════════════════════
# importador — a escrita passa a ser explícita na fronteira
# ═══════════════════════════════════════════════════════════════════
troca(
    '  e.res = c.est.res; e.za = c.est.za; e.livre = false;',
    '  e.livre = false;\n'
    '  /* A reserva e a zona de apoio são da célula de logística e finanças. A escrita\n'
    '     atravessa a fronteira de propósito — o contrato declara-as — e agora vê-se. */\n'
    '  const L = logisticaObj();\n'
    '  L.reserva = Object.assign({m:"",o:""}, c.est.res||{});\n'
    '  L.zonaApoio = Object.assign({m:"",o:""}, c.est.za||{});',
    "I1 aplicarGestaoPCO"
)

troca(
    '  add("Reserva (veículos/operacionais)", (e.res.m||0)+"/"+(e.res.o||0), (c.est.res.m||0)+"/"+(c.est.res.o||0));\n'
    '  add("Zona de apoio (veículos/operacionais)", (e.za.m||0)+"/"+(e.za.o||0), (c.est.za.m||0)+"/"+(c.est.za.o||0));',
    '  add("Reserva (veículos/operacionais)", (reservaObj().m||0)+"/"+(reservaObj().o||0), (c.est.res.m||0)+"/"+(c.est.res.o||0));\n'
    '  add("Zona de apoio (veículos/operacionais)", (zaObj().m||0)+"/"+(zaObj().o||0), (c.est.za.m||0)+"/"+(c.est.za.o||0));',
    "I2 diferencialGestaoPCO"
)

troca(
    '  if(c.pt.des || c.pt.resp || c.pt.ct) O.dados.pt = Object.assign(ptObj(), c.pt);',
    '  if(c.pt.des || c.pt.resp || c.pt.ct) Object.assign(ptObj(), c.pt);',
    "I3 ponto de trânsito importado"
)

troca(
    '  const PTe=ptObj(); $("pt-des").value=PTe.des; $("pt-resp").value=PTe.resp;',
    '  const PTe=ptObj(); $("pt-des").value=PTe.des; $("pt-resp").value=PTe.resp;',
    "I4 escreverForm — sem alteração, confirmação de âncora"
)

# ═══════════════════════════════════════════════════════════════════
# D — registo de posse
# ═══════════════════════════════════════════════════════════════════
troca(
    '''      { p:"pco.canais",     r:"art. 32.º, n.º 1, al. d); art. 34.º", d:"Plano de comunicações e canais atribuídos" },
      { p:"dados.pt",       r:"DL n.º 90-A/2022, art. 13.º, al. c); art. 32.º, n.º 1, al. b); DON 2, 7.d.(5), (7) e (8)", d:"Ponto de trânsito na zona de concentração e reserva" },
      { p:"dados.est.res",  r:"art. 32.º, n.º 1, al. b); art. 33.º", d:"Reserva tática" },
      { p:"dados.est.za",   r:"art. 32.º, n.º 1, al. b)", d:"Zona de apoio" }''',
    '''      { p:"logistica.reserva",       r:"art. 32.º, n.º 1, al. b); art. 33.º", d:"Reserva tática" },
      { p:"logistica.zonaApoio",     r:"art. 32.º, n.º 1, al. b)", d:"Zona de apoio" },
      { p:"logistica.pontoTransito", r:"DL n.º 90-A/2022, art. 13.º, al. c); art. 32.º, n.º 1, al. b); DON 2, 7.d.(5), (7) e (8)", d:"Ponto de trânsito na zona de concentração e reserva" },
      { p:"pco.canais",              r:"art. 32.º, n.º 1, al. d); art. 34.º", d:"Plano de comunicações e canais atribuídos",
        mover:"logistica.comunicacoes",
        porque:"52 pontos de leitura por P.canais e o instantâneo do PEA copia o ramo pco inteiro; move-se em revisão própria" }''',
    "D1 posse — caminhos novos e movimento declarado"
)

troca(
    '''   Um ramo pode ser um sub-ramo: `dados.est.setores` é de Operações e `dados.est.res`
   é de Logística, porque a reserva é área da ZCR.
   Acrescentar um ramo ao estado sem o inscrever aqui parte `auditarPosse()`. */''',
    '''   Um ramo pode ser um sub-ramo: `dados.est.setores` é de Operações e a reserva é de
   Logística, porque é área da ZCR — conflação que a versão 5 do estado resolveu, movendo
   a reserva, a zona de apoio e o ponto de trânsito para `logistica`.
   Um ramo com `mover` está no sítio errado por razão declarada, e a razão é dívida
   assumida, não omissão. Acrescentar um ramo ao estado sem o inscrever aqui parte
   `auditarPosse()`. */''',
    "D2 comentário do registo"
)

troca(
    '''  return { folhas: folhas.length, orfaos: orfaos, duplicados: duplicados };''',
    '''  /* Ramos no sítio errado por decisão registada. Não são defeito: são dívida com data
     e razão, e é melhor tê-la à vista do que dispersa por comentários. */
  const porMover = [];
  POSSE.forEach(c=>c.ramos.forEach(r=>{ if(r.mover) porMover.push({celula:c.k, de:r.p, para:r.mover, porque:r.porque||""}); }));
  return { folhas: folhas.length, orfaos: orfaos, duplicados: duplicados, porMover: porMover };''',
    "D3 auditoria devolve os movimentos pendentes"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
