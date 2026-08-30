#!/usr/bin/env python3
"""
p0014 — o PEA impresso passa a seguir o modelo .docx aceite
CSREPC Douro · Estação PEA · sem alteração ao conteúdo

Medidas retiradas do próprio ficheiro, não do PDF: `word/document.xml` e
`word/footer1.xml` de `202608172200_PEA02rev2_Castedo_CLD.docx`.

    página        A4, margens 1134 twips = 20 mm; rodapé a 708 twips = 12,5 mm
    tipo          Calibri em todo o documento, sem excepção
    corpo         21 meios-pontos = 10,5 pt · rótulos 19 = 9,5 pt
    título        34 = 17 pt, #005CA9, centrado, negrito
    rodapé        17 = 8,5 pt
    bordas        single, w:sz 6 = 0,75 pt, cor #404040
    rótulos       sombreado #F2F2F2
    células       Planeamento #3AAA35 · Operações #005CA9 · Logística #E84E0F
    faixa         36 células alternadas #C00000 / #FFFFFF, 4 pt de altura

Uma correcção ao que eu próprio disse antes: a faixa vermelha e branca **está no
modelo** — são as tabelas 1 e 8, com trinta e seis células alternadas. Chamei-lhe
erro de renderização ao ver o PDF e estava errado.

  A  Página: margem de 20 mm, e Calibri como tipo de letra da impressão. Carlito é o
     recurso livre com as mesmas métricas, para quem imprimir de um posto sem Calibri.
  B  Cada bloco de célula ganha a linha de título colorida que o modelo tem e que
     faltava: verde, azul e laranja, com o nome da célula em branco.
  C  Rodapé de página a sério, repetido em todas as folhas: identificação da ocorrência
     à esquerda, «Este documento tem carácter: RESERVADO» à direita. Sai da posição
     onde estava — o modelo não tem essa linha no cabeçalho — e passa a acompanhar
     cada página, como no documento aceite.
  D  Medidas do corpo, das bordas e dos sombreados alinhadas com o modelo.
  E  A faixa passa a ter as 36 células do modelo, em vez de 28.

Fica por resolver, e não se resolve em CSS: o cabeçalho e o rodapé que o browser
imprime por cima destes. Só a geração de PDF própria os elimina — e essa é peça à
parte, não uma folha de estilo.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0057.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0058.html"

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
# A + C + D — página, tipo de letra, rodapé e medidas
# ═══════════════════════════════════════════════════════════════════
troca(
    '@media print{',
    '''@media print{
  /* ── modelo .docx aceite: A4, margens de 20 mm, Calibri em todo o documento ──
     Carlito tem as métricas do Calibri e é o recurso para postos que não o tenham. */
  @page{size:A4;margin:20mm 20mm 22mm 20mm}
  .paper, .paper *{font-family:Calibri,Carlito,"Liberation Sans",sans-serif!important}
  .paper{font-size:10.5pt!important;line-height:1.35!important;color:#1A1A1A!important;background:#fff!important}

  /* título: 17 pt, azul do modelo, centrado */
  .paper .p-tit{font-size:17pt!important;color:#005CA9!important;font-weight:700!important;text-align:center!important;margin:0 0 4pt!important;letter-spacing:0!important}
  .paper .p-sub{font-size:10.5pt!important;color:#1A1A1A!important;font-weight:700!important;text-align:center!important;margin:0 0 2pt!important}
  .paper .p-sub2{font-size:10.5pt!important;color:#404040!important;font-weight:400!important;text-align:center!important;margin:0 0 6pt!important}
  .paper .p-apr{font-size:10.5pt!important;text-align:right!important;margin:0 0 6pt!important}

  /* faixa: 36 células alternadas, 4 pt de altura */
  .paper .hz{display:flex!important;height:4pt!important;margin:6pt 0!important;gap:0!important;background:none!important}
  .paper .hz i{flex:1 1 0!important;background:#C00000!important;height:4pt!important;display:block!important}
  .paper .hz i:nth-child(even){background:#fff!important}

  /* tabelas de cabeçalho: bordas de 0,75 pt em #404040, rótulos sombreados */
  .paper table{width:100%!important;border-collapse:collapse!important;margin:0 0 6pt!important;font-size:10.5pt!important}
  .paper .p-cab td, .paper .p-pco td{border:0.75pt solid #404040!important;padding:3pt 5pt!important;vertical-align:middle!important}
  .paper .p-cab td.l, .paper .p-pco td.cz{background:#F2F2F2!important;font-weight:700!important}
  .paper .p-pco td.azul{background:#005CA9!important;color:#fff!important;font-weight:700!important;text-align:center!important}

  /* blocos de célula: linha de título colorida, faixa vertical, rótulo e conteúdo */
  .paper .cel{display:grid!important;grid-template-columns:10mm 1fr!important;margin:0 0 8pt!important;break-inside:auto}
  .paper .cel-tit{grid-column:1/-1!important;display:block!important;font-size:12pt!important;font-weight:700!important;color:#fff!important;
    padding:3pt 6pt!important;margin:0!important;border:0.75pt solid #404040!important;border-bottom:none!important;
    break-after:avoid-page;page-break-after:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .paper .cel.pl .cel-tit{background:#3AAA35!important}
  .paper .cel.op .cel-tit{background:#005CA9!important}
  .paper .cel.lg .cel-tit{background:#E84E0F!important}
  .paper .cel-corpo{display:flex!important;align-items:stretch!important}
  .paper .cel-v{grid-column:1!important;display:flex!important;width:auto!important;writing-mode:initial!important;
    flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;
    border:0.75pt solid #404040!important;border-right:none!important;padding:3pt 0!important;
    font-size:8pt!important;font-weight:700!important;letter-spacing:0!important;line-height:1.25!important;
    text-align:center!important;color:#404040!important;background:#fff!important}
  /* No modelo as letras da faixa ficam empilhadas, uma por linha. O `letrasV()`
     separa-as por <br>: esconder o <br> achatava a coluna e o texto transbordava
     por cima do rótulo. Os <br> ficam; o espaço entre palavras é um vão. */
  .paper .cel-v br{display:block!important}
  .paper .cel-v span{display:block!important;width:auto!important;height:4pt!important}
  .paper .cel-body{grid-column:2!important;border:0.75pt solid #404040!important}
  .paper .cel-row{display:flex!important;border-bottom:0.75pt solid #404040!important;break-inside:avoid;page-break-inside:avoid}
  .paper .cel-row:last-child{border-bottom:none!important}
  .paper .cel-lab{flex:0 0 26mm!important;background:#F2F2F2!important;font-size:9.5pt!important;font-weight:700!important;
    padding:3pt 5pt!important;border-right:0.75pt solid #404040!important;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}
  .paper .cel-con{flex:1 1 auto!important;padding:3pt 5pt!important;text-align:justify!important}

  /* tabela de missões e plano logístico */
  .paper .t-of th{background:#F2F2F2!important;font-size:9.5pt!important;font-weight:700!important;
    border:0.75pt solid #404040!important;padding:3pt 5pt!important;text-align:left!important}
  .paper .t-of td{border:0.75pt solid #404040!important;padding:3pt 5pt!important;vertical-align:top!important}

  /* rodapé de página, repetido em todas as folhas, como no modelo */
  .paper .p-rodape{position:fixed!important;bottom:0;left:0;right:0;display:flex!important;
    justify-content:space-between!important;font-size:8.5pt!important;color:#1A1A1A!important;
    padding-top:2pt!important}''',
    "A1 página, tipo, medidas e rodapé"
)

# ═══════════════════════════════════════════════════════════════════
# B — as linhas de título coloridas por célula
#
#     Insere-se o título; não se embrulha nada. O bloco passa a grelha, com o título a
#     ocupar as duas colunas e a faixa vertical e o corpo por baixo. Assim a estrutura
#     do HTML não muda e não há fecho de etiqueta a acertar.
# ═══════════════════════════════════════════════════════════════════
CELULAS_PAPEL = [
    ("vd", "pl", "Célula de Planeamento",                                "B1 planeamento"),
    ("az", "op", "Célula de Operações",                                  "B2 operações"),
    ("lr", "lg", "Célula de Logística e Finanças — Plano Logístico",     "B3 logística"),
]
for cls, marca, titulo, nome in CELULAS_PAPEL:
    i = s.index('class="cel-v ' + cls + '"')
    ini = s.rindex('<div class="cel">', 0, i)
    velho = s[ini:i]
    assert velho.count('<div class="cel">') == 1, nome
    s = s[:ini] + '<div class="cel ' + marca + '">\n      <div class="cel-tit">' + titulo + '</div>\n      ' + velho[len('<div class="cel">'):] + s[i:]
    N[0] += 1
    print("  ok  " + nome + " — título inserido")

# ═══════════════════════════════════════════════════════════════════
# C — rodapé de página, como no modelo
#
#     O modelo não tem a linha do RESERVADO no cabeçalho: tem-na no rodapé de página,
#     repetida em todas as folhas, com a identificação da ocorrência à esquerda. A
#     linha do cabeçalho sai e o rodapé entra.
# ═══════════════════════════════════════════════════════════════════
troca(
    '      <div class="p-sub2">Documento com carácter RESERVADO — SGO (Despacho n.º 4067/2024, de 15 de abril · DL n.º 90-A/2022)</div>\n',
    '',
    "C1 a linha do RESERVADO sai do cabeçalho"
)
troca(
    '      <div class="p-apr">Aprovado — O COS: ____________________</div>',
    '      <div class="p-sub2">${esc(p.meta.local||"")}${p.meta.pco? " · "+esc(p.meta.pco):""}</div>\n'
    '      <div class="p-apr">Aprovado — O COS: ____________________</div>\n'
    '      <div class="p-rodape"><span>PEA n.º ${p.n} — Ocorrência ${esc(p.meta.num||"")}${p.meta.local? " · "+esc(p.meta.local):""}</span>'
    '<span>Este documento tem carácter: RESERVADO</span></div>',
    "C2 rodapé de página e subtítulo do local"
)

# As duas faixas do modelo — a de abertura e a de fecho — passam de 28 para as 36
# células que as tabelas 1 e 8 do .docx têm.
n_faixas = s.count('${"<i></i>".repeat(28)}')
assert n_faixas == 2, "esperava as duas faixas do modelo, encontrei %d" % n_faixas
s = s.replace('${"<i></i>".repeat(28)}', '${"<i></i>".repeat(36)}')
N[0] += 1
print("  ok  E1 as duas faixas passam a 36 células")

# ═══════════════════════════════════════════════════════════════════
# F — a impressão saía em branco
#
#     Dívida do p0007, que arrumou a casa por células: a impressão marca `p-pea` como
#     alvo, e a arrumação mudou a vista do PEA para `p-planeamento`, deixando `p-pea`
#     vazio. O CSS esconde tudo menos o alvo, portanto imprimia-se uma folha em branco.
#     Não deu erro nenhum, o que é o pior modo de falhar.
# ═══════════════════════════════════════════════════════════════════
troca(
    '  $("p-pea").classList.add("print-target");',
    '  /* O alvo é o painel que contém a vista do PEA, não o identificador antigo:\n'
    '     depois da arrumação por células a vista vive em Planeamento. */\n'
    '  const vistaPEA = document.getElementById("pea-view");\n'
    '  const painelPEA = (vistaPEA && vistaPEA.closest(".pane")) || $("p-planeamento") || $("p-pea");\n'
    '  if(painelPEA) painelPEA.classList.add("print-target");',
    "F1 o alvo da impressão é o painel que tem a vista"
)
troca(
    '  $("pea-view").scrollIntoView({behavior:"smooth"});',
    '  if(vistaPEA) vistaPEA.scrollIntoView({behavior:"smooth"});',
    "F2 rolagem para a vista existente"
)
# na impressão, só o papel do painel alvo — o resto do painel de Planeamento fica fora
troca(
    '  .pane{display:none}.pane.print-target{display:block}',
    '  .pane{display:none}.pane.print-target{display:block}\n'
    '    /* dentro do painel alvo só o documento se imprime; os cartões de trabalho não */\n'
    '    .pane.print-target > .card, .pane.print-target > .help, .pane.print-target > .guia{display:none!important}\n'
    '    .pane.print-target #pea-view{display:block!important}',
    "F3 no painel alvo imprime-se só o documento"
)

# ── G · a caixa vermelha do objetivo não existe no modelo ────────────
#     No .docx o objetivo é uma linha de célula como as outras. A moldura vermelha é
#     do painel de ecrã, onde serve para o destacar; no documento oficial destoa.
troca(
    "  .paper .cel-con{flex:1 1 auto!important;padding:3pt 5pt!important;text-align:justify!important}",
    "  .paper .cel-con{flex:1 1 auto!important;padding:3pt 5pt!important;text-align:justify!important}\n"
    "  .paper .obj2{border:none!important;background:none!important;padding:0!important;color:#1A1A1A!important}\n"
    "  .paper .obj2 .al{color:#1A1A1A!important;font-weight:700!important}\n"
    "  /* tabela horária do meteograma sem dados: cabeçalho vazio não se imprime */\n"
    "  .paper table.t-of:not(:has(td)){display:none!important}",
    "G1 objetivo sem moldura e tabela vazia oculta"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s" % (N[0], DST))
