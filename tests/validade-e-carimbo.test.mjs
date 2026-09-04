// Quatro achados das análises externas de 4 de setembro, cada um exercitado pelo sintoma.
//
// A validade: havia um `Math.max(ts, agora + 3600000)` a impor uma hora de vigência mínima.
// Medido antes de sair — às 17h50, com a janela a fechar às 18h00, o plano declarava-se
// válido até às 18h50, cinquenta minutos para lá do gatilho que a própria aplicação tinha
// identificado. Um limite de segurança não se prolonga para o documento ficar mais
// confortável de ler.
//
// O carimbo: `canonico` percorria as chaves próprias, e por isso um objeto com o protótipo
// substituído dava o mesmo SHA-256 do objeto limpo — enquanto os campos herdados se liam no
// ecrã, se imprimiam no PEA e saíam na exportação. O carimbo dizia «confere» por cima de
// conteúdo que ninguém escreveu.
//
// A folha: `colocarFolha` abria a `blob:` URL da imagem antes de conferir a projeção, e as
// saídas por recusa não a revogavam. Numa folha digitalizada são megabytes presos ao
// separador.
//
// Os controlos: seis listas construíam `div` e `span` com `onclick` embutido.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);

/* ---- validade ---- */

/** Corre `expr` com o relógio parado em `hh:mm` de hoje. */
function comRelogioEm(hh, mm, expr) {
  return av(`(()=>{
    const b = new Date(); b.setHours(${hh}, ${mm}, 0, 0);
    const real = Date.now; Date.now = () => b.getTime();
    try { return (${expr}); } finally { Date.now = real; }
  })()`);
}

test('a validade nunca ultrapassa o fecho da janela', semAplicacao, () => {
  // O caso exacto que a análise mediu: 17h50, janela a fechar às 18h00.
  const r = comRelogioEm(17, 50, `(()=>{
    const ts = horizonteValidade({ janela:{inicio:"14", fim:"18"}, rotacoes:[] });
    const fecho = new Date(); fecho.setHours(18,0,0,0);
    return ts - fecho.getTime();
  })()`);
  assert.equal(r, 0, 'a validade tem de bater certo com o fecho, e não estendê-lo em 50 minutos');
});

test('a validade nunca ultrapassa a próxima rotação de vento', semAplicacao, () => {
  const r = comRelogioEm(17, 50, `(()=>{
    const ts = horizonteValidade({ janela:{inicio:"10", fim:"23"}, rotacoes:[{h:"18"}] });
    const rot = new Date(); rot.setHours(18,0,0,0);
    return ts - rot.getTime();
  })()`);
  assert.equal(r, 0);
});

test('sem gatilho nenhum, o tecto continua a ser de seis horas', semAplicacao, () => {
  const r = comRelogioEm(9, 0, 'horizonteValidade({}) - Date.now()');
  assert.equal(r, 6 * 3600000);
});

test('um horizonte curto é dito, e não esticado', semAplicacao, () => {
  const agora = 1_000_000_000_000;
  assert.equal(av(`avisoValidadeCurta(${agora + 10 * 60000}, ${agora})`).includes('10 minutos'), true);
  assert.match(av(`avisoValidadeCurta(${agora - 1}, ${agora})`), /esgotada à nascença/);
  assert.equal(av(`avisoValidadeCurta(${agora + 6 * 3600000}, ${agora})`), '', 'seis horas não é curto');
  assert.equal(av(`avisoValidadeCurta(${agora + 59 * 60000}, ${agora})`) !== '', true, '59 minutos é curto');
  assert.equal(av(`avisoValidadeCurta(${agora + 60 * 60000}, ${agora})`), '', 'uma hora certa já não é');
});

/* ---- carimbo ---- */

test('um protótipo substituído muda o resumo, em vez de escapar dele', semAplicacao, () => {
  const r = av(`(()=>{
    const limpo = { a:1 };
    const sujo = Object.setPrototypeOf({ a:1 }, { fantasma:"não fui escrito por ninguém" });
    return JSON.stringify({
      mesmoResumo: resumoEstado(limpo) === resumoEstado(sujo),
      canonicoSujo: canonico(sujo),
      lidoNoEcra: sujo.fantasma
    });
  })()`);
  const q = JSON.parse(r);
  assert.equal(q.lidoNoEcra, 'não fui escrito por ninguém', 'o campo herdado lê-se — é esse o problema');
  assert.equal(q.mesmoResumo, false, 'e por isso não pode dar o mesmo carimbo do objeto limpo');
  assert.match(q.canonicoSujo, /fantasma/, 'o resumo tem de cobrir o que se lê');
});

test('o resumo de um objeto normal não mudou', semAplicacao, () => {
  // `for...in` e `Object.keys` dão o mesmo conjunto num objeto sem protótipo mexido, porque
  // o `Object.prototype` não tem nada enumerável. Se isto falhar, todos os carimbos já
  // emitidos deixaram de conferir — e essa é a razão de o teste existir.
  assert.equal(av('canonico({b:2, a:1, c:{e:4, d:3}})'), '{"a":1,"b":2,"c":{"d":3,"e":4}}');
  assert.equal(av('canonico([{b:1,a:2}])'), '[{"a":2,"b":1}]');
});

