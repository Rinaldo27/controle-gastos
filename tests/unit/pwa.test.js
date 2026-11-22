import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

function listar(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? listar(caminho) : [caminho];
  });
}

function arquivosDoServiceWorker() {
  const texto = readFileSync(join(SRC, 'sw.js'), 'utf8');
  const lista = texto.match(/const ARQUIVOS = \[([\s\S]*?)\];/)[1];
  return [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

test('todo arquivo listado no service worker existe (senão o cache offline falha)', () => {
  for (const url of arquivosDoServiceWorker()) {
    const caminho = url === './' ? 'index.html' : url.slice(2);
    assert.ok(existsSync(join(SRC, caminho)), `${url} não existe`);
  }
});

test('todo arquivo do app está no cache do service worker', () => {
  const noCache = new Set(
    arquivosDoServiceWorker().map((url) => (url === './' ? 'index.html' : url.slice(2))),
  );
  const faltando = listar(SRC)
    .map((caminho) => relative(SRC, caminho))
    .filter((arquivo) => arquivo !== 'sw.js' && !arquivo.startsWith('.'))
    .filter((arquivo) => !noCache.has(arquivo));
  assert.deepEqual(faltando, [], 'arquivos que faltam em ARQUIVOS (sw.js)');
});

test('o manifest aponta para ícones existentes e tem os campos de instalação', () => {
  const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.name && manifest.short_name && manifest.start_url);
  assert.ok(manifest.icons.some((i) => i.sizes === '192x192'));
  assert.ok(manifest.icons.some((i) => i.sizes === '512x512'));
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
  for (const icone of manifest.icons)
    assert.ok(existsSync(join(SRC, icone.src)), `${icone.src} não existe`);
});

test('index.html referencia manifest, ícone do iOS, CSS e script e é mobile first', () => {
  const html = readFileSync(join(SRC, 'index.html'), 'utf8');
  for (const trecho of [
    'rel="manifest"',
    'rel="apple-touch-icon"',
    'href="css/style.css"',
    'src="js/app.js"',
    'width=device-width',
    'viewport-fit=cover',
    'lang="pt-BR"',
  ]) {
    assert.ok(html.includes(trecho), `index.html deveria conter ${trecho}`);
  }
});

test('todos os data-testid usados pelo JS e HTML são únicos no HTML estático', () => {
  const html = readFileSync(join(SRC, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/data-testid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'data-testid repetido no index.html');
});
