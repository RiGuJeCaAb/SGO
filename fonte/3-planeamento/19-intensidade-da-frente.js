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
 * O poder calorífico do combustível, em kJ/kg, que a intensidade de Byram consome.
 *
 * **É escolha de Fernandes (2003), não de Byram (1959).** Byram define `I = H·w·R` e não
 * fixa `H`; a forma reduzida `I = R·w/2` que Fernandes publica é essa definição com
 * H = 18 000 kJ/kg e as unidades convertidas — `18 000 / 36 000 = 1/2`. Até à r0102 o `2`
 * era o único sítio onde o número existia: sem nome, sem ficha, sem aparecer no PEA, e
 * atribuído a Byram por arrasto. O valor clássico para combustíveis florestais é
 * 18 700 kJ/kg, que daria mais 3,9 %. Fica o de Fernandes, porque é a fonte que se leu, e
 * fica com nome para poder ser substituído e impresso. Achado do ramo #003 (d0007).
 */
const H_COMBUSTAO = 18000;

/**
 * Intensidade da frente de chamas, em kW/m — a intensidade de Byram.
 *
 * `I = H·w·R`, definição de Byram (1959) lida em Fernandes (2003), com `H` em kJ/kg, `w`
 * convertido de t/ha para kg/m² (÷10) e `R` de m/h para m/s (÷3600): `I = H·w·R / 36 000`.
 * Com `H_COMBUSTAO` a 18 000 dá o `R·w/2` de Fernandes, e agora vê-se porquê.
 *
 * @param {number} rMh velocidade de propagação, m/h
 * @param {number} wTha carga de combustível consumida na frente, t/ha
 * @returns {number|null} kW/m, ou nada se faltar um dos dois
 */
function intensidadeByram(rMh, wTha){
  /* Por `numPT` e não por `Number`: «1,5 t/ha» é o que o oficial escreve, e `Number("1,5")`
     era `NaN` — a aplicação dizia-lhe que faltava o que ele tinha acabado de escrever. */
  const r = numPT(rMh), w = numPT(wTha);
  if(r === null || w === null || r <= 0 || w <= 0) return null;
  return H_COMBUSTAO * w * r / 36000;
}

/**
 * Comprimento da chama, em metros, a partir da intensidade.
 *
 * `I = 300·L²`, aproximação geral publicada por Fernandes (2003). Confere com a outra
 * formulação corrente, `I = 258·L^2,17`, na gama do limite de ataque direto — as duas dão
 * cerca de 3,6 m para os 4 000 kW/m (3,65 contra 3,54). **Não em toda a gama:** cruzam-se
 * por volta dos 1 700 kW/m e divergem para os dois lados, 7 % aos 350 kW/m onde acaba a
 * classe 1, 12 % aos 100 kW/m. É na gama baixa que se decide se o ataque manual é viável,
 * e aí esta aproximação dá a chama mais curta do que a outra. Conferido pelo #003 (d0007).
 */
