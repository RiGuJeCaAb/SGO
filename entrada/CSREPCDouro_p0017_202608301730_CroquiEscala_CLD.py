#!/usr/bin/env python3
"""
p0017 — o croqui só aparece quando há croqui, e a escala deixa de rebentar
CSREPC Douro · Estação PEA · sem alteração à versão de estado

Dois defeitos meus, do p0016, vistos em uso real e não nos testes:

  1  Com apenas o ponto da ocorrência, a caixa envolvente tem dimensão zero. A escala
     divide por essa dimensão e a barra sai com 33 234 px numa tela de 640: atravessa
     o desenho todo e o rótulo fica fora da imagem. Os meus testes usavam sempre um
     perímetro, e por isso nunca tocaram neste caso.

  2  Um triângulo sozinho não é um croqui. A caixa ocupava mais de quinhentos pixéis
     de altura para mostrar um ponto e uma barra partida, e empurrava para baixo a
     linha que diz que não há perímetro carregado. Menos é melhor: sem perímetro e sem
     deteção, não há nada para desenhar e não se desenha.

  A  Extensão mínima de 2 km. Uma caixa degenerada, ou muito pequena, abre-se em torno
     do seu centro até dar uma escala com significado.
  B  O croqui só se desenha com perímetro ou com pelo menos um ponto detetado.
  C  A proporção segue o conteúdo em vez de ser sempre 640×400, e a altura tem tecto:
     um incêndio comprido e estreito deixa de vir dentro de um quadrado com margens
     enormes.
  D  A barra de escala nunca passa de um terço da largura, aconteça o que acontecer aos
     dados. Um limite que não depende de o cálculo estar certo.
"""
import io, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "r0062.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "r0063.html"

s = io.open(SRC, encoding="utf-8").read()
N = [0]

def troca(ancora, novo, nome):
    global s
    c = s.count(ancora)
    assert c == 1, "[%s] ancora encontrada %d vezes, esperava 1:\n%s" % (nome, c, ancora[:180])
    s = s.replace(ancora, novo, 1)
    N[0] += 1
    print("  ok  " + nome)

# ═══════════════════════════════════════════════════════════════════
# B — nada para desenhar, nada desenhado
# ═══════════════════════════════════════════════════════════════════
troca(
    '''  const P = perimObj();
  const lat0 = parseFloat(String(O.meta.lat).replace(",",".")),
        lon0 = parseFloat(String(O.meta.lon).replace(",","."));
  const temPonto = isFinite(lat0) && isFinite(lon0);
  if(!P && !temPonto) return "";''',
    '''  const P = perimObj();
  const lat0 = parseFloat(String(O.meta.lat).replace(",",".")),
        lon0 = parseFloat(String(O.meta.lon).replace(",","."));
  const temPonto = isFinite(lat0) && isFinite(lon0);
  const det = (O.dados.sensDet && Array.isArray(O.dados.sensDet.itens)) ? O.dados.sensDet.itens : [];
  /* Um triângulo sozinho não é um croqui: sem perímetro e sem nada detetado à volta
     não há forma nem dimensão para mostrar, e a caixa só ocupava espaço. */
  if(!P && !det.length) return "";
  if(!P && !temPonto) return "";''',
    "B1 sem perímetro nem deteção não se desenha"
)

# ═══════════════════════════════════════════════════════════════════
# A + C — extensão mínima e proporção pelo conteúdo
# ═══════════════════════════════════════════════════════════════════
troca(
    '''  const sens = (O.dados.sensDet && Array.isArray(O.dados.sensDet.itens)) ? O.dados.sensDet.itens : [];
  const marcas = [];
  if(temPonto) sens.forEach(x=>{''',
    '''  const marcas = [];
  const sens = det;
  if(temPonto) sens.forEach(x=>{''',
    "A1 a lista de deteções já foi lida acima"
)

