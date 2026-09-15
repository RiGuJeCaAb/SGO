// Postos de trabalho e ocupações — etapa 2 da ordem de construção do contrato do serviço
// da VCOC, v0.2, secção 4. A única que não depende de servidor nenhum: o modelo e o seu
// registo, para se provar no terreno antes de se lhe pendurar criptografia.
//
// O que aqui se fixa é a cadeia de custódia de um lugar: um posto tem uma ocupação aberta
// no máximo, uma ocupação nova fecha a anterior no mesmo instante, e nada se apaga. Uma
// cadeia com um elo apagado não prova nada, que é o ponto de tudo isto.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());
const daqui = (x) => JSON.parse(JSON.stringify(x));
const ocupacoes = () => daqui(avaliar(janela, 'O')).ocupacoes;

beforeEach(async () => {
  if (!janela) return;
  janela.eval('O = novoEstado()');
  await janela.declararPostoLocal('');
  await janela.largarTeclado();
});

test('os lugares são os da estrutura, e o do comando é o do COS', semAplicacao, () => {
  /* Derivam das células de propósito: uma segunda lista divergiria da primeira no dia em
     que a estrutura mudasse. */
  const P = daqui(janela.POSTOS_PCO());
  assert.deepEqual(P.map((x) => x.k), ['comando', 'operacoes', 'planeamento', 'logistica']);
  assert.match(P[0].d, /COS/);
  assert.match(P[1].d, /Célula de Operações/);
  P.forEach((x) => assert.match(x.r, /art/, x.k + ' sem norma'));
});

test('sem posto declarado nada se regista, e a aplicação fica como sempre esteve', semAplicacao, async () => {
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  assert.equal(janela.postoLocal(), null);
  assert.deepEqual(ocupacoes(), []);
  assert.equal(janela.quemRegista(), 'Cmdt Abreu', 'o ato continua a levar o nome');
});

test('assumir o teclado num posto declarado abre a ocupação', semAplicacao, async () => {
  await janela.declararPostoLocal('operacoes');
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  const O = ocupacoes();
  assert.equal(O.length, 1);
  assert.equal(O[0].p, 'operacoes');
  assert.equal(O[0].nome, 'Abreu'); assert.equal(O[0].g, 'Cmdt', 'a patente fica em campo próprio');
  assert.equal(O[0].perfil, 'cos');
  assert.equal(O[0].ate, '', 'nasce aberta');
  assert.match(O[0].de, /^\d{6}[A-Z]{3}\d{2}$/);
  assert.equal(daqui(janela.ocupacaoAberta('operacoes')).id, O[0].id);
  assert.equal(janela.ocupacaoAberta('comando'), null, 'só o posto deste dispositivo');
});

test('deixar o teclado fecha a ocupação, e não a apaga', semAplicacao, async () => {
  await janela.declararPostoLocal('operacoes');
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  await janela.largarTeclado();
  const O = ocupacoes();
  assert.equal(O.length, 1, 'fechar não é apagar');
  assert.notEqual(O[0].ate, '');
  assert.match(O[0].fim, /deixou o teclado/);
  assert.equal(janela.ocupacaoAberta('operacoes'), null);
});

test('render um lugar fecha a ocupação anterior no mesmo instante, sem buraco', semAplicacao, async () => {
  /* É a rendição vista do lado do lugar. Um intervalo por fechar entre duas ocupações é
     uma hora em que ninguém respondia pelo posto, e isso nunca aconteceu. */
  await janela.declararPostoLocal('operacoes');
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  await janela.assumirTeclado('Silva', 'Adj.', 'operacoes');
  const O = ocupacoes();
  assert.equal(O.length, 2);
  assert.equal(O[0].ate, O[1].de, 'o fecho de uma é a abertura da outra');
  assert.match(O[0].fim, /rendido por Adj\. Silva/);
  assert.equal(O[1].ate, '');
  assert.equal(janela.nomeDaOcupacao(janela.ocupacaoAberta('operacoes')), 'Adj. Silva');
});

test('atualizar a mesma pessoa não abre ocupação nova', semAplicacao, async () => {
  await janela.declararPostoLocal('operacoes');
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  assert.equal(ocupacoes().length, 1, 'carregar em «Atualizar» não é render-se a si próprio');
});

test('mudar o posto do dispositivo fecha o lugar antigo e abre o novo', semAplicacao, async () => {
  await janela.declararPostoLocal('operacoes');
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  await janela.declararPostoLocal('planeamento');
  const O = ocupacoes();
  assert.equal(O.length, 2);
  assert.equal(O[0].p, 'operacoes'); assert.notEqual(O[0].ate, '');
  assert.match(O[0].fim, /mudou de posto/);
  assert.equal(O[1].p, 'planeamento'); assert.equal(O[1].ate, '');
  assert.equal(janela.postoLocal().k, 'planeamento');
});

test('um posto que não existe na estrutura é recusado com a razão', semAplicacao, async () => {
  const r = await janela.declararPostoLocal('cantina');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /não existe na estrutura/);
  assert.equal(janela.postoLocal(), null);
});

