import { deslocarMes, mesDe } from './datas.js';

export function doMes(lancamentos, mes) {
  return lancamentos.filter((l) => mesDe(l.data) === mes);
}

export function daCategoria(lancamentos, categoria) {
  return categoria ? lancamentos.filter((l) => l.categoria === categoria) : lancamentos;
}

export function ordenarRecentesPrimeiro(lancamentos) {
  return [...lancamentos].sort(
    (a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm),
  );
}

// Todos os totais são em centavos.
export function calcularTotais(lancamentos) {
  let receitas = 0;
  let despesas = 0;
  for (const l of lancamentos) {
    if (l.tipo === 'receita') receitas += l.valorCentavos;
    else despesas += l.valorCentavos;
  }
  return { receitas, despesas, saldo: receitas - despesas };
}

export function totaisPorCategoria(lancamentos, tipo) {
  const mapa = new Map();
  for (const l of lancamentos) {
    if (l.tipo !== tipo) continue;
    mapa.set(l.categoria, (mapa.get(l.categoria) ?? 0) + l.valorCentavos);
  }
  return [...mapa]
    .map(([categoria, totalCentavos]) => ({ categoria, totalCentavos }))
    .sort(
      (a, b) =>
        b.totalCentavos - a.totalCentavos || a.categoria.localeCompare(b.categoria, 'pt-BR'),
    );
}

export function totaisPorNatureza(lancamentos, tipo = 'despesa') {
  const totais = { fixa: 0, variavel: 0 };
  for (const l of lancamentos) {
    if (l.tipo === tipo) totais[l.natureza] += l.valorCentavos;
  }
  return totais;
}

export function evolucaoMensal(lancamentos, mesFinal, quantidade) {
  const serie = [];
  for (let i = quantidade - 1; i >= 0; i -= 1) {
    const mes = deslocarMes(mesFinal, -i);
    serie.push({ mes, ...calcularTotais(doMes(lancamentos, mes)) });
  }
  return serie;
}
