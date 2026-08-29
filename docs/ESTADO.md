# Estado do projeto

Atualizado em 2026-08-29.

## Situação atual

A revisão em vigor é a **r0053**, montada a partir de `fonte/`. **As duas linhagens
convergiram:** a r0035 foi construída sobre a r0034 desta linhagem, e daí em diante há uma
história só.

**A repartição por células está completa.** Todos os ramos do estado estão na célula a
quem a lei atribui a matéria, e o mapa de posse não declara um único movimento pendente.

| | |
|---|---|
| Entregas em `app/` | 57, das anteriores à convenção de nomes até à r0053 |
| Módulos em `fonte/` | 51, em sete zonas, mais o molde |
| Testes | 314, todos a passar |
| Análise estática | sem problemas |
| Tipos | 25 diagnósticos, nenhum novo face à linha de base |
| Auditoria visual | sem transbordo nem exceções, 380/480/768/1440 px, nos dois temas |
| Versão do estado gravado | 11 |
| Regras de conformidade | 15, com as fontes declaradas |

**As seis correções estruturais da proposta de evolução estão feitas, e as camadas 1 e 2
também.** A documentação está arrumada por natureza — ver `docs/README.md`.

### Qual documento governa a ligação à Gestão PCO

A **especificação v1.2**, de 28 de agosto, em `docs/interop/`. Substitui a v1.1 na
íntegra: quem estiver a implementar do lado da Gestão PCO implementa essa e só essa.

A v1.1 fica pelo registo, e o contrato `pco:dispositivo` (`d0002`) também — este foi
escrito a analisar um esboço anterior e não a v1.1, e o seu autor corrigiu-se. Foi dele,
porém, que vieram os três acréscimos que a v1.2 acolheu.

O importador lê os quatro envelopes — v1.2, v1.1 e v1.0, contrato e esboço antigo — e
normaliza-os numa forma só. Ler mais do que um envelope não é hesitar sobre qual manda: é
o que um adaptador faz, porque quem importa não escolhe o que lhe chega às mãos.

## Decisões tomadas

Por ordem em que foram tomadas.

| Decisão | Resolução |
|---|---|
| Camada 2, fonte em módulos com entrega em ficheiro único | **Aceite.** O ficheiro entregue não muda; passa a ser preciso Node para produzir uma entrega |
| Revisões antigas do HTML | **Ficam todas em `app/`**, desde a primeira. A ordem alfabética dos nomes é a ordem das revisões |
| Pipeline de seis agentes | **Reformulado.** Quatro dos seis são cálculos determinísticos e ficam dentro da aplicação; os dois restantes seguem a via C, com o serviço acompanhante em aberto. Ver `CSREPCDouro_202608272132_PipelineAnalise_CLD.md` |
| Modelo de comportamento do fogo | **Viegas (2004),** composição vetorial de declive e vento. Dá o desvio da cabeça e a velocidade relativa; não dá velocidade absoluta nem diz se o fogo se propaga, e a aplicação não finge dar. Ver `FONTES.md`, chave `FOGO` |
| Documento que governa a ligação à Gestão PCO | **A especificação v1.1**, na altura. O contrato `d0002` fica arquivado; o que dele sobrava seguiu para proposta |
| Proposta de v1.2 | **Acolhida.** A v1.2, de 28 de agosto, substitui a v1.1 na íntegra e é o documento em vigor. O importador lê os quatro envelopes |
| Numeração das revisões | **Uma entrega, um número.** A convenção sempre o disse; foi incumprida na r0028 e passa a ser verificada antes de cada entrega |
| Posse do estado por célula | **Aceite como veio da linhagem paralela**, e portada para `tests/posse.test.mjs`. O registo declara o dono de cada ramo com a norma que o sustenta, e um ramo novo sem célula parte a verificação |
| Vazio na fusão de funções do PCO | **Vazio é ausência, não informação.** Uma importação não apaga com vazio o que o oficial registou à mão; um valor preenchido manda |
| Como se alcança um ramo que mudou de dono | **Por acessor único, nunca pelo caminho.** `canaisObj()`, `ptObj()`, `reservaObj()`. Foi por se alcançar `dados.pt` pelo caminho que cinco campos do formulário ficaram para trás, em silêncio, quando o ramo mudou de célula |

## Feito

- Especificação de continuidade fixada em `docs/`.
- `CLAUDE.md` com as restrições não negociáveis e o método de trabalho, lido
  automaticamente em cada sessão.
- Proposta de evolução técnica e desenho do pipeline de análise, em `docs/`.
- **Camada 0.** Extração do `<script>` do HTML, verificação de sintaxe sem execução,
  ESLint sobre o código extraído com erros mapeados à linha do HTML, testes com o executor
  incluído no Node, e integração contínua no GitHub. Ver `tests/README.md`.
- **Auditoria visual** (`npm run visual`): transbordo horizontal e exceções, em todos os
  separadores, a quatro larguras e nos dois temas.
- **Arrumação da documentação** por natureza, com `docs/README.md` a explicá-la.

## As quatro baratas da triagem, na r0053

Os quatro achados que se resolviam sem decidir a arquitetura. Deram trabalho a mais do que
prometiam, e num deles a razão vale a revisão inteira.

### Carimbo de integridade

SHA-256 escrito no projeto — não `crypto.subtle`, que é assíncrona e só existe em contexto
seguro, e o `file://` não o é em todo o lado. Exercitado contra os vetores do FIPS 180-4,
incluindo o do milhão de caracteres. Serializa-se o estado com as **chaves ordenadas**,
senão o resumo mudava sozinho: a ordem das chaves é a de escrita, e o estado que volta do
armazenamento traz a ordem do ficheiro.

O pacote exportado passa a levar a revisão da aplicação, o nome do ficheiro de onde saiu e
o resumo do estado; o nome do ficheiro leva a revisão. Na importação, confere-se — e
**avisa, não recusa**: um pacote que não bate pode ser a única cópia que existe da
ocorrência. O encerramento carimba o registo que fecha, e o cartão mostra o número.

Isto não é assinatura: quem alterar o pacote pode recalcular o resumo. É deteção de
alteração acidental e de troca de ficheiros, que é o que acontece a sério.

### O defeito que o carimbo destapou

A primeira versão não funcionava, e a razão não era o carimbo. **Os acessores de estado
trocavam o objeto a cada chamada**: `O.ramo = Object.assign({...padrão}, O.ramo)` devolve
um objeto novo e deixa órfã qualquer referência guardada antes. Escrever numa referência
dessas não dá erro nenhum — escreve-se, e o estado fica na mesma.

Era o que acontecia ao carimbo: `encerrarOcorrencia` guardava `const E = encObj()`,
`persistir` repintava, `pintarEncerramento` chamava `encObj()` outra vez e destacava o `E`
que a função tinha na mão. O carimbo era calculado e escrito num objeto que já não era o
estado. **É a terceira vez que este projeto apanha a mesma família de defeito** — alguma
coisa muda de sítio e fica um ponteiro para o sítio antigo — e desta vez o ponteiro não
era de ninguém em particular: era de toda a gente que tivesse chamado o acessor antes.

Os sete acessores passam a **preencher no lugar**, com identidade estável. Dois testes:
o mesmo objeto à segunda chamada, e uma referência que sobrevive a outro acessor mexer no
mesmo ramo.

A ordem do carimbo também custou duas tentativas, pela mesma razão de fundo: tudo o que
escreve no estado tem de estar escrito antes de se carimbar — o registo de evolução, a
linha da fita, e o `lerForm()`/`pintarTudo()` que o `persistir` arrasta atrás.

### Origem das coordenadas

`meta.coordFonte` guarda **como** a coordenada foi parar ali: escrita à mão, achada pela
geocodificação (com serviço e topónimo), ou trazida da Gestão PCO. Estava na fita do tempo
e mais lado nenhum, e a fita não acompanha o campo quando o pacote muda de posto. Aparece
por baixo dos formatos. Quem escrever por cima assume-a: passa a manual.

### Limiares da análise meteorológica

Estavam por dentro das comparações, e dois não tinham chão: uma rotação de 50° com vento
de 3 km/h é ruído de modelo, e `precipitação > 0` acendia a assinatura convectiva com um
décimo de milímetro. Ficam declarados em `LIMIARES_METEO`, com a razão de cada um:
rotação ≥ 50° **e** vento ≥ 8 km/h, convectivo ≥ 0,2 mm, janela de consolidação com **2 h
ou mais** — uma hora isolada não dá para montar um ataque. A legenda do meteograma diz os
mesmos números. A diferença angular já era circular; isso a análise externa leu mal.

### Tabela do DECIR por ano

Os períodos estavam fixos no código, o que é o mesmo que dizer que em 2027 a aplicação
respondia calada e errada. Passam a tabela por ano, com a fonte declarada. **Um ano sem
tabela devolve vazio** e a aplicação diz que não tem a diretiva desse ano, em vez de
adivinhar a partir do ano anterior — é a regra 4 do projeto.

### Verificação

314 testes, treze novos. Verificado em navegador: encerramento com carimbo a conferir, e a
origem das coordenadas a mudar de «geocodificação · Photon» para «manual» quando se
escreve por cima. Prova em `docs/qa/` (`qa0014`).

## A área do perímetro estava errada, na r0052

Veio uma análise clínica externa ao r0050, extensa e bem estruturada. Triada achado a
achado em `docs/CSREPCDouro_202608291530_TriagemAnaliseClinica_CLD.md`, com a prova em
código de cada veredito. Três achados não procedem — são texto de arranque que o
JavaScript substitui, lido no ficheiro em vez de na aplicação a correr, e uma leitura
trocada dos limiares de humidade. O resto procede, e a maior parte é a decisão de
arquitetura que já estava em cima da mesa.

