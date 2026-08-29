# Triagem da análise clínica externa ao r0050

Recebida em 29 de agosto de 2026. A análise foi feita sobre o `r0050`; o `r0051` só difere
na arrumação do léxico, e o `r0052` responde a dois destes achados.

Cada achado foi verificado contra o código, não contra a impressão. O veredito é um de
cinco:

| Veredito | Significado |
|---|---|
| **Não procede** | O achado está errado, e diz-se porquê, com a linha de código. |
| **Já feito** | Existe, e a análise não o viu. |
| **Procede** | É defeito. Corrige-se. |
| **Procede em parte** | Metade existe, metade falta. |
| **Decisão do Ricardo** | Não é defeito: é escolha de arquitetura, e não é minha. |

## Nota de método, que explica metade dos falsos positivos

A análise leu **o ficheiro HTML**, não a aplicação a correr. Vários achados são texto de
arranque que o JavaScript substitui no primeiro décimo de segundo. Isto não desqualifica a
análise — desqualifica três achados dela, e vale a pena tê-lo presente na próxima.

---

## Achados que não procedem

| # | Achado | Porquê não procede |
|---|---|---|
| 6.1 | «PRÓXIMO PASSO a carregar...» é placeholder pendente | É o texto estático do molde. `pintarGuia()` substitui-o no arranque pelo próximo campo obrigatório em falta, com botão «Ir» para lá — `fonte/1-nucleo/16-arrumacao-da-casa-por-celula.js:151`. Se ficasse «a carregar», era sinal de exceção no arranque, e o `npm run visual` recusa exceções nas quatro larguras. |
| 4.2 | «sem ocorrência carregada» com todos os módulos ativos | A frase é o mesmo tipo de placeholder: `01-render-geral.js:9` reescreve-a com o número, contagem de PEA e de registos assim que há ocorrência. O que **procede** é a outra metade do achado — ver 4.2 abaixo. |
| 4.14 (rotação) | «350° → 10° é lido como 340°» | `angDiff` é circular desde sempre: `const angDiff=(a,b)=>{let x=Math.abs(a-b)%360;return x>180?360-x:x;}` — `fonte/3-planeamento/07-meteorologia.js:4`. Dá 20°. |
| 4.14 (HR crítica) | «horas críticas HR < 30 %» | O código usa `rh<=20` para as críticas; os 30 % são a sombra do gráfico. A análise trocou os dois limiares. |
| 3.2 | «IA só apoia, nunca decide» — recomendação | Não é achado, é o princípio que já está escrito e cumprido: o PEA determinístico é o oficial, e o modelo só redige quando há rede. Fica registado porque é o único ponto onde concordo antes de ser preciso mudar nada. |

---

## Achados corrigidos no r0052

| # | Achado | O que se fez |
|---|---|---|
| 4.10 | Área do perímetro sem robustez geoespacial | **Era pior do que a análise diz.** `areaGeoJSON` devolvia *o maior anel*: um incêndio em três manchas contava só a maior, e as ilhas por arder dentro do perímetro contavam como ardidas. Agora soma os anéis exteriores de todos os polígonos, de todas as geometrias, e desconta os interiores. Três testes: manchas separadas, ilha descontada, coleções com geometrias que não são área. A área vai no PEA — era número errado a ser transmitido. |
| 4.3 | «A área é estimada automaticamente a partir do polígono» sem polígono | Passa a: «Nenhum perímetro carregado. Sem ficheiro, a área preenche-se à mão; com ficheiro, é calculada do polígono.» |

---

## Achados corrigidos na r0053

Os quatro que se resolviam sem decidir a arquitetura.

| # | Achado | O que se fez |
|---|---|---|
| 4.18 / P0-3 | Sem carimbo de integridade | SHA-256 escrito no projeto, contra os vetores do FIPS 180-4, com serialização de chaves ordenadas. O pacote leva revisão da app, ficheiro de origem e resumo do estado; a importação confere e **avisa sem recusar**; o encerramento carimba o registo que fecha. **Destapou um defeito de fundo**: os acessores de estado trocavam o objeto a cada chamada, e qualquer referência guardada antes escrevia no vazio, sem erro. Passam a preencher no lugar. |
| 4.5 / P0-4 | Origem das coordenadas fora do estado | `meta.coordFonte`: manual, geocodificação com serviço e topónimo, ou importação. Mostrada por baixo dos formatos; escrever por cima assume-a como manual. |
| 4.14 | Limiares sem chão | `LIMIARES_METEO`, declarados: rotação ≥ 50° **e** vento ≥ 8 km/h, convectivo ≥ 0,2 mm, janela ≥ 2 h. A legenda diz os mesmos números. |
| 4.8 | Datas do DECIR fixas no código | Tabela por ano com fonte. Ano sem tabela devolve vazio e a aplicação diz que não tem a diretiva desse ano. |

## Achados que procedem e estão por fazer

Por ordem de gravidade operacional, não pela ordem da análise.

