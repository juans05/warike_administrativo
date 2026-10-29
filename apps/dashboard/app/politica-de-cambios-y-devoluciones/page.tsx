import Link from 'next/link';

const PROVIDER = {
  razonSocial: 'Wuarikes SAC',
  correo: 'consulta@wuarikes.com',
};

// Fecha fija de la versión vigente: cambiarla solo cuando cambie el texto.
const VERSION = { id: '2026-10-14', fecha: '14 de octubre de 2026' };

export const metadata = {
  title: 'Política de Cambios y Devoluciones — Wuarike',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-warike text-xl font-bold text-[var(--text)]">{title}</h2>
      <div className="text-sm leading-relaxed text-[var(--text-muted)] space-y-3">{children}</div>
    </section>
  );
}

const linkClass = 'text-[var(--primary)] hover:underline';

export default function PoliticaCambiosPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-6">
      <article className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="font-warike text-3xl font-bold text-[var(--text)]">Política de Cambios y Devoluciones</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Versión {VERSION.id} · Vigente desde el {VERSION.fecha}
          </p>
        </header>

        <Section title="1. Suscripciones (Wawa, Al Toque, Rankeado, Caserito, Taypá)">
          <p>
            Puedes cancelar tu suscripción mensual en cualquier momento, sin permanencia mínima ni penalidad, desde
            tu panel de administración o escribiéndonos a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className={linkClass}>{PROVIDER.correo}</a>.
          </p>
          <p>
            Al cancelar, no se realizan nuevos cobros y el Servicio permanece activo hasta el final del período ya
            pagado. No se realizan reembolsos, totales ni prorrateados, por el período en curso ya pagado, salvo en
            estos casos, en los que sí devolvemos el importe correspondiente:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Cobros duplicados o por un monto distinto al del plan contratado.</li>
            <li>Cobros realizados después de que la cancelación ya surtió efecto.</li>
            <li>Cuando {PROVIDER.razonSocial} deja de prestar el Servicio por razones propias, sin incumplimiento del Cliente: devolvemos la parte proporcional del período no utilizado.</li>
            <li>Cuando el Servicio no pudo usarse durante el período por causas imputables a {PROVIDER.razonSocial}.</li>
          </ul>
          <p>
            Las devoluciones se realizan al mismo medio de pago, a través de la pasarela de pagos; el tiempo en que se
            reflejan depende de la entidad emisora de tu tarjeta.
          </p>
        </Section>

        <Section title="2. Dispositivos (expositores, stands y placas NFC/QR)">
          <p>
            No aceptamos cambios ni devoluciones de los Dispositivos por cambio de opinión una vez entregados, salvo que
            se indique lo contrario al momento de la compra.
          </p>
          <p>
            Esto no afecta la garantía legal que te corresponde conforme al Código de Protección y Defensa del
            Consumidor (Ley N.º 29571): el Dispositivo debe corresponder a lo ofrecido y funcionar para lo que fue
            vendido. Si presenta un defecto de fabricación, no funciona al recibirlo o llega dañado, tienes derecho a
            solicitar su reparación, su reposición por otro igual o la devolución de lo pagado.
          </p>
          <p>
            Para hacerlo, escríbenos a <a href={`mailto:${PROVIDER.correo}`} className={linkClass}>{PROVIDER.correo}</a>{' '}
            con tu número de pedido o comprobante, una descripción del problema y, si es posible, fotos. Te indicaremos
            cómo coordinar el recojo o el envío. Los costos de envío por un defecto o un error nuestro corren por
            nuestra cuenta.
          </p>
        </Section>

        <Section title="3. ¿No estás conforme con la respuesta?">
          <p>
            Puedes registrar un reclamo o queja en nuestro{' '}
            <Link href="/libro-de-reclamaciones" className={linkClass}>Libro de Reclamaciones</Link>. Lo responderemos en
            un plazo máximo de quince (15) días hábiles improrrogables, conforme al artículo 24.1 del Código de
            Protección y Defensa del Consumidor. Presentar un reclamo no impide acudir al Indecopi.
          </p>
        </Section>

        <div className="pt-4">
          <Link href="/" className="text-sm font-semibold text-[var(--primary)] hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </article>
    </div>
  );
}
