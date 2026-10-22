'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { BookOpen, FileUp, Lightbulb, Trash2 } from 'lucide-react';
import { plural } from '../../../lib/modules';
import { Badge, Button, Card, DataList, EmptyState, Input, PageHeader, Tabs } from '../../../components/ui';
import { toast } from 'sonner';

export default function AIKnowledgeBasePage() {
  const { activePlaceId, activePlace } = useRestaurant();
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

  const catalog = (activePlace?.verticalConfig?.labels.catalog ?? 'Carta').toLowerCase();
  const customers = plural(activePlace?.verticalConfig?.labels.customer ?? 'Cliente').toLowerCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Base de IA"
        subtitle={isLoading
          ? `Indexa tu ${catalog}, preguntas frecuentes y políticas para entrenar al bot.`
          : `Indexa tu ${catalog}, preguntas frecuentes y políticas para entrenar al bot · ${knowledgeBases.length} ${knowledgeBases.length === 1 ? 'documento' : 'documentos'}.`}
      />

      <Card padding="lg" className="space-y-5">
        <h2 className="text-base font-semibold text-text">Añadir documento</h2>

        <Tabs
          tabs={[{ key: 'file', label: 'Archivo' }, { key: 'url', label: 'Página web' }]}
          value={inputMode}
          onChange={(key) => setInputMode(key as 'file' | 'url')}
          aria-label="Tipo de documento"
        />

        <Input
          label="Nombre del documento"
          placeholder="Ej: Menú Buffet 2026"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />

        {inputMode === 'file' ? (
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-text">Archivo</span>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`rounded-card border-2 border-dashed p-8 text-center transition-colors duration-200 motion-reduce:transition-none ${
                isDragging ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary'
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
                className="peer sr-only"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="block cursor-pointer rounded-control peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                <FileUp size={24} className="mx-auto mb-2 text-primary" aria-hidden />
                {selectedFile ? (
                  <>
                    <p className="text-sm font-semibold text-text">{selectedFile.name}</p>
                    <p className="mt-1 text-xs text-text-muted">Haz clic para cambiar el archivo</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text">Arrastra un archivo aquí o haz clic</p>
                    <p className="mt-1 text-xs text-text-muted">PDF, TXT, DOC, DOCX, JPG, PNG hasta 50MB</p>
                  </>
                )}
              </label>
            </div>
          </div>
        ) : (
          <Input
            label="URL del sitio web"
            type="url"
            placeholder="https://tunegocio.com/menu"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            hint="Leeremos el contenido de la página y lo convertiremos a texto automáticamente."
          />
        )}

        <Button
          icon={BookOpen}
          onClick={inputMode === 'file' ? handleUpload : handleIndexUrl}
          loading={isUploading}
          disabled={inputMode === 'file' ? (!selectedFile || !fileName) : (!urlInput || !fileName)}
          className="w-full"
        >
          {isUploading ? 'Procesando...' : 'Indexar documento'}
        </Button>
      </Card>

      <Card padding="lg">
        <h2 className="text-base font-semibold text-text">Documentos indexados</h2>
        <div className="mt-2">
          <DataList
            items={knowledgeBases}
            loading={isLoading}
            empty={
              <EmptyState
                icon={BookOpen}
                title="Sin documentos aún"
                description="Sube tu primer documento para entrenar al bot."
                headingLevel="h3"
              />
            }
            renderItem={(kb) => (
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-text">{kb.fileName}</h3>
                    <Badge tone="primary">{kb.chunkCount || 0} fragmentos</Badge>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">Indexado el {new Date(kb.createdAt).toLocaleDateString('es-PE')}</p>
                </div>
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(kb.id)}>Eliminar</Button>
              </div>
            )}
          />
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text">
          <Lightbulb size={20} className="text-primary" aria-hidden /> Cómo funciona
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-muted">
          <li><span className="font-medium text-text">{catalog.charAt(0).toUpperCase() + catalog.slice(1)}:</span> sube tu {catalog} en PDF, TXT, DOC o una foto (JPG/PNG) con lo que ofreces y sus precios.</li>
          <li><span className="font-medium text-text">Preguntas frecuentes:</span> incluye horarios, reservas, formas de pago, etc.</li>
          <li><span className="font-medium text-text">Procesamiento:</span> el documento se divide en fragmentos y se indexa automáticamente.</li>
          <li><span className="font-medium text-text">Respuestas:</span> el bot usará esto para responder las preguntas de tus {customers}.</li>
        </ul>
      </Card>
    </div>
  );
}
