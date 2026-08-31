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

/**
 * Os formatos de mosaico que esta aplicação sabe desenhar.
 *
 * **Lista da aplicação, não a lista anunciada pelo serviço.** Um serviço pode oferecer
 * mosaicos vetoriais, GeoTIFF ou KML; adotar a camada por o serviço a anunciar e só
 * descobrir na hora que a imagem não desenha é descobrir tarde — num posto de comando, com
 * a carta a faltar. O que não estiver aqui não se adota, e diz-se qual era o formato.
 *
 * A ordem é a de preferência: PNG para carta, que tem linhas e texto e não gosta de
 * artefactos; JPEG para ortofoto, que é fotografia e comprime melhor assim.
 */
const WMTS_FORMATOS = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

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
/**
 * O nível de uma escala, dada a escala do nível 0 da grelha.
 *
 * Deriva-se da escala e **não do nome da matriz**, que pode ser `EPSG:3857:10`, `10` ou
 * uma palavra. A escala é um número que significa sempre o mesmo; o nome é uma escolha de
 * quem publicou o serviço.
 *
 * @returns {number|null} o nível, ou nada se não cair num nível inteiro
 */
function nivelPorEscala(escalaDenominador, escala0){
  const e = Number(escalaDenominador);
  if(!isFinite(e) || e <= 0) return null;
  const z = Math.log2(escala0 / e);
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
  const texto = String(xml||"");

  /* **Um WMTS não traz declaração de tipo de documento.** Uma que apareça ou é outro
     protocolo, ou vem a tentar alguma coisa — entidades que se expandem uma na outra até
     esgotar a memória, ou uma entidade externa a apontar para um ficheiro local. O
     `DOMParser` do navegador não resolve entidades externas, mas expande as internas, e
     este ficheiro pode ter chegado por correio a quem o abre.

     A primeira versão desta guarda recusava qualquer DOCTYPE, e recusava mal: **o WMS
     1.1.1 declara um por norma** — as nove capturas de 1.1.1 em `tests/fixtures/` trazem
     todas `<!DOCTYPE WMT_MS_Capabilities SYSTEM ...>`. Quem colasse um endereço de WMS
     recebia «declara entidades próprias» em vez de saber que tinha o protocolo errado.
     Por isso lê-se o **nome** da declaração: os nomes conhecidos seguem para a mensagem
     que explica o que aquilo é, e só o resto é recusado aqui. */
  const dt = /<!DOCTYPE\s+([A-Za-z_][\w.:-]*)/i.exec(texto.slice(0, 4000));
  const nomeConhecido = dt && /^(html|WMT_MS_Capabilities|WMS_Capabilities|Capabilities)$/i.test(dt[1]);
  if((dt && !nomeConhecido) || /<!ENTITY/i.test(texto))
    throw new Error("O documento declara entidades próprias ou um tipo de documento que não"
      + " é de nenhum serviço de cartografia conhecido. Não foi interpretado.");

  const doc = new DOMParser().parseFromString(texto, "text/xml");
  const raiz = doc.documentElement;

  /* **Um erro pode vir com HTTP 200.** Não é hipótese teórica: das cinco capturas em
     `tests/fixtures/capacidades/wmts/`, quatro são respostas de erro e as quatro trazem
     200. Duas são HTML do MapServer («Web application error»), duas são
     `ows:ExceptionReport` do GeoServer. Julgar pelo código de estado dava-as por boas; e
     recusá-las com «a raiz não é Capabilities» esconderia o que o servidor explicou.
     Diz-se o que ele disse. */
  const excecao = doc.getElementsByTagName("*");
  for(let i=0;i<excecao.length;i++){
    if(excecao[i].localName === "ExceptionText" || excecao[i].localName === "ServiceException"){
      /* O código está ora no elemento do texto, ora no `ows:Exception` que o embrulha —
         e é `parentElement`, não `parentNode`: o pai de um elemento de topo é o documento,
         que não tem atributos. */
      const pai = excecao[i].parentElement;
      const cod = excecao[i].getAttribute("exceptionCode")
        || (pai && pai.getAttribute("exceptionCode"))
        || excecao[i].getAttribute("code") || "";
      throw new Error("O serviço recusou o pedido"+(cod? " ("+cod+")" : "")+": "
        + excecao[i].textContent.trim().slice(0, 160));
    }
  }
  /* O `ortosat2023` devolve os cabeçalhos HTTP **repetidos dentro do corpo**, antes do
     HTML — de modo que o documento nem sequer começa por `<`. Salta-se o que vier antes
     da primeira etiqueta, ou este caso escapava-se como «XML inválido», que é verdade e
     não ajuda ninguém. */
  const inicio = texto.slice(0, 600).replace(/^[^<]*/, "");
  if(/^\s*(?:<!DOCTYPE\s+html|<html\b)/i.test(inicio) || (raiz && raiz.localName.toLowerCase() === "html")){
    /* O MapServer põe a explicação no corpo da página, e é ela que interessa a quem lê. */
    const m = /<BODY[^>]*>([\s\S]*?)<\/BODY>/i.exec(texto);
    const dito = (m? m[1] : texto).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    throw new Error("O endereço devolveu uma página de erro em vez de um GetCapabilities"
      + (dito? ": "+dito.slice(0, 160) : ".") + " Confirma que o serviço publica WMTS neste endereço.");
  }

  const malformado = doc.getElementsByTagName("parsererror")[0];
  if(malformado) throw new Error("O documento não é XML válido.");

  /* **A versão lê-se pelo nome do elemento raiz.** Não pelo atributo `version`, que o
     serviço preenche como quer, nem pelo parâmetro que se pediu — pedir `VERSION=1.3.0` e
     receber 1.1.1 é comum, e quem julgar pelo pedido lê o documento errado.

     Os nomes de raiz de WMS estão aqui de propósito. Das vinte e três capturas em
     `tests/fixtures/capacidades/`, dezoito são WMS: é o engano provável de quem tem os
     dois endereços à mão, e responder «raiz WMT_MS_Capabilities» a quem colou um WMS não
     lhe diz o que fazer a seguir. */
  const WMS = { WMS_Capabilities:"1.3.0", WMT_MS_Capabilities:"1.1.1" };
  const versaoWMS = (raiz && WMS[raiz.localName]) || (dt && WMS[dt[1]]) || "";
  if(versaoWMS)
    throw new Error("Isto é um serviço WMS "+versaoWMS+", não um WMTS. O WMS"
      + " desenha uma imagem à medida do pedido; o mapa desta aplicação trabalha por"
      + " mosaicos. Procura o endereço WMTS do mesmo serviço.");

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
      if(href && (!cod.length || cod.includes("KVP"))) kvp = kvp || httpsSeForPreciso(href);
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
      /* **As dimensões.** Uma camada pode ter um eixo além do espaço — o tempo, quase
         sempre: uma série de ortofotos por ano, um índice diário. O pedido tem de o
         indicar, e quem o omite recebe o valor por omissão que o serviço escolheu.

         Não é hipótese: nas capturas de WMS do EFFIS, em `tests/fixtures/capacidades/`,
         as camadas declaram `<Dimension name="time" default="2019-01-01">`. Um mapa que
         omitisse o tempo mostrava 2019 a quem estava a decidir sobre hoje, e mostrava-o
         sem dizer nada. Num incêndio ativo isso é pior do que não ter carta.

         O construtor de endereços desta aplicação não preenche dimensões. Enquanto não
         preencher, uma camada que declare uma é **recusada** — não servida por omissão. */
      dimensoes: wmtsTodos(lx, "Dimension").map(d=>({
        id: wmtsTexto(d, "Identifier") || d.getAttribute("name") || "dimensão sem nome",
        omissao: wmtsTexto(d, "Default")
      })).filter(d=>d.id),
      recursos: wmtsTodos(lx, "ResourceURL")
        .filter(r=>r.getAttribute("resourceType") === "tile")
        .map(r=>({ modelo: httpsSeForPreciso(r.getAttribute("template") || ""), formato: r.getAttribute("format") || "" }))
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
 * @returns {{ok:boolean, motivo:string, grelha:string, niveis:Object<number,string>, zMin:number, zMax:number}}
 */
function wmtsCompativel(conjunto){
  const nada = m => ({ ok:false, motivo:m, grelha:"", niveis:{}, zMin:0, zMax:0 });
  if(!conjunto || !conjunto.matrizes || !conjunto.matrizes.length) return nada("sem matrizes declaradas");

  /* Qual das grelhas declaradas é esta? Pelo sistema de coordenadas, e — para o Web
     Mercator — também pelo conjunto de escalas conhecido, que alguns serviços declaram
     em vez do código. */
  const g = Object.values(GRELHAS).find(x => x.crs === conjunto.crs)
    || (conjunto.crs === "EPSG:900913" ? GRELHAS.mercator : null)
    || (/GoogleMapsCompatible/i.test(conjunto.escalaConhecida||"") ? GRELHAS.mercator : null);
  if(!g)
    return nada("está em "+(conjunto.crs||"sistema não declarado")
      + " — o mapa desenha em "+Object.values(GRELHAS).map(x=>x.crs).join(" ou ")
      + ", e reprojetar mosaicos já desenhados não é possível");

  /* O canto do mundo de cada grelha. O Mercator começa no seu canto; a folha portuguesa
     começa no canto declarado pela DGT. Um conjunto no sistema certo mas com outra origem
     põe a carta ao lado do sítio na mesma, e por isso confere-se. */
  const origem = g.k === "mercator"
    ? [-WMTS_TOPO_3857, WMTS_TOPO_3857]
    : [g.E0, g.N0];
  const escala0 = g.k === "mercator" ? WMTS_ESCALA_0 : g.escala0;

  const niveis = {};
  let zMin = 99, zMax = -1, recusa = "";
  conjunto.matrizes.forEach(m=>{
    if(m.larguraMosaico !== 256 || m.alturaMosaico !== 256){
      recusa = recusa || "mosaicos de "+m.larguraMosaico+"×"+m.alturaMosaico+" px; o mapa assume 256×256";
      return;
    }
    const [a, b] = m.canto || [];
    if(!isFinite(a) || !isFinite(b) || Math.abs(a - origem[0]) > 1 || Math.abs(b - origem[1]) > 1){
      recusa = recusa || "a matriz «"+m.id+"» começa em ("+a+", "+b+") e a grelha "
        + g.n + " começa em ("+origem[0]+", "+origem[1]+")";
      return;
    }
    const z = nivelPorEscala(m.escala, escala0);
    if(z === null){ recusa = recusa || "a escala da matriz «"+m.id+"» não cai num nível da grelha "+g.n; return; }
    niveis[z] = m.id;
    if(z < zMin) zMin = z;
    if(z > zMax) zMax = z;
  });

  if(zMax < 0) return nada(recusa || "nenhuma matriz utilizável");
  return { ok:true, motivo:"", grelha:g.k, niveis, zMin, zMax };
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
  /* **Os parâmetros fundem-se, não se colam.** O endereço declarado pelo serviço pode já
     trazer os seus — o MapServer publica `...?map=/caminho/servico.map&`, e há quem
     publique já com `SERVICE=WMTS` lá dentro. Colar os nossos a seguir com `&` deixava o
     pedido com o parâmetro repetido, e qual dos dois vale é escolha do servidor. Aqui os
     do serviço ficam e os nossos mandam sobre os de igual nome. */
  return kvpFundido(c.kvp, {
    SERVICE:"WMTS", VERSION:"1.0.0", REQUEST:"GetTile",
    LAYER:c.camada, STYLE:c.estilo || "default",
    TILEMATRIXSET:c.conjunto, TILEMATRIX:matriz,
    TILEROW:String(y), TILECOL:String(x),
    FORMAT:c.formato || "image/png"
  });
}

/**
 * Funde parâmetros num endereço que já pode trazer os seus, sem os repetir.
 *
 * Os do endereço ficam; os passados aqui mandam sobre os de igual nome, comparado sem
 * distinguir maiúsculas — a norma diz que a chave KVP é insensível a elas, e um serviço
 * que publique `service=WMTS` no seu endereço não deve receber `SERVICE=WMTS` a seguir.
 *
 * @param {string} base o endereço declarado pelo serviço
 * @param {Object<string,string>} pars os parâmetros a impor
 * @returns {string} o endereço completo
 */
function kvpFundido(base, pars){
  const corte = String(base).indexOf("?");
  const raiz = corte < 0 ? String(base) : String(base).slice(0, corte);
  const q = new URLSearchParams(corte < 0 ? "" : String(base).slice(corte + 1));
  Object.keys(pars).forEach(k=>{
    [...q.keys()].forEach(j=>{ if(j.toUpperCase() === k.toUpperCase()) q.delete(j); });
    q.set(k, pars[k]);
  });
  return raiz + "?" + q.toString();
}

/**
 * Promove um endereço a HTTPS, mas só onde isso é ganho e não perda.
 *
 * O relatório de cartografia pede promoção sempre. **Não se fez sempre, e a razão está nas
 * capturas:** a Direção-Geral do Território publica o serviço em `http://` e só em
 * `http://`. Promover às cegas trocava um serviço que responde por um que não existe.
 *
 * A regra fica pela consequência real. Numa página servida por HTTPS, o navegador recusa
 * conteúdo em claro de qualquer modo: aí promover é a única hipótese de a carta aparecer, e
 * não se perde nada por tentar. Num ficheiro aberto de `file://`, que é como esta aplicação
 * se usa no posto, o `http://` funciona — e é o que a DGT tem.
 */
function httpsSeForPreciso(u){
  const url = String(u||"");
  const paginaSegura = typeof location !== "undefined" && location.protocol === "https:";
  return (paginaSegura && /^http:\/\//i.test(url)) ? url.replace(/^http:/i, "https:") : url;
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

  /* Recusa-se antes de escolher conjunto ou formato: uma camada com eixo temporal não é
     desenhável por esta aplicação, e servi-la pelo valor por omissão seria mostrar outra
     data sem o dizer. */
  if(cam.dimensoes && cam.dimensoes.length){
    const d = cam.dimensoes[0];
    return { ok:false, motivo:"a camada tem o eixo «"+d.id+"», que o mapa não sabe indicar"
      + (d.omissao? " — servi-la daria sempre "+d.omissao+", em vez do que se procura" : "") };
  }

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

  /* O formato sai de `WMTS_FORMATOS`, pela ordem de preferência que lá está declarada, e
     **não do primeiro que o serviço anuncie**. Sem nenhum em comum, recusa-se e diz-se o
     que o serviço oferecia: é informação para quem procura outra camada, e a alternativa
     era adotar a carta e só falhar ao desenhar. */
  const oferecidos = cam.formatos.map(f=>f.trim().toLowerCase());
  const fmt = WMTS_FORMATOS.find(f=>oferecidos.includes(f));
  if(!fmt)
    return { ok:false, motivo:"nenhum formato desenhável: o serviço oferece "
      + (cam.formatos.join(", ") || "nenhum") + " e o mapa desenha " + WMTS_FORMATOS.join(", ") };
  const rec = cam.recursos.find(r=>r.formato.trim().toLowerCase() === fmt)
    || cam.recursos.find(r=>oferecidos.includes(r.formato.trim().toLowerCase())) || null;
  const estilo = (cam.estilos.find(s=>s.omissao) || cam.estilos[0] || {}).id || "default";

  if(!rec && !cap.kvp)
    return { ok:false, motivo:"O serviço não declara nem modelo de endereço nem ponto de acesso KVP para os mosaicos." };

  return { ok:true, carta:{
    tipo:"wmts",
    camada:cam.id, camadaTitulo:cam.titulo,
    conjunto:escolhido.id, estilo, formato:fmt, grelha:comp.grelha,
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
