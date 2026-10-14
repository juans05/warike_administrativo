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
  title: 'Contrato de Encargo de Tratamiento de Datos Personales — Wuarike',
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

export default function ContratoEncargoPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-6">
      <article className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="font-warike text-3xl font-bold text-[var(--text)]">Contrato de Encargo de Tratamiento de Datos Personales</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Versión {VERSION.id} · Vigente desde el {VERSION.fecha} · Anexo de los{' '}
            <Link href="/terminos-y-condiciones" className={linkClass}>Términos y Condiciones</Link>
          </p>
        </header>

        <Section title="1. Partes">
          <p>
            <strong>El Responsable:</strong> el Cliente que contrata Wuarike para su establecimiento, titular del banco de
            datos personales de sus comensales.
          </p>
          <p>
            <strong>El Encargado:</strong> {PROVIDER.razonSocial}, con RUC {PROVIDER.ruc} y domicilio en{' '}
            {PROVIDER.direccion}, que presta el servicio Wuarike.
          </p>
          <p>
            Este contrato se celebra por medios electrónicos al aceptar los Términos y Condiciones y regula el
            tratamiento por encargo previsto en el artículo 30 de la Ley N.º 29733 y en los artículos 28 a 36 de su
            Reglamento (Decreto Supremo N.º 016-2024-JUS).
          </p>
        </Section>

        <Section title="2. Objeto, naturaleza y finalidad del encargo">
          <p>
            El Encargado trata, por cuenta del Responsable y solo para prestarle el servicio contratado, los datos
            personales de los comensales que se recogen a través de la Plataforma: códigos QR y NFC del
            establecimiento, formularios de opinión, programa de fidelización, tarjetas digitales, asistente de
            WhatsApp, campañas, carta digital y pedidos.
          </p>
          <p>
            Las operaciones de tratamiento son: recopilación, registro, almacenamiento, consulta, uso para las funciones
            que el Responsable activa, envío de mensajes que el Responsable dispone, conservación y supresión.
          </p>
        </Section>

        <Section title="3. Datos y titulares">
          <p>
            <strong>Titulares:</strong> comensales y clientes finales del establecimiento, y personas que le escriben
            por WhatsApp. <strong>Datos:</strong> nombre, teléfono o WhatsApp, correo (si el Responsable lo recoge),
            calificaciones y comentarios, historial de visitas, sellos o puntos, conversaciones con el asistente,
            consentimiento para promociones y, en pedidos, los productos solicitados y los datos de entrega. El servicio
            no está diseñado para tratar datos sensibles y el Responsable se obliga a no solicitarlos a través de él.
          </p>
        </Section>

        <Section title="4. Obligaciones del Encargado">
          <ul className="list-disc pl-5 space-y-2">
            <li>Tratar los datos solo según las instrucciones del Responsable, que se expresan en la configuración que este realiza en la Plataforma y en este contrato, y no usarlos para finalidades propias (art. 30 de la Ley).</li>
            <li>No transferirlos a terceros salvo a los subencargados de la cláusula 6 o por mandato legal (art. 31.1 del Reglamento).</li>
            <li>No asumir la titularidad del banco de datos del Responsable (art. 29 del Reglamento).</li>
            <li>Guardar confidencialidad, también después de terminado el contrato, y exigirla a su personal (art. 17 de la Ley).</li>
            <li>Aplicar las medidas de seguridad del Reglamento, incluidos el control de accesos y los registros de trazabilidad del artículo 46.</li>
            <li>Permitir al Responsable limitar el tipo de tratamiento mediante la configuración de la Plataforma (art. 30 del Reglamento).</li>
            <li>Avisar al Responsable de inmediato de cualquier incidente de seguridad que afecte sus datos (art. 36 del Reglamento), con la información disponible para que pueda notificarlo a la Autoridad en el plazo de 48 horas del artículo 34.</li>
            <li>Comunicar al Responsable los cambios en sus condiciones que impliquen ampliar el tratamiento, para que este pueda aceptarlos o rechazarlos (art. 30.1 del Reglamento).</li>
            <li>Informar al Responsable si una autoridad le solicita acceso a sus datos, salvo que la ley lo prohíba.</li>
          </ul>
        </Section>

        <Section title="5. Obligaciones del Responsable">
          <ul className="list-disc pl-5 space-y-2">
            <li>Contar con una base legal para el tratamiento y, cuando corresponda, con el consentimiento libre, previo, expreso, inequívoco e informado de sus comensales. La Plataforma muestra al comensal el aviso de privacidad y una casilla separada y desmarcada para promociones; el Responsable no debe alterar ni omitir esos mecanismos.</li>
            <li>Inscribir su banco de datos de clientes ante el Registro Nacional de Protección de Datos Personales (art. 42 del Reglamento) y, cuando corresponda, comunicar el flujo transfronterizo de datos (art. 21.2 del Reglamento).</li>
            <li>Atender, con la asistencia del Encargado, las solicitudes de los comensales para ejercer sus derechos.</li>
            <li>Enviar promociones solo a quienes dieron su consentimiento y respetar de inmediato las bajas.</li>
            <li>Dar a sus Usuarios autorizados solo los permisos necesarios y retirarlos cuando dejen de trabajar para el establecimiento.</li>
          </ul>
        </Section>

        <Section title="6. Subencargados autorizados">
          <p>
            El Responsable autoriza al Encargado a valerse de los proveedores listados en la sección 7 de la{' '}
            <Link href="/politica-de-privacidad" className={linkClass}>Política de Privacidad</Link> (alojamiento,
            almacenamiento de archivos, correo, registro de errores, mensajería de WhatsApp, inteligencia artificial,
            pagos y servicios de Google y Apple) para prestar el servicio (art. 32.2 del Reglamento). El Encargado
            responde de que asuman obligaciones equivalentes a las de este contrato (art. 33 del Reglamento) y avisará
            al Responsable, a través de esa política, antes de incorporar uno nuevo, para que pueda oponerse con causa
            justificada.
          </p>
          <p>
            Algunos subencargados tratan los datos fuera del Perú. El Encargado realiza ese flujo con proveedores que
            ofrecen niveles de protección adecuados o con garantías contractuales, conforme a los artículos 18 a 20 del
            Reglamento.
          </p>
        </Section>

        <Section title="7. Derechos de los comensales">
          <p>
            Si un comensal dirige al Encargado una solicitud de información, acceso, rectificación, cancelación,
            oposición o portabilidad sobre datos del Responsable, el Encargado la trasladará al Responsable sin demora
            y le brindará la información y las herramientas de la Plataforma necesarias para atenderla dentro de los
            plazos del artículo 69 del Reglamento. Las bajas de promociones pedidas por WhatsApp se aplican de forma
            automática.
          </p>
        </Section>

        <Section title="8. Duración, devolución y supresión">
          <p>
            Este contrato dura mientras el Cliente mantenga su cuenta en Wuarike. Al terminar, el Responsable puede
            solicitar una copia de sus datos durante treinta (30) días calendario. Luego, el Encargado los suprime y
            evidencia su supresión a pedido del Responsable. La conservación nunca excederá de dos (2) años desde la
            finalización del encargo, salvo obligación legal, caso en el cual los datos se devuelven al Responsable
            (art. 31.2 del Reglamento y art. 30 de la Ley).
          </p>
        </Section>

        <Section title="9. Verificación">
          <p>
            El Encargado pondrá a disposición del Responsable, a su solicitud razonable y con aviso previo, la
            información necesaria para demostrar el cumplimiento de este contrato.
          </p>
        </Section>

        <Section title="10. Responsabilidad">
          <p>
            Si el Encargado usa los datos para una finalidad distinta a la encomendada o los transfiere incumpliendo
            las instrucciones del Responsable, asume las obligaciones de titular del banco de datos respecto de ese
            tratamiento, conforme al artículo 33 del Reglamento. En lo demás, se aplica la cláusula de limitación de
            responsabilidad de los Términos y Condiciones, que no excluye el dolo ni la culpa inexcusable.
          </p>
        </Section>

        <Section title="11. Ley aplicable">
          <p>
            Este contrato se rige por las leyes del Perú, en particular la Ley N.º 29733 y su Reglamento. Las
            controversias se resuelven según la cláusula de jurisdicción de los Términos y Condiciones. Consultas:{' '}
            <a href={`mailto:${PROVIDER.correo}`} className={linkClass}>{PROVIDER.correo}</a>.
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
