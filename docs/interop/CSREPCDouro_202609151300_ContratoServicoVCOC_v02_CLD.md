# Serviço de acompanhamento da Estação PEA — contrato v0.2

**Estado: proposta.** Escrito para ser construído do lado do servidor da VCOC em paralelo
com a aplicação. Nada aqui está implementado ainda; o que existe hoje na Estação é a
metade local — resumos SHA-256, proveniência e identidade declarada — e está assinalado.

> **Substitui a v0.1 na íntegra.** Acrescenta a secção 4, sobre postos, ocupações e
> assinatura da atribuição, pedida a 15 de setembro: um modo de assinatura digital na
> atribuição de postos, células e responsabilidades, para que o que fica na fita do tempo
> sirva para defender as decisões e quem as tomou. A secção 6, a ordem de construção,
> passa a contar com ela. O resto está como estava.

## 1. O que o serviço é, e o que não é

A Estação PEA é **local-first, e isso é requisito e não fase**. O posto de comando
trabalha com ligação intermitente ou nenhuma, e uma aplicação que precise de servidor para
registar a evolução cala-se quando é mais precisa.

O serviço não é onde a ocorrência vive. É onde ela fica **provada e replicada**:

| A Estação faz | O serviço faz |
|---|---|
| Regista tudo, sempre, offline | Guarda o que lhe chega, e devolve recibo assinado |
| Calcula o resumo de cada estado | Contra-assina esse resumo com chave que não viaja |
| Diz quem está ao teclado (declarado) | Diz quem está autenticado (conta + segundo fator) |
| Continua a funcionar sem ele | Nunca é caminho crítico de um registo |

**Regra de ouro:** nenhuma operação da Estação pode bloquear à espera do serviço. Tudo o
que for para o serviço vai de uma fila que drena quando há rede.

## 2. Contas e perfis

Os perfis já existem na Estação, em `PERFIS` — e hoje **escolhem-se em vez de se provar**.
O serviço é o que os torna verificáveis. A tabela é a mesma, para não haver duas verdades:

| Chave | Perfil | Pode |
|---|---|---|
| `observador` | Observador | consultar |
| `operador` | Operador de registo | escrever |
| `planeamento` | Célula de planeamento | escrever, elaborar |
| `operacoes` | Célula de operações | escrever |
| `logistica` | Célula de logística | escrever |
| `cos` | COS ou adjunto de comando | escrever, elaborar, aprovar, encerrar |
| `admin` | Administração | tudo, mais configurar |

**Uma conta pertence a uma pessoa, nunca a um posto.** «O portátil do PCO» não é um
utilizador: quem se autentica é quem responde pelo ato, e é esse nome que fica no processo.
Um posto de comando com três pessoas ao longo de um turno tem três autenticações.

Requisitos mínimos de conta:

- identificador institucional, nome, entidade, contacto;
- palavra-passe com política declarada, guardada com **Argon2id** (ou bcrypt com custo
  adequado, se aquele não estiver disponível) — nunca em claro, nunca com SHA simples;
- **segundo fator obrigatório** para os perfis `cos` e `admin`; TOTP (RFC 6238) é o mínimo,
  por não exigir rede no momento da autenticação — o que num TO importa;
- sessão com validade declarada e revogável do lado do serviço;
- registo de acesso: quem, quando, de que posto, e o que fez.

**Enquanto o serviço não existir**, a Estação continua com identidade declarada, e diz
essas palavras no ecrã. Não se chama autenticação ao que não é.

## 3. Sincronização

A Estação envia **estados**, não campos. Cada envio é um instantâneo completo da
ocorrência, com o resumo canónico que a Estação já calcula hoje (`resumoEstado`, SHA-256
sobre serialização de chaves ordenadas — `fonte/1-nucleo/19-resumo-criptografico.js`).

