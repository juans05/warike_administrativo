import Link from 'next/link';

const PROVIDER = {
  razonSocial: 'Wuarikes SAC',
  ruc: '20616350227',
  direccion: 'Micaela Bastidas 231',
  correo: 'consulta@wuarikes.com',
};

export const metadata = {
  title: 'Términos y Condiciones — Wuarike',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-warike text-xl font-bold text-[var(--text)]">{title}</h2>
      <div className="text-sm leading-relaxed text-[var(--text-muted)] space-y-3">{children}</div>
    </section>
  );
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-6">
      <article className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="font-warike text-3xl font-bold text-[var(--text)]">Términos y Condiciones</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Última actualización: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Datos del proveedor</p>
          <p className="text-sm text-[var(--text)]"><strong>Razón social:</strong> {PROVIDER.razonSocial}</p>
          <p className="text-sm text-[var(--text)]"><strong>RUC:</strong> {PROVIDER.ruc}</p>
          <p className="text-sm text-[var(--text)]"><strong>Dirección:</strong> {PROVIDER.direccion}</p>
          <p className="text-sm text-[var(--text)]"><strong>Correo:</strong> {PROVIDER.correo}</p>
        </section>

        <Section title="1. Objeto">
          <p>
            {PROVIDER.razonSocial} opera Wuarike, un software como servicio (SaaS) de reputación y fidelización para
            restaurantes (&quot;el Servicio&quot;). Wuarike no desarrolla software a medida por encargo: es un producto
            propio, ofrecido por suscripción mensual (planes Reputación, Fidelización+ e IA Total) y,
            de forma complementaria, la venta de hardware físico (expositores y stands NFC) para su uso con el Servicio.
            Estos Términos y Condiciones regulan el acceso y uso del Servicio por parte de restaurantes y negocios
            (&quot;el Cliente&quot;).
          </p>
        </Section>

        <Section title="2. Aceptación">
          <p>
            Al registrarte, contratar un plan o comprar hardware a través de nuestros canales, aceptas íntegramente
            estos Términos y Condiciones y nuestra Política de Cambios y Devoluciones. Si no estás de acuerdo, no
            debes usar el Servicio.
          </p>
        </Section>

        <Section title="3. Cuenta y registro">
          <p>
            Para usar el Servicio necesitas crear una cuenta con datos verídicos. Eres responsable de mantener la
            confidencialidad de tus credenciales de acceso y de toda actividad realizada desde tu cuenta.
          </p>
        </Section>

        <Section title="4. Planes, precios y facturación">
          <p>
            Los planes vigentes, sus características y precios se muestran en{' '}
            <Link href="/#planes" className="text-[var(--primary)] hover:underline">wuarikes.com/#planes</Link>.
            La facturación es mensual y recurrente mientras la suscripción permanezca activa. El cobro se procesa
            mediante nuestra pasarela de pagos con la tarjeta que registres.
          </p>
        </Section>

        <Section title="5. Cancelación">
          <p>
            Puedes cancelar tu suscripción en cualquier momento, sin permanencia mínima ni penalidad. Los detalles
            sobre reembolsos y el momento en que la cancelación surte efecto están en nuestra{' '}
            <Link href="/politica-de-cambios-y-devoluciones" className="text-[var(--primary)] hover:underline">
              Política de Cambios y Devoluciones
            </Link>.
          </p>
        </Section>

        <Section title="6. Venta de hardware">
          <p>
            Los productos físicos (expositores, stands NFC) ofrecidos en la landing se venden de forma independiente
            a la suscripción del Servicio. Las condiciones de cambio y devolución de estos productos se detallan en
            nuestra{' '}
            <Link href="/politica-de-cambios-y-devoluciones" className="text-[var(--primary)] hover:underline">
              Política de Cambios y Devoluciones
            </Link>.
          </p>
        </Section>

        <Section title="7. Propiedad intelectual">
          <p>
            El software, la marca Wuarike, el diseño de la plataforma y los contenidos que la componen son propiedad
            de {PROVIDER.razonSocial} o de sus licenciantes. El Cliente conserva la propiedad de los contenidos e
            información de su propio negocio que suba a la plataforma (fotos, menú, descripciones).
          </p>
        </Section>

        <Section title="8. Protección de datos personales">
          <p>
            Tratamos los datos personales que nos proporcionas conforme a la Ley N.º 29733, Ley de Protección de
            Datos Personales, y su reglamento. Los detalles sobre qué datos recolectamos, para qué los usamos y con
            quién los compartimos están en nuestra{' '}
            <Link href="/politica-de-privacidad" className="text-[var(--primary)] hover:underline">
              Política de Privacidad
            </Link>.
          </p>
        </Section>

        <Section title="9. Limitación de responsabilidad">
          <p>
            El Servicio se brinda &quot;tal cual&quot;. {PROVIDER.razonSocial} no garantiza resultados específicos de
            visibilidad, ventas o reputación derivados del uso de la plataforma, y no responde por interrupciones
            atribuibles a terceros (proveedores de internet, pasarela de pagos, redes sociales) fuera de su control
            razonable.
          </p>
        </Section>

        <Section title="10. Modificaciones">
          <p>
            Podemos actualizar estos Términos para reflejar cambios en el Servicio o en la normativa aplicable.
            Publicaremos la versión vigente en esta misma página con su fecha de actualización.
          </p>
        </Section>

        <Section title="11. Ley aplicable y reclamos">
          <p>
            Estos Términos se rigen por las leyes de la República del Perú. Si tienes un reclamo o queja como
            consumidor, puedes usar nuestro{' '}
            <Link href="/libro-de-reclamaciones" className="text-[var(--primary)] hover:underline">
              Libro de Reclamaciones
            </Link>{' '}
            o escribirnos a <a href={`mailto:${PROVIDER.correo}`} className="text-[var(--primary)] hover:underline">{PROVIDER.correo}</a>.
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
