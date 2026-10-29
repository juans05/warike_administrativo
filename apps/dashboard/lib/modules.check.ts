// Chequeo de Al Toque y Wawa: npx -y tsx@4.19.2 apps/dashboard/lib/modules.check.ts
import assert from 'node:assert/strict';
import { hasTierAccess } from './modules';

// Abre lo básico, WhatsApp/chats/clientes, campañas, reportes y base de IA, pero no el resto de Taypá.
assert.equal(hasTierAccess('al_toque', 'reputacion', 'agenda'), true);
assert.equal(hasTierAccess('al_toque', 'ia_total', 'whatsapp'), true);
assert.equal(hasTierAccess('al_toque', 'ia_total', 'chat'), true);
assert.equal(hasTierAccess('al_toque', 'fidelizacion', 'clientes'), true);
assert.equal(hasTierAccess('al_toque', 'ia_total', 'broadcasts'), true);
assert.equal(hasTierAccess('al_toque', 'ia_total', 'reportes'), true);
assert.equal(hasTierAccess('al_toque', 'ia_total', 'ia'), true);
assert.equal(hasTierAccess('al_toque', 'ia_total', 'email-marketing'), false);
assert.equal(hasTierAccess('al_toque', 'ia_total', 'plazbot'), false);
assert.equal(hasTierAccess('al_toque', 'fidelizacion', 'fidelizacion'), false);
// Wawa: lo mismo menos campañas.
assert.equal(hasTierAccess('wawa', 'reputacion', 'agenda'), true);
assert.equal(hasTierAccess('wawa', 'ia_total', 'whatsapp'), true);
assert.equal(hasTierAccess('wawa', 'ia_total', 'reportes'), true);
assert.equal(hasTierAccess('wawa', 'ia_total', 'broadcasts'), false);
assert.equal(hasTierAccess('wawa', 'fidelizacion', 'fidelizacion'), false);
// Los planes de la escalera no cambian.
assert.equal(hasTierAccess('ia_total', 'ia_total', 'broadcasts'), true);
assert.equal(hasTierAccess('reputacion', 'ia_total', 'whatsapp'), false);

console.log('modules.check OK');
