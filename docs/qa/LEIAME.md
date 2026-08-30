# Provas de verificação

Capturas de ecrã que acompanham uma revisão e mostram o que ela mudou. Vieram com as
entregas da linhagem paralela, que verifica em navegador e junta a prova.

| Ficheiro | Revisão | O que prova |
|---|---|---|
| `CSREPCDouro_qa0008_..._RamoLogistica_CLD.png` | r0035 | O ramo `O.logistica` com reserva, zona de apoio e ponto de trânsito |
| `CSREPCDouro_qa0009_..._Planeamento_CLD.png` | r0036 | O separador de Planeamento depois da arrumação por célula |
| `CSREPCDouro_qa0009_..._Operacoes_CLD.png` | r0036 | O separador de Operações |
| `CSREPCDouro_qa0009_..._Logistica_CLD.png` | r0036 | O separador de Logística e Finanças |
| `CSREPCDouro_qa0010_..._NavClaro_CLD.png` | r0038 | A cor por célula nos separadores, tema claro |
| `CSREPCDouro_qa0010_..._NavEscuro_CLD.png` | r0038 | O mesmo, tema escuro |
| `CSREPCDouro_qa0010_..._TurnoCores_CLD.png` | r0038 | O quadro de passagem de turno com a cor de cada célula |
| `CSREPCDouro_qa0011_..._MedidorGomos_CLD.png` | r0049 | O medidor em gomos nas unidades de setor: um gomo por hora, acesos os que faltam |
| `CSREPCDouro_qa0011_..._MedidorAereos_CLD.png` | r0049 | O mesmo medidor nos meios aéreos, com o teto de 6 h |
| `CSREPCDouro_qa0011_..._LexicoArrumado_CLD.png` | r0049 | O registo de evolução em três blocos, com o léxico por grupo e procura |
| `CSREPCDouro_qa0012_..._LexicoVinte_CLD.png` | r0050 | O léxico com vinte frases em cada grupo |
| `CSREPCDouro_qa0012_..._TeclasLexico_CLD.png` | r0050 | As teclas do léxico com o relevo das teclas de canal, tema claro |
| `CSREPCDouro_qa0013_..._LexicoPorCor_CLD.png` | r0051 | O grupo População em blocos de cor: agrava, melhora, meios, decisão, ponto de situação |
| `CSREPCDouro_qa0013_..._EscalaIntacta_CLD.png` | r0051 | A escala do perímetro inteira, à cabeça do grupo, sem ser desmanchada pela cor |
| `CSREPCDouro_qa0014_..._CarimboEncerramento_CLD.png` | r0053 | O carimbo de integridade no cartão de encerramento, a conferir com o registo |
| `CSREPCDouro_qa0011_202608291730_Comando_CLD.png` | r0056 | Da linhagem paralela: o painel de Comando com a hierarquia tipográfica do p0012 |
| `CSREPCDouro_qa0011_202608291730_Logistica_CLD.png` | r0056 | O mesmo, no painel de Logística |
| `CSREPCDouro_qa0012_202608291830_Comando_CLD.png` | r0057 | Comando depois das quatro correções do p0013 |
| `CSREPCDouro_qa0012_202608291830_Logistica_CLD.png` | r0057 | Logística com um só quadro de rendições |
| `CSREPCDouro_qa0013_202608291930_PEAImpresso_CLD.pdf` | r0058 (paralela) | O PEA impresso no formato do modelo .docx aceite |
| `CSREPCDouro_qa0014_202608292000_PEAImpresso_CLD.pdf` | r0059 (paralela) | O mesmo, com uma folha por célula |
| `CSREPCDouro_qa0015_..._AprovacaoCOS_CLD.png` | r0060 | Os três estados da proposta, com a aprovação registada e as ordens produzidas |
| `CSREPCDouro_qa0016_..._QuemRegista_CLD.png` | r0064 | A identidade declarada e os perfis, com a recusa a explicar-se |

Os `qa0011` e `qa0012` de 29 de agosto às 17h30 e 18h30 vieram da linhagem paralela e
repetem números que esta linhagem já tinha usado nesse dia. Distinguem-se pelo carimbo de
data e ficam como vieram: renumerá-los partiria a referência dos documentos que os citam.

Não substituem `npm run visual`, que corre sem olhos e apanha transbordo e exceções às
quatro larguras e nos dois temas. Servem para o que a auditoria automática não vê: se o
que está no ecrã é o que se queria.
