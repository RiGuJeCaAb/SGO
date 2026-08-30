#!/usr/bin/env python3
"""
r0016 — dívida crítica
  P1  FUNCOES_PCO: núcleos de especialistas, segurança, emergência médica e apoio psicossocial
  P2  autoria do PEA: planeamento elabora (art. 27.º, n.º 1, al. a)); operações transmite ordens (art. 17.º, n.º 1, al. c))
  P3  esquema de estado versionado (esquema: 2) com migração das ocorrências guardadas
  P4  adaptador de modelo com três modos declarados: sandbox, relé, manual
"""
import sys, io

SRC = "base.html"
DST = "r0016.html"

with io.open(SRC, encoding="utf-8") as f:
    s = f.read()

N = [0]
def troca(ancora, novo, nome):
    """substitui ancora (que tem de existir exactamente uma vez) por novo"""
    global s
    c = s.count(ancora)
    assert c == 1, f"[{nome}] âncora encontrada {c} vezes, esperava 1:\n{ancora[:160]}"
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print(f"  ok  {nome}")

# ─────────────────────────────────────────────────────────────────────
# P1 — núcleos em falta na célula de operações (arts. 23.º, 24.º, 25.º)
# ─────────────────────────────────────────────────────────────────────
troca(
    '  {f:"Núcleo de Monitorização e Controlo", r:"art. 18.º", g:"Operações", fase:4},',
    '  {f:"Núcleo de Monitorização e Controlo", r:"art. 18.º, n.º 1 — obrigatório na fase IV ou superior", g:"Operações", fase:4},\n'
    '  {f:"Núcleo de Segurança", r:"art. 23.º", g:"Operações", fase:3, ext:"força de segurança territorialmente competente"},\n'
    '  {f:"Núcleo de Emergência Médica", r:"art. 24.º", g:"Operações", fase:4, ext:"INEM, I.P."},\n'
    '  {f:"Núcleo de Apoio Psicológico e Social de Emergência", r:"art. 25.º", g:"Operações", fase:5, ext:"Instituto da Segurança Social, I.P."},',
    "P1a núcleos de operações"
)

# P1 — núcleo de especialistas na célula de planeamento (art. 30.º)
troca(
    '  {f:"Núcleo de Informações", r:"art. 29.º", g:"Planeamento", fase:4},',
    '  {f:"Núcleo de Informações", r:"art. 28.º", g:"Planeamento", fase:4},\n'
    '  {f:"Núcleo de Especialistas", r:"art. 30.º · DON 2, ponto 7.e.(27)", g:"Planeamento", fase:4},',
    "P1b núcleo de especialistas"
)

# correcção de referência: antecipação é o art. 29.º, informações o art. 28.º
troca(
    '  {f:"Núcleo de Antecipação", r:"art. 28.º", g:"Planeamento", fase:4},',
    '  {f:"Núcleo de Antecipação", r:"art. 29.º", g:"Planeamento", fase:4},',
    "P1c correcção de artigos (28.º informações / 29.º antecipação)"
)

# ─────────────────────────────────────────────────────────────────────
# P4 — adaptador de modelo com três modos declarados
# ─────────────────────────────────────────────────────────────────────
troca(
    '''async function llm(prompt){
  const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
  if(!r.ok) throw "HTTP "+r.status;
  const d=await r.json();
  const t=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\\n").replace(/```json|```/g,"").trim();
  return JSON.parse(t);
}''',
    '''/* Adaptador de modelo de linguagem — três modos declarados, nenhum silencioso.
   sandbox : dentro do ambiente Claude; as credenciais são injectadas pelo ambiente.
   rele    : servido por http(s); a chave vive no lançador local, nunca no ficheiro.
   manual  : aberto de file://; sem acesso a modelo. O PEA sai determinístico. */
const LLM = (()=>{
  const sandbox = (typeof window!=="undefined" && window.storage && typeof window.storage.set==="function");
  const servido = (location.protocol==="http:" || location.protocol==="https:");
  if(sandbox) return {modo:"sandbox", url:"https://api.anthropic.com/v1/messages",
    rot:"IA · ambiente Claude", nota:"Redacção assistida disponível — credenciais fornecidas pelo ambiente."};
  if(servido) return {modo:"rele", url:location.origin+"/pea/llm",
    rot:"IA · relé local", nota:"Redacção assistida através do relé local em "+location.origin+"/pea/llm."};
  return {modo:"manual", url:null, rot:"Determinística",
    nota:"Ficheiro aberto de file:// — sem acesso a modelo. O PEA é elaborado por regras determinísticas, sem redacção assistida."};
})();
async function llm(prompt){
  if(LLM.modo==="manual") throw "modo manual (file://): sem relé de modelo configurado";
  const r = await fetch(LLM.url,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
  if(!r.ok) throw "HTTP "+r.status+" ("+LLM.modo+")";
  const d=await r.json();
  const t=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\\n").replace(/```json|```/g,"").trim();
  return JSON.parse(t);
}
function pintarModoLLM(){
  const e=document.getElementById("llm-modo"); if(!e) return;
  e.className = "msg " + (LLM.modo==="manual" ? "err" : "ok");
  e.style.display = "block";
  e.textContent = "Modo de redacção: " + LLM.rot + ". " + LLM.nota;
}''',
    "P4 adaptador de modelo"
)

