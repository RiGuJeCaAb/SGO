# Estado do projeto

Atualizado em 2026-08-27.

## Situação atual

A revisão **r0021** está em `app/` e a verificação passa por inteiro: sintaxe correta,
análise estática sem problemas, setenta e dois testes a passar, e auditoria visual sem
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

## Correção 4.5 — a rede como caminho de falha, feita na r0021

O `fetchT` já tinha prazo e cancelamento. Faltava-lhe o resto, e havia uma chamada a
escapar-lhe.

- **Cache de pedidos idênticos**, com validade de 90 segundos. Um pedido igual não se
  repete enquanto a resposta anterior serve, e dois pedidos iguais em simultâneo partilham
  a mesma ida à rede. Generaliza o princípio que só existia no `distritoChave`.
- **Sem ligação responde já**, com o motivo certo, em vez de esperar pelo prazo inteiro.
  Num PCO isto é a diferença entre saber e ficar à espera.
- **A falha passou a ter motivo**: sem rede, prazo esgotado, recusa da origem, ou falha.
  O `motivoRede` dá a frase, e as mensagens da previsão automática, do perfil do terreno e
  da amostragem do relevo passaram a dizer o que aconteceu em vez de mostrarem o erro cru.
- **A chamada ao modelo era a única sem prazo máximo.** Passou a tê-lo, com orçamento
  próprio de 60 segundos, e sem cache.

Uma recusa da origem não fica guardada, e quem chama continua a ver `r.ok` como antes:
os doze pontos de chamada não mudaram uma linha. Dez testes.

## Correção 4.3 — registo de regras de conformidade, feita na r0020

`verificacoesDON` era uma função de 277 linhas que crescia por acrescento. Passou a
`REGRAS_DON`, doze regras autónomas, cada uma com identificadores que emite, título,
fontes doutrinárias que invoca e função do contexto. `contextoDON` calcula uma vez o que
todas partilham.

Três ganhos:

1. **Uma regra que rebente deixou de levar as outras atrás.** Antes, uma exceção esvaziava
   o painel inteiro dentro do `try` do `pintarDON`. Agora vira aviso próprio, porque uma
   verificação que falha não pode passar por conformidade verificada.
2. **Cada regra exercita-se sozinha**, com um contexto construído à medida.
3. **As fontes passaram a ser auditáveis por comparação.** `docs/FONTES.md` tem uma entrada
   por documento, e `tests/fontes.test.mjs` recusa que uma regra invoque documento não
   listado, ou que cite um documento sem o declarar.

A reorganização não podia mudar uma palavra do que a aplicação diz ao COS. Foi verificada
por comparação direta com a r0019: sete estados montados à mão, nove instantes cada,
**63 comparações, zero diferenças** no JSON completo dos itens emitidos.

## Correção 4.4 — relógio injetado, feita na r0019

`agora()` é o ponto único de leitura da hora. `verificacoesDON(ts)` e `rendicoes(ts)`
aceitam o instante em argumento e só recorrem a esse ponto quando não o recebem.

Passaram a ter teste, com hora escolhida: a fronteira exata dos 90 minutos entre ataque
inicial e ampliado, a notificação das duas horas, a recomendação de PMEPC às vinte e
quatro, o silêncio das regras sem GDH de início, e a contagem das rendições. Dez testes.

Ficam por injetar os prazos de validade do PEA (`renderVigor`), que leem o relógio pelo
seu lado. Não são regras de conformidade e não entraram nesta correção.

## Correção 4.2 — o formulário escreve no estado, feita na r0018

Cada campo declara em `data-campo` o caminho do seu lugar no estado, e escreve só nesse
lugar. `lerForm` deixou de refazer `O.meta` de raiz: percorre os campos e escreve cada um.
Um ouvinte delegado mantém o estado a acompanhar o formulário à medida que é preenchido,
e não apenas ao gravar.

O que isto remove: **os campos derivados deixaram de precisar de preservação à mão.**
`distrito`, `concelho` e `distritoChave` sobrevivem porque nada passa por eles. Acrescentar
um campo derivado deixou de exigir cuidado dentro do `lerForm` — que era o aviso repetido
duas vezes na especificação, e a assinatura de um defeito de desenho.

Os outros dois sítios que reconstruíam `O.dados.topo` passaram a sincronizar pelo mesmo
caminho. Fica uma exceção declarada e visível: os setores em texto livre só contam com o
modo livre ligado.

Nove testes novos. Corridos contra a r0017, cinco falham — entre eles o que verifica que um
campo derivado novo sobrevive sem ninguém se lembrar dele.

## Correção 4.1 — versão do estado gravado, feita na r0017

`VERSAO_ESTADO` e uma cadeia `MIGRACOES` em que o índice i migra da versão i para a i+1.
O `carregar` passa por `migrarGravado`, que:

- trata como versão zero tudo o que não traga marca, e migra;
- preenche contra os valores por omissão os ramos que o carregamento antigo deixava por
  normalizar — `meta`, `pco` e os ramos de `dados` —, sem sobrepor valor gravado;
- garante que os ramos que deviam ser listas o são;
- **recusa, sem tocar em nada, um estado gravado por revisão posterior**, e diz de que
  versão veio.

O que a migração 0 para 1 deliberadamente não faz: reinterpretar a semântica dos canais.
Uma ocorrência gravada antes de `siresp`/`ba` passarem a nível de manobra não traz marca
que permita distingui-la das posteriores. Adivinhar seria pior do que não mexer. O valor
desta correção está no que protege daqui para a frente: toda a mudança de forma passa a ter
migração numerada e testada.

Fica um risco por fechar: quando o carregamento é recusado por vir de revisão posterior, o
estado em memória não é tocado, mas nada impede que uma gravação seguinte com o mesmo
número de ocorrência sobreponha o registo mais recente. Trata-se com a correção 4.6,
exportação e importação da ocorrência.

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
2. Camada 1: tipos em JSDoc para o estado.
3. Correção 4.6: exportação e importação da ocorrência em JSON, que também fecha o risco
   deixado em aberto pela 4.1.
5. Camada 2, com a divisão em módulos a seguir a estrutura da secção 5.1 da especificação.

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
| r0017 | 2026-08-28 12:58 | Correção 4.1: versão do estado gravado, cadeia de migrações, recusa de estado de revisão posterior |
| r0018 | 2026-08-28 13:04 | Correção 4.2: cada campo escreve no seu lugar do estado por `data-campo`; `lerForm` deixa de reconstruir `O.meta` |
| r0019 | 2026-08-28 13:15 | Correção 4.4: relógio injetado; as regras de prazo passam a receber o instante e a ter teste |
| r0020 | 2026-08-28 13:19 | Correção 4.3: motor de conformidade em registo de doze regras autónomas; `docs/FONTES.md` e auditoria mecânica das citações |
| r0021 | 2026-08-28 13:26 | Correção 4.5: cache de pedidos idênticos, resposta imediata sem ligação, motivo de falha legível, prazo na chamada ao modelo |
