import { CATEGORIAS } from '../domain/categorias.js';
import { criarLancamento, atualizarLancamento } from '../domain/lancamento.js';
import { validarLancamento } from '../domain/validacao.js';
import { centavosParaInput, parseValorParaCentavos } from '../domain/formato.js';
import { formatarMes, hojeISO, mesDe } from '../domain/datas.js';
import { avisar } from './avisos.js';

const CAMPOS_COM_ERRO = ['descricao', 'valor', 'data', 'categoria'];

export function iniciarFormulario(ctx) {
  const dialogo = document.getElementById('dialogo-lancamento');
  const form = document.getElementById('formulario-lancamento');
  const titulo = document.getElementById('titulo-formulario');
  let editandoId = null;
  let salvando = false;

  function preencherCategorias(tipo, selecionada = '') {
    const seletor = form.elements.categoria;
    seletor.replaceChildren(
      new Option('Selecione…', ''),
      ...CATEGORIAS[tipo].map((nome) => new Option(nome, nome)),
    );
    seletor.value = selecionada;
  }

  function mostrarErro(campo, mensagem) {
    const entrada = document.getElementById(`campo-${campo}`);
    const erro = document.getElementById(`erro-${campo}`);
    erro.textContent = mensagem;
    erro.hidden = !mensagem;
    if (mensagem) entrada.setAttribute('aria-invalid', 'true');
    else entrada.removeAttribute('aria-invalid');
  }

  function limparErros() {
    for (const campo of CAMPOS_COM_ERRO) mostrarErro(campo, '');
  }

  function abrir(lancamento = null) {
    editandoId = lancamento?.id ?? null;
    titulo.textContent = lancamento ? 'Editar lançamento' : 'Novo lançamento';
    form.reset();
    limparErros();
    form.elements.tipo.value = lancamento?.tipo ?? 'despesa';
    form.elements.natureza.value = lancamento?.natureza ?? 'variavel';
    form.elements.descricao.value = lancamento?.descricao ?? '';
    form.elements.valor.value = lancamento ? centavosParaInput(lancamento.valorCentavos) : '';
    form.elements.data.value = lancamento?.data ?? hojeISO();
    preencherCategorias(form.elements.tipo.value, lancamento?.categoria);
    dialogo.showModal();
  }

  async function salvar() {
    if (salvando) return;

    const entrada = {
      tipo: form.elements.tipo.value,
      natureza: form.elements.natureza.value,
      descricao: form.elements.descricao.value,
      valorCentavos: parseValorParaCentavos(form.elements.valor.value),
      data: form.elements.data.value,
      categoria: form.elements.categoria.value,
    };

    const { valido, erros } = validarLancamento(entrada);
    limparErros();
    if (!valido) {
      const comErro = CAMPOS_COM_ERRO.filter((campo) => erros[campo]);
      comErro.forEach((campo) => mostrarErro(campo, erros[campo]));
      if (comErro.length) document.getElementById(`campo-${comErro[0]}`).focus();
      else avisar('Revise os dados do lançamento.', { tipo: 'erro' });
      return;
    }

    salvando = true;
    try {
      const existente = editandoId ? await ctx.repo.obter(editandoId) : null;
      if (editandoId && !existente) throw new Error('O lançamento não foi encontrado.');
      const lancamento = existente
        ? atualizarLancamento(existente, entrada)
        : criarLancamento(entrada);
      await ctx.repo.salvar(lancamento);
      const mesAnterior = ctx.estado.mes;
      ctx.estado.mes = mesDe(lancamento.data);
      dialogo.close();
      avisar(
        ctx.estado.mes === mesAnterior
          ? 'Lançamento salvo.'
          : `Lançamento salvo em ${formatarMes(ctx.estado.mes)}.`,
        { tipo: 'sucesso' },
      );
      await ctx.recarregar();
    } catch (erro) {
      avisar(erro.message, { tipo: 'erro' });
    } finally {
      salvando = false;
    }
  }

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    salvar();
  });

  form.addEventListener('change', (evento) => {
    if (evento.target.name !== 'tipo') return;
    const atual = form.elements.categoria.value;
    preencherCategorias(
      evento.target.value,
      CATEGORIAS[evento.target.value].includes(atual) ? atual : '',
    );
  });

  document.getElementById('cancelar-formulario').addEventListener('click', () => dialogo.close());
  document.getElementById('botao-novo').addEventListener('click', () => abrir());

  return { abrir };
}
