/* ================= PLANEAMENTO · modelos de combustível e velocidade de propagação =====
   **Absorvido da linhagem paralela (p0019/t0019), e é o número que faltava.** Até aqui a
   aplicação pedia a velocidade de propagação a quem estivesse ao teclado, porque nenhuma
   das fontes arquivadas a dava para os combustíveis do território. Estas duas dão.

   Uma nota de proveniência que tem de ficar à cabeça, porque é a mais importante deste
   ficheiro: **os quadros abaixo foram transcritos de dois documentos que este repositório
   não tem.** A existência e a referência de ambos estão confirmadas — Fernandes (2003), que
   está em `docs/fontes/`, cita o manual de 2002b na sua bibliografia —, e a coerência
   interna das tabelas está verificada por teste: mais vento nunca dá menos propagação, mais
   humidade nunca dá mais, ar mais húmido nunca dá combustível mais seco. **O que não está
   verificado é a transcrição contra o impresso.** Uma tabela mal copiada passa em qualquer
   teste de coerência e produz comportamento do fogo errado com toda a confiança do mundo.
   Ver `docs/FONTES.md`, chave `FOGOPT`.

/* ==================================================================================
   MODELOS DE COMBUSTÍVEL E VELOCIDADE DE PROPAGAÇÃO

   Duas fontes, e nenhuma delas é desta aplicação:

   · FERNANDES, P.M., LOUREIRO, C. (2021). *Modelos de combustível florestal para
     Portugal — documento de referência*. UTAD/CITAB, Vila Real. Dá o catálogo, os
     parâmetros e a chave de identificação.

   · FERNANDES, P.M., BOTELHO, H.S., LOUREIRO, C. (2002b). *Manual de Formação para a
     Técnica do Fogo Controlado*. UTAD, Vila Real. Dá os quadros de cálculo.

   **Estes são guias de fogo controlado.** Foram construídos sobre fogos de Outono e
   Primavera, de intensidade baixa a moderada. FERNANDES (2003) é explícito: não se
   recomenda o uso destes modelos em condições não abrangidas pela base de dados que lhes
   deu origem. O que aqui se faz é usá-los dentro do domínio de cada quadro e recusar
   fora dele — não é o mesmo que os validar para o Verão, e a aplicação nunca o afirma.
   ================================================================================== */

/**
 * Os 18 modelos de combustível para Portugal.
 *
 * `w` é o intervalo da carga de combustível fino em t/ha, que é o que o Byram consome.
 * Fica intervalo e não valor: o documento dá-o assim, e reduzi-lo a um número seria
 * inventar precisão que a fonte não tem. `motor` diz qual dos guias se aplica — e `null`
 * significa que **não existe motor português para este combustível**, que é informação
 * operacional e não omissão.
 */
const MODELOS_COMB = [
  {c:"F-RAC", n:214, g:"Folhada", d:"Folhada muito compacta de coníferas de agulha curta", w:[4,6],   motor:null},
  {c:"F-FOL", n:212, g:"Folhada", d:"Folhada compacta de folhosas",                          w:[2,5],   motor:null},
  {c:"F-PIN", n:213, g:"Folhada", d:"Folhada de pinhais de agulha média a longa",             w:[4,7],   motor:"pinhal", tipoPin:1},
  {c:"F-EUC", n:211, g:"Folhada", d:"Folhada de eucalipto",                                   w:[4,6],   motor:null},
  {c:"M-CAD", n:221, g:"Folhada e vegetação", d:"Folhosas caducifólias com sub-bosque arbustivo", w:[8,17],  motor:null},
  {c:"M-ESC", n:222, g:"Folhada e vegetação", d:"Folhosas esclerófilas com sub-bosque arbustivo", w:[7,17],  motor:null},
  {c:"M-PIN", n:227, g:"Folhada e vegetação", d:"Pinhal de agulha média a longa com sub-bosque arbustivo", w:[8,18], motor:"pinhal", tipoPin:2},
  {c:"M-EUC", n:223, g:"Folhada e vegetação", d:"Eucaliptal com sub-bosque arbustivo",         w:[9,18],  motor:null},
  {c:"M-EUCd",n:224, g:"Folhada e vegetação", d:"Eucaliptal jovem ou gradado, folhada descontínua", w:[1,4], motor:null},
  {c:"M-H",   n:226, g:"Folhada e vegetação", d:"Povoamento com sub-bosque herbáceo",          w:[2,5],   motor:"pinhal", tipoPin:3},
  {c:"M-F",   n:225, g:"Folhada e vegetação", d:"Povoamento com sub-bosque de fetos",          w:[6,9],   motor:"pinhal", tipoPin:3},
  {c:"V-MAb", n:234, g:"Vegetação", d:"Mato baixo (<1 m) com bastante combustível morto e/ou fino", w:[7,14],  motor:"matos", alt:0.6},
  {c:"V-MAa", n:233, g:"Vegetação", d:"Mato alto (>1 m) com bastante combustível morto e/ou fino",  w:[12,27], motor:"matos", alt:1.5},
  {c:"V-MMb", n:237, g:"Vegetação", d:"Mato baixo (<1 m), pouco combustível morto ou folhagem grosseira", w:[4,8], motor:"matos", alt:0.6},
  {c:"V-MMa", n:236, g:"Vegetação", d:"Mato alto (>1 m), pouco combustível morto ou folhagem grosseira",  w:[10,19], motor:"matos", alt:1.5},
  {c:"V-MH",  n:235, g:"Vegetação", d:"Mato baixo e verde, até 3 anos desde o último fogo",    w:[null,null], motor:"matos", alt:0.4},
  {c:"V-Hb",  n:232, g:"Vegetação", d:"Erva baixa (<0,5 m)",                                   w:[1,1],   motor:null},
  {c:"V-Ha",  n:231, g:"Vegetação", d:"Erva alta (>0,5 m)",                                    w:[2,4],   motor:null}
];

