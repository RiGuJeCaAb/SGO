// Os cartões dobráveis, e a regra que os torna seguros.
//
// Um dobrável comum esconde o conteúdo e deixa o título. Nesta aplicação isso seria uma
// regressão de fundo: tudo aqui está construído para dizer o que falta, e quem fechasse um
// cartão deixaria de ver que lá dentro há campos obrigatórios por preencher — e emitiria o
// PEA convencido de que estava completo.
//
// Daí a regra: **o cabeçalho fechado é linha de estado, não título.** O que se verifica aqui
// não é que os cartões dobram. É que dobrar não esconde uma lacuna.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const cartoes = () => [...janela.document.querySelectorAll('.card.dobravel')];
const porTitulo = (h) => cartoes().find((c) => janela.tituloCartao(c) === h) || null;
const estado = (c) => janela.estadoDoCartao(c);
const linha = (c) => {
  const els = [...c.querySelectorAll(':scope > h2 > .cd-cnt')];
  return els.map((e) => e.textContent).join(' ').trim();
};

test('todos os cartões dos painéis vivos dobram, e não só os declarados', semAplicacao, () => {
  const VIVOS = '#p-comando,#p-planeamento,#p-operacoes,#p-logistica,#p-turno';
  const todos = [...janela.document.querySelectorAll('.card')].filter((c) => c.closest(VIVOS));
  const porDobrar = todos
    .filter((c) => !c.classList.contains('dobravel'))
    .map((c) => janela.tituloCartao(c));
  assert.deepEqual(porDobrar, [], 'estes ficaram por dobrar');
  assert.ok(todos.length > 20, `só ${todos.length} cartões: a arrumação por células não correu`);
});

test('não há cartão de exceção: todos dobram', semAplicacao, () => {
  // A exceção que cheguei a fazer — a identificação da ocorrência — não se defendia no
  // ecrã: é o cartão mais alto da aplicação e ocupava o primeiro ecrã inteiro. E era
  // desnecessária: a regra da pendência mantém-no aberto enquanto lhe faltar um
  // obrigatório.
  assert.ok(porTitulo('Identificação da ocorrência'), 'a identificação também dobra');
});

test('nenhum cabeçalho fechado fica mudo', semAplicacao, () => {
  // Um cabeçalho sem estado não distingue «verifiquei e está bem» de «ninguém olhou».
  for (const c of cartoes()) {
    assert.notEqual(linha(c), '', `${janela.tituloCartao(c)} não diz nada quando fechado`);
  }
});

test('um cartão sem nada a assinalar di-lo, em vez de se calar', semAplicacao, () => {
  const c = cartoes().find((x) => estado(x).falta === 0 && estado(x).rec === 0);
  assert.ok(c, 'devia haver pelo menos um cartão sem pendências');
  assert.match(linha(c), /nada a assinalar|registo|sem /);
});

/* ---- a regra que torna isto seguro ---- */

test('um obrigatório em falta aparece no cabeçalho, com o número e por extenso',
  semAplicacao, () => {
    janela.eval('O = novoEstado()');
    janela.document.getElementById('o-num').value = '';
    janela.document.getElementById('o-local').value = '';
    janela.pintarContagens();

    const c = porTitulo('Dados operacionais da ocorrência');
    assert.ok(c, 'o cartão dos dados operacionais tem de existir');
    const e = estado(c);
    assert.ok(e.falta > 0, 'com a área e os setores vazios há obrigatórios em falta');
    assert.match(linha(c), /obrigatóri/, 'e o cabeçalho tem de o dizer por extenso');
    assert.match(linha(c), new RegExp(String(e.falta)), 'com o número');
  });

test('a cor não é o único sinal', semAplicacao, () => {
  // Quem não distingue as duas cores continua a ler «obrigatórios em falta».
  const c = porTitulo('Dados operacionais da ocorrência');
  const el = [...c.querySelectorAll(':scope > h2 > .cd-cnt')].find((x) => x.classList.contains('cd-falta'));
  assert.ok(el, 'a falta tem de estar marcada para a cor');
  assert.match(el.textContent, /obrigatóri/, 'e dita por palavras, não só pintada');
});

test('o cartão com obrigatório em falta abre sozinho', semAplicacao, () => {
  const c = porTitulo('Dados operacionais da ocorrência');
  janela.abrirCartao(c, false);
  janela.pintarContagens();
  assert.ok(c.classList.contains('aberto'), 'a pendência tem de reabrir o cartão');
});

test('fechar um cartão com pendência não fica guardado', semAplicacao, () => {
  // É a regra que impede o utilizador de esconder de si próprio o que a aplicação existe
  // para lhe dizer.
  const c = porTitulo('Dados operacionais da ocorrência');
  const h = janela.tituloCartao(c);
  const antes = JSON.stringify(avaliar(janela, 'DOBRA'));
  c.querySelector(':scope > h2').click();          // tenta fechar
  assert.equal(JSON.stringify(avaliar(janela, 'DOBRA')), antes,
    `a preferência de «${h}» não devia ter sido guardada`);
});

test('sem pendência, fechar fica guardado', semAplicacao, () => {
  const c = cartoes().find((x) => !estado(x).pendente && janela.tituloCartao(x));
  const h = janela.tituloCartao(c);
  janela.abrirCartao(c, true);
  c.querySelector(':scope > h2').click();          // fecha
  assert.equal(avaliar(janela, 'DOBRA')[h], 0, `«${h}» devia ficar guardado como fechado`);
});

test('a preferência de dobra não entra no estado da ocorrência', semAplicacao, () => {
  // Ter um cartão fechado é conveniência de quem está ao teclado, não facto da ocorrência:
  // não tem que viajar na exportação nem na passagem de turno.
  const O = avaliar(janela, 'O');
  assert.equal(JSON.stringify(O).includes('cd-tocado'), false);
  assert.equal(JSON.stringify(O).includes('dobra'), false);
  assert.match(avaliar(janela, 'DOBRA_CHAVE'), /^peaapp:/, 'vive no ARMAZEM, com chave própria');
});

test('o recomendado assinala-se mas não obriga a abrir', semAplicacao, () => {
  // Se o recomendado também obrigasse, tudo ficaria sempre aberto e o mecanismo não
  // serviria para nada — que é o mesmo que não o ter.
  janela.eval('O = novoEstado()');
  ['o-num', 'o-local', 'o-pco', 'o-fase'].forEach((id) => { janela.document.getElementById(id).value = 'x'; });
  janela.document.getElementById('o-fase').value = 'IV';
  janela.pintarContagens();
  const algum = cartoes().find((x) => { const e = estado(x); return e.falta === 0 && e.rec > 0; });
  if (algum) assert.equal(estado(algum).pendente, false, 'recomendado não é pendência que obrigue');
});

test('a contagem que o cartão já trazia não é escrita por cima', semAplicacao, () => {
  // A linha de evolução tem etiqueta própria no cabeçalho. O estado vai ao lado, não em
  // vez dela — senão perde-se a contagem que alguém escreveu de propósito.
  const c = porTitulo('Linha de evolução');
  if (!c) return;
  assert.ok(c.querySelector(':scope > h2 > .cd-cnt-ex'), 'a etiqueta própria tem de sobreviver');
  assert.ok(c.querySelector(':scope > h2 > .cd-est'), 'e o estado vem num elemento ao lado');
});
