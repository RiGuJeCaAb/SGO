# Registos de conversa

Transcrições integrais das conversas que produziram decisões neste projeto, do lado da
linhagem paralela. **Não são resumos**: cada uma diz, no cabeçalho, que reproduz o texto
palavra por palavra e o que não está lá — imagens de terminal, ficheiros anexos, e as
operações de pesquisa e leitura, assinaladas entre parênteses retos.

Não são doutrina e não sustentam nada na aplicação. Servem para outra coisa: **saber porque
é que uma decisão foi tomada, e o que se recusou fazer ao tomá-la.** Um `ESTADO.md` diz o que
se fez; estes dizem o que se pesou antes.

| Ficheiro | Assunto | O que fica decidido, ou por decidir |
|---|---|---|
| `CSREPCDouro_202609010816_RegistoConversa_PortabilidadeIntegridade_CLD.md` | Passar a aplicação a outro computador, e garantir que ninguém lhe mexe | O ficheiro não se protege: **deteta-se**. Digest do código em memória, carimbo `BUILD NÃO VERIFICADO` em vez de recusa de arranque, e registo de versões com SHA-256 reconhecido pelo comando |
| `CSREPCDouro_202609010817_d0002_MCF_RegistoDaConversa_CLD.md` | Módulo de comportamento do fogo: onde ir buscar o R | O tecto de **6 m/min** declarado por Fernandes (2001), a equação contínua como segunda opinião, e a lista do que pedir à UTAD e à ANEPC |
| `CSREPCDouro_202609010818_Transcricao_SessaoCartografia_CLD.md` | Captura e análise dos `GetCapabilities` reais | O que cada serviço publica mesmo, contra o que a norma diz. É a conversa de onde saiu o §17 |
| `CSREPCDouro_202609010818_RegistoConversaArquiteturaMultiutilizador_CLD.md` | Evolução para multi-utilizador no VCOC | O ficheiro único passa a **modo degradado**, não morre. Três registos distintos — fita do tempo, efetivo do PCO, auditoria — e a razão de não os fundir |
| `001_CSREPCDouro_202609021351_RegistoIntercambioCODE_CLD.md` | Ramo #001 sobre a divisão de trabalho | A regra da **fonte na linha da asserção**, e o argumento de que o `p0018` não é exceção nenhuma |
| `002_CSREPCDouro_202609021350_RegistoDivisaoTrabalho_CLD.md` | Ramo #002 | A regra do **teste vermelho**: todo o defeito reportado vem com um teste que falha |
| `003_CSREPCDouro_202609021346_d0003_MCF_RegistoDaConversa_CLD.md` | Ramo #003, comportamento do fogo | A causa-raiz: **remendava-se o artefacto, não a fonte**. E a especificação antes da construção |
| `004_CSREPCDouro_202609021030_d_DivisaoDeTrabalho_CLD.md` | Ramo #004 | O artefacto de reunião é o HTML compilado, e isso é o contrato |
| `005_CSREPCDouro_202609021346_RegistoConversa_Ramo005_CLD.md` | Ramo #005 | **O script de montagem é o componente de maior risco e não tem revisor** |

## Os ramos, a partir de 2 de setembro

A conversa do lado CLD corre em **cinco ramos independentes**, e a partir de 2 de setembro cada
um identifica-se à cabeça do nome do ficheiro. A identificação existe para eliminar a classe de
erro que produziu quatro colisões de numeração — duas `r0058`, duas `r0074`, dois `p0017`, dois
`p0018` — entre linhagens que partilhavam sequência.

| Ramo | Matéria |
|---|---|
| #001 | Divisão de trabalho; requisitos técnicos do sistema do PCO |
| #002 | Divisão de trabalho; auditoria de proveniência dos coeficientes |
| #003 | Módulo de comportamento do fogo; revisão adversária do tecto de saída |
| #004 | Divisão de trabalho; requisitos técnicos |
| #005 | Portabilidade e integridade; revisão do script de montagem |

**O prefixo é `00N_` e não `#00N`.** Os cinco ramos chegaram a essa conclusão separadamente e
pela mesma razão: `#` inicia comentário em bash e em PowerShell, e é delimitador de fragmento em
URL — um nome não citado parte-se em silêncio nesse ponto. O `#` mantém-se no corpo dos
documentos, onde é texto e não argumento.

### Séries, e quem é dono de cada uma

| Série | Dono | Conteúdo |
|---|---|---|
| `r` | **CODE** | as entregas. Chave de ordenação primária |
| `d`, `t`, `q`, `qa` | os ramos | especificação, testes, verificação visual, evidência |
| `p` | **extinta** | patches ao HTML montado. Deixaram de aplicar quando passou a existir `fonte/` |

A resposta do CODE a estes cinco documentos está em
`docs/CSREPCDouro_202609021600_d_RespostaAosRamos_CLD.md`.

### Registos substituídos

Três dos documentos de 1 de setembro foram reemitidos com identificação de ramo e **ficam
ambos**: o original é o que chegou nesse dia, o reemitido traz o cabeçalho do ramo. O conteúdo
da conversa é o mesmo.

| De 1 de setembro | Reemitido como |
|---|---|
| `..._RegistoConversa_PortabilidadeIntegridade_CLD.md` | `005_..._RegistoConversa_Ramo005_CLD.md` |
| `..._d0002_MCF_RegistoDaConversa_CLD.md` | `003_..._d0003_MCF_RegistoDaConversa_CLD.md` |

## Duas perguntas que ficam em aberto nestes registos

Ambas são **decisões de comando, não técnicas**, e estão à espera de resposta:

1. **Na fita do tempo, as células escrevem diretamente ou propõem para validação por
   Operações?** Direto ganha velocidade e perde a leitura literal do art. 17.º, n.º 1, al. g).
   Validado fica doutrinariamente irrepreensível e mete um gargalo humano num PCO saturado.
2. **As rendições acontecem posto a posto, ou a EPCO roda em bloco?** O ponto (30) do DON
   n.º 2 sugere bloco, e isso faz da passagem de serviço um ato único ao nível do PCO em vez
   de cinco transações independentes.

## O que aqui está e não se deve confundir com decisão tomada

O documento `d0001_MCF_Especificacao` referido no registo do módulo de comportamento do fogo
**não está neste repositório**, e o próprio autor diz, no fim dessa conversa, que a
especificação *«está parcialmente obsoleta à nascença»* — vários coeficientes que dava por
pendentes já estavam fechados na `r0077`, e por via tabular portuguesa em vez do FFMC
canadiano que propunha.
