/* ================= PLANEAMENTO · leitura da evolução das frentes =================
   A seta no mapa diz para onde a frente aponta. Não diz o que se segue.

   Este módulo escreve o que se segue, e a primeira coisa a fixar é **o que não se pode
   escrever**. A aplicação não sabe a velocidade de propagação: exige a velocidade básica
   do combustível, que Viegas (2004) remete para outra fonte e que nenhum dos documentos
   arquivados dá para os combustíveis do Douro. Sem ela não há distância percorrida, não há
   hora de chegada e não há área ardida prevista. Escrever qualquer um desses números seria
   inventar, e um número inventado num PEA é pior do que uma lacuna assumida.

   O que se pode escrever, e que não é pouco:

   1. **Para onde aponta**, agora, pela composição de declive e vento — Viegas (2004),
      validada na forma da resposta por Weise e Biging (1997).
   2. **Para onde vai passar a apontar**, hora a hora, porque a série meteorológica traz o
      rumo do vento de cada hora e a composição refaz-se para cada uma. É previsão de
      direção no tempo, e essa a aplicação sustenta.
   3. **O que está no caminho** — que setores, que aglomerados, que pontos sensíveis, a que
      distância e a que rumo. É geometria sobre o que já está no estado.
   4. **Onde o rumo declarado e o previsto divergem**, que é a pergunta que se faz a quem
      está no terreno: mudou o vento, ou o rumo precisa de ser revisto?

   A leitura sai por frente e sai em texto corrido, para poder ser lida em voz alta num
   ponto de situação e para poder entrar no PEA sem ser reescrita. */

/**
 * A meia-abertura do corredor de progressão, em graus.
 *
 * **É uma janela de leitura, não uma afirmação sobre a largura da frente.** Escolheu-se 30°
 * de cada lado para não deixar de fora o que está próximo do rumo sem encher a leitura com
 * o que está a noventa graus dela. Cada item sai com o seu rumo real ao lado, precisamente
 * para quem lê poder julgar por si em vez de confiar na janela.
 */
const CORREDOR_GRAUS = 30;

