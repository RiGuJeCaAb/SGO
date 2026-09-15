/* ================= COMANDO · postos de trabalho e ocupações (art. 15.º) =================
   Etapa 2 da ordem de construção do contrato do serviço da VCOC, v0.2, secção 4. É a única
   que não depende de servidor nenhum: só o modelo e o seu registo, para ele se provar no
   terreno antes de se lhe pendurar criptografia.

   **Três objetos, e a ordem entre eles é o que faz a cadeia.** O posto de trabalho é um
   lugar na estrutura do posto de comando, e não uma pessoa nem uma máquina: um por célula,
   mais o do comando, que é o do COS. A ocupação é quem lá está entre dois instantes, e é o
   que a rendição muda — o mesmo portátil passa de mão em mão ao longo do turno, e o posto
   fica. O ato é o que se regista, e pertence à ocupação que estava aberta no seu GDH.

   **Porque é que a sessão não chegava.** Uma sessão que dura o turno todo não distingue as
   três pessoas que se sentaram ali. O que o processo precisa de saber não é «quem tem esta
   aplicação aberta», é «quem respondia por este lugar às 14h30».

   **Chama-se «posto de trabalho» e não «posto»** porque no ecrã «posto» já é a patente de
   quem regista — Cmdt, Adj. —, e duas coisas com o mesmo nome no mesmo cartão é como se
   perde uma delas. O contrato chama-lhe posto; aqui vai por extenso.

   **A identidade do posto é configuração deste dispositivo**, como o tema e o serviço de
   carta, e não viaja com a ocorrência: é o portátil que está na célula de Operações, não a
   ocorrência. As ocupações são facto operacional, vivem em `O.ocupacoes` e vão com o
   registo para o processo, que é o que as torna úteis.

   **O que isto ainda não faz é assinar**, e o contrato diz porquê: assinar dentro do
   navegador obriga a servir a aplicação de uma origem, e a Estação abre de `file://`. O
   modelo fica feito e a assinatura entra por cima dele quando houver VCOC. Enquanto não
   houver, uma ocupação é declarada e não provada — as mesmas palavras da identidade. */

const POSTO_CHAVE = "peaapp:posto";
/** A chave do posto de trabalho declarado neste dispositivo; vazia enquanto não houver. */
let POSTO_LOCAL = "";

/**
 * Os postos de trabalho de um posto de comando: um por célula, e o do comando é o do COS.
 *
 * Deriva de `CELULAS_PCO()` de propósito, em vez de ser lista própria: os lugares da
 * estrutura são os que a lei fixa, e uma segunda lista divergiria da primeira no dia em
 * que a estrutura mudasse.
 */
function POSTOS_PCO(){
  return CELULAS_PCO().map(c => ({ k:c.k, n:c.n, r:c.r,
    d: c.k === "comando" ? "COS, coordenador do posto de comando e adjuntos"
                         : "Célula de " + c.n }));
}

/** O posto de trabalho declarado neste dispositivo, ou nulo. */
function postoLocal(){ return POSTOS_PCO().find(p => p.k === POSTO_LOCAL) || null; }

/** Repõe o posto declarado neste dispositivo. Uma chave que já não exista cai no vazio. */
async function carregarPostoLocal(){
  try{ const r = await ARMAZEM.get(POSTO_CHAVE); POSTO_LOCAL = String((r && r.value) || ""); }
  catch(e){ POSTO_LOCAL = ""; }
  if(!postoLocal()) POSTO_LOCAL = "";
  return POSTO_LOCAL;
}

/** A lista de ocupações da ocorrência, com omissão segura. Só cresce: fechar não é apagar. */
function ocupacoes(){
  if(!Array.isArray(O.ocupacoes)) O.ocupacoes = [];
  return O.ocupacoes;
}

/** A ocupação aberta de um posto de trabalho, ou nula. Um posto tem uma aberta, no máximo. */
function ocupacaoAberta(k){ return ocupacoes().find(o => o.p === k && !o.ate) || null; }

/**
 * O nome de quem ocupa, composto como se escreve num processo.
 *
 * A patente e o nome ficam guardados em campos separados, e não numa cadeia só já junta:
 * é o que o serviço vai querer quando houver contas, e é o que evita guardar a patente
 * duas vezes — dentro do nome e ao lado dele — para depois divergirem.
 */
