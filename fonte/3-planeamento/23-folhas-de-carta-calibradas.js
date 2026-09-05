/* ================= PLANEAMENTO · folhas de carta calibradas ================= */
/**
 * Uma imagem de carta colocada no terreno, para se poder desenhar por cima dela.
 *
 * O PCO trabalha com cartas em papel e com fotografias delas. Uma captura de ecrã da carta
 * militar, um recorte de um PDF, a folha que alguém fotografou na parede — nenhuma dessas
 * imagens sabe onde está. Este módulo dá-lhes coordenadas, por duas vias que o utilizador
 * escolhe conforme o que tem à mão: o ficheiro de referenciação que acompanha a imagem
 * quando ela veio de um sistema de informação geográfica, ou dois pontos que alguém
 * reconhece na imagem e cuja coordenada sabe.
 *
 * Absorvido do trabalho da linhagem paralela em 2 de setembro, e **reimplementado a partir
 * das 53 asserções do guião `t0001` do ramo #002, não traduzido do remendo** — a tradução
 * de remendos custou três defeitos em três tentativas, e o argumento de que os testes
 * atravessam e os remendos não estava certo.
 */

/* A convenção do ficheiro de referenciação, seis linhas na ordem A, D, B, E, C, F. Fica
   declarada porque a ordem não é adivinhável: as duas do meio são a rotação, e trocá-las
   com as da escala põe a folha de lado sem dar erro nenhum. */
const LINHAS_REFERENCIACAO = ["A", "D", "B", "E", "C", "F"];

/**
 * Lê um ficheiro de referenciação e devolve os seis coeficientes, ou nada.
 *
 * **A vírgula decimal é recusada, não interpretada.** Um `parseFloat("2,5")` devolve 2 sem
 * se queixar, e uma folha a 2 m/px em vez de 2,5 fica 20 % fora de escala — erro que só se
 * vê quando já se mediu uma distância de segurança por cima dela. O ficheiro é um formato
 * de máquina, com ponto decimal; quem o escreveu com vírgula escreveu-o mal, e é melhor
 * dizê-lo do que adivinhar.
 */
function lerFicheiroReferenciacao(texto){
  const linhas = String(texto == null? "" : texto).split(/\r?\n/).map(l=>l.trim()).filter(l=>l !== "");
  if(linhas.length !== 6) return null;
  const out = {};
  for(let i = 0; i < 6; i++){
    if(!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(linhas[i])) return null;
    const v = Number(linhas[i]);
    if(!isFinite(v)) return null;
    out[LINHAS_REFERENCIACAO[i]] = v;
  }
  return out;
}

/**
 * Deriva os seis coeficientes de dois pontos que alguém reconheceu na imagem.
 *
 * Dois pontos dão uma **semelhança** — escala igual nos dois eixos, mais rotação — e não
 * uma afim geral: com quatro graus de liberdade não se determinam seis. É por isso que
 * `|A|` e `|E|` saem iguais, e é honesto que assim seja: fingir uma afim a partir de dois
 * pontos seria inventar duas grandezas que ninguém mediu.
 *
 * @param {{px:number,py:number,E:number,N:number}} p1
 * @param {{px:number,py:number,E:number,N:number}} p2
 */
function calibrarPorDoisPontos(p1, p2){
  if(!p1 || !p2) return null;
  const dpx = p2.px - p1.px, dpy = p2.py - p1.py;
  const dE = p2.E - p1.E, dN = p2.N - p1.N;
  if(!isFinite(dpx) || !isFinite(dpy) || !isFinite(dE) || !isFinite(dN)) return null;
  const d2 = dpx*dpx + dpy*dpy;
  if(d2 === 0) return null;                       /* mesmo pixel: não há escala */
  if(dE === 0 && dN === 0) return null;           /* mesmo ponto no terreno: a folha colapsa */
  /* A imagem tem o eixo vertical invertido face ao terreno: `py` cresce para baixo e o
     Norte decresce. A semelhança que respeita essa inversão é [[a, b], [b, -a]], e é ela
     que dá `E` negativo sem rotação — como o ficheiro de referenciação escreve. */
  const a = (dE*dpx - dN*dpy) / d2;
  const b = (dE*dpy + dN*dpx) / d2;
  const w = { A:a, D:b, B:b, E:-a, C:0, F:0 };
  w.C = p1.E - (w.A*p1.px + w.B*p1.py);
  w.F = p1.N - (w.D*p1.px + w.E*p1.py);
  return w;
}