/** Busca um modelo pelo código. */
function modeloComb(c){ return MODELOS_COMB.find(m=>m.c === c) || null; }

/* ---- Quadro 3.2.1 · humidade do combustível morto fino (%) ------------------------
   Entradas: humidade relativa do ar (%) e número de dias sem chuva. A tabela traz
   impresso por baixo que **não é válida acima de 25 °C de temperatura do ar** — e é essa
   linha que separa o fogo controlado do DECIR. */
const Q_HCM_HR = [20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95];
const Q_HCM_D  = [1,2,3,4,5,6,7];
const Q_HCM = [
  [17,15,14,12,11,10, 9],[19,17,16,14,13,12,11],[22,20,18,16,15,13,12],[24,21,19,18,16,15,13],
  [26,23,21,19,17,16,14],[28,25,23,21,19,17,15],[30,27,24,22,20,18,16],[31,28,26,23,21,19,17],
  [33,30,27,25,22,20,18],[35,31,29,26,23,21,19],[36,33,30,27,25,22,20],[38,34,31,28,26,23,21],
  [39,36,32,29,27,24,22],[41,37,34,31,28,25,23],[42,38,35,32,29,26,24],[44,40,36,33,30,27,24]
];
const HCM_TEMP_MAX = 25;

/* ---- Quadro 3.4.1 · velocidade básica de propagação em matos (m/min) --------------
   Fogos a favor do vento, terreno plano (declive < 5 %), matos de 1 m de altura.
   Linhas: vento à superfície (2 m) em km/h. Colunas: humidade do combustível morto. */
