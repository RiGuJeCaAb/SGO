# Ponto de situação — sessão de 31AGO26

**CSREPC Douro · Estação PEA**
Registo técnico da sessão · redigido 01SET26
Linhagem CLD (patches `p0017` a `p0020`) · linhagem CODE (builds `r0075` a `r0077`)

> **Natureza deste documento.** Não é transcrição da conversa. É o registo das decisões,
> das entregas e dos achados, e **cada afirmação sai de um ficheiro ou de um teste que
> existe em disco e pode ser conferida**. Onde não há prova conferível, está dito.

---

## 1. Estado no fim da sessão

| | |
|---|---|
| Build da linhagem CLD | `r0074` (`p0017`–`p0020` sobre o `r0070`) |
| Build da linhagem CODE | `r0077` (absorveu `p0017`, `p0019`, `p0020`) |
| Próximo número livre | **r0078** |
| Versão do estado (CODE) | 25 |
| Versão da base IndexedDB (CLD) | 3 — só na linhagem CLD, pelo `p0018` |
| Série de patches CLD | vai em `p0020` |

**Divergência conhecida entre linhagens:** o `p0018` — folhas de carta calibradas — não
foi absorvido. Decisão deliberada e documentada no `r0077` por comentário no
`retratoDoFogo()`. Consequência operacional na secção 6.

---

## 2. O ponto de partida

Uma pasta com trinta capturas de ecrã da carta militar não tinha onde entrar. A
funcionalidade «Carta pré-descarregada» recusava-as com uma mensagem que sugeria erro de
nomenclatura.

O diagnóstico inicial que dei — prefixo da pasta, extensão errada, árvore incompleta —
**estava errado**. O filtro de caminhos estava correcto e tolerante. A causa era outra, e
o código estava a um `grep` de distância.

---

## 3. Defeitos encontrados e corrigidos

### 3.1 O leitor de mosaicos era impossível de satisfazer

`r0070`, linha 1322:

```html
<input type="file" id="carta-fich" multiple accept="image/png,image/jpeg,image/webp">
```

Sem `webkitdirectory`, o browser não devolve `webkitRelativePath`; o código caía em
`f.name`, que nunca contém barras; e o filtro exigia duas:

```js
/(?:^|\/)(\d{1,2})\/(\d{1,7})\/(\d{1,7})\.(?:png|jpe?g|webp)$/i
```

**Nenhum ficheiro, pasta ou nome podia passar.** A mensagem de erro era a única saída
possível daquele campo.

Corrigido no `p0017`. Prova: `t0017`, verificação «o campo pede uma pasta
(webkitdirectory)» — falha no `r0070`, passa no `r0071` e no `r0077`.

### 3.2 A grelha da carta local não estava declarada

`grelhaAtual()` devolvia PT-TM06 sempre que não houvesse serviço, mas os mosaicos locais
eram servidos pelo `mosaicoBlob()` haja ou não serviço. Uma árvore `{z}/{x}/{y}` do
OpenStreetMap — Web Mercator por definição — era desenhada com aritmética portuguesa.

Carta no ecrã, alinhada, credível, **e tudo fora do sítio, sem aviso**.

As duas árvores numeram os quadrados de modo idêntico; nenhuma inspecção dos ficheiros as
distingue. Só a declaração o faz.

Corrigido no `p0017`: selector de projecção, gravado com os quadrados, lido ao arranque,
consultado pelo `grelhaAtual()` antes de assumir a portuguesa. Mais campo de origem da
carta — o próprio código dizia que não havia onde a declarar.

Prova: `t0017`, «grelhaAtual consulta a carta local antes de assumir PT-TM06».

### 3.3 Cinco painéis não chegavam ao PEA

Auditoria feita ao caminho do plano — `contexto()` e `detSituacao`/`detDecisao`:

| Painel | Chegava? |
|---|---|
| Dados operacionais, previsão, análise determinística | sim |
| Avisos IPMA | só à via do modelo |
| Leitura do terreno | parcialmente (só a orientação, via alinhamento) |
| Perfil de elevação | **não** |
| Estimativa da propagação | **não** |
| Intensidade da frente | **não** |
| Evolução das frentes | **não** |
| Linhas de contenção | **não** |
| Pontos marcados, sensíveis detectados, anexos | **não** |
| Proveniência da carta e da previsão | **não** |

