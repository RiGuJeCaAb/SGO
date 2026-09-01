#!/usr/bin/env python3
"""
p0001 — repartição por células e autoria do PEA          r0022 -> r0023
CSREPC Douro · Estação PEA

Base legal: Despacho n.º 4067/2024, arts. 17.º, 23.º a 30.º; DON n.º 2 / DECIR 2026, ponto 7.e.(27).

  A  FUNCOES_PCO: núcleos de especialistas (art. 30.º), segurança (art. 23.º),
     emergência médica (art. 24.º) e apoio psicossocial (art. 25.º); correcção
     das referências de informações (28.º) e antecipação (29.º).
  B  Autoria do PEA: planeamento elabora o plano na íntegra (art. 27.º, n.º 1, al. a));
     operações converte-o em ordens de missão (art. 17.º, n.º 1, al. c)).
  C  Migração do formato gravado dos PEA, pela escada MIGRACOES já existente em r0022.
  D  Adaptador de modelo com três modos declarados: sandbox, relé, manual.

Rebase sobre r0022: 16 das 19 âncoras do trabalho anterior mantiveram-se intactas.
As três restantes foram refeitas — llm() passou a usar fetchT; o versionamento de
estado passou a existir em r0022 (VERSAO_ESTADO + MIGRACOES) e é esse que se usa,
em vez do contador paralelo que se tinha proposto antes.
"""
import io

SRC = "r0022.html"
DST = "r0023.html"

s = io.open(SRC, encoding="utf-8").read()
N = [0]

def troca(ancora, novo, nome):
    global s
    c = s.count(ancora)
    assert c == 1, "[%s] ancora encontrada %d vezes, esperava 1:\n%s" % (nome, c, ancora[:160])
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print("  ok  " + nome)

# ═══════════════════════════════════════════════════════════════════
# A — núcleos das células
# ═══════════════════════════════════════════════════════════════════
troca(
    '  {f:"Núcleo de Monitorização e Controlo", r:"art. 18.º", g:"Operações", fase:4},',
    '  {f:"Núcleo de Monitorização e Controlo", r:"art. 18.º, n.º 1 — obrigatório na fase IV ou superior", g:"Operações", fase:4},\n'
    '  {f:"Núcleo de Segurança", r:"art. 23.º", g:"Operações", fase:3, ext:"força de segurança territorialmente competente"},\n'
    '  {f:"Núcleo de Emergência Médica", r:"art. 24.º", g:"Operações", fase:4, ext:"INEM, I.P."},\n'
    '  {f:"Núcleo de Apoio Psicológico e Social de Emergência", r:"art. 25.º", g:"Operações", fase:5, ext:"Instituto da Segurança Social, I.P."},',
    "A1 núcleos de operações (arts. 23.º a 25.º)"
)
troca(
    '  {f:"Núcleo de Informações", r:"art. 29.º", g:"Planeamento", fase:4},',
    '  {f:"Núcleo de Informações", r:"art. 28.º", g:"Planeamento", fase:4},\n'
    '  {f:"Núcleo de Especialistas", r:"art. 30.º · DON 2, ponto 7.e.(27)", g:"Planeamento", fase:4},',
    "A2 núcleo de especialistas (art. 30.º)"
)
troca(
    '  {f:"Núcleo de Antecipação", r:"art. 28.º", g:"Planeamento", fase:4},',
    '  {f:"Núcleo de Antecipação", r:"art. 29.º", g:"Planeamento", fase:4},',
    "A3 correcção de artigos (28.º informações / 29.º antecipação)"
)

