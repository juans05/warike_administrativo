import Link from 'next/link';

const PROVIDER = {
  razonSocial: 'Wuarikes SAC',
  correo: 'consulta@wuarikes.com',
};

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

export default function PoliticaCambiosPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-6">
      <article className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="font-warike text-3xl font-bold text-[var(--text)]">Política de Cambios y Devoluciones</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Última actualización: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <Section title="Suscripciones (Reputación, Fidelización+, IA Total)">
          <p>
            Puedes cancelar tu suscripción mensual en cualquier momento, sin permanencia mínima ni penalidad, desde
            tu panel de administración o escribiéndonos a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className="text-[var(--primary)] hover:underline">{PROVIDER.correo}</a>.
          </p>
          <p>
            Al cancelar, el Servicio permanece activo hasta el final del período ya facturado. No se realizan
            reembolsos, totales ni prorrateados, por el período en curso ya pagado.
          </p>
        </Section>

        <Section title="Hardware físico (expositores y stands NFC)">
          <p>
            No aceptamos cambios ni devoluciones de estos productos por motivos de cambio de opinión una vez
            despachados.
          </p>
          <p>
            Esto no afecta la garantía legal que te corresponde como consumidor conforme al Código de Protección y
            Defensa del Consumidor (Ley N.º 29571): si el producto presenta un defecto de fabricación o llega dañado,
            tienes derecho a solicitar su reparación, reposición o devolución. Para hacerlo, escríbenos a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className="text-[var(--primary)] hover:underline">{PROVIDER.correo}</a>{' '}
            detallando el problema; te indicaremos los siguientes pasos conforme a la normativa vigente.
          </p>
        </Section>

        <Section title="¿No estás conforme con la respuesta?">
          <p>
            Si consideras que no atendimos tu solicitud correctamente, puedes registrar un reclamo o queja en nuestro{' '}
            <Link href="/libro-de-reclamaciones" className="text-[var(--primary)] hover:underline">
              Libro de Reclamaciones
            </Link>.
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
