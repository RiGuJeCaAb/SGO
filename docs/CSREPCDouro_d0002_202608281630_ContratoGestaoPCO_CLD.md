# Contrato de interoperação — Gestão PCO → Estação PEA

**CSREPC Douro · `pco:dispositivo` versão 1 · 28 AGO 2026**

Substitui o esboço `{ocorrencia, setores[], meios[], operacionais, meios_aereos}`
registado no roteiro da Estação PEA, que precede a gestão do dispositivo por
tipologias DECIR e não sustenta as funções hoje em uso.

Base: Despacho n.º 4067/2024, arts. 14.º e 17.º; DON n.º 2 — DECIR/2026,
Anexo 1 (tipologias), ponto 7.f (estados do incêndio), pontos 7.d.(5), (7), (8),
(14) e 7.e.(5)(r).

---

## 1. Princípios

**O contrato não é o estado interno de nenhuma das duas aplicações.** Cada lado
escreve um adaptador. A Estação PEA não deve conseguir partir a exportação da
Gestão PCO ao refactorizar o seu objeto de estado, e vice-versa.

**Versionado com escada própria.** `versao` é inteiro e monotónico. O importador
recusa versões que não conheça, sem tocar em nada — como já faz `migrarGravado()`
para o formato `peaapp:ocorrencia`.

**Tipologia antes de contagem.** Não se transmitem números de meios: transmite-se
a tipologia e a quantidade. Os efetivos derivam-se do Anexo 1 da DON n.º 2. Só
onde a força não corresponde a nenhuma tipologia se usa a contagem livre.

**Instantes, não durações.** Todos os tempos são instantes absolutos em ISO 8601
com fuso. Durações calculam-se no destino; se as transmitisses, envelheciam em
trânsito.

---

## 2. Envelope

```json
{
  "tipo": "pco:dispositivo",
  "versao": 1,
  "emitido": "2026-08-28T15:30:00+01:00",
  "origem": { "app": "Gestão PCO", "rev": "...", "operador": "...", "posto": "..." },
  "ocorrencia": { },
  "pco": { },
  "dispositivo": { }
}
```

`origem` não é decoração. Uma ocorrência é prova documental de decisões de
comando: quem exportou, de que posto e quando tem de ficar registado na fita do
tempo do lado que importa.

---

## 3. `ocorrencia`

```json
{
  "num": "2026080123",
  "local": "Alijó",
  "freguesia": "...", "concelho": "Alijó", "distrito": "Vila Real",
  "sub_regiao": "Douro",
  "lat": 41.2712, "lon": -7.4738,
  "inicio": "2026-08-28T11:42:00+01:00",
  "fase_sgo": "IV",
  "nivel_decir": "...",
  "area_ha": 120,
  "pco": { "local": "Vila Real", "lat": null, "lon": null }
}
```

Coordenadas em decimal, WGS84. A conversão para grau-minuto-segundo é
apresentação, não transporte.

---

## 4. `pco` — estrutura do posto de comando

Ausente no esboço anterior. É a razão de ser da aplicação de origem.

```json
{
  "funcoes": [
    { "funcao": "Oficial de Operações",
      "nome": "...", "entidade": "...", "contacto": "...",
      "nomeado": "2026-08-28T12:05:00+01:00",
      "siresp": "...", "ba": "..." }
  ],
  "nucleos_externos": [
    { "nucleo": "Núcleo de Segurança",
      "entidade_nomeadora": "GNR",
      "solicitado": "2026-08-28T13:10:00+01:00",
      "nomeado": "2026-08-28T13:52:00+01:00",
      "responsavel": "...", "contacto": "..." }
  ]
}
```

`funcao` usa exatamente a designação do art. 14.º e dos arts. 18.º a 38.º. Nada
de abreviaturas livres: o destino cruza esta cadeia com as funções exigíveis pela
fase do SGO e pelo dispositivo, e um nome aproximado falha o cruzamento em
silêncio.

Os três núcleos do art. 17.º, n.º 2, als. d), e) e f) são nomeados por entidade
externa por solicitação do COS (arts. 23.º, n.º 2; 24.º, n.º 2; 25.º, n.º 2).
São dois instantes distintos e a distância entre eles é informação operacional:
transmitem-se ambos, e `nomeado` pode vir a nulo enquanto o pedido estiver
pendente.

---

## 5. `dispositivo`

