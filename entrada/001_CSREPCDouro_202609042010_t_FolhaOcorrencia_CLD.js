/**
 * 001-t-0023 — Folhas por ocorrência, e o identificador interno.
 * CSREPC Douro · Estação PEA · ramo #001 (CLD)
 *
 * Correr:   node 001_CSREPCDouro_202609042010_t_FolhaOcorrencia_CLD.js r0093.html
 * Depende:  jsdom
 *
 * ESTADO ESPERADO CONTRA A r0093: 0 verdes, 10 vermelhos.
 *
 * ===========================================================================
 * ESPECIFICAÇÃO
 *
 * O cabeçalho é a especificação. Não há documento separado de propósito: um `d`
 * e um `t` a dizer a mesma coisa divergem, e o que se corrige é sempre só um.
 *
 * ---------------------------------------------------------------------------
 * 1. O QUE SE MEDIU NA r0093
 *
 * `FOLHAS` é tocado em oito sítios. **Nenhum deles é um caminho de troca de
 * ocorrência.** Nem `importarOcorrencia`, nem `encerrarOcorrencia`, nem
 * `reabrirOcorrencia`, nem `novoEstado`. E `colocacaoDaFolha` não guarda
 * nenhuma referência à ocorrência a que a folha pertence.
 *
 * Medido em 04SET26 contra a r0093, por execução:
 *
 *   50 gerações de `"f"+Date.now().toString(36)` num ciclo apertado
 *      -> 1 identificador distinto
 *   duas folhas com o mesmo id, `retirarFolha(id)` chamada uma vez
 *      -> ficam 0 folhas: tira as duas
 *   folha colocada na ocorrência 2026/0001, `O` substituído por 2026/0002
 *      -> `FOLHAS` mantém a folha
 *      -> `retratoDoFogo().carta.folhas` da ocorrência NOVA declara a folha da
 *         ANTIGA, com o nome e a proveniência da antiga
 *   `pacoteOcorrencia()` não contém a palavra «folha»
 *
 * A última linha é o achado que interessa. O `retratoDoFogo` alimenta o PEA, e
 * o comentário que lá está diz porquê: uma posição lida por cima de uma folha
 * vale o que valer a colocação dessa folha, e quem lê o plano tem de o poder
 * aferir. Um PEA que declara como referência cartográfica uma folha colocada
 * para outra ocorrência é uma afirmação falsa num documento aprovado pelo COS.
 *
 * E o erro é simétrico: a folha **fica** quando devia sair, e **não viaja**
 * quando devia acompanhar. Exportar a ocorrência e reabri-la noutro posto perde
 * a colocação inteira.
 *
 * ---------------------------------------------------------------------------
 * 2. O IDENTIFICADOR INTERNO DA OCORRÊNCIA
 *
 * Para a folha saber a que ocorrência pertence, é preciso haver por onde a
 * apontar. Hoje o que identifica uma ocorrência é `O.meta.num` — texto livre,
 * escrito à mão, que pode estar vazio no início, que pode ser corrigido, e que
 * em duas sub-regiões diferentes pode repetir-se.
 *
 * `num` é o número **operacional**: serve para comunicar, e muda quando tem de
 * mudar. O que falta é o identificador **interno**: nasce uma vez com a
 * ocorrência, nunca é editado, nunca aparece num documento, e é a única coisa
 * a que outra informação se pode agarrar. Uma renumeração não pode desligar as
 * folhas da ocorrência a que pertencem.
 *
 * Proposta: `O.meta.uid`, gerado em `novoEstado()`, imutável, a viajar no
 * pacote e a subir de versão do estado com migração — as ocorrências gravadas
 * antes disto recebem um `uid` no momento da migração, e as folhas existentes
 * ficam órfãs de propósito, assinaladas em vez de atribuídas a adivinhar.
 *
 * ---------------------------------------------------------------------------
 * 3. O IDENTIFICADOR DA FOLHA
 *
 * `"f"+Date.now().toString(36)` tem resolução de milissegundo. Duas folhas
 * colocadas no mesmo milissegundo — uma colagem, um ciclo, uma reposição —
 * partilham o identificador. A loja `folhas` tem `keyPath:"id"`, portanto a
 * segunda escreve por cima da primeira; e `retirarFolha` filtra por id,
 * portanto tira as duas.
 *
 * Não é hipótese: está medido acima.
 *
 * Proposta: `crypto.getRandomValues()`. **Não `crypto.randomUUID()`** — este
 * exige contexto seguro, e a origem `file://` é o caso em que esta aplicação
 * vive. Se o ramo #005 confirmar em Chromium que `file://` conta como origem
 * potencialmente fidedigna — e conta, se `crypto.subtle` já funciona lá, que é
 * o que o carimbo SHA-256 pressupõe —, então `randomUUID` é mais limpo. Até
 * essa medição, `getRandomValues` não depende da resposta.
 *
 * O mesmo gerador serve hoje as folhas e as linhas do croqui. Hoje é inofensivo
 * porque são coleções separadas; continua a ser dois sítios a partir juntos.
 *
 * ---------------------------------------------------------------------------
 * 4. A COLOCAÇÃO VIAJA, A IMAGEM NÃO
 *
 * A colocação de uma folha são seis coeficientes, dois pontos de controlo, um
 * nome, uma proveniência e duas dimensões: umas centenas de bytes. A imagem são
 * megabytes. A razão pela qual `FOLHAS` vive fora de `O` — escrita no código e
 * correcta — é o peso da imagem, e a r0092 já a separou ao guardar apenas a
 * colocação na base.
 *
 * Feita essa separação, a razão deixou de se aplicar à colocação. Ela deve
 * viajar no pacote, e a imagem volta a ser escolhida por quem abre, exactamente
 * como já acontece entre sessões e como acontece com a carta pré-descarregada.
 *
 * Numa rendição isto é a diferença entre o turno entrante repor a folha por um
 * ficheiro e ter de a calibrar de novo com dois pontos de controlo, às três da
 * manhã, sobre um terreno que não conhece.
 *
 * ---------------------------------------------------------------------------
 * 5. O QUE ESTA ESPECIFICAÇÃO NÃO DECIDE
 *
 * Se ao trocar de ocorrência as folhas da anterior são **descartadas** ou
 * **guardadas e reposta a que pertence à nova**. As asserções abaixo exigem
 * apenas que não fiquem visíveis nem entrem no retrato da nova — as duas
 * leituras satisfazem-nas. A escolha é de comando: guardar é mais útil e
 * duplica colocações na base; descartar é mais simples e perde trabalho.
 * ===========================================================================
 */

