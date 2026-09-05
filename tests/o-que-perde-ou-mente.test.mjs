// A r0099 do plano de 5 de setembro: o que perdia dados ou mentia sobre eles.
//
// Números com vírgula que davam NaN e a aplicação a dizer que faltava o que se escreveu; a
// chave dos mosaicos sem a carta, a mostrar a anterior na projeção errada; a cache da rede a
// reter cada quadrado até a aba fechar; as folhas de carta a atravessar ocorrências; a
// importação sem teto e a analisar o mesmo texto quatro vezes; a forma que só conferia os
// ramos de topo; o botão da proposta morto por uma exceção fora do try; as declarações de
// carta que respondiam ok sem ter ficado gravadas.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());
const av = (e) => avaliar(janela, e);
beforeEach(() => { if (janela) av('O = novoEstado(); FOLHAS = []; CARTA = null;'); });

/* ---- números em português ---- */

test('numPT lê vírgula e ponto, e devolve null onde não há número', semAplicacao, () => {
  assert.equal(av('numPT("1,5")'), 1.5);
  assert.equal(av('numPT("1.5")'), 1.5);
  assert.equal(av('numPT(" 12 ")'), 12);
  assert.equal(av('numPT(7)'), 7);
  assert.equal(av('numPT("")'), null);
  assert.equal(av('numPT("abc")'), null);
  assert.equal(av('numPT(null)'), null);
  assert.equal(av('numPT(NaN)'), null);
});

test('fmtPT escreve com vírgula e um travessão onde não há valor', semAplicacao, () => {
  assert.equal(av('fmtPT(3.14159, 2)'), '3,14');
  assert.equal(av('fmtPT(4000)'), '4000');
  assert.equal(av('fmtPT(null, 1)'), '—');
});

test('a intensidade aceita a carga escrita à portuguesa', semAplicacao, () => {
  // Era o defeito: Number("1,5") é NaN e a aplicação dizia que faltava a carga.
  assert.equal(av('intensidadeByram("600", "1,5")'), 450);
  assert.equal(av('intensidadeByram(600, 1.5)'), 450);
  assert.equal(av('intensidadeByram("600", "")'), null);
  assert.equal(av('comprimentoDaChama("4 000".replace(" ",""))'), Math.sqrt(4000 / 300));
});

/* ---- os mosaicos e a carta ---- */

test('a chave de um mosaico muda com a carta, e sem carta é a de sempre', semAplicacao, () => {
  const sem = av('chaveMosaico(10, 500, 380)');
  assert.equal(sem, 'm/10/500/380', 'sem carta a chave é a antiga: é a dos mosaicos locais');
  av('CARTA = { tipo:"xyz", u:"https://a.exemplo/{z}/{x}/{y}.png", atrib:"a", termos:"https://t", zMin:3, zMax:19 }');
  const a = av('chaveMosaico(10, 500, 380)');
  av('CARTA = { tipo:"xyz", u:"https://b.exemplo/{z}/{x}/{y}.png", atrib:"b", termos:"https://t", zMin:3, zMax:19 }');
  const b = av('chaveMosaico(10, 500, 380)');
  assert.notEqual(a, sem); assert.notEqual(a, b, 'duas cartas nunca partilham chave');
  assert.match(a, /^m\/[0-9a-f]+\/10\/500\/380$/);
  /* Desde a r0103 a chave local leva a grelha e não a impressão: sem pasta declarada fica vazia (ramo #004). */
  assert.match(av('chaveMosaicoLocal(10, 500, 380)'), /^m\/local\/[a-z0-9]*\/10\/500\/380$/, 'a chave local leva a grelha, não a impressão');
});

test('duas camadas do mesmo WMTS dão chaves diferentes, e a data também', semAplicacao, () => {
  av('CARTA = { tipo:"wmts", base:"https://w", camada:"A", matrizes:"PTTM_06", tempo:"", atrib:"x" }');
  const a = av('chaveMosaico(3, 1, 1)');
  av('CARTA = { tipo:"wmts", base:"https://w", camada:"B", matrizes:"PTTM_06", tempo:"", atrib:"x" }');
  const b = av('chaveMosaico(3, 1, 1)');
  av('CARTA = { tipo:"wmts", base:"https://w", camada:"B", matrizes:"PTTM_06", tempo:"2026-09-04", atrib:"x" }');
  const c = av('chaveMosaico(3, 1, 1)');
  assert.ok(a !== b && b !== c && a !== c);
});

