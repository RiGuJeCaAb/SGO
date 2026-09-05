// Estado e tempo — a quarta revisão do plano de 5 de setembro (B2 e B5).
//
// O estado: `dados.relevo` escrevia-se sem estar declarado; `let O` nascia a meio da escada
// de migrações; uma ocorrência sem número gravava em `sem-num` e nunca mais se repunha; a
// pintura do PEA em vigor escrevia o veredicto no estado sem gravar; e `pintarDON` copiava
// dois campos do formulário para o estado de 30 em 30 segundos.
//
// O tempo: 26 leituras diretas do relógio em 13 módulos, com `12-relogio.js` a existir
// precisamente para as regras serem exercitáveis com hora escolhida. `horizonteValidade` e
// `divergencia` passam a receber o instante; o teste da validade deixa de substituir
// `Date.now`.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const av = (e) => avaliar(janela, e);
/** O mesmo, por JSON: as listas da janela não são iguais por referência às do Node, e `deepEqual` recusa-as. */
const avJ = (e) => JSON.parse(av(`JSON.stringify(${e})`));

/** Lê todos os módulos da fonte, com o caminho, para os testes que olham para o código. */
function modulosDaFonte() {
  const out = [];
  const raiz = 'fonte';
  for (const zona of readdirSync(raiz, { withFileTypes: true })) {
    if (!zona.isDirectory()) continue;
    for (const f of readdirSync(join(raiz, zona.name))) {
      if (f.endsWith('.js')) out.push({ caminho: join(raiz, zona.name, f), texto: readFileSync(join(raiz, zona.name, f), 'utf8') });
    }
  }
  return out;
}

/* ---- B2 · a escada e o que se declara ---- */

test('a migração 26 -> 27 declara o relevo e dá identificador a quem não tem', semAplicacao, () => {
  // Um estado gravado pela r0100: sem `meta.id`, com um relevo amostrado que a r0100
  // escrevia sem o declarar. É de uma versão concreta que se migra — não se conta degraus.
  const rJ = av(`(()=>{
    const e = novoEstado(); e.versao = 26; delete e.meta.id;
    e.dados.relevo = { e0:412, grad:{N:1.5, S:-2}, perfis:{N:[413,415,420], S:[410,405,400]}, dist:[400,800,1200] };
    const m = migrarGravado(JSON.parse(JSON.stringify(e)));
    return JSON.stringify({ versao:m.versao, id:m.meta.id, relevo:m.dados.relevo });
  })()`);
  const r = JSON.parse(rJ);
  assert.equal(r.versao, av('VERSAO_ESTADO'));
  assert.match(r.id, /^o[0-9a-z]{6,}$/, 'o identificador é dado na migração');
  assert.deepEqual(r.relevo.dist, [400, 800, 1200], 'o relevo com a forma certa fica');
  assert.equal(r.relevo.e0, 412);
});

test('um relevo sem a forma esperada sai na migração, e sem relevo fica nulo', semAplicacao, () => {
  const r = avJ(`(()=>{
    const a = novoEstado(); a.versao = 26; a.dados.relevo = "412 m";
    const b = novoEstado(); b.versao = 26; delete b.dados.relevo;
    const c = novoEstado(); c.versao = 26; c.dados.relevo = { e0:"alto" };
    return [migrarGravado(a).dados.relevo, migrarGravado(b).dados.relevo, migrarGravado(c).dados.relevo];
  })()`);
  assert.deepEqual(r, [null, null, null]);
});

test('quem já tem identificador não o perde ao migrar', semAplicacao, () => {
  const r = av(`(()=>{ const e = novoEstado(); e.versao = 26; e.meta.id = "oFIXO"; return migrarGravado(e).meta.id; })()`);
  assert.equal(r, 'oFIXO');
});

test('o estado novo nasce com identificador e relevo declarados', semAplicacao, () => {
  const r = av('(()=>{ const e = novoEstado(); return { id:e.meta.id, relevo:e.dados.relevo, tem:"relevo" in e.dados }; })()');
  assert.match(r.id, /^o[0-9a-z]{6,}$/);
  assert.equal(r.relevo, null);
  assert.equal(r.tem, true);
  assert.notEqual(av('novoEstado().meta.id'), av('novoEstado().meta.id'), 'dois estados, dois identificadores');
});

