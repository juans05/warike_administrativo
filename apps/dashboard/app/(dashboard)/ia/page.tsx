'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { SkeletonHeader, SkeletonCard, SkeletonGrid } from '../../../components/SkeletonLoader';
import { toast } from 'sonner';

export default function AIKnowledgeBasePage() {
  const { activePlaceId } = useRestaurant();
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');

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
      const allowed = ['text/plain', 'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowed.includes(file.type)) {
        setSelectedFile(file);
        setFileName(file.name.replace(/\.[^/.]+$/, ''));
      } else {
        toast.warning('Formatos aceptados: PDF, TXT, DOC, DOCX, JPG, PNG, WEBP');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileName) {
      toast.warning('Selecciona un archivo y escribe el nombre');
      return;
    }
    setIsUploading(true);
    try {
      const res = await businessApi.uploadKnowledgeBase(activePlaceId, selectedFile, fileName);
      setKnowledgeBases([{ ...res, chunkCount: 0 }, ...knowledgeBases]);
      setSelectedFile(null);
      setFileName('');
      toast.success('Documento indexado correctamente');
    } catch (err) {
      toast.error('Error al subir documento');
    } finally {
      setIsUploading(false);
    }
  };

  const handleIndexUrl = async () => {
    if (!urlInput || !fileName) {
      toast.warning('Ingresa la URL y el nombre del documento');
      return;
    }
    setIsUploading(true);
    try {
      const res = await businessApi.indexKnowledgeBaseUrl(activePlaceId, urlInput, fileName);
      setKnowledgeBases([{ ...res, chunkCount: 0 }, ...knowledgeBases]);
      setUrlInput('');
      setFileName('');
      toast.success('URL indexada correctamente');
    } catch (err) {
      toast.error('Error al indexar la URL');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (kbId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await businessApi.deleteKnowledgeBase(kbId);
      setKnowledgeBases(knowledgeBases.filter(kb => kb.id !== kbId));
      toast.success('Documento eliminado');
    } catch (err) {
      toast.error('Error al eliminar documento');
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

        {/* Tab selector */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
          <button
            onClick={() => setInputMode('file')}
            className={`flex-1 py-2 rounded-xl font-black text-sm transition-all ${inputMode === 'file' ? 'bg-white shadow text-text' : 'text-text-muted'}`}
          >
            📄 Archivo
          </button>
          <button
            onClick={() => setInputMode('url')}
            className={`flex-1 py-2 rounded-xl font-black text-sm transition-all ${inputMode === 'url' ? 'bg-white shadow text-text' : 'text-text-muted'}`}
          >
            🔗 URL
          </button>
        </div>

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

        {inputMode === 'file' ? (
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">
              Archivo
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
                accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif"
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
                    <p className="text-xs text-text-muted mt-1">PDF, TXT, DOC, DOCX, JPG, PNG hasta 50MB</p>
                  </>
                )}
              </label>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              URL del sitio web
            </label>
            <input
              type="url"
              placeholder="https://turestaurante.com/menu"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-text-muted mt-2">El sistema leerá el contenido de la página y lo convertirá a Markdown automáticamente.</p>
          </div>
        )}

        <button
          onClick={inputMode === 'file' ? handleUpload : handleIndexUrl}
          disabled={isUploading || (inputMode === 'file' ? (!selectedFile || !fileName) : (!urlInput || !fileName))}
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
          <li>• <span className="font-bold">Menú:</span> Sube tu menú en PDF, TXT, DOC o una foto (JPG/PNG) con los platos y precios</li>
          <li>• <span className="font-bold">FAQs:</span> Incluye preguntas frecuentes sobre horarios, reservas, etc.</li>
          <li>• <span className="font-bold">Procesamiento:</span> El documento se divide en fragmentos y se indexa automáticamente</li>
          <li>• <span className="font-bold">Respuestas:</span> El bot usará esto para responder preguntas de los clientes</li>
        </ul>
      </div>
    </div>
  );
}
