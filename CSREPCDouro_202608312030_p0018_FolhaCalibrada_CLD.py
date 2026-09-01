#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
p0018 — Folhas de carta calibradas.

Uma imagem não é um mosaico. Uma captura de ecrã da carta militar, uma exportação do
QGIS, uma fotografia de um extracto em papel: nenhuma delas cabe na árvore {z}/{x}/{y}
e todas elas são o que existe às três da manhã. O que lhes falta não é nome — é a
ligação entre os pixéis e o terreno.

Este patch dá-lhes essa ligação, por dois caminhos:

  · **World file** (.pgw/.jgw/.wld) ao lado da imagem, que é o que o QGIS escreve.
  · **Dois pontos de controlo** clicados na imagem, com a coordenada escrita à mão.

Os dois convergem na mesma representação — dois pontos, cada um com pixel e coordenada —
porque um world file de imagem sem rotação não diz mais do que isso, e ter uma única
representação evita duas verdades sobre a mesma folha.

Entrada: r0071.html   Saída: r0072.html
"""
import re

ORIG, DEST = "r0071.html", "r0072.html"
s = open(ORIG, encoding="utf-8").read()

def troca(velho, novo, nome):
    global s
    n = s.count(velho)
    assert n == 1, "âncora %s aparece %d vezes" % (nome, n)
    s = s.replace(velho, novo, 1)
    print("  ok  %s" % nome)

# ================================================================= A. CSS
A_V = '  .mp-t.mp-falta{background:repeating-linear-gradient(45deg,var(--surf2),var(--surf2) 8px,var(--line) 8px,var(--line) 9px)}'
A_N = '''  .mp-t.mp-falta{background:repeating-linear-gradient(45deg,var(--surf2),var(--surf2) 8px,var(--line) 8px,var(--line) 9px)}
  /* A camada das folhas calibradas. Fica por cima dos mosaicos e por baixo do desenho:
     uma folha da carta militar vale mais do que um fundo de serviço, e nenhuma das duas
     pode tapar as frentes. */
  .mp-fl{position:absolute;inset:0;overflow:hidden;pointer-events:none}
  .mp-fl img{position:absolute;left:0;top:0;transform-origin:0 0;-webkit-user-drag:none}
  .fl-li{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px}
  .fl-li .n{flex:1 1 200px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fl-li .e{font-family:var(--mono);font-size:11px;color:var(--tx3)}
  .fl-li .e.por{color:var(--fogo)}
  .fl-cx{border:1px solid var(--line);border-radius:8px;background:var(--surf2);
    cursor:crosshair;text-align:center;padding:6px}
  /* As marcas posicionam-se em percentagem **da imagem**, e por isso o bloco que as
     contém tem de medir o que a imagem mede. Sem este invólucro a percentagem contava-se
     sobre a caixa exterior e a cruz aparecia acima do sítio onde se tinha clicado — que é
     o pior sítio possível para uma marca de calibração estar errada. */
  .fl-in{position:relative;display:inline-block;line-height:0;max-width:100%}
  .fl-cx img{display:block;max-width:100%;max-height:420px;width:auto;height:auto;-webkit-user-drag:none}
  .fl-mk{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;pointer-events:none}
  .fl-mk::before,.fl-mk::after{content:"";position:absolute;background:var(--fogo)}
  .fl-mk::before{left:10px;top:0;width:2px;height:22px}
  .fl-mk::after{top:10px;left:0;height:2px;width:22px}
  .fl-mk b{position:absolute;left:14px;top:-4px;font-family:var(--mono);font-size:11px;
    color:#fff;background:var(--fogo);border-radius:3px;padding:0 4px}'''
troca(A_V, A_N, "A · CSS da camada de folhas e da calibração")

# ================================================================= B. HTML
B_V = '''          <input type="file" id="carta-fich" webkitdirectory directory multiple>
          <div class="mono-sm" id="carta-fich-info" style="margin-top:8px"></div>
        </div>'''
B_N = '''          <input type="file" id="carta-fich" webkitdirectory directory multiple>
          <div class="mono-sm" id="carta-fich-info" style="margin-top:8px"></div>
        </div>

        <div class="sub" style="margin-top:12px"><span class="stit">Folha de carta calibrada</span>
          <p class="hint" style="margin:0 0 10px 0">Uma <b>imagem</b> — captura de ecrã da carta militar, exportação do
          QGIS, fotografia de um extracto — colocada no seu lugar no terreno. É a via para quando não há mosaicos:
          a imagem não precisa de nome nenhum, precisa de <b>duas coordenadas</b>.</p>
          <p class="hint" style="margin:0 0 10px 0">Se o ficheiro trouxer um <span class="mono-sm">world file</span> ao lado
          — <span class="mono-sm">.pgw</span>, <span class="mono-sm">.jgw</span> ou <span class="mono-sm">.wld</span>,
          que é o que o QGIS escreve quando se pede a georreferenciação — a folha calibra-se sozinha. Sem ele,
          marcam-se dois pontos na imagem e escreve-se a coordenada de cada um.</p>
          <div class="row">
            <button class="btn btn-o" type="button" id="fl-b">Carregar imagens</button>
            <input type="file" id="fl-f" multiple hidden
              accept="image/png,image/jpeg,image/webp,.pgw,.jgw,.wld,.pngw,.jpgw">
          </div>
          <div id="fl-lista" style="margin-top:10px"></div>
          <div class="msg" id="fl-msg" style="display:none"></div>

          <div id="fl-cal" style="display:none;margin-top:12px;border-top:1px solid var(--line);padding-top:12px">
            <div class="mono-sm" id="fl-cal-nome" style="margin-bottom:8px"></div>
            <p class="hint" style="margin:0 0 8px 0">Clica na imagem sobre um ponto que saibas identificar — um cruzamento,
            um vértice geodésico, um cruzamento da quadrícula — e escreve a coordenada. Depois o segundo, <b>o mais
            afastado possível do primeiro</b>: dois pontos juntos dão uma escala que se engana muito com pouco erro.</p>
            <div class="fl-cx" id="fl-tela"></div>
            <div class="grid g2" style="margin-top:10px">
              <div><label for="fl-sist">Sistema em que escrevo as coordenadas</label>
                <select id="fl-sist">
                  <option value="geo">Geográficas — graus decimais, GM ou GMS</option>
                  <option value="tm06">PT-TM06 / ETRS89 — metros (M, P)</option>
                </select></div>
              <div><label for="fl-alvo">Ponto a marcar no próximo clique</label>
                <select id="fl-alvo"><option value="0">Ponto 1</option><option value="1">Ponto 2</option></select></div>
              <div><label for="fl-c1">Coordenada do ponto 1</label>
                <input id="fl-c1" placeholder="41 12 30 N 7 30 15 W  ·  ou  41.20833 -7.50417"></div>
              <div><label for="fl-c2">Coordenada do ponto 2</label>
                <input id="fl-c2" placeholder="41 09 05 N 7 24 40 W"></div>
            </div>
            <div class="mono-sm" id="fl-cal-info" style="margin-top:10px"></div>
            <div class="row" style="margin-top:10px">
              <button class="btn btn-o" type="button" id="fl-cal-ok">Calibrar a folha</button>
              <button class="btn btn-b" type="button" id="fl-cal-x">Fechar</button>
            </div>
          </div>
        </div>'''
troca(B_V, B_N, "B · painel das folhas calibradas")

# ================================================================= C. IDB
C_V = 'const IDB_NOME = "peaapp", IDB_VERSAO = 2;'
C_N = '''/* A versão sobe quando entra uma loja nova. O `onupgradeneeded` só cria o que falta,
   portanto uma base já existente ganha a loja e não perde nada do que tinha. */
const IDB_NOME = "peaapp", IDB_VERSAO = 3;'''
troca(C_V, C_N, "C · versão da base")

C2_V = '      if(!db.objectStoreNames.contains("mosaicos")) db.createObjectStore("mosaicos");'
C2_N = '''      if(!db.objectStoreNames.contains("mosaicos")) db.createObjectStore("mosaicos");
      /* As folhas guardam-se inteiras — imagem e calibração no mesmo registo — porque
         uma sem a outra não vale nada: a imagem sozinha não sabe onde está, e a
         calibração sozinha descreve uma imagem que já não existe. */
      if(!db.objectStoreNames.contains("folhas")) db.createObjectStore("folhas", {keyPath:"id"});'''
troca(C2_V, C2_N, "C2 · loja das folhas")

# ================================================================= D. módulo JS
D_V = '''/** Esquece a declaração, quando se esquecem os quadrados a que dizia respeito. */
async function esquecerCartaLocal(){
  CARTA_LOCAL = null;
  try{ await ARMAZEM.del(CARTA_LOCAL_CHAVE); }catch(e){}
}'''
D_N = '''/** Esquece a declaração, quando se esquecem os quadrados a que dizia respeito. */
async function esquecerCartaLocal(){
  CARTA_LOCAL = null;
  try{ await ARMAZEM.del(CARTA_LOCAL_CHAVE); }catch(e){}
}

/* ==================================================================================
   FOLHAS DE CARTA CALIBRADAS

   O mosaico é o caminho bom e é o caminho que exige preparação: uma ferramenta, uma
   ligação, tempo. A folha calibrada é o caminho que resta quando nada disso houve — uma
   imagem qualquer da carta, posta no sítio à mão.

   **A representação é uma só: dois pontos de controlo.** Cada um com o pixel na imagem e
   a coordenada no terreno. Um world file sem rotação não diz mais do que isso, e clicar
   dois pontos também não; ter as duas coisas a desaguar na mesma estrutura evita que a
   mesma folha passe a ter duas verdades sobre onde está.

   Dois pontos dão uma **semelhança** — escala, rotação e deslocamento, quatro incógnitas
   para quatro equações. Não dá para corrigir a distorção da projeção da folha, e não se
   finge que dá: a folha desenha-se, diz-se a escala e a rotação que dela saem, e quem
   olha decide se aquilo é uma carta ou um disparate. Sobre alguns quilómetros de vale a
   diferença entre a projeção da folha e a do mapa é de metros; sobre um distrito não é, e
   por isso a folha é para o teatro e não para a região.

   O que a semelhança **não** pode fazer é endireitar uma fotografia tirada de esguelha a
   um mapa de parede. Isso é uma homografia, precisa de quatro pontos, e fica de fora de
   propósito: uma fotografia de esguelha calibrada com dois pontos põe o centro certo e as
   bordas a centenas de metros do sítio, sem nada a assinalá-lo.
   ================================================================================== */

/** As folhas deste dispositivo. Como os mosaicos, são do posto e não da ocorrência. */
let FOLHAS = [];
/** Os endereços das imagens em memória, por identificador. Vivem enquanto a folha viver. */
const FOLHA_URL = {};

/** Lê as folhas guardadas e prepara as imagens para desenho. */
async function carregarFolhas(){
  FOLHAS = [];
  if(!IDB) return FOLHAS;
  try{ FOLHAS = (await _idb("folhas","readonly", st=>st.getAll())) || []; }catch(e){ FOLHAS = []; }
  FOLHAS.forEach(f=>{
    if(f.b && !FOLHA_URL[f.id]){ try{ FOLHA_URL[f.id] = URL.createObjectURL(f.b); }catch(e){} }
  });
  return FOLHAS;
}

/** Grava uma folha, imagem e calibração juntas. */
async function gravarFolha(f){
  if(!IDB) return false;
  try{ await _idb("folhas","readwrite", st=>st.put(f)); return true; }catch(e){ return false; }
}

/** Apaga uma folha e liberta a imagem que estava em memória. */
async function apagarFolha(id){
  if(IDB){ try{ await _idb("folhas","readwrite", st=>st.delete(id)); }catch(e){} }
  if(FOLHA_URL[id]){ try{ URL.revokeObjectURL(FOLHA_URL[id]); }catch(e){} delete FOLHA_URL[id]; }
  FOLHAS = FOLHAS.filter(f=>f.id !== id);
}

/** Está esta folha em condições de ser desenhada? */
function folhaCalibrada(f){
  return !!(f && Array.isArray(f.pts) && f.pts.length === 2
    && f.pts.every(p=>p && Number.isFinite(p.u) && Number.isFinite(p.v)
      && Number.isFinite(p.lat) && Number.isFinite(p.lon))
    /* Dois pontos no mesmo pixel não definem escala nenhuma: a conta divide por zero e
       a folha sairia com dimensão infinita ou nula, conforme o arredondamento. */
    && (Math.abs(f.pts[1].u - f.pts[0].u) + Math.abs(f.pts[1].v - f.pts[0].v)) > 4);
}

/**
 * A semelhança que leva o pixel da imagem ao pixel da grelha, ao nível `z`.
 *
 * Calcula-se **na grelha corrente**, e não uma vez só na gravação. É de propósito: assim
 * a mesma folha assenta certa quer o mapa esteja em Web Mercator quer esteja em PT-TM06,
 * porque o que ficou guardado foram coordenadas do terreno e não pixéis de uma grelha.
 *
 * Em números complexos, `(dx+i·dy) = (a+i·b)·(du+i·dv)`. O par `(a,b)` traz a escala e a
 * rotação juntas, que é o que uma semelhança é.
 *
 * @returns {null|{a:number, b:number, tx:number, ty:number}}
 */
function folhaSemelhanca(f, z){
  if(!folhaCalibrada(f)) return null;
  const p0 = f.pts[0], p1 = f.pts[1];
  const g0 = gPara(p0.lat, p0.lon, z), g1 = gPara(p1.lat, p1.lon, z);
  const du = p1.u - p0.u, dv = p1.v - p0.v;
  const d2 = du*du + dv*dv;
  if(!d2) return null;
  const dx = g1.x - g0.x, dy = g1.y - g0.y;
  const a = (dx*du + dy*dv)/d2;
  const b = (dy*du - dx*dv)/d2;
  return { a, b, tx:g0.x - (a*p0.u - b*p0.v), ty:g0.y - (b*p0.u + a*p0.v) };
}

/**
 * O que a calibração diz sobre si própria: escala no terreno, rotação, e a distância
 * entre os dois pontos.
 *
 * Serve para desconfiar. Uma folha da carta militar a 1:25 000 numa captura de ecrã anda
 * pelos 2 a 10 metros por pixel; se sair 300, a coordenada foi escrita ao contrário ou
 * num sistema que não é o escolhido. Uma rotação de 40 graus numa carta que estava
 * direita quer dizer que os pontos foram trocados. Isto não se pode verificar sozinho —
 * mas pode dizer-se em voz alta, e é o que se faz.
 */
function folhaAfericao(f){
  const z = 16;
  const S = folhaSemelhanca(f, z);
  if(!S) return null;
  const esc = Math.sqrt(S.a*S.a + S.b*S.b);                 /* pixéis da grelha por pixel da imagem */
  const rot = Math.atan2(S.b, S.a) * 180/Math.PI;
  const mpp = esc * gEscala((f.pts[0].lat + f.pts[1].lat)/2, z);
  const d = distanciaM(f.pts[0].lat, f.pts[0].lon, f.pts[1].lat, f.pts[1].lon);
  return {
    mpp, rot, sepM:d,
    sepPx: Math.hypot(f.pts[1].u - f.pts[0].u, f.pts[1].v - f.pts[0].v),
    largM: mpp * (f.larg||0), altM: mpp * (f.alt||0)
  };
}

/** A camada das folhas, já colocadas. Vazia quando não há nenhuma calibrada e visível. */
function camadaFolhas(){
  const z = MAPA.z, ox = MAPA.cx - MAPA.larg/2, oy = MAPA.cy - MAPA.alt/2;
  const g = FOLHAS.filter(f=>f.ver !== false && folhaCalibrada(f) && FOLHA_URL[f.id]).map(f=>{
    const S = folhaSemelhanca(f, z); if(!S) return "";
    const n = v => Math.round(v*1000)/1000;
    return '<img src="'+FOLHA_URL[f.id]+'" alt="" width="'+(f.larg||0)+'" height="'+(f.alt||0)+'"'
      + ' style="opacity:'+(f.op||1)+';transform:matrix('+n(S.a)+','+n(S.b)+','+n(-S.b)+','+n(S.a)
      + ','+n(S.tx-ox)+','+n(S.ty-oy)+')">';
  }).join("");
  return g? '<div class="mp-fl">'+g+'</div>' : "";
}

/* ---- carregar imagens, e o world file que venha com elas ---- */

/**
 * Lê um world file.
 *
 * Seis números, um por linha, e a ordem não é a que a intuição diz: escala em x, os dois
 * termos de rotação, escala em y — negativa, porque a linha cresce para sul — e por fim
 * as coordenadas do **centro do pixel superior esquerdo**. Não é o canto: é o centro, e
 * meio pixel de diferença numa carta a 1:25 000 são uns dez metros.
 */
function lerWorldFile(txt){
  const n = (String(txt||"").match(/-?\\d+(?:[.,]\\d+)?(?:[eE][-+]?\\d+)?/g) || [])
    .map(x=>parseFloat(x.replace(",", ".")));
  if(n.length < 6 || n.some(v=>!Number.isFinite(v))) return null;
  return { A:n[0], D:n[1], B:n[2], E:n[3], C:n[4], F:n[5] };
}

/**
 * Os dois pontos de controlo que um world file implica.
 *
 * Toma os cantos opostos, que é a maior separação possível dentro da imagem — e a
 * separação é o que dá precisão à escala.
 */
function pontosDoWorldFile(w, larg, alt, sistema){
  const p = (u, v)=>{
    const X = w.A*u + w.B*v + w.C, Y = w.D*u + w.E*v + w.F;
    const c = (sistema === "tm06")? deTM06(X, Y) : { lat:Y, lon:X };
    return (c && Number.isFinite(c.lat) && Number.isFinite(c.lon))? { u, v, lat:c.lat, lon:c.lon } : null;
  };
  const a = p(0, 0), b = p(larg-1, alt-1);
  return (a && b)? [a, b] : null;
}

/** As dimensões reais de uma imagem, que só se sabem depois de o navegador a abrir. */
function medirImagem(blob){
  return new Promise(res=>{
    const u = URL.createObjectURL(blob), im = new Image();
    im.onload = ()=>{ res({ larg:im.naturalWidth, alt:im.naturalHeight }); URL.revokeObjectURL(u); };
    im.onerror = ()=>{ res(null); URL.revokeObjectURL(u); };
    im.src = u;
  });
}

/**
 * Recebe a selecção de ficheiros: as imagens tornam-se folhas, os world files procuram a
 * imagem de que são companheiros pelo nome sem extensão.
 */
async function receberFolhas(ficheiros){
  const L = Array.from(ficheiros||[]);
  const base = c => String(c).replace(/\\.[^.\\/]+$/, "");
  const mundos = {};
  L.filter(f=>/\\.(pgw|jgw|wld|pngw|jpgw)$/i.test(f.name))
   .forEach(f=>{ mundos[base(f.webkitRelativePath || f.name)] = f; });

  const imgs = L.filter(f=>/\\.(png|jpe?g|webp)$/i.test(f.name));
  let n = 0, calibradas = 0;
  for(const f of imgs){
    const d = await medirImagem(f);
    if(!d) continue;
    const id = "fl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const folha = { id, nome:f.name, b:f, larg:d.larg, alt:d.alt, pts:[], ver:true, op:1,
      por:quemRegista(), g:gdhAgora() };
    const w = mundos[base(f.webkitRelativePath || f.name)];
    if(w){
      const t = await w.text();
      const p = lerWorldFile(t);
      /* O world file traz números e não diz em que sistema estão. Assume-se PT-TM06 se os
         valores tiverem grandeza de metros, e graus se forem pequenos — e diz-se qual foi
         a leitura, para poder ser desmentida. */
      if(p){
        const sistema = (Math.abs(p.C) > 1000 || Math.abs(p.F) > 1000)? "tm06" : "geo";
        const pts = pontosDoWorldFile(p, d.larg, d.alt, sistema);
        if(pts){ folha.pts = pts; folha.origem = "world file, lido como "+(sistema === "tm06"? "PT-TM06" : "graus"); calibradas++; }
      }
    }
    if(await gravarFolha(folha)){
      try{ FOLHA_URL[id] = URL.createObjectURL(f); }catch(e){}
      FOLHAS.push(folha); n++;
    }
  }
  return { n, calibradas, semImagem: L.length - imgs.length - Object.keys(mundos).length };
}

/* ---- a lista, e a calibração à mão ---- */

/** A folha que está a ser calibrada, e o ponto que o próximo clique vai marcar. */
let FOLHA_CAL = null;

function pintarFolhas(){
  const el = $("fl-lista"); if(!el) return;
  if(!FOLHAS.length){
    el.innerHTML = '<p class="hint" style="margin:0">Nenhuma folha carregada.</p>';
    return;
  }
  el.innerHTML = FOLHAS.map(f=>{
    const ok = folhaCalibrada(f), a = ok? folhaAfericao(f) : null;
    return '<div class="fl-li">'
      + '<label class="chkbx"><input type="checkbox" data-fl-ver="'+esc(f.id)+'"'+(f.ver !== false? " checked":"")
      + (ok? "" : " disabled")+'></label>'
      + '<span class="n">'+esc(f.nome)+'</span>'
      + '<span class="e'+(ok? "" : " por")+'">'+(ok
          ? (a? a.mpp.toFixed(1).replace(".", ",")+" m/px · rotação "+a.rot.toFixed(1).replace(".", ",")+"°" : "calibrada")
          : "por calibrar")+'</span>'
      + '<button class="btn btn-b" type="button" data-fl-cal="'+esc(f.id)+'">'+(ok? "Recalibrar" : "Calibrar")+'</button>'
      + '<button class="btn btn-r" type="button" data-fl-del="'+esc(f.id)+'">Remover</button>'
      + '</div>';
  }).join("");

  el.querySelectorAll("[data-fl-cal]").forEach(b=>b.addEventListener("click", ()=>abrirCalibracao(b.dataset.flCal)));
  el.querySelectorAll("[data-fl-del]").forEach(b=>b.addEventListener("click", async ()=>{
    const f = FOLHAS.find(x=>x.id === b.dataset.flDel);
    await apagarFolha(b.dataset.flDel);
    if(FOLHA_CAL && FOLHA_CAL.id === b.dataset.flDel) fecharCalibracao();
    if(f) fita("Folha de carta removida: "+f.nome);
    pintarFolhas(); try{ pintarMapa(); }catch(e){}
  }));
  el.querySelectorAll("[data-fl-ver]").forEach(c=>c.addEventListener("change", async ()=>{
    const f = FOLHAS.find(x=>x.id === c.dataset.flVer); if(!f) return;
    f.ver = c.checked; await gravarFolha(f);
    try{ pintarMapa(); }catch(e){}
  }));
}

function abrirCalibracao(id){
  const f = FOLHAS.find(x=>x.id === id); if(!f) return;
  FOLHA_CAL = f;
  $("fl-cal").style.display = "";
  $("fl-cal-nome").textContent = f.nome + " · " + f.larg + "×" + f.alt + " pixéis"
    + (f.origem? " · " + f.origem : "");
  $("fl-alvo").value = "0";
  $("fl-c1").value = f.pts[0]? f.pts[0].lat.toFixed(5)+" "+f.pts[0].lon.toFixed(5) : "";
  $("fl-c2").value = f.pts[1]? f.pts[1].lat.toFixed(5)+" "+f.pts[1].lon.toFixed(5) : "";
  pintarCalibracao();
  $("fl-cal").scrollIntoView({ block:"nearest" });
}

function fecharCalibracao(){
  FOLHA_CAL = null;
  const c = $("fl-cal"); if(c) c.style.display = "none";
}

function pintarCalibracao(){
  const tela = $("fl-tela"), f = FOLHA_CAL;
  if(!tela || !f) return;
  const u = FOLHA_URL[f.id] || "";
  tela.innerHTML = '<div class="fl-in"><img src="'+u+'" alt="">'
    + (f.pts||[]).map((p,i)=>p && Number.isFinite(p.u)
        ? '<div class="fl-mk" data-i="'+i+'" style="left:'+(100*p.u/f.larg)+'%;top:'+(100*p.v/f.alt)+'%"><b>'+(i+1)+'</b></div>'
        : "").join("")
    + '</div>';
  pintarAfericao();
}

function pintarAfericao(){
  const el = $("fl-cal-info"), f = FOLHA_CAL; if(!el || !f) return;
  if(!folhaCalibrada(f)){
    el.textContent = "Faltam pontos: clica na imagem e escreve a coordenada de cada um."
      + " Os dois pontos têm de estar em pixéis diferentes.";
    return;
  }
  const a = folhaAfericao(f);
  if(!a){ el.textContent = "Calibração impossível com estes pontos."; return; }
  const linhas = [
    "Escala: " + a.mpp.toFixed(2).replace(".", ",") + " m por pixel da imagem"
      + " · a folha cobre " + Math.round(a.largM) + " × " + Math.round(a.altM) + " m",
    "Rotação: " + a.rot.toFixed(2).replace(".", ",") + "°"
      + " · separação dos pontos: " + Math.round(a.sepM) + " m em " + Math.round(a.sepPx) + " pixéis"
  ];
  /* As reservas dizem-se, não se impõem. Uma carta pode estar mesmo rodada, e uma folha
     pode mesmo ser de 300 m/px — mas nenhuma das duas é o caso comum, e quem calibra tem
     o direito de ser avisado antes de o mapa lhe dar uma certeza falsa. */
  if(Math.abs(a.rot) > 3) linhas.push("ATENÇÃO: a folha sai rodada mais de 3°. Se a carta estava direita, os pontos estão trocados ou uma coordenada está errada.");
  if(a.mpp > 60 || a.mpp < 0.05) linhas.push("ATENÇÃO: escala fora do que se espera de um extrato de carta. Confirmar o sistema de coordenadas escolhido.");
  if(a.sepPx < f.larg/4) linhas.push("Os pontos estão próximos um do outro: um erro de leitura de poucos metros amplia-se por toda a folha. Afastá-los melhora muito a colocação.");
  el.innerHTML = linhas.map(t=>'<div>'+esc(t)+'</div>').join("");
}

/** Lê a coordenada escrita, no sistema escolhido. */
function lerCoordFolha(txt){
  const t = String(txt||"").trim();
  if(!t) return null;
  if(($("fl-sist")||{}).value === "tm06"){
    const n = (t.match(/-?\\d+(?:[.,]\\d+)?/g) || []).map(x=>parseFloat(x.replace(",", ".")));
    if(n.length < 2) return null;
    const c = deTM06(n[0], n[1]);
    return (c && Number.isFinite(c.lat))? { lat:c.lat, lon:c.lon } : null;
  }
  const r = parseCoordAny(t);
  return r? { lat:r.lat, lon:r.lon } : null;
}

/* ---- ligações ---- */

$("fl-b").addEventListener("click", ()=>$("fl-f").click());
$("fl-f").addEventListener("change", async ev=>{
  if(!IDB){ aviso("fl-msg","err","Este navegador não deu base de dados local: as folhas não podem ficar guardadas."); return; }
  const r = await receberFolhas(ev.target.files);
  ev.target.value = "";
  pintarFolhas();
  if(!r.n){ aviso("fl-msg","err","Nenhuma imagem reconhecida. Aceita .png, .jpg e .webp."); return; }
  fita(r.n + " folha(s) de carta carregada(s)" + (r.calibradas? ", "+r.calibradas+" com world file" : ""));
  aviso("fl-msg","ok", r.n + " imagem(ns) carregada(s)"
    + (r.calibradas? " · "+r.calibradas+" calibrada(s) pelo world file" : " · falta calibrar"));
  try{ pintarMapaCartao(); pintarMapa(); }catch(e){}
});

$("fl-tela").addEventListener("click", ev=>{
  const f = FOLHA_CAL; if(!f) return;
  const im = $("fl-tela").querySelector("img"); if(!im) return;
  const r = im.getBoundingClientRect();
  /* O clique dá-se na imagem encolhida para caber; o ponto guarda-se em pixéis da imagem
     original, porque é a esses que a calibração se refere e são eles que não mudam
     quando a janela muda de tamanho. */
  const u = Math.round((ev.clientX - r.left) / r.width * f.larg);
  const v = Math.round((ev.clientY - r.top) / r.height * f.alt);
  if(u < 0 || v < 0 || u >= f.larg || v >= f.alt) return;
  const i = +($("fl-alvo").value || 0);
  f.pts[i] = Object.assign({}, f.pts[i] || {}, { u, v });
  /* Marcado o primeiro, o próximo clique passa a ser o segundo: é a ordem natural e
     poupa um passo, sem impedir voltar atrás pelo selector. */
  if(i === 0) $("fl-alvo").value = "1";
  pintarCalibracao();
});

["fl-c1","fl-c2"].forEach((id, i)=>$(id).addEventListener("change", ()=>{
  const f = FOLHA_CAL; if(!f) return;
  const c = lerCoordFolha($(id).value);
  if(!c){ aviso("fl-msg","err","Coordenada do ponto "+(i+1)+" não reconhecida no sistema escolhido."); return; }
  f.pts[i] = Object.assign({}, f.pts[i] || {}, { lat:c.lat, lon:c.lon });
  pintarCalibracao();
}));

$("fl-sist").addEventListener("change", ()=>{
  ["fl-c1","fl-c2"].forEach(id=>{ const e = $(id); if(e) e.dispatchEvent(new Event("change")); });
});

$("fl-cal-ok").addEventListener("click", async ()=>{
  const f = FOLHA_CAL; if(!f) return;
  if(!folhaCalibrada(f)){ aviso("fl-msg","err","Faltam os dois pontos, com pixel e coordenada."); return; }
  f.origem = f.origem && /world file/.test(f.origem)? f.origem : "dois pontos de controlo, marcados à mão";
  f.calG = gdhAgora(); f.calPor = quemRegista();
  await gravarFolha(f);
  const a = folhaAfericao(f);
  fita("Folha de carta calibrada: "+f.nome+" — "+(a? a.mpp.toFixed(1).replace(".", ",")+" m/px" : "")
    +", por "+(f.calPor||"—"));
  aviso("fl-msg","ok","Folha calibrada. Aparece no mapa por cima do fundo.");
  pintarFolhas();
  try{ pintarMapaCartao(); pintarMapa(); }catch(e){}
});

$("fl-cal-x").addEventListener("click", fecharCalibracao);'''
troca(D_V, D_N, "D · módulo das folhas calibradas")

# ================================================================= E. desenho
E_V = '''  cx.innerHTML = '<div class="mp-mos"></div>' + camadaMapa();
  const fundo = cx.querySelector(".mp-mos");'''
E_N = '''  cx.innerHTML = '<div class="mp-mos"></div>' + camadaFolhas() + camadaMapa();
  const fundo = cx.querySelector(".mp-mos");'''
troca(E_V, E_N, "E · camada de folhas no desenho")

E2_V = '''    const svg = tela.querySelector(".mp-svg"), mos = tela.querySelector(".mp-mos");'''
E2_N = '''    const svg = tela.querySelector(".mp-svg"), mos = tela.querySelector(".mp-mos"),
          fls = tela.querySelector(".mp-fl");'''
troca(E2_V, E2_N, "E2 · folhas no arrasto (leitura)")

E3_V = '''    if(mos) mos.style.transform = "translate("+dx+"px,"+dy+"px)";
    if(svg) svg.style.transform = "translate("+dx+"px,"+dy+"px)";'''
E3_N = '''    if(mos) mos.style.transform = "translate("+dx+"px,"+dy+"px)";
    if(fls) fls.style.transform = "translate("+dx+"px,"+dy+"px)";
    if(svg) svg.style.transform = "translate("+dx+"px,"+dy+"px)";'''
troca(E3_V, E3_N, "E3 · folhas no arrasto (movimento)")

# ================================================== F. a folha conta para o enquadramento
F_V = '''  frentesLista().forEach(f=>(f.linha||[]).forEach(c=>juntar(c[1], c[0])));
  (estObj().setores||[]).forEach((_,i)=>{ const a = limiteSetor(i); if(a) a.forEach(c=>juntar(c[1], c[0])); });'''
F_N = '''  frentesLista().forEach(f=>(f.linha||[]).forEach(c=>juntar(c[1], c[0])));
  (estObj().setores||[]).forEach((_,i)=>{ const a = limiteSetor(i); if(a) a.forEach(c=>juntar(c[1], c[0])); });
  /* Uma folha calibrada delimita território tal como uma frente: sem isto, carregar uma
     carta da Cabeça Boa e não ter mais nada registado deixava o cartão do mapa fechado, e
     a folha ficava guardada sem nunca aparecer. */
  if(typeof FOLHAS !== "undefined") FOLHAS.forEach(fo=>{
    if(fo.ver !== false && folhaCalibrada(fo)) fo.pts.forEach(p=>juntar(p.lat, p.lon));
  });'''
troca(F_V, F_N, "F · folhas contam para o enquadramento")

# ================================================================= G. arranque
G_V = '''  try{
    await carregarCartaLocal();'''
G_N = '''  try{ await carregarFolhas(); pintarFolhas(); }catch(e){}
  try{
    await carregarCartaLocal();'''
troca(G_V, G_N, "G · leitura das folhas ao arranque")


# ============================================ I. o rodapé conhece as folhas
I_V = """function pintarEstadoMapa(vieram, total){
  const el = $("mapa-info"); if(!el) return;
  const partes = [];"""
I_N = """function pintarEstadoMapa(vieram, total){
  const el = $("mapa-info"); if(!el) return;
  const partes = [];
  /* As folhas dizem-se primeiro e por si: sem isto o rodapé anunciava «sem serviço de
     mosaicos» e «12 de 12 quadrados não vieram» num mapa que estava a mostrar a carta
     militar. A queixa era verdadeira e a leitura era falsa. */
  const fls = (typeof FOLHAS !== "undefined")? FOLHAS.filter(f=>f.ver !== false && folhaCalibrada(f)) : [];
  if(fls.length){
    const a = folhaAfericao(fls[0]);
    partes.push(fls.length + (fls.length === 1? " folha de carta calibrada" : " folhas de carta calibradas")
      + ": " + fls.map(f=>f.nome).join("; ")
      + (a? " · " + a.mpp.toFixed(1).replace(".", ",") + " m por pixel" : "")
      + ". Colocada por dois pontos de controlo: a posição vale o que valem as coordenadas que lhe foram dadas.");
  }"""
troca(I_V, I_N, "I · rodapé conhece as folhas")

I2_V = """  else if(MAPA.falhas)
    partes.push(MAPA.falhas+" de "+total+" quadrados não vieram — o mapa está incompleto.");"""
I2_N = """  else if(MAPA.falhas && !fls.length)
    partes.push(MAPA.falhas+" de "+total+" quadrados não vieram — o mapa está incompleto.");"""
troca(I2_V, I2_N, "I2 · não se queixa de mosaicos quando a folha é a carta")

# ================================================================= H. revisão
carimbo = "202608312030"
novo = "CSREPCDouro_r0072_%s_EstacaoPEA_CLD.html" % carimbo
s = s.replace('protótipo <b>r0071</b>', 'protótipo <b>r0072</b>', 1)
s = re.sub(r'CSREPCDouro_r0071_\d+_EstacaoPEA_CLD\.html', novo, s)
s = s.replace('const REVISAO_APP = "r0071"', 'const REVISAO_APP = "r0072"', 1)
print("  ok  H · revisão r0072")

open(DEST, "w", encoding="utf-8").write(s)
print("\nescrito %s (%d bytes)" % (DEST, len(s.encode("utf-8"))))
print("nome final: %s" % novo)
