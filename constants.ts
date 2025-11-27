import { Flower } from './types';

export const INITIAL_FLOWERS: Flower[] = [
  {
    id: '1',
    name: 'Red Rose',
    price: 5.00,
    stock: 50,
    threshold: 10,
    shelfLifeDays: 7,
    addedAt: Date.now(),
    image: 'https://picsum.photos/200/200?random=1',
    description: 'Classic red rose, perfect for romantic occasions.'
  },
  {
    id: '2',
    name: 'White Lily',
    price: 7.50,
    stock: 30,
    threshold: 5,
    shelfLifeDays: 5,
    addedAt: Date.now() - (4 * 24 * 60 * 60 * 1000), // Added 4 days ago
    image: 'https://picsum.photos/200/200?random=2',
    description: 'Elegant white lily, symbols of purity.'
  },
  {
    id: '3',
    name: 'Sunflower',
    price: 4.00,
    stock: 12,
    threshold: 8,
    shelfLifeDays: 10,
    addedAt: Date.now(),
    image: 'https://picsum.photos/200/200?random=3',
    description: 'Bright and cheerful sunflower.'
  },
  {
    id: '4',
    name: 'Tulip Batch A',
    price: 3.50,
    stock: 3,
    threshold: 10,
    shelfLifeDays: 6,
    addedAt: Date.now() - (5 * 24 * 60 * 60 * 1000), // Near decay
    image: 'https://picsum.photos/200/200?random=4',
    description: 'Fresh spring tulips.'
  }
];

export const MOCK_USER = {
  username: 'zyrus',
  password: 'zyrus12345'
};
