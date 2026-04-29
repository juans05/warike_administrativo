'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      
      // Check if user is admin or business
      if (data.user.role !== 'admin' && data.user.role !== 'business') {
        throw new Error('Acceso restringido a administradores y dueños');
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push('/inicio');
    } catch (err: any) {
      setError(err.message);
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
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Admin Control Center</p>
          </div>

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
