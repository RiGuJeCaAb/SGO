# Especificação de Exportação JSON — Gestão PCO → Estação PEA

**CSREPC Douro · Núcleo de Apoio às Operações · v1.2 · agosto de 2026**
*Documento a entregar ao responsável pela app Gestão PCO.*

> **Este documento substitui a v1.1 na íntegra.** Não é uma emenda: é o único documento a
> implementar. A v1.1 e a v1.0 continuam a ser lidas pela Estação, por retrocompatibilidade,
> mas quem estiver a começar implementa esta e só esta.
>
> **Alterações face à v1.1** — bloco `pco` com a estrutura do posto de comando e os dois
> instantes da nomeação externa; campos de tempo passam a aceitar GDH doutrinário **ou**
> ISO 8601; comparação de versões declarada; ponto de trânsito acrescentado como opcional;
> retirado o bloco `comunicacoes` que a v1.1 previa para uma v2.0.

---

## 1. Objetivo

Permitir que a app **Gestão PCO** — dona do estado vivo dos meios, alimentada pelo SADO —
exporte um instantâneo do dispositivo que a **Estação PEA** importa com um clique,
eliminando a transcrição manual de setores e meios.

Uma única direção de dados, Gestão PCO → Estação, sem dependência inversa: cada aplicação
continua autónoma e funciona sozinha no dia em que a outra não estiver.

## 2. Transporte

- Botão **«Exportar JSON»** na Gestão PCO, que descarrega
  `GestaoPCO_<ocorrencia>_<AAAAMMDDHHMM>.json` em UTF-8.
- A Estação PEA tem o botão correspondente, **«Importar da Gestão PCO»**, que aceita
  ficheiro ou conteúdo colado.
- Sem servidores, sem contas, sem rede: transferência por ficheiro, compatível com o
  ambiente de um posto de comando.

## 3. Esquema

```json
{
  "versao": "1.2",
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

  "pco": {
    "funcoes": [
      { "funcao": "Oficial de Operações", "nome": "Cmdt Costa",
        "entidade": "CB Moimenta da Beira", "contacto": "9XXXXXXXX",
        "nomeado": "251205AGO26", "siresp": "", "ba": "" }
    ],
    "nucleos_externos": [
      { "nucleo": "Núcleo de Segurança", "entidade_nomeadora": "GNR",
        "solicitado": "251310AGO26", "nomeado": "251352AGO26",
        "responsavel": "Sarg. Silva", "contacto": "9XXXXXXXX" }
    ]
  },

  "setores": [
    {
      "nome": "Alfa",
      "estado": "Em curso (ativo)",
      "comandante": "Cmdt CB Moimenta da Beira",
      "adjunto": "",
      "contacto": "9XXXXXXXX",
      "meios": [
        { "tipologia": "GCIN", "quantidade": 1, "veiculos": 7, "operacionais": 26,
          "empenhado_desde": "251430AGO26" },
        { "tipologia": "VFCI", "quantidade": 2, "veiculos": 1, "operacionais": 5,
          "empenhado_desde": "2026-08-25T15:10:00+01:00" }
      ]
    }
  ],

  "meios_aereos": [
    { "tipologia": "HEBP",  "indicativo": "KILO 04", "entrada_to": "251505AGO26" },
    { "tipologia": "HERAC", "indicativo": "FIRE 01", "entrada_to": "251540AGO26" }
  ],

  "reserva": { "veiculos": 1, "operacionais": 2 },
  "za":      { "veiculos": 1, "operacionais": 2 },

  "ponto_transito": {
    "designacao": "Rotunda da EN226, Leomil",
    "responsavel": "Adj. Pinto", "contacto": "9XXXXXXXX"
  },

  "sensiveis": [
    { "nome": "Leomil", "grau": "prioridade", "nota": "sede de freguesia a NE" }
  ]
}
```

Os dois formatos de tempo aparecem de propósito no exemplo, no mesmo array: ambos são
válidos no mesmo campo. Ver a regra 3.

## 4. Regras

**1 · `versao`.** Obrigatória, cadeia. A comparação faz-se **por partes numéricas, nunca
por cadeia**: `"1.10"` é posterior a `"1.9"`, e a comparação textual diria o contrário. A
Estação já compara assim, e tem teste que o fixa. Uma versão maior do que a que a Estação
conhece é recusada com motivo, sem escrever nada.

**2 · GDH doutrinário.** `DDHHMM` mais mês abreviado e ano a dois dígitos: `251430AGO26`.

**3 · Instantes: GDH ou ISO 8601, no mesmo campo.** Qualquer campo de tempo aceita o GDH
doutrinário ou uma marca ISO 8601 com fuso — `2026-08-25T15:10:00+01:00`. As duas formas
são inequivocamente distinguíveis, e a Estação tenta uma e depois a outra.

Porquê: o GDH não leva fuso horário. Em operação nacional, com uma zona horária só, isso
não é problema. Passa a ser em dois casos concretos — uma exportação gerada num sistema
que trabalha em UTC e lida num posto em hora local, e a transição da hora de verão, em que
existe uma hora repetida. Quem puder emitir ISO, emita; quem não puder, continua em GDH e
nada se parte.

