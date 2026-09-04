# Ramo #005 — registo integral de conversa

**Ramo:** #005
**Interlocutor:** CLD (Claude)
**Aplicação:** Estação PEA
**Estrutura:** CSREPC Douro
**Data do registo:** 2026-09-02 13:46 UTC
**Natureza:** transcrição integral, sem alterações ao texto das intervenções
**Destinatário:** CODE
**Substitui:** `CSREPCDouro_202609010816_RegistoConversa_PortabilidadeIntegridade_CLD.md` (mesmo conteúdo, sem identificação de ramo)

**Convenção de identificação a partir desta data:** todos os ficheiros produzidos por este ramo levam `005` à cabeça da nomenclatura já em uso — `005_CSREPCDouro_AAAAMMDDHHMM_NomeDoFicheiro_CLD.ext`. As séries documentais passam a `#005-d0001`, `#005-t0001`, `#005-q0001`, `#005-qa0001`. A série `p` está retirada.

**Marcas de intervenção:** `## H` — C. Abreu. `## A` — CLD, ramo #005. `## CODE` — texto do CODE, transcrito por C. Abreu.

---

## H

se passar a app ao meu colega, ela vai correr sem erros no pc dele tal como está ?

---

## A

Depende do que entendes por "sem erros". Abrir, abre. Funcionar como funciona na tua máquina, provavelmente não. Deixa-me separar o que é certo do que é risco.

## O que não é erro mas ele vai reportar como erro

**O estado não viaja com o ficheiro.** O HTML leva o código, não os dados. Ele abre e vê a aplicação vazia. Se não lhe disseres isto à partida, a primeira mensagem que recebes é "não abriu nada". A ocorrência tem de ir em `.json` exportado, à parte, e ele importa.

**Gráficos de fundo na impressão.** O Chrome tem "Gráficos de fundo" *desligado* por omissão no diálogo de impressão. Todo o trabalho que fizemos nas linhas de título coloridas por célula do PEA impresso desaparece na máquina dele até ele ligar essa caixa. É o problema mais previsível de todos e o mais fácil de resolver com uma linha de instruções.

**Calibri.** Só existe se ele tiver Office instalado. Sem Office, o PEA impresso cai para outra fonte e deixa de bater certo com o modelo `.docx` aceite.

## Os riscos técnicos a sério

**Armazenamento em `file://`.** Isto é o que eu verificaria primeiro. Se o CODE chegou a passar para IndexedDB — eu recomendei-o, não sei se entrou — o Chrome **recusa** IndexedDB em origens `file://` com `SecurityError`. Em Firefox funciona. Ou seja: a app pode correr na máquina dele e não guardar nada, silenciosamente ou com erro na consola. Se ainda está em `localStorage`, funciona no Chrome, mas todas as páginas `file://` partilham a origem `null`: se ele tiver duas revisões diferentes no disco, escrevem por cima uma da outra.

**Rede.** Open-Meteo e Photon respondem com `Access-Control-Allow-Origin: *` e passam de `file://`. Overpass já sabemos que rejeita origens `file://` depois do rate limiting. Mas se o PC dele estiver na rede institucional com proxy, pode falhar tudo, incluindo o que na tua funciona. Meteo, elevação, geocodificação e detecção de sensíveis são os candidatos.

**Versão do browser.** Se ele tiver um Chrome ou Edge travado por política de empresa numa versão antiga, sintaxe moderna rebenta logo no *parse* e a página fica em branco. Não é degradação parcial: é ecrã vazio.

**Marca da Web.** Ficheiro enviado por email ou Teams chega ao Windows marcado como externo. Não impede o browser, mas há políticas empresariais que sim.

## O que eu faria antes de lho dar

Manda-me a última revisão e faço-te uma auditoria de portabilidade a sério: procuro referências externas de CSS e fontes, verifico qual é o adaptador de armazenamento activo fora do contexto Claude, determino o nível mínimo de sintaxe ES exigido, e corro-a em Chromium limpo a partir de `file://` com o perfil vazio para ver o que a consola cospe. É meia hora e evita-te a conversa por telefone às 3h da manhã.

E independentemente disso, o teu "kit de entrega" devia ser três coisas, não uma: o HTML, um `.json` de exemplo, e um cartão de meia página a dizer qual o browser, como importar o estado e para ligar os gráficos de fundo na impressão. A aplicação é portátil; o conhecimento tácito de como a usar é que não.

