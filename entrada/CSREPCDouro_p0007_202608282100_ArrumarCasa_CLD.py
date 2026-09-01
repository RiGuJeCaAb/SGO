#!/usr/bin/env python3
"""
p0007 — arrumar a casa: a interface passa a estar organizada por célula do PCO
CSREPC Douro · Estação PEA · sem alteração à versão de estado

Base legal: DL n.º 90-A/2022, art. 12.º, n.º 2; Despacho n.º 4067/2024, arts. 14.º,
15.º, 17.º, 19.º, 27.º a 30.º, 32.º a 35.º e 46.º.

Até aqui os separadores seguiam o fluxo de trabalho — Ocorrência, Fontes de dados,
PCO/PLACOM, Evolução, Meteograma, PEA. É a ordem por que o operador preenche, e não
a ordem por que o posto de comando se organiza. Quem está na célula de logística tinha
o plano de comunicações no separador 3, o ponto de trânsito e as rendições no 2, e o
pacote de canais outra vez no 3. Quem está em planeamento tinha a área e o relevo no 2,
a meteorologia no 5 e o PEA no 6.

Passa a haver um separador por célula, e cada cartão vive na sala da célula a que a
lei atribui a matéria.

  A  Quatro painéis novos: Comando, Planeamento, Operações, Logística e Finanças.
     A passagem de turno mantém separador próprio, por ser transversal por natureza.
  B  Registo ARRUMACAO: por cartão, a célula que o recebe e a norma que o justifica.
     `arrumarCasa()` move os nós ao arranque; mover preserva os ouvintes.
  C  O cartão «Dados operacionais da ocorrência» conflaciona duas células — área,
     topografia e exposição são de Planeamento; setorização e importação do dispositivo
     são de Operações. Divide-se em dois cartões pela fronteira.
  D  `auditarArrumacao()`: um cartão sem célula, ou uma célula declarada para um cartão
     que não existe, parte a verificação. Mesmo princípio do registo de posse.
  E  Os identificadores antigos dos painéis continuam a funcionar em `irPara()`, por
     tabela de correspondência. As quarenta e tal referências espalhadas pelo código e
     pelos botões `data-ir` não mudam uma linha.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "real_r0035.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "real_r0036.html"

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
# C — dividir o cartão que conflacia Planeamento e Operações
# ═══════════════════════════════════════════════════════════════════
troca(
    '      <div class="sub"><span class="stit">Setorização do TO e quadro de meios',
    '    </div>\n\n'
    '    <div class="card">\n'
    '      <h2>Dispositivo e setorização <span class="tag">célula de operações \u2014 art. 17.º, n.º 1, als. a) e d)</span></h2>\n'
    '      <div class="sub"><span class="stit">Setorização do TO e quadro de meios',
    "C1 fecha o cartão de Planeamento, abre o de Operações"
)
troca(
    '      <div class="sub"><span class="stit">Análise topográfica expedita',
    '    </div>\n\n'
    '    <div class="card">\n'
    '      <h2>Leitura do terreno <span class="tag">núcleo de informações \u2014 art. 28.º</span></h2>\n'
    '      <div class="sub"><span class="stit">Análise topográfica expedita',
    "C2 fecha o cartão de Operações, reabre Planeamento"
)
troca(
    '      <div class="sub"><span class="stit">Importação da Gestão PCO',
    '      <div class="sub" data-move-ops="1"><span class="stit">Importação da Gestão PCO',
    "C3 marca a importação para acompanhar o dispositivo"
)

troca(
    '      <div class="sub"><span class="stit">Passagem de comando (DON n.º 2, ponto 30)</span>',
    '      <div class="sub" data-move-turno="1"><span class="stit">Passagem de comando (DON n.º 2, ponto 30)</span>',
    "C4 o briefing de passagem de comando sai do plano de comunicacoes"
)

# ═══════════════════════════════════════════════════════════════════
# A — painéis das células
# ═══════════════════════════════════════════════════════════════════
troca(
    '  <section class="pane on" id="p-occ">',
    '''  <section class="pane on" id="p-comando"></section>
  <section class="pane" id="p-planeamento"></section>
  <section class="pane" id="p-operacoes"></section>
  <section class="pane" id="p-logistica"></section>

  <section class="pane" id="p-occ">''',
    "A1 painéis das quatro células"
)

troca(
    '''    <button data-p="p-occ" class="on">1 · Ocorrência</button>
    <button data-p="p-fontes">2 · Fontes de dados</button>
    <button data-p="p-pco" title="Estrutura do posto de comando e plano de comunicações">3 · PCO / PLACOM</button>
    <button data-p="p-evo">4 · Evolução / POSIT</button>
    <button data-p="p-meteo">5 · Meteograma</button>
    <button data-p="p-pea">6 · PEA</button>''',
    '''    <button data-p="p-comando" class="on" title="COS, coordenador do PCO e adjuntos — arts. 14.º e 15.º">Comando</button>
    <button data-p="p-planeamento" title="Elabora o plano estratégico de ação — arts. 26.º a 30.º">Planeamento</button>
    <button data-p="p-operacoes" title="Executa o plano e transmite as ordens de missão — arts. 16.º a 25.º">Operações</button>
    <button data-p="p-logistica" title="Sustentação logística do teatro de operações — arts. 31.º a 35.º">Logística e Finanças</button>''',
    "A2 navegação por célula"
)

troca(
    '    <button data-p="p-turno" title="Continuidade em espelho e rotatividade de funções \u2014 DON n.º 2, ponto 7.d.(30)">Passagem de turno</button>\n'
    '    <button data-p="p-fita">Fita do tempo</button>',
    '    <button data-p="p-turno" title="Continuidade em espelho e rotatividade de funções \u2014 DON n.º 2, ponto 7.d.(30)">Passagem de turno</button>',
    "A3 a fita do tempo deixa de ter separador próprio"
)

# ═══════════════════════════════════════════════════════════════════
# B + D + E — registo, arrumação, auditoria e atalhos
# ═══════════════════════════════════════════════════════════════════
troca(
    '''window.irPara = pid => { document.querySelector('nav button[data-p="'+pid+'"]').click(); };''',
    '''/* ================= arrumação da casa por célula =================
   Cada cartão pertence à célula a quem a lei atribui a matéria, e é aí que aparece.
   O registo é declarativo e auditado: um cartão sem célula, ou uma célula declarada
   para um cartão que não existe, parte `auditarArrumacao()`. A chave é o texto do
   cabeçalho — e é por isso que a auditoria existe, porque um título que mude sem o
   registo acompanhar deixaria o cartão para trás em silêncio. */
const ARRUMACAO = [
  /* --- Comando: arts. 14.º e 15.º; aprovação do PEA, art. 8.º, n.º 2, al. e) --- */
  { h:"Identificação da ocorrência",              cel:"comando",     r:"art. 14.º" },
  { h:"Estrutura do posto de comando",            cel:"comando",     r:"art. 14.º, n.os 1 a 5" },
  { h:"Avisos ativos",                            cel:"comando",     r:"art. 8.º, n.º 2 — determinações do COS" },
  { h:"Conformidade verificada",                  cel:"comando",     r:"prova documental da ocorrência" },
  { h:"Arquivo de ocorrências",                   cel:"comando",     r:"—" },
  { h:"Estado das integrações",                   cel:"comando",     r:"—" },
  /* --- Planeamento: arts. 26.º a 30.º --- */
  { h:"Dados operacionais da ocorrência",         cel:"planeamento", r:"art. 28.º — análise da zona de intervenção" },
  { h:"Leitura do terreno",                       cel:"planeamento", r:"art. 28.º" },
  { h:"Perfil de elevação",                       cel:"planeamento", r:"art. 28.º" },
  { h:"Previsão meteorológica",                   cel:"planeamento", r:"art. 29.º — núcleo de antecipação" },
  { h:"Análise determinística",                   cel:"planeamento", r:"art. 29.º" },
  { h:"Verificação de conformidade dos dados",    cel:"planeamento", r:"art. 46.º" },
  { h:"Elaborar proposta de PEA",                 cel:"planeamento", r:"art. 27.º, n.º 1, al. a)" },
  { h:"Histórico de propostas de PEA",            cel:"planeamento", r:"art. 27.º, n.º 1, al. a)" },
  /* --- Operações: arts. 16.º a 25.º --- */
  { h:"Dispositivo e setorização",                cel:"operacoes",   r:"art. 17.º, n.º 1, als. a) e d)" },
  { h:"Registo de evolução da situação operacional", cel:"operacoes", r:"art. 17.º, n.º 1, al. a)" },
  { h:"Linha de evolução",                        cel:"operacoes",   r:"art. 17.º, n.º 1, al. a)" },
  { h:"Fita do tempo",                            cel:"operacoes",   r:"art. 17.º, n.º 1, al. g)" },
  /* --- Logística e Finanças: arts. 31.º a 35.º --- */
  { h:"Plano de comunicações",                    cel:"logistica",   r:"art. 32.º, n.º 1, al. d); art. 34.º" },
  { h:"Pacote de canais",                         cel:"logistica",   r:"art. 34.º" },
  { h:"Ponto de trânsito",                        cel:"logistica",   r:"art. 32.º, n.º 1, al. b); DON 2, 7.d.(5), (7) e (8)" },
  { h:"Tempos de empenhamento e rendições",       cel:"logistica",   r:"art. 33.º; DON 2, 7.d.(14) e 7.e.(5)(r)" },
  { h:"Controlo de tempos e rendições",           cel:"logistica",   r:"art. 33.º; DON 2, 7.e.(5)(r)" }
];

/* Painéis antigos que continuam a ser alvo de `irPara` e dos botões `data-ir`.
   Nenhuma das quarenta e tal referências espalhadas pelo código precisou de mudar:
   traduzem-se aqui, e levam ao cartão que antes encabeçava a secção. */
const ATALHOS_PANE = {
  "p-occ":    { pane:"p-comando",     h:"Identificação da ocorrência" },
  "p-fontes": { pane:"p-planeamento", h:"Dados operacionais da ocorrência" },
  "p-pco":    { pane:"p-comando",     h:"Estrutura do posto de comando" },
  "p-evo":    { pane:"p-operacoes",   h:"Registo de evolução da situação operacional" },
  "p-meteo":  { pane:"p-planeamento", h:"Previsão meteorológica" },
  "p-pea":    { pane:"p-planeamento", h:"Elaborar proposta de PEA" },
  "p-avisos": { pane:"p-comando",     h:"Avisos ativos" },
  "p-fita":   { pane:"p-operacoes",   h:"Fita do tempo" }
};

function tituloCartao(c){ const h = c.querySelector("h2"); return h? h.childNodes[0].textContent.trim() : ""; }
function cartaoPorTitulo(h){
  return [...document.querySelectorAll(".card")].find(c=>tituloCartao(c) === h) || null;
}

/* Move cada cartão para o painel da sua célula. `appendChild` move o nó e preserva
   os ouvintes já ligados, por isso a arrumação não parte um único botão. */
function arrumarCasa(){
  /* a importação do dispositivo acompanha a setorização */
  const imp = document.querySelector('[data-move-ops]');
  const disp = cartaoPorTitulo("Dispositivo e setorização");
  if(imp && disp && !disp.contains(imp)) disp.appendChild(imp);

  /* O briefing de passagem de comando estava dentro do cartão do plano de comunicações
     por acidente de construção. É matéria de continuidade de comando — DON n.º 2, ponto
     7.d.(30) — e o seu lugar é junto da passagem de turno. */
  const brf = document.querySelector('[data-move-turno]'), pt = document.getElementById("p-turno");
  if(brf && pt){
    const cx = document.createElement("div");
    cx.className = "card";
    cx.innerHTML = '<h2>Briefing de passagem de comando <span class="tag">DON n.º 2, ponto 7.d.(30) — composição determinística</span></h2>';
    cx.appendChild(brf);
    pt.insertBefore(cx, pt.querySelector(".card:nth-of-type(2)") || null);
  }

  ARRUMACAO.forEach(a=>{
    const c = cartaoPorTitulo(a.h), destino = document.getElementById("p-"+a.cel);
    if(c && destino) destino.appendChild(c);
  });
  /* o relógio do PEA em vigor e a vista do PEA emitido não são cartões: são caixas
     que se preenchem sozinhas. Seguem a célula que elabora o plano — art. 27.º. */
  const pl = document.getElementById("p-planeamento");
  ["pea-vigor","pea-view"].forEach(id=>{ const n = document.getElementById(id); if(n && pl) pl.appendChild(n); });

  /* os painéis antigos ficam vazios e saem da vista */
  Object.keys(ATALHOS_PANE).forEach(id=>{ const p = document.getElementById(id); if(p) p.classList.add("husk"); });
}

/* Um cartão que fique de fora, ou um registo que aponte para cartão inexistente, é
   defeito visível — e não um cartão que ninguém encontra. */
function auditarArrumacao(){
  const semCelula = [...document.querySelectorAll(".card")]
    .filter(c=>!c.closest("#p-comando,#p-planeamento,#p-operacoes,#p-logistica,#p-turno"))
    .map(tituloCartao);
  const semCartao = ARRUMACAO.filter(a=>!cartaoPorTitulo(a.h)).map(a=>a.h);
  const semNorma = ARRUMACAO.filter(a=>!a.r).map(a=>a.h);
  return { cartoes:document.querySelectorAll(".card").length, semCelula, semCartao, semNorma };
}

window.irPara = pid => {
  const a = ATALHOS_PANE[pid], alvo = a? a.pane : pid;
  const b = document.querySelector('nav button[data-p="'+alvo+'"]');
  if(!b) return;
  b.click();
  if(a && a.h){ const c = cartaoPorTitulo(a.h); if(c) try{ c.scrollIntoView({block:"start",behavior:"smooth"}); }catch(e){} }
};''',
    "B1 registo, arrumação, auditoria e atalhos"
)

troca(
    'const NOMES_PANE = {"p-occ":"secção 1 · Ocorrência","p-fontes":"secção 2 · Fontes de dados","p-pco":"secção 3 · PCO e comunicações","p-evo":"secção 4 · Evolução","p-meteo":"secção 5 · Meteograma","p-pea":"secção 6 · PEA","p-avisos":"secção de avisos"};',
    'const NOMES_PANE = {"p-occ":"Comando · identificação","p-fontes":"Planeamento · dados da ocorrência","p-pco":"Comando · estrutura do PCO","p-evo":"Operações · evolução","p-meteo":"Planeamento · meteorologia","p-pea":"Planeamento · PEA","p-avisos":"Comando · avisos","p-turno":"Passagem de turno"};',
    "B2 nomes dos destinos por célula"
)

# arranque
troca(
    '$("b-gerar").onclick=emitirPEA;',
    'try{ arrumarCasa(); }catch(e){ console.error("arrumação:", e); }\n$("b-gerar").onclick=emitirPEA;',
    "B3 arrumar ao arranque"
)

# o painel de avisos deixou de existir como destino próprio
troca(
    '''  $("p-avisos").classList.add("on");''',
    '''  const bC = document.querySelector('nav button[data-p="p-comando"]');
  if(bC) bC.classList.add("on");
  $("p-comando").classList.add("on");
  const av = cartaoPorTitulo("Avisos ativos"); if(av) try{ av.scrollIntoView({block:"start",behavior:"smooth"}); }catch(e){}''',
    "B4 o sinal do cabeçalho abre a célula de comando"
)

# renderCheck corria ao abrir o separador do PEA; agora é o de planeamento
troca(
    'b.classList.add("on"); $(b.dataset.p).classList.add("on"); if(b.dataset.p==="p-pea") renderCheck(); };',
    'b.classList.add("on"); $(b.dataset.p).classList.add("on"); if(b.dataset.p==="p-planeamento") renderCheck(); };',
    "B5 verificação de conformidade ao abrir Planeamento"
)

troca(
    '  .tn-posse .btn{margin-left:auto}',
    '  .tn-posse .btn{margin-left:auto}\n'
    '  /* painéis antigos, esvaziados pela arrumação: ficam no documento para que os\n'
    '     identificadores continuem a existir, e fora da vista porque nada contêm. */\n'
    '  .pane.husk{display:none !important}',
    "B6 estilo dos painéis esvaziados"
)

# ── F1 · o quadro de ampulhetas nunca coube a 390 px ──────────────────
#
#     Defeito anterior a este patch: seis colunas fixas somam mais de 500 px. Vivia
#     escondido no separador de avisos, e a arrumacao por celula trouxe-o a luz na
#     Logistica. Abaixo dos 900 px passa a lista, com os rotulos como etiqueta.
troca(
    '  .amp-leg{font-size:12.5px;color:var(--tx2);margin-top:10px;line-height:1.5}',
    '  .amp-leg{font-size:12.5px;color:var(--tx2);margin-top:10px;line-height:1.5}\n'
    '  @media(max-width:900px){\n'
    '    .amp-h{display:none}\n'
    '    .amp-r{grid-template-columns:1fr;gap:4px;padding:12px 4px}\n'
    '    .amp-r>*{min-width:0}\n'
    '    .amp-e::before,.amp-s::before{font-family:var(--mono);font-size:9.5px;letter-spacing:.7px;\n'
    '      text-transform:uppercase;color:var(--tx2);display:block;margin-bottom:2px}\n'
    '    .amp-e:nth-of-type(1)::before{content:"Entrada"}\n'
    '    .amp-s{text-align:left;justify-self:start}\n'
    '  }',
    "F1 ampulhetas em coluna única abaixo dos 900 px"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
