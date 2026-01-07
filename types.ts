
export interface Service {
  id: number;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  // opcional: profissional responsável
  responsibleProfessionalId?: string | null;
  responsibleProfessionalName?: string | null;
  // obrigatório: categoria do serviço (ID da categoria)
  category: number | null;
  // opcional: URL da imagem do serviço
  image_url?: string | null;
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
