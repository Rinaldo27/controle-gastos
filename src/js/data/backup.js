import { validarLancamento } from '../domain/validacao.js';
import { SCHEMA_VERSION } from './repositorioLocalStorage.js';

const APP = 'expense-tracker';

export async function exportarDados(repositorio, agora = new Date().toISOString()) {
  const lancamentos = await repositorio.listar({ incluirRemovidos: true });
  return { app: APP, schemaVersion: SCHEMA_VERSION, exportadoEm: agora, lancamentos };
}

function normalizar(bruto, posicao) {
  const item = bruto ?? {};
  const textoOuNulo = (valor) => (typeof valor === 'string' && valor ? valor : null);
  const lancamento = {
    id: textoOuNulo(item.id),
    tipo: item.tipo,
    natureza: item.natureza,
    descricao: item.descricao,
    valorCentavos: item.valorCentavos,
    data: item.data,
    categoria: item.categoria,
    criadoEm: textoOuNulo(item.criadoEm),
    atualizadoEm: textoOuNulo(item.atualizadoEm),
    removidoEm: textoOuNulo(item.removidoEm),
  };
  const { valido } = validarLancamento(lancamento);
  if (!valido || !lancamento.id || !lancamento.criadoEm || !lancamento.atualizadoEm) {
    throw new Error(
      `Backup inválido: o lançamento ${posicao + 1} está incompleto ou com dados incorretos.`,
    );
  }
  lancamento.descricao = lancamento.descricao.trim();
  return lancamento;
}

export function lerBackup(texto) {
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error('Backup inválido: o arquivo não é um JSON válido.');
  }
  if (!dados || dados.app !== APP || !Array.isArray(dados.lancamentos)) {
    throw new Error('Backup inválido: este arquivo não é um backup do Expense Tracker.');
  }
  if (!(dados.schemaVersion <= SCHEMA_VERSION)) {
    throw new Error('Este backup foi criado por uma versão mais nova do app. Atualize o app.');
  }
  return dados.lancamentos.map(normalizar);
}

// Mescla por id: só substitui um lançamento local se o do backup foi atualizado depois.
export async function importarDados(repositorio, texto) {
  const doBackup = lerBackup(texto);
  const locais = new Map(
    (await repositorio.listar({ incluirRemovidos: true })).map((l) => [l.id, l]),
  );
  const aSalvar = doBackup.filter((l) => {
    const local = locais.get(l.id);
    return !local || l.atualizadoEm > local.atualizadoEm;
  });
  await repositorio.salvarVarios(aSalvar);
  return { importados: aSalvar.length, ignorados: doBackup.length - aSalvar.length };
}
