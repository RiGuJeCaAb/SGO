#!/usr/bin/env python3
"""
p0018 — a fita do tempo e a linha de evolução passam a abrir em acordeão
CSREPC Douro · Estação PEA · sem alteração à versão de estado

Base legal: Despacho n.º 4067/2024, art. 2.º, al. c) e art. 17.º, n.º 1, al. g).

Os dois cartões que crescem sem limite estavam sempre abertos. Ao fim de umas horas de
ocorrência a fita do tempo tem dezenas de registos e a linha de evolução outras tantas,
e o painel de Operações passa a ser uma coluna de milhares de pixéis onde nada mais se
encontra. Quem precisa da fita procura-a; quem não precisa não a devia ter à frente.

  A  `CARTOES_DOBRAVEIS`: registo declarativo do que dobra, com a contagem que aparece
     no cabeçalho fechado e a razão pela qual dobra. Um cartão que ali esteja e não
     exista, ou que exista e não dobre, parte a verificação — mesmo princípio do
     registo de posse e do da arrumação.
  B  O cabeçalho passa a botão, com `aria-expanded` e a contagem sempre à vista:
     fechado, continua a dizer quantos registos tem. Fechar não é esconder que existe.
  C  Fechados por omissão. Abrir um não fecha os outros — não é acordeão exclusivo, que
     obrigaria a fechar a fita para ver a evolução, e num PCO isso é trabalho a mais.
  D  Na impressão abrem sempre: um documento não tem cartões para clicar.
  E  O estado de aberto não se guarda. A app abre sempre com eles fechados, que é o
     estado útil por omissão, e o operador abre o que precisar.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0063.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0063b.html"

s = io.open(SRC, encoding="utf-8").read()
N = [0]

def troca(ancora, novo, nome):
    global s
    c = s.count(ancora)
    assert c == 1, "[%s] ancora encontrada %d vezes, esperava 1:\n%s" % (nome, c, ancora[:180])
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print("  ok  " + nome)

# ═══════════════════════════════════════════════════════════════════
# A + B + C — registo, dobragem e contagem
# ═══════════════════════════════════════════════════════════════════
troca(
    'function auditarArrumacao(){',
    '''/* ================= cartões dobráveis =================
   Os cartões que crescem sem limite abrem a pedido. O cabeçalho fica sempre à vista,
   com a contagem: fechar não é esconder que existe, é não deixar que ocupe o painel.

   `contar` devolve o rótulo que aparece no cabeçalho fechado. Devolver vazio significa
   que não há nada lá dentro, e o cabeçalho di-lo em vez de mentir com um zero. */
const CARTOES_DOBRAVEIS = [
  { h:"Fita do tempo", celula:"operacoes", r:"art. 2.º, al. c); art. 17.º, n.º 1, al. g)",
    porque:"cresce a cada registo e ao fim de horas ocupa o painel inteiro",
    contar:()=>{ const n=(O.fita||[]).length; return n? n+(n===1? " registo":" registos") : "sem registos"; } },
  { h:"Linha de evolução", celula:"operacoes", r:"art. 17.º, n.º 1, al. a)",
    porque:"cresce a cada ponto de situação e a cada alteração de estado de setor",
    /* Este cartão já trazia a contagem na etiqueta do cabeçalho. Reaproveita-se a que
       existe em vez de acrescentar uma segunda que diria o mesmo ao lado. */
    cnt:"evo-count" }
];

function dobrarCartoes(){
  CARTOES_DOBRAVEIS.forEach(d=>{
    const c = cartaoPorTitulo(d.h); if(!c || c.classList.contains("dobravel")) return;
    const h2 = c.querySelector("h2"); if(!h2) return;
    c.classList.add("dobravel");
    /* o conteúdo vai para um contentor próprio; o cabeçalho fica de fora e vira botão */
    const corpo = document.createElement("div");
    corpo.className = "cd-corpo";
    while(h2.nextSibling) corpo.appendChild(h2.nextSibling);
    c.appendChild(corpo);
    h2.classList.add("cd-cab");
    h2.setAttribute("role", "button");
    h2.setAttribute("tabindex", "0");
    h2.setAttribute("aria-expanded", "false");
    /* Procura-se dentro do próprio cartão e não pelo documento: a arrumação por
       células move os cartões, e um `getElementById` no momento errado apanha o
       elemento antes de estar onde vai ficar — ou não o apanha, e ficam duas contagens
       a dizer o mesmo lado a lado. */
    const ex = d.cnt ? c.querySelector("#" + d.cnt) : null;
    if(ex){ ex.classList.add("cd-cnt", "cd-cnt-ex"); h2.appendChild(ex); }
    else { const cnt = document.createElement("span"); cnt.className = "cd-cnt"; h2.appendChild(cnt); }
    const alternar = ()=>abrirCartao(c, !c.classList.contains("aberto"));
    h2.addEventListener("click", alternar);
    h2.addEventListener("keydown", ev=>{
      if(ev.key===" " || ev.key==="Enter"){ ev.preventDefault(); alternar(); }
    });
  });
  pintarContagens();
}

function abrirCartao(c, on){
  if(!c) return;
  c.classList.toggle("aberto", !!on);
  const h2 = c.querySelector(":scope > h2");
  if(h2) h2.setAttribute("aria-expanded", on? "true":"false");
}

/* A contagem no cabeçalho tem de acompanhar o que está lá dentro, aberto ou fechado:
   é a única coisa que se vê quando o cartão está fechado. */
function pintarContagens(){
  CARTOES_DOBRAVEIS.forEach(d=>{
    if(!d.contar) return;   /* a contagem é de quem a criou; não se escreve por cima */
    const c = cartaoPorTitulo(d.h); if(!c) return;
    const el = c.querySelector(":scope > h2 > .cd-cnt"); if(!el) return;
    let t = ""; try{ t = d.contar() || ""; }catch(e){ t = ""; }
    el.textContent = t;
  });
}

/* Um cartão declarado que não exista, ou que exista e não tenha dobrado, é defeito
   visível — e não um cartão que ninguém consegue abrir. */
function auditarDobraveis(){
  const semCartao = CARTOES_DOBRAVEIS.filter(d=>!cartaoPorTitulo(d.h)).map(d=>d.h);
  const semDobrar = CARTOES_DOBRAVEIS.filter(d=>{
    const c = cartaoPorTitulo(d.h); return c && !c.classList.contains("dobravel");
  }).map(d=>d.h);
  const semRazao = CARTOES_DOBRAVEIS.filter(d=>!d.r || !d.porque).map(d=>d.h);
  return { n:CARTOES_DOBRAVEIS.length, semCartao, semDobrar, semRazao };
}

function auditarArrumacao(){''',
    "A1 registo, dobragem, contagem e auditoria"
)

troca(
    'try{ dobrarAjudas(); }catch(e){ console.error("ajudas:", e); }',
    'try{ dobrarAjudas(); }catch(e){ console.error("ajudas:", e); }\n'
    'try{ dobrarCartoes(); }catch(e){ console.error("cartões dobráveis:", e); }',
    "C1 dobrar ao arranque"
)

troca(
    'function pintarTudo(){\n  try{ renderTurno(); }catch(e){}',
    'function pintarTudo(){\n  try{ renderTurno(); }catch(e){}\n  try{ pintarContagens(); }catch(e){}',
    "C2 as contagens acompanham o ciclo de render"
)

# ═══════════════════════════════════════════════════════════════════
# estilo
# ═══════════════════════════════════════════════════════════════════
troca(
    "  .croqui svg{display:block;max-height:340px;margin:0 auto}",
    '''  .croqui svg{display:block;max-height:340px;margin:0 auto}

  /* Cartão dobrável: o cabeçalho é o botão, a contagem fica sempre à vista. */
  .card.dobravel > h2.cd-cab{cursor:pointer;user-select:none;display:flex;align-items:center;
    gap:10px;flex-wrap:wrap;margin-bottom:0;padding-right:26px;position:relative}
  .card.dobravel > h2.cd-cab:hover{color:var(--agua)}
  .card.dobravel > h2.cd-cab:focus-visible{outline:2px solid var(--agua);outline-offset:3px;border-radius:6px}
  .card.dobravel > h2.cd-cab::after{content:"";position:absolute;right:4px;top:50%;
    width:8px;height:8px;border-right:2px solid var(--tx3);border-bottom:2px solid var(--tx3);
    transform:translateY(-70%) rotate(45deg);transition:transform .14s}
  .card.dobravel.aberto > h2.cd-cab::after{transform:translateY(-20%) rotate(-135deg)}
  .card.dobravel > h2.cd-cab .cd-cnt{font-family:var(--mono);font-size:11px;font-weight:400;
    letter-spacing:.4px;color:var(--tx3);margin-left:auto;margin-right:6px}
  /* etiqueta reaproveitada como contagem: perde a moldura, para não se ler como
     duas coisas diferentes lado a lado */
  .card.dobravel > h2.cd-cab .cd-cnt-ex{border:none;padding:0;background:none}
  /* Em ecrã estreito o cabeçalho tem título, etiqueta legal e contagem: sem isto a
     contagem cai para linha própria e o cabeçalho fechado passa dos cem pixéis, que
     é o oposto do que se quer. A contagem alinha à direita na linha do título. */
  @media(max-width:820px){
    .card.dobravel > h2.cd-cab{flex-wrap:nowrap;align-items:baseline;gap:8px}
    .card.dobravel > h2.cd-cab .tag{display:none}
    .card.dobravel > h2.cd-cab .cd-cnt{white-space:nowrap;flex:none}
  }
  .card.dobravel > .cd-corpo{display:none;margin-top:16px}
  .card.dobravel.aberto > .cd-corpo{display:block}''',
    "B1 estilo do cartão dobrável"
)

# ═══════════════════════════════════════════════════════════════════
# D — na impressão abrem sempre
# ═══════════════════════════════════════════════════════════════════
troca(
    '  .pane{display:none}.pane.print-target{display:block}',
    '  .pane{display:none}.pane.print-target{display:block}\n'
    '    /* um documento não tem cartões para clicar: o que estiver dobrado abre */\n'
    '    .card.dobravel > .cd-corpo{display:block!important}\n'
    '    .card.dobravel > h2.cd-cab::after{display:none!important}',
    "D1 na impressão os dobráveis abrem"
)

troca(
    '$("evo-count").textContent = O.evolucao.length+" registos";',
    '$("evo-count").textContent = O.evolucao.length===1? "1 registo" : O.evolucao.length+" registos";',
    "B2 singular na contagem da evolução"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s" % (N[0], DST))
