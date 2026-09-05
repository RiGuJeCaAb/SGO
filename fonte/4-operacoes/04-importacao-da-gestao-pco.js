/* ================= importação da Gestão PCO =================
   Vários documentos descrevem esta ligação, e é preciso saber qual manda.

   **Governa a especificação v1.2**, de 28 de agosto, em
   docs/interop/CSREPCDouro_202608281845_EspecificacaoExportacaoJSON_v12_CLD.md. Substitui
   a v1.1 na íntegra — quem estiver a implementar do lado da Gestão PCO implementa essa e
   só essa. A v1.1 e a v1.0 continuam a ser lidas, por retrocompatibilidade.

   O contrato `pco:dispositivo`, em
   docs/interop/CSREPCDouro_d0002_202608281630_ContratoGestaoPCO_CLD.md, foi escrito a
   analisar um esboço anterior e não a v1.1, e o seu autor corrigiu-se. Dos acréscimos
   genuínos que de lá vieram, três estão hoje na v1.2: o bloco `pco` com a estrutura do
   posto de comando, os instantes com fuso, e o ponto de trânsito.

   Este módulo é o adaptador do lado da Estação, e lê os quatro envelopes que existem —
   v1.2, v1.1 e v1.0, o contrato, e o esboço antigo — normalizando-os todos numa forma só.
   Ler mais do que um envelope não é hesitar sobre qual manda: é o que um adaptador faz,
   porque quem importa não escolhe o que lhe chega às mãos.

   Três princípios governam o que se segue, e valem nos dois documentos. Versão monotónica,
   comparada por partes numéricas e nunca por cadeia, com recusa do que não se conhece, sem
   tocar em nada. Tipologia antes de contagem: os efetivos derivam-se do Anexo 1, e a
   contagem livre só serve onde não há tipologia. Instantes, não durações: as durações
   calculam-se aqui.

   O contrato não é o estado interno de nenhuma das duas aplicações. Refactorizar `O` não
   pode partir a leitura, e é por isso que nada aqui escreve diretamente em `O` fora de
   `aplicarGestaoPCO`. */

const GP_TIPO = "pco:dispositivo";
const GP_VERSAO_MAX = 1;
/* Maior versão da especificação que esta revisão lê. Comparada por partes numéricas,
   nunca por cadeia: "1.10" é posterior a "1.9" — regra 1 da v1.2. */
const GP_V11_MAIOR = 1, GP_V11_MENOR = 2;

/* Siglas descontinuadas com conversão determinada — v1.2, regra 7. `eSF` → `ESF` não
   precisa de entrada: a sigla é normalizada para maiúsculas antes de se procurar aqui. */
const GP_SIGLAS = { GRIF:"GRIR", GAUF:"EAUF" };
const GP_SIGLAS_AMBIGUAS = {
  "FEB":"decompor em ETATI, PATE ou GRUATA (UEPS)",
  "FEB/UEPS":"decompor em ETATI, PATE ou GRUATA (UEPS)",
  "UEPS":"decompor em ETATI, PATE ou GRUATA (UEPS)",
  "MR":"indicar a entidade: EMR (CB), EMR (ICNF), EMR (FEPC) ou EMR (AFOCELCA)"
};

/* Indicativos de chamada fixados na DON n.º 2 — regra 8 da v1.2. HOTEL e CELCA
   partilham as tipologias, e distinguem-se pelo operador. */
const GP_INDICATIVOS = {
  HOTEL:["HEBL","HEBM"], CELCA:["HEBL","HEBM"], KILO:["HEBP"],
  FIRE:["HERAC"], ALFA:["AVBM"], BRAVO:["AVBP"], OSCAR:["AVRAC"]
};

/** Um erro de importação, para se distinguir do que rebenta por outra razão. */
function erroGP(texto){ return new Error(texto); }

/**
 * O pacote fala em quantidades — «2× VFCI» —, e o estado guarda unidades desde a versão
 * 10: duas viaturas iguais podem vir de corpos diferentes e ter entrado no TO a horas
 * diferentes, e a rendição pede-se por veículo. A conversão reparte, mantendo em cada
 * unidade a entidade e o instante que o pacote deu ao bloco. Se depois divergirem, é
 * porque alguém as corrigiu uma a uma — que é justamente o que antes não se podia fazer.
 *
 * A forma interna do conversor mantém `q`, porque é a do pacote; o que sai para o estado
 * é por unidade.
 */
function expandirUnidades(forcas){
  const fora = [];
  forcas.forEach(f=>{
    const n = Math.max(1, Math.round(+f.q || 1));
    for(let k=0;k<n;k++){
      const u = Object.assign({}, f);
      delete u.q;
      fora.push(u);
    }
  });
  return fora;
}

/** Instante ISO 8601 com fuso, em milissegundos. Null quando ausente ou ilegível. */
function instanteISO(s){
  if(s == null || s === "") return null;
  const t = Date.parse(String(s));
  return Number.isFinite(t) ? t : null;
}

/** GDH doutrinário a partir de um instante, para o que a Estação mostra. */
function gdhDeISO(s){ const t = instanteISO(s); return t == null ? "" : gdhDe(t); }

/**
 * Valida o envelope. Regra 1 do contrato: recusa tipo diferente e versão superior à
 * conhecida, sem tocar em nada.
 *
 * Um pacote sem `tipo` não é "tipo diferente": é o esboço anterior, que a secção 8
 * manda mapear como versão 0. Um pacote com outro `tipo` é recusado.
 */
