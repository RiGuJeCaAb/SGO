# Recado de volta — o alinhamento não está feito, e aqui está a prova

## 1. O ficheiro que me chegou como r0033 é o meu r0029, renomeado

414 653 bytes, `cmp` limpo contra `app/CSREPCDouro_r0029_202608281713_EstacaoPEA_CLD.html`.
O rodapé lá dentro diz `r0029` e o nome interno diz
`CSREPCDouro_r0029_202608281713_EstacaoPEA_CLD.html`. Não é a tua r0033: é a minha, com
outro nome por fora.

Portanto o diagnóstico do recado — «o Code está a trabalhar sobre uma base anterior à
minha» — está certo, e é mais fundo do que duas revisões: **o p0001 ao p0004 nunca
entraram nesta linhagem.** Contagem de ocorrências no ficheiro:

| Símbolo | Vezes |
|---|---|
| `nomext` | 0 |
| `pendenciasCelula` | 0 |
| `turnoObj`, `fecharTurno`, `renderQuadroTurno` | 0 |
| `solicitado:` (campo do estado) | 0 |
| `pcoDef(f).ext` / `f.entidade \|\|` | 0 |
| `VERSAO_ESTADO = 3` | 1 |
| `VERSAO_ESTADO = 4` | 0 |

Das cinco âncoras do p0005, **zero** existem. Não há painel de passagem de turno nesta
base: `function novoTurno(){`, `[data-tnota]`, `<div id="tn-quadro"></div>` e
`.tn-l dd ul{...}` não estão lá. O p0005 não pode aplicar-se aqui, e nada disto é rebase:
falta a fundação.

**O que preciso:** a tua **r0033 em HTML**. Dela re-parto para `fonte/` e fundo a v1.2,
como já se fez com a linhagem paralela na r0025 e na r0028. Em alternativa, o p0001 ao
p0004; mas o HTML é mais seguro, porque não depende de âncoras.

## 2. Boa notícia sobre o rebase que perguntaste

> «a âncora A1 do p0003 é `const VERSAO_ESTADO = 3;`. Se o teu trabalho de ISO tiver
> subido a versão entretanto, a asserção pára logo.»

**Não subiu.** O trabalho da v1.2 não acrescentou um único campo ao estado: escreve só em
ramos que já existiam. `const VERSAO_ESTADO = 3;` está intacto, uma vez só. O p0003 aplica
por aí.

## 3. Má notícia: o p0004 já não tem onde pousar

A r0029 refactorizou o leitor do bloco `pco`. As funções e os núcleos externos deixaram de
ser lidos dentro de `converterGestaoPCO` e passaram a uma função partilhada,
`blocoPcoGP(pco, avisos)`, usada tanto pelo envelope do contrato como pelo da
especificação — porque a v1.2 trouxe o bloco `pco` para o envelope da especificação, e ter
dois leitores da mesma coisa era o defeito a evitar.

A tua âncora era:

```js
funcoes.push({ f:nome, nome:String(n.responsavel||""), entidade:String(n.entidade_nomeadora||""),
  ct:String(n.contacto||""), siresp:"", ba:"", g: nomeado? gdhDe(nomeado):"" });
```

Hoje lê-se assim, dentro de `blocoPcoGP` — repara que a entidade foi içada para uma
constante `quem`, porque é usada três vezes:

```js
    funcoes.push({ f:nome, nome:String(n.responsavel||""), entidade:quem,
      ct:String(n.contacto||""), siresp:"", ba:"", g: nomeado? gdhDe(nomeado):"" });
```

E fica:

```js
    funcoes.push({ f:nome, nome:String(n.responsavel||""), entidade:quem,
      ct:String(n.contacto||""), siresp:"", ba:"",
      solicitado: pedido? gdhDe(pedido):"", g: nomeado? gdhDe(nomeado):"" });
```

O `pedido` e o `nomeado` já lá estão, calculados por `instanteCampo(n, "solicitado", …)` e
`instanteCampo(n, "nomeado", …)` — que é a leitura da v1.2, o mesmo campo a aceitar GDH ou
ISO 8601 com fuso. São os dois `.ts`, como no teu.

A outra metade do p0004 — as funções internas a declararem `solicitado:""` — é o
`funcoes.push` de cima na mesma função:

```js
    funcoes.push({ f:nome, nome:String(f.nome||""), entidade:String(f.entidade||""),
      ct:String(f.contacto||""), siresp:String(f.siresp||""), ba:String(f.ba||""),
      solicitado:"", g: instanteCampo(f, "nomeado", "Função "+nome, avisos).g });
```

**Isto não o aplico já**, e a razão é a que tu próprio deste: acrescentar `solicitado` sem
o p0003 seria mudar a forma do estado sem migração e sem subir a `VERSAO_ESTADO`. Duas
linhagens a chegarem à versão 4 com formas diferentes é pior do que esperar.

Sobre a preferência `f.entidade || pcoDef(f).ext`: nos três sítios que citas ela não
existe cá — não há `nomext` nem pendências por célula nesta base. No que existe, o
importador, já vai o nome concreto: `blocoPcoGP` guarda `n.entidade_nomeadora` e só cai na
designação genérica na frase do aviso, quando o pacote não a traz. A v1.2 fixou-o na
regra 10.

## 4. O que eu já verifiquei do p0005, sem o aplicar

Extraí o registo `POSSE` e os acessores e corri-os contra o `novoEstado()` **desta**
linhagem, dentro do r0029, sem tocar em nada:

```
folhas percorridas : 52
ramos orfaos       : (nenhum)
ramos com 2 donos  : (nenhum)
ramos por celula   : comando:3 · planeamento:9 · operacoes:8 · logistica:4 · infra:1
declarados que NAO existem nesta linhagem : [ 'turno' ]
```

O teu mapa cobre o estado desta linhagem por inteiro. O único caminho que declaras e que
aqui não existe é `turno`, que é precisamente o que o p0003 cria. A v1.2 não abriu ramo
nenhum, por isso não há órfão novo do meu lado — e o `dados.pt`, que a v1.2 passou a
escrever pelo envelope da especificação, já está declarado por ti em Logística, com o
art. 13.º, al. c) e o art. 32.º, n.º 1, al. b). Bate certo.

O `folhas > 50` do t0005 passa com folga: 52.

## 5. Numeração

A r0029 é a última entrega desta linhagem e está em `app/`. As r0030 a r0033 são tuas e
não existem neste repositório. Quando fundir, monto com `--revisao 34`: fica um salto de
r0029 para r0034 em `app/`, que é a leitura certa — as quatro do meio saíram do outro
lado.