test('`let O` nasce depois do último degrau da escada', () => {
  const t = readFileSync('fonte/1-nucleo/04-modelo-de-celulas-e-turno.js', 'utf8');
  const o = t.indexOf('\nlet O = novoEstado()');
  const ultimo = t.lastIndexOf('MIGRACOES.push(');
  assert.ok(o > 0 && ultimo > 0);
  assert.ok(o > ultimo, 'um degrau declarado depois de O nascer é o convite a pô-lo no sítio errado');
});

/* ---- B2 · o arquivo por identificador ---- */

/** Deixa a aba a escrever, com um estado limpo. */
function estadoLimpo() {
  av('O = novoEstado(); escreverForm(); if(emLeitura()) sairDeLeitura(); INDEX = [];');
}

test('uma ocorrência sem número grava-se e repõe-se', semAplicacao, async () => {
  estadoLimpo();
  av('O.meta.local = "Serra do Marão"; escreverForm();');
  const id = av('O.meta.id');
  const r = await av('persistir(false)');
  assert.equal(r.ok, true);
  assert.equal((await av('ARMAZEM.get("peaapp:ultima")')).value, id, 'a última é a que se acabou de gravar, com ou sem número');
  const entrada = av('INDEX.find(x=>x.id===O.meta.id)');
  assert.ok(entrada, 'entra no arquivo');
  assert.equal(entrada.num, '');
  assert.match(av('pintarArquivo(); $("arq-list").textContent'), /sem número/, 'lê-se «sem número», não um vazio');
  // Outra ocorrência em memória; repõe-se a última sem dizer qual.
  av('O = novoEstado(); escreverForm();');
  await av('carregar()');
  assert.equal(av('O.meta.local'), 'Serra do Marão');
  assert.equal(av('O.meta.id'), id, 'é a mesma ocorrência, e não uma cópia com outro identificador');
});

test('corrigir o número não duplica a ocorrência no arquivo', semAplicacao, async () => {
  estadoLimpo();
  av('O.meta.num = "2026-100"; O.meta.local = "Vila Real"; escreverForm();');
  await av('persistir(false)');
  av('O.meta.num = "2026-1001"; escreverForm();');
  await av('persistir(false)');
  const entradas = avJ('INDEX.filter(x=>x.id===O.meta.id).map(x=>x.num)');
  assert.deepEqual(entradas, ['2026-1001'], 'uma entrada, com o número corrigido');
  assert.equal(av('INDEX.some(x=>x.num==="2026-100")'), false, 'a entrada com o número antigo saiu');
});

test('uma ocorrência gravada antes da r0101 abre pela chave do número e passa para a nova', semAplicacao, async () => {
  estadoLimpo();
  // O que uma r0100 deixou no dispositivo: a chave pelo número, o índice sem `id`.
  await av(`(async()=>{
    const e = novoEstado(); e.versao = 26; delete e.meta.id; e.meta.num = "2026-ANTIGA"; e.meta.local = "Lamego";
    await ARMAZEM.set("peaapp:occ:2026-ANTIGA", JSON.stringify(e));
    await ARMAZEM.set("peaapp:ultima", "2026-ANTIGA");
    INDEX = [{ num:"2026-ANTIGA", local:"Lamego", pasta:"Sem pasta", pco:"", g:"", peas:0 }];
    await ARMAZEM.set("peaapp:index", JSON.stringify(INDEX));
  })()`);
  assert.equal(av('chaveDoIndice(INDEX[0])'), '2026-ANTIGA', 'sem identificador, a chave curta é o número');
  await av('carregar()');
  assert.equal(av('O.meta.local'), 'Lamego');
  const id = av('O.meta.id');
  assert.match(id, /^o[0-9a-z]{6,}$/, 'ganha identificador ao ser reposta');
  await av('persistir(false)');
  assert.equal((await av(`ARMAZEM.get("peaapp:occ:${id}")`)).key, `peaapp:occ:${id}`, 'gravada na chave nova');
  await assert.rejects(av('ARMAZEM.get("peaapp:occ:2026-ANTIGA")'), 'a chave antiga sai depois de a nova estar gravada');
  assert.deepEqual(avJ('INDEX.map(x=>[x.id, x.num])'), [[id, '2026-ANTIGA']], 'uma entrada só, já com identificador');
});

