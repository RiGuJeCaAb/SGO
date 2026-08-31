# Manifesto das capturas de GetCapabilities

Documentos obtidos dos serviços reais por C. Abreu em 31 de agosto de 2026, com `curl`.
São **prova**, e não material de trabalho: um ficheiro editado à mão deixa de o ser. O teste
`tests/capacidades.test.mjs` confere que cada um continua a ter o resumo aqui registado.

Servem dois papéis ao mesmo tempo — proveniência do que o serviço respondeu, e material
contra que o interpretador é exercitado. Os cabeçalhos HTTP estão em `cabecalhos/`, e
entram no mesmo registo de resumos: também eles são prova.

Uma primeira versão deste manifesto dizia que todos os anfitriões abriam o CORS. Não
abrem: nenhuma das seis capturas do ICNF traz `Access-Control-Allow-Origin`, e sem esse
cabeçalho o navegador recusa a resposta antes de o código a ver. Uma página aberta em
`file://` tem origem opaca e não tem como contornar isso. Os serviços do ICNF ficam, por
isso, fora do alcance desta aplicação — incluindo o que responde capacidades válidas. Não
é defeito do interpretador e não se corrige em código.

## O que estas capturas provam

| Facto | Onde se vê |
|---|---|
| Um só WMTS em toda a cartografia oficial procurada | `wmts/` — quatro dos cinco não são WMTS |
| Erro servido com **HTTP 200** e corpo HTML | `wmts_dgt_ortos2021.xml`, `wmts_dgt_ortosat2023.xml` |
| Erro servido com **HTTP 200** e `ows:ExceptionReport` | `wmts_icnf_bdg.xml`, `wmts_icnf_gwc.xml` |
| O WMTS da DGT está em **EPSG:3763**, não em Web Mercator | `wmts_dgt_ortos2018.xml`, conjunto `PTTM_06` |
| A DGT abre o CORS; o ICNF **não o abre em nenhum** dos seus | `cabecalhos/` |

## WMTS

| Ficheiro | Bytes | Raiz | HTTP | Tipo | SHA-256 |
|---|---:|---|---|---|---|
| `wmts_dgt_ortos2018.xml` | 10387 | `Capabilities` | 200 | application/xml | `40b059b54e9a5db3…` |
| `wmts_dgt_ortos2021.xml` | 690 | `HTML` | 200 | text/html | `8126b93b40b48ab1…` |
| `wmts_dgt_ortosat2023.xml` | 646 | `HTML` | 200 | text/html | `6efab83482e6a3ea…` |
| `wmts_icnf_bdg.xml` | 521 | `ExceptionReport` | 200 | application/xml | `423496236e782a51…` |
| `wmts_icnf_gwc.xml` | 509 | `ExceptionReport` | 200 | application/xml | `5aabd9943b34daae…` |

## WMS

Capturados antes de se saber que o interpretador é de WMTS. Não são lidos por este módulo;
ficam porque documentam o que cada fonte oficial publica, e porque a tabela de sistemas de
referência que decidiu a arquitetura saiu deles.

| Ficheiro | Bytes | Raiz | HTTP | SHA-256 |
|---|---:|---|---|---|
| `dgt_altimetria_wms111.xml` | 11514 | `WMT_MS_Capabilities` | 200 | `7fe6386abfe4c189…` |
| `dgt_altimetria_wms130.xml` | 10822 | `WMS_Capabilities` | 200 | `ef631a7c71dd5cd4…` |
| `dgt_caop_continente_wms111.xml` | 22490 | `WMT_MS_Capabilities` | 200 | `fe250b787fda69c4…` |
| `dgt_caop_continente_wms130.xml` | 21964 | `WMS_Capabilities` | 200 | `541fffe9f366733b…` |
| `dgt_cos2018_wms111.xml` | 8961 | `WMT_MS_Capabilities` | 200 | `06c34262c665dee0…` |
| `dgt_cos2018_wms130.xml` | 6554 | `WMS_Capabilities` | 200 | `dacb9bfd53cd1a6e…` |
| `dgt_effis_wms111.xml` | 98635 | `WMT_MS_Capabilities` | 200 | `5a5ebc3ff9e7661c…` |
| `dgt_effis_wms130.xml` | 104545 | `WMS_Capabilities` | 200 | `c2e65189f5d0fffd…` |
| `dgt_icnf_areas_ardidas_wms111.xml` | 34457 | `WMT_MS_Capabilities` | — | `bf3393fca1ac3345…` |
| `dgt_icnf_areas_ardidas_wms130.xml` | 42474 | `WMS_Capabilities` | 200 | `536fa12a99c2320f…` |
| `dgt_icnf_bdg_wms111.xml` | 254752 | `WMT_MS_Capabilities` | 200 | `5b46df04addd0330…` |
| `dgt_icnf_bdg_wms130.xml` | 365579 | `WMS_Capabilities` | 200 | `80b95642fcc961cc…` |
| `dgt_maf_wms111.xml` | 10069 | `WMT_MS_Capabilities` | 200 | `9511fe2351f03a14…` |
| `dgt_maf_wms130.xml` | 7202 | `WMS_Capabilities` | 200 | `224eb26a22f21daa…` |
| `dgt_ortos2018_wms111.xml` | 2805 | `WMT_MS_Capabilities` | 200 | `f9e16753edf5dd9a…` |
| `dgt_ortos2018_wms130.xml` | 3383 | `WMS_Capabilities` | 200 | `dea570b7329b91ee…` |
| `dgt_ortosat2023_wms111.xml` | 9520 | `WMT_MS_Capabilities` | 200 | `0b5772fc9366a5e3…` |
| `dgt_ortosat2023_wms130.xml` | 10541 | `WMS_Capabilities` | 200 | `a0b28e047b427de7…` |
