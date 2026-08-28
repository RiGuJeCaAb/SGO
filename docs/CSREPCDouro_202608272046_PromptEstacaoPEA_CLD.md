# Estação PEA — prompt de continuidade

Contexto de trabalho para retomar o desenvolvimento da aplicação num agente de código.
Cola este ficheiro no início da sessão, junto com o HTML da última revisão.

---

## 1. O que é

Aplicação de página única, num único ficheiro HTML autónomo, que serve de estação de
trabalho ao Posto de Comando Operacional (PCO) do CSREPC Douro em incêndios rurais.
Recolhe os dados da ocorrência, acompanha a evolução da situação, verifica a conformidade
com a doutrina e emite propostas sucessivas e numeradas de Plano Estratégico de Ação (PEA).

Utilizador-alvo: oficial de planeamento ou COS, num PCO, muitas vezes com ligação de dados
intermitente. A aplicação tem de funcionar aberta como ficheiro local, sem servidor,
sem instalação e sem passo de compilação.

---

## 2. Restrições não negociáveis

1. **Um único ficheiro HTML.** Sem build, sem bundler, sem dependências npm, sem módulos
   externos. Tudo — CSS, JS, tipos de letra por CDN — dentro do ficheiro. Abre-se com duplo
   clique num `file://`.
2. **Português europeu** em toda a interface, comentários de código, mensagens e documentos
   gerados. Registo técnico-operacional, nunca português do Brasil.
3. **Sem ícones e sem emojis**, em lado nenhum: interface, documentos, mensagens, fita do
   tempo. A hierarquia visual faz-se por tipografia, cor e relevo.
4. **Conformidade legal auditada.** Qualquer conteúdo doutrinário citado na interface ou nos
   documentos tem de ter fonte identificada. Não se inventam designações de canal, números
   de artigo, nomenclatura de células ou coordenadas. Quando a fonte não confirma, a
   aplicação pede o dado ao utilizador em vez de o presumir.
5. **Convenção de nomes de ficheiro:**
   `CSREPCDouro_rNNNN_AAAAMMDDHHMM_NomeDoFicheiro_CLD.ext`
   A revisão `rNNNN` incrementa a cada entrega e aparece também no rodapé da aplicação.
6. **Nada de `localStorage` assumido.** O acesso a armazenamento passa sempre pelo adaptador
   `ARMAZEM` (ver 5.2).

---

## 3. Base doutrinária

| Referência | Uso na aplicação |
|---|---|
| Despacho n.º 4067/2024, de 15 de abril — regulamentação do SGO | Estrutura do PCO (art. 14.º), células e competências (art. 32.º), setorização (art. 5.º), hierarquização das comunicações (art. 4.º), estrutura e conteúdo do PEA |
| DON n.º 2 / DECIR 2026 | Níveis de empenhamento, prazos de ataque inicial e ampliado, POSIT, atribuição e uso dos canais rádio (ponto 10), estados de setor (ponto 7.f) |
| DON n.º 1 / DIOPS | Organização das comunicações, articulação com o CSREPC |
| DL n.º 90-A/2022, de 30 de dezembro — SIOPS | Enquadramento do sistema |
| DON n.º 4 / DIRACAERO | Meios aéreos, COPAR |
| NEP n.º 8/NT/2010 | Banda alta de VHF (ROB) — **por confirmar**, ver secção 9 |
| NEP n.º 1/DIC/2026, NEP n.º 2/CNEPC/2022, NOP n.º 1701/2018 | Grupos SIRESP — **por confirmar**, ver secção 9 |

Terminologia obrigatória: COS, PCO, PEA, ZI/ZA/ZS, setores com referência alfabética
(Alfa a Lima), LACES, POSIT, COPAR-A e COPAR-T, COPESP, OPAR, fita do tempo, Célula de
Logística e Finanças, Local Estratégico de Reserva, Ponto de Trânsito.

---

## 4. Estrutura da interface

Cabeçalho fixo com identificação da ocorrência, sinal de avisos, gravar, ajuda e tema.
Abaixo, barra de separadores e uma banda de próximo passo que aponta sempre ao campo em falta.

