# Guiões de alteração, arquivados

Estes ficheiros produziram revisões da aplicação aplicando alterações ao HTML de uma
revisão anterior. Ficam como registo de como essas revisões foram feitas.

Vieram todos da **linhagem paralela**, que trabalha sobre a entrega montada e não sobre
`fonte/`. É por isso que existem: do lado de lá não há camada 2, e um patch ao HTML é a
única forma de entregar uma alteração revisível. Deste lado servem para duas coisas — ler
o que foi feito, e reproduzir a cadeia quando é preciso provar que uma entrega não traz
nada além do que os patches dizem.

| Ficheiro | O que fez | Revisão |
|---|---|---|
| `CSREPCDouro_p0001_..._CelulasNucleos_CLD.py` | Repartição do PEA pelas células, núcleos do PCO, estado na versão 2, adaptador de modelo com três modos | r0023 |
| `CSREPCDouro_t0001_..._CelulasNucleos_CLD.js` | Testes dessa alteração, em jsdom | — |
| `CSREPCDouro_p0002_..._EtiquetasCelula_CLD.py` | Etiquetas de célula na impressão do PEA | r0024 |
| `CSREPCDouro_p0005_..._PosseCelulas_CLD.py` | Registo de posse do estado por célula, auditoria e exportação por célula | r0031 do outro lado |
| `CSREPCDouro_t0005_..._PosseCelulas_CLD.js` | Testes da posse. **Portados para `tests/posse.test.mjs`** | — |
| `CSREPCDouro_p0006_..._RamoLogistica_CLD.py` | `O.logistica` com reserva, zona de apoio e ponto de trânsito; estado na versão 5 | r0035 |
| `CSREPCDouro_t0006_..._RamoLogistica_CLD.js` | Testes dessa alteração | — |
| `CSREPCDouro_p0007_..._ArrumarCasa_CLD.py` | Interface organizada por célula do PCO: um separador por célula, registo `ARRUMACAO` e auditoria | r0036 |
| `CSREPCDouro_t0007_..._ArrumarCasa_CLD.js` | Testes dessa alteração | — |
| `CSREPCDouro_p0008_..._JsPorCelula_CLD.py` | Reagrupamento das secções do `<script>` por célula. Só ordem e cabeçalhos; nenhum byte de conteúdo muda | r0037 |
| `CSREPCDouro_p0009_..._CorPorCelula_CLD.py` | Cor por célula nos separadores, estendendo a convenção que já existia no PEA impresso | r0038 |
| `CSREPCDouro_p0003_..._PassagemTurno_CLD.py` | Passagem de turno por célula e nomeação externa em dois instantes; estado 3 → 4 | r0026 |
| `CSREPCDouro_t0003_..._PassagemTurno_CLD.js` | Testes dessa alteração | — |
| `CSREPCDouro_p0004_..._SolicitadoImportador_CLD.py` | O conversor da Gestão PCO passa a gravar o instante da solicitação. Depende do `p0003` | r0027 |
| `CSREPCDouro_q0002_..._QAVisual_CLD.js` | Guião de captura das provas `qa0002` e `qa0003`, sobre a r0024 | — |
| `CSREPCDouro_p0010_..._NumeracaoMorta_CLD.py` | Remoção da numeração de secções que morreu com a arrumação por células | r0048 |
| `CSREPCDouro_p0011_..._AjudaDobravel_CLD.py` | A ajuda deixa de ser um muro de texto e passa a dobrável | r0049 |
| `CSREPCDouro_p0012_..._HierarquiaTipografica_CLD.py` | Hierarquia tipográfica: trinta e cinco maiúsculas forçadas a menos | r0056 |
| `CSREPCDouro_p0013_..._QuatroCorreccoes_CLD.py` | Quatro correções de interface encontradas em uso | r0057 |
| `CSREPCDouro_p0014_..._FormatoOficialPEA_CLD.py` | O PEA impresso passa a seguir as medidas do modelo `.docx` aceite | r0058 (paralela) |
| `CSREPCDouro_p0015_..._FolhaPorCelula_CLD.py` | Uma folha por célula na impressão, e equilíbrio da mancha | r0059 (paralela) |
| `CSREPCDouro_p0018_..._CartoesDobraveis_CLD.py` | A fita do tempo e a linha de evolução abrem em acordeão | r0063b |
| `CSREPCDouro_t0018_..._CartoesDobraveis_CLD.js` | Testes dessa alteração | — |
| `CSREPCDouro_p0017_..._CartaLocal_CLD.py` | Carta pré-descarregada: seleção de pasta, grelha declarada, atribuição. **Absorvido** | r0071 |
| `CSREPCDouro_t0017_..._CartaLocal_CLD.js` | Testes dessa alteração | — |
| `CSREPCDouro_q0017_..._CartaLocal_CLD.js` | Guião de captura da prova em navegador | — |
| `CSREPCDouro_p0019_..._PropagacaoModelos_CLD.py` | Velocidade de propagação e modelos de combustível. **Absorvido** em `fonte/3-planeamento/21-modelos-de-combustivel.js` | r0073 |
| `CSREPCDouro_t0019_..._Propagacao_CLD.js` | Testes dessa alteração. **Portados** para `tests/propagacao.test.mjs` | — |
| `CSREPCDouro_q0019_..._Propagacao_CLD.js` | Guião de captura da prova em navegador | — |
| `CSREPCDouro_p0016_..._CroquiTO_CLD.py` | Croqui do teatro de operações, desenhado a partir do estado | r0062 |
| `CSREPCDouro_t0016_..._CroquiTO_CLD.js` | Testes dessa alteração | — |
| `CSREPCDouro_p0017_202608301730_CroquiEscala_CLD.py` | Escala e orientação no croqui. **Não confundir com o outro `p0017`**, de 31 de agosto, que é a carta pré-descarregada: são dois trabalhos com o mesmo número | r0063 |
| `CSREPCDouro_t0017_202608301730_CroquiEscala_CLD.js` | Testes dessa alteração | — |
| `CSREPCDouro_p0018_202608312030_FolhaCalibrada_CLD.py` | **Folha calibrada**: carta em imagem, georreferenciada por pontos de controlo, desenhada por baixo do mapa. **Não confundir com o outro `p0018`**, de 30 de agosto, que são os cartões dobráveis. **Por absorver** | r0072 (paralela) |
| `CSREPCDouro_t0018_202608312030_FolhaCalibrada_CLD.js` | Testes dessa alteração | — |
| `CSREPCDouro_q0018_202608312030_FolhaCalibrada_CLD.js` | Guião de captura das provas `qa0018` de 31 de agosto | — |
| `CSREPCDouro_q0020_..._RetratoDoFogo_CLD.js` | Guião de captura da prova do ambiente de fogo | — |
| `CSREPCDouro_p0020_..._RetratoDoFogo_CLD.py` | O ambiente de fogo entra no plano: terceiro coletor, propostas fundadas na intensidade. **Absorvido** em `fonte/3-planeamento/22-ambiente-de-fogo.js` | r0074 (paralela) |
| `patch_r0016.py`, `teste.js` | Versões anteriores dos mesmos guiões | r0016 |

