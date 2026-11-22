import { h, secao, vazio } from './dom.js';
import { graficoBarras } from './graficos.js';
import { formatarMoeda } from '../domain/formato.js';
import { calcularTotais, doMes, totaisPorCategoria, totaisPorNatureza } from '../domain/regras.js';

function cartao(rotulo, centavos, variante, testid, largo = false) {
  return h(
    'div',
    { class: `cartao cartao--${variante}${largo ? ' cartao--largo' : ''}` },
    h('span', { class: 'cartao__rotulo' }, rotulo),
    h('strong', { class: 'cartao__valor', 'data-testid': testid }, formatarMoeda(centavos)),
  );
}

export async function renderResumo(container, ctx) {
  const doMesLista = doMes(await ctx.repo.listar(), ctx.estado.mes);
  const { receitas, despesas, saldo } = calcularTotais(doMesLista);
  const porCategoria = totaisPorCategoria(doMesLista, 'despesa');
  const porNatureza = totaisPorNatureza(doMesLista, 'despesa');

  container.append(
    h('h1', { tabindex: '-1' }, 'Resumo'),
    h(
      'div',
      { class: 'cartoes' },
      cartao('Receitas', receitas, 'receita', 'total-receitas'),
      cartao('Despesas', despesas, 'despesa', 'total-despesas'),
      cartao('Saldo do mês', saldo, saldo < 0 ? 'despesa' : 'receita', 'saldo', true),
    ),
    secao(
      'Despesas por categoria',
      porCategoria.length
        ? graficoBarras(
            porCategoria.map((item) => ({
              rotulo: item.categoria,
              valorCentavos: item.totalCentavos,
            })),
          )
        : vazio('Nenhuma despesa neste mês.', 'sem-despesas'),
    ),
    secao(
      'Despesas fixas e variáveis',
      despesas > 0
        ? graficoBarras([
            { rotulo: 'Fixas', valorCentavos: porNatureza.fixa },
            { rotulo: 'Variáveis', valorCentavos: porNatureza.variavel },
          ])
        : vazio('Nenhuma despesa neste mês.'),
    ),
  );
}