**4 · `ocorrencia.inicio`.** GDH de abertura da ocorrência. É a base do limiar dos 90
minutos que torna exigível o PEA formalmente elaborado — DON n.º 2, ponto 7.e.(5)(a). Sem
ele a Estação não consegue temporizar a transição de ataque inicial para ampliado.

**5 · `ocorrencia.nivel_decir`.** Um de `ALFA · BRAVO · CHARLIE · DELTA`. Opcional: sem ele
a Estação deriva o nível do calendário do ponto 7.b da DON n.º 2. O campo `fase` da v1.0
chama-se agora `fase_sgo`, e `fase` mantém-se como sinónimo aceite.

**6 · `estado` de setor.** Nomenclatura do ponto 7.f da DON n.º 2, exatamente um de:
`Em curso (ativo)` · `Em resolução (dominado)` · `Em conclusão (extinto)` ·
`Vigilância ativa e consolidação de rescaldo` · `Reativação`.
Os valores da v1.0 — `Frente ativa`, `Em consolidação`, `Rescaldo`, `Vigilância ativa` —
continuam aceites e são convertidos na importação.

**7 · `tipologia`.** Sigla do Anexo 1 da DON n.º 2 / DECIR 2026. `veiculos` e
`operacionais` são **por unidade**; a Estação multiplica pela `quantidade` e valida contra
o catálogo. Divergências não bloqueiam: prevalece o valor exportado, por ser o efetivo real
da força no TO, e a Estação assinala a diferença.

Siglas descontinuadas e conversão: `GRIF` → `GRIR`; `GAUF` → `EAUF`; `eSF` → `ESF`;
`FEB/UEPS` → decompor em `ETATI`, `PATE` ou `GRUATA (UEPS)`; `MR` isolada → `EMR (CB)`,
`EMR (ICNF)`, `EMR (FEPC)` ou `EMR (AFOCELCA)`, consoante a entidade. As três últimas
exigem decisão humana e a Estação não a toma por quem exportou: ficam como vieram e são
assinaladas.

**8 · `meios_aereos`.** Lista, não contagem. Cada entrada identifica a aeronave pelo
indicativo de chamada fixado no Anexo 1 — `HOTEL` (HEBL e HEBM do dispositivo nacional),
`CELCA` (HEBL e HEBM da AFOCELCA), `KILO` (HEBP), `FIRE` (HERAC), `ALFA` (AVBM), `BRAVO`
(AVBP), `OSCAR` (AVRAC) — e regista a hora de entrada no TO.

A Estação usa a lista para dois efeitos: acionar os limiares do COPAR-T, mais de duas
aeronaves **de combate**, e do COPAR-Ar, quatro ou mais; e contar o tempo de cada aeronave
no TO. Um inteiro é aceite por retrocompatibilidade e convertido em entradas anónimas sem
relógio, que servem para não perder dados antigos e não servem para operar.

**9 · `empenhado_desde` e `entrada_to`.** Sustentam o controlo dos tempos de trabalho e o
pedido de rendição ao CSREPC — DON n.º 2, pontos 7.d.(14) e 7.e.(5)(r). **São os campos de
maior valor operacional de todo o esquema:** sem eles a Estação recebe o dispositivo e não
projeta uma única rendição.

Se a hora exata não for conhecida, envie-se a melhor estimativa com
`"empenhado_estimado": true` no mesmo objeto. Uma estimativa assinalada é infinitamente
melhor do que um campo vazio: o operador vê a marca e sabe que aquele contador tem margem.

**10 · Bloco `pco`.** Opcional, e o único que a v1.1 não tinha.

`funcao` e `nucleo` usam **exatamente** a designação do art. 14.º e dos arts. 18.º a 38.º
do Despacho n.º 4067/2024. Sem abreviaturas: a Estação cruza esta cadeia com as funções
exigíveis pela fase do SGO e pelo dispositivo, e um nome aproximado não rebenta nada —
simplesmente não encontra correspondência, e a aplicação passa a dizer que a função está
por nomear quando está nomeada. Falha silenciosa é o pior género.

Em `nucleos_externos`, os três núcleos do art. 17.º, n.º 2, als. d), e) e f) são nomeados
por entidade externa **a pedido do COS**: a força de segurança territorialmente competente,
o INEM, I. P., e o Instituto da Segurança Social, I. P., respetivamente. São **dois
instantes distintos**, e a distância entre eles é informação operacional: transmitem-se
ambos, e `nomeado` vem a `null` enquanto o pedido estiver pendente.

`entidade_nomeadora` deve trazer a entidade concreta — `GNR`, `PSP` — e não a designação
genérica da lei. Numa pendência de passagem de turno o que serve é o nome de quem se liga.

As funções do PCO **fundem-se pela designação**: uma função nomeada à mão na Estação nunca
é apagada por uma importação, e os campos que o pacote não declara sobrevivem.

**11 · `ponto_transito`.** Opcional. A DON n.º 2, pontos 7.d.(5), (7) e (8), manda
estabelecê-lo quando há pedido de reforço. Envie-se se a Gestão PCO o conhecer; se não
conhecer, omita-se — a Estação tem campo próprio para o oficial preencher.

