/* ================= OPERAÇÕES · frentes de fogo =================
   O estado do setor é uma palavra — «em curso», «em resolução». Na carta que o posto anota
   à mão a frente é **uma linha com direção**, e é dela que se decide: para onde vai, o que
   apanha pelo caminho, de que lado se ataca.

   A nomenclatura não é escolhida aqui. Fernandes (2003) descreve o fogo dominado pelo
   vento como uma elipse em que a intensidade *"é máxima na sua secção mais adiantada (a
   'cabeça'), diminui ao longo dos flancos e é mínima na retaguarda"*. São essas as três
   secções, e é essa a fonte — ver `docs/FONTES.md`, `FOGOINT`.

   A frente é do teatro e não do setor: uma frente corre muitas vezes ao longo de um limite,
   e obrigá-la a pertencer a um setor obrigava a parti-la em dois. Guarda o setor em que
   caiu, quando cai num. */

/**
 * As secções da frente, com o que cada uma vale para a manobra.
 *
 * `avanca` diz se aquela secção tem direção de progressão que faça sentido indicar: a
 * cabeça e os flancos avançam, a retaguarda arde para trás do que já ardeu. Uma seta
 * desenhada na retaguarda diria uma coisa que não é verdade.
 */
const TIPOS_FRENTE = [
  { k:"cabeca",     n:"Cabeça",     r:"Fernandes (2003): secção mais adiantada, intensidade máxima", cor:"#B00000", avanca:true },
  { k:"flanco",     n:"Flanco",     r:"Fernandes (2003): intensidade decrescente ao longo dos flancos", cor:"#D2691E", avanca:true },
  { k:"retaguarda", n:"Retaguarda", r:"Fernandes (2003): intensidade mínima na retaguarda", cor:"#8A6D3B", avanca:false }
];

/** A definição de uma secção de frente. O que não se reconhece cai em «flanco». */
function defFrente(k){ return TIPOS_FRENTE.find(t=>t.k === k) || TIPOS_FRENTE[1]; }

/** A lista de frentes do teatro, criada à primeira vez que faz falta. */
function frentesLista(){
  if(!Array.isArray(O.dados.frentes)) O.dados.frentes = [];
  return O.dados.frentes;
}

/**
 * O rumo de um segmento, em graus de norte.
 *
 * Fórmula do rumo inicial da ortodrómica. À escala de um teatro de operações a diferença
 * para o rumo plano é de centésimas de grau, mas não custa nada estar certa e evita a
 * pergunta de saber a partir de que distância deixaria de servir.
 */
function rumoEntre(lat1, lon1, lat2, lon2){
  const r = Math.PI/180;
  const dl = (lon2 - lon1) * r, f1 = lat1 * r, f2 = lat2 * r;
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1)*Math.sin(f2) - Math.sin(f1)*Math.cos(f2)*Math.cos(dl);
  return normalizarGraus(Math.atan2(y, x) * 180 / Math.PI);
}

/**
 * O rumo de progressão que a geometria da linha sugere.
 *
 * Uma frente traçada da esquerda para a direita avança para um dos lados, e não há como
 * saber para qual só da linha: sugere-se a **perpendicular ao segmento inicial**, rodada
 * para a direita, que é a convenção de quem traça a frente com o fogo à sua direita. É uma
 * sugestão, e a aplicação di-lo — o rumo real é o que o comandante indicar.
 */
function rumoSugeridoDaLinha(linha){
  if(!Array.isArray(linha) || linha.length < 2) return null;
  const a = linha[0], b = linha[linha.length-1];
  return normalizarGraus(rumoEntre(a[1], a[0], b[1], b[0]) + 90);
}

/**
 * O comprimento de uma linha, em metros.
 *
 * Planar com correção de latitude, como a área do perímetro: à escala de um teatro o erro
 * da projeção é muito menor do que o de quem traça a linha com o dedo no ecrã.
 */
function comprimentoLinhaM(linha){
  if(!Array.isArray(linha) || linha.length < 2) return 0;
  let t = 0;
  for(let i=0;i<linha.length-1;i++){
    const [x1,y1] = linha[i], [x2,y2] = linha[i+1];
    t += distanciaPlanaM(y1, x1, y2, x2);
  }
  return Math.round(t);
}

/**
 * Fecha o traçado em curso como frente de fogo.
 *
 * Chamada por `fecharTraco` quando o traçado é de frente. O tipo e o rumo saem do que
 * estiver escolhido no ecrã; sem rumo indicado fica o que a geometria sugere, **assinalado
 * como sugestão** e não como observação.
 */