# ═══════════════════════════════════════════════════════════════════
# D — adaptador de modelo (refeito: r0022 passou llm() a usar fetchT)
# ═══════════════════════════════════════════════════════════════════
troca(
    '''async function llm(prompt){
  const r = await fetchT("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]}), semCache:true}, 60000);
  if(!r.ok) throw "HTTP "+r.status;
  const d=await r.json();
  const t=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\\n").replace(/```json|```/g,"").trim();
  return JSON.parse(t);
}''',
    '''/* Adaptador de modelo de linguagem — três modos declarados, nenhum silencioso.
   sandbox : dentro do ambiente Claude; as credenciais são injetadas pelo ambiente.
   rele    : servido por http(s); a chave vive no lançador local, nunca no ficheiro.
   manual  : aberto de file://; sem acesso a modelo. O PEA sai determinístico.
   Até r0022 este pedido seguia sempre para api.anthropic.com sem credenciais, o que
   fora do ambiente Claude devolvia 401 e fazia cair no determinístico sem o dizer. */
const LLM = (()=>{
  const sandbox = (typeof window!=="undefined" && window.storage && typeof window.storage.set==="function");
  const servido = (location.protocol==="http:" || location.protocol==="https:");
  if(sandbox) return {modo:"sandbox", url:"https://api.anthropic.com/v1/messages",
    rot:"IA · ambiente Claude",
    nota:"Redação assistida disponível — credenciais fornecidas pelo ambiente."};
  if(servido) return {modo:"rele", url:location.origin+"/pea/llm",
    rot:"IA · relé local",
    nota:"Redação assistida através do relé local em "+location.origin+"/pea/llm."};
  return {modo:"manual", url:null,
    rot:"Determinística",
    nota:"Ficheiro aberto de file:// — sem acesso a modelo. O PEA é elaborado por regras determinísticas, sem redação assistida."};
})();
async function llm(prompt){
  if(LLM.modo==="manual") throw "modo manual (file://): sem relé de modelo configurado";
  const r = await fetchT(LLM.url,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]}), semCache:true}, 60000);
  if(!r.ok) throw "HTTP "+r.status+" ("+LLM.modo+")";
  const d=await r.json();
  const t=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\\n").replace(/```json|```/g,"").trim();
  return JSON.parse(t);
}
function pintarModoLLM(){
  const e=document.getElementById("llm-modo"); if(!e) return;
  e.className = "msg " + (LLM.modo==="manual" ? "err" : "ok");
  e.style.display = "block";
  e.textContent = "Modo de redação: " + LLM.rot + ". " + LLM.nota;
}''',
    "D1 adaptador de modelo"
)
troca(
    '''      <div class="row">
        <button class="btn btn-o" id="b-gerar">Emitir proposta de PEA</button>
      </div>
      <div class="msg" id="msg-ia"></div>''',
    '''      <div class="msg" id="llm-modo" style="display:none"></div>
      <div class="row">
        <button class="btn btn-o" id="b-gerar">Emitir proposta de PEA</button>
      </div>
      <div class="msg" id="msg-ia"></div>''',
    "D2 indicador de modo no painel do PEA"
)
troca(
    '$("b-gerar").onclick=emitirPEA;',
    '$("b-gerar").onclick=emitirPEA;\ntry{ pintarModoLLM(); }catch(e){}',
    "D3 arranque do indicador"
)

