'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api-client';
import { SkeletonPage } from '../../../components/SkeletonLoader';
import { toast } from 'sonner';

interface Place {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  isVerified: boolean;
  category: { name: string };
  district: { district: string };
  createdAt: string;
}

interface PlaceSubmission {
  id: string;
  name: string;
  district: string;
  address: string | null;
  coverImageUrl: string | null;
  category: { name: string } | null;
  submittedBy: { fullName: string; email: string } | null;
  createdAt: string;
}

interface PlaceClaim {
  id: string;
  place: { name: string } | null;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  documentUrls: string[] | null;
  createdAt: string;
}

function documentName(url: string) {
  try {
    return decodeURIComponent(url.split('/').pop() || url);
  } catch {
    return url;
  }
}

function RejectReasonModal({ title, onCancel, onConfirm }: { title: string; onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-black text-[#1A1A1A] mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">Este motivo queda guardado y es obligatorio.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Ej: Local duplicado, ya existe en la plataforma."
          className="w-full bg-[#F7F8FA] rounded-2xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-50 resize-none"
        />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-5 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="px-5 py-3 rounded-2xl text-sm font-bold bg-red-50 text-red-600 disabled:opacity-40"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModeracionPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [submissions, setSubmissions] = useState<PlaceSubmission[]>([]);
  const [claims, setClaims] = useState<PlaceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [rejectSubmissionId, setRejectSubmissionId] = useState<string | null>(null);
  const [openDocsFor, setOpenDocsFor] = useState<string | null>(null);

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
      setStats(statsData);
      setSubmissions(submissionsData);
      setClaims(claimsData);
    } catch (err) {
      console.error('Error loading admin data:', err);
      toast.error(err instanceof Error ? err.message : 'Error cargando datos de moderación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const toggleVerification = async (id: string, current: boolean) => {
    try {
      await adminApi.updatePlace(id, { isVerified: !current });
      loadData();
    } catch (err) {
      toast.error('Error actualizando verificación');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminApi.updatePlace(id, { status });
      loadData();
    } catch (err) {
      toast.error('Error actualizando estado');
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

  if (loading && places.length === 0) return <SkeletonPage type="table" />;

  return (
    <div className="space-y-12 pb-20 max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Moderación del Sistema</h1>
        <p className="text-[#6B7280] font-medium max-w-lg">Control total sobre los wuarikes registrados en la plataforma.</p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Wuarikes</p>
          <p className="text-4xl font-black text-[#F26122]">{stats?.overview?.totalPlaces || 0}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Usuarios</p>
          <p className="text-4xl font-black text-[#1A1A1A]">{stats?.overview?.totalUsers || 0}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-ins</p>
          <p className="text-4xl font-black text-blue-600">{stats?.overview?.totalCheckins || 0}</p>
        </div>
      </div>

      {/* Propuestas pendientes */}
      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
        <div className="p-10 border-b border-gray-50">
          <h2 className="text-xl font-black text-[#1A1A1A]">Propuestas pendientes</h2>
          <p className="text-sm text-gray-500 mt-1">{submissions.length} restaurantes enviados por usuarios esperan revisión</p>
        </div>
        {submissions.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-bold">No hay propuestas pendientes 🎉</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-gray-100">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Local</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría / Distrito</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Enviado por</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        {s.coverImageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.coverImageUrl} alt="" className="w-11 h-11 rounded-xl object-cover border border-gray-100" />
                        )}
                        <div>
                          <p className="font-bold text-[#1A1A1A]">{s.name}</p>
                          {s.address && <p className="text-xs text-gray-400 font-medium">{s.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-bold text-gray-600">{s.category?.name || '—'}</p>
                      <p className="text-xs text-gray-400 font-medium">{s.district}</p>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-bold text-gray-700">{s.submittedBy?.fullName || '—'}</p>
                      <p className="text-xs text-gray-400 font-medium">{s.submittedBy?.email}</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approveSubmission(s.id)}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-green-50 text-green-600 hover:bg-green-100"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => setRejectSubmissionId(s.id)}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Reclamos pendientes */}
      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-both">
        <div className="p-10 border-b border-gray-50">
          <h2 className="text-xl font-black text-[#1A1A1A]">Reclamos de negocio pendientes</h2>
          <p className="text-sm text-gray-500 mt-1">{claims.length} dueños solicitan verificar la propiedad de un local</p>
        </div>
        {claims.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-bold">No hay reclamos pendientes 🎉</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-gray-100">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Local reclamado</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Negocio</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-6 font-bold text-[#1A1A1A]">{c.place?.name || '—'}</td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-bold text-gray-700">{c.businessName}</p>
                      <p className="text-xs text-gray-400 font-medium">{c.businessEmail} · {c.businessPhone}</p>
                      {c.documentUrls && c.documentUrls.length > 0 && (
                        <div className="relative mt-2 inline-block">
                          <button
                            onClick={() => setOpenDocsFor(openDocsFor === c.id ? null : c.id)}
                            className="text-xs font-bold text-[#F26122] hover:underline"
                          >
                            📎 {c.documentUrls.length} documento{c.documentUrls.length === 1 ? '' : 's'} adjunto{c.documentUrls.length === 1 ? '' : 's'}
                          </button>
                          {openDocsFor === c.id && (
                            <div className="absolute z-10 top-full left-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg p-2 min-w-[14rem]">
                              {c.documentUrls.map((url) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 truncate"
                                >
                                  📄 <span className="truncate">{documentName(url)}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => verifyClaim(c.id)}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-green-50 text-green-600 hover:bg-green-100"
                        >
                          Verificar
                        </button>
                        <button
                          onClick={() => rejectClaim(c.id)}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-xl font-black text-[#1A1A1A]">Gestionar Locales</h2>
          <div className="w-full md:w-96 relative">
             <input
              type="text"
              placeholder="Buscar warike..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F7F8FA] py-4 px-6 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-orange-50"
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría / Distrito</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Verificación</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {places.map((place) => (
                <tr key={place.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-6 font-bold text-[#1A1A1A]">{place.name}</td>
                  <td className="px-10 py-6">
                    <p className="text-sm font-bold text-gray-600">{place.category?.name}</p>
                    <p className="text-xs text-gray-400 font-medium">{place.district?.district}</p>
                  </td>
                  <td className="px-10 py-6">
                    <button
                      onClick={() => toggleVerification(place.id, place.isVerified)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${place.isVerified ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {place.isVerified ? '✓ Verificado' : 'No verificado'}
                    </button>
                  </td>
                  <td className="px-10 py-6">
                     <select
                      value={place.status}
                      onChange={(e) => updateStatus(place.id, e.target.value)}
                      className="bg-transparent font-bold text-sm outline-none cursor-pointer"
                     >
                       <option value="active">Activo</option>
                       <option value="inactive">Inactivo</option>
                       <option value="pending">Pendiente</option>
                     </select>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button
                      onClick={() => window.open(`https://wuarike.com/place/${place.id}`, '_blank')}
                      className="text-[#F26122] font-black text-xs underline"
                    >
                      Ver en App
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
