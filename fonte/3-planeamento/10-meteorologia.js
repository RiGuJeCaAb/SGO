/* ================= PLANEAMENTO · meteorologia (art. 29.º) ================= */
/** O rumo escrito de um ângulo, em dezasseis pontos — a rosa é a do núcleo. */
const card = d => rumoDoAngulo(d);
const angDiff = (a,b)=>{let x=Math.abs(a-b)%360;return x>180?360-x:x;};
const hh = n => String(n).padStart(2,"0")+"h";

/**
 * Os limiares da análise, declarados num sítio só.
 *
 * Estavam escritos por dentro das comparações, e dois deles não tinham chão nenhum: uma
 * rotação de 50° com vento de 3 km/h é ruído de modelo, não é mudança de regime, e
 * `precipitação > 0` acende a assinatura convectiva com um décimo de milímetro. A análise
 * é determinística; o que não pode é ser determinística a partir de limiares que ninguém
 * vê. Ficam aqui, com a razão de cada um, e a legenda no ecrã diz os mesmos números.
 *
 * Não são doutrina: são heurísticas de leitura de meteograma, e é por isso que se
 * declaram em vez de se citarem.
 */
const LIMIARES_METEO = {
  /** graus entre duas horas consecutivas a partir dos quais há rotação a assinalar */
  rotGraus: 50,
  /** km/h abaixo dos quais a direção do vento não é sinal: com vento fraco a direção
      oscila sozinha, e o modelo devolve-a na mesma */
  rotVentoMin: 8,
  /** mm/h a partir dos quais a precipitação conta como assinatura convectiva */
  convPrecip: 0.2,
  /** horas seguidas que uma janela de consolidação tem de ter para valer a pena montá-la */
  janelaMinH: 2,
  /** HR % igual ou abaixo da qual o combustível fino está totalmente disponível */
  rhCritica: 20,
  /** HR % a partir da qual há janela de ataque direto favorável */
  rhJanela: 50,
};

/**
 * Lê a série meteorológica colada, seja qual for o separador e a ordem das colunas.
 *
 * Ponto e vírgula, tabulação ou vírgula; cabeçalhos achados pelo nome e não pela posição.
 * O que chega é o que o SpotWX ou o Open-Meteo escreveram, e não um formato nosso.
 *
 * Recusa menos de três horas: uma série curta não sustenta janela nem rotação, e analisá-la
 * daria conclusões com a mesma cara das boas.
 */
function parseCSV(txt){
  const L = txt.trim().split(/\r?\n/).filter(l=>l.trim());
  if(L.length<4) throw "Poucos dados: são precisas pelo menos 3 horas.";
  const sep = L[0].includes(";")?";":(L[0].includes("\t")?"\t":",");
  const H = L[0].split(sep).map(h=>h.trim().toUpperCase());
  const ix = n => H.findIndex(h=>h.includes(n));
  let iT=ix("TEMP"),iR=ix("RH"),iD=ix("WD"),iW=ix("WS"),iP=ix("PRECIP"),iDt=0,st=1;
  let iH = H.findIndex(h=>h==="HOUR"); if(iH<0) iH = H.findIndex(h=>h.includes("HOUR")&&!h.includes("HOURLY"));
  if(iT<0||iR<0){ iDt=0;iH=1;iT=2;iR=3;iD=4;iW=5;iP=6;st=0; }
  else { iDt=H.findIndex(h=>h.includes("HOURLY")||h.includes("DATE")); if(iDt<0)iDt=0; }
  const out=[];
  for(let i=st;i<L.length;i++){
    const c=L[i].split(sep).map(x=>x.trim()); if(c.length<4) continue;
    /* `numPT` devolve nulo ao que não é número; aqui fica `NaN`, que é o que a triagem
       das linhas abaixo já sabe recusar. */
    const n = v => { const x = numPT(v); return x === null ? NaN : x; };
    const p={d:c[iDt]||"",h:parseInt(c[iH],10),t:n(c[iT]), rh:n(c[iR]), wd:parseFloat(c[iD]), ws:n(c[iW]), pr:iP>=0? n(c[iP]) : 0};
    if([p.h,p.t,p.rh,p.wd].some(Number.isNaN)) continue;
    if(p.rh<0||p.rh>100) throw "HR fora de 0–100 % na linha "+(i+1)+".";
    out.push(p);
  }
  if(out.length<3) throw "Não interpretei as colunas — confirma o formato.";
  return out;
}
/**
 * Lê a série e devolve o que dela interessa ao plano.
 *
 * Janelas de consolidação (humidade acima do limiar), rotações do vento, assinatura
 * convectiva e os extremos. Os limiares vêm de `LIMIARES_METEO`, declarados: uma rotação
 * de 50° com vento de 3 km/h é ruído, e sem chão a análise apontava ruído como facto.
 */
