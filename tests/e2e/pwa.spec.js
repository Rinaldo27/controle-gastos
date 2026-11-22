import { test, expect } from '@playwright/test';
import { abrirApp, irPara, lancar } from './ajudantes.js';

test.describe('PWA', () => {
  test('declara manifest instalável e ícone para o iOS', async ({ page }) => {
    await abrirApp(page);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);

    const manifest = await page.evaluate(async () => (await fetch('manifest.webmanifest')).json());
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((i) => i.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    );
  });

  test('Ajustes orienta a instalação conforme o aparelho', async ({ page, browserName }) => {
    await abrirApp(page, 'ajustes');
    await expect(page.getByRole('heading', { name: /Instalar/ })).toBeVisible();
    if (browserName === 'webkit') {
      await expect(page.getByText('Adicionar à Tela de Início')).toBeVisible();
      await expect(page.getByText('separados do Safari')).toBeVisible();
    }
  });

  test('a primeira visita não oferece uma "nova versão"', async ({ page }) => {
    await abrirApp(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    // Espera os eventos tardios do navegador: o aviso falso aparecia depois da instalação.
    await page.waitForTimeout(500);
    await expect(page.getByTestId('aviso').filter({ hasText: 'nova versão' })).toHaveCount(0);
  });

  test('funciona sem internet depois da primeira visita', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Service worker offline é validado no Chromium.');

    await abrirApp(page, 'lancamentos');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true);

    await lancar(page, {
      descricao: 'Mercado',
      valor: '10',
      data: '2026-11-10',
      categoria: 'Alimentação',
    });

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('lancamento')).toHaveCount(1);
    await irPara(page, 'resumo');
    await expect(page.getByTestId('total-despesas')).toBeVisible();
    await context.setOffline(false);
  });

  test('o cache offline contém todos os arquivos do app', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Cache Storage é validado no Chromium.');

    await abrirApp(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    const resultado = await page.evaluate(async () => {
      const [nome] = await caches.keys();
      const cache = await caches.open(nome);
      return { nome, total: (await cache.keys()).length };
    });
    expect(resultado.nome).toMatch(/^expense-tracker-/);
    expect(resultado.total).toBeGreaterThanOrEqual(29);
  });
});
