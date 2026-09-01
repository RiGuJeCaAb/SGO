/* t0016 — testes do patch p0016 (croqui do teatro de operações) */
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const ALVO = process.argv[2] || "r0062.html";

let passou = 0, falhou = 0;
const t = (n, fn) => { try { fn(); console.log("  ok   " + n); passou++; }
  catch (e) { console.log("  FALHA " + n + " -> " + e.message); falhou++; } };
const ig = (a, b, m) => { const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error((m || "") + " esperava " + B + ", obtive " + A); };
const ok = (c, m) => { if (!c) throw new Error(m || "condicao falsa"); };

const d = new JSDOM(fs.readFileSync(ALVO, "utf-8"),
  { runScripts: "dangerously", url: "https://exemplo.test/pea", virtualConsole: new VirtualConsole() });
d.window.Element.prototype.scrollIntoView = function () {};
const w = d.window, ev = c => w.eval("(function(){ return (" + c + "); })()");

/* Um anel quase-circular de ~2,4 km de raio em torno de Alijó, com 400 vértices —
   é o que um perímetro real traz, e é o caso que a simplificação tem de resolver. */
const ANEL = "(function(){var a=[];for(var i=0;i<=400;i++){var r=i/400*2*Math.PI;" +
  "var rad=2400+180*Math.sin(5*r);" +
  "a.push([-7.47+(rad*Math.sin(r))/(111320*Math.cos(41.27*Math.PI/180)), 41.27+(rad*Math.cos(r))/111320]);}" +
  "return a;})()";
const GJ = '{type:"Feature",geometry:{type:"Polygon",coordinates:[' + ANEL + ']}}';

console.log("\n— A · o estado guarda a geometria —");
t("VERSAO_ESTADO subiu para 14", () => ig(ev("VERSAO_ESTADO"), 14));
t("um estado novo tem os ramos perim e sensDet", () => {
  const dd = ev("novoEstado().dados");
  ok("perim" in dd, "sem dados.perim"); ok("sensDet" in dd, "sem dados.sensDet");
  ig(dd.perim, null); ig(dd.sensDet, null);
});
t("migrar da versao 13 acrescenta os ramos sem tocar no resto", () => {
  const r = ev('(function(){ var g=novoEstado(); g.versao=13; delete g.dados.perim; delete g.dados.sensDet;' +
    'g.dados.area="1865"; g.dados.perimNome="castedo.geojson";' +
    'var e=migrarGravado(g); return {v:e.versao, p:e.dados.perim, s:e.dados.sensDet,' +
    'area:e.dados.area, nome:e.dados.perimNome}; })()');
  ig(r.v, 14); ig(r.p, null); ig(r.s, null);
  ig(r.area, "1865", "a area perdeu-se:"); ig(r.nome, "castedo.geojson");
});
t("a auditoria de posse continua limpa", () => {
  const a = ev("auditarPosse(novoEstado())");
  ig(a.orfaos, [], "orfaos:"); ig(a.duplicados, [], "duplicados:");
});
t("os ramos novos pertencem a Planeamento (art. 28.º)", () => {
  ig(ev('donoDoRamo("dados.perim").celula'), "planeamento");
  ig(ev('donoDoRamo("dados.sensDet").celula'), "planeamento");
  ok(/28\.º/.test(ev('donoDoRamo("dados.perim").ramo.r')));
});