test('«Nova» depois de repor não apaga a ocorrência que se deixou', semAplicacao, async () => {
  estadoLimpo();
  av('O.meta.num = "2026-FICA"; O.meta.local = "Régua"; escreverForm();');
  await av('persistir(false)');
  const chaveFica = av('chave()');
  await av('carregar()');
  // A chave lida está presa a este objeto; trocar o `O` não a leva consigo.
  av('O = novoEstado(); O.meta.local = "Outra"; escreverForm();');
  await av('persistir(false)');
  assert.equal((await av(`ARMAZEM.get("${chaveFica}")`)).key, chaveFica, 'a ocorrência deixada continua no arquivo');
  assert.equal(av('INDEX.some(x=>x.num==="2026-FICA")'), true);
});

test('uma ocorrência em branco não entra no arquivo, mas fica como última', semAplicacao, async () => {
  estadoLimpo();
  await av('persistir(false)');
  assert.equal(av('INDEX.length'), 0, 'nada que a nomeie, nada que listar');
  assert.equal((await av('ARMAZEM.get("peaapp:ultima")')).value, av('O.meta.id'));
});

test('apagar pelo identificador limpa o índice e o estado em memória', semAplicacao, async () => {
  estadoLimpo();
  av('O.meta.num = "2026-APAGA"; O.meta.local = "Sabrosa"; escreverForm();');
  await av('persistir(false)');
  const id = av('O.meta.id');
  av('window.__confirm = window.confirm; window.confirm = () => true;');
  try {
    await av(`window.apagarOcc("${id}")`);
  } finally {
    av('window.confirm = window.__confirm; delete window.__confirm;');
  }
  assert.equal(av(`INDEX.some(x=>x.id==="${id}")`), false);
  assert.notEqual(av('O.meta.id'), id, 'o estado em memória é outro');
  assert.equal(av('O.meta.num'), '');
});

/* ---- B2 · o veredicto regista-se onde se grava ---- */

/** Um plano aprovado e já caducado em vigor, com o veredicto antigo por cima. */
function planoCaducadoEmVigor() {
  av(`
    O.peas = [{ n:1, estado:"aprovado", g:"041800SET26", ts:agora()-7200000, validoTs:agora()-60000,
                json:{pea:{}}, met:{}, serie:[], dados:{}, meta:{num:"T"}, evoIdx:0, ctrl:[],
                aprovacao:{g:"041800SET26", por:"COS", funcao:"COS", nota:""}, analise:{g:""},
                base:baseVigor(), ultVerd:"vigor" }];
  `);
}

test('a pintura do PEA em vigor não escreve o veredicto nem a fita', semAplicacao, () => {
  estadoLimpo();
  planoCaducadoEmVigor();
  const fitaAntes = av('O.fita.length');
  av('renderVigor()');
  assert.equal(av('O.peas[0].ultVerd'), 'vigor', 'a pintura só mostra');
  assert.equal(av('O.fita.length'), fitaAntes, 'e não empurra para a fita');
  assert.match(av('$("pea-vigor").textContent'), /caducad/i, 'mas mostra o veredicto atual');
  assert.equal(av('veredictoPendente()'), true, 'e sabe-se que há veredicto por registar');
});

test('gravar regista o veredicto que mudou, com a linha na fita, e é isso que fica no arquivo', semAplicacao, async () => {
  estadoLimpo();
  planoCaducadoEmVigor();
  av('O.meta.num = "2026-VERD"; escreverForm();');
  const fitaAntes = av('O.fita.length');
  const r = await av('persistir(false)');
  assert.equal(r.ok, true);
  assert.equal(av('O.peas[0].ultVerd'), 'caducado');
  assert.equal(av('O.fita.length'), fitaAntes + 1);
  assert.match(av('O.fita[O.fita.length-1].e'), /caducad/i);
  const gravado = JSON.parse((await av('ARMAZEM.get(chave())')).value);
  assert.equal(gravado.peas[0].ultVerd, 'caducado', 'o veredicto registado é o que está no arquivo');
  assert.equal(av('veredictoPendente()'), false);
});

