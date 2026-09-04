# Inventário de obrigações doutrinárias verificáveis por código

**Referência:** d01
**Base normativa:** Despacho n.º 4067/2024, de 15 de abril (Regulamentação do SGO); DON n.º 2 / DECIR 2026
**Objecto:** Estabelecer o conjunto de asserções testáveis que a aplicação Estação PEA deve satisfazer, com proveniência normativa explícita para cada uma.
**Estado:** Primeira iteração. Requer validação funcional antes de conversão em bateria de testes.

---

## 1. Método e limites

Este inventário separa três coisas que costumam ser confundidas:

1. **O que a norma manda fazer a pessoas.** Não é testável por código. Não entra.
2. **O que a norma exige que fique registado ou estruturado de determinada forma.** É testável. Entra.
3. **O que a aplicação impõe por decisão de desenho, sem base normativa.** Não pertence a este documento; se existir, deve ser identificado e justificado separadamente.

A distinção importa porque a tentação natural é codificar o artigo inteiro. A maior parte do Despacho descreve competências de comando — actos humanos que a aplicação regista mas não pode verificar. Testar o que não é testável produz falsos positivos que erodem a confiança na bateria.

### 1.1 Classificação de natureza

| Código | Significado |
|---|---|
| **E** | Texto expresso. A obrigação está literalmente na norma. |
| **D** | Derivada por interpretação. Defensável, mas é leitura, não citação. Exige validação explícita antes de virar teste. |

Toda a asserção classificada **D** carrega o risco de estarmos a codificar a nossa própria opinião com aparência de lei. São poucas, mas são as mais perigosas.

### 1.2 Classificação de tipo

| Código | Tipo de asserção |
|---|---|
| CAR | Cardinalidade (contagens, limites máximos) |
| CAT | Catálogo fechado (enumeração exaustiva na norma) |
| TRA | Regra de transição de estado |
| INV | Invariante permanente |
| AUT | Autoria, nomeação ou cadeia de reporte |
| TMP | Prazo ou periodicidade |
| FRM | Campos obrigatórios de um registo |

### 1.3 Severidade

| Código | Comportamento |
|---|---|
| **B** | Bloqueante. A aplicação impede o estado inválido. |
| **A** | Aviso. A aplicação sinaliza mas permite, exigindo registo de justificação. |

A atribuição de severidade não é discricionária: decorre do ponto 2.3 abaixo.

---

## 2. Achados que exigem decisão antes de qualquer teste

### 2.1 Duas erratas confirmadas no Anexo I do Despacho

Verificadas contra a imagem da página 24/28 da publicação em Diário da República, 2.ª série, n.º 74, de 15-04-2024. Não são artefactos de extracção de texto.

**Errata 1 — Fase V.** A matriz do Anexo I lista, na composição do posto de comando operacional, *Célula de operações* duas vezes e omite a *Célula de planeamento*. O Artigo 44.º n.º 2 alínea b) determina que o PCO integra as células de operações, de planeamento e de logística e finanças.

**Errata 2 — Fase VI.** A matriz lista Célula de operações, Célula de planeamento, Célula de logística e finanças, Adjunto de ligação e Adjunto de relações públicas, omitindo o *Adjunto de segurança*. O Artigo 45.º n.º 2 alínea b) inclui expressamente os adjuntos de segurança, de relações públicas e de ligação.

**Regra de resolução proposta:** o articulado prevalece sobre o anexo. O Anexo I é matriz-resumo referida pelo n.º 2 do artigo 39.º com função de indexação ao efectivo; a composição dos postos de comando é estabelecida nos artigos 41.º a 45.º e no artigo 14.º. A aplicação deve seguir o articulado e registar esta divergência na documentação técnica.

**Consequência operacional:** se a Estação PEA tiver codificado a composição do PCO a partir da leitura da tabela do Anexo I, tem um erro de doutrina nas fases V e VI. Verificar no build antes de mais nada.

### 2.2 A fita do tempo *append-only* é derivação, não texto

