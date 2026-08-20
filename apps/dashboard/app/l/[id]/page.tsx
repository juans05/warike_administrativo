'use client';

import { useParams, useSearchParams } from 'next/navigation';
import ScanExperience from '../../../components/scan/ScanExperience';

export default function PublicScanPage() {
  const { id } = useParams();
  const qrCodeId = useSearchParams().get('qr') ?? undefined;
  return <ScanExperience placeId={id as string} qrCodeId={qrCodeId} />;
}
