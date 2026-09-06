# A fita do tempo OP 04, e onde cabe nesta aplicação

Análise do que chegou a `entrada/` a 6 de setembro de 2026, escrita nesta sessão. Os ficheiros estão em `docs/fita-do-tempo/` e a transcrição da conversa que os
produziu em `docs/conversas/`. Nada do que aqui se propõe está feito: é o que se propõe
fazer, por onde, e o que fica por decidir em conjunto.

## 1. O que chegou

Uma conversa com outro Claude, fora deste projeto, construiu **a peça que o kit
oficial de Ferramentas do SGO não traz**. O Despacho n.º 4067/2024 define a fita do tempo no
art. 2.º, n.º 1, al. c) — «o registo temporal explícito e completo das decisões, ações e
informações operacionais associadas a uma ocorrência e com relevância para a compreensão da
mesma» — e manda a Célula de Operações garantir o seu registo e permanente atualização, art.
17.º, n.º 1, al. g). Os dois artigos estão conferidos no despacho em `docs/fontes/`, e são
exatamente os que esta aplicação já cita no cartão «Fita do tempo». O kit não tem modelo para
ela; a conversa fez um e chamou-lhe «Modelo SGO OP 04», por o número estar livre e a fita ser
da Célula de Operações. A designação foi atribuída na conversa, não pela ANEPC.

Sete peças: a folha A3 frente e verso, a carta de códigos em A4 e em A5, o manual de
preenchimento com um exemplo de Fase II, o briefing para a aplicação seguinte, o texto
canónico dos duzentos códigos, e uma folha de verificação de 52 siglas e 200 códigos com a
proveniência de cada um. Veio também um `index.html` que era a r0092 desta aplicação, byte a
byte igual à de `app/`; saiu.

O que a conversa deixou decidido, e que se respeita aqui: **append-only** — nada se apaga, o
erro corrige-se com um registo novo que aponta para o errado; **hora do facto e hora do
registo** são duas colunas, e a diferença entre elas é informação; **um acontecimento, um
código, um registo**; o que se decide dentro do PCO regista-se com canal «presencial»; **a
contagem oficial de operacionais é do Quadro de Meios e Logística, da Célula de Logística e
Finanças** — a fita regista a mudança de fase, não soma efetivos; e um vazio assumido, o
registo reconstituído a posteriori, vale mais do que uma cronologia falsamente precisa.

O que a conversa deixou por fazer, e pesa: **o teste do papel** — dar a folha a um operador
alheio ao projeto e ver onde pára — não foi feito, e a própria conversa diz que não vale a
pena programar um esquema que ainda não passou nele. E a folha de verificação está por
preencher: 17 siglas de conhecimento do modelo e 156 códigos sem base no despacho esperam quem os verifique.

## 2. O que a Estação já tem

A correspondência é maior do que parece à primeira vista, e uma parte do que o briefing pede
já existe, com outro nome.

