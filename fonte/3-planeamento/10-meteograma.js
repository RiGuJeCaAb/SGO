/* ================= PLANEAMENTO · meteograma ================= */
function svgMeteo(S, a){
  const n = S.length; if(n<2) return "";
  const W = 1240, ml = 56, mr = 56;
  const top1 = 26, hTR = 200;                      // painel T + HR
  const top2 = top1 + hTR + 60;                    // painel vento: título
  const dirY = top2 + 18;                          // faixa de setas
  const cardY = top2 + 42;                         // rumos cardinais
  const wTop = top2 + 56, hW = 104;                // área da curva de vento
  const rotY = wTop + hW + 18;                     // marcas ROT
  const top3 = rotY + 68;                          // painel precipitação
  const hP = 96;
  const H = top3 + hP + 44;
  const x = i => ml + (W-ml-mr)*i/(n-1);
  const step = (W-ml-mr)/(n-1);
  const yR = v => top1 + (100-v)/100*hTR;
  const tmin = Math.floor(Math.min(...S.map(p=>p.t))-1), tmax = Math.ceil(Math.max(...S.map(p=>p.t))+1);
  const yT = v => top1 + (tmax-v)/Math.max(1,(tmax-tmin))*hTR;
  const wmax = Math.max(10, Math.ceil(Math.max(...S.map(p=>p.ws))/5)*5);
  const yW = v => wTop + (wmax-v)/wmax*hW;
  const pmax = Math.max(1, Math.ceil(Math.max(...S.map(p=>p.pr||0))*10)/10);
  const yP = v => top3 + (pmax-v)/pmax*hP;
  const o = [];
  o.push('<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="font-family:JetBrains Mono,monospace" role="img" aria-label="Meteograma">');
  const caixa=(y,h)=>o.push('<rect x="6" y="'+y+'" width="'+(W-12)+'" height="'+h+'" rx="10" fill="var(--surf2)" opacity="0.45" stroke="var(--line)"/>');
  caixa(top1-26, hTR+44);
  caixa(top2-14, (rotY+14)-(top2-14));
  caixa(top3-26, hP+52);
  const txt=(x,y,t,anc,sz,cor,extra)=>o.push('<text x="'+x+'" y="'+y+'" text-anchor="'+(anc||"middle")+'" font-size="'+(sz||10)+'" fill="'+(cor||"var(--tx2)")+'"'+(extra||"")+'>'+t+'</text>');
  const linha=(x1,y1,x2,y2,cor,w,dash)=>o.push('<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+cor+'" stroke-width="'+(w||1)+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>');

  /* sombreados no painel T/HR */
  let i0=null;
  for(let i=0;i<=n;i++){ const ok = i<n && S[i].rh>=50;
    if(ok && i0===null) i0=i;
    if(!ok && i0!==null){ o.push('<rect x="'+(x(i0)-step/2)+'" y="'+top1+'" width="'+(x(i-1)-x(i0)+step)+'" height="'+hTR+'" fill="var(--madeira)" opacity="0.10"/>'); i0=null; } }
  i0=null;
  for(let i=0;i<=n;i++){ const cr = i<n && S[i].rh<30;
    if(cr && i0===null) i0=i;
    if(!cr && i0!==null){ o.push('<rect x="'+(x(i0)-step/2)+'" y="'+top1+'" width="'+(x(i-1)-x(i0)+step)+'" height="'+hTR+'" fill="var(--fogo)" opacity="0.10"/>'); i0=null; } }
  /* grelha, limiares e eixos T/HR */
  [0,25,50,75,100].forEach(v=>{ linha(ml, yR(v), W-mr, yR(v), "var(--line)", .6); txt(ml-8, yR(v)+3, v, "end", 9.5); });
  linha(ml, yR(30), W-mr, yR(30), "var(--fogo)", 1, "5 4"); txt(ml-8, yR(30)+3, "30", "end", 9.5, "var(--fogo)");
  linha(ml, yR(50), W-mr, yR(50), "var(--madeira)", 1, "5 4");
  txt(ml-34, top1-10, "HR %", "start", 10.5, "var(--madeira)", ' font-weight="600"');
  txt(W-mr+34, top1-10, "T °C", "end", 10.5, "var(--laranja)", ' font-weight="600"');
  [tmin, Math.round((tmin+tmax)/2), tmax].forEach(v=>txt(W-mr+8, yT(v)+3, v, "start", 9.5, "var(--laranja)"));
  /* separadores de dia */
  let dAnt = S[0].d;
  for(let i=1;i<n;i++){ if(S[i].d!==dAnt){ dAnt=S[i].d;
    linha(x(i)-step/2, top1-14, x(i)-step/2, top3+hP, "var(--tx3)", 1, "3 4");
    txt(x(i)-step/2+4, top1-4, esc(dAnt.slice(0,5)), "start", 10, "var(--tx)", ' font-weight="600"'); } }
  txt(ml, top1-4, esc(S[0].d.slice(0,5)), "start", 10, "var(--tx)", ' font-weight="600"');
  /* curvas HR e T */
  const ptsR = S.map((p,i)=>x(i)+","+yR(p.rh)).join(" ");
  o.push('<polygon points="'+ml+','+yR(0)+' '+ptsR+' '+x(n-1)+','+yR(0)+'" fill="var(--madeira)" opacity="0.13"/>');
  o.push('<polyline points="'+ptsR+'" fill="none" stroke="var(--madeira)" stroke-width="2.4"/>');
  o.push('<polyline points="'+S.map((p,i)=>x(i)+","+yT(p.t)).join(" ")+'" fill="none" stroke="var(--laranja)" stroke-width="2.4"/>');

  /* painel vento: faixa de direção (seta + rumo) separada da curva */
  txt(ml-34, top2, "VENTO — rumo (de onde sopra) e escoamento", "start", 10.5, "var(--agua)", ' font-weight="600"');
  const passoSeta = n>26 ? 2 : 1;
  for(let i=0;i<n;i+=passoSeta){
    const ang = (S[i].wd+180)%360;
    o.push('<g transform="translate('+x(i)+','+dirY+') rotate('+ang+')" stroke="var(--agua)" stroke-width="1.6" fill="none">'+
      '<line y1="7" y2="-7"/><path d="M0,-7 l-3.4,4.4 M0,-7 l3.4,4.4"/></g>');
    txt(x(i), cardY, card(S[i].wd), "middle", 9.5, "var(--agua)", ' font-weight="600"');
  }
  [0, wmax/2, wmax].forEach(v=>{ linha(ml, yW(v), W-mr, yW(v), "var(--line)", .6); txt(ml-8, yW(v)+3, Math.round(v), "end", 9.5); });
  txt(ml-34, wTop-6, "km/h", "start", 9.5, "var(--agua)");
  o.push('<polyline points="'+S.map((p,i)=>x(i)+","+yW(p.ws)).join(" ")+'" fill="none" stroke="var(--agua)" stroke-width="2.2"/>');
  a.rot.forEach(r=>{ const i=S.indexOf(r.p); if(i>=0) txt(x(i), rotY, "ROT "+r.de+"\u2192"+r.para, "middle", 9.5, "var(--terra)", ' font-weight="700"'); });

  /* painel precipitação */
  txt(ml-34, top3-10, "PRECIPITAÇÃO mm", "start", 10.5, "#3E7CB1", ' font-weight="600"');
  [0,pmax].forEach(v=>{ linha(ml, yP(v), W-mr, yP(v), "var(--line)", .6); txt(ml-8, yP(v)+3, v, "end", 9.5); });
  S.forEach((p,i)=>{ if((p.pr||0)>0){
    o.push('<rect x="'+(x(i)-step*0.28)+'" y="'+yP(p.pr)+'" width="'+(step*0.56)+'" height="'+(yP(0)-yP(p.pr))+'" fill="#3E7CB1" opacity="0.85"/>');
    txt(x(i), yP(p.pr)-4, "CONV", "middle", 8.5, "var(--fogo)", ' font-weight="700"');
  }});
  const passoH = n>26 ? 3 : 2;
  for(let i=0;i<n;i+=passoH){ txt(x(i), top3+hP+18, hh(S[i].h), "middle", 10); }
  /* leitura ponto-a-ponto */
  S.forEach((p,i)=>{ const li = leitura(p,a);
    o.push('<rect x="'+(x(i)-step/2)+'" y="'+(top1-14)+'" width="'+step+'" height="'+(top3+hP-top1+14)+'" fill="transparent"><title>'+
    esc(p.d)+' '+hh(p.h)+' — T '+p.t+' °C · HR '+p.rh+' % · '+card(p.wd)+' ('+String(Math.round(p.wd)).padStart(3,"0")+'°) '+p.ws+' km/h · '+(p.pr||0)+' mm'+(li? ' — '+esc(li) : '')+'</title></rect>'); });
  o.push('</svg>');
  return o.join("");
}

