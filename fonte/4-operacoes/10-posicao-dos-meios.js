/* ================= OPERAÇÕES · posição dos meios =================
   Na carta anotada de Cabeça Boa os meios estão desenhados **onde estão**: GRIR Guarda,
   GRUATA BSE, CATE Viseu, UEPS. No dispositivo desta aplicação já lá estavam — cada unidade
   é um item com tipologia, entidade e hora de empenhamento — mas sem coordenada.

   Por isso aqui **não se cria um segundo inventário**. Dar posição a um meio é acrescentar
   coordenada ao que já está contado, e não registá-lo outra vez noutro sítio: um dispositivo
   contado em dois sítios acaba a contar dois números diferentes, e a fase do SGO depende
   dessa contagem.

   O que a posição destrava é a pergunta que a carta anotada responde de relance e a
   aplicação ainda não respondia: **quem é que fica do lado errado da frente.** */

/**
 * Todas as unidades do dispositivo, achatadas, com o setor a que pertencem.
 *
 * O `id` é o da própria unidade e não a sua posição na lista: as unidades mudam de setor, e
 * um identificador que fosse «terceira do setor Alfa» apontava para outra unidade assim que
 * alguém movesse a primeira.
 */
function meiosDoDispositivo(){
  const out = [];
  (estObj().setores||[]).forEach((s,i)=>{
    (s.tip||[]).forEach(it=>out.push({ it, setor:i, nome:nomeDoMeio(it) }));
  });
  return out;
}

/**
 * O nome por que uma unidade se conhece no teatro.
 *
 * É a tipologia com a entidade, que é como aparece na carta anotada e como se diz na
 * rádio: «GRIR Guarda», «CATE Viseu». Sem entidade fica a tipologia sozinha, que é o que
 * há.
 */
function nomeDoMeio(it){
  return String(it && it.t || "") + (it && it.ent? " " + it.ent : "");
}

/** A unidade com este identificador, com o setor onde está, ou nada. */
function meioPorId(id){
  return meiosDoDispositivo().find(m=>m.it.id === id) || null;
}

/**
 * Dá coordenada a uma unidade do dispositivo.
 *
 * Regista **quando** e **por quem** foi posicionada, como tudo o resto: uma posição de há
 * seis horas não vale o mesmo que uma de há dez minutos, e quem lê tem de o poder saber.
 */
function posicionarMeio(id, lat, lon){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de posicionar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const m = meioPorId(id);
  if(!m) return { ok:false, motivo:"Meio não encontrado no dispositivo." };
  if(!Number.isFinite(lat) || !Number.isFinite(lon)) return { ok:false, motivo:"Coordenada inválida." };
  m.it.lat = +lat.toFixed(6); m.it.lon = +lon.toFixed(6);
  m.it.posG = gdhAgora(); m.it.posPor = quemRegista();
  O.evolucao.push({ g:m.it.posG, tipo:"posit",
    txt:m.nome+" posicionado no Setor "+NOMES_SETOR[m.setor]+": "+fmtDec(m.it.lat, m.it.lon)+"." });
  fita(m.nome+" posicionado: "+fmtDec(m.it.lat, m.it.lon));
  return { ok:true, meio:m.it };
}

/** Retira a posição de uma unidade, sem a retirar do dispositivo. */
function despositionarMeio(id){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de alterar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const m = meioPorId(id);
  if(!m || !Number.isFinite(m.it.lat)) return { ok:false, motivo:"Esse meio não tem posição." };
  m.it.lat = null; m.it.lon = null; m.it.posG = ""; m.it.posPor = "";
  fita("Retirada a posição de "+m.nome);
  return { ok:true };
}

/** As unidades que têm coordenada. */
function meiosPosicionados(){
  return meiosDoDispositivo().filter(m=>Number.isFinite(m.it.lat) && Number.isFinite(m.it.lon));
}

/**
 * Quanto do dispositivo está localizado.
 *
 * **Não é estatística: é a medida da confiança que se pode ter na leitura.** Uma leitura
 * que diga «nenhum meio no corredor da frente» com três meios posicionados em vinte diz
 * muito menos do que parece, e é isso que este número deixa ver.
 */
function contagemPosicionados(){
  const t = meiosDoDispositivo().length;
  return { total:t, postos:meiosPosicionados().length };
}
