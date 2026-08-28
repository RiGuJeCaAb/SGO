# Estado do projeto

Atualizado em 2026-08-27.

## Situação atual

A revisão **r0016** está em `app/` e a verificação passa por inteiro: sintaxe correta,
análise estática sem problemas, vinte e nove testes a passar, e auditoria visual sem
transbordo nem exceções a 380, 480, 768 e 1440 px nos dois temas.

Faltam as revisões anteriores à r0014, que ainda estão fora do repositório.

## Decisões tomadas

Registadas em 2026-08-27, sobre a proposta de evolução técnica.

| Decisão | Resolução |
|---|---|
| Camada 2, fonte em módulos com entrega em ficheiro único | **Aceite.** O ficheiro entregue não muda; passa a ser preciso Node para produzir uma entrega |
| Revisões antigas do HTML | **Ficam todas em `app/`**, desde a primeira. A ordem alfabética dos nomes é a ordem das revisões |
| Pipeline de seis agentes | **Reformulado.** Quatro dos seis são cálculos determinísticos e ficam dentro da aplicação; os dois restantes seguem a via C, com o serviço acompanhante em aberto. Ver `CSREPCDouro_202608272132_PipelineAnalise_CLD.md` |

## Feito

- Especificação de continuidade fixada em `docs/`.
- `CLAUDE.md` com as restrições não negociáveis e o método de trabalho, lido
  automaticamente em cada sessão.
- Proposta de evolução técnica e desenho do pipeline de análise, em `docs/`.
- **Camada 0.** Extração do `<script>` do HTML, verificação de sintaxe sem execução,
  ESLint sobre o código extraído com erros mapeados à linha do HTML, dezanove testes com o
  executor incluído no Node, e integração contínua no GitHub. Ver `tests/README.md`.

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

1. Colocar em `app/` as revisões anteriores à r0014, para completar o histórico.
3. Correções 4.1 (versionar o estado gravado) e 4.2 (inverter o sentido de `lerForm`),
   com os testes já a proteger.
4. Camada 1: tipos em JSDoc para o estado.
5. Correção 4.3 (registo de regras de conformidade) e `docs/FONTES.md`.
6. Camada 2, com a divisão em módulos a seguir a estrutura da secção 5.1 da especificação.

## Trabalho em aberto

- Camada de análise determinística: consolidar Meteo, Topografia e Demografia; fixar a
  fonte do modelo de comportamento do fogo antes de escrever esse módulo.
- Exportação do contexto da ocorrência e importação de proposta, com validação.
- Exportação do PEA em DOCX, com direção de texto na célula em vez de fusão vertical.
- Briefing de passagem de comando, determinístico.
- Impressão do plano de comunicações em folha autónoma.

## Pontos por confirmar em fonte

Marcados como tal na interface, não devem ser dados como assentes:

1. Designação PC COM 1 a 5. As séries PC TAT (1-15) e PC MAN (1-30) estão confirmadas
   em fonte; o rótulo dos cinco canais de comando foi deduzido por coerência.
2. Séries de banda alta CT e CM. Só o manobra 4 (CM4) tem confirmação direta, na
   DON n.º 2.
3. Numeração da NEP n.º 8/NT/2010 para a banda alta de VHF, não verificada linha a linha.
4. Modelo de comportamento do fogo a adotar. Decisão doutrinária, prévia ao código.

## Registo de revisões

| Revisão | Data | Alterações |
|---|---|---|
| r0014 | 2026-08-27 22:08 | Primeira revisão colocada no repositório. Estado como recebida, sem alterações |
| r0015 | 2026-08-28 01:17 | Reposta a chamada a `leitura()` na legenda do meteograma; removida `corRH()`, código morto com cores fixas; corrigido escape desnecessário em três expressões regulares |
| r0016 | 2026-08-28 12:14 | Largura reduzida: quebra de linha nas ações do cabeçalho; media query do plano de comunicações a vencer `.cm-f.nb`; cartões de integrações a encolher e a quebrar designações longas; seletor de CSV a quebrar |
