# Análise de conformidade — GetCapabilities WMS da DGT

**Documento:** `CSREPCDouro_202608310900_d_AnaliseGetCapabilitiesDGT_CLD.md`
**Base de evidência:** 12 capturas WMS (6 serviços × versões 1.1.0/1.3.0), obtidas em 2026-08-31 por C. Abreu, pacote `CSREPCDouro_fixtures_dgt_CLD.zip`
**Finalidade:** definir os requisitos que o interpretador de GetCapabilities da Estação PEA tem de satisfazer para funcionar contra os serviços reais da DGT, e não apenas contra a norma OGC.

---

## 1. Quadro geral

O que se julgava ser "o serviço WMS da DGT" são na realidade **três implementações de servidor distintas**, com comportamentos incompatíveis entre si:

| Anfitrião | Software | Serviços |
|---|---|---|
| `geo2.dgterritorio.gov.pt` | GeoServer | altimetria, caop_continente, COS2018, maf |
| `ortos.dgterritorio.gov.pt` | MapServer 7.7.0-dev (MS4W 4.0.5) | ortosat2023 |
| `cartografia.dgterritorio.gov.pt` | MapProxy | ortos2018 |

Qualquer suposição derivada de um deles é inválida para os outros dois. Esta é a conclusão estruturante do documento.

Nota lateral de segurança: o MapServer publica a sua versão exacta e a lista de módulos compilados num comentário XML dentro do próprio GetCapabilities. Não é problema da Estação PEA, mas é informação que a DGT provavelmente não tenciona expor.

---

## 2. Achados bloqueantes

### 2.1 A COS2018 não tem camadas requisitáveis em WMS 1.3.0

`dgt_cos2018_wms130.xml` contém exactamente **um** elemento `<Name>`, e é o nome do serviço:

```xml
<Name>WMS</Name>
```

A camada raiz não tem `<Name>` (é grupo, logo não requisitável) e não tem filhos. O documento é válido, devolve HTTP 200, tem 6554 bytes de aspeto respeitável — e não permite pedir um único GetMap.

Em 1.1.1 a mesma coisa publica a camada:

```xml
<Name>OGC:WMS</Name>
<Name>serie1_COS</Name>
```

**Requisito:** para a Carta de Uso e Ocupação do Solo, a Estação PEA tem de usar **WMS 1.1.1**, camada `serie1_COS`. Alternativamente, migrar para a OGC API da DGT (`https://ogcapi.dgterritorio.gov.pt/`), que publica a COS como colecção.

**Requisito derivado:** o interpretador tem de tratar "zero camadas requisitáveis" como estado de erro explícito e reportável, não como catálogo vazio silencioso.

### 2.2 A camada `serie1_COS` aparece em serviços onde não pertence

Em 1.1.1, `serie1_COS` surge dentro de `altimetria`, `caop_continente` e `maf` — três workspaces que nada têm a ver com ocupação do solo. Em 1.3.0 desaparece de todos.

Isto é configuração incorrecta do lado da DGT (camada global a fugir para os serviços virtuais por workspace). Para a Estação PEA a consequência é prática:

**Requisito:** não assumir que as camadas listadas num serviço pertencem ao tema desse serviço. O catálogo apresentado ao operador tem de ser construído por lista branca explícita de `Name`, não por enumeração cega do que o servidor devolve. Um operador a ver "serie1_COS" no meio das camadas administrativas da CAOP é ruído operacional inaceitável num posto de comando.

### 2.3 O endereço de GetMap não é o endereço que se interrogou

GeoServer, 1.1.1:
```
https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?SERVICE=WMS&
```
GeoServer, 1.3.0:
```
https://geo2.dgterritorio.gov.pt/geoserver/altimetria/ows?SERVICE=WMS&
```

Muda o **segmento de caminho** (`/wms` → `/ows`) entre versões do mesmo serviço. E ambos terminam com `&` pendente após uma query string já existente.

