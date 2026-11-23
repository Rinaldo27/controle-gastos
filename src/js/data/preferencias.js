// Preferências da interface (ex.: "não mostrar de novo"). Ficam separadas dos lançamentos e do backup.
const PREFIXO = 'expense-tracker:pref:';

export function lerPreferencia(nome) {
  try {
    return localStorage.getItem(PREFIXO + nome);
  } catch {
    return null;
  }
}

export function gravarPreferencia(nome, valor) {
  try {
    localStorage.setItem(PREFIXO + nome, valor);
  } catch {
    // Sem armazenamento disponível: a preferência só vale até recarregar a página.
  }
}
