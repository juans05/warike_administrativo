import type { BusinessTypesResponse } from '../../../lib/api-client';

export type Verticals = BusinessTypesResponse['verticals'];

export interface Place {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  isVerified: boolean;
  /** Tipo de negocio (clave de GET /places/business-types). */
  businessType: string;
  category: { name: string } | null;
  district: { district: string } | null;
  createdAt: string;
}

export interface PlaceSubmission {
  id: string;
  name: string;
  district: string;
  address: string | null;
  coverImageUrl: string | null;
  category: { name: string } | null;
  submittedBy: { fullName: string; email: string } | null;
  createdAt: string;
}

export interface PlaceClaim {
  id: string;
  place: { name: string } | null;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  documentUrls: string[] | null;
  createdAt: string;
}
