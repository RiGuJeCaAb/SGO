// Modelos de combustível e velocidade de propagação.
//
// Estes quadros vieram transcritos de dois documentos que o repositório não tem — o manual
// de fogo controlado de Fernandes, Botelho & Loureiro (2002b) e os modelos de Fernandes &
// Loureiro (2021). Ver `docs/FONTES.md`, chave FOGOPT. **Nenhum teste pode conferir uma
// transcrição contra o impresso**, e é preciso dizê-lo em voz alta: o que se confere aqui é
// a coerência interna — que o motor é monótono onde a física obriga, que respeita os
// domínios publicados, que recusa em vez de inventar, e que o número que sai alimenta a
// cadeia da intensidade sem se perder pelo caminho.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/* Corre a estimativa com as entradas postas no estado, sem passar pelo formulário: o que
   está em causa é o motor, não a ligação dos campos — essa tem teste próprio abaixo. */
function estimar(campos) {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  Object.assign(O.dados.fogo.est, campos);
  return janela.estimarPropagacao();
}

/* ---- o registo dos modelos ---- */

test('todo o modelo declara código, descrição e carga, e a carga é um intervalo', semAplicacao, () => {
  const ms = avaliar(janela, 'MODELOS_COMB');
  assert.ok(ms.length >= 18, 'os modelos publicados são dezoito');
  for (const m of ms) {
    assert.match(m.c, /^[A-Z]-[A-Za-z]+$/, `código mal formado: ${m.c}`);
    assert.ok(m.d && m.d.length > 3, `sem descrição: ${m.c}`);
    assert.ok(Array.isArray(m.w) && m.w.length === 2, `carga sem intervalo em ${m.c}`);
    if (m.w[0] === null) { assert.equal(m.w[1], null, `meia carga em ${m.c}`); continue; }
    assert.ok(m.w[0] > 0 && m.w[1] >= m.w[0], `carga incoerente em ${m.c}`);
  }
});

test('o modelo a que a fonte não dá carga declara-o, e não um zero', semAplicacao, () => {
  // V-MH, mato verde até três anos desde o último fogo: o documento não publica carga.
  // Um zero aqui passaria por combustível nenhum e daria intensidade nula num fogo real.
  const semCarga = avaliar(janela, 'MODELOS_COMB').filter((m) => m.w[0] === null);
  assert.equal(semCarga.length, 1, 'só um modelo fica sem carga publicada');
  assert.equal(semCarga[0].c, 'V-MH');
});

test('os códigos dos modelos não se repetem', semAplicacao, () => {
  const cs = avaliar(janela, 'MODELOS_COMB').map((m) => m.c);
  assert.equal(new Set(cs).size, cs.length);
});

test('só os modelos de matos e de pinhal declaram motor de propagação', semAplicacao, () => {
  const ms = avaliar(janela, 'MODELOS_COMB');
  for (const m of ms) {
    if (m.motor) assert.ok(['matos', 'pinhal'].includes(m.motor), `motor desconhecido em ${m.c}`);
  }
  assert.ok(ms.some((m) => m.motor === 'matos'), 'o guia E1 cobre matos');
  assert.ok(ms.some((m) => m.motor === 'pinhal'), 'o guia E2 cobre pinheiro bravo');
  assert.ok(ms.some((m) => !m.motor), 'eucaliptal e folhosas ficam de fora, e isso vê-se');
});

/* ---- o vento à superfície ---- */

test('o vento à superfície é dois terços do vento a 10 m', semAplicacao, () => {
  assert.ok(Math.abs(janela.ventoSuperficie(30) - 20) < 1e-9);
  assert.equal(janela.ventoSuperficie(0), 0);
});

/* ---- a humidade do combustível morto ---- */

test('acima de 25 °C a humidade recusa-se, e diz porquê', semAplicacao, () => {
  const h = janela.humidadeCombustivel(21, 9, 34);
  assert.equal(h.v, null, 'não sai número nenhum');
  assert.match(h.recusa, /25 °C/);
  assert.match(h.recusa, /outra fonte/, 'a recusa diz onde ir buscar o número');
});

