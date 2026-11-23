// O deploy troca esta versão automaticamente (ver .github/workflows/publicar.yml).
// Ao rodar localmente, altere-a à mão se quiser forçar a atualização do cache.
const VERSAO = 'dev';
const CACHE = `expense-tracker-${VERSAO}`;

// Lista manual: ao criar ou renomear arquivos do app, atualize-a (o teste tests/pwa.test.js confere).
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/domain/categorias.js',
  './js/domain/datas.js',
  './js/domain/formato.js',
  './js/domain/lancamento.js',
  './js/domain/regras.js',
  './js/domain/validacao.js',
  './js/data/backup.js',
  './js/data/repositorio.js',
  './js/data/repositorioLocalStorage.js',
  './js/data/preferencias.js',
  './js/ui/ajustes.js',
  './js/ui/bannerInstalacao.js',
  './js/ui/avisos.js',
  './js/ui/confirmar.js',
  './js/ui/dom.js',
  './js/ui/formulario.js',
  './js/ui/graficos.js',
  './js/ui/lancamentos.js',
  './js/ui/relatorios.js',
  './js/ui/resumo.js',
  './js/pwa/instalacao.js',
  './js/pwa/registro.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ARQUIVOS.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nome of await caches.keys()) {
        if (nome.startsWith('expense-tracker-') && nome !== CACHE) await caches.delete(nome);
      }
      await self.clients.claim();
    })(),
  );
});

// A versão nova só assume quando o usuário toca em "Atualizar" (evita trocar o app no meio de um uso).
self.addEventListener('message', (evento) => {
  if (evento.data?.tipo === 'PULAR_ESPERA') self.skipWaiting();
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  evento.respondWith(
    (async () => {
      const emCache = await caches.match(request, { ignoreSearch: true });
      if (emCache) return emCache;
      try {
        return await fetch(request);
      } catch (erro) {
        if (request.mode === 'navigate') return caches.match('./index.html');
        throw erro;
      }
    })(),
  );
});
