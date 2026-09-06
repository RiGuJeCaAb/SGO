# BRIEFING — Webapp «Fita do Tempo» (VCOC / PCO)

> Documento de transição. Cola isto na primeira mensagem de uma conversa nova e anexa os três ficheiros indicados na secção 2.

---

## 1. Contexto

Trabalho no universo dos Bombeiros / Proteção Civil em Portugal. Opero na **VCOC (Veículo de Comando e Comunicações)** como **Operador de Comunicações**, acumulando na prática funções de ajudante de campo e de ligação — estou envolvido em tudo o que se passa dentro do PCO.

**Objetivo:** construir um sistema de registo cronológico completo dos acontecimentos num Teatro de Operações — a **Fita do Tempo**.

A fita do tempo está definida legalmente no **Despacho n.º 4067/2024, de 15 de abril** (Regulamentação do SGO), art. 2.º, n.º 1, al. c): *«o registo temporal explícito e completo das decisões, ações e informações operacionais associadas a uma ocorrência e com relevância para a compreensão da mesma»*. O art. 17.º, n.º 1, al. g) atribui à **Célula de Operações** a responsabilidade de garantir o seu registo e permanente atualização.

**Facto determinante:** o pacote oficial «Ferramentas de Coordenação, Comando e Controlo» da ANEPC **não inclui modelo para a fita do tempo**. Tem CS 01, Ponto de Trânsito, Guias de Comando, SITAC, Quadro Geral, PEA, L00, L3, L5, L5A, L6, OP 01, OP 1A, OP 2 A-F, OP 3 (POSIT), OP 05, OP 06, P1. A fita não existe. Estamos a construir a peça em falta.

Atribuímos-lhe a designação **Modelo SGO OP 04** (número livre na numeração oficial, e a fita pertence à Célula de Operações).

**Idioma:** português europeu. **Tom pretendido:** direto, cético, opinativo, sem embelezamento.

---

## 2. Estado atual — o que já existe

Fase de papel **concluída**. Três entregáveis produzidos (anexar à conversa nova):

| Ficheiro | O que é |
|---|---|
| `fita_do_tempo_SGO_OP04.html` | Folha A3 horizontal, frente e verso, pronta a imprimir. Faixa lateral com codificador rápido |
| `carta_codigos_SGO_OP04C.html` | Carta de Códigos A4 horizontal, frente e verso, plastificável. Taxonomia completa (~200 códigos, 15 famílias) |
| `manual_preenchimento_fita_do_tempo.html` | Manual A4, 10 secções, com exemplo real preenchido |

**Fase seguinte: a webapp.**

---

## 3. Decisões já tomadas (não reabrir sem razão nova)

### Papel vs. digital
- O papel foi construído **primeiro** para forçar o fecho do esquema de dados. Cumpriu.
- Com a app operacional, o **primário passa a ser o digital**. O papel muda de função:
  - **Contingência** — folha em branco na prancheta; se o equipamento falha, a caneta continua na mesma numeração.
  - **Artefacto assinado** — impressão a cada POSIT ou de hora a hora, rubricada, entregue ao Oficial de Operações.
- **Não existe «sincronização» papel↔app.** Existe transcrição humana, que custa tempo. Um primário, sempre.

### Ambição da v1
**Offline puro, local à VCOC.** Sem servidor, sem rede. As fases seguintes (sincronização com CDOS/CSREPC; multiutilizador em tempo real) são desejáveis mas não são a v1.

### Requisitos técnicos não negociáveis (para permitir evoluir sem reescrita)
1. **Identificador = UUID**, não sequencial. O número sequencial é apenas display humano. Contadores sequenciais colidem quando houver sincronização.
2. **Timestamps em ISO 8601 com fuso** (`2026-08-01T03:47:00+01:00`). Portugal muda de hora; ocorrências longas atravessam a meia-noite e a mudança.
3. **Append-only a sério.** Nunca editar, nunca apagar. Correção = novo registo `AD1` a referenciar o registo errado. Isto é simultaneamente exigência probatória **e** o que torna a sincronização futura trivial (log imutável com UUID funde-se sem conflitos).
4. **Campo `schema_version`** desde a v1.
5. PWA offline-first, armazenamento local (IndexedDB). Sem dependência de rede.

