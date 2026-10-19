'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import AuthCard, { AuthError, AuthLogo } from '../../../components/AuthCard';
import { Button, Input } from '../../../components/ui';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';
  // Only same-origin paths, to avoid an open redirect via ?next=//evil.com
  const nextParam = searchParams.get('next') || '';
  const nextPath = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/inicio';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciales inválidas');
      }

      const data = await response.json();

      if (data.user.role !== 'admin' && data.user.role !== 'business') {
        throw new Error('Acceso restringido a administradores y dueños');
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setShowSplash(true);
      setTimeout(() => router.push(nextPath), 500);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('La solicitud tardó demasiado. Verifica que el servidor está disponible.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      }
      setLoading(false);
    }
  };

  if (showSplash) {
    return (
      <main role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <AuthLogo className="text-3xl" />
        <Loader2 size={24} className="animate-spin text-primary motion-reduce:animate-none" aria-hidden />
        <p className="text-sm text-text-muted">Cargando tu panel...</p>
      </main>
    );
  }

  return (
    <AuthCard
      title="Inicia sesión"
      subtitle="Entra al panel de tu negocio."
      footer="Solo personal autorizado. Acceso monitoreado."
    >
      {sessionExpired && (
        <p role="status" className="mb-4 flex items-start gap-2 rounded-control bg-secondary/20 px-3 py-2.5 text-sm text-text">
          <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
          <span>Tu sesión expiró. Inicia sesión nuevamente.</span>
        </p>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
        />
        <div>
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="mt-1 text-right">
            <Link href="/forgot-password" className="inline-flex min-h-11 items-center rounded-control text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {error && <AuthError>{error}</AuthError>}

        <Button type="submit" loading={loading} className="w-full">
          {loading ? 'Entrando...' : 'Entrar al panel'}
        </Button>
      </form>
    </AuthCard>
  );
}
