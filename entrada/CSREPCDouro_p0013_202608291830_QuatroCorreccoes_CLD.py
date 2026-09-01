#!/usr/bin/env python3
"""
p0013 — quatro correções de interface encontradas em uso
CSREPC Douro · Estação PEA · sem alteração à versão de estado

  A  Equilíbrio da grelha em «Identificação da ocorrência». A nota sob o campo do GDH
     faz crescer a célula e desalinha a linha inteira: o nível DECIR e a latitude
     descem, e a longitude fica sozinha na linha seguinte. A grelha alinha por linha,
     e uma célula mais alta arrasta as vizinhas.

  B  Dois quadros de rendições repetidos em Logística. Não é defeito novo: o
     `amp-quadro` vivia no painel de avisos e o `amp-quadro-2` no das fontes de dados,
     e um só ciclo enchia ambos. Em painéis diferentes ninguém dava por isso; a
     arrumação por células juntou-os na mesma sala e a repetição ficou à vista. Fica
     um cartão só, com os limiares e o quadro.

  C  O sinal de avisos no cabeçalho levava ao topo do painel de Comando, não aos
     avisos. A causa está no próprio código: rola até ao cartão e logo a seguir chama
     `window.scrollTo({top:0})`, que desfaz o que acabou de fazer.

  D  O catálogo de elementos tinha «Nomear» e «Apagar» e não tinha «Editar». Um posto
     mudado, um contacto novo ou um erro de escrita obrigavam a apagar e reescrever —
     e apagar é destrutivo onde bastava corrigir.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0056.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0057.html"

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
# A — equilíbrio da grelha
# ═══════════════════════════════════════════════════════════════════
troca(
    "  .hint{font-size:13px;color:var(--tx3);margin-top:6px}",
    "  .hint{font-size:13px;color:var(--tx3);margin-top:6px}\n"
    "  /* Numa grelha, a célula mais alta manda na linha inteira. Uma nota comprida sob\n"
    "     um campo empurrava os vizinhos para o fundo da linha, e o campo do GDH ficava\n"
    "     sessenta pixéis acima do nível DECIR e da latitude, que são da mesma linha.\n"
    "     Todos os campos encostam ao rótulo; a nota fica a pender por baixo, e é a\n"
    "     única coisa que ocupa o espaço extra. */\n"
    "  .grid > div{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start}\n"
    "  /* O rótulo do campo-âncora tem letra maior; sem altura fixa a caixa dele cresce\n"
    "     e o campo desce em relação aos vizinhos. */\n"
    "  .grid > div > label{margin-top:0;line-height:18px;min-height:18px}\n"
    "  .grid > div > input, .grid > div > select, .grid > div > textarea{margin-top:0}\n"
    "  /* Altura de controlo constante: o campo-âncora tem letra maior e a caixa crescia\n"
    "     um pixel, o que numa grelha se repete em todas as linhas. A altura passa a ser\n"
    "     do desenho, não do tamanho da letra. */\n"
    "  .grid > div > input, .grid > div > select{height:45px;box-sizing:border-box}\n"
    "  .grid > div > textarea{min-height:45px}",
    "A1 alinhamento das células da grelha"
)



# A3 - altura de linha fixa nos rotulos. O campo-ancora do p0012 tem letra maior, e
#      isso mudava a altura da caixa do rotulo: o vizinho ficava um pixel abaixo. Numa
#      grelha, um pixel repete-se em todas as linhas e le-se como desalinhamento.

# ═══════════════════════════════════════════════════════════════════
# B — um só quadro de rendições
# ═══════════════════════════════════════════════════════════════════
troca(
    '''  /* o relógio do PEA em vigor e a vista do PEA emitido não são cartões: são caixas
     que se preenchem sozinhas. Seguem a célula que elabora o plano — art. 27.º. */''',
    '''  /* Um só quadro de rendições. O `amp-quadro` e o `amp-quadro-2` nasceram em painéis
     diferentes e recebiam ambos o mesmo ciclo; juntos na célula de logística passaram
     a mostrar a mesma tabela duas vezes. Fica o cartão dos limiares, que é o que
     permite agir, e recebe a explicação das barras do que se retira. */
  const cTempos = cartaoPorTitulo("Tempos de empenhamento e rendições");
  const cCtrl = cartaoPorTitulo("Controlo de tempos e rendições");
  if(cTempos && cCtrl){
    const q2 = cTempos.querySelector("#amp-quadro-2");
    cTempos.querySelectorAll(":scope > .hint, :scope > p").forEach(p=>{
      if(!cCtrl.querySelector('[data-mov-nota]')){ p.setAttribute("data-mov-nota","1"); cCtrl.appendChild(p); }
    });
    if(q2) q2.remove();
    cTempos.remove();
    const tg = cCtrl.querySelector(".tag");
    if(tg) tg.textContent = "art. 33.º · DON n.º 2, pontos 7.d.(14) e 7.e.(5)(r)";
  }

  /* o relógio do PEA em vigor e a vista do PEA emitido não são cartões: são caixas
     que se preenchem sozinhas. Seguem a célula que elabora o plano — art. 27.º. */''',
    "B1 fusão dos dois quadros de rendições"
)

troca(
    '  { h:"Tempos de empenhamento e rendições",       cel:"logistica",   r:"art. 33.º; DON 2, 7.d.(14) e 7.e.(5)(r)" },\n',
    '',
    "B2 o cartão removido sai do registo de arrumação"
)

# ═══════════════════════════════════════════════════════════════════
# C — o sinal de avisos leva aos avisos
# ═══════════════════════════════════════════════════════════════════
troca(
    '''  const av = cartaoPorTitulo("Avisos ativos"); if(av) try{ av.scrollIntoView({block:"start",behavior:"smooth"}); }catch(e){}
  try{ pintarDON(); }catch(e){}
  window.scrollTo({top:0,behavior:"smooth"});''',
    '''  try{ pintarDON(); }catch(e){}
  /* O `scrollTo(0)` que aqui estava desfazia o `scrollIntoView` do cartão: o sinal
     abria Comando e ficava no topo da página, longe dos avisos que o acenderam.
     Rolar depois de pintar, e uma vez só. */
  const av = cartaoPorTitulo("Avisos ativos");
  if(av) requestAnimationFrame(()=>{ try{ av.scrollIntoView({block:"start",behavior:"smooth"}); }catch(e){ window.scrollTo(0,av.offsetTop); } });
  else window.scrollTo({top:0,behavior:"smooth"});''',
    "C1 o sinal leva ao cartão de avisos"
)

# ═══════════════════════════════════════════════════════════════════
# D — editar no catálogo de elementos
# ═══════════════════════════════════════════════════════════════════
troca(
    """    + '<div class="acts"><button class="btn btn-b" type="button" data-el-usar="'+esc(x.id)+'">Nomear</button>'
    + '<button class="btn btn-r" type="button" data-el-apagar="'+esc(x.id)+'">Apagar</button></div></div>').join("");""",
    """    + '<div class="acts"><button class="btn btn-b" type="button" data-el-usar="'+esc(x.id)+'">Nomear</button>'
    + '<button class="btn btn-g" type="button" data-el-editar="'+esc(x.id)+'">Editar</button>'
    + '<button class="btn btn-r" type="button" data-el-apagar="'+esc(x.id)+'">Apagar</button></div></div>').join("");

  /* «Editar» traz o registo de volta ao formulário deste cartão e fixa o `id` que se
     está a corrigir. Sem esse `id`, mudar o nome criava um segundo elemento em vez de
     corrigir o primeiro, porque a gravação procura por nome e entidade. Corrigir um
     contacto obrigava a apagar e reescrever, e apagar é destrutivo onde bastava
     corrigir. */
  el.querySelectorAll("[data-el-editar]").forEach(b=>b.addEventListener("click", ()=>{
    const x = ELEMENTOS.find(y=>y.id === b.getAttribute("data-el-editar")); if(!x) return;
    const campos = {"el-nome":x.nome, "el-ent":x.entidade, "el-ct":x.ct, "el-fn":x.funcao, "el-nota":x.nota};
    Object.keys(campos).forEach(id=>{ const c = $(id); if(c) c.value = campos[id] || ""; });
    EL_EDICAO = x.id;
    const g = $("el-add");
    if(g) g.textContent = "Guardar alterações";
    const cx = $("el-cancelar"); if(cx) cx.style.display = "";
    aviso("el-msg","ok","A corrigir «"+x.nome+"». Guardar substitui este registo; cancelar deixa-o como está.");
    const c = $("el-nome"); if(c){ c.focus(); try{ c.scrollIntoView({block:"center",behavior:"smooth"}); }catch(e){} }
  }));""",
    "D1 acção de editar na lista"
)

troca(
    "let ELEMENTOS = [];",
    """let ELEMENTOS = [];