test('o resumo continua a não depender da ordem de escrita das chaves', semAplicacao, () => {
  assert.equal(av('resumoEstado({a:1, b:2}) === resumoEstado({b:2, a:1})'), true);
});

/* ---- folha recusada ---- */

test('a URL da imagem é revogada quando a folha é recusada pela projeção', semAplicacao, async () => {
  // O caminho que mais custa: quem já tem uma folha colocada e vai colocar a segunda. A
  // imagem é aberta antes de a projeção ser conferida, e a recusa saía sem revogar —
  // megabytes presos ao separador até ele fechar.
  const r = await av(`(async()=>{
    const guardados = { ler: lerImagemDaFolha, grelha: grelhaDasFolhas, revoke: URL.revokeObjectURL };
    const revogadas = [];
    lerImagemDaFolha = async () => ({ url:"blob:falsa", largura:100, altura:100 });
    grelhaDasFolhas  = () => "pttm06";                       /* já há folha noutra projeção */
    URL.revokeObjectURL = u => revogadas.push(u);
    const fi = $("fo-img"), ff = $("fo-wf");
    Object.defineProperty(fi, "files", { value:[{name:"f.png"}], configurable:true });
    Object.defineProperty(ff, "files", { value:[], configurable:true });
    $("fo-prov").value = "carta anotada no PCO";
    $("fo-grelha").value = "mercator";                       /* a que vai ser recusada */
    ["fo-p1px","fo-p1py","fo-p1e","fo-p1n","fo-p2px","fo-p2py","fo-p2e","fo-p2n"]
      .forEach((id,k)=>{ const el=$(id); if(el) el.value = String(100*(k+1)); });
    try {
      await colocarFolha();
      return JSON.stringify({ revogadas, msg: $("fo-msg").textContent.slice(0,60) });
    } finally {
      lerImagemDaFolha = guardados.ler; grelhaDasFolhas = guardados.grelha;
      URL.revokeObjectURL = guardados.revoke;
    }
  })()`);
  const q = JSON.parse(r);
  assert.match(q.msg, /Já há uma folha colocada/, 'o caminho exercitado tem de ser mesmo o da recusa por projeção');
  assert.deepEqual(q.revogadas.join(','), 'blob:falsa', 'a recusa tem de revogar a URL que abriu');
});

/* ---- controlos ---- */

test('nenhuma lista repintada constrói controlos com onclick embutido', semAplicacao, async () => {
  const { readFile } = await import('node:fs/promises');
  const { readdirSync } = await import('node:fs');
  const maus = [];
  for (const zona of readdirSync('fonte').filter((d) => /^\d/.test(d))) {
    for (const f of readdirSync('fonte/' + zona).filter((n) => n.endsWith('.js'))) {
      const caminho = 'fonte/' + zona + '/' + f;
      const txt = await readFile(caminho, 'utf8');
      for (const m of txt.matchAll(/<(div|span)[^>]{0,400}?onclick/g)) maus.push(caminho + ': ' + m[0].slice(0, 60));
    }
  }
  assert.deepEqual(maus, [], 'div/span com onclick não se alcançam pelo teclado nem têm nome');
});

test('a lista de propostas de PEA é alcançável pelo teclado', semAplicacao, () => {
  av(`O.peas = [{ n:1, estado:"proposta", g:"041800SET26", met:{}, evoIdx:0 }]; pintarTudo();`);
  const r = av(`(()=>{
    const b = $("pea-list").querySelector("[data-pea]");
    return JSON.stringify({ etiqueta: b && b.tagName, tipo: b && b.getAttribute("type"),
      alcancavel: !!b && b.tabIndex >= 0 });
  })()`);
  const q = JSON.parse(r);
  assert.equal(q.etiqueta, 'BUTTON', 'era um div, e um div não entra na ordem de tabulação');
  assert.equal(q.tipo, 'button', 'sem type explícito um botão dentro de um form submete-o');
  assert.equal(q.alcancavel, true);
  av('O.peas = []; pintarTudo();');
});

test('o clique numa proposta continua a abrir o documento', semAplicacao, () => {
  av(`O.peas = [{ n:1, estado:"proposta", g:"041800SET26", met:{}, evoIdx:0,
        json:{pea:{}}, serie:[], dados:{}, meta:{num:"T"}, modo:"t" }]; pintarTudo();
      window.__abriu = 0; window.__verPEA = verPEA; window.verPEA = n => { window.__abriu = n; };`);
  av('$("pea-list").querySelector("[data-pea]").click()');
  const n = av('window.__abriu');
  av('window.verPEA = window.__verPEA; delete window.__verPEA; delete window.__abriu; O.peas = []; pintarTudo();');
  assert.equal(n, 1, 'a delegação tem de continuar a chamar verPEA com o número certo');
});
