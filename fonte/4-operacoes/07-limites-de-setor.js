/* ================= OPERAÇÕES · limites de setor =================
   Até aqui o setor tinha um ponto e mais nada. Na carta que o posto anota à mão o setor
   tem **limite traçado** — na de Cabeça Boa, o Alfa e o Bravo estão separados por uma
   linha que segue o terreno —, e um ponto não diz onde acaba a responsabilidade de quem
   comanda um nem começa a do outro.

   O limite é do setor, e o setor é de Operações: art. 17.º, n.º 1, als. a) e d) do
   Despacho n.º 4067/2024 atribui-lhe a setorização e as forças atribuídas. Desenha-se no
   mapa, que é de Planeamento, mas quem o possui é quem o pode alterar. */

/**
 * O limite traçado de um setor, ou `null` se não tiver.
 *
 * Guardado como anel de pares `[lon, lat]`, fechado — o último ponto repete o primeiro —,
 * que é a convenção do GeoJSON e a mesma do perímetro da zona de intervenção. Assim a
 * área calcula-se com a função que já existe, e o limite exporta-se sem conversão.
 */
function limiteSetor(i){
  const e = estObj(), s = e.setores && e.setores[i];
  const a = s && s.limite;
  return (Array.isArray(a) && a.length >= 4) ? a : null;
}

/** Um anel fechado a partir dos vértices traçados, ou `null` se forem poucos. */
function anelFechado(pontos){
  if(!Array.isArray(pontos) || pontos.length < 3) return null;
  const a = pontos.map(p=>[+p[0], +p[1]]);
  const p0 = a[0], pn = a[a.length-1];
  if(p0[0] !== pn[0] || p0[1] !== pn[1]) a.push([p0[0], p0[1]]);
  return a.length >= 4 ? a : null;
}

/**
 * A área de um setor, em hectares.
 *
 * Reaproveita `areaGeoJSON` embrulhando o anel num polígono, em vez de repetir a conta.
 * Duas contas de área em dois sítios seriam duas contas a divergir — e já houve uma
 * divergência dessas neste projeto, entre a área do croqui e a do mapa.
 */
function areaSetorHa(i){
  const a = limiteSetor(i);
  return a ? areaGeoJSON({ type:"Polygon", coordinates:[a] }) : 0;
}

/**
 * O centro de massa de um anel, para lá pousar o rótulo.
 *
 * Não é a média dos vértices: num limite com um lado muito subdividido a média puxa o
 * rótulo para esse lado e ele sai fora da figura. É o centróide da área, que num polígono
 * simples cai sempre dentro de formas convexas e quase sempre dentro das outras.
 */
function centroAnel(anel){
  if(!Array.isArray(anel) || anel.length < 4) return null;
  let a2 = 0, cx = 0, cy = 0;
  for(let i=0;i<anel.length-1;i++){
    const [x1,y1] = anel[i], [x2,y2] = anel[i+1];
    const f = x1*y2 - x2*y1;
    a2 += f; cx += (x1+x2)*f; cy += (y1+y2)*f;
  }
  /* Um anel de área nula — todos os vértices em linha — não tem centróide. Aí serve a
     média, que é o melhor que há e não divide por zero. */
  if(Math.abs(a2) < 1e-12){
    const n = anel.length - 1;
    return { lon: anel.slice(0,n).reduce((t,p)=>t+p[0],0)/n, lat: anel.slice(0,n).reduce((t,p)=>t+p[1],0)/n };
  }
  return { lon: cx/(3*a2), lat: cy/(3*a2) };
}

/**
 * Este ponto cai dentro deste limite?
 *
 * Lançamento de raio para leste, contando travessias. É a pergunta de que a previsão vai
 * precisar — «que setores é que a frente atinge» —, e por isso fica aqui já, junto do
 * limite, e não no módulo que a vier a fazer.
 */
