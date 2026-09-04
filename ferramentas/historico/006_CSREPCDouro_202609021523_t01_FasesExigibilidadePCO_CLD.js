#!/usr/bin/env node
/**
 * t01 — Fases de exigibilidade das funções do posto de comando operacional
 *
 * Ramo 006 (CLD). Escrito contra a r0083.
 *
 * OBJECTO
 * O campo `fase:` de FUNCOES_PCO significa, por leitura do comparador `>=` em
 * funcoesExigiveis() (fonte/2-comando/01-estrutura-do-posto-de-comando.js, linha 49),
 * "a partir desta fase do SGO a função é exigível". Este teste confronta esse valor,
 * para as sete funções do artigo 14.º n.º 1, com a fase em que o articulado do
 * Despacho n.º 4067/2024 as torna exigíveis.
 *
 * FONTE NORMATIVA — texto literal das alíneas b) dos artigos das fases:
 *
 *   Art. 41.º n.º 2 al. b) [FASE II]
 *     "O posto de comando operacional é instalado, integrando a célula de operações
 *      e o adjunto de segurança"
 *
 *   Art. 42.º n.º 2 al. b) [FASE III]
 *     "O posto de comando operacional integra as células de operações, de planeamento
 *      e de logística e finanças e os adjuntos de segurança e de ligação"
 *
 *   Art. 43.º n.º 2 al. b) [FASE IV]
 *     "O posto de comando operacional integra as células de operações, de planeamento
 *      e de logística e finanças e os adjuntos de segurança, de relações públicas e de
 *      ligação, bem como o coordenador do posto de comando operacional"
 *
 *   Arts. 44.º n.º 2 al. b) e 45.º n.º 2 al. b) [FASES V e VI]
 *     Composição idêntica à da fase IV. Não introduzem exigibilidade nova.
 *
 * PONTE ENTRE CÉLULA E OFICIAL — Art. 14.º n.º 5
 *     "Os oficiais de operações, de planeamento e de logística e finanças são,
 *      respetivamente, responsáveis pelas células de operações, de planeamento e de
 *      logística e finanças dos postos de comando que integrem."
 *   Logo: exigir a célula é exigir o oficial que a dirige. É esta a norma que
 *   autoriza traduzir "integra a célula de planeamento" em "Oficial de Planeamento
 *   exigível".
 *
 * CLASSIFICAÇÃO DAS DIVERGÊNCIAS
 *   LACUNA  — o código exige MAIS TARDE do que a lei. A aplicação não assinala a
 *             falta de um titular que a fase já impõe. Sentido perigoso.
 *   EXCESSO — o código exige MAIS CEDO do que a lei. A aplicação pede um titular que
 *             a fase ainda não impõe. Ruído, não lacuna.
 *
 * ESTADO ESPERADO CONTRA A r0083: VERMELHO.
 * Duas LACUNA (Adjunto de Segurança, Adjunto de Ligação) e três EXCESSO.
 * O teste passa a verde quando os cinco valores forem corrigidos e não antes.
 *
 * Execução:  node 006_CSREPCDouro_202609021523_t01_FasesExigibilidadePCO_CLD.js <build.html>
 * Sem dependências. Sem rede.
 */

"use strict";
const fs = require("fs");
const path = require("path");

/* ---------------------------------------------------------------- referência */

const ROMANO = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };

/**
 * Fase a partir da qual o articulado torna a função exigível.
 * Cada entrada carrega a alínea que a sustenta. Sem excepção: uma linha sem
 * proveniência não entra nesta tabela.
 */
const EXIGIVEL_POR_ARTICULADO = [
  {
    f: "Oficial de Operações",
    fase: 2,
    alinea: "art. 41.º, n.º 2, al. b)",
    via: "célula de operações (art. 14.º, n.º 5)"
  },
  {
    f: "Adjunto de Segurança",
    fase: 2,
    alinea: "art. 41.º, n.º 2, al. b)",
    via: "nomeado expressamente"
  },
  {
    f: "Oficial de Planeamento",
    fase: 3,
    alinea: "art. 42.º, n.º 2, al. b)",
    via: "célula de planeamento (art. 14.º, n.º 5)"
  },
  {
    f: "Oficial de Logística e Finanças",
    fase: 3,
    alinea: "art. 42.º, n.º 2, al. b)",
    via: "célula de logística e finanças (art. 14.º, n.º 5)"
  },
  {
    f: "Adjunto de Ligação",
    fase: 3,
    alinea: "art. 42.º, n.º 2, al. b)",
    via: "nomeado expressamente"
  },
  {
    f: "Adjunto de Relações Públicas",
    fase: 4,
    alinea: "art. 43.º, n.º 2, al. b)",
    via: "nomeado expressamente"
  },
  {
    f: "Coordenador do PCO",
    fase: 4,
    alinea: "art. 43.º, n.º 2, al. b)",
    via: "nomeado expressamente"
  }
];

