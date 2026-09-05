// As respostas dos ramos de 5 de setembro, integradas na r0103, cada uma exercitada pelo
// achado que trouxe. O #001 tem ficheiro próprio (`folhas-por-ocorrencia`).
//
// #003 (d0007): a citação de Byram intacta — a aplicação leu Fernandes (2003), que o cita —,
// a constante escondida no `/2`, a grandeza que a distância de segurança consome, e a frase
// de que o número não substitui o reconhecimento no local.
// #004 (t0021): a chave da pasta local leva a grelha; as chaves de antes apagam-se em vez de
// se adotarem; esquecer é por carta.
// #005 (q005): o `catch` que perdia uma afirmação de proveniência.
// #006 (d02): um percurso de fuga ou uma zona de segurança no caminho da frente alerta.

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

/** As linhas de todos os módulos da fonte, com o caminho e o número. */
function linhasDaFonte() {
  const out = [];
  for (const zona of readdirSync('fonte', { withFileTypes: true })) {
    if (!zona.isDirectory()) continue;
    for (const f of readdirSync(join('fonte', zona.name))) {
      if (!f.endsWith('.js')) continue;
      readFileSync(join('fonte', zona.name, f), 'utf8').split('\n').forEach((l, i) => out.push({ caminho: join('fonte', zona.name, f) + ':' + (i + 1), l }));
    }
  }
  readFileSync('fonte/molde.html', 'utf8').split('\n').forEach((l, i) => out.push({ caminho: 'fonte/molde.html:' + (i + 1), l }));
  return out;
}

/* ---- #003 ---- */

test('t-B1 · nenhuma citação de Byram sem dizer que foi lida em Fernandes (2003)', () => {
  const culpados = linhasDaFonte()
    .filter(({ l }) => /Byram/.test(l) && /1959/.test(l) && !/Fernandes/.test(l))
    .map(({ caminho }) => caminho);
  assert.deepEqual(culpados, [], 'uma citação em segunda mão apresentada como primária transfere para Byram escolhas que foram de Fernandes');
});

test('t-B2/t-B3 · o poder calorífico tem nome, e a intensidade sai dele e das conversões de unidade', semAplicacao, () => {
  assert.equal(av('H_COMBUSTAO'), 18000);
  assert.equal(av('intensidadeByram(3600, 20)'), 36000, 'H·w·R/36000 com H = 18 000 dá o R·w/2 de Fernandes');
  assert.equal(av('intensidadeByram("1,5", 2000)'), 1500, 'a vírgula continua a ler-se');
  const fonte = readFileSync('fonte/3-planeamento/19-intensidade-da-frente.js', 'utf8');
  const corpo = fonte.slice(fonte.indexOf('function intensidadeByram'), fonte.indexOf('\n}', fonte.indexOf('function intensidadeByram')));
  assert.doesNotMatch(corpo, /\/ *2\b/, 'o 2 que escondia a constante saiu');
  assert.match(corpo, /H_COMBUSTAO \* w \* r \/ 36000/);
});

test('t-A1 · os limites de manobra dizem que altura de chama consomem, e a segurança sai dela', semAplicacao, () => {
  const L = av('limitesDeManobra(1000, 10)');
  assert.ok(L, 'há limites com os dois números');
  assert.equal(L.alturaChama, L.chama, 'a altura toma-se igual ao comprimento — chama vertical — e diz-se');
  assert.equal(L.seguranca, Math.ceil(4 * L.alturaChama));
  assert.equal(L.seguranca, Math.ceil(L.seguranca), 'ao metro superior, sempre');
});

test('SEG-3 · toda a distância de segurança impressa diz que não substitui o reconhecimento no local', semAplicacao, () => {
  av('O.dados.fogo.r = "1000"; O.dados.fogo.w = "10";');
  const leitura = av('leituraDaIntensidade()');
  assert.match(leitura, /tomada igual ao comprimento/, 'a substituição de grandeza é declarada');
  assert.match(leitura, /não substitui o reconhecimento no local/);
  assert.match(leitura, /Anexo 3, situação n\.º 3/);
  assert.match(leitura, /por Fernandes 2003/);
  assert.match(leitura, /18.000 kJ\/kg/, 'o poder calorífico é imprimível');
  assert.match(av('AVISO_SEGURANCA'), /zonas de segurança e caminhos de fuga/);
  av('O.dados.fogo.r = ""; O.dados.fogo.w = "";');
});

