'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AuthLogo } from '../../../components/AuthCard';

/**
 * Entrada desde la app del barbero: llega con #code=…&next=/suscripcion y canjea el código por una sesión,
 * para no volver a pedir usuario y clave. El código va en el # para que no quede en logs del servidor.
 */
export default function EntrarPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const code = params.get('code');
    const nextParam = params.get('next') || '';
    // Solo rutas propias, igual que el login: evita un open redirect con next=//otro.com
    const nextPath = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/inicio';
    // El código no debe quedar en el historial del navegador.
    window.history.replaceState(null, '', window.location.pathname);

    const goToLogin = () => router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    if (!code) { goToLogin(); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/handoff/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const session = await response.json();
        if (!['admin', 'business', 'sales'].includes(session.user.role)) throw new Error();
        localStorage.setItem('token', session.accessToken);
        localStorage.setItem('user', JSON.stringify(session.user));
        router.replace(nextPath);
      })
      .catch(() => {
        setFailed(true);
        setTimeout(goToLogin, 1500);
      });
  }, [router]);

  return (
    <main role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <AuthLogo className="text-3xl" />
      {failed ? (
        <p className="text-sm text-text-muted">El enlace venció. Inicia sesión para continuar.</p>
      ) : (
        <>
          <Loader2 size={24} className="animate-spin text-primary motion-reduce:animate-none" aria-hidden />
          <p className="text-sm text-text-muted">Entrando a tu cuenta...</p>
        </>
      )}
    </main>
  );
}