**12 · Campos desconhecidos são ignorados**, para que a Gestão PCO possa evoluir sem
esperar por uma revisão desta especificação.

**13 · Coordenadas em decimal WGS84.** A Estação converte para grau-minuto e para
grau-minuto-segundo; a conversão é apresentação, não transporte.

## 5. Mapeamento na Estação PEA

| Campo | Destino |
|---|---|
| `ocorrencia.numero/local/pco/latitude/longitude` | Secção 1 — Identificação |
| `ocorrencia.inicio` | Secção 1 — Início; relógio dos 90 minutos |
| `ocorrencia.fase_sgo` / `nivel_decir` | Secção 1 — Fase do SGO e nível DECIR |
| `pco.funcoes[]` | Secção 3 — Estrutura do posto de comando |
| `pco.nucleos_externos[]` | Secção 3 — nomeações; avisos — núcleo solicitado e por nomear |
| `setores[].nome/estado/comandante/adjunto/contacto` | Secção 2 — linha do setor |
| `setores[].meios[]` | Secção 2 — tipologias, com relógio a partir de `empenhado_desde` |
| `meios_aereos[]` | Secção 2 — lista nominal; avisos — limiares COPAR-T e COPAR-Ar |
| `reserva`, `za` | Secção 2 — controlos respetivos |
| `ponto_transito` | Secção 2 — cartão do ponto de trânsito |
| `sensiveis[]` | Secção 2 — aglomerados e pontos sensíveis |
| `empenhado_desde`, `entrada_to` | Avisos — quadro de tempos e rendições |

Antes de aplicar, a Estação mostra o **diferencial ao nível do setor** — estado,
comandante, número de forças e quantas têm relógio — e assinala as linhas em que se perde
informação já registada. Cancelar não altera nada.

## 6. O que a Estação devolve

Nada. A importação não escreve de volta na Gestão PCO. Evoluções, PEA, avisos, fita do
tempo e passagem de turno permanecem na Estação; a verdade do dispositivo em tempo real
permanece na Gestão PCO. **Uma verdade por domínio.**

## 7. O que fica deliberadamente de fora

**Comunicações.** A v1.1 previa um bloco `comunicacoes` para uma futura v2.0. Está
retirado, e a razão é doutrinária, não técnica.

A DON n.º 2, ponto 10, n.ºs (1) a (3): compete ao CSREPC e ao CNEPC atribuir os canais
rádio de cada TO; compete ao COS implementar, com base neles, um plano de comunicações; e
**no TO existe apenas um plano de comunicações, não devendo ser utilizados canais que nele
não estejam previstos**. Transportar canais numa exportação de dispositivo criaria uma
segunda fonte de verdade para uma coisa que a doutrina manda ter fonte única. É a mesma
lógica da secção 6, aplicada às comunicações.

Os campos `siresp` e `ba` em `pco.funcoes` são a exceção justificada: registam a que canal
cada função nomeada está a escutar, o que é atribuição, não plano.

**Frequências aéreas.** Pela mesma razão. O canal prioritário terra/ar/terra é a frequência
da banda aeronáutica **atribuída ao incêndio** — DON n.º 2, ponto 10, n.º (5) — e não uma
constante. Quem a atribui é o CSREPC, e o seu lugar é o plano de comunicações.

## 8. O que mais importa acertar, por ordem de valor operacional

Se o esforço tiver de ser faseado, esta é a ordem que maximiza o que a Estação consegue
fazer com o que receber.

1. **`empenhado_desde` e `entrada_to`.** Sem eles não há projeção de rendições nem controlo
   dos tempos de trabalho que sustenta o pedido ao CSREPC.
2. **`ocorrencia.inicio`.** Base do limiar dos 90 minutos.
3. **`estado` de setor com a nomenclatura do ponto 7.f.** O motor de elaboração do PEA
   ramifica sobre estes valores: uma reativação dispara prioridade absoluta, zero setores
   ativos dispara a transição para consolidação. Um sexto valor inventado degrada em
   silêncio para o primeiro.
4. **Lista nominal de aeronaves com indicativo.** Aciona os limiares do COPAR-T e do
   COPAR-Ar e dá relógio a cada aeronave.
5. **Comandante de setor com contacto.** O art. 17.º, n.º 1, al. c) manda transmitir-lhe as
   ordens de missão; não se transmite a um setor anónimo.
6. **Bloco `pco`, se existir.** Designações exatas, e os dois instantes nos núcleos externos.

## 9. Para verificar antes de entregar

A Estação traz as ferramentas para a Gestão PCO se validar sem depender de ninguém:

- `npm run validar-gp -- <ficheiro>` corre o mesmo leitor e conversor da Estação sobre um
  ficheiro e diz o que ela fará com ele, **sem escrever nada**.
- `docs/interop/exemplos/` tem um exemplo que entra sem um único ponto a confirmar, e outro
  degradado que exercita todas as conversões.

---

*CSREPC Douro · Núcleo de Apoio às Operações · realizado com a cooperação de Claude (Anthropic).*