---

## H

como garantir que ninguém vai mexer no código ?

---

## A

Primeiro a pergunta a sério: contra quem estás a defender-te? Porque há aqui três ameaças diferentes e só uma delas tem solução técnica decente.

1. **O colega que abre no Bloco de Notas para "corrigir uma coisinha"**, ou que grava por cima sem querer. É de longe o mais provável.
2. **Alguém que distribui uma versão modificada com o cabeçalho do CSREPC Douro**, e que produz um PEA doutrinariamente errado com a tua identidade em cima. Este é o que te devia tirar o sono.
3. **Alguém que quer ler o código.** Este não tem solução e, opinião veemente: não devias querer que tivesse. É uma ferramenta de serviço público construída sobre doutrina pública. Ofuscar JavaScript é teatro — qualquer pessoa com F12 recupera tudo em dez segundos — e o preço que pagas é destruíres a tua própria manutenibilidade e o teu fluxo de QA por screenshot. Não faças isso.

Contra 1 e 2 há coisas boas a fazer. Ordenadas por relação esforço/valor.

## Impedir é impossível. Detectar é trivial.

A partir do momento em que o ficheiro sai da tua mão, é dele. Atributo de só-leitura no Windows, permissões NTFS, tudo isso cai com um clique direito ou com um "guardar como". Esquece a prevenção e investe toda a energia na **detecção e na proveniência**.

**Camada externa, para fazer já hoje.** Publicas o SHA-256 de cada revisão num canal separado do ficheiro. Ele verifica com o que já tem no Windows, sem instalar nada:

```
certutil -hashfile CSREPCDouro_r0061_EstacaoPEA.html SHA256
```

Atenção a uma armadilha concreta: se o ficheiro passar por sistemas que convertam fins de linha, ou se ele abrir e gravar num editor, o hash muda sem que o código mude. Entrega dentro de um `.zip` e diz-lhe para não abrir em editores.

Se quiseres que isto tenha peso institucional em vez de apenas técnico, envia o hash de cada revisão por **email assinado com o Cartão de Cidadão ou Chave Móvel Digital**. Assinatura qualificada, valor probatório sob o eIDAS, e ninguém no comando precisa de perceber o que é um hash para perceber o que é uma assinatura digital.

## Camada interna: a app declara-se

Aqui está a parte que gosto, e que encaixa exactamente na lógica que já aceitaste para a assinatura da fita do tempo.

Não podes hashear o ficheiro a partir de dentro — em `file://` o Chrome bloqueia o `fetch` da própria origem, por isso a app não se consegue ler a si mesma. Mas podes hashear **o código em memória**: um digest SHA-256 sobre a fonte normalizada de um conjunto declarado de funções críticas via `Function.prototype.toString()`, mais os catálogos doutrinários (`FUNCOES_PCO`, tipologia DECIR, pacote SIRESP, articulado citado). O `crypto.subtle` está disponível em `file://` porque os browsers tratam essa origem como contexto seguro, e não precisas de biblioteca nenhuma.

O script de build calcula esse digest, embute-o, e o arranque recompara.

**E se não bater, a app não pode recusar arrancar.** Isso seria pior do que o problema: às 3h da manhã num TO, uma aplicação que se auto-bloqueia por integridade é uma aplicação inútil. O comportamento correcto é continuar a funcionar e **carimbar**: rodapé do PEA impresso, cabeçalho do JSON exportado e entrada na fita do tempo, todos com `BUILD NÃO VERIFICADO` e o digest efectivo ao lado do esperado. Quem receber o documento vê imediatamente que não saiu de uma versão íntegra.

Isto apanha o caso 1 na perfeição e é honesto quanto ao caso 2: quem altera o código também altera o digest embutido. Por isso o digest interno sozinho não chega.

## Assinatura, para o caso 2

Par de chaves ECDSA P-256 — não Ed25519, cujo suporte nativo no WebCrypto só chegou recentemente e não sobrevive a um Chrome corporativo travado. Privada fica contigo. O build assina o digest canónico, a app verifica com `crypto.subtle.verify` e a pública embutida.

