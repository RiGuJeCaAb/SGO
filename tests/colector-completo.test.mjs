// As notas e os focos no colector, e a regra que impede o buraco de reabrir.
//
// O `p0020` corrigiu esta falha para onze painéis: escreviam no estado, pintavam o seu ecrã,
// e nenhum chegava ao plano. **Na mesma sessão, esta linhagem acrescentou as notas do mapa e
// os focos de calor por satélite, e nenhum dos dois entrou no colector.** A falha repetiu-se
// enquanto a correção ainda estava fresca.
//
// Por isso o que aqui se verifica é de dois tipos: que os dois painéis em falta passaram a
// chegar ao plano, e que **um painel novo não pode voltar a ficar de fora em silêncio**.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

function comTeatro({ notas, focos } = {}) {
  janela.eval('O = novoEstado(); SERIE = []');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711';
  O.dados.area = '120';
  if (notas) O.dados.notas = notas;
  if (focos) O.dados.focos = focos;
  return O;
}

/* ---- as notas do mapa ---- */

test('as notas escritas no mapa chegam ao retrato do fogo', semAplicacao, () => {
  // **O campo é `txt`.** A primeira versão deste teste inventou `texto`, e por isso passou
  // enquanto o colector lia um campo que não existe: o aviso chegava ao plano vazio. É a
  // mesma armadilha de fabricar a forma em vez de usar a real, e desta vez foi o verificador
  // de tipos que a apanhou, não o teste.
  comTeatro({ notas: [
    { id: 'n1', tipo: 'aviso', txt: 'Linha de média tensão sobre o caminho', lat: 41.09, lon: -7.83, setor: '', g: '', por: '' },
    { id: 'n2', tipo: 'manobra', txt: 'Entrada de meios pesados pelo lado norte', lat: 41.10, lon: -7.82, setor: '', g: '', por: '' },
  ] });
  const f = janela.retratoDoFogo();
  assert.equal(f.notas.length, 2, 'as notas têm de chegar ao colector');
  assert.equal(f.notas.filter((x) => x.alerta).length, 1, 'e o aviso distingue-se da manobra');
  assert.equal(f.notas[0].texto, 'Linha de média tensão sobre o caminho',
    'e o texto tem de chegar mesmo, não uma cadeia vazia');
});

test('um aviso do mapa é citado no resumo; uma observação é contada', semAplicacao, () => {
  // A distinção é operacional e já está em `TIPOS_NOTA`: o que restringe ou avisa tem
  // consequência para quem lá vai, e por isso vai por extenso.
  comTeatro({ notas: [
    { id: 'n1', tipo: 'aviso', txt: 'Linha de média tensão sobre o caminho', lat: 41.09, lon: -7.83, setor: '', g: '', por: '' },
    { id: 'n2', tipo: 'obs', txt: 'Rescaldo concluído neste troço', lat: 41.10, lon: -7.82, setor: '', g: '', por: '' },
  ] });
  const s = janela.resumoDoFogo(janela.retratoDoFogo());
  assert.match(s, /Linha de média tensão sobre o caminho/, 'o aviso vai por extenso');
  assert.doesNotMatch(s, /Rescaldo concluído/, 'a observação não enche o resumo');
  assert.match(s, /1 nota de manobra ou observação/, 'mas conta-se, para não desaparecer');
});

test('sem notas, o resumo não inventa uma linha sobre elas', semAplicacao, () => {
  comTeatro();
  const s = janela.resumoDoFogo(janela.retratoDoFogo());
  assert.doesNotMatch(s, /nota de manobra|Avisos escritos/);
});

/* ---- os focos de calor ---- */

test('os focos de calor chegam ao retrato, com a confiança e a origem', semAplicacao, () => {
  comTeatro({ focos: { itens: [
    { lat: 41.10, lon: -7.82, conf: 'h', frp: 12 },
    { lat: 41.11, lon: -7.81, conf: 'n', frp: 8 },
    { lat: 41.12, lon: -7.80, conf: 'h', frp: 20 },
  ], origem: 'VIIRS S-NPP', g: '021030SET26', por: 'Téc. Faria', nota: '' } });
  const f = janela.retratoDoFogo();
  assert.equal(f.focos.n, 3);
  assert.equal(f.focos.porConfianca.alta, 2);
  assert.equal(f.focos.origem, 'VIIRS S-NPP');
});

