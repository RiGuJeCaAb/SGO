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

## Os cartões dobram, e o cabeçalho fechado diz o que falta

Cada cartão da aplicação abre e fecha ao clique no seu título — ou com Enter, se lá chegar
pelo teclado. Ao fim de umas horas de ocorrência os painéis têm dezenas de cartões e milhares
de pixéis, e sem isto nada se encontra.

**O que interessa é o que o cabeçalho diz quando o cartão está fechado.** Não é o título: é o
estado.

| O que lê no cabeçalho | O que significa |
|---|---|
| "2 obrigatórios em falta", a vermelho | Faltam campos sem os quais não se emite a proposta de PEA. **O cartão abre-se sozinho e não fica fechado** |
| "1 recomendado por preencher" | Falta coisa útil, mas nada que bloqueie. O cartão fica como o deixou |
| "nada a assinalar" | Está tudo preenchido neste cartão |
| "14 registos", "sem registos" | Cartões que crescem — a fita do tempo, a linha de evolução — dizem quanto têm lá dentro |

Três coisas que convém saber:

- **Um cartão com obrigatório em falta não se deixa fechar.** Pode fechá-lo, mas volta a abrir
  e a aplicação não guarda essa preferência. É de propósito: fechar não pode servir para
  esconder de si próprio o que falta.
- **A cor não é o único sinal.** Diz "obrigatórios em falta" por extenso, para quem não
  distinga o vermelho do âmbar ler exatamente a mesma coisa.
- **O que abre e fecha fica guardado neste computador, e não na ocorrência.** Não viaja na
  exportação nem na passagem de turno: é conveniência de quem está ao teclado, não facto da
  ocorrência.

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

## Folhas de carta calibradas

Planeamento → A carta de fundo → **Folhas de carta calibradas**.

Uma imagem solta não serve de carta pré-descarregada, mas pode servir de folha: a fotografia
da carta militar tirada na parede do PCO, um recorte de PDF, uma captura da carta de
perigosidade. Aqui coloca-se no terreno, e o mapa passa a desenhar o traçado por cima dela.

Preencha o nome e a **proveniência** — de onde veio a imagem —, escolha a projeção em que
estão os coeficientes e o ficheiro da imagem. Depois, uma de duas vias:

| Se a imagem… | Faça |
|---|---|
| veio de um sistema de informação geográfica | escolha o **ficheiro de referenciação** que a acompanha, de seis linhas |
| não trouxe ficheiro | indique **dois pontos** que reconheça na imagem e cuja coordenada saiba: pixel X, pixel Y, Este e Norte de cada um |

Depois, «Colocar folha».

**O que a aplicação recusa, e porquê.** Uma folha sem proveniência declarada, porque seria
uma imagem anónima a fazer de carta. Um ficheiro de referenciação com vírgula decimal, em
vez de a interpretar: "2,5" lido como 2 põe a folha 20 % fora de escala, e esse erro só
aparece depois de alguém medir uma distância de segurança por cima dela. E dois pontos que
partilhem o pixel ou a coordenada, que não chegam para dar escala.

**Dois pontos dão escala e rotação, e nada mais.** A folha não se deforma nem se corrige de
inclinação — se a imagem estiver distorcida, dois pontos não a endireitam, e a aplicação não
finge que sim.

Uma folha que caia fora do envelope do continente é colocada na mesma, com aviso: pode ser
das ilhas, de Espanha, ou a colocação estar errada. Confirme-a no mapa.

**Guarda-se a colocação, não a imagem.** A imagem pesa demasiado para o pacote da ocorrência,
que viaja por ficheiro de texto. Ao reabrir a aplicação, a folha continua lá — diz onde está
e aparece no plano com a sua proveniência — e basta voltar a escolher o ficheiro da imagem
para a desenhar outra vez.

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

### Os avisos do IPMA

