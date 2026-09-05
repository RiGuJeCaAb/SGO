// Solicitação de rendição e declaração da fase — dois atos que aconteciam fora da
// aplicação e não deixavam rasto nenhum.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const doc = () => janela.document;
const estado = () => avaliar(janela, 'O');
const daqui = (x) => JSON.parse(JSON.stringify(x));

/** Um setor com uma unidade que entrou no TO há `h` horas. */
function comUnidade(h) {
  janela.eval('O = novoEstado()');
  const e = janela.estObj();
  e.n = 1;
  e.setores = [{ estado: 'Em curso (ativo)', cmd: 'Cmdt A', ct: '', adj: '', m: '', o: '',
    tip: [{ t: 'VFCI', mu: 1, ou: 5, mr: 0, ar: 0, ts: janela.agora() - h * 3600000,
      ent: 'CB Lamego', rend: { g: '', por: '', nota: '' } }] }];
  janela.escreverForm();
  return e.setores[0].tip[0];
}

beforeEach(async () => { if (janela) await janela.largarTeclado(); });

test('o texto do pedido traz o que a norma manda indicar', semAplicacao, () => {
  comUnidade(13);
  estado().meta.num = '2026/4711';
  estado().meta.local = 'Leomil';
  const t = janela.textoPedidoRendicao('s:0:0');
  assert.match(t, /2026\/4711/);
  assert.match(t, /VFCI · CB Lamego/);
  assert.match(t, /Setor Alfa/);
  assert.match(t, /5 operacionais/);
  assert.match(t, /No TO desde \d{6}[A-Z]{3}\d{2}/);
  assert.match(t, /limite de 12 h às \d{6}[A-Z]{3}\d{2}/);
  assert.match(t, /hora de saída do TO e a hora prevista de chegada ao destino/);
});

test('solicitar a rendição fica na unidade, na evolução e na fita', semAplicacao, async () => {
  const it = comUnidade(13);
  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  const r = janela.solicitarRendicao('s:0:0', { nota: 'substituir por VFCI' });
  assert.equal(r.ok, true, r.motivo);
  assert.ok(it.rend.g, 'a unidade não ficou marcada');
  assert.equal(it.rend.por, 'Cmdt Silva', 'o pedido tem de saber quem o determinou');
  assert.equal(janela.rendPedida(it), true);

  const ev = estado().evolucao.slice(-1)[0];
  assert.equal(ev.tipo, 'meios');
  assert.match(ev.txt, /Rendição solicitada ao CSREPC: VFCI · CB Lamego \(Setor Alfa\)/);
  assert.match(ev.txt, /substituir por VFCI/);
  assert.ok(estado().fita.some((x) => /Rendição solicitada/.test(x.e)));

  assert.equal(janela.solicitarRendicao('s:0:0').ok, false, 'pediu duas vezes');
});

test('a solicitação pode ser retirada, e isso também é facto', semAplicacao, () => {
  const it = comUnidade(13);
  janela.solicitarRendicao('s:0:0');
  const r = janela.retirarSolicitacaoRendicao('s:0:0');
  assert.equal(r.ok, true);
  assert.equal(janela.rendPedida(it), false);
  assert.match(estado().evolucao.slice(-1)[0].txt, /Retirada a solicitação de rendição/);
});

test('um GDH impossível não regista pedido nenhum', semAplicacao, () => {
  const it = comUnidade(13);
  const r = janela.solicitarRendicao('s:0:0', { g: '311000FEV26' });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /não tem dia 31/);
  assert.equal(janela.rendPedida(it), false);
});

test('quem está para além do limite sem pedido aparece à parte', semAplicacao, () => {
  comUnidade(13);
  const e = janela.estObj();
  e.setores[0].tip.push({ t: 'ECIN', mu: 1, ou: 5, mr: 0, ar: 0,
    ts: janela.agora() - 2 * 3600000, ent: 'CB Resende', rend: { g: '', por: '', nota: '' } });

  let q = janela.estadoDasRendicoes();
  assert.equal(q.porPedir.length, 1, 'só o que passou o limite conta');
  assert.equal(q.pedidas.length, 0);
  assert.match(q.porPedir[0].nome, /VFCI/);

  janela.solicitarRendicao('s:0:0');
  q = janela.estadoDasRendicoes();
  assert.equal(q.porPedir.length, 0);
  assert.equal(q.pedidas.length, 1);
});

test('o medidor com endereço é botão, e sem endereço é leitura', semAplicacao, () => {
  const it = comUnidade(13);
  assert.match(janela.medidorTempo(it, false, 's:0:0'), /^<button[^>]*data-rend="s:0:0"/);
  assert.match(janela.medidorTempo(it), /^<span/);
  janela.solicitarRendicao('s:0:0');
  assert.match(janela.medidorTempo(it, false, 's:0:0'), /class="med nivel-r ped"/);
  assert.match(janela.medidorTempo(it, false, 's:0:0'), /rend\. pedida/);
});

