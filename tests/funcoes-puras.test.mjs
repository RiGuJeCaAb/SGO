// As funções puras que ficaram sem teste na r0102 e foram distribuídas ao ramo #002,
// que respondeu com método e sem código. Entram aqui, na r0107.
//
// São pequenas e é por isso que não tinham teste — e é por isso que o merecem: cada uma
// decide sozinha uma coisa que o resto da aplicação toma por certa. `variantes` decide o
// que se pergunta ao geocodificador; `normalizarDistrito` decide que pacote de canais se
// aplica; `motivoRede` decide o que o oficial lê quando a rede falha; `carimboFich` decide
// o nome do ficheiro que sai; `parPar` decide se um par escrito à mão é uma coordenada.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { abrirAplicacao } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));

/* ---- variantes: o que se pergunta ao geocodificador ---- */

test('variantes: um local ditado parte-se pelos separadores e encurta-se, do mais completo para o mais curto', semAplicacao, () => {
  assert.deepEqual(daqui(janela.variantes('Vila Chã de Caria — Moimenta da Beira')),
    ['Vila Chã de Caria', 'de Caria', 'Caria', 'Moimenta da Beira']);
  assert.deepEqual(daqui(janela.variantes('Leomil - Moimenta da Beira')), ['Leomil', 'Moimenta da Beira']);
  assert.deepEqual(daqui(janela.variantes('Cambres, Lamego / Viseu')), ['Cambres', 'Lamego', 'Viseu']);
});

test('variantes: não repete, não devolve pedaços de duas letras, e de vazio devolve nada', semAplicacao, () => {
  assert.deepEqual(daqui(janela.variantes('Lamego — Lamego')), ['Lamego'], 'a mesma pergunta não se faz duas vezes');
  assert.deepEqual(daqui(janela.variantes('Sé de Lamego')), ['Sé de Lamego', 'de Lamego', 'Lamego'], '«de» sozinho seria uma pergunta sem sentido, e não sai');
  assert.deepEqual(daqui(janela.variantes('')), []);
  assert.deepEqual(daqui(janela.variantes(' — ')), []);
});

/* ---- normalizarDistrito: o nome como a lista oficial o escreve ---- */

test('normalizarDistrito: reconhece o distrito como vier escrito e devolve-o como a lista oficial o escreve', semAplicacao, () => {
  assert.equal(janela.normalizarDistrito('Distrito de Viseu'), 'Viseu');
  assert.equal(janela.normalizarDistrito('viseu'), 'Viseu');
  assert.equal(janela.normalizarDistrito('Distrito do Porto'), 'Porto');
  assert.equal(janela.normalizarDistrito('Vila Real District'), 'Vila Real', 'um serviço estrangeiro escreve-o à sua maneira');
  assert.equal(janela.normalizarDistrito('  Bragança '), 'Bragança');
});

test('normalizarDistrito: o que não é distrito volta como veio, e vazio volta vazio', semAplicacao, () => {
  assert.equal(janela.normalizarDistrito('Xanadu'), 'Xanadu', 'não se inventa um distrito para o que não se reconhece');
  assert.equal(janela.normalizarDistrito(''), '');
  assert.equal(janela.normalizarDistrito(null), '');
  assert.equal(janela.normalizarDistrito(undefined), '');
});

/* ---- motivoRede: a frase que o oficial lê ---- */

test('motivoRede: cada motivo de falha tem a sua frase, e o desconhecido tem uma genérica', semAplicacao, () => {
  assert.equal(janela.motivoRede({ motivo: 'sem-rede' }), 'sem ligação de dados');
  assert.equal(janela.motivoRede({ motivo: 'tempo-esgotado' }), 'a origem não respondeu dentro do prazo');
  assert.equal(janela.motivoRede({ motivo: 'recusado', estado: 403 }), 'a origem recusou o pedido (403)');
  assert.equal(janela.motivoRede({ motivo: 'recusado' }), 'a origem recusou o pedido', 'sem código HTTP não se escreve um par de parênteses vazio');
  assert.equal(janela.motivoRede(new Error('TypeError: Failed to fetch')), 'falha de rede');
  assert.equal(janela.motivoRede(null), 'falha de rede');
});

