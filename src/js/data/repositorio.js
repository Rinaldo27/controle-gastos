// Contrato do repositório (todos os métodos são assíncronos):
//   listar({ incluirRemovidos }), obter(id), salvar(lancamento), salvarVarios(lancamentos), remover(id)
// O restante do app só conhece este contrato. Para usar IndexedDB ou uma API (sincronização),
// basta criar outra implementação e trocá-la aqui.
import { RepositorioLocalStorage } from './repositorioLocalStorage.js';

export function criarRepositorio() {
  return new RepositorioLocalStorage();
}
