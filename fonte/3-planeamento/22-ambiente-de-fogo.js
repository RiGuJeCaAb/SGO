/* ==================================================================================
   PLANEAMENTO · o ambiente de fogo

   **Absorvido da linhagem paralela (p0020).** O terceiro coletor: `retratoOperacional()`
   reúne o dispositivo, `metricas()` reúne a meteorologia, e faltava quem reunisse o resto —
   o terreno, o combustível, o comportamento, o que está traçado no teatro.

   Sem ele os painéis produziam informação que morria no ecrã onde tinha sido produzida. A
   aplicação calculava «acima dos 4 000 kW/m atacar diretamente a cabeça é perigoso e
   inconsequente» e emitia a seguir um plano que dizia «postura defensiva fora da janela»,
   com fundamento genérico — a mesma frase que sairia para um incêndio de 200 kW/m. Um plano
   que não cita o que a aplicação sabe não está fundamentado: está redigido.

   Cada grandeza vem acompanhada da **origem**. Não é adorno: o PEA é aprovado pelo COS
   (art. 27.º, n.º 1, al. a)), e quem aprova tem de saber se o número que sustenta uma
   proibição foi medido no terreno ou estimado a partir de um quadro que talvez esteja fora
   do seu domínio. A força da proposta vem da aprovação; a honestidade sobre a prova vem
   daqui — e é por isso que a proposta não se enfraquece a si própria para se precaver.
   ================================================================================== */

/**
 * O que se sabe sobre como este fogo se comporta e onde.
 *
 * Devolve sempre um objeto: os ramos sem dados vêm nulos, e é a ausência que depois se lê no
 * plano como lacuna nomeada em vez de silêncio.
 */
