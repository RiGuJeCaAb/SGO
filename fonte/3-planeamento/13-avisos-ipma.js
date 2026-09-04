/* ================= PLANEAMENTO · avisos IPMA (art. 28.º) ================= */
let DISTRITOS_IPMA = null;
const NIVEL_AVISO = {yellow:{c:"am",n:"AMARELO"}, orange:{c:"lr",n:"LARANJA"}, red:{c:"vm",n:"VERMELHO"}};
const ORDEM_AVISO = {red:0, orange:1, yellow:2};
/**
 * Qual a área de aviso do IPMA que serve este teatro, e como se lá chegou.
 *
 * O distrito do TO **já foi determinado** por geocodificação inversa e está em
 * `meta.distrito` — é esse que vale, e é ele que aqui se procura pelo nome na lista do
 * IPMA. Até à r0081 este módulo ignorava-o e escolhia o distrito mais próximo, o que
 * está errado por construção: o ponto que o IPMA publica por distrito é o da capital, e
 * há concelhos mais perto da capital do distrito vizinho do que da sua. Moimenta da Beira
 * é de Viseu e fica mais perto de Vila Real; a aplicação mostrava os avisos de Vila Real
 * sem dizer que os tinha adivinhado.
 *
 * A proximidade fica como recurso de último caso, para quando ainda não há distrito
 * determinado, e o que sai por essa via vem marcado `presumido` — vê-se no ecrã.
 *
 * @returns {{cod:string, local:string, presumido:boolean}|null}
 */
function areaDeAviso(lista, distrito, lat, lon){
  if(!Array.isArray(lista) || !lista.length) return null;
  if(distrito){
    const d = lista.find(x=>semAcento(x.local)===semAcento(distrito));
    if(d) return {cod:d.idAreaAviso, local:d.local, presumido:false};
  }
  if(!isFinite(lat) || !isFinite(lon)) return null;
  let melhor=null, dmin=Infinity;
  lista.forEach(d=>{
    const dx=(parseFloat(d.longitude)-lon)*Math.cos(lat*Math.PI/180), dy=parseFloat(d.latitude)-lat;
    const dd=dx*dx+dy*dy; if(dd<dmin){ dmin=dd; melhor=d; }
  });
  return melhor? {cod:melhor.idAreaAviso, local:melhor.local, presumido:true} : null;
}
/**
 * O instante de uma marca temporal do IPMA, e o que dela se sabe ao certo.
 *
 * O serviço publica marcas sem designador de fuso — `2026-09-02T18:00:00` — e **não há
 * fonte consultável que diga se são UTC ou hora legal**: a `api.ipma.pt` não é alcançável
 * do ambiente onde esta revisão foi construída e nenhum documento do processo o fixa. Não
 * se escolhe uma convenção por conta própria, que seria inventar uma hora; devolve-se o
 * intervalo entre as duas leituras possíveis — UTC e hora local — e quem classifica sabe
 * que a fronteira tem margem.
 *
 * Quando a marca traz designador (`Z` ou `+01:00`) não há margem nenhuma: `min` e `max`
 * coincidem e tudo o que se segue degrada para o comportamento exato, sem alterar código.
 *
 * @returns {{min:number, max:number, fuso:boolean}|null}
 */
function instanteAviso(iso){
  const s = String(iso||"").trim();
  if(!s) return null;
  const t = s.replace(" ", "T");
  if(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(t)){
    const u = new Date(t).getTime();
    return Number.isNaN(u)? null : {min:u, max:u, fuso:true};
  }
  const local = new Date(t).getTime(), utc = new Date(t+"Z").getTime();
  if(Number.isNaN(local) || Number.isNaN(utc)) return null;
  return {min:Math.min(local,utc), max:Math.max(local,utc), fuso:false};
}
/**
 * Em que ponto do seu tempo está um aviso, no instante dado.
 *
 * Quatro estados, e a ordem dos testes importa. `findo` e `previsto` são afirmações que só
 * se fazem com a marca respetiva conhecida; `vigor` exige as duas e exige que **nenhuma
 * das leituras possíveis** o ponha fora — é a afirmação forte. O que sobra é `margem`: o
 * aviso pode estar em vigor e a incerteza do fuso não deixa dizê-lo. Um aviso a que falte
 * a marca não é descartado: um vermelho não se deita fora por lhe faltar um campo.
 */
