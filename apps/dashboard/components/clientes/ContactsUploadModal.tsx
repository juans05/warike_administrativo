'use client';

import React, { useRef, useState } from 'react';
import { ContactImport } from '../../lib/api-client';

interface ContactsUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  lastResult: ContactImport | null;
}

function downloadTemplate() {
  const csv = 'nombre,celular,email,dni\nJuan Pérez,987654321,juan@example.com,12345678\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-clientes.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function ContactsUploadModal({ open, onClose, onUpload, uploading, lastResult }: ContactsUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    if (selectedFile) onUpload(selectedFile);
  };

  const handleCloseAndReset = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Subir Clientes Masivamente</h3>
            <p className="text-xs text-gray-400 mt-0.5">Importa tu base de clientes desde un archivo CSV o Excel</p>
          </div>
          <button onClick={handleCloseAndReset} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-7 py-6 space-y-5">
          {!lastResult ? (
            <>
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-xs font-black text-orange-700">Columnas esperadas:</p>
                <p className="text-xs text-orange-700">
                  <strong>nombre</strong> (nombre y apellido), <strong>celular</strong>, <strong>email</strong>, y <strong>dni</strong> (opcional)
                </p>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="text-[10px] font-black text-orange-600 hover:underline mt-1"
                >
                  📥 Descargar plantilla de ejemplo
                </button>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-orange-300 hover:bg-orange-50/50 transition-all"
                >
                  {selectedFile ? (
                    <>
                      <p className="text-3xl mb-2">📄</p>
                      <p className="font-black text-sm text-gray-900">{selectedFile.name}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Click para cambiar el archivo</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl mb-2">📤</p>
                      <p className="font-black text-sm text-gray-700">Click para seleccionar un archivo</p>
                      <p className="text-[10px] text-gray-400 mt-1">CSV, XLSX o XLS · Máx 10MB</p>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className={`rounded-xl px-4 py-3 border ${lastResult.failedRows === 0 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-sm font-black text-gray-900">
                  ✅ {lastResult.importedRows} de {lastResult.totalRows} clientes importados
                </p>
                {lastResult.failedRows > 0 && (
                  <p className="text-xs font-bold text-amber-700 mt-1">⚠️ {lastResult.failedRows} filas con errores</p>
                )}
              </div>
              {lastResult.errorLog && lastResult.errorLog.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 bg-gray-50 rounded-xl p-3">
                  {lastResult.errorLog.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-[10px] text-gray-500 font-mono">Fila {err.row}: {err.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-7 py-5 border-t border-gray-100 flex gap-3">
          <button onClick={handleCloseAndReset} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
            {lastResult ? 'Cerrar' : 'Cancelar'}
          </button>
          {!lastResult && (
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className="flex-1 py-3 bg-[#F26122] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Subir Archivo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