console.log("\n— B · leitura e simplificacao do perimetro —");
t("le Polygon, Feature, FeatureCollection e MultiPolygon", () => {
  const n = ev('(function(){ var a=' + ANEL + ';' +
    'return [aneisDeGeoJSON({type:"Polygon",coordinates:[a]}).length,' +
    'aneisDeGeoJSON({type:"Feature",geometry:{type:"Polygon",coordinates:[a]}}).length,' +
    'aneisDeGeoJSON({type:"FeatureCollection",features:[{geometry:{type:"Polygon",coordinates:[a]}}]}).length,' +
    'aneisDeGeoJSON({type:"MultiPolygon",coordinates:[[a],[a]]}).length]; })()');
  ig(n, [1, 1, 1, 2]);
});
t("guardarPerimetro simplifica sem deformar", () => {
  const r = ev('(function(){ O=novoEstado(); var p=guardarPerimetro(' + GJ + ', "castedo.geojson");' +
    'return {v:p.vertices, vo:p.verticesOriginais, tol:p.toleranciaM, nome:p.nome,' +
    'bbox:p.bbox.map(function(x){return +x.toFixed(4);}), g:p.g}; })()');
  ig(r.vo, 401, "vertices originais:");
  ok(r.v < r.vo, "nao simplificou: " + r.v);
  ok(r.v >= 12, "simplificou de mais, " + r.v + " vertices — perde a forma");
  ig(r.tol, 15); ig(r.nome, "castedo.geojson");
  ok(r.g && r.g.length >= 9, "sem GDH de carregamento");
});
t("a simplificacao preserva a area dentro de 1 %", () => {
  const r = ev('(function(){ var a=' + ANEL + ';' +
    'var bruta=areaGeoJSON({type:"Polygon",coordinates:[a]});' +
    'O=novoEstado(); guardarPerimetro(' + GJ + ',"x");' +
    'var simp=areaGeoJSON({type:"Polygon",coordinates:[O.dados.perim.aneis[0]]});' +
    'return {bruta:bruta, simp:simp, dif:Math.abs(simp-bruta)/bruta}; })()');
  ok(r.dif < 0.01, "diferenca de " + (r.dif * 100).toFixed(2) + " % (" + r.bruta + " vs " + r.simp + " ha)");
});
t("a geometria cabe numa exportacao razoavel", () => {
  const n = ev('JSON.stringify(O.dados.perim).length');
  ok(n < 12000, "geometria com " + n + " caracteres — pesada de mais para a exportacao");
});
t("um GeoJSON sem poligono nao rebenta", () => {
  ig(ev('(function(){ O=novoEstado(); return guardarPerimetro({type:"Point",coordinates:[0,0]},"x"); })()'), null);
  ig(ev('guardarPerimetro(null,"x")'), null);
});

