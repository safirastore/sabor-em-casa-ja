export type ProductVariation = {
  id: string;
  name: string;
  price: number;
  selected?: boolean;
};

export type ProductOption = {
  id: string;
  product_id: string;
  title: string;
  required: boolean;
  variations: OptionVariation[];
  created_at?: string;
  updated_at?: string;
};

export type OptionVariation = {
  id: string;
  option_id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedOptions: Record<string, string[]>;
  selectedOptionsPrice?: number;
  totalPrice: number;
};

export type UserRole = 'customer' | 'admin';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone?: string;
};

export type StoreInfo = {
  name: string;
  description?: string;
  logo: string;
  banner: string;
  deliveryFee: number;
  minOrder: number;
  cuisineType: string;
};

export type OrderStatus = 'new' | 'preparing' | 'out_for_delivery' | 'completed' | 'cancelled';

export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions: Record<string, string[]>;
  totalPrice: number;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type FoodItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  popular?: boolean;
  vegetarian?: boolean;
  hasOptions?: boolean;
  category?: string;
};

// Supabase database types
export type ProductOptionDB = {
  id: string;
  product_id: string;
  title: string;
  required: boolean;
  created_at?: string;
  updated_at?: string;
  option_variations?: OptionVariationDB[];
};

export type OptionVariationDB = {
  id: string;
  option_id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
};

// Supabase Orders Database Type
export type OrderDB = {
  id: string;
  user_id: string;
  items: OrderItem[] | string; // Can be string when first received from database
  status: string; // Changed from OrderStatus to accept any string from the database
  total: number;
  delivery_fee: number;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  } | string; // Can be string when first received from database
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    phone: string;
    email: string;
  } | null | any; // Made more flexible to handle error states or unexpected formats
};

export type PaymentMethod = 'pix' | 'credit_card' | 'cash' | 'card_machine';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type OrderStatusHistory = {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
};

export type Banner = {
  id: string;
  store_id: string;
  title: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  position: number;
  created_at?: string;
  updated_at?: string;
};

export type StoreSettings = {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  business_hours: {
    [key: string]: {
      open: string;
      close: string;
      is_closed: boolean;
    };
  };
  delivery_settings: {
    delivery_fee: number;
    minimum_order: number;
    delivery_time: string;
    delivery_radius: number;
  };
  created_at?: string;
  updated_at?: string;
};
