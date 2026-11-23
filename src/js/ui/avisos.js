import { h } from './dom.js';

// Mensagens temporárias. A região #avisos tem role="status", então leitores de tela anunciam o texto.
export function avisar(mensagem, { tipo = 'info', acao = null } = {}) {
  const regiao = document.getElementById('avisos');
  const aviso = h(
    'div',
    { class: `aviso aviso--${tipo}`, 'data-testid': 'aviso' },
    h('span', {}, mensagem),
  );

  if (acao) {
    aviso.append(
      h(
        'button',
        {
          type: 'button',
          class: 'botao botao--texto',
          onclick: () => {
            aviso.remove();
            acao.executar();
          },
        },
        acao.rotulo,
      ),
    );
  } else {
    setTimeout(() => aviso.remove(), 5000);
  }

  regiao.append(aviso);
  return aviso;
}