/* Identificador do registo em correção. Vazio, guardar cria ou funde pelo nome;
   preenchido, guardar substitui aquele registo — e só assim se pode corrigir o nome. */
let EL_EDICAO = "";
function sairDaEdicaoElemento(){
  EL_EDICAO = "";
  const g = $("el-add"); if(g) g.textContent = "Guardar no catálogo";
  const cx = $("el-cancelar"); if(cx) cx.style.display = "none";
}""",
    "D2 estado de correção"
)

troca(
    """  const i = ELEMENTOS.findIndex(y=>chaveElemento(y) === chaveElemento(x));""",
    """  /* A correção manda sobre a fusão por nome: quando se está a corrigir um registo
     conhecido, é esse que se substitui, mesmo que o nome mude. */
  const i = (dados && dados.id)
    ? ELEMENTOS.findIndex(y=>y.id === dados.id)
    : ELEMENTOS.findIndex(y=>chaveElemento(y) === chaveElemento(x));""",
    "D3 gravação por identificador quando há correção"
)

troca(
    """    const atual = ELEMENTOS[i];
    ["nome","entidade","ct","funcao","nota"].forEach(k=>{ if(x[k]) atual[k] = x[k]; });""",
    """    const atual = ELEMENTOS[i];
    /* Ao corrigir, um campo esvaziado é para ficar vazio; ao fundir dois registos com
       o mesmo nome, um campo vazio não deve apagar o que já lá estava. */
    const corrigir = !!(dados && dados.id);
    ["nome","entidade","ct","funcao","nota"].forEach(k=>{ if(corrigir || x[k]) atual[k] = x[k]; });""",
    "D4 correção respeita campos esvaziados"
)

troca(
    '        <button class="btn btn-b" type="button" id="el-recolher">Recolher desta ocorrência</button>',
    '        <button class="btn btn-b" type="button" id="el-recolher">Recolher desta ocorrência</button>\n'
    '        <button class="btn btn-g" type="button" id="el-cancelar" style="display:none">Cancelar correção</button>',
    "D5 botão de cancelar"
)

troca(
    """  if(bA) bA.addEventListener("click", async ()=>{
    const r = await guardarElemento({ nome:$("el-nome").value, entidade:$("el-ent").value,
      ct:$("el-ct").value, funcao:$("el-fn").value, nota:$("el-nota").value });
    if(!r.ok){ dizer("err", r.motivo); return; }
    dizer("ok", r.novo? "Elemento guardado no catálogo." : "Elemento já existia; os campos preenchidos foram atualizados.");
    campos.forEach(id=>{ const e=$(id); if(e) e.value=""; });
    pintarElementos($("el-proc").value);
  });""",
    """  if(bA) bA.addEventListener("click", async ()=>{
    const corrigia = EL_EDICAO;
    const r = await guardarElemento({ id: EL_EDICAO || "", nome:$("el-nome").value, entidade:$("el-ent").value,
      ct:$("el-ct").value, funcao:$("el-fn").value, nota:$("el-nota").value });
    if(!r.ok){ dizer("err", r.motivo); return; }
    dizer("ok", corrigia? "Registo corrigido."
      : (r.novo? "Elemento guardado no catálogo." : "Elemento já existia; os campos preenchidos foram atualizados."));
    campos.forEach(id=>{ const e=$(id); if(e) e.value=""; });
    sairDaEdicaoElemento();
    pintarElementos($("el-proc").value);
  });
  const bC = $("el-cancelar");
  if(bC) bC.addEventListener("click", ()=>{
    campos.forEach(id=>{ const e=$(id); if(e) e.value=""; });
    sairDaEdicaoElemento();
    dizer("ok", "Correção cancelada; o registo ficou como estava.");
  });""",
    "D6 gravação e cancelamento ligados ao estado de correção"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
