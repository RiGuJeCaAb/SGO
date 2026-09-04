# Estado do projeto

Atualizado em 2026-09-04.

## Situação atual

A revisão em vigor é a **r0095**, montada a partir de `fonte/`. **As duas linhagens
convergiram:** a r0035 foi construída sobre a r0034 desta linhagem, e daí em diante há uma
história só. Desde 2 de setembro a divisão de trabalho é por tipo e não por turnos: **as
alterações à aplicação fazem-se aqui**, e os ramos entregam revisão adversária, testes e
doutrina — ver `docs/CSREPCDouro_202609021600_d_RespostaAosRamos_CLD.md`.

**A repartição por células está completa.** Todos os ramos do estado estão na célula a
quem a lei atribui a matéria, e o mapa de posse não declara um único movimento pendente.

| | |
|---|---|
| Entregas em `app/` | 133, das anteriores à convenção de nomes até à r0095 |
| Módulos em `fonte/` | 72, em sete zonas, mais o molde |
| Testes | 911, todos a passar |
| Análise estática | sem problemas |
| Tipos | 25 diagnósticos, nenhum novo face à linha de base |
| Auditoria visual | sem transbordo nem exceções, 380/480/768/1440 px, nos dois temas |
| Versão do estado gravado | 26 |
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

## Avisos do IPMA, na r0083 — três afirmações que a aplicação não podia fazer

Os três defeitos são da mesma família: o painel afirmava mais do que sabia, e afirmava-o
com o mesmo ar de certeza com que afirmava o que sabia bem.

**Primeiro, o distrito.** O módulo escolhia o distrito cujo ponto de referência do IPMA
estava mais perto da ocorrência. Esse ponto é o da capital de distrito, e a capital mais
próxima não é o distrito: Moimenta da Beira é de Viseu e fica a cerca de 35 km de Vila Real
e a 45 km de Viseu, pelo que a aplicação mostrava os avisos de Vila Real — sem o dizer.
E fazia-o **tendo o distrito certo à mão**: `meta.distrito` já é determinado por
geocodificação inversa desde a r0032, e o módulo ignorava-o. Agora é esse que vale, e a
proximidade é o recurso de último caso, marcada no ecrã como presumida.

**Segundo, «em vigor».** O filtro era `endTime >= agora` e não olhava para o `startTime`.
Um aviso vermelho que começava no dia seguinte aparecia como estando a decorrer. Passam a
distinguir-se três prateleiras: em vigor, previsto, e por confirmar.

**Terceiro, a hora — e este não se corrigiu, delimitou-se.** As marcas do IPMA vêm sem
designador de fuso (`2026-09-02T18:00:00`), e `new Date` sobre uma marca dessas lê hora
local. **Não há fonte consultável que diga qual é a convenção do serviço**, e a
`api.ipma.pt` não é alcançável do ambiente onde esta revisão foi construída — comprovado,
`403` no CONNECT do proxy. Escolher UTC seria inventar uma hora tão certa quanto a que lá
estava. Por isso:

- as horas mostram-se **como o serviço as publica, sem conversão** — a única coisa que se
  sabe ao certo são os algarismos;
- o instante de cada marca é tratado como um **intervalo entre as duas leituras
  possíveis**, e um aviso cuja fronteira caia dentro desse intervalo sai como «por
  confirmar» em vez de ser dado por findo ou por vigente;
- se um dia o serviço passar a declarar designador, o intervalo colapsa num ponto e tudo
  degrada para o comportamento exato **sem uma linha de código a mudar**.

**Fica por fazer, e depende de quem tem rede:** confirmar num posto do CSREPC se as marcas
de `warnings_www.json` trazem designador e, se não trouxerem, qual a convenção. É o mesmo
bloco de verificação da secção 5 do `POREXECUTAR.md` e resolve-se com um pedido.

**E ficou uma verificação nova.** O `npm run manual` lia só o HTML estático, e por isso não
via os rótulos que um módulo escreve depois de a aplicação correr — o painel dos avisos
nasce vazio. Passa a haver `RENDIDOS` em `ferramentas/manual.mjs`: cada rótulo desses
declara em que módulo é escrito, e o texto tem de lá estar tal e qual. Provado a renomear
um botão: a verificação falha, com código de saída 1.

## O que estava na entrada, e o home.html da raiz

**A entrada esvaziou-se.** O que lá estava a 2 de setembro às 15h32 era
`CSREPCDouro_r0081_202609021450_EstacaoPEA_CLD.html` — **byte a byte a mesma entrega** que
já estava arrumada em `app/`, confirmado por SHA-256. Não havia nada para arrumar e nada se
perdeu: apagou-se a cópia.

**A cópia da raiz fica, e passa a ser gerada.** Foi carregada à mão no mesmo minuto, como
`index.html`, e é a cópia que o GitHub serve — intenção legítima, e a única forma de abrir a
Estação a partir de um endereço. Mas uma cópia à mão envelhece: aquela servia a r0081 no
momento em que a r0083 estava montada, e nada no repositório o denunciava.

Passa a ser reescrita por `npm run montar`, sempre que a entrega vai para `app/` — uma
montagem de trabalho com `--saida` não lhe toca. E há um teste que confere que é igual à
entrega mais recente, byte a byte, provado a acrescentar um comentário ao ficheiro. **Não se
edita à mão**, tal como as entregas de `app/`.

**Chama-se `home.html` desde 4 de setembro.** O dono do repositório apagou o `index.html`
do `main` num commit explícito e carregou `home.html` no lugar dele, com a r0092. A
montagem e o teste seguem o nome dele: o ficheiro que a montagem escreve é `SERVIDO`, em
`ferramentas/montar.mjs`, e o teste lê o nome de lá para não voltarem a divergir. Foi a
resolução do conflito entre o `main` e o ramo desta linhagem — o Git juntou as duas
histórias por deteção de renomeação, e o `home.html` ficou com a r0095.

**A entrada esvaziou-se outra vez, a 4 de setembro.** Chegaram ao `main` onze PDF — as
quatro DON, as ferramentas de gestão do SGO, o Rothermel (1972) e a sua ficha bibliográfica,
os dois Andrews (2012 e 2018) e o guia de modelos de combustível de 2021 — no mesmo dia em
que o ramo desta linhagem os arrumava em `docs/fontes/` a partir de outra cópia. Conferido
por SHA-256: **os onze são byte a byte os que já estavam catalogados em `docs/FONTES.md`**,
com o nome da pasta de destino. Não havia nada para arrumar: apagaram-se as cópias.

Da conferência saiu um duplicado dentro de `docs/fontes/`: o guia de 2021 estava lá duas
vezes, com dois nomes, igual byte a byte. Ficou o nome de 2 de setembro, que é o que a
`FOGOPT` cita, e a linha do catálogo que apontava para o outro passou a apontar para ele.

## As fases do PCO, na r0084 — e um número com a proveniência de outro

O ramo #006 verificou contra o articulado as cinco divergências de fase que a leitura do
`d01` tinha levantado, e devolveu um guião que corria vermelho contra a r0083. **Nenhuma
das cinco estava certa no código.** Foram corrigidas, e cada número passa a levar ao lado
a alínea que o sustenta — `aLei`, obrigatório, com um teste que o exige.

Duas erravam no sentido perigoso: o adjunto de segurança é exigível na fase II, art. 41.º,
n.º 2, al. b), e a aplicação só o dava por exigível na III. Numa fase II não assinalava a
falta de quem tem a autoridade do art. 36.º, n.º 2, para mandar cessar os trabalhos.

**Mas o achado que interessa é outro, e veio de ler o bloco todo em vez da lista de cinco.**
Nove núcleos levavam um número de fase sem fonte normativa nenhuma — a lei não fixa fase
para a ativação dos núcleos, que é competência do oficial da célula em função das
necessidades. E esses números viviam no mesmo campo, passavam pelo mesmo comparador e saíam
no ecrã com a mesma etiqueta «Essencial — exigível agora» e a mesma cor que as exigências do
art. 14.º, com um campo de referência a citar um artigo que nada diz sobre fases.

**Um número sem proveniência é mau; com a proveniência de outro número é pior, porque
parece tê-la.** Um COS a olhar para o ecrã não conseguia distinguir o que a lei impõe agora
do que nós achamos prudente agora — e é essa distinção que o projeto inteiro existe para
manter.

O campo separou-se em dois: `faseLei`, com a alínea obrigatória, e `faseSug`, que assume ser
prática do posto. `funcoesExigiveis()` estreitou-se à lei, e é a fronteira que alimenta
pendências, briefing, passagem de turno e conformidade — quatro sítios onde «em falta»
passa a querer dizer «a lei pede e não está lá». A lista de nomeação ganhou uma quarta
prateleira, «Sugerida pela prática — sem imposição legal nesta fase». Mesmo tratamento nos
limiares de meios: os do art. 20.º, n.os 6 e 7, ficam como lei; os de OPAR, COPESP e OPESP
são analogia com a regra aérea e passam a sugestão.

**O que fica por resolver.** Os valores de `faseSug` são os que lá estavam: deixaram de
mentir sobre a proveniência, não deixaram de ser palpites por confirmar. E o Despacho não
está em `docs/fontes/` — toda a citação do articulado nesta matéria assenta na transcrição
do ramo #006, que é revisão por terceiro e não leitura primária.

**Uma lição de contrato, e é do ramo #004.** O guião do #006 lê o literal `FUNCOES_PCO` de
dentro da entrega compilada. A separação do campo renomeou `fase` e o guião passou a
devolver sete divergências falsas. Corrigido esse nome, corre verde. O contrato é o ficheiro
compilado, mas um guião que alcança um literal lá dentro depende do nome do campo — **um
nome que muda tem de ser anunciado ao ramo que o lê.**

## Folhas de carta calibradas, na r0085 — a última absorção

**O `p0018` foi absorvido, e não foi traduzido.** Foi essa a decisão de 2 de setembro, depois
de três traduções terem produzido três defeitos: o ramo #002 entregou 53 asserções que dizem
o que tem de ser verdade sem dizerem como implementar, e implementou-se até ficarem verdes.
Contra a r0084 davam 10 verdes e 44 vermelhas; contra a r0085 dão 54 verdes e saída 0.

Uma imagem de carta — a fotografia da folha na parede do PCO, um recorte de PDF, uma captura
da carta de perigosidade — coloca-se agora no terreno por ficheiro de referenciação ou por
dois pontos de controlo, e o mapa desenha o traçado por cima dela. Loja `folhas` na base,
aditiva. **O que se guarda é a colocação e não a imagem:** a imagem pesa megabytes e o pacote
da ocorrência viaja por ficheiro de texto.

**Duas coisas que as 53 asserções não podiam apanhar, e que se apanharam a implementar.**

A primeira foi minha e o guião não a via: a resolução da semelhança de dois pontos saiu com
os sinais trocados nos dois termos, e o ponto de controlo 2 recolocava-se dez quilómetros ao
lado. Foram as asserções C05, C07 e C10 que a denunciaram — o ponto 1 recolocava-se bem, que
é o que uma verificação distraída teria olhado.

A segunda o guião não podia ver, porque para de propósito na fronteira da superfície pública:
**o desenho**. A folha vai da imagem ao terreno pelos seis coeficientes, e do terreno ao ecrã
pela grelha; nenhuma das 53 asserções atravessa a segunda metade. Uma folha bem calibrada
podia ser desenhada de pernas para o ar sem que nada se queixasse. `tests/folhas-calibradas.test.mjs`
confronta a matriz que o SVG recebe com o caminho longo — projetar cada pixel e converter — e
exige que concordem **a menos de um milímetro no terreno**, e não a menos de um pixel: um
pixel vale 15 cm no nível 14 e 150 m no nível 4, e a mesma tolerância em pixéis significaria
coisas mil vezes diferentes conforme a ampliação. Provado a inverter o sinal do eixo Norte:
os dois testes ficam vermelhos.

E uma terceira, que só apareceu ao pôr a folha num navegador a sério: **uma folha sozinha não
abria o mapa.** O enquadramento não conhecia folhas, e quem colocasse uma continuava a ver o
mapa a dizer que não havia nada para mostrar — a mesma armadilha fechada sobre si mesma que o
ponto da ocorrência já tinha tido. Os quatro cantos de cada folha entram agora no
enquadramento. Prova em `docs/qa/`, `qa0030`.

**Nota sobre a proveniência das 53.** Não são as do `t0018`, que está no ramo #004 e nunca
chegou aqui; o ramo #002 reconstruiu-as do comportamento descrito. Se as originais
aparecerem, correm-se as duas — onde divergirem, é a especificação que está mal escrita.

## Duas especificações escritas às cegas, e o que elas provaram — r0086

O ramo #001 entregou uma segunda especificação das folhas calibradas, escrita em separado da
do ramo #002 e sem que nenhum dos dois visse o trabalho do outro. Também 53 asserções, o que
foi coincidência e não confirmação — o próprio ramo o diz.

**As duas concordam.** Com os nomes do contrato adaptados à superfície que a r0085 já
implementava — que é o que o bloco `CONTRATO` daquele guião existe para permitir —, 51 das
53 passam, e as duas que faltam verificam a existência de um nome e não um comportamento.
Toda a leitura do ficheiro de referenciação, toda a recolocação por dois pontos, toda a
admissão de folhas: verde nas duas. Duas pessoas escreveram em separado o que uma folha
calibrada tem de fazer, e a implementação satisfaz as duas.

**O grupo A é o achado maior, e não é sobre folhas.** Confronta a projeção PT-TM06 com o
**PROJ 3.7.2** em cinco pontos calculados sobre a definição EPSG:3763, e passa nos 16. É a
única verificação desta aritmética contra uma implementação de referência que este projeto
tem: o PROJ não é alcançável do ambiente onde as revisões se constroem, e até aqui a projeção
só se confrontava consigo própria pela ida e volta — **que fecha na mesma se as duas metades
estiverem erradas do mesmo modo.** Os cinco pontos estão agora em `tests/mapa.test.mjs`.

**Entrou o que faltava:** `folhaAfericao`, com a regra que o ramo #001 impôs e que estava
certa — não haver aferição tem de se distinguir de haver uma má, e por isso a ausência é
`null` e nunca zero ou NaN. Uma folha guarda agora também os dois pontos de controlo que a
fixaram, e não só a contagem: são eles que permitem duvidar da colocação.

### E um erro meu, que o teste apanhou por eu ter escrito o teste primeiro

Anunciei o confronto entre a escala plana e a distância esférica como quem **confere as
coordenadas escritas à mão**. Não confere, e o teste que escrevi para o provar falhou —
corretamente. Numa folha fixada por dois pontos, a escala é *definida* por esses dois
pontos: `mpp·dpx` é identicamente a distância entre eles. O que sobra é a diferença entre o
plano e a esfera, e essa quase não mexe com o erro. **Comprovado: um erro de 40 km no Este
de um controlo leva o desvio de 0,19 % a 0,25 %, e passa.**

O que a conta apanha é a fundação — se `paraTM06`, `deTM06` ou `distanciaM` se partirem, os
dois modelos deixam de concordar. É só isso que promete agora, no código, na mensagem do
ecrã e num teste que **exige que o erro de 40 km passe**, para que ninguém volte a anunciar
o que a conta não faz.

É a terceira vez esta semana que uma asserção certifica menos do que o seu nome dizia: o meu
tecto de matos validado contra fonte de floresta, o `E7` do ramo #001 a verificar a própria
fixture, e agora esta. As três foram apanhadas, e nenhuma por leitura.

## Os números que sobravam, tirados — r0087

A separação `faseLei`/`faseSug` da r0084 pôs aos nove núcleos a etiqueta certa e deixou-lhes
o número errado. O ramo #006 fez o trabalho que faltava: foi procurar a fonte nas três
oficiais do projeto e não a encontrou em nenhuma.

O Despacho não indexa ativação de núcleos a fases — arts. 16.º, n.º 3, 26.º, n.º 4 e 31.º,
n.º 3 entregam-na ao oficial da célula «em função da natureza da ocorrência e das
necessidades». O documento de ferramentas do SGO não tem **uma única ocorrência da palavra
«fase»**. E a DON n.º 2 fecha o círculo: define a EPCO como capacitada para prover células e
núcleos «de acordo com o previsto no SGO para a fase aplicável», e remete assim para um
diploma que nada prevê.

**Oito dos nove sem fonte nenhuma. O nono com gatilho, e o gatilho não é uma fase.**

O argumento do ramo é o que decidiu: um `faseSug` sem fonte continua a ser um palpite, só
que agora com etiqueta de palpite — melhor do que estava, e ainda a ordenar um ecrã. Os
números saíram. O que ficou é uma regra só, com uma fonte só: **um núcleo é de uma célula, e
não há célula antes de haver posto de comando** — art. 13.º, n.º 2, que o instala a partir
da fase II.

O núcleo de especialistas ganhou o gatilho que tem mesmo: a DON n.º 2, pontos 7.d.(25)(d) e
7.d.(27), liga a sua ativação ao aumento da capacidade de comando e controlo, que é o sinal
que a regra de conformidade da fase já media. `excedeReferenciaDaFase()` passou a viver num
sítio só, junto de `FASES_SGO`, e é lido pelos dois — a regra que avisa e a lista que sugere
não podem discordar sobre o que é exceder.

### A regressão que a separação tornou possível

O ramo #006 nomeou-a e tem razão: uma das sete funções do art. 14.º perder o `faseLei` passa
de exigência legal a palpite, sai de `funcoesExigiveis()` e **deixa de alimentar as
pendências, o briefing, a passagem de turno e a conformidade** — sem que nada o assinale. É
a regressão mais perigosa deste bloco e é silenciosa por construção. Há teste, e prende o
efeito e não o campo, que é o que magoa.

### E uma lição sobre testes, que era minha e ficou por aprender

Eu tinha proposto ao ramo a alteração de uma linha — trocar `fase` por `faseLei` no guião.
O ramo recusou, e a razão é a metade da lição que eu não tinha visto: o problema não foi só
o campo mudar de nome, foi **o guião ter reportado a mudança de nome como sete divergências
doutrinárias**. Sete `undefined` com forma de achado sobre a lei.

Isso é pior do que falhar: é ruído com aparência de sinal, e é assim que se treina quem lê a
ignorar testes vermelhos. Na v2, contrato quebrado sai com código 2 e a frase «nenhuma
conclusão doutrinária foi tirada»; divergência doutrinária sai com 1. São coisas diferentes
e passam a ler-se como tal.

## A montagem passou a ter verificação própria — o achado do ramo #005

Ficou por responder dois dias, e era o mais importante dos cinco: **a montagem é o
componente de maior risco do sistema e era o que tinha menos verificação própria.** É a peça
que transforma módulos corretos num ficheiro que arranca num PCO às três da manhã.

O teste da reprodução byte a byte não chegava, e a razão é subtil ao ponto de eu não a ter
visto: monta a partir de `lerModulos()` e compara com uma entrega montada a partir de
`lerModulos()`. **Um módulo que o leitor deixe cair é deixado cair dos dois lados**, os bytes
batem, e o teste passa sobre uma entrega a que falta código.

E o leitor deixa cair: `lerModulos` percorre uma camada de pastas e apanha `.js`. Um módulo
numa subpasta de zona, ou com extensão `.mjs`, sai sem uma palavra. Não é hipótese
académica — é como um módulo se perde numa reorganização.

