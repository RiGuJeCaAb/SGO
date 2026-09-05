/* ================= NÚCLEO · ler um ficheiro com teto de tamanho ================= */
/**
 * Acima de quantos megabytes um ficheiro de texto não se lê.
 *
 * Não havia um único teto em toda a aplicação. Um pacote de ocorrência de 50 MB passava por
 * quatro `JSON.parse`, pela limpeza recursiva, por 26 degraus de migração e pelo SHA-256
 * escrito em JavaScript — cujo `bytesUTF8` constrói um número por byte —, tudo síncrono
 * no fio principal: a aba bloqueava dezenas de segundos ou caía, sem barra, sem
 * cancelamento e sem mensagem. Uma ocorrência exportada anda pelas dezenas de KB; oito
 * megabytes é cem vezes isso, e ainda cabe quem exportou com croquis e anexos.
 */
const TETO_FICHEIRO_MB = 8;

/**
 * Lê o texto de um ficheiro, ou recusa-o antes de o ler se for maior do que o teto.
 *
 * Recusa **antes** — pelo `size`, que o navegador já sabe sem abrir o ficheiro — e diz o
 * tamanho e o teto, para quem tentou saber o que aconteceu e o que fazer.
 *
 * @param {File} f
 * @param {number} [mb] teto em megabytes; por omissão `TETO_FICHEIRO_MB`
 * @returns {Promise<string>}
 */
async function lerTextoComTeto(f, mb){
  const teto = (mb || TETO_FICHEIRO_MB) * 1048576;
  const tam = Number(f && f.size);
  if(Number.isFinite(tam) && tam > teto){
    throw new Error("o ficheiro tem " + fmtPT(tam/1048576, 1) + " MB e o teto é "
      + (mb || TETO_FICHEIRO_MB) + " MB — não é uma ocorrência exportada por esta aplicação, ou traz o que não devia");
  }
  return await f.text();
}