Um dos achados era pior do que a análise dizia. **`areaGeoJSON` devolvia o maior anel do
perímetro e mais nada.** Um incêndio raramente é um polígono só: parte-se em manchas
separadas e deixa ilhas por arder lá dentro. A área contava a maior mancha e ignorava as
outras; e contava as ilhas como ardidas. Passa a somar os anéis exteriores de todos os
polígonos, de todas as geometrias, e a descontar os interiores. **A área vai no PEA e
transmite-se pelo rádio** — era número errado a sair do posto de comando.

Corrigida também a frase do perímetro, que prometia área calculada do polígono quando não
havia polígono nenhum.

### O que a análise não viu

Três coisas, que ficam registadas na triagem: o relógio do dispositivo, de que dependem
todos os medidores e regras de prazo, sem verificação nenhuma; a escada de dez migrações
do estado, sem nada que confirme que a migração preservou o que interessava; e os
`try{}catch(e){}` mudos do arranque, que já esconderam uma regressão.

### Verificação

301 testes, três novos sobre a área: manchas separadas, ilha descontada, e coleções com
geometrias que não são área.

## O léxico arrumado por cor, na r0051

Vinte frases por grupo resolveram a falta de vocabulário e criaram outro problema: vinte
teclas com arestas de cinco cores diferentes, entremeadas, são um mosaico — obriga a ler
uma a uma para achar a que se quer.

Passam a estar **arrumadas por cor, e sempre pela mesma ordem**: o que agrava, o que
melhora, os meios, as decisões do COS e, no fim, o que é só ponto de situação e não leva
aresta. A ordem é igual nos oito grupos, que é o que faz a mão aprender onde está o
vermelho sem ter de ler.

**As sequências não se desmancham.** A rosa dos ventos (N a NO) e a escala do perímetro
(10 % a 100 %) são miniaturas e ficam inteiras à cabeça do grupo, pela ordem em que se
leem: pôr o 75 % antes do 10 % por ser verde seria pior do que o mosaico que se queria
resolver. Um teste guarda as duas sequências.

A arrumação é feita no arranque, sobre os próprios botões — os mesmos nós, com os mesmos
ouvintes, noutra ordem. Frase nova escrita em qualquer sítio do grupo vai sozinha para o
seu bloco de cor; não há uma segunda lista para manter alinhada.

### Verificação

298 testes, dois novos: a ordem das cores dentro de cada grupo, e as duas sequências
intactas. Provas em `docs/qa/` (`qa0013`).

## Vinte frases por grupo, em teclas com relevo, na r0050

«E que tal 20 vocábulos por cada grupo?» O léxico passou de 78 para **160 frases, vinte em
cada um dos oito grupos**. Entraram as que faltavam para escrever uma ocorrência sem sair
para o teclado: o fogo tático (contrafogo, queima de alargamento), o comportamento da
progressão (encosta acima e abaixo, focos secundários, inversão noturna, contenção em
linha de água ou em faixa de gestão de combustível), o trabalho do perímetro (pontos
quentes, arrefecimento, entrega à vigilância), a segurança de quem lá está (briefing,
ponto de encontro, contagem de operacionais, exaustão pelo calor), a população (aviso,
porta a porta, regresso autorizado, populares a intervir no combate), o comando (aprovação
e difusão do PEA, ativação de células, setorização revista, passagem de turno, PCO
transferido) e os danos, que eram cinco e são vinte.

Nenhuma frase inventa designação de canal, artigo ou nomenclatura de célula: as que citam
norma são as que já lá estavam. Um teste recusa frases repetidas, frases cujo tipo não
seja um dos cinco, e agora **grupos abaixo de vinte**.

As frases passaram a ser **teclas com o mesmo relevo das teclas de canal** — salientes
enquanto não se carregam, cravadas ao serem premidas. É a tridimensionalidade que já
estava no plano de comunicações, e não é enfeite: uma tecla que se vê saliente diz que se
carrega. Um teste compara o CSS das duas, para que não divirjam.

### Verificação

296 testes, dois novos: o chão de vinte frases por grupo, e o relevo das teclas comparado
com o das teclas de canal. Verificado em navegador nos dois temas e a 480 px; provas em
`docs/qa/` (`qa0012`).

## O medidor em gomos e o léxico arrumado, na r0049

Duas coisas que o Ricardo viu no ecrã e que estavam por resolver: o medidor da r0048 não
era a imagem que ele tinha pedido, e os meios aéreos tinham ficado sem medidor nenhum.

### A laranja cortada

«Imagino o medidor como uma laranja cortada verticalmente em que se veem os gomos, que
neste caso representariam tempo e que ao passar iam desaparecendo.» É melhor imagem do que
a pista da r0048, e por uma razão que se percebe ao vê-la: **os gomos são contáveis**. Uma
pista a 30 % obriga a estimar; três gomos acesos leem-se de relance, sem número.

Um gomo por hora do limite — doze nas unidades terrestres, seis nos meios aéreos. Acesos
os que **faltam**; gastos os que já passaram, que não desaparecem de todo: ficam em traço
apagado, porque sem eles perdia-se o denominador — três gomos acesos não dizem nada se não
se vir que eram doze. Passado o limite, a laranja fica toda vermelha.

O número ao lado mudou de sentido com o desenho: já não são as horas decorridas, são **as
que faltam** (`3.0 h`), ou o excedente com sinal quando o limite já passou (`−1.0 h`). É o
número sobre o qual se decide — «faltam três horas para render esta viatura». As duas
regras da r0048 mantêm-se: a cor é o estado, o número vai em tinta de texto, e o âmbar do
tema claro é o passo medido a 3,96:1.

**Os meios aéreos passaram a ter o mesmo medidor**, com o teto de seis horas. Antes tinham
só as horas em texto colorido; uma aeronave também tem tempo no TO.

### O registo de evolução em três blocos

«O anexo era para pedir que a informação ficasse mais e melhor organizada, pois está muito
confusa no ecrã.» Estava: as 78 frases do léxico apareciam todas ao mesmo tempo, num muro
de oitenta botões iguais, e por baixo, sem separação nenhuma, os campos do registo.

O cartão passa a ler-se como a sequência que é: **1 · A que respeita** (os atalhos de
setor), **2 · O que aconteceu** (o léxico), **3 · Registo** (tipo, GDH, descrição e o
botão). Três blocos numerados, cada um no seu relevo.

O léxico ganhou uma barra de grupos — Combate, Propagação, Perímetro, Meios, Segurança,
População, Comando, Danos, cada um com a sua contagem — e mostra **um grupo de cada vez**,
com uma caixa de procura que corta transversalmente todos eles. A barra é composta a
partir dos próprios grupos do HTML e não de uma lista à parte: grupo novo aparece sozinho.

Cada frase leva agora na aresta esquerda a cor do tipo com que vai entrar — vermelho
agravamento, verde melhoria, azul decisão do COS, laranja alteração de meios, sem aresta o
ponto de situação. As cinco cores foram medidas contra a superfície do cartão nos dois
temas; a mais fraca dá 3,08:1, acima do mínimo de 3:1 para marca não textual. A legenda em
texto diz o mesmo, que a cor sozinha nunca é a informação.

Nos chips do setor, o `1m` desapareceu de todas as unidades que trazem um só veículo: era
ruído repetido em cada bloco. As forças que trazem vários — brigadas, grupos — continuam a
declará-lo.

### Verificação

294 testes, dois novos sobre a barra de grupos e a procura, e o do medidor reescrito para
os gomos e para as horas que faltam. Verificado em navegador nos dois temas e a 480 px;
provas em `docs/qa/` (`qa0011`).

## Cada meio é uma unidade, com o seu relógio, na r0048

Três viaturas do mesmo tipo num setor podem vir de corpos diferentes e ter entrado no
teatro a horas diferentes. Enquanto partilhavam um bloco com `q:3` e **um único
instante**, o relógio da rendição era o mesmo para as três — e a rendição pede-se por
veículo, ao CSREPC, indicando a hora de saída e a de chegada ao destino (DON n.º 2,
ponto 7.e.(5)(r)). Não havia como pedir a rendição de uma delas.

Desde a versão 10 do estado, **uma entrada é uma unidade.** A quantidade desapareceu do
estado: é comodidade de escrita no formulário — «atribuir 3× VFCI» cria três entradas
independentes, cada uma com a sua origem e o seu instante, que daí para a frente divergem.
O campo de origem é novo, ao lado da quantidade.

A migração reparte os blocos existentes sem perder nada. O que se perde é a falsa
igualdade entre unidades que só estavam juntas por comodidade de escrita.

**Agrupa-se para mostrar, nunca para guardar.** O texto do PEA e o briefing continuam a
dizer «2× ECIN», por `agruparTip()`; o estado, o quadro de rendições e os chips do setor
são por unidade. O quadro de rendições passou a ter uma linha por veículo, com a origem no
nome.

### O medidor de tempo

Cada unidade leva um medidor do tempo no TO contra o limiar da sua rendição. Carreguei a
orientação de visualização antes de o desenhar, e ela responde à forma: **uma razão única
contra um limite é um medidor de pista, não um donut** — e o Ricardo tinha sugerido
círculo ou ampulheta. Fica a pista, que lê melhor no espaço de um chip e não pede ícone
nenhum.

Duas regras que segui e que valem a pena reter:

- **A cor é o estado; o número diz quanto, em tinta de texto.** O código anterior pintava
  o número com a cor do nível — a leitura passava a depender de distinguir cores. Agora a
  marca leva a cor e o número fica em tinta.
- **A cor validou-se, não se estimou.** O âmbar do tema claro dava 2,80:1 contra a
  superfície do cartão, abaixo do mínimo de 3:1 para uma marca não textual. O medidor usa
  um passo mais escuro da mesma cor, `#957020`, que dá 3,96:1 — medido com o validador.

O limiar é o mesmo do quadro de rendições, aéreo ou terrestre conforme a tipologia, e o
título traz a hora-limite por extenso.

### E o léxico do registo de evolução