| Separador | Conteúdo |
|---|---|
| 1 · Ocorrência | Identificação, coordenadas em três formatos, geocodificação, arquivo de ocorrências |
| 2 · Fontes de dados | Perímetro GeoJSON, CSV meteorológico, dispositivo, setores, meios aéreos, pontos sensíveis, estado das integrações |
| 3 · PCO / PLACOM | Estrutura do posto de comando, pacote de canais, plano de comunicações |
| 4 · Evolução / POSIT | Registo cronológico da situação, linha de evolução |
| 5 · Meteograma | Previsão, análise determinística, limiares |
| 6 · PEA | Verificação de conformidade, emissão da proposta, histórico |
| Fita do tempo | Registo automático de todos os atos |
| Avisos (painel) | Conformidade verificada, controlo de tempos e rendições |

---

## 5. Arquitetura

### 5.1 Organização do ficheiro

Ordem dos blocos no `<script>`, marcados por comentários de secção:

```
estado e persistência    novoEstado, persistir, carregar, lerForm, escreverForm, migrarEstado
arquivo                  carregarIndex, pintarArquivo, chave
coordenadas              fmtDec, fmtGMD, fmtGMS, renderFormats, parseCoordAny
setores                  estObj, renderSetores, comporSetores, totSetor
geocodificação           geoPhoton, geoOpenMeteo, geoNominatim, geoModelo, geocodificar
distrito                 normalizarDistrito, distritoPorCoords, atualizarDistrito
verificação de dados     pendencias, pintarGuia, renderCheck
fontes                   areaGeoJSON, parseCSV, analisar, analisarCSV, meteoAutomatica,
                         analisarRelevo, detetarSensiveis, obterAvisos
meteograma               svgMeteo, metricas, resumoHoras, corRH, limiares
PCO                      pcoObj, pcoDef, funcoesExigiveis, renderPCO
pacote de canais         pacoteBase, carregarCanais, guardarCanais, canalAdd, optsCanal,
                         pintarSel, pintarSelTodos, renderCatalogo, initCatalogo
plano de comunicações    nivObj, niveisSugeridos, autoNiveis, renderNiveis, renderAtrib,
                         renderComs
conformidade             verificacoesDON, pintarDON, rendicoes, aerLista, renderAereos
evolução                 addEvo, inserirEvo, evoDesdeUltimoPEA
geração do PEA           llm, contexto, gerarPlan, gerarOps, detPlan, detOps, emitirPEA
render geral             pintarTudo, aplicarTema
```

Convenção: `$(id)` é `document.getElementById`; `esc()` escapa HTML; `fita(texto)` regista na
fita do tempo; `aviso(destino, tipo, texto)` mostra mensagem; `persistir(true|false)` grava.

### 5.2 Armazenamento

Adaptador de três níveis, escolhido uma vez no arranque:

```
window.storage  →  localStorage  →  memória de sessão
```

Exposto em `ARMAZEM.get/set/del`, todos assíncronos, e `ARMAZEM.modo` com o nível ativo.
Quando cai em memória de sessão, a aplicação avisa que o estado se perde ao fechar.

Chaves: `peaapp:occ:<n.º>` (uma por ocorrência), `peaapp:index` (arquivo),
`peaapp:canais` (pacote de canais, ao nível do dispositivo), `peaapp:ultima`,
`peaapp:tema`, `peaapp:ajuda`.

### 5.3 Estado

```js
O = {
  meta:{ num, local, pco, fase, lat, lon, pasta, inicio, nivel,
         distrito, concelho, distritoChave },
  avisos: null,
  dados:{ area, perimNome, setores, sensiveis, anexos:[],
          topo:{ orient, declive, obs },
          est:{ n, setores:[…], aer, aerL:[…], res:{m,o}, za:{m,o}, livre } },
  pco:{ funcoes:[…], canais:{ cmd, tat, ba, aero, opar, cmar, tatba, atrib:[], niveis } },
  evolucao:[…], csv:"", peas:[…], fita:[…]
}
```

Setor: `{ estado, cmd, siresp, ba, tat, tatba, tip:[…] }` — `siresp`/`ba` são o nível de
manobra, `tat`/`tatba` o nível tático.
Função do PCO: `{ f, nome, entidade, ct, siresp, ba, g }`.
Níveis: `{ comando, tatico, manobra, aereo, ba, tocado }`.

