import Link from 'next/link';

const PROVIDER = {
  razonSocial: 'Wuarikes SAC',
  ruc: '20616350227',
  direccion: 'Micaela Bastidas 231, Lima, Perú',
  correo: 'consulta@wuarikes.com',
};

// Fecha fija de la versión vigente: cambiarla solo cuando cambie el texto.
const VERSION = { id: '2026-10-14', fecha: '14 de octubre de 2026' };

export const metadata = {
  title: 'Política de Privacidad — Wuarike',
};

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-16">
      <h2 className="font-warike text-xl font-bold text-[var(--text)]">{title}</h2>
      <div className="text-sm leading-relaxed text-[var(--text-muted)] space-y-3">{children}</div>
    </section>
  );
}

const linkClass = 'text-[var(--primary)] hover:underline';
const th = 'border border-[var(--border)] p-2 text-left font-semibold text-[var(--text)] align-top';
const td = 'border border-[var(--border)] p-2 align-top';

const TREATMENTS = [
  {
    who: 'Dueños y colaboradores de negocios (Clientes y Usuarios autorizados)',
    data: 'Nombre, correo, teléfono, contraseña (cifrada), rol, datos del negocio y, si reclamas un local, documentos de sustento (RUC, licencia, recibos).',
    purpose: 'Crear y administrar la cuenta, prestar el plan contratado, verificar la titularidad del local, soporte y comunicaciones operativas.',
    basis: 'Ejecución de la relación contractual (art. 14.5 de la Ley).',
    keep: 'Mientras la cuenta esté activa y, luego, el plazo de las obligaciones legales aplicables.',
  },
  {
    who: 'Clientes que pagan un plan o compran Dispositivos',
    data: 'Nombre o razón social, RUC o DNI, correo, últimos 4 dígitos y marca de la tarjeta, historial de pagos. El número completo de la tarjeta lo procesa Culqi y nunca llega a Wuarikes.',
    purpose: 'Cobrar la suscripción o la compra, emitir comprobantes de pago y cumplir obligaciones tributarias y contables.',
    basis: 'Ejecución de la relación contractual y cumplimiento de obligaciones legales.',
    keep: 'Durante el plazo exigido por las normas tributarias y contables.',
  },
  {
    who: 'Usuarios de la app y web de Wuarikes (comensales con cuenta)',
    data: 'Nombre, correo y/o teléfono, contraseña (cifrada), reseñas, calificaciones, check-ins y favoritos.',
    purpose: 'Prestar el servicio de descubrimiento, reseñas y check-ins, y la seguridad de la cuenta.',
    basis: 'Ejecución de la relación contractual (términos de uso de la app).',
    keep: 'Mientras la cuenta esté activa; las reseñas publicadas se mantienen salvo que pidas su supresión.',
  },
  {
    who: 'Comensales de un establecimiento que usa Wuarike (QR/NFC, opiniones, fidelización, WhatsApp, pedidos)',
    data: 'Calificación y comentario, nombre (opcional), teléfono o WhatsApp (opcional), sellos o puntos, conversaciones con el asistente del negocio y, si pides, los productos pedidos.',
    purpose: 'Que el establecimiento reciba tu opinión, gestione su programa de fidelización, te atienda por WhatsApp y procese tus pedidos.',
    basis: 'Consentimiento al enviar el formulario o escribir al negocio; para promociones, consentimiento separado y opcional.',
    keep: 'Mientras el establecimiento mantenga su cuenta en Wuarike; al terminar, se devuelven o eliminan como máximo en dos (2) años (art. 31.2 del Reglamento).',
  },
  {
    who: 'Personas que usan el Libro de Reclamaciones',
    data: 'Nombre, documento de identidad, domicilio, correo, teléfono, detalle del reclamo o queja y nuestra respuesta.',
    purpose: 'Atender el reclamo o queja y cumplir la normativa de protección al consumidor.',
    basis: 'Cumplimiento de una obligación legal (Código de Protección y Defensa del Consumidor).',
    keep: 'El plazo que exige la normativa del Libro de Reclamaciones.',
  },
  {
    who: 'Todas las personas que navegan la Plataforma',
    data: 'Dirección IP, tipo de navegador y dispositivo, registros de acceso y de errores.',
    purpose: 'Seguridad, prevención de fraude, trazabilidad de accesos y corrección de errores.',
    basis: 'Cumplimiento de las medidas de seguridad exigidas por el art. 46 del Reglamento.',
    keep: 'Los registros de acceso, como mínimo dos (2) años (art. 46 del Reglamento).',
  },
];

