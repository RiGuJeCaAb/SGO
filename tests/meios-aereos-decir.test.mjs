// A rede de meios aéreos do DECIR — Anexos 6 e 18 da DON n.º 2 / DECIR 2026 — transcrita
// para a aplicação a 6 de setembro, para o indicativo se escolher de uma lista. A prova de
// que a transcrição está certa é a da própria diretiva: os subtotais de cada período.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());
const daqui = (x) => JSON.parse(JSON.stringify(x));

/* Os subtotais impressos no Anexo 6, por período: HEBL, HEBP, AVBM, AVBP, HERAC, AVRAC. */
const SUBTOTAIS = [
  ['ALFA', 101, 514, [7, 0, 4, 0, 0, 0]],
  ['BRAVO', 515, 531, [19, 2, 10, 2, 2, 2]],
  ['CHARLIE/DELTA', 601, 930, [43, 7, 20, 2, 4, 2]],
  ['CHARLIE', 1001, 1015, [34, 7, 18, 2, 4, 2]],
  ['BRAVO', 1016, 1031, [10, 0, 8, 0, 2, 2]],
  ['ALFA', 1101, 1231, [5, 0, 4, 0, 0, 0]],
];
const TIPOS = ['HEBL', 'HEBP', 'AVBM', 'AVBP', 'HERAC', 'AVRAC'];

test('a transcrição do Anexo 6 bate com os subtotais de cada período', semAplicacao, () => {
  const R = daqui(avaliar(janela, 'AEREOS_DECIR'));
  assert.equal(R.ano, 2026);
  assert.equal(R.periodos.length, 6);
  R.periodos.forEach((p, i) => {
    const [n, de, a, sub] = SUBTOTAIS[i];
    assert.equal(p.n, n); assert.equal(p.de, de); assert.equal(p.a, a);
    const conta = TIPOS.map((t) => p.meios.filter((m) => m[1] === t).length);
    assert.deepEqual(conta, sub, `${n} ${de}-${a}`);
    assert.equal(p.meios.length, sub.reduce((s, x) => s + x, 0));
    /* Um indicativo não se repete dentro do período. */
    assert.equal(new Set(p.meios.map((m) => m[0])).size, p.meios.length, n + ': indicativo repetido');
  });
});

test('todos os CMA referidos existem, e quase todos têm coordenadas em Portugal continental', semAplicacao, () => {
  const C = daqui(avaliar(janela, 'CMA_DECIR'));
  const R = daqui(avaliar(janela, 'AEREOS_DECIR'));
  assert.equal(C.length, 50, '49 do Anexo 18 e Ovar (BA8), que só o Anexo 6 tem');
  const nomes = new Set(C.map((c) => c.n));
  R.periodos.forEach((p) => p.meios.forEach((m) => assert.ok(nomes.has(m[2]), m.join(' '))));
  assert.ok(C.every((c) => !/ [a-z]/.test(c.s) || / (de|e|do|da) /.test(' ' + c.s + ' ')), 'nomes com espaços partidos');
  assert.equal(C.find((c) => c.n === 'Évora').s, 'Alentejo Central', 'a gralha «Alto Central» do Anexo 18 não passa');
  const semCoord = C.filter((c) => c.lat == null);
  assert.deepEqual(semCoord.map((c) => c.n), ['Ovar (BA8)'], 'só Ovar falta ao Anexo 18');
  C.filter((c) => c.lat != null).forEach((c) => {
    assert.ok(c.lat > 36.9 && c.lat < 42.2 && c.lon > -9.6 && c.lon < -6.1, c.n + ' fora do continente');
  });
  const vr = C.find((c) => c.n === 'Vila Real');
  assert.equal(vr.s, 'Douro'); assert.equal(vr.t, 'Pista');
  assert.ok(Math.abs(vr.lat - 41.27594) < 0.001 && Math.abs(vr.lon + 7.71929) < 0.001);
});