function comprimentoDaChama(kWm){
  const i = numPT(kWm);
  return i !== null && i > 0 ? Math.sqrt(i/300) : null;
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
 * Cada número sai com a sua fonte primária, e todas vêm por Fernandes (2003): a distância
 * de segurança de Butler e Cohen (1998), a largura de contenção atribuída por Fernandes a Byram (1959),
 * e o limite de ataque direto de Alexander (2000).
 *
 * **As duas distâncias não consomem a mesma grandeza** (ramo #003, d0007). A largura de
 * contenção pede o comprimento da chama, e é isso que recebe. A distância de segurança pede
 * a **altura**, e a aplicação só tem o comprimento: toma a altura igual ao comprimento, que
 * é a chama vertical, e diz-o em cada saída. Com vento ou declive a chama inclina e a
 * altura é menor — a substituição ganha margem —, mas o fator 4 de Butler e Cohen vem de um
 * modelo de radiação apenas, e a revisão de Butler (2014), que não se tem, trata das
 * condições em que esse fator é insuficiente: vento, declive, convecção. Duas incertezas
 * que se cruzam não são uma margem de segurança, e por isso a margem não se declara
 * disponível. A grandeza sai com nome, `alturaChama`, para que ninguém a confunda.
 *
 * @returns {null|{i:number, chama:number, alturaChama:number, classe:any, seguranca:number, contencao:number, direto:boolean}}
 */
function limitesDeManobra(rMh, wTha){
  const i = intensidadeByram(rMh, wTha);
  if(i === null) return null;
  const chama = comprimentoDaChama(i);
  /* A altura tomada igual ao comprimento: chama vertical, que é o que se assume sem a
     inclinação. É uma escolha declarada, e é a que a distância de segurança consome. */
  const alturaChama = chama;
  return {
    i, chama, alturaChama,
    classe: classeDaIntensidade(i),
    /* Quatro vezes a altura da chama — Butler e Cohen (1998), por Fernandes (2003). Ao
       metro superior, sempre. */
    seguranca: Math.ceil(4 * alturaChama),
    /* Uma vez e meia o comprimento da chama, assumindo que não há projeção de faúlhas com
       capacidade de ignição. A regra e a condição são atribuídas a Byram (1959) por Fernandes
       (2003); **estão por confirmar na fonte**, que não se leu — uma regra de largura de linha é o
       tipo de número que entra pela literatura operacional e é retroatribuído à fonte
       teórica. Repete-se aqui porque é a condição que falha primeiro num incêndio de verão
       no Douro. */
    contencao: Math.ceil(1.5 * chama * 10) / 10,
    direto: i < LIMITE_ATAQUE_DIRETO
  };
}

/**
 * A frase que acompanha toda a distância de segurança impressa: é um valor teórico de
 * referência e não substitui o reconhecimento no local. A DON n.º 2, Anexo 3, situação n.º 3,
 * identifica como situação de perigo a ausência de zonas de segurança e caminhos de fuga
 * identificados; nenhum número deste módulo dispensa isso, e o impresso tem de o dizer
 * (regra SEG-3 do ramo #003).
 */
const AVISO_SEGURANCA = "Valor teórico de referência: não substitui o reconhecimento no local nem a identificação de zonas de segurança e caminhos de fuga (DON n.º 2, Anexo 3, situação n.º 3).";

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
      /* Esta frase dizia «a aplicação não os estima», e ficou por corrigir desde que o motor
         de propagação entrou. Continuar a dizê-lo mandava o utilizador procurar no terreno o
         que o painel logo abaixo lhe dá. */
      + " Preenche em «Comportamento do fogo — intensidade da frente», ou estima a velocidade"
      + " no painel dos guias de fogo controlado, logo abaixo, e passa-a para cá.";
  }
  const p = [];
  p.push("Com " + f.r + " m/h e " + f.w + " t/ha, a intensidade da frente é de "
    + Math.round(L.i).toLocaleString("pt-PT") + " kW/m e a chama mede cerca de "
    + fmtPT(L.chama, 1) + " m (Byram 1959, por Fernandes 2003; poder calorífico de " + H_COMBUSTAO.toLocaleString("pt-PT") + " kJ/kg, escolha de Fernandes).");
  p.push(L.classe.t);
  p.push(L.direto
    ? "Abaixo dos 4 000 kW/m: o ataque direto à cabeça é admissível (Alexander 2000)."
    : "**Acima dos 4 000 kW/m: atacar diretamente a cabeça é perigoso e inconsequente** (Alexander 2000). O ataque à cabeça faz-se por meios aéreos ou indiretamente.");
  p.push("Ninguém a menos de " + L.seguranca + " m da frente — quatro vezes a altura da chama, tomada igual ao comprimento por se desconhecer a inclinação, para uma tolerância de 7 kW/m² de radiação incidente (Butler e Cohen 1998, por Fernandes 2003). "
    + AVISO_SEGURANCA + " "
    + "Uma linha de contenção precisa de pelo menos " + fmtPT(L.contencao, 1)
    + " m de largura, e só se não houver projeção de faúlhas com capacidade de ignição (regra atribuída a Byram 1959 por Fernandes 2003, por confirmar na fonte).");
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

/* ---------------- estimativa da propagação · ligações da interface ---------------- */

/** Enche o seletor de modelos, agrupado como o documento de referência os agrupa. */
function encherModelos(){
  const el = $("pr-modelo"); if(!el || el.dataset.cheio) return;
  const grupos = {};
  MODELOS_COMB.forEach(m=>{ (grupos[m.g] = grupos[m.g] || []).push(m); });
  el.innerHTML = '<option value="">— por escolher —</option>'
    + Object.keys(grupos).map(g=>'<optgroup label="'+esc(g)+'">'
      + grupos[g].map(m=>'<option value="'+m.c+'">'+esc(m.c+" · "+m.d)+'</option>').join("")
      + '</optgroup>').join("");
  el.dataset.cheio = "1";
}

/** A ficha do modelo escolhido: carga, motor, e o que falta se não houver motor. */
function pintarFichaModelo(){
  const el = $("pr-modelo-d"); if(!el) return;
  const m = modeloComb(($("pr-modelo")||{}).value);
  if(!m){ el.textContent = "Chave de identificação no documento de referência, ponto 4."; return; }
  const w = (m.w[0] === null)? "carga não publicada para este modelo"
    : "carga fina "+String(m.w[0]).replace(".", ",")+"–"+String(m.w[1]).replace(".", ",")+" t/ha";
  el.textContent = "Código FARSITE "+m.n+" · "+w+" · "
    + (m.motor === "matos"? "motor: guia E1 (matos)"
     : m.motor === "pinhal"? "motor: guia E2 (pinheiro bravo), tipo "+m.tipoPin
     : "sem motor de propagação português");
}

/** Estima a humidade do combustível morto, ou recusa e explica. */
$("pr-hcm-calc").addEventListener("click", ()=>{
  const hr = parseFloat(String(($("pr-hr")||{}).value||"").replace(",", "."));
  const dias = parseInt(($("pr-dias")||{}).value, 10);
  if(!Number.isFinite(hr) || !Number.isFinite(dias)){
    aviso("pr-saida","err","Faltam a humidade relativa e os dias sem chuva.");
    return;
  }
  /* A temperatura vem da previsão em vigor, não do que se escreveu: é ela que decide se
     o quadro é aplicável, e deixá-la à escolha de quem calcula seria pôr o limite nas
     mãos de quem tem interesse em ultrapassá-lo. */
  const t = (SERIE && SERIE.length)? Math.max.apply(null, SERIE.map(p=>p.t)) : NaN;
  const r = humidadeCombustivel(hr, dias, t);
  const el = $("pr-saida");
  if(r.recusa){ el.className = "ev-f"; el.innerHTML = "<b>Recusado.</b> " + esc(r.recusa); return; }
  $("pr-hcm").value = String(Math.round(r.v));
  O.dados.fogo.est.hcm = String(Math.round(r.v));
  O.dados.fogo.est.hcmOrigem = "Quadro 3.2.1 · HR "+hr+" %, "+dias+" dia(s) sem chuva";
  $("pr-hcm-o").textContent = O.dados.fogo.est.hcmOrigem;
  el.innerHTML = "Humidade do combustível morto fino: <b>"+Math.round(r.v)+" %</b>, do Quadro 3.2.1.";
});

/** Traz o vento da previsão em vigor, na hora de maior velocidade. */
$("pr-meteo").addEventListener("click", ()=>{
  if(!SERIE || !SERIE.length){ aviso("pr-saida","err","Não há previsão carregada."); return; }
  const p = SERIE.reduce((a,b)=>b.ws > a.ws? b : a, SERIE[0]);
  $("pr-u10").value = String(p.ws);
  O.dados.fogo.est.u10 = String(p.ws);
  if($("pr-hr")) $("pr-hr").value = String(p.rh);
  aviso("pr-saida","ok","Vento de "+p.ws+" km/h e HR de "+p.rh+" % — hora de maior vento da previsão em vigor. "
    +"A humidade do combustível continua por estimar ou declarar.");
});

/**
 * Traz o declive da classe que o painel do relevo já declara.
 *
 * Preenche por botão e não sozinho, e diz que o número é o centro da classe. Encher o campo
 * em silêncio faria passar por medido um valor que é uma classe inteira: entre «20–35 %
 * (acentuado)» e os 27 % que daqui saem vai a diferença entre uma estimativa e uma medição,
 * e quem lê o resultado tem direito a saber qual das duas está a ver.
 */
$("pr-relevo").addEventListener("click", ()=>{
  const cl = O.dados.topo.declive, d = DECLIVE_CLASSE[cl];
  if(d === undefined){
    aviso("pr-saida","err","O painel do relevo não declara classe de declive. Escolha-a em "
      +"«Declive dominante», ou escreva aqui o declive medido.");
    return;
  }
  $("pr-decl").value = String(d);
  O.dados.fogo.est.declive = String(d);
  pintarEstimativa();
  aviso("pr-saida","ok","Declive de "+d+" %, centro da classe declarada no relevo. É uma classe, "
    +"não uma medição: se tiver o declive do troço, escreva-o por cima.");
});

/** Corre o motor e escreve a leitura. */
function pintarEstimativa(){
  const el = $("pr-saida"); if(!el) return;
  /* O elemento pode ter acabado de servir de caixa de erro a `aviso()`: repõe-se a forma
     de saída de estimativa antes de escrever nela, ou a estimativa nascia escondida. */
  el.classList.remove("msg","err","ok","av"); el.style.display = "";
  cancelarAviso(el);
  const E = O.dados.fogo.est;
  ["modelo","altura","declive","u10","hcm"].forEach((k,i)=>{
    const id = ["pr-modelo","pr-alt","pr-decl","pr-u10","pr-hcm"][i];
    if($(id)) E[k] = $(id).value;
  });
  const r = estimarPropagacao();
  if(!r.ok){ el.innerHTML = "<b>Sem estimativa.</b> " + esc(r.recusa); E.rEst = ""; return; }

  const p = [];
  /* A marca de saída vem à cabeça, e não numa nota de rodapé. Quando o número está fora
     do que foi medido, isso é a primeira coisa a saber sobre ele — pô-lo depois da
     velocidade seria deixar que a velocidade se lesse sozinha. */
  if(r.det.marca) p.push('<b class="marca-' + r.det.marca.grau + '">' + esc(r.det.marca.r)
    + "</b> — " + esc(r.det.marca.d));

  p.push("Velocidade de propagação estimada: <b>" + Math.round(r.r) + " m/h</b>"
    + " (" + fmtPT(r.r/60, 1) + " m/min), para "
    + esc(r.modelo.c) + ", vento de " + fmtPT(r.u2, 1) + " km/h à superfície, "
    + "humidade do combustível morto " + Math.round(r.hcm) + " % e declive " + Math.round(r.decl) + " %.");

  if(r.modelo.w[0] !== null){
    E.wMin = String(r.modelo.w[0]); E.wMax = String(r.modelo.w[1]);
    p.push("Carga de combustível fino do modelo: " + String(r.modelo.w[0]).replace(".", ",")
      + " a " + String(r.modelo.w[1]).replace(".", ",") + " t/ha. A que arde na frente é <b>menor</b> do que esta,"
      + " e o intervalo é da fonte — reduzi-lo a um número seria inventar precisão.");
  }else{
    E.wMin = ""; E.wMax = "";
    p.push("O documento de referência não publica carga para este modelo: a carga tem de ser estimada no terreno.");
  }

  if(r.eps !== null && Number.isFinite(r.eps)){
    p.push("Razão declive/vento pela ponte declarada: <b>ε ≈ " + fmtPT(r.eps, 3)
      + "</b>. Os quadros de Fernandes são multiplicativos e o Viegas é vetorial; a passagem de um ao outro"
      + " é um pressuposto desta aplicação, não resultado de nenhuma das fontes.");
  }

  if(r.det.fora && r.det.fora.length)
    p.push("<b>ATENÇÃO — fora do domínio da tabela:</b> " + esc(r.det.fora.join("; "))
      + ". O valor foi preso ao extremo do quadro e não é uma predição.");

  E.rEst = String(Math.round(r.r)); E.g = gdhAgora(); E.por = quemRegista();
  el.innerHTML = p.join(" ");
}

$("pr-calc").addEventListener("click", ()=>{ pintarEstimativa(); persistir(false); });
["pr-modelo","pr-alt","pr-decl","pr-u10","pr-hcm"].forEach(id=>{
  const el = $(id); if(!el) return;
  el.addEventListener("input", ()=>{ try{ pintarEstimativa(); }catch(e){} });
  el.addEventListener("change", ()=>{ try{ pintarFichaModelo(); pintarEstimativa(); }catch(e){} });
});

/** Passa a estimativa aos campos que produzem a intensidade — como proposta, com registo. */
$("pr-usar").addEventListener("click", ()=>{
  const E = O.dados.fogo.est;
  if(!E.rEst){ aviso("pr-saida","err","Não há estimativa para passar. Calcula primeiro."); return; }
  $("fg-r").value = E.rEst; O.dados.fogo.r = E.rEst;
  /* Passa-se o **extremo superior** da carga. Não é pessimismo: a decisão que daqui sai é
     se alguém pode estar à frente das chamas, e nessa decisão o erro para baixo custa
     mais caro do que o erro para cima. Fica dito no ecrã e na fita. */
  if(E.wMax){ $("fg-w").value = E.wMax; O.dados.fogo.w = E.wMax; }
  const m = modeloComb(E.modelo);
  /* A marca vai à fita com o número. A fita é o registo permanente da ocorrência: se o
     valor sai de lá para um relatório ou para um inquérito, tem de sair com a reserva
     colada, e não separada dela. */
  const mc = (m && m.motor === "matos")? marcaDeSaida(parseFloat(E.rEst)) : null;
  fita("Velocidade de propagação estimada: " + E.rEst + " m/h para " + (m? m.c : "—")
    + (E.wMax? ", carga " + E.wMax + " t/ha (extremo superior do modelo)" : "")
    + (mc? " — " + mc.r + ", " + mc.d : "")
    + " — guias de fogo controlado (Fernandes et al. 2002b), por " + (E.por||"—"));
  try{ pintarIntensidade(); }catch(e){}
  persistir(false);
  aviso("pr-saida","ok","Passado para os campos abaixo, com a carga no extremo superior do modelo. "
    + "Substitui à mão o que tiver sido observado no terreno: a leitura da frente prevalece sobre o quadro.");
});

try{ encherModelos(); pintarFichaModelo(); }catch(e){}