| O que a OP 04 pede | O que a Estação tem | Onde |
|---|---|---|
| Registo cronológico das decisões, ações e informações | O **Registo de evolução da situação operacional**: GDH, tipo (agravamento, melhoria, POSIT, meios, decisão), texto, com léxico de frases prontas por grupo | Operações |
| Registo técnico do que a aplicação fez, inviolável | A **Fita do tempo** da aplicação: GDH e evento, com diário encadeado por SHA-256 e cópias | Comando |
| Quem regista, com nome em cada ato | `quemRegista()`, a identidade declarada, primeiro cartão de Comando desde a r0116 | Comando |
| Hora do registo automática | `gdhAgora()` em todo o registo | núcleo |
| Fase SGO e limiares 36 / 108 / 324 / 648 com banda de ±10 % | `FASES_SGO`, com as mesmas bandas, a sugestão a partir do dispositivo e a regra que compara o efetivo registado com a fase declarada | núcleo, Comando |
| Contagem indicativa de operacionais | `contarDispositivo()`, a partir das tipologias por setor | Operações |
| PEA vigente, um só de cada vez (art. 46.º, n.º 2) | O histórico de PEA com o veredicto de validade, e o «PEA em vigor» | Planeamento |
| Marcos: alerta, PCO instalado, fase, PEA n.º 1, dominado, rescaldo, extinta, encerrada | Existem espalhados: hora de alerta em Comando, nomeações do PCO, `faseG`, `peas[0].g`, os estados de setor, o encerramento com carimbo | vários |
| Rendições e saídas do TO | O quadro de rendições, o pedido ao CSREPC, e desde a r0107 a saída do TO e a chegada à Entidade | Logística |
| Relatório da ocorrência (art. 8.º, n.º 2, al. w)) | O encerramento com as reservas, o briefing de passagem de turno, o PEA impresso | Comando, Turno |
| Setores A–Z, frentes e áreas | Setores por letra; frentes e áreas de intervenção municipal não têm ainda estrutura própria | Operações |
| Passagem de comando com os nove pontos do art. 9.º, n.º 2 | **Não existe.** Há a passagem de turno da EPCO (rotatividade a cada 12 h, DON n.º 2, 7.d.(30)), que é outra coisa: muda quem está no posto, não quem comanda | — |
| Uma taxonomia de códigos | **Não existe.** O léxico tem frases por grupo e cor, sem código nem família | — |

Duas coisas que a Estação já faz e que o briefing exige com razão: o registo de evolução
**não se apaga** — não há em toda a fonte um caminho que retire uma linha da evolução —, e a
fita técnica está encadeada por resumo criptográfico, que é mais do que o papel consegue.

## 3. Onde cabe, peça a peça

**A primeira decisão é de nome, e é a que mais custa.** A aplicação chama «Fita do tempo» ao
seu registo técnico — o que a aplicação fez, quando, por quem — e cita para ele o art. 2.º,
al. c). O que a norma chama fita do tempo é o registo operacional: as decisões, ações e
informações da ocorrência. Isso, na Estação, é o **Registo de evolução**. Os dois cartões
existem e estão certos; os nomes estão trocados. Proposta: o registo técnico passa a
«Diário da aplicação», sem citação de artigo, porque não é o que o artigo define; o registo
de evolução passa a chamar-se **«Fita do tempo»**, com os dois artigos, e é nele que a OP 04
entra. É uma mudança de rótulo e de manual, sem degrau de estado, e é o que torna tudo o
resto coerente.

**A fita ganha os campos da OP 04.** Cada registo passa a poder levar, além do GDH do facto,
do tipo e do texto que já tem: o GDH do registo, automático; o código, um só; o canal —
comando, tático, manobra com número, presencial, telefone, SADO, banda alta —; a origem e o
destino, por indicativo ou função; o setor, com a letra ou a função; o despacho, a decisão
que daí resultou, com traço quando não houve; a referência a outro registo, que fecha o
ciclo ordem → cumprimento; e as duas marcas, crítico e marco. Quem registou já lá está. Tudo
opcional menos o que já é obrigatório hoje, para que a captura rápida continue a ser «uma
linha, cinco segundos» — o briefing tem razão em que é isto que faz ou desfaz o sistema. É
degrau de estado, com migração a dar aos registos existentes os campos vazios. Célula:
Operações, `4-operacoes/`, ao lado do módulo da evolução.

**A retificação é um registo novo.** A regra que a conversa impõe e que já se pediu a
esta aplicação noutras palavras — não descartar informação. Um registo com o código de
retificação e a referência ao errado; o errado fica. O mesmo para o registo reconstituído a
posteriori, que cobre um intervalo e diz a fonte. A aplicação não precisa de aprender nada:
só de ter os dois códigos e de os pôr à mão.

