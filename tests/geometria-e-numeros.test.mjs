// Arrumação — a quinta revisão do plano de 5 de setembro (B4, B7 e o resto das delegações).
//
// A geometria: `111320·cos(lat)` escrito à mão dezasseis vezes em oito módulos, duas
// fórmulas de distância sem que uma remetesse para a outra, cinco tabelas de rumos com três
// formas. Passa tudo por `28-geometria-do-terreno.js`, e um teste lê a fonte e recusa a
// constante fora dele.
//
// Os números: a coordenada da ocorrência lia-se com `parseFloat(x.replace(",","."))` em dez
// sítios, cada um a decidir sozinho o que fazer com `NaN`; e o que ia para o ecrã levava
// ponto decimal em trinta sítios. `parCoordenadas` e `fmtPT` são o sítio único.
//
// A rede: `fetchT` repete uma vez, a pedido, o pedido que caiu por corte momentâneo — e não
// o que a origem recusou.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { abrirAplicacao, avaliar } from './app.mjs';
import { revisaoMaisRecente } from '../ferramentas/verificar.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);

/** Todos os módulos da fonte, com o caminho. */
function modulosDaFonte() {
  const out = [];
  for (const zona of readdirSync('fonte', { withFileTypes: true })) {
    if (!zona.isDirectory()) continue;
    for (const f of readdirSync(join('fonte', zona.name))) {
      if (f.endsWith('.js')) out.push({ caminho: join('fonte', zona.name, f), texto: readFileSync(join('fonte', zona.name, f), 'utf8') });
    }
  }
  return out;
}

/* ---- a rosa dos ventos ---- */

test('a rosa de dezasseis pontos dá os graus de cada rumo, e a de oito é a mesma de dois em dois', semAplicacao, () => {
  assert.equal(av('ROSA16.length'), 16);
  assert.equal(av('ROSA8.join(" ")'), 'N NE E SE S SO O NO');
  assert.equal(av('grausDoRumo("N")'), 0);
  assert.equal(av('grausDoRumo("ENE")'), 67.5);
  assert.equal(av('grausDoRumo(" so ")'), 225, 'espaços e minúsculas não são outro rumo');
  assert.equal(av('grausDoRumo("XPTO")'), null);
  assert.equal(av('grausDoRumo("")'), null);
});

test('o rumo de um ângulo é o ponto mais próximo, nas duas rosas, e dá a volta', semAplicacao, () => {
  assert.equal(av('rumoDoAngulo(0)'), 'N');
  assert.equal(av('rumoDoAngulo(359)'), 'N', 'a rosa fecha');
  assert.equal(av('rumoDoAngulo(-10)'), 'N', 'a dez graus de norte ainda é norte');
  assert.equal(av('rumoDoAngulo(-20)'), 'NNO', 'um ângulo negativo conta para trás');
  assert.equal(av('rumoDoAngulo(100)'), 'E');
  assert.equal(av('rumoDoAngulo(100, 8)'), 'E');
  assert.equal(av('rumoDoAngulo(112.5)'), 'ESE');
  assert.equal(av('rumoDoAngulo(112.5, 8)'), 'SE', 'na rosa de oito, 112,5° arredonda para o lado de cima');
  assert.equal(av('rumoDoAngulo(720+45)'), 'NE');
});

test('o oposto de um rumo fica na rosa em que o rumo foi escrito', semAplicacao, () => {
  assert.equal(av('rumoOposto("N")'), 'S');
  assert.equal(av('rumoOposto("SO")'), 'NE');
  assert.equal(av('rumoOposto("NNE")'), 'SSO');
  assert.equal(av('rumoOposto("XPTO")'), '');
});

/* ---- metros e graus ---- */

test('metros por grau: a latitude não muda, a longitude encolhe com o cosseno', semAplicacao, () => {
  const eq = av('metrosPorGrau(0)');
  assert.equal(eq.mLat, 111320);
  assert.ok(Math.abs(eq.mLon - 111320) < 1e-6);
  const douro = av('metrosPorGrau(41.1)');
  assert.equal(douro.mLat, 111320);
  assert.ok(Math.abs(douro.mLon - 111320 * Math.cos(41.1 * Math.PI / 180)) < 1e-6);
  assert.equal(av('M_POR_GRAU'), 111320);
});

test('a distância plana e a esférica concordam a um por mil, a esta escala', semAplicacao, () => {
  // Régua → Lamego, uns 8 km. A planar leva a latitude média e os 111 320 m por grau do
  // elipsoide; a esférica leva o raio médio da Terra, que dá 111 195 m por grau. A diferença
  // entre os dois modelos é de um por mil — oito metros em oito quilómetros —, e é essa a
  // pergunta que ficou ao #003: qual das duas serve cada uso. Aqui confere-se que nenhuma
  // das duas se afastou da outra por erro de conta.
  const plana = av('distanciaPlanaM(41.1633, -7.7889, 41.0967, -7.8100)');
  const esferica = av('distanciaM(41.1633, -7.7889, 41.0967, -7.8100)');
  assert.ok(plana > 7000 && plana < 9000, 'ordem de grandeza: ' + plana);
  assert.ok(Math.abs(plana - esferica) / esferica < 0.0015, `plana ${plana}, esférica ${esferica}`);
  assert.equal(av('distanciaM(41, -7.7, 41, -7.7)'), 0);
});

