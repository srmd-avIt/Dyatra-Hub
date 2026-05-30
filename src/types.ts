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

export type EquipmentStatus = 'available' | 'checked-out' | 'in-repair' | 'retired';
export type MovementType = 'stock-in' | 'stock-out';

export interface EquipmentItem {
  _id?: string;
  id?: string;
  'Asset Tag': string;
  'Name': string;
  'Category': string;
  'Serial No'?: string;
  'Total Qty': number;
  'Available Qty': number;
  'Status': EquipmentStatus;
  'Location'?: string;
  'Purchase Date'?: string;
  'Warranty Expiry'?: string;
  'Notes'?: string;
  created_at?: string;
}

export interface EquipmentMovement {
  _id?: string;
  id?: string;
  'Date': string;
  'Equipment Name': string;
  'Asset Tag': string;
  'Movement Type': MovementType;
  'Qty': number;
  'Reason': string;
  'Linked Event'?: string;
  'Operator'?: string;
  'Notes'?: string;
  created_at?: string;
}
