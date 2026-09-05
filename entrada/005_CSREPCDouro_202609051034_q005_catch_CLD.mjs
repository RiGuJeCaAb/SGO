import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
async function fich(p){const o=[];for(const e of await readdir(p,{withFileTypes:true})){const f=join(p,e.name);if(e.isDirectory())o.push(...await fich(f));else if(e.name.endsWith('.js'))o.push(f);}return o;}
function semC(s){let o='',i=0,m='code';while(i<s.length){const c=s[i],d=s[i+1];
 if(m==='code'){if(c==='/'&&d==='*'){m='b';o+='  ';i+=2;continue;}if(c==='/'&&d==='/'){m='l';o+='  ';i+=2;continue;}
  if(c==='"'||c==="'"||c==='`'){m=c;o+=c;i++;continue;}o+=c;i++;continue;}
 if(m==='b'){if(c==='*'&&d==='/'){m='code';o+='  ';i+=2;continue;}o+=(c==='\n'?'\n':' ');i++;continue;}
 if(m==='l'){if(c==='\n'){m='code';o+='\n';i++;continue;}o+=' ';i++;continue;}
 if(c==='\\'){o+='  ';i+=2;continue;} if(c===m){m='code';o+=c;i++;continue;} o+=(c==='\n'?'\n':c);i++;}
 return o;}
// conteúdo do try correspondente: recua do 'catch' até ao '{' do try
function corpoTry(s, iCatch){ let j=iCatch-1; while(j>0 && /\s/.test(s[j])) j--; if(s[j]!=='}') return '';
  let n=0; for(let k=j;k>=0;k--){ if(s[k]==='}')n++; else if(s[k]==='{'){n--; if(!n) return s.slice(k+1,j);} } return ''; }

const LIMPEZA = /revokeObjectURL|removeChild|\.remove\(\)|\.close\(\)|clearTimeout|clearInterval|disconnect\(|\.abort\(/;
const PINTURA = /^\s*(await\s+)?(pintar|render|escrever|desenhar|mostrar|atualizar|actualizar|aplicar|analisar)/i;
const FACTO   = /guardar|gravar|persistir|copia|copiaSeDevida|podar|_idb|setVarias|fita\(|put\(|delete\(|export/i;

const res=[];
for(const f of await fich('fonte')){
  const s=semC(await readFile(f,'utf8'));
  const re=/\bcatch\s*(\([^)]*\))?\s*\{\s*\}/g; let m;
  while((m=re.exec(s))){
    const t=corpoTry(s,m.index).trim().replace(/\s+/g,' ');
    let sev = LIMPEZA.test(t) ? 1 : (FACTO.test(t) ? 3 : (PINTURA.test(t) ? 2 : 2));
    res.push({f:f.replace('fonte/',''),l:s.slice(0,m.index).split('\n').length,sev,t:t.slice(0,80)});
  }
}
const c={1:0,2:0,3:0}; res.forEach(r=>c[r.sev]++);
console.log('catch VAZIOS:',res.length,'| classe 1 (limpeza):',c[1],'| classe 2 (pintura):',c[2],'| classe 3 (perda de facto):',c[3]);
console.log('\n--- CLASSE 3 ---');
res.filter(r=>r.sev===3).forEach(r=>console.log(`${r.f}:${r.l}  try{ ${r.t} }`));
