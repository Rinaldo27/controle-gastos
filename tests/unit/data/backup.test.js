import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportarDados, importarDados, lerBackup } from '../../../src/js/data/backup.js';
import { RepositorioLocalStorage } from '../../../src/js/data/repositorioLocalStorage.js';
import { atualizarLancamento, criarLancamento } from '../../../src/js/domain/lancamento.js';

function repositorioVazio() {
  const dados = new Map();
  return new RepositorioLocalStorage({
    getItem: (chave) => (dados.has(chave) ? dados.get(chave) : null),
    setItem: (chave, valor) => dados.set(chave, String(valor)),
  });
}

const entrada = {
  tipo: 'receita',
  natureza: 'fixa',
  descricao: 'Salário',
  valorCentavos: 500000,
  data: '2026-11-05',
  categoria: 'Salário',
};

test('exportar inclui lançamentos removidos e metadados', async () => {
  const repo = repositorioVazio();
  await repo.salvar(criarLancamento(entrada, { id: 'a' }));
  await repo.salvar(criarLancamento(entrada, { id: 'b' }));
  await repo.remover('b');
  const backup = await exportarDados(repo, '2026-11-22T00:00:00.000Z');
  assert.equal(backup.app, 'expense-tracker');
  assert.equal(backup.schemaVersion, 1);
  assert.equal(backup.lancamentos.length, 2);
});

test('exportar e importar em outro repositório preserva os dados', async () => {
  const origem = repositorioVazio();
  await origem.salvar(criarLancamento(entrada, { id: 'a' }));
  const texto = JSON.stringify(await exportarDados(origem));

  const destino = repositorioVazio();
  assert.deepEqual(await importarDados(destino, texto), { importados: 1, ignorados: 0 });
  assert.deepEqual(await destino.listar(), await origem.listar());
});

test('importar mantém o registro local quando ele é mais novo', async () => {
  const repo = repositorioVazio();
  const antigo = criarLancamento(entrada, { id: 'a', agora: '2026-11-01T00:00:00.000Z' });
  const novo = atualizarLancamento(
    antigo,
    { ...entrada, valorCentavos: 700000 },
    '2026-11-10T00:00:00.000Z',
  );
  await repo.salvar(novo);

  const texto = JSON.stringify({ app: 'expense-tracker', schemaVersion: 1, lancamentos: [antigo] });
  assert.deepEqual(await importarDados(repo, texto), { importados: 0, ignorados: 1 });
  assert.equal((await repo.obter('a')).valorCentavos, 700000);
});

test('importar substitui o registro local quando o do backup é mais novo', async () => {
  const repo = repositorioVazio();
  const antigo = criarLancamento(entrada, { id: 'a', agora: '2026-11-01T00:00:00.000Z' });
  const novo = atualizarLancamento(
    antigo,
    { ...entrada, valorCentavos: 700000 },
    '2026-11-10T00:00:00.000Z',
  );
  await repo.salvar(antigo);

  const texto = JSON.stringify({ app: 'expense-tracker', schemaVersion: 1, lancamentos: [novo] });
  assert.deepEqual(await importarDados(repo, texto), { importados: 1, ignorados: 0 });
  assert.equal((await repo.obter('a')).valorCentavos, 700000);
});

test('lerBackup rejeita arquivos inválidos com mensagem clara', () => {
  assert.throws(() => lerBackup('não é json'), /JSON válido/);
  assert.throws(() => lerBackup('{"app":"outro","lancamentos":[]}'), /não é um backup/);
  assert.throws(
    () => lerBackup('{"app":"expense-tracker","schemaVersion":99,"lancamentos":[]}'),
    /versão mais nova/,
  );
  assert.throws(() => lerBackup('null'), /não é um backup/);
});

test('lerBackup rejeita lançamento com dados incorretos', () => {
  const ruim = { ...criarLancamento(entrada, { id: 'a' }), valorCentavos: -5 };
  const texto = JSON.stringify({ app: 'expense-tracker', schemaVersion: 1, lancamentos: [ruim] });
  assert.throws(() => lerBackup(texto), /lançamento 1/);
});

test('lerBackup descarta campos desconhecidos', () => {
  const comExtra = { ...criarLancamento(entrada, { id: 'a' }), campoMalicioso: '<script>' };
  const texto = JSON.stringify({
    app: 'expense-tracker',
    schemaVersion: 1,
    lancamentos: [comExtra],
  });
  assert.equal('campoMalicioso' in lerBackup(texto)[0], false);
});
