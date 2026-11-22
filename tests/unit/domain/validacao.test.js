import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITES, validarLancamento } from '../../../src/js/domain/validacao.js';

const valido = () => ({
  tipo: 'despesa',
  natureza: 'variavel',
  descricao: 'Mercado',
  valorCentavos: 2590,
  data: '2026-11-22',
  categoria: 'Alimentação',
});

test('aceita um lançamento completo', () => {
  assert.deepEqual(validarLancamento(valido()), { valido: true, erros: {} });
});

test('exige descrição e respeita o limite de caracteres', () => {
  assert.ok(validarLancamento({ ...valido(), descricao: '   ' }).erros.descricao);
  assert.ok(validarLancamento({ ...valido(), descricao: undefined }).erros.descricao);
  assert.equal(
    validarLancamento({ ...valido(), descricao: 'a'.repeat(LIMITES.descricaoMax) }).valido,
    true,
  );
  assert.ok(
    validarLancamento({ ...valido(), descricao: 'a'.repeat(LIMITES.descricaoMax + 1) }).erros
      .descricao,
  );
});

test('valor precisa ser inteiro positivo dentro do limite', () => {
  for (const valorCentavos of [null, undefined, 0, -1, 10.5, '25', NaN]) {
    assert.ok(
      validarLancamento({ ...valido(), valorCentavos }).erros.valor,
      `rejeitar ${valorCentavos}`,
    );
  }
  assert.equal(validarLancamento({ ...valido(), valorCentavos: 1 }).valido, true);
  assert.equal(
    validarLancamento({ ...valido(), valorCentavos: LIMITES.valorMaxCentavos }).valido,
    true,
  );
  assert.ok(
    validarLancamento({ ...valido(), valorCentavos: LIMITES.valorMaxCentavos + 1 }).erros.valor,
  );
});

test('data precisa existir e estar no intervalo de anos', () => {
  assert.ok(validarLancamento({ ...valido(), data: '2026-02-30' }).erros.data);
  assert.ok(validarLancamento({ ...valido(), data: '' }).erros.data);
  assert.ok(validarLancamento({ ...valido(), data: '1999-12-31' }).erros.data);
  assert.ok(validarLancamento({ ...valido(), data: '2101-01-01' }).erros.data);
});

test('categoria precisa pertencer ao tipo escolhido', () => {
  assert.ok(validarLancamento({ ...valido(), categoria: 'Salário' }).erros.categoria);
  assert.ok(validarLancamento({ ...valido(), categoria: '' }).erros.categoria);
  assert.equal(
    validarLancamento({ ...valido(), tipo: 'receita', categoria: 'Salário' }).valido,
    true,
  );
});

test('tipo e natureza precisam ser valores conhecidos', () => {
  const resultado = validarLancamento({ ...valido(), tipo: 'outro', natureza: 'talvez' });
  assert.ok(resultado.erros.tipo);
  assert.ok(resultado.erros.natureza);
  assert.equal(resultado.valido, false);
});
