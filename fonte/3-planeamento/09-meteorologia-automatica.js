/* ================= PLANEAMENTO · meteorologia automática ================= */
async function meteoAutomatica(){
  const lat = parseFloat($("o-lat").value.replace(",",".")), lon = parseFloat($("o-lon").value.replace(",","."));
  if(Number.isNaN(lat)||Number.isNaN(lon)){
    $("meteo-info").textContent = "Sem coordenadas na ocorrência — preenche-as em Comando (a app leva-te lá).";
    irPara("p-occ"); return;
  }
  const btn = $("b-auto"); btn.disabled=true; const rot=btn.textContent; btn.innerHTML='<span class="spin"></span> A obter previsão...';
  try{
    const url = "https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+
      "&hourly=temperature_2m,relative_humidity_2m,wind_direction_10m,wind_speed_10m,precipitation"+
      "&timezone=Europe%2FLisbon&forecast_days=3&wind_speed_unit=kmh";
    const r = await fetchT(url, {}, 9000);
    if(!r.ok) throw "HTTP "+r.status;
    const d = await r.json();
    const H = d.hourly, agora = Date.now()-3600000;
    const linhas = ["HOURLY,HOUR,TEMP,RH,WD,WS,PRECIP"];
    let n=0;
    for(let i=0;i<H.time.length && n<36;i++){
      const t = new Date(H.time[i]);
      if(t.getTime() < agora) continue;
      const dd = String(t.getDate()).padStart(2,"0")+"/"+String(t.getMonth()+1).padStart(2,"0")+"/"+t.getFullYear();
      linhas.push([dd, t.getHours(), H.temperature_2m[i], H.relative_humidity_2m[i],
        String(Math.round(H.wind_direction_10m[i])).padStart(3,"0"), Math.round(H.wind_speed_10m[i]*10)/10,
        H.precipitation[i]].join(","));
      n++;
    }
    if(n<3) throw "resposta sem horas suficientes";
    $("f-csv").value = linhas.join("\n");
    $("meteo-info").textContent = "Previsão obtida: Open-Meteo, ponto "+lat.toFixed(4)+", "+lon.toFixed(4)+", "+n+" horas ("+gdhAgora()+"). Análise executada.";
    fita("Meteograma automático obtido (Open-Meteo, "+n+" h, ponto "+lat.toFixed(4)+", "+lon.toFixed(4)+")");
    analisarCSV(true);
    obterAvisos(true);
  }catch(e){
    $("meteo-info").textContent = "Previsão automática indisponível: "+motivoRede(e)+" — usa o ficheiro CSV ou cola do SpotWX.";
  }
  btn.disabled=false; btn.textContent=rot;
}
$("b-auto").addEventListener("click", meteoAutomatica);
$("f-csvfile").addEventListener("change", e=>{
  const f=e.target.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload=()=>{ $("f-csv").value=String(rd.result).trim();
    $("meteo-info").textContent="Ficheiro carregado: "+f.name+". Análise executada.";
    fita("Meteograma carregado de ficheiro: "+f.name);
    analisarCSV(true); };
  rd.readAsText(f);
});

