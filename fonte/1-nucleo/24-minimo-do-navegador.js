/* ================= NÚCLEO · mínimo exigido ao navegador ================= */
/**
 * A versão mínima de navegador que esta aplicação exige, e o que a fixa.
 *
 * **É o CSS que manda, e não o JavaScript.** O código está em ES2020 — uma só construção
 * acima de ES2019, o `??` em `esc()` —, o que dá Chrome 80. Mas a folha de estilo usa
 * `color-mix()` em sete sítios, e essa é de **março de 2023, Chrome/Edge 111**.
 *
 * A diferença importa porque a degradação do `color-mix` **não é cosmética**. Abaixo do
 * mínimo a declaração cai por inteiro, e com ela vão-se as cores das caixas de aviso e o
 * anel de foco de `input[aria-invalid="true"]`. Um campo inválido que perde o anel vermelho
 * continua a parecer normal, e uma caixa de aviso sem cor de aviso deixa de avisar: **é pior
 * do que falhar**, porque falha com ar de estar bem.
 *
 * Medido pelo ramo #005 na auditoria de portabilidade da r0087, em Chromium 141 com perfil
 * vazio a partir de `file://`.
 *
 * **Declara-se, não se bloqueia** — a mesma doutrina do carimbo de integridade do código.
 * Recusar o arranque a quem tem um navegador antigo tira-lhe a aplicação inteira por causa
 * de umas cores; dizer-lho deixa-o trabalhar a saber o que não vê.
 */
const MINIMO_NAVEGADOR = { versao:"Chrome/Edge 111", data:"março de 2023",
  prova:"color-mix(in srgb, red 50%, blue)" };

/**
 * O navegador serve os sinais de estado com cor?
 *
 * `CSS.supports` responde pelo próprio motor e não por adivinhação a partir do `userAgent`,
 * que qualquer coisa reescreve. Um navegador sem `CSS.supports` é anterior a tudo o que
 * interessa e conta como abaixo do mínimo.
 */
function navegadorAcimaDoMinimo(){
  try{ return !!(window.CSS && CSS.supports && CSS.supports("color", MINIMO_NAVEGADOR.prova)); }
  catch(e){ return false; }
}

/**
 * Carimba o rodapé quando o navegador fica abaixo do mínimo.
 *
 * No rodapé e não numa caixa de aviso: é uma condição permanente da máquina, não um
 * acontecimento. Uma caixa que se fecha esconderia o que não deixa de ser verdade, e uma
 * que não se fecha tapava o trabalho.
 */
function carimbarMinimoNavegador(){
  if(navegadorAcimaDoMinimo()) return;
  const el = $("min-nav"); if(!el) return;
  el.innerHTML = '<b>NAVEGADOR ABAIXO DO MÍNIMO</b> — esta aplicação exige '
    + esc(MINIMO_NAVEGADOR.versao) + ' ou posterior (' + esc(MINIMO_NAVEGADOR.data)
    + '). Neste navegador os sinais de estado podem aparecer sem cor: caixas de aviso e o'
    + ' contorno dos campos por preencher. O resto funciona.';
  el.style.display = "";
}
