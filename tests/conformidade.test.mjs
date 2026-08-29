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

/* ---- repartição dos meios pelos setores ---- */

/**
 * Monta um dispositivo com os setores dados, cada um `{estado, veiculos}`, e devolve
 * os itens que a regra da repartição emite.
 */
function reparticao(setores) {
  const O = avaliar(janela, 'O');
  const e = janela.estObj();
  e.n = setores.length;
  e.setores = setores.map((s, i) => ({
    estado: s.estado, cmd: s.cmd || '', ct: '', adj: '', m: '', o: '',
    tip: s.veiculos ? [{ t: 'VFCI', q: s.veiculos, mu: 1, ou: 5, mr: 0, ar: 0, ts: janela.agora() }] : [],
  }));
  O.meta.inicio = janela.gdhDe(janela.agora() - 30 * 60000);
  return JSON.parse(JSON.stringify(janela.verificacoesDON())).filter((x) => x.id === 'reparticao');
}

const ATIVO = 'Em curso (ativo)', DOMINADO = 'Em resolução (dominado)';
const EXTINTO = 'Em conclusão (extinto)';
const VIGILANCIA = 'Vigilância ativa e consolidação de rescaldo';
const REATIVACAO = 'Reativação';

test('a frente que cedeu, com os meios lá parados, dá aviso e destino', semAplicacao, () => {
  // O caso que motivou a regra: Bravo era a frente, cedeu aos meios e entrou em
  // rescaldo com 6 veículos; Alfa continua a arder com 2.
  const v = reparticao([
    { estado: ATIVO, veiculos: 2, cmd: 'Cmdt CB Moimenta' },
    { estado: EXTINTO, veiculos: 6 },
  ]);
  assert.equal(v.length, 1);
  assert.equal(v[0].n, 'av');
  assert.match(v[0].t, /Meios concentrados em setor que já não os exige/);
  assert.match(v[0].s, /Bravo \(6 veículos\)/);
  assert.match(v[0].s, /Alfa, em curso, tem 2 veículos/);
  assert.match(v[0].a, /deslocar meios de Bravo para Alfa, ao cuidado de Cmdt CB Moimenta/);
  assert.match(v[0].a, /Até 6 veículos em causa/);
  assert.match(v[0].r, /art\. 17\.º, n\.º 1, als\. a\) e d\)/);
});

test('uma reativação tem precedência como destino', semAplicacao, () => {
  const v = reparticao([
    { estado: ATIVO, veiculos: 4 },
    { estado: REATIVACAO, veiculos: 1 },
    { estado: VIGILANCIA, veiculos: 5 },
  ]);
  assert.equal(v.length, 1);
  assert.match(v[0].t, /Reativação com menos meios/);
  assert.match(v[0].a, /para Bravo/, v[0].a);
});

test('vigilância ativa com presença não é desproporção', semAplicacao, () => {
  // A vigilância ativa e o rescaldo exigem meios no terreno. A regra compara; não
  // conta meios parados em absoluto, senão acusava o que é doutrinariamente devido.
  const v = reparticao([
    { estado: ATIVO, veiculos: 6 },
    { estado: VIGILANCIA, veiculos: 2 },
  ]);
  assert.equal(v.length, 1);
  assert.equal(v[0].n, 'ok');
  assert.match(v[0].t, /Meios repartidos conforme a atividade/);
});

test('um setor em resolução não é fonte de meios', semAplicacao, () => {
  // «Em resolução (dominado)» ainda consolida: não se mexe nele.
  const v = reparticao([
    { estado: ATIVO, veiculos: 1 },
    { estado: DOMINADO, veiculos: 8 },
  ]);
  assert.equal(v[0].n, 'ok', JSON.stringify(v[0]));
});

test('sem frente ativa e com meios no TO, propõe a reposição da capacidade', semAplicacao, () => {
  const v = reparticao([
    { estado: EXTINTO, veiculos: 3 },
    { estado: VIGILANCIA, veiculos: 2 },
  ]);
  assert.equal(v.length, 1);
  assert.equal(v[0].n, 'av');
  assert.match(v[0].t, /sem frente ativa/);
  assert.match(v[0].s, /5 veículos/);
  assert.match(v[0].a, /desmobilização faseada/);
  assert.match(v[0].r, /7\.e\.\(4\)\(t\)/);
});

test('sem setores, a regra cala-se', semAplicacao, () => {
  assert.deepEqual(reparticao([]), []);
});

