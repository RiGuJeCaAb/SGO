// Encerramento do registo da ocorrência — art. 8.º, n.º 2, e art. 2.º, al. c).
//
// Encerrar é ato de comando e o registo tem de ficar completo. O que se encerra é o
// registo feito nesta Estação: a aplicação não fala com o SADO, e não finge falar.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));
const estado = () => avaliar(janela, 'O');
const ATIVO = 'Em curso (ativo)', EXTINTO = 'Em conclusão (extinto)';
const VIGILANCIA = 'Vigilância ativa e consolidação de rescaldo';

/** Uma ocorrência que já não tem frente ativa, e portanto pode encerrar-se. */
function ocorrenciaApagada() {
  janela.eval('O = novoEstado()');
  const O = estado();
  O.meta.num = '2026/4711'; O.meta.local = 'Leomil'; O.meta.fase = 'IV';
  O.meta.inicio = janela.gdhDe(janela.agora() - 6 * 3600000);
  const e = janela.estObj();
  e.n = 2;
  e.setores = [
    { estado: EXTINTO, cmd: 'Cmdt A', ct: '', adj: '', m: '', o: '', tip: [] },
    { estado: VIGILANCIA, cmd: 'Cmdt B', ct: '', adj: '', m: '', o: '', tip: [] }];
  // O formulário tem de acompanhar o estado: `persistir()` lê-o antes de gravar, e um
  // formulário vazio apagaria o que só estivesse posto no estado. Trap já registada.
  janela.escreverForm();
  return O;
}

beforeEach(() => { if (janela) ocorrenciaApagada(); });

test('uma ocorrência nasce aberta, e é o GDH que a fecha', semAplicacao, () => {
  assert.equal(janela.encerrada(), false);
  assert.deepEqual(daqui(janela.novoEstado().encerramento), { g: '', por: '', nota: '', sha: '' });
});

test('não se encerra com frente ativa', semAplicacao, async () => {
  janela.estObj().setores[0].estado = ATIVO;
  const v = daqui(janela.verificarEncerramento());
  assert.equal(v.pode, false);
  assert.match(v.impedimentos.join(' '), /Alfa \(Em curso \(ativo\)\)/);
  assert.match(v.impedimentos.join(' '), /Não se encerra o registo de uma ocorrência com frente ativa/);

  const r = await janela.encerrarOcorrencia('Cmdt Costa');
  assert.equal(r.ok, false);
  assert.equal(janela.encerrada(), false, 'encerrou apesar do impedimento');
});

test('não se encerra sem dizer quem determina', semAplicacao, async () => {
  const r = await janela.encerrarOcorrencia('   ');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /Indicar quem determina/);
  assert.equal(janela.encerrada(), false);
});

test('encerrar carimba, e deixa rasto na evolução e na fita', semAplicacao, async () => {
  const O = estado();
  const antes = O.evolucao.length;
  const r = await janela.encerrarOcorrencia('2.º Cmdt Nuno Requeijo', 'sem reacendimentos às 6 h');
  assert.equal(r.ok, true);
  assert.equal(janela.encerrada(), true);

  const E = daqui(janela.encObj());
  assert.match(E.g, /^\d{6}[A-Z]{3}\d{2}$/);
  assert.equal(E.por, '2.º Cmdt Nuno Requeijo');
  assert.equal(E.nota, 'sem reacendimentos às 6 h');

  assert.equal(O.evolucao.length, antes + 1);
  assert.equal(O.evolucao.at(-1).tipo, 'decisao');
  assert.match(O.evolucao.at(-1).txt, /Encerramento do registo.*Nuno Requeijo.*sem reacendimentos/);
  assert.match(O.fita.at(-1).e, /Ocorrência encerrada por 2\.º Cmdt Nuno Requeijo/);
});

test('encerrar duas vezes não faz nada à segunda', semAplicacao, async () => {
  await janela.encerrarOcorrencia('Cmdt Costa');
  const g = janela.encObj().g;
  const r = await janela.encerrarOcorrencia('Outro qualquer');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /já está encerrada/);
  assert.equal(janela.encObj().g, g, 'o carimbo foi reescrito');
  assert.equal(janela.encObj().por, 'Cmdt Costa');
});

test('as reservas não impedem, e ficam mesmo no processo', semAplicacao, async () => {
  // Uma obrigação em incumprimento não trava o encerramento — trava-o uma frente ativa.
  // O que fica por cumprir fica escrito no registo de evolução, que é o que sobrevive à
  // sessão e vai no PEA. Dizer «ficam no processo» sem lá ficarem seria só uma frase.
  const v = daqui(janela.verificarEncerramento());
  assert.equal(v.pode, true);
  assert.ok(v.reservas.length, 'esta ocorrência devia ter obrigações por cumprir');

  const r = await janela.encerrarOcorrencia('Cmdt Costa');
  assert.equal(r.ok, true);
  const reg = estado().evolucao.at(-1).txt;
  assert.match(reg, /Reservas ao encerramento:/);
  v.reservas.forEach((x) => assert.ok(reg.includes(x), 'reserva perdida: ' + x));
  assert.match(estado().fita.at(-1).e, /com reservas, registadas na evolução/);
});

