# Proposta de evolução técnica — Estação PEA

Análise da arquitetura e proposta de melhorias para estabilidade e crescimento.
2026-08-27.

Nota de método: esta análise parte da especificação
`CSREPCDouro_202608272046_PromptEstacaoPEA_CLD.md`. O ficheiro HTML da aplicação não está
no repositório, pelo que nada aqui é auditoria ao código real — é leitura da arquitetura
descrita e dos problemas que a própria especificação assume.

---

## 1. O diagnóstico central

A restrição número um diz «um único ficheiro HTML, sem build, sem bundler». Essa frase
junta duas exigências que são diferentes e que convém separar:

- **O que é entregue ao PCO** tem de ser um ficheiro autónomo, que abre com duplo clique
  em `file://`, sem servidor, sem instalação e sem rede. Isto é um requisito operacional
  real, não negociável, e nada nesta proposta lhe toca.
- **O que é editado durante o desenvolvimento** não tem de ser esse mesmo ficheiro. Isso
  é uma decisão de conveniência, tomada quando o projeto era pequeno.

A secção 5.1 lista catorze subsistemas e cerca de noventa funções, com integração de
modelo de linguagem, geocodificação, GeoJSON, CSV, gráficos SVG, motor de conformidade e
subsistema de canais. Isso não é um ficheiro pequeno. E a secção 11 já regista a
consequência: uma regressão em que funções ficaram órfãs numa substituição de bloco, com
botões a perder listeners e a falhar em silêncio dentro de um `try`.

Esse incidente não foi azar. É o modo de falha próprio de um ficheiro grande editado por
substituição de blocos, e vai repetir-se enquanto a única defesa for o cuidado de quem
edita.

Há ainda um efeito secundário caro: com uma revisão por ficheiro novo, o `git diff` entre
revisões mostra apagar tudo e criar tudo. Não é possível rever uma alteração. O histórico
existe mas não é legível.

---

## 2. Proposta em três camadas

As camadas são independentes e por ordem de risco. A camada 0 e a camada 1 não tocam na
restrição número um sequer na letra. A camada 2 toca na letra e não no espírito, e é a
única que precisa de decisão.

### Camada 0 — Rede de segurança. Sem alterar nada na aplicação

Custo baixo, benefício imediato, risco nulo.

**Verificação estática do `<script>`.** Extrair o script do HTML e correr `node --check`.
Apanha erro de sintaxe antes da entrega. Segundos a correr.

**ESLint com regras mínimas.** Duas regras resolvem exatamente a regressão descrita na
secção 11: `no-undef` deteta uma chamada a função que já não existe, e `no-unused-vars`
deteta a função que ficou órfã. Estaticamente, sem executar nada. Se só se adotar uma
coisa desta proposta, adote-se esta.

**Testes com `node:test`.** O executor de testes vem incluído no Node desde a versão 18,
sem instalar nada. As partes de maior valor a testar não precisam de DOM nenhum, porque
são funções puras sobre o estado: `verificacoesDON`, `pendencias`, `parseCoordAny`,
`parseCSV`, `metricas`, `niveisSugeridos`, `funcoesExigiveis`, `totSetor`. O `jsdom` fica
reservado às funções de render, que é onde custa mais e rende menos.

**Integração contínua.** Uma ação do GitHub que corre a verificação e os testes a cada
push. O repositório é privado, o custo é irrelevante para este volume.

Nota sobre a restrição: `package.json` com dependências apenas de desenvolvimento não
viola nada. A restrição é sobre o que a aplicação carrega em execução, e a própria
especificação já manda correr testes em jsdom.

### Camada 1 — Tipos sem compilação

O TypeScript consegue verificar JavaScript comum, com os tipos declarados em comentários
JSDoc e `checkJs` ligado. Não transpila, não altera o ficheiro, não produz nada. É só um
verificador que corre em desenvolvimento.