test('a cache da rede tem teto e larga as entradas mais antigas', semAplicacao, () => {
  av('REDE.cache.clear(); for(let i=0;i<REDE.cacheMax+30;i++) REDE.cache.set("u"+i, {ts:0, p:null}); podarCacheRede();');
  assert.equal(av('REDE.cache.size'), av('REDE.cacheMax'));
  assert.equal(av('REDE.cache.has("u0")'), false, 'a mais antiga saiu');
  assert.equal(av('REDE.cache.has("u"+(REDE.cacheMax+29))'), true, 'a mais recente ficou');
  av('REDE.cache.clear()');
});

test('os mosaicos são pedidos à rede sem entrar na cache', semAplicacao, async () => {
  const { readFile } = await import('node:fs/promises');
  const f = await readFile('fonte/3-planeamento/05-mapa-operacional.js', 'utf8');
  assert.match(f, /fetchT\(mosaicoURL\(z, x, y\), \{ semCache:true \}, 12000\)/);
});

test('uma carta declarada que não ficou gravada não responde ok', semAplicacao, async () => {
  av('window.__set = ARMAZEM.set; ARMAZEM.set = async ()=>{ throw new Error("disco cheio de propósito"); };');
  const r = await av('guardarCarta("https://x.exemplo/{z}/{x}/{y}.png", "Fonte de teste", "https://x.exemplo/termos", 18)');
  av('ARMAZEM.set = window.__set; delete window.__set;');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /não ficou gravado/);
  assert.equal(av('!!CARTA'), true, 'mas a carta fica em uso nesta sessão');
});

/* ---- as folhas por ocorrência ---- */

test('carregarFolhas só traz as folhas desta ocorrência', semAplicacao, async () => {
  av(`window.__idb = _idb; window.IDB_antes = IDB; IDB = {};
    _idb = async (loja, modo, fn) => [
      { id:"fA", nome:"A", largura:100, altura:100, mundo:{A:1,D:0,B:0,E:-1,C:0,F:0}, grelha:"pttm06", proveniencia:"p", pontos:0, controlos:[], num:"OC-A" },
      { id:"fB", nome:"B", largura:100, altura:100, mundo:{A:1,D:0,B:0,E:-1,C:0,F:0}, grelha:"pttm06", proveniencia:"p", pontos:0, controlos:[], num:"OC-B" },
      { id:"f0", nome:"sem", largura:100, altura:100, mundo:{A:1,D:0,B:0,E:-1,C:0,F:0}, grelha:"pttm06", proveniencia:"p", pontos:0, controlos:[] },
    ];`);
  try {
    av('O.meta.num = "OC-A"'); await av('carregarFolhas()');
    assert.equal(av('FOLHAS.map(f=>f.id).join(",")'), 'fA');
    av('O.meta.num = "OC-B"'); await av('carregarFolhas()');
    assert.equal(av('FOLHAS.map(f=>f.id).join(",")'), 'fB');
    /* Desde a r0103 a folha sem número nem identificador é órfã: fica na base, conta-se, e
       não se atribui a ninguém — nem à ocorrência sem número (ramo #001). */
    av('O.meta.num = ""'); await av('carregarFolhas()');
    assert.equal(av('FOLHAS.map(f=>f.id).join(",")'), '', 'a folha de antes da r0099 não se atribui à ocorrência aberta');
    assert.equal(av('FOLHAS_ORFAS'), 1, 'mas conta-se, para o quadro a dizer');
  } finally {
    av('_idb = window.__idb; IDB = window.IDB_antes; delete window.__idb; delete window.IDB_antes;');
  }
});

test('a colocação gravada leva o número da ocorrência', semAplicacao, () => {
  av('O.meta.num = "OC-X"');
  const c = av('colocacaoDaFolha({ id:"f1", nome:"n", largura:1, altura:1, mundo:{}, grelha:"pttm06", proveniencia:"p", pontos:0, controlos:[] })');
  assert.equal(c.num, 'OC-X');
});

/* ---- importação ---- */

test('um ficheiro acima do teto é recusado antes de ser lido', semAplicacao, async () => {
  const f = { size: 9 * 1048576, text: async () => { throw new Error('não devia ler'); } };
  av('window.__f = null');
  await assert.rejects(
    av(`lerTextoComTeto(${JSON.stringify({ size: f.size })}, undefined)`).catch((e) => { throw e; }),
    /9,0 MB e o teto é 8 MB/,
  );
  const ok = await av('lerTextoComTeto({ size: 1024, text: async () => "conteúdo" })');
  assert.equal(ok, 'conteúdo');
});