function nomeDaOcupacao(o){ return [o.g, o.nome].filter(Boolean).join(" "); }

/** Como se escreve uma ocupação numa linha de registo. */
function descreverOcupacao(o){
  const p = POSTOS_PCO().find(x => x.k === o.p);
  return (p ? p.n : o.p) + " · " + nomeDaOcupacao(o);
}

/**
 * Fecha a ocupação aberta de um posto, com o instante e a razão.
 *
 * Não apaga nem reescreve: põe o `ate`. O histórico de um posto é a cadeia de custódia do
 * lugar, e uma cadeia com um elo apagado não prova nada.
 *
 * @returns {object|null} a ocupação fechada, ou nulo se não havia nenhuma aberta
 */
function fecharOcupacao(k, porque, g){
  const o = ocupacaoAberta(k); if(!o) return null;
  if(encerrada()) return null;
  o.ate = g || gdhAgora();
  if(porque) o.fim = String(porque);
  fita("Ocupação fechada: " + descreverOcupacao(o) + " até " + o.ate
    + (porque ? " (" + porque + ")" : ""));
  return o;
}

/**
 * Abre a ocupação do posto declarado neste dispositivo para quem está ao teclado.
 *
 * **Sem posto declarado não há ocupação**, e a aplicação continua como sempre esteve: o ato
 * leva o nome de quem regista e mais nada. Sem ninguém ao teclado também não há: uma
 * ocupação sem ocupante é uma linha por preencher a fingir de prova.
 *
 * Se o posto já tinha ocupação aberta de outra pessoa, fecha-a no mesmo instante em que
 * abre esta. É a rendição vista do lado do lugar, e é o que dá a cadeia sem buracos.
 *
 * @returns {object|null} a ocupação aberta, ou nulo quando não há o que abrir
 */
function abrirOcupacao(){
  const p = postoLocal(); if(!p || !haSessao()) return null;
  /* Num registo encerrado não entram factos novos, e uma ocupação é um facto. */
  if(encerrada()) return null;
  const g = gdhAgora();
  const nome = String(SESSAO.nome || "").trim(), patente = String(SESSAO.posto || "").trim();
  const atual = ocupacaoAberta(p.k);
  if(atual && atual.nome === nome && atual.g === patente && atual.perfil === SESSAO.perfil) return atual;
  if(atual) fecharOcupacao(p.k, "rendido por " + quemRegista(), g);
  const o = { id: "o" + agora().toString(36), p: p.k, nome, g: patente,
    perfil: SESSAO.perfil, de: g, ate: "", fim: "" };
  ocupacoes().push(o);
  fita("Ocupação aberta: " + descreverOcupacao(o) + " desde " + g
    + " (" + perfilDe(o.perfil).n + ")");
  return o;
}

/**
 * As ocupações que estavam abertas num GDH.
 *
 * É assim que um ato sabe a que ocupação pertence, sem cada linha da fita ter de a levar
 * escrita: uma ocupação cobre um intervalo, e o ato cai dentro dele. É a mesma lógica com
 * que o contrato faz uma assinatura cobrir um intervalo.
 *
 * Devolve lista e não um só porque, no dia em que vários postos escreverem na mesma
 * ocorrência, haverá mais do que uma aberta ao mesmo tempo — e aí o ato passa a levar o
 * posto escrito, que é trabalho da consolidação do serviço. Com um dispositivo é uma ou
 * nenhuma, e a derivação é exata.
 *
 * **O intervalo é fechado à esquerda e aberto à direita:** o minuto do fecho já é do
 * seguinte. O GDH tem minutos, e a rendição e o primeiro registo de quem entra caem quase
 * sempre no mesmo — com o intervalo fechado nas duas pontas, cada uma dessas linhas saía
 * com dois nomes, e uma linha com dois responsáveis não responde a quem respondia. A
 * convenção é esta e diz-se: no minuto da rendição conta quem entrou, que é também quem
 * está a escrever. A cadeia de custódia continua a mostrar as duas ocupações inteiras.
 */
