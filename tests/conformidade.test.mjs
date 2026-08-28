// Correção 4.4 — o relógio injetado.
// As regras de prazo são as que têm consequência operacional direta. Enquanto
// lessem a hora do sistema não havia como exercitá-las; agora recebem o instante.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const INICIO = '281200AGO26';
const MINUTO = 60000;

/** Prepara uma ocorrência com GDH de início conhecido e devolve esse instante. */
function ocorrenciaAs(minutos, setores = []) {
  const O = avaliar(janela, 'O');
  O.meta.inicio = INICIO;
  O.dados.est.setores = setores;
  O.dados.est.n = setores.length;
  return janela.parseGDH(INICIO).getTime() + minutos * MINUTO;
}

const acharPorId = (itens, id) => itens.find((x) => x.id === id);

test('o GDH de início é lido como esperado', semAplicacao, () => {
  const d = janela.parseGDH(INICIO);
  assert.equal(d.getDate(), 28);
  assert.equal(d.getHours(), 12);
  assert.equal(d.getMinutes(), 0);
});

test('antes dos 90 minutos o ataque inicial está dentro do prazo', semAplicacao, () => {
  const item = acharPorId(janela.verificacoesDON(ocorrenciaAs(30)), 'ata');
  assert.ok(item, 'a regra dos 90 minutos devia pronunciar-se');
  assert.equal(item.n, 'ok');
  assert.match(item.s, /Faltam 60 minutos/);
});

test('aos 90 minutos passa a obrigação de PEA formal', semAplicacao, () => {
  const item = acharPorId(janela.verificacoesDON(ocorrenciaAs(90)), 'ata');
  assert.equal(item.n, 'ob');
  assert.match(item.t, /Ataque ampliado/);
});

test('a fronteira dos 90 minutos está no minuto certo', semAplicacao, () => {
  assert.equal(acharPorId(janela.verificacoesDON(ocorrenciaAs(89)), 'ata').n, 'ok');
  assert.equal(acharPorId(janela.verificacoesDON(ocorrenciaAs(90)), 'ata').n, 'ob');
});

test('às duas horas sem domínio há notificação por confirmar', semAplicacao, () => {
  const emCurso = [{ estado: 'Em curso (ativo)', tip: [] }];
  const itens = janela.verificacoesDON(ocorrenciaAs(120, emCurso));
  assert.ok(acharPorId(itens, 'notif'), 'a regra das 2 horas devia disparar');
  assert.equal(acharPorId(itens, 'pmepc'), undefined, 'ainda não são 24 horas');
});

test('às vinte e quatro horas sem domínio recomenda-se o PMEPC', semAplicacao, () => {
  const emCurso = [{ estado: 'Em curso (ativo)', tip: [] }];
  const itens = janela.verificacoesDON(ocorrenciaAs(1440, emCurso));
  assert.ok(acharPorId(itens, 'pmepc'), 'a regra das 24 horas devia disparar');
});

test('um incêndio dominado passa a regra das duas horas em conformidade', semAplicacao, () => {
  const dominado = [{ estado: 'Em resolução (dominado)', tip: [] }];
  const item = acharPorId(janela.verificacoesDON(ocorrenciaAs(200, dominado)), 'notif');
  assert.ok(item, 'a regra pronuncia-se na mesma, para deixar registo');
  assert.equal(item.n, 'ok', 'conformidade verificada, não obrigação');
  assert.match(item.s, /Nenhum setor se encontra em curso/);
});

test('sem GDH de início as regras de prazo calam-se', semAplicacao, () => {
  const O = avaliar(janela, 'O');
  O.meta.inicio = '';
  const itens = janela.verificacoesDON(Date.now());
  assert.equal(acharPorId(itens, 'ata'), undefined);
});

test('as rendições contam a partir do instante recebido', semAplicacao, () => {
  const O = avaliar(janela, 'O');
  const entrada = janela.parseGDH(INICIO).getTime();
  O.dados.est.setores = [{ estado: 'Em curso (ativo)', tip: [{ t: 'ECIN', q: 1, ou: 5, ts: entrada }] }];
  O.dados.est.n = 1;

  const aoFimDe = (h) => janela.rendicoes(entrada + h * 60 * MINUTO)[0];
  assert.ok(Math.abs(aoFimDe(3).h - 3) < 0.01, 'três horas de empenhamento');
  assert.ok(Math.abs(aoFimDe(14).h - 14) < 0.01, 'catorze horas de empenhamento');
  assert.equal(aoFimDe(3).nivel, 'v', 'às três horas ainda está dentro do limiar');
  assert.equal(aoFimDe(14).nivel, 'r', 'às catorze horas a rendição é devida');
});

test('sem instante, as verificações usam o relógio corrente', semAplicacao, () => {
  const O = avaliar(janela, 'O');
  O.meta.inicio = janela.gdhAgora();
  const item = acharPorId(janela.verificacoesDON(), 'ata');
  assert.ok(item, 'devia pronunciar-se sobre o prazo');
  assert.equal(item.n, 'ok', 'acabou de começar');
});
