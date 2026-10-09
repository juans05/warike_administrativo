'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 md:p-12 text-center">
          <h1 className="text-4xl font-black text-[#F26122] tracking-tighter mb-2">WUARIKE</h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-10">Activar cuenta</p>

          {status === 'loading' && <p className="text-gray-500 font-medium">Activando tu cuenta...</p>}

          {status === 'done' && (
            <>
              <p className="text-gray-700 font-medium mb-8">
                ¡Listo! Tu cuenta <span className="font-bold">{email}</span> ya está activa.
              </p>
              <a
                href="/login"
                className="block w-full bg-[#F26122] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#F26122]/20 hover:opacity-95 active:scale-[0.98] transition-all"
              >
                Iniciar sesión
              </a>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold border border-red-100 mb-6">
                {error}
              </div>
              <p className="text-gray-500 text-sm">Pide al administrador que te envíe una nueva invitación.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
