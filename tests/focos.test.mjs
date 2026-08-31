// Focos de calor detetados por satélite.
//
// A r0072 provou, por execução, que o fogo ativo não vem por mosaicos: as camadas de
// anomalias térmicas do GIBS são mosaico vetorial, que não é imagem. Os focos são pontos, e
// um ponto reprojeta-se com a aritmética que já está escrita.
//
// O que se testa com mais cuidado é a chave de acesso, que **não pode sair no ficheiro da
// ocorrência**.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));
const VIIRS = await readFile(new URL('./fixtures/focos-viirs.csv', import.meta.url), 'utf8');
const MODIS = await readFile(new URL('./fixtures/focos-modis.csv', import.meta.url), 'utf8');

function comTeatro() {
  janela.eval('O = novoEstado(); SERIE = []');
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711'; O.meta.lat = '41,0975'; O.meta.lon = '-7,8103';
  return O;
}

beforeEach(async () => { if (janela) await janela.largarTeclado(); });

/* ---- ler o CSV ---- */

test('o CSV lê-se pelo nome das colunas, não pela posição', semAplicacao, () => {
  /* O ficheiro traz o seu próprio cabeçalho: não há nada a adivinhar. E o VIIRS e o MODIS
     não escrevem as mesmas colunas — exigir as de um recusava as do outro. */
  const v = janela.lerFocosCSV(VIIRS);
  assert.equal(v.focos.length, 4);
  assert.equal(v.semCoordenada, 1, 'a linha com latitude inválida devia ser contada e ignorada');
  const m = janela.lerFocosCSV(MODIS);
  assert.equal(m.focos.length, 3);
  assert.equal(m.focos[0].instr, 'MODIS');
});

test('sem latitude ou longitude recusa-se, e diz-se que colunas o ficheiro trazia', semAplicacao, () => {
  /* Uma mensagem que diga «formato inválido» sem dizer o que leu obriga quem está ao
     teclado a adivinhar. */
  assert.throws(() => janela.lerFocosCSV('data,hora,potencia\n2026-08-31,1412,18'),
    /Falta a coluna latitude e a longitude[\s\S]*data, hora, potencia/);
  assert.throws(() => janela.lerFocosCSV('latitude,longitude'), /não tem linhas de dados/);
});

test('a hora vem como HHMM e escreve-se como hora', semAplicacao, () => {
  /* `59` são as 00:59. Escrever «59» na leitura era dizer outra hora. */
  const v = janela.lerFocosCSV(VIIRS).focos;
  assert.equal(v[0].hora, '14:12');
  assert.equal(v[3].hora, '00:59');
});

test('a confiança dos dois sensores não se converte uma na outra', semAplicacao, () => {
  /* O VIIRS escreve l/n/h; o MODIS escreve 0 a 100. Converter um no outro seria inventar
     equivalência onde não a há, e por isso guarda-se o texto original ao lado do degrau. */
  const v = janela.lerFocosCSV(VIIRS).focos;
  assert.deepEqual(daqui(v[0].conf), { grau: 'alta', txt: 'h' });
  assert.deepEqual(daqui(v[2].conf), { grau: 'baixa', txt: 'l' });
  const m = janela.lerFocosCSV(MODIS).focos;
  assert.deepEqual(daqui(m[0].conf), { grau: 'alta', txt: '85 %' });
  assert.deepEqual(daqui(m[1].conf), { grau: 'nominal', txt: '45 %' });
  assert.deepEqual(daqui(m[2].conf), { grau: 'baixa', txt: '12 %' });
  /* e o que não se reconhece fica sem grau, com o texto à vista */
  assert.deepEqual(daqui(janela.confiancaDoFoco('desconhecido')), { grau: '', txt: 'desconhecido' });
});

/* ---- guardar ---- */

test('carregar focos substitui, não acumula', semAplicacao, () => {
  /* Uma lista de focos é uma fotografia de um instante; juntar a de agora à de há três
     horas dava um mapa com o dobro dos focos e nenhum instante. */
  const O = comTeatro();
  janela.guardarFocos(janela.lerFocosCSV(VIIRS).focos, 'viirs.csv');
  assert.equal(janela.focosLista().length, 4);
  janela.guardarFocos(janela.lerFocosCSV(MODIS).focos, 'modis.csv');
  assert.equal(janela.focosLista().length, 3, 'acumulou em vez de substituir');
  assert.equal(janela.focosObj().origem, 'modis.csv');
  assert.ok(janela.focosObj().g, 'sem GDH do carregamento');
  assert.ok(O.evolucao.some((x) => /focos de calor carregados/.test(x.txt)));
});

test('os focos retiram-se do mapa', semAplicacao, () => {
  comTeatro();
  janela.guardarFocos(janela.lerFocosCSV(VIIRS).focos, 'x');
  assert.equal(janela.esquecerFocos().n, 4);
  assert.equal(janela.focosLista().length, 0);
});

test('com o registo encerrado não se carregam nem se retiram', semAplicacao, () => {
  const O = comTeatro();
  O.encerramento.g = '311200AGO26'; O.encerramento.por = 'Cmdt A';
  assert.equal(janela.guardarFocos([], 'x').ok, false);
  assert.equal(janela.esquecerFocos().ok, false);
  O.encerramento.g = ''; O.encerramento.por = '';
});

/* ---- a chave, que é o que interessa proteger ---- */

