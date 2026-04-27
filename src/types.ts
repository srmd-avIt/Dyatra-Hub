export type EventStatus = 'planned' | 'ongoing' | 'completed';
export type ChecklistCategory = 'planning' | 'data-sharing';
export type ChecklistStatus = 'pending' | 'in-progress' | 'completed';
export type RentalType = 'audio' | 'video';
export type RentalStatus = 'booked' | 'delivered' | 'returned';
export type MediaType = 'music' | 'video';

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string;
  status: EventStatus;
}

export interface LEDDetail {
  id: string;
  eventId: string;
  type: string;
  dimensions?: string;
  resolution?: string;
  setupDetails?: string;
  operator?: string;
}

export interface ChecklistItem {
  id: string;
  eventId: string;
  task: string;
  category: ChecklistCategory;
  status: ChecklistStatus;
  assignedTo?: string;
}

export interface RentalItem {
  id: string;
  eventId: string;
  type: RentalType;
  item: string;
  quantity: number;
  vendor?: string;
  cost?: number;
  status: RentalStatus;
}

export interface MediaItem {
  id: string;
  eventId: string;
  type: MediaType;
  title: string;
  url: string;
  duration?: string;
}

export interface Guidance {
  id: string;
  title: string;
  content: string;
  category?: string;
}
