/* ================= PLANEAMENTO · elaboração assistida do PEA (art. 27.º, al. a)) ================= */
/* Adaptador de modelo de linguagem — três modos declarados, nenhum silencioso.
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
/**
 * Pergunta ao modelo de linguagem, quando há relé configurado.
 *
 * Em `file://` não há, e lança — é o modo normal no posto de comando, e a redação
 * determinística assume. A assistência é conveniência; o plano não depende dela.
 */
async function llm(prompt){
  if(LLM.modo==="manual") throw "modo manual (file://): sem relé de modelo configurado";
  const r = await fetchT(LLM.url,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]}), semCache:true}, 60000);
  if(!r.ok) throw "HTTP "+r.status+" ("+LLM.modo+")";
  const d=await r.json();
  const t=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n").replace(/```json|```/g,"").trim();
  return JSON.parse(t);
}
/** Diz em que modo a proposta vai ser redigida, e porquê. Nunca fica implícito. */
function pintarModoLLM(){
  const e=document.getElementById("llm-modo"); if(!e) return;
  e.className = "msg " + (LLM.modo==="manual" ? "err" : "ok");
  e.style.display = "block";
  e.textContent = "Modo de redação: " + LLM.rot + ". " + LLM.nota;
}
/**
 * O que o modelo precisa de saber para propor: a ocorrência, o dispositivo, o que mudou.
 *
 * Monta-se aqui e não se dispersa, porque é preciso poder ler de uma vez **o que sai
 * daqui para fora** — e o que não sai.
 */
function contexto(n, novas, anterior){
  return `OCORRÊNCIA: n.º ${O.meta.num}, ${O.meta.local}; PCO ${O.meta.pco}; fase SGO ${O.meta.fase}; área ${O.dados.area||"?"} ha${O.dados.perimNome? " (perímetro: "+O.dados.perimNome+")":""}.
SETORES E MEIOS (app PCO):
${O.dados.setores||"(não fornecidos)"}
PONTOS SENSÍVEIS: ${O.dados.sensiveis||"(não fornecidos)"}
${anterior? "PEA ANTERIOR (n.º "+anterior.n+"): objetivo: "+JSON.stringify(pecas(anterior).pea.objetivo)+"; propostas: "+JSON.stringify((pecas(anterior).pea.propostas||[]).map(p=>p.texto)) : "É o primeiro PEA da ocorrência."}
EVOLUÇÃO DESDE O PEA ANTERIOR:
${novas.length? novas.map(e=>e.g+" ["+e.tipo+"] "+e.txt).join("\n") : "(sem registos novos)"}
MÉTRICAS METEOROLÓGICAS CALCULADAS (usa exatamente estes valores; nunca recalcules):
${JSON.stringify(metricas())}`;
}
/* Célula de PLANEAMENTO — art. 27.º, n.º 1, al. a): elaborar o plano estratégico de
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
}
/* Célula de OPERAÇÕES — art. 17.º, n.º 1: executar e implementar as decisões
   operacionais estabelecidas no PEA e transmitir as ordens de missão aos comandantes
   de setor, de frente e de área (al. c)). Recebe o plano; não o reescreve. */
async function gerarOrdens(n, novas, anterior, pea){
  /* A aprovação afirmada aqui tem agora de existir. Enquanto as ordens eram produzidas
     no mesmo fôlego da proposta, este texto dizia ao modelo que o COS tinha aprovado um
     plano que ninguém tinha visto — e o modelo trabalhava sobre essa ficção. A função só
     é chamada a partir de `aprovarPEA`, e o nome e o GDH que aqui entram são os que
     ficaram registados. */
  const ap = (O.peas.find(x=>x.n === n) || {}).aprovacao || {};
  const quem = ap.por? (ap.funcao||"COS")+" "+ap.por : "o COS";
  const quando = ap.g? " em "+ap.g : "";
  const j = await llm(`És a célula de operações de um PCO da proteção civil portuguesa (SGO — Despacho n.º 4067/2024). A célula de planeamento elaborou o plano estratégico de ação n.º ${n} e ${quem} aprovou-o e determinou-o${quando}. Compete-te executar e implementar as decisões nele estabelecidas e transmitir as ordens de missão aos comandantes de setor, de frente e de área — art. 17.º, n.º 1, al. c). Não alteres o objetivo nem as prioridades do plano: converte-os em ordens executáveis, com atribuição e GDH limite.

PLANO ESTRATÉGICO DE AÇÃO APROVADO POR ${quem.toUpperCase()}${quando}: ${JSON.stringify(pea)}

${contexto(n,novas,anterior)}

Responde APENAS JSON válido, sem markdown:
{"missoes":[{"tipo":"Ação decisiva","texto":"ordem executável derivada do objetivo do plano","atribuida":"setor(es)/reserva/meios aéreos com base nos setores fornecidos","gdh":"DDHHMMAGO26"}, mais 3-4 de tipo "Ação de moldagem" derivadas das prioridades táticas do plano]}`);
  if(!Array.isArray(j.missoes)||!j.missoes.length) throw "ordens de missão incompletas";
  return j;
}

