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

## 2. O eixo do tempo — **feito na r0072**; o fogo ativo, não

**O eixo está feito, e o fogo ativo continua de fora — por outra razão.**

O eixo temporal lê-se, o valor entra no pedido, a data fica escrita por baixo do mapa e uma
data que o serviço não declare é recusada com a distinção que interessa: *não há dados desse
dia* não é *não houve deteções nesse dia*. Das 1 315 camadas do GIBS passaram a servir 1 197,
entre elas a cor verdadeira diária do VIIRS e do MODIS — imagem fresca da região, que nenhuma
fonte nacional dá.

**Mas as dezoito camadas de anomalias térmicas continuam recusadas, e não é pelo tempo: é
pelo formato.** São servidas só em `application/vnd.mapbox-vector-tile`, que não é imagem e
que este mapa não desenha. Esperava-se que ler o eixo as trouxesse; não traz.

Fica reforçada a conclusão do §4 do relatório de fontes internacionais, que já era a certa:
**os focos de calor são pontos, não mosaicos.**

**Feito na r0072.** A aplicação lê CSV de focos pelo nome das colunas, do ficheiro ou de um
endereço declarado, desenha-os no mapa e escreve a leitura. Fica por fazer o que depende de
terceiros e de rede: **confirmar contra o serviço a sério** — o endereço exato, se responde
com CORS aberto a uma página em `file://`, e obter a chave. Nada disso se pôde verificar
daqui, e por isso a aplicação não traz endereço nenhum escrito.

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

### E agora também: a convenção de fuso das marcas do IPMA

Acrescentado a 2 de setembro, com a r0083. Não é a mesma questão da acessibilidade, mas
resolve-se no mesmo bloco de verificação e com o mesmo pedido.

As marcas de tempo de `api.ipma.pt/open-data/forecast/warnings/warnings_www.json` vêm sem
designador de fuso. **Nenhuma fonte deste projeto diz se são UTC ou hora legal**, e o
serviço não é alcançável do ambiente onde as revisões são construídas — o proxy responde
`403` ao CONNECT. Enquanto assim for, a Estação mostra as horas tal como o serviço as
publica, sem converter, e marca como «por confirmar» os avisos cuja fronteira caia dentro
da margem de uma hora que separa as duas leituras possíveis.

Duas perguntas a fazer no posto, com o mesmo `curl.exe`:

1. Um `startTime` ou `endTime` real traz `Z`, ou `+01:00`, ou nada?
2. Se não trouxer designador, a hora bate com a hora legal portuguesa ou está uma hora
   atrás?

Basta a primeira responder «traz designador» para o problema desaparecer sozinho: o código
já trata esse caso com exatidão, e a margem colapsa. A segunda só é precisa se a resposta
for «nada».

## 6. Depende de terceiros

- **Que serviço de cartografia o posto tem direito a usar.** A aplicação sabe ler um WMTS;
  falta a decisão institucional. Os serviços do ICNF ficam de fora de qualquer modo: não
  respondem `Access-Control-Allow-Origin`, e uma página aberta em `file://` não os lê.
- **Carta militar M888 do CIGeoE** — diligência institucional por fazer.
- **Confrontar o importador com uma exportação real da Gestão PCO.** Testado contra os
  documentos; falta o que a aplicação de origem produz de facto.

## 6-bis. As fases de exigibilidade do PCO — **saldado na r0084**

Cinco valores de `fase:` divergiam do articulado, e o ramo #006 verificou-os contra o texto
e devolveu um guião vermelho. **Nenhum estava certo no código.** Corrigidos, com a alínea
gravada ao lado de cada número em `aLei`:

| Função | Era | É | Alínea |
|---|---|---|---|
| Adjunto de Segurança | III | **II** | art. 41.º, n.º 2, al. b) |
| Oficial de Planeamento | II | **III** | art. 42.º, n.º 2, al. b) |
| Oficial de Logística e Finanças | II | **III** | art. 42.º, n.º 2, al. b) |
| Adjunto de Ligação | IV | **III** | art. 42.º, n.º 2, al. b) |
| Coordenador do PCO | III | **IV** | art. 43.º, n.º 2, al. b) |

**E veio um achado maior, que o ramo #006 encontrou a ler o bloco inteiro.** Nove núcleos
levavam um `fase:` sem fonte normativa nenhuma, no mesmo campo e pelo mesmo comparador das
exigências do art. 14.º — e portanto com a mesma etiqueta e a mesma cor no ecrã, e com um
campo de referência a citar um artigo que nada diz sobre fases. O campo separou-se em
`faseLei`, que traz a alínea obrigatória, e `faseSug`, que assume ser prática do posto.
`funcoesExigiveis()` passa a devolver só o que a lei impõe.

**Fica por confirmar por C. Abreu:** os valores de `faseSug` continuam a ser os que lá
estavam. São heurísticas plausíveis e ninguém as verificou. Deixaram de mentir sobre a sua
proveniência; não deixaram de ser palpites.

