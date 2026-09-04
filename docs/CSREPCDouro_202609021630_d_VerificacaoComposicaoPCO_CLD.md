# Onde a Estação codifica a composição do posto de comando, e a partir de quê

**Resposta ao ponto 1 do `006_..._d01_InventarioObrigacoesCodificaveis_CLD.md`**
CSREPC Douro · Estação PEA · 2 de setembro de 2026

**Revisão contra a qual o d01 foi escrito:** r0077.
**Revisão em que esta verificação foi feita:** r0083.
**Vale para as duas:** o bloco em causa não é tocado desde a r0066, de 30 de agosto — commit
`8ff94e2`. Entre a r0066 e a r0083 nenhuma alteração passou por
`fonte/2-comando/01-estrutura-do-posto-de-comando.js` nem por
`fonte/1-nucleo/07-catalogo-decir-e-estados-de-setor.js`. O que abaixo se descreve é
literalmente o mesmo código na r0077 e na r0083.

**Nada foi alterado para produzir este documento.** É leitura.

---

## 1. Resposta curta

**A composição do PCO vem do articulado, não da matriz do Anexo I. E não pode conter as duas
erratas, porque não existe no código nenhuma lista fechada por fase.**

O Anexo I entra na aplicação num sítio só, e não é este: entra nas **referências de efetivo**
por fase (`FASES_SGO`). A composição do posto de comando é uma tabela independente, em que
cada função cita a alínea do art. 14.º que a cria e o artigo que a regula.

---

## 2. Onde está

### 2.1 A composição — `fonte/2-comando/01-estrutura-do-posto-de-comando.js`, linhas 2 a 26

```js
/* ================= COMANDO · estrutura do posto de comando (art. 14.º) ================= */
const FUNCOES_PCO = [
  {f:"Coordenador do PCO", r:"art. 14.º, n.º 1, al. a)", g:"Comando", fase:3},
  {f:"Oficial de Operações", r:"art. 14.º, n.º 1, al. b) e art. 17.º", g:"Comando", fase:2},
  {f:"Oficial de Planeamento", r:"art. 14.º, n.º 1, al. c) e art. 27.º", g:"Comando", fase:2},
  {f:"Oficial de Logística e Finanças", r:"art. 14.º, n.º 1, al. d) e art. 32.º", g:"Comando", fase:2},
  {f:"Adjunto de Segurança", r:"art. 14.º, n.º 1, al. e) e art. 36.º", g:"Comando", fase:3},
  {f:"Adjunto de Ligação", r:"art. 14.º, n.º 1, al. f) e art. 37.º", g:"Comando", fase:4},
  {f:"Adjunto de Relações Públicas", r:"art. 14.º, n.º 1, al. g) e art. 38.º", g:"Comando", fase:4},
  /* … e a seguir os núcleos e os coordenadores de meios, cada um com o seu artigo … */
];
```

Vinte e cinco entradas ao todo. **A referência normativa de cada uma é a alínea do art. 14.º
n.º 1 e o artigo que regula a função.** Nenhuma entrada cita o Anexo I.

### 2.2 Como a fase entra — o campo `fase:`

O campo não diz «esta função pertence à fase N». Diz **«a partir da fase N esta função é
exigível»**, e é lido por duas funções, no mesmo ficheiro:

```js
/* linha 45 — o que a fase declarada já exige */
function funcoesExigiveis(){
  const c = contarDispositivo(), fase = ORDEM_FASE[O.meta.fase]||0, out = [];
  FUNCOES_PCO.forEach(x=>{
    let devida = false, motivo = "";
    if(x.fase && fase >= x.fase){ devida = true; motivo = "fase "+O.meta.fase+" do SGO"; }
    /* … e os limiares de meios aéreos e especiais, que são do art. 20.º e 22.º … */
```

```js
/* linha 73 — o que se recomenda por já se estar à porta da fase seguinte */
function prioridadeFuncao(x, exigiveis){
  const ex = exigiveis || funcoesExigiveis();
  if(ex.some(y=>y.f===x.f)) return "e";
  const c = contarDispositivo(), fase = ORDEM_FASE[O.meta.fase]||0;
  if(x.fase && fase+1 >= x.fase) return "r";
```

Os dois comparadores são `>=`. **A composição é acumulativa por construção:** o que é
exigível na fase IV continua exigível na V e na VI, porque `5 >= 4` e `6 >= 4`.

### 2.3 Onde o Anexo I entra, que é outro sítio

`fonte/1-nucleo/07-catalogo-decir-e-estados-de-setor.js`, linhas 16 a 29:

```js
/**
 * As fases do SGO, com a referência de efetivo de cada uma — Despacho n.º 4067/2024,
 * art. 39.º e Anexo I. `ate` é o topo do efetivo que a fase comporta.
 */
const FASES_SGO = [
  { k:"I",   ate:36,  d:"até 36 operacionais (1.ª intervenção)" },
  { k:"II",  ate:40,  d:"reforço de 36 operacionais (32–40) · até 3 setores" },
  { k:"III", ate:119, d:"reforço de 108 operacionais (97–119) · até 6 setores" },
  { k:"IV",  ate:356, d:"reforço de 324 operacionais (292–356) · até 2 frentes" },
  { k:"V",   ate:713, d:"reforço de 648 operacionais (583–713) · até 4 frentes" },
  { k:"VI",  ate:Infinity, d:"decisão do CNEPC · áreas de intervenção municipal" },
];
```

