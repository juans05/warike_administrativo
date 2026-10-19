export interface Complaint {
  id: string;
  folio: string;
  type: 'reclamo' | 'queja';
  status: 'pending' | 'resolved';
  consumerFullName: string;
  consumerDocumentType: string;
  consumerDocumentNumber: string;
  consumerEmail: string;
  consumerPhone: string | null;
  consumerAddress: string;
  contractedGood: string;
  claimedAmount: number | null;
  detail: string;
  consumerRequest: string;
  providerResponse: string | null;
  createdAt: string;
}

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE');