test('motivoRede: as frases que erroRede produz são as que motivoRede lê', semAplicacao, () => {
  const e = janela.erroRede('tempo-esgotado', 'x');
  assert.equal(janela.motivoRede(e), 'a origem não respondeu dentro do prazo');
});

/* ---- carimboFich: o nome do ficheiro ---- */

test('carimboFich: AAAAMMDDHHMM em hora local, do relógio da aplicação, como manda a convenção de nomes', semAplicacao, () => {
  const c = janela.carimboFich();
  assert.match(c, /^\d{12}$/);
  const d = new Date(janela.agora());
  const p = (n) => String(n).padStart(2, '0');
  const esperado = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes());
  assert.equal(c, esperado);
  assert.equal(c.slice(0, 4), String(d.getFullYear()), 'o ano vem primeiro, para os nomes ordenarem por data');
});

test('carimboFich: sai do relógio da aplicação e não do do sistema', () => {
  /* Um teste de fonte: `agora()` é o único relógio, e a regra que o impõe (estado-e-tempo)
     já recusa `Date.now()` fora do módulo do relógio. Aqui confere-se que este carimbo,
     que dá nome a tudo o que sai, passa por ele — para um teste poder fixar a hora. */
  const texto = readFileSync('fonte/1-nucleo/14-descarregar-ficheiros.js', 'utf8');
  const linha = texto.split('\n').find((l) => l.startsWith('function carimboFich('));
  assert.ok(linha, 'carimboFich mudou de sítio');
  assert.match(linha, /new Date\(agora\(\)\)/);
});

/* ---- parPar: um par escrito à mão ---- */

test('parPar: aceita vírgula decimal, ponto, ponto e vírgula e espaço como separadores', semAplicacao, () => {
  assert.deepEqual(daqui(janela.parPar('41,16; -7,79')), { lat: 41.16, lon: -7.79 });
  assert.deepEqual(daqui(janela.parPar('41.16, -7.79')), { lat: 41.16, lon: -7.79 });
  assert.deepEqual(daqui(janela.parPar('41.16 -7.79')), { lat: 41.16, lon: -7.79 });
  assert.deepEqual(daqui(janela.parPar('  41,0975   -7,8103 ')), { lat: 41.0975, lon: -7.8103 },
    'o que um teclado português escreve: até à r0107 dava latitude 41 e longitude 975');
  assert.deepEqual(daqui(janela.parPar('41,16, -7,79')), { lat: 41.16, lon: -7.79 }, 'com espaço, a vírgula é decimal');
  assert.deepEqual(daqui(janela.parPar('41.16,-7.79')), { lat: 41.16, lon: -7.79 }, 'sem espaço nem ponto e vírgula, a vírgula separa');
});

test('parPar: recusa o que não cabe nos limites, o que só tem um número, e o que não é número', semAplicacao, () => {
  assert.equal(janela.parPar('91, 0'), null, 'latitude 91 não existe');
  assert.equal(janela.parPar('41, 181'), null, 'longitude 181 não existe');
  assert.equal(janela.parPar('41,16'), null, 'um número só não é um par');
  assert.equal(janela.parPar('41,16,-7,79'), null, 'sem espaço nem ponto não se adivinha: antes nada do que latitude 41 e longitude 16');
  assert.equal(janela.parPar('norte, oeste'), null);
  assert.equal(janela.parPar(''), null);
  assert.equal(janela.parPar(null), null);
});

test('parPar: com três números, valem os dois primeiros', semAplicacao, () => {
  /* Quem cola «41.16, -7.79, 512» de um GPS com altitude não deve perder a coordenada. */
  assert.deepEqual(daqui(janela.parPar('41.16, -7.79, 512')), { lat: 41.16, lon: -7.79 });
});