# indicador visível do modo, junto ao botão de emissão
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
    "P4b indicador de modo"
)

# ─────────────────────────────────────────────────────────────────────
# P2 — autoria do PEA
# ─────────────────────────────────────────────────────────────────────

# Chamada 1: a célula de planeamento elabora o PEA completo (art. 27.º, n.º 1, al. a))
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
    '''/* Célula de PLANEAMENTO — art. 27.º, n.º 1, al. a): elaborar o plano estratégico de ação
   para aprovação pelo COS. O PEA é integralmente de planeamento. */
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
    "P2a gerarPEA (planeamento)"
)

# Chamada 2: a célula de operações converte o PEA aprovado em ordens de missão (art. 17.º, n.º 1, al. c))
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
    '''/* Célula de OPERAÇÕES — art. 17.º, n.º 1: executar e implementar as decisões operacionais
   estabelecidas no PEA e transmitir as ordens de missão (al. c)). Operações não co-escreve
   o plano: recebe-o e converte-o em ordens. */
async function gerarOrdens(n, novas, anterior, pea){
  const j = await llm(`És a célula de operações de um PCO da proteção civil portuguesa (SGO — Despacho n.º 4067/2024). A célula de planeamento elaborou o plano estratégico de ação n.º ${n} e o COS aprovou-o. Compete-te executar e implementar as decisões nele estabelecidas e transmitir as ordens de missão aos comandantes de setor, de frente e de área — art. 17.º, n.º 1, al. c). Não alteres o objetivo nem as prioridades do plano: converte-os em ordens executáveis, com atribuição e GDH limite.

PLANO ESTRATÉGICO DE AÇÃO APROVADO: ${JSON.stringify(pea)}

${contexto(n,novas,anterior)}

Responde APENAS JSON válido, sem markdown:
{"missoes":[{"tipo":"Ação decisiva","texto":"ordem executável derivada do objetivo do plano","atribuida":"setor(es)/reserva/meios aéreos com base nos setores fornecidos","gdh":"DDHHMMAGO26"}, mais 3-4 de tipo "Ação de moldagem" derivadas das prioridades táticas do plano]}`);
  if(!Array.isArray(j.missoes)||!j.missoes.length) throw "ordens de missão incompletas";
  return j;
}''',
    "P2b gerarOrdens (operações)"
)

# renomear os produtores determinísticos para nomes doutrinariamente honestos
troca('function detPlan(novas, anterior){', 'function detSituacao(novas, anterior){', "P2c detSituacao")
troca('function detOps(novas, anterior){',  'function detDecisao(novas, anterior){',  "P2d detDecisao")

# repartição determinística pela fronteira legal
troca(
    '''/* ================= emitir PEA ================= */
async function emitirPEA(){''',
    '''/* Repartição determinística pela fronteira do Despacho n.º 4067/2024:
   tudo o que é plano vai para planeamento; só as ordens de missão ficam em operações. */
function detCompleto(novas, anterior){
  const a = detSituacao(novas, anterior), b = detDecisao(novas, anterior);
  return {
    pea: {situacao:a.situacao, analise_zi:a.analise_zi, previsao:a.previsao,
          objetivo:b.objetivo, propostas:b.propostas, seguranca:b.seguranca, validade:b.validade},
    ordens: {missoes:b.missoes}
  };
}
/* Leitura normalizada de um PEA guardado, seja qual for o esquema em que foi gravado.
   esquema 1: json {plan,ops} ou json plano.   esquema 2: json {pea,ordens}. */
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
    "P2e detCompleto + pecas"
)

# corpo de emitirPEA: uma chamada de planeamento, uma de operações, gravação em esquema 2
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
    "P2f corpo de emitirPEA"
)

