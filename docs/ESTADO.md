# Estado do projeto

Atualizado em 2026-08-27.

## Situação atual

O repositório contém a especificação e as regras de trabalho. **O código da aplicação
ainda não está aqui.** A última revisão do ficheiro HTML existe fora do repositório,
em anexo de conversa, e tem de ser trazida para `app/` com o nome pela convenção
`CSREPCDouro_rNNNN_AAAAMMDDHHMM_EstacaoPEA_CLD.html`.

Enquanto isso não acontecer, cada sessão de trabalho continua a depender de anexar o
HTML à mão, e o histórico de revisões perde-se.

## Feito

- Especificação de continuidade fixada em `docs/`.
- `CLAUDE.md` com as restrições não negociáveis e o método de trabalho, lido
  automaticamente em cada sessão.
- Estrutura de pastas: `app/`, `docs/`, `tests/`.

## Próximo passo

1. Colocar a última revisão do HTML em `app/` e registar aqui o número de revisão.
2. Montar o arnês de teste em `tests/`: validação de sintaxe do `<script>` isolado
   e um teste funcional em jsdom.

## Trabalho em aberto

Da secção 12 da especificação, por ordem de dependência e não de prioridade:

- Pipeline de seis agentes previsto na arquitetura técnica: Meteo, Topografia,
  Demografia, Comportamento do Fogo, Sintetizador e Crítico.
- Exportação do PEA em DOCX com tipografia de letras empilhadas, já resolvida noutro
  protótipo, em vez de fusão vertical de células.
- Briefing de passagem de comando gerado a partir da estrutura do PCO e do plano de
  comunicações.
- Impressão do plano de comunicações em folha autónoma, para afixar no PCO.

## Pontos por confirmar em fonte

Marcados como tal na interface, não devem ser dados como assentes:

1. Designação PC COM 1 a 5. As séries PC TAT (1-15) e PC MAN (1-30) estão confirmadas
   em fonte; o rótulo dos cinco canais de comando foi deduzido por coerência.
2. Séries de banda alta CT e CM. Só o manobra 4 (CM4) tem confirmação direta, na
   DON n.º 2.
3. Numeração da NEP n.º 8/NT/2010 para a banda alta de VHF, não verificada linha a linha.

## Registo de revisões

| Revisão | Data | Alterações |
|---|---|---|
| — | — | Sem revisão do HTML registada no repositório |
