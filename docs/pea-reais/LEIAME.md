# PEA reais

**Planos Estratégicos de Ação emitidos num incêndio a sério**, no Castedo, a 17 de agosto de
2026. Não foram produzidos por esta aplicação: foram escritos no posto de comando, no formato
oficial, por quem lá estava.

Não são doutrina — a doutrina está em `docs/FONTES.md`. São a **prova do formato e do registo**:
o que um PEA diz na realidade, com que estrutura, com que grau de detalhe, e como muda de uma
revisão para a seguinte quando a situação evolui.

| Ficheiro | O que é |
|---|---|
| `202608171830_PEA01_Castedo_CLD.docx` | O primeiro PEA da ocorrência |
| `202608171900_PEA01_Castedo_v2_CLD.docx` | Segunda versão do primeiro, meia hora depois |
| `202608172000_PEA02_Castedo_CLD.docx` | O segundo PEA |
| `202608172100_PEA02rev_Castedo_CLD.docx` | Revisão do segundo |
| `202608172200_PEA02rev2_Castedo_CLD.docx` | Segunda revisão do segundo |
| `202608172200_PEA02rev2b_Castedo_CLD.docx` | Uma variante do mesmo carimbo, com conteúdo diferente. Chegou como `(4)` do descarregador; o `b` no nome distingue-a sem lhe mexer no conteúdo |

Chegaram nove ficheiros: **quatro eram cópias byte a byte** do mesmo `PEA02rev2`, do
descarregador a numerar `(1)` a `(3)`. Ficou um. O `(4)` não era cópia — tem conteúdo próprio —
e por isso ficou também, com o sufixo `b`.

## Para que servem aqui

Duas coisas, e nenhuma delas é servir de modelo automático:

1. **Conferir o que a aplicação emite contra o que se emite mesmo.** A geração do PEA e o PEA
   impresso foram construídos a partir do modelo `.docx` aceite (ver `p0014` em
   `ferramentas/historico/`). Estes ficheiros são o teste dessa aproximação em documentos que
   já circularam.
2. **Ler a evolução de uma ocorrência real** — do PEA 01 às 18h30 à segunda revisão do PEA 02
   às 22h. Quatro horas, cinco documentos: é o ritmo verdadeiro a que o plano é refeito, e é
   por esse ritmo que a aplicação tem de conseguir acompanhar.

**Não se editam.** Um documento operacional alterado depois de emitido deixa de ser prova do
que foi emitido.