Dois testes novos confrontam a entrega **com o disco** e não com a lista que a própria
montagem produziu. Provado a esconder um módulo numa subpasta e a renomear outro para
`.mjs`: vermelho nos dois casos.

O terceiro pedido do #005 — que a aplicação arranque de `file://` sem exceções na consola —
já estava coberto: `npm run visual` escuta `pageerror` a quatro larguras e nos dois temas.

## As missões com identidade, e as genéricas que saem — r0089

Duas coisas ficaram por fazer quando as missões se alinharam com as propostas, e são as duas
metades do mesmo trabalho.

**A primeira: as missões continuavam identificadas pela posição.** M1, M2, M3 — que é
exatamente o defeito corrigido nas propostas e deixado por corrigir aqui. Uma missão
condicional — a rotação, os meios aéreos, o ponto de trânsito — aparece e desaparece
conforme o dispositivo, e a entrada de uma empurrava todas as seguintes para outra
identidade. A M4 do PEA n.º 4 não era a M4 do n.º 5, e a resposta a «cumprimos aquilo?»
apontava para outra coisa. Cada missão declara agora a sua chave; `ord` continua posicional,
porque é o que se lê no papel.

**A segunda: as genéricas não se retiravam.** Um plano com sete prioridades em que duas
dizem o mesmo por palavras diferentes não é mais completo — é mais difícil de executar, e
quem o lê às três da manhã tem de decidir qual manda. Pior quando a genérica **contradiz** a
específica, que é o caso dos dois pares declarados em `SUBSTITUICOES`:

- «Postura defensiva fora da janela» diz, por contraste, que dentro da janela a postura não
  é defensiva. Com a cabeça interdita acima dos 4 000 kW/m isso é falso a qualquer hora, e a
  genérica enfraquecia a interdição em vez de a acompanhar.
- «Rendições faseadas no início e fecho da janela» é a cadência normal. Havendo equipas com
  o tempo já vencido, é mandar manter no terreno quem devia ter saído.

**A retirada não é silenciosa, e essa é a parte que importa.** Uma proposta que desaparece
sem rasto é indistinguível de uma que ninguém pensou, e o plano passaria a dizer menos do
que sabe. O que sai fica em `retiradas` e é escrito no documento com a específica que a
substituiu e o porquê — que é auditado, para isto não virar um sítio onde se apaga uma
proposta incómoda com aparência de método.

Três cuidados que os testes prendem: a numeração refaz-se **depois** da retirada, ou o papel
saltava de P2 para P4; a lista de segurança **não** perde a regra do ataque descendente que
a genérica também dizia; e a proposta das vigias encolhe em vez de sair, porque as vigias e
a cadência de pontos de situação não dependem das rendições.

E uma correção que não é de arrumação: a missão dos aglomerados **passa a nomeá-los**. Uma
ação que manda defender «os aglomerados expostos» sem nomear nenhum não é uma ação
específica — art. 46.º, n.º 1 — e passa por cumprida sem nunca o ter sido. Não havendo
nenhum registado, diz isso e manda reconhecê-los.

### Um teste que prendia o defeito

`tests/identidade-das-propostas.test.mjs` fixava a chave das missões em «M1,M2». Estava a
prender exatamente o que havia a corrigir. Foi reescrito para separar o que sobrevive — `ord`
posicional — do que mudou, e não apagado: um teste que fixa uma frase obsoleta é um sinal, e
apagá-lo perde-o.

## Metros da projeção não são metros do terreno — r0090

**O achado mais grave que chegou dos ramos, e é do #004.** O Web Mercator não preserva
escala: a 41° N o metro da projeção vale 1/cos(41°) do metro do terreno. A `folhaAfericao`
devolvia a raiz do determinante e chamava-lhe m/px sem mais, pelo que uma folha em Mercator
declarada a 25 m/px era anunciada como tal quando os seus pixéis cobrem **18,8 m**.

Reproduzido antes de corrigir: **32,7 % de inflação**, contra os 33,1 % que o ramo mediu —
a mesma coisa, à latitude de ensaio. Quem medisse uma distância de segurança por cima de uma
folha dessas errava um terço, e **para menos**, que é o sentido perigoso.

A aferição devolve agora os metros de terreno em `mpp`, os da projeção em `mppProj`, o fator
de escala e a latitude a que vale — porque o fator varia ao longo da folha e um número único
só é honesto se disser onde se aplica. Em PT-TM06 nada se corrige: é Transversa de Mercator
com fator 1 no meridiano central, e corrigir seria introduzir erro para tapar um que não
existe.

## O limiar dos núcleos parava no posto e devia parar na célula — r0090

Também do #004, e é a segunda metade do meu próprio raciocínio. A r0087 disse «um núcleo é
de uma célula, e não há célula antes de haver posto de comando» e pôs os nove na fase II. Mas
**as células não nascem todas ao mesmo tempo**: o art. 41.º, n.º 2, al. b) instala o PCO na
fase II integrando só a célula de operações, e é o art. 42.º, n.º 2, al. b) que lhe
acrescenta as de planeamento e de logística e finanças, na fase III.

A aplicação sugeria, numa ocorrência em fase II, nomear o Núcleo de Informações e o Núcleo de
Finanças — de células que ainda não existem, e cujo oficial competente para os ativar ainda
não foi nomeado. **Fonte certa, âmbito errado**, que é o mesmo padrão que a r0087 tinha
acabado de corrigir.

O limiar deriva agora de `FASE_DA_CELULA`, com a alínea declarada por célula, e do campo `g:`
que já lá estava. Confirmado contra o Despacho, que desde 2 de setembro está no repositório.

**E o gatilho do núcleo de especialistas passou a distinguir alguma coisa.** Estava a
devolver `s`, que é o que a célula dele já lhe dava — o campo não fazia diferença nenhuma.
Com o efetivo a exceder a referência há norma a apontar para ele, e por isso sobe a `r`: não
é lei do SGO e não sobe a `e`; é doutrina que vincula o DECIR e não fica em `s`.

**Duas correções de citação**, ambas dos ramos: o `r:` do núcleo de especialistas dizia
`7.e.(27)` e é `7.d.(27)` — o ponto (27) está na secção dos Teatros de Operações. E a fonte
do limiar é o `7.d.(25)(d)`, que o #006 identificou como melhor do que a que eu tinha citado:
«o número de meios humanos e materiais mobilizados ou a mobilizar ultrapasse a capacidade de
comando e controlo implementada» é substancialmente o `excedeReferenciaDaFase()`.

**Fica em dívida a verificação primária destas duas.** A DON n.º 2 não está em
`docs/fontes/` — só o Despacho está. As correções assentam na leitura do ramo #006, e isso é
revisão por terceiro, como o `POREXECUTAR` já regista para o articulado antes de 2 de
setembro.

## A DON n.º 2 no repositório, e as vinte e quatro citações conferidas — r0091

Chegou a 4 de setembro, com as outras três DON e o documento de ferramentas do SGO. Com ela
cai a última dependência de revisão por terceiro na doutrina que a aplicação cita.

**As vinte e quatro citações da DON n.º 2 foram localizadas uma a uma no texto** e estão
todas certas — a tabela com o que cada ponto diz está em `docs/FONTES.md`. A secção de topo é
`7. EXECUÇÃO`, e dentro de `7.e` o ponto `(4)` é o Ataque Inicial e o `(5)` é o Ataque
Ampliado, o que é a chave de metade das confusões possíveis.

**Uma estava errada, e o ramo #006 tinha razão:** o núcleo de especialistas era citado como
`7.e.(27)`, e o ponto (27) está em `7.d`. Aparecia em dois sítios — a estrutura do PCO,
corrigida na r0090, e a passagem de turno, que passou despercebida e ficou corrigida aqui.

### E uma correção proposta que estava ela própria errada

O ramo #006 propôs que o POSIT passasse de `8.d.(5)(o)` a `7.e.(5)(o)`. A primeira metade
está certa — a secção é 7 e não 8. A segunda não: **o POSIT com periodicidade horária está no
ponto (4)**, o Ataque Inicial, que é o que a aplicação já citava. O ponto (5) é o Ataque
Ampliado e tem uma referência diferente ao POSIT, na alínea (t), para inserção no SADO.

Aceitar a correção teria introduzido o defeito que ela vinha corrigir. Não é reparo ao ramo,
que fez o trabalho certo e o assumiu como erro seu — é a demonstração de por que razão a
verificação tem de passar pela fonte e não pela palavra de quem a leu, mesmo quando quem leu
está a corrigir-nos.

### A guarda que impede a próxima

`tests/fontes.test.mjs` varre a entrega inteira — e não só o registo de conformidade, porque
as citações vivem espalhadas pelos módulos — e recusa qualquer ponto da DON que não conste da
lista conferida. E recusa o inverso: um ponto que fique na lista e já ninguém cite dá a
entender que a aplicação o invoca. Provado a repor o `7.e.(27)` e a inventar um `7.d.(99)`.

## A repintura das folhas e o meio pixel — r0092

**A repintura, do ramo #005, e a medição deles é que fez o caso.** A folha entrava no mapa
embutida: a data URL — 4 a 8 MB numa folha digitalizada — era copiada para dentro do SVG a
cada `pintarMapa()`. Mediram 103 ms no `innerHTML` da segunda repintura com três folhas, numa
máquina de servidor, e estimaram 300 a 500 ms num posto modesto. E o custo era **por
repintura**: a segunda custava mais do que a primeira.

Passou a entrar por referência, `URL.createObjectURL`. Medido aqui, com três folhas de
4000×3000:

| | Antes (medido pelo #005) | Agora |
|---|---|---|
| SVG entregue ao analisador | 7,8 MB | **2,7 KB** |
| Segunda repintura | 103 ms | **4,4 ms** |

O custo passou a ser uma vez, na descodificação, em vez de a cada desenho. A URL é revogada
em `retirarFolha`, ou a memória ficava presa até o separador fechar.

**E o `esc()` fica.** Aviso do #005, e é o certo: sobre base64 não altera um carácter e é
varrimento puro, mas `accept="image/*"` deixa passar `image/svg+xml`, cuja data URL tem `<`
a sério. Tira-se a repetição, não a defesa. Há teste que o exige.

### O meio pixel, do ramo #001, e a ironia dele

O `<image>` do SVG tem origem no **canto** da imagem: o pixel 0 ocupa o quadrado [0,1]×[0,1]
e o seu centro está em (0,5, 0,5). Mas a matriz é construída a partir de `C` e `F`, que
designam o **centro** do pixel superior esquerdo — a convenção do ficheiro de referenciação,
que `lerFicheiroReferenciacao` lê certa. O local (0,0) ia parar onde devia estar o local
(0,5, 0,5), e a folha ficava meio pixel fora: 12,5 m a 25 m/px.

A ironia é do próprio ramo: a asserção B9 do guião deles existe para garantir essa convenção,
passa — e o desenho reintroduzia o erro que ela previne. **O módulo lia por uma convenção e
desenhava pela outra**, que é a diferença entre o GDAL e o world file.

Não é grande — 0,5 mm no papel de uma 1:25 000 — mas é sistemático, tem sinal, e soma-se a
qualquer outra fonte de erro em vez de cancelar.

## A projeção deixa de ser decidida por um índice, e o mínimo do navegador declara-se — r0093

**`FOLHAS[0]` era política, e um índice fixo a decidir política é frágil por construção.** O
ramo #001 tirou-lhe três consequências, e todas eram más: uma segunda folha noutra projeção
entrava, aparecia na lista com escala e proveniência, gravava-se na base **e nunca se
desenhava**, sem uma palavra; duas folhas pela ordem trocada davam mapas diferentes; e
retirar a primeira reprojetava o mapa inteiro, mudando a posição aparente das frentes, dos
setores e dos meios — uma operação que parece local a mexer em tudo.

A projeção é agora da sessão, fixada pela primeira folha, e as seguintes são **recusadas na
colocação com a razão por extenso**. Recusar em voz alta é melhor do que aceitar em silêncio,
e resolve as três de uma vez. A decisão vive em `recusaPorProjecao`, fora do manipulador de
clique, para poder ser exercitada sem formulário nem ficheiro — dentro dele só se verificava
lendo o código-fonte, que é verificar a forma e não o comportamento.

**E o `carregarFolhas` deixou de perder folhas em silêncio**, que era a mesma classe de
defeito do `null` mudo da IndexedDB corrigido na r0083. Uma colocação gravada que já não
passe a validação, ou que esteja noutra projeção, é descartada **e contada na fita do tempo**.

### O mínimo do navegador

Do ramo #005, medido em Chromium 141 com perfil vazio a partir de `file://`. **Quem fixa o
mínimo é o CSS e não o JavaScript**, o que não é intuitivo: o código está em ES2020, Chrome
80, mas a folha de estilo usa `color-mix()` em sete sítios, e essa é de **Chrome/Edge 111**,
março de 2023.

A degradação não é cosmética. Abaixo do mínimo a declaração cai por inteiro e vão-se as cores
das caixas de aviso e o anel de foco de `input[aria-invalid="true"]`. **Um campo inválido que
perde o anel vermelho continua a parecer normal** — falha com ar de estar bem, que é pior do
que falhar.

Declara-se e não se bloqueia, na doutrina do carimbo de integridade: um carimbo no fim da
página, permanente porque é condição da máquina e não acontecimento. A deteção é
`CSS.supports` e nunca o `userAgent`, que qualquer coisa reescreve — há teste que o exige.

## A auditoria externa de 4 de setembro, verificada e respondida — r0094

Chegou uma auditoria da r0091 produzida por outro modelo. Verificou-se cada afirmação contra
a fonte antes de a aceitar, que é a regra que este projeto adotou depois de a correção do
ramo #006 ao POSIT ter sido ela própria errada: **a verificação passa pela fonte e não pela
palavra de quem a leu, mesmo quando quem leu nos está a corrigir.**

Da verificação saíram três categorias, e as três interessam.

**Confirmadas tal e qual.** O `pendencias()` a falhar para o lado aberto — quatro entradas com
`catch(e){ return true; }`, isto é, a guia a dar a pendência por satisfeita exatamente quando
não consegue avaliá-la. A aprovação a dizer sempre «ordens de missão produzidas e em controlo
de execução», por a chamada estar num `catch` vazio. A CI a correr quatro dos nove portões:
`tipos`, `morto`, `documentar`, `manual` e `arrumado` nunca correram lá — e são precisamente
os cinco que guardam as regras próprias deste projeto. A dimensão do PR, que é pior do que a
auditoria dizia: 87 ficheiros e 181 480 linhas. E a falta de `<main>`, de `<h1>` e de `pt-PT`,
contadas a zero, zero e um.

**Confirmadas mas mais estreitas do que o afirmado.** O `__proto__` na importação **não polui
o `Object.prototype` global** — mediu-se intacto antes e depois. O que faz é trocar o
protótipo de um objeto do estado no `Object.assign` da migração 0, e das três chaves só o
`__proto__` tem acessor; `constructor` e `prototype` entram como campos banais. Mediu-se ainda
que, na escada de hoje, o degrau 2 para 3 reconstrói o `dados.topo` e lava o efeito **por
acidente**, e é por ser por acidente que a porta se fechou. Quanto à hora do Open-Meteo, o
rótulo saía certo — `getHours()` desfazia o que a leitura tinha feito — e o que saía errado
era o *instante*, que é o que decide no filtro que horas já passaram.

**Não reproduzida.** «Mil alterações rápidas acabam com uma revisão antiga gravada» não
acontece: `persistir` é síncrono até ao `await` e `_idb` cria a transação dentro do executor
da Promise, pelo que ordem de chamada é ordem de escrita, que o IndexedDB garante. O que
existe, e a achada não apanhou, é que `persistir` nunca lança e quase nenhuma chamada é
esperada com `nota` — **uma gravação falhada é hoje indistinguível de uma gravação boa**.

**Pior do que o afirmado.** Os 108 `catch` vazios estão certos na contagem, mas o número não
era o problema: nove pinturas viviam num só `try`, e uma exceção em `autoNivelDECIR` apagava
em silêncio oito vistas de uma vez — a estrutura do PCO, o plano de comunicações, o catálogo,
a conformidade, o PEA em vigor, o estado da proposta, as ampulhetas e o perfil. O ecrã ficava
com a pintura anterior e não dizia nada.

Feito nesta revisão, por esta ordem:

1. **A CI corre `npm run tudo`.** Um comando, nove portões, e acrescentar um portão passa a
   ser uma linha no `package.json`. Correu-se localmente antes de mudar o ficheiro: os nove
   passavam já, portanto a CI fica verde de imediato e o buraco fecha sem dívida atrás.
2. **`pendencias()` falha fechado**, por `avaliarPendencia`, e o motivo viaja com a pendência.
   Três estados na lista de verificação, e não dois: «POR VERIFICAR» bloqueia como um
   obrigatório em falta mas não manda preencher um campo que não é o problema.
3. **`produzirOrdensDoAprovado`** substitui o `catch` vazio. Não é um estado novo da proposta:
   o COS aprovou, o ato de comando aconteceu e está registado (art. 8.º, n.º 2, al. e); o que
   falhou foi outro ato, de outra célula. Fica um `semOrdens` no plano, com motivo e hora, um
   botão para repetir, e uma entrada no registo de evolução — que é o que acompanha a
   ocorrência quando ela muda de posto.
4. **Uma pintura por `try`**, por `pintura()`, com faixa no topo a nomear o que não pintou e
   uma linha na fita à entrada e à saída da falha. Um teste recusa que volte a haver um `try`
   dentro de `pintarTudo`.
5. **`timeformat=unixtime`** no Open-Meteo, com `lerHoraOpenMeteo` a separar instante de
   relógio de parede. Sem `utc_offset_seconds` rebenta em vez de adivinhar: melhor ficar com a
   previsão anterior, com a idade à vista, do que com horas em que ninguém sabe se confiar.
6. **`pt-PT`, `<h1>` e `<main>`**, com o rodapé fora do `<main>` e a faixa das pinturas também
   — uma faixa que desmente o conteúdo não pode viver dentro dele.
7. **As três chaves recusadas**, em `limparChavesRecusadas`, à entrada do pacote e outra vez
   dentro de `migrarGravado`, que é por onde passam os três caminhos de entrada. Tira-se a
   chave e importa-se a ocorrência: num PCO, um registo com um campo estragado ainda é o
   registo.

Dois erros próprios apanhados pelo caminho, ambos por medição e não por leitura. O primeiro
teste das chaves envenenadas **passava por vazio**: o pacote estava escrito com um literal de
JavaScript, onde `__proto__:` é a sintaxe que define o protótipo e não cria propriedade
nenhuma — o `JSON.stringify` deitava o veneno fora antes de a aplicação o ver. Passou a
escrever-se em texto, com um teste à cabeça que confere que o pacote leva mesmo as chaves. O
segundo foi o teste das quatro pendências, que filtrava por elemento e apanhava duas
pendências que partilham o `br-gerar`, acusando a que estava certa; e o caso da evolução
passava sem exercitar nada, porque com `O.peas` vazio a condição resolve-se antes de chamar a
função que se tinha partido.

O que a auditoria pedia e **não** se fez, com a razão: o `PlanDraft` tipado e a renderização
incremental. São reformulações de arquitetura com custo alto e ganho por demonstrar, e a
auditoria não mede nenhuma das duas. A única medição de desempenho que este projeto tem foi a
da repintura das folhas — 103 ms para 4,4 ms — e essa fez-se antes de mexer.

Fica em aberto, e é a achada mais útil que saiu de tudo isto: **duas abas na mesma ocorrência
escrevem a mesma chave e a última a fechar ganha**, sem `BroadcastChannel`, sem
`navigator.locks` e sem revisão monótona de estado. E `persistir` continua a não deixar
ninguém saber se gravou.

## Duas análises da r0093, uma delas de outro modelo ainda — r0095

Chegaram duas, ambas sobre a r0093 e ambas depois de a r0094 já estar feita. Verificaram-se
as duas contra a fonte. O que se segue é o que a verificação deu, e não o que os documentos
dizem.

**A segunda análise GPT é boa, e mede.** As contagens batem quase todas com as minhas: 80/70
chamadas a `persistir()` sem `await` (contei 81/70), 29 `Date.now()` (contei 27), 23 `new
Date()` (contei 22) — as diferenças são r0093 contra r0094. E traz três coisas que eu não
tinha:

1. **A fuga de memória das folhas.** `colocarFolha` abre a `blob:` URL da imagem *antes* de
   conferir a projeção, e as saídas por recusa não a revogavam. Confirmado, e o caminho que
   mais custa é justamente o da projeção incompatível: é o de quem já tem uma folha colocada
   e vai colocar a segunda, com megabytes presos ao separador até ele fechar.
2. **A medição da validade.** Reproduzi-a ao minuto: 17h50, janela a fechar às 18h00,
   validade produzida 18h50. Cinquenta minutos para lá do gatilho.
3. **Os controlos `div`/`span`.** Aqui a análise está certa e **eu tinha contado mal**: na
   resposta à auditoria anterior dei zero, porque procurei no molde. Estavam nas listas
   repintadas em JavaScript. Eram seis, em quatro listas, e a das propostas de PEA — a que
   abre o documento — era inalcançável por teclado.

E o ponto cego do carimbo, que é o achado mais afiado dos dois documentos: **a serialização
canónica percorria só as chaves próprias.** Medido: `{a:1}` e o mesmo objeto com um protótipo
a trazer `fantasma` davam o mesmo SHA-256, e o `fantasma` lia-se na mesma. O carimbo dizia
«confere» por cima de conteúdo que ninguém escreveu — e o carimbo é o que este projeto
oferece como prova de integridade.

**O que a análise GPT diz e está desatualizado:** as sete correções que aponta como não
resolvidas foram-no na r0094, que ela não viu. Sobra a coordenação da persistência, que
continua por fazer.

**A CI do `main` estava vermelha, e era verdade.** Confirmado no registo: a execução n.º 216,
sobre o commit «Delete index.html», falhou. O `tests/montagem.test.mjs` exigia que o
`index.html` da raiz fosse a entrega mais recente, byte a byte, e o ficheiro deixou de existir
no `main`. Resolvido ao juntar as duas histórias: a cópia servida passou a ser o `home.html`
que o dono carregou — ver o fim desta secção.

**A análise Gemini é outra coisa.** Está bem escrita e tem partes corretas, mas descreve um
projeto que não é este. Diz «monólito imperativo com mais de 2500 linhas» e «ficheiro
monolítico de 3000 linhas»: a fonte são 72 módulos e 15 608 linhas em sete zonas. Diz
«ausência de ambiente modular de testes unitários automatizados»: são 911 testes. E a
«Solução A» que propõe — desenvolvimento em módulos com uma cadeia de compilação para
entregar um ficheiro único — **é exatamente o que o projeto já faz** desde que `fonte/` e
`npm run montar` existem. Analisou a entrega e não o repositório, e as três afirmações caem
daí.

Verifiquei o resto ponto por ponto:

- **`I = H·w·R` (Gemini) reduz exatamente a `I = R·w/2` (o projeto).** Testado em três pontos:
  idêntico à última casa. O «motor físico retificado» retifica zero na intensidade — é o
  mesmo número escrito por extenso.
- **Butler e Cohen (1998) já lá está**, com a distância de quatro vezes a altura da chama e a
  tolerância de 7 kW/m² de radiação incidente, e a linha de contenção a uma vez e meia. A
  «Solução D» propõe o que já existe, com as fontes já declaradas.
- **O comprimento da chama diverge pouco e a fonte do projeto é melhor para aqui.** A 4 000
  kW/m: 3,65 m pelo `I = 300·L²` de Fernandes (2003), 3,52 m pelo `L = 0,0775·I^0,46` que a
  Gemini propõe, 3,54 m pelo `I = 258·L^2,17`. Três relações publicadas, diferença de 4 %. A
  do projeto é a portuguesa e é a que a base doutrinária manda usar.
- **O envelope PT-TM06 já existe** (`ENVELOPE_PTTM06`), com os limites em coordenadas
  projetadas em vez do retângulo em graus que a «Solução C» propõe.
- **As citações legais conferem, menos uma.** Art. 12.º, n.º 2 do DL n.º 90-A/2022 põe mesmo
  os oficiais do PCO responsáveis pelas células de operações, planeamento, logística e
  finanças. O art. 2.º, al. c) do Despacho define mesmo a fita do tempo como «o registo
  temporal explícito e completo das decisões, ações e informações operacionais». Mas o
  Despacho n.º 4067/2024 é **de 15 de abril, 2.ª série, n.º 74** — e a Gemini escreve «de 16
  de abril, n.º 75». O projeto tem-no certo em `docs/FONTES.md`. É o género de erro contra o
  qual existe a quarta restrição não negociável, num documento que se apresenta com
  referências APA.