No topo de Planeamento, por cima da previsão. Chegam sozinhos com a previsão automática, e
há «Consultar agora» e «Atualizar» para os pedir à mão.

O painel mostra os avisos acima de verde do distrito do teatro, e distingue três coisas que
até à r0083 andavam misturadas:

| No painel | O que quer dizer |
|---|---|
| Chip a cheio | **Em vigor agora.** Conta para a manobra em curso |
| Chip a tracejado, «por confirmar» | O início ou o fim caem dentro da margem de incerteza do fuso horário. Pode já estar em vigor; confirme em ipma.pt |
| Chip esbatido, «previsto» | Ainda não começou. Conta para o planeamento do turno seguinte |

**O distrito é o que foi determinado pelas coordenadas da ocorrência**, em Comando. Se ainda
não estiver determinado, a aplicação escolhe o distrito cujo ponto de referência do IPMA
está mais perto — e escreve «distrito presumido» ao lado do nome, porque esse ponto é o da
capital de distrito e pode não ser o distrito do teatro. Preencha as coordenadas e o aviso
de presunção desaparece.

**As horas aparecem tal como o IPMA as publica, sem conversão.** As marcas de tempo do
serviço não trazem designador de fuso horário e a convenção não está confirmada em fonte
nenhuma consultável por este projeto; converter seria escolher uma hora sem base. O painel
diz isso, e é dessa incerteza que nasce o estado «por confirmar».

### A intensidade da frente

Planeamento → **Comportamento do fogo — intensidade da frente**.

Dois números comandam tudo o que vem a seguir:

| Campo | O que é |
|---|---|
| Velocidade de propagação (m/h) | Observada no terreno, de fogo experimental em vegetação comparável, ou estimada pelo painel da secção seguinte |
| Carga de combustível consumida (t/ha) | A que arde **na frente de chamas**, não a carga total do povoamento |

Dados eles, sai a intensidade da frente, o comprimento da chama, a distância de segurança, a
largura de contenção necessária e se o ataque direto à cabeça é admissível. A leitura muda
enquanto escreve — estes dois números são de tentativa e erro.

### Estimar a velocidade de propagação

Logo abaixo, no mesmo separador: «Estimativa da velocidade de propagação (guias de fogo
controlado)».

É aqui que se obtém o primeiro dos dois números quando não há observação de terreno. Preenche-se
por esta ordem:

1. «Modelo de combustível» — dezoito modelos publicados para Portugal. A descrição e o
   intervalo de carga aparecem por baixo assim que escolhe.
2. «Altura média da vegetação (m)» — só para os modelos de matos, e o quadro só vai de 0,2 a
   3,0 m.
3. «Declive (%)» e «Vento a 10 m (km/h)». O vento converte-se sozinho para o vento à
   superfície, que é o que os quadros pedem. Se já declarou o relevo, «Preencher declive do
   relevo» traz o centro da classe — e diz-lhe que é o centro de uma classe e não uma
   medição. «Preencher vento da previsão» traz a hora de maior vento da previsão em vigor.
4. «Humidade do combustível morto fino (%)». Se não a tiver medida, escreva a humidade
   relativa do ar e os dias sem chuva em «Humidade relativa (%) e dias sem chuva» e carregue
   em «Estimar HCM».
5. «Estimar a propagação».

O resultado traz a velocidade, a carga do modelo e a razão declive/vento, cada uma com o
quadro de onde veio. «Usar nos campos abaixo» passa-os para a intensidade da frente, e a
cadeia inteira — chama, segurança, contenção, ataque direto — recalcula-se.

**Três coisas para ter presentes ao usar este painel:**

- **São guias de fogo controlado**, construídos sobre fogos de Outono e Primavera, de
  intensidade baixa a moderada. Não estão validados para o Verão, e a aplicação não afirma
  que estejam.