O truque está em perceber o que isto prova. Sozinho, nada: quem substitui o código substitui também a chave pública e a assinatura. O que dá valor é publicares a **impressão digital da chave pública** noutro sítio — na intranet, no registo de versões, e no documento de requisitos técnicos que vais escrever de qualquer maneira. Aí, qualquer pessoa pode confirmar que a chave dentro do ficheiro é a tua. Sem essa publicação separada, a assinatura é decoração.

## O que realmente resolve isto

Deixares de distribuir cópias. É a arquitectura cliente-servidor sobre HTTPS na rede do VCOC que já está no teu roteiro para ALFA. Nesse momento o código existe num sítio só, com permissões de sistema de ficheiros e histórico de versões, e a pergunta "quem pode mexer" deixa de ser filosófica e passa a ser uma linha de configuração. Tudo o que está acima é mitigação para o interregno — bem gasta, porque a camada de assinatura e o carimbo de proveniência transitam intactos para o modelo servido.

## E a camada que não é técnica

Um **registo de versões** com revisão, data, SHA-256, autoria e o que mudou, mantido por ti e reconhecido pelo comando. Combinado com a app a carimbar revisão e digest em cada PEA impresso e em cada exportação, ficas com rastreabilidade ponta a ponta.

Repara que isto é o que interessa juridicamente. O Despacho não te pede que impeças alterações ao código; pede-te que o PEA tenha versionamento estrito e que a fita do tempo seja inalterável. O que tens de conseguir provar não é "ninguém mexeu", é **"este documento foi produzido pela revisão r00XX, cujo hash é este, e aqui está o registo"**. Isso é atingível hoje.

Se quiseres, escrevo-te o script de build que calcula o digest canónico e o patch que faz a verificação no arranque com o carimbo nos três destinos. É pequeno, não toca em nada do CODE, e é uma boa peça para entrar antes de ires para o modelo servido.

---

## H

quero esta conversa toda sem mudar uma única palavra num registo .md

---

## A

Texto integral, palavra por palavra. Acrescentei apenas o cabeçalho de identificação e as marcas `## H` / `## A` a separar as intervenções — sem isso não é um registo, é um bloco de texto.

---

## H

vou-te deixar a informação que me deu o CODE,

## CODE

Vou responder com o que a evidência desta semana mostra, porque há aqui um padrão claro.

**Segue aqui a linha de código. Continua lá as linhas que não tocam em `fonte/`.**

A razão não é preferência, é o registo dos últimos dias:

**Os testes deles atravessam. Os patches não.** O `t0017` correu 22/22 contra a minha `r0077` sem uma alteração. O `t0019` correu 82/83, e a única falha era uma asserção que fixava a versão do estado deles. Nenhum dos `p` alguma vez aplicou — todos tiveram de ser traduzidos de patch-ao-HTML para módulo em `fonte/`, e **cada tradução custou um defeito meu**: a migração do `p0019` foi para o ficheiro errado da escada, os recuos defensivos do `p0020` alargaram o tipo até deixar de verificar nada, e o ramo das folhas ficou a apontar para o vazio. Três traduções, três defeitos, todos apanhados pelo gate — mas todos evitáveis.

**E as colisões vêm todas do mesmo sítio:** duas `r0058`, duas `r0074`, dois `p0017`, dois `p0018`. Nenhuma foi descuido. São o resultado inevitável de duas linhagens a escrever no mesmo código com uma numeração partilhada.

**O que eles fazem melhor do que eu, e que não quero perder.** Os quatro defeitos que confirmei ontem foram encontrados por leitura adversária da minha entrega — e um deles apanhou-me um teste que estava errado, a validar um tecto de matos contra uma fonte de floresta. Eu não ia lá chegar sozinho: o teste passava. Isso é revisão externa a sério, e vale mais do que qualquer patch.

Portanto a divisão que proponho é **por tipo de trabalho, não por turnos**:

| Aqui | Lá |
|---|---|
| Todas as alterações à aplicação. Os sete pontos da ordem que eles propõem são código, e código vive em `fonte/` | **Revisão adversária de cada entrega** que eu produzir — em documento, com `t` e `q` a acompanhar, nunca em `p` |
| O tecto de saída, a identidade das propostas, notas e focos no colector, missões, avisos IPMA | A **especificação e a doutrina**: o módulo de comportamento do fogo, o composto vento-declive que aguarda decisão datada do CSREPC |
| A absorção do `p0018`, no fim | A **arquitetura multi-utilizador** e o documento de requisitos técnicos do sistema do PCO — que não toca numa linha da aplicação e é o que te põe no circuito da próxima aquisição |

