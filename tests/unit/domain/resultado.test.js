import { test } from 'node:test';
import assert from 'node:assert/strict';
import { descreverResultado } from '../../../src/js/domain/regras.js';
import { gerarRelatorioMensal } from '../../../src/js/domain/relatorioPdf.js';

test('descreve o resultado do mês em linguagem comum', () => {
  assert.equal(
    descreverResultado({ receitas: 500000, despesas: 192050, saldo: 307950 }),
    'Sobrou este mês',
  );
  assert.equal(
    descreverResultado({ receitas: 80000, despesas: 182000, saldo: -102000 }),
    'Gastou mais do que recebeu',
  );
  assert.equal(
    descreverResultado({ receitas: 0, despesas: 10000, saldo: -10000 }),
    'Gastou mais do que recebeu',
  );
});

test('trata o mês zerado: sem lançamentos ou entrada igual à saída', () => {
  assert.equal(
    descreverResultado({ receitas: 0, despesas: 0, saldo: 0 }),
    'Sem lançamentos neste mês',
  );
  assert.equal(
    descreverResultado({ receitas: 10000, despesas: 10000, saldo: 0 }),
    'Entrou e saiu o mesmo valor',
  );
});

test('a mesma frase aparece no relatório em PDF', () => {
  const lancamento = (tipo, valorCentavos) => ({
    id: `id-${tipo}`,
    tipo,
    natureza: 'variavel',
    descricao: 'Teste',
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

  assert.ok(
    textos([lancamento('receita', 5000), lancamento('despesa', 1000)]).includes('Sobrou este mês'),
  );
  assert.ok(textos([lancamento('despesa', 1000)]).includes('Gastou mais do que recebeu'));
  assert.ok(textos([]).includes('Sem lançamentos neste mês'));
});
