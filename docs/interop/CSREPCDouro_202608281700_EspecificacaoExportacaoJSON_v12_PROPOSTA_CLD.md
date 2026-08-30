# Proposta de v1.2 — Gestão PCO → Estação PEA

> **Arquivado.** Esta proposta foi acolhida: o documento em vigor é a v1.2, de 28 de
> agosto — `CSREPCDouro_202608281845_EspecificacaoExportacaoJSON_v12_CLD.md`, na mesma
> pasta —, que substitui a v1.1 na íntegra. Fica pelo registo do raciocínio. Onde diverge
> do documento em vigor, é este que está desatualizado: em particular, a v1.2 resolveu os
> instantes com fuso **dentro do próprio campo**, e não em campos irmãos `_iso` como aqui
> se propunha.

**Proposta, não documento em vigor.** Acrescenta à especificação v1.1 os três pontos do
contrato `pco:dispositivo` que sobrevivem, mais um quarto que o exame do código expôs.
Nada aqui substitui a v1.1: acrescenta-se-lhe.

## Qual documento governa

| Documento | Estado |
|---|---|
| `CSREPCDouro_202608271715_EspecificacaoExportacaoJSON_CLD.md` (v1.1) | **Em vigor.** É o que a Gestão PCO deve implementar |
| `CSREPCDouro_d0002_202608281630_ContratoGestaoPCO_CLD.md` | **Arquivado.** Foi escrito a analisar um esboço anterior, não a v1.1; o seu autor corrigiu-se. Sobram os acréscimos abaixo |
| Esta proposta | **Por decidir.** Se for adotada, passa a `versao: "1.2"` |

O importador da Estação lê os três envelopes — v1.1, o contrato e o esboço antigo — e
normaliza-os numa forma só. Ler mais do que um envelope não é hesitar sobre qual manda:
é o que um adaptador faz, porque quem importa não escolhe o que lhe chega às mãos.

## 1. Bloco `pco` — estrutura do posto de comando

A v1.1 não exporta nomeações. Não era lacuna dela: só passou a fazer sentido depois de a
Estação repartir o PEA pelas células. É acréscimo genuíno.

```json
"pco": {
  "funcoes": [
    { "funcao": "Oficial de Operações", "nome": "...", "entidade": "...",
      "contacto": "...", "nomeado": "271205AGO26", "siresp": "...", "ba": "..." }
  ],
  "nucleos_externos": [
    { "nucleo": "Núcleo de Segurança", "entidade_nomeadora": "GNR",
      "solicitado": "271310AGO26", "nomeado": "271352AGO26",
      "responsavel": "...", "contacto": "..." }
  ]
}
```

`funcao` e `nucleo` usam **exatamente** a designação do art. 14.º e dos arts. 18.º a 38.º.
Sem abreviaturas: a Estação cruza esta cadeia com as funções exigíveis pela fase do SGO e
pelo dispositivo, e um nome aproximado falha o cruzamento em silêncio.

Os três núcleos do art. 17.º, n.º 2, als. d), e) e f) são nomeados por entidade externa a
pedido do COS. São **dois instantes distintos**, e a distância entre eles é informação
operacional: transmitem-se ambos, e `nomeado` vem a nulo enquanto o pedido estiver
pendente.

## 2. Comunicações ficam de fora

A v1.1 previa um bloco `comunicacoes` para uma v2.0. **Não deve existir.**

O ponto 10, n.º 3 da DON n.º 2 diz que no TO existe apenas um plano de comunicações e não
se usam canais que nele não estejam previstos. Transportar canais numa exportação de
dispositivo cria uma segunda fonte de verdade para uma coisa que a doutrina manda ter
fonte única. É a mesma lógica de «uma verdade por domínio» que a v1.1 defende na secção 6,
aplicada às comunicações.

Os campos `siresp` e `ba` em `pco.funcoes` são a exceção justificada: registam a que canal
cada função nomeada está a escutar, o que é atribuição, não plano.

## 3. Comparação de versões

`versao` é uma cadeia — `"1.1"`. É uma armadilha clássica: a comparação de cadeias diz que
`"1.10"` é anterior a `"1.9"`.

Duas saídas, e qualquer serve desde que fique escrita: ou o importador compara por partes
numéricas, ou o campo passa a inteiro monotónico. **O importador da Estação já compara por
partes numéricas**, e há teste que o fixa. Se a v1.2 for adotada, convém declará-lo na
especificação para que a Gestão PCO não presuma o contrário.

## 4. Instantes — acréscimo que o código expôs

A v1.1 transmite tempos em GDH doutrinário (`251430AGO26`). O contrato usava ISO 8601 com
fuso. **O GDH não leva fuso horário.**

Em operação nacional, com uma só zona horária, não é problema. Passa a ser em dois casos
concretos: uma exportação gerada num sistema em UTC e lida num posto em hora local, e a
transição da hora de verão, em que existe uma hora repetida.

Proposta mínima, sem quebrar nada: manter o GDH como está e acrescentar, opcionalmente,
`inicio_iso` e `empenhado_desde_iso` em ISO 8601 com fuso. Quando vierem, a Estação
prefere-os; quando não vierem, usa o GDH como hoje. Nenhum leitor existente se parte.

## O que mais importa acertar, por ordem de valor operacional

1. **`empenhado_desde` e `entrada_to`.** A própria v1.1 declara-os o item de maior valor de
   todo o esquema. Sem eles não há projeção de rendições nem controlo dos tempos de
   trabalho que sustenta o pedido ao CSREPC.
2. **`ocorrencia.inicio`.** É a base do limiar dos 90 minutos que torna exigível o PEA
   formalmente elaborado.
3. **Lista nominal de aeronaves, com indicativo.** Aciona os limiares do COPAR-T e do
   COPAR-Ar e conta o tempo de cada aeronave no TO.
4. **Designações de função exatas**, se o bloco `pco` for adotado.
