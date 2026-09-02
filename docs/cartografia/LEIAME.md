# Cartografia de referência

O que aqui está não é doutrina nem prova de verificação: é **o alvo**. São cartas de uma
ocorrência real — Cabeça Boa, Vilarinho da Castanheira, Carrazeda de Ansiães —, anotadas
no posto de comando, e mostram o que um mapa operacional tem de conseguir dizer.

| Ficheiro | O que é |
|---|---|
| `CSREPCDouro_ref01_CabecaBoa_CartaMilitar_CLD.png` | O teatro sobre carta militar, anotado à mão no PCO |
| `CSREPCDouro_ref01_CabecaBoa_Relevo_CLD.png` | O mesmo teatro sobre relevo |
| `CSREPCDouro_ref01_CabecaBoa_Satelite_CLD.png` | O mesmo teatro sobre imagem de satélite |

## O que a carta militar anotada traz, e a Estação ainda não faz

Lida sobre a carta anotada, e não de cabeça. A coluna da direita diz onde está o assunto
na aplicação à data da r0066.

| O que está na carta | Estado na Estação |
|---|---|
| Perímetro do ardido, com as manchas por arder lá dentro | **Feito.** `dados.perim`, com anéis interiores contados na área |
| **Setor Alfa** e **Setor Bravo**, com os limites traçados | **Feito na r0070.** `Setor.limite`, anel fechado traçado no mapa. Dá área por setor, área setorizada do teatro, e diz em que setor cai cada ponto marcado |
| Frentes ativas, com o símbolo militar de progressão | **Feito na r0070.** `dados.frentes`: linha traçada, secção (cabeça, flanco, retaguarda) e rumo de progressão, com seta desenhada. O rumo distingue o que foi indicado do que foi sugerido |
| Linhas de contenção e de apoio, por tipo de traço | **Feito na r0070.** `dados.linhas`, com a largura útil confrontada com a que a intensidade exige — Byram (1959). A de contenção desenha-se a tracejado enquanto está por abrir |
| Ponto de abastecimento de **água** e de **combustível** | **Feito.** `TIPOS_PONTO` — o de água ainda sem artigo confirmado |
| Meios nomeados no sítio onde estão: GRIR Guarda, GRUATA BSE, BRIR-BSE, GRIR Oeste, GRIR 01 Alentejo, CATE Viseu, UEPS, MR15-FSBE | **Feito na r0072.** Cada unidade do dispositivo ganha coordenada, sem se duplicar a contagem. A leitura diz que meios ficam no corredor da frente |
| Posto de meteorologia, e o 2.º comandante na torre de Moncorvo | **Por fazer.** Nomeações sem coordenada |
| Notas de manobra sobre o traçado: «interdito a VFCI», «inversão de marcha», «estrada para entrada de meios», «não ardido», «incêndio subterrâneo», «descarga de MA com retardantes», «grupo para combate com linha de água» | **Feito na r0072.** `dados.notas`: texto numa coordenada, desenhado por inteiro sobre a carta. Os avisos entram na leitura quando caem no caminho da frente |
| Rede viária identificada — N324, EM623, EM624, EM632, CM1144, IP2 | Vem da carta de fundo, quando a houver |

## Porque ficam aqui

Duas razões. A primeira é que **a Fase 3 as pressupõe**: o agente de topografia lê rede
viária, declive e exposição para propor linhas de contenção, e é isto que ele tem de
saber produzir. A segunda é que a decisão sobre o serviço de cartografia — ver
`docs/FONTES.md`, «Fontes por confirmar» — se toma melhor com o alvo à vista: carta
militar, relevo e satélite são três fundos diferentes, e a aplicação tem de os aceitar
aos três sem escolher nenhum por conta própria.

**Não são cartografia licenciada para redistribuição.** São material de trabalho do
CSREPC Douro, guardado aqui como referência do que se quer construir.

## O que ficou

**Todas as sete linhas da tabela estão feitas**, e com elas a dívida cartográfica que abriu
este trabalho. A Estação diz hoje, sobre a mesma ocorrência, o que a carta anotada diz — e
diz mais uma coisa que a carta não diz: **o que se segue**, por escrito, com as fontes de
cada número e com o que não pode afirmar declarado a seguir.

O que a carta continua a ter e a aplicação não: a carta de fundo. Falta a decisão
institucional sobre que serviço o posto tem direito a usar.

