#!/usr/bin/env python3
"""
p0009 — cor por célula nos separadores
CSREPC Douro · Estação PEA · sem alteração ao comportamento

A aplicação já tinha convenção de cor por célula, e já era coerente entre o ecrã e o
formato oficial impresso do PEA:

    Planeamento   verde     .cel-v.vd #3AAA35   ·   .pd-plan var(--madeira)
    Operações     azul      .cel-v.az #005CA9   ·   .pd-ops  var(--agua)
    Logística     laranja   .cel-v.lr #E84E0F   ·   .pd-log  var(--laranja)

Não se inventa cor nenhuma: estende-se a que já existe aos separadores, que até aqui
eram todos iguais. Faltavam duas designações, e a escolha delas diz alguma coisa:

  · Comando fica com `--fogo`, que é a cor do símbolo da aplicação e a do COS.
  · Passagem de turno fica com `--metal`, o cinzento neutro, **porque não é célula**.
    Comando também não é — é o enquadramento, como o registo de posse declara —, mas
    é o vértice da estrutura e não se apaga. As três células do art. 12.º, n.º 2 do
    SIOPS ficam com as três cores do PEA, e a distinção lê-se sem legenda.

  A  Variáveis `--cel-*`, uma por separador, nos dois temas.
  B  Barra de cor no topo de cada separador: 40% de opacidade em repouso, plena e mais
     alta quando activo, com o rótulo a tomar a cor. Sem preenchimentos: a hierarquia
     continua a fazer-se por tipografia, cor e espaço.
  C  O quadro de passagem de turno passa a marcar cada célula com a sua cor, para que a
     mesma leitura funcione onde as quatro aparecem lado a lado.
  D  A faixa do cabeçalho passa a ser a legenda: as cinco cores pela ordem dos
     separadores, em vez de um gradiente decorativo.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "real_r0037.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "real_r0038.html"

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
# A — as cores, por separador, herdadas da convenção do PEA
# ═══════════════════════════════════════════════════════════════════
troca(
    '  .hstrip{height:4px;background:linear-gradient(90deg,var(--agua) 0 20%,var(--madeira) 20% 40%,var(--fogo) 40% 60%,var(--terra) 60% 80%,var(--metal,#9AA3AD) 80% 100%);opacity:.85}',
    '''  /* Cor por célula. Herdada do formato oficial do PEA, onde já era esta:
     planeamento verde, operações azul, logística laranja. Comando toma a cor do
     símbolo; a passagem de turno fica no cinzento neutro, porque não é célula. */
  :root{ --cel-comando:var(--fogo); --cel-planeamento:var(--madeira);
         --cel-operacoes:var(--agua); --cel-logistica:var(--laranja);
         --cel-turno:var(--metal); }

  /* A faixa do cabeçalho passa a ser a legenda das células, pela ordem dos separadores. */
  .hstrip{height:4px;opacity:.9;background:linear-gradient(90deg,
    var(--cel-comando) 0 20%, var(--cel-planeamento) 20% 40%, var(--cel-operacoes) 40% 60%,
    var(--cel-logistica) 60% 80%, var(--cel-turno) 80% 100%)}

  /* Barra no topo do separador: discreta em repouso, plena quando ativo. Sem
     preenchimentos de cor — o cartão continua a ser lido pela tipografia. */
  nav button[data-cel]::before{content:"";position:absolute;left:11px;right:11px;top:0;
    height:3px;border-radius:0 0 3px 3px;background:var(--c);opacity:.4;transition:opacity .12s,height .12s}
  nav button[data-cel]:hover::before{opacity:.75}
  nav button[data-cel].on::before{opacity:1;height:4px}
  nav button[data-cel].on{color:var(--tx)}
  nav button[data-cel].on .rot{color:var(--c)}
  nav button[data-cel="comando"]{--c:var(--cel-comando)}
  nav button[data-cel="planeamento"]{--c:var(--cel-planeamento)}
  nav button[data-cel="operacoes"]{--c:var(--cel-operacoes)}
  nav button[data-cel="logistica"]{--c:var(--cel-logistica)}
  nav button[data-cel="turno"]{--c:var(--cel-turno)}

  /* No quadro de passagem de turno as quatro aparecem lado a lado: a mesma leitura. */
  .sub[data-cel]{border-left:3px solid var(--c)}
  .sub[data-cel] .stit{color:var(--c)}
  .sub[data-cel="comando"]{--c:var(--cel-comando)}
  .sub[data-cel="planeamento"]{--c:var(--cel-planeamento)}
  .sub[data-cel="operacoes"]{--c:var(--cel-operacoes)}
  .sub[data-cel="logistica"]{--c:var(--cel-logistica)}''',
    "A1 variáveis de célula, faixa-legenda e estilo dos separadores"
)

# ── A2 · a barra laranja fixa do separador ativo sai ───────────────────
#
#     Existia `nav button.on::before` com background laranja: a marca do separador
#     ativo, de quando todos os separadores eram iguais. Vem depois no ficheiro e
#     ganhava a minha regra, o que punha o Comando com a cor da Logistica. Sai, e a
#     marca do ativo passa a ser a cor da propria celula.
troca(
    'nav button.on::before{content:"";position:absolute;top:0;left:-1px;right:-1px;height:4px;background:var(--laranja);border-radius:11px 11px 0 0}',
    'nav button.on:not([data-cel])::before{content:"";position:absolute;top:0;left:-1px;right:-1px;height:4px;background:var(--laranja);border-radius:11px 11px 0 0}',
    "A2 barra fixa do ativo cede a cor da celula"
)

# ═══════════════════════════════════════════════════════════════════
# B — os separadores declaram a sua célula
# ═══════════════════════════════════════════════════════════════════
troca(
    '''    <button data-p="p-comando" class="on" title="COS, coordenador do PCO e adjuntos — arts. 14.º e 15.º">Comando</button>
    <button data-p="p-planeamento" title="Elabora o plano estratégico de ação — arts. 26.º a 30.º">Planeamento</button>
    <button data-p="p-operacoes" title="Executa o plano e transmite as ordens de missão — arts. 16.º a 25.º">Operações</button>
    <button data-p="p-logistica" title="Sustentação logística do teatro de operações — arts. 31.º a 35.º">Logística e Finanças</button>''',
    '''    <button data-p="p-comando" data-cel="comando" class="on" title="COS, coordenador do PCO e adjuntos — arts. 14.º e 15.º"><span class="rot">Comando</span></button>
    <button data-p="p-planeamento" data-cel="planeamento" title="Elabora o plano estratégico de ação — arts. 26.º a 30.º"><span class="rot">Planeamento</span></button>
    <button data-p="p-operacoes" data-cel="operacoes" title="Executa o plano e transmite as ordens de missão — arts. 16.º a 25.º"><span class="rot">Operações</span></button>
    <button data-p="p-logistica" data-cel="logistica" title="Sustentação logística do teatro de operações — arts. 31.º a 35.º"><span class="rot">Logística e Finanças</span></button>''',
    "B1 separadores das células"
)

troca(
    '    <button data-p="p-turno" title="Continuidade em espelho e rotatividade de funções — DON n.º 2, ponto 7.d.(30)">Passagem de turno</button>',
    '    <button data-p="p-turno" data-cel="turno" title="Continuidade em espelho e rotatividade de funções — DON n.º 2, ponto 7.d.(30)"><span class="rot">Passagem de turno</span></button>',
    "B2 separador da passagem de turno"
)

# ═══════════════════════════════════════════════════════════════════
# C — o quadro de passagem de turno herda a cor
# ═══════════════════════════════════════════════════════════════════
troca(
    '''    return `<div class="sub">
      <span class="stit">${esc(c.n)} <span class="hint" style="font-weight:400">${esc(c.r)}</span>${t.celulas[c.k].n? ' — <b>'+esc(t.celulas[c.k].n)+'</b>':''}</span>''',
    '''    return `<div class="sub" data-cel="${c.k}">
      <span class="stit">${esc(c.n)} <span class="hint" style="font-weight:400">${esc(c.r)}</span>${t.celulas[c.k].n? ' — <b>'+esc(t.celulas[c.k].n)+'</b>':''}</span>''',
    "C1 pendências por célula com a cor da célula"
)

troca(
    '''    <div class="sub"><span class="stit">${esc(c.n)} <span class="hint" style="font-weight:400">${esc(c.r)}</span></span>
      <div class="grid g2">''',
    '''    <div class="sub" data-cel="${c.k}"><span class="stit">${esc(c.n)} <span class="hint" style="font-weight:400">${esc(c.r)}</span></span>
      <div class="grid g2">''',
    "C2 quem assegura cada célula com a cor da célula"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