test('a reavaliação periódica grava quando há veredicto por registar, e só pinta quando não há', semAplicacao, async () => {
  estadoLimpo();
  planoCaducadoEmVigor();
  av('O.meta.num = "2026-PERIODICA"; escreverForm(); window.__gravacoes = 0; window.__p = persistir; window.persistir = async n => { window.__gravacoes++; return window.__p(n); };');
  try {
    // A função procura `persistir` no âmbito global quando corre: a substituição vale.
    av('reavaliarPeriodicamente()');
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(av('window.__gravacoes'), 1, 'gravou, porque o veredicto tinha mudado');
    await av('window.__p(false)');
    av('reavaliarPeriodicamente()');
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(av('window.__gravacoes'), 1, 'sem mudança, não grava');
  } finally {
    av('window.persistir = window.__p; delete window.__p; delete window.__gravacoes;');
  }
});

test('uma aba em leitura não regista veredicto', semAplicacao, () => {
  estadoLimpo();
  planoCaducadoEmVigor();
  av('entrarEmLeitura("x")');
  try {
    av('reavaliarPeriodicamente()');
    assert.equal(av('O.peas[0].ultVerd'), 'vigor');
  } finally {
    av('sairDeLeitura()');
  }
});

test('pintarDON já não copia o formulário para o estado', semAplicacao, () => {
  estadoLimpo();
  av('O.meta.inicio = "010900SET26"; $("o-inicio").value = "020900SET26"; pintarDON();');
  assert.equal(av('O.meta.inicio'), '010900SET26', 'a pintura lê; quem escreve no estado é o campo, ao ser escrito');
});

/* ---- B5 · o tempo entra por argumento ---- */

test('fora do relógio, nenhum módulo lê Date.now() nem new Date() sem argumento', () => {
  const culpados = [];
  for (const { caminho, texto } of modulosDaFonte()) {
    if (caminho.endsWith('12-relogio.js')) continue;
    if (/Date\.now\(\)/.test(texto)) culpados.push(caminho + ' (Date.now)');
    if (/new Date\(\)/.test(texto)) culpados.push(caminho + ' (new Date())');
  }
  assert.deepEqual(culpados, [], 'o relógio lê-se em agora(), que é o ponto único');
});

test('a validade calcula-se de um instante dado, sem tocar no relógio', semAplicacao, () => {
  const r = av(`(()=>{
    const b = new Date(); b.setHours(17, 50, 0, 0); const T = b.getTime();
    const fecho = new Date(T); fecho.setHours(18, 0, 0, 0);
    const real = Date.now; let leu = 0; Date.now = () => { leu++; return real(); };
    try {
      const ts = horizonteValidade({ janela:{fim:"18"} }, T);
      return { bate: ts === fecho.getTime(), leu };
    } finally { Date.now = real; }
  })()`);
  assert.equal(r.bate, true, 'às 17h50 com a janela a fechar às 18h00, vale até às 18h00');
  assert.equal(r.leu, 0, 'com o instante em argumento, o relógio não é lido');
});

test('uma hora que já passou no instante dado conta para o dia seguinte', semAplicacao, () => {
  const r = av(`(()=>{
    const b = new Date(); b.setHours(19, 0, 0, 0); const T = b.getTime();
    const amanha = new Date(T); amanha.setDate(amanha.getDate()+1); amanha.setHours(18, 0, 0, 0);
    return { hora: instanteDaHora("18", T) === amanha.getTime(), teto: horizonteValidade({ janela:{fim:"18"} }, T) - T };
  })()`);
  assert.equal(r.hora, true);
  assert.equal(r.teto, 6 * 3600000, 'às 19h00 a janela das 18h é amanhã, e o teto de seis horas manda');
});

test('a caducidade do plano em vigor julga-se no instante dado', semAplicacao, () => {
  estadoLimpo();
  av('O.peas = [{ n:1, estado:"aprovado", ts:1000, validoTs:5000, base:baseVigor(), ultVerd:"", ctrl:[] }];');
  assert.equal(av('divergencia(O.peas[0], 4999).expirado'), false);
  assert.equal(av('divergencia(O.peas[0], 5000).expirado'), true);
  assert.equal(av('divergencia(O.peas[0], 5000).verd'), 'caducado');
  assert.equal(av('divergencia(O.peas[0], 4000).restante'), 1000);
});

test('a emissão carimba o plano e a validade com o mesmo instante', () => {
  const t = readFileSync('fonte/3-planeamento/17-emissao-do-pea.js', 'utf8');
  assert.match(t, /tsEmissao = agora\(\)/);
  assert.match(t, /ts:tsEmissao, validoTs:horizonteValidade\(mm, tsEmissao\)/, 'dois relógios lidos a milissegundos de distância são dois instantes');
});
