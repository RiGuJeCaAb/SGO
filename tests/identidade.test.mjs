// Identidade declarada e perfis — a primeira etapa do caminho para as contas.
//
// Não é autenticação, e o que se testa aqui é precisamente que a aplicação não finge que
// é: nada é verificado, o perfil escolhe-se em vez de se provar, e a recusa di-lo. O que
// isto dá é atribuição — cada ato de comando fica com o nome de quem o registou — e
// prevenção do engano, que é diferente de impedir o abuso.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const doc = () => janela.document;
const estado = () => avaliar(janela, 'O');
const sessao = () => avaliar(janela, 'SESSAO');

beforeEach(async () => { if (janela) { await janela.largarTeclado(); janela.eval('O = novoEstado()'); } });

test('sem ninguém ao teclado, a aplicação não estorva', semAplicacao, () => {
  // Um PCO a meio de uma ocorrência não pára para se apresentar. Sem sessão, pode tudo —
  // e o que a aplicação faz é pedir o nome no momento do ato.
  assert.equal(janela.haSessao(), false);
  assert.equal(janela.quemRegista(), '');
  ['escrever', 'elaborar', 'aprovar', 'encerrar'].forEach((c) =>
    assert.equal(janela.podeFazer(c), true, `sem sessão devia poder ${c}`));
});

test('assumir o teclado atribui o registo, e fica na fita', semAplicacao, async () => {
  const r = await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  assert.equal(r.ok, true);
  assert.equal(janela.quemRegista(), 'Cmdt Silva');
  assert.equal(sessao().perfil, 'cos');
  assert.ok(sessao().desde, 'sem instante não se sabe desde quando');
  assert.ok(estado().fita.some((x) => /Ao teclado: Cmdt Silva/.test(x.e)));

  assert.equal((await janela.assumirTeclado('', 'Cmdt', 'cos')).ok, false, 'assumiu sem nome');
});

test('o perfil decide o que se pode fazer, e a recusa explica-se', semAplicacao, async () => {
  await janela.assumirTeclado('Costa', 'Adj.', 'observador');
  assert.equal(janela.podeFazer('escrever'), false);
  assert.equal(janela.podeFazer('aprovar'), false);
  assert.match(janela.motivoPerfil('aprovar'), /Observador/);
  assert.match(janela.motivoPerfil('aprovar'), /Quem regista/, 'a recusa tem de dizer onde se resolve');

  await janela.assumirTeclado('Costa', 'Adj.', 'operador');
  assert.equal(janela.podeFazer('escrever'), true);
  assert.equal(janela.podeFazer('aprovar'), false, 'um operador de registo não aprova um PEA');

  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  assert.equal(janela.podeFazer('aprovar'), true);
  assert.equal(janela.podeFazer('encerrar'), true);
});

test('um observador não escreve na evolução', semAplicacao, async () => {
  await janela.assumirTeclado('Costa', 'Adj.', 'observador');
  janela.escreverForm();
  doc().getElementById('e-txt').value = 'frente dominada';
  doc().getElementById('e-gdh').value = '';
  janela.addEvo();
  assert.equal(estado().evolucao.length, 0);
  assert.match(doc().getElementById('msg-occ').textContent, /Observador/);
});

test('quem não tem competência não aprova o PEA', semAplicacao, async () => {
  const O = estado();
  O.peas.push({ n: 1, g: '281200AGO26', ts: janela.agora(), ctrl: [], base: {},
    estado: 'analise', analise: { g: '281300AGO26' },
    aprovacao: { g: '', por: '', funcao: '', nota: '' }, json: { pea: {}, ordens: null } });

  await janela.assumirTeclado('Costa', 'Adj.', 'operador');
  const nao = janela.aprovarPEA(1, { por: 'Cmdt Silva' });
  assert.equal(nao.ok, false);
  assert.match(nao.motivo, /não inclui esta ação/);
  assert.equal(janela.estadoPEA(O.peas[0]), 'analise');

  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  assert.equal(janela.aprovarPEA(1, { por: 'Cmdt Silva' }).ok, true);
});

test('quem está ao teclado é quem se propõe nos campos de quem determina', semAplicacao, async () => {
  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  doc().getElementById('enc-por').value = '';
  janela.pintarEncerramento();
  assert.equal(doc().getElementById('enc-por').value, 'Cmdt Silva',
    'o campo devia propor quem está ao teclado');
});

test('largar o teclado devolve o registo ao anonimato, e di-lo', semAplicacao, async () => {
  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  await janela.largarTeclado();
  assert.equal(janela.haSessao(), false);
  janela.pintarSessao();
  const linha = doc().getElementById('id-estado');
  assert.match(linha.textContent, /Ninguém declarado/);
  assert.equal(linha.style.color, 'var(--terra)', 'o anonimato do registo não pode passar despercebido');
});

test('a identidade vive fora da ocorrência', semAplicacao, async () => {
  // A sessão é de quem está ao teclado, não da ocorrência: sobrevive-lhe, não entra no
  // PEA e não viaja na exportação.
  await janela.assumirTeclado('Silva', 'Cmdt', 'cos');
  janela.eval('O = novoEstado()');
  assert.equal(janela.quemRegista(), 'Cmdt Silva', 'a sessão não pode morrer com a ocorrência');
  const pacote = JSON.stringify(JSON.parse(JSON.stringify(janela.pacoteOcorrencia())));
  assert.equal(pacote.includes('Cmdt Silva'), false,
    'a sessão não pode viajar dentro da ocorrência — só viaja o nome que ficou num ato');
});