/* ---- as frases-tipo produzem efeito no dispositivo ---- */

test('mudar o estado por qualquer porta deixa o mesmo rasto', semAplicacao, () => {
  // O menu da linha do setor e a frase-tipo da evolução passam pelo mesmo caminho.
  // Um segundo caminho sem registo daria um dispositivo a mudar sem que a evolução o
  // contasse — e a análise da repartição lê o dispositivo.
  const O = avaliar(janela, 'O');
  janela.estObj().n = 1;
  janela.estObj().setores = [{ estado: ATIVO, cmd: '', ct: '', adj: '', m: '', o: '', tip: [] }];
  O.evolucao.length = 0;

  assert.equal(janela.mudarEstadoSetor(0, DOMINADO), true);
  assert.equal(janela.estObj().setores[0].estado, DOMINADO);
  assert.equal(O.evolucao.length, 1);
  assert.match(O.evolucao[0].txt, /Setor Alfa — estado alterado de "Em curso \(ativo\)" para "Em resolução \(dominado\)"/);
  assert.equal(O.evolucao[0].tipo, 'melhoria');
  assert.match(O.fita.at(-1).e, /Setor Alfa -> Em resolução/);
});

test('mudar para o mesmo estado, ou para um que não existe, não faz nada', semAplicacao, () => {
  const O = avaliar(janela, 'O');
  janela.estObj().n = 1;
  janela.estObj().setores = [{ estado: ATIVO, cmd: '', ct: '', adj: '', m: '', o: '', tip: [] }];
  O.evolucao.length = 0;
  assert.equal(janela.mudarEstadoSetor(0, ATIVO), false);
  assert.equal(janela.mudarEstadoSetor(0, 'Inventado'), false);
  assert.equal(janela.mudarEstadoSetor(9, DOMINADO), false, 'setor que não existe');
  assert.equal(O.evolucao.length, 0);
});

test('a reativação conta como agravamento na evolução', semAplicacao, () => {
  const O = avaliar(janela, 'O');
  janela.estObj().n = 1;
  janela.estObj().setores = [{ estado: EXTINTO, cmd: '', ct: '', adj: '', m: '', o: '', tip: [] }];
  O.evolucao.length = 0;
  janela.mudarEstadoSetor(0, REATIVACAO);
  assert.equal(O.evolucao[0].tipo, 'agravamento');
});

test('quatro frases-tipo nomeiam um estado, e declaram-no', semAplicacao, () => {
  const frases = [...janela.document.querySelectorAll('#evo-frases [data-est]')]
    .map((b) => [b.getAttribute('data-fr'), b.getAttribute('data-est')]);
  assert.equal(frases.length, 4);
  const estados = avaliar(janela, 'ESTADOS_SETOR');
  frases.forEach(([fr, est]) => assert.ok([...estados].includes(est),
    `a frase «${fr}» declara um estado que não é dos cinco: ${est}`));
});

test('a proposta só aparece com setor escolhido, e não muda nada sozinha', semAplicacao, () => {
  const d = janela.document;
  janela.estObj().n = 1;
  janela.estObj().setores = [{ estado: ATIVO, cmd: '', ct: '', adj: '', m: '', o: '', tip: [] }];
  janela.pintarEvoCtx();
  const caixa = d.getElementById('evo-efeito');

  // sem setor escolhido, a frase é só texto
  janela.eval('EVO_SETOR = null');
  d.querySelector('#evo-frases [data-fr="frente dominada"]').dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.equal(caixa.style.display, 'none');
  assert.equal(janela.estObj().setores[0].estado, ATIVO, 'mudou sem ninguém dizer que sim');

  // com setor escolhido, propõe — e continua a não mudar nada
  d.querySelector('#evo-ctx [data-set="0"]').dispatchEvent(new janela.Event('click', { bubbles: true }));
  d.querySelector('#evo-frases [data-fr="frente dominada"]').dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.equal(caixa.style.display, 'block');
  assert.match(caixa.textContent, /passar a «Em resolução \(dominado\)»/);
  assert.equal(janela.estObj().setores[0].estado, ATIVO, 'a proposta aplicou-se sozinha');

  // e só muda quando se carrega
  d.getElementById('evo-aplicar').dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.equal(janela.estObj().setores[0].estado, DOMINADO);
  assert.match(caixa.textContent, /com registo automático na evolução e na fita/);
});
