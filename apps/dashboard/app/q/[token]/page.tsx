import { redirect } from 'next/navigation';
import { publicApi } from '../../../lib/api-client';

// Crítico: este resolver tiene que reflejar la asignación activa en cada
// escaneo. Sin esto, Next.js puede cachear la respuesta la primera vez que
// alguien visita un token y seguir sirviéndola después de reasignar/activar.
export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: 'Este QR no existe.',
  UNAVAILABLE: 'Este QR no está disponible actualmente.',
  NOT_ASSIGNED: 'Este código todavía no está activado.',
};

export default async function QrResolverPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let result: any;
  try {
    result = await publicApi.resolveQr(token);
  } catch {
    result = { error: 'NOT_FOUND' };
  }

  if (result.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8 text-center">
        <p className="text-lg font-bold text-text">
          {ERROR_MESSAGES[result.error] || 'Este QR no está disponible.'}
        </p>
      </div>
    );
  }

  const { destinationType, destinationUrl, placeId, qrCodeId } = result;

  if (destinationType === 'MENU') {
    redirect(`/menu/${placeId}`);
  }
  if (destinationType === 'CUSTOM_URL' && destinationUrl) {
    redirect(destinationUrl);
  }
  // REPUTATION (default): reusa el ScanExperience de siempre.
  redirect(`/l/${placeId}?qr=${qrCodeId}`);
}