test('o ponto a uma distância volta pela distância, e o rumo volta pelo ponto', semAplicacao, () => {
  const r = av(`(()=>{
    const p = pontoADistancia(41.1, -7.7, 90, 1000);
    return { volta: distanciaPlanaM(41.1, -7.7, p.lat, p.lon), rumo: rumoGraus(41.1, -7.7, p.lat, p.lon),
             norte: pontoADistancia(41.1, -7.7, 0, 1000) };
  })()`);
  assert.ok(Math.abs(r.volta - 1000) < 0.5, 'mil metros para leste voltam como mil: ' + r.volta);
  assert.ok(Math.abs(r.rumo - 90) < 0.05, 'e o rumo de volta é 90°: ' + r.rumo);
  assert.ok(Math.abs(r.norte.lon - (-7.7)) < 1e-9, 'para norte a longitude não mexe');
  assert.ok(Math.abs(r.norte.lat - 41.1 - 1000 / 111320) < 1e-9);
});

test('o rumo entre dois pontos conta de norte e roda para leste', semAplicacao, () => {
  assert.ok(Math.abs(av('rumoGraus(41, -7.7, 41.01, -7.7)')) < 1e-9, 'norte é 0');
  assert.ok(Math.abs(av('rumoGraus(41, -7.7, 41, -7.69)') - 90) < 1e-9, 'leste é 90');
  assert.ok(Math.abs(av('rumoGraus(41, -7.7, 40.99, -7.7)') - 180) < 1e-9, 'sul é 180');
  assert.ok(Math.abs(av('rumoGraus(41, -7.7, 41, -7.71)') - 270) < 1e-9, 'oeste é 270');
});

test('o croqui recoloca pelo rumo escrito com a mesma conta do núcleo', semAplicacao, () => {
  const r = av(`(()=>{ const a = pontoPorRumo(41, -7.7, 2, "NE"), b = pontoADistancia(41, -7.7, 45, 2000); return [a.lat-b.lat, a.lon-b.lon, pontoPorRumo(41, -7.7, 2, "XPTO")]; })()`);
  assert.equal(r[0], 0); assert.equal(r[1], 0); assert.equal(r[2], null);
});

test('fora do núcleo, ninguém escreve a conversão grau-metro nem o raio da Terra', () => {
  const culpados = modulosDaFonte()
    .filter(({ caminho }) => !caminho.endsWith('28-geometria-do-terreno.js'))
    .filter(({ texto }) => /111320|6371008/.test(texto))
    .map(({ caminho }) => caminho);
  assert.deepEqual(culpados, []);
});

test('há uma rosa só: nenhuma tabela de rumos fora do núcleo', () => {
  const culpados = modulosDaFonte()
    .filter(({ caminho }) => !caminho.endsWith('28-geometria-do-terreno.js'))
    .filter(({ texto }) => /\["N","NE","E","SE"|"NNE",22\.5|NNE:22\.5|\bNE:45\b/.test(texto))
    .map(({ caminho }) => caminho);
  assert.deepEqual(culpados, []);
});

/* ---- coordenadas e números ---- */

test('parCoordenadas aceita vírgula e ponto e recusa o que não é coordenada', semAplicacao, () => {
  assert.deepEqual(JSON.parse(av('JSON.stringify(parCoordenadas("41,1", "-7,7"))')), { lat: 41.1, lon: -7.7 });
  assert.deepEqual(JSON.parse(av('JSON.stringify(parCoordenadas("41.1", "-7.7"))')), { lat: 41.1, lon: -7.7 });
  assert.equal(av('parCoordenadas("", "-7.7")'), null, 'vazio não é coordenada');
  assert.equal(av('parCoordenadas("abc", "-7.7")'), null);
  assert.equal(av('parCoordenadas("91", "0")'), null, 'latitude fora dos limites');
  assert.equal(av('parCoordenadas("0", "181")'), null, 'longitude fora dos limites');
  assert.deepEqual(JSON.parse(av('JSON.stringify(parCoordenadas("-90", "180"))')), { lat: -90, lon: 180 }, 'os limites contam');
  assert.deepEqual(JSON.parse(av('JSON.stringify(parCoordenadas(41.1, -7.7))')), { lat: 41.1, lon: -7.7 }, 'um número já lido também serve');
});

test('a coordenada do formulário lê-se num sítio só, com vírgula', semAplicacao, () => {
  av('$("o-lat").value = "41,15"; $("o-lon").value = "-7,80";');
  assert.deepEqual(JSON.parse(av('JSON.stringify(coordenadaDoFormulario())')), { lat: 41.15, lon: -7.8 });
  av('$("o-lat").value = ""; $("o-lon").value = "";');
  assert.equal(av('coordenadaDoFormulario()'), null);
});

test('fora de numPT, ninguém troca a vírgula pelo ponto à mão', () => {
  const culpados = modulosDaFonte()
    .filter(({ caminho }) => !caminho.endsWith('26-numeros-em-portugues.js'))
    .flatMap(({ caminho, texto }) => texto.split('\n')
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => l.includes('.replace(",",".")') && !/^\s*(\*|\/\*|\/\/)/.test(l))
      .map(({ i }) => `${caminho}:${i + 1}`));
  assert.deepEqual(culpados, []);
});

