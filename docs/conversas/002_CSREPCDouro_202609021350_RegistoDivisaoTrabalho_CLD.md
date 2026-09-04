# Divisão de trabalho entre linhagens — proposta do CODE e resposta do ramo #002

**Documento:** `#002_CSREPCDouro_202609021350_RegistoDivisaoTrabalho_CLD.md`
**Ramo:** #002 (Claude)
**Interlocutor:** CODE
**Intermediário:** C. Abreu (CSREPC Douro)
**Data:** 2 de setembro de 2026
**Objecto:** proposta de reorganização do trabalho entre as duas linhagens, e resposta

## Nota sobre fidelidade

Reproduz as duas intervenções palavra por palavra, sem alterações. A intervenção do CODE foi transmitida por C. Abreu; a resposta é do ramo #002.

## Nota sobre nomenclatura

A partir deste documento, todos os artefactos produzidos pelo ramo #002 levam esse prefixo, para que a proveniência seja legível sem consultar o conteúdo. Ver a secção final.

---

## Intervenção do CODE

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

## Resposta do ramo #002

Concordo, e sem reservas de fundo. O argumento está feito com evidência e não com preferência, que é a única forma de fazer este tipo de decisão. Três traduções, três defeitos — isso não é azar, é um sinal. E o diagnóstico dele está certo: eu tenho emitido patches contra uma forma de artefacto que já não existe. O `p` pressupõe ficheiro único; o repositório é uma árvore `fonte/`. A colisão não estava nas linhas, estava na premissa.

Antes de mais, uma coisa que ele acabou de me revelar sem querer: **eu analisei o `r0066`, um ficheiro único de 782 KB.** Ele fala de `r0077` e de `fonte/`. Isso são onze revisões e uma mudança de arquitectura de distância. Toda a análise que fiz do interpretador WMTS — a `wmtsCompativel()`, a recusa do `PTTM_06`, o traçado linha a linha — foi feita contra um artefacto que pode já não ter aquela forma. Não a retiro, porque a tabela de CRS não depende do código, mas o confronto com o código precisa de ser refeito contra o `r0077`. Antes de passares isso adiante como conclusão, vale a pena eu ver a `fonte/` actual.

## Três emendas à proposta

**Primeira, e é a que mais me importa: se eu deixo de escrever no código, deixo também de ser verificável.** Um documento meu não corre, não falha, não tem gate. A revisão adversária torna-se uma opinião sofisticada, e opinião sofisticada é exactamente o que este projecto não pode ter — foi assim que produzi uma análise inteira sobre o protocolo errado.

A correcção é simples e endurece a proposta dele: **todo o defeito que eu reporte tem de vir com um teste que falha.** Não um teste que descreve o defeito — um teste que corre contra a `r0077` e fica vermelho. Se eu não conseguir escrever esse teste, não percebi o defeito o suficiente para o reportar, e calo-me até perceber. Isso torna a minha saída falsificável e mantém-me sob gate sem me devolver acesso de escrita.

**Segunda: a colisão de numeração resolve-se separando o espaço de nomes, não dividindo o trabalho.** Duas `r0058`, duas `r0074`, dois `p0017`, dois `p0018` — isso acontece porque partilhamos um contador. O `r` é dele e sempre foi. As minhas séries passam a levar sigla: `t-CLD-0001`, `q-CLD-0001`, `d-CLD-0001`. Custa nada e a classe de erro desaparece por construção, independentemente de quem escreve onde.

**Terceira, sobre o `p0018`:** concordo que vale a tradução, mas não a traduzas a ler o patch. Pega nos 53 testes, corre-os contra a `r0077`, vê quais ficam vermelhos, e implementa até ficarem verdes. A tradução passa a ser guiada pelos testes em vez de pela leitura do diff — que foi precisamente onde os três defeitos anteriores entraram.

## O que ele apanhou e que vale mais do que parece

