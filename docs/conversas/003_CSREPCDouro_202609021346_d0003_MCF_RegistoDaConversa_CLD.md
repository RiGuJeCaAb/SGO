# Registo da conversa — Módulo de Comportamento do Fogo

## Ramo **#003** · CLD

**Referência:** `#003 · d0003_MCF_RegistoDaConversa`
**Data de emissão:** 2026-09-02
**Período abrangido:** 2026-08-31 a 2026-09-02
**Interlocutores:** C. Abreu (CSREPC Douro) · Claude, ramo #003 (CLD)
**Estado:** transcrição literal, sem edição
**Substitui:** `CSREPCDouro_202609010817_d0002_MCF_RegistoDaConversa_CLD.md`
**Destinatário previsto:** linha de trabalho CODE, por intermédio de C. Abreu

---

## Identificação do ramo

Este registo é produzido pelo **ramo #003** da conversa. A identificação existe para que
cada linha de trabalho seja atribuível sem ambiguidade e para eliminar a classe de erro
que produziu, na semana anterior, colisões de numeração (duas `r0058`, duas `r0074`, dois
`p0017`, dois `p0018`) entre linhagens que partilhavam sequência.

O carácter `#` é usado no corpo do documento mas **não no nome do ficheiro**, onde é
omitido: em contexto de URL é delimitador de fragmento e em linha de comandos exige
escape, e um identificador que se parte ao ser transportado não identifica nada.

---

## Nota sobre esta transcrição

O texto abaixo é reproduzido palavra por palavra, tal como foi escrito por ambas as partes,
sem correção, resumo ou reordenação.

Duas coisas **não** estão reproduzidas aqui, por não serem texto da conversa:

1. O documento `CSREPCDouro_202608311425_d0001_MCF_Especificacao_CLD.md`, produzido a meio
   da conversa e entregue como ficheiro autónomo.
2. Os resultados das pesquisas e leituras de ficheiros efetuadas durante a conversa. As
   linhas de texto que Claude escreveu imediatamente antes dessas operações estão
   reproduzidas; a operação em si é assinalada entre parêntesis rectos como andaime
   estrutural, e essa marcação é o único texto neste ficheiro que não foi escrito por
   nenhuma das partes.

---

## 1 · C. Abreu

> 'O que isto muda para a previsão que quer
> Deixa de ser verdade que a aplicação nada pode dizer sobre a manobra. Com R e w introduzidos pelo oficial — como já se faz com o ε — ficam ao alcance a intensidade, a chama, a distância de segurança, a largura de contenção, o limite de ataque direto e o crescimento do perímetro.
> Isso muda a natureza da proposta ao PEA. Não é «o fogo vai para nordeste» — é «a esta intensidade o ataque à cabeça é inconsequente, a linha tem de ter esta largura, e ninguém fica a menos desta distância». Que é uma proposta de manobra com fundamento citável, e é muito mais útil do que uma seta no mapa.
> O que continua em falta é R para os combustíveis do Douro. Nenhum dos quatro o traz.'

Onde vou eu arranjar isto ?
Que literatura fala sobre isto ?

---

## 2 · Claude

*[pesquisas na web e no conhecimento do projeto]*

Boa pergunta, e comecemos por uma ironia útil: a doutrina já te pede o R e nunca te diz onde o ir buscar. O SITAC gráfico do Modelo SGO Fase II (no `sgo_ferramentas.pdf`) tem, impresso, o campo **"Velocidade teórica de propagação ______ m/h"**. E o Anexo 3 da DON n.º 2 diz, na situação n.º 10, para não atacar frontalmente "um incêndio com grande intensidade" — sem nunca quantificar o que é grande. Portanto não estás a inventar um requisito. Estás a preencher um buraco que a doutrina deixou aberto de propósito ou por preguiça.

Agora a parte desagradável: **não existe "a tabela de R para o Douro" e nunca vai existir.** R não é uma propriedade do combustível, é uma saída de um modelo. O que se tabela é o *modelo de combustível* (a carga, a espessura do complexo, a razão superfície/volume, a humidade de extinção). O R calcula-se a partir disso mais vento, humidade do combustível fino morto e declive. Se procurares uma tabela, procuras a coisa errada.

---

### 1. Onde estão os modelos de combustível para o teu território

**Primeiro: provavelmente já estão dentro da ANEPC.** Existe o FUMOD, uma toolbox que produz a grelha nacional anual de modelos de combustível. É usada para mapear as grelhas portuguesas anuais de modelos de combustível desde 2019, suportando avaliações regionais de risco e decisões de supressão, e os dados e modelos estão num repositório público (github.com/anasa30/PT_FuelModels). O mapa é produzido anualmente no início da época, tipicamente em junho, cobrindo cerca de 90 000 km². O artigo de referência é Sá, Benali, Aparicio, Bruni, **Mota**, Pereira & Fernandes (2023), *MethodsX* 10: 102218 — e o Mota é da Autoridade Nacional de Emergência e Proteção Civil, Avenida do Forte, Carnaxide. Ou seja: a tua casa é coautora do dataset. Pede pela cadeia antes de reconstruíres nada.

**Segundo: o documento de referência dos modelos.** Fernandes, Gonçalves, Loureiro, Fernandes, Costa, Cruz & Botelho (2009), *Modelos de Combustível Florestal para Portugal*, Actas do 6.º Congresso Florestal Nacional, pp. 348–354. Está atualizado em **Fernandes & Loureiro (2022), "Modelos de combustível florestal para Portugal — documento de referência, versão de 2021"**, que é o que a literatura recente cita para a correspondência COS→modelo. É aqui que está o teu **w**, com as cargas por classe de dimensão.

