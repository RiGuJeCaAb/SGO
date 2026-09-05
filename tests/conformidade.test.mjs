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
  e.setores = setores.map((s) => ({
    estado: s.estado, cmd: s.cmd || '', ct: '', adj: '', m: '', o: '',
    // Uma entrada por unidade: é essa a forma do estado desde a versão 10.
    tip: Array.from({ length: s.veiculos || 0 }, () =>
      ({ t: 'VFCI', mu: 1, ou: 5, mr: 0, ar: 0, ts: janela.agora(), ent: '' })),
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

test('as frases-tipo que nomeiam um estado declaram um dos cinco', semAplicacao, () => {
  const frases = [...janela.document.querySelectorAll('#evo-frases [data-est]')]
    .map((b) => [b.getAttribute('data-fr'), b.getAttribute('data-est')]);
  assert.ok(frases.length >= 4, 'só ' + frases.length + ' frases nomeiam estado');
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

/* ---- a pasta sub-regional segue o TO, não o posto ---- */

test('o pacote declara a sua pasta sub-regional pelo nome programado', semAplicacao, () => {
  // Nos terminais chama-se «Douro Op», não «Douro». O nome do canal não se abrevia.
  assert.equal(avaliar(janela, 'SUBREGIAO_PACOTE'), 'Douro Op');
  const opar = [...avaliar(janela, 'CANAIS').ent].find((x) => x.des === 'OPAR 01');
  assert.equal(opar.area, 'Douro Op');
  assert.equal(opar.pasta, 'subregiao');
});

test('sem sub-região indicada, o canal sub-regional não se dá por bom', semAplicacao, () => {
  // Um TO pode ser em qualquer ponto do país. Enquanto ninguém disser onde, a pasta
  // sub-regional fica por confirmar em vez de se oferecer como se servisse.
  const O = avaliar(janela, 'O');
  O.meta.subregiao = '';
  const opar = [...avaliar(janela, 'CANAIS').ent].find((x) => x.des === 'OPAR 01');
  assert.equal(janela.canalAplicavel(opar), false);
});

test('com o TO noutra sub-região, o canal sub-regional fica fora de âmbito', semAplicacao, () => {
  const O = avaliar(janela, 'O');
  const opar = [...avaliar(janela, 'CANAIS').ent].find((x) => x.des === 'OPAR 01');
  O.meta.subregiao = 'Douro Op';
  assert.equal(janela.canalAplicavel(opar), true);
  O.meta.subregiao = 'Terras de Trás-os-Montes';
  assert.equal(janela.canalAplicavel(opar), false,
    'ofereceu o grupo sub-regional do Douro a um TO de outra sub-região');
});

test('a sub-região não se deduz do concelho', semAplicacao, () => {
  // Deduzi-la exigiria a composição das sub-regiões, que não está confirmada em fonte
  // neste projeto. Adivinhá-la seria a aplicação afirmar uma pasta de rádio que ninguém
  // verificou — o que a restrição 4 do projeto proíbe.
  const O = avaliar(janela, 'O');
  O.meta.subregiao = '';
  O.meta.concelho = 'Moimenta da Beira';
  O.meta.distrito = 'Viseu';
  janela.escreverForm();
  assert.equal(janela.subregiaoTO(), '', 'a aplicação inventou a sub-região a partir do concelho');
});

test('a sub-região do TO tem campo próprio e atravessa a migração', semAplicacao, () => {
  assert.ok(janela.document.querySelector('[data-campo="meta.subregiao"]'));
  const m = janela.migrarGravado({ versao: 7, meta: { num: '2026/900' }, pco: { funcoes: [] } });
  assert.equal(m.meta.subregiao, '');
});

/* ---- obrigações que se podem dar por cumpridas ---- */

/** Uma ocorrência a arder há N minutos, sem nenhum setor dominado. */
function aArderHa(minutos) {
  const O = avaliar(janela, 'O');
  janela.eval('O.cumprimentos = {}');
  O.meta.num = '2026/4711';
  O.meta.inicio = janela.gdhDe(janela.agora() - minutos * 60000);
  const e = janela.estObj();
  e.n = 1;
  e.setores = [{ estado: ATIVO, cmd: '', ct: '', adj: '', m: '', o: '', tip: [] }];
  janela.escreverForm();
  return () => JSON.parse(JSON.stringify(janela.verificacoesDON()));
}

test('só é declarável o que a aplicação não consegue observar', semAplicacao, () => {
  // Uma obrigação observável no estado cumpre-se fazendo a coisa. Declarar o que se pode
  // observar abriria a porta a dar por cumprido o que não está.
  assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(avaliar(janela, 'CUMPRIVEIS')))).sort(),
    ['notif', 'pmepc']);
});

test('a notificação das duas horas fecha quando se confirma, com GDH e autor',
  semAplicacao, async () => {
    const don = aArderHa(150);
    const antes = don().find((x) => x.id === 'notif');
    assert.equal(antes.n, 'ob');
    assert.match(antes.t, /Notificação das duas horas por confirmar/);

    const r = await janela.registarCumprimento('notif', 'Cmdt Costa', 'SINOP difundida');
    assert.equal(r.ok, true);

    const depois = don().find((x) => x.id === 'notif');
    assert.equal(depois.n, 'ok');
    assert.match(depois.s, /Confirmada a \d{6}[A-Z]{3}\d{2} por Cmdt Costa — SINOP difundida/);
    assert.match(depois.a, /Uma reativação repõe a obrigação/);
  });

test('a proposta de ativação do PMEPC fecha do mesmo modo', semAplicacao, async () => {
  const don = aArderHa(1500);
  assert.equal(don().find((x) => x.id === 'pmepc').n, 'ob');
  await janela.registarCumprimento('pmepc', 'Cmdt Costa');
  const depois = don().find((x) => x.id === 'pmepc');
  assert.equal(depois.n, 'ok');
  assert.match(depois.t, /Ativação do PMEPC proposta/);
});

test('o cumprimento deixa rasto na evolução e na fita', semAplicacao, async () => {
  const O = avaliar(janela, 'O');
  aArderHa(150);
  O.evolucao.length = 0;
  await janela.registarCumprimento('notif', 'Cmdt Costa', 'SINOP difundida');
  assert.equal(O.evolucao.at(-1).tipo, 'decisao');
  assert.match(O.evolucao.at(-1).txt, /Cumprimento registado.*notificação SINOP.*Cmdt Costa.*SINOP difundida/);
  assert.match(O.fita.at(-1).e, /Obrigação dada por cumprida/);
});

test('não se declara cumprida uma obrigação que a aplicação observa', semAplicacao, async () => {
  const r = await janela.registarCumprimento('placom', 'Cmdt Costa');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /cumpre-se fazendo a coisa/);
});

test('não se declara cumprimento sem autor', semAplicacao, async () => {
  aArderHa(150);
  const r = await janela.registarCumprimento('notif', '  ');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /Indicar quem confirma/);
  assert.equal(janela.cumprimentoDe('notif'), null);
});

