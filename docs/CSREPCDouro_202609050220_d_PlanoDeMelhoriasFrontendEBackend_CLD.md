# Plano de melhorias ao frontend e ao backend — revisão completa da r0097

Data: 5 de setembro de 2026. Base: r0097 (`3e9b4fd`), 73 módulos, 15 990 linhas de JS,
1 044 linhas de CSS, 929 testes.

## Como se fez, e o que vale

Duas varreduras independentes da fonte — uma ao frontend (molde, CSS, controlos,
acessibilidade, repintura, responsividade, tipografia), outra ao que não é ecrã (estado,
erros, tempo, rede, persistência, importação, cálculo, duplicação, acoplamento, ferramentas
e CI) — cruzadas com capturas dos cinco separadores nos dois temas a 1440 e 768 px, com
medições de contraste no ecrã real, e com a captura que o dono enviou do cartão dos focos de
calor.

**Cada achado de severidade alta foi conferido na fonte antes de entrar aqui**, pela regra da
casa: a verificação passa pela fonte e não pela palavra de quem a leu. Dezoito altos
conferidos, dezoito confirmados. Os médios e baixos vêm dos relatórios tal como estão, e
quem os for fazer confere-os primeiro.

O que a captura do dono mostra tem causa na fonte: a `.row` centra verticalmente
(`align-items:center`, `molde.html:434`) mas o `.xtr` empilha o rótulo «Do ficheiro» sobre o
campo, e o botão «Retirar os focos do mapa» centra-se na pilha em vez de alinhar com o
campo; e o `<input type="file">` não tem uma única regra `::file-selector-button` em todo o
CSS — fica o botão nativo do sistema dentro da caixa do tema. Há onze campos de ficheiro
assim.

## Divisão do trabalho

Desde 2 de setembro **as alterações à aplicação fazem-se na sessão principal** e os ramos
entregam revisão adversária, testes e doutrina. Este plano segue essa divisão: cada pacote
diz o que a sessão principal implementa e o que cada ramo verifica, mede ou especifica
**antes** ou **depois** — nunca em vez de.

| Ramo | Especialidade, pelo que já entregou |
|---|---|
| #001 | Folhas de carta, IndexedDB, persistência |
| #002 | Testes adversários, aritmética, calibração |
| #003 | Doutrina de fogo, modelos de combustível, fontes científicas |
| #004 | Cartografia, projeções, Web Mercator |
| #005 | Portabilidade, medição em Chromium, auditoria visual e de acessibilidade |
| #006 | Despacho n.º 4067/2024, DON, citações legais |

---

## Frontend

### F1 — Sistema visual: tokens, contraste, camadas de CSS

**O que está.** `.hint` — o texto de ajuda mais usado, 13 px, 144 ocorrências — dá 2,96 de
contraste no tema claro sobre `--surf` e 2,69 sobre `--surf2`; o mínimo AA é 4,5. `--terra`
como texto dá 3,08; `--madeira` 3,73; `--agua` 4,25. Das 50 regras com `color:var(--tx3)`,
23 combinam-no com 9,5 a 10,5 px. As 66 tintas `rgba()` são os canais do **tema escuro**
(`rgba(224,104,92,·)` é `#E0685C`, o `--fogo` escuro) e continuam a ser usadas no claro,
onde `--fogo` é `#B84B3F`: texto e fundo da mesma etiqueta deixam de ser a mesma cor. Há
três blocos `:root` (linhas 15, 50, 869) e 40 linhas que repetem seletores já definitivos
só para lhes acrescentar relevo. 83 seletores declarados mais do que uma vez, com pares que
se anulam (`.help{display:none}` morto pela linha 351; `.btn:focus-visible` com `#fff`
morto pela 891; `.cd-cab` `nowrap` anulado 12 linhas abaixo no mesmo `@media`). Dez
breakpoints, o de 820 px em seis blocos separados.

**Faz-se.** `--tx3` e `--terra` escurecidos no tema claro até 4,5 sobre `--surf2` (o passo
já existe: `#957020`); tintas por `color-mix(in srgb, var(--token) N%, transparent)`, que o
CSS já usa em sete sítios; um só par `:root` / `html[data-tema="claro"]`; regras mortas
apagadas; breakpoints reduzidos a quatro, um bloco cada.

**Critério.** Nenhum texto abaixo de 4,5 no claro nem no escuro, medido por script no
Chromium sobre o fundo efetivo (com alfa resolvido). Zero `rgba(` com valores de marca.

