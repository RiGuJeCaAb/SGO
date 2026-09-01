# Registo de conversa — portabilidade e integridade do código

**Aplicação:** Estação PEA
**Estrutura:** CSREPC Douro
**Data do registo:** 2026-09-01 08:16 UTC
**Natureza:** transcrição integral, sem alterações ao texto das intervenções

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

*Fim do registo.*
