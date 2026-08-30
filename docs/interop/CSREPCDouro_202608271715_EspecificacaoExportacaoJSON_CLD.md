# Especificação de Exportação JSON — Gestão PCO → Estação PEA
**CSREPC Douro · Núcleo de Apoio às Operações · v1.1 · agosto de 2026**
*Documento de trabalho a entregar ao responsável pela app Gestão PCO (Fase 2 do roadmap da Estação PEA).*

> **Substituída pela v1.2**, de 28 de agosto —
> `CSREPCDouro_202608281845_EspecificacaoExportacaoJSON_v12_CLD.md`, na mesma pasta. Quem
> estiver a implementar do lado da Gestão PCO implementa essa. Este documento fica pelo
> registo: a Estação continua a ler pacotes na v1.1 e na v1.0, por retrocompatibilidade.

> **Alterações face à v1.0** — alinhamento com o Anexo 1 e o ponto 7.f da Diretiva Operacional Nacional n.º 2 / DECIR 2026: nomenclatura oficial dos estados de setor, siglas de tipologia corrigidas, meios aéreos passam de contagem a lista nominal com indicativo e hora de entrada, e novos campos de GDH de início e nível de empenhamento. A v1.0 continua a ser aceite pela Estação, com conversão automática dos estados e das siglas obsoletas.

## 1. Objetivo
Permitir que a app **Gestão PCO** (dona do estado vivo dos meios, alimentada pelo SADO) exporte um instantâneo do dispositivo que a **Estação PEA** importa com um clique, eliminando a transcrição manual de setores e meios. Uma única direção de dados (Gestão PCO → Estação), sem dependência inversa: cada app continua autónoma.

## 2. Transporte
- Botão **"Exportar JSON"** na Gestão PCO que descarrega um ficheiro `GestaoPCO_<ocorrencia>_<AAAAMMDDHHMM>.json` (UTF-8).
- A Estação PEA terá o botão correspondente **"Importar da Gestão PCO"** (ficheiro ou colagem do conteúdo).
- Sem servidores, sem contas, sem rede: transferência por ficheiro, compatível com o ambiente de PCO.

## 3. Esquema (JSON)
```json
{
  "versao": "1.1",
  "gerado": "271045AGO26",
  "ocorrencia": {
    "numero": "202608251000",
    "local": "Paraduça - Leomil - Moimenta da Beira",
    "pco": "Paraduça",
    "fase_sgo": "IV",
    "nivel_decir": "DELTA",
    "inicio": "251402AGO26",
    "latitude": 40.99010,
    "longitude": -7.67835
  },
  "setores": [
    {
      "nome": "Alfa",
      "estado": "Em curso (ativo)",
      "comandante": "Cmdt CB Moimenta da Beira",
      "adjunto": "",
      "contacto": "9XXXXXXXX",
      "meios": [
        { "tipologia": "GCIN", "quantidade": 1, "veiculos": 7, "operacionais": 26, "empenhado_desde": "251430AGO26" },
        { "tipologia": "VFCI", "quantidade": 2, "veiculos": 1, "operacionais": 5,  "empenhado_desde": "251510AGO26" }
      ]
    }
  ],
  "meios_aereos": [
    { "tipologia": "HEBP", "indicativo": "KILO 04", "entrada_to": "251505AGO26" },
    { "tipologia": "HERAC", "indicativo": "FIRE 01", "entrada_to": "251540AGO26" }
  ],
  "reserva":  { "veiculos": 1, "operacionais": 2 },
  "za":       { "veiculos": 1, "operacionais": 2 },
  "sensiveis": [
    { "nome": "Leomil", "grau": "prioridade", "nota": "sede de freguesia a NE" }
  ]
}
```

## 4. Regras
1. **`versao`** obrigatória; alterações de esquema incrementam o número (a Estação valida antes de importar).
2. **GDH** no formato doutrinário `DDHHMM` + mês abreviado + ano a dois dígitos (`251430AGO26`).
3. **`ocorrencia.inicio`** — GDH de abertura da ocorrência. É a base do cálculo do limiar dos 90 minutos que torna exigível o PEA formalmente elaborado (DON n.º 2, ponto 7.e.(5)(a)). Campo novo e recomendado; sem ele a Estação não consegue temporizar a transição de ATI para ATA.
4. **`ocorrencia.nivel_decir`** — um de `ALFA · BRAVO · CHARLIE · DELTA`. Opcional: a Estação deriva o nível do calendário do ponto 7.b da DON quando o campo vem vazio. O campo `fase` da v1.0 passa a chamar-se `fase_sgo`, mantendo-se `fase` como sinónimo aceite.
5. **`estado`** de setor — nomenclatura do ponto 7.f da DON n.º 2, um de:
   `Em curso (ativo) · Em resolução (dominado) · Em conclusão (extinto) · Vigilância ativa e consolidação de rescaldo · Reativação`.
   Os valores da v1.0 (`Frente ativa`, `Em consolidação`, `Rescaldo`, `Vigilância ativa`) continuam a ser aceites e são convertidos na importação.