**Quem.** Sessão principal implementa. **#005** entrega o script de medição de contraste
que resolve o alfa das tintas — a medição feita a 5 de setembro dava 1,00 nos distintivos
com fundo translúcido, e isso é a medição errada, não o distintivo.

### F2 — Controlos: alturas, campos de ficheiro, alinhamento, alvos de toque

**O que está.** 21 tamanhos de botão e só dois com altura declarada (`nav button` 46,
`.sinal` 40). Os campos têm 45 px dentro de `.grid` e 44 fora. Onze `<input type="file">`
sem estilo, com quatro alturas conforme o contentor. Botão ao lado de campo alinhado por
remendo: `<label>&nbsp;</label>` como calço (linha 2222), `.occ-tag` reaproveitado como
campo só de leitura com altura inline (2205), `#b-geo` esticado à largura toda porque o
pai é `.grid > div` (1209). Alvos de toque abaixo de 24 px em `.cat-r .x`, `.tchip button`,
`.lk`, `.av-atual` — e são todos ações de **remover**. 323 `style=` inline; as sete margens
mais repetidas somam 125 ocorrências sem escala.

**Faz-se.** Três alturas em tokens (`--ctl-h: 45 / 36 / 28`) e `input,select` à mesma;
`.campo-ficheiro` única para os onze, com o nativo escondido e um `<label class="btn">` a
acioná-lo — o padrão que as linhas 1226 e 1854 já usam; `.par-campo-botao` com
`align-items:flex-end`; alvo mínimo de 24 px nas ações destrutivas; escala de espaçamento em
tokens e `display:none` a passar a `hidden`.

**Critério.** A captura do cartão dos focos com o botão alinhado ao campo; zero `&nbsp;`
como calço; auditoria visual a 380/480/768/1440 limpa; nenhum controlo interativo abaixo de
24×24 px, medido.

**Quem.** Sessão principal. **#005** mede as alturas e os alvos antes e depois, nos dois
temas, e entrega a prova em `docs/qa/`.

### F3 — Acessibilidade

**O que está.** `dobrarCartao` põe `role="button"` nos 31 `<h2>`: a aplicação tem **um só
cabeçalho** para um leitor de ecrã, e não há um único `<h3>`. 24 controlos do molde sem
rótulo e até 42 campos gerados por setor sem rótulo nenhum. `aria-describedby` zero em 144
notas de ajuda. `role="alert"` zero; `aria-live` só no indicador de gravação; as faixas «parte
do ecrã não foi atualizada» e «esta aba está em leitura» não são anunciadas. `aviso()` apaga
todas as mensagens aos 5,5 s, erros incluídos. A gravidade dos avisos — obrigação legal em
incumprimento contra antecipação — vive só na cor da lâmpada e num `title` que não existe
em toque. 160 botões de frases no fluxo de tabulação antes do campo de registo.

**E um defeito visível:** `aviso()` faz `className = "msg …"` e `#pr-saida` nasce com
`class="ev-f"`. Ao primeiro erro o cartão da intensidade perde a classe, fica escondido aos
5,5 s, e `pintarEstimativa` escreve as estimativas seguintes para um elemento que nunca
volta a aparecer.

**Faz-se.** O `<h2>` fica e o botão de dobrar vai para dentro dele, como a ajuda já faz;
`aria-label` nos campos gerados a partir do cabeçalho do quadro; `<label for>` nos 24;
`aria-describedby` das notas; `role="alert"` nas `.msg` e `aria-live="assertive"` nas duas
faixas; erros não expiram; `aviso()` passa a `classList.add`; o rótulo do sinal passa a
«3 em incumprimento» / «3 a antecipar» / «Sem avisos»; grupos de frases inativos a
`hidden`; `aria-label` nos botões de uma letra; `:focus-visible` global e
`forced-colors`.

**Critério.** Árvore de acessibilidade com 31 `<h2>`; zero controlos sem nome; auditoria
axe sem violações de nível A e AA; teste que reproduz o `#pr-saida` e exige que a segunda
estimativa apareça.

**Quem.** Sessão principal. **#005** corre o axe em Chromium antes e depois e entrega o
relatório. **#006** confere a redação das três gravidades do sinal contra o que a DON e o
Despacho chamam a cada uma — «obrigação» e «antecipação» são palavras da norma e não podem
ser inventadas aqui.

### F4 — Desempenho de pintura

