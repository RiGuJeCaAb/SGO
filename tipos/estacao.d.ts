// Declarações de tipo da Estação PEA.
//
// A aplicação continua a ser JavaScript comum: nada disto é carregado pelo navegador.
// Serve só ao verificador, que corre em desenvolvimento por `npm run tipos`.
//
// Aqui declara-se a superfície global da aplicação. As formas do estado estão
// declaradas em JSDoc dentro do próprio ficheiro, junto do código que descrevem.

/** Adaptador de armazenamento fornecido pelo ambiente, quando existe. */
interface AdaptadorArmazem {
  get(chave: string): Promise<{ value: string } | null>;
  set(chave: string, valor: string): Promise<void>;
  delete(chave: string): Promise<void>;
}

interface Window {
  /** Nível mais alto do adaptador ARMAZEM, quando o ambiente o fornece. */
  storage?: AdaptadorArmazem;

  /** Listas efémeras de apoio à interface, entre o render e o clique do utilizador. */
  __sensLista?: any[];
  __geoLista?: any[];
  __ptLista?: any[];
  __geoFonte?: string;
  __emVigor?: any;

  /** Funções alcançáveis a partir dos atributos onclick que a aplicação gera. */
  irPara?: (pid: string) => void;
  verPEA?: (n: number) => void;
  addSens?: (i: number) => void;
  addSensTodos?: () => void;
  adotarPT?: (i: number) => void;
  escolherGeo?: (i: number) => void;
  abrirOcc?: (num: string) => void;
  apagarOcc?: (num: string) => void;
  obterAvisos?: (silencioso: boolean) => Promise<void>;
}

// As mesmas funções, chamadas sem o prefixo `window.` a partir do próprio código.
// São publicadas em `window`, o que as torna globais em tempo de execução.
declare function irPara(pid: string): void;
declare function verPEA(n: number): void;
declare function addSens(i: number): void;
declare function addSensTodos(): void;

// ===================== forma do estado =====================
// Declarada aqui, e não em comentários dentro da aplicação, para que o ficheiro
// entregue não engorde com oitenta linhas que o navegador nunca lê. A aplicação
// limita-se a apontar para estes nomes com anotações curtas.

/** Identificação da ocorrência. Sem tolerância a campo desconhecido: é aqui que
 *  um nome mal escrito custa caro. */
interface MetaOcorrencia {
  num: string; local: string; pco: string; fase: string;
  lat: string; lon: string; pasta: string; inicio: string; nivel: string;
  /** Derivados por geocodificação inversa. Não têm campo no formulário. */
  distrito: string; concelho: string; distritoChave: string;
}

/** Um setor do teatro de operações, com referência alfabética Alfa a Lima. */
interface Setor {
  estado: string; cmd: string; ct?: string; adj?: string;
  m?: string; o?: string;
  /** Nível de manobra e nível tático, em SIRESP e em banda alta. */
  siresp?: string; ba?: string; tat?: string; tatba?: string;
  tip?: any[];
  [outro: string]: any;
}

interface FuncaoPCO {
  f: string; nome: string; entidade: string; ct: string;
  siresp: string; ba: string;
  /**
   * GDH da **nomeação**. Vazio enquanto o pedido estiver pendente: sem nome não há
   * nomeação. Antes da versão 4 do estado era preenchido com a hora corrente sempre
   * que faltava, o que fazia passar por nomeada uma função que o não estava.
   */
  g: string;
  /**
   * GDH do **pedido** do COS à entidade nomeadora — arts. 23.º, n.º 2, 24.º, n.º 2 e
   * 25.º, n.º 2. Vazio nas funções que não são de nomeação externa. O estado pendente
   * é derivado, não gravado: `!!solicitado && !g`.
   */
  solicitado: string;
  [outro: string]: any;
}

/** Uma célula do posto de comando, na entrega de turno. */
interface CelulaTurno { n: string; ct: string; nota: string; }

/** Passagem de turno: o turno em curso e o histórico de entregas. */
interface Turno {
  equipa: string; inicio: string;
  celulas: { [chave: string]: CelulaTurno };
  entregas: any[];
}

interface Canais {
  cmd: string; tat: string; ba: string; tatba: string;
  aero: string; opar: string; cmar: string;
  atrib: string[];
  niveis: { comando: boolean; tatico: boolean; manobra: boolean; aereo: boolean; ba: boolean; tocado: boolean } | null;
}

/**
 * O dispositivo no teatro de operações — matéria de Operações, arts. 17.º e 19.º.
 *
 * Até à versão 5 do estado guardava aqui dentro a reserva e a zona de apoio, que são
 * áreas da zona de concentração e reserva e portanto de Logística. Enquanto
 * partilhavam objeto com os setores, uma escrita em bloco atravessava a fronteira sem
 * se ver. Estão agora em `Logistica`.
 */
interface Dispositivo {
  n: number; setores: Setor[]; aer: string; aerL: any[]; livre: boolean;
}

/** Um contador de meios e operacionais. */
interface Contagem { m: string; o: string; }

/** Matéria da célula de logística e finanças — arts. 31.º a 35.º. */
interface Logistica {
  reserva: Contagem;
  zonaApoio: Contagem;
  /** DL n.º 90-A/2022, art. 13.º, al. c); DON n.º 2, pontos 7.d.(5), (7) e (8). */
  pontoTransito: { des: string; resp: string; ct: string; cd: string; obs: string };
  /**
   * Plano de comunicações — art. 32.º, n.º 1, al. d), e art. 34.º. Ramo da logística
   * desde a versão 6 do estado; até lá vivia em `pco`, com as nomeações. Lê-se sempre
   * por `canaisObj()`: foi por se alcançar um ramo pelo caminho que o ponto de trânsito
   * se perdeu quando mudou de dono.
   */
  comunicacoes: Canais;
}

interface DadosOcorrencia {
  area: string; perimNome: string; setores: string; sensiveis: string;
  anexos: string[];
  perfil: any;
  /** `eps` é a razão declive/vento de Viegas (2004); vazia quando não informada. */
  topo: { orient: string; declive: string; obs: string; eps: string };
  est: Dispositivo;
  [outro: string]: any;
}

/** O estado completo de uma ocorrência, tal como é gravado e exportado. */
interface Estado {
  meta: MetaOcorrencia;
  avisos: any;
  dados: DadosOcorrencia;
  /** Comando: as nomeações do art. 14.º, e mais nada, desde a versão 6. */
  pco: { funcoes: FuncaoPCO[] };
  evolucao: any[];
  csv: string;
  peas: any[];
  fita: { g: string; e: string }[];
  logistica: Logistica;
  turno: Turno;
  versao: number;
  [outro: string]: any;
}

/** Um item devolvido pelo motor de conformidade. */
interface ItemDON {
  /** Obrigação, aviso, ou conformidade verificada. */
  n: 'ob' | 'av' | 'ok';
  /** Destino, que liga ao separador e ao botão que leva ao campo em causa. */
  id: string;
  t: string; s: string; f: string; a: string;
  /** Referência legal. Vazia só no aviso de regra indisponível. */
  r: string;
}

/** Uma regra do registo de conformidade. */
interface RegraDON {
  id: string;
  ids: string[];
  t: string;
  /** Chaves dos documentos invocados. Ver docs/FONTES.md. */
  fontes: string[];
  avaliar(contexto: any): ItemDON[];
}
