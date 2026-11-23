import { test, expect } from '@playwright/test';
import { abrirApp, aviso, lancar } from './ajudantes.js';

test.describe('Primeira experiência', () => {
  test('a tela vazia orienta a registrar o primeiro lançamento', async ({ page }) => {
    await abrirApp(page);
    const boasVindas = page.getByTestId('boas-vindas');
    await expect(boasVindas).toContainText('Bem-vindo');
    await expect(boasVindas).toContainText('só neste aparelho');

    await page.getByTestId('primeiro-lancamento').click();
    await expect(page.locator('#dialogo-lancamento')).toBeVisible();
    await page.locator('#cancelar-formulario').click();

    await lancar(page, {
      descricao: 'Mercado',
      valor: '50',
      data: '2026-11-10',
      categoria: 'Alimentação',
    });
    await expect(boasVindas).toHaveCount(0);
    await expect(page.getByTestId('total-despesas')).toBeVisible();
  });

  test('o formulário explica o que é fixa ou variável', async ({ page }) => {
    await abrirApp(page, 'lancamentos');
    await page.getByTestId('botao-novo').click();
    await expect(page.getByText('É fixa ou variável?')).toBeVisible();
    await expect(page.locator('#dica-natureza')).toContainText('aluguel');
    await expect(page.getByTestId('campo-descricao')).toHaveAttribute(
      'placeholder',
      'Ex.: Mercado',
    );
  });

  test('o cabeçalho não quebra em duas linhas no celular', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Verificação do layout de celular.');
    await abrirApp(page);
    const caixa = await page.locator('.cabecalho').boundingBox();
    expect(caixa.height).toBeLessThanOrEqual(80);
    await expect(page.locator('.cabecalho__nome')).toHaveText('Expense Tracker');
  });
});

test.describe('Aviso de mês diferente do atual', () => {
  test('avisa que o mês exibido não é o atual e permite voltar', async ({ page }) => {
    await abrirApp(page, 'lancamentos');
    await expect(page.getByTestId('aviso-mes')).toHaveCount(0);

    await page.getByTestId('mes-anterior').click();
    await expect(page.getByTestId('aviso-mes')).toContainText('Você está vendo outubro de 2026');

    await page.getByTestId('ir-para-hoje').click();
    await expect(page.getByTestId('mes-atual')).toHaveText('novembro de 2026');
    await expect(page.getByTestId('aviso-mes')).toHaveCount(0);
  });

  test('em Relatórios o aviso explica que o período termina naquele mês', async ({ page }) => {
    await abrirApp(page, 'relatorios');
    await page.getByTestId('mes-anterior').click();
    await expect(page.getByTestId('aviso-mes')).toContainText(
      'O período termina em outubro de 2026',
    );
  });

  test('ao salvar em outro mês, o aviso diz em qual mês foi salvo', async ({ page }) => {
    await abrirApp(page, 'lancamentos');
    await lancar(page, {
      descricao: 'Farmácia',
      valor: '89,90',
      data: '2026-10-20',
      categoria: 'Saúde',
    });
    await expect(aviso(page, 'Lançamento salvo em outubro de 2026')).toBeVisible();
    await expect(page.getByTestId('mes-atual')).toHaveText('outubro de 2026');
    await expect(page.getByTestId('aviso-mes')).toBeVisible();
  });
});

test.describe('Banner de instalação', () => {
  test('no iPhone mostra o passo a passo e não volta depois de dispensado', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'webkit', 'O texto do iPhone só aparece no Safari emulado.');
    await abrirApp(page);

    const banner = page.getByTestId('banner-instalar');
    await expect(banner).toContainText('Adicionar à Tela de Início');
    await expect(page.getByTestId('banner-instalar-sim')).toBeHidden();

    await page.getByTestId('banner-instalar-nao').click();
    await expect(banner).toBeHidden();

    await page.reload();
    await expect(page.getByTestId('mes-atual')).toBeVisible();
    await expect(banner).toBeHidden();
  });

  test('no Android oferece instalar quando o navegador permite', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'O evento de instalação existe no Chromium.');
    await abrirApp(page);

    await page.evaluate(() => {
      const evento = new Event('beforeinstallprompt', { cancelable: true });
      evento.prompt = () => {};
      evento.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(evento);
    });

    const banner = page.getByTestId('banner-instalar');
    await expect(banner).toContainText('Instale o app');
    await page.getByTestId('banner-instalar-sim').click();
    await expect(banner).toBeHidden();
  });
});