"use strict";

const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const ALVO = process.argv[2] || "r0093.html";

/* =========================================================================
   CONTRATO — nomes propostos, não impostos. Muda-se aqui e mais nada.
   ========================================================================= */
const CONTRATO = {
  uidDaOcorrencia: ()   => ev('(O && O.meta && O.meta.uid) !== undefined ? O.meta.uid : undefined'),
  novoIdFolha:     ()   => ev('typeof novoIdFolha === "function" ? novoIdFolha() : undefined'),
  ocorrenciaDaFolha: i  => ev("FOLHAS[" + i + "] ? FOLHAS[" + i + "].ocorrencia : undefined"),
  pacote:          ()   => ev("JSON.stringify(pacoteOcorrencia())"),
  retratoFolhas:   ()   => ev("JSON.stringify(retratoDoFogo().carta.folhas || [])")
};

function ev(expr){ return w.eval("(function(){ return (" + expr + "); })()"); }

let passou = 0, falhou = 0; const falhas = [];
function t(nome, fn){
  try { fn(); console.log("  ok    " + nome); passou++; }
  catch (e){ console.log("  FALHA " + nome + "\n          " + e.message); falhou++; falhas.push(nome); }
}
function ok(c, m){ if(!c) throw new Error(m || "condição falsa"); }
function grupo(x){ console.log("\n— " + x + " —"); }

if(!fs.existsSync(ALVO)){ console.error("Não encontrei " + ALVO); process.exit(2); }
console.log("001-t-0023 · folhas por ocorrência e identificador interno");
console.log("alvo: " + ALVO + " (" + fs.statSync(ALVO).size + " bytes)");

const dom = new JSDOM(fs.readFileSync(ALVO, "utf-8"),
  { runScripts:"dangerously", url:"https://exemplo.test/pea", virtualConsole:new VirtualConsole() });