function estadoDoAviso(ini, fim, ts){
  if(fim && fim.max < ts) return "findo";
  if(ini && ini.min > ts) return "previsto";
  if(ini && fim && ini.max <= ts && ts <= fim.min) return "vigor";
  return "margem";
}
/**
 * Separa os avisos da área pelo seu estado no instante dado.
 *
 * Até à r0081 o filtro era só `endTime >= agora`, e por isso um aviso que começava no dia
 * seguinte aparecia como estando em vigor. Um aviso previsto conta para o planeamento e
 * não conta para a manobra em curso: guarda-se, mas noutra prateleira.
 */
function triarAvisos(brutos, cod, ts){
  const out = {lista:[], previstos:[], margem:[], presumido:false};
  (Array.isArray(brutos)? brutos : []).forEach(a=>{
    if(a.idAreaAviso !== cod || a.awarenessLevelID === "green" || !NIVEL_AVISO[a.awarenessLevelID]) return;
    const ini = instanteAviso(a.startTime), fim = instanteAviso(a.endTime);
    const est = estadoDoAviso(ini, fim, ts);
    if(est === "findo") return;
    if((ini && !ini.fuso) || (fim && !fim.fuso) || !ini || !fim) out.presumido = true;
    const x = {tipo:a.awarenessTypeName, nivel:a.awarenessLevelID, ini:a.startTime||"", fim:a.endTime||"",
               est, txt:String(a.text||"").slice(0,220)};
    (est==="vigor"? out.lista : est==="previsto"? out.previstos : out.margem).push(x);
  });
  const porNivel = (a,b)=>ORDEM_AVISO[a.nivel]-ORDEM_AVISO[b.nivel];
  out.lista.sort(porNivel); out.previstos.sort(porNivel); out.margem.sort(porNivel);
  return out;
}
/**
 * O instante de um aviso na forma curta que cabe no chip: «30/08 18h».
 *
 * Sem designador de fuso não se converte nada — mostram-se os algarismos tal como o
 * serviço os publicou, que é a única coisa que se sabe ao certo. Converter exigiria saber
 * a convenção, e é precisamente essa que falta. Com designador, formata-se na hora do
 * posto, que é a que quem lê tem no relógio.
 */
function fmtAvisoT(iso){
  const s = String(iso||"").trim().replace(" ", "T");
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s);
  if(!m) return s.slice(0,16);
  if(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)){
    const d = new Date(s);
    return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+" "+String(d.getHours()).padStart(2,"0")+"h";
  }
  return m[3]+"/"+m[2]+" "+m[4]+"h";
}
/**
 * Traz os avisos do IPMA em vigor para o distrito do teatro.
 *
 * @param {boolean} [silencioso] não dizer nada quando falta coordenada; é o modo em que
 *   corre junto com a previsão, sem interromper quem está a fazer outra coisa
 */
async function obterAvisos(silencioso){
  const lat = parseFloat($("o-lat").value.replace(",",".")), lon = parseFloat($("o-lon").value.replace(",","."));
  const el = $("avisos-ipma");
  if(Number.isNaN(lat)||Number.isNaN(lon)){ if(!silencioso){ el.innerHTML='<div class="av-box"><span class="avt">Avisos IPMA</span><span class="hint" style="margin:0">Sem coordenadas na ocorrência — preenche-as em Comando.</span></div>'; } return; }
  try{
    if(!DISTRITOS_IPMA){
      const rd = await fetchT("https://api.ipma.pt/open-data/distrits-islands.json", {}, 8000);
      if(!rd.ok) throw "HTTP "+rd.status;
      DISTRITOS_IPMA = (await rd.json()).data;
    }
    const area = areaDeAviso(DISTRITOS_IPMA, O.meta.distrito, lat, lon);
    if(!area) throw "sem área de aviso para o ponto";
    const ra = await fetchT("https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json", {}, 8000);
    if(!ra.ok) throw "HTTP "+ra.status;
    const t = triarAvisos(await ra.json(), area.cod, agora());
    O.avisos = {distrito:area.local, cod:area.cod, porProximidade:area.presumido, g:gdhAgora(),
                lista:t.lista, previstos:t.previstos, margem:t.margem, semFuso:t.presumido};
    pintarAvisos();
    fita("Avisos IPMA consultados — distrito "+area.local
      +(area.presumido? " (presumido por proximidade; o distrito do TO ainda não está determinado)":"")+": "
      +(t.lista.length? t.lista.map(a=>a.tipo+" "+NIVEL_AVISO[a.nivel].n).join("; ") : "sem avisos acima de verde em vigor")
      +(t.margem.length? " · "+t.margem.length+" por confirmar" : "")
      +(t.previstos.length? " · "+t.previstos.length+" previsto(s)" : ""));
    persistir(false);
  }catch(e){
    if(!silencioso) el.innerHTML='<div class="av-box"><span class="avt">Avisos IPMA</span><span class="hint" style="margin:0">Indisponíveis ('+esc(String(e).slice(0,50))+') — consultar ipma.pt.</span></div>';
  }
}
/* O estado escreve-se no chip por palavras, e não só pela cor do traço: quem lê a correr
   não deve ter de distinguir um tracejado de um contínuo para saber se o aviso já conta. */
