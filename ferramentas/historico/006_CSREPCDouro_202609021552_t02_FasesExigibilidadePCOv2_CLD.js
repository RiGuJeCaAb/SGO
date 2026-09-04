#!/usr/bin/env node
/**
 * t01 v2 — Fases de exigibilidade das funções do posto de comando operacional
 *
 * Ramo 006 (CLD). v1 escrita contra a r0083; v2 adaptada ao contrato da r0084.
 *
 * ------------------------------------------------------------------------
 * AVISO DE VERIFICAÇÃO — LER ANTES DE CONFIAR NO RESULTADO
 *
 * Esta versão NÃO foi corrida contra a r0084. O ramo 006 não tem esse
 * ficheiro. Os nomes de campo `faseLei`, `faseSug` e `aLei` vêm da descrição
 * do ramo que a produziu, não de leitura do build.
 *
 * Por isso o guião não assume a forma: verifica-a, e separa o caso "o
 * contrato mudou" do caso "o valor está errado". Se a forma não for a
 * esperada, sai com código 2 e diz porquê, em vez de reportar divergências
 * doutrinárias falsas.
 *
 * Correr contra a r0084 e confirmar VERDE antes de o dar por bom.
 * ------------------------------------------------------------------------
 *
 * O QUE MUDOU DA v1
 *
 *  1. Lê `faseLei` em vez de `fase`.
 *
 *  2. Campo em falta deixa de ser divergência. Na v1, o campo renomeado
 *     produziu sete divergências `undefined` — ruído com forma de achado
 *     doutrinário. Passa a ser CONTRATO QUEBRADO, código de saída 2.
 *     Um guião que grita a coisa errada treina quem o lê a ignorá-lo.
 *
 *  3. Verificação nova: DESPROMOÇÃO. A separação `faseLei`/`faseSug` da
 *     r0084 é correcta e resolve o achado dos nove núcleos, mas cria uma
 *     classe de defeito que antes não existia — uma função do art. 14.º
 *     n.º 1 migrar de `faseLei` para `faseSug` e passar de exigência legal
 *     a palpite sem que nada o assinale. É agora a regressão mais perigosa
 *     possível neste bloco, e é silenciosa por natureza.
 *
 *  4. Verificação nova: a alínea gravada em `aLei` é confrontada com a
 *     alínea verificada, não apenas com a sua existência. Um campo de
 *     proveniência que aponta para a norma errada é pior do que campo
 *     nenhum, porque parece ter proveniência.
 *
 * ------------------------------------------------------------------------
 * FONTE NORMATIVA — texto literal, Despacho n.º 4067/2024,
 * Diário da República, 2.ª série, n.º 74, de 15-04-2024
 *
 *   Art. 41.º n.º 2 al. b) [FASE II]
 *     "O posto de comando operacional é instalado, integrando a célula de
 *      operações e o adjunto de segurança"
 *
 *   Art. 42.º n.º 2 al. b) [FASE III]
 *     "O posto de comando operacional integra as células de operações, de
 *      planeamento e de logística e finanças e os adjuntos de segurança e
 *      de ligação"
 *
 *   Art. 43.º n.º 2 al. b) [FASE IV]
 *     "O posto de comando operacional integra as células de operações, de
 *      planeamento e de logística e finanças e os adjuntos de segurança, de
 *      relações públicas e de ligação, bem como o coordenador do posto de
 *      comando operacional"
 *
 *   Arts. 44.º n.º 2 al. b) e 45.º n.º 2 al. b) [FASES V e VI]
 *     Composição idêntica à da fase IV. Não introduzem exigibilidade nova.
 *
 *   Art. 14.º n.º 5 — ponte entre célula e oficial
 *     "Os oficiais de operações, de planeamento e de logística e finanças
 *      são, respetivamente, responsáveis pelas células de operações, de
 *      planeamento e de logística e finanças dos postos de comando que
 *      integrem."
 *   É esta norma que autoriza ler "integra a célula de planeamento" como
 *   "Oficial de Planeamento exigível". Sem ela a tradução seria do ramo e
 *   não da lei.
 *
 * NOTA SOBRE AS ERRATAS DO ANEXO I
 *   A matriz do Anexo I diverge do articulado em dois pontos (fase V omite
 *   a célula de planeamento e duplica a de operações; fase VI omite o
 *   adjunto de segurança), confirmados contra a imagem da página 24/28 da
 *   publicação oficial. Este guião segue o articulado. Não usar o Anexo I
 *   como fonte para estes valores.
 *
 * Execução:  node <este ficheiro> <build.html>
 * Saídas:    0 verde · 1 divergência doutrinária · 2 contrato ou execução
 * Sem dependências. Sem rede.
 */

"use strict";
const fs = require("fs");
const path = require("path");

const ROMANO = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };

/* --------------------------------------------------------------- referência */