- **Acima de 25 °C a estimativa da humidade recusa-se.** O quadro traz impresso que não é
  válido acima dessa temperatura, e nesse caso a humidade tem de vir do FWI ou de medição.
- **Eucaliptal, folhosas e formações herbáceas não têm motor.** Os guias cobrem matos e
  pinheiro bravo, e mais nada. Nesses modelos a aplicação diz que a velocidade tem de ser
  observada.

### Quando o número sai marcado

A estimativa pode devolver uma velocidade **fora do que alguma vez foi medido**, e quando isso
acontece a leitura abre com a marca, antes do número:

| Marca | Quando aparece | O que quer dizer |
|---|---|---|
| **EXTRAPOLAÇÃO** | acima de 360 m/h (6 m/min) | É o valor acima do qual a fonte destes quadros desaconselha usá-los, por escassez de dados |
| **ALÉM DE QUALQUER FOGO MEDIDO** | acima de 1 200 m/h (20 m/min) | Passou o fogo mais rápido dos 29 que originaram os quadros. Acima de 2 280 m/h passou também a célula mais rápida da tabela, e só as correções de altura e declive lá chegam |

**A marca não impede o cálculo.** Recusar deixaria quem está no PCO sem estimativa nenhuma,
que é pior. A marca acompanha o número: aparece no painel, vai com ele para a fita do tempo, e
entra na proposta de PEA.

Repare ainda numa nota que aparece sempre que o declive passa dos 5 %: o quadro base foi
medido **em terreno plano**, e a correção do declive aplica-se fora dessas condições. Num vale
de socalcos é essa correção que domina o resultado.

O pinheiro bravo não leva marca — os limites acima são de matos, e emprestá-los a outro
combustível seria atribuir à fonte o que ela não diz.

Os quadros foram transcritos de dois documentos, e um deles já cá está. **O Quadro 3.4.1 está
conferido contra o impresso, célula a célula.** Os outros não. Ver `docs/FONTES.md`, chave
FOGOPT. Enquanto assim for, o número serve para ordem de grandeza e para comparar cenários —
não para sustentar sozinho uma decisão de ataque direto.

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

## Nomear as funções do posto de comando

Comando → **Estrutura do posto de comando**. A lista de funções por nomear vem ordenada por
peso, e as quatro prateleiras dizem de onde vem cada uma:

| Prateleira | O que quer dizer |
|---|---|
| «Essencial — exigível por lei nesta fase» | O articulado impõe-a na fase declarada. O motivo cita a alínea |
| «Recomendada — a lei exige na fase seguinte, ou o limiar está próximo» | Ainda não é obrigação, mas está a uma fase de o ser |
| «Sugerida pela prática — sem imposição legal nesta fase» | Núcleos de célula. **A lei não fixa fase para os ativar**: são propostos assim que há posto de comando |
| «De menor importância neste momento» | Matéria de escolha |

**A terceira prateleira nasceu na r0084 e é a razão de esta secção existir.** Até lá havia
três, e nove núcleos apareciam na primeira — a das obrigações legais — com números de fase
que nenhum artigo estabelece. A ativação dos núcleos é competência do oficial da respetiva
célula, "em função da natureza da ocorrência e das necessidades"; a lei não diz a partir de
que fase. Quem comandava não conseguia distinguir o que a lei impunha naquele momento do que
a aplicação achava prudente.

**E na r0087 os números desapareceram de vez.** A etiqueta certa não chegava: um palpite
continuava a ordenar o ecrã por uma escala que ninguém tinha escrito. Os nove núcleos são
agora propostos a partir da fase II, e por uma razão só, que tem fonte — um núcleo é de uma
célula, e não há célula antes de haver posto de comando, art. 13.º, n.º 2. Um deles tem
gatilho próprio: o **núcleo de especialistas** é proposto quando o efetivo no TO excede a
referência da fase declarada, porque é isso que a DON n.º 2 liga à sua ativação, e não uma
fase.