test('à temperatura do quadro sai humidade, e ela desce com dias secos', semAplicacao, () => {
  const molhado = janela.humidadeCombustivel(90, 1, 20);
  const seco = janela.humidadeCombustivel(20, 7, 20);
  assert.ok(molhado.v > seco.v, 'ar húmido e um dia seco dá mais humidade que ar seco e sete');
  assert.ok(seco.v > 0, 'a humidade do combustível nunca é zero');
});

test('a humidade não cai por causa de uma temperatura que não se sabe', semAplicacao, () => {
  // Number.isFinite e não isFinite: isFinite(null) é true, porque Number(null) é 0. Já
  // fez a aplicação afirmar coisas sobre um valor que ninguém tinha escrito.
  for (const t of [null, undefined, '', NaN]) {
    assert.ok(janela.humidadeCombustivel(50, 3, t).v > 0, `temperatura ${String(t)} não devia recusar`);
  }
});

/* ---- a propagação em matos ---- */

test('em matos a propagação sobe com o vento e desce com a humidade', semAplicacao, () => {
  const eixoU = avaliar(janela, 'Q_MAT_U'), eixoH = avaliar(janela, 'Q_MAT_H');
  let violaVento = 0, violaHum = 0;
  for (const h of eixoH) {
    for (let i = 1; i < eixoU.length; i++) {
      const a = janela.propagacaoMatos(eixoU[i - 1], h, 1, 0).r;
      const b = janela.propagacaoMatos(eixoU[i], h, 1, 0).r;
      if (b < a - 1e-9) violaVento++;
    }
  }
  for (const u of eixoU) {
    for (let i = 1; i < eixoH.length; i++) {
      const a = janela.propagacaoMatos(u, eixoH[i - 1], 1, 0).r;
      const b = janela.propagacaoMatos(u, eixoH[i], 1, 0).r;
      if (b > a + 1e-9) violaHum++;
    }
  }
  assert.equal(violaVento, 0, 'mais vento tem de dar mais propagação em todo o quadro');
  assert.equal(violaHum, 0, 'mais humidade tem de dar menos propagação em todo o quadro');
});

test('o declive multiplica: a subida acelera e a descida trava', semAplicacao, () => {
  const plano = janela.propagacaoMatos(10, 12, 1, 0).r;
  assert.ok(janela.propagacaoMatos(10, 12, 1, 30).r > plano, 'a subir vai mais depressa');
  assert.ok(janela.propagacaoMatos(10, 12, 1, -30).r < plano, 'a descer vai mais devagar');
});

test('sair do domínio publicado não inventa: extrapola preso e diz que saiu', semAplicacao, () => {
  const p = janela.propagacaoMatos(60, 12, 1, 0);
  assert.ok(p.fora.length > 0, 'um vento de 60 km/h à superfície está fora do Quadro 3.4.1');
  assert.ok(Number.isFinite(p.r), 'mesmo assim sai um número, preso ao extremo do quadro');
  const q = janela.propagacaoMatos(30, 12, 1, 0);
  assert.equal(p.r, q.r, 'preso ao extremo quer dizer preso: não cresce para lá do quadro');
});

test('a propagação em matos fica no domínio que a literatura reconhece', semAplicacao, () => {
  // Alexander (2000) por Fernandes (2003): de cerca de 1,5 m/h a cerca de 14 km/h.
  const eixoU = avaliar(janela, 'Q_MAT_U'), eixoH = avaliar(janela, 'Q_MAT_H');
  let min = Infinity, max = 0;
  for (const u of eixoU) for (const h of eixoH) {
    const r = janela.propagacaoMatos(u, h, 1, 0).r;
    min = Math.min(min, r); max = Math.max(max, r);
  }
  assert.ok(min >= 0, 'nenhuma célula do quadro é negativa');
  assert.ok(max < 20000, `${max} m/h passa o que a literatura reconhece em floresta`);
});

/* ---- a propagação em pinhal ---- */

test('em pinhal o declive multiplica e o tipo de combustível soma', semAplicacao, () => {
  const a = janela.propagacaoPinhal(3, 16, 0, 1);
  const b = janela.propagacaoPinhal(3, 16, 0, 3);
  assert.equal(b.r - a.r, b.adTipo - a.adTipo, 'a diferença entre tipos é a parcela aditiva, e só ela');
  const c = janela.propagacaoPinhal(3, 16, 30, 1);
  assert.ok(c.fDecl > a.fDecl, 'o declive entra como fator, não como parcela');
});