```
POST /ocorrencias/{num}/estados
{
  "tipo": "peaapp:ocorrencia",
  "versao": 14,                    // versão do estado gravado
  "app": "r0064",                  // revisão da Estação que produziu
  "g": "301500AGO26",
  "sha": "<64 hex>",               // resumo canónico do estado
  "anterior": "<64 hex|null>",     // o resumo do envio anterior desta ocorrência
  "estado": { … }
}
```

`anterior` é o que faz a **cadeia**: cada estado aponta para o anterior, e o serviço recusa
uma cadeia partida — com o motivo, e sem apagar nada. É assim que se deteta um registo
reescrito a meio.

Resposta:

```
201  { "recibo": { "sha": "<64 hex>", "g": "301500AGO26",
                   "por": "<identificador da conta>",
                   "assinatura": "<base64>", "chave": "<id da chave>" } }
409  { "erro": "cadeia_partida", "esperado": "<64 hex>", "recebido": "<64 hex>" }
```

A **assinatura é do serviço**, com chave que nunca sai dele. É isto — e só isto — que dá
não-repúdio: o resumo sozinho pode ser recalculado por quem altera o ficheiro, e a Estação
já diz isso por escrito no código.

A Estação guarda o recibo junto da ocorrência e mostra-o: «Estado replicado e assinado
301500AGO26 — recibo `a3f9…`». Uma ocorrência sem recibos é uma ocorrência que ainda só
existe num portátil, e deve poder ver-se isso de relance.

### Fila e conflito

- A fila é local, persistente e por ordem; drena quando há rede; nunca perde por falha.
- Dois postos a trabalhar a mesma ocorrência **não se fundem automaticamente**. O serviço
  aceita ambas as cadeias, marca-as como divergentes e devolve o aviso; a resolução é
  humana e fica registada. Fundir registos operacionais sem alguém decidir é inventar
  história.

## 4. Postos, ocupações e assinatura da atribuição

### 4.1 A pergunta que a secção 3 não responde

O recibo assinado da secção 3 dá não-repúdio ao **registo**: prova que aquele estado, naquele
instante, não foi alterado depois. Num inquérito isso responde a uma pergunta — «este registo
foi mexido?» — e não responde à outra, que é a que defende a decisão e quem a tomou: **quem
estava ali quando isto foi decidido, e com que responsabilidade**.

Hoje a resposta é o nome declarado em «Quem regista». Serve para atribuir e não serve para
provar, e a aplicação diz essas palavras no ecrã. O que falta é assinar a **atribuição**, não
o registo.

### 4.2 Posto, ocupação, ato

Três objetos, e a ordem entre eles é o que faz a cadeia.

**Posto.** Identidade estável, com célula atribuída nesta ocorrência. Não é uma pessoa nem uma
máquina: é um lugar na estrutura do posto de comando. Num PCO com um terminal por célula há um
posto por célula mais o do COS.

**Ocupação.** Uma pessoa num posto, entre dois instantes. O mesmo terminal passa de mão em mão
ao longo do turno, e o que muda na rendição é a ocupação, não o posto. É por isso que o objeto
central não é a sessão: uma sessão que dura o turno todo não distingue as três pessoas que se
sentaram ali.

**Ato.** O que se regista. Cada entrada da fita do tempo leva o posto e a ocupação em que foi
feita, além do GDH e do nome que já leva hoje.

### 4.3 O que se assina, e o que não se assina

**Não se assina cada linha da fita.** Uma assinatura por entrada seria um código por linha, e
num teatro de operações isso não acontece: ou se desliga, ou se deixa o cartão metido e a
assinatura deixa de provar o que quer que seja. A cadeia é outra.

Assina-se a **abertura da ocupação** — «assumo o posto de Operações às 151430SET26» — e assina-se
o **fecho**. A assinatura de quem entra no fecho de quem sai é a cadeia de custódia do posto, e é
a rendição. As entradas feitas entre os dois instantes ficam cobertas por duas coisas que já
existem: o resumo encadeado prova que não foram alteradas, e a ocupação assinada prova quem as
fez. **Uma assinatura cobre um intervalo**, e é isso que torna a coisa praticável.

