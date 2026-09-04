// O sentido do erro: o que não se consegue avaliar não conta como feito.
//
// A auditoria externa de 4 de setembro apontou `pendencias()` como P0, e tinha razão:
// quatro das catorze pendências avaliavam-se dentro de um `try{ ... }catch(e){ return
// true; }`. Uma exceção — em `funcoesExigiveis()`, em `canaisObj()`, em
// `evoDesdeUltimoPEA()` — marcava a pendência como **satisfeita**. A guia dizia «está
// feito» exatamente no momento em que não conseguia saber se estava, e o PEA saía sem o
// obrigatório que ninguém verificou.
//
// O mesmo vale para a aprovação: a chamada às ordens de missão estava num `catch` vazio e
// o ecrã dizia sempre «ordens produzidas e em controlo de execução», tivesse havido
// ordens ou não.
//
// Estes testes partem as funções de propósito, e exigem o sentido certo do erro.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);

/** Corre `fn` com `nome` substituída por uma função que rebenta, e repõe-na no fim. */
function comFuncaoPartida(nome, fn) {
  const guardado = av(`window.__g = ${nome}; "guardado"`);
  assert.equal(guardado, 'guardado');
  av(`${nome} = function(){ throw new Error("rebentei de propósito"); }`);
  try {
    return fn();
  } finally {
    av(`${nome} = window.__g; delete window.__g;`);
  }
}

test('uma pendência que não se consegue avaliar conta como por cumprir', semAplicacao, () => {
  // Com a função inteira, a pendência da estrutura do PCO avalia-se sem erro.
  const antes = av('pendencias().find(x=>x.el==="pc-f")');
  assert.equal(antes.erro, '', 'sem nada partido não devia haver motivo de erro');

  const depois = comFuncaoPartida('funcoesExigiveis', () =>
    av('JSON.parse(JSON.stringify(pendencias().find(x=>x.el==="pc-f")))'),
  );
  assert.equal(depois.ok, false, 'uma verificação rebentada não pode dar a pendência por cumprida');
  assert.match(depois.erro, /rebentei de propósito/, 'o motivo tem de viajar com a pendência');
  assert.equal(depois.ob, true, 'continua a ser obrigatória');
});

// Escolhem-se pelo rótulo e não pelo elemento: duas pendências partilham `br-gerar` —
// o canal de comando e os canais de manobra por setor — e só a primeira passa por
// `canaisObj`. Filtrar pelo elemento apanhava as duas e acusava a que estava certa.
test('as quatro pendências calculadas falham todas fechadas', semAplicacao, () => {
  const casos = [
    ['funcoesExigiveis', 'Estrutura do PCO — funções exigíveis nomeadas'],
    ['canaisObj', 'Plano de comunicações — canal de comando'],
    ['estObj', 'Canais de manobra por setor'],
    ['evoDesdeUltimoPEA', 'Evolução registada desde o último PEA'],
  ];
  // A pendência da evolução é `O.peas.length===0 || evoDesdeUltimoPEA()...`: sem nenhum
  // PEA a condição resolve-se antes de chamar a função e não há nada que possa rebentar.
  // Sem esta proposta o teste passava sem exercitar nada — e teria sido esse o defeito.
  av('O.peas = [{ n:1, estado:"proposta", evoIdx:0 }];');
  for (const [fn, rotulo] of casos) {
    const r = comFuncaoPartida(fn, () =>
      av(`JSON.parse(JSON.stringify(pendencias().find(x=>x.c===${JSON.stringify(rotulo)})))`),
    );
    assert.equal(r.ok, false, `${fn} partida deixou «${rotulo}» a dizer que está feita`);
    assert.match(r.erro, /rebentei de propósito/, `«${rotulo}» perdeu o motivo pelo caminho`);
  }
  av('O.peas = [];');
});

test('o PEA não sai com uma verificação obrigatória rebentada', semAplicacao, () => {
  const bloqueia = comFuncaoPartida('funcoesExigiveis', () =>
    av('pendencias().filter(x=>!x.ok&&x.ob).length'),
  );
  assert.ok(bloqueia > 0, 'a pendência rebentada tem de entrar na lista que impede a emissão');
});

test('a lista de verificação distingue «em falta» de «por verificar»', semAplicacao, () => {
  const texto = comFuncaoPartida('funcoesExigiveis', () => {
    av('renderCheck()');
    return av('$("chk-list").textContent');
  });
  assert.match(texto, /POR VERIFICAR/, 'o estado tem de aparecer no ecrã');
  assert.match(texto, /não foi possível verificar/, 'e o motivo com ele');
});

test('a aprovação sem ordens de missão fica registada no plano, e não escondida', semAplicacao, async () => {
  // Uma proposta mínima, aprovada, com a produção de ordens condenada a falhar.
  av(`
    O.peas = [{ n:1, estado:"aprovado", g:"041800SET26", json:{pea:{}}, met:{}, serie:[],
                dados:{}, meta:{num:"T"}, evoIdx:0 }];
    window.__peaT = O.peas[0];
  `);
  const r = await comFuncaoPartida('gerarOrdens', async () =>
    comFuncaoPartida('detCompleto', async () => {
      const p = av('produzirOrdensDoAprovado(window.__peaT)');
      return await p;
    }),
  );
  assert.equal(r.ok, false, 'com as duas vias partidas não pode haver ordens');
  assert.match(r.motivo, /rebentei de propósito/);
  assert.equal(av('!!window.__peaT.semOrdens'), true, 'a falta tem de ficar marcada no plano');
  assert.equal(av('window.__peaT.ctrl.length'), 0, 'e o controlo de execução tem de ficar vazio');
  assert.match(
    av('O.evolucao[O.evolucao.length-1].txt'),
    /sem ordens de missão/,
    'e tem de entrar no registo de evolução, que é o que acompanha a ocorrência',
  );
  av('delete window.__peaT; O.peas = []; O.evolucao = [];');
});

test('a marca de «sem ordens» desaparece quando as ordens saem', semAplicacao, async () => {
  av(`
    O.peas = [{ n:1, estado:"aprovado", g:"041800SET26", json:{pea:{}}, met:{}, serie:[],
                dados:{}, meta:{num:"T"}, evoIdx:0, semOrdens:{g:"041800SET26", motivo:"antes"} }];
    window.__peaT = O.peas[0];
  `);
  const r = await av('produzirOrdensDoAprovado(window.__peaT)');
  assert.equal(r.ok, true, 'a via determinística tem de produzir ordens');
  assert.equal(av('!!window.__peaT.semOrdens'), false, 'a marca tem de ser levantada');
  av('delete window.__peaT; O.peas = []; O.evolucao = [];');
});
