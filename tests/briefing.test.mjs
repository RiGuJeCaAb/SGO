// Briefing de passagem de comando.
// Determinístico, função pura do estado: lê tudo, não escreve nada, e recebe o
// instante em vez de o ir buscar ao relógio.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const estado = () => avaliar(janela, 'O');
const INICIO = '281200AGO26';
const MINUTO = 60000;

beforeEach(() => janela && janela.eval('O = novoEstado()'));

/** Ocorrência com dispositivo, PCO e um PEA emitido. */
function ocorrenciaCompleta() {
  const O = estado();
  O.meta.num = '2026/4711';
  O.meta.local = 'Leomil — Moimenta da Beira';
  O.meta.pco = 'Sernancelhe';
  O.meta.fase = 'IV';
  O.meta.inicio = INICIO;
  const t0 = janela.parseGDH(INICIO).getTime();

  O.dados.est.n = 2;
  O.dados.est.setores = [
    { estado: 'Em curso (ativo)', cmd: 'Cmdt CB Moimenta', ct: '910000001', adj: '', m: '', o: '',
      siresp: 'PC MAN 4', tip: [{ t: 'ECIN', q: 2, mu: 1, ou: 5, mr: 0, ar: 0, ts: t0 }] },
    { estado: 'Em resolução (dominado)', cmd: '', ct: '', adj: '', m: '', o: '', tip: [] },
  ];
  O.dados.est.aerL = [{ t: 'HEBL', ind: 'HOTEL 15', g: INICIO, ts: t0 }];
  O.logistica.reserva = { m: '2', o: '8' };
  O.pco.funcoes = [{ f: 'Oficial de Operações', nome: 'Cmdt Ferreira', entidade: 'CB Alijó',
    ct: '910000010', siresp: 'PC TAT 1', ba: '', g: INICIO }];
  O.logistica.comunicacoes.niveis = { comando: true, tatico: true, manobra: true, aereo: false, ba: false, tocado: true };
  O.logistica.comunicacoes.cmd = 'PC COM 1';
  O.logistica.comunicacoes.tat = 'PC TAT 1';
  O.evolucao.push({ g: INICIO, tipo: 'posit', t: 'Primeiro POSIT transmitido' });
  return t0;
}

test('o briefing não altera a ocorrência', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  // Os acessores reparam invariantes de forma — `aerLista()` mantém a contagem em
  // sintonia com a lista — e isso acontece a cada desenho de painel. Normaliza-se
  // primeiro, para que o que se compare seja conteúdo e não forma.
  janela.aerLista();
  janela.pcoObj();

  const antes = JSON.stringify(estado());
  janela.briefingPassagem(t0 + 60 * MINUTO);
  assert.equal(JSON.stringify(estado()), antes, 'a ocorrência ficou intacta');
});

test('o briefing não acrescenta evolução, PEA nem fita', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  const O = estado();
  const [ev, peas, fita] = [O.evolucao.length, O.peas.length, O.fita.length];
  janela.briefingPassagem(t0 + 60 * MINUTO);
  assert.equal(estado().evolucao.length, ev);
  assert.equal(estado().peas.length, peas);
  assert.equal(estado().fita.length, fita, 'só `gerarBriefing` regista na fita');
});

test('recebe o instante em vez de o ir buscar ao relógio', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  const a = janela.briefingPassagem(t0 + 30 * MINUTO);
  const b = janela.briefingPassagem(t0 + 300 * MINUTO);
  assert.notEqual(a.gdh, b.gdh);
  assert.match(a.seccoes[0].linhas.join(' '), /decorre há 30 min/);
  assert.match(b.seccoes[0].linhas.join(' '), /decorre há 5 h 00 min/);
});

test('tem as oito secções, pela ordem da passagem', semAplicacao, () => {
  ocorrenciaCompleta();
  const b = janela.briefingPassagem(Date.now());
  assert.equal(b.seccoes.length, 8);
  assert.match(b.seccoes[0].titulo, /Situação/);
  assert.match(b.seccoes[1].titulo, /Dispositivo/);
  assert.match(b.seccoes[2].titulo, /posto de comando/);
  assert.match(b.seccoes[3].titulo, /comunicações/);
  assert.match(b.seccoes[4].titulo, /Tempos/);
  assert.match(b.seccoes[5].titulo, /Conformidade/);
  assert.match(b.seccoes[6].titulo, /PEA/);
  assert.match(b.seccoes[7].titulo, /Evolução/);
});

test('a situação identifica a ocorrência e o tempo decorrido', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  const s = janela.briefingPassagem(t0 + 95 * MINUTO).seccoes[0].linhas.join(' | ');
  assert.match(s, /2026\/4711/);
  assert.match(s, /Leomil/);
  assert.match(s, /Sernancelhe/);
  assert.match(s, /Fase do SGO: IV/);
});

