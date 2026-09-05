// Configuração do ESLint.
//
// O alvo principal é o JavaScript extraído da aplicação, colocado em `.tmp/app.js`
// por `ferramentas/lint.mjs`. Duas regras justificam sozinhas esta configuração:
// `no-undef` apanha a chamada a uma função que já não existe, e `no-unused-vars`
// apanha a função que ficou órfã. Foi essa a regressão registada na especificação.
//
// Uma função chamada apenas a partir de um atributo do HTML, como `onclick`, é
// invisível ao ESLint. Nesse caso, declarar no código: /* exported nomeDaFuncao */

import js from '@eslint/js';

/** Globais do navegador usados pela aplicação. */
const navegador = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  history: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  Headers: 'readonly',
  AbortController: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  BroadcastChannel: "readonly", HTMLInputElement: "readonly", HTMLElement: "readonly", HTMLTableElement: "readonly", Element: "readonly", indexedDB: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  queueMicrotask: 'readonly',
  structuredClone: 'readonly',
  performance: 'readonly',
  crypto: 'readonly',
  alert: 'readonly',
  confirm: 'readonly',
  prompt: 'readonly',
  print: 'readonly',
  matchMedia: 'readonly',
  CSS: 'readonly',
  getComputedStyle: 'readonly',
  Blob: 'readonly',
  File: 'readonly',
  FileReader: 'readonly',
  FormData: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  DOMParser: 'readonly',
  XMLSerializer: 'readonly',
  XMLHttpRequest: 'readonly',
  Image: 'readonly',
  Event: 'readonly',
  CustomEvent: 'readonly',
  MutationObserver: 'readonly',
  ResizeObserver: 'readonly',
  IntersectionObserver: 'readonly',
  Intl: 'readonly',
  storage: 'readonly',
};

export default [
  // `app/` e `fonte/` analisam-se pelo ficheiro montado, em `.tmp/app.js`: as funções
  // publicadas em window atravessam módulos, e analisá-los à peça daria falso positivo.
  { ignores: ['node_modules/**', 'app/**', 'fonte/**'] },

  // A aplicação, extraída do HTML. Script clássico, não módulo.
  {
    files: ['.tmp/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: navegador,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-implicit-globals': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // Ferramentas e testes. Módulos de Node.
  {
    files: ['ferramentas/**/*.mjs', 'tests/**/*.mjs', 'eslint.config.mjs'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        globalThis: 'readonly',
        URL: 'readonly',
        // Os temporizadores são globais em Node como no navegador, e os testes usam-nos
        // para esperar pelo que é assíncrono de propósito — a gravação do diário, a
        // resposta a um clique.
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Global em Node desde a v11, e usado nos testes para deixar correr a fila de
        // microtarefas antes de afirmar sobre o que uma promessa já resolveu.
        queueMicrotask: 'readonly',
        // O código dentro de page.evaluate() corre no navegador, não em Node.
        window: 'readonly',
        document: 'readonly',
        BroadcastChannel: "readonly", HTMLInputElement: "readonly", HTMLElement: "readonly", HTMLTableElement: "readonly", Element: "readonly", indexedDB: 'readonly',
        structuredClone: 'readonly',
        Response: 'readonly',
      },
    },
  },
];