**Requisito:** o endereço de operação tem de ser lido do `OnlineResource` dentro de `<GetMap><DCPType><HTTP><Get>`, nunca reutilizado do URL do pedido de capacidades. A construção do URL final tem de fazer parse e fusão de parâmetros (`URL` + `URLSearchParams`), nunca concatenação de strings. Concatenar `?REQUEST=GetMap` produz um URL inválido em todos os quatro serviços GeoServer.

### 2.4 Conteúdo misto no ortos2018

As capacidades vêm por HTTPS, mas o endereço de operação declarado é:

```
http://cartografia.dgterritorio.gov.pt/ortos2018/service?
```

Em HTTP simples. Se a Estação PEA vier a ser servida por HTTPS no modelo servidor, o browser bloqueia as imagens por conteúdo misto e o operador vê um mapa em branco sem qualquer mensagem de erro útil.

**Requisito:** promover para `https://` todo o `OnlineResource` recebido em `http://`, e registar a promoção no diagnóstico. Verificar por teste que o anfitrião responde em HTTPS antes de confiar na promoção.

---

## 3. Achados que partem interpretadores ingénuos

### 3.1 Formato de imagem com aspa parasita

`ortos2018`, ambas as versões:

```xml
<Format>image/jpg'</Format>
```

Uma aspa simples colada ao tipo MIME. Erro de configuração da DGT. Um interpretador que ofereça a lista de formatos tal como recebida acaba a enviar `format=image/jpg'` e recebe excepção.

Note-se ainda que `image/jpg` não é sequer o tipo MIME correcto — o correcto é `image/jpeg`.

**Requisito:** os formatos anunciados são sugestões, não contrato. Intersectar sempre com uma lista branca da aplicação: `image/png`, `image/jpeg`. Rejeitar qualquer entrada que não corresponda ao padrão `^[a-z]+/[a-z0-9.+-]+(; *[a-z0-9=-]+)*$`.

### 3.2 O GeoServer duplica formatos em 1.1.1, com o `+` transformado em espaço

`dgt_altimetria_wms111.xml` declara 48 formatos de GetMap; a versão 1.3.0 do mesmo serviço declara 24. A diferença são duplicados corrompidos:

```xml
<Format>application/atom xml</Format>
<Format>application/atom+xml</Format>
<Format>application/rss xml</Format>
<Format>application/rss+xml</Format>
<Format>application/vnd.google-earth.kml xml</Format>
<Format>application/vnd.google-earth.kml+xml</Format>
```

O `+` foi descodificado como espaço (comportamento de `application/x-www-form-urlencoded` aplicado onde não devia). Metade da lista é inválida.

**Requisito:** ver 3.1. A lista branca resolve isto por construção.

### 3.3 Notação científica no denominador de escala

`dgt_ortosat2023_wms130.xml`:

```xml
<MinScaleDenominator>500</MinScaleDenominator>
<MaxScaleDenominator>5e+08</MaxScaleDenominator>
```

`parseInt("5e+08")` devolve **5**. Uma camada visível entre 1:500 e 1:500 000 000 passa a estar visível entre 1:500 e 1:5, ou seja, nunca.

**Requisito:** `parseFloat`, sempre, e validação de que o resultado é finito e positivo. Este é o tipo de defeito que não dá erro, dá apenas uma camada que nunca aparece e um operador a perguntar porquê no meio de uma ocorrência.

### 3.4 ScaleHint e ScaleDenominator não são a mesma grandeza

O mesmo serviço, em 1.1.1:

```xml
<ScaleHint min="0.249451424214819" max="249451.424214819" />
```

`ScaleHint` é a diagonal de um pixel em unidades do mapa. `ScaleDenominator` é o denominador da escala. Não são convertíveis sem conhecer as unidades do CRS e assumir 0,28 mm por pixel. Também são **atributos**, não texto do elemento — um interpretador que leia `textContent` obtém string vazia.

**Requisito:** tratar os dois modelos separadamente. Se apenas houver `ScaleHint`, não fabricar denominadores de escala: desactivar a filtragem por escala para essa camada e assinalá-lo.

