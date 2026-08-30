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

/* ---- a ajuda no ecrã ---- */

test('há um bloco de ajuda por separador, e todos são alcançáveis', semAplicacao, () => {
  // Até à r0040 estavam nos painéis antigos, que a arrumação marca com `husk` —
  // `display:none !important`. Sete dos oito ficaram lá presos, e o botão de ajuda
  // passou a alternar uma classe que já não mostrava nada. Nada rebentava.
  const VIVOS = '#p-comando,#p-planeamento,#p-operacoes,#p-logistica,#p-turno';
  const blocos = [...doc().querySelectorAll('.help')];
  assert.equal(blocos.length, 5);
  assert.deepEqual(blocos.map((b) => b.getAttribute('data-ajuda')),
    ['comando', 'planeamento', 'operacoes', 'logistica', 'turno']);
  blocos.forEach((b) => assert.ok(b.closest(VIVOS),
    'ajuda fora de célula, e portanto invisível: ' + b.getAttribute('data-ajuda')));
});

test('o botão de ajuda alterna a classe que mostra os blocos', semAplicacao, async () => {
  const raiz = doc().documentElement;
  await janela.alternarAjuda(true);
  assert.ok(raiz.classList.contains('ajuda'));
  assert.equal(doc().getElementById('b-ajuda').textContent, 'Ocultar');

  await janela.alternarAjuda(false);
  assert.ok(!raiz.classList.contains('ajuda'));
  assert.equal(doc().getElementById('b-ajuda').textContent, 'Ajuda');
  await janela.alternarAjuda(true);
});

test('uma ajuda que fique fora de célula é acusada pela auditoria', semAplicacao, () => {
  const b = doc().querySelector('.help[data-ajuda="logistica"]');
  const pai = b.parentNode;
  doc().getElementById('p-occ').appendChild(b);          // o painel antigo, escondido
  const a = daqui(janela.auditarArrumacao());
  assert.deepEqual(a.ajudaForaDeCelula, ['logistica']);
  pai.insertBefore(b, pai.firstChild);
  assert.deepEqual(daqui(janela.auditarArrumacao()).ajudaForaDeCelula, []);
});

test('um separador sem bloco de ajuda é acusado pela auditoria', semAplicacao, () => {
  const b = doc().querySelector('.help[data-ajuda="operacoes"]');
  const pai = b.parentNode, seguinte = b.nextSibling;
  b.remove();
  assert.deepEqual(daqui(janela.auditarArrumacao()).ajudaEmFalta, ['operacoes']);
  pai.insertBefore(b, seguinte);
  assert.deepEqual(daqui(janela.auditarArrumacao()).ajudaEmFalta, []);
});

test('a ajuda por célula fala da célula, e não da numeração que já não existe',
  semAplicacao, () => {
    const texto = [...doc().querySelectorAll('.help')].map((b) => b.textContent).join(' ');
    assert.doesNotMatch(texto, /[Ss]ec[çc][ãa]o\s+\d/,
      'a ajuda ainda remete para a numeração de secções anterior à arrumação por célula');
  });

/* ---- legibilidade dos campos e dos avisos ---- */

test('um rótulo comprido não desalinha o campo dos vizinhos', semAplicacao, () => {
  // O rótulo do GDH da solicitação leva o nome da entidade nomeadora. Com a designação
  // da lei por inteiro — «força de segurança territorialmente competente» — quebrava em
  // duas linhas e empurrava o campo para baixo do dos vizinhos na mesma linha da grelha.
  const sel = doc().getElementById('pc-f');
  sel.value = 'Núcleo de Segurança';
  sel.dispatchEvent(new janela.Event('change', { bubbles: true }));

  const lab = doc().querySelector('label[for="pc-sol"]');
  assert.match(lab.textContent, /GDH da solicitação a força de segurança$/, lab.textContent);
  assert.match(lab.title, /territorialmente competente/,
    'a designação da lei tem de sobreviver algures — abrevia-se o rótulo, não a norma');
});