/** Desenha o meteograma e o quadro de métricas a partir da série analisada. */
function pintarAnalise(){
  const a=ANALISE, S=SERIE;
  $("strip").innerHTML = svgMeteo(S, a);
  const m=metricas();
  $("metrics").innerHTML=`
    <div class="m"><div class="k">Janela</div><div class="v ${m.janela?'c-verde':'c-verm'}">${m.janela?m.janela.inicio+"–"+m.janela.fim:"—"}</div><div class="s">${m.janela?'HR '+m.janela.hr_inicio+' % → '+m.janela.hr_max+' %':'sem HR ≥ 50 %'}</div></div>
    <div class="m"><div class="k">HR mínima</div><div class="v c-verm">${m.hr_min.v} %</div><div class="s">${m.hr_min.h} · ${m.hr_min.d}</div></div>
    <div class="m"><div class="k">T máxima</div><div class="v c-lar">${m.t_max.v} °C</div><div class="s">${m.t_max.h} · ${m.t_max.d}</div></div>
    <div class="m"><div class="k">Rotações</div><div class="v c-am">${m.rotacoes.length}</div><div class="s">${m.rotacoes.map(r=>r.h+" "+r.de+"→"+r.para).join(" · ")||"—"}</div></div>
    ${m.alinhamento_relevo_vento===null? "" : `<div class="m"><div class="k">Alinhamento relevo×vento</div><div class="v ${m.alinhamento_relevo_vento.criticas.length? "c-verm" : (m.alinhamento_relevo_vento.horas.length? "c-am":"c-verde")}">${m.alinhamento_relevo_vento.horas.length? m.alinhamento_relevo_vento.horas.length+" h":"nulo"}</div><div class="s">${m.alinhamento_relevo_vento.horas.length? "encostas "+m.alinhamento_relevo_vento.orient+" · "+resumoHoras(m.alinhamento_relevo_vento.horas)+(m.alinhamento_relevo_vento.criticas.length? " · CRÍTICO "+resumoHoras(m.alinhamento_relevo_vento.criticas):"") : "sem escoamento a subir as encostas "+m.alinhamento_relevo_vento.orient}</div></div>`}
    <div class="m"><div class="k">Vento máximo</div><div class="v">${m.vento_max.v} km/h</div><div class="s">${m.vento_max.h} · de ${m.vento_max.rumo}</div></div>
    <div class="m"><div class="k">Precipitação total</div><div class="v ${m.precip_total>0?'c-verde':''}">${m.precip_total} mm</div><div class="s">no horizonte analisado</div></div>
    <div class="m"><div class="k">Convectivo</div><div class="v ${m.convectivo.length?'c-verm':'c-verde'}">${m.convectivo.length?"SIM":"não"}</div><div class="s">${m.convectivo.map(c=>c.h+" ("+c.mm+" mm)").join(" · ")||"sem precipitação"}</div></div>`;
  $("c-analise").querySelector("h2 .tag").textContent = "núcleo de antecipação (art. 29.º) — próximas "+SERIE.length+" h, calculada por código";
  $("c-analise").style.display="block";
}
/**
 * Analisa o que está no campo do CSV e guarda a série na ocorrência.
 *
 * @param {boolean} [log] deixar rasto na fita do tempo; falso ao repor uma ocorrência,
 *   que não é facto operacional novo
 */
