/* ================= NÚCLEO · versão do estado gravado ================= */
/* Uma ocorrência gravada é prova documental de decisões de comando: não se abre à
   sorte. Cada alteração à forma de O acrescenta uma migração ao fim de MIGRACOES e
   sobe VERSAO_ESTADO em um. O índice i migra da versão i para a versão i+1.
   Declarado antes de `let O`, que corre no arranque e já precisa da versão. */
const VERSAO_ESTADO = 27;

/* As três chaves que não são dados, e o que cada uma faz — medido, não suposto.

   `JSON.parse` cria-as como propriedades **próprias** e não dispara setter nenhum: o
   pacote, em si, é inofensivo. O dano faz-se a seguir, no `Object.assign` da migração 0,
   que copia por [[Set]]. Das três, só `__proto__` tem acessor no `Object.prototype`: um
   `dados.topo.__proto__` no ficheiro troca o protótipo do objeto de destino, e o campo
   que lá estiver passa a ser legível em `O.dados.topo` — comprovado, com o valor a sair
   à superfície logo à saída do degrau 0. `constructor` e `prototype` não têm acessor e
   entram como propriedades próprias banais; recusam-se na mesma, porque uma delas tapa
   `x.constructor` para quem o leia, e porque três chaves numa lista custam o mesmo que
   uma.

   Duas coisas que isto **não** é, e que convém não crescerem na contagem de quem vier a
   seguir. Não polui o `Object.prototype` global: o alvo do `Object.assign` é um objeto
   novo, e medimos o global intacto antes e depois. E, na escada de hoje, o degrau 2 para
   3 reconstrói o `dados.topo` e lava o protótipo trocado sem querer — isto é, o efeito
   observável apaga-se por acidente do que os degraus seguintes fazem, e não por desenho.
   É precisamente por ser por acidente que a porta se fecha aqui: o degrau que amanhã se
   acrescentar ao fim da escada não tem de saber nada disto. */
const CHAVES_RECUSADAS = ["__proto__", "constructor", "prototype"];

/**
 * Tira de um estado as chaves que não são dados, e diz quantas tirou.
 *
 * **Tira, não recusa o ficheiro** — que é a doutrina desta aplicação em todo o lado onde
 * entra coisa de fora: num posto de comando, um registo com um campo estragado ainda é o
 * registo, e deitá-lo fora inteiro pode ser a diferença entre ter a ocorrência e não ter
 * nada. O que se recusa é a chave; a ocorrência entra, e quem importou fica a saber.
 *
 * Corrige no lugar. A profundidade é limitada por precaução: um pacote de JSON não tem
 * ciclos, mas o limite custa nada e a alternativa é uma pilha esgotada num PCO.
 *
 * @param {any} v ramo do estado, corrigido no lugar
 * @param {number} [prof] profundidade corrente
 * @returns {number} quantas chaves foram tiradas
 */
function limparChavesRecusadas(v, prof){
  const d = prof || 0;
  if(!v || typeof v !== "object" || d > 40) return 0;
  let n = 0;
  if(Array.isArray(v)){ v.forEach(x=>{ n += limparChavesRecusadas(x, d+1); }); return n; }
  CHAVES_RECUSADAS.forEach(k=>{
    if(Object.prototype.hasOwnProperty.call(v, k)){ delete v[k]; n++; }
  });
  Object.keys(v).forEach(k=>{ n += limparChavesRecusadas(v[k], d+1); });
  return n;
}

const MIGRACOES = [
  /* 0 -> 1 · Primeira versão numerada. Preenche contra os valores por omissão os
     ramos que o carregamento antigo deixava por normalizar — meta, pco e os ramos
     de dados —, sem sobrepor nenhum valor já gravado.
     Não reinterpreta a semântica dos canais: uma ocorrência gravada antes de
     siresp/ba passarem a ser o nível de manobra não traz marca que permita
     distingui-la, e adivinhar seria pior do que não mexer. */
  e => {
    /* `base` fica intacto: serve de referência dos valores por omissão. O estado
       a devolver é outro exemplar, para que juntar o topo não apague as omissões. */
    const base = novoEstado();
    const guardado = e;
    e = Object.assign(novoEstado(), guardado);
    e.meta = Object.assign({}, base.meta, guardado.meta||{});
    e.dados = Object.assign({}, base.dados, guardado.dados||{});
    e.dados.est = Object.assign({}, base.dados.est, e.dados.est||{});
    e.dados.topo = Object.assign({}, base.dados.topo, e.dados.topo||{});
    /* A reserva, a zona de apoio e o ponto de trânsito eram normalizados aqui contra
       o estado por omissão. Desde a versão 5 já não estão nele — mudaram de dono para
       `logistica` —, e a normalização deixou de ter contra o que comparar: preenchia
       com indefinido e o degrau 4 para 5 apagava logo a seguir. É esse degrau que os
       move e lhes dá os valores por omissão, e lê a origem defensivamente. */
    e.pco = Object.assign({}, base.pco, guardado.pco||{});
    /* O plano de comunicações seguiu o mesmo caminho na versão 6: o degrau 5 para 6
       é que o move e lhe dá os valores por omissão. */
    [[e.dados,"anexos"],[e.dados.est,"setores"],[e.dados.est,"aerL"],[e.pco,"funcoes"],
     [e,"evolucao"],[e,"peas"],[e,"fita"]]
      .forEach(([dono,ramo])=>{ if(!Array.isArray(dono[ramo])) dono[ramo]=[]; });
    return e;
  },
  /* 1 -> 2 · Repartição do PEA pelas células que a lei lhe atribui. Até aqui o plano
     era gravado em json {plan,ops}, com o objetivo, as prioridades, a segurança e a
     validade do lado de operações. O art. 27.º, n.º 1, al. a) do Despacho n.º
     4067/2024 põe o plano estratégico de ação inteiro na célula de planeamento; a
     operações cabe transmitir as ordens de missão (art. 17.º, n.º 1, al. c)).
     Passa a gravar-se json {pea,ordens}. Nenhum conteúdo se perde: muda o dono.
     pecas() reconhece os dois formatos, pelo que a conversão é idempotente. */
  e => {
    (e.peas||[]).forEach(p=>{
      if(p && p.json && !p.json.pea){ const c = pecas(p); p.json = {pea:c.pea, ordens:c.ordens}; }
    });
    return e;
  },
  /* 2 -> 3 · Razão declive/vento da composição de Viegas (2004), acrescentada à
     análise topográfica. Campo novo, sem valor por omissão que se possa presumir:
     fica vazio, e enquanto o estiver a aplicação não calcula o desvio da cabeça. */
  e => {
    e.dados = e.dados || {};
    e.dados.topo = Object.assign({orient:"", declive:"", obs:"", eps:""}, e.dados.topo||{});
    return e;
  }
];

/* **A escada continua noutro ficheiro.** Os degraus seguintes são acrescentados com
   `MIGRACOES.push` em `04-modelo-de-celulas-e-turno.js`, à medida que a matéria de cada um
   passou a existir. Quem acrescentar um degrau novo acrescenta-o **no fim desse ficheiro**,
   e não aqui: um degrau posto no meio corre na versão errada. Já aconteceu — o limite de
   setor, escrito aqui, ficou a correr no degrau 3 e nunca chegava aos setores. */

