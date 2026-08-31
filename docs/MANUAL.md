# Manual de utilização — Estação PEA

Escrito por tarefa e não por ecrã: procura-se aqui o que se quer fazer, não o sítio onde
está o botão.

**Este manual é verificado contra a entrega.** Tudo o que aparece entre aspas angulares é
texto que existe mesmo na aplicação, e `npm run manual` recusa a montagem se algum deixar de
existir. Se leu aqui um rótulo e não o encontrou no ecrã, é defeito e não distração.

## O essencial, em trinta segundos

A aplicação é um ficheiro. Abre-se com duplo clique, não precisa de servidor, de instalação
nem de ligação à Internet para funcionar. O que fizer fica gravado no próprio navegador —
mas **grave sempre uma cópia em ficheiro** com «Exportar para ficheiro», em Comando: o
navegador pode ser limpo por quem administra o posto.

Cinco separadores no topo, e são as células do posto de comando:

| Separador | O que lá está |
|---|---|
| **Comando** | Quem é a ocorrência, quem está no PCO, o arquivo e o encerramento |
| **Planeamento** | O terreno, o mapa, a meteorologia e o PEA |
| **Operações** | O dispositivo, os setores e o registo da evolução |
| **Logística e Finanças** | Comunicações, ponto de trânsito e controlo de tempos |
| **Passagem de turno** | O briefing e a entrega |

---

## Antes de tudo: dizer quem está ao teclado

Comando → **Quem regista**. Escreva o nome e carregue em «Assumir o teclado».

Não é formalidade. Tudo o que registar fica com o seu nome e com o GDH, e é isso que faz do
registo um documento e não um rascunho. Ao sair, «Deixar o teclado».

---

## Registar a ocorrência

Comando → **Identificação da ocorrência**. O número da ocorrência e o local são o mínimo.

**As coordenadas.** Escreva-as à mão se as tiver, em qualquer dos três formatos que a
aplicação lê. Se só tiver o topónimo, carregue em «Obter coordenadas a partir do local» — a
aplicação vai buscá-las a um serviço de geocodificação e **regista de onde vieram**. Uma
coordenada achada por topónimo não é a mesma coisa que uma coordenada lida no terreno, e o
registo guarda a diferença.

**A fase.** Escolher a fase não é declará-la. Depois de a escolher, carregue em «Declarar
fase»: é aí que fica com GDH e com o nome de quem a declarou.

---

## O perímetro e a área ardida

Planeamento → **Área e perímetro**.

Com um ficheiro GeoJSON do perímetro — o que a FEB Monitorização ou o fogos.pt produzem —,
a área calcula-se sozinha e a forma fica guardada. Sem ficheiro, escreva a área à mão.

Assim que houver perímetro, ou pelo menos o ponto da ocorrência com aglomerados detetados,
aparece o **Croqui do teatro de operações**: um esquema de apoio à análise. Não é carta
militar e não serve para navegar — está lá escrito.

---

## O mapa: setores, frentes e linhas

Planeamento → **Mapa do teatro de operações**.

**O mapa não carrega sozinho.** Um posto trabalha com ligação intermitente e por vezes
tarifada; pedir dezenas de quadrados de carta assim que a página abre é gastar a ligação de
alguém sem ela ter pedido nada. Carregue em «Carregar a carta» quando quiser.

Tudo o que se desenha no mapa se faz da mesma maneira: escolher **o que** em «Clicar no mapa
marca», e depois clicar no mapa.

### Traçar o limite de um setor

1. Declare primeiro quantos setores há, em Operações → **Setorização do TO e quadro de meios**.
2. No mapa, escolha *Limite do setor Alfa* (ou o que for) na lista.
3. Clique nos vértices do limite. Precisa de pelo menos três.
4. «Fechar o limite».

A partir daí o setor tem área, o mapa diz quanto do teatro está delimitado, e cada ponto que
marcar passa a dizer em que setor caiu.

Enganou-se num vértice: «Retirar o último vértice». Quer começar de novo: «Largar o traçado»
— nada foi gravado até fechar.

### Traçar uma frente

1. No mapa, escolha *Frente de fogo* na lista.
2. Clique ao longo da frente. Bastam dois pontos.
3. Escolha a secção — **cabeça**, **flanco** ou **retaguarda**.
4. O **rumo de progressão**: escreva-o em graus se o souber. Se deixar vazio, a aplicação
   sugere-o pela geometria do traçado — e fica escrito que foi sugerido, para não passar por
   observação três turnos depois.