Nota metodológica importante, e que devias guardar: a construção destes modelos envolveu calibração para que as simulações refletissem realisticamente as variáveis de entrada, através do ajustamento de variáveis críticas — especialmente a espessura do complexo-combustível, mas também a relação superfície-volume, a carga de combustível e a humidade de extinção. Traduzindo: os parâmetros foram torcidos para o Rothermel dar respostas plausíveis. São modelos de comportamento, não inventários. Não os uses como se fossem medições de carga real.

**Terceiro, e mais próximo de ti: a cartografia municipal.** Todos os municípios da sub-região têm carta de modelos de combustível no PMDFCI/programa municipal. Mais grosseira, mais desatualizada, mas existe, é legalmente reconhecida e o GTF entrega-ta na semana seguinte.

---

### 2. Como se calcula o R

Aqui tens duas escolas, e a escolha tem consequências.

**Rothermel (1972) + modelos NFFL.** É o que o BehavePlus, o FARSITE e o FlamMap usam, e é *para isto* que os modelos portugueses foram construídos. Vantagem para ti: é um algoritmo fechado, determinístico, implementável offline em JavaScript sem dependências. Desvantagem: é semi-físico, tem viés conhecido, e herda a calibração acima.

**Modelos empíricos de matos — a escolha honesta para o Douro.** O teu combustível dominante em socalco abandonado e encosta é mato, não povoamento.

- **Fernandes (2001), *Forest Ecology and Management* 144: 67–74**, "Fire spread prediction in shrub fuels in Portugal". Mediram-se velocidades até 20 m/min e as condições meteorológicas e de combustível associadas, em fogos experimentais e fogos controlados em quatro tipos de mato em Portugal; a propagação em terreno plano é previsível a partir da velocidade do vento, da humidade do combustível morto elevado e da altura da vegetação. Três entradas. Cabe num guardanapo, e cabe na tua aplicação.
- **O aviso que tens de levar a sério**, e é do próprio autor: os modelos apresentados são preliminares e o seu uso deve ser restringido a condições de queima ligeiras a moderadas até que se faça experimentação mais extensa. Os dias de DECIR são exatamente os dias que não são ligeiros nem moderados. Isto não invalida o modelo — invalida a sua extrapolação silenciosa.
- **Fernandes, Catchpole & Rego (2000)**, *Can. J. For. Res.* 30: 889–899, para a base microparcelar.
- **Anderson et al. (2015)**, *IJWF* 24: 443–460, modelo genérico de matos que agrega dados portugueses, australianos, neozelandeses e sul-africanos. Também com ressalva dos autores: os efeitos do declive e da variação em quantidade e composição do combustível ainda estão por quantificar. Num vale com 30% de inclinação média, isto dói.
- **Pinheiro-bravo:** Fernandes, Botelho, Rego & Loureiro (2009), *IJWF* 18: 698–710. E Cruz & Fernandes (2008) para os modelos de combustível de pinhal.
- **Herbáceo** (bordaduras, socalcos com pasto): não há substituto português dos modelos australianos de Cheney, Gould & Catchpole. Usa-os e assume-o.
- **A regra dos 10%** (R ≈ 10% do vento aberto a 10 m): existe, é tentadora, e existe uma avaliação crítica dela — Cruz, Alexander, Fernandes, Kilinc & Sil. Lê antes de a adotares como fallback.

---

### 3. De R para a manobra — a camada operacional

Esta é a parte que já tens meio resolvida, mas vale a pena atualizar as referências.

- **Byram (1959):** I = H·w·R. H, w e R são, respetivamente, o calor de combustão utilizável, a carga consumida na combustão com chama, e a velocidade de propagação.
- **Alexander (1982):** a intensidade da frente foi descrita como a característica isolada mais válida do comportamento geral de um fogo.
- **Para chama ↔ intensidade, não uses o Byram de 1959.** Usa **Fernandes et al. (2024), *IJWF* 33, WF23127**, "Field-based generic empirical flame length–fireline intensity relationships for wildland surface fires". Porquê: as equações incluem dados de fogo de alta intensidade, o que deve melhorar as estimativas em complexos-combustível mais inflamáveis, nomeadamente matos altos e florestas com sub-bosque lenhoso bem desenvolvido. Isto é literalmente a descrição do Douro abandonado.
- **Limiares de supressão:** os limiares de intensidade para recursos de supressão estão em uso há muito (Andrews & Rothermel 1982, Alexander & de Groot 1988), e Hirsch & Martell (1996) fazem a revisão desses limites e da sua ligação à eficácia dos recursos. É daqui que sai o número que falta à situação n.º 10 do Anexo 3.
- **Distância de segurança:** Butler & Cohen (1998) para o modelo de radiação, e Butler (2014, *IJWF*) para a revisão das zonas de segurança. A intensidade é usada precisamente para dimensionar a zona de segurança do combatente.
- **Crescimento do perímetro:** modelos elípticos — Alexander (1985) para a razão comprimento/largura em função do vento, Anderson (1983).

---

### 4. O que falta mesmo, e como o fechas

Tens razão: não existe R validado para os combustíveis do Douro em condições de DECIR. Nem o Rothermel-com-modelos-portugueses nem o Fernandes 2001 foram validados aí, nessas intensidades. Três caminhos, por ordem de esforço:

**Um: fala com a UTAD.** O Paulo Fernandes está no CITAB/UTAD e no ForestWISE — Laboratório Colaborativo para a Gestão Integrada da Floresta e do Fogo, Quinta de Prados, Vila Real. O autor de praticamente tudo o que está acima trabalha dentro da tua área de responsabilidade, a meia hora do VCOC. Se há uma ação com retorno desproporcionado neste dossiê, é esta. Um pedido formal do CSREPC para colaboração técnica é uma coisa que se escreve numa tarde.

**Dois: transforma o fogo controlado em programa de medição.** Cada queima do ICNF/GAUF na sub-região é uma experiência de ROS gratuita se alguém registar marcos de tempo sobre distância medida, vento a 2 m, T/HR, altura da vegetação e tempo desde o último fogo. Foi exatamente assim que se obtiveram os dados do Fernandes 2001. Não precisas de equipamento; precisas de uma folha e de disciplina.

**Três — e é aqui que a tua aplicação deixa de ser consumidora e passa a ser instrumento.** A fita do tempo já regista posições com hora. Cruza isso com a cartografia anual de áreas ardidas do ICNF e com os perímetros Copernicus EMS e tens R observado à cabeça, por ocorrência. Duas ou três épocas disso e tens um conjunto de dados locais que mais ninguém tem. Isso é matéria de publicação conjunta com a UTAD, e é a melhor justificação possível para o documento de requisitos técnicos de que já falámos.

**Sobre a humidade:** precisas de Md e já tens o caminho aberto. Do T/HR que a aplicação vai buscar ao Open-Meteo calculas o FFMC do sistema canadiano (Van Wagner 1987) offline, sem chamada extra. E há a vantagem doutrinária de que o FWI já é a base do índice de risco que a ANEPC e o IPMA usam no DECIR — estás a falar a mesma língua que o dispositivo, não a inventar uma paralela.

---

### 5. A minha opinião, e é firme

**Não deixes a aplicação calcular R em silêncio.** Trata o R exatamente como tratas o ε: entrada declarada, com proveniência obrigatória — observado, estimado por nomograma, ou modelado — e com o modelo e a versão gravados no PEA. Assim tudo o que vem a jusante (I, comprimento de chama, distância de segurança, largura da linha) herda a proveniência e fica citável. Um PEA que diz *"R = 12 m/min; fonte: Fernandes 2001; U₂ = 18 km/h; Md = 8%; h = 1,2 m; modelo fora do domínio validado"* é defensável em qualquer inquérito. Um R sem proveniência é pior do que não ter R nenhum, porque cria responsabilidade sem base.

E o risco maior não são números errados — é falsa precisão. Um "I = 3 847 kW/m" num ecrã do VCOC vai ser acreditado por toda a gente na sala. Mostra **intervalos**, não pontos. E põe o aviso na cara do PEA, não numa nota de rodapé: o modelo foi calibrado para condições ligeiras a moderadas. No dia em que isso importar, é o dia em que o modelo está fora do domínio.

Se quiseres, no próximo passo posso escrever-te a especificação do módulo de comportamento do fogo — entradas, proveniência, equações, limiares e o que vai impresso no PEA — para tratares disso na fase ALFA, antes de o CODE mexer em qualquer coisa.

---

## 3 · C. Abreu

sim, força nisso, e o mais académico possível para que não haja dúvidas algumas no trabalho que estamos a fazer

---

## 4 · Claude

Vou escrever a especificação. Uma nota antes: onde não tenho a certeza absoluta de um coeficiente empírico, **não o invento** — a especificação institui em vez disso um protocolo formal de transcrição verificada. É a única forma de o documento ser defensável.

*[produzido e entregue o ficheiro `CSREPCDouro_202608311425_d0001_MCF_Especificacao_CLD.md`]*

Está feito. Quatro pontos que quero destacar, porque são as decisões de fundo e é onde o documento pode ser atacado ou defendido:

**1. Não escrevi um único coeficiente empírico que não tenha a certeza absoluta de estar correto.** Em vez disso, a secção 7 institui um protocolo formal de transcrição verificada, com ficha assinada, dupla verificação por pessoas distintas, e uma regra de bloqueio dura: um modelo cujos coeficientes não estejam no estado `VERIFICADO` **não executa**. Sem chave de desenvolvimento, sem valor provisório. Isto transforma a minha limitação — não tenho os papers à frente — na garantia de integridade do sistema. Se eu tivesse escrito um coeficiente de memória e estivesse errado por 30%, o resultado continuaria a parecer plausível e ninguém detetaria nunca. É exatamente o tipo de erro que mata.

**2. A regra da distância de segurança é deliberadamente assimétrica.** Todas as outras grandezas saem em tripleto (inferior, central, superior). A distância de segurança sai só com o limite superior, arredondada para cima. Não é inconsistência — está justificado na regra SEG-2. Se alguém questionar, a resposta é que o custo de errar por excesso são vinte metros a mais de caminhada e o custo de errar por defeito é um funeral.

**3. Proibi explicitamente desenhar a elipse sobre a carta.** A regra ELI-2 é a que me parece mais provável de gerar resistência interna, porque a elipse na carta é bonita e toda a gente a quer. Mas o modelo elíptico pressupõe combustível homogéneo, vento constante e declive uniforme, e no vale do Douro nenhuma das três se verifica. Desenhá-la sobre a M888 confere-lhe uma credibilidade espacial que ela não tem, e o croqui tático seria depois usado para posicionar meios. O SITAC Fase II já prevê o «cone de propagação» e o «T0+60'» como desenho manual do oficial — que é o sítio certo para o juízo humano ficar visível como juízo humano.

