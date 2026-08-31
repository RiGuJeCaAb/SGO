# Entrada

**A pasta onde se larga o que ainda não tem sítio.** Documentos, capturas, revisões da
linhagem paralela, guiões, cartas, respostas de serviços — o que chegar de fora e ainda não
esteja arrumado põe-se aqui, com o nome que trouxer. Não é preciso escolher a pasta certa
nem renomear nada: é isso que se faz depois.

## Como funciona

1. Descarrega-se o ficheiro para `entrada/`.
2. Diz-se numa sessão que há coisas na entrada.
3. O ficheiro é lido, percebido, e vai para onde pertence — com o nome da convenção
   `CSREPCDouro_rNNNN_AAAAMMDDHHMM_NomeDoFicheiro_CLD.ext` quando é uma entrega, ou com o
   nome próprio da pasta de destino quando não é.
4. A linha do que se fez fica no `docs/ESTADO.md`, e a entrada esvazia-se.

## Para onde vão as coisas

| O que é | Onde acaba |
|---|---|
| Documento doutrinário ou científico citado pela aplicação | `docs/fontes/`, com a chave em `docs/FONTES.md` |
| Revisão da linhagem paralela (`rNNNN`, HTML) | `app/`, com a linha em `app/RESERVADAS.md` |
| Guião que produziu uma revisão (`pNNNN`, `tNNNN`, `qNNNN`) | `ferramentas/historico/` |
| Resposta de um serviço, guardada como prova | `tests/fixtures/capacidades/`, com o resumo em `resumos.json` |
| Carta anotada de uma ocorrência | `docs/cartografia/` |
| Prova de verificação em imagem | `docs/qa/` |
| Documento do projeto, especificação, relatório | `docs/` |

## O que esta pasta não é

Não é arquivo. **Nada fica aqui em definitivo**: o que estiver na entrada está por arrumar,
e uma entrada que não esvazia deixa de dizer o que quer que seja. Também não é caminho de
código — nenhum módulo lê daqui, e a montagem ignora-a.

Ficheiros grandes que só sirvam para uma leitura e não pertençam ao repositório dizem-se em
conversa e saem sem ficar comprometidos.
