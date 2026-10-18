// recharts pinta con atributos SVG y necesita colores literales: este es el único archivo con hex
// para gráficos. Mantener en sync con los tokens de tailwind.config.js / app/globals.css.
export const chartColors = {
  primary: '#C84B31',
  secondary: '#ECB365',
  success: '#606C38',
  danger: '#B42318',
  text: '#2D2424',
  // Valor de --text-muted dentro de .panel-ui (el global #7D7474 no llega a 4.5:1 sobre blanco).
  textMuted: '#736A6A',
  border: '#E8E2D9',
  surface: '#FFFFFF',
} as const;