test('retirar o cumprimento repõe a obrigação, e diz que foi retirado', semAplicacao, async () => {
  const don = aArderHa(150);
  const O = avaliar(janela, 'O');
  await janela.registarCumprimento('notif', 'Cmdt Costa');
  assert.equal(don().find((x) => x.id === 'notif').n, 'ok');

  const r = await janela.retirarCumprimento('notif', 'Cmdt Silva');
  assert.equal(r.ok, true);
  assert.equal(janela.cumprimentoDe('notif'), null);
  assert.equal(don().find((x) => x.id === 'notif').n, 'ob', 'a obrigação não voltou');
  assert.match(O.evolucao.at(-1).txt, /Cumprimento retirado.*retirado por Cmdt Silva/);
});

/* ---- o ataque ampliado fecha-se emitindo o PEA, e não declarando ---- */

test('o ataque ampliado fecha quando o PEA é emitido depois do limiar', semAplicacao, () => {
  // Até à r0046 esta obrigação ficava vermelha para sempre, mesmo com o plano emitido
  // e difundido. Uma obrigação que nunca fecha ensina a ignorar o vermelho.
  const don = aArderHa(150);
  const O = avaliar(janela, 'O');
  O.peas.length = 0;
  assert.equal(don().find((x) => x.id === 'ata').n, 'ob');

  // Uma proposta por aprovar não fecha a obrigação: fica em aviso, com o que falta.
  O.peas.push({ n: 1, g: janela.gdhAgora(), ts: janela.agora(), ctrl: [], base: {},
    estado: 'proposta', analise: { g: '' }, aprovacao: { g: '', por: '', funcao: '', nota: '' } });
  const proposta = don().find((x) => x.id === 'ata');
  assert.equal(proposta.n, 'av');
  assert.match(proposta.t, /proposta de PEA por aprovar/i);

  // Aprovada pelo COS, fecha.
  O.peas[0].estado = 'aprovado';
  O.peas[0].aprovacao = { g: janela.gdhAgora(), por: 'Cmdt Silva', funcao: 'COS', nota: '' };
  const depois = don().find((x) => x.id === 'ata');
  assert.equal(depois.n, 'ok');
  assert.match(depois.t, /Ataque ampliado com PEA formal emitido/);
  assert.match(depois.s, /PEA n\.º 1 foi emitido/);
});