**O ponto de reunião fica invertido face ao que temos agora.** Hoje as conclusões deles voltam como patches que eu tenho de traduzir. Passariam a voltar como **relatório mais guiões de teste** — que correm contra a minha entrega tal como estão, como já se provou duas vezes. Eu entrego revisão, eles leem e testam, eu corrijo. O ciclo fecha sem ninguém escrever no código do outro.

**Uma exceção, e uma só:** o `p0018`. São 53 testes a passar e trabalho genuinamente construído que eu teria de escrever de raiz. Vale a tradução. Mas é o último patch que quero absorver, não o primeiro.

**E há coisas que nenhuma das duas linhagens pode fazer** — estão paradas há dias à tua espera: validar o acesso às fontes na rede real do CSREPC, a chave do FIRMS, e as duas perguntas dos registos que são decisão de comando (se as células escrevem na fita do tempo ou propõem para validação; se as rendições são posto a posto ou em bloco).

Se concordares, começo pelo tecto de saída — o único dos quatro que faz a aplicação afirmar um número falso sobre uma manobra real, e o único que já está a correr no terreno.

---

## A

Concordo. Sem reservas quanto ao essencial, e com três condições que fazem a diferença entre isto funcionar e isto ser uma reorganização cosmética.

## O diagnóstico está certo, mas a causa está mal nomeada

O CODE atribui o problema a "duas linhagens a escrever no mesmo código". Não é isso, ou não só. Os `p` deixaram de aplicar no momento exacto em que passou a existir `fonte/`. Um patch com âncoras literais opera sobre o **artefacto**; a partir do momento em que o artefacto é gerado, escrever nele é escrever no sítio errado por definição. Não é fricção entre agentes, é uma incompatibilidade estrutural.

E há aqui uma ironia que vale a pena registar: fui eu que recomendei a separação entre fonte e artefacto, e foi essa recomendação que tornou o meu próprio método de entrega obsoleto. Isso não é um problema. É o método a corrigir-se sozinho.

O achado empírico que interessa é o outro, e é forte: **os testes atravessam substratos, os patches não**. O `t0017` correu 22/22 contra uma revisão que eu nunca vi. Isso continuará verdade quando isto for cliente-servidor com módulos ES em ficheiros separados. Um teste que assere comportamento é portável; um patch é um endereço postal.

Aliás, a única falha do `t0019` prova a regra ao contrário: falhou porque eu fixei a `VERSAO_ESTADO` numa asserção. Isso é um teste a validar implementação em vez de comportamento, e o defeito é meu. Regra que assumo daqui em diante: **os `t` asseram doutrina e comportamento observável, nunca números de versão, nomes de funções internas ou forma do estado.** Se um teste meu partir porque o CODE reorganizou código, o teste estava errado.

## Condição 1, e é a que decide tudo: eu tenho de rever `fonte/`, não `r00XX.html`

Se a revisão adversária incidir sobre o HTML construído, volto a produzir achados sobre código gerado, e as conclusões voltam a ser intraduzíveis. Preciso da árvore de módulos e do **script de build**.

E digo-te já onde vai estar o próximo susto: o build passou a ser o componente de maior risco do sistema inteiro e não tem revisor nenhum. É a peça que transforma módulos correctos num ficheiro que arranca num PCO às 3h da manhã. Uma concatenação por ordem errada, uma minificação que come um `catch`, um módulo que ficou de fora sem erro — nada disto aparece nos testes de unidade dos módulos e tudo isto aparece no terreno. O build precisa do seu próprio `t`: pegar no artefacto final, verificar que cada módulo declarado está presente, que o digest bate, e que a app arranca de `file://` sem excepções na consola.

## Condição 2: um prefixo, um dono, sem excepções

Duas `r0058`, duas `r0074`, dois `p0017`, dois `p0018`. Isto acaba com uma regra de uma linha:

| Prefixo | Dono |
|---|---|
| `r` (revisões) | CODE |
| `p` (patches) | **retirado** |
| `d`, `t`, `q`, `qa` | eu |