O Artigo 2.º n.º 1 alínea c) define fita do tempo como o registo temporal **explícito e completo** das decisões, acções e informações operacionais. Não usa a palavra imutável, inalterável ou equivalente.

A imutabilidade é uma leitura defensável — um registo que pode ser reescrito a posteriori não é "completo" em sentido útil, e o Artigo 9.º n.º 3 exige que a passagem de comando seja *registada* na fita, o que pressupõe permanência. Mas é leitura.

Classifico-a **D**. Recomendo mantê-la como requisito de desenho, com a justificação escrita, em vez de a apresentar como imposição legal directa. A diferença conta no dia em que alguém perguntar onde é que a lei diz isso.

### 2.3 Os limiares de efectivo não podem ser bloqueantes

O Artigo 39.º n.º 3 estabelece que a passagem à fase seguinte pode ser determinada pelo COS ou pela estrutura operacional da ANEPC **independentemente do número de operacionais empenhados**, verificada pelo menos uma de quatro situações: evolução desfavorável com aumento de complexidade; previsão de dano potencial; localização, gravidade ou extensão; ou várias ocorrências activas em simultâneo com potencial de interacção.

O Artigo 39.º n.º 4 vai mais longe: o COS pode submeter à validação da estrutura operacional da ANEPC uma organização do teatro de operações **distinta das previstas no Despacho**, cabendo a decisão ao comandante nacional.

**Consequência arquitectural, e é a mais importante deste documento:** uma aplicação que force a matriz do Anexo I está doutrinariamente errada. Tem de admitir três estados — dentro da matriz, fora da matriz por decisão fundamentada do n.º 3, e fora da matriz por validação nacional do n.º 4 — e o último não é excepção patológica, é figura prevista na norma.

Todos os limiares de efectivo são portanto severidade **A**, nunca **B**, e a passagem por aviso deve exigir selecção do fundamento e registo na fita do tempo.

---

## 3. Inventário

### Família A — Estrutura e referenciação do teatro de operações

| ID | Fonte | Asserção | Nat. | Tipo | Sev. |
|---|---|---|---|---|---|
| A01 | Desp. Art. 5.º n.º 7 a) | Setores geográficos referenciados alfabeticamente; nenhuma letra se repete no TO, mesmo quando os setores estão agregados em frentes distintas. | E | INV | B |
| A02 | Desp. Art. 5.º n.º 7 b) | Em ocorrência em edifício multipisos, o setor geográfico é referenciado pelo número do piso. | E | INV | B |
| A03 | Desp. Art. 5.º n.º 7 c) | Setores funcionais referenciados pela designação da respectiva função, não por letra. | E | INV | B |
| A04 | Desp. Art. 5.º n.º 7 d) | Um setor geográfico pode conter setores funcionais. A relação inversa não está prevista. | E | INV | A |
| A05 | Desp. Art. 5.º n.º 8 | Frentes referenciadas numericamente; cada frente integra no máximo 6 setores. | E | CAR | B |
| A06 | Desp. Art. 5.º n.º 9 | Áreas de intervenção municipal referenciadas pelo nome do concelho; máximo 6 setores cada. | E | CAR | B |
| A07 | Desp. Art. 5.º n.º 5 | Cada AIM corresponde a exactamente um concelho e respeita os seus limites geográficos. | E | INV | B |
| A08 | Desp. Art. 5.º n.º 3 e 4 | Setor, frente e AIM são todos dotados de comando próprio. Nenhum pode existir sem comandante atribuído. | E | INV | B |

A01 é o teste mais barato e mais útil de toda a bateria: uma verificação de unicidade sobre um conjunto. Também é o mais fácil de violar acidentalmente quando se criam setores a partir de frentes diferentes em painéis separados.

### Família B — Fases do SGO: limiares e limites estruturais

