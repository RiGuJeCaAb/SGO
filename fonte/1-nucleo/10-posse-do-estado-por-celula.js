/* ================= posse do estado por célula =================
   Cada ramo do estado tem exatamente um dono, e o dono é a célula a quem a lei
   atribui a matéria. O caminho é o do objeto `O`; a norma é a que sustenta a posse.
   Um ramo pode ser um sub-ramo: `dados.est.setores` é de Operações e a reserva é de
   Logística, porque é área da ZCR — conflação que a versão 5 do estado resolveu, movendo
   a reserva, a zona de apoio e o ponto de trânsito para `logistica`.
   Um ramo com `mover` está no sítio errado por razão declarada, e a razão é dívida
   assumida, não omissão. Acrescentar um ramo ao estado sem o inscrever aqui parte
   `auditarPosse()`. */
const POSSE = [
  { k:"comando", n:"Comando", r:"DL n.º 90-A/2022, art. 12.º; Despacho n.º 4067/2024, arts. 14.º e 15.º",
    nota:"Não é célula: é o enquadramento. COS, coordenador do PCO e adjuntos.",
    ramos:[
      { p:"meta",        r:"art. 14.º",                 d:"Identificação, fase do SGO, nível DECIR e localização" },
      { p:"pco.funcoes", r:"art. 14.º, n.os 1 a 5",     d:"Composição do posto de comando e nomeações" },
      { p:"turno",       r:"art. 15.º, n.º 3, al. c); DON 2, 7.d.(30)", d:"Continuidade em espelho e rotatividade de funções" },
      { p:"encerramento", r:"art. 8.º, n.º 2; art. 2.º, al. c)", d:"Encerramento do registo da ocorrência" },
      { p:"cumprimentos", r:"art. 8.º, n.º 2; art. 2.º, al. c)", d:"Obrigações dadas por cumpridas, com GDH e quem" },
      { p:"integridade", r:"art. 2.º, al. c) — registo temporal explícito e completo", d:"Proveniência do registo importado e estado do seu carimbo de integridade" }
    ] },
  { k:"planeamento", n:"Planeamento", r:"Despacho n.º 4067/2024, arts. 26.º a 30.º",
    nota:"Elabora o plano estratégico de ação e assegura a sua permanente atualização.",
    ramos:[
      { p:"peas",             r:"art. 27.º, n.º 1, al. a)", d:"Planos estratégicos de ação emitidos" },
      { p:"csv",              r:"art. 29.º",                d:"Série meteorológica — núcleo de antecipação" },
      { p:"avisos",           r:"art. 28.º",                d:"Avisos do IPMA para o distrito do TO" },
      { p:"dados.area",       r:"art. 28.º",                d:"Área da zona de intervenção" },
      { p:"dados.perimNome",  r:"art. 28.º",                d:"Perímetro carregado" },
      { p:"dados.sensiveis",  r:"art. 28.º; art. 27.º, n.º 1, al. b)", d:"Aglomerados e pontos sensíveis" },
      { p:"dados.anexos",     r:"art. 28.º",                d:"Anexos do quadro de informações" },
      { p:"dados.topo",       r:"art. 28.º",                d:"Exposição, declive e razão declive/vento" },
      { p:"dados.perfil",     r:"art. 28.º",                d:"Perfil de elevação do eixo" }
    ] },
  { k:"operacoes", n:"Operações", r:"Despacho n.º 4067/2024, arts. 16.º a 25.º",
    nota:"Executa e implementa as decisões do plano e transmite as ordens de missão.",
    ramos:[
      { p:"dados.est.n",       r:"art. 17.º, n.º 1, al. d)", d:"Número de setores" },
      { p:"dados.est.setores", r:"art. 17.º, n.º 1, als. a) e d)", d:"Setorização, estados e forças atribuídas" },
      { p:"dados.est.aer",     r:"art. 19.º",                d:"Contagem de meios aéreos (derivada)" },
      { p:"dados.est.aerL",    r:"art. 19.º",                d:"Meios aéreos no TO — núcleo de meios aéreos" },
      { p:"dados.est.livre",   r:"art. 17.º",                d:"Modo de composição do dispositivo" },
      { p:"dados.setores",     r:"art. 17.º, n.º 1, al. a)", d:"Quadro geral do dispositivo (derivado)" },
      { p:"evolucao",          r:"art. 17.º, n.º 1, al. a); DON 2, 7.e.(4)(o)", d:"Evolução da situação e pontos de situação" },
      { p:"fita",              r:"art. 17.º, n.º 1, al. g)", d:"Fita do tempo" }
    ] },
  { k:"logistica", n:"Logística e Finanças", r:"Despacho n.º 4067/2024, arts. 31.º a 35.º",
    nota:"Garante a sustentação logística do teatro de operações.",
    ramos:[
      { p:"logistica.reserva",       r:"art. 32.º, n.º 1, al. b); art. 33.º", d:"Reserva tática" },
      { p:"logistica.zonaApoio",     r:"art. 32.º, n.º 1, al. b)", d:"Zona de apoio" },
      { p:"logistica.pontoTransito", r:"DL n.º 90-A/2022, art. 13.º, al. c); art. 32.º, n.º 1, al. b); DON 2, 7.d.(5), (7) e (8)", d:"Ponto de trânsito na zona de concentração e reserva" },
      { p:"logistica.comunicacoes",  r:"art. 32.º, n.º 1, al. d); art. 34.º", d:"Plano de comunicações e canais atribuídos" }
    ] },
  { k:"infra", n:"Infraestrutura", r:"—",
    nota:"Não é célula nem matéria de comando: é a mecânica do ficheiro gravado.",
    ramos:[ { p:"versao", r:"—", d:"Versão do esquema do estado gravado" } ] }
];