### 3.5 A camada raiz tem nome em duas das três implementações

| Serviço | Raiz tem `<Name>`? |
|---|---|
| GeoServer (4 serviços) | Não — grupo não requisitável |
| MapServer (ortosat2023) | Sim — `OrtoSat2023` |
| MapProxy (ortos2018) | Sim — `DGT_Ortos2018` |

A regra "a raiz é sempre grupo" é falsa. A regra correcta, conforme a norma, é: **uma camada é requisitável se e só se tem `<Name>`**, independentemente da profundidade.

**Requisito:** determinar requisitabilidade pela presença de `<Name>`, nunca pela posição na árvore.

### 3.6 Herança de CRS é obrigatória, não opcional

`ortos2018`, camada filha `Ortos2018-RGB`: **zero** elementos `<CRS>` próprios. Herda `EPSG:3763` e `EPSG:3857` do pai.

GeoServer, camadas filhas: declaram apenas `EPSG:3763` e `CRS:84`, mas herdam `EPSG:4326`, `EPSG:4258` e `EPSG:3857` do pai.

Um interpretador que leia só o nó filho conclui que a CAOP não suporta Web Mercator. Suporta.

**Requisito:** acumular CRS/SRS ao longo de toda a cadeia de ascendentes, conforme secção 7.2.4.6.7 da norma WMS 1.3.0.

### 3.7 Nem todos os serviços anunciam EPSG:4326 ou CRS:84

`ortos2018` declara apenas `EPSG:3763` e `EPSG:3857`. Não há `EPSG:4326`. Não há `CRS:84`.

E, contraditoriamente, publica na mesma camada:

```xml
<BoundingBox CRS="CRS:84" minx="-10.1933914843" ... />
```

Uma caixa envolvente num CRS que o próprio documento não declara como suportado.

**Requisito:** não assumir a existência de nenhum CRS em particular. Verificar que `EPSG:3763` está na lista efectiva (com herança) antes de compor pedidos — está presente nos seis serviços, o que é boa notícia para o alinhamento com PT-TM06/ETRS89. Ignorar `BoundingBox` cujo CRS não conste da lista suportada, mas não rejeitar o documento por isso.

### 3.8 DOCTYPE com referência externa em todas as capturas 1.1.1

```xml
<!DOCTYPE WMT_MS_Capabilities SYSTEM "http://schemas.opengis.net/wms/1.1.1/WMS_MS_Capabilities.dtd" [ ... ]>
```

Presente nos seis documentos 1.1.1, ausente nos seis de 1.3.0. Consequências:

- `DOMParser` do browser em modo `text/xml` ignora a DTD externa e funciona.
- Interpretadores estritos podem tentar ir buscá-la à rede. Num posto de comando sem ligação, isso é um bloqueio até ao timeout.
- É também a superfície clássica de XXE.

**Requisito:** desactivar explicitamente o carregamento de DTD e a resolução de entidades em qualquer interpretador fora do browser (testes em Node incluídos).

### 3.9 Diferenças menores mas com efeito

| Aspecto | 1.1.1 | 1.3.0 |
|---|---|---|
| Raiz | `WMT_MS_Capabilities` | `WMS_Capabilities` |
| Espaço de nomes | nenhum | `http://www.opengis.net/wms` por defeito |
| `<Service><Name>` | `OGC:WMS` | `WMS` |
| Sistema de referência | `<SRS>` | `<CRS>` |
| Caixa geográfica | `<LatLonBoundingBox>` | `<EX_GeographicBoundingBox>` |
| Atributo de caixa | `SRS=` | `CRS=` |

O atributo `queryable` está **ausente** no MapProxy, é `"0"` no MapServer e `"1"` no GeoServer. Por norma, ausente equivale a 0.

Os `<Keyword>` do MapServer trazem espaço à cabeça (`<Keyword> 2023</Keyword>`) — resultado de dividir uma string por vírgula sem aparar. Cosmético, mas visível se forem apresentados ao operador.