**Fica também por resolver o Despacho não estar no repositório.** Não há cópia em
`docs/fontes/`, e não foi possível obtê-la deste ambiente. Toda a citação do articulado
nesta matéria assenta na transcrição do ramo #006, o que é revisão por terceiro e não
leitura primária. Uma cópia do Diário da República, 2.ª série, n.º 74, de 15-04-2024,
fecharia isto.

## 6-ter. O fundamento da transição de fase fora de banda

Do mesmo confronto. Os limiares de efetivo **já são aviso e nunca bloqueio**, como o `d01`
exige na secção 2.3: o seletor da fase oferece as seis sem condição, e a regra `id:"fase"`
emite `n:"av"`. Falta o outro lado do art. 39.º:

- **N.º 3** — recolher qual dos quatro fundamentos taxativos sustenta a passagem fora de
  banda, e carimbá-lo na fita do tempo. Hoje o aviso diz o que fazer e não recolhe nada.
- **N.º 4** — o estado de «organização distinta», pendente de validação da estrutura
  operacional da ANEPC e decisão do comandante nacional. Não existe.

Depende da decisão de C. Abreu, ponto 2 do `d01`.

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

## Em dívida com a linhagem paralela — recado de 31 de agosto

O outro lado deixou ponto de situação. Fica aqui o que dele nos toca, e o que se fez já.

### Feito

- **A base IndexedDB passou de 2 para 3 do lado de lá** (loja `folhas`, no `p0018`). Esta
  entrega abria por um número fixo, o 2, e contra a base deles isso dá `VersionError` — que
  aqui virava um `null` silencioso: sem diário, sem cópias de recuperação, sem mosaicos de
  carta, e nada no ecrã a dizer porquê. **Corrigido na r0076**: adota-se a versão que a base
  tiver e sobe-se um degrau só quando falta uma loja. Provado em Chromium por
  `ferramentas/prova-idb.mjs`, e o defeito reproduzido antes de ser corrigido.
- **A colisão da r0074** ficou escrita em `app/RESERVADAS.md`, com a razão de não ser
  desfeita e o número livre seguinte.

### Por fazer, e depende deles

1. ~~**O `p0020` não chegou.**~~ **Chegou e está absorvido na r0077** — ver `docs/ESTADO.md`.

## Quatro defeitos apontados pela linhagem paralela — **confirmados no código**

Chegaram a 1 de setembro, no ponto de situação de 31AGO26. **Não são relatos aceites: cada um
foi conferido contra a `r0077` antes de entrar nesta lista.** Três são de código que esta
linhagem escreveu ou absorveu.

### 1. O motor de propagação não vigia a saída — **o mais grave**

Os sinalizadores `fora` do `21-modelos-de-combustivel.js` vigiam o domínio das **entradas**.
**Ninguém vigia o valor que sai.** Confirmado: não existe em toda a fonte uma única
referência a um tecto de propagação.

A fonte primária destes quadros — Fernandes (2001), *Fire spread prediction in shrub fuels in
Portugal* — declara que, dada a escassez de dados acima de **6 m/min**, não é aconselhável
usar as equações fora da gama de comportamento baixo. Seis metros por minuto são **360 m/h**.

| | m/min | m/h |
|---|---|---|
| Tecto declarado pelo autor | 6 | 360 |
| Propagação mais rápida medida no conjunto de 2001 | 20 | 1 200 |
| Célula extrema do Quadro 3.4.1 | 38 | 2 280 |
| Após altura 3,0 m e declive 50 % | **247** | **14 820** |

**Uma combinação dentro de todos os domínios de entrada entrega quinze mil metros por hora
sem uma palavra de reserva** — quarenta vezes o tecto da fonte.

**E há aqui um erro meu que é preciso dizer.** O `tests/propagacao.test.mjs` tem uma asserção
que valida o extremo do domínio contra Alexander (2000), «1,5 m/h a ~14 km/h **em floresta**».
Estes quadros são de **matos**, e de fogo controlado de Outono e Primavera. Validei o tecto
contra a fonte errada, e o teste passou por isso mesmo: `assert.ok(max < 20000)` é verdadeiro
e não significa nada.

*Correção:* marca de saída em dois degraus — acima de 360 m/h, `EXTRAPOLAÇÃO`; acima de
1 200 m/h, `ALÉM DE QUALQUER FOGO MEDIDO` — que acompanha o valor até ao PEA impresso. E a
asserção do teste corrigida para o tecto que a fonte destes quadros declara.

### 2. Identidade instável das propostas

`fonte/3-planeamento/16-pea-em-vigor.js:52` faz `k: x.id || "P"`, e os `id` são renumerados
por posição no fim do `detDecisao`. **Confirmado.**

