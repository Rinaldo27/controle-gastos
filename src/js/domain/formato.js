const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const formatadorNumero = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatarMoeda(centavos) {
  return formatadorMoeda.format(centavos / 100);
}

// Sem o "R$": para tabelas estreitas, em que a unidade vai no título.
export function formatarValor(centavos) {
  return formatadorNumero.format(centavos / 100);
}

// Aceita "25,90", "1.234,56", "12", "12.5" e "R$ 10,00". Devolve centavos (inteiro) ou null.
export function parseValorParaCentavos(texto) {
  if (typeof texto !== 'string') return null;
  let limpo = texto
    .trim()
    .replace(/^R\$\s*/i, '')
    .replace(/\s/g, '');
  if (/^\d+\.\d{1,2}$/.test(limpo)) limpo = limpo.replace('.', ',');
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(limpo)) return null;
  const [inteiro, decimal = ''] = limpo.replace(/\./g, '').split(',');
  return Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));
}

export function centavosParaInput(centavos) {
  const inteiro = Math.floor(centavos / 100);
  const resto = String(centavos % 100).padStart(2, '0');
  return `${inteiro},${resto}`;
}
