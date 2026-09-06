/* ================= OPERAÇÕES · rede de meios aéreos do DECIR (art. 19.º) =================
   Transcrição dos Anexos 6 e 18 da DON n.º 2 / DECIR 2026: os centros de meios aéreos com
   as coordenadas, e, nível a nível, os meios sediados em cada um com o indicativo que a
   diretiva lhes dá. Pedido de 6 de setembro: o indicativo do meio aéreo escolhe-se de uma
   lista, em vez de se escrever de cor — desde que a lista tenha fonte, e esta tem.

   O que aqui está é o que a diretiva escreve, e nada mais: os indicativos (H1 a H43, K1 a
   K5, A1 a A20, B1 e B2, FIRE1 a FIRE5, O1 e O2, Pantera 1 e 2) são os das colunas do
   Anexo 6, e a transcrição foi conferida contra os subtotais de cada período — 11, 37, 78,
   67, 22 e 9 meios — que o teste repete. O Anexo 6 não tem coluna HEBM: os «H» são HEBL.
   Ovar (BA8) recebe dois HEBP no verão e não consta do Anexo 18, pelo que fica sem
   coordenadas; e a linha de Évora diz «Alto Central», gralha que se corrige para Alentejo
   Central, como no Anexo 6 e no DL n.º 90-A/2022. Os meios da AFOCELCA, da Força Aérea fora deste quadro e os estrangeiros não
   estão aqui, e por isso o campo continua a aceitar o que se escreve à mão. O «2*» de
   Santarém são AVBM terrestres, nota da própria tabela; contam como AVBM. */