function dentroDoAnel(anel, lat, lon){
  if(!Array.isArray(anel) || anel.length < 4) return false;
  let dentro = false;
  for(let i=0, j=anel.length-2; i<anel.length-1; j=i++){
    const [xi, yi] = anel[i], [xj, yj] = anel[j];
    if((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** O setor em cujo limite este ponto cai, ou -1. O primeiro que o contenha. */
function setorDoPonto(lat, lon){
  const e = estObj();
  for(let i=0;i<(e.setores||[]).length;i++){
    const a = limiteSetor(i);
    if(a && dentroDoAnel(a, lat, lon)) return i;
  }
  return -1;
}

/* ---- o traçado, que é estado da vista e não da ocorrência ----
   Enquanto se está a traçar não há figura nenhuma: há vértices pousados. Só ao fechar é
   que aquilo entra no estado da ocorrência, e é por isso que isto não se grava — um
   traçado a meio não é um facto sobre o incêndio.

   Serve três desenhos e não um: o limite de setor, que é anel fechado e precisa de três
   vértices, e a linha de frente e a de contenção, que são abertas e chegam-lhes dois. O que
   muda entre eles é o mínimo e o que se faz ao fechar; o pousar, o desfazer e o largar são
   os mesmos, e três traçados quase iguais em três sítios acabariam a divergir. */
const TRACO = { tipo:"", setor:-1, pontos:[] };

/** O número mínimo de vértices de cada espécie de traçado. */
const TRACO_MIN = { limite:3, frente:2, linha:2 };

/** Começa a traçar, do zero. `tipo` é `"limite"` ou `"frente"`. */
function iniciarTraco(i, tipo){
  const t = tipo || "limite";
  if(!TRACO_MIN[t]) return { ok:false, motivo:"Espécie de traçado desconhecida." };
  const e = estObj();
  /* Uma frente pode não pertencer a setor nenhum — `i` a -1 —, um limite pertence sempre. */
  if(t === "limite" && (!e.setores || !e.setores[i]))
    return { ok:false, motivo:"Setor não encontrado." };
  TRACO.tipo = t; TRACO.setor = i; TRACO.pontos = [];
  return { ok:true };
}

/** Está a decorrer um traçado? */
function tracoEmCurso(){ return !!TRACO.tipo; }

/** Larga o traçado em curso sem gravar nada. */
function largarTraco(){ TRACO.tipo = ""; TRACO.setor = -1; TRACO.pontos = []; }

/** Quantos vértices faltam para o traçado em curso poder fechar. Zero: já pode. */
function faltamAoTraco(){
  if(!TRACO.tipo) return 0;
  return Math.max(0, TRACO_MIN[TRACO.tipo] - TRACO.pontos.length);
}

/** Pousa um vértice no traçado em curso. */
function pontoDoTraco(lat, lon){
  if(!TRACO.tipo) return { ok:false, motivo:"Não há traçado em curso." };
  TRACO.pontos.push([+lon.toFixed(6), +lat.toFixed(6)]);
  return { ok:true, n:TRACO.pontos.length };
}

/** Retira o último vértice pousado. Traçar à mão é errar, e errar corrige-se. */
function desfazerTraco(){
  if(!TRACO.tipo || !TRACO.pontos.length) return { ok:false, motivo:"Não há vértice para retirar." };
  TRACO.pontos.pop();
  return { ok:true, n:TRACO.pontos.length };
}

/**
 * Fecha o traçado e grava-o como limite do setor.
 *
 * É aqui, e só aqui, que o traçado passa a facto: entra no estado, entra na evolução com
 * a área que passou a ter, e o traçado da vista desaparece.
 */
function fecharTraco(){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de traçar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  if(TRACO.tipo === "frente") return fecharFrente();
  if(TRACO.tipo === "linha") return fecharLinha();
  const i = TRACO.setor;
  if(TRACO.tipo !== "limite" || i < 0) return { ok:false, motivo:"Não há traçado em curso." };
  const anel = anelFechado(TRACO.pontos);
  if(!anel) return { ok:false, motivo:"Um limite precisa de pelo menos três vértices." };
  const e = estObj(), s = e.setores[i];
  if(!s) return { ok:false, motivo:"Setor não encontrado." };
  s.limite = anel;
  const ha = areaSetorHa(i);
  O.evolucao.push({ g:gdhAgora(), tipo:"posit",
    txt:"Limite do setor "+NOMES_SETOR[i]+" traçado: "+(anel.length-1)+" vértices, "+ha+" ha." });
  fita("Limite do setor "+NOMES_SETOR[i]+" traçado ("+ha+" ha)");
  largarTraco();
  return { ok:true, setor:s, area:ha };
}

/** Retira o limite de um setor. Um limite errado também é facto que se corrige. */
function apagarLimite(i){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de alterar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const e = estObj(), s = e.setores && e.setores[i];
  if(!s || !limiteSetor(i)) return { ok:false, motivo:"Esse setor não tem limite traçado." };
  s.limite = [];
  O.evolucao.push({ g:gdhAgora(), tipo:"posit", txt:"Retirado o limite do setor "+NOMES_SETOR[i]+"." });
  fita("Retirado o limite do setor "+NOMES_SETOR[i]);
  return { ok:true };
}

/** A soma das áreas dos setores com limite, em hectares. */
function areaSetorizadaHa(){
  const e = estObj();
  return (e.setores||[]).reduce((t,_,i)=>t + areaSetorHa(i), 0);
}
