# SGO — Estação PEA

Contexto permanente do projeto. Lido automaticamente no início de cada sessão.
A especificação completa está em `docs/CSREPCDouro_202608272046_PromptEstacaoPEA_CLD.md`
e é a fonte de verdade; este ficheiro é o resumo operacional.

## O que é

Aplicação de página única, num único ficheiro HTML autónomo, que serve de estação de
trabalho ao Posto de Comando Operacional do CSREPC Douro em incêndios rurais. Recolhe os
dados da ocorrência, acompanha a evolução, verifica a conformidade com a doutrina e emite
propostas sucessivas e numeradas de Plano Estratégico de Ação.

Utilizador-alvo: oficial de planeamento ou COS, em PCO, com ligação de dados intermitente.
Abre como ficheiro local, sem servidor, sem instalação, sem passo de compilação.

## Restrições não negociáveis

1. **A entrega** é um único ficheiro HTML autónomo. Sem dependências, sem módulos
   externos: CSS, JS e tipos de letra por CDN dentro do ficheiro. Abre em `file://`, sem
   servidor e sem instalação. **A fonte** vive em `fonte/`, repartida por célula do PCO, e
   `npm run montar` produz a entrega. O Node é preciso para produzir, não para usar.
2. Português europeu em interface, comentários, mensagens e documentos gerados. Registo
   técnico-operacional, nunca português do Brasil.
3. Sem ícones e sem emojis, em lado nenhum. A hierarquia visual faz-se por tipografia,
   cor e relevo.
4. Conformidade legal auditada. Todo o conteúdo doutrinário citado tem fonte identificada.
   Não se inventam designações de canal, números de artigo, nomenclatura de células nem
   coordenadas. Sem confirmação em fonte, a aplicação pergunta ao utilizador.
5. Convenção de nomes: `CSREPCDouro_rNNNN_AAAAMMDDHHMM_NomeDoFicheiro_CLD.ext`.
   A revisão `rNNNN` incrementa a cada entrega e aparece no rodapé da aplicação.
6. Nunca assumir `localStorage`. O acesso a armazenamento passa sempre pelo adaptador
   `ARMAZEM` (`window.storage` → `localStorage` → memória de sessão).

## Onde estão as coisas

| Caminho | Conteúdo |
|---|---|
| `fonte/` | A fonte: `molde.html` e uma pasta por célula do PCO, com um módulo por subsistema. **É aqui que se altera** |
| `app/` | As entregas, um ficheiro HTML por revisão. **Geradas: não editar à mão** |
| `ferramentas/` | Montagem, extração do script, sintaxe, análise estática, tipos, código morto, cobertura de documentação, auditoria visual e validação de exportações |
| `ferramentas/historico/` | Guiões que produziram revisões antigas. Arquivados: não usar nem atualizar |
| `tipos/` | Formas do estado em `.d.ts` e linha de base do verificador. Não vai para o navegador |
| `tests/` | Testes, mantidos entre sessões. Ver `tests/README.md` |
| `docs/` | Documentos do projeto e estado vivo. Ver `docs/README.md` |
| `docs/interop/` | A ligação à Gestão PCO: esquemas, contrato e exemplos de referência |
| `docs/fontes/` | Documentos doutrinários externos, citados em `docs/FONTES.md` |
| `docs/qa/` | Provas de verificação em imagem, uma por revisão que as trouxe |
| `docs/cartografia/` | Cartas de uma ocorrência real, anotadas no PCO. É o alvo do mapa operacional |

Os dois que se leem primeiro, em qualquer sessão: `docs/ESTADO.md`, para saber onde se está,
e `docs/CSREPCDouro_202608272046_PromptEstacaoPEA_CLD.md`, que é a especificação completa.

## Método de trabalho

- Alterar em `fonte/`, nunca em `app/`. A entrega produz-se com `npm run montar`, que
  numera a revisão sozinho. Um teste recusa que a entrega divirja da fonte.
- A fonte está repartida por célula do posto de comando: `1-nucleo/`, `2-comando/`,
  `3-planeamento/`, `4-operacoes/`, `5-logistica/`, `6-turno/`, `7-arranque/`. Módulo novo
  entra na pasta da célula a quem a lei atribui a matéria, com prefixo numérico dentro
  dela. A ordem das pastas e depois a dos ficheiros é a ordem de montagem, e o código
  corre por essa ordem — o núcleo primeiro, o arranque no fim. Um `.js` solto na raiz de
  `fonte/` é recusado pela montagem.
