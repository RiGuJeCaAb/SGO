# As palavras da norma para as três gravidades do sinal, e o instante de cada regra de prazo

**Referência:** d02 · ramo #006
**Base normativa:** Despacho n.º 4067/2024, de 15 de abril; DON n.º 2 / DECIR 2026
**Verificado contra:** r0093
**Distribuição de 4 de setembro:** #006 — as palavras da norma para as três gravidades do sinal e o instante de cada regra de prazo.

---

# Parte I — As três gravidades do sinal

## I.1 O que a norma não faz, e é preciso dizê-lo primeiro

**A norma não classifica anotações de carta por gravidade.** Não há, em nenhum dos dois diplomas, uma escala de três níveis para notas sobre um mapa. O comentário que está na r0093 diz a verdade quando afirma que os três tipos se distinguem "pela consequência que têm e não por doutrina nenhuma".

O que a norma tem — e é mais útil do que uma escala — é **um vocabulário fechado do que se anota num setor**, dito por quem o anota.

> **Art. 10.º, n.º 5, al. a)** — Compete ao comandante de setor, designadamente, efetuar o reconhecimento do setor, nomeadamente, dos seus **limites, acessos, caminhos penetrantes, percursos de fuga, zonas de segurança, ameaças e pontos sensíveis**, avaliar a situação e comunicar o resultado ao posto de comando operacional.

Sete termos. É a enumeração normativa do que existe numa carta de setor, e vem do artigo que regula quem a faz. Não é uma escala, mas é o léxico.

A esse acrescem duas fontes:

> **Art. 46.º, n.º 1** — O plano estratégico de ação [...] transmite às forças empenhadas os objetivos estratégicos da operação e o seu conceito, as prioridades táticas, as ações específicas a desenvolver, os **pontos críticos para reação imediata**, as instruções de comando e controlo [...]

> **Art. 23.º, n.º 1, al. a)** — [ao núcleo de segurança compete] assegurar, por solicitação do COS, as ações de **interdição ou de condicionamento** à circulação de vias de tráfego.

"Ponto crítico para reação imediata" é a expressão da norma para o topo da escala. E "interdição ou condicionamento" é uma distinção de dois graus que a r0093 colapsa num só: a nota diz "Interdições, perigos, o que limita quem lá vai", tratando como equivalentes a proibição total e o acesso condicionado. A norma separa-as, e a diferença é operacional — uma via interditada não se percorre, uma condicionada percorre-se com regras.

## I.2 Um defeito na repartição actual

Este é o achado desta parte, e não é de rótulo. É de comportamento.

Na r0093, `TIPOS_NOTA` marca `alerta:true` apenas em `aviso`. O comentário explica que `alerta` "diz se a nota entra na leitura da evolução quando cai no caminho da frente". Por consequência, **`percursos de fuga` e `zonas de segurança` — que caem em `manobra` — não entram nessa leitura.**

Isso é ao contrário do que a norma manda.

Os caminhos de fuga e as zonas de segurança são duas das cinco componentes do protocolo LACES:

> **DON n.º 2, Anexo 3, ponto 5** — protocolo de segurança LACES [Lookouts (Vigias), Anchor Points/Awareness (Pontos de Ancoragem / Avaliação de Situação), Communications (Comunicações), **Escape Routes (Caminhos de Fuga)**, e **Safety Zones (Zonas de Segurança)**]

E a lista das dezoito situações de perigo iminente do mesmo anexo inclui expressamente o seu comprometimento:

> **(17)** O terreno e combustíveis tornam difícil a fuga para as zonas de segurança;

A lista fecha com a frase **"O PERIGO ESTÁ IMINENTE"**.

Ou seja: a norma trata uma zona de segurança comprometida como condição de perigo iminente. A aplicação trata-a como manobra e não a lê quando a frente lá chega. Uma zona de segurança no caminho da frente deixa de ser zona de segurança — é a anotação mais decisiva que existe numa carta de incêndio, e é precisamente a que hoje passa em silêncio.

**A `alerta` não é propriedade da categoria. É propriedade do item.** Ou se corrige a repartição, ou se separa o sinalizador da categoria.

## I.3 Proposta

Três gravidades, com as palavras da norma e a citação de cada uma. A composição resolve o defeito de I.2 subindo fuga e refúgio ao topo.

### Gravidade 1 — `Ameaça, ponto crítico ou segurança` · `alerta:true`

O que tem consequência para a integridade de quem lá está.

| Termo | Fonte |
|---|---|
| Ameaças | art. 10.º, n.º 5, al. a) |
| Pontos sensíveis | art. 10.º, n.º 5, al. a) |
| Pontos críticos para reação imediata | art. 46.º, n.º 1 |
| Interdição · condicionamento | art. 23.º, n.º 1, al. a) |
| Percursos de fuga | art. 10.º, n.º 5, al. a) · DON 2, Anexo 3, ponto 5 (LACES — E) |
| Zonas de segurança | art. 10.º, n.º 5, al. a) · DON 2, Anexo 3, ponto 5 (LACES — S) |

### Gravidade 2 — `Acesso e circulação` · `alerta:false`