---

## 4. Requisitos consolidados para o interpretador

1. Detectar a versão pelo **nome do elemento raiz**, não pelo parâmetro pedido nem pelo atributo `version`.
2. Tratar `ServiceExceptionReport` como erro, mesmo com HTTP 200.
3. Desactivar DTD e entidades externas.
4. Ignorar o espaço de nomes por defeito na travessia, ou tratá-lo condicionalmente por versão. Nunca usar selectores que assumam um dos dois casos.
5. Requisitabilidade = presença de `<Name>`.
6. CRS efectivo = união dos declarados em toda a cadeia de ascendentes.
7. Endereço de operação lido de `GetMap/DCPType/HTTP/Get/OnlineResource`, fundido por `URLSearchParams`, promovido a HTTPS.
8. Formatos por lista branca da aplicação.
9. Escalas com `parseFloat`; `ScaleHint` e `ScaleDenominator` tratados como modelos distintos e não convertidos entre si.
10. Catálogo de camadas por lista branca explícita de `Name`, não por enumeração.
11. Verificar `EPSG:3763` na lista efectiva antes de compor pedidos.
12. Zero camadas requisitáveis é erro reportável.

---

## 5. Configuração recomendada por serviço

| Tema | Versão a usar | Camada | Observação |
|---|---|---|---|
| Altimetria (curvas, cotas) | 1.3.0 | `Curva_de_nivel`, `Cota_altimetrica` | queryable |
| CAOP2025 | 1.3.0 | `cont_distritos`, `cont_municipios`, `cont_freguesias`, `cont_areas_administrativas` | queryable |
| COS2018v2 | **1.1.1** | `serie1_COS` | 1.3.0 não publica camadas |
| Mapa Agrícola e Florestal | 1.3.0 | `MAF1951_1980` | histórico, 1951–1980 |
| OrtoSat2023 30 cm | 1.3.0 | `ortoSat2023-CorVerdadeira`, `ortoSat2023-FalsaCor` | escala 1:500 a 1:5×10⁸; não queryable |
| Ortos2018 | 1.3.0 | `Ortos2018-RGB` | endereço em HTTP; formatos suspeitos |

Todos suportam `EPSG:3763` (PT-TM06/ETRS89).

---

## 6. Sobre CORS e o modelo offline

Os três anfitriões devolvem `Access-Control-Allow-Origin: *`. Um `fetch()` a partir de origem `file://` (que envia `Origin: null`) é permitido, desde que sem credenciais.

O `cartografia.dgterritorio.gov.pt` devolve o cabeçalho **duas vezes**, com capitalização diferente. É legal em HTTP, mas há clientes que se recusam a aceitar cabeçalhos CORS duplicados. Requer teste real antes de se depender disso.

Recomendação: manter as capacidades **empacotadas** como fonte primária, com actualização oportunista quando há rede, e indicador de idade dos dados conforme o padrão já usado nos restantes módulos importados. O teatro de operações não tem ligação garantida; a obtenção em tempo de execução é melhoria, nunca dependência.

---

## 7. Fixtures a reter

Os doze ficheiros devem entrar no repositório como imutáveis, com os cabeçalhos HTTP ao lado. Cobertura obtida:

- **Três implementações de servidor** distintas
- **Duas versões** de protocolo com raízes, espaços de nomes e vocabulários diferentes
- **Um catálogo vazio** (cos2018 1.3.0)
- **Um tipo MIME malformado** (ortos2018)
- **Uma notação científica** em campo numérico (ortosat2023 1.3.0)
- **Dois modelos de escala** incompatíveis
- **Herança de CRS** em duas variantes
- **Raiz com e sem nome**
- **Endereço em HTTP** dentro de documento servido por HTTPS

É um conjunto de teste melhor do que qualquer documento sintético escrito a partir da norma. Nenhum destes nove casos seria previsível por leitura da especificação.