const EXIGIVEL_POR_ARTICULADO = [
  { f: "Oficial de Operações",            fase: 2, art: 41, via: "célula de operações (art. 14.º, n.º 5)" },
  { f: "Adjunto de Segurança",            fase: 2, art: 41, via: "nomeado expressamente" },
  { f: "Oficial de Planeamento",          fase: 3, art: 42, via: "célula de planeamento (art. 14.º, n.º 5)" },
  { f: "Oficial de Logística e Finanças", fase: 3, art: 42, via: "célula de logística e finanças (art. 14.º, n.º 5)" },
  { f: "Adjunto de Ligação",              fase: 3, art: 42, via: "nomeado expressamente" },
  { f: "Adjunto de Relações Públicas",    fase: 4, art: 43, via: "nomeado expressamente" },
  { f: "Coordenador do PCO",              fase: 4, art: 43, via: "nomeado expressamente" }
];

const alineaDe = ref => "art. " + ref.art + ".º, n.º 2, al. b)";

/* Assinatura normalizada de uma citação: artigo + número + alínea, sem
   depender de espaçamento, acentuação do "º" ou ordem das palavras. */
function assinaturaCitacao(s) {
  if (typeof s !== "string") return null;
  const art = s.match(/art\.?\s*(\d+)\.?\s*º/i);
  const num = s.match(/n\.?\s*º\s*(\d+)/i);
  const ali = s.match(/al\.?\s*([a-z])\s*\)/i);
  if (!art) return null;
  return art[1] + "|" + (num ? num[1] : "-") + "|" + (ali ? ali[1].toLowerCase() : "-");
}

/* ----------------------------------------------------------------- extracção */

function extrairFuncoesPCO(html) {
  const marca = "const FUNCOES_PCO = [";
  const i = html.indexOf(marca);
  if (i === -1) {
    const e = new Error(
      "Âncora 'const FUNCOES_PCO = [' não encontrada.\n" +
      "  O bloco mudou de forma ou de nome. Este guião alcança um literal dentro do\n" +
      "  ficheiro compilado, pelo que depende do nome do identificador. Rever antes\n" +
      "  de tirar qualquer conclusão sobre a conformidade do build."
    );
    e.contrato = true;
    throw e;
  }
  const abre = i + marca.length - 1;
  let nivel = 0, fim = -1;
  for (let k = abre; k < html.length; k++) {
    if (html[k] === "[") nivel++;
    else if (html[k] === "]" && --nivel === 0) { fim = k; break; }
  }
  if (fim === -1) {
    const e = new Error("Array FUNCOES_PCO sem fecho. Build truncado?");
    e.contrato = true;
    throw e;
  }
  return Function('"use strict"; return ' + html.slice(abre, fim + 1) + ";")();
}

/* ------------------------------------------------------ verificação de forma */

/**
 * Antes de avaliar valores, confirma que o contrato é o esperado.
 * Devolve null se estiver bom, ou o texto do problema.
 */
function verificarContrato(funcoes) {
  if (!Array.isArray(funcoes) || funcoes.length === 0)
    return "FUNCOES_PCO não é um array com conteúdo.";

  const presentes = EXIGIVEL_POR_ARTICULADO
    .map(r => funcoes.find(x => x.f === r.f))
    .filter(Boolean);

  if (presentes.length === 0)
    return "Nenhuma das sete funções do art. 14.º n.º 1 foi encontrada por nome.\n" +
           "  Os rótulos do campo `f` mudaram.";

  const comFaseLei = presentes.filter(x => "faseLei" in x).length;
  const comFase    = presentes.filter(x => "fase" in x).length;

  if (comFaseLei === 0 && comFase > 0)
    return "Contrato antigo: as entradas têm `fase`, não `faseLei`.\n" +
           "  Este é o guião v2, para a r0084 ou posterior. Usar a v1 contra a r0083.";

  if (comFaseLei === 0)
    return "Nenhuma das funções do art. 14.º n.º 1 tem campo `faseLei`.\n" +
           "  O nome do campo mudou outra vez, ou a exigibilidade legal mudou de sítio.";

  /* Entrada sem `faseLei` mas com `faseSug` NÃO é contrato quebrado: é uma
     despromoção, e é precisamente o achado que este guião existe para apanhar.
     Deixá-la passar para a avaliação. Só é quebra de contrato a entrada que
     não tem nenhum dos dois campos — aí não há valor a comparar. */
  const mudas = presentes.filter(x => !("faseLei" in x) && !("faseSug" in x));
  if (mudas.length)
    return "Sem `faseLei` nem `faseSug`: " + mudas.map(x => x.f).join(", ") + ".\n" +
           "  Não há valor a comparar. O contrato mudou de forma.";

  return null;
}

/* ----------------------------------------------------------------- avaliação */

