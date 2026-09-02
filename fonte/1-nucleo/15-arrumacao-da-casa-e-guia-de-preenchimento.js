/* ================= NÚCLEO · arrumação da casa e guia de preenchimento ================= */

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
    {c:"Estrutura do PCO — funções exigíveis nomeadas", ok:(()=>{ try{ return funcoesExigiveis().every(x=>x.preenchida); }catch(e){ return true; } })(), p:"p-pco", ob:true, el:"pc-f"},
    {c:"Plano de comunicações — canal de comando", ok:(()=>{ try{ return !!canaisObj().cmd || !(estObj().setores||[]).length; }catch(e){ return true; } })(), p:"p-pco", ob:true, el:"br-gerar"},
    {c:"Canais de manobra por setor", ok:(()=>{ try{ return (estObj().setores||[]).every(x=>!!x.siresp); }catch(e){ return true; } })(), p:"p-pco", ob:false, el:"br-gerar"},
    {c:"Meteograma analisado", ok:!!ANALISE, p:"p-meteo", ob:true, el:"m-horas"},
    {c:"Evolução registada desde o último PEA", ok:O.peas.length===0||evoDesdeUltimoPEA().length>0, p:"p-evo", ob:false, el:"evo-ctx"}
  ];
}