5. «Fechar o limite» (o mesmo botão fecha os três desenhos).

Se tiver a exposição dominante e a série meteorológica carregadas, a aplicação **propõe-lhe**
o rumo que a composição de declive e vento dá, com a hora que o sustenta. Propõe apenas: não
escreve no campo.

A retaguarda não leva seta. Arde para trás do que já ardeu.

### Escrever uma nota no mapa

O que na carta se escreve à mão sobre o traçado: *interdito a VFCI*, *inversão de marcha*,
*incêndio subterrâneo*, *não ardido*.

1. No mapa, escolha *Nota* na lista, e a espécie: **aviso ou restrição**, **manobra** ou
   **observação**.
2. Escreva o texto no campo ao lado — o mesmo onde se escreve o nome de um ponto.
3. Clique no sítio a que a nota diz respeito.

A nota desenha-se por inteiro sobre a carta. Uma nota que precise de ser clicada para se
ler não é uma nota, é um ponto.

As três espécies **não são doutrina**: são a maneira como a nota se lê no mapa. Distinguem-se
por uma razão prática — uma nota que restringe ou avisa tem consequência para a segurança de
quem lá vai. Por isso **só os avisos entram na leitura da evolução** quando caem no caminho
da frente: *não ardido* à frente do fogo não é notícia; *incêndio subterrâneo* é.

### Pôr um meio no mapa

1. Atribua primeiro o meio a um setor, em Operações → **Setorização do TO e quadro de meios**.
2. No mapa, escolha *Posicionar GRIR Guarda* (ou o que for) na lista — os meios do
   dispositivo aparecem lá todos, com o setor a que pertencem.
3. Clique onde ele está.

Não é um segundo inventário: é coordenada dada ao meio que já está contado. Retirar a
posição não retira o meio do dispositivo.

A partir daí a leitura da evolução diz-lhe **que meios ficam no corredor de progressão de
cada frente** — e diz também quantos dos meios do dispositivo têm posição, porque dizer que
não há meios no caminho, com três posicionados em vinte, diz muito menos do que parece.

### Traçar uma linha de contenção ou de apoio

1. No mapa, escolha *Linha de contenção* ou *Linha de apoio*.
2. Clique ao longo da linha. Bastam dois pontos.
3. Indique a **largura útil** em metros — a faixa sem combustível, não a largura da estrada
   com as bermas por cortar.
4. Feche.

Se tiver a intensidade da frente preenchida (ver abaixo), a aplicação diz-lhe **se aquela
largura aguenta**, e diz de onde tirou o número.

Uma linha de contenção nasce por abrir e desenha-se a tracejado; quando estiver aberta no
terreno, dê-a por aberta na lista por baixo do mapa. Uma linha de apoio já lá está: nasce
aberta.

---

## A carta de fundo

Planeamento → **De onde vem a carta**.

**A aplicação não traz serviço de cartografia nenhum.** Não é esquecimento: os serviços de
uso comunitário exigem que a aplicação se identifique num cabeçalho próprio, coisa que uma
página aberta como ficheiro local não consegue fazer. Escolher um serviço por conta própria
seria dar por assente um direito de uso que não está confirmado.

Há três caminhos:

- **Serviço WMTS** — é o que a cartografia oficial publica. Dê o endereço do
  `GetCapabilities` e carregue em «Ler o serviço», ou carregue o XML de um ficheiro guardado.
  A aplicação mostra as camadas que existem, em que projeção, com que ampliações e de quem
  são. As que não puder desenhar aparecem na mesma, com o motivo.

  **Cartas com data.** Muitas camadas — imagem de satélite diária, por exemplo — existem num
  dia de cada vez. Quando a carta em uso tem eixo temporal, aparece o campo «Data da carta em
  uso», e a data fica escrita por baixo do mapa: sem isso via imagem de outro dia sem ter
  como saber. Uma data que o serviço não declare é recusada — *não há dados desse dia*, o que
  é diferente de não ter havido nada nesse dia, e essa segunda coisa a aplicação não a pode
  saber.
- **Serviço de mosaicos `{z}/{x}/{y}`** — a convenção do OpenStreetMap. Exige endereço,
  atribuição e termos de uso, e regista quem o declarou.