/* ------------------------------------------------------------------ extracção */

/**
 * Extrai o literal FUNCOES_PCO do build sem executar o resto do ficheiro.
 * Conta parênteses rectos para encontrar o fecho, em vez de procurar "];" —
 * que aparece dentro do array e partiria a leitura.
 */
function extrairFuncoesPCO(html) {
  const marca = "const FUNCOES_PCO = [";
  const i = html.indexOf(marca);
  if (i === -1) {
    throw new Error(
      "Âncora 'const FUNCOES_PCO = [' não encontrada. O bloco mudou de forma; " +
      "rever este teste antes de tirar conclusões sobre o build."
    );
  }
  const abre = i + marca.length - 1;
  let nivel = 0, fim = -1;
  for (let k = abre; k < html.length; k++) {
    const c = html[k];
    if (c === "[") nivel++;
    else if (c === "]") {
      nivel--;
      if (nivel === 0) { fim = k; break; }
    }
  }
  if (fim === -1) throw new Error("Array FUNCOES_PCO sem fecho. Build truncado?");
  const literal = html.slice(abre, fim + 1);
  return Function('"use strict"; return ' + literal + ";")();
}

/* ------------------------------------------------------------------ avaliação */

function correr(caminho) {
  const html = fs.readFileSync(caminho, "utf8");
  const funcoes = extrairFuncoesPCO(html);

  const lacunas = [];
  const excessos = [];
  const ausentes = [];
  let conformes = 0;

  for (const ref of EXIGIVEL_POR_ARTICULADO) {
    const entrada = funcoes.find(x => x.f === ref.f);
    if (!entrada) { ausentes.push(ref); continue; }

    const noCodigo = entrada.fase;
    if (noCodigo === ref.fase) { conformes++; continue; }

    const registo = {
      f: ref.f,
      codigo: noCodigo,
      lei: ref.fase,
      alinea: ref.alinea,
      via: ref.via
    };
    if (noCodigo > ref.fase) lacunas.push(registo);
    else excessos.push(registo);
  }

  /* ------------------------------------------------------------- relatório */

  const L = [];
  const linha = (s = "") => L.push(s);

  linha("t01 — Fases de exigibilidade das funções do PCO (art. 14.º n.º 1)");
  linha("Build: " + path.basename(caminho));
  linha("Funções do art. 14.º n.º 1 verificadas: " + EXIGIVEL_POR_ARTICULADO.length);
  linha("Conformes: " + conformes);
  linha();

  if (lacunas.length) {
    linha("LACUNA — o código exige mais tarde do que a lei (sentido perigoso)");
    linha("-".repeat(72));
    for (const d of lacunas) {
      linha("  " + d.f);
      linha("    fase: no código .... " + ROMANO[d.codigo] + " (" + d.codigo + ")");
      linha("    exigível por lei ... " + ROMANO[d.lei] + " (" + d.lei + ")");
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
      linha("    fase: no código .... " + ROMANO[d.codigo] + " (" + d.codigo + ")");
      linha("    exigível por lei ... " + ROMANO[d.lei] + " (" + d.lei + ")");
      linha("    fundamento ......... " + d.alinea + " — " + d.via);
      linha();
    }
  }

  if (ausentes.length) {
    linha("AUSENTE de FUNCOES_PCO — verificar o teste antes do build");
    linha("-".repeat(72));
    for (const d of ausentes) linha("  " + d.f);
    linha();
  }

  const falhas = lacunas.length + excessos.length + ausentes.length;
  linha("=".repeat(72));
  if (falhas === 0) {
    linha("VERDE — as sete funções do art. 14.º n.º 1 exigíveis na fase correcta.");
  } else {
    linha("VERMELHO — " + falhas + " divergência(s): " +
          lacunas.length + " LACUNA, " +
          excessos.length + " EXCESSO" +
          (ausentes.length ? ", " + ausentes.length + " AUSENTE" : "") + ".");
    linha("As LACUNA são as que erram no sentido perigoso e as que motivam este teste.");
  }

  console.log(L.join("\n"));
  return falhas === 0 ? 0 : 1;
}

/* ----------------------------------------------------------------- arranque */

const alvo = process.argv[2];
if (!alvo) {
  console.error("Uso: node " + path.basename(__filename) + " <build.html>");
  process.exit(2);
}
if (!fs.existsSync(alvo)) {
  console.error("Ficheiro não encontrado: " + alvo);
  process.exit(2);
}

try {
  process.exit(correr(alvo));
} catch (e) {
  console.error("ERRO DE EXECUÇÃO: " + e.message);
  console.error("Um teste que não corre não é um teste verde. Corrigir antes de prosseguir.");
  process.exit(2);
}
