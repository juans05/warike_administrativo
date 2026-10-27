// Chequeo de splitToday: npx -y tsx@4.19.2 apps/dashboard/lib/independent.check.ts
import assert from 'node:assert/strict';
import { splitToday, type TodayAppt } from './independent';

const a = (id: string, time: string, endTime: string, status = 'RESERVADA') => ({ id, time, endTime, status }) as TodayAppt;

const r = splitToday([a('1', '09:00', '09:30', 'ATENDIDA'), a('2', '10:00', '10:45'), a('3', '11:00', '11:30')], 10 * 60 + 5);
assert.equal(r.current?.id, '2');
assert.deepEqual(r.pending.map((x) => x.id), ['3']);
assert.equal(r.done.length, 1);

// Una cita marcada LISTO (en curso) manda sobre la que coincide con la hora.
const listo = splitToday([a('4', '10:00', '10:30', 'LISTO'), a('5', '10:00', '10:45')], 10 * 60 + 5);
assert.equal(listo.current?.id, '4');
assert.deepEqual(listo.pending.map((x) => x.id), ['5']);

// Una reservada que ya pasó y nadie atendió sigue pendiente (el barbero decide si vino o no).
const atrasada = splitToday([a('6', '08:00', '08:30'), a('7', '12:00', '12:30')], 10 * 60);
assert.equal(atrasada.current, null);
assert.deepEqual(atrasada.pending.map((x) => x.id), ['6', '7']);

// Canceladas y no asistió van a "done", no a pendientes.
const cerradas = splitToday([a('8', '11:00', '11:30', 'CANCELADA'), a('9', '11:00', '11:30', 'NO_ASISTIO')], 10 * 60);
assert.deepEqual(cerradas.pending, []);
assert.equal(cerradas.done.length, 2);

console.log('splitToday OK');