De 41 para 78 frases, em oito grupos — dois novos, **Comando** e **Danos**. Entraram as
que um PCO escreve de facto e que não estavam lá: ataque direto e indireto, linha de
contenção estabelecida e ultrapassada, reacendimento, pedido de rendição ao CSREPC,
reabastecimento, equipa em descanso, zona de segurança, rota de fuga, operacional ferido,
aglomerado ameaçado e dado por seguro, POSIT transmitido, mudança de COS, e os danos em
edificado e área agrícola. Um teste recusa frases repetidas e frases cujo tipo não seja um
dos cinco.

### Verificação

292 testes, nove novos sobre o modelo por unidade e três sobre o léxico. Verificado em
navegador: três VFCI no mesmo setor, de três corpos diferentes, com 13 h, 9 h e 1 h — três
medidores, vermelho, âmbar e verde, e três linhas no quadro de rendições.

## Avisos que se podem fechar, na r0047

**Uma obrigação que nunca fecha ensina o oficial a ignorar o vermelho**, que é o pior que
um motor de conformidade pode fazer. Havia três nessa situação, e são de duas naturezas
diferentes — a distinção é o que interessa aqui.

### O que a aplicação consegue observar cumpre-se fazendo a coisa

O **ataque ampliado** exige um PEA formalmente elaborado passados os 90 minutos. A
aplicação vê o PEA emitido e sabe a que horas — e mesmo assim a obrigação ficava vermelha
para sempre. Passa a fechar sozinha quando há PEA emitido **depois do limiar**, e diz qual
e a que horas. Um plano anterior ao limiar não a fecha, porque não é o PEA que o limiar
exige.

Não há aqui nada a declarar: cumpre-se emitindo.

### O que a aplicação não vê acontecer declara-se, com GDH e autor

A **notificação das duas horas** e a **proposta de ativação do PMEPC** cumprem-se fora da
aplicação — confirmar junto do CSREPC, propor à Autoridade Municipal. A Estação não as vê,
e por isso ganham botão: «Registar a confirmação ao CSREPC», «Registar a proposta de
ativação». Pede quem confirma — pré-preenchido com o COS, se estiver nomeado — e uma nota,
e a obrigação passa a conformidade, dizendo **a que horas e por quem**. Fica na evolução e
na fita, porque o que se declara cumprido é prova documental, e prova sem autor nem hora
não é prova.

Retira-se com um clique, e a retirada regista-se também: as circunstâncias mudam, e uma
reativação repõe a obrigação de notificar.

**Só duas obrigações entram nisto, e o registo `CUMPRIVEIS` declara-as.** Uma obrigação
observável no estado — um canal atribuído, uma função nomeada, um ponto de trânsito
definido — não é declarável, e a função recusa: declarar o que se pode observar abriria a
porta a dar por cumprido o que não está.

Versão 9 do estado, com migração. Nasce vazio.

### Um tropeção repetido

A anotação `@type {RegraDON[]}` ficou outra vez separada do que anota, porque a constante
nova entrou entre as duas — exatamente o que aconteceu na r0039 com o `migrarGravado`. A
camada 1 apanhou-o na mesma volta. Vale a pena reter: **inserir código imediatamente antes
de uma declaração anotada rouba-lhe a anotação**, e nenhuma das duas dá erro em uso.

## A pasta sub-regional segue o TO, na r0046

Duas coisas, e a segunda é a que importa.

**O nome estava errado.** A pasta chama-se **«Douro Op»** nos terminais, e a aplicação
dizia «Douro». Corrigido — o nome de um canal não se abrevia.

**E estava fixa no código.** `SUBREGIAO_ESTACAO = "Douro"` era uma constante, e o teatro
de operações pode ser em qualquer ponto do país. A pasta sub-regional de outra sub-região
tem outros grupos, que esta Estação não conhece: oferecer o OPAR 01 do Douro a um TO de
Trás-os-Montes é oferecer um canal errado.

Agora: o pacote declara a sua pasta (`SUBREGIAO_PACOTE`, a do posto), a ocorrência declara
a **sua** (`O.meta.subregiao`, campo novo na secção de identificação), e a aplicabilidade
dos canais sub-regionais compara as duas. Quando não batem, o cartão do pacote di-lo em
vez de os oferecer. Enquanto a sub-região do TO não for indicada, fica **por confirmar**.

**A sub-região não se deduz do concelho, e é deliberado.** Deduzi-la exigiria a composição
das sub-regiões, que este projeto não tem confirmada em fonte. A restrição n.º 4 é
explícita: sem confirmação em fonte, a aplicação pergunta. Há um teste que fixa que ela
não adivinha.

Versão 8 do estado, com migração. Nasce vazia.

## Catálogo de elementos do TO, na r0045

Quem passa pelo teatro de operações repete-se de ocorrência para ocorrência: o mesmo
comandante, o mesmo adjunto, o mesmo responsável de núcleo. O catálogo guarda quem são
para não se voltar a escrever o que já se escreveu.

**Vive fora da ocorrência**, e é essa a decisão de desenho que tudo o resto segue. Não é
ramo do estado — não entra no PEA, não viaja na exportação da ocorrência, não tem dono no
registo de posse, e sobrevive ao encerramento. Guarda-se em chave própria do `ARMAZEM`,
porque é registo do dispositivo humano da sub-região e não daquele incêndio.

**Não guarda canal**, por indicação do Ricardo e pela razão certa: o canal atribui-se no
plano de comunicações, a partir dos que o CSREPC atribui ao TO — DON n.º 2, ponto 10 —, e
muda com a ocorrência. Guardá-lo no catálogo criaria uma segunda verdade para uma coisa
que a doutrina manda ter fonte única. É a mesma razão por que a v1.2 da ligação à Gestão
PCO deixou as comunicações de fora. Um teste fixa que o campo não existe.

Guarda nome, entidade, contacto, função habitual e nota. A identidade é o par nome e
entidade: o mesmo nome em corpos diferentes são duas pessoas, e a mesma pessoa registada
duas vezes é um erro. Ao atualizar, **campo vazio não sobrepõe o que está** — vale a
mesma regra da fusão de funções do PCO.

Duas operações que poupam trabalho: **recolher desta ocorrência**, que apanha quem está
nomeado no PCO e a comandar setores e ainda não está no catálogo — e **devolve, não
guarda**: quem decide o que fica no registo da sub-região é o oficial, não a importação
de um pacote; e **nomear**, que leva o elemento ao formulário da estrutura do PCO sem o
nomear, porque a função e o GDH são decisão de quem comanda.

### Verificação

269 testes, onze novos. Verificado ponta a ponta em navegador: guardar à mão, recolher
dois da ocorrência, procurar por entidade, e levar um ao formulário do PCO.

## Encerramento do registo da ocorrência, na r0044

Encerrar é ato de comando — art. 8.º, n.º 2 — e o registo temporal tem de ficar explícito
e completo, art. 2.º, al. c). O botão carimba o fim, fecha o registo à escrita e deixa
prova de quem o determinou.

**O que isto não é, e está escrito no próprio cartão:** não encerra a ocorrência no SADO.
A Estação não fala com o SADO, e dizer o contrário seria mentir ao oficial. Encerra-se
aqui o registo que aqui se fez.

### O que impede, e o que apenas fica dito

Impede uma coisa só: **haver setor em curso ou reativado.** Não se encerra o registo de um
incêndio que ainda arde, e o botão fica inerte a dizer qual é o setor.

O resto não impede — fica no processo. Obrigações de conformidade por cumprir, missões do
PEA sem estado, meios com o tempo de empenhamento excedido: são reservas, e entram **no
próprio registo de evolução do encerramento**, que é o que sobrevive à sessão e vai no
PEA. A primeira versão contava-as na fita e dizia «1 reserva» quando eram três obrigações
— contava mensagens, não o que elas descrevem. Corrigido: a fita diz que há reservas, e as
reservas estão escritas onde ficam.

### O fecho à escrita, e o que ele é

Os campos ficam inertes e os dois caminhos que escrevem facto operacional — a mudança de
estado de setor e o registo de evolução — recusam. Ficam de fora o que continua a ser
preciso com o registo fechado: navegar, imprimir, exportar, mudar de tema, e reabrir.

**Não é selo criptográfico**, e não se apresenta como tal: é a diferença entre alterar por
engano e alterar de propósito, que num processo é o que importa. A reabertura é sempre
possível — uma reativação depois do encerramento acontece —, exige quem a determina e um
motivo, e regista-se como o encerramento.

Versão 7 do estado, com migração. Uma ocorrência gravada antes chega **aberta**: presumi-la
encerrada seria fechar à força o que ninguém fechou.

### Verificação

258 testes, catorze novos. O cartão novo foi apanhado pelas duas auditorias no momento em
que nasceu — sem célula declarada em `ARRUMACAO`, a verificação partiu, que é o que ela
existe para fazer. Verificado ponta a ponta em navegador: com frente ativa o botão está
inerte e diz porquê; passado o setor a vigilância, encerra com as reservas listadas, os
campos ficam inertes e o botão de reabrir aparece.

## Análise da repartição dos meios, na r0043

A conformidade media prazos e nomeações. Passa a ler o dispositivo contra si próprio, e a
fazer a pergunta que o COS faz de hora a hora: **os meios estão onde está o fogo?**

### A regra

`cargaDosSetores()` dá, por setor, a carga e a classe do estado. `ativo` é onde o fogo
ainda pede meios — em curso, ou reativado. `libertavel` é aquele cujo estado já não os
justifica na mesma medida — em conclusão, ou em vigilância ativa. O intermédio, em
resolução (dominado), não é nem um nem outro: ainda consolida, e não se mexe nele.