- **A assinatura assimétrica proposta não dá o não-repúdio que promete.** Um par de chaves
  gerado no próprio dispositivo, sem âncora de confiança nem infraestrutura de chaves, prova
  que *alguma* chave assinou, não que foi a do COS. E o código proposto gera-o com
  `extractable: false`, o que impede exportar a chave pública — sem ela ninguém verifica nada
  fora daquele navegador. Fica por fazer, mas não por esta via: exige credenciais reais que a
  aplicação não tem, e o projeto não inventa o que não tem fonte.
- **O código da Gemini não corre como está.** `capacidadeTatíca` está escrito com acento no
  sítio errado, e `avaliação` entra como chave de objeto com acento — nenhum dos dois é
  defeito de doutrina, mas dizem alguma coisa sobre o grau de verificação do documento.

Feito nesta revisão:

1. **O chão de uma hora saiu do `horizonteValidade`.** No lugar ficou `avisoValidadeCurta`,
   que diz quantos minutos faltam até ao primeiro gatilho e manda prever já a revisão, ou que
   a validade está esgotada à nascença. A diferença é toda: o chão **alterava** a validade
   para a fazer parecer razoável; isto deixa-a como é e diz que é curta.
2. **`canonico` passa a percorrer por `for...in`.** Num objeto normal o conjunto de chaves é
   o mesmo — o `Object.prototype` não tem nada enumerável —, pelo que nenhum carimbo já
   emitido muda; num objeto adulterado passa a haver diferença, que é o que se queria.
   A primeira tentativa **lançava** em vez de resumir, e partiu 28 testes do encerramento ao
   apanhar objetos vindos de outro contexto de execução, que são planos e inofensivos.
   Recusar era a resposta errada: aqui o trabalho é resumir tudo, não julgar.
3. **A `blob:` URL é revogada em todas as recusas** posteriores à leitura da imagem, por um
   `recusar()` que revoga e avisa. As duas que ficam a chamar `dizer` diretamente são as
   duas certas: uma corre antes de haver URL, a outra depois de a folha estar colocada.
4. **Os seis controlos são `<button>`**, ligados por delegação no contentor — e não por
   elemento, porque as listas repintam-se muitas vezes e religar a cada repintura é a forma
   de se perder um ouvinte em silêncio, defeito que este projeto já teve.

E uma correção a um comentário do próprio código: o núcleo afirmava que dos `onclick`
embutidos «nenhum resta». **Restavam seis.** A afirmação sobre o XSS mantinha-se de pé —
nenhum deles interpolava texto de campo, levavam índices que a aplicação gera —, mas a
afirmação sobre a forma estava errada, e estava escrita ao lado da regra que a desmentia.

**Decidido pelo dono do repositório, e seguido aqui:** o `index.html` da raiz foi apagado do
`main` a 4 de setembro, num commit explícito, e no mesmo minuto entrou `home.html` com a
r0092 — a mesma cópia, com outro nome. A aplicação continua a ser servida por URL; só o
nome mudou. As três saídas que estavam em aberto — repor o ficheiro, tirar a geração e o
teste, ou tolerar a ausência — caíram todas: a montagem passa a escrever `home.html`, o
teste passa a conferir `home.html`, e o nome vive num sítio só, `SERVIDO` em
`ferramentas/montar.mjs`. O `index.html` não volta: ressuscitar um ficheiro que o dono
apagou de propósito seria desfazer-lhe a decisão em silêncio.

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

## Ler cartografia oficial: WMTS, na r0066

O Ricardo foi procurar os endereços `{z}/{x}/{y}` da Direção-Geral do Território e não os
encontrou. **Não os encontrou porque não existem nessa forma**, e o erro é do campo que eu
fiz, não da procura dele.

`{z}/{x}/{y}` é uma convenção do ecossistema OpenStreetMap. Não é norma nenhuma. As
agências oficiais publicam **OGC WMTS**, e três diferenças faziam do campo anterior uma
fechadura sem chave:

1. **A ordem está trocada.** WMTS endereça por `TileRow`/`TileCol` — a linha antes da
   coluna, **y antes de x**.
2. **O nível não é um número.** O `TileMatrix` chama-se `EPSG:3857:14`, ou tem nome.
3. **A projeção pode não ser Mercator.** Cartografia portuguesa oficial vem muitas vezes
   em ETRS89 / PT-TM06 (EPSG:3763), e desenhá-la com a aritmética de Mercator punha tudo
   no sítio errado — em silêncio.

### Perguntar ao serviço, em vez de adivinhar

`fonte/3-planeamento/04-servico-wmts.js` lê o `GetCapabilities`, que é onde o serviço
declara com autoridade o que tem: camadas, conjuntos de matrizes, projeções, formatos,
modelos de endereço e **a atribuição**. Lê-se de um endereço ou de um ficheiro guardado —
do ficheiro porque um posto trabalha sem rede, e porque assim a escolha do serviço se
prepara no gabinete.

O nível deriva-se **da escala e não do nome da matriz**: o nome é uma escolha de quem
publicou, a escala é um número que significa sempre o mesmo. A ponte entre o mundo do WMTS
e o do mapa é o pixel normalizado de 0,28 mm da OGC, e há um teste que confere que as duas
constantes continuam a bater uma na outra.

### Recusar em vez de desenhar torto

`wmtsCompativel` não se contenta com o código do sistema de coordenadas. Confere a origem
do conjunto, o tamanho do mosaico e a progressão das escalas: um conjunto em EPSG:3857 com
outra origem põe a carta ao lado do sítio na mesma. O que não passar **diz porque não
passou**, e a camada aparece na lista com o motivo em vez de desaparecer — saber que a
carta militar existe mas está em PT-TM06 é informação; escondê-la deixava quem escolhe a
pensar que o serviço não a tinha.

### O que a verificação corrigiu

Uma carta WMTS estava a escrever nos campos do serviço `{z}/{x}/{y}`: o campo do endereço
ficava com «undefined» e a atribuição de um serviço aparecia nos campos do outro. E a
linha de estado dizia «ampliação 8 a 18 a 310002AGO26» quando não havia ninguém ao teclado.

Provado em navegador de ponta a ponta: doze mosaicos pedidos com a linha antes da coluna,
`.../EPSG:3857:14/6135/7835.png`, guardados no arquivo, sem um erro. Prova em `docs/qa/`
(`qa0021`).

## Focos de calor, na r0072 — e o endereço que não se inventou

Os focos são pontos, e um ponto reprojeta-se para PT-TM06 com a aritmética que já está
escrita. A r0072 lê a lista, desenha-a e escreve o que dela se pode dizer.

**Três decisões, e a primeira é a que mais custou a tomar.**

### Não se escreveu o endereço do serviço

Conheço a forma geral da API do FIRMS. **Não a pude verificar daqui** — a política de rede
deste ambiente não deixa —, e escrever de cor um endereço que ninguém confirmou seria repetir
exatamente o erro que abriu todo este trabalho: o campo `{z}/{x}/{y}` foi escrito assim, não
existia naquela forma, e ficou uma fechadura sem chave até se passar a perguntar ao serviço.

O endereço declara-se, como o da cartografia. A aplicação preenche `{bbox}` e `{data}` se
estiverem escritos, e **não reescreve mais nada**. E o ficheiro serve sem rede, que é o caso
do posto.

### A chave não sai no ficheiro da ocorrência

Vive no armazém do dispositivo, como a declaração da carta local. Um ficheiro de ocorrência
passa entre postos, vai por correio e fica arquivado; uma chave lá dentro saía de casa sem
ninguém dar por isso. Há um teste que exporta uma ocorrência com a chave declarada e confere
que nem a chave nem o anfitrião aparecem no ficheiro.

### A confiança dos dois sensores não se converte

O VIIRS escreve `l`, `n` ou `h`; o MODIS escreve 0 a 100. Guarda-se o degrau **e o texto
original**, porque converter um no outro seria inventar equivalência onde não a há.

### O que a leitura recusa deixar passar

> **Um foco é uma deteção, não um incêndio confirmado**, e a ausência de focos não é ausência
> de fogo: a passagem do satélite tem hora, o fumo espesso tapa, e a resolução do sensor é de
> centenas de metros.

Sai sempre, e há um teste que o exige. Sem isso, cinco losangos no mapa leem-se como verdade
do terreno.

### O que fica por fazer, e depende de terceiros

Confirmar contra o serviço a sério: o endereço exato, se responde com CORS aberto a uma página
em `file://`, e obter a chave. Nada disso se pôde verificar daqui.

## O eixo do tempo, na r0072 — e o fogo ativo, que continua de fora

A r0070 recusava por completo uma camada com dimensão. A recusa estava certa — servir pelo
valor por omissão mostrava outra data sem o dizer — e o resultado era inútil: recusava 1 210
das 1 315 camadas do GIBS, exatamente as que interessavam.

Passa a ler-se o eixo, a indicar-se o valor no pedido e a escrever-se **a data por baixo do
mapa**, que é a razão inteira de se ter feito isto: sem ela via-se imagem de outro dia sem
ter como saber.

Uma data que o serviço não declare é recusada com a distinção que importa: **«não há dados
desse dia» não é «não houve deteções nesse dia»**, e a segunda a aplicação não a pode saber
de todo — um mosaico vazio e um mosaico que não existe são coisas diferentes. Onde o passo do
intervalo não é de dias inteiros, abstém-se e di-lo, em vez de responder mal.

Das 1 315 camadas passaram a servir **1 197**, entre elas a cor verdadeira diária do VIIRS e
do MODIS: imagem fresca da região, que nenhuma fonte nacional dá.

### A correção que isto obrigou a fazer

**Esperava-se que ler o eixo trouxesse o fogo ativo do GIBS para dentro do mapa. Não traz.**
As dezoito camadas de anomalias térmicas continuam recusadas, e não pelo tempo: são servidas
só em `application/vnd.mapbox-vector-tile`, que não é imagem e que este mapa não desenha.

Ficou escrito onde estava escrito o contrário, e fica um teste que o fixa — confere que as
dezoito são recusadas **por formato** e que a palavra «eixo» já não aparece no motivo.

Isto reforça o §4 do relatório de fontes internacionais, que já era a conclusão certa: os
focos de calor são pontos e não mosaicos. A via é a API de área do FIRMS, que devolve
coordenada, hora de deteção, satélite, potência radiativa e confiança por foco. Um ponto
reprojeta-se para PT-TM06 com a aritmética que já está escrita; um mosaico já desenhado não.

### Um erro meu na conta dos intervalos

Uma data dentro de um intervalo que não caia num múltiplo do passo **não existe** — e eu
tinha-a a devolver «incerto». O passo é conhecido e a conta fecha; confundir uma coisa com a
outra fazia a aplicação abster-se de dizer o que sabia.

## A dívida cartográfica, saldada na r0072

A carta que o Ricardo anotou à mão no PCO de Cabeça Boa abriu este trabalho: sete coisas que
ela dizia e a Estação não sabia dizer. Estão as sete feitas.

| | |
|---|---|
| Perímetro com as manchas por arder | Já estava |
| Limites de setor | r0070 |
| Frentes com direção de progressão | r0070 |
| Linhas de contenção e de apoio | r0070 |
| Pontos de água e de combustível | Já estava |
| Meios no sítio onde estão | r0072 |
| **Notas de manobra sobre o traçado** | **r0072** |

### As notas, que eram a última

«Interdito a VFCI», «inversão de marcha», «incêndio subterrâneo», «não ardido». Nenhuma cabe
num campo de formulário e nenhuma se deduz de coisa nenhuma: são o que quem esteve ali viu e
quis deixar dito, no sítio onde é verdade.

O texto desenha-se **por inteiro** sobre a carta. Uma nota que precise de ser clicada para se
ler não é uma nota, é um ponto.

As três espécies — aviso, manobra, observação — **não são doutrina, e a aplicação não finge
que sim**. A doutrina classifica pontos de água e zonas de concentração; não classifica
bilhetes escritos na margem de uma carta. Distinguem-se por uma razão prática e uma só: uma
nota que restringe ou avisa tem consequência para a segurança de quem lá vai. É por isso que
**só os avisos entram na leitura da evolução** quando caem no caminho da frente — «não
ardido» à frente do fogo não é notícia; «incêndio subterrâneo» é.

Um teste confere que nenhuma das três cita artigo, ponto ou diretiva. Se algum dia alguém lhes
quiser dar fundamento legal, tem de o ir buscar a uma fonte e não a este ficheiro.

### A superfície mais exposta que se acrescentou

É texto livre, escrito à mão por quem regista, desenhado por inteiro dentro de um SVG. Fica um
teste que sopra os três venenos conhecidos do projeto e julga o resultado **depois de o
navegador o interpretar** — não por procura de texto: o texto escapado contém a palavra
«onerror» como texto, e isso é inofensivo; o que não pode existir é o atributo.

### O que a carta ainda tem e a aplicação não

A carta de fundo. Falta a decisão institucional sobre que serviço o posto tem direito a usar.

## Os meios onde estão, na r0072

Na carta anotada do PCO os meios estão desenhados no sítio onde estão: GRIR Guarda, GRUATA
BSE, CATE Viseu. No dispositivo desta aplicação já lá estavam — cada unidade com tipologia,
entidade e hora de empenhamento — e o que lhes faltava era coordenada.

**Não se criou um segundo inventário.** Dar posição a um meio é acrescentar coordenada ao que
já está contado: um dispositivo contado em dois sítios acaba a contar dois números
diferentes, e a fase do SGO depende dessa contagem.

Cada unidade passou a nascer com identificador próprio, e a migração dá-o às que já existiam.
Sem ele, a posição só se poderia prender ao lugar na lista — e o quadro de setorização move
unidades de setor, o que passaria a coordenada para a unidade errada, em silêncio. Fica um
teste que move uma unidade e confere que a coordenada não mudou de dono.

### O que isto destrava

A pergunta a que a carta anotada responde de relance: **quem fica do lado errado da frente.**
A leitura da evolução destaca-a à parte do resto, porque é decisão de outra natureza — uma
coisa é o fogo caminhar para uma charca, outra é caminhar para uma equipa:

> **No corredor de progressão desta frente: GRIR Guarda a 1,1 km; BRIR BSE a 2,2 km.**

