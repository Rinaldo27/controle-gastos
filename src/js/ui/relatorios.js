import { h, secao } from './dom.js';
import { graficoEvolucao } from './graficos.js';
import { todasAsCategorias } from '../domain/categorias.js';
import { formatarMesCurto } from '../domain/datas.js';
import { formatarValor } from '../domain/formato.js';
import { daCategoria, evolucaoMensal } from '../domain/regras.js';

const PERIODOS = [3, 6, 12];

function campoSelect(id, rotulo, opcoes, valorAtual, aoMudar) {
  return h(
    'div',
    { class: 'campo' },
    h('label', { for: id }, rotulo),
    h(
      'select',
      { id, 'data-testid': id, onchange: (evento) => aoMudar(evento.target.value) },
      opcoes.map(([valor, texto]) =>
        h('option', { value: valor, selected: String(valor) === String(valorAtual) }, texto),
      ),
    ),
  );
}

function celulaSaldo(centavos) {
  return h(
    'td',
    { class: `numero ${centavos < 0 ? 'valor--despesa' : 'valor--receita'}` },
    formatarValor(centavos),
  );
}

export async function renderRelatorios(container, ctx) {
  const config = ctx.estado.relatorio;
  const lancamentos = daCategoria(await ctx.repo.listar(), config.categoria);
  const serie = evolucaoMensal(lancamentos, ctx.estado.mes, config.meses);
  const total = serie.reduce(
    (soma, mes) => ({
      receitas: soma.receitas + mes.receitas,
      despesas: soma.despesas + mes.despesas,
    }),
    { receitas: 0, despesas: 0 },
  );

  container.append(
    h('h1', { tabindex: '-1' }, 'Relatórios'),
    h(
      'div',
      { class: 'filtros' },
      campoSelect(
        'filtro-periodo',
        'Período',
        PERIODOS.map((meses) => [meses, `Últimos ${meses} meses`]),
        config.meses,
        (valor) => {
          config.meses = Number(valor);
          ctx.recarregar();
        },
      ),
      campoSelect(
        'filtro-categoria-relatorio',
        'Categoria',
        [['', 'Todas as categorias'], ...todasAsCategorias().map((nome) => [nome, nome])],
        config.categoria,
        (valor) => {
          config.categoria = valor;
          ctx.recarregar();
        },
      ),
    ),
    secao(
      'Evolução financeira',
      h(
        'ul',
        { class: 'legenda' },
        h(
          'li',
          {},
          h('span', { class: 'legenda__marca legenda__marca--receita', 'aria-hidden': 'true' }),
          'Receitas',
        ),
        h(
          'li',
          {},
          h('span', { class: 'legenda__marca legenda__marca--despesa', 'aria-hidden': 'true' }),
          'Despesas',
        ),
      ),
      graficoEvolucao(serie),
    ),
    secao(
      'Histórico',
      h('p', { class: 'nota' }, 'Valores em reais (R$).'),
      h(
        'div',
        { class: 'tabela-rolavel' },
        h(
          'table',
          { class: 'tabela', 'data-testid': 'tabela-historico' },
          h('caption', { class: 'so-leitor' }, 'Receitas, despesas e saldo por mês'),
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              h('th', { scope: 'col' }, 'Mês'),
              h('th', { scope: 'col', class: 'numero' }, 'Receitas'),
              h('th', { scope: 'col', class: 'numero' }, 'Despesas'),
              h('th', { scope: 'col', class: 'numero' }, 'Saldo'),
            ),
          ),
          h(
            'tbody',
            {},
            [...serie]
              .reverse()
              .map((mes) =>
                h(
                  'tr',
                  {},
                  h('th', { scope: 'row' }, formatarMesCurto(mes.mes)),
                  h('td', { class: 'numero' }, formatarValor(mes.receitas)),
                  h('td', { class: 'numero' }, formatarValor(mes.despesas)),
                  celulaSaldo(mes.saldo),
                ),
              ),
          ),
          h(
            'tfoot',
            {},
            h(
              'tr',
              {},
              h('th', { scope: 'row' }, 'Total'),
              h('td', { class: 'numero' }, formatarValor(total.receitas)),
              h('td', { class: 'numero' }, formatarValor(total.despesas)),
              celulaSaldo(total.receitas - total.despesas),
            ),
          ),
        ),
      ),
    ),
  );
}