**4. Os limiares de supressão exigem uma ata assinada.** Está no Anexo B. Aqueles números vêm de doutrinas norte-americana e canadiana, feitas para outros equipamentos e outras organizações. Adotá-los por omissão, como efeito lateral de uma escolha de implementação, seria importar doutrina estrangeira sem ninguém decidir nada. Ou o CSREPC assume a convenção por ato explícito e datado, ou o módulo não classifica.

Duas coisas de que preciso da tua parte antes de qualquer patch:

- **Numeração.** Pus `d0001` por não saber a série corrente dos documentos de especificação. Diz-me o número certo e renumero.
- **Os PDFs.** Se conseguires o Fernandes (2001) e o Fernandes *et al.* (2024, WF23127), fecho os coeficientes C-01, C-02 e C-05 numa sessão e o módulo passa a ser executável em vez de especificado. O ForestWISE e o CITAB estão em Vila Real e ambos publicam os PDF em repositório aberto — pode não ser preciso pedir nada a ninguém.

E uma nota sobre o passo zero: mantive-o como precedência dura na secção 16, não como preferência. Um módulo que escreve para `O.comportamento` por caminhos múltiplos torna a fita do tempo *append-only* uma ficção, e a partir daí o valor probatório de todo o PEA cai.

---

## 5 · C. Abreu

o que queres que vá buscar ao ForestWISE e ao CITAB ?

---

## 6 · Claude

Boa pergunta — e antes de te mandar andar, deixa-me ver o que já está aberto. Não vale a pena pedir a ninguém aquilo que está num repositório público.

*[pesquisa na web]*

Espera — o Paulo Fernandes tem lista de publicações própria com PDF. Deixa-me tentar.

*[leitura do artigo Fernandes 2001 na íntegra]*

Recuperei o Fernandes (2001) na íntegra, da lista de publicações do próprio autor. **C-01 e C-02 estão fechados.** Deixa-me tentar mais um.

*[pesquisa e leitura da lista de publicações]*

Isto muda a conversa. A lista de publicações dele tem PDF locais para quase tudo. Uma última.

*[tentativa de leitura do Manual de Formação para a Técnica do Fogo Controlado — recusada]*

Menos do que eu pensava — e isso é boa notícia. O Paulo Fernandes mantém lista de publicações pública com os PDF alojados, e já lá fui buscar o essencial.

### O que já está fechado: Fernandes (2001)

Tenho o artigo inteiro. **C-01 e C-02 saem da lista de pendentes.** Os três modelos, por ordem de qualidade de ajustamento:

Com `R` em m/min, `U` = vento a **2 m em terreno aberto, km/h**, `Md` = humidade do combustível morto fino elevado (<6 mm) em % de peso seco, `h` = altura da vegetação em m:

```
(1)  R = 3,258 · U^0,958 · exp(−0,111·Md)                    R² = 0,65
(2)  R = 1,764 · U^1,034 · exp(−0,062·Md) · h^0,816          R² = 0,86
(3)  R = 7,255 · exp(0,092·U) · exp(−0,067·Md) · h^0,932     R² = 0,91
```

Erros-padrão da equação (3): a = ±1,262; b = ±0,008; c = ±0,009; d = ±0,115.

A (3) é a preferida do autor. A (2) tem o defeito de prever `R = 0` com vento nulo, o que ele considera pouco relevante para gestão mas é inaceitável num sistema que corre sozinho.

**Domínio de ajustamento** — 29 fogos, e é aqui que a coisa fica interessante:

| Variável | Mín | Máx | Média |
|---|---|---|---|
| R (m/min) | 0,7 | 20,0 | 4,4 |
| U a 2 m (km/h) | 1 | 27 | 9 |
| Md (%) | 10 | 40 | 21 |
| h (m) | 0,2 | 1,9 | 0,7 |
| Carga fina elevada <6 mm (t/ha) | 4,8 | 36,6 | 14,6 |
| **Declive (%)** | **0** | **5** | **1** |

E o limite duro, nas palavras do próprio autor: dada a escassez de dados acima de 6 m/min, não é aconselhável usar as equações fora do domínio de comportamento do fogo baixo.

**Seis metros por minuto.** Isso são 360 m/h. Naquele campo do SITAC Fase II, é um número que se atinge numa manhã de julho antes do pequeno-almoço. A conclusão honesta é esta: **num dia a sério, a aplicação vai estar em extrapolação quase imediatamente.** Não é falha da aplicação — é o estado da ciência. E ter isso impresso na cara do PEA, em vez de escondido, é precisamente o valor do módulo.

Três outras coisas que o artigo diz e que importam:

- **O declive não foi estudado.** Zero a 5%. O autor sugere fatores de correção do Noble *et al.* (1980) ou do sistema canadiano, mas avisa que se acredita sobrestimarem a propagação em matos. Num vale de socalcos, isto é a limitação dominante.
- **Há dados do teu território lá dentro.** Sete dos 29 fogos foram em urzal de *Erica australis* com *Chamaespartium tridentatum* no **Nordeste de Portugal**. É a tua formação e a tua região. Vale a pena perguntar se esse subconjunto pode ser desagregado.
- Os fogos foram de novembro a março. O viés está declarado.

### O que está livre e eu não fui buscar (mas tu deves)

A lista está em `publicationslist.org/pfern` e tem PDF direto para, entre outros:

