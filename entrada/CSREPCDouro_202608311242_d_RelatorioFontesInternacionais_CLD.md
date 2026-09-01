# Relatório integral — fontes cartográficas internacionais e análise do NASA GIBS

**Documento:** `CSREPCDouro_202608311242_d_RelatorioFontesInternacionais_CLD.md`
**Data da sessão:** 31 de agosto de 2026
**Continuação de:** `CSREPCDouro_202608310914_d_RelatorioSessaoCartografia_CLD.md`
**Intervenientes:** C. Abreu (CSREPC Douro), Claude
**Ficheiro associado:** `wmts_gibs_3857.xml` (5 797 572 bytes), entregue em `CSREPCDouro_fixture_gibs_CLD.zip`
**Estado:** análise concluída; validação em rede institucional pendente

Este relatório regista tudo o que foi tentado nesta parte da sessão, incluindo o que falhou e os erros cometidos por Claude. Não omite nem suaviza.

---

## 1. Questão colocada

C. Abreu, depois de passar ao workstream CODE o problema do sistema de coordenadas identificado no relatório anterior:

> *"sem ser a DGT ou o ICNF ou outra qualquer entidade nacional, que entidade internacional nos poderia dar as informações que necessitamos?"*

---

## 2. Enquadramento da resposta

A posição de Claude foi que **nenhuma entidade internacional substitui a DGT ou o ICNF** para o que é autoritativo. Limites administrativos, ocupação do solo e perigosidade de incêndio têm autoridade legal nacional. Um limite de freguesia obtido de fonte estrangeira não tem valor probatório num registo produzido ao abrigo do Despacho n.º 4067/2024.

A pergunta útil foi reformulada: **o que fazem os internacionais que nenhum nacional faz?**

Resposta: **imagem fresca e detecção em tempo quase real.** As ortofotos da DGT são de 2018 e 2023 — arquivo estático. Nenhuma fonte nacional identificada nas capturas anteriores publica detecção de fogo activo.

---

## 3. Candidatos avaliados

### 3.1 NASA GIBS (Global Imagery Browse Services) — seleccionado

Serviço da NASA EOSDIS. Fornece WMTS 1.0.0 com pedidos em KVP e RESTful, e WMS.

Razões da selecção, por ordem de peso:

1. **Fala o protocolo que o interpretador da Estação PEA já implementa.** WMTS 1.0.0.
2. **Publica em Web Mercator com `GoogleMapsCompatible`**, ponto de acesso `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi`.
3. **Não exige chave, registo nem OAuth.** Decisivo no modelo `file://` sem gestão de credenciais.
4. **Publica anomalias térmicas VIIRS a 375 m em tempo quase real**, incluindo passagem nocturna, e reflectância corrigida em cor verdadeira diária.

### 3.2 Copernicus Data Space Ecosystem (Comissão Europeia / ESA) — adiado

Sentinel-2 a 10 m, revisita de cerca de cinco dias. Oferece WMS, WMTS, WFS e WCS através da suite Sentinel Hub, mas o acesso faz-se por endereço de instância personalizado obtido no registo, com painel de controlo e unidades de processamento contabilizadas.

Imagem muito superior à do GIBS; atrito de credenciais incompatível com o modelo actual. Recomendado para quando existir servidor no VCOC, com a instância a residir no servidor e não no cliente.

### 3.3 NASA FIRMS — recomendado por via de API de pontos

Latência inferior à do GIBS, com produtos em tempo ultra-real. Exige `MAP_KEY` gratuito. Suporta EPSG:4326 e EPSG:3857 ou 900913, com actualização a cada quinze minutos e limite de 5000 transacções por intervalo de dez minutos.

### 3.4 EFFIS / GWIS (Centro Comum de Investigação) — excluído como fonte táctica

Já analisado no relatório anterior. MapServer, sem EPSG:3763, FWI do Météo-France a 0,1° (cerca de 11 km), dimensão temporal obrigatória. Admissível como contexto europeu; inadequado como fonte de decisão táctica no vale do Douro.

### 3.5 Eurostat GISCO — excluído

Limites NUTS e LAU livres para toda a Europa. Tecnicamente sólidos, juridicamente irrelevantes face à CAOP.

### 3.6 Copernicus EMS Rapid Mapping — não é serviço a integrar

