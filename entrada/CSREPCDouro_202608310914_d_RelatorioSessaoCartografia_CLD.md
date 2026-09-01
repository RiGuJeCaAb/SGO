# Relatório integral da sessão — captura e análise de GetCapabilities

**Documento:** `CSREPCDouro_202608310914_d_RelatorioSessaoCartografia_CLD.md`
**Data da sessão:** 31 de agosto de 2026
**Intervenientes:** C. Abreu (CSREPC Douro), Claude
**Objecto:** obtenção de documentos `GetCapabilities` reais para validação do interpretador cartográfico da Estação PEA, e análise dos mesmos
**Estado final:** capturas concluídas; interpretador identificado como WMTS; decisão de arquitectura pendente

Este relatório regista tudo o que foi tentado, incluindo o que falhou e os erros cometidos por Claude. Não omite nem suaviza.

---

## 0. Ponto de partida

O pedido inicial de C. Abreu citava uma necessidade formulada anteriormente:

> *"O XML de um `GetCapabilities` verdadeiro da DGT no repositório. Testei contra um documento que escrevi segundo a norma; a norma é uma coisa, o que cada serviço realmente publica é outra. Com o documento real, ou funciona à primeira ou digo-te exatamente o que lhe falta."*

A pergunta concreta era: **como fazer isto.**

Claude assumiu, a partir daqui, que o protocolo em causa era **WMS**. Esta suposição não foi verificada contra o código da aplicação e **estava errada**. Ver secção 8.

---

## 1. Identificação de endereços (pesquisa web)

Claude pesquisou a documentação da DGT e identificou os seguintes serviços:

| Tema | URL base | Anfitrião |
|---|---|---|
| Altimetria 1:50 000 | `https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms` | geo2 |
| CAOP2025 Continente | `https://geo2.dgterritorio.gov.pt/geoserver/caop_continente/wms` | geo2 |
| COS2018v2 | `https://geo2.dgterritorio.gov.pt/geoserver/COS2018/wms` | geo2 |
| Mapa Agrícola e Florestal | `https://geo2.dgterritorio.gov.pt/geoserver/maf/wms` | geo2 |
| OrtoSat2023 (30 cm) | `https://ortos.dgterritorio.gov.pt/wms/ortosat2023` | ortos |
| Ortos 2018 | `https://cartografia.dgterritorio.gov.pt/ortos2018/service` | cartografia |

Registou-se também a existência da plataforma OGC API da DGT em `https://ogcapi.dgterritorio.gov.pt/`, com CAOP, CRUS, Cadastro Predial, COS e OrtoSat2023.

Claude obteve, através da sua própria ferramenta de recolha web, um exemplar do GetCapabilities WMS 1.3.0 da altimetria e entregou-o como ficheiro de arranque:

- `CSREPCDouro_202608310816_GetCapabilities_DGT_altimetria_wms130_CLD.xml`

Com ressalva explícita de que a cópia passara por um conversor e devia ser confirmada por captura directa.

---

## 2. Entregáveis de captura produzidos

| Ficheiro | Natureza | Resultado |
|---|---|---|
| `CSREPCDouro_202608310816_capturar_getcapabilities_dgt_CLD.sh` | script bash | não utilizado (ambiente Windows) |
| `CSREPCDouro_202608310816_capturar_getcapabilities_dgt_CLD.ps1` | script PowerShell | não utilizado; C. Abreu optou por execução passo a passo |
| `CSREPCDouro_202608310816_GetCapabilities_DGT_altimetria_wms130_CLD.xml` | fixture de arranque | entregue |
| `CSREPCDouro_202608310900_d_AnaliseGetCapabilitiesDGT_CLD.md` | documento de análise (12 capturas WMS) | entregue |

---

## 3. Primeira tentativa de captura — falhou por erro de instrução

C. Abreu executou:

```
curl.exe -L --compressed -D headers.txt -o dgt_altimetria_wms130.xml `
  "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.3.0"

curl.exe -L --compressed -D headers.txt -o dgt_altimetria_wms130.xml `
  "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.1.1"
```

Ambos os comandos escreveram para o **mesmo ficheiro de saída**. O segundo esmagou o primeiro. O ficheiro chamado `wms130` continha o documento 1.1.1, e o `headers.txt` idem.

**Causa:** Claude forneceu um comando de exemplo sem avisar que o nome de saída teria de mudar em cada execução. Erro de instrução, não do operador.

**Correcção:** nomes distintos por versão (`headers111.txt`/`dgt_altimetria_wms111.xml`, `headers130.txt`/`dgt_altimetria_wms130.xml`). C. Abreu reexecutou correctamente.

Observação lateral: o documento 1.3.0 foi capturado três vezes, sempre com 2438 bytes transferidos. Resposta determinística, sem conteúdo variável entre pedidos — adequada a fixture.