troca(
    '''    base:baseVigor(), ctrl:controloMissoes(ops), ultVerd:"vigor",
    modo, json:{plan,ops}, met:mm,''',
    '''    base:baseVigor(), ctrl:controloMissoes(Object.assign({}, plano, ordens)), ultVerd:"vigor",
    modo, json:{pea:plano, ordens}, met:mm,''',
    "P2g gravação em esquema 2"
)

# leitura do PEA anterior no contexto passa pelo acessor normalizado
troca(
    '${anterior? "PEA ANTERIOR (n.º "+anterior.n+"): objetivo: "+JSON.stringify((anterior.json.ops||anterior.json).objetivo)+"; propostas: "+JSON.stringify(((anterior.json.ops||anterior.json).propostas||[]).map(p=>p.texto)) : "É o primeiro PEA da ocorrência."}',
    '${anterior? "PEA ANTERIOR (n.º "+anterior.n+"): objetivo: "+JSON.stringify(pecas(anterior).pea.objetivo)+"; propostas: "+JSON.stringify((pecas(anterior).pea.propostas||[]).map(p=>p.texto)) : "É o primeiro PEA da ocorrência."}',
    "P2h contexto lê pelo acessor"
)

# render: alimentar as variáveis existentes pelo acessor, sem tocar no resto do template
troca(
    '''  const plan = p.json.plan || {situacao:p.json.situacao, analise_zi:p.json.analise||"", previsao:p.json.previsao};
  const ops  = p.json.ops  || p.json;''',
    '''  const _pc = pecas(p);
  const plan = _pc.pea;                                  /* célula de planeamento — art. 27.º */
  const ops  = Object.assign({}, _pc.pea, _pc.ordens);   /* + ordens de missão — art. 17.º, al. c) */''',
    "P2i render pelo acessor"
)

# ─────────────────────────────────────────────────────────────────────
# P3 — esquema versionado e migração
# ─────────────────────────────────────────────────────────────────────
troca(
    '''function novoEstado(){
  return { meta:{''',
    '''/* Versao do esquema de estado. Funcao, nao const: novoEstado() e invocada no arranque
   (let O = novoEstado()) antes desta linha, e uma const cairia na zona morta temporal. */
function esquemaAtual(){ return 2; }
function novoEstado(){
  return { esquema:esquemaAtual(), meta:{''',
    "P3a esquema no estado"
)

troca(
    '''    O = Object.assign(novoEstado(), carregado);
    O.dados = Object.assign(novoEstado().dados, carregado.dados||{});''',
    '''    O = Object.assign(novoEstado(), carregado);
    O.dados = Object.assign(novoEstado().dados, carregado.dados||{});
    migrarEsquema();''',
    "P3b migração ao carregar"
)

troca(
    '''function migrarEstado(v){''',
    '''/* Migração do esquema de estado. Idempotente: pecas() reconhece o formato já convertido. */
function migrarEsquema(){
  const antes = O.esquema || 1, alvo = esquemaAtual();
  if(antes >= alvo) { O.esquema = alvo; return 0; }
  let n = 0;
  (O.peas||[]).forEach(p=>{
    if(p && p.json && !p.json.pea){ const c = pecas(p); p.json = {pea:c.pea, ordens:c.ordens}; n++; }
  });
  O.esquema = alvo;
  if(n) try{ fita("Estado migrado do esquema "+antes+" para "+alvo+": "+n+" PEA reconvertidos para a repartição de células do Despacho n.º 4067/2024"); }catch(e){}
  return n;
}
function migrarEstado(v){''',
    "P3c migrarEsquema"
)

# ─────────────────────────────────────────────────────────────────────
# arranque: pintar o modo de redacção
# ─────────────────────────────────────────────────────────────────────
troca(
    '$("b-gerar").onclick=emitirPEA;',
    '$("b-gerar").onclick=emitirPEA;\ntry{ pintarModoLLM(); }catch(e){}',
    "P4c arranque do indicador"
)

# ─────────────────────────────────────────────────────────────────────
# revisão
# ─────────────────────────────────────────────────────────────────────
troca(
    'protótipo <b>r0015</b> · <span style="font-family:var(--mono);font-size:11px">CSREPCDouro_r0015_202608280012_EstacaoPEA_CLD.html</span>',
    'protótipo <b>r0016</b> · <span style="font-family:var(--mono);font-size:11px">CSREPCDouro_r0016_202608281107_EstacaoPEA_CLD.html</span>',
    "R revisão no rodapé"
)

with io.open(DST, "w", encoding="utf-8") as f:
    f.write(s)

print(f"\n{N[0]} correcções aplicadas · {DST} ({len(s.encode('utf-8')):,} bytes)")
