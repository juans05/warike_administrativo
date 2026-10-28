// Chequeo del plan Barbero: npx -y tsx@4.19.2 apps/dashboard/lib/modules.check.ts
import assert from 'node:assert/strict';
import { hasTierAccess } from './modules';

// Abre lo básico y WhatsApp/chats/clientes, pero no el resto de IA Total.
assert.equal(hasTierAccess('barbero', 'reputacion', 'agenda'), true);
assert.equal(hasTierAccess('barbero', 'ia_total', 'whatsapp'), true);
assert.equal(hasTierAccess('barbero', 'ia_total', 'chat'), true);
assert.equal(hasTierAccess('barbero', 'fidelizacion', 'clientes'), true);
assert.equal(hasTierAccess('barbero', 'ia_total', 'broadcasts'), false);
assert.equal(hasTierAccess('barbero', 'ia_total', 'email-marketing'), false);
assert.equal(hasTierAccess('barbero', 'fidelizacion', 'fidelizacion'), false);
// Los planes de la escalera no cambian.
assert.equal(hasTierAccess('ia_total', 'ia_total', 'broadcasts'), true);
assert.equal(hasTierAccess('reputacion', 'ia_total', 'whatsapp'), false);

console.log('modules.check OK');
