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
  assert.match(nome, /^CSREPCDouro_ocorrencia-2026-4711_\d{12}_EstacaoPEA_CLD\.json$/);
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
  const lido = janela.lerPacoteOcorrencia(JSON.stringify({ meta: { num: '2026/1' }, dados: {} }));
  assert.equal(lido.meta.num, '2026/1');
  assert.equal(lido.versao, avaliar(janela, 'VERSAO_ESTADO'), 'migrado pelo mesmo caminho');
});

test('o que não é uma ocorrência é recusado com motivo', semAplicacao, () => {
  assert.throws(() => janela.lerPacoteOcorrencia('isto não é json'), /não é JSON válido/);
  assert.throws(() => janela.lerPacoteOcorrencia('"texto"'), /forma esperada/);
  assert.throws(() => janela.lerPacoteOcorrencia('{"outra":"coisa"}'), /não contém uma ocorrência/);
  assert.throws(() => janela.lerPacoteOcorrencia('[]'), /não contém uma ocorrência/);
});

test('um ficheiro de revisão posterior é recusado, não adivinhado', semAplicacao, () => {
  const futuro = avaliar(janela, 'VERSAO_ESTADO') + 3;
  assert.throws(
    () => janela.lerPacoteOcorrencia(JSON.stringify({ tipo: 'peaapp:ocorrencia', estado: { meta: {}, versao: futuro } })),
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