test('t-A2 · a largura de contenção nunca se apresenta sem a condição das faúlhas', () => {
  // Cada sítio da fonte que escreve a regra do 1,5× tem de dizer, na mesma frase ou na
  // seguinte, que ela vale sem projeção de faúlhas — e que está atribuída, não confirmada.
  const linhas = linhasDaFonte();
  const sitios = linhas.map((x, i) => ({ ...x, i })).filter(({ l }) => /uma vez e meia o comprimento da chama/.test(l));
  assert.ok(sitios.length >= 3, 'há pelo menos os três sítios conhecidos: ' + sitios.length);
  for (const s of sitios) {
    const janelaDeTexto = linhas.slice(s.i, s.i + 3).map((x) => x.l).join(' ');
    assert.match(janelaDeTexto, /faúlhas|projeção/, s.caminho + ': a largura sem a condição é a largura na ausência do mecanismo dominante de falha');
  }
});

/* ---- #004 ---- */

test('a chave da pasta local leva a grelha, e a de antes reconhece-se para ser apagada', semAplicacao, () => {
  av('window.__cl = CARTA_LOCAL; CARTA_LOCAL = { grelha:"pttm06", atrib:"x", por:"", g:"" };');
  assert.equal(av('chaveMosaicoLocal(12, 1000, 2000)'), 'm/local/pttm06/12/1000/2000');
  av('CARTA_LOCAL = { grelha:"mercator", atrib:"x", por:"", g:"" };');
  assert.equal(av('chaveMosaicoLocal(12, 1000, 2000)'), 'm/local/mercator/12/1000/2000', 'duas pastas em grelhas diferentes não partilham quadrados');
  av('CARTA_LOCAL = window.__cl; delete window.__cl;');
  assert.equal(av('chaveMosaicoAntiga("m/12/1000/2000")'), true);
  assert.equal(av('chaveMosaicoAntiga("m/local/pttm06/12/1000/2000")'), false);
  assert.equal(av('chaveMosaicoAntiga("m/1a2b3c4d/12/1000/2000")'), false, 'a chave com impressão da carta não é antiga');
  assert.equal(av('prefixoMosaicos(true)'), 'm/local/');
});

test('esquecer é por carta: só saem as chaves do prefixo pedido', semAplicacao, async () => {
  av(`window.__idb = _idb; window.IDB_antes = IDB; IDB = {}; window.__apagadas = [];
    window.__chaves = ["m/aaaa/12/1/1", "m/aaaa/12/1/2", "m/bbbb/12/1/1", "m/local/pttm06/12/1/1", "m/12/1/1"];
    _idb = async (loja, modo, fn) => {
      const r = fn({ getAllKeys(){ return window.__chaves.slice(); }, delete(k){ window.__apagadas.push(k); }, clear(){ window.__apagadas.push("*"); }, getAll(){ return []; } });
      return r;
    };`);
  try {
    assert.equal(await av('esquecerMosaicos("m/aaaa/")'), 2);
    assert.deepEqual(JSON.parse(av('JSON.stringify(window.__apagadas)')), ['m/aaaa/12/1/1', 'm/aaaa/12/1/2'], 'as da carta bbbb e as da pasta ficam');
    av('window.__apagadas = [];');
    assert.equal(await av('apagarMosaicosAntigos()'), 1);
    assert.deepEqual(JSON.parse(av('JSON.stringify(window.__apagadas)')), ['m/12/1/1'], 'só a chave de antes da r0103 sai; nenhuma é adotada');
  } finally {
    av('_idb = window.__idb; IDB = window.IDB_antes; delete window.__idb; delete window.IDB_antes; delete window.__apagadas; delete window.__chaves;');
  }
});

/* ---- #005 ---- */

test('a conferência da série meteorológica que falha é dita, e não engolida', () => {
  const t = readFileSync('fonte/3-planeamento/11-meteograma.js', 'utf8');
  const i = t.indexOf('M.mexido = true');
  const bloco = t.slice(i, i + 900);
  assert.match(bloco, /catch\(e\)\{\s*fita\(/, 'o catch da conferência escreve na fita em vez de ficar vazio');
  assert.match(bloco, /proveniência desta análise não está conferida/);
});

/* ---- #006 ---- */

test('um percurso de fuga ou uma zona de segurança alerta quando a frente lá chega', semAplicacao, () => {
  assert.equal(av('defNota("seguranca").alerta'), true);
  assert.equal(av('defNota("manobra").alerta'), false, 'os acessos continuam em manobra, sem alerta');
  assert.match(av('defNota("seguranca").n'), /Percurso de fuga ou zona de segurança/);
  av('O.dados.notas = [{ id:"nt1", tipo:"seguranca", txt:"ZS na eira", lat:41.1, lon:-7.7 }, { id:"nt2", tipo:"manobra", txt:"entrada pela EN", lat:41.1, lon:-7.7 }];');
  assert.equal(av('avisosNoMapa().length'), 1);
  assert.equal(av('avisosNoMapa()[0].txt'), 'ZS na eira');
  av('O.dados.notas = [];');
});

test('a entrega oferece o tipo novo de nota no mapa', async () => {
  const entrega = readFileSync(await revisaoMaisRecente(), 'utf8');
  assert.match(entrega, /Percurso de fuga ou zona de segurança/);
});