/* ---- o registo fechado é fechado à escrita ---- */

test('com o registo fechado, o estado de setor não muda', semAplicacao, async () => {
  await janela.encerrarOcorrencia('Cmdt Costa');
  const antes = janela.estObj().setores[0].estado;
  assert.equal(janela.mudarEstadoSetor(0, ATIVO), false);
  assert.equal(janela.estObj().setores[0].estado, antes);
});

test('com o registo fechado, não se acrescenta evolução', semAplicacao, async () => {
  await janela.encerrarOcorrencia('Cmdt Costa');
  const O = estado(), antes = O.evolucao.length;
  janela.document.getElementById('e-txt').value = 'tentativa depois de encerrar';
  janela.addEvo();
  assert.equal(O.evolucao.length, antes, 'entrou evolução com o registo fechado');
});

test('os campos ficam inertes, e o que é preciso continua acessível', semAplicacao, async () => {
  await janela.encerrarOcorrencia('Cmdt Costa');
  janela.pintarEncerramento();
  const d = janela.document;
  assert.ok(d.documentElement.classList.contains('encerrada'));
  assert.equal(d.getElementById('o-local').disabled, true);
  assert.equal(d.getElementById('enc-reabrir').disabled, false, 'reabrir tem de continuar a poder');
  assert.equal(d.getElementById('b-tema').disabled, false, 'o tema não é escrita');
});

/* ---- reabrir ---- */

test('reabrir devolve o registo à escrita, e regista-se', semAplicacao, async () => {
  // Uma reativação depois do encerramento acontece, e tem de caber.
  await janela.encerrarOcorrencia('Cmdt Costa');
  const fechada = janela.encObj().g;
  const r = await janela.reabrirOcorrencia('Cmdt Silva', 'reacendimento no setor Alfa');
  assert.equal(r.ok, true);
  assert.equal(janela.encerrada(), false);

  const O = estado();
  assert.equal(O.evolucao.at(-1).tipo, 'agravamento');
  assert.match(O.evolucao.at(-1).txt, new RegExp('encerrado a ' + fechada + '.*Cmdt Silva.*reacendimento'));
  assert.match(O.fita.at(-1).e, /reaberta por Cmdt Silva/);

  janela.pintarEncerramento();
  assert.equal(janela.document.documentElement.classList.contains('encerrada'), false);
  assert.equal(janela.mudarEstadoSetor(0, ATIVO), true, 'continua fechado à escrita depois de reabrir');
});

test('não se reabre o que não está encerrado', semAplicacao, async () => {
  const r = await janela.reabrirOcorrencia('Cmdt Silva', 'porquê');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /não está encerrada/);
});

/* ---- o encerramento sobrevive ao que o guarda ---- */

test('o encerramento atravessa a migração e a ida e volta da ocorrência', semAplicacao, async () => {
  await janela.encerrarOcorrencia('Cmdt Costa', 'nota do processo');
  const pacote = daqui(janela.pacoteOcorrencia());
  janela.eval('O = novoEstado()');
  janela.importarOcorrencia(JSON.stringify(pacote));
  assert.equal(janela.encerrada(), true);
  assert.equal(janela.encObj().por, 'Cmdt Costa');
  assert.equal(janela.encObj().nota, 'nota do processo');
});

