/* ================= importação da Gestão PCO ================= */
/* Lê o instantâneo do dispositivo exportado pela app Gestão PCO, conforme
   docs/CSREPCDouro_202608271715_EspecificacaoExportacaoJSON_CLD.md, esquema v1.1.

   Uma direção só: a Estação lê, não escreve de volta. A verdade do dispositivo em
   tempo real fica na Gestão PCO; a evolução, os PEA, os avisos e a fita do tempo
   ficam na Estação. A importação toca no que a secção 5 da especificação mapeia, e
   em mais nada.

   O ficheiro importado é dados, nunca código: valida-se a versão antes de ler o
   resto, converte-se o que a especificação manda converter, assinala-se o que não
   se pode converter sem decidir por quem exportou, e o que não se reconhece é
   ignorado — regra 9. Nada é executado nem inserido como HTML. */

const GP_VERSOES = ["1.0", "1.1"];

/* Siglas descontinuadas com conversão determinada — especificação, regra 6. */
const GP_SIGLAS = { GRIF:"GRIR", GAUF:"EAUF" };

/* Siglas cuja conversão exige uma decisão que a Estação não pode tomar sozinha.
   Ficam como vieram, assinaladas, para o oficial resolver. */
const GP_SIGLAS_AMBIGUAS = {
  "FEB":"decompor em ETATI, PATE ou GRUATA (UEPS)",
  "FEB/UEPS":"decompor em ETATI, PATE ou GRUATA (UEPS)",
  "UEPS":"decompor em ETATI, PATE ou GRUATA (UEPS)",
  "MR":"indicar a entidade: EMR (CB), EMR (ICNF), EMR (FEPC) ou EMR (AFOCELCA)"
};

const GP_NIVEIS = ["ALFA","BRAVO","CHARLIE","DELTA"];

/** Erro de importação, com o motivo legível já dentro. */
function erroGP(texto){ return new Error(texto); }

/**
 * Lê e valida o pacote. Não converte nada: só garante que é um pacote da Gestão PCO
 * de uma versão que a Estação sabe ler.
 *
 * @param {string} texto
 * @returns {any}
 */
function lerPacoteGestaoPCO(texto){
  let p;
  try{ p = JSON.parse(texto); }
  catch(e){ throw erroGP("o ficheiro não é JSON válido"); }
  if(!p || typeof p!=="object" || Array.isArray(p)) throw erroGP("o ficheiro não tem a forma esperada");
  if(!p.versao) throw erroGP("falta a versão do esquema, que é obrigatória");
  const v = String(p.versao);
  if(GP_VERSOES.indexOf(v) < 0){
    throw erroGP("esquema na versão "+v+"; esta revisão lê as versões "+GP_VERSOES.join(" e "));
  }
  if(!p.ocorrencia || typeof p.ocorrencia!=="object") throw erroGP("o pacote não traz a ocorrência");
  return p;
}

/** Converte a sigla de tipologia. Devolve a sigla a usar e o aviso, se houver. */
function siglaGestaoPCO(sigla){
  const s = String(sigla||"").trim().toUpperCase();
  if(GP_SIGLAS[s]) return { t: GP_SIGLAS[s], aviso: "Tipologia "+sigla+" está descontinuada; convertida para "+GP_SIGLAS[s]+"." };
  if(GP_SIGLAS_AMBIGUAS[s]) return { t: s, aviso: "Tipologia "+sigla+" precisa de decisão: "+GP_SIGLAS_AMBIGUAS[s]+". Ficou como veio." };
  return { t: s, aviso: null };
}

/** Converte o estado de setor para a nomenclatura da DON n.º 2, ponto 7.f. */
function estadoGestaoPCO(estado){
  const e = String(estado||"").trim();
  const novo = migrarEstado(e);
  return { estado: novo, aviso: (e && novo !== e)? "Estado de setor \""+e+"\" convertido para \""+novo+"\"." : null };
}

/** Instante de um GDH, ou null. */
function instanteGDH(g){ const d = parseGDH(String(g||"").trim()); return d? d.getTime() : null; }

/**
 * Converte o pacote no que a Estação guarda. Não escreve no estado: devolve as
 * peças e a lista de avisos, para que quem chama decida.
 *
 * @param {any} p pacote já validado
 */
