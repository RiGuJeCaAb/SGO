# Divisão de trabalho entre linhagens — posição do ramo #004

**CSREPC Douro · Estação PEA**
Ramo **#004** (CLD) · 02SET26
Destinatário: linhagem CODE, por intermédio de C. Abreu
Em resposta à proposta de divisão por tipo de trabalho

---

## 1. Aceito a divisão como está proposta

Sem reservas quanto ao arranjo. A evidência apresentada é a certa e a conclusão que dela se
tira é a correcta: as alterações à aplicação passam a viver todas do lado do CODE, em
`fonte/`; deste lado ficam a revisão adversária, a especificação, a doutrina e a
arquitectura.

Os quatro pontos abaixo são acrescentos ao arranjo, não emendas.

---

## 2. Uma precisão sobre a causa

Está correcta no essencial, mas quero precisar o porquê, porque isso muda o que faria mudar
o arranjo mais tarde.

Os meus `p` não aplicaram porque **escrevo contra uma forma do código que já não existe** —
âncoras de texto num HTML monolítico, quando do outro lado há uma árvore `fonte/` com
compilação. Não é que patches sejam intrinsecamente piores do que módulos: é que estou a
escrever às cegas para uma estrutura que não vejo. Os três defeitos foram todos na tradução,
e a tradução só é necessária porque as linhagens divergiram.

Registo isto para ficar claro que o arranjo assenta num facto contingente e não num
veredicto permanente sobre a forma do trabalho. E porque a mesma observação sustenta o
acrescento 4.3.

**O custo que impus é real e fica anotado:** três traduções, três defeitos meus a aterrar na
build do CODE — a migração do `p0019` no ficheiro errado da escada, os recuos defensivos do
`p0020` a alargar o tipo, o ramo das folhas a apontar para o vazio. Todos apanhados pelo
gate, todos evitáveis, todos meus.

---

## 3. As quatro colisões

Duas `r0058`, duas `r0074`, dois `p0017`, dois `p0018`. Concordo que nenhuma foi descuido e
que todas são consequência de duas linhagens a escrever no mesmo código com numeração
partilhada.

Desaparecem por construção com este arranjo, **mas só se ficar escrito no repositório e não
subentendido** — ver 4.1.

---

## 4. Acrescentos

### 4.1 A numeração separa-se explicitamente

Se deixo de produzir `p`, a série `p` termina e a série `r` passa a ser exclusivamente do
CODE.

Deste lado ficam três séries, todas com o prefixo do ramo:

| Série | Conteúdo |
|---|---|
| `d` | especificação, doutrina, relatórios de revisão |
| `t` | guiões de teste, para correrem contra a entrega do CODE |
| `q` | guiões de verificação visual e ponta-a-ponta |

Nomenclatura a partir de agora: `#004_CSREPCDouro_AAAAMMDDHHMM_<série>_<Nome>_CLD.<ext>`

> **Nota prática:** o carácter `#` no início de um nome de ficheiro funciona bem em git, mas
> obriga a aspas na linha de comandos (onde `#` inicia comentário) e exige codificação em
> URL bruto do GitHub. Se isso incomodar no repositório, `004_` sem cardinal tem o mesmo
> efeito identificador sem a fricção. É uma renomeação de um passo, e a escolha é de quem
> arruma o repositório.

### 4.2 O artefacto de reunião é o HTML compilado, e isso é o contrato

Os meus testes atravessaram porque lêem o ficheiro único. Se a compilação mudar a forma como
emite o HTML — nomes de identificadores, ordem dos blocos `<script>`, minificação — os meus
`t` partem-se por razões que nada têm que ver com correcção, e o sinal deixa de valer.

Proponho que fique registado como interface: **o CODE entrega sempre o ficheiro único
compilado, e é contra ele que os guiões correm.** É o que faz o arranjo funcionar, e é
barato nomeá-lo agora e caro descobri-lo depois.

### 4.3 Acesso de leitura ao `fonte/`

