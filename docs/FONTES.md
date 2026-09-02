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

## `FOGOINT` — intensidade da frente e o que ela decide

Quatro documentos chegados a 31 de agosto de 2026, todos em `docs/fontes/`. Tratam do que
o Viegas (2004) deixa de fora: **o que fazer com a velocidade de propagação depois de a ter.**

Nenhum deles está ainda implementado. Esta entrada existe para fixar, antes de se escrever
uma linha, o que cada um autoriza e o que continua a não autorizar.

### `FERNANDES2003` — o documento operacionalmente mais útil dos quatro

**Fernandes, P. M. (2003), "A Avaliação do Comportamento do Fogo no Combate a Incêndios
Florestais", *Revista enB* n.º 27, pp. 18-25.** Departamento Florestal da Universidade de
Trás-os-Montes e Alto Douro — a universidade do território deste posto.
Ficheiro: `A_avaliacao_do_comportamento_do_fogo_no_combate_a_incendios_florestais_Fernandes2003_RevENB.pdf`.

Traz relações fechadas, cada uma com a sua fonte primária, e todas independentes do tipo de
combustível — que é a razão de serem aproveitáveis aqui:

| Relação | O que dá | Fonte primária citada |
|---|---|---|
| `I = R·w / 2`, com R em m/h e w em t/ha | Intensidade da frente, em kW/m | Byram (1959) |
| `I = 300·L²` | Comprimento da chama, por aproximação geral | — |
| Distância de segurança **≥ 4 × altura da chama** | Tolerância de 7 kW/m² de radiação incidente | Butler e Cohen (1998) |
| Largura de corta-fogo **≥ 1,5 × comprimento da chama** | Para suster, sem projeção de faúlhas | Byram (1959) |
| **4 000 kW/m** (chamas > 3,6 m) | Acima disto, atacar a cabeça diretamente é *"perigoso e inconsequente"* | Alexander (2000) |
| Expansão perimetral ≈ **2,5 × R** | Crescimento do perímetro, m/h | Alexander (2000) |
| Perímetro ≈ 2,5 × (R × tempo desde a ignição) | Extensão do perímetro, m | Alexander (2000) |
| Gama de R: 1,5 m/h a ~14 km/h em floresta, 20 km/h em pasto seco | Ordem de grandeza, para recusar entradas absurdas | Alexander (2000) |

Diz ainda que um fogo de propagação dominada pelo vento **toma a forma de uma elipse**, com
intensidade máxima na cabeça, decrescente ao longo dos flancos e mínima na retaguarda.

E um aviso que interessa registar: **Portugal adotou o sistema canadiano de indexação de
perigo** — FFMC, DMC, DC, ISI, BUI, FWI —, mas *"os limites das classes de perigo do índice
FWI definiram-se em função das estatísticas de ocorrência de incêndios a nível distrital, ou
seja, de acordo com um critério puramente administrativo."* Uma classe de perigo do FWI não é
uma medida do comportamento do fogo naquele sítio.

### `COMPFOGO` — a tabela de interpretação para supressão

`COMPORTAMENTO_DO_FOGO.pdf`, 78 diapositivos de formação. **Autoria e instituição não
declaradas no ficheiro**, e por isso a proveniência fica **por confirmar**: cita Rothermel
(1972) e acompanha o conteúdo do artigo anterior, mas isso é indício e não atribuição.

O que traz de aproveitável é a tabela clássica que liga intensidade a decisão de manobra:

| Intensidade (kW/m) | Chama (m) | Interpretação para supressão |
|---|---|---|
| < 350 | < 1,2 | Ataque à cabeça possível, com ferramentas manuais. Linha de contenção manual eficaz |
| 350 – 1 700 | 1,2 – 2,4 | Demasiado intenso para ataque manual. Autotanques. Bulldozer para abrir linha |
| 1 700 – 3 450 | 2,4 – 3,4 | Controlo muito difícil. Podem ocorrer fogos de copas e emissão de faúlhas. Ataque à cabeça provavelmente ineficaz |
| > 3 450 | > 3,4 | Comportamentos extremos. Ataque à cabeça ineficaz. Alguma eficácia do ataque aéreo |

