'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import AuthCard, { AuthError } from '../../../components/AuthCard';
import { buttonStyles } from '../../../components/ui';
import { authApi } from '../../../lib/api-client';

export default function ActivateAccountPage() {
  return (
    <Suspense>
      <ActivateAccountContent />
    </Suspense>
  );
}

function ActivateAccountContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const code = searchParams.get('code') || '';
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email || !code) {
      setStatus('error');
      setError('El link de activación está incompleto.');
      return;
    }
    authApi.verifyEmail(email, code)
      .then(() => setStatus('done'))
      .catch((err: any) => {
        setStatus('error');
        setError(err.message || 'El link es inválido o ya venció.');
      });
  }, [email, code]);

  return (
    <AuthCard
      title={status === 'done' ? 'Cuenta activada' : status === 'error' ? 'No pudimos activar tu cuenta' : 'Activar cuenta'}
      icon={status === 'done' ? CheckCircle2 : undefined}
    >
      {status === 'loading' && (
        <p role="status" className="flex items-center justify-center gap-2 text-sm text-text-muted">
          <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden />
          Activando tu cuenta...
        </p>
      )}

      {status === 'done' && (
        <div className="space-y-6 text-center">
          <p className="text-sm text-text">
            ¡Listo! Tu cuenta <span className="font-semibold">{email}</span> ya está activa.
          </p>
          <Link href="/login" className={buttonStyles('primary', 'md', 'w-full')}>
            Iniciar sesión
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <AuthError>{error}</AuthError>
          <p className="text-center text-sm text-text-muted">Pide al administrador que te envíe una nueva invitación.</p>
        </div>
      )}
    </AuthCard>
  );
}