/* O envelope do continente em PT-TM06, alargado face ao que a DGT declara na altimetria:
   uma folha na fronteira ou nas ilhas não é um erro, e por isso isto avisa e não recusa. */
const ENVELOPE_PTTM06 = { eMin:-130000, eMax:165000, nMin:-302000, nMax:280000 };

/**
 * Coloca uma folha no terreno, ou recusa a descrição e diz que não.
 *
 * Recusa quatro coisas, e nenhuma por gosto de recusar: sem `id` a escrita na base falha
 * em silêncio, porque a loja tem `keyPath`; sem grelha declarada não se sabe em que
 * projeção estão os seis números, e os ficheiros não trazem essa informação; sem
 * proveniência é uma imagem anónima a fazer de carta; e com determinante nulo não há
 * inversa, e `paraPixel` devolveria infinito em vez de erro.
 *
 * **Fora do envelope avisa e deixa passar.** Recusar seria decidir por quem está no PCO
 * que a folha está errada, quando pode ser dos Açores, da Madeira ou de Espanha.
 */
function folhaCalibrada(desc){
  if(!desc || typeof desc !== "object") return null;
  const m = desc.mundo;
  if(!m || typeof m !== "object") return null;
  if(!desc.id || !String(desc.id).trim()) return null;
  if(!desc.grelha || !GRELHAS[desc.grelha]) return null;
  if(!desc.proveniencia || !String(desc.proveniencia).trim()) return null;
  const A = +m.A, D = +m.D, B = +m.B, E = +m.E, C = +m.C, F = +m.F;
  if(![A, D, B, E, C, F].every(v=>isFinite(v))) return null;
  const det = A*E - D*B;
  if(!det) return null;
  const larg = +desc.largura, alt = +desc.altura;
  if(!(larg > 0) || !(alt > 0)) return null;

  const folha = {
    id: String(desc.id), nome: String(desc.nome || desc.id),
    largura: larg, altura: alt,
    mundo: {A, D, B, E, C, F},
    grelha: desc.grelha,
    num: String(desc.num || ""),
    proveniencia: String(desc.proveniencia),
    /* Zero é o ficheiro de referenciação, dois é a calibração manual. Não é enfeite: a
       confiança na colocação depende de quantos pontos a fixaram, e quem lê o retrato
       precisa de saber se a folha veio medida ou declarada. */
    pontos: Number(desc.pontos) || 0,
    /* Os pontos que a fixaram, quando foi calibrada à mão. Guardam-se além da contagem
       porque são o que permite **duvidar da colocação**: sem eles, a escala que sai dos
       seis coeficientes não se pode confrontar com nada. Vazio quando veio de ficheiro de
       referenciação, que não os tem. */
    controlos: Array.isArray(desc.controlos)
      ? desc.controlos.filter(p=>p && [p.px,p.py,p.E,p.N].every(v=>isFinite(+v)))
          .map(p=>({px:+p.px, py:+p.py, E:+p.E, N:+p.N}))
      : [],
    /** O ponto do terreno que está debaixo deste pixel. */
    paraMundo(px, py){ return { E: A*px + B*py + C, N: D*px + E*py + F }; },
    /** O pixel da imagem que está por cima deste ponto do terreno. */
    paraPixel(e, n){
      const de = e - C, dn = n - F;
      return { px: ( E*de - B*dn) / det, py: (-D*de + A*dn) / det };
    },
    /** Se o pixel cai dentro da imagem. Os limites são 0 a largura-1, como os índices. */
    dentro(px, py){ return px >= 0 && py >= 0 && px <= larg-1 && py <= alt-1; },
    /** Se esta folha se pode desenhar na grelha dada. Um mosaico desenhado não se reprojeta. */
    compativel(k){ return desc.grelha === k; }
  };
  /* O aviso calcula-se dos quatro cantos e não do canto de referência: uma folha grande
     pode ter o canto dentro e o resto fora. Só se afere em PT-TM06, que é a única grelha
     cujo envelope se conhece. */
  folha.foraDoEnvelope = desc.grelha === "pttm06" && [[0,0],[larg-1,0],[0,alt-1],[larg-1,alt-1]]
    .some(([px,py])=>{ const p = folha.paraMundo(px,py);
      return p.E < ENVELOPE_PTTM06.eMin || p.E > ENVELOPE_PTTM06.eMax
          || p.N < ENVELOPE_PTTM06.nMin || p.N > ENVELOPE_PTTM06.nMax; });
  return folha;
}