function fecharFrente(){
  const linha = TRACO.pontos.map(p=>[p[0], p[1]]);
  if(linha.length < 2) return { ok:false, motivo:"Uma frente precisa de pelo menos dois vértices." };
  const tipo = String(($("frente-tipo")||{}).value || "cabeca");
  const d = defFrente(tipo);
  const posto = String(($("frente-rumo")||{}).value || "").trim();
  const rumoDado = posto === "" ? null : normalizarGraus(parseFloat(posto.replace(",", ".")));
  const sugerido = d.avanca ? rumoSugeridoDaLinha(linha) : null;
  const f = {
    id:novoIdentificador("f"),
    tipo:d.k,
    linha,
    /* `rumo` é o que se mostra; `rumoFonte` diz de onde veio, e é o que impede uma
       sugestão de passar por observação três turnos depois. */
    rumo: d.avanca ? (rumoDado !== null && Number.isFinite(rumoDado) ? rumoDado : sugerido) : null,
    rumoFonte: !d.avanca ? "" : (rumoDado !== null && Number.isFinite(rumoDado) ? "indicado" : "sugerido pelo traçado"),
    setor: (()=>{ const i = setorDoPonto(linha[0][1], linha[0][0]); return i >= 0 ? NOMES_SETOR[i] : ""; })(),
    m: comprimentoLinhaM(linha),
    g: gdhAgora(), por: quemRegista(), nota: ""
  };
  frentesLista().push(f);
  O.evolucao.push({ g:f.g, tipo:"posit",
    txt:d.n+" traçada"+(f.setor? " no setor "+f.setor : "")+": "+f.m+" m"
      + (f.rumo !== null ? ", a progredir para "+Math.round(f.rumo)+"°" + (f.rumoFonte === "sugerido pelo traçado" ? " (rumo sugerido pelo traçado)" : "") : "")+"." });
  fita(d.n+" traçada: "+f.m+" m"+(f.rumo !== null? ", rumo "+Math.round(f.rumo)+"°" : ""));
  largarTraco();
  return { ok:true, frente:f };
}

/** Retira uma frente. Uma frente que já não existe no terreno não fica no mapa. */
function apagarFrente(id){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de alterar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const L = frentesLista(), i = L.findIndex(f=>f.id === id);
  if(i < 0) return { ok:false, motivo:"Frente não encontrada." };
  const [f] = L.splice(i, 1);
  O.evolucao.push({ g:gdhAgora(), tipo:"posit", txt:"Retirada a "+defFrente(f.tipo).n.toLowerCase()+" de "+f.m+" m." });
  fita("Retirada a "+defFrente(f.tipo).n.toLowerCase());
  return { ok:true, frente:f };
}

/**
 * Corrige o rumo de progressão de uma frente já traçada.
 *
 * O rumo muda com o vento, e a frente não se volta a traçar por isso. Passa a «indicado»,
 * porque agora foi alguém que o disse.
 */
function rumoDaFrente(id, graus){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de alterar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const f = frentesLista().find(x=>x.id === id);
  if(!f) return { ok:false, motivo:"Frente não encontrada." };
  if(!defFrente(f.tipo).avanca) return { ok:false, motivo:"A retaguarda não tem direção de progressão." };
  const g = normalizarGraus(parseFloat(String(graus).replace(",", ".")));
  if(!Number.isFinite(g)) return { ok:false, motivo:"Rumo não numérico." };
  f.rumo = g; f.rumoFonte = "indicado";
  O.evolucao.push({ g:gdhAgora(), tipo:"posit",
    txt:defFrente(f.tipo).n+": rumo de progressão corrigido para "+Math.round(g)+"°." });
  return { ok:true, frente:f };
}

/**
 * O rumo que o comportamento do fogo prevê para a cabeça, se houver com que o calcular.
 *
 * Não escreve nada em lado nenhum: **propõe**. A composição de declive e vento de Viegas
 * (2004) dá a direção da cabeça a partir da exposição dominante e do rumo do vento, e
 * Weise e Biging (1997) confirmam experimentalmente que a forma da resposta é essa. O que
 * nenhum dos dois dá é a velocidade absoluta, e por isso aqui só sai um rumo.
 */
function rumoPrevistoDaCabeca(){
  /* Lê-se `O.dados.topo` diretamente, sem o `|| {}` defensivo: o ramo é declarado em
     `novoEstado` e garantido pelas migrações, e o objeto vazio de reserva apagava o tipo
     — o verificador deixava de saber que `orient` e `eps` existem. */
  const t = O.dados.topo;
  /* A hora de vento mais forte da série carregada, que é a mesma escolha que o painel de
     relevo faz para a sua leitura. Duas escolhas diferentes dariam dois rumos diferentes
     para a mesma cabeça, no mesmo ecrã. */
  const hora = (SERIE||[]).reduce((a,b)=>(b && a && b.ws > a.ws)? b : a, (SERIE||[])[0] || null);
  if(!t.orient || !hora || !Number.isFinite(hora.wd)) return null;
  const c = comportamentoFogo({ orient:t.orient, rumoVento:hora.wd, eps: t.eps });
  return c && Number.isFinite(c.cabeca) ? { rumo:c.cabeca, hora:hora.h, eps:t.eps, delta:c.delta } : null;
}
