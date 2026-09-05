/* ================= NÚCLEO · números escritos à portuguesa ================= */
/**
 * Lê um número como um português o escreve, com vírgula ou com ponto.
 *
 * `Number("1,5")` é `NaN`, e o efeito era pior do que um erro: `intensidadeByram` recebia
 * a carga de combustível escrita no campo — «1,5 t/ha» — e a aplicação dizia ao oficial
 * que faltava o que ele acabara de escrever. O mesmo defeito já tinha sido corrigido em
 * `09-comportamento-do-fogo` para a razão declive/vento e não tinha sido propagado; havia
 * 33 leituras com `parseFloat(...replace(",", "."))` e um auxiliar local em
 * `22-ambiente-de-fogo`. Passa a haver um só, aqui.
 *
 * Devolve `null` — e não zero, nem `NaN` — quando não há número: zero é um valor, e um
 * campo vazio não é zero.
 *
 * @param {any} v o que veio do campo, ou já um número
 * @returns {number|null}
 */
function numPT(v){
  if(typeof v === "number") return Number.isFinite(v)? v : null;
  const s = String(v ?? "").trim();
  if(s === "") return null;
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n)? n : null;
}

/**
 * Escreve um número com vírgula decimal, para o ecrã e para o PEA.
 *
 * É a inversa de `numPT`, e estava repetida vinte vezes em linha como
 * `toFixed(n).replace(".", ",")`. `null` sai como travessão, que é o que um valor que não
 * há deve mostrar — nunca «0,0».
 *
 * @param {number|null|undefined} n
 * @param {number} [casas] casas decimais; por omissão nenhuma
 * @returns {string}
 */
function fmtPT(n, casas){
  if(n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  return Number(n).toFixed(casas || 0).replace(".", ",");
}