function converterGestaoPCO(p){
  const avisos = [];
  const oc = p.ocorrencia || {};
  const versao = String(p.versao);
  if(versao === "1.0") avisos.push("Pacote na versão 1.0; estados e siglas convertidos para a v1.1.");

  /* ---- identificação ---- */
  const meta = {};
  if(oc.numero != null) meta.num = String(oc.numero);
  if(oc.local != null) meta.local = String(oc.local);
  if(oc.pco != null) meta.pco = String(oc.pco);
  const fase = (oc.fase_sgo != null? oc.fase_sgo : oc.fase);   /* sinónimo aceite, regra 4 */
  if(fase != null) meta.fase = String(fase);
  if(oc.latitude != null) meta.lat = String(oc.latitude);
  if(oc.longitude != null) meta.lon = String(oc.longitude);

  if(oc.inicio){ meta.inicio = String(oc.inicio);
    if(!instanteGDH(oc.inicio)) avisos.push("O GDH de início \""+oc.inicio+"\" não é legível; o relógio dos 90 minutos fica sem base.");
  } else {
    avisos.push("Sem GDH de início: a Estação não consegue temporizar a transição de ataque inicial para ampliado.");
  }

  if(oc.nivel_decir){
    const n = String(oc.nivel_decir).trim().toUpperCase();
    if(GP_NIVEIS.indexOf(n) >= 0) meta.nivel = n;
    else avisos.push("Nível DECIR \""+oc.nivel_decir+"\" não é um dos previstos; ignorado, e o nível será derivado da data.");
  }

  /* ---- setores e meios ---- */
  const setores = [];
  (Array.isArray(p.setores)? p.setores : []).forEach(s=>{
    const est = estadoGestaoPCO(s.estado);
    if(est.aviso) avisos.push(est.aviso);

    const tip = (Array.isArray(s.meios)? s.meios : []).map(m=>{
      const sg = siglaGestaoPCO(m.tipologia);
      if(sg.aviso) avisos.push("Setor "+(s.nome||"?")+": "+sg.aviso);

      const q = +m.quantidade || 0;
      const mu = (m.veiculos != null)? +m.veiculos : null;
      const ou = (m.operacionais != null)? +m.operacionais : null;

      /* Regra 6: divergências face ao catálogo não bloqueiam; prevalece o valor
         exportado, por ser o efetivo real da força no TO, e assinala-se. */
      const d = catDef(sg.t);
      if(mu != null && d && d.mu != null && +d.mu !== mu){
        avisos.push("Setor "+(s.nome||"?")+", "+sg.t+": "+mu+" veículos por unidade, catálogo diz "+d.mu+". Fica o valor exportado.");
      }
      if(ou != null && d && d.ou != null && +d.ou !== ou){
        avisos.push("Setor "+(s.nome||"?")+", "+sg.t+": "+ou+" operacionais por unidade, catálogo diz "+d.ou+". Fica o valor exportado.");
      }

      const ts = instanteGDH(m.empenhado_desde);
      if(m.empenhado_desde && !ts){
        avisos.push("Setor "+(s.nome||"?")+", "+sg.t+": GDH de empenhamento \""+m.empenhado_desde+"\" ilegível; sem relógio de rendição.");
      }
      return { t: sg.t, q, mu: (mu != null? mu : ((d && d.mu) || 1)), ou: (ou != null? ou : ((d && d.ou) || 0)),
        mr: (d && d.mr) || 0, ar: (d && d.ar) || 0, ts: ts };
    });

    setores.push({ estado: est.estado, cmd: String(s.comandante||""), adj: String(s.adjunto||""),
      ct: String(s.contacto||""), m:"", o:"", tip, nome: String(s.nome||"") });
  });

  /* ---- meios aéreos ---- */
  const aerL = [];
  if(Array.isArray(p.meios_aereos)){
    p.meios_aereos.forEach(a=>{
      const sg = siglaGestaoPCO(a.tipologia);
      if(sg.aviso) avisos.push("Meios aéreos: "+sg.aviso);
      const ts = instanteGDH(a.entrada_to);
      if(a.entrada_to && !ts) avisos.push("Meio aéreo "+(a.indicativo||sg.t)+": GDH de entrada \""+a.entrada_to+"\" ilegível.");
      aerL.push({ t: sg.t, ind: String(a.indicativo||""), g: String(a.entrada_to||""), ts });
    });
  } else if(Number.isFinite(+p.meios_aereos) && +p.meios_aereos > 0){
    /* Retrocompatibilidade da regra 7: um inteiro vira entradas anónimas sem relógio. */
    const n = Math.round(+p.meios_aereos);
    for(let i=0;i<n;i++) aerL.push({ t:"", ind:"", g:"", ts:null });
    avisos.push("Meios aéreos vieram como contagem ("+n+"); sem indicativo nem hora de entrada, não há contagem de tempo no TO.");
  }

  /* ---- reserva, ZA e pontos sensíveis ---- */
  const num = (x, campo) => (x && x[campo] != null)? String(x[campo]) : "";
  const res = { m: num(p.reserva,"veiculos"), o: num(p.reserva,"operacionais") };
  const za  = { m: num(p.za,"veiculos"),      o: num(p.za,"operacionais") };

  const sensiveis = (Array.isArray(p.sensiveis)? p.sensiveis : [])
    .map(s=>[s.nome, s.grau, s.nota].filter(Boolean).join(" · "))
    .filter(Boolean).join("; ");

  return {
    meta, sensiveis,
    est: { n: setores.length, setores, aer: aerL.length? String(aerL.length):"", aerL, res, za, livre:false },
    avisos,
    resumo: { setores: setores.length,
      meios: setores.reduce((a,s)=>a+s.tip.length,0),
      aereos: aerL.length,
      gerado: String(p.gerado||""), versao }
  };
}