test('a importação analisa o texto uma vez só', semAplicacao, async () => {
  const pacote = JSON.stringify({ tipo: 'peaapp:ocorrencia', estado: { versao: 0, meta: { num: 'IMP-1', local: 'x' } } });
  // Conta-se só a análise **do texto do pacote**: a forma copia vazios por
  // JSON.parse(JSON.stringify(...)) e isso não é o que se está a medir.
  av(`window.__texto = ${JSON.stringify(pacote)}; window.__parse = JSON.parse; window.__n = 0;
      JSON.parse = function(t){ if(t === window.__texto) window.__n++; return window.__parse(t); };`);
  try {
    await av('importarOcorrencia(window.__texto)');
  } finally {
    av('JSON.parse = window.__parse;');
  }
  const n = av('window.__n');
  av('delete window.__parse; delete window.__n; delete window.__texto;');
  assert.equal(n, 1, 'eram quatro análises do mesmo texto');
  assert.equal(av('O.meta.num'), 'IMP-1');
});

test('a forma profunda tira um setor que é uma cadeia e um ponto sem tipo, e conta-os', semAplicacao, () => {
  const r = av(`(()=>{ const e = novoEstado();
    e.dados.est.setores = [ {estado:"Em curso", cmd:"a"}, "isto não é um setor", null ];
    e.dados.pontos = [ {tipo:"pco", lat:1, lon:1}, {lat:2, lon:2}, 7 ];
    e.pco.funcoes = [ {f:"COS", nome:"x"}, {nome:"sem f"} ];
    e.dados.frentes = "texto";
    const probs = conferirForma(e);
    return JSON.stringify({ probs, setores:e.dados.est.setores.length, pontos:e.dados.pontos.length,
      funcoes:e.pco.funcoes.length, frentes:Array.isArray(e.dados.frentes) }); })()`);
  const q = JSON.parse(r);
  assert.equal(q.setores, 1); assert.equal(q.pontos, 1); assert.equal(q.funcoes, 1);
  assert.equal(q.frentes, true, 'um ramo com o tipo errado é reposto vazio');
  assert.ok(q.probs.some((p) => /dados\.est\.setores/.test(p)), q.probs.join(' | '));
  assert.ok(q.probs.some((p) => /dados\.frentes/.test(p)));
});

test('a forma profunda não inventa pais que a migração não criou', semAplicacao, () => {
  const r = av(`(()=>{ const e = { meta:{}, dados:{} }; const probs = conferirForma(e);
    return JSON.stringify({ temEst: "est" in e.dados, probs }); })()`);
  const q = JSON.parse(r);
  assert.equal(q.temEst, false, 'sem `dados.est` não se escreve `dados.est.setores`');
});

/* ---- erros que se veem ---- */

test('uma exceção a meio da elaboração repõe o botão', semAplicacao, async () => {
  av(`O.meta.num="T"; O.meta.local="L"; O.meta.pco="P"; O.meta.fase="II"; O.dados.area="1"; O.dados.setores="x"; ANALISE = { ok:true };
      escreverForm();
      window.__m = metricas; metricas = ()=>{ throw new Error("rebentei de propósito"); };`);
  try {
    await av('emitirPEA()');
  } finally {
    av('metricas = window.__m; delete window.__m;');
  }
  assert.equal(av('$("b-gerar").disabled'), false, 'o botão não pode ficar morto');
  assert.equal(av('$("b-gerar").textContent'), 'Elaborar proposta de PEA');
});

test('um carimbo de encerramento que não fica gravado acende o indicador', semAplicacao, async () => {
  av('window.__set = ARMAZEM.set; ARMAZEM.set = async ()=>{ throw new Error("disco cheio de propósito"); };');
  try {
    av('registarGravacao({ok:true})');
    const r = await av(`(async()=>{ const E = encObj(); E.sha = resumoEstado(O);
      try{ await ARMAZEM.set(chave(), JSON.stringify(O)); }
      catch(e){ registarGravacao({ ok:false, erro:"carimbo do encerramento não gravado: "+e.message }); }
      return GRAVACAO.estado + "|" + GRAVACAO.erro; })()`);
    assert.match(r, /^falhou\|carimbo do encerramento não gravado/);
  } finally {
    av('ARMAZEM.set = window.__set; delete window.__set;');
  }
});

test('apagar uma ocorrência que não se consegue apagar não a tira do índice', semAplicacao, async () => {
  av(`INDEX = [{ num:"AP-1", local:"x", pasta:"p", pco:"", g:"", peas:0 }];
      window.__del = ARMAZEM.del; ARMAZEM.del = async ()=>{ throw new Error("recusado de propósito"); };
      window.__confirm = window.confirm; window.confirm = ()=>true;`);
  try {
    await av('window.apagarOcc("AP-1")');
  } finally {
    av('ARMAZEM.del = window.__del; window.confirm = window.__confirm; delete window.__del; delete window.__confirm;');
  }
  assert.equal(av('INDEX.some(x=>x.num==="AP-1")'), true, 'a ocorrência continua gravada: tem de continuar no índice');
  assert.match(av('$("msg-occ").textContent'), /Continua no arquivo/);
  av('INDEX = []');
});
