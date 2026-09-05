// Duas portas por onde entra coisa de fora: a hora do serviço de previsão, e as chaves
// de um ficheiro importado.
//
// A hora: com `timezone=Europe/Lisbon` o Open-Meteo devolvia `"2026-09-04T18:00"`, sem
// designador de fuso, e `new Date` de uma cadeia dessas lê-a no fuso do equipamento. O
// rótulo saía certo por acaso — `getHours()` desfazia o que a leitura tinha feito —, mas
// o *instante* saía errado pelo desvio do fuso, e é o instante que decide que horas já
// passaram. Medido: a mesma cadeia dá o mesmo `getHours()` e três instantes diferentes em
// Lisboa, em UTC e em São Paulo.
//
// As chaves: `__proto__`, `constructor` e `prototype` chegam de `JSON.parse` como
// propriedades próprias e não disparam setter nenhum; o dano faz-se no primeiro
// `Object.assign` da migração 0, que copia por [[Set]] e aí troca o protótipo do objeto
// de destino. Não é poluição global do `Object.prototype` — é o registo a passar a ter
// campos que ninguém escreveu.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);

/* ---- a hora do Open-Meteo ---- */

// 4 de setembro de 2026, 18:00 em Lisboa. Em setembro Portugal continental está em WEST,
// isto é, UTC+1: o epoch correspondente é 17:00Z e o desvio 3600 s.
const EPOCH_1800_LISBOA = Date.UTC(2026, 8, 4, 17, 0, 0) / 1000;

test('o pedido pede o epoch, e não o ISO sem fuso', semAplicacao, async () => {
  const { readFile } = await import('node:fs/promises');
  const fonte = await readFile('fonte/3-planeamento/12-meteorologia-automatica.js', 'utf8');
  assert.match(fonte, /timeformat=unixtime/, 'sem isto a resposta volta a trazer horas ambíguas');
});

test('a hora de parede sai certa e o instante também', semAplicacao, () => {
  const r = av(`lerHoraOpenMeteo(${EPOCH_1800_LISBOA}, 3600)`);
  assert.equal(r.hora, 18, 'a hora de parede em Lisboa é 18');
  assert.equal(r.data, '04/09/2026');
  assert.equal(r.ts, EPOCH_1800_LISBOA * 1000, 'e o instante é o epoch, sem passar pelo fuso do equipamento');
});

test('o desvio do fuso é o do serviço, e não o do equipamento', semAplicacao, () => {
  // O mesmo instante lido com o desvio de inverno dá 17 h, não 18. É esta diferença que
  // o formato ISO sem designador não conseguia exprimir.
  const verao = av(`lerHoraOpenMeteo(${EPOCH_1800_LISBOA}, 3600)`);
  const inverno = av(`lerHoraOpenMeteo(${EPOCH_1800_LISBOA}, 0)`);
  assert.equal(verao.hora, 18);
  assert.equal(inverno.hora, 17);
  assert.equal(verao.ts, inverno.ts, 'o instante não muda: muda só como se lê o relógio de parede');
});

test('uma resposta sem utc_offset_seconds rebenta em vez de adivinhar', semAplicacao, () => {
  assert.throws(() => av(`lerHoraOpenMeteo(${EPOCH_1800_LISBOA}, undefined)`), /utc_offset_seconds/);
  assert.throws(() => av('lerHoraOpenMeteo("2026-09-04T18:00", 3600)'), /numérico/);
});

/* ---- as chaves recusadas ---- */

// O pacote escreve-se **em texto**, e não com um literal de JavaScript passado por
// `JSON.stringify`. Num literal, `__proto__:` é a sintaxe que define o protótipo do
// objeto: não cria propriedade própria nenhuma, e o `JSON.stringify` que se lhe seguisse
// deitava fora o veneno antes de a aplicação o ver. Um teste escrito assim passava sem
// exercitar nada — e foi o que aconteceu à primeira versão deste ficheiro.
const PACOTE_ENVENENADO = String.raw`{
  "tipo": "peaapp:ocorrencia",
  "estado": {
    "versao": 0,
    "meta": { "num": "2026-000123", "local": "Moimenta da Beira" },
    "dados": { "topo": { "__proto__": { "intruso": "não fui escrito por ninguém" } } },
    "pco": { "constructor": { "intruso": 2 } },
    "evolucao": [{ "g": "041800SET26", "tipo": "posit", "txt": "ok", "prototype": { "intruso": 3 } }]
  }
}`;

/** Um pacote de ocorrência exportável, com o veneno onde ele faz efeito. */
function pacoteEnvenenado() {
  return PACOTE_ENVENENADO;
}

