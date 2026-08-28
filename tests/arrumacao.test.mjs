// A interface organizada por célula do posto de comando.
//
// Veio da linhagem paralela no p0007, com a sua bateria (t0007). Está aqui porque um
// teste que não corre em `npm run tudo` não protege nada.
//
// Até aqui os separadores seguiam o fluxo de trabalho — a ordem por que o operador
// preenche, não a ordem por que o posto de comando se organiza. Quem estava na célula
// de logística tinha o plano de comunicações num separador, o ponto de trânsito noutro
// e as rendições num terceiro. Passa a haver um separador por célula.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));
const doc = () => janela.document;
const cartoesDe = (pane) => [...doc().querySelectorAll('#' + pane + ' .card h2')]
  .map((h) => h.firstChild.textContent.trim());

test('há um separador por célula, e um para a passagem de turno', semAplicacao, () => {
  const abas = [...doc().querySelectorAll('nav [data-p]')].map((b) => b.dataset.p);
  assert.deepEqual(abas, ['p-comando', 'p-planeamento', 'p-operacoes', 'p-logistica', 'p-turno']);
});

test('nenhum cartão fica sem célula, e nenhum registo aponta para cartão inexistente',
  semAplicacao, () => {
    const a = daqui(janela.auditarArrumacao());
    assert.deepEqual(a.semCelula, [], 'cartões fora de célula');
    assert.deepEqual(a.semCartao, [], 'células declaradas para cartão que não existe');
    assert.deepEqual(a.semNorma, [], 'cartões sem a norma que os coloca ali');
    assert.ok(a.cartoes > 20, 'só ' + a.cartoes + ' cartões');
  });

test('um título que mude sem o registo acompanhar é apanhado', semAplicacao, () => {
  // A chave é o texto do título. Renomear um cartão sem tocar no registo deixá-lo-ia
  // sem célula — e um cartão que ninguém encontra é o defeito que isto impede.
  const h = doc().querySelector('#p-logistica .card h2');
  const antes = h.firstChild.textContent;
  h.firstChild.textContent = 'Título que ninguém declarou';
  const a = daqui(janela.auditarArrumacao());
  assert.ok(a.semCartao.length > 0, 'o registo continuou a encontrar o cartão renomeado');
  h.firstChild.textContent = antes;
  assert.deepEqual(daqui(janela.auditarArrumacao()).semCartao, []);
});

test('a auditoria da arrumação acende o mesmo aviso que a posse', semAplicacao, () => {
  // `auditarArrumacao` existia e não era chamada por ninguém: declarava-se defeito
  // visível e não se via em lado nenhum. Corrigido na r0039.
  janela.renderTurno();
  const av = doc().getElementById('tn-orfaos');
  assert.equal(av.style.display, 'none');

  const h = doc().querySelector('#p-operacoes .card h2');
  const antes = h.firstChild.textContent;
  h.firstChild.textContent = 'Cartão sem registo';
  janela.renderQuadroTurno();
  assert.equal(av.style.display, 'block', 'a arrumação partida não acendeu o aviso');
  assert.match(av.textContent, /cartão/i);

  h.firstChild.textContent = antes;
  janela.renderQuadroTurno();
  assert.equal(av.style.display, 'none');
});

/* ---- cada matéria na sala da célula a quem a lei a atribui ---- */

test('a matéria de cada célula está no separador da célula', semAplicacao, () => {
  const casos = [
    ['p-comando', /identificação/i],
    ['p-planeamento', /meteoro/i],
    ['p-operacoes', /dispositivo|setoriza/i],
    ['p-logistica', /comunicaç/i],
  ];
  casos.forEach(([pane, padrao]) => {
    const titulos = cartoesDe(pane).join(' | ');
    assert.match(titulos, padrao, pane + ': ' + titulos);
  });
});

test('o plano de comunicações está em Logística, e a fita do tempo em Operações',
  semAplicacao, () => {
    // Art. 32.º, n.º 1, al. d) e art. 17.º, n.º 1, al. g). Eram os dois casos em que a
    // ordem por fluxo de trabalho contrariava a repartição legal.
    const log = cartoesDe('p-logistica').join(' | ');
    const ops = cartoesDe('p-operacoes').join(' | ');
    assert.match(log, /comunicaç/i, log);
    assert.match(ops, /fita do tempo/i, ops);
    assert.doesNotMatch(cartoesDe('p-planeamento').join(' | '), /fita do tempo/i);
  });

/* ---- os identificadores antigos continuam a funcionar ---- */

test('irPara com identificador antigo abre a célula certa', semAplicacao, () => {
  // Quarenta e tal referências espalhadas pelo código e pelos botões `data-ir` não
  // mudaram uma linha: resolvem por tabela de correspondência.
  const antigos = Object.keys(daqui(avaliar(janela, 'ATALHOS_PANE')));
  assert.ok(antigos.length >= 4, 'a tabela de correspondência está vazia');
  antigos.forEach((antigo) => {
    assert.doesNotThrow(() => janela.irPara(antigo), antigo);
    const ativo = doc().querySelector('nav button.on');
    assert.ok(ativo && ativo.dataset.p.startsWith('p-'), antigo + ' não abriu separador nenhum');
  });
});

test('irPara com identificador novo continua a funcionar, e um desconhecido não rebenta',
  semAplicacao, () => {
    janela.irPara('p-logistica');
    assert.equal(doc().querySelector('nav button.on').dataset.p, 'p-logistica');
    assert.doesNotThrow(() => janela.irPara('p-inexistente'));
  });

test('os painéis antigos ficaram vazios e fora da vista', semAplicacao, () => {
  Object.keys(daqui(avaliar(janela, 'ATALHOS_PANE'))).forEach((id) => {
    const p = doc().getElementById(id);
    if (p) assert.ok(p.classList.contains('husk'), id + ' continua à vista');
  });
});

/* ---- mover os nós não pode partir o que estava ligado ---- */

test('os controlos continuam a responder depois de mudados de painel', semAplicacao, () => {
  // Mover um nó preserva os ouvintes; recriá-lo não. É a regressão que este projeto
  // já teve, com botões a perder listeners e a falhar em silêncio dentro de um `try`.
  const sel = doc().getElementById('s-n');
  assert.ok(sel.closest('#p-operacoes'), 'a setorização não está em Operações');
  sel.value = '2';
  sel.dispatchEvent(new janela.Event('change'));
  assert.equal(janela.estObj().n, 2, 'o seletor de setores deixou de responder');
});

test('o botão de emitir o PEA seguiu para Planeamento e continua ligado',
  semAplicacao, async () => {
    const b = doc().getElementById('b-gerar');
    assert.ok(b.closest('#p-planeamento'), 'o botão de emissão não está em Planeamento');

    // Não basta existir: tem de continuar a responder depois de mudado de painel. Um
    // nó movido preserva os ouvintes; um nó recriado perde-os, e a falha é silenciosa.
    janela.eval('O = novoEstado()');
    const msg = doc().getElementById('msg-ia');
    msg.textContent = '';
    b.dispatchEvent(new janela.Event('click'));
    await new Promise((r) => setTimeout(r, 50));
    assert.ok(msg.textContent.trim(), 'o clique não produziu resposta nenhuma');
  });