**Correção a fazer ao documento, não a seguir cegamente.** O diapositivo escreve a relação
de comprimento de chama como `Lf = 258·IB^2,17`, e está invertida: é `IB = 258·Lf^2,17`.
Confirma-se pelos próprios exemplos do documento — 258 × 3,6^2,17 = 4 157 kW/m para os
4 213 kW/m que ele declara, e 258 × 3,2^2,17 = 3 220 para os 3 233 que declara. Implementada
como está escrita, a fórmula daria comprimentos de chama absurdos.

As duas formulações concordam onde interessa: a `I = 300·L²` de Fernandes dá 3,75 m para
4 213 kW/m onde a `I = 258·L^2,17` dá 3,6 m, e o limite de 4 000 kW/m corresponde nas duas a
chamas de cerca de 3,6 m.

### `FBP1996` — adotado em Portugal só até meio

**Taylor, S. W. (1996), *Field Guide to the Canadian Forest Fire Behavior Prediction (FBP)
System*.** Canadian Forest Service e B.C. Ministry of Forests, FRDA handbook 012.
Ficheiro digitalizado, sem camada de texto. Em
`docs/fontes/Field_Guide_to_the_Canadian_Forest_Fire_Behavior_Prediction_FBP_System_1996.pdf`.

**Não é transponível para o Douro, e a distinção é essencial:**

- O que Portugal adotou é o **FWI**, a parte de indexação de perigo. Isso está confirmado
  por Fernandes (2003).
- O que o FBP acrescenta são **velocidades de propagação por tipo de combustível**, e os
  dezasseis tipos de referência são canadianos: pícea boreal, pinheiro *jack*, choupo
  tremedor, abeto bálsamo. Nenhum é pinheiro bravo, eucalipto ou matagal mediterrânico.
- O próprio guia avisa: *"Users must be careful not to apply the system beyond its useful
  range"*, e Fernandes escreve que aos modelos empíricos *"não se recomenda o seu uso em
  condições não abrangidas pela base de dados que lhes deu origem."*

Aproveitável dele é a **geometria**, que não depende do combustível: as tabelas 6.1 e 6.2 de
área e perímetro em função da distância percorrida e do vento efetivo, e a razão
comprimento/largura da elipse por velocidade de vento. Com uma reserva de método: essas
tabelas estão em imagem digitalizada, e **números lidos a olho de uma digitalização não
entram no código**. Para as usar é preciso a descrição técnica do sistema — Forestry Canada
Fire Danger Group (1992), Info. Rep. ST-X-3 —, que o guia cita e não inclui.

### `PAIXAO2014` — porque não se usam modelos de combustível de fora

**Paixão, L. G. M. A. (2014), *Simulação de comportamento de fogo em zonas florestais no
Alentejo Central: comparação de modelos de combustível*.** Dissertação de mestrado,
orientada por Pedro Cabral e Nuno Guiomar.
Ficheiro: `SIMULACAO_DE_COMPORTAMENTO_DE_FOGO_EM_ZONAS_FLORESTAIS_NO_ALENTEJO_CENTRAL.pdf`.

Compara conjuntos de modelos de combustível a simular fogos reais com o FARSITE, e conclui
que **os modelos customizados descrevem melhor a vegetação da área de estudo** do que os
conjuntos padrão. Sustenta, com trabalho experimental português, a posição que esta aplicação
já tinha por outra via: um modelo de combustível de outro território dá números e não dá
razão para acreditar neles.

E sustenta também o seu contrário, que é preciso dizer: a área de estudo é o **Alentejo
Central**, não o Douro. Os modelos que lá foram calibrados não se transportam para cá pelo
mesmo argumento que os invalida vindos do Canadá.

### O que estes quatro mudam, e o que não mudam

**Mudam:** deixa de ser verdade que a aplicação nada pode dizer sobre a manobra. Com uma
velocidade de propagação e uma carga de combustível — **ambas dadas pelo oficial**, como já
acontece com o ε —, ficam ao alcance a intensidade da frente, o comprimento da chama, a
distância de segurança, a largura de contenção necessária, o limite de ataque direto e o
crescimento do perímetro. Tudo com fonte declarada e primária.

**Não mudam:** continua a faltar a fonte que dê **R para os combustíveis do Douro**. Nenhum
destes quatro a traz. O que se pode calcular continua a partir de um número que alguém tem de
introduzir, e a aplicação continua a não fingir que o sabe.