function retratoDoFogo(){
  /* Sem recuos para `{}`. O `p0020` trazia `D.fogo || {r:"",w:""}` e `F.est || {}`, e um
     recuo com forma diferente da real alarga o tipo até ele deixar de dizer nada — o
     verificador passou a não saber que `est` tem `modelo` nem `hcm`. Estes dois ramos são
     garantidos pelo `novoEstado` e pela escada de migrações, e é para isso que a escada
     existe: defender-se do que ela promete é desconfiar do próprio contrato e perder a
     verificação em troca de nada. */
  const D = O.dados, F = D.fogo, E = F.est;
  const num = v => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n)? n : null; };

  const rV = num(F.r), wV = num(F.w);
  const rEst = num(E.rEst);
  /* A origem lê-se da coincidência com a estimativa, e não de uma bandeira que alguém
     pudesse esquecer de baixar ao escrever por cima. Se o número no campo é o que a
     estimativa produziu, veio de lá; se foi mudado, é de quem o mudou. */
  const rOrigem = rV === null? "" : (rEst !== null && Math.abs(rV - rEst) < 0.5
    ? "estimada pelos guias de fogo controlado"
    : "observada ou declarada no teatro");

  const lim = (rV !== null && wV !== null)? limitesDeManobra(rV, wV) : null;
  const mod = E.modelo? modeloComb(E.modelo) : null;

  /* A marca de saída não se guarda no estado: deduz-se. Aplica-se **só quando o R veio da
     estimativa e o motor é o dos matos** — um R observado a 5 000 m/h não é extrapolação
     nenhuma, é um fogo a andar depressa, e dizer-lhe «além de qualquer fogo medido» seria
     desmentir quem o mediu. Os tectos são dos quadros, não do terreno. */
  const marca = (rOrigem === "estimada pelos guias de fogo controlado" && mod && mod.motor === "matos")
    ? marcaDeSaida(rV) : null;

  /* --- perfil de elevação: o declive máximo e onde está --- */
  let perfil = null;
  const P = D.perfil;
  if(P && Array.isArray(P.e) && P.e.length > 1){
    const n = P.e.length, passo = P.total*1000/(n-1);
    let dMax = 0, iMax = 0;
    for(let i=1;i<n;i++){
      const d = Math.abs((P.e[i]-P.e[i-1])/passo);
      if(d > dMax){ dMax = d; iMax = i; }
    }
    perfil = { rot:P.rot, totalKm:P.total, cotaIni:P.e[0], cotaFim:P.e[n-1],
      declMaxPc: Math.round(dMax*100), kmDeclMax: Math.round(passo*iMax/100)/10 };
    /* O salto de classe de declive. Na lei de Rothermel o fator vai com tan²φ e a
       compacidade do leito **cancela na razão entre dois declives** — logo o salto é
       independente do modelo de combustível, e pode dizer-se sem o conhecer. */
    const dRef = num(E.declive);
    if(dRef !== null && dRef >= 3 && perfil.declMaxPc >= 3){
      const k = Math.pow((perfil.declMaxPc/100) / (dRef/100), 2);
      if(k >= 3) perfil.salto = { k: Math.round(k*10)/10, deRef:dRef, para:perfil.declMaxPc, km:perfil.kmDeclMax };
    }
  }

  /* --- o que está traçado --- */
  const fr = (Array.isArray(D.frentes)? D.frentes : []).map(f=>({
    tipo:f.tipo, m:f.m, setor:f.setor||"", rumo:f.rumo, rumoFonte:f.rumoFonte||"" }));
  const ln = (Array.isArray(D.linhas)? D.linhas : []).map(l=>({
    tipo:l.tipo, m:l.m, setor:l.setor||"", larguraM:l.larguraM,
    estreita: !!(lim && l.larguraM && l.larguraM < lim.contencao),
    semLargura: l.larguraM === null || l.larguraM === undefined }));

  /* --- as notas escritas no mapa --- */
  const nt = (Array.isArray(D.notas)? D.notas : []).map(x=>({
    /* O campo é `txt` e não `texto` — escrevi `texto` e o verificador de tipos apanhou-o.
       Sem ele, o aviso chegava ao plano como cadeia vazia: uma linha de média tensão sobre
       o caminho apareceria no PEA como «Avisos escritos no mapa: .» */
    tipo:x.tipo, texto:x.txt||"", setor:x.setor||"",
    /* Um aviso não é uma observação. A distinção já está declarada em `TIPOS_NOTA` e é
       operacional: o que restringe ou avisa tem consequência para quem lá vai. */
    alerta: !!(typeof defNota === "function" && defNota(x.tipo).alerta) }));

  /* --- os focos de calor vistos por satélite --- */
  const fo = (D.focos && Array.isArray(D.focos.itens))? D.focos.itens : [];
  const porConfianca = { alta:0, nominal:0, baixa:0 };
  fo.forEach(x=>{ const g = (typeof confiancaDoFoco === "function")? confiancaDoFoco(x.conf).grau : "";
    if(g && porConfianca[g] !== undefined) porConfianca[g]++; });

  /* --- o que foi detetado à volta e ainda não foi validado --- */
  const det = (D.sensDet && Array.isArray(D.sensDet.itens))? D.sensDet.itens : [];
  const texto = String(D.sensiveis||"").toLowerCase();
  const porValidar = det.filter(x=>x.sens && texto.indexOf(String(x.nome||"").toLowerCase()) < 0);

  /* --- proveniência do que se está a ver e a prever --- */
  const M = (typeof meteoObj === "function")? meteoObj() : {};
  const id = (typeof idadeMeteo === "function")? idadeMeteo() : null;
  /* O p0020 listava aqui as folhas calibradas — `FOLHAS` e `folhaCalibrada` —, que são
     trabalho da linhagem paralela e não existem deste lado. O ramo saiu em vez de ficar
     escrito a apontar para o vazio: código que só corre noutra linhagem é código morto
     nesta, e o `npm run morto` existe justamente para não o deixarmos ficar. Quando as
     folhas forem absorvidas, a cartografia deste retrato volta a nomeá-las. */

  return {
    modelo: mod? { c:mod.c, d:mod.d, w:mod.w, motor:mod.motor } : null,
    r: rV === null? null : { v:rV, origem:rOrigem, marca },
    w: wV === null? null : { v:wV },
    lim, eps: E.modelo && num(E.hcm) !== null && num(E.u10) !== null && num(E.declive) !== null
      ? epsilonDosQuadros(ventoSuperficie(num(E.u10)), num(E.hcm), num(E.declive)) : null,
    hcm: num(E.hcm), hcmOrigem: E.hcmOrigem || "",
    topo: (D.topo && (D.topo.orient || D.topo.declive))? D.topo : null,
    perfil, frentes:fr, linhas:ln, notas:nt,
    focos: fo.length? { n:fo.length, porConfianca,
      origem:(D.focos.origem||""), g:(D.focos.g||"") } : null,
    detetados: { total:det.length, porValidar: porValidar.map(x=>x.nome+" a "+x.dist+" m") },
    carta: {
      servico: (typeof CARTA !== "undefined" && CARTA)? (CARTA.atrib || CARTA.tipo || "declarado") : "",
      local: (typeof CARTA_LOCAL !== "undefined" && CARTA_LOCAL)? (CARTA_LOCAL.atrib || "sem origem declarada") : ""
    },
    previsao: { fonte:M.fonte||"", modelo:M.modelo||"", g:M.g||"",
      idadeH: id? Math.round(id.h*10)/10 : null, velha: !!(id && id.velha) }
  };
}