/** A diferença angular entre dois rumos, sempre entre 0 e 180. */
function difRumo(a, b){
  const d = Math.abs(normalizarGraus(a) - normalizarGraus(b)) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * O ponto da frente mais próximo de um alvo, e a distância a ele.
 *
 * Mede-se do vértice mais próximo e não do meio da linha: uma frente de dois quilómetros
 * medida pelo meio poria a mil metros o que está encostado à ponta.
 */
function pontaMaisProxima(linha, lat, lon){
  let melhor = null;
  linha.forEach(c=>{
    const d = distanciaM(c[1], c[0], lat, lon);
    if(!melhor || d < melhor.d) melhor = { d, lat:c[1], lon:c[0] };
  });
  return melhor;
}

/**
 * O que está no corredor de progressão de uma frente.
 *
 * Junta o que a aplicação já sabe do teatro: setores delimitados, aglomerados e sensíveis
 * detetados na consulta ao terreno, e pontos notáveis marcados à mão. Cada um sai com a
 * distância e o rumo a que está, e ordenado do mais próximo para o mais longe — que é a
 * ordem por que se decide.
 */
function noCorredorDaFrente(f){
  const out = [];
  if(!f || !Array.isArray(f.linha) || !f.linha.length || f.rumo === null || !Number.isFinite(f.rumo)) return out;

  const juntar = (nome, especie, lat, lon)=>{
    if(!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const p = pontaMaisProxima(f.linha, lat, lon);
    if(!p || p.d < 1) return;
    const rumo = rumoEntre(p.lat, p.lon, lat, lon);
    if(difRumo(rumo, f.rumo) > CORREDOR_GRAUS) return;
    out.push({ nome, especie, m:p.d, rumo });
  };

  /* Os setores entram pelo vértice do limite que estiver mais à frente no corredor: um
     setor grande pode ter o centro fora do corredor e a esquina dentro dele. */
  const e = estObj();
  (e.setores||[]).forEach((s,i)=>{
    const anel = limiteSetor(i); if(!anel) return;
    if(f.setor === NOMES_SETOR[i]) return;   /* o setor onde a frente já está não está «à frente» */
    let perto = null;
    anel.slice(0, -1).forEach(c=>{
      const p = pontaMaisProxima(f.linha, c[1], c[0]);
      if(!p) return;
      const rumo = rumoEntre(p.lat, p.lon, c[1], c[0]);
      if(difRumo(rumo, f.rumo) > CORREDOR_GRAUS) return;
      if(!perto || p.d < perto.m) perto = { m:p.d, rumo };
    });
    if(perto) out.push({ nome:"Setor "+NOMES_SETOR[i], especie:"setor", m:perto.m, rumo:perto.rumo });
  });

  /* Aglomerados e sensíveis vêm por distância e rumo ao ponto da ocorrência: recoloca-se
     cada um em coordenada com a mesma conta do croqui, que é a mesma informação. */
  const lat0 = parseFloat(String(O.meta.lat).replace(",", ".")),
        lon0 = parseFloat(String(O.meta.lon).replace(",", "."));
  if(Number.isFinite(lat0) && Number.isFinite(lon0)){
    const det = (O.dados.sensDet && Array.isArray(O.dados.sensDet.itens))? O.dados.sensDet.itens : [];
    det.forEach(x=>{
      const p = pontoPorRumo(lat0, lon0, +x.dist, x.rumo);
      if(p) juntar(x.nome, x.sens? "sensível" : "aglomerado", p.lat, p.lon);
    });
  }

  pontosLista().forEach(p=>juntar(p.nome, defPonto(p.tipo).n.toLowerCase(), p.lat, p.lon));

  /* **Os meios posicionados, que é a pergunta a que a carta anotada responde de relance:
     quem fica do lado errado da frente.** Entram com a espécie «meio» para se distinguirem
     de um ponto de água ou de um aglomerado: uma coisa é o fogo caminhar para uma charca,
     outra é caminhar para uma equipa. */
  meiosPosicionados().forEach(m=>juntar(m.nome, "meio", m.it.lat, m.it.lon));

  /* **Só os avisos.** Uma nota que diga «não ardido» à frente do fogo não é notícia; uma que
     diga «interdito a VFCI» ou «incêndio subterrâneo» no caminho da frente é decisão, e tem
     de sair aqui. As outras espécies ficam no mapa, que é onde se leem. */
  avisosNoMapa().forEach(nt=>juntar(nt.txt, "aviso no mapa", nt.lat, nt.lon));

  return out.sort((a,b)=>a.m - b.m);
}

/**
 * Como o rumo da cabeça se move ao longo da série meteorológica.
 *
 * É a parte da previsão que a aplicação **sustenta**: não diz quando o fogo chega a lado
 * nenhum, mas diz para onde vai estar a apontar de hora a hora, porque a série traz o rumo
 * do vento de cada hora e a composição de declive e vento refaz-se para cada uma.
 *
 * @returns {null|{pontos:any[], de:number, para:number, giro:number, sentido:string}}
 */
function giroDaCabeca(){
  const t = O.dados.topo;
  if(!t.orient || !(SERIE||[]).length) return null;
  const pontos = [];
  SERIE.forEach(s=>{
    if(!s || !Number.isFinite(s.wd)) return;
    const c = comportamentoFogo({ orient:t.orient, rumoVento:s.wd, eps: t.eps });
    /* **`Number.isFinite` e não o `isFinite` global.** O global converte antes de decidir, e
       `Number(null)` é zero: sem a razão declive/vento informada `cabeca` vem a `null`, e o
       global deixava passar um rumo de 0°. A leitura chegou a escrever «a cabeça mantém-se
       a norte» quando a verdade era que não havia com que a calcular. */
    if(c && Number.isFinite(c.cabeca)) pontos.push({ h:s.h, d:s.d, rumo:c.cabeca, vento:s.ws, rumoVento:s.wd, xi:c.xi });
  });
  if(pontos.length < 2) return null;
  const de = pontos[0].rumo, para = pontos[pontos.length-1].rumo;
  /* O giro com sinal: positivo roda no sentido dos ponteiros (para leste), negativo ao
     contrário. Tomar o valor absoluto perdia justamente a informação que interessa. */
  let giro = normalizarGraus(para - de);
  if(giro > 180) giro -= 360;
  return { pontos, de, para, giro, sentido: giro > 0 ? "no sentido dos ponteiros" : "no sentido contrário aos ponteiros" };
}

/**
 * A leitura escrita de uma frente: para onde aponta, para onde vai apontar, o que apanha.
 *
 * Cada frase diz de onde vem o que afirma. Onde a aplicação não pode afirmar, di-lo e diz
 * o que lhe faltaria para poder — que é informação útil para quem a pode ir buscar.
 */
function leituraDaFrente(f){
  const d = defFrente(f.tipo);
  const p = [];

  p.push(d.n + (f.setor? " no setor "+f.setor : "") + ", " + f.m + " m de extensão.");

  if(!d.avanca){
    p.push("A retaguarda arde para trás do que já ardeu: não tem direção de progressão, e é a secção de menor intensidade — Fernandes (2003).");
    return p.join(" ");
  }

  p.push("Progride para " + card(f.rumo) + " (" + Math.round(f.rumo) + "°), rumo " + f.rumoFonte + ".");

  /* O confronto entre o que está declarado e o que a composição prevê. É a pergunta que se
     faz a quem está no terreno, e não uma correção automática: quem vê o fogo tem razões
     que o modelo não tem. */
  const prev = rumoPrevistoDaCabeca();
  if(prev && f.tipo === "cabeca"){
    const dif = Math.round(difRumo(f.rumo, prev.rumo));
    if(dif <= 20)
      p.push("A composição de declive e vento dá " + Math.round(prev.rumo) + "°, que confirma o rumo declarado.");
    else
      p.push("**A composição de declive e vento dá " + Math.round(prev.rumo) + "°, a " + dif
        + "° do rumo declarado.** Ou o vento mudou desde que a frente foi traçada, ou o rumo precisa de ser revisto no terreno.");
  }

  const corredor = noCorredorDaFrente(f);
  /* Os meios no corredor saem à parte e primeiro. O resto do que está no caminho é
     património e terreno; isto são pessoas, e a decisão que gera é outra e é imediata. */
  const dist = x => x.m >= 1000 ? fmtPT(x.m/1000, 1) + " km" : x.m + " m";
  const meios = corredor.filter(x=>x.especie === "meio");
  if(meios.length)
    p.push("**No corredor de progressão desta frente: "
      + meios.map(x=>x.nome + " a " + dist(x)).join("; ") + ".**");
  const avisos = corredor.filter(x=>x.especie === "aviso no mapa");
  if(avisos.length)
    p.push("**Avisos anotados no caminho: " + avisos.map(x=>"«"+x.nome+"» a "+dist(x)).join("; ") + ".**");

  if(corredor.length){
    p.push("No corredor de progressão, do mais próximo para o mais longe: "
      + corredor.slice(0, 6).map(x=>x.nome + " (" + x.especie + ") a " + (x.m >= 1000
          ? fmtPT(x.m/1000, 1) + " km" : x.m + " m") + ", " + card(x.rumo)).join("; ") + "."
      + (corredor.length > 6 ? " E mais " + (corredor.length - 6) + "." : ""));
  } else {
    p.push("Nada do que a aplicação conhece cai no corredor de progressão — o que significa que nada foi marcado nem detetado ali, e não que o terreno esteja livre.");
  }

  return p.join(" ");
}

/**
 * A leitura de todo o teatro: as frentes, o giro previsto e o que fica por dizer.
 *
 * Devolve as frases já compostas, para que o ecrã e o PEA mostrem exatamente o mesmo texto.
 * Duas redações da mesma análise em dois sítios acabariam a divergir, e num PEA aprovado a
 * divergência não se corrige.
 */
function leituraDaEvolucao(){
  const F = frentesLista();
  /* Há leitura desde que haja **alguma coisa traçada**, e não só frentes: uma ocorrência
     pode ter linhas de contenção abertas antes de alguém ter traçado a frente, e essas
     lêem-se na mesma. */
  const out = { frentes:[], giro:"", intensidade:"", linhas:"", limites:[], vazio:!F.length && !linhasLista().length };
  if(out.vazio) return out;

  out.frentes = F.map(f=>({ id:f.id, tipo:f.tipo, texto:leituraDaFrente(f) }));

  const g = giroDaCabeca();
  if(g){
    const gr = Math.abs(Math.round(g.giro));
    const primeiro = g.pontos[0], ultimo = g.pontos[g.pontos.length-1];
    out.giro = gr < 10
      ? "Ao longo da série, o rumo da cabeça mantém-se em " + card(g.de) + " (" + Math.round(g.de) + "°): o vento não roda o suficiente para o mudar."
      : "Ao longo da série, o rumo da cabeça roda " + gr + "° " + g.sentido + ", de " + card(g.de)
        + " (" + hh(primeiro.h) + ") para " + card(g.para) + " (" + hh(ultimo.h) + "). "
        + "É a direção que muda, não a hora de chegada: essa a aplicação não a sabe.";
    /* A hora de vento mais forte é a que dita a leitura de referência, e é a mesma escolha
       que o painel de relevo faz. Vale a pena estar dita, porque é nela que a frente mais
       depressa se afasta do que se previu para as outras horas. */
    const forte = g.pontos.reduce((a,b)=>(b.vento > a.vento? b : a), g.pontos[0]);
    out.giro += " Vento mais forte às " + hh(forte.h) + " (" + forte.vento + " km/h de " + card(forte.rumoVento)
      + "), com a cabeça a " + Math.round(forte.rumo) + "°.";
  }

  /* A intensidade, quando há com que a calcular. Entra aqui e não numa leitura à parte
     porque é a mesma decisão: para onde vai a frente e o que se lhe pode fazer. */
  out.intensidade = leituraDaIntensidade();
  out.linhas = leituraDasLinhas();

  /* O que fica por dizer, sempre e por escrito. Uma leitura que não declare os seus limites
     lê-se como se os não tivesse. */
  out.limites.push("Não há velocidade de propagação: exige a velocidade básica do combustível, que Viegas (2004) remete para outra fonte e que nenhuma das fontes arquivadas dá para os combustíveis do Douro. Sem ela não há distância percorrida, hora de chegada nem área prevista.");
  if(!O.dados.topo.eps)
    out.limites.push("Sem a razão declive/vento informada, o desvio da cabeça é o que a geometria dá sozinha. Preenchê-la em «Relevo» aperta a previsão de direção.");
  if(!(SERIE||[]).length)
    out.limites.push("Sem série meteorológica carregada não há evolução no tempo: só o rumo declarado em cada frente.");
  if(!(estObj().setores||[]).some((_,i)=>limiteSetor(i)))
    out.limites.push("Sem limites de setor traçados, a leitura não diz que setores a frente atinge.");
  /* **A medida da confiança que se pode ter no que ficou escrito acima.** Dizer «nenhum
     meio no corredor» com três posicionados em vinte diz muito menos do que parece, e quem
     lê tem de o saber sem ter de ir contar. */
  const cm = contagemPosicionados();
  if(cm.total && cm.postos < cm.total)
    out.limites.push("Dos " + cm.total + " meios do dispositivo, " + cm.postos
      + " têm posição no mapa. O que a leitura diz sobre meios no caminho da frente vale só para esses.");
  return out;
}

/* ---- ao ecrã ---- */

/**
 * Pinta a leitura da evolução.
 *
 * O destaque a negrito é o da divergência entre o rumo declarado e o previsto, e é o único:
 * marcar tudo o que é importante é não marcar nada. Sai por `esc`, e o negrito repõe-se
 * depois — o texto vem de nomes que podem ter vindo de um ficheiro importado.
 */
function pintarEvolucao(){
  const el = $("evol-txt"); if(!el) return;
  const L = leituraDaEvolucao();
  const negrito = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  if(L.vazio){
    /* Uma secção vazia que só diz «não há nada» deixa quem lê sem saber o que fazer a
       seguir. Diz-se o caminho: onde se traça, e em quantos cliques. */
    el.innerHTML = '<p class="hint">Nenhuma frente traçada — e por isso não há evolução que ler.'
      + ' Para traçar uma: no <b>Mapa do teatro de operações</b>, aqui em cima, escolher'
      + ' <b>Frente de fogo</b> em «Clicar no mapa marca» e clicar dois ou mais pontos ao longo da frente.'
      + ' Depois escolher a secção — cabeça, flanco ou retaguarda —, indicar o rumo de progressão se for'
      + ' conhecido, e fechar.</p>';
    return;
  }
  el.innerHTML = L.frentes.map(f=>'<p class="ev-f">'+negrito(f.texto)+'</p>').join("")
    + (L.giro? '<p class="ev-g">'+negrito(L.giro)+'</p>' : "")
    + (L.intensidade? '<p class="ev-g">'+negrito(L.intensidade)+'</p>' : "")
    + (L.linhas? '<p class="ev-f">'+negrito(L.linhas)+'</p>' : "")
    + (L.limites.length
        ? '<p class="ev-lim"><b>O que esta leitura não afirma:</b> '+L.limites.map(x=>esc(x)).join(" ")+'</p>'
        : "");
}

/** A leitura em texto simples, para sair da aplicação como está no ecrã. */
function evolucaoEmTexto(){
  const L = leituraDaEvolucao();
  if(L.vazio) return "";
  const limpo = t => String(t).replace(/\*\*/g, "");
  return [...L.frentes.map(f=>limpo(f.texto)), L.giro? limpo(L.giro) : "",
    L.intensidade? limpo(L.intensidade) : "", L.linhas? limpo(L.linhas) : "",
    L.limites.length? "O que esta leitura não afirma: "+L.limites.join(" ") : ""]
    .filter(Boolean).join("\n\n");
}

$("evol-copiar").addEventListener("click", async ()=>{
  const t = evolucaoEmTexto();
  if(!t){ aviso("mapa-msg","err","Não há leitura para copiar: nenhuma frente traçada."); return; }
  /* `navigator.clipboard` não existe em `file://` em todos os navegadores. A alternativa é
     mostrar o texto para ser copiado à mão, que é feio e funciona sempre — melhor do que um
     botão que não faz nada e não diz porquê. */
  try{
    await navigator.clipboard.writeText(t);
    aviso("mapa-msg","ok","Leitura copiada.");
  }catch(e){
    const el = $("evol-txt");
    const pre = document.createElement("textarea");
    pre.value = t; pre.rows = 8; pre.style.width = "100%";
    el.appendChild(pre); pre.select();
    aviso("mapa-msg","ok","O navegador não deixa copiar de um ficheiro local. O texto está aí em baixo, selecionado.");
  }
});
