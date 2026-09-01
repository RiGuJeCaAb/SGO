# Registo integral da conversa — captura e análise de GetCapabilities

**Documento:** `CSREPCDouro_202609010818_Transcricao_SessaoCartografia_CLD.md`
**Sessão:** 31 de agosto de 2026
**Intervenientes:** C. Abreu (CSREPC Douro), Claude

## Nota sobre fidelidade

Este documento reproduz a conversa palavra por palavra, sem alterações ao texto de qualquer dos intervenientes.

Duas ressalvas, por honestidade e não por licença:

1. **Imagens.** Várias intervenções de C. Abreu consistiram em capturas de ecrã do terminal PowerShell. Não são texto e não podem ser reproduzidas como tal. Estão transcritas literalmente, assinaladas como `[Imagem — transcrição]`, com o nome do ficheiro original.
2. **Ficheiros.** Os anexos (ZIP, HTML, XML) estão assinalados pelo nome, sem conteúdo embutido.

Nada mais foi acrescentado, retirado ou reformulado.

---

## C. Abreu

'O que preciso de ti
O XML de um `GetCapabilities` verdadeiro da DGT no repositório. Testei contra um documento que escrevi segundo a norma; a norma é uma coisa, o que cada serviço realmente publica é outra. Com o documento real, ou funciona à primeira ou digo-te exatamente o que lhe falta.' - Como faço isto ?

---

## Claude

*[Executou pesquisas web sobre os serviços WMS/WMTS da DGT, obteve por ferramenta própria um exemplar do GetCapabilities da altimetria, e produziu dois ficheiros: `CSREPCDouro_202608310816_GetCapabilities_DGT_altimetria_wms130_CLD.xml` e `CSREPCDouro_202608310816_capturar_getcapabilities_dgt_CLD.sh`.]*

Boa pergunta, e a resposta é mais banal do que parece: um `GetCapabilities` é só um GET HTTP. O truque está em gravar a resposta **crua** e não a versão que o browser te mostra.

## Endpoints reais da DGT

A DGT corre GeoServer em `geo2.dgterritorio.gov.pt`, com o padrão `/geoserver/<workspace>/wms`. Os que interessam ao projeto:

| Tema | URL base |
|---|---|
| Altimetria 1:50 000 (curvas de nível, cotas) | `https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms` |
| CAOP2025 Continente | `https://geo2.dgterritorio.gov.pt/geoserver/caop_continente/wms` |
| COS2018v2 | `https://geo2.dgterritorio.gov.pt/geoserver/COS2018/wms` |
| Mapa Agrícola e Florestal | `https://geo2.dgterritorio.gov.pt/geoserver/maf/wms` |
| OrtoSat2023 (30 cm) | `https://ortos.dgterritorio.gov.pt/wms/ortosat2023` |
| Ortos 2018 | `https://cartografia.dgterritorio.gov.pt/ortos2018/service` |

A DGT também publica OGC API em `https://ogcapi.dgterritorio.gov.pt/` com CAOP, CRUS, cadastro predial, COS e OrtoSat 2023 — mas isso é JSON, outro parser, outra conversa.

## Captura

```bash
curl -L --compressed -D headers.txt -o dgt_altimetria_wms130.xml \
  "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.3.0"
```

Windows/PowerShell (usa `curl.exe`, não o alias `curl` que é `Invoke-WebRequest` e faz coisas ao encoding):

```powershell
curl.exe -L --compressed -D headers.txt -o dgt_altimetria_wms130.xml `
  "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.3.0"
```

Três regras: **não** grave pelo "Guardar como" do browser (o visualizador de XML do Chrome injeta DOM e pode devolver-te HTML), **não** passe por um pretty-printer, e guarde os cabeçalhos ao lado. E capture as **duas versões** — `1.3.0` e `1.1.1`. É precisamente aí que a norma e a realidade divergem, porque em 1.1.1 a raiz nem sequer se chama o mesmo.

Deixo-te um script que apanha os seis serviços nas duas versões, grava headers, e produz um manifesto TSV com HTTP status, content-type, bytes e SHA-256 de cada captura. Fixtures sem proveniência datada apodrecem em silêncio.

## Já tens um documento real para começar

Fui buscar o da altimetria — está completo, é pequeno, e tem quase todas as armadilhas interessantes num único ficheiro. Nota honesta: passou pelo meu fetcher, por isso corre o script e faz `diff` contra a tua cópia antes de o assumires como referência canónica.

## O que este documento vai partir no parser escrito pela norma

Olhando para o que a DGT publica mesmo:

1. **`xlink:href="...ows?SERVICE=WMS&"`** — o `OnlineResource` já traz query string *e termina em `&`*. Se concatenares `?REQUEST=GetMap`, sai lixo. Tens de fazer parse do URL e fundir parâmetros.
2. **Raiz `<WMS_Capabilities>` com namespace por defeito `http://www.opengis.net/wms`** em 1.3.0. Em 1.1.1 a raiz é `<WMT_MS_Capabilities>` **sem namespace**. XPath sem binding de namespace falha num e funciona no outro.
3. **`<CRS>` em 1.3.0, `<SRS>` em 1.1.1.** `EX_GeographicBoundingBox` versus `LatLonBoundingBox`.
4. **Herança de CRS.** As camadas filhas declaram só `EPSG:3763` e `CRS:84`; herdam `4326`, `4258`, `3857` da camada-pai. Se leres apenas o nó filho, rejeitas projeções que o serviço suporta.
5. **A camada exterior não tem `<Name>`** — é grupo, não é requisitável. Um parser que liste todos os `<Layer>` oferece ao operador uma camada que devolve exceção.
6. **Ordem dos eixos.** Em 1.3.0, `EPSG:4326` é lat/lon; `CRS:84` é lon/lat; `EPSG:3763` é E/N. O mesmo documento mistura as três convenções.
7. **`inspire_vs:ExtendedCapabilities`** dentro de `<Capability>`, irmão inesperado com namespaces estrangeiros.
8. **Nó de comentário** dentro de `<Layer>` (`<!--Limited list of EPSG projections:-->`) — se iteras `childNodes` em vez de `children`, apanha-lo.
9. **`<Abstract/>` vazio** — `textContent` dá `""`, não `null`, mas o nó existe. E formatos como `image/png; mode=8bit` têm espaço e ponto-e-vírgula.
10. **Exceções OGC vêm com HTTP 200.** Versão inválida devolve `<ServiceExceptionReport>` e status 200. Nunca confies no código de estado; verifica o nome do elemento raiz.

Boa notícia: `EPSG:3763` está lá declarado nativamente. PT-TM06/ETRS89 sem reprojeção do teu lado.

## O aviso que interessa mais à Estação PEA

Confirma nos `headers.txt` se vem `access-control-allow-origin`. Suspeito fortemente que não vem. A partir de `file://` a origem é `null`, e nesse caso nem um wildcard te salva — `fetch()` do capabilities morre no browser. Consequências arquiteturais:

- O capabilities tem de ser **empacotado** na aplicação (ou num ficheiro ao lado), não obtido em runtime. O que aliás é coerente com "opera offline no teatro de operações".
- `GetMap` via `<img src=...>` não precisa de CORS — só precisas se quiseres ler o canvas de volta, e aí fica *tainted*.
- Vale a pena um teste de facto: captura e verifica o cabeçalho antes de o Code construir qualquer camada de rede.

Faz a captura e manda-me o XML da CAOP e do OrtoSat. Esses dois são os que costumam ter os catálogos grandes e os `TileMatrixSet` esquisitos — se o parser aguentar esses, aguenta o resto.

---

## C. Abreu

*[Imagem — transcrição de `1788164517203_image.png`]*

```
PS C:\Users\SHOGUN> curl.exe -L --compressed -D headers.txt -o dgt_altimetria_wms130.xml `
>>    "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.3.0"
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2438    0  2438    0     0   2975      0                               0
PS C:\Users\SHOGUN> curl.exe -L --compressed -D headers.txt -o dgt_altimetria_wms130.xml `
>>    "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.1.1"
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2273    0  2273    0     0   9779      0                               0
PS C:\Users\SHOGUN>
```

eu já corri os dois comandos, mas não entendi como queres que guarde, acredito que vais ter de fazer uma manual passo a passo de como fazer isto

---

## Claude

*[Produziu o ficheiro `CSREPCDouro_202608310816_capturar_getcapabilities_dgt_CLD.ps1`.]*

Antes do manual: repara no que aconteceu aí. Os dois comandos escreveram para **o mesmo ficheiro**. O `-o dgt_altimetria_wms130.xml` foi igual nas duas linhas, por isso o 1.1.1 esmagou o 1.3.0. Só tens agora o 1.1.1, com nome a dizer 1.3.0. O `headers.txt` idem. Culpa minha — dei-te o comando de exemplo e não te avisei que tinhas de mudar o nome de saída em cada corrida.

Vamos fazer isto de forma que não dependa de escreveres nomes à mão.

## Manual, passo a passo

**1. Faz uma pasta de trabalho.** Não trabalhes em `C:\Users\SHOGUN` — isso é a tua home e vai ficar cheia de lixo.

```powershell
mkdir C:\estacao_pea\capturas
cd C:\estacao_pea\capturas
```

**2. Descarrega o `.ps1` acima e mete-o nessa pasta.** Fica com o nome comprido tal como está; a convenção serve para saberes daqui a três meses de onde veio.

**3. Desbloqueia o ficheiro.** O Windows marca tudo o que veio do browser e o PowerShell recusa-se a correr.

```powershell
Unblock-File .\CSREPCDouro_202608310816_capturar_getcapabilities_dgt_CLD.ps1
```

**4. Corre.** Não precisas de Administrador para isto — abre uma PowerShell normal.

```powershell
powershell -ExecutionPolicy Bypass -File .\CSREPCDouro_202608310816_capturar_getcapabilities_dgt_CLD.ps1
```

**5. Lê a tabela de resumo.** No fim aparece algo assim:

```
ficheiro                                                     http bytes raiz_xml            cors_origin
CSREPCDouro_..._DGT_altimetria_wms130_CLD.xml                200  10842 WMS_Capabilities    (ausente)
CSREPCDouro_..._DGT_altimetria_wms111_CLD.xml                200   9977 WMT_MS_Capabilities (ausente)
CSREPCDouro_..._DGT_caop_continente_wms130_CLD.xml           200  ...   WMS_Capabilities    ...
```

O que interessa nessa tabela:

- **`http` = 200** e nada mais. Qualquer outra coisa e o ficheiro já foi mandado para `.\fixtures_dgt\falhadas`.
- **`raiz_xml`** tem de ser `WMS_Capabilities` no 1.3.0 e `WMT_MS_Capabilities` no 1.1.1. Se aparecer `ServiceExceptionReport`, o servidor devolveu um erro com HTTP 200 — o script avisa-te a vermelho. É exatamente a armadilha número 10 da minha lista anterior, e agora vais vê-la ao vivo.
- **`cors_origin`** é a coluna que decide arquitetura. Se disser `(ausente)` em toda a linha, está confirmado: a Estação PEA não pode ir buscar isto em runtime a partir de `file://`. Fica empacotado, ponto final.

**6. Entrega-me o ZIP.** O script cria `CSREPCDouro_<data>_fixtures_dgt_CLD.zip` na pasta onde correste. Anexa-o na próxima mensagem. Vem com os XML, os `.headers.txt` e o manifesto CSV — proveniência completa.

## Se o script se recusar a correr

Faz à mão, mas com nomes diferentes em cada linha. Foi só isso que falhou antes:

```powershell
curl.exe -L --compressed -s -D altimetria_130.headers.txt -o altimetria_130.xml `
  "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.3.0"

curl.exe -L --compressed -s -D altimetria_111.headers.txt -o altimetria_111.xml `
  "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.1.1"
```

Repara: `-D` e `-o` diferentes nas duas. Depois repetes trocando `altimetria` por `caop_continente`, `COS2018`, `maf`, e por `https://ortos.dgterritorio.gov.pt/wms/ortosat2023`.

## Onde isto vive no repositório

Sugestão, para o Code não andar a adivinhar:

```
/fixtures/dgt/
    <xml>            capturas cruas, nunca editadas
    <headers.txt>    prova de content-type e CORS
    manifesto.csv    URL, data, hash — o registo de proveniência
```

Regra: aqueles ficheiros são **imutáveis**. Se um serviço mudar, capturas de novo com nova data e ficas com as duas gerações. Um fixture editado à mão deixa de ser prova de nada, e a razão de estarmos a fazer isto é precisamente teres desconfiado do documento que escreveste segundo a norma.

