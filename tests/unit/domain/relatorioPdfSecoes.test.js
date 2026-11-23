import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarRelatorioMensal } from '../../../src/js/domain/relatorioPdf.js';

const lanc = (id, natureza, valorCentavos) => ({
  id,
  tipo: 'despesa',
  natureza,
  descricao: `Item ${id}`,
  valorCentavos,
  data: '2026-11-10',
  categoria: 'Outros',
  criadoEm: '2026-11-10T10:00:00.000Z',
  atualizadoEm: '2026-11-10T10:00:00.000Z',
  removidoEm: null,
});

const textos = (lancamentos) =>
  [
    ...new TextDecoder('latin1')
      .decode(gerarRelatorioMensal({ lancamentos, mes: '2026-11', geradoEm: '2026-11-22' }))
      .matchAll(/<([0-9A-F]+)> Tj/g),
  ].map((m) => Buffer.from(m[1], 'hex').toString('latin1'));

test('com fixas e variáveis, o relatório traz a seção com as duas linhas', () => {
  const t = textos([lanc('a', 'fixa', 150000), lanc('b', 'variavel', 50000)]);
  assert.ok(t.includes('Despesas fixas e variáveis'));
  assert.ok(t.includes('Fixas') && t.includes('Variáveis'));
});

test('com um só tipo de despesa, a seção de fixas e variáveis não aparece', () => {
  for (const natureza of ['fixa', 'variavel']) {
    const t = textos([lanc('a', natureza, 10000)]);
    assert.ok(!t.includes('Despesas fixas e variáveis'), `não deveria aparecer só com ${natureza}`);
    assert.ok(!t.some((texto) => texto.includes('R$ 0,00 (0%)')), 'linha zerada apareceu');
  }
});
