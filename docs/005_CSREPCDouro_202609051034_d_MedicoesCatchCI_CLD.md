# #005-d0003 — Cinco medições, 103 `catch` vazios classificados, CI com navegador

**Ramo:** #005 (CLD) · **Data:** 2026-09-05 10:34 UTC
**Base de leitura:** repositório `RiGuJeCaAb/SGO`, `main` em `f9852b0`; entregas r0087 e r0093
**Método:** Chromium 141.0.7390.37, perfil vazio, `file://`, sem opções de linha de comando

É a primeira vez que leio a árvore `fonte/` e não a sombra dela. Três das conclusões abaixo não eram alcançáveis a partir do artefacto.

---

## Parte 1 — As cinco medições

Consolidadas, com o guião que as produz e o número, para poderem ser repetidas contra qualquer entrega.

| # | Medição | Resultado | Guião |
|---|---|---|---|
| 1 | Arranque de `file://`, perfil vazio | 0 `pageerror`, 0 `console.error`, 0 pedidos falhados, 1 838 nós, 9,5 MB de heap | `q005_auditoria` |
| 2 | IndexedDB em `file://` | **Abre e escreve.** `ARMAZEM.modo = "indexeddb"`, atómico. `isSecureContext = true`, `crypto.subtle` disponível | `q005_auditoria` |
| 3 | Repintura com três folhas 4000×3000 | r0087: 7,8 MB de SVG, 103 ms. r0093: **0,26 KB, 0,5 ms** | `q005_blob` |
| 4 | Custo de uma folha por nível de aproximação | Folha 8000×6000, ficheiro de 0,56 MB: **+7,1 MB** enquadrada, **+188,4 MB** ao zoom nativo | `q005_zoom` |
| 5 | Libertação após `revokeObjectURL` | Três folhas: 174 MB ocupados, **5,8 MB libertados**. Os blobs somam 4,8 MB | `q005_blob` |

**O que as cinco dizem em conjunto, e que nenhuma diz sozinha:** o custo de uma folha de carta não é propriedade do ficheiro nem da folha — é propriedade do **nível de aproximação**, é diferido para o momento em que a folha é precisa, e **não regressa** quando a folha é retirada. Um turno que coloque e retire seis folhas pagou seis.

Ressalva de método, obrigatória na 5: o RSS não distingue «não libertado» de «libertado e não devolvido ao sistema pelo alocador». O que sustenta a leitura é a coincidência entre o libertado e a soma dos blobs. Indício forte, não prova.

---

## Parte 2 — Os `catch` classificados

Contados na árvore `fonte/`, com comentários e literais removidos antes da contagem, sobre `f9852b0`.

**197 blocos `catch`. Destes, 103 estão vazios.**

| Classe | Quantos | Critério |
|---|---|---|
| Vazio | 103 | `catch{}` sem uma linha |
| Recuo silencioso | 65 | devolve um valor de recurso sem o dizer |
| Recuo declarado | 22 | devolve recurso **e** relata (`aviso`, `fita`, carimbo) |
| Só consola | 3 | `console.error` e mais nada |
| Relança | 4 | `throw` |

### O critério que interessa não é a forma, é a consequência

Um `catch` vazio não é defeito por ser vazio. É defeito quando o que ele engole muda o que o operador vê ou o que fica gravado. Proponho três classes por consequência, e classifiquei os 103 por elas.

**Classe 1 — limpeza e idempotência (3 casos). Ficam como estão.**
`revokeObjectURL`, `remove()`, `close()`, `clearTimeout`. Falhar não muda nada observável, e não há nada a dizer. Revogar uma URL já revogada é inofensivo por definição.

**Classe 2 — isolamento de pintura (91 casos). O `catch` fica; o silêncio não.**
O padrão está deliberado e documentado em `escreverForm`: um painel que não pinta não pode impedir os outros de pintar. A decisão é correcta e não a contesto. O que falta é a contagem. Hoje, se `renderFormats()` falhar, os formatos da coordenada desaparecem do ecrã e **ninguém fica a saber** — nem o operador, nem o registo, nem quem receber o PEA impresso.

A correcção é a mesma doutrina do `BUILD NÃO VERIFICADO` e do carimbo de navegador abaixo do mínimo: não bloquear, **declarar**. Um contador de sessão, incrementado no `catch`, e um carimbo no rodapé quando é maior que zero:

```
3 painéis não pintaram nesta sessão. O que mostram pode estar em falta.
```

Uma linha por `catch`, um contador, um carimbo. Não muda o comportamento de nenhum caminho que hoje funcione.

**Classe 3 — perda de facto (9 casos). Estes têm de falar.**
Falhar significa que uma coisa que o utilizador julga feita não foi feita.

