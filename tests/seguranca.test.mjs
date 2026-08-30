// Robustecimento — o que um dado de campo pode fazer ao chegar ao ecrã.
//
// A análise clínica externa de 29 de agosto apontou XSS armazenado como P0, e tinha
// razão: `esc()` escapava `< > &` e deixava passar as aspas, e a aplicação usa-o dentro
// de atributos construídos por concatenação. Uma aspa no nome de um comandante de setor
// — escrita à mão ou vinda de um ficheiro importado — fechava o atributo e abria outro.
//
// Estes testes não verificam a correção: verificam o **sintoma**. Injeta-se o veneno nos
// campos livres, manda-se pintar, e olha-se para o DOM à procura do que não devia lá
// estar. Se um dia alguém voltar a construir um atributo à mão sem escape, é aqui que
// parte.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const doc = () => janela.document;

/** Fecha o atributo com aspas duplas e tenta abrir um manipulador de eventos. */
const VENENO_D = 'X" onfocus="window.__mau=1" autofocus zz="';
/** O mesmo com plica, para os atributos delimitados por plicas e as strings de JS. */
const VENENO_P = "X' onfocus='window.__mau=1' autofocus zz='";
/** E o clássico, para o caso de o dado cair em contexto de texto. */
const VENENO_T = '<img src=x onerror="window.__mau=1">';
const VENENOS = [VENENO_D, VENENO_P, VENENO_T];

/** Tudo o que um dado de campo nunca deve conseguir criar. */
const PROIBIDO = '[onfocus],[onerror],[onclick],[onload],[onmouseover],[autofocus],[zz],img,script,iframe';

/** Corre `pintar`, e devolve o que apareceu de proibido dentro de `raiz`. */
function intrusos(raiz) {
  const el = typeof raiz === 'string' ? doc().getElementById(raiz) : raiz;
  if (!el) return ['(sem elemento ' + raiz + ')'];
  return [...el.querySelectorAll(PROIBIDO)].map((x) => x.tagName.toLowerCase()
    + '[' + [...x.attributes].map((a) => a.name).join(',') + ']');
}

test('o escape cobre as aspas, que é onde estava o buraco', semAplicacao, () => {
  const esc = (s) => janela.eval('esc(' + JSON.stringify(s) + ')');
  assert.equal(esc('<a>'), '&lt;a&gt;');
  assert.equal(esc('a&b'), 'a&amp;b');
  assert.equal(esc('a"b'), 'a&quot;b');
  assert.equal(esc("a'b"), 'a&#39;b');
  assert.equal(esc(null), '');
});

test('nenhum campo do setor consegue criar um atributo', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const e = janela.estObj();
  e.n = 1;
  e.setores = [{ estado: 'Em curso (ativo)', cmd: VENENO_D, adj: VENENO_P, ct: VENENO_T,
    m: '', o: '', tip: [{ t: VENENO_D, mu: 1, ou: 5, mr: 0, ar: 0, ts: janela.agora(), ent: VENENO_P }] }];
  janela.renderSetores();

  assert.deepEqual(intrusos('s-lista'), []);
  assert.equal(janela.__mau, undefined, 'correu código vindo de um campo');
  // e o texto do oficial não se perde pelo caminho: escapa-se, não se apaga
  assert.equal(doc().querySelector('#s-lista input[data-f="cmd"]').value, VENENO_D);
});

test('nem os campos da passagem de turno', semAplicacao, () => {
  janela.eval('O = novoEstado()');
  const t = avaliar(janela, 'O').turno;
  Object.keys(t.celulas).forEach((k) => { t.celulas[k].n = VENENO_D; t.celulas[k].ct = VENENO_P; });
  janela.renderTurno();
  assert.deepEqual(intrusos('tn-celulas'), []);
  assert.equal(janela.__mau, undefined);
});

