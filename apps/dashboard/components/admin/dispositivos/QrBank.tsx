'use client';

import React, { useState } from 'react';
import { Copy, Download, FileDown, FileSpreadsheet, History, Link2, PauseCircle, PlayCircle, Printer, QrCode, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { qrApi } from '../../../lib/api-client';
import { copyQrUrls, downloadNfcCsv, downloadPlaquePdf, downloadQrPng, openPrintSheet, TEMPLATES, TemplateId } from '../../../lib/qrImage';
import { Badge, Button, DataList, EmptyState, Input, Select, cn } from '../../ui';
import { SectionCard } from '../SectionCard';
import { STATUS_LABELS, STATUS_TONES } from './constants';
import { QrRowActions, type QrAction } from './QrRowActions';

/**
 * Banco de QR: filtros, selección múltiple y las acciones de cada código.
 * Lo que se descarga, copia o imprime en bloque son los marcados (entre los que se ven) o, si no hay ninguno, todos los filtrados.
 */
export function QrBank({ qrCodes, statusFilter, onStatusFilter, template, onTemplate, onReload, onAssign, onHistory }: {
  qrCodes: any[];
  statusFilter: string;
  onStatusFilter(status: string): void;
  /** La plantilla vive en la página porque también la usa el PDF del lote recién generado. */
  template: TemplateId;
  onTemplate(template: TemplateId): void;
  onReload(): void;
  onAssign(qrCode: any, mode: 'assign' | 'reassign'): void;
  onHistory(qrCode: any): void;
}) {
  const [personalize, setPersonalize] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredQr = search ? qrCodes.filter((q) => q.code.toLowerCase().includes(search.toLowerCase())) : qrCodes;
  const selectedVisible = filteredQr.filter((q) => selected.has(q.id));
  const targets = selectedVisible.length > 0 ? selectedVisible : filteredQr;
  const allVisibleSelected = filteredQr.length > 0 && selectedVisible.length === filteredQr.length;
  const suffix = selectedVisible.length > 0 ? ` (${selectedVisible.length})` : '';

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      filteredQr.forEach((q) => (allVisibleSelected ? next.delete(q.id) : next.add(q.id)));
      return next;
    });

  const handleDownload = async (qr: any) => {
    try {
      await downloadQrPng(qr, template);
    } catch {
      toast.error('Error generando la imagen del QR');
    }
  };

  const handleCopyUrl = async (qr: any) => {
    try {
      await copyQrUrls([qr]);
      toast.success('URL copiada');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const handleCopyAllUrls = async () => {
    if (targets.length === 0) return;
    try {
      await copyQrUrls(targets);
      toast.success(`${targets.length} URLs copiadas`);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const handleDownloadPdf = async () => {
    if (targets.length === 0) return;
    const toastId = toast.loading(`Generando PDF de ${targets.length} placas…`);
    try {
      const logoFailed = await downloadPlaquePdf(targets, template, personalize);
      toast.success('PDF descargado', { id: toastId });
      if (logoFailed.length > 0) {
        const names = logoFailed.length > 5 ? `${logoFailed.slice(0, 5).join(', ')} y ${logoFailed.length - 5} más` : logoFailed.join(', ');
        toast.warning(`${logoFailed.length} placa(s) salieron con el nombre en vez del logo porque no se pudo cargar: ${names}`, { duration: 15000 });
      }
    } catch {
      toast.error('No se pudo generar el PDF', { id: toastId });
    }
  };

  const handlePrintAll = async () => {
    if (targets.length === 0) return;
    try {
      await openPrintSheet(targets, template);
    } catch {
      toast.error('No se pudo generar la hoja imprimible');
    }
  };

  // suspend / activate / unassign comparten el mismo trato: avisar y recargar el banco.
  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast.success(success);
      onReload();
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    }
  };

  const actionsFor = (qr: any): QrAction[] => {
    const actions: QrAction[] = [
      { label: 'Copiar URL', icon: Copy, onClick: () => handleCopyUrl(qr) },
      { label: 'Descargar', icon: Download, onClick: () => handleDownload(qr) },
    ];
    if (qr.status === 'AVAILABLE') {
      actions.push({ label: 'Asignar', icon: Link2, onClick: () => onAssign(qr, 'assign') });
    }
    if (qr.status === 'ASSIGNED') {
      actions.push(
        { label: 'Reasignar', icon: Link2, onClick: () => onAssign(qr, 'reassign') },
        { label: 'Desasignar', icon: Unlink, onClick: () => run(() => qrApi.unassign(qr.id), 'QR desasignado, vuelve a estar disponible') },
      );
    }
    if (qr.status === 'SUSPENDED') {
      actions.push({ label: 'Activar', icon: PlayCircle, onClick: () => run(() => qrApi.activate(qr.id), 'QR reactivado') });
    } else if (qr.status !== 'DISABLED') {
      actions.push({ label: 'Suspender', icon: PauseCircle, onClick: () => run(() => qrApi.suspend(qr.id), 'QR suspendido') });
    }
    actions.push({ label: 'Historial', icon: History, onClick: () => onHistory(qr) });
    return actions;
  };

  return (
    <SectionCard
      title="Banco de QR"
      subtitle={`${filteredQr.length} códigos${selectedVisible.length > 0 ? ` · ${selectedVisible.length} seleccionados` : ''}`}
      action={
        selectedVisible.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpiar selección</Button>
        ) : undefined
      }
    >
      <div className="space-y-4 border-b border-border p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem] lg:grid-cols-[1fr_12rem_20rem]">
          <Input label="Buscar por código" type="search" placeholder="QR-000042" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select label="Estado" value={statusFilter} onChange={(e) => onStatusFilter(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <div className="sm:col-span-2 lg:col-span-1">
            <Select label="Plantilla de impresión" value={template} onChange={(e) => onTemplate(e.target.value as TemplateId)}>
              {Object.entries(TEMPLATES).map(([id, t]) => (
                <option key={id} value={id}>{t.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={FileDown} title="PDF para imprimir: 2 placas de 12×12 cm por hoja A4" onClick={handleDownloadPdf}>
            Descargar PDF{suffix}
          </Button>
          <Button size="sm" variant="secondary" icon={FileSpreadsheet} title="CSV con la URL de cada código, para grabar los chips NFC" onClick={() => downloadNfcCsv(targets)}>
            CSV para NFC{suffix}
          </Button>
          <Button size="sm" variant="secondary" icon={Copy} onClick={handleCopyAllUrls}>Copiar URLs{suffix}</Button>
          <Button size="sm" variant="secondary" icon={Printer} onClick={handlePrintAll}>Imprimir{suffix}</Button>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 pl-2 text-sm text-text md:min-h-9">
            <input type="checkbox" checked={personalize} onChange={(e) => setPersonalize(e.target.checked)} className="h-4 w-4 accent-primary" />
            Con logo del local
          </label>
        </div>
      </div>

      {filteredQr.length > 0 && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-border bg-background px-4 text-sm text-text-muted">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="h-4 w-4 accent-primary" />
          Seleccionar todos los que se ven ({filteredQr.length})
        </label>
      )}
      <DataList
        items={filteredQr}
        empty={
          <EmptyState
            icon={QrCode}
            headingLevel="h3"
            title={search || statusFilter ? 'Sin códigos con ese filtro' : 'Sin códigos QR aún'}
            description={search || statusFilter ? 'Prueba con otro código o estado.' : 'Genera el primer lote con el botón de arriba.'}
          />
        }
        renderItem={(qr) => (
          <div className={cn('flex items-start gap-3 px-4 py-3', selected.has(qr.id) && 'bg-primary-soft')}>
            <label className="-ml-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
              <input
                type="checkbox"
                checked={selected.has(qr.id)}
                onChange={() => toggleOne(qr.id)}
                aria-label={`Seleccionar ${qr.code}`}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-text">{qr.code}</span>
                <Badge tone={STATUS_TONES[qr.status] ?? 'neutral'}>{STATUS_LABELS[qr.status] ?? qr.status}</Badge>
              </div>
              <a
                href={`/q/${qr.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-xs text-text-muted hover:underline"
              >
                /q/{qr.token}
              </a>
              <p className="mt-0.5 text-sm text-text-muted">{qr.physicalType} · {qr.currentPlaceName || 'Sin asignar'}</p>
            </div>
            <QrRowActions actions={actionsFor(qr)} />
          </div>
        )}
      />
    </SectionCard>
  );
}
