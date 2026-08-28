# Estado do projeto

Atualizado em 2026-08-28.

## Situação atual

A revisão em vigor é a **r0029**, montada a partir de `fonte/`. Contém as duas linhagens
que correram em paralelo: as camadas de estabilidade e o importador de um lado, a
repartição do PEA pelas células e as etiquetas de impressão do outro.

| | |
|---|---|
| Entregas em `app/` | 36, das anteriores à convenção de nomes até à r0029 |
| Módulos em `fonte/` | 32, mais o molde |
| Testes | 170, todos a passar |
| Análise estática | sem problemas |
| Tipos | 25 diagnósticos, nenhum novo face à linha de base |
| Auditoria visual | sem transbordo nem exceções, 380/480/768/1440 px, nos dois temas |
| Versão do estado gravado | 3 |
| Regras de conformidade | 12, com as fontes declaradas |

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
2. **Campos próprios para os dois instantes da nomeação externa.** O importador já lê a
   solicitação e a nomeação dos núcleos externos, e hoje só a segunda tem onde ficar: a
   primeira serve para o aviso e é descartada. Quando o estado tiver os dois campos,
   preenchem-se — e essa é a única coisa que a v1.2 traz e que o estado ainda não guarda.
3. **Reforma do estado por células**, quando o outro lado a atacar. O importador não sobe a
   escada de migrações: não acrescenta campo nenhum ao estado, escreve só em ramos que já
   existem. O próximo degrau livre é `MIGRACOES[3]`, versão 3 para 4.

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
| r0029 | 281713 | — | Especificação v1.2: instantes em GDH ou ISO no mesmo campo, bloco `pco` e ponto de trânsito no envelope da especificação, estimativa de empenhamento assinalada; exemplo e validação da v1.2 |