---

## 4. Organização e verificação

C. Abreu criou pasta de trabalho dedicada:

```
cd \
md estacao_pea
cd estacao_pea
```

Verificação de raízes XML executada com sucesso:

```
dgt_altimetria_wms111.xml    11514 bytes  raiz=<WMT_MS_Capabilities>
dgt_altimetria_wms130.xml    10822 bytes  raiz=<WMS_Capabilities>
```

Três confirmações imediatas:

1. O servidor **respeita a negociação de versão** — raízes diferentes conforme o parâmetro pedido. Nem todos os servidores o fazem.
2. O `--compressed` funcionou: 2438 bytes na rede, 10822 em disco.
3. O documento 1.1.1 é **maior** que o 1.3.0 apesar de ter menos funcionalidades, por causa do `<!DOCTYPE ... [ ... ]>` com subconjunto DTD embutido.

---

## 5. Verificação de cabeçalhos HTTP — previsão de Claude desmentida

```
Get-Content .\headers130.txt | Select-String 'HTTP/|content-type|access-control'
```

Resultado:

```
HTTP/1.1 200
Content-Type: text/xml
Access-Control-Allow-Origin: *
```

**Claude previra que o cabeçalho CORS estaria ausente. Estava presente, com wildcard.** A previsão foi desmentida pela evidência.

Verificação nos outros dois anfitriões:

```
headers_ortosat2023_130.txt:
  HTTP/1.1 200 OK
  Access-Control-Allow-Origin: *
  Content-Type: text/xml; charset=UTF-8

headers_ortos2018_130.txt:
  HTTP/1.1 200 OK
  Access-Control-Allow-Origin: *
  Content-type: text/xml; charset=utf-8
  Access-control-allow-origin: *
```

O `cartografia.dgterritorio.gov.pt` devolve o cabeçalho CORS **duas vezes**, com capitalização diferente. Legal em HTTP (nomes de cabeçalho são insensíveis à caixa), mas há clientes que rejeitam cabeçalhos CORS duplicados. Indício de proxy a acrescentar por cima do que a aplicação já emite.

**Consequência:** um `fetch()` a partir de origem `file://` (que envia `Origin: null`) é permitido. A obtenção em tempo de execução é tecnicamente viável. Mantém-se contudo a recomendação de empacotar as capacidades, por causa da operação sem rede no teatro de operações.

---

## 6. Captura completa — seis serviços WMS, duas versões

Bloco executado:

```powershell
$alvos = [ordered]@{
  'caop_continente' = 'https://geo2.dgterritorio.gov.pt/geoserver/caop_continente/wms'
  'cos2018'         = 'https://geo2.dgterritorio.gov.pt/geoserver/COS2018/wms'
  'maf'             = 'https://geo2.dgterritorio.gov.pt/geoserver/maf/wms'
  'ortosat2023'     = 'https://ortos.dgterritorio.gov.pt/wms/ortosat2023'
  'ortos2018'       = 'https://cartografia.dgterritorio.gov.pt/ortos2018/service'
}
```

Resultados (bytes em disco):

| Serviço | 1.3.0 | 1.1.1 |
|---|---|---|
| altimetria | 10 822 | 11 514 |
| caop_continente | 21 964 | 22 490 |
| cos2018 | 6 554 | 8 961 |
| maf | 7 202 | 10 069 |
| ortosat2023 | 10 541 | 9 520 |
| ortos2018 | 3 383 | 2 805 |

Verificação de raízes: **12 em 12 correctas**, zero excepções OGC. `WMS_Capabilities` em todos os 1.3.0, `WMT_MS_Capabilities` em todos os 1.1.1.

Pacote entregue: `CSREPCDouro_fixtures_dgt_CLD.zip`.

---

## 7. Análise das 12 capturas WMS

### 7.1 Três implementações de servidor, não uma

| Anfitrião | Software identificado | Serviços |
|---|---|---|
| `geo2.dgterritorio.gov.pt` | GeoServer | altimetria, caop_continente, COS2018, maf |
| `ortos.dgterritorio.gov.pt` | MapServer 7.7.0-dev (MS4W 4.0.5) | ortosat2023 |
| `cartografia.dgterritorio.gov.pt` | MapProxy | ortos2018 |

O MapServer publica a versão exacta e a lista de módulos compilados num comentário XML dentro do próprio GetCapabilities. Exposição desnecessária, não imputável à Estação PEA.

### 7.2 Achados bloqueantes

**A COS2018 não publica camadas requisitáveis em WMS 1.3.0.** O documento `dgt_cos2018_wms130.xml` contém exactamente um `<Name>`, e é `WMS` (nome do serviço). A camada raiz não tem nome e não tem filhos. Em 1.1.1 publica `serie1_COS`. Para a Carta de Uso e Ocupação do Solo é obrigatório usar 1.1.1, ou migrar para a OGC API.

