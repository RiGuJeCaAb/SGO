// Catálogo de elementos — o dispositivo humano da sub-região.
//
// Vive fora da ocorrência: não é ramo do estado, não entra no PEA nem na exportação da
// ocorrência, e sobrevive ao encerramento. E não guarda canal, porque o canal atribui-se
// no plano de comunicações e muda com a ocorrência.

import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirAplicacao, avaliar } from './app.mjs';

const janela = await abrirAplicacao();
const semAplicacao = { skip: janela ? false : 'sem revisão em app/' };
after(() => janela?.close());

const daqui = (x) => JSON.parse(JSON.stringify(x));
const catalogo = () => daqui(avaliar(janela, 'ELEMENTOS'));

beforeEach(() => {
  if (!janela) return;
  janela.eval('ELEMENTOS = []');
  janela.eval('O = novoEstado()');
});

test('um elemento precisa de nome, e mais nada', semAplicacao, async () => {
  assert.equal((await janela.guardarElemento({ entidade: 'GNR' })).ok, false);
  const r = await janela.guardarElemento({ nome: '2.º Cmdt Nuno Requeijo' });
  assert.equal(r.ok, true);
  assert.equal(r.novo, true);
  assert.equal(catalogo().length, 1);
  assert.match(catalogo()[0].g, /^\d{6}[A-Z]{3}\d{2}$/, 'sem GDH de registo');
});

test('o catálogo não tem campo de canal', semAplicacao, async () => {
  // O canal atribui-se no plano de comunicações, a partir dos que o CSREPC atribui ao
  // TO, e muda de ocorrência para ocorrência. Guardá-lo aqui seria segunda verdade.
  await janela.guardarElemento({ nome: 'Cmdt Costa', entidade: 'CB Moimenta' });
  assert.deepEqual(Object.keys(catalogo()[0]).sort(),
    ['ct', 'entidade', 'funcao', 'g', 'id', 'nome', 'nota']);
});

test('a mesma pessoa não entra duas vezes, e um campo vazio não apaga o que estava',
  semAplicacao, async () => {
    await janela.guardarElemento({ nome: 'Cmdt Costa', entidade: 'CB Moimenta', ct: '910000001' });
    const r = await janela.guardarElemento({ nome: 'Cmdt Costa', entidade: 'CB Moimenta', funcao: 'Oficial de Operações' });
    assert.equal(r.novo, false);
    assert.equal(catalogo().length, 1);
    assert.equal(catalogo()[0].ct, '910000001', 'vazio é ausência, não informação');
    assert.equal(catalogo()[0].funcao, 'Oficial de Operações');
  });

test('o mesmo nome em entidades diferentes são duas pessoas', semAplicacao, async () => {
  await janela.guardarElemento({ nome: 'Cmdt Silva', entidade: 'CB Lamego' });
  await janela.guardarElemento({ nome: 'Cmdt Silva', entidade: 'CB Tarouca' });
  assert.equal(catalogo().length, 2);
});

test('procurar acha por nome, entidade ou função', semAplicacao, async () => {
  await janela.guardarElemento({ nome: 'Cmdt Costa', entidade: 'CB Moimenta', funcao: 'Oficial de Operações' });
  await janela.guardarElemento({ nome: 'Sarg. Silva', entidade: 'GNR', funcao: 'Núcleo de Segurança' });
  assert.equal(daqui(janela.procurarElementos('gnr')).length, 1);
  assert.equal(daqui(janela.procurarElementos('operações')).length, 1);
  assert.equal(daqui(janela.procurarElementos('cmdt')).length, 1);
  assert.equal(daqui(janela.procurarElementos('')).length, 2, 'sem termo, devolve tudo');
});

test('apagar tira do catálogo e não toca na ocorrência', semAplicacao, async () => {
  await janela.guardarElemento({ nome: 'Cmdt Costa', entidade: 'CB Moimenta' });
  const id = catalogo()[0].id;
  janela.pcoObj().funcoes.push({ f: 'Oficial de Operações', nome: 'Cmdt Costa', entidade: 'CB Moimenta',
    ct: '', siresp: '', ba: '', solicitado: '', g: '251205AGO26' });
  assert.equal(await janela.apagarElemento(id), true);
  assert.equal(catalogo().length, 0);
  assert.equal(janela.pcoObj().funcoes.length, 1, 'apagar do catálogo apagou da ocorrência');
  assert.equal(await janela.apagarElemento('não existe'), false);
});

/* ---- recolher desta ocorrência ---- */

test('recolhe quem está nomeado e ainda não está no catálogo', semAplicacao, () => {
  janela.pcoObj().funcoes.push({ f: 'Oficial de Operações', nome: 'Cmdt Costa', entidade: 'CB Moimenta',
    ct: '', siresp: '', ba: '', solicitado: '', g: '' });
  const e = janela.estObj();
  e.n = 1;
  e.setores = [{ estado: 'Em curso (ativo)', cmd: 'Cmdt Ferreira', adj: 'Adj. Pinto', ct: '', m: '', o: '', tip: [] }];

  const fora = daqui(janela.elementosPorRecolher());
  assert.deepEqual(fora.map((x) => x.nome).sort(), ['Adj. Pinto', 'Cmdt Costa', 'Cmdt Ferreira']);
  assert.equal(fora.find((x) => x.nome === 'Cmdt Ferreira').funcao, 'Comandante do setor Alfa');
});

test('recolher devolve, não guarda — quem decide é o oficial', semAplicacao, () => {
  janela.pcoObj().funcoes.push({ f: 'Oficial de Operações', nome: 'Cmdt Costa', entidade: '',
    ct: '', siresp: '', ba: '', solicitado: '', g: '' });
  janela.elementosPorRecolher();
  assert.equal(catalogo().length, 0, 'guardou sozinho o que veio da ocorrência');
});

test('quem já está no catálogo não aparece por recolher', semAplicacao, async () => {
  await janela.guardarElemento({ nome: 'Cmdt Costa', entidade: 'CB Moimenta' });
  janela.pcoObj().funcoes.push({ f: 'Oficial de Operações', nome: 'Cmdt Costa', entidade: 'CB Moimenta',
    ct: '', siresp: '', ba: '', solicitado: '', g: '' });
  assert.deepEqual(daqui(janela.elementosPorRecolher()), []);
});

/* ---- fora da ocorrência ---- */

test('o catálogo não é ramo do estado, e não vai na exportação da ocorrência',
  semAplicacao, async () => {
    await janela.guardarElemento({ nome: 'Cmdt Costa', entidade: 'CB Moimenta' });
    const e = daqui(janela.novoEstado());
    assert.equal(e.elementos, undefined);
    const pacote = daqui(janela.pacoteOcorrencia());
    assert.ok(!JSON.stringify(pacote).includes('Cmdt Costa'),
      'o catálogo da sub-região viajou dentro da ocorrência');
    assert.deepEqual(daqui(janela.auditarPosse(janela.novoEstado())).orfaos, []);
  });

test('o catálogo sobrevive ao encerramento da ocorrência', semAplicacao, async () => {
  await janela.guardarElemento({ nome: 'Cmdt Costa', entidade: 'CB Moimenta' });
  const O = avaliar(janela, 'O');
  O.meta.num = '2026/4711';
  janela.estObj().n = 1;
  janela.estObj().setores = [{ estado: 'Em conclusão (extinto)', cmd: '', ct: '', adj: '', m: '', o: '', tip: [] }];
  janela.escreverForm();
  await janela.encerrarOcorrencia('Cmdt Costa');
  assert.equal(janela.encerrada(), true);
  assert.equal(catalogo().length, 1);
});
