// Correção 4.3 — auditoria mecânica das fontes.
// A restrição de conformidade auditada exige que todo o conteúdo doutrinário citado
// tenha fonte identificada. Isto verifica-o por comparação, em vez de por leitura.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const FONTES = await readFile(new URL('../docs/FONTES.md', import.meta.url), 'utf8');
const regras = () => (janela ? avaliar(janela, 'REGRAS_DON') : []);

/** Com estado inteiramente vazio as regras calam-se, e bem. Uma ocorrência mínima
 *  basta para que se pronunciem. */
function prepararOcorrencia() {
  const O = avaliar(janela, 'O');
  O.meta.inicio = janela.gdhAgora();
  O.dados.est.n = 1;
  O.dados.est.setores = [{ estado: 'Em curso (ativo)', cmd: '', ct: '', adj: '', m: '', o: '', tip: [] }];
}

/** Chaves declaradas em docs/FONTES.md, na forma `CHAVE`. */
const chavesDocumentadas = new Set(FONTES.match(/`([A-Z][A-Z0-9]+)`/g)?.map((x) => x.slice(1, -1)) ?? []);

test('o registo tem regras, e cada uma está completa', semAplicacao, () => {
  const R = regras();
  assert.ok(R.length >= 12, `esperava pelo menos 12 regras, há ${R.length}`);
  for (const regra of R) {
    assert.ok(regra.id, 'regra sem identificador');
    assert.ok(Array.isArray(regra.ids) && regra.ids.length, `${regra.id}: sem lista de identificadores`);
    assert.ok(regra.t, `${regra.id}: sem título`);
    assert.ok(Array.isArray(regra.fontes) && regra.fontes.length, `${regra.id}: sem fontes declaradas`);
    assert.equal(typeof regra.avaliar, 'function', `${regra.id}: sem função de avaliação`);
  }
});

test('nenhuma regra invoca fonte que não conste de docs/FONTES.md', semAplicacao, () => {
  for (const regra of regras()) {
    for (const chave of regra.fontes) {
      assert.ok(chavesDocumentadas.has(chave), `${regra.id} invoca ${chave}, que não está documentada`);
    }
  }
});

test('cada documento citado nos itens está declarado na regra que o emite', semAplicacao, () => {
  // Como as fontes são deduzidas do texto da citação, o teste fecha o círculo:
  // se um item citar um documento que a regra não declara, a auditoria não bate certo.
  const marcas = { 'Despacho n.º 4067/2024': 'SGO4067', 'DON n.º 2': 'DON2', 'DON n.º 1': 'DON1' };
  prepararOcorrencia();
  const contexto = janela.contextoDON(Date.now());

  for (const regra of regras()) {
    let itens = [];
    try { itens = regra.avaliar(contexto) || []; } catch { continue; }
    for (const item of itens) {
      if (!item.r) continue;
      for (const [marca, chave] of Object.entries(marcas)) {
        if (item.r.includes(marca)) {
          assert.ok(regra.fontes.includes(chave), `${regra.id} cita ${marca} sem o declarar em fontes`);
        }
      }
    }
  }
});

test('todo o item emitido traz situação, fundamento, ação e referência', semAplicacao, () => {
  prepararOcorrencia();
  const itens = janela.verificacoesDON(Date.now());
  assert.ok(itens.length, 'devia haver verificações para uma ocorrência em curso');
  for (const item of itens) {
    assert.ok(['ob', 'av', 'ok'].includes(item.n), `${item.id}: natureza inesperada ${item.n}`);
    for (const campo of ['id', 't', 's', 'f', 'a']) {
      assert.ok(item[campo], `${item.id}: sem ${campo}`);
    }
    assert.ok(typeof item.r === 'string', `${item.id}: sem referência`);
  }
});

test('uma regra que rebente não leva as outras atrás', semAplicacao, () => {
  prepararOcorrencia();
  const R = regras();
  const original = R[0].avaliar;
  R[0].avaliar = () => { throw new Error('ensaio'); };
  try {
    const itens = janela.verificacoesDON(Date.now());
    const falhada = itens.find((x) => /Verificação indisponível/.test(x.t));
    assert.ok(falhada, 'a falha devia aparecer como aviso próprio');
    assert.equal(falhada.n, 'av');
    assert.ok(itens.length > 1, 'as restantes regras deviam continuar a correr');
  } finally {
    R[0].avaliar = original;
  }
});