**A regra compara, e nunca conta meios em absoluto.** A distinção importa e foi uma
correção ao primeiro desenho: a vigilância ativa e o rescaldo *exigem* presença no
terreno, e uma regra que acusasse meios num setor em vigilância estaria a acusar o que a
doutrina manda lá ter. O que se assinala é a desproporção — um setor cujo estado já não
justifica a força que lá está, **havendo outro em curso com menos**. O termo de comparação
sai do próprio dispositivo, e por isso não há limiar inventado em lado nenhum.

Três emissões:

| Quando | O que diz |
|---|---|
| Setor em conclusão ou vigilância com mais veículos do que o setor em curso mais desguarnecido | Nomeia os setores e os números, propõe o destino e o comandante a quem entregar, e diz quantos veículos estão em causa |
| O mesmo, havendo setor reativado | A reativação tem precedência como destino, e o título muda para o dizer |
| Nenhum setor em curso, e ainda meios no TO | Propõe a reposição da capacidade de ataque inicial, com desmobilização faseada em coordenação com o CSREPC |

Base: Despacho n.º 4067/2024, art. 17.º, n.º 1, als. a) e d), e DON n.º 2, ponto 7.f para
os estados; para a desmobilização, DON n.º 2, pontos 7.e.(4)(t) e 7.e.(5)(a). Ambas as
citações já existiam no motor — não se inventou fundamento para regra nova.

**Propõe, não determina.** Quem move meios é o COS, e é ele que sabe o que a carta não diz.

### E as frases-tipo passam a produzir efeito

Quatro das frases nomeiam, no seu próprio texto, um dos cinco estados do ponto 7.f:
«frente dominada», «reativação de ponto quente», «rescaldo em curso», «consolidação e
rescaldo concluídos». Dizer «frente dominada» na evolução e deixar o setor «em curso» no
dispositivo é ter duas verdades — e a análise lê o dispositivo, não a prosa.

Escolhe-se o setor no atalho, clica-se na frase, e a aplicação **propõe** a mudança de
estado. Não a aplica: o registo da evolução é narrativa do oficial, o estado do setor é
facto que entra no PEA e dispara regras. Uma coisa não muda a outra sem alguém dizer que
sim.

A mudança de estado passou a ter caminho único, `mudarEstadoSetor()`, seja qual for a
porta por onde entra — o menu da linha do setor ou a frase-tipo. Um segundo caminho sem
registo daria um dispositivo a mudar sem que a evolução o contasse, e a análise passaria a
analisar o que ninguém registou. Mesma lição do `canaisObj()`.

### Verificação

244 testes, onze novos, entre eles o caso que motivou a regra e os três que a impedem de
disparar onde não deve. Verificado ponta a ponta em navegador: dois setores em curso com
os meios repartidos dão conformidade; o oficial diz que a frente do Bravo cedeu, a
aplicação propõe, ele aplica, marca o setor como concluído — e a regra passa a dizer
«Bravo (6 veículos) está em conclusão, e Alfa, em curso, tem 2 veículos», com o destino e
o nome do comandante a quem entregar.

## Legibilidade dos campos e peso dos avisos, na r0042

Três coisas vistas em uso.

**Um rótulo comprido desalinhava o campo.** O do GDH da solicitação leva o nome da
entidade nomeadora, e com a designação da lei por inteiro — «força de segurança
territorialmente competente» — quebrava em duas linhas e empurrava o campo para baixo do
dos vizinhos. Cada função externa passa a declarar uma forma curta, `extC`, para o rótulo;
a designação da lei fica no `title` e continua inteira no aviso e no PEA — abrevia-se o
rótulo, não a norma. E a causa estrutural também: uma célula da grelha passa a coluna com
o campo encostado ao fundo, e os campos de uma linha ficam alinhados tenha o rótulo as
linhas que tiver.

**As caixas de aviso não distinguiam nível.** Todas tinham a mesma superfície e a mesma
moldura; só mudava uma barra de 3 px. Uma obrigação legal em incumprimento lia-se igual a
uma conformidade verificada. Passa a haver três pesos, e sem ícones — barra, fundo e
relevo, por esta ordem de força: a obrigação leva barra de 7 px, fundo tingido, sombra,
título na cor do nível e etiqueta em bloco cheio; a antecipação leva 5 px e um tingimento
mais leve; a conformidade fica em repouso, porque é registo e não chamada. Cada declaração
com `color-mix` leva antes a sua equivalente em cor sólida, para o caso de o navegador do
posto não a conhecer.

**O cartão das integrações estava desatualizado.** Dava como «próximo passo da Fase 1»
substituir o colar de CSV por chamada automática ao Open-Meteo — que está feito desde a
r0014, com os avisos do IPMA a acompanhar. O cartão passa a dizer o que é: duas fontes, a
automática e o colar manual para quando não há rede. O próximo passo real é reter a última
previsão obtida, para que uma perda de rede não deixe o meteograma vazio.

## A ajuda no ecrã, recuperada na r0041

Reportado em uso: o botão de ajuda não mostrava nada. O botão não estava partido — o que
ele mostrava é que estava.

O mecanismo funcionava todo: alternava a classe `ajuda` na raiz, a regra
`html.ajuda .help{display:block}` estava lá, e os oito blocos existiam com o texto
completo. O que se partiu foi **onde os blocos estavam**. A `arrumarCasa()` move para os
separadores novos os nós com classe `card`, e os blocos de ajuda não são cartões: são
irmãos dos cartões, filhos diretos dos painéis antigos. Ficaram lá, e os painéis antigos
levam `husk`, que é `display:none !important`. Sete dos oito eram inalcançáveis; o oitavo,
o da passagem de turno, aparecia — porque esse separador não foi substituído.

Pior de usar do que parece: a ajuda **nasce ligada**. Ao arrancar a classe já era `ajuda` e
o botão já dizia «Ocultar» — a aplicação afirmava que a ajuda estava visível quando não
estava, e a primeira carregadela desligava-a. Parecia não fazer nada duas vezes seguidas.

**É a terceira vez que a mesma coisa acontece.** Uma reorganização muda algo de sítio e um
pedaço que apontava para o sítio antigo fica para trás, em silêncio: cinco campos do
formulário no ponto de trânsito, a `auditarArrumacao` que ninguém chamava, e agora sete
blocos de ajuda. Nenhum destes rebenta; todos desaparecem.

### O que mudou

A ajuda passa a ser **um bloco por separador**, porque o separador é a unidade da interface
desde a arrumação por célula. Os sete blocos antigos, organizados pela numeração de secções
do fluxo de trabalho — «Secção 1», «Secção 2» —, foram reescritos em quatro, um por célula,
mais o da passagem de turno que já estava certo. Nenhuma afirmação se perdeu e nenhuma
citação legal foi tocada; o que mudou foram os títulos e as remissões internas, que
apontavam para secções que já não existem: «ver na secção 2» é hoje «em Operações».

Cada bloco declara a sua chave em `data-ajuda` e vive dentro do painel da sua célula desde
o princípio, e por isso não precisa de ser movido. Mas precisa de ser **auditado**: o
registo `AJUDAS` declara os cinco, e `auditarArrumacao()` passa a devolver
`ajudaForaDeCelula` e `ajudaEmFalta`. Um bloco que caia fora de um painel vivo, ou um
separador que fique sem ajuda, acende o mesmo aviso que um cartão perdido. É o que fecha a
classe de erro, em vez de tapar este caso.

Um teste recusa que a ajuda volte a falar da numeração antiga.

### Verificação

231 testes. Verificado em navegador, separador a separador: os cinco blocos aparecem, com
altura e conteúdo, e o botão apaga-os. Auditoria visual sem transbordo às quatro larguras e
nos dois temas.

## O plano de comunicações no seu ramo, e os módulos na sua zona, na r0040

Fecha a repartição por células. Já não há ramo do estado fora da célula a quem a lei
atribui a matéria, nem módulo fora da zona a que pertence — o mapa de posse deixou de
declarar movimentos pendentes.

### O plano de comunicações passa para a logística

Era o último ramo por mover, e estava declarado como pendente com a razão por que
esperava: 52 pontos de leitura por `P.canais` e o instantâneo do PEA a copiar o ramo `pco`
inteiro.

A base é doutrinária. Compete ao CSREPC e ao CNEPC atribuir os canais rádio de cada TO, e
ao COS implementar com base neles um plano de comunicações — DON n.º 2, ponto 10, n.os (1)
a (3). A **sustentação** desse plano é matéria do art. 32.º, n.º 1, al. d), e do art. 34.º,
que são da célula de logística e finanças. O que fica em `pco` são as nomeações do
art. 14.º, e mais nada.

`MIGRACOES[5]`, versão 5 para 6, com a mesma regra dos degraus anteriores: o destino só
vence a origem quando tem conteúdo, e a origem limpa-se para não ficarem duas verdades.

**Um acessor único, `canaisObj()`.** Os pontos de leitura passaram todos por ele, e nenhum
alcança o ramo pelo caminho. Não é preciosismo: foi por se alcançar um ramo pelo caminho
que o ponto de trânsito se perdeu na r0035 — o estado mudou de dono e cinco campos do
formulário ficaram para trás, em silêncio. Um acessor único torna esse erro impossível de
repetir, porque não há segundo sítio por onde lá chegar.

**O PEA emitido não muda de forma.** É um documento congelado, e a sua forma não se altera
porque o estado vivo mudou de arrumação: o instantâneo continua a levar `{funcoes, canais}`,
que é o que os PEA já emitidos trazem e o que a impressão lê. O plano vem agora da
logística e entra no instantâneo pelo mesmo nome.

O `no-unused-vars` apanhou seis `const P = pcoObj()` que ficaram sem uso, e um `P` no
destructuring da regra `placom` do motor de conformidade. Removidos.

### Os dois módulos foram para a zona certa

`importacao-da-gestao-pco.js` estava em Planeamento e é o dispositivo — arts. 17.º e 19.º:
foi para `4-operacoes/04`. `posse-do-estado-por-celula.js` estava em Turno e é transversal:
foi para `1-nucleo/10`. As duas movimentações foram verificadas como **puramente de ordem**
antes de qualquer alteração de conteúdo: as mesmas linhas, noutro sítio.