/* Acima desta divergência entre a escala plana da folha e a distância esférica entre os
   pontos de controlo, a discordância deixa de se explicar pela diferença de modelo. Medida
   numa folha do Douro: 0,19 %. Meio por cento é folga de mais do dobro sobre isso.

   **Leia-se com cuidado o que esta verificação apanha, porque não é o que parece.** Numa
   folha calibrada por dois pontos, a escala é *definida* por esses dois pontos: `mpp·dpx`
   é identicamente a distância entre eles, e o confronto seria tautológico se os dois lados
   viessem do mesmo sítio. Não vêm — um é plano em PT-TM06 e o outro é esférico —, e é só
   essa diferença que se mede. Comprovado: um erro de 40 km no Este de um controlo leva o
   desvio de 0,19 % a 0,25 %, e passa. **Isto não deteta uma coordenada mal escrita.**

   O que deteta é a fundação: se `paraTM06`, `deTM06` ou `distanciaM` se partirem, os dois
   modelos deixam de concordar e isto dispara. É por isso que existe, e é só isso que
   promete. Uma primeira versão anunciava-a como quem confere as coordenadas escritas à
   mão, e essa afirmação era falsa. */
const AFERICAO_DESVIO_MAX = 0.005;

/**
 * A escala da folha, e o confronto entre os dois modelos que a medem.
 *
 * `mpp` sai do determinante: é o lado do terreno que um pixel cobre, e numa semelhança é o
 * mesmo nos dois eixos. `esferico` é a distância entre os dois pontos de controlo medida
 * pela via independente — a esférica de `distanciaM` —, e `desvio` é o quanto as duas
 * discordam em proporção. Ver acima o que esse desvio apanha, que é menos do que parece.
 *
 * **Devolve nada, e nunca zero, quando não há por onde aferir.** Um `mpp` de 0, ou NaN,
 * entra no ecrã como se fosse uma escala; não haver aferição tem de se distinguir de haver
 * uma má, e é por isso que a ausência é `null` e não um número. Apontado pelo ramo #001.
 *
 * Sem pontos de controlo — folha vinda de ficheiro de referenciação — há `mpp` e não há
 * confronto: `esferico` e `desvio` ficam nulos, que é a resposta honesta.
 */
