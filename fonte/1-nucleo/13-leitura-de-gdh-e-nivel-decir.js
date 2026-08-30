/* ================= NÚCLEO · leitura de GDH e nível DECIR ================= */
/**
 * Lê um GDH — DDHHMMMESAA — e devolve a data, ou `null` se não for uma data real.
 *
 * **A validação tem de ser por ida e volta.** O construtor `Date` normaliza o impossível
 * em silêncio: `new Date(2026,1,31)` dá 3 de março, e o `isNaN` que aqui estava achava
 * tudo bem. Media-se `311000FEV26` e a aplicação registava 3 de março às 10h00 sem uma
 * palavra. Num sistema em que os tempos governam as rendições, os noventa minutos, a
 * validade do PEA e a sequência documental, um erro de dedo transformado noutra data
 * válida é pior do que uma recusa.
 *
 * Agora constrói-se e confere-se: se algum componente voltar diferente do que entrou, a
 * data não existe e recusa-se. Isto apanha 31 de fevereiro, dia 32, hora 24, minuto 60 e
 * 29 de fevereiro em ano não bissexto — e apanha também a hora que não existe no dia da
 * mudança para a hora de verão, que é uma recusa correta ainda que rara.
 *
 * @param {string} s
 * @returns {Date|null}
 */
function parseGDH(s){
  if(!s) return null;
  const m = String(s).trim().toUpperCase().match(/^(\d{2})(\d{2})(\d{2})([A-Z]{3})(\d{2})$/);
  if(!m) return null;
  const mes = MES.indexOf(m[4]); if(mes<0) return null;
  const dia = +m[1], hora = +m[2], min = +m[3], ano = 2000 + +m[5];
  if(dia < 1 || dia > 31 || hora > 23 || min > 59) return null;
  const d = new Date(ano, mes, dia, hora, min, 0, 0);
  if(isNaN(d.getTime())) return null;
  if(d.getFullYear() !== ano || d.getMonth() !== mes || d.getDate() !== dia
     || d.getHours() !== hora || d.getMinutes() !== min) return null;
  return d;
}

/**
 * Porque é que um GDH foi recusado, em português e para o oficial ler.
 *
 * Recusar sem dizer porquê é meio caminho para se escrever outra coisa qualquer até o
 * campo deixar de reclamar.
 *
 * @param {string} s
 * @returns {string} vazio quando o GDH é válido ou o campo está vazio
 */
function motivoGDH(s){
  const t = String(s||"").trim();
  if(!t) return "";
  if(parseGDH(t)) return "";
  const m = t.toUpperCase().match(/^(\d{2})(\d{2})(\d{2})([A-Z]{3})(\d{2})$/);
  if(!m) return "Formato de GDH: dois dígitos de dia, dois de hora, dois de minuto, três letras de mês e dois de ano — por exemplo 281200AGO26.";
  const mes = MES.indexOf(m[4]);
  if(mes < 0) return "Mês desconhecido: use " + MES.join(", ") + ".";
  const dia = +m[1], hora = +m[2], min = +m[3], ano = 2000 + +m[5];
  if(dia < 1 || dia > 31) return "Dia " + m[1] + " não existe.";
  if(hora > 23) return "Hora " + m[2] + " não existe: o dia acaba às 23h59.";
  if(min > 59) return "Minuto " + m[3] + " não existe.";
  const d = new Date(ano, mes, dia, hora, min);
  if(d.getDate() !== dia || d.getMonth() !== mes){
    return "O mês de " + m[4] + " de " + ano + " não tem dia " + dia + ".";
  }
  return "Essa hora não existe nesta data — é a noite da mudança para a hora de verão.";
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

/**
 * Lê o GDH de um campo do formulário, recusando o que não é data.
 *
 * Todos os campos de GDH partilham este caminho: a validação não pode viver em cada
 * botão, senão o próximo campo nasce sem ela. Devolve `{ok, g, d}` — `g` é o texto a
 * guardar, já validado, ou o instante corrente quando o campo está vazio e é permitido.
 *
 * @param {string} id campo do formulário
 * @param {string} caixa onde escrever a recusa
 * @param {boolean} [vazioVale] se o vazio significa «agora»
 * @returns {{ok:boolean, g:string, d:(Date|null)}}
 */
function gdhDoCampo(id, caixa, vazioVale){
  const el = $(id);
  const t = el? String(el.value||"").trim() : "";
  if(!t){
    if(vazioVale === false){
      aviso(caixa, "err", "Indica o GDH.");
      if(el) el.setAttribute("aria-invalid", "true");
      return { ok:false, g:"", d:null };
    }
    return { ok:true, g:gdhAgora(), d:new Date(agora()) };
  }
  const d = parseGDH(t);
  if(!d){
    aviso(caixa, "err", motivoGDH(t));
    if(el){ el.setAttribute("aria-invalid", "true"); el.focus(); }
    return { ok:false, g:"", d:null };
  }
  if(el) el.removeAttribute("aria-invalid");
  return { ok:true, g:t, d };
}

/* Marca o campo enquanto se escreve. Recusar só ao carregar no botão é dizer tarde:
   o oficial já mudou de campo e de assunto. */
function ligarCamposGDH(){
  ["o-inicio","e-gdh","pc-g","pc-sol","aer-g","tn-g"].forEach(id=>{
    const el = $(id); if(!el) return;
    const marcar = ()=>{
      const t = String(el.value||"").trim();
      if(t && !parseGDH(t)){ el.setAttribute("aria-invalid","true"); el.title = motivoGDH(t); }
      else { el.removeAttribute("aria-invalid"); el.removeAttribute("title"); }
    };
    el.addEventListener("input", marcar);
    el.addEventListener("change", marcar);
    marcar();
  });
}
