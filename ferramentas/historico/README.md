# Guiões de alteração, arquivados

Estes ficheiros produziram revisões da aplicação aplicando alterações ao HTML de uma
revisão anterior, e vieram com a r0023 de 28 de agosto. Ficam como registo de como essa
revisão foi feita.

| Ficheiro | O que fez |
|---|---|
| `CSREPCDouro_p0001_202608281530_CelulasNucleos_CLD.py` | Repartição do PEA pelas células, núcleos do PCO, migração do estado para a versão 2 e adaptador de modelo com três modos. Produziu a r0023 |
| `CSREPCDouro_t0001_202608281530_CelulasNucleos_CLD.js` | Testes dessa alteração, em jsdom |
| `patch_r0016.py`, `teste.js` | Versões anteriores dos mesmos guiões |

**Estão ultrapassados pela camada 2.** A fonte vive agora em `fonte/`, um módulo por
subsistema, e a entrega produz-se com `npm run montar`. Alterar a aplicação é alterar o
módulo respetivo, não escrever um guião que remende o HTML montado. Os testes passaram
para `tests/`, onde correm com `npm run testar`.

Não se apagam porque documentam o percurso, mas não devem ser usados nem atualizados.