**A camada `serie1_COS` aparece em serviços onde não pertence.** Em 1.1.1 surge dentro de `altimetria`, `caop_continente` e `maf`. Em 1.3.0 desaparece de todos. Configuração incorrecta do lado da DGT.

**O endereço de GetMap não é o endereço interrogado.** GeoServer 1.1.1 declara `/altimetria/wms?SERVICE=WMS&`; GeoServer 1.3.0 declara `/altimetria/ows?SERVICE=WMS&`. Muda o segmento de caminho e ambos terminam com `&` pendente após query string existente. Concatenar `?REQUEST=GetMap` produz URL inválido nos quatro serviços GeoServer.

**Conteúdo misto no ortos2018.** Capacidades servidas por HTTPS, endereço de operação declarado em `http://cartografia.dgterritorio.gov.pt/ortos2018/service?`.

### 7.3 Achados que partem interpretadores ingénuos

**Tipo MIME malformado.** `ortos2018`, ambas as versões: `<Format>image/jpg'</Format>` — aspa simples parasita. Acresce que `image/jpg` não é o tipo MIME correcto (é `image/jpeg`).

**Duplicação de formatos em GeoServer 1.1.1.** 48 formatos em 1.1.1 contra 24 em 1.3.0. A diferença são duplicados com o `+` descodificado como espaço: `application/atom xml` ao lado de `application/atom+xml`, `application/rss xml`, `application/vnd.google-earth.kml xml`. Metade da lista é inválida.

**Notação científica em campo numérico.** `dgt_ortosat2023_wms130.xml`: `<MaxScaleDenominator>5e+08</MaxScaleDenominator>`. `parseInt("5e+08")` devolve 5. Uma camada visível entre 1:500 e 1:500 000 000 passaria a nunca aparecer, sem erro visível.

**Dois modelos de escala incompatíveis.** O mesmo serviço em 1.1.1 declara `<ScaleHint min="0.249451424214819" max="249451.424214819" />` — atributos, não texto, e grandeza diferente (diagonal do pixel em unidades do mapa, não denominador de escala).

**A camada raiz tem nome em duas das três implementações.**

| Serviço | Raiz tem `<Name>`? |
|---|---|
| GeoServer (4 serviços) | Não |
| MapServer (ortosat2023) | Sim — `OrtoSat2023` |
| MapProxy (ortos2018) | Sim — `DGT_Ortos2018` |

A regra correcta é: requisitável se e só se tem `<Name>`, independentemente da profundidade.

**Herança de CRS obrigatória.** A camada `Ortos2018-RGB` declara zero `<CRS>` próprios e herda do pai. As camadas GeoServer declaram apenas `EPSG:3763` e `CRS:84` mas herdam `EPSG:4326`, `EPSG:4258` e `EPSG:3857`.

**Nem todos declaram EPSG:4326 ou CRS:84.** `ortos2018` declara apenas `EPSG:3763` e `EPSG:3857`, e contraditoriamente publica `<BoundingBox CRS="CRS:84" ...>` num CRS que não lista como suportado.

**DOCTYPE com referência externa em todas as capturas 1.1.1.** `<!DOCTYPE WMT_MS_Capabilities SYSTEM "http://schemas.opengis.net/wms/1.1.1/WMS_MS_Capabilities.dtd" [ ... ]>`. Superfície de XXE e risco de bloqueio por tentativa de acesso à rede em interpretadores estritos.

**Diferenças de vocabulário entre versões:**

| Aspecto | 1.1.1 | 1.3.0 |
|---|---|---|
| Raiz | `WMT_MS_Capabilities` | `WMS_Capabilities` |
| Espaço de nomes | nenhum | `http://www.opengis.net/wms` |
| `<Service><Name>` | `OGC:WMS` | `WMS` |
| Sistema de referência | `<SRS>` | `<CRS>` |
| Caixa geográfica | `<LatLonBoundingBox>` | `<EX_GeographicBoundingBox>` |
| Atributo de caixa | `SRS=` | `CRS=` |

O atributo `queryable` está ausente no MapProxy, é `"0"` no MapServer e `"1"` no GeoServer.

---

## 8. Questão levantada por C. Abreu: mudar de fonte?

C. Abreu perguntou se outra fonte que não a DGT daria melhores resultados.

**Resposta de Claude:** não, e por três razões.

