/* ================= OPERAÇÕES · notas no mapa =================
   A carta anotada de Cabeça Boa está cheia de frases escritas à mão sobre o traçado:
   «interdito a VFCI», «inversão de marcha», «estrada para entrada de meios», «não ardido»,
   «incêndio subterrâneo», «descarga de MA com retardantes». Nenhuma cabe num campo de
   formulário e nenhuma se deduz de coisa nenhuma — são o que quem esteve ali viu e quis
   deixar dito, no sítio onde é verdade.

   É a última coisa da carta que a aplicação não sabia fazer, e é a mais simples: texto
   numa coordenada.

   **Uma advertência sobre a classificação.** As três espécies abaixo não são doutrina e não
   se apresentam como tal: são a maneira como a nota se lê no mapa. A doutrina classifica
   pontos de água e zonas de concentração — não classifica bilhetes que alguém escreve na
   margem de uma carta. Distinguem-se por uma razão prática e uma só: uma nota que restringe
   ou avisa tem consequência para a segurança de quem lá vai, e tem de saltar à vista antes
   de uma que apenas regista. */

/**
 * As espécies de nota, pela consequência que têm e não por doutrina nenhuma.
 *
 * `alerta` diz se a nota entra na leitura da evolução quando cai no caminho da frente: um
 * aviso à frente do fogo é decisão; uma observação de que aquilo não ardeu não é.
 */
const TIPOS_NOTA = [
  { k:"aviso",  n:"Aviso ou restrição", d:"Interdições, perigos, o que limita quem lá vai", cor:"#B00000", alerta:true },
  { k:"manobra", n:"Manobra",           d:"Entradas, saídas, itinerários, o que fazer ali",  cor:"#1F4E79", alerta:false },
  { k:"obs",    n:"Observação",         d:"O estado do terreno e o que já se fez",           cor:"#5A5A5A", alerta:false }
];

/** A definição de uma espécie de nota. O que não se reconhece cai em «observação». */
function defNota(k){ return TIPOS_NOTA.find(t=>t.k === k) || TIPOS_NOTA[2]; }

/** A lista de notas do teatro, criada à primeira vez que faz falta. */
function notasLista(){
  if(!Array.isArray(O.dados.notas)) O.dados.notas = [];
  return O.dados.notas;
}

/** Quantos caracteres cabem numa nota. */
const NOTA_MAX = 120;

/**
 * Escreve uma nota numa coordenada do mapa.
 *
 * O texto é obrigatório: uma nota vazia é um ponto sem informação, e o mapa já tem tipos de
 * ponto para marcar sítios. O limite de comprimento não é decoração — o que se desenha sobre
 * uma carta tem de caber sobre ela, e uma nota que precise de três linhas é um registo de
 * evolução e não uma anotação.
 */
function escreverNota(tipo, lat, lon, txt){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de anotar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const t = String(txt||"").trim().replace(/\s+/g, " ");
  if(!t) return { ok:false, motivo:"Uma nota sem texto não diz nada. Escreve o que há a dizer ali." };
  if(!Number.isFinite(lat) || !Number.isFinite(lon)) return { ok:false, motivo:"Coordenada inválida." };
  const d = defNota(tipo);
  const nota = {
    id:"nt"+Date.now().toString(36),
    tipo:d.k,
    txt:t.slice(0, NOTA_MAX),
    lat:+lat.toFixed(6), lon:+lon.toFixed(6),
    setor:(()=>{ const i = setorDoPonto(lat, lon); return i >= 0 ? NOMES_SETOR[i] : ""; })(),
    g:gdhAgora(), por:quemRegista()
  };
  notasLista().push(nota);
  O.evolucao.push({ g:nota.g, tipo:"posit",
    txt:d.n+" no mapa"+(nota.setor? ", setor "+nota.setor : "")+": «"+nota.txt+"»." });
  fita(d.n+": "+nota.txt);
  return { ok:true, nota };
}

/** Retira uma nota. O terreno muda, e uma nota que deixou de ser verdade sai da carta. */
function apagarNota(id){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de alterar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const L = notasLista(), i = L.findIndex(x=>x.id === id);
  if(i < 0) return { ok:false, motivo:"Nota não encontrada." };
  const [x] = L.splice(i, 1);
  O.evolucao.push({ g:gdhAgora(), tipo:"posit", txt:"Retirada a nota «"+x.txt+"»." });
  return { ok:true, nota:x };
}

/** As notas que avisam de alguma coisa. São estas que entram na leitura da evolução. */
function avisosNoMapa(){ return notasLista().filter(x=>defNota(x.tipo).alerta); }
