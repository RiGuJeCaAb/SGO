# Qual distância para cada uso, e a citação de Byram

## Ramo **#003** · CLD · contra a entrega **r0093**

| Campo | Valor |
|---|---|
| Referência | `#003 · d0007_DistanciasEByram_r0093` |
| Data | 2026-09-05 |
| Objeto | `limitesDeManobra()`, `intensidadeByram()`, `comprimentoDaChama()` e as treze citações de Byram |
| Encomenda | Distribuição de 4 de setembro |

---

# PARTE A · Qual distância para cada uso

## A.1 · As duas distâncias não consomem a mesma grandeza

```js
seguranca:  Math.ceil(4 * chama),              // Butler e Cohen (1998)
contencao:  Math.ceil(1.5 * chama * 10) / 10,  // atribuído a Byram (1959)
```

`chama` é o **comprimento** da chama, medido ao longo do eixo. Mas as duas fontes não
pedem a mesma grandeza:

| Uso | Grandeza que a fonte pede | Grandeza que a aplicação usa | Coincide? |
|---|---|---|---|
| Distância de segurança | **Altura** da chama (`h_f`) | Comprimento (`L`) | **Não** |
| Largura de contenção | **Comprimento** da chama (`L`) | Comprimento (`L`) | Sim |

A largura de contenção está certa. A distância de segurança faz uma substituição, e o
comentário do código assume-a com honestidade:

> *Quatro vezes a **altura** da chama. Em terreno plano e sem vento a altura é o
> comprimento; com vento a chama inclina-se e a altura é menor, pelo que usar o comprimento
> é o lado seguro do erro.*

O raciocínio está correto. **O problema é o que se faz com a margem que ele cria.**

## A.2 · A margem existe, e está a ser consumida sem ninguém decidir

Sendo `h_f = L · sin(α)`, com `α` o ângulo da chama com a horizontal:

| Inclinação da chama | `h_f` | O que `4·L` vale em alturas |
|---|---|---|
| 90° (vertical, sem vento nem declive) | 1,00 L | 4,0 × h_f |
| 75° | 0,97 L | 4,1 × h_f |
| 60° | 0,87 L | 4,6 × h_f |
| 45° | 0,71 L | 5,7 × h_f |
| 30° (fortemente conduzida) | 0,50 L | **8,0 × h_f** |
| 20° | 0,34 L | 11,7 × h_f |

A margem é real e cresce com o vento e o declive — que é conveniente, porque é aí que se
precisa dela.

**Mas eis o problema.** O fator 4 vem de Butler e Cohen (1998), cujo modelo é de
**aquecimento radiante apenas**. A revisão posterior de Butler (2014) trata precisamente
das condições em que esse fator é insuficiente: vento, declive e aquecimento convectivo, que
o modelo de 1998 não contempla.

Ou seja: as duas coisas movem-se ao mesmo tempo e em sentidos opostos. Quando a chama
inclina — vento, encosta — a substituição ganha margem, **e é exatamente aí que o fator 4
precisa de ser maior**. A 30° de inclinação, `4·L` vale 8 alturas de chama; se a revisão de
2014 exigir 8 nessa condição, a margem está **integralmente consumida** e a aplicação está
na fronteira, não acima dela.

**Dois erros em sentidos opostos não são uma margem de segurança. São duas incertezas que
por acaso se cruzam, e ninguém decidiu que se cruzassem.**

## A.3 · O que recomendo

**Um.** Calcular e apresentar **as duas grandezas**, `L` e `h_f`, rotuladas de forma
inequívoca, e declarar em cada saída qual delas usa. Hoje o ecrã diz «comprimento da chama»
e a distância de segurança consome-o como se fosse altura, sem o dizer ao operador.

**Dois.** Extrair de Butler (2014) — que não tenho — o que a revisão faz ao fator 4 em
condições de vento e declive. Enquanto isso não estiver feito, **a margem da substituição
não pode ser tratada como disponível**, porque pode já estar gasta.

**Três.** Manter `Math.ceil` ao metro superior. Está certo e não é para discutir.