function correr(caminho) {
  const html = fs.readFileSync(caminho, "utf8");
  const funcoes = extrairFuncoesPCO(html);

  const problema = verificarContrato(funcoes);
  if (problema) {
    console.error("t01 v2 — CONTRATO QUEBRADO");
    console.error("Build: " + path.basename(caminho));
    console.error("");
    console.error("  " + problema);
    console.error("");
    console.error("Nenhuma conclusão doutrinária foi tirada. Um campo que muda de nome");
    console.error("não é uma divergência de doutrina, e reportá-lo como tal é ruído.");
    return 2;
  }

  const lacunas = [], excessos = [], despromovidas = [], proveniencia = [];
  let conformes = 0;

  for (const ref of EXIGIVEL_POR_ARTICULADO) {
    const e = funcoes.find(x => x.f === ref.f);
    if (!e) continue; // apanhado por verificarContrato se for sistemático

    /* (3) despromoção: exigência legal migrada para sugestão */
    if (e.faseLei == null && e.faseSug != null) {
      despromovidas.push({ f: ref.f, sug: e.faseSug, lei: ref.fase, alinea: alineaDe(ref) });
      continue;
    }

    /* (4) proveniência: a alínea gravada aponta para a norma certa? */
    if ("aLei" in e) {
      const esperada = ref.art + "|2|b";
      const obtida = assinaturaCitacao(e.aLei);
      if (obtida !== esperada)
        proveniencia.push({ f: ref.f, gravada: String(e.aLei), esperada: alineaDe(ref) });
    }

    if (e.faseLei === ref.fase) { conformes++; continue; }

    const d = { f: ref.f, codigo: e.faseLei, lei: ref.fase, alinea: alineaDe(ref), via: ref.via };
    (e.faseLei > ref.fase ? lacunas : excessos).push(d);
  }

  /* -------------------------------------------------------------- relatório */

  const L = [], linha = (s = "") => L.push(s);
  const fase = n => ROMANO[n] ? ROMANO[n] + " (" + n + ")" : String(n);

  linha("t01 v2 — Fases de exigibilidade das funções do PCO (art. 14.º n.º 1)");
  linha("Build: " + path.basename(caminho));
  linha("Funções verificadas: " + EXIGIVEL_POR_ARTICULADO.length + " · conformes: " + conformes);
  linha();

  if (despromovidas.length) {
    linha("DESPROMOÇÃO — exigência do art. 14.º n.º 1 tratada como sugestão");
    linha("-".repeat(72));
    for (const d of despromovidas) {
      linha("  " + d.f);
      linha("    faseSug ............ " + fase(d.sug) + "   (sem faseLei)");
      linha("    exigível por lei ... " + fase(d.lei));
      linha("    fundamento ......... " + d.alinea);
      linha("    efeito ............. sai do que a lei impõe e passa a palpite;");
      linha("                         deixa de alimentar pendências e conformidade");
      linha();
    }
  }

  if (lacunas.length) {
    linha("LACUNA — o código exige mais tarde do que a lei (sentido perigoso)");
    linha("-".repeat(72));
    for (const d of lacunas) {
      linha("  " + d.f);
      linha("    faseLei ............ " + fase(d.codigo));
      linha("    exigível por lei ... " + fase(d.lei));
      linha("    fundamento ......... " + d.alinea + " — " + d.via);
      linha("    efeito ............. na fase " + ROMANO[d.lei] +
            " a Estação não assinala a falta deste titular");
      linha();
    }
  }

  if (excessos.length) {
    linha("EXCESSO — o código exige mais cedo do que a lei");
    linha("-".repeat(72));
    for (const d of excessos) {
      linha("  " + d.f);
      linha("    faseLei ............ " + fase(d.codigo));
      linha("    exigível por lei ... " + fase(d.lei));
      linha("    fundamento ......... " + d.alinea + " — " + d.via);
      linha();
    }
  }

  if (proveniencia.length) {
    linha("PROVENIÊNCIA — a alínea gravada não é a que sustenta o valor");
    linha("-".repeat(72));
    for (const d of proveniencia) {
      linha("  " + d.f);
      linha("    aLei gravada ....... " + d.gravada);
      linha("    alínea verificada .. " + d.esperada);
      linha();
    }
  }

  const falhas = despromovidas.length + lacunas.length + excessos.length + proveniencia.length;
  linha("=".repeat(72));
  if (falhas === 0) {
    linha("VERDE — as sete funções do art. 14.º n.º 1 exigíveis na fase correcta,");
    linha("        em faseLei, com a alínea certa.");
  } else {
    linha("VERMELHO — " + falhas + " divergência(s): " +
      [ despromovidas.length + " DESPROMOÇÃO",
        lacunas.length + " LACUNA",
        excessos.length + " EXCESSO",
        proveniencia.length + " PROVENIÊNCIA" ].join(", ") + ".");
    if (despromovidas.length || lacunas.length)
      linha("DESPROMOÇÃO e LACUNA erram no sentido perigoso.");
  }

  console.log(L.join("\n"));
  return falhas === 0 ? 0 : 1;
}

/* ------------------------------------------------------------------ arranque */

const alvo = process.argv[2];
if (!alvo) { console.error("Uso: node " + path.basename(__filename) + " <build.html>"); process.exit(2); }
if (!fs.existsSync(alvo)) { console.error("Ficheiro não encontrado: " + alvo); process.exit(2); }

try {
  process.exit(correr(alvo));
} catch (e) {
  console.error("t01 v2 — " + (e.contrato ? "CONTRATO QUEBRADO" : "ERRO DE EXECUÇÃO"));
  console.error(e.message);
  console.error("");
  console.error("Um guião que não corre não é um guião verde.");
  process.exit(2);
}