Além da ocupação, assinam-se um a um os atos que valem por si:

| Ato | Quem assina | Onde está a norma |
|---|---|---|
| Atribuição de um posto a uma célula | Coordenador do PCO | art. 15.º |
| Abertura e fecho de ocupação | Quem ocupa; o fecho também por quem rende | Ato de gestão do posto |
| Aprovação do PEA | COS | art. 27.º, n.º 1, al. b) |
| Declaração de fase do SGO | COS | Ato de comando |
| Passagem de comando | Quem entrega e quem recebe | art. 9.º, n.º 2 |
| Encerramento do registo da ocorrência | COS | art. 2.º, n.º 1, al. c) |

### 4.4 Como se assina, e o que cada caminho prova

Quatro caminhos, e nenhum deles prova o mesmo. A tabela é para a decisão se tomar com os olhos
abertos, e não para escolher o que é mais fácil de programar.

| Caminho | O que prova | Assina sem rede | Peso |
|---|---|---|---|
| **A.** Chave qualificada em cartão | que aquela pessoa assinou | Sim; a validação é que precisa de rede | O mais alto |
| **B.** Token FIDO2, registado no serviço | que aquele token, ligado àquela conta, esteve presente | Sim | Intermédio; não é assinatura qualificada |
| **C.** O serviço assina por quem se autenticou | que o serviço acreditou ser aquela pessoa | Não | O mais baixo |
| **D.** Par de chaves gerado no dispositivo, público registado quando há rede | que o mesmo dispositivo produziu a cadeia | Sim | Continuidade, não pessoa |

**Proposta:** B para a ocupação corrente, que é o que acontece muitas vezes por turno; A para os
atos da tabela do ponto 4.3, que são poucos e pesados; D como rede de segurança onde não houver
nem uma nem outra, porque uma cadeia de dispositivo vale mais do que nada. **C não**, e a razão
é a mesma de todo este documento: a assinatura passaria a ser do serviço e não da pessoa, que é
exatamente o que se quer evitar.

### 4.5 O que isto custa, e o que não se pode fingir

**Assinar dentro do navegador obriga a servir a aplicação de uma origem.** Nem o FIDO2 nem um
cartão falam com uma página aberta de `file://`: o primeiro exige origem segura, o segundo exige
um intermediário que a página não pode invocar. Isto é o preço da ideia e tem de ser dito ao
lado dela. As saídas são três: a VCOC servir a Estação de uma origem local, no seu próprio
equipamento; a assinatura acontecer numa aplicação de acompanhamento, com a Estação a entregar-lhe
o resumo; ou acontecer do lado do serviço, que é o caminho C e foi recusado acima.

**A Estação continua a abrir de `file://` e a registar sem nada disto.** Vale a regra de ouro da
secção 1: a assinatura é capacidade a mais onde houver VCOC, e nunca caminho crítico de um
registo. Um posto sem cartão, sem token e sem rede regista na mesma, com identidade declarada, e
a diferença entre um registo assinado e um declarado vê-se no ecrã.

**Uma assinatura não diz quando.** Diz que aquela chave assinou aquele resumo, e o instante é o
que quem assina escreveu. Um GDH declarado continua a ser uma declaração. O carimbo do tempo de
uma terceira parte é o que transforma o instante em prova, e precisa de rede. Portanto:
assina-se quando acontece, carimba-se quando houver rede, e a aplicação distingue à vista o que
tem carimbo do que tem só o GDH declarado. Sem essa distinção, uma chave comprometida envenena
tudo o que vem depois do último estado bom conhecido; com carimbo, invalida o futuro e deixa o
passado de pé.

