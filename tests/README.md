# Testes e verificação

Ferramentas de desenvolvimento. Nada disto acompanha a aplicação entregue: o ficheiro
HTML continua a abrir sozinho, sem servidor e sem instalação.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run verificar` | Compila o `<script>` da revisão mais recente sem o executar. Apanha erro de sintaxe |
| `npm run testar` | Corre os testes com o executor incluído no Node |
| `npm run lint` | Corre o ESLint sobre o código extraído do HTML |
| `npm run tudo` | Os três, por esta ordem |

Todos aceitam um caminho explícito: `npm run verificar -- app/CSREPCDouro_r0012_....html`.
Sem argumento, escolhem a revisão de numeração mais alta em `app/`.

## Porquê

`no-unused-vars` apanha a função que ficou órfã. `no-undef` apanha a chamada a função que
já não existe. Foi essa a regressão registada na especificação, com botões a perder
listeners e a falhar em silêncio dentro de um `try`. As duas regras apanham-na
estaticamente, sem executar nada. `tests/fixtures/orfa.html` reproduz exatamente esse
caso, e `tests/lint.test.mjs` verifica que continua a ser apanhado.

## Onde investir

O maior valor está nas funções puras sobre o estado — conformidade, coordenadas, CSV,
métricas, níveis sugeridos. Não precisam de DOM e testam-se sem jsdom. O jsdom fica para
os caminhos de render, que custam mais e rendem menos.

Os erros são sempre reportados com a linha do HTML de origem, não com a linha do ficheiro
extraído.
