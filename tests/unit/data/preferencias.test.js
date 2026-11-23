import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { gravarPreferencia, lerPreferencia } from '../../../src/js/data/preferencias.js';

afterEach(() => {
  delete globalThis.localStorage;
});

test('guarda e lê preferências com um prefixo próprio, longe dos lançamentos', () => {
  const memoria = new Map();
  globalThis.localStorage = {
    getItem: (chave) => (memoria.has(chave) ? memoria.get(chave) : null),
    setItem: (chave, valor) => memoria.set(chave, String(valor)),
  };

  assert.equal(lerPreferencia('banner'), null);
  gravarPreferencia('banner', '1');
  assert.equal(lerPreferencia('banner'), '1');
  assert.ok([...memoria.keys()].every((chave) => chave.startsWith('expense-tracker:pref:')));
});

test('sem armazenamento disponível não quebra: lê nulo e ignora a gravação', () => {
  globalThis.localStorage = {
    getItem() {
      throw new Error('bloqueado');
    },
    setItem() {
      throw new Error('cheio');
    },
  };

  assert.equal(lerPreferencia('banner'), null);
  assert.doesNotThrow(() => gravarPreferencia('banner', '1'));
});