**O que está.** Cada tecla em `o-inicio`, `o-fase` e `o-nivel` chama `pintarDON()`, que
reconstrói o PEA em vigor, todas as caixas DON e as ampulhetas — um GDH de 11 caracteres
são 11 reconstruções. `pintarTudo` regenera a fita do tempo inteira a cada passagem, e ela
cresce a cada registo. Um `setInterval` de 30 s reescreve `#pea-vigor` com os botões do
controlo de execução: quem lá tiver o foco perde-o. 37 sítios religam ouvintes a cada
pintura.

**Faz-se.** `pintarDON` com atraso de 250 ms no `input`; fita, evolução e lista de
propostas por acrescento em vez de reescrita; o temporizador a repintar só a barra de
validade e as contagens; delegação de eventos nos 37 sítios — o padrão que a r0095
introduziu nas quatro listas.

**Critério.** Medição do `innerHTML` por tecla antes e depois; foco preservado durante a
repintura periódica, provado em Chromium.

**Quem.** Sessão principal. **#005** mede, como mediu a repintura das folhas (103 ms para
4,4 ms). **#002** escreve o teste do foco preservado.

### F5 — Uma caixa, dois subtítulos, um cabeçalho de cartão

**O que está.** Doze tratamentos para «uma caixa que diz alguma coisa», com cinco raios e
quatro espessuras de aresta. Quatro estilos para o mesmo nível de subtítulo, um deles um
`.stit` reescrito inline (linha 1506). Cabeçalhos de cartão com uma, duas ou três etiquetas
de aspeto diferente, e a `.tag` legal a 0,62 de opacidade sobre `--tx3` — 1,9 de contraste
no claro. 351 classes, 74 com dois caracteres ou menos; `.v` significa quatro coisas.

**Faz-se.** `.caixa` com `--info/--aviso/--erro/--ok`; `.stit` e `.stit--menor`; `.tag`
(referência legal) separada de `.cd-cnt` (contador) desde o molde, opacidade 1; prefixos por
bloco nas classes curtas.

**Quem.** Sessão principal. **#005** revê as capturas depois.

### F6 — Responsividade

**O que está.** A 380 px o cabeçalho fixo ultrapassa 300 px de 667. O quadro de
setorização esconde o cabeçalho de colunas a ≤820 px e os campos gerados não têm rótulo
próprio: seis caixas sem dizer qual é o comandante. `.g4` mantém quatro colunas até 760 px.
Oito larguras fixas inline sem breakpoint.

**Faz-se.** `nav` com deslocamento horizontal a ≤640 px; `::before` com o nome da coluna
em cada campo do `.set-row`, como `.amp-r` já faz; `.g4` a duas colunas a ≤1000 px;
larguras inline a `flex:1 1 base`.

**Quem.** Sessão principal. **#005** mede a 380/480/768 nos dois temas.

### F7 — Tipos de letra: uma decisão do dono

**O que está.** `--disp` é `'Barlow Semi Condensed','Inter',sans-serif` e `--body` é
`'Inter',system-ui,sans-serif`, **e nenhuma das três existe no ficheiro**: zero
`@font-face`. Num posto sem elas, 38 regras deixam de ser condensadas, o texto fica ~15 %
mais largo do que o desenho previu, e é causa direta dos `nowrap` a transbordar. O documento
impresso já resolveu o seu caso com o Carlito; o ecrã não.

**Decidir.** Embutir Barlow Semi Condensed e Inter em base64 — custa 200 a 400 KB numa
entrega de 1,1 MB — ou redesenhar as larguras assumindo o recurso genérico. As duas são
legítimas; a primeira mantém o desenho, a segunda mantém o tamanho.

**Quem.** O dono decide. **#005** mede as larguras do cabeçalho e dos separadores com e sem
as famílias, em Chromium com perfil vazio, para a decisão ter números.

---

## Backend

### B1 — Mapa: mosaicos e folhas que atravessam o que não deviam

**O que está.** `chaveMosaico` é `"m/"+z+"/"+x+"/"+y` — sem serviço nem grelha — e
`guardarCarta` e `adotarCartaWMTS` não chamam `esquecerMosaicos`: quem mudar de um serviço
`{z}/{x}/{y}` em Web Mercator para um WMTS da DGT em PT-TM06 vê os quadrados da carta
anterior na projeção errada, sem aviso. Os mosaicos pedem `fetchT` sem `semCache`, e a cache
só larga uma entrada quando o mesmo URL volta a ser pedido: cada quadrado descarregado fica
em memória até a aba fechar. `carregarFolhas` traz **todas** as folhas da base sem filtrar
por ocorrência, e `FOLHAS` não é limpo por «Nova» nem por `carregar`: a folha do TO da
ocorrência A fica desenhada sobre a B — e pode até decidir a projeção do mapa dela.

