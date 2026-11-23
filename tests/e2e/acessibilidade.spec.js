import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { abrirApp, irPara, ROTAS, semear } from './ajudantes.js';

const REGRAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function violacoes(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(REGRAS).analyze();
  return violations.map((v) => ({
    regra: v.id,
    impacto: v.impact,
    elementos: v.nodes.map((n) => n.target.join(' ')),
  }));
}

for (const tema of ['light', 'dark']) {
  test.describe(`Acessibilidade (tema ${tema})`, () => {
    test.use({ colorScheme: tema });

    for (const rota of ROTAS) {
      test(`tela ${rota} sem violações do axe`, async ({ page }) => {
        await abrirApp(page, 'lancamentos');
        await semear(page);
        await irPara(page, rota);
        expect(await violacoes(page)).toEqual([]);
      });
    }

    test('formulário e confirmação sem violações do axe', async ({ page }) => {
      await abrirApp(page, 'lancamentos');
      await semear(page);

      await page.getByTestId('botao-novo').click();
      await page.getByTestId('salvar-lancamento').click();
      await expect(page.locator('#erro-descricao')).toBeVisible();
      expect(await violacoes(page)).toEqual([]);
      await page.locator('#cancelar-formulario').click();

      await page.getByTestId('excluir-lancamento').first().click();
      await expect(page.locator('#dialogo-confirmacao')).toBeVisible();
      expect(await violacoes(page)).toEqual([]);
    });
  });
}

test.describe('Teclado e foco', () => {
  test.beforeEach(async ({ browserName, isMobile }) => {
    test.skip(browserName !== 'chromium' || isMobile, 'Fluxo de teclado validado no desktop.');
  });

  test('abre e fecha o formulário só com o teclado e devolve o foco', async ({ page }) => {
    await abrirApp(page, 'lancamentos');
    await page.getByTestId('botao-novo').focus();
    await page.keyboard.press('Enter');

    const dialogo = page.locator('#dialogo-lancamento');
    await expect(dialogo).toBeVisible();
    await expect(dialogo.locator(':focus')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();
    await expect(page.getByTestId('botao-novo')).toBeFocused();
  });

  test('ao trocar de tela o foco vai para o título da nova tela', async ({ page }) => {
    await abrirApp(page, 'resumo');
    await page.getByTestId('nav-relatorios').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('h1')).toHaveText('Relatórios');
    await expect(page.locator('h1')).toBeFocused();
  });

  test('o foco aparece visível nos controles', async ({ page }) => {
    await abrirApp(page, 'lancamentos');
    await page.getByTestId('botao-novo').focus();
    const contorno = await page
      .getByTestId('botao-novo')
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(contorno).not.toBe('none');
  });
});
