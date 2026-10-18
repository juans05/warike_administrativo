'use client';

import Link from 'next/link';
import { Store } from 'lucide-react';
import { EmptyState, PageHeader, buttonStyles } from '../../../components/ui';

// Placeholder: the profile form moved to /mi-ficha; Task R4 rewrites Inicio (pasos / "Tu día").
export default function InicioPage() {
  return (
    <div>
      <PageHeader title="Inicio" />
      <EmptyState
        icon={Store}
        title="Tu ficha ahora está en Mi ficha"
        description="Edita los datos, la ubicación, el horario y las fotos de tu negocio desde Mi ficha."
        action={<Link href="/mi-ficha" className={buttonStyles()}>Ir a Mi ficha</Link>}
      />
    </div>
  );
}