/**
 * O ambiente de fogo numa passagem, para entrar na análise da zona de intervenção.
 *
 * Diz o que se sabe **e o que falta**. Uma análise que se cala sobre a intensidade lê-se
 * como se a intensidade não importasse; uma que diz que falta o combustível manda alguém
 * ir buscá-lo.
 */
function resumoDoFogo(f){
  const p = [];
  if(f.modelo) p.push("Combustível: " + f.modelo.c + " — " + f.modelo.d.toLowerCase()
    + (f.modelo.w[0] !== null? ", carga fina de " + String(f.modelo.w[0]).replace(".", ",")
       + " a " + String(f.modelo.w[1]).replace(".", ",") + " t/ha" : "") + ".");
  else p.push("Modelo de combustível por identificar: sem ele não há carga nem propagação estimável.");

  if(f.r && f.r.marca) p.push(f.r.marca.r + ": " + f.r.marca.d);

  if(f.lim && f.r && f.w) p.push("Comportamento: " + Math.round(f.r.v) + " m/h ("
    + f.r.origem + ") sobre " + f.w.v + " t/ha dão " + Math.round(f.lim.i).toLocaleString("pt-PT")
    + " kW/m de intensidade frontal e chama de " + f.lim.chama.toFixed(1).replace(".", ",")
    + " m (Byram 1959). " + f.lim.classe.t);
  else p.push("Intensidade da frente por determinar: falta "
    + (!f.r? "a velocidade de propagação" : "") + (!f.r && !f.w? " e " : "")
    + (!f.w? "a carga consumida" : "") + ".");

  if(f.topo) p.push("Terreno: encostas dominantes a " + (f.topo.orient||"—")
    + (f.topo.declive? ", declive " + f.topo.declive : "")
    + (f.topo.obs? " (" + f.topo.obs + ")" : "") + ".");

  if(f.perfil) p.push("Perfil segundo " + f.perfil.rot + " ao longo de "
    + f.perfil.totalKm.toFixed(1).replace(".", ",") + " km: de " + Math.round(f.perfil.cotaIni)
    + " a " + Math.round(f.perfil.cotaFim) + " m, com declive máximo de "
    + f.perfil.declMaxPc + " % a " + String(f.perfil.kmDeclMax).replace(".", ",") + " km.");

  if(f.previsao.idadeH !== null) p.push("Previsão de " + (f.previsao.fonte || "origem não declarada")
    + (f.previsao.modelo? " (" + f.previsao.modelo + ")" : "") + ", obtida há "
    + String(f.previsao.idadeH).replace(".", ",") + " h"
    + (f.previsao.velha? " — DESATUALIZADA, confirmar antes de decidir sobre ela." : "."));
  else p.push("Sem previsão carregada: a análise meteorológica desta proposta está em falta.");

  const av = f.notas.filter(x=>x.alerta);
  if(av.length) p.push("Avisos escritos no mapa: " + av.map(x=>x.texto).join("; ") + ".");
  const outras = f.notas.length - av.length;
  if(outras) p.push(outras + (outras===1? " nota de manobra ou observação no mapa."
    : " notas de manobra ou observação no mapa."));

  if(f.focos) p.push("Focos de calor detetados por satélite: " + f.focos.n
    + (f.focos.porConfianca.alta? ", " + f.focos.porConfianca.alta + " de confiança alta" : "")
    + (f.focos.origem? ", de " + f.focos.origem : "")
    + (f.focos.g? ", obtidos " + f.focos.g : "")
    + ". São observação de satélite e não substituem o que o posto traçou.");

  const c = [];
  if(f.carta.servico) c.push("serviço declarado: " + f.carta.servico);
  if(f.carta.local) c.push("carta pré-descarregada: " + f.carta.local);
  p.push(c.length? "Cartografia em uso — " + c.join("; ") + "."
    : "Sem cartografia declarada: as posições deste plano não têm base cartográfica identificada.");

  return p.join(" ");
}