test('um observador não solicita rendições', semAplicacao, async () => {
  comUnidade(13);
  await janela.assumirTeclado('Costa', 'Adj.', 'observador');
  const r = janela.solicitarRendicao('s:0:0');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /Observador/);
});

/* ---- a fase ---- */

test('a fase sugere-se do efetivo, e a escala é uma só', semAplicacao, () => {
  assert.equal(janela.faseParaEfetivo(0), 'I');
  assert.equal(janela.faseParaEfetivo(36), 'I');
  assert.equal(janela.faseParaEfetivo(37), 'II');
  assert.equal(janela.faseParaEfetivo(119), 'III');
  assert.equal(janela.faseParaEfetivo(120), 'IV');
  assert.equal(janela.faseParaEfetivo(9000), 'VI');
  assert.ok(janela.ordemFase('IV') > janela.ordemFase('II'));
  assert.equal(janela.ordemFase('X'), -1);
});

test('declarar a fase é ato com autor e hora', semAplicacao, async () => {
  comUnidade(2);
  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  const r = janela.declararFase('III', {});
  assert.equal(r.ok, true, r.motivo);
  assert.equal(estado().meta.fase, 'III');
  assert.equal(estado().meta.fasePor, 'Cmdt Silva');
  assert.ok(estado().meta.faseG);
  const ev = estado().evolucao.slice(-1)[0];
  assert.equal(ev.tipo, 'decisao');
  assert.match(ev.txt, /Fase do SGO declarada: III/);

  assert.equal(janela.declararFase('III', {}).ok, false, 'declarou a mesma duas vezes');
  assert.equal(janela.declararFase('X', {}).ok, false, 'aceitou uma fase que não existe');
});

test('a conformidade acusa a fase por declarar com efetivo no terreno', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const e = janela.estObj();
  e.n = 1;
  e.setores = [{ estado: 'Em curso (ativo)', cmd: '', ct: '', adj: '', m: '', o: '',
    tip: Array.from({ length: 12 }, () => ({ t: 'VFCI', mu: 1, ou: 5, mr: 0, ar: 0,
      ts: janela.agora(), ent: '', rend: { g: '', por: '', nota: '' } })) }];
  estado().meta.inicio = janela.gdhDe(janela.agora() - 30 * 60000);
  janela.escreverForm();

  const item = daqui(janela.verificacoesDON()).find((x) => x.id === 'fase');
  assert.ok(item, 'a regra da fase devia pronunciar-se');
  assert.equal(item.n, 'ob');
  assert.match(item.t, /Fase do SGO por declarar/);
  assert.match(item.s, /60 operacionais/);
  assert.match(item.a, /sugere a fase III/);
});

test('sem fase declarada não se diz que a fase foi ultrapassada', semAplicacao, () => {
  // Sem fase declarada não há fase a ultrapassar: o que falta é declará-la.
  comUnidade(2);
  estado().meta.fase = '';
  janela.escreverForm();
  janela.pintarFase();
  const linha = doc().getElementById('fase-info').textContent;
  assert.match(linha, /Fase por declarar/);
  assert.doesNotMatch(linha, /ultrapassou/);

  estado().meta.fase = 'I';
  janela.escreverForm();
  const e = janela.estObj();
  for (let i = 0; i < 20; i++) {
    e.setores[0].tip.push({ t: 'VFCI', mu: 1, ou: 5, mr: 0, ar: 0, ts: janela.agora(), ent: '', rend: { g: '', por: '', nota: '' } });
  }
  janela.pintarFase();
  assert.match(doc().getElementById('fase-info').textContent, /ultrapassou a fase declarada/);
});

test('o chip passa a dizer que a rendição foi pedida, sem ser preciso recarregar', semAplicacao, () => {
  comUnidade(13);
  janela.renderSetores();
  const antes = doc().querySelector('#s-lista [data-rend]');
  assert.ok(antes && !antes.className.includes('ped'));

  janela.solicitarRendicao('s:0:0');
  janela.repintarMedidores();
  const depois = doc().querySelector('#s-lista [data-rend]');
  assert.match(depois.className, /ped/, 'o medidor continuou a mostrar o que mostrava antes do pedido');
  assert.match(depois.textContent, /rend\. pedida/);
});

/* ---- o fim da rendição: saída do TO e chegada à Entidade — r0107 ---- */

test('a saída do TO tira a unidade da contagem e fica na evolução e na fita', semAplicacao, async () => {
  const it = comUnidade(13);
  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  assert.equal(janela.rendicoes().length, 1, 'antes de sair, conta');
  const r = janela.registarRendicao('s:0:0', { saida: '051430SET26' });
  assert.equal(r.ok, true, r.motivo);
  assert.equal(it.rend.saida, '051430SET26');
  assert.equal(it.rend.chegada, '', 'a chegada não se inventa: regista-se quando a Entidade a confirmar');
  assert.equal(janela.rendSaiu(it), true);
  assert.equal(janela.rendicoes().length, 0, 'quem saiu do TO não está em empenhamento');
  const RD = janela.estadoDasRendicoes();
  assert.equal(RD.rendidas.length, 1);
  assert.equal(RD.rendidas[0].saida, '051430SET26');
  const ev = estado().evolucao.slice(-1)[0];
  assert.equal(ev.tipo, 'meios');
  assert.match(ev.txt, /Rendição de VFCI · CB Lamego \(Setor Alfa\): saída do TO às 051430SET26\./);
  assert.ok(estado().fita.some((x) => /saída do TO às 051430SET26/.test(x.e)));
});

