# Documentação

Quatro tipos de documento, arrumados por natureza e não por data.

## Estado vivo — atualizar, não acumular

| Ficheiro | O que é |
|---|---|
| `ESTADO.md` | O que está feito, em curso e por fazer, e o registo de revisões. **Atualizar no fim de cada sessão** |
| `FONTES.md` | Uma entrada por documento doutrinário citado pela aplicação. Regra de conformidade nova declara aqui a sua fonte |
| `POREXECUTAR.md` | O que está decidido e por fazer, ordenado pelo que se ataca primeiro. Existe porque a lista de tarefas de uma sessão morre com ela |

Não seguem a convenção `CSREPCDouro_rNNNN_...` de propósito: não são entregas, são
documentos que mudam continuamente e não têm revisões.

## Documentos do projeto

Seguem a convenção de nomes. São instantâneos: não se editam depois de escritos, e uma
versão nova é um ficheiro novo.

| Ficheiro | O que é |
|---|---|
| `CSREPCDouro_202608272046_PromptEstacaoPEA_CLD.md` | **A especificação completa.** Arquitetura, estado, subsistema de canais, motor de conformidade, geração do PEA, sistema visual |
| `CSREPCDouro_202608272118_PropostaEvolucao_CLD.md` | Proposta de evolução técnica: camadas de estabilidade, linguagens, correções estruturais |
| `CSREPCDouro_202608272132_PipelineAnalise_CLD.md` | Desenho do pipeline de análise: o que é determinístico e o que precisa de modelo |
| `CSREPCDouro_202608291530_TriagemAnaliseClinica_CLD.md` | Triagem, achado a achado e com a prova em código, da análise clínica externa ao r0050 |
| `202608292108_AnaliseClinicaExterna.pdf` | **Documento externo**, não escrito aqui: a análise clínica à r0051 e à r0057, que abriu a fase de robustecimento. Chegou como `202608292108_Analise_clinica_do_projeto.pdf` e foi renomeado para dizer o que é; o conteúdo não se tocou |
| `CSREPCDouro_202608310914_d_RelatorioSessaoCartografia_CLD.md` | **Relatório da sessão de captura** dos `GetCapabilities` reais, escrito noutra sessão. É o documento que abriu o trabalho de cartografia: diz o que se tentou, o que falhou e porquê, e é dele que veio o §17 com os requisitos do interpretador. As capturas que descreve estão em `tests/fixtures/capacidades/` |
| `CSREPCDouro_202608311242_d_RelatorioFontesInternacionais_CLD.md` | **Continuação do anterior**: que fonte internacional dá o que nenhuma nacional dá. Conclui que é imagem fresca e deteção de fogo ativo, seleciona o NASA GIBS e acrescenta cinco requisitos ao interpretador. Traz a distinção que desbloqueia o impasse do sistema de coordenadas: **os focos de calor são pontos, não mosaicos**, e um ponto reprojeta-se |

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
| `CSREPCDouro_d0002_202608281630_ContratoGestaoPCO_CLD.md` | Arquivado. Escrito a analisar um esboço anterior; o seu autor corrigiu-se. Dele vieram os três acréscimos da v1.2 |
| `exemplos/` | Um ficheiro por envelope que o importador lê, e o validador que os confere |

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
