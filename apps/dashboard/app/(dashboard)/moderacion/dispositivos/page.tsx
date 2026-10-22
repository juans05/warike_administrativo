'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { adminApi, qrApi } from '../../../../lib/api-client';
import { downloadNfcCsv, downloadPlaquePdf, TemplateId } from '../../../../lib/qrImage';
import { toast } from 'sonner';
import { Button, PageHeader, Skeleton, StatTile } from '../../../../components/ui';
import { LoadingRows } from '../../../../components/admin/Table';
import { AssignModal } from '../../../../components/admin/dispositivos/AssignModal';
import { DeviceRequests } from '../../../../components/admin/dispositivos/DeviceRequests';
import { GenerateModal } from '../../../../components/admin/dispositivos/GenerateModal';
import { HistoryModal } from '../../../../components/admin/dispositivos/HistoryModal';
import { QrBank } from '../../../../components/admin/dispositivos/QrBank';
import type { PhysicalType } from '../../../../components/admin/dispositivos/constants';

export default function DispositivosPage() {
  const [places, setPlaces] = useState<any[]>([]);
  const [deviceRequests, setDeviceRequests] = useState<any[]>([]);
  // Solo la primera carga reemplaza la página por el esqueleto: así el banco conserva su selección al recargar.
  const [loaded, setLoaded] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [template, setTemplate] = useState<TemplateId>('plaque-google-colors');

  const [showGenerate, setShowGenerate] = useState(false);
  const [assignTarget, setAssignTarget] = useState<any>(null); // el QrCode que se está (re)asignando
  const [historyTarget, setHistoryTarget] = useState<any>(null); // { qrCode, history }

  useEffect(() => {
    loadData();
  }, []);

  // También corre al montar, así que cubre la primera carga del banco.
  useEffect(() => {
    loadQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadData = async () => {
    try {
      const placesRes = await adminApi.getPlaces(1, '');
      setPlaces(placesRes.data || []);
      const requestsRes = await adminApi.getDeviceRequests();
      setDeviceRequests(requestsRes || []);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Error cargando datos');
    } finally {
      setLoaded(true);
    }
  };

  const loadQr = async () => {
    try {
      const [statsRes, listRes] = await Promise.all([qrApi.getStats(), qrApi.list(statusFilter || undefined)]);
      setStats(statsRes);
      setQrCodes(listRes || []);
    } catch (err) {
      console.error('Error loading QR data:', err);
      toast.error('Error cargando el banco de QR');
    }
  };

  const placeName = (placeId: string) => places.find((p) => p.id === placeId)?.name || placeId;

  const handleRequestStatus = async (id: string, status: 'fulfilled' | 'rejected') => {
    try {
      await adminApi.updateDeviceRequestStatus(id, status);
      const requestsRes = await adminApi.getDeviceRequests();
      setDeviceRequests(requestsRes || []);
      toast.success('Pedido actualizado');
    } catch {
      toast.error('Error actualizando el pedido');
    }
  };

  const handleGenerate = async (count: number, physicalType: PhysicalType) => {
    // La placa 12×12 lleva "Toca" + "Escanea": el mismo PDF sirve para QR y NFC.
    try {
      const created = await qrApi.generateBatch(count, physicalType);
      toast.success(`${count} códigos generados`);
      setShowGenerate(false);
      loadQr();
      await downloadPlaquePdf(created, template);
      if (physicalType === 'NFC') downloadNfcCsv(created);
    } catch (err: any) {
      toast.error(err?.message || 'Error generando el lote');
    }
  };

  const openHistory = async (qrCode: any) => {
    try {
      const detail = await qrApi.getOne(qrCode.id);
      setHistoryTarget(detail);
    } catch (err: any) {
      toast.error(err?.message || 'Error cargando historial');
    }
  };

  const header = (
    <PageHeader
      title="Códigos QR"
      subtitle="Banco de QR: imprime, asigna, reasigna y desactiva los QR físicos de Wuarikes."
      action={<Button icon={Plus} onClick={() => setShowGenerate(true)}>Generar lote</Button>}
    />
  );

  if (!loaded) {
    return (
      <div className="space-y-6" aria-busy="true">
        {header}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
        <LoadingRows rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Total" value={stats.qrCodes.total.toLocaleString()} />
          <StatTile label="Disponibles" value={stats.qrCodes.available.toLocaleString()} />
          <StatTile label="Asignados" value={stats.qrCodes.assigned.toLocaleString()} />
          <StatTile label="Suspendidos" value={stats.qrCodes.suspended.toLocaleString()} />
          <StatTile label="Escaneos totales" value={stats.scans.total.toLocaleString()} />
          <StatTile label="Escaneos hoy" value={stats.scans.today.toLocaleString()} />
          <StatTile label="Escaneos este mes" value={stats.scans.month.toLocaleString()} />
        </div>
      )}

      <QrBank
        qrCodes={qrCodes}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        template={template}
        onTemplate={setTemplate}
        onReload={loadQr}
        onAssign={(qrCode, mode) => setAssignTarget({ qrCode, mode })}
        onHistory={openHistory}
      />

      <DeviceRequests requests={deviceRequests} placeName={placeName} onStatus={handleRequestStatus} />

      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onGenerate={handleGenerate} />}

      {assignTarget && (
        <AssignModal
          qrCode={assignTarget.qrCode}
          mode={assignTarget.mode}
          places={places}
          onClose={() => setAssignTarget(null)}
          onDone={() => {
            setAssignTarget(null);
            loadQr();
            loadData();
          }}
        />
      )}

      {historyTarget && <HistoryModal target={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </div>
  );
}