function folhaAfericao(f){
  if(!f || !f.mundo) return null;
  const m = f.mundo, det = m.A*m.E - m.D*m.B;
  if(!isFinite(det) || !det) return null;
  /* **Metros da projeção não são metros do terreno**, e o Web Mercator é o caso extremo:
     a 41° N infla 32,7 %, medido. Uma folha em Mercator a «25 m/px» cobre 18,8 m de
     terreno por pixel, e quem medisse por cima dela errava um terço.

     A r0086 devolvia a raiz do determinante e chamava-lhe m/px sem mais. Apanhado pelo
     ramo #004, que mediu 33,1 % contra os 32,7 % que se reproduzem aqui — é a mesma coisa,
     à latitude de ensaio. O PT-TM06 não tem este problema: é Transversa de Mercator com
     fator de escala 1 no meridiano central, e no continente o desvio fica muito abaixo do
     que uma folha de carta resolve. */
  const mppProj = Math.sqrt(Math.abs(det));
  const G = GRELHAS[f.grelha];
  const centro = f.paraMundo? f.paraMundo((f.largura-1)/2, (f.altura-1)/2) : null;
  const geo = (G && centro && G.metros)? gDeGrelha(G, centro.E, centro.N) : null;
  /* O fator de escala do Web Mercator é 1/cos(φ) e varia ao longo da folha; toma-se no
     centro e declara-se a latitude a que vale, em vez de se fingir um número único. */
  const k = (f.grelha === "mercator" && geo)? 1/Math.cos(geo.lat*Math.PI/180) : 1;
  const out = { mpp: mppProj/k, mppProj, escalaProj:k, latRef: geo? geo.lat : null,
                esferico:null, desvio:null, suspeita:false };
  const c = f.controlos || [];
  if(c.length !== 2 || f.grelha !== "pttm06") return out;
  const dpx = Math.hypot(c[1].px - c[0].px, c[1].py - c[0].py);
  if(!dpx) return out;
  const a = deTM06(c[0].E, c[0].N), b = deTM06(c[1].E, c[1].N);
  const esf = distanciaM(a.lat, a.lon, b.lat, b.lon);
  if(!esf) return out;
  out.esferico = esf;
  out.desvio = Math.abs(out.mpp*dpx - esf) / esf;
  out.suspeita = out.desvio > AFERICAO_DESVIO_MAX;
  return out;
}

/**
 * A projeção em que as folhas colocadas estão, ou nada quando não há nenhuma.
 *
 * **Todas as folhas da sessão partilham a projeção, e a primeira é que a fixa.** Até à
 * r0092 quem decidia era `FOLHAS[0]`, e um índice fixo a decidir política é frágil por
 * construção — o ramo #001 tirou-lhe três consequências, todas más:
 *
 * - uma segunda folha noutra projeção entrava, aparecia na lista com escala e proveniência,
 *   gravava-se na base **e nunca se desenhava**, sem uma palavra;
 * - duas folhas pela ordem trocada davam mapas diferentes, e nada no ecrã o explicava;
 * - retirar a primeira reprojetava o mapa inteiro, e com ele a posição aparente das frentes,
 *   dos setores e dos meios — uma operação que parece local a mexer em tudo.
 *
 * Fixar a projeção na primeira e **recusar as seguintes na colocação** resolve as três de
 * uma vez, e recusa em voz alta em vez de aceitar em silêncio.
 */
function grelhaDasFolhas(){ return FOLHAS.length? FOLHAS[0].grelha : null; }

/**
 * A razão por que esta folha não pode ser colocada, ou nada quando pode.
 *
 * Vive fora de `colocarFolha` para poder ser exercitada sem formulário nem ficheiro: a
 * decisão é a parte que interessa prender, e dentro do manipulador de clique só se
 * verificava lendo o código-fonte, que é verificar a forma e não o comportamento.
 */
function recusaPorProjecao(g){
  const gS = grelhaDasFolhas();
  if(!gS || gS === g) return null;
  const nome = k => (GRELHAS[k]? GRELHAS[k].n : k);
  return "Já há uma folha colocada em " + nome(gS) + " e esta é " + nome(g)
    + ". O mapa desenha numa projeção de cada vez, e um mosaico já desenhado não se reprojeta — "
    + "esta folha entraria e nunca apareceria. Retira as que lá estão, ou converte esta.";
}

/* As folhas colocadas nesta sessão. Vive fora de `O` de propósito: a imagem de uma folha
   pesa megabytes e não cabe no pacote da ocorrência, que viaja por ficheiro de texto. O
   que fica gravado é a colocação, na loja `folhas` da base; a imagem volta a ser escolhida
   por quem abre a aplicação, tal como a carta pré-descarregada. */
