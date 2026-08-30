/* ================= LOGÍSTICA · solicitação de rendição (art. 33.º) =================
   A rendição pede-se ao CSREPC **por veículo**, indicando o número de elementos, o meio
   que entra, a hora de saída e a hora prevista de chegada ao destino — DON n.º 2, ponto
   7.e.(5)(r). Até aqui a aplicação media o tempo de cada unidade e dizia quando a
   rendição era devida; o pedido em si acontecia fora dela e não deixava rasto.

   Passa a deixar. O medidor de tempo de cada unidade é o sítio por onde se pede: quem
   vê a laranja quase vazia é quem tem de agir, e é aí que a ação tem de estar. O pedido
   fica registado na unidade, na evolução e na fita, com quem o determinou e a que horas —
   e a aplicação compõe o texto a transmitir, para não se transmitir de cabeça.

   **Pedir não é render.** O que fica registado é a solicitação; a substituição em si
   regista-se quando acontecer, movendo ou desmobilizando a unidade como sempre. */

/** O ramo da rendição de uma unidade, com omissão segura. */
function rendObj(it){
  if(!it.rend || typeof it.rend !== "object") it.rend = {};
  return preencher(it.rend, { g:"", por:"", nota:"" });
}
/** Foi pedida a rendição desta unidade? */
function rendPedida(it){ return !!(it && it.rend && it.rend.g); }

/**
 * Localiza uma unidade pelo endereço que os botões carregam.
 *
 * @param {string} alvo `s:<setor>:<unidade>` ou `a:<índice>` para um meio aéreo
 */
function unidadeDe(alvo){
  const p = String(alvo||"").split(":");
  if(p[0] === "a"){
    const a = aerLista()[+p[1]];
    return a? { it:a, onde:"Meios aéreos", nome:(a.ind||a.t)+(a.ind? " ("+a.t+")":""), aereo:true } : null;
  }
  const e = estObj(), s = e.setores[+p[1]];
  const it = s && (s.tip||[])[+p[2]];
  if(!it) return null;
  const d = catDef(it.t);
  return { it, onde:"Setor "+NOMES_SETOR[+p[1]], nome:it.t+(it.ent? " · "+it.ent : ""),
    aereo:!!(it.ar || d.ar), setor:+p[1] };
}

/**
 * O texto do pedido, na forma em que se transmite ao CSREPC.
 *
 * Composto e não escrito de cabeça: o que a norma manda indicar está todo cá, e a hora
 * prevista de rendição sai do limiar em vigor, não de uma estimativa.
 */
function textoPedidoRendicao(alvo){
  const u = unidadeDe(alvo); if(!u) return "";
  const L = limiares(), teto = u.aereo? L.aer : L.lim;
  const h = u.it.ts? (agora() - u.it.ts)/3600000 : 0;
  const limite = u.it.ts? gdhDe(u.it.ts + teto*3600000) : "—";
  return "Solicitação de rendição ao CSREPC — ocorrência " + (O.meta.num||"sem número")
    + (O.meta.local? ", "+O.meta.local : "") + ". "
    + u.nome + ", " + u.onde + (u.it.ou? ", "+u.it.ou+" operacionais" : "")
    + ". No TO desde " + (u.it.ts? gdhDe(u.it.ts) : "hora por registar")
    + " (" + fmtH(h) + " de empenhamento; limite de " + teto + " h às " + limite + ")."
    + " Solicita-se meio de substituição, indicando-se a hora de saída do TO e a hora"
    + " prevista de chegada ao destino logo que o meio que rende esteja atribuído.";
}

/**
 * Regista a solicitação de rendição de uma unidade.
 *
 * @param {string} alvo endereço da unidade
 * @param {{por?:string, nota?:string, g?:string}} [quem]
 */