E com ela vai a ressalva que a torna honesta: *dos 3 meios do dispositivo, 2 têm posição no
mapa; o que a leitura diz sobre meios no caminho da frente vale só para esses.* Dizer que não
há meios no caminho com três posicionados em vinte diz muito menos do que parece.

### O que o verificador de tipos apanhou

`String(x).toString(36)` — a `toString` de uma cadeia não leva argumentos, e o identificador
saía em decimal em vez de base 36. Não partia nada; estava errado, e não teria sido visto.

## A carta pré-descarregada, que ninguém conseguia carregar — absorvido da r0071

A linhagem paralela mandou a r0071 com dois defeitos desta linhagem, e ambos são reais.

**O campo não pedia uma pasta.** Sem o atributo `webkitdirectory`, o navegador não preenche
`webkitRelativePath`, o código cai em `f.name` — que nunca traz barras — e `mosaicoDoCaminho`
recusa **cem por cento** dos ficheiros. A funcionalidade era impossível de satisfazer por
qualquer utilizador, por muito bem que preparasse a carta.

O que interessa aqui não é o atributo: é **porque é que os testes desta linhagem não o
apanharam**. O teste que existia construía o `webkitRelativePath` à mão, com
`Object.defineProperty`, e assim provava que o filtro funcionava sem provar que alguém lá
chegava. Um teste que fabrica aquilo que a interface deveria fornecer testa o código e não o
caminho. Ficam os dois: o do filtro, e um que confere que o campo pede a pasta.

**A grelha da árvore local não se declarava.** Defeito meu, e consequência direta de ter
passado a portuguesa a grelha por omissão: uma árvore do OpenStreetMap carregada sem serviço
declarado era desenhada com a aritmética de PT-TM06 — carta no ecrã, tudo fora do sítio, e
nada a assinalá-lo. As duas grelhas numeram os quadrados do mesmo modo, e por isso a projeção
**não se adivinha pelos ficheiros**: declara-se, e fica gravada com os quadrados que descreve.

Acrescentou-se ainda a atribuição da carta local — o próprio código dizia que não havia onde
a declarar — e a mensagem de falha passou a ser diagnóstica: mostra o primeiro caminho que
leu, porque é isso que diz onde está o erro.

Absorvido em `fonte/`; a r0071 fica em `app/` ao lado das outras. As 22 verificações do
`t0017` passam contra esta fonte, e estão traduzidas para `tests/mapa.test.mjs`.

## O teste de esforço, e a travessia que era quadrática

O NASA GIBS publica 5,8 MB de `GetCapabilities`: 62 034 elementos, 1 315 camadas, sete
conjuntos de matrizes. Entrou como teste de esforço, e o interpretador **não o leu** —
passou de cinco minutos sem terminar.

A causa era minha e estava em duas linhas parecidas. `wmtsTodos` fazia
`[...el.getElementsByTagName("*")].filter(...)`, e a coleção devolvida é **viva**: espalhá-la
faz o motor voltar a percorrer a árvore a cada passo do iterador. A busca de exceções fazia
`for(let i=0; i < col.length; i++)` sobre outra coleção viva, e o comprimento é recalculado
a cada volta. Ambas são a forma óbvia de escrever aquilo, e ambas são quadráticas.

A caminhada por `firstElementChild`/`nextElementSibling` percorre os mesmos 62 034 elementos
em 38 ms. A leitura completa passou a **1,8 s**, e o inventário das 1 315 camadas a 17 ms.
A busca de exceções deixou de percorrer o que quer que seja em documento bom: um relatório
de exceção da OGC é um documento inteiro, e decide-se pela raiz.

Nenhum documento pequeno apanhava isto. Ficou teste, com limite generoso: o que se trava é
a regressão para tempo quadrático, não milissegundos.

### O que o GIBS mostrou sobre o fogo ativo

| | |
|---|---|
| Camadas | 1 315, das quais **99 desenháveis hoje** |
| Recusadas por eixo temporal | **1 210** |
| Recusadas por formato | 6, em mosaico vetorial |
| Anomalias térmicas | 18 camadas VIIRS e MODIS — **todas recusadas**, todas por `Time` |

É a única fonte de fogo ativo identificada em serviço aberto, sem chave e com CORS. E está
recusada por inteiro, pela regra que a r0070 acabou de introduzir. A regra está certa —
servir pelo valor por omissão mostrava outra data sem o dizer — e o resultado é inútil.
Ler o eixo `Time` passa a ser a tarefa que desbloqueia o assunto; está em
`docs/POREXECUTAR.md`, ponto 2.

Nota de escala, para não se esperar do GIBS o que ele não dá: as anomalias térmicas param no
nível 8, **611 m por pixel**. É honesto da NASA — o sensor VIIRS tem 375 m de resolução
nativa —, e serve para contexto regional, não para vista de setor.

## Os requisitos do §17, na r0070

O relatório da sessão de cartografia fecha com catorze requisitos para o interpretador,
independentes da opção de arquitetura. Foram todos percorridos. Seis mudaram
comportamento, cinco já estavam cumpridos, dois não se aplicam a WMTS e **um seguiu-se por
outro caminho**, com a razão registada.

| § | Requisito | O que ficou |
|---|---|---|
| 1 | Versão pelo nome da raiz | **Feito.** E mais do que pedia: um documento de WMS colado por engano passa a dizer «isto é um WMS 1.1.1, não um WMTS», em vez de nomear a raiz. Das vinte e três capturas, dezoito são WMS: é o engano provável |
| 2 | Erro com HTTP 200 | Já feito na r0069 |
| 3 | Sem DTD nem entidades externas | **Feito**, com uma correção pelo caminho — ver abaixo |
| 4 | Travessia por `localName` | Já feito |
| 5 | Requisitabilidade pelo `Identifier` | Já feito |
| 6 | CRS pela cadeia de ascendentes | **Não se aplica.** É a herança de camadas do WMS; no WMTS as camadas são planas e o sistema vem do conjunto de matrizes |
| 7 | Endereço fundido, promovido a HTTPS | **Feito o primeiro, o segundo com condição** — ver abaixo |
| 8 | Formatos por lista da aplicação | **Feito.** `WMTS_FORMATOS` declara o que o mapa desenha. Uma camada só em mosaico vetorial ou GeoTIFF é recusada a dizer o que oferecia, em vez de ser adotada e falhar ao desenhar |
| 9 | Escalas como números, `ScaleHint` à parte | Já feito. `ScaleHint` é do WMS e não entra aqui |
| 10 | Dimensões temporais | **Feito.** Ver abaixo: é o requisito com risco operacional real |
| 11 | Catálogo por lista branca | **Seguiu-se por outro caminho** — ver abaixo |
| 12 | Conferir o CRS antes de compor pedidos | Já feito, em `wmtsCompativel` |
| 13 | Zero camadas é erro reportável | Já feito |
| 14 | Versão fixada por camada | **Não se aplica.** O WMTS tem uma versão só, a 1.0.0 |

### O eixo do tempo, que é o que mais podia doer

Uma camada pode ter um eixo além do espaço. Nas capturas de WMS do EFFIS as camadas
declaram `<Dimension name="time" units="ISO8601" default="2019-01-01">`. Um pedido que
omita o tempo recebe o que o serviço escolheu por omissão — e nenhum aviso.

Num incêndio ativo, mostrar imagem de 2019 a quem está a decidir sobre hoje, sem o dizer,
é pior do que não ter carta nenhuma: a carta em falta vê-se, a carta errada não. O
construtor de endereços desta aplicação não preenche dimensões, e por isso **uma camada
que declare uma é recusada** — com o motivo, e a dizer que data se veria se fosse servida.

### O DOCTYPE, e a guarda que estava a recusar mal

A guarda contra entidades recusava qualquer declaração de tipo de documento. Estava errada,
e foram as capturas que o mostraram: **o WMS 1.1.1 declara um por norma** — as nove capturas
de 1.1.1 trazem todas `<!DOCTYPE WMT_MS_Capabilities SYSTEM ...>`. Quem colasse um endereço
de WMS 1.1.1 recebia «declara entidades próprias», que é obscuro e falso quanto à intenção.

Lê-se agora o **nome** da declaração: os nomes conhecidos seguem para a mensagem que explica
o protocolo, e só o resto é recusado.

### Onde não se seguiu o relatório

**§7, a promoção a HTTPS.** O relatório pede-a sempre. Não se fez sempre, e a razão está nas
capturas: a DGT publica o serviço em `http://` e só em `http://`. Promover às cegas trocava
um serviço que responde por um que não existe.

A regra ficou pela consequência. Numa página servida por HTTPS o navegador recusa conteúdo
em claro de qualquer modo, e aí promover é a única hipótese de a carta aparecer; num ficheiro
aberto de `file://`, que é como esta aplicação se usa no posto, o `http://` funciona. É a
diferença entre a entrega local e a pré-visualização do Netlify: na segunda, a cartografia da
DGT não carrega, e não é defeito do código.

**§11, o catálogo por lista branca.** O problema é real — a base de dados geográfica do ICNF
declara **385 camadas**, e uma lista de 385 linhas num posto de comando não se lê. A solução
proposta não se seguiu: escrever no código os nomes das camadas que se acha que um serviço
tem é dar por assente o que não se confirmou, que é a restrição que este projeto tem em
primeiro lugar — e esconde, sem o dizer, camadas que o serviço realmente publica.

Resolveu-se por ordem e por procura: as camadas que servem primeiro, um campo para filtrar
que aparece quando a lista passa de vinte, e a conta do que ficou de fora à vista. Quem
procura encontra; quem não procura não fica a supor que o serviço só tem vinte camadas.

## Desenhar na projeção portuguesa, na r0069

A r0066 sabia ler o WMTS da DGT e depois **recusava-o**, porque o mapa só sabia a
aritmética de Mercator. Era o serviço certo a bater à porta e a porta a dizer que não. A
r0069 abre-a: o mapa deixou de ter uma projeção e passou a ter um **registo de grelhas**,
e a carta escolhe a sua.

### O registo de grelhas

`GRELHAS`, em `05-mapa-operacional.js`, declara duas: `mercator` (EPSG:3857), que é a do
esquema de mosaicos da Internet, e `pttm06` (EPSG:3763), que é a da cartografia oficial
portuguesa. Cada uma sabe projetar, desprojetar, dizer quantos metros vale um pixel e até
onde vai. O resto do módulo passou a chamar `gPara`, `gDe` e `gEscala`, e não precisa de
saber em que sistema está.

Quem escolhe é a carta: um serviço `{z}/{x}/{y}` é Mercator por definição, um WMTS traz a
sua declarada no conjunto de matrizes, e **sem carta fica a portuguesa** — que é a do
teatro onde esta aplicação trabalha.

`fonte/1-nucleo/23-projecao-pttm06.js` é a projeção nova: Transversa de Mercator sobre o
GRS80, meridiano central 8° 07′ 59,19″ W, paralelo de origem 39° 40′ 05,73″ N, fator de
escala 1 e **sem falsa origem**. A série de Snyder truncada na sexta potência, que a esta
latitude e para uma folha de 615 km dá menos de um milímetro de erro.

### O erro que quase passou

A primeira versão projetou cada eixo sozinho: o Este a partir da longitude, o Norte a
partir da latitude. **A Transversa de Mercator não é separável** — o Este depende também
da latitude e o Norte também da longitude. A ida e volta de um ponto de Lamego saiu a
trinta quilómetros do sítio, em 41,3857/-7,7143 em vez de 41,0975/-7,8103.

A correção mudou a forma da interface: `para(lat, lon, z)` e `de(x, y, z)` recebem e
devolvem o **par**, e não há maneira de projetar meio ponto. Fica um teste que confere que
o Este mexe com a latitude e o Norte com a longitude: se algum dia voltarem a não mexer,
a projeção voltou a ser tratada como separável.

### As capturas dos serviços reais

`tests/fixtures/capacidades/` guarda o que os serviços responderam em 31 de agosto de
2026: cinco WMTS, dezoito WMS e os vinte e três conjuntos de cabeçalhos HTTP. São **prova
de proveniência**, e não material de trabalho — um ficheiro editado à mão deixa de o ser.
`tests/capacidades.test.mjs` confere o resumo SHA-256 de cada um antes de os usar, e
depois exercita o interpretador contra eles.

Quatro coisas que se davam por assentes e as capturas desmentiram:

| Dava-se por assente | O que as capturas mostram |
|---|---|
| Havia vários WMTS oficiais para escolher | Há **um**. Dos cinco endereços procurados, quatro respondem erro |
| Um erro vem com código de erro HTTP | Os quatro respondem **HTTP 200**: dois com HTML do MapServer, dois com `ows:ExceptionReport` |
| O WMTS da DGT estaria em Web Mercator | Está em **EPSG:3763**, e só. Não publica Mercator nenhum |
| Todos os anfitriões abriam o CORS | **O ICNF não abre nenhum.** Nenhuma das seis capturas do ICNF traz `Access-Control-Allow-Origin`, e sem esse cabeçalho uma página em `file://` não lê a resposta — incluindo a do serviço que responde capacidades válidas |

A última não se corrige em código, e por isso está aqui: os serviços do ICNF estão fora do
alcance desta aplicação enquanto não abrirem o CORS.

### Os números da grelha não são de memória

A grelha `pttm06` traz três constantes escritas no código — o canto (-170 000, 290 000) e
a escala do nível 0. Escritas à mão, envelheciam em silêncio. Um teste confronta-as com o
que a captura da DGT declara, matriz a matriz, nos vinte níveis: o canto, a progressão
binária e a ponte da escala para o nível. Se a DGT republicar o conjunto com outra origem,
o teste di-lo antes de a carta se deslocar.

O nível 0 dá 615 000 m redondos de lado, que é a folha do continente — e um número redondo
é a prova de que a escala foi lida certa. Ao nível 14 o mosaico vale 37,5 m, e Lamego cai
na coluna 5251, linha 3496: conferido à mão contra o que se sabe do terreno, 27 km a leste
do meridiano central e 159 km a norte da origem.

### O que ficou por provar

**O pedido de um mosaico ao serviço da DGT não foi executado.** A política de rede do
ambiente onde esta revisão foi montada recusa o anfitrião `cartografia.dgterritorio.gov.pt`
com `host_not_allowed`, e não se contorna uma política de rede para arranjar uma prova. O
que está provado é o que se podia provar sem ele: o endereço montado a partir das
capacidades reais, a grelha conferida contra o documento que a declara, e a coordenada
conferida à mão. Falta abrir a entrega e carregar a carta.

Nota de operação: a DGT publica o serviço em `http://`, e não em `https://`. Numa página
aberta de `file://` isso funciona; num servidor em HTTPS não funcionaria.

## Dizer o que cada função promete, na r0066

**Cento e trinta e cinco das 379 funções de topo não tinham uma linha antes delas** —
`persistir`, `lerForm`, `renderPCO`, `geocodificar`. Quem as lia tinha de reconstruir a
intenção a partir do corpo, e é assim que se muda uma função julgando que ela faz outra
coisa.

O critério não foi comentar tudo. O projeto já comenta densamente, e comenta **porquê**:
a razão da escolha, o defeito que a motivou, o que se recusou fazer. Um comentário que
repete o nome da função ocupa o lugar do que faria falta. O que se escreveu foi isso — o
que a função promete, e o que nela não é óbvio:

- que `migrarGravado` recusa um estado vindo de uma revisão posterior, e porquê;
- que `mostrarCandidatos` pergunta em vez de escolher o primeiro, porque o primeiro
  resultado de um serviço de geocodificação não é o mais provável;
- que `metricas` devolve traços sem previsão em vez de falhar, para não impedir de planear
  quem está sem rede;
- que `autoNiveis` deixa de sugerir assim que o oficial decide;
- que `rendicoes` recebe o instante e não o lê do relógio;
- que `evoDesdeUltimoPEA` usa o índice e não a hora, porque dois registos com o mesmo GDH
  acontecem.

**O verificador de tipos apanhou dois erros meus na própria documentação**: um `@param`
com nome de parâmetro que não existe, e um `@returns` que omitia o campo `nota` de
`parseCoordAny` — e essa omissão estreitava o tipo e partia seis usos a jusante. Documentar
mal tem consequências, e foi bom que se visse.

Fica `ferramentas/documentar.mjs`, no `npm run tudo`, com **limiar em zero**: uma revisão
pode acrescentar funções, não pode deixar cair a cobertura. Foi por nada medir que 135
ficaram por documentar sem ninguém dar por isso.

## Arrumar a casa e apagar o que ninguém usa, na r0066

### A raiz

Os dois históricos — o `main` e o ramo — só partilham o commit inicial, e por isso o
`main` continuava a ter na raiz tudo o que o ramo já tinha arrumado. Foram apagados 71
ficheiros com cópia verificada byte a byte, mais cinco cujo texto arrumado é a versão
sucessora (caminhos de estado antigos, a tabela de triagem por corrigir, um LEIAME
anterior).

**Vinte e sete não estavam absorvidos**, ao contrário do que eu tinha afirmado. Foram para
o seu lugar em vez de serem apagados: seis entregas que faltavam em `app/` — entre elas a
**r0030, que não estava em lado nenhum**, e as gémeas de r0015, r0016, r0028 e r0029 —,
nove provas de verificação, quatro guiões, cinco documentos e um exemplo de
interoperabilidade.

E três cartas de uma ocorrência real, anotadas no posto de comando. Não eram lixo: são o
alvo do mapa operacional, e estão em `docs/cartografia/` com a leitura do que a Estação
ainda não faz — limites de setor, frentes com direção, linhas de contenção, meios
colocados no sítio onde estão e anotação livre georreferenciada.

### O que ninguém usa

`ferramentas/morto.mjs`, ligada ao `npm run tudo`. A análise estática já apanhava a função
órfã; o que ela não via era o outro lado do mesmo defeito — o identificador que o código
procura e o HTML não tem, a classe que nenhum elemento usa. Nada disso dá erro: o botão
fica sem ouvinte e a regra de estilo não pinta nada.

Escrevê-la bem deu mais trabalho do que parecia, e cada tropeção ficou registado no
código. A leitura dos literais começou por emparelhar aspas pela ordem em que apareciam,
e uma aspa dentro de uma cadeia de plicas — `'<path class="'` — abria um par falso que
engolia o literal seguinte: classes vivas apareciam mortas. Depois faltava reconhecer a
expressão regular, cujas aspas desalinhavam a leitura. Depois faltava entrar no `${...}`
de uma cadeia de crase, onde há classes escritas. **Uma ferramenta que mente é pior do que
não a haver**, e por isso o que ela não consegue ver está declarado em `SABIDOS`, com o
sítio que o compõe.

Encontrou, e removeu-se: o desenho antigo do meteograma (`.cell`, `.day-div` e variantes),
o do plano de comunicações (`.cm-s`), cinco classes do documento impresso substituídas
pelas `p-*` e `pd-*`, e duas linhas de tabela que ninguém marca.

E um defeito a sério: **o interruptor «Meios aéreos» não ligava a nada**. O quadro dos
meios aéreos governa-se sozinho, e a caixa de seleção ao lado — com um campo para o número
de meios, de quando os aéreos eram uma contagem — estava inerte desde que cada meio passou
a ser uma unidade com indicativo. Saiu.


## A carta do mapa, na r0066

### A carta não vem no código, e não podia vir

