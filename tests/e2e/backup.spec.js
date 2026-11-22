import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { abrirApp, aviso, irPara, semear } from './ajudantes.js';

test.describe('Backup', () => {
  test.beforeEach(async ({ page }) => {
    // Sem a API de compartilhar, o app usa o download comum, que dá para observar no teste.
    await page.addInitScript(() => {
      delete Navigator.prototype.share;
      delete Navigator.prototype.canShare;
    });
    await abrirApp(page, 'lancamentos');
  });

  test('exporta os dados e importa de volta após apagar tudo', async ({ page }) => {
    await semear(page);
    await irPara(page, 'ajustes');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('botao-exportar').click(),
    ]);
    expect(download.suggestedFilename()).toBe('expense-tracker-2026-11-15.json');
    const caminho = await download.path();
    const backup = JSON.parse(await readFile(caminho, 'utf8'));
    expect(backup.app).toBe('expense-tracker');
    expect(backup.lancamentos).toHaveLength(4);

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await irPara(page, 'lancamentos');
    await expect(page.getByTestId('lista-vazia')).toBeVisible();

    await irPara(page, 'ajustes');
    await page.getByTestId('arquivo-backup').setInputFiles(caminho);
    await expect(aviso(page, 'Backup importado: 4 atualizado')).toBeVisible();

    await irPara(page, 'lancamentos');
    await expect(page.getByTestId('lancamento')).toHaveCount(3);
  });

  test('importar o mesmo backup duas vezes não duplica lançamentos', async ({ page }) => {
    await semear(page);
    await irPara(page, 'ajustes');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('botao-exportar').click(),
    ]);
    await page.getByTestId('arquivo-backup').setInputFiles(await download.path());
    await expect(aviso(page, '4 já estavam em dia')).toBeVisible();

    await irPara(page, 'lancamentos');
    await expect(page.getByTestId('lancamento')).toHaveCount(3);
  });

  test('rejeita arquivos que não são backup e não altera os dados', async ({ page }) => {
    await semear(page);
    await irPara(page, 'ajustes');

    await page.getByTestId('arquivo-backup').setInputFiles({
      name: 'lixo.json',
      mimeType: 'application/json',
      buffer: Buffer.from('isto não é json'),
    });
    await expect(aviso(page, 'Backup inválido')).toBeVisible();

    await page.getByTestId('arquivo-backup').setInputFiles({
      name: 'outro.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ app: 'outro-app', lancamentos: [] })),
    });
    await expect(aviso(page, 'não é um backup')).toBeVisible();

    await irPara(page, 'lancamentos');
    await expect(page.getByTestId('lancamento')).toHaveCount(3);
  });
});
