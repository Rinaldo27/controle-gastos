import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAVE, RepositorioLocalStorage } from '../../../src/js/data/repositorioLocalStorage.js';
import { atualizarLancamento, criarLancamento } from '../../../src/js/domain/lancamento.js';

function storageFalso() {
  const dados = new Map();
  return {
    getItem: (chave) => (dados.has(chave) ? dados.get(chave) : null),
    setItem: (chave, valor) => dados.set(chave, String(valor)),
  };
}

const entrada = {
  tipo: 'despesa',
  natureza: 'variavel',
  descricao: '  Mercado  ',
  valorCentavos: 2590,
  data: '2026-11-22',
  categoria: 'Alimentação',
};

test('criarLancamento gera id, remove espaços e preenche os metadados', () => {
  const l = criarLancamento(entrada, { agora: '2026-11-22T10:00:00.000Z', id: 'abc' });
  assert.equal(l.id, 'abc');
  assert.equal(l.descricao, 'Mercado');
  assert.equal(l.criadoEm, l.atualizadoEm);
  assert.equal(l.removidoEm, null);
});

test('atualizarLancamento mantém id e criadoEm e muda atualizadoEm', () => {
  const original = criarLancamento(entrada, { agora: '2026-11-22T10:00:00.000Z', id: 'abc' });
  const editado = atualizarLancamento(
    original,
    { ...entrada, valorCentavos: 9999 },
    '2026-11-23T10:00:00.000Z',
  );
  assert.equal(editado.id, 'abc');
  assert.equal(editado.criadoEm, '2026-11-22T10:00:00.000Z');
  assert.equal(editado.atualizadoEm, '2026-11-23T10:00:00.000Z');
  assert.equal(editado.valorCentavos, 9999);
});

test('salvar e listar persistem entre instâncias', async () => {
  const storage = storageFalso();
  await new RepositorioLocalStorage(storage).salvar(criarLancamento(entrada, { id: 'a' }));
  const lista = await new RepositorioLocalStorage(storage).listar();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].id, 'a');
});

test('salvar com o mesmo id substitui em vez de duplicar', async () => {
  const repo = new RepositorioLocalStorage(storageFalso());
  const original = criarLancamento(entrada, { id: 'a' });
  await repo.salvar(original);
  await repo.salvar(atualizarLancamento(original, { ...entrada, valorCentavos: 500 }));
  const lista = await repo.listar();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].valorCentavos, 500);
});

test('remover faz exclusão lógica', async () => {
  const repo = new RepositorioLocalStorage(storageFalso());
  await repo.salvar(criarLancamento(entrada, { id: 'a' }));
  assert.equal(await repo.remover('a', '2026-11-23T00:00:00.000Z'), true);
  assert.equal((await repo.listar()).length, 0);
  const todos = await repo.listar({ incluirRemovidos: true });
  assert.equal(todos.length, 1);
  assert.equal(todos[0].removidoEm, '2026-11-23T00:00:00.000Z');
  assert.equal(await repo.remover('inexistente'), false);
});

test('obter devolve o lançamento ou null', async () => {
  const repo = new RepositorioLocalStorage(storageFalso());
  await repo.salvar(criarLancamento(entrada, { id: 'a' }));
  assert.equal((await repo.obter('a')).id, 'a');
  assert.equal(await repo.obter('b'), null);
});

test('dados corrompidos ou de versão mais nova geram erro claro', async () => {
  const corrompido = storageFalso();
  corrompido.setItem(CHAVE, '{nao e json');
  await assert.rejects(new RepositorioLocalStorage(corrompido).listar(), /corrompidos/);

  const futuro = storageFalso();
  futuro.setItem(CHAVE, JSON.stringify({ schemaVersion: 99, lancamentos: [] }));
  await assert.rejects(new RepositorioLocalStorage(futuro).listar(), /versão mais nova/);
});

test('falha de gravação vira mensagem amigável', async () => {
  const storage = storageFalso();
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  await assert.rejects(
    new RepositorioLocalStorage(storage).salvar(criarLancamento(entrada, { id: 'a' })),
    /Não foi possível salvar/,
  );
});