/** @typedef {{n:string, t:string, r:string, s:string, lat:number|null, lon:number|null}} CentroMeiosAereos */
/** @type {CentroMeiosAereos[]} */
const CMA_DECIR = [
  { n:"Arcos de Valdevez", t:"Heliporto", r:"Norte", s:"Alto Minho", lat:41.82976, lon:-8.44335 },
  { n:"Braga", t:"Pista", r:"Norte", s:"Cávado", lat:41.58676, lon:-8.44366 },
  { n:"Fafe", t:"Heliporto", r:"Norte", s:"Ave", lat:41.45641, lon:-8.13806 },
  { n:"Famalicão", t:"Heliporto", r:"Norte", s:"Ave", lat:41.36928, lon:-8.43678 },
  { n:"Baltar", t:"Heliporto", r:"Norte", s:"Área Metropolitana do Porto", lat:41.19001, lon:-8.38562 },
  { n:"Vale de Cambra", t:"Heliporto", r:"Norte", s:"Área Metropolitana do Porto", lat:40.87242, lon:-8.38304 },
  { n:"Chaves", t:"Pista", r:"Norte", s:"Alto Tâmega e Barroso", lat:41.72151, lon:-7.46248 },
  { n:"Ribeira de Pena", t:"Heliporto", r:"Norte", s:"Alto Tâmega e Barroso", lat:41.50719, lon:-7.80464 },
  { n:"Alfândega da Fé", t:"Heliporto", r:"Norte", s:"Terras de Trás-os-Montes", lat:41.34596, lon:-6.96235 },
  { n:"Bragança", t:"Pista", r:"Norte", s:"Terras de Trás-os-Montes", lat:41.85669, lon:-6.70756 },
  { n:"Macedo de Cavaleiros", t:"Heliporto", r:"Norte", s:"Terras de Trás-os-Montes", lat:41.52533, lon:-6.96632 },
  { n:"Mirandela", t:"Pista", r:"Norte", s:"Terras de Trás-os-Montes", lat:41.46855, lon:-7.2266 },
  { n:"Armamar", t:"Heliporto", r:"Norte", s:"Douro", lat:41.1123, lon:-7.6973 },
  { n:"Vila Real", t:"Pista", r:"Norte", s:"Douro", lat:41.27594, lon:-7.71929 },
  { n:"Águeda", t:"Pista", r:"Centro", s:"Região de Aveiro", lat:40.54713, lon:-8.40442 },
  { n:"Cernache", t:"Pista", r:"Centro", s:"Região de Coimbra", lat:40.15671, lon:-8.46789 },
  { n:"Lousã", t:"Pista", r:"Centro", s:"Região de Coimbra", lat:40.14351, lon:-8.2442 },
  { n:"Pampilhosa da Serra", t:"Pista", r:"Centro", s:"Região de Coimbra", lat:40.02733, lon:-7.94909 },
  { n:"Alcaria", t:"Heliporto", r:"Centro", s:"Região de Leiria", lat:39.57778, lon:-8.78448 },
  { n:"Figueiró do Vinhos", t:"Heliporto", r:"Centro", s:"Região de Leiria", lat:39.91268, lon:-8.27433 },
  { n:"Monte Real (BA5)", t:"Pista", r:"Centro", s:"Região de Leiria", lat:39.83046, lon:-8.88446 },
  { n:"Pombal", t:"Pista", r:"Centro", s:"Região de Leiria", lat:39.88682, lon:-8.64941 },
  { n:"Aguiar da Beira", t:"Heliporto", r:"Centro", s:"Viseu Dão e Lafões", lat:40.81748, lon:-7.53646 },
  { n:"Santa Comba Dão", t:"Heliporto", r:"Centro", s:"Viseu Dão e Lafões", lat:40.39847, lon:-8.13415 },
  { n:"Viseu", t:"Pista", r:"Centro", s:"Viseu Dão e Lafões", lat:40.72274, lon:-7.88928 },
  { n:"Covilhã", t:"Heliporto", r:"Centro", s:"Beiras e Serra da Estrela", lat:40.24768, lon:-7.58234 },
  { n:"Guarda", t:"Heliporto", r:"Centro", s:"Beiras e Serra da Estrela", lat:40.52982, lon:-7.27813 },
  { n:"Mêda", t:"Heliporto", r:"Centro", s:"Beiras e Serra da Estrela", lat:40.96064, lon:-7.25016 },
  { n:"Seia", t:"Pista", r:"Centro", s:"Beiras e Serra da Estrela", lat:40.45358, lon:-7.68855 },
  { n:"Castelo Branco", t:"Pista", r:"Centro", s:"Beira Baixa", lat:39.85021, lon:-7.44152 },
  { n:"Proença-a-Nova", t:"Pista", r:"Centro", s:"Beira Baixa", lat:39.73092, lon:-7.87362 },
  { n:"Ferreira do Zêzere", t:"Pista", r:"Lisboa e Vale do Tejo", s:"Médio Tejo", lat:39.68169, lon:-8.25346 },
  { n:"Sardoal", t:"Heliporto", r:"Lisboa e Vale do Tejo", s:"Médio Tejo", lat:39.54254, lon:-8.16033 },
  { n:"Santarém", t:"Pista", r:"Lisboa e Vale do Tejo", s:"Lezíria do Tejo", lat:39.20881, lon:-8.68681 },
  { n:"Lourinhã", t:"Heliporto", r:"Lisboa e Vale do Tejo", s:"Oeste", lat:39.25382, lon:-9.29949 },
  { n:"Mafra", t:"Heliporto", r:"Lisboa e Vale do Tejo", s:"Grande Lisboa", lat:38.94306, lon:-9.35389 },
  { n:"Montijo (BA6)", t:"Pista", r:"Lisboa e Vale do Tejo", s:"Península de Setúbal", lat:38.69241, lon:-9.04502 },
  { n:"Ponte de Sor", t:"Pista", r:"Alentejo", s:"Alto Alentejo", lat:39.2057, lon:-8.05771 },
  { n:"Portalegre", t:"Heliporto", r:"Alentejo", s:"Alto Alentejo", lat:39.26086, lon:-7.42328 },
  { n:"Évora", t:"Pista", r:"Alentejo", s:"Alentejo Central", lat:38.53331, lon:-7.88841 },
  { n:"Grândola", t:"Heliporto", r:"Alentejo", s:"Alentejo Litoral", lat:38.18048, lon:-8.57579 },
  { n:"Beja (BA11)", t:"Pista", r:"Alentejo", s:"Baixo Alentejo", lat:38.07058, lon:-7.92903 },
  { n:"Moura", t:"Heliporto", r:"Alentejo", s:"Baixo Alentejo", lat:38.20148, lon:-7.48208 },
  { n:"Ourique", t:"Heliporto", r:"Alentejo", s:"Baixo Alentejo", lat:37.65365, lon:-8.22794 },
  { n:"Cachopo", t:"Heliporto", r:"Algarve", s:"Algarve", lat:37.3349, lon:-7.8133 },
  { n:"Loulé", t:"Heliporto", r:"Algarve", s:"Algarve", lat:37.13141, lon:-8.03316 },
  { n:"Monchique", t:"Heliporto", r:"Algarve", s:"Algarve", lat:37.30792, lon:-8.55469 },
  { n:"Portimão", t:"Pista", r:"Algarve", s:"Algarve", lat:37.14807, lon:-8.58226 },
  { n:"S. Brás de Alportel", t:"Heliporto", r:"Algarve", s:"Algarve", lat:37.14436, lon:-7.90219 },
  { n:"Ovar (BA8)", t:"Pista", r:"Centro", s:"Região de Aveiro", lat:null, lon:null }
];

