export function confirmar({ titulo, mensagem, rotuloConfirmar = 'Confirmar' }) {
  const dialogo = document.getElementById('dialogo-confirmacao');
  document.getElementById('confirmacao-titulo').textContent = titulo;
  document.getElementById('confirmacao-mensagem').textContent = mensagem;
  document.getElementById('confirmacao-ok').textContent = rotuloConfirmar;

  return new Promise((resolver) => {
    dialogo.returnValue = '';
    dialogo.addEventListener('close', () => resolver(dialogo.returnValue === 'sim'), {
      once: true,
    });
    dialogo.showModal();
  });
}