**A chave privada nunca sai do cartão ou do token**, e não há aqui nenhuma palavra-passe guardada
dentro do ficheiro da Estação. É a mesma razão pela qual a identidade declarada não se chama
autenticação.

### 4.6 O que fica por decidir, e não decido eu

- **Que chaves.** Cartão de Cidadão ou cartão institucional. Usar o Cartão de Cidadão para atos
  profissionais tem consequências de proteção de dados que não são deste documento.
- **Que patamar de assinatura é exigível** para defender uma decisão operacional em inquérito. O
  Regulamento (UE) n.º 910/2014, dito eIDAS, distingue assinatura simples, avançada e qualificada,
  e só a qualificada tem a equivalência à assinatura manuscrita. **Qual é a exigível aqui é
  pergunta jurídica e não técnica, e responde-se antes de se comprar o que quer que seja.** A lei
  nacional que o executa e os artigos concretos ficam por confirmar: não se escrevem de cor.
- **Quem é a autoridade de certificação**, e quem emite, revoga e guarda o registo das chaves. O
  art. 34.º atribui ao núcleo de comunicações e sistemas de informação a gestão dos sistemas de
  informação necessários à operação, e é aí que isto cai.
- **Quanto tempo se guardam** assinaturas, carimbos e certificados, que tem de ser pelo menos o
  tempo em que a decisão pode ser questionada.

## 5. O que **não** deve ir para o serviço

- O catálogo de elementos com contactos pessoais, sem decisão institucional prévia sobre
  RGPD: fundamento, minimização, prazo de conservação e quem acede.
- Qualquer coisa que a Estação envie hoje para modelos de linguagem, sem a mesma decisão.

Estes dois pontos não são técnicos e não os decido eu; ficam aqui porque é onde se veem.

## 6. Ordem de construção

1. Contas, perfis e sessão. Sem sincronização — só autenticar e devolver a identidade,
   que a Estação passa a usar em vez da declarada.
2. **Postos e ocupações, sem assinatura nenhuma.** Só o modelo do ponto 4.2 e o seu registo.
   É útil sozinha: a fita passa a dizer que posto fez o quê, e o modelo fica provado no
   terreno antes de se lhe pendurar criptografia.
3. Receção de estados, cadeia e recibo assinado.
4. **Assinatura da ocupação**, caminho B do ponto 4.4: abertura e fecho assinados com token.
5. **Assinatura qualificada dos atos do ponto 4.3**, caminho A, com carimbo do tempo.
6. Consulta: listar ocorrências, obter estados, verificar um recibo e uma assinatura.
7. Arquivo e auditoria.

Cada etapa é útil sozinha, e nenhuma delas torna a Estação dependente do serviço.

## 7. O que já existe do lado da Estação

| Peça | Onde |
|---|---|
| SHA-256 e serialização canónica | `fonte/1-nucleo/19-resumo-criptografico.js` |
| Carimbo no pacote exportado e na importação | `fonte/2-comando/03-exportacao-e-importacao-da-ocorrencia.js` |
| Carimbo do registo encerrado | `fonte/2-comando/04-encerramento-da-ocorrencia.js` |
| Proveniência do ficheiro importado | ramo `integridade` do estado |
| Perfis e identidade declarada | `fonte/1-nucleo/21-identidade-e-perfis.js` |
| Nome atribuído a cada ato, e quem está ao teclado no cabeçalho | `quemRegista()`, no mesmo módulo |

Falta, do lado de cá: a fila persistente, o cliente do serviço, e o recibo à vista. Espera
pela primeira etapa do servidor, porque não vale a pena escrever um cliente contra um
contrato que ainda pode mudar.

Dos postos e ocupações não existe nada, e é o que se pode fazer primeiro sem servidor: o
modelo do ponto 4.2 é estado local como qualquer outro, e a etapa 2 da ordem acima não
depende da VCOC para nada. A assinatura é que depende, e pela razão do ponto 4.5.
