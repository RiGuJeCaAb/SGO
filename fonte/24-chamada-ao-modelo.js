/* ================= chamada ao modelo ================= */
async function llm(prompt){
  const r = await fetchT("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]}), semCache:true}, 60000);
  if(!r.ok) throw "HTTP "+r.status;
  const d=await r.json();
  const t=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n").replace(/```json|```/g,"").trim();
  return JSON.parse(t);
}
function contexto(n, novas, anterior){
  return `OCORRÊNCIA: n.º ${O.meta.num}, ${O.meta.local}; PCO ${O.meta.pco}; fase SGO ${O.meta.fase}; área ${O.dados.area||"?"} ha${O.dados.perimNome? " (perímetro: "+O.dados.perimNome+")":""}.
SETORES E MEIOS (app PCO):
${O.dados.setores||"(não fornecidos)"}
PONTOS SENSÍVEIS: ${O.dados.sensiveis||"(não fornecidos)"}
${anterior? "PEA ANTERIOR (n.º "+anterior.n+"): objetivo: "+JSON.stringify((anterior.json.ops||anterior.json).objetivo)+"; propostas: "+JSON.stringify(((anterior.json.ops||anterior.json).propostas||[]).map(p=>p.texto)) : "É o primeiro PEA da ocorrência."}
EVOLUÇÃO DESDE O PEA ANTERIOR:
${novas.length? novas.map(e=>e.g+" ["+e.tipo+"] "+e.txt).join("\n") : "(sem registos novos)"}
MÉTRICAS METEOROLÓGICAS CALCULADAS (usa exatamente estes valores; nunca recalcules):
${JSON.stringify(metricas())}`;
}
async function gerarPlan(n, novas, anterior){
  const j = await llm(`És a célula de planeamento de um PCO da proteção civil portuguesa (SGO — Despacho n.º 4067/2024). Preparas a parte de PLANEAMENTO da proposta de PEA n.º ${n}${anterior? " (substitui o n.º "+anterior.n+")":""}. Português europeu, registo operacional.

${contexto(n,novas,anterior)}

Responde APENAS JSON válido, sem markdown:
{"situacao":"POSIT sintetizado com estado por setor e a evolução registada (4-6 frases; usa os setores fornecidos)",
"analise_zi":"análise da zona de intervenção face à área, aos pontos sensíveis e à meteorologia (3-5 frases, cada uma com a consequência operacional)",
"previsao":"parágrafo de previsão operacional citando janela, HR, temperaturas, rotações e perigos exatamente com os valores dados"}`);
  if(!j.situacao||!j.previsao) throw "planeamento incompleto";
  return j;
}
async function gerarOps(n, novas, anterior, plan){
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
}

