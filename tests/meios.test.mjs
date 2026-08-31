// A posição dos meios no mapa.
//
// Na carta anotada do PCO os meios estão desenhados onde estão. No dispositivo desta
// aplicação já lá estavam — cada unidade com tipologia, entidade e hora de empenhamento —
// mas sem coordenada. O que a posição destrava é a pergunta que a carta responde de
// relance: quem fica do lado errado da frente.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));

function comDispositivo() {
  janela.eval('O = novoEstado(); SERIE = []');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,0975'; O.meta.lon = '-7,8103';
  const e = janela.estObj(); e.n = 2;
  janela.renderSetores();
  /* Duas unidades no Alfa e uma no Bravo, como se as tivessem atribuído pelo quadro. */
  const nova = (t, ent) => ({ id: 'u' + Math.random().toString(36).slice(2, 9), t, ent,
    mu: 1, ou: 5, mr: 0, ar: 0, ts: Date.now(), lat: null, lon: null, posG: '', posPor: '' });
  e.setores[0].tip.push(nova('GRIR', 'Guarda'), nova('CATE', 'Viseu'));
  e.setores[1].tip.push(nova('BRIR', 'BSE'));
  return O;
}

beforeEach(async () => { if (janela) await janela.largarTeclado(); });

/* ---- o inventário não se duplica ---- */

test('posicionar não cria um segundo inventário: dá coordenada ao que já está contado', semAplicacao, () => {
  /* Um dispositivo contado em dois sítios acaba a contar dois números diferentes, e a fase
     do SGO depende dessa contagem. */
  comDispositivo();
  const antes = janela.meiosDoDispositivo().length;
  const m = janela.meiosDoDispositivo()[0];
  assert.ok(janela.posicionarMeio(m.it.id, 41.10, -7.81).ok);
  assert.equal(janela.meiosDoDispositivo().length, antes, 'o dispositivo mudou de tamanho');
  assert.equal(janela.meiosPosicionados().length, 1);
});

test('o meio conhece-se pela tipologia com a entidade, como na rádio', semAplicacao, () => {
  comDispositivo();
  const nomes = daqui(janela.meiosDoDispositivo().map((m) => m.nome));
  assert.deepEqual(nomes, ['GRIR Guarda', 'CATE Viseu', 'BRIR BSE']);
  /* sem entidade fica a tipologia sozinha, que é o que há */
  assert.equal(janela.nomeDoMeio({ t: 'UEPS', ent: '' }), 'UEPS');
});

test('a posição prende-se ao identificador da unidade, e não ao lugar na lista', semAplicacao, () => {
  /* As unidades mudam de setor. Um identificador que fosse «a terceira do Alfa» apontava
     para outra unidade assim que alguém movesse a primeira, e a coordenada passava para a
     unidade errada — em silêncio. */
  const O = comDispositivo();
  const e = janela.estObj();
  const alvo = e.setores[0].tip[1];              /* CATE Viseu */
  janela.posicionarMeio(alvo.id, 41.10, -7.81);
  /* move-se a primeira do Alfa para o Bravo, como o quadro permite */
  const [movida] = e.setores[0].tip.splice(0, 1);
  e.setores[1].tip.push(movida);
  const posto = janela.meiosPosicionados();
  assert.equal(posto.length, 1);
  assert.equal(posto[0].nome, 'CATE Viseu', 'a coordenada mudou de dono');
  assert.equal(posto[0].setor, 0, 'e continua no setor onde está');
  assert.ok(O.evolucao.some((x) => /CATE Viseu posicionado no Setor Alfa/.test(x.txt)));
});

test('posicionar regista quando e por quem', semAplicacao, () => {
  /* Uma posição de há seis horas não vale o mesmo que uma de há dez minutos. */
  comDispositivo();
  const m = janela.meiosDoDispositivo()[0];
  const r = janela.posicionarMeio(m.it.id, 41.10, -7.81);
  assert.ok(r.meio.posG, 'sem GDH da posição');
  assert.equal(r.meio.lat, 41.1);
});

test('uma coordenada que não é número é recusada', semAplicacao, () => {
  comDispositivo();
  const m = janela.meiosDoDispositivo()[0];
  assert.equal(janela.posicionarMeio(m.it.id, NaN, -7.81).ok, false);
  assert.equal(janela.posicionarMeio('inexistente', 41.1, -7.8).ok, false);
});

test('retirar a posição não retira o meio do dispositivo', semAplicacao, () => {
  comDispositivo();
  const m = janela.meiosDoDispositivo()[0];
  janela.posicionarMeio(m.it.id, 41.10, -7.81);
  assert.ok(janela.despositionarMeio(m.it.id).ok);
  assert.equal(janela.meiosPosicionados().length, 0);
  assert.equal(janela.meiosDoDispositivo().length, 3, 'o meio saiu do dispositivo');
  assert.equal(janela.despositionarMeio(m.it.id).ok, false, 'retirou o que já não havia');
});