troca(
    '''  const latM = (minLat+maxLat)/2;
  const mLat = 111320, mLon = 111320*Math.cos(latM*Math.PI/180);
  const lgM = Math.max(1, (maxLon-minLon)*mLon), alM = Math.max(1, (maxLat-minLat)*mLat);
  const marg = 34;
  const esc = Math.min((larg-2*marg)/lgM, (alt-2*marg)/alM);''',
    '''  const latM = (minLat+maxLat)/2;
  const mLat = 111320, mLon = 111320*Math.cos(latM*Math.PI/180);

  /* Extensão mínima. Uma caixa envolvente degenerada — um ponto só, ou um perímetro
     de poucas dezenas de metros — fazia a escala dividir por quase zero, e a barra
     saía com dezenas de milhares de pixéis numa tela de seiscentos. Abre-se em torno
     do centro até dar dois quilómetros, que é a menor extensão em que uma escala
     ainda diz alguma coisa a quem lê. */
  const MIN_M = 2000;
  const abrir = (min, max, metrosPorGrau) => {
    const atual = (max-min)*metrosPorGrau;
    if(atual >= MIN_M) return [min, max];
    const c = (min+max)/2, meio = (MIN_M/2)/metrosPorGrau;
    return [c-meio, c+meio];
  };
  [minLon, maxLon] = abrir(minLon, maxLon, mLon);
  [minLat, maxLat] = abrir(minLat, maxLat, mLat);

  const lgM = Math.max(1, (maxLon-minLon)*mLon), alM = Math.max(1, (maxLat-minLat)*mLat);
  const marg = 34;
  /* A proporção segue o conteúdo: um incêndio comprido e estreito deixa de vir dentro
     de um quadrado com margens enormes. A altura é limitada para o croqui não passar
     a ocupar meio painel. */
  alt = Math.round(Math.max(200, Math.min(alt, (larg-2*marg) * (alM/lgM) + 2*marg)));
  const esc = Math.min((larg-2*marg)/lgM, (alt-2*marg)/alM);''',
    "A2 extensão mínima e proporção pelo conteúdo"
)

# ═══════════════════════════════════════════════════════════════════
# D — a barra de escala tem tecto, aconteça o que acontecer
# ═══════════════════════════════════════════════════════════════════
troca(
    '''function escalaRedonda(metrosPorPx, larguraPx){
  const alvo = metrosPorPx * larguraPx * 0.28;
  const passos = [100,200,500,1000,2000,5000,10000,20000,50000,100000];
  const m = passos.find(x=>x>=alvo) || passos[passos.length-1];
  return { m, px: m/metrosPorPx, rot: m>=1000? (m/1000)+" km" : m+" m" };
}''',
    '''function escalaRedonda(metrosPorPx, larguraPx){
  const alvo = metrosPorPx * larguraPx * 0.28;
  const passos = [10,20,50,100,200,500,1000,2000,5000,10000,20000,50000,100000];
  /* O primeiro passo redondo que não ultrapasse um terço da largura. O tecto não
     depende de o alvo estar certo: mesmo com uma escala absurda, a barra continua
     dentro do desenho e com rótulo à vista. */
  const tecto = larguraPx/3;
  let m = passos.find(x=>x>=alvo && x/metrosPorPx<=tecto);
  if(m===undefined){
    const cabem = passos.filter(x=>x/metrosPorPx<=tecto);
    m = cabem.length? cabem[cabem.length-1] : passos[0];
  }
  return { m, px: Math.min(m/metrosPorPx, tecto), rot: m>=1000? (m/1000)+" km" : m+" m" };
}''',
    "D1 barra de escala com tecto"
)

# a altura real do SVG determina o viewBox e a caixa
troca(
    "  return '<svg viewBox=\"0 0 '+larg+' '+alt+'\" width=\"100%\" xmlns=\"http://www.w3.org/2000/svg\" '",
    "  return '<svg viewBox=\"0 0 '+larg+' '+alt+'\" width=\"100%\" preserveAspectRatio=\"xMidYMid meet\" xmlns=\"http://www.w3.org/2000/svg\" '",
    "C1 proporção preservada"
)

troca(
    "  .croqui svg{display:block}",
    "  .croqui svg{display:block;max-height:340px;margin:0 auto}",
    "C2 tecto de altura no ecrã"
)

io.open(DST, "w", encoding="utf-8").write(s)
print("\n%d correcções aplicadas · %s" % (N[0], DST))