let FOLHAS = [];

/** A colocação de uma folha, sem a imagem — é isto que se grava e que se lê de volta. */
function colocacaoDaFolha(f){
  /* `num`: a ocorrência a que a folha pertence. Sem isto `carregarFolhas` trazia todas as
     folhas da base e a do TO da ocorrência A ficava desenhada sobre a B — e podia até
     decidir a projeção do mapa dela. Uma folha colocada antes de a ocorrência ter número
     fica com o número na próxima gravação, porque é aqui que ele se carimba. */
  return { id:f.id, nome:f.nome, largura:f.largura, altura:f.altura,
           mundo:f.mundo, grelha:f.grelha, proveniencia:f.proveniencia,
           pontos:f.pontos, controlos:f.controlos, num:String((O && O.meta && O.meta.num) || "") };
}

/**
 * Guarda a colocação das folhas, para que uma folha calibrada não se perca ao fechar.
 *
 * **Numa transação só.** Era um `clear()` numa transação e um `put()` por folha em
 * transações seguintes — achado do ramo #001: entre o `clear()` e o primeiro `put()` a loja
 * estava vazia, e um fecho da aba, uma falha de energia ou um `carregarFolhas` de outra
 * aba nesse instante liam «sem folhas» e era verdade. Dentro da mesma transação o
 * IndexedDB ou aplica tudo ou não aplica nada, e nunca há um instante em que a loja
 * esteja meio escrita.
 */
async function guardarFolhas(){
  try{
    const colocacoes = FOLHAS.map(colocacaoDaFolha);
    await _idb("folhas", "readwrite", st=>{ st.clear(); colocacoes.forEach(c=>st.put(c)); });
  }catch(e){}
}

/**
 * Traz de volta as folhas colocadas numa sessão anterior.
 *
 * A imagem não volta — só a colocação. Uma folha sem imagem continua a valer: diz onde
 * está, aparece no retrato com a sua proveniência, e basta escolher outra vez o ficheiro
 * para voltar a desenhar-se.
 */
async function carregarFolhas(){
  let guardadas = null;
  try{ guardadas = await _idb("folhas", "readonly", st=>st.getAll()); }catch(e){ return; }
  if(!Array.isArray(guardadas)) return;
  /* Só as desta ocorrência. As de antes da r0099 não têm número e contam como de nenhuma:
     aparecem enquanto não houver ocorrência aberta e ganham o número na próxima gravação. */
  const minha = String((O && O.meta && O.meta.num) || "");
  const lidas = guardadas.filter(x=>String((x && x.num) || "") === minha).map(x=>folhaCalibrada(x));
  /* **O que se perde anuncia-se.** Uma folha gravada que deixe de passar a validação — por
     a revisão ter apertado uma recusa, ou por a base ter uma colocação de antes da regra da
     projeção única — desaparecia sem uma palavra. É a mesma classe do `null` silencioso da
     IndexedDB que se corrigiu na r0083. Apontado pelo ramo #001. */
  FOLHAS = lidas.filter(Boolean);
  const gSessao = grelhaDasFolhas();
  const fora = FOLHAS.filter(f=>f.grelha !== gSessao);
  if(fora.length) FOLHAS = FOLHAS.filter(f=>f.grelha === gSessao);
  const perdidas = lidas.length - lidas.filter(Boolean).length;
  if(perdidas || fora.length) fita("Folhas de carta: " + FOLHAS.length + " reposta(s)"
    + (perdidas? "; " + perdidas + " descartada(s) por a colocação já não ser utilizável" : "")
    + (fora.length? "; " + fora.length + " descartada(s) por estar(em) noutra projeção que não a de "
        + (GRELHAS[gSessao]? GRELHAS[gSessao].n : gSessao) : "") + ".");
}

/** O número escrito num campo, com vírgula ou ponto, ou nada quando o campo não tem número. */
function numFolha(id){
  return numPT(($(id) && $(id).value) || "");
}

