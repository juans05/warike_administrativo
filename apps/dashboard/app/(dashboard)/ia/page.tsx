'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { SkeletonHeader, SkeletonCard, SkeletonGrid } from '../../../components/SkeletonLoader';

export default function AIKnowledgeBasePage() {
  const { activePlaceId } = useRestaurant();
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    businessApi.getKnowledgeBases(activePlaceId)
      .then(res => setKnowledgeBases(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (['text/plain', 'application/pdf'].includes(file.type)) {
        setSelectedFile(file);
        setFileName(file.name.replace(/\.[^/.]+$/, ''));
      } else {
        alert('Solo se aceptan archivos TXT y PDF');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileName) {
      alert('Selecciona un archivo y escribe el nombre');
      return;
    }
    setIsUploading(true);
    try {
      const res = await businessApi.uploadKnowledgeBase(activePlaceId, selectedFile, fileName);
      setKnowledgeBases([{ ...res, chunkCount: 0 }, ...knowledgeBases]);
      setSelectedFile(null);
      setFileName('');
      alert('Documento indexado correctamente');
    } catch (err) {
      alert('Error al subir documento');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (kbId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await businessApi.deleteKnowledgeBase(kbId);
      setKnowledgeBases(knowledgeBases.filter(kb => kb.id !== kbId));
      alert('Documento eliminado');
    } catch (err) {
      alert('Error al eliminar documento');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-10 pb-32">
        <SkeletonHeader />
        <SkeletonCard className="h-80" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded-lg w-1/4 animate-pulse"></div>
          <SkeletonGrid count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-text tracking-tight font-warike">Base de Inteligencia Artificial</h1>
        <p className="text-text-muted font-bold text-lg">Indexa tu menú, FAQs y políticas para entrenar el bot — {knowledgeBases.length} documentos.</p>
      </header>

      {/* Upload Form */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
        <h2 className="font-black text-text">Añadir Documento</h2>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
            Nombre del Documento
          </label>
          <input
            type="text"
            placeholder="Ej: Menú Buffet 2026"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">
            Archivo TXT o PDF
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
            }`}
          >
            <input
              type="file"
              accept=".txt,.pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0]);
                  setFileName(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                }
              }}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <p className="text-3xl mb-2">📄</p>
              {selectedFile ? (
                <>
                  <p className="font-black text-text">{selectedFile.name}</p>
                  <p className="text-xs text-text-muted mt-1">Click para cambiar archivo</p>
                </>
              ) : (
                <>
                  <p className="font-black text-text">Arrastra un archivo aquí o haz click</p>
                  <p className="text-xs text-text-muted mt-1">TXT o PDF hasta 50MB</p>
                </>
              )}
            </label>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={isUploading || !selectedFile || !fileName}
          className="w-full bg-primary text-white px-8 py-4 rounded-2xl font-black disabled:opacity-50 hover:scale-[1.02] transition-transform active:scale-95"
        >
          {isUploading ? '⏳ Procesando...' : '🧠 Indexar Documento'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        <h2 className="font-black text-text text-lg">Documentos Indexados</h2>
        {knowledgeBases.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-border text-center">
            <p className="text-4xl mb-4">📚</p>
            <p className="font-bold text-text-muted">Sin documentos aún</p>
            <p className="text-xs text-text-muted mt-2">Sube tu primer documento para entrenar el bot</p>
          </div>
        ) : (
          knowledgeBases.map(kb => (
            <div
              key={kb.id}
              className="bg-white p-6 rounded-[2rem] border border-border flex items-center justify-between hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-black text-text">{kb.fileName}</h3>
                  <span className="bg-primary/10 text-primary text-[9px] px-2 py-1 rounded-full font-black">
                    {kb.chunkCount || 0} fragmentos
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Indexado el {new Date(kb.createdAt).toLocaleDateString('es-PE')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(kb.id)}
                className="ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-xl font-black text-sm hover:bg-red-200 transition-all active:scale-95"
              >
                🗑️ Eliminar
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-[2.5rem] space-y-3">
        <p className="font-black text-blue-700">💡 Cómo funciona</p>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• <span className="font-bold">Menú:</span> Sube tu menú en PDF o TXT con los platos y precios</li>
          <li>• <span className="font-bold">FAQs:</span> Incluye preguntas frecuentes sobre horarios, reservas, etc.</li>
          <li>• <span className="font-bold">Procesamiento:</span> El documento se divide en fragmentos y se indexa automáticamente</li>
          <li>• <span className="font-bold">Respuestas:</span> El bot usará esto para responder preguntas de los clientes</li>
        </ul>
      </div>
    </div>
  );
}
