import Link from 'next/link';

const PROVIDER = {
  razonSocial: 'Wuarikes SAC',
  ruc: '20616350227',
  direccion: 'Micaela Bastidas 231, Lima, Perú',
  correo: 'consulta@wuarikes.com',
};

// Fecha fija de la versión vigente: cambiarla solo cuando cambie el texto (sirve como prueba de qué se aceptó).
const VERSION = { id: '2026-10-14', fecha: '14 de octubre de 2026' };

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

const linkClass = 'text-[var(--primary)] hover:underline';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-6">
      <article className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="font-warike text-3xl font-bold text-[var(--text)]">Términos y Condiciones del Servicio</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Versión {VERSION.id} · Vigente desde el {VERSION.fecha}
          </p>
        </header>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Datos del proveedor</p>
          <p className="text-sm text-[var(--text)]"><strong>Razón social:</strong> {PROVIDER.razonSocial}</p>
          <p className="text-sm text-[var(--text)]"><strong>RUC:</strong> {PROVIDER.ruc}</p>
          <p className="text-sm text-[var(--text)]"><strong>Domicilio:</strong> {PROVIDER.direccion}</p>
          <p className="text-sm text-[var(--text)]"><strong>Correo:</strong> {PROVIDER.correo}</p>
        </section>

        <Section title="1. Definiciones">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Wuarike o la Plataforma:</strong> el software como servicio (SaaS) operado por {PROVIDER.razonSocial}, incluido el panel de administración, la carta digital, las páginas públicas, los asistentes automatizados y sus integraciones.</li>
            <li><strong>Cliente:</strong> la persona natural con negocio o la persona jurídica que contrata un plan o compra hardware para su establecimiento.</li>
            <li><strong>Usuario autorizado:</strong> cada persona a la que el Cliente da acceso a su cuenta (por ejemplo, administradores, supervisores, agentes o personal de cocina).</li>
            <li><strong>Comensal:</strong> el cliente final del establecimiento que interactúa con la Plataforma (escanea un código QR o NFC, deja una opinión, escribe por WhatsApp, suma sellos o puntos).</li>
            <li><strong>Dispositivos:</strong> los expositores, stands, placas y demás productos físicos con NFC o QR que vendemos para usar con la Plataforma.</li>
            <li><strong>Contenido del Cliente:</strong> la información, fotos, cartas, textos, configuraciones e instrucciones que el Cliente o sus Usuarios autorizados cargan en la Plataforma.</li>
          </ul>
        </Section>

        <Section title="2. Objeto y naturaleza del Servicio">
          <p>
            Wuarike es un producto propio, ofrecido por suscripción mensual (planes Reputación, Fidelización+ e IA
            Total), que permite al Cliente gestionar su reputación en línea, su carta digital, su programa de
            fidelización, su comunicación con comensales y las demás funciones de su plan (&quot;el Servicio&quot;).
            De forma complementaria vendemos Dispositivos para usar con el Servicio. Wuarike no desarrolla software a
            medida por encargo.
          </p>
          <p>
            Wuarike es una herramienta: el Cliente es quien presta sus propios productos y servicios a los comensales y
            responde frente a ellos por su calidad, precios, atención, inocuidad y por las obligaciones que le
            corresponden como proveedor. {PROVIDER.razonSocial} no garantiza resultados concretos de visibilidad,
            calificaciones, reseñas, posicionamiento en buscadores, ventas ni reputación.
          </p>
        </Section>

        <Section title="3. Aceptación y prueba de la aceptación">
          <p>
            Al registrarte, contratar un plan o comprar Dispositivos aceptas estos Términos, la{' '}
            <Link href="/politica-de-privacidad" className={linkClass}>Política de Privacidad</Link>, el{' '}
            <Link href="/contrato-de-encargo-de-datos" className={linkClass}>Contrato de Encargo de Tratamiento de Datos Personales</Link>{' '}
            y la <Link href="/politica-de-cambios-y-devoluciones" className={linkClass}>Política de Cambios y Devoluciones</Link>,
            que forman parte de este acuerdo. Si no estás de acuerdo, no debes usar el Servicio.
          </p>
          <p>
            La aceptación por medios electrónicos tiene plena validez conforme al artículo 141 del Código Civil.
            Conservamos un registro de la versión aceptada, la fecha, la hora y la cuenta que la aceptó, como prueba
            de la contratación.
          </p>
        </Section>

        <Section title="4. Cuenta, representación y Usuarios autorizados">
          <p>
            Para usar el Servicio debes ser mayor de edad, tener capacidad para contratar y, si actúas por una empresa,
            contar con facultades para obligarla. Los datos de registro deben ser verídicos y mantenerse actualizados.
          </p>
          <p>
            El Cliente es responsable de la confidencialidad de las credenciales, de los permisos que otorga a sus
            Usuarios autorizados y de toda actividad realizada desde su cuenta. Debe avisarnos de inmediato a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className={linkClass}>{PROVIDER.correo}</a> si detecta un acceso no
            autorizado.
          </p>
        </Section>

        <Section title="5. Planes, precios, IGV y comprobantes de pago">
          <p>
            Los planes vigentes, sus funciones, límites y precios se publican en{' '}
            <Link href="/#planes" className={linkClass}>wuarikes.com/#planes</Link>. Los precios están expresados en soles
            (PEN) y corresponden al precio total que pagas, incluidos los tributos aplicables.
          </p>
          <p>
            Por cada pago emitimos el comprobante de pago electrónico que corresponda conforme a las normas de la SUNAT,
            a nombre del RUC o documento de identidad que registres. Es responsabilidad del Cliente registrar datos de
            facturación correctos; no podemos emitir comprobantes a nombre de un tercero distinto al que paga.
          </p>
        </Section>

        <Section title="6. Renovación automática y pagos">
          <p>
            La suscripción es mensual y se renueva automáticamente al final de cada período, cobrándose a la tarjeta
            registrada a través de nuestra pasarela de pagos (Culqi), hasta que la canceles. {PROVIDER.razonSocial} no
            recibe ni almacena el número completo de tu tarjeta.
          </p>
          <p>
            Si un cobro no puede realizarse, el plan queda en estado de pago pendiente y sus funciones de pago pueden
            pausarse hasta que se registre un medio de pago válido y el cobro se complete. No aplicamos penalidades ni
            intereses por la falta de pago; simplemente el servicio de pago se suspende.
          </p>
        </Section>

        <Section title="7. Cambios de precio">
          <p>
            Podemos modificar los precios de los planes. Te avisaremos por correo con al menos treinta (30) días
            calendario de anticipación. El nuevo precio se aplica desde la siguiente renovación posterior a ese plazo.
            Si no estás de acuerdo, puedes cancelar antes de esa renovación sin costo alguno.
          </p>
        </Section>

        <Section title="8. Cancelación y reembolsos">
          <p>
            Puedes cancelar tu suscripción en cualquier momento desde tu panel o escribiéndonos, sin permanencia mínima
            ni penalidad. Las reglas sobre el momento en que la cancelación surte efecto y sobre reembolsos están en la{' '}
            <Link href="/politica-de-cambios-y-devoluciones" className={linkClass}>Política de Cambios y Devoluciones</Link>.
          </p>
        </Section>

        <Section title="9. Dispositivos (hardware NFC y QR)">
          <p>
            Los Dispositivos se venden de forma independiente a la suscripción. La entrega se coordina con el Cliente
            al confirmar la compra, a la dirección y con el contacto que indique. Los Dispositivos funcionan con
            teléfonos compatibles con NFC o con la lectura de códigos QR; su funcionamiento depende de que el código
            esté vinculado a una cuenta activa.
          </p>
          <p>
            Los Dispositivos cuentan con la garantía legal de idoneidad prevista en el Código de Protección y Defensa
            del Consumidor (Ley N.º 29571), sin perjuicio de lo indicado en la Política de Cambios y Devoluciones. Si
            la suscripción termina, el Dispositivo puede quedar desactivado o redirigir a una página informativa.
          </p>
        </Section>

        <Section title="10. Uso aceptable">
          <p>El Cliente y sus Usuarios autorizados se obligan a no usar la Plataforma para:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Publicar, encargar o fomentar reseñas falsas, escritas por el propio negocio, su personal o personas vinculadas, o reseñas sobre competidores.</li>
            <li>Ofrecer pagos, descuentos, regalos u otros beneficios a cambio de reseñas, o a cambio de modificar o retirar una reseña.</li>
            <li>Pedir reseñas públicas solo a los clientes satisfechos, desalentar o impedir reseñas negativas, o presionar a los comensales para que califiquen dentro del local.</li>
            <li>Enviar mensajes de WhatsApp, correos o campañas a personas que no dieron su consentimiento, o seguir escribiendo a quien pidió dejar de recibirlos.</li>
            <li>Cargar datos personales de terceros sin una base legal para tratarlos, o datos sensibles innecesarios para el Servicio.</li>
            <li>Publicar contenido ilícito, engañoso, difamatorio, discriminatorio o que infrinja derechos de terceros (incluidos derechos de autor sobre fotos, música o videos).</li>
            <li>Suplantar a otro negocio o persona, o reclamar como propio un local que no administra.</li>
            <li>Acceder sin autorización, hacer ingeniería inversa, extraer datos de forma masiva o automatizada (scraping), revender o sublicenciar la Plataforma, o afectar su seguridad o disponibilidad.</li>
          </ul>
          <p>
            Podemos retirar contenido, desactivar funciones o suspender la cuenta que incumpla esta cláusula, conforme
            a la cláusula 17.
          </p>
        </Section>

        <Section title="11. Plataformas de terceros (Google, Meta y otras)">
          <p>
            Algunas funciones dependen de servicios de terceros, como Google Maps y Google Business Profile, WhatsApp e
            Instagram (Meta), PlazBot, Culqi, Apple Wallet y Google Wallet. Al conectarlos, el Cliente acepta además
            los términos y políticas de esos servicios y es responsable de cumplirlos, en especial la política de
            contenido de reseñas de Google y las políticas de mensajería de WhatsApp Business.
          </p>
          <p>
            La conexión con Google y otras plataformas se hace mediante autorizaciones (OAuth) que el Cliente puede
            revocar en cualquier momento. {PROVIDER.razonSocial} no controla esos servicios y no responde por sus
            cambios, interrupciones, eliminación de reseñas, suspensiones de cuentas o restricciones que decidan
            aplicar. Si un tercero modifica o retira el acceso a su servicio, podremos adaptar o retirar la función
            afectada.
          </p>
        </Section>

        <Section title="12. Inteligencia artificial">
          <p>
            Algunas funciones usan inteligencia artificial para sugerir o generar respuestas (por ejemplo, respuestas a
            reseñas, contenido para redes sociales o el asistente de WhatsApp). Sus resultados pueden contener errores:
            son una ayuda, no un asesoramiento, y el Cliente debe revisarlos antes de publicarlos o configurarlos.
          </p>
          <p>
            Cuando el asistente conversa con comensales, se presenta como un asistente automatizado del negocio. El
            Cliente es responsable de la información que carga en su base de conocimiento y de las instrucciones que da
            al asistente. {PROVIDER.razonSocial} no usa el Contenido del Cliente para entrenar modelos de
            inteligencia artificial propios.
          </p>
        </Section>

        <Section title="13. Contenido del Cliente">
          <p>
            El Cliente conserva la titularidad del Contenido del Cliente y declara contar con los derechos necesarios
            para usarlo. Nos otorga una licencia no exclusiva, gratuita y limitada a la vigencia del Servicio para
            alojarlo, reproducirlo, adaptarlo y mostrarlo únicamente para prestar el Servicio (por ejemplo, mostrar su
            carta y fotos en la página pública del local).
          </p>
        </Section>

        <Section title="14. Protección de datos personales">
          <p>
            Tratamos los datos de los Clientes y Usuarios autorizados como responsables, conforme a la Ley N.º 29733 y
            su Reglamento (Decreto Supremo N.º 016-2024-JUS) y a nuestra{' '}
            <Link href="/politica-de-privacidad" className={linkClass}>Política de Privacidad</Link>.
          </p>
          <p>
            Respecto de los datos de los comensales que se recogen a través de la Plataforma por cuenta del
            establecimiento, el Cliente es el titular del banco de datos y {PROVIDER.razonSocial} actúa como encargado
            del tratamiento, conforme al{' '}
            <Link href="/contrato-de-encargo-de-datos" className={linkClass}>Contrato de Encargo de Tratamiento de Datos Personales</Link>.
            El Cliente se obliga a cumplir las obligaciones que le corresponden como titular del banco de datos, entre
            ellas la inscripción de su banco de datos ante el Registro Nacional de Protección de Datos Personales.
          </p>
        </Section>

        <Section title="15. Propiedad intelectual">
          <p>
            El software, la marca Wuarike, el diseño de la Plataforma y sus contenidos son propiedad de{' '}
            {PROVIDER.razonSocial} o de sus licenciantes. Durante la suscripción otorgamos al Cliente una licencia de
            uso limitada, no exclusiva, intransferible y revocable, solo para la operación de su propio negocio.
          </p>
        </Section>

        <Section title="16. Disponibilidad y soporte">
          <p>
            Trabajamos para que la Plataforma esté disponible de forma continua, pero no garantizamos que funcione sin
            interrupciones ni errores. Podemos realizar mantenimientos, que procuraremos programar en horarios de baja
            actividad y avisar con anticipación cuando sean planificados. El soporte se brinda por correo y por los
            canales indicados en el panel.
          </p>
        </Section>

        <Section title="17. Suspensión y terminación">
          <p>
            El Cliente puede terminar el contrato en cualquier momento cancelando su suscripción. {PROVIDER.razonSocial}{' '}
            puede suspender o terminar la cuenta, previa comunicación, cuando haya falta de pago, incumplimiento de
            estos Términos, uso fraudulento o ilícito, riesgo para la seguridad de la Plataforma o de terceros, o por
            orden de autoridad competente. Ante un incumplimiento grave o reiterado, la suspensión puede ser inmediata.
          </p>
          <p>
            Si decidimos dejar de prestar el Servicio por razones propias del negocio, sin que exista incumplimiento
            del Cliente, te avisaremos con al menos treinta (30) días calendario de anticipación y devolveremos la parte
            proporcional de lo pagado por el período no utilizado.
          </p>
        </Section>

        <Section title="18. Efectos de la terminación">
          <p>
            Durante los treinta (30) días calendario siguientes a la terminación, el Cliente puede solicitarnos una
            copia de su Contenido y de los datos de su banco de datos de comensales en un formato de uso común.
            Vencido ese plazo, eliminaremos o anonimizaremos la información, salvo la que debamos conservar por
            obligación legal (por ejemplo, tributaria o contable) y por el tiempo que esta lo exija.
          </p>
        </Section>

        <Section title="19. Limitación de responsabilidad">
          <p>
            En la máxima medida permitida por la ley, {PROVIDER.razonSocial} no responde por lucro cesante, pérdida de
            clientes o reputación, ni por daños indirectos, ni por hechos de terceros fuera de su control razonable
            (proveedores de internet, pasarelas de pago, Google, Meta u otras plataformas). La responsabilidad total de{' '}
            {PROVIDER.razonSocial} frente al Cliente por cualquier causa vinculada al Servicio se limita al monto
            efectivamente pagado por el Cliente en los doce (12) meses anteriores al hecho que la origina.
          </p>
          <p>
            Conforme al artículo 1328 del Código Civil, estas limitaciones no se aplican a los daños causados por dolo
            o culpa inexcusable, ni afectan los derechos que la ley reconoce de forma irrenunciable a los consumidores.
          </p>
        </Section>

        <Section title="20. Indemnidad">
          <p>
            El Cliente mantendrá indemne a {PROVIDER.razonSocial} frente a reclamos, sanciones o daños de terceros
            (incluidos comensales, plataformas y autoridades) que se originen en el Contenido del Cliente, en el uso de
            la Plataforma en contra de estos Términos o de la ley, o en el incumplimiento de sus obligaciones como
            titular del banco de datos personales de sus comensales.
          </p>
        </Section>

        <Section title="21. Caso fortuito y fuerza mayor">
          <p>
            Ninguna de las partes responde por el incumplimiento causado por caso fortuito o fuerza mayor, conforme al
            artículo 1315 del Código Civil. Si la situación se prolonga por más de sesenta (60) días calendario,
            cualquiera de las partes puede terminar el contrato sin penalidad.
          </p>
        </Section>

        <Section title="22. Modificaciones de estos Términos">
          <p>
            Podemos actualizar estos Términos para reflejar cambios en el Servicio o en la normativa. Los cambios
            relevantes se comunicarán por correo con al menos treinta (30) días calendario de anticipación y se
            publicarán aquí con su número de versión y fecha. Si no estás de acuerdo, puedes cancelar antes de que
            entren en vigencia; si continúas usando el Servicio después de esa fecha, se entienden aceptados.
          </p>
        </Section>

        <Section title="23. Comunicaciones">
          <p>
            Las comunicaciones se envían al correo registrado en la cuenta y, cuando corresponda, por avisos dentro del
            panel. El Cliente puede escribirnos a{' '}
            <a href={`mailto:${PROVIDER.correo}`} className={linkClass}>{PROVIDER.correo}</a>.
          </p>
        </Section>

        <Section title="24. Cesión, divisibilidad e integridad">
          <p>
            El Cliente no puede ceder este contrato sin nuestro consentimiento previo. {PROVIDER.razonSocial} puede
            cederlo en el marco de una reorganización societaria o transferencia del negocio, comunicándolo al Cliente.
            Si alguna cláusula se declara nula, las demás mantienen su validez. Estos Términos y los documentos
            vinculados constituyen el acuerdo completo entre las partes sobre el Servicio.
          </p>
        </Section>

        <Section title="25. Ley aplicable, jurisdicción y reclamos">
          <p>
            Estos Términos se rigen por las leyes de la República del Perú. Para cualquier controversia, las partes se
            someten a los jueces y tribunales del Distrito Judicial de Lima, sin perjuicio del derecho de quien actúe
            como consumidor de acudir al Indecopi o a las autoridades que correspondan.
          </p>
          <p>
            Puedes presentar un reclamo o queja en nuestro{' '}
            <Link href="/libro-de-reclamaciones" className={linkClass}>Libro de Reclamaciones</Link>. Lo responderemos en
            un plazo máximo de quince (15) días hábiles improrrogables, conforme al artículo 24.1 del Código de
            Protección y Defensa del Consumidor.
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
