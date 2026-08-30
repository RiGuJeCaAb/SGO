#!/usr/bin/env python3
"""
p0015 — uma folha por célula, e equilíbrio da mancha impressa
CSREPC Douro · Estação PEA · sem alteração ao conteúdo

Andava a remendar quebras de página quando a resposta era outra: **cada célula na sua
folha**. Deixa de haver tabela cortada a meio, faixa vertical partida entre páginas e
bloco que começa com uma linha no fundo da folha. E, por acréscimo, é a leitura certa
do documento — quem trabalha em Operações tem a sua folha, e entrega-se uma folha por
célula tal como se entrega uma célula na passagem de turno.

Equilíbrio da mancha, que é o que faltava:

  A  Uma folha por célula. Planeamento fica com o cabeçalho; Operações e Logística
     abrem folha nova. A faixa de fecho acompanha a última.
  B  A faixa vertical deixa de se esticar ao longo da folha inteira: as letras juntam-se
     ao centro do bloco, com entrelinha fixa. Passa a ler-se como lombada, que é o que
     é, em vez de letras espalhadas por trinta centímetros.
  C  A coluna de rótulos alarga de 26 para 32 mm — «Prioridades táticas» e «Segurança
     das forças» deixam de partir em duas linhas.
  D  O texto deixa de ser justificado. Numa coluna estreita, a justificação abre rios
     de espaço entre palavras; alinhado à esquerda lê-se melhor e imprime melhor.
  E  Respiração: entrelinha a 1,4, mais espaço dentro das células e menos entre blocos,
     já que cada um tem a sua folha.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0058.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0059.html"

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
# A — uma folha por célula
# ═══════════════════════════════════════════════════════════════════
troca(
    '  .paper .cel{display:grid!important;grid-template-columns:10mm 1fr!important;margin:0 0 8pt!important;break-inside:auto}',
    '''  /* Uma folha por célula. Não é só arrumação: é o que elimina a tabela cortada a
     meio, a faixa vertical partida entre páginas e o bloco que começa com uma linha
     no fundo da folha. Planeamento fica com o cabeçalho; as outras abrem folha nova. */
  .paper .cel{display:grid!important;grid-template-columns:12mm 1fr!important;margin:0!important}
  .paper .cel.op, .paper .cel.lg{break-before:page!important;page-break-before:always!important;margin-top:0!important}
  .paper .cel + table.t-of{break-before:avoid!important;page-break-before:avoid!important;margin-top:6pt!important}''',
    "A1 quebra de página antes de cada célula"
)

# ═══════════════════════════════════════════════════════════════════
# B — a faixa vertical passa a lombada
# ═══════════════════════════════════════════════════════════════════
troca(
    '''  .paper .cel-v{grid-column:1!important;display:flex!important;width:auto!important;writing-mode:initial!important;
    flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;
    border:0.75pt solid #404040!important;border-right:none!important;padding:3pt 0!important;
    font-size:8pt!important;font-weight:700!important;letter-spacing:0!important;line-height:1.25!important;
    text-align:center!important;color:#404040!important;background:#fff!important}''',
    '''  /* Lombada, não legenda espalhada. As letras juntam-se ao centro do bloco com
     entrelinha fixa: numa folha inteira, esticá-las de cima a baixo transformava o
     nome da célula em ruído. */
  .paper .cel-v{grid-column:1!important;display:flex!important;width:auto!important;writing-mode:initial!important;
    flex-direction:column!important;align-items:center!important;justify-content:center!important;
    border:0.75pt solid #404040!important;border-right:none!important;padding:6pt 0!important;
    font-size:7.5pt!important;font-weight:700!important;letter-spacing:.4pt!important;line-height:9pt!important;
    text-align:center!important;color:#595959!important;background:#F2F2F2!important;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}''',
    "B1 faixa vertical centrada, com entrelinha fixa"
)

# ═══════════════════════════════════════════════════════════════════
# C + D + E — coluna de rótulos, alinhamento e respiração
# ═══════════════════════════════════════════════════════════════════
troca(
    '''  .paper .cel-lab{flex:0 0 26mm!important;background:#F2F2F2!important;font-size:9.5pt!important;font-weight:700!important;
    padding:3pt 5pt!important;border-right:0.75pt solid #404040!important;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}''',
    '''  /* 32 mm: «Prioridades táticas» e «Segurança das forças» cabem numa linha. */
  .paper .cel-lab{flex:0 0 32mm!important;background:#F2F2F2!important;font-size:9.5pt!important;font-weight:700!important;
    padding:5pt 6pt!important;border-right:0.75pt solid #404040!important;
    display:flex!important;align-items:center!important;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}''',
    "C1 coluna de rótulos a 32 mm"
)

troca(
    '  .paper .cel-con{flex:1 1 auto!important;padding:3pt 5pt!important;text-align:justify!important}',
    '''  /* Sem justificação. Numa coluna desta largura ela abre rios de espaço entre
     palavras, que no papel se vêem mais do que no ecrã. */
  .paper .cel-con{flex:1 1 auto!important;padding:5pt 7pt!important;text-align:left!important}
  .paper .cel-con p{margin:0 0 4pt!important}
  .paper .cel-con p:last-child{margin-bottom:0!important}''',
    "D1 texto alinhado à esquerda, com respiração"
)

troca(
    '  .paper{font-size:10.5pt!important;line-height:1.35!important;color:#1A1A1A!important;background:#fff!important}',
    '  .paper{font-size:10.5pt!important;line-height:1.4!important;color:#1A1A1A!important;background:#fff!important;padding:0!important}',
    "E1 entrelinha a 1,4"
)

troca(
    '  .paper .cel-row{display:flex!important;border-bottom:0.75pt solid #404040!important;break-inside:avoid;page-break-inside:avoid}',
    '  .paper .cel-row{display:flex!important;align-items:stretch!important;border-bottom:0.75pt solid #404040!important;break-inside:avoid;page-break-inside:avoid}',
    "E2 linhas de célula com altura solidária"
)

# a faixa de fecho acompanha a última célula, não abre folha sozinha
troca(
    '  .paper .hz{display:flex!important;height:4pt!important;margin:6pt 0!important;gap:0!important;background:none!important}',
    '  .paper .hz{display:flex!important;height:4pt!important;margin:6pt 0!important;gap:0!important;background:none!important;break-before:avoid!important;page-break-before:avoid!important}',
    "A2 a faixa de fecho não abre folha sozinha"
)

# ── F · duas causas que só o papel revelou ───────────────────────────
#
#   O texto continuava justificado porque a regra está nos próprios parágrafos, não no
#   contentor: `.paper p` e `.cel-con p` trazem `text-align:justify`.
#
#   E o cabeçalho da tabela de missões saiu ilegível: o `th` é branco sobre azul, e o
#   meu sombreado cinzento tirou-lhe o fundo sem lhe mudar a cor da letra. Fica azul,
#   como a célula de operações no modelo — a tabela 6 do .docx tem o título sombreado
#   a #005CA9.
troca(
    "  .paper .cel-con p{margin:0 0 4pt!important}",
    "  .paper .cel-con p, .paper p{text-align:left!important;margin:0 0 4pt!important}",
    "F1 a justificação sai dos próprios parágrafos"
)
troca(
    "  .paper .t-of th{background:#F2F2F2!important;font-size:9.5pt!important;font-weight:700!important;\n"
    "    border:0.75pt solid #404040!important;padding:3pt 5pt!important;text-align:left!important}",
    "  .paper .t-of th{background:#005CA9!important;color:#fff!important;font-size:9.5pt!important;font-weight:700!important;\n"
    "    border:0.75pt solid #404040!important;padding:3pt 5pt!important;text-align:left!important;\n"
    "    -webkit-print-color-adjust:exact;print-color-adjust:exact}",
    "F2 cabeçalho de tabela legível, no azul do modelo"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s" % (N[0], DST))