test('em pinhal a propagação nunca desce abaixo de zero', semAplicacao, () => {
  // O tipo 1 subtrai 35 m/h. Numa base pequena a soma daria negativo, e um fogo a andar
  // para trás é uma leitura que não existe.
  const eixoU = avaliar(janela, 'Q_PIN_U'), eixoH = avaliar(janela, 'Q_PIN_H');
  let contadas = 0;
  for (const u of eixoU) for (const h of eixoH) for (const t of [1, 2, 3]) {
    const p = janela.propagacaoPinhal(u, h, -40, t);
    // Célula em branco no quadro: a fonte não dá propagação sustentada ali, e a ausência
    // devolve-se como ausência.
    if (p === null) continue;
    contadas++;
    assert.ok(p.r >= 0, `negativo em u=${u} h=${h} t=${t}`);
  }
  assert.ok(contadas > 0, 'o quadro não pode estar todo em branco');
});

test('um tipo de pinhal que a fonte não declara não dá estimativa', semAplicacao, () => {
  assert.equal(janela.propagacaoPinhal(3, 16, 0, 9), null);
});

/* ---- a ponte para Viegas ---- */

test('sem vento não há razão declive/vento, e isso não é zero', semAplicacao, () => {
  // O denominador da ponte é o acréscimo que o vento produz. Sem vento anula-se, e uma
  // razão indefinida devolve-se como indefinida: um ε de zero diria «o declive não conta».
  assert.equal(janela.epsilonDosQuadros(avaliar(janela, 'Q_MAT_U')[0], 12, 30), null);
});

test('a razão é nula no plano e cresce com o declive', semAplicacao, () => {
  assert.ok(Math.abs(janela.epsilonDosQuadros(10, 12, 0)) < 1e-9, 'no plano o declive não acrescenta nada');
  const a = janela.epsilonDosQuadros(10, 12, 20), b = janela.epsilonDosQuadros(10, 12, 40);
  assert.ok(b > a && a > 0, 'mais declive, mais peso do declive na composição');
});

/* ---- a estimativa completa ---- */

test('sem modelo escolhido a estimativa recusa em vez de arbitrar', semAplicacao, () => {
  const e = estimar({});
  assert.equal(e.ok, false);
  assert.match(e.recusa, /modelo de combustível/);
});

test('um modelo sem motor português diz que não há, e não improvisa um', semAplicacao, () => {
  const sem = avaliar(janela, 'MODELOS_COMB').find((m) => !m.motor);
  const e = estimar({ modelo: sem.c, u10: '27', declive: '35', hcm: '10' });
  assert.equal(e.ok, false);
  assert.match(e.recusa, /observada no terreno/, 'diz o que fazer em vez do que não se pode fazer');
});

test('faltando uma entrada, a recusa nomeia a que falta', semAplicacao, () => {
  const base = { modelo: 'V-MAa', altura: '1,5', u10: '27', declive: '35', hcm: '10' };
  const casos = [['u10', /vento/], ['hcm', /humidade/], ['declive', /declive/], ['altura', /altura/]];
  for (const [campo, esperado] of casos) {
    const e = estimar({ ...base, [campo]: '' });
    assert.equal(e.ok, false, `sem ${campo} não devia haver estimativa`);
    assert.match(e.recusa, esperado);
  }
});

test('a vírgula decimal portuguesa não anula uma entrada escrita', semAplicacao, () => {
  // Number('1,5') é NaN. Já houve quem escrevesse a altura com vírgula e a aplicação lhe
  // respondesse que faltava a altura.
  const e = estimar({ modelo: 'V-MAa', altura: '1,5', u10: '27,5', declive: '35', hcm: '10,5' });
  assert.equal(e.ok, true, e.recusa);
  assert.ok(e.r > 0);
});

