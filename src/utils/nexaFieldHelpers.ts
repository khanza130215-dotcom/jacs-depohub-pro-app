import { CustomerMasterItem } from '../types';
import { calculateDistanceKm, DEFAULT_DEPO_MAKASSAR } from '../components/NexaFieldGpsMap';

export interface StoreNexaMetrics {
  id: string;
  name: string;
  ownerName?: string;
  address: string;
  phone: string;
  priceTier: string;
  lat: number;
  lng: number;
  distanceKm: number;
  maxStock: number;
  currentStock: number;
  stockPercent: number;
  ads: number; // Average Daily Sales (galon keluar/hari)
  runwayDays: number; // Sisa stok / ADS
  tempoBalance: number;
  statusCategory: 'critical' | 'warning' | 'safe';
  statusLabel: 'Butuh Pasokan' | 'Perlu Kunjungan' | 'Aman';
  waUrl: string;
  mapsUrl: string;
}

// Fallback Makassar coordinates
const DEFAULT_MAKASSAR_COORDS = [
  { lat: -5.142, lng: 119.438 },
  { lat: -5.155, lng: 119.441 },
  { lat: -5.138, lng: 119.426 },
  { lat: -5.161, lng: 119.435 },
  { lat: -5.145, lng: 119.445 },
  { lat: -5.150, lng: 119.421 },
  { lat: -5.1465, lng: 119.406 },
  { lat: -5.136, lng: 119.449 },
];

/**
 * Calculates ADS (Average Daily Sales), Runway (Days), Distance, and logistics status for a store
 */