**Faz-se.** Chave do mosaico com a impressão da carta e a grelha; `esquecerMosaicos` nas
duas mudanças de carta; `semCache` nos mosaicos e teto com poda por idade na cache do
`fetchT`; `num` da ocorrência em cada folha e filtro em `carregarFolhas`.

**Critério.** Teste que muda de carta e prova que os mosaicos antigos não são lidos; teste
que troca de ocorrência e prova que `FOLHAS` fica vazio; medição da memória retida antes e
depois de 200 mosaicos.

**Quem.** Sessão principal. **#004** especifica o que uma impressão de carta deve conter
para duas cartas diferentes nunca partilharem chave, e entrega finalmente o `t0018`. **#001**
escreve os testes das folhas por ocorrência sobre o modelo de IndexedDB que já tem.

### B2 — Estado: o que se escreve e não se declara

**O que está.** `O.dados.relevo` é escrito em `06-relevo` e não existe em `novoEstado` nem
em `tipos/` — passa pelo `[outro: string]: any`. `let O = novoEstado()` está na linha 178
com sete degraus da escada antes e dezasseis depois: latente hoje, é a classe de defeito que
o comentário da escada já registou ter custado caro. Uma ocorrência sem número grava em
`peaapp:occ:sem-num`, `peaapp:ultima` fica `""`, e `carregar` trata `""` como ausência: fica
gravada e nunca mais se repõe. `pintarDON` escreve `O.meta.inicio` e `O.meta.fase`;
`renderVigor` escreve `p.ultVerd` e empurra para a fita — ambas de 30 em 30 segundos pelo
temporizador, **sem gravar**.

**Faz-se.** `relevo` declarado, com degrau 26→27; `let O` para depois do último degrau;
identificador interno da ocorrência na criação, com `meta.num` como rótulo; o cálculo do
veredicto separado da pintura e chamado de onde já se grava.

**Critério.** Teste que migra de uma versão concreta e confere `relevo` — não o que conta
degraus; teste que grava uma ocorrência sem número e a repõe.

**Quem.** Sessão principal. **#002** escreve os dois testes antes da alteração, para serem
vermelhos primeiro. **#001** confere o identificador interno contra o que a loja `copias` e o
diário já usam como chave.

### B3 — Importação: sem teto, e a mesma cadeia analisada quatro vezes

**O que está.** Não há um único teto de tamanho em leitura de ficheiro. `importarOcorrencia`
faz quatro `JSON.parse` sobre o mesmo texto, corre `limparChavesRecusadas` sobre a árvore
inteira sem limite de nós, 26 degraus de migração, `conferirForma`, e o SHA-256 escrito em
JavaScript — cujo `bytesUTF8` constrói um array de um número por byte. Com 50 MB, a aba
bloqueia dezenas de segundos ou cai, sem barra, sem cancelamento, sem mensagem.
`FORMA_OCORRENCIA` confere 13 ramos de topo, nove deles só como «é objeto?»: os setores, os
pontos, as frentes, as linhas, as notas e `pco.funcoes` chegam aos construtores de HTML como
vierem — e são justamente os que o mapa e a setorização interpolam.

**Faz-se.** Teto declarado antes do primeiro `JSON.parse`; uma só análise; forma profunda
nos seis ramos, com o filtro por elemento que já existe para `evolucao`, `fita` e `peas`.

**Critério.** Pacote de 60 MB recusado em menos de 100 ms com mensagem; pacote com um setor
que é uma cadeia importado com correção contada; nenhum `JSON.parse` repetido.

**Quem.** Sessão principal. **#002** entrega os pacotes adversários — enorme, com ramos
interiores de tipo errado, com `__proto__` em ramos que a forma ainda não cobre — e os
testes que os importam.

### B4 — Números e geometria: um só sítio para cada conta

**O que está.** `intensidadeByram` usa `Number(...)` sobre campos de formulário: `1,5 t/ha`
dá `NaN` e a aplicação diz ao oficial que falta o que ele acabou de escrever — o mesmo
defeito já corrigido em `09-comportamento-do-fogo` e não propagado. A conversão grau→metro
`111320·cos(lat)` está escrita à mão 16 vezes em 8 módulos; há duas fórmulas de distância
(planar em km, semiverseno em metros) sem que uma remeta para a outra; quatro tabelas de
rumos incompatíveis; 33 leituras e 20 escritas de número com vírgula sem auxiliar.

