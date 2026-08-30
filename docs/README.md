# Documentação

Quatro tipos de documento, arrumados por natureza e não por data.

## Estado vivo — atualizar, não acumular

| Ficheiro | O que é |
|---|---|
| `ESTADO.md` | O que está feito, em curso e por fazer, e o registo de revisões. **Atualizar no fim de cada sessão** |
| `FONTES.md` | Uma entrada por documento doutrinário citado pela aplicação. Regra de conformidade nova declara aqui a sua fonte |

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
| `202608292108_AnaliseClinicaExterna.pdf` | **Documento externo**, não escrito aqui: a análise clínica à r0051 e à r0057, que abriu a fase de robustecimento. Guarda o nome com que chegou |

## `interop/` — a ligação à Gestão PCO

Tudo o que descreve a fronteira entre as duas aplicações, mais os ficheiros que a
permitem verificar. Ver `interop/exemplos/LEIAME.md` para o que importa acertar e como
validar uma exportação.

| Ficheiro | Estado |
|---|---|
| `CSREPCDouro_202608281845_EspecificacaoExportacaoJSON_v12_CLD.md` | **Em vigor.** É o que a Gestão PCO deve implementar. Substitui a v1.1 na íntegra |
| `CSREPCDouro_202608271715_EspecificacaoExportacaoJSON_CLD.md` | v1.1, substituída. Continua a ser lida pela Estação, por retrocompatibilidade |
| `CSREPCDouro_202608281700_EspecificacaoExportacaoJSON_v12_PROPOSTA_CLD.md` | A proposta que deu origem à v1.2. Arquivada: o que propunha está no documento em vigor |
| `CSREPCDouro_d0002_202608281630_ContratoGestaoPCO_CLD.md` | Arquivado. Escrito a analisar um esboço anterior; o seu autor corrigiu-se. Dele vieram os três acréscimos da v1.2 |
| `exemplos/` | Um ficheiro por envelope que o importador lê, e o validador que os confere |

## `qa/` — provas de verificação

Capturas de ecrã que acompanham uma revisão e mostram o que ela mudou. Ver `qa/LEIAME.md`.
Não substituem `npm run visual`: servem para o que a auditoria automática não vê, que é se
o que está no ecrã é o que se queria.

## `fontes/` — documentos doutrinários externos

Os documentos de terceiros que a aplicação cita. Não são do projeto e não se alteram; a
entrada correspondente em `FONTES.md` diz o que deles se usa e o que deliberadamente não
se usa.

## Onde acrescentar

- Uma regra de conformidade nova → entrada em `FONTES.md`, e o documento em `fontes/` se
  ainda lá não estiver.
- Uma decisão sobre a ligação à Gestão PCO → `interop/`.
- Uma proposta técnica ou um desenho → raiz de `docs/`, com nome pela convenção.
- Uma captura que prove o que uma revisão mudou → `qa/`, e uma linha em `qa/LEIAME.md`.
- O que mudou nesta sessão → `ESTADO.md`, sempre.
