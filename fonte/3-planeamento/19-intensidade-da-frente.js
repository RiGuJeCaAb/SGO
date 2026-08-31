/* ================= PLANEAMENTO · intensidade da frente e limites de manobra =================
   Este módulo faz uma coisa e recusa fazer outra.

   O que faz: a partir da **velocidade de propagação** e da **carga de combustível
   consumida**, dá a intensidade da frente de chamas, o comprimento da chama e, daí, o que
   isso decide na manobra — se o ataque direto à cabeça é admissível, que largura tem de ter
   uma linha de contenção, e a que distância ninguém pode estar.

   O que recusa: **calcular a velocidade de propagação.** Exige um modelo de combustível
   calibrado para a vegetação do território, e não existe. Viegas (2004) remete-a para outra
   fonte; o sistema canadiano tem-na para pícea boreal e pinheiro *jack*; Scott e Burgan
   (2005) têm quarenta modelos dos Estados Unidos; e a dissertação de Paixão (2014) mediu,
   em fogos reais portugueses, que os modelos importados descrevem pior a vegetação do que
   os customizados. Ver `docs/FONTES.md`, `FOGOINT` e `FOGOMOD`.

   Por isso a velocidade entra à mão, e a aplicação diz sempre que entrou à mão. É a mesma
   decisão que já se tinha tomado para a razão declive/vento, e pela mesma razão. */

/**
 * Intensidade da frente de chamas, em kW/m — a intensidade de Byram.
 *
 * `I = R·w / 2`, com R em metros por hora e w em toneladas por hectare. A forma reduzida é
 * a que Fernandes (2003) publica; sai da definição de Byram (1959), `I = h·w·R`, com poder
 * calorífico de 18 000 kJ/kg e as unidades convertidas.
 *
 * @param {number} rMh velocidade de propagação, m/h
 * @param {number} wTha carga de combustível consumida na frente, t/ha
 * @returns {number|null} kW/m, ou nada se faltar um dos dois
 */
function intensidadeByram(rMh, wTha){
  const r = Number(rMh), w = Number(wTha);
  if(!Number.isFinite(r) || !Number.isFinite(w) || r <= 0 || w <= 0) return null;
  return r * w / 2;
}

/**
 * Comprimento da chama, em metros, a partir da intensidade.
 *
 * `I = 300·L²`, aproximação geral publicada por Fernandes (2003). Confere com a outra
 * formulação corrente, `I = 258·L^2,17`, dentro de poucos por cento na gama que interessa —
 * as duas dão cerca de 3,6 m para os 4 000 kW/m do limite de ataque direto.
 */
function comprimentoDaChama(kWm){
  const i = Number(kWm);
  return Number.isFinite(i) && i > 0 ? Math.sqrt(i/300) : null;
}

/**
 * As classes de dificuldade de controlo, por intensidade da frente.
 *
 * Tabela clássica de interpretação para supressão. **A proveniência do documento que a traz
 * está por confirmar** — os diapositivos não declaram autoria —, e por isso o limite que a
 * aplicação usa para decidir é o dos 4 000 kW/m de Alexander (2000), citado por Fernandes
 * (2003), que tem fonte identificada. Esta tabela serve para descrever, não para decidir.
 */
const CLASSES_INTENSIDADE = [
  { ate:350,   chama:"< 1,2 m",   t:"Ataque à cabeça possível com ferramentas manuais. Linha de contenção manual eficaz." },
  { ate:1700,  chama:"1,2–2,4 m", t:"Demasiado intenso para ataque manual. Autotanques; bulldozer para abrir linha." },
  { ate:3450,  chama:"2,4–3,4 m", t:"Controlo muito difícil. Podem ocorrer fogos de copas e emissão de faúlhas. Ataque à cabeça provavelmente ineficaz." },
  { ate:Infinity, chama:"> 3,4 m", t:"Comportamentos extremos. Ataque à cabeça ineficaz. Alguma eficácia do ataque aéreo." }
];

/** O limite acima do qual atacar diretamente a cabeça é desaconselhado — Alexander (2000). */
const LIMITE_ATAQUE_DIRETO = 4000;

/** A classe de dificuldade em que uma intensidade cai. */
function classeDaIntensidade(kWm){
  return CLASSES_INTENSIDADE.find(c=>kWm < c.ate) || CLASSES_INTENSIDADE[CLASSES_INTENSIDADE.length-1];
}