Fui eu que descobri que os `id` são decorativos, e não vi a consequência: **P3 no PEA n.º 4
não é a mesma proposta que P3 no PEA n.º 5.** Basta uma proposta cair entre planos — a reserva
constitui-se, a linha estreita é alargada — para tudo o que está por baixo subir uma posição.
«Cumprimos a P2» deixa de ter significado estável entre versões de um documento que é
aprovado, executado e auditado.

Era inofensivo enquanto as propostas eram genéricas. **Deixou de ser quando o `p0020` as fez
depender de dados que mudam de hora a hora.**

*Correção:* chave estável declarada em cada regra, separada do `id` de apresentação.

### 3. O buraco estrutural reabriu — e a culpa é desta linhagem

O `p0020` corrigiu a falha de onze painéis que não chegavam ao PEA. **Na mesma sessão, esta
linhagem acrescentou notas do mapa e focos de calor VIIRS/FIRMS, e nenhum dos dois entra no
`retratoDoFogo()` nem no `contexto()`.** Confirmado por pesquisa: nem `notas` nem `focos`
aparecem em `22-ambiente-de-fogo.js` ou em `14-elaboracao-assistida-do-pea.js`.

Um foco de calor a norte do perímetro é exatamente o género de facto que um plano tem de
citar.

*Correção, e é a que interessa mais do que o remendo:* **o colector tem de ser regra, não
correção pontual.** Nenhum painel novo fecha sem declarar o que contribui. O `auditarPosse()`
já é o sítio: um ramo de `O.dados` com dono declarado e sem contributo para nenhum dos três
colectores é um painel que escreve para o vazio.

### 4. Uma chamada a CDN na linha 7 da entrega

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed…">
```

**Confirmado na `r0077`.** A primeira restrição não negociável do projeto diz «sem
dependências, sem módulos externos: CSS, JS e tipos de letra por CDN **dentro do ficheiro**»,
e está violada na sétima linha. Num arranque `file://` sem rede, isto bloqueia o render até
dar *timeout*: a aplicação não parte, porque as famílias têm alternativa no CSS, mas o
primeiro ecrã no VCOC com a Starlink em baixo demora segundos a aparecer.

*Correção:* ou se embutem as fontes em base64, ou se apaga a linha. **É decisão do
utilizador**, porque muda o aspeto da aplicação — as alternativas do CSS não são o Barlow.

## Defeitos apontados e ainda por conferir

Não entram na lista acima porque **não os verifiquei**. Ficam nomeados para não se perderem:

- **As missões discordam das propostas.** A ação decisiva continua a dizer «dominar as frentes
  ativas e fechar o perímetro» mesmo quando as propostas já dizem que a cabeça não se ataca.
- **Avisos IPMA, três defeitos:** distrito escolhido por proximidade à capital devolve Vila
  Real para a zona de Moimenta da Beira, que é Viseu; o filtro «em vigor» é `endTime >= agora`
  e não olha ao `startTime`, pelo que inclui avisos futuros; e `new Date(a.endTime)` sobre
  marca sem fuso dá **uma hora de deriva no Verão** — erro zero no Inverno, o que torna isto
  mais traiçoeiro.
- **A distância de segurança pode estar curta.** `Math.ceil(4 * chama)` cita Butler e Cohen
  (1998); a revisão de Butler (2014) mexeu nisto, e em encosta com vento a favor o fator 4
  ficaria curto.

## Ordem proposta pela linhagem paralela, e o que penso dela

Eles propõem: `t0020` e correção do `t0019`; identidade estável das propostas; notas e focos
no colector com a regra de auditoria; missões alinhadas; avisos IPMA; caixas dobráveis; e o
`p0018` por fim.

**Concordo com a ordem, com uma emenda: o tecto de saída vem primeiro.** É o único destes que
faz a aplicação afirmar um número falso sobre uma manobra real, e é o único que já está a
correr no terreno. Os outros corrompem o registo ou omitem informação — este afirma.

## Folhas calibradas — **saldado na r0085**

Absorvido a 2 de setembro, guiado pelas 53 asserções do `t0001` do ramo #002 e não traduzido
do remendo. O guião fica em `ferramentas/historico/002_CSREPCDouro_202609021600_t0001_FolhasCalibradas_CLD.js`
e continua a correr de fora contra qualquer entrega: contra a r0085 dá 54 verdes e saída 0.

**O confronto entre especificações fez-se, e deu concordância.** O ramo #001 entregou uma
segunda especificação escrita às cegas — 53 asserções também, por coincidência. Com o
contrato adaptado aos nomes que a r0085 implementa, 51 passam; as duas que faltam verificam
a existência de um nome e não um comportamento. Guião em
`ferramentas/historico/001_CSREPCDouro_202609021551_t0021_FolhaCalibrada_CLD.js`.

**Continua por confrontar o `t0018` original**, que está no ramo #004 e nunca chegou a esta
linhagem. Já não é o único ponto de comparação — há duas especificações independentes a
concordar —, mas um terceiro olhar sobre a mesma matéria continua a valer.
