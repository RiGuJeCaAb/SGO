#!/usr/bin/env python3
"""
p0010 — a numeração das secções morreu com a arrumação por células
CSREPC Douro · Estação PEA · sem alteração ao comportamento

Dívida do p0007, que arrumou a casa em cinco separadores por célula e deixou pelo
caminho quarenta e sete referências a «secção 1», «secção 2», «secção 5» — a
numeração do fluxo de trabalho anterior. O painel de Operações diz hoje ao operador
«Define os setores na secção 2» e a secção 2 já não existe.

É pior do que feio: é a aplicação a mandar alguém para um sítio que não há.

Nada disto é substituir-todos. A mesma «secção 2» é Operações quando fala de setores
e Logística quando fala do ponto de trânsito; a «secção 3» é Comando quando fala de
nomeações e Logística quando fala de canais. Três referências não são da app — são
das secções do documento do contrato de interoperação, e ficam como estão.

  A  Bloco AV_DESTINO: os rótulos dos botões de aviso, dez de uma vez.
  B  Determinações das regras de conformidade, que é onde a numeração fazia mais dano:
     são o texto que diz ao COS o que fazer.
  C  Mensagens de estado e vazios.
  D  Comentários do código.

Os destinos (`irPara("p-occ")` e afins) não mudam: a tabela de atalhos do p0007 já os
traduz para o painel da célula. Só os rótulos estavam a mentir.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0053.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0054.html"

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
# A — rótulos dos botões de aviso
# ═══════════════════════════════════════════════════════════════════
troca(
    '''const AV_DESTINO = {
  ata:{p:"p-pea", l:"Ir à secção 6 · PEA"},
  posit:{p:"p-evo", l:"Registar POSIT na secção 4"},
  copart:{p:"p-pco", l:"Nomear na secção 3"},
  coparar:{p:"p-pco", l:"Nomear na secção 3"},
  copesp:{p:"p-pco", l:"Nomear na secção 3"},
  pt:{p:"p-fontes", l:"Definir na secção 2"},
  vigor:{p:"p-pea", l:"Ver o PEA em vigor na secção 6"},
  fase:{p:"p-occ", l:"Rever a fase na secção 1"},
  notif:{p:"p-fita", l:"Registar confirmação na fita do tempo"},
  pmepc:{p:"p-evo", l:"Registar o pedido na secção 4"},
  pco:{p:"p-pco", l:"Nomear na secção 3"},
  placom:{p:"p-pco", l:"Atribuir canais na secção 3"},
  reparticao:{p:"p-fontes", l:"Ver o dispositivo em Operações"}
};''',
    '''/* Os destinos continuam a ser os identificadores antigos: a tabela de atalhos
   traduz-os para o painel da célula. Só os rótulos precisavam de deixar de mentir. */
const AV_DESTINO = {
  ata:{p:"p-pea", l:"Elaborar o PEA em Planeamento"},
  posit:{p:"p-evo", l:"Registar POSIT em Operações"},
  copart:{p:"p-pco", l:"Nomear em Comando"},
  coparar:{p:"p-pco", l:"Nomear em Comando"},
  copesp:{p:"p-pco", l:"Nomear em Comando"},
  pt:{p:"p-logistica", l:"Definir em Logística e Finanças"},
  vigor:{p:"p-pea", l:"Ver o PEA em vigor em Planeamento"},
  fase:{p:"p-occ", l:"Rever a fase em Comando"},
  notif:{p:"p-fita", l:"Registar confirmação na fita do tempo"},
  pmepc:{p:"p-evo", l:"Registar o pedido em Operações"},
  pco:{p:"p-pco", l:"Nomear em Comando"},
  placom:{p:"p-logistica", l:"Atribuir canais em Logística e Finanças"},
  reparticao:{p:"p-fontes", l:"Ver o dispositivo em Operações"}
};''',
    "A1 rótulos dos botões de aviso"
)

# ═══════════════════════════════════════════════════════════════════
# B — determinações das regras de conformidade
# ═══════════════════════════════════════════════════════════════════
DETERMINACOES = [
    ('a:"Registar o ponto de situação na secção 4 com o tipo POSIT',
     'a:"Registar o ponto de situação em Operações com o tipo POSIT', "B1 POSIT ao CSREPC"),
    ('a:"Transmitir POSIT imediato ao CSREPC e registá-lo na secção 4.',
     'a:"Transmitir POSIT imediato ao CSREPC e registá-lo em Operações.', "B2 POSIT imediato"),
    ('sem indicativo de chamada nem hora de entrada registados na secção 2',
     'sem indicativo de chamada nem hora de entrada registados em Operações', "B3 meios aéreos sem indicativo"),
    ('a:"Nomear o COPAR-T e registar a nomeação na secção 3, com nome',
     'a:"Nomear o COPAR-T e registar a nomeação em Comando, com nome', "B4 nomeação do COPAR-T"),
    ('"Indicar o responsável e o contacto do ponto de trânsito na secção 2."',
     '"Indicar o responsável e o contacto do ponto de trânsito em Logística e Finanças."', "B5 responsável do ponto de trânsito"),
    ('a:"Definir a localização e o responsável do ponto de trânsito na secção 2 —',
     'a:"Definir a localização e o responsável do ponto de trânsito em Logística e Finanças —', "B6 localização do ponto de trânsito"),
    ('da fase "+O.meta.fase+" declarada na secção 1."',
     'da fase "+O.meta.fase+" declarada em Comando."', "B7 fase declarada"),
    ('a:"Registar na secção 3 quem ocupa cada função, com entidade',
     'a:"Registar em Comando quem ocupa cada função, com entidade', "B8 estrutura do PCO"),
    ('a:"Atribuir o canal de comando e os canais táticos na secção 3 e difundi-los',
     'a:"Atribuir o canal de comando e os canais táticos em Logística e Finanças e difundi-los', "B9 canal de comando"),
    ('a:"Atribuir canal de manobra a cada setor na secção 3 e confirmar',
     'a:"Atribuir canal de manobra a cada setor em Logística e Finanças e confirmar', "B10 canal de manobra"),
    ('a:"Ativar o nível na secção 3 e atribuir os canais correspondentes',
     'a:"Ativar o nível em Logística e Finanças e atribuir os canais correspondentes', "B11 nível de comunicações"),
    ('a:"Atribuir canais distintos a cada nível na secção 3 e difundir a correção',
     'a:"Atribuir canais distintos a cada nível em Logística e Finanças e difundir a correção', "B12 canais distintos"),
    ('a:"Registar na secção 3 a frequência do ar atribuída à ocorrência',
     'a:"Registar em Logística e Finanças a frequência do ar atribuída à ocorrência', "B13 frequência aérea"),
    ('a:"Emitir a revisão do PEA na secção 6 e submetê-la à aprovação',
     'a:"Emitir a revisão do PEA em Planeamento e submetê-la à aprovação', "B14 revisão do PEA"),
    ('a:"Emitir a revisão do PEA na secção 6, incorporando as alterações',
     'a:"Emitir a revisão do PEA em Planeamento, incorporando as alterações', "B15 revisão por divergência"),
]
for a, b, nome in DETERMINACOES:
    troca(a, b, nome)

# ═══════════════════════════════════════════════════════════════════
# C — mensagens de estado e vazios
# ═══════════════════════════════════════════════════════════════════
MENSAGENS = [
    ('O cruzamento relevo × vento aparece na análise da secção 5: horas',
     'O cruzamento relevo × vento aparece na análise de Planeamento: horas', "C1 cruzamento relevo-vento"),
    ('"Dados obrigatórios completos — podes emitir a proposta de PEA na secção 6."',
     '"Dados obrigatórios completos — podes emitir a proposta de PEA em Planeamento."', "C2 dados completos"),
    ('$("t-relevo-info").textContent="Sem coordenadas na secção 1 — preenche-as primeiro.";',
     '$("t-relevo-info").textContent="Sem coordenadas na ocorrência — preenche-as em Comando.";', "C3 relevo sem coordenadas"),
    ('info.textContent = "Sem coordenadas na secção 1 nem origem indicada.";',
     'info.textContent = "Sem coordenadas em Comando nem origem indicada.";', "C4 perfil sem origem"),
    ('$("pt-info").textContent="Sem coordenadas na secção 1.";',
     '$("pt-info").textContent="Sem coordenadas na ocorrência — preenche-as em Comando.";', "C5 ponto de trânsito sem coordenadas"),
    ('$("sens-info").textContent="Sem coordenadas na secção 1.";',
     '$("sens-info").textContent="Sem coordenadas na ocorrência — preenche-as em Comando.";', "C6 sensíveis sem coordenadas"),
    ('"Sem coordenadas na ocorrência — preenche-as na secção 1 (a app leva-te lá).";',
     '"Sem coordenadas na ocorrência — preenche-as em Comando (a app leva-te lá).";', "C7 meteo sem coordenadas"),
    ('o cruzamento com a previsão horária está na secção 5.";',
     'o cruzamento com a previsão horária está em Planeamento.";', "C8 previsão horária"),
    ('cruza este perfil com a previsão de vento na secção 5 antes de fixar o eixo',
     'cruza este perfil com a previsão de vento em Planeamento antes de fixar o eixo', "C9 perfil e eixo de esforço"),
    ('nota:"sem previsão carregada — secção 5 por preencher;',
     'nota:"sem previsão carregada — meteorologia por preencher em Planeamento;', "C10 previsão em falta no PEA"),
    ('style="margin:0">Sem coordenadas na secção 1.</span>',
     'style="margin:0">Sem coordenadas na ocorrência — preenche-as em Comando.</span>', "C11 avisos IPMA"),
    ('<span class="hint">Define os setores na secção 2 e aparecem aqui como atalhos.</span>',
     '<span class="hint">Define os setores em Operações e aparecem aqui como atalhos.</span>', "C12 atalhos de evolução"),
    ('por determinar — depende das coordenadas do TO, na secção 1</span>',
     'por determinar — depende das coordenadas do TO, em Comando</span>', "C13 pasta por determinar"),
    ('por indicar, na secção 1 — a pasta sub-regional depende dela</span>',
     'por indicar, em Comando — a pasta sub-regional depende dela</span>', "C14 sub-região por indicar"),
    ('<p class="hint">Define os setores na secção 2 e aparecem aqui.</p>',
     '<p class="hint">Define os setores em Operações e aparecem aqui.</p>', "C15 canais táticos sem setores"),
    ('Define os setores na secção 2 e aparecem aqui para atribuição de canal de manobra.</p>',
     'Define os setores em Operações e aparecem aqui para atribuição de canal de manobra.</p>', "C16 canais de manobra sem setores"),
    ('Preencher o GDH de início na secção 1 e o dispositivo na secção 2.',
     'Preencher o GDH de início em Comando e o dispositivo em Operações.', "C17 sem verificações confirmadas"),
    ("Os relógios arrancam ao atribuir tipologias aos setores na secção 2 e ao registar meios aéreos",
     "Os relógios arrancam ao atribuir tipologias aos setores em Operações e ao registar meios aéreos", "C18 relógios de rendição"),
]
for a, b, nome in MENSAGENS:
    troca(a, b, nome)

# ═══════════════════════════════════════════════════════════════════
# D — comentários do código
# ═══════════════════════════════════════════════════════════════════
troca(
    'Regras determinísticas derivadas do dispositivo introduzido na secção 2 e do relógio.',
    'Regras determinísticas derivadas do dispositivo introduzido em Operações e do relógio.',
    "D1 comentário do registo de regras"
)

# D2 - a unica referencia a uma seccao de documento que o operador ve. O numero da
#      seccao nao lhe serve para nada e colide com a numeracao que acabamos de matar.
troca(
    "(o esquema JSON já está definido no documento de arquitetura, secção 5)",
    "(o esquema JSON já está definido no documento de arquitetura)",
    "D2 nota de roteiro sem número de secção"
)

# ═══════════════════════════════════════════════════════════════════
# verificação: só devem restar as referências ao contrato
# ═══════════════════════════════════════════════════════════════════
import re
restantes = [re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s[max(0,m.start()-55):m.end()+55]))
             for m in re.finditer(r'secção \d', s)]
# o comentário do esboço quebra a linha entre «secção 8» e «contrato»: reconhece-se
# pela numeração, que na app só vai até 6 — 8 é sempre do documento de interoperação
contrato = [r for r in restantes if "contrato" in r or "arquitetura" in r or "secção 8" in r]
orfas = [r for r in restantes if r not in contrato]
print("\n  restam %d referências, todas ao documento do contrato:" % len(restantes))
for r in contrato: print("     · …%s…" % r)
assert not orfas, "ficaram referências a secções da app:\n" + "\n".join("  " + o for o in orfas)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
