/* ================= NÚCLEO · versão do estado gravado ================= */
/* Uma ocorrência gravada é prova documental de decisões de comando: não se abre à
   sorte. Cada alteração à forma de O acrescenta uma migração ao fim de MIGRACOES e
   sobe VERSAO_ESTADO em um. O índice i migra da versão i para a versão i+1.
   Declarado antes de `let O`, que corre no arranque e já precisa da versão. */
const VERSAO_ESTADO = 24;

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

