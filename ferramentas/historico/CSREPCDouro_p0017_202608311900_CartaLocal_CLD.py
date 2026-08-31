#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
p0017 — Carta pré-descarregada: selecção de pasta, grelha declarada, atribuição.

Corrige dois defeitos do r0070:

  1. O campo `carta-fich` não tinha `webkitdirectory`. Sem esse atributo o browser
     não devolve `webkitRelativePath`, o código caía em `f.name` — que nunca tem
     barras — e `mosaicoDoCaminho()` rejeitava 100 % dos ficheiros. A funcionalidade
     era impossível de satisfazer por qualquer utilizador.

  2. `grelhaAtual()` devolve PT-TM06 quando não há serviço declarado, mas os
     mosaicos locais serviam à mesma. Uma árvore {z}/{x}/{y} do OSM carregada sem
     serviço era desenhada com a aritmética errada e ficava fora do sítio, em
     silêncio. Passa a exigir-se a declaração da grelha da árvore.

Acrescenta ainda a atribuição da carta local — o próprio código dizia que não havia
onde a declarar — e torna a mensagem de falha diagnóstica, mostrando um caminho lido.

Entrada: r0070.html   Saída: r0071.html
"""
import re, sys, datetime

ORIG = "r0070.html"
DEST = "r0071.html"

s = open(ORIG, encoding="utf-8").read()

def troca(velho, novo, nome):
    global s
    n = s.count(velho)
    assert n == 1, "âncora %s aparece %d vezes" % (nome, n)
    s = s.replace(velho, novo, 1)
    print("  ok  %s" % nome)

# ---------------------------------------------------------------- A. HTML
A_V = '''        <div class="sub" style="margin-top:12px"><span class="stit">Carta pré-descarregada</span>
          <p class="hint" style="margin:0 0 10px 0">Uma pasta com a árvore <span class="mono-sm">{z}/{x}/{y}.png</span>.
          Fica no dispositivo e serve sem rede.</p>
          <input type="file" id="carta-fich" multiple accept="image/png,image/jpeg,image/webp">
          <div class="mono-sm" id="carta-fich-info" style="margin-top:8px"></div>
        </div>'''

A_N = '''        <div class="sub" style="margin-top:12px"><span class="stit">Carta pré-descarregada</span>
          <p class="hint" style="margin:0 0 10px 0">Escolhe a <b>pasta</b> que contém a árvore
          <span class="mono-sm">{z}/{x}/{y}</span> — a pasta inteira, não os ficheiros um a um. Aceita
          <span class="mono-sm">.png</span>, <span class="mono-sm">.jpg</span> e <span class="mono-sm">.webp</span>,
          e ignora o que não seguir a árvore. Fica no dispositivo e serve sem rede.</p>
          <p class="hint" style="margin:0 0 10px 0"><b>Um ficheiro de imagem solto não é carta.</b> Um quadrado
          tem 256×256 pixéis e cobre exatamente o território que o seu <span class="mono-sm">z/x/y</span>
          designa; uma captura de ecrã não cobre coisa nenhuma que a aplicação possa saber, e seria esticada
          para dentro de um quadrado a que não corresponde. Mosaicos geram-se com ferramenta própria.</p>
          <div class="grid g2">
            <div><label for="carta-loc-grelha">Projeção da árvore</label>
              <select id="carta-loc-grelha">
                <option value="mercator">Web Mercator (EPSG:3857) — esquema {z}/{x}/{y}</option>
                <option value="pttm06">PT-TM06 / ETRS89 (EPSG:3763) — conjunto PTTM_06 da DGT</option>
              </select></div>
            <div><label for="carta-loc-atrib">Origem da carta, a mostrar</label>
              <input id="carta-loc-atrib" placeholder="ex.: Ortos 2018, Direção-Geral do Território"></div>
          </div>
          <p class="hint" style="margin:8px 0 10px 0">A projeção não se adivinha pelos nomes dos ficheiros: as duas
          árvores são numeradas do mesmo modo e só a aritmética difere. Declarada errada, a carta aparece e fica
          fora do sítio sem dizer nada — que é pior do que não aparecer.</p>
          <input type="file" id="carta-fich" webkitdirectory directory multiple>
          <div class="mono-sm" id="carta-fich-info" style="margin-top:8px"></div>
        </div>'''
troca(A_V, A_N, "A · painel da carta pré-descarregada")

# ---------------------------------------------- B. carregarMosaicosLocais devolve exemplo
B_V = '''  const L = Array.from(ficheiros||[]);
  let n = 0, semArvore = 0, semArquivo = 0;
  const niveis = new Set();
  for(const f of L){
    const t = mosaicoDoCaminho(f.webkitRelativePath || f.name);
    if(!t){ semArvore++; continue; }'''
B_N = '''  const L = Array.from(ficheiros||[]);
  let n = 0, semArvore = 0, semArquivo = 0, exemplo = "";
  const niveis = new Set();
  for(const f of L){
    const c = f.webkitRelativePath || f.name;
    const t = mosaicoDoCaminho(c);
    /* Guarda-se um caminho recusado para o poder mostrar. Uma mensagem que diz «nenhum
       ficheiro seguia a árvore» sem dizer o que leu obriga quem está ao teclado a
       adivinhar; com o exemplo à vista vê-se num segundo se falta um nível, se a
       extensão é outra, ou se o caminho veio vazio por não ser uma pasta. */
    if(!t){ semArvore++; if(!exemplo) exemplo = c; continue; }'''
troca(B_V, B_N, "B · carregarMosaicosLocais recolhe exemplo")

B2_V = '  return { n, ignorados:semArvore, semArquivo, niveis:[...niveis].sort((a,b)=>a-b) };'
B2_N = '  return { n, ignorados:semArvore, semArquivo, exemplo, niveis:[...niveis].sort((a,b)=>a-b) };'
troca(B2_V, B2_N, "B2 · exemplo no retorno")

# ---------------------------------------------------------- C. CARTA_LOCAL
C_V = 'const CARTA_CHAVE = "peaapp:carta";'
C_N = '''const CARTA_CHAVE = "peaapp:carta";

/**
 * A carta pré-descarregada que está no arquivo deste dispositivo.
 *
 * Não é um serviço: é uma árvore de mosaicos que alguém pôs cá dentro de propósito. Mas
 * precisa de duas coisas que um serviço declara e ela não: **em que projeção está** e
 * **de quem é**.
 *
 * A projeção não é detalhe. Uma árvore do esquema `{z}/{x}/{y}` é Web Mercator; o
 * conjunto `PTTM_06` da Direção-Geral do Território é PT-TM06 e numera os quadrados
 * exatamente do mesmo modo. Sem a declaração, `grelhaAtual()` devolvia a portuguesa
 * sempre que não houvesse serviço, e uma árvore do OpenStreetMap era desenhada com a
 * aritmética errada — carta no ecrã, tudo fora do sítio, e nada a assinalá-lo.
 *
 * @type {null|{grelha:string, atrib:string, por:string, g:string}}
 */
let CARTA_LOCAL = null;
const CARTA_LOCAL_CHAVE = "peaapp:cartalocal";

/** Lê a declaração da carta pré-descarregada deste dispositivo. */
async function carregarCartaLocal(){
  try{
    const r = await ARMAZEM.get(CARTA_LOCAL_CHAVE);
    const c = JSON.parse(r.value);
    if(c && GRELHAS[c.grelha]) CARTA_LOCAL = c;
  }catch(e){ CARTA_LOCAL = null; }
  return CARTA_LOCAL;
}

/** Declara a projeção e a origem da carta pré-descarregada. */
async function declararCartaLocal(grelha, atrib){
  if(!GRELHAS[grelha]) return null;
  CARTA_LOCAL = { grelha, atrib:String(atrib||"").trim(), por:quemRegista(), g:gdhAgora() };
  try{ await ARMAZEM.set(CARTA_LOCAL_CHAVE, JSON.stringify(CARTA_LOCAL)); }catch(e){}
  return CARTA_LOCAL;
}

/** Esquece a declaração, quando se esquecem os quadrados a que dizia respeito. */
async function esquecerCartaLocal(){
  CARTA_LOCAL = null;
  try{ await ARMAZEM.del(CARTA_LOCAL_CHAVE); }catch(e){}
}'''
troca(C_V, C_N, "C · estado CARTA_LOCAL")

# ------------------------------------------------------------ D. grelhaAtual
D_V = '''function grelhaAtual(){
  if(CARTA && CARTA.grelha && GRELHAS[CARTA.grelha]) return GRELHAS[CARTA.grelha];
  if(CARTA && CARTA.tipo === "xyz") return GRELHAS.mercator;
  return GRELHAS.pttm06;
}'''
D_N = '''function grelhaAtual(){
  if(CARTA && CARTA.grelha && GRELHAS[CARTA.grelha]) return GRELHAS[CARTA.grelha];
  if(CARTA && CARTA.tipo === "xyz") return GRELHAS.mercator;
  /* Sem serviço, quem manda é a carta que está no arquivo — se houver alguma e se a sua
     projeção tiver sido declarada. É o único sítio onde essa informação existe: os
     ficheiros não a trazem e a numeração dos quadrados é igual nas duas grelhas. */
  if(CARTA_LOCAL && GRELHAS[CARTA_LOCAL.grelha]) return GRELHAS[CARTA_LOCAL.grelha];
  return GRELHAS.pttm06;
}'''
troca(D_V, D_N, "D · grelhaAtual consulta a carta local")

# ----------------------------------------------------- E. atribuição no rodapé do mapa
E_V = '''  else if(MAPA.pronto) partes.push("Carta pré-descarregada, do arquivo deste dispositivo."
    + " A atribuição é a de quem a forneceu — não há serviço declarado que a possa dizer aqui.");'''
E_N = '''  else if(MAPA.pronto) partes.push("Carta pré-descarregada, do arquivo deste dispositivo"
    + (CARTA_LOCAL && CARTA_LOCAL.atrib? " — " + CARTA_LOCAL.atrib : "")
    + (CARTA_LOCAL && GRELHAS[CARTA_LOCAL.grelha]? " · " + GRELHAS[CARTA_LOCAL.grelha].n
        + " (" + GRELHAS[CARTA_LOCAL.grelha].crs + "), declarado por quem a carregou" : "")
    + (CARTA_LOCAL && CARTA_LOCAL.atrib? "." : ". Sem origem declarada: carta de terceiros mostra-se com a atribuição de quem a forneceu."));'''
troca(E_V, E_N, "E · rodapé do mapa diz a origem e a grelha")

# ------------------------------------------------------------ F. handler do campo
F_V = '''$("carta-fich").addEventListener("change", async ev=>{
  const el = $("carta-fich-info");
  if(!IDB){ el.textContent = "Este navegador não deu base de dados local: a carta pré-descarregada não pode ficar guardada."; return; }
  el.textContent = "A guardar...";
  const r = await carregarMosaicosLocais(ev.target.files);
  el.textContent = r.n
    ? r.n+" quadrados guardados, ampliações "+r.niveis.join(", ")
      + (r.ignorados? " · "+r.ignorados+" ficheiros ignorados por não seguirem {z}/{x}/{y}" : "")
      + " — servem sem rede."
    : "Nenhum ficheiro seguia a árvore {z}/{x}/{y}. Nada foi guardado.";
  if(r.n) fita("Carta pré-descarregada: "+r.n+" quadrados guardados no dispositivo");
  await pintarArquivoMapa();
  if(r.n) pintarMapa();
});'''
F_N = '''$("carta-fich").addEventListener("change", async ev=>{
  const el = $("carta-fich-info");
  if(!IDB){ el.textContent = "Este navegador não deu base de dados local: a carta pré-descarregada não pode ficar guardada."; return; }
  el.textContent = "A guardar...";
  const r = await carregarMosaicosLocais(ev.target.files);

  if(r.n){
    /* A projeção grava-se com os quadrados, não depois: são eles que ela descreve, e uma
       declaração feita a seguir a uma carga que falhou não descreve coisa nenhuma. */
    const g = ($("carta-loc-grelha") && $("carta-loc-grelha").value) || "mercator";
    await declararCartaLocal(g, $("carta-loc-atrib")? $("carta-loc-atrib").value : "");
    el.textContent = r.n+" quadrados guardados, ampliações "+r.niveis.join(", ")
      + " · lidos como "+(GRELHAS[g]? GRELHAS[g].n : g)
      + (r.ignorados? " · "+r.ignorados+" ficheiros ignorados por não seguirem {z}/{x}/{y}" : "")
      + " — servem sem rede.";
    fita("Carta pré-descarregada: "+r.n+" quadrados em "+(GRELHAS[g]? GRELHAS[g].crs : g)
      +" guardados no dispositivo"+($("carta-loc-atrib") && $("carta-loc-atrib").value? " — "+$("carta-loc-atrib").value : ""));
  }else{
    /* Diagnóstico, não veredicto: mostra-se o que se leu, porque é isso que diz onde está
       o erro. Caminho vazio é ficheiro solto em vez de pasta; caminho sem os três níveis
       é a pasta errada; extensão diferente é outro formato. */
    el.textContent = "Nenhum ficheiro seguia a árvore {z}/{x}/{y}. Nada foi guardado."
      + (r.ignorados? " Foram lidos "+r.ignorados+" ficheiros." : " Não veio ficheiro nenhum.")
      + (r.exemplo? " O primeiro que li foi «"+r.exemplo+"»." : "")
      + (r.exemplo && r.exemplo.indexOf("/") < 0
          ? " Não traz caminho nenhum: foram escolhidos ficheiros soltos, e é preciso escolher a pasta."
          : " Esperava-se .../{z}/{x}/{y} com extensão .png, .jpg ou .webp, e z entre 0 e 22.");
  }

  await pintarArquivoMapa();
  if(r.n) pintarMapa();
});'''
troca(F_V, F_N, "F · handler com diagnóstico e declaração da grelha")

# ------------------------------------------------- G. esquecer também a declaração
G_V = '''$("mapa-esquecer").addEventListener("click", async ()=>{
  const n = await esquecerMosaicos();
  await pintarArquivoMapa();'''
G_N = '''$("mapa-esquecer").addEventListener("click", async ()=>{
  const n = await esquecerMosaicos();
  /* A declaração ia com os quadrados. Deixá-la para trás punha a grelha de uma carta que
     já não existe a decidir como se desenha a seguinte. */
  await esquecerCartaLocal();
  await pintarArquivoMapa();'''
troca(G_V, G_N, "G · esquecer arrasta a declaração")

# ---------------------------------------------------------------- H. arranque
H_V = '  try{ await carregarCarta(); pintarCarta(); await pintarArquivoMapa(); }catch(e){}'
H_N = '''  try{ await carregarCarta(); pintarCarta(); await pintarArquivoMapa(); }catch(e){}
  /* A carta pré-descarregada também é definição do posto: sem esta leitura, a grelha da
     árvore guardada perdia-se ao fechar a página e o mapa voltava a desenhá-la errada. */
  try{
    await carregarCartaLocal();
    if(CARTA_LOCAL){
      if($("carta-loc-grelha")) $("carta-loc-grelha").value = CARTA_LOCAL.grelha;
      if($("carta-loc-atrib") && !$("carta-loc-atrib").value) $("carta-loc-atrib").value = CARTA_LOCAL.atrib||"";
    }
  }catch(e){}'''
troca(H_V, H_N, "H · leitura ao arranque")

# ------------------------------------------------------------- I. revisão
carimbo = "202608311900"
novo_f = "CSREPCDouro_r0071_%s_EstacaoPEA_CLD.html" % carimbo
s = s.replace('protótipo <b>r0070</b>', 'protótipo <b>r0071</b>', 1)
s = re.sub(r'CSREPCDouro_r0070_202608311800_EstacaoPEA_CLD\.html', novo_f, s)
s = s.replace('const REVISAO_APP = "r0070"', 'const REVISAO_APP = "r0071"', 1)
print("  ok  I · revisão r0071")

open(DEST, "w", encoding="utf-8").write(s)
print("\nescrito %s (%d bytes)" % (DEST, len(s.encode("utf-8"))))
print("nome final: %s" % novo_f)
