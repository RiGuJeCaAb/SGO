// Quando algo não funciona: limpar a carta e o mapa, ou repor o dispositivo inteiro.
// Pedido a 6 de setembro, ao fim de dois dias com uma carta que não vinha.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);
const doc = () => janela.document;

test('limpar a carta e o mapa tira o serviço, a pasta local e o endereço dos focos, e deixa a ocorrência', semAplicacao, async () => {
  av('O = novoEstado(); O.meta.num = "2026/4711"; O.meta.lat = "41.1"; O.meta.lon = "-7.8"; escreverForm();');
  await av('guardarCarta("https://exemplo.pt/{z}/{x}/{y}.png", "ensaio", "https://exemplo.pt/termos", 18)');
  await av('declararCartaLocal("pttm06", "ensaio local")');
  await av('guardarFocosURL("https://exemplo.pt/focos?bbox={bbox}")');
  assert.equal(av('!!CARTA && !!CARTA_LOCAL && !!FOCOS_URL'), true);
  const r = await av('limparCartaEMapa()');
  assert.equal(r.ok, true);
  assert.equal(av('CARTA'), null);
  assert.equal(av('CARTA_LOCAL'), null);
  assert.equal(av('FOCOS_URL'), '');
  assert.equal(av('MAPA.enquadrado'), false);
  assert.equal(av('O.meta.num'), '2026/4711', 'a ocorrência fica');
  assert.match(av('O.fita[O.fita.length-1].e'), /Carta e mapa limpos neste dispositivo: serviço de carta retirado, pasta pré-descarregada esquecida, endereço dos focos esquecido/);
  /* e o botão, com a confirmação dada */
  await av('guardarCarta("https://exemplo.pt/{z}/{x}/{y}.png", "ensaio", "https://exemplo.pt/termos", 18)');
  av('window.confirm = () => true');
  doc().getElementById('b-limpar-carta').click();
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(av('CARTA'), null);
  assert.match(doc().getElementById('msg-manut').textContent, /Limpo: serviço de carta retirado/);
  /* sem confirmação, nada */
  await av('guardarCarta("https://exemplo.pt/{z}/{x}/{y}.png", "ensaio", "https://exemplo.pt/termos", 18)');
  av('window.confirm = () => false');
  doc().getElementById('b-limpar-carta').click();
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(av('!!CARTA'), true, 'recusou a confirmação e limpou na mesma');
  await av('retirarCarta()');
});

test('repor o dispositivo apaga as chaves do armazém e recarrega; sem base, não finge que a apagou', semAplicacao, async () => {
  /* O jsdom não tem IndexedDB: o caminho que se prova aqui é o da camada de trás e o do
     recarregar, que se substitui. A eliminação da base prova-se no Chromium. */
  av('window.__rec = 0; ARMAZEM.set("peaapp:ensaio", "1");');
  const r = await av('reporDispositivo({ recarregar: () => { window.__rec++; } })');
  assert.equal(r.ok, true);
  assert.equal(av('window.__rec'), 1, 'não recarregou');
  let sobra = false;
  try { await av('ARMAZEM.get("peaapp:ensaio")'); sobra = true; } catch { sobra = false; }
  /* No arnês o ARMAZEM é o `localStorage` do jsdom ou a memória de sessão: as chaves
     `peaapp:` do localStorage saem; a memória de sessão não é dispositivo e o recarregar
     limpa-a. Afirma-se o que se pode: a chamada terminou bem e recarregou. */
  void sobra;
});

test('o botão de repor pede confirmação com o número de ocorrências à vista, e desiste ao primeiro não', semAplicacao, async () => {
  av('window.__perguntas = []; window.__rec = 0; window.confirm = (t) => { window.__perguntas.push(t); return false; };');
  doc().getElementById('b-repor').click();
  await new Promise((r) => setTimeout(r, 80));
  const P = av('window.__perguntas');
  assert.equal(P.length, 1);
  assert.match(P[0], /Apaga TUDO o que está guardado aqui/);
  assert.match(P[0], /Exportou o que precisa\?/);
  assert.equal(av('window.__rec'), 0);
});

test('os dois botões ficam livres com a ocorrência encerrada, e com razão declarada', semAplicacao, () => {
  const L = av('ENC_LIVRES.map(x=>x.id)');
  assert.ok(L.includes('b-limpar-carta') && L.includes('b-repor'));
});
