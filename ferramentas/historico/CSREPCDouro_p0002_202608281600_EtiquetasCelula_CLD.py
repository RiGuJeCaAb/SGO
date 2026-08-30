#!/usr/bin/env python3
"""
p0002 — etiquetas de célula na renderização do PEA        r0023 -> r0024
CSREPC Douro · Estação PEA

Achado em QA visual do p0001: o modelo de dados passou a repartir o PEA pela
fronteira do Despacho n.º 4067/2024, mas as etiquetas impressas ficaram a dizer o
contrário. As medidas de segurança e as prioridades táticas apareciam sob "Célula
de Operações", quando o art. 27.º, n.º 1, al. a) põe o plano estratégico de ação
inteiro na célula de planeamento. A etiqueta "Célula de Operações · Proposta de
planeamento" era, além de errada, autocontraditória.

Correções:
  E1  Segurança das forças  -> Célula de Planeamento (art. 27.º, n.º 1, al. a))
  E2  Prioridades táticas   -> Célula de Planeamento (deixa de ser "proposta de planeamento")
  E3  Organização do TO     -> mantém-se em Operações (art. 17.º, n.º 1, als. a), b) e d)),
                               mas deixa de imprimir cabeçalho sem conteúdo
  E4  Ordens de missão      -> passa a declarar a célula e a base legal (art. 17.º, n.º 1, al. c))
  E5  Formato oficial: a barra vertical das células passa a acompanhar a repartição real
"""
import io

SRC = "r0023.html"
DST = "r0024.html"

s = io.open(SRC, encoding="utf-8").read()
N = [0]

def troca(ancora, novo, nome):
    global s
    c = s.count(ancora)
    assert c == 1, "[%s] ancora encontrada %d vezes, esperava 1:\n%s" % (nome, c, ancora[:170])
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print("  ok  " + nome)

# ── E3 · Organização do TO: só imprime se houver setores ─────────────
troca(
    '        <div class="pd pd-ops"><span class="pt">Célula de Operações · <b>Organização do TO</b></span>${setoresDash}</div>',
    '        ${setoresDash? `<div class="pd pd-ops"><span class="pt">Célula de Operações · <b>Organização do TO</b></span>${setoresDash}</div>`:""}',
    "E3 organização do TO sem cabeçalho vazio"
)

# ── E1 · Segurança das forças pertence ao plano ──────────────────────
troca(
    '''        <div class="pd pd-ops"><span class="pt">Célula de Operações · <b>Segurança das forças</b></span>
          <div class="pd-body"><div class="pd-in">${(ops.seguranca||[]).map(x=>`<p>${esc(x)}</p>`).join("")}</div></div>
        </div>''',
    '''        <div class="pd pd-plan"><span class="pt">Célula de Planeamento · <b>Segurança das forças</b></span>
          <div class="pd-body"><div class="pd-in">${(plan.seguranca||[]).map(x=>`<p>${esc(x)}</p>`).join("")}</div></div>
        </div>''',
    "E1 segurança das forças -> planeamento"
)

# ── E2 · Prioridades táticas pertencem ao plano ──────────────────────
troca(
    '''        <div class="pd pd-ops"><span class="pt">Célula de Operações · <b>Proposta de planeamento</b></span>
          ${(ops.propostas||[]).map(x=>`<div class="pd-p"><span class="pid">${esc(x.id)}</span>${esc(x.texto)}<span class="fund">Fundamento: ${esc(x.fundamento||"")}</span></div>`).join("")}
        </div>''',
    '''        <div class="pd pd-plan"><span class="pt">Célula de Planeamento · <b>Prioridades táticas</b></span>
          ${(plan.propostas||[]).map(x=>`<div class="pd-p"><span class="pid">${esc(x.id)}</span>${esc(x.texto)}<span class="fund">Fundamento: ${esc(x.fundamento||"")}</span></div>`).join("")}
        </div>''',
    "E2 prioridades táticas -> planeamento"
)