Os guiões que chegaram com os campos do nome trocados —
`CSREPCDouro_AAAAMMDDHHMM_p0017_...` em vez de `CSREPCDouro_p0017_AAAAMMDDHHMM_...` — foram
postos na ordem da convenção. Só o nome mudou; o conteúdo é o que veio.

**A numeração dos guiões colidiu, como colidiu a das revisões.** Existem dois `p0017` (croqui
com escala, a 30 de agosto; carta pré-descarregada, a 31), dois `t0017`, e dois `p0018`
(cartões dobráveis, a 30; folha calibrada, a 31), com os respetivos `t0018`. Distinguem-se
pelo carimbo de data e ficam ambos, pela mesma razão por que ficam as duas `r0058` e as duas
`r0074`: foram ambos entregues, e renumerá-los partiria a referência dos documentos que os
citam. Ver `app/RESERVADAS.md`.

**Não são o método deste lado.** A fonte vive em `fonte/`, um módulo por subsistema, e a
entrega produz-se com `npm run montar`. Alterar a aplicação aqui é alterar o módulo
respetivo, não escrever um guião que remende o HTML montado.

Não se apagam porque documentam o percurso, e porque a cadeia é reproduzível — aplicar
`p0006` a `p0009` sobre a r0034 reproduz a r0038, o que prova que a entrega não traz nada
que os patches não digam. Não devem ser usados nem atualizados.

## `006_CSREPCDouro_202609021523_t01_FasesExigibilidadePCO_CLD.js`

**Não é um patch.** É o guião de verificação do ramo #006 que apanhou as cinco divergências
de fase nas funções do art. 14.º, n.º 1 — o primeiro trabalho produzido sob a divisão de
2 de setembro, em que os ramos entregam revisão e testes e não remendos.

Corre com `node <guião> <entrega.html>`, sem dependências e sem rede. Contra a r0083 dava
vermelho, saída 1: duas LACUNA e três EXCESSO. Fica aqui como prova de proveniência do
achado; quem impede a regressão é `tests/exigibilidade-pco.test.mjs`.

**Está desatualizado por construção, e é essa a lição que traz:** lê `entrada.fase`, campo
que a correção separou em `faseLei` e `faseSug`. Corrigido esse nome, corre verde contra a
r0084. O contrato com os ramos é o ficheiro compilado, mas um guião que alcança um literal
lá dentro depende do nome do campo — e um nome de campo que muda tem de ser anunciado.