const Q_MAT_U = [0.5,1,2,3,4,5,6,7,8,9,10,12,14,16,18,20,22,24,26,28,30];
const Q_MAT_H = [8,10,12,14,16,18,20,22,25,30,35,40];
const Q_MAT_R = [
  [ 0.4, 0.4, 0.3, 0.3, 0.3, 0.2, 0.2, 0.2, 0.2, 0.1, 0.1, 0.1],
  [ 0.9, 0.8, 0.7, 0.6, 0.6, 0.5, 0.4, 0.4, 0.3, 0.2, 0.2, 0.1],
  [ 2.0, 2.0, 1.5, 1.5, 1.0, 1.0, 1.0, 0.8, 0.7, 0.5, 0.4, 0.3],
  [ 3.0, 3.0, 2.5, 2.0, 2.0, 2.0, 1.5, 1.0, 1.0, 0.8, 0.6, 0.4],
  [ 4.0, 4.0, 3.0, 3.0, 2.5, 2.0, 2.0, 2.0, 1.5, 1.0, 0.8, 0.6],
  [ 5.5, 5.0, 4.0, 4.0, 3.0, 3.0, 2.5, 2.0, 2.0, 1.5, 1.0, 0.8],
  [ 6.5, 6.0, 5.0, 4.5, 4.0, 3.5, 3.0, 3.0, 2.0, 2.0, 1.0, 0.9],
  [ 8.0, 7.0, 6.0, 5.5, 5.0, 4.0, 4.0, 3.0, 3.0, 2.0, 1.5, 1.0],
  [ 9.0, 8.0, 7.0, 6.0, 5.5, 5.0, 4.0, 4.0, 3.0, 2.0, 2.0, 1.0],
  [10.0, 9.0, 8.0, 7.0, 6.0, 5.5, 5.0, 4.0, 3.5, 3.0, 2.0, 1.5],
  [11.5,10.0, 9.0, 8.0, 7.0, 6.0, 5.5, 5.0, 4.0, 3.0, 2.0, 1.5],
  [14.0,12.5,11.0,10.0, 8.5, 7.5, 7.0, 6.0, 5.0, 3.5, 3.0, 2.0],
  [16.5,14.5,13.0,11.5,10.0, 9.0, 8.0, 7.0, 6.0, 4.0, 3.0, 2.0],
  [19.0,17.0,15.0,13.0,12.0,10.5, 9.0, 8.0, 7.0, 5.0, 4.0, 2.5],
  [22.0,19.0,17.0,15.0,13.0,12.0,10.5, 9.0, 8.0, 6.0, 4.0, 3.0],
  [24.5,21.5,19.0,17.0,15.0,13.0,12.0,10.5, 8.5, 6.5, 5.0, 3.5],
  [27.0,24.0,21.0,19.0,16.5,15.0,13.0,11.5, 9.5, 7.0, 5.0, 4.0],
  [30.0,26.0,23.0,20.5,18.0,16.0,14.0,13.0,10.5, 8.0, 6.0, 4.0],
  [32.5,29.0,25.5,22.5,20.0,17.5,15.5,14.0,11.5, 8.5, 6.0, 4.5],
  [35.0,31.0,28.0,24.5,21.5,19.0,17.0,15.0,12.5, 9.0, 7.0, 5.0],
  [38.0,33.5,30.0,26.0,23.0,20.5,18.0,16.0,13.5,10.0, 7.0, 5.5]
];

/* Quadro 3.4.2 · correção para a altura da vegetação (multiplicativa). */
const Q_MAT_ALT = [[0.2,0.3],[0.4,0.5],[0.6,0.6],[0.8,0.9],[1.0,1.0],[1.2,1.2],[1.4,1.3],
                   [1.6,1.5],[1.8,1.6],[2.0,1.8],[2.5,2.1],[3.0,2.5]];

/* Quadro 3.4.3 · correção para o declive (multiplicativa). O intervalo −5 a 5 vale 1,0:
   representa-se pelos dois extremos para a interpolação não inventar um degrau. */
const Q_MAT_DECL = [[-40,0.3],[-20,0.5],[-5,1.0],[5,1.0],[10,1.2],[15,1.3],[20,1.5],
                    [25,1.6],[30,1.8],[35,2.0],[40,2.1],[45,2.4],[50,2.6]];

/* ---- Quadros 7.1 e 7.2 · pinheiro bravo (m/h) -------------------------------------
   Linhas: humidade do combustível superficial/elevado. Colunas: vento à superfície.
   Os vazios do canto inferior esquerdo são ausência de dados, não zeros: o fogo não se
   propaga sustentadamente nessas combinações, e extrapolar para lá seria produzir
   propagação onde a fonte diz que não a há. */
