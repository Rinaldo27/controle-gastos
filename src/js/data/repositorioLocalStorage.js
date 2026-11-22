import { marcarRemovido } from '../domain/lancamento.js';

export const CHAVE = 'expense-tracker:dados';
export const SCHEMA_VERSION = 1;

export class RepositorioLocalStorage {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  #ler() {
    const bruto = this.storage.getItem(CHAVE);
    if (bruto === null) return [];

    let dados;
    try {
      dados = JSON.parse(bruto);
    } catch {
      throw new Error('Os dados salvos neste aparelho estão corrompidos.');
    }
    if (!dados || !Array.isArray(dados.lancamentos)) {
      throw new Error('Os dados salvos neste aparelho estão em um formato desconhecido.');
    }
    if (dados.schemaVersion > SCHEMA_VERSION) {
      throw new Error('Os dados foram salvos por uma versão mais nova do app. Atualize o app.');
    }
    return dados.lancamentos;
  }

  #gravar(lancamentos) {
    try {
      this.storage.setItem(CHAVE, JSON.stringify({ schemaVersion: SCHEMA_VERSION, lancamentos }));
    } catch {
      throw new Error(
        'Não foi possível salvar: o armazenamento do aparelho está cheio ou indisponível.',
      );
    }
  }

  async listar({ incluirRemovidos = false } = {}) {
    const todos = this.#ler();
    return incluirRemovidos ? todos : todos.filter((l) => !l.removidoEm);
  }

  async obter(id) {
    return this.#ler().find((l) => l.id === id) ?? null;
  }

  async salvar(lancamento) {
    await this.salvarVarios([lancamento]);
  }

  async salvarVarios(lancamentos) {
    const porId = new Map(this.#ler().map((l) => [l.id, l]));
    for (const lancamento of lancamentos) porId.set(lancamento.id, lancamento);
    this.#gravar([...porId.values()]);
  }

  async remover(id, agora = new Date().toISOString()) {
    const todos = this.#ler();
    const indice = todos.findIndex((l) => l.id === id);
    if (indice < 0) return false;
    todos[indice] = marcarRemovido(todos[indice], agora);
    this.#gravar(todos);
    return true;
  }
}