function analisar(S){
  const L = LIMIARES_METEO;
  const jans=[]; let cur=null;
  S.forEach(p=>{ if(p.rh>=L.rhJanela){ if(!cur)cur={i:p}; cur.f=p; } else if(cur){ jans.push(cur); cur=null; } });
  if(cur) jans.push(cur);
  const rot=[]; for(let i=1;i<S.length;i++){
    const d=angDiff(S[i].wd,S[i-1].wd);
    /* Com vento fraco dos dois lados, a direção não é sinal: oscila sozinha e o modelo
       devolve-a na mesma. Uma rotação exige que haja vento para rodar. */
    const vento = Math.max(+S[i].ws||0, +S[i-1].ws||0);
    if(d>=L.rotGraus && vento>=L.rotVentoMin){
      rot.push({p:S[i],de:card(S[i-1].wd),para:card(S[i].wd),g:Math.round(d),ws:Math.round(vento)});
    }
  }
  const rhMin=S.reduce((a,b)=>b.rh<a.rh?b:a), rhMax=S.reduce((a,b)=>b.rh>a.rh?b:a);
  const tMax=S.reduce((a,b)=>b.t>a.t?b:a), tMin=S.reduce((a,b)=>b.t<a.t?b:a);
  const conv=S.filter(p=>p.pr>=L.convPrecip), crit=S.filter(p=>p.rh<=L.rhCritica);
  /* Uma hora isolada acima dos 50 % não é janela: não dá para montar um ataque nela.
     `h` é a hora do dia, e a série é horária — a duração é a diferença mais um. */
  const uteis = jans.filter(j=>((j.f.h - j.i.h + 24) % 24) + 1 >= L.janelaMinH);
  const jan = uteis.length ? uteis.reduce((a,b)=>(b.f.h-b.i.h)>(a.f.h-a.i.h)?b:a) : null;
  return {jan,rot,rhMin,rhMax,tMax,tMin,conv,crit};
}
/** O que dizer de uma hora da série, em texto — o que a torna notável, se for. */
function leitura(p,a){
  const L = LIMIARES_METEO;
  if(p.pr>=L.convPrecip) return "Assinatura convectiva — rajadas erráticas possíveis";
  const r=a.rot.find(r=>r.p===p); if(r) return "Rotação "+r.de+"→"+r.para+" ("+r.g+"°)";
  if(a.jan&&p===a.jan.i) return "ABERTURA da janela de consolidação";
  if(a.jan&&p===a.jan.f) return "Último período pleno da janela";
  if(p.rh<=L.rhCritica) return "Crítico — combustível fino totalmente disponível";
  if(p.rh>=L.rhJanela) return "Janela — ataque direto favorável";
  if(p.rh>=30) return "Transição"; return "";
}
/** Junta horas seguidas num intervalo: «14h–17h, 21h» em vez de sete horas soltas. */
function resumoHoras(hs){
  if(!hs.length) return "";
  const n=hs.map(h=>parseInt(h)); const out=[]; let a=n[0],b=n[0];
  for(let i=1;i<=n.length;i++){ if(i<n.length && (n[i]===b+1 || (b===23&&n[i]===0))) b=n[i];
    else { out.push(a===b? hh(a) : hh(a)+"–"+hh(b)); if(i<n.length){a=n[i];b=n[i];} } }
  return out.join(", ");
}
/**
 * Os números da meteorologia como o PEA os cita.
 *
 * **Sem série carregada devolve traços, e não falha.** Uma proposta ainda é possível com a
 * parte meteorológica assinalada em falta; impedir a emissão por não haver previsão seria
 * impedir de planear quem está sem rede.
 */
