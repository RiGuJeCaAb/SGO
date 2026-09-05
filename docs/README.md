# Documentação

Quatro tipos de documento, arrumados por natureza e não por data.

## Estado vivo — atualizar, não acumular

| Ficheiro | O que é |
|---|---|
| `ESTADO.md` | O que está feito, em curso e por fazer, e o registo de revisões. **Atualizar no fim de cada sessão** |
| `FONTES.md` | Uma entrada por documento doutrinário citado pela aplicação. Regra de conformidade nova declara aqui a sua fonte |
| `POREXECUTAR.md` | O que está decidido e por fazer, ordenado pelo que se ataca primeiro. Existe porque a lista de tarefas de uma sessão morre com ela |
| `MANUAL.md` | **Como se usa a aplicação**, por tarefa operacional e não por ecrã. Os rótulos que cita são conferidos contra a entrega por `npm run manual`: um botão renomeado faz falhar a montagem |

Não seguem a convenção `CSREPCDouro_rNNNN_...` de propósito: não são entregas, são
documentos que mudam continuamente e não têm revisões.

## Documentos do projeto

Seguem a convenção de nomes. São instantâneos: não se editam depois de escritos, e uma
versão nova é um ficheiro novo.

| Ficheiro | O que é |
|---|---|
| `CSREPCDouro_202608272046_PromptEstacaoPEA_CLD.md` | **A especificação completa.** Arquitetura, estado, subsistema de canais, motor de conformidade, geração do PEA, sistema visual |
| `CSREPCDouro_202608272208_PromptEstacaoPEA_CLD.md` | A especificação alargada nessa noite, com o mapa e a fita do tempo. **Não substitui a de cima**, que continua a ser a fonte de verdade declarada no `CLAUDE.md` |
| `CSREPCDouro_202608280012_PromptEstacaoPEA_CLD.md` | A terceira e mais longa. Mesma condição: é instantâneo de trabalho, não a especificação em vigor |
| `CSREPCDouro_202608272118_PropostaEvolucao_CLD.md` | Proposta de evolução técnica: camadas de estabilidade, linguagens, correções estruturais |
| `CSREPCDouro_202608272132_PipelineAnalise_CLD.md` | Desenho do pipeline de análise: o que é determinístico e o que precisa de modelo |
| `CSREPCDouro_202608291530_TriagemAnaliseClinica_CLD.md` | Triagem, achado a achado e com a prova em código, da análise clínica externa ao r0050 |
| `202608292108_AnaliseClinicaExterna.pdf` | **Documento externo**, não escrito aqui: a análise clínica à r0051 e à r0057, que abriu a fase de robustecimento. Chegou como `202608292108_Analise_clinica_do_projeto.pdf` e foi renomeado para dizer o que é; o conteúdo não se tocou |
| `CSREPCDouro_202608310914_d_RelatorioSessaoCartografia_CLD.md` | **Relatório da sessão de captura** dos `GetCapabilities` reais, escrito noutra sessão. É o documento que abriu o trabalho de cartografia: diz o que se tentou, o que falhou e porquê, e é dele que veio o §17 com os requisitos do interpretador. As capturas que descreve estão em `tests/fixtures/capacidades/` |
| `CSREPCDouro_202608272137_PromptEstacaoPEA_CLD.md` | Quarta versão da especificação dessa noite. Mesma condição das outras: instantâneo de trabalho, não a que está em vigor |
| `CSREPCDouro_202608272151_PromptEstacaoPEA_CLD.md` | Quinta e última dessa noite |
| `CSREPCDouro_202608281200_d_EstadoLinhagemParalela_CLD.md` | **O `ESTADO.md` da linhagem paralela** a 28 de agosto, tal como estava do lado de lá. Não substitui o nosso: é o retrato de como o outro lado via o projeto nessa data |
| `CSREPCDouro_202608281930_d_ExportacaoDeConversa_CLD.json` | **Exportação de uma conversa** onde o projeto foi analisado. Não é documento do projeto: é o registo de onde saíram algumas das decisões. **Limpa a 4 de setembro de 2026**, no dia em que o repositório passou a público: saíram o identificador da conta na plataforma de origem e dois endereços assinados, com chave de acesso embutida, do ficheiro carregado. A conversa ficou inteira; cada valor retirado diz no seu lugar o que era e porquê |
| `CSREPCDouro_202608310900_d_AnaliseGetCapabilitiesDGT_CLD.md` | Análise do `GetCapabilities` da DGT, ficheiro a ficheiro. É o trabalho de detalhe que antecedeu o relatório da sessão de cartografia |
| `CSREPCDouro_202608312145_d_CompositoVentoDeclive_CLD.md` | A composição vetorial de vento e declive, desenvolvida por escrito. É o documento que sustenta o que `betaFogo` faz |
| `CSREPCDouro_202609010900_d_PontoSituacao31AGO26_CLD.md` | **O ponto de situação da linhagem paralela** sobre a sessão de 31 de agosto: o que entregaram, o que absorvemos, os defeitos que deixaram abertos e a ordem que propõem. É o documento a ler antes de retomar |
| `CSREPCDouro_202608311242_d_RelatorioFontesInternacionais_CLD.md` | **Continuação do anterior**: que fonte internacional dá o que nenhuma nacional dá. Conclui que é imagem fresca e deteção de fogo ativo, seleciona o NASA GIBS e acrescenta cinco requisitos ao interpretador. Traz a distinção que desbloqueia o impasse do sistema de coordenadas: **os focos de calor são pontos, não mosaicos**, e um ponto reprojeta-se |
| `CSREPCDouro_202609050220_d_PlanoDeMelhoriasFrontendEBackend_CLD.md` | **A revisão completa da r0097 e o plano que dela sai**: duas varreduras da fonte cruzadas com capturas e medições, dezoito achados altos conferidos um a um, catorze pacotes de trabalho com critério de aceitação, a ordem proposta e um recado pronto a colar para cada ramo. É o documento a ler antes de mexer no frontend ou no backend |