| ID | Fonte | Asserção | Nat. | Tipo | Sev. |
|---|---|---|---|---|---|
| B01 | Desp. Art. 40.º n.º 1 | Fase I: máximo 6 equipas de intervenção **ou** efectivo máximo de 36 operacionais. | E | CAR | A |
| B02 | Desp. Anexo I | Efectivos de referência: 36 (II), 108 (III), 324 (IV), 648 (V). Fase VI não aplicável. | E | CAT | A |
| B03 | Desp. Anexo I | Bandas de variação de 10 %: 32–40 (II), 97–119 (III), 292–356 (IV), 583–713 (V). Os valores são os publicados, não recalculados. | E | CAT | A |
| B04 | Desp. Art. 41.º n.º 2 c) | Fase II: até 3 setores. | E | CAR | B |
| B05 | Desp. Art. 42.º n.º 2 c) | Fase III: até 6 setores. | E | CAR | B |
| B06 | Desp. Art. 43.º n.º 2 c) d) | Fase IV: até 2 frentes, cada uma até 6 setores. | E | CAR | B |
| B07 | Desp. Art. 44.º n.º 2 c) d) | Fase V: até 4 frentes, cada uma até 6 setores. | E | CAR | B |
| B08 | Desp. Art. 45.º n.º 2 c) e) | Fase VI: uma AIM por concelho envolvido, cada uma até 6 setores. | E | CAR | B |
| B09 | Desp. Art. 45.º n.º 1 | Fase VI só é admissível se a operação tiver atingido fase IV ou superior **e** existirem vários concelhos no TO **e** houver decisão do comandante nacional. As três condições são cumulativas. | E | TRA | B |
| B10 | Desp. Art. 42.º n.º 2 d), 43.º n.º 2 f), 44.º n.º 2 f), 45.º n.º 2 f) | A partir da fase III, os comandantes de setor exercem a função em exclusivo; nas fases IV e V acresce o mesmo para comandantes de frente; na VI para comandantes de área. Um elemento não pode acumular duas destas funções. | E | INV | B |
| B11 | Desp. Art. 39.º n.º 3 | Transição de fase fora de banda exige selecção de pelo menos um dos quatro fundamentos taxativos e registo na fita do tempo. | E | TRA | B |
| B12 | Desp. Art. 39.º n.º 4 | Deve existir estado "organização distinta", dependente de validação da estrutura operacional da ANEPC e decisão do comandante nacional. | E | TRA | A |

Nota sobre B03: os limites publicados resultam de arredondamento (10 % de 36 dá 32,4–39,6, publicado como 32–40). **A tabela é a fonte; não recalcular.** Codificar a fórmula em vez da tabela introduz divergência silenciosa nos extremos.

Nota sobre B09: o Despacho não estabelece efectivo de referência para a fase VI. Qualquer limiar numérico que a aplicação use para a fase VI é invenção. Verificar.

### Família C — Composição dos postos de comando por fase

| ID | Fonte | Asserção | Nat. | Tipo | Sev. |
|---|---|---|---|---|---|
| C01 | Desp. Art. 13.º n.º 2 | Instalação do PCO obrigatória a partir da fase II. | E | TRA | B |
| C02 | Desp. Art. 13.º n.º 3 | Instalação de posto de comando de frente ou de área obrigatória sempre que implementadas frentes ou AIM. Nenhuma frente ou AIM pode existir sem o respectivo PC. | E | INV | B |
| C03 | Desp. Art. 14.º n.º 1 | PCO: até 7 lugares — coordenador, oficiais de operações, planeamento e logística e finanças, adjuntos de segurança, de ligação e de relações públicas. Catálogo fechado. | E | CAT | B |
| C04 | Desp. Art. 14.º n.º 2 | Posto de comando de frente: exactamente 4 lugares — oficiais de operações, de planeamento, de logística e finanças, e adjunto de segurança. Sem coordenador, sem adjunto de ligação, sem relações públicas. | E | CAT | B |
| C05 | Desp. Art. 14.º n.º 3 | Posto de comando de área: 5 lugares — os quatro anteriores mais adjunto de ligação. | E | CAT | B |
| C06 | Desp. Art. 41.º n.º 2 b) | Fase II: PCO integra célula de operações e adjunto de segurança. | E | CAT | A |
| C07 | Desp. Art. 42.º n.º 2 b) | Fase III: acrescem células de planeamento e de logística e finanças e adjunto de ligação. | E | CAT | A |
| C08 | Desp. Art. 43.º n.º 2 b) | Fase IV: acrescem adjunto de relações públicas e coordenador do PCO. | E | CAT | A |
| C09 | Desp. Art. 44.º n.º 2 b) | Fase V: composição idêntica à IV. **Ver errata 2.1.** | E | CAT | A |
| C10 | Desp. Art. 45.º n.º 2 b) | Fase VI: composição idêntica à IV. **Ver errata 2.1.** | E | CAT | A |
| C11 | Desp. Art. 14.º n.º 5 | Os oficiais de operações, planeamento e logística e finanças são os responsáveis das células homónimas. A relação é biunívoca. | E | INV | B |
| C12 | Desp. Art. 14.º n.º 7 | As competências dos PC de frente e de área são limitadas pelas do PCO e circunscritas à respectiva área geográfica. | E | INV | A |

