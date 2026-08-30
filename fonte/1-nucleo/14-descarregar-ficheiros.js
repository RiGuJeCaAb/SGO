/* ================= NÚCLEO · descarregar ficheiros ================= */
function descarregar(nome, texto, tipo){
  try{
    const b = new Blob([texto], {type:tipo||"application/json;charset=utf-8"});
    const u = URL.createObjectURL(b), a = document.createElement("a");
    a.href = u; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(u); a.remove(); }, 500);
  }catch(e){ aviso("msg-occ","err","Não foi possível exportar ("+e+")."); }
}
/** O instante no formato do nome dos ficheiros: AAAAMMDDHHMM, como manda a convenção. */
function carimboFich(){ const d=new Date(agora()), p=n=>String(n).padStart(2,"0");
  return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes()); }

