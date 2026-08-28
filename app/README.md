# Aplicação

Cada entrega é um ficheiro HTML autónomo, com o nome pela convenção do projeto:

```
CSREPCDouro_rNNNN_AAAAMMDDHHMM_EstacaoPEA_CLD.html
```

**Guardam-se todas as revisões, desde a primeira.** A revisão `rNNNN` incrementa a cada
entrega e tem de coincidir com a que aparece no rodapé da aplicação. Como `rNNNN` tem
sempre quatro dígitos, a ordem alfabética dos nomes é a ordem das revisões, e as
ferramentas usam isso: `npm run verificar` e `npm run lint` escolhem sozinhas a revisão
mais alta.

Manter o histórico completo permite comparar comportamentos e regressar a uma versão
conhecida em operação. A revisão mais alta é sempre a base de trabalho.

## O histórico

Os ficheiros com nome `CSREPCDouro_AAAAMMDDHHMM_EstacaoPEA_CLD.html`, sem `rNNNN`, são
anteriores à convenção de revisões e ficam com o nome que tinham. A numeração começa na
`r0001`.

**Falta a série `r0007` a `r0013`**, que não existe em nenhuma origem conhecida. A
`r0004` também não aparece. A continuidade do histórico quebra aí; a `r0014` foi a
primeira revisão a entrar no repositório por esta via.
