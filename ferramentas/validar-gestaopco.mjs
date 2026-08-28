// Validador de exportações da Gestão PCO.
//
// Corre o leitor e o conversor da Estação sobre um ficheiro, sem escrever nada no
// estado, e diz o que a Estação vai fazer com ele: o que aproveita, o que converte
// e o que precisa de decisão humana.
//
// Serve para verificar uma exportação real assim que ela existir, e para quem
// desenvolve a Gestão PCO poder acertar o formato sem instalar a Estação.
//
//   npm run validar-gp -- docs/exemplos/GestaoPCO_v1.1_exemplo.json

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
  const pacote = janela.lerPacoteGestaoPCO(await readFile(alvo, 'utf8'));
  const c = janela.converterGestaoPCO(pacote);

  console.log(`${alvo}`);
  console.log(`  esquema v${c.resumo.versao}${c.resumo.gerado ? `, instantâneo de ${c.resumo.gerado}` : ''}`);
  console.log(`  ocorrência ${c.meta.num ?? '—'} · ${c.meta.local ?? '—'}`);
  console.log(`  ${c.resumo.setores} setores · ${c.resumo.meios} tipologias · ${c.resumo.aereos} meios aéreos`);
  console.log(`  reserva ${c.est.res.m || 0}/${c.est.res.o || 0} · ZA ${c.est.za.m || 0}/${c.est.za.o || 0}`);

  const comRelogio = c.est.setores.flatMap((s) => s.tip).filter((m) => m.ts).length;
  const total = c.resumo.meios;
  console.log(`  ${comRelogio} de ${total} tipologias com hora de empenhamento` +
    (comRelogio < total ? ' — sem ela não há projeção de rendições' : ''));

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