test('um PEA emitido antes do limiar não fecha o ataque ampliado', semAplicacao, () => {
  const don = aArderHa(150);
  const O = avaliar(janela, 'O');
  O.peas.length = 0;
  O.peas.push({ n: 1, g: '', ts: janela.agora() - 140 * 60000, ctrl: [], base: {},
    estado: 'aprovado', analise: { g: '' }, aprovacao: { g: '', por: 'Cmdt Silva', funcao: 'COS', nota: '' } });
  assert.equal(don().find((x) => x.id === 'ata').n, 'ob',
    'um plano anterior ao limiar não é o PEA que o limiar exige');
});

/* ---- cada meio é uma unidade, com o seu relógio ---- */

test('a migração reparte os blocos em unidades, sem perder nada', semAplicacao, () => {
  // Três viaturas do mesmo tipo podem vir de corpos diferentes e ter entrado no TO a
  // horas diferentes. Enquanto partilhavam `q:3` e um instante, o relógio da rendição
  // era o mesmo para as três — e a rendição pede-se por veículo.
  const ts = janela.agora() - 3 * 3600000;
  const m = janela.migrarGravado({
    versao: 9, meta: { num: '2026/900' }, pco: { funcoes: [] },
    dados: { est: { n: 1, setores: [{ estado: ATIVO, cmd: '', tip: [
      { t: 'VFCI', q: 3, mu: 1, ou: 5, mr: 0, ar: 0, ts },
      { t: 'ECIN', q: 1, mu: 1, ou: 5, mr: 0, ar: 0, ts }] }] } },
  });
  const tip = JSON.parse(JSON.stringify(m.dados.est.setores[0].tip));
  assert.equal(tip.length, 4, 'três VFCI e um ECIN');
  assert.equal(tip.filter((x) => x.t === 'VFCI').length, 3);
  tip.forEach((x) => {
    assert.equal(x.q, undefined, 'a quantidade não sobrevive');
    assert.equal(x.ts, ts, 'o instante do bloco fica em cada unidade');
    assert.equal(typeof x.ent, 'string');
  });
});

test('as contas dão o mesmo depois de repartir', semAplicacao, () => {
  const e = janela.estObj();
  e.n = 1;
  e.setores = [{ estado: ATIVO, cmd: '', ct: '', adj: '', m: '', o: '', tip: [
    { t: 'VFCI', mu: 1, ou: 5, mr: 0, ar: 0, ts: janela.agora(), ent: 'CB Lamego' },
    { t: 'VFCI', mu: 1, ou: 5, mr: 0, ar: 0, ts: janela.agora(), ent: 'CB Tarouca' },
    { t: 'ECIN', mu: 1, ou: 5, mr: 0, ar: 0, ts: janela.agora(), ent: '' }] }];
  const t = JSON.parse(JSON.stringify(janela.totSetor(e.setores[0])));
  assert.deepEqual(t, { m: 3, o: 15 });
  assert.equal(janela.contarDispositivo().m, 3);
});