function lerPacoteGestaoPCO(texto){
  let p;
  try{ p = JSON.parse(texto); }
  catch(e){ throw erroGP("o ficheiro não é JSON válido"); }
  if(!p || typeof p!=="object" || Array.isArray(p)) throw erroGP("o ficheiro não tem a forma esperada");

  /* Envelope do contrato: declara-se pelo tipo. */
  if(p.tipo != null){
    if(p.tipo !== GP_TIPO) throw erroGP('o pacote não é "'+GP_TIPO+'" (veio "'+String(p.tipo)+'")');
    const v = p.versao;
    if(!Number.isInteger(v)) throw erroGP("a versão do contrato tem de ser um número inteiro");
    if(v > GP_VERSAO_MAX) throw erroGP("contrato na versão "+v+"; esta revisão lê até à "+GP_VERSAO_MAX);
    if(v < 0) throw erroGP("versão inválida: "+v);
    return Object.assign({}, p, { __esquema:"contrato" });
  }

  /* Especificação v1.1: versão em cadeia, e é a que governa. A comparação é por
     partes numéricas e nunca por cadeia — "1.10" é posterior a "1.9", e a comparação
     de cadeias diria o contrário. */
  if(p.versao != null && p.ocorrencia){
    const partes = String(p.versao).split(".").map(Number);
    if(partes.some(n=>!Number.isFinite(n))) throw erroGP("versão ilegível: "+p.versao);
    const [maior, menor] = [partes[0]||0, partes[1]||0];
    if(maior > GP_V11_MAIOR || (maior === GP_V11_MAIOR && menor > GP_V11_MENOR)){
      throw erroGP("esquema na versão "+p.versao+"; esta revisão lê até à "+GP_V11_MAIOR+"."+GP_V11_MENOR);
    }
    return Object.assign({}, p, { __esquema:"v11" });
  }

  /* Esboço anterior, sem versão: a secção 8 do contrato manda mapeá-lo como versão 0. */
  if(p.ocorrencia) return Object.assign({}, p, { __esquema:"esboco", versao:0 });
  throw erroGP("não se reconhece o envelope: falta o tipo e a versão");
}

/* Nome anterior, mantido porque o validador e os testes o usam. */
function lerContratoGestaoPCO(texto){ return lerPacoteGestaoPCO(texto); }

/** Normaliza o estado do setor. Um valor fora dos cinco não degrada em silêncio. */
function estadoSetorGP(estado, onde, avisos){
  const bruto = String(estado||"").trim();
  if(!bruto){ avisos.push(onde+": sem estado; assumido \""+ESTADOS_SETOR[0]+"\"."); return ESTADOS_SETOR[0]; }
  if(ESTADOS_SETOR.indexOf(bruto) >= 0) return bruto;
  /* Nome antigo conhecido: converte-se e diz-se. Nome que ninguém conhece não pode
     degradar em silêncio para o primeiro, que é o mais grave dos cinco. */
  if(MAPA_ESTADOS[bruto]){
    avisos.push(onde+": estado \""+bruto+"\" convertido para \""+MAPA_ESTADOS[bruto]+"\".");
    return MAPA_ESTADOS[bruto];
  }
  avisos.push(onde+": estado \""+bruto+"\" não é um dos cinco do ponto 7.f da DON n.º 2; "
    + "ficou \""+ESTADOS_SETOR[0]+"\", a confirmar.");
  return ESTADOS_SETOR[0];
}

/** Converte uma força de um setor, ou da reserva e zona de apoio. */
function forcaGP(f, onde, avisos){
  const temTipologia = f.tipologia != null && String(f.tipologia).trim() !== "";
  const q = +f.quantidade || 0;
  const ts = instanteISO(f.empenhado);

  if(f.empenhado && ts === null) avisos.push(onde+": instante de empenhamento ilegível (\""+f.empenhado+"\").");
  else if(ts === null) avisos.push(onde+": sem instante de empenhamento; fica sem controlo de tempos nem rendição.");
  else if(f.empenhado_estimado) avisos.push(onde+": instante de empenhamento é estimativa assinalada pela origem.");

  if(!temTipologia){
    /* Contagem livre, só onde a força não corresponde a tipologia nenhuma. */
    return { t:"", q: q||1, mu: +f.meios||0, ou: +f.operacionais||0, mr:0, ar:0, ts,
      ent:String(f.entidade||""), estimado: !!f.empenhado_estimado, livre:true };
  }

  const t = String(f.tipologia).trim().toUpperCase();
  const d = catDef(t);
  if(!d || d.mu == null) avisos.push(onde+": tipologia \""+t+"\" não consta do catálogo do Anexo 1; efetivos por confirmar.");

  /* `operacionais_unidade` só vem quando difere do previsto; sem ele usa-se o catálogo. */
  const ou = (f.operacionais_unidade != null)? +f.operacionais_unidade : ((d && d.ou) || 0);
  if(f.operacionais_unidade != null && d && d.ou != null && +f.operacionais_unidade !== +d.ou){
    avisos.push(onde+", "+t+": "+f.operacionais_unidade+" operacionais por unidade, catálogo diz "+d.ou+". Fica o efetivo real.");
  }
  return { t, q, mu: (d && d.mu) || 1, ou, mr: (d && d.mr) || 0, ar: (d && d.ar) || 0, ts,
    ent:String(f.entidade||""), estimado: !!f.empenhado_estimado, livre:false };
}

/** Verifica o indicativo do meio aéreo contra as tipologias que a DON lhe fixa. */
function indicativoAereoGP(tipo, indicativo, avisos){
  const ind = String(indicativo||"").trim();
  const familia = ind.split(/\s+/)[0].toUpperCase();
  const t = String(tipo||"").trim().toUpperCase();
  if(!ind || !GP_INDICATIVOS[familia]) return;
  if(GP_INDICATIVOS[familia].indexOf(t) < 0){
    avisos.push("Meio aéreo "+ind+": o indicativo "+familia+" está fixado para "
      + GP_INDICATIVOS[familia].join(" ou ")+", e a tipologia veio "+t+".");
  }
}

