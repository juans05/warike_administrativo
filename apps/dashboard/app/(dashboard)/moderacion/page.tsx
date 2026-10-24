'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, businessApi } from '../../../lib/api-client';
import { toast } from 'sonner';
import { PageHeader, Skeleton, StatTile } from '../../../components/ui';
import { can, usePlatformPermissions } from '../../../lib/platform';
import { LoadingRows } from '../../../components/admin/Table';
import { ClaimsSection } from '../../../components/admin/moderacion/ClaimsSection';
import { PlacesSection } from '../../../components/admin/moderacion/PlacesSection';
import { RejectReasonModal } from '../../../components/admin/moderacion/RejectReasonModal';
import { SubmissionsSection } from '../../../components/admin/moderacion/SubmissionsSection';
import type { Place, PlaceClaim, PlaceSubmission, Verticals } from '../../../components/admin/moderacion/types';

const number = (n: unknown) => Number(n || 0).toLocaleString('es-PE');

export default function ModeracionPage() {
  // Comercial (locales.ver sin locales.gestionar): ve todo, sin botones de aprobar ni editar.
  const readOnly = !can(usePlatformPermissions(true), 'locales.gestionar');
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesTotal, setPlacesTotal] = useState(0);
  const [submissions, setSubmissions] = useState<PlaceSubmission[]>([]);
  const [claims, setClaims] = useState<PlaceClaim[]>([]);
  const [verticals, setVerticals] = useState<Verticals>([]);
  const [loading, setLoading] = useState(true);
  // Solo la primera carga reemplaza la página por el esqueleto; al buscar se conserva el buscador.
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [rejectSubmissionId, setRejectSubmissionId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [placesData, statsData, submissionsData, claimsData] = await Promise.all([
        adminApi.getPlaces(1, search),
        adminApi.getStats(),
        adminApi.getPendingSubmissions(),
        adminApi.getPendingClaims(),
      ]);
      setPlaces(placesData.data);
      setPlacesTotal(placesData.meta?.total ?? placesData.data.length);
      setStats(statsData);
      setSubmissions(submissionsData);
      setClaims(claimsData);
    } catch (err) {
      console.error('Error loading admin data:', err);
      toast.error(err instanceof Error ? err.message : 'Error cargando datos de moderación');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Rubros y tipos de negocio para el selector de cada local; si falla, el selector se oculta.
  useEffect(() => {
    businessApi.getBusinessTypes().then((res) => setVerticals(res.verticals)).catch(() => setVerticals([]));
  }, []);

  const toggleVerification = async (place: Place) => {
    try {
      await adminApi.updatePlace(place.id, { isVerified: !place.isVerified });
      loadData();
    } catch (err) {
      toast.error('Error actualizando verificación');
    }
  };

  const updateStatus = async (place: Place, status: string) => {
    try {
      await adminApi.updatePlace(place.id, { status });
      loadData();
    } catch (err) {
      toast.error('Error actualizando estado');
    }
  };

  // Si el nuevo tipo es de otro rubro, el backend le quita la categoría que no corresponde.
  const updateBusinessType = async (place: Place, businessType: string) => {
    try {
      await adminApi.setPlaceBusinessType(place.id, businessType);
      toast.success('Tipo de negocio actualizado');
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cambiar el tipo de negocio');
    }
  };

  const approveSubmission = async (id: string) => {
    try {
      await adminApi.approveSubmission(id);
      toast.success('Propuesta aprobada y publicada');
      loadData();
    } catch (err) {
      toast.error('Error aprobando la propuesta');
    }
  };

  const rejectSubmission = async (id: string, reason: string) => {
    try {
      await adminApi.rejectSubmission(id, reason);
      toast.success('Propuesta rechazada');
      setRejectSubmissionId(null);
      loadData();
    } catch (err) {
      toast.error('Error rechazando la propuesta');
    }
  };

  const verifyClaim = async (id: string) => {
    try {
      await adminApi.verifyClaim(id);
      toast.success('Negocio verificado');
      loadData();
    } catch (err) {
      toast.error('Error verificando el reclamo');
    }
  };

  const rejectClaim = async (id: string) => {
    try {
      await adminApi.rejectClaim(id);
      toast.success('Reclamo rechazado');
      loadData();
    } catch (err) {
      toast.error('Error rechazando el reclamo');
    }
  };

  const header = <PageHeader title="Moderación" subtitle="Revisa lo que llega y controla los locales registrados en la plataforma." />;

  if (!loaded) {
    return (
      <div className="space-y-6" aria-busy="true">
        {header}
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
        <LoadingRows rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Locales en la plataforma" value={number(stats?.overview?.totalPlaces)} />
        <StatTile label="Usuarios" value={number(stats?.overview?.totalUsers)} />
        <StatTile label="Check-ins" value={number(stats?.overview?.totalCheckins)} />
      </div>

      <SubmissionsSection submissions={submissions} onApprove={approveSubmission} onReject={setRejectSubmissionId} readOnly={readOnly} />
      <ClaimsSection claims={claims} onVerify={verifyClaim} onReject={rejectClaim} readOnly={readOnly} />
      <PlacesSection
        readOnly={readOnly}
        places={places}
        total={placesTotal}
        loading={loading}
        search={search}
        onSearch={setSearch}
        verticals={verticals}
        onToggleVerified={toggleVerification}
        onStatus={updateStatus}
        onBusinessType={updateBusinessType}
      />

      {rejectSubmissionId && (
        <RejectReasonModal
          title="Rechazar propuesta"
          onCancel={() => setRejectSubmissionId(null)}
          onConfirm={(reason) => rejectSubmission(rejectSubmissionId, reason)}
        />
      )}
    </div>
  );
}
