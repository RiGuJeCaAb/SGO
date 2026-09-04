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

test('nenhuma função é exigência legal e sugestão ao mesmo tempo', semAplicacao, () => {
  tabela().forEach((x) => {
    assert.ok(!(x.faseLei && x.nucleo), x.f + ' declara faseLei e nucleo — escolher um');
  });
});

test('nenhum núcleo leva número de fase, porque a lei não lho dá', semAplicacao, () => {
  /* A separação da r0084 pôs-lhes a etiqueta certa e deixou-lhes o número errado, e um
     palpite com etiqueta de palpite continua a ordenar um ecrã. O ramo #006 procurou a
     fonte nas três oficiais do projeto e não a encontrou: o Despacho não indexa ativação de
     núcleos a fases; o documento de ferramentas do SGO não tem uma ocorrência da palavra
     «fase»; e a DON n.º 2 remete para «o previsto no SGO para a fase aplicável», que nada
     prevê. Este teste existe para que nenhum número volte a entrar sem uma alínea. */
  tabela().filter((x) => x.nucleo).forEach((x) => {
    assert.equal(x.faseSug, undefined, x.f + ' voltou a levar um número de fase sem fonte');
    assert.equal(x.faseLei, undefined, x.f + ' — se tem norma que o imponha, declara aLei');
  });
});

/* ---- a separação entre o que a lei impõe e o que o posto sugere ---- */

