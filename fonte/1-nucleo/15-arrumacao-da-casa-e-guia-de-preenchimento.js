/* ================= NÚCLEO · arrumação da casa e guia de preenchimento ================= */

/**
 * Avalia uma condição de pendência que pode rebentar a meio.
 *
 * Falha **fechada**: o que não se conseguiu avaliar conta como por cumprir. Estava ao
 * contrário — um `catch` devolvia `true` — e a guia dava a pendência por satisfeita
 * exatamente quando não conseguia saber se estava. Num posto de comando é o sentido
 * errado do erro: o que se cala tem de ser o que falta, nunca o que já está feito.
 *
 * O motivo viaja em `erro` porque «falta preencher» e «não foi possível verificar» são
 * duas coisas diferentes, e a resposta de quem está ao teclado a cada uma também é: uma
 * pede um campo, a outra pede que se olhe para o que rebentou.
 */
function avaliarPendencia(fn){
  try{ return { ok: !!fn(), erro: "" }; }
  catch(e){ return { ok: false, erro: String((e && e.message) || e).slice(0,120) }; }
}

/**
 * O que falta preencher, campo a campo.
 *
 * `el` é o identificador de um elemento que vive **dentro do cartão a que a pendência diz
 * respeito**. Não se declara o cartão: descobre-se no DOM, por `closest(".card")`. A
 * diferença importa — um campo que mude de cartão leva a pendência com ele, e uma tabela
 * escrita à mão a dizer «este campo pertence àquele cartão» seria mais uma coisa a
 * desalinhar-se em silêncio.
 */
function pendencias(){
  const v = id => $(id).value.trim();
  /* As quatro pendências que se calculam a partir do estado, e não de um campo, avaliam-se
     por `avaliarPendencia` — que falha fechada. Ver o comentário dessa função. */
  const q = (c,p,ob,el,fn) => Object.assign({c:c, p:p, ob:ob, el:el}, avaliarPendencia(fn));
  return [
    {c:"N.º de ocorrência", ok:!!v("o-num"), p:"p-occ", ob:true, el:"o-num"},
    {c:"Local", ok:!!v("o-local"), p:"p-occ", ob:true, el:"o-local"},
    {c:"PCO", ok:!!v("o-pco"), p:"p-occ", ob:true, el:"o-pco"},
    {c:"Fase SGO", ok:!!v("o-fase"), p:"p-occ", ob:true, el:"o-fase"},
    {c:"Pasta de arquivo (localização)", ok:!!v("o-pasta"), p:"p-occ", ob:false, el:"o-pasta"},
    {c: COORD_APROX? "Coordenadas (origem estimada — confirmar)" : "Coordenadas (lat/lon)", ok:(!!v("o-lat")&&!!v("o-lon"))&&!COORD_APROX, p:"p-occ", ob:false, el:"o-lat"},
    {c:"Área ardida (ha)", ok:!!v("d-area"), p:"p-fontes", ob:true, el:"d-area"},
    {c:"Setores e meios", ok:!!v("d-setores"), p:"p-fontes", ob:true, el:"d-setores"},
    {c:"Pontos sensíveis", ok:!!v("d-sensiveis"), p:"p-fontes", ob:false, el:"d-sensiveis"},
    {c:"Início da ocorrência (GDH)", ok:!!v("o-inicio"), p:"p-occ", ob:false, el:"o-inicio"},
    q("Estrutura do PCO — funções exigíveis nomeadas", "p-pco", true, "pc-f",
      ()=>funcoesExigiveis().every(x=>x.preenchida)),
    q("Plano de comunicações — canal de comando", "p-pco", true, "br-gerar",
      ()=>!!canaisObj().cmd || !(estObj().setores||[]).length),
    q("Canais de manobra por setor", "p-pco", false, "br-gerar",
      ()=>(estObj().setores||[]).every(x=>!!x.siresp)),
    {c:"Meteograma analisado", ok:!!ANALISE, p:"p-meteo", ob:true, el:"m-horas"},
    q("Evolução registada desde o último PEA", "p-evo", false, "evo-ctx",
      ()=>O.peas.length===0 || evoDesdeUltimoPEA().length>0)
  ];
}
