import Link from 'next/link';

const PROVIDER = {
  razonSocial: 'Wuarikes SAC',
  ruc: '20616350227',
  direccion: 'Micaela Bastidas 231',
  correo: 'consulta@wuarikes.com',
};

export const metadata = {
  title: 'Política de Privacidad — Wuarike',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-warike text-xl font-bold text-[var(--text)]">{title}</h2>
      <div className="text-sm leading-relaxed text-[var(--text-muted)] space-y-3">{children}</div>
    </section>
  );
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-6">
      <article className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="font-warike text-3xl font-bold text-[var(--text)]">Política de Privacidad</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Última actualización: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Titular del banco de datos</p>
          <p className="text-sm text-[var(--text)]"><strong>Razón social:</strong> {PROVIDER.razonSocial}</p>
          <p className="text-sm text-[var(--text)]"><strong>RUC:</strong> {PROVIDER.ruc}</p>
          <p className="text-sm text-[var(--text)]"><strong>Dirección:</strong> {PROVIDER.direccion}</p>
          <p className="text-sm text-[var(--text)]"><strong>Correo:</strong> {PROVIDER.correo}</p>
        </section>

        <Section title="1. Alcance">
          <p>
            Esta política explica cómo {PROVIDER.razonSocial} recolecta, usa y protege los datos personales de:
            (a) los dueños y colaboradores de los negocios que usan Wuarike, (b) los comensales y clientes finales de
            esos negocios que interactúan con la plataforma (reseñas, check-ins, fidelización, WhatsApp), y (c) los
            visitantes de nuestro sitio web. No aplica a datos que un restaurante recolecte por sus propios medios,
            fuera de Wuarike.
          </p>
        </Section>

        <Section title="2. Qué datos recolectamos">
          <p><strong>De dueños y colaboradores de negocios:</strong> nombre, correo, teléfono, contraseña (almacenada
            cifrada, nunca en texto plano), rol dentro del equipo, y datos del negocio (nombre, categoría, ubicación,
            horarios, fotos y, cuando reclamas un local ya publicado, documentos de sustento como RUC, licencia de
            funcionamiento o recibos a nombre del negocio).</p>
          <p><strong>De comensales y clientes finales de un restaurante:</strong> nombre, teléfono y/o correo,
            reseñas y calificaciones, historial de check-ins, saldo y actividad en el programa de fidelización
            (sellos o puntos), y el contenido de tus conversaciones con nuestro asistente de WhatsApp cuando escribes
            a un negocio que usa Wuarike.</p>
          <p><strong>Datos de pago:</strong> cuando un negocio contrata un plan pagado, el número de tarjeta se
            captura y procesa directamente por nuestra pasarela de pagos (Culqi). {PROVIDER.razonSocial} nunca recibe
            ni almacena el número completo de tu tarjeta.</p>
          <p><strong>Datos técnicos:</strong> dirección IP y datos básicos de uso de la plataforma para fines de
            seguridad y soporte.</p>
        </Section>

        <Section title="3. Cómo obtenemos tus datos">
          <p>
            Directamente de ti cuando te registras, completas un formulario (registro de restaurante, reclamo de
            negocio, Libro de Reclamaciones), escaneas un código QR/NFC, escribes por WhatsApp, o realizas un pago.
            En algunos casos también importamos reseñas públicas ya publicadas en Google Maps sobre el negocio.
          </p>
        </Section>

        <Section title="4. Para qué usamos tus datos">
          <ul className="list-disc pl-5 space-y-2">
            <li>Crear y administrar tu cuenta, y brindar las funciones del plan contratado.</li>
            <li>Procesar pagos y gestionar tu suscripción.</li>
            <li>Operar el programa de fidelización y entregar tu tarjeta digital (Apple Wallet / Google Wallet).</li>
            <li>Responder tus mensajes a través de nuestro asistente de WhatsApp, incluyendo el uso de inteligencia
              artificial para generar respuestas basadas en la información del negocio.</li>
            <li>Enviar comunicaciones operativas (confirmaciones, avisos de cobro, respuestas a reclamos) y, solo si
              diste tu consentimiento, comunicaciones promocionales.</li>
            <li>Prevenir fraude, dar soporte técnico y cumplir obligaciones legales.</li>
          </ul>
          <p>
            No vendemos tus datos personales a terceros, ni los usamos para fines distintos a los aquí descritos.
          </p>
        </Section>

        <Section title="5. Con quién compartimos datos">
          <p>
            Para operar Wuarike trabajamos con proveedores externos que procesan datos por nuestro encargo,
            únicamente para las finalidades indicadas:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Culqi</strong> — procesamiento de pagos con tarjeta.</li>
            <li><strong>Meta (WhatsApp Business Platform) y PlazBot</strong> — envío y recepción de mensajes de
              WhatsApp.</li>
            <li><strong>Proveedores de inteligencia artificial</strong> (como Anthropic y otros enrutados vía
              OpenRouter) — generación de respuestas del asistente de WhatsApp y de contenido asistido por IA.</li>
            <li><strong>Cloudinary</strong> — almacenamiento de fotos y documentos que subes a la plataforma.</li>
            <li><strong>Resend</strong> — envío de correos transaccionales (verificación, recibos, reportes).</li>
            <li><strong>Google y Apple</strong> — emisión de tarjetas de fidelización digitales (Wallet).</li>
          </ul>
          <p>
            También podemos divulgar datos si una autoridad competente lo exige mediante mandato legal o judicial.
          </p>
        </Section>

        <Section title="6. Transferencia internacional de datos">
          <p>
            Algunos de los proveedores listados en la sección anterior procesan información en servidores ubicados
            fuera del Perú. Al usar Wuarike, aceptas esta transferencia internacional de tus datos personales,
            necesaria para prestarte el servicio, conforme al artículo 15 de la Ley N.º 29733.
          </p>
        </Section>

        <Section title="7. Conservación de datos">
          <p>
            Conservamos tus datos mientras tu cuenta permanezca activa. Si la cancelas, conservamos la información
            adicional que exijan normas tributarias, contables o de otra índole legal, y luego la eliminamos o
            anonimizamos.
          </p>
        </Section>

        <Section title="8. Seguridad">
          <p>
            Aplicamos medidas técnicas y organizativas razonables para proteger tus datos (cifrado de contraseñas,
            control de acceso por roles, conexiones cifradas). Ningún sistema es 100% infalible; si detectamos un
            incidente que afecte tus datos, te lo notificaremos conforme a la normativa vigente.
          </p>
        </Section>

        <Section title="9. Cookies y almacenamiento local">
          <p>
            No usamos cookies de publicidad ni de rastreo. Para mantener tu sesión iniciada usamos almacenamiento
            local del navegador (localStorage), no cookies.
          </p>
        </Section>

        <Section title="10. Menores de edad">
          <p>
            Wuarike no está dirigido a menores de 18 años. Si eres padre, madre o apoderado y detectas que un menor
            nos proporcionó datos personales, escríbenos a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className="text-[var(--primary)] hover:underline">{PROVIDER.correo}</a>{' '}
            para eliminarlos.
          </p>
        </Section>

        <Section title="11. Tus derechos (ARCO)">
          <p>
            Como titular de tus datos personales, tienes derecho a acceder a ellos, rectificarlos, cancelarlos y
            oponerte a su tratamiento, conforme a la Ley N.º 29733 y su reglamento. Puedes ejercer estos derechos
            escribiendo a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className="text-[var(--primary)] hover:underline">{PROVIDER.correo}</a>,
            indicando tu solicitud y un medio para verificar tu identidad. Atenderemos tu pedido dentro de los plazos
            establecidos por la normativa vigente.
          </p>
        </Section>

        <Section title="12. Cambios a esta política">
          <p>
            Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestros servicios, proveedores o
            la normativa aplicable. Publicaremos la versión vigente en esta misma página con su fecha de
            actualización.
          </p>
        </Section>

        <Section title="13. Contacto">
          <p>
            Para cualquier consulta sobre esta política o el tratamiento de tus datos, escríbenos a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className="text-[var(--primary)] hover:underline">{PROVIDER.correo}</a>{' '}
            o usa nuestro{' '}
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
