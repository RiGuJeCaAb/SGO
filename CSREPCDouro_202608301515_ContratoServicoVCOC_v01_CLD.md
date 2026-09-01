# Serviço de acompanhamento da Estação PEA — contrato v0.1

**Estado: proposta.** Escrito para ser construído do lado do servidor da VCOC em paralelo
com a aplicação. Nada aqui está implementado ainda; o que existe hoje na Estação é a
metade local — resumos SHA-256, proveniência e identidade declarada — e está assinalado.

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

## 4. O que **não** deve ir para o serviço

- O catálogo de elementos com contactos pessoais, sem decisão institucional prévia sobre
  RGPD: fundamento, minimização, prazo de conservação e quem acede.
- Qualquer coisa que a Estação envie hoje para modelos de linguagem, sem a mesma decisão.

Estes dois pontos não são técnicos e não os decido eu; ficam aqui porque é onde se veem.

## 5. Ordem de construção

1. Contas, perfis e sessão. Sem sincronização — só autenticar e devolver a identidade,
   que a Estação passa a usar em vez da declarada.
2. Receção de estados, cadeia e recibo assinado.
3. Consulta: listar ocorrências, obter estados, verificar um recibo.
4. Arquivo e auditoria.

Cada etapa é útil sozinha, e nenhuma delas torna a Estação dependente do serviço.

## 6. O que já existe do lado da Estação

| Peça | Onde |
|---|---|
| SHA-256 e serialização canónica | `fonte/1-nucleo/19-resumo-criptografico.js` |
| Carimbo no pacote exportado e na importação | `fonte/2-comando/03-exportacao-e-importacao-da-ocorrencia.js` |
| Carimbo do registo encerrado | `fonte/2-comando/04-encerramento-da-ocorrencia.js` |
| Proveniência do ficheiro importado | ramo `integridade` do estado |
| Perfis e identidade declarada | `fonte/1-nucleo/21-identidade-e-perfis.js` |

Falta, do lado de cá: a fila persistente, o cliente do serviço, e o recibo à vista. Espera
pela primeira etapa do servidor, porque não vale a pena escrever um cliente contra um
contrato que ainda pode mudar.
