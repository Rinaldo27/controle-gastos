import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularTotais,
  daCategoria,
  doMes,
  evolucaoMensal,
  ordenarRecentesPrimeiro,
  totaisPorCategoria,
  totaisPorNatureza,
} from '../../../src/js/domain/regras.js';

let contador = 0;
const lanc = (campos) => ({
  id: `id-${++contador}`,
  tipo: 'despesa',
  natureza: 'variavel',
  descricao: 'x',
  valorCentavos: 1000,
  data: '2026-11-10',
  categoria: 'Outros',
  criadoEm: `2026-11-10T10:00:0${contador % 10}.000Z`,
  atualizadoEm: '2026-11-10T10:00:00.000Z',
  removidoEm: null,
  ...campos,
});

const base = [
  lanc({ tipo: 'receita', categoria: 'Salário', valorCentavos: 500000, natureza: 'fixa' }),
  lanc({ categoria: 'Moradia', valorCentavos: 150000, natureza: 'fixa' }),
  lanc({ categoria: 'Alimentação', valorCentavos: 30000 }),
  lanc({ categoria: 'Alimentação', valorCentavos: 12050, data: '2026-11-25' }),
  lanc({ categoria: 'Lazer', valorCentavos: 9000, data: '2026-10-31' }),
];

test('calcularTotais soma receitas e despesas e calcula o saldo', () => {
  assert.deepEqual(calcularTotais(doMes(base, '2026-11')), {
    receitas: 500000,
    despesas: 192050,
    saldo: 307950,
  });
});

test('calcularTotais sem lançamentos devolve zeros e saldo negativo é possível', () => {
  assert.deepEqual(calcularTotais([]), { receitas: 0, despesas: 0, saldo: 0 });
  assert.equal(calcularTotais([lanc({ valorCentavos: 100 })]).saldo, -100);
});

test('doMes respeita a fronteira entre meses', () => {
  assert.equal(doMes(base, '2026-10').length, 1);
  assert.equal(doMes(base, '2026-11').length, 4);
  assert.equal(doMes(base, '2026-12').length, 0);
});

test('daCategoria filtra e, sem categoria, devolve tudo', () => {
  assert.equal(daCategoria(base, 'Alimentação').length, 2);
  assert.equal(daCategoria(base, '').length, base.length);
  assert.equal(daCategoria(base, 'Inexistente').length, 0);
});

test('totaisPorCategoria agrupa despesas em ordem decrescente', () => {
  assert.deepEqual(totaisPorCategoria(doMes(base, '2026-11'), 'despesa'), [
    { categoria: 'Moradia', totalCentavos: 150000 },
    { categoria: 'Alimentação', totalCentavos: 42050 },
  ]);
  assert.deepEqual(totaisPorCategoria([], 'despesa'), []);
});

test('totaisPorNatureza separa fixas e variáveis', () => {
  assert.deepEqual(totaisPorNatureza(doMes(base, '2026-11'), 'despesa'), {
    fixa: 150000,
    variavel: 42050,
  });
});

test('evolucaoMensal devolve a série em ordem cronológica, inclusive entre anos', () => {
  const serie = evolucaoMensal(base, '2026-11', 3);
  assert.deepEqual(
    serie.map((m) => m.mes),
    ['2026-09', '2026-10', '2026-11'],
  );
  assert.equal(serie[0].saldo, 0);
  assert.equal(serie[1].despesas, 9000);
  assert.equal(serie[2].saldo, 307950);
  assert.deepEqual(
    evolucaoMensal([], '2026-01', 2).map((m) => m.mes),
    ['2025-12', '2026-01'],
  );
});

test('ordenarRecentesPrimeiro ordena por data e não altera o original', () => {
  const copia = [...base];
  const ordenados = ordenarRecentesPrimeiro(base);
  assert.equal(ordenados[0].data, '2026-11-25');
  assert.equal(ordenados.at(-1).data, '2026-10-31');
  assert.deepEqual(base, copia);
});