| Local | O que se perde em silêncio |
|---|---|
| `3-planeamento/11-meteograma.js:130` | **A detecção de série meteorológica alterada à mão.** Se lançar, `M.mexido` não é marcado e a entrada na fita não é escrita: a análise sai com a proveniência de uma série que já não é a que a fonte deu |
| `3-planeamento/23-folhas-de-carta-calibradas.js:273` | `guardarFolhas` — as colocações não persistem; descobre-se na sessão seguinte |
| `1-nucleo/05-persistencia.js:52` | `copiaSeDevida` — a cópia automática deixa de se fazer, e continua a não se fazer |
| `1-nucleo/22-diario-e-copias.js:169` | A poda das cópias; acumulam sem limite |
| `3-planeamento/05-mapa-operacional.js:453, 469, 534` | Leitura, escrita e limpeza da cache de mosaicos |
| `5-logistica/01-canais-siresp.js:82` | Reposição do pacote de canais guardado |
| `1-nucleo/01-armazenamento.js:38` | Sonda do `localStorage` — legítimo, é detecção de capacidade. **Reclassificar para 1** |

**O primeiro é de outra natureza que os restantes.** Os outros oito perdem comodidade ou trabalho. Esse perde uma **afirmação de proveniência**: um `catch{}` a engolir a verificação de que o CSV foi mexido é, na prática, a aplicação a deixar de saber que não pode confiar no que está a analisar. Pela regra da casa — um número sem proveniência é pior do que nenhum número — este é o mais grave dos 103 e trato-o como classe própria.

Os oito restantes seguem a mesma receita: reportar pelo caminho que já existe (`aviso` onde há caixa, `fita` onde há registo), sem bloquear.

---

## Parte 3 — CI com navegador

### O que existe

`npm run tudo` corre nove portões: `verificar`, `testar`, `lint`, `lint-ferramentas`, `tipos`, `morto`, `documentar`, `manual`, `arrumado`. O fluxo `verificar.yml` corre-o num só comando, o que foi a decisão certa depois de cinco portões terem ficado de fora de uma lista escrita à mão.

`tests/montagem.test.mjs` confronta `home.html` com a montagem da fonte, byte a byte, e verifica que o fluxo de publicação copia o ficheiro certo. **A deriva entre fonte e entrega está fechada** — e retiro a preocupação que exprimi a 2 de setembro sobre esse ponto, que já estava tratada antes de eu a levantar.

### O que falta, e é exactamente uma coisa

**Nenhum dos nove portões abre um navegador.**

Existem três ferramentas que abrem: `visual.mjs`, `prova-abas.mjs`, `prova-idb.mjs`. Nenhuma está em `tudo`, nenhuma está no fluxo, e o comentário de `prova-abas.mjs` diz porquê — «não entra no `npm run tudo`: precisa de navegador». O `playwright` está em `devDependencies` e nunca é exercido pela CI.

E há um segundo degrau: mesmo que uma dessas provas entrasse em `tudo` hoje, **falharia na CI**. O fluxo faz `npm ci` e não faz `npx playwright install chromium`. O pacote instala-se, o binário não.

Isto deixa a descoberto a classe de defeito que o jsdom não vê por construção: a ordem de execução dos módulos no artefacto montado, o IndexedDB real, a partilha de origem entre abas `file://`, e o carimbo do mínimo de navegador no caminho negativo — que eu verifiquei à mão e nenhum portão verifica.

### Proposta

Um trabalho separado, a seguir aos nove portões, que não os atrasa e falha por si:

```yaml
  navegador:
    needs: verificar
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: npm }
      - run: npm ci

      # O binário não vem com o pacote. Sem este passo as provas com navegador
      # falham por ausência de Chromium e não pelo que iam provar.
      - run: npx playwright install --with-deps chromium

      # A entrega, e não a fonte. É o que o posto de comando abre.
      - run: npm run montar

      # Arranque a partir de `file://`, perfil vazio, sem opções de linha de
      # comando: replica o duplo clique de quem recebe o ficheiro.
      - run: npm run prova-arranque

      - run: npm run prova-idb
      - run: npm run prova-abas

      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: provas-navegador, path: docs/qa/ }
```

`npm run prova-arranque` é o que falta escrever e é o portão que mais falta faz: montar, abrir de `file://`, e afirmar que a consola está limpa, que `ARMAZEM.modo` é o esperado, e que um conjunto **declarado** de símbolos existe. O `q005_auditoria.js` faz isto e vai anexo, mas com uma limitação que assinalo: ele afirma que os símbolos que conhece existem — **não sabe o que devia lá estar**. Essa lista tem de sair de `fonte/`, e por isso a versão definitiva pertence ao CODE e não a mim. O que entrego é a forma.

**E é este o portão que fecha a lacuna da ordem.** Os testes de disco provam que cada módulo está presente. Nenhum prova que a concatenação não pôs uma dependência depois de quem a usa — em disco, o módulo está lá na mesma. Só arrancar o artefacto o diz.

O `upload-artifact` com `if: always()` é o que transforma uma CI vermelha em diagnóstico: sem as provas visuais guardadas, um falhanço remoto obriga a reproduzir localmente.

---

## Resumo do que proponho

| | |
|---|---|
| Classe 2, 91 casos | Contador de sessão e carimbo no rodapé. Nenhuma alteração de comportamento |
| Classe 3, 8 casos | Reportar pelo caminho existente. Não bloquear |
| `meteograma.js:130` | **Primeiro.** É perda de proveniência, não de comodidade |
| CI | Trabalho `navegador` separado, com `playwright install`, sobre a entrega montada |
| `prova-arranque` | Por escrever. Forma anexa; a lista de símbolos sai de `fonte/` |
