# Pipeline de análise — desenho proposto

Resposta à decisão em aberto sobre o pipeline de seis agentes.
2026-08-27.

Complementa `CSREPCDouro_202608272118_PropostaEvolucao_CLD.md`, secção 5.

---

## 1. A pergunta estava mal posta, e a culpa é da proposta anterior

A proposta anterior apresentou três vias — não fazer, serviço acompanhante, gerar noutro
sítio — como se a escolha fosse entre elas. Olhando com atenção para os seis agentes
previstos, a escolha não é essa.

| Agente previsto | Natureza real | Já existe em embrião |
|---|---|---|
| Meteo | Cálculo sobre a série meteorológica | `metricas`, `resumoHoras`, `limiares`, `analisar` |
| Topografia | Cálculo sobre o relevo | `analisarRelevo` |
| Demografia | Deteção sobre pontos sensíveis | `detetarSensiveis` |
| Comportamento do Fogo | Cálculo sobre modelo declarado | — |
| Sintetizador | Redação | `gerarPlan`, `gerarOps`, `detPlan`, `detOps` |
| Crítico | Verificação de coerência | `verificacoesDON` |

**Quatro dos seis não são agentes. São contas.** Chamar-lhes agentes foi uma decisão de
arquitetura tomada quando se assumiu que havia um modelo no circuito. Não há, no terreno.
E não faz falta: são análises determinísticas sobre dados que a aplicação já tem.

Mais do que isso — e este é o ponto que decide: **num documento que sustenta decisões de
comando, um número que pode ser calculado não deve depender de um modelo.** Um valor
calculado tem fonte, é reproduzível e é auditável, que é exatamente o que a restrição
número quatro exige. Um valor redigido por um modelo não tem nada disso.

---

## 2. O que proponho

### 2.1 Camada de análise, determinística, dentro da aplicação

Os quatro primeiros agentes passam a ser módulos de análise que correm sempre, sem rede e
sem modelo, e cujo resultado alimenta o PEA e o painel de conformidade.

Três deles já existem em embrião e o trabalho é consolidá-los, dar-lhes fronteira clara e
testes — são funções puras do estado, o alvo mais fácil da camada 0.

O quarto, Comportamento do Fogo, é trabalho novo e tem uma condição prévia: **o modelo a
usar tem de ser escolhido e a fonte identificada antes de se escrever uma linha.** Não se
inventa um índice, não se inventa um limiar, não se copia um número de memória. Enquanto
essa fonte não estiver fixada, o módulo apresenta os dados de entrada e os limiares que já
estão na aplicação com fonte, e não produz classificação própria. Isto é a restrição
número quatro aplicada, não excesso de zelo.

### 2.2 Os dois restantes são onde um modelo acrescenta valor

O Sintetizador redige. O Crítico lê o conjunto e aponta incoerência de raciocínio, que é
diferente de incumprimento de regra. São as duas tarefas em que um modelo faz o que
nenhuma conta faz.

Para estes dois, a via é a **C**: exportar o contexto da ocorrência, obter a proposta onde
houver acesso ao modelo, importá-la de volta. Sem infraestrutura, sem chave distribuída,
sem alterar o modo como a aplicação chega ao PCO. E funciona hoje.

O Crítico tem ainda uma via determinística que vale por si: é a extensão natural do
registo de regras da correção 4.3. Regra incumprida é verificação; incoerência de
raciocínio é modelo. As duas coisas convivem no mesmo painel, distinguidas pela origem.

### 2.3 A via B fica em aberto, e mais barata

Se mais tarde o CSREPC quiser institucionalizar isto, o serviço acompanhante passa a ter
um âmbito muito menor do que o previsto: já não são seis agentes, são duas chamadas. Isso
torna a via B uma evolução da via C e não uma alternativa a ela — o mesmo contexto
exportado, entregue por rede em vez de à mão.

Ou seja, não é preciso decidir agora. A via C não fecha portas.

---

## 3. Condições de execução

**Proveniência registada.** Cada PEA guarda como foi produzido: determinístico, ou
importado com indicação da origem. Já hoje a proposta sai identificada quando é
determinística; passa a haver o registo simétrico. Um documento de comando tem de dizer de
onde veio.

**A importação é dados, nunca código.** O ficheiro importado é validado contra a forma
esperada, os campos desconhecidos são descartados e nada dele é executado nem inserido
como HTML. Um PEA importado é texto que a aplicação coloca nos seus próprios campos.

**A análise determinística corre sempre.** Mesmo quando há proposta importada, os módulos
de análise correm e as suas conclusões prevalecem sobre o que o texto importado disser.
Se houver divergência, é assinalada — não silenciada.

---

## 4. Sequência

1. Consolidar Meteo, Topografia e Demografia como módulos com fronteira e testes.
2. Exportação do contexto da ocorrência e importação de proposta, com validação.
3. Fixar a fonte do modelo de comportamento do fogo. Decisão doutrinária, não técnica.
4. Módulo de Comportamento do Fogo, depois de 3.
5. Crítico determinístico, sobre o registo de regras.
6. Via B, apenas se o CSREPC a quiser, e já reduzida a duas chamadas.
