# Aplicação

**As entregas são geradas.** A fonte está em `fonte/` e a entrega produz-se com
`npm run montar`; não se edita o HTML desta pasta à mão, e um teste recusa que a entrega
divirja da fonte.

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

**Há duas revisões `r0023`**, de linhagens que correram em paralelo: a de `202608281344`
traz a camada de tipos, a de `202608281530` traz a repartição por células, os núcleos do
PCO e o adaptador de modelo. A `r0025` é a fusão das duas, e é a partir dela que se
continua. Ficam ambas, porque ambas foram entregues.

**A série `r0007` a `r0013` apareceu a 1 de setembro**, no descarregamento que trouxe o
histórico antigo, e o buraco que este ficheiro dava por perdido está fechado: a numeração
corre agora sem falhas da `r0005` à mais recente. **Continua a faltar a `r0004`**, que não
existe em nenhuma origem conhecida — e as `r0001` a `r0003`, `r0005` e `r0006` já cá estavam.

Vieram também **vinte e cinco montagens anteriores à convenção de revisões**, de 23, 26 e 27
de agosto. As duas de 23 de agosto — `202608231130_SGO_PEA.html` e `..._1135_...` — são
anteriores ao próprio nome do projeto. Ficam todas com o nome que tinham; renomeá-las faria
passar por convenção o que é anterior a ela.

## Quando o mesmo número tem mais do que um ficheiro

Acontece por duas razões diferentes, e convém não as confundir:

- **Duas linhagens entregaram o mesmo número.** É o caso da `r0023`, da `r0058` e da `r0074`.
  Ficam ambas, distintas pelo carimbo de data, porque ambas foram entregues. A razão de cada
  colisão está em `RESERVADAS.md`.
- **Montagens de trabalho da mesma entrega.** A linhagem paralela monta várias vezes até
  fechar uma revisão: chegaram quatro `r0066`, quatro `r0072`, três `r0070`, e uma `r0060` e
  uma `r0064` anteriores às que aqui estavam. Dessas **fica só uma por número**, que é a regra
  do projeto. As outras não se perderam: vivem no histórico do ramo `main`, de onde vieram.
