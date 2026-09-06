/* ================= OPERAÇÕES · origens do dispositivo terrestre (art. 17.º) =================
   Pedido de 6 de setembro, a seguir aos meios aéreos: a mesma lista para os meios terrestres.
   A DON n.º 2 / DECIR 2026 não dá indicativos aos meios terrestres, e não traz a lista dos
   corpos de bombeiros: por sub-região só há contagens — o Anexo 5 e o Anexo 7 dizem quantos
   veículos, operacionais e EIP tem cada sub-região, e não quais. O que a diretiva nomeia por
   localização é o que aqui está, para o país inteiro, porque o posto de comando pode estar
   em qualquer ponto do território e os meios atuam em todo ele: as equipas de ataque inicial
   da UEPS da GNR em cada CMA (Anexo 10: 42 CMA e 43 EHATI, porque Arcos de Valdevez e
   Chaves têm duas; conferido pelos totais — 43 equipas, 215 e 164 militares, 41 VLCI), as
   bases da Força Especial de Proteção Civil (Anexo 9), as equipas de máquinas de rasto da
   Unidade Nacional de Máquinas do ICNF (Anexo 12), os corpos de bombeiros com máquina de
   rasto (Anexo 22) e os que têm veículo de transporte coletivo para rendição (Anexo 23). O
   Anexo 9 tem uma linha de «2 VCI, 10 sapadores» sem base, a seguir a Proença-a-Nova, que
   não se transcreve porque não se sabe de onde é. O resto do Anexo 12 são cartas em
   imagem, sem texto que se transcreva. No Anexo 23 as 24 linhas dos corpos de bombeiros
   somam 25 veículos e a linha de total impressa diz 30: transcreve-se o que as linhas
   dizem, e fica anotada a diferença, que é da diretiva.

   A lista serve para escrever o mesmo nome da mesma maneira; o campo continua livre, e o
   que já foi escrito nesta ocorrência aparece primeiro. Quando chegar uma lista oficial dos
   corpos de bombeiros, entra aqui com a fonte ao lado. */