/* Os períodos são os do Anexo 6, que não coincidem com os níveis do corpo da diretiva: o
   verão é uma tabela só, «Charlie e Delta», e os dois Alfa e os dois Bravo têm dispositivos
   diferentes. Guardam-se como a diretiva os publica, com mês e dia de início e fim. */
const AEREOS_DECIR = {
  ano: 2026,
  fonte: "DON n.º 2 / DECIR 2026, Anexos 6 e 18",
  periodos: [
    { n:"ALFA", de:101, a:514, meios:[
      ["H1", "HEBL", "Arcos de Valdevez"],
      ["H14", "HEBL", "Vale de Cambra"],
      ["H15", "HEBL", "Vila Real"],
      ["H18", "HEBL", "Viseu"],
      ["A5", "AVBM", "Viseu"],
      ["A6", "AVBM", "Viseu"],
      ["H2", "HEBL", "Santa Comba Dão"],
      ["H25", "HEBL", "Lousã"],
      ["A11", "AVBM", "Proença-a-Nova"],
      ["A12", "AVBM", "Proença-a-Nova"],
      ["H3", "HEBL", "Loulé"]
    ] },
    { n:"BRAVO", de:515, a:531, meios:[
      ["H1", "HEBL", "Arcos de Valdevez"],
      ["H8", "HEBL", "Chaves"],
      ["H10", "HEBL", "Bragança"],
      ["K2", "HEBP", "Macedo de Cavaleiros"],
      ["H12", "HEBL", "Alfândega da Fé"],
      ["H14", "HEBL", "Vale de Cambra"],
      ["H15", "HEBL", "Vila Real"],
      ["A3", "AVBM", "Vila Real"],
      ["A4", "AVBM", "Vila Real"],
      ["H18", "HEBL", "Viseu"],
      ["A5", "AVBM", "Viseu"],
      ["A6", "AVBM", "Viseu"],
      ["O1", "AVRAC", "Viseu"],
      ["H2", "HEBL", "Santa Comba Dão"],
      ["H22", "HEBL", "Seia"],
      ["A7", "AVBM", "Cernache"],
      ["A8", "AVBM", "Cernache"],
      ["H25", "HEBL", "Lousã"],
      ["FIRE1", "HERAC", "Lousã"],
      ["H27", "HEBL", "Pombal"],
      ["K3", "HEBP", "Pombal"],
      ["H30", "HEBL", "Castelo Branco"],
      ["B1", "AVBP", "Castelo Branco"],
      ["B2", "AVBP", "Castelo Branco"],
      ["A11", "AVBM", "Proença-a-Nova"],
      ["A12", "AVBM", "Proença-a-Nova"],
      ["H33", "HEBL", "Sardoal"],
      ["H34", "HEBL", "Santarém"],
      ["H36", "HEBL", "Montijo (BA6)"],
      ["FIRE5", "HERAC", "Ponte de Sor"],
      ["O2", "AVRAC", "Ponte de Sor"],
      ["H38", "HEBL", "Évora"],
      ["A15", "AVBM", "Beja (BA11)"],
      ["A16", "AVBM", "Beja (BA11)"],
      ["H42", "HEBL", "Monchique"],
      ["H43", "HEBL", "Cachopo"],
      ["H3", "HEBL", "Loulé"]
    ] },
    { n:"CHARLIE/DELTA", de:601, a:930, meios:[
      ["H1", "HEBL", "Arcos de Valdevez"],
      ["H4", "HEBL", "Arcos de Valdevez"],
      ["K1", "HEBP", "Braga"],
      ["H5", "HEBL", "Famalicão"],
      ["H6", "HEBL", "Fafe"],
      ["H7", "HEBL", "Chaves"],
      ["H8", "HEBL", "Chaves"],
      ["H9", "HEBL", "Ribeira de Pena"],
      ["H10", "HEBL", "Bragança"],
      ["K2", "HEBP", "Macedo de Cavaleiros"],
      ["A1", "AVBM", "Mirandela"],
      ["A2", "AVBM", "Mirandela"],
      ["H12", "HEBL", "Alfândega da Fé"],
      ["H13", "HEBL", "Baltar"],
      ["H14", "HEBL", "Vale de Cambra"],
      ["H15", "HEBL", "Vila Real"],
      ["A3", "AVBM", "Vila Real"],
      ["A4", "AVBM", "Vila Real"],
      ["FIRE4", "HERAC", "Vila Real"],
      ["H16", "HEBL", "Armamar"],
      ["H17", "HEBL", "Águeda"],
      ["Pantera 1", "HEBP", "Ovar (BA8)"],
      ["Pantera 2", "HEBP", "Ovar (BA8)"],
      ["H18", "HEBL", "Viseu"],
      ["A5", "AVBM", "Viseu"],
      ["A6", "AVBM", "Viseu"],
      ["O1", "AVRAC", "Viseu"],
      ["H19", "HEBL", "Aguiar da Beira"],
      ["H2", "HEBL", "Santa Comba Dão"],
      ["H20", "HEBL", "Mêda"],
      ["H21", "HEBL", "Guarda"],
      ["H22", "HEBL", "Seia"],
      ["H23", "HEBL", "Covilhã"],
      ["H24", "HEBL", "Cernache"],
      ["A7", "AVBM", "Cernache"],
      ["A8", "AVBM", "Cernache"],
      ["H25", "HEBL", "Lousã"],
      ["FIRE1", "HERAC", "Lousã"],
      ["FIRE2", "HERAC", "Lousã"],
      ["H26", "HEBL", "Pampilhosa da Serra"],
      ["H27", "HEBL", "Pombal"],
      ["K3", "HEBP", "Pombal"],
      ["H28", "HEBL", "Figueiró do Vinhos"],
      ["H29", "HEBL", "Alcaria"],
      ["H30", "HEBL", "Castelo Branco"],
      ["A9", "AVBM", "Castelo Branco"],
      ["A10", "AVBM", "Castelo Branco"],
      ["B1", "AVBP", "Castelo Branco"],
      ["B2", "AVBP", "Castelo Branco"],
      ["H31", "HEBL", "Proença-a-Nova"],
      ["A11", "AVBM", "Proença-a-Nova"],
      ["A12", "AVBM", "Proença-a-Nova"],
      ["H32", "HEBL", "Ferreira do Zêzere"],
      ["K4", "HEBP", "Ferreira do Zêzere"],
      ["H33", "HEBL", "Sardoal"],
      ["H34", "HEBL", "Santarém"],
      ["A19", "AVBM", "Santarém"],
      ["A20", "AVBM", "Santarém"],
      ["H11", "HEBL", "Lourinhã"],
      ["H35", "HEBL", "Mafra"],
      ["H36", "HEBL", "Montijo (BA6)"],
      ["H37", "HEBL", "Portalegre"],
      ["A13", "AVBM", "Ponte de Sor"],
      ["A14", "AVBM", "Ponte de Sor"],
      ["FIRE5", "HERAC", "Ponte de Sor"],
      ["O2", "AVRAC", "Ponte de Sor"],
      ["H38", "HEBL", "Évora"],
      ["H39", "HEBL", "Grândola"],
      ["H40", "HEBL", "Moura"],
      ["A15", "AVBM", "Beja (BA11)"],
      ["A16", "AVBM", "Beja (BA11)"],
      ["H41", "HEBL", "Ourique"],
      ["H42", "HEBL", "Monchique"],
      ["H43", "HEBL", "Cachopo"],
      ["K5", "HEBP", "S. Brás de Alportel"],
      ["A17", "AVBM", "Portimão"],
      ["A18", "AVBM", "Portimão"],
      ["H3", "HEBL", "Loulé"]
    ] },
    { n:"CHARLIE", de:1001, a:1015, meios:[
      ["H1", "HEBL", "Arcos de Valdevez"],
      ["H4", "HEBL", "Arcos de Valdevez"],
      ["K1", "HEBP", "Braga"],
      ["H5", "HEBL", "Famalicão"],
      ["H6", "HEBL", "Fafe"],
      ["H7", "HEBL", "Chaves"],
      ["H9", "HEBL", "Ribeira de Pena"],
      ["K2", "HEBP", "Macedo de Cavaleiros"],
      ["A1", "AVBM", "Mirandela"],
      ["A2", "AVBM", "Mirandela"],
      ["H12", "HEBL", "Alfândega da Fé"],
      ["H13", "HEBL", "Baltar"],
      ["H14", "HEBL", "Vale de Cambra"],
      ["H15", "HEBL", "Vila Real"],
      ["A3", "AVBM", "Vila Real"],
      ["A4", "AVBM", "Vila Real"],
      ["FIRE4", "HERAC", "Vila Real"],
      ["H16", "HEBL", "Armamar"],
      ["H17", "HEBL", "Águeda"],
      ["Pantera 1", "HEBP", "Ovar (BA8)"],
      ["Pantera 2", "HEBP", "Ovar (BA8)"],
      ["H18", "HEBL", "Viseu"],
      ["A5", "AVBM", "Viseu"],
      ["A6", "AVBM", "Viseu"],
      ["O1", "AVRAC", "Viseu"],
      ["H19", "HEBL", "Aguiar da Beira"],
      ["H2", "HEBL", "Santa Comba Dão"],
      ["H20", "HEBL", "Mêda"],
      ["H21", "HEBL", "Guarda"],
      ["H23", "HEBL", "Covilhã"],
      ["H24", "HEBL", "Cernache"],
      ["A7", "AVBM", "Cernache"],
      ["A8", "AVBM", "Cernache"],
      ["H25", "HEBL", "Lousã"],
      ["FIRE1", "HERAC", "Lousã"],
      ["FIRE2", "HERAC", "Lousã"],
      ["H26", "HEBL", "Pampilhosa da Serra"],
      ["K3", "HEBP", "Pombal"],
      ["H28", "HEBL", "Figueiró do Vinhos"],
      ["H29", "HEBL", "Alcaria"],
      ["H30", "HEBL", "Castelo Branco"],
      ["A9", "AVBM", "Castelo Branco"],
      ["A10", "AVBM", "Castelo Branco"],
      ["B1", "AVBP", "Castelo Branco"],
      ["B2", "AVBP", "Castelo Branco"],
      ["H31", "HEBL", "Proença-a-Nova"],
      ["A11", "AVBM", "Proença-a-Nova"],
      ["A12", "AVBM", "Proença-a-Nova"],
      ["H32", "HEBL", "Ferreira do Zêzere"],
      ["K4", "HEBP", "Ferreira do Zêzere"],
      ["H33", "HEBL", "Sardoal"],
      ["A19", "AVBM", "Santarém"],
      ["A20", "AVBM", "Santarém"],
      ["H11", "HEBL", "Lourinhã"],
      ["H35", "HEBL", "Mafra"],
      ["H37", "HEBL", "Portalegre"],
      ["A13", "AVBM", "Ponte de Sor"],
      ["A14", "AVBM", "Ponte de Sor"],
      ["FIRE5", "HERAC", "Ponte de Sor"],
      ["O2", "AVRAC", "Ponte de Sor"],
      ["H39", "HEBL", "Grândola"],
      ["H40", "HEBL", "Moura"],
      ["H41", "HEBL", "Ourique"],
      ["K5", "HEBP", "S. Brás de Alportel"],
      ["A17", "AVBM", "Portimão"],
      ["A18", "AVBM", "Portimão"],
      ["H3", "HEBL", "Loulé"]
    ] },
    { n:"BRAVO", de:1016, a:1031, meios:[
      ["H1", "HEBL", "Arcos de Valdevez"],
      ["A1", "AVBM", "Mirandela"],
      ["A2", "AVBM", "Mirandela"],
      ["H12", "HEBL", "Alfândega da Fé"],
      ["H14", "HEBL", "Vale de Cambra"],
      ["H15", "HEBL", "Vila Real"],
      ["FIRE4", "HERAC", "Vila Real"],
      ["H18", "HEBL", "Viseu"],
      ["A5", "AVBM", "Viseu"],
      ["A6", "AVBM", "Viseu"],
      ["O1", "AVRAC", "Viseu"],
      ["H2", "HEBL", "Santa Comba Dão"],
      ["H25", "HEBL", "Lousã"],
      ["FIRE1", "HERAC", "Lousã"],
      ["H30", "HEBL", "Castelo Branco"],
      ["A11", "AVBM", "Proença-a-Nova"],
      ["A12", "AVBM", "Proença-a-Nova"],
      ["H33", "HEBL", "Sardoal"],
      ["A13", "AVBM", "Ponte de Sor"],
      ["A14", "AVBM", "Ponte de Sor"],
      ["O2", "AVRAC", "Ponte de Sor"],
      ["H3", "HEBL", "Loulé"]
    ] },
    { n:"ALFA", de:1101, a:1231, meios:[
      ["H1", "HEBL", "Arcos de Valdevez"],
      ["H14", "HEBL", "Vale de Cambra"],
      ["H15", "HEBL", "Vila Real"],
      ["A5", "AVBM", "Viseu"],
      ["A6", "AVBM", "Viseu"],
      ["H2", "HEBL", "Santa Comba Dão"],
      ["A11", "AVBM", "Proença-a-Nova"],
      ["A12", "AVBM", "Proença-a-Nova"],
      ["H3", "HEBL", "Loulé"]
    ] }
  ]
};

