# Composição vento × declive — especificação do módulo

**CSREPC Douro · Núcleo de Apoio às Operações · Estação PEA**
Documento de especificação · 31AGO26 21h45
Estado: **proposta para decisão**. Nenhuma linha de código foi escrita.

---

## 1. Objeto

Especifica o módulo que, a partir da previsão de vento e da leitura do terreno já
disponíveis na aplicação, informa a célula de planeamento sobre a **direção provável da
cabeça** e, sobretudo, sobre **os limites dentro dos quais essa direção é afirmável**.

O módulo não prevê comportamento do fogo. Compõe dois efeitos cuja intensidade relativa
não conhece, e diz o que daí resulta — incluindo, com frequência, que não resulta nada de
utilizável.

## 2. Fundamento

**Doutrinário.** Art. 27.º, n.º 1, do Despacho n.º 4067/2024 atribui à célula de
planeamento a elaboração do PEA; o art. 28.º atribui ao núcleo de informações a recolha e
tratamento da informação sobre o teatro de operações, onde cabem meteorologia e terreno.
O Anexo 3 da DON n.º 2 / DECIR 2026, situação n.º 10, proíbe o ataque frontal a incêndio
de grande intensidade sem quantificar o que é grande — a mesma lacuna já assinalada no
documento sobre comportamento do fogo.

**Técnico.** Viegas, D. X. (2004), *Slope and wind effects on fire propagation*,
International Journal of Wildland Fire 13(2):143–156. O trabalho apresenta a composição
vetorial dos efeitos de vento e declive e a variação do ângulo de desvio em função do
ângulo entre os dois e do parâmetro de razão. É esta a formulação que o campo `ε` da
aplicação já invoca sem a usar.

## 3. O que a aplicação já tem, e o que não tem

| Grandeza | Estado | Origem |
|---|---|---|
| Rumo e velocidade do vento, por hora | **Tem** | Open-Meteo, 10 m acima do solo |
| Gradientes radiais no ponto do TO | **Tem**, como texto | 8 transectos, API de elevação |
| Perfil de elevação ao longo de um eixo | **Tem**, 100 cotas | API de elevação |
| Orientação e classe de declive declaradas | **Tem** | introduzidas pelo oficial |
| Ângulo entre vento e declive (θ) | **Derivável já** | dos dois primeiros |
| Razão declive/vento (ε) | **Não tem, e não pode ter** | exige modelo de combustível |

A separação da última linha é o núcleo deste documento. **O ângulo é geometria e está ao
alcance. A razão é comportamento do fogo e não está.**

## 4. Regras

### GRD — vetor gradiente a partir dos transectos

**GRD-1.** Os oito gradientes radiais ajustam-se a um plano local
`z = z₀ + a·E + b·N`. O declive segundo o azimute α vale `a·sin α + b·cos α`, e para
azimutes equiespaçados sobre a circunferência a solução de mínimos quadrados é fechada:

```
a = (2/n) · Σ gₖ · sin αₖ
b = (2/n) · Σ gₖ · cos αₖ
```

Declive máximo `|∇z| = √(a² + b²)`; azimute de subida `atan2(a, b)`; exposição da encosta
(azimute de descida) = azimute de subida + 180°.

**GRD-2.** Calcula-se o **resíduo** do ajuste. Um ponto sobre uma linha de festo, num
colo ou no fundo de um vale não tem gradiente dominante: os oito valores não cabem num
plano, o ajuste devolve magnitude quase nula e o azimute que sair é ruído. Acima de um
resíduo declarado, **o módulo não devolve vetor gradiente** e di-lo por extenso.

**GRD-3.** Quando o vetor ajustado diverge da **Orientação dominante** declarada pelo
oficial em mais de 45°, mostram-se os dois e **não se calcula média**. Uma das duas
leituras está errada, e a média de uma leitura certa com uma errada é uma terceira leitura
errada. A escolha é do oficial e fica registada na fita do tempo com a divergência.

### THE — o ângulo θ

**THE-1.** Direção de progressão induzida pelo vento = rumo de onde sopra + 180°.
Direção induzida pelo declive = azimute de subida (GRD-1).
θ = diferença angular entre as duas, reduzida ao intervalo [0°, 180°].

**THE-2.** θ calcula-se **por hora da previsão**, não uma vez. O rumo do vento roda ao
longo do dia e θ com ele; um valor único esconde precisamente a evolução que interessa ao
plano.

