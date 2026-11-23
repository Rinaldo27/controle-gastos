import { ROTULOS } from './categorias.js';
import { formatarData, formatarMes } from './datas.js';
import { formatarMoeda } from './formato.js';
import { ajustarTexto, criarPdf, larguraAproximada, larguraMono } from './pdf.js';
import {
  calcularTotais,
  descreverResultado,
  totaisPorCategoria,
  totaisPorNatureza,
} from './regras.js';

const MARGEM = 40;
const DIREITA = 555;
const TOPO = 792;
const LIMITE_INFERIOR = 60;

const CORES = {
  texto: [27, 31, 29],
  suave: [90, 100, 95],
  receita: [11, 107, 79],
  despesa: [179, 38, 30],
  trilho: [225, 230, 227],
  faixa: [243, 246, 244],
  cabecalho: [228, 233, 230],
};

const dinheiro = (centavos) => formatarMoeda(centavos).replace(/\u00a0/g, ' ');

// Relatório de um mês: resumo, despesas por categoria, fixas x variáveis e a lista completa.
export function gerarRelatorioMensal({ lancamentos, mes, geradoEm }) {
  const doc = criarPdf();
  let pagina = doc.novaPagina();
  let y = TOPO;

  // Abre uma página nova quando não cabe mais; devolve true se abriu.
  const precisa = (altura) => {
    if (y - altura >= LIMITE_INFERIOR) return false;
    pagina = doc.novaPagina();
    y = TOPO;
    return true;
  };

  pagina.texto(MARGEM, y, 'Expense Tracker', {
    tamanho: 10,
    fonte: 'negrito',
    cor: CORES.receita,
  });
  y -= 26;
  pagina.texto(MARGEM, y, `Relatório de ${formatarMes(mes)}`, {
    tamanho: 20,
    fonte: 'negrito',
    cor: CORES.texto,
  });
  y -= 18;
  pagina.texto(MARGEM, y, `Gerado em ${formatarData(geradoEm)}`, { tamanho: 9, cor: CORES.suave });
  y -= 12;
  pagina.linha(MARGEM, y, DIREITA, y, CORES.trilho, 1);
  y -= 28;

  const totais = calcularTotais(lancamentos);
  const resumo = [
    ['Receitas', totais.receitas, CORES.receita],
    ['Despesas', totais.despesas, CORES.despesa],
    ['Resultado do mês', totais.saldo, totais.saldo < 0 ? CORES.despesa : CORES.receita],
  ];
  resumo.forEach(([rotulo, valor, cor], indice) => {
    const x = MARGEM + indice * 175;
    pagina.texto(x, y, rotulo, { tamanho: 9, cor: CORES.suave });
    pagina.texto(x, y - 20, dinheiro(valor), { tamanho: 16, fonte: 'negrito', cor });
  });
  pagina.texto(MARGEM + 2 * 175, y - 34, descreverResultado(totais), {
    tamanho: 8,
    cor: CORES.suave,
  });
  y -= 62;

  function barras(titulo, itens) {
    precisa(50);
    pagina.texto(MARGEM, y, titulo, { tamanho: 12, fonte: 'negrito', cor: CORES.texto });
    y -= 22;

    const total = itens.reduce((soma, item) => soma + item.valor, 0);
    if (total === 0) {
      pagina.texto(MARGEM, y, 'Nenhuma despesa neste mês.', { tamanho: 10, cor: CORES.suave });
      y -= 30;
      return;
    }
    for (const item of itens) {
      precisa(20);
      const parte = item.valor / total;
      pagina.texto(MARGEM, y, ajustarTexto(item.rotulo, 120, 10), {
        tamanho: 10,
        cor: CORES.texto,
      });
      pagina.retangulo(170, y - 2, 200, 8, CORES.trilho);
      if (parte > 0) pagina.retangulo(170, y - 2, Math.max(2, 200 * parte), 8, CORES.despesa);
      const valorTexto = `${dinheiro(item.valor)} (${Math.round(parte * 100)}%)`;
      pagina.texto(DIREITA - larguraMono(valorTexto, 9), y, valorTexto, {
        tamanho: 9,
        fonte: 'mono',
        cor: CORES.texto,
      });
      y -= 20;
    }
    y -= 10;
  }

  barras(
    'Despesas por categoria',
    totaisPorCategoria(lancamentos, 'despesa').map((item) => ({
      rotulo: item.categoria,
      valor: item.totalCentavos,
    })),
  );
  const natureza = totaisPorNatureza(lancamentos, 'despesa');
  const naturezas = [
    { rotulo: 'Fixas', valor: natureza.fixa },
    { rotulo: 'Variáveis', valor: natureza.variavel },
  ].filter((item) => item.valor > 0);
  if (naturezas.length === 2) barras('Despesas fixas e variáveis', naturezas);

  const colunas = { data: MARGEM, descricao: 100, categoria: 330, natureza: 430 };
  function cabecalhoTabela() {
    pagina.retangulo(MARGEM, y - 5, DIREITA - MARGEM, 18, CORES.cabecalho);
    const estilo = { tamanho: 9, fonte: 'negrito', cor: CORES.texto };
    pagina.texto(colunas.data + 4, y, 'Data', estilo);
    pagina.texto(colunas.descricao, y, 'Descrição', estilo);
    pagina.texto(colunas.categoria, y, 'Categoria', estilo);
    pagina.texto(colunas.natureza, y, 'Natureza', estilo);
    pagina.texto(DIREITA - 4 - larguraAproximada('Valor', 9), y, 'Valor', estilo);
    y -= 20;
  }

  precisa(80);
  pagina.texto(MARGEM, y, 'Lançamentos', { tamanho: 12, fonte: 'negrito', cor: CORES.texto });
  y -= 22;

  if (lancamentos.length === 0) {
    pagina.texto(MARGEM, y, 'Nenhum lançamento neste mês.', { tamanho: 10, cor: CORES.suave });
  } else {
    cabecalhoTabela();
    const ordenados = [...lancamentos].sort(
      (a, b) => a.data.localeCompare(b.data) || a.criadoEm.localeCompare(b.criadoEm),
    );
    ordenados.forEach((lancamento, indice) => {
      if (precisa(18)) cabecalhoTabela();
      if (indice % 2 === 1) pagina.retangulo(MARGEM, y - 5, DIREITA - MARGEM, 16, CORES.faixa);

      const estilo = { tamanho: 9, cor: CORES.texto };
      const despesa = lancamento.tipo === 'despesa';
      const valor = `${despesa ? '-' : ''}${dinheiro(lancamento.valorCentavos)}`;
      pagina.texto(colunas.data + 4, y, formatarData(lancamento.data), estilo);
      pagina.texto(colunas.descricao, y, ajustarTexto(lancamento.descricao, 220, 9), estilo);
      pagina.texto(colunas.categoria, y, ajustarTexto(lancamento.categoria, 95, 9), estilo);
      pagina.texto(colunas.natureza, y, ROTULOS[lancamento.natureza], estilo);
      pagina.texto(DIREITA - 4 - larguraMono(valor, 9), y, valor, {
        tamanho: 9,
        fonte: 'mono',
        cor: despesa ? CORES.despesa : CORES.receita,
      });
      y -= 16;
    });
  }

  doc.paginas.forEach((folha, indice) => {
    const numeracao = `Página ${indice + 1} de ${doc.paginas.length}`;
    folha.texto(MARGEM, 28, `Expense Tracker · relatório de ${formatarMes(mes)}`, {
      tamanho: 8,
      cor: CORES.suave,
    });
    folha.texto(DIREITA - larguraAproximada(numeracao, 8), 28, numeracao, {
      tamanho: 8,
      cor: CORES.suave,
    });
  });

  return doc.gerar();
}