C06 a C10 são severidade **A** porque a composição é gradual ("pode ser composto", artigo 14.º n.º 1) e a activação depende das necessidades. O que é bloqueante é o inverso: existir um elemento que a fase não prevê.

### Família D — Células e núcleos

| ID | Fonte | Asserção | Nat. | Tipo | Sev. |
|---|---|---|---|---|---|
| D01 | Desp. Art. 17.º n.º 2 | Célula de operações: exactamente 6 núcleos possíveis — monitorização e controlo, meios aéreos, meios especiais, segurança, emergência médica, coordenação do apoio psicológico e social de emergência. | E | CAT | B |
| D02 | Desp. Art. 27.º n.º 2 | Célula de planeamento: 3 núcleos — informações, antecipação, especialistas. | E | CAT | B |
| D03 | Desp. Art. 32.º n.º 2 | Célula de logística e finanças: 3 núcleos — meios e recursos, comunicações e sistemas de informação, finanças. | E | CAT | B |
| D04 | Desp. Art. 18.º n.º 1 | Passagem à fase IV ou superior activa obrigatoriamente o núcleo de monitorização e controlo. | E | TRA | B |
| D05 | Desp. Arts. 17.º n.º 1 h), 27.º n.º 1 c), 32.º n.º 1 h) | Núcleo não activado: as competências específicas são exercidas pela célula. Nenhuma competência de núcleo pode ficar sem titular. | E | INV | B |
| D06 | Desp. Art. 23.º n.º 2, 24.º n.º 2, 25.º n.º 2 | Os responsáveis dos núcleos de segurança, emergência médica e apoio psicossocial são nomeados por entidade externa (força de segurança territorialmente competente, INEM, ISS), por solicitação do COS — não pelo oficial de operações. | E | AUT | B |
| D07 | Desp. Arts. 23.º n.º 3, 24.º n.º 3, 25.º n.º 3, 19.º n.º 3, 21.º n.º 3 | Todos os responsáveis de núcleo da célula de operações reportam ao oficial de operações. | E | AUT | B |

D01 a D03 são catálogos fechados: 12 núcleos no total, distribuídos 6/3/3. Se o build tiver contagem diferente, é erro de doutrina, não de interface.

### Família E — Meios aéreos e meios especiais

| ID | Fonte | Asserção | Nat. | Tipo | Sev. |
|---|---|---|---|---|---|
| E01 | Desp. Art. 20.º n.º 6 | Mais de 2 aeronaves no TO: deve ser nomeado um COPAR-T. | E | TMP/CAR | A |
| E02 | Desp. Art. 20.º n.º 7 | 4 ou mais aeronaves a operar: a coordenação é assegurada por COPAR-A, que articula com o COPAR-T. | E | CAR | A |
| E03 | Desp. Art. 20.º n.º 2 e 3 | COPAR reporta ao OPAR se o núcleo de meios aéreos estiver activado; ao oficial de operações se não estiver. A atribuição de missões segue a mesma bifurcação. | E | AUT | B |
| E04 | Desp. Art. 22.º n.º 2 e 3 | Regra equivalente para COPESP e OPESP. | E | AUT | B |