1. **Técnica.** `si.icnf.pt` corre GeoServer — a mesma família de defeitos do `geo2`. O EFFIS corre MapServer — a mesma família do OrtoSat. Trocar não elimina a necessidade de um interpretador defensivo; muda apenas o conjunto de defeitos.
2. **Doutrinária.** A CAOP **é** o limite administrativo oficial. Uma afirmação sobre freguesia inscrita num documento produzido ao abrigo do Despacho n.º 4067/2024 tem de assentar na fonte com autoridade legal. O mesmo se aplica ao ICNF quanto a áreas ardidas, nos termos do DL n.º 124/2006 na redação do DL n.º 17/2009.
3. **De cobertura.** A DGT não publica metade do que um PCO precisa. A resposta certa não é substituir; é somar.

Foi identificado um único défice real e não resolúvel por software: a **Carta Militar 1:25 000 (série M888) do CIGeoE não tem serviço aberto** e exige protocolo institucional. É a cartografia que os operacionais de terreno lêem sem hesitar. Recomendou-se iniciar diligência institucional, por ser processo de tramitação longa.

---

## 9. Segunda captura — ICNF e EFFIS

Bloco executado:

```powershell
$extra = [ordered]@{
  'icnf_areas_ardidas' = 'https://si.icnf.pt/wms/areas_ardidas'
  'icnf_bdg'           = 'https://si.icnf.pt/wms/bdg'
  'effis'              = 'https://maps.effis.emergency.copernicus.eu/effis'
}
```

Resultados:

| Serviço | 1.3.0 | 1.1.1 |
|---|---|---|
| icnf_areas_ardidas | 42 474 | 34 457 |
| icnf_bdg | 365 579 | 254 752 |
| effis | 104 545 | 98 635 |

Verificação de raízes e contagem de nomes:

```
dgt_effis_wms111.xml                98635 bytes  raiz=<WMT_MS_Capabilities>  nomes=130
dgt_effis_wms130.xml               104545 bytes  raiz=<WMS_Capabilities>     nomes=130
dgt_icnf_areas_ardidas_wms111.xml   34457 bytes  raiz=<WMT_MS_Capabilities>  nomes=42
dgt_icnf_areas_ardidas_wms130.xml   42474 bytes  raiz=<WMS_Capabilities>     nomes=42
dgt_icnf_bdg_wms111.xml            254752 bytes  raiz=<WMT_MS_Capabilities>  nomes=373
dgt_icnf_bdg_wms130.xml            365579 bytes  raiz=<WMS_Capabilities>     nomes=385
```

Seis em seis correctas, zero excepções. Pacote entregue: `CSREPCDouro_fixtures_v2_CLD.zip` (18 XML, 18 cabeçalhos).

---

## 10. Análise das capturas ICNF e EFFIS

### 10.1 As camadas ausentes do ICNF

Análise por travessia de árvore (não por contagem de `<Name>`, que inclui nomes de estilo):

- `icnf_bdg` 1.3.0: **202** camadas nomeadas
- `icnf_bdg` 1.1.1: **196** camadas nomeadas
- Profundidade máxima: 2 níveis em ambas

Diferença — presentes **só em 1.3.0**:

```
perigosidade_conjuntural_2021
perigosidade_conjuntural_2022
perigosidade_conjuntural_2023
perigosidade_conjuntural_2024
perigosidade_conjuntural_2025
perigosidade_conjuntural_2026
```

Presentes só em 1.1.1: **nenhuma**.

Em 1.1.1 o ICNF publica apenas `perigosidade_estrutural_2020_2030` (plano decenal), não a leitura conjuntural do ano.

**Contradição estrutural resultante:**

- A **COS2018** da DGT só é requisitável em **WMS 1.1.1**.
- A **perigosidade conjuntural 2026** do ICNF só é requisitável em **WMS 1.3.0**.

Não existe versão única de protocolo que sirva a Estação PEA. A versão tem de ser fixada **por camada**, não por serviço nem por aplicação.

### 10.2 Outros achados do ICNF

- **Nome duplicado:** `habitats_zec_norte` aparece duas vezes no mesmo documento. Qualquer estrutura indexada por `Name` perde silenciosamente uma ocorrência.
- **Prefixação inconsistente:** `areas_ardidas` e `perigosidade_conjuntural_2026` sem prefixo; `BDG:ardida_2025`, `BDG:tpgi_2023`, `BDG:perigosidade_incendio` com prefixo de workspace, no mesmo serviço. Não há regra dedutível.
- **`LegendURL` errada:** a camada `perigosidade_conjuntural_2026` aponta a legenda para `layer=perigosidade_conjuntural_2025`.
- **Endereços internos em HTTP:** `http://si.icnf.pt/geoserverplinia/BDG/ows?...`.

Camadas relevantes identificadas em `icnf_bdg` 1.3.0: 7 de perigosidade, 21 de área ardida, 4 de TPGI, `locais_criticos_incendio`, `zif`, `rede_primaria`.

### 10.3 EFFIS

