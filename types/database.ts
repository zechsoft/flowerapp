export interface Retailer {
  id: string;
  phone: string;
  name: string;
  shop_name: string;
  location: string;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  created_at: string;
}

export interface Farmer {
  id: string;
  retailer_id: string;
  name: string;
  phone: string;
  farmer_code: string;
  photo_url?: string;
  outstanding_amount: number;
  last_payment_date?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  retailer_id: string;
  name: string;
  phone: string;
  customer_code: string;
  payment_type: 'daily' | 'on_demand';
  pending_dues: number;
  last_purchase_date?: string;
  created_at: string;
}

export interface FlowerType {
  id: string;
  retailer_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface DailySupply {
  id: string;
  retailer_id: string;
  farmer_id: string;
  flower_type_id: string;
  quantity: number;
  supply_date: string;
  notes?: string;
  notification_sent: boolean;
  created_at: string;
}

export interface FlowerPrice {
  id: string;
  retailer_id: string;
  flower_type_id: string;
  price_date: string;
  morning_price: number;
  afternoon_price: number;
  evening_price: number;
  created_at: string;
}

export interface CustomerPurchase {
  id: string;
  retailer_id: string;
  customer_id: string;
  flower_type_id: string;
  quantity: number;
  price_per_kg: number;
  total_amount: number;
  purchase_date: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
  payment_status: 'pending' | 'paid' | 'partial';
  created_at: string;
}

export interface Notification {
  id: string;
  retailer_id: string;
  recipient_type: 'farmer' | 'customer' | 'system';
  recipient_id?: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageLog {
  id: string;
  retailer_id: string;
  recipient_type: 'farmer' | 'customer';
  recipient_id: string;
  phone_number: string;
  message_type: 'sms' | 'whatsapp';
  message_content: string;
  delivery_status: 'sent' | 'delivered' | 'failed';
  sent_at: string;
}