/* Dono de um caminho, por prefixo mais longo: `dados.est.res` pertence a Logística
   ainda que `dados.est.setores` pertença a Operações. */
function donoDoRamo(caminho){
  let melhor = null, comp = -1;
  POSSE.forEach(c=>c.ramos.forEach(r=>{
    if((caminho === r.p || caminho.indexOf(r.p + ".") === 0) && r.p.length > comp){
      comp = r.p.length; melhor = {celula:c.k, nome:c.n, ramo:r};
    }
  }));
  return melhor;
}
function celulaPorChave(k){ return POSSE.find(c=>c.k===k) || null; }
function ramosDaCelula(k){ const c = celulaPorChave(k); return c? c.ramos : []; }

/* Lê um caminho pontuado sem rebentar em ramo ausente. */
function lerRamo(raiz, caminho){
  return String(caminho).split(".").reduce((o,k)=> (o==null? undefined : o[k]), raiz);
}

/* Instantâneo do que uma célula possui, na forma em que está gravado. */
function instantaneoCelula(k){
  const out = {};
  ramosDaCelula(k).forEach(r=>{
    const v = lerRamo(O, r.p);
    if(v !== undefined) out[r.p] = JSON.parse(JSON.stringify(v));
  });
  return out;
}

/* Percorre as folhas do estado e confronta-as com o registo. É este o mecanismo que
   impede a posse de voltar a diluir-se: um ramo novo sem dono parte a verificação. */
function auditarPosse(estado){
  const raiz = estado || novoEstado(), folhas = [];
  (function anda(o, pre){
    Object.keys(o).forEach(k=>{
      const v = o[k], p = pre? pre+"."+k : k;
      if(v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) anda(v, p);
      else folhas.push(p);
    });
  })(raiz, "");
  const orfaos = folhas.filter(p=>!donoDoRamo(p));
  /* Um caminho declarado por duas células é ambiguidade de posse, e é pior do que
     um ramo orfao: as duas entregam-no e nenhuma o assume. */
  const vistos = {}, duplicados = [];
  POSSE.forEach(c=>{
    c.ramos.forEach(r=>{
      if(vistos[r.p]) duplicados.push(r.p + " (" + vistos[r.p] + " e " + c.k + ")");
      else vistos[r.p] = c.k;
    });
  });
  /* Ramos no sítio errado por decisão registada. Não são defeito: são dívida com data
     e razão, e é melhor tê-la à vista do que dispersa por comentários. */
  const porMover = [];
  POSSE.forEach(c=>c.ramos.forEach(r=>{ if(r.mover) porMover.push({celula:c.k, de:r.p, para:r.mover, porque:r.porque||""}); }));
  return { folhas: folhas.length, orfaos: orfaos, duplicados: duplicados, porMover: porMover };
}

/* Exportação por célula. Uma verdade por domínio aplicada dentro do próprio PCO:
   quem entrega uma célula entrega o que essa célula possui, e nada mais. */
function pacoteCelula(k){
  const c = celulaPorChave(k);
  if(!c) throw new Error("célula desconhecida: " + k);
  return { tipo:"peaapp:celula", celula:c.k, designacao:c.n, base:c.r,
    versao:VERSAO_ESTADO, g:gdhAgora(),
    ocorrencia:{ num:O.meta.num||"", local:O.meta.local||"", fase:O.meta.fase||"" },
    ramos: instantaneoCelula(k),
    posse: c.ramos.map(r=>({ caminho:r.p, base:r.r, materia:r.d })) };
}
function exportarCelula(k){
  try{
    const c = celulaPorChave(k); if(!c) return;
    const num = String(O.meta.num||"sem-num").replace(/[^\w.-]+/g,"-");
    descarregar("CSREPCDouro_celula-"+c.k+"_ocorrencia-"+num+"_"+carimboFich()+"_EstacaoPEA_CLD.json",
      JSON.stringify(pacoteCelula(k), null, 2));
    fita("Exportado o estado da célula de "+c.n+" ("+ramosDaCelula(k).length+" ramos)");
    persistir(false);
  }catch(e){ aviso("msg-turno","err","Não foi possível exportar a célula ("+e.message+")."); }
}