- **67** camadas nomeadas em 1.3.0, das quais **21** com dimensão temporal.
- CRS declarados: `EPSG:3034`, `EPSG:3035`, `EPSG:3857`, `EPSG:4326`, `EPSG:900913`, e ainda `epsg:3035` e `epsg:4326` **em minúsculas**. Os códigos CRS são sensíveis à caixa na norma. `EPSG:900913` é pseudo-código obsoleto do Google Mercator.
- **`EPSG:3763` ausente.**
- Índice FWI disponível como `mf010.fwi` — Météo-France a 0,1°, cerca de 11 km. Resolução comparável à do GDPS/SpotWX já considerada inadequada para o vale do Douro.

**Dimensões temporais declaradas de forma incompatível entre versões:**

1.3.0 — valor no próprio elemento:
```xml
<Dimension name="time" units="ISO8601" default="2019-01-01" nearestValue="0">2018-01-01/2099-12-31</Dimension>
```

1.1.1 — `<Dimension>` vazio, valor em `<Extent>` separado:
```xml
<Dimension name="time" units="ISO8601"/>
<Extent name="time" default="2019-01-01" nearestValue="0">2018-01-01/2099-12-31</Extent>
```

Um interpretador que leia apenas `<Dimension>` obtém string vazia em 1.1.1, conclui que não há eixo temporal, envia GetMap sem `TIME` e recebe o valor por omissão — que em várias camadas é 2019 ou 2020.

**Este é o defeito operacionalmente mais perigoso de todos os identificados.** Os restantes produzem erro ou imagem em branco. Este produz um mapa plausível e errado: focos de calor de há seis anos apresentados como situação corrente.

### 10.4 Lista branca recomendada para o Douro (formulada antes de se conhecer o protocolo real)

| Camada | Serviço | Versão | Justificação |
|---|---|---|---|
| `Ortos2018-RGB` ou `ortoSat2023-CorVerdadeira` | DGT | 1.3.0 | base visual |
| `Curva_de_nivel` | DGT altimetria | 1.3.0 | leitura de relevo |
| `cont_freguesias`, `cont_municipios` | DGT CAOP | 1.3.0 | referência administrativa oficial |
| `serie1_COS` | DGT COS2018 | **1.1.1** | combustível por ocupação do solo |
| `perigosidade_conjuntural_2026` | ICNF bdg | **1.3.0** | leitura do ano corrente |
| `BDG:ardida_2025`, `BDG:ardida_2024`, `BDG:ardida_2023` | ICNF | 1.3.0 | descontinuidades de combustível recentes |
| `locais_criticos_incendio` | ICNF bdg | 1.3.0 | pontos críticos conhecidos |
| `rede_primaria` | ICNF bdg | 1.3.0 | faixas de gestão de combustível |
| `tpgi` | ICNF bdg | 1.3.0 | territórios com potencial para grandes incêndios |

Nove camadas de 385 disponíveis, todas em `EPSG:3763`, nenhuma com eixo temporal.

EFFIS excluído por CRS e resolução.

---

## 11. Erro de Claude: protocolo errado

C. Abreu enviou o ficheiro da aplicação, `CSREPCDouro_r0066_202608310107_EstacaoPEA_CLD.html` (782 333 bytes, 12 570 linhas).

Inspecção do código revelou que o interpretador cartográfico é de **WMTS 1.0.0**, não de WMS. Linha 6364:

```js
if(!raiz || raiz.localName !== "Capabilities")
  throw new Error("Não é um GetCapabilities de WMTS (raiz «"+(raiz? raiz.localName : "vazia")+"»).");
```

**Consequência:** os 18 fixtures WMS têm raiz `WMS_Capabilities` ou `WMT_MS_Capabilities`. Todos, sem excepção, seguem a via de excepção. A análise das secções 7 e 10 é correcta e **não se aplica a este módulo**.

**Causa do erro:** Claude assumiu WMS a partir do resultado da pesquisa web e não verificou contra o código da aplicação antes de dirigir sete rondas de captura. Trata-se exactamente do modo de falha por presunção de informação não documentada que está identificado como recorrente neste projecto.

**O que se salva das 18 capturas:**
- Validam a via de excepção do interpretador com documentos reais.
- Continuam válidas caso se venha a adoptar WMS como via alternativa ou complementar (ver secção 13).
- A tabela de CRS por fonte, construída a partir delas, é o elemento decisivo da secção 14.

---

## 12. Terceira captura — WMTS

### 12.1 Primeira tentativa: falhou por erro de Claude

O bloco PowerShell fornecido continha dois defeitos:

1. `Get-Item "wmts_${k}_.xml"` — traço-baixo a mais no nome, pelo que todas as leituras de tamanho devolveram 0 bytes.
2. A variável `$t` não era reinicializada, pelo que quando o `curl` não criava ficheiro o PowerShell reutilizava o conteúdo da iteração anterior. As colunas `raiz` e `matrizes` das linhas 2 e 3 do resultado eram ecos da linha 1.

