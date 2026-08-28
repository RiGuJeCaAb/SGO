// Validador de exportações da Gestão PCO.
//
// Corre o leitor e o conversor da Estação sobre um ficheiro, sem escrever nada no
// estado, e diz o que a Estação vai fazer com ele: o que aproveita, o que converte
// e o que precisa de decisão humana.
//
// Serve para verificar uma exportação real assim que ela existir, e para quem
// desenvolve a Gestão PCO poder acertar o formato sem instalar a Estação.
//
//   npm run validar-gp -- docs/interop/exemplos/EspecificacaoJSON_v1.1_exemplo.json

import { readFile } from 'node:fs/promises';
import { abrirAplicacao } from '../tests/app.mjs';

const alvo = process.argv[2];
if (!alvo) {
  console.error('Uso: npm run validar-gp -- <ficheiro.json>');
  process.exit(2);
}

const janela = await abrirAplicacao();
if (!janela) {
  console.error('Sem revisão em app/. Correr `npm run montar` primeiro.');
  process.exit(2);
}

let saida = 0;
try {
  const pacote = janela.lerContratoGestaoPCO(await readFile(alvo, 'utf8'));
  const c = janela.converterGestaoPCO(pacote);
  const r = c.resumo;

  console.log(`${alvo}`);
  console.log(`  ${r.esquema} v${r.versao}${r.emitido ? `, emitido ${r.emitido}` : ''}`);
  if (r.app) console.log(`  origem ${r.app}${r.rev ? ` ${r.rev}` : ''}${r.operador ? ` · ${r.operador}` : ''}${r.posto ? ` · ${r.posto}` : ''}`);
  console.log(`  ocorrência ${c.meta.num ?? '—'} · ${c.meta.local ?? '—'}`);
  console.log(`  ${r.setores} setores · ${r.forcas} forças · ${r.aereos} meios aéreos · ${r.funcoes} funções do PCO`);
  console.log(`  reserva ${c.est.res.m || 0}/${c.est.res.o || 0} · zona de apoio ${c.est.za.m || 0}/${c.est.za.o || 0}`);
  console.log(`  ${r.forcas - r.semRelogio} de ${r.forcas} forças com instante de empenhamento` +
    (r.semRelogio ? ' — sem ele não há controlo de tempos nem rendição' : ''));

  if (c.avisos.length) {
    console.log(`\n  ${c.avisos.length} ponto(s) a confirmar:`);
    for (const a of c.avisos) console.log(`   · ${a}`);
  } else {
    console.log('\n  Sem pontos a confirmar.');
  }
} catch (e) {
  console.error(`${alvo}: recusado — ${e.message}`);
  saida = 1;
}

janela.close();
process.exit(saida);