Consequência verificável: a aplicação calculava «acima dos 4 000 kW/m atacar directamente
a cabeça é perigoso e inconsequente» e emitia um plano a dizer *«postura defensiva fora da
janela»*, com fundamento no LACES. **A mesma frase sairia para um incêndio de 200 kW/m.**

**Causa estrutural**, não esquecimentos: havia dois colectores a alimentar o plano —
`retratoOperacional()` para o dispositivo e `metricas()` para a meteorologia — e nenhum
para o ambiente de fogo. Os painéis escreviam no estado, pintavam o seu ecrã, e ninguém os
juntava.

Corrigido no `p0020` com o terceiro colector, `retratoDoFogo()`.

---

## 4. Funcionalidades entregues

### 4.1 `p0018` — Folhas de carta calibradas *(não absorvido)*

Resposta à pergunta de origem: uma imagem não é mosaico e nenhum nome a torna mosaico. O
que lhe falta é a ligação entre pixéis e terreno.

Duas vias, **uma só representação** — dois pontos de controlo, cada um com pixel e
coordenada:

- **World file** (`.pgw`/`.jgw`/`.wld`) ao lado da imagem, que é o que o QGIS escreve.
- **Dois pontos clicados**, com coordenada em graus ou em PT-TM06 metros.

A semelhança calcula-se **na grelha corrente**, não uma vez na gravação: a mesma folha
assenta certa em Web Mercator e em PT-TM06 porque o que ficou guardado foram coordenadas
do terreno.

**Aferição declarada:** escala em m/px, rotação, separação dos pontos, dimensão coberta.
Avisa acima de 3° de rotação, fora de 0,05–60 m/px, e quando os pontos estão próximos.

**Fica de fora de propósito:** a fotografia de esguelha. Dois pontos dão uma semelhança;
endireitar uma foto em ângulo é uma homografia e precisa de quatro. Calibrada com dois,
põe o centro certo e as bordas a centenas de metros.

Prova: `t0018`, **53/53** contra o `r0072` — incluindo a ida e volta do PT-TM06, a
recolocação exacta dos pontos de controlo nas duas grelhas, e o world file de 2,5 m/px a
sair 2,5 m/px. `q0018`: imagem sintética a 10 m/px por construção lida a **10,01 m/px**,
rotação −0,48° (convergência de meridianos do PT-TM06 naquele ponto).

### 4.2 `p0019` — Motor de propagação e catálogo *(absorvido)*

**Fontes, e nenhuma delas desta aplicação:**

- Fernandes & Loureiro (2021), *Modelos de combustível florestal para Portugal*, UTAD/CITAB
- Fernandes, Botelho & Loureiro (2002b), *Manual de Formação para a Técnica do Fogo
  Controlado*, UTAD — guias E1 (matos) e E2 (pinheiro bravo)
- Fernandes (2003), Revista enB n.º 27 — cadeia de interpretação

**Transcrito:** Quadro 3.2.1 (humidade, 16×7), 3.3.1 (vento a 2 m ≈ ⅔ do vento a 10 m),
3.4.1 (matos, 21×12), 3.4.2 (altura), 3.4.3 (declive), 7.1 (pinhal, 18×12), 7.2 (declive
multiplicativo e tipo aditivo).

**Os dois motores estão separados de propósito.** Nos matos tudo é multiplicativo; no
pinhal o declive é multiplicativo e **o tipo de combustível é aditivo, e entra depois**:
104 × 2,0 − 6 = 202, e não (104 − 6) × 2,0 = 196.

**Catálogo:** 18 modelos com código FARSITE, carga fina como intervalo, e o motor
correspondente. **Sete não têm motor português** — eucaliptal, folhosas, herbáceas — e
isso está declarado.

**Três recusas, que são a parte que interessa:**

1. **Acima de 25 °C** não se estima a humidade do combustível. O Quadro 3.2.1 traz impresso
   que não é válido acima dessa temperatura. Não avisa — recusa, e diz que o número tem de
   vir do FWI ou de medição. É a linha que separa o fogo controlado do DECIR.
2. **Modelo sem motor** — di-lo pelo nome em vez de usar o quadro errado.
3. **Buracos do Quadro 7.1** não viram zeros. Onde a fonte não dá propagação sustentada,
   devolve ausência de dados.

