// packages/types/carta.types.ts

export interface Restaurant {
  id: string;
  name: string;
  wuarike_place_id: string;
  currency: 'PEN' | 'USD';
  timezone: string;
  bot_persona: BotPersona;
  schedule: WeekSchedule;
  reservations: ReservationConfig;
}

export interface BotPersona {
  name: string;                          // ej: "Carlitos"
  tone: 'amigable' | 'formal' | 'divertido';
  language: 'es-PE' | 'es' | 'en';
  greeting: string;
}

export interface CartaItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  available: boolean;
  prep_time_minutes: number;
  is_chef_recommendation: boolean;
  chef_note?: string;
  tags: string[];
  allergens: string[];                   // ["pescado","gluten","lácteos"...]
  dietary: DietaryInfo;
  pairing: PairingInfo;
  variants: ItemVariant[];
  combo_ids: string[];
}

export interface DietaryInfo {
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_lactose_free: boolean;
  is_spicy: boolean;
  spice_level: 0 | 1 | 2 | 3;          // 0=no picante, 3=muy picante
}

export interface PairingInfo {
  drinks: string[];
  pairing_note?: string;
}

export interface ItemVariant {
  id: string;
  name: string;                          // ej: "Sin cebolla", "Extra picante"
  price_delta: number;                   // puede ser 0, positivo o negativo
}

export interface CartaCategory {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
  available: boolean;
}

export interface Combo {
  id: string;
  name: string;
  item_ids: string[];
  price: number;
  original_price: number;
  available_from: string;               // "12:00"
  available_until: string;              // "15:00"
}

export interface WeekSchedule {
  monday:    DaySchedule;
  tuesday:   DaySchedule;
  wednesday: DaySchedule;
  thursday:  DaySchedule;
  friday:    DaySchedule;
  saturday:  DaySchedule;
  sunday:    DaySchedule;
}

export interface DaySchedule {
  open: string;   // "12:00"
  close: string;  // "22:00"
  closed?: boolean;
}

export interface ReservationConfig {
  enabled: boolean;
  max_party_size: number;
  min_advance_hours: number;
  max_advance_days: number;
  slots: string[];                       // ["12:00","13:00","19:00","20:00"]
}