test('o pacote de teste leva mesmo as chaves — senão nada abaixo prova nada', semAplicacao, () => {
  const est = JSON.parse(PACOTE_ENVENENADO).estado;
  assert.equal(
    Object.prototype.hasOwnProperty.call(est.dados.topo, '__proto__'),
    true,
    'sem uma propriedade própria `__proto__` no pacote, os testes seguintes passam por vazio',
  );
  assert.equal(Object.prototype.hasOwnProperty.call(est.pco, 'constructor'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(est.evolucao[0], 'prototype'), true);
});

test('as três chaves saem do pacote, e a ocorrência entra na mesma', semAplicacao, () => {
  const r = av(`(()=>{ const m = lerPacoteDeObjeto(JSON.parse(${JSON.stringify(pacoteEnvenenado())}));
    return JSON.stringify({ num:m.meta.num, forma:m.__forma,
      topoProto: Object.getPrototypeOf(m.dados.topo) === Object.prototype,
      intruso: m.dados.topo.intruso === undefined && m.pco.intruso === undefined }); })()`);
  const q = JSON.parse(r);
  assert.equal(q.num, '2026-000123', 'a ocorrência não se recusa por causa da chave: recusa-se a chave');
  assert.equal(q.topoProto, true, 'o protótipo de dados.topo tem de continuar a ser o normal');
  assert.equal(q.intruso, true, 'e nenhum campo fantasma pode ter sobrevivido à migração');
  assert.ok(
    q.forma.some((x) => /chaves? recusadas?/.test(x)),
    'quem importou tem de ficar a saber, na mesma linha das correções de forma: ' + JSON.stringify(q.forma),
  );
});

test('sem a limpeza, a migração 0 troca mesmo o protótipo e expõe o campo', semAplicacao, () => {
  // Este é o teste que prova que a correção corrige alguma coisa. Corre-se o degrau 0
  // sozinho, que é onde está o `Object.assign`, sobre um estado por limpar.
  const r = av(`(()=>{ const g = JSON.parse(${JSON.stringify(PACOTE_ENVENENADO)}).estado;
    const e = MIGRACOES[0](g);
    return JSON.stringify({ trocado: Object.getPrototypeOf(e.dados.topo) !== Object.prototype,
      campo: e.dados.topo.intruso }); })()`);
  const q = JSON.parse(r);
  assert.equal(q.trocado, true, 'se isto deixar de ser verdade, a porta que se fechou já não existia');
  assert.equal(q.campo, 'não fui escrito por ninguém', 'e o campo fantasma é legível no estado');
});

test('só o __proto__ tem acessor: as outras duas entram como campos banais', semAplicacao, () => {
  // Medido, para que ninguém leia esta correção como sendo maior do que é.
  const r = av(`(()=>{ const g = JSON.parse(${JSON.stringify(PACOTE_ENVENENADO)}).estado;
    const e = MIGRACOES[0](g);
    return Object.getPrototypeOf(e.pco) !== Object.prototype; })()`);
  assert.equal(r, false, '`constructor` não troca protótipo nenhum — recusa-se por outra razão');
});

test('o Object.prototype global fica intacto, antes e depois', semAplicacao, () => {
  // Nunca esteve em risco — `JSON.parse` não dispara o setter — e é preciso dizê-lo, para
  // que ninguém volte a ler esta correção como sendo maior do que é.
  assert.equal(av('({}).intruso === undefined'), true);
  av(`lerPacoteDeObjeto(JSON.parse(${JSON.stringify(pacoteEnvenenado())}))`);
  assert.equal(av('({}).intruso === undefined'), true);
});

test('a limpeza corre também no arquivo do dispositivo e nas cópias', semAplicacao, () => {
  // `migrarGravado` é o sítio por onde passam os três caminhos de entrada. Um estado
  // envenenado gravado por uma revisão anterior continua no arquivo depois de a porta
  // fechar, e é por aqui que ele volta a passar.
  const r = av(`(()=>{ const g = JSON.parse(${JSON.stringify(
    JSON.stringify({ versao: 0, meta: { num: 'X' }, dados: { topo: { __proto__: { intruso: 1 } } } }),
  )});
    const m = migrarGravado(g);
    return Object.getPrototypeOf(m.dados.topo) === Object.prototype && m.dados.topo.intruso === undefined; })()`);
  assert.equal(r, true, 'a rede de segurança de migrarGravado tem de apanhar o que não veio por importação');
});

test('a limpeza conta o que tirou, e não mexe no que é dado', semAplicacao, () => {
  const n = av(`(()=>{ const o = JSON.parse('{"a":{"__proto__":{"x":1}},"b":[{"prototype":2}],"c":"texto","d":7};'.slice(0,-1));
    return limparChavesRecusadas(o,0) + "|" + o.c + "|" + o.d + "|" + JSON.stringify(Object.keys(o.a)); })()`);
  assert.equal(n, '2|texto|7|[]', 'duas chaves tiradas, e o resto do estado como estava');
});