**Faz-se.** `numPT` e `fmtPT` no núcleo; `M_POR_GRAU`, `distanciaM`, `pontoPorRumo` e
`ROSA16` no núcleo; os oito módulos a chamá-los.

**Critério.** Zero `Number(` sobre campo; uma ocorrência de `111320`; teste que escreve
`1,5` na carga e obtém intensidade.

**Quem.** Sessão principal. **#003** diz qual das duas distâncias é a certa para cada uso —
a planar chega para o perfil de 4 km, o semiverseno é o que a evolução precisa — e confere
que `intensidadeByram` continua a citar Fernandes (2003) depois de mudar de mãos. **#002**
testa os auxiliares nos limites: vírgula, ponto, vazio, `NaN`, meridiano.

### B5 — Tempo: 26 relógios paralelos

**O que está.** `12-relogio.js` existe para as regras serem exercitáveis com hora escolhida,
e há 26 `Date.now()` diretos em 13 módulos e 4 `new Date()` sem argumento — entre eles
`horizonteValidade`, `divergencia` e os tempos de empenhamento, que são exatamente as regras
de prazo. Nenhum teste injeta tempo nelas, porque não têm parâmetro de instante.

**Faz-se.** `agora()` nos 26 sítios; parâmetro `ts` opcional em `horizonteValidade`,
`divergencia` e `tetoDeSaida`.

**Critério.** Teste da validade com o relógio parado às 17h50 sem substituir `Date.now` —
o teste da r0095 fá-lo por substituição, e é sinal de que a API está errada.

**Quem.** Sessão principal. **#006** confere, regra a regra, que o instante que cada uma
recebe é o que a DON manda contar — o POSIT horário conta desde quê, os 90 minutos do ATA
contam desde quê. **#002** reescreve os testes com o instante por argumento.

### B6 — Erros que ninguém vê

**O que está.** 104 `catch` vazios em 30 módulos, permitidos pelo `eslint` com
`allowEmptyCatch:true`. Seis engolem falha real: `apagarOcc` tira do índice mesmo que o
`del` falhe; a migração de `localStorage` para IndexedDB pode ficar a meio com o arquivo a
parecer vazio; o `set` que grava o carimbo do encerramento; `guardarCarta` e
`adotarCartaWMTS` respondem `{ok:true}` sem ter gravado; a linha do diário encadeado que se
perde sem ninguém ler o `null`. `emitirPEA` desativa o botão e chama `metricas()` e
`baseVigor()` fora de qualquer `try`: uma exceção deixa «Elaborar proposta de PEA» morto até
recarregar — e recarregar perde o que não foi gravado. Há dois `finally` em toda a fonte.

**Faz-se.** `finally` nos botões com indicador de espera; os seis `catch` a registar na
fita ou a avisar; `no-empty` estrito, com `/* ignorado: razão */` obrigatório nos que
ficam.

**Critério.** `npm run lint` a recusar um `catch` vazio sem razão; teste que faz
`metricas()` rebentar e exige o botão reposto.

**Quem.** Sessão principal. **#005** classifica os 104 — foi quem fez a auditoria de
portabilidade e sabe quais são deteção de capacidade — e entrega a lista com a razão de
cada um que fica.

### B7 — Ferramentas e CI

**O que está.** `visual`, `prova-abas` e `prova-idb` não correm na CI; a `prova-idb` guarda
o `VersionError` que apagou diário, cópias e mosaicos sem nada no ecrã. Nenhuma ferramenta
mede o tamanho da entrega (1 103 035 bytes, a crescer). `morto` relata cinco defeitos e só
falha por um. Cinco módulos com zero referências em testes — `14-descarregar` (`carimboFich`
entra no nome de toda a exportação), `06-relevo`, `07-perfil`, `08-overpass`,
`5-logistica/02` — e `distKm`, `parPar`, `variantes`, `normalizarDistrito`, `motivoRede`
são funções puras dentro deles. `fetchT` não repete um pedido único que falhe por corte
momentâneo.

**Faz-se.** Segundo trabalho na CI com Chromium a correr as três provas; teto de tamanho
declarado em `montagem.test.mjs`; linha de base numerada no `morto`, que pode descer e não
subir; testes das funções puras; repetição única com recuo em `fetchT`, por argumento.

