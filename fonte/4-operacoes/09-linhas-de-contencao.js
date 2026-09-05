/* ================= OPERAÇÕES · linhas de contenção e de apoio =================
   Na carta anotada de Cabeça Boa as linhas aparecem com traço diferente conforme o que
   são: uma linha de contenção é obra a abrir, uma linha de apoio é o que já existe no
   terreno e se aproveita — uma estrada, uma linha de água, uma faixa já gerida.

   O que este módulo faz de diferente do resto é **confrontar a linha com a intensidade**.
   Byram (1959), por Fernandes (2003), dá a largura mínima para suster uma frente: uma vez
   e meia o comprimento da chama, e só na ausência de projeção de faúlhas com capacidade de
   ignição. Uma linha desenhada sem essa conta é um traço bonito; feita a conta, a aplicação
   diz se aquela linha aguenta o fogo que ali chega — e diz de onde tirou o número.

   Não decide por ninguém. Quem comanda tem razões que o modelo não tem, e a largura sai
   com a sua fonte precisamente para poder ser contrariada com conhecimento de causa. */

/**
 * As espécies de linha, com o que cada uma é.
 *
 * Duas, que são as que a carta anotada distingue. `obra` diz se a linha é para abrir — é o
 * que separa o que custa meios do que já lá está.
 */
const TIPOS_LINHA = [
  { k:"contencao", n:"Linha de contenção", d:"A abrir, para suster a frente", cor:"#7A4E8C", obra:true },
  { k:"apoio",     n:"Linha de apoio",     d:"Já existe no terreno e aproveita-se — estrada, linha de água, faixa gerida", cor:"#4E8B6E", obra:false }
];

/** A definição de uma espécie de linha. O que não se reconhece cai em «apoio». */
function defLinha(k){ return TIPOS_LINHA.find(t=>t.k === k) || TIPOS_LINHA[1]; }

/** A lista de linhas do teatro, criada à primeira vez que faz falta. */
function linhasLista(){
  if(!Array.isArray(O.dados.linhas)) O.dados.linhas = [];
  return O.dados.linhas;
}

/**
 * Fecha o traçado em curso como linha de contenção ou de apoio.
 *
 * A largura entra em metros e é a largura **útil** — a faixa sem combustível, e não a
 * largura da estrada com as bermas por cortar.
 */
function fecharLinha(){
  const traco = TRACO.pontos.map(p=>[p[0], p[1]]);
  if(traco.length < 2) return { ok:false, motivo:"Uma linha precisa de pelo menos dois vértices." };
  const tipo = String(($("linha-tipo")||{}).value || "contencao");
  const d = defLinha(tipo);
  const larg = parseFloat(String(($("linha-larg")||{}).value || "").replace(",", "."));
  const l = {
    id:"l"+agora().toString(36),
    tipo:d.k,
    linha:traco,
    /* Vazia quando não foi indicada: uma linha sem largura declarada não é uma linha de
       largura zero, e a leitura di-lo em vez de a dar por insuficiente. */
    larguraM: Number.isFinite(larg) && larg > 0 ? larg : null,
    aberta: !d.obra,
    m: comprimentoLinhaM(traco),
    setor: (()=>{ const i = setorDoPonto(traco[0][1], traco[0][0]); return i >= 0 ? NOMES_SETOR[i] : ""; })(),
    g: gdhAgora(), por: quemRegista(), nota: ""
  };
  linhasLista().push(l);
  O.evolucao.push({ g:l.g, tipo:"posit",
    txt:d.n+" traçada"+(l.setor? " no setor "+l.setor : "")+": "+l.m+" m"
      + (l.larguraM? ", "+String(l.larguraM).replace(".", ",")+" m de largura útil" : ", largura por indicar")+"." });
  fita(d.n+" traçada: "+l.m+" m");
  largarTraco();
  return { ok:true, linha:l };
}

