'use client';

import React from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] texture-paper flex flex-col items-center p-6">
      <div className="w-full max-w-md space-y-10 py-10">
        {children}
      </div>
      
      <footer className="mt-auto py-10 text-center">
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Potenciado por <span className="text-[var(--primary)]">WUARIKE</span></p>
      </footer>
    </div>
  );
}
