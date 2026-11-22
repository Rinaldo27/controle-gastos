export function registrarServiceWorker({ aoHaverAtualizacao }) {
  if (!('serviceWorker' in navigator)) return;

  // Na primeira visita o service worker assume a página: nesse caso não há atualização a oferecer nem
  // recarga a fazer. Guardamos isso no início porque alguns navegadores entregam os eventos depois
  // de a página já ter sido assumida, o que faria a primeira instalação parecer uma atualização.
  const jaTinhaControlador = Boolean(navigator.serviceWorker.controller);
  let recarregando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!jaTinhaControlador || recarregando) return;
    recarregando = true;
    window.location.reload();
  });

  async function registrar() {
    try {
      const registro = await navigator.serviceWorker.register('./sw.js');

      const oferecerAtualizacao = (worker) => {
        if (worker && jaTinhaControlador) {
          aoHaverAtualizacao(() => worker.postMessage({ tipo: 'PULAR_ESPERA' }));
        }
      };

      oferecerAtualizacao(registro.waiting);
      registro.addEventListener('updatefound', () => {
        const novo = registro.installing;
        novo?.addEventListener('statechange', () => {
          if (novo.state === 'installed') oferecerAtualizacao(novo);
        });
      });
    } catch (erro) {
      console.error('Não foi possível registrar o service worker.', erro);
    }
  }

  if (document.readyState === 'complete') registrar();
  else window.addEventListener('load', registrar);
}
