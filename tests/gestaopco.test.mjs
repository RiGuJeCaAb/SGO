// Importação da Gestão PCO — esquema v1.1.
// Especificação: docs/CSREPCDouro_202608271715_EspecificacaoExportacaoJSON_CLD.md
// Os exemplos em docs/exemplos/ são os mesmos que a especificação apresenta.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const ler = (n) => readFile(new URL(`../docs/exemplos/${n}`, import.meta.url), 'utf8');
const V11 = await ler('GestaoPCO_v1.1_exemplo.json');
const V10 = await ler('GestaoPCO_v1.0_exemplo.json');
const estado = () => avaliar(janela, 'O');

beforeEach(() => janela && janela.eval('O = novoEstado()'));

const converter = (texto) => janela.converterGestaoPCO(janela.lerPacoteGestaoPCO(texto));

test('a versão é obrigatória e é validada antes do resto', semAplicacao, () => {
  assert.throws(() => janela.lerPacoteGestaoPCO('{"ocorrencia":{}}'), /falta a versão/);
  assert.throws(() => janela.lerPacoteGestaoPCO('{"versao":"9.9","ocorrencia":{}}'), /versão 9\.9/);
  assert.throws(() => janela.lerPacoteGestaoPCO('{"versao":"1.1"}'), /não traz a ocorrência/);
  assert.throws(() => janela.lerPacoteGestaoPCO('não é json'), /não é JSON válido/);
  assert.throws(() => janela.lerPacoteGestaoPCO('[]'), /forma esperada/);
});

test('o exemplo da especificação entra sem um único ponto a confirmar', semAplicacao, () => {
  const c = converter(V11);
  // O array vem do realm do jsdom: compara-se o conteúdo, não a identidade.
  assert.equal(c.avisos.length, 0, c.avisos.join(' | '));
  assert.equal(c.resumo.setores, 2);
  assert.equal(c.resumo.meios, 3);
  assert.equal(c.resumo.aereos, 2);
});

test('a identificação chega aos campos certos', semAplicacao, () => {
  const c = converter(V11);
  assert.equal(c.meta.num, '202608251000');
  assert.equal(c.meta.pco, 'Paraduça');
  assert.equal(c.meta.fase, 'IV');
  assert.equal(c.meta.nivel, 'DELTA');
  assert.equal(c.meta.inicio, '251402AGO26');
  assert.equal(c.meta.lat, '40.9901');
  assert.equal(c.meta.lon, '-7.67835');
});

test('os meios trazem o relógio que sustenta a rendição', semAplicacao, () => {
  const c = converter(V11);
  const gcin = c.est.setores[0].tip[0];
  assert.equal(gcin.t, 'GCIN');
  assert.equal(gcin.q, 1);
  assert.equal(gcin.mu, 7, 'veículos por unidade, como exportado');
  assert.equal(gcin.ou, 26);
  assert.equal(gcin.ts, janela.parseGDH('251430AGO26').getTime());
});

test('os meios aéreos ficam nominais, com hora de entrada', semAplicacao, () => {
  const c = converter(V11);
  assert.equal(c.est.aerL[0].ind, 'KILO 04');
  assert.equal(c.est.aerL[0].t, 'HEBP');
  assert.equal(c.est.aerL[0].ts, janela.parseGDH('251505AGO26').getTime());
});

test('a v1.0 é aceite, com as conversões que a especificação manda', semAplicacao, () => {
  const c = converter(V10);
  const avisos = c.avisos.join(' | ');

  assert.equal(c.est.setores[0].estado, 'Em curso (ativo)', 'Frente ativa convertida');
  assert.equal(c.est.setores[1].estado, 'Em conclusão (extinto)', 'Rescaldo convertido');
  assert.equal(c.est.setores[0].tip[0].t, 'GRIR', 'GRIF convertida');
  assert.match(avisos, /versão 1\.0/);
  assert.match(avisos, /GRIF está descontinuada/);
});

test('o campo fase da v1.0 é aceite como sinónimo de fase_sgo', semAplicacao, () => {
  assert.equal(converter(V10).meta.fase, 'IV');
});

test('uma sigla que exige decisão fica como veio, assinalada', semAplicacao, () => {
  const c = converter(V10);
  assert.equal(c.est.setores[0].tip[1].t, 'MR', 'não se decide pela entidade');
  assert.match(c.avisos.join(' | '), /MR precisa de decisão/);
});

test('meios aéreos em contagem viram entradas anónimas, e diz-se porquê', semAplicacao, () => {
  const c = converter(V10);
  assert.equal(c.est.aerL.length, 3);
  assert.equal(c.est.aerL[0].ind, '');
  assert.equal(c.est.aerL[0].ts, null);
  assert.match(c.avisos.join(' | '), /não há contagem de tempo no TO/);
});

test('sem GDH de início a Estação avisa que fica sem o relógio dos 90 minutos', semAplicacao, () => {
  assert.match(converter(V10).avisos.join(' | '), /transição de ataque inicial para ampliado/);
});

test('divergência face ao catálogo não bloqueia: fica o valor exportado', semAplicacao, () => {
  const c = converter(V10);
  assert.equal(c.est.setores[0].tip[0].mu, 3, 'prevalece o efetivo real no TO');
  assert.match(c.avisos.join(' | '), /catálogo diz/);
});

test('campos desconhecidos são ignorados, sem estorvar', semAplicacao, () => {
  assert.doesNotThrow(() => converter(V10));
});

test('aplicar escreve o dispositivo e não toca no que é da Estação', semAplicacao, () => {
  const O = estado();
  O.evolucao.push({ g: '281200AGO26', tipo: 'posit', t: 'registo anterior' });
  O.peas.push({ n: 1 });
  O.csv = 'série já carregada';

  const { resumo } = janela.aplicarGestaoPCO(V11);

  assert.equal(estado().meta.num, '202608251000');
  assert.equal(estado().dados.est.n, 2);
  assert.equal(estado().dados.est.setores[0].cmd, 'Cmdt CB Moimenta da Beira');
  assert.equal(estado().dados.est.aerL.length, 2);
  assert.equal(estado().dados.est.res.m, '1');
  assert.match(estado().dados.sensiveis, /Leomil/);
  assert.equal(resumo.setores, 2);

  assert.equal(estado().evolucao.length, 1, 'a evolução é da Estação');
  assert.equal(estado().peas.length, 1, 'os PEA são da Estação');
  assert.equal(estado().csv, 'série já carregada', 'o meteograma é da Estação');
});

test('a importação deixa registo na fita do tempo', semAplicacao, () => {
  janela.aplicarGestaoPCO(V11);
  assert.match(estado().fita.at(-1).e, /Dispositivo importado da Gestão PCO/);
});

test('um pacote recusado não mexe no dispositivo', semAplicacao, () => {
  const O = estado();
  O.dados.est.n = 4;
  assert.throws(() => janela.aplicarGestaoPCO('{"versao":"9.9","ocorrencia":{}}'));
  assert.equal(estado().dados.est.n, 4);
});