test('agrupa-se para mostrar, nunca para guardar', semAplicacao, () => {
  const tip = [
    { t: 'VFCI', mu: 1, ou: 5 }, { t: 'VFCI', mu: 1, ou: 5 }, { t: 'ECIN', mu: 1, ou: 5 }];
  assert.equal(janela.resumoTip(tip), '2× VFCI, 1× ECIN');
  const g = JSON.parse(JSON.stringify(janela.agruparTip(tip)));
  assert.deepEqual(g.find((x) => x.t === 'VFCI'), { t: 'VFCI', n: 2, m: 2, o: 10 });
});

test('duas unidades iguais podem ter origens e relógios diferentes', semAplicacao, () => {
  const agora = janela.agora();
  const e = janela.estObj();
  e.n = 1;
  e.setores = [{ estado: ATIVO, cmd: '', ct: '', adj: '', m: '', o: '', tip: [
    { t: 'VFCI', mu: 1, ou: 5, mr: 0, ar: 0, ts: agora - 13 * 3600000, ent: 'CB Lamego' },
    { t: 'VFCI', mu: 1, ou: 5, mr: 0, ar: 0, ts: agora - 1 * 3600000, ent: 'CB Tarouca' }] }];

  const R = JSON.parse(JSON.stringify(janela.rendicoes(agora)));
  assert.equal(R.length, 2, 'uma linha por unidade');
  const velha = R.find((x) => x.nome.includes('Lamego'));
  const nova = R.find((x) => x.nome.includes('Tarouca'));
  assert.equal(velha.nivel, 'r', '13 h ultrapassa o limite de 12 h');
  assert.equal(nova.nivel, 'v', '1 h está dentro');
  assert.equal(velha.op, 5, 'os operacionais são os da unidade, não os do bloco');
});

test('o medidor diz o estado na cor e o quanto no número', semAplicacao, () => {
  // A leitura não pode depender de distinguir cores: o número está em tinta de texto,
  // e a cor da marca é o estado. E sem instante não há medidor nenhum.
  const agora = janela.agora();
  const cheio = janela.medidorTempo({ t: 'VFCI', ts: agora - 13 * 3600000 });
  assert.match(cheio, /class="med r"/);
  assert.doesNotMatch(cheio, /gm-x/, 'passado o limite, todos os gomos acendem');
  assert.match(cheio, /\u22121,0 h/, 'passado o limite, o número é o excedente com sinal');
  assert.match(cheio, /Limite de 12 h excedido em 1,0 h/);
  assert.match(cheio, /rendição era devida às \d{6}[A-Z]{3}\d{2}/);

  // Os gomos são as horas: acesos os que faltam, apagados os que já passaram.
  const meio = janela.medidorTempo({ t: 'VFCI', ts: agora - 9 * 3600000 });
  assert.equal((meio.match(/class="gm"/g) || []).length, 3, 'faltam 3 h, acendem 3 gomos');
  assert.equal((meio.match(/class="gm-x"/g) || []).length, 9, 'e os 9 gastos ficam em traço');
  assert.match(meio, /3,0 h/);
  assert.match(meio, /rendição prevista para \d{6}[A-Z]{3}\d{2}/);

  assert.match(janela.medidorTempo({ t: 'VFCI', ts: agora - 1 * 3600000 }), /class="med v"/);
  assert.match(janela.medidorTempo({ t: 'VFCI', ts: agora - 9 * 3600000 }), /class="med a"/);
  assert.match(janela.medidorTempo({ t: 'VFCI', ts: 0 }), /sem relógio/);
});

test('o medidor usa o limiar aéreo para meios aéreos', semAplicacao, () => {
  const agora = janela.agora();
  // 7 h passa o teto de 6 h dos aéreos, e não passa o de 12 h dos terrestres.
  assert.match(janela.medidorTempo({ t: 'HEBL', ar: 1, ts: agora - 7 * 3600000 }), /class="med r"/);
  assert.match(janela.medidorTempo({ t: 'VFCI', ts: agora - 7 * 3600000 }), /class="med v"/);
});
