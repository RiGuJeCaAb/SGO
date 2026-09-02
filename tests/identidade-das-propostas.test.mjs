// A identidade das propostas, através das revisões de um PEA.
//
// O `detDecisao` renumera as propostas por posição no fim: `id:"P"+(i+1)`. O controlo de
// execução usava esse número como chave, e por isso **P3 no PEA n.º 4 não era a mesma
// proposta que P3 no n.º 5**. Bastava uma proposta cair entre planos — a reserva
// constitui-se, a linha estreita é alargada — para tudo o que estava por baixo subir uma
// posição, e «cumprimos a P2» deixava de ter significado estável num documento que é
// aprovado, executado e auditado.
//
// Era inofensivo enquanto as propostas eram genéricas. Deixou de ser quando passaram a
// depender de dados que mudam de hora a hora.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/** Uma ocorrência com o comportamento do fogo que o caso pedir. */
function cenario({ r, w, linhas, meios } = {}) {
  janela.eval('O = novoEstado(); SERIE = []');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711';
  O.dados.area = '120';
  if (r !== undefined) O.dados.fogo.r = r;
  if (w !== undefined) O.dados.fogo.w = w;
  if (linhas) O.dados.linhas = linhas;
  const e = janela.estObj();
  e.n = 1;
  e.setores = [{ estado: 'Em curso (ativo)', cmd: '', ct: '', adj: '', m: String(meios || 0), o: '', tip: [] }];
  return O;
}

const controlo = () => janela.controloMissoes(janela.detDecisao([], null));
const chaves = () => controlo().filter((x) => x.tipo === 'Proposta').map((x) => x.k);

/* ---- as chaves ---- */

test('toda a proposta determinística declara chave estável', semAplicacao, () => {
  cenario({ r: '3192', w: '20', linhas: [{ tipo: 'contencao', m: 800, setor: 'Bravo', larguraM: 4 }] });
  const props = janela.detDecisao([], null).propostas;
  for (const p of props) {
    assert.ok(p.ch, `proposta sem chave: ${p.texto.slice(0, 50)}`);
    assert.match(p.ch, /^[A-Z-]+$/, `chave mal formada: ${p.ch}`);
  }
});

test('duas propostas nunca partilham chave no mesmo plano', semAplicacao, () => {
  cenario({ r: '3192', w: '20', meios: 12,
    linhas: [{ tipo: 'contencao', m: 800, setor: 'Bravo', larguraM: 4 },
             { tipo: 'apoio', m: 500, setor: 'Alfa', larguraM: null }] });
  const ks = chaves();
  assert.equal(new Set(ks).size, ks.length, `chaves repetidas: ${ks.join(', ')}`);
});

test('as quatro faixas de intensidade levam chaves distintas', semAplicacao, () => {
  // São instruções opostas — «interditar o ataque à cabeça» e «ataque direto admissível».
  // Partilhar chave faria uma aparecer como cumprida quando a outra nunca foi dada.
  // I = R·w/2. Os valores têm de cair mesmo em cada faixa: 120, 1 200, 3 000 e 31 920 kW/m.
  const vistas = new Set();
  for (const [r, w] of [[60, 4], [300, 8], [600, 10], [3192, 20]]) {
    cenario({ r: String(r), w: String(w) });
    const lim = janela.detDecisao([], null).propostas.find((p) => /^LIM-/.test(p.ch || ''));
    assert.ok(lim, `sem proposta de limite para ${r} m/h`);
    vistas.add(lim.ch);
  }
  assert.equal(vistas.size, 4, `as quatro faixas deviam dar quatro chaves: ${[...vistas]}`);
});

/* ---- a identidade sobrevive à renumeração ---- */

test('uma proposta que cai entre planos não desloca a identidade das outras',
  semAplicacao, () => {
    // É o caso concreto do defeito: a linha estreita é alargada entre o PEA n.º 4 e o n.º 5,
    // e tudo o que estava por baixo dela sobe uma posição.
    cenario({ r: '3192', w: '20',
      linhas: [{ tipo: 'contencao', m: 800, setor: 'Bravo', larguraM: 4 }] });
    const antes = controlo().filter((x) => x.tipo === 'Proposta');
    assert.ok(antes.some((x) => x.k === 'LINHA-ESTREITA'), 'a linha estreita tem de aparecer');

    cenario({ r: '3192', w: '20',
      linhas: [{ tipo: 'contencao', m: 800, setor: 'Bravo', larguraM: 40 }] });
    const depois = controlo().filter((x) => x.tipo === 'Proposta');
    assert.ok(!depois.some((x) => x.k === 'LINHA-ESTREITA'), 'e desaparecer quando é alargada');

    // A identidade das que ficaram não mudou, embora o número no papel tenha mudado.
    const comuns = antes.filter((a) => depois.some((d) => d.k === a.k));
    assert.ok(comuns.length >= 2, 'devia haver propostas comuns aos dois planos');
    for (const a of comuns) {
      const d = depois.find((x) => x.k === a.k);
      assert.equal(d.texto, a.texto, `«${a.k}» mudou de texto sem mudar de chave`);
    }
    const mudouDeNumero = comuns.some((a) => depois.find((x) => x.k === a.k).ord !== a.ord);
    assert.ok(mudouDeNumero, 'o número no papel tinha mesmo de mudar — é esse o defeito de fundo');
  });

test('o número com que saiu no papel guarda-se ao lado da identidade', semAplicacao, () => {
  // É o que está escrito no documento que o COS aprovou. Sem ele não se liga o item de
  // controlo ao papel.
  cenario({ r: '3192', w: '20' });
  for (const x of controlo().filter((p) => p.tipo === 'Proposta')) {
    assert.match(x.ord, /^P\d+$/, `sem número de apresentação: ${x.k}`);
    assert.notEqual(x.k, x.ord, 'a identidade não pode ser o número da posição');
  }
});

/* ---- a via do modelo de linguagem ---- */

test('uma proposta sem chave declarada recebe chave derivada do texto', semAplicacao, () => {
  const c = janela.controloMissoes({ propostas: [{ id: 'P1', texto: 'Reforçar o flanco esquerdo.' }] });
  assert.match(c[0].k, /^T-/, 'e o prefixo diz de onde a chave veio');
  assert.equal(c[0].ord, 'P1');
});

test('a chave derivada é estável para o mesmo texto, e distinta para outro', semAplicacao, () => {
  const a = janela.chaveDoTexto('Reforçar o flanco esquerdo.');
  const b = janela.chaveDoTexto('  reforçar   o FLANCO esquerdo. ');
  const c = janela.chaveDoTexto('Reforçar o flanco direito.');
  assert.equal(a, b, 'espaços e caixa não mudam a proposta');
  assert.notEqual(a, c, 'flanco esquerdo e direito são propostas diferentes');
});

/* ---- o que não se toca ---- */

test('as missões continuam numeradas por ordem, que é o que elas são', semAplicacao, () => {
  const c = janela.controloMissoes({ missoes: [{ tipo: 'Ação decisiva', texto: 'a' }, { tipo: 'Apoio', texto: 'b' }] });
  assert.equal(c.map((x) => x.k).join(','), 'M1,M2');
});

test('o PEA impresso continua a numerar as propostas por ordem de leitura', semAplicacao, () => {
  // Dentro de um documento, «P2» é o segundo item e é assim que se lê no papel. A chave
  // estável não substitui isso: acompanha-o.
  cenario({ r: '3192', w: '20' });
  const ids = janela.detDecisao([], null).propostas.map((p) => p.id);
  assert.deepEqual(ids, ids.map((_, i) => 'P' + (i + 1)));
});
