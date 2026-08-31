// O ambiente de fogo, e o plano que passa a citá-lo.
//
// Havia dois coletores a alimentar o PEA — `retratoOperacional()` para o dispositivo e
// `metricas()` para a meteorologia — e nenhum para o resto. Os painéis do terreno, do
// combustível e do comportamento escreviam no estado, pintavam o seu ecrã, e ninguém os
// juntava: a aplicação calculava que acima dos 4 000 kW/m atacar a cabeça é inconsequente e
// emitia a seguir um plano com fundamento genérico — a mesma frase que sairia para um
// incêndio de 200 kW/m.
//
// O que se verifica aqui não é que o retrato existe: é que **o plano muda quando ele muda**.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/** Uma ocorrência mínima, com o comportamento do fogo que o caso pedir. */
function comFogo({ r, w, est, linhas, frentes, perfil, topo, sensDet, sensiveis } = {}) {
  janela.eval('O = novoEstado(); SERIE = []');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711';
  O.meta.lat = '41,0975'; O.meta.lon = '-7,8103';
  O.dados.area = '120';
  if (r !== undefined) O.dados.fogo.r = r;
  if (w !== undefined) O.dados.fogo.w = w;
  if (est) Object.assign(O.dados.fogo.est, est);
  if (linhas) O.dados.linhas = linhas;
  if (frentes) O.dados.frentes = frentes;
  if (perfil) O.dados.perfil = perfil;
  if (topo) Object.assign(O.dados.topo, topo);
  if (sensDet) O.dados.sensDet = sensDet;
  if (sensiveis !== undefined) O.dados.sensiveis = sensiveis;
  return O;
}

/**
 * As propostas determinísticas.
 *
 * **Os `id` escritos na fonte não sobrevivem**: `detDecisao` renumera tudo para `P1..Pn` no
 * fim. Por isso procura-se pelo texto e pela posição, que é o que chega ao papel — procurar
 * por `PI` daria um teste que passa a dizer que não há proposta quando ela lá está.
 */
function propostas() {
  return janela.detDecisao([], null).propostas || [];
}

/** A primeira proposta cujo texto contenha isto, ou nada. */
function proposta(re) {
  return propostas().find((p) => re.test(p.texto)) || null;
}

/* ---- o retrato ---- */

test('sem dados nenhuns o retrato sai inteiro, com os ramos a nulo', semAplicacao, () => {
  comFogo();
  const f = janela.retratoDoFogo();
  for (const k of ['modelo', 'r', 'w', 'lim', 'perfil', 'topo']) assert.equal(f[k], null, `${k} devia ser nulo`);
  assert.equal(f.frentes.length, 0);
  assert.equal(f.linhas.length, 0);
  assert.equal(f.detetados.total, 0);
});

test('a origem do R lê-se da coincidência com a estimativa, não de uma bandeira', semAplicacao, () => {
  // Uma bandeira pode ficar levantada depois de alguém escrever por cima do número. A
  // coincidência não pode: ou o campo tem o que a estimativa produziu, ou tem outra coisa.
  comFogo({ r: '3192', w: '20', est: { rEst: '3192' } });
  assert.match(janela.retratoDoFogo().r.origem, /estimada pelos guias/);

  comFogo({ r: '900', w: '20', est: { rEst: '3192' } });
  assert.match(janela.retratoDoFogo().r.origem, /observada ou declarada/);
});

test('a vírgula decimal não faz desaparecer o comportamento do fogo', semAplicacao, () => {
  comFogo({ r: '3192,5', w: '19,5' });
  const f = janela.retratoDoFogo();
  assert.ok(f.r && f.w && f.lim, 'Number("19,5") é NaN, e já custou um retrato vazio noutro sítio');
});

