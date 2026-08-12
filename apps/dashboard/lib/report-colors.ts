// Paleta validada (dataviz skill) para los 4 estados de conversación — orden fijo,
// nunca reordenar por dato ni por filtro. Mismo hex en las 4 vistas donde aparece
// (donut, gráfico por día, badges de tabla) para que la identidad sea consistente.
export const STATUS_COLORS: Record<'attended' | 'unassigned' | 'pending' | 'resolved', { light: string; dark: string; bg: string; text: string }> = {
  attended: { light: '#2a78d6', dark: '#3987e5', bg: 'bg-blue-50', text: 'text-blue-700' },
  unassigned: { light: '#eb6834', dark: '#d95926', bg: 'bg-orange-50', text: 'text-orange-700' },
  pending: { light: '#eda100', dark: '#c98500', bg: 'bg-amber-50', text: 'text-amber-700' },
  resolved: { light: '#1baf7a', dark: '#199e70', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

export const STATUS_LABELS: Record<'attended' | 'unassigned' | 'pending' | 'resolved', string> = {
  attended: 'Atendidas',
  unassigned: 'Sin asignar',
  pending: 'Pendientes',
  resolved: 'Resueltas',
};

// Delta / variación porcentual — nunca color solo, siempre con flecha + texto.
export const DELTA_POSITIVE = '#006300';
export const DELTA_NEGATIVE = '#d03b3b';