test('a chegada à Entidade é a de 9.d.(6), vem depois da saída e não pode ser anterior a ela', semAplicacao, async () => {
  const it = comUnidade(13);
  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  const soChegada = janela.registarRendicao('s:0:0', { chegada: '051600SET26' });
  assert.equal(soChegada.ok, false);
  assert.match(soChegada.motivo, /primeiro a saída/);
  assert.equal(janela.registarRendicao('s:0:0', { saida: '051430SET26' }).ok, true);
  const antes = janela.registarRendicao('s:0:0', { chegada: '051400SET26' });
  assert.equal(antes.ok, false);
  assert.match(antes.motivo, /anterior à saída/);
  const r = janela.registarRendicao('s:0:0', { chegada: '051600SET26' });
  assert.equal(r.ok, true, r.motivo);
  assert.equal(it.rend.chegada, '051600SET26');
  const ev = estado().evolucao.slice(-1)[0];
  assert.match(ev.txt, /chegada à Entidade às 051600SET26 \(DON n\.º 2, 9\.d\.\(6\)\)/,
    'a evolução diz qual das duas definições da DON se gravou');
  assert.equal(janela.registarRendicao('s:0:0', { chegada: '051600SET26' }).ok, false, 'repetir não é registar');
  assert.equal(janela.registarRendicao('s:0:0', {}).ok, false, 'sem hora nenhuma não há o que registar');
});

test('o fim da rendição não exige pedido, e retirar o pedido não apaga a saída', semAplicacao, async () => {
  const it = comUnidade(13);
  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  assert.equal(janela.registarRendicao('s:0:0', { saida: '051430SET26' }).ok, true,
    'um meio rendido por iniciativa do CSREPC também sai, e sem pedido deste posto');
  assert.equal(janela.solicitarRendicao('s:0:0', { nota: 'tarde' }).ok, true);
  assert.equal(janela.retirarSolicitacaoRendicao('s:0:0').ok, true);
  assert.equal(it.rend.saida, '051430SET26', 'a saída é facto de outro momento');
  assert.equal(it.rend.g, '');
});

test('o painel da rendição pede a saída e depois a chegada, e o briefing diz quem já saiu', semAplicacao, async () => {
  const it = comUnidade(13);
  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  /* O jsdom não desloca a vista; o painel a sério fá-lo depois de se pintar. */
  if (!janela.Element.prototype.scrollIntoView) janela.Element.prototype.scrollIntoView = () => {};
  janela.abrirRendicao('s:0:0');
  assert.ok(doc().getElementById('rd-saida'), 'antes de sair, pede-se a saída');
  assert.match(doc().getElementById('rend-painel').textContent, /9\.d\.\(6\)/, 'a definição está escrita onde se regista');
  doc().getElementById('rd-saida').value = '051430SET26';
  doc().getElementById('rd-registar').click();
  assert.equal(it.rend.saida, '051430SET26');
  assert.ok(!doc().getElementById('rd-saida'), 'saída registada: já não se pede');
  assert.ok(doc().getElementById('rd-chegada'), 'a chegada continua por registar');
  const b = janela.textoBriefing(janela.briefingPassagem(janela.agora()));
  assert.match(b, /Rendidas: VFCI · CB Lamego \(Setor Alfa\), saída do TO às 051430SET26, chegada à Entidade por registar/);
  const chip = doc().querySelector('[data-rend="s:0:0"]');
  assert.ok(chip && /saiu · 051430SET26/.test(chip.textContent), 'o medidor diz que saiu');
  janela.abrirRendicao('');
});

test('um estado da versão 28 ganha saída e chegada vazias em cada rendição que já existia', semAplicacao, () => {
  const m = janela.migrarGravado({
    versao: 28, meta: { num: '2026/900' }, pco: { funcoes: [] },
    dados: { est: { n: 1, setores: [{ tip: [{ t: 'VFCI', ts: 1, rend: { g: '051200SET26', por: 'x', nota: '' } }, { t: 'VUCI' }] }],
      aerL: [{ t: 'HEBL', ts: 1, rend: { g: '', por: '', nota: '' } }] } },
  });
  assert.equal(m.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.deepEqual(daqui(m.dados.est.setores[0].tip[0].rend), { g: '051200SET26', por: 'x', nota: '', saida: '', chegada: '' });
  assert.equal(m.dados.est.setores[0].tip[1].rend, undefined, 'a unidade sem pedido continua sem ramo');
  assert.deepEqual(daqui(m.dados.est.aerL[0].rend), { g: '', por: '', nota: '', saida: '', chegada: '' });
});