/* ================= a regra que impede o buraco de reabrir =================
   O `p0020` corrigiu esta falha para onze painéis. **Na mesma sessão, esta linhagem
   acrescentou as notas do mapa e os focos de calor, e nenhum dos dois entrou no colector.**
   A falha repetiu-se enquanto a correção ainda estava fresca, o que diz o que era preciso
   saber: um remendo não resolve um problema estrutural.

   Um ramo de `O.dados` com dono declarado em `POSSE` e sem contributo para nenhum dos três
   colectores — `retratoOperacional()` para o dispositivo, `metricas()` para a meteorologia,
   `retratoDoFogo()` para o resto — é **um painel que escreve para o vazio**: alguém preenche,
   a aplicação guarda, e o plano nunca o cita.

   Nem todo o ramo tem de contribuir, e por isso a declaração aceita as duas respostas. O que
   não aceita é o silêncio: um ramo que não esteja aqui faz falhar a auditoria, e quem
   acrescentar um painel tem de dizer o que ele leva ao plano — ou porque não leva. */
const CONTRIBUI = [
  { p:"dados.area",       onde:"analise_zi",    q:"a área ardida abre a análise da zona de intervenção" },
  { p:"dados.sensiveis",  onde:"analise_zi",    q:"os pontos sensíveis são citados na análise e na defesa perimétrica" },
  { p:"dados.sensDet",    onde:"retratoDoFogo", q:"os detetados e ainda não validados geram proposta de validação com o ERAS" },
  { p:"dados.topo",       onde:"retratoDoFogo", q:"a orientação e o declive dominantes entram no resumo do ambiente de fogo" },
  { p:"dados.perfil",     onde:"retratoDoFogo", q:"o declive máximo e onde está; o salto de classe gera proposta própria" },
  { p:"dados.fogo",       onde:"retratoDoFogo", q:"R e w dão a intensidade, e dela sai a primeira proposta do plano" },
  { p:"dados.fogo.est",   onde:"retratoDoFogo", q:"o modelo de combustível, a origem do R e a marca de saída" },
  { p:"dados.frentes",    onde:"retratoDoFogo", q:"o rumo e a sua fonte; um rumo deduzido gera proposta de confirmação" },
  { p:"dados.linhas",     onde:"retratoDoFogo", q:"a largura confronta-se com a chama calculada e gera duas propostas" },
  { p:"dados.notas",      onde:"retratoDoFogo", q:"os avisos escritos no mapa entram no resumo, distintos das observações" },
  { p:"dados.focos",      onde:"retratoDoFogo", q:"a contagem e a confiança dos focos, com a origem e a hora" },
  { p:"dados.est.n",      onde:"retratoOperacional", q:"o número de setores é a base do dispositivo" },
  { p:"dados.est.setores",onde:"retratoOperacional", q:"estados, comandos e meios de cada setor" },
  { p:"dados.est.aer",    onde:"retratoOperacional", q:"os meios aéreos entram na contagem do dispositivo" },
  { p:"dados.est.aerL",   onde:"retratoOperacional", q:"a lista nominal dos aéreos, para as rendições" },
  { p:"dados.est.livre",  onde:"retratoOperacional", q:"o modo livre da setorização muda como o dispositivo se lê" },
  { p:"dados.setores",    onde:"retratoOperacional", q:"a descrição textual dos setores acompanha o quadro" },

  /* Os que não contribuem, e a razão. Nenhum é esquecimento. */
  { p:"dados.perim",      onde:null, q:"o perímetro é geometria: dá a área, e é a área que entra no plano" },
  { p:"dados.perimNome",  onde:null, q:"nome do ficheiro de origem do perímetro — proveniência, não matéria de plano" },
  { p:"dados.pontos",     onde:null, q:"pontos notáveis do mapa; entram no croqui e na carta, não no texto do PEA" },
  { p:"dados.anexos",     onde:null, q:"anexos da ocorrência; viajam na exportação e não se citam no plano" }
];

/**
 * Ramos de `O.dados` com dono declarado e sem contributo declarado para o plano.
 *
 * Devolve o que falta, para o teste o dizer pelo nome. **Não olha ao código**: confere que
 * existe uma declaração, que é o mínimo para que a omissão não passe em silêncio. Se alguém
 * declarar um contributo que não existe, isso é uma mentira que esta auditoria não apanha —
 * apanha-a o teste do colector, que exercita o caminho.
 */
function auditarContributos(){
  const donos = POSSE.flatMap(c=>c.ramos.map(r=>r.p)).filter(p=>p.indexOf("dados.") === 0);
  const declarados = new Set(CONTRIBUI.map(x=>x.p));
  const semDeclaracao = donos.filter(p=>!declarados.has(p));
  const semRazao = CONTRIBUI.filter(x=>!x.q).map(x=>x.p);
  const orfas = CONTRIBUI.filter(x=>!donos.includes(x.p)).map(x=>x.p);
  return { n:donos.length, semDeclaracao, semRazao, orfas };
}
