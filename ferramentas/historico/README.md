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
| `patch_r0016.py`, `teste.js` | Versões anteriores dos mesmos guiões | r0016 |

**Não são o método deste lado.** A fonte vive em `fonte/`, um módulo por subsistema, e a
entrega produz-se com `npm run montar`. Alterar a aplicação aqui é alterar o módulo
respetivo, não escrever um guião que remende o HTML montado.

Não se apagam porque documentam o percurso, e porque a cadeia é reproduzível — aplicar
`p0006` a `p0009` sobre a r0034 reproduz a r0038, o que prova que a entrega não traz nada
que os patches não digam. Não devem ser usados nem atualizados.