Declarando uma vez a forma de `O`, de um setor, de uma função do PCO e de um item de
conformidade, passa a haver erro imediato em campo mal escrito, em campo que se assume
existir e não existe, e em valor que pode ser nulo e não é tratado. Numa aplicação cujo
estado tem cinco níveis de profundidade e é reconstruído a partir de formulário, isto
apanha uma classe inteira de defeitos que hoje só aparece em uso.

O ficheiro entregue continua a ser JavaScript comum, com comentários. Um navegador nunca
sabe que isto existe.

### Camada 2 — Fonte em módulos, entrega em ficheiro único

Esta é a que desbloqueia o crescimento, e a única que altera o método de trabalho.

A aplicação passa a ser escrita em ficheiros separados, um por subsistema, seguindo a
divisão que a secção 5.1 já faz. Um programa de montagem com poucas dezenas de linhas
concatena tudo para dentro do molde HTML e produz o ficheiro único, idêntico em
comportamento ao de hoje. O que chega ao PCO não muda: um ficheiro, duplo clique, sem
rede.

O que muda é tudo o resto. Cada subsistema passa a ser legível de uma assentada. As
alterações passam a ter diff revisível. Duas frentes de trabalho deixam de colidir no
mesmo ficheiro. E a substituição de blocos grandes, que é a origem da regressão conhecida,
deixa de ser a operação normal.

O Node passa a ser necessário para produzir uma entrega, mas não para a usar. É a
diferença entre a bancada de trabalho e a ferramenta que vai para o teatro de operações.

**Recomendação:** camada 0 imediatamente, camada 1 a seguir, e camada 2 assim que a
camada 0 estiver a dar rede de segurança. Fazer a camada 2 sem testes seria trocar um
risco conhecido por outro.

---

## 3. Linguagens e ferramentas

### Manter

**JavaScript, ES2020, sem framework.** É a única linguagem que corre a partir de `file://`
sem instalar nada, e essa propriedade é o projeto inteiro. Nenhuma alternativa a
substitui sem quebrar a restrição.

**CSS com variáveis nativas.** O sistema visual da secção 10, com tokens de relevo e duas
paletas por `html[data-tema]`, já está bem resolvido e não precisa de pré-processador.

**SVG desenhado à mão.** O meteograma em SVG gerado por função é mais leve e mais
controlável do que qualquer biblioteca de gráficos, e não tem dependência.

### Adotar

| Ferramenta | Para quê | Onde corre |
|---|---|---|
| ESLint | Apanhar função órfã e chamada a função inexistente | Desenvolvimento |
| TypeScript em modo JSDoc | Verificar a forma do estado, sem transpilar | Desenvolvimento |
| `node:test` | Testes, sem instalar dependências | Desenvolvimento |
| jsdom | Só para os caminhos de render | Desenvolvimento |
| GitHub Actions | Correr tudo isto a cada push | Servidor |

### Rejeitar, e porquê

**React, Vue, Svelte.** Resolvem um problema de escala de interface que esta aplicação não
tem, e obrigam a um passo de compilação para produzir o ficheiro. Se o problema for a
sincronização entre estado e ecrã, a resposta certa e barata é uma função de render por
cartão, chamada por `pintarTudo`, que é o que já existe.

**Bundler como infraestrutura obrigatória.** A montagem da camada 2 deve ser um programa
curto, legível e do projeto, não uma cadeia de ferramentas com configuração própria. Um
oficial de planeamento tem de conseguir perceber como o ficheiro foi feito.

**WebAssembly.** Nada aqui é limitado por cálculo.

**Servidor em Python ou Go.** Só entra em cima da decisão da secção 5, e apenas como
componente opcional. Nunca como requisito para usar a aplicação.

---

## 4. Correções estruturais concretas

Estas são independentes das camadas e valem por si.

### 4.1 Versionar o estado gravado

O estado `O` da secção 5.3 não tem campo de versão. A compatibilidade com ocorrências
gravadas em revisões anteriores está entregue ao `Object.assign` sobre valores por omissão
dentro de `pcoObj()` e `estObj()`.