console.log("\n— C · o croqui —");
t("sem perimetro nem coordenadas nao desenha nada", () => {
  ig(ev('(function(){ O=novoEstado(); return croquiSVG(); })()'), "");
});
t("so com o ponto da ocorrencia nao desenha — um triangulo nao e croqui", () => {
  ig(ev('(function(){ O=novoEstado(); O.meta.lat="41.27"; O.meta.lon="-7.47"; return croquiSVG(); })()'), "");
});
t("com o ponto e uma detecao ja desenha, e o PCO aparece", () => {
  const svg = ev('(function(){ O.dados.sensDet={origem:"OSM",g:"1",itens:' +
    '[{nome:"Lousa",tipo:"aldeia",dist:0.4,rumo:"S",sens:false}]}; return croquiSVG(640,400); })()');
  ok(/<svg/.test(svg) && /PCO/.test(svg) && /Lousa/.test(svg), svg.slice(0, 140));
});
t("caixa degenerada abre ate 2 km e a barra cabe no desenho", () => {
  const r = ev('(function(){ var s=croquiSVG(640,400);' +
    'var m=s.match(/<line x1="(\\d+)"[^>]*x2="([\\d.]+)"/);' +
    'var rot=(s.match(/>([\\d.]+ (km|m))</)||[])[1];' +
    'return {x1:+m[1], x2:+m[2], rot:rot}; })()');
  ok(r.x2 - r.x1 <= 640/3 + 1, "barra com " + Math.round(r.x2-r.x1) + " px numa tela de 640");
  ok(r.x2 <= 640, "a barra sai do desenho: x2=" + r.x2);
  ok(r.rot, "sem rotulo de escala");
});
t("a barra nunca passa de um terco da largura, com qualquer escala", () => {
  const r = ev('[escalaRedonda(0.0001,640).px, escalaRedonda(1e6,640).px, escalaRedonda(3,640).px]');
  r.forEach(px => ok(px <= 640/3 + 0.01, "barra com " + px + " px"));
});
t("a proporcao segue o conteudo em vez de ser sempre 640x400", () => {
  const r = ev('(function(){ O=novoEstado(); O.meta.lat="41.27"; O.meta.lon="-7.47";' +
    /* um TO comprido e estreito: 12 km E-O por 1 km N-S */
    'var a=[[-7.55,41.265],[-7.39,41.265],[-7.39,41.275],[-7.55,41.275],[-7.55,41.265]];' +
    'guardarPerimetro({type:"Polygon",coordinates:[a]},"estreito.geojson");' +
    'var s=croquiSVG(640,400); var vb=s.match(/viewBox="0 0 (\\d+) (\\d+)"/);' +
    'return {l:+vb[1], a:+vb[2]}; })()');
  ok(r.a < 400, "moldura ainda com " + r.a + " px de altura para um TO estreito");
  ok(r.a >= 200, "moldura esmagada: " + r.a);
});
t("com perimetro desenha o poligono", () => {
  const r = ev('(function(){ O=novoEstado(); O.meta.lat="41.27"; O.meta.lon="-7.47";' +
    'guardarPerimetro(' + GJ + ',"castedo.geojson");' +
    'var s=croquiSVG(640,400);' +
    'return {n:(s.match(/<path d="M/g)||[]).length, svg:s.length, viewBox:/viewBox="0 0 640 400"/.test(s)}; })()');
  ok(r.n >= 1, "sem caminho de perimetro"); ok(r.viewBox, "viewBox errada");
  ok(r.svg > 800, "svg curto: " + r.svg);
});
t("tem escala redonda, norte e coordenadas", () => {
  const s = ev('croquiSVG(640,400)');
  ok(/>(\d+(\.\d+)? (km|m))</.test(s), "sem rotulo de escala");
  ok(/>N</.test(s), "sem norte");
  ok(/font-family="monospace"/.test(s), "sem caixa de coordenadas");
});
t("a escala escolhe passos redondos", () => {
  const r = ev('[escalaRedonda(2,640).m, escalaRedonda(20,640).m, escalaRedonda(0.5,640).m]');
  [100,200,500,1000,2000,5000,10000,20000,50000,100000].forEach(()=>{});
  r.forEach(m => ok([100,200,500,1000,2000,5000,10000,20000,50000,100000].includes(m), "passo nao redondo: " + m));
});
t("coloca os sensiveis por distancia e rumo", () => {
  const r = ev('(function(){ O.dados.sensDet={origem:"Overpass/OSM", g:gdhAgora(), raioKm:3, itens:[' +
    '{nome:"Vilarinho", tipo:"aldeia", dist:0.8, rumo:"NE", sens:false},' +
    '{nome:"Escola de Alijo", tipo:"escola", dist:1.6, rumo:"S", sens:true}]};' +
    'var s=croquiSVG(640,400);' +
    'return {vil:/Vilarinho/.test(s), esc:/Escola de Alijo/.test(s),' +
    'quadrado:(s.match(/<rect x=/g)||[]).length, circulo:(s.match(/<circle/g)||[]).length}; })()');
  ok(r.vil && r.esc, "nomes em falta");
  ok(r.quadrado >= 1, "o sensivel devia ser quadrado");
  ok(r.circulo >= 1, "o aglomerado devia ser circulo");
});
t("pontoPorRumo respeita os cardeais", () => {
  const n = ev('pontoPorRumo(41.27,-7.47,1,"N")'), e2 = ev('pontoPorRumo(41.27,-7.47,1,"E")');
  ok(n.lat > 41.27 && Math.abs(n.lon + 7.47) < 1e-6, "N devia subir a latitude: " + JSON.stringify(n));
  ok(e2.lon > -7.47 && Math.abs(e2.lat - 41.27) < 1e-6, "E devia subir a longitude: " + JSON.stringify(e2));
});
t("rumo desconhecido nao coloca ponto nenhum", () => {
  ig(ev('pontoPorRumo(41.27,-7.47,1,"XPTO")'), null);
  ig(ev('pontoPorRumo(41.27,-7.47,NaN,"N")'), null);
});
t("o SVG escapa o que vem do utilizador", () => {
  const s = ev('(function(){ O.dados.sensDet={origem:"x",g:"1",itens:[' +
    '{nome:"<script>mau</" + "script>", tipo:"aldeia", dist:1, rumo:"N", sens:false}]};' +
    'return croquiSVG(); })()');
  ok(!/<script>/.test(s), "injecao passou");
  ok(/&lt;script&gt;/.test(s), "nao escapou");
});
t("a legenda declara a origem e o GDH", () => {
  const L = ev('croquiLegenda()');
  ok(L.some(x => /castedo\.geojson/.test(x)), L.join(" | "));
  ok(L.some(x => /vértices/.test(x) && /simplificado/.test(x)), L.join(" | "));
  ok(L.some(x => /não substitui a carta/.test(x)), "sem a ressalva da carta");
});

