// Escritor mínimo de PDF: texto e retângulos em fontes padrão, sem dependências.
// O texto é gravado em hexadecimal e o arquivo inteiro é ASCII, então não há problema de codificação.

const FONTES = { normal: 'F1', negrito: 'F2', mono: 'F3' };

const SUBSTITUICOES = {
  '–': '-',
  '—': '-',
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '…': '...',
  '•': '-',
};

const numero = (valor) => String(Number(valor.toFixed(2)));
const corPdf = (cor) => cor.map((canal) => (canal / 255).toFixed(3)).join(' ');
const limparEspacos = (texto) => String(texto).replace(/[\r\n\t]+/g, ' ');

// As fontes padrão do PDF cobrem o Latin-1 (acentos do português). O resto vira "?".
function paraHexadecimal(texto) {
  let hex = '';
  for (const caractere of limparEspacos(texto)) {
    for (const simbolo of SUBSTITUICOES[caractere] ?? caractere) {
      const codigo = simbolo.codePointAt(0);
      const valido = (codigo >= 0x20 && codigo <= 0x7e) || (codigo >= 0xa0 && codigo <= 0xff);
      hex += (valido ? codigo : 0x3f).toString(16).padStart(2, '0');
    }
  }
  return hex.toUpperCase();
}

// Estimativa propositalmente generosa: serve para truncar texto sem invadir a coluna do lado.
export function larguraAproximada(texto, tamanho) {
  let largura = 0;
  for (const caractere of limparEspacos(texto)) {
    if (caractere === ' ') largura += 0.28;
    else if ("ijl.,:;'!|()".includes(caractere)) largura += 0.26;
    else if ('mwMW@%'.includes(caractere)) largura += 0.85;
    else if (/[A-Z]/.test(caractere)) largura += 0.7;
    else largura += 0.56;
  }
  return largura * tamanho;
}

// Courier tem largura fixa (0,6 do tamanho): permite alinhar valores à direita com exatidão.
export function larguraMono(texto, tamanho) {
  return [...limparEspacos(texto)].length * 0.6 * tamanho;
}

export function ajustarTexto(texto, larguraMaxima, tamanho) {
  const limpo = limparEspacos(texto);
  if (larguraAproximada(limpo, tamanho) <= larguraMaxima) return limpo;
  let corte = limpo.length;
  while (corte > 0 && larguraAproximada(`${limpo.slice(0, corte)}...`, tamanho) > larguraMaxima) {
    corte -= 1;
  }
  return `${limpo.slice(0, corte).trimEnd()}...`;
}

function criarPagina() {
  const operacoes = [];
  return {
    operacoes,
    texto(x, y, conteudo, { tamanho = 10, fonte = 'normal', cor = [0, 0, 0] } = {}) {
      operacoes.push(
        `${corPdf(cor)} rg BT /${FONTES[fonte]} ${numero(tamanho)} Tf ${numero(x)} ${numero(y)} Td <${paraHexadecimal(conteudo)}> Tj ET`,
      );
    },
    retangulo(x, y, largura, altura, cor) {
      operacoes.push(
        `${corPdf(cor)} rg ${numero(x)} ${numero(y)} ${numero(largura)} ${numero(altura)} re f`,
      );
    },
    linha(x1, y1, x2, y2, cor, espessura = 0.5) {
      operacoes.push(
        `${corPdf(cor)} RG ${numero(espessura)} w ${numero(x1)} ${numero(y1)} m ${numero(x2)} ${numero(y2)} l S`,
      );
    },
  };
}

export function criarPdf({ largura = 595, altura = 842 } = {}) {
  const paginas = [];

  return {
    largura,
    altura,
    paginas,
    novaPagina() {
      const pagina = criarPagina();
      paginas.push(pagina);
      return pagina;
    },
    gerar() {
      // Objetos 1 a 5: catálogo, lista de páginas e as três fontes. Depois, uma dupla (página, conteúdo) por página.
      const objetos = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        `<< /Type /Pages /Kids [${paginas.map((_, i) => `${6 + 2 * i} 0 R`).join(' ')}] /Count ${paginas.length} >>`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
      ];
      paginas.forEach((pagina, i) => {
        const conteudo = pagina.operacoes.join('\n');
        objetos.push(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${largura} ${altura}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${7 + 2 * i} 0 R >>`,
          `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`,
        );
      });

      let saida = '%PDF-1.4\n';
      const posicoes = [];
      objetos.forEach((corpo, indice) => {
        posicoes.push(saida.length);
        saida += `${indice + 1} 0 obj\n${corpo}\nendobj\n`;
      });

      const inicioTabela = saida.length;
      saida += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
      for (const posicao of posicoes) saida += `${String(posicao).padStart(10, '0')} 00000 n \n`;
      saida += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioTabela}\n%%EOF\n`;
      return new TextEncoder().encode(saida);
    },
  };
}