**Quatro, e é o que mais importa.** A regra SEG-3 do `d0001` continua por implementar: a
distância de segurança é um valor teórico de referência que não substitui o reconhecimento
no local, a identificação de zonas de segurança e caminhos de fuga, nem o LACES. A DON n.º 2,
Anexo 3, situação n.º 3, identifica a ausência dessa identificação como situação de perigo.
Nenhum número deste módulo dispensa isso, e o impresso tem de o dizer.

## A.4 · Uma terceira distância que não existe e devia

O módulo não estima **projeção de faúlhas**. O próprio código reconhece que é essa condição
que falha primeiro num incêndio de verão no Douro. Sem ela, a largura de contenção é a
largura mínima na ausência do mecanismo dominante de falha da linha — o que é uma coisa
muito diferente de «a largura que aguenta».

Não proponho estimá-la. Proponho que a aplicação não apresente a largura de contenção sem a
condição, e hoje apresenta-a em pelo menos um sítio sem ela.

---

# PARTE B · A citação de Byram intacta

## B.1 · Treze citações, duas completas

| Forma | Ocorrências |
|---|---|
| `Byram (1959)` ou `Byram 1959`, sem intermediário | **11** |
| `Byram (1959), por Fernandes (2003)` / `via Fernandes 2003` | **2** |

A aplicação **não leu Byram**. Leu Fernandes (2003), que cita Byram. Em duas ocorrências
diz-se; em onze, não.

Isto não é pedantismo bibliográfico. Uma citação em segunda mão apresentada como primária
transfere para Byram a responsabilidade por escolhas que foram de Fernandes — e a secção
seguinte mostra uma escolha exatamente dessas, escondida num único carácter.

**A citação completa, que não aparece em lado nenhum do artefacto:**

> Byram, G. M. (1959). Combustion of forest fuels. In: Davis, K. P. (ed.), *Forest Fire:
> Control and Use*. McGraw-Hill, New York, pp. 61–89.

## B.2 · A constante escondida no «/2»

```js
function intensidadeByram(rMh, wTha){
  return r * w / 2;
}
```

O comentário diz que a forma reduzida sai da definição de Byram com poder calorífico de
18 000 kJ/kg e as unidades convertidas. Está correto, e verifiquei:

```
I = H · w[kg/m²] · R[m/s]
  = H · (w[t/ha]/10) · (R[m/h]/3600)
  = H · w · R / 36000

H = 18 000  ->  I = R·w/2,000
H = 18 700  ->  I = R·w/1,925
H = 20 000  ->  I = R·w/1,800
```

**Mas a consequência não está assumida:** o `2` não é uma conversão de unidades. É uma
conversão de unidades **multiplicada por uma constante física escolhida por Fernandes**. E
essa constante é invisível — não existe no código, não tem nome, não tem ficha, não pode ser
substituída e não aparece no PEA impresso.

Byram define `I = H·w·R`. Byram **não** fixa H em 18 000 kJ/kg. Atribuir o `/2` a Byram é,
literalmente, uma citação não intacta: a definição é dele, o número é de outro, e o código
funde os dois num carácter.

O valor clássico para combustíveis florestais é 18 700 kJ/kg. Usá-lo daria **+3,9 %** de
intensidade. Numericamente é pouco; estruturalmente é o mesmo defeito que estamos a auditar
em todo o lado, no ponto mais citado do módulo.

**Correção:** `const H_COMBUSTAO = 18000; // kJ/kg, Fernandes (2003)` e a intensidade
calculada a partir dele. Passa a ser visível, substituível, fichável, e imprimível.

## B.3 · O que é de Byram e o que está por confirmar

| Atribuído a Byram | Verificável daqui | Estado |
|---|---|---|
| `I = H·w·R` | Sim — é a definição de intensidade da frente | **CONFIRMADO** |
| `H = 18 000 kJ/kg` | Não é de Byram; é escolha de Fernandes (2003) | **MAL ATRIBUÍDO** |
| Largura de contenção = 1,5 × comprimento da chama | Não consigo verificar sem a fonte | **POR CONFIRMAR** |
| Condição de ausência de projeção de faúlhas | Não consigo verificar sem a fonte | **POR CONFIRMAR** |

