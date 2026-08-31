# Por executar

O que está decidido e ainda não feito, com a razão por que interessa. Um ficheiro de estado
vivo, como o `ESTADO.md`: atualiza-se, não se acumula. Uma linha sai daqui quando o trabalho
entra numa revisão — e o `ESTADO.md` diz então em qual.

Existe porque a lista de tarefas de uma sessão de trabalho morre com ela, e estas não devem
morrer. Ordenado pelo que se ataca primeiro.

## 1. A dívida cartográfica — **saldada na r0072**

O `docs/cartografia/LEIAME.md` compara a carta que o Ricardo anotou à mão no PCO de Cabeça
Boa com o que a Estação sabe desenhar. Cinco linhas dessa tabela continuam por fazer, e são
estas cinco que separam o mapa da aplicação da carta que se usa.

| | O que falta | Porque interessa |
|---|---|---|
| ~~1~~ | ~~**Limites de setor**~~ | **Feito na r0070.** Anel fechado por setor, traçado no mapa. Dá área por setor, área setorizada do teatro, e o setor em que cai cada ponto marcado |
| ~~2~~ | ~~**Frentes ativas com direção**~~ | **Feito na r0070.** Linha traçada com secção e rumo de progressão. A composição de declive e vento propõe o rumo da cabeça; quem comanda decide se é aquele |
| ~~3~~ | ~~**Linhas de contenção e de apoio**~~ | **Feito na r0070.** Com a largura útil confrontada com a que a intensidade exige, e o traço a distinguir o que está aberto do que está por abrir |
| ~~4~~ | ~~**Meios no sítio onde estão**~~ | **Feito na r0072.** Coordenada na própria unidade do dispositivo, presa ao seu identificador. Falta ainda posicionar as nomeações — posto de meteorologia, 2.º comandante na torre |
| ~~5~~ | ~~**Anotação livre georreferenciada**~~ | **Feito na r0072.** Texto numa coordenada, em três espécies que não se apresentam como doutrina. Os avisos entram na leitura da evolução |

As duas primeiras estão feitas. Com elas, a previsão passa a ter de onde partir: há uma
linha com direção e há áreas a que ela pode chegar. O que falta para a previsão geométrica
é projetar a frente no rumo declarado e ver que limites atravessa — `dentroDoAnel` já lá
está.

## 2. Fogo ativo: o eixo do tempo

O NASA GIBS publica dezoito camadas de anomalias térmicas VIIRS e MODIS, em serviço aberto,
sem chave e com CORS. **É a única fonte de fogo ativo identificada, e hoje é recusada por
inteiro**: 1 210 das 1 315 camadas declaram dimensão `Time`, e o construtor de endereços da
Estação não sabe indicar data.

A recusa é correta — servir pelo valor por omissão mostrava outra data sem o dizer — e é
inútil, porque recusa exatamente as camadas que interessam. Falta:

- ler `Dimension` e usar o `Default`, que no GIBS acompanha a última data disponível;
- **mostrar ao operador a data efetiva** do que está no ecrã;
- distinguir «não há deteções» de «não há dados nesse dia» — os intervalos declarados pelo
  GIBS têm buracos, e um mapa que confunda as duas coisas induz em erro por omissão.

Nota de escala: as anomalias térmicas param no nível 8, **611 m por pixel**. Serve para
contexto regional — saber se a ocorrência no Douro é isolada ou parte de uma situação
peninsular —, não para vista de setor. Para vista de setor a via é a API de pontos do
FIRMS, que devolve coordenadas e não mosaicos: um ponto reprojeta-se para PT-TM06, um
mosaico já desenhado não.

## 3. Intensidade da frente, e o que ela decide — **feito na r0070**

Os dois campos existem agora em Planeamento, «Comportamento do fogo — intensidade da
frente», e a leitura sai por baixo deles e dentro da leitura da evolução. O que continua
por resolver é o de sempre, e está no fim desta secção: **R para os combustíveis do Douro**.

### O que ficou feito

Os quatro documentos de comportamento do fogo chegados a 31 de agosto — ver `FONTES.md`,
secção `FOGOINT` — desbloqueiam metade do problema. Com a velocidade de propagação e a carga
de combustível **introduzidas pelo oficial**, como já se faz com o ε, ficam ao alcance:

| A calcular | De onde vem |
|---|---|
| Intensidade da frente, kW/m | `I = R·w/2` — Byram (1959), via Fernandes (2003) |
| Comprimento da chama, m | `I = 300·L²` — Fernandes (2003) |
| **Distância de segurança** à frente | ≥ 4 × altura da chama — Butler e Cohen (1998) |
| **Largura de contenção** necessária | ≥ 1,5 × comprimento da chama — Byram (1959) |
| **Se o ataque direto à cabeça é admissível** | Limite de 4 000 kW/m — Alexander (2000) |
| Que meios são eficazes | Tabela de interpretação para supressão, quatro classes |
| Crescimento do perímetro | ≈ 2,5 × R — Alexander (2000) |

É isto que liga a previsão ao PEA: não «o fogo vai ali», mas **«a esta intensidade o ataque
à cabeça é inconsequente, a linha tem de ter esta largura, e ninguém fica a menos desta
distância»**. Que é uma proposta de manobra com fundamento citável.

Duas cautelas registadas em `FONTES.md` e que não se devem perder:

- O diapositivo de formação traz a relação de comprimento de chama **invertida**. Implementar
  como está escrito daria números absurdos.
- As tabelas de área e perímetro do guia canadiano estão em imagem digitalizada. **Números
  lidos a olho de uma digitalização não entram no código**; para as usar é preciso a descrição
  técnica que o guia cita e não inclui.

E o que continua em falta: **R para os combustíveis do Douro**. Nenhum dos quatro documentos
o dá. Enquanto não houver fonte, a velocidade de propagação é um dado que o oficial introduz.

## 4. Manual de utilização — **feito na r0070**

**Há funcionalidades na aplicação que quem a usa já não encontra.** Não é hipótese: a
leitura da evolução das frentes nasceu dentro do cartão do mapa, que se esconde enquanto
não houver nada para enquadrar, e o próprio autor do projeto não deu com ela. Já foi
mudada de sítio; o problema de fundo é que a aplicação cresceu mais depressa do que a
maneira de a explicar.

Está em `docs/MANUAL.md`, e é **por tarefa operacional e não por ecrã** — «como registo uma ocorrência»,
«como traço um limite de setor», «como leio a evolução» —, deve nascer do que está na
entrega e não do que se lembra dela, e cada passo tem de ser verificável contra a revisão em
vigor. Enquanto se escreve, vale a pena varrer o que mais estará escondido por depender de
estado que não é óbvio.

## 5. Validar as fontes na rede real

**Todas as capturas de 31 de agosto de 2026 foram feitas por dados móveis**, não da rede
institucional — o endereço de origem `172.20.10.3` numa interface Wi-Fi é a gama que o iOS
atribui em partilha de ligação. Isto não invalida os documentos, que são o que os serviços
publicam a quem quer que pergunte. Invalida as conclusões sobre **acessibilidade a partir
dos sítios onde a Estação vai trabalhar**.

Repetir uma amostra a partir de um posto da rede do CSREPC Douro e do VCOC ligado à
Starlink. Se os resultados divergirem, a mesma aplicação comporta-se de maneira diferente
conforme o local — e isso é requisito de desenho, não contratempo.

## 6. Depende de terceiros

- **Que serviço de cartografia o posto tem direito a usar.** A aplicação sabe ler um WMTS;
  falta a decisão institucional. Os serviços do ICNF ficam de fora de qualquer modo: não
  respondem `Access-Control-Allow-Origin`, e uma página aberta em `file://` não os lê.
- **Carta militar M888 do CIGeoE** — diligência institucional por fazer.
- **Confrontar o importador com uma exportação real da Gestão PCO.** Testado contra os
  documentos; falta o que a aplicação de origem produz de facto.

## 7. Pontos por confirmar em fonte

A lista vive em `ESTADO.md`, secção «Pontos por confirmar em fonte», e não se repete aqui.
Um deles tem dono e prazo do lado de cá: a informação de canais SIRESP que chegou por
captura de ecrã, com o pedido de a validar antes de usar. **Não foi validada, e por isso
não foi usada.** Continua fora da aplicação.

## 8. Fora da cartografia

- Camada de análise determinística: **Meteo, Topografia e Demografia**. O Comportamento do
  Fogo está feito na r0026, com o que a fonte sustenta.
- Reter a última previsão meteorológica, para servir sem rede.
- **Exportação do PEA em DOCX**, com direção de texto na célula em vez de fusão vertical.
- **Impressão do plano de comunicações** em folha autónoma.
