/* ================= NÚCLEO · catálogo DECIR e estados de setor ================= */
const NOMES_SETOR = ["Alfa","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India","Juliett","Kilo","Lima"];
const ESTADOS_SETOR = ["Em curso (ativo)","Em resolução (dominado)","Em conclusão (extinto)","Vigilância ativa e consolidação de rescaldo","Reativação"];
/* Migração de estados antigos para a nomenclatura oficial da DON n.º 2 / DECIR 2026, ponto 7.f */
const MAPA_ESTADOS = {"Frente ativa":"Em curso (ativo)","Em consolidação":"Em resolução (dominado)","Rescaldo":"Em conclusão (extinto)","Vigilância ativa":"Vigilância ativa e consolidação de rescaldo"};
function migrarEstado(v){ return MAPA_ESTADOS[v] || (ESTADOS_SETOR.includes(v)? v : ESTADOS_SETOR[0]); }
