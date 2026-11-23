import { criarRepositorio } from './data/repositorio.js';
import { deslocarMes, formatarMes, mesAtual } from './domain/datas.js';
import { iniciarInstalacao } from './pwa/instalacao.js';
import { registrarServiceWorker } from './pwa/registro.js';
import { renderAjustes } from './ui/ajustes.js';
import { avisar } from './ui/avisos.js';
import { h } from './ui/dom.js';
import { iniciarFormulario } from './ui/formulario.js';
import { renderLancamentos } from './ui/lancamentos.js';
import { renderRelatorios } from './ui/relatorios.js';
import { renderResumo } from './ui/resumo.js';

const ROTAS = {
  resumo: { titulo: 'Resumo', render: renderResumo, seletorMes: true, botaoNovo: true },
  lancamentos: {
    titulo: 'Lançamentos',
    render: renderLancamentos,
    seletorMes: true,
    botaoNovo: true,
  },
  relatorios: {
    titulo: 'Relatórios',
    render: renderRelatorios,
    seletorMes: true,
    botaoNovo: false,
  },
  ajustes: { titulo: 'Ajustes', render: renderAjustes, seletorMes: false, botaoNovo: false },
};
const ROTA_PADRAO = 'resumo';

const ctx = {
  repo: criarRepositorio(),
  estado: {
    mes: mesAtual(),
    categoria: '',
    relatorio: { meses: 6, categoria: '' },
  },
  recarregar: () => renderizar(),
  abrirFormulario: null,
};

let versaoDaRenderizacao = 0;

function rotaAtual() {
  const nome = window.location.hash.replace(/^#\/?/, '');
  return ROTAS[nome] ? nome : ROTA_PADRAO;
}

async function renderizar({ moverFoco = false } = {}) {
  const versao = ++versaoDaRenderizacao;
  const nome = rotaAtual();
  const rota = ROTAS[nome];

  document.getElementById('seletor-mes').hidden = !rota.seletorMes;
  document.getElementById('mes-atual').textContent = formatarMes(ctx.estado.mes);
  document.getElementById('botao-novo').hidden = !rota.botaoNovo;
  document.title = `${rota.titulo} · Expense Tracker`;
  for (const link of document.querySelectorAll('.navegacao a')) {
    if (link.dataset.rota === nome) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  const conteudo = document.createElement('div');
  try {
    await rota.render(conteudo, ctx);
  } catch (erro) {
    conteudo.replaceChildren(h('p', { class: 'erro-geral', role: 'alert' }, erro.message));
  }

  if (versao !== versaoDaRenderizacao) return;
  document.getElementById('principal').replaceChildren(conteudo);
  if (moverFoco) conteudo.querySelector('h1')?.focus();
}

function mudarMes(delta) {
  ctx.estado.mes = deslocarMes(ctx.estado.mes, delta);
  renderizar();
}

function iniciar() {
  ctx.abrirFormulario = iniciarFormulario(ctx).abrir;

  document.getElementById('mes-anterior').addEventListener('click', () => mudarMes(-1));
  document.getElementById('mes-seguinte').addEventListener('click', () => mudarMes(1));
  window.addEventListener('hashchange', () => renderizar({ moverFoco: true }));

  iniciarInstalacao(() => {
    if (rotaAtual() === 'ajustes') renderizar();
  });
  registrarServiceWorker({
    aoHaverAtualizacao: (aplicar) =>
      avisar('Há uma nova versão do app.', {
        acao: { rotulo: 'Atualizar', executar: aplicar },
      }),
  });

  // Pede ao navegador para não apagar os dados locais quando faltar espaço.
  Promise.resolve(navigator.storage?.persist?.()).catch(() => {});

  return renderizar();
}

iniciar();