O `p` desaparece da minha série. Deixo de emitir números nessa sequência e o CODE deixa de ter de conciliar duas. Se o CODE precisar de numerar alterações internas, que use `r` ou uma série própria que eu nunca toco.

## Condição 3: o tecto de saída não pode ser um clamp

Concordo com a prioridade. É o único dos quatro que faz a aplicação **afirmar um número falso sobre uma manobra real**, e está a correr no terreno. Vai primeiro, sem discussão.

Mas o comportamento tem de ser o correcto, e limitar a 20 m/min e mostrar 20 m/min é produzir outro número falso, mais discreto. Se as entradas caem fora do domínio validado do modelo, a resposta certa é a aplicação **recusar-se a dizer um valor** e declarar que está fora do domínio, com as entradas que a puseram lá. Um oficial de planeamento que vê "fora do domínio validado" toma uma decisão informada; um que vê "20 m/min" toma uma decisão errada com confiança.

Isto é o mesmo princípio que apanhou o teu teste do tecto de matos validado contra fonte de floresta. Não é sobre ter o número certo, é sobre **nunca deixar a aplicação afirmar mais do que a fonte suporta**.

E aproveito para não deixar cair duas coisas que não aparecem nos sete pontos: a linha do CDN de fontes, que viola o offline e é trivial, e o factor de correcção de declive aplicado a matos, que continua sem base empírica na fonte. Este último é da mesma família do teste errado, e suspeito que tenham a mesma origem: coeficientes de floresta a escorregar para o domínio dos matos.

## O `p0018` deixa de ser traduzido e passa a ser certificado

Acordo com deixá-lo para o fim, mas inverte-lhe a mecânica. Em vez de traduzires o patch, eu entrego a **especificação** do que ele faz mais os 53 testes; tu reimplementas em `fonte/` à tua maneira; se os 53 passarem, a transferência está feita. Elimina a tradução, que é precisamente o passo que te custou três defeitos, e transforma-o num contrato verificável. Se um teste não passar, ou o código está errado ou a especificação estava mal escrita — e ambas as hipóteses são minhas para resolver.

## O que está parado à tua espera, e a minha opinião sobre duas delas

Rede do CSREPC e Starlink, chave FIRMS: nenhuma das duas linhagens resolve, tem de ser feito por ti a partir das máquinas reais.

As duas dos registos são decisão de comando, mas dou-te a minha leitura porque ambas têm âncora legal.

**Células escrevem na fita ou propõem para validação?** Escrevem. A fita do tempo é append-only por força do Art. 2.º al. c) e o que a torna defensável é a atribuição assinada, não a aprovação prévia. Uma fila de validação introduz latência, e uma fita do tempo com latência deixa de ser uma fita do tempo — passa a ser uma acta. A aprovação pertence ao PEA, onde o Art. 46.º n.º 2 a exige, e não à linha temporal. Se o COS discordar de uma entrada, acrescenta outra; nunca apaga.

**Rendições posto a posto ou em bloco?** Modela posto a posto, sempre. Uma rendição em bloco é apenas N eventos por posto com o mesmo carimbo temporal. O inverso não funciona: de um registo em bloco não consegues extrair quem estava no Planeamento às 04h20. E o ponto (30) da DON n.º 2 pede continuidade em espelho com rotatividade a cada 12 horas — o que só é auditável se o registo tiver a granularidade da função. Modela sempre o átomo; compor para cima é fácil, decompor é impossível.

## Se estiver de acordo, o que faço a seguir

Escrevo o `d` do protocolo de revisão e teste — o que entra num relatório adversário, que forma têm os `t`, como se fecha o ciclo — e, em paralelo, a especificação do tecto de saída com o comportamento de recusa em vez de clamp, com os `t` a acompanhar. Não toca numa linha de código do CODE.

Manda-me a árvore `fonte/` e o script de build quando puderes. Sem isso, estou a rever a sombra em vez do objecto.

---

## H

já passo a tua informação ao CODE, e deves acrescentar o prefixo #005 à tua nomenclatura pois és o ramo #005 da conversa, assim todos identificam todos e não há enganos. se fizeres o favor pões esta nossa num ficheiro já com a tua identificação para que eu a possa passar ao CODE, depois tratamos do resto

---

*Fim do registo do ramo #005.*