## `FOGOMOD` — os modelos de propagação, e porque nenhum deles resolve o que falta

Mais três documentos, a 31 de agosto de 2026. Tratam do modelo que está por baixo de quase
tudo o que se usa no mundo — o de Rothermel (1972) — e de como se combinam o vento e o
declive. Nenhum está implementado; esta entrada diz o que autorizam.

### `WEISE1997` — o que valida o que já fizemos, e onde não valida

**Weise, D. R. e Biging, G. S. (1997), "A Qualitative Comparison of Fire Spread Models
Incorporating Wind and Slope Effects", *Forest Science* 43(2), pp. 170-180.**
Ficheiro: `A_Qualitative_Comparison_of_Fire_Spread_Models_Weise_Biging_1997.pdf`.

É o documento mais pertinente dos três, porque trata exatamente do que a r0026 implementou
a partir do Viegas (2004): **combinar o efeito do vento com o do declive por soma
vetorial**. Os autores confrontam quatro modelos — Rothermel, medidores de McArthur,
sistema canadiano FBP e o modelo físico de Pagni e Peterson — com fogos de laboratório em
que o vento e o declive foram variados **ao mesmo tempo**, o que dizem ser inédito.

O que sustenta:

- A composição vetorial é a família de métodos correta: as versões de Rothermel com o
  método de Albini, e o modelo de Pagni, *"closely mimicked the shape of the rate of spread
  response to various combinations of wind and slope"*.
- Entre os três métodos propostos para o modelo de Rothermel, **o de Albini é o mais
  apropriado** segundo este estudo.

O que avisa, e que interessa mais:

- **O vento e o declive não são completamente aditivos na cabeça do fogo.** É achado
  experimental, não conjetura.
- As diferenças entre os métodos de Albini, Rothermel e McAlpine estão todas no
  **tratamento dos valores negativos de φs − φw** — ou seja, no caso em que o vento e o
  declive se opõem. É precisamente o caso em que o desvio da cabeça mais importa, e onde a
  aplicação deve ser mais prudente com o que mostra.
- O FBP e o McArthur **sobrestimaram**, e uma das causas apontadas é *"application of
  equations derived from full-scale fires to laboratory-scale fires"*. O argumento da
  não-transponibilidade vale nos dois sentidos: do terreno para o laboratório também.

Consequência para esta aplicação: confirma que mostrar **a forma da resposta** — direção do
desvio, velocidade relativa — está bem fundamentado, e que **um número absoluto não está**.
É o que a r0026 já fazia; agora está fundamentado por mais do que uma fonte.

### `ROTHERMEL2008` — o enquadramento, não a matéria

**Wells, G. (2008), "The Rothermel Fire-Spread Model: Still Running Like a Champ",
*Fire Science Digest* n.º 2, Joint Fire Science Program.**
Ficheiro: `The_Rothermel_Fire_Spread_Model_Still_Running_Like_a_Champ_Wells_2008.pdf`.

Divulgação, não artigo científico: conta como o modelo de 1972 sobreviveu trinta e cinco
anos e onde falha. Serve para enquadrar decisões e para explicar a escolha a quem não é do
ofício. **Não se cita para fundamentar cálculo nenhum** — para isso cita-se o Rothermel
original, ou o Weise que o testou.

### `SCOTT2005` — os quarenta modelos de combustível, e o país deles

**Scott, J. H. e Burgan, R. E. (2005), *Standard Fire Behavior Fuel Models: A Comprehensive
Set for Use with Rothermel's Surface Fire Spread Model*.** USDA Forest Service, Rocky
Mountain Research Station, General Technical Report RMRS-GTR-153.
Ficheiro: `Standard_Fire_Behavior_Fuel_Models_Scott_Burgan_2005_RMRS-GTR-153.pdf`.

É o conjunto que substitui os treze modelos de Anderson (1982) e que alimenta o modelo de
Rothermel — os parâmetros de combustível que a Estação não tem. Traz também os **modelos
dinâmicos**, em que a carga herbácea viva passa a morta em função do seu teor de humidade,
que é um mecanismo real e não um afinamento.

E traz o mesmo problema dos outros: **são modelos dos Estados Unidos**, financiados pelo
projeto LANDFIRE e construídos para a vegetação de lá.