## `interop/` — a ligação à Gestão PCO

Tudo o que descreve a fronteira entre as duas aplicações, mais os ficheiros que a
permitem verificar. Ver `interop/exemplos/LEIAME.md` para o que importa acertar e como
validar uma exportação.

| Ficheiro | Estado |
|---|---|
| `CSREPCDouro_202608281845_EspecificacaoExportacaoJSON_v12_CLD.md` | **Em vigor.** É o que a Gestão PCO deve implementar. Substitui a v1.1 na íntegra |
| `CSREPCDouro_202608301515_ContratoServicoVCOC_v01_CLD.md` | **Proposta.** O contrato do serviço de acompanhamento da VCOC: contas, perfis, sincronização e recibo assinado. É o que o servidor deve implementar |
| `CSREPCDouro_202608271715_EspecificacaoExportacaoJSON_CLD.md` | v1.1, substituída. Continua a ser lida pela Estação, por retrocompatibilidade |
| `CSREPCDouro_202608281700_EspecificacaoExportacaoJSON_v12_PROPOSTA_CLD.md` | A proposta que deu origem à v1.2. Arquivada: o que propunha está no documento em vigor |
| `CSREPCDouro_202608271109_EspecificacaoExportacaoJSON_CLD.md` | v1.0, a primeira. Arquivada |
| `CSREPCDouro_r0001_202608271615_EspecificacaoExportacaoJSON_CLD.md` | A mesma v1.0 carimbada com revisão. Arquivada |
| `CSREPCDouro_202608281930_RecadoDeVolta_CLD.md` | **A resposta da linhagem paralela** sobre o contrato e a especificação. É o outro lado da conversa que produziu a v1.2 |
| `CSREPCDouro_d0002_202608281630_ContratoGestaoPCO_CLD.md` | Arquivado. Escrito a analisar um esboço anterior; o seu autor corrigiu-se. Dele vieram os três acréscimos da v1.2 |
| `exemplos/` | Um ficheiro por envelope que o importador lê, e o validador que os confere |

## `conversas/` — porque é que uma decisão foi tomada

Transcrições integrais das conversas que produziram decisões, vindas da linhagem paralela.
Não são doutrina nem sustentam nada na aplicação. O `ESTADO.md` diz o que se fez; estas dizem
**o que se pesou antes, e o que se recusou fazer**. Ver `conversas/LEIAME.md`.

## `pea-reais/` — os planos de um incêndio a sério