## `002_CSREPCDouro_202609021600_t0001_FolhasCalibradas_CLD.js`

**Não é um patch.** É o guião do ramo #002 que guiou a absorção das folhas de carta
calibradas — 53 asserções que dizem o que tem de ser verdade, sem dizer como implementar.
Corre com `node <guião> <entrega.html>`, sem dependências e sem rede: lê o HTML, extrai o
maior `<script>`, acrescenta-lhe em memória um epílogo que exporta os símbolos de topo — as
`const` não se colam ao global num `vm`, as `function` sim — e corre tudo num DOM simulado.

Contra a r0084 dava 10 verdes e 44 vermelhas; contra a r0085 dá 54 verdes e saída 0. As 10
verdes são alicerces que já existiam — projeção PT-TM06, grelha `PTTM_06`, as lojas
anteriores, `criarLojasIDB` a não recriar o que já existe — e o guião conta-as em separado
justamente para denunciar quem parta alguma coisa por baixo ao implementar por cima.

**Estas não são as 53 asserções do `t0018`**, que estão no ramo #004 e nunca chegaram aqui.
O ramo #002 reconstruiu-as a partir do comportamento descrito. Se as originais aparecerem,
correm-se as duas: onde divergirem, é a especificação que está mal escrita.

Quem impede a regressão do lado de dentro é `tests/folhas-calibradas.test.mjs`, que cobre o
que este guião não podia cobrir — o desenho, da folha ao ecrã.

## `001_CSREPCDouro_202609021551_t0021_FolhaCalibrada_CLD.js`

**A segunda especificação das folhas calibradas, escrita em separado da do ramo #002 e sem
que nenhum dos dois visse o trabalho do outro.** 53 asserções também, o que foi coincidência
e não confirmação — o ramo #001 di-lo à cabeça. Depende de `jsdom`.

Vale por três coisas.

**O grupo A confronta a projeção PT-TM06 com o PROJ 3.7.2**, em cinco pontos calculados
sobre a definição EPSG:3763. É a única verificação desta aritmética contra uma implementação
de referência que este projeto tem: o PROJ não é alcançável do ambiente onde as revisões se
constroem, e até aqui a projeção só se confrontava consigo própria pela ida e volta — que
fecha na mesma se as duas metades estiverem erradas do mesmo modo. Passou nos 16.

**As duas especificações concordam.** Com os nomes do contrato adaptados à superfície que a
r0085 implementa — que é o que o bloco `CONTRATO` deste guião existe para permitir —, 51 das
53 passam; as duas que faltam verificam a existência de um nome, não um comportamento.
Duas pessoas escreveram em separado o que uma folha calibrada tem de fazer, e a
implementação satisfaz as duas.

**E trouxe o que faltava:** `folhaAfericao`, com a regra de que não haver aferição se tem de
distinguir de haver uma má — `null`, nunca zero nem NaN.

O ramo #001 registou no próprio ficheiro dois erros seus, apanhados a verificar em vez de
assumir: o acesso por `window.X`, que teria dado vermelho a código já implementado porque um
`const` de topo não cria propriedade em `window`; e um `E7` que verificava a fixture
construída pelo próprio teste e passava a verde sem tocar na aplicação.

## `006_CSREPCDouro_202609021552_t02_FasesExigibilidadePCOv2_CLD.js`

A segunda versão do guião das fases, e substitui a anterior como guião a correr — a v1 fica
pelo registo do achado. Verde contra a r0087, saída 0.

**Não é a alteração de uma linha que eu tinha proposto**, e o ramo #006 tem razão em não a
ter feito. Eu tinha visto metade da lição: o campo mudou de nome. A outra metade é que o
guião **reportou a mudança de nome como sete divergências doutrinárias** — sete `undefined`
com forma de achado sobre a lei. Isso é pior do que falhar: é ruído com aparência de sinal,
e é assim que se treina quem lê a ignorar testes vermelhos. Na v2, contrato quebrado sai com
código 2 e a frase «nenhuma conclusão doutrinária foi tirada»; divergência sai com 1.

Traz duas verificações que a separação `faseLei`/`nucleo` tornou necessárias: a
**despromoção** de uma exigência do art. 14.º a sugestão, que é agora a regressão mais
perigosa deste bloco e é silenciosa por natureza; e a confirmação de que a alínea gravada em
`aLei` é a que sustenta aquele valor, e não apenas de que existe alguma.

O ramo registou também um erro seu, no mesmo espírito: a primeira versão do guarda de
contrato engolia a despromoção — reportava-a como forma quebrada em vez de como o achado que
o guião existe para apanhar. Estava a comer precisamente o caso que devia deixar passar.