Aqui o círculo fecha-se, e é a razão de este documento valer a pena: a dissertação de
Paixão (2014) — ver `FOGOINT` — usou **estes** modelos, através do FARSITE, em fogos reais
do Alentejo Central, e concluiu que os modelos customizados descrevem melhor a vegetação do
que os conjuntos padrão. Não é uma opinião sobre transponibilidade: é uma medição feita em
Portugal com este conjunto.

### O que os três, juntos, resolvem

Nada do que falta — **a leitura acima é de antes de a `FOGOPT` chegar**, e fica como estava
porque continua verdadeira quanto a estes três: descrevem a máquina que precisaria de R
para trabalhar, e nenhum deles o dá para os combustíveis do Douro. Quem o dá é a `FOGOPT`,
adiante, com as reservas que lá estão escritas.

O que estes três dão é fundamento para a posição que a aplicação já tinha: a composição
vetorial de vento e declive está validada experimentalmente **na forma da resposta**, e é
isso e só isso que se mostra.

## `FOGOPT` — os quadros portugueses que dão a velocidade de propagação

Chave invocada por `fonte/3-planeamento/21-modelos-de-combustivel.js`, que traz o motor de
propagação, e pelo painel de estimativa em `19-intensidade-da-frente.js`.

**Os dois documentos chegaram — o manual a 1 de setembro, os modelos a 2 — e estão em
`docs/fontes/`:**

- FERNANDES, P.M., BOTELHO, H.S., LOUREIRO, C., 2002. *Manual de Formação para a Técnica
  do Fogo Controlado.* UTAD. **Em
  `docs/fontes/Manual_de_Formacao_para_a_Tecnica_do_Fogo_Controlado_Fernandes_Botelho_Loureiro_2002.pdf`**,
  144 páginas. A capa e a folha de rosto foram lidas e conferem: os três autores por esta
  ordem, UTAD, 2002. Daqui vêm o Quadro 3.2.1 (humidade do combustível morto fino), o 3.3.1
  (vento à superfície), os 3.4.1 a 3.4.3 (propagação em matos) e os 7.1 e 7.2 (propagação em
  pinheiro bravo).
- FERNANDES, P.M., LOUREIRO, C., 2021. *Modelos de combustível florestal para Portugal —
  documento de referência, versão de 2021.* Departamento de Ciências Florestais e Arquitetura
  Paisagista, UTAD; financiado pelo projeto POCI/AGR/61164/2004. Em
  `docs/fontes/Modelos_de_combustivel_florestal_para_Portugal_Fernandes_Loureiro_2021.pdf`,
  17 páginas. **Chegou a 2 de setembro. A transcrição dos 18 modelos e das cargas continua
  por conferir contra ele** — é o próximo trabalho de conferência, e agora é possível.

### O que está confirmado, e o que não está

**Confirmada está a existência e a referência do manual de 2002b**: Fernandes (2003), que
está em `docs/fontes/` e se lê aqui, cita-o na sua bibliografia com esta designação exata.
Não é uma obra inventada nem uma referência aproximada.

**Confirmada está a coerência interna dos quadros transcritos**, por
`tests/propagacao.test.mjs`: a propagação cresce com o vento e decresce com a humidade em
todas as células, os fatores de altura e declive comportam-se como fatores, o extremo
superior fica dentro do que Alexander (2000) reconhece para floresta, e nenhuma combinação
produz velocidade negativa.

### O Quadro 3.4.1 está conferido — 252 células, todas certas

**Feito a 2 de setembro, contra o impresso, na página `E_10` do guia E1.** O quadro tem 21
linhas de velocidade do vento (0,5 a 30 km/h a 2 m) por 12 colunas de humidade do combustível
morto (8 a 40 %). **As 252 células conferem, uma a uma, com `Q_MAT_R`.** Os dois eixos também:
`Q_MAT_U` e `Q_MAT_H` são exatamente os do impresso.

E o rodapé do quadro, que vale tanto como os números:

> «Velocidades de propagação de fogos a favor do vento em **terreno plano (declive <5%)** para
> matos com 1 m de altura.»

Isto confirma em primeira mão o que a linhagem paralela citava do artigo de 2001, que este
repositório não tem: **a tabela base foi medida em terreno plano.** A correção de declive do
Quadro 3.4.3, que chega a ×2,6 aos 50 %, aplica-se portanto fora das condições da medição — e
num vale de socalcos o declive é a variável dominante. A aplicação passou a assinalá-lo em
cada estimativa com declive acima de 5 %.