Só o que está na primeira prateleira conta como falta: é o que aparece na lista de
pendências, no briefing de passagem de comando, na passagem de turno e na conformidade. Um
núcleo que ninguém é obrigado a ativar continua a ser proposto, mas não é assinalado como
falta.

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

## O que o plano passa a citar

Não há painel para isto: é o que acontece **dentro** do PEA quando os painéis anteriores
estiverem preenchidos.

Até à r0076, o que se escrevia no relevo, no combustível e na intensidade da frente ficava no
ecrã onde tinha sido escrito. O plano saía com fundamentos genéricos — a mesma frase para um
incêndio de 200 kW/m e para um de 30 000. A partir da r0077 o PEA reúne também o ambiente de
fogo, e isso muda três coisas no documento:

| Onde | O que passa a lá estar |
|---|---|
| Análise da zona de intervenção | O combustível e a carga, a intensidade e o comprimento da chama, o terreno e o perfil, a idade da previsão e a cartografia em uso — **ou o que falta de cada um** |
| Propostas | A primeira proposta decorre da intensidade da frente, quando ela é conhecida: interdição de ataque à cabeça, ataque com apoio aéreo, ataque direto admissível, ou supressão manual, conforme a faixa |
| Análise da zona de intervenção | Os avisos que escreveu no mapa, por extenso; as notas de manobra e observação, contadas; e os focos de calor de satélite, com a confiança e a origem |
| Medidas de segurança | A distância mínima à frente de chamas **em metros**, e não como princípio |

Cada fundamento traz o valor e **a origem da prova** — se a velocidade de propagação foi
observada no teatro ou estimada pelos guias de fogo controlado. A proposta não se enfraquece
por ser estimada: quem aprova é o COS, e o que lhe cabe saber é o que está a aprovar.

### O plano diz o mesmo em todo o lado

O objetivo, a ação decisiva e as propostas **derivam todos da mesma leitura da intensidade**.
Não é uma questão de estilo: até à r0080 o mesmo documento podia dizer "dominar as frentes
ativas e fechar o perímetro" no objetivo e "interdição de ataque direto à cabeça" três linhas
abaixo. Quem executa escolhe uma das duas, e não há como saber qual.

Conforme a intensidade da frente, o plano assume uma de quatro posturas:

| Intensidade | O objetivo diz | Como se fecha o perímetro |
|---|---|---|
| acima de 4 000 kW/m | **Conter** | pelos flancos e pela retaguarda |
| 2 000 a 4 000 | Dominar | com apoio aéreo na cabeça |
| 500 a 2 000 | Dominar | com meios terrestres sob pressão de água |
| abaixo de 500 | Dominar | com equipamento de sapador |

A ação decisiva traz a razão com ela — "Intensidade frontal de 31 920 kW/m: acima dos 4 000
kW/m o controlo frontal é impossível" — para que quem a lê não tenha de a cruzar com as
propostas mais abaixo.

**Sem intensidade determinada, nada disto se impõe.** A aplicação não inventa restrições onde
não tem número: o plano diz o que sempre disse.

### Quando uma proposta é retirada, e porquê

Uma proposta genérica sai do plano quando uma específica a torna dispensável — ou a faz
mentir. São dois casos hoje, e ambos aparecem por escrito no documento em «Retirado por
proposta mais específica», com a que a substituiu e a razão.

| Sai | Quando entra | Porquê |
|---|---|---|
| A postura defensiva fora da janela | A interdição de ataque direto à cabeça | "Defensiva fora da janela" dá a entender que dentro da janela não é defensiva. Com a cabeça interdita acima dos 4 000 kW/m isso é falso a qualquer hora |
| As rendições faseadas no fecho da janela | A rendição imediata de equipas com o tempo vencido | Mandar esperar pelo fecho da janela é mandar manter no terreno quem já devia ter saído |