function ocupacoesEm(g){
  const d = parseGDH(g); if(!d) return [];
  const t = d.getTime();
  return ocupacoes().filter(o => {
    const de = parseGDH(o.de); if(!de || de.getTime() > t) return false;
    const ate = o.ate ? parseGDH(o.ate) : null;
    return !ate || ate.getTime() > t;
  });
}

/** Quem respondia pelo lugar num GDH, numa linha; vazio quando não há ocupação que o cubra. */
function quemEstavaEm(g){
  return ocupacoesEm(g).map(descreverOcupacao).join("; ");
}

/** A cadeia de custódia de um posto, da mais recente para a mais antiga. */
function custodiaDoPosto(k){
  return ocupacoes().filter(o => o.p === k).slice().reverse();
}

/**
 * Declara que dispositivo é este. Local, como o tema; não entra na ocorrência.
 *
 * Mudar de posto com alguém ao teclado fecha a ocupação no lugar antigo e abre no novo, em
 * vez de a deixar aberta onde já não se está. O que não se pode é ter a mesma pessoa a
 * responder por dois lugares à mesma hora.
 */
async function declararPostoLocal(k){
  const novo = POSTOS_PCO().find(p => p.k === k) || null;
  if(!novo && String(k||"").trim()) return { ok:false, motivo:"Esse posto de trabalho não existe na estrutura do PCO." };
  const antigo = postoLocal();
  if(antigo && (!novo || novo.k !== antigo.k)) fecharOcupacao(antigo.k, "o dispositivo mudou de posto de trabalho");
  POSTO_LOCAL = novo ? novo.k : "";
  try{ await ARMAZEM.set(POSTO_CHAVE, POSTO_LOCAL); }catch(e){}
  fita(novo ? "Posto de trabalho deste dispositivo: " + novo.n
            : "Posto de trabalho deste dispositivo: por declarar");
  if(novo) abrirOcupacao();
  return { ok:true, posto:novo };
}

/**
 * Desenha o cartão do posto de trabalho e a cadeia de custódia de cada lugar.
 *
 * O lugar no cabeçalho é a etiqueta de quem está ao teclado, que `pintarSessao` compõe: são
 * a mesma pergunta em duas metades, e uma quinta caixa no grupo do estado espremia as
 * outras.
 */
function pintarPostos(){
  const p = postoLocal(), aberta = p ? ocupacaoAberta(p.k) : null;
  const sel = $("ptb-qual"); if(!sel) return;
  if(!sel.options.length){
    sel.innerHTML = '<option value="">por declarar</option>'
      + POSTOS_PCO().map(x => '<option value="' + esc(x.k) + '">' + esc(x.n) + '</option>').join("");
  }
  sel.value = POSTO_LOCAL;

  const q = $("ptb-quem");
  if(q) q.value = aberta ? nomeDaOcupacao(aberta) + " · desde " + aberta.de
                         : (p ? "sem ninguém ao teclado" : "sem posto declarado");

  const e = $("ptb-estado");
  if(e){
    e.textContent = !p
      ? "Sem posto de trabalho declarado. As ocupações não se registam, e cada ato continua a levar o nome de quem está ao teclado e mais nada."
      : aberta
        ? "Este dispositivo é o posto de " + p.n + ". " + nomeDaOcupacao(aberta) + " responde por ele desde " + aberta.de + "."
        : "Este dispositivo é o posto de " + p.n + ", sem ocupação aberta. Assumir o teclado em «Quem regista» abre-a.";
    e.style.color = p ? "" : "var(--terra)";
  }

  const L = $("ptb-lista"); if(!L) return;
  const blocos = POSTOS_PCO().map(x => {
    const h = custodiaDoPosto(x.k);
    if(!h.length) return "";
    return '<div class="sub"><span class="stit">' + esc(x.n) + "</span>"
      + h.map(o => '<div class="mono-sm">' + esc(o.de) + " a " + esc(o.ate || "aberta")
        + " · <b>" + esc(nomeDaOcupacao(o)) + "</b> · "
        + esc(perfilDe(o.perfil).n) + (o.fim ? " · " + esc(o.fim) : "") + "</div>").join("")
      + "</div>";
  }).filter(Boolean);
  L.innerHTML = blocos.length ? blocos.join("")
    : '<p class="hint" style="margin:0">Ainda não há ocupações registadas nesta ocorrência.</p>';
}