### Verificação

226 testes. Verificado ponta a ponta em navegador com uma ocorrência gravada na versão 5:
migra para a 6 com os canais e os atribuídos intactos, a origem limpa, zero órfãos e zero
movimentos pendentes; a regra `placom` do motor de conformidade continua a ler os canais;
o briefing mostra-os na secção 4; exportar e reimportar a ocorrência preserva-os. Sem
exceções.

## A fonte repartida por célula, e a r0038 recolhida, na r0039

A linhagem paralela entregou quatro revisões sobre a r0034 — `p0006` a logística com ramo
próprio e o estado na versão 5, `p0007` a interface organizada por célula, `p0008` o
JavaScript reagrupado por célula, `p0009` a cor por célula nos separadores. **Não houve
fusão a fazer:** a r0035 foi construída sobre a r0034 desta linhagem, e provou-se —
aplicar `p0006` a `p0009` sobre a r0034 reproduz a r0038 tal como foi entregue, só a
diferir no carimbo. A entrega não traz nada que os patches não digam.

O que houve foi uma **recolha**: repartir a r0038 de volta por `fonte/`.

### A fonte passa a ter uma pasta por célula

O `p0008` reagrupou as secções do `<script>` por célula sem mover uma única função, e os
cabeçalhos de secção são as fronteiras dos módulos. `fonte/` passou de 34 módulos planos a
**49 módulos em sete zonas** — `1-nucleo/`, `2-comando/`, `3-planeamento/`, `4-operacoes/`,
`5-logistica/`, `6-turno/`, `7-arranque/`. A ordem das pastas e depois a dos ficheiros é a
ordem de montagem, e é a ordem por que o código corre: o núcleo primeiro, porque é o que o
arranque precisa de ter avaliado; o arranque no fim, porque corre sobre tudo o resto.

`lerModulos` percorre agora as pastas, e **recusa um `.js` solto na raiz** — ficaria sem
célula e sem lugar determinado na montagem, e a ordem deixaria de se ler na árvore. A
repartição foi provada sem perdas: remontar os 49 módulos reproduz a r0038 byte a byte.

### Dois módulos ficaram na zona errada, e vê-se

O `p0008` deixou treze cabeçalhos sem zona. Onze são restos curtos, que ficam com a secção
que os precede. Dois são subsistemas inteiros, e a repartição corta-os à parte de propósito
— para que a má colocação apareça na árvore em vez de ficar escondida dentro de outro
módulo:

| Módulo | Onde está | Onde pertence |
|---|---|---|
| `3-planeamento/07-importacao-da-gestao-pco.js` | Planeamento | **Operações** — é o dispositivo, arts. 17.º e 19.º |
| `6-turno/02-posse-do-estado-por-celula.js` | Turno | **Núcleo** — é transversal, como o registo de arrumação |

Mover cada um é uma revisão própria, porque muda a ordem do ficheiro entregue.

### O defeito que a auditoria apanhou assim que passou a acender

E apanhou-o na primeira vez que correu a sério, o que é o melhor argumento possível para
a ter ligado.

O `p0006` moveu o ponto de trânsito de `dados.pt` para `logistica.pontoTransito`, e moveu
o acessor `ptObj()` com ele. **Não moveu os cinco campos do formulário**, que continuaram
a declarar `data-campo="dados.pt.*"` — um ramo que a versão 5 do estado apagou.

O resultado: o que o oficial escrevia no ponto de trânsito ia para um ramo morto.
`ptObj()` devolvia vazio, e o ponto de trânsito **não chegava ao PEA, nem ao briefing de
passagem, nem às pendências da célula de logística, nem à exportação por célula**. O
formulário era coerente consigo próprio — escrevia e relia no mesmo sítio errado —, e por
isso nada parecia partido. Falha silenciosa, outra vez, e num campo que a DON n.º 2 manda
estabelecer quando há pedido de reforço.

Os cinco campos passam a apontar para o ramo da logística. Verificado: escrever à mão
chega ao `ptObj()`, às pendências e à volta ao formulário, e a auditoria de posse fica sem
órfãos.

Uma nota sobre o `t0006`, que traz o mesmo teste que eu escrevi e **falha agora**: punha o
valor direto no estado e exportava. Passava na r0038 *por causa* do defeito — o formulário
escrevia noutro ramo e portanto não apagava o que o teste tinha posto. Ligados os dois, o
`pacoteOcorrencia()` lê o formulário vazio e apaga, como faz a todos os outros campos. O
teste desta linhagem escreve pelo formulário, que é por onde o oficial escreve.

O `t0005` falha seis, e também não é regressão: é uma bateria da era da versão 4, que
aponta para `dados.est.res` e companhia, e cujo próprio arranque cria hoje um ramo órfão.
Está substituída por `tests/posse.test.mjs`.

### Dois defeitos na r0038, apanhados pelas camadas

**`auditarArrumacao()` nunca era chamada.** O `p0007` declarava, no comentário da própria
função, que um cartão sem célula é «defeito visível» — e nada o tornava visível. A
auditoria de posse está ligada ao quadro de turno e acende um aviso; esta ficou a existir
só para o teste. Passa a acender o mesmo aviso, com as mesmas três condições: cartão fora
de célula, célula declarada para cartão inexistente, cartão sem norma. Apanhado pelo
`no-unused-vars`.

**Um `const e = estObj()` morto** em `pendenciasCelula`, resto do movimento do `p0006`: a
reserva passou a vir de `reservaObj()` e a ligação antiga ficou lá. Também do
`no-unused-vars`.

E a verificação de tipos apanhou um terceiro, que não é erro de ninguém mas deixara de
fazer sentido: a migração 0 para 1 normalizava `dados.est.res`, `dados.est.za` e
`dados.pt` contra o estado por omissão. Desde a versão 5 esses ramos já lá não estão —
preenchia com indefinido e o degrau 4 para 5 apagava logo a seguir. Removidos, com o
porquê no lugar deles.

### Verificação

221 testes, todos a passar. As baterias da outra linhagem foram portadas para
`tests/logistica.test.mjs` e `tests/arrumacao.test.mjs`, pela mesma razão de sempre: um
teste que não corre em `npm run tudo` não protege nada. Análise estática limpa, zero
diagnósticos novos de tipos, auditoria visual sem transbordo. Verificado ponta a ponta em
navegador: importação da v1.2, cinco separadores por célula, posse sem órfãos, arrumação
com 28 cartões e nenhum fora de célula, aviso de posse apagado, briefing com as oito
secções, sem exceções.

## Fusão da terceira linhagem paralela, feita na r0034

A linhagem paralela entregou três patches sobre a r0028 de 15h23 — `p0003` a passagem de
turno com o estado na versão 4, `p0004` os dois instantes da nomeação externa no
importador, `p0005` a posse do estado por célula. Entretanto esta linhagem tinha feito o
briefing de passagem, os instantes ISO e a v1.2. Fundiram-se aqui.

**A base comum é a r0028 de 15h23**, e determinou-se por comparação, não por suposição: é
a que produz o menor diferencial contra o que a outra linhagem entregou. A fusão a três
deu **três conflitos, todos triviais** — o rodapé, que a montagem carimba de qualquer
modo; o leitor do bloco `pco`, tratado a seguir; e o briefing e o motor de turno inseridos
no mesmo ponto, que não são conflito nenhum e ficam ambos.

O ficheiro fundido foi repartido de volta por `fonte/`, e a repartição foi **provada sem
perdas**: remontar os 34 módulos reproduz o ficheiro fundido byte a byte. Depois disso, o
registo de posse e o motor de turno saíram para módulos próprios — `30-posse-do-estado-
por-celula.js` e `31-passagem-de-turno.js` —, e essa mudança foi verificada como
**puramente de ordem**: as mesmas linhas, noutro sítio.

### O conflito que valia a pena, e o defeito que ele escondia

O `p0004` acrescentava `solicitado` ao `funcoes.push` dos núcleos externos. Essa linha
tinha deixado de existir: a r0029 juntou os dois leitores do bloco `pco` — o do contrato e
o da especificação — numa função só, `blocoPcoGP`, porque a v1.2 trouxe o bloco `pco` para
o envelope da especificação e dois leitores da mesma coisa era o defeito a evitar. O
acréscimo entrou lá, uma vez, a servir os dois envelopes.

Só que o conversor passou a devolver **sempre** a forma completa, com vazio no que o
pacote não traz. E a fusão de funções fazia `Object.assign({}, atual, nova)`, que sobrepõe
com esse vazio. Resultado: uma importação apagava o instante de solicitação — e o
contacto, e o canal — que o oficial tivesse registado à mão. Exatamente a perda que a
fusão por designação existe para impedir, entrada pela porta do lado.

Está corrigido em `fundirFuncaoPCO`: **vazio não é informação, é ausência**, e não
sobrepõe. Um valor preenchido manda, porque aí o pacote sabe. Não há forma de o pacote
pedir que se limpe um campo, e é deliberado — ausência e vazio chegam iguais ao fio, e
entre não mexer e apagar, não mexer é o que se recupera.

Foi um teste meu que o expôs, e a afirmação do outro lado — «o `Object.assign` preserva o
`solicitado`» — era verdadeira antes do `p0004` e deixou de o ser com ele.

### O outro defeito, apanhado pela camada 1

O `p0003` inseriu o bloco da passagem de turno **entre a anotação JSDoc e a função que ela
anota**. O `/** @param {any} guardado @returns {Estado} */` do `migrarGravado` passou a
encimar o `CELULAS_PCO()`, que não tem parâmetro nenhum e devolve outra coisa. Dois
diagnósticos novos, e a anotação voltou para cima da função a que pertence. É a camada 1 a
fazer o que se lhe pede: um comentário fora de sítio não parte nada em uso, e por isso
sobreviveria indefinidamente.