test('o dispositivo desce ao setor, com comando e meios', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  const d = janela.briefingPassagem(t0).seccoes[1].linhas.join(' | ');
  assert.match(d, /Setor Alfa — Em curso \(ativo\), comando Cmdt CB Moimenta/);
  assert.match(d, /2× ECIN/);
  assert.match(d, /Setor Bravo .* sem comando nomeado/);
  assert.match(d, /Reserva: 2 veículos, 8 operacionais/);
  assert.doesNotMatch(d, /\b1 veículos\b/, 'concordância de número');
});

test('assinala as funções do PCO por nomear', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  const b = janela.briefingPassagem(t0);
  assert.match(b.seccoes[2].linhas.join(' '), /Oficial de Operações — Cmdt Ferreira/);
  assert.ok(b.seccoes[2].nota, 'a fase IV exige funções que não estão nomeadas');
  assert.match(b.pendencias.join(' | '), /Funções do PCO por nomear/);
});

test('assinala o setor sem canal de manobra', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  const b = janela.briefingPassagem(t0);
  assert.match(b.seccoes[3].nota, /Bravo/);
  assert.match(b.pendencias.join(' | '), /sem canal de manobra/);
});

test('os tempos de empenhamento seguem o instante recebido', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  assert.match(janela.briefingPassagem(t0 + 2 * 60 * MINUTO).seccoes[4].linhas.join(' '), /em contagem/);
  assert.match(janela.briefingPassagem(t0 + 14 * 60 * MINUTO).seccoes[4].linhas.join(' '), /Rendição vencida/);
});

test('sem PEA emitido, di-lo em vez de calar', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  assert.match(janela.briefingPassagem(t0).seccoes[6].linhas.join(' '), /Nenhum PEA emitido/);
});

test('com PEA fora de validade, a revisão entra nas pendências', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  estado().peas.push({ n: 1, g: INICIO, ts: t0, validoTs: t0 + 6 * 60 * MINUTO,
    modo: 'determinístico', json: {}, met: {}, evoIdx: 0 });

  const dentro = janela.briefingPassagem(t0 + 60 * MINUTO);
  assert.match(dentro.seccoes[6].linhas.join(' '), /Validade: mais/);

  const fora = janela.briefingPassagem(t0 + 8 * 60 * MINUTO);
  assert.match(fora.seccoes[6].linhas.join(' '), /Validade excedida/);
  assert.match(fora.pendencias.join(' | '), /Emitir revisão do PEA/);
});

test('as obrigações de conformidade entram nas pendências', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  const b = janela.briefingPassagem(t0 + 100 * MINUTO);
  assert.ok(b.seccoes[5].linhas.some((l) => /OBRIGAÇÃO/.test(l)));
  assert.ok(b.pendencias.length, 'passados os 90 minutos há sempre o que decidir');
});

test('um estado vazio produz briefing legível, sem rebentar', semAplicacao, () => {
  const b = janela.briefingPassagem(Date.now());
  assert.equal(b.seccoes.length, 8);
  assert.match(b.ocorrencia, /sem número/);
  assert.match(b.seccoes[0].linhas.join(' '), /por registar/);
});

test('o texto corrido traz tudo, e diz o que não há', semAplicacao, () => {
  const t0 = ocorrenciaCompleta();
  const t = janela.textoBriefing(janela.briefingPassagem(t0 + 100 * MINUTO));
  assert.match(t, /^BRIEFING DE PASSAGEM DE COMANDO/);
  assert.match(t, /2026\/4711/);
  assert.match(t, /O QUE FICA POR DECIDIR/);
  for (const n of ['1. Situação', '5. Tempos', '8. Evolução']) assert.ok(t.includes(n), n);
});

test('elaborar deixa registo na fita, porque é ato de comando', semAplicacao, () => {
  ocorrenciaCompleta();
  janela.gerarBriefing();
  assert.match(estado().fita.at(-1).e, /Briefing de passagem de comando elaborado/);
});

test('a concordância de número está certa, singular e plural', semAplicacao, () => {
  const O = estado();
  O.meta.inicio = INICIO;
  O.dados.est.n = 1;
  O.dados.est.setores = [{ estado: 'Em curso (ativo)', cmd: 'X', ct: '', adj: '', m: '', o: '',
    tip: [{ t: 'VFCI', q: 1, mu: 1, ou: 1, mr: 0, ar: 0, ts: janela.parseGDH(INICIO).getTime() }] }];
  O.logistica.reserva = { m: '1', o: '1' };

  const d = janela.briefingPassagem(janela.parseGDH(INICIO).getTime()).seccoes[1].linhas.join(' | ');
  assert.match(d, /1 veículo,/);
  assert.match(d, /1 operacional\b/);
  assert.doesNotMatch(d, /1 veículos|1 operacionais/);
});
