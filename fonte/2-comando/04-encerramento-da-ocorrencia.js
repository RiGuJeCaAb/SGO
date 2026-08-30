/* ================= COMANDO · encerramento do registo da ocorrência =================
   Encerrar é ato de comando — art. 8.º, n.º 2 — e o registo temporal da ocorrência tem
   de ser explícito e completo, art. 2.º, al. c). O encerramento carimba o fim, fecha o
   registo à escrita e deixa prova de quem o determinou.

   **O que isto não é:** não encerra a ocorrência no SADO nem em plataforma nenhuma. A
   Estação não fala com o SADO, e dizer o contrário seria mentir ao oficial. Encerra-se
   aqui o registo que aqui se fez.

   O fecho à escrita é o que uma aplicação de uma página pode dar: os campos ficam
   inertes e os dois caminhos que escrevem factos operacionais — a mudança de estado de
   setor e o registo de evolução — recusam. Não é selo criptográfico; é a diferença entre
   alterar por engano e alterar de propósito, que num processo é o que importa. A
   reabertura é sempre possível, e regista-se como o encerramento. */

/**
 * O que impede o encerramento, e o que apenas o desaconselha.
 *
 * Impedem: não haver ocorrência, e haver setor em curso ou reativado — não se encerra
 * o registo de um incêndio que ainda arde. Desaconselham: obrigações de conformidade
 * em incumprimento e missões por fechar, que ficam no processo como ficaram.
 *
 * @returns {{pode:boolean, impedimentos:string[], reservas:string[]}}
 */
function verificarEncerramento(){
  const impedimentos = [], reservas = [];
  if(!O.meta.num) impedimentos.push("Não há ocorrência carregada.");

  const S = cargaDosSetores(), ativos = S.filter(s=>s.ativo);
  if(ativos.length){
    impedimentos.push(ativos.length+(ativos.length===1? " setor está":" setores estão")
      + " em curso ou reativado: " + ativos.map(s=>s.nome+" ("+s.estado+")").join(", ")
      + ". Não se encerra o registo de uma ocorrência com frente ativa.");
  }

  const don = (()=>{ try{ return verificacoesDON(); }catch(e){ return []; } })();
  const ob = don.filter(x=>x.n==="ob");
  if(ob.length) reservas.push(ob.length+(ob.length===1? " obrigação legal fica em incumprimento no processo: "
    : " obrigações legais ficam em incumprimento no processo: ")+ob.map(x=>x.t).join("; ")+".");

  const pv = (()=>{ try{ return peaVigor(); }catch(e){ return null; } })();
  const abertas = pv && (pv.ctrl||[]).filter(x=>!x.estado);
  if(abertas && abertas.length) reservas.push(abertas.length
    +(abertas.length===1? " missão do PEA n.º ":" missões do PEA n.º ")+pv.n+" continuam sem estado.");

  const R = (()=>{ try{ return rendicoes(); }catch(e){ return []; } })();
  const venc = R.filter(x=>x.nivel==="r");
  if(venc.length) reservas.push(venc.length+(venc.length===1? " meio está":" meios estão")
    +" com o tempo de empenhamento excedido à hora do encerramento.");

  return { pode: !impedimentos.length, impedimentos, reservas };
}

/**
 * Encerra. Carimba o GDH, quem determinou e a nota, e deixa registo na evolução e na
 * fita — a mesma disciplina de qualquer outro facto operacional.
 *
 * @param {string} por quem determinou o encerramento
 * @param {string} [nota]
 * @param {number} [ts] instante; sem ele, o relógio corrente
 */
