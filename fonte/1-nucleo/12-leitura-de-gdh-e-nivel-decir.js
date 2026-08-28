/* ================= NÚCLEO · leitura de GDH e nível DECIR ================= */
function parseGDH(s){
  if(!s) return null;
  const m = String(s).trim().toUpperCase().match(/^(\d{2})(\d{2})(\d{2})([A-Z]{3})(\d{2})$/);
  if(!m) return null;
  const mes = MES.indexOf(m[4]); if(mes<0) return null;
  const d = new Date(2000+ +m[5], mes, +m[1], +m[2], +m[3]);
  return isNaN(d.getTime())? null : d;
}
function nivelDECIR(d){
  d = d || new Date(agora());
  const md = (d.getMonth()+1)*100 + d.getDate();
  if(md>=701 && md<=930) return "DELTA";
  if((md>=601 && md<=630) || (md>=1001 && md<=1015)) return "CHARLIE";
  if((md>=515 && md<=531) || (md>=1016 && md<=1031)) return "BRAVO";
  return "ALFA";
}
/* contagem consolidada do dispositivo: aeronaves, máquinas de rasto, meios e operacionais */
