'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const startTime = Date.now();
    const log = (step: string) => {
      const elapsed = Date.now() - startTime;
      console.log(`[LOGIN ${elapsed}ms] ${step}`);
    };

    log('📍 Iniciando login para: ' + email);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`;
      log('📍 URL destino: ' + apiUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      log('📍 Timeout configurado: 10s');

      log('📍 Enviando petición POST...');
      const fetchStart = Date.now();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      log(`📍 Respuesta recibida en ${Date.now() - fetchStart}ms, status: ${response.status}`);

      clearTimeout(timeoutId);

      if (!response.ok) {
        log('❌ Status no OK, parseando error...');
        const errorData = await response.json().catch(() => ({}));
        console.error('[LOGIN] Error de respuesta:', errorData);
        throw new Error(errorData.message || 'Credenciales inválidas');
      }

      log('📍 Parseando JSON...');
      const parseStart = Date.now();
      const data = await response.json();
      log(`📍 JSON parseado en ${Date.now() - parseStart}ms`);

      log(`✅ Login exitoso | Usuario: ${data.user.email} | Rol: ${data.user.role}`);

      if (data.user.role !== 'admin' && data.user.role !== 'business') {
        log('❌ Acceso denegado: rol insuficiente');
        throw new Error('Acceso restringido a administradores y dueños');
      }

      log('📍 Guardando en localStorage...');
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      log('📍 Datos guardados, redirigiendo a /inicio...');

      router.push('/inicio');
    } catch (err: any) {
      const totalTime = Date.now() - startTime;
      console.error(`[LOGIN ${totalTime}ms] ❌ Error:`, err.message);
      if (err.name === 'AbortError') {
        setError('La solicitud tardó demasiado. Verifica que el servidor está disponible.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      console.log(`[LOGIN] Total: ${Date.now() - startTime}ms`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 md:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-[#F26122] tracking-tighter mb-2">WUARIKE</h1>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Admin Control Center</p>
          </div>

          {sessionExpired && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl text-sm font-bold text-center">
              ⚠️ Tu sesión expiró. Inicia sesión nuevamente.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email corporativo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@wuarike.com"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#F26122]/10 focus:border-[#F26122] outline-none transition-all font-medium py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#F26122]/10 focus:border-[#F26122] outline-none transition-all font-medium py-3"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F26122] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#F26122]/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Entrar al Panel'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-xs font-semibold">
            Solo personal autorizado. Acceso monitoreado.
          </p>
        </div>
      </div>
    </div>
  );
}
