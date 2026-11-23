import { test, expect } from '@playwright/test';
import { abrirApp, lancar } from './ajudantes.js';

test.describe('Resumo: harmonia visual', () => {
  test.beforeEach(async ({ page }) => {
    await abrirApp(page, 'resumo');
  });

  test('o botão de novo lançamento é um círculo compacto com nome acessível', async ({ page }) => {
    const botao = page.getByRole('button', { name: 'Novo lançamento' });
    await expect(botao).toBeVisible();
    const caixa = await botao.boundingBox();
    expect(caixa.width).toBeLessThanOrEqual(56);
    expect(caixa.width).toBeGreaterThanOrEqual(48);
    expect(Math.round(caixa.width)).toBe(Math.round(caixa.height));
  });

  test('só mostra "fixas e variáveis" quando há os dois tipos de despesa', async ({ page }) => {
    const titulo = page.getByRole('heading', { name: 'Despesas fixas e variáveis' });

    await lancar(page, {
      descricao: 'Mercado',
      valor: '100',
      data: '2026-11-10',
      categoria: 'Alimentação',
    });
    await expect(page.getByTestId('total-despesas')).toBeVisible();
    await expect(titulo).toHaveCount(0);

    await lancar(page, {
      natureza: 'fixa',
      descricao: 'Aluguel',
      valor: '1500',
      data: '2026-11-06',
      categoria: 'Moradia',
    });
    await expect(titulo).toBeVisible();
    await expect(page.getByText('R$ 0,00 (0%)')).toHaveCount(0);
  });

  test('as seções do resumo usam o mesmo cartão dos totais', async ({ page }) => {
    await lancar(page, {
      descricao: 'Mercado',
      valor: '100',
      data: '2026-11-10',
      categoria: 'Alimentação',
    });
    await expect(page.locator('.secao--cartao')).toHaveCount(2);
    await expect(
      page.locator('.secao--cartao').filter({ hasText: 'Despesas por categoria' }),
    ).toBeVisible();
    await expect(
      page.locator('.secao--cartao').filter({ hasText: 'Relatório do mês' }),
    ).toBeVisible();
  });
});