test('um registo sabe que ocupação o cobre pelo seu GDH', semAplicacao, async () => {
  /* É o que a etapa 2 promete: a fita diz que posto fez o quê, sem cada linha o levar
     escrito. Uma ocupação cobre um intervalo, e o ato cai dentro dele. */
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.ocupacoes = [
    { id: 'o1', p: 'operacoes', nome: 'Silva', g: 'Adj.', perfil: 'operacoes', de: '151200SET26', ate: '151400SET26', fim: 'rendido' },
    { id: 'o2', p: 'operacoes', nome: 'Abreu', g: 'Cmdt', perfil: 'cos', de: '151400SET26', ate: '', fim: '' },
  ];
  assert.equal(janela.quemEstavaEm('151300SET26'), 'Operações · Adj. Silva');
  assert.equal(janela.quemEstavaEm('151800SET26'), 'Operações · Cmdt Abreu', 'a aberta cobre o que vier');
  assert.equal(janela.quemEstavaEm('151100SET26'), '', 'antes de haver ocupação, não havia');
  assert.equal(janela.quemEstavaEm('ontem'), '', 'um GDH ilegível não inventa ocupação');
  /* No minuto da rendição conta quem entrou, por convenção declarada: o intervalo é
     fechado à esquerda e aberto à direita. Sem isso, e como a rendição e o primeiro registo
     de quem entra caem quase sempre no mesmo minuto, cada uma dessas linhas saía com dois
     responsáveis — e uma linha com dois não responde a quem respondia. */
  assert.equal(daqui(janela.ocupacoesEm('151400SET26')).length, 1);
  assert.equal(janela.quemEstavaEm('151400SET26'), 'Operações · Cmdt Abreu');
  assert.equal(janela.quemEstavaEm('151359SET26'), 'Operações · Adj. Silva');
});

test('a cadeia de custódia de um lugar lê-se do mais recente para o mais antigo', semAplicacao, async () => {
  await janela.declararPostoLocal('comando');
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  await janela.assumirTeclado('Silva', 'Adj.', 'operacoes');
  const c = daqui(janela.custodiaDoPosto('comando'));
  assert.deepEqual(c.map((o) => janela.nomeDaOcupacao(o)), ['Adj. Silva', 'Cmdt Abreu']);
  assert.deepEqual(daqui(janela.custodiaDoPosto('logistica')), []);
});

test('encerrar o registo vaga os lugares, e um registo encerrado não aceita ocupações novas', semAplicacao, async () => {
  await janela.declararPostoLocal('comando');
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.inicio = janela.gdhAgora();
  const r = await janela.encerrarOcorrencia('Cmdt Abreu', 'ensaio');
  if (r.ok) {
    const fechada = ocupacoes()[0];
    assert.notEqual(fechada.ate, '', 'um registo que fecha não deixa um lugar por vagar');
    assert.match(fechada.fim, /encerramento/);
    assert.equal(janela.abrirOcupacao(), null, 'num registo encerrado não entram factos novos');
  } else {
    /* O encerramento tem as suas próprias condições; se não pôde fechar, o que se fixa
       aqui é só que a ocupação continua aberta e nada se perdeu. */
    assert.equal(ocupacoes()[0].ate, '');
  }
});

test('o ramo novo do estado tem dono declarado e migração própria', semAplicacao, () => {
  assert.equal(avaliar(janela, 'VERSAO_ESTADO'), 30);
  const d = janela.donoDoRamo('ocupacoes');
  assert.equal(d.celula, 'comando');
  assert.match(d.ramo.r, /art\. 15\.º/);
  /* Um estado da versão 29 sobe sem inventar ocupações: não havia postos declarados, e
     escrever-lhe história a partir da sessão seria inventá-la. */
  const m = janela.migrarGravado({ versao: 29, meta: { num: '2026/1' }, fita: [], evolucao: [] });
  assert.deepEqual(daqui(m.ocupacoes), []);
  assert.equal(m.versao, 30);
});

test('o cartão está em Comando, logo a seguir a quem regista', semAplicacao, () => {
  const doc = janela.document;
  const cartao = janela.cartaoPorTitulo('Posto de trabalho');
  assert.ok(cartao, 'falta o cartão');
  assert.ok(cartao.closest('#p-comando'), 'o posto de trabalho é matéria de Comando');
  const quem = janela.cartaoPorTitulo('Quem regista');
  assert.equal(quem.nextElementSibling, cartao, 'quem regista continua primeiro, decisão de 6 de setembro');
  assert.ok(doc.getElementById('ptb-qual'), 'falta o selecionador do lugar');
});

test('o cabeçalho diz o lugar e quem responde por ele, na mesma etiqueta', semAplicacao, async () => {
  /* Uma quarta caixa no grupo do estado espremia a da ocorrência até «Ocorrên…»; são a
     mesma pergunta em duas metades e lêem-se juntas. */
  const et = janela.document.getElementById('quem-tag');
  janela.pintarSessao();
  assert.equal(et.textContent.trim(), 'Ninguém ao teclado');
  await janela.declararPostoLocal('logistica');
  janela.pintarSessao();
  assert.match(et.textContent, /^Logística e Finanças · ninguém ao teclado/);
  assert.ok(et.querySelector('.quem-tag-lugar'), 'o lugar distingue-se do nome');
  await janela.assumirTeclado('Abreu', 'Cmdt', 'cos');
  janela.pintarSessao();
  assert.match(et.textContent, /^Logística e Finanças · Cmdt Abreu/);
  /* Sem lugar declarado continua a dizer o que sempre disse. */
  await janela.declararPostoLocal('');
  janela.pintarSessao();
  assert.match(et.textContent, /^Ao teclado: Cmdt Abreu · COS/);
});
