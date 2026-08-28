#!/usr/bin/env python3
"""
p0008 — o JavaScript passa a estar arrumado por célula do PCO
CSREPC Douro · Estação PEA · sem alteração à versão de estado

Os comentários de secção do ficheiro entregue são as fronteiras dos módulos de
`fonte/`: quem re-parte a entrega corta por eles, e a ordem dos nomes é a ordem de
montagem. Reagrupar as secções por célula é, portanto, o que faz `fonte/` passar a
ter `comando/`, `planeamento/`, `operacoes/`, `logistica/` e `turno/` — sem tocar em
nenhuma linha de código.

Duas coisas apareceram ao mapear função a função, e nenhuma se via na lista de secções:

  · `pcoObj`, `pcoDef`, `funcoesExigiveis`, `renderPCO` — a estrutura do posto de
    comando, art. 14.º — vivem dentro da secção «evolução». E o catálogo SIRESP e o
    plano de comunicações, art. 32.º, n.º 1, al. d), vivem lá também.
  · `logisticaObj`, `reservaObj` e `zaObj` vivem dentro do «construtor de setores».

Não são secções de subsistema mal escolhidas: são funções no sítio errado. Corrigem-se
partindo as secções nos pontos de fronteira, o que cria unidades móveis sem mover uma
única função.

  A  Nove cabeçalhos novos, a partir as três secções que conflaciam células.
  B  Reordenação em seis zonas: NÚCLEO, COMANDO, PLANEAMENTO, OPERAÇÕES, LOGÍSTICA,
     TURNO e ARRANQUE. Dentro de cada zona mantém-se a ordem relativa actual.
  C  Cabeçalhos passam a `CÉLULA · assunto`, que é o que dá o nome à pasta e ao módulo.

Verificação própria desta reestruturação: **nenhum byte de conteúdo pode mudar.** O
script confirma que o conjunto dos blocos, ordenado, é idêntico antes e depois. Só a
ordem e os cabeçalhos mudam. Uma reorganização que altere comportamento não é
reorganização — foi o método usado na correção 4.3, e é o certo aqui também.

Risco declarado: reordenar código de topo pode expor zona morta temporal, como já
sucedeu neste projeto com `VERSAO_ESTADO`. As zonas existem por isso: o núcleo, que
contém tudo o que corre no arranque, mantém-se primeiro e pela ordem que tinha.
"""
import io, re, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "real_r0036.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "real_r0037.html"

s = io.open(SRC, encoding="utf-8").read()
N = [0]

def troca(ancora, novo, nome):
    global s
    c = s.count(ancora)
    assert c == 1, "[%s] ancora encontrada %d vezes, esperava 1:\n%s" % (nome, c, ancora[:180])
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print("  ok  " + nome)

CAB = "/* ================= %s ================= */\n"

# ═══════════════════════════════════════════════════════════════════
# A — partir as secções que conflaciam células
# ═══════════════════════════════════════════════════════════════════
cortes = [
    ("function ptObj(){ return logisticaObj().pontoTransito; }",
     "acessores de estado por célula", "A1 acessores saem do construtor de setores"),
    ("function totSetor(x){",
     "setorização do teatro de operações", "A2 setorização passa a secção própria"),
    ("const FUNCOES_PCO = [",
     "estrutura do posto de comando", "A3 estrutura do PCO sai da evolução"),
    ('const PASTAS = {',
     "canais SIRESP e plano de comunicações", "A4 canais saem da evolução"),
    ("function descarregar(nome, texto, tipo){",
     "descarregar ficheiros", "A5 descarregar passa a secção própria"),
    ("function initCatalogo(){",
     "arranque do catálogo de canais", "A6 catálogo sai da exportação"),
    ("const NIVEL_ROT = {",
     "níveis de comunicações no teatro de operações", "A7 níveis passam a secção própria"),
    ("function parseGDH(s){",
     "leitura de GDH e nível DECIR", "A8 GDH e nível DECIR passam a secção própria"),
    ("function contarDispositivo(){",
     "contagem do dispositivo", "A9 contagem do dispositivo passa a secção própria"),
]
for anc, nome, rot in cortes:
    troca(anc, CAB % nome + anc, rot)