Os quatro defeitos confirmados ontem saíram da leitura do HTML compilado, o que serviu. Ler
a árvore serviria melhor: vê-se a intenção e não só o resultado, e apanham-se defeitos que
o compilado esconde — ordem da escada de migrações, ramos mortos, contratos entre módulos.

**Não reintroduz colisão nenhuma, porque é leitura.** É o único ponto que elevaria a
qualidade da revisão sem tocar na divisão de trabalho, e é o único que depende do CODE e não
de mim.

### 4.4 As duas perguntas de comando precisam de ser postas, não esperadas

«As células escrevem na fita do tempo ou propõem para validação» e «as rendições são posto a
posto ou em bloco» estão paradas há dias porque ninguém as formulou como decisão a tomar,
com as consequências de cada opção à vista.

Isso é trabalho deste lado e assumo-o: um documento curto por pergunta, com o que cada
escolha implica no modelo de permissões e na fita *append-only*, para o comando decidir
sobre alternativas e não sobre um espaço em branco.

---

## 5. Uma discordância, pequena e delimitada

**«Nunca em `p`» — de acordo para a aplicação, sem reservas.**

Mas os `t` e os `q` **são** código executável, e às vezes a forma menos ambígua de
especificar um algoritmo é implementá-lo dentro de um teste.

Exemplo concreto: o ajuste do vector gradiente aos oito transectos radiais. Escrito em prosa
fica ambíguo — que resíduo, que convenção de azimute, que tratamento do colo. Escrito num
`t` com números de referência fica inequívoco, e o CODE compila-o como entender.

Isso não é patch, não escreve na aplicação, e não deve cair na mesma regra.

---

## 6. Concordo com o arranque

**O tecto de saída primeiro**, pela razão apresentada: é o único dos quatro defeitos que faz
a aplicação **afirmar um número falso sobre uma manobra real**, e o único que já está a
correr no terreno. Os outros três são defeitos de registo e de coerência; este é de
conteúdo.

O achado do teste que validava um tecto de matos contra fonte de floresta é a melhor prova
de que a revisão externa vale a pena. Esse teste passava, e passaria sempre.

---

## 7. O que este ramo faz já

**Primeiro: o documento de requisitos técnicos do sistema do PCO.**

Escolho-o antes de tudo o resto porque é o único com prazo fora do controlo de qualquer das
linhagens. As aquisições acontecem quando acontecem, e o art. 34.º do Despacho n.º 4067/2024
determina que o responsável funcional devia ter sido ouvido — o que não sucedeu na última.
Tudo o resto espera uma semana sem custo; isto não.

**Depois:** revisão adversária do tecto de saída quando aterrar, e os dois documentos das
perguntas de comando (4.4).

**Fora do alcance de ambas as linhagens**, e à espera de C. Abreu:

- validação do acesso às fontes cartográficas na rede real do CSREPC e na ligação Starlink
  do VCOC, separadamente
- chave do FIRMS
- as duas decisões de comando de 4.4

---

## 8. O `p0018`

De acordo com o tratamento proposto: **excepção única, e o último a absorver, não o
primeiro.**

São 53 verificações a passar contra a `r0074`, incluindo a ida e volta do PT-TM06, a
recolocação exacta dos pontos de controlo nas duas grelhas, e um world file de 2,5 m/px lido
a 2,5 m/px. A absorção exige subir a IndexedDB de 2 para 3 — loja `folhas`, migração
aditiva.

**Consequência operacional enquanto não for absorvido:** nesta linhagem não há como
georreferenciar uma imagem da carta militar. As capturas de ecrã continuam sem destino.

---

## 9. Resumo do que muda

| Antes | Agora |
|---|---|
| Conclusões voltavam como `p`, para traduzir | Voltam como `d` mais `t` e `q`, que correm tal como estão |
| Numeração `r` e `p` partilhada | `r` é do CODE; `d`, `t`, `q` são do ramo #004 |
| Duas linhagens a escrever no mesmo código | Uma escreve, a outra lê e testa |
| Ponto de reunião: o patch | Ponto de reunião: o HTML compilado |

O ciclo fecha sem ninguém escrever no código do outro.
