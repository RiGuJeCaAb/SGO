#!/usr/bin/env python3
"""
p0011 — a ajuda deixa de ser um muro e passa a ser dobrável
CSREPC Douro · Estação PEA · sem alteração ao comportamento

O interruptor global já existia e está bem: o botão «Ajuda» no cabeçalho liga e desliga
tudo, e a preferência fica guardada. O que não está bem é o que acontece com ele ligado.

Cada painel abre com um bloco de quinhentas palavras em duas colunas antes do primeiro
campo. No Comando são mais de nove mil caracteres de texto para vinte e seis campos, e o
painel tem quase nove mil pixéis de altura. É informação excelente e ninguém a lê às três
da manhã — o que a torna informação desperdiçada, não informação a mais.

E desligar tudo também não serve: quem abre a aplicação pela primeira vez fica sem
nada, e a ajuda desta app não é decorativa, cita a norma que sustenta cada campo.

  A  Cada bloco de ajuda passa a dobrável, com o título sempre visível. Fechado por
     omissão: vê-se que há ajuda e sobre o quê, sem pagar o muro para o saber.
  B  O botão do cabeçalho passa a abrir e fechar todos de uma vez. Quem quer o manual
     inteiro continua a tê-lo a um clique.
  C  Feito no arranque, como a arrumação por células: o HTML não muda, os nós são
     reorganizados. Mover preserva os ouvintes.
  D  Teclado: o título é um botão a sério, com `aria-expanded`. Quem navega por
     tabulação chega lá e sabe o estado.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0054.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0055.html"

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
# A — estilo do bloco dobrável
# ═══════════════════════════════════════════════════════════════════
troca(
    '  .help .ht{display:block;font-family:var(--disp);font-weight:700;font-size:16px;letter-spacing:.3px;margin:0 0 4px;color:var(--agua)}',
    '''  .ht{display:block;font-family:var(--disp);font-weight:700;font-size:16px;letter-spacing:.3px;margin:0 0 4px;color:var(--agua)}
  /* Ajuda dobrável: o título fica sempre à vista, o corpo abre a pedido. */
  .help{padding:0}
  .help > .hb{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;
    width:100%;padding:13px 20px;cursor:pointer;font-family:var(--disp);font-weight:700;
    font-size:15px;letter-spacing:.2px;color:var(--agua)}
  .help > .hb:hover{color:var(--tx)}
  .help > .hb:focus-visible{outline:2px solid var(--agua);outline-offset:-2px;border-radius:8px}
  .help > .hb .hseta{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--tx3);
    letter-spacing:.6px;text-transform:none;white-space:nowrap}
  .help > .hc{display:none;padding:0 20px 16px}
  .help.aberta > .hc{display:block}
  .help.aberta > .hb{color:var(--tx)}
  .help > .hc > .ht{display:none}   /* o título passou para o botão */''',
    "A1 estilo do bloco dobrável"
)

# ═══════════════════════════════════════════════════════════════════
# B + C — a dobragem, feita ao arranque
# ═══════════════════════════════════════════════════════════════════
troca(
    '''async function alternarAjuda(on){''',
    '''/* Transforma cada bloco de ajuda num dobrável: o título vira botão e o resto do
   conteúdo vai para um contentor que abre a pedido. Sem tocar no HTML — os nós são
   movidos, como na arrumação por células, e mover preserva o que estiver ligado. */
function dobrarAjudas(){
  document.querySelectorAll(".help").forEach(h=>{
    if(h.querySelector(":scope > .hb")) return;              /* já dobrado */
    const ht = h.querySelector(":scope > .ht") || h.querySelector(":scope > h3");
    const titulo = ht ? ht.textContent.trim() : "Ajuda desta secção";
    const corpo = document.createElement("div");
    corpo.className = "hc";
    while(h.firstChild) corpo.appendChild(h.firstChild);
    const b = document.createElement("button");
    b.type = "button"; b.className = "hb"; b.setAttribute("aria-expanded", "false");
    b.innerHTML = '<span></span><span class="hseta">mostrar</span>';
    b.firstChild.textContent = titulo;
    b.addEventListener("click", ()=>abrirAjuda(h, !h.classList.contains("aberta")));
    h.appendChild(b); h.appendChild(corpo);
  });
}
function abrirAjuda(h, on){
  h.classList.toggle("aberta", !!on);
  const b = h.querySelector(":scope > .hb");
  if(b){
    b.setAttribute("aria-expanded", on? "true":"false");
    const st = b.querySelector(".hseta"); if(st) st.textContent = on? "ocultar" : "mostrar";
  }
}
/* O botão do cabeçalho continua a valer para tudo: abre ou fecha todos de uma vez. */
function todasAsAjudas(on){
  document.querySelectorAll(".help").forEach(h=>abrirAjuda(h, on));
}

async function alternarAjuda(on){''',
    "B1 dobragem e comando global"
)

troca(
    '  document.documentElement.classList.toggle("ajuda", on);',
    '  document.documentElement.classList.toggle("ajuda", on);\n'
    '  try{ dobrarAjudas(); todasAsAjudas(on); }catch(e){}',
    "B2 o interruptor global abre e fecha todos"
)

troca(
    '  html.ajuda .help{display:block}',
    '  html.ajuda .help{display:block}\n'
    '  /* Com a ajuda desligada no cabeçalho, os blocos continuam presentes mas fechados:\n'
    '     vê-se que existe ajuda e sobre o quê, sem pagar o muro de texto para o saber. */\n'
    '  .help{display:block}\n'
    '  .help:not(.aberta) > .hc{display:none}',
    "B4 o título fica visível mesmo com a ajuda desligada"
)

troca(
    'try{ arrumarCasa(); }catch(e){ console.error("arrumação:", e); }',
    'try{ arrumarCasa(); }catch(e){ console.error("arrumação:", e); }\ntry{ dobrarAjudas(); }catch(e){ console.error("ajudas:", e); }',
    "C1 dobrar ao arranque"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