A primeira versão trazia `tile.openstreetmap.org` escrito no módulo. **Estava errada**, e a
verificação do Ricardo apanhou-a: o servidor responde com um mosaico que diz «Access
blocked · App is not following the tile usage policy», e a aplicação colava-o como se fosse
cartografia.

Não é defeito de código — é uma escolha ilegítima. Aquele serviço é dos voluntários do
OpenStreetMap, para uso do OpenStreetMap, e a política exige que a aplicação se identifique
num `User-Agent` ou `Referer` próprio. Uma página aberta em `file://` não pode fazer nem uma
coisa nem outra: o navegador manda a sua própria identificação e origem nula.

Por isso **não vem serviço nenhum configurado**, e escolher outro por conta própria seria dar
por assente um direito de uso que não está confirmado — a mesma regra das designações de
canal e dos números de artigo. Ficam dois caminhos:

1. **Declarar o serviço** que o posto tenha direito a consultar — DGT, VCOC, ou outro com
   chave própria. Endereço no esquema de mosaicos, e **atribuição e termos obrigatórios**:
   carta de terceiros não se mostra sem dizer de quem é. Fica guardado no dispositivo, com
   quem o declarou e quando, porque é decisão do posto e não um acaso.
2. **Carregar carta pré-descarregada**, da árvore `{z}/{x}/{y}.png`. Fica no IndexedDB e
   serve **sem rede** — que é a condição normal de um PCO no terreno, e é o caminho que a
   própria especificação já previa no agente de topografia da Fase 3: «fontes
   pré-descarregadas por distrito para funcionar sem rede no TO».

Provado em navegador com **toda a rede abortada**: doze quadrados carregados de ficheiro,
guardados e servidos, mapa completo, sem um único pedido a sair.

### Uma recusa não é carta

Um servidor que recusa devolve muitas vezes a mesma imagem para todos os quadrados. A
aplicação reconhece-o: se três quadrados diferentes trazem bytes idênticos (impressão FNV-1a
sobre o conteúdo), não é cartografia — é uma recusa repetida. Di-lo, não a mostra e **não a
guarda**, para não ficar com a recusa no arquivo a servir sem rede.

## O mapa operacional, na r0066

O croqui mostra a forma. O mapa mostra-a **sobre a carta**: onde o incêndio pega, que
povoações tem à volta, por onde correm as estradas. É a diferença entre saber que o
perímetro tem seiscentos hectares e ver a que distância fica a aldeia.

### Escrito no projeto

Sem biblioteca nenhuma, porque a entrega é um ficheiro único que abre em `file://`: uma
biblioteca de mapas obrigaria a servidor ou a `<script src>`, e nem uma coisa nem outra
existem aqui. São cerca de trezentas linhas — projeção de Mercator, aritmética de
mosaicos e um SVG por cima, que é tudo o que um mapa é.

A projeção do mapa **não é** a do croqui, e tinha de não ser: o croqui é
equirrectangular local, que chega para desenhar sozinho; o mosaico vem projetado em
Mercator, e o que se desenha por cima tem de vir na mesma projeção ou fica ao lado do
sítio. O que os dois partilham é a caixa envolvente — `enquadrarCroqui`, que é onde está
a regra da extensão mínima. Duas caixas calculadas em dois sítios seriam duas caixas a
divergir.

A tela toma a **proporção do teatro** e não uma proporção fixa. Quando a altura ideal não
cabe, é a largura que cede: deixar a largura toda e cortar só a altura punha o teatro num
retângulo deitado com margens vazias dos dois lados — ver o dobro do que interessa e
metade do detalhe.

### A carta é de terceiros, e a licença exige que se diga

`CARTAS` declara a fonte, a atribuição e os termos de uso, e a atribuição fica **sempre**
por baixo do mapa — com carta completa, incompleta ou nenhuma.

O mapa **não se carrega sozinho**. Um PCO trabalha com ligação intermitente e por vezes
tarifada; pedir dezenas de quadrados de carta assim que a página abre é gastar a ligação
de alguém sem ela ter pedido nada. Carrega-se a pedido, e depois fica: os quadrados vão
para o IndexedDB, numa loja própria, e voltam a servir sem rede. A aplicação diz quantos
tem guardados e deixa esquecê-los, porque é espaço no disco de quem trabalha.

**Sem rede e sem quadrados guardados não se mostra um retângulo cinzento a fingir que é
mapa**: diz-se que não há carta, e fica o croqui, que não precisa de nada.

### O que se marca no mapa

Os setores existiam sem sítio: sabia-se quem os comandava e o que lá estava, e não onde
ficavam. Os pontos notáveis viviam em texto corrido, que serve para os ler e não serve
para os ver. Passam a marcar-se com um clique — escolhe-se o que marcar, clica-se no
mapa, e fica com a coordenada, o GDH e quem marcou, na evolução e na fita.

`TIPOS_PONTO` é registo declarado, com a norma de cada tipo. **As citações são as que o
projeto já usa para a mesma matéria noutro sítio**, e não alíneas escolhidas por parecerem
bem. O ponto de água é figura corrente da manobra e não se lhe achou artigo: aparece como
«fonte por confirmar» e está inscrito em `docs/FONTES.md`, em vez de se inventar a alínea.

### O que a verificação em navegador corrigiu

- **A sobreposição descolava do mapa em ecrã estreito.** A tela tinha `max-width:100%` na
  folha de estilo: era esmagada para caber enquanto os mosaicos ficavam no tamanho
  natural, as marcas apareciam ao lado do sítio e um clique devolvia a coordenada errada.
- **O mapa ia estreitando a cada carregamento**, por se medir o contentor da tela — que
  encolhe até ela. Mede-se agora uma caixa vizinha de largura normal.
- **O mapa ficava encostado à esquerda** dentro de uma caixa vazia, que se lê como erro de
  montagem.

### Verificação

430 testes, vinte e nove novos em `tests/mapa.test.mjs`: a projeção e o seu inverso em
quatro latitudes e três ampliações, os polos, a escala aferida contra a referência
conhecida, o enquadramento (cabe, e uma ampliação acima já não caberia), a atribuição
obrigatória, os pontos notáveis, as coordenadas dos setores, o escape do nome no SVG e a
ida e volta pela exportação. Em navegador: com carta, sem rede nenhuma, e a 380 px.

## Encerrar fecha o registo desta ocorrência, e mais nada — na r0066

Com a ocorrência encerrada, a aplicação bloqueava **tudo**, incluindo começar uma nova. O
Ricardo apanhou-o, e por baixo estava mais do que se via.

A lista do que ficava livre do fecho estava escrita por identificador, e **três dos que lá
estavam já não existiam** — `b-exp-occ`, `b-imp-occ` e `b-imprimir`. Um identificador que não
corresponde a nada não dá erro: apenas não isenta ninguém. Exportar e importar ficavam
bloqueados com a ocorrência fechada, que é quando mais fazem falta, e o comentário por cima
da lista dizia exatamente o contrário. Faltavam ainda começar uma ocorrência nova, abrir
outra do arquivo, assumir o teclado e ver o mapa.

Passa a ser registo declarado com a razão de cada entrada, e `auditarFechoDeEscrita` recusa um
identificador que não exista, acendendo o mesmo aviso da posse na passagem de turno. É o
princípio que o projeto já aplica em toda a parte: um registo que aponta para o que não
existe é defeito visível.

Os controlos criados em tempo de execução não têm identificador fixo e declaram-se com
`data-enc-livre` no próprio elemento — é assim que os botões do arquivo ficam livres: o
arquivo lista **outras** ocorrências, e o fecho protege o registo desta.

## O croqui do teatro de operações e os cartões dobráveis, na r0066

Absorção do trabalho da linhagem paralela (r0061 a r0063b), com as correções que a
verificação em navegador encontrou.

### O que fica gravado

Até aqui a aplicação lia o ficheiro do perímetro, calculava a área e **deitava fora o
polígono**; a deteção de aglomerados vivia em `window.__sensLista`, que morre ao
recarregar. Ao voltar à ocorrência não havia por onde desenhar nada, e a exportação não
levava a forma do incêndio.

Passam a ficar gravados os dois — `dados.perim` e `dados.sensDet`, versão 16 do estado,
declarados no mapa de posse e em `tipos/estacao.d.ts`. O perímetro é **simplificado por
Douglas-Peucker a 15 m** antes de ser gravado: um perímetro de incêndio traz por vezes
milhares de vértices, e é a diferença entre um ficheiro de ocorrência que se manda por
correio e um que não se manda. A tolerância fica bem abaixo da incerteza do próprio
traçado. Numa prova com 481 vértices ficaram 220, e a forma não muda à vista.

Uma ocorrência gravada antes desta versão não traz a geometria, e a migração **não a
inventa**: quem quiser o croqui volta a carregar o ficheiro.

### O croqui

Desenho SVG a partir do que está gravado, **sem rede e sem bibliotecas**, em projeção
equirrectangular local com a longitude corrigida pelo cosseno da latitude média. Traz o
perímetro, o ponto do PCO, os aglomerados e os sensíveis recolocados por distância e rumo,
barra de escala redonda, rosa dos ventos e a coordenada do canto. As cores vêm das
variáveis do tema, e no papel passam a tons de impressão.

**É congelado com cada PEA emitido**, pela mesma razão que o resto do instantâneo: um PEA
emitido é documento, e o documento tem de mostrar o teatro como ele estava à hora em que
saiu, não como está agora.

O cálculo do enquadramento saiu para `enquadrarCroqui`, separado do desenho — e devolve
também a projeção inversa (`lonDe`/`latDe`). O mapa operacional precisa exatamente da
mesma conta para saber que mosaicos pedir e onde os colar, e duas contas iguais em dois
sítios seriam duas contas a divergir.

Um croqui não é uma carta: não substitui a M888 nem serve para navegar, e a legenda di-lo.

### Os cartões dobráveis

A fita do tempo e a linha de evolução crescem sem limite: ao fim de horas de ocorrência o
painel de Operações era uma coluna de milhares de pixéis onde nada mais se encontrava.
Passam a abrir a pedido, com o cabeçalho sempre à vista **e a contagem nele** — fechar não
é esconder que existe. Nascem fechados, abrir um não fecha o outro, e na impressão abrem
sempre, que um documento não tem cartões para clicar.

`CARTOES_DOBRAVEIS` é registo declarado como os outros, com a célula, a norma e a razão, e
`auditarDobraveis` acende o mesmo aviso da posse na passagem de turno: um cartão declarado
que não dobrou fica com o corpo lá dentro e sem forma de o abrir.

### O que a verificação corrigiu na absorção

- **A contagem desaparecia em ecrã estreito.** A regra que esconde a etiqueta legal no
  cabeçalho abaixo dos 820 px apanhava também a contagem da linha de evolução, que é uma
  etiqueta reaproveitada — e o cartão ficava fechado sem dizer quantos registos tinha, que
  é a única coisa que se vê quando está fechado.
- **Duas linguagens para a mesma coisa.** A fita dizia «sem registos» e a evolução «0
  registos». Ficam ambas com a primeira.
- **Aritmética sobre cadeias.** O desenho arredondava as coordenadas antes de as somar, e
  `(x-4)` sobre uma cadeia era concatenação onde se queria conta. As coordenadas ficam em
  número até ao momento de as escrever.

### Verificação

401 testes, vinte e cinco novos em `tests/croqui.test.mjs`: a geometria que fica gravada,
a simplificação, as quatro formas de GeoJSON, o desenho, o escape do nome vindo do OSM, a
escala em seis ordens de grandeza, a projeção e o seu inverso, e os dobráveis. Verificado
em navegador nos dois temas e a 380 px.

## A rendição pede-se pela ampulheta, e a fase declara-se, na r0065

Dois atos que aconteciam fora da aplicação e não deixavam rasto nenhum.

### A solicitação de rendição

A rendição pede-se ao CSREPC **por veículo**, indicando o número de elementos, o meio que
entra, a hora de saída e a hora prevista de chegada ao destino — DON n.º 2, ponto
7.e.(5)(r). A aplicação media o tempo de cada unidade e dizia quando a rendição era
devida; o pedido em si era feito de cabeça, por rádio, e não ficava em lado nenhum.

**Pede-se pela ampulheta**, que era a sugestão do Ricardo e é a certa: quem vê a laranja
quase vazia é quem tem de agir, e a ação tem de estar onde está o sinal. O medidor de cada
unidade passa a ser botão; abre um painel com os tempos, quem determina, o GDH — e **o
texto do pedido já composto**, para não se transmitir de cabeça o que a norma manda
indicar. Fica registado na unidade, na evolução e na fita, e o chip passa a dizer «rend.
pedida».

O pedido pode ser retirado, porque retirar um pedido também é facto. E **pedir não é
render**: o que fica registado é a solicitação; a substituição regista-se quando acontecer,
movendo ou desmobilizando a unidade como sempre.

No quadro de rendições, em Logística, um bloco novo diz quem está para além do limite
**sem pedido nenhum** — que é a leitura que interessa a quem comanda — com um botão por
unidade que leva ao mesmo painel.

### A fase do SGO

Era um campo de formulário que mudava em silêncio: ninguém sabia quem a tinha declarado,
nem quando, nem se acompanhava o dispositivo. Passa a ser ato. A aplicação **sugere** a
partir do efetivo registado, quem comanda **declara**, e a declaração fica com autor e GDH
na evolução.

A escala das fases passa a estar declarada num sítio só — `FASES_SGO`, no catálogo — porque
a sugestão e a regra de conformidade a leem as duas e não podem discordar sobre o que é a
fase III. E a regra ganhou o caso que faltava: **fase por declarar com efetivo no terreno**
é obrigação, não é silêncio.

Um defeito apanhado na verificação em navegador: sem fase declarada, a linha dizia que «o
dispositivo já ultrapassou a fase declarada» — falava de uma coisa que não existia.

### Verificação

376 testes, doze novos. Verificado em navegador de ponta a ponta: a ampulheta abre o
painel, o texto sai completo com número de ocorrência, unidade, origem, operacionais, hora
de entrada e limite, e o chip passa a marcar o pedido sem ser preciso recarregar. Prova em
`docs/qa/` (`qa0018`).

## Não perder a ocorrência, na r0064 — a outra metade da etapa 1

O `localStorage` escrevia o estado numa chave e o arquivo noutra, sem transação conjunta,
com cinco megabytes de teto e sem sítio para mais nada. A pergunta era se o IndexedDB
serve em `file://`, que é como esta aplicação corre. **Medi antes de decidir: serve** — o
Chromium abre e escreve. Onde não abrir, fica a camada de trás e nada muda.

### A base entra depois do arranque, não durante

Abrir uma base é assíncrono e o `ARMAZEM` constrói-se no arranque. Fica como está, e
`prepararArmazem()` substitui a camada logo a seguir — **trazendo com ele o que estava
guardado**. Sem essa migração, quem abrisse a aplicação depois desta revisão encontrava o
arquivo vazio, com as ocorrências todas na camada anterior. Confirmado em navegador com
uma ocorrência deixada no `localStorage`: aparece do outro lado.

### O diário do posto

A fita do tempo vive dentro da ocorrência e desaparece com ela. O diário fica fora: cada
linha leva o resumo da anterior, e uma linha retirada pelo meio deixa a cadeia partida —
com o número da linha onde partiu. Não impede quem tem acesso ao equipamento de reescrever
o diário inteiro, e isso está escrito no código: para isso é preciso o serviço.

**Três versões até estar certo, e as duas primeiras perdiam linhas.** A primeira numerava
a partir de um contador em memória e escrevia com `put`: dois separadores abertos, dois
processos no mesmo número, e o segundo apagava o primeiro. A segunda usou `add` com
repetição em caso de choque — e ainda assim **perdeu três linhas em trinta** na prova com
duas abas em simultâneo. A terceira lê a cauda **dentro da própria transação**: as
transações do IndexedDB são serializadas pelo navegador, e isso dá o número e o elo certos
sem contadores, sem fechaduras e sem repetições. Trinta em trinta, cadeia íntegra.

Um registo que existe para não perder linhas não pode perder três em trinta — e nenhuma
das duas primeiras versões teria falhado num teste em jsdom, porque lá não há IndexedDB.

### As cópias de recuperação

Instantâneos do estado, de dez em dez minutos e sempre antes de repor — **recuperar não
pode ser destrutivo**: quem repõe a cópia errada tem de poder voltar. Ficam as vinte mais
recentes. O cartão diz também, quando é o caso, que sem IndexedDB só se guarda uma e o
diário fica limitado às últimas duzentas linhas: menos é melhor do que nada, desde que se
saiba qual dos dois se tem.

E fica escrito onde se lê: **não substituem a exportação para ficheiro.** Uma cópia no
mesmo disco não sobrevive ao disco.

### E a gravação passa a ser uma só

`persistir()` escreve o estado, a última ocorrência e o índice em **`setVarias`**, que é
uma transação onde há transação. `ARMAZEM.atomico` diz qual dos dois casos é, e o cartão
mostra-o.

### Verificação

364 testes, sete novos — e correm no caminho do recuo, que é o que o jsdom tem, o que é
útil por si. O caminho do IndexedDB verifica-se em navegador: migração, cadeia do diário,
duas abas em simultâneo e reposição de cópia. Prova em `docs/qa/` (`qa0017`).

## Quem regista, na r0064 — a primeira etapa das contas

A VCOC vai ter servidor, e as contas ficaram decididas: constroem-se de raiz. Esta revisão
faz **o que é real sem servidor**, e escreve o contrato do que precisa dele.

### Identidade declarada, com esse nome

Sem serviço, qualquer palavra-passe verificada dentro de um ficheiro que se distribui é
teatro: o segredo viaja com a aplicação e quem a abre lê-o. O que se pode fazer — e vale
por si — é **atribuir** o registo: quem assume o teclado declara-se, e cada ato de comando
passa a ficar com esse nome. A aprovação do PEA, o encerramento e a passagem de turno
propõem sozinhos quem está ao teclado.

A diferença entre um registo anónimo e um registo atribuído é grande; entre um atribuído e
um autenticado também. **O cartão diz as duas coisas nas palavras certas** — «identidade
declarada — não é autenticação», «nada é verificado», «o perfil escolhe-se em vez de se
provar, o que previne o engano e não impede o abuso» — e diz que a autenticação chega com
o serviço da VCOC.

### Sete perfis, com efeito

`PERFIS` declara o que cada um pode: observador, operador de registo, as três células, COS
ou adjunto de comando, e administração. Um observador não escreve na evolução; um operador
de registo não aprova um PEA; encerrar o registo é de quem comanda. A recusa diz o perfil
declarado e onde se resolve.

**Sem ninguém declarado, pode tudo.** Um PCO a meio de uma ocorrência não pára para se
apresentar, e uma aplicação que se transforme em obstáculo por um campo vazio é uma
aplicação que se contorna. O que a Estação faz nesse caso é pedir o nome no momento do ato.

A sessão vive fora da ocorrência, como o catálogo de elementos: sobrevive-lhe, não entra no
PEA e não viaja na exportação. Só viaja o nome que ficou dentro de um ato.

### O contrato do serviço

`docs/interop/CSREPCDouro_202608301515_ContratoServicoVCOC_v01_CLD.md`, para o servidor da
VCOC ser construído em paralelo. O essencial: contas de pessoas e nunca de postos, segundo
fator obrigatório para COS e administração, envio de **estados** com cadeia de resumos, e
**recibo assinado pelo serviço** — que é o que dá não-repúdio, porque a chave não viaja com
o ficheiro. E a regra que governa tudo: nenhuma operação da Estação bloqueia à espera do
serviço.

