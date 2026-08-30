// Código morto: o que está escrito e ninguém usa.
//
// A análise estática já apanha a função órfã dentro do ficheiro montado — foi para isso
// que entrou. O que ela não vê é o outro lado do mesmo defeito: o identificador de um
// elemento que a folha de estilo ou o código procuram e o HTML não tem, a classe de
// estilo que nenhum elemento usa, o campo de estado que se escreve e nunca se lê.
//
// Nada disto dá erro. O botão fica sem ouvinte, a regra de estilo não pinta nada, o campo
// gravado ocupa espaço na exportação e mente a quem o lê. Já aconteceu neste projeto: a
// lista do fecho à escrita apontava para três identificadores que não existiam, e a
// aplicação bloqueava a exportação sem que ninguém desse por isso.
//
// Não decide sozinha: relata. Uma classe usada só a partir de uma cadeia composta em
// tempo de execução é falso positivo, e é por isso que o resultado se lê, não se aplica.

import { readFile } from 'node:fs/promises';
import { revisaoMaisRecente } from './verificar.mjs';
import { extrairScripts } from './extrair.mjs';

/** Extrai o corpo do `<style>` da entrega. */
export function extrairEstilo(html) {
  const m = /<style\b[^>]*>([\s\S]*?)<\/style>/i.exec(html);
  return m ? m[1] : '';
}

/** Os `id` que o HTML define. */
export function idsDefinidos(html) {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
}