Isso resolve campo em falta. Não resolve campo que mudou de significado, de tipo ou de
nome — e a especificação já mostra que isso acontece, porque `siresp`/`ba` passaram a ser
o nível de manobra e `tat`/`tatba` o nível tático. Uma ocorrência gravada antes dessa
distinção carrega dados que hoje significam outra coisa.

Proposta: acrescentar `O.versao` e uma cadeia explícita de migrações, cada uma a
transformar de uma versão para a seguinte. `migrarEstado` deixa de ser uma função que
tenta adivinhar e passa a ser uma sequência declarada. Cada migração é testável com um
estado antigo real como entrada.

Numa aplicação onde o registo de uma ocorrência é prova documental de decisões de comando,
perder ou deturpar silenciosamente uma ocorrência gravada é a falha mais grave possível.

### 4.2 Inverter o sentido de `lerForm()`

A especificação avisa, duas vezes, que `lerForm()` reconstrói `O.meta` a partir do
formulário e que os campos sem campo no formulário — `distrito`, `concelho`,
`distritoChave` — têm de ser preservados à mão. E avisa que ao acrescentar qualquer campo
derivado é preciso lembrar disto.

Um aviso repetido na documentação é a assinatura de um defeito de desenho. A correção
remove a classe inteira: em vez de reconstruir o objeto, cada campo do formulário escreve
no seu lugar do estado, através de um único ouvinte delegado e de um atributo `data-campo`
com o caminho. O que não tem campo no formulário nunca é tocado, porque nada o percorre.
Deixa de haver o que preservar.

### 4.3 O motor de conformidade como registo de regras

`verificacoesDON()` devolve um array construído dentro de uma função. Cresce por
acrescento, e cada acrescento aumenta a superfície onde uma regra pode partir outra.

Proposta: cada verificação passa a ser um objeto autónomo, com identificador, referência
legal e uma função pura que recebe o estado e devolve o item ou nada. O motor percorre o
registo. Cada regra é testável isoladamente, com um estado construído à medida, e é
possível listar mecanicamente todas as regras e as fontes que invocam.

Isto serve diretamente a restrição número quatro. Complemento: um `docs/FONTES.md` com uma
entrada por citação doutrinária usada, e cada regra a referenciar a entrada. A auditoria
legal passa a ser verificável por comparação, não por leitura.

### 4.4 Injetar o relógio

A especificação diz que os itens são reavaliados a cada trinta segundos porque vários
dependem do relógio: prazos de ataque inicial e ampliado, POSIT, rendições.

Enquanto essas funções lerem a hora diretamente, não são testáveis — e são precisamente
as regras cuja falha tem consequência operacional. Passando o instante como argumento, ou
lendo-o de um ponto único substituível, cada prazo passa a ter teste com hora escolhida.

### 4.5 A rede como caminho de falha, não de exceção

O utilizador está num PCO com ligação intermitente. Isso significa que a falha de rede é o
comportamento normal, não o excecional. Geocodificação, meteorologia e avisos precisam
todos de um invólucro comum com prazo máximo de espera, cancelamento, e degradação
declarada. Sem prazo máximo, um pedido pendente deixa a interface à espera de algo que não
vem.

A cache de geocodificação por `distritoChave` já existe e está certa. Generalizar o
princípio: pedido idêntico não se repete.

### 4.6 A ocorrência não se pode perder

O adaptador `ARMAZEM` cai para memória de sessão e avisa que o estado se perde ao fechar.
O aviso é honesto, mas insuficiente para o contexto: perder o registo de uma ocorrência
em curso é perder a fita do tempo, as propostas emitidas e a prova das decisões.

Proposta: exportação e importação da ocorrência em JSON, sempre disponíveis, independentes
do armazenamento. Funcionam em `file://`, não dependem de nada, e dão ao oficial uma cópia
que ele controla. Quando o modo for memória de sessão, a aplicação deve insistir na
exportação, não limitar-se a avisar uma vez.

---

## 5. O ponto de decisão estratégico

A secção 8 diz que a chamada ao modelo é feita à API sem chave no código, dependendo do
ambiente de execução, e que fora desse ambiente a aplicação usa sempre a via
determinística — comportamento aceite e não defeito a corrigir.