test('o salto de declive só se afirma quando é grande, e diz de onde para onde', semAplicacao, () => {
  // A razão entre declives é independente do modelo de combustível: na lei de Rothermel o
  // fator vai com tan²φ e a compacidade do leito cancela. Por isso pode dizer-se sem ele.
  const suave = { rot: '175°', total: 2, e: [200, 210, 220, 230, 240] };
  comFogo({ est: { declive: '20' }, perfil: suave });
  assert.equal(janela.retratoDoFogo().perfil.salto, undefined, 'sem salto não se inventa um');

  const quebra = { rot: '175°', total: 2, e: [200, 205, 210, 215, 560] };
  comFogo({ est: { declive: '10' }, perfil: quebra });
  const p = janela.retratoDoFogo().perfil;
  assert.ok(p.salto, 'uma quebra desta ordem tem de ser assinalada');
  assert.equal(p.salto.deRef, 10);
  assert.ok(p.salto.k >= 3, 'só se afirma a partir de três vezes');
  assert.ok(p.declMaxPc > 50, `declive máximo lido: ${p.declMaxPc} %`);
});

/* ---- o plano ---- */

test('acima dos 4 000 kW/m o plano interdita o ataque à cabeça, com o número lá dentro',
  semAplicacao, () => {
    comFogo({ r: '3192', w: '20', est: { rEst: '3192' } });
    // Uma chamada só: cada `detDecisao` devolve objetos novos, e procurar numa lista o que
    // veio de outra dá sempre -1.
    const P = propostas();
    const pi = P.find((p) => /Interdição de ataque direto à cabeça/.test(p.texto));
    assert.ok(pi, 'tem de haver proposta de limite de manobra');
    assert.equal(P.indexOf(pi), 0, 'a interdição precede a ordem de esforço');
    assert.match(pi.fundamento, /kW\/m/, 'o fundamento tem de trazer o valor');
    assert.match(pi.fundamento, /estimada pelos guias/, 'e a origem da prova');
    assert.match(pi.fundamento, /Alexander 2000/, 'e a fonte');
  });

test('um fogo fraco não recebe a mesma frase que um fogo extremo', semAplicacao, () => {
  // É este o defeito que o coletor veio corrigir: o plano dizia o mesmo aos dois.
  comFogo({ r: '3192', w: '20' });
  const forte = propostas()[0].texto;
  comFogo({ r: '60', w: '4' });
  const fraco = propostas()[0].texto;
  assert.notEqual(forte, fraco);
  assert.match(fraco, /sapador/, 'abaixo dos 500 kW/m o equipamento manual é eficaz');
  assert.match(forte, /Interdição/);
});

test('as quatro classes de intensidade dão quatro propostas diferentes', semAplicacao, () => {
  const textos = new Set();
  for (const [r, w] of [[60, 4], [400, 10], [1200, 18], [3192, 20]]) {
    comFogo({ r: String(r), w: String(w) });
    const pi = propostas()[0];
    assert.ok(pi, `sem proposta para ${r} m/h e ${w} t/ha`);
    assert.match(pi.fundamento, /Alexander 2000/, `a primeira proposta de ${r} m/h devia sair da intensidade`);
    textos.add(pi.texto);
  }
  assert.equal(textos.size, 4, 'cada faixa de intensidade tem a sua manobra');
});

test('sem comportamento do fogo não se inventa proposta nenhuma sobre ele', semAplicacao, () => {
  comFogo();
  for (const re of [/Interdição de ataque/, /Alargar as linhas/, /Suspender a validade/])
    assert.equal(proposta(re), null, `não devia haver proposta ${re}`);
});

test('uma linha estreita de mais para a chama é nomeada, com a largura que lhe falta',
  semAplicacao, () => {
    comFogo({ r: '3192', w: '20',
      linhas: [{ tipo: 'contencao', m: 800, setor: 'Bravo', larguraM: 4 }] });
    const pl = proposta(/Alargar as linhas de contenção/);
    assert.ok(pl, 'uma linha abaixo da largura de contenção tem de ser assinalada');
    assert.match(pl.texto, /setor Bravo/);
    assert.match(pl.fundamento, /uma vez e meia/);
    assert.match(pl.fundamento, /Byram 1959/);
  });

test('uma linha larga que baste não gera queixa', semAplicacao, () => {
  comFogo({ r: '3192', w: '20',
    linhas: [{ tipo: 'contencao', m: 800, setor: 'Bravo', larguraM: 40 }] });
  assert.equal(proposta(/Alargar as linhas de contenção/), null);
});

