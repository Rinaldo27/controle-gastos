function gerarId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function camposEditaveis(entrada) {
  return {
    tipo: entrada.tipo,
    natureza: entrada.natureza,
    descricao: entrada.descricao.trim(),
    valorCentavos: entrada.valorCentavos,
    data: entrada.data,
    categoria: entrada.categoria,
  };
}

// Valores em centavos (inteiros) e exclusão lógica (removidoEm) preparam o terreno para sincronizar depois.
export function criarLancamento(
  entrada,
  { agora = new Date().toISOString(), id = gerarId() } = {},
) {
  return {
    id,
    ...camposEditaveis(entrada),
    criadoEm: agora,
    atualizadoEm: agora,
    removidoEm: null,
  };
}

export function atualizarLancamento(existente, entrada, agora = new Date().toISOString()) {
  return { ...existente, ...camposEditaveis(entrada), atualizadoEm: agora };
}

export function marcarRemovido(lancamento, agora = new Date().toISOString()) {
  return { ...lancamento, removidoEm: agora, atualizadoEm: agora };
}