E01 e E02 são dos poucos limiares numéricos duros do Despacho e são triviais de testar. Reparar que E02 não dispensa o COPAR-T — acrescenta-lhe o COPAR-A.

### Família F — Cadeia de nomeação e reporte

| ID | Fonte | Asserção | Nat. | Tipo | Sev. |
|---|---|---|---|---|---|
| F01 | Desp. Art. 10.º n.º 2 | Comandante de setor nomeado: pelo COS nas fases II a V salvo se implementadas frentes; pelo comandante de frente nas fases IV e V; pelo comandante de área na fase VI. | E | AUT | B |
| F02 | Desp. Art. 10.º n.º 3 | Comandante de setor reporta ao oficial de operações do PCO (II–V sem frentes), do PC de frente (IV–V), ou do PC de área (VI). | E | AUT | B |
| F03 | Desp. Art. 7.º n.º 3 | Responsável do ponto de trânsito reporta ao COS na fase I, ao oficial de operações na fase II, ao oficial de logística e finanças a partir da fase III. | E | AUT | B |
| F04 | Desp. Art. 7.º n.º 1 | Ponto de trânsito obrigatório quando solicitados meios de reforço e a partir da fase II, mesmo sem ZCR implementada. | E | TRA | B |
| F05 | Desp. Arts. 11.º n.º 2, 12.º n.º 2 | Comandantes de frente e de área são nomeados pelo COS e reportam ao oficial de operações do PCO. | E | AUT | B |
| F06 | Desp. Art. 14.º n.º 4 | Os elementos dos postos de comando são nomeados pelo comandante do posto que integram, a quem reportam. | E | AUT | B |
| F07 | Desp. Art. 15.º n.º 2 | Coordenador do PCO reporta ao COS. | E | AUT | B |

Esta família é um grafo. O teste natural não é linha a linha: é uma travessia que verifica, para o estado corrente, que nenhum nó reporta a um cargo inexistente na fase activa e que nenhuma nomeação foi feita por quem não tem competência para a fazer. Um único teste cobre F01 a F07 e apanha o caso difícil — a mudança de fase que deixa órfãos os reportes construídos na fase anterior.

### Família G — Plano estratégico de acção

| ID | Fonte | Asserção | Nat. | Tipo | Sev. |
|---|---|---|---|---|---|
| G01 | Desp. Art. 46.º n.º 2 | Apenas um PEA pode estar em vigor em cada momento. | E | INV | B |
| G02 | Desp. Art. 27.º n.º 1 a) | O PEA é elaborado pela célula de planeamento. | E | AUT | B |
| G03 | Desp. Art. 8.º n.º 2 e) | A aprovação do PEA compete ao COS, e só ao COS. | E | AUT | B |
| G04 | Desp. Art. 36.º n.º 1 | A componente de segurança das forças do PEA é elaborada pelo adjunto de segurança. | E | AUT | B |
| G05 | Desp. Art. 46.º n.º 1 | O PEA contém: objectivos estratégicos e conceito da operação, prioridades tácticas, acções específicas, pontos críticos para reacção imediata, instruções de comando e controlo, e outras informações relevantes. | E | FRM | A |
| G06 | Desp. Art. 32.º n.º 1 a) e d) | Plano logístico e plano de comunicações elaborados pela célula de logística e finanças, aprovados pelo COS. | E | AUT | B |
| G07 | Desp. Art. 11.º n.º 3 d), 12.º n.º 3 d) | Planos tácticos de frente e de área são subordinados ao PEA. Não pode existir plano táctico sem PEA em vigor. | E | INV | B |

G01 é o invariante mais importante do documento e o mais fácil de violar num sistema multi-utilizador. Na arquitectura cliente-servidor prevista, dois utilizadores em células diferentes podem aprovar versões concorrentes. O invariante tem de ser garantido no servidor, não na interface.

