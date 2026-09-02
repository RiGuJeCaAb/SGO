// As missões alinhadas com as propostas.
//
// O plano contradizia-se. O mesmo documento dizia, no objetivo e na ação decisiva,
// «**dominar** as frentes ativas e fechar o perímetro», e três linhas abaixo, nas propostas,
// «**interdição de ataque direto à cabeça**, a intensidade é de 31 920 kW/m». Duas partes do
// mesmo documento aprovado em contradição é pior do que qualquer delas estar sozinha errada:
// quem executa escolhe uma, e não há como saber qual.
//
// A causa era estrutural: **dois blocos a decidir a mesma coisa por critérios diferentes** —
// as missões olhavam à janela meteorológica e ao dispositivo, as propostas à intensidade.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

/** Uma previsão com janela de consolidação, que é o caso em que a contradição aparecia. */
function comJanela() {
  const L = ['HOURLY,HOUR,TEMP,RH,WD,WS,PRECIP'];
  for (let h = 0; h < 24; h++) {
    const dentro = h >= 2 && h <= 8;
    L.push(`02/09/2026,${h},${dentro ? 14 : 33},${dentro ? 62 : 28},210,12,0.00`);
  }
  /* `SERIE` e `ANALISE` são ligações léxicas do topo do script: atribuí-las de fora cria
     outra coisa e a aplicação continua a ler as suas. O `eval` corre no âmbito global. */
  janela.eval(`SERIE = parseCSV(${JSON.stringify(L.join('\n'))}); ANALISE = analisar(SERIE);`);
}

function comFogo(r, w) {
  janela.eval('O = novoEstado()');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.dados.area = '120';
  if (r !== undefined) O.dados.fogo.r = r;
  if (w !== undefined) O.dados.fogo.w = w;
  const e = janela.estObj(); e.n = 1;
  e.setores = [{ estado: 'Em curso (ativo)', cmd: 'Cmdt Sousa', ct: '', adj: '', m: '8', o: '30', tip: [] }];
  return O;
}

const plano = () => janela.detDecisao([], null);
const coerencia = (p) => janela.coerenciaDoPlano(p, janela.retratoDoFogo());

/* ---- a janela existe mesmo: sem ela o defeito não aparecia ---- */

test('a previsão de ensaio produz janela de consolidação', semAplicacao, () => {
  comJanela();
  assert.ok(janela.metricas().janela, 'sem janela o objetivo não dizia «dominar», e não havia defeito a ver');
});

/* ---- a postura ---- */

test('as quatro faixas de intensidade dão quatro posturas', semAplicacao, () => {
  const vistas = [];
  for (const [r, w] of [[60, 4], [300, 8], [600, 10], [3192, 20]]) {
    comFogo(String(r), String(w));
    vistas.push(janela.posturaDeManobra(janela.retratoDoFogo()).k);
  }
  assert.equal(vistas.join(','), 'manual,terrestre,aereo,interdito');
});

test('sem intensidade determinada a postura não condiciona nada', semAplicacao, () => {
  comFogo();
  const p = janela.posturaDeManobra(janela.retratoDoFogo());
  assert.equal(p.k, 'sem-dados');
  assert.equal(p.frontal, true, 'não se interdita o que não se sabe');
  assert.equal(p.verbo, 'Dominar');
});

/* ---- o defeito, no caso exato em que aparecia ---- */

test('com a cabeça interdita, o objetivo deixa de prometer dominar a frente',
  semAplicacao, () => {
    comJanela();
    comFogo('3192', '20');
    const p = plano();
    assert.doesNotMatch(p.objetivo, /\bDominar\b/,
      'era isto: o objetivo dizia «Dominar as frentes ativas e fechar o perímetro»');
    assert.match(p.objetivo, /Conter/);
    assert.match(p.objetivo, /pelos flancos e pela retaguarda/, 'e diz por onde se fecha');
  });

