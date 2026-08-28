/* ================= NÚCLEO · relógio ================= */
/* Ponto único de leitura da hora. As verificações que dependem do relógio — prazos
   de ataque inicial e ampliado, notificação das duas horas, PMEPC às vinte e quatro,
   POSIT e rendições — aceitam o instante em argumento e só recorrem a este ponto
   quando não o recebem. É o que as torna exercitáveis com uma hora escolhida, em vez
   de dependerem do momento em que correm. São regras cuja falha tem consequência
   operacional: não podem ficar por testar. */
function agora(){ return Date.now(); }

function minutosDesde(d, ts){ return d? Math.round(((ts==null? agora() : ts)-d.getTime())/60000) : null; }
function ultimoPOSIT(){
  for(let i=O.evolucao.length-1;i>=0;i--){ if(O.evolucao[i].tipo==="posit") return parseGDH(O.evolucao[i].g); }
  return null;
}