/** Os `id` que o código procura, por `$("x")` ou `getElementById("x")`. */
export function idsProcurados(js) {
  const s = new Set();
  for (const m of js.matchAll(/\$\(\s*["'`]([\w-]+)["'`]\s*\)/g)) s.add(m[1]);
  for (const m of js.matchAll(/getElementById\(\s*["'`]([\w-]+)["'`]\s*\)/g)) s.add(m[1]);
  return s;
}

/**
 * Todo o texto que o código trata como dados: o conteúdo dos literais de cadeia.
 *
 * É onde vivem os identificadores e as classes que nunca aparecem numa chamada direta —
 * `aviso("msg-occ", ...)`, `irPara("p-fita")`, `"tipo-"+e.tipo`, uma classe escrita
 * dentro de um `innerHTML`.
 *
 * **Percorre-se o código caractere a caractere, e não por expressão regular.** A primeira
 * versão apanhava pares de aspas pela ordem em que apareciam, e uma aspa dentro de uma
 * cadeia de plicas — `'<path class="'` — abria um par falso que engolia o literal
 * seguinte. Perdiam-se assim classes que estavam a ser usadas, e a análise dava-as por
 * mortas. Um analisador de cadeias tem de saber em que cadeia está.
 */
/**
 * Uma barra nesta posição abre uma expressão regular, ou é uma divisão?
 *
 * A pergunta não tem resposta exata sem analisar a gramática toda. O que decide na
 * prática é o que vem antes: depois de um valor, a barra divide; depois de um operador,
 * de um parêntese aberto ou de uma palavra-chave, abre expressão.
 */
export function podeSerExpressao(js, i) {
  let j = i - 1;
  while (j >= 0 && /\s/.test(js[j])) j--;
  if (j < 0) return true;
  if ('(,=:[!&|?{};+-*%~^<>'.includes(js[j])) return true;
  const palavra = /(\w+)$/.exec(js.slice(Math.max(0, j - 10), j + 1));
  return !!palavra && ['return', 'typeof', 'in', 'of', 'case', 'new', 'delete', 'void']
    .includes(palavra[1]);
}

/** Onde acaba a expressão regular que começa em `i`. */
export function fimDaExpressao(js, i) {
  let j = i + 1, classe = false;
  for (; j < js.length; j++) {
    const c = js[j];
    if (c === '\\') { j++; continue; }
    if (c === '[') classe = true;
    else if (c === ']') classe = false;
    else if (c === '/' && !classe) break;
    else if (c === '\n') return i;            /* não era expressão: era divisão */
  }
  return j;
}

export function textoDosLiterais(js) {
  const partes = [];
  let modo = 'codigo', abre = '', atual = '';
  const pilha = [];   /* cadeias de crase suspensas dentro de um ${...} */
  let nivel = 0;      /* chavetas abertas dentro do buraco corrente */
  for (let i = 0; i < js.length; i++) {
    const c = js[i], seg = js[i + 1];
    if (modo === 'codigo') {
      if (c === '/' && seg === '/') { modo = 'linha'; i++; }
      else if (c === '/' && seg === '*') { modo = 'bloco'; i++; }
      else if (c === '/' && podeSerExpressao(js, i)) {
        /* Uma expressão regular também tem aspas lá dentro — `/[&<>"]/g` — e sem a
           reconhecer o analisador abria uma cadeia falsa a partir dali. Foi assim que
           `arq-list` e `coord-formats` apareceram na lista de mortos estando vivos. */
        i = fimDaExpressao(js, i);
      }
      else if (c === '"' || c === "'" || c === '`') { modo = 'cadeia'; abre = c; atual = ''; }
      else if (c === '{' && pilha.length) nivel++;
      else if (c === '}' && pilha.length) {
        if (nivel) nivel--;
        else { abre = pilha.pop(); modo = 'cadeia'; atual = ''; }
      }
    } else if (modo === 'linha') {
      if (c === '\n') modo = 'codigo';
    } else if (modo === 'bloco') {
      if (c === '*' && seg === '/') { modo = 'codigo'; i++; }
    } else {
      if (c === '\\') { i++; continue; }              /* o escapado não fecha a cadeia */
      if (c === abre) { partes.push(atual); modo = 'codigo'; continue; }
      /* Numa cadeia de crase, o que está dentro de ${...} volta a ser código — e pode
         trazer cadeias lá dentro: `class="${x? "dec" : "mold"}"`. Saltar o buraco todo
         perdia essas, e classes vivas apareciam mortas. Entra-se nele como código, e
         volta-se à cadeia na chaveta que o fecha. */
      if (abre === '`' && c === '$' && seg === '{') {
        partes.push(atual); atual = '';
        pilha.push(abre); modo = 'codigo'; nivel = 0; i++; continue;
      }
      atual += c;
    }
  }
  return partes.join('\n');
}

/**
 * O texto dos atributos do HTML, **sem os `id`**.
 *
 * O valor de `id="x"` é a definição de `x`, não o seu uso. Contá-lo fazia todo o
 * identificador aparecer como usado por si próprio, e a análise devolvia zero.
 */
export function textoDosAtributos(html) {
  return [...html.matchAll(/\b(\w[\w-]*)\s*=\s*"([^"]*)"/g)]
    .filter((m) => m[1] !== 'id')
    .map((m) => m[2]).join('\n');
}

/** `alvo` aparece como palavra inteira em `palheiro`? */
export function aparece(palheiro, alvo) {
  return new RegExp('(?:^|[^\\w-])' + alvo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    + '(?:[^\\w-]|$)').test(palheiro);
}

/**
 * Os `id` que a folha de estilo aponta, por `#x`.
 *
 * Uma cor em hexadecimal também começa por cardinal — `#B00000` — e a primeira versão
 * desta análise deu vinte e oito cores por identificadores em falta. Excluem-se.
 */
export function idsNoEstilo(css) {
  const hex = /^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
  return new Set([...css.matchAll(/#([A-Za-z][\w-]*)/g)].map((m) => m[1]).filter((x) => !hex.test(x)));
}

/** As classes que a folha de estilo define. */
export function classesDefinidas(css) {
  /* só o que está fora dos blocos de declarações: `.a .b{...}` define `a` e `b` */
  const semBlocos = css.replace(/\{[^}]*\}/g, ' ');
  return new Set([...semBlocos.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]));
}

/** Funções declaradas no código montado, e quantas vezes o nome aparece. */
export function funcoesEUsos(js) {
  const decl = [...js.matchAll(/^(?:async )?function (\w+)/gm)].map((m) => m[1]);
  const contagem = new Map();
  for (const nome of decl) {
    const n = (js.match(new RegExp('\\b' + nome + '\\b', 'g')) || []).length;
    contagem.set(nome, n);
  }
  return contagem;
}

/**
 * O que a análise sabe que não consegue ver, declarado com a razão.
 *
 * Uma classe montada por concatenação — `pri-${prioridadeFuncao(...)}` — nunca aparece
 * inteira em lado nenhum, e uma análise honesta não a pode dar por morta. Ficam
 * declaradas, com o sítio que as compõe: assim a lista que a ferramenta imprime tem só o
 * que é para ler, e quem a lê não se habitua a ignorá-la.
 *
 * Um identificador que só existe para o HTML mostrar uma etiqueta fixa também não é
 * morto: é rótulo. Declara-se pela mesma razão.
 */
export const SABIDOS = {
  classes: [
    { prefixo: 'pri-',  onde: '2-comando/01 · `pco-r pri-${prioridadeFuncao(...)}`' },
    { prefixo: 'tipo-', onde: '7-arranque/01 · `evo-i tipo-${esc(e.tipo)}`' }
  ],
  ids: [
    { id: 'c-elementos', porque: 'contentor do cartão de elementos; a arrumação encontra-o pelo título' },
    { id: 'pf-tag',      porque: 'etiqueta fixa do perfil de elevação' },
    { id: 'turno-tag',   porque: 'etiqueta fixa do turno corrente' }
  ]
};


/**
 * Corre a análise sobre uma entrega.
 *
 * O critério é deliberadamente conservador: algo conta como usado se o seu nome aparecer,
 * como palavra inteira, em qualquer literal do código ou atributo do HTML. Prefere-se
 * deixar passar um morto a acusar um vivo — quem lê a lista tem de poder confiar nela.
 */
export async function analisar(ficheiro) {
  const html = await readFile(ficheiro, 'utf8');
  const js = extrairScripts(html).map((b) => b.codigo).join('\n');
  const css = extrairEstilo(html);
  /* O palheiro é onde se procura o **uso**. A folha de estilo fica de fora: uma classe
     definida lá não se usa a si própria, e incluí-la dava toda a folha por viva. */
  const palheiro = textoDosLiterais(js) + '\n' + textoDosAtributos(html);
  /* Para os identificadores conta também a folha de estilo, que os aponta por `#x`. */
  const palheiroId = palheiro + '\n' + [...idsNoEstilo(css)].join('\n');

  /* um id escrito com interpolação — `ta-t-${i}` — é família, não identificador */
  const defs = [...idsDefinidos(html)].filter((i) => !i.includes('${'));
  const noCss = idsNoEstilo(css);

  const idsSemUso = defs.filter((i) => !aparece(palheiroId, i))
    .filter((i) => !SABIDOS.ids.some((x) => x.id === i));
  const idsQueFaltam = [...idsProcurados(js)].filter((i) => !defs.includes(i) && !i.includes('${'));
  const idsSoNoEstilo = [...noCss].filter((i) => !defs.includes(i));

  const classesSemUso = [...classesDefinidas(css)]
    .filter((c) => !aparece(palheiro, c))
    .filter((c) => !SABIDOS.classes.some((x) => c.startsWith(x.prefixo)));

  const funcoes = funcoesEUsos(js);
  const funcoesSoDeclaradas = [...funcoes].filter(([, n]) => n <= 1).map(([nome]) => nome);

  return { ficheiro, idsSemUso, idsQueFaltam, idsSoNoEstilo, classesSemUso, funcoesSoDeclaradas };
}

function relatar(r) {
  const bloco = (t, L) => {
    if (!L.length) return;
    console.log(`\n  ${t} (${L.length}):`);
    console.log('    ' + L.sort().join(', '));
  };
  console.log(r.ficheiro + ':');
  bloco('identificadores procurados pelo código e que o HTML não tem', r.idsQueFaltam);
  bloco('identificadores usados pela folha de estilo e que o HTML não tem', r.idsSoNoEstilo);
  bloco('identificadores definidos e que ninguém procura', r.idsSemUso);
  bloco('classes de estilo que ninguém usa', r.classesSemUso);
  bloco('funções declaradas e nunca chamadas', r.funcoesSoDeclaradas);
  const total = r.idsQueFaltam.length + r.idsSoNoEstilo.length + r.idsSemUso.length
    + r.classesSemUso.length + r.funcoesSoDeclaradas.length;
  console.log(`\n  ${total} candidato(s). Ler antes de apagar: uma classe composta em tempo`
    + ' de execução, ou um identificador só usado a partir do HTML, é falso positivo.');
  return r.idsQueFaltam.length;   /* só isto é defeito certo: procurar o que não existe */
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const alvo = process.argv[2] || (await revisaoMaisRecente('app'));
  if (!alvo) { console.error('sem revisão em app/'); process.exit(1); }
  const r = await analisar(alvo);
  process.exit(relatar(r) ? 1 : 0);
}
