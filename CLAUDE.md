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
   servidor e sem instalação. **A fonte** vive em `fonte/`, um módulo por subsistema, e
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
| `fonte/` | A fonte: `molde.html` e um módulo por subsistema. **É aqui que se altera** |
| `app/` | As entregas, um ficheiro HTML por revisão. **Geradas: não editar à mão** |
| `ferramentas/` | Montagem, extração do script, sintaxe, análise estática, tipos, auditoria visual e validação de exportações |
| `ferramentas/historico/` | Guiões que produziram revisões antigas. Arquivados: não usar nem atualizar |
| `tipos/` | Formas do estado em `.d.ts` e linha de base do verificador. Não vai para o navegador |
| `tests/` | Testes, mantidos entre sessões. Ver `tests/README.md` |
| `docs/` | Documentos do projeto e estado vivo. Ver `docs/README.md` |
| `docs/interop/` | A ligação à Gestão PCO: esquemas, contrato e exemplos de referência |
| `docs/fontes/` | Documentos doutrinários externos, citados em `docs/FONTES.md` |

Os dois que se leem primeiro, em qualquer sessão: `docs/ESTADO.md`, para saber onde se está,
e `docs/CSREPCDouro_202608272046_PromptEstacaoPEA_CLD.md`, que é a especificação completa.

## Método de trabalho

- Alterar em `fonte/`, nunca em `app/`. A entrega produz-se com `npm run montar`, que
  numera a revisão sozinho. Um teste recusa que a entrega divirja da fonte.
- Módulo novo entra em `fonte/` com prefixo numérico: a ordem dos nomes é a ordem de
  montagem, e o código corre por essa ordem.
- Antes de entregar: `npm run tudo` — sintaxe do `<script>` isolado, testes, análise
  estática e tipos. Acrescentar um teste que exercite o caminho alterado.
- Campo novo no estado declara-se em `tipos/estacao.d.ts`; o verificador apanha o nome mal
  escrito.
- Ao substituir blocos grandes de código, confirmar por pesquisa que nenhuma função ficou
  órfã ou apagada. Já houve regressão assim, com botões a perder listeners e a falhar em
  silêncio dentro de um `try`. O `npm run lint` apanha-a hoje.
- A revisão no rodapé e no nome do ficheiro é carimbada pela montagem. Guardar todas as
  revisões em `app/`; as ferramentas escolhem sozinhas a de numeração mais alta.
- Estado novo em `O` tem de ser declarado em `novoEstado`, e toda a mudança de forma leva
  uma migração ao fim de `MIGRACOES` com `VERSAO_ESTADO` a subir um.
- Campo novo no formulário declara o seu caminho em `data-campo`; não se escreve leitura à
  mão. Campo derivado, sem campo no formulário, não precisa de nada — nada passa por ele.
- Migração do pacote de canais faz-se em `carregarCanais`.
- Verificação de conformidade nova é uma regra em `REGRAS_DON`, com as fontes declaradas
  e registadas em `docs/FONTES.md`. Regras de prazo recebem o instante, não leem o relógio.
- Verificar sempre nos dois temas e em largura reduzida: `npm run visual`. O tema alterna
  por botão, não por `prefers-color-scheme`.

## Base doutrinária

Despacho n.º 4067/2024 (SGO), DON n.º 2 / DECIR 2026, DON n.º 1 / DIOPS,
DL n.º 90-A/2022 (SIOPS), DON n.º 4 / DIRACAERO. Ver a tabela completa na especificação,
secção 3, e os pontos por confirmar na secção 9 — que não devem ser dados como assentes.
