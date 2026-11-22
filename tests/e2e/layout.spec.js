import { test, expect } from '@playwright/test';
import { abrirApp, irPara, ROTAS, semear } from './ajudantes.js';

const TOQUE_MINIMO = 44;

test.describe('Layout responsivo', () => {
  for (const rota of ROTAS) {
    test(`tela ${rota} não tem rolagem horizontal`, async ({ page }) => {
      await abrirApp(page, 'lancamentos');
      await semear(page);
      await irPara(page, rota);
      const cabe = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(cabe).toBe(true);
    });
  }

  test('a tabela do histórico cabe na tela sem rolar', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Foco no celular.');
    await abrirApp(page, 'lancamentos');
    await semear(page);
    await irPara(page, 'relatorios');
    await page.locator('#filtro-periodo').selectOption('12');
    const cabe = await page
      .locator('.tabela-rolavel')
      .evaluate((el) => el.scrollWidth <= el.clientWidth);
    expect(cabe).toBe(true);
  });

  test('botões, links e campos têm área de toque adequada no celular', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Alvos de toque só importam no celular.');
    await abrirApp(page, 'lancamentos');
    await semear(page);

    const pequenos = [];
    const medir = async (tela) => {
      const itens = await page
        .locator('button, a, select, input:not([type="radio"]), .segmentado label')
        .all();
      for (const item of itens) {
        if (!(await item.isVisible())) continue;
        const caixa = await item.boundingBox();
        if (caixa && (caixa.height < TOQUE_MINIMO || caixa.width < TOQUE_MINIMO)) {
          const descricao = await item.evaluate((el) => el.outerHTML.slice(0, 80));
          pequenos.push(
            `${tela}: ${Math.round(caixa.width)}x${Math.round(caixa.height)} ${descricao}`,
          );
        }
      }
    };

    for (const rota of ROTAS) {
      await irPara(page, rota);
      await medir(rota);
    }
    await irPara(page, 'lancamentos');
    await page.getByTestId('botao-novo').click();
    await medir('formulário');

    expect(pequenos).toEqual([]);
  });

  test('em tela grande a navegação fica no topo, sem cobrir o conteúdo', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Layout de desktop.');
    await abrirApp(page, 'resumo');
    const posicao = await page
      .locator('.navegacao')
      .evaluate((el) => getComputedStyle(el).position);
    expect(posicao).toBe('static');

    const navegacao = await page.locator('.navegacao').boundingBox();
    const principal = await page.locator('#principal').boundingBox();
    expect(navegacao.y + navegacao.height).toBeLessThanOrEqual(principal.y + 1);
  });
});
