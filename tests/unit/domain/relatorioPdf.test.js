import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ajustarTexto, criarPdf, larguraMono } from '../../../src/js/domain/pdf.js';
import { gerarRelatorioMensal } from '../../../src/js/domain/relatorioPdf.js';
import { formatarData } from '../../../src/js/domain/datas.js';

let contador = 0;
const lanc = (campos) => ({
  id: `id-${++contador}`,
  tipo: 'despesa',
  natureza: 'variavel',
  descricao: 'Mercado',
  valorCentavos: 32050,
  data: '2026-11-10',
  categoria: 'Alimentação',
  criadoEm: `2026-11-10T10:00:${String(contador % 60).padStart(2, '0')}.000Z`,
  atualizadoEm: '2026-11-10T10:00:00.000Z',
  removidoEm: null,
  ...campos,
});

const gerar = (lancamentos) =>
  gerarRelatorioMensal({ lancamentos, mes: '2026-11', geradoEm: '2026-11-22' });

const comoTexto = (bytes) => new TextDecoder('latin1').decode(bytes);

// O PDF grava cada trecho de texto como <HEX> Tj; aqui voltamos a ler esses trechos.
function textosDoPdf(bytes) {
  return [...comoTexto(bytes).matchAll(/<([0-9A-F]+)> Tj/g)].map((m) =>
    Buffer.from(m[1], 'hex').toString('latin1'),
  );
}

const base = [
  lanc({
    tipo: 'receita',
    natureza: 'fixa',
    descricao: 'Salário',
    categoria: 'Salário',
    valorCentavos: 500000,
    data: '2026-11-05',
  }),
  lanc({ natureza: 'fixa', descricao: 'Aluguel', categoria: 'Moradia', valorCentavos: 150000 }),
  lanc({}),
];

test('gera um PDF estruturalmente válido, com tabela de referências correta', () => {
  const bytes = gerar(base);
  const pdf = comoTexto(bytes);
  assert.ok(pdf.startsWith('%PDF-1.4\n'));
  assert.ok(pdf.endsWith('%%EOF\n'));

  const inicioTabela = Number(pdf.match(/startxref\n(\d+)\n/)[1]);
  assert.equal(pdf.slice(inicioTabela, inicioTabela + 4), 'xref');

  const entradas = [...pdf.slice(inicioTabela).matchAll(/^(\d{10}) 00000 n $/gm)];
  assert.ok(entradas.length >= 7);
  entradas.forEach((entrada, indice) => {
    assert.ok(
      pdf.slice(Number(entrada[1])).startsWith(`${indice + 1} 0 obj`),
      `a referência do objeto ${indice + 1} aponta para o lugar errado`,
    );
  });
});

test('traz título, totais, lançamentos e acentos corretos', () => {
  const textos = textosDoPdf(gerar(base));
  for (const esperado of [
    'Relatório de novembro de 2026',
    'Gerado em 22/11/2026',
    'Receitas',
    'Despesas',
    'Resultado do mês',
    'R$ 5.000,00',
    'R$ 1.820,50',
    'R$ 3.179,50',
    'Salário',
    'Aluguel',
    'Mercado',
    'Alimentação',
    'Moradia',
    '10/11/2026',
  ]) {
    assert.ok(textos.includes(esperado), `faltou "${esperado}" no PDF`);
  }
});

test('despesas aparecem com sinal de menos e receitas sem', () => {
  const textos = textosDoPdf(gerar(base));
  assert.ok(textos.includes('-R$ 320,50'));
  assert.ok(textos.includes('-R$ 1.500,00'));
  assert.ok(textos.includes('R$ 5.000,00'));
  assert.ok(!textos.includes('-R$ 5.000,00'));
});

test('resultado negativo aparece com sinal', () => {
  const textos = textosDoPdf(gerar([lanc({ valorCentavos: 10000 })]));
  assert.ok(textos.includes('-R$ 100,00'));
});

test('divide em várias páginas, repete o cabeçalho e numera as páginas', () => {
  const muitos = Array.from({ length: 70 }, (_, i) =>
    lanc({ descricao: `Item ${i + 1}`, data: `2026-11-${String((i % 28) + 1).padStart(2, '0')}` }),
  );
  const bytes = gerar(muitos);
  const paginas = comoTexto(bytes).match(/\/Type \/Page /g).length;
  assert.ok(paginas >= 2, `esperava 2 páginas ou mais, veio ${paginas}`);

  const textos = textosDoPdf(bytes);
  assert.ok(textos.includes(`Página 1 de ${paginas}`));
  assert.ok(textos.includes(`Página ${paginas} de ${paginas}`));
  assert.ok(textos.filter((t) => t === 'Descrição').length >= 2, 'cabeçalho não se repetiu');
  assert.ok(textos.includes('Item 1') && textos.includes('Item 70'));
});

test('descrições longas são truncadas em vez de invadir a coluna ao lado', () => {
  const textos = textosDoPdf(gerar([lanc({ descricao: 'W'.repeat(80) })]));
  const truncado = textos.find((t) => t.startsWith('WWW'));
  assert.ok(truncado.endsWith('...'));
  assert.ok(truncado.length < 80);
});

test('caracteres fora do Latin-1 viram "?" sem quebrar o arquivo', () => {
  const bytes = gerar([lanc({ descricao: 'Café ☕ “bom”' })]);
  assert.ok(textosDoPdf(bytes).includes('Café ? "bom"'));
});

test('mês sem lançamentos ainda gera um relatório válido', () => {
  const textos = textosDoPdf(gerar([]));
  assert.ok(textos.includes('Nenhum lançamento neste mês.'));
  assert.ok(textos.includes('Nenhuma despesa neste mês.'));
  assert.ok(textos.includes('R$ 0,00'));
});

test('o texto do usuário não consegue fechar nem escapar da string do PDF', () => {
  const textos = textosDoPdf(gerar([lanc({ descricao: ') Tj ET /F1 99 Tf (\\ >> endobj' })]));
  assert.ok(textos.some((t) => t.startsWith(') Tj ET')));
});

test('ajustarTexto só acrescenta reticências quando precisa', () => {
  assert.equal(ajustarTexto('Mercado', 200, 9), 'Mercado');
  assert.equal(ajustarTexto('a\nb', 200, 9), 'a b');
  assert.ok(ajustarTexto('x'.repeat(100), 100, 9).endsWith('...'));
});

test('larguraMono usa 0,6 do tamanho por caractere', () => {
  assert.equal(larguraMono('R$ 10,00', 10), 8 * 6);
});

test('um PDF sem páginas continua bem formado', () => {
  const bytes = criarPdf().gerar();
  assert.ok(comoTexto(bytes).includes('/Count 0'));
});

test('formatarData usa dd/mm/aaaa', () => {
  assert.equal(formatarData('2026-11-22'), '22/11/2026');
});
