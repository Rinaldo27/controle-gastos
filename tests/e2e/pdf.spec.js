import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { abrirApp, aviso, irPara, semear } from './ajudantes.js';

// O PDF grava cada trecho de texto como <HEX> Tj; aqui voltamos a ler esses trechos.
function textosDoPdf(buffer) {
  const pdf = buffer.toString('latin1');
  return [...pdf.matchAll(/<([0-9A-F]+)> Tj/g)].map((m) =>
    Buffer.from(m[1], 'hex').toString('latin1'),
  );
}

test.describe('Relatório do mês em PDF', () => {
  test.beforeEach(async ({ page }) => {
    // Sem a API de compartilhar, o app usa o download comum, que dá para observar no teste.
    await page.addInitScript(() => {
      delete Navigator.prototype.share;
      delete Navigator.prototype.canShare;
    });
    await abrirApp(page, 'lancamentos');
    await semear(page);
    await irPara(page, 'resumo');
  });

  test('baixa um PDF do mês exibido com resumo e lançamentos', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('botao-relatorio-pdf').click(),
    ]);
    expect(download.suggestedFilename()).toBe('relatorio-2026-11.pdf');

    const buffer = await readFile(await download.path());
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    const textos = textosDoPdf(buffer);
    expect(textos).toContain('Relatório de novembro de 2026');
    expect(textos).toEqual(expect.arrayContaining(['Salário', 'Aluguel', 'Mercado']));
    expect(textos).toContain('R$ 5.000,00');
    expect(textos).toContain('-R$ 1.500,00');
    // A farmácia é de outubro e não deve entrar no relatório de novembro.
    expect(textos).not.toContain('Farmácia');
    await expect(aviso(page, 'Relatório salvo')).toBeVisible();
  });

  test('gera o relatório do mês que está sendo exibido', async ({ page }) => {
    await page.getByTestId('mes-anterior').click();
    await expect(page.getByTestId('mes-atual')).toHaveText('outubro de 2026');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('botao-relatorio-pdf').click(),
    ]);
    expect(download.suggestedFilename()).toBe('relatorio-2026-10.pdf');

    const textos = textosDoPdf(await readFile(await download.path()));
    expect(textos).toContain('Relatório de outubro de 2026');
    expect(textos).toContain('Farmácia');
    expect(textos).not.toContain('Salário');
  });

  test('não oferece o relatório em um mês sem lançamentos', async ({ page }) => {
    await page.getByTestId('mes-anterior').click();
    await page.getByTestId('mes-anterior').click();
    await expect(page.getByTestId('mes-atual')).toHaveText('setembro de 2026');
    await expect(page.getByTestId('botao-relatorio-pdf')).toHaveCount(0);
  });
});
