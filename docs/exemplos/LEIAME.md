# Exemplos de exportação da Gestão PCO

Ficheiros de referência para quem desenvolve a **Gestão PCO**, e para verificar uma
exportação real antes de a levar ao terreno.

**Governa a especificação v1.1**,
`docs/CSREPCDouro_202608271715_EspecificacaoExportacaoJSON_CLD.md`. É a que a Gestão PCO
deve implementar.

| Ficheiro | Esquema | Para que serve |
|---|---|---|
| `EspecificacaoJSON_v1.1_exemplo.json` | v1.1, **em vigor** | O exemplo da especificação. A Estação lê-o sem um único ponto a confirmar |
| `pco-dispositivo_v1_exemplo.json` | contrato `pco:dispositivo` | Envelope do documento `d0002`, arquivado. Traz o bloco do posto de comando, que a v1.1 ainda não tem |
| `pco-dispositivo_v0_esboco.json` | esboço anterior | Setores em texto livre e meios aéreos em contagem. Serve para não perder dados antigos; não serve para operar |

O importador lê os três e normaliza-os numa forma só. Há ainda uma proposta de v1.2 em
`docs/CSREPCDouro_202608281700_EspecificacaoExportacaoJSON_v12_PROPOSTA_CLD.md`, que junta
à v1.1 o que sobra do contrato.

## Verificar uma exportação

```
npm run validar-gp -- caminho/para/o/ficheiro.json
```

O validador corre o mesmo leitor e o mesmo conversor que a Estação usa, sem escrever
nada, e diz o que vai acontecer ao ficheiro: o que aproveita, o que converte e o que
precisa de decisão humana. Sai com erro se o pacote for recusado.

Exemplo, sobre o ficheiro da v1.0:

```
docs/exemplos/GestaoPCO_v1.0_exemplo.json
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

1. **`empenhado_desde` e `entrada_to`.** São o campo de maior valor de todo o esquema.
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

Divergências entre `veiculos`/`operacionais` e o catálogo não bloqueiam: prevalece o
valor exportado, por ser o efetivo real da força no TO, e a Estação assinala a diferença.