O que se usa para lá chegar e ali manobrar, sem consequência directa de segurança.

| Termo | Fonte |
|---|---|
| Acessos | art. 10.º, n.º 5, al. a) |
| Caminhos penetrantes | art. 10.º, n.º 5, al. a) |

### Gravidade 3 — `Reconhecimento` · `alerta:false`

O que se observou e se registou, sem consequência para quem lá vai.

| Termo | Fonte |
|---|---|
| Limites | art. 10.º, n.º 5, al. a) |
| Reconhecimento do setor · avaliação da situação | art. 10.º, n.º 5, al. a) |

**Nota sobre a fronteira 1/2.** É a única discutível, e a linha proposta é esta: um acesso é por onde se entra, um percurso de fuga é por onde se sai quando corre mal. O LACES trata o segundo e não o primeiro. Se a decisão for outra, é decisão de doutrina e não de implementação.

**Nota sobre `interdição` e `condicionamento`.** Sugere-se que sejam dois valores distintos e não um rótulo único, pela razão dita em I.1. Ambos em gravidade 1.

**O que não vem da norma:** os nomes dos três níveis. A norma dá os termos, não dá o cabeçalho que os agrupa. Os três títulos acima são construção do ramo #006 e devem ser declarados como tal, à maneira do `faseSug` — a fonte cobre os termos, não a taxonomia.

---

# Parte II — O instante de cada regra de prazo

## II.1 O quadro

Cada regra com o seu prazo, o seu instante de origem, e as palavras exactas que o fixam.

| # | Regra | Prazo | Instante (t=0) | Palavras da norma | Fonte |
|---|---|---|---|---|---|
| P1 | Duração do ATI | 90 min | **O alerta** | "até aos 90 noventa minutos após o alerta" | DON 2, 7.e.(4) |
| P2 | Despacho inicial do meio aéreo de ATI | 2 min | **O alerta** | "com um despacho inicial de até 2 (dois) minutos após alerta" | DON 2, 7.e.(4)(a) |
| P3 | Primeiro meio de intervenção no local | 20 min | **O despacho inicial** | "até 20 (vinte) minutos depois do despacho inicial" | DON 2, 7.e.(4)(i) |
| P4 | Atribuição de missão à equipa | 15 min *preferencial* | **A chegada da equipa ao TO** | "no mais breve espaço de tempo possível, preferencialmente nos primeiros 15 minutos, após a chegada das equipas ao TO" | DON 2, 7.d.(8) |
| P5 | Periodicidade do POSIT | 1 h máx. | **O POSIT anterior** | "periodicidade máxima de 1 (uma) hora, ou sempre que se verificar uma alteração significativa" | DON 2, 7.e.(4)(o) |
| P6 | Rotatividade de funções da EPCO | 12 h | **Não declarado** | "garantindo a rotatividade de funções a cada 12 horas" | DON 2, 7.d.(30) |

## II.2 Achados

### II.2.1 P2 e P3 são relógios diferentes e não se compõem

P2 conta do alerta. P3 conta do despacho inicial. **A norma não estabelece nenhuma regra combinada.** O pior caso aritmético é 22 minutos desde o alerta, mas esse número não existe em lado nenhum do DECIR.

Uma aplicação que apresente "22 minutos desde o alerta" inventa uma regra e atribui-a à norma. Se P2 falhar — despacho aos 5 minutos —, P3 continua a contar dos 5 e não dos 2: são dois incumprimentos independentes, não um acumulado. Medir o encadeado esconde qual dos dois falhou, que é justamente a informação que serve para corrigir.

**Consequência:** dois cronómetros, dois registos, nunca uma soma.

### II.2.2 A hora de alerta não consta do registo obrigatório da DON — e é este o achado maior

A DON n.º 2 fixa, na secção 9 (Administração e Logística), alínea d., o que se regista sobre cada meio empenhado:

> (1) A identificação dos meios e a guarnição dos mesmos;
> (2) A data e hora de **despacho**;
> (3) A data e hora de **saída da entidade** (hora de início da marcha do veículo, do seu local de estacionamento/quartel ou local onde se encontra);
> (4) A data e hora de **chegada ao TO**;
> (5) A data e hora de **saída do TO**;
> (6) A data e hora de **chegada à entidade** [...]

Cinco instantes nomeados e definidos. **A hora de alerta não está entre eles.**

Mas P1 e P2 — as duas regras de maior visibilidade pública do DECIR, aquelas cujo apuramento e divulgação a DON atribui expressamente à ANEPC — ancoram ambas no alerta.

Daqui resulta que **a conformidade com P1 e P2 não é verificável a partir dos dados que a DON manda registar.** O registo começa no despacho; as regras começam no alerta.

**Consequência para a Estação PEA:** a hora de alerta tem de ser capturada e carimbada como instante de primeira classe, ainda que a secção 9.d não a exija. Sem ela, qualquer indicador de ATI que a aplicação apresente é construído sobre um t=0 que ninguém registou — e um número desses é pior do que nenhum, porque parece medido.

### II.2.3 O mesmo instante tem dois nomes e duas definições

Comparar:

> **DON 2, 7.d.(14)(d)** — A hora de **entrada na Entidade** (hora de encerramento da atividade do veículo, que deve ser a hora a que o mesmo chega ao seu destino final).

> **DON 2, 9.d.(6)** — A data e hora de **chegada à entidade** (hora em que o veículo chega ao seu local de estacionamento/quartel **ou** encerra a sua participação na ocorrência).

Dois problemas.

Primeiro, dois nomes para o mesmo instante: "entrada na Entidade" e "chegada à entidade". Menor, mas obriga a escolher um e a declará-lo.

Segundo, e substantivo: a definição de 9.d.(6) admite **dois momentos distintos** ligados por "ou". Um veículo pode encerrar a sua participação na ocorrência sem chegar ao quartel — é o caso normal do meio que é reencaminhado para outra ocorrência, ou desmobilizado a meio da marcha. A definição de 7.d.(14)(d) não admite essa hipótese: fixa o destino final.

**Consequência:** a aplicação tem de declarar qual dos dois momentos grava, e o campo tem de dizer qual é. Um campo "hora de entrada na Entidade" que às vezes significa uma coisa e às vezes outra não é registo, é ruído com formato de registo.

### II.2.4 P4 não é prazo, é preferência

O texto diz "no mais breve espaço de tempo possível, **preferencialmente** nos primeiros 15 minutos". A norma exprime uma preferência, não um limite.

Um sinal que apresente os 15 minutos como incumprimento afirma o que a norma não afirma. Severidade A, sem excepção, e o rótulo tem de conter a palavra da norma — preferencialmente — ou desloca o sentido.

### II.2.5 P5 é periodicidade, não prazo, e tem um segundo gatilho sem relógio

P5 difere de todas as outras em espécie. Não conta a partir de um evento externo, conta a partir de si própria: o t=0 é o POSIT anterior. É um ciclo, não um prazo.

E tem um segundo gatilho que não tem relógio nenhum: **"ou sempre que se verificar uma alteração significativa ao POSIT"**. Este não é temporizável e não deve ser convertido em contagem. O que se pode fazer é ligar a obrigação aos eventos que a aplicação já conhece — mudança de fase, sectorização alterada, passagem de comando — e propor o POSIT nesses momentos, declarando a proposta como derivada.

O que a norma qualifica como significativo é juízo do COS. Não é codificável e não deve ser codificado.

### II.2.6 P6 não tem instante declarado

"a cada 12 horas" sem âncora. Candidatos possíveis: o início do turno da EPCO, a activação da EPCO na ocorrência, ou a rotação anterior. A DON não escolhe.

**A escolha é do projecto e tem de ser declarada como tal.** É o mesmo tratamento do `faseSug`: quem põe o número assina-o. E é o mesmo raciocínio do achado de II.2.2 — este prazo tem de contar de um instante que a DON não manda registar, pelo que a aplicação tem de o criar.

Há aqui, além disso, uma articulação por resolver: a rendição das forças (7.d.(14)) tem os seus quatro campos de hora, mas a rotatividade da EPCO (7.d.(30)) não tem nenhum. São duas rendições de natureza diferente — uma de meios, outra de comando — e só a primeira tem registo obrigatório. Se o modelo de rendição a dois tempos que está no horizonte for construído, isto tem de ficar resolvido antes.

## II.3 Resumo dos instantes a capturar

Da leitura conjunta resulta que a aplicação precisa de sete instantes, dos quais a DON só nomeia cinco.

| Instante | Nomeado pela DON | Fonte | Necessário para |
|---|---|---|---|
| Alerta | **Não** | — | P1, P2 |
| Despacho | Sim | 9.d.(2) | P3 |
| Saída da entidade | Sim | 9.d.(3) | registo |
| Chegada ao TO | Sim | 9.d.(4) | P4 |
| Saída do TO | Sim | 9.d.(5) · 7.d.(14)(c) | registo, rendição |
| Chegada à entidade | Sim, com definição ambígua | 9.d.(6) · 7.d.(14)(d) | rendição |
| Início do turno da EPCO | **Não** | — | P6 |

Os dois que a DON não nomeia são exactamente os que sustentam as três regras mais visíveis — os 90 minutos, os 2 minutos e as 12 horas.

---

## III Decisões que ficam para C. Abreu

1. Os três títulos de gravidade da Parte I são construção do ramo, não da norma. Confirmar ou substituir.
2. A fronteira 1/2 — acessos ficam em 2, percursos de fuga sobem a 1. É doutrina.
3. `interdição` e `condicionamento` como dois valores ou um.
4. Qual dos dois momentos de 9.d.(6) a aplicação grava.
5. O instante de origem de P6.

As famílias A, B e C do d01 continuam paradas nas duas decisões anteriores — H02 e o estado "fora de matriz".

---

*Ramo #006. Citações verificadas contra o texto integral dos diplomas. As referências da DON n.º 2 usam a secção 7 (EXECUÇÃO) e 9 (ADMINISTRAÇÃO E LOGÍSTICA), conforme a numeração do documento — corrige a numeração errada do d01, que dizia 8.*
