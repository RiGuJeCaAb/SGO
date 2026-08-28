// Correção 4.1 — versão do estado gravado.
// Uma ocorrência gravada é prova documental: tem de sobreviver a mudanças de forma,
// e não pode ser lida à sorte por uma revisão que não a saiba ler.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar, excecoesDeArranque } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const VERSAO = janela ? avaliar(janela, 'VERSAO_ESTADO') : 0;

test('a aplicação arranca sem exceções', semAplicacao, () => {
  assert.deepEqual(excecoesDeArranque, [], 'o script rebentou ao arrancar');
  assert.equal(typeof avaliar(janela, 'O'), 'object', 'o estado global não chegou a existir');
});

test('o estado novo nasce com a versão desta revisão', semAplicacao, () => {
  assert.equal(janela.novoEstado().versao, VERSAO);
  assert.ok(Number.isInteger(VERSAO) && VERSAO >= 1);
});

test('há uma migração por cada versão', semAplicacao, () => {
  assert.equal(avaliar(janela, 'MIGRACOES').length, VERSAO);
});

test('um estado sem versão é tratado como versão zero e migrado', semAplicacao, () => {
  const migrado = janela.migrarGravado({ meta: { num: '2026/123' } });
  assert.equal(migrado.versao, VERSAO);
});

test('a migração preserva tudo o que já lá estava', semAplicacao, () => {
  const antigo = {
    meta: { num: '2026/123', local: 'Moimenta da Beira', lat: '41,1' },
    dados: { area: '340', est: { n: 3 } },
    peas: [{ n: 1 }],
  };
  const m = janela.migrarGravado(structuredClone(antigo));

  assert.equal(m.meta.num, '2026/123');
  assert.equal(m.meta.local, 'Moimenta da Beira');
  assert.equal(m.meta.lat, '41,1');
  assert.equal(m.dados.area, '340');
  assert.equal(m.dados.est.n, 3);
  assert.equal(m.peas.length, 1);
});

test('a migração preenche o que faltava, sem inventar', semAplicacao, () => {
  const m = janela.migrarGravado({ meta: { num: '2026/123' } });

  assert.equal(m.meta.distrito, '', 'campo derivado ausente fica vazio, não indefinido');
  assert.equal(m.meta.nivel, '');
  // Comparação campo a campo: os objetos vêm do realm do jsdom e não passam
  // numa igualdade profunda estrita, que também compara protótipos.
  assert.equal(m.dados.est.res.m, '');
  assert.equal(m.dados.est.res.o, '');
  assert.equal(m.dados.topo.orient, '');
  assert.equal(m.dados.topo.declive, '');
  assert.equal(m.dados.topo.obs, '');
  assert.equal(typeof m.pco.canais, 'object');
});

test('ramos que deviam ser listas passam a ser listas', semAplicacao, () => {
  const m = janela.migrarGravado({ evolucao: null, peas: 'lixo', dados: { anexos: 7 } });

  for (const ramo of ['evolucao', 'peas', 'fita']) assert.ok(Array.isArray(m[ramo]), ramo);
  assert.ok(Array.isArray(m.dados.anexos));
  assert.ok(Array.isArray(m.pco.funcoes));
  assert.ok(Array.isArray(m.pco.canais.atrib));
});

test('um estado de revisão posterior é recusado, não adivinhado', semAplicacao, () => {
  const futuro = VERSAO + 5;
  assert.throws(
    () => janela.migrarGravado({ versao: futuro, meta: { num: '2026/999' } }),
    (e) => e.futuro === futuro,
    'devia recusar e dizer de que versão veio',
  );
});

test('lixo não passa por estado', semAplicacao, () => {
  assert.throws(() => janela.migrarGravado(null));
  assert.throws(() => janela.migrarGravado('texto'));
});
