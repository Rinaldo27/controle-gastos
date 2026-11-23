import { h, secao } from './dom.js';
import { avisar } from './avisos.js';
import { entregarArquivo } from './arquivos.js';
import { exportarDados, importarDados } from '../data/backup.js';
import { hojeISO } from '../domain/datas.js';
import { ehIOS, estaInstalado, instalar, podeInstalarNativamente } from '../pwa/instalacao.js';

async function exportar(ctx) {
  try {
    const texto = JSON.stringify(await exportarDados(ctx.repo), null, 2);
    const arquivo = new File([texto], `expense-tracker-${hojeISO()}.json`, {
      type: 'application/json',
    });
    if (await entregarArquivo(arquivo, 'Backup do Expense Tracker')) {
      avisar('Backup exportado.', { tipo: 'sucesso' });
    }
  } catch (erro) {
    avisar(erro.message, { tipo: 'erro' });
  }
}

async function importar(evento, ctx) {
  const entrada = evento.target;
  const arquivo = entrada.files[0];
  if (!arquivo) return;

  try {
    const { importados, ignorados } = await importarDados(ctx.repo, await arquivo.text());
    avisar(`Backup importado: ${importados} atualizado(s), ${ignorados} já estavam em dia.`, {
      tipo: 'sucesso',
    });
    await ctx.recarregar();
  } catch (erro) {
    avisar(erro.message, { tipo: 'erro' });
    entrada.value = '';
  }
}

function secaoInstalacao() {
  if (estaInstalado()) {
    return secao('Aplicativo', h('p', {}, 'O app já está instalado neste aparelho.'));
  }
  if (podeInstalarNativamente()) {
    return secao(
      'Instalar no celular',
      h(
        'p',
        {},
        'Instale para abrir em tela cheia, direto da tela inicial, e usar mesmo sem internet.',
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'botao botao--primario',
          'data-testid': 'botao-instalar',
          onclick: async () => {
            if (await instalar()) avisar('App instalado.', { tipo: 'sucesso' });
          },
        },
        'Instalar aplicativo',
      ),
    );
  }
  if (ehIOS()) {
    return secao(
      'Instalar no iPhone',
      h(
        'p',
        {},
        'Abra este site no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.',
      ),
      h(
        'p',
        { class: 'nota' },
        'O app instalado guarda os dados separados do Safari. Instale antes de registrar dados reais ' +
          'ou transfira os dados com Exportar e Importar.',
      ),
    );
  }
  return secao(
    'Instalar no celular',
    h(
      'p',
      {},
      'No Android, abra o menu do Chrome (⋮) e toque em “Instalar app” ou “Adicionar à tela inicial”.',
    ),
  );
}

export async function renderAjustes(container, ctx) {
  container.append(
    h('h1', { tabindex: '-1' }, 'Ajustes'),
    secaoInstalacao(),
    secao(
      'Backup dos dados',
      h(
        'p',
        {},
        'Os lançamentos ficam só neste aparelho. Exporte uma cópia de vez em quando e use-a para restaurar ou trocar de celular.',
      ),
      h(
        'div',
        { class: 'acoes' },
        h(
          'button',
          {
            type: 'button',
            class: 'botao botao--secundario',
            'data-testid': 'botao-exportar',
            onclick: () => exportar(ctx),
          },
          'Exportar backup',
        ),
      ),
      h(
        'div',
        { class: 'campo' },
        h('label', { for: 'arquivo-backup' }, 'Importar backup (arquivo .json)'),
        h('input', {
          type: 'file',
          id: 'arquivo-backup',
          accept: 'application/json,.json',
          'data-testid': 'arquivo-backup',
          onchange: (evento) => importar(evento, ctx),
        }),
      ),
    ),
  );
}
