// O tecto de saída do motor de propagação.
//
// Os sinalizadores `fora` vigiam o domínio das **entradas**. Durante três revisões ninguém
// vigiou o **valor que sai**, e a diferença não é académica: uma combinação dentro de todos
// os domínios de entrada — vento 30 km/h, humidade 8 %, mato de 3 m, declive de 50 % —
// devolvia 14 820 m/h sem uma palavra de reserva. São quarenta e uma vezes o tecto que a
// fonte primária declara.
//
// O que se verifica aqui não é que a marca existe. É que **o número não sai sozinho** quando
// está fora do que foi medido, em nenhum dos sítios por onde passa.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/* ---- os três tectos, e a razão de cada um ---- */

test('os tectos estão declarados, e em ordem', semAplicacao, () => {
  const baixo = avaliar(janela, 'TECTO_BAIXO');
  const medido = avaliar(janela, 'TECTO_MEDIDO');
  const quadro = avaliar(janela, 'TECTO_QUADRO');
  assert.equal(baixo, 360, '6 m/min, Fernandes (2001)');
  assert.equal(medido, 1200, '20 m/min, o mais rápido dos 29 fogos');
  assert.equal(quadro, 2280, '38 m/min, a célula mais rápida do Quadro 3.4.1');
  assert.ok(baixo < medido && medido < quadro, 'a ordem dos tectos é a ordem da reserva');
});

test('o tecto do quadro é mesmo a célula mais rápida do Quadro 3.4.1', semAplicacao, () => {
  // Conferido contra o impresso: 38,0 m/min a 30 km/h de vento e 8 % de humidade.
  const R = avaliar(janela, 'Q_MAT_R');
  const max = Math.max(...R.flat());
  assert.equal(Math.round(max * 60), avaliar(janela, 'TECTO_QUADRO'));
  assert.equal(max, 38, 'a célula do canto vale 38 m/min no impresso');
});

/* ---- a marca ---- */

test('dentro do medido não há marca nenhuma', semAplicacao, () => {
  assert.equal(janela.marcaDeSaida(100), null);
  assert.equal(janela.marcaDeSaida(360), null, 'no tecto ainda está dentro');
});

test('acima dos 360 m/h a marca é de extrapolação, e diz porquê', semAplicacao, () => {
  const m = janela.marcaDeSaida(500);
  assert.equal(m.grau, 'extra');
  assert.equal(m.r, 'EXTRAPOLAÇÃO');
  assert.match(m.d, /6 m\/min/, 'a frase tem de trazer o tecto na unidade da fonte');
  assert.match(m.d, /escassez de dados/, 'e a razão de ele existir');
});

test('acima dos 1 200 m/h a marca sobe de grau', semAplicacao, () => {
  const m = janela.marcaDeSaida(1500);
  assert.equal(m.grau, 'alem');
  assert.equal(m.r, 'ALÉM DE QUALQUER FOGO MEDIDO');
  assert.match(m.d, /29 fogos/);
  assert.ok(!/Quadro 3\.4\.1/.test(m.d), 'abaixo dos 2 280 não se invoca o quadro');
});

test('acima da célula mais rápida do quadro, a marca di-lo também', semAplicacao, () => {
  const m = janela.marcaDeSaida(14820);
  assert.equal(m.grau, 'alem');
  assert.match(m.d, /Quadro 3\.4\.1/, 'só as correções lá chegam, e isso tem de estar dito');
  assert.match(m.d, /14\u202f820|14\u00a0820|14 820|14\.820/, 'os milhares separam-se como no resto da aplicação');
});

test('o caso que motivou tudo isto sai marcado', semAplicacao, () => {
  // Vento 30, humidade 8, mato de 3 m, declive 50 %: tudo dentro dos domínios de entrada.
  const p = janela.propagacaoMatos(30, 8, 3.0, 50);
  assert.ok(Math.round(p.r) === 14820, `o máximo do domínio mudou: ${Math.round(p.r)}`);
  assert.ok(p.marca, 'e não pode sair sem marca');
  assert.equal(p.marca.grau, 'alem');
});

