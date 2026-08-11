'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../../lib/api-client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 md:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-[#F26122] tracking-tighter mb-2">WUARIKE</h1>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
              {step === 'request' ? 'Recuperar contraseña' : 'Elegí tu nueva contraseña'}
            </p>
          </div>

          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-6">
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
                {loading ? 'Enviando...' : 'Mandar código'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <p className="text-sm text-gray-500 text-center -mt-4">
                Te mandamos un código de 6 dígitos a <span className="font-bold text-gray-700">{email}</span>
              </p>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Código</label>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#F26122]/10 focus:border-[#F26122] outline-none transition-all font-medium py-3 tracking-[0.5em] text-center"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nueva contraseña</label>
                <input
                  type="password" minLength={6}
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
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full text-center text-xs text-gray-400 font-bold hover:text-gray-600"
              >
                Pedir un código nuevo
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-gray-400 text-xs font-semibold">
            <a href="/login" className="hover:text-[#F26122]">Volver a iniciar sesión</a>
          </p>
        </div>
      </div>
    </div>
  );
}