### A numeração, que já colidiu uma vez

Existem duas r0058 diferentes, uma de cada linhagem. A montagem passa a ler
`app/RESERVADAS.md`, onde se declaram os números que a outra linhagem já usou mas que ainda
não chegaram aqui — hoje, a r0063. Esta revisão é a **r0064** por causa disso.

### Verificação

357 testes, oito novos sobre a identidade e os perfis. Confirmado em navegador: com o
perfil de observador a evolução recusa e explica; mudando para COS, regista. Prova em
`docs/qa/` (`qa0016`).

## A previsão que fica, na r0060

O último ponto da lista da análise. A série já sobrevivia ao fecho da página, dentro de
`csv`; o que se perdia era tudo o resto — de que fonte veio, a que horas, para que ponto,
e se alguém lhe mexeu depois de chegar. **Uma previsão de ontem lê-se igual a uma de há dez
minutos quando ninguém diz a idade**, e é sobre ela que se decidem a janela de consolidação,
as horas críticas e as rotações de vento.

O ramo `meteo` guarda a proveniência. A linha por cima do meteograma diz sempre: «Última
previsão: Open-Meteo (síntese ECMWF/ICON/GFS), obtida há 2 h 00 min — 301151AGO26 · ponto
41.2029, -7.2149 · 36 h». Passadas **3 h** avisa que está desatualizada, a âmbar e a negrito.

**Sem rede, mantém-se o que há.** Antes, uma falha de rede deixava a mensagem de erro e o
meteograma como estivesse. Agora repõe-se a série retida no ecrã, refaz-se a análise, e
diz-se a idade: *«Previsão automática indisponível: falha de rede — mantém-se a última
obtida, de há 2 h 00 min.»* Um meteograma velho serve para decidir; um meteograma vazio
não serve para nada. O que não pode é o oficial não saber qual dos dois tem à frente.

### E a série alterada à mão

O CSV é editável antes de analisar, e deve continuar a ser — é assim que se corrige um erro
de importação. Mas a série alterada não é a que a fonte deu, e a análise que sai dela também
não. Guarda-se o **resumo SHA-256 da série como chegou**, e não uma segunda cópia dela: se o
que se analisa não bate com o que se recebeu, fica assinalado na linha da proveniência e na
fita do tempo. Era outro dos pontos da análise, e sai barato por o carimbo já existir.

### Verificação

349 testes, quatro novos. Confirmado em navegador com a rede cortada ao servidor da
Open-Meteo: a série retida volta ao ecrã, a análise refaz-se, e as duas linhas dizem a
idade e a proveniência.

## E o que vinha a seguir: o ficheiro que entra, na r0060

Dois dos três pontos que a análise punha logo a seguir aos P0.

### Um carimbo que não confere passa a exigir decisão

Continua a não haver recusa automática — num PCO pode ser preferível recuperar um ficheiro
suspeito do que ficar sem nada —, mas a decisão passa a ser de quem está ao teclado, e não
da aplicação. E há uma coisa que a análise apanhou bem: **o aviso do ecrã apaga-se ao fim
de cinco segundos e meio.** O que fica é o ramo `integridade`: `valida`, `legado` (ficheiro
de uma revisão anterior à do carimbo) ou `falhou`. Fica escrito por baixo da identificação
enquanto a ocorrência existir, a vermelho e a negrito no caso do não verificado, e
**acompanha-a nas exportações seguintes** — quem receber o ficheiro a seguir vê de onde ele
veio.

### A forma da ocorrência importada

Um pacote era aceite com três perguntas: é JSON, é objeto, tem `meta`. Tudo o resto entrava
como viesse — um `evolucao` que não fosse lista, um `txt` que fosse um objeto, chegavam
assim aos construtores de HTML.

`FORMA_OCORRENCIA` declara o tipo de cada ramo e os campos obrigatórios das três listas que
importam. **Não recusa**: corrige, retira o que não tem forma de registo, e **conta o que
corrigiu** — na fita, na evolução e no aviso. Num posto de comando um ficheiro com um campo
estragado ainda é a ocorrência; recusá-lo inteiro é que podia ser a diferença entre ter o
registo e não ter nada.

Um ramo **em falta** não é acusado: isso é idade do ficheiro, e a escada de migrações é que
trata dela. A forma confere-se depois da migração, precisamente por isso.

### Verificação

345 testes, cinco novos: a marca de verificado, o ficheiro legado, a recusa da decisão a
cancelar a importação inteira, a marca a acompanhar a exportação seguinte, e a forma
corrigida com a linha boa preservada.

**Fica por fazer**, do que a análise listou: reter a última previsão meteorológica para
que uma perda de rede não deixe o meteograma vazio.

## Robustecimento 3 de 3: a aprovação do COS existe, na r0060

Era o achado que menos tinha de informático. O `emitirPEA` chamava o `gerarOrdens` no
instante seguinte ao `gerarPEA`, e o contexto entregue ao modelo dizia **«a célula de
planeamento elaborou o plano n.º X e o COS aprovou-o»**, passando-lhe um «PLANO
ESTRATÉGICO DE AÇÃO APROVADO». Não havia aprovação nenhuma pelo meio. O botão dizia
«Emitir proposta» e o documento impresso trazia a linha «Aprovado — O COS: ______».

**A aplicação declarava ao modelo um ato de comando que não tinha acontecido.**

### Três estados, e o facto operacional que os fixa

O Ricardo pôs o ponto que faltava: **o COS aprova depois de ter o PEA impresso à sua
frente.** A aplicação não é onde a aprovação acontece; é onde ela fica registada.

| Estado | O que é |
|---|---|
| **Proposta** | Elaborada pela célula de planeamento. Ainda não saiu do ecrã. |
| **Em análise** | Entregue ao COS. O documento está impresso e com quem decide. |
| **Aprovado** | Determinado pelo COS, com nome, função e GDH. |

`peaVigor()` passa a ser **o último aprovado**, e não o último elaborado: o que está em
vigor é o que o COS determinou. `peaUltimo()` serve para mostrar a proposta enquanto ela
espera.

### As ordens de missão nascem na aprovação

É a única mudança que altera comportamento a sério, e é doutrinária: a célula de operações
transmite as ordens **depois** de o plano estar aprovado — art. 17.º, n.º 1, al. c). Uma
proposta por aprovar não tem ordens nenhumas para transmitir, e o controlo de execução
nasce vazio.

O contexto entregue ao modelo passa a dizer a verdade, com o nome e o GDH que ficaram
registados: «o COS Cmdt Silva aprovou-o e determinou-o em 281400AGO26».

### O que a regra dos 90 minutos passa a ver

Uma proposta por aprovar deixa de fechar a obrigação do ataque ampliado — mas também não
a deixa vermelha como se nada existisse. Ganha aviso próprio, que diz onde está a proposta
e qual é o passo seguinte: entregar, ou registar a aprovação.

### A migração não reescreve a história

Os PEA que já existem foram emitidos num modelo em que emitir valia por aprovar. Marcá-los
«proposta» apagaria o PEA em vigor de ocorrências que o têm e mudaria o veredicto de
regras de conformidade sobre factos passados. Ficam **aprovados**, com o GDH da emissão e
a nota de que a aprovação não foi registada à parte — que é a verdade.

### Verificação

340 testes, cinco novos: a proposta nasce sem ordens e não está em vigor, a entrega é
registo e não aprovação, a aprovação exige quem determina e um GDH que exista, o PEA em
vigor é o último aprovado, e os PEA anteriores atravessam a migração sem perder o vigor.
Fluxo completo confirmado em navegador — proposta, entrega, aprovação, e as três missões a
aparecerem só no fim. Prova em `docs/qa/` (`qa0015`).

## Robustecimento 2 de 3: o GDH deixa de inventar datas, na r0060

O `Date` do JavaScript normaliza o impossível em silêncio: `new Date(2026,1,31)` dá 3 de
março. O `parseGDH` construía a data e testava `isNaN`, que achava tudo bem. **`311000FEV26`
entrava e ficava registado como 3 de março às 10h00.** Também `321000JAN26` (dia 32),
`292400FEV26` (hora 24) e `291000FEV25` (29 de fevereiro num ano que não é bissexto).

Num sistema em que os tempos governam as rendições, os noventa minutos do ataque
ampliado, a validade do PEA e a sequência documental, **um erro de dedo convertido noutra
data válida é pior do que uma recusa** — porque ninguém dá por ele.

### Validação por ida e volta

Constrói-se a data e conferem-se os cinco componentes: se algum voltar diferente do que
entrou, a data não existe. Apanha os quatro casos acima, os das pontas (dia zero, minuto
60, mês inexistente) e ainda a hora que não existe na noite da mudança para a hora de
verão — recusa correta, ainda que rara.

`motivoGDH()` diz porquê, em português e para o oficial ler: «O mês de FEV de 2026 não tem
dia 31.» Recusar sem explicar é meio caminho para se escrever outra coisa qualquer até o
campo deixar de reclamar.

### Todas as portas, e um guarda só

Havia seis campos de GDH e a validação não estava em nenhum — a evolução aceitava
`$("e-gdh").value.trim()`, o que fazia de «ABCD» um GDH tão bom como outro. Passam todos
por `gdhDoCampo()`: recusa, marca o campo, explica e devolve o foco. A validação não pode
viver em cada botão, senão o próximo campo nasce sem ela.

E o campo assinala-se **enquanto se escreve**, com a aresta vermelha e o motivo no título.
Dizê-lo só ao carregar no botão é dizê-lo tarde, com o oficial já noutro campo.

Quando o GDH é recusado, **o texto do registo não se perde**: fica no campo, à espera da
data certa.

### Verificação

335 testes, nove novos: o parser contra os cinco casos da análise e mais seis das pontas,
cada motivo de recusa, e cada uma das quatro portas — evolução, meio aéreo, nomeação e
passagem de turno. Confirmado em navegador: o campo marca-se ao escrever e a evolução
recusa com «Dia 32 não existe.»

Falta o terceiro: **a aprovação do COS antes das ordens de missão.**

## Robustecimento 1 de 3: o XSS fechado, na r0060

Chegou uma análise clínica externa à r0051 e à r0057 (em `docs/`, com o nome com que veio).
Aponta cinco bloqueios; verifiquei-os um a um contra o código e **três confirmam-se**. Este
é o primeiro.

### O buraco era real, e reproduzi-o

`esc()` escapava `<`, `>` e `&` e deixava passar as aspas. Chega para texto entre
etiquetas; não chega para dentro de um atributo, que é onde a aplicação também o usa —
`value="${esc(x.cmd)}"`. Escrevi `X" onfocus="window.__mau=1" autofocus zz="` no nome de
um comandante de setor e o `<input>` no ecrã ficou com os atributos `onfocus` e
`autofocus` **a sério**. O mesmo valor entra por um ficheiro importado de outro posto.

O pior sítio era o arquivo: `onclick="abrirOcc('${esc(x.num)}')"`. Ali o dado cai dentro
de uma **string de JavaScript**, e o escape de HTML não protege esse contexto — o
navegador desfaz a entidade antes de o JavaScript ver o texto. Uma plica no número da
ocorrência, que é campo livre, era execução de código arbitrário.

### O que se fez

1. **`esc()` passa a escapar as cinco.** `<`, `>`, `&`, `"` e `'`. Fecha de uma vez todos
   os atributos escapados. Verifiquei que nenhum `esc()` alimenta texto puro, onde as
   entidades apareceriam à vista.
2. **Nenhum manipulador de eventos em linha leva dados.** Os dois do arquivo passaram a
   `data-occ-abrir` / `data-occ-apagar` com ouvintes; o `irPara` da lista de pendências
   também, embora o valor fosse interno — uma forma perigosa não se mantém porque hoje o
   valor é de confiança.
3. **Escape em todos os atributos com dados**, incluindo os que ninguém tinha como
   suspeitos.

**O escape não dispensa tirar os dados de dentro do HTML concatenado**, que é o trabalho
de fundo e fica para depois dos outros dois P0. O que fica fechado agora é a porta.

### Dois testes que valem mais do que a correção

O primeiro injeta o veneno — aspa dupla, plica e `<img onerror>` — nos campos de setor, na
passagem de turno, no arquivo, no catálogo de elementos e **numa ocorrência inteira**, manda
pintar e conta o que apareceu de proibido no DOM. Compara com o retrato de antes, porque a
página tem marcação sua com `onclick`.

O segundo é estático, sobre `fonte/`: recusa manipuladores em linha com dados
interpolados, e recusa qualquer atributo com dados que não passe pelo escape. Só
contadores de ciclo entram crus — escapar um número não custa nada, e a exceção que se
abre hoje é a que amanhã leva um nome lá dentro.

**Este segundo teste apanhou dois sítios que o meu próprio inventário falhou**: `mVal` e
`oVal` na linha do setor. Parecem calculados, e são — mas só quando há tipologias
atribuídas; sem elas são o que o oficial escreveu à mão.

### Verificação

326 testes, oito novos. Confirmado também em navegador a sério: com veneno no comandante,
no adjunto, no contacto, no número da ocorrência e na passagem de turno, nada corre, não
nasce um único atributo, e o texto do oficial sobrevive inteiro — aspas incluídas.

Faltam os outros dois: **GDH estrito** e **aprovação do COS antes das ordens**.

## A linhagem paralela outra vez, na r0058

Vieram quatro guiões novos — p0010 a p0013 — construídos sobre a **minha r0053**, e as
entregas r0056 e r0057 que deles saíram. Aplicados por cima da r0053 reproduzem a r0057
que veio no repositório, byte a byte, tirando o carimbo da revisão no rodapé. As 58 trocas
foram absorvidas em `fonte/`, cada uma no módulo que a continha, e a montagem reproduz de
novo o mesmo ficheiro. **A convergência mantém-se: há uma história só.**

O que os quatro trazem:

- **p0010 — a numeração morta.** A arrumação por células acabou com o fluxo numerado e
  deixou 47 rótulos a dizer «define os setores na secção 2». A aplicação mandava o oficial
  a um sítio que já não existe. Ficam três referências, todas ao documento do contrato de
  interoperação, que tem secções numeradas a sério.
- **p0011 — a ajuda dobrável.** Cada painel abria com quinhentas palavras antes do
  primeiro campo. O título fica sempre visível, o corpo paga-se a pedido.
- **p0012 — hierarquia tipográfica.** Trinta e cinco `text-transform:uppercase`, com o
  rótulo do número da ocorrência tratado como «Pasta (localização de arquivo)». Rótulos e
  sub-títulos em caixa de frase, citações da norma a recuar, e o campo-âncora de cada
  cartão com destaque próprio.
- **p0013 — quatro correções de uso.** O alinhamento da grelha na identificação; os dois
  quadros de rendições que a arrumação por células juntou na mesma sala; o sinal de avisos
  que ia ao topo do painel em vez de ir aos avisos; e o catálogo de elementos que obrigava
  a apagar para corrigir.

### Duas correções minhas por cima

**A ajuda dobrável não cumpria o que o guião prometia.** «Fechado por omissão», dizia — e
depois `alternarAjuda` abria todos os blocos porque o interruptor global está ligado, que
é o estado normal. O muro voltava inteiro no primeiro arranque. O interruptor mostra e
esconde a ajuda; cada título abre o seu corpo, e nenhum abre sozinho.

E `av.offsetTop` num `Element` é diagnóstico de tipos: a linhagem paralela não corre o
verificador, e a conversão fica declarada onde é precisa.

### Verificação

318 testes, quatro novos sobre o que veio: nenhum rótulo aponta para secção numerada que
já não exista, a ajuda abre fechada e abre um bloco de cada vez, há um só quadro de
rendições, e o catálogo corrige sem apagar.

### E cinco documentos de fonte

Chegaram também cinco documentos científicos sobre propagação — declives e vento, canhões,
modelos de propagação, o guia de comportamento em pradaria e o livro dos planos municipais
de defesa da floresta. Ficam em `docs/fontes/`. **Ainda não sustentam código nenhum**: por
enquanto são leitura, e enquanto não forem citados por uma regra não entram em
`FONTES.md`.

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
| r0033 | 281713 | paralela | Chegou em ficheiro ao mesmo tempo que a r0032 e **ficou três dias fora de `app/`**, por lapso de arrumação e não por decisão. Arquivada agora, com as outras. O que trouxe está absorvido em `fonte/` desde a fusão da r0034 |
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

## r0074 — o motor de propagação, e o número que faltava

Absorvida a **r0073 da linhagem paralela** (p0019/t0019/q0019). Traz o que estava em falta
desde o princípio da cadeia de comportamento do fogo: **a velocidade de propagação**. Até
aqui a aplicação pedia R ao utilizador e não sabia estimá-lo, e o `docs/FONTES.md` dizia,
com razão, que não havia fonte que o desse para os combustíveis do Douro.

### O que entrou

- `fonte/3-planeamento/21-modelos-de-combustivel.js` — os 18 modelos de combustível para
  Portugal com o intervalo de carga fina de cada um, os quadros do fogo controlado
  (humidade do combustível morto, vento à superfície, propagação em matos, propagação em
  pinheiro bravo), e a ponte para a razão declive/vento de Viegas.
- O painel de estimativa no separador do planeamento, logo acima da intensidade da frente,
  com passagem direta do resultado para os campos que já lá estavam.
- Migração 24 → 25, com `dados.fogo.est`.
- `tests/propagacao.test.mjs` — 28 testes.
- A chave `FOGOPT` em `docs/FONTES.md` e a secção nova no `docs/MANUAL.md`.

### O que se corrigiu ao absorver

- **Uma entrega apagada.** A r0072 tinha sido committed e empurrada, e foi apagada para
  remontar o mesmo número — exatamente o que a regra proíbe. Reposta, e este trabalho saiu
  na r0074. A r0073 é da linhagem paralela e está declarada em `app/RESERVADAS.md`.
- **`DECLIVE_CLASSE` estava escrito e ninguém o usava** — apanhado pelo `npm run lint`. O
  painel do relevo já declara a classe de declive e o painel da propagação obrigava a
  escrevê-la outra vez. Passou a haver «Preencher declive do relevo», que traz o centro da
  classe **e diz que é o centro de uma classe**: enchê-lo em silêncio faria passar por
  medido um valor que é um intervalo inteiro.
- O teste que conta degraus da escada de migrações continuava a esperar 24.

### O que fica em aberto, e é preciso não esquecer

Os quadros **foram transcritos de dois documentos que este repositório não tem** — o manual
de fogo controlado de Fernandes, Botelho & Loureiro (2002b) e os modelos de Fernandes &
Loureiro (2021). A existência e a referência do primeiro estão confirmadas: Fernandes
(2003), que está em `docs/fontes/`, cita-o na bibliografia. A coerência interna dos quadros
está verificada por teste — monotonia no vento e na humidade em todas as células, domínios
respeitados, nenhuma velocidade negativa, extremo superior dentro do que Alexander (2000)
reconhece.

**O que não está verificado é a transcrição contra o impresso.** Uma tabela mal copiada
passa em qualquer teste de coerência e devolve comportamento do fogo errado com toda a
confiança do mundo. Pedem-se os dois documentos em PDF para `docs/fontes/`.

## Pasta de entrada

Criada `entrada/`, para se largar lá o que chegar de fora antes de estar arrumado. O
`entrada/README.md` diz para onde vai cada tipo de ficheiro. Não é arquivo: esvazia-se.

