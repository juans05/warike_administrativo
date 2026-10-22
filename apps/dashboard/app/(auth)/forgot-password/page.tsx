'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthCard, { AuthError } from '../../../components/AuthCard';
import { Button, Input } from '../../../components/ui';
import { authApi } from '../../../lib/api-client';

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get('email') || '';
  const urlCode = searchParams.get('code') || '';
  const [step, setStep] = useState<'request' | 'reset'>(urlEmail && urlCode ? 'reset' : 'request');
  const [email, setEmail] = useState(urlEmail);
  const [code, setCode] = useState(urlCode);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Error al pedir el código');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(email, code, password);
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={step === 'request' ? 'Recupera tu contraseña' : 'Elige tu nueva contraseña'}
      subtitle={
        step === 'request'
          ? 'Te enviaremos un código a tu correo.'
          : urlCode
            ? <>Elige la contraseña para <span className="font-semibold text-text">{email}</span></>
            : <>Te mandamos un código de 6 dígitos a <span className="font-semibold text-text">{email}</span></>
      }
      footer={<Link href="/login" className="inline-flex min-h-11 items-center rounded-control font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Volver a iniciar sesión</Link>}
    >
      {step === 'request' ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
          />

          {error && <AuthError>{error}</AuthError>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Enviando...' : 'Mandar código'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          {/* Llegando desde el link del correo el código ya viene en la URL (y es largo): no hace falta mostrarlo. */}
          {!urlCode && (
            <Input
              label="Código"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="text-center tracking-[0.5em]"
              required
            />
          )}
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            minLength={6}
            hint="Mínimo 6 caracteres."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <AuthError>{error}</AuthError>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep('request')}>
            Pedir un código nuevo
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