test('o período de uma data traz os meios com o CMA, e fora do ano não traz nada', semAplicacao, () => {
  const verao = janela.periodoAereoDECIR(new Date(2026, 6, 15));
  assert.equal(verao.n, 'CHARLIE/DELTA');
  const h15 = verao.meios.find((m) => m.ind === 'H15');
  assert.equal(h15.t, 'HEBL'); assert.equal(h15.cma.n, 'Vila Real'); assert.equal(h15.cma.s, 'Douro');
  assert.equal(verao.meios.find((m) => m.ind === 'FIRE4').t, 'HERAC');
  assert.equal(verao.meios.find((m) => m.ind === 'K2').cma.n, 'Macedo de Cavaleiros');
  assert.equal(verao.meios.find((m) => m.ind === 'Pantera 1').cma.n, 'Ovar (BA8)');
  assert.equal(verao.meios.find((m) => m.ind === 'A20').cma.n, 'Santarém');
  const inverno = janela.periodoAereoDECIR(new Date(2026, 0, 20));
  assert.equal(inverno.n, 'ALFA'); assert.equal(inverno.meios.length, 11);
  assert.ok(inverno.meios.some((m) => m.ind === 'H15'));
  assert.ok(!inverno.meios.some((m) => m.ind === 'K2'));
  assert.equal(janela.periodoAereoDECIR(new Date(2025, 6, 15)), null, 'sem diretiva de 2025 em fonte');
});

test('o indicativo procura-se sem cuidar de maiúsculas nem espaços', semAplicacao, () => {
  const d = new Date(2026, 6, 15);
  assert.equal(janela.meioAereoDECIR('h15', d).cma.n, 'Vila Real');
  assert.equal(janela.meioAereoDECIR('pantera1', d).t, 'HEBP');
  assert.equal(janela.meioAereoDECIR('', d), null);
  assert.equal(janela.meioAereoDECIR('ZULU 9', d), null);
});

test('com coordenadas da ocorrência a lista vem do CMA mais perto para o mais longe', semAplicacao, () => {
  const d = new Date(2026, 6, 15);
  const L = daqui(janela.opcoesIndicativosAereos(d, 41.27594, -7.71929));
  assert.equal(L.length, 78);
  assert.equal(L[0].cma.n, 'Vila Real'); assert.ok(L[0].km < 1);
  for (let i = 1; i < L.length; i++) {
    if (L[i].km == null) { assert.equal(L[i].cma.n, 'Ovar (BA8)'); continue; }
    assert.ok(L[i].km >= L[i - 1].km, 'fora de ordem em ' + L[i].ind);
  }
  assert.ok(L.at(-1).km == null || L.at(-1).km > 200, 'o Algarve fica no fim');
  const semPonto = daqui(janela.opcoesIndicativosAereos(d, NaN, NaN));
  assert.equal(semPonto[0].ind, 'H1', 'sem ponto, a ordem é a da diretiva');
  assert.ok(semPonto.every((o) => o.km == null));
});

test('o campo do indicativo tem a lista, a linha diz de onde vem, e escolher acerta o tipo', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.inicio = '151200JUL26'; O.meta.lat = '41.27594'; O.meta.lon = '-7.71929';
  janela.renderAereos();
  const doc = janela.document;
  const dl = doc.getElementById('aer-lista');
  assert.equal(doc.getElementById('aer-i').getAttribute('list'), 'aer-lista');
  assert.equal(dl.querySelectorAll('option').length, 78);
  assert.equal(dl.querySelector('option').value, 'H15');
  assert.match(dl.querySelector('option').textContent, /HEBL · Vila Real \(Douro\) · 0 km/);
  assert.match(doc.getElementById('aer-rede').textContent, /Anexo 6.*CHARLIE\/DELTA.*01\/06 a 30\/09.*78 meios.*mais perto/);
  const i = doc.getElementById('aer-i');
  i.value = 'K2'; i.dispatchEvent(new janela.Event('input', { bubbles: true }));
  assert.equal(doc.getElementById('aer-t').value, 'HEBP');
  i.value = 'AFOCELCA 3'; i.dispatchEvent(new janela.Event('input', { bubbles: true }));
  assert.equal(doc.getElementById('aer-t').value, 'HEBP', 'o que não é da rede não mexe no tipo');
  /* Fora do ano da tabela a lista esvazia-se e a linha di-lo, em vez de mostrar 2026 como se fosse eterno. */
  O.meta.inicio = '151200JUL25';
  janela.pintarIndicativosAereos();
  assert.equal(dl.querySelectorAll('option').length, 0);
  assert.match(doc.getElementById('aer-rede').textContent, /Sem tabela.*2025/);
  janela.eval('O = novoEstado()');
});

test('registar um meio da rede leva o CMA de origem para o diário', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.inicio = '151200JUL26';
  const doc = janela.document;
  doc.getElementById('aer-i').value = 'H15'; doc.getElementById('aer-g').value = '';
  doc.getElementById('aer-add').click();
  const ultima = daqui(avaliar(janela, 'O')).fita.at(-1).e;
  assert.match(ultima, /H15.*sediado no CMA Vila Real/);
  janela.eval('O = novoEstado()');
});