Corre e manda o ZIP. Aposto que dois dos oito alvos vêm com surpresa.

---

## C. Abreu

*[Imagem — transcrição de `1788164687338_image.png`]*

```
PS C:\Users\SHOGUN> curl.exe -L --compressed -D headers.txt -o dgt_altimetria_wms130.xml `
>>    "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.3.0"
100  2438    0  2438    0     0   2975      0                               0
PS C:\Users\SHOGUN> curl.exe -L --compressed -D headers.txt -o dgt_altimetria_wms130.xml `
>>    "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.1.1"
100  2273    0  2273    0     0   9779      0                               0
PS C:\Users\SHOGUN> curl.exe -L --compressed -D headers.txt -o dgt_altimetria_wms130.xml `
>>    "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.3.0"
100  2438    0  2438    0     0    335      0           00:07              0
PS C:\Users\SHOGUN> curl.exe -L --compressed -D headers111.txt -o dgt_altimetria_wms111.xml `
>>    "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.1.1"
100  2273    0  2273    0     0   9854      0                               0
PS C:\Users\SHOGUN> curl.exe -L --compressed -D headers130.txt -o dgt_altimetria_wms130.xml `
>>    "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.3.0"
100  2438    0  2438    0     0  11826      0                               0
PS C:\Users\SHOGUN>
```

melhor assim ?

---

## Claude

Sim. Agora sim — `headers111.txt`/`dgt_altimetria_wms111.xml` e `headers130.txt`/`dgt_altimetria_wms130.xml`. Quatro ficheiros distintos, nada esmagado.

Detalhe encorajador: capturaste o 1.3.0 três vezes e deu sempre 2438 bytes. Resposta determinística, sem conteúdo dinâmico a variar entre pedidos. Bom sinal para um fixture.

**Confirma o que tens:**

```powershell
foreach ($f in Get-ChildItem .\dgt_*.xml) {
  $t = Get-Content $f -Raw
  $raiz = if     ($t -match '<ServiceExceptionReport')  { 'ServiceExceptionReport' }
          elseif ($t -match '<WMS_Capabilities')        { 'WMS_Capabilities' }
          elseif ($t -match '<WMT_MS_Capabilities')     { 'WMT_MS_Capabilities' }
          else                                          { 'DESCONHECIDA' }
  '{0,-32} {1,8} bytes  raiz=<{2}>' -f $f.Name, $f.Length, $raiz
}
```

Queres ver `WMS_Capabilities` no 130 e `WMT_MS_Capabilities` no 111. Se as duas raízes forem iguais, o servidor ignorou a negociação de versão — o que também é informação útil.

**E o cabeçalho que decide arquitetura:**

```powershell
Get-Content .\headers130.txt | Select-String 'HTTP/|content-type|access-control'
```

**Faltam os outros cinco serviços.** Em vez de 10 linhas à mão, cola isto:

```powershell
$alvos = [ordered]@{
  'caop_continente' = 'https://geo2.dgterritorio.gov.pt/geoserver/caop_continente/wms'
  'cos2018'         = 'https://geo2.dgterritorio.gov.pt/geoserver/COS2018/wms'
  'maf'             = 'https://geo2.dgterritorio.gov.pt/geoserver/maf/wms'
  'ortosat2023'     = 'https://ortos.dgterritorio.gov.pt/wms/ortosat2023'
  'ortos2018'       = 'https://cartografia.dgterritorio.gov.pt/ortos2018/service'
}
foreach ($k in $alvos.Keys) {
  foreach ($v in '1.3.0','1.1.1') {
    $s = $v -replace '\.',''
    curl.exe -L --compressed -s -D "headers_${k}_${s}.txt" -o "dgt_${k}_wms${s}.xml" `
      "$($alvos[$k])?service=WMS&request=GetCapabilities&version=$v"
    '{0,-18} {1}  ->  {2} bytes' -f $k, $v, (Get-Item "dgt_${k}_wms${s}.xml").Length
  }
}
```

**Depois empacota e manda:**

```powershell
Compress-Archive -Path .\dgt_*.xml, .\headers*.txt -DestinationPath .\CSREPCDouro_fixtures_dgt_CLD.zip -Force
```

O ZIP fica em `C:\Users\SHOGUN`. Anexa-o aqui e passo ao que interessa: dizer-te exatamente onde o teu documento escrito segundo a norma diverge do que a DGT publica.

---

## C. Abreu

*[Imagem — transcrição de `1788164801314_image.png`]*

```
PS C:\Users\SHOGUN> foreach ($f in Get-ChildItem .\dgt_*.xml) {
>>   $t = Get-Content $f -Raw
>>   $raiz = if     ($t -match '<ServiceExceptionReport')  { 'ServiceExceptionReport' }
>>           elseif ($t -match '<WMS_Capabilities')        { 'WMS_Capabilities' }
>>           elseif ($t -match '<WMT_MS_Capabilities')     { 'WMT_MS_Capabilities' }
>>           else                                          { 'DESCONHECIDA' }
>>   '{0,-32} {1,8} bytes  raiz=<{2}>' -f $f.Name, $f.Length, $raiz
>> }
dgt_altimetria_wms111.xml           11514 bytes  raiz=<WMT_MS_Capabilities>
dgt_altimetria_wms130.xml           10822 bytes  raiz=<WMS_Capabilities>
PS C:\Users\SHOGUN>
```

---

## Claude

Perfeito. Isso é confirmação de três coisas de uma vez:

- **O servidor respeita a negociação de versão.** Raízes diferentes conforme pediste — nem todos os serviços fazem isto, muitos devolvem sempre a versão mais alta e ignoram o parâmetro.
- **O `--compressed` funcionou.** 2438 bytes na rede, 10822 em disco. O curl descomprimiu, gravaste XML e não gzip.
- **O 1.1.1 é *maior* que o 1.3.0** apesar de ter menos funcionalidades. Isso é o `<!DOCTYPE ... [ ... ]>` com subconjunto DTD inline que o GeoServer emite em 1.1.1. É o teu primeiro problema real de parser: `DOMParser` do browser em modo `text/xml` engole-o, mas `[xml]` do PowerShell e vários parsers de Node rejeitam ou tentam ir buscar a DTD à rede. Num posto de comando offline, "tentar ir buscar à rede" significa pendurar.

Falta o cabeçalho:

```powershell
Get-Content .\headers130.txt | Select-String 'HTTP/|content-type|access-control'
```

Depois corre o bloco dos cinco serviços restantes e empacota. É aí que a coisa fica interessante — a CAOP tem catálogo grande e o OrtoSat pode nem ter `EPSG:3763` declarado.

---

## C. Abreu

*[Imagem — transcrição de `1788165169152_image.png`]*

```
PS C:\Users\SHOGUN> cd \
PS C:\> md estacao_pea

    Directory: C:\

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         31/08/2026     09:28                estacao_pea

PS C:\> cd estacao_pea
PS C:\estacao_pea> curl.exe -L --compressed -D headers111.txt -o dgt_altimetria_wms111.xml `
>>    "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.1.1"
100  2273    0  2273    0     0   1692      0           00:01              0
PS C:\estacao_pea> curl.exe -L --compressed -D headers130.txt -o dgt_altimetria_wms130.xml `
>>    "https://geo2.dgterritorio.gov.pt/geoserver/altimetria/wms?service=WMS&request=GetCapabilities&version=1.3.0"
100  2438    0  2438    0     0   7224      0                               0
PS C:\estacao_pea> foreach ($f in Get-ChildItem .\dgt_*.xml) {
>>   $t = Get-Content $f -Raw
>>   $raiz = if     ($t -match '<ServiceExceptionReport')  { 'ServiceExceptionReport' }
>>           elseif ($t -match '<WMS_Capabilities')        { 'WMS_Capabilities' }
>>           elseif ($t -match '<WMT_MS_Capabilities')     { 'WMT_MS_Capabilities' }
>>           else                                          { 'DESCONHECIDA' }
>>   '{0,-32} {1,8} bytes  raiz=<{2}>' -f $f.Name, $f.Length, $raiz
>> }
dgt_altimetria_wms111.xml           11514 bytes  raiz=<WMT_MS_Capabilities>
dgt_altimetria_wms130.xml           10822 bytes  raiz=<WMS_Capabilities>
PS C:\estacao_pea> Compress-Archive -Path .\dgt_*.xml, .\headers*.txt -DestinationPath .\CSREPCDouro_fixtures_dgt_CLD.zip -Force
PS C:\estacao_pea>
```

Fiz assim passo a passo

---

## Claude

Limpo. Pasta própria, nomes distintos, verificação feita, ZIP criado. É assim que se constrói um fixture com proveniência.

Só que o ZIP que tens neste momento leva **só a altimetria** — dois XML e dois headers. Faltam os outros cinco serviços, e são esses que vão dar problemas ao parser.

**1. Vê o cabeçalho** (é uma linha, e decide arquitetura):

```powershell
Get-Content .\headers130.txt | Select-String 'HTTP/|content-type|access-control'
```

**2. Apanha os cinco que faltam:**

```powershell
$alvos = [ordered]@{
  'caop_continente' = 'https://geo2.dgterritorio.gov.pt/geoserver/caop_continente/wms'
  'cos2018'         = 'https://geo2.dgterritorio.gov.pt/geoserver/COS2018/wms'
  'maf'             = 'https://geo2.dgterritorio.gov.pt/geoserver/maf/wms'
  'ortosat2023'     = 'https://ortos.dgterritorio.gov.pt/wms/ortosat2023'
  'ortos2018'       = 'https://cartografia.dgterritorio.gov.pt/ortos2018/service'
}
foreach ($k in $alvos.Keys) {
  foreach ($v in '1.3.0','1.1.1') {
    $s = $v -replace '\.',''
    curl.exe -L --compressed -s -D "headers_${k}_${s}.txt" -o "dgt_${k}_wms${s}.xml" `
      "$($alvos[$k])?service=WMS&request=GetCapabilities&version=$v"
    '{0,-18} {1}  ->  {2} bytes' -f $k, $v, (Get-Item "dgt_${k}_wms${s}.xml").Length
  }
}
```

**3. Volta a correr a verificação de raízes** (o mesmo `foreach` de antes — agora com 12 ficheiros).

**4. Re-empacota**, porque o ZIP atual está desatualizado:

```powershell
Compress-Archive -Path .\dgt_*.xml, .\headers*.txt -DestinationPath .\CSREPCDouro_fixtures_dgt_CLD.zip -Force
```

**5. Anexa o `C:\estacao_pea\CSREPCDouro_fixtures_dgt_CLD.zip` na próxima mensagem.**

O que espero encontrar: a CAOP com camadas aninhadas a três níveis e nomes com prefixo de workspace, e o OrtoSat possivelmente sem `EPSG:3763` declarado — o que obrigaria a reprojeção do lado da aplicação e mudava a conta ao teu módulo topográfico.

---

## C. Abreu

*[Imagem — transcrição de `1788165285470_image.png`]*

```
PS C:\estacao_pea> Get-Content .\headers130.txt | Select-String 'HTTP/|content-type|access-control'

HTTP/1.1 200
Content-Type: text/xml
Access-Control-Allow-Origin: *