### Divisão de responsabilidades (respeitar o despacho)
- A **contagem oficial de operacionais** é do **Quadro de Meios e Logística (L00)**, da Célula de Logística e Finanças. A app calcula um **indicador**, não o número oficial.
- A app **avisa** ao aproximar-se de limiar de fase; o Oficial de Operações confirma; o COS decide; a fita regista `CM13`.

---

## 4. Modelo de dados — registo da fita

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `uuid` | UUID | ✔ | chave |
| `seq` | int | ✔ | display; corrido na ocorrência, não na folha |
| `gdh_facto` | ISO8601 | ✔ | quando aconteceu |
| `gdh_registo` | ISO8601 | ✔ | quando foi escrito (automático) |
| `marco` | bool | | alimenta o bloco MARCOS |
| `critico` | bool | | obrigatório em SG* e VT* |
| `codigo` | enum | ✔ | um só; dois eventos = dois registos |
| `canal` | enum | ✔ | `COM`/`TAT`/`MAN n`/`PRES`/`TLM`/`SADO`/`BA` |
| `origem` | string | ✔ | indicativo ou função; nunca pronomes |
| `destino` | string | ✔ | ou `Todos` |
| `setor` | string | | A–Z sem repetir · n.º do piso em multipisos · nome em setores funcionais · prefixo de frente/área na Fase IV+ (`F1/A`, `VALONGO/C`) |
| `sintese` | string | ✔ | telegráfico, factual, com números |
| `despacho` | string | | decisão resultante; traço se não houve |
| `n_op` | int | condicional | **obrigatório em `MV1/3/5`, `MA*`, `ME*`** — é o que alimenta a contagem |
| `registou` | string | ✔ | iniciais |
| `ack` | bool | | confirmação do destinatário |
| `ref` | UUID[] | | fecha ciclos (ordem → cumprimento) |
| `schema_version` | string | ✔ | |

### Cabeçalho da ocorrência (estado)
`n_ocorrencia`, `data`, `natureza/classificação`, `local`, `freguesia`, `concelho`, `coord_PCO`, `COS atual`, `Oficial de Operações`, `canal de comando`, **`fase_SGO atual`**, **`PEA vigente`** (só pode haver um em vigor — art. 46.º, n.º 2).

### Bloco MARCOS (10 valores)
T0 Alerta · 1.º meio no local · Assunção de COS · PCO instalado · Fase II · Fase III+ · PEA n.º 1 · Dominado · Rescaldo · Extinta/Encerrada

---

## 5. Taxonomia — 15 famílias

Lista completa na Carta de Códigos anexa. Estrutura:

- **CM** Comando e Controlo (18) — assunção/passagem de COS, PCO, nomeações, setorização, frentes/áreas, mudança de fase, núcleos, ordens do COS
- **PL** Planeamento (15) — PEA (ciclo completo), planos tático/logístico/comunicações, cenários, ERAS, especialistas, meteo recebida
- **OP** Operações (23) — missões (atribuída/cumprida/não cumprida/alterada), POSIT, briefings, manobras, fogo de supressão, dominado, rescaldo, vigilância, extinta, **reativação**, encerrada
- **MV / MA / ME** Meios terrestres / aéreos / especiais — sufixos 1–12 comuns (solicitado → saída do TO); MA13–18 específicos (descolagem, COPAR-T/A, suspensão aérea); ME13–15 (OPESP/COPESP, maquinaria)
- **SG** Segurança (16) — **todos críticos**. Comportamento extremo, retirada, zona de refúgio, LACES, cessação de trabalhos (art. 36.º n.º 2), acidente com operacional, contagem de efetivos, **quase-acidente**
- **VT** Vítimas (10) — **todos críticos**
- **PP** População e pontos sensíveis (12) — evacuação, confinamento, cortes de via, infraestrutura crítica
- **LF** Logística e Finanças (24) — reforços, ponto de trânsito, ZCR/ZRR, abastecimentos, **requisição de bens e serviços (art. 8.º n.º 2 n)**, **uso de águas públicas/particulares (al. o)**, falha SIRESP, encargos
- **LE** Ligação externa (19) — GNR, PSP, INEM, SMPC, autoridade municipal, CSREPC/CROEPC/CNEPC, ICNF, AFOCELCA, FA, infraestruturas, CVP, autoridade de saúde, MP/PJ, privados
- **CS** Comunicação social (6) · **MT** Meteorologia (6)
- **AD** Administrativo do registo (8) — retificação, anexo, abertura/fecho de folha, rendição do registador, falha de equipamento, retoma digital, **`AD8` registo reconstituído a posteriori**
- **FC** Fecho e pós-ação (4) — debriefing, relatório, arquivo, lição aprendida

