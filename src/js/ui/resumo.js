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

function boasVindas(ctx) {
  return h(
    'section',
    { class: 'boas-vindas', 'data-testid': 'boas-vindas' },
    h('h2', {}, 'Bem-vindo!'),
    h(
      'p',
      {},
      'Registre suas receitas e despesas para ver quanto entrou, quanto saiu e quanto sobrou no mês.',
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'botao botao--primario',
        'data-testid': 'primeiro-lancamento',
        onclick: () => ctx.abrirFormulario(),
      },
      'Registrar o primeiro lançamento',
    ),
    h(
      'p',
      { class: 'nota' },
      'Seus dados ficam só neste aparelho, sem conta e sem servidor. Faça um backup de vez em quando em Ajustes.',
    ),
  );
}

export async function renderResumo(container, ctx) {
  const todos = await ctx.repo.listar();
  if (todos.length === 0) {
    container.append(h('h1', { tabindex: '-1' }, 'Resumo'), boasVindas(ctx));
    return;
  }

  const doMesLista = doMes(todos, ctx.estado.mes);
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
