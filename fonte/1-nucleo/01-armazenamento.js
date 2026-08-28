/* ================= NÚCLEO · armazenamento ================= */
const ARMAZEM = (()=>{
  if (typeof window!=="undefined" && window.storage && typeof window.storage.set==="function"){
    return { modo:"claude",
      get:k=>window.storage.get(k),
      set:(k,v)=>window.storage.set(k,v),
      del:k=>window.storage.delete(k) };
  }
  try{
    localStorage.setItem("__t","1"); localStorage.removeItem("__t");
    return { modo:"browser",
      get:async k=>{ const v=localStorage.getItem(k); if(v===null) throw "sem chave"; return {key:k,value:v}; },
      set:async (k,v)=>{ localStorage.setItem(k,v); return {key:k,value:v}; },
      del:async k=>{ localStorage.removeItem(k); return {key:k,deleted:true}; } };
  }catch(e){}
  const M={};
  return { modo:"sessao",
    get:async k=>{ if(!(k in M)) throw "sem chave"; return {key:k,value:M[k]}; },
    set:async (k,v)=>{ M[k]=v; return {key:k,value:v}; },
    del:async k=>{ delete M[k]; return {key:k,deleted:true}; } };
})();