/** O CMA com este nome, ou null: a rede é pequena e procura-se por igualdade.
 * @returns {CentroMeiosAereos|null} */
function cmaDECIR(nome){
  return CMA_DECIR.find(c=>c.n===nome) || null;
}

/**
 * Os meios aéreos do dispositivo numa data, cada um com o CMA onde está sediado.
 *
 * Vazio fora do ano da tabela: sem diretiva desse ano em fonte, a aplicação não adivinha o
 * dispositivo, e o campo do indicativo fica livre — é a regra 4 do projeto, a mesma de
 * `nivelDECIR`. Quem chama tem de saber tratar o vazio.
 *
 * @param {Date} [d]
 * @returns {{n:string, de:number, a:number, meios:{ind:string,t:string,cma:CentroMeiosAereos|null}[]}|null}
 */
function periodoAereoDECIR(d){
  d = d || new Date(agora());
  if(d.getFullYear() !== AEREOS_DECIR.ano) return null;
  const md = (d.getMonth()+1)*100 + d.getDate();
  const p = AEREOS_DECIR.periodos.find(x=>md>=x.de && md<=x.a);
  if(!p) return null;
  return { n:p.n, de:p.de, a:p.a, meios:p.meios.map(m=>({ind:m[0], t:m[1], cma:cmaDECIR(m[2])})) };
}