## r0075 — arrumar o repositório, e a máquina que o mantém arrumado

Sessão de arrumação, pedida em cima da r0074. Encontraram-se **47 ficheiros por arrumar** em
quatro pastas, e o que os pôs assim foi sempre o mesmo: entra um ficheiro com o nome que
trazia, ninguém escreve a linha no catálogo da pasta, e meses depois ninguém sabe o que
aquilo é nem se pode sair.

### O que se arrumou

- **`docs/qa/`** — sete provas de verificação tinham nome de rascunho (`qa0019-croqui-claro.png`
  e companhia) e outras sete traziam a revisão no lugar do carimbo de data. Todas as catorze
  passaram à convenção. Nove provas antigas, das `qa0002` às `qa0005`, estavam na pasta desde
  a arrumação da raiz **sem uma única linha que dissesse o que provavam**: ficaram catalogadas,
  e a revisão de cada uma foi apurada, não deduzida — duas trazem-na impressa no rodapé da
  própria captura, uma vem do guião que a produziu, e a quarta é atribuída pelo carimbo.
- **`ferramentas/historico/`** — seis guiões de 31 de agosto chegaram com os campos do nome
  trocados e foram postos na ordem da convenção. Dezoito guiões não estavam no `README.md`
  da pasta: ficaram, com o que fizeram e a revisão que produziram.
- **`docs/fontes/`** — **cinco documentos estavam na pasta sem entrada em `FONTES.md`**, o que
  é exatamente o que a regra da pasta proíbe. Ficam numa secção nova, «Recebidos e por ler»,
  nomeados pelo que a folha de rosto diz e por mais nada. Dois deles merecem atenção quando
  houver tempo: o estado da arte de André e Viegas, em português e para utilizadores, e o
  *Fire Spread in Canyons* de Viegas e Pita — **o teatro do Douro é vale encaixado, e a
  aplicação não diz nada sobre o que o vale faz à propagação**.
- **`docs/README.md`** — quatro documentos não estavam na tabela, entre eles duas versões
  posteriores da especificação que podiam passar por ser a que está em vigor. Ficou dito que
  não são.

### A máquina, que é o que faz isto durar

`ferramentas/arrumado.mjs`, `npm run arrumado`, dentro do `npm run tudo`. Cada pasta catalogada
declara a forma do nome que aceita e o documento que a cataloga, e todo o ficheiro tem de
cumprir as duas coisas. Aceita a citação com reticências no lugar do carimbo, que é como os
catálogos já citavam famílias de ficheiros da mesma revisão.

**O que a ferramenta não faz é ler.** Não sabe se a linha do catálogo descreve o ficheiro ou
mente sobre ele. Garante que existe uma linha, que é o mínimo para que alguém possa dar pela
mentira. O teste que a acompanha prova que ela vê: escreve um ficheiro por catalogar e outro
com nome de rascunho, confere que ambos são apanhados, e apaga-os.

### Um defeito de tipos que passou despercebido na r0074

O `npm run tudo` da r0074 **parou no `lint` e eu li o resultado com um filtro que escondia o
resto**. O `npm run tipos` tinha um diagnóstico novo por resolver: `parseInt(E.tipoPin ||
m.tipoPin, 10)`, em que o primeiro é texto vindo do estado e o segundo é número vindo do
registo. O `parseInt` aceita os dois em silêncio. Corrigido, com teste que confere que o tipo
do registo e o do estado dão o mesmo resultado. A r0074 ficou entregue com o portão por
fechar; a r0075 fecha-o.

### `entrada/`

A pasta para largar o que chega de fora, criada na sessão anterior, continua vazia à espera.

## r0076 — o recado do outro lado, e o defeito que ele revelou

Chegou ponto de situação da linhagem paralela. Duas coisas dele exigiram trabalho já.

### A base local abria por um número fixo, e isso partia contra a base deles

O recado diz que **a base IndexedDB subiu de 2 para 3** do lado de lá, com a loja `folhas` do
`p0018`. Esta entrega abria com `indexedDB.open("peaapp", 2)`, e um número fixo só funciona
enquanto uma única linhagem escrever na base. **A base é partilhada por origem, não por
entrega**: quem corresse a entrega deles e depois esta, no mesmo navegador, ficava sem base.

O defeito foi reproduzido antes de ser corrigido, em Chromium a sério: abrir na 2 uma base que
está na 3 dá `VersionError — The requested version (2) is less than the existing version (3)`,
que chega pelo `onerror` e aqui virava `res(null)`. A partir daí **não havia diário, não havia
cópias de recuperação e não havia mosaicos de carta guardados, e nada no ecrã dizia porquê**:
de todos os sítios que usam a base, só o painel da carta pré-descarregada se queixa quando ela
falta. Num PCO com a rede em baixo, é exatamente o que não pode acontecer em silêncio.

A correção: **adota-se a versão que a base tiver**, e sobe-se um degrau acima dela só quando
falta alguma loja. Uma base mais recente do que a que esta entrega conhece serve como está, as
lojas da outra linhagem não se perdem, e a versão nunca desce. Provado no mesmo Chromium —
abre na 4, com `chaves`, `copias`, `diario`, `folhas` e `mosaicos`, e escreve.

Fica `ferramentas/prova-idb.mjs` no repositório. Não entra no `npm run tudo` porque precisa de
navegador e de origem HTTP — o Chromium não dá IndexedDB em `file://` —, mas corre-se à mão
quando se mexer na abertura da base. É ela que confere a fidelidade do `indexedDB` de imitação
usado em `tests/armazem-idb.test.mjs`: um teste contra uma imitação prova a lógica, não prova
que a imitação é fiel.

### Existem duas r0074

Como já houve duas r0058. A desta linhagem é a absorção do motor de propagação, das 21h54; a
da paralela é o `p0020` sobre a r0070, e soube-se dela por recado depois de a nossa ter saído.
**A reserva só evita a colisão quando o número é declarado antes de ser usado.** Ficam ambas,
distintas pelo carimbo, com a razão escrita em `app/RESERVADAS.md`. O número livre seguinte é
o **r0077**: esta linhagem já usou a r0075 e a r0076.

### O que fica pendente do recado

Em `docs/POREXECUTAR.md`, com detalhe. O essencial: **o `p0020` não chegou** e sem ele não há
o que absorver; a escada de migrações divergiu (eles na versão de estado 22, esta na 25), pelo
que um degrau do `p0020` terá de entrar no fim da escada daqui e não com o número que traz; e
as missões do PEA por alinhar com as propostas ficam para quando esse ficheiro chegar, porque é
provável que mexam no mesmo sítio.

## r0077 — o ambiente de fogo entra no plano

Absorvido o `p0020` da linhagem paralela, que chegou logo a seguir ao recado. É a correção de
uma falha estrutural, e não uma funcionalidade nova.

### O que estava mal

Havia **dois** coletores a alimentar o PEA — `retratoOperacional()` para o dispositivo e
`metricas()` para a meteorologia — e nenhum para o resto. Os painéis do relevo, do
combustível, da propagação, da intensidade, das frentes e das linhas escreviam no estado,
pintavam o seu ecrã, e ninguém os juntava. A auditoria do outro lado conta-o assim: de onze
painéis que produzem informação, **cinco não chegavam ao PEA por via nenhuma** e três chegavam
só à via do modelo de linguagem.

O resultado via-se no papel. A aplicação calculava que acima dos 4 000 kW/m atacar diretamente
a cabeça é inconsequente, e emitia a seguir um plano a dizer «postura defensiva fora da
janela», com fundamento genérico — **a mesma frase que sairia para um incêndio de 200 kW/m**.

### O que entrou

`fonte/3-planeamento/22-ambiente-de-fogo.js`, o terceiro coletor: `retratoDoFogo()` reúne
terreno, combustível, comportamento e o que está traçado no teatro; `resumoDoFogo()` di-lo numa
passagem. Ligado às duas vias — vai no contexto do modelo de linguagem e entra na decisão
determinística. Daí saem oito propostas fundadas em números com fonte, **à frente das
genéricas**, porque a intensidade decide se há sequer ataque à cabeça, e essa decisão precede a
ordem de esforço. E a distância de segurança passa a ir em metros nas medidas de segurança.

Cada grandeza leva a **origem da prova** — R observado no teatro ou estimado pelos guias. Sobre
isto o outro lado retirou uma proposta que tinha feito, de graduar a força das propostas
conforme a origem, e retirou-a bem: o PEA é aprovado pelo COS (art. 27.º, n.º 1, al. a)), é a
aprovação que confere força, e não cabe à aplicação enfraquecer a sua própria proposta para se
precaver. O que lhe cabe é pôr a qualidade da prova à vista.

`tests/ambiente-de-fogo.test.mjs`, 17 testes. O que se verifica não é que o retrato existe: é
que **o plano muda quando ele muda** — as quatro faixas de intensidade dão quatro manobras
diferentes, e um fogo de 60 m/h deixa de receber a frase de um de 3 192.

### Três coisas que se corrigiram ao absorver

- **`FOLHAS` e `folhaCalibrada` não existem deste lado** — são as folhas calibradas da linhagem
  paralela. O ramo saiu em vez de ficar escrito a apontar para o vazio; quando as folhas forem
  absorvidas, a cartografia do retrato volta a nomeá-las. Apanhado pelo `npm run lint`.
- **Os recuos `D.fogo || {r:"",w:""}` e `F.est || {}` alargavam o tipo até ele deixar de dizer
  nada**: o verificador passou a não saber que `est` tem `modelo` nem `hcm`. Saíram. Os dois
  ramos são garantidos pelo `novoEstado` e pela escada de migrações, e defender-se do que a
  escada promete é desconfiar do próprio contrato e perder a verificação em troca de nada.
- **Os `id` das propostas — `PI`, `PL`, `PQ` — são decorativos**: `detDecisao` renumera tudo
  para `P1..Pn` no fim. Os testes procuram pelo texto e pela posição; procurar pelo `id` daria
  um teste a garantir que não há proposta quando ela lá está.

Sem migração: o `p0020` não muda a forma do estado. A versão continua na 25.

### A colisão da r0074 fecha-se aqui

O guião chegou, está absorvido e arquivado. Continuam a existir duas r0074, e continua a estar
escrito porquê. Esta linhagem já usou a r0075, a r0076 e a r0077: **o número seguinte livre é o
r0078**.

## 1 de setembro — a grande arrumação, e o Manual que chegou

Chegaram **255 ficheiros** num descarregamento para o ramo `main`. Destes, **144 já cá
estavam byte a byte** e 111 eram conteúdo novo. Ficaram todos arrumados por natureza, e o
`npm run arrumado` passou a cobrir seis pastas em vez de cinco.

### O achado que interessa mais do que a arrumação

**O Manual de Formação para a Técnica do Fogo Controlado está em `docs/fontes/`.** É o
documento que a chave `FOGOPT` dizia que este repositório não tinha, e de onde saíram todos os
quadros do motor de propagação. A capa e a folha de rosto foram lidas: *Paulo Fernandes,
Hermínio Botelho, Carlos Loureiro, UTAD, 2002*, 144 páginas. É exatamente a referência que a
bibliografia do Fernandes (2003) cita.

**O que isto muda, e o que não muda.** Muda a natureza da reserva: até aqui era «não há como
conferir a transcrição», agora é «está por conferir», que é outra coisa. Não muda os números:
continuam a valer sob reserva enquanto ninguém abrir o manual e comparar célula a célula. E há
uma dificuldade prática registada na `FOGOPT`: **o PDF é digitalizado e não tem camada de
texto**, pelo que a conferência não se faz por máquina — são seis quadros e algumas centenas
de células, à vista.

Chegou também a **PT-FireSprd** (Benali et al., 2023), a base de velocidades de propagação
medidas em grandes incêndios portugueses, com Paulo Fernandes entre os autores. Declarada em
`FONTES.md` como recebida e por ler. É, à primeira vista, o que permitiria confrontar o que o
motor de fogo controlado estima com o que se mediu em incêndios de verão — **o que não é o
mesmo que validá-lo**, e a diferença entre as duas coisas é a que esta aplicação não pode
confundir.

### O buraco do histórico fechou-se

O `app/README.md` dizia que **a série `r0007` a `r0013` não existia em nenhuma origem
conhecida**. Existe: chegou inteira. A numeração corre agora sem falhas da `r0005` à `r0077`.
Continua a faltar só a `r0004`. Vieram também vinte e cinco montagens anteriores à convenção
de revisões, duas delas anteriores ao próprio nome do projeto.

### O resto, por pasta

| Onde | O que entrou |
|---|---|
| `app/` | A série que faltava, mais `r0061` a `r0063`, a `r0070`, as pré-convenção, e a **`r0074` da linhagem paralela** — a gémea da colisão |
| `ferramentas/historico/` | Oito guiões: croqui (`p0016`, `p0017`), **folha calibrada (`p0018`)**, e os guiões de captura `q0018` e `q0020` |
| `docs/qa/` | Cinco provas: o croqui no PEA impresso, a calibração da folha, e a propagação com a recusa acima de 25 °C |
| `docs/fontes/` | O Manual de 2002 e a PT-FireSprd |
| `docs/` | Duas versões da especificação, a análise do GetCapabilities da DGT, o composto vento-declive, o `ESTADO.md` da linhagem paralela e uma exportação de conversa |
| `docs/interop/` | O recado de volta que produziu a v1.2 |
| **`docs/pea-reais/`** (nova) | **Cinco PEA emitidos no Castedo a 17 de agosto**, no formato oficial, por quem estava no PCO |
| `tests/fixtures/` | Uma previsão SpotWx verdadeira, de dez dias |

### A numeração dos guiões também tinha colidido

Existem **dois `p0017`** (croqui com escala a 30 de agosto, carta pré-descarregada a 31), dois
`t0017`, e **dois `p0018`** (cartões dobráveis a 30, folha calibrada a 31). Ficam ambos,
distintos pelo carimbo, pela mesma razão das duas `r0058` e das duas `r0074`. Fica escrito no
`ferramentas/historico/README.md`.

### O que se acrescentou de verificação

- `docs/pea-reais/` entrou no `npm run arrumado`, com forma de nome e catálogo próprios.
- `tests/previsao-real.test.mjs`, cinco testes contra a previsão verdadeira: 240 horas lidas
  sem perder nenhuma, nenhum campo a sair `NaN` — **uma hora com `NaN` não rebenta nada,
  desenha-se em branco e desaparece da análise, que é a forma mais silenciosa de perder
  previsão** —, a série a atravessar a mudança de mês sem se desordenar, e o meteograma a
  desenhar dez dias sem uma coordenada inválida.

### O que ficou de fora, e porquê

Nove `.docx` chegaram e ficaram seis: **quatro eram cópias byte a byte** do mesmo `PEA02rev2`,
numeradas `(1)` a `(3)` pelo descarregador. Das montagens de trabalho da linhagem paralela —
quatro `r0066`, quatro `r0072`, três `r0070`, uma `r0060` e uma `r0064` — fica **uma por
número**, que é a regra do projeto; as outras vivem no histórico do `main`. E o `LEIAME.md` da
pasta de exemplos que veio no descarregamento é a versão da v1.1, anterior à que aqui está.


## O `main` alinhado, sem perder o que lá estava

O descarregamento tinha ficado no `main`, com 255 ficheiros na raiz e na `entrada/`. Ficou
alinhado com o trabalho, e **por merge e não por reescrita**: o `main` já continha esta
linhagem até à `r0077`, e divergia só nos onze commits do descarregamento. Trazê-lo para cá e
depois avançar o `main` mantém todos esses commits alcançáveis — apontar o `main` para outro
sítio teria órfão o que eles trouxeram.

Antes de apagar seja o que for, conferiu-se **ficheiro a ficheiro, por resumo SHA-256**, que o
conteúdo estava guardado noutro sítio. Dos 255, **226 estavam já arrumados byte a byte**. Os
restantes 30 são descartes deliberados, e ficam nomeados aqui para que ninguém tenha de os
adivinhar:

| O que é | Quantos | Porquê se descarta |
|---|---|---|
| Montagens de trabalho da linhagem paralela — quatro `r0066`, quatro `r0072`, duas `r0070`, uma `r0060`, uma `r0064` | 12 | Fica uma por número, que é a regra do projeto. Continuam alcançáveis no histórico |
| Instantâneos anteriores de três documentos já arrumados — a especificação de 27 de agosto, a proposta da v1.2 e a triagem da análise clínica | 3 | As cópias em `docs/` são as posteriores e mais completas: trazem as notas de arquivo e os achados corrigidos que estas não têm |
| `LEIAME.md` da pasta de exemplos | 1 | É a versão da v1.1, anterior à que está em `docs/interop/exemplos/` |
| `scott-burgan-2005.pdf` | 1 | Outra digitalização do Scott e Burgan (2005), que já está em `docs/fontes/` |

A `entrada/` volta ao que tem de ser: **vazia, com o seu `README.md` e mais nada.** É a
condição que o próprio ficheiro impõe — uma entrada que não esvazia deixa de dizer o que quer
que seja.

## Cinco registos de conversa do outro lado, e quatro defeitos que eles apontam

Chegaram cinco documentos: quatro transcrições integrais e um ponto de situação. As
transcrições ficaram em `docs/conversas/`, pasta nova com catálogo e regra de verificação; o
ponto de situação em `docs/`, porque é documento e não conversa.

**Nenhum defeito apontado foi aceite de palavra.** Os quatro que entraram no
`docs/POREXECUTAR.md` foram conferidos contra a `r0077` primeiro, e os três que não consegui
conferir ficam nomeados à parte, como por conferir. O detalhe está lá; aqui fica o que muda
a leitura do projeto.

### O tecto de saída, e um erro meu no teste

O motor de propagação vigia o domínio das entradas e **não vigia o valor que sai**. A fonte
primária destes quadros — Fernandes (2001) — declara um tecto de **6 m/min**, que são 360 m/h,
acima do qual desaconselha usar as equações. Uma combinação dentro de todos os domínios de
entrada entrega **14 820 m/h**, quarenta vezes esse tecto, sem uma palavra de reserva.

E há um erro meu por trás disto. O `tests/propagacao.test.mjs` valida o extremo do domínio
com `assert.ok(max < 20000)`, citando Alexander (2000), «1,5 m/h a ~14 km/h **em floresta**».
**Estes quadros são de matos, e de fogo controlado de Outono e Primavera.** Validei o tecto
contra a fonte errada. A asserção é verdadeira e não significa nada — que é a pior espécie de
teste, porque parece cobertura.

### O buraco estrutural reabriu na mesma sessão em que foi tapado

O `p0020` corrigiu a falha de onze painéis que não chegavam ao PEA. **Na mesma sessão, esta
linhagem acrescentou notas do mapa e focos de calor, e nenhum dos dois entra no colector.**
Confirmado. A lição do outro lado é melhor do que o remendo: o colector tem de ser **regra**,
verificada no `auditarPosse()`, e não correção pontual.

### A identidade das propostas

Fui eu que descobri que os `id` das propostas são decorativos, porque o `detDecisao` renumera
tudo por posição. **Não vi a consequência**, e eles viram: `controloMissoes` faz `k: x.id ||
"P"`, logo P3 no PEA n.º 4 não é a mesma proposta que P3 no PEA n.º 5. Era inofensivo enquanto
as propostas eram genéricas; deixou de ser quando passaram a depender de dados que mudam de
hora a hora.