/** Retira uma linha. */
function apagarLinha(id){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de alterar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const L = linhasLista(), i = L.findIndex(x=>x.id === id);
  if(i < 0) return { ok:false, motivo:"Linha não encontrada." };
  const [l] = L.splice(i, 1);
  O.evolucao.push({ g:gdhAgora(), tipo:"posit", txt:"Retirada a "+defLinha(l.tipo).n.toLowerCase()+" de "+l.m+" m." });
  return { ok:true, linha:l };
}

/**
 * Marca uma linha de contenção como aberta, ou volta a pô-la por abrir.
 *
 * É a diferença entre o que está no plano e o que está no terreno, e num ponto de situação
 * é a primeira pergunta: *a linha do flanco sul já está aberta?*
 */
function abrirLinha(id, aberta){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de alterar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const l = linhasLista().find(x=>x.id === id);
  if(!l) return { ok:false, motivo:"Linha não encontrada." };
  l.aberta = !!aberta;
  O.evolucao.push({ g:gdhAgora(), tipo:"posit",
    txt:defLinha(l.tipo).n+" de "+l.m+" m dada por "+(l.aberta? "aberta" : "por abrir")+"." });
  return { ok:true, linha:l };
}

/**
 * Esta linha aguenta o fogo que ali chega?
 *
 * Compara a largura declarada com a que Byram (1959) exige para a intensidade corrente —
 * uma vez e meia o comprimento da chama. Devolve `null` quando falta um dos dois lados da
 * comparação, e é isso que a leitura diz: não se responde a uma pergunta que não se pode
 * pôr.
 *
 * @returns {null|{basta:boolean, tem:number, precisa:number}}
 */
function linhaBasta(l){
  const f = O.dados.fogo;
  const m = limitesDeManobra(f.r, f.w);
  if(!m || !l || !l.larguraM) return null;
  return { basta: l.larguraM >= m.contencao, tem: l.larguraM, precisa: m.contencao };
}

/**
 * A leitura escrita das linhas: o que há, o que está aberto, e o que não aguenta.
 *
 * A ordem não é a de traçado: primeiro o que não aguenta, depois o que está por abrir,
 * depois o resto. Numa leitura em voz alta o que interessa vem à cabeça.
 */
function leituraDasLinhas(){
  const L = linhasLista();
  if(!L.length) return "";
  const peso = l => { const b = linhaBasta(l); return (b && !b.basta)? 0 : (!l.aberta? 1 : 2); };
  const ordenadas = L.slice().sort((a,b)=>peso(a) - peso(b));

  const partes = ordenadas.map(l=>{
    const d = defLinha(l.tipo);
    const p = [d.n + (l.setor? " no setor "+l.setor : "") + ", " + l.m + " m"
      + (l.larguraM? " por "+String(l.larguraM).replace(".", ",")+" m de largura útil" : ", largura por indicar") + "."];
    if(d.obra) p.push(l.aberta? "Dada por aberta." : "**Por abrir.**");
    const b = linhaBasta(l);
    if(b === null){
      p.push(l.larguraM
        ? "Sem a intensidade da frente não há com que dizer se aguenta."
        : "Sem a largura útil indicada não há com que dizer se aguenta.");
    } else if(b.basta){
      p.push("Aguenta: " + String(b.tem).replace(".", ",") + " m para os "
        + String(b.precisa).replace(".", ",") + " m que a intensidade exige (Byram 1959).");
    } else {
      p.push("**Não aguenta: " + String(b.tem).replace(".", ",") + " m para os "
        + String(b.precisa).replace(".", ",") + " m que a intensidade exige** (Byram 1959).");
    }
    return p.join(" ");
  });

  /* O aviso que Byram põe e que se repete aqui porque é o que falha primeiro num incêndio
     de verão no Douro: a regra da largura pressupõe que não há projeção de faúlhas com
     capacidade de ignição. Com projeção, nenhuma largura destas garante o que promete. */
  if(L.some(l=>linhaBasta(l)))
    partes.push("A regra da largura pressupõe que não há projeção de faúlhas com capacidade de ignição (Byram 1959). Com projeção, nenhuma destas larguras garante o que promete.");
  return partes.join(" ");
}