### Verificação

191 testes desta linhagem, e os 34 do `t0005` da outra, todos a passar sobre a r0034. Os
do `t0005` foram portados para `tests/posse.test.mjs`, porque um teste que não corre em
`npm run tudo` não protege nada. Verificado ponta a ponta em navegador: importação da v1.2
com os dois instantes gravados em campos distintos, auditoria de posse limpa sobre estado
povoado (72 folhas, zero órfãos), quadro de turno com as quatro células, briefing com as
oito secções. Sem exceções.

## Especificação v1.2 da ligação à Gestão PCO, implementada na r0029

A v1.2 substitui a v1.1 na íntegra. Muda quatro coisas, e o importador acompanha-as todas.

**Instantes no mesmo campo.** A v1.1 só tinha o GDH doutrinário, que não leva fuso
horário. Em operação nacional, com uma zona horária só, isso não é problema; passa a ser
numa exportação gerada em UTC e lida em hora local, e na transição da hora de verão, em
que existe uma hora repetida. A minha proposta punha o ISO em campos irmãos `_iso`; a v1.2
resolveu-o melhor — **o mesmo campo aceita as duas formas**, porque são inequivocamente
distinguíveis: o GDH é seis dígitos, três letras e dois dígitos, e nada mais o é. O
importador tenta uma e depois a outra. Os campos `_iso` continuam a ser lidos, porque uma
revisão desta Estação os leu e descartar um instante em silêncio é pior do que a linha que
custa; nenhuma exportação os emite.

**Bloco `pco`.** Estrutura do posto de comando, com as designações exatas do art. 14.º e
dos arts. 18.º a 38.º do Despacho n.º 4067/2024 — é essa cadeia que cruza com as funções
exigíveis pela fase do SGO, e um nome aproximado faria a aplicação dizer que a função está
por nomear quando está nomeada. Falha silenciosa é o pior género, e por isso é assinalada.
Nos núcleos externos do art. 17.º, n.º 2, als. d), e) e f), **dois instantes distintos**:
a solicitação pelo COS e a nomeação pela entidade externa. A distância entre eles é
informação operacional, e `nomeado` a `null` diz que o pedido continua pendente.

**Ponto de trânsito** e **estimativa de empenhamento assinalada** entram no mesmo caminho.

O bloco `pco` e o ponto de trânsito já eram lidos no envelope do contrato, e a leitura era
outra. Passaram a uma função só, partilhada pelos dois envelopes: o que a v1.1 produzia
sem eles continua a ser exatamente o que produz — a retrocompatibilidade não custou um
ramo.

Treze testes novos, e o exemplo `EspecificacaoJSON_v1.2_exemplo.json`, que usa as duas
formas de tempo de propósito no mesmo array. Verificado ponta a ponta em navegador: quatro
funções do PCO no estado, ponto de trânsito, e um único ponto assinalado — o núcleo
solicitado e ainda por nomear, que é informação e não defeito.

## Briefing de passagem de comando, feito na r0028

Documento gerado do que já está registado, pela ordem por que se entrega um comando:
situação, dispositivo, estrutura do posto de comando, plano de comunicações, tempos de
empenhamento, conformidade, PEA em vigor, evolução desde então, e o que fica por decidir.

Determinístico, sem modelo. **Não altera a ocorrência** e não cria ramo novo: o instante
vem de fora e o resultado é devolvido, não guardado. É por isso que pode ser chamado por
quem venha a construir a rotatividade de funções da EPCO — o briefing é o conteúdo da
passagem, não o mecanismo dela, e esse fica inteiro para quem o fizer.

As pendências não são opinião: saem das obrigações do motor de conformidade, das funções
exigíveis por nomear, dos setores sem canal de manobra, das rendições vencidas e da
validade do PEA excedida.

Dois defeitos meus apanhados por testes meus. O briefing chamava `nivObj()`, que
normaliza e portanto escreve — e o motor de conformidade fazia o mesmo, o que é pior:
uma verificação que altera o que verifica já não é de confiança. Ambos passam a leitura
defensiva, e a saída do motor foi confirmada idêntica em 63 comparações. O que resta é a
reparação de invariantes de forma do `aerLista()`, que **tem** de acontecer, sob pena de
os meios aéreos de ocorrências antigas desaparecerem do briefing; a afirmação é que foi
corrigida, não o código.

Quinze testes. Verificado em navegador com dispositivo importado: nove secções, oito
pendências, descarga em texto com nome pela convenção, sem exceções.

## Importação da Gestão PCO, feita na r0027

Implementada contra a especificação v1.1, **antes de existir uma exportação real**. Lê
ficheiro ou conteúdo colado, e escreve apenas o que a secção 5 da especificação mapeia:
identificação, dispositivo e pontos sensíveis. A evolução, os PEA, o meteograma e a fita
do tempo não são tocados — uma verdade por domínio.

Tudo o que a especificação manda converter está implementado e testado: estados de setor
da v1.0, siglas descontinuadas com conversão determinada, `fase` como sinónimo de
`fase_sgo`, meios aéreos em contagem convertidos em entradas anónimas, campos
desconhecidos ignorados. O que exige decisão humana — `FEB`, `UEPS` e `MR` isolada — fica
como veio e é assinalado, porque a Estação não pode escolher a entidade por quem exportou.
Divergências face ao catálogo não bloqueiam: prevalece o valor exportado.

Para que a exportação real possa ser verificada no dia em que existir:

- `docs/interop/exemplos/EspecificacaoJSON_v1.2_exemplo.json` — o exemplo do documento em
  vigor; traz o bloco `pco`, o ponto de trânsito e as duas formas de tempo.
- `docs/interop/exemplos/EspecificacaoJSON_v1.1_exemplo.json` — o exemplo da v1.1; entra sem um
  único ponto a confirmar.
- `docs/interop/exemplos/pco-dispositivo_v0_esboco.json` — exercita todas as conversões; produz nove
  pontos a confirmar.
- `npm run validar-gp -- <ficheiro>` — corre o mesmo leitor e conversor da Estação sobre
  um ficheiro e diz o que ela fará com ele, sem escrever nada.
- `docs/interop/exemplos/LEIAME.md` — para quem desenvolve a Gestão PCO, com o que mais importa
  acertar, por ordem de valor operacional.

### O diferencial, e porque é que contagens não chegam

A regra 6 do contrato manda apresentar o diferencial antes de aplicar. Contar setores e
forças não cumpre a regra: um pacote com o mesmo número de setores pode perder um
comandante ou os instantes de empenhamento, e o oficial veria «Setores 2 → 2» e aplicaria
às cegas.

O diferencial desce por isso ao setor — estado, comandante, número de forças e quantas
têm relógio — e assinala a vermelho as linhas em que se **perde** informação registada,
com nota própria por baixo da tabela. Um setor que desaparece tem linha própria. As
funções do PCO nunca aparecem como perda, porque se fundem pela designação.

Um guarda impede outra forma de sobreposição cega: se o dispositivo mudar entre o cálculo
do diferencial e a confirmação, a importação é recusada e pede-se que se repita.

### Verificação

Trinta e cinco testes. Verificado ponta a ponta em navegador, nos três envelopes e nas
duas vias — ficheiro e colagem —, incluindo os botões de confirmação, que são criados
dinamicamente e nunca tinham corrido fora do jsdom. Cancelar não altera nada; aplicar
altera. Um pacote degradado produz três linhas de diferencial, todas assinaladas como
perda.

## Camada 2 — fonte em módulos, entrega em ficheiro único, feita na r0024

A fonte passou a viver em `fonte/`: `molde.html` mais **29 módulos**, um por subsistema,
pela mesma divisão que os comentários de secção já faziam dentro do ficheiro. A ordem dos
nomes é a ordem de montagem. `npm run montar` junta-os, carimba a revisão e escreve a
entrega em `app/`.

**O que chega ao posto de comando não muda:** um ficheiro HTML autónomo, duplo clique, sem
servidor e sem rede. Provado: montar a fonte com o número e o nome da r0023 reproduz a
r0023 **byte a byte**. A r0024 difere dela apenas no carimbo.

O que muda é tudo o resto. Cada subsistema é legível de uma assentada, as alterações passam
a ter diff revisível, e a substituição de blocos grandes deixa de ser a operação normal.

`tests/montagem.test.mjs` recusa que a entrega divirja da fonte: editar o HTML de `app/` à
mão faz falhar a verificação. Confirmado.

## Camada 1 — tipos sem compilação, feita na r0023

`tipos/estacao.d.ts` declara as formas do estado e a superfície global da aplicação; o
ficheiro entregue leva apenas nove anotações curtas que apontam para esses nomes. Não
transpila, não produz nada, e o navegador nunca sabe que existe.

O verificador expôs sete defeitos reais, todos corrigidos na r0023:

| Achado | Natureza |
|---|---|
| `O.meta.nivelAuto` | **Escrita morta** num campo que nunca foi declarado em `novoEstado`, e que ninguém lê. Antes da r0018 era apagada a cada leitura do formulário. Removida |
| `pcoDef` devolvia recurso sem `f` | Quem chama lê `.f` logo a seguir; funcionava por acaso. O recurso passa a levar `f` vazio, de propósito |
| `isNaN(d)` sobre uma data | Comparava por coerção. Passa a `isNaN(d.getTime())` |
| Cinco ramos de recurso `\|\|{}` | Devolviam objeto sem forma onde o código lia campos. Passam a devolver a forma completa |
| `pcoObj` com `canais:{}` | O ramo de recurso não tinha a forma dos canais |
| `FileReader.result` usado como texto | Podia ser `ArrayBuffer`; passa por `String()` |
| `motivo` e `futuro` nos erros | Propriedades próprias, agora declaradas |

