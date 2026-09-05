// A resposta do ramo #001 (001-t-0023, contra a r0093), integrada na r0103.
//
// O que o #001 mediu: `FOLHAS` era tocado em oito sítios e nenhum era um caminho de troca
// de ocorrência; a folha colocada para a ocorrência A ficava desenhada sobre a B e o retrato
// do PEA da B declarava a folha da A; a colocação não viajava no pacote; e o identificador
// da folha vinha do relógio — cinquenta gerações num ciclo deram um só, e retirar uma folha
// retirava as duas.
//
// Os nomes são os desta aplicação e não os do contrato do #001 (`meta.id` e não `uid`,
// `ocorrencia` na folha). A troca de ocorrência exercita-se pelos caminhos reais — «Nova»,
// a importação — e não por substituir `O` à mão, que não é um caminho de ninguém.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);

const WF = '25.0\n0.0\n0.0\n-25.0\n30012.5\n180487.5\n';

/** Uma folha calibrada de ensaio, em PT-TM06, com o nome dado. */
function folha(nome) {
  return av(`folhaCalibrada({ id: novoIdFolha(), nome: ${JSON.stringify(nome)}, largura: 800, altura: 600,
    mundo: lerFicheiroReferenciacao(${JSON.stringify(WF)}), grelha: "pttm06",
    proveniencia: "ensaio 001-t-0023", pontos: 0, controlos: [] })`);
}
/** Coloca uma folha na sessão, como `colocarFolha` faz depois de a validar. */
function colocar(nome) {
  av(`window.__f = null;`);
  janela.__f = folha(nome);
  av('FOLHAS.push(window.__f); pintarFolhas();');
}
/** Estado limpo, a escrever, sem folhas. */
function limpo() {
  av('O = novoEstado(); escreverForm(); if(emLeitura()) sairDeLeitura(); FOLHAS = []; FOLHAS_ORFAS = 0; pintarFolhas();');
}

/* ---- K · a folha pertence a uma ocorrência ---- */

test('K1-K3 · a ocorrência tem identificador interno, distinto do número, que a renumeração não muda', semAplicacao, () => {
  limpo();
  av('O.meta.num = "2026/0001";');
  const id = av('O.meta.id');
  assert.ok(typeof id === 'string' && id.length > 0);
  assert.notEqual(id, '2026/0001');
  av('O.meta.num = "2026/0007";');
  assert.equal(av('O.meta.id'), id, 'uma renumeração é corrente e não pode desligar as folhas da ocorrência');
});

test('K4 · a folha declara a que ocorrência pertence, pelo identificador', semAplicacao, () => {
  limpo();
  colocar('CMP 116');
  const c = av('colocacaoDaFolha(FOLHAS[0])');
  assert.equal(c.ocorrencia, av('O.meta.id'));
  assert.equal(av('folhaDestaOcorrencia(colocacaoDaFolha(FOLHAS[0]))'), true);
});

test('K5-K6 · «Nova» deixa as folhas da anterior fora do ecrã e do retrato', semAplicacao, () => {
  limpo();
  colocar('CMP 116 · ocorrência A');
  assert.match(av('JSON.stringify(retratoDoFogo().carta.folhas)'), /ocorrência A/, 'antes de trocar, o retrato declara-a');
  av('window.confirm = () => true; $("b-nova").onclick();');
  assert.equal(av('FOLHAS.length'), 0);
  assert.doesNotMatch(av('JSON.stringify(retratoDoFogo().carta.folhas)'), /ocorrência A/,
    'o retrato alimenta o PEA, e um PEA que declara a folha de outra ocorrência é uma afirmação falsa num documento aprovado');
});

test('K7-K8 · a colocação viaja no pacote da ocorrência; a imagem não', semAplicacao, () => {
  limpo();
  colocar('CMP 116');
  av('FOLHAS[0].img = "data:image/png;base64,AAAAAAAA";');
  const p = av('JSON.stringify(pacoteOcorrencia())');
  assert.match(p, /CMP 116/, 'a colocação não vai no pacote: exportar e reabrir perde a calibração');
  assert.doesNotMatch(p, /data:image|base64/, 'a imagem entrou no pacote, que viaja como ficheiro de texto');
  assert.equal(JSON.parse(p).folhas[0].ocorrencia, av('O.meta.id'));
});

