// Correção 4.6 — a ocorrência não se pode perder.
// O ARMAZEM pode cair em memória de sessão. A exportação não depende dele: é a
// cópia que o oficial controla, e a única que sobrevive a um dispositivo sem
// armazenamento.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));
const estado = () => avaliar(janela, 'O');

beforeEach(() => {
  if (!janela) return;
  janela.confirm = () => true;
  janela.eval('O = novoEstado()');
});

/** Preenche como o utilizador preencheria: os campos no formulário, os derivados
 *  no estado. O pacote de exportação lê o formulário antes de o montar. */
function ocorrenciaDeEnsaio() {
  janela.document.getElementById('o-num').value = '2026/4711';
  janela.document.getElementById('o-local').value = 'Leomil — Moimenta da Beira';
  const O = estado();
  O.meta.distrito = 'Viseu';
  O.evolucao.push({ g: '281200AGO26', tipo: 'posit', t: 'Primeiro POSIT' });
  return O;
}

test('o pacote exportado leva tipo, versão e estado', semAplicacao, () => {
  ocorrenciaDeEnsaio();
  const pacote = janela.pacoteOcorrencia();
  assert.equal(pacote.tipo, 'peaapp:ocorrencia');
  assert.equal(pacote.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.equal(pacote.estado.meta.num, '2026/4711');
  assert.ok(pacote.g, 'leva o GDH da exportação');
});

test('o nome do ficheiro segue a convenção e não leva caracteres ilegais', semAplicacao, () => {
  ocorrenciaDeEnsaio();
  janela.lerForm();
  const nome = janela.nomeExportacao();
  // A revisão da app entra no nome: um ficheiro tem de se saber de que entrega saiu.
  assert.match(nome, /^CSREPCDouro_ocorrencia-2026-4711_\d{12}_r\d{4}_EstacaoPEA_CLD\.json$/);
});

test('o pacote leva a revisão da app e o carimbo do estado', semAplicacao, () => {
  ocorrenciaDeEnsaio();
  const pacote = janela.pacoteOcorrencia();
  assert.match(pacote.app, /^r\d{4}$/, 'sem revisão não se sabe de onde veio o ficheiro');
  assert.match(pacote.sha, /^[0-9a-f]{64}$/);
  assert.equal(pacote.sha, janela.resumoEstado(pacote.estado), 'o carimbo é o do estado que vai dentro');
});

test('o carimbo apanha o ficheiro alterado depois de exportado', semAplicacao, () => {
  ocorrenciaDeEnsaio();
  const texto = JSON.stringify(janela.pacoteOcorrencia());
  assert.equal(janela.conferirCarimboDoPacote(JSON.parse(texto)).bate, true, 'o pacote acabado de escrever confere');

  // alguém abriu o ficheiro e mudou o local, sem tocar no carimbo
  const mexido = JSON.parse(texto);
  mexido.estado.meta.local = 'Outro sítio qualquer';
  const q = janela.conferirCarimboDoPacote(JSON.parse(JSON.stringify(mexido)));
  assert.equal(q.bate, false);
  assert.match(q.nota, /não confere/);

  // e um pacote de antes do carimbo não é acusado de nada: diz-se que não o traz
  const antigo = JSON.parse(texto); delete antigo.sha;
  assert.equal(janela.conferirCarimboDoPacote(JSON.parse(JSON.stringify(antigo))).bate, null);
});

test('sem número de ocorrência o nome continua a ser válido', semAplicacao, () => {
  assert.match(janela.nomeExportacao(), /ocorrencia-sem-num_/);
});

test('o que se exporta é o que se importa', semAplicacao, async () => {
  ocorrenciaDeEnsaio();
  const texto = JSON.stringify(janela.pacoteOcorrencia());

  janela.eval('O = novoEstado()');
  janela.document.getElementById('o-num').value = '';
  janela.document.getElementById('o-local').value = '';
  assert.equal(estado().meta.num, '', 'partimos de estado limpo');

  assert.equal(await janela.importarOcorrencia(texto), true);
  assert.equal(estado().meta.num, '2026/4711');
  assert.equal(estado().meta.local, 'Leomil — Moimenta da Beira');
  assert.equal(estado().meta.distrito, 'Viseu', 'o campo derivado viaja com a ocorrência');
  assert.equal(estado().evolucao.length, 1);
});

test('a importação repõe também o formulário', semAplicacao, async () => {
  ocorrenciaDeEnsaio();
  const texto = JSON.stringify(janela.pacoteOcorrencia());
  janela.eval('O = novoEstado()');
  janela.document.getElementById('o-num').value = '';
  await janela.importarOcorrencia(texto);
  assert.equal(janela.document.getElementById('o-num').value, '2026/4711');
});

test('um estado nu, sem invólucro, também é aceite', semAplicacao, () => {
  const lido = janela.lerPacoteDeObjeto(JSON.parse(JSON.stringify({ meta: { num: '2026/1' }, dados: {} })));
  assert.equal(lido.meta.num, '2026/1');
  assert.equal(lido.versao, avaliar(janela, 'VERSAO_ESTADO'), 'migrado pelo mesmo caminho');
});

test('o que não é uma ocorrência é recusado com motivo', semAplicacao, async () => {
  // O JSON inválido recusa-se em `importarOcorrencia`, que é quem analisa o texto — uma vez
  // só, desde a r0099; o leitor por objeto já recebe o pacote analisado.
  assert.equal(await janela.importarOcorrencia('isto não é json'), false);
  assert.match(janela.document.getElementById('msg-occ').textContent, /não é JSON válido/);
  assert.throws(() => janela.lerPacoteDeObjeto(JSON.parse('"texto"')), /forma esperada/);
  assert.throws(() => janela.lerPacoteDeObjeto(JSON.parse('{"outra":"coisa"}')), /não contém uma ocorrência/);
  assert.throws(() => janela.lerPacoteDeObjeto(JSON.parse('[]')), /não contém uma ocorrência/);
});

test('um ficheiro de revisão posterior é recusado, não adivinhado', semAplicacao, () => {
  const futuro = avaliar(janela, 'VERSAO_ESTADO') + 3;
  assert.throws(
    () => janela.lerPacoteDeObjeto(JSON.parse(JSON.stringify({ tipo: 'peaapp:ocorrencia', estado: { meta: {}, versao: futuro } }))),
    (e) => e.futuro === futuro,
  );
});

test('uma importação recusada não mexe na ocorrência em memória', semAplicacao, async () => {
  ocorrenciaDeEnsaio();
  janela.lerForm();
  assert.equal(await janela.importarOcorrencia('{"outra":"coisa"}'), false);
  assert.equal(estado().meta.num, '2026/4711', 'a ocorrência em memória ficou intacta');
});

test('substituir uma ocorrência diferente pede confirmação', semAplicacao, async () => {
  ocorrenciaDeEnsaio();
  janela.lerForm();
  const outra = JSON.stringify({ tipo: 'peaapp:ocorrencia', estado: { meta: { num: '2026/9999' } } });

  let perguntou = false;
  janela.confirm = () => { perguntou = true; return false; };
  assert.equal(await janela.importarOcorrencia(outra), false);
  assert.ok(perguntou, 'devia ter perguntado');
  assert.equal(estado().meta.num, '2026/4711', 'recusada, mantém-se a que estava');

  janela.confirm = () => true;
  assert.equal(await janela.importarOcorrencia(outra), true);
  assert.equal(estado().meta.num, '2026/9999');
});

/* ---- proveniência: o que fica depois de o aviso desaparecer ---- */

test('um ficheiro com carimbo válido deixa a marca de verificado', semAplicacao, async () => {
  ocorrenciaDeEnsaio();
  const texto = JSON.stringify(janela.pacoteOcorrencia());
  janela.eval('O = novoEstado()');
  janela.escreverForm();
  assert.equal(await janela.importarOcorrencia(texto), true);
  const p = estado().integridade;
  assert.equal(p.estado, 'valida');
  assert.match(p.sha, /^[0-9a-f]{64}$/);
  assert.match(p.app, /^r\d{4}$/, 'a marca guarda a revisão que exportou o ficheiro');
  assert.ok(p.g, 'e o instante da importação');

  janela.pintarProveniencia();
  assert.match(janela.document.getElementById('occ-proveniencia').textContent, /carimbo de integridade confere/);
});

test('um ficheiro sem carimbo entra como legado, sem alarme', semAplicacao, async () => {
  ocorrenciaDeEnsaio();
  const pacote = janela.pacoteOcorrencia();
  delete pacote.sha;
  janela.eval('O = novoEstado()');
  janela.escreverForm();
  assert.equal(await janela.importarOcorrencia(JSON.stringify(pacote)), true);
  assert.equal(estado().integridade.estado, 'legado');
  janela.pintarProveniencia();
  assert.match(janela.document.getElementById('occ-proveniencia').textContent, /não trazia carimbo/);
});

test('um carimbo que não confere exige decisão expressa, e fica registado', semAplicacao, async () => {
  ocorrenciaDeEnsaio();
  const mexido = JSON.parse(JSON.stringify(janela.pacoteOcorrencia()));
  mexido.estado.meta.local = 'Outro sítio qualquer';   // alterado depois de exportado

  // 1. recusar a decisão cancela a importação inteira
  janela.eval('O = novoEstado()');
  janela.escreverForm();
  const confirmOriginal = janela.confirm;
  janela.confirm = () => false;
  assert.equal(await janela.importarOcorrencia(JSON.stringify(mexido)), false);
  assert.equal(estado().meta.local, '', 'importou apesar de a decisão ter sido negativa');
  assert.equal(estado().integridade.estado, '');

  // 2. autorizar importa, e a ocorrência fica marcada como não verificada
  janela.confirm = () => true;
  assert.equal(await janela.importarOcorrencia(JSON.stringify(mexido)), true);
  assert.equal(estado().meta.local, 'Outro sítio qualquer');
  assert.equal(estado().integridade.estado, 'falhou');
  janela.pintarProveniencia();
  const linha = janela.document.getElementById('occ-proveniencia');
  assert.match(linha.textContent, /conteúdo não verificado/i);
  assert.equal(linha.style.fontWeight, '700', 'a marca do não verificado não pode ler-se igual às outras');

  // 3. e a marca acompanha a ocorrência na exportação seguinte
  const outra = JSON.parse(JSON.stringify(janela.pacoteOcorrencia()));
  assert.equal(outra.estado.integridade.estado, 'falhou');
  janela.confirm = confirmOriginal;
});

/* ---- forma da ocorrência importada ---- */

test('a forma corrige-se e conta-se, em vez de entrar como vier', semAplicacao, async () => {
  // Um ramo com o tipo trocado chegava aos construtores de HTML como viesse. Corrige-se,
  // porque num PCO um ficheiro com um campo estragado ainda é a ocorrência.
  ocorrenciaDeEnsaio();
  const pacote = JSON.parse(JSON.stringify(janela.pacoteOcorrencia()));
  pacote.estado.evolucao = 'isto não é uma lista';
  pacote.estado.fita = [
    { g: '281200AGO26', e: 'linha boa' },
    { g: '281200AGO26' },                       // sem evento
    'nem sequer é objeto',
    { g: 281200, e: { texto: 'objeto onde devia estar texto' } },
  ];
  pacote.estado.csv = { nao: 'é texto' };

  janela.eval('O = novoEstado()');
  janela.escreverForm();
  assert.equal(await janela.importarOcorrencia(JSON.stringify(pacote)), true,
    'um ficheiro com forma estragada continua a ser a ocorrência');

  const O = estado();
  assert.ok(Array.isArray(O.evolucao), 'a evolução tem de acabar como lista');
  assert.equal(typeof O.csv, 'string');
  assert.equal(O.fita.filter((x) => x.e === 'linha boa').length, 1, 'a linha boa perdeu-se');
  assert.equal(O.fita.filter((x) => typeof x.e !== 'string').length, 0, 'ficou lixo na fita');

  // e o que se corrigiu fica dito, na fita e na evolução
  assert.ok(O.fita.some((x) => /Forma corrigida na importação/.test(x.e)));
  assert.ok(O.evolucao.some((x) => /correções de forma/.test(x.txt)));
});

test('conferirForma não acusa o que apenas falta', semAplicacao, () => {
  // Um ramo em falta é idade, não é defeito: a escada de migrações é que trata disso.
  const e = { meta: {}, dados: {}, logistica: {}, pco: {}, turno: {}, encerramento: {},
    integridade: {}, cumprimentos: {}, csv: '', evolucao: [], fita: [], peas: [] };
  // `deepEqual` sobre uma lista vinda do jsdom falha por não ser da mesma realidade;
  // compara-se o conteúdo, que é o que interessa. Armadilha já registada no projeto.
  assert.deepEqual(daqui(janela.conferirForma(e)), []);
  const semRamos = { meta: {} };
  assert.deepEqual(daqui(janela.conferirForma(semRamos)), [], 'acusou ramos que só faltavam');
  assert.ok(Array.isArray(semRamos.evolucao), 'e devia tê-los reposto vazios');
  assert.deepEqual(daqui(janela.conferirForma(null)), ['o ficheiro não contém uma ocorrência']);
});