**A taxonomia entra como registo declarado, `CODIGOS_FITA`**, com as quinze famílias e os
duzentos códigos do texto canónico, e **com a base no despacho ao lado de cada um quando
existe** — a folha de verificação dá 44 com artigo — e «sem base no despacho; construção do
Modelo OP 04, 6 de setembro de 2026» nos outros 156. É a mesma regra que se seguiu com as
gravidades das notas do #006: a construção entra, dita como construção, e as citações que
traz conferem-se no texto do despacho antes de se escreverem. Uma primeira leitura já apanha
duas a conferir: `CM3` cita o art. 13.º, n.º 2, que está certo (conferido na r0114), e `CM14`
cita o art. 17.º, n.º 2 para a ativação de núcleos, que está por conferir. O léxico de frases
que a aplicação já tem liga cada frase a um código, para a tecla continuar a ser uma tecla.

**Os marcos passam a bloco.** Os dez marcos da folha — alerta, primeiro meio no local,
assunção de COS, PCO instalado, Fase II, Fase III ou superior, PEA n.º 1, dominado,
rescaldo, extinta ou encerrada — derivam-se do que a aplicação já sabe mais dos registos com
a marca de marco, e mostram-se num bloco só, com os intervalos que o relatório vive deles:
do alerta ao primeiro meio, ao COS, ao PCO, ao dominado. Nada se escreve duas vezes: o bloco
lê a fita. Célula: Operações.

**A passagem de comando ganha bloco próprio, em Comando.** Os nove pontos do art. 9.º, n.º 2
— historial, PEA em execução com missões e objetivos, prioridades, plano de comunicações,
meios empenhados e solicitados, organização do TO, constrangimentos, cenários previsíveis,
situações críticas e oportunidades — conferidos no despacho; o n.º 3 manda registá-la na
fita. A aplicação compõe os nove pontos a partir do que tem, como já compõe o briefing de
passagem de turno, e regista o ato com o COS cessante e o entrante, presencialmente por
imposição do n.º 2. Distinto da passagem de turno da EPCO, que continua onde está.

**O aviso de limiar diz que estrutura passa a ser exigida.** A regra de fase já compara o
efetivo com a fase declarada; falta-lhe dizer, ao entrar na banda inferior — 32, 97, 292,
583 —, o que a fase seguinte obriga a instalar: PCO, célula de operações e adjunto de
segurança na II; planeamento, logística e finanças e adjunto de ligação na III; relações
públicas e coordenador do PCO na IV. É indicador, não decisão, como o briefing diz. Pequena,
em `REGRAS_DON`, com os artigos 39.º a 45.º a conferir um a um antes de se escreverem.

**A folha A3 imprime-se a partir da fita.** O papel muda de função: contingência e artefacto
assinado a cada POSIT. A Estação já imprime o PEA com o modelo aceite; imprime a fita no
layout da OP 04, com o cabeçalho, o bloco dos marcos e as 26 linhas por folha, numeradas na
ocorrência e não na folha. Célula: Operações. A folha em branco continua a ser a folha em
branco: está em `docs/fita-do-tempo/`, pronta a imprimir.

**O relatório da ocorrência sai da fita.** O mapeamento secção → códigos do briefing é a
especificação: cronologia dos marcos, evolução dos POSIT, estrutura de comando dos CM,
organização do TO, estratégia, segurança das forças em secção autónoma, vítimas e população,
articulação institucional, encargos e requisições dos LF18 a LF21 e LF24 — que ligam ao
Núcleo de Finanças do art. 35.º —, e constrangimentos e lições das missões não cumpridas,
das avarias, dos quase-acidentes e das retificações. É o encerramento a crescer, não um
documento novo. Célula: Comando.

## 4. O que não entra, e porquê

