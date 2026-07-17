import { useState, useCallback } from 'react';
import { businessApi, Contact, ContactImport } from '../lib/api-client';
import { toast } from 'sonner';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [imports, setImports] = useState<ContactImport[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<ContactImport | null>(null);

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
        toast.success(`${result.importedRows} clientes importados${result.failedRows > 0 ? `, ${result.failedRows} fallidos` : ''}`);
      } else {
        toast.warning('No se importó ningún cliente. Revisa el formato del archivo.');
      }
      await Promise.all([loadContacts(placeId), loadImports(placeId)]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
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
    loadContacts,
    loadImports,
    handleUploadFile,
  };
}
