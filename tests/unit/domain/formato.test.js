import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  centavosParaInput,
  formatarMoeda,
  formatarValor,
  parseValorParaCentavos,
} from '../../../src/js/domain/formato.js';
import {
  dataValida,
  deslocarMes,
  formatarMes,
  formatarMesCurto,
  hojeISO,
  mesAtual,
} from '../../../src/js/domain/datas.js';

test('parseValorParaCentavos aceita formatos brasileiros e com ponto', () => {
  assert.equal(parseValorParaCentavos('25,90'), 2590);
  assert.equal(parseValorParaCentavos('1.234,56'), 123456);
  assert.equal(parseValorParaCentavos('12'), 1200);
  assert.equal(parseValorParaCentavos('12,5'), 1250);
  assert.equal(parseValorParaCentavos('12.5'), 1250);
  assert.equal(parseValorParaCentavos('1.234'), 123400);
  assert.equal(parseValorParaCentavos('R$ 10,00'), 1000);
  assert.equal(parseValorParaCentavos('0,00'), 0);
});

test('parseValorParaCentavos rejeita entradas inválidas', () => {
  for (const entrada of [
    '',
    '   ',
    'abc',
    '-5',
    '1,234',
    '1,2,3',
    '12,',
    ',50',
    null,
    undefined,
    10,
  ]) {
    assert.equal(
      parseValorParaCentavos(entrada),
      null,
      `deveria rejeitar ${JSON.stringify(entrada)}`,
    );
  }
});

test('formatarMoeda usa o padrão pt-BR', () => {
  assert.equal(formatarMoeda(123456).replace(/\u00a0/g, ' '), 'R$ 1.234,56');
  assert.equal(formatarMoeda(0).replace(/\u00a0/g, ' '), 'R$ 0,00');
});

test('formatarValor não inclui o símbolo da moeda', () => {
  assert.equal(formatarValor(123456), '1.234,56');
  assert.equal(formatarValor(-5000), '-50,00');
});

test('centavosParaInput gera texto editável', () => {
  assert.equal(centavosParaInput(2590), '25,90');
  assert.equal(centavosParaInput(5), '0,05');
  assert.equal(centavosParaInput(100000), '1000,00');
});

test('hojeISO e mesAtual usam a data local', () => {
  const noite = new Date(2026, 10, 22, 23, 59);
  assert.equal(hojeISO(noite), '2026-11-22');
  assert.equal(mesAtual(noite), '2026-11');
});

test('deslocarMes cruza a virada de ano nos dois sentidos', () => {
  assert.equal(deslocarMes('2026-01', -1), '2025-12');
  assert.equal(deslocarMes('2026-11', 2), '2027-01');
  assert.equal(deslocarMes('2026-06', 0), '2026-06');
  assert.equal(deslocarMes('2026-03', -14), '2025-01');
});

test('dataValida rejeita datas que não existem', () => {
  assert.equal(dataValida('2026-02-30'), false);
  assert.equal(dataValida('2025-02-29'), false);
  assert.equal(dataValida('2024-02-29'), true);
  assert.equal(dataValida('2026-13-01'), false);
  assert.equal(dataValida('22/11/2026'), false);
  assert.equal(dataValida(''), false);
  assert.equal(dataValida(undefined), false);
});

test('formatação de datas', () => {
  assert.equal(formatarMes('2026-03'), 'março de 2026');
  assert.equal(formatarMesCurto('2026-11'), 'nov/26');
});