- **Carta pré-descarregada** — para trabalhar sem rede. Prepare-se no gabinete.

  Escolha a **pasta** que contém a árvore `{z}/{x}/{y}`, não os ficheiros um a um: o campo
  pede uma pasta, e é do caminho dentro dela que a aplicação sabe que quadrado é cada
  imagem. Um ficheiro de imagem solto — uma captura de ecrã, por exemplo — não é carta:
  não cobre território nenhum que a aplicação possa saber.

  E **declare a projeção da árvore**. As duas grelhas numeram os quadrados exatamente do
  mesmo modo e só a aritmética difere: declarada errada, a carta aparece e fica fora do
  sítio sem dizer nada, que é pior do que não aparecer.

---

## Relevo, meteorologia e comportamento do fogo

### O relevo

Planeamento → **Análise topográfica expedita**. Preencha a orientação dominante das encostas
e o declive, ou carregue em «Analisar relevo automaticamente (coordenadas da ocorrência)»,
que amostra cotas reais em oito rumos.

A **razão declive/vento (ε)** é o número que destranca o desvio da cabeça. Sem ela a
aplicação não o calcula e **não o inventa**. Escreva-a com vírgula ou com ponto: a aplicação
lê as duas.

### A meteorologia

Planeamento → **Previsão meteorológica**. Carregue um CSV, ou use «Obter previsão automática
(coordenadas da ocorrência)».

É a série que dá a evolução no tempo: com ela, a aplicação diz para onde a cabeça vai estar a
apontar de hora a hora.

### A intensidade da frente

Planeamento → **Comportamento do fogo — intensidade da frente**.

Dois números, e a aplicação **não os estima**: exigiriam um modelo de combustível calibrado
para a vegetação do Douro, e não existe.

| Campo | O que é |
|---|---|
| Velocidade de propagação (m/h) | Observada no terreno, ou de fogo experimental em vegetação comparável |
| Carga de combustível consumida (t/ha) | A que arde **na frente de chamas**, não a carga total do povoamento |

Dados eles, sai a intensidade da frente, o comprimento da chama, a distância de segurança, a
largura de contenção necessária e se o ataque direto à cabeça é admissível. A leitura muda
enquanto escreve — estes dois números são de tentativa e erro.

---

## Focos de calor detetados por satélite

Planeamento → **Focos de calor detetados por satélite**.

Uma lista de focos em CSV, como o FIRMS da NASA a escreve. Lê-se **pelo nome das colunas** —
o ficheiro traz o seu próprio cabeçalho. São precisas a `latitude` e a `longitude`; o resto é
o que o ficheiro trouxer, e o VIIRS e o MODIS não escrevem as mesmas colunas.

Dois caminhos:

- **Do ficheiro** — descarregado no gabinete e trazido no dispositivo. Serve sem rede, que é
  o caso do posto.
- **Do serviço** — declare o endereço com a chave de acesso lá dentro, e carregue em «Obter
  do serviço». Se escrever `{bbox}` ou `{data}` no endereço, a aplicação preenche-os com a
  caixa do teatro e o dia de hoje; o resto do endereço fica exatamente como o escreveu.

**A aplicação não traz endereço de serviço nenhum**, pela mesma razão por que não traz
serviço de cartografia. E **a chave não viaja na exportação da ocorrência**: fica neste
dispositivo. Um ficheiro de ocorrência passa entre postos e fica arquivado; uma chave lá
dentro saía de casa sem ninguém dar por isso.

Carregar substitui os focos anteriores, não os acumula: uma lista de focos é a fotografia de
um instante.

No mapa os focos são losangos, com a cor a dizer a confiança. E lê-se sempre, por baixo:
**um foco é uma deteção, não um incêndio confirmado**, e a ausência de focos não é ausência
de fogo — a passagem do satélite tem hora, o fumo espesso tapa, e a resolução do sensor é de
centenas de metros.

## Ler a evolução

Planeamento → **Leitura da evolução das frentes**.

É o texto que responde ao *e agora?*: para onde cada frente progride e de onde veio esse
rumo, o que está no corredor de progressão e a que distância, como o rumo da cabeça roda ao
longo da série, o que a intensidade decide na manobra e que linhas não aguentam.

Está escrito para ser lido em voz alta num ponto de situação. «Copiar a leitura» leva-o para
onde precisar.

