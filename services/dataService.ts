import { Flower, Sale, Shift, Alert } from '../types';
import { INITIAL_FLOWERS } from '../constants';

const KEYS = {
  FLOWERS: 'bloompos_flowers',
  SALES: 'bloompos_sales',
  SHIFTS: 'bloompos_shifts',
  ALERTS: 'bloompos_alerts',
};

export const dataService = {
  getFlowers: (): Flower[] => {
    const stored = localStorage.getItem(KEYS.FLOWERS);
    return stored ? JSON.parse(stored) : INITIAL_FLOWERS;
  },
  saveFlowers: (flowers: Flower[]) => {
    localStorage.setItem(KEYS.FLOWERS, JSON.stringify(flowers));
  },
  getSales: (): Sale[] => {
    const stored = localStorage.getItem(KEYS.SALES);
    return stored ? JSON.parse(stored) : [];
  },
  saveSales: (sales: Sale[]) => {
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  },
  getShifts: (): Shift[] => {
    const stored = localStorage.getItem(KEYS.SHIFTS);
    return stored ? JSON.parse(stored) : [];
  },
  saveShifts: (shifts: Shift[]) => {
    localStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
  },
  getAlerts: (): Alert[] => {
    const stored = localStorage.getItem(KEYS.ALERTS);
    return stored ? JSON.parse(stored) : [];
  },
  saveAlerts: (alerts: Alert[]) => {
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
  }
};
