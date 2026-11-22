import { expect } from '@playwright/test';

// Data fixa: os testes não dependem do dia em que rodam.
export const AGORA = new Date('2026-11-15T12:00:00-03:00');

export const ROTAS = ['resumo', 'lancamentos', 'relatorios', 'ajustes'];

export async function abrirApp(page, rota = 'resumo') {
  await page.clock.setFixedTime(AGORA);
  await page.goto(`/#/${rota}`);
  await expect(page.getByTestId('mes-atual')).toHaveText('novembro de 2026');
}

export async function lancar(
  page,
  { tipo = 'despesa', natureza = 'variavel', descricao, valor, data, categoria },
) {
  await page.getByTestId('botao-novo').click();
  const dialogo = page.locator('#dialogo-lancamento');
  await expect(dialogo).toBeVisible();
  await dialogo.getByLabel(tipo === 'receita' ? 'Receita' : 'Despesa', { exact: true }).check();
  await dialogo.getByLabel(natureza === 'fixa' ? 'Fixa' : 'Variável', { exact: true }).check();
  await page.getByTestId('campo-descricao').fill(descricao);
  await page.getByTestId('campo-valor').fill(valor);
  await page.getByTestId('campo-data').fill(data);
  await page.getByTestId('campo-categoria').selectOption(categoria);
  await page.getByTestId('salvar-lancamento').click();
  await expect(dialogo).toBeHidden();
}

export async function semear(page) {
  await lancar(page, {
    tipo: 'receita',
    natureza: 'fixa',
    descricao: 'Salário',
    valor: '5.000,00',
    data: '2026-11-05',
    categoria: 'Salário',
  });
  await lancar(page, {
    natureza: 'fixa',
    descricao: 'Aluguel',
    valor: '1500',
    data: '2026-11-06',
    categoria: 'Moradia',
  });
  await lancar(page, {
    descricao: 'Mercado',
    valor: '320,50',
    data: '2026-11-10',
    categoria: 'Alimentação',
  });
  await lancar(page, {
    descricao: 'Farmácia',
    valor: '89,90',
    data: '2026-10-20',
    categoria: 'Saúde',
  });
  await page.getByTestId('mes-seguinte').click();
  await expect(page.getByTestId('mes-atual')).toHaveText('novembro de 2026');
}

// Os avisos duram 5s e podem se acumular; por isso localizamos pelo texto, não pela posição.
export const aviso = (page, texto) => page.getByTestId('aviso').filter({ hasText: texto });

export async function irPara(page, rota) {
  await page.getByTestId(`nav-${rota}`).click();
  await expect(page.locator('h1')).toBeVisible();
}

// O espaço entre "R$" e o número é um espaço não separável, por isso \s.
export const moeda = (texto) => new RegExp(`R\\$\\s${texto.replace(/[.,]/g, '\\$&')}`);