test('o caso do vale do Douro sai com propagação, carga e razão de declive', semAplicacao, () => {
  const e = estimar({ modelo: 'V-MAa', altura: '1,5', u10: '27', declive: '35', hcm: '10' });
  assert.equal(e.ok, true, e.recusa);
  assert.ok(e.r > 500 && e.r < 14820, `${e.r} m/h fora do que a literatura reconhece`);
  assert.ok(Math.abs(e.u2 - 18) < 1e-9, 'o vento à superfície são dois terços dos 27 km/h');
  assert.ok(e.eps > 0, 'em matos a ponte para Viegas dá razão');
  assert.ok(e.modelo.w[0] === 12 && e.modelo.w[1] === 27, 'a carga do V-MAa vem do modelo');
});

test('em pinhal não se oferece razão de declive, porque a ponte é dos matos', semAplicacao, () => {
  const pin = avaliar(janela, 'MODELOS_COMB').find((m) => m.motor === 'pinhal');
  const e = estimar({ modelo: pin.c, u10: '4,5', declive: '20', hcm: '16' });
  assert.equal(e.ok, true, e.recusa);
  assert.equal(e.eps, null, 'a ponte foi deduzida do quadro dos matos e só lá vale');
});

/* ---- a cadeia até à intensidade ---- */

test('a propagação estimada alimenta a intensidade de Byram sem se perder', semAplicacao, () => {
  const e = estimar({ modelo: 'V-MAa', altura: '1,5', u10: '27', declive: '35', hcm: '10' });
  const w = (e.modelo.w[0] + e.modelo.w[1]) / 2;
  const i = janela.intensidadeByram(e.r, w);
  assert.ok(i > 0);
  assert.equal(i, janela.intensidadeByram(e.r, w), 'a conta é determinista');
  assert.ok(i > avaliar(janela, 'LIMITE_ATAQUE_DIRETO'),
    'neste caso do Douro o ataque direto está fora de causa, e a aplicação tem de o dizer');
});

/* ---- o painel ---- */

test('os campos do painel têm todos elemento na entrega', semAplicacao, () => {
  for (const id of ['pr-modelo', 'pr-alt', 'pr-decl', 'pr-u10', 'pr-hcm', 'pr-hr', 'pr-dias',
                    'pr-hcm-calc', 'pr-calc', 'pr-usar', 'pr-saida'])
    assert.ok(janela.document.getElementById(id), `falta ${id} no molde`);
});

test('a lista de modelos enche-se do registo, e não à mão no HTML', semAplicacao, () => {
  janela.encherModelos();
  const n = janela.document.getElementById('pr-modelo').options.length;
  assert.equal(n, avaliar(janela, 'MODELOS_COMB').length + 1, 'os modelos mais a linha vazia');
});

test('o declive pode vir da classe do relevo, e o número diz que é uma classe', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.dados.topo.declive = 'acentuado';
  janela.document.getElementById('pr-decl').value = '';
  janela.document.getElementById('pr-relevo').click();
  assert.equal(janela.document.getElementById('pr-decl').value, '27', 'o centro de 20–35 %');
  assert.equal(O.dados.fogo.est.declive, '27', 'e fica no estado, não só no ecrã');
  assert.match(janela.document.getElementById('pr-saida').textContent, /classe/,
    'quem lê tem de saber que não é uma medição');
});

test('sem classe declarada no relevo o botão recusa em vez de arbitrar um declive', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  janela.document.getElementById('pr-decl').value = '';
  janela.document.getElementById('pr-relevo').click();
  assert.equal(janela.document.getElementById('pr-decl').value, '', 'nada foi preenchido');
  assert.match(janela.document.getElementById('pr-saida').textContent, /não declara classe/);
});

test('o tipo de pinhal do registo e o do estado dão o mesmo resultado', semAplicacao, () => {
  // No registo o tipo é número, no estado é texto. O parseInt engolia os dois sem se
  // queixar, e o verificador de tipos apanhou-o: é a diferença entre um campo lido e um
  // campo por omissão passar a valer coisas diferentes sem ninguém dar por isso.
  const pin = avaliar(janela, 'MODELOS_COMB').find((m) => m.motor === 'pinhal');
  const doRegisto = estimar({ modelo: pin.c, u10: '4,5', declive: '20', hcm: '16' });
  const doEstado = estimar({ modelo: pin.c, u10: '4,5', declive: '20', hcm: '16',
                             tipoPin: String(pin.tipoPin) });
  assert.equal(doRegisto.ok, true, doRegisto.recusa);
  assert.equal(doEstado.r, doRegisto.r);
});