/** O meio da rede com este indicativo na data, ou null; a comparação ignora maiúsculas e espaços. */
function meioAereoDECIR(ind, d){
  const p = periodoAereoDECIR(d); if(!p) return null;
  const k = String(ind||"").replace(/\s+/g,"").toUpperCase();
  return k? (p.meios.find(m=>m.ind.replace(/\s+/g,"").toUpperCase()===k) || null) : null;
}

/**
 * As opções para o campo do indicativo: os meios do período, com a distância em quilómetros
 * ao ponto da ocorrência quando o há e o CMA tem coordenadas, do mais perto para o mais longe.
 *
 * A distância é a plana do teatro, `distanciaPlanaM`, e não a esférica: são dezenas de
 * quilómetros, e o erro é o mesmo que noutro sítio qualquer da aplicação. Sem coordenadas
 * de um dos lados, a ordem é a da diretiva e a distância fica nula — o rótulo não mente.
 *
 * @returns {{ind:string, t:string, cma:CentroMeiosAereos|null, km:number|null}[]}
 */
function opcoesIndicativosAereos(d, lat, lon){
  const p = periodoAereoDECIR(d); if(!p) return [];
  const temO = Number.isFinite(lat) && Number.isFinite(lon);
  const L = p.meios.map(m=>{
    const km = (temO && m.cma && m.cma.lat!=null)? distanciaPlanaM(lat, lon, m.cma.lat, m.cma.lon)/1000 : null;
    return { ind:m.ind, t:m.t, cma:m.cma, km };
  });
  if(temO) L.sort((a,b)=>Number(a.km==null)-Number(b.km==null) || (a.km||0)-(b.km||0));
  return L;
}