Resultado ilegível, com excepções `PathNotFound` e `ArgumentNullException`. Apenas se salvou a informação de que o `ortos2018` respondeu com raiz `Capabilities`.

### 12.2 Segunda tentativa: bem-sucedida

```powershell
$wmts = [ordered]@{
  'dgt_ortos2018'   = 'https://cartografia.dgterritorio.gov.pt/ortos2018/service'
  'dgt_ortos2021'   = 'https://cartografia.dgterritorio.gov.pt/wms/ortos2021'
  'dgt_ortosat2023' = 'https://ortos.dgterritorio.gov.pt/wms/ortosat2023'
  'icnf_gwc'        = 'https://si.icnf.pt/geoserverplinia/gwc/service/wmts'
}
```

Resultado:

```
dgt_ortos2018      HTTP 200    10387 bytes  raiz=Capabilities  TileMatrixSet=2
dgt_ortos2021      HTTP 200      690 bytes  raiz=OUTRA         TileMatrixSet=0
dgt_ortosat2023    HTTP 200      646 bytes  raiz=OUTRA         TileMatrixSet=0
icnf_gwc           HTTP 200      509 bytes  raiz=EXCECAO       TileMatrixSet=0
```

**Um único WMTS em toda a lista.**

Conteúdo das respostas falhadas — todas com HTTP 200:

`wmts_dgt_ortos2021.xml` (HTML, não XML):
```
<HTML><HEAD><TITLE>MapServer Message</TITLE></HEAD>
<!-- MapServer version 7.6.0-dev (MS4W 4.0.1) ... -->
<BODY BGCOLOR="#FFFFFF">
mapserv(): Web application error. Traditional BROWSE mode requires a TEMPLATE in the WEB section, but none was provided.
</BODY></HTML>
```

`wmts_dgt_ortosat2023.xml` (HTML, precedido de cabeçalhos literais no corpo):
```
Content-Type: text/html

<HTML><HEAD><TITLE>MapServer Message</TITLE></HEAD>
<!-- MapServer version 7.7.0-dev (MS4W 4.0.5) ... -->
<BODY BGCOLOR="#FFFFFF">
msReturnPage(): Unable to access file. blank.html
</BODY></HTML>
```

`wmts_icnf_bdg.xml`:
```xml
<ows:ExceptionReport ... version="1.0.0">
  <ows:Exception exceptionCode="InvalidParameterValue" locator="service">
    <ows:ExceptionText>No service: ( WMTS )</ows:ExceptionText>
  </ows:Exception>
</ows:ExceptionReport>
```

`wmts_icnf_gwc.xml`:
```xml
<ows:ExceptionReport ... version="1.0.0">
  <ows:Exception exceptionCode="NoApplicableCode">
    <ows:ExceptionText>No such workspace 'gwc/service'</ows:ExceptionText>
  </ows:Exception>
</ows:ExceptionReport>
```

Nota: dois destes devolvem **HTML com HTTP 200**, não XML. A detecção de raiz por regex de nome de elemento classificou-os como `OUTRA`, não como excepção. A detecção de erro tem de cobrir HTML, `ServiceExceptionReport` e `ows:ExceptionReport`.

Nota adicional: Claude tentou obter o WMTS do ortos2018 pela sua própria ferramenta e recebeu **HTTP 500** em duas tentativas. A captura de C. Abreu obteve HTTP 200. O erro era do lado de Claude, não do serviço.

Pacote entregue: `CSREPCDouro_fixtures_wmts_CLD.zip`.

---

## 13. Conteúdo do WMTS da DGT

`wmts_dgt_ortos2018.xml`, 10 387 bytes, `Capabilities` versão 1.0.0, espaços de nomes `wmts/1.0` e `ows/1.1`.

**Serviço:** "DGT - WMTS dos Ortos 2018". Fornecedor: Direção-Geral do Território.

**Uma camada:**
```xml
<Layer>
  <ows:Title>Ortos2018-RGB</ows:Title>
  <ows:WGS84BoundingBox>
    <ows:LowerCorner>-10.1933914843 36.7232839377</ows:LowerCorner>
    <ows:UpperCorner>-5.95171484738 42.2795978817</ows:UpperCorner>
  </ows:WGS84BoundingBox>
  <ows:Identifier>Ortos2018-RGB</ows:Identifier>
  <Style><ows:Identifier>default</ows:Identifier></Style>
  <Format>image/png</Format>
  <TileMatrixSetLink><TileMatrixSet>PTTM_06</TileMatrixSet></TileMatrixSetLink>
</Layer>
```