test('importar um pacote com folhas adota-as para a ocorrência importada, sem imagem', semAplicacao, async () => {
  limpo();
  av('O.meta.num = "2026/0001"; O.meta.local = "Origem"; escreverForm();');
  colocar('CMP 116 · viajou');
  const texto = av('JSON.stringify(pacoteOcorrencia())');
  // Outra ocorrência aberta, com a sua própria folha: a importação não a pode manter.
  limpo();
  av('O.meta.num = "2026/0002"; escreverForm();');
  colocar('CMP 200 · da que estava aberta');
  janela.__texto = texto;
  av('window.confirm = () => true;');
  const r = await av('importarOcorrencia(window.__texto)');
  assert.equal(r, true);
  assert.equal(av('O.meta.num'), '2026/0001');
  assert.equal(av('FOLHAS.length'), 1);
  assert.equal(av('FOLHAS[0].nome'), 'CMP 116 · viajou');
  assert.equal(av('FOLHAS[0].ocorrencia'), av('O.meta.id'), 'a folha adotada fica presa à ocorrência importada');
  assert.equal(av('FOLHAS[0].img'), undefined, 'a imagem volta a escolher-se por quem abre');
  assert.match(av('$("fo-lista").textContent'), /sem imagem nesta sessão/);
  assert.doesNotMatch(av('JSON.stringify(retratoDoFogo().carta.folhas)'), /CMP 200/);
  assert.match(av('O.fita[O.fita.length-1].e + O.fita[O.fita.length-2].e'), /1 folha de carta/);
});

test('importar um pacote sem folhas não deixa ficar as da ocorrência anterior', semAplicacao, async () => {
  limpo();
  av('O.meta.num = "2026/0003"; escreverForm();');
  const texto = av('(()=>{ const p = pacoteOcorrencia(); delete p.folhas; return JSON.stringify(p); })()');
  limpo();
  colocar('CMP 300 · da anterior');
  janela.__texto = texto;
  av('window.confirm = () => true;');
  await av('importarOcorrencia(window.__texto)');
  assert.equal(av('FOLHAS.length'), 0);
});

test('uma folha gravada entre a r0099 e a r0102 reconhece-se pelo número; uma sem nada é órfã e não se atribui', semAplicacao, () => {
  limpo();
  av('O.meta.num = "2026/0009";');
  assert.equal(av('folhaDestaOcorrencia({ num:"2026/0009" })'), true, 'sem identificador, vale o número');
  assert.equal(av('folhaDestaOcorrencia({ num:"2026/0001" })'), false);
  assert.equal(av('folhaDestaOcorrencia({ ocorrencia:"oOUTRA", num:"2026/0009" })'), false, 'com identificador, o número já não decide');
  assert.equal(av('folhaDestaOcorrencia({})'), false, 'uma folha de antes da r0099 não se atribui a ninguém');
  av('FOLHAS_ORFAS = 2; pintarFolhas();');
  assert.match(av('$("fo-lista").textContent'), /2 folhas na base sem ocorrência atribuída/);
});

/* ---- L · o identificador da folha ---- */

test('L1 · duzentos identificadores gerados de seguida são duzentos', semAplicacao, () => {
  assert.equal(av('new Set(Array.from({ length: 200 }, () => novoIdFolha())).size'), 200);
  assert.equal(av('new Set(Array.from({ length: 200 }, () => novoIdOcorrencia())).size'), 200);
  assert.match(av('novoIdFolha()'), /^f[0-9a-z]{12}$/);
});

test('L2 · retirar uma folha não retira outra', semAplicacao, async () => {
  limpo();
  colocar('Folha A'); colocar('Folha B');
  assert.equal(av('FOLHAS.length'), 2);
  await av('retirarFolha(FOLHAS[0].id)');
  assert.equal(av('FOLHAS.length'), 1);
  assert.equal(av('FOLHAS[0].nome'), 'Folha B');
});

test('L3 · o identificador não é derivável do relógio', semAplicacao, () => {
  const r = av('(()=>{ const t = Date.now(); const n = novoIdFolha(); return { n, b36: t.toString(36), b16: t.toString(16) }; })()');
  assert.ok(!r.n.includes(r.b36) && !r.n.includes(r.b16), 'o identificador contém o instante em que foi gerado: ' + r.n);
});
