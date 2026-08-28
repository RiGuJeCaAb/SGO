# Fontes doutrinárias

Uma entrada por documento invocado pela aplicação. Cada regra do registo de conformidade
declara em `fontes` as chaves dos documentos que cita, e `tests/fontes.test.mjs` verifica
que nenhuma regra invoca documento que não conste desta lista.

Isto serve a restrição de conformidade auditada: a lista de fontes citadas passa a ser
verificável por comparação, e não por leitura.

## Documentos citados pelo motor de conformidade

### `SGO4067`
**Despacho n.º 4067/2024, de 15 de abril** — regulamentação do Sistema de Gestão de
Operações.
Designação usada nas citações: `Despacho n.º 4067/2024`.

Pontos invocados: art. 4.º e art. 4.º, n.º 4 (hierarquização das comunicações);
art. 8.º, n.º 2, al. e); artigos 13.º, n.º 2, e 14.º, n.º 1 (estrutura do PCO);
art. 17.º, al. c); art. 20.º, n.os 6 e 7; art. 22.º; art. 32.º, al. d) (competências das
células); art. 34.º; art. 46.º; Anexo I.

### `DON2`
**Diretiva Operacional Nacional n.º 2 — DECIR 2026**.
Designação usada nas citações: `DON n.º 2 / DECIR 2026`, ou `DON n.º 2` quando aparece a
seguir a outra referência na mesma linha.

Pontos invocados: 7.d.(5), 7.d.(7), 7.d.(8), 7.d.(14), 7.d.(17), 7.d.(18), 7.d.(19),
7.d.(20), 7.d.(22), 7.d.(23), 7.d.(25)(d), 7.d.(27), 7.d.(30); 7.e.(4)(o), 7.e.(4)(t),
7.e.(5), 7.e.(5)(a), 7.e.(5)(r), 7.e.(5)(t); 7.k.(1), 7.k.(2); 7.l.(1), 7.l.(2);
10(1), 10(2), 10(3), 10(5).

### `DON1`
**Diretiva Operacional Nacional n.º 1 — DIOPS**.
Designação usada nas citações: `DON n.º 1 / DIOPS`.

Matéria invocada: organização das comunicações, incluindo a alínea e).

## Documentos da base doutrinária ainda não invocados pelo motor

Constam da especificação e enquadram a aplicação, mas nenhuma regra de conformidade os
cita neste momento. Ficam listados para que o façam quando for caso disso.

| Chave | Documento |
|---|---|
| `SIOPS` | DL n.º 90-A/2022, de 30 de dezembro — SIOPS |
| `DIRACAERO` | DON n.º 4 / DIRACAERO — meios aéreos, COPAR |

## Fontes por confirmar

Não devem ser dadas como assentes, e estão marcadas como tal na interface. Ver a secção 9
da especificação.

| Chave | Documento | O que falta confirmar |
|---|---|---|
| `NEP8` | NEP n.º 8/NT/2010 | Numeração, para a banda alta de VHF. Não verificada linha a linha |
| `NEPSIRESP` | NEP n.º 1/DIC/2026, NEP n.º 2/CNEPC/2022, NOP n.º 1701/2018 | Grupos SIRESP. A designação PC COM 1 a 5 foi deduzida por coerência; as séries CT e CM assentam em equivalência declarada, e só o CM4 tem confirmação direta |

## `FOGO` — modelo de comportamento do fogo

**Decidido em 2026-08-28:** modelo completo de propagação de superfície, com os dados de
entrada a serem introduzidos pelo oficial. **A implementação está retida à espera do
documento da fonte**, sem o qual não se escreve uma linha: um coeficiente ou um limiar
inventado num documento de comando é pior do que não haver módulo nenhum.

### O que o documento tem de fixar

A designação «Rothermel / FBP» junta dois sistemas distintos, que dão resultados
diferentes e pedem dados de entrada diferentes. O documento tem de resolver, no mínimo:

| Ponto | Porquê é preciso |
|---|---|
| **Qual o sistema** — modelo de propagação de superfície de Rothermel, ou o Sistema FBP canadiano | São formulações distintas, com catálogos de combustível próprios. Não se misturam |
| **Catálogo de modelos de combustível** e a sua adaptação ao território nacional | É a entrada de maior peso no resultado. Sem catálogo fixado não há como o oficial escolher |
| **Conversão do vento para a altura de referência do modelo** | A série meteorológica dá vento a 10 m; o modelo pede vento a meia-chama. O fator de conversão é doutrinário, não é escolha do programador |
| **Estimativa da humidade dos combustíveis mortos** | Ou a aplicação pede os valores ao oficial, ou os deriva da série meteorológica por um método com fonte. As duas vias são aceitáveis; a escolha não é minha |
| **Classes de interpretação operacional** — comprimento de chama ou intensidade de linha, e o que cada classe significa para a capacidade de supressão | É isto que transforma um número em decisão de comando. Sem as classes, o módulo produz um valor sem consequência |

### Custo operacional, para a decisão ser informada

O modelo completo pede **quatro a seis campos novos por setor**, preenchidos à mão num
PCO. Vale a pena confirmar, com quem vai usar a aplicação, que esse preenchimento é
comportável durante uma ocorrência. Se não for, a alternativa é reduzir a entrada a um
modelo de combustível por setor e derivar o resto da série meteorológica — o que exige
que o documento fixe também o método de derivação.

### Enquanto a fonte não chega

O módulo não é escrito. Os indicadores que já têm fonte — janela de consolidação, horas
críticas de humidade relativa, alinhamento relevo×vento, assinatura convectiva —
continuam a servir, e estão declarados no registo de regras.

## Como acrescentar

1. Acrescentar aqui a entrada do documento, com a designação exata usada nas citações.
2. Declarar a chave em `fontes` na regra que o invoca.
3. Correr `npm run testar`. O teste de fontes recusa citação de documento não listado.