/**
 * Instante de um campo de tempo, na forma que a regra 3 da v1.2 fixa: **o mesmo campo**
 * aceita o GDH doutrinário ou uma marca ISO 8601 com fuso. As duas formas são
 * inequivocamente distinguíveis — o GDH é seis dígitos, três letras e dois dígitos —, e
 * tenta-se uma e depois a outra.
 *
 * Aceita ainda o campo irmão `<campo>_iso`, que uma revisão anterior desta Estação leu
 * antes de a v1.2 resolver a questão dentro do próprio campo. Nenhuma exportação o emite,
 * mas lê-se: descartar um instante em silêncio é pior do que a linha que isto custa. Se
 * os dois vierem e discordarem, uma das duas formas está errada e não se sabe qual —
 * fica a que traz fuso, e diz-se.
 *
 * @param {any} o objeto que traz o campo
 * @param {string} campo nome do campo
 * @param {string} onde rótulo para os avisos
 * @param {string[]} avisos
 * @returns {{ts:number|null, g:string}}
 */
function instanteCampo(o, campo, onde, avisos){
  const bruto = (o && o[campo] != null)? o[campo] : "";
  const irmao = (o && o[campo+"_iso"] != null)? o[campo+"_iso"] : "";
  const i = instanteFlexivel(bruto), j = instanteFlexivel(irmao);

  if(String(bruto).trim() && i.ts === null){
    avisos.push(onde+": instante ilegível (\""+bruto+"\"); nem GDH doutrinário nem ISO 8601 com fuso.");
  }
  if(String(irmao).trim() && j.ts === null){
    avisos.push(onde+": instante ISO ilegível (\""+irmao+"\"); fica o GDH.");
  }

  if(j.ts !== null){
    /* Um minuto de tolerância: o GDH não tem segundos. */
    if(i.ts !== null && Math.abs(i.ts - j.ts) > 60000){
      avisos.push(onde+": o instante ISO ("+j.g+") e o GDH ("+i.g+") não coincidem; fica o ISO.");
    }
    return { ts:j.ts, g:j.g };
  }
  return { ts:i.ts, g:i.g };
}

/**
 * Bloco `pco` — regra 10 da v1.2, e a mesma forma na secção 5 do contrato. Um leitor só
 * serve os dois envelopes, e devolve já a lista de funções como a Estação a guarda.
 *
 * As designações têm de vir exatas do art. 14.º e dos arts. 18.º a 38.º do Despacho
 * n.º 4067/2024: é essa cadeia que cruza com as funções exigíveis pela fase do SGO. Um
 * nome aproximado não rebenta nada — simplesmente não encontra correspondência, e a
 * aplicação passaria a dizer que a função está por nomear quando está nomeada. Falha
 * silenciosa é o pior género, e por isso avisa-se.
 *
 * @param {any} pco
 * @param {string[]} avisos
 */
function blocoPcoGP(pco, avisos){
  const funcoes = [];
  if(!pco || typeof pco !== "object" || Array.isArray(pco)) return funcoes;
  const conhecidas = FUNCOES_PCO.map(x=>x.f);

  (Array.isArray(pco.funcoes)? pco.funcoes : []).forEach(f=>{
    const nome = String(f.funcao||"").trim();
    if(!nome){ avisos.push("Função do PCO sem designação; ignorada."); return; }
    if(conhecidas.indexOf(nome) < 0){
      avisos.push("Função \""+nome+"\" não corresponde a nenhuma designação dos arts. 14.º e 18.º a 38.º; "
        + "entra como veio, mas não cruza com as funções exigíveis.");
    }
    funcoes.push({ f:nome, nome:String(f.nome||""), entidade:String(f.entidade||""),
      ct:String(f.contacto||""), siresp:String(f.siresp||""), ba:String(f.ba||""),
      solicitado:"", g: instanteCampo(f, "nomeado", "Função "+nome, avisos).g });
  });

  /* Os três núcleos do art. 17.º, n.º 2, als. d), e) e f) são nomeados por entidade
     externa a pedido do COS. São dois instantes distintos, e a distância entre eles é
     informação operacional: `nomeado` a null diz que o pedido continua pendente. */
  (Array.isArray(pco.nucleos_externos)? pco.nucleos_externos : []).forEach(n=>{
    const nome = String(n.nucleo||"").trim();
    if(!nome){ avisos.push("Núcleo externo sem designação; ignorado."); return; }
    if(conhecidas.indexOf(nome) < 0) avisos.push("Núcleo \""+nome+"\" não corresponde a designação conhecida.");
    const pedido = instanteCampo(n, "solicitado", "Núcleo "+nome, avisos).ts;
    const nomeado = instanteCampo(n, "nomeado", "Núcleo "+nome, avisos).ts;
    const quem = String(n.entidade_nomeadora||"").trim();
    if(pedido && !nomeado){
      avisos.push(nome+": solicitado a "+gdhDe(pedido)+" e ainda por nomear pela "+(quem||"entidade externa")+".");
    } else if(pedido && nomeado){
      const h = (nomeado-pedido)/3600000;
      if(h >= 1) avisos.push(nome+": "+fmtPT(h, 1)+" h entre a solicitação e a nomeação.");
    }
    /* Os dois instantes dos arts. 23.º, n.º 2, 24.º, n.º 2 e 25.º, n.º 2 gravam-se
       ambos: `solicitado` é o pedido do COS, `g` a nomeação pela entidade. Já eram
       lidos acima para compor os avisos; sem os gravar, um núcleo que nasça da
       importação entra sem o pedido e a pendência não o vê. */
    funcoes.push({ f:nome, nome:String(n.responsavel||""), entidade:quem,
      ct:String(n.contacto||""), siresp:"", ba:"",
      solicitado: pedido? gdhDe(pedido):"", g: nomeado? gdhDe(nomeado):"" });
  });
  return funcoes;
}

/**
 * Ponto de trânsito — regra 11 da v1.2, e o mesmo objeto no contrato. Opcional nos dois:
 * a DON n.º 2, pontos 7.d.(5), (7) e (8), manda estabelecê-lo quando há pedido de
 * reforço, e quem exporta pode não o conhecer.
 */