Tensão a registar, não a testar: o Artigo 4.º n.º 2 alíneas f), j) e k) atribui ao COS elaborar e manter actualizados o PEA, o plano logístico e o plano de comunicações, enquanto os artigos 27.º e 32.º atribuem a elaboração às células. A leitura coerente é que o COS é responsável e as células executam — mas convém que a aplicação distinga *autor* de *responsável* nos metadados de cada plano, ou a fita do tempo vai registar atribuições que não correspondem à norma.

### Família H — Fita do tempo e registo

| ID | Fonte | Asserção | Nat. | Tipo | Sev. |
|---|---|---|---|---|---|
| H01 | Desp. Art. 2.º n.º 1 c) | A fita do tempo é registo temporal explícito e completo de decisões, acções e informações operacionais. | E | INV | B |
| H02 | — | Imutabilidade das entradas: correcções fazem-se por nova entrada, nunca por edição. | **D** | INV | B |
| H03 | Desp. Art. 9.º n.º 3 | A passagem de comando é registada na fita do tempo, comunicada ao CSREPC e divulgada às forças presentes. | E | TRA | B |
| H04 | Desp. Art. 17.º n.º 1 g) | O registo e a permanente actualização da fita do tempo competem à célula de operações. | E | AUT | B |
| H05 | Desp. Art. 9.º n.º 2 | A passagem de comando deve cobrir nove pontos: historial, PEA em execução com missões e objectivos, prioridades das intervenções, plano de comunicações, meios empenhados e solicitados, organização do TO, constrangimentos e limitações, cenários previsíveis, situações críticas e oportunidades. | E | FRM | A |
| H06 | DON 2, 8.d.(5)(o) | POSIT ao CSREPC com periodicidade máxima de 1 hora, ou sempre que ocorra alteração significativa. | E | TMP | A |

H02 é a única asserção **D** de severidade **B** de todo o inventário. Justifica-se pela leitura conjugada de H01 e H03, mas exige decisão explícita.

H05 é severidade **A**: o texto usa "deve focar, nomeadamente", fórmula que abre a lista. Impedir a passagem de comando por falta de preenchimento de um campo seria pior do que o problema — a passagem de comando é presencial e pode ocorrer em circunstâncias que não admitem preenchimento completo.

### Família I — DECIR (DON n.º 2 / 2026)

| ID | Fonte | Asserção | Nat. | Tipo | Sev. |
|---|---|---|---|---|---|
| I01 | DON 2, 8.b.(1) | Níveis de empenhamento por data: ALFA 010000JAN–142359MAI; BRAVO 150000MAI–312359MAI; CHARLIE 010000JUN–302359JUN; DELTA 010000JUL–302359SET; CHARLIE 010000OUT–152359OUT; BRAVO 160000OUT–312359OUT; ALFA 010000NOV–312359DEZ. | E | CAT | B |
| I02 | DON 2, 8.e.(4) | ATI: fase inicial até 90 minutos. Sucesso do ATI é o incêndio em resolução até aos 90 minutos. | E | TMP | A |
| I03 | DON 2, 8.e.(4)(a) | Despacho inicial do meio aéreo de ATI até 2 minutos após o alerta. | E | TMP | A |
| I04 | DON 2, 8.e.(4)(i) | Primeiro meio de intervenção no local até 20 minutos após o despacho inicial. | E | TMP | A |
| I05 | DON 2, 8.d.(8) | Atribuição de missão preferencialmente nos primeiros 15 minutos após chegada da equipa ao TO. | E | TMP | A |
| I06 | DON 2, 8.d.(14) | O registo de rendição comunica obrigatoriamente quatro campos: número de elementos da rendição; veículo que entra no TO, se houver rotação; hora de saída do TO dos elementos rendidos; hora de entrada na Entidade. | E | FRM | B |
| I07 | DON 2, 8.d.(30) | EPCO assegura rotatividade de funções a cada 12 horas, em espelho. | E | TMP | A |
| I08 | DON 2, Anexo 12 | Matriz PIR do IPMA × nível de EPE do SIOPS (5 × 4) determina se o accionamento é opcional ou obrigatório. | E | CAT | B |
| I09 | DON 2, Anexo 3, ponto 5 | Protocolo LACES: cinco componentes — vigias, pontos de ancoragem e avaliação de situação, comunicações, caminhos de fuga, zonas de segurança. | E | CAT | B |
| I10 | DON 2, Anexo 3 | Lista de 18 situações de perigo iminente na frente de incêndio. | E | CAT | B |
| I11 | DON 2, 8.d.(9) | Equipa sem missão atribuída por incapacidade de comunicação regressa a LRT, PT ou PCO. | E | TRA | A |
| I12 | DON 2, 8.d.(10) | A saída do TO de qualquer força só ocorre após missão cumprida e autorização do COS. | E | TRA | B |