O estreitamento de tipos do DOM ficou fora do alvo: são 25 diagnósticos, registados numa
linha de base em `tipos/baseline.json`. O que a exceder faz falhar `npm run tipos`.
Verificado: introduzir `O.meta.numero` em vez de `O.meta.num` é apanhado, com a linha do
HTML.

## Correção 4.6 — a ocorrência não se pode perder, feita na r0022

Exportação e importação da ocorrência em JSON, independentes do `ARMAZEM`. Funcionam em
`file://` e dão ao oficial uma cópia que ele controla e pode levar para outro posto.

- O pacote leva tipo, versão do estado e GDH da exportação. O nome segue a convenção.
- A importação é **dados, nunca código**: valida a forma, migra pelo mesmo caminho do
  estado gravado, recusa com motivo o que não reconhece, e recusa um ficheiro de revisão
  posterior em vez de o adivinhar.
- Substituir uma ocorrência diferente da que está em memória pede confirmação. Uma
  importação recusada não mexe no que estava.
- Quando o `ARMAZEM` cai em memória de sessão, o aviso deixa de ser uma mensagem que
  passa: a nota sob os botões passa a dizer que a exportação é a única forma de não
  perder a ocorrência.

Isto fecha, na prática, o risco deixado em aberto pela 4.1: mesmo que um estado de
revisão posterior seja recusado e depois sobreposto, existe cópia fora do dispositivo.
Não o elimina — a proteção é a cópia, não o impedimento da sobreposição.

Dez testes, e o ciclo completo verificado em navegador: exportar, limpar, importar de
volta, com o campo derivado intacto.

## Correção 4.5 — a rede como caminho de falha, feita na r0021

O `fetchT` já tinha prazo e cancelamento. Faltava-lhe o resto, e havia uma chamada a
escapar-lhe.

- **Cache de pedidos idênticos**, com validade de 90 segundos. Um pedido igual não se
  repete enquanto a resposta anterior serve, e dois pedidos iguais em simultâneo partilham
  a mesma ida à rede. Generaliza o princípio que só existia no `distritoChave`.
- **Sem ligação responde já**, com o motivo certo, em vez de esperar pelo prazo inteiro.
  Num PCO isto é a diferença entre saber e ficar à espera.
- **A falha passou a ter motivo**: sem rede, prazo esgotado, recusa da origem, ou falha.
  O `motivoRede` dá a frase, e as mensagens da previsão automática, do perfil do terreno e
  da amostragem do relevo passaram a dizer o que aconteceu em vez de mostrarem o erro cru.
- **A chamada ao modelo era a única sem prazo máximo.** Passou a tê-lo, com orçamento
  próprio de 60 segundos, e sem cache.

Uma recusa da origem não fica guardada, e quem chama continua a ver `r.ok` como antes:
os doze pontos de chamada não mudaram uma linha. Dez testes.

## Correção 4.3 — registo de regras de conformidade, feita na r0020

`verificacoesDON` era uma função de 277 linhas que crescia por acrescento. Passou a
`REGRAS_DON`, doze regras autónomas, cada uma com identificadores que emite, título,
fontes doutrinárias que invoca e função do contexto. `contextoDON` calcula uma vez o que
todas partilham.

Três ganhos:

1. **Uma regra que rebente deixou de levar as outras atrás.** Antes, uma exceção esvaziava
   o painel inteiro dentro do `try` do `pintarDON`. Agora vira aviso próprio, porque uma
   verificação que falha não pode passar por conformidade verificada.
2. **Cada regra exercita-se sozinha**, com um contexto construído à medida.
3. **As fontes passaram a ser auditáveis por comparação.** `docs/FONTES.md` tem uma entrada
   por documento, e `tests/fontes.test.mjs` recusa que uma regra invoque documento não
   listado, ou que cite um documento sem o declarar.

A reorganização não podia mudar uma palavra do que a aplicação diz ao COS. Foi verificada
por comparação direta com a r0019: sete estados montados à mão, nove instantes cada,
**63 comparações, zero diferenças** no JSON completo dos itens emitidos.

## Correção 4.4 — relógio injetado, feita na r0019

`agora()` é o ponto único de leitura da hora. `verificacoesDON(ts)` e `rendicoes(ts)`
aceitam o instante em argumento e só recorrem a esse ponto quando não o recebem.

Passaram a ter teste, com hora escolhida: a fronteira exata dos 90 minutos entre ataque
inicial e ampliado, a notificação das duas horas, a recomendação de PMEPC às vinte e
quatro, o silêncio das regras sem GDH de início, e a contagem das rendições. Dez testes.

Ficam por injetar os prazos de validade do PEA (`renderVigor`), que leem o relógio pelo
seu lado. Não são regras de conformidade e não entraram nesta correção.

## Correção 4.2 — o formulário escreve no estado, feita na r0018

Cada campo declara em `data-campo` o caminho do seu lugar no estado, e escreve só nesse
lugar. `lerForm` deixou de refazer `O.meta` de raiz: percorre os campos e escreve cada um.
Um ouvinte delegado mantém o estado a acompanhar o formulário à medida que é preenchido,
e não apenas ao gravar.

O que isto remove: **os campos derivados deixaram de precisar de preservação à mão.**
`distrito`, `concelho` e `distritoChave` sobrevivem porque nada passa por eles. Acrescentar
um campo derivado deixou de exigir cuidado dentro do `lerForm` — que era o aviso repetido
duas vezes na especificação, e a assinatura de um defeito de desenho.

Os outros dois sítios que reconstruíam `O.dados.topo` passaram a sincronizar pelo mesmo
caminho. Fica uma exceção declarada e visível: os setores em texto livre só contam com o
modo livre ligado.

Nove testes novos. Corridos contra a r0017, cinco falham — entre eles o que verifica que um
campo derivado novo sobrevive sem ninguém se lembrar dele.

## Correção 4.1 — versão do estado gravado, feita na r0017

`VERSAO_ESTADO` e uma cadeia `MIGRACOES` em que o índice i migra da versão i para a i+1.
O `carregar` passa por `migrarGravado`, que:

- trata como versão zero tudo o que não traga marca, e migra;
- preenche contra os valores por omissão os ramos que o carregamento antigo deixava por
  normalizar — `meta`, `pco` e os ramos de `dados` —, sem sobrepor valor gravado;
- garante que os ramos que deviam ser listas o são;
- **recusa, sem tocar em nada, um estado gravado por revisão posterior**, e diz de que
  versão veio.

O que a migração 0 para 1 deliberadamente não faz: reinterpretar a semântica dos canais.
Uma ocorrência gravada antes de `siresp`/`ba` passarem a nível de manobra não traz marca
que permita distingui-la das posteriores. Adivinhar seria pior do que não mexer. O valor
desta correção está no que protege daqui para a frente: toda a mudança de forma passa a ter
migração numerada e testada.

Fica um risco por fechar: quando o carregamento é recusado por vir de revisão posterior, o
estado em memória não é tocado, mas nada impede que uma gravação seguinte com o mesmo
número de ocorrência sobreponha o registo mais recente. Trata-se com a correção 4.6,
exportação e importação da ocorrência.

## Achados de largura reduzida, resolvidos na r0016

Auditoria a 380, 480 e 768 px, nos sete separadores. Quinze ocorrências de transbordo, de
quatro causas distintas. Todas anteriores à r0015 — nenhuma era regressão.

| Onde | Causa |
|---|---|
| Cabeçalho, todos os separadores, 380 e 480 px | `.hbar` e `.hacts` com `flex-wrap:nowrap`. Guardar, Ocultar e o botão de tema saíam da margem e ficavam inalcançáveis |
| Plano de comunicações, 380 px | `.cm-f.nb`, com duas classes, tem especificidade maior do que a media query `.cm-f` que devia colapsar a grelha para uma coluna. A regra responsiva nunca chegava a aplicar-se |
| Estado das integrações, já a 768 px | O item flexível do cartão não encolhia, e as designações técnicas longas sem espaços alargavam-no para lá da margem |
| Meteograma, 380 px | O seletor de ficheiro CSV não cabia ao lado do rótulo e não quebrava |

## Achados na r0014, resolvidos na r0015

Verificados um a um. A r0014 é uma entrega feita e não se alterou: as correções entraram
na r0015.

| Linha | Achado | Natureza |
|---|---|---|
| 1713, 1737, 1748 | `\/` desnecessário dentro de classe de caracteres, em três expressões regulares iguais | Cosmético, sem efeito |
| 2023 | `leitura(p,a)` definida e nunca chamada | **Função perdida.** O comentário `/* leitura ponto-a-ponto */`, na linha 2161, encima o código que monta a legenda do meteograma sem a chamar. A interpretação operacional — abertura da janela, rotação, combustível fino disponível — não chega ao utilizador |
| 2077 | `corRH(rh)` definida e nunca chamada | **Código morto.** A humidade relativa passou a ser desenhada com `var(--madeira)` e faixas por limiar. O `corRH` devolve cores fixas em hexadecimal, que não respeitam os dois temas. Remover, não repor |

### Confirmado no código, sobre as correções propostas

- **Não existe versão do estado gravado.** O `migrarEstado` da linha 1430 não migra
  esquema nenhum: mapeia designações de estado de setor. A correção 4.1 mantém-se por
  fazer, na íntegra.
- **O `lerForm` confirma o problema descrito.** A linha 1302 reconstrói `O.meta` e
  preserva `distrito`, `concelho` e `distritoChave` à mão. Qualquer campo derivado
  acrescentado sem tocar nessa linha é apagado a cada leitura do formulário.
- **Os `catch(e){}` vazios do `escreverForm` são o mecanismo do silêncio.**
  `renderFormats`, `pintarRelevo` e `renderSetores` são chamados dentro de `try` com
  captura vazia. Foi isto que tornou a regressão de funções órfãs invisível em uso.

## Próximo passo

Nada do que aqui esteve ficou por fazer. O que se segue depende de terceiros ou de
decisão, e está listado a seguir.