**Continua por confirmar a transcrição dos restantes quadros:** o 3.2.1 (humidade), o 3.3.1
(vento à superfície), o 3.4.2 (altura), o 3.4.3 (declive) e os 7.1 e 7.2 (pinheiro bravo).

**Sobre esses, é preciso dizê-lo sem rodeios:** uma tabela mal copiada passa em qualquer teste de coerência e devolve comportamento
do fogo errado com toda a confiança do mundo.

Até 1 de setembro isto era impossível de resolver, porque o manual não existia aqui. **Agora
existe**, e a reserva passa de «não há como conferir» a «está por conferir», que é outra
coisa. Duas notas práticas sobre o que essa conferência exige:

- **O PDF é digitalizado e não tem camada de texto.** Não há como extrair os quadros por
  máquina nem comparar cadeias de caracteres: conferir significa abrir cada página de quadro
  e ler célula a célula. Foi assim que se conferiu o 3.4.1, e resultou.
- Ficam seis por conferir, e o mais pesado — o 3.4.1, com 252 células — já está feito.

Enquanto não estiver feito, **o que muda é a natureza da dúvida, não a sua existência**, e os
números continuam a valer para ordem de grandeza e comparação de cenários.

**Não está confirmada a atribuição dos modelos de 2021.** Os 18 códigos, descrições e
cargas foram transcritos com a referência acima; a referência não foi verificada contra
nenhum documento em mão.

### A ponte para Viegas, que não é de nenhuma das fontes

Os quadros de Fernandes são multiplicativos: o declive amplia a propagação que o vento já
produziu. Viegas (2004) — ver `FOGO` — é vetorial: o declive acrescenta parcela própria. Para
passar de um para o outro, `epsilonDosQuadros` toma como parcela de declive o acréscimo que
o declive produz sobre a propagação sem vento, e como parcela de vento o acréscimo do vento
sobre a mesma base.

**Isto não está em Fernandes nem em Viegas.** É uma ponte declarada, escrita no módulo e
mostrada no ecrã, precisamente para poder ser recusada por quem a leia. Quem discordar dela
não está a discordar de nenhuma das duas fontes.

### As duas recusas que estes quadros trazem

1. **Acima de 25 °C** o Quadro 3.2.1 traz impresso que não é válido. A aplicação recusa em
   vez de avisar: um aviso ignora-se às três da manhã, uma recusa obriga a ir buscar o
   número a quem o tem — ao FWI ou a medição.
2. **Eucaliptal, folhosas e formações herbáceas não têm motor português.** Os guias cobrem
   matos (E1) e pinheiro bravo (E2), e mais nada. Para o resto a aplicação diz que a
   velocidade tem de ser observada no terreno, em vez de a arbitrar por semelhança.

### Os tectos de saída, e a proveniência de cada um

A aplicação marca a velocidade de propagação que sai do domínio medido. Os três números não
têm a mesma proveniência, e a diferença fica escrita no código:

| Tecto | O que é | Proveniência |
|---|---|---|
| **2 280 m/h** | 38 m/min, a célula mais rápida do Quadro 3.4.1 | **Conferida contra o impresso** a 2 de setembro. Acima disto só as correções lá chegam |
| **360 m/h** | 6 m/min, acima dos quais a fonte desaconselha usar as equações | **Conferido em primeira mão** — ver `FOGOSHRUB`, abaixo |
| **1 200 m/h** | 20 m/min, o fogo mais rápido do conjunto de 29 fogos | **Conferido em primeira mão**, na Tabela 1 do mesmo artigo |

**Os três tectos deixaram de ser de segunda mão a 2 de setembro**, quando o artigo de 2001
chegou. Estiveram um dia declarados como relatados; agora estão lidos.

**Os tectos são dos matos e ficam nos matos.** O guia E2, do pinheiro bravo, não tem tecto
declarado que se conheça, e emprestar-lhe o dos matos seria atribuir a uma fonte o que ela não
diz. Fica sem marca, e dito porquê.

### O que fica pedido