# ── E5 · formato oficial impresso: a barra de célula tem de dizer a verdade ──
# O bloco de planeamento absorve prioridades, objetivo e segurança; o de operações
# fica com a organização do TO e ganha as ordens de missão, que estavam soltas.
troca(
    '''          <div class="cel-row"><div class="cel-lab">Previsão</div><div class="cel-con">
            <p>${esc(plan.previsao||"")}</p>
            <table class="t-of"><tr><th>GDH</th><th>T °C</th><th>HR %</th><th>Vento</th><th>km/h</th><th>mm</th></tr>${linhas}</table>
          </div></div>
        </div>
      </div>''',
    '''          <div class="cel-row"><div class="cel-lab">Previsão</div><div class="cel-con">
            <p>${esc(plan.previsao||"")}</p>
            <table class="t-of"><tr><th>GDH</th><th>T °C</th><th>HR %</th><th>Vento</th><th>km/h</th><th>mm</th></tr>${linhas}</table>
          </div></div>
          <div class="cel-row"><div class="cel-lab">Objetivo</div><div class="cel-con"><div class="obj2"><span class="al">Objetivo:</span> ${esc(plan.objetivo||"")}</div></div></div>
          <div class="cel-row"><div class="cel-lab">Prioridades táticas</div><div class="cel-con">
            ${(plan.propostas||[]).map(x=>`<p><span class="pid2">${esc(x.id)}</span> — ${esc(x.texto)} <span class="fund2">Fundamento: ${esc(x.fundamento||"")}</span></p>`).join("")}
          </div></div>
          <div class="cel-row"><div class="cel-lab">Segurança das forças</div><div class="cel-con">
            ${(plan.seguranca||[]).map(x=>`<p>• ${esc(x)}</p>`).join("")}
          </div></div>
        </div>
      </div>''',
    "E5a planeamento absorve objetivo, prioridades e segurança"
)
troca(
    '''      <div class="cel">
        <div class="cel-v az">${letrasV("CÉLULA DE OPERAÇÕES")}</div>
        <div class="cel-body">
          <div class="cel-row"><div class="cel-lab">Organização do TO</div><div class="cel-con">${setoresHTML}</div></div>
          <div class="cel-row"><div class="cel-lab">Proposta de planeamento</div><div class="cel-con">
            ${(ops.propostas||[]).map(x=>`<p><span class="pid2">${esc(x.id)}</span> — ${esc(x.texto)} <span class="fund2">Fundamento: ${esc(x.fundamento||"")}</span></p>`).join("")}
          </div></div>
          <div class="cel-row"><div class="cel-lab">Objetivo</div><div class="cel-con"><div class="obj2"><span class="al">Objetivo:</span> ${esc(ops.objetivo||"")}</div></div></div>
          <div class="cel-row"><div class="cel-lab">Segurança das forças</div><div class="cel-con">
            ${(ops.seguranca||[]).map(x=>`<p>• ${esc(x)}</p>`).join("")}
          </div></div>
        </div>
      </div>''',
    '''      <div class="cel">
        <div class="cel-v az">${letrasV("CÉLULA DE OPERAÇÕES")}</div>
        <div class="cel-body">
          <div class="cel-row"><div class="cel-lab">Organização do TO</div><div class="cel-con">${setoresHTML}</div></div>
          <div class="cel-row"><div class="cel-lab">Ordens de missão</div><div class="cel-con">
            <table class="t-of"><tr><th style="width:14%"></th><th>Missão</th><th style="width:22%">Atribuída a</th><th style="width:14%">Até (GDH)</th></tr>${missoesHTML}</table>
          </div></div>
        </div>
      </div>''',
    "E5b operações fica com organização do TO e ordens de missão"
)
# a tabela de missões deixa de andar solta entre os blocos de célula
troca(
    '''      <table class="t-of"><tr><th style="width:14%"></th><th>Missão</th><th style="width:22%">Atribuída a</th><th style="width:14%">Até (GDH)</th></tr>${missoesHTML}</table>

      <div class="cel">
        <div class="cel-v lr">${letrasV("LOGÍSTICA E FINANÇAS")}</div>''',
    '''      <div class="cel">
        <div class="cel-v lr">${letrasV("LOGÍSTICA E FINANÇAS")}</div>''',
    "E5c remove a tabela de missões solta"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s" % (N[0], DST))