Mecanismo de activação institucional accionado pelo ponto focal nacional. Em incêndio de grande dimensão produz delimitação de perímetro derivada de satélite em poucas horas. Não entra na Estação PEA como camada; entra como procedimento que o PEA deve saber referenciar.

---

## 4. Conclusão de arquitectura: pontos em vez de mosaicos

Identificou-se que, se o workstream CODE adoptar a Opção B do relatório anterior — motor de mapa nativo em EPSG:3763 —, **todas as fontes internacionais raster ficam excluídas**, porque nenhuma publica PT-TM06.

Este aparente impasse resolve-se por uma distinção elementar: **os focos de calor são pontos, não mosaicos.**

- A API de área do FIRMS aceita uma caixa envolvente e devolve CSV com latitude e longitude.
- Reprojectar pontos de WGS84 para PT-TM06 é aritmética de Transversa de Mercator — cerca de quarenta linhas.
- Reprojectar mosaicos já desenhados é impossível, como o próprio código da Estação PEA regista em comentário.

**Consequência:** a base cartográfica pode ser oficial portuguesa em EPSG:3763, com os focos de calor da NASA sobrepostos como camada vectorial reprojectada no cliente. Sem conflito. Ganha-se ainda o que o mosaico não dá: hora de detecção, satélite de origem, potência radiativa e nível de confiança por foco, apresentáveis em tabela.

Esta conclusão é relevante para a decisão que o workstream CODE tem em mãos e deve ser-lhe transmitida.

---

## 5. Captura do GIBS — sequência de diagnóstico

### 5.1 Primeira tentativa e diagnóstico errado de Claude

Comando executado:

