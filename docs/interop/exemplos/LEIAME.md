# Exemplos de exportação da Gestão PCO

Ficheiros de referência para quem desenvolve a **Gestão PCO**, e para verificar uma
exportação real antes de a levar ao terreno.

**Governa a especificação v1.2**,
`docs/interop/CSREPCDouro_202608281845_EspecificacaoExportacaoJSON_v12_CLD.md`. Substitui a
v1.1 na íntegra: quem estiver a começar implementa essa e só essa.

| Ficheiro | Esquema | Para que serve |
|---|---|---|
| `EspecificacaoJSON_v1.2_exemplo.json` | v1.2, **em vigor** | O exemplo da especificação. Traz o bloco `pco`, o ponto de trânsito e os dois formatos de tempo no mesmo campo |
| `EspecificacaoJSON_v1.1_exemplo.json` | v1.1, lida por retrocompatibilidade | O que a v1.2 substituiu. A Estação lê-o sem um único ponto a confirmar |
| `pco-dispositivo_v1_exemplo.json` | contrato `pco:dispositivo` | Envelope do documento `d0002`, arquivado. Foi de lá que vieram os acréscimos que hoje estão na v1.2 |
| `pco-dispositivo_v0_esboco.json` | esboço anterior | Setores em texto livre e meios aéreos em contagem. Serve para não perder dados antigos; não serve para operar |

O importador lê os quatro e normaliza-os numa forma só.

O exemplo da v1.2 traz de propósito um núcleo externo solicitado e ainda por nomear, com
`"nomeado": null`. A Estação assinala-o, e é a única coisa que assinala no ficheiro: não é
defeito do exemplo, é a informação operacional que a distância entre os dois instantes
transporta. O da v1.1 entra sem assinalar nada.

## Verificar uma exportação

```
npm run validar-gp -- caminho/para/o/ficheiro.json
```

O validador corre o mesmo leitor e o mesmo conversor que a Estação usa, sem escrever
nada, e diz o que vai acontecer ao ficheiro: o que aproveita, o que converte e o que
precisa de decisão humana. Sai com erro se o pacote for recusado.

Exemplo, sobre o ficheiro do esboço anterior:

```
docs/interop/exemplos/pco-dispositivo_v0_esboco.json
  esquema v1.0, instantâneo de 271010AGO26
  ocorrência 202608251000 · Paraduça - Leomil - Moimenta da Beira
  2 setores · 2 tipologias · 3 meios aéreos
  0 de 2 tipologias com hora de empenhamento — sem ela não há projeção de rendições

  9 ponto(s) a confirmar:
   · Pacote na versão 1.0; estados e siglas convertidos para a v1.1.
   · Sem GDH de início: a Estação não consegue temporizar a transição de ataque inicial para ampliado.
   ...
```

## O que mais importa acertar

Por ordem de valor operacional, e não de dificuldade:

1. **`empenhado_desde` e `entrada_to`.** São os campos de maior valor de todo o esquema.
   Sem eles a Estação não projeta rendições, e o controlo dos tempos de trabalho — que
   sustenta o pedido de rendição ao CSREPC — fica por fazer.
2. **`ocorrencia.inicio`.** É a base do limiar dos 90 minutos que torna exigível o PEA
   formalmente elaborado. Sem ele a Estação não temporiza a transição de ataque inicial
   para ampliado.
3. **`meios_aereos` como lista, com indicativo.** Aciona os limiares do COPAR-T e do
   COPAR-Ar e conta o tempo de cada aeronave no TO. Um inteiro é aceite, mas perde as
   duas coisas.
4. **Siglas do Anexo 1.** As descontinuadas com conversão determinada são convertidas em
   silêncio; `FEB`, `UEPS` e `MR` isolada exigem decisão e ficam assinaladas, porque a
   Estação não pode escolher a entidade por quem exportou.
5. **Bloco `pco`, se existir.** As designações têm de vir exatas do art. 14.º e dos
   arts. 18.º a 38.º do Despacho n.º 4067/2024: é essa cadeia que cruza com as funções
   exigíveis pela fase do SGO. Um nome aproximado não rebenta nada — a Estação
   simplesmente passa a dizer que a função está por nomear quando está nomeada.

Divergências entre `veiculos`/`operacionais` e o catálogo não bloqueiam: prevalece o
valor exportado, por ser o efetivo real da força no TO, e a Estação assinala a diferença.

## Formatos de tempo

Qualquer campo de tempo aceita o GDH doutrinário — `251430AGO26` — ou uma marca ISO 8601
com fuso — `2026-08-25T15:10:00+01:00`. **No mesmo campo**, e as duas formas podem
coexistir no mesmo ficheiro: o exemplo da v1.2 usa-as ambas de propósito. Quem puder
emitir ISO, emita; quem não puder, continua em GDH e nada se parte.
