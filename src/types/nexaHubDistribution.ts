/**
 * NexaHub Pro Data Models: Depo Air Minum RO & FMCG Dual-Type Distribution
 */

export type WaterProductSku = 'GALLON_RO_19L' | 'GALLON_19L' | 'CUP_240ML' | 'BOTTLE_600ML';
export type FmcgProductSku =
  | 'RICE_5KG'
  | 'EGGS_TRAY'
  | 'COOKING_OIL_2L'
  | 'SUGAR_1KG'
  | 'NOODLE_BOX'
  | 'COFFEE_STRIP'
  | 'DISHWASH_650ML'
  | 'DETERGENT_770G'
  | 'FLOORCLEAN_750ML';
export type DurableLogistikSku =
  | 'DISPENSER_BOTTOM'
  | 'PUMP_ELECTRIC'
  | 'GALLON_RACK'
  | 'SANITATION_PACK';
export type NexaProductSku = WaterProductSku | FmcgProductSku | DurableLogistikSku;

export interface NexaProductItem {
  sku: NexaProductSku;
  name: string;
  category: 'WATER_RO' | 'FMCG_SEMBAKO' | 'FMCG_HOMECARE' | 'NON_FMCG_LOGISTIK';
  unit: string;
  basePrice: number;
  partnerPrice: number;
  currentStock: number;
  description: string;
  batchNumber?: string;
  expiredDate?: string;
  uomLevels?: string[];
}

export type PartnerCategoryType = 'TOKO_WARUNG' | 'REFIL_MANDIRI';

export interface NexaPartnerProfile {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  partnerType: PartnerCategoryType;
  assignedSalesId?: string; // Opsional pada profil pelanggan sesuai spesifikasi
  assignedDriverId?: string;
  tenorDaysAllowed: number; // 7-14 hari untuk toko/warung mitra, 1-7 hari untuk refil konsumen mandiri
  creditLimit: number; // Plafon piutang (Rp)
  holdingEmptyGallonDebt: number; // Jumlah tabung galon depo tertahan
  maxGallonHoldingQuota: number; // Kuota tabung galon tertahan
  depositHeldAmount: number; // Uang jaminan deposit tabung (Rp)
  currentReceivableBalance: number; // Total piutang aktif
}

export type AgingBucketType = 'BUCKET_0_7_LANCAR' | 'BUCKET_8_14_JATUH_TEMPO' | 'BUCKET_GT14_MENUNGGAK';

export interface InvoiceTempoItem {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  partnerName: string;
  partnerType: PartnerCategoryType;
  assignedSalesId?: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  tenorDays: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  daysElapsed: number;
  bucket: AgingBucketType;
  status: 'LUNAS' | 'LANCAR' | 'JATUH_TEMPO' | 'MENUNGGAK';
  waterSummary: string;
  fmcgSummary: string;
  filledGallonsOut: number;
  emptyGallonsRetrieved: number;
}

export interface PhysicalGallonMovementRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  driverId: string;
  driverName: string;
  timestamp: string;
  filledOut: number; // Galon isi keluar ke toko
  emptyReturned: number; // Galon kosong ditarik ke mobil
  netShift: number; // filledOut - emptyReturned
  holdingBalanceAfter: number; // Saldo tabung tertahan setelah transaksi
  depositRatePerGallon: number;
  bottleCondition: 'BAGUS' | 'RETAK' | 'BOCOR';
  notes?: string;
}

export interface DriverRevisitPayload {
  partnerId: string;
  driverId: string;
  driverName: string;
  waterDrops: {
    sku: WaterProductSku;
    qty: number;
    unitPrice: number;
  }[];
  fmcgDrops: {
    sku: FmcgProductSku;
    qty: number;
    unitPrice: number;
  }[];
  emptyGallonRetrieved: number;
  previousInvoiceIdToSettle?: string;
  previousInvoicePaymentAmount?: number;
  newInvoicePaymentMethod: 'LUNAS_CASH' | 'LUNAS_QRIS' | 'TEMPO_BON';
  cashPaidForNewOrder?: number;
  notes?: string;
  proofPhotoUrl?: string;
}

export interface DriverRevisitResult {
  success: boolean;
  message: string;
  revisitTransactionId: string;
  newOrderTotal: number;
  previousPaymentRecorded: number;
  netCashCollected: number;
  netGallonShift: number;
  updatedPartnerHoldingGallons: number;
  updatedPartnerReceivable: number;
  createdInvoiceId?: string;
}

export interface AgingBucketSummary {
  bucket0_7: {
    label: string;
    totalAmount: number;
    invoiceCount: number;
    percentage: number;
  };
  bucket8_14: {
    label: string;
    totalAmount: number;
    invoiceCount: number;
    percentage: number;
  };
  bucketGt14: {
    label: string;
    totalAmount: number;
    invoiceCount: number;
    percentage: number;
  };
  totalReceivables: number;
  totalInvoices: number;
}

export interface PhysicalGallonInventorySummary {
  depoWarehouseStock: number; // Di gudang/depo siap isi & terisi
  onFleetVehicles: number; // Di atas bak truk & viar supir
  heldByPartners: number; // Tertahan di warung & toko mitra
  damagedOrScrapped: number; // Rusak/afkir
  totalPhysicalAssetCount: number; // Total konservasi aset tabung galon
}
