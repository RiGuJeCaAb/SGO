#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
p0020 — O ambiente de fogo entra no plano.

Auditoria feita ao r0073: dos onze painéis que produzem informação, cinco não chegavam ao
PEA por via nenhuma — perfil de elevação, estimativa da propagação, intensidade da frente,
frentes traçadas, linhas de contenção — e mais três chegavam só à via do modelo de
linguagem. A aplicação calculava «acima dos 4 000 kW/m atacar diretamente a cabeça é
perigoso e inconsequente» e emitia depois um plano que dizia «postura defensiva fora da
janela», com fundamento genérico. A mesma frase sairia para um incêndio de 200 kW/m.

A causa era estrutural. Havia **dois** coletores a alimentar o plano — `retratoOperacional()`
para o dispositivo e `metricas()` para a meteorologia — e nenhum para o ambiente de fogo.
Os painéis escreviam no estado e pintavam o seu ecrã; ninguém os juntava.

Este patch acrescenta o terceiro coletor e liga-o às duas vias.

Sobre a graduação da força das propostas: tinha proposto duas forças conforme o R fosse
observado ou estimado. Retiro-a. O PEA é aprovado pelo COS (art. 27.º, n.º 1, al. a)), e é
a aprovação que confere força — não cabe à aplicação enfraquecer a sua própria proposta
para se precaver. O que lhe cabe é **pôr a qualidade da prova à vista** em cada fundamento,
para que o COS aprove sabendo o que aprova.

