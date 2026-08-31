// O manual, e o guarda que o impede de apodrecer.
//
// Este manual nasceu porque o autor do projeto não deu com uma funcionalidade que existia.
// Seria irónico que o manual passasse, ele próprio, a mandar procurar coisas que já não
// estão no ecrã — e é isso que o verificador impede.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const correr = promisify(execFile);
const md = await readFile('docs/MANUAL.md', 'utf8');

test('todo o rótulo citado pelo manual existe na entrega', async () => {
  /* O mesmo que `npm run manual`, aqui para falhar com os outros testes e não só na
     montagem. */
  const { stdout } = await correr('node', ['ferramentas/manual.mjs']);
  assert.match(stdout, /0 sem correspondência/, stdout);
});

test('o manual cobre as tarefas que a aplicação faz', () => {
  /* Uma lista de tarefas operacionais que têm de estar explicadas. Não é exaustiva de
     propósito: é o mínimo por que alguém procura quando chega ao posto e não conhece a
     aplicação. Funcionalidade nova que caia numa destas obriga a rever o manual. */
  ['coordenadas', 'perímetro', 'limite de um setor', 'frente', 'linha de contenção',
    'carta', 'relevo', 'meteorologia', 'intensidade', 'evolução', 'comunicações',
    'PEA', 'passagem de turno', 'Encerrar']
    .forEach((t) => assert.ok(new RegExp(t, 'i').test(md), 'o manual não fala de: ' + t));
});

test('o manual diz o que a aplicação recusa fazer', () => {
  /* É a parte que não se pode perder: um manual que só diga o que a aplicação faz deixa
     quem lê a supor que ela faz o resto. */
  assert.match(md, /recusa fazer/i);
  ['a que horas o fogo chega', 'quantos hectares', 'razão declive\\/vento',
    'serviço de cartografia', 'sub-região SIRESP']
    .forEach((t) => assert.ok(new RegExp(t, 'i').test(md), 'não declara que não faz: ' + t));
});

test('o manual não promete hora de chegada nem área ardida', () => {
  /* O mesmo teste que a leitura da evolução tem, aplicado ao manual: se um dia alguém
     escrever aqui que a aplicação prevê quando o fogo chega, isto apanha. */
  const semTabela = md.replace(/\|[^\n]*\|/g, '');
  [/prevê a hora a que/i, /estima a área ardida/i, /diz quando o fogo/i]
    .forEach((re) => assert.ok(!re.test(semTabela), 'o manual prometeu o que a aplicação não faz: ' + re));
});

test('as aspas angulares são só para rótulos do ecrã', () => {
  /* A disciplina de que o verificador depende. Se as angulares passarem a servir de ênfase,
     o verificador começa a acusar prosa e deixa de se acreditar nele. */
  const semCodigo = md.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  const citados = [...semCodigo.matchAll(/«([^»]+)»/g)].map((m) => m[1].replace(/\s+/g, ' ').trim());
  assert.ok(citados.length > 20, 'o manual quase não cita rótulos: ' + citados.length);
  citados.forEach((c) => {
    assert.ok(c.length < 70, 'rótulo longo de mais para ser um rótulo: «' + c + '»');
    assert.ok(!/[.;]$/.test(c), 'isto parece uma frase e não um rótulo: «' + c + '»');
  });
});