test('nem o número da ocorrência no arquivo, que era o pior de todos', semAplicacao, () => {
  // Aqui o valor caía dentro de uma string de JavaScript: `onclick="abrirOcc('...')"`.
  // O escape de HTML não protege esse sítio — o navegador desfaz a entidade antes de o
  // JavaScript ver o texto. Passou a `data-` com ouvinte.
  janela.eval('INDEX = [{num:' + JSON.stringify(VENENO_P) + ', local:' + JSON.stringify(VENENO_D)
    + ', pasta:"Douro", pco:"", g:"301200AGO26", peas:0}]');
  janela.pintarArquivo();
  assert.deepEqual(intrusos('arq-list'), []);
  assert.equal(janela.__mau, undefined);

  const b = doc().querySelector('#arq-list [data-occ-abrir]');
  assert.ok(b, 'o botão de abrir perdeu-se na conversão');
  assert.equal(b.getAttribute('data-occ-abrir'), VENENO_P, 'o número tem de sobreviver inteiro');
  janela.eval('INDEX = []');
});

test('nem o catálogo de elementos, que guarda nomes e contactos', semAplicacao, () => {
  janela.eval('ELEMENTOS = [{id:"x1", nome:' + JSON.stringify(VENENO_D)
    + ', entidade:' + JSON.stringify(VENENO_P) + ', ct:' + JSON.stringify(VENENO_T)
    + ', funcao:"", nota:"", g:""}]');
  janela.pintarElementos('');
  assert.deepEqual(intrusos('el-lista'), []);
  assert.equal(janela.__mau, undefined);
  janela.eval('ELEMENTOS = []');
});

test('nem uma ocorrência importada inteira, com veneno em todo o lado', semAplicacao, () => {
  // O caminho mais realista: o ficheiro que chega de outro posto de comando.
  janela.eval('O = novoEstado()');
  janela.escreverForm(); janela.pintarTudo();
  const antes = intrusos(doc().body);
  const O = avaliar(janela, 'O');
  O.meta.num = VENENO_P; O.meta.local = VENENO_D; O.meta.pco = VENENO_T;
  O.meta.pasta = VENENO_D; O.meta.subregiao = VENENO_P;
  O.dados.sensiveis = VENENO_T; O.dados.setores = VENENO_D;
  O.evolucao.push({ g: '301200AGO26', tipo: 'posit', txt: VENENO_T });
  O.fita.push({ g: '301200AGO26', e: VENENO_D });
  O.pco.funcoes.push({ f: 'COS', nome: VENENO_D, entidade: VENENO_P, ct: VENENO_T,
    siresp: VENENO_D, ba: '', solicitado: '', g: '301200AGO26' });
  janela.escreverForm();
  janela.pintarTudo();

  // A página tem elementos seus com `onclick` e um `<script>`; o que interessa é o que
  // apareceu **por causa** do veneno, e por isso compara-se com o retrato de antes.
  assert.deepEqual(intrusos(doc().body), antes, 'um campo criou marcação nova na página');
  assert.equal(janela.__mau, undefined, 'um ficheiro importado conseguiu executar código');
});

/* ---- e a forma perigosa não volta a entrar ---- */

const modulos = (() => {
  const raiz = 'fonte';
  const out = [];
  for (const zona of readdirSync(raiz, { withFileTypes: true })) {
    if (!zona.isDirectory()) continue;
    for (const f of readdirSync(join(raiz, zona.name))) {
      out.push([join(raiz, zona.name, f), readFileSync(join(raiz, zona.name, f), 'utf8')]);
    }
  }
  out.push(['fonte/molde.html', readFileSync('fonte/molde.html', 'utf8')]);
  return out;
})();