function metricas(){
  const a=ANALISE;
  /* sem série meteorológica carregada a proposta ainda é possível, com a parte
     meteorológica assinalada como em falta em vez de fazer falhar a emissão */
  if(!a || !SERIE.length) return {
    janela:null, hr_min:{v:"—",h:"—",d:"—"}, hr_max:{v:"—",h:"—"},
    t_max:{v:"—",h:"—",d:"—"}, t_min:{v:"—",h:"—"},
    rotacoes:[], criticas:[], convectivo:[], vento_max:null,
    avisos_ipma: O.avisos? {distrito:O.avisos.distrito, ativos:O.avisos.lista.map(x=>x.tipo+" "+x.nivel.toUpperCase()+" até "+fmtAvisoT(x.fim))} : null,
    topografia: O.dados.topo && (O.dados.topo.orient||O.dados.topo.declive) ? O.dados.topo : null,
    alinhamento_relevo_vento:null, precip_total:0,
    nota:"sem previsão carregada — meteorologia por preencher em Planeamento; a análise meteorológica desta proposta está em falta"
  };
  return {
    janela: a.jan?{inicio:hh(a.jan.i.h),fim:hh(a.jan.f.h+1),hr_inicio:a.jan.i.rh,hr_max:a.rhMax.rh}:null,
    hr_min:{v:a.rhMin.rh,h:hh(a.rhMin.h),d:a.rhMin.d}, hr_max:{v:a.rhMax.rh,h:hh(a.rhMax.h)},
    t_max:{v:a.tMax.t,h:hh(a.tMax.h),d:a.tMax.d}, t_min:{v:a.tMin.t,h:hh(a.tMin.h)},
    rotacoes:a.rot.map(r=>({h:hh(r.p.h),d:r.p.d,de:r.de,para:r.para,g:r.g})),
    criticas:a.crit.map(p=>hh(p.h)+" "+p.d),
    convectivo:a.conv.map(p=>({h:hh(p.h),mm:p.pr,vento:card(p.wd)})),
    vento_max:(()=>{const w=SERIE.reduce((x,y)=>y.ws>x.ws?y:x);return {v:w.ws,h:hh(w.h),rumo:card(w.wd)};})(),
    avisos_ipma: O.avisos? {distrito:O.avisos.distrito, ativos:O.avisos.lista.map(a=>a.tipo+" "+a.nivel.toUpperCase()+" até "+fmtAvisoT(a.fim))} : null,
    topografia: O.dados.topo && (O.dados.topo.orient||O.dados.topo.declive) ? O.dados.topo : null,
    alinhamento_relevo_vento: (()=>{
      const t=O.dados.topo||{orient:"",declive:"",obs:""}; const deg=grausDoRumo(t.orient);
      if(deg===null) return null;
      const horas=SERIE.filter(p=>angDiff(p.wd,deg)<=45);
      if(!horas.length) return {orient:t.orient, declive:t.declive||"", horas:[], criticas:[]};
      return {orient:t.orient, declive:t.declive||"",
        horas:horas.map(p=>hh(p.h)),
        criticas:horas.filter(p=>p.rh<30 && (t.declive==="acentuado"||t.declive==="muito")).map(p=>hh(p.h)),
        nota:"vento de "+t.orient+" sobe as encostas expostas a "+t.orient+" — alinhamento fogo-declive-vento"};
    })(),
    precip_total:Math.round(SERIE.reduce((t,p)=>t+(p.pr||0),0)*10)/10,
    nota:"modelo global; nao resolve ventos de vale — catabaticos reais superiores nas encostas"
  };
}