export function calculateStoreNexaMetrics(
  store: CustomerMasterItem,
  index: number,
  driverCoords: { lat: number; lng: number } = DEFAULT_DEPO_MAKASSAR
): StoreNexaMetrics {
  let lat = store.coordinates?.lat;
  let lng = store.coordinates?.lng;

  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    const fallback = DEFAULT_MAKASSAR_COORDS[index % DEFAULT_MAKASSAR_COORDS.length];
    lat = fallback.lat;
    lng = fallback.lng;
  }

  const distanceKm = calculateDistanceKm(driverCoords.lat, driverCoords.lng, lat, lng);

  const priceTier = store.priceTier || 'Toko';
  const maxStock = priceTier === 'Pangkalan' ? 60 : 40;
  const debt = store.emptyGallonDebt || 0;
  const tempo = store.currentReceivable || 0;

  // Average Daily Sales (ADS): Pangkalan ~ 15 Gln/hari, Toko ~ 8 Gln/hari
  const ads = priceTier === 'Pangkalan' ? 15 : 8;

  // Current Stock estimate
  let currentStock: number;
  if (debt >= 25 || index === 0 || index === 2) {
    currentStock = Math.round(maxStock * 0.22); // ~13 Gln (critical)
  } else if (debt >= 10 || index === 5) {
    currentStock = Math.round(maxStock * 0.28); // ~17 Gln (critical)
  } else if (tempo > 0) {
    currentStock = Math.round(maxStock * 0.55); // ~22-33 Gln
  } else {
    currentStock = Math.round(maxStock * 0.85); // ~34-51 Gln (safe)
  }

  const stockPercent = Math.min(100, Math.max(0, Math.round((currentStock / maxStock) * 100)));
  const runwayDays = Math.round((currentStock / Math.max(1, ads)) * 10) / 10;

  // Logistics Status Category
  let statusCategory: 'critical' | 'warning' | 'safe';
  let statusLabel: 'Butuh Pasokan' | 'Perlu Kunjungan' | 'Aman';

  if (stockPercent <= 30 || runwayDays <= 2.0) {
    statusCategory = 'critical';
    statusLabel = 'Butuh Pasokan';
  } else if (tempo > 0) {
    statusCategory = 'warning';
    statusLabel = 'Perlu Kunjungan';
  } else {
    statusCategory = 'safe';
    statusLabel = 'Aman';
  }

  // Format WhatsApp Link
  const cleanPhone = (store.phone || '').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const greeting = `Halo ${store.ownerName || store.name}, kami dari Tim Armada Sales & Distribusi JacS DepoHub Pro. Berdasarkan monitoring sistem NexaField, estimasi sisa stok galon Anda sisa ${currentStock} galon (${runwayDays} hari). Apakah perlu kami jadwalkan pengiriman galon baru hari ini?`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(greeting)}`;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return {
    id: store.id,
    name: store.name,
    ownerName: store.ownerName,
    address: store.address,
    phone: store.phone,
    priceTier,
    lat,
    lng,
    distanceKm,
    maxStock,
    currentStock,
    stockPercent,
    ads,
    runwayDays,
    tempoBalance: tempo,
    statusCategory,
    statusLabel,
    waUrl,
    mapsUrl,
  };
}

import { IntegratedVisitReceipt } from '../types';

export interface VisitLogEntry {
  id: string;
  orderId?: string;
  storeId?: string;
  storeName: string;
  customerAddress: string;
  time: string;
  status: 'Kunjungan' | 'Order Baru' | 'Follow Up Tagihan' | 'Drop Galon' | 'Drop Galon & Sembako';
  galonIsiTurun: number;
  galonKosongTarik: number;
  notes: string;
  photoUrl?: string;
  driverName: string;
  // Multi-Product & Container Mutations
  dropsSummary?: string;
  totalDropAmount?: number;
  containerMutationsSummary?: string;
  totalCashCollected?: number;
  integratedReceipt?: IntegratedVisitReceipt;
}

export const INITIAL_VISIT_LOGS: VisitLogEntry[] = [
  {
    id: 'VISIT-001',
    orderId: 'ORD-7712',
    storeName: 'Pangkalan Berkah Sejahtera',
    customerAddress: 'Jl. AP Pettarani No. 88, Makassar',
    time: '08:45 WIB',
    status: 'Drop Galon',
    galonIsiTurun: 40,
    galonKosongTarik: 40,
    notes: 'Serah terima 40 galon Aqua 19L segel pabrik, tabung kosong ditarik 40 pcs lengkap.',
    driverName: 'Pak Bambang Sukoco',
  },
  {
    id: 'VISIT-002',
    orderId: 'ORD-7713',
    storeName: 'Toko Berkah Rezeki Bu Siti',
    customerAddress: 'Jl. Pengayoman No. 12, Panakkukang',
    time: '09:30 WIB',
    status: 'Follow Up Tagihan',
    galonIsiTurun: 0,
    galonKosongTarik: 5,
    notes: 'Follow up nota tempo Rp 1.125.000, pemilik toko konfirmasi pelunasan transfer hari ini.',
    driverName: 'Pak Bambang Sukoco',
  },
  {
    id: 'VISIT-003',
    storeName: 'Agen Tirta Celebes Pak Mamat',
    customerAddress: 'Jl. Dr. Ratulangi No. 56, Makassar',
    time: '10:15 WIB',
    status: 'Order Baru',
    galonIsiTurun: 25,
    galonKosongTarik: 25,
    notes: 'Kunjungan rutin, toko memesan tambahan 25 galon Le Minerale untuk akhir pekan.',
    driverName: 'Pak Bambang Sukoco',
  },
];

export interface DayPerformanceItem {
  day: string;
  date: string;
  gallons: number;
  omzet: number;
  trips: number;
  isToday?: boolean;
}

export const WEEKLY_PERFORMANCE_DATA: DayPerformanceItem[] = [
  { day: 'Sen', date: '01 Okt', gallons: 75, omzet: 1425000, trips: 1 },
  { day: 'Sel', date: '02 Okt', gallons: 90, omzet: 1710000, trips: 2 },
  { day: 'Rab', date: '03 Okt', gallons: 85, omzet: 1615000, trips: 1 },
  { day: 'Kam', date: '04 Okt', gallons: 110, omzet: 2090000, trips: 2 },
  { day: 'Jum', date: '05 Okt', gallons: 65, omzet: 1235000, trips: 1 },
  { day: 'Sab', date: '06 Okt', gallons: 120, omzet: 2280000, trips: 2 },
  { day: 'Min', date: '07 Okt', gallons: 80, omzet: 1520000, trips: 1, isToday: true },
];
