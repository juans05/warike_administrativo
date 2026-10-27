'use client';

import { useState } from 'react';
import { Printer } from 'lucide-react';
import { getPrintSettings, printHtml, setPrintSettings, type PaperWidth } from '../../lib/print';
import { Button, Select, Sheet, Switch } from '../ui';

/** Ajustes de impresión de este equipo: ancho del papel e impresión automática de comandas y tickets. */
export function PrintSettingsButton() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(getPrintSettings);
  const update = (patch: Partial<typeof s>) => { const next = { ...s, ...patch }; setS(next); setPrintSettings(next); };

  return (
    <>
      <Button variant="secondary" icon={Printer} onClick={() => { setS(getPrintSettings()); setOpen(true); }}>Impresora</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Impresión en este equipo">
        <div className="space-y-4 p-4">
          <Select label="Ancho del papel" value={s.paper} onChange={(e) => update({ paper: Number(e.target.value) as PaperWidth })}>
            <option value={80}>80 mm (ticketera estándar)</option>
            <option value={58}>58 mm (ticketera pequeña)</option>
          </Select>
          <Switch label="Imprimir automáticamente cada pedido nuevo en Cocina" checked={s.autoKitchen} onChange={(v) => update({ autoKitchen: v })} />
          <Switch label="Imprimir el ticket al cobrar en Caja" checked={s.autoTicket} onChange={(v) => update({ autoTicket: v })} />
          <p className="text-sm text-text-muted">
            Se imprime en la impresora predeterminada de esta PC. Para que salga sin la ventana de impresión, abre el panel en Chrome
            con la opción <span className="font-mono">--kiosk-printing</span>.
          </p>
          <Button variant="secondary" icon={Printer} className="w-full"
            onClick={() => printHtml('<h1>Prueba de impresión</h1><p class="c">Si ves este texto completo, el ancho está bien.</p><hr><p class="c">wuarikes</p>', 'Prueba')}>
            Imprimir prueba
          </Button>
        </div>
      </Sheet>
    </>
  );
}
