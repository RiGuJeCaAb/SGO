// O estado da gravação, e uma aba a escrever de cada vez.
//
// As duas auditorias de 4 de setembro apontaram, e a fonte confirmou: `persistir` nunca
// lançava e 70 das 81 chamadas não esperavam por ela — uma gravação falhada era
// indistinguível de uma boa. E duas abas na mesma ocorrência escreviam a mesma chave, a
// última a fechar ganhava, em silêncio.
//
// O jsdom não tem `navigator.locks` nem `BroadcastChannel`, e isso é útil para metade do
// que aqui se prova: o caminho sem trincos tem de assumir a escrita como sempre. A outra
// metade — trinco ocupado, trinco roubado — prova-se com um `navigator.locks` de mentira,
// injetado na janela. O que o Chromium faz a sério com dois separadores está em
// `ferramentas/prova-abas.mjs`, e as imagens em `docs/qa/`.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);

beforeEach(() => {
  if (!janela) return;
  av('O = novoEstado(); O.meta.num = "2026-T"; escreverForm(); if(emLeitura()) sairDeLeitura(); GRAVACAO.estado="nada"; GRAVACAO.g=""; GRAVACAO.erro=""; GRAVACAO.emCurso=0; pintarGravacao();');
});

/* ---- persistir devolve, e o cabeçalho diz ---- */

test('persistir devolve que gravou, e o cabeçalho passa a «gravado» com hora', semAplicacao, async () => {
  const r = await av('persistir(false)');
  assert.equal(r.ok, true);
  assert.equal(av('GRAVACAO.estado'), 'gravado');
  assert.match(av('$("grav").textContent'), /^Gravado \d\d:\d\d$/);
  assert.equal(av('$("grav").className'), 'grav ok');
});

test('uma gravação falhada devolve o motivo e fica à vista, sem lançar', semAplicacao, async () => {
  av('window.__sv = ARMAZEM.setVarias; ARMAZEM.setVarias = async ()=>{ throw new Error("disco cheio de propósito"); };');
  let r;
  try {
    r = await av('persistir(false)');
  } finally {
    av('ARMAZEM.setVarias = window.__sv; delete window.__sv;');
  }
  assert.equal(r.ok, false, 'a chamada não lança — devolve');
  assert.match(r.erro, /disco cheio/);
  assert.equal(av('GRAVACAO.estado'), 'falhou');
  assert.equal(av('$("grav").textContent'), 'NÃO GRAVADO');
  assert.match(av('$("grav").title'), /disco cheio de propósito/, 'o motivo tem de estar ao alcance');
  // A seguinte, boa, limpa o estado: o indicador diz o que é agora, não o que foi.
  const r2 = await av('persistir(false)');
  assert.equal(r2.ok, true);
  assert.equal(av('GRAVACAO.estado'), 'gravado');
});

test('várias gravações sobrepostas só voltam a «gravado» quando a última acaba', semAplicacao, async () => {
  av(`window.__sv = ARMAZEM.setVarias; window.__solta = [];
      ARMAZEM.setVarias = () => new Promise(res => window.__solta.push(res));`);
  av('window.__p1 = persistir(false); window.__p2 = persistir(false);');
  assert.equal(av('GRAVACAO.emCurso'), 2);
  assert.equal(av('GRAVACAO.estado'), 'a-gravar');
  av('window.__solta[0]({atomico:false})');
  await av('window.__p1');
  assert.equal(av('GRAVACAO.estado'), 'a-gravar', 'a primeira acabou mas a segunda ainda corre');
  av('window.__solta[1]({atomico:false})');
  await av('window.__p2');
  assert.equal(av('GRAVACAO.estado'), 'gravado');
  av('ARMAZEM.setVarias = window.__sv; delete window.__sv; delete window.__solta; delete window.__p1; delete window.__p2;');
});

/* ---- a aba em leitura ---- */

test('em leitura, persistir recusa sem tocar no armazém, e os campos ficam inertes', semAplicacao, async () => {
  av('window.__n = 0; window.__sv = ARMAZEM.setVarias; ARMAZEM.setVarias = async p => { window.__n++; return window.__sv(p); };');
  av('entrarEmLeitura("Outra aba desta aplicação já está a escrever.")');
  const r = await av('persistir(false)');
  av('ARMAZEM.setVarias = window.__sv;');
  assert.equal(r.ok, false);
  assert.match(r.erro, /leitura/);
  assert.equal(av('window.__n'), 0, 'nem uma escrita pode ter chegado ao armazém');
  assert.equal(av('$("o-num").disabled'), true, 'o campo tem de estar inerte');
  assert.equal(av('$("leitura-faixa").style.display'), 'block');
  assert.match(av('$("leitura-txt").textContent'), /não grava/);
  assert.equal(av('$("grav").textContent'), 'Só leitura');
  assert.equal(av('document.documentElement.classList.contains("leitura")'), true);
  assert.equal(av('document.documentElement.classList.contains("encerrada")'), false, 'leitura não é encerramento');
  av('delete window.__n; delete window.__sv;');
});