- Antes de entregar: `npm run tudo` — sintaxe do `<script>` isolado, testes, análise
  estática, tipos, código morto e cobertura de documentação. Acrescentar um teste que
  exercite o caminho alterado.
- **Toda a função de topo diz o que promete**, numa linha imediatamente antes dela, e
  `npm run documentar` recusa que a cobertura desça de 100 %. Comenta-se o *porquê* —
  a razão da escolha, o defeito que a motivou, o que se recusou fazer. Um comentário
  que repete o nome da função ocupa o lugar do que faria falta.
- `npm run morto` relata o que está escrito e ninguém usa: identificadores procurados
  que o HTML não tem, identificadores e classes que ninguém usa, funções nunca chamadas.
  **Lê-se, não se aplica.** O que a análise não consegue ver — uma classe composta em
  tempo de execução, um rótulo fixo — declara-se em `SABIDOS`, com a razão.
- Campo novo no estado declara-se em `tipos/estacao.d.ts`; o verificador apanha o nome mal
  escrito.
- Ao substituir blocos grandes de código, confirmar por pesquisa que nenhuma função ficou
  órfã ou apagada. Já houve regressão assim, com botões a perder listeners e a falhar em
  silêncio dentro de um `try`. O `npm run lint` apanha-a hoje.
- A revisão no rodapé e no nome do ficheiro é carimbada pela montagem. Guardar todas as
  revisões em `app/`; as ferramentas escolhem sozinhas a de numeração mais alta.
- **Uma entrega, um número.** Cada ficheiro que sai do computador leva o número seguinte:
  nunca apagar uma entrega para remontar o mesmo número. Montagens intermédias de trabalho
  não são entregas e podem reutilizá-lo, desde que só uma fique. Já se perderam quatro
  entregas debaixo do mesmo `r0028` por isto.
  A numeração é partilhada com a linhagem paralela: os números que ela já usou e que ainda
  não chegaram aqui declaram-se em `app/RESERVADAS.md`, e a montagem salta-os. Sem isso
  nasceram duas `r0058` diferentes.
- Estado novo em `O` tem de ser declarado em `novoEstado`, e toda a mudança de forma leva
  uma migração ao fim de `MIGRACOES` com `VERSAO_ESTADO` a subir um.
- Campo novo no formulário declara o seu caminho em `data-campo`; não se escreve leitura à
  mão. Campo derivado, sem campo no formulário, não precisa de nada — nada passa por ele.
- Migração do pacote de canais faz-se em `carregarCanais`.
- O mapa desenha em duas projeções, declaradas em `GRELHAS`: Web Mercator e PT-TM06
  (EPSG:3763), que é a da cartografia oficial portuguesa. Quem desenha chama `gPara`,
  `gDe` e `gEscala` e não sabe em que grelha está. **Os eixos entram e saem em par** — a
  Transversa de Mercator não é separável, e projetar cada um sozinho já pôs um ponto do
  Douro a trinta quilómetros do sítio.
- As capturas em `tests/fixtures/capacidades/` são prova de proveniência do que os
  serviços responderam. **Não se editam**: um ficheiro alterado à mão deixa de ser prova,
  e `tests/capacidades.test.mjs` confere o resumo de cada um. Captura nova entra com o
  resumo em `resumos.json` e a linha no `MANIFESTO.md`.
- Verificação de conformidade nova é uma regra em `REGRAS_DON`, com as fontes declaradas
  e registadas em `docs/FONTES.md`. Regras de prazo recebem o instante, não leem o relógio.
- Verificar sempre nos dois temas e em largura reduzida: `npm run visual`. O tema alterna
  por botão, não por `prefers-color-scheme`.

## Base doutrinária

Despacho n.º 4067/2024 (SGO), DON n.º 2 / DECIR 2026, DON n.º 1 / DIOPS,
DL n.º 90-A/2022 (SIOPS), DON n.º 4 / DIRACAERO. Ver a tabela completa na especificação,
secção 3, e os pontos por confirmar na secção 9 — que não devem ser dados como assentes.