**THE-3.** Com vento abaixo de 5 km/h a 10 m, θ não se calcula. Um rumo de vento fraco não
tem significado direcional e a composição degenera.

### EPS — a razão ε

**EPS-1.** O módulo **nunca calcula ε**. Só o aceita introduzido, e só com a proveniência
declarada.

**EPS-2.** O motivo, escrito para poder ser contestado: ε é a razão entre a propagação
induzida pelo declive e a induzida pelo vento. O `R₀` do combustível cancela na razão, mas
não cancelam nem a compacidade do leito, que escala o termo de declive, nem o expoente do
vento, que escala o outro. Ambos vêm do modelo de combustível — e a carta de modelos de
combustível para o Douro é a lacuna já identificada.

**EPS-3.** Segundo buraco, independente do primeiro: o Open-Meteo dá vento a **10 m**, e
as formulações pedem vento **à altura da chama**. O fator de redução vai de 0,1 a 0,5
conforme o coberto e entra elevado a expoente próximo de 1,5. Um erro de fator 2 na
velocidade dá quase 3 no ε. **O módulo não converte alturas em silêncio.** Ou o oficial
declara o fator, ou o ε introduzido declara-se referido a vento de 10 m.

### BAN — a banda de rumo

**BAN-1.** Sem ε, o módulo varre ε num intervalo declarado — proposta: **0,1 a 2,0**, em
25 passos logarítmicos — e devolve o **intervalo de azimutes** da cabeça, não um azimute.

```
δ = atan2( ε·sin θ , 1 + ε·cos θ )
```

Azimute da cabeça = direção do vento desviada de δ para o lado do declive.

**BAN-2.** A banda classifica-se, e a classe governa o que se pode escrever no PEA:

| Amplitude | Classe | Consequência |
|---|---|---|
| ≤ 15° | determinada | o rumo entra no PEA como previsão |
| 15° a 45° | indicativa | entra como tendência, com a banda à vista |
| > 45° | indeterminada | **não entra rumo nenhum**; entra a razão |

**BAN-3.** A banda estreita-se sozinha com vento forte e declive suave. Não é preciso
conhecer ε para que o módulo passe a poder afirmar: é preciso que a geometria e a
intensidade o permitam. Nas noites em que permitir, afirma-se; nas outras, cala-se e diz
porquê.

### SAL — salto de classe de declive

**SAL-1.** Esta é a regra que dá resultado útil **sem qualquer conhecimento do
combustível**, e por isso é a primeira a implementar.

Na lei de declive de Rothermel o fator vai com `tan²φ` e a compacidade do leito **cancela
na razão entre dois declives**. Logo, a razão

```
k = (tan φ₁ / tan φ₀)²
```

é independente do modelo de combustível. Sobre a classe de referência de 10 %:

| Declive | k |
|---|---|
| 5 % | 0,25 |
| 10 % | 1,00 |
| 20 % | 4,0 |
| 35 % | 12,3 |
| 50 % | 25,0 |
| 70 % | 49,0 |

**SAL-2.** Percorrido o perfil de elevação, assinala-se cada troço onde `k` excede um
limiar declarado — proposta: 3 — e emite-se o aviso de **fronteira de validade**:

> Se a frente atingir a quebra de X % a N km segundo o rumo R, a componente de declive
> multiplica-se por k. A composição calculada no ponto do TO deixa de descrever a cabeça
> a partir daí.

**SAL-3.** A lei de declive adotada é **declarada e versionada**. A lei de Rothermel e as
leis empíricas de Viegas dão razões diferentes. O módulo nunca usa mais do que uma, nunca
a troca em silêncio, e a que estiver em vigor aparece no rodapé de tudo o que produzir.

### REC — recusas

O módulo não produz resultado quando:

- o resíduo do ajuste do plano excede o limiar (GRD-2);
- o vento é inferior a 5 km/h (THE-3);
- o declive ajustado é inferior a 3 % — abaixo disso `tan²φ` torna a razão SAL instável e
  a componente de declive é irrelevante de qualquer modo;
- a banda é indeterminada e não foi introduzido ε (BAN-2).

**REC-1.** Em nenhum caso o resultado se desenha como seta sobre a carta ou sobre a folha
calibrada. É a mesma regra da elipse no documento de comportamento do fogo, e pelo mesmo
motivo: uma seta sobre cartografia confere credibilidade espacial que a composição não
tem, e a seta seria depois usada para posicionar meios. O desvio apresenta-se como
número e como banda; o traço no croqui é do oficial, e vê-se que é dele.