test('uma linha sem largura declarada pede-se, porque sem ela não se sabe se ancora',
  semAplicacao, () => {
    comFogo({ linhas: [{ tipo: 'contencao', m: 800, setor: 'Alfa', larguraM: null }] });
    const pw = proposta(/Declarar a largura útil/);
    assert.ok(pw);
    assert.match(pw.texto, /setor Alfa/);
  });

test('um rumo deduzido da geometria manda-se confirmar antes de fixar o esforço', semAplicacao, () => {
  comFogo({ frentes: [{ tipo: 'cabeca', m: 900, rumo: 175, rumoFonte: 'sugerido pelo traçado' }] });
  assert.ok(proposta(/Confirmar por observação o rumo/));

  comFogo({ frentes: [{ tipo: 'cabeca', m: 900, rumo: 175, rumoFonte: 'indicado' }] });
  assert.equal(proposta(/Confirmar por observação o rumo/), null, 'um rumo observado não se manda confirmar');
});

test('um sensível detetado e ausente do plano vai a validar com o ERAS', semAplicacao, () => {
  const det = { itens: [{ nome: 'Lar de Vilarinho', tipo: 'social', dist: 800, rumo: 175, sens: true }],
                origem: 'Overpass', g: '', raioKm: 3 };
  comFogo({ sensDet: det, sensiveis: '' });
  const ps = proposta(/Validar com o ERAS/);
  assert.ok(ps);
  assert.match(ps.texto, /Lar de Vilarinho a 800 m/);

  comFogo({ sensDet: det, sensiveis: 'Lar de Vilarinho a 800 m, a sul' });
  assert.equal(proposta(/Validar com o ERAS/), null, 'o que já está no plano não se pede outra vez');
});

/* ---- a segurança ---- */

test('a distância de segurança entra em metros, e não como princípio', semAplicacao, () => {
  comFogo();
  assert.equal(janela.detDecisao([], null).seguranca.some((s) => /Distância mínima/.test(s)), false);

  comFogo({ r: '3192', w: '20' });
  const seg = janela.detDecisao([], null).seguranca;
  const d = seg.find((s) => /Distância mínima/.test(s));
  assert.ok(d, 'com intensidade conhecida a distância tem de ser um número');
  assert.match(d, /\d+ m/);
  assert.match(d, /Butler e Cohen 1998/);
  assert.ok(seg.some((s) => /nenhuma equipa à frente da cabeça/.test(s)));
  assert.ok(seg.some((s) => /faúlhas/.test(s)));
});

/* ---- a análise das ZI, e o contexto do modelo ---- */

test('a análise da zona de intervenção passa a dizer o comportamento do fogo', semAplicacao, () => {
  comFogo({ r: '3192', w: '20', est: { modelo: 'V-MAa' },
            topo: { orient: 'S', declive: 'acentuado' } });
  const texto = janela.detSituacao([], null).analise_zi;
  assert.match(texto, /Combustível: V-MAa/);
  assert.match(texto, /kW\/m de intensidade frontal/);
  assert.match(texto, /Terreno: encostas dominantes a S/);
  assert.match(texto, /ha com pontos sensíveis/, 'e continua a dizer o que já dizia');
});

test('o resumo diz o que falta, em vez de se calar sobre isso', semAplicacao, () => {
  comFogo();
  const s = janela.resumoDoFogo(janela.retratoDoFogo());
  assert.match(s, /Modelo de combustível por identificar/);
  assert.match(s, /Intensidade da frente por determinar/);
  assert.match(s, /Sem previsão carregada/);
  assert.match(s, /Sem cartografia declarada/);
});

test('o ambiente de fogo vai no contexto entregue ao modelo de linguagem', semAplicacao, () => {
  comFogo({ r: '3192', w: '20' });
  const ctx = janela.contexto(1, [], null);
  assert.match(ctx, /AMBIENTE DE FOGO/);
  assert.match(ctx, /nunca recalcules/);
  assert.ok(ctx.includes('"origem"'), 'a origem da prova tem de chegar ao modelo');
});