console.log("\n— D · ecra e papel —");
t("a caixa do croqui existe e esconde-se sem dados", () => {
  ev('(function(){ O=novoEstado(); pintarCroqui(); })()');
  const b = w.document.getElementById("croqui-box");
  ok(b, "falta a caixa"); ig(b.style.display, "none");
});
t("com perimetro a caixa acende e desenha", () => {
  ev('(function(){ O.meta.lat="41.27"; O.meta.lon="-7.47"; guardarPerimetro(' + GJ + ',"x"); pintarCroqui(); })()');
  const b = w.document.getElementById("croqui-box");
  ig(b.style.display, "block");
  ok(w.document.querySelector("#croqui-svg svg"), "sem svg");
  ok(w.document.getElementById("croqui-leg").textContent.length > 40, "legenda vazia");
});
t("o croqui do croqui pertence a Planeamento", () => {
  ok(w.document.getElementById("croqui-box").closest("#p-planeamento, #p-fontes"),
     "o croqui nao esta no painel de Planeamento");
});
t("limpar o perimetro apaga a geometria e o desenho", () => {
  w.document.getElementById("p-limpar").click();
  ig(ev("O.dados.perim"), null, "a geometria devia sair:");
  /* sem perimetro e sem detecao nao ha croqui: a caixa apaga-se */
  ig(w.document.getElementById("croqui-box").style.display, "none");
});
t("com detecao mas sem perimetro a caixa volta, sem poligono", () => {
  ev('(function(){ O.meta.lat="41.27"; O.meta.lon="-7.47";' +
     'O.dados.sensDet={origem:"OSM",g:"1",itens:' +
     '[{nome:"Lousa",tipo:"aldeia",dist:0.9,rumo:"S",sens:false}]}; pintarCroqui(); })()');
  const h = w.document.getElementById("croqui-svg").innerHTML;
  ig(w.document.getElementById("croqui-box").style.display, "block");
  ok(!/fill-opacity="\.16"/.test(h), "desenhou poligono sem geometria");
  ok(/Lousa/.test(h) && /PCO/.test(h), "faltam a detecao ou o PCO");
});

console.log("\n— regressoes —");
t("as suites anteriores continuam de pe", () => {
  ig(ev("typeof croquiSVG"), "function");
  ig(ev("typeof aplicarGestaoPCO"), "function");
  ig(ev("typeof fecharTurno"), "function");
});
t("nenhuma regra de conformidade rebentou", () => {
  ig(ev('verificacoesDON().filter(x=>/indisponível/i.test(x.t)).map(x=>x.t)'), []);
});
t("a exportacao declara a versao 14 e leva a geometria", () => {
  const r = ev('(function(){ O=novoEstado(); O.meta.num="1"; guardarPerimetro(' + GJ + ',"x");' +
    'var t=JSON.stringify(pacoteOcorrencia());' +
    'return {v:JSON.parse(t).versao, tem:/dados/.test(t)&&t.indexOf("aneis")>0, n:t.length}; })()');
  ig(r.v, 14); ok(r.tem, "a geometria nao entrou no pacote");
  ok(r.n < 30000, "pacote com " + r.n + " caracteres");
});
t("a arrumacao por celulas continua sem orfaos", () => {
  ig(ev("auditarArrumacao().semCelula"), []);
});

console.log("\n" + passou + " passaram, " + falhou + " falharam");
process.exit(falhou ? 1 : 0);