/** A data que decide o período: o início da ocorrência, ou agora quando ainda não há início. */
function dataDoDispositivoAereo(){
  return parseGDH(O.meta.inicio) || new Date(agora());
}

/**
 * Enche a lista de escolha do indicativo e a linha que diz de onde ela vem.
 *
 * É uma `datalist`, e não um `select`, de propósito: o que não está na diretiva — AFOCELCA,
 * Força Aérea fora do quadro, meios estrangeiros — continua a escrever-se à mão no mesmo
 * campo. A lista muda com a data da ocorrência e com o ponto, por isso pinta-se com o resto.
 */
function pintarIndicativosAereos(){
  const dl = $("aer-lista"), h = $("aer-rede"); if(!dl || !h) return;
  const d = dataDoDispositivoAereo();
  const c0 = parCoordenadas(O.meta.lat, O.meta.lon);
  const L = opcoesIndicativosAereos(d, c0? c0.lat : NaN, c0? c0.lon : NaN);
  const p = periodoAereoDECIR(d);
  dl.innerHTML = L.map(o=>{
    const onde = o.cma? o.cma.n+" ("+o.cma.s+")" : "";
    const km = o.km==null? (o.cma && o.cma.lat==null? "sem coordenadas no Anexo 18" : "") : fmtPT(o.km, 0)+" km";
    return '<option value="'+esc(o.ind)+'">'+esc([o.t, onde, km].filter(Boolean).join(" · "))+'</option>';
  }).join("");
  if(!p){
    h.textContent = "Sem tabela de meios aéreos para "+d.getFullYear()+" em fonte: o indicativo escreve-se à mão.";
    return;
  }
  const md = x=>String(x%100).padStart(2,"0")+"/"+String(Math.floor(x/100)).padStart(2,"0");
  h.textContent = "Indicativos do Anexo 6 da "+AEREOS_DECIR.fonte.replace(", Anexos 6 e 18","")+", nível "+p.n
    +" ("+md(p.de)+" a "+md(p.a)+"), "+L.length+" meios"
    +(c0? ", do CMA mais perto da ocorrência para o mais longe" : "; sem coordenadas da ocorrência, pela ordem da diretiva")
    +". O que não consta — AFOCELCA, Força Aérea, meios estrangeiros — escreve-se à mão.";
}
