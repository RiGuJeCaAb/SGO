// A lista de origens dos meios terrestres: o que a DON n.º 2 / DECIR 2026 nomeia por
// localização, e o que já se escreveu nesta ocorrência. A diretiva não traz a lista dos
// corpos de bombeiros, e a lista não finge que traz.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());
const daqui = (x) => JSON.parse(JSON.stringify(x));

test('o Anexo 10 está transcrito inteiro, e os totais batem', semAplicacao, () => {
  const T = daqui(avaliar(janela, 'ORIGENS_DECIR'));
  const O10 = T.filter((o) => o.a === 'Anexo 10');
  assert.equal(O10.length, 42, '42 CMA com equipas da GNR');
  const equipas = O10.reduce((s, o) => s + (+(o.d.match(/^(\d+) EHATI/) || [0, 0])[1]), 0);
  assert.equal(equipas, 43, 'Arcos de Valdevez e Chaves têm duas');
  const vr = O10.find((o) => o.n === 'UEPS/GNR — Vila Real');
  assert.equal(vr.s, 'Douro');
  assert.match(vr.d, /1 EHATI, 5 militares; ETATI, 4 militares, 1 VLCI/);
  assert.match(O10.find((o) => o.n === 'UEPS/GNR — Ponte de Sor').d, /sem EHATI; ETATI, 8 militares, 2 VLCI/);
  /* O total impresso no Anexo 23 diz 30; as linhas somam 25. Transcreve-se o que as linhas dizem. */
  assert.equal(T.filter((o) => o.a === 'Anexo 23').reduce((s, o) => s + (+o.d.match(/^(\d+)/)[1]), 0), 25);
  assert.deepEqual(T.filter((o) => o.s === 'Douro').map((o) => o.n).sort(),
    ['CBV Provesende', 'CBV Vila Real - Cruz Verde', 'UEPS/GNR — Armamar', 'UEPS/GNR — Vila Real']);
});

test('a lista põe primeiro o que já se escreveu, depois a sub-região do TO, depois o resto', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.subregiao = 'Douro';
  const e = janela.estObj(); e.n = 1;
  janela.renderSetores();
  e.setores[0].tip = [{ t: 'VFCI', mu: 1, ou: 5, ent: 'CB Lamego' }, { t: 'VLCI', mu: 1, ou: 5, ent: 'CB Lamego' }, { t: 'VFCI', mu: 1, ou: 5, ent: '' }];
  janela.renderSetores();
  const L = daqui(janela.opcoesOrigem());
  assert.equal(L[0].n, 'CB Lamego'); assert.equal(L.filter((o) => o.n === 'CB Lamego').length, 1);
  const nomes = L.map((o) => o.n);
  assert.deepEqual(nomes.slice(1, 5).sort(), ['CBV Provesende', 'CBV Vila Real - Cruz Verde', 'UEPS/GNR — Armamar', 'UEPS/GNR — Vila Real']);
  assert.ok(nomes.indexOf('CBM Olhão') > 5);
  const doc = janela.document;
  const dl = doc.getElementById('origem-lista');
  assert.equal(dl.querySelectorAll('option').length, L.length);
  assert.equal(dl.querySelector('option').value, 'CB Lamego');
  assert.match(dl.querySelectorAll('option')[1].textContent, /Douro.*DON n\.º 2 \/ DECIR 2026, Anexo/);
  assert.equal(doc.getElementById('ta-e-0').getAttribute('list'), 'origem-lista');
  /* Sem sub-região declarada, a ordem é a da diretiva: a GNR de Arcos de Valdevez primeiro. O
     posto pode estar em qualquer ponto do país, e a lista é a do país inteiro. */
  O.meta.subregiao = '';
  const N = daqui(janela.opcoesOrigem());
  assert.equal(N[1].n, 'UEPS/GNR — Arcos de Valdevez');
  assert.equal(N.length, L.length);
  janela.eval('O = novoEstado()');
});
