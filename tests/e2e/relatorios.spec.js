import { test, expect } from '@playwright/test';
import { abrirApp, irPara, semear } from './ajudantes.js';

test.describe('Relatórios', () => {
  test.beforeEach(async ({ page }) => {
    await abrirApp(page, 'lancamentos');
    await semear(page);
    await irPara(page, 'relatorios');
  });

  test('mostra os últimos 6 meses e permite trocar o período', async ({ page }) => {
    const linhas = page.locator('[data-testid="tabela-historico"] tbody tr');
    await expect(linhas).toHaveCount(6);
    await expect(linhas.first()).toContainText('nov/26');
    await expect(page.getByTestId('grafico-evolucao')).toBeVisible();

    await page.locator('#filtro-periodo').selectOption('12');
    await expect(linhas).toHaveCount(12);
    await page.locator('#filtro-periodo').selectOption('3');
    await expect(linhas).toHaveCount(3);
  });

  test('o total do histórico soma receitas e despesas dos meses', async ({ page }) => {
    const total = page.locator('[data-testid="tabela-historico"] tfoot tr');
    await expect(total).toContainText('5.000,00');
    await expect(total).toContainText('1.910,40');
    await expect(total).toContainText('3.089,60');
  });

  test('filtra o histórico por categoria', async ({ page }) => {
    await page.locator('#filtro-categoria-relatorio').selectOption('Saúde');
    const total = page.locator('[data-testid="tabela-historico"] tfoot tr');
    await expect(total).toContainText('89,90');
    await expect(total).not.toContainText('5.000,00');
  });
});
