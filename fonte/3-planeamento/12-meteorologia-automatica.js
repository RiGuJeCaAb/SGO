/* ================= PLANEAMENTO · meteorologia automática ================= */

/** Horas a partir das quais uma previsão deixa de servir para decidir. */
const METEO_VALIDADE_H = 3;

/** O ramo da proveniência da previsão, com omissão segura. */
function meteoObj(){
  if(!O.meteo || typeof O.meteo !== "object") O.meteo = /** @type {Estado["meteo"]} */ ({});
  return preencher(O.meteo, { fonte:"", modelo:"", g:"", ts:0, lat:"", lon:"", horas:0, sha:"", mexido:false });
}

/**
 * A idade da previsão em vigor, e o que ela vale.
 *
 * Uma previsão de ontem lê-se igual a uma de há dez minutos se ninguém disser a idade —
 * e num teatro de operações isso não é detalhe: a janela de consolidação, as horas
 * críticas e as rotações de vento decidem-se sobre ela.
 */
function idadeMeteo(){
  const M = meteoObj();
  if(!M.ts) return null;
  const h = (agora() - M.ts)/3600000;
  return { h, velha: h >= METEO_VALIDADE_H, rot: fmtH(h) };
}

/** Escreve a linha da proveniência por baixo dos botões. Sem previsão, cala-se. */
function pintarMeteoIdade(){
  const el = $("meteo-idade"); if(!el) return;
  const M = meteoObj(), i = idadeMeteo();
  if(!i){ el.textContent = ""; return; }
  el.textContent = "Última previsão: " + (M.fonte||"origem por indicar")
    + (M.modelo? " ("+M.modelo+")" : "")
    + ", obtida há " + i.rot + " — " + M.g
    + (M.lat? " · ponto "+M.lat+", "+M.lon : "")
    + (M.horas? " · "+M.horas+" h" : "")
    + (M.mexido? " · SÉRIE ALTERADA À MÃO depois de obtida" : "")
    + (i.velha? " · DESATUALIZADA: passaram mais de "+METEO_VALIDADE_H+" h" : "");
  el.style.color = (i.velha || M.mexido)? "var(--terra)" : "";
  el.style.fontWeight = (i.velha || M.mexido)? "700" : "";
}

/** Regista de onde veio a série que está no ecrã. */
function marcarMeteo(fonte, modelo, lat, lon, horas){
  const M = meteoObj();
  M.fonte = fonte; M.modelo = modelo || "";
  M.g = gdhAgora(); M.ts = agora();
  M.lat = lat==null? "" : String(lat); M.lon = lon==null? "" : String(lon);
  M.horas = horas || 0; M.mexido = false;
  /* O resumo da série como chegou. É com ele que se sabe, mais tarde, se alguém lhe
     mexeu à mão antes de a analisar — sem guardar uma segunda cópia do CSV. */
  M.sha = sha256($("f-csv").value);
  try{ pintarMeteoIdade(); }catch(e){}
}

/**
 * Uma hora do Open-Meteo, em instante e em relógio de parede de Lisboa.
 *
 * Chega um epoch em segundos, **sempre em UTC** — é o que `timeformat=unixtime` garante,
 * e é por isso que se pede. O fuso da resposta vem à parte, em `utc_offset_seconds`, e é
 * o do `timezone` pedido, já com a hora de verão do dia em causa resolvida pelo serviço.
 *
 * A data e a hora de parede obtêm-se a somar o desvio e a ler em UTC. Ler em local seria
 * ler no fuso do equipamento, que é precisamente o que se está a evitar — e o equipamento
 * de um PCO tanto pode estar em Lisboa como com o relógio trocado.
 *
 * Sem `utc_offset_seconds` a resposta não é a que se pediu, e rebenta: melhor ficar com a
 * previsão anterior, com a idade à vista, do que com horas em que ninguém sabe se pode
 * confiar.
 *
 * @param {number} seg epoch em segundos, UTC
 * @param {number} desvio segundos de desvio do fuso pedido face a UTC
 * @returns {{ts:number, data:string, hora:number}}
 */
function lerHoraOpenMeteo(seg, desvio){
  if(!isFinite(seg)) throw "hora sem valor numérico na resposta";
  if(typeof desvio !== "number" || !isFinite(desvio)) throw "resposta sem utc_offset_seconds";
  const ts = seg*1000;
  const p = new Date(ts + desvio*1000);
  return { ts: ts,
    data: String(p.getUTCDate()).padStart(2,"0")+"/"+String(p.getUTCMonth()+1).padStart(2,"0")+"/"+p.getUTCFullYear(),
    hora: p.getUTCHours() };
}

/**
 * Vai buscar a previsão para o ponto da ocorrência, e regista de onde veio.
 *
 * A proveniência fica gravada — serviço, modelo, hora, ponto — porque uma previsão sem
 * origem nem idade é um número que ninguém pode pesar. Com ela, a aplicação diz quando a
 * previsão está velha de mais para sustentar o plano.
 */
