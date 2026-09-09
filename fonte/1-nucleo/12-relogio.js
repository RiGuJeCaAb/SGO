/* ================= NÚCLEO · relógio ================= */
/* Ponto único de leitura da hora. As verificações que dependem do relógio — prazos
   de ataque inicial e ampliado, notificação das duas horas, PMEPC às vinte e quatro,
   POSIT e rendições — aceitam o instante em argumento e só recorrem a este ponto
   quando não o recebem. É o que as torna exercitáveis com uma hora escolhida, em vez
   de dependerem do momento em que correm. São regras cuja falha tem consequência
   operacional: não podem ficar por testar. */
function agora(){ return Date.now(); }

/**
 * Minutos entre uma data e um instante. Nulo quando não há data.
 *
 * **Recebe o instante, não o lê do relógio.** É o que permite às regras de prazo serem
 * verificáveis: um teste passa a hora que quer e a regra responde sempre o mesmo.
 */
function minutosDesde(d, ts){ return d? Math.round(((ts==null? agora() : ts)-d.getTime())/60000) : null; }

/**
 * Uma duração em minutos, dita como se diz no posto.
 *
 * Até às 24 horas conta-se em horas e minutos, que é a unidade da doutrina: os 90 minutos
 * do ataque ampliado, as 2 horas do domínio, as 12 do turno. **Daí para cima conta-se
 * também em dias.** A 8 de setembro, com uma ocorrência aberta a 7 de agosto, o ecrã
 * dizia «768 h 01 min»: a conta estava certa e ninguém a lê — quem está ao teclado tem de
 * dividir por 24 de cabeça para perceber que são 32 dias, e é nesse instante que deixa de
 * confiar no número.
 *
 * **Uma duração negativa não se escreve.** `-119` dava «-2 h -59 min», que não é hora
 * nenhuma: é um instante que ainda não chegou, e quem chama tem de o tratar antes de
 * pedir a duração. Aqui sai um travessão, para a falta se ver em vez de passar por conta.
 *
 * @param {number} m minutos
 * @returns {string}
 */
function duracao(m){
  if(!Number.isFinite(m) || m < 0) return "\u2014";
  const t = Math.round(m);
  const d = Math.floor(t/1440), h = Math.floor((t%1440)/60), mm = t%60;
  if(d) return d+" d "+String(h).padStart(2,"0")+" h "+String(mm).padStart(2,"0")+" min";
  if(h) return h+" h "+String(mm).padStart(2,"0")+" min";
  return mm+" min";
}
/** Quando foi o último ponto de situação, para as regras que contam a partir dele. */
function ultimoPOSIT(){
  for(let i=O.evolucao.length-1;i>=0;i--){ if(O.evolucao[i].tipo==="posit") return parseGDH(O.evolucao[i].g); }
  return null;
}
