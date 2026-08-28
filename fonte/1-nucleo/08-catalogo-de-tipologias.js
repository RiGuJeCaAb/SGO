/* ================= catálogo de tipologias — DON n.º 2 / DECIR 2026, Anexo 1 =================
   mu: veículos/meios técnicos por unidade | ou: operacionais por unidade
   mr: máquinas de rasto incluídas | ar: meio aéreo | v: constituição variável | c: composição (DON) */
const CATALOGO = [
  /* --- Equipas dos Corpos de Bombeiros --- */
  {g:"Equipas — Corpos de Bombeiros", t:"EIP", mu:1, ou:5, c:"1 VCI + 5 bombeiros"},
  {g:"Equipas — Corpos de Bombeiros", t:"ECIN", mu:1, ou:5, c:"1 VCI + 5 bombeiros"},
  {g:"Equipas — Corpos de Bombeiros", t:"ECIN R", mu:1, ou:5, c:"1 VCI + 5 bombeiros (reforço de outro CB)"},
  {g:"Equipas — Corpos de Bombeiros", t:"ELAC", mu:1, ou:2, c:"1 meio técnico de apoio logístico + 2 ou 3 bombeiros"},
  {g:"Equipas — Corpos de Bombeiros", t:"ELAC R", mu:1, ou:2, c:"1 meio técnico de apoio logístico + 2 ou 3 bombeiros (reforço)"},
  {g:"Equipas — Corpos de Bombeiros", t:"EMR (CB)", mu:3, ou:4, mr:1, c:"1 MR + 1 porta-máquinas + 1 veículo de apoio; chefe, operador e 2 condutores"},
  {g:"Equipas — Corpos de Bombeiros", t:"ERAS", mu:1, ou:2, c:"2 elementos para avaliação e apoio operacional"},
  {g:"Equipas — Corpos de Bombeiros", t:"EPCO", mu:1, ou:6, v:1, c:"constituição variável: coordenador do PCO, células e núcleos conforme a fase do SGO"},
  {g:"Equipas — Corpos de Bombeiros", t:"EMIF", mu:1, ou:5, c:"1 VCI + até 5 elementos (municipal, acionada pelo CSREPC)"},
  /* --- Brigadas dos Corpos de Bombeiros --- */
  {g:"Brigadas — Corpos de Bombeiros", t:"BCIN", mu:3, ou:12, c:"2 ECIN + 1 ELAC; máx. 12 bombeiros"},
  {g:"Brigadas — Corpos de Bombeiros", t:"BCIN R", mu:4, ou:14, c:"2 ECIN-R + 1 ELAC-R + 1 VCOT; máx. 14 bombeiros"},
  {g:"Brigadas — Corpos de Bombeiros", t:"BRIR", mu:4, ou:14, c:"1 VCOT + 2 ECIN + 1 ELAC; 14 bombeiros (Sub-regiões adjacentes)"},
  {g:"Brigadas — Corpos de Bombeiros", t:"BRMAQ", mu:6, ou:15, mr:1, c:"1 EMR com 2.º operador + 2 VCI + 1 VCOT; máx. 15 bombeiros"},
  /* --- Grupos e Companhias dos Corpos de Bombeiros --- */
  {g:"Grupos e Companhias — CB", t:"GCIN", mu:7, ou:26, c:"2 BCIN + 1 VCOT; máx. 26 bombeiros"},
  {g:"Grupos e Companhias — CB", t:"GCIN R", mu:7, ou:26, c:"4 ECIN-R + 2 ELAC-R + 1 VCOT; máx. 26 bombeiros"},
  {g:"Grupos e Companhias — CB", t:"GRIR", mu:10, ou:32, c:"4 VCI + 2 VTT + 2 VCOT + 1 apoio logístico + 1 ABSC; 32 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GRUATA", mu:18, ou:53, mr:1, c:"6 VFCI + 3 VTT + 1 VTGC/VALE + 3 VCOT + 2 apoio logístico + 1 ABSC + 1 MR e transporte; 53 bombeiros + 1 guia; força não divisível"},
  {g:"Grupos e Companhias — CB", t:"GCPI", mu:9, ou:32, c:"4 VCI urbanos + 1 VLCI cat. 3 + 2 VTT + 1 VCOT + 1 ABSC; 32 bombeiros"},
  {g:"Grupos e Companhias — CB", t:"GRPI", mu:11, ou:36, c:"4 VCI urbanos + 1 VLCI cat. 3 + 2 VTT + 2 VCOT + 1 apoio logístico + 1 ABSC; 36 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GREL", mu:6, ou:24, c:"4 VLCI + 1 VTT + 1 VCOT; 24 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GRMAQ", mu:13, ou:32, mr:2, c:"2 BRMAQ + 1 VCOT; 32 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GRRA", mu:6, ou:12, c:"5 veículos tanque > 15.000 l + 1 VCOT; 12 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GREPH", mu:13, ou:26, c:"1 VCOT + 12 ABSC; 26 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"GRES", mu:13, ou:26, c:"6 ABTD + 6 ABTM + 1 VCOT; máx. 26 bombeiros + 1 guia"},
  {g:"Grupos e Companhias — CB", t:"CRIR", mu:40, ou:124, mr:1, v:1, c:"comando + 3 GCIN + 1 GREL + 1 GRRA + 1 EMR + 2 apoio logístico + 1 ABSC; até 40 veículos e 124 bombeiros + 1 guia"},
  /* --- UEPS da GNR --- */
  {g:"UEPS da GNR", t:"ETATI", mu:1, ou:4, c:"1 VLCI + 4 militares; apoio terrestre a EHATI/BHATI"},
  {g:"UEPS da GNR", t:"PATE", mu:6, ou:22, v:1, c:"nível máximo: 1 VCOT + 2 VLCI + 2 VFCI + 1 VTTR; até 22 operacionais; força não divisível"},
  {g:"UEPS da GNR", t:"GRUATA (UEPS)", mu:11, ou:44, v:1, c:"nível máximo: 2 VCOT + 4 VLCI + 4 VFCI + 1 VTTR (+1 VCOC); até 44 operacionais; força não divisível"},
  /* --- ICNF, I.P. --- */
  {g:"ICNF, I.P.", t:"ESF", mu:1, ou:5, c:"1 VLCI + 4 ou 5 elementos; 1.ª intervenção, rescaldo e vigilância ativa"},
  {g:"ICNF, I.P.", t:"EFSBF", mu:1, ou:5, c:"1 VLCI ou VFCI + 4 ou 5 sapadores bombeiros florestais"},
  {g:"ICNF, I.P.", t:"ECNAF", mu:1, ou:4, c:"1 VLCI + mín. 4 elementos; regime florestal e áreas classificadas"},
  {g:"ICNF, I.P.", t:"EGFR", mu:1, ou:3, c:"até 3 elementos; suporte às células de planeamento e operações do PCO"},
  {g:"ICNF, I.P.", t:"BSF", mu:3, ou:15, c:"3 VLCI + 12 a 15 elementos"},
  {g:"ICNF, I.P.", t:"BFSBF", mu:3, ou:15, c:"2 VLCI + 1 VFCI ou 3 VLCI; 12 a 15 sapadores bombeiros florestais"},
  {g:"ICNF, I.P.", t:"EMR (ICNF)", mu:3, ou:3, mr:1, c:"1 MR + 1 porta-máquinas + 1 veículo de apoio; chefe, operador e condutor"},
  /* --- FEPC da ANEPC --- */
  {g:"FEPC da ANEPC", t:"EAUF", mu:1, ou:3, c:"3 elementos; análise e uso do fogo, suporte às células do PCO"},
  {g:"FEPC da ANEPC", t:"EMR (FEPC)", mu:3, ou:4, mr:1, c:"1 MR + 1 porta-máquinas + 1 veículo de apoio; chefe, operador e 2 condutores"},
  /* --- AFOCELCA --- */
  {g:"AFOCELCA", t:"ECL", mu:1, ou:3, c:"1 VLCI + 3 operacionais com ferramentas manuais"},
  {g:"AFOCELCA", t:"ECT", mu:1, ou:5, c:"1 VFCI + 5 operacionais com ferramentas manuais"},
  {g:"AFOCELCA", t:"EAT", mu:1, ou:2, c:"1 VTT + 2 operacionais"},
  {g:"AFOCELCA", t:"EMR (AFOCELCA)", mu:3, ou:2, mr:1, c:"1 MR + 1 porta-máquinas + 1 veículo de apoio; condutor e manobrador"},
  /* --- Meios aéreos --- */
  {g:"Meios aéreos", t:"HEBL", mu:1, ou:0, ar:1, comb:1, ind:"HOTEL", c:"até 1.000 l; indicativo HOTEL (ANEPC)"},
  {g:"Meios aéreos", t:"HEBM", mu:1, ou:0, ar:1, comb:1, ind:"HOTEL", c:"1.000 a 2.500 l; indicativo HOTEL (ANEPC)"},
  {g:"Meios aéreos", t:"HEBP", mu:1, ou:0, ar:1, comb:1, ind:"KILO", c:"superior a 2.500 l; indicativo KILO"},
  {g:"Meios aéreos", t:"HERAC", mu:1, ou:0, ar:1, ind:"FIRE", c:"reconhecimento, avaliação e coordenação, com COPAR-Ar; indicativo FIRE"},
  {g:"Meios aéreos", t:"AVBM", mu:1, ou:0, ar:1, comb:1, ind:"ALFA", c:"3.000 a 5.000 l; indicativo ALFA"},
  {g:"Meios aéreos", t:"AVBP", mu:1, ou:0, ar:1, comb:1, ind:"BRAVO", c:"superior a 5.000 l; indicativo BRAVO"},
  {g:"Meios aéreos", t:"AVRAC", mu:1, ou:0, ar:1, ind:"OSCAR", c:"reconhecimento e avaliação, pode levar COPAR-Ar; indicativo OSCAR"},
  {g:"Meios aéreos", t:"UAS", mu:1, ou:2, ar:1, c:"aeronave não tripulada com equipa e equipamento de controlo"},
  {g:"Meios aéreos", t:"EHATI", mu:0, ou:5, c:"5 operacionais transportados em HEBL; ataque inicial"},
  {g:"Meios aéreos", t:"BHATI", mu:0, ou:8, c:"8 ou mais operacionais transportados em HEBM; ataque inicial"},
  {g:"Meios aéreos", t:"ECH (AFOCELCA)", mu:0, ou:5, ind:"CELCA", c:"5 operacionais transportados em HEBL; indicativo CELCA"},
  /* --- Viaturas isoladas --- */
  {g:"Viaturas isoladas", t:"VFCI", mu:1, ou:5}, {g:"Viaturas isoladas", t:"VECI", mu:1, ou:5},
  {g:"Viaturas isoladas", t:"VRCI", mu:1, ou:5}, {g:"Viaturas isoladas", t:"VLCI", mu:1, ou:4},
  {g:"Viaturas isoladas", t:"VUCI", mu:1, ou:3}, {g:"Viaturas isoladas", t:"VTT", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"VTTR", mu:1, ou:2}, {g:"Viaturas isoladas", t:"VTTU", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"VTGC", mu:1, ou:2}, {g:"Viaturas isoladas", t:"VALE", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"VCOT", mu:1, ou:1}, {g:"Viaturas isoladas", t:"VCOC", mu:1, ou:3},
  {g:"Viaturas isoladas", t:"VPCC", mu:1, ou:3}, {g:"Viaturas isoladas", t:"VTPT", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"VOPE", mu:1, ou:2}, {g:"Viaturas isoladas", t:"ABSC", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"ABTD", mu:1, ou:2}, {g:"Viaturas isoladas", t:"ABTM", mu:1, ou:2},
  {g:"Viaturas isoladas", t:"MR isolada", mu:1, ou:1, mr:1, c:"máquina de rasto isolada"},
  {g:"Viaturas isoladas", t:"Trator agrícola/florestal", mu:1, ou:1},
  {g:"Outro", t:"Outro", mu:1, ou:1}
];
function catOptions(){
  const grupos = [...new Set(CATALOGO.map(c=>c.g))];
  return grupos.map(g=>'<optgroup label="'+g+'">'+CATALOGO.filter(c=>c.g===g).map(c=>'<option value="'+c.t+'"'+(c.c? ' title="'+esc(c.c)+'"':'')+'>'+c.t+(c.v?' (variável)':'')+'</option>').join("")+'</optgroup>').join("");
}
/* As entradas do catálogo variam de forma conforme a tipologia; o tipo é aberto
   de propósito. Ver o Anexo 1 da DON n.º 2. */
/** @param {string} t @returns {any} */
function catDef(t){ return CATALOGO.find(c=>c.t===t) || {mu:1,ou:1}; }
/* Ponto de trânsito. O nome mantém-se — nove pontos de chamada não mudam — mas passou
   a viver na célula de logística e finanças: é local da ZCR e o seu responsável reporta
   ao oficial de logística e finanças. */