test('com o registo encerrado não se posiciona nem se despositiona', semAplicacao, () => {
  comDispositivo();
  const m = janela.meiosDoDispositivo()[0];
  janela.posicionarMeio(m.it.id, 41.10, -7.81);
  const O = avaliar(janela, 'O');
  O.encerramento.g = '311200AGO26'; O.encerramento.por = 'Cmdt A';
  assert.equal(janela.posicionarMeio(m.it.id, 41.2, -7.7).ok, false);
  assert.equal(janela.despositionarMeio(m.it.id).ok, false);
  O.encerramento.g = ''; O.encerramento.por = '';
});

/* ---- a leitura ---- */

test('a contagem de posicionados é a medida da confiança na leitura', semAplicacao, () => {
  /* Dizer «nenhum meio no corredor» com um posicionado em três diz muito menos do que
     parece. */
  comDispositivo();
  assert.deepEqual(daqui(janela.contagemPosicionados()), { total: 3, postos: 0 });
  janela.posicionarMeio(janela.meiosDoDispositivo()[0].it.id, 41.10, -7.81);
  assert.deepEqual(daqui(janela.contagemPosicionados()), { total: 3, postos: 1 });
});

test('a leitura diz quanto do dispositivo está localizado', semAplicacao, () => {
  comDispositivo();
  janela.posicionarMeio(janela.meiosDoDispositivo()[0].it.id, 41.10, -7.81);
  /* A ressalva só faz sentido quando há leitura: sem frente nenhuma traçada não há
     evolução que ler, e a aplicação di-lo em vez de dar uma lista de ressalvas sobre uma
     leitura que não existe. */
  janela.iniciarTraco(-1, 'frente');
  [[41.10, -7.82], [41.10, -7.80]].forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  const t = janela.document.getElementById('frente-tipo');
  t.innerHTML = '<option value="cabeca"></option>';
  t.value = 'cabeca';
  janela.document.getElementById('frente-rumo').value = '180';
  janela.fecharTraco();
  const L = janela.leituraDaEvolucao();
  assert.ok(L.limites.some((x) => /Dos 3 meios do dispositivo, 1 têm? posição/.test(x)),
    JSON.stringify(L.limites));
});

test('um meio no corredor da frente é destacado à parte do resto', semAplicacao, () => {
  /* Uma coisa é o fogo caminhar para uma charca, outra é caminhar para uma equipa. */
  comDispositivo();
  janela.posicionarMeio(janela.meiosDoDispositivo()[0].it.id, 41.085, -7.812);  /* a sul */
  janela.marcarPonto('agua', 41.084, -7.813, 'charca');
  janela.iniciarTraco(-1, 'frente');
  [[41.10, -7.82], [41.10, -7.80]].forEach(([la, lo]) => janela.pontoDoTraco(la, lo));
  const t = janela.document.getElementById('frente-tipo');
  t.innerHTML = '<option value="cabeca"></option>';
  t.value = 'cabeca';
  janela.document.getElementById('frente-rumo').value = '180';
  janela.fecharTraco();
  const texto = janela.leituraDaEvolucao().frentes[0].texto;
  assert.match(texto, /\*\*No corredor de progressão desta frente: GRIR Guarda a/);
  /* e continua a aparecer na lista geral, com a espécie que o distingue */
  assert.match(texto, /GRIR Guarda \(meio\)/);
});

/* ---- o estado ---- */

test('uma ocorrência da versão 21 ganha identificador em cada unidade', semAplicacao, () => {
  /* O identificador tem de ser atribuído na migração e não à primeira vez que faça falta:
     sem ele a unidade só se poderia apontar pela posição na lista. */
  const m = janela.migrarGravado({
    versao: 21, meta: { num: '2026/900' }, pco: { funcoes: [] },
    dados: { est: { n: 1, setores: [{ tip: [{ t: 'GRIR', ent: 'Guarda', ts: 1 }, { t: 'CATE', ts: 2 }] }] } },
  });
  const tip = m.dados.est.setores[0].tip;
  assert.ok(tip[0].id && tip[1].id, 'sem identificador');
  assert.notEqual(tip[0].id, tip[1].id, 'dois meios com o mesmo identificador');
  assert.equal(tip[0].lat, null, 'não se deduz onde estava um meio a partir do setor');
  assert.equal(tip[0].t, 'GRIR', 'a migração não pode perder o que lá estava');
});

test('a posição viaja na exportação', semAplicacao, () => {
  comDispositivo();
  janela.posicionarMeio(janela.meiosDoDispositivo()[0].it.id, 41.10, -7.81);
  const txt = janela.exportarOcorrencia();
  const v = JSON.parse(typeof txt === 'string' ? txt : JSON.stringify(txt));
  const tip = (v.estado || v).dados.est.setores[0].tip;
  assert.equal(tip[0].lat, 41.1);
  assert.ok(tip[0].posG);
});