function solicitarRendicao(alvo, quem){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de solicitar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const u = unidadeDe(alvo);
  if(!u) return { ok:false, motivo:"Unidade não encontrada." };
  if(rendPedida(u.it)) return { ok:false, motivo:"A rendição desta unidade já foi solicitada a "+u.it.rend.g+"." };

  const g = String((quem&&quem.g)||"").trim() || gdhAgora();
  if(!parseGDH(g)) return { ok:false, motivo:motivoGDH(g) };
  const por = String((quem&&quem.por)||"").trim() || quemRegista();

  const r = rendObj(u.it);
  r.g = g; r.por = por; r.nota = String((quem&&quem.nota)||"").trim();

  const texto = textoPedidoRendicao(alvo);
  O.evolucao.push({ g, tipo:"meios",
    txt:"Rendição solicitada ao CSREPC: " + u.nome + " (" + u.onde + ")"
      + (por? ", por "+por : "") + (r.nota? " — "+r.nota : "") + "." });
  fita("Rendição solicitada ao CSREPC: "+u.nome+" ("+u.onde+")");
  return { ok:true, texto, unidade:u };
}

/** Desfaz a solicitação — porque um pedido pode ser retirado, e isso também é facto. */
function retirarSolicitacaoRendicao(alvo){
  const u = unidadeDe(alvo);
  if(!u || !rendPedida(u.it)) return { ok:false, motivo:"Não há solicitação para retirar." };
  const antes = u.it.rend.g;
  u.it.rend = { g:"", por:"", nota:"" };
  O.evolucao.push({ g:gdhAgora(), tipo:"meios",
    txt:"Retirada a solicitação de rendição de " + u.nome + " (" + u.onde + "), pedida a " + antes + "." });
  fita("Retirada a solicitação de rendição: "+u.nome);
  return { ok:true };
}

/**
 * As unidades com rendição pedida, e as que já passaram o limite sem pedido nenhum.
 *
 * É esta segunda lista que interessa a quem comanda: são as que estão a trabalhar para
 * além do que a norma admite e sobre as quais ainda ninguém fez nada.
 */
function estadoDasRendicoes(ts){
  const instante = (ts==null? agora() : ts);
  const L = limiares(), e = estObj();
  const pedidas = [], porPedir = [];
  const ver = (it, alvo, onde, nome, aereo)=>{
    if(!it.ts) return;
    const teto = aereo? L.aer : L.lim;
    const h = (instante - it.ts)/3600000;
    const linha = { alvo, onde, nome, h, teto, excedido:h>=teto, g:(it.rend&&it.rend.g)||"" };
    if(rendPedida(it)) pedidas.push(linha);
    else if(h >= teto) porPedir.push(linha);
  };
  (e.setores||[]).forEach((x,i)=>(x.tip||[]).forEach((it,j)=>{
    const d = catDef(it.t);
    ver(it, "s:"+i+":"+j, "Setor "+NOMES_SETOR[i], it.t+(it.ent? " · "+it.ent : ""), !!(it.ar||d.ar));
  }));
  aerLista().forEach((a,j)=>ver(a, "a:"+j, "Meios aéreos", (a.ind||a.t)+(a.ind? " ("+a.t+")":""), true));
  return { pedidas, porPedir };
}

/** Repinta os sítios onde os medidores vivem, para a marca do pedido aparecer. */
function repintarMedidores(){
  try{ renderSetores(); }catch(e){}
  try{ renderAereos(); }catch(e){}
  try{ pintarAmpulhetas(); }catch(e){}
}

/* ---- o painel que a ampulheta abre ---- */

/** Endereço da unidade cujo painel está aberto. Vazio quando não há nenhum. */
let REND_ABERTO = "";

/**
 * Abre o painel de rendição de uma unidade, com o texto do pedido já composto.
 *
 * Não pede nada sozinho: mostra o que vai ser transmitido, quem o determina e a que
 * horas, e espera. Uma solicitação ao CSREPC é um ato, não um efeito colateral de um
 * clique.
 */