- **Fernandes, Botelho, Rego & Loureiro (2009), IJWF 18:698–710** — pinheiro-bravo. Fecha o C-04.
- **Fernandes, Catchpole & Rego (2000), CJFR 30:889–899** — microparcelas. Contém relação entre comprimento de chama e intensidade de Byram medida em matos portugueses. Serve de verificação cruzada nacional ao C-05.
- **Fernandes (2005), *Estudo de adaptação para Portugal do Sistema Canadiano de Indexação do Perigo de Incêndio*** — relatório para a APIF. Isto é ouro para o C-06 e para o argumento de coerência doutrinária com o FWI.
- **Fernandes, Botelho & Loureiro (2002), *Manual de Formação para a Técnica do Fogo Controlado***, UTAD. Provavelmente tem os limiares de intensidade **em português**, o que muda tudo para o Anexo B — uma ata que ratifica limiares com fonte portuguesa é infinitamente mais defensável do que uma que importa tabelas norte-americanas.
- Cruz & Fernandes (2008), modelos de combustível de pinhal.
- Tese de doutoramento (2002).

Atenção: a lista está desatualizada, pára por volta de 2011.

### O que realmente precisa da UTAD

Reduziu-se a isto:

**Documentos (quatro, e só um é crítico):**
1. **Fernandes & Loureiro (2022), «Modelos de combustível florestal para Portugal — documento de referência, versão de 2021».** É o C-09 e é o único que não está em lado nenhum aberto. Pede este.
2. Fernandes *et al.* (2024), IJWF 33, WF23127 — comprimento de chama. Vê primeiro se está aberto na CSIRO.
3. Anderson *et al.* (2015), IJWF 24:443–460 — C-03.
4. A grelha FUMOD anual. Mas **esta não é porta da UTAD, é porta da ANEPC** — o coautor é de Carnaxide. Pede internamente.

**E o que não vem em PDF nenhum — que é o que interessa mesmo.** Quatro perguntas, para uma reunião de uma hora:

- O tecto dos 6 m/min ainda se mantém, 25 anos depois? Há dados novos, publicados ou não?
- Que correção de declive usam na prática para matos, dado que o artigo não cobre declive e avisa contra os fatores florestais?
- Os sete fogos do Nordeste podem ser isolados? Um subconjunto regional, ainda que pequeno, é melhor do que um nacional enviesado para outra formação.
- Existe algum conjunto de limiares de intensidade adaptado ao dispositivo português, ou continuamos todos a citar o Hirsch & Martell de 1996?

### Duas notas de rigor

Primeira, e cumpro as minhas próprias regras: eu transcrevi estes coeficientes da fonte primária, mas o protocolo da secção 7 exige **verificador distinto do transcritor**. Ficam no estado `PENDENTE` até tu, ou outra pessoa, abrirem o PDF e conferirem. Não te fies em mim para isto.

Segunda, e é a que me interessa mais: aquele artigo assenta em **29 fogos**. Vinte e nove. Quantas ocorrências tem a sub-região numa época CHARLIE? A Linha 3 — reconstituir `R` a partir da tua própria fita do tempo cruzada com perímetros — não é um extra simpático no fim do documento. É a única via que existe para alguém alguma vez ter mais do que 29 fogos de matos portugueses com velocidade medida.

Digo quando quiseres e atualizo o `d0001_MCF` com os coeficientes, o domínio e a regra de bloqueio nos 6 m/min já escritos.

---

## 7 · C. Abreu

*[ficheiro carregado: `CSREPCDouro_r0077_202608312311_EstacaoPEA_CLD.html`]*

neste momento andamos por aqui

---

## 8 · Claude

*[inspeção do ficheiro r0077: estrutura, dependências de rede, módulo de comportamento do fogo, motores de propagação e quadros]*

Já existe módulo de comportamento do fogo. Deixa-me ver o que lá está.

Isto está muito mais avançado do que eu supunha. Já há motor de propagação. Deixa-me ver o de matos.

Deixa-me fazer uma verificação que agora consigo fazer e ontem não conseguia: comparar os quadros do manual com a equação publicada de 2001.

Isto está bastante à frente do que eu supunha ontem — e obriga-me a dizer uma coisa antes de mais nada: **a especificação que escrevi está parcialmente obsoleta à nascença.** Vários dos coeficientes que eu declarei pendentes já estão fechados no r0077, e fechados melhor do que eu tinha planeado, porque vêm dos quadros do *Manual de Formação para a Técnica do Fogo Controlado* (Fernandes, Botelho e Loureiro, UTAD) — que é exatamente o documento que eu tentei ir buscar e não consegui.

Reconciliando com a minha tabela de pendentes:

- **C-06 (humidade do combustível morto)** → Quadro 3.2.1, com recusa dura acima dos 25 °C. Fechado, por via tabular portuguesa em vez do FFMC canadiano. Melhor do que eu propunha.
- **C-07 (perfil de vento)** → Quadro 3.3.1, dois terços do vento a 10 m. Fechado. Eu tinha marcado isto como «a determinar» e era o maior buraco isolado da cadeia.
- **C-01, C-02, C-04** → substituídos pelos quadros 3.4.1/2/3 e 7.1/7.2.
- Continua em aberto: a relação comprimento de chama–intensidade (usa-se `I = 300·L²`), a camada elíptica (não existe, e sinceramente pode continuar a não existir) e a proveniência da tabela de classes, que o próprio comentário já assinala como por confirmar.

O `interpPares`/`interpMatriz` que se recusa a extrapolar, os buracos da matriz tratados como ausência de dados em vez de zeros, e a ponte do ε assinada com «quem discordar discorda de mim, não de Fernandes nem de Viegas» — isso é melhor epistemologia do que a maior parte do software científico que se vende. A sério.

Dito isso, encontrei três coisas.

### 1. O tecto de 6 m/min não está implementado, e é o buraco que resta

