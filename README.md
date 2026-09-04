# SGO — Estação PEA

Estação de trabalho do Posto de Comando Operacional do CSREPC Douro para incêndios
rurais: recolha da ocorrência, acompanhamento da evolução, verificação de conformidade
com a doutrina e emissão de propostas numeradas de Plano Estratégico de Ação.

**A entrega é um único ficheiro HTML autónomo.** Abre-se com duplo clique, sem servidor,
sem instalação e sem rede. É o que vai para o posto de comando.

**A fonte vive em `fonte/`**, um módulo por subsistema, e a entrega produz-se com
`npm run montar`. O Node é preciso para produzir, não para usar.

## Usar

Abrir a revisão de numeração mais alta em `app/` no navegador. O `home.html` da raiz é a
mesma entrega, reescrito a cada montagem, e é o que o GitHub Pages serve em
`https://rigujecaab.github.io/SGO/` — quando o repositório publica, ver `docs/ESTADO.md`.

## Desenvolver

```
npm install          # ferramentas de desenvolvimento, só
npm run montar       # junta fonte/ e escreve a revisão seguinte em app/
npm run tudo         # sintaxe, testes, análise estática e tipos
npm run visual       # transbordo e exceções, quatro larguras, dois temas
```

Altera-se em `fonte/`, nunca em `app/`. Um teste recusa que a entrega divirja da fonte.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `fonte/` | A fonte: `molde.html` e um módulo por subsistema |
| `app/` | As entregas, uma por revisão. Geradas |
| `ferramentas/` | Montagem, verificação, análise estática, tipos, auditoria visual |
| `tests/` | Testes, mantidos entre sessões |
| `tipos/` | Formas do estado, para o verificador. Não vai para o navegador |
| `docs/` | Documentos do projeto, ligação à Gestão PCO e fontes doutrinárias |

## Por onde começar

- `CLAUDE.md` — restrições não negociáveis e método de trabalho
- `docs/ESTADO.md` — onde está o projeto agora
- `docs/CSREPCDouro_202608272046_PromptEstacaoPEA_CLD.md` — a especificação completa
- `docs/README.md` — como a documentação está arrumada
