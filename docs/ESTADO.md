# Estado do projeto

Atualizado em 2026-08-27.

## Situação atual

O repositório tem a especificação, as regras de trabalho, a proposta de evolução técnica e
a camada 0 de verificação a funcionar. **O código da aplicação ainda não está aqui.**

As revisões do HTML existem fora do repositório, em anexos de conversa. Enquanto não
forem colocadas em `app/`, as ferramentas não têm sobre o que correr e cada sessão de
trabalho continua a depender de anexar o ficheiro à mão.

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

## Próximo passo

1. Colocar todas as revisões do HTML em `app/`, da primeira à mais recente.
2. Correr `npm run tudo` sobre a revisão mais alta e tratar o que aparecer.
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
| — | — | Sem revisão do HTML registada no repositório |
