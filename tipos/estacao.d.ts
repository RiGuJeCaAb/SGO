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
  siresp: string; ba: string; g: string;
  [outro: string]: any;
}

interface Canais {
  cmd: string; tat: string; ba: string; tatba: string;
  aero: string; opar: string; cmar: string;
  atrib: string[];
  niveis: { comando: boolean; tatico: boolean; manobra: boolean; aereo: boolean; ba: boolean; tocado: boolean } | null;
}

interface Dispositivo {
  n: number; setores: Setor[]; aer: string; aerL: any[];
  res: { m: string; o: string }; za: { m: string; o: string }; livre: boolean;
}

interface DadosOcorrencia {
  area: string; perimNome: string; setores: string; sensiveis: string;
  anexos: string[];
  pt: { des: string; resp: string; ct: string; cd: string; obs: string };
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
  pco: { funcoes: FuncaoPCO[]; canais: Canais };
  evolucao: any[];
  csv: string;
  peas: any[];
  fita: { g: string; e: string }[];
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