/** Lê um ficheiro escolhido como texto, para o ficheiro de referenciação. */
function lerTextoDoFicheiro(f){
  return new Promise(resolve=>{
    const r = new FileReader();
    r.onload = ()=>resolve(String(r.result || ""));
    r.onerror = ()=>resolve("");
    r.readAsText(f);
  });
}

/**
 * A partir de quantos megapixéis uma folha é pesada.
 *
 * Uma imagem descodificada ocupa quatro bytes por pixel, seja qual for o tamanho do
 * ficheiro: 25 Mpx são 100 MB em memória, por folha, enquanto ela estiver colocada — e o
 * navegador guarda a cópia descodificada de cada uma. Num posto modesto, com duas folhas
 * assim e o mapa por cima, é o suficiente para o separador começar a arrastar-se ou a cair.
 *
 * O limiar é de prudência e não de recusa: uma carta militar 1:25 000 digitalizada a
 * 300 ppp anda pelos 8 a 10 Mpx e passa folgada; a 600 ppp ultrapassa-o, e é quando
 * interessa dizer que sim, entra, mas custa.
 */
const FOLHA_PESADA_MPX = 25;

/**
 * O aviso de uma folha pesada, ou vazio se não for o caso.
 *
 * **Declara, não bloqueia** — pedido do ramo #005, e a doutrina do carimbo do navegador:
 * recusar tirava a folha a quem tem uma máquina que a aguenta; dizê-lo deixa-o decidir a
 * saber. Quem tiver a folha a arrastar o mapa sabe onde procurar.
 */
function avisoFolhaPesada(largura, altura){
  const mpx = (Number(largura) * Number(altura)) / 1e6;
  if(!Number.isFinite(mpx) || mpx <= FOLHA_PESADA_MPX) return "";   /* «acima de»: no limiar exacto ainda não */
  return "Folha pesada: " + largura + "×" + altura + " px, " + mpx.toFixed(0) + " Mpx — cerca de "
    + Math.round(mpx * 4) + " MB em memória enquanto estiver colocada. Num posto modesto pode "
    + "tornar o mapa lento; se for o caso, digitaliza a 300 ppp ou recorta ao que interessa.";
}

/**
 * Lê a imagem escolhida e mede-a.
 *
 * A largura e a altura vêm da imagem e não de campos: são as únicas duas grandezas desta
 * operação que não se pedem a ninguém, porque estão no ficheiro. Pedi-las seria convidar
 * a um engano que ninguém detetaria — uma folha declarada com mais pixéis do que tem fica
 * encolhida no mapa sem dar erro.
 */
function lerImagemDaFolha(f){
  return new Promise(resolve=>{
    /* **Referência, e não conteúdo embutido.** Até à r0091 lia-se o ficheiro para uma data
       URL e essa cadeia — 4 a 8 MB numa folha digitalizada — entrava no `<image href>` a
       cada repintura do mapa. O ramo #005 mediu o custo: 103 ms no `innerHTML` da segunda
       repintura, com três folhas, **numa máquina de servidor**; 300 a 500 ms num posto
       modesto, por cada deslocamento e cada mudança de nível. E o custo era por repintura,
       não da primeira vez.
       Um `blob:` tem meia centena de caracteres, o base64 sai do caminho de repintura, e a
       imagem fica em memória uma vez em vez de uma cópia por cadeia. A URL é revogada em
       `retirarFolha`, ou a memória fica presa até o separador fechar. */
    let url;
    try{ url = URL.createObjectURL(f); }catch(e){ return resolve(null); }
    const im = new Image();
    im.onload = ()=>resolve({ url, largura:im.naturalWidth || im.width, altura:im.naturalHeight || im.height });
    im.onerror = ()=>{ try{ URL.revokeObjectURL(url); }catch(e){} resolve(null); };
    im.src = url;
  });
}