const QUALIFICA_AVISO = {vigor:"", previsto:"previsto · ", margem:"por confirmar · "};
/** Um chip de aviso, com o nível na cor e o intervalo por baixo do rótulo. */
function chipAviso(a, classe){
  return '<span class="av-c '+NIVEL_AVISO[a.nivel].c+(classe? " "+classe:"")+'" title="'+esc(a.txt)+'">'
    +esc(a.tipo)+' — '+NIVEL_AVISO[a.nivel].n
    +'<small>'+esc(QUALIFICA_AVISO[a.est]||"")
    +(a.est==="previsto"? "de "+esc(fmtAvisoT(a.ini)) : "até "+esc(fmtAvisoT(a.fim)))+'</small></span>';
}
/** Mostra os avisos guardados, ou o convite a consultá-los quando ainda não há nenhum. */
function pintarAvisos(){
  const el = $("avisos-ipma"); if(!el) return;
  const A = O.avisos;
  if(!A){ el.innerHTML='<div class="av-box"><span class="avt">Avisos IPMA</span><span class="hint" style="margin:0">Obtidos automaticamente com a previsão, para o distrito do TO.</span><button class="av-atual" onclick="obterAvisos(false)">Consultar agora</button></div>'; return; }
  const vigor = A.lista||[], margem = A.margem||[], previstos = A.previstos||[];
  const chips = vigor.length
    ? '<span class="av-chips">'+vigor.map(a=>chipAviso(a, "")).join("")+'</span>'
    : '<span class="av-ok">Sem avisos acima de verde em vigor.</span>';
  const extra = (margem.length? '<span class="av-chips" style="margin-left:10px">'+margem.map(a=>chipAviso(a, "marg")).join("")+'</span>':"")
    + (previstos.length? '<span class="av-chips" style="margin-left:10px">'+previstos.map(a=>chipAviso(a, "prev")).join("")+'</span>':"");
  const notas = [];
  if(A.porProximidade) notas.push("Distrito presumido pelo ponto de referência mais próximo do IPMA, que é o da capital de distrito — pode não ser o do teatro. Determina-o pelas coordenadas em Comando.");
  if(margem.length) notas.push("Os avisos «por confirmar» têm início ou fim dentro da margem do fuso: podem já estar em vigor. Confirmar em ipma.pt.");
  if(previstos.length) notas.push("Os avisos «previstos» ainda não começaram; contam para o planeamento do turno seguinte, não para a manobra em curso.");
  if(A.semFuso) notas.push("As horas são as que o serviço publica, sem conversão: as marcas do IPMA não declaram fuso horário e a convenção não está confirmada em fonte.");
  /* A marca de presunção fica fora do rótulo: dentro dele apanha o `text-transform` e
     «VILA REAL PRESUMIDO» lê-se como se fosse o nome do distrito. */
  el.innerHTML = '<div class="av-box"><span class="avt">Avisos IPMA · '+esc(A.distrito)
    +' <small style="font-family:var(--mono);font-weight:500">('+esc(A.g)+')</small></span>'
    +(A.porProximidade? '<span class="pend" style="margin-right:10px">distrito presumido</span>':"")+chips+extra
    +'<button class="av-atual" onclick="obterAvisos(false)">Atualizar</button>'
    +notas.map(n=>'<div class="hint" style="margin:8px 0 0 0">'+esc(n)+'</div>').join("")+'</div>';
}
window.obterAvisos = obterAvisos;