**Um conjunto de matrizes:**
```xml
<TileMatrixSet>
  <ows:Identifier>PTTM_06</ows:Identifier>
  <ows:SupportedCRS>EPSG:3763</ows:SupportedCRS>
  <TileMatrix>
    <ows:Identifier>00</ows:Identifier>
    <ScaleDenominator>8579799.10714</ScaleDenominator>
    <TopLeftCorner>-170000.0 290000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
  </TileMatrix>
  ...
```

Vinte níveis, identificadores `00` a `19`. Escala do nível 00: 8 579 799,10714. Escala do nível 19: 16,3646680968. Progressão binária exacta. Origem constante em (-170000,0 ; 290000,0) metros PT-TM06. Mosaicos de 256×256 em todos os níveis. Sem `WellKnownScaleSet`. Sem `ResourceURL`, logo sem modelo RESTful — só KVP.

**Achados menores:**
- `ows:ProviderSite` aponta para `http://cartografia.dgterritorio.gov.pt:8080/ortos2018/service?` — porta interna exposta. O código da Estação PEA coloca este valor no campo `termos` e apresenta-o ao operador como ligação.
- Todos os `xlink:href`, incluindo o endereço de `GetTile`, vêm em `http://`.

---

## 14. Confronto com o código da Estação PEA (r0066)

Traçado à mão, linha a linha. **Não foi executado** — a verificação foi por leitura de código, não por execução.

| Etapa | Resultado |
|---|---|
| `lerCapacidadesWMTS()` — raiz `Capabilities` | passa |
| Travessia por `localName` (prefixos `wmts`/`ows` misturados) | passa |
| Guarda contra `TileMatrixSetLink` sem matrizes | passa — foi antecipada e está comentada no código |
| Identificador, título, formatos, estilo, elo, caixa WGS84 | passa |
| `wmtsCRS("EPSG:3763")` | devolve `EPSG:3763`, correcto |
| Endereço KVP a partir de `Operation name="GetTile"` | passa |
| **`wmtsCompativel()` — teste de Mercator** | **recusa** |

```js
const mercator = conjunto.crs === "EPSG:3857" || conjunto.crs === "EPSG:900913"
  || /GoogleMapsCompatible/i.test(conjunto.escalaConhecida||"");
if(!mercator)
  return nada("está em "+(conjunto.crs||"sistema não declarado")
    + " — o mapa desenha em Web Mercator (EPSG:3857), e reprojetar mosaicos já desenhados não é possível");
```

Mesmo que o teste de CRS passasse, o documento seria recusado três linhas abaixo: a verificação de origem exige `|20037508|` em ambos os eixos, e aqui é (-170000 ; 290000).

**Conclusão:** o interpretador está bem escrito e lê o documento na íntegra e sem erros. O motor de mapa recusa-o a seguir. Não há defeito de programação; há uma decisão de arquitectura tomada por omissão.

O comentário do próprio módulo, escrito antes de existir esta evidência, já continha o diagnóstico:

> *"Muita cartografia oficial portuguesa vem em ETRS89 / PT-TM06 (EPSG:3763). Desenhá-la com a aritmética de Mercator punha tudo no sítio errado, e em silêncio — que é o pior modo de errar num mapa operacional."*

---

## 15. A tabela decisiva

CRS suportados, compilados de todas as 23 capturas:

| Fonte | EPSG:3763 | EPSG:3857 |
|---|:---:|:---:|
| DGT geo2 — altimetria, CAOP, COS, MAF | sim | sim |
| DGT OrtoSat2023 (WMS) | sim | sim |
| DGT Ortos2018 (WMS) | sim | sim |
| DGT Ortos2018 (**WMTS**, `PTTM_06`) | sim | **não** |
| ICNF bdg — perigosidade, TPGI, locais críticos | sim | **não** |
| ICNF áreas ardidas | sim | **não** |
| EFFIS | **não** | sim |

**`EPSG:3763` é o único sistema de referência partilhado por todas as fontes oficiais portuguesas.**

O Web Mercator serve a DGT e não serve o ICNF. Nenhum sistema serve o ICNF e o EFFIS em simultâneo.

A Estação PEA está construída sobre o único sistema que exclui a cartografia de perigosidade de incêndio do ICNF.

---

## 16. Opções em aberto

**Opção A — WMS em EPSG:3857.** O MapProxy do `ortos2018` serve WMS no mesmo endereço e declara `EPSG:3857`; reprojecta do lado do servidor. Custo baixo, nenhuma alteração ao motor de mapa. Resolve a base visual da DGT. **Não resolve o ICNF**, que não publica 3857 em serviço algum. Deixa de fora a perigosidade conjuntural 2026, as áreas ardidas e os locais críticos.

**Opção B — motor de mapa em EPSG:3763, grelha `PTTM_06` nativa.** A aritmética é mais simples que a de Mercator, não mais complexa:

```
resolucao = escalaDenominador × 0.00028          // metros por pixel
x = (E - (-170000)) / (resolucao × 256)
y = (290000 - N) / (resolucao × 256)
```

Sem funções transcendentes, sem singularidade polar, sem distorção de escala com a latitude — a 41°N o Web Mercator inflaciona distâncias em cerca de 32%, o que não é irrelevante para leitura de declives e distâncias operacionais.

O custo real está no resto: tudo o que assume `{z}/{x}/{y}` do OpenStreetMap, as camadas do Overpass, o módulo topográfico, os mosaicos já guardados no dispositivo. Fecha a porta ao EFFIS.

**Opção C — dois motores.** Desaconselhada.

**Decisão pendente de C. Abreu.**

---

## 17. Requisitos consolidados para o interpretador (independentes da opção escolhida)

1. Detectar a versão pelo nome do elemento raiz, não pelo parâmetro pedido nem pelo atributo `version`.
2. Tratar `ServiceExceptionReport`, `ows:ExceptionReport` **e HTML** como erro, mesmo com HTTP 200.
3. Desactivar carregamento de DTD e resolução de entidades externas em qualquer interpretador fora do browser.
4. Travessia por `localName`, nunca por nome qualificado.
5. Requisitabilidade = presença de `<Name>` (WMS) ou `<ows:Identifier>` (WMTS), independentemente da profundidade.
6. CRS efectivo = união dos declarados em toda a cadeia de ascendentes.
7. Endereço de operação lido do `OnlineResource`/`ows:Get` correspondente, fundido por `URLSearchParams`, promovido a HTTPS.
8. Formatos por lista branca da aplicação, não pela lista anunciada.
9. Escalas com `parseFloat`; `ScaleHint` e `ScaleDenominator` tratados como modelos distintos e não convertidos entre si.
10. Dimensões temporais lidas de `<Dimension>` (1.3.0) **e** de `<Extent>` (1.1.1). Camada com eixo temporal não suportado deve ser recusada, nunca servida com o valor por omissão.
11. Catálogo por lista branca explícita de nomes, não por enumeração. O `icnf_bdg` tem 202 camadas; a enumeração é inutilizável em posto de comando.
12. Verificar o CRS-alvo na lista efectiva antes de compor pedidos.
13. Zero camadas requisitáveis é erro reportável, não catálogo vazio silencioso.
14. Versão de protocolo fixada **por camada**, não por serviço nem por aplicação.

---

## 18. Inventário de ficheiros da sessão

**Capturas de C. Abreu (23 documentos XML + cabeçalhos):**

- `CSREPCDouro_fixtures_dgt_CLD.zip` — 12 XML WMS da DGT + 12 cabeçalhos
- `CSREPCDouro_fixtures_v2_CLD.zip` — os anteriores mais 6 XML WMS de ICNF e EFFIS
- `CSREPCDouro_fixtures_wmts_CLD.zip` — 5 XML WMTS (1 válido, 4 respostas de erro) + 5 cabeçalhos

**Entregáveis de Claude:**

- `CSREPCDouro_202608310816_GetCapabilities_DGT_altimetria_wms130_CLD.xml`
- `CSREPCDouro_202608310816_capturar_getcapabilities_dgt_CLD.sh`
- `CSREPCDouro_202608310816_capturar_getcapabilities_dgt_CLD.ps1`
- `CSREPCDouro_202608310900_d_AnaliseGetCapabilitiesDGT_CLD.md`
- `CSREPCDouro_202608310914_d_RelatorioSessaoCartografia_CLD.md` (este documento)

**Recomendação de arquivo:** os XML devem entrar no repositório como imutáveis, com os cabeçalhos HTTP ao lado e um manifesto de proveniência (URL, data, código HTTP, hash). Um fixture editado à mão deixa de constituir prova.

---

## 19. Erros cometidos por Claude nesta sessão

Registados por integridade do processo:

1. **Comando de captura com nome de saída fixo** (secção 3). Provocou perda da primeira captura por sobreposição.
2. **Previsão errada sobre CORS** (secção 5). Previu ausência do cabeçalho; estava presente com wildcard nos três anfitriões.
3. **Protocolo errado** (secção 11). Assumiu WMS sem verificar o código da aplicação, dirigindo sete rondas de captura sobre o protocolo errado. Falha por presunção de informação não documentada.
4. **Bloco PowerShell com dois defeitos** (secção 12.1). Nome de ficheiro com traço-baixo excedente e variável não reinicializada entre iterações.
5. **HTTP 500 atribuído ao serviço** (secção 12.2). O erro era do lado da ferramenta de recolha de Claude; o serviço respondia normalmente.

O erro 3 é o material. Custou sete rondas de captura e produziu uma análise correcta e inaplicável. A regra que o teria evitado é a que já está registada no projecto: confirmar o âmbito antes de construir.