**Não se faz uma segunda aplicação.** O briefing pede uma webapp da fita, offline, local à
VCOC, com IndexedDB. Isso é esta aplicação: abre de `file://`, guarda no IndexedDB, não
depende de rede, tem identidade declarada, diário encadeado e exportação. A fita OP 04 é um
módulo da Célula de Operações da Estação, não um projeto ao lado — e é assim que a norma a
põe, no art. 17.º. Dois registos da mesma ocorrência em duas aplicações seriam a
transcrição humana que a própria conversa recusa.

**Os identificadores já são únicos e não sequenciais.** `novoIdentificador`, desde a r0103,
de `crypto.getRandomValues`; o número de ordem é rótulo. Os instantes já são absolutos,
`agora()` em milissegundos, com o GDH doutrinário à vista; a exportação leva os dois.

**Os duzentos códigos não entram como doutrina.** Entram como construção declarada, com a
base ao lado quando a há. A conversa é a primeira a dizê-lo: «nada disto tem chancela da
ANEPC», e 156 códigos são propostas. A regra deste projeto — nenhuma citação sem fonte
conferida — aplica-se linha a linha: o que a folha de verificação diz que tem base
confere-se no despacho antes de se escrever, e o que não tem diz que não tem.

**CDOS não entra.** A aplicação já não o usa em lado nenhum; diz CSREPC, e é a designação
sub-regional que o despacho refere por extenso. As siglas de nível 3 da folha de verificação
— CSREPC, CROEPC, CNEPC, ZCR, ZRR, ICNF, IPMA e as outras — são as que esta aplicação também
usa, e pela mesma razão: prática corrente sem forma abreviada no despacho. Fica registado em
`FONTES.md` que são abreviaturas de conceitos que o despacho escreve por extenso, e não
siglas dele.

**O «quase-acidente» (SG14) entra por decisão nossa, ou não entra.** Sem base doutrinária,
como a conversa confessa; é a única marca de segurança que o sistema regista sem que
ninguém tenha de admitir nada, e é por isso que vale. Mas é decisão, não norma.

**O teste do papel não se substitui.** A conversa diz que não vale a pena programar um
esquema que não passou nele. Concordo com a razão e discordo da consequência para esta
aplicação: os campos entram opcionais e a captura de hoje não muda, pelo que o teste pode
ser feito com a aplicação e não só com o papel — e apanha mais, porque mede o tempo.

## 5. A ordem proposta

Três revisões, cada uma com os seus testes e a sua nota no manual, por ordem de dependência:

1. **Os nomes e os campos.** «Diário da aplicação» e «Fita do tempo» no lugar certo; os
   campos OP 04 no registo, opcionais, com degrau de estado; a taxonomia `CODIGOS_FITA` com
   as bases conferidas; a retificação e a reconstituição como registos; o léxico ligado aos
   códigos. É a revisão que fecha o esquema.
2. **Os marcos e a passagem de comando.** O bloco dos dez marcos com intervalos; o bloco dos
   nove pontos do art. 9.º, n.º 2 em Comando; o aviso de limiar a dizer a estrutura exigida.
3. **O papel e o relatório.** A folha A3 impressa a partir da fita; o relatório da ocorrência
   por secções a partir dos códigos, no encerramento.

## 6. O que fica por decidir em conjunto

1. **O nome.** Confirmar a troca: «Diário da aplicação» para o registo técnico, «Fita do
   tempo» para o registo de evolução.
2. **A taxonomia.** Entram os duzentos códigos do texto canónico, ou só os 44 com base no
   despacho e os que a folha de verificação confirmar? A proposta é entrarem todos,
   ditos como construção, e a folha de verificação decidir o que sai depois.
3. **O quase-acidente** (SG14): entra ou não.
4. **As siglas de nível 3.** CSREPC como abreviatura, que é o que esta aplicação já faz, ou
   por extenso. E a designação exata em rádio do comando sub-regional do Douro, para o
   exemplo do manual que ainda diz «CDOS Porto».
5. **O teste do papel**, ou o teste com a aplicação, com um operador alheio ao projeto.
