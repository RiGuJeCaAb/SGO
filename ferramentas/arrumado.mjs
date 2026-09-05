// Confere que o repositório continua arrumado, e não só que estava arrumado um dia.
//
// Uma pasta desarruma-se por acumulação, não por decisão: um ficheiro entra com o nome que
// trazia, ninguém o regista no catálogo da pasta, e seis meses depois ninguém sabe o que
// ele é nem se pode sair. Já cá aconteceu duas vezes — sete provas de verificação com nome
// de rascunho e nunca registadas, e seis guiões da linhagem paralela com os campos do nome
// trocados.
//
// A regra é a de sempre neste projeto: **o que se escreve à mão, confere-se à máquina.**
// Cada pasta catalogada declara aqui a forma do nome que aceita e o documento que a
// cataloga, e todo o ficheiro tem de cumprir as duas coisas — chamar-se como deve, e estar
// nomeado no catálogo. O catálogo cita muitas vezes com reticências no lugar do carimbo de
// data (`CSREPCDouro_qa0008_..._RamoLogistica_CLD.png`), e isso conta como citação.
//
// **O que esta ferramenta não faz é ler.** Não sabe se a linha do catálogo descreve o
// ficheiro ou mente sobre ele. Garante que existe uma linha, que é o mínimo para que
// alguém possa dar pela mentira.

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * As pastas catalogadas, com a forma do nome que aceitam e o documento que as cataloga.
 *
 * `excecoes` são ficheiros que ficam com o nome que têm por uma razão dita no catálogo —
 * apagá-los ou renomeá-los partiria referências alheias. Cada exceção continua a precisar
 * de estar catalogada: é dispensa da forma do nome, não do registo.
 */
const PASTAS = [
  {
    pasta: 'docs/qa',
    catalogo: 'docs/qa/LEIAME.md',
    forma: /^CSREPCDouro_qa\d{4}_\d{12}_[A-Za-z0-9]+_CLD\.(png|pdf|jpg)$/,
    diz: 'CSREPCDouro_qaNNNN_AAAAMMDDHHMM_Nome_CLD.png',
    ignora: ['LEIAME.md'],
    excecoes: [],
  },
  {
    pasta: 'ferramentas/historico',
    catalogo: 'ferramentas/historico/README.md',
    /* O prefixo `00N_` identifica o ramo que produziu o guião, a partir de 2 de setembro:
       cinco ramos a escrever guiões com séries próprias colidiam sem ele. */
    /* Duas formas, porque há duas convenções em uso. A desta linhagem põe a série antes da
       data — `CSREPCDouro_p0016_…`. A dos ramos, a partir de 2 de setembro, põe o número do
       ramo à cabeça e a série depois da data — `006_CSREPCDouro_202609021523_t01_…`, que é
       o que os identifica sem se abrir o ficheiro. */
    /* A letra a seguir ao número da série — `t0018c` — é a religação do mesmo guião a uma
       revisão posterior, como o `r0058a` das entregas; e `.mjs` é o que um guião escrito em
       módulo ES traz. */
    forma: /^(CSREPCDouro_[pqt]\d{4}_\d{12}|\d{3}_CSREPCDouro_\d{12}_[pqt]\d{2,4}[a-z]?)_[A-Za-z0-9]+_CLD\.(py|js|mjs)$/,
    diz: 'CSREPCDouro_pNNNN_AAAAMMDDHHMM_Nome_CLD.py, ou 00N_CSREPCDouro_AAAAMMDDHHMM_tNN_Nome_CLD.js vindo de um ramo',
    ignora: ['README.md'],
    /* Anteriores à convenção, e o README diz o que são. */
    excecoes: ['patch_r0016.py', 'teste.js'],
  },
  {
    pasta: 'docs/cartografia',
    catalogo: 'docs/cartografia/LEIAME.md',
    forma: /^CSREPCDouro_ref\d{2}_[A-Za-z0-9]+_[A-Za-z0-9]+_CLD\.(png|pdf|jpg|geojson)$/,
    diz: 'CSREPCDouro_refNN_Local_Assunto_CLD.png, ou .geojson para a geometria da mesma ocorrência',
    ignora: ['LEIAME.md'],
    excecoes: [],
  },
  {
    /* As transcrições de conversa. Ficam com a convenção do projeto porque são documentos
       deste projeto, ainda que o texto seja de outra sessão. */
    pasta: 'docs/conversas',
    catalogo: 'docs/conversas/LEIAME.md',
    /* O prefixo `00N_` identifica o ramo da conversa do lado CLD, e é opcional porque os
       registos anteriores a 2 de setembro não o têm. **É `00N_` e não `#00N_`**: os cinco
       ramos chegaram a essa conclusão em separado e pela mesma razão — `#` inicia comentário
       em bash e em PowerShell, e é delimitador de fragmento em URL, pelo que um nome não
       citado se parte em silêncio nesse ponto. */
    forma: /^(\d{3}_)?CSREPCDouro_\d{12}_[A-Za-z0-9_]+_CLD\.md$/,
    diz: '00N_CSREPCDouro_AAAAMMDDHHMM_Assunto_CLD.md, com o 00N do ramo',
    ignora: ['LEIAME.md'],
    excecoes: [],
  },
  {
    /* Os PEA emitidos num incêndio real. Ficam com o nome com que saíram do posto de
       comando — renomeá-los para a convenção deste projeto faria passar por nosso um
       documento que não é. O que se exige é que cada um esteja no catálogo. */
    pasta: 'docs/pea-reais',
    catalogo: 'docs/pea-reais/LEIAME.md',
    forma: /^\d{12}_PEA\d{2}[A-Za-z0-9]*_[A-Za-z]+(_v\d)?_CLD\.(docx|pdf)$/,
    diz: 'AAAAMMDDHHMM_PEAnn_Local_CLD.docx',
    ignora: ['LEIAME.md'],
    excecoes: [],
  },
  {
    /* Os documentos de terceiros ficam com o nome com que foram publicados: renomeá-los
       dificultaria dar com o original. O que se exige é que estejam declarados. */
    pasta: 'docs/fontes',
    catalogo: 'docs/FONTES.md',
    forma: null,
    diz: null,
    ignora: [],
    excecoes: [],
  },
];

