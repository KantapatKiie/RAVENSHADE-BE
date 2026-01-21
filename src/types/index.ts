export type ReservationType = 'regular' | 'group' | 'private';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  reservation_type: ReservationType;
  special_requests?: string;
  status?: ReservationStatus;
  created_at?: Date;
  updated_at?: Date;
}

export interface Availability {
  id?: number;
  date: string;
  total_capacity: number;
  available_capacity: number;
  is_closed: boolean;
  notes?: string;
}

export interface TimeSlot {
  id?: number;
  time_slot: string;
  max_reservations: number;
  current_reservations?: number;
  is_active: boolean;
}