/**
 * Coloca a folha que está no formulário, ou diz porque não a colocou.
 *
 * As recusas de `folhaCalibrada` são silenciosas por desenho — devolve `null` e não sabe
 * quem a chamou. É aqui que se traduz em português o que faltou, porque é aqui que há
 * alguém à espera de resposta.
 */
async function colocarFolha(){
  const dizer = (t, txt)=>aviso("fo-msg", t, txt);
  const fi = $("fo-img"), ff = $("fo-wf");
  if(!fi || !fi.files || !fi.files.length) return dizer("err", "Escolhe a imagem da folha.");
  const nome = String($("fo-nome").value || "").trim();
  const prov = String($("fo-prov").value || "").trim();
  if(!prov) return dizer("err", "Declara a proveniência: de onde veio esta imagem. Uma folha anónima a fazer de carta não entra.");

  const im = await lerImagemDaFolha(fi.files[0]);
  if(!im) return dizer("err", "Não foi possível ler a imagem.");
  /* A partir daqui há uma `blob:` URL viva, e uma folha digitalizada são megabytes que
     ficam presos ao separador até ele fechar. Todas as saídas por recusa passam a
     revogá-la: eram cinco, e a que mais custava era a da projeção incompatível, porque
     essa é a que acontece a quem já tem uma folha colocada e vai colocar a segunda. */
  const recusar = (txt)=>{ URL.revokeObjectURL(im.url); return dizer("err", txt); };

  let mundo = null, pontos = 0, controlos = [];
  if(ff && ff.files && ff.files.length){
    mundo = lerFicheiroReferenciacao(await lerTextoDoFicheiro(ff.files[0]));
    if(!mundo) return recusar("O ficheiro de referenciação não tem seis linhas numéricas com ponto decimal. Com vírgula decimal é recusado de propósito: «2,5» lido como 2 põe a folha 20 % fora de escala.");
  } else {
    const p1 = {px:numFolha("fo-p1px"), py:numFolha("fo-p1py"), E:numFolha("fo-p1e"), N:numFolha("fo-p1n")};
    const p2 = {px:numFolha("fo-p2px"), py:numFolha("fo-p2py"), E:numFolha("fo-p2e"), N:numFolha("fo-p2n")};
    if([p1, p2].some(p=>Object.values(p).some(v=>v === null)))
      return recusar("Sem ficheiro de referenciação, os oito campos dos dois pontos têm de estar preenchidos.");
    mundo = calibrarPorDoisPontos(p1, p2);
    if(!mundo) return recusar("Os dois pontos não chegam: ou têm o mesmo pixel, ou a mesma coordenada no terreno.");
    pontos = 2; controlos = [p1, p2];
  }

  const g = $("fo-grelha").value;
  const recusa = recusaPorProjecao(g);
  if(recusa) return recusar(recusa);
  const f = folhaCalibrada({ id:"f"+Date.now().toString(36), nome:nome || fi.files[0].name,
    largura:im.largura, altura:im.altura, mundo, grelha:g,
    proveniencia:prov, pontos, controlos });
  if(!f) return recusar("A colocação não é utilizável: os seis coeficientes descrevem uma folha sem área ou sem inversa.");
  f.img = im.url;
  FOLHAS.push(f);
  await guardarFolhas();
  const pesada = avisoFolhaPesada(f.largura, f.altura);
  fita("Folha de carta colocada: "+f.nome+" ("+(pontos? pontos+" pontos de controlo" : "ficheiro de referenciação")
    +", "+f.proveniencia+")"+(f.foraDoEnvelope? " — fora do envelope do continente":"")
    +(pesada? " — "+(f.largura*f.altura/1e6).toFixed(0)+" Mpx, pesada" : ""));
  pintarFolhas();
  try{ pintarMapa(); }catch(e){}
  const af = folhaAfericao(f);
  /* O aviso é sobre a aritmética da aplicação, e não sobre o que o utilizador escreveu —
     ver `AFERICAO_DESVIO_MAX`. Dizer-lhe para conferir as coordenadas seria mandá-lo
     procurar um erro que esta conta não viu. */
  if(af && af.suspeita) return dizer("err", "Folha colocada, mas os dois modelos de distância "
    + "não concordam: a escala em PT-TM06 dá "
    + (af.mpp*Math.hypot(controlos[1].px-controlos[0].px, controlos[1].py-controlos[0].py)).toFixed(0)
    + " m entre os controlos e a medida esférica dá " + af.esferico + " m, "
    + (af.desvio*100).toFixed(1) + " % de diferença. Não é a colocação: é a projeção. Comunicar.");
  dizer(pesada? "av" : "ok", "Folha colocada."+(f.foraDoEnvelope
    ? " Cai fora do envelope do continente — pode ser das ilhas ou de Espanha, ou a colocação estar errada. Confere no mapa."
    : "")+(pesada? " "+pesada : ""));
  persistir(false);
}