test('sair de leitura devolve os campos e o indicador', semAplicacao, () => {
  av('entrarEmLeitura("x"); sairDeLeitura();');
  assert.equal(av('$("o-num").disabled'), false);
  assert.equal(av('$("leitura-faixa").style.display'), 'none');
  assert.equal(av('document.documentElement.classList.contains("leitura")'), false);
});

test('os controlos que o encerramento deixa livres continuam livres em leitura', semAplicacao, () => {
  // Ver o teatro, conferir o diário, assumir o teclado: leitura não os tira.
  av('entrarEmLeitura("x")');
  const livres = av('ENC_LIVRES.map(x=>x.id).filter(id=>$(id)).filter(id=>$(id).disabled).join(",")');
  av('sairDeLeitura()');
  assert.equal(livres, '', 'inertes que deviam estar livres: ' + livres);
});

/* ---- o trinco, com um navigator.locks de mentira ---- */

/**
 * Injeta um `navigator.locks` falso. `disponivel` diz se o pedido `ifAvailable` o obtém.
 *
 * `async`, e o `fn` esperado dentro do `try`: na primeira versão o `finally` apagava o
 * trinco falso assim que `fn` devolvia a promessa, antes de ela correr — e o teste do
 * roubo rebentava a procurar um pedido pendente que já tinha sido apagado.
 */
async function comTrincoFalso(disponivel, fn) {
  av(`window.__pendentes = [];
      Object.defineProperty(navigator, "locks", { configurable:true, value:{
        request(nome, opts, cb){
          if(opts && opts.steal){ window.__roubado = nome; const p = cb({name:nome}); return Promise.resolve(p); }
          if(!${disponivel ? 'true' : 'false'}){ return Promise.resolve(cb(null)); }
          const p = cb({name:nome});
          return new Promise((res, rej)=>{ window.__pendentes.push({res, rej}); });
        }
      }});`);
  try { return await fn(); }
  finally {
    av('delete navigator.locks; delete window.__pendentes; delete window.__roubado;');
  }
}

test('sem navigator.locks, a aba assume a escrita como sempre', semAplicacao, async () => {
  assert.equal(av('!!navigator.locks'), false, 'o jsdom não tem trincos: é o caminho do recuo');
  const r = await av('pedirTrincoDeEscrita()');
  assert.equal(r, 'sem-trincos');
  assert.equal(av('emLeitura()'), false);
});

test('com o trinco livre, a aba escreve', semAplicacao, async () => {
  const r = await comTrincoFalso(true, () => av('arrancarEscritaPorUmaAba()'));
  assert.equal(r, 'obtido');
  assert.equal(av('emLeitura()'), false);
});

test('com o trinco ocupado, a aba nasce em leitura', semAplicacao, async () => {
  const r = await comTrincoFalso(false, () => av('arrancarEscritaPorUmaAba()'));
  assert.equal(r, 'ocupado');
  assert.equal(av('emLeitura()'), true);
  assert.match(av('LEITURA.motivo'), /já está a escrever/);
});

test('quando outra aba rouba o trinco, esta passa a leitura e regista-o na fita', semAplicacao, async () => {
  av('O.fita = [];');
  await comTrincoFalso(true, async () => {
    const r = await av('pedirTrincoDeEscrita()');
    assert.equal(r, 'obtido');
    // A outra aba rouba: o pedido desta rejeita com AbortError.
    av('window.__pendentes[0].rej(Object.assign(new Error("roubado"), {name:"AbortError"}))');
    await new Promise((r) => setTimeout(r, 20));
  });
  assert.equal(av('emLeitura()'), true);
  assert.match(av('LEITURA.motivo'), /assumiu a escrita/);
  assert.match(av('O.fita.map(x=>x.e).join("|")'), /passou a leitura/);
});

test('assumir a escrita rouba o trinco e devolve a aba à escrita', semAplicacao, async () => {
  av('entrarEmLeitura("x")');
  const r = await comTrincoFalso(false, () => av('assumirEscrita()'));
  assert.equal(r, 'obtido');
  assert.equal(av('emLeitura()'), false);
  assert.equal(av('$("o-num").disabled'), false);
});

/* ---- o canal entre abas ---- */

test('a aba em leitura repõe do arquivo quando a outra grava a mesma ocorrência', semAplicacao, async () => {
  av('window.__c = carregar; window.__pedido = null; window.carregar = async n => { window.__pedido = n; };');
  av('entrarEmLeitura("x")');
  assert.equal(await av('receberDeOutraAba({tipo:"gravado", num:"2026-T"})'), true);
  assert.equal(av('window.__pedido'), '2026-T');
  // Outra ocorrência: não é para aqui.
  av('window.__pedido = null;');
  assert.equal(await av('receberDeOutraAba({tipo:"gravado", num:"2026-OUTRA"})'), false);
  assert.equal(av('window.__pedido'), null);
  // A aba que escreve não reage: é a fonte.
  av('sairDeLeitura()');
  assert.equal(await av('receberDeOutraAba({tipo:"gravado", num:"2026-T"})'), false);
  av('window.carregar = window.__c; delete window.__c; delete window.__pedido;');
});
