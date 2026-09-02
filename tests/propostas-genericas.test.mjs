// As propostas genéricas que uma específica substitui, e a identidade das missões.
//
// Duas coisas ficaram por fazer quando as missões se alinharam com as propostas na r0083.
//
// A primeira: as missões continuavam identificadas pela posição — M1, M2, M3 —, que é
// exatamente o defeito que se corrigiu nas propostas e se deixou aqui. Uma missão
// condicional aparece e desaparece conforme o dispositivo, e a M4 do PEA n.º 4 deixava de
// ser a M4 do n.º 5.
//
// A segunda: um plano com sete prioridades em que duas dizem o mesmo por palavras
// diferentes não é mais completo, é mais difícil de executar — e quando a genérica
// contradiz a específica, é pior do que isso.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/* Um teatro com o suficiente para o plano se compor: coordenada, um setor ativo e efetivo. */
function comTeatro() {
  janela.eval('O = novoEstado(); SERIE = []; ANALISE = null');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,0975'; O.meta.lon = '-7,8103'; O.meta.fase = 'III';
  O.dados.est.n = 1;
  O.dados.est.setores = [{ estado: 'Em curso (ativo)', cmd: 'Silva', m: '12', o: '40', tip: [] }];
  return O;
}

const chaves = (p) => p.propostas.map((x) => x.ch);
const chavesM = (p) => p.missoes.map((x) => x.ch);

/* ---- identidade das missões ---- */

test('toda a missão que a aplicação compõe declara a sua chave', semAplicacao, () => {
  comTeatro();
  const d = janela.detDecisao([], null);
  d.missoes.forEach((m) => {
    assert.match(String(m.ch || ''), /^M-[A-Z-]+$/, 'missão sem chave declarada: ' + m.texto);
  });
});

test('a chave da missão não muda quando uma missão condicional aparece', semAplicacao, () => {
  /* É o defeito, em duas linhas. A missão das rendições é a última da lista; basta que os
     meios aéreos entrem no dispositivo para ela mudar de posição. Com chave posicional
     mudava de identidade, e a resposta a «cumprimos aquilo?» apontava para outra coisa. */
  const O = comTeatro();
  const antes = janela.controloMissoes({ missoes: janela.detDecisao([], null).missoes, propostas: [] });
  const kAntes = antes.find((x) => /Rendições faseadas/.test(x.texto)).k;

  O.dados.est.aerL = [{ t: 'HEATA', ind: 'Kilo 01', h: '1400' }];
  const depois = janela.controloMissoes({ missoes: janela.detDecisao([], null).missoes, propostas: [] });
  const kDepois = depois.find((x) => /Rendições faseadas/.test(x.texto)).k;

  assert.ok(depois.length > antes.length, 'a missão aérea tinha de entrar');
  assert.equal(kDepois, kAntes, 'a identidade da missão mudou porque a posição mudou');
  assert.equal(kAntes, 'M-RENDICOES');
});

test('a ordem de apresentação continua posicional, que é como se lê no papel', semAplicacao, () => {
  comTeatro();
  const c = janela.controloMissoes({ missoes: janela.detDecisao([], null).missoes, propostas: [] });
  assert.equal(c[0].ord, 'M1');
  assert.equal(c[1].ord, 'M2');
});

/* ---- o registo das substituições ---- */

test('toda a substituição declara a específica, a genérica e o porquê', semAplicacao, () => {
  /* Sem o porquê auditado, isto seria um sítio onde alguém apaga uma proposta incómoda com
     aparência de método. */
  const S = avaliar(janela, 'SUBSTITUICOES');
  assert.ok(S.length >= 2);
  S.forEach((x) => {
    assert.match(x.gen, /^[A-Z][A-Z0-9-]+$/, 'genérica mal declarada');
    assert.match(x.esp, /^[A-Z][A-Z0-9-]+$/, 'específica mal declarada');
    assert.ok(x.porque && x.porque.length > 80, 'o porquê de ' + x.gen + ' não explica nada');
  });
});

test('nenhuma substituição aponta para uma chave que a aplicação não produz', semAplicacao, () => {
  /* Uma substituição para uma chave inexistente nunca dispara, e ninguém dá por isso: fica
     lá escrita a dar a impressão de que o plano se limpa quando não se limpa. */
  comTeatro();
  const O = avaliar(janela, 'O');
  /* Um cenário largo, para que quase todas as chaves nasçam pelo menos uma vez. */
  O.dados.fogo.r = '3000'; O.dados.fogo.w = '20';
  O.dados.est.setores.push({ estado: 'Reativação', cmd: 'Costa', m: '8', o: '30', tip: [] });
  const d = janela.detDecisao([], null);
  const vivas = new Set(chaves(d).concat(chavesM(d)).concat(d.retiradas.map((x) => x.ch)));
  avaliar(janela, 'SUBSTITUICOES').forEach((x) => {
    assert.ok(vivas.has(x.gen) || vivas.has(x.esp),
      'nem ' + x.gen + ' nem ' + x.esp + ' aparecem em plano nenhum');
  });
});

/* ---- a retirada dispara, e só quando deve ---- */