1. **Confrontar o importador com uma exportação real da Gestão PCO.** Está feito e testado
   contra os documentos; falta o que a aplicação de origem produz de facto.
   `npm run validar-gp -- <ficheiro>` responde em segundos.
2. **A repartição por células está fechada** — feito na r0040. Não há ramo do estado nem
   módulo fora da célula a quem a lei atribui a matéria, e o mapa de posse não declara
   movimentos pendentes. O que se acrescentar daqui para a frente nasce já com célula, e
   `auditarPosse` e `auditarArrumacao` recusam o que não tiver.

## Trabalho em aberto

- Camada de análise determinística: consolidar Meteo, Topografia e Demografia. O módulo de
  Comportamento do Fogo está feito na r0026, com o que a fonte sustenta.
- Exportação do contexto da ocorrência e importação de proposta, com validação.
- Exportação do PEA em DOCX, com direção de texto na célula em vez de fusão vertical.
- Impressão do plano de comunicações em folha autónoma.

## Pontos por confirmar em fonte

Marcados como tal na interface, não devem ser dados como assentes:

1. Designação PC COM 1 a 5. As séries PC TAT (1-15) e PC MAN (1-30) estão confirmadas
   em fonte; o rótulo dos cinco canais de comando foi deduzido por coerência.
2. Séries de banda alta CT e CM. Só o manobra 4 (CM4) tem confirmação direta, na
   DON n.º 2.
3. Numeração da NEP n.º 8/NT/2010 para a banda alta de VHF, não verificada linha a linha.
4. Fatores de declive e de vento para os combustíveis nacionais, que permitiriam calcular
   a razão ε em vez de a pedir ao oficial. O artigo de Viegas remete-os para outras fontes.
   Ver `docs/FONTES.md`, secção `FOGO`.
5. **Composição das pastas sub-regionais do SIRESP**, e que concelhos pertencem a cada
   sub-região. A Estação traz o pacote do Douro Op, que é o do posto, e não sabe o de mais
   nenhuma sub-região. Enquanto não houver fonte — a programação dos terminais, ou a NEP
   que a fixa —, a aplicação pergunta a sub-região do TO em vez de a deduzir, e diz quando
   o pacote carregado não serve o teatro. Não se inscrevem aqui listas de sub-regiões
   obtidas por outra via: uma pasta de rádio afirmada sem fonte é pior do que um campo
   por preencher.

## Registo de revisões

Por número de revisão, que é a ordem de entrega. **Há dois números atribuídos duas vezes**,
por duas linhagens terem corrido em paralelo sobre a mesma base: distinguem-se pelo
carimbo de hora no nome do ficheiro. Ficam ambas, porque ambas foram entregues, e as duas
estão fundidas na linha principal.

E há **um número atribuído a quatro entregas**, que não tem justificação nenhuma: a r0028.
Quatro alterações distintas foram entregues em ficheiros sucessivos, e em vez de
incrementar o número apaguei o ficheiro e remontei o mesmo, mudando-lhe só o carimbo. A
convenção diz que a revisão incrementa a cada entrega; a numeração devia ir na r0031. O
que se perdeu foi a correspondência entre um número e uma alteração — os quatro passos
ficam legíveis nos commits `91a9809`, `571db93`, `4f11ed9` e `1feb710`, e mais em lado
nenhum. Fica assim, porque a r0028 já foi entregue e reescrever a numeração de entregas
feitas seria pior. **Daqui para a frente, uma entrega, um número:** montagens
intermédias de trabalho não saem do computador e não contam.

| Revisão | Carimbo | Linhagem | Alterações |
|---|---|---|---|
| r0014 | 272208 | — | Primeira revisão colocada no repositório. Estado como recebida, sem alterações |
| r0015 | 280117 | — | Reposta a chamada a `leitura()` na legenda do meteograma; removida `corRH()`, código morto; corrigido escape desnecessário em três expressões regulares |
| r0016 | 281214 | — | Largura reduzida: quebra de linha no cabeçalho; media query do plano de comunicações a vencer `.cm-f.nb`; cartões de integrações a encolher; seletor de CSV a quebrar |
| r0017 | 281258 | — | Correção 4.1: versão do estado gravado, cadeia de migrações, recusa de estado de revisão posterior |
| r0018 | 281304 | — | Correção 4.2: cada campo escreve no seu lugar do estado por `data-campo`; `lerForm` deixa de reconstruir `O.meta` |
| r0019 | 281315 | — | Correção 4.4: relógio injetado; as regras de prazo recebem o instante e passam a ter teste |
| r0020 | 281319 | — | Correção 4.3: motor de conformidade em registo de doze regras autónomas; `FONTES.md` e auditoria mecânica das citações |
| r0021 | 281326 | — | Correção 4.5: cache de pedidos idênticos, resposta imediata sem ligação, motivo de falha legível, prazo na chamada ao modelo |
| r0022 | 281330 | — | Correção 4.6: exportação e importação da ocorrência em JSON, independentes do armazenamento |
| r0023 | 281344 | esta | Camada 1: tipos em `.d.ts` com anotações na aplicação; sete defeitos reais expostos e corrigidos |
| r0023 | 281530 | paralela | Repartição do PEA pelas células, núcleos do PCO, estado na versão 2 e adaptador de modelo com três modos |
| r0024 | 281350 | esta | Camada 2: primeira entrega produzida pela montagem a partir de `fonte/` |
| r0024 | 281600 | paralela | Etiquetas de célula na impressão do PEA: segurança e prioridades passam a Planeamento |
| r0025 | 281404 | — | Fusão das duas linhagens r0023, montada a partir de `fonte/` |
| r0026 | 281414 | — | Comportamento do fogo: composição vetorial de declive e vento segundo Viegas (2004); estado na versão 3 |
| r0027 | 281451 | — | Importação da Gestão PCO contra a especificação, com exemplos de referência e validador |
| r0028 | 281657 | — | **Quatro entregas com o mesmo número, por erro meu de numeração.** Fusão do r0024 paralelo; importador a ler os três envelopes com a v1.1 a governar; diferencial ao nível do setor com as perdas assinaladas; funções do PCO fundidas em vez de substituídas; instantes ISO opcionais no caminho da v1.1; briefing de passagem de comando; documentação arrumada por natureza |
| r0029 | 281713 | esta | Especificação v1.2: instantes em GDH ou ISO no mesmo campo, bloco `pco` e ponto de trânsito no envelope da especificação, estimativa de empenhamento assinalada; exemplo e validação da v1.2 |
| r0030 a r0033 | — | paralela | Produzidas do outro lado sobre a r0028 de 15h23, e não montadas aqui. `p0003` passagem de turno e estado na versão 4; `p0004` os dois instantes da nomeação externa; `p0005` posse do estado por célula |
| r0032 | 281900 | paralela | A entrega que chegou em ficheiro, e a base da fusão. O rodapé lá dentro diz `r0031`: numeração do outro lado, registada como veio |
| r0034 | 281800 | esta | Fusão da terceira linhagem paralela. Passagem de turno, posse do estado por célula, os dois instantes da nomeação externa no importador; correção da fusão de funções, que apagava com vazio o que estava registado |
| r0035 | 282010 | paralela | `O.logistica` com reserva, zona de apoio e ponto de trânsito; estado na versão 5. Resolve a conflação de `dados.est` |
| r0036 | 282100 | paralela | Interface organizada por célula: um separador por célula do PCO, registo `ARRUMACAO` e auditoria |
| r0037 | 282200 | paralela | JavaScript reagrupado por célula. Só ordem e cabeçalhos; nenhum byte de conteúdo mudou |
| r0038 | 282230 | paralela | Cor por célula nos separadores, estendendo a convenção que já existia no PEA impresso |
| r0039 | 282255 | — | Fonte repartida por célula em sete zonas. Ponto de trânsito religado ao ramo da logística, que o formulário tinha deixado para trás; `auditarArrumacao` passa a acender aviso; código morto do movimento da logística removido |
| r0040 | 282334 | — | Plano de comunicações passa para `logistica.comunicacoes`, estado na versão 6, com `canaisObj()` como acessor único; a importação da Gestão PCO vai para Operações e a posse do estado para o núcleo |
| r0048 | 291238 | — | Cada meio é uma unidade, com origem e relógio próprios, e medidor de tempo por unidade; estado na versão 10. Léxico da evolução de 41 para 78 frases, em oito grupos |
| r0047 | 291220 | — | Avisos que se podem fechar: o ataque ampliado fecha com o PEA emitido depois do limiar; a notificação das duas horas e a proposta de PMEPC declaram-se cumpridas com GDH e autor. Estado na versão 9 |
| r0046 | 291215 | — | Pasta sub-regional corrigida para «Douro Op» e deixa de estar fixa no código: a ocorrência declara a sua, e os canais sub-regionais só se aplicam quando batem. Estado na versão 8 |
| r0045 | 291143 | — | Catálogo de elementos do TO, fora da ocorrência e sem canal: guardar, procurar, recolher desta ocorrência e levar ao formulário do PCO |
| r0044 | 291139 | — | Encerramento do registo da ocorrência: carimbo, fecho à escrita e reabertura, com as reservas no registo de evolução. Estado na versão 7 |
| r0043 | 291129 | — | Análise da repartição dos meios pelos setores, que compara setores entre si e propõe destino; frases-tipo passam a propor a mudança de estado do setor, por caminho único |
| r0042 | 291109 | — | Rótulo comprido deixa de desalinhar o campo, e a grelha deixa de o permitir; caixas de aviso com três pesos visuais; cartão das integrações posto a par do que já está feito |
| r0041 | 282352 | — | Ajuda no ecrã recuperada: um bloco por separador, dentro do painel da célula, declarado em `AJUDAS` e auditado. Sete dos oito estavam presos em painéis escondidos desde a arrumação por célula |
