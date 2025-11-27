export interface Flower {
  id: string;
  name: string;
  price: number;
  stock: number;
  threshold: number; // Low stock alert threshold
  shelfLifeDays: number;
  addedAt: number; // Timestamp of when batch was added
  image: string;
  description?: string;
}

export interface CartItem extends Flower {
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: number;
  shiftId: string;
}

export interface Shift {
  id: string;
  openedAt: number;
  closedAt: number | null;
  startCash: number;
  endCash: number | null;
  totalSales: number;
  salesCount: number;
  isOpen: boolean;
}

export interface Alert {
  id: string;
  type: 'low-stock' | 'decay' | 'info';
  message: string;
  flowerId?: string;
  timestamp: number;
  read: boolean;
}

export type ViewState = 'pos' | 'inventory' | 'shifts' | 'login';