function abrirRendicao(alvo){
  const cx = $("rend-painel"); if(!cx) return;
  if(!alvo || REND_ABERTO === alvo){ REND_ABERTO = ""; cx.style.display = "none"; cx.innerHTML = ""; return; }
  const u = unidadeDe(alvo); if(!u) return;
  REND_ABERTO = alvo;

  const L = limiares(), teto = u.aereo? L.aer : L.lim;
  const h = u.it.ts? (agora() - u.it.ts)/3600000 : 0;
  const jaPedida = rendPedida(u.it);
  cx.style.display = "block";
  cx.innerHTML = `<div class="sub" style="margin-top:12px">
    <span class="stit">Rendição — ${esc(u.nome)} · ${esc(u.onde)}</span>
    <p class="hint" style="margin:0 0 10px 0">No TO desde <b>${esc(u.it.ts? gdhDe(u.it.ts) : "hora por registar")}</b>,
      ${esc(fmtH(h))} de empenhamento, sobre um limite de ${teto} h.
      ${u.it.ts? "Rendição devida às <b>"+esc(gdhDe(u.it.ts + teto*3600000))+"</b>." : ""}</p>
    ${jaPedida
      ? `<p class="hint" style="margin:0 0 10px 0"><b>Solicitada a ${esc(u.it.rend.g)}</b>${u.it.rend.por? " por "+esc(u.it.rend.por):""}${u.it.rend.nota? " — "+esc(u.it.rend.nota):""}.</p>`
      : `<div class="grid g2">
           <div><label for="rd-por">Quem determina</label><input id="rd-por" placeholder="posto, nome e apelido" value="${esc(quemRegista())}"></div>
           <div><label for="rd-g">GDH do pedido</label><input id="rd-g" placeholder="vazio = agora"></div>
         </div>
         <div style="margin-top:10px"><label for="rd-nota">Nota</label><input id="rd-nota" placeholder="opcional — condicionantes, meio pretendido"></div>`}
    <div style="margin-top:12px"><label for="rd-txt">Texto a transmitir ao CSREPC</label>
      <textarea id="rd-txt" rows="4" readonly>${esc(textoPedidoRendicao(alvo))}</textarea></div>
    <div class="row" style="margin-top:12px">
      ${jaPedida
        ? '<button class="btn btn-r" type="button" id="rd-retirar">Retirar a solicitação</button>'
        : '<button class="btn btn-o" type="button" id="rd-pedir">Registar a solicitação ao CSREPC</button>'}
      <button class="btn btn-b" type="button" id="rd-copiar">Copiar o texto</button>
      <button class="btn btn-b" type="button" id="rd-fechar">Fechar</button>
    </div>
    <div class="msg" id="rd-msg" style="display:none"></div>
  </div>`;

  const bP = $("rd-pedir");
  if(bP) bP.addEventListener("click", ()=>{
    const q = gdhDoCampo("rd-g", "rd-msg");
    if(!q.ok) return;
    const r = solicitarRendicao(alvo, { por:$("rd-por").value, nota:$("rd-nota").value,
      g:($("rd-g").value.trim()? q.g : "") });
    if(!r.ok){ aviso("rd-msg","err",r.motivo); return; }
    persistir(false);
    /* O medidor tem de passar a dizer que a rendição já foi pedida: quem olha para o
       chip a seguir não pode ver o mesmo que via antes de a pedir. */
    repintarMedidores();
    abrirRendicao(""); abrirRendicao(alvo);
    aviso("rd-msg","ok","Solicitação registada. Transmitir o texto ao CSREPC.");
  });
  const bR = $("rd-retirar");
  if(bR) bR.addEventListener("click", ()=>{
    const r = retirarSolicitacaoRendicao(alvo);
    if(!r.ok){ aviso("rd-msg","err",r.motivo); return; }
    persistir(false);
    repintarMedidores();
    abrirRendicao(""); abrirRendicao(alvo);
  });
  const bC = $("rd-copiar");
  if(bC) bC.addEventListener("click", async ()=>{
    const t = $("rd-txt");
    t.select();
    try{ await navigator.clipboard.writeText(t.value); aviso("rd-msg","ok","Texto copiado."); }
    catch(e){ aviso("rd-msg","ok","Texto selecionado — copiar com Ctrl+C."); }
  });
  const bF = $("rd-fechar");
  if(bF) bF.addEventListener("click", ()=>abrirRendicao(""));
  cx.scrollIntoView({block:"nearest", behavior:"smooth"});
}