**Marcos (★):** `CM1`, `CM2`, `CM3`, `CM13`, `PL2`, `OP17`, `OP18`, `OP20`, `OP21`, `OP22`.

---

## 6. Limiares de fase — lógica do aviso

| Fase | Referência | Banda ±10% | Estrutura que passa a ser exigida |
|---|---|---|---|
| I | ≤ 36 | — | só COS |
| II | 36 | 32–40 | PCO + célula de operações + adjunto de segurança; até 3 setores |
| III | 108 | 97–119 | + célula de planeamento + célula de logística e finanças + adjunto de ligação; até 6 setores |
| IV | 324 | 292–356 | + adjunto de relações públicas + coordenador do PCO; até 2 frentes |
| V | 648 | 583–713 | até 4 frentes |
| VI | n/a | — | áreas de intervenção municipal, 1 por concelho |

Ao entrar na banda inferior (32 / 97 / 292 / 583), a app acende aviso indicando **que estrutura passa a ser exigida**. É indicador, não decisão.

---

## 7. Relatório — mapeamento secção → códigos

| Secção | Origem |
|---|---|
| Cronologia sumária | Bloco MARCOS + todos os ★ |
| Evolução da ocorrência | `OP5`, `OP6` |
| Estrutura de comando | `CM1`–`CM7`, `CM13` |
| Organização do TO | `CM8`–`CM12`, `LF3`–`LF12` |
| Estratégia adotada | `PL1`–`PL4`, `OP9`–`OP15` |
| Meios empenhados | `MV*`, `MA*`, `ME*` + L00 |
| Segurança das forças | `SG*` (secção autónoma, sempre) |
| Vítimas e população | `VT*`, `PP*` + OP 05 |
| Articulação institucional | `LE*` |
| Encargos e requisições | `LF18`–`LF21`, `LF24` |
| Comunicação pública | `CS*` |
| Constrangimentos e lições | `OP3`, `MV10`/`MA10`/`ME10`, `SG14`, `AD1`, `FC4` |

Consumidores distintos: relatório da ocorrência (art. 8.º w), debriefing (al. v), inquérito, Núcleo de Finanças (art. 35.º).

---

## 8. Princípios de captura (o que faz ou desfaz o sistema)

- **Uma linha, cinco segundos.** O maior falhanço de qualquer log book não é o desenho — é ninguém preencher no pico e inventar tudo às 4h da manhã.
- Códigos pré-definidos, hora automática, escrita mínima.
- **O que se decide dentro do PCO regista-se com canal `PRES`.** Isto exige disciplina de comando (constar do briefing inicial do PCO), não software.
- **`AD8` é fundamental:** um vazio assumido vale mais do que uma cronologia falsamente precisa. É o que faz o documento aguentar contraditório.
- Considerar pista de áudio contínua na VCOC para transcrição posterior.

---

## 9. Pendente antes de programar

**Teste do papel, ainda não feito.** Dar a folha em branco + carta + manual a um operador experiente **não envolvido no projeto** e pedir-lhe que registe ~20 minutos de tráfego simulado. Onde ele parar para perguntar, o documento falhou — corrigir o documento, não a pessoa.

Não vale a pena programar um esquema que ainda não passou neste teste.

---

## 10. O que quero da conversa nova

Desenhar e construir a webapp:

1. Modelo de dados definitivo e esquema de armazenamento local
2. Ecrã de **captura rápida** — o mais importante de todos
3. Vistas: fita corrida, filtro por código/setor/criticidade, painel de marcos
4. Contador indicativo de efetivos + aviso de limiar de fase
5. Impressão da folha A3 a partir dos dados (contingência e artefacto assinado)
6. Exportação: relatório estruturado por secções, e dados em bruto (JSON/CSV)
7. Modo contingência e reconciliação (`AD6` → `AD7`, com `AD8` para o intervalo)

Preferência: **completude e profundidade técnica**, com fundamentação. Aponta o que estiver errado sem rodeios.
