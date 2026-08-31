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
| `patch_r0016.py`, `teste.js` | Versões anteriores dos mesmos guiões | r0016 |

Os seis guiões de 31 de agosto — `p0017`, `t0017`, `q0017`, `p0019`, `t0019`, `q0019` —
chegaram com os campos do nome trocados, `CSREPCDouro_AAAAMMDDHHMM_p0017_...`, e foram postos
na ordem da convenção. Só o nome mudou; o conteúdo é o que veio.

**Não são o método deste lado.** A fonte vive em `fonte/`, um módulo por subsistema, e a
entrega produz-se com `npm run montar`. Alterar a aplicação aqui é alterar o módulo
respetivo, não escrever um guião que remende o HTML montado.

Não se apagam porque documentam o percurso, e porque a cadeia é reproduzível — aplicar
`p0006` a `p0009` sobre a r0034 reproduz a r0038, o que prova que a entrega não traz nada
que os patches não digam. Não devem ser usados nem atualizados.