# ═══════════════════════════════════════════════════════════════════
# B + C — reordenar por célula e renomear os cabeçalhos
# ═══════════════════════════════════════════════════════════════════
ini = s.index("<script>") + len("<script>")
fim = s.rindex("</script>")
js = s[ini:fim]

partes = re.split(r'(?m)^/\* =+ (.*?) =+ \*/\n', js)
preambulo, blocos = partes[0], []
for i in range(1, len(partes), 2):
    blocos.append([partes[i], partes[i+1]])
print("\n  %d secções encontradas" % len(blocos))

# nome actual -> (zona, assunto). A ordem dentro de cada zona é a ordem desta lista.
PLANO = [
 # ---- NÚCLEO: tudo o que corre no arranque, pela ordem que tinha ----
 ("armazenamento (Claude -> localStorage -> memória)", "NÚCLEO", "armazenamento"),
 ("estado",                                            "NÚCLEO", "estado"),
 ("versão do estado gravado",                          "NÚCLEO", "versão do estado gravado"),
 ("passagem de turno",                                 "NÚCLEO", "modelo de células e turno"),
 ("persistência",                                      "NÚCLEO", "persistência"),
 ("coordenadas: conversões WGS84 (decimal · GMD · GMS)","NÚCLEO", "coordenadas WGS84"),
 ("construtor de setores (art. 5.º — referência alfabética)", "NÚCLEO", "catálogo DECIR e estados de setor"),
 ("acessores de estado por célula",                    "NÚCLEO", "acessores de estado por célula"),
 ("rede",                                              "NÚCLEO", "rede"),
 ("relógio",                                           "NÚCLEO", "relógio"),
 ("leitura de GDH e nível DECIR",                      "NÚCLEO", "leitura de GDH e nível DECIR"),
 ("descarregar ficheiros",                             "NÚCLEO", "descarregar ficheiros"),
 ("verificação de dados",                              "NÚCLEO", "arrumação da casa e guia de preenchimento"),
 ("navegação",                                         "NÚCLEO", "navegação"),
 # ---- COMANDO: arts. 14.º e 15.º ----
 ("estrutura do posto de comando",                     "COMANDO", "estrutura do posto de comando (art. 14.º)"),
 ("registo de regras de conformidade",                 "COMANDO", "registo de regras de conformidade"),
 ("exportação e importação da ocorrência",             "COMANDO", "exportação e importação da ocorrência"),
 # ---- PLANEAMENTO: arts. 26.º a 30.º ----
 ("geocodificação (Open-Meteo → Nominatim → modelo)",  "PLANEAMENTO", "geocodificação (art. 28.º)"),
 ("perímetro GeoJSON: área estimada",                  "PLANEAMENTO", "perímetro e área da ZI (art. 28.º)"),
 ("relevo automático (Open-Meteo Elevation)",          "PLANEAMENTO", "relevo e perfil de elevação (art. 28.º)"),
 ("comportamento do fogo: declive e vento",            "PLANEAMENTO", "comportamento do fogo (art. 29.º)"),
 ("meteo",                                             "PLANEAMENTO", "meteorologia (art. 29.º)"),
 ("meteograma profissional (SVG, sem bibliotecas)",    "PLANEAMENTO", "meteograma"),
 ("meteo automática (Open-Meteo por coordenadas)",     "PLANEAMENTO", "meteorologia automática"),
 ("avisos IPMA por distrito do TO",                    "PLANEAMENTO", "avisos IPMA (art. 28.º)"),
 ("chamada ao modelo",                                 "PLANEAMENTO", "elaboração assistida do PEA (art. 27.º, al. a))"),
 ("fallback determinístico completo",                  "PLANEAMENTO", "elaboração determinística do PEA"),
 ("emitir PEA",                                        "PLANEAMENTO", "emissão do PEA (art. 46.º)"),
 # ---- OPERAÇÕES: arts. 16.º a 25.º ----
 ("setorização do teatro de operações",                "OPERAÇÕES", "setorização do TO (art. 17.º, al. d))"),
 ("contagem do dispositivo",                           "OPERAÇÕES", "contagem do dispositivo (art. 17.º, al. a))"),
 ("meios aéreos nominais",                             "OPERAÇÕES", "meios aéreos (art. 19.º)"),
 ("evolução: contexto e inserção rápida",              "OPERAÇÕES", "evolução: contexto e inserção rápida"),
 ("evolução",                                          "OPERAÇÕES", "evolução e POSIT (art. 17.º, al. a))"),
 # ---- LOGÍSTICA E FINANÇAS: arts. 31.º a 35.º ----
 ("canais SIRESP e plano de comunicações",             "LOGÍSTICA", "canais SIRESP (art. 34.º)"),
 ("arranque do catálogo de canais",                    "LOGÍSTICA", "arranque do catálogo de canais"),
 ("níveis de comunicações no teatro de operações",     "LOGÍSTICA", "plano de comunicações (art. 32.º, al. d))"),
 ("quadro de tempos e rendições",                      "LOGÍSTICA", "tempos de empenhamento e rendições (art. 33.º)"),
 # ---- TURNO: DON n.º 2, ponto 7.d.(30) ----
 ("briefing de passagem de comando",                   "TURNO", "briefing de passagem de comando"),
 ("passagem de turno — motor",                         "TURNO", "passagem de turno"),
 # ---- ARRANQUE ----
 ("render geral",                                      "ARRANQUE", "render geral"),
 ("demo",                                              "ARRANQUE", "exemplo de demonstração"),
 ("eventos",                                           "ARRANQUE", "ligação de eventos"),
]

