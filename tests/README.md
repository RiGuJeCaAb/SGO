# Testes e verificação

Ferramentas de desenvolvimento. Nada disto acompanha a aplicação entregue: o ficheiro
HTML continua a abrir sozinho, sem servidor e sem instalação.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run verificar` | Compila o `<script>` da revisão mais recente sem o executar. Apanha erro de sintaxe |
| `npm run testar` | Corre os testes com o executor incluído no Node |
| `npm run lint` | Corre o ESLint sobre o código extraído do HTML |
| `npm run tipos` | Verifica os tipos com o TypeScript, sem compilar nada |
| `npm run montar` | Junta os módulos de `fonte/` e produz a entrega seguinte em `app/` |
| `npm run validar-gp -- <ficheiro>` | Corre o leitor da Gestão PCO sobre uma exportação e diz o que a Estação fará com ela |
| `npm run morto` | Relata identificadores e funções que ninguém usa, e recusa acima da linha de base — zero desde a r0102. **Lê-se antes de apagar**: o falso positivo declara-se em `SABIDOS` |
| `npm run documentar` | Confere que toda a função de topo diz o que promete; recusa que a cobertura desça de 100 % |
| `npm run manual` | Confere que todo o rótulo que `docs/MANUAL.md` cita entre «aspas angulares» existe mesmo na entrega |
| `npm run tudo` | Sintaxe, testes, análise estática, tipos, código morto, cobertura de documentação e manual, por esta ordem |
| `npm run visual` | Abre a revisão num Chromium e procura transbordo horizontal e exceções, em todos os separadores, a 380, 480, 768 e 1440 px, nos dois temas |
| `npm run prova-arranque` | Abre a entrega de `file://` num Chromium com perfil vazio e afirma que a consola está limpa, que todos os símbolos de topo de `fonte/` existem no artefacto montado, e que o armazém e a base abriram. É o portão da ordem de montagem |
| `npm run prova-idb` | Num Chromium a sério, a abertura da base pela versão que ela tiver, e o `VersionError` que isso evita |
| `npm run prova-abas` | Num Chromium a sério e de `file://`, duas abas: uma escreve, a outra lê, o trinco rouba-se, o canal avisa |
| `npm run navegador` | As três provas e a auditoria visual, por esta ordem. É o segundo trabalho da CI, depois dos nove portões |

Todos aceitam um caminho explícito: `npm run verificar -- app/CSREPCDouro_r0012_....html`.
Sem argumento, escolhem a revisão de numeração mais alta em `app/`.

## Porquê

`no-unused-vars` apanha a função que ficou órfã. `no-undef` apanha a chamada a função que
já não existe. Foi essa a regressão registada na especificação, com botões a perder
listeners e a falhar em silêncio dentro de um `try`. As duas regras apanham-na
estaticamente, sem executar nada. `tests/fixtures/orfa.html` reproduz exatamente esse
caso, e `tests/lint.test.mjs` verifica que continua a ser apanhado.

## A verificação de tipos

As formas do estado estão em `tipos/estacao.d.ts`; a aplicação traz anotações curtas que
apontam para elas. Nada disto é carregado pelo navegador.

O estreitamento de tipos do DOM está fora do alvo: o valor está em apanhar campo de estado
mal escrito, campo que se assume existir e não existe, e valor que pode ser nulo e não é
tratado. Os diagnósticos do DOM ficam numa linha de base em `tipos/baseline.json`, e o que
a exceder faz falhar a verificação. `npm run tipos -- --registar` volta a registá-la — a
usar quando a linha desce, nunca para calar um diagnóstico novo.

## A auditoria visual

`npm run visual` não entra no `npm run tudo`: precisa do Playwright e de um Chromium, e a
verificação corrente não pode depender de um navegador instalado. Sem eles, sai sem falhar.
O executável pode ser indicado em `PEA_CHROMIUM`.

Foi esta ferramenta que encontrou o transbordo do cabeçalho corrigido na r0016. Correr
antes de cada entrega, e sempre que se mexer no CSS.

O tema alterna por botão e pelo `ARMAZEM`, não por `prefers-color-scheme` — testar por
preferência do sistema não troca de tema nenhum.

## O arnês da aplicação

`tests/app.mjs` carrega a revisão mais recente de `app/` num DOM simulado e devolve a
janela, para que os testes chamem diretamente as funções da aplicação. Os testes que dele
dependem saltam-se sozinhos quando não há revisão em `app/`.

A aplicação arma temporizadores — a conformidade é reavaliada a cada trinta segundos —,
por isso a janela tem de ser fechada no fim, ou o processo de teste nunca termina.

## As capturas dos serviços reais

`tests/fixtures/capacidades/` guarda o que os serviços de cartografia responderam a
`GetCapabilities` em 31 de agosto de 2026 — cinco WMTS, dezoito WMS e os vinte e três
conjuntos de cabeçalhos HTTP. São **prova de proveniência**, e o valor delas está em serem
o que o servidor disse: um ficheiro editado à mão deixa de o ser. `capacidades.test.mjs`
confere o resumo SHA-256 de cada um antes de o usar, e recusa que a pasta e o manifesto
divirjam.

Capturas inventadas confirmam o que quem as escreve já acredita. Estas desmentiram quatro
coisas que se davam por assentes — que havia vários WMTS oficiais, que um erro vem com
código de erro HTTP, que a DGT publicaria Web Mercator e que todos os anfitriões abriam o
CORS. As quatro estão registadas no `MANIFESTO.md`.

Captura nova entra com o ficheiro, o resumo em `resumos.json` e a linha no `MANIFESTO.md`.

## Onde investir

O maior valor está nas funções puras sobre o estado — conformidade, coordenadas, CSV,
métricas, níveis sugeridos. Não precisam de DOM e testam-se sem jsdom. O jsdom fica para
os caminhos de render, que custam mais e rendem menos.

Os erros são sempre reportados com a linha do HTML de origem, não com a linha do ficheiro
extraído.