Cinco PEA emitidos no Castedo a 17 de agosto de 2026, no formato oficial, por quem estava no
posto de comando. Não foram produzidos por esta aplicação. Servem para conferir o que ela
emite contra o que se emite mesmo, e para ler o ritmo a que um plano é refeito numa ocorrência
real. Ver `pea-reais/LEIAME.md`. **Não se editam.**

## `cartografia/` — o alvo do mapa

Cartas de uma ocorrência real, anotadas no posto de comando: carta militar, relevo e
satélite do mesmo teatro. Não são doutrina nem prova de verificação — são o que o mapa
operacional tem de conseguir dizer, e a leitura do que ainda lhe falta está em
`cartografia/LEIAME.md`.

## `qa/` — provas de verificação

Capturas de ecrã que acompanham uma revisão e mostram o que ela mudou. Ver `qa/LEIAME.md`.
Não substituem `npm run visual`: servem para o que a auditoria automática não vê, que é se
o que está no ecrã é o que se queria.

## `fontes/` — documentos doutrinários e científicos externos

Os documentos de terceiros que a aplicação cita. Não são do projeto e não se alteram; a
entrada correspondente em `FONTES.md` diz o que deles se usa e o que deliberadamente não
se usa.

Um documento entra aqui **antes** de ser implementado, com a sua entrada em `FONTES.md` a
declarar o que autoriza e o que não autoriza. A ordem importa: escrever primeiro o código e
procurar depois a fonte que o justifique é como nascem os números sem origem.

## Onde acrescentar

- Uma regra de conformidade nova → entrada em `FONTES.md`, e o documento em `fontes/` se
  ainda lá não estiver.
- Uma decisão sobre a ligação à Gestão PCO → `interop/`.
- Uma proposta técnica ou um desenho → raiz de `docs/`, com nome pela convenção.
- Uma captura que prove o que uma revisão mudou → `qa/`, e uma linha em `qa/LEIAME.md`.
- Uma carta anotada de uma ocorrência real → `cartografia/`, e uma linha em `cartografia/LEIAME.md`.
- O que mudou nesta sessão → `ESTADO.md`, sempre.

**Uma linha no catálogo não é boa vontade: é condição.** O `npm run arrumado` percorre `qa/`,
`cartografia/`, `fontes/` e `ferramentas/historico/` e recusa um ficheiro que não tenha nome
de convenção ou que não esteja nomeado no documento que cataloga a pasta. O que a ferramenta
não sabe é se a linha diz a verdade — só garante que existe uma, que é o mínimo para que
alguém possa dar pela mentira.

## Documentos dos ramos

Os documentos que os ramos de conversação entregam, com o número do ramo à cabeça. São
instantâneos contra a revisão que dizem; o que deles entrou na aplicação está no `ESTADO.md`.

| Ficheiro | O que é |
|---|---|
| `006_CSREPCDouro_202609021424_d01_InventarioObrigacoesCodificaveis_CLD.md` | O inventário das obrigações codificáveis do #006 |
| `003_CSREPCDouro_202609050900_d0007_DistanciasEByram_r0093_CLD.md` | Qual distância para cada uso, e a citação de Byram: a constante escondida no `/2`, a altura contra o comprimento da chama, o que está por confirmar na fonte. Integrado na r0103 |
| `004_CSREPCDouro_202609041930_d_ChaveMosaicos_CLD.md` | A chave dos mosaicos sem a carta, demonstrada com bytes, e as três consequências da correção. Integrado na r0099 e na r0103 |
| `005_CSREPCDouro_202609051034_d_MedicoesCatchCI_CLD.md` | As cinco medições de memória das folhas, os 103 `catch` vazios classificados por consequência, e o trabalho de CI com navegador. Integrado na r0103 |
| `006_CSREPCDouro_202609051107_d02_GravidadesDoSinalEInstantesDePrazo_CLD.md` | As palavras da norma para as gravidades do sinal, e os seis instantes de prazo com o seu t=0. Cinco decisões para o dono no fim |
| `CSREPCDouro_202609051745_RelacaoDeMeiosPrePreenchida_CLD.png` | Uma captura do dono com uma ideia por pensar: uma relação de meios pré-preenchida. Não é pedido ainda; fica para se voltar a olhar |
| `CSREPCDouro_202609051745_PrevisualizacaoDoRepositorio_CLD.png` | O modelo da imagem de pré-visualização do repositório no GitHub, tal como chegou à entrada |