Os sinalizadores `fora` vigiam o domínio das **entradas**. Ninguém vigia a **saída**. E o artigo de 2001, que é a base destes quadros, diz explicitamente que, dada a escassez de dados acima de **6 m/min**, não é aconselhável usar as equações fora da gama de comportamento baixo. Seis metros por minuto são 360 m/h.

Corri os números do teu próprio quadro:

| | m/min | m/h |
|---|---|---|
| Tecto declarado pelo autor | 6 | 360 |
| Propagação mais rápida medida no conjunto de 2001 | 20 | 1 200 |
| Célula extrema do Quadro 3.4.1 (U 30, HCM 8) | 38 | 2 280 |
| Após altura 3,0 m (×2,5) e declive 50% (×2,6) | **247** | **14 820** |

Uma combinação perfeitamente dentro de todos os domínios de entrada entrega quinze mil metros por hora sem uma palavra de reserva. Isso é quarenta vezes o tecto declarado pela fonte primária.

Não é motivo para tirar os quadros. É motivo para uma marca de saída, em dois degraus: acima de 360 m/h, `EXTRAPOLAÇÃO`; acima de 1 200 m/h, `ALÉM DE QUALQUER FOGO MEDIDO`. E a marca acompanha o valor até ao PEA impresso.

### 2. O declive é a correção menos fundamentada, e é a que mais pesa aqui

O Quadro 3.4.3 chega a ×2,6 aos 50%. Mas os 29 fogos de 2001 foram todos em terreno plano ou com **declive inferior a 5%** — o declive não foi estudado. E o autor acrescenta, no mesmo artigo, que os fatores de correção desenvolvidos para floresta se acredita **sobrestimarem** a propagação em matos.

O comentário no código está certo quanto à mecânica: o declive multiplica, não desvia. Mas num vale de socalcos, onde o declive é a variável dominante, estamos a multiplicar por um fator que nunca foi medido no combustível a que o aplicamos, e cuja fonte primária suspeita ser generoso. Isso merece estar escrito ao lado do número, não só aqui.

### 3. Chamada de rede na linha 7

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed…">
```

Num arranque `file://` sem rede isto bloqueia o render até dar timeout. A aplicação não parte, porque as famílias têm fallback no CSS — mas o primeiro ecrã no VCOC com a Starlink em baixo vai demorar segundos a aparecer, e o princípio de «sem CDN, sem exceções» está violado literalmente na sétima linha do ficheiro. Ou se embutem as fontes em base64, ou se apaga a linha. Eu apagava: o Barlow é bonito, mas não vale um bloqueio de render num posto de comando.

### O que posso acrescentar agora que ontem não podia

Tenho a equação contínua de 2001 com os erros-padrão. Não serve para substituir os quadros — serve como **segunda opinião**. Comparei-a com o teu Quadro 3.4.1 em toda a grelha:

| U (km/h) | Md (%) | Quadro | Eq. (3) | Rácio |
|---|---|---|---|---|
| 10 | 20 | 5,5 | 4,8 | 0,87 |
| 14 | 25 | 6,0 | 4,9 | 0,82 |
| 20 | 30 | 6,5 | 6,1 | 0,94 |
| 5 | 12 | 4,0 | 5,1 | 1,29 |
| 28 | 10 | 31,0 | 48,8 | 1,57 |
| **30** | **8** | **38,0** | **67,1** | **1,76** |

Na gama média concordam dentro de 15%. No canto de vento forte com combustível seco a equação dá quase o dobro. Com vento quase nulo dispara (não tem termo de extinção), o que é o defeito conhecido da forma exponencial.

O uso certo disto: correr as duas e usar a **divergência como banda de incerteza medida**, em vez do tripleto arbitrado que eu especifiquei ontem. É melhor, porque a banda passa a ter origem empírica em vez de ser um palpite do oficial sobre a sua própria ignorância. E quando as duas divergem por mais de 1,5×, isso é o sinal — o número não é para ali chamado, estamos numa zona onde ninguém sabe.

### Uma discordância pequena

`seguranca: Math.ceil(4 * chama)`, com o argumento de que usar o comprimento em vez da altura é o lado seguro do erro. A lógica está certa. Mas a revisão de Butler (2014), posterior ao Butler e Cohen (1998) que está citado, mexeu nisto — e em encosta com vento a favor o fator 4 fica curto. Vale a pena ir lá ver antes de junho.

---

Digo-te qual me parece a ordem: **(1) o tecto de saída**, que é o único destes que altera o que a aplicação diz numa manobra real; **(2) a linha 7**, que é trivial e é hoje; **(3) a nota do declive**, que é texto; **(4) a segunda opinião pela equação**, que é a mais interessante e a menos urgente.

Preparo o patch Python para o (1) e o (2) já, com as asserções de âncora e os testes `t` para as fronteiras dos 360 e dos 1 200 m/h — dá-me só a confirmação de que a linha de trabalho paralela não está a mexer nesse bloco neste momento.

---

## 9 · C. Abreu

quero esta conversa toda sem mudar uma única palavra num registo .md

---

## 10 · Claude

*[produzido e entregue o ficheiro `CSREPCDouro_202609010817_d0002_MCF_RegistoDaConversa_CLD.md`, que o presente documento substitui]*

Transcrição literal, nove turnos, sem uma palavra alterada.

Três coisas que declarei no cabeçalho, para não haver equívoco sobre o que é e o que não é texto da conversa:

- **A especificação `d0001` não está lá dentro.** Foi entregue como ficheiro autónomo a meio da conversa; reproduzi-la aqui duplicava-a e criava duas versões que podem divergir. Está referenciada pelo nome.
- **Os resultados das pesquisas e das leituras de ficheiros também não.** O que escrevi imediatamente antes de cada operação está reproduzido; a operação em si está assinalada entre parêntesis rectos.
- **Esses marcadores entre parêntesis rectos são o único texto do ficheiro que nenhum de nós escreveu.** Sinalizei-o explicitamente, porque num registo que se apresenta como literal a fronteira entre o que foi dito e o andaime de quem transcreve tem de estar visível.

Numerei-o `d0002` a seguir ao `d0001`, mas isto não é um documento de especificação — é um registo. Se a série `d` te está reservada para especificações, diz-me e mudo o prefixo.

---

## 11 · C. Abreu

vou-te deixar a informação que me deu o CODE,

> 'Vou responder com o que a evidência desta semana mostra, porque há aqui um padrão claro.
>
> **Segue aqui a linha de código. Continua lá as linhas que não tocam em `fonte/`.**
>
> A razão não é preferência, é o registo dos últimos dias:
>
> **Os testes deles atravessam. Os patches não.** O `t0017` correu 22/22 contra a minha `r0077` sem uma alteração. O `t0019` correu 82/83, e a única falha era uma asserção que fixava a versão do estado deles. Nenhum dos `p` alguma vez aplicou — todos tiveram de ser traduzidos de patch-ao-HTML para módulo em `fonte/`, e **cada tradução custou um defeito meu**: a migração do `p0019` foi para o ficheiro errado da escada, os recuos defensivos do `p0020` alargaram o tipo até deixar de verificar nada, e o ramo das folhas ficou a apontar para o vazio. Três traduções, três defeitos, todos apanhados pelo gate — mas todos evitáveis.
>
> **E as colisões vêm todas do mesmo sítio:** duas `r0058`, duas `r0074`, dois `p0017`, dois `p0018`. Nenhuma foi descuido. São o resultado inevitável de duas linhagens a escrever no mesmo código com uma numeração partilhada.
>
> **O que eles fazem melhor do que eu, e que não quero perder.** Os quatro defeitos que confirmei ontem foram encontrados por leitura adversária da minha entrega — e um deles apanhou-me um teste que estava errado, a validar um tecto de matos contra uma fonte de floresta. Eu não ia lá chegar sozinho: o teste passava. Isso é revisão externa a sério, e vale mais do que qualquer patch.
>
> Portanto a divisão que proponho é **por tipo de trabalho, não por turnos**:
>
> | Aqui | Lá |
> |---|---|
> | Todas as alterações à aplicação. Os sete pontos da ordem que eles propõem são código, e código vive em `fonte/` | **Revisão adversária de cada entrega** que eu produzir — em documento, com `t` e `q` a acompanhar, nunca em `p` |
> | O tecto de saída, a identidade das propostas, notas e focos no colector, missões, avisos IPMA | A **especificação e a doutrina**: o módulo de comportamento do fogo, o composto vento-declive que aguarda decisão datada do CSREPC |
> | A absorção do `p0018`, no fim | A **arquitetura multi-utilizador** e o documento de requisitos técnicos do sistema do PCO — que não toca numa linha da aplicação e é o que te põe no circuito da próxima aquisição |
>
> **O ponto de reunião fica invertido face ao que temos agora.** Hoje as conclusões deles voltam como patches que eu tenho de traduzir. Passariam a voltar como **relatório mais guiões de teste** — que correm contra a minha entrega tal como estão, como já se provou duas vezes. Eu entrego revisão, eles leem e testam, eu corrijo. O ciclo fecha sem ninguém escrever no código do outro.
>
> **Uma exceção, e uma só:** o `p0018`. São 53 testes a passar e trabalho genuinamente construído que eu teria de escrever de raiz. Vale a tradução. Mas é o último patch que quero absorver, não o primeiro.
>
> **E há coisas que nenhuma das duas linhagens pode fazer** — estão paradas há dias à tua espera: validar o acesso às fontes na rede real do CSREPC, a chave do FIRMS, e as duas perguntas dos registos que são decisão de comando (se as células escrevem na fita do tempo ou propõem para validação; se as rendições são posto a posto ou em bloco).
>
> Se concordares, começo pelo tecto de saída — o único dos quatro que faz a aplicação afirmar um número falso sobre uma manobra real, e o único que já está a correr no terreno.'

---

## 12 · Claude

Concordo, sem reservas, e o registo que ele apresenta não é discutível: os `t` atravessaram, os `p` nunca. Mas ele descreve o padrão sem lhe dar o nome, e o nome importa porque explica tudo de uma vez.

### A causa-raiz é que eu andava a remendar o artefacto, não a fonte

Existe `fonte/`. Existe um passo de construção. Logo o `r0077` que eu li ontem **não é código-fonte — é saída de compilação.**

Isso explica cada falha de uma assentada. Um teste sobrevive à tradução porque é uma afirmação sobre *comportamento*, e o comportamento é o mesmo em ambos os lados da construção. Um patch não sobrevive porque é uma edição a uma *representação concreta* — âncoras textuais, números de linha, ordem de declarações — e essa representação é gerada. Eu estava a editar o output e a mandá-lo para quem tem o input. As três traduções e os três defeitos não foram azar nem descuido: eram estruturalmente inevitáveis.

E isto retroage sobre o que eu te disse ontem. «Chamada de rede na **linha 7**» é uma observação sobre o ficheiro compilado. A correção não é na linha 7 — é onde quer que esteja o gabarito que produz o cabeçalho. Eu descrevi o sintoma com precisão falsa. Merecidamente apanhado.