**Sobre as duas últimas, sou obrigado a ser exato quanto ao que não sei.** O capítulo de
Byram é sobre combustão de combustíveis florestais: calor de combustão, intensidade da
frente, comprimento de chama. Que dele saia uma regra operacional de largura de linha é
plausível — Byram discute a ligação entre intensidade e dificuldade de controlo — mas
**plausível não é verificado**, e uma regra de largura de linha é exatamente o tipo de
número que entra na literatura operacional e é retroatribuído à fonte teórica.

É a primeira verificação a fazer, e é o núcleo desta encomenda. Se a regra do 1,5× não
estiver em Byram (1959), estamos perante o mesmo padrão do A2: um número operacional com
proveniência atribuída por hábito e não por leitura.

## B.4 · Uma afirmação do código que verifiquei e é parcialmente verdadeira

> *`I = 300·L²` […] confere com a outra formulação corrente, `I = 258·L^2,17`, dentro de
> poucos por cento na gama que interessa — as duas dão cerca de 3,6 m para os 4 000 kW/m.*

| I (kW/m) | √(I/300) | (I/258)^(1/2,17) | Divergência |
|---|---|---|---|
| 100 | 0,58 | 0,65 | **12 %** |
| 200 | 0,82 | 0,89 | 9 % |
| 350 | 1,08 | 1,15 | 7 % |
| 1 200 | 2,00 | 2,03 | 2 % |
| 1 700 | 2,38 | 2,38 | 0 % |
| 4 000 | 3,65 | 3,54 | 3 % |
| 10 000 | 5,77 | 5,39 | 7 % |

A afirmação sobre os 4 000 kW/m está certa: 3,65 contra 3,54 m. A afirmação geral não: as
duas relações cruzam-se por volta dos 1 700 kW/m e divergem para os dois lados, chegando a
**12 % em intensidade baixa**.

Isso importa porque a intensidade baixa é onde se decide se o ataque manual é viável, e onde
a classe 1 acaba (350 kW/m) a divergência é de 7 %. A frase deve dizer «na gama do limite de
ataque direto», não «na gama que interessa» — porque a gama que interessa inclui a baixa.

---

# Testes propostos

| # | Verifica | Vermelho hoje |
|---|---|---|
| t-B1 | Nenhuma citação de fonte em segunda mão sem intermediário declarado | sim, 11 ocorrências |
| t-B2 | `intensidadeByram` não contém constantes numéricas por nomear além das conversões de unidade | sim |
| t-B3 | Existe `H_COMBUSTAO` com ficha em `PROV_MCF` | sim |
| t-A1 | `limitesDeManobra` devolve `L` e `h_f` distintos, e cada saída declara qual consome | sim |
| t-A2 | Nenhuma apresentação de `contencao` sem a condição de ausência de projeção | sim, pelo menos uma |
| t-A3 | A distância de segurança arredonda sempre para cima | não — está correto |

O t-B1 é trivial de automatizar e é «vermelho primeiro» no sentido que o #002 usa: define a
obrigação antes de existir o mecanismo que a cumpre. Escrevo-o quando disserem.

---

# Resumo em cinco linhas

1. A largura de contenção usa a grandeza certa. A distância de segurança usa o comprimento
   onde a fonte pede a altura, e a margem que isso cria pode já estar gasta a cobrir a
   insuficiência do fator 4 em vento e declive.
2. Butler (2014) é a fonte que falta, e falta antes de junho.
3. Onze das treze citações de Byram omitem que a leitura foi feita em Fernandes (2003).
4. O `/2` da intensidade esconde `H = 18 000 kJ/kg`, que é escolha de Fernandes e não de
   Byram. Tem de ser uma constante com nome.
5. Que a regra do 1,5× seja de Byram está por confirmar, e é a verificação central desta
   encomenda.

---

*Fim.*