test('o declive acima de 5 % assinala-se, porque a tabela base é de terreno plano',
  semAplicacao, () => {
    // Conferido no impresso: «velocidades de propagação de fogos a favor do vento em terreno
    // plano (declive <5%) para matos com 1 m de altura».
    const plano = janela.propagacaoMatos(10, 12, 1, 0);
    assert.equal(plano.fora.some((x) => /terreno plano/.test(x)), false);
    const encosta = janela.propagacaoMatos(10, 12, 1, 30);
    assert.ok(encosta.fora.some((x) => /terreno plano/.test(x)),
      'num vale de socalcos é a correção de declive que domina, e ela sai das condições da medição');
  });

/* ---- o pinhal não leva o tecto dos matos ---- */

test('o pinheiro bravo não recebe a marca dos matos', semAplicacao, () => {
  // Os tectos são de Fernandes (2001), que é sobre matos. Emprestá-los ao guia E2 seria o
  // mesmo erro de fonte trocada que este trabalho veio corrigir.
  const p = janela.propagacaoPinhal(6, 12, 40, 3);
  assert.ok(p, 'a combinação tem de dar resultado');
  assert.equal(p.marca, null, 'e sair sem marca, porque não há tecto declarado para o E2');
});

/* ---- a marca acompanha o número por onde ele passa ---- */

function estimar(campos) {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  Object.assign(O.dados.fogo.est, campos);
  return { O, r: janela.estimarPropagacao() };
}

test('a estimativa devolve a marca junto do valor', semAplicacao, () => {
  const { r } = estimar({ modelo: 'V-MAa', altura: '3,0', u10: '45', declive: '50', hcm: '8' });
  assert.equal(r.ok, true, r.recusa);
  assert.ok(r.det.marca, 'a estimativa tem de trazer a marca');
});

test('o retrato do fogo leva a marca ao plano — mas só se o R veio da estimativa',
  semAplicacao, () => {
    const { O } = estimar({ modelo: 'V-MAa', altura: '3,0', u10: '45', declive: '50', hcm: '8' });
    const est = janela.estimarPropagacao();
    O.dados.fogo.est.rEst = String(Math.round(est.r));
    O.dados.fogo.r = String(Math.round(est.r));
    O.dados.fogo.w = '20';
    const f = janela.retratoDoFogo();
    assert.ok(f.r.marca, 'estimado e fora do medido: a marca tem de chegar ao retrato');
    assert.match(janela.resumoDoFogo(f), /ALÉM DE QUALQUER FOGO MEDIDO/);
  });

test('um R observado não leva marca nenhuma', semAplicacao, () => {
  // Um fogo medido a 5 000 m/h não é extrapolação: é um fogo a andar depressa. Dizer-lhe
  // «além de qualquer fogo medido» seria desmentir quem o mediu. Os tectos são dos quadros,
  // não do terreno.
  const { O } = estimar({ modelo: 'V-MAa', altura: '1,5', u10: '20', declive: '20', hcm: '12' });
  O.dados.fogo.est.rEst = '400';
  O.dados.fogo.r = '5000';          // escrito à mão, não veio da estimativa
  O.dados.fogo.w = '20';
  const f = janela.retratoDoFogo();
  assert.match(f.r.origem, /observada ou declarada/);
  assert.equal(f.r.marca, null, 'a marca é dos quadros, e este número não saiu deles');
});

test('a marca aparece à cabeça da leitura, e não numa nota de rodapé', semAplicacao, () => {
  estimar({ modelo: 'V-MAa', altura: '3,0', u10: '45', declive: '50', hcm: '8' });
  ['pr-modelo', 'pr-alt', 'pr-decl', 'pr-u10', 'pr-hcm'].forEach((id, i) => {
    const v = ['V-MAa', '3,0', '50', '45', '8'][i];
    const el = janela.document.getElementById(id);
    if (el.tagName === 'SELECT') janela.encherModelos();
    el.value = v;
  });
  janela.pintarEstimativa();
  const txt = janela.document.getElementById('pr-saida').textContent;
  const iMarca = txt.indexOf('ALÉM DE QUALQUER FOGO MEDIDO');
  const iVel = txt.indexOf('Velocidade de propagação estimada');
  assert.ok(iMarca >= 0, 'a marca tem de estar na leitura');
  assert.ok(iMarca < iVel, 'e antes do número, senão o número lê-se sozinho');
});