Nota importante: `lerForm()` reconstrói `O.meta` a partir dos campos do formulário. Campos de
`meta` que não tenham campo no formulário — `distrito`, `concelho`, `distritoChave` — têm de
ser explicitamente preservados nessa função. Ao acrescentar qualquer campo derivado, verificar
sempre este ponto.

---

## 6. Subsistema de canais

Implementa a sequência doutrinária: os canais existem, o CSREPC atribui-os ao TO, o COS
distribui-os pelos interlocutores.

**Pacote (`CANAIS`, gravado no dispositivo).** Carregado de origem com 50 grupos de
conversação SIRESP de âmbito distrital — 5 de comando (PC COM 1 a 5), 15 táticos (PC TAT 1 a
15), 30 de manobra (PC MAN 1 a 30) — mais o OPAR 01, e as séries de banda alta da ROB
(CT1 a CT15, CM1 a CM30). Entradas do pacote levam `pk:true`; as acrescentadas pelo
utilizador não, e aparecem numa tabela própria, removíveis. Há reposição do pacote,
exportação e importação em JSON para o CSREPC distribuir um pacote comum.

**Distrito.** Determinado por geocodificação inversa das coordenadas do TO, com Photon como
motor primário e OpenStreetMap em recurso. Não é editável. Guardado em `O.meta.distrito`,
com `distritoChave` a evitar chamadas repetidas para as mesmas coordenadas.

**Níveis (`canaisObj().niveis`).** O COS escolhe em caixas de seleção quais coloca a
funcionar: comando, tático, manobra, aéreo, mais um interruptor para a banda alta em paralelo.
Enquanto `tocado` for falso, os níveis seguem o dispositivo — setores ativados pedem tático e
manobra, meios aéreos pedem a ligação terra/ar/terra. À primeira escolha manual a sugestão
pára e passa a haver aviso do que estiver em falta.

**Atribuição (`canaisObj().atrib`).** Grelha de teclas com os canais do pacote dos níveis
ativos; clicar atribui ou liberta. As listas de escolha mostram primeiro os atribuídos.

> O plano de comunicações passou de `O.pco.canais` para `O.logistica.comunicacoes` na
> versão 6 do estado gravado — é matéria do art. 32.º, n.º 1, al. d), e do art. 34.º, e
> não das nomeações do art. 14.º. Lê-se sempre por `canaisObj()`, e nunca pelo caminho.

**Distribuição.** Um painel por nível ativo, com os interlocutores que existem no dispositivo:
geral do TO, funções do PCO, setores. Todos os campos são `<select>` da classe `.cs`, com
`data-rede`, `data-niv` e um de `data-cg` (canal geral), `data-cf` (função) ou `data-cs`
(setor). A última opção de cada lista regista um canal novo no pacote.

---

## 7. Motor de conformidade

`verificacoesDON()` devolve um array de itens:

```js
{ n:"ob"|"av"|"ok",   // obrigação, aviso, conforme
  id:"placom",        // destino, ver AV_DESTINO
  t:"título curto",
  s:"situação verificada",
  f:"fundamento doutrinário",
  a:"ação a tomar",
  r:"referência legal" }
```

`AV_DESTINO` liga cada `id` ao separador e ao rótulo do botão que leva ao campo em causa.
`pintarDON()` desenha o painel e o sinal do cabeçalho. Os itens são reavaliados a cada 30
segundos, porque vários dependem do relógio (prazos de ataque inicial e ampliado, POSIT,
rendições).

Verificações do plano de comunicações já implementadas: nível exigido pelo dispositivo e não
ativado; canal em uso fora dos atribuídos ao TO; canal de comando ou tático repetido ao nível
de manobra; setores distintos no mesmo canal de manobra; setores sem canal atribuído; ligação
terra/ar/terra por definir com meios aéreos empenhados.

---

## 8. Geração do PEA

Duas chamadas encadeadas ao modelo, uma por célula, porque uma só passagem produz documentos
sem profundidade operacional: `gerarPlan()` para a Célula de Planeamento e `gerarOps()` para a
Célula de Operações, esta última recebendo o resultado da primeira. `contexto()` injeta o
estado completo. Em caso de falha do modelo há geração determinística equivalente
(`detPlan`, `detOps`) e a proposta sai identificada como tal.

