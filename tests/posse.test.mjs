// Posse do estado por célula, e passagem de turno.
//
// Vieram da linhagem paralela nos patches p0003 e p0005, com a sua própria bateria
// (t0005). Estão aqui porque um teste que não corre em `npm run tudo` não protege
// nada: a partir da r0034 correm com os outros.
//
// A regra que isto fixa é uma só, e é a que impede a posse de voltar a diluir-se:
// cada ramo do estado tem exatamente um dono, e o dono é a célula a quem a lei
// atribui a matéria. Um ramo novo sem célula parte a verificação.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

// Os objetos vêm do outro realm (jsdom): um Array de lá não é um Array daqui, e
// `deepEqual` recusa-os por prototipo. Copiam-se para esta banda antes de comparar.
const daqui = (x) => JSON.parse(JSON.stringify(x));
const POSSE = () => daqui(avaliar(janela, 'POSSE'));
const estado = () => avaliar(janela, 'O');

beforeEach(() => {
  if (!janela) return;
  janela.eval('O = novoEstado()');
});

/* ---- o registo cobre o estado inteiro ---- */

test('as cinco linhas de posse estão declaradas', semAplicacao, () => {
  const chaves = POSSE().map((x) => x.k);
  assert.equal(chaves.length, 5);
  ['comando', 'planeamento', 'operacoes', 'logistica', 'infra']
    .forEach((k) => assert.ok(chaves.includes(k), 'falta ' + k));
});

test('nenhum ramo do estado fica sem célula, e nenhum tem dois donos', semAplicacao, () => {
  const a = daqui(janela.auditarPosse(janela.novoEstado()));
  assert.deepEqual(a.orfaos, [], 'ramos órfãos');
  assert.deepEqual(a.duplicados, [], 'ramos com dois donos');
  assert.ok(a.folhas > 50, 'só ' + a.folhas + ' folhas percorridas');
});

test('um ramo novo sem célula parte a verificação', semAplicacao, () => {
  const e = janela.novoEstado();
  e.inventado = { campo: '' };
  assert.deepEqual(daqui(janela.auditarPosse(e).orfaos), ['inventado.campo']);
});

test('cada ramo declara a matéria e a norma que sustenta a posse', semAplicacao, () => {
  const sem = POSSE().filter((c) => c.k !== 'infra')
    .flatMap((c) => c.ramos.filter((r) => !r.r || !r.d).map((r) => c.k + ':' + r.p));
  assert.deepEqual(sem, [], 'ramos sem base legal ou sem matéria');
  const mau = POSSE().filter((c) => c.k !== 'infra')
    .flatMap((c) => c.ramos.filter((r) => !/art\./.test(r.r)).map((r) => r.p));
  assert.deepEqual(mau, [], 'bases legais sem citação de artigo');
});

/* ---- a repartição segue a lei ---- */

test('a repartição põe cada matéria na célula a quem a lei a atribui', semAplicacao, () => {
  const casos = [
    ['peas', 'planeamento', /27\.º/],            // plano estratégico de ação
    ['csv', 'planeamento', /29\.º/],             // núcleo de antecipação
    ['fita', 'operacoes', /17\.º/],              // registo temporal
    ['dados.est.aerL', 'operacoes', /19\.º/],    // meios aéreos
    ['pco.canais', 'logistica', /32\.º/],        // plano de comunicações
    ['pco.funcoes', 'comando', /14\.º/],         // nomeações
  ];
  casos.forEach(([caminho, celula, norma]) => {
    const d = janela.donoDoRamo(caminho);
    assert.equal(d.celula, celula, caminho);
    assert.match(d.ramo.r, norma, caminho);
  });
});

test('a conflação de dados.est está resolvida no próprio estado', semAplicacao, () => {
  // O achado que o mapa expôs, e que a versão 5 do estado corrigiu: `dados.est`
  // reclamava ser o dispositivo e guardava lá dentro a reserva e a zona de apoio,
  // que são áreas da ZCR e portanto matéria de Logística — art. 32.º, n.º 1, al. b).
  // Enquanto partilhavam objeto com os setores, uma escrita em bloco atravessava a
  // fronteira sem se ver.
  assert.equal(janela.donoDoRamo('dados.est.setores').celula, 'operacoes');
  assert.equal(janela.donoDoRamo('logistica.reserva').celula, 'logistica');
  assert.equal(janela.donoDoRamo('logistica.zonaApoio').celula, 'logistica');
  assert.equal(janela.donoDoRamo('logistica.pontoTransito').celula, 'logistica');

  const est = Object.keys(JSON.parse(JSON.stringify(janela.novoEstado().dados.est)));
  assert.ok(!est.includes('res') && !est.includes('za'),
    'a reserva e a zona de apoio ainda estão dentro do dispositivo: ' + est.join(', '));
});

