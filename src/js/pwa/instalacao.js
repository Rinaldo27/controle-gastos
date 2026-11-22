let eventoInstalacao = null;

// O Android (Chrome) avisa quando o app pode ser instalado; o iOS nunca avisa, e a instalação é manual.
export function iniciarInstalacao(aoMudar) {
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    eventoInstalacao = evento;
    aoMudar();
  });
  window.addEventListener('appinstalled', () => {
    eventoInstalacao = null;
    aoMudar();
  });
}

export function estaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export function ehIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function podeInstalarNativamente() {
  return eventoInstalacao !== null;
}

export async function instalar() {
  if (!eventoInstalacao) return false;
  eventoInstalacao.prompt();
  const { outcome } = await eventoInstalacao.userChoice;
  eventoInstalacao = null;
  return outcome === 'accepted';
}
