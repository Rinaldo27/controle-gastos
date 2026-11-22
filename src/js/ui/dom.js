function adicionar(elemento, filhos) {
  for (const filho of filhos.flat(Infinity)) {
    if (filho == null || filho === false) continue;
    elemento.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
}

// Cria elementos sem innerHTML: textos entram como nós de texto, então nada digitado pelo usuário vira HTML.
export function h(tag, atributos = {}, ...filhos) {
  const elemento = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    if (valor === false || valor == null) continue;
    if (nome.startsWith('on') && typeof valor === 'function') {
      elemento.addEventListener(nome.slice(2), valor);
    } else {
      elemento.setAttribute(nome, valor === true ? '' : valor);
    }
  }
  adicionar(elemento, filhos);
  return elemento;
}

export function secao(titulo, ...conteudo) {
  return h('section', { class: 'secao' }, h('h2', {}, titulo), ...conteudo);
}

export function vazio(mensagem, testid) {
  return h('p', { class: 'vazio', 'data-testid': testid }, mensagem);
}
