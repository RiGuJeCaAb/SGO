# Especificação de Exportação JSON — Gestão PCO → Estação PEA

**CSREPC Douro · Núcleo de Apoio às Operações · v1.3 · setembro de 2026**
*Documento a entregar ao responsável pela app Gestão PCO.*

> **Este documento substitui a v1.2 na íntegra.** Não é uma emenda: é o único documento a
> implementar. A v1.2, a v1.1 e a v1.0 continuam a ser lidas pela Estação, por
> retrocompatibilidade, mas quem estiver a começar implementa esta e só esta.
>
> **Alterações face à v1.2** — cinco campos, todos opcionais, e nenhum muda o que a v1.2 já
> exporta: um pacote v1.2 é um pacote v1.3 sem eles. `origem` em cada meio terrestre
> (regra 14); o indicativo dos meios aéreos na forma do Anexo 6 da DON n.º 2, com `cma`
> (regra 15); `sub_regiao` e `concelho` na ocorrência (regra 16); `saida_to` e
> `chegada_entidade` nos meios e nas aeronaves (regra 17); e o bloco `eventos`, com o que o
> SADO sabe antes de alguém o teclar, para a fita do tempo (regra 18). Vêm todos do que a
> Estação aprendeu entre 28 de agosto e 6 de setembro, e a razão de cada um está na regra.

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
  "versao": "1.3",
  "gerado": "271045AGO26",

  "ocorrencia": {
    "numero": "202608251000",
    "local": "Paraduça - Leomil - Moimenta da Beira",
    "pco": "Paraduça",
    "sub_regiao": "Douro",
    "concelho": "Moimenta da Beira",
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
          "origem": "CB Moimenta da Beira", "empenhado_desde": "251430AGO26" },
        { "tipologia": "VFCI", "quantidade": 2, "veiculos": 1, "operacionais": 5,
          "origem": "CB Lamego", "empenhado_desde": "2026-08-25T15:10:00+01:00" },
        { "tipologia": "VLCI", "quantidade": 1, "veiculos": 1, "operacionais": 4,
          "origem": "CB Tarouca", "empenhado_desde": "251420AGO26",
          "saida_to": "261010AGO26", "chegada_entidade": "261055AGO26" }
      ]
    }
  ],

  "meios_aereos": [
    { "tipologia": "HEBL",  "indicativo": "H15", "cma": "Vila Real", "entrada_to": "251505AGO26" },
    { "tipologia": "HEBP",  "indicativo": "K2", "entrada_to": "251530AGO26", "saida_to": "251945AGO26" },
    { "tipologia": "HERAC", "indicativo": "FIRE 01", "entrada_to": "251540AGO26" }
  ],

  "reserva": { "veiculos": 1, "operacionais": 2 },
  "za":      { "veiculos": 1, "operacionais": 2 },

  "ponto_transito": {
    "designacao": "Rotunda da EN226, Leomil",
    "responsavel": "Adj. Pinto", "contacto": "9XXXXXXXX"
  },

  "eventos": [
    { "instante": "251402AGO26", "tipo": "alerta",
      "texto": "Alerta. Ocorrência 202608251000, incêndio rural, Paraduça" },
    { "instante": "251409AGO26", "tipo": "despacho",
      "texto": "Despachados VFCI-01 e VLCI-02 do CB Moimenta da Beira" },
    { "instante": "2026-08-25T14:21:00+01:00", "tipo": "chegada",
      "texto": "Primeiro meio no local: VFCI-01, frente ativa com cerca de 200 m" },
    { "instante": "251505AGO26", "tipo": "reforco",
      "texto": "Solicitado reforço de 1 GCIN e 1 meio aéreo ao CSREPC" }
  ],

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
indicativo e regista a hora de entrada no TO. A forma preferida do indicativo é a do
Anexo 6 — ver a regra 15; a família do Anexo 1 — `HOTEL` (HEBL e HEBM do dispositivo
nacional), `CELCA` (HEBL e HEBM da AFOCELCA), `KILO` (HEBP), `FIRE` (HERAC), `ALFA` (AVBM),
`BRAVO` (AVBP), `OSCAR` (AVRAC) — continua a ser aceite, e é a que serve aos meios que o
Anexo 6 não tem.

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

**14 · `origem` em cada meio terrestre.** O corpo de bombeiros ou a entidade de onde a força
vem: `"origem": "CB Moimenta da Beira"`. A Gestão PCO sabe-o, porque lhe chega do SADO, e é o
campo que na Estação se escreve à mão em cada unidade. Com ele o mesmo corpo de bombeiros
fica com o mesmo nome nas duas aplicações, e a lista de origens da Estação enche-se com
nomes reais em vez de com o que a DON n.º 2 nomeia por localização. `entidade`, o nome que
uma revisão anterior da Estação lia, continua aceite como sinónimo.