async function encerrarOcorrencia(por, nota, ts){
  const v = verificarEncerramento();
  if(!v.pode) return { ok:false, motivo:v.impedimentos.join(" ") };
  if(encerrada()) return { ok:false, motivo:"A ocorrência já está encerrada." };

  if(!podeFazer("encerrar")) return { ok:false, motivo:motivoPerfil("encerrar") };
  const quem = String(por||"").trim();
  if(!quem) return { ok:false, motivo:"Indicar quem determina o encerramento." };

  const E = encObj();
  E.g = gdhDe(ts==null? agora() : ts);
  E.por = quem;
  E.nota = String(nota||"").trim();


  /* As reservas ficam mesmo no processo, e não só na frase que diz que ficam: entram
     no registo de evolução do encerramento, que é o que sobrevive à sessão e vai no
     PEA. Contá-las na fita seria contar mensagens, não o que elas descrevem. */
  O.evolucao.push({g:E.g, tipo:"decisao",
    txt:"Encerramento do registo da ocorrência determinado por "+quem+(E.nota? " — "+E.nota : "")
      + (v.reservas.length? " · Reservas ao encerramento: "+v.reservas.join(" ") : "")});
  fita("Ocorrência encerrada por "+quem+" · "+E.g
    + (v.reservas.length? " · com reservas, registadas na evolução" : " · sem reservas"));

  /* Carimbo de integridade do que fica fechado. A ordem aqui custou duas tentativas, e
     a razão é a mesma das duas vezes: **tudo o que escreve no estado tem de estar escrito
     antes de se carimbar**. Da primeira pus o carimbo antes do registo de evolução e da
     fita; da segunda, antes de `persistir`, que chama `lerForm()` e `pintarTudo()` — e
     estes assentam campos derivados. Em ambos os casos o carimbo acusava alteração no
     instante seguinte ao encerramento.
     Agora: deixa-se o estado assentar, carimba-se, e grava-se o carimbo sem voltar a
     passar por `persistir`, que tornaria a mexer no que se acabou de carimbar. Nada é
     escrito depois — nem uma linha de fita a anunciar o número, que se invalidava a si
     própria. O número mostra-se no cartão. */
  await persistir(false);
  E.sha = "";
  E.sha = resumoEstado(O);
  try{ await ARMAZEM.set(chave(), JSON.stringify(O)); }catch(e){}
  pintarEncerramento();
  return { ok:true, reservas:v.reservas };
}

/** Reabre. Uma reativação depois do encerramento acontece, e tem de caber. */
async function reabrirOcorrencia(por, motivo){
  if(!encerrada()) return { ok:false, motivo:"A ocorrência não está encerrada." };
  const quem = String(por||"").trim();
  if(!quem) return { ok:false, motivo:"Indicar quem determina a reabertura." };
  const E = encObj(), fechada = E.g, carimbo = E.sha;
  E.g = ""; E.por = ""; E.nota = ""; E.sha = "";
  O.evolucao.push({g:gdhAgora(), tipo:"agravamento",
    txt:"Reabertura do registo, encerrado a "+fechada
      +(carimbo? " com o carimbo "+resumoCurto(carimbo) : "")+", determinada por "+quem
      +(String(motivo||"").trim()? " — "+String(motivo).trim() : "")});
  fita("Ocorrência reaberta por "+quem+" (estava encerrada desde "+fechada+")");
  await persistir(false);
  return { ok:true };
}

/* ================= fecho à escrita =================
   Encerrar fecha **o registo desta ocorrência**, e mais nada. O que não escreve nesta
   ocorrência continua a funcionar, e o que leva a outra também: uma ocorrência encerrada
   é exatamente o momento em que se começa a seguinte.

   A lista do que fica livre estava escrita por identificador e **três dos que lá estavam
   já não existiam** — `b-exp-occ`, `b-imp-occ` e `b-imprimir`. Ninguém dava por isso,
   porque um identificador que não corresponde a nada não dá erro: apenas não isenta
   ninguém. Exportar e importar ficavam bloqueados com a ocorrência fechada, que é quando
   mais fazem falta, e o comentário por cima da lista dizia o contrário. Faltavam, além
   disso, começar uma ocorrência nova, abrir outra do arquivo, assumir o teclado e ver o
   mapa — tudo bloqueado sem que nada o justificasse.

   Passa a ser registo declarado, cada entrada com a razão de ficar de fora, e
   `auditarFechoDeEscrita` recusa um identificador que não exista. É o mesmo princípio do
   registo de posse e do da arrumação: um registo que aponta para o que não existe é
   defeito visível.

   Os controlos criados em tempo de execução não têm identificador fixo e declaram-se com
   `data-enc-livre` no próprio elemento. */