async function meteoAutomatica(){
  const c0 = coordenadaDoFormulario(), lat = c0? c0.lat : NaN, lon = c0? c0.lon : NaN;
  if(Number.isNaN(lat)||Number.isNaN(lon)){
    $("meteo-info").textContent = "Sem coordenadas na ocorrência — preenche-as em Comando (a app leva-te lá).";
    irPara("p-occ"); return;
  }
  const btn = $("b-auto"); btn.disabled=true; const rot=btn.textContent; btn.innerHTML='<span class="spin"></span> A obter previsão...';
  try{
    /* `timeformat=unixtime`, e não o ISO por omissão. Com `timezone=Europe/Lisbon` a
       resposta trazia horas como `"2026-09-04T18:00"`, **sem designador de fuso**, e
       `new Date` de uma cadeia dessas lê-a no fuso do equipamento. O rótulo até saía
       certo — `getHours()` desfazia o que a leitura tinha feito —, mas o *instante* saía
       errado pelo desvio do fuso, e é o instante que decide, no filtro abaixo, que horas
       já passaram. Num tablet com o relógio noutro fuso o meteograma começava horas ao
       lado. O epoch não tem essa ambiguidade: é sempre UTC. */
    const url = "https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+
      "&hourly=temperature_2m,relative_humidity_2m,wind_direction_10m,wind_speed_10m,precipitation"+
      "&timezone=Europe%2FLisbon&timeformat=unixtime&forecast_days=3&wind_speed_unit=kmh";
    const r = await fetchT(url, {}, 9000);
    if(!r.ok) throw "HTTP "+r.status;
    const d = await r.json();
    const H = d.hourly, limite = agora()-3600000;
    const linhas = ["HOURLY,HOUR,TEMP,RH,WD,WS,PRECIP"];
    let n=0;
    for(let i=0;i<H.time.length && n<36;i++){
      const t = lerHoraOpenMeteo(H.time[i], d.utc_offset_seconds);
      if(t.ts < limite) continue;
      linhas.push([t.data, t.hora, H.temperature_2m[i], H.relative_humidity_2m[i],
        String(Math.round(H.wind_direction_10m[i])).padStart(3,"0"), Math.round(H.wind_speed_10m[i]*10)/10,
        H.precipitation[i]].join(","));
      n++;
    }
    if(n<3) throw "resposta sem horas suficientes";
    $("f-csv").value = linhas.join("\n");
    $("meteo-info").textContent = "Previsão obtida: Open-Meteo, ponto "+lat.toFixed(4)+", "+lon.toFixed(4)+", "+n+" horas ("+gdhAgora()+"). Análise executada.";
    fita("Meteograma automático obtido (Open-Meteo, "+n+" h, ponto "+lat.toFixed(4)+", "+lon.toFixed(4)+")");
    marcarMeteo("Open-Meteo", "síntese ECMWF/ICON/GFS", lat.toFixed(4), lon.toFixed(4), n);
    analisarCSV(true);
    obterAvisos(true);
  }catch(e){
    /* Sem rede, a previsão que já cá está continua a servir — e o que interessa dizer é
       a idade dela, não que a rede falhou. Um meteograma vazio num TO é pior do que um
       meteograma velho, desde que se saiba que é velho. */
    const i = idadeMeteo();
    $("meteo-info").textContent = "Previsão automática indisponível: "+motivoRede(e)
      + (i? " — mantém-se a última obtida, de há "+i.rot+" ("+meteoObj().g+")."
             + (i.velha? " ATENÇÃO: passaram mais de "+METEO_VALIDADE_H+" h; confirma antes de decidir sobre ela." : "")
          : " — usa o ficheiro CSV ou cola do SpotWX.");
    if(i){
      fita("Previsão automática indisponível ("+motivoRede(e)+"); mantida a de "+meteoObj().g+", com "+i.rot);
      /* A série pode ter-se perdido do ecrã sem se ter perdido do estado. */
      if(!$("f-csv").value.trim() && O.csv){ $("f-csv").value = O.csv; }
      try{ analisarCSV(false); }catch(err){}
    }
  }
  try{ pintarMeteoIdade(); }catch(err){}
  btn.disabled=false; btn.textContent=rot;
}
$("b-auto").addEventListener("click", meteoAutomatica);
$("f-csvfile").addEventListener("change", e=>{
  const f=e.target.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload=()=>{ $("f-csv").value=String(rd.result).trim();
    $("meteo-info").textContent="Ficheiro carregado: "+f.name+". Análise executada.";
    fita("Meteograma carregado de ficheiro: "+f.name);
    marcarMeteo("ficheiro "+f.name, "", $("o-lat").value, $("o-lon").value, 0);
    analisarCSV(true); };
  rd.readAsText(f);
});

