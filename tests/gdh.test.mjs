// Robustecimento — o tempo, que é o que governa quase tudo nesta aplicação.
//
// A análise clínica externa mostrou que `parseGDH` aceitava datas impossíveis: o
// construtor `Date` normaliza-as em silêncio, e o `isNaN` que lá estava achava tudo bem.
// `311000FEV26` entrava e ficava registado como 3 de março às 10h00. Os tempos alimentam
// as rendições, os noventa minutos do ataque ampliado, a validade do PEA, a passagem de
// turno e a sequência documental — um erro de dedo convertido noutra data válida é pior
// do que uma recusa.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const doc = () => janela.document;
const estado = () => avaliar(janela, 'O');

test('o GDH válido continua a ser lido como sempre', semAplicacao, () => {
  const d = janela.parseGDH('281200AGO26');
  assert.equal(d.getDate(), 28);
  assert.equal(d.getMonth(), 7);
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getHours(), 12);
  assert.equal(d.getMinutes(), 0);
  // e o 29 de fevereiro de um ano bissexto é data a sério
  assert.ok(janela.parseGDH('291000FEV24'), '2024 é bissexto');
});

test('as datas impossíveis são recusadas, não convertidas', semAplicacao, () => {
  // Os cinco casos da análise, mais os das pontas.
  const maus = {
    '311000FEV26': 'fevereiro não tem 31 dias',
    '321000JAN26': 'não há dia 32',
    '292400FEV26': 'não há hora 24',
    '291000FEV25': '2025 não é bissexto',
    '301000FEV26': 'fevereiro não tem 30 dias',
    '311000ABR26': 'abril não tem 31 dias',
    '001200AGO26': 'não há dia zero',
    '281260AGO26': 'não há minuto 60',
    '281200XXX26': 'mês que não existe',
    'ABCD': 'nem sequer tem forma de GDH',
    '281200AGO2026': 'ano com quatro dígitos',
  };
  Object.keys(maus).forEach((g) => assert.equal(janela.parseGDH(g), null,
    `«${g}» devia ser recusado: ${maus[g]}`));
});

test('cada recusa diz porquê, em português', semAplicacao, () => {
  assert.equal(janela.motivoGDH(''), '', 'o campo vazio não é erro');
  assert.equal(janela.motivoGDH('281200AGO26'), '');
  assert.match(janela.motivoGDH('311000FEV26'), /FEV de 2026 não tem dia 31/);
  assert.match(janela.motivoGDH('321000JAN26'), /Dia 32 não existe/);
  assert.match(janela.motivoGDH('292400FEV26'), /Hora 24 não existe/);
  assert.match(janela.motivoGDH('281260AGO26'), /Minuto 60 não existe/);
  assert.match(janela.motivoGDH('281200XXX26'), /Mês desconhecido/);
  assert.match(janela.motivoGDH('ABCD'), /Formato de GDH/);
});

/* ---- as portas de entrada ---- */

/** Escreve num campo e devolve o que o guarda decidiu. */
function porta(id, valor) {
  doc().getElementById(id).value = valor;
  return janela.gdhDoCampo(id, 'msg-occ');
}

test('o guarda dos campos recusa, marca o campo e não inventa', semAplicacao, () => {
  const mau = porta('e-gdh', '311000FEV26');
  assert.equal(mau.ok, false);
  assert.equal(mau.g, '', 'não pode devolver um GDH quando recusa');
  assert.equal(doc().getElementById('e-gdh').getAttribute('aria-invalid'), 'true');

  const bom = porta('e-gdh', '281200AGO26');
  assert.equal(bom.ok, true);
  assert.equal(bom.g, '281200AGO26');
  assert.equal(doc().getElementById('e-gdh').getAttribute('aria-invalid'), null);

  // vazio significa «agora», que é o que os campos prometem no marcador
  const vazio = porta('e-gdh', '');
  assert.equal(vazio.ok, true);
  assert.ok(janela.parseGDH(vazio.g), 'o «agora» tem de ser ele próprio um GDH válido');
});

test('a evolução deixa de aceitar qualquer coisa como GDH', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  janela.escreverForm();
  doc().getElementById('e-txt').value = 'frente dominada no setor Alfa';
  doc().getElementById('e-gdh').value = 'ABCD';
  janela.addEvo();
  assert.equal(estado().evolucao.length, 0, '«ABCD» entrou na evolução como GDH');
  assert.equal(doc().getElementById('e-txt').value, 'frente dominada no setor Alfa',
    'o texto do oficial não se pode perder quando o GDH é recusado');

  doc().getElementById('e-gdh').value = '281200AGO26';
  janela.addEvo();
  assert.equal(estado().evolucao.length, 1);
  assert.equal(estado().evolucao[0].g, '281200AGO26');
});

test('o meio aéreo com GDH impossível não entra no TO', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  janela.escreverForm();
  doc().getElementById('aer-g').value = '311000FEV26';
  doc().getElementById('aer-i').value = 'MEIO 01';
  doc().getElementById('aer-add').dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.equal(janela.aerLista().length, 0, 'entrou com uma data que não existe');

  doc().getElementById('aer-g').value = '281200AGO26';
  doc().getElementById('aer-add').dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.equal(janela.aerLista().length, 1);
  assert.equal(janela.aerLista()[0].g, '281200AGO26');
  assert.equal(janela.aerLista()[0].ts, janela.parseGDH('281200AGO26').getTime(),
    'o instante tem de sair do GDH que se escreveu, não do relógio');
});

test('a nomeação com GDH impossível não se regista', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  janela.escreverForm();
  const antes = janela.pcoObj().funcoes.length;
  doc().getElementById('pc-n').value = 'Cmdt Silva';
  doc().getElementById('pc-g').value = '321000JAN26';
  doc().getElementById('pc-add').dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.equal(janela.pcoObj().funcoes.length, antes, 'nomeação registada com data impossível');

  doc().getElementById('pc-g').value = '281200AGO26';
  doc().getElementById('pc-add').dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.equal(janela.pcoObj().funcoes.length, antes + 1);
});

test('a passagem de turno com GDH impossível não fecha', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  janela.escreverForm();
  const t = janela.turnoObj();
  t.equipa = 'Equipa A';
  doc().getElementById('tn-eq2').value = 'Equipa B';
  doc().getElementById('tn-g').value = '292400FEV26';
  janela.fecharTurno();
  assert.equal(t.entregas.length, 0, 'a passagem fechou com uma hora que não existe');

  doc().getElementById('tn-g').value = '281200AGO26';
  janela.fecharTurno();
  assert.equal(t.entregas.length, 1);
  assert.equal(t.entregas[0].g, '281200AGO26');
});

test('o campo assinala-se enquanto se escreve, sem esperar pelo botão', semAplicacao, () => {
  const el = doc().getElementById('o-inicio');
  el.value = '311000FEV26';
  el.dispatchEvent(new janela.Event('input', { bubbles: true }));
  assert.equal(el.getAttribute('aria-invalid'), 'true');
  assert.match(el.getAttribute('title'), /não tem dia 31/);

  el.value = '281200AGO26';
  el.dispatchEvent(new janela.Event('input', { bubbles: true }));
  assert.equal(el.getAttribute('aria-invalid'), null);
  assert.equal(el.getAttribute('title'), null);
});