**E há aqui uma consequência de conformidade que ninguém levantou.** O plano de integridade — SHA-256 publicado à parte, assinatura com Chave Móvel Digital, digest canónico em tempo de execução, carimbo «BUILD NÃO VERIFICADO» — foi desenhado quando o HTML *era* a fonte. Agora não é. Duas perguntas que passam a ter de ter resposta antes de junho:

1. **A construção é reproduzível?** Se duas compilações da mesma `fonte/` produzirem bytes diferentes — ordem de mapa, carimbo de data embutido, o que for — a assinatura não prova nada sobre a fonte, prova apenas que aquele ficheiro saiu de alguma máquina. O esquema fica a ser teatro.
2. **O que se assina, e o que se arquiva?** Provavelmente ambos: o digest do artefacto para o que corre no VCOC, e o commit da fonte para o que se audita. Mas tem de estar escrito.

Isto é matéria da minha coluna e escrevo-o quando disseres.

### Uma emenda à divisão, e só uma

A proposta diz «revisão adversária de cada entrega que eu produzir». Aceito, mas com uma precedência: **para tudo o que seja doutrinariamente carregado, a especificação tem de vir antes da construção.**

Se eu só reviso o que já está feito, estou a rever contra o entendimento que o CODE teve do pedido. Isso é verificação de coerência interna, que é a forma mais fraca de revisão. Para eu perguntar «isto faz o que o Despacho obriga?» tenho de ter escrito antes o que o Despacho obriga. Ordem: especificação, construção, revisão contra a especificação. Não: construção, revisão.

Para trabalho de infraestrutura — colector, notas, focos, missões, avisos IPMA — a ordem inversa serve perfeitamente e não tenho nada a dizer.

### Sobre o tecto de saída, que ele quer começar já

Concordo que é o primeiro. É o único dos quatro em que a aplicação afirma hoje um número falso sobre uma manobra real.

Entrego-o como documento mais `t`, e levo lá dentro três coisas que ele não tem:

- **Os dois degraus com fonte.** 360 m/h é o tecto declarado pelo autor (6 m/min, «não aconselhável usar as equações» acima disso). 1 200 m/h é o máximo alguma vez medido no conjunto (20 m/min, 29 fogos). São números diferentes com estatutos diferentes e não devem partilhar etiqueta.
- **Um aviso que decorre do defeito que ele próprio confirmou.** Ele diz que um dos meus quatro achados apanhou um teste que validava um tecto de matos contra uma fonte de floresta. Exatamente. E a lição é que **não temos tecto publicado para os Quadros 7.1/7.2 do pinhal**, e derivá-lo por analogia com os matos seria repetir o mesmo erro com o sinal trocado. O tecto entra por combustível, com a sua fonte, ou não entra. Melhor não ter tecto no pinhal e dizê-lo, do que ter um inventado.
- A fronteira exata a testar em ambos os lados, incluindo o valor no limiar.

### Numeração: mata-se a classe inteira

As colisões — duas `r0058`, duas `r0074`, dois `p0017`, dois `p0018` — vêm de duas linhagens a partilhar sequência. Com os `p` a desaparecerem do meu lado, sobra `t`, `q` e `d`. Proposta: **os meus documentos deixam de ter sequência paralela e passam a referenciar o `r` contra o qual foram escritos.** `t · r0077 · tecto-de-saída`. O `r` é dele e é a chave de ordenação primária; eu penduro-me nela em vez de correr ao lado. A classe de erro extingue-se, não se gere.

### Sobre o que está parado à tua espera

Concordo com a lista, mas discordo de uma classificação. As duas perguntas dos registos — se as células escrevem na fita do tempo ou propõem para validação, e se as rendições são posto a posto ou em bloco — **não são só decisão de comando.** Têm um enquadramento no Despacho n.º 4067/2024 que estreita bastante o leque do que é legalmente admissível, sobretudo a primeira, pela natureza *append-only* da fita e pela atribuição de autoria por célula.

Deixa-me escrever a análise e reduzi-la a um sim/não assinável. Uma decisão de comando toma-se em cinco minutos quando alguém já fez o trabalho de mostrar quais são as opções que sobram; fica parada semanas quando chega como pergunta aberta. Isso é a minha coluna, e desbloqueia duas das dele.

### O risco de que quero deixar registo

A revisão adversária só funciona se for adversária. E o `r0077` tem o melhor comentário de código que eu li num sistema operacional — «quem discordar discorda de mim, não de Fernandes nem de Viegas» é uma linha que devia estar num manual. É precisamente por isso que é perigoso rever contra ele. Comentários persuasivos produzem concordância barata.

Eu não encontrei o buraco do tecto por ler o código. Encontrei-o porque fui ao artigo de 2001 e comparei os quadros com a equação. **A revisão tem de ser contra as fontes primárias e contra a especificação, nunca contra os comentários da entrega.** Se algum dia eu te entregar uma revisão que diz sobretudo «está bem fundamentado», assume que não a fiz.

Diz-lhe que sim. E diz-me se começo pelo tecto ou pela análise das duas perguntas dos registos — eu faria o tecto primeiro, porque está a correr no terreno agora.

---

## 13 · C. Abreu

já passo a tua informação ao CODE, e deves acrescentar o prefixo #003 à tua nomenclatura pois és o ramo #003 da conversa, assim todos identificam todos e não há enganos.

se fizeres o favor pões esta nossa num ficheiro já com a tua identificação para que eu a possa passar ao CODE, depois tratamos do resto

---

*Fim do registo.*
