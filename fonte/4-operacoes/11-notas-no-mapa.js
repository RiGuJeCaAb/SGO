/* ================= OPERAÇÕES · notas no mapa =================
   A carta anotada de Cabeça Boa está cheia de frases escritas à mão sobre o traçado:
   «interdito a VFCI», «inversão de marcha», «estrada para entrada de meios», «não ardido»,
   «incêndio subterrâneo», «descarga de MA com retardantes». Nenhuma cabe num campo de
   formulário e nenhuma se deduz de coisa nenhuma — são o que quem esteve ali viu e quis
   deixar dito, no sítio onde é verdade.

   É a última coisa da carta que a aplicação não sabia fazer, e é a mais simples: texto
   numa coordenada.

   **Sobre a classificação.** A norma não classifica anotações de carta por gravidade, em
   lado nenhum — e a aplicação diz-o. O que a norma tem é léxico, e vem do sítio certo: o
   art. 10.º, n.º 5, al. a) do Despacho n.º 4067/2024 enumera o que o comandante de setor
   reconhece — limites, acessos, caminhos penetrantes, percursos de fuga, zonas de
   segurança, ameaças e pontos sensíveis; o art. 46.º, n.º 1, os «pontos críticos para
   reação imediata» do PEA; o art. 23.º, n.º 1, al. a), «as ações de interdição ou de
   condicionamento à circulação de vias de tráfego», que são dois graus e não um. As três
   gravidades abaixo são a arrumação desse léxico pela consequência para quem lá vai, e são
   construção do ramo #006 (d02) adotada por decisão de 5 de setembro. As citações
   foram conferidas no texto do despacho e da DON n.º 2 (Anexo 3, situações 3 e 17). */

/**
 * As três gravidades de uma nota, do que decide para o que regista.
 *
 * `alerta` diz se a nota entra na leitura da evolução quando cai no caminho da frente. A
 * gravidade 1 alerta sempre: uma zona de segurança no caminho da frente deixa de ser zona
 * de segurança, e é a anotação mais decisiva que há numa carta de incêndio — o E e o S do
 * LACES, e a situação n.º 17 do Anexo 3 da DON n.º 2. Os acessos ficam na 2: a fronteira
 * entre acesso e percurso de fuga é doutrina, confirmada a 5 de setembro.
 */
const TIPOS_NOTA = [
  { k:"ameaca", n:"Ameaça, ponto crítico ou segurança",
    d:"Interdição ou condicionamento, perigo, ponto crítico para reação imediata, percurso de fuga, zona de segurança",
    cor:"#B00000", alerta:true },
  { k:"acesso", n:"Acesso e circulação",
    d:"Acessos, caminhos penetrantes, entradas e saídas de meios, itinerários",
    cor:"#1F4E79", alerta:false },
  { k:"reconhecimento", n:"Reconhecimento",
    d:"O estado do terreno e o que já se fez",
    cor:"#5A5A5A", alerta:false }
];

/** Os dois graus de uma nota de gravidade 1 sobre a circulação — art. 23.º, n.º 1, al. a). */
const GRAUS_NOTA = [
  { k:"interdicao", n:"Interdição", alvo:"Interdição à circulação" },
  { k:"condicionamento", n:"Condicionamento", alvo:"Condicionamento à circulação" }
];

/* As espécies de antes da r0105, para o que ainda as traga pelo nome: um pacote antigo por
   migrar, um teste, uma linha da fita. A migração 27 → 28 converte o que está gravado. */
const NOTA_LEGADO = { aviso:"ameaca", seguranca:"ameaca", manobra:"acesso", obs:"reconhecimento" };

/** A definição de uma gravidade de nota. O que não se reconhece cai em «reconhecimento». */
function defNota(k){
  const chave = NOTA_LEGADO[k] || k;
  return TIPOS_NOTA.find(t=>t.k === chave) || TIPOS_NOTA.find(t=>t.k === "reconhecimento");
}
/** A definição de um grau, ou nula se não for um dos dois. */
function defGrau(k){ return GRAUS_NOTA.find(g=>g.k === k) || null; }
/** O texto de uma nota como se lê no mapa e no plano: o grau à cabeça, quando o há. */
function textoDaNota(nt){ const g = defGrau(nt && nt.grau); return (g? g.n+": " : "") + String((nt && nt.txt) || ""); }

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
function escreverNota(tipo, lat, lon, txt, grau){
  if(encerrada()) return { ok:false, motivo:"O registo está encerrado. Reabrir antes de anotar." };
  if(!podeFazer("escrever")) return { ok:false, motivo:motivoPerfil("escrever") };
  const t = String(txt||"").trim().replace(/\s+/g, " ");
  if(!t) return { ok:false, motivo:"Uma nota sem texto não diz nada. Escreve o que há a dizer ali." };
  if(!Number.isFinite(lat) || !Number.isFinite(lon)) return { ok:false, motivo:"Coordenada inválida." };
  const d = defNota(tipo);
  /* O grau só existe na gravidade 1, e só se for um dos dois da norma; noutra gravidade, ou
     escrito de outra maneira, fica vazio em vez de se inventar. */
  const g = d.k === "ameaca" && defGrau(grau) ? defGrau(grau).k : "";
  const nota = {
    id:novoIdentificador("nt"),
    tipo:d.k, grau:g,
    txt:t.slice(0, NOTA_MAX),
    lat:+lat.toFixed(6), lon:+lon.toFixed(6),
    setor:(()=>{ const i = setorDoPonto(lat, lon); return i >= 0 ? NOMES_SETOR[i] : ""; })(),
    g:gdhAgora(), por:quemRegista()
  };
  notasLista().push(nota);
  O.evolucao.push({ g:nota.g, tipo:"posit",
    txt:d.n+" no mapa"+(nota.setor? ", setor "+nota.setor : "")+": «"+textoDaNota(nota)+"»." });
  fita(d.n+": "+textoDaNota(nota));
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