**15 · Indicativo do Anexo 6, e `cma`.** Desde a r0119 a Estação tem transcrito o Anexo 6
da DON n.º 2 / DECIR 2026 — cada centro de meios aéreos com os indicativos dos meios lá
sediados, por período — e o Anexo 18, com as coordenadas dos CMA. Quando a Gestão PCO
conhecer o indicativo nessa forma — `H15`, `K2`, `A3`, `B1`, `FIRE4`, `O1`, `Pantera 1` —,
é essa que envia. A Estação cruza-o com a rede na data de início da ocorrência: preenche a
tipologia quando o pacote não a traz, preenche o CMA de origem, mede a distância ao ponto da
ocorrência e aplica a norma dos 40 km dos helicópteros ligeiros — ponto 7.j.(3). Se a
tipologia vier diferente da do anexo, fica a exportada e a Estação assinala-o. `cma` é
opcional e sobrepõe-se ao da rede quando vier.

**16 · `sub_regiao` e `concelho`.** Na ocorrência. A sub-região é a do teatro de operações
— `Douro`, `Tâmega e Sousa`, qualquer uma das do Anexo I do DL n.º 90-A/2022 —, e é ela que
escolhe o pacote de canais sub-regional e ordena as listas de origens da Estação. O posto de
comando instala-se em qualquer ponto do território, e os meios atuam em todo ele: isto
deixa de ser uma constante do posto e passa a vir com a ocorrência.

**17 · `saida_to` e `chegada_entidade`.** Num meio ou numa aeronave. Hoje uma força que sai
simplesmente desaparece da exportação seguinte, e a Estação vê uma perda de informação no
diferencial sem saber porquê. Com `saida_to` a Estação regista a saída do TO na rendição da
unidade, como se tivesse sido registada à mão: a unidade sai da contagem de empenhamento e
o relógio fecha com a hora certa. `chegada_entidade` é a hora do ponto 9.d.(6) da DON n.º 2,
a chegada ao quartel ou ao local de estacionamento, e regista-se depois da saída. Uma
chegada sem saída não se aceita, e uma chegada anterior à saída fica só com a saída — as
duas assinaladas. Uma força que saiu pode continuar a vir na exportação com estes dois
campos, e é preferível que venha: é assim que a Estação a conta como rendida em vez de a
dar por perdida.

**18 · Bloco `eventos`.** Opcional. O que o SADO regista antes de alguém o teclar no PCO —
o alerta, o despacho, a chegada do primeiro meio, os pedidos de reforço, as
desmobilizações — são registos da fita do tempo tal como o art. 2.º, n.º 1, al. c) do
Despacho n.º 4067/2024 a define, e são os marcos que o modelo OP 04 pede. Cada evento traz
`instante` (GDH ou ISO 8601, regra 3), `tipo` e `texto`. Os tipos que a fita da Estação tem
são `posit`, `agravamento`, `melhoria`, `meios` e `decisao`; aceitam-se ainda `alerta`,
`despacho`, `chegada`, `reforco`, `pedido` e `desmobilizacao`, que a Estação converte. Um
tipo que não esteja aqui entra como ponto de situação, assinalado; um evento sem texto ou
sem instante legível é ignorado, assinalado. A Estação escreve cada evento na fita com a
marca «importado da Gestão PCO» no texto, e nunca o escreve duas vezes: a mesma exportação
importada outra vez, ou a seguinte a repetir os eventos antigos, não duplica registos.

Isto não contraria a secção 6. A fita continua a viver na Estação e a verdade do
dispositivo na Gestão PCO: a importação só alimenta a fita, na mesma direção de sempre, como
já faz às mudanças de estado dos setores.

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
| `setores[].meios[].origem` | Secção 2 — a origem de cada unidade, e a lista de origens |
| `meios_aereos[].indicativo` (Anexo 6), `cma` | Secção 2 — rede de meios aéreos; avisos — norma dos 40 km |
| `ocorrencia.sub_regiao`, `concelho` | Secção 1 — Identificação; Logística — pacote de canais sub-regional |
| `saida_to`, `chegada_entidade` | Logística — rendição da unidade; saída da contagem de empenhamento |
| `eventos[]` | Operações — fita do tempo, com a marca de importação |

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
7. **`origem` em cada meio.** É o que hoje se escreve à mão, unidade a unidade.
8. **`saida_to`.** Sem ele a Estação não sabe se uma força saiu ou se a exportação a perdeu.
9. **`eventos`, o indicativo do Anexo 6 e a sub-região.** Cada um poupa uma transcrição, e
   nenhum bloqueia o resto se faltar.

## 9. Para verificar antes de entregar

A Estação traz as ferramentas para a Gestão PCO se validar sem depender de ninguém:

- `npm run validar-gp -- <ficheiro>` corre o mesmo leitor e conversor da Estação sobre um
  ficheiro e diz o que ela fará com ele, **sem escrever nada**.
- `docs/interop/exemplos/` tem o exemplo desta versão, `EspecificacaoJSON_v1.3_exemplo.json`,
  que entra sem um único ponto a confirmar, o da v1.2, e outros degradados que exercitam as
  conversões.

---

*CSREPC Douro · Núcleo de Apoio às Operações · realizado com a cooperação de Claude (Anthropic).*