Nada de documentos: **os três que faltavam chegaram todos.** O que fica é trabalho de
conferência — os seis quadros do manual que ainda não foram lidos contra o impresso, e os 18
modelos de combustível contra o documento de 2021.

Enquanto isso não estiver feito, todo o número que sai deste motor é bom para ordem de
grandeza e para comparar cenários entre si — não para sustentar sozinho uma decisão de ataque
direto.

## `PTFIRESPRD` — velocidades de propagação medidas em incêndios portugueses reais

**Benali, A., Guiomar, N., Gonçalves, H., Mota, B., Silva, F., Fernandes, P.M., Mota, C.,
Penha, A., Santos, J., Pereira, J.M.C., Sá, A.C.L. (2023), *The Portuguese Large Wildfire
Spread database (PT-FireSprd)*, Earth System Science Data 15, 3791-3818.** Em
`docs/fontes/PT-FireSprd_Portuguese_Large_Wildfire_Spread_database_Benali_2023.pdf`.

**Chegou a 1 de setembro e ainda não foi lido com atenção. Nada na aplicação o invoca**, e
esta entrada existe para o declarar, não para autorizar seja o que for.

Fica registado porque é, à primeira vista, o documento que responde à objeção que
atravessa todo este ficheiro. As outras fontes de propagação são ou de fora (`SCOTT2005`,
`FBP1996`, `WEISE1997`) ou de fogo controlado, de Outono e Primavera e de baixa intensidade
(`FOGOPT`). Esta é **medição de propagação em grandes incêndios portugueses**, com Paulo
Fernandes entre os autores — o mesmo autor dos quadros que a aplicação já usa.

O que isso permitiria, se se confirmar na leitura: confrontar o que o motor de fogo
controlado estima com o que se mediu em incêndios de verão a sério. **Não é o mesmo que
validar o motor** — e a diferença entre as duas coisas é precisamente o que esta aplicação
não pode confundir.

## `FOGOSHRUB` — o artigo de onde saem os tectos, lido em primeira mão

**Fernandes, P.A.M. (2001), *Fire spread prediction in shrub fuels in Portugal*, Forest
Ecology and Management 144: 67-74.** UTAD, Quinta de Prados, Vila Real. Em
`docs/fontes/Fire_spread_prediction_in_shrub_fuels_in_Portugal_Fernandes_2001.pdf`.

Chegou a 2 de setembro, e fecha a proveniência dos tectos de saída que a `r0079` já usava.
**Não foi preciso mudar um número:** o que a linhagem paralela tinha relatado está correto.

### O que está lido, e onde

**O tecto dos 6 m/min**, palavra por palavra do artigo:

> «given the scarce data availability for rates of spread above 6 m min⁻¹, it is not advisable
> to use the equations outside the low fire behaviour range»

**O domínio de ajustamento**, da Tabela 1 — 29 fogos experimentais e de fogo controlado:

| | R (m/min) | U a 2 m (km/h) | T (°C) | HR (%) | Md (%) | Declive (%) |
|---|---|---|---|---|---|---|
| Média | 4,4 | 9 | 14 | 53 | 21 | **1** |
| Mínimo | 0,7 | 1 | 6 | 30 | 10 | **0** |
| Máximo | **20,0** | 27 | 22 | 93 | 40 | **5** |

Daqui saem os dois tectos que a aplicação usa: **6 m/min = 360 m/h** para a marca de
extrapolação, **20 m/min = 1 200 m/h** para o «além de qualquer fogo medido». E o declive
máximo de **5 %** confirma, por segunda via, o que o rodapé impresso do Quadro 3.4.1 já dizia:
a tabela base é de terreno plano.

### Uma terceira ressalva, que ninguém tinha relatado

O artigo declara também um **enviesamento de composição**:

> «the equations may be biased towards the EU±CT communities, which provided more than
> two-thirds of the data for the modelling work»

`EU-CT` é urzal de *Erica* com *Chamaespartium tridentatum*. Dois terços dos dados vêm dessa
formação. **Isto não está na aplicação** e fica registado aqui: quem usar a estimativa noutro
tipo de mato está a aplicar um modelo maioritariamente ajustado a um urzal.

Vale a pena notar que essa é uma formação do Nordeste de Portugal — a nossa região. O
enviesamento pode jogar a favor do Douro em vez de contra, mas **isso é uma hipótese e não uma
leitura**: o artigo não desagrega o subconjunto, e nada aqui o deve afirmar sem que alguém o
confirme com o autor, que está em Vila Real.