test('o que se escreve com casas decimais para o ecrã passa por fmtPT, e não por toFixed().replace', () => {
  const culpados = modulosDaFonte()
    .filter(({ texto }) => /\.toFixed\(\d\)\.replace\("\.", ","\)/.test(texto))
    .map(({ caminho }) => caminho);
  assert.deepEqual(culpados, []);
});

test('o medidor de empenhamento e o ponto de trânsito escrevem a vírgula', semAplicacao, () => {
  const m = av('medidorTempo({ t:"VFCI", ts: agora() - 2.5*3600000 })');
  assert.match(m, /Faltam \d+,\d h para o limite/);
  assert.equal(av('fmtPT(2.25, 1)'), '2,3');
  assert.equal(av('fmtPT(null)'), '—', 'o que não é número sai como travessão');
});

/* ---- a rede ---- */

/** Substitui o `fetch` da janela por uma sequência de respostas, e devolve como repor. */
function comFetch(respostas) {
  av(`window.__fetchReal = window.fetch; window.__fila = ${JSON.stringify(respostas)}; window.__pedidos = 0;
      window.fetch = () => { window.__pedidos++; const r = window.__fila.shift();
        if(r === "corte") return Promise.reject(new TypeError("Failed to fetch"));
        /* Um objeto com a cara de uma resposta: o jsdom não traz \`Response\`, e \`fetchT\` só lhe pede ok, status e clone. */
        return Promise.resolve({ ok: r < 400, status: r, clone(){ return this; } }); };`);
  return () => av('window.fetch = window.__fetchReal; delete window.__fetchReal; delete window.__fila; delete window.__pedidos;');
}

test('fetchT repete uma vez, a pedido, o pedido que caiu por corte', semAplicacao, async () => {
  const repor = comFetch(['corte', 200]);
  try {
    av('REDE.recuo = 5; REDE.cache.clear();');
    const r = await av('fetchT("https://exemplo.invalido/a?repete=1", { repetir:true, semCache:true }, 2000).then(r=>r.status)');
    assert.equal(r, 200);
    assert.equal(av('window.__pedidos'), 2, 'dois pedidos: o que caiu e a repetição');
  } finally { repor(); av('REDE.recuo = 600;'); }
});

test('sem pedir, fetchT não repete; e uma recusa da origem nunca se repete', semAplicacao, async () => {
  let repor = comFetch(['corte', 200]);
  try {
    av('REDE.cache.clear();');
    await assert.rejects(av('fetchT("https://exemplo.invalido/b", { semCache:true }, 2000)'));
    assert.equal(av('window.__pedidos'), 1, 'sem repetir, um pedido só');
  } finally { repor(); }
  repor = comFetch([503, 200]);
  try {
    av('REDE.cache.clear();');
    const r = await av('fetchT("https://exemplo.invalido/c", { repetir:true, semCache:true }, 2000).then(r=>r.status)');
    assert.equal(r, 503, 'a recusa devolve-se tal como veio');
    assert.equal(av('window.__pedidos'), 1, 'e não se insiste: a resposta seria a mesma');
  } finally { repor(); }
});

/* ---- os últimos onclick ---- */

test('nenhum botão da entrega traz onclick embutido', async () => {
  const entrega = readFileSync(await revisaoMaisRecente(), 'utf8');
  assert.equal((entrega.match(/<button[^>]*\son(click|change)=/g) || []).length, 0);
});

test('o botão de atualizar os avisos e o de imprimir respondem sem onclick', semAplicacao, () => {
  av('O.avisos = null; pintarAvisos && pintarAvisos();');
  const b = av('document.querySelector("#avisos-ipma [data-av-atualizar]")');
  assert.ok(b, 'o painel vazio dos avisos tem o botão de consultar');
  assert.equal(av('document.querySelectorAll("[onclick]").length'), 0, 'e nada no documento tem onclick');
});
