// Fases de exigibilidade das funções do posto de comando — art. 14.º, n.º 1.
//
// Portado do `t01` do ramo #006, que correu vermelho contra a r0083 com cinco divergências
// e as alíneas do articulado a sustentar cada uma. O guião original fica em
// `ferramentas/historico/`, como prova de proveniência do achado; isto é o que impede a
// regressão.
//
// **O Despacho n.º 4067/2024 não está em `docs/fontes/`** e não foi possível obtê-lo do
// ambiente onde esta revisão foi construída. As alíneas abaixo são as que o ramo #006
// transcreveu literalmente, e é assim que estão citadas — como leitura verificada por
// terceiro, não como leitura feita aqui.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/* A fase em que o articulado torna exigível cada função do art. 14.º, n.º 1, com a alínea
   que a sustenta. Sem exceção: uma linha sem proveniência não entra nesta tabela. */
const POR_ARTICULADO = [
  { f: 'Oficial de Operações', fase: 2, a: 'art. 41.º, n.º 2, al. b)' },
  { f: 'Adjunto de Segurança', fase: 2, a: 'art. 41.º, n.º 2, al. b)' },
  { f: 'Oficial de Planeamento', fase: 3, a: 'art. 42.º, n.º 2, al. b)' },
  { f: 'Oficial de Logística e Finanças', fase: 3, a: 'art. 42.º, n.º 2, al. b)' },
  { f: 'Adjunto de Ligação', fase: 3, a: 'art. 42.º, n.º 2, al. b)' },
  { f: 'Adjunto de Relações Públicas', fase: 4, a: 'art. 43.º, n.º 2, al. b)' },
  { f: 'Coordenador do PCO', fase: 4, a: 'art. 43.º, n.º 2, al. b)' },
];

const tabela = () => avaliar(janela, 'FUNCOES_PCO');
const acha = (f) => tabela().find((x) => x.f === f);

test('as sete funções do art. 14.º são exigíveis na fase que o articulado fixa', semAplicacao, () => {
  POR_ARTICULADO.forEach((r) => {
    const x = acha(r.f);
    assert.ok(x, 'função ausente de FUNCOES_PCO: ' + r.f);
    assert.equal(x.faseLei, r.fase, r.f + ' — ' + r.a);
    assert.equal(x.aLei, r.a, r.f + ' — a alínea tem de acompanhar o número');
  });
});

test('as duas que erravam no sentido perigoso são as que este teste existe para prender', semAplicacao, () => {
  /* O código pedia o adjunto de segurança só na fase III e o de ligação só na IV. Numa
     fase II a Estação não assinalava a falta de quem tem a autoridade do art. 36.º, n.º 2
     para mandar cessar os trabalhos — art. 41.º, n.º 2, al. b). */
  assert.equal(acha('Adjunto de Segurança').faseLei, 2, 'art. 41.º, n.º 2, al. b)');
  assert.equal(acha('Adjunto de Ligação').faseLei, 3, 'art. 42.º, n.º 2, al. b)');
});

test('toda a fase declarada como legal traz a alínea que a impõe', semAplicacao, () => {
  /* É o que impede um número de reentrar sem fonte. Um `faseLei` sem `aLei` é exatamente
     a forma do defeito que se corrigiu. */
  tabela().filter((x) => x.faseLei).forEach((x) => {
    assert.match(String(x.aLei || ''), /art\. \d+\.º/, x.f + ' declara faseLei sem alínea');
  });
});

test('nenhuma função tem as duas fases ao mesmo tempo', semAplicacao, () => {
  tabela().forEach((x) => {
    assert.ok(!(x.faseLei && x.faseSug), x.f + ' declara faseLei e faseSug — escolher uma');
  });
});

/* ---- a separação entre o que a lei impõe e o que o posto sugere ---- */

