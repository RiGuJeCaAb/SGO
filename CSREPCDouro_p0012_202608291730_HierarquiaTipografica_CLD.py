#!/usr/bin/env python3
"""
p0012 — hierarquia tipográfica: parar de gritar tudo ao mesmo volume
CSREPC Douro · Estação PEA · sem alteração ao comportamento

Trinta e cinco declarações de `text-transform:uppercase`. O rótulo do campo mais
importante da aplicação — o número da ocorrência, de que dependem os noventa minutos,
o arquivo e o cruzamento de tudo o resto — tem exactamente o mesmo tratamento que
«Pasta (localização de arquivo)». E um sub-título como «Setorização do TO e quadro de
meios (arts. 5.º e 32.º — tipologias do Anexo 1 da DON n.º 2 / DECIR 2026)» tem noventa
caracteres em maiúsculas.

Maiúsculas destroem a forma da palavra, que é como se lê de relance. A um rótulo de
duas palavras isso custa pouco e paga em ordem visual; a noventa caracteres deixa de
ser título e passa a ser obstáculo.

O texto no HTML já está em caixa de frase — «Ocorrência n.º», «Local (freguesia —
concelho)». As maiúsculas são só CSS, o que torna isto barato e reversível.

  A  Rótulos de campo em caixa de frase, com o espaçamento de letra reduzido em
     proporção. Continuam a distinguir-se do valor pelo peso e pela cor, não pela caixa.
  B  Sub-títulos de bloco em caixa de frase, que é onde estavam as cadeias longas.
  C  As citações da norma recuam. São o maior activo da aplicação e estavam a competir
     com o conteúdo em todas as superfícies: passam a peso menor e cor mais discreta,
     sempre presentes e nunca em primeiro plano.
  D  O campo âncora de cada cartão ganha destaque. `campo-chave` marca o campo de que
     o resto do cartão depende; sem ele o cartão não serve para nada, e isso devia
     ver-se antes de se ler.
  E  As maiúsculas ficam onde ganham: nos níveis dos avisos e nos rótulos de dados
     monoespaçados, que são etiquetas curtas e não frases.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0055.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0056.html"

s = io.open(SRC, encoding="utf-8").read()
N = [0]

def troca(ancora, novo, nome):
    global s
    c = s.count(ancora)
    assert c == 1, "[%s] ancora encontrada %d vezes, esperava 1:\n%s" % (nome, c, ancora[:170])
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print("  ok  " + nome)

# ═══════════════════════════════════════════════════════════════════
# A — rótulos de campo
# ═══════════════════════════════════════════════════════════════════
troca(
    '  label{display:block;font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--tx2);margin-bottom:7px}',
    '''  /* Caixa de frase. O rótulo distingue-se do valor pelo peso e pela cor; a caixa alta
     custava a forma da palavra sem dar nada em troca. O espaçamento de letra desce em
     proporção, porque só era preciso para abrir as maiúsculas. */
  label{display:block;font-size:12.5px;font-weight:600;letter-spacing:.1px;color:var(--tx2);margin-bottom:7px}''',
    "A1 rótulos de campo em caixa de frase"
)

# ═══════════════════════════════════════════════════════════════════
# B — sub-títulos de bloco
# ═══════════════════════════════════════════════════════════════════
troca(
    '  .sub .stit{display:block;font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--tx2);margin-bottom:12px}',
    '''  /* Aqui é que doía: alguns destes sub-títulos passam dos noventa caracteres, com a
     referência legal incluída. Em caixa alta deixavam de ser título. */
  .sub .stit{display:block;font-family:var(--disp);font-size:13.5px;font-weight:700;letter-spacing:.15px;color:var(--tx);margin-bottom:12px}''',
    "B1 sub-títulos em caixa de frase"
)

# ═══════════════════════════════════════════════════════════════════
# C — as citações da norma recuam
# ═══════════════════════════════════════════════════════════════════
troca(
    '.card h2 .tag{font-family:var(--mono);font-size:10px;font-weight:400;color:var(--tx3);border:1px solid var(--line);padding:2px 7px;border-radius:5px;letter-spacing:.5px}',
    '''  /* A citação da norma é o que sustenta a aplicação e estava a competir com o
     conteúdo em todas as superfícies. Fica sempre presente e nunca em primeiro plano:
     ao passar o rato, ou ao focar o cartão, volta à força plena. */
.card h2 .tag{font-family:var(--mono);font-size:10px;font-weight:400;color:var(--tx3);border:1px solid var(--line);padding:2px 7px;border-radius:5px;letter-spacing:.5px;opacity:.62;transition:opacity .12s}
  .card:hover h2 .tag, .card:focus-within h2 .tag, .card h2 .tag:hover{opacity:1}''',
    "C1 citações da norma recuam"
)

# ═══════════════════════════════════════════════════════════════════
# D — o campo âncora de cada cartão
# ═══════════════════════════════════════════════════════════════════
troca(
    '  .hint{font-size:13px;color:var(--tx3);margin-top:6px}',
    '''  .hint{font-size:13px;color:var(--tx3);margin-top:6px}
  /* Campo âncora: aquele de que o resto do cartão depende. O número da ocorrência
     ancora os noventa minutos e o arquivo; o local ancora as coordenadas, a meteorologia
     e os avisos do distrito. Sem eles o cartão não serve, e isso deve ver-se antes de
     se ler. Marca-se com a cor da célula, que já é a linguagem da casa. */
  .campo-chave > label{font-size:13.5px;font-weight:700;color:var(--tx)}
  .campo-chave > input, .campo-chave > select{font-size:16px;font-weight:600;
    border-color:var(--linha-chave,var(--line));box-shadow:inset 2px 0 0 var(--c-chave,var(--agua))}
  .campo-chave > input:focus, .campo-chave > select:focus{box-shadow:inset 2px 0 0 var(--c-chave,var(--agua)), 0 0 0 3px var(--foco,rgba(107,166,232,.22))}
  #p-comando .campo-chave{--c-chave:var(--cel-comando)}
  #p-planeamento .campo-chave{--c-chave:var(--cel-planeamento)}
  #p-operacoes .campo-chave{--c-chave:var(--cel-operacoes)}
  #p-logistica .campo-chave{--c-chave:var(--cel-logistica)}
  #p-turno .campo-chave{--c-chave:var(--cel-turno)}''',
    "D1 estilo do campo âncora"
)

# marcar os campos âncora, um por cartão onde faz sentido
ANCORAS = [
    ('<div><label for="o-num">Ocorrência n.º</label>',
     '<div class="campo-chave"><label for="o-num">Ocorrência n.º</label>', "D2 número da ocorrência"),
    ('<div><label for="o-local">Local (freguesia — concelho)</label>',
     '<div class="campo-chave"><label for="o-local">Local (freguesia — concelho)</label>', "D3 local da ocorrência"),
    ('<div><label for="tn-eq">Designação da equipa</label>',
     '<div class="campo-chave"><label for="tn-eq">Designação da equipa</label>', "D4 equipa de turno"),
]
for a, b, nome in ANCORAS:
    troca(a, b, nome)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))

import re
resta = len(re.findall(r'text-transform:uppercase', s))
print("  maiúsculas forçadas restantes: %d (eram 35) — ficam nos níveis de aviso e nas etiquetas monoespaçadas curtas" % resta)