# ═══════════════════════════════════════════════════════════════════
# B — autoria do PEA
# ═══════════════════════════════════════════════════════════════════
troca(
    '''async function gerarPlan(n, novas, anterior){
  const j = await llm(`És a célula de planeamento de um PCO da proteção civil portuguesa (SGO — Despacho n.º 4067/2024). Preparas a parte de PLANEAMENTO da proposta de PEA n.º ${n}${anterior? " (substitui o n.º "+anterior.n+")":""}. Português europeu, registo operacional.

${contexto(n,novas,anterior)}

Responde APENAS JSON válido, sem markdown:
{"situacao":"POSIT sintetizado com estado por setor e a evolução registada (4-6 frases; usa os setores fornecidos)",
"analise_zi":"análise da zona de intervenção face à área, aos pontos sensíveis e à meteorologia (3-5 frases, cada uma com a consequência operacional)",
"previsao":"parágrafo de previsão operacional citando janela, HR, temperaturas, rotações e perigos exatamente com os valores dados"}`);
  if(!j.situacao||!j.previsao) throw "planeamento incompleto";
  return j;
}''',
    '''/* Célula de PLANEAMENTO — art. 27.º, n.º 1, al. a): elaborar o plano estratégico de
   ação, para aprovação pelo COS, e assegurar a sua permanente atualização. O PEA é
   integralmente de planeamento; operações não o co-escreve. */
async function gerarPEA(n, novas, anterior){
  const j = await llm(`És a célula de planeamento de um PCO da proteção civil portuguesa (SGO — Despacho n.º 4067/2024). Compete-te elaborar o plano estratégico de ação (PEA) na íntegra, para aprovação pelo COS — art. 27.º, n.º 1, al. a). Elaboras a proposta de PEA n.º ${n}${anterior? " (substitui o n.º "+anterior.n+")":""}. Português europeu, registo operacional. Não redijas ordens de missão: essas são transmitidas pela célula de operações depois de o COS aprovar o plano.

${contexto(n,novas,anterior)}

Responde APENAS JSON válido, sem markdown:
{"situacao":"POSIT sintetizado com estado por setor e a evolução registada (4-6 frases; usa os setores fornecidos)",
"analise_zi":"análise da zona de intervenção face à área, aos pontos sensíveis e à meteorologia (3-5 frases, cada uma com a consequência operacional)",
"previsao":"parágrafo de previsão operacional citando janela, HR, temperaturas, rotações e perigos exatamente com os valores dados",
"objetivo":"frase única com o efeito desejado e o GDH limite derivado da janela",
"propostas":[{"id":"P1","texto":"prioridade tática","fundamento":"1 frase ligada às métricas ou à evolução"} 5 a 7 itens por ordem de prioridade — mantém do PEA anterior o que continua válido, altera o que a evolução mudou],
"seguranca":["4-6 medidas ligadas às horas críticas, rotações e trabalho noturno"],
"validade":"GDH de validade recomendado e gatilhos de revisão"}`);
  if(!j.situacao||!j.previsao||!j.objetivo||!Array.isArray(j.propostas)) throw "plano estratégico de ação incompleto";
  return j;
}''',
    "B1 gerarPEA — planeamento elabora o plano"
)
troca(
    '''async function gerarOps(n, novas, anterior, plan){
  const j = await llm(`És a célula de operações do mesmo PCO (SGO 4067/2024), a completar a proposta de PEA n.º ${n}. A célula de planeamento escreveu: ${JSON.stringify(plan)}.

${contexto(n,novas,anterior)}

Responde APENAS JSON válido, sem markdown:
{"propostas":[{"id":"P1","texto":"...","fundamento":"1 frase ligada às métricas ou à evolução"} 5 a 7 itens por prioridade — mantém do PEA anterior o que continua válido, altera o que a evolução mudou],
"objetivo":"frase única com efeito desejado e GDH limite derivado da janela",
"missoes":[{"tipo":"Ação decisiva","texto":"...","atribuida":"setor(es)/reserva/meios aéreos com base nos setores fornecidos","gdh":"DDHHMMAGO26"}, mais 3-4 de tipo "Ação de moldagem"],
"seguranca":["4-6 medidas ligadas às horas críticas, rotações e trabalho noturno"],
"validade":"GDH de validade recomendado e gatilhos de revisão"}`);
  if(!Array.isArray(j.propostas)||!Array.isArray(j.missoes)) throw "operações incompletas";
  return j;
}''',
    '''/* Célula de OPERAÇÕES — art. 17.º, n.º 1: executar e implementar as decisões
   operacionais estabelecidas no PEA e transmitir as ordens de missão aos comandantes
   de setor, de frente e de área (al. c)). Recebe o plano; não o reescreve. */
async function gerarOrdens(n, novas, anterior, pea){
  const j = await llm(`És a célula de operações de um PCO da proteção civil portuguesa (SGO — Despacho n.º 4067/2024). A célula de planeamento elaborou o plano estratégico de ação n.º ${n} e o COS aprovou-o. Compete-te executar e implementar as decisões nele estabelecidas e transmitir as ordens de missão aos comandantes de setor, de frente e de área — art. 17.º, n.º 1, al. c). Não alteres o objetivo nem as prioridades do plano: converte-os em ordens executáveis, com atribuição e GDH limite.

PLANO ESTRATÉGICO DE AÇÃO APROVADO: ${JSON.stringify(pea)}

${contexto(n,novas,anterior)}

Responde APENAS JSON válido, sem markdown:
{"missoes":[{"tipo":"Ação decisiva","texto":"ordem executável derivada do objetivo do plano","atribuida":"setor(es)/reserva/meios aéreos com base nos setores fornecidos","gdh":"DDHHMMAGO26"}, mais 3-4 de tipo "Ação de moldagem" derivadas das prioridades táticas do plano]}`);
  if(!Array.isArray(j.missoes)||!j.missoes.length) throw "ordens de missão incompletas";
  return j;
}''',
    "B2 gerarOrdens — operações transmite as ordens"
)
troca('function detPlan(novas, anterior){', 'function detSituacao(novas, anterior){', "B3 detSituacao")
troca('function detOps(novas, anterior){',  'function detDecisao(novas, anterior){',  "B4 detDecisao")

