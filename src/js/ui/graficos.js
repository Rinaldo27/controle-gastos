import { h } from './dom.js';
import { formatarMoeda } from '../domain/formato.js';
import { formatarMesCurto } from '../domain/datas.js';

const NS_SVG = 'http://www.w3.org/2000/svg';

function svg(tag, atributos = {}, ...filhos) {
  const elemento = document.createElementNS(NS_SVG, tag);
  for (const [nome, valor] of Object.entries(atributos)) elemento.setAttribute(nome, valor);
  elemento.append(...filhos);
  return elemento;
}

// Barras em HTML: o valor aparece como texto (acessível) e a barra é só reforço visual.
export function graficoBarras(itens, { variante = 'despesa' } = {}) {
  const total = itens.reduce((soma, item) => soma + item.valorCentavos, 0);
  return h(
    'ul',
    { class: 'barras', 'data-testid': 'grafico-barras' },
    itens.map((item) => {
      const percentual = total > 0 ? (item.valorCentavos / total) * 100 : 0;
      const preenchimento = h('span', {
        class: `barra__preenchimento barra__preenchimento--${variante}`,
      });
      preenchimento.style.width = `${percentual.toFixed(1)}%`;
      return h(
        'li',
        { class: 'barra' },
        h(
          'div',
          { class: 'barra__linha' },
          h('span', {}, item.rotulo),
          h(
            'span',
            { class: 'numero' },
            `${formatarMoeda(item.valorCentavos)} (${Math.round(percentual)}%)`,
          ),
        ),
        h('div', { class: 'barra__trilho', 'aria-hidden': 'true' }, preenchimento),
      );
    }),
  );
}

// Barras agrupadas (receitas x despesas por mês). Os mesmos números ficam na tabela ao lado do gráfico.
export function graficoEvolucao(serie) {
  const largura = 360;
  const altura = 180;
  const margemTopo = 8;
  const margemBase = 26;
  const areaUtil = altura - margemTopo - margemBase;
  const maximo = Math.max(1, ...serie.flatMap((m) => [m.receitas, m.despesas]));
  const grupo = largura / serie.length;
  const barra = Math.min(22, grupo * 0.36);
  const alturaDe = (valor) => (valor / maximo) * areaUtil;
  const base = margemTopo + areaUtil;

  const elementos = [
    svg('line', { x1: 0, x2: largura, y1: base, y2: base, class: 'grafico__eixo' }),
  ];
  serie.forEach((mes, indice) => {
    const centro = grupo * indice + grupo / 2;
    const alturaReceita = alturaDe(mes.receitas);
    const alturaDespesa = alturaDe(mes.despesas);
    elementos.push(
      svg('rect', {
        x: centro - barra - 1,
        y: base - alturaReceita,
        width: barra,
        height: alturaReceita,
        rx: 2,
        class: 'grafico__barra grafico__barra--receita',
      }),
      svg('rect', {
        x: centro + 1,
        y: base - alturaDespesa,
        width: barra,
        height: alturaDespesa,
        rx: 2,
        class: 'grafico__barra grafico__barra--despesa',
      }),
      svg(
        'text',
        { x: centro, y: altura - 8, 'text-anchor': 'middle', class: 'grafico__rotulo' },
        formatarMesCurto(mes.mes).slice(0, 3),
      ),
    );
  });

  return svg(
    'svg',
    {
      viewBox: `0 0 ${largura} ${altura}`,
      class: 'grafico',
      role: 'img',
      'aria-label': `Receitas e despesas dos últimos ${serie.length} meses. Os valores completos estão na tabela abaixo.`,
      'data-testid': 'grafico-evolucao',
    },
    ...elementos,
  );
}
