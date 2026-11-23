const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

const pad = (numero) => String(numero).padStart(2, '0');

// Usa a data local do aparelho: toISOString() devolveria a data em UTC e erraria o dia à noite.
export function hojeISO(agora = new Date()) {
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}

export function mesAtual(agora = new Date()) {
  return hojeISO(agora).slice(0, 7);
}

export function mesDe(dataISO) {
  return dataISO.slice(0, 7);
}

export function deslocarMes(mes, delta) {
  const [ano, numero] = mes.split('-').map(Number);
  const total = ano * 12 + (numero - 1) + delta;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

export function formatarMes(mes) {
  const [ano, numero] = mes.split('-').map(Number);
  return `${MESES[numero - 1]} de ${ano}`;
}

export function formatarMesCurto(mes) {
  const [ano, numero] = mes.split('-').map(Number);
  return `${MESES_CURTOS[numero - 1]}/${String(ano).slice(2)}`;
}

export function formatarDataCurta(dataISO) {
  const [, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}`;
}

export function dataValida(dataISO) {
  if (typeof dataISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) return false;
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  );
}
