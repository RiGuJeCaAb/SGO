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
/* A entrega inteira, para varrer citações que vivem fora do registo de conformidade. */
const { revisaoMaisRecente } = await import('../ferramentas/verificar.mjs');
const recente = await revisaoMaisRecente();
const APP = recente ? await readFile(recente, 'utf8') : '';
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

/* ---- os pontos da DON n.º 2, conferidos contra o PDF ---- */

/* Os quinze pontos que a aplicação cita, cada um localizado no texto da diretiva a 4 de
   setembro, com a secção `7. EXECUÇÃO` e as subsecções `7.d — Teatros de Operações` e
   `7.e — Desenvolvimento das Ações Operacionais`. A tabela com o que cada um diz está em
   `docs/FONTES.md`; aqui fica só a lista, que é o que se pode comparar por código.

   **Existe porque uma citação errada é pior do que citação nenhuma:** parece ter
   proveniência. Houve uma — o núcleo de especialistas em `7.e.(27)`, quando o ponto (27)
   está em `7.d` — e passou despercebida a duas revisões. */
const PONTOS_DON2 = [
  '7.d.(5)', '7.d.(7)', '7.d.(8)', '7.d.(14)', '7.d.(17)', '7.d.(18)', '7.d.(19)',
  '7.d.(20)', '7.d.(22)', '7.d.(23)', '7.d.(25)(d)', '7.d.(27)', '7.d.(29)', '7.d.(30)',
  '7.e.(4)(o)', '7.e.(4)(t)', '7.e.(5)', '7.e.(5)(a)', '7.e.(5)(r)', '7.e.(5)(t)',
  '7.k.(1)', '7.k.(2)', '7.l.(1)', '7.l.(2)',
];

test('nenhuma citação da DON n.º 2 entra sem estar conferida contra o PDF', semAplicacao, () => {
  /* Varre a entrega inteira e não só o registo de conformidade: as citações estão espalhadas
     pelos módulos — na estrutura do PCO, na arrumação, na passagem de turno. */
  const html = APP;
  const achados = [...html.matchAll(/\b(\d\.[a-z]\.\(\d+\)(?:\([a-z]\))?)/g)].map((m) => m[1]);
  const unicos = [...new Set(achados)].sort();
  assert.ok(unicos.length >= 20, 'só ' + unicos.length + ' pontos citados — a varredura falhou');
  const naoConferidos = unicos.filter((x) => !PONTOS_DON2.includes(x));
  assert.equal(naoConferidos.join(', '), '',
    'pontos citados que não constam da lista conferida em docs/FONTES.md');
});

test('a lista conferida não tem pontos que ninguém cita', semAplicacao, () => {
  /* O inverso, e importa tanto: um ponto que sai da aplicação e fica na lista dá a entender
     que a aplicação o invoca. A lista é o que está conferido E citado, não um arquivo. */
  const html = APP;
  const orfaos = PONTOS_DON2.filter((x) => !html.includes(x));
  assert.equal(orfaos.join(', '), '', 'conferidos e já não citados — retirar da lista');
});

test('o ponto (27) é citado em 7.d e nunca em 7.e', semAplicacao, () => {
  /* O defeito concreto, prendido pelo seu nome. O ponto (27) — a ativação do núcleo de
     especialistas — está na subsecção dos Teatros de Operações. */
  assert.ok(!APP.includes('7.e.(27)'), 'voltou o 7.e.(27)');
  assert.ok(APP.includes('7.d.(27)'));
});

test('o POSIT horário é 7.e.(4)(o), que é o Ataque Inicial', semAplicacao, () => {
  /* O ramo #006 propôs corrigi-lo para `7.e.(5)(o)`. Não é: o ponto (5) é o Ataque Ampliado.
     Aceitar a correção teria introduzido o defeito que ela vinha corrigir, e é por isso que
     este teste existe com o nome que tem. */
  assert.ok(APP.includes('7.e.(4)(o)'));
  assert.ok(!APP.includes('7.e.(5)(o)'), 'a correção errada entrou');
});
