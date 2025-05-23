export type PaymentMethodType = 'pix' | 'credit_card' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  is_active: boolean;
  config: {
    instructions?: string;
    provider?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  selected_options: {
    optionId: string;
    variationIds: string[];
  }[];
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_method_id: string;
  payment_status: PaymentStatus;
  payment_details: {
    transaction_id?: string;
    payment_intent?: string;
    pix_code?: string;
    [key: string]: any;
  };
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  payment_method?: PaymentMethod;
} 