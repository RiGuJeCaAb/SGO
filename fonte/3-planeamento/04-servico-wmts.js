/* ================= PLANEAMENTO · leitura de um serviço WMTS =================
   **O modelo `{z}/{x}/{y}` é uma convenção do OpenStreetMap, não uma norma.** A primeira
   versão do mapa pedia um endereço nessa forma, e isso deixava de fora exatamente a
   cartografia que interessa a um posto de comando português: a Direção-Geral do
   Território, como as suas congéneres europeias, publica **OGC WMTS**, que é outra coisa.

   Três diferenças que faziam do campo anterior uma fechadura sem chave:

   1. **A ordem está trocada.** O WMTS endereça por `TileRow`/`TileCol` — a linha antes da
      coluna, ou seja **y antes de x**. O contrário do XYZ.
   2. **O nível não é um número.** O `TileMatrix` chama-se muitas vezes `EPSG:3857:10` ou
      `GoogleMapsCompatible:10`, e há serviços que lhe dão nomes.
   3. **A projeção pode não ser Mercator.** Muita cartografia oficial portuguesa vem em
      ETRS89 / PT-TM06 (EPSG:3763). Desenhá-la com a aritmética de Mercator punha tudo no
      sítio errado, e em silêncio — que é o pior modo de errar num mapa operacional.

   A saída não é adivinhar endereços: é **perguntar ao serviço**. O documento
   `GetCapabilities` declara, com autoridade, que camadas existem, em que conjuntos de
   matrizes, com que formatos, por que endereços e com que atribuição. Este módulo lê-o.

   Lê-se de um endereço ou de um ficheiro guardado. Do ficheiro porque um posto de comando
   trabalha sem rede, e porque assim a escolha do serviço se prepara no gabinete. */

/**
 * O denominador de escala do nível 0 do Web Mercator, com mosaicos de 256 px.
 *
 * O WMTS não fala em níveis de ampliação: fala em escalas. A ponte entre os dois é o
 * **pixel normalizado da OGC, de 0,28 mm** — multiplicando este denominador por 0,00028 dá
 * 156 543 m por pixel, que é exatamente a resolução do nível 0 do Web Mercator no equador,
 * a mesma constante que o mapa usa. Um teste confere que os dois mundos continuam a bater.
 */
const WMTS_ESCALA_0 = 559082264.0287178;
/** O canto superior esquerdo do Web Mercator, em metros. */
const WMTS_TOPO_3857 = 20037508.342789244;

/* ---- leitura do XML ----
   Percorre-se por `localName`, e não por nome qualificado. Um WMTS mistura os espaços de
   nomes `wmts` e `ows`, e cada serviço escolhe os seus prefixos: procurar por `wmts:Layer`
   funciona num e falha no seguinte. O nome local é o mesmo em todos. */

/** Os filhos diretos com este nome local. */
function wmtsFilhos(el, nome){
  return el? [...el.children].filter(x=>x.localName === nome) : [];
}
/** O texto do primeiro filho com este nome local, ou vazio. */
function wmtsTexto(el, nome){
  const c = wmtsFilhos(el, nome)[0];
  return c? c.textContent.trim() : "";
}
/** Todos os descendentes com este nome local, a qualquer profundidade. */
function wmtsTodos(el, nome){
  return el? [...el.getElementsByTagName("*")].filter(x=>x.localName === nome) : [];
}

/**
 * A que nível de ampliação do Web Mercator corresponde este denominador de escala.
 *
 * Deriva-se da escala e **não do nome da matriz**, que pode ser `EPSG:3857:10`, `10` ou
 * uma palavra. A escala é um número que significa sempre o mesmo; o nome é uma escolha
 * de quem publicou o serviço.
 *
 * @returns {number|null} o nível, ou nada se não cair num nível inteiro
 */
function wmtsNivelDe(escalaDenominador){
  const e = Number(escalaDenominador);
  if(!isFinite(e) || e <= 0) return null;
  const z = Math.log2(WMTS_ESCALA_0 / e);
  const inteiro = Math.round(z);
  return Math.abs(z - inteiro) < 0.01 && inteiro >= 0 && inteiro <= 25 ? inteiro : null;
}

/** O código do sistema de coordenadas, seja qual for a forma em que venha escrito. */
function wmtsCRS(txt){
  const t = String(txt||"").trim();
  const m = /(?:^|[:/])(\d{4,6})$/.exec(t);          /* urn:ogc:def:crs:EPSG::3857, EPSG:3857 */
  return m? "EPSG:"+m[1] : t;
}

/**
 * Lê um documento GetCapabilities de WMTS 1.0.0.
 *
 * @param {string} xml o documento, tal como o serviço o devolve
 * @returns {{titulo:string, atribuicao:string, termos:string, kvp:string,
 *   conjuntos:Object, camadas:any[]}}
 * @throws quando o documento não é um GetCapabilities de WMTS
 */
function lerCapacidadesWMTS(xml){
  const doc = new DOMParser().parseFromString(String(xml||""), "text/xml");
  const erro = doc.getElementsByTagName("parsererror")[0];
  if(erro) throw new Error("O documento não é XML válido.");
  const raiz = doc.documentElement;
  if(!raiz || raiz.localName !== "Capabilities")
    throw new Error("Não é um GetCapabilities de WMTS (raiz «"+(raiz? raiz.localName : "vazia")+"»).");

  const ident = wmtsTodos(raiz, "ServiceIdentification")[0];
  const prov = wmtsTodos(raiz, "ServiceProvider")[0];
  const titulo = ident? wmtsTexto(ident, "Title") : "";
  /* A atribuição é obrigatória de mostrar, e por isso procura-se em três sítios antes de
     desistir: quem fornece o serviço, as restrições de acesso, e o título. */
  const sitio = prov? wmtsFilhos(prov, "ProviderSite")[0] : null;
  const atribuicao = (prov && wmtsTexto(prov, "ProviderName"))
    || (ident && wmtsTexto(ident, "AccessConstraints"))
    || titulo || "";
  const termos = (sitio && (sitio.getAttribute("xlink:href") || sitio.getAttribute("href"))) || "";

  /* O endereço do pedido KVP, quando o serviço o oferece. */
  let kvp = "";
  wmtsTodos(raiz, "Operation").forEach(op=>{
    if(op.getAttribute("name") !== "GetTile") return;
    wmtsTodos(op, "Get").forEach(g=>{
      const href = g.getAttribute("xlink:href") || g.getAttribute("href") || "";
      const cod = wmtsTodos(g, "Value").map(v=>v.textContent.trim().toUpperCase());
      if(href && (!cod.length || cod.includes("KVP"))) kvp = kvp || href;
    });
  });

  /* Os conjuntos de matrizes: é aqui que está a projeção e a geometria de cada nível. */
  const conjuntos = {};
  wmtsTodos(raiz, "TileMatrixSet").forEach(cx=>{
    /* Um `TileMatrixSetLink` também se chama assim por dentro; o conjunto a sério é o que
       traz matrizes. Sem isto, os elos de cada camada entravam como conjuntos vazios. */
    const matrizes = wmtsFilhos(cx, "TileMatrix");
    if(!matrizes.length) return;
    const id = wmtsTexto(cx, "Identifier");
    if(!id) return;
    conjuntos[id] = {
      id,
      crs: wmtsCRS(wmtsTexto(cx, "SupportedCRS")),
      escalaConhecida: wmtsTexto(cx, "WellKnownScaleSet"),
      matrizes: matrizes.map(m=>{
        const canto = wmtsTexto(m, "TopLeftCorner").split(/\s+/).map(Number);
        return {
          id: wmtsTexto(m, "Identifier"),
          escala: Number(wmtsTexto(m, "ScaleDenominator")),
          canto,
          larguraMosaico: Number(wmtsTexto(m, "TileWidth")),
          alturaMosaico: Number(wmtsTexto(m, "TileHeight")),
          colunas: Number(wmtsTexto(m, "MatrixWidth")),
          linhas: Number(wmtsTexto(m, "MatrixHeight"))
        };
      })
    };
  });

  /* As camadas. */
  const camadas = wmtsTodos(raiz, "Layer").map(lx=>{
    const bbox = wmtsTodos(lx, "WGS84BoundingBox")[0];
    const canto = b => b? b.split(/\s+/).map(Number) : null;
    return {
      id: wmtsTexto(lx, "Identifier"),
      titulo: wmtsTexto(lx, "Title") || wmtsTexto(lx, "Identifier"),
      formatos: wmtsFilhos(lx, "Format").map(f=>f.textContent.trim()),
      estilos: wmtsTodos(lx, "Style").map(s=>({
        id: wmtsTexto(s, "Identifier"), omissao: s.getAttribute("isDefault") === "true"
      })).filter(s=>s.id),
      conjuntos: wmtsTodos(lx, "TileMatrixSetLink").map(l=>wmtsTexto(l, "TileMatrixSet")).filter(Boolean),
      recursos: wmtsTodos(lx, "ResourceURL")
        .filter(r=>r.getAttribute("resourceType") === "tile")
        .map(r=>({ modelo: r.getAttribute("template") || "", formato: r.getAttribute("format") || "" }))
        .filter(r=>r.modelo),
      bbox: bbox? { inf: canto(wmtsTexto(bbox, "LowerCorner")), sup: canto(wmtsTexto(bbox, "UpperCorner")) } : null
    };
  }).filter(c=>c.id);

  if(!camadas.length) throw new Error("O serviço não declara nenhuma camada.");
  return { titulo, atribuicao, termos, kvp, conjuntos, camadas };
}

/**
 * Este conjunto de matrizes pode ser desenhado com a aritmética de Mercator do mapa?
 *
 * Não basta o código do sistema de coordenadas bater certo. Um conjunto em EPSG:3857 pode
 * ter outra origem, outro tamanho de mosaico ou outra progressão de escalas, e nesse caso
 * a conta do mapa põe a carta ao lado do sítio. Confere-se tudo, e o que não passar
 * **diz porque não passou** — recusar com motivo é o que permite a quem lê ir procurar
 * outro conjunto no mesmo serviço.
 *
 * @returns {{ok:boolean, motivo:string, niveis:Object<number,string>, zMin:number, zMax:number}}
 */
function wmtsCompativel(conjunto){
  const nada = m => ({ ok:false, motivo:m, niveis:{}, zMin:0, zMax:0 });
  if(!conjunto || !conjunto.matrizes || !conjunto.matrizes.length) return nada("sem matrizes declaradas");

  const mercator = conjunto.crs === "EPSG:3857" || conjunto.crs === "EPSG:900913"
    || /GoogleMapsCompatible/i.test(conjunto.escalaConhecida||"");
  if(!mercator)
    return nada("está em "+(conjunto.crs||"sistema não declarado")
      + " — o mapa desenha em Web Mercator (EPSG:3857), e reprojetar mosaicos já desenhados não é possível");

  const niveis = {};
  let zMin = 99, zMax = -1, recusa = "";
  conjunto.matrizes.forEach(m=>{
    if(m.larguraMosaico !== 256 || m.alturaMosaico !== 256){
      recusa = recusa || "mosaicos de "+m.larguraMosaico+"×"+m.alturaMosaico+" px; o mapa assume 256×256";
      return;
    }
    /* A origem tem de ser o canto do mundo. Um conjunto que comece noutro sítio precisa de
       um deslocamento que a conta do mapa não tem. */
    const [a, b] = m.canto || [];
    if(!isFinite(a) || !isFinite(b) || Math.abs(Math.abs(a) - WMTS_TOPO_3857) > 1
       || Math.abs(Math.abs(b) - WMTS_TOPO_3857) > 1){
      recusa = recusa || "a matriz «"+m.id+"» não começa no canto do mundo";
      return;
    }
    const z = wmtsNivelDe(m.escala);
    if(z === null){ recusa = recusa || "a escala da matriz «"+m.id+"» não cai num nível do Web Mercator"; return; }
    niveis[z] = m.id;
    if(z < zMin) zMin = z;
    if(z > zMax) zMax = z;
  });

  if(zMax < 0) return nada(recusa || "nenhuma matriz utilizável");
  return { ok:true, motivo:"", niveis, zMin, zMax };
}

/**
 * O endereço de um mosaico, a partir do que o serviço declarou.
 *
 * Prefere-se o modelo RESTful, quando existe: é um pedido simples, guarda-se melhor e não
 * depende de o servidor aceitar parâmetros por qualquer ordem. Sem ele, monta-se o pedido
 * KVP. **A linha vem antes da coluna** — `TileRow` é y, `TileCol` é x —, que é o contrário
 * da convenção do OpenStreetMap e a origem provável de qualquer erro aqui.
 */
function wmtsEndereco(c, z, x, y){
  const matriz = (c.niveis && c.niveis[z]) || String(z);
  if(c.modelo){
    return c.modelo
      .replace(/\{TileMatrixSet\}/gi, c.conjunto)
      .replace(/\{TileMatrix\}/gi, matriz)
      .replace(/\{TileRow\}/gi, String(y))
      .replace(/\{TileCol\}/gi, String(x))
      .replace(/\{Style\}/gi, c.estilo || "default")
      .replace(/\{Layer\}/gi, c.camada);
  }
  if(!c.kvp) return "";
  const sep = c.kvp.includes("?") ? (c.kvp.endsWith("?") || c.kvp.endsWith("&") ? "" : "&") : "?";
  return c.kvp + sep + [
    "SERVICE=WMTS", "VERSION=1.0.0", "REQUEST=GetTile",
    "LAYER=" + encodeURIComponent(c.camada),
    "STYLE=" + encodeURIComponent(c.estilo || "default"),
    "TILEMATRIXSET=" + encodeURIComponent(c.conjunto),
    "TILEMATRIX=" + encodeURIComponent(matriz),
    "TILEROW=" + y, "TILECOL=" + x,
    "FORMAT=" + encodeURIComponent(c.formato || "image/png")
  ].join("&");
}

/**
 * Compõe a declaração de carta a partir de uma camada escolhida de um serviço lido.
 *
 * @param {any} cap o que `lerCapacidadesWMTS` devolveu
 * @param {string} camadaId a camada escolhida
 * @param {string} [conjuntoId] o conjunto de matrizes; omitido, o primeiro compatível
 * @returns {{ok:boolean, motivo?:string, carta?:any}}
 */
function wmtsCarta(cap, camadaId, conjuntoId){
  const cam = cap.camadas.find(c=>c.id === camadaId);
  if(!cam) return { ok:false, motivo:"Camada não encontrada no serviço." };

  const candidatos = conjuntoId? [conjuntoId] : cam.conjuntos;
  let escolhido = null, comp = null, motivos = [];
  for(const id of candidatos){
    const cj = cap.conjuntos[id];
    if(!cj){ motivos.push(id+": o serviço declara o elo mas não o conjunto"); continue; }
    const r = wmtsCompativel(cj);
    if(r.ok){ escolhido = cj; comp = r; break; }
    motivos.push(id+": "+r.motivo);
  }
  if(!escolhido)
    return { ok:false, motivo:"Nenhum conjunto de matrizes desta camada serve. "+motivos.join("; ")+"." };

  /* O formato: prefere-se PNG, que é o que a carta costuma ser; JPEG serve para ortofoto. */
  const fmt = cam.formatos.find(f=>/png/i.test(f)) || cam.formatos.find(f=>/jpe?g/i.test(f)) || cam.formatos[0] || "image/png";
  const rec = cam.recursos.find(r=>r.formato === fmt) || cam.recursos[0] || null;
  const estilo = (cam.estilos.find(s=>s.omissao) || cam.estilos[0] || {}).id || "default";

  if(!rec && !cap.kvp)
    return { ok:false, motivo:"O serviço não declara nem modelo de endereço nem ponto de acesso KVP para os mosaicos." };

  return { ok:true, carta:{
    tipo:"wmts",
    camada:cam.id, camadaTitulo:cam.titulo,
    conjunto:escolhido.id, estilo, formato:fmt,
    modelo: rec? rec.modelo : "", kvp: cap.kvp,
    niveis: comp.niveis, zMin: comp.zMin, zMax: comp.zMax,
    atrib: cap.atribuicao || cap.titulo, termos: cap.termos,
    servico: cap.titulo,
    por: quemRegista(), g: gdhAgora()
  }};
}

/**
 * O que cada camada do serviço oferece, e o que a impede de servir.
 *
 * É esta lista que se mostra a quem escolhe. Uma camada que não sirva aparece na mesma,
 * com o motivo: saber que a carta militar existe mas está em PT-TM06 é informação, e
 * escondê-la deixaria a pessoa a pensar que o serviço não a tem.
 */
function wmtsInventario(cap){
  return cap.camadas.map(cam=>{
    const r = wmtsCarta(cap, cam.id);
    return { id:cam.id, titulo:cam.titulo, conjuntos:cam.conjuntos,
      serve:r.ok, motivo:r.ok? "" : r.motivo,
      zMin:r.ok? r.carta.zMin : null, zMax:r.ok? r.carta.zMax : null,
      formatos:cam.formatos };
  });
}
