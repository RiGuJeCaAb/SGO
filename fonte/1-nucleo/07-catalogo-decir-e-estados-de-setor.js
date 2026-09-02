/* ================= NÚCLEO · catálogo DECIR e estados de setor ================= */
const NOMES_SETOR = ["Alfa","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India","Juliett","Kilo","Lima"];
const ESTADOS_SETOR = ["Em curso (ativo)","Em resolução (dominado)","Em conclusão (extinto)","Vigilância ativa e consolidação de rescaldo","Reativação"];
/* Migração de estados antigos para a nomenclatura oficial da DON n.º 2 / DECIR 2026, ponto 7.f */
const MAPA_ESTADOS = {"Frente ativa":"Em curso (ativo)","Em consolidação":"Em resolução (dominado)","Rescaldo":"Em conclusão (extinto)","Vigilância ativa":"Vigilância ativa e consolidação de rescaldo"};
/**
 * Traduz um estado de setor antigo para o vocabulário em vigor.
 *
 * O que não estiver no mapa nem no vocabulário volta ao primeiro estado — não se inventa
 * um estado a partir de texto que não se reconhece, e ficar em branco seria pior: um setor
 * sem estado não conta para a fase nem para as regras de conformidade.
 */
function migrarEstado(v){ return MAPA_ESTADOS[v] || (ESTADOS_SETOR.includes(v)? v : ESTADOS_SETOR[0]); }

/**
 * As fases do SGO, com a referência de efetivo de cada uma — Despacho n.º 4067/2024,
 * art. 39.º e Anexo I. `ate` é o topo do efetivo que a fase comporta.
 *
 * Declarada num sítio só, porque duas partes da aplicação a leem e não podem discordar:
 * a sugestão a partir do dispositivo, e a regra de conformidade que compara o efetivo
 * registado com a fase declarada.
 */
const FASES_SGO = [
  { k:"I",   ate:36,  d:"até 36 operacionais (1.ª intervenção)" },
  { k:"II",  ate:40,  d:"reforço de 36 operacionais (32–40) · até 3 setores" },
  { k:"III", ate:119, d:"reforço de 108 operacionais (97–119) · até 6 setores" },
  { k:"IV",  ate:356, d:"reforço de 324 operacionais (292–356) · até 2 frentes" },
  { k:"V",   ate:713, d:"reforço de 648 operacionais (583–713) · até 4 frentes" },
  { k:"VI",  ate:Infinity, d:"decisão do CNEPC · áreas de intervenção municipal" },
];
/** A fase que o efetivo registado pede. */
function faseParaEfetivo(op){
  const f = FASES_SGO.find(x=>op <= x.ate);
  return (f || FASES_SGO[FASES_SGO.length-1]).k;
}
/**
 * O efetivo no TO excede a referência da fase declarada?
 *
 * **Não é um limiar de bloqueio, e o art. 39.º, n.º 3 é a razão:** a passagem de fase pode
 * ser determinada independentemente do número de operacionais empenhados. Isto é um sinal,
 * não uma barreira — e é o mesmo sinal em dois sítios, que é por isso que vive aqui e não
 * em cada um deles. A regra de conformidade da fase usa-o para avisar; a lista de nomeação
 * usa-o para sugerir o núcleo de especialistas, cuja ativação a DON n.º 2 liga ao aumento
 * da capacidade de comando e controlo — pontos 7.d.(25)(d) e 7.d.(27) — e não a uma fase.
 *
 * Falso quando não há fase declarada: sem fase não há referência que se possa exceder.
 */
function excedeReferenciaDaFase(){
  const lim = (FASES_SGO.find(f=>f.k === (O.meta.fase||""))||{}).ate;
  return !!lim && isFinite(lim) && contarDispositivo().op > lim;
}
/** Posição de uma fase na escala, para se poderem comparar. -1 se não for fase nenhuma. */
function ordemFase(k){ return FASES_SGO.findIndex(x=>x.k === k); }