**A retirada nunca é silenciosa.** Uma proposta que desaparece sem rasto é indistinguível de
uma que ninguém pensou, e o plano passaria a dizer menos do que sabe. A numeração refaz-se
depois de sair, para que o papel não salte de P2 para P4.

A proposta das vigias é caso à parte: não sai, encolhe. Havendo rendições vencidas, larga a
cláusula que mandava render no fecho da janela e mantém as vigias e a cadência de pontos de
situação, que não dependem disso.

### Os números das propostas, e o que os identifica

No PEA impresso as propostas vão numeradas por ordem de leitura — P1, P2, P3. **Dentro de um
documento isso é claro; entre documentos não é.** Quando uma proposta deixa de fazer sentido —
a reserva constitui-se, a linha estreita é alargada — ela desaparece, e tudo o que estava por
baixo sobe uma posição. A P2 do PEA n.º 5 não é a P2 do n.º 4.

Por isso o **controlo de execução** — a lista de missões e propostas que se marca como
cumpridas, e que acompanha a passagem de turno — não usa esse número. Usa uma identidade
própria de cada proposta, e mostra ao lado o número com que ela saiu no papel:

> `LINHA-ESTREITA · P3 no papel · Proposta`

Assim "cumprimos a LINHA-ESTREITA" quer dizer a mesma coisa em qualquer versão do plano, e
continua a poder confrontar-se com o documento que o COS aprovou. **Um PEA já emitido nunca é
reetiquetado**: fica com os números com que saiu.

Além disso, o plano passa a pedir o que falta: uma linha de contenção estreita de mais para a
chama calculada, uma linha sem largura declarada, uma frente cujo rumo foi deduzido do traçado
e não observado, um ponto sensível detetado na carta e ausente do campo de sensíveis.

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

### Levar a aplicação para outro computador

O ficheiro HTML leva **o código e não os dados**. Quem o receber abre a aplicação vazia — é
o que tem de ser, mas é a primeira coisa que confunde. Um kit de entrega são três peças e
não uma:

1. o ficheiro HTML da revisão;
2. a ocorrência exportada em `.json`, quando há uma a passar;
3. a indicação do navegador e o aviso da impressão, abaixo.

**Ao imprimir: ligue a opção "Gráficos de fundo" na caixa de diálogo do navegador.** O Chrome traz
essa opção desligada de origem, e sem ela desaparecem do PEA impresso as linhas de título
com a cor da célula — o documento sai legível e deixa de se parecer com o modelo aceite. É o
percalço mais previsível de todos, e a correção é uma caixa.

**O tipo de letra do documento impresso é o Calibri**, com recurso a `Inter` e depois à
letra sem serifas do sistema. Num computador sem Microsoft Office instalado, o Calibri não
existe e o PEA impresso deixa de bater exatamente com o modelo `.docx`. O conteúdo é o
mesmo; o espaçamento não.

Apontado pelo ramo #005 a 2 de setembro, na análise de portabilidade.

**Encerrar não bloqueia a aplicação.** Fecha aquele registo — deixa de se poder escrever
nele —, mas continua a poder abrir uma ocorrência nova, exportar, importar e consultar o
arquivo. Um registo fechado carimba-se com um selo de integridade, e «Conferir a cadeia do
diário» diz se alguma coisa foi mexida depois.

---

## O que a aplicação recusa fazer, e porquê

Isto não é lista de limitações: é a garantia de que o que ela diz, sustenta.

| Não faz | Porquê |
|---|---|
| **Não diz a que horas o fogo chega a um sítio** | Exige propagação sustentada no tempo e no terreno; os quadros dão a velocidade num ponto e num instante, não a progressão |
| **Não diz quantos hectares vão arder** | Pela mesma razão |
| **Não estima propagação em eucaliptal, folhosas ou formações herbáceas** | Os guias portugueses de fogo controlado cobrem matos e pinheiro bravo. Fora disso, tem de ser observada |
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