/**
 * Aplica ao estado. Toca apenas no que a especificação mapeia: identificação,
 * dispositivo e pontos sensíveis. Evolução, PEA, meteograma e fita não se tocam.
 *
 * @param {string} texto conteúdo do ficheiro exportado
 * @returns {{resumo:any, avisos:string[]}}
 */
function aplicarGestaoPCO(texto){
  const c = converterGestaoPCO(lerPacoteGestaoPCO(texto));

  Object.keys(c.meta).forEach(k=>{ O.meta[k] = c.meta[k]; });
  const e = estObj();
  e.n = c.est.n; e.setores = c.est.setores; e.aer = c.est.aer; e.aerL = c.est.aerL;
  e.res = c.est.res; e.za = c.est.za; e.livre = false;
  if(c.sensiveis) O.dados.sensiveis = c.sensiveis;

  fita("Dispositivo importado da Gestão PCO (esquema v"+c.resumo.versao+"; "
    + c.resumo.setores+" setores, "+c.resumo.meios+" tipologias, "+c.resumo.aereos+" meios aéreos)");
  return { resumo: c.resumo, avisos: c.avisos };
}

/** Desenha os avisos da importação. São dados de origem externa: escapam-se. */
function pintarAvisosGestaoPCO(avisos){
  const el = $("gp-avisos"); if(!el) return;
  if(!avisos || !avisos.length){ el.innerHTML = ""; return; }
  el.innerHTML = '<div class="av-box" style="margin-top:10px"><span class="avt">Importação: '
    + avisos.length+' '+(avisos.length===1? "ponto a confirmar":"pontos a confirmar")+'</span>'
    + '<ul style="margin:6px 0 0 18px">'
    + avisos.map(a=>'<li class="hint" style="margin:0">'+esc(a)+'</li>').join("")
    + '</ul></div>';
}

/** Orquestra a importação a partir de texto, com as mensagens ao utilizador. */
async function importarGestaoPCO(texto){
  const msg = $("gp-msg");
  const dizer = (cls, t)=>{ if(msg){ msg.className="msg "+cls; msg.textContent=t; msg.style.display="block"; } };
  try{
    const { resumo, avisos } = aplicarGestaoPCO(texto);
    escreverForm(); pintarTudo(); pintarAvisosGestaoPCO(avisos);
    await persistir(false);
    dizer("ok", "Dispositivo importado: "+resumo.setores+" setores, "+resumo.meios
      + " tipologias e "+resumo.aereos+" meios aéreos"
      + (resumo.gerado? ", instantâneo de "+resumo.gerado : "")
      + (avisos.length? ". Há "+avisos.length+" ponto(s) a confirmar." : "."));
    return true;
  }catch(e){
    pintarAvisosGestaoPCO([]);
    dizer("err", "Não foi possível importar: "+((e && e.message) || e)+".");
    return false;
  }
}
