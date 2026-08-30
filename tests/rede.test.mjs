// Correção 4.5 — a rede como caminho de falha, não de exceção.
// Num PCO a ligação é intermitente. Um pedido sem prazo máximo deixa a interface
// à espera de algo que não vem, e um pedido repetido gasta a ligação que há.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const REDE = () => avaliar(janela, 'REDE');

/** Substitui o fetch da janela e conta as idas à rede. */
function fingirRede(resposta) {
  const chamadas = [];
  janela.fetch = (url, opts) => {
    chamadas.push({ url, opts });
    return resposta(url, opts);
  };
  return chamadas;
}

const respostaOk = (corpo = '{}') => async () => new Response(corpo, { status: 200 });

beforeEach(() => {
  if (!janela) return;
  REDE().cache.clear();
  Object.defineProperty(janela.navigator, 'onLine', { value: true, configurable: true });
});

test('uma resposta boa passa tal como o fetch a daria', semAplicacao, async () => {
  fingirRede(respostaOk('{"a":1}'));
  const r = await janela.fetchT('https://exemplo/1');
  assert.equal(r.ok, true);
  assert.deepEqual(await r.json(), { a: 1 });
});

test('um pedido idêntico não se repete enquanto a resposta ainda serve', semAplicacao, async () => {
  const chamadas = fingirRede(respostaOk('{"a":1}'));
  const primeira = await (await janela.fetchT('https://exemplo/2')).json();
  const segunda = await (await janela.fetchT('https://exemplo/2')).json();
  assert.equal(chamadas.length, 1, 'devia ter ido à rede uma só vez');
  assert.deepEqual(primeira, segunda, 'e devolver o mesmo das duas vezes');
});

test('dois pedidos iguais em simultâneo partilham a mesma ida à rede', semAplicacao, async () => {
  const chamadas = fingirRede(respostaOk('{"a":1}'));
  const [a, b] = await Promise.all([janela.fetchT('https://exemplo/3'), janela.fetchT('https://exemplo/3')]);
  assert.equal(chamadas.length, 1);
  assert.deepEqual(await a.json(), await b.json());
});

test('pedidos diferentes vão os dois à rede', semAplicacao, async () => {
  const chamadas = fingirRede(respostaOk());
  await janela.fetchT('https://exemplo/4');
  await janela.fetchT('https://exemplo/5');
  assert.equal(chamadas.length, 2);
});

test('um POST nunca é servido da cache', semAplicacao, async () => {
  const chamadas = fingirRede(respostaOk());
  await janela.fetchT('https://exemplo/6', { method: 'POST' });
  await janela.fetchT('https://exemplo/6', { method: 'POST' });
  assert.equal(chamadas.length, 2);
});

test('uma recusa da origem não fica guardada', semAplicacao, async () => {
  const chamadas = fingirRede(async () => new Response('', { status: 429 }));
  const r = await janela.fetchT('https://exemplo/7');
  assert.equal(r.ok, false, 'quem chama continua a ver r.ok');
  await janela.fetchT('https://exemplo/7');
  assert.equal(chamadas.length, 2, 'uma recusa não se guarda');
  assert.equal(REDE().ultimo.motivo, 'recusado');
});

test('sem ligação responde já, sem esperar pelo prazo', semAplicacao, async () => {
  const chamadas = fingirRede(respostaOk());
  Object.defineProperty(janela.navigator, 'onLine', { value: false, configurable: true });
  await assert.rejects(() => janela.fetchT('https://exemplo/8'), (e) => e.motivo === 'sem-rede');
  assert.equal(chamadas.length, 0, 'não se tenta sequer a ida à rede');
});

test('o prazo esgotado cancela o pedido e diz porquê', semAplicacao, async () => {
  fingirRede((url, opts) => new Promise((_, rejeitar) => {
    opts.signal.addEventListener('abort', () => {
      const e = new Error('abortado'); e.name = 'AbortError'; rejeitar(e);
    });
  }));
  await assert.rejects(() => janela.fetchT('https://exemplo/9', {}, 40), (e) => e.motivo === 'tempo-esgotado');
  assert.equal(REDE().ultimo.motivo, 'tempo-esgotado');
});

test('cada motivo tem frase própria', semAplicacao, () => {
  const frase = (motivo, extra = {}) => janela.motivoRede(Object.assign(new Error(''), { motivo }, extra));
  assert.match(frase('sem-rede'), /sem ligação de dados/);
  assert.match(frase('tempo-esgotado'), /não respondeu dentro do prazo/);
  assert.match(frase('recusado', { estado: 429 }), /recusou o pedido \(429\)/);
  assert.match(frase('falhou'), /falha de rede/);
});

test('a resposta guardada deixa de servir passada a validade', semAplicacao, async () => {
  const chamadas = fingirRede(respostaOk());
  await janela.fetchT('https://exemplo/10');
  const guardado = REDE().cache.get('https://exemplo/10');
  guardado.ts -= REDE().validade + 1000;
  await janela.fetchT('https://exemplo/10');
  assert.equal(chamadas.length, 2);
});