### O que o artigo dá e a aplicação não usa

As três equações contínuas de propagação, com os erros-padrão. A aplicação usa os **quadros**
do manual de 2002, não estas equações. Correr as duas e usar a divergência como banda de
incerteza medida é uma possibilidade registada em `docs/POREXECUTAR.md`, e não está feita.

## Os diplomas, em primeira mão — chegaram a 2 de setembro

Até aqui a aplicação citava o articulado do SGO e do SIOPS **sem os ter no repositório**.
Toda a verificação doutrinária assentava em transcrições dos ramos, que é revisão por
terceiro e não leitura primária. Deixou de ser assim.

### `Despacho_4067_2024_Regulamentacao_SGO.pdf`

O Despacho n.º 4067/2024, de 15 de abril — Diário da República, 2.ª série, n.º 74. É a fonte
da chave `SGO4067`, e agora é conferível linha a linha em vez de citada de cor.

**Conferido no dia em que chegou**, contra as transcrições do ramo #006 que sustentam as
fases de exigibilidade do PCO. As quatro batem palavra por palavra:

| Onde | Texto |
|---|---|
| Art. 41.º, n.º 2, al. b) | «O posto de comando operacional é instalado, integrando a célula de operações e o adjunto de segurança» |
| Art. 42.º, n.º 2, al. b) | «…integra as células de operações, de planeamento e de logística e finanças e os adjuntos de segurança e de ligação» |
| Art. 43.º, n.º 2, al. b) | «…e os adjuntos de segurança, de relações públicas e de ligação, bem como o coordenador do posto de comando operacional» |
| Art. 14.º, n.º 5 | «Os oficiais de operações, de planeamento e de logística e finanças são, respetivamente, responsáveis pelas células…» |

**A errata da fase VI fica confirmada na fonte:** o art. 45.º, n.º 2, al. b) inclui o adjunto
de segurança, que a matriz do Anexo I omite. O articulado prevalece, e é o que a aplicação
segue.

**E a base dos núcleos também:** arts. 16.º, n.º 3, 26.º, n.º 4 e 31.º, n.º 3 entregam a
ativação ao oficial da respetiva célula «em função da natureza da ocorrência e das
necessidades», sem referir fase nenhuma. É o que justifica os núcleos não levarem número.

### `Cartograma_SeriesCartograficas_CIGeoE.pdf`

Cartograma das séries cartográficas: continente, Madeira na série P821, Açores na série M889,
com as coberturas VMAP e DTED.

**Não é uma carta anotada** — por isso não está em `docs/cartografia/`, que guarda o que se
riscou no PCO e segue outra convenção de nomes. É o índice de que folhas existem e em que
série, que é o que se consulta antes de fotografar uma folha da carta militar para a
calibrar na aplicação.

### `Decreto_Lei_90_A_2022_SIOPS.pdf`

Decreto-Lei n.º 90-A/2022, de 30 de dezembro — Sistema Integrado de Operações de Proteção e
Socorro. Citado na especificação e na base doutrinária; por ler em primeira mão.

### `Decreto_Lei_45_2019_Organica_ANEPC.pdf`

Decreto-Lei n.º 45/2019, de 1 de abril — orgânica da ANEPC. Contexto institucional; a
aplicação não o cita hoje.

## Recebidos e por ler

Documentos que estão em `docs/fontes/` e **não sustentam nada na aplicação**. Chegaram, foram
guardados e nunca foram lidos com atenção nem declarados. Ficam nomeados aqui pelo que a sua
folha de rosto diz, e por mais nada: o que se segue não é uma leitura, é um inventário.

A regra da pasta é que um documento entra **antes** de ser implementado, com a entrada a
dizer o que autoriza. Estes cinco entraram sem ela. Enquanto a entrada não for escrita,
**nenhum número da aplicação pode invocá-los** — e o `npm run arrumado` passa a recusar que
volte a haver um documento nesta pasta sem uma linha aqui.