test('cada nível de aviso tem peso visual próprio', semAplicacao, () => {
  // Uma obrigação legal em incumprimento não pode ler-se igual a uma conformidade
  // verificada. A distinção faz-se por barra, fundo e relevo — sem ícones.
  // O CSS chega serializado pelo motor; compara-se sem depender de espaços.
  const css = [...janela.document.styleSheets[0].cssRules]
    .map((r) => r.cssText).join(' ').replace(/\s+/g, '');
  assert.match(css, /\.avd-b\.ob\{[^}]*border-left-width:7px/, 'a obrigação não tem barra própria');
  assert.match(css, /\.avd-b\.av\{[^}]*border-left-width:5px/, 'a antecipação não tem barra própria');
  assert.match(css, /\.avd-b\.ob[^{]*\{[^}]*box-shadow:[^};]+;/, 'a obrigação não tem relevo');
  // a etiqueta do nível é bloco cheio nas que exigem ação, e texto na que é só registo
  assert.match(css, /\.avd-b\.ob\.avd-n\{background:var\(--fogo\)/);
  assert.match(css, /\.avd-b\.av\.avd-n\{background:var\(--terra\)/);
  assert.match(css, /\.avd-b\.ok\.avd-n\{color:var\(--madeira\)/);
});

/* ---- o que veio da linhagem paralela: p0010 a p0013 ---- */

test('nenhum texto manda o utilizador a uma secção numerada que já não existe', semAplicacao, () => {
  // A arrumação por células acabou com o fluxo numerado, e ficaram 47 rótulos a dizer
  // «define os setores na secção 2». As referências que restam são ao documento do
  // contrato de interoperação, que tem secções numeradas a sério.
  const html = doc().documentElement.innerHTML;
  const orfas = [...html.matchAll(/sec(?:ç|c)(?:ão|ões)\s*(?:n\.?º\s*)?\d+/gi)]
    .map((m) => html.slice(Math.max(0, m.index - 90), m.index + m[0].length + 30))
    .filter((ctx) => !/contrato|esboço/i.test(ctx));
  assert.deepEqual(orfas, [], 'rótulos a apontar para secções que já não existem');
});

test('a ajuda é dobrável e abre fechada', semAplicacao, () => {
  // Cada painel abria com quinhentas palavras antes do primeiro campo. O bloco continua
  // lá, e o título também: o que se paga a pedido é o corpo.
  const ajudas = [...doc().querySelectorAll('.help')];
  assert.ok(ajudas.length >= 5, 'só ' + ajudas.length + ' blocos de ajuda');
  ajudas.forEach((h) => {
    const b = h.querySelector(':scope > .hb');
    assert.ok(b, 'bloco de ajuda sem título dobrável');
    assert.equal(b.getAttribute('aria-expanded'), 'false', 'a ajuda abre aberta: o muro volta');
    assert.ok(b.textContent.trim(), 'o título tem de se ver mesmo fechado');
    assert.ok(h.querySelector(':scope > .hc'), 'o corpo não foi para o contentor dobrável');
  });

  const um = ajudas[0];
  um.querySelector(':scope > .hb').dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.ok(um.classList.contains('aberta'));
  assert.equal(um.querySelector(':scope > .hb').getAttribute('aria-expanded'), 'true');
  assert.equal(ajudas[1].classList.contains('aberta'), false, 'abriu mais do que aquele em que se carregou');
  janela.abrirAjuda(um, false);
});

test('há um só quadro de rendições', semAplicacao, () => {
  // Viviam em painéis diferentes e recebiam ambos o mesmo ciclo; a arrumação por células
  // juntou-os na mesma sala e a repetição ficou à vista.
  assert.equal(doc().querySelectorAll('#amp-quadro, #amp-quadro-2').length, 1);
});

test('o catálogo de elementos corrige em vez de obrigar a apagar', semAplicacao, () => {
  // Apagar é destrutivo onde bastava corrigir: um posto mudado ou um erro de escrita
  // obrigavam a apagar e reescrever o registo todo.
  janela.eval('ELEMENTOS = [{id:"x1", nome:"Silva", entidade:"CB Lamego", ct:"912345678", funcao:"", nota:"", g:""}]');
  janela.pintarElementos('');
  const b = doc().querySelector('[data-el-editar="x1"]');
  assert.ok(b, 'a lista não oferece corrigir');

  b.dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.equal(doc().getElementById('el-nome').value, 'Silva', 'o registo não voltou ao formulário');
  assert.equal(doc().getElementById('el-ct').value, '912345678');
  assert.equal(avaliar(janela, 'EL_EDICAO'), 'x1',
    'sem fixar o identificador, mudar o nome criava um segundo elemento em vez de corrigir o primeiro');
  assert.equal(doc().getElementById('el-cancelar').style.display, '');

  janela.sairDaEdicaoElemento();
  assert.equal(avaliar(janela, 'EL_EDICAO'), '');
  janela.eval('ELEMENTOS = []');
});

/* ---- léxico do registo de evolução ---- */

test('o léxico cobre os oito grupos, e cada frase declara o tipo', semAplicacao, () => {
  const grupos = [...doc().querySelectorAll('#evo-frases .fr-g')]
    .map((g) => g.querySelector('.fr-l').textContent.trim());
  assert.deepEqual(grupos,
    ['Combate', 'Propagação', 'Perímetro', 'Meios', 'Segurança', 'População', 'Comando', 'Danos']);

  const frases = [...doc().querySelectorAll('#evo-frases [data-fr]')];
  assert.ok(frases.length >= 70, 'só ' + frases.length + ' frases');
  const tipos = [...doc().querySelectorAll('#e-tipo option')].map((o) => o.value);
  frases.forEach((b) => {
    assert.ok(b.getAttribute('data-fr').trim(), 'frase vazia: ' + b.textContent);
    assert.ok(tipos.includes(b.getAttribute('data-tp')),
      `«${b.textContent}» classifica-se como «${b.getAttribute('data-tp')}», que não é um dos tipos`);
  });
});

test('cada grupo do léxico traz pelo menos vinte frases', semAplicacao, () => {
  // Vinte por grupo foi o pedido do Ricardo: um léxico que chegue para escrever a
  // ocorrência sem sair para o teclado. O chão é aqui; o teto não existe.
  const magros = [...doc().querySelectorAll('#evo-frases .fr-g')]
    .map((g) => [g.querySelector('.fr-l').textContent.trim(), g.querySelectorAll('[data-fr]').length])
    .filter(([, n]) => n < 20);
  assert.deepEqual(magros, [], 'grupos abaixo de vinte frases: ' + JSON.stringify(magros));
});

test('dentro do grupo, as frases estão arrumadas por cor', semAplicacao, () => {
  // A cor da aresta é o tipo. Arrumadas por ela, e sempre pela mesma ordem em todos os
  // grupos, a vista salta para o bloco certo em vez de ler frase a frase.
  const ordem = avaliar(janela, 'ORDEM_TIPO');
  assert.deepEqual([...ordem], ['agravamento', 'melhoria', 'meios', 'decisao', 'posit']);

  [...doc().querySelectorAll('#evo-frases .fr-g')].forEach((g) => {
    const nome = g.querySelector('.fr-l').textContent.trim();
    const botoes = [...g.querySelectorAll('[data-fr]')];
    const minis = botoes.filter((b) => b.classList.contains('mini'));
    // as sequências ficam à cabeça, inteiras
    assert.deepEqual(botoes.slice(0, minis.length), minis,
      `em ${nome} as miniaturas não estão à cabeça do grupo`);

    const graus = botoes.slice(minis.length)
      .map((b) => [...ordem].indexOf(b.getAttribute('data-tp')));
    graus.forEach((n, i) => assert.ok(i === 0 || graus[i - 1] <= n,
      `em ${nome} a frase «${botoes[minis.length + i].textContent}» está fora da ordem das cores`));
  });
});

test('a escala do perímetro e a rosa dos ventos não se desmancham', semAplicacao, () => {
  // São sequências: 10, 25, 50, 75, 90, 100; N, NE, E, SE, S, SO, O, NO. Arrumá-las por
  // cor punha o 75 antes do 10, que é pior do que o mosaico que se queria resolver.
  const mini = (grupo) => [...doc().querySelectorAll('#evo-frases .fr-g')]
    .find((g) => g.querySelector('.fr-l').textContent.trim() === grupo)
    .querySelectorAll('.fr.mini');
  assert.deepEqual([...mini('Perímetro')].map((b) => b.textContent),
    ['10 %', '25 %', '50 %', '75 %', '90 %', '100 %']);
  assert.deepEqual([...mini('Propagação')].map((b) => b.textContent),
    ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']);
});

test('as teclas do léxico têm o relevo das teclas de canal', semAplicacao, () => {
  // A tridimensionalidade não é enfeite: uma tecla que se vê saliente diz que se carrega,
  // e crava-se ao ser carregada. É a mesma mecânica das teclas de canal — e o mesmo CSS.
  const css = [...janela.document.styleSheets[0].cssRules]
    .map((r) => r.cssText).join(' ').replace(/\s+/g, '');
  assert.match(css, /\.fr\{[^}]*box-shadow:var\(--rel\)/, 'a tecla do léxico não tem relevo');
  assert.match(css, /\.fr:active\{[^}]*box-shadow:var\(--afund\)/, 'a tecla não afunda ao ser premida');
  assert.match(css, /\.atc\{[^}]*box-shadow:var\(--rel\)/, 'a tecla de canal perdeu o relevo');
});

test('nenhuma frase se repete', semAplicacao, () => {
  const fr = [...doc().querySelectorAll('#evo-frases [data-fr]')].map((b) => b.getAttribute('data-fr'));
  const rep = fr.filter((x, i) => fr.indexOf(x) !== i);
  assert.deepEqual(rep, []);
});

test('o léxico mostra um grupo de cada vez, com a barra composta dos próprios grupos', semAplicacao, () => {
  const barra = [...doc().querySelectorAll('#fr-grupos [data-g]')];
  const grupos = [...doc().querySelectorAll('#evo-frases .fr-g')];
  assert.equal(barra.length, grupos.length, 'um separador por grupo');
  assert.match(barra[0].textContent, /^Combate/);
  // A contagem na barra é a do grupo, não um número escrito à mão.
  barra.forEach((b, i) => assert.equal(b.querySelector('.n').textContent,
    String(grupos[i].querySelectorAll('[data-fr]').length)));

  assert.equal(grupos[0].hidden, false, 'o primeiro grupo está à vista');
  assert.ok(grupos.slice(1).every((g) => g.hidden === true), 'os outros estão recolhidos');

  barra[3].dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.equal(grupos[3].hidden, false);
  assert.equal(grupos[0].hidden, true);
  assert.ok(barra[3].classList.contains('on'));
  barra[0].dispatchEvent(new janela.Event('click', { bubbles: true }));
});

test('a procura corta os grupos todos e diz quando não encontra', semAplicacao, () => {
  const q = doc().getElementById('fr-q');
  const grupos = [...doc().querySelectorAll('#evo-frases .fr-g')];
  const escrever = (v) => { q.value = v; q.dispatchEvent(new janela.Event('input', { bubbles: true })); };

  escrever('rendição');
  const vistas = [...doc().querySelectorAll('#evo-frases [data-fr]')].filter((b) => !b.hidden);
  assert.ok(vistas.length >= 2, 'a procura devia achar as frases de rendição');
  assert.ok(vistas.every((b) => /rendição/i.test(b.textContent + b.getAttribute('data-fr'))));
  // Achou fora do grupo à vista: a procura é transversal.
  assert.ok(grupos.some((g, i) => i !== 0 && !g.hidden));
  assert.ok(doc().getElementById('evo-frases').classList.contains('q'),
    'a procurar, o rótulo do grupo volta a aparecer');

  escrever('zzz não existe');
  assert.equal(doc().getElementById('fr-vazio').style.display, 'block');

  escrever('');
  assert.equal(grupos[0].hidden, false);
  assert.equal(doc().getElementById('fr-vazio').style.display, 'none');
  assert.ok([...doc().querySelectorAll('#evo-frases [data-fr]')].every((b) => !b.hidden));
});

test('uma frase do léxico entra na descrição e classifica o registo', semAplicacao, () => {
  const ta = doc().getElementById('e-txt');
  ta.value = '';
  doc().querySelector('[data-fr="POSIT transmitido ao CSREPC"]')
    .dispatchEvent(new janela.Event('click', { bubbles: true }));
  assert.match(ta.value, /POSIT transmitido ao CSREPC/);
  assert.equal(doc().getElementById('e-tipo').value, 'posit');
});
