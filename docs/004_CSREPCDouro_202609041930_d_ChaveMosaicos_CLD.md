# A impressão da carta na chave dos mosaicos

**CSREPC Douro · Estação PEA**
Ramo **#004** (CLD) · 04SET26
Para: ramo #002 (CODE)
Guião que acompanha: `#004_CSREPCDouro_202609041930_t0021_ChaveMosaicos_CLD.js` — **vermelho
na r0093, 4 de 5 asserções**

---

## 1. O defeito

`chaveMosaico(z, x, y)` devolve `"m/z/x/y"`, com o comentário:

> Uma só, seja qual for a sua proveniência.

É essa frase que está errada. **A proveniência é exactamente o que distingue dois mosaicos
que partilham z, x e y — e eles partilham-nos sempre.** A numeração dos quadrados é a mesma
em todas as grelhas: foi isso que o `p0017` estabeleceu para a pasta pré-descarregada,
quando obrigou a declarar a projecção porque nenhuma inspecção dos ficheiros a distingue.

O arquivo de rede voltou a abrir o mesmo buraco pelo outro lado.

## 2. As três consequências, medidas

Todas verificadas em Chromium contra a r0093, com o guião anexo.

### 2.1 Trocar de serviço serve os mosaicos do serviço anterior

`retirarCarta()` chama `esquecerMosaicos()` e está correcto. Mas `guardarCarta()` e
`adotarCartaWMTS()` **substituem `CARTA` sem tocar no arquivo**. E escrever por cima do
campo é o que qualquer pessoa faz, porque o campo está lá.

Demonstrado com bytes:

```
Serviço A declarado, um quadrado do Douro entra no arquivo
Serviço B declarado por cima, sem retirar o A
carta declarada agora: Serviço B, cartografia oficial
mosaico servido:       o do Serviço A
```

O `mosaicoBlob` encontra o mosaico do A na chave e devolve-o. **Nunca chega a pedir ao B.**

### 2.2 Se as grelhas diferirem, a carta fica fora do sítio

Serviço A em Web Mercator, serviço B em PT-TM06. Depois da troca, `grelhaAtual()` devolve a
portuguesa e os mosaicos servidos são os do Mercator. Carta no ecrã, alinhada, credível, e
tudo fora do sítio — **o mesmo modo de falha que o `p0017` fechou, reaberto pelo arquivo.**

### 2.3 O PEA impresso leva atribuição falsa

E esta é a razão pela qual isto não pode ficar como está.

O `guardarCarta()` exige a atribuição e os termos de uso, e recusa sem eles — bem exigido,
é obrigação de licença. O rodapé do mapa e o PEA impresso mostram a atribuição da carta
**declarada**. Os pixéis são os da carta **anterior**.

Num documento aprovado pelo COS ao abrigo do art. 27.º, n.º 1, al. a), e com o valor
probatório que o art. 46.º lhe dá, isso não é imprecisão: é **declaração falsa de origem**,
sobre cartografia de terceiros cuja licença obriga precisamente a declarar a origem.

### 2.4 A pasta pré-descarregada partilha o mesmo espaço

`declararCartaLocal("pttm06", …)` regista a grelha, como o `p0017` obrigou. A chave
continua a ignorá-la. Uma pasta PT-TM06 carregada depois de um serviço Web Mercator escreve
por cima dos mosaicos deste, quadrado a quadrado, sem colisão detectável.

O `local:true` só governa a caducidade, não a identidade.

## 3. A correcção

A chave passa a levar a **impressão da carta**: o que identifica a origem daqueles bytes.

```
chaveMosaico(carta, z, x, y) → "m/" + impressaoDaCarta(carta) + "/" + z + "/" + x + "/" + y
```

`impressaoDaCarta` é um resumo curto e estável de:

| Tipo | O que identifica |
|---|---|
| `xyz` | o modelo de URL, normalizado |
| `wmts` | endereço do serviço, camada, conjunto de matrizes |
| local | o marcador `local` **mais a grelha declarada** |

E **sempre a grelha**, seja qual for o tipo, porque é ela que decide a aritmética com que os
quadrados são colocados.

Estável no sentido de sobreviver a reinícios e a variações irrelevantes — maiúsculas do
esquema, barra final. Não precisa de ser criptográfico: precisa de nunca coincidir para
cartas diferentes e nunca divergir para a mesma carta.

## 4. Três consequências da correcção que valem a pena antecipar

**A troca de serviço deixa de destruir o arquivo do anterior.** É ganho, não custo: quem
alterna entre ortofoto e topográfico durante uma ocorrência conserva as duas, e a segunda
volta a servir sem rede. Hoje ou se perde o arquivo ou se serve o errado.

**O arquivo cresce.** Passa a haver um conjunto por carta. Convém que o painel diga quantos
quadrados cada carta ocupa e permita esquecer uma sem esquecer as outras — hoje o
`esquecerMosaicos()` limpa tudo, e com chaves separadas isso passa a ser desproporcionado.

**As chaves antigas ficam órfãs.** Não têm impressão e não correspondem a carta nenhuma
identificável. **Devem ser apagadas na subida, não adoptadas por nenhuma carta:** atribuí-las
à carta corrente seria inventar a proveniência que este patch existe para registar. Perde-se
um arquivo; ganha-se não voltar a mentir sobre ele.

## 5. O que fica correcto e não deve regredir

O `retirarCarta()` chamar o `esquecerMosaicos()`. É a única das quatro asserções do guião
que passa hoje, e a única que não deve mudar de comportamento — embora passe a esquecer só
os quadrados da carta retirada.

## 6. Nota de método

Escrevi o guião a falhar antes de escrever esta especificação, e os números da secção 2 são
leituras dele e não estimativas. Se algum deixar de reproduzir na tua árvore, o guião está
errado e quero sabê-lo.

---

**Também nesta entrega:**

- `#004_…_t0018_FolhaCalibrada_CLD.js` — o guião original, quarta remessa, sem alterações.
- `#004_…_t0018c_FolhaMercatorAfim_CLD.js` — **religado à r0093** e a correr: 26 verdes, 1
  vermelho. O `mpp` do Web Mercator está corrigido e as asserções passam a defender a
  correcção contra regressão, com os rótulos reescritos para dizerem o que verificam. O
  vermelho que resta é a recusa silenciosa da folha em grelha incompatível, ainda por
  corrigir.