function analisarCSV(log=true){
  try{
    const bruto = parseCSV($("f-csv").value);
    const N = +($("m-horas").value||24);
    SERIE = bruto.slice(0, N); ANALISE = analisar(SERIE);
    O.csv=$("f-csv").value;
    /* O CSV é editável antes de analisar, e isso é para se poder corrigir um erro de
       importação. Mas uma série alterada à mão não é a que a fonte deu, e a análise que
       sai dela também não: fica dito, aqui e na linha da proveniência. */
    try{
      const M = meteoObj();
      if(M.sha && !M.mexido && sha256(O.csv) !== M.sha){
        M.mexido = true;
        fita("Série meteorológica alterada à mão depois de obtida ("+M.fonte+", "+M.g+")");
      }
      pintarMeteoIdade();
    }catch(e){}
    pintarAnalise(); $("msg-csv").style.display="none";
    if(log){ fita("Meteograma analisado ("+SERIE.length+" h; janela "+(ANALISE.jan?hh(ANALISE.jan.i.h)+"–"+hh(ANALISE.jan.f.h+1):"inexistente")+")"); persistir(false); }
  }catch(e){ $("msg-csv").className="msg err"; $("msg-csv").textContent="Não foi possível analisar: "+e; $("msg-csv").style.display="block"; }
}

