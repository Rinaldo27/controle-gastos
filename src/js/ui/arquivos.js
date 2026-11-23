import { h } from './dom.js';

function baixar(arquivo) {
  const url = URL.createObjectURL(arquivo);
  const link = h('a', { href: url, download: arquivo.name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// No celular, o menu de compartilhar permite salvar no Arquivos/Drive ou enviar por mensagem.
// Devolve true quando o arquivo foi baixado (e não compartilhado ou cancelado).
export async function entregarArquivo(arquivo, titulo) {
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: titulo });
      return false;
    } catch (erro) {
      if (erro.name === 'AbortError') return false;
    }
  }
  baixar(arquivo);
  return true;
}