```json
{
  "setores": [
    { "id": "A",
      "estado": "Em curso (ativo)",
      "comandante": "...", "contacto": "...", "adjunto": "...",
      "forcas": [
        { "tipologia": "ECIN", "quantidade": 2,
          "empenhado": "2026-08-28T12:30:00+01:00",
          "operacionais_unidade": 5,
          "entidade": "CB Alijó" }
      ],
      "livre": null }
  ],
  "aereos": [
    { "tipo": "HEBL", "indicativo": "HOTEL 15",
      "empenhado": "2026-08-28T13:00:00+01:00",
      "cma": "Vila Real" }
  ],
  "reserva":       { "forcas": [], "meios": null, "operacionais": null },
  "zona_apoio":    { "forcas": [], "meios": null, "operacionais": null },
  "ponto_transito":{ "designacao": "...", "responsavel": "...",
                     "contacto": "...", "lat": null, "lon": null,
                     "ativo_desde": "2026-08-28T12:15:00+01:00" },
  "zcr": { "ativa": false, "local": null, "areas": [] }
}
```

### Campos que não são opcionais na prática

**`estado`** — um dos cinco valores da DON n.º 2, ponto 7.f, literalmente: *Em
curso (ativo)*, *Em resolução (dominado)*, *Em conclusão (extinto)*, *Vigilância
ativa e consolidação de rescaldo*, *Reativação*. O motor de geração do PEA
ramifica sobre estes valores; um sexto valor inventado degrada silenciosamente
para o primeiro.

**`empenhado`** — instante em que a força ficou empenhada naquele setor. Sem
ele, o controlo de tempos e rendições não existe. Se a Gestão PCO não o souber
com precisão, transmite o melhor que tiver e marca `"empenhado_estimado": true`;
uma estimativa assinalada é infinitamente melhor do que um nulo.

**`tipologia`** — sigla exata do Anexo 1 da DON n.º 2 (EIP, ECIN, ECIN R, ELAC,
EMR, ERAS, BCIN, BRIR, GCIN, GRUATA, GRMAQ, CRIR, …). Onde a força não
corresponder a tipologia nenhuma, usa-se `"tipologia": null` com
`"meios": n, "operacionais": n` no mesmo objeto.

**`operacionais_unidade`** — efetivo real da unidade, quando diferente do
previsto no Anexo 1. Omitir quando coincide; o destino usa o catálogo.

**`indicativo`** dos aéreos — indicativos de chamada fixados na DON n.º 2:
HOTEL (HEBL e HEBM do dispositivo nacional), CELCA (HEBL e HEBM da AFOCELCA),
KILO (HEBP), FIRE (HERAC), ALFA (AVBM), BRAVO (AVBP), OSCAR (AVRAC).

---

## 6. Comunicações

Fica **fora** deste contrato, e deliberadamente.

Compete ao CSREPC e ao CNEPC atribuir os canais rádio de cada TO, e ao COS
implementar com base neles um plano de comunicações — DON n.º 2, ponto 10, n.ºs
(1) e (2). No TO existe apenas um plano de comunicações, e não se usam canais
que nele não estejam previstos (n.º 3). Transportar canais numa exportação de
dispositivo criaria uma segunda fonte de verdade para uma coisa que a doutrina
manda ter fonte única.

Os campos `siresp` e `ba` em `pco.funcoes` são a exceção justificada: registam a
que canal cada função nomeada está a escutar, o que é atribuição, não plano.

---

## 7. Comportamento do importador

1. Rejeitar `tipo` diferente de `pco:dispositivo` e `versao` superior à conhecida,
   sem alterar o estado corrente.
2. Se já houver ocorrência carregada com `num` diferente, pedir confirmação antes
   de substituir — a Estação PEA já faz isto na importação de ocorrência.
3. Normalizar `estado` pelo mapa de estados antigos antes de validar.
4. Derivar meios e operacionais do catálogo; usar as contagens livres só onde
   `tipologia` for nula.
5. Registar na fita do tempo: origem, operador, GDH de emissão, GDH de importação,
   número de setores e de forças importados, e quantas vieram sem `empenhado`.
6. **Não sobrepor silenciosamente.** Uma importação que substitua dispositivo já
   registado apresenta o diferencial antes de aplicar.

---

## 8. Compatibilidade com o esboço anterior

O esboço `{ocorrencia, setores[], meios[], operacionais, meios_aereos}` mapeia-se
como versão 0: `setores[]` de cadeias vai para `setores[].livre`, `meios` e
`operacionais` vão para `reserva`, e `meios_aereos` numérico gera essa quantidade
de aéreos de tipo `HEBL` sem indicativo nem instante — que é exatamente o que a
Estação PEA já faz hoje ao migrar `e.aer` para `e.aerL`. Serve para não perder
dados antigos. Não serve para operar.
