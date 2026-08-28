// Correção 4.2 — o formulário escreve no estado, em vez de o reconstruir.
// O defeito que isto remove: `lerForm` refazia O.meta de raiz e obrigava a
// preservar à mão os campos sem campo no formulário. Bastava esquecer um.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar, excecoesDeArranque } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const estado = () => avaliar(janela, 'O');
const campo = (id) => janela.document.getElementById(id);

function escrever(id, valor) {
  const el = campo(id);
  el.value = valor;
  el.dispatchEvent(new janela.Event('input', { bubbles: true }));
}

test('a aplicação arranca sem exceções', semAplicacao, () => {
  assert.deepEqual(excecoesDeArranque, []);
});

test('todos os campos do formulário declaram o seu caminho', semAplicacao, () => {
  const esperados = [
    'o-num', 'o-local', 'o-pco', 'o-fase', 'o-lat', 'o-lon', 'o-pasta', 'o-inicio',
    'o-nivel', 'd-area', 'd-sensiveis', 'pt-des', 'pt-resp', 'pt-ct', 'pt-cd',
    'pt-obs', 't-orient', 't-declive', 't-obs',
  ];
  for (const id of esperados) {
    assert.ok(campo(id), `campo ${id} não existe`);
    assert.ok(campo(id).dataset.campo, `campo ${id} sem data-campo`);
  }
});

test('escrever no campo escreve no estado, sem gravar', semAplicacao, () => {
  escrever('o-num', ' 2026/4711 ');
  escrever('o-local', 'Moimenta da Beira');
  assert.equal(estado().meta.num, '2026/4711', 'valor aparado');
  assert.equal(estado().meta.local, 'Moimenta da Beira');
});

test('os caminhos aninhados chegam ao ramo certo', semAplicacao, () => {
  escrever('pt-resp', 'Adjunto de operações');
  escrever('t-obs', 'Linha de água a norte');
  assert.equal(estado().logistica.pontoTransito.resp, 'Adjunto de operações');
  assert.equal(estado().dados.topo.obs, 'Linha de água a norte');
});

test('os campos derivados sobrevivem à leitura do formulário', semAplicacao, () => {
  // É este o defeito que a correção remove. Antes, lerForm refazia O.meta e só
  // não perdia estes três porque estavam escritos à mão dentro dela.
  const O = estado();
  O.meta.distrito = 'Viseu';
  O.meta.concelho = 'Moimenta da Beira';
  O.meta.distritoChave = '41.0,-7.6';

  janela.lerForm();

  assert.equal(estado().meta.distrito, 'Viseu');
  assert.equal(estado().meta.concelho, 'Moimenta da Beira');
  assert.equal(estado().meta.distritoChave, '41.0,-7.6');
});

test('um campo derivado novo sobrevive sem ninguém se lembrar dele', semAplicacao, () => {
  // O ponto da correção: acrescentar um campo derivado deixou de exigir cuidado
  // dentro de lerForm. Nada passa por ele, logo nada o apaga.
  estado().meta.freguesiaDerivada = 'Leomil';
  janela.lerForm();
  assert.equal(estado().meta.freguesiaDerivada, 'Leomil');
});

test('lerForm continua a recolher tudo o que está no formulário', semAplicacao, () => {
  campo('o-pco').value = 'Sernancelhe';
  campo('d-area').value = ' 340 ';
  janela.lerForm();
  assert.equal(estado().meta.pco, 'Sernancelhe');
  assert.equal(estado().dados.area, '340');
});

test('escreverCaminho cria os ramos em falta', semAplicacao, () => {
  const alvo = {};
  janela.escreverCaminho(alvo, 'a.b.c', 'valor');
  assert.equal(alvo.a.b.c, 'valor');
});

test('os setores em texto livre só contam com o modo livre ligado', semAplicacao, () => {
  const O = estado();
  O.dados.est.livre = false;
  O.dados.setores = 'lista estruturada manda';
  campo('d-setores').value = 'texto livre ignorado';
  janela.lerForm();
  assert.equal(estado().dados.setores, 'lista estruturada manda');

  O.dados.est.livre = true;
  janela.lerForm();
  assert.equal(estado().dados.setores, 'texto livre ignorado');
});