test('o resumo diz quantos focos há, e que não substituem o que o posto traçou',
  semAplicacao, () => {
    comTeatro({ focos: { itens: [{ lat: 41.1, lon: -7.8, conf: 'h', frp: 12 }],
      origem: 'VIIRS S-NPP', g: '021030SET26', por: '', nota: '' } });
    const s = janela.resumoDoFogo(janela.retratoDoFogo());
    assert.match(s, /Focos de calor detetados por satélite: 1/);
    assert.match(s, /VIIRS S-NPP/);
    assert.match(s, /não substituem o que o posto traçou/,
      'o que o posto viu tem precedência sobre o que a máquina viu');
  });

test('sem focos carregados, o ramo vem nulo em vez de um zero', semAplicacao, () => {
  comTeatro();
  assert.equal(janela.retratoDoFogo().focos, null);
});

/* ---- o contexto do modelo de linguagem ---- */

test('as notas e os focos chegam também à via do modelo', semAplicacao, () => {
  comTeatro({
    notas: [{ id: 'n1', tipo: 'aviso', txt: 'Linha de média tensão sobre o caminho', lat: 41.09, lon: -7.83, setor: '', g: '', por: '' }],
    focos: { itens: [{ lat: 41.1, lon: -7.8, conf: 'h', frp: 12 }], origem: 'VIIRS', g: '', por: '', nota: '' },
  });
  const ctx = janela.contexto(1, [], null);
  assert.match(ctx, /Linha de média tensão/, 'o aviso do mapa tem de chegar ao modelo');
  assert.match(ctx, /"focos"/, 'e os focos também');
});

/* ---- a regra, que é o que impede a reincidência ---- */

test('todo o ramo de dados com dono declara o que leva ao plano, ou porque não leva',
  semAplicacao, () => {
    // `deepEqual` sobre arrays vindos do jsdom compara realms e falha com dois vazios; e
    // juntar por vírgula tem a vantagem de a mensagem dizer **qual** ramo falta.
    const a = janela.auditarContributos();
    assert.equal(a.semDeclaracao.join(', '), '',
      'estes ramos escrevem para o vazio: alguém preenche e o plano nunca os cita');
    assert.equal(a.semRazao.join(', '), '', 'uma declaração sem razão escrita é uma linha por preencher');
    assert.equal(a.orfas.join(', '), '', 'declaram contributo ramos que já não existem em POSSE');
    assert.ok(a.n >= 20, `só ${a.n} ramos auditados: a POSSE encolheu?`);
  });

test('a auditoria apanha um ramo novo que ninguém declarou', semAplicacao, () => {
  // Provar que ela vê, e não que passa por não olhar. É a diferença entre uma auditoria e
  // uma decoração — e foi assim que o buraco reabriu da primeira vez.
  const POSSE = avaliar(janela, 'POSSE');
  const cel = POSSE[0];
  cel.ramos.push({ p: 'dados.painelNovo', r: 'art. 0.º', d: 'um painel acabado de escrever' });
  try {
    const a = janela.auditarContributos();
    assert.ok(a.semDeclaracao.includes('dados.painelNovo'),
      'um ramo novo sem declaração tinha de ser apanhado');
  } finally {
    cel.ramos.pop();
  }
  assert.equal(janela.auditarContributos().semDeclaracao.join(', '), '', 'e a auditoria volta ao que estava');
});

test('as notas e os focos estão declarados como contributo, e não como dispensa',
  semAplicacao, () => {
    // São os dois que faltavam. Se alguém os declarasse com `onde:null` a auditoria passava
    // e o defeito voltava, por isso o teste exige o contributo e não só a linha.
    const C = avaliar(janela, 'CONTRIBUI');
    for (const p of ['dados.notas', 'dados.focos']) {
      const x = C.find((y) => y.p === p);
      assert.ok(x, `${p} tem de estar declarado`);
      assert.equal(x.onde, 'retratoDoFogo', `${p} tem de contribuir mesmo, e não ser dispensado`);
    }
  });