nomes_ficheiro = set(b[0] for b in blocos)
nomes_plano = set(p[0] for p in PLANO)
faltam = nomes_ficheiro - nomes_plano
sobram = nomes_plano - nomes_ficheiro
assert not faltam, "secções no ficheiro sem lugar no plano: %s" % sorted(faltam)
assert not sobram, "secções no plano que não existem no ficheiro: %s" % sorted(sobram)
assert len(blocos) == len(PLANO), "%d secções, %d entradas no plano" % (len(blocos), len(PLANO))

por_nome = {b[0]: b[1] for b in blocos}
novo_js = [preambulo]
zona_anterior = None
for nome, zona, assunto in PLANO:
    if zona != zona_anterior:
        novo_js.append("\n/* ██████ %s ██████ */\n" % zona)
        zona_anterior = zona
    novo_js.append(CAB % (zona + " · " + assunto))
    novo_js.append(por_nome[nome])
novo_js = "".join(novo_js)

# verificação própria: nenhum byte de conteúdo mudou, só a ordem e os cabeçalhos
# os marcadores de zona são cabeçalhos, não conteúdo: saem antes de comparar
limpo = re.sub(r'(?m)^\n?/\* \u2588+ .*? \u2588+ \*/\n', '', novo_js)
antes = sorted(b[1] for b in blocos)
depois = sorted(re.split(r'(?m)^/\* =+ .*? =+ \*/\n', limpo)[1:])
if antes != depois:
    só_antes = [x for x in antes if x not in depois]
    só_depois = [x for x in depois if x not in antes]
    raise AssertionError("o conteúdo mudou em %d bloco(s):\n  antes: %r\n  depois: %r"
        % (len(só_antes), (só_antes[:1] or [""])[0][:200], (só_depois[:1] or [""])[0][:200]))
print("  ok  conteúdo idêntico: %d blocos, só a ordem e os cabeçalhos mudaram" % len(antes))

s = s[:ini] + novo_js + s[fim:]
io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d cortes + reordenação · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