/** Retira uma folha do mapa e da base. A imagem não se guarda, e por isso não fica nada. */
async function retirarFolha(id){
  /* A URL do objeto tem de ser revogada à mão: enquanto viver, o navegador guarda a imagem
     inteira, e retirar a folha do mapa sem a revogar libertava o desenho e não a memória. */
  const fora = FOLHAS.find(f=>f.id === id);
  if(fora && fora.img) try{ URL.revokeObjectURL(fora.img); }catch(e){}
  FOLHAS = FOLHAS.filter(f=>f.id !== id);
  await guardarFolhas();
  pintarFolhas();
  try{ pintarMapa(); }catch(e){}
}

/** A lista das folhas colocadas, com o que permite duvidar de cada uma. */
function pintarFolhas(){
  const el = $("fo-lista"); if(!el) return;
  if(!FOLHAS.length){ el.innerHTML = '<p class="hint" style="margin:0">Nenhuma folha colocada.</p>'; return; }
  el.innerHTML = FOLHAS.map(f=>{
    const g = GRELHAS[f.grelha];
    /* Metros por pixel: sai do determinante, que é a área que um pixel cobre no terreno.
       É o número por que se percebe, de relance, se a colocação faz sentido — uma folha a
       0,004 m/px ou a 900 m/px está errada e vê-se sem abrir o mapa. */
    const af = folhaAfericao(f);
    /* A regra de `folhaAfericao` — ausência é nada, nunca zero — valia uma camada abaixo e
       era violada aqui: `af? af.mpp : 0` imprimia «0,000 m/px», que é uma escala e não é
       uma ausência. Apanhado pelo ramo #001. */
    const escalaTxt = af
      ? af.mpp.toFixed(3).replace(".", ",")+' m/px'
        +(af.escalaProj > 1.001? ' no terreno ('+af.mppProj.toFixed(3).replace(".", ",")
          +' m de projeção a '+af.latRef.toFixed(2).replace(".", ",")+'° N)' : "")
      : 'escala por apurar';
    return '<div class="pk-r"><span class="k">'+esc(f.nome)+'</span><span class="v">'
      + f.largura+'×'+f.altura+' px · '+escalaTxt+' · '+esc(g? g.n : f.grelha)
      + ' · '+(f.pontos? f.pontos+' pontos de controlo' : 'ficheiro de referenciação')
      + ' · '+esc(f.proveniencia)
      + (f.foraDoEnvelope? ' <span class="pend">fora do envelope do continente</span>' : "")
      + (af && af.suspeita? ' <span class="pend">os dois modelos de distância divergem '+(af.desvio*100).toFixed(1)+' %</span>' : "")
      + (f.img? "" : ' <span class="pend">sem imagem nesta sessão — volta a escolhê-la para a desenhar</span>')
      + ' <button class="lk" type="button" data-fo-rem="'+esc(f.id)+'">Retirar</button></span></div>';
  }).join("");
  el.querySelectorAll("[data-fo-rem]").forEach(b=>b.addEventListener("click", ()=>retirarFolha(b.dataset.foRem)));
}

$("fo-colocar").addEventListener("click", colocarFolha);
