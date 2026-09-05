/* ================= PLANEAMENTO · comportamento do fogo (art. 29.º) ================= */
/* Composição vetorial dos efeitos de declive e de vento sobre a frente de fogo,
   segundo Viegas, D. X. (2004), "Slope and wind effects on fire propagation",
   International Journal of Wildland Fire 13, 143-156. Ver docs/FONTES.md, chave FOGO.

   O modelo trata a velocidade de propagação como vetor e soma o efeito do declive
   com o efeito do vento (equação 1). Com β o ângulo entre o vetor induzido pelo
   vento e o vetor de maior declive a subir, e ε a razão entre os dois módulos:

     ε = Rs / Rw                                              (equação 2)
     tan δ = sen β / (ε + cos β)                              (equação 4)
     ξ² = (ε + cos β)² + sen² β,  com ξ = R / Rw              (equação 5)

   δ é o desvio da cabeça em relação à linha de maior declive, e ξ a velocidade da
   frente em unidades da velocidade que o vento sozinho produziria.

   O QUE ESTE MODELO NÃO DÁ, e o artigo di-lo por palavras suas: a velocidade
   absoluta de propagação — que exige R0, a velocidade básica do combustível, e
   "this input must come from another source" — e se o fogo se propaga ou se
   extingue. A aplicação não inventa nenhuma das duas: sem ε informado, apresenta
   apenas o que se deduz da geometria, e nunca uma velocidade em metros por minuto. */

/** Rumos de oito pontos, na ordem dos graus. */
const RUMOS_GRAUS = { N:0, NE:45, E:90, SE:135, S:180, SO:225, O:270, NO:315 };

/** Converte um rumo de oito pontos em graus. Devolve null se não for um rumo. */
function grausDoRumo(rumo){
  const g = RUMOS_GRAUS[String(rumo||"").trim().toUpperCase()];
  return g === undefined ? null : g;
}

/** Normaliza um ângulo para [0, 360). */
function normalizarGraus(g){ return ((g % 360) + 360) % 360; }

/** Diferença assinada entre dois rumos, em (-180, 180]. Positiva no sentido horário. */
function difGraus(de, para){
  const d = normalizarGraus(para - de);
  return d > 180 ? d - 360 : d;
}

/**
 * Ângulo β entre o vetor induzido pelo vento e o vetor de maior declive a subir.
 *
 * A exposição registada na análise de relevo é a direção para onde a encosta olha,
 * ou seja, o sentido descendente: a linha de maior declive a subir é a oposta.
 * O vento é registado pelo rumo de onde sopra, e empurra a frente para o oposto.
 *
 * @param {string} orientEncosta exposição dominante, rumo de oito pontos
 * @param {number} rumoVento graus de onde o vento sopra
 * @returns {{beta:number, sentido:number, subida:number, empurra:number}|null}
 */
function betaFogo(orientEncosta, rumoVento){
  const exposicao = grausDoRumo(orientEncosta);
  if(exposicao === null || !Number.isFinite(rumoVento)) return null;
  const subida = normalizarGraus(exposicao + 180);
  const empurra = normalizarGraus(rumoVento + 180);
  const assinado = difGraus(subida, empurra);
  return { beta: Math.abs(assinado), sentido: Math.sign(assinado) || 1, subida, empurra };
}

/** Desvio δ da cabeça em relação à linha de maior declive, em graus. Equação (4). */
function deflexaoFogo(eps, beta){
  const b = beta * Math.PI / 180;
  return Math.atan2(Math.sin(b), eps + Math.cos(b)) * 180 / Math.PI;
}

/** Razão ξ entre a velocidade da frente e a que o vento sozinho daria. Equação (5). */
function razaoFogo(eps, beta){
  const b = beta * Math.PI / 180;
  return Math.hypot(eps + Math.cos(b), Math.sin(b));
}

/**
 * Compõe declive e vento. Sem ε informado devolve só o que a geometria dá.
 *
 * @param {{orient:string, rumoVento:number, eps?:number|string}} entrada
 */
function comportamentoFogo(entrada){
  const g = betaFogo(entrada.orient, entrada.rumoVento);
  if(!g) return null;
  /* **A vírgula decimal é a portuguesa, e o campo é preenchido por portugueses.**
     `Number("1,5")` é NaN, e o efeito era pior do que um erro: a razão declive/vento
     entrava como se estivesse por preencher, e a aplicação dizia «sem ε informado» a quem
     acabara de a informar. Sem aviso, sem sinal, e com o desvio da cabeça por calcular. */
  const eps = numPT(entrada.eps);
  const temEps = eps !== null && eps >= 0;
  const fora = { beta: g.beta, subida: g.subida, empurra: g.empurra, eps: temEps? eps : null };

  /* No caso limite ε = 1 o artigo dá δ = β/2 de forma fechada; fora dele é preciso ε. */
  if(!temEps) return Object.assign(fora, { delta: null, xi: null, cabeca: null, deltaSeIguais: g.beta/2 });

  const delta = deflexaoFogo(eps, g.beta);
  return Object.assign(fora, {
    delta,
    xi: razaoFogo(eps, g.beta),
    cabeca: normalizarGraus(g.subida + g.sentido * delta),
    deltaSeIguais: g.beta/2
  });
}

/**
 * Frase operacional. Diz sempre de onde vem cada número, e cala-se sobre o que o
 * modelo não sustenta.
 */
function leituraComportamentoFogo(entrada){
  const c = comportamentoFogo(entrada);
  if(!c) return "";
  const b = Math.round(c.beta);
  const partes = [];

  partes.push("Vento e declive fazem um ângulo de "+b+"° entre si (a encosta sobe para "
    + card(c.subida)+", o vento empurra para "+card(c.empurra)+").");

  if(b <= 45) partes.push("Reforçam-se: a cabeça segue a linha de maior declive, com aceleração.");
  else if(b >= 135) partes.push("Opõem-se: a cabeça enfraquece e pode inverter-se; atenção a mudanças bruscas com a rotação do vento.");
  else partes.push("Cruzam-se: a cabeça desvia-se da linha de maior declive para o lado do vento.");

  if(c.delta === null){
    partes.push("Sem a razão declive/vento informada não se calcula o desvio da cabeça. "
      + "Se os dois efeitos tiverem igual peso, o desvio é metade do ângulo, ou seja "
      + Math.round(c.deltaSeIguais)+"°.");
  } else {
    partes.push("Com razão declive/vento de "+c.eps+", a cabeça desvia-se "+Math.round(c.delta)
      + "° da linha de maior declive, rumo "+card(c.cabeca)+", e progride a "+c.xi.toFixed(1)
      + "× a velocidade que o vento sozinho daria.");
  }

  partes.push("Composição vetorial de Viegas (2004), equações 4 e 5. O modelo não dá velocidade absoluta nem diz se o fogo se propaga: isso exige a velocidade básica do combustível, de outra fonte.");
  return partes.join(" ");
}