const Q_PIN_U = [0.5,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0,5.5,6.0];
const Q_PIN_H = [12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,45,50,55];
const Q_PIN_R = [
  [54,74,89,102,114,125,135,144,153,161,169,177],
  [52,70,85, 98,109,119,129,138,146,154,162,169],
  [49,67,81, 93,104,114,123,131,140,147,154,161],
  [47,64,78, 89, 99,109,117,126,133,141,148,154],
  [45,61,74, 85, 95,104,112,120,127,134,141,147],
  [43,59,71, 81, 91, 99,107,115,122,128,135,141],
  [41,56,68, 78, 87, 95,102,109,116,122,128,134],
  [39,53,65, 74, 83, 91, 98,104,111,117,123,128],
  [37,51,62, 71, 79, 86, 93,100,106,112,117,123],
  [36,49,59, 68, 75, 83, 89, 95,101,107,112,117],
  [34,47,56, 65, 72, 79, 85, 91, 97,102,107,112],
  [33,44,54, 62, 69, 75, 81, 87, 92, 97,102,107],
  [31,42,51, 59, 66, 72, 78, 83, 88, 93, 98,102],
  [30,41,49, 56, 63, 69, 74, 79, 84, 89, 93, 97],
  [28,39,47, 54, 60, 66, 71, 76, 80, 85, 89, 93],
  [25,34,42, 48, 53, 58, 63, 67, 72, 76, 79, 83],
  [null,31,37,43,48,52,56,60,64,67,71,74],
  [null,null,null,null,null,null,null,54,57,60,63,66]
];
const Q_PIN_DECL = [[-40,0.4],[-30,0.5],[-20,0.6],[-15,0.7],[-10,0.8],[-5,0.9],[0,1.0],
                    [5,1.1],[10,1.3],[15,1.4],[20,1.6],[25,1.8],[30,2.0],[35,2.2],[40,2.5]];
/* Aditivo, em m/h, e por isso aplicado **depois** do declive. Os tipos são os do ponto
   6.1 do guia E2: 1 folhada com coberto de sub-bosque inferior a 30 %; 2 arbustos sobre
   folhada; 3 herbáceas ou fetos sobre folhada. */
const Q_PIN_TIPO = {1:-35, 2:-6, 3:71};

/* ---- interpolação ---------------------------------------------------------------- */

/**
 * Interpolação linear numa tabela de pares, **sem extrapolar**.
 *
 * Fora do domínio devolve o extremo e diz que o fez. Uma tabela empírica não sabe nada
 * do que está para lá da sua última linha, e prolongar a recta seria a aplicação a
 * inventar comportamento do fogo onde a fonte se cala.
 *
 * @returns {{v:number, fora:number}} `fora` é -1 abaixo, +1 acima, 0 dentro
 */
function interpPares(tab, x){
  if(x <= tab[0][0]) return { v:tab[0][1], fora: x < tab[0][0]? -1 : 0 };
  const u = tab[tab.length-1];
  if(x >= u[0]) return { v:u[1], fora: x > u[0]? 1 : 0 };
  for(let i=1;i<tab.length;i++){
    if(x <= tab[i][0]){
      const a = tab[i-1], b = tab[i];
      return { v: a[1] + (b[1]-a[1])*(x-a[0])/(b[0]-a[0]), fora:0 };
    }
  }
  return { v:u[1], fora:1 };
}

/** O índice e a fração de `x` num eixo ordenado, preso aos extremos. */
function posEixo(eixo, x){
  if(x <= eixo[0]) return { i:0, f:0, fora: x < eixo[0]? -1 : 0 };
  const n = eixo.length-1;
  if(x >= eixo[n]) return { i:n-1, f:1, fora: x > eixo[n]? 1 : 0 };
  for(let i=1;i<=n;i++) if(x <= eixo[i])
    return { i:i-1, f:(x-eixo[i-1])/(eixo[i]-eixo[i-1]), fora:0 };
  return { i:n-1, f:1, fora:1 };
}

/**
 * Interpolação bilinear numa matriz, com buracos.
 *
 * Se algum dos quatro cantos for `null` a célula não se calcula: devolve-se nulo em vez
 * de tratar a ausência como zero, que produziria propagação lenta onde a fonte diz que
 * não há propagação sustentada nenhuma.
 */
function interpMatriz(eixoL, eixoC, mat, xl, xc){
  const a = posEixo(eixoL, xl), b = posEixo(eixoC, xc);
  /* Num acerto exato sobre uma linha ou coluna do quadro **não se lê a vizinha**. Parece
     detalhe e não é: no Quadro 7.1 a última linha de humidade só tem valores a partir de
     4,0 km/h, e ler a coluna dos 3,5 — vazia — descartava a célula que existe por causa
     de uma que não fazia falta. O quadro ficava inutilizável exatamente nos seus limites,
     que é onde é mais consultado. */
  const li = a.f >= 1? [a.i+1] : (a.f <= 0? [a.i] : [a.i, a.i+1]);
  const ci = b.f >= 1? [b.i+1] : (b.f <= 0? [b.i] : [b.i, b.i+1]);
  const q = [];
  li.forEach(l=>ci.forEach(c=>q.push(mat[l] && mat[l][c])));
  if(q.some(v=>v === null || v === undefined)) return { v:null, fora:a.fora||b.fora };
  const g = (l,c)=>mat[li[l]][ci[c]];
  const fb = ci.length > 1? b.f : 0, fa = li.length > 1? a.f : 0;
  const t = ci.length > 1? g(0,0)*(1-fb) + g(0,1)*fb : g(0,0);
  const u = li.length > 1? (ci.length > 1? g(1,0)*(1-fb) + g(1,1)*fb : g(1,0)) : t;
  return { v: t*(1-fa) + u*fa, fora: a.fora || b.fora };
}

