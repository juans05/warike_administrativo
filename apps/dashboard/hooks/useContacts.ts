import { useState, useCallback } from 'react';
import { businessApi, Contact, ContactImport } from '../lib/api-client';
import { toast } from 'sonner';

/** `noun`: etiqueta del rubro para los avisos ("cliente"/"clientes", "paciente"/"pacientes"). */
export function useContacts(noun = { one: 'cliente', many: 'clientes' }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [imports, setImports] = useState<ContactImport[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<ContactImport | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadContacts = useCallback(async (placeId: string, page = 1, search = '') => {
    setLoadingContacts(true);
    try {
      const res = await businessApi.getContacts(placeId, page, search);
      setContacts(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, totalPages: 1 });
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const loadImports = useCallback(async (placeId: string) => {
    try {
      const res = await businessApi.getContactImports(placeId);
      setImports(res || []);
    } catch {
      setImports([]);
    }
  }, []);

  const handleUploadFile = async (placeId: string, file: File) => {
    setUploading(true);
    setLastImportResult(null);
    try {
      const result = await businessApi.uploadContacts(placeId, file);
      setLastImportResult(result);
      if (result.importedRows > 0) {
        toast.success(`${result.importedRows} ${result.importedRows === 1 ? `${noun.one} importado` : `${noun.many} importados`}${result.failedRows > 0 ? `, ${result.failedRows} fallidos` : ''}`);
      } else {
        toast.warning(`No se importó ningún ${noun.one}. Revisa el formato del archivo.`);
      }
      await Promise.all([loadContacts(placeId), loadImports(placeId)]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSync = async (placeId: string) => {
    setSyncing(true);
    try {
      const result = await businessApi.syncContacts(placeId);
      const total = result?.synced?.total ?? 0;
      if (total > 0) toast.success(`${total} contactos sincronizados desde WhatsApp y reseñas`);
      else toast.info('No hay contactos nuevos para sincronizar');
      await loadContacts(placeId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al sincronizar contactos');
    } finally {
      setSyncing(false);
    }
  };

  return {
    contacts,
    meta,
    imports,
    loadingContacts,
    showUploadModal,
    setShowUploadModal,
    uploading,
    lastImportResult,
    setLastImportResult,
    syncing,
    loadContacts,
    loadImports,
    handleUploadFile,
    handleSync,
  };
}