const w = dom.window;
w.Element.prototype.scrollIntoView = function(){};
setTimeout(correr, 2500);

function correr(){
console.log("revisão declarada: " + ev("REVISAO_APP") + " · versão do estado: " + ev("VERSAO_ESTADO"));

const WF = "25.0\n0.0\n0.0\n-25.0\n30012.5\n180487.5\n";
function folha(id, nome){
  w.__d = { id, nome, largura:800, altura:600,
            mundo: ev('lerFicheiroReferenciacao(' + JSON.stringify(WF) + ')'),
            grelha:"pttm06", proveniencia:"ensaio 001-t-0023", pontos:0, controlos:[] };
  return w.eval("folhaCalibrada(window.__d)");
}
function colocar(f){ w.__f = f; w.eval("FOLHAS.push(window.__f);"); }
function limpar(){ w.eval("FOLHAS.length = 0;"); }
function ocorrencia(num){ w.eval("O = novoEstado(); O.meta.num = " + JSON.stringify(num) + ";"); }

/* =========================================================================
   K · A FOLHA PERTENCE A UMA OCORRÊNCIA
   ========================================================================= */
grupo("K · âmbito da ocorrência");

t("K1 · a ocorrência tem identificador interno, distinto do número operacional", () => {
  ocorrencia("2026/0001");
  const uid = CONTRATO.uidDaOcorrencia();
  ok(typeof uid === "string" && uid.length > 0, "`O.meta.uid` não existe · " + JSON.stringify(uid));
  ok(uid !== ev("O.meta.num"), "o identificador interno é o número operacional");
  /* `num` é texto livre, pode estar vazio no início e pode ser corrigido. Não
     serve de chave para nada se apontar. */
});

t("K2 · duas ocorrências novas não partilham identificador", () => {
  ocorrencia("2026/0001"); const a = CONTRATO.uidDaOcorrencia();
  ocorrencia("2026/0002"); const b = CONTRATO.uidDaOcorrencia();
  ok(a && b && a !== b, "identificadores iguais ou ausentes · " + JSON.stringify([a, b]));
});

t("K3 · renumerar a ocorrência não muda o identificador interno", () => {
  ocorrencia("2026/0001"); const antes = CONTRATO.uidDaOcorrencia();
  ok(typeof antes === "string" && antes.length > 0,
     "não há identificador para comparar · " + JSON.stringify(antes));
  w.eval('O.meta.num = "2026/0007";');
  ok(CONTRATO.uidDaOcorrencia() === antes,
     "o identificador mudou com o número · " + JSON.stringify([antes, CONTRATO.uidDaOcorrencia()]));
  /* Uma renumeração é corrente e não pode desligar as folhas da ocorrência. */
});

t("K4 · a folha declara a que ocorrência pertence", () => {
  ocorrencia("2026/0001"); limpar();
  colocar(folha("f1", "CMP 116"));
  const o = CONTRATO.ocorrenciaDaFolha(0);
  ok(typeof o === "string" && o.length > 0, "a folha não diz de que ocorrência é · " + JSON.stringify(o));
  ok(o === CONTRATO.uidDaOcorrencia(), "declara outra ocorrência que não a corrente");
});

t("K5 · trocar de ocorrência não deixa visíveis as folhas da anterior", () => {
  ocorrencia("2026/0001"); limpar();
  colocar(folha("f1", "CMP 116 · ocorrência A"));
  ocorrencia("2026/0002");
  const uid = CONTRATO.uidDaOcorrencia();
  ok(typeof uid === "string" && uid.length > 0,
     "sem identificador de ocorrência não há como distinguir folha própria de alheia · " + JSON.stringify(uid));
  const alheias = ev("FOLHAS.filter(function(f){ return f.ocorrencia !== " + JSON.stringify(uid) + "; }).length");
  ok(alheias === 0, alheias + " folha(s) de outra ocorrência continuam em FOLHAS");
  /* Descartar ou repor as que pertencem à nova são ambas aceitáveis. Ficar a
     folha da anterior não é. */
});

t("K6 · o retrato da ocorrência nova não declara folhas da anterior", () => {
  ocorrencia("2026/0001"); limpar();
  colocar(folha("f1", "CMP 116 · ocorrência A"));
  ocorrencia("2026/0002");
  const r = CONTRATO.retratoFolhas();
  ok(r.indexOf("ocorrência A") < 0,
     "o retrato da ocorrência 2026/0002 declara a folha da 2026/0001 · " + r);
  /* MEDIDO na r0093: declara. O `retratoDoFogo` alimenta o PEA, e o PEA é
     aprovado pelo COS — art. 27.º, n.º 1, al. a) do Despacho n.º 4067/2024. */
});

t("K7 · a colocação viaja no pacote da ocorrência", () => {
  ocorrencia("2026/0001"); limpar();
  colocar(folha("f1", "CMP 116"));
  const p = CONTRATO.pacote();
  ok(/CMP 116/.test(p), "a colocação não vai no pacote: exportar e reabrir perde a calibração");
  /* São umas centenas de bytes. A razão por que FOLHAS vive fora de `O` é o
     peso da imagem, e a r0092 já separou as duas coisas. */
});

t("K8 · a imagem não viaja no pacote", () => {
  ocorrencia("2026/0001"); limpar();
  const f = folha("f1", "CMP 116");
  w.__f = f; w.eval('window.__f.img = "data:image/png;base64,AAAAAAAA"; FOLHAS.push(window.__f);');
  const p = CONTRATO.pacote();
  ok(/CMP 116/.test(p),
     "nada da folha viaja no pacote: esta asserção não distingue «a imagem ficou de fora» de "
     + "«a colocação também» — só vale depois da K7");
  ok(!/data:image|base64/.test(p), "a imagem entrou no pacote, que viaja como ficheiro de texto");
  /* Megabytes num pacote que se envia por correio. A imagem volta a ser
     escolhida por quem abre, como já acontece entre sessões. */
});

/* =========================================================================
   L · O IDENTIFICADOR DA FOLHA
   ========================================================================= */
grupo("L · identificador da folha");

t("L1 · dois identificadores gerados no mesmo instante são distintos", () => {
  const n = CONTRATO.novoIdFolha();
  ok(typeof n === "string" && n.length > 0, "não há gerador de identificador · " + JSON.stringify(n));
  const s = new Set();
  for(let i = 0; i < 200; i++) s.add(CONTRATO.novoIdFolha());
  ok(s.size === 200, "200 gerações deram " + s.size + " identificadores distintos");
  /* MEDIDO na r0093: `"f"+Date.now().toString(36)` deu 1 em 50. */
});

t("L2 · retirar uma folha não retira outra", () => {
  ocorrencia("2026/0001"); limpar();
  colocar(folha(CONTRATO.novoIdFolha() || "fabc", "Folha A"));
  colocar(folha(CONTRATO.novoIdFolha() || "fabc", "Folha B"));
  ok(ev("FOLHAS.length") === 2, "as duas folhas não entraram");
  const id = ev("FOLHAS[0].id");
  w.eval("retirarFolha(" + JSON.stringify(id) + ");");
  ok(ev("FOLHAS.length") === 1, "retirar uma folha deixou " + ev("FOLHAS.length"));
  /* MEDIDO na r0093: com identificadores colididos, uma chamada tira as duas —
     e a segunda já tinha escrito por cima da primeira na base, porque a loja
     `folhas` tem keyPath:"id". */
});

t("L3 · o identificador não é derivável do relógio", () => {
  const antes = Date.now();
  const n = String(CONTRATO.novoIdFolha() || "");
  ok(n.length > 0, "não há gerador");
  const b36 = antes.toString(36), b16 = antes.toString(16);
  ok(n.indexOf(b36) < 0 && n.indexOf(b16) < 0,
     "o identificador contém o instante em que foi gerado · «" + n + "»");
  /* Não é sigilo: é que um identificador derivado do relógio colide quando dois
     nascem juntos, e o GDH doutrinário já regista o instante onde ele deve
     estar. Duas grandezas, dois campos. */
});

console.log("\n" + "=".repeat(70));
console.log("  " + passou + " a passar · " + falhou + " a falhar · " + (passou+falhou) + " asserções");
if(falhou) console.log("\n  vermelhas:\n    " + falhas.join("\n    "));
console.log("=".repeat(70));
process.exit(falhou ? 1 : 0);
}
