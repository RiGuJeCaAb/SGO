# Especificação de Exportação JSON — Gestão PCO → Estação PEA
**CSREPC Douro · Núcleo de Apoio às Operações · v1.0 · agosto de 2026**
*Documento de trabalho a entregar ao responsável pela app Gestão PCO (Fase 2 do roadmap da Estação PEA).*

## 1. Objetivo
Permitir que a app **Gestão PCO** (dona do estado vivo dos meios, alimentada pelo SADO) exporte um instantâneo do dispositivo que a **Estação PEA** importa com um clique, eliminando a transcrição manual de setores e meios. Uma única direção de dados (Gestão PCO → Estação), sem dependência inversa: cada app continua autónoma.

## 2. Transporte
- Botão **"Exportar JSON"** na Gestão PCO que descarrega um ficheiro `GestaoPCO_<ocorrencia>_<AAAAMMDDHHMM>.json` (UTF-8).
- A Estação PEA terá o botão correspondente **"Importar da Gestão PCO"** (ficheiro ou colagem do conteúdo).
- Sem servidores, sem contas, sem rede: transferência por ficheiro, compatível com o ambiente de PCO.

## 3. Esquema (JSON)
```json
{
  "versao": "1.0",
  "gerado": "271045AGO26",
  "ocorrencia": {
    "numero": "202608251000",
    "local": "Paraduça - Leomil - Moimenta da Beira",
    "pco": "Paraduça",
    "fase": "IV",
    "latitude": 40.99010,
    "longitude": -7.67835
  },
  "setores": [
    {
      "nome": "Alfa",
      "estado": "Frente ativa",
      "comandante": "Cmdt CB Moimenta da Beira",
      "adjunto": "",
      "contacto": "9XXXXXXXX",
      "meios": [
        { "tipologia": "GCIN", "quantidade": 1, "veiculos": 7, "operacionais": 26, "empenhado_desde": "251430AGO26" },
        { "tipologia": "VFCI", "quantidade": 2, "veiculos": 1, "operacionais": 5,  "empenhado_desde": "251510AGO26" }
      ]
    }
  ],
  "meios_aereos": 2,
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
3. **`estado`** de setor: um de `Frente ativa · Em consolidação · Rescaldo · Vigilância ativa`.
4. **`tipologia`**: sigla DECIR/DON n.º 2 (VFCI, VTTU, VCOT, ECIN, ELAC, GCIN, BCIN, GRIF/GRIR, GRUATA, ...); `veiculos` e `operacionais` são **por unidade** — a Estação multiplica pela `quantidade`.
5. Campos desconhecidos são ignorados na importação (tolerância a evolução da Gestão PCO).
6. Coordenadas em decimal WGS84; a Estação converte para GMD/GMS.

## 5. Mapeamento na Estação PEA
| Campo JSON | Destino na Estação |
|---|---|
| `ocorrencia.*` | Secção 1 — Identificação |
| `setores[].nome/estado/comandante/adjunto/contacto` | Secção 2 — linha do setor |
| `setores[].meios[]` | Secção 2 — tipologias do setor (com relógio de empenhamento a partir de `empenhado_desde`) |
| `meios_aereos`, `reserva`, `za` | Secção 2 — controlos respetivos |
| `sensiveis[]` | Secção 2 — aglomerados/pontos sensíveis |

## 6. O que a Estação devolve (nada)
A importação não escreve de volta na Gestão PCO. Evoluções, PEA e fita do tempo permanecem na Estação; a verdade do dispositivo em tempo real permanece na Gestão PCO. **Uma verdade por domínio.**

---
*Realizado com a cooperação de Claude (Anthropic).*
