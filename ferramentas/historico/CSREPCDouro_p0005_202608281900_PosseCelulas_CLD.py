#!/usr/bin/env python3
"""
p0005 — posse do estado por célula, verificável
CSREPC Douro · Estação PEA · sem alteração à versão de estado

Base legal: DL n.º 90-A/2022, art. 12.º, n.º 2 e n.º 5; Despacho n.º 4067/2024,
arts. 14.º, 15.º, 17.º, 19.º, 27.º a 30.º e 32.º a 35.º; DON n.º 2 — DECIR/2026,
pontos 7.d.(5), (7), (8) e (30).

Até aqui a repartição por células existia na doutrina, nas etiquetas do PEA e nas
pendências da passagem de turno. Não existia no estado: `O` continua plano e toda a
gente escreve em `O.dados`. Mover ramos agora colidiria com o importador, que escreve
em `O.meta`, `O.dados.est`, `O.dados.pt`, `O.dados.sensiveis`, `O.dados.area` e
`O.pco.funcoes`. Este patch faz o passo que não colide e que é, de qualquer modo, o
primeiro: **declarar a posse e torná-la verificável.**

  A  Registo CELULAS: por célula, os ramos do estado que possui, cada um com a norma
     que lhe atribui a matéria.
  B  Acessores: donoDoRamo(), ramosDaCelula(), lerRamo(), instantaneoCelula().
  C  Exportação por célula — a operação que, nas palavras de quem escreveu o
     importador, faz a posse deixar de ser opinião e passar a teste.
  D  auditarPosse(): recusa ramos órfãos e ramos com dois donos. Acrescentar um ramo
     ao estado sem lhe dar célula passa a partir a verificação.
  E  Quadro de posse no separador de passagem de turno, com o botão de exportação
     junto às pendências de cada célula.

O que este patch deliberadamente NÃO faz: mover um único campo. A mudança de forma
fica para MIGRACOES[4], versão 4 para 5, quando o importador estiver assente. Depois
deste patch essa mudança é transcrição, não desenho, porque o mapa já existe.

Achado do mapa, registado aqui porque não se via em prosa: `dados.est` conflaciona os
setores e os meios aéreos, que são de Operações (arts. 17.º e 19.º), com a reserva e a
zona de apoio, que são áreas da ZCR e portanto de Logística (art. 32.º, n.º 1, al. b)).
O registo reparte-os ao nível do sub-ramo; a mudança de forma há de separá-los.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0030.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0031.html"

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
# A + B — registo de posse e acessores
# ═══════════════════════════════════════════════════════════════════
troca(
    '''function novoTurno(){''',
    '''/* ================= posse do estado por célula =================
   Cada ramo do estado tem exatamente um dono, e o dono é a célula a quem a lei
   atribui a matéria. O caminho é o do objeto `O`; a norma é a que sustenta a posse.
   Um ramo pode ser um sub-ramo: `dados.est.setores` é de Operações e `dados.est.res`
   é de Logística, porque a reserva é área da ZCR.
   Acrescentar um ramo ao estado sem o inscrever aqui parte `auditarPosse()`. */
const POSSE = [
  { k:"comando", n:"Comando", r:"DL n.º 90-A/2022, art. 12.º; Despacho n.º 4067/2024, arts. 14.º e 15.º",
    nota:"Não é célula: é o enquadramento. COS, coordenador do PCO e adjuntos.",
    ramos:[
      { p:"meta",        r:"art. 14.º",                 d:"Identificação, fase do SGO, nível DECIR e localização" },
      { p:"pco.funcoes", r:"art. 14.º, n.os 1 a 5",     d:"Composição do posto de comando e nomeações" },
      { p:"turno",       r:"art. 15.º, n.º 3, al. c); DON 2, 7.d.(30)", d:"Continuidade em espelho e rotatividade de funções" }
    ] },
  { k:"planeamento", n:"Planeamento", r:"Despacho n.º 4067/2024, arts. 26.º a 30.º",
    nota:"Elabora o plano estratégico de ação e assegura a sua permanente atualização.",
    ramos:[
      { p:"peas",             r:"art. 27.º, n.º 1, al. a)", d:"Planos estratégicos de ação emitidos" },
      { p:"csv",              r:"art. 29.º",                d:"Série meteorológica — núcleo de antecipação" },
      { p:"avisos",           r:"art. 28.º",                d:"Avisos do IPMA para o distrito do TO" },
      { p:"dados.area",       r:"art. 28.º",                d:"Área da zona de intervenção" },
      { p:"dados.perimNome",  r:"art. 28.º",                d:"Perímetro carregado" },
      { p:"dados.sensiveis",  r:"art. 28.º; art. 27.º, n.º 1, al. b)", d:"Aglomerados e pontos sensíveis" },
      { p:"dados.anexos",     r:"art. 28.º",                d:"Anexos do quadro de informações" },
      { p:"dados.topo",       r:"art. 28.º",                d:"Exposição, declive e razão declive/vento" },
      { p:"dados.perfil",     r:"art. 28.º",                d:"Perfil de elevação do eixo" }
    ] },
  { k:"operacoes", n:"Operações", r:"Despacho n.º 4067/2024, arts. 16.º a 25.º",
    nota:"Executa e implementa as decisões do plano e transmite as ordens de missão.",
    ramos:[
      { p:"dados.est.n",       r:"art. 17.º, n.º 1, al. d)", d:"Número de setores" },
      { p:"dados.est.setores", r:"art. 17.º, n.º 1, als. a) e d)", d:"Setorização, estados e forças atribuídas" },
      { p:"dados.est.aer",     r:"art. 19.º",                d:"Contagem de meios aéreos (derivada)" },
      { p:"dados.est.aerL",    r:"art. 19.º",                d:"Meios aéreos no TO — núcleo de meios aéreos" },
      { p:"dados.est.livre",   r:"art. 17.º",                d:"Modo de composição do dispositivo" },
      { p:"dados.setores",     r:"art. 17.º, n.º 1, al. a)", d:"Quadro geral do dispositivo (derivado)" },
      { p:"evolucao",          r:"art. 17.º, n.º 1, al. a); DON 2, 7.e.(4)(o)", d:"Evolução da situação e pontos de situação" },
      { p:"fita",              r:"art. 17.º, n.º 1, al. g)", d:"Fita do tempo" }
    ] },
  { k:"logistica", n:"Logística e Finanças", r:"Despacho n.º 4067/2024, arts. 31.º a 35.º",
    nota:"Garante a sustentação logística do teatro de operações.",
    ramos:[
      { p:"pco.canais",     r:"art. 32.º, n.º 1, al. d); art. 34.º", d:"Plano de comunicações e canais atribuídos" },
      { p:"dados.pt",       r:"DL n.º 90-A/2022, art. 13.º, al. c); art. 32.º, n.º 1, al. b); DON 2, 7.d.(5), (7) e (8)", d:"Ponto de trânsito na zona de concentração e reserva" },
      { p:"dados.est.res",  r:"art. 32.º, n.º 1, al. b); art. 33.º", d:"Reserva tática" },
      { p:"dados.est.za",   r:"art. 32.º, n.º 1, al. b)", d:"Zona de apoio" }
    ] },
  { k:"infra", n:"Infraestrutura", r:"—",
    nota:"Não é célula nem matéria de comando: é a mecânica do ficheiro gravado.",
    ramos:[ { p:"versao", r:"—", d:"Versão do esquema do estado gravado" } ] }
];

/* Dono de um caminho, por prefixo mais longo: `dados.est.res` pertence a Logística
   ainda que `dados.est.setores` pertença a Operações. */
function donoDoRamo(caminho){
  let melhor = null, comp = -1;
  POSSE.forEach(c=>c.ramos.forEach(r=>{
    if((caminho === r.p || caminho.indexOf(r.p + ".") === 0) && r.p.length > comp){
      comp = r.p.length; melhor = {celula:c.k, nome:c.n, ramo:r};
    }
  }));
  return melhor;
}
function celulaPorChave(k){ return POSSE.find(c=>c.k===k) || null; }
function ramosDaCelula(k){ const c = celulaPorChave(k); return c? c.ramos : []; }

/* Lê um caminho pontuado sem rebentar em ramo ausente. */
function lerRamo(raiz, caminho){
  return String(caminho).split(".").reduce((o,k)=> (o==null? undefined : o[k]), raiz);
}

/* Instantâneo do que uma célula possui, na forma em que está gravado. */
function instantaneoCelula(k){
  const out = {};
  ramosDaCelula(k).forEach(r=>{
    const v = lerRamo(O, r.p);
    if(v !== undefined) out[r.p] = JSON.parse(JSON.stringify(v));
  });
  return out;
}

/* Percorre as folhas do estado e confronta-as com o registo. É este o mecanismo que
   impede a posse de voltar a diluir-se: um ramo novo sem dono parte a verificação. */
function auditarPosse(estado){
  const raiz = estado || novoEstado(), folhas = [];
  (function anda(o, pre){
    Object.keys(o).forEach(k=>{
      const v = o[k], p = pre? pre+"."+k : k;
      if(v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) anda(v, p);
      else folhas.push(p);
    });
  })(raiz, "");
  const orfaos = folhas.filter(p=>!donoDoRamo(p));
  /* Um caminho declarado por duas células é ambiguidade de posse, e é pior do que
     um ramo orfao: as duas entregam-no e nenhuma o assume. */
  const vistos = {}, duplicados = [];
  POSSE.forEach(c=>{
    c.ramos.forEach(r=>{
      if(vistos[r.p]) duplicados.push(r.p + " (" + vistos[r.p] + " e " + c.k + ")");
      else vistos[r.p] = c.k;
    });
  });
  return { folhas: folhas.length, orfaos: orfaos, duplicados: duplicados };
}

/* Exportação por célula. Uma verdade por domínio aplicada dentro do próprio PCO:
   quem entrega uma célula entrega o que essa célula possui, e nada mais. */
function pacoteCelula(k){
  const c = celulaPorChave(k);
  if(!c) throw new Error("célula desconhecida: " + k);
  return { tipo:"peaapp:celula", celula:c.k, designacao:c.n, base:c.r,
    versao:VERSAO_ESTADO, g:gdhAgora(),
    ocorrencia:{ num:O.meta.num||"", local:O.meta.local||"", fase:O.meta.fase||"" },
    ramos: instantaneoCelula(k),
    posse: c.ramos.map(r=>({ caminho:r.p, base:r.r, materia:r.d })) };
}
function exportarCelula(k){
  try{
    const c = celulaPorChave(k); if(!c) return;
    const num = String(O.meta.num||"sem-num").replace(/[^\\w.-]+/g,"-");
    descarregar("CSREPCDouro_celula-"+c.k+"_ocorrencia-"+num+"_"+carimboFich()+"_EstacaoPEA_CLD.json",
      JSON.stringify(pacoteCelula(k), null, 2));
    fita("Exportado o estado da célula de "+c.n+" ("+ramosDaCelula(k).length+" ramos)");
    persistir(false);
  }catch(e){ aviso("msg-turno","err","Não foi possível exportar a célula ("+e.message+")."); }
}

function novoTurno(){''',
    "A1 registo de posse, acessores, auditoria e exportação"
)

# ═══════════════════════════════════════════════════════════════════
# E — quadro de posse no separador de passagem de turno
# ═══════════════════════════════════════════════════════════════════
troca(
    '''      <label for="tn-nota-${c.k}">Notas da célula para quem entra</label>''',
    '''      <div class="tn-posse">
        <span class="tn-pt">Possui ${(function(){ const R=ramosDaCelula(c.k); return R.length+" ramo"+(R.length===1?"":"s"); })()}</span>
        ${ramosDaCelula(c.k).map(r=>`<span class="tn-ramo" title="${esc(r.d)} — ${esc(r.r)}">${esc(r.p)}</span>`).join("")}
        <button class="btn btn-g" type="button" data-expcel="${c.k}">Exportar o que esta célula possui</button>
      </div>
      <label for="tn-nota-${c.k}">Notas da célula para quem entra</label>''',
    "E1 ramos possuídos e botão de exportação"
)

troca(
    '''  q.querySelectorAll("[data-tnota]").forEach(el=>el.addEventListener("change", ()=>{
    turnoObj().celulas[el.dataset.tnota].nota = el.value.trim(); persistir(false);
  }));''',
    '''  q.querySelectorAll("[data-tnota]").forEach(el=>el.addEventListener("change", ()=>{
    turnoObj().celulas[el.dataset.tnota].nota = el.value.trim(); persistir(false);
  }));
  q.querySelectorAll("[data-expcel]").forEach(b=>b.addEventListener("click", ()=>exportarCelula(b.dataset.expcel)));
  /* Um ramo do estado sem célula atribuída não pode passar despercebido: a posse
     por célula é a base da entrega de turno e da exportação. */
  try{
    const a = auditarPosse(O), av = document.getElementById("tn-orfaos");
    if(av){
      const mau = a.orfaos.length || a.duplicados.length;
      av.style.display = mau? "block" : "none";
      av.className = "msg err";
      if(mau) av.textContent = "Posse por confirmar: "
        + (a.orfaos.length? a.orfaos.length+" ramo(s) do estado sem célula atribuída — "+a.orfaos.slice(0,6).join(", ") : "")
        + (a.duplicados.length? (a.orfaos.length? " · ":"")+"ramo(s) com dois donos — "+a.duplicados.join(", ") : "");
    }
  }catch(e){}''',
    "E2 ligação dos botões e auditoria visível"
)

troca(
    '''      <h2>Estado e pendências por célula <span class="tag">composição automática — corrigir e acrescentar</span></h2>
      <div id="tn-quadro"></div>''',
    '''      <h2>Estado e pendências por célula <span class="tag">composição automática — corrigir e acrescentar</span></h2>
      <div class="msg" id="tn-orfaos" style="display:none"></div>
      <div id="tn-quadro"></div>''',
    "E3 aviso de posse por confirmar"
)

troca(
    '''  .tn-l dd ul{margin:0;padding-left:18px} .tn-l dd li{margin:1px 0}''',
    '''  .tn-l dd ul{margin:0;padding-left:18px} .tn-l dd li{margin:1px 0}
  .tn-posse{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:0 0 12px;padding-top:10px;border-top:1px solid var(--line)}
  .tn-pt{font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;color:var(--tx2);margin-right:2px}
  .tn-ramo{font-family:var(--mono);font-size:11px;color:var(--tx);background:var(--surf2);border:1px solid var(--line);border-radius:5px;padding:2px 7px;cursor:help}
  .tn-posse .btn{margin-left:auto}
  @media(max-width:820px){ .tn-posse .btn{margin-left:0;width:100%} }''',
    "E4 estilo do quadro de posse"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