test('nenhum manipulador de eventos em linha leva texto lá dentro', semAplicacao, () => {
  // `onclick="f('${x}')"` é a forma que deixou executar código pelo número da ocorrência.
  // Índices e contadores numéricos ficam: não há aspa que os feche.
  const maus = [];
  for (const [nome, texto] of modulos) {
    for (const m of texto.matchAll(/\son[a-z]+="[^"]*\$\{([^}]*)\}/g)) {
      const dentro = m[1].trim();
      const numerico = /^[a-z]$|^[a-z]\.n$|^\+?[a-z][a-zA-Z0-9_.]*$/.test(dentro)
        && !/esc\(|nome|num|local|txt|des|nota|ct\b|cmd/.test(dentro);
      const comAspas = /'|"/.test(m[0].slice(m[0].indexOf('${')));
      if (!numerico || comAspas) maus.push(nome + ': ' + m[0].trim());
    }
  }
  assert.deepEqual(maus, [], 'manipuladores em linha com dados interpolados');
});

test('todo o atributo com dados passa pelo escape', semAplicacao, () => {
  // Um `value="${x.cmd}"` sem `esc` é o buraco outra vez, e é fácil de escrever sem dar
  // por isso. Índices e números continuam a poder entrar crus.
  const maus = [];
  // A regra é quase absoluta: só contadores de ciclo entram crus. Escapar um número não
  // custa nada, e a exceção que se abre hoje é a que amanhã leva um nome lá dentro.
  const CRUS = /^(i|j|k|n)$/;
  for (const [nome, texto] of modulos) {
    for (const m of texto.matchAll(/\s(value|title|placeholder|alt|aria-label|href|src|data-[a-z-]+)="([^"]*)"/g)) {
      for (const v of m[2].matchAll(/\$\{([^}]+)\}/g)) {
        const dentro = v[1].trim();
        if (/esc\(/.test(dentro) || CRUS.test(dentro)) continue;
        if (/^[A-Z_]+\[/.test(dentro) || /^\d/.test(dentro)) continue;
        maus.push(nome + ': ' + m[1] + '="…${' + dentro + '}…"');
      }
    }
  }
  assert.deepEqual(maus, [], 'atributos com dados sem escape');
});

test('nenhum dos venenos entra pelo mapa — nem no nome do ponto nem no serviço', semAplicacao, async () => {
  /* Superfície nova da r0066: o nome de um ponto notável é campo livre, e vai parar a
     um SVG e a uma lista. `VENENOS` sopra os três de uma vez, em vez de se escolher um. */
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,0975'; O.meta.lon = '-7,8103';
  const d = 0.012, lat = 41.0975, lon = -7.8103;
  janela.guardarPerimetro({ type: 'Polygon', coordinates: [[[lon - d, lat - d], [lon + d, lat - d],
    [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]]] }, 'to.geojson');
  janela.escreverForm();

  VENENOS.forEach((v, i) => janela.marcarPonto('outro', 41.09 + i / 1000, -7.81, v));
  janela.pintarPontos();
  assert.deepEqual(intrusos('mapa-pontos'), [], 'o nome do ponto criou marcação na lista');

  /* O SVG julga-se depois de o navegador o interpretar, e não por procura de texto: o
     nome escapado contém a palavra «onfocus» como texto, e isso é inofensivo. O que não
     pode existir é o **atributo**. */
  janela.enquadrarMapa(640, 620);
  const caixa = janela.document.createElement('div');
  caixa.innerHTML = janela.camadaMapa();
  assert.deepEqual(intrusos(caixa), [], 'o nome do ponto criou marcação no SVG do mapa');
  VENENOS.forEach((v) => assert.ok(!janela.camadaMapa().includes(v),
    'veneno intacto no SVG: ' + v.slice(0, 20)));

  /* E a atribuição do serviço, que é texto de terceiros mostrado por baixo do mapa. */
  await janela.guardarCarta('https://c/{z}/{x}/{y}.png', VENENOS[2], 'https://t', 19);
  const M = avaliar(janela, 'MAPA');
  M.pronto = true; M.falhas = 0; M.recusados = 0;
  janela.pintarEstadoMapa(1, 1);
  assert.deepEqual(intrusos('mapa-info'), [], 'a atribuição criou marcação');
  await janela.retirarCarta();
});