function pontoTransitoGP(ptc, avisos){
  const p = (ptc && typeof ptc === "object")? ptc : {};
  const lat = (p.lat != null)? p.lat : p.latitude;
  const lon = (p.lon != null)? p.lon : p.longitude;
  const ativo = instanteCampo(p, "ativo_desde", "Ponto de trânsito", avisos);
  return { des:String(p.designacao||""), resp:String(p.responsavel||""),
    ct:String(p.contacto||""),
    cd: (lat != null && lon != null)? (lat+", "+lon) : "",
    obs: ativo.g? ("Ativo desde "+ativo.g) : "" };
}

/**
 * Converte o pacote no que a Estação guarda. Não escreve no estado.
 *
 * @param {any} p pacote já validado
 */
function converterGestaoPCO(p){
  const avisos = [];
  if(p.__esquema === "esboco" || p.versao === 0){
    avisos.push("Pacote no esboço anterior, lido como versão 0. Serve para não perder dados antigos; não serve para operar.");
    return converterEsbocoGestaoPCO(p, avisos);
  }
  if(p.__esquema === "v11") return converterV11GestaoPCO(p, avisos);

  const oc = p.ocorrencia || {}, dp = p.dispositivo || {};
  const origem = p.origem || {};

  /* ---- identificação ---- */
  const meta = {};
  if(oc.num != null) meta.num = String(oc.num);
  if(oc.local != null) meta.local = String(oc.local);
  if(oc.lat != null) meta.lat = String(oc.lat);
  if(oc.lon != null) meta.lon = String(oc.lon);
  if(oc.lat != null || oc.lon != null) meta.coordFonte = "importação da Gestão PCO";
  if(oc.fase_sgo != null) meta.fase = String(oc.fase_sgo);
  if(oc.concelho != null) meta.concelho = String(oc.concelho);
  if(oc.distrito != null) meta.distrito = String(oc.distrito);
  if(oc.sub_regiao != null) meta.pasta = String(oc.sub_regiao);
  if(oc.pco && oc.pco.local != null) meta.pco = String(oc.pco.local);

  if(oc.inicio){
    const g = gdhDeISO(oc.inicio);
    if(g) meta.inicio = g;
    else avisos.push("Instante de início ilegível (\""+oc.inicio+"\"); o relógio dos 90 minutos fica sem base.");
  } else {
    avisos.push("Sem instante de início: a Estação não temporiza a transição de ataque inicial para ampliado.");
  }
  if(oc.nivel_decir){
    const n = String(oc.nivel_decir).trim().toUpperCase();
    if(["ALFA","BRAVO","CHARLIE","DELTA"].indexOf(n) >= 0) meta.nivel = n;
    else avisos.push("Nível DECIR \""+oc.nivel_decir+"\" não é um dos previstos; ignorado.");
  }
  const area = (oc.area_ha != null)? String(oc.area_ha) : "";

  /* ---- estrutura do posto de comando ---- */
  const funcoes = blocoPcoGP(p.pco, avisos);

  /* ---- dispositivo ---- */
  const setores = [];
  (Array.isArray(dp.setores)? dp.setores : []).forEach(s=>{
    const onde = "Setor "+String(s.id||"?");
    const tip = expandirUnidades((Array.isArray(s.forcas)? s.forcas : []).map(f=>forcaGP(f, onde, avisos)));
    setores.push({ estado: estadoSetorGP(s.estado, onde, avisos),
      cmd:String(s.comandante||""), adj:String(s.adjunto||""), ct:String(s.contacto||""),
      m:"", o:"", tip, livre: (s.livre != null)? String(s.livre) : "" });
  });

  const aerL = [];
  (Array.isArray(dp.aereos)? dp.aereos : []).forEach(a=>{
    indicativoAereoGP(a.tipo, a.indicativo, avisos);
    const ts = instanteISO(a.empenhado);
    if(!ts) avisos.push("Meio aéreo "+String(a.indicativo||a.tipo||"?")+": sem instante de empenhamento; não conta tempo no TO.");
    aerL.push({ t:String(a.tipo||"").toUpperCase(), ind:String(a.indicativo||""),
      g: ts? gdhDe(ts):"", ts, cma:String(a.cma||"") });
  });

  const bloco = (b, onde) => {
    if(!b) return { m:"", o:"" };
    const forcas = (Array.isArray(b.forcas)? b.forcas : []).map(f=>forcaGP(f, onde, avisos));
    const m = forcas.reduce((a,f)=>a+(f.q*(f.livre? f.mu : f.mu)), 0) + (+b.meios||0);
    const o = forcas.reduce((a,f)=>a+(f.q*f.ou), 0) + (+b.operacionais||0);
    return { m: m? String(m):"", o: o? String(o):"" };
  };

  /* ---- ponto de trânsito ---- */
  const pt = pontoTransitoGP(dp.ponto_transito, avisos);

  if(dp.zcr && dp.zcr.ativa){
    avisos.push("O pacote traz uma zona de concentração e reserva ativa"
      + (dp.zcr.local? " em "+dp.zcr.local : "")+"; a Estação ainda não tem onde a registar.");
  }

  const semRelogio = setores.reduce((a,s)=>a+s.tip.filter(f=>!f.ts).length, 0);
  return {
    meta, area, funcoes, pt,
    est: { n:setores.length, setores, aer: aerL.length? String(aerL.length):"", aerL,
      res: bloco(dp.reserva, "Reserva"), za: bloco(dp.zona_apoio, "Zona de apoio"), livre:false },
    avisos,
    resumo: { esquema:"contrato pco:dispositivo", versao:p.versao, setores:setores.length,
      forcas: setores.reduce((a,s)=>a+s.tip.length,0), aereos:aerL.length,
      funcoes: funcoes.length, semRelogio,
      emitido: gdhDeISO(p.emitido) || String(p.emitido||""),
      app:String(origem.app||""), rev:String(origem.rev||""),
      operador:String(origem.operador||""), posto:String(origem.posto||"") }
  };
}