### E uma chamada a CDN na linha 7

`fonts.googleapis.com`, na sétima linha da entrega, contra a primeira restrição não negociável
do projeto. Num arranque `file://` sem rede bloqueia o render até dar *timeout*. Fica por
decidir com o utilizador, porque apagá-la muda o aspeto da aplicação.

### O que os registos trazem além dos defeitos

Três decisões de fundo que valem a pena estar escritas onde se encontrem:

- **O ficheiro único não morre — passa a modo degradado.** Autenticação a sério e base
  documental partilhada não existem num HTML local, mas o ficheiro continua a ser a rede de
  segurança para quando o servidor morre ou o VCOC não está no TO.
- **Contra quem mexe no código, a resposta não é impedir: é detetar.** Digest do código em
  memória, e `BUILD NÃO VERIFICADO` carimbado no PEA em vez de recusa de arranque — *«às três
  da manhã num TO, uma aplicação que se auto-bloqueia por integridade é uma aplicação
  inútil»*.
- **Três registos distintos, e não um:** fita do tempo (curada, o que aconteceu na
  ocorrência), efetivo do PCO (quem ocupava que função), auditoria (quem escreveu o quê).
  Fundi-los destrói o primeiro.

E duas perguntas que **são decisão de comando e não têm resposta técnica**: se as células
escrevem diretamente na fita do tempo ou propõem para validação por Operações; e se as
rendições acontecem posto a posto ou a EPCO roda em bloco. Ficam no `docs/conversas/LEIAME.md`.

## r0078 — os cartões dobram, e o cabeçalho fechado diz o que falta

Os painéis cresceram até deixarem de se ler: trinta e um cartões, milhares de pixéis, e a
informação que a aplicação produz enterrada lá dentro. Todos passam a dobrar.

### A regra que torna isto seguro

**O cabeçalho fechado é linha de estado, não título.** É o contrário do que um acordeão faz,
e é obrigatório aqui: a aplicação inteira está construída para dizer o que falta, e um
dobrável comum esconderia o conteúdo deixando só o nome. Quem fechasse um cartão deixaria de
ver que lá dentro há dois obrigatórios por preencher, e emitiria o PEA convencido de que
estava completo. **Fechar ganha espaço, não silêncio.**

Daí três regras, e a terceira é a que faz a diferença:

1. Todo o cartão fechado diz o seu estado, e **um cartão sem nada a assinalar di-lo também**
   — «nada a assinalar» distingue-se de um cabeçalho mudo, que não diz se alguém verificou ou
   se ninguém olhou.
2. O recomendado assinala-se mas não obriga a abrir. Se obrigasse, tudo ficaria sempre aberto
   e o mecanismo não serviria para nada.
3. **O que tem obrigatório em falta abre sozinho, e fechá-lo não fica guardado.** Guardar essa
   preferência seria deixar o utilizador esconder de si próprio o que a aplicação existe para
   lhe dizer.

A preferência vive no `ARMAZEM`, **nunca no estado da ocorrência**: ter um cartão fechado é
conveniência de quem está ao teclado, não facto da ocorrência, e não tem que viajar na
exportação nem na passagem de turno.

### Como a linha de estado se compõe

Não há tabela a dizer «este campo pertence àquele cartão». Cada pendência de `pendencias()`
declara **um elemento**, e o cartão descobre-se no DOM por `closest(".card")`. Um campo que
mude de cartão leva a pendência com ele; uma tabela escrita à mão seria mais uma coisa a
desalinhar-se em silêncio.

### Três coisas que se corrigiram pelo caminho

- **A exceção que eu tinha feito não se defendia.** Deixei de fora a identificação da
  ocorrência, com o argumento de que é o cartão de que tudo depende. Vista no ecrã, era o
  cartão mais alto da aplicação e ocupava o primeiro ecrã inteiro — que é exatamente a queixa
  que trouxe este trabalho. E era desnecessária: a regra da pendência já o mantém aberto
  enquanto lhe faltar um obrigatório. **Não há exceções.**
- **Um recuo para `{}`** em `dobrarCartao` alargava o tipo até o verificador deixar de saber
  que o cartão declarado tem `cnt` — o mesmo defeito que eu tinha criticado na absorção do
  `p0020`, cometido por mim três semanas depois. Apanhado pelo `npm run tipos`.
- **A linha de estado transbordava a 380 e 480 px**, porque a regra do ecrã estreito força
  `nowrap`. Passa a quebrar para linha própria: das duas saídas possíveis — cortar o texto ou
  deixá-lo passar à linha seguinte — só uma é aceitável, porque cortar esconderia precisamente
  aquilo que o mecanismo existe para mostrar.

### O que se conferiu

`tests/dobraveis-estado.test.mjs`, doze testes. O que verificam não é que os cartões dobram:
é que **dobrar não esconde uma lacuna** — nenhum cabeçalho fica mudo, a falta aparece com o
número e por extenso, a cor não é o único sinal, o cartão com pendência reabre sozinho, e
fechá-lo não fica guardado. O teste que prova que o clique chega mesmo é o par do anterior:
sem pendência, fechar **fica** guardado.

Um teste antigo — «cada cabeçalho tem uma contagem só» — passou a falhar, e com razão: guarda
o defeito de duas contagens a dizer o mesmo lado a lado. Ficou mais afiado em vez de ser
afrouxado: agora exige um de cada papel, e recusa que o estado e a contagem digam o mesmo.

Provas em `docs/qa/`, `qa0026`.

## r0079 — o tecto de saída, e o Quadro 3.4.1 conferido

O motor de propagação vigiava o domínio das **entradas** e não vigiava o **valor que sai**.
Uma combinação dentro de todos os domínios — vento 30 km/h à superfície, humidade 8 %, mato de
3 m, declive de 50 % — devolvia **14 820 m/h** sem uma palavra de reserva. Quarenta e uma vezes
o tecto que a fonte declara.

### Antes de construir, conferi os números deles

Os quatro que a linhagem paralela apresentou batem exatamente contra os meus próprios quadros:
célula base mais rápida 38 m/min = 2 280 m/h a vento 30 e humidade 8; fator máximo de altura
2,5; de declive 2,6; máximo do domínio 14 820 m/h. Nenhum foi aceite de palavra.

### E depois fui ao Manual, que agora temos

**O Quadro 3.4.1 está conferido contra o impresso — 252 células, todas certas.** Página `E_10`
do guia E1: 21 linhas de vento por 12 colunas de humidade, mais os dois eixos. Não falhou uma.

E o rodapé impresso do quadro vale tanto como os números:

> «Velocidades de propagação de fogos a favor do vento em **terreno plano (declive <5%)** para
> matos com 1 m de altura.»

Isto **confirma em primeira mão** o que a linhagem paralela citava do artigo de 2001, que não
temos: a tabela base foi medida em terreno plano. A correção de declive, que chega a ×2,6 aos
50 %, aplica-se fora das condições da medição — e num vale de socalcos o declive é a variável
dominante. A aplicação passou a dizê-lo em cada estimativa com declive acima de 5 %.

### A marca, e a proveniência de cada tecto

Três números, e **não têm a mesma proveniência** — o que fica escrito no código e no
`FONTES.md`:

| Tecto | O que é | Proveniência |
|---|---|---|
| 2 280 m/h | a célula mais rápida do Quadro 3.4.1 | **conferida contra o impresso** |
| 360 m/h | 6 m/min, acima dos quais Fernandes (2001) desaconselha usar as equações | **o artigo não está aqui**; veio pela linhagem paralela |
| 1 200 m/h | 20 m/min, o mais rápido dos 29 fogos desse conjunto | a mesma, com a mesma reserva |

A marca **não impede o cálculo**: recusar deixaria quem está no PCO sem estimativa nenhuma, que
é pior. Acompanha o número — aparece à cabeça da leitura e não em rodapé, vai com ele para a
fita do tempo, e entra no `retratoDoFogo()`, logo na proposta de PEA.

**Duas decisões que valem a pena registar:**

- **O pinheiro bravo não leva marca.** Os tectos são de Fernandes (2001), que é sobre matos.
  Emprestá-los ao guia E2 seria o mesmo erro de fonte trocada que este trabalho veio corrigir.
  Fica sem marca e dito porquê; o domínio inteiro do pinhal não passa dos 514 m/h.
- **Um R observado não leva marca.** Um fogo medido a 5 000 m/h não é extrapolação nenhuma: é
  um fogo a andar depressa, e dizer-lhe «além de qualquer fogo medido» seria desmentir quem o
  mediu. Os tectos são dos quadros, não do terreno. A marca só se aplica quando o R veio da
  estimativa **e** o motor é o dos matos.

### O erro meu, corrigido

A asserção do `tests/propagacao.test.mjs` validava o extremo do domínio contra Alexander
(2000), «1,5 m/h a ~14 km/h **em floresta**», com `max < 20000` — verdadeira, e sem significar
nada. Estes quadros são de **matos**. Passa a aferir contra a célula mais rápida do próprio
quadro, que está conferida, e a exigir que o que a ultrapassa saia marcado.

### Duas frases no ecrã que tinham deixado de ser verdade

A captura da prova mostrou-as, e ambas são da mesma família do erro acima:

- A dica do campo da velocidade dizia «varia de 1,5 m/h a cerca de 14 km/h **em floresta**
  (Alexander 2000)» — a fonte errada, dita ao utilizador. Passa a citar o domínio do Quadro
  3.4.1 e a avisar do que sai marcado.
- A leitura da intensidade dizia «**a aplicação não os estima**: exigiriam um modelo de
  combustível calibrado para a vegetação do Douro, e não existe» — escrita antes da r0074 e
  desatualizada desde então. Mandava procurar no terreno o que o painel logo abaixo dava.
  **E havia um teste a exigir essa frase**, o que transformou texto obsoleto em requisito
  durante cinco revisões. O teste passa a exigir o contrário: que a leitura encaminhe para
  onde se estima.

Prova em `docs/qa/`, `qa0027`.

## 2 de setembro — chegaram os três documentos que faltavam

Trinta ficheiros no descarregamento, dez deles já cá estavam byte a byte. Entre os vinte
novos vinham **os três documentos que o `FONTES.md` dava por em falta**, e os dois buracos de
proveniência que eu tinha declarado na véspera fecharam-se no mesmo dia.

### Fernandes (2001) — os tectos deixam de ser de segunda mão

*Fire spread prediction in shrub fuels in Portugal*, Forest Ecology and Management 144: 67-74.
A `r0079` usava dois tectos relatados pela linhagem paralela e declarados como tal. Estão
lidos, e **não foi preciso mudar um número** — o relato estava certo:

> «given the scarce data availability for rates of spread above 6 m min⁻¹, it is not advisable
> to use the equations outside the low fire behaviour range»

A Tabela 1 dá o domínio dos 29 fogos: R de 0,7 a **20,0 m/min**, e **declive de 0 a 5 %**. O
que confirma, por segunda via independente, o rodapé impresso do Quadro 3.4.1.

**E traz uma ressalva que ninguém tinha relatado:** as equações são enviesadas para as
comunidades `EU-CT` — urzal de *Erica* com *Chamaespartium tridentatum* —, que deram mais de
dois terços dos dados. Fica em `FONTES.md`, chave `FOGOSHRUB`. Note-se que é formação do
Nordeste, a nossa região, pelo que o enviesamento até pode jogar a favor do Douro; **mas isso
é hipótese e não leitura**, e nada na aplicação o deve afirmar.

### Fernandes e Loureiro (2021) — o documento dos 18 modelos

*Modelos de combustível florestal para Portugal, documento de referência, versão de 2021.*
Era o único que o `FONTES.md` dizia não estar em lado nenhum aberto. **A transcrição dos 18
modelos e das cargas continua por conferir contra ele** — mas agora é possível, e é o próximo
trabalho de conferência.

### Rossa e Davim (2024) — o candidato a substituir o `I = 300·L²`

*Field-based generic empirical flame length–fireline intensity relationships*, IJWF 33,
WF23127. Inclui dados de fogo de alta intensidade, que é onde a relação de Byram é mais fraca.
**Correção de autoria:** um dos registos de conversa atribuía-o a «Fernandes et al. (2024)»; é
de **Rossa e Davim**.

### O que mais entrou

Em `docs/fontes/`: a dissertação de Nóbrega (UTAD) sobre folhada de caducifólias — que é o
modelo `F-FOL`, um dos que não têm motor português; Rossa, Davim e Fernandes sobre razão
superfície/massa; o clássico Schroeder e Buck (1970); e **a dissertação de Geraldes sobre redes
de comunicações de emergência**, que pode responder à pergunta das pastas SIRESP por
sub-região, aberta desde agosto e que a aplicação recusa deduzir. Por ler.

Em `docs/qa/`, `qa0028`: **um PEA impresso pelo utilizador no seu computador** — proposta n.º 4
da ocorrência de Paraduça. É a primeira prova do PEA impresso fora deste ambiente, e mostra a
cadeia de substituição a funcionar.

Em `docs/pea-reais/`: o `PEA02rev2` do Castedo em PDF, na forma em que circulou.

## r0080 — a identidade das propostas, e o buraco do colector fechado por regra

As duas que a linhagem paralela dizia serem prioritárias, «porque são as que fazem o plano
dizer coisas que não são verdade sobre si próprio».

### A identidade das propostas

`controloMissoes` fazia `k: x.id || "P"`, e o `id` é renumerado por posição no fim do
`detDecisao`. **P3 no PEA n.º 4 não era a mesma proposta que P3 no n.º 5.** Bastava uma
proposta cair entre planos para tudo o que estava por baixo subir uma posição, e «cumprimos a
P2» deixava de ter significado estável num documento que é aprovado, executado e auditado.

Cada regra passa a declarar a sua **chave estável** — `LIM-INTERDITO`, `LINHA-ESTREITA`,
`RESERVA` —, e são 24. O `id` continua posicional, porque dentro de um documento «P2» é o
segundo item e é assim que se lê no papel; o item de controlo guarda os dois, e mostra
«`LINHA-ESTREITA · P3 no papel`».

**As quatro faixas de intensidade levam chaves distintas, de propósito.** «Interditar o ataque
à cabeça» e «ataque direto admissível» são instruções opostas: partilhar chave faria uma
aparecer como cumprida quando a outra nunca chegou a ser dada.

A via do modelo de linguagem não tem regras, e as propostas que ela produz recebem chave
derivada do próprio texto, com prefixo `T-`. **Estável enquanto o texto não mudar, que é a
única promessa honesta que se pode fazer sobre ela** — e o prefixo diz de onde veio, para
ninguém a confundir com uma chave declarada.

Os PEA já emitidos não são reetiquetados: ficam com os números com que saíram. Reescrevê-los
falsificaria um documento que foi aprovado.

### As notas e os focos no colector — e a regra, que vale mais

Entraram no `retratoDoFogo()`. Os avisos escritos no mapa vão por extenso para a análise da
zona de intervenção — a distinção entre aviso e observação já estava em `TIPOS_NOTA` e é
operacional; as notas de manobra e observação contam-se, para não desaparecerem. Os focos de
calor entram com a contagem, a confiança, a origem e a hora, e com a ressalva de que **não
substituem o que o posto traçou**.

Mas o remendo é o menos importante. **A falha tinha-se repetido enquanto a correção do `p0020`
ainda estava fresca**, e isso diz que o problema é estrutural. Passa a haver `CONTRIBUI`: cada
ramo de `O.dados` com dono declarado em `POSSE` diz **o que leva ao plano, ou porque não leva**.
São 21, e quatro deles estão declarados como não contribuindo, com a razão escrita. Um ramo
sem declaração faz falhar a auditoria e acende o aviso na passagem de turno, ao lado das outras.

O teste prova que a auditoria vê, e não que passa por não olhar: acrescenta um ramo à `POSSE`,
confere que é apanhado, e repõe.

### O verificador de tipos apanhou um defeito que o meu teste não apanhou

O campo de uma nota é `txt`, não `texto`. Escrevi `x.texto||""` no colector, e **o teste passou
porque inventou a mesma forma errada nos dados de ensaio**. Sem o verificador, um aviso de
linha de média tensão sobre o caminho chegaria ao PEA como «Avisos escritos no mapa: .»

É a segunda vez que fabrico a forma em vez de usar a real — a primeira foi o
`webkitRelativePath` com `defineProperty`. O teste passa a usar a forma declarada em
`tipos/estacao.d.ts` e a exigir que o texto chegue mesmo.

## r0081 — as missões alinhadas com as propostas

O plano contradizia-se, e reproduzi-o antes de lhe mexer. Com janela de consolidação e uma
frente de 31 920 kW/m, o mesmo documento dizia:

> **Objetivo:** «Dominar as frentes ativas em Alfa e fechar o perímetro até às 09h.»
> **Ação decisiva:** «Dominar as frentes ativas em Alfa e fechar o perímetro na janela 02h–09h.»
> **Proposta:** «Interdição de ataque direto à cabeça… a cabeça só se ataca por meios aéreos.»

Duas partes do mesmo documento aprovado em contradição são piores do que qualquer delas estar
sozinha errada: **quem executa escolhe uma, e não há como saber qual.**

### A causa era estrutural, não de redação

**Havia dois blocos a decidir a mesma coisa por critérios diferentes.** As missões olhavam à
janela meteorológica e ao dispositivo; as propostas olhavam à intensidade. Corrigir o texto de
um deles deixaria o defeito pronto a voltar à primeira alteração — que é exatamente o que
aconteceu com o colector, duas revisões antes.

Passa a haver uma **postura de manobra** calculada num sítio só, `posturaDeManobra()`, de que
o objetivo, a ação decisiva e as propostas de limite derivam. **Não podem discordar porque não
decidem nada: leem.**

| Postura | O objetivo diz | Como se fecha o perímetro |
|---|---|---|
| `interdito` — acima de 4 000 kW/m | **Conter** | pelos flancos e pela retaguarda |
| `aereo` — 2 000 a 4 000 | Dominar | com apoio aéreo na cabeça |
| `terrestre` — 500 a 2 000 | Dominar | com meios terrestres sob pressão de água |
| `manual` — abaixo de 500 | Dominar | com equipamento de sapador |
| `sem-dados` | Dominar | — nada se impõe onde não há número |

A ação decisiva passa a trazer a razão com ela, e não só o verbo: quem a lê sabe porque é
«conter» sem ter de a cruzar com as propostas mais abaixo.

### E uma auditoria por cima, porque a garantia por construção tem prazo

`coerenciaDoPlano()` confere que nenhuma missão promete dominar uma frente cuja cabeça está
interdita. É redundante enquanto tudo derivar da postura — e deixa de o ser no dia em que
alguém escrever uma missão nova sem a consultar. Acende o mesmo aviso da passagem de turno que
as outras auditorias.

O teste prova que ela vê: forja uma missão a prometer «dominar as frentes ativas» com a cabeça
interdita e confere que é apanhada. E prova que **não** apanha a frase da própria proposta —
«o ataque direto à cabeça é inadmissível» contém as palavras e é o contrário de uma promessa.
Uma auditoria que a apanhasse acusaria o plano de se contradizer sempre que estivesse correto.

### Um fundamento que não se lia

`[VIGIA]` saía com «Máxima de — °C em — — a fase crítica exige equipas frescas» quando não
havia previsão carregada. Num documento aprovado. **Um fundamento que não se lê é pior do que
um genérico: parece que houve leitura e não houve.** Passa a dizer que não há máxima do ciclo
e que a vigilância não depende dela.
