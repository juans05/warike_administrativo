'use client';

import { useParams } from 'next/navigation';
import ScanExperience from '../../../../../components/scan/ScanExperience';

export default function PublicDeviceScanPage() {
  const { id, deviceId } = useParams();
  return <ScanExperience placeId={id as string} deviceId={deviceId as string} />;
}