O teste errado — um tecto de matos validado contra fonte de floresta. Isso não é um defeito isolado; é da mesma família do que já tínhamos assinalado no módulo de comportamento do fogo, o factor de correcção de declive aplicado a matos sem base empírica na fonte. **Duas ocorrências do mesmo padrão: confusão de proveniência entre tipo de combustível.**

Se aconteceu duas vezes, é provável que haja mais. Proponho como primeiro trabalho da minha coluna uma auditoria de proveniência a todos os coeficientes do MCF, tabela a tabela, a perguntar de que combustível veio cada número. Um número sem proveniência é pior do que nenhum número, e um número com a proveniência trocada é pior ainda, porque parece ter.

## Concordo com a prioridade dele

O tecto de saída primeiro. É o único dos quatro que faz a aplicação afirmar um número falso sobre uma manobra real, e está a correr no terreno. Um modelo validado até 20 m/min a devolver 34 sem dizer nada é o defeito mais perigoso que este projecto tem neste momento — mais do que qualquer coisa de cartografia, porque a cartografia falha visivelmente e este falha com ar de certeza.

## O que fica por dizer na proposta dele

**A decisão do sistema de coordenadas não aparece na tabela.** Web Mercator ou EPSG:3763 é maior do que qualquer dos sete pontos e condiciona tudo o que se construa por cima. Se ele já decidiu, preciso de saber qual foi. Se não decidiu, isso é o item que devia estar no topo da coluna dele, não o tecto de saída — embora o tecto de saída seja mais urgente por estar a mentir agora.

**As duas perguntas de comando são tuas e só tuas**, mas não tens de as responder no vazio. Se as células escrevem directamente na fita do tempo ou propõem para validação é decisão de comando com moldura legal: o Art. 2.º al. c) impõe que a fita seja apenas de acrescento, e o Art. 46.º n.º 2 fixa o modelo de versões do PEA. Isso não decide por ti, mas restringe o espaço. Posso preparar-te as opções com a moldura ao lado, para decidires com a doutrina à frente em vez de em abstracto. É trabalho de meia hora e desbloqueia as duas linhagens.

**A validação de rede no CSREPC e na Starlink continua parada.** Já disse isto duas vezes e digo a terceira porque é o único item da lista que ninguém pode fazer por ti e que, se correr mal, invalida planeamento feito. Vinte minutos num posto do comando, o mesmo bloco `curl.exe` que já correste.

---

Diz ao CODE que aceito a inversão do ponto de reunião e que a única contrapartida que peço é a regra do teste vermelho. Se ele concordar com isso e com a sigla na numeração, começamos hoje.

---

## Nomenclatura do ramo #002

Determinada por C. Abreu em 2 de setembro de 2026, para que cada linhagem se identifique sem ambiguidade.

**Ficheiros:**

```
#002_CSREPCDouro_AAAAMMDDHHMM_NomeDoFicheiro_CLD.ext
```

**Séries documentais:**

| Série | Formato | Conteúdo |
|---|---|---|
| `d` | `d#002-0001` | documentos de especificação e análise |
| `t` | `t#002-0001` | guiões de teste funcional |
| `q` | `q#002-0001` | guiões de verificação visual e QA |
| `qa` | `qa#002-0001` | evidência visual |

A série `r` permanece exclusiva do CODE, como chave de ordenação primária. A série `p` fica extinta do lado do ramo #002 por efeito desta divisão de trabalho, com a excepção acordada do `p0018`.

**Reserva técnica.** O carácter `#` é legal em nomes de ficheiro no Windows e em sistemas POSIX, mas é o delimitador de fragmento em URL. Quando a Estação PEA transitar para o modelo cliente-servidor sobre HTTPS na rede local do VCOC, qualquer destes nomes servido por HTTP será truncado no `#` salvo codificação percentual explícita (`%23`). Se o repositório vier a ser exposto por HTTP, recomenda-se substituir por `002_` sem o cardinal. Fica registado para decisão de C. Abreu; até lá aplica-se a forma pedida.
