/* ================= NÚCLEO · resumo criptográfico do estado =================
   A aplicação corre em `file://`, sem servidor e muitas vezes sem rede. Não pode dar
   prova de que ninguém mexeu no registo — isso exige uma terceira parte. Pode dar a
   metade que lhe compete: **um resumo do estado, calculado no momento em que o estado
   sai ou se fecha**, para que mais tarde se saiba se o ficheiro que se tem à frente é o
   mesmo que saiu do posto de comando.

   Não é assinatura: quem alterar o pacote pode recalcular o resumo. É deteção de
   alteração acidental e de troca de ficheiros, que é o que acontece a sério — a cópia
   antiga que se importa por engano, o ficheiro truncado, o pacote que passou por um
   editor pelo caminho.

   SHA-256 escrito aqui, e não `crypto.subtle`, por duas razões: a interface do navegador
   é assíncrona e só existe em contexto seguro, e o `file://` não o é em todo o lado. O
   que está aqui corre em qualquer sítio, é síncrono, e é exercitado contra os vetores
   publicados no FIPS 180-4. */

const K256 = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];

/** Bytes UTF-8 de um texto, sem depender de `TextEncoder`, que nem sempre existe. */
function bytesUTF8(s){
  const b = [];
  for(let i=0;i<s.length;i++){
    let c = s.codePointAt(i);
    if(c > 0xFFFF) i++;   /* par substituto: o segundo já foi consumido */
    if(c < 0x80) b.push(c);
    else if(c < 0x800) b.push(0xC0|(c>>6), 0x80|(c&63));
    else if(c < 0x10000) b.push(0xE0|(c>>12), 0x80|((c>>6)&63), 0x80|(c&63));
    else b.push(0xF0|(c>>18), 0x80|((c>>12)&63), 0x80|((c>>6)&63), 0x80|(c&63));
  }
  return b;
}

/**
 * SHA-256 de um texto, em hexadecimal minúsculo.
 *
 * @param {string} texto
 * @returns {string} 64 dígitos hexadecimais
 */
function sha256(texto){
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
             0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const b = bytesUTF8(String(texto));
  /* O comprimento vai em 64 bits; acima de 512 MB de texto isto perdia bits, e não há
     ocorrência nenhuma que lá chegue. */
  const bits = b.length * 8;
  b.push(0x80);
  while(b.length % 64 !== 56) b.push(0);
  b.push(0, 0, 0, 0, (bits>>>24)&255, (bits>>>16)&255, (bits>>>8)&255, bits&255);

  const rotr = (x,n)=>(x>>>n)|(x<<(32-n));
  const w = new Array(64);
  for(let i=0;i<b.length;i+=64){
    for(let t=0;t<16;t++){
      w[t] = ((b[i+4*t]<<24) | (b[i+4*t+1]<<16) | (b[i+4*t+2]<<8) | b[i+4*t+3]) | 0;
    }
    for(let t=16;t<64;t++){
      const x = w[t-15], y = w[t-2];
      const s0 = rotr(x,7) ^ rotr(x,18) ^ (x>>>3);
      const s1 = rotr(y,17) ^ rotr(y,19) ^ (y>>>10);
      w[t] = (w[t-16] + s0 + w[t-7] + s1) | 0;
    }
    let a=H[0], bb=H[1], c=H[2], d=H[3], e=H[4], f=H[5], g=H[6], h=H[7];
    for(let t=0;t<64;t++){
      const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[t] + w[t]) | 0;
      const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
      const maj = (a & bb) ^ (a & c) ^ (bb & c);
      const t2 = (S0 + maj) | 0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=bb; bb=a; a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0;  H[1]=(H[1]+bb)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
    H[4]=(H[4]+e)|0;  H[5]=(H[5]+f)|0;  H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
  }
  return H.map(x=>(x>>>0).toString(16).padStart(8,"0")).join("");
}

/**
 * Serialização canónica: chaves por ordem alfabética, a toda a profundidade.
 *
 * Sem isto o resumo mudava sozinho. A ordem das chaves de um objeto é a ordem por que
 * foram escritas, e o estado que volta do armazenamento traz a ordem do ficheiro, não a
 * do código; uma migração que acrescente um campo altera-a. O mesmo estado dava dois
 * resumos, e o carimbo não valia nada.
 */
function canonico(x){
  if(x === undefined) return "null";
  if(x === null || typeof x !== "object") return JSON.stringify(x);
  if(Array.isArray(x)) return "[" + x.map(canonico).join(",") + "]";
  return "{" + Object.keys(x).sort()
    .map(k => JSON.stringify(k) + ":" + canonico(x[k])).join(",") + "}";
}

/** Resumo do estado de uma ocorrência. @param {any} estado @returns {string} */
function resumoEstado(estado){ return sha256(canonico(estado)); }

/** Os primeiros doze dígitos, que é o que se lê em voz alta ou se confere de relance. */
function resumoCurto(sha){ return String(sha||"").slice(0,12); }
