import { h, vazio } from './dom.js';
import { avisar } from './avisos.js';
import { confirmar } from './confirmar.js';
import { ROTULOS } from '../domain/categorias.js';
import { formatarDataCurta } from '../domain/datas.js';
import { formatarMoeda } from '../domain/formato.js';
import { daCategoria, doMes, ordenarRecentesPrimeiro } from '../domain/regras.js';

async function excluir(lancamento, ctx) {
  const confirmado = await confirmar({
    titulo: 'Excluir lançamento?',
    mensagem: `“${lancamento.descricao}” de ${formatarMoeda(lancamento.valorCentavos)} será removido.`,
    rotuloConfirmar: 'Excluir',
  });
  if (!confirmado) return;

  try {
    await ctx.repo.remover(lancamento.id);
    avisar('Lançamento excluído.', { tipo: 'sucesso' });
    await ctx.recarregar();
  } catch (erro) {
    avisar(erro.message, { tipo: 'erro' });
  }
}

function item(lancamento, ctx) {
  const sinal = lancamento.tipo === 'receita' ? '+' : '−';
  return h(
    'li',
    { class: 'lancamento', 'data-testid': 'lancamento' },
    h(
      'div',
      { class: 'lancamento__principal' },
      h(
        'div',
        { class: 'lancamento__info' },
        h('strong', { class: 'lancamento__descricao' }, lancamento.descricao),
        h(
          'span',
          { class: 'lancamento__meta' },
          `${lancamento.categoria} · ${ROTULOS[lancamento.natureza]} · ${formatarDataCurta(lancamento.data)}`,
        ),
      ),
      h(
        'span',
        { class: `valor valor--${lancamento.tipo}` },
        `${sinal} ${formatarMoeda(lancamento.valorCentavos)}`,
      ),
    ),
    h(
      'div',
      { class: 'lancamento__acoes' },
      h(
        'button',
        {
          type: 'button',
          class: 'botao botao--texto',
          'data-testid': 'editar-lancamento',
          'aria-label': `Editar ${lancamento.descricao}`,
          onclick: () => ctx.abrirFormulario(lancamento),
        },
        'Editar',
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'botao botao--texto botao--perigo-texto',
          'data-testid': 'excluir-lancamento',
          'aria-label': `Excluir ${lancamento.descricao}`,
          onclick: () => excluir(lancamento, ctx),
        },
        'Excluir',
      ),
    ),
  );
}

export async function renderLancamentos(container, ctx) {
  const { estado } = ctx;
  const doMesLista = ordenarRecentesPrimeiro(doMes(await ctx.repo.listar(), estado.mes));
  const categorias = [...new Set(doMesLista.map((l) => l.categoria))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
  if (!categorias.includes(estado.categoria)) estado.categoria = '';
  const visiveis = daCategoria(doMesLista, estado.categoria);

  container.append(h('h1', { tabindex: '-1' }, 'Lançamentos'));

  if (doMesLista.length > 0) {
    container.append(
      h(
        'div',
        { class: 'campo' },
        h('label', { for: 'filtro-categoria' }, 'Filtrar por categoria'),
        h(
          'select',
          {
            id: 'filtro-categoria',
            'data-testid': 'filtro-categoria',
            onchange: (evento) => {
              estado.categoria = evento.target.value;
              ctx.recarregar();
            },
          },
          h('option', { value: '' }, 'Todas as categorias'),
          categorias.map((nome) =>
            h('option', { value: nome, selected: nome === estado.categoria }, nome),
          ),
        ),
      ),
    );
  }

  if (visiveis.length === 0) {
    container.append(
      vazio(
        doMesLista.length === 0
          ? 'Nenhum lançamento neste mês. Toque no botão + para começar.'
          : 'Nenhum lançamento nesta categoria.',
        'lista-vazia',
      ),
    );
    return;
  }

  container.append(
    h(
      'ul',
      { class: 'lista-lancamentos', 'data-testid': 'lista-lancamentos' },
      visiveis.map((l) => item(l, ctx)),
    ),
  );
}
