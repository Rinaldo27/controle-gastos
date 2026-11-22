import { CATEGORIAS, NATUREZAS, TIPOS } from './categorias.js';
import { dataValida } from './datas.js';

export const LIMITES = {
  descricaoMax: 80,
  valorMaxCentavos: 99_999_999_999,
  anoMin: 2000,
  anoMax: 2100,
};

export function validarLancamento(entrada) {
  const erros = {};

  if (!TIPOS.includes(entrada.tipo)) erros.tipo = 'Escolha receita ou despesa.';
  if (!NATUREZAS.includes(entrada.natureza)) erros.natureza = 'Escolha fixa ou variável.';

  const descricao = typeof entrada.descricao === 'string' ? entrada.descricao.trim() : '';
  if (!descricao) erros.descricao = 'Informe uma descrição.';
  else if (descricao.length > LIMITES.descricaoMax) {
    erros.descricao = `Use no máximo ${LIMITES.descricaoMax} caracteres.`;
  }

  const valor = entrada.valorCentavos;
  if (!Number.isInteger(valor)) erros.valor = 'Informe um valor válido, como 25,90.';
  else if (valor <= 0) erros.valor = 'O valor deve ser maior que zero.';
  else if (valor > LIMITES.valorMaxCentavos) erros.valor = 'O valor informado é alto demais.';

  if (!dataValida(entrada.data)) erros.data = 'Informe uma data válida.';
  else {
    const ano = Number(entrada.data.slice(0, 4));
    if (ano < LIMITES.anoMin || ano > LIMITES.anoMax) {
      erros.data = `Use um ano entre ${LIMITES.anoMin} e ${LIMITES.anoMax}.`;
    }
  }

  const categorias = CATEGORIAS[entrada.tipo];
  if (!categorias || !categorias.includes(entrada.categoria))
    erros.categoria = 'Escolha uma categoria.';

  return { valido: Object.keys(erros).length === 0, erros };
}
