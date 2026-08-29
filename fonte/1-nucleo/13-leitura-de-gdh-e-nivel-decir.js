/* ================= NÚCLEO · leitura de GDH e nível DECIR ================= */
function parseGDH(s){
  if(!s) return null;
  const m = String(s).trim().toUpperCase().match(/^(\d{2})(\d{2})(\d{2})([A-Z]{3})(\d{2})$/);
  if(!m) return null;
  const mes = MES.indexOf(m[4]); if(mes<0) return null;
  const d = new Date(2000+ +m[5], mes, +m[1], +m[2], +m[3]);
  return isNaN(d.getTime())? null : d;
}
/**
 * Os períodos do DECIR, por ano, com a fonte de cada tabela.
 *
 * Estavam escritos por dentro da função, e por isso valiam para sempre — que é o mesmo
 * que dizer que em 2027 a aplicação continuava a responder, calada e errada. Os períodos
 * são fixados a cada ano por diretiva: a tabela é por ano, e um ano sem tabela **não se
 * adivinha a partir do ano anterior**.
 *
 * `de` e `a` são MMDD, inclusive nas duas pontas. O que não cair em nenhum período é
 * ALFA, que é o nível de base fora do período crítico.
 */
const DECIR_ANOS = {
  2026: {
    fonte: "DON n.º 2 / DECIR 2026",
    periodos: [
      { n:"BRAVO",   de: 515, a: 531 },
      { n:"CHARLIE", de: 601, a: 630 },
      { n:"DELTA",   de: 701, a: 930 },
      { n:"CHARLIE", de:1001, a:1015 },
      { n:"BRAVO",   de:1016, a:1031 },
    ],
  },
};

/**
 * Nível DECIR de uma data, ou `""` quando não há tabela publicada para esse ano.
 *
 * O vazio é resposta, não falha: sem diretiva do ano em fonte, a aplicação pergunta em
 * vez de inventar — é a regra 4 do projeto. Quem chama tem de saber tratar o vazio.
 *
 * @param {Date} [d]
 * @returns {string} ALFA, BRAVO, CHARLIE, DELTA, ou "" se o ano não tiver tabela
 */
function nivelDECIR(d){
  d = d || new Date(agora());
  const tabela = DECIR_ANOS[d.getFullYear()];
  if(!tabela) return "";
  const md = (d.getMonth()+1)*100 + d.getDate();
  const p = tabela.periodos.find(x=>md>=x.de && md<=x.a);
  return p? p.n : "ALFA";
}
/** A fonte da tabela usada para uma data, para se poder citar no ecrã. */
function fonteDECIR(d){
  const t = DECIR_ANOS[(d||new Date(agora())).getFullYear()];
  return t? t.fonte : "";
}
/* contagem consolidada do dispositivo: aeronaves, máquinas de rasto, meios e operacionais */