test('a chave de acesso NÃO viaja na exportação da ocorrência', semAplicacao, async () => {
  /* Um ficheiro de ocorrência passa entre postos, vai por correio e fica arquivado. Uma
     chave lá dentro saía de casa sem ninguém dar por isso. Vive no armazém do dispositivo,
     como a declaração da carta. */
  comTeatro();
  const CHAVE = 'chave-secreta-do-posto-4711';
  await janela.guardarFocosURL('https://exemplo.test/api/area/csv/' + CHAVE + '/VIIRS/{bbox}/1');
  janela.guardarFocos(janela.lerFocosCSV(VIIRS).focos, 'viirs.csv');
  const txt = janela.exportarOcorrencia();
  const s = typeof txt === 'string' ? txt : JSON.stringify(txt);
  assert.ok(!s.includes(CHAVE), 'a chave saiu no ficheiro da ocorrência');
  assert.ok(!s.includes('exemplo.test'), 'o endereço saiu no ficheiro da ocorrência');
  /* mas os focos saem, que esses são facto sobre a ocorrência */
  const v = JSON.parse(s);
  assert.equal((v.estado || v).dados.focos.itens.length, 4);
  await janela.esquecerFocosURL();
});

test('um endereço em claro é recusado', semAplicacao, async () => {
  const r = await janela.guardarFocosURL('http://exemplo.test/api/csv/CHAVE/x');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /não viaja em claro/);
});

test('esquecer o endereço esquece a chave', semAplicacao, async () => {
  await janela.guardarFocosURL('https://exemplo.test/csv/CHAVE');
  assert.ok(avaliar(janela, 'FOCOS_URL').includes('CHAVE'));
  await janela.esquecerFocosURL();
  assert.equal(avaliar(janela, 'FOCOS_URL'), '');
});

/* ---- o endereço, que a aplicação não inventa ---- */

test('a aplicação preenche o que lhe pedirem e não reescreve o resto', semAplicacao, () => {
  /* É a mesma decisão que se tomou para a cartografia, e pela mesma razão: o modelo
     {z}/{x}/{y} foi escrito de cor, não existia naquela forma, e o campo ficou uma
     fechadura sem chave. */
  comTeatro();
  const u = janela.focosEndereco('https://x/api/{bbox}/{data}/mais?q=1');
  assert.match(u, /\/-8\.\d+,40\.\d+,-7\.\d+,41\.\d+\//, 'a caixa não foi preenchida: ' + u);
  assert.match(u, /\/\d{4}-\d{2}-\d{2}\//, 'a data não foi preenchida: ' + u);
  assert.match(u, /mais\?q=1$/, 'reescreveu o resto do endereço: ' + u);
  /* um endereço sem marcadores fica exatamente como está */
  assert.equal(janela.focosEndereco('https://x/api/csv/K/VIIRS/world/1'),
    'https://x/api/csv/K/VIIRS/world/1');
});

test('com perímetro, a caixa é a do perímetro', semAplicacao, () => {
  comTeatro();
  const d = 0.012, lat = 41.0975, lon = -7.8103;
  janela.guardarPerimetro({ type: 'Polygon', coordinates: [[[lon - d, lat - d], [lon + d, lat - d],
    [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]]] }, 'to.geojson');
  const u = janela.focosEndereco('https://x/{bbox}');
  const bb = u.split('/').pop().split(',').map(Number);
  assert.ok(Math.abs(bb[0] - (lon - d)) < 1e-4, u);
  assert.ok(Math.abs(bb[3] - (lat + d)) < 1e-4, u);
});

/* ---- a leitura ---- */

test('a leitura diz quando e com que confiança, e não só quantos', semAplicacao, () => {
  /* Cinquenta focos de baixa confiança de há oito horas dizem menos do que três de alta
     confiança de há vinte minutos. */
  comTeatro();
  janela.guardarFocos(janela.lerFocosCSV(VIIRS).focos, 'FIRMS VIIRS');
  const t = janela.leituraDosFocos();
  assert.match(t, /4 focos de calor no mapa, de FIRMS VIIRS/);
  assert.match(t, /2 de confiança alta, 1 de confiança nominal, 1 de confiança baixa/);
  assert.match(t, /Potência radiativa máxima observada: 26\.8 MW/);
  assert.match(t, /hora UTC/, 'a hora do satélite não é a nossa, e isso tem de estar dito');
});

test('a leitura recusa deixar passar um foco por incêndio confirmado', semAplicacao, () => {
  /* É a ressalva que impede o mapa de ser lido como verdade do terreno. */
  comTeatro();
  janela.guardarFocos(janela.lerFocosCSV(MODIS).focos, 'x');
  const t = janela.leituraDosFocos();
  assert.match(t, /\*\*Um foco é uma deteção, não um incêndio confirmado\*\*/);
  assert.match(t, /a ausência de focos não é ausência de fogo/);
});

test('sem focos não há leitura nenhuma', semAplicacao, () => {
  comTeatro();
  assert.equal(janela.leituraDosFocos(), '');
});

/* ---- o estado ---- */

test('uma ocorrência da versão 23 abre sem focos', semAplicacao, () => {
  const m = janela.migrarGravado({
    versao: 23, meta: { num: '2026/900' }, pco: { funcoes: [] },
    dados: { est: { n: 1, setores: [{}] } },
  });
  assert.equal(m.versao, avaliar(janela, 'VERSAO_ESTADO'));
  assert.deepEqual(daqui(m.dados.focos.itens), []);
});