A terceira obrigou a corrigir a interpolação: **no acerto exacto sobre uma linha do quadro
deixou de se ler a vizinha**, senão a última linha de humidade ficava inutilizável
precisamente nos seus limites, que é onde é mais consultada.

Prova: `t0019`, **83/83** contra o `r0073`. Testa monotonia — mais vento nunca dá menos
propagação, mais humidade nunca dá mais, ar mais húmido nunca dá combustível mais seco — e
leituras exactas dos cantos de cada quadro. Uma tabela mal transcrita passa em qualquer
teste de fumo.

### 4.3 `p0020` — `retratoDoFogo()` *(absorvido)*

Terceiro colector, com o estatuto dos outros dois, consumido pelas duas vias.

**Reúne:** modelo e carga; R com a origem **lida da coincidência com a estimativa** (não de
uma bandeira que alguém pudesse esquecer de baixar); intensidade e veredicto; declive
máximo do perfil e onde está; frentes com a fonte do rumo; linhas com a largura; sensíveis
detectados e ainda não validados; proveniência da carta e da previsão.

**Propostas que produz, todas com número e origem:** interdição de ataque frontal acima de
4 000 kW/m; meios aéreos e vigia de secundários entre 2 000 e 4 000; meios terrestres entre
500 e 2 000; equipamento de sapador abaixo de 500; fronteira de validade no salto de classe
de declive; alargamento de linhas estreitas para a chama calculada; declaração de largura
em falta; confirmação de rumos deduzidos do traçado; validação com o ERAS dos sensíveis
detectados.

A segurança deixou de ser princípio: **distância em metros**, com fonte.

---

## 5. Decisões tomadas

**A força das propostas não se gradua na aplicação.** Tinha proposto duas forças conforme o
R fosse observado ou estimado. **Retirado.** O PEA é aprovado pelo COS (art. 27.º, n.º 1,
al. a); art. 46.º), e é a aprovação que confere força. À aplicação cabe pôr a qualidade da
prova à vista em cada fundamento, para que o COS aprove sabendo o que aprova.

**A carga passada à cadeia de interpretação é o extremo superior do modelo.** Não é
pessimismo: a decisão que daí sai é se alguém pode estar à frente das chamas, e nessa
decisão o erro para baixo custa mais caro. Está dito no ecrã e na fita. **Reversível se o
comando decidir de outro modo.**

**A ponte para o ε é pressuposto declarado, não resultado.** Os quadros de Fernandes são
multiplicativos; o Viegas é vectorial. A passagem de um ao outro usa
`ε = R₀·(f_declive − 1) / (R(U) − R₀)`, escrita no código e no ecrã para poder ser
recusada. **Quem discordar discorda de mim, não das fontes.**

**Proveniência por grandeza, não modo por painel.** Um interruptor automático/manual ao
nível do painel força uma escolha falsa: o estado real é sempre mistura. Cada valor carrega
`medido` / `calculado` / `declarado` / `convencionado`, com quem e quando.

**Validação só onde a aplicação fez juízo, não onde transportou número.** Se tudo exigir
validação, às três da manhã ninguém valida e o painel enche-se de números por validar — um
controlo que parece um controlo.

---

## 6. Divergência entre linhagens

O `r0077` **não tem as folhas de carta calibradas**. Verificado: `camadaFolhas`,
`folhaSemelhanca`, `createObjectStore("folhas")`, `fl-tela`, `fl-cal` e `world file`
ausentes.

**Consequência operacional:** nesta linhagem, as capturas da carta militar continuam sem
sítio para onde ir. Se o `r0077` passar a tronco, a capacidade perde-se até o `p0018` ser
absorvido — o que exige subir a versão da IndexedDB de 2 para 3 (loja `folhas`, migração
aditiva).

**Estado dos meus testes contra o `r0077`:**

| Teste | Resultado |
|---|---|
| `t0017` (carta local) | **22/22** |
| `t0018` (folhas) | não aplicável — funcionalidade ausente |
| `t0019` (quadros e motor) | **82/83** |

A única falha é do teste, não do código: o `t0019` fixa `VERSAO_ESTADO = 22` e a linhagem
CODE vai na 25. Asserção demasiado específica, a corrigir.

---

## 7. Correcções feitas pela linhagem CODE na absorção

Três, e todas correctas.

