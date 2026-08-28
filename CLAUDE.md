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

1. Um único ficheiro HTML. Sem build, sem bundler, sem dependências npm, sem módulos
   externos. CSS, JS e tipos de letra por CDN dentro do ficheiro. Funciona em `file://`.
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
| `app/` | A aplicação, um ficheiro HTML por revisão, com o nome pela convenção |
| `docs/CSREPCDouro_202608272046_PromptEstacaoPEA_CLD.md` | Especificação completa: arquitetura, estado, subsistema de canais, motor de conformidade, geração do PEA, sistema visual |
| `docs/CSREPCDouro_202608272118_PropostaEvolucao_CLD.md` | Proposta de evolução técnica: camadas de estabilidade, linguagens, correções estruturais, decisões em aberto |
| `docs/ESTADO.md` | O que está feito, em curso e por fazer. Atualizar no fim de cada sessão |
| `docs/CSREPCDouro_202608272132_PipelineAnalise_CLD.md` | Desenho do pipeline de análise: o que é determinístico e o que precisa de modelo |
| `ferramentas/` | Extração do script, verificação de sintaxe e análise estática |
| `tests/` | Testes, mantidos entre sessões. Ver `tests/README.md` |

## Método de trabalho

- Alterar sempre o ficheiro único; não partir a aplicação em módulos.
- Antes de entregar: `npm run tudo` — sintaxe do `<script>` isolado, testes e análise
  estática. Acrescentar um teste que exercite o caminho alterado.
- Ao substituir blocos grandes de código, confirmar por pesquisa que nenhuma função ficou
  órfã ou apagada. Já houve regressão assim, com botões a perder listeners e a falhar em
  silêncio dentro de um `try`.
- Incrementar a revisão no rodapé e no nome do ficheiro. Guardar todas as revisões em
  `app/`; as ferramentas escolhem sozinhas a de numeração mais alta.
- Estado novo em `O` tem de ser declarado em `novoEstado`, e toda a mudança de forma leva
  uma migração ao fim de `MIGRACOES` com `VERSAO_ESTADO` a subir um.
- Campo novo no formulário declara o seu caminho em `data-campo`; não se escreve leitura à
  mão. Campo derivado, sem campo no formulário, não precisa de nada — nada passa por ele.
- Migração do pacote de canais faz-se em `carregarCanais`.
- Verificar sempre nos dois temas e em largura reduzida: `npm run visual`. O tema alterna
  por botão, não por `prefers-color-scheme`.

## Base doutrinária

Despacho n.º 4067/2024 (SGO), DON n.º 2 / DECIR 2026, DON n.º 1 / DIOPS,
DL n.º 90-A/2022 (SIOPS), DON n.º 4 / DIRACAERO. Ver a tabela completa na especificação,
secção 3, e os pontos por confirmar na secção 9 — que não devem ser dados como assentes.