PS C:\estacao_pea> $alvos = [ordered]@{
>>   'caop_continente' = 'https://geo2.dgterritorio.gov.pt/geoserver/caop_continente/wms'
>>   'cos2018'         = 'https://geo2.dgterritorio.gov.pt/geoserver/COS2018/wms'
>>   'maf'             = 'https://geo2.dgterritorio.gov.pt/geoserver/maf/wms'
>>   'ortosat2023'     = 'https://ortos.dgterritorio.gov.pt/wms/ortosat2023'
>>   'ortos2018'       = 'https://cartografia.dgterritorio.gov.pt/ortos2018/service'
>> }
PS C:\estacao_pea> foreach ($k in $alvos.Keys) {
>>   foreach ($v in '1.3.0','1.1.1') {
>>     $s = $v -replace '\.',''
>>     curl.exe -L --compressed -s -D "headers_${k}_${s}.txt" -o "dgt_${k}_wms${s}.xml" `
>>       "$($alvos[$k])?service=WMS&request=GetCapabilities&version=$v"
>>     '{0,-18} {1}  ->  {2} bytes' -f $k, $v, (Get-Item "dgt_${k}_wms${s}.xml").Length
>>   }
>> }
caop_continente    1.3.0  ->  21964 bytes
caop_continente    1.1.1  ->  22490 bytes
cos2018            1.3.0  ->  6554 bytes
cos2018            1.1.1  ->  8961 bytes
maf                1.3.0  ->  7202 bytes
maf                1.1.1  ->  10069 bytes
ortosat2023        1.3.0  ->  10541 bytes
ortosat2023        1.1.1  ->  9520 bytes
ortos2018          1.3.0  ->  3383 bytes
ortos2018          1.1.1  ->  2805 bytes
PS C:\estacao_pea>
```

quando dizes verifica as raizes isso é o quê ?

---

## Claude

"Raiz" é o **elemento raiz** do XML — a primeira etiqueta a seguir à declaração, aquela que envolve todo o documento. Em `<WMS_Capabilities>...</WMS_Capabilities>`, a raiz é `WMS_Capabilities`.

Interessa por duas razões concretas:

1. **É o discriminador de versão.** WMS 1.3.0 → `WMS_Capabilities`. WMS 1.1.1 → `WMT_MS_Capabilities`. O parser tem de ramificar aí antes de tentar ler seja o que for, porque a partir desse ponto muda tudo (`CRS` vs `SRS`, namespace vs nenhum).
2. **É como se apanha um erro disfarçado.** Se o servidor recusar o pedido, devolve `<ServiceExceptionReport>` com **HTTP 200**. Ficheiro com bom aspeto, tamanho razoável, status verde — e conteúdo inútil. Só se vê olhando para a raiz.

Corre isto, que agora tens 12 ficheiros:

```powershell
foreach ($f in Get-ChildItem .\dgt_*.xml | Sort-Object Name) {
  $t = Get-Content $f -Raw
  $raiz = if     ($t -match '<\s*ServiceExceptionReport') { 'ServiceExceptionReport' }
          elseif ($t -match '<\s*WMS_Capabilities')       { 'WMS_Capabilities' }
          elseif ($t -match '<\s*WMT_MS_Capabilities')    { 'WMT_MS_Capabilities' }
          else { ($t -replace '(?s)<\?xml.*?\?>|<!DOCTYPE.*?>|<!--.*?-->','' -match '<\s*([\w\.\-:]+)') | Out-Null; 'OUTRA: ' + $Matches[1] }
  '{0,-34} {1,7} bytes  raiz=<{2}>' -f $f.Name, $f.Length, $raiz
}
```

Presta atenção ao `ortos2018`: 3383 e 2805 bytes, e é o **único** em que o 1.1.1 é menor que o 1.3.0 — nos outros cinco é sempre maior. Ou é um serviço com pouquíssimas camadas, ou não é GeoServer, ou devolveu exceção. A raiz diz-te qual.

---

**E agora a parte em que estava enganado.** `Access-Control-Allow-Origin: *`. Previ que não viesse; veio. Com wildcard, um `fetch()` a partir de `file://` (que envia `Origin: null`) **passa**, desde que não haja credenciais. Ou seja: a Estação PEA *pode* ir buscar o capabilities em runtime.

Isso não muda a decisão de empacotar — num teatro de operações não há rede e o fixture continua a ser o fallback obrigatório —, mas abre a porta a uma atualização oportunista quando há ligação, com o indicador de idade dos dados que já usas noutros sítios.

Confirma que os outros dois anfitriões fazem o mesmo, porque só testaste o `geo2`:

```powershell
Get-Content .\headers_ortosat2023_130.txt | Select-String 'HTTP/|content-type|access-control'
Get-Content .\headers_ortos2018_130.txt   | Select-String 'HTTP/|content-type|access-control'
```

Depois re-empacota e manda o ZIP.

---

## C. Abreu

*[Imagem — transcrição de `1788165536477_image.png`]*

```
PS C:\estacao_pea> foreach ($f in Get-ChildItem .\dgt_*.xml | Sort-Object Name) {
>>   $t = Get-Content $f -Raw
>>   $raiz = if     ($t -match '<\s*ServiceExceptionReport') { 'ServiceExceptionReport' }
>>           elseif ($t -match '<\s*WMS_Capabilities')       { 'WMS_Capabilities' }
>>           elseif ($t -match '<\s*WMT_MS_Capabilities')    { 'WMT_MS_Capabilities' }
>>           else { ($t -replace '(?s)<\?xml.*?\?>|<!DOCTYPE.*?>|<!--.*?-->','' -match '<\s*([\w\.\-:]+)') | Out-Null; 'OUTRA: ' + $Matches[1] }
>>   '{0,-34} {1,7} bytes  raiz=<{2}>' -f $f.Name, $f.Length, $raiz
>> }
dgt_altimetria_wms111.xml            11514 bytes  raiz=<WMT_MS_Capabilities>
dgt_altimetria_wms130.xml            10822 bytes  raiz=<WMS_Capabilities>
dgt_caop_continente_wms111.xml       22490 bytes  raiz=<WMT_MS_Capabilities>
dgt_caop_continente_wms130.xml       21964 bytes  raiz=<WMS_Capabilities>
dgt_cos2018_wms111.xml                8961 bytes  raiz=<WMT_MS_Capabilities>
dgt_cos2018_wms130.xml                6554 bytes  raiz=<WMS_Capabilities>
dgt_maf_wms111.xml                   10069 bytes  raiz=<WMT_MS_Capabilities>
dgt_maf_wms130.xml                    7202 bytes  raiz=<WMS_Capabilities>
dgt_ortos2018_wms111.xml              2805 bytes  raiz=<WMT_MS_Capabilities>
dgt_ortos2018_wms130.xml              3383 bytes  raiz=<WMS_Capabilities>
dgt_ortosat2023_wms111.xml            9520 bytes  raiz=<WMT_MS_Capabilities>
dgt_ortosat2023_wms130.xml           10541 bytes  raiz=<WMS_Capabilities>
PS C:\estacao_pea> Get-Content .\headers_ortosat2023_130.txt | Select-String 'HTTP/|content-type|access-control'

HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: text/xml; charset=UTF-8

PS C:\estacao_pea> Get-Content .\headers_ortos2018_130.txt  | Select-String 'HTTP/|content-type|access-control'

HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-type: text/xml; charset=utf-8
Access-control-allow-origin: *

PS C:\estacao_pea>
```

---

## Claude

Doze em doze, raízes corretas, zero exceções. Colheita limpa.

Três coisas que já se lêem daqui, antes sequer de eu ver o conteúdo:

**CORS confirmado nos três anfitriões.** `geo2`, `ortos` e `cartografia` mandam todos `Access-Control-Allow-Origin: *`. Estava enganado na previsão e ainda bem.

**O `ortos2018` manda o cabeçalho duas vezes**, com capitalização diferente (`Access-Control-Allow-Origin` e `Access-control-allow-origin`). Isso é um proxy a acrescentar por cima do que a aplicação já punha. Nomes de cabeçalho HTTP são insensíveis a maiúsculas, portanto é legal, mas há navegadores e clientes que se engasgam com duplicação de cabeçalhos CORS. Vale um teste real quando implementares o fetch oportunista.

**O `ortos2018` também é o mais pequeno e o único onde o 1.1.1 encolhe** (2805 contra 3383). Combinado com o cabeçalho duplicado e o `Content-type` em caixa mista, o palpite é que não é o mesmo GeoServer dos outros — é software diferente atrás daquele URL. Se for, é o teu melhor fixture de todos: um documento válido que não segue as convenções do GeoServer que o teu parser provavelmente assumiu.

---

Empacota e manda:

```powershell
Compress-Archive -Path .\dgt_*.xml, .\headers*.txt -DestinationPath .\CSREPCDouro_fixtures_dgt_CLD.zip -Force
```

Anexa o `C:\estacao_pea\CSREPCDouro_fixtures_dgt_CLD.zip`. São 12 XML e 12 headers, coisa de 40 KB comprimidos.

Depois passo ao que interessa: pego no teu parser e no documento escrito segundo a norma, atiro-lhe estes doze, e digo-te exatamente onde parte e porquê.

---

## C. Abreu

*[Ficheiro anexado: `CSREPCDouro_fixtures_dgt_CLD.zip`]*

tens em anexo o zip que pediste

---

## Claude

*[Extraiu e analisou os doze ficheiros; produziu `CSREPCDouro_202608310900_d_AnaliseGetCapabilitiesDGT_CLD.md`.]*

Recebido, extraído, dissecado. Doze ficheiros, três implementações de servidor diferentes, e o resultado é bastante pior do que o teu documento escrito segundo a norma alguma vez poderia prever.

Escrevi tudo num documento com as provas linha a linha:

Os quatro que mais te vão custar:

**A COS2018 em 1.3.0 não publica uma única camada requisitável.** O ficheiro tem exactamente um `<Name>`, e é `WMS` — o nome do serviço. A camada raiz é grupo, sem filhos. Documento válido, HTTP 200, 6554 bytes, e impossível de usar. Em 1.1.1 a camada aparece: `serie1_COS`. Para a Carta de Uso e Ocupação do Solo tens de usar 1.1.1, ou passar à OGC API.

**São três servidores diferentes, não um.** GeoServer no `geo2`, MapServer 7.7.0-dev no `ortos`, MapProxy no `cartografia`. Tudo o que inferires de um é falso para os outros dois. Exemplo imediato: a regra "a camada raiz não tem nome" é verdadeira no GeoServer e falsa nos outros dois, onde a raiz é ela própria requisitável.

**O endereço de GetMap muda de caminho entre versões.** `/altimetria/wms` em 1.1.1, `/altimetria/ows` em 1.3.0. E ambos terminam em `?SERVICE=WMS&`, com o `&` pendurado. Quem concatenar `?REQUEST=GetMap` produz lixo nos quatro serviços GeoServer.

**`<MaxScaleDenominator>5e+08</MaxScaleDenominator>`** no OrtoSat. `parseInt` dá 5. A camada passa a estar visível entre 1:500 e 1:5, ou seja, nunca aparece — sem qualquer mensagem de erro. É o defeito que só se descobre com um COS a perguntar porque é que o ortofotomapa desapareceu.

Depois há a colheita menor mas divertida: `<Format>image/jpg'</Format>` com aspa parasita no ortos2018, o GeoServer a duplicar 24 formatos para 48 com o `+` convertido em espaço (`application/atom xml`), a camada `serie1_COS` a fugir para dentro dos serviços da altimetria, da CAOP e do MAF onde nada tem que fazer, e o ortos2018 a declarar uma `BoundingBox CRS="CRS:84"` num CRS que o próprio documento não lista como suportado.

**Onde estava enganado:** `Access-Control-Allow-Origin: *` nos três anfitriões. O fetch a partir de `file://` passa. Continua a fazer sentido empacotar as capacidades — no terreno não há rede —, mas a actualização oportunista é viável.

**Boa notícia genuína:** os seis serviços declaram `EPSG:3763`. Zero reprojeção do teu lado.

O documento tem os requisitos consolidados numa lista de doze pontos e a tabela de configuração recomendada por tema. Diz-me se queres que passe isso a uma suíte de testes t-série que corra os doze fixtures contra o interpretador do Code — precisava de ver o código dele.

---

## C. Abreu

pior ???
e então se formos buscar a informação a outro sítio que não a DGT será que não teriamos melhores resultados ???
qual seria esse melhor ???

---

## Claude

Não. "Pior" é a palavra errada — isto é **normal**. Não descobriste que a DGT é má; descobriste que estavas a testar contra uma ficção. Qualquer WMS do planeta tem esta densidade de defeitos. A norma OGC descreve um mundo que não existe.

E é precisamente por isso que trocar de fornecedor não resolve nada.

## Porque é que mudar de fonte não te salva

Olha o que já sabemos e extrapola:

- `si.icnf.pt` corre **GeoServer** — o mesmo GeoServer do `geo2`. Vais apanhar os mesmos 48 formatos duplicados com `+` virado em espaço, a mesma herança de CRS, o mesmo `?SERVICE=WMS&` pendurado. Bónus: o ICNF tem *também* um ArcGIS Server em `sigservices.icnf.pt`, que é uma quarta família de comportamentos.
- O EFFIS corre **MapServer** — o mesmo MapServer do OrtoSat. `ScaleHint` em atributos, `application/x-pdf`, notação científica. E acrescenta uma dor que ainda não tens: quase todas as camadas do EFFIS exigem o parâmetro `TIME`, ou seja, dimensões temporais WMS, que o teu interpretador provavelmente não modela de todo.

Trocar a DGT pelo ICNF é trocar GeoServer por GeoServer. Trocar pelo EFFIS é trocar MapServer por MapServer. Ganhas zero e perdes o que interessa a seguir.

## O argumento decisivo é doutrinário, não técnico

A CAOP **é** o limite administrativo oficial de Portugal. Não é uma representação dos limites; é o limite. Se o teu PEA disser que o incêndio está na freguesia X, essa afirmação entra num registo operacional oficial, e a autoridade legal para essa afirmação é a DGT. O mesmo para a COS.

Ir buscar limites de freguesia a um espelho de terceiros — Esri, OSM, um serviço regional — para depois os inscrever num documento produzido ao abrigo do Despacho n.º 4067/2024 seria um defeito doutrinário grave, e daqueles que só aparecem em auditoria. Não vale a poupança de meio dia de trabalho no interpretador.

Idem para o ICNF: é a autoridade legal sobre cartografia de áreas ardidas, nos termos do DL n.º 124/2006 na redação do DL n.º 17/2009. Não há alternativa "melhor"; há a oficial e as outras.

## O que realmente falta não é substituir a DGT

É reconhecer que a DGT **não publica** metade do que um PCO precisa. A resposta certa não é trocar, é somar:

| Necessidade | Fonte autoritativa | Estado |
|---|---|---|
| Limites administrativos | DGT — CAOP2025 | já tens, 1.3.0 |
| Ocupação do solo | DGT — COS2018v2 | 1.1.1 obrigatório, ou OGC API |
| Ortofotos 30 cm | DGT — OrtoSat2023 | já tens |
| Altimetria, curvas de nível | DGT — altimetria 1:50 000 | já tens |
| Áreas ardidas históricas | ICNF — `si.icnf.pt/wms/areas_ardidas` | por capturar |
| Perigosidade, TPGI, locais críticos | ICNF — `si.icnf.pt/wms/bdg` | por capturar |
| FWI, focos activos, perímetros | EFFIS — `maps.effis.emergency.copernicus.eu/effis` | por capturar |
| Carta militar 1:25 000 (M888) | CIGeoE | sem WMS aberto; exige protocolo |
| Meteorologia | já usas Open-Meteo; IPMA para avisos oficiais | — |

O `si.icnf.pt/wms/areas_ardidas` declara `EPSG:3763`, tal como toda a gente. Isso continua a jogar a teu favor.

**A carta militar é o único buraco real.** A M888 do CIGeoE não tem serviço aberto — precisas de protocolo institucional. E é a única cartografia que os operacionais de terreno lêem sem hesitar, porque é a que está no bolso deles. Se há uma diligência que vale a pena começar já, com o tempo de tramitação que estas coisas têm, é essa. Não é um problema de software.

## O que eu faria

Manter tudo, corrigir o interpretador. É meio dia de trabalho e resolve os seis serviços da DGT, os do ICNF e os do EFFIS de uma assentada, porque as três famílias de servidor já estão representadas nos teus doze fixtures.

E aproveitar para alargar a colheita, que é barato:

```powershell
$extra = [ordered]@{
  'icnf_areas_ardidas' = 'https://si.icnf.pt/wms/areas_ardidas'
  'icnf_bdg'           = 'https://si.icnf.pt/wms/bdg'
  'effis'              = 'https://maps.effis.emergency.copernicus.eu/effis'
}
foreach ($k in $extra.Keys) {
  foreach ($v in '1.3.0','1.1.1') {
    $s = $v -replace '\.',''
    curl.exe -L --compressed -s -D "headers_${k}_${s}.txt" -o "dgt_${k}_wms${s}.xml" `
      "$($extra[$k])?service=WMS&request=GetCapabilities&version=$v"
    '{0,-22} {1}  ->  {2} bytes' -f $k, $v, (Get-Item "dgt_${k}_wms${s}.xml").Length
  }
}
```

O EFFIS vai ser um monstro — tem centenas de camadas com dimensão temporal. É exactamente o teste de stress que falta ao interpretador antes de o Code o dar por fechado.

Manda os seis novos e faço a mesma dissecação.

---

## C. Abreu

*[Imagem — transcrição de `1788166499224_image.png`]*

```
PS C:\estacao_pea> $extra = [ordered]@{
>>   'icnf_areas_ardidas' = 'https://si.icnf.pt/wms/areas_ardidas'
>>   'icnf_bdg'           = 'https://si.icnf.pt/wms/bdg'
>>   'effis'              = 'https://maps.effis.emergency.copernicus.eu/effis'
>> }
PS C:\estacao_pea> foreach ($k in $extra.Keys) {
>>   foreach ($v in '1.3.0','1.1.1') {
>>     $s = $v -replace '\.',''
>>     curl.exe -L --compressed -s -D "headers_${k}_${s}.txt" -o "dgt_${k}_wms${s}.xml" `
>>       "$($extra[$k])?service=WMS&request=GetCapabilities&version=$v"
>>     '{0,-22} {1}  ->  {2} bytes' -f $k, $v, (Get-Item "dgt_${k}_wms${s}.xml").Length
>>   }
>> }
icnf_areas_ardidas     1.3.0  ->  42474 bytes
icnf_areas_ardidas     1.1.1  ->  34457 bytes
icnf_bdg               1.3.0  ->  365579 bytes
icnf_bdg               1.1.1  ->  254752 bytes
effis                  1.3.0  ->  104545 bytes
effis                  1.1.1  ->  98635 bytes
PS C:\estacao_pea>
```

---

## Claude

365 KB no `icnf_bdg`. Isso é dezassete vezes a CAOP. E o EFFIS ficou em 104 KB — previ um monstro e saiu menos do que a base de dados geográfica do ICNF. Errei o alvo.

Já dá para antecipar um problema que não é de interpretação mas de operação: um catálogo dessa dimensão são muitas centenas de camadas. Nenhum COS num PCO vai percorrer uma lista dessas às três da manhã. Reforça o requisito da lista branca explícita — o `bdg` do ICNF entra por três ou quatro camadas escolhidas, nunca por enumeração.

Verifica as raízes dos seis novos:

```powershell
foreach ($f in Get-ChildItem .\dgt_icnf_*.xml, .\dgt_effis_*.xml | Sort-Object Name) {
  $t = Get-Content $f -Raw
  $raiz = if     ($t -match '<\s*ServiceExceptionReport') { 'ServiceExceptionReport' }
          elseif ($t -match '<\s*WMS_Capabilities')       { 'WMS_Capabilities' }
          elseif ($t -match '<\s*WMT_MS_Capabilities')    { 'WMT_MS_Capabilities' }
          else { 'DESCONHECIDA' }
  $ncam = ([regex]::Matches($t,'<Name>')).Count
  '{0,-32} {1,8} bytes  raiz=<{2}>  nomes={3}' -f $f.Name, $f.Length, $raiz, $ncam
}
```

E manda o pacote completo, agora com dezoito XML:

```powershell
Compress-Archive -Path .\dgt_*.xml, .\headers*.txt -DestinationPath .\CSREPCDouro_fixtures_v2_CLD.zip -Force
```

Anexa o `CSREPCDouro_fixtures_v2_CLD.zip`. Interessa-me sobretudo ver como o EFFIS declara as dimensões temporais e se o `bdg` do ICNF tem árvore aninhada a mais de dois níveis — as duas coisas que ainda não estão representadas nos fixtures da DGT.

---

## C. Abreu

*[Imagem — transcrição de `1788166561258_image.png`]*

```
PS C:\estacao_pea> foreach ($f in Get-ChildItem .\dgt_icnf_*.xml, .\dgt_effis_*.xml | Sort-Object Name) {
>>   $t = Get-Content $f -Raw
>>   $raiz = if     ($t -match '<\s*ServiceExceptionReport') { 'ServiceExceptionReport' }
>>           elseif ($t -match '<\s*WMS_Capabilities')       { 'WMS_Capabilities' }
>>           elseif ($t -match '<\s*WMT_MS_Capabilities')    { 'WMT_MS_Capabilities' }
>>           else { 'DESCONHECIDA' }
>>   $ncam = ([regex]::Matches($t,'<Name>')).Count
>>   '{0,-32} {1,8} bytes  raiz=<{2}>  nomes={3}' -f $f.Name, $f.Length, $raiz, $ncam
>> }
dgt_effis_wms111.xml                98635 bytes  raiz=<WMT_MS_Capabilities>  nomes=130
dgt_effis_wms130.xml               104545 bytes  raiz=<WMS_Capabilities>  nomes=130
dgt_icnf_areas_ardidas_wms111.xml   34457 bytes  raiz=<WMT_MS_Capabilities>  nomes=42
dgt_icnf_areas_ardidas_wms130.xml   42474 bytes  raiz=<WMS_Capabilities>  nomes=42
dgt_icnf_bdg_wms111.xml            254752 bytes  raiz=<WMT_MS_Capabilities>  nomes=373
dgt_icnf_bdg_wms130.xml            365579 bytes  raiz=<WMS_Capabilities>  nomes=385
PS C:\estacao_pea>
```

---

## Claude

Seis em seis, raízes correctas, zero excepções. E há aqui já três coisas a saltar à vista antes de eu ver o conteúdo:

**O `icnf_bdg` tem 385 nomes em 1.3.0 e 373 em 1.1.1.** Doze camadas que existem numa versão e não na outra. É o mesmo padrão do `serie1_COS`, mas ao contrário — desta vez é o 1.3.0 que publica a mais. Vale a pena saber quais são as doze, porque uma delas pode ser exactamente a que interessa.

**385 camadas num só serviço.** Confirma o que dizia: enumeração está fora de questão. Isso é um menu que ninguém navega num PCO.

**O EFFIS tem 130 nomes nas duas versões**, o que é consistente, mas cresce 6 KB de 1.1.1 para 1.3.0 com o mesmo número de camadas. A diferença deve estar nas dimensões temporais — que é precisamente o que quero ver.

Empacota os dezoito e manda:

```powershell
Compress-Archive -Path .\dgt_*.xml, .\headers*.txt -DestinationPath .\CSREPCDouro_fixtures_v2_CLD.zip -Force
```

O ficheiro fica em `C:\estacao_pea\CSREPCDouro_fixtures_v2_CLD.zip`. Deve rondar os 150 KB comprimidos.

Quando chegar, digo-te quais são as doze camadas fantasma do ICNF, como o EFFIS declara o `TIME`, e qual é a lista branca que eu recomendaria para o Douro — que é, no fim, a única coisa que o operador vai ver.

---

## C. Abreu

*[Ficheiro anexado: `CSREPCDouro_fixtures_v2_CLD.zip`]*

servido

---

## Claude

*[Extraiu e analisou os dezoito ficheiros.]*

Servido, e dissecado. Isto é a melhor colheita das duas.

## As seis camadas fantasma

Não são doze — são seis, e é o pior conjunto possível:

```
perigosidade_conjuntural_2021 ... 2026
```

**A cartografia de perigosidade conjuntural de incêndio existe em WMS 1.3.0 e não existe em 1.1.1.** Em 1.1.1 o ICNF só publica a `perigosidade_estrutural_2020_2030`, que é o plano decenal, não a leitura do ano.

Cruza isto com o achado anterior e tens uma contradição que decide arquitectura:

- A **COS2018** da DGT só é requisitável em **1.1.1**.
- A **perigosidade conjuntural 2026** do ICNF só é requisitável em **1.3.0**.

Não há uma versão de protocolo que sirva a Estação PEA. O interpretador tem de suportar as duas em simultâneo, com a versão fixada **por camada**, não por serviço nem por aplicação. Isso não é uma opção de configuração — é um requisito estrutural que muda o modelo de dados do catálogo.

## O EFFIS não fala PT-TM06

CRS declarados: `EPSG:3034`, `EPSG:3035`, `EPSG:3857`, `EPSG:4326`, `EPSG:900913`. **Nenhum `EPSG:3763`.**

Todos os serviços portugueses — DGT e ICNF — dão 3763 nativo. O EFFIS não. Se quiseres sobrepor o FWI europeu ou os focos VIIRS ao teu enquadramento em PT-TM06, tens de reprojectar, e o candidato realista é passar tudo a `EPSG:3857`, com a distorção que isso traz a 41° de latitude. Vale a pena questionar se compensa: o `mf010.fwi` é do Météo-France a 0,1°, ou seja cerca de 11 km. Já discutimos que 15 km é inadequado para o vale do Douro; 11 km não é materialmente melhor.

E, para rir um pouco: o EFFIS declara `epsg:3035` e `epsg:4326` **em minúsculas**, ao lado das versões em maiúsculas. Os códigos CRS são sensíveis à caixa na norma. Um `Set` ingénuo vê quatro sistemas onde há dois. Traz também `EPSG:900913`, o pseudo-código obsoleto do Google Mercator, que ninguém devia publicar desde 2008.

## Dimensões temporais: dois modelos incompatíveis

21 das 67 camadas do EFFIS têm eixo temporal. E declaram-no de forma completamente diferente conforme a versão.

Em 1.3.0, o valor está no próprio elemento:
```xml
<Dimension name="time" units="ISO8601" default="2019-01-01" nearestValue="0">2018-01-01/2099-12-31</Dimension>
```

Em 1.1.1, o `<Dimension>` é vazio e o valor vive num `<Extent>` separado:
```xml
<Dimension name="time" units="ISO8601"/>
<Extent name="time" default="2019-01-01" nearestValue="0">2018-01-01/2099-12-31</Extent>
```

Um interpretador que só olhe para `<Dimension>` obtém string vazia em 1.1.1 e conclui que não há eixo temporal. Depois envia GetMap sem `TIME` e recebe o *default* — que em várias camadas é 2019 ou 2020. O operador fica a ver focos de calor de há seis anos convencido de que são de hoje.

Isto é, de longe, o defeito mais perigoso de todos os que encontrámos. Os outros dão erro ou dão branco. Este dá um mapa plausível e errado.

## Ruído do ICNF

- **`habitats_zec_norte` aparece duas vezes** no mesmo documento, com o mesmo nome. Qualquer `Map` ou dicionário indexado por `Name` perde silenciosamente uma delas.
- **Prefixação inconsistente:** `areas_ardidas`, `perigosidade_conjuntural_2026` sem prefixo, mas `BDG:ardida_2025`, `BDG:tpgi_2023`, `BDG:perigosidade_incendio` com prefixo de workspace. No mesmo serviço. Não há regra dedutível — é lista branca ou nada.
- **`LegendURL` da camada 2026 aponta para a legenda da 2025.** Erro de configuração do ICNF, provavelmente copiar-colar na criação do estilo do ano novo.
- Os endereços internos apontam para `http://si.icnf.pt/geoserverplinia/...` — HTTP simples, como no ortos2018. Mesma promoção necessária.

## A lista branca que eu recomendaria para o Douro

| Camada | Serviço | Versão | Porquê |
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

Nove camadas de 385 disponíveis. Todas em `EPSG:3763`. Nenhuma com eixo temporal, o que significa que podes adiar o suporte a dimensões — mas tens de o **detectar e recusar** a camada em vez de a servir com o *default*.

Ficaria de fora o EFFIS inteiro, por causa do CRS e da resolução. Se algum dia entrar, entra como camada de contexto europeu, não como fonte de decisão táctica.

---

Queres que passe isto a documento d-série actualizado com as dezoito capturas, ou preferes que ataque já a suíte de testes t-série? Para a segunda preciso de ver o interpretador que o Code escreveu.

---

## C. Abreu

*[Ficheiro anexado: `CSREPCDouro_r0066_202608310107_EstacaoPEA_CLD.html`]*

esta é a última versão

---

## Claude

*[Inspeccionou o ficheiro da aplicação — 782 333 bytes, 12 570 linhas — e localizou o interpretador cartográfico.]*

Errei o protocolo. E vale a pena dizê-lo antes de mais nada.

O interpretador que o Code escreveu é **WMTS 1.0.0**, não WMS. Linha 6364:

```js
if(!raiz || raiz.localName !== "Capabilities")
  throw new Error("Não é um GetCapabilities de WMTS (raiz «"+…+"»).");
```

Os meus dezoito fixtures têm raiz `WMS_Capabilities` ou `WMT_MS_Capabilities`. Todos, sem excepção, vão pela via de excepção. A análise que te entreguei é correcta e não serve para nada neste módulo. Quando escreveste "GetCapabilities verdadeiro da DGT", assumi WMS porque foi o que a pesquisa devolveu primeiro, e não confirmei contra o código. Falha minha, e do tipo que te avisei sobre presumir informação não documentada.

## Mas há aqui um problema maior que o meu erro

Lê o que a tua própria aplicação diz, no comentário do módulo:

> *"Muita cartografia oficial portuguesa vem em ETRS89 / PT-TM06 (EPSG:3763). Desenhá-la com a aritmética de Mercator punha tudo no sítio errado, e em silêncio."*

E depois lê a `wmtsCompativel()`:

```js
const mercator = conjunto.crs === "EPSG:3857" || conjunto.crs === "EPSG:900913"
  || /GoogleMapsCompatible/i.test(conjunto.escalaConhecida||"");
if(!mercator)
  return nada("está em "+(conjunto.crs||"…")+" — o mapa desenha em Web Mercator…");
```

O módulo diagnostica o problema com precisão e depois recusa-se a resolvê-lo.

Segundo o registo de camadas do JOSM para Portugal, o WMTS da DGT em `cartografia.dgterritorio.gov.pt/ortos2018/service` publica a camada `Ortos2018-RGB` num conjunto de matrizes chamado **`PTTM_06`**, com as projecções `EPSG:3763` e `EPSG:4258` declaradas. Não `EPSG:3857`.

Se isso se confirmar na captura, a consequência é directa: **o único WMTS oficial português que interessa vai ser lido com sucesso e recusado a seguir**, com uma mensagem correcta e inútil. O operador vê "está em EPSG:3763" e não tem alternativa nenhuma no mesmo serviço.

Isso não é um defeito do interpretador. É uma decisão de arquitectura do motor de mapa que ninguém tomou explicitamente: o mapa desenha em Web Mercator, logo a cartografia oficial portuguesa está fora. Num PCO do Douro, isso significa ortofotos do OSM ou de terceiros em vez das da DGT.

## O que preciso agora

Captura o WMTS a sério. O MapProxy serve WMS e WMTS no mesmo endereço, só muda o `service=`:

```powershell
$wmts = [ordered]@{
  'dgt_ortos2018'   = 'https://cartografia.dgterritorio.gov.pt/ortos2018/service'
  'dgt_ortos2021'   = 'https://cartografia.dgterritorio.gov.pt/wms/ortos2021'
  'dgt_ortosat2023' = 'https://ortos.dgterritorio.gov.pt/wms/ortosat2023'
  'icnf_bdg'        = 'https://si.icnf.pt/wms/bdg'
}
foreach ($k in $wmts.Keys) {
  curl.exe -L --compressed -s -D "headers_wmts_${k}.txt" -o "wmts_${k}.xml" `
    "$($wmts[$k])?service=WMTS&request=GetCapabilities&version=1.0.0"
  $t = Get-Content "wmts_${k}.xml" -Raw
  $raiz = if ($t -match '<\s*(?:\w+:)?Capabilities') { 'Capabilities' }
          elseif ($t -match 'ServiceException|ExceptionReport') { 'EXCECAO' }
          else { 'OUTRA' }
  $tms = ([regex]::Matches($t,'<(?:\w+:)?TileMatrixSet>')).Count
  '{0,-18} {1,7} bytes  raiz={2}  matrizes={3}' -f $k, (Get-Item "wmts_${k}_.xml" -EA 0).Length, $raiz, $tms
}
```

Tenta também a variante RESTful, que o MapProxy costuma expor e que o teu interpretador prefere por causa do `ResourceURL`:

```powershell
curl.exe -L --compressed -s -o wmts_ortos2018_rest.xml `
  "https://cartografia.dgterritorio.gov.pt/ortos2018/service/wmts/1.0.0/WMTSCapabilities.xml"
```

Aviso honesto: tentei ir buscar o WMTS do ortos2018 daqui e recebi **HTTP 500** nas duas tentativas. Pode ser bloqueio ao meu agente, pode ser o serviço em baixo, pode ser sintaxe de parâmetros. Da tua rede, com o `curl.exe`, saberás em trinta segundos qual das três.

Manda-me os que responderem. Se confirmarmos o `PTTM_06`, a conversa deixa de ser sobre interpretadores e passa a ser sobre se o motor de mapa da Estação PEA aceita ou não trabalhar em EPSG:3763 — que é uma decisão bem mais cara e que tens de tomar antes de o Code construir mais nada por cima.

---

## C. Abreu

*[Imagem — transcrição de `1788167124203_image.png`]*

```
PS C:\estacao_pea> foreach ($k in $wmts.Keys) {
>>   curl.exe -L --compressed -s -D "headers_wmts_${k}.txt" -o "wmts_${k}.xml" `
>>     "$($wmts[$k])?service=WMTS&request=GetCapabilities&version=1.0.0"
>>   $t = Get-Content "wmts_${k}.xml" -Raw
>>   $raiz = if ($t -match '<\s*(?:\w+:)?Capabilities') { 'Capabilities' }
>>           elseif ($t -match 'ServiceException|ExceptionReport') { 'EXCECAO' }
>>           else { 'OUTRA' }
>>   $tms = ([regex]::Matches($t,'<(?:\w+:)?TileMatrixSet>')).Count
>>   '{0,-18} {1,7} bytes  raiz={2}  matrizes={3}' -f $k, (Get-Item "wmts_${k}_.xml" -EA 0).Length, $raiz, $tms
>> }
dgt_ortos2018            0 bytes  raiz=Capabilities  matrizes=2
Get-Content : Cannot find path 'C:\estacao_pea\wmts_dgt_ortos2021.xml' because it does not exist.
At line:4 char:8
+   $t = Get-Content "wmts_${k}.xml" -Raw
+        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\estacao_pea\wmts_dgt_ortos2021.xml:String) [Get-Content], ItemNotFoundException
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand

Exception calling "Matches" with "2" argument(s): "O valor não pode ser nulo.
Nome do parâmetro: input"
At line:8 char:3
+   $tms = ([regex]::Matches($t,'<(?:\w+:)?TileMatrixSet>')).Count
+   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (:) [], MethodInvocationException
    + FullyQualifiedErrorId : ArgumentNullException

dgt_ortos2021            0 bytes  raiz=OUTRA  matrizes=2
Get-Content : Cannot find path 'C:\estacao_pea\wmts_dgt_ortosat2023.xml' because it does not exist.
[...]
dgt_ortosat2023          0 bytes  raiz=OUTRA  matrizes=2
icnf_bdg                 0 bytes  raiz=EXCECAO  matrizes=0
PS C:\estacao_pea>
```

---

## Claude

Dois erros meus nesse bloco: escrevi `wmts_${k}_.xml` com um traço-baixo a mais (daí os `0 bytes` em tudo), e não reinicializei o `$t`, pelo que quando o `curl` não criava ficheiro o PowerShell reutilizava o conteúdo da iteração anterior. As colunas `raiz` e `matrizes` das linhas 2 e 3 são ecos da linha 1. Ignora-as.

Mas o essencial passou:

**O `ortos2018` respondeu como WMTS.** Raiz `Capabilities`, e duas ocorrências de `TileMatrixSet` — que é a assinatura de **um único conjunto de matrizes** (uma na definição, outra no `TileMatrixSetLink` da camada). Um só conjunto. Se for o `PTTM_06`, não há alternativa em Mercator no mesmo serviço, e a `wmtsCompativel()` recusa-o sem apelo.

Também confirma que o HTTP 500 que apanhei era bloqueio ao meu lado, não serviço em baixo. Da tua rede responde.

Os outros três: `ortos2021` e `ortosat2023` não produziram ficheiro (não falam WMTS naqueles endereços), e o `icnf_bdg` devolveu excepção. Esperado — GeoServer só serve WMTS num caminho `/gwc/service/wmts`, não no `/wms`.

Corre esta versão corrigida:

```powershell
$wmts = [ordered]@{
  'dgt_ortos2018'   = 'https://cartografia.dgterritorio.gov.pt/ortos2018/service'
  'dgt_ortos2021'   = 'https://cartografia.dgterritorio.gov.pt/wms/ortos2021'
  'dgt_ortosat2023' = 'https://ortos.dgterritorio.gov.pt/wms/ortosat2023'
  'icnf_gwc'        = 'https://si.icnf.pt/geoserverplinia/gwc/service/wmts'
}
foreach ($k in $wmts.Keys) {
  $out = "wmts_$k.xml"
  if (Test-Path $out) { Remove-Item $out -Force }
  $code = curl.exe -L --compressed -s -D "headers_wmts_$k.txt" -o $out -w '%{http_code}' `
    "$($wmts[$k])?service=WMTS&request=GetCapabilities&version=1.0.0"
  if (Test-Path $out) {
    $t = Get-Content $out -Raw
    $raiz = if ($t -match '<\s*(?:\w+:)?Capabilities') { 'Capabilities' }
            elseif ($t -match 'ServiceException|ExceptionReport') { 'EXCECAO' }
            else { 'OUTRA' }
    $tms = ([regex]::Matches($t,'<(?:\w+:)?TileMatrixSet>')).Count
    '{0,-18} HTTP {1}  {2,7} bytes  raiz={3}  TileMatrixSet={4}' -f $k, $code, (Get-Item $out).Length, $raiz, $tms
  } else {
    '{0,-18} HTTP {1}  (sem ficheiro)' -f $k, $code
  }
}
```

E a variante RESTful, que é a que o teu interpretador prefere por causa do `ResourceURL`:

```powershell
curl.exe -L --compressed -s -o wmts_ortos2018_rest.xml `
  "https://cartografia.dgterritorio.gov.pt/ortos2018/service/wmts/1.0.0/WMTSCapabilities.xml"
Get-Item wmts_ortos2018_rest.xml -EA 0 | Select-Object Name, Length
```

Depois manda-me só isto:

```powershell
Compress-Archive -Path .\wmts_*.xml, .\headers_wmts_*.txt -DestinationPath .\CSREPCDouro_fixtures_wmts_CLD.zip -Force
```

É o ficheiro `wmts_dgt_ortos2018.xml` que decide a questão. Com ele digo-te exactamente qual é o `TileMatrixSet`, se o teu interpretador o lê inteiro, e se o motor de mapa o vai aceitar ou mandar embora.

---

## C. Abreu

*[Imagem — transcrição de `1788167227334_image.png`]*

```
PS C:\estacao_pea> $wmts = [ordered]@{
>>   'dgt_ortos2018'   = 'https://cartografia.dgterritorio.gov.pt/ortos2018/service'
>>   'dgt_ortos2021'   = 'https://cartografia.dgterritorio.gov.pt/wms/ortos2021'
>>   'dgt_ortosat2023' = 'https://ortos.dgterritorio.gov.pt/wms/ortosat2023'
>>   'icnf_gwc'        = 'https://si.icnf.pt/geoserverplinia/gwc/service/wmts'
>> }
PS C:\estacao_pea> foreach ($k in $wmts.Keys) {
>>   $out = "wmts_$k.xml"
>>   if (Test-Path $out) { Remove-Item $out -Force }
>>   $code = curl.exe -L --compressed -s -D "headers_wmts_$k.txt" -o $out -w '%{http_code}' `
>>     "$($wmts[$k])?service=WMTS&request=GetCapabilities&version=1.0.0"
>>   if (Test-Path $out) {
>>     $t = Get-Content $out -Raw
>>     $raiz = if ($t -match '<\s*(?:\w+:)?Capabilities') { 'Capabilities' }
>>             elseif ($t -match 'ServiceException|ExceptionReport') { 'EXCECAO' }
>>             else { 'OUTRA' }
>>     $tms = ([regex]::Matches($t,'<(?:\w+:)?TileMatrixSet>')).Count
>>     '{0,-18} HTTP {1}  {2,7} bytes  raiz={3}  TileMatrixSet={4}' -f $k, $code, (Get-Item $out).Length, $raiz, $tms
>>   } else {
>>     '{0,-18} HTTP {1}  (sem ficheiro)' -f $k, $code
>>   }
>> }
dgt_ortos2018      HTTP 200    10387 bytes  raiz=Capabilities  TileMatrixSet=2
dgt_ortos2021      HTTP 200      690 bytes  raiz=OUTRA  TileMatrixSet=0
dgt_ortosat2023    HTTP 200      646 bytes  raiz=OUTRA  TileMatrixSet=0
icnf_gwc           HTTP 200      509 bytes  raiz=EXCECAO  TileMatrixSet=0
PS C:\estacao_pea>
```

---

## Claude

Agora está limpo, e o resultado é claro: **há um único WMTS na lista.** O `ortos2018` com 10 387 bytes e raiz `Capabilities`. Os outros três devolvem HTTP 200 com 500-700 bytes — são excepções OGC disfarçadas de sucesso, exactamente a armadilha que documentámos.

Repara que `dgt_ortos2021` e `dgt_ortosat2023` aparecem como `raiz=OUTRA` e não como `EXCECAO`. O meu regex procura `ServiceException|ExceptionReport` e não apanhou — o MapServer usa outra designação. Vale a pena ver o que dizem, são três linhas:

```powershell
Get-Content .\wmts_dgt_ortosat2023.xml | Select-Object -First 6
Get-Content .\wmts_icnf_gwc.xml | Select-Object -First 6
```

Tenta também a variante RESTful, que é a que o interpretador do Code prefere:

```powershell
curl.exe -L --compressed -s -o wmts_ortos2018_rest.xml -w '%{http_code}%{content_type}' `
  "https://cartografia.dgterritorio.gov.pt/ortos2018/service/wmts/1.0.0/WMTSCapabilities.xml"
```

E depois manda:

```powershell
Compress-Archive -Path .\wmts_*.xml, .\headers_wmts_*.txt -DestinationPath .\CSREPCDouro_fixtures_wmts_CLD.zip -Force
```

Quero abrir o `wmts_dgt_ortos2018.xml` na íntegra, porque duas ocorrências de `TileMatrixSet` significam um só conjunto — e é a identidade desse conjunto que decide se a Estação PEA consegue mostrar ortofotos oficiais portuguesas ou se fica dependente de cartografia de terceiros. Se for `PTTM_06`, o teu módulo de mapa tem uma decisão de arquitectura pendente que ninguém tomou, e é bem mais cara do que qualquer correcção de interpretador.

---

## C. Abreu

*[Ficheiro anexado: `CSREPCDouro_fixtures_wmts_CLD.zip`]*

---

## Claude

*[Extraiu e leu integralmente as cinco respostas WMTS, e traçou o código do r0066 contra o documento válido.]*

Confirmado, e é pior do que eu tinha antecipado.

## O veredicto

```xml
<TileMatrixSet>
  <ows:Identifier>PTTM_06</ows:Identifier>
  <ows:SupportedCRS>EPSG:3763</ows:SupportedCRS>
  <TileMatrix>
    <ows:Identifier>00</ows:Identifier>
    <ScaleDenominator>8579799.10714</ScaleDenominator>
    <TopLeftCorner>-170000.0 290000.0</TopLeftCorner>
```

Um único conjunto. Vinte níveis, 00 a 19, mosaicos de 256×256, origem em (-170000, 290000) metros PT-TM06. Sem `WellKnownScaleSet`. Nenhuma alternativa em Mercator.

Segui o teu código à mão:

- `lerCapacidadesWMTS()` **lê-o na perfeição.** A guarda do `TileMatrixSetLink` sem matrizes funciona. Identificador, formatos, estilo, elo, caixa WGS84 — tudo correcto. O interpretador do Code está bem escrito.
- `wmtsCRS("EPSG:3763")` devolve `EPSG:3763`. Correcto.
- `wmtsCompativel()` → `mercator` é falso → **recusa**, com a mensagem "está em EPSG:3763 — o mapa desenha em Web Mercator".

E mesmo que passasse o teste do CRS, morria três linhas abaixo: a verificação exige que a origem seja `|20037508|`, e aqui é `-170000 / 290000`.

O único WMTS oficial português é lido com sucesso e deitado fora. O código não tem bug nenhum — tem uma decisão de arquitectura tomada por omissão.

## A tabela que decide

Compilei os CRS de tudo o que capturámos:

| Fonte | EPSG:3763 | EPSG:3857 |
|---|:---:|:---:|
| DGT geo2 (altimetria, CAOP, COS, MAF) | sim | sim |
| DGT OrtoSat2023 WMS | sim | sim |
| DGT Ortos2018 WMS | sim | sim |
| DGT Ortos2018 **WMTS** | sim | **não** |
| ICNF bdg (perigosidade, TPGI, locais críticos) | sim | **não** |
| ICNF áreas ardidas | sim | **não** |
| EFFIS | **não** | sim |

**EPSG:3763 é o único sistema partilhado por todas as fontes oficiais portuguesas.** O Web Mercator serve a DGT e não serve o ICNF. Não há sistema que sirva o ICNF e o EFFIS ao mesmo tempo.

A Estação PEA está construída sobre o único sistema que exclui a cartografia de perigosidade de incêndio do ICNF. Numa aplicação de comando de incêndios florestais.

## Há uma saída barata, e não é a certa

O MapProxy do `ortos2018` serve **WMS** no mesmo endereço e declara `EPSG:3857`. Podias pedir `GetMap` em Mercator e ele reprojecta do lado do servidor. Ortofotos oficiais da DGT, alinhadas com o teu motor actual, sem tocar em nada.

Resolve a DGT. Não resolve o ICNF, que não publica 3857 em lado nenhum. Ou seja: comprava-te a base visual e continuava a deixar de fora a perigosidade conjuntural 2026, as áreas ardidas e os locais críticos — que é a informação que efectivamente altera decisões tácticas.

## O que eu faria, e com convicção

Passar o motor de mapa a **EPSG:3763**, com o `PTTM_06` como grelha nativa.

A objecção instintiva é que dá muito trabalho. Não dá — a matemática fica **mais simples**, não mais complexa. O Mercator obriga a `log(tan(...))`; um plano projectado é aritmética linear:

```
resolucao = escalaDenominador × 0.00028          // metros por pixel
x = (E - (-170000)) / (resolucao × 256)
y = (290000 - N) / (resolucao × 256)
```

Sem funções transcendentes, sem singularidade nos pólos, sem distorção de escala com a latitude — e no Douro, a 41°N, o Mercator já anda a inflacionar distâncias em cerca de 32%. Para leitura de declives e distâncias operacionais isso não é irrelevante.

O que custa mesmo é o resto: tudo o que hoje assume `{z}/{x}/{y}` do OSM, as camadas do Overpass, o módulo topográfico, os mosaicos guardados no dispositivo. É trabalho real e é onde a decisão tem peso.

Mas repara no que o teu próprio código já diz, no comentário do módulo, escrito antes de sabermos nada disto:

> *"Muita cartografia oficial portuguesa vem em ETRS89 / PT-TM06 (EPSG:3763). Desenhá-la com a aritmética de Mercator punha tudo no sítio errado, e em silêncio — que é o pior modo de errar num mapa operacional."*

O diagnóstico estava certo desde o início. Só faltava a evidência de que não era um caso de fronteira, era o caso normal.

## Achados menores, para não se perderem

- O `ProviderSite` do WMTS aponta para `http://cartografia.dgterritorio.gov.pt:8080/...`. Porta interna a vazar para o exterior. O teu código põe isso no campo `termos` e mostra-o ao operador como ligação — que não abre.
- Todos os `xlink:href` do WMTS vêm em `http://`, incluindo o endereço de `GetTile`. Promoção para HTTPS obrigatória.
- Sem `ResourceURL`, portanto sem modelo RESTful. O teu código cai para KVP, que é o comportamento correcto.
- Os três serviços que falharam devolveram **HTTP 200 com HTML** (`MapServer Message`, "Traditional BROWSE mode requires a TEMPLATE") ou `ows:ExceptionReport`. Nenhum é XML de capacidades e nenhum dá código de erro. O `DOMParser` do teu módulo apanha o HTML como XML mal formado ou lê a raiz errada — a mensagem "Não é um GetCapabilities de WMTS (raiz «HTML»)" é exactamente o que deve acontecer, e acontece.

---

Não avanço mais sem tua decisão, porque as três direcções são incompatíveis:

1. **WMS em 3857 do lado do servidor** — barato, base visual resolvida, ICNF fica de fora.
2. **Motor em 3763** — caro, resolve tudo o que é oficial português, fecha a porta ao EFFIS.
3. **Dois motores** — não faças isto.

Qual queres que desenvolva?

---

## C. Abreu

antes disso preciso de um relatório completo desta conversa, o que foi feito\tentado e resultados, tudo e todos sem alterar uma única virgula

---

## Claude

*[Produziu `CSREPCDouro_202608310914_d_RelatorioSessaoCartografia_CLD.md`.]*

Dezanove secções, tudo registado, incluindo o que correu mal.

Estrutura: ponto de partida, identificação de endereços, as três rondas de captura com os comandos exactos e os resultados literais, as duas análises (WMS da DGT, depois ICNF e EFFIS), a descoberta do protocolo errado, o conteúdo integral do WMTS, o confronto com o código do r0066, a tabela de CRS que decide a questão, as três opções em aberto, os catorze requisitos consolidados, o inventário de ficheiros.

A secção 19 lista os cinco erros que cometi, com o custo de cada um. O terceiro — assumir WMS sem verificar o código — é o que interessa: sete rondas de captura sobre o protocolo errado, produzindo uma análise correcta e inaplicável.

Duas notas de honestidade que ficaram registadas no documento e que convém não perder de vista:

O confronto da secção 14 foi feito **por leitura de código, não por execução**. Tracei a `lerCapacidadesWMTS()` e a `wmtsCompativel()` à mão contra o `wmts_dgt_ortos2018.xml`. Estou confiante na conclusão, mas confiança não é o mesmo que um teste que corre. Se quiseres isso a sério, é uma suíte t-série em jsdom com os 23 fixtures — e aí saberás em vez de acreditares.

E a análise das 18 capturas WMS continua guardada porque pode voltar a ser relevante. Se escolheres a Opção A, passa de arquivo morto a especificação. Se escolheres a B, fica como o registo de porque não seguiste esse caminho.

---

## C. Abreu

já passei o problema ao CODE e ele está a ver a solução, para ti deixo outro problema que é, sem ser a DGT ou o ICNF ou outra qualquer entidade nacional, que entidade internacional nos poderia dar as informações que necessitamos ?

---

## Claude

*[Executou pesquisas web sobre o Copernicus Data Space Ecosystem, o NASA FIRMS e o NASA GIBS.]*

A resposta honesta primeiro: **nenhuma entidade internacional substitui a DGT ou o ICNF** para o que é autoritativo. Limites administrativos, ocupação do solo, perigosidade — isso tem dono legal, e o dono é nacional. Um limite de freguesia vindo do Eurostat não tem valor probatório num registo produzido ao abrigo do Despacho.

Mas essa não é a pergunta certa. A pergunta certa é: **o que fazem os internacionais que nenhum nacional faz?**

E aí a resposta é clara e é uma só coisa: **imagem fresca e detecção em tempo quase real.** As ortofotos da DGT são de 2018 e 2023. São arquivo. Num incêndio activo, o que interessa é o que está a arder agora, e nisso a DGT e o ICNF não jogam.

## A escolha: NASA GIBS

O Global Imagery Browse Services da NASA fornece imagem de satélite global à resolução máxima, através de um WMTS conforme à norma OGC com pedidos em KVP e RESTful, e também de um WMS.

Porque é este e não outro, por ordem de importância para ti:

**Fala exactamente o protocolo que o teu interpretador já implementa.** WMTS 1.0.0. Nada a escrever de novo.

**Tem um ponto de acesso em Web Mercator com `GoogleMapsCompatible`.** O GetCapabilities em KVP está em `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&request=GetCapabilities`, e as camadas de anomalias térmicas VIIRS estão publicadas nesse espaço com o conjunto `GoogleMapsCompatible`. Ou seja: **passa a `wmtsCompativel()` do r0066 sem uma linha alterada.** É, tanto quanto vi, a única fonte cartográfica relevante que hoje funciona com a tua aplicação tal como está.

**Não precisa de chave, de registo, nem de OAuth.** Isto distingue-o de tudo o resto e é decisivo no teu modelo. Uma aplicação em `file://` num VCOC não gere credenciais.

**Tem VIIRS a 375 m em NRT**, incluindo passagem nocturna — `VIIRS_NOAA21_Thermal_Anomalies_375m_Night_v2_NRT` e congéneres —, mais reflectância corrigida em cor verdadeira diária.

O senão, e não é pequeno: **as camadas GIBS têm eixo temporal.** É a mesma dimensão `TIME` que identificámos no EFFIS e que o teu código não modela. O GIBS tem valor por omissão declarado nas capacidades, mas não confies nisso sem testar — é exactamente o modo de falha que classifiquei como o mais perigoso de todos: mapa plausível e desactualizado.

## A ideia que resolve o conflito com o EPSG:3763

Se o Code escolher a Opção B — motor nativo em PT-TM06 —, todas as fontes internacionais ficam de fora, porque nenhuma publica 3763. Parece um beco.

Não é, e a razão é simples: **os focos de calor são pontos, não mosaicos.**

O FIRMS tem uma API de área que aceita uma caixa envolvente e devolve os dados em CSV, com latitude e longitude. Reprojectar pontos de WGS84 para PT-TM06 são quarenta linhas de aritmética de Transversa de Mercator. Reprojectar mosaicos já desenhados é que é impossível — e é a frase que está no comentário do teu próprio código.

Ou seja: a base cartográfica fica oficial e portuguesa em 3763; os focos de calor da NASA entram por cima como camada vectorial, reprojectados no cliente. Sem conflito nenhum. E ganhas uma coisa que os mosaicos não dão — cada foco traz hora de detecção, satélite, potência radiativa e nível de confiança, que podes mostrar em tabela e não só em mancha colorida.

Isto vale a pena passares ao Code antes de ele fechar a decisão.

## Os outros, com as reservas honestas

**Copernicus Data Space Ecosystem (Comissão Europeia / ESA).** Sentinel-2 a 10 m, revisita de cerca de cinco dias. Oferece WMS, WMTS, WFS e WCS, mas o acesso faz-se por um endereço de instância personalizado, fornecido no registo. Credenciais, painel de controlo, unidades de processamento contabilizadas. Imagem muito melhor que a do GIBS, atrito muito maior. Guarda para quando existir servidor no VCOC — aí a instância vive no servidor e não no browser.

**NASA FIRMS.** Melhor detecção que o GIBS em termos de latência, com produtos em tempo ultra-real. Exige um MAP_KEY gratuito e suporta EPSG:4326 e EPSG:3857 ou 900913, com actualização a cada quinze minutos. O limite é de 5000 transacções por intervalo de dez minutos. É a fonte a usar pela via da API de pontos que descrevi acima.

**EFFIS / GWIS (JRC).** Já dissecado. MapServer, sem 3763, FWI a 11 km, dimensão temporal obrigatória. Como contexto europeu, sim. Como fonte de decisão táctica no Douro, não.

**Eurostat GISCO.** Limites NUTS e LAU para toda a Europa, livres. Tecnicamente impecáveis, juridicamente irrelevantes para ti — tens a CAOP.

**Copernicus EMS Rapid Mapping.** Não é um serviço para ligares; é um mecanismo de activação institucional, accionado pelo ponto focal nacional. Em incêndio de grande dimensão produz delimitação de perímetro derivada de satélite em poucas horas. Não entra na Estação PEA como camada — entra como procedimento que o PEA deve saber referenciar.

## O que eu faria

**GIBS em WMTS agora**, porque funciona hoje com o código que tens e resolve a maior lacuna real: a aplicação não tem forma nenhuma de mostrar onde há fogo a arder que não seja alguém a marcar à mão.

**FIRMS por API de pontos a seguir**, porque sobrevive à decisão de CRS seja ela qual for, e traz atributos que uma mancha de mosaico nunca traz.

**Copernicus mais tarde**, quando houver servidor e a gestão de credenciais deixar de ser um problema.

E, já agora, o teste que vale mais do que toda esta conversa: captura o GIBS e passa-o ao interpretador do Code. Se aquilo aceitar, tens a primeira camada externa a funcionar de ponta a ponta, e passas de teoria a prova.

```powershell
curl.exe -L --compressed -s -D headers_gibs.txt -o wmts_gibs_3857.xml `
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0"
Get-Content .\headers_gibs.txt | Select-String 'HTTP/|content-type|access-control'
```

Manda-me o ficheiro e o cabeçalho. Aviso: vai ser grande, talvez alguns megabytes — o GIBS publica mais de mil camadas. O que é, por si só, o teste de stress que faltava.

---

## C. Abreu

*[Ficheiro anexado: `headers_gibs.txt` — 0 bytes]*

---

## Claude

Zero bytes. Não é resposta vazia — é **ausência de resposta**. O `curl` nunca chegou a receber cabeçalhos, o que significa que a ligação falhou antes disso.

Vale a pena reparar num padrão: até agora capturaste de `dgterritorio.gov.pt`, `si.icnf.pt` e `maps.effis.emergency.copernicus.eu` — todos `.pt` ou `.eu`. O `gibs.earthdata.nasa.gov` é o primeiro domínio fora da Europa que tentas. Numa rede da administração pública portuguesa, isso é candidato forte a filtragem, seja por lista branca, seja por inspecção TLS que rebenta a validação do certificado.

Diagnóstico, por ordem de valor informativo:

```powershell
curl.exe -sS -o wmts_gibs_3857.xml -D headers_gibs.txt `
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0"
"exit code: $LASTEXITCODE"
```

O código de saída diz quase tudo:

| Código | Significado | Leitura |
|---|---|---|
| 6 | não resolveu o nome | DNS bloqueado ou sem saída |
| 7 | não conseguiu ligar | firewall a fechar a porta |
| 28 | tempo esgotado | pacotes a cair em silêncio |
| 35 | erro na ligação TLS | inspecção a interferir |
| 60 | certificado não validado | **proxy de inspecção TLS** — o mais provável numa rede institucional |

Depois confirma a camada de rede:

```powershell
Resolve-DnsName gibs.earthdata.nasa.gov | Select-Object Name, Type, IPAddress
Test-NetConnection gibs.earthdata.nasa.gov -Port 443
```

E, se o código for 35 ou 60, o `-v` mostra quem assinou o certificado — se aparecer o nome de um equipamento da rede em vez de uma autoridade pública, está identificado:

```powershell
curl.exe -v -o nul "https://gibs.earthdata.nasa.gov/" 2>&1 | Select-String "subject|issuer|SSL|TLS|Connected"
```

Isto interessa muito para lá do GIBS. Se se confirmar que a rede onde a Estação PEA vai operar filtra domínios fora da UE, isso é um **requisito de arquitectura**, não um contratempo: significa que qualquer fonte externa tem de ser validada contra a rede real do CSREPC e do VCOC antes de entrar no desenho, e que a Starlink do VCOC pode ter comportamento diferente da rede fixa do comando — o que por sua vez significa que a mesma aplicação se comporta de forma diferente conforme o sítio onde está.

E é mais uma entrada para o documento de requisitos técnicos que já tínhamos identificado como necessário.

Corre os três blocos e diz-me o que sai. Se for bloqueio de rede, mudamos de estratégia; se for outra coisa, resolve-se.

---

## C. Abreu

*[Imagem — transcrição de `1788179361259_image.png`]*

```
PS C:\estacao_pea> curl.exe -L --compressed -s -D headers_gibs.txt -o wmts_gibs_3857.xml `
>>    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0"
PS C:\estacao_pea> Get-Content .\headers_gibs.txt | Select-String 'HTTP/|content-type|access-control'
PS C:\estacao_pea> curl.exe -sS -o wmts_gibs_3857.xml -D headers_gibs.txt `
>>    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0"
PS C:\estacao_pea> "exit code: $LASTEXITCODE"
exit code: 0
PS C:\estacao_pea>
```

---

## Claude

Retiro o diagnóstico. `exit code: 0` significa que o `curl` completou a transferência sem erro — não há bloqueio de rede nenhum. Concluí "sem saída para fora da Europa" a partir de um ficheiro de cabeçalhos vazio, e um ficheiro vazio não é prova de falha de ligação. Foi salto lógico meu.

O que sobra é um enigma menor: o `-D` produziu zero bytes nas duas execuções, com a transferência a correr bem. Suspeito de interferência de antivírus ou EDR na escrita do ficheiro secundário, mas é especulação e não vale a pena persegui-la.

Contorna-se pedindo as métricas ao próprio `curl`, sem ficheiro intermédio:

```powershell
curl.exe -sS -L --compressed -o wmts_gibs_3857.xml `
  -w "http=%{http_code}`nbytes=%{size_download}`ntipo=%{content_type}`ntempo=%{time_total}s`n" `
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0"
```

E a pergunta que realmente decide, que é só uma linha:

```powershell
Get-Item .\wmts_gibs_3857.xml | Select-Object Name, Length
```

Se aquilo tiver megabytes, já tens o ficheiro desde a primeira tentativa e estivemos os dois a discutir cabeçalhos enquanto o essencial estava em disco.

Para o CORS, que é o que os cabeçalhos me interessavam, usa `-i` — mete os cabeçalhos no mesmo fluxo, e mostro-te só as primeiras linhas:

```powershell
curl.exe -sS -i -o gibs_cabecalhos.txt `
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0"
Get-Content .\gibs_cabecalhos.txt -TotalCount 25
```

Diz-me o tamanho do XML e ficamos a saber se o GIBS entra ou não.

---

## C. Abreu

*[Imagem — transcrição de `1788179406595_image.png`]*

```
PS C:\estacao_pea> Resolve-DnsName gibs.earthdata.nasa.gov | Select-Object Name, Type, IPAddress

Name                          Type IPAddress
----                          ---- ---------
gibs.earthdata.nasa.gov       CNAME
dmll8gi1vfsad.cloudfront.net     A 99.86.159.23
dmll8gi1vfsad.cloudfront.net     A 99.86.159.61
dmll8gi1vfsad.cloudfront.net     A 99.86.159.49
dmll8gi1vfsad.cloudfront.net     A 99.86.159.97
dmll8gi1vfsad.cloudfront.net   SOA

PS C:\estacao_pea> Test-NetConnection gibs.earthdata.nasa.gov -Port 443

ComputerName     : gibs.earthdata.nasa.gov
RemoteAddress    : 99.86.159.23
RemotePort       : 443
InterfaceAlias   : Wi-Fi
SourceAddress    : 172.20.10.3
TcpTestSucceeded : True

PS C:\estacao_pea>
```

---

## Claude

Rede limpa. DNS resolve, o GIBS está atrás de CloudFront com quatro endereços, e a porta 443 responde. Nada de bloqueio institucional — o meu diagnóstico anterior morre aqui em definitivo.

E há um pormenor que explica tudo: `InterfaceAlias : Wi-Fi`, `SourceAddress : 172.20.10.3`. Essa gama é a que o iPhone atribui em partilha de ligação. Não estás na rede do comando; estás em dados móveis. Toda esta sessão de capturas foi feita fora da rede institucional.

Isso não invalida nada do que capturámos — os documentos são os que a DGT, o ICNF e o EFFIS publicam, independentemente de quem pede. Mas invalida qualquer conclusão sobre acessibilidade. **Não sabemos se a rede do CSREPC Douro deixa sair para `si.icnf.pt`, para o EFFIS ou para a NASA.** E é a rede do CSREPC, e a Starlink do VCOC, que a Estação PEA vai encontrar em serviço.

Fica como tarefa por fazer, e é das que se descobrem no pior momento: repetir três ou quatro destas capturas a partir de um posto da rede do comando, e outra vez a partir do VCOC ligado à Starlink. Se os resultados divergirem, tens um requisito operacional que muda o desenho — a mesma aplicação a comportar-se de maneira diferente conforme o sítio onde está é exactamente o tipo de surpresa que não se quer às três da manhã com um incêndio activo.

Entretanto, a pergunta continua por responder:

```powershell
Get-Item .\wmts_gibs_3857.xml | Select-Object Name, Length
```

O ficheiro está lá desde a primeira tentativa, com o `exit code 0` a confirmá-lo. Diz-me o tamanho.

---

## C. Abreu

*[Imagem — transcrição de `1788179459403_image.png`]*

```
PS C:\estacao_pea> Get-Item .\wmts_gibs_3857.xml | Select-Object Name, Length

Name                Length
----                ------
wmts_gibs_3857.xml 5797572

PS C:\estacao_pea>
```

---

## Claude

**5,8 MB.** Estava lá desde o início. Passámos três rondas a discutir cabeçalhos vazios enquanto o ficheiro já estava em disco — e a culpa é minha, que li um `-D` vazio como falha de rede em vez de perguntar pelo essencial primeiro.

Isto é 558 vezes maior que o WMTS da DGT. E é o teste que faltava, por três razões distintas:

**Volume.** O `DOMParser` do browser vai construir uma árvore com talvez centenas de milhares de nós. Num portátil de posto de comando, com a aplicação já a correr, isso pode congelar o interface por segundos. Não é hipotético — é o tipo de coisa que se mede.

**Enumeração impossível.** Se o `icnf_bdg` com 202 camadas já era inutilizável num menu, mil e tal camadas são absurdas. Confirma o requisito da lista branca de forma definitiva.

**Filtragem.** O teu interpretador percorre *todos* os `TileMatrixSet` e monta objectos para cada camada. Com este ficheiro, a maioria desse trabalho é desperdiçada. O padrão certo passa a ser: filtrar por identificador conhecido durante a travessia, não construir tudo e escolher depois.

Confirma primeiro que é XML de verdade e não uma página de erro gorda:

```powershell
Get-Content .\wmts_gibs_3857.xml -TotalCount 3
([regex]::Matches((Get-Content .\wmts_gibs_3857.xml -Raw),'<Layer>')).Count
Select-String -Path .\wmts_gibs_3857.xml -Pattern 'GoogleMapsCompatible' | Select-Object -First 1
Select-String -Path .\wmts_gibs_3857.xml -Pattern 'VIIRS_NOAA2._Thermal_Anomalies' -AllMatches | Select-Object -First 5
```

Quero saber quantas camadas são, se o `GoogleMapsCompatible` lá está, e se as anomalias térmicas VIIRS aparecem com os identificadores que esperava.

Depois comprime e manda — 5,8 MB de XML devem ficar em menos de 500 KB:

```powershell
Compress-Archive -Path .\wmts_gibs_3857.xml -DestinationPath .\CSREPCDouro_fixture_gibs_CLD.zip -Force
Get-Item .\CSREPCDouro_fixture_gibs_CLD.zip | Select-Object Name, Length
```

Se o ZIP passar dos limites de anexo, corta os primeiros mil e os últimos mil bytes e manda só isso — para o que preciso de ver, chega.

---

## C. Abreu

*[Ficheiro anexado: `CSREPCDouro_fixture_gibs_CLD.zip`]*

---

## Claude

*[Extraiu e analisou o documento de 5 797 572 bytes.]*

Chegou, e é o melhor resultado desta sessão inteira. **O GIBS passa a `wmtsCompativel()` do r0066 sem uma linha alterada.** Segui o teu código contra o documento:

```xml
<ows:SupportedCRS>urn:ogc:def:crs:EPSG:6.18:3:3857</ows:SupportedCRS>
<WellKnownScaleSet>urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible</WellKnownScaleSet>
<TopLeftCorner>-20037508.34278925 20037508.34278925</TopLeftCorner>
<TileWidth>256</TileWidth>
```

O teu `wmtsCRS()` extrai `3857` daquele URN — a expressão `(?:^|[:/])(\d{4,6})$` apanha o último segmento. A verificação de Mercator passa duas vezes: pelo código e pelo `WellKnownScaleSet`. A origem bate ao milímetro com o teu `WMTS_TOPO_3857`. Os mosaicos são 256. E há **10 010 elementos `ResourceURL`**, portanto o modo RESTful que o teu código prefere está disponível.

É a primeira fonte externa que funciona de ponta a ponta com o que já tens.

## O que lá está

1315 camadas, 62 034 nós, 7 conjuntos de matrizes — todos variantes de `GoogleMapsCompatible` em EPSG:3857.

| Conjunto | Camadas | Zoom máximo | Resolução no fundo |
|---|---|---|---|
| Level6 | 821 | 6 | ~2,4 km/px |
| Level7 | 302 | 7 | ~1,2 km/px |
| Level8 | 101 | 8 | ~611 m/px |
| Level9 | 64 | 9 | ~305 m/px |
| Level12 | 22 | 12 | ~38 m/px |
| Level13 | 5 | 13 | ~19 m/px |

Formatos: 1133 em `image/png`, 118 em mosaico vectorial Mapbox, 64 em `image/jpeg`.

As dezoito camadas de anomalias térmicas, todas em Level8:

```
VIIRS_NOAA20_Thermal_Anomalies_375m_All / _Day / _Night
VIIRS_NOAA21_Thermal_Anomalies_375m_All / _Day / _Night
VIIRS_SNPP_Thermal_Anomalies_375m_All   / _Day / _Night
MODIS_Aqua / _Terra / _Combined_Thermal_Anomalies_All / _Day / _Night
```

E cor verdadeira diária em Level9: `VIIRS_NOAA21_CorrectedReflectance_TrueColor` e congéneres.

## O senão que decide o valor operacional

**Zoom máximo 8.** Cerca de 611 metros por pixel. Não podes aproximar mais — os mosaicos acabam ali. Para uma vista de sector num incêndio, isso é grosseiro ao ponto de ser quase inútil como raster.

É honesto da parte da NASA: o sensor VIIRS tem 375 m, publicar níveis mais finos seria inventar. Mas confirma o que já te tinha dito antes de ver isto: **a via certa para os focos de calor é a API de pontos do FIRMS, não o mosaico do GIBS.** O mesmo dado, em vector, sem limite de zoom, com hora de detecção e potência radiativa por foco, e reprojectável para 3763 com quarenta linhas de aritmética.

O GIBS serve para outra coisa: **contexto de escala regional**. Ver, num relance, se o que arde no Douro é um evento isolado ou parte de uma situação que abrange meia Península. Isso a 611 m/px lê-se perfeitamente, e nenhuma fonte nacional to dá.

## As dimensões temporais, outra vez

**1210 das 1315 camadas têm eixo `Time`.** Noventa e dois por cento.

```xml
<Dimension>
  <ows:Identifier>Time</ows:Identifier>
  <ows:UOM>ISO8601</ows:UOM>
  <Default>2026-08-31</Default>
  <Current>false</Current>
  <Value>2025-12-23/2026-08-31/P1D</Value>
</Dimension>
```

O teu interpretador **não lê `Dimension`**. Neste caso concreto safas-te: o `Default` é a data de hoje, porque o GIBS actualiza o valor por omissão para a última data disponível. Pedir sem `TIME` devolve o mais recente, que é o que queres.

Mas isso é sorte, não desenho. Basta uma camada com `Default` fixo numa data antiga para o operador ver dados velhos sem sinal nenhum. E repara nos intervalos: há buracos declarados — `2024-03-25/2025-07-06`, depois salta para `2025-07-08`. Dias sem dados. Um mapa que não distingue "não há detecções" de "não há dados nesse dia" é um mapa que mente por omissão, e num posto de comando isso não é aceitável.

**Requisito:** ler `Dimension`, mostrar a data efectiva ao operador, e distinguir explicitamente ausência de dados de ausência de fogo.

## O que faria a seguir

Passa ao Code o `wmts_gibs_3857.xml` como fixture. É o teste de stress que faltava — 5,8 MB, 1315 camadas, 92% com eixo temporal, `SupportedCRS` em formato URN longo. Se o interpretador aguentar isto e a interface não congelar a construir 1315 objectos, está validado para tudo.

E confirma o tempo real de análise no browser. O `lxml` levou 0,19 s aqui; o `DOMParser` num portátil de posto de comando será várias vezes mais lento, e a construção dos objectos por cima. Se passar de um segundo, precisas de filtrar por lista branca **durante** a travessia em vez de construir tudo e escolher depois.

---

## C. Abreu

faz-me um relatório nas condições do anterior sobre esta parte da conversa para eu lhe passar juntamente com o ficheiro

---

## Claude

*[Produziu `CSREPCDouro_202608311242_d_RelatorioFontesInternacionais_CLD.md`.]*

Doze secções, em continuidade com o anterior — a numeração de requisitos segue no 15 e a de erros no 6, para o Code poder ler os dois seguidos sem confusão.

O que interessa que ele leia primeiro, se tiver pressa:

**Secção 7.** O confronto com o r0066. O GIBS passa a `wmtsCompativel()` sem alterações. É a primeira fonte externa que funciona de ponta a ponta com o código dele.

**Secção 4.** A distinção entre pontos e mosaicos. Se ele escolher o motor em EPSG:3763, isso não fecha a porta aos internacionais como parecia — fecha a porta aos *rasters* internacionais. Focos de calor são pontos e reprojectam-se em quarenta linhas. Isto altera a matemática da decisão que ele tem em mãos.

**Secção 8.1.** O zoom máximo 8 nas anomalias térmicas. 611 m/px é contexto regional, não vista de sector. O mosaico do GIBS não substitui a API de pontos do FIRMS.

**Secção 5.3.** Todas as capturas desta sessão foram feitas em dados móveis, não na rede institucional. Não sabemos se o CSREPC ou a Starlink do VCOC deixam sair para estes domínios. Fica como requisito 19 e é do tipo que se descobre no pior momento possível.

Três coisas que deves manter no radar, e que o relatório assinala mas convém sublinhar:

O confronto da secção 7 foi feito **por leitura de código, não por execução**. Tracei o `wmtsCRS()` e o `wmtsCompativel()` à mão contra o documento. Estou confiante, mas isso não é o mesmo que um teste que corre — e o ficheiro de 5,8 MB existe precisamente para o Code o correr a sério.

A benignidade do `Default` temporal é **sorte, não desenho**. Hoje o GIBS devolve a data de hoje. Uma camada com `Default` fixo e o operador vê passado sem sinal nenhum.

E o volume. 0,19 s no `lxml` de um servidor não diz nada sobre o `DOMParser` de um portátil de posto de comando com a aplicação já carregada. Essa medição tem de ser feita no ambiente real, e o número que sair decide se o catálogo se filtra durante a travessia ou depois dela.

---

## C. Abreu

quero esta conversa toda sem mudar uma única palavra num registo .md

---

## Claude

*[Produziu este documento.]*

---

## Fim do registo
