'use client';

import { useParams } from 'next/navigation';
import ScanExperience from '../../../components/scan/ScanExperience';

export default function PublicScanPage() {
  const { id } = useParams();
  return <ScanExperience placeId={id as string} />;
}
