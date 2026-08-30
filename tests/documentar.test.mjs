// A cobertura de documentação, e o limiar que não desce.

import test from 'node:test';
import assert from 'node:assert/strict';
import { funcoesDe, medir, TOLERADAS } from '../ferramentas/documentar.mjs';

test('conta as funções de topo e vê se trazem comentário', () => {
  const r = funcoesDe([
    '/** diz o que promete */',
    'function comDoc(){}',
    '',
    'function semDoc(){}',
    '// também conta',
    'async function comLinha(){}'
  ].join('\n'));
  assert.deepEqual(r.map((x) => [x.nome, x.documentada]),
    [['comDoc', true], ['semDoc', false], ['comLinha', true]]);
});

test('um comentário com código pelo meio não documenta a função', () => {
  /* Documenta o código pelo meio. É o que se lê, e é esse o critério. */
  const r = funcoesDe(['/** isto é de outra coisa */', 'const X = 1;', 'function longe(){}'].join('\n'));
  assert.equal(r[0].documentada, false);
});

test('uma função aninhada não conta: só as de topo', () => {
  const r = funcoesDe(['/** topo */', 'function fora(){', '  function dentro(){}', '}'].join('\n'));
  assert.deepEqual(r.map((x) => x.nome), ['fora']);
});

test('a fonte está toda documentada, e não pode deixar de estar', async () => {
  /* O limiar não desce. Foi assim que 135 funções ficaram sem uma linha sem que ninguém
     desse por isso: nada media, e portanto nada acusava. */
  const r = await medir();
  assert.ok(r.total > 300, 'a fonte encolheu de mais: ' + r.total);
  assert.deepEqual(r.semComentario, [], 'funções sem uma linha a dizer o que prometem');
  assert.equal(TOLERADAS, 0);
});