const RECIPIENTS = [
  ['Culqi', 'Procesamiento de pagos con tarjeta, Yape y otros medios', 'Perú'],
  ['Railway', 'Alojamiento del servidor, la base de datos y las colas de trabajo', 'Fuera del Perú (principalmente EE. UU.)'],
  ['Cloudinary', 'Almacenamiento de fotos, videos y documentos que subes', 'Fuera del Perú (principalmente EE. UU.)'],
  ['Resend', 'Envío de correos transaccionales (verificación, recibos, reportes)', 'Fuera del Perú (principalmente EE. UU.)'],
  ['Sentry', 'Registro de errores técnicos para su corrección', 'Fuera del Perú (principalmente EE. UU.)'],
  ['Meta (WhatsApp Business Platform e Instagram) y PlazBot', 'Envío y recepción de mensajes de WhatsApp y gestión de redes sociales del negocio', 'Fuera del Perú'],
  ['Zernio', 'Conexión y publicación en redes sociales del negocio', 'Fuera del Perú'],
  ['Proveedores de inteligencia artificial: Anthropic, Google (Gemini), OpenRouter y xAI', 'Generar respuestas del asistente y sugerencias de contenido', 'Fuera del Perú (principalmente EE. UU.)'],
  ['Google (Maps, Business Profile, Wallet e inicio de sesión) y Apple (Wallet)', 'Datos públicos del local, gestión de reseñas, tarjetas de fidelización digitales e inicio de sesión con Google', 'Fuera del Perú (principalmente EE. UU.)'],
];

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-6">
      <article className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="font-warike text-3xl font-bold text-[var(--text)]">Política de Privacidad</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Versión {VERSION.id} · Vigente desde el {VERSION.fecha}
          </p>
        </header>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Titular del banco de datos y responsable del tratamiento</p>
          <p className="text-sm text-[var(--text)]"><strong>Razón social:</strong> {PROVIDER.razonSocial}</p>
          <p className="text-sm text-[var(--text)]"><strong>RUC:</strong> {PROVIDER.ruc}</p>
          <p className="text-sm text-[var(--text)]"><strong>Domicilio:</strong> {PROVIDER.direccion}</p>
          <p className="text-sm text-[var(--text)]"><strong>Contacto para datos personales:</strong> {PROVIDER.correo}</p>
        </section>

        <Section title="1. Marco legal y alcance">
          <p>
            Esta política cumple el deber de información del artículo 18 de la Ley N.º 29733, Ley de Protección de
            Datos Personales, y del artículo 6 de su Reglamento, aprobado por Decreto Supremo N.º 016-2024-JUS.
            Explica qué datos tratamos en Wuarike (panel para negocios, páginas públicas de los locales, carta digital,
            app y web para comensales, asistentes de WhatsApp y Libro de Reclamaciones), para qué, con quién los
            compartimos, cuánto tiempo los conservamos y cómo ejercer tus derechos.
          </p>
          <p>
            Publicar esta política no reemplaza tu consentimiento cuando la ley lo exige (art. 7 del Reglamento): por
            eso te lo pedimos de forma expresa en cada formulario donde corresponde.
          </p>
        </Section>

        <Section title="2. Quién decide sobre tus datos: Wuarikes o el establecimiento">
          <p>
            <strong>Wuarikes es el responsable</strong> de los datos de los dueños y colaboradores de negocios, de los
            usuarios con cuenta en la app y web de Wuarikes, de quienes usan nuestro Libro de Reclamaciones y de los
            registros técnicos de navegación.
          </p>
          <p>
            <strong>El establecimiento es el responsable</strong> de los datos que le dejas como comensal a través de
            sus códigos QR o NFC, su programa de fidelización, su asistente de WhatsApp o sus pedidos. En esos casos
            Wuarikes actúa como <strong>encargado del tratamiento</strong>: trata los datos por cuenta del
            establecimiento, solo para prestarle el servicio, conforme al artículo 30 de la Ley y a nuestro{' '}
            <Link href="/contrato-de-encargo-de-datos" className={linkClass}>Contrato de Encargo</Link>. Para ejercer tus
            derechos sobre esos datos puedes dirigirte al establecimiento o a nosotros; si nos escribes, trasladaremos tu
            solicitud al establecimiento y te ayudaremos a atenderla.
          </p>
        </Section>

        <Section title="3. Qué datos tratamos, para qué y por cuánto tiempo">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr><th className={th}>Personas</th><th className={th}>Datos</th><th className={th}>Finalidad</th><th className={th}>Base legal</th><th className={th}>Conservación</th></tr>
              </thead>
              <tbody>
                {TREATMENTS.map((row) => (
                  <tr key={row.who}>
                    <td className={td}>{row.who}</td><td className={td}>{row.data}</td><td className={td}>{row.purpose}</td><td className={td}>{row.basis}</td><td className={td}>{row.keep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            No tratamos datos sensibles (salud, origen racial o étnico, opiniones políticas o religiosas, entre otros)
            ni los pedimos en nuestros formularios. Te pedimos que no los incluyas en comentarios ni mensajes.
          </p>
        </Section>

        <Section title="4. Datos obligatorios y opcionales">
          <p>
            Los campos obligatorios están marcados en cada formulario. Si no los entregas, no podremos prestar el
            servicio que solicitas (por ejemplo, crear tu cuenta, cobrar tu plan o registrar tu reclamo). El nombre y
            el teléfono que dejas como comensal son opcionales: sin ellos igual puedes enviar tu opinión, pero no
            podrás sumar sellos o puntos ni recibir respuestas por WhatsApp.
          </p>
        </Section>

        <Section title="5. Promociones y comunicaciones comerciales">
          <p>
            Solo te enviamos, o permitimos que un establecimiento te envíe a través de Wuarike, promociones por
            WhatsApp, correo u otros medios si diste tu consentimiento expreso, en una casilla separada que nunca está
            marcada por defecto (art. 26 del Reglamento). Puedes retirarlo en cualquier momento escribiendo
            &quot;BAJA&quot; al WhatsApp del establecimiento (se aplica de inmediato), respondiendo &quot;BAJA&quot; a cualquier correo
            promocional o escribiendo a {PROVIDER.correo};
            atenderemos tu pedido en un plazo máximo de diez (10) días (art. 26.5 del Reglamento). Retirarlo no afecta los demás
            servicios.
          </p>
        </Section>

        <Section title="6. Inteligencia artificial y decisiones automatizadas">
          <p>
            Cuando escribes al WhatsApp de un establecimiento que usa nuestro asistente, tus mensajes se procesan con
            proveedores de inteligencia artificial para generar una respuesta basada en la información del negocio. El
            asistente se identifica como automatizado y puedes pedir hablar con una persona del establecimiento.
          </p>
          <p>
            No tomamos decisiones basadas únicamente en tratamientos automatizados que produzcan efectos jurídicos
            sobre ti o te afecten de manera significativa. Tienes derecho al tratamiento objetivo de tus datos
            (art. 23 de la Ley y art. 87 del Reglamento). Wuarikes no usa tus datos para entrenar modelos de
            inteligencia artificial propios.
          </p>
        </Section>

        <Section title="7. Destinatarios de los datos (proveedores y transferencias)">
          <p>
            No vendemos tus datos personales. Los compartimos solo con proveedores que los tratan por nuestro encargo
            para las finalidades de esta política, con obligación de confidencialidad, y con autoridades cuando una
            norma o mandato judicial lo exija:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead><tr><th className={th}>Proveedor</th><th className={th}>Para qué</th><th className={th}>Dónde</th></tr></thead>
              <tbody>
                {RECIPIENTS.map(([name, use, where]) => (
                  <tr key={name}><td className={td}>{name}</td><td className={td}>{use}</td><td className={td}>{where}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Si eres comensal, el establecimiento al que le dejaste tus datos también los recibe, porque es el
            responsable de ellos. Te avisaremos en esta página antes de incorporar un nuevo proveedor que trate datos
            personales.
          </p>
        </Section>

        <Section title="8. Flujo transfronterizo de datos">
          <p>
            Varios de los proveedores de la sección 7 almacenan o procesan datos fuera del Perú, principalmente en
            Estados Unidos. Esa transferencia es necesaria para prestarte el servicio (art. 15, numeral 4, de la Ley) y
            se realiza con proveedores que mantienen niveles de protección adecuados o con garantías contractuales,
            conforme a los artículos 18 a 20 del Reglamento. Comunicamos estos flujos a la Autoridad Nacional de
            Protección de Datos Personales, como exige el artículo 21.2 del Reglamento.
          </p>
        </Section>

        <Section title="9. Datos obtenidos de Google">
          <p>
            Si conectas tu cuenta de Google Business Profile, accedemos solo a la información necesaria para mostrarte
            y responder las reseñas de tu local y consultar los datos de tu ficha, con los permisos que apruebes. El uso
            y la transferencia de información recibida de las APIs de Google se ajustan a la Política de Datos de
            Usuario de los Servicios de API de Google, incluidos sus requisitos de uso limitado: no la usamos para
            publicidad, no la vendemos y no la compartimos salvo para prestarte el servicio o cumplir la ley. Puedes
            revocar el acceso en cualquier momento desde tu cuenta de Google o desde tu panel.
          </p>
        </Section>

        <Section title="10. Cookies y almacenamiento local">
          <p>
            Usamos solo almacenamiento técnico necesario para que la Plataforma funcione: mantener tu sesión iniciada
            (almacenamiento local del navegador y cookies de sesión) y recordar preferencias como el local
            seleccionado. No usamos cookies de publicidad ni de seguimiento entre sitios. El formulario de pago de
            Culqi puede usar sus propias cookies técnicas para prevenir el fraude, conforme a su política. Si en el
            futuro usamos cookies no esenciales, te pediremos tu consentimiento antes de activarlas.
          </p>
        </Section>

        <Section title="11. Seguridad">
          <p>
            Aplicamos medidas técnicas y organizativas acordes con el Reglamento, entre ellas: conexiones cifradas
            (HTTPS), contraseñas almacenadas con hash, cifrado de las credenciales de integraciones, control de acceso
            por roles dentro de cada local, límites de intentos para prevenir abusos y registros de acceso. Ningún
            sistema es infalible; por eso también gestionamos incidentes como se indica a continuación.
          </p>
          <p>
            Si ocurre un incidente de seguridad que afecte datos personales en los casos del artículo 34 del
            Reglamento, lo notificaremos a la Autoridad Nacional de Protección de Datos Personales dentro de las 48
            horas de haber tomado conocimiento y, cuando afecte tus derechos, te lo comunicaremos en ese mismo plazo
            en lenguaje claro, junto con las medidas adoptadas. Si somos encargados del tratamiento, avisaremos de
            inmediato al establecimiento responsable (art. 36 del Reglamento).
          </p>
        </Section>

        <Section title="12. Menores de edad">
          <p>
            Wuarike no está dirigido a menores de 18 años y no recopilamos a sabiendas sus datos. Si eres padre,
            madre o tutor y detectas que un menor nos entregó datos personales, escríbenos a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className={linkClass}>{PROVIDER.correo}</a> para eliminarlos.
          </p>
        </Section>

        <Section id="eliminacion-de-datos" title="13. Tus derechos y cómo ejercerlos">
          <p>Como titular de tus datos personales puedes ejercer en cualquier momento, de forma gratuita, los derechos de:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Información:</strong> saber cómo tratamos tus datos. Respondemos en un máximo de 8 días.</li>
            <li><strong>Acceso:</strong> obtener tus datos y conocer su origen y las transferencias realizadas. Respondemos en un máximo de 20 días. Incluye recibirlos en un formato estructurado y de uso común (portabilidad, art. 76 del Reglamento).</li>
            <li><strong>Rectificación y actualización</strong>, <strong>cancelación o supresión</strong> y <strong>oposición</strong>. Respondemos en un máximo de 10 días.</li>
            <li><strong>Revocar tu consentimiento</strong> sin efecto retroactivo, por un medio igual o más sencillo que el que usaste para darlo.</li>
            <li><strong>Tratamiento objetivo:</strong> no ser objeto de decisiones automatizadas con efectos significativos.</li>
          </ul>
          <p>
            Los plazos se cuentan desde el día siguiente de recibida la solicitud y, salvo el de información, pueden
            ampliarse una sola vez por un plazo igual si las circunstancias lo justifican, avisándote dentro del plazo
            original (arts. 69 y 71 del Reglamento).
          </p>
          <p>
            Escríbenos a <a href={`mailto:${PROVIDER.correo}`} className={linkClass}>{PROVIDER.correo}</a> indicando tu
            nombre, una copia de tu documento de identidad (o el de tu representante, con el poder correspondiente), el
            derecho que ejerces, un correo o domicilio para responderte y los documentos que sustenten tu pedido. Si
            falta información, te la pediremos dentro de los 7 días siguientes.
          </p>
          <p>
            <strong>Eliminar los datos obtenidos de Facebook o WhatsApp:</strong> si conectaste tu cuenta de WhatsApp
            Business con Facebook, puedes desconectar el número desde la sección WhatsApp de tu panel; con eso dejamos de
            recibir y enviar mensajes por él. Para que además borremos tu token de acceso, tus conversaciones y los datos
            de tu cuenta, escríbenos a <a href={`mailto:${PROVIDER.correo}`} className={linkClass}>{PROVIDER.correo}</a> con
            el asunto &quot;Eliminación de datos&quot;. Los eliminamos en un máximo de 10 días y te confirmamos por correo.
            También puedes quitar el acceso de Wuarikes desde la configuración de Facebook, en Integraciones comerciales.
          </p>
          <p>
            Si consideras que no atendimos tu solicitud, puedes presentar una reclamación ante la Autoridad Nacional de
            Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos (por ejemplo, a través de la
            plataforma &quot;Yo cuido mis datos personales&quot;) o acudir al Poder Judicial (art. 24 de la Ley).
          </p>
        </Section>

        <Section title="14. Bancos de datos">
          <p>
            Los datos indicados se almacenan en los bancos de datos personales de {PROVIDER.razonSocial} (clientes y
            usuarios de la Plataforma, usuarios de la app de comensales y Libro de Reclamaciones), que inscribimos ante
            el Registro Nacional de Protección de Datos Personales (art. 34 de la Ley y art. 42 del Reglamento). Los
            datos de comensales tratados por encargo forman parte del banco de datos de cada establecimiento.
          </p>
        </Section>

        <Section title="15. Cambios a esta política">
          <p>
            Si cambiamos esta política de forma relevante, te lo comunicaremos por correo o dentro de la Plataforma
            antes de que el cambio se aplique y publicaremos aquí la nueva versión con su fecha. Si el cambio implica
            una nueva finalidad que requiere tu consentimiento, te lo pediremos.
          </p>
        </Section>

        <Section title="16. Contacto">
          <p>
            Para cualquier consulta sobre esta política o tus datos, escríbenos a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className={linkClass}>{PROVIDER.correo}</a>. También puedes usar nuestro{' '}
            <Link href="/libro-de-reclamaciones" className={linkClass}>Libro de Reclamaciones</Link>.
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
