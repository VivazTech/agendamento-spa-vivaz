export type ServiceVariationMode = 'fixed' | 'duration' | 'service_type';

export interface PriceVariation {
  id: number;
  duration_minutes: number;
  price: number;
  display_order: number;
  variation_kind?: 'duration' | 'service_type';
  label?: string | null;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  /** Primeiro profissional vinculado (legado / compat.) */
  responsibleProfessionalId?: string | null;
  /** Nomes separados por vírgula para exibição */
  responsibleProfessionalName?: string | null;
  /** Profissionais vinculados ao serviço (leitura) */
  serviceProfessionals?: Array<{ id: string; name: string }>;
  /** IDs selecionados no admin ao salvar */
  professionalIds?: string[];
  // obrigatório: categoria do serviço (ID da categoria)
  category: number | null;
  // opcional: URL da imagem do serviço
  image_url?: string | null;
  /** fixed = preço único; duration = por tempo; service_type = por tipo (ex. curto/médio/longo) */
  variation_mode?: ServiceVariationMode | null;
  // opcional: variações de preço
  price_variations?: PriceVariation[];
  // opcional: variação selecionada (quando o serviço tem variações)
  selectedVariation?: PriceVariation | null;
}

export interface Client {
  name: string;
  phone: string;
  email: string;
  notes?: string;
  room_number?: string;
}

export interface Booking {
  services: Service[];
  date: Date;
  time: string;
  client: Client;
}