**Leia o último parágrafo.** Diz o que a leitura *não* afirma, e porquê.

---

## O dispositivo e os setores

Operações → **Setorização do TO e quadro de meios**. Declare quantos setores há e o que está
atribuído a cada um, por tipologia do Anexo 1 da DON n.º 2.

Operações → **Meios aéreos no TO**: indicativo e hora de entrada, com «Registar».

---

## Registar a evolução da situação

Operações → **Registo de evolução da situação operacional**, em três passos: a que respeita,
o que aconteceu, e «Registar na evolução».

Muito do que faz noutros sítios entra aqui sozinho — traçar um limite, marcar um ponto,
declarar uma fase. A **Linha de evolução** mostra tudo por ordem, e a **Fita do tempo** é o
registo técnico.

---

## Comunicações

Logística e Finanças → **Plano de comunicações**. Escolha os níveis a utilizar e os canais
atribuídos.

O **Pacote de canais** traz o do posto. Canais que não constem do pacote acrescentam-se em
«Acrescentar canal fora do pacote» — e ficam assinalados como tal.

> A composição das pastas sub-regionais do SIRESP **não está confirmada em fonte** neste
> projeto. A aplicação pergunta a sub-região do TO em vez de a deduzir do concelho, e diz
> quando o pacote carregado não serve o teatro.

---

## Elaborar o PEA

Planeamento → **Elaborar proposta de PEA**, com «Elaborar proposta de PEA».

A proposta é numerada e sucessiva. O histórico fica em **Histórico de propostas de PEA**.

> O COS aprova **depois** de ter o PEA impresso à sua frente. A aplicação propõe; a aprovação
> é um ato de comando e faz-se fora dela.

---

## Passagem de turno

Passagem de turno → «Elaborar briefing», e depois «Registar passagem de turno».

O briefing sai com o que interessa a quem entra: situação, dispositivo, empenhamento,
conformidade, o PEA em vigor, a evolução desde então e o que fica por decidir. «Descarregar
em texto» leva-o para fora.

---

## Guardar, exportar, encerrar

| Quero | Onde |
|---|---|
| Guardar no navegador | Comando → «Guardar ocorrência» |
| Guardar em ficheiro | Comando → «Exportar para ficheiro» |
| Abrir uma guardada | Comando → «Carregar guardada» |
| Abrir de um ficheiro | Comando → «Importar de ficheiro» |
| Começar do zero | Comando → «Nova / limpar» |
| Encerrar o registo | Comando → «Encerrar a ocorrência» |
| Reabrir um registo fechado | Comando → «Reabrir o registo» |

**Encerrar não bloqueia a aplicação.** Fecha aquele registo — deixa de se poder escrever
nele —, mas continua a poder abrir uma ocorrência nova, exportar, importar e consultar o
arquivo. Um registo fechado carimba-se com um selo de integridade, e «Conferir a cadeia do
diário» diz se alguma coisa foi mexida depois.

---

## O que a aplicação recusa fazer, e porquê

Isto não é lista de limitações: é a garantia de que o que ela diz, sustenta.

| Não faz | Porquê |
|---|---|
| **Não diz a que horas o fogo chega a um sítio** | Exige a velocidade básica do combustível, e não há fonte que a dê para os combustíveis do Douro |
| **Não diz quantos hectares vão arder** | Pela mesma razão |
| **Não calcula o desvio da cabeça sem a razão declive/vento** | O modelo de Viegas (2004) não o dá sem ela, e um valor por omissão seria invenção |
| **Não traz serviço de cartografia** | Nenhum está confirmado como podendo ser usado por este posto |
| **Não deduz a sub-região SIRESP do concelho** | A composição das pastas não está confirmada em fonte |
| **Não atribui artigo ao ponto de água** | É figura corrente da manobra e não se lhe achou o artigo. Aparece marcado como fonte por confirmar |

Onde falta fonte, a aplicação **pergunta** em vez de adivinhar. Quando mostra um número, diz
de onde ele vem.

---

## Se alguma coisa não estiver onde este manual diz

É defeito do manual ou da aplicação, não seu. As secções aparecem e desaparecem conforme o
estado — o cartão do mapa, por exemplo, só abre quando há alguma coisa para enquadrar. Se
procurou e não achou, diga: já aconteceu uma funcionalidade estar escondida dentro de um
cartão que não abria.
