// Persistência — a metade da etapa 1 que não depende de servidor nenhum.
//
// Em jsdom não há IndexedDB, e isso é útil: estes testes exercitam **o recuo**, que é o
// caminho que corre nos navegadores onde a base não abre. O caminho do IndexedDB
// verifica-se em navegador, com Chromium, e está registado em `docs/qa/`.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const estado = () => avaliar(janela, 'O');
// `ARMAZEM` é `const` no topo do script: ao contrário das funções, não fica em `window`.
const armazem = () => avaliar(janela, 'ARMAZEM');

beforeEach(() => { if (janela) { janela.eval('O = novoEstado()'); janela.escreverForm(); } });

test('sem IndexedDB, o armazém diz que não é atómico em vez de fingir', semAplicacao, () => {
  assert.equal(avaliar(janela, 'IDB'), null, 'o jsdom não tem IndexedDB: é o caminho do recuo');
  assert.equal(armazem().atomico, false);
  assert.ok(['browser', 'sessao', 'claude'].includes(armazem().modo));
});

test('a escrita de várias chaves existe nos dois caminhos', semAplicacao, async () => {
  const r = await armazem().setVarias([['peaapp:t1', 'a'], ['peaapp:t2', 'b']]);
  assert.equal(r.atomico, false, 'sem transação, tem de dizer-se que não houve transação');
  assert.equal((await armazem().get('peaapp:t1')).value, 'a');
  assert.equal((await armazem().get('peaapp:t2')).value, 'b');
  await armazem().del('peaapp:t1'); await armazem().del('peaapp:t2');
});

test('cada linha do diário encadeia na anterior', semAplicacao, async () => {
  janela.eval('DIARIO_N = 0; DIARIO_ULT = ""');
  await armazem().del('peaapp:diario');

  const a = await janela.diarioAcrescentar('primeira');
  const b = await janela.diarioAcrescentar('segunda');
  assert.equal(a.n, 1);
  assert.equal(b.anterior, a.sha, 'a segunda linha tem de apontar para a primeira');
  assert.match(b.sha, /^[0-9a-f]{64}$/);

  const q = await janela.diarioConferir();
  assert.equal(q.ok, true, JSON.stringify(q));
  assert.equal(q.linhas, 2);
});

test('uma linha retirada pelo meio parte a cadeia, e vê-se onde', semAplicacao, async () => {
  janela.eval('DIARIO_N = 0; DIARIO_ULT = ""');
  await armazem().del('peaapp:diario');
  await janela.diarioAcrescentar('primeira');
  await janela.diarioAcrescentar('segunda');
  await janela.diarioAcrescentar('terceira');

  // alguém apaga a do meio, como quem tira uma folha
  const L = await janela.diarioLer();
  await armazem().set('peaapp:diario', JSON.stringify([L[0], L[2]]));

  const q = await janela.diarioConferir();
  assert.equal(q.ok, false, 'a cadeia devia partir');
  assert.deepEqual(JSON.parse(JSON.stringify(q.partidas)), [3], 'e devia dizer em que linha');
});

test('a fita escreve na ocorrência e no diário do posto', semAplicacao, async () => {
  janela.eval('DIARIO_N = 0; DIARIO_ULT = ""');
  await armazem().del('peaapp:diario');
  janela.fita('teste do diário');
  await new Promise((r) => setTimeout(r, 20));   // o diário é assíncrono, de propósito
  assert.ok(estado().fita.some((x) => x.e === 'teste do diário'));
  const L = await janela.diarioLer();
  assert.ok(L.some((x) => x.evento === 'teste do diário'),
    'a fita morre com a ocorrência; o diário é o que fica');
});

test('repor uma cópia guarda primeiro o que lá está', semAplicacao, async () => {
  // Recuperar não pode ser destrutivo: quem repõe a cópia errada tem de poder voltar.
  await armazem().del('peaapp:copias');
  janela.eval('COPIA_ULT_TS = 0');
  const O = estado();
  O.meta.num = '2026/1'; O.meta.local = 'Leomil';
  janela.escreverForm();
  const c1 = await janela.copiaGuardar('a primeira');
  assert.ok(c1 && c1.sha, 'não guardou cópia nenhuma');

  janela.document.getElementById('o-local').value = 'Outro sítio';
  janela.lerForm();
  assert.equal(estado().meta.local, 'Outro sítio');

  const r = await janela.copiaRepor(c1.id);
  assert.equal(r.ok, true, r.motivo);
  assert.equal(estado().meta.local, 'Leomil', 'a cópia não foi reposta');
  assert.ok(estado().fita.some((x) => /Reposta a cópia/.test(x.e)));
});

test('a cópia automática espera o intervalo, e não copia sem ocorrência', semAplicacao, async () => {
  await armazem().del('peaapp:copias');
  janela.eval('COPIA_ULT_TS = 0');
  assert.equal(await janela.copiaSeDevida(), null, 'sem número de ocorrência não há o que copiar');

  estado().meta.num = '2026/2';
  janela.escreverForm();
  assert.ok(await janela.copiaSeDevida(), 'a primeira devia ser guardada');
  assert.equal(await janela.copiaSeDevida(), null, 'a segunda tem de esperar o intervalo');
});