1. **Remoção do `FOLHAS`/`folhaCalibrada`** — código morto nessa linhagem. Marcador deixado
   no lugar para quando as folhas forem absorvidas.
2. **Queda dos recuos defensivos** `D.fogo || {r:"",w:""}` e `F.est || {}`. O argumento é
   melhor do que o meu: um recuo com forma diferente da real alarga o tipo até deixar de
   dizer nada, e o verificador passou a não saber que `est` tem `modelo` nem `hcm`. Esses
   ramos são garantidos pelo `novoEstado` e pela escada de migrações.
   *Reserva minha:* vale enquanto a escada tiver corrido antes de qualquer chamada. Se
   houver caminho de importação que chame o retrato sobre estado por migrar, deixa de
   degradar e passa a rebentar.
3. **`Math.tan(Math.atan(x))` → `x`** — eu tinha escrito uma ida e volta que é um não-op.
   A versão deles é idêntica e mais limpa.

E um achado que é deles: **os `id` das propostas são decorativos**, porque o `detDecisao`
renumera tudo para P1..Pn no fim. Os meus `PI`, `PQ`, `PL` nunca sobrevivem. Não dei por
isso porque o meu QA lia por posição.

---

## 8. Defeitos abertos

### 8.1 Identidade instável das propostas — **prioritário**

Consequência do achado anterior. `controloMissoes()` faz `k: x.id || "P"`, e os `id` são
renumerados por posição. Logo **P3 no PEA n.º 4 não é a mesma proposta que P3 no PEA n.º 5**.

Basta que uma proposta caia entre planos — a reserva constitui-se, o ponto de trânsito é
estabelecido, a linha estreita é alargada — para tudo o que está por baixo subir uma
posição. «Cumprimos a P2» deixa de ter significado estável entre versões de um documento
que é aprovado, executado e auditado.

Era inofensivo enquanto as propostas eram genéricas. **Deixou de ser no momento em que o
`p0020` as fez depender de dados que mudam de hora a hora.**

*Correcção:* chave estável na declaração de cada regra, separada do `id` de apresentação.

### 8.2 O buraco estrutural já reabriu

O `r0077` acrescentou **notas do mapa** (migração 22→23) e **focos de calor por satélite,
VIIRS/FIRMS** (migração 23→24). Verificado: **nenhuma das duas entra no `retratoDoFogo()`
nem no `contexto()`**.

A falha que o `p0020` corrigiu para onze painéis repetiu-se para os dois painéis seguintes,
na mesma sessão. Um foco de calor a norte do perímetro é exactamente o género de facto que
um plano tem de citar.

*Correcção:* o colector tem de ser **regra**, não correcção pontual. Nenhum painel novo
fecha sem declarar o que contribui. O `auditarPosse()` já é o sítio onde isso se verifica:
um ramo de `O.dados` com dono declarado e sem contributo para nenhum dos três colectores é
um painel que escreve para o vazio.

### 8.3 As missões discordam das propostas

A acção decisiva continua a dizer «dominar as frentes activas e fechar o perímetro» mesmo
quando as propostas já dizem que a cabeça não se ataca. Duas partes do mesmo documento em
contradição é pior do que qualquer delas estar sozinha errada.

### 8.4 Avisos IPMA — três defeitos

1. **Distrito errado.** O distrito escolhe-se por proximidade ao ponto de referência do
   IPMA, que é grosseiramente a capital. Para 41,0094 / −7,6050 — zona de Moimenta da
   Beira — devolve Vila Real, e é Viseu. A fronteira dos distritos não é uma mediatriz
   entre capitais. *Correcção:* Photon, que já está na aplicação e já devolve distrito,
   mais tabela fixa de dezoito entradas para o `idAreaAviso`.
2. **«Em vigor» inclui avisos futuros.** O filtro é `endTime >= agora` e não olha ao
   `startTime`.
3. **Uma hora de deriva no Verão.** `new Date(a.endTime)` sobre marca sem fuso é
   interpretada como hora local; o IPMA publica em UTC. Erro zero no Inverno, o que torna
   isto mais traiçoeiro.

### 8.5 Dívida técnica minha

- `t0020` por escrever — o `p0020` foi entregue só com QA ponta-a-ponta.
- `t0019` a fixar `VERSAO_ESTADO = 22`.

---

## 9. Especificado e não construído