/** @typedef {{n:string, s:string, d:string, a:string}} OrigemDECIR */
/** @type {OrigemDECIR[]} */
const ORIGENS_DECIR = [
  { n:"UEPS/GNR — Arcos de Valdevez", s:"Alto Minho", d:"2 EHATI, 10 militares; ETATI, 4 militares, 1 VLCI, no CMA de Arcos de Valdevez", a:"Anexo 10" },
  { n:"UEPS/GNR — Fafe", s:"Ave", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Fafe", a:"Anexo 10" },
  { n:"UEPS/GNR — Famalicão", s:"Ave", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Famalicão", a:"Anexo 10" },
  { n:"UEPS/GNR — Baltar", s:"Área Metropolitana do Porto", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Baltar", a:"Anexo 10" },
  { n:"UEPS/GNR — Vale de Cambra", s:"Área Metropolitana do Porto", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Vale de Cambra", a:"Anexo 10" },
  { n:"UEPS/GNR — Chaves", s:"Alto Tâmega e Barroso", d:"2 EHATI, 10 militares; ETATI, 4 militares, 1 VLCI, no CMA de Chaves", a:"Anexo 10" },
  { n:"UEPS/GNR — Ribeira de Pena", s:"Alto Tâmega e Barroso", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Ribeira de Pena", a:"Anexo 10" },
  { n:"UEPS/GNR — Alfândega da Fé", s:"Terras de Trás-os-Montes", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Alfândega da Fé", a:"Anexo 10" },
  { n:"UEPS/GNR — Bragança", s:"Terras de Trás-os-Montes", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Bragança", a:"Anexo 10" },
  { n:"UEPS/GNR — Armamar", s:"Douro", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Armamar", a:"Anexo 10" },
  { n:"UEPS/GNR — Vila Real", s:"Douro", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Vila Real", a:"Anexo 10" },
  { n:"UEPS/GNR — Águeda", s:"Região de Aveiro", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Águeda", a:"Anexo 10" },
  { n:"UEPS/GNR — Cernache", s:"Região de Coimbra", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Cernache", a:"Anexo 10" },
  { n:"UEPS/GNR — Lousã", s:"Região de Coimbra", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Lousã", a:"Anexo 10" },
  { n:"UEPS/GNR — Pampilhosa da Serra", s:"Região de Coimbra", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Pampilhosa da Serra", a:"Anexo 10" },
  { n:"UEPS/GNR — Alcaria", s:"Região de Leiria", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Alcaria", a:"Anexo 10" },
  { n:"UEPS/GNR — Figueiró dos Vinhos", s:"Região de Leiria", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Figueiró dos Vinhos", a:"Anexo 10" },
  { n:"UEPS/GNR — Pombal", s:"Região de Leiria", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Pombal", a:"Anexo 10" },
  { n:"UEPS/GNR — Aguiar da Beira", s:"Viseu Dão e Lafões", d:"1 EHATI, 5 militares, no CMA de Aguiar da Beira", a:"Anexo 10" },
  { n:"UEPS/GNR — Santa Comba Dão", s:"Viseu Dão e Lafões", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Santa Comba Dão", a:"Anexo 10" },
  { n:"UEPS/GNR — Viseu", s:"Viseu Dão e Lafões", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Viseu", a:"Anexo 10" },
  { n:"UEPS/GNR — Guarda", s:"Beiras e Serra da Estrela", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Guarda", a:"Anexo 10" },
  { n:"UEPS/GNR — Mêda", s:"Beiras e Serra da Estrela", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Mêda", a:"Anexo 10" },
  { n:"UEPS/GNR — Seia", s:"Beiras e Serra da Estrela", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Seia", a:"Anexo 10" },
  { n:"UEPS/GNR — Covilhã", s:"Beiras e Serra da Estrela", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Covilhã", a:"Anexo 10" },
  { n:"UEPS/GNR — Castelo Branco", s:"Beira Baixa", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Castelo Branco", a:"Anexo 10" },
  { n:"UEPS/GNR — Proença-a-Nova", s:"Beira Baixa", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Proença-a-Nova", a:"Anexo 10" },
  { n:"UEPS/GNR — Ferreira do Zêzere", s:"Médio Tejo", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Ferreira do Zêzere", a:"Anexo 10" },
  { n:"UEPS/GNR — Sardoal", s:"Médio Tejo", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Sardoal", a:"Anexo 10" },
  { n:"UEPS/GNR — Santarém", s:"Lezíria do Tejo", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Santarém", a:"Anexo 10" },
  { n:"UEPS/GNR — Lourinhã", s:"Oeste", d:"1 EHATI, 5 militares, no CMA de Lourinhã", a:"Anexo 10" },
  { n:"UEPS/GNR — Mafra", s:"Grande Lisboa", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Mafra", a:"Anexo 10" },
  { n:"UEPS/GNR — Montijo", s:"Península de Setúbal", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Montijo (BA6)", a:"Anexo 10" },
  { n:"UEPS/GNR — Portalegre", s:"Alto Alentejo", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Portalegre", a:"Anexo 10" },
  { n:"UEPS/GNR — Ponte de Sor", s:"Alto Alentejo", d:"sem EHATI; ETATI, 8 militares, 2 VLCI, no CMA de Ponte de Sor", a:"Anexo 10" },
  { n:"UEPS/GNR — Évora", s:"Alentejo Central", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Évora", a:"Anexo 10" },
  { n:"UEPS/GNR — Grândola", s:"Alentejo Litoral", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Grândola", a:"Anexo 10" },
  { n:"UEPS/GNR — Ourique", s:"Baixo Alentejo", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Ourique", a:"Anexo 10" },
  { n:"UEPS/GNR — Moura", s:"Baixo Alentejo", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Moura", a:"Anexo 10" },
  { n:"UEPS/GNR — Loulé", s:"Algarve", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Loulé", a:"Anexo 10" },
  { n:"UEPS/GNR — Monchique", s:"Algarve", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Monchique", a:"Anexo 10" },
  { n:"UEPS/GNR — Cachopo", s:"Algarve", d:"1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI, no CMA de Cachopo", a:"Anexo 10" },
  { n:"FEPC — Base de Guimarães", s:"Ave", d:"2 VCI, 8 sapadores bombeiros", a:"Anexo 9" },
  { n:"FEPC — Base de Trancoso", s:"Beiras e Serra da Estrela", d:"2 VCI, 10 sapadores bombeiros", a:"Anexo 9" },
  { n:"FEPC — Base de Proença-a-Nova", s:"Beira Baixa", d:"2 VCI, 10 sapadores bombeiros", a:"Anexo 9" },
  { n:"FEPC — Base de Almeirim", s:"Lezíria do Tejo", d:"1 equipa UAS, 3 sapadores; 1 apoio logístico, 5 sapadores", a:"Anexo 9" },
  { n:"FEPC — Base de Montijo", s:"Península de Setúbal", d:"1 VCI, 4 sapadores bombeiros", a:"Anexo 9" },
  { n:"FEPC — Base de Portalegre", s:"Alto Alentejo", d:"1 VCI, 5 sapadores bombeiros", a:"Anexo 9" },
  { n:"FEPC — Base de Estremoz", s:"Alentejo Central", d:"1 VCI, 5 sapadores bombeiros", a:"Anexo 9" },
  { n:"FEPC — Base de Moura", s:"Baixo Alentejo", d:"1 VCI, 5 sapadores bombeiros", a:"Anexo 9" },
  { n:"ICNF/UNM — EMR de Macedo de Cavaleiros", s:"Terras de Trás-os-Montes", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"ICNF/UNM — EMR de Vila Pouca de Aguiar", s:"Alto Tâmega e Barroso", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"ICNF/UNM — EMR de Albergaria-a-Velha", s:"Região de Aveiro", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"ICNF/UNM — EMR de Viseu", s:"Viseu Dão e Lafões", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"ICNF/UNM — EMR de Guarda", s:"Beiras e Serra da Estrela", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"ICNF/UNM — EMR de Arganil", s:"Região de Coimbra", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"ICNF/UNM — EMR de Marinha Grande", s:"Região de Leiria", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"ICNF/UNM — EMR de Santarém", s:"Lezíria do Tejo", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"ICNF/UNM — EMR de Portalegre", s:"Alto Alentejo", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"ICNF/UNM — EMR de Loulé", s:"Algarve", d:"1 equipa de máquinas de rasto da Unidade Nacional de Máquinas", a:"Anexo 12" },
  { n:"CBV Provesende", s:"Douro", d:"1 máquina de rasto", a:"Anexo 22" },
  { n:"CBV Macedo de Cavaleiros", s:"Terras de Trás-os-Montes", d:"1 máquina de rasto", a:"Anexo 22" },
  { n:"CBV Águeda", s:"Região de Aveiro", d:"1 máquina de rasto", a:"Anexo 22" },
  { n:"CBV Lourinhã", s:"Oeste", d:"1 máquina de rasto", a:"Anexo 22" },
  { n:"CBV Almoçageme", s:"Grande Lisboa", d:"1 máquina de rasto", a:"Anexo 22" },
  { n:"CBM Olhão", s:"Algarve", d:"1 máquina de rasto", a:"Anexo 22" },
  { n:"CBV Famalicenses", s:"Ave", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Lordelo", s:"Área Metropolitana do Porto", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Portuenses", s:"Área Metropolitana do Porto", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Vila Real - Cruz Verde", s:"Douro", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Gouveia", s:"Beiras e Serra da Estrela", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Coja", s:"Região de Coimbra", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Lagares da Beira", s:"Região de Coimbra", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Oliveira do Hospital", s:"Região de Coimbra", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Tábua", s:"Região de Coimbra", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Barcarena", s:"Grande Lisboa", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Sacavém", s:"Grande Lisboa", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Mafra", s:"Grande Lisboa", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Beato e Penha de França", s:"Grande Lisboa", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Alcanede", s:"Lezíria do Tejo", d:"2 veículos de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Alenquer", s:"Oeste", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Caldas da Rainha", s:"Oeste", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Peniche", s:"Oeste", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Cacilhas", s:"Península de Setúbal", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Trafaria", s:"Península de Setúbal", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Alvalade", s:"Alentejo Litoral", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Odemira", s:"Alentejo Litoral", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Santiago do Cacém", s:"Alentejo Litoral", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBM Olhão", s:"Algarve", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" },
  { n:"CBV Portimão", s:"Algarve", d:"1 veículo de transporte coletivo para rendição de grupos de reforço", a:"Anexo 23" }
];

/** As origens já escritas nesta ocorrência, sem repetições, pela ordem em que aparecem. */
function origensDaOcorrencia(){
  const v = [];
  (estObj().setores||[]).forEach(s=>(s.tip||[]).forEach(it=>{
    const e = String(it.ent||"").trim(); if(e && !v.includes(e)) v.push(e);
  }));
  return v;
}

/**
 * As opções do campo «ORIGEM»: o que já se escreveu nesta ocorrência, depois o que a
 * diretiva nomeia na sub-região do teatro de operações, depois o resto do país.
 *
 * A sub-região é a do TO e não a do posto, pela mesma razão do pacote de canais: é lá que
 * se vai operar, e pode ser qualquer uma — o posto de comando instala-se em qualquer ponto
 * do território. Sem sub-região declarada, a ordem é a da diretiva. Uma origem pode ter
 * várias linhas — o mesmo corpo de bombeiros com máquina de rasto e com transporte —, e
 * ficam as duas, porque dizem coisas diferentes.
 */
function opcoesOrigem(){
  const sub = semAcento(subregiaoTO());
  const usadas = origensDaOcorrencia().map(n=>({ n, s:"", d:"já registada nesta ocorrência", a:"" }));
  const daqui = [], resto = [];
  ORIGENS_DECIR.forEach(o=>{ (sub && semAcento(o.s)===sub? daqui : resto).push(o); });
  return usadas.concat(daqui, resto);
}

/** Enche a lista de escolha da origem; é uma só para todos os setores, e muda com o que se regista. */
function pintarOrigens(){
  const dl = $("origem-lista"); if(!dl) return;
  dl.innerHTML = opcoesOrigem().map(o=>'<option value="'+esc(o.n)+'">'
    +esc([o.s, o.d, o.a? "DON n.º 2 / DECIR 2026, "+o.a : ""].filter(Boolean).join(" · "))+'</option>').join("");
}