test('os núcleos sem fase na lei não entram nas funções exigíveis, em fase nenhuma', semAplicacao, () => {
  /* Os arts. 23.º a 25.º, 28.º a 30.º e 33.º a 35.º não fixam fase: a ativação dos núcleos
     é competência do oficial da célula «em função da natureza da ocorrência e das
     necessidades» — arts. 16.º, n.º 3, 26.º, n.º 4 e 31.º, n.º 3. Achado do ramo #006. */
  const sugeridos = tabela().filter((x) => x.nucleo).map((x) => x.f);
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
  assert.equal(x.nucleo, undefined);
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

/* ---- a despromoção: a regressão que a separação tornou possível ---- */

test('uma exigência legal despromovida a sugestão sai de funcoesExigiveis, e isso apanha-se', semAplicacao, () => {
  /* Nomeada pelo ramo #006 na v2 do seu guião, e a leitura está certa: a separação
     `faseLei`/`nucleo` resolveu o achado dos nove núcleos e criou uma classe de defeito que
     antes não existia. Uma das sete funções do art. 14.º perder o `faseLei` passa de
     exigência legal a palpite, sai das funções exigíveis e **deixa de alimentar as
     pendências, o briefing, a passagem de turno e a conformidade** — silenciosamente,
     porque nada no ecrã diz que uma obrigação deixou de ser contada.

     O que este teste prende é o efeito e não o campo: é o efeito que magoa. */
  janela.eval('O = novoEstado()');
  avaliar(janela, 'O').meta.fase = 'IV';
  const antes = janela.funcoesExigiveis().map((x) => x.f);
  POR_ARTICULADO.forEach((r) => {
    assert.ok(antes.includes(r.f), r.f + ' devia ser exigível na fase IV — ' + r.a);
  });

  /* Despromovida à mão, o efeito tem de aparecer. */
  janela.eval('__guardado = FUNCOES_PCO.find(x => x.f === "Adjunto de Segurança");'
    + ' __lei = __guardado.faseLei; delete __guardado.faseLei; __guardado.nucleo = true');
  const depois = janela.funcoesExigiveis().map((x) => x.f);
  assert.ok(!depois.includes('Adjunto de Segurança'),
    'a despromoção tinha de a tirar das exigíveis, e o teste não estaria a provar nada');
  janela.eval('delete __guardado.nucleo; __guardado.faseLei = __lei');
  assert.ok(janela.funcoesExigiveis().map((x) => x.f).includes('Adjunto de Segurança'),
    'o estado tem de ficar como estava');
});

test('a alínea gravada aponta para o artigo que sustenta aquele valor, não para outro', semAplicacao, () => {
  /* O teste que já cá estava confere a alínea inteira, letra a letra, contra a verificada —
     que é mais estrito do que confrontar a assinatura artigo/número/alínea. Este confere o
     que falta: que nenhuma outra entrada com `faseLei` cite uma norma que não fale de
     fases. Uma proveniência que aponta para a norma errada é pior do que campo vazio,
     porque parece tê-la. */
  const FASES_QUE_IMPOEM = { 41: 2, 42: 3, 43: 4, 44: 5, 45: 6, 18: 4 };
  tabela().filter((x) => x.faseLei).forEach((x) => {
    const art = /art\.\s*(\d+)\.º/.exec(String(x.aLei || ''));
    assert.ok(art, x.f + ' — aLei ilegível: ' + x.aLei);
    const imposta = FASES_QUE_IMPOEM[Number(art[1])];
    assert.ok(imposta !== undefined,
      x.f + ' cita o art. ' + art[1] + '.º, que não é dos que fixam composição por fase');
    assert.equal(x.faseLei, imposta,
      x.f + ' declara a fase ' + x.faseLei + ' e cita ' + x.aLei + ', que é da fase ' + imposta);
  });
});

/* ---- o gatilho que é doutrina e não é fase ---- */

test('o núcleo de especialistas sugere-se pelo seu gatilho, e não por uma fase', semAplicacao, () => {
  /* DON n.º 2, pontos 7.d.(25)(d) e 7.d.(27): a ativação acompanha o aumento da capacidade
     de comando e controlo. É gatilho doutrinário a sério, e não é uma fase — foi o único
     dos nove a que o ramo #006 encontrou fundamento. Liga-se ao sinal que a regra de
     conformidade já mede: o efetivo a exceder a referência da fase declarada. */
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  /* Fase III, que é quando a célula de planeamento existe — em fase II o argumento do
     aumento da capacidade de comando e controlo não se sustentava, porque o PCO estava
     reduzido à célula de operações. Observação do ramo #004, e é a certa. */
  O.meta.fase = 'III';
  assert.equal(janela.excedeReferenciaDaFase(), false, 'sem dispositivo não há excesso');
  const esp = acha('Núcleo de Especialistas');
  assert.equal(esp.gatilho, 'c2');
  assert.equal(esp.faseSug, undefined, 'o gatilho substitui o número, não o acompanha');
  assert.equal(janela.prioridadeFuncao(esp), 's', 'sem excesso, é proposto pela célula como os irmãos');

  /* Fase III comporta 119 operacionais. Com 300, a referência é excedida. */
  O.dados.est.setores = [{ estado: 'Em curso (ativo)', cmd: '', m: '60', o: '300' }];
  assert.equal(janela.excedeReferenciaDaFase(), true);
  /* Com o gatilho, sobe de sugestão a recomendação: há norma a apontar para ele, o que os
     irmãos não têm. Se ficasse em «s», o campo `gatilho` não distinguiria nada. */
  assert.equal(janela.prioridadeFuncao(esp), 'r', 'o gatilho tem de o fazer pesar mais');
});

test('sem fase declarada não há referência que se possa exceder', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  avaliar(janela, 'O').dados.est.setores = [{ estado: 'Em curso (ativo)', cmd: '', m: '90', o: '400' }];
  assert.equal(janela.excedeReferenciaDaFase(), false);
});

test('cada núcleo espera pela fase em que a sua célula passa a existir', semAplicacao, () => {
  /* A r0087 punha os nove na fase II, com o raciocínio «não há célula antes de haver posto
     de comando» — que pára no posto quando devia parar na célula. O art. 41.º, n.º 2, al. b)
     instala o PCO na fase II **integrando só a célula de operações**; as de planeamento e de
     logística e finanças só entram na III, art. 42.º, n.º 2, al. b). A aplicação sugeria
     nomear o Núcleo de Finanças numa fase em que a célula dele ainda não existe, e cujo
     oficial competente para o ativar ainda não foi nomeado. Apanhado pelo ramo #004. */
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  const F = avaliar(janela, 'FASE_DA_CELULA');
  const nucleos = tabela().filter((x) => x.nucleo && x.gatilho === undefined);
  assert.equal(nucleos.length, 8, 'oito sem gatilho próprio, mais o de especialistas');

  ['I', 'II', 'III'].forEach((fase) => {
    O.meta.fase = fase;
    const ordem = avaliar(janela, 'ORDEM_FASE')[fase];
    nucleos.forEach((x) => {
      const devia = ordem >= F[x.g].fase ? 's' : 'm';
      assert.equal(janela.prioridadeFuncao(x), devia,
        x.f + ' (célula ' + x.g + ', ' + F[x.g].a + ') na fase ' + fase);
    });
  });

  /* E o caso concreto que denuncia o defeito, escrito por extenso. */
  O.meta.fase = 'II';
  assert.equal(janela.prioridadeFuncao(acha('Núcleo de Finanças')), 'm',
    'a célula de logística e finanças não existe na fase II');
  assert.equal(janela.prioridadeFuncao(acha('Núcleo de Segurança')), 's',
    'a célula de operações existe na fase II — art. 41.º, n.º 2, al. b)');
});

test('toda a célula com núcleos declara a fase em que nasce, e a alínea', semAplicacao, () => {
  const F = avaliar(janela, 'FASE_DA_CELULA');
  const grupos = new Set(tabela().filter((x) => x.nucleo).map((x) => x.g));
  grupos.forEach((g) => {
    assert.ok(F[g], 'a célula «' + g + '» tem núcleos e não declara em que fase nasce');
    assert.match(F[g].a, /art\. \d+\.º, n\.º 2, al\. b\)/, g + ' sem alínea');
  });
});
