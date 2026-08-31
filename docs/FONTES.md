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

### `PTTM06`
**EPSG:3763 — ETRS89 / Portugal TM06**, e o conjunto de matrizes `PTTM_06` publicado pela
Direção-Geral do Território.
Designação usada: `PT-TM06 (ETRS89)`.

Os parâmetros da projeção — Transversa de Mercator sobre o GRS80, meridiano central
8° 07′ 59,19″ W, paralelo de origem 39° 40′ 05,73″ N, fator de escala 1, sem falsa origem —
estão em `fonte/1-nucleo/23-projecao-pttm06.js`.

Os da grelha de mosaicos — canto (-170 000, 290 000) m, mosaicos de 256 px, vinte níveis e
denominador de escala 8 579 799,10714 no nível 0 — **não foram escritos de memória**: saem
do `GetCapabilities` capturado em `tests/fixtures/capacidades/wmts/wmts_dgt_ortos2018.xml`,
e `tests/capacidades.test.mjs` confronta-os com esse documento matriz a matriz.

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
| `PONTOAGUA` | — | O **ponto de água** é figura corrente da manobra e entra em `TIPOS_PONTO`, no mapa operacional, sem artigo que o institua. Não se lhe atribuiu alínea do art. 32.º: aparece na interface como «fonte por confirmar» até haver documento |
| `CARTA` | — | **Qual serviço de cartografia** o posto tem direito a consultar. A aplicação não traz nenhum e passou a saber ler um WMTS pelo seu `GetCapabilities`, que é o que a cartografia oficial publica — a atribuição e os termos vêm de lá e não se escrevem à mão. Falta a decisão institucional: que serviço, e com que direito de uso. A especificação, no agente de topografia da Fase 3, nomeia EU-DEM 25 m (Copernicus), MDT 2 m da DGT, rede viária OSM, COS/DGT e perigosidade ICNF, **pré-descarregados por distrito** — mas isso são dados para calcular, não carta de fundo, e é outro artefacto |
| `ICNFCORS` | — | Os serviços do ICNF (`si.icnf.pt`) **não respondem com `Access-Control-Allow-Origin`**, verificado nas seis capturas de 31-08-2026 em `tests/fixtures/capacidades/cabecalhos/`. Sem esse cabeçalho, uma página aberta em `file://` não lê a resposta, e não há como contorná-lo do lado da aplicação. Falta saber se há endereço alternativo, ou pedido a fazer ao ICNF |

## `FOGO` — comportamento do fogo: declive e vento

**Viegas, D. X. (2004), "Slope and wind effects on fire propagation",
*International Journal of Wildland Fire* 13, 143-156.** Centro de Estudos sobre Incêndios
Florestais, ADAI, Universidade de Coimbra. O documento está em
`docs/fontes/Slope_&_Wind_Effects_on_Fire_Propagation_(Viegas_Domingos_2004).pdf`.

Implementado na r0026, em `fonte/16-comportamento-do-fogo.js`.

### O que está implementado, e de onde vem

O artigo trata a velocidade de propagação como vetor e soma o efeito do declive com o do
vento. Com β o ângulo entre o vetor induzido pelo vento e a linha de maior declive a
subir, e ε a razão entre os dois módulos:

| Equação | O que dá | Onde está |
|---|---|---|
| (2) `ε = Rs / Rw` | Razão declive/vento. **Entrada, não é calculada** | campo `t-eps` |
| (4) `tan δ = sen β / (ε + cos β)` | Desvio da cabeça face à linha de maior declive | `deflexaoFogo` |
| (5) `ξ² = (ε + cos β)² + sen² β` | Velocidade da frente, em unidades da que o vento sozinho daria | `razaoFogo` |

O β é deduzido dos dados que a aplicação já tem — exposição dominante da análise de
relevo e rumo do vento da série meteorológica — e é exato. O artigo dá ainda, de forma
fechada, que **para ε = 1 o desvio é metade do ângulo**; é isso que a aplicação mostra
quando ε não está informado, em vez de inventar um valor.

### O que o modelo não dá, e a aplicação não finge dar

1. **Velocidade absoluta de propagação.** Exige R0, a velocidade básica do combustível.
   O artigo é explícito: *"this input must come from another source"*.
2. **Se o fogo se propaga ou se extingue.** O artigo diz que o modelo não o indica.
3. **Valores de ε para os combustíveis do território.** Os valores que aparecem no artigo
   (0,57, 3 e 4,1) foram ajustados aos ensaios da mesa de combustão de Coimbra, com um
   leito de combustível próprio, teor de humidade entre 10 e 15 % e R0 médio de 0,20 cm/s.
   **Não são transponíveis para o terreno** e não estão inscritos na aplicação.

### O que fica por resolver

Para que a aplicação passe a calcular ε em vez de o pedir, é preciso uma fonte que fixe os
fatores de declive e de vento para os combustíveis nacionais. O artigo remete-os para
outras origens, e o seu apêndice compara duas formulações — a de Rothermel e a de Lopes
(1994) — sem eleger nenhuma para uso operacional. Enquanto essa fonte não existir, ε é um
dado que o oficial introduz, e a aplicação diz de onde vem cada número que mostra.

## Como acrescentar

1. Acrescentar aqui a entrada do documento, com a designação exata usada nas citações.
2. Declarar a chave em `fontes` na regra que o invoca.
3. Correr `npm run testar`. O teste de fontes recusa citação de documento não listado.