/** Secção 8 do contrato: o esboço anterior, mapeado como versão 0. */
function converterEsbocoGestaoPCO(p, avisos){
  const oc = p.ocorrencia || {};
  const meta = {};
  if(oc.numero != null || oc.num != null) meta.num = String(oc.numero != null? oc.numero : oc.num);
  if(oc.local != null) meta.local = String(oc.local);

  const setores = (Array.isArray(p.setores)? p.setores : []).map((s,i)=>({
    estado: ESTADOS_SETOR[0], cmd:"", adj:"", ct:"", m:"", o:"", tip:[],
    livre: typeof s === "string" ? s : String((s && s.nome) || ("Setor "+NOMES_SETOR[i]))
  }));
  if(setores.length) avisos.push("Setores vieram como texto livre; nenhuma força tem tipologia nem relógio.");

  const aerL = [];
  const n = Math.max(0, Math.round(+p.meios_aereos || 0));
  for(let i=0;i<n;i++) aerL.push({ t:"HEBL", ind:"", g:"", ts:null, cma:"" });
  if(n) avisos.push("Meios aéreos vieram como contagem ("+n+"); gerados como HEBL sem indicativo nem instante.");

  return {
    meta, area:"", funcoes:[], pt:{des:"",resp:"",ct:"",cd:"",obs:""},
    est: { n:setores.length, setores, aer: n? String(n):"", aerL,
      res:{ m: p.meios != null? String(p.meios):"", o: p.operacionais != null? String(p.operacionais):"" },
      za:{ m:"", o:"" }, livre:false },
    avisos,
    resumo: { esquema:"esboço anterior", versao:0, setores:setores.length, forcas:0, aereos:n, funcoes:0,
      semRelogio:0, emitido:"", app:"", rev:"", operador:"", posto:"" }
  };
}

/**
 * Regra 6: uma importação que substitua dispositivo já registado apresenta o
 * diferencial antes de aplicar. Contagens não chegam — um pacote com o mesmo número
 * de setores pode perder um comandante ou os instantes de empenhamento, e é isso que
 * o oficial precisa de ver antes de decidir. As linhas de perda vêm assinaladas.
 *
 * @returns {{rot:string, antes:string|number, depois:string|number, perda:boolean}[]}
 */
function diferencialGestaoPCO(c){
  const e = estObj(), linhas = [];
  const add = (rot, antes, depois, perda) => {
    if(String(antes) !== String(depois)) linhas.push({ rot, antes, depois, perda: !!perda });
  };
  const forcas = ss => ss.reduce((a,s)=>a+((s.tip||[]).length), 0);
  const comRelogio = ss => ss.reduce((a,s)=>a+((s.tip||[]).filter(f=>f.ts).length), 0);

  if(O.meta.num || c.meta.num) add("Ocorrência", O.meta.num||"—", c.meta.num||"—", !!O.meta.num && !c.meta.num);

  add("Setores", e.setores.length, c.est.setores.length, c.est.setores.length < e.setores.length);
  add("Unidades", forcas(e.setores), forcas(c.est.setores), forcas(c.est.setores) < forcas(e.setores));
  add("Unidades com instante de empenhamento", comRelogio(e.setores), comRelogio(c.est.setores),
      comRelogio(c.est.setores) < comRelogio(e.setores));
  add("Meios aéreos", (e.aerL||[]).length, c.est.aerL.length, c.est.aerL.length < (e.aerL||[]).length);
  add("Reserva (veículos/operacionais)", (reservaObj().m||0)+"/"+(reservaObj().o||0), (c.est.res.m||0)+"/"+(c.est.res.o||0));
  add("Zona de apoio (veículos/operacionais)", (zaObj().m||0)+"/"+(zaObj().o||0), (c.est.za.m||0)+"/"+(c.est.za.o||0));

  /* As funções fundem-se pela designação, por isso nunca se perdem: a linha diz
     quantas ficam, não quantas o pacote traz. */
  if(c.funcoes.length){
    const atuais = pcoObj().funcoes.map(x=>x.f);
    const novas = c.funcoes.filter(x=>atuais.indexOf(x.f) < 0).length;
    add("Funções do PCO", atuais.length, atuais.length + novas);
  }

  /* Setor a setor: é aqui que aparece o que as contagens escondem. */
  const n = Math.max(e.setores.length, c.est.setores.length);
  for(let i=0;i<n;i++){
    const a = e.setores[i], d = c.est.setores[i], rot = "Setor "+(NOMES_SETOR[i] || (i+1));
    if(a && !d){ linhas.push({ rot, antes:"registado", depois:"deixa de existir", perda:true }); continue; }
    if(!a && d){ linhas.push({ rot, antes:"—", depois:"novo", perda:false }); continue; }
    add(rot+" · estado", a.estado||"—", d.estado||"—");
    add(rot+" · comandante", a.cmd||"—", d.cmd||"—", !!a.cmd && !d.cmd);
    add(rot+" · unidades", (a.tip||[]).length, d.tip.length, d.tip.length < (a.tip||[]).length);
    const ra = (a.tip||[]).filter(f=>f.ts).length, rd = d.tip.filter(f=>f.ts).length;
    add(rot+" · com relógio", ra, rd, rd < ra);
  }

  const registado = e.setores.length || (e.aerL||[]).length || pcoObj().funcoes.length;
  return registado ? linhas : [];
}

/** Assinatura do dispositivo, para detetar que o estado mudou por baixo. */
function assinaturaDispositivo(){
  const e = estObj();
  return [e.setores.length, e.setores.reduce((a,s)=>a+((s.tip||[]).length),0),
    (e.aerL||[]).length, pcoObj().funcoes.length, O.meta.num].join("|");
}