test('o prefixo mais longo vence, e um sub-ramo não herda do irmão', semAplicacao, () => {
  assert.equal(janela.donoDoRamo('logistica.reserva.m').celula, 'logistica');
  assert.equal(janela.donoDoRamo('dados.est.setores').celula, 'operacoes');
  assert.equal(janela.donoDoRamo('dados.area').celula, 'planeamento');
});

/* ---- exportação por célula ---- */

test('o instantâneo traz só o que a célula possui', semAplicacao, () => {
  const O = estado();
  O.csv = 'linha'; O.fita.push({ g: '281200AGO26', e: 'x' });
  O.pco.canais.cmd = 'PC COM 1';
  O.logistica.reserva = { m: '3', o: '12' };

  const chaves = (k) => Object.keys(janela.instantaneoCelula(k));
  const pl = chaves('planeamento'), op = chaves('operacoes'), lg = chaves('logistica');
  assert.ok(pl.includes('csv') && !pl.includes('fita'), pl.join(', '));
  assert.ok(op.includes('fita') && !op.includes('logistica.reserva'), op.join(', '));
  assert.ok(lg.includes('pco.canais') && lg.includes('logistica.reserva'), lg.join(', '));
});

test('o pacote da célula declara a base legal e a matéria de cada ramo', semAplicacao, () => {
  estado().meta.num = '2026080123';
  const p = daqui(janela.pacoteCelula('logistica'));
  assert.equal(p.tipo, 'peaapp:celula');
  assert.equal(p.celula, 'logistica');
  assert.equal(p.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.equal(p.ocorrencia.num, '2026080123');
  assert.ok(p.posse.every((x) => x.caminho && x.base && x.materia), JSON.stringify(p.posse[0]));
});

test('o pacote é uma cópia: mexer nele não toca no estado', semAplicacao, () => {
  estado().dados.est.setores = [{ estado: 'Em curso (ativo)' }];
  const p = janela.pacoteCelula('operacoes');
  p.ramos['dados.est.setores'][0].estado = 'ALTERADO';
  assert.equal(estado().dados.est.setores[0].estado, 'Em curso (ativo)');
});

test('as células juntas cobrem o estado sem sobreposição', semAplicacao, () => {
  const todos = POSSE().flatMap((c) => c.ramos.map((x) => x.p));
  assert.equal(todos.length, new Set(todos).size, 'há caminhos repetidos entre células');
});

test('exportar uma célula desconhecida não rebenta', semAplicacao, () => {
  assert.doesNotThrow(() => janela.exportarCelula('inexistente'));
  assert.throws(() => janela.pacoteCelula('inexistente'), /célula desconhecida/);
});

/* ---- quadro de posse no separador de turno ---- */

test('cada célula mostra os ramos que possui e tem botão de exportação', semAplicacao, () => {
  janela.renderTurno();
  const q = janela.document.getElementById('tn-quadro');
  const blocos = [...q.querySelectorAll('.tn-posse')];
  assert.equal(blocos.length, 4);
  blocos.forEach((b) => assert.ok(b.querySelectorAll('.tn-ramo').length >= 3, b.textContent.slice(0, 60)));

  const bs = [...q.querySelectorAll('[data-expcel]')];
  assert.deepEqual(bs.map((b) => b.dataset.expcel).sort(),
    ['comando', 'logistica', 'operacoes', 'planeamento']);
  assert.match(q.querySelector('.tn-ramo').title, /art\./, 'o ramo não traz a norma no título');
});

test('o aviso de posse acende com um ramo órfão e apaga-se quando ele sai', semAplicacao, () => {
  janela.renderTurno();
  const av = janela.document.getElementById('tn-orfaos');
  assert.equal(av.style.display, 'none', 'acendeu sem haver órfãos');

  estado().inventado = { campo: 'x' };
  janela.renderQuadroTurno();
  assert.equal(av.style.display, 'block');
  assert.match(av.textContent, /inventado\.campo/);

  delete estado().inventado;
  janela.renderQuadroTurno();
  assert.equal(av.style.display, 'none');
});
