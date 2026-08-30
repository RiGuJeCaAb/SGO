/* ================= OPERAÇÕES · evolução e POSIT (art. 17.º, al. a)) ================= */
function addEvo(){
  const t=$("e-txt").value.trim(); if(!t) return;
  if(encerrada()){ aviso("msg-occ","err","O registo está encerrado. Reabrir antes de acrescentar evolução."); return; }
  if(!podeFazer("escrever")){ aviso("msg-occ","err",motivoPerfil("escrever")); return; }
  /* O GDH da evolução entrava como texto, sem ninguém o ler: «ABCD» era um GDH tão
     bom como outro qualquer, e a fita do tempo ficava com ele. */
  const q = gdhDoCampo("e-gdh", "msg-occ");
  if(!q.ok) return;
  O.evolucao.push({g:q.g, tipo:$("e-tipo").value, txt:t});
  $("e-txt").value=""; $("e-gdh").value="";
  fita("Evolução registada ("+O.evolucao[O.evolucao.length-1].tipo+")");
  try{ pintarDON(); }catch(e){}
  persistir(false);
}
/**
 * Os registos posteriores ao último PEA.
 *
 * A marca é o índice guardado no plano, e não uma comparação de horas: dois registos com
 * o mesmo GDH acontecem, e a hora não diz qual deles o plano já viu.
 */
function evoDesdeUltimoPEA(){
  const marca = O.peas.length? O.peas[O.peas.length-1].evoIdx : 0;
  return O.evolucao.slice(marca);
}


/* ██████ LOGÍSTICA ██████ */