const ENC_LIVRES = [
  { id:"b-tema",        porque:"o tema é de quem olha, não da ocorrência" },
  { id:"b-ajuda",       porque:"ler a ajuda não altera nada" },
  { id:"b-guardar",     porque:"gravar o que está não é alterá-lo" },
  { id:"b-nova",        porque:"uma ocorrência encerrada é quando se começa a seguinte" },
  { id:"b-carregar",    porque:"abrir outra ocorrência é sair desta, não escrever nesta" },
  { id:"b-exportar",    porque:"o registo fechado é o que mais interessa exportar" },
  { id:"b-importar-b",  porque:"importar substitui a ocorrência em vez de a alterar" },
  { id:"b-importar",    porque:"o campo de ficheiro que o botão de importar aciona" },
  { id:"enc-reabrir",   porque:"sem isto o fecho não teria volta" },
  { id:"enc-por",       porque:"a reabertura exige quem a determina" },
  { id:"enc-nota",      porque:"e admite o motivo" },
  { id:"id-posto",      porque:"assumir o teclado é ato do posto, não da ocorrência" },
  { id:"id-nome",       porque:"e é preciso estar identificado para reabrir" },
  { id:"id-perfil",     porque:"e o perfil decide quem pode reabrir" },
  { id:"id-assumir",    porque:"idem" },
  { id:"id-largar",     porque:"quem larga o teclado tem de o poder largar" },
  { id:"cp-guardar",    porque:"um instantâneo não altera o que retrata" },
  { id:"cp-conferir",   porque:"conferir a cadeia do diário é leitura" },
  { id:"mapa-carregar",  porque:"ver o teatro de uma ocorrência fechada é leitura" },
  { id:"mapa-mais",      porque:"idem" },
  { id:"mapa-menos",     porque:"idem" },
  { id:"mapa-enquadrar", porque:"idem" },
  { id:"mapa-esquecer",  porque:"os mosaicos guardados são do dispositivo, não da ocorrência" }
];

/** Inerta tudo o que escreve nesta ocorrência, poupando o que está declarado acima. */
function aplicarFechoDeEscrita(){
  const fechada = encerrada();
  document.documentElement.classList.toggle("encerrada", fechada);
  const livres = ENC_LIVRES.map(x=>x.id);
  document.querySelectorAll(".card input,.card select,.card textarea,.card button")
    .forEach(el=>{
      if(livres.indexOf(el.id) >= 0 || el.closest("#c-encerramento")) return;
      if(el.hasAttribute("data-enc-livre")) return;
      if(el.hasAttribute("data-ir")) return;   /* os atalhos dos avisos continuam a levar lá */
      if(fechada) el.setAttribute("disabled", "disabled");
      else el.removeAttribute("disabled");
    });
}

/** Um identificador declarado livre que não exista não isenta ninguém — e é defeito. */
function auditarFechoDeEscrita(){
  const semControlo = ENC_LIVRES.filter(x=>!document.getElementById(x.id)).map(x=>x.id);
  const semRazao = ENC_LIVRES.filter(x=>!x.porque).map(x=>x.id);
  return { n:ENC_LIVRES.length, semControlo, semRazao };
}

/**
 * Diz em que estado está o registo: encerrado por quem e quando, ou o que falta para o
 * poder ser.
 *
 * Com o registo fechado, confere o carimbo contra o estado em memória e **diz quando não
 * bate** — um registo alterado depois de encerrado é facto que tem de aparecer.
 */
function pintarEncerramento(){
  const cx = $("enc-estado"); if(!cx) return;
  /* Quem está ao teclado é quem se propõe: escreve-se sozinho, e corrige-se se for outro
     a determinar. Um campo pré-preenchido com o nome certo poupa-o de ser preenchido com
     um nome qualquer. */
  const cPor = $("enc-por");
  if(cPor && !cPor.value.trim() && !encerrada()) cPor.value = quemRegista();
  const E = encObj();
  if(encerrada()){
    cx.className = "msg ok"; cx.style.display = "block";
    const bate = E.sha? (E.sha === (()=>{ const g=encObj(), guardado=g.sha; g.sha=""; const r=resumoEstado(O); g.sha=guardado; return r; })()) : null;
    cx.className = "msg " + (bate === false? "av" : "ok");
    cx.innerHTML = esc("Registo encerrado a "+E.g+" por "+E.por+(E.nota? " — "+E.nota : "")
      + ". O registo está fechado à escrita; para o alterar é preciso reabrir.")
      + (E.sha? "<br><span class=\"mono-sm\">Carimbo de integridade: "+esc(resumoCurto(E.sha))
        + (bate? " — confere com o registo em memória." : " — <b>não confere</b>: o registo foi alterado depois de encerrado.")+"</span>" : "");
  } else {
    const v = verificarEncerramento();
    cx.style.display = "block";
    cx.className = v.pode? (v.reservas.length? "msg av" : "msg ok") : "msg err";
    cx.textContent = v.pode
      ? (v.reservas.length? "Pode encerrar-se, com reservas: "+v.reservas.join(" ")
                          : "Pode encerrar-se: nenhum setor em curso e nada por fechar.")
      : v.impedimentos.join(" ");
  }
  const bE = $("enc-encerrar"), bR = $("enc-reabrir");
  if(bE){ bE.style.display = encerrada()? "none" : ""; bE.disabled = !verificarEncerramento().pode; }
  if(bR) bR.style.display = encerrada()? "" : "none";
  aplicarFechoDeEscrita();
}
