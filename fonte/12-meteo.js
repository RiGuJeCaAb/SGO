/* ================= meteo ================= */
const CARD = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSO","SO","OSO","O","ONO","NO","NNO"];
const card = d => CARD[Math.round((((d%360)+360)%360)/22.5)%16];
const angDiff = (a,b)=>{let x=Math.abs(a-b)%360;return x>180?360-x:x;};
const hh = n => String(n).padStart(2,"0")+"h";

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
    const p={d:c[iDt]||"",h:parseInt(c[iH],10),t:parseFloat(String(c[iT]).replace(",",".")),
      rh:parseFloat(String(c[iR]).replace(",",".")),wd:parseFloat(c[iD]),
      ws:parseFloat(String(c[iW]).replace(",",".")),pr:iP>=0?parseFloat(String(c[iP]).replace(",",".")):0};
    if([p.h,p.t,p.rh,p.wd].some(Number.isNaN)) continue;
    if(p.rh<0||p.rh>100) throw "HR fora de 0–100 % na linha "+(i+1)+".";
    out.push(p);
  }
  if(out.length<3) throw "Não interpretei as colunas — confirma o formato.";
  return out;
}
function analisar(S){
  const jans=[]; let cur=null;
  S.forEach(p=>{ if(p.rh>=50){ if(!cur)cur={i:p}; cur.f=p; } else if(cur){ jans.push(cur); cur=null; } });
  if(cur) jans.push(cur);
  const rot=[]; for(let i=1;i<S.length;i++){ const d=angDiff(S[i].wd,S[i-1].wd);
    if(d>=50) rot.push({p:S[i],de:card(S[i-1].wd),para:card(S[i].wd),g:Math.round(d)}); }
  const rhMin=S.reduce((a,b)=>b.rh<a.rh?b:a), rhMax=S.reduce((a,b)=>b.rh>a.rh?b:a);
  const tMax=S.reduce((a,b)=>b.t>a.t?b:a), tMin=S.reduce((a,b)=>b.t<a.t?b:a);
  const conv=S.filter(p=>p.pr>0), crit=S.filter(p=>p.rh<=20);
  const jan = jans.length ? jans.reduce((a,b)=>(b.f.h-b.i.h)>(a.f.h-a.i.h)?b:a) : null;
  return {jan,rot,rhMin,rhMax,tMax,tMin,conv,crit};
}
function leitura(p,a){
  if(p.pr>0) return "Assinatura convectiva — rajadas erráticas possíveis";
  const r=a.rot.find(r=>r.p===p); if(r) return "Rotação "+r.de+"→"+r.para+" ("+r.g+"°)";
  if(a.jan&&p===a.jan.i) return "ABERTURA da janela de consolidação";
  if(a.jan&&p===a.jan.f) return "Último período pleno da janela";
  if(p.rh<=20) return "Crítico — combustível fino totalmente disponível";
  if(p.rh>=50) return "Janela — ataque direto favorável";
  if(p.rh>=30) return "Transição"; return "";
}
function resumoHoras(hs){
  if(!hs.length) return "";
  const n=hs.map(h=>parseInt(h)); const out=[]; let a=n[0],b=n[0];
  for(let i=1;i<=n.length;i++){ if(i<n.length && (n[i]===b+1 || (b===23&&n[i]===0))) b=n[i];
    else { out.push(a===b? hh(a) : hh(a)+"–"+hh(b)); if(i<n.length){a=n[i];b=n[i];} } }
  return out.join(", ");
}
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
    nota:"sem previsão carregada — secção 5 por preencher; a análise meteorológica desta proposta está em falta"
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
      const t=O.dados.topo||{orient:"",declive:"",obs:""}; const idx=["N","NE","E","SE","S","SO","O","NO"].indexOf(t.orient);
      if(idx<0) return null;
      const deg=idx*45;
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