/* ---- os passos ------------------------------------------------------------------- */

/**
 * Vento à superfície (2 m) a partir do vento a 10 m.
 *
 * Quadro 3.3.1: o vento à superfície é aproximadamente **dois terços** do vento a 10 m.
 * É a conversão publicada, e substitui o fator arbitrado entre 0,1 e 0,5 que se usaria
 * sem ela — que era o maior buraco isolado desta cadeia.
 */
function ventoSuperficie(u10){ return u10 * 2/3; }

/**
 * Humidade do combustível morto fino, do Quadro 3.2.1.
 *
 * Recusa acima de 25 °C. Não avisa: recusa. Um aviso ignora-se às três da manhã; uma
 * recusa obriga a ir buscar o número a quem o tem.
 */
function humidadeCombustivel(hr, dias, tempC){
  if(Number.isFinite(tempC) && tempC > HCM_TEMP_MAX)
    return { v:null, recusa:"O Quadro 3.2.1 traz impresso que não é válido acima de "+HCM_TEMP_MAX
      +" °C de temperatura do ar. Estão previstos "+Math.round(tempC)+" °C. A humidade do combustível"
      +" morto tem de vir de outra fonte — do sistema FWI ou de medição — e ser declarada." };
  const r = interpMatriz(Q_HCM_HR, Q_HCM_D, Q_HCM, hr, Math.min(dias, 7));
  if(r.v === null) return { v:null, recusa:"Fora do domínio do Quadro 3.2.1." };
  return { v:r.v, fora:r.fora };
}

/**
 * Velocidade de propagação em matos, em m/h.
 *
 * Sequência do ponto 3.4 do guia E1: velocidade básica do vento e da humidade, corrigida
 * pela altura da vegetação, corrigida pelo declive. As três correções são
 * multiplicativas — o que significa que **o declive não desvia a cabeça, multiplica-a**.
 */
function propagacaoMatos(u2, hcm, altura, declive){
  const base = interpMatriz(Q_MAT_U, Q_MAT_H, Q_MAT_R, u2, hcm);
  if(base.v === null) return null;
  const fa = interpPares(Q_MAT_ALT, altura), fd = interpPares(Q_MAT_DECL, declive);
  const fora = [];
  if(base.fora) fora.push("vento ou humidade fora do Quadro 3.4.1 (vento 0,5–30 km/h a 2 m; humidade 8–40 %)");
  if(fa.fora)   fora.push("altura da vegetação fora do Quadro 3.4.2 (0,2–3,0 m)");
  if(fd.fora)   fora.push("declive fora do Quadro 3.4.3 (−40 % a 50 %)");
  return { r: base.v * fa.v * fd.v * 60, rBase:base.v, fAlt:fa.v, fDecl:fd.v, fora };
}

/**
 * Velocidade de propagação em pinheiro bravo, em m/h.
 *
 * Quadros 7.1 e 7.2. Atenção à ordem e à natureza das correções: o declive é
 * **multiplicativo** e o tipo de combustível é **aditivo**. Trocar a ordem, ou tratar as
 * duas como iguais, dá números diferentes — e é por isso que este motor não pode ser o
 * mesmo dos matos, onde tudo é multiplicativo.
 */
function propagacaoPinhal(u2, hcm, declive, tipo){
  const base = interpMatriz(Q_PIN_H, Q_PIN_U, Q_PIN_R, hcm, u2);
  if(base.v === null) return null;
  const fd = interpPares(Q_PIN_DECL, declive);
  const ad = Q_PIN_TIPO[tipo];
  if(ad === undefined) return null;
  const fora = [];
  if(base.fora) fora.push("vento ou humidade fora do Quadro 7.1 (vento 0,5–6,0 km/h à superfície; humidade 12–55 %)");
  if(fd.fora)   fora.push("declive fora do Quadro 7.2 (−40 % a 40 %)");
  return { r: Math.max(0, base.v * fd.v + ad), rBase:base.v, fDecl:fd.v, adTipo:ad, fora };
}