/**
 * Funde uma função do PCO com a que já está registada.
 *
 * O conversor devolve sempre a forma completa, e o que o pacote não traz vem vazio.
 * Vazio não é informação: é ausência. Sobrepor com ele um contacto, um canal ou um
 * instante de solicitação que o oficial registou à mão seria exatamente a perda que a
 * fusão por designação existe para impedir — o pacote passaria a apagar por omissão
 * aquilo que não sabe. Um valor que venha preenchido manda, porque aí o pacote sabe.
 *
 * Não há forma de o pacote pedir que se limpe um campo, e é deliberado: absence e
 * vazio chegam iguais ao fio, e entre não mexer e apagar, não mexer é o que se recupera.
 */
function fundirFuncaoPCO(atual, nova){
  const out = Object.assign({}, atual);
  Object.keys(nova).forEach(k=>{
    const v = nova[k];
    if(v === "" || v == null) return;
    out[k] = v;
  });
  return out;
}

/**
 * Escreve no estado. Regra 5: a fita do tempo regista a origem, o operador, o
 * instante de emissão e o de importação, e quantas unidades vieram sem relógio.
 */
function aplicarGestaoPCO(c){
  Object.keys(c.meta).forEach(k=>{ O.meta[k] = c.meta[k]; });
  if(c.area) O.dados.area = c.area;

  const e = estObj();
  e.n = c.est.n; e.setores = c.est.setores; e.aer = c.est.aer; e.aerL = c.est.aerL;
  e.livre = false;
  /* A reserva e a zona de apoio são da célula de logística e finanças. A escrita
     atravessa a fronteira de propósito — o contrato declara-as — e agora vê-se. */
  const L = logisticaObj();
  L.reserva = Object.assign({m:"",o:""}, c.est.res||{});
  L.zonaApoio = Object.assign({m:"",o:""}, c.est.za||{});

  /* Funde por designação, e não substitui por atacado: quem importa o dispositivo
     não pode apagar funções que o oficial nomeou à mão no PCO. A designação é a
     chave, o que é mais uma razão para vir exata. */
  if(c.funcoes.length){
    const P = pcoObj();
    c.funcoes.forEach(nova=>{
      const i = P.funcoes.findIndex(x=>x.f === nova.f);
      if(i < 0) P.funcoes.push(nova);
      else P.funcoes[i] = fundirFuncaoPCO(P.funcoes[i], nova);
    });
  }
  if(c.pt.des || c.pt.resp || c.pt.ct) Object.assign(ptObj(), c.pt);
  if(c.sensiveis) O.dados.sensiveis = c.sensiveis;

  const r = c.resumo;
  fita("Dispositivo importado da Gestão PCO ("+r.esquema+" v"+r.versao+")"
    + (r.app? " · origem "+r.app+(r.rev? " "+r.rev:"") : "")
    + (r.operador? " · operador "+r.operador : "")
    + (r.posto? " · posto "+r.posto : "")
    + (r.emitido? " · emitido "+r.emitido : "")
    + " · importado "+gdhAgora()
    + " · "+r.setores+" setores, "+r.forcas+" unidades, "+r.aereos+" meios aéreos, "+r.funcoes+" funções"
    + (r.semRelogio? " · "+r.semRelogio+" unidade(s) sem instante de empenhamento" : ""));
  return r;
}

/** Prepara a importação: lê, converte e calcula o diferencial. Não escreve nada. */
function prepararGestaoPCO(texto){
  const c = converterGestaoPCO(lerContratoGestaoPCO(texto));
  return { conversao: c, diferencial: diferencialGestaoPCO(c), avisos: c.avisos };
}

/* ---- ligação à interface ---- */
/* Conversão à espera de confirmação. Regra 6: não se sobrepõe em silêncio. */
let GP_PENDENTE = null;
/* Assinatura do dispositivo no momento em que o diferencial foi calculado. Se o
   estado mudar entretanto, o diferencial mostrado deixa de descrever o que vai
   acontecer, e aplicá-lo seria sobrepor às cegas — que é o que a regra 6 proíbe. */
let GP_ASSINATURA = null;

/** Diz como correu a importação, na caixa do próprio cartão. */
function gpDizer(cls, texto){
  const m = $("gp-msg"); if(!m) return;
  m.className = "msg "+cls; m.textContent = texto; m.style.display = "block";
}

/** Resumo de uma conversão, em texto corrido. */
function resumoGestaoPCO(r){
  return r.setores+" setores, "+r.forcas+" unidades e "+r.aereos+" meios aéreos"
    + (r.funcoes? ", "+r.funcoes+" funções do PCO" : "")
    + (r.emitido? " · emitido "+r.emitido : "")
    + (r.app? " · "+r.app+(r.operador? ", "+r.operador : "")+(r.posto? ", "+r.posto : "") : "");
}

/** Desenha o diferencial e os avisos. Conteúdo de origem externa: escapa-se sempre. */
function pintarPreparacaoGestaoPCO(prep){
  const el = $("gp-avisos"); if(!el) return;
  const partes = [];

  if(prep && prep.diferencial && prep.diferencial.length){
    partes.push('<div class="av-box" style="margin-top:10px"><span class="avt">Já há dispositivo registado — o que muda</span>'
      + '<div class="tabela" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-top:6px">'
      + '<tr><th style="text-align:left;padding:4px 8px">Campo</th><th style="text-align:left;padding:4px 8px">Agora</th><th style="text-align:left;padding:4px 8px">Depois</th></tr>'
      + prep.diferencial.map(l=>'<tr'+(l.perda? ' style="color:var(--fogo)"':'')+'><td style="padding:4px 8px">'
        + esc(l.rot)+(l.perda? ' <b>·</b>':'')+'</td><td style="padding:4px 8px">'+esc(l.antes)
        + '</td><td style="padding:4px 8px"><b>'+esc(l.depois)+'</b></td></tr>').join("")
      + '</table></div>'
      + (prep.diferencial.some(l=>l.perda)? '<p class="hint" style="margin:8px 0 0 0;color:var(--fogo)">As linhas assinaladas perdem informação que está registada. Confirma antes de aplicar.</p>' : '')
      + '<div class="row" style="margin-top:10px"><button class="btn btn-o" type="button" id="gp-aplicar">Aplicar a importação</button>'
      + '<button class="btn btn-g" type="button" id="gp-cancelar">Cancelar</button></div></div>');
  }

  if(prep && prep.avisos && prep.avisos.length){
    partes.push('<div class="av-box" style="margin-top:10px"><span class="avt">Importação: '
      + prep.avisos.length+' '+(prep.avisos.length===1? "ponto a confirmar":"pontos a confirmar")+'</span>'
      + '<ul style="margin:6px 0 0 18px">'
      + prep.avisos.map(a=>'<li class="hint" style="margin:0">'+esc(a)+'</li>').join("")+'</ul></div>');
  }

  el.innerHTML = partes.join("");
  const bA = $("gp-aplicar"), bC = $("gp-cancelar");
  if(bA) bA.addEventListener("click", ()=>confirmarGestaoPCO());
  if(bC) bC.addEventListener("click", ()=>{
    GP_PENDENTE = null; el.innerHTML = ""; gpDizer("ok","Importação cancelada. Nada foi alterado.");
  });
}

