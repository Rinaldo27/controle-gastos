import { test, expect } from '@playwright/test';
import { abrirApp, irPara, lancar, semear } from './ajudantes.js';

test.describe('Resultado do mês', () => {
  test.beforeEach(async ({ page }) => {
    await abrirApp(page, 'resumo');
  });

  test('o cartão se chama "Resultado do mês" e explica quando sobrou dinheiro', async ({
    page,
  }) => {
    await semear(page);
    await irPara(page, 'resumo');
    await expect(page.getByText('Resultado do mês')).toBeVisible();
    await expect(page.getByTestId('saldo-legenda')).toHaveText('Sobrou no mês');
  });

  test('explica quando se gastou mais do que se recebeu', async ({ page }) => {
    await lancar(page, {
      descricao: 'Mercado',
      valor: '100',
      data: '2026-11-10',
      categoria: 'Alimentação',
    });
    await expect(page.getByTestId('saldo-legenda')).toHaveText('Gastou mais do que recebeu');
  });

  test('explica quando entrada e saída são iguais', async ({ page }) => {
    await lancar(page, {
      tipo: 'receita',
      descricao: 'Freela',
      valor: '100',
      data: '2026-11-05',
      categoria: 'Freelance',
    });
    await lancar(page, {
      descricao: 'Mercado',
      valor: '100',
      data: '2026-11-10',
      categoria: 'Alimentação',
    });
    await expect(page.getByTestId('saldo-legenda')).toHaveText('Entrou e saiu o mesmo valor');
  });

  test('avisa quando o mês não tem lançamentos', async ({ page }) => {
    await semear(page);
    await irPara(page, 'resumo');
    await page.getByTestId('mes-anterior').click();
    await page.getByTestId('mes-anterior').click();
    await expect(page.getByTestId('mes-atual')).toHaveText('setembro de 2026');
    await expect(page.getByTestId('saldo-legenda')).toHaveText('Sem lançamentos no mês');
  });
});