test('os núcleos sem fase na lei não entram nas funções exigíveis, em fase nenhuma', semAplicacao, () => {
  /* Os arts. 23.º a 25.º, 28.º a 30.º e 33.º a 35.º não fixam fase: a ativação dos núcleos
     é competência do oficial da célula «em função da natureza da ocorrência e das
     necessidades» — arts. 16.º, n.º 3, 26.º, n.º 4 e 31.º, n.º 3. Achado do ramo #006. */
  const sugeridos = tabela().filter((x) => x.faseSug).map((x) => x.f);
  assert.equal(sugeridos.length, 9, 'nove núcleos sem imposição legal de fase');
  ['II', 'III', 'IV', 'V', 'VI'].forEach((fase) => {
    janela.eval('O = novoEstado()');
    avaliar(janela, 'O').meta.fase = fase;
    const exig = janela.funcoesExigiveis().map((x) => x.f);
    sugeridos.forEach((f) => {
      assert.ok(!exig.includes(f), f + ' aparece como exigível na fase ' + fase + ' sem norma que o imponha');
    });
  });
});

test('o núcleo de monitorização e controlo é o único com fase na lei, e mantém-na', semAplicacao, () => {
  /* Art. 18.º, n.º 1 — obrigatório na fase IV ou superior. É a única entrada de núcleo cujo
     campo de referência dizia mesmo o que a norma diz. */
  const x = acha('Núcleo de Monitorização e Controlo');
  assert.equal(x.faseLei, 4);
  assert.equal(x.faseSug, undefined);
  janela.eval('O = novoEstado()');
  avaliar(janela, 'O').meta.fase = 'IV';
  assert.ok(janela.funcoesExigiveis().some((y) => y.f === x.f));
});

test('uma sugestão nunca sobe a essencial, por muitos meios que estejam no terreno', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.fase = 'VI';
  const x = acha('Núcleo de Antecipação');
  assert.equal(janela.prioridadeFuncao(x), 's');
});

test('o motivo de uma função exigível cita a norma que a exige', semAplicacao, () => {
  /* Sai no briefing de passagem de comando como «X — exigível por Y». Sem a alínea, o Y
     era «fase III do SGO» e não se sabia qual norma. */
  janela.eval('O = novoEstado()');
  avaliar(janela, 'O').meta.fase = 'III';
  const m = janela.funcoesExigiveis().find((x) => x.f === 'Adjunto de Ligação').motivo;
  assert.match(m, /art\. 42\.º, n\.º 2, al\. b\)/);
});

/* ---- os limiares de meios ---- */

test('só os dois limiares que o Despacho fixa tornam uma função exigível', semAplicacao, () => {
  /* Art. 20.º, n.os 6 e 7 fixam números: mais de duas aeronaves pede COPAR-T, quatro ou
     mais acrescem COPAR-A. Os arts. 19.º, 21.º e 22.º regulam a quem se reporta e não
     fixam limiar nenhum — os números que a aplicação usa para OPAR, COPESP e OPESP são
     leitura do posto, por analogia, e saem em «sugerida». */
  const comLei = tabela().filter((x) => x.condLei).map((x) => x.f).sort();
  assert.equal(comLei.join(' | '),
    'COPAR-A — Coordenador a bordo | COPAR-T — Coordenador em terra');
});

test('meios especiais em quantidade não fazem uma função passar por exigida por lei', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.fase = 'III';
  /* Cinco EMR do catálogo, uma máquina de rasto cada: `contarDispositivo` lê `mr` da
     tipologia, não de um campo escrito à mão. Uma entrada, uma unidade. */
  O.dados.est.setores = [{ estado: 'Em curso (ativo)', cmd: '',
    tip: [{ t: 'EMR (CB)' }, { t: 'EMR (CB)' }, { t: 'EMR (CB)' }, { t: 'EMR (ICNF)' }, { t: 'EMR (FEPC)' }] }];
  assert.equal(janela.contarDispositivo().mr, 5, 'o dispositivo do teste tem de chegar ao limiar antigo');
  const exig = janela.funcoesExigiveis().map((x) => x.f).join(' | ');
  assert.ok(!/OPESP|COPESP/.test(exig), 'um limiar por analogia não é uma exigência legal');
  /* E continua a ser proposto, na prateleira certa: retirar da lei não é esconder. */
  assert.equal(janela.prioridadeFuncao(acha('OPESP — Oficial de Operações de Meios Especiais')), 's');
});