/** As entregas em `app/`, que têm convenção própria e catálogo que não é por ficheiro. */
const APP = {
  pasta: 'app',
  forma: /^CSREPCDouro_r\d{4}[a-z]?_\d{12}_EstacaoPEA_CLD\.html$/,
  /* Anteriores à numeração de revisões. O `app/README.md` explica-as e não se renomeiam.
     As duas de 23 de agosto são anteriores até ao nome do projeto. */
  antigas: /^(CSREPCDouro_\d{12}_EstacaoPEA_CLD|\d{12}_SGO_PEA)\.html$/,
  ignora: ['README.md', 'RESERVADAS.md'],
};

/**
 * Um ficheiro está citado no catálogo?
 *
 * Aceita a citação literal e a citação com reticências no lugar do carimbo de data, que é
 * como os catálogos citam famílias de ficheiros da mesma revisão.
 */
export function citado(nome, catalogo) {
  if (catalogo.includes(nome)) return true;
  const m = /^(.*_)\d{12}(_.*)$/.exec(nome);
  return m ? catalogo.includes(`${m[1]}...${m[2]}`) : false;
}

/** Percorre uma pasta catalogada e devolve as queixas que tiver. */
async function conferirPasta(regra) {
  const queixas = [];
  const catalogo = await readFile(regra.catalogo, 'utf8');
  const ficheiros = (await readdir(regra.pasta, { withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => !regra.ignora.includes(n));

  for (const nome of ficheiros) {
    if (regra.forma && !regra.excecoes.includes(nome) && !regra.forma.test(nome))
      queixas.push(`${join(regra.pasta, nome)} — nome fora da convenção (${regra.diz})`);
    if (!citado(nome, catalogo))
      queixas.push(`${join(regra.pasta, nome)} — não está no catálogo (${regra.catalogo})`);
  }
  return queixas;
}

/** As entregas: só a forma do nome, porque o catálogo delas não é por ficheiro. */
async function conferirEntregas() {
  const ficheiros = (await readdir(APP.pasta, { withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => !APP.ignora.includes(n));
  return ficheiros
    .filter((n) => !APP.forma.test(n) && !APP.antigas.test(n))
    .map((n) => `${join(APP.pasta, n)} — nome fora da convenção das entregas`);
}

/** Corre tudo e devolve as queixas, para o teste as poder ler sem sair do processo. */
export async function arrumado() {
  const queixas = [];
  for (const regra of PASTAS) queixas.push(...(await conferirPasta(regra)));
  queixas.push(...(await conferirEntregas()));
  return queixas;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const queixas = await arrumado();
  const pastas = PASTAS.length + 1;
  if (queixas.length) {
    for (const q of queixas) console.error(`  ${q}`);
    console.error(`\n${pastas} pastas conferidas: ${queixas.length} por arrumar.`);
    process.exit(1);
  }
  console.log(`${pastas} pastas conferidas: todos os ficheiros com nome de convenção e catalogados.`);
}