test('a ação decisiva diz o mesmo que a proposta, e diz porquê', semAplicacao, () => {
  comJanela();
  comFogo('3192', '20');
  const p = plano();
  const dec = p.missoes[0];
  assert.equal(dec.tipo, 'Ação decisiva');
  assert.doesNotMatch(dec.texto, /\bDominar\b/);
  // O `toLocaleString("pt-PT")` separa milhares com espaço **insecável**, e não com o
  // espaço normal que se escreve no teclado.
  assert.match(dec.texto, /31[\s\u00a0\u202f]920 kW\/m/,
    'quem lê a ação decisiva tem de saber porque é «conter», sem cruzar com as propostas');

  const lim = p.propostas.find((x) => /^LIM-/.test(x.ch));
  assert.equal(lim.ch, 'LIM-INTERDITO', 'e a proposta tem de concordar');
});

test('nenhuma das quatro posturas produz um plano que se contradiga', semAplicacao, () => {
  comJanela();
  for (const [r, w] of [[60, 4], [300, 8], [600, 10], [3192, 20]]) {
    comFogo(String(r), String(w));
    const c = coerencia(plano());
    assert.equal(c.falhas.join(' | '), '', `postura ${c.postura}`);
  }
});

test('sem comportamento do fogo o plano continua a dizer o que sempre disse', semAplicacao, () => {
  // A postura não inventa restrições onde não há número: só as impõe quando há.
  comJanela();
  comFogo();
  const p = plano();
  assert.match(p.objetivo, /Dominar/);
  assert.equal(coerencia(p).falhas.join(' | '), '');
});

/* ---- a auditoria vê mesmo, e não passa por não olhar ---- */

test('uma missão que prometa dominar a frente interdita é apanhada', semAplicacao, () => {
  comJanela();
  comFogo('3192', '20');
  const p = plano();
  const forjado = { objetivo: p.objetivo,
    missoes: [{ tipo: 'Ação decisiva', texto: 'Dominar as frentes ativas e fechar o perímetro.' }] };
  const c = coerencia(forjado);
  assert.equal(c.postura, 'interdito');
  assert.match(c.falhas.join(' | '), /promete dominar a frente/,
    'se a auditoria não visse isto, não valia nada');
});

test('uma missão que preveja ataque à cabeça interdito é apanhada', semAplicacao, () => {
  comJanela();
  comFogo('3192', '20');
  const c = coerencia({ missoes: [{ tipo: 'Ação de moldagem',
    texto: 'Ataque direto à cabeça com autotanques a partir do caminho florestal.' }] });
  assert.match(c.falhas.join(' | '), /ataque direto à cabeça, que está interdito/);
});

test('a frase da própria proposta não é lida como contradição', semAplicacao, () => {
  // «Ataque à cabeça apenas por meios aéreos» contém as palavras e não é uma promessa de
  // ataque frontal. Uma auditoria que a apanhasse acusaria o plano de se contradizer consigo
  // próprio sempre que estivesse correto.
  comJanela();
  comFogo('3192', '20');
  const c = coerencia({ missoes: [{ tipo: 'Ação decisiva',
    texto: 'Conter pelos flancos. O ataque direto à cabeça é inadmissível a esta intensidade.' }] });
  assert.equal(c.falhas.join(' | '), '');
});

test('com a cabeça admissível, «dominar» não é falha nenhuma', semAplicacao, () => {
  comJanela();
  comFogo('60', '4');
  const c = coerencia({ missoes: [{ tipo: 'Ação decisiva', texto: 'Dominar as frentes ativas.' }] });
  assert.equal(c.postura, 'manual');
  assert.equal(c.falhas.join(' | '), '');
});

/* ---- o fundamento que não se lia ---- */

test('sem previsão, o fundamento da vigilância não sai com traços no lugar dos números',
  semAplicacao, () => {
    // Saía «Máxima de — °C em — — a fase crítica exige equipas frescas», num documento
    // aprovado. Um fundamento que não se lê é pior do que um genérico: parece que houve
    // leitura e não houve.
    janela.eval('SERIE = []; ANALISE = null;');
    comFogo();
    const vig = plano().propostas.find((x) => x.ch === 'VIGIA');
    assert.ok(vig, 'a proposta de vigilância aparece sempre');
    assert.doesNotMatch(vig.fundamento, /—\s*°C/, 'e o fundamento tem de se ler');
    assert.match(vig.fundamento, /Sem previsão carregada/);
  });
