// Fechas y horas de la agenda, siempre en hora de Lima (UTC-5, sin horario de verano).
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const WEEK = [
  { key: 'mon', label: 'Lunes' }, { key: 'tue', label: 'Martes' }, { key: 'wed', label: 'Miércoles' }, { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' }, { key: 'sat', label: 'Sábado' }, { key: 'sun', label: 'Domingo' },
];

export const todayLima = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);
export const addDays = (date: string, n: number) => new Date(new Date(`${date}T12:00:00-05:00`).getTime() + n * 86400_000 - 5 * 3600_000).toISOString().slice(0, 10);
const dow = (date: string) => new Date(`${date}T12:00:00-05:00`).getUTCDay();
/** "sábado 24 de octubre" */
export const longDate = (date: string) => `${DAYS[dow(date)]} ${Number(date.slice(8, 10))} de ${MONTHS[Number(date.slice(5, 7)) - 1]}`;
/** "sáb 24" */
export const shortDate = (date: string) => `${DAYS[dow(date)].slice(0, 3)} ${Number(date.slice(8, 10))}`;
/** "16:30" → "4:30 pm" */
export const time12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};
export const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const STATUS: Record<string, { label: string; className: string }> = {
  RESERVADA: { label: 'Reservada', className: 'border-primary/50 bg-primary-soft text-primary-hover' },
  LISTO: { label: 'Listo para recoger', className: 'border-secondary bg-secondary/30 text-text' },
  ATENDIDA: { label: 'Atendida', className: 'border-success/50 bg-success/10 text-success' },
  NO_ASISTIO: { label: 'No asistió', className: 'border-secondary bg-secondary/20 text-text' },
  CANCELADA: { label: 'Cancelada', className: 'border-border bg-background text-text-muted line-through' },
};
export const SOURCE_LABEL: Record<string, string> = { PANEL: 'Panel', BOT: 'WhatsApp', WEB: 'Link de reservas' };
export const soles = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

// Fichas por rubro (mismas claves que ASSET_FIELDS del backend). `name` es el nombre de la mascota o la placa.
export const ASSET_META = {
  PET: { title: 'Mascota', nameLabel: 'Nombre de la mascota', fields: [['species', 'Especie'], ['breed', 'Raza'], ['sex', 'Sexo'], ['birthDate', 'Nacimiento'], ['weight', 'Peso (kg)'], ['vaccines', 'Vacunas']] },
  VEHICLE: { title: 'Vehículo', nameLabel: 'Placa', fields: [['brand', 'Marca'], ['model', 'Modelo'], ['year', 'Año'], ['color', 'Color'], ['mileage', 'Kilometraje']] },
} as const;
/** "Firulais · Perro, Labrador" / "ABC-123 · Toyota Yaris" */
export const assetSummary = (asset: { name: string; data?: Record<string, unknown> | null }) => {
  const d = asset.data ?? {};
  const extra = [d.species ?? d.brand, d.breed ?? d.model].filter(Boolean).join(d.species ? ', ' : ' ');
  return extra ? `${asset.name} · ${extra}` : asset.name;
};
