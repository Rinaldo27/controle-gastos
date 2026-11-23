export const TIPOS = ['receita', 'despesa'];
export const NATUREZAS = ['fixa', 'variavel'];

export const CATEGORIAS = {
  despesa: ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'],
  receita: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
};

export const ROTULOS = {
  receita: 'Receita',
  despesa: 'Despesa',
  fixa: 'Fixa',
  variavel: 'Variável',
};

export function todasAsCategorias() {
  return [...new Set([...CATEGORIAS.despesa, ...CATEGORIAS.receita])].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
}