/**
 * A razão declive/vento de Viegas, a partir dos quadros multiplicativos.
 *
 * **Isto é uma ponte declarada, não um resultado de nenhuma das fontes.** Os quadros de
 * Fernandes são multiplicativos: o declive amplia a propagação que o vento já produziu.
 * Viegas é vetorial: o declive acrescenta uma parcela própria. Para passar de um para o
 * outro toma-se como parcela de declive o acréscimo que o declive produz sobre a
 * propagação sem vento, e como parcela de vento o acréscimo que o vento produz sobre a
 * mesma base:
 *
 *     ε = R₀·(f_declive − 1) / (R(U) − R₀)
 *
 * Quem discordar da ponte discorda de mim, não de Fernandes nem de Viegas. Fica escrita
 * aqui e no ecrã para poder ser recusada.
 */
function epsilonDosQuadros(u2, hcm, declive){
  const r0 = interpMatriz(Q_MAT_U, Q_MAT_H, Q_MAT_R, Q_MAT_U[0], hcm);
  const ru = interpMatriz(Q_MAT_U, Q_MAT_H, Q_MAT_R, u2, hcm);
  const fd = interpPares(Q_MAT_DECL, declive);
  if(r0.v === null || ru.v === null) return null;
  const dv = ru.v - r0.v;
  if(dv <= 0.01) return null;      /* sem vento não há razão: o denominador anula-se */
  return r0.v * (fd.v - 1) / dv;
}

/** O declive em percentagem que o painel do terreno declara, ao centro da classe. */
const DECLIVE_CLASSE = { suave:5, moderado:15, acentuado:27, muito:40 };

/**
 * Reúne as entradas, corre o motor que o modelo pedir, e devolve a estimativa **ou a
 * razão pela qual não há estimativa**. Nunca as duas coisas ao mesmo tempo.
 */
function estimarPropagacao(){
  const E = O.dados.fogo.est, m = modeloComb(E.modelo);
  const rec = t => ({ ok:false, recusa:t });

  if(!m) return rec("Escolhe o modelo de combustível. Sem ele não há carga nem motor de propagação.");
  if(!m.motor) return rec("Não existe motor de propagação português para o modelo "+m.c+" ("+m.d
    +"). Os guias de fogo controlado de Fernandes cobrem matos (E1) e pinheiro bravo (E2); "
    +"eucaliptal, folhosas e formações herbáceas ficam de fora. A velocidade de propagação "
    +"tem de ser observada no terreno e escrita à mão.");

  const u10 = parseFloat(String(E.u10).replace(",", "."));
  if(!Number.isFinite(u10) || u10 < 0) return rec("Falta a velocidade do vento a 10 m.");
  const u2 = ventoSuperficie(u10);

  let hcm = parseFloat(String(E.hcm).replace(",", "."));
  if(!Number.isFinite(hcm)) return rec("Falta a humidade do combustível morto fino.");

  let decl = parseFloat(String(E.declive).replace(",", "."));
  if(!Number.isFinite(decl)) return rec("Falta o declive.");

  let p, alt = null;
  if(m.motor === "matos"){
    alt = parseFloat(String(E.altura).replace(",", "."));
    if(!Number.isFinite(alt) || alt <= 0) return rec("Falta a altura média da vegetação, que o Quadro 3.4.2 exige.");
    p = propagacaoMatos(u2, hcm, alt, decl);
  }else{
    /* `E.tipoPin` vem do estado e é texto; `m.tipoPin` vem do registo e é número. O
       `parseInt` aceita os dois em silêncio, e é por aí que passam os enganos. */
    const tipo = parseInt(String(E.tipoPin || m.tipoPin), 10);
    p = propagacaoPinhal(u2, hcm, decl, tipo);
  }
  if(!p) return rec("Nesta combinação de vento e humidade a fonte não dá propagação sustentada. "
    +"Não é propagação lenta: é ausência de dados, e a aplicação não a substitui por zero.");

  return { ok:true, r:p.r, u2, hcm, alt, decl, det:p, modelo:m,
    eps: m.motor === "matos"? epsilonDosQuadros(u2, hcm, decl) : null };
}
