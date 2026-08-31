/* ================= NÚCLEO · projeção ETRS89 / PT-TM06 (EPSG:3763) =================
   A cartografia oficial portuguesa está neste sistema, e não em Web Mercator. Não é
   escolha: é o que a Direção-Geral do Território e o ICNF publicam. O WMTS dos ortos da
   DGT tem um só conjunto de matrizes, `PTTM_06`, em EPSG:3763; a perigosidade de incêndio
   do ICNF — conjuntural do ano, áreas ardidas, locais críticos, rede primária — não existe
   em Web Mercator em serviço nenhum.

   Transversa de Mercator sobre o elipsoide GRS80, com os parâmetros do EPSG:3763. As
   séries são as de Snyder, truncadas na sexta potência, o que a esta latitude e a menos de
   300 km do meridiano central dá erro muito abaixo do milímetro — três ordens de grandeza
   abaixo da incerteza de qualquer coisa que um posto de comando desenhe.

   **Verificado antes de ser usado**, e não depois: a origem da projeção devolve exatamente
   (0, 0), e a ida e volta de um ponto do Douro fecha a nove casas decimais. Os testes
   guardam as duas provas.

   Porque não Mercator: a 41° N o Web Mercator infla as distâncias em cerca de 32 %, e num
   mapa onde se lêem distâncias de manobra isso não é detalhe. Aqui o metro do mapa é o
   metro do terreno, em toda a folha. */

/** Semi-eixo maior do GRS80, em metros. */
const TM06_A = 6378137.0;
/** Achatamento do GRS80. */
const TM06_F = 1/298.257222101;
/** Latitude da origem: 39° 40' 05,73" N. */
const TM06_LAT0 = 39 + 40/60 + 5.73/3600;
/** Meridiano central: 8° 07' 59,19" W. */
const TM06_LON0 = -(8 + 7/60 + 59.19/3600);

const TM06_E2 = TM06_F*(2-TM06_F);
const TM06_EP2 = TM06_E2/(1-TM06_E2);

/** O arco de meridiano da linha do equador até esta latitude, em metros. */
function tm06Arco(phi){
  const e2 = TM06_E2;
  return TM06_A*((1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256)*phi
    - (3*e2/8 + 3*e2*e2/32 + 45*e2*e2*e2/1024)*Math.sin(2*phi)
    + (15*e2*e2/256 + 45*e2*e2*e2/1024)*Math.sin(4*phi)
    - (35*e2*e2*e2/3072)*Math.sin(6*phi));
}
const TM06_M0 = tm06Arco(TM06_LAT0*Math.PI/180);

/**
 * De WGS84 para as coordenadas planas do PT-TM06.
 *
 * @param {number} lat graus decimais
 * @param {number} lon graus decimais
 * @returns {{E:number, N:number}} metros, com a origem no ponto fundamental
 */
function paraTM06(lat, lon){
  const p = lat*Math.PI/180, e2 = TM06_E2, ep2 = TM06_EP2;
  const sp = Math.sin(p), cp = Math.cos(p), tp = Math.tan(p);
  const N = TM06_A/Math.sqrt(1 - e2*sp*sp);
  const T = tp*tp, C = ep2*cp*cp;
  const A = (lon - TM06_LON0)*Math.PI/180 * cp;
  const A2 = A*A, A3 = A2*A, A4 = A3*A, A5 = A4*A, A6 = A5*A;
  return {
    E: N*(A + (1-T+C)*A3/6 + (5 - 18*T + T*T + 72*C - 58*ep2)*A5/120),
    N: (tm06Arco(p) - TM06_M0) + N*tp*(A2/2 + (5 - T + 9*C + 4*C*C)*A4/24
       + (61 - 58*T + T*T + 600*C - 330*ep2)*A6/720)
  };
}

/**
 * O caminho inverso: das coordenadas planas de volta a WGS84.
 *
 * @returns {{lat:number, lon:number}} graus decimais
 */
function deTM06(E, Nn){
  const e2 = TM06_E2, ep2 = TM06_EP2;
  const m = Nn + TM06_M0;
  const mu = m/(TM06_A*(1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
  const r = Math.sqrt(1-e2), e1 = (1-r)/(1+r);
  const e1_2 = e1*e1, e1_3 = e1_2*e1, e1_4 = e1_3*e1;
  const p1 = mu + (3*e1/2 - 27*e1_3/32)*Math.sin(2*mu)
    + (21*e1_2/16 - 55*e1_4/32)*Math.sin(4*mu)
    + (151*e1_3/96)*Math.sin(6*mu) + (1097*e1_4/512)*Math.sin(8*mu);
  const sp = Math.sin(p1), cp = Math.cos(p1), tp = Math.tan(p1);
  const C1 = ep2*cp*cp, T1 = tp*tp;
  const N1 = TM06_A/Math.sqrt(1 - e2*sp*sp);
  const R1 = TM06_A*(1-e2)/Math.pow(1 - e2*sp*sp, 1.5);
  const D = E/N1, D2 = D*D, D3 = D2*D, D4 = D3*D, D5 = D4*D, D6 = D5*D;
  const lat = p1 - (N1*tp/R1)*(D2/2 - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*ep2)*D4/24
    + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*ep2 - 3*C1*C1)*D6/720);
  const lon = TM06_LON0*Math.PI/180
    + (D - (1 + 2*T1 + C1)*D3/6 + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*ep2 + 24*T1*T1)*D5/120)/cp;
  return { lat: lat*180/Math.PI, lon: lon*180/Math.PI };
}