troca(
    '''/* ================= emitir PEA ================= */
async function emitirPEA(){''',
    '''/* Repartição determinística pela fronteira do Despacho n.º 4067/2024: tudo o que é
   plano vai para planeamento; só as ordens de missão ficam em operações. */
function detCompleto(novas, anterior){
  const a = detSituacao(novas, anterior), b = detDecisao(novas, anterior);
  return {
    pea: {situacao:a.situacao, analise_zi:a.analise_zi, previsao:a.previsao,
          objetivo:b.objetivo, propostas:b.propostas, seguranca:b.seguranca, validade:b.validade},
    ordens: {missoes:b.missoes}
  };
}
/* Leitura normalizada de um PEA, seja qual for o formato em que foi gravado.
   Antes da versão 2 do estado: json {plan,ops} ou json plano à raiz.
   A partir da versão 2: json {pea,ordens}. Pura — não toca no estado global,
   e por isso é utilizável de dentro de MIGRACOES. */
function pecas(p){
  const j = (p && p.json) || {};
  if(j.pea) return {pea:j.pea, ordens:j.ordens || {missoes:[]}};
  const plan = j.plan || {situacao:j.situacao, analise_zi:j.analise||"", previsao:j.previsao};
  const ops  = j.ops  || j;
  return {
    pea: {situacao:plan.situacao, analise_zi:plan.analise_zi, previsao:plan.previsao,
          objetivo:ops.objetivo, propostas:ops.propostas||[], seguranca:ops.seguranca||[], validade:ops.validade},
    ordens: {missoes:ops.missoes||[]}
  };
}
/* ================= emitir PEA ================= */
async function emitirPEA(){''',
    "B5 detCompleto + pecas"
)
troca(
    '''  let plan=null, ops=null, modo="IA · claude-sonnet-4-6 (2 células)";
  try{
    plan = await gerarPlan(n,novas,anterior);
    btn.innerHTML='<span class="spin"></span> Operações…';
    ops = await gerarOps(n,novas,anterior,plan);
  }catch(e){
    modo="Determinística";
    aviso("msg-ia","ok","Modelo indisponível ("+String(e).slice(0,80)+") — emitida a versão determinística completa.");
    plan = detPlan(novas,anterior); ops = detOps(novas,anterior);
  }''',
    '''  let plano=null, ordens=null, modo=LLM.rot+" · planeamento elabora, operações transmite";
  try{
    plano = await gerarPEA(n,novas,anterior);
    btn.innerHTML='<span class="spin"></span> Ordens de missão…';
    ordens = await gerarOrdens(n,novas,anterior,plano);
  }catch(e){
    modo="Determinística";
    aviso("msg-ia", LLM.modo==="manual"?"ok":"err",
      (LLM.modo==="manual"
        ? "Sem acesso a modelo neste modo de arranque — PEA elaborado por regras determinísticas."
        : "Modelo indisponível ("+String(e).slice(0,80)+") — emitida a versão determinística completa."));
    const d = detCompleto(novas,anterior); plano = d.pea; ordens = d.ordens;
  }''',
    "B6 corpo de emitirPEA"
)
troca(
    '    modo, json:{plan,ops}, met:mm,',
    '    modo, json:{pea:plano, ordens}, met:mm,',
    "B7 gravação em {pea,ordens}"
)
troca(
    '    base:baseVigor(), ctrl:controloMissoes(ops), ultVerd:"vigor",',
    '    base:baseVigor(), ctrl:controloMissoes(Object.assign({}, plano, ordens)), ultVerd:"vigor",',
    "B8 controlo de missões sobre o conjunto"
)
troca(
    '${anterior? "PEA ANTERIOR (n.º "+anterior.n+"): objetivo: "+JSON.stringify((anterior.json.ops||anterior.json).objetivo)+"; propostas: "+JSON.stringify(((anterior.json.ops||anterior.json).propostas||[]).map(p=>p.texto)) : "É o primeiro PEA da ocorrência."}',
    '${anterior? "PEA ANTERIOR (n.º "+anterior.n+"): objetivo: "+JSON.stringify(pecas(anterior).pea.objetivo)+"; propostas: "+JSON.stringify((pecas(anterior).pea.propostas||[]).map(p=>p.texto)) : "É o primeiro PEA da ocorrência."}',
    "B9 contexto lê pelo acessor"
)
troca(
    '''  const plan = p.json.plan || {situacao:p.json.situacao, analise_zi:p.json.analise||"", previsao:p.json.previsao};
  const ops  = p.json.ops  || p.json;''',
    '''  const _pc = pecas(p);
  const plan = _pc.pea;                                  /* célula de planeamento — art. 27.º */
  const ops  = Object.assign({}, _pc.pea, _pc.ordens);   /* + ordens de missão — art. 17.º, al. c) */''',
    "B10 render pelo acessor"
)