**`CSREPCDouro_202608312145_d_CompositoVentoDeclive_CLD.md`** — composição vento × declive.
Regras `GRD` (vector gradiente por ajuste de plano aos oito transectos, **com resíduo**),
`THE` (ângulo por hora), `EPS` (a razão, nunca calculada, só declarada), `BAN` (banda de
rumo por varredura), `SAL` (salto de classe de declive), `REC` (recusas).

Anexo com critério de aceitação sobre os dados de 31AGO26: banda de **102°** com vento de
SO, **58°** com vento de S. Ambas indeterminadas.

**Aguarda decisões que não são minhas:** a lei de declive adoptada (Rothermel ou Viegas),
que altera todos os `k` da regra SAL e tem de ser acto datado do CSREPC; o intervalo de
varredura do ε; os limiares de resíduo, banda e salto.

**Proposta de interface aceite em princípio e não construída:** caixas dobráveis, com a
regra de que **o cabeçalho fechado é linha de estado, não título** — senão fechar esconde
as lacunas, que é o contrário do que se construiu. Abre o que tem pendência; a pendência
ganha sempre à preferência guardada. Persistência local, nunca no estado da ocorrência.

---

## 10. O que falta ir buscar

**Um só elo:** a humidade do combustível morto fino em condições de Verão. Enquanto não
houver, ou se mede, ou se declara — e a aplicação obriga a dizer qual foi.

Provavelmente resolve-se com o FFMC do sistema canadiano, que o IPMA já calcula.

**Existe e não foi pedido:** o **FUMOD** — grelhas anuais de modelos de combustível de
Portugal desde 2019, 100 m, UTM-29, GeoTIFF, repositório aberto em
`github.com/anasa30/PT_FuelModels`. Co-autoria da ANEPC (C. Mota, Carnaxide) e do
ForestWISE/CITAB (Vila Real). Recortado ao Douro são cerca de 411 000 células, uns 400 KB
antes de compressão — cabe no ficheiro único.

**Reserva:** 100 m no Alto Douro é uma média de vinha em socalcos, muro, mato, souto e
pinhal interdigitados a 20 ou 30 metros. Para avaliação regional de risco serve. Para
colocar uma secção numa quebra concreta, não.

---

## 11. Ordem proposta

1. `t0020` e correcção do `t0019` — dívida técnica, rápida.
2. Identidade estável das propostas (8.1) — corrompe o registo de execução.
3. Notas e focos de calor no `retratoDoFogo()` (8.2), e a regra de auditoria que impede a
   reincidência.
4. Missões alinhadas com as propostas (8.3).
5. Avisos IPMA (8.4).
6. Caixas dobráveis com linha de estado.
7. `p0018` absorvido na linhagem CODE, com a subida da IndexedDB.

A ordem 2 e 3 antes de tudo o resto: são as duas que fazem o plano dizer coisas que não são
verdade sobre si próprio.

---

## 12. Ficheiros desta sessão

| Ficheiro | Estado |
|---|---|
| `CSREPCDouro_202608311900_p0017_CartaLocal_CLD.py` | absorvido no `r0077` |
| `CSREPCDouro_202608311900_t0017_CartaLocal_CLD.js` | 22/22 no `r0077` |
| `CSREPCDouro_202608311900_q0017_CartaLocal_CLD.js` | |
| `CSREPCDouro_202608312030_p0018_FolhaCalibrada_CLD.py` | **não absorvido** |
| `CSREPCDouro_202608312030_t0018_FolhaCalibrada_CLD.js` | 53/53 no `r0074` |
| `CSREPCDouro_202608312030_q0018_FolhaCalibrada_CLD.js` | |
| `CSREPCDouro_202608312230_p0019_PropagacaoModelos_CLD.py` | absorvido no `r0077` |
| `CSREPCDouro_202608312230_t0019_Propagacao_CLD.js` | 82/83 no `r0077` |
| `CSREPCDouro_202608312230_q0019_Propagacao_CLD.js` | |
| `CSREPCDouro_202608312330_p0020_RetratoDoFogo_CLD.py` | absorvido no `r0077` |
| `CSREPCDouro_202608312330_q0020_RetratoDoFogo_CLD.js` | `t0020` em falta |
| `CSREPCDouro_202608312145_d_CompositoVentoDeclive_CLD.md` | especificação, aguarda decisão |