```powershell
curl.exe -L --compressed -s -D headers_gibs.txt -o wmts_gibs_3857.xml `
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0"
Get-Content .\headers_gibs.txt | Select-String 'HTTP/|content-type|access-control'
```

O `Select-String` não produziu saída. O ficheiro `headers_gibs.txt` foi enviado a Claude com **0 bytes**.

**Claude diagnosticou bloqueio de rede institucional**, argumentando que o `gibs.earthdata.nasa.gov` seria o primeiro domínio fora da Europa tentado na sessão e que uma rede da administração pública seria candidata a filtragem por lista branca ou a inspecção TLS.

**Este diagnóstico estava errado.** Um ficheiro de cabeçalhos vazio não é prova de falha de ligação. Foi salto lógico não justificado pela evidência.

### 5.2 Verificação

```powershell
curl.exe -sS -o wmts_gibs_3857.xml -D headers_gibs.txt "…"
"exit code: $LASTEXITCODE"
```

Resultado: **`exit code: 0`**. Transferência completa sem erro.

```powershell
Resolve-DnsName gibs.earthdata.nasa.gov | Select-Object Name, Type, IPAddress
```

```
gibs.earthdata.nasa.gov          CNAME
dmll8gi1vfsad.cloudfront.net     A     99.86.159.23
dmll8gi1vfsad.cloudfront.net     A     99.86.159.61
dmll8gi1vfsad.cloudfront.net     A     99.86.159.49
dmll8gi1vfsad.cloudfront.net     A     99.86.159.97
```

```powershell
Test-NetConnection gibs.earthdata.nasa.gov -Port 443
```

```
RemoteAddress    : 99.86.159.23
RemotePort       : 443
InterfaceAlias   : Wi-Fi
SourceAddress    : 172.20.10.3
TcpTestSucceeded : True
```

Rede sem qualquer restrição. O GIBS está servido por CloudFront com quatro endereços.

O motivo de o `-D` produzir zero bytes nas duas execuções, com a transferência a completar-se com êxito, **não foi apurado**. Suspeita-se de interferência de antivírus ou EDR na escrita do ficheiro secundário. Não foi perseguido por não ser material.

### 5.3 Observação de âmbito com consequência operacional

O `SourceAddress : 172.20.10.3` e o `InterfaceAlias : Wi-Fi` correspondem à gama que o iOS atribui em partilha de ligação. **Toda esta sessão de capturas foi executada a partir de dados móveis, não da rede institucional.**

Isto não invalida os documentos capturados — são os que a DGT, o ICNF, o EFFIS e a NASA publicam, independentemente do requisitante. Mas **invalida qualquer conclusão sobre acessibilidade a partir dos locais onde a Estação PEA vai operar.**

**Tarefa pendente, classificada como requisito:** repetir uma amostra das capturas a partir de (a) um posto da rede do CSREPC Douro e (b) o VCOC ligado à Starlink. Se os resultados divergirem, a mesma aplicação comporta-se de forma diferente conforme o local, o que constitui requisito de desenho e não contratempo. Deve integrar o documento de requisitos técnicos já identificado como necessário.

### 5.4 Resultado

```powershell
Get-Item .\wmts_gibs_3857.xml | Select-Object Name, Length
```

```
wmts_gibs_3857.xml   5797572
```

**5 797 572 bytes.** O ficheiro estava em disco desde a primeira tentativa. Três rondas de troca foram gastas a diagnosticar cabeçalhos vazios em vez de verificar o ficheiro principal — falha de sequência de diagnóstico imputável a Claude.

---

## 6. Conteúdo do `wmts_gibs_3857.xml`

Raiz `Capabilities`, versão 1.0.0, espaços de nomes `wmts/1.0`, `ows/1.1`, `gml`, `xlink`, `xsi`.

**Serviço:** NASA Global Imagery Browse Services for EOSDIS. Resumo declarado: imagem em tempo quase real de múltiplos instrumentos da NASA.

### 6.1 Métricas

| Métrica | Valor |
|---|---|
| Dimensão | 5 797 572 bytes |
| Nós XML | 62 034 |
| Tempo de análise (lxml, servidor) | 0,19 s |
| Camadas | 1 315 |
| Conjuntos de matrizes definidos | 7 |
| Elementos `ResourceURL` | 10 010 |
| Camadas com dimensão temporal | 1 210 de 1 315 (92 %) |

### 6.2 Conjuntos de matrizes

Todos em `urn:ogc:def:crs:EPSG:6.18:3:3857`, todos com `WellKnownScaleSet` igual a `urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible`.

| Conjunto | Matrizes | Zoom máximo | Resolução no nível mais fino | Camadas |
|---|---|---|---|---|
| GoogleMapsCompatible_Level3 | 4 | 3 | ~19 km/px | 0 |
| GoogleMapsCompatible_Level6 | 7 | 6 | ~2,4 km/px | 821 |
| GoogleMapsCompatible_Level7 | 8 | 7 | ~1,2 km/px | 302 |
| GoogleMapsCompatible_Level8 | 9 | 8 | ~611 m/px | 101 |
| GoogleMapsCompatible_Level9 | 10 | 9 | ~305 m/px | 64 |
| GoogleMapsCompatible_Level12 | 13 | 12 | ~38 m/px | 22 |
| GoogleMapsCompatible_Level13 | 14 | 13 | ~19 m/px | 5 |

Nível 0 com `ScaleDenominator` 559 082 264,0287178 e `TopLeftCorner` (-20037508,34278925 ; 20037508,34278925). Mosaicos de 256×256 em todos os níveis.

Camadas em Level12: modelos de elevação (`ASTER_GDEM_Color_Index`, `SRTM_Color_Index`, `ASTER_GDEM_Color_Shaded_Relief`, `ASTER_GDEM_Greyscale_Shaded_Relief`) e produtos OPERA. Em Level13: `Coastlines_15m`, `Graticule_15m`, `Reference_Features_15m`, `Reference_Labels_15m`, `NISAR_L2_Geocoded_Polarimetric_Covariance`.

### 6.3 Formatos

| Formato | Camadas |
|---|---|
| `image/png` | 1 133 |
| `application/vnd.mapbox-vector-tile` | 118 |
| `image/jpeg` | 64 |

### 6.4 Camadas de interesse operacional

**Anomalias térmicas — 18 camadas, todas em `GoogleMapsCompatible_Level8`:**

```
VIIRS_NOAA20_Thermal_Anomalies_375m_All / _Day / _Night
VIIRS_NOAA21_Thermal_Anomalies_375m_All / _Day / _Night
VIIRS_SNPP_Thermal_Anomalies_375m_All   / _Day / _Night
MODIS_Aqua_Thermal_Anomalies_All        / _Day / _Night
MODIS_Terra_Thermal_Anomalies_All       / _Day / _Night
MODIS_Combined_Thermal_Anomalies_All    / _Day / _Night
```

As MODIS estão em `GoogleMapsCompatible_Level7`.

**Cor verdadeira diária — em `GoogleMapsCompatible_Level9`:**

```
VIIRS_NOAA20_CorrectedReflectance_TrueColor
VIIRS_NOAA21_CorrectedReflectance_TrueColor
VIIRS_SNPP_CorrectedReflectance_TrueColor
VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule
VIIRS_SNPP_CorrectedReflectance_TrueColor_Granule
MODIS_Aqua_CorrectedReflectance_TrueColor
MODIS_Terra_CorrectedReflectance_TrueColor
```

---

## 7. Confronto com o código da Estação PEA (r0066)

Traçado à mão contra o documento capturado. **Não foi executado** — verificação por leitura de código, não por execução.

| Etapa | Resultado |
|---|---|
| Raiz `Capabilities` | passa |
| Travessia por `localName` com prefixos `ows`/`wmts` | passa |
| `wmtsCRS("urn:ogc:def:crs:EPSG:6.18:3:3857")` | devolve `EPSG:3857` — a expressão `(?:^\|[:/])(\d{4,6})$` apanha o último segmento |
| Teste de Mercator por código CRS | passa |
| Teste de Mercator por `WellKnownScaleSet` | passa — `GoogleMapsCompatible` presente |
| Verificação de origem contra `WMTS_TOPO_3857` | passa — (-20037508,34278925 ; 20037508,34278925) |
| Verificação de `TileWidth` 256 | passa |
| `ResourceURL` para modo RESTful | disponível, 10 010 elementos |

**Conclusão: o GIBS é a primeira fonte externa que funciona de ponta a ponta com o r0066 sem qualquer alteração de código.**

---

## 8. Limitações identificadas

### 8.1 Zoom máximo 8 nas anomalias térmicas

As dezoito camadas de anomalias térmicas estão em `GoogleMapsCompatible_Level8`, o que limita a aproximação a cerca de **611 metros por pixel**. Não é possível aproximar mais — as matrizes terminam aí.

É opção honesta da NASA: o sensor VIIRS tem 375 m de resolução nativa e publicar níveis mais finos seria interpolação. Mas para vista de sector num incêndio activo é grosseiro ao ponto de ter valor táctico reduzido.

**Consequência:** confirma a conclusão da secção 4. A via correcta para focos de calor é a API de pontos do FIRMS, não o mosaico do GIBS. O GIBS serve para **contexto de escala regional** — determinar num relance se a ocorrência no Douro é isolada ou parte de uma situação peninsular. A 611 m/px isso lê-se bem, e nenhuma fonte nacional o fornece.

**Requisito derivado:** o motor de mapa tem de limitar o nível de aproximação por camada, com base no número de matrizes do conjunto associado, e informar o operador quando a camada deixa de estar disponível por excesso de aproximação. Não pode simplesmente desaparecer nem ser esticada.

### 8.2 Dimensões temporais em 92 % das camadas

Exemplo, `VIIRS_NOAA20_Thermal_Anomalies_375m_All`:

```xml
<Dimension>
  <ows:Identifier>Time</ows:Identifier>
  <ows:UOM>ISO8601</ows:UOM>
  <Default>2026-08-31</Default>
  <Current>false</Current>
  <Value>2020-01-01/2020-03-17/P1D</Value>
  <Value>2020-03-19/2023-02-24/P1D</Value>
  <Value>2023-02-26/2023-07-08/P1D</Value>
  <Value>2023-07-10/2024-03-19/P1D</Value>
  <Value>2024-03-25/2025-07-06/P1D</Value>
  <Value>2025-07-08/2025-08-07/P1D</Value>
  <Value>2025-08-09/2025-09-04/P1D</Value>
  <Value>2025-09-06/2025-12-21/P1D</Value>
  <Value>2025-12-23/2026-08-31/P1D</Value>