test('sem a específica, a genérica fica no plano', semAplicacao, () => {
  comTeatro();
  const d = janela.detDecisao([], null);
  assert.ok(chaves(d).includes('DEFENSIVA'), 'a postura defensiva é a base e tem de ficar');
  assert.equal(d.retiradas.length, 0);
});

test('com a cabeça interdita, a postura defensiva genérica sai — e diz que saiu', semAplicacao, () => {
  /* «Postura defensiva fora da janela» diz, por contraste, que dentro da janela a postura
     não é defensiva. Com a cabeça interdita acima dos 4 000 kW/m isso é falso a qualquer
     hora, e a genérica enfraquecia a interdição em vez de a acompanhar. */
  const O = comTeatro();
  O.dados.fogo.r = '3000'; O.dados.fogo.w = '20';   /* 3000·20/2 = 30 000 kW/m */
  const d = janela.detDecisao([], null);
  assert.ok(chaves(d).includes('LIM-INTERDITO'), 'a interdição tinha de disparar');
  assert.ok(!chaves(d).includes('DEFENSIVA'), 'a genérica devia ter saído');
  const r = d.retiradas.find((x) => x.ch === 'DEFENSIVA');
  assert.ok(r, 'saiu sem ficar registada, que é o que não pode acontecer');
  assert.equal(r.esp, 'LIM-INTERDITO');
  assert.match(r.porque, /interdi/i);
});

test('a segurança não perde a regra que a genérica também dizia', semAplicacao, () => {
  /* A segunda metade da genérica — sem ataque direto descendente com vento de drenagem —
     está por extenso na lista de segurança. Se saísse com ela, a retirada tirava uma regra
     de segurança do documento, e isso não se faz por arrumação. */
  const O = comTeatro();
  O.dados.fogo.r = '3000'; O.dados.fogo.w = '20';
  const d = janela.detDecisao([], null);
  assert.ok(d.seguranca.some((x) => /descendente.*catab/i.test(x)),
    'a regra do ataque descendente desapareceu do plano');
});

test('com rendições vencidas, a missão genérica das rendições sai', semAplicacao, () => {
  /* Mandar esperar pelo fecho da janela quando há equipas com o tempo já vencido é mandar
     manter no terreno quem devia ter saído. */
  const O = comTeatro();
  /* `it.ts` é o instante do empenhamento em milissegundos, e não um GDH — a primeira
     versão deste teste inventou-lhe a forma, não produziu rendição nenhuma, e passava por
     ter uma saída antecipada. Vinte e quatro horas atrás excede qualquer limiar. */
  O.dados.est.setores[0].tip = [{ t: 'EMR (CB)', ent: 'BV Moimenta', ts: Date.now() - 24 * 3600000 }];
  const d = janela.detDecisao([], null);
  assert.ok(chaves(d).includes('RENDICAO-VENCIDA'),
    'o cenário tinha de produzir a rendição vencida, ou este teste não prova nada');
  assert.ok(!chavesM(d).includes('M-RENDICOES'), 'a missão genérica devia ter saído');
  const r = d.retiradas.find((x) => x.ch === 'M-RENDICOES');
  assert.ok(r, 'saiu sem ficar registada');
  assert.equal(r.esp, 'RENDICAO-VENCIDA');
  /* E a proposta das vigias larga a cláusula que mandava esperar pelo fecho da janela. */
  const vig = d.propostas.find((x) => x.ch === 'VIGIA');
  assert.doesNotMatch(vig.texto, /rendições no início e fecho da janela/);
});

test('a numeração de apresentação refaz-se depois da retirada, sem buracos', semAplicacao, () => {
  /* Com a renumeração antes da retirada, o papel saltava de P2 para P4 onde a genérica
     esteve — e quem lê fica a pensar que perdeu uma folha. */
  const O = comTeatro();
  O.dados.fogo.r = '3000'; O.dados.fogo.w = '20';
  const d = janela.detDecisao([], null);
  assert.equal(d.propostas.map((p) => p.id).join(','),
    d.propostas.map((_, i) => 'P' + (i + 1)).join(','));
});

/* ---- a missão dos aglomerados ---- */

test('a missão dos aglomerados nomeia-os, e quando não há diz que não há', semAplicacao, () => {
  /* Art. 46.º, n.º 1: o PEA contém ações específicas. Uma ação que manda defender «os
     aglomerados expostos» sem nomear nenhum não identifica coisa nenhuma, e passa por
     cumprida sem nunca o ter sido. */
  const O = comTeatro();
  const semNada = janela.detDecisao([], null).missoes.find((m) => m.ch === 'M-AGLOMERADOS');
  assert.match(semNada.texto, /nenhum está registado/,
    'sem aglomerados registados, a missão tem de o dizer');

  O.dados.sensiveis = 'Paraduça, Leomil';
  const comNomes = janela.detDecisao([], null).missoes.find((m) => m.ch === 'M-AGLOMERADOS');
  assert.match(comNomes.texto, /Paraduça, Leomil/);
  assert.doesNotMatch(comNomes.texto, /nenhum está registado/);
});
