import { gravarPreferencia, lerPreferencia } from '../data/preferencias.js';
import { ehIOS, estaInstalado, instalar, podeInstalarNativamente } from '../pwa/instalacao.js';

const PREFERENCIA = 'banner-instalar-dispensado';

// Android: o navegador avisa quando dá para instalar. iPhone: nunca avisa, então só orientamos.
export function iniciarBannerInstalacao() {
  const banner = document.getElementById('banner-instalar');
  const texto = document.getElementById('banner-instalar-texto');
  const instalarAgora = document.getElementById('banner-instalar-sim');
  const dispensar = document.getElementById('banner-instalar-nao');

  function atualizar() {
    const noAndroid = podeInstalarNativamente();
    const noIPhone = ehIOS() && !noAndroid;
    const mostrar =
      !estaInstalado() && lerPreferencia(PREFERENCIA) !== '1' && (noAndroid || noIPhone);

    banner.hidden = !mostrar;
    if (!mostrar) return;

    instalarAgora.hidden = !noAndroid;
    dispensar.textContent = noAndroid ? 'Agora não' : 'Entendi';
    texto.textContent = noAndroid
      ? 'Instale o app para abrir direto da tela inicial, em tela cheia e sem internet.'
      : 'Para instalar no iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.';
  }

  instalarAgora.addEventListener('click', async () => {
    await instalar();
    atualizar();
  });
  dispensar.addEventListener('click', () => {
    gravarPreferencia(PREFERENCIA, '1');
    atualizar();
  });

  return { atualizar };
}