**Quem.** Sessão principal. **#002** entrega os testes das funções puras. **#005** o
trabalho de CI, que é infraestrutura de medição.

---

## Ordem proposta

A ordem pesa três coisas: o que o dono pediu primeiro — reparações visuais —, o que perde
dados ou mente, e o que desbloqueia o resto.

1. **r0098 — o que se vê.** F2 (campos de ficheiro, alinhamento, alturas), o `#pr-saida`
   de F3, e o contraste de F1. É o pedido «antes de mais».
2. **r0099 — o que perde ou mente.** B1 (mosaicos e folhas), B3 (teto e uma só análise),
   B6 (`finally` e os seis `catch`), o `numPT` de B4.
3. **r0100 — acessibilidade e pintura.** O resto de F3, F4, F6.
4. **r0101 — estado e tempo.** B2, B5.
5. **r0102 — arrumação.** F5, o resto de B4, B7.
6. **Quando o dono decidir:** F7.

Cada revisão leva os testes dos ramos que a cobrem, as capturas em `docs/qa/` nos dois
temas, e a linha no `MANUAL.md` do que mudou para quem usa.

## Recados para os ramos

Prontos a colar, um por ramo. Cada um diz o que se pede, contra que revisão, e o que se
espera de volta.

**#001.** Dois pedidos sobre a r0097. Primeiro: testes, sobre o teu modelo de IndexedDB, que
provem que uma folha colocada na ocorrência A não aparece na B depois de `carregar`, e que
«Nova» esvazia `FOLHAS` — hoje `carregarFolhas` traz tudo sem filtrar, e a folha pode até
decidir a projeção do mapa da ocorrência seguinte. Segundo: a ocorrência vai passar a ter
um identificador interno na criação, com `meta.num` como rótulo; confere contra o que a
loja `copias` e o diário já usam como chave, e diz se há colisão.

**#002.** Quatro pedidos, todos «vermelho primeiro». Um teste que migra de uma versão
concreta e confere `dados.relevo`. Um que grava uma ocorrência sem número e a repõe. Pacotes
adversários para a importação: um de 60 MB, um com um setor que é uma cadeia, um com
`__proto__` em `dados.frentes` — e os testes que os importam. E os testes das funções puras
que hoje não têm nenhum: `distKm`, `parPar`, `variantes`, `normalizarDistrito`,
`motivoRede`, `carimboFich` com relógio injetado.

**#003.** Há duas fórmulas de distância na aplicação — planar em quilómetros no perfil de
elevação, semiverseno em metros na leitura da evolução — e vão passar a uma só no núcleo.
Diz qual serve para cada uso e onde a planar deixa de chegar. E `intensidadeByram` vai
passar a ler números com vírgula por um auxiliar: confere que a citação de Fernandes (2003)
e a redução `I = R·w/2` ficam intactas.

**#004.** A chave dos mosaicos é `m/z/x/y`, sem serviço nem grelha: mudar de carta mostra os
quadrados da anterior na projeção errada. Especifica o que uma impressão de carta tem de
conter para duas cartas nunca partilharem chave — endereço, grelha, conjunto de matrizes,
data quando houver. E o `t0018`, que continua por chegar e é a única prova de ponta a ponta
da colocação em Mercator.

**#005.** Cinco medições, todas em Chromium com perfil vazio a partir de `file://`, nos dois
temas: contraste de todo o texto sobre o fundo efetivo, com o alfa das tintas resolvido —
a minha medição dava 1,00 nos distintivos e é a medição que está errada; alturas de todos
os controlos e alvos de toque abaixo de 24 px; axe nível A e AA; largura do cabeçalho e dos
separadores com e sem Barlow e Inter instaladas, para o dono decidir se se embutem; e o
`innerHTML` por tecla em `o-inicio`. Mais dois: a classificação dos 104 `catch` vazios, com
a razão de cada um que deve ficar; e o trabalho de CI com Chromium para as três provas.

**#006.** Duas conferências contra a norma. O sinal de avisos vai passar a dizer por extenso
«N em incumprimento», «N a antecipar» ou «Sem avisos» — confere que «obrigação» e
«antecipação» são as palavras da DON e do Despacho para cada caso, e propõe as certas se
não forem. E as regras de prazo vão passar a receber o instante por argumento: regra a
regra, diz desde que instante a norma manda contar — o POSIT horário, os 90 minutos do
ATA, as 12 horas da EPCO.