| Ficheiro | O que a folha de rosto diz | Porque interessa |
|---|---|---|
| `modPropagacoFogo1.pdf` | André, J.C.S. e Viegas, D.X. (2001), *Modelos de Propagação de Fogos Florestais: Estado-da-Arte para Utilizadores — Parte I: Introdução e Modelos Locais*, Silva Lusitana 9(2): 237-265 | Estado da arte **em português e para utilizadores**, dos mesmos autores do modelo de composição vetorial que a aplicação já usa. É o candidato mais direto a enquadrar o que se fez |
| `ModelosPropagaFogos2.pdf` | Os mesmos autores (2002), *Parte II: Modelos Globais e Sistemas Informáticos*, Silva Lusitana 10(2): 217-233 | A segunda metade do mesmo artigo |
| `FirePropagationCanyons.pdf` | Viegas, D.X. e Pita, L.P., *Fire Spread in Canyons*, Universidade de Coimbra e ADAI | **Vales encaixados.** O teatro do Douro é isso, e a aplicação não diz nada sobre o que o vale faz à propagação |
| `Field_Guide_for_Predicting_Fire_Behaviour_in_Ontarios_Tallgrass_Prairie.pdf` | Kidnie, S.M., Wotton, B.M. e Droog, W.N., *Field Guide for Predicting Fire Behaviour in Ontario's Tallgrass Prairie* | Formações herbáceas, que é justamente onde os guias portugueses não têm motor. **Mas é do Ontário**, e a objeção de transponibilidade da `SCOTT2005` aplica-se por inteiro |
| `Flame_length_fireline_intensity_relationships_Rossa_Davim_2024_WF23127.pdf` | Rossa, C.G. e Davim, D.A. (2024), *Field-based generic empirical flame length–fireline intensity relationships for wildland surface fires*, IJWF 33, WF23127 | **É o candidato a substituir o `I = 300·L²` que a aplicação usa hoje.** Inclui dados de fogo de alta intensidade, que é onde a relação de Byram (1959) é mais fraca. Nota: a autoria é de **Rossa e Davim**, e não de Fernandes como um dos registos de conversa dizia |
| `Particle_Surface_Area_to_Mass_Ratio_Rossa_Davim_Fernandes.pdf` | Rossa, Davim e Fernandes, sobre razão superfície/massa, tempo de residência da chama e taxa de perda de massa | Matéria do leito de combustível, a montante do que a aplicação faz |
| `Variacao_sazonal_do_fogo_em_folhada_de_caducifolias_Nobrega_UTAD.pdf` | Nóbrega, C.J.M., dissertação de mestrado em Engenharia Florestal, UTAD | Folhada de caducifólias — o modelo `F-FOL`, que é dos que **não têm motor português** |
| `Redes_de_Comunicacoes_de_Emergencia_e_Seguranca_Geraldes_dissertacao.pdf` | Geraldes, C.J.B., *Redes de Comunicações de Emergência e Segurança*, dissertação de mestrado | **Pode responder à pergunta que está em aberto desde agosto**: a composição das pastas SIRESP por sub-região, que a aplicação recusa deduzir por não estar confirmada em fonte. Por ler |
| `Fire_Weather_Guide_for_Application_of_Meteorological_Information_Schroeder_Buck_1970.pdf` | Schroeder e Buck (1970), o clássico do serviço florestal norte-americano | Meteorologia de incêndio. Não é português e não é doutrina daqui |
| `Prescribed_Fire_Weather_Module_OSU_Extension_EM9385.pdf` | Módulo de extensão da Oregon State University sobre meteorologia para fogo controlado | Formação, não fonte |
| `NWCG_PMS412_Origin_and_Cause_Determination_References.pdf` | Lista de referências do guia NWCG de determinação de origem e causa | É uma bibliografia, não um documento de fundo |
| `LIVRO_Florestas_e_Legislacao_planos_municipais_de_defesa_da_floresta_contra_incendios.pdf` | Antunes, M.J., Lopes, D. e Oliveira, C. (coord.), *Florestas e Legislação: Planos Municipais da Defesa da Floresta Contra Incêndios* | Matéria jurídica de defesa da floresta. Não é doutrina de comando, e não se lhe viu ainda ligação a nenhuma regra do motor de conformidade |

## Como acrescentar

1. Acrescentar aqui a entrada do documento, com a designação exata usada nas citações.
2. Declarar a chave em `fontes` na regra que o invoca.
3. Correr `npm run testar`. O teste de fontes recusa citação de documento não listado.