6. **`tipologia`** — sigla do Anexo 1 da DON n.º 2 / DECIR 2026. `veiculos` e `operacionais` são **por unidade**; a Estação multiplica pela `quantidade` e valida contra o catálogo oficial. Divergências não bloqueiam a importação: prevalece o valor exportado, por ser o efetivo real da força no TO, e a Estação assinala a diferença.
   Siglas descontinuadas e respetiva conversão: `GRIF` → `GRIR`; `GAUF` → `EAUF`; `eSF` → `ESF`; `FEB/UEPS` → decompor em `ETATI`, `PATE` ou `GRUATA (UEPS)`; `MR` isolada → `EMR (CB)`, `EMR (ICNF)`, `EMR (FEPC)` ou `EMR (AFOCELCA)` consoante a entidade.
7. **`meios_aereos`** — passa de inteiro a lista. Cada entrada identifica a aeronave pelo indicativo de chamada (`HOTEL`, `KILO`, `FIRE`, `ALFA`, `BRAVO`, `OSCAR`, `CELCA`, conforme o Anexo 1) e regista a hora de entrada no TO. A Estação usa a lista para dois efeitos: acionar os limiares do COPAR-T (mais de 2 aeronaves de combate) e do COPAR-Ar (4 ou mais), e contar o tempo de cada aeronave no TO. Um inteiro é aceite por retrocompatibilidade e convertido em entradas anónimas sem relógio.
8. **`empenhado_desde` e `entrada_to`** — sustentam o controlo dos tempos de trabalho e o pedido de rendição ao CSREPC (DON n.º 2, pontos 7.d.(14) e 7.e.(5)(r)). São o campo de maior valor operacional de todo o esquema: sem eles a Estação não consegue projetar rendições.
9. Campos desconhecidos são ignorados na importação (tolerância a evolução da Gestão PCO).
10. Coordenadas em decimal WGS84; a Estação converte para GMD e GMS.

## 5. Mapeamento na Estação PEA
| Campo JSON | Destino na Estação |
|---|---|
| `ocorrencia.numero/local/pco/latitude/longitude` | Secção 1 — Identificação |
| `ocorrencia.inicio` | Secção 1 — Início da ocorrência; relógio dos 90 minutos |
| `ocorrencia.fase_sgo` / `nivel_decir` | Secção 1 — Fase SGO e Nível de empenhamento DECIR |
| `setores[].nome/estado/comandante/adjunto/contacto` | Secção 2 — linha do setor |
| `setores[].meios[]` | Secção 2 — tipologias do setor, com relógio a partir de `empenhado_desde` |
| `meios_aereos[]` | Secção 2 — lista nominal de meios aéreos; secção de avisos — limiares COPAR |
| `reserva`, `za` | Secção 2 — controlos respetivos |
| `sensiveis[]` | Secção 2 — aglomerados e pontos sensíveis |
| `empenhado_desde`, `entrada_to` | Secção de avisos — quadro de tempos e rendições |

## 6. O que a Estação devolve (nada)
A importação não escreve de volta na Gestão PCO. Evoluções, PEA, avisos e fita do tempo permanecem na Estação; a verdade do dispositivo em tempo real permanece na Gestão PCO. **Uma verdade por domínio.**

## 7. Nota sobre a arquitetura por células
A evolução prevista da Estação PEA atribui gestão autónoma a cada célula do PCO — Operações, Planeamento, Logística e Finanças, e Segurança — convergindo para o PEA. Este esquema mantém-se estável nesse cenário: a Gestão PCO continua a alimentar a célula de Operações, e as restantes células produzem informação própria que não depende desta importação. Uma futura v2.0 poderá acrescentar blocos opcionais `logistica` (ponto de trânsito, áreas de reserva, alimentação e reabastecimento) e `comunicacoes` (plano de comunicações, canais por setor), sem quebrar a leitura das versões anteriores.

---
*Realizado com a cooperação de Claude (Anthropic).*