/** Aplica a conversão que estava à espera de confirmação. */
async function confirmarGestaoPCO(){
  if(!GP_PENDENTE){ gpDizer("err","Já não há importação à espera."); return false; }
  if(GP_ASSINATURA !== null && GP_ASSINATURA !== assinaturaDispositivo()){
    GP_PENDENTE = null; GP_ASSINATURA = null; pintarPreparacaoGestaoPCO(null);
    gpDizer("err","O dispositivo mudou desde que o diferencial foi calculado. Importa outra vez.");
    return false;
  }
  const c = GP_PENDENTE; GP_PENDENTE = null; GP_ASSINATURA = null;
  const r = aplicarGestaoPCO(c);
  escreverForm(); pintarTudo();
  pintarPreparacaoGestaoPCO({ diferencial:[], avisos:c.avisos });
  await persistir(false);
  gpDizer("ok","Dispositivo importado: "+resumoGestaoPCO(r)+".");
  return true;
}

/**
 * Lê e importa. Quando já há dispositivo registado, mostra o diferencial e espera
 * confirmação; quando não há, aplica de imediato.
 */
async function importarGestaoPCO(texto){
  let prep;
  try{ prep = prepararGestaoPCO(texto); }
  catch(e){
    GP_PENDENTE = null; pintarPreparacaoGestaoPCO(null);
    gpDizer("err","Não foi possível importar: "+((e && e.message) || e)+".");
    return false;
  }

  /* Regra 2: ocorrência diferente da que está carregada pede confirmação. */
  const nova = prep.conversao.meta.num;
  if(O.meta.num && nova && nova !== O.meta.num &&
     !window.confirm("Substituir a ocorrência "+O.meta.num+" pela ocorrência "+nova+" do pacote?")){
    gpDizer("ok","Importação cancelada. Nada foi alterado.");
    return false;
  }

  if(prep.diferencial.length){
    GP_PENDENTE = prep.conversao;
    GP_ASSINATURA = assinaturaDispositivo();
    pintarPreparacaoGestaoPCO(prep);
    gpDizer("av","Pacote lido: "+resumoGestaoPCO(prep.conversao.resumo)
      + ". Já há dispositivo registado — confirma o que muda antes de aplicar.");
    return false;
  }

  GP_PENDENTE = prep.conversao;
  GP_ASSINATURA = assinaturaDispositivo();
  return confirmarGestaoPCO();
}

/* ---- especificação v1.2, o esquema que governa ---- */

/**
 * Instante de um campo de tempo. Regra 3 da v1.2: **o mesmo campo** aceita o GDH
 * doutrinário ou uma marca ISO 8601 com fuso. As duas formas são inequivocamente
 * distinguíveis — o GDH é seis dígitos, três letras e dois dígitos —, e tenta-se uma
 * e depois a outra.
 *
 * @param {*} v
 * @returns {{ts:number|null, g:string, forma:"gdh"|"iso"|null}}
 */
function instanteFlexivel(v){
  const t = String(v==null? "" : v).trim();
  if(!t) return { ts:null, g:"", forma:null };

  const d = parseGDH(t);
  if(d) return { ts:d.getTime(), g:t, forma:"gdh" };

  const iso = instanteISO(t);
  if(iso !== null) return { ts:iso, g:gdhDe(iso), forma:"iso" };

  return { ts:null, g:"", forma:null };
}

/** Converte a sigla de tipologia — regra 7 da v1.2. */
function siglaV11(sigla, onde, avisos){
  const s = String(sigla||"").trim().toUpperCase();
  if(GP_SIGLAS[s]){
    avisos.push(onde+": tipologia "+sigla+" está descontinuada; convertida para "+GP_SIGLAS[s]+".");
    return GP_SIGLAS[s];
  }
  if(GP_SIGLAS_AMBIGUAS[s]){
    avisos.push(onde+": tipologia "+sigla+" precisa de decisão — "+GP_SIGLAS_AMBIGUAS[s]+". Ficou como veio.");
  }
  return s;
}