Entrada: r0073.html   Saída: r0074.html
"""
import re

ORIG, DEST = "r0073.html", "r0074.html"
s = open(ORIG, encoding="utf-8").read()

def troca(velho, novo, nome):
    global s
    n = s.count(velho)
    assert n == 1, "âncora %s aparece %d vezes" % (nome, n)
    s = s.replace(velho, novo, 1)
    print("  ok  %s" % nome)

# ======================================================= A. o coletor
A_V = '''/** O dispositivo numa frase: quantos setores, em que estados, com que meios. */'''
A_N = '''/* ==================================================================================
   O AMBIENTE DE FOGO

   O terceiro coletor. `retratoOperacional()` reúne o dispositivo, `metricas()` reúne a
   meteorologia, e ambos são consumidos pelo plano. Faltava quem reunisse o resto: o
   terreno, o combustível, o comportamento, o que está traçado no teatro.

   Sem ele, os painéis produziam informação que morria no ecrã onde tinha sido produzida.
   Um plano que não a cita não está fundamentado — está redigido.

   Cada grandeza vem acompanhada da **origem**. Não é adorno: o PEA é aprovado pelo COS, e
   quem aprova tem de saber se o número que sustenta uma proibição foi medido no terreno
   ou estimado a partir de um quadro que talvez esteja fora do seu domínio. A força da
   proposta vem da aprovação; a honestidade sobre a prova vem daqui.
   ================================================================================== */

/**
 * O que se sabe sobre como este fogo se comporta e onde.
 *
 * @returns {object} sempre um objeto; os ramos que não tenham dados vêm nulos, e é a
 *   ausência que depois se lê no plano como lacuna nomeada em vez de silêncio.
 */
function retratoDoFogo(){
  const D = O.dados, F = D.fogo || {r:"", w:""}, E = F.est || {};
  const num = v => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n)? n : null; };

  const rV = num(F.r), wV = num(F.w);
  const rEst = num(E.rEst);
  /* A origem lê-se da coincidência com a estimativa, e não de uma bandeira que alguém
     pudesse esquecer de baixar ao escrever por cima. Se o número no campo é o que a
     estimativa produziu, veio de lá; se foi mudado, é de quem o mudou. */
  const rOrigem = rV === null? "" : (rEst !== null && Math.abs(rV - rEst) < 0.5
    ? "estimada pelos guias de fogo controlado"
    : "observada ou declarada no teatro");

  const lim = (rV !== null && wV !== null)? limitesDeManobra(rV, wV) : null;
  const mod = E.modelo? modeloComb(E.modelo) : null;

  /* --- perfil de elevação: o declive máximo e onde está --- */
  let perfil = null;
  const P = D.perfil;
  if(P && Array.isArray(P.e) && P.e.length > 1){
    const n = P.e.length, passo = P.total*1000/(n-1);
    let dMax = 0, iMax = 0;
    for(let i=1;i<n;i++){
      const d = Math.abs((P.e[i]-P.e[i-1])/passo);
      if(d > dMax){ dMax = d; iMax = i; }
    }
    perfil = { rot:P.rot, totalKm:P.total, cotaIni:P.e[0], cotaFim:P.e[n-1],
      declMaxPc: Math.round(dMax*100), kmDeclMax: Math.round(passo*iMax/100)/10 };
    /* O salto de classe de declive. Na lei de Rothermel o fator vai com tan²φ e a
       compacidade do leito **cancela na razão entre dois declives** — logo o salto é
       independente do modelo de combustível, e pode dizer-se sem o conhecer. */
    const dRef = num(E.declive);
    if(dRef !== null && dRef >= 3 && perfil.declMaxPc >= 3){
      const k = Math.pow(Math.tan(Math.atan(perfil.declMaxPc/100)) / Math.tan(Math.atan(dRef/100)), 2);
      if(k >= 3) perfil.salto = { k: Math.round(k*10)/10, deRef:dRef, para:perfil.declMaxPc, km:perfil.kmDeclMax };
    }
  }

  /* --- o que está traçado --- */
  const fr = (Array.isArray(D.frentes)? D.frentes : []).map(f=>({
    tipo:f.tipo, m:f.m, setor:f.setor||"", rumo:f.rumo, rumoFonte:f.rumoFonte||"" }));
  const ln = (Array.isArray(D.linhas)? D.linhas : []).map(l=>({
    tipo:l.tipo, m:l.m, setor:l.setor||"", larguraM:l.larguraM,
    estreita: !!(lim && l.larguraM && l.larguraM < lim.contencao),
    semLargura: l.larguraM === null || l.larguraM === undefined }));

  /* --- o que foi detetado à volta e ainda não foi validado --- */
  const det = (D.sensDet && Array.isArray(D.sensDet.itens))? D.sensDet.itens : [];
  const texto = String(D.sensiveis||"").toLowerCase();
  const porValidar = det.filter(x=>x.sens && texto.indexOf(String(x.nome||"").toLowerCase()) < 0);

  /* --- proveniência do que se está a ver e a prever --- */
  const M = (typeof meteoObj === "function")? meteoObj() : {};
  const id = (typeof idadeMeteo === "function")? idadeMeteo() : null;
  const folhas = (typeof FOLHAS !== "undefined")
    ? FOLHAS.filter(f=>f.ver !== false && folhaCalibrada(f)).map(f=>f.nome) : [];

  return {
    modelo: mod? { c:mod.c, d:mod.d, w:mod.w, motor:mod.motor } : null,
    r: rV === null? null : { v:rV, origem:rOrigem },
    w: wV === null? null : { v:wV },
    lim, eps: E.modelo && num(E.hcm) !== null && num(E.u10) !== null && num(E.declive) !== null
      ? epsilonDosQuadros(ventoSuperficie(num(E.u10)), num(E.hcm), num(E.declive)) : null,
    hcm: num(E.hcm), hcmOrigem: E.hcmOrigem || "",
    topo: (D.topo && (D.topo.orient || D.topo.declive))? D.topo : null,
    perfil, frentes:fr, linhas:ln,
    detetados: { total:det.length, porValidar: porValidar.map(x=>x.nome+" a "+x.dist+" m") },
    carta: {
      servico: (typeof CARTA !== "undefined" && CARTA)? (CARTA.atrib || CARTA.tipo || "declarado") : "",
      local: (typeof CARTA_LOCAL !== "undefined" && CARTA_LOCAL)? (CARTA_LOCAL.atrib || "sem origem declarada") : "",
      folhas
    },
    previsao: { fonte:M.fonte||"", modelo:M.modelo||"", g:M.g||"",
      idadeH: id? Math.round(id.h*10)/10 : null, velha: !!(id && id.velha) }
  };
}

/**
 * O ambiente de fogo numa passagem, para entrar na análise da zona de intervenção.
 *
 * Diz o que se sabe **e o que falta**. Uma análise que se cala sobre a intensidade lê-se
 * como se a intensidade não importasse; uma que diz que falta o combustível manda alguém
 * ir buscá-lo.
 */
function resumoDoFogo(f){
  const p = [];
  if(f.modelo) p.push("Combustível: " + f.modelo.c + " — " + f.modelo.d.toLowerCase()
    + (f.modelo.w[0] !== null? ", carga fina de " + String(f.modelo.w[0]).replace(".", ",")
       + " a " + String(f.modelo.w[1]).replace(".", ",") + " t/ha" : "") + ".");
  else p.push("Modelo de combustível por identificar: sem ele não há carga nem propagação estimável.");

  if(f.lim && f.r) p.push("Comportamento: " + Math.round(f.r.v) + " m/h ("
    + f.r.origem + ") sobre " + f.w.v + " t/ha dão " + Math.round(f.lim.i).toLocaleString("pt-PT")
    + " kW/m de intensidade frontal e chama de " + f.lim.chama.toFixed(1).replace(".", ",")
    + " m (Byram 1959). " + f.lim.classe.t);
  else p.push("Intensidade da frente por determinar: falta "
    + (!f.r? "a velocidade de propagação" : "") + (!f.r && !f.w? " e " : "")
    + (!f.w? "a carga consumida" : "") + ".");

  if(f.topo) p.push("Terreno: encostas dominantes a " + (f.topo.orient||"—")
    + (f.topo.declive? ", declive " + f.topo.declive : "")
    + (f.topo.obs? " (" + f.topo.obs + ")" : "") + ".");

  if(f.perfil) p.push("Perfil segundo " + f.perfil.rot + " ao longo de "
    + f.perfil.totalKm.toFixed(1).replace(".", ",") + " km: de " + Math.round(f.perfil.cotaIni)
    + " a " + Math.round(f.perfil.cotaFim) + " m, com declive máximo de "
    + f.perfil.declMaxPc + " % a " + String(f.perfil.kmDeclMax).replace(".", ",") + " km.");

  if(f.previsao.idadeH !== null) p.push("Previsão de " + (f.previsao.fonte || "origem não declarada")
    + (f.previsao.modelo? " (" + f.previsao.modelo + ")" : "") + ", obtida há "
    + String(f.previsao.idadeH).replace(".", ",") + " h"
    + (f.previsao.velha? " — DESATUALIZADA, confirmar antes de decidir sobre ela." : "."));
  else p.push("Sem previsão carregada: a análise meteorológica desta proposta está em falta.");

  const c = [];
  if(f.carta.servico) c.push("serviço declarado: " + f.carta.servico);
  if(f.carta.local) c.push("carta pré-descarregada: " + f.carta.local);
  if(f.carta.folhas.length) c.push("folha(s) calibrada(s): " + f.carta.folhas.join("; "));
  p.push(c.length? "Cartografia em uso — " + c.join("; ") + "."
    : "Sem cartografia declarada: as posições deste plano não têm base cartográfica identificada.");

  return p.join(" ");
}

/** O dispositivo numa frase: quantos setores, em que estados, com que meios. */'''
troca(A_V, A_N, "A · retratoDoFogo e resumoDoFogo")

# ================================================ B. contexto do modelo
B_V = '''MÉTRICAS METEOROLÓGICAS CALCULADAS (usa exatamente estes valores; nunca recalcules):
${JSON.stringify(metricas())}`;
}'''
B_N = '''MÉTRICAS METEOROLÓGICAS CALCULADAS (usa exatamente estes valores; nunca recalcules):
${JSON.stringify(metricas())}
AMBIENTE DE FOGO — terreno, combustível, comportamento e o que está traçado no teatro
(usa exatamente estes valores; nunca recalcules; cada proposta que dependa de um deles tem
de o citar no fundamento, com a origem que vem indicada):
${JSON.stringify(retratoDoFogo())}`;
}'''
troca(B_V, B_N, "B · o ambiente de fogo vai ao modelo")

B2_V = '''"propostas":[{"id":"P1","texto":"prioridade tática","fundamento":"1 frase ligada às métricas ou à evolução"} 5 a 7 itens por ordem de prioridade — mantém do PEA anterior o que continua válido, altera o que a evolução mudou],'''
B2_N = '''"propostas":[{"id":"P1","texto":"prioridade tática","fundamento":"1 frase ligada a um facto do contexto — métrica meteorológica, ambiente de fogo ou registo de evolução — com o valor e a origem"} 5 a 7 itens por ordem de prioridade — mantém do PEA anterior o que continua válido, altera o que a evolução mudou; se a intensidade da frente for conhecida, a primeira proposta tem de decorrer dela],'''
troca(B2_V, B2_N, "B2 · o fundamento passa a exigir facto e origem")

# ========================================= C. análise das ZI determinística
C_V = '''    analise_zi: `Área de ${O.dados.area||"?"} ha com pontos sensíveis: ${O.dados.sensiveis||"a identificar"}. `
      +(ptObj().des? `Ponto de trânsito em ${ptObj().des}${ptObj().resp? ", responsável "+ptObj().resp:""}. ` : "")+(m.janela? `A meteorologia concentra a vantagem operacional na janela ${m.janela.inicio}–${m.janela.fim}; fora dela, contenção e defesa.` : "Sem janela de HR ≥ 50 %: postura defensiva contínua.")'''
C_N = '''    analise_zi: `Área de ${O.dados.area||"?"} ha com pontos sensíveis: ${O.dados.sensiveis||"a identificar"}. `
      +(ptObj().des? `Ponto de trânsito em ${ptObj().des}${ptObj().resp? ", responsável "+ptObj().resp:""}. ` : "")+(m.janela? `A meteorologia concentra a vantagem operacional na janela ${m.janela.inicio}–${m.janela.fim}; fora dela, contenção e defesa.` : "Sem janela de HR ≥ 50 %: postura defensiva contínua.")
      + " " + resumoDoFogo(retratoDoFogo())'''
troca(C_V, C_N, "C · o ambiente de fogo na análise das ZI")

# ================================================ D. propostas determinísticas
D_V = '''function detDecisao(novas, anterior){
  const m=metricas(), jan=m.janela, r=retratoOperacional(), dif=diferencasDesde(anterior);'''
D_N = '''function detDecisao(novas, anterior){
  const m=metricas(), jan=m.janela, r=retratoOperacional(), dif=diferencasDesde(anterior);
  /* O ambiente de fogo entra aqui com o mesmo estatuto do dispositivo e da meteorologia.
     As propostas que dele saem vêm **à frente** das genéricas: a intensidade da frente
     decide se há sequer ataque à cabeça, e essa decisão precede a ordem de esforço. */
  const F = retratoDoFogo();'''
troca(D_V, D_N, "D · o coletor entra na decisão")

D2_V = '''    propostas:[
      r.reativados.length&&{id:"PR",'''
D2_N = '''    propostas:[
      /* Limite de manobra antes de tudo o resto. O número existe, tem fonte e tem origem
         declarada; deixá-lo fora do plano para repetir uma regra genérica era a falha que
         este patch corrige. */
      (F.lim && !F.lim.direto)&&{id:"PI",
        texto:`Interdição de ataque direto à cabeça: a intensidade frontal estimada é de ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m. `
          +`Ataque à cabeça apenas por meios aéreos ou indiretamente, com ancoragem pelos flancos e pela retaguarda. `
          +`Ninguém a menos de ${F.lim.seguranca} m da frente de chamas.`,
        fundamento:`${Math.round(F.r.v)} m/h (${F.r.origem}) sobre ${F.w.v} t/ha dão ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m e chama de ${F.lim.chama.toFixed(1).replace(".", ",")} m — acima dos 4 000 kW/m o controlo frontal é impossível (Alexander 2000, via Fernandes 2003); DON n.º 2, Anexo 3, situação n.º 10.`},
      (F.lim && F.lim.direto && F.lim.i >= 2000)&&{id:"PI",
        texto:`Ataque à cabeça com apoio de meios aéreos; vigilância permanente de focos secundários a sotavento, com equipa dedicada.`,
        fundamento:`Intensidade frontal de ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m (${Math.round(F.r.v)} m/h, ${F.r.origem}): acima dos 2 000 kW/m a projeção de faúlhas é expectável e acima dos 4 000 o fogo de copas é quase certo (Alexander 2000).`},
      (F.lim && F.lim.direto && F.lim.i >= 500 && F.lim.i < 2000)&&{id:"PI",
        texto:`Ataque direto à cabeça admissível com meios terrestres sob pressão de água; máquinas de rasto em apoio à abertura de faixas, com veículo de combate a acompanhar cada máquina.`,
        fundamento:`Intensidade frontal de ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m (${Math.round(F.r.v)} m/h, ${F.r.origem}): entre 500 e 2 000 kW/m os meios terrestres são eficazes (Alexander 2000, via Fernandes 2003).`},
      (F.lim && F.lim.i < 500)&&{id:"PI",
        texto:`Supressão com equipamento de sapador nas frentes de menor intensidade; reservar os meios com água para os troços de maior desenvolvimento.`,
        fundamento:`Intensidade frontal de ${Math.round(F.lim.i).toLocaleString("pt-PT")} kW/m — abaixo dos 500 kW/m o equipamento manual é eficaz (Alexander 2000).`},
      (F.perfil && F.perfil.salto)&&{id:"PQ",
        texto:`Suspender a validade da previsão de propagação a partir da quebra de ${F.perfil.salto.para} % a ${String(F.perfil.salto.km).replace(".", ",")} km segundo ${F.perfil.rot}; reconhecimento obrigatório antes de empenhar meios para lá desse ponto.`,
        fundamento:`Passar de ${F.perfil.salto.deRef} % para ${F.perfil.salto.para} % multiplica a componente de declive por cerca de ${String(F.perfil.salto.k).replace(".", ",")}. A razão entre declives é independente do modelo de combustível, pelo que o salto é afirmável mesmo sem ele.`},
      (F.lim && F.linhas.some(l=>l.estreita))&&{id:"PL",
        texto:`Alargar as linhas de contenção com menos de ${String(F.lim.contencao).replace(".", ",")} m de largura útil antes de as considerar ancoragem: ${F.linhas.filter(l=>l.estreita).map(l=>(l.setor? "setor "+l.setor+", ":"")+String(l.larguraM).replace(".", ",")+" m").join("; ")}.`,
        fundamento:`Uma linha de contenção precisa de pelo menos uma vez e meia o comprimento da chama (${F.lim.chama.toFixed(1).replace(".", ",")} m), e só se não houver projeção de faúlhas com capacidade de ignição (Byram 1959).`},
      (F.linhas.some(l=>l.semLargura))&&{id:"PW",
        texto:`Declarar a largura útil das linhas já traçadas sem dimensão indicada${F.linhas.filter(l=>l.semLargura).some(l=>l.setor)? " ("+F.linhas.filter(l=>l.semLargura&&l.setor).map(l=>"setor "+l.setor).join(", ")+")":""}: sem largura não é possível aferir se servem de ancoragem.`,
        fundamento:"Linhas traçadas no teatro sem largura útil registada; a largura decide se a linha suporta a frente ou se apenas a atrasa."},
      (F.frentes.some(f=>f.rumoFonte === "sugerido pelo traçado"))&&{id:"PN",
        texto:`Confirmar por observação o rumo de progressão das frentes cujo rumo foi deduzido do traçado antes de fixar a ordem de esforço.`,
        fundamento:`${F.frentes.filter(f=>f.rumoFonte === "sugerido pelo traçado").length} frente(s) com rumo sugerido pela geometria e não observado; a ordem de esforço assenta na direção de progressão.`},
      (F.detetados.porValidar.length)&&{id:"PS",
        texto:`Validar com o ERAS os pontos sensíveis detetados e ainda não constantes do plano: ${F.detetados.porValidar.slice(0,4).join("; ")}${F.detetados.porValidar.length>4? " e mais "+(F.detetados.porValidar.length-4):""}.`,
        fundamento:"Instalações sensíveis identificadas na deteção cartográfica e ausentes do campo de pontos sensíveis — art. 27.º, n.º 1, al. b)."},
      r.reativados.length&&{id:"PR",'''
troca(D2_V, D2_N, "D2 · propostas fundadas no ambiente de fogo")

# ============================================= E. segurança com números
E_V = '''    seguranca:["Protocolo LACES e EPI florestal obrigatórios em todos os setores.",
      "Proibição de ataque direto descendente em encosta com catabático estabelecido sem rota de fuga confirmada.",'''
E_N = '''    seguranca:["Protocolo LACES e EPI florestal obrigatórios em todos os setores.",
      /* A distância deixa de ser princípio e passa a ser número. É a diferença entre uma
         medida que se lê e uma que se cumpre. */
      ...(F.lim? [`Distância mínima à frente de chamas: ${F.lim.seguranca} m — quatro vezes a altura da chama, para a tolerância de 7 kW/m² de radiação incidente (Butler e Cohen 1998).`] : []),
      ...(F.lim && !F.lim.direto? [`Intensidade frontal acima dos 4 000 kW/m: nenhuma equipa à frente da cabeça, em nenhuma circunstância. Reavaliar se a intensidade descer.`] : []),
      ...(F.lim && F.lim.i >= 2000? [`Projeção de faúlhas expectável acima dos 2 000 kW/m: vigia dedicado a sotavento e reconhecimento periódico da retaguarda.`] : []),
      "Proibição de ataque direto descendente em encosta com catabático estabelecido sem rota de fuga confirmada.",'''
troca(E_V, E_N, "E · segurança com a distância calculada")

# ============================================= F. revisão
carimbo = "202608312330"
novo = "CSREPCDouro_r0074_%s_EstacaoPEA_CLD.html" % carimbo
s = s.replace('protótipo <b>r0073</b>', 'protótipo <b>r0074</b>', 1)
s = re.sub(r'CSREPCDouro_r0073_\d+_EstacaoPEA_CLD\.html', novo, s)
s = s.replace('const REVISAO_APP = "r0073"', 'const REVISAO_APP = "r0074"', 1)
print("  ok  F · revisão r0074")

open(DEST, "w", encoding="utf-8").write(s)
print("\nescrito %s (%d bytes)" % (DEST, len(s.encode("utf-8"))))
print("nome final: %s" % novo)