test('uma ocorrência gravada antes da versão 7 chega aberta', semAplicacao, () => {
  // Presumir encerrada uma ocorrência sem marca seria fechar à força o que ninguém
  // fechou. O caminho seguro é o que a deixa trabalhável.
  const m = janela.migrarGravado({ versao: 6, meta: { num: '2026/900' }, pco: { funcoes: [] } });
  assert.equal(m.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.deepEqual(daqui(m.encerramento), { g: '', por: '', nota: '', sha: '' });
});

test('o ramo do encerramento tem dono declarado', semAplicacao, () => {
  assert.equal(janela.donoDoRamo('encerramento').celula, 'comando');
  const a = daqui(janela.auditarPosse(janela.novoEstado()));
  assert.deepEqual(a.orfaos, []);
});

/* ---- carimbo de integridade ---- */

test('o encerramento carimba o estado, e o carimbo confere logo a seguir', semAplicacao, async () => {
  const r = await janela.encerrarOcorrencia('Cmdt Distrital', 'processo entregue');
  assert.equal(r.ok, true, JSON.stringify(r));
  const E = janela.encObj();
  assert.match(E.sha, /^[0-9a-f]{64}$/);

  // O carimbo é do estado com o próprio carimbo vazio — senão o estado continha o resumo
  // de si mesmo. E é calculado depois de tudo o que o encerramento escreve: o registo de
  // evolução e a linha da fita fazem parte do que se encerra.
  const guardado = E.sha;
  E.sha = '';
  assert.equal(janela.resumoEstado(estado()), guardado,
    'o carimbo não fecha sobre o estado que carimbou');
  E.sha = guardado;
});

test('mexer no registo encerrado faz o carimbo deixar de bater', semAplicacao, async () => {
  await janela.encerrarOcorrencia('Cmdt Distrital', '');
  const E = janela.encObj(), guardado = E.sha;
  estado().meta.local = 'Outro sítio';   // alteração por fora, com o registo fechado
  E.sha = '';
  assert.notEqual(janela.resumoEstado(estado()), guardado);
  E.sha = guardado;
});

test('reabrir limpa o carimbo e diz na evolução qual era', semAplicacao, async () => {
  await janela.encerrarOcorrencia('Cmdt Distrital', '');
  const antes = janela.encObj().sha;
  await janela.reabrirOcorrencia('COS', 'reativação');
  assert.equal(janela.encObj().sha, '', 'o carimbo é do que estava fechado, e já não está');
  const ultimo = estado().evolucao[estado().evolucao.length - 1];
  assert.match(ultimo.txt, new RegExp(antes.slice(0, 12)),
    'a evolução tem de dizer que carimbo tinha o registo que se reabriu');
});

/* ---- o fecho à escrita fecha o registo desta ocorrência, e mais nada ---- */

const el = (id) => janela.document.getElementById(id);

test('cada controlo declarado livre do fecho existe mesmo', semAplicacao, () => {
  /* A lista trazia três identificadores que já não existiam — `b-exp-occ`, `b-imp-occ`
     e `b-imprimir` —, e um identificador que não corresponde a nada não isenta ninguém:
     exportar e importar ficavam bloqueados sem que ninguém desse por isso. */
  const a = janela.auditarFechoDeEscrita();
  assert.deepEqual(daqui(a.semControlo), []);
  assert.deepEqual(daqui(a.semRazao), []);
  assert.ok(a.n >= 20, 'a lista encolheu: ' + a.n);
});

test('com a ocorrência encerrada começa-se a seguinte, e abre-se outra', semAplicacao, async () => {
  ocorrenciaApagada();
  await janela.encerrarOcorrencia('Cmdt Costa');
  janela.pintarEncerramento();

  ['b-nova', 'b-carregar', 'b-exportar', 'b-importar-b', 'b-importar']
    .forEach((id) => assert.equal(el(id).disabled, false, id + ' ficou bloqueado'));
});

test('encerrada, continua a poder assumir-se o teclado e a reabrir-se', semAplicacao, async () => {
  ocorrenciaApagada();
  await janela.encerrarOcorrencia('Cmdt Costa');
  janela.pintarEncerramento();

  ['id-posto', 'id-nome', 'id-perfil', 'id-assumir', 'enc-reabrir', 'enc-por', 'enc-nota']
    .forEach((id) => assert.equal(el(id).disabled, false, id + ' ficou bloqueado'));
});

test('encerrada, vê-se o mapa e guarda-se uma cópia — leitura não é escrita', semAplicacao, async () => {
  ocorrenciaApagada();
  await janela.encerrarOcorrencia('Cmdt Costa');
  janela.pintarEncerramento();

  ['mapa-carregar', 'mapa-mais', 'mapa-menos', 'mapa-enquadrar', 'mapa-esquecer',
    'cp-guardar', 'cp-conferir']
    .forEach((id) => assert.equal(el(id).disabled, false, id + ' ficou bloqueado'));
});

test('o arquivo continua a abrir-se: lista outras ocorrências, não esta', semAplicacao, async () => {
  ocorrenciaApagada();
  await janela.encerrarOcorrencia('Cmdt Costa');
  janela.eval('INDEX = [{num:"2026/900", local:"Sernancelhe", pco:"x", peas:1, g:"301200AGO26", pasta:"Viseu"}]');
  janela.pintarArquivo();
  janela.aplicarFechoDeEscrita();
  const b = janela.document.querySelector('[data-occ-abrir]');
  assert.ok(b, 'sem botão de abrir no arquivo');
  assert.equal(b.disabled, false, 'não se conseguia abrir outra ocorrência');
});

test('mas os campos da ocorrência continuam fechados', semAplicacao, async () => {
  ocorrenciaApagada();
  await janela.encerrarOcorrencia('Cmdt Costa');
  janela.pintarEncerramento();
  ['d-area', 'e-txt', 'b-gerar', 'mapa-alvo', 'mapa-nome']
    .forEach((id) => assert.equal(el(id).disabled, true, id + ' devia estar fechado'));
});

test('reabrir devolve os campos ao serviço', semAplicacao, async () => {
  ocorrenciaApagada();
  await janela.encerrarOcorrencia('Cmdt Costa');
  janela.pintarEncerramento();
  assert.equal(el('d-area').disabled, true);
  await janela.reabrirOcorrencia('Cmdt Costa', 'reacendimento');
  janela.pintarEncerramento();
  assert.equal(el('d-area').disabled, false, 'ficou bloqueado depois de reaberta');
  assert.equal(janela.document.documentElement.classList.contains('encerrada'), false);
});