</Dimension>
```

O interpretador do r0066 **não lê `Dimension`**. Neste caso concreto o comportamento é benigno: o `Default` é a data da captura, porque o GIBS actualiza o valor por omissão para a última data disponível. Pedir sem `TIME` devolve o mais recente.

**Isto é sorte, não desenho.** Basta uma camada com `Default` fixo numa data antiga para o operador ver dados desactualizados sem qualquer sinal.

Observe-se ainda que os intervalos declarados **têm buracos**: entre `2024-03-19` e `2024-03-25`, entre `2025-07-06` e `2025-07-08`, e outros. São dias sem dados. Um mapa que não distingue "não há detecções" de "não há dados nesse dia" induz em erro por omissão.

**Requisito:** ler `Dimension`; apresentar ao operador a data efectiva da imagem; distinguir explicitamente ausência de dados de ausência de fogo.

### 8.3 Volume

1 315 camadas e 62 034 nós. O `lxml` num servidor analisou em 0,19 s; o `DOMParser` de um browser num portátil de posto de comando será várias vezes mais lento, e acresce a construção de 1 315 objectos de camada.

**Requisito:** medir o tempo real de análise no ambiente-alvo. Se exceder um segundo, filtrar por lista branca **durante** a travessia em vez de construir o catálogo completo e seleccionar depois.

**Requisito reforçado:** a enumeração de camadas está definitivamente excluída como padrão de interface. Com 1 315 entradas, é inutilizável num posto de comando.

---

## 9. Requisitos acrescentados nesta parte da sessão

Numeração em continuidade com a secção 17 do relatório anterior.

15. Limitar o nível de aproximação por camada com base no número de matrizes do conjunto associado, e informar o operador quando a camada deixa de ser servível por excesso de aproximação.
16. Ler `Dimension`, apresentar a data efectiva ao operador e distinguir ausência de dados de ausência de fenómeno.
17. Medir o tempo de análise no ambiente-alvo; acima de um segundo, filtrar durante a travessia.
18. Suportar `SupportedCRS` em formato URN longo (`urn:ogc:def:crs:EPSG:6.18:3:3857`) — já satisfeito pelo r0066.
19. Validar a acessibilidade de cada fonte externa a partir da rede do CSREPC Douro **e** da Starlink do VCOC, antes de a inscrever no desenho.

---

## 10. Recomendação

**Curto prazo.** GIBS por WMTS, como camada de contexto regional. Funciona hoje com o código existente e resolve a maior lacuna real: a aplicação não tem hoje forma de mostrar fogo activo que não seja marcação manual.

**Médio prazo.** FIRMS por API de pontos. Sobrevive a qualquer decisão sobre sistema de coordenadas, não tem limite de aproximação, e transporta atributos por foco que o mosaico não transporta.

**Longo prazo.** Copernicus Data Space Ecosystem, quando existir servidor no VCOC e a gestão de credenciais deixar de ser obstáculo. Sentinel-2 a 10 m é outro patamar.

**Não recomendado.** EFFIS como fonte táctica; GISCO em qualquer circunstância.

---

## 11. Erros cometidos por Claude nesta parte da sessão

Registados por integridade do processo, em continuidade com a secção 19 do relatório anterior.

6. **Diagnóstico de bloqueio de rede a partir de ficheiro de cabeçalhos vazio.** Um `-D` vazio não é prova de falha de ligação. O `exit code 0` demonstrou o contrário. Conclusão não sustentada pela evidência.
7. **Sequência de diagnóstico invertida.** Três rondas gastas a investigar cabeçalhos enquanto o ficheiro principal, com 5,8 MB, estava em disco desde a primeira tentativa. A primeira pergunta devia ter sido o tamanho do ficheiro de saída, não o conteúdo dos cabeçalhos.
8. **Previsão de dimensão errada.** Claude previu "alguns megabytes" e acertou por acidente; antes disso previra que o EFFIS seria "um monstro" quando o `icnf_bdg`, com 365 KB, veio a ser três vezes e meia maior que o EFFIS em 1.3.0.

O erro 7 é o material desta parte. Custou três rondas e é do mesmo tipo do erro 3 do relatório anterior: agir sobre uma hipótese antes de verificar o facto elementar que a confirmaria ou refutaria.

---

## 12. Ficheiro entregue

`CSREPCDouro_fixture_gibs_CLD.zip`, contendo `wmts_gibs_3857.xml` (5 797 572 bytes).

**Uso recomendado:** fixture de teste de esforço para o interpretador WMTS. Cobre, num único documento:

- Volume elevado — 5,8 MB, 62 034 nós, 1 315 camadas
- `SupportedCRS` em formato URN longo com versão de autoridade
- `WellKnownScaleSet` presente
- Sete conjuntos de matrizes distintos com número de níveis diferente
- Dimensões temporais em 92 % das camadas, com intervalos descontínuos
- Três formatos de saída, incluindo mosaico vectorial
- `ResourceURL` para modo RESTful, 10 010 elementos
- Estilo com `isDefault="true"` explícito
- Metadados `ows:Metadata` múltiplos por camada com papéis distintos

Se o interpretador aguentar este documento e a interface não bloquear a construir 1 315 objectos, fica validado para tudo o resto que foi capturado nesta sessão.