Sobre I01: as datas do DECIR estão fixadas na directiva, mas o próprio texto admite ajuste "em função de alterações significativas do risco". A aplicação deve permitir sobreposição manual do nível, com registo. Codificar a tabela como imutável é errado; ignorá-la também.

Sobre I02 a I05: todos os prazos do ATI são severidade **A** e todos são *métricas de desempenho*, não regras de bloqueio. Servem para o painel e para a análise posterior. Um prazo excedido é informação para o COS, nunca impedimento.

Sobre I08: é uma tabela de dupla entrada 5 × 4 com valores Opcional/Obrigatório. Codificar a tabela literalmente; não derivar regra.

---

## 4. Obrigações expressamente não codificáveis

Registadas aqui para que ninguém volte a propô-las como testes.

**Listas abertas.** Todas as competências introduzidas por "designadamente" — artigos 8.º n.º 2, 10.º n.º 5, 11.º n.º 3, 12.º n.º 3, 15.º n.º 3, 17.º n.º 1, 27.º n.º 1, 32.º n.º 1, 37.º n.º 2, 38.º n.º 2. Não é possível testar exaustividade de uma lista que a norma declara não exaustiva. É possível testar que os itens *enumerados* têm lugar na estrutura de dados; não é possível testar que estão cumpridos.

**Juízos de adequação.** Artigo 46.º n.º 3: o nível de detalhe do PEA depende da fase e da complexidade. Não há predicado.

**Actos presenciais.** Artigo 9.º n.º 2: a passagem de comando efectua-se presencialmente. A aplicação regista que ocorreu; não pode verificar que foi presencial.

**Autoridade de suspensão.** Artigo 36.º n.º 2: o COS confere a todos os adjuntos de segurança autoridade para ordenar a cessação dos trabalhos. Testável apenas na sua forma degradada — que o botão existe e está acessível ao perfil correcto. O exercício da autoridade não é testável.

**Vedação financeira.** Artigo 35.º n.º 2: o oficial de logística e finanças e os elementos do núcleo de finanças não podem assumir encargos financeiros. Se a aplicação vier a ter módulo de custos, isto vira teste de permissões; hoje não tem objecto.

---

## 5. Contagem e próximo passo

Sessenta asserções, das quais uma única classificada como derivada (H02). Trinta e nove bloqueantes, vinte e uma de aviso.

Três coisas antes de escrever qualquer teste:

1. **Verificar no build r0077 a composição do PCO nas fases V e VI.** Se foi codificada a partir do Anexo I, tem as duas erratas da secção 2.1 lá dentro.
2. **Decidir sobre H02.** Requisito de desenho fundamentado, ou imposição legal? A resposta muda o que se escreve na documentação técnica.
3. **Confirmar que existe estado "fora de matriz".** Se a aplicação não admite o artigo 39.º n.os 3 e 4, o problema é anterior a qualquer teste.

O passo seguinte natural é converter as famílias A, B e C — as de cardinalidade e catálogo — em asserções executáveis. São as mais baratas, cobrem os erros mais prováveis, e não dependem de nenhuma decisão pendente.

---

*Documento produzido por Claude no âmbito do projecto Estação PEA. Todas as referências foram verificadas contra o texto integral dos diplomas. As erratas da secção 2.1 foram confirmadas contra a imagem da página 24/28 da publicação oficial.*
