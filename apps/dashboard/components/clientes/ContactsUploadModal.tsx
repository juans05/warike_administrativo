'use client';

import React, { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Upload } from 'lucide-react';
import { ContactImport } from '../../lib/api-client';
import { Button, Modal, cn } from '../ui';

interface ContactsUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  lastResult: ContactImport | null;
  /** Etiqueta del rubro en plural y minúsculas ("clientes", "pacientes"). */
  customers: string;
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

export function ContactsUploadModal({ open, onClose, onUpload, uploading, lastResult, customers }: ContactsUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // El <dialog> nativo deja montado el <input>: sin vaciarlo, elegir el mismo archivo otra vez no dispara onChange.
  const clearInput = () => { if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleCloseAndReset = () => {
    setSelectedFile(null);
    clearInput();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    onUpload(selectedFile);
    clearInput();
  };

  return (
    <Modal
      open={open}
      onClose={handleCloseAndReset}
      title={`Importar ${customers}`}
      footer={
        <>
          <Button variant="secondary" onClick={handleCloseAndReset}>{lastResult ? 'Cerrar' : 'Cancelar'}</Button>
          {!lastResult && (
            <Button icon={Upload} loading={uploading} disabled={!selectedFile} onClick={handleSubmit}>
              {uploading ? 'Subiendo...' : 'Subir archivo'}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {!lastResult ? (
          <>
            <p className="text-text-muted">Importa tu base de {customers} desde un archivo CSV o Excel.</p>
            <div className="space-y-2 rounded-control bg-primary-soft p-3">
              <p className="text-sm font-medium text-text">Columnas esperadas</p>
              <p className="text-sm text-text">
                <strong>nombre</strong> (nombre y apellido), <strong>celular</strong>, <strong>email</strong> y <strong>dni</strong> (opcional).
              </p>
              <Button variant="ghost" size="sm" icon={Download} onClick={downloadTemplate}>
                Descargar plantilla de ejemplo
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-32 w-full flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-border p-6 text-center transition-colors duration-200 hover:border-primary hover:bg-primary-soft motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {selectedFile ? (
                <>
                  <FileText size={24} aria-hidden className="text-primary" />
                  <span className="text-sm font-medium text-text">{selectedFile.name}</span>
                  <span className="text-xs text-text-muted">Toca para cambiar el archivo</span>
                </>
              ) : (
                <>
                  <Upload size={24} aria-hidden className="text-primary" />
                  <span className="text-sm font-medium text-text">Toca para elegir un archivo</span>
                  <span className="text-xs text-text-muted">CSV, XLSX o XLS · Máx. 10 MB</span>
                </>
              )}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div
              className={cn(
                'flex items-start gap-2 rounded-control p-3',
                lastResult.failedRows === 0 ? 'bg-success/10' : 'bg-secondary/20',
              )}
            >
              {lastResult.failedRows === 0
                ? <CheckCircle2 size={20} aria-hidden className="mt-0.5 shrink-0 text-success" />
                : <AlertTriangle size={20} aria-hidden className="mt-0.5 shrink-0 text-text" />}
              <div>
                <p className="text-sm font-medium text-text">
                  {lastResult.importedRows} de {lastResult.totalRows} {customers} importados
                </p>
                {lastResult.failedRows > 0 && (
                  <p className="text-sm text-text">{lastResult.failedRows} filas con errores</p>
                )}
              </div>
            </div>
            {lastResult.errorLog && lastResult.errorLog.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-control bg-background p-3">
                {lastResult.errorLog.slice(0, 10).map((err, i) => (
                  <li key={i} className="text-xs text-text-muted">Fila {err.row}: {err.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
