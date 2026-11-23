import { h, secaoCartao, vazio } from './dom.js';
import { avisar } from './avisos.js';
import { entregarArquivo } from './arquivos.js';
import { graficoBarras } from './graficos.js';
import { formatarMes, hojeISO } from '../domain/datas.js';
import { formatarMoeda } from '../domain/formato.js';
import { gerarRelatorioMensal } from '../domain/relatorioPdf.js';
import {
  calcularTotais,
  descreverResultado,
  doMes,
  totaisPorCategoria,
  totaisPorNatureza,
} from '../domain/regras.js';

function cartao(rotulo, centavos, variante, testid, largo = false, legenda = '') {
  return h(
    'div',
    { class: `cartao cartao--${variante}${largo ? ' cartao--largo' : ''}` },
    h('span', { class: 'cartao__rotulo' }, rotulo),
    h('strong', { class: 'cartao__valor', 'data-testid': testid }, formatarMoeda(centavos)),
    legenda
      ? h('span', { class: 'cartao__legenda', 'data-testid': `${testid}-legenda` }, legenda)
      : null,
  );
}

async function salvarRelatorio(ctx, lancamentos) {
  try {
    const bytes = gerarRelatorioMensal({ lancamentos, mes: ctx.estado.mes, geradoEm: hojeISO() });
    const arquivo = new File([bytes], `relatorio-${ctx.estado.mes}.pdf`, {
      type: 'application/pdf',
    });
    if (await entregarArquivo(arquivo, `Relatório de ${formatarMes(ctx.estado.mes)}`)) {
      avisar('Relatório salvo.', { tipo: 'sucesso' });
    }
  } catch (erro) {
    avisar(erro.message, { tipo: 'erro' });
  }
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
  // Com só um tipo de despesa, "Fixas 0%" e "Variáveis 100%" não acrescentam nada: a seção some.
  const naturezas = [
    { rotulo: 'Fixas', valorCentavos: porNatureza.fixa },
    { rotulo: 'Variáveis', valorCentavos: porNatureza.variavel },
  ].filter((item) => item.valorCentavos > 0);

  container.append(
    h('h1', { tabindex: '-1' }, 'Resumo'),
    h(
      'div',
      { class: 'cartoes' },
      cartao('Receitas', receitas, 'receita', 'total-receitas'),
      cartao('Despesas', despesas, 'despesa', 'total-despesas'),
      cartao(
        'Resultado do mês',
        saldo,
        saldo < 0 ? 'despesa' : 'receita',
        'saldo',
        true,
        descreverResultado({ receitas, despesas, saldo }),
      ),
    ),
    secaoCartao(
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
    ...(naturezas.length === 2
      ? [secaoCartao('Despesas fixas e variáveis', graficoBarras(naturezas))]
      : []),
  );

  if (doMesLista.length > 0) {
    container.append(
      secaoCartao(
        'Relatório do mês',
        h(
          'p',
          {},
          `Gera um PDF com o resumo e todos os lançamentos de ${formatarMes(ctx.estado.mes)}.`,
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'botao botao--secundario',
            'data-testid': 'botao-relatorio-pdf',
            onclick: () => salvarRelatorio(ctx, doMesLista),
          },
          'Salvar relatório em PDF',
        ),
      ),
    );
  }
}
