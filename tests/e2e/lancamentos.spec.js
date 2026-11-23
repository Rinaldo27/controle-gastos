import { test, expect } from '@playwright/test';
import { abrirApp, irPara, lancar, moeda, semear } from './ajudantes.js';

test.describe('Lançamentos', () => {
  test.beforeEach(async ({ page }) => {
    await abrirApp(page, 'lancamentos');
  });

  test('começa vazio e a data padrão do formulário é hoje', async ({ page }) => {
    await expect(page.getByTestId('lista-vazia')).toBeVisible();
    await page.getByTestId('botao-novo').click();
    await expect(page.getByTestId('campo-data')).toHaveValue('2026-11-15');
  });

  test('mostra erros e mantém o formulário aberto com campos inválidos', async ({ page }) => {
    await page.getByTestId('botao-novo').click();
    await page.getByTestId('salvar-lancamento').click();

    await expect(page.locator('#dialogo-lancamento')).toBeVisible();
    await expect(page.locator('#erro-descricao')).toHaveText('Informe uma descrição.');
    await expect(page.locator('#erro-valor')).toContainText('valor válido');
    await expect(page.locator('#erro-categoria')).toHaveText('Escolha uma categoria.');
    await expect(page.getByTestId('campo-descricao')).toBeFocused();
    await expect(page.getByTestId('campo-descricao')).toHaveAttribute('aria-invalid', 'true');
  });

  test('rejeita valor zero e valor acima do limite', async ({ page }) => {
    await page.getByTestId('botao-novo').click();
    await page.getByTestId('campo-descricao').fill('Teste');
    await page.getByTestId('campo-categoria').selectOption('Outros');

    await page.getByTestId('campo-valor').fill('0');
    await page.getByTestId('salvar-lancamento').click();
    await expect(page.locator('#erro-valor')).toContainText('maior que zero');

    await page.getByTestId('campo-valor').fill('9999999999999');
    await page.getByTestId('salvar-lancamento').click();
    await expect(page.locator('#erro-valor')).toContainText('alto demais');
  });

  test('trocar o tipo mantém a categoria se ela existir nos dois tipos', async ({ page }) => {
    await page.getByTestId('botao-novo').click();
    await page.getByTestId('campo-categoria').selectOption('Outros');
    await page.locator('#dialogo-lancamento').getByLabel('Receita', { exact: true }).check();
    await expect(page.getByTestId('campo-categoria')).toHaveValue('Outros');
    await page.locator('#dialogo-lancamento').getByLabel('Despesa', { exact: true }).check();
    await page.getByTestId('campo-categoria').selectOption('Moradia');
    await page.locator('#dialogo-lancamento').getByLabel('Receita', { exact: true }).check();
    await expect(page.getByTestId('campo-categoria')).toHaveValue('');
  });

  test('cadastra lançamentos e calcula o resumo do mês', async ({ page }) => {
    await semear(page);
    await expect(page.getByTestId('lancamento')).toHaveCount(3);

    await irPara(page, 'resumo');
    await expect(page.getByTestId('total-receitas')).toHaveText(moeda('5.000,00'));
    await expect(page.getByTestId('total-despesas')).toHaveText(moeda('1.820,50'));
    await expect(page.getByTestId('saldo')).toHaveText(moeda('3.179,50'));
  });

  test('mostra HTML digitado como texto, sem interpretá-lo', async ({ page }) => {
    await lancar(page, {
      descricao: '<b>Mercado</b><img src=x onerror=alert(1)>',
      valor: '10',
      data: '2026-11-10',
      categoria: 'Alimentação',
    });
    const item = page.getByTestId('lancamento');
    await expect(item).toContainText('<b>Mercado</b>');
    await expect(item.locator('b, img')).toHaveCount(0);
  });

  test('os dados persistem depois de recarregar a página', async ({ page }) => {
    await semear(page);
    await page.reload();
    await expect(page.getByTestId('lancamento')).toHaveCount(3);
  });

  test('edita um lançamento', async ({ page }) => {
    await lancar(page, {
      descricao: 'Mercado',
      valor: '320,50',
      data: '2026-11-10',
      categoria: 'Alimentação',
    });
    await page.getByTestId('editar-lancamento').click();
    await expect(page.getByTestId('campo-valor')).toHaveValue('320,50');
    await page.getByTestId('campo-valor').fill('10,00');
    await page.getByTestId('salvar-lancamento').click();

    await expect(page.getByTestId('lancamento')).toHaveCount(1);
    await expect(page.getByTestId('lancamento')).toContainText(moeda('10,00'));
  });

  test('só exclui depois de confirmar', async ({ page }) => {
    await lancar(page, {
      descricao: 'Mercado',
      valor: '10',
      data: '2026-11-10',
      categoria: 'Alimentação',
    });
    const confirmacao = page.locator('#dialogo-confirmacao');

    await page.getByTestId('excluir-lancamento').click();
    await expect(confirmacao).toBeVisible();
    await confirmacao.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByTestId('lancamento')).toHaveCount(1);

    await page.getByTestId('excluir-lancamento').click();
    await page.getByTestId('confirmar-exclusao').click();
    await expect(page.getByTestId('lista-vazia')).toBeVisible();
  });

  test('filtra por categoria', async ({ page }) => {
    await semear(page);
    await page.getByTestId('filtro-categoria').selectOption('Moradia');
    await expect(page.getByTestId('lancamento')).toHaveCount(1);
    await expect(page.getByTestId('lancamento')).toContainText('Aluguel');
    await page.getByTestId('filtro-categoria').selectOption('');
    await expect(page.getByTestId('lancamento')).toHaveCount(3);
  });

  test('navega entre meses e vai para o mês do lançamento salvo', async ({ page }) => {
    await page.getByTestId('mes-anterior').click();
    await expect(page.getByTestId('mes-atual')).toHaveText('outubro de 2026');
    await expect(page.getByTestId('lista-vazia')).toBeVisible();

    await lancar(page, {
      descricao: 'Farmácia',
      valor: '89,90',
      data: '2026-12-03',
      categoria: 'Saúde',
    });
    await expect(page.getByTestId('mes-atual')).toHaveText('dezembro de 2026');
    await expect(page.getByTestId('lancamento')).toHaveCount(1);
  });
});