/**
 * O que a intensidade decide na manobra.
 *
 * Cada número sai com a sua fonte primária, e todas vêm por Fernandes (2003):
 * a distância de segurança de Butler e Cohen (1998), a largura de contenção de Byram (1959)
 * e o limite de ataque direto de Alexander (2000).
 *
 * @returns {null|{i:number, chama:number, classe:any, seguranca:number, contencao:number, direto:boolean}}
 */
function limitesDeManobra(rMh, wTha){
  const i = intensidadeByram(rMh, wTha);
  if(i === null) return null;
  const chama = comprimentoDaChama(i);
  return {
    i, chama,
    classe: classeDaIntensidade(i),
    /* Quatro vezes a **altura** da chama. Em terreno plano e sem vento a altura é o
       comprimento; com vento a chama inclina-se e a altura é menor, pelo que usar o
       comprimento é o lado seguro do erro. */
    seguranca: Math.ceil(4 * chama),
    /* Uma vez e meia o comprimento da chama, assumindo que não há projeção de faúlhas com
       capacidade de ignição — condição que Byram (1959) põe e que se repete aqui porque é
       ela que falha primeiro num incêndio de verão no Douro. */
    contencao: Math.ceil(1.5 * chama * 10) / 10,
    direto: i < LIMITE_ATAQUE_DIRETO
  };
}

/**
 * A leitura escrita da intensidade, ou o que falta para a haver.
 *
 * Dizer o que falta é metade do trabalho: quem lê fica a saber que a aplicação não se
 * calou por não ter nada a dizer, mas por lhe faltarem dois números que alguém pode ir
 * buscar.
 */
function leituraDaIntensidade(){
  /* Direto, sem o `|| {}` defensivo: o ramo é declarado em `novoEstado` e garantido pela
     migração, e o objeto vazio de reserva apagava o tipo. Já me tinha custado isto uma vez. */
  const f = O.dados.fogo;
  const L = limitesDeManobra(f.r, f.w);
  if(!L){
    const falta = [];
    if(!f.r) falta.push("a velocidade de propagação (m/h)");
    if(!f.w) falta.push("a carga de combustível consumida (t/ha)");
    return "Sem " + (falta.join(" e ") || "os dados de comportamento") + " não há intensidade da frente — e sem ela"
      + " não há comprimento de chama, distância de segurança nem largura de contenção."
      + " Preenche em «Comportamento do fogo — intensidade da frente». A aplicação não os"
      + " estima: exigiriam um modelo de combustível calibrado para a vegetação do Douro, e não existe.";
  }
  const p = [];
  p.push("Com " + f.r + " m/h e " + f.w + " t/ha, a intensidade da frente é de "
    + Math.round(L.i).toLocaleString("pt-PT") + " kW/m e a chama mede cerca de "
    + L.chama.toFixed(1).replace(".", ",") + " m (Byram 1959, via Fernandes 2003).");
  p.push(L.classe.t);
  p.push(L.direto
    ? "Abaixo dos 4 000 kW/m: o ataque direto à cabeça é admissível (Alexander 2000)."
    : "**Acima dos 4 000 kW/m: atacar diretamente a cabeça é perigoso e inconsequente** (Alexander 2000). O ataque à cabeça faz-se por meios aéreos ou indiretamente.");
  p.push("Ninguém a menos de " + L.seguranca + " m da frente — quatro vezes a altura da chama, para uma tolerância de 7 kW/m² de radiação incidente (Butler e Cohen 1998). "
    + "Uma linha de contenção precisa de pelo menos " + String(L.contencao).replace(".", ",")
    + " m de largura, e só se não houver projeção de faúlhas com capacidade de ignição (Byram 1959).");
  return p.join(" ");
}

/** Pinta a leitura da intensidade, por baixo dos dois campos que a produzem. */
function pintarIntensidade(){
  const el = $("fg-leitura"); if(!el) return;
  el.innerHTML = esc(leituraDaIntensidade()).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

/* Repinta-se ao escrever nos campos, e não só ao gravar: os dois números são de
   tentativa e erro — «e se forem trezentos metros por hora?» — e ver a resposta a mudar
   enquanto se escreve é metade do valor que isto tem. */
["fg-r","fg-w"].forEach(id=>{
  const el = $(id); if(el) el.addEventListener("input", ()=>{ try{ pintarIntensidade(); }catch(e){} });
});