Aceitando isso como está, há uma conclusão a tirar: **para o oficial no PCO, com o ficheiro
aberto em `file://`, a via determinística não é a alternativa. É a única.** Vale a pena
assumi-lo e investir nela em conformidade, e não tratá-la como recurso degradado.

Isto tem consequência direta no primeiro item de trabalho em aberto. O pipeline de seis
agentes — Meteo, Topografia, Demografia, Comportamento do Fogo, Sintetizador e Crítico —
não é alcançável no modelo de distribuição atual. São seis chamadas encadeadas a um modelo
que, no terreno, não está lá.

Há três caminhos, e a escolha é de comando, não técnica:

1. **Não fazer.** Concentrar o esforço em tornar a via determinística tão boa quanto a
   doutrina permite. Custo zero de infraestrutura, teto de qualidade mais baixo.
2. **Serviço acompanhante opcional.** Um serviço pequeno do CSREPC, com a chave do lado do
   servidor, que a aplicação usa quando alcança a rede e ignora quando não alcança. A
   aplicação continua a abrir em `file://` e a funcionar sozinha. Introduz infraestrutura
   a manter e uma decisão de segurança sobre onde vive a chave.
3. **Gerar o PEA noutro sítio.** O oficial exporta o contexto da ocorrência, obtém a
   proposta onde tiver acesso ao modelo, e importa-a de volta. Sem infraestrutura, mas com
   passo manual.

Nunca colocar a chave no ficheiro. Um ficheiro distribuído por vários postos de comando é
uma chave publicada.

---

## 6. Caminho técnico para os itens em aberto

**Exportação em DOCX.** Um ficheiro DOCX é um ZIP com XML lá dentro. É possível escrevê-lo
em JavaScript puro, sem bibliotecas, usando o método de armazenamento sem compressão — o
Word abre. É preciso implementar CRC-32 e o cabeçalho do ZIP, e são poucas dezenas de
linhas. Quanto à tipografia de letras empilhadas do modelo da ANEPC, a via correta em
WordprocessingML é a direção de texto na célula da tabela, e não a fusão vertical de
células que se tentou antes.

**Plano de comunicações em folha autónoma.** É uma folha de impressão adicional com a
mesma mecânica da folha do PEA, que já existe. Baixo custo, valor imediato: uma tabela
afixada no PCO é consultada por quem não está ao computador.

**Briefing de passagem de comando.** Deriva de dados que já estão todos no estado —
estrutura do PCO, plano de comunicações, evolução desde o último PEA, conformidade.
Deve ser determinístico, sem modelo. E é o candidato natural a primeiro teste da camada 0,
por ser função pura do estado.

---

## 7. Sequência recomendada

1. Trazer o HTML da última revisão para `app/` e registar a revisão.
2. Camada 0: verificação de sintaxe, ESLint, primeiros testes sobre as funções puras de
   conformidade, integração contínua.
3. Correções 4.1 e 4.2, com os testes já a proteger.
4. Camada 1: tipos em JSDoc para o estado.
5. Correção 4.3, e `docs/FONTES.md`.
6. Decisão da secção 5.
7. Camada 2, quando a rede de segurança estiver montada.
8. Itens em aberto, por ordem de custo: plano de comunicações impresso, briefing, DOCX.

Os pontos por confirmar da secção 9 — designação PC COM 1 a 5, séries CT e CM, numeração
da NEP n.º 8/NT/2010 — devem ser resolvidos contra as fontes em vigor antes de o
subsistema de canais crescer mais. Uma designação errada propaga-se aos documentos
emitidos, e um PEA emitido é um documento de comando.

---

## 8. Decisões que dependem do Ricardo

1. A camada 2 é aceitável, sabendo que o ficheiro entregue não muda e que passa a ser
   preciso Node para produzir uma entrega?
2. Qual dos três caminhos da secção 5 para o pipeline de agentes?
3. As revisões antigas do HTML devem ficar todas em `app/`, ou fica um ficheiro canónico
   com o histórico em git e a cópia com nome de convenção produzida na entrega?