**REC-2.** O ponto onde a composição é calculada é o ponto de referência do TO. A frente
está noutro sítio, com outro declive. **Aplicar o ε do ponto a uma frente distante é erro
de categoria**, e o módulo declara sempre a que ponto se refere.

## 5. Contrato de estado

Ramo próprio, `O.composicao`, propriedade da **célula de planeamento** no registo `POSSE`.

```
O.composicao = {
  g,                      /* GDH do cálculo */
  por,                    /* quem o executou */
  lei,                    /* lei de declive em vigor, versionada */
  ponto: {lat, lon},      /* a que ponto se refere */
  gradiente: {a, b, decliveMax, azSubida, residuo, valido},
  horas: [ {t, ventoRumo, ventoKmh, theta, banda:{min,max,amp,classe}, delta} ],
  eps: {valor, origem, alturaVento} | null,
  saltos: [ {km, rumo, decliveTroço, k} ]
}
```

**Passo zero.** Todas as escritas passam pelo caminho único de mutação de estado. Um
módulo que escreva em `O.composicao` por vias múltiplas torna a fita do tempo
*append-only* uma ficção, e com ela cai o valor probatório do PEA. Precedência dura, não
preferência.

## 6. Anexo — o caso de 31AGO26 como ensaio de aceitação

Dados reais da aplicação nesta data: vento de SO a 10 km/h, rodando a SSO e a S e a
reforçar até 27 km/h; encostas dominantes viradas a E, logo subida a 270°; declive
declarado inferior a 10 % no ponto; perfil a E com 35 % máximo a cerca de 1,4 km.

**θ = 135°** — vento e declive quase opostos. Banda de rumo:

| ε | δ | azimute da cabeça |
|---|---|---|
| 0,1 | 4° | 041° (NE) |
| 0,3 | 15° | 030° (NNE) |
| 0,5 | 29° | 016° (NNE) |
| 0,7 | 44° | 001° (N) |
| 1,0 | 68° | 338° (NNO) |
| 2,0 | 106° | 299° (ONO) |

Amplitude de 102°. **Classe: indeterminada.** O módulo não emite rumo. Emite a razão, e
emite o aviso SAL: a quebra dos 35 % a 1,4 km multiplica a componente de declive por 12,3
sobre a classe do ponto.

Com o vento a rodar para S, θ cai para 90° e a mesma varredura dá amplitude de 58° — ainda
indeterminada, mas a estreitar. Com o vento a reforçar para 27 km/h, ε desce e a banda
fecha mais. **A evolução é para uma cabeça cada vez mais dominada pelo vento, a norte.**
Isto pode escrever-se hoje, e é mais do que a aplicação diz neste momento.

Estes números são o critério de aceitação da implementação: qualquer versão do módulo tem
de os reproduzir.

## 7. Decisões que não são minhas

1. **A lei de declive.** Rothermel ou Viegas. A escolha altera todos os `k` da regra SAL e
   tem de ser um ato do CSREPC, datado e assinado, como os limiares de supressão. Adotar
   uma por omissão seria importar doutrina como efeito lateral de uma escolha de
   implementação.
2. **O intervalo de varredura de ε.** Proponho 0,1 a 2,0. É um juízo, não um resultado.
3. **Os limiares** de resíduo do ajuste (GRD-2), de amplitude de banda (BAN-2) e de salto
   de classe (SAL-2).
4. **Se este documento é capítulo do de comportamento do fogo ou peça autónoma.** A
   composição consome as mesmas grandezas e sofre da mesma lacuna de combustível; separá-
   los pode duplicar pressupostos.

## 8. Ordem de implementação proposta

1. **GRD** — vetor gradiente com resíduo. Independente de tudo o resto e melhora já a
   leitura do terreno, que hoje mostra oito números soltos onde podia mostrar um vetor.
2. **SAL** — salto de classe. Dá aviso operacional real sem depender do ε.
3. **THE** e **BAN** — o ângulo por hora e a banda.
4. **EPS** — a entrada do ε, depois de haver com que o justificar.

Os três primeiros são executáveis com o que a aplicação já sabe. O quarto espera pelos
coeficientes de combustível, e não deve travar os outros.