| # | Achado | Avaliação | Custo |
|---|---|---|---|
| 4.1 / 4.20 | Persistência local, fita do tempo sem prova | **Procede, e é o principal.** É a mesma decisão de arquitetura já em cima da mesa: sem serviço, não há prova imutável nem estado partilhado entre células. | Grande — decisão do Ricardo |
| 8.1 / 8.2 | Sem autenticação nem perfis | **Procede.** Mesma decisão. A tabela de perfis da análise (observador, operador, planeamento, logística, COS, administrador, auditor) é boa e serve de ponto de partida. | Grande — decisão do Ricardo |
| 4.2 | Trabalho sem ocorrência aberta | **Procede.** Não há porta: escreve-se em qualquer célula sem número de ocorrência. O guia diz o que falta, mas não impede. | Médio |
| 4.9 | Avisos sem drill-down | **Procede em parte.** Cada regra já traz situação medida, determinação e referência legal (`REGRAS_DON`, com `s`, `a`, `r`). Falta mostrar tudo isso no ecrã em vez de o resumir. | Pequeno |
| 4.11 | Pontos sensíveis são só nome e prioridade | **Procede.** Para decidir proteção de pessoas é pouco. A lista de campos da análise é acertada. | Médio |
| 4.17 | Catálogo de elementos com dados pessoais | **Procede.** Nomes e contactos, guardados no dispositivo, sem prazo nem fundamento declarado. Mínimo imediato: não sair na exportação do PEA e dizê-lo no ecrã. | Pequeno |
| 4.12 / 4.13 | Meteorologia sem rasto; CSV editável sem registo | **Procede.** Guardar fonte, modelo, coordenadas, instante de consulta, e marcar a análise quando o CSV foi mexido à mão. | Médio |
| 7.2 | Falta mapa | **Procede.** Coordenadas, perímetro, setores, pontos sensíveis e ponto de trânsito sem os ver num mapa. É a maior lacuna de utilizabilidade. | Grande |
| 7.3 | Impressão depende do browser | **Procede.** O PEA sai pela impressão do navegador, com instruções ao utilizador. | Médio |
| 4.15 | Bloqueio de emissão sem válvula | **Procede como questão.** O bloqueio existe e é duro (`14-emissao-do-pea.js:4`). Falta decidir se há proposta urgente marcada como incompleta, com justificação do COS. É decisão doutrinária, não técnica. |  Decisão do Ricardo |
| 4.4 | SADO vs SGO | **Não é inconsistência, é falta de uma frase.** O SADO é o sistema onde a ocorrência tem número; o SGO é o sistema de gestão de operações do Despacho n.º 4067/2024. A app já diz «não encerra a ocorrência no SADO». Fica em aberto pôr a distinção na ajuda. | Pequeno |
| 4.6 | Validação de coordenadas | **Procede.** Falta o enquadramento territorial: avisar quando a coordenada cai fora de Portugal ou longe do distrito escolhido. | Pequeno |
| 4.7 | Fase SGO sem coerência com o dispositivo | **Procede.** A fase escolhe-se à mão e pode contradizer os operacionais contados. Sugerir, permitir sobrepor, registar. | Médio |
| 7.4 | Arquivo sem pesquisa | **Procede.** Hoje é uma lista. Com dezenas de ocorrências deixa de servir. | Pequeno |

---

## O que a análise não viu, e devia

1. **O relógio.** A análise fala de fusos e hora legal, mas não do que interessa: os
   medidores de tempo e as regras de prazo leem o relógio do dispositivo. Num portátil de
   PCO com a hora errada, a rendição é calculada errada e ninguém dá por isso. Não há
   verificação nenhuma contra uma referência externa.
2. **A migração do estado.** Há dez versões de estado e uma escada de migrações. Um pacote
   exportado de uma versão antiga é migrado à entrada — mas nada verifica que a migração
   preservou o que interessava. É onde uma ocorrência se pode perder em silêncio.
3. **O `try{}catch(e){}` mudo.** Há dezenas espalhados pelo arranque. Protegem o arranque
   de uma exceção num módulo, mas engolem-na sem deixar rasto. Já houve uma regressão
   assim, com botões a perder ouvintes.

---

## Onde discordo do prognóstico

A análise conclui «prognóstico reservado se continuar apenas como HTML local». Concordo com
o diagnóstico e não com a conclusão, por uma razão: **o local-first não é uma fase, é um
requisito**. O PCO trabalha com ligação intermitente ou nenhuma, e uma aplicação que
precise de servidor para registar a evolução é uma aplicação que se cala quando é mais
precisa.

O caminho não é trocar o local pelo servido. É **local-first com sincronização quando há
rede**: o registo faz-se sempre localmente, e sobe quando puder — assinado, com o resumo
criptográfico de cada estado, para que o servidor possa provar a cadeia sem ter estado
presente. É mais trabalho do que um backend clássico, e é o único desenho que não obriga o
oficial a escolher entre ter prova e ter aplicação.