Cada proposta guarda uma fotografia completa do momento: dados, série meteorológica, métricas,
estado do PCO, verificações de conformidade e nível DECIR. As propostas são numeradas e cada
uma incorpora o que evoluiu desde a anterior (`evoDesdeUltimoPEA`).

A chamada ao modelo é `POST https://api.anthropic.com/v1/messages`, sem chave no código —
depende do ambiente de execução a fornecer o acesso. Fora desse ambiente, a aplicação recorre
sempre à via determinística, o que é comportamento aceite e não um defeito a corrigir.

---

## 9. Pontos por confirmar

Estão marcados como tal na interface e não devem ser dados como assentes:

1. **Designação PC COM 1 a 5.** As séries PC TAT (1-15) e PC MAN (1-30) da pasta DISTRITO OP
   estão confirmadas em fonte; o rótulo dos cinco canais de comando foi deduzido por coerência.
   Confirmar contra a NEP em vigor.
2. **Séries de banda alta CT e CM.** Assentam na equivalência declarada entre os grupos SIRESP
   e os canais da ROB em simplex. Só o manobra 4 (CM4) tem confirmação direta, na DON n.º 2.
3. **Numeração da NEP n.º 8/NT/2010** para a banda alta de VHF, não verificada linha a linha.

---

## 10. Sistema visual

Duas paletas em variáveis CSS, alternadas por `html[data-tema]`: água profunda em modo escuro,
terra e areia em modo claro. Cores com significado fixo: fogo para comando, água para tático,
madeira para manobra, terra para aéreo e para pendências.

Tipografia: Barlow Semi Condensed para títulos e rótulos de painel, Inter para texto corrido,
JetBrains Mono para dados, designações de canal, GDH e coordenadas.

Camada de relevo, metáfora de consola de posto de comando: o fundo é o painel; os cartões
erguem-se sobre ele; os blocos internos e os campos são ranhuras abertas no cartão; as teclas
de seleção ficam salientes até serem engatadas, altura em que afundam e acendem na cor do
respetivo nível. Tokens: `--rel`, `--rel-alto`, `--afund`, `--ranhura`, `--aresta`, `--luz`,
`--sombra`, todos com valores próprios por tema. `prefers-reduced-motion` respeitado e relevo
suprimido na impressão.

O PEA impresso tem folha própria, com a paleta de cinco elementos do modelo oficial da ANEPC,
e imprime só o separador ativo.

---

## 11. Método de trabalho esperado

- Alterar sempre o ficheiro único; não partir a aplicação em módulos.
- Antes de entregar, validar a sintaxe do `<script>` isolado e correr um teste funcional em
  jsdom que exercite o caminho alterado. Vale a pena manter os testes entre sessões.
- Ao substituir blocos grandes de código, confirmar por pesquisa que nenhuma função ficou
  órfã ou apagada — já aconteceu uma regressão exatamente assim, com os botões de um cartão
  a ficarem sem listeners e a falhar em silêncio dentro de um `try`.
- Incrementar a revisão no rodapé e no nome do ficheiro.
- Estado novo introduzido em `O` tem de ser declarado em `novoEstado` e normalizado nos
  acessores `pcoObj()` e `estObj()`, que fazem `Object.assign` sobre os valores por omissão e
  garantem a compatibilidade com ocorrências gravadas em revisões anteriores. Se for campo de
  `meta` sem campo no formulário, preservá-lo também em `lerForm`. Migração do pacote de
  canais faz-se em `carregarCanais`.
- Verificar sempre nos dois temas e em largura reduzida.

---

## 12. Trabalho em aberto

- Integração do pipeline de seis agentes previsto na arquitetura técnica: Meteo, Topografia,
  Demografia, Comportamento do Fogo, Sintetizador e Crítico.
- Exportação do PEA em DOCX com a tipografia de letras empilhadas, já resolvida noutro
  protótipo, em vez de fusão vertical de células.
- Briefing de passagem de comando gerado a partir da estrutura do PCO e do plano de
  comunicações.
- Impressão do plano de comunicações em folha autónoma, para afixar no PCO.