/** Mapeia um pacote v1.0, v1.1 ou v1.2 na mesma forma interna do contrato. */
function converterV11GestaoPCO(p, avisos){
  const oc = p.ocorrencia || {};
  if(String(p.versao) === "1.0") avisos.push("Pacote na versão 1.0; estados e siglas convertidos para a v1.1.");

  const meta = {};
  if(oc.numero != null) meta.num = String(oc.numero);
  if(oc.local != null) meta.local = String(oc.local);
  if(oc.pco != null) meta.pco = String(oc.pco);
  const fase = (oc.fase_sgo != null? oc.fase_sgo : oc.fase);
  if(fase != null) meta.fase = String(fase);
  if(oc.latitude != null) meta.lat = String(oc.latitude);
  if(oc.longitude != null) meta.lon = String(oc.longitude);
  if(oc.latitude != null || oc.longitude != null) meta.coordFonte = "importação da Gestão PCO";
  if(oc.inicio || oc.inicio_iso){
    const i = instanteCampo(oc, "inicio", "Início da ocorrência", avisos);
    if(i.ts !== null) meta.inicio = i.g;
    else avisos.push("O instante de início não é legível; o relógio dos 90 minutos fica sem base.");
  } else {
    avisos.push("Sem instante de início: a Estação não temporiza a transição de ataque inicial para ampliado.");
  }
  if(oc.nivel_decir){
    const n = String(oc.nivel_decir).trim().toUpperCase();
    if(["ALFA","BRAVO","CHARLIE","DELTA"].indexOf(n) >= 0) meta.nivel = n;
    else avisos.push("Nível DECIR \""+oc.nivel_decir+"\" não é um dos previstos; ignorado.");
  }

  const setores = [];
  (Array.isArray(p.setores)? p.setores : []).forEach(s=>{
    const onde = "Setor "+String(s.nome||"?");
    const tip = expandirUnidades((Array.isArray(s.meios)? s.meios : []).map(m=>{
      const t = siglaV11(m.tipologia, onde, avisos);
      const d = catDef(t);
      const mu = (m.veiculos != null)? +m.veiculos : ((d && d.mu) || 1);
      const ou = (m.operacionais != null)? +m.operacionais : ((d && d.ou) || 0);
      if(m.veiculos != null && d && d.mu != null && +m.veiculos !== +d.mu){
        avisos.push(onde+", "+t+": "+m.veiculos+" veículos por unidade, catálogo diz "+d.mu+". Fica o valor exportado.");
      }
      if(m.operacionais != null && d && d.ou != null && +m.operacionais !== +d.ou){
        avisos.push(onde+", "+t+": "+m.operacionais+" operacionais por unidade, catálogo diz "+d.ou+". Fica o valor exportado.");
      }
      const i = instanteCampo(m, "empenhado_desde", onde+", "+t, avisos);
      if(i.ts === null && !m.empenhado_desde && !m.empenhado_desde_iso){
        avisos.push(onde+", "+t+": sem instante de empenhamento; fica sem controlo de tempos nem rendição.");
      }
      /* Regra 9: uma estimativa assinalada vale mais do que um campo vazio — o operador
         vê a marca e sabe que aquele contador tem margem. */
      if(i.ts !== null && m.empenhado_estimado){
        avisos.push(onde+", "+t+": instante de empenhamento é estimativa assinalada pela origem.");
      }
      return { t, q:+m.quantidade||0, mu, ou, mr:(d && d.mr)||0, ar:(d && d.ar)||0,
        ts: i.ts, ent:String(m.entidade||""), estimado: !!m.empenhado_estimado, livre:false };
    }));
    setores.push({ estado: estadoSetorGP(s.estado, onde, avisos),
      cmd:String(s.comandante||""), adj:String(s.adjunto||""), ct:String(s.contacto||""),
      m:"", o:"", tip, livre:"" });
  });

  const aerL = [];
  if(Array.isArray(p.meios_aereos)){
    p.meios_aereos.forEach(a=>{
      const t = siglaV11(a.tipologia, "Meios aéreos", avisos);
      indicativoAereoGP(t, a.indicativo, avisos);
      const i = instanteCampo(a, "entrada_to", "Meio aéreo "+(a.indicativo||t), avisos);
      if(i.ts === null){
        avisos.push("Meio aéreo "+(a.indicativo||t||"?")+": sem hora de entrada no TO; não conta tempo no teatro.");
      }
      aerL.push({ t, ind:String(a.indicativo||""), g: i.g, ts: i.ts, cma:"" });
    });
  } else if(Number.isFinite(+p.meios_aereos) && +p.meios_aereos > 0){
    const n = Math.round(+p.meios_aereos);
    for(let i=0;i<n;i++) aerL.push({ t:"", ind:"", g:"", ts:null, cma:"" });
    avisos.push("Meios aéreos vieram como contagem ("+n+"); sem indicativo nem hora de entrada, não há contagem de tempo no TO.");
  }

  const conta = (b, campo) => (b && b[campo] != null)? String(b[campo]) : "";
  const sensiveis = (Array.isArray(p.sensiveis)? p.sensiveis : [])
    .map(x=>[x.nome, x.grau, x.nota].filter(Boolean).join(" · ")).filter(Boolean).join("; ");

  /* Bloco `pco` e ponto de trânsito: a v1.2 acrescenta-os, e a v1.1 não os trazia.
     Ausentes, `blocoPcoGP` devolve lista vazia e `pontoTransitoGP` um cartão vazio, que é
     exatamente o que a v1.1 produzia — a retrocompatibilidade não custa um ramo. */
  const funcoes = blocoPcoGP(p.pco, avisos);
  const pt = pontoTransitoGP(p.ponto_transito, avisos);
  const emitido = instanteFlexivel(p.gerado);

  return {
    meta, area:"", funcoes, sensiveis, pt,
    est: { n:setores.length, setores, aer: aerL.length? String(aerL.length):"", aerL,
      res:{ m:conta(p.reserva,"veiculos"), o:conta(p.reserva,"operacionais") },
      za:{ m:conta(p.za,"veiculos"), o:conta(p.za,"operacionais") }, livre:false },
    avisos,
    resumo: { esquema:"especificação", versao:String(p.versao), setores:setores.length,
      forcas:setores.reduce((a,s)=>a+s.tip.length,0), aereos:aerL.length,
      funcoes:funcoes.length,
      semRelogio:setores.reduce((a,s)=>a+s.tip.filter(f=>!f.ts).length,0),
      emitido: emitido.g || String(p.gerado||""), app:"", rev:"", operador:"", posto:"" }
  };
}