São **os valores publicados, não recalculados** — 32–40, 97–119, 292–356, 583–713 —, o que
satisfaz a nota do d01 sobre B03. A fase VI não tem limiar numérico: `Infinity`, com a
descrição a remeter para a decisão do CNEPC, o que satisfaz a nota sobre B09.

---

## 3. Porque é que as duas erratas não podem estar lá dentro

**Fase V, célula de planeamento.** O Oficial de Planeamento tem `fase:2`. Na fase V,
`5 >= 2`: é exigível. Os núcleos de planeamento têm `fase:4`; na fase V, `5 >= 4`. **A célula
de planeamento não pode desaparecer na fase V**, porque nada na aplicação enumera a
composição da fase V — ela é o que se acumulou até lá.

**Fase VI, adjunto de segurança.** `fase:3`. Na fase VI, `6 >= 3`: exigível.

A errata do Anexo I é uma **omissão numa lista fechada**. A aplicação não tem listas
fechadas por fase; tem limiares monótonos. **A classe de erro não tem onde existir.**

---

## 4. O que a verificação encontrou, e que não foi perguntado

Confrontando os `fase:` do código com as alíneas C06 a C10 do d01 — **e é o d01 que aqui
serve de fonte, porque o articulado não foi relido para este documento** —, cinco entradas
divergem em uma fase:

| Função | `fase:` no código | Pelo d01 | Divergência |
|---|---|---|---|
| Oficial de Planeamento | 2 | III (C07) | exigido **uma fase antes** |
| Oficial de Logística e Finanças | 2 | III (C07) | exigido **uma fase antes** |
| Coordenador do PCO | 3 | IV (C08) | exigido **uma fase antes** |
| Adjunto de Segurança | 3 | II (C06) | exigido **uma fase depois** |
| Adjunto de Ligação | 4 | III (C07) | exigido **uma fase depois** |

As três primeiras erram por excesso de zelo: a aplicação pede antes do que a lei pede, o que
é conservador mas põe uma função em «Essencial — exigível agora» sem que a norma o exija.
**As duas últimas erram no sentido perigoso:** o adjunto de segurança é do art. 41.º n.º 2
al. b), fase II, e a aplicação só o dá por exigível na III. Numa fase II com um TO
complicado, a Estação não assinala a falta de quem tem a autoridade do art. 36.º n.º 2 para
mandar parar os trabalhos.

**Não corrigi.** É matéria da decisão do ponto 1 do d01 e do pedido expresso de não alterar,
e a correção deve entrar com as famílias A, B e C, num movimento só e com testes por
asserção. Fica registado aqui e no `POREXECUTAR.md`.

---

## 5. Sobre as outras duas decisões pendentes, o que o código já responde

Não são respostas às decisões — são de C. Abreu. É o levantamento do que já está construído,
para se decidir sobre o que existe e não sobre um espaço em branco.

**Estado «fora de matriz» (secção 2.3 do d01).** **A aplicação nunca bloqueia por efetivo.**
O seletor da fase, em `fonte/molde.html`, oferece as seis fases sem condição nenhuma; a fase
declara-se por ato próprio, com botão «Declarar fase», e fica gravada com quem a declarou e
quando (`meta.faseG`, `meta.fasePor`). O confronto com o efetivo é uma **regra de
conformidade**, `id:"fase"` em `fonte/2-comando/02-registo-de-regras-de-conformidade.js`,
que emite `n:"av"` — aviso — quando o efetivo excede a referência da fase declarada, e nunca
impede coisa nenhuma.

Ou seja: **os limiares já são severidade A e não B**, como o d01 exige. O que falta para
cobrir o art. 39.º n.os 3 e 4 é o outro lado — a **seleção do fundamento taxativo** entre os
quatro do n.º 3, e o estado de «organização distinta» do n.º 4 pendente de validação
nacional. Hoje o aviso diz o que fazer, mas não recolhe o fundamento nem o carimba na fita.

**Fita do tempo (H02).** A `fita()` só acrescenta; não há caminho de edição nem de remoção
de uma entrada. **Mas isso é propriedade do código, não requisito declarado**: não está
escrito em lado nenhum que assim tem de ser, nem há teste que o exija. Se a decisão for
«requisito de desenho fundamentado», o trabalho é escrever a justificação e o teste que
proíbe a regressão — que é barato e que hoje falta.

---

## 6. Conclusão

**Não é preciso mexer no bloco por causa das erratas.** A leitura que o d01 receava — a
composição codificada a partir da tabela do Anexo I — não é a que está no código. O Anexo I
entra só nas referências de efetivo, e essas estão pelos valores publicados.

O que a verificação trouxe de novo são as **cinco divergências de uma fase** da secção 4,
duas delas no sentido que deixa passar em silêncio uma falta que a lei manda assinalar.