# ═══════════════════════════════════════════════════════════════════
# C — migração pela escada de r0022 (não por contador paralelo)
# ═══════════════════════════════════════════════════════════════════
troca('const VERSAO_ESTADO = 1;', 'const VERSAO_ESTADO = 2;', "C1 VERSAO_ESTADO 1 -> 2")
troca(
    '''    return e;
  }
];
''',
    '''    return e;
  },
  /* 1 -> 2 · Repartição do PEA pelas células que a lei lhe atribui. Até aqui o plano
     era gravado em json {plan,ops}, com o objetivo, as prioridades, a segurança e a
     validade do lado de operações. O art. 27.º, n.º 1, al. a) do Despacho n.º
     4067/2024 põe o plano estratégico de ação inteiro na célula de planeamento; a
     operações cabe transmitir as ordens de missão (art. 17.º, n.º 1, al. c)).
     Passa a gravar-se json {pea,ordens}. Nenhum conteúdo se perde: muda o dono.
     pecas() reconhece os dois formatos, pelo que a conversão é idempotente. */
  e => {
    (e.peas||[]).forEach(p=>{
      if(p && p.json && !p.json.pea){ const c = pecas(p); p.json = {pea:c.pea, ordens:c.ordens}; }
    });
    return e;
  }
];
''',
    "C2 MIGRACOES[1] — {plan,ops} -> {pea,ordens}"
)

# ═══════════════════════════════════════════════════════════════════
# revisão
# ═══════════════════════════════════════════════════════════════════
troca(
    'protótipo <b>r0022</b> · <span style="font-family:var(--mono);font-size:11px">CSREPCDouro_r0022_202608281330_EstacaoPEA_CLD.html</span>',
    'protótipo <b>r0023</b> · <span style="font-family:var(--mono);font-size:11px">CSREPCDouro_r0023_202608281530_EstacaoPEA_CLD.html</span>',
    "R revisão no rodapé"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s (%s bytes)" % (N[0], DST, format(len(s.encode("utf-8")), ",")))
