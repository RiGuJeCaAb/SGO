/* ================= NÚCLEO · geometria do terreno ================= */
/* Um só sítio para cada conta. A conversão grau → metro, `111320·cos(lat)`, estava escrita à
   mão dezasseis vezes em oito módulos; havia duas fórmulas de distância — planar em
   quilómetros, semiverseno em metros — sem que uma remetesse para a outra; e cinco tabelas
   de rumos com três formas diferentes, uma delas só de oito pontos. Quem precisar de medir,
   deslocar ou nomear um rumo chama aqui, e o número que sai é o mesmo em todo o lado.

   A planar chega para o que se mede a menos de uns quilómetros — perfil, frentes, linhas,
   distâncias aos sensíveis; a esta escala a diferença para a esférica é de centímetros. O
   semiverseno fica para quem precise da esfera sem correção de latitude a esquecer. Qual
   das duas serve cada uso é pergunta ao #003; até lá cada sítio mantém a que tinha. */

/** Metros por grau de latitude no elipsoide, à escala a que a aplicação mede. */
const M_POR_GRAU = 111320;

/** A rosa de dezasseis pontos, na ordem dos graus: o índice vezes 22,5 é o rumo. */
const ROSA16 = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSO","SO","OSO","O","ONO","NO","NNO"];
/** A de oito pontos, a mesma de dois em dois: o índice vezes 45. */
const ROSA8 = ROSA16.filter((_, i) => i % 2 === 0);

/** Os graus de um rumo escrito, de oito ou dezasseis pontos; nulo se não for um rumo. */
function grausDoRumo(rumo){
  const i = ROSA16.indexOf(String(rumo||"").trim().toUpperCase());
  return i < 0 ? null : i*22.5;
}
/** O rumo escrito mais próximo de um ângulo, em oito ou dezasseis pontos (dezasseis por omissão). */
function rumoDoAngulo(graus, pontos){
  const rosa = pontos === 8 ? ROSA8 : ROSA16, passo = 360/rosa.length;
  const g = ((Number(graus) % 360) + 360) % 360;
  return rosa[Math.round(g/passo) % rosa.length];
}
/** O rumo oposto, na mesma rosa em que o rumo foi escrito. Vazio se não for um rumo. */
function rumoOposto(rumo){
  const g = grausDoRumo(rumo);
  return g === null ? "" : rumoDoAngulo(g+180, ROSA8.includes(String(rumo).trim().toUpperCase()) ? 8 : 16);
}

/** Metros por grau de latitude e de longitude a uma latitude dada. */
function metrosPorGrau(lat){
  return { mLat: M_POR_GRAU, mLon: M_POR_GRAU*Math.cos(lat*Math.PI/180) };
}
/**
 * O deslocamento plano de um ponto em relação a outro, em metros: `dx` para leste, `dy`
 * para norte. A longitude corrige-se pela latitude média dos dois.
 */
function deslocamentoM(latDe, lonDe, latPara, lonPara){
  const m = metrosPorGrau((latDe+latPara)/2);
  return { dx: (lonPara-lonDe)*m.mLon, dy: (latPara-latDe)*m.mLat };
}
/** Distância plana em metros, com correção de latitude. Chega a poucos quilómetros. */
function distanciaPlanaM(latA, lonA, latB, lonB){
  const d = deslocamentoM(latA, lonA, latB, lonB);
  return Math.hypot(d.dx, d.dy);
}
/**
 * Distância entre dois pontos em metros, pela fórmula do semiverseno.
 *
 * A esta escala a diferença para a planar é de centímetros, mas esta não precisa de
 * correção de latitude e não há por onde a esquecer. Arredondada ao metro.
 */
function distanciaM(lat1, lon1, lat2, lon2){
  const r = Math.PI/180, R = 6371008.8;
  const dφ = (lat2-lat1)*r, dλ = (lon2-lon1)*r;
  const a = Math.sin(dφ/2)**2 + Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dλ/2)**2;
  return Math.round(2*R*Math.asin(Math.min(1, Math.sqrt(a))));
}
/** O rumo em graus, de 0 a 360 a contar de norte, de um ponto para outro. */
function rumoGraus(latDe, lonDe, latPara, lonPara){
  const d = deslocamentoM(latDe, lonDe, latPara, lonPara);
  return (Math.atan2(d.dx, d.dy)*180/Math.PI + 360) % 360;
}
/** O ponto a uma distância em metros, num rumo em graus, a partir de outro. */
function pontoADistancia(lat, lon, graus, distM){
  const r = graus*Math.PI/180, m = metrosPorGrau(lat);
  return { lat: lat + distM*Math.cos(r)/m.mLat, lon: lon + distM*Math.sin(r)/m.mLon };
}
