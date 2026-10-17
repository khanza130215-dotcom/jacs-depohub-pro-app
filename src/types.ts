export type ActiveMenu = 
  | 'dashboard'
  | 'order'
  | 'maps-pelanggan'
  | 'kasir'
  | 'piutang'
  | 'armada'
  | 'sirkulasi-galon'
  | 'master-data'
  | 'whatsapp'
  | 'hr'
  | 'admin-dokumen'
  | 'driver-mobile'
  | 'super-admin'
  | 'water_fmcg';

export type StoreMapStatus = 'active-order' | 'delivered-safe' | 'empty-debt';
export type StoreZone = 'Rayon Utara' | 'Rayon Selatan' | 'Residensial';

export interface StoreMapItem {
  id: string;
  name: string;
  ownerName: string;
  category: 'Pangkalan Agen' | 'Toko Grosir' | 'Rumah Tangga';
  phone: string;
  address: string;
  landmark: string;
  zone: StoreZone;
  x: number; // SVG canvas coordinate 0 - 100 (%)
  y: number; // SVG canvas coordinate 0 - 100 (%)
  status: StoreMapStatus;
  statusLabel: string;
  todayOrderQty?: number;
  regularQuota: number; // Kebutuhan rutin galon per kirim
  emptyGallonDebt: number; // Galon kosong depo yang tertahan
  currentReceivable: number; // Piutang jika ada
  lastOrderDate: string;
  lat: number;
  lng: number;
}

export interface MenuItem {
  id: ActiveMenu;
  label: string;
  subLabel?: string;
  category?: 'OPERASIONAL' | 'KEUANGAN';
  icon: string;
  color: string;
  bgColor: string;
  badge?: string;
}

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  trend: string;
  trendUp: boolean;
  icon: string;
  colorType: 'cyan' | 'emerald' | 'violet' | 'amber' | 'whatsapp' | 'sky' | 'indigo' | 'rose';
  isActiveNeon?: boolean;
}

export type CustomerType = 'B2C' | 'B2B';

export interface CustomerMasterItem {
  id: string;
  type: CustomerType;
  name: string; // Nama Pembeli / Nama Warga / Nama Toko
  ownerName?: string; // Khusus B2B
  phone: string;
  address: string;
  barcode?: string; // Barcode ID Kartu Member
  memberCode?: string; // Kode Member Khusus
  zone?: StoreZone;
  // B2C Specific
  clusterName?: string;
  blockNumber?: string;
  rtRw?: string;
  landmark?: string; // Titik Patokan
  // Pinpoint Maps & Dispatch integration
  landmarkNote?: string;
  coordinates?: { lat: number; lng: number };
  mapsUrl?: string;
  // B2B Specific
  idCardOrNpwp?: string;
  b2bCategory?: 'Agen / Pangkalan' | 'Toko Kelontong' | 'Resto / Cafe';
  priceTier?: 'Pangkalan' | 'Toko' | 'Eceran';
  creditLimit?: number; // Plafon piutang tempo (misal: Rp 5.000.000)
  assignedSalesId?: string; // Opsional pada profil pelanggan
  // History & Balances
  emptyGallonDebt?: number; // Hutang galon kosong
  currentReceivable?: number; // Sisa piutang tempo belum lunas
  lastTransactionDate?: string;
  lastTransactionAmount?: number;
}

export type GallonOwnershipScheme = 'Tukar Galon' | 'Beli Galon Baru' | 'Pinjam Galon Depo';
export type PriceTier = 'Pangkalan' | 'Toko' | 'Eceran';
export type OrderStatus =
  | 'Diproses'
  | 'Dalam Pengiriman'
  | 'Terkirim'
  | 'SELESAI'
  | 'MENUNGGU_DRIVER'
  | 'DIANTAR'
  | 'MENUNGGU_APPROVAL_ADMIN'
  | 'JADWAL_DROP_BERIKUTNYA';

export interface OrderItem {
  id: string;
  customerName: string;
  customerType: 'Agen / Pangkalan' | 'Toko Kelontong' | 'Rumah Tangga' | 'Resto / Cafe';
  residentialDetail?: string; // Blok / RT-RW / Patokan (khusus rumah tangga)
  gallonScheme: GallonOwnershipScheme; // Skema kepemilikan galon
  priceTier?: PriceTier; // Tier harga otomatis terkunci
  depositAmount?: number; // Nilai deposit jika Pinjam Galon Depo
  phone: string;
  items: string;
  totalGalon: number;
  emptyGallonsReturned?: number; // Galon kosong diserahkan kembali
  emptyGallonDebt?: number; // Hutang tabung galon kosong (jika serah kurang)
  gallonDebt?: number;
  hasCreditWarning?: boolean; // Peringatan ada nota tempo belum lunas
  creditWarning?: boolean;
  creditWarningNote?: string;
  totalAmount: number;
  paymentStatus: 'Lunas' | 'Tempo / Hutang' | 'Sebagian' | 'Belum Lunas';
  paymentMethod?: string;
  deliveryStatus: OrderStatus;
  status?: OrderStatus;
  driver: string;
  time: string;
  damagedItemsNote?: string;
  photoProof?: string;
  podRecipientName?: string;
  podCompletedTime?: string;
  isSpotSale?: boolean;
  // Pinpoint Maps & Open Dispatch properties
  mapsUrl?: string;
  coordinates?: { lat: number; lng: number };
  deliveryAddress?: string;
  landmarkNote?: string;
  assignedDriverId?: string | null;
  vehicleId?: string;
}

// Aliases for convenience in app components
export type Order = OrderItem;
export interface Transaction extends OrderItem {}

export interface SupplierMasterItem {
  id: string;
  name: string;
  phone: string;
  address: string;
  picName?: string;
}

// ==============================================================
// MULTI-PRODUCT DISTRIBUTOR HUB: KATEGORI INDUK & MULTI-UOM
// ==============================================================

export type ParentCategoryType =
  | 'AIR_MINUM'          // Lini Air & Minuman (Galon 19L, Botol, Cup, RO Curah)
  | 'FMCG_FOOD'          // FMCG Food & Sembako (Beras, Minyak, Telur, Gula, Mi Instan, Kopi/Teh)
  | 'FMCG_NON_FOOD'      // FMCG Non-Food / Homecare (Sabun, Deterjen, Kebersihan)
  | 'NON_FMCG_LOGISTIK'; // Non-FMCG / Logistik (Dispenser, Pompa Galon, Rak Galon, Perlengkapan Depo)

export type MultiUomType =
  | 'Pcs'
  | 'Karton/Dus'
  | 'Sak'
  | 'Renceng'
  | 'Pack'
  | 'Tray'
  | 'Tabung'
  | 'Jerigen'
  | 'Bal'
  | 'Unit'
  | 'Botol';

export interface ProductUomLevel {
  unit: MultiUomType;
  conversionRatio: number; // e.g. 1 Karton = 24 Pcs, 1 Bal = 10 Pack, 1 Renceng = 12 Pcs
  priceRetail: number;
  priceToko: number;
  pricePangkalan: number;
  barcode?: string;
  isDefault?: boolean;
}

export interface ProductMasterItem {
  id: string;
  sku?: string; // Kode Unik SKU Internal e.g. GLN-AQUA-19L, AST-TBG-AQUA, CUP-CLEO-220, BTL-VIT-600
  barcode?: string; // Barcode pabrik (EAN-13) atau kode unik internal untuk produk tanpa barcode fisik
  name: string;
  category: string; // Sub-kategori e.g. 'Galon 19L', 'Beras & Karungan', 'Minyak Goreng', etc.
  parentCategory?: ParentCategoryType; // Lini Air & Minuman | FMCG Food | FMCG Non-Food | Non-FMCG Logistik
  brand: string;
  stock: number;
  minStock: number; // Safety stock threshold
  reorderPoint: number;
  unit: string; // Base unit e.g. 'Tabung', 'Karton/Dus', 'Pcs', 'Pack'
  hpp: number; // Modal tebus pabrik
  pricingScheme?: 'tier' | 'flat'; // 'tier' (Multi-Tier) or 'flat' (Harga Tunggal)
  flatPrice?: number;
  pricePangkalan: number; // Grosir besar / Tier 1
  priceToko: number; // Toko kelontong / Tier 2
  priceRetail: number; // Eceran / Rumah tangga / Tier 3
  supplier: string;
  packagingSize?: string; // e.g. '19L Galon', 'Dus/Karton isi 24', 'Pouch 2L', etc.
  supplierContact?: string;
  supplierAddress?: string;
  lastPurchaseQty?: number;
  targetTier?: 'retail' | 'grosir';
  profitMarginPercent?: number;
  // Multi-UoM (Satuan Bertingkat)
  uomLevels?: ProductUomLevel[];
  selectedUom?: MultiUomType;
  // Batch No & Tanggal Expired untuk FMCG Consumable
  batchNumber?: string;
  expiredDate?: string; // YYYY-MM-DD
  isConsumable?: boolean;
  // E-Warning Stok & Ambang Toleransi Fleksibel
  warningMode?: 'percentage' | 'quantity'; // 'percentage' (% dari kapasitas maksimal) atau 'quantity' (unit minimum)
  maxCapacity?: number; // Kapasitas maksimal gudang (e.g. 500 Dus, 1000 Tabung)
  warningThresholdValue?: number; // Nilai ambang batas (misal 30% atau 100 pcs)
}

export interface PosCartItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  parentCategory?: ParentCategoryType;
  unit: string;
  selectedUom?: MultiUomType;
  uomMultiplier?: number;
  unitPrice: number;
  qty: number;
  subtotal: number;
  batchNumber?: string;
  expiredDate?: string;
  isGalonRefill?: boolean;
  gallonScheme?: 'Refill Tukar' | 'Beli Putus (+Rp 45.000)' | 'Pinjam Deposit (+Rp 35.000)';
  emptyGallonsReturned?: number;
  shortageResolution?: 'beli' | 'pinjam' | 'hutang';
  shortageFee?: number;
}

export interface KasirTransaction {
  id: string;
  customerName: string;
  customerType?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  items: string;
  totalAmount: number;
  subtotal?: number;
  discountAmount?: number;
  discountLabel?: string;
  ppnAmount?: number;
  cashReceived?: number;
  changeAmount?: number;
  paymentMethod: string;
  paymentStatus: 'Lunas' | 'Tempo / Hutang';
  time: string;
  timestamp: number;
  deliveryType?: 'pickup' | 'armada';
  cartItems?: PosCartItem[];
}

export interface DriverSetoranItem {
  driverId: string;
  driverName: string;
  vehicle: string;
  route: string;
  totalInvoices: number;
  targetCash: number;
  receivedCash: number;
  status: 'Lengkap' | 'Selisih' | 'Menunggu';
  handoverTime?: string;
}

// ==============================================================
// SIRKULASI WADAH & ASET KEMASAN (MULTI-CONTAINER ASSET)
// ==============================================================
export type ContainerAssetType =
  | 'TABUNG_GALON'   // Galon 19L (Aqua, Le Minerale, Cleo, Vit, RO)
  | 'KRAT_BOTOL'     // Krat Peti Botol (Teh Sosro, Coca-Cola 24 btl)
  | 'TABUNG_GAS'     // Tabung Gas LPG (Elpiji 3kg Melon, Bright Gas 5.5/12kg)
  | 'PALET_KEMASAN'; // Palet Gudang & Truk (Palet Plastik HDPE, Palet Kayu)

export interface GallonStock {
  id?: string;
  sku?: string;            // Kode Unik SKU Internal e.g. AST-TBG-AQUA, AST-KRT-SOSRO
  barcode?: string;        // Barcode scanner unik / EAN-13
  category: string;
  brand?: string;          // Merek Principal
  assetType?: ContainerAssetType;
  unitName?: string;       // 'Tabung', 'Krat', 'Palet'
  filled: number;          // Terisi di depo
  empty: number;           // Kosong di depo
  atStores: number;        // Tabung/Wadah di Toko / Agen / Pangkalan (B2B)
  loanedHousehold: number; // Tabung Dipinjam Rumah Tangga (Sistem Deposit B2C)
  soldOutright: number;    // Terjual Putus (Aset Milik Pelanggan)
  damaged: number;         // Tabung Rusak / Reject (Klaim Pabrik)
  capacity: number;        // Total kapasitas / Aset depo
}

export type ContainerStock = GallonStock;

// ==============================================================
// STRUK KUNJUNGAN TERINTEGRASI NEXAFIELD (MULTI-PRODUK + WADAH KOSONG)
// ==============================================================
export interface MultiProductDropItem {
  productId: string;
  name: string;
  parentCategory: ParentCategoryType;
  qty: number;
  uom: MultiUomType | string;
  unitPrice: number;
  subtotal: number;
  batchNumber?: string;
}

export interface ContainerMutationItem {
  assetType: ContainerAssetType;
  assetName: string;
  filledDropped: number; // Wadah isi diserahkan ke toko
  emptyRetrieved: number; // Wadah kosong ditarik kembali ke mobil
  netShift: number; // filledDropped - emptyRetrieved
  damagedReported?: number;
  unitName: string; // 'Tabung', 'Krat', 'Palet'
}

export interface IntegratedVisitReceipt {
  id: string;
  receiptNumber: string;
  timestamp: string;
  storeId: string;
  storeName: string;
  driverName: string;
  vehiclePlate?: string;
  status: 'Kunjungan' | 'Order Baru' | 'Follow Up Tagihan' | 'Drop Galon & Sembako';
  drops: MultiProductDropItem[];
  containerMutations: ContainerMutationItem[];
  dropAmountTotal: number;
  previousInvoiceSettled?: number;
  totalCashCollected: number;
  paymentMethod: 'Tunai' | 'Transfer / QRIS' | 'Tempo / Bon Toko';
  picSignatureName: string;
  photoProofUrl?: string;
  notes?: string;
}

export interface ArmadaItem {
  id: string;
  plateNumber: string;
  driverName: string;
  vehicleType: string;
  capacityGalon: number;
  currentLoad: number;
  status: 'Tersedia' | 'Sedang Jalan' | 'Bongkar Muat' | 'Servis';
  currentRoute: string;
  emptyGallonLoad?: number; // Tabung kosong yang ditarik/dibawa di armada (sirkulasi retur)
}

export interface ReceivableItem {
  id: string;
  orderId?: string;
  customerName: string;
  address: string;
  phone: string;
  amount: number;
  gallonsLoaned: number;
  dueDate: string;
  transactionDate?: string;
  status: 'Lewat Tempo' | 'Mendekati Tempo' | 'Aman' | 'BELUM LUNAS' | 'LUNAS';
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: string;
}

export interface CommissionSchemeConfig {
  gallonBaseRate: number; // default Rp 1.000 / galon 19L
  bottleBaseRate: number; // default Rp 500 / dus (Kemasan Karton/Dus Grosir Utuh, Bukan Per Botol Eceran)
  cupBaseRate: number;    // default Rp 300 / dus (Kemasan Karton/Dus Grosir Utuh, Bukan Per Cup Eceran)
  salesmanSharePercent: number; // default 25%
  courierSharePercent: number;  // default 75%
}

export type EmployeeRole =
  | 'Supir / Kurir Armada (Pengantar - 75%)'
  | 'Salesman / Penghubung (25%)'
  | 'Kernet Pengiriman'
  | 'Admin Kasir'
  | 'Staf Gudang & Tabung'
  | 'Supir Armada'
  | 'Kurir Motor Roda 3 (Viar)'
  | 'Salesman';

export interface EmployeeItem {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  nik?: string; // 16 digit KTP
  birthPlaceDate?: string; // Tempat & Tanggal Lahir
  address?: string; // Alamat KTP / Domisili
  emergencyContact?: string; // Kontak Darurat (Nama & No. HP)
  employmentStatus?: 'Tetap' | 'Kontrak' | 'Harian Lepas' | 'Probation';
  assignedArmada?: string; // Unit Armada yang dipegang
  driverLicenseNumber?: string; // Khusus Supir: No. SIM
  driverLicenseExpiry?: string; // Khusus Supir: Masa Berlaku SIM
  bankAccount?: string; // Rekening Bank penerima gaji/komisi
  attendanceStatus: 'Hadir' | 'Izin' | 'Sakit' | 'Libur';
  checkInTime?: string;
  totalTripsToday: number;
  totalGallonsDeliveredToday: number;
  // Volume rincian 3 kategori barang (Galon & Dus/Karton Grosir Utuh)
  deliveredGallons?: number; // Galon 19L (Tabung)
  deliveredBottles?: number; // Air Minum Kemasan Botol (Jumlah Karton / Dus)
  deliveredCups?: number;    // Air Minum Kemasan Gelas/Cup (Jumlah Karton / Dus)
  ratePerTripOrGallon: number;
  dailyCommission: number;
  baseSalaryDaily: number;
}

export interface FactoryDeliveryReceiptItem {
  productId: string;
  productName: string;
  totalReceived: number;
  goodCondition: number;
  damagedCondition: number;
  unit: string;
}

export interface FactoryDeliveryReceipt {
  id: string;
  doNumber: string;
  supplier: string;
  receivedDate: string;
  receiverStaff: string;
  checkerStaff: string;
  vehiclePlate: string;
  items: FactoryDeliveryReceiptItem[];
  emptyGallonsExchanged: number;
  emptyGallonNotes: string;
  status: 'Divalidasi & Masuk Stok' | 'Draft';
  createdAt: string;
}

export interface ReturnClaimItem {
  id: string;
  receiptId: string;
  doNumber: string;
  supplier: string;
  date: string;
  productName: string;
  damagedQty: number;
  defectReason: string;
  status: 'Menunggu Penggantian Pabrik' | 'Selesai Diganti' | 'Kredit Nota';
}

export interface SystemLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  category: 'Transaksi POS' | 'Piutang' | 'Master Data' | 'Surat Jalan' | 'Keamanan';
  details: string;
  ipAddress: string;
}

export interface UserAccessItem {
  id: string;
  username: string;
  fullName: string;
  role: 'Super Admin' | 'Kasir Depo' | 'Kepala Gudang' | 'Dispatch Armada';
  status: 'Aktif' | 'Nonaktif';
  lastLogin: string;
  permissions: string[];
}

export interface DriverCargoInventory {
  galonAqua: number;
  galonLeMinerale: number;
  galonCleo: number;
  dusBotolAqua600: number;
  dusBotolVit600: number;
  dusCupAqua220: number;
  dusCupCleo220: number;
  emptyGallonsCollected: number;
}

export interface DispatchAssignment {
  driverId: string;
  driverName: string;
  vehicleKey: 'carry' | 'granmax' | 'viar';
  vehicleName: string;
  vehiclePlate: string;
  armadaId: string;
  capacityInfo: string;
  priorityNote: string;
  currentLoadGallons: number;
  maxGallons: number;
  assignedAt: string;
  isLocked: boolean;
}

export interface NewCustomerOnTheRoadInput {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  landmark: string;
  category: 'Pangkalan Agen' | 'Toko Kelontong' | 'Rumah Tangga';
  zone: StoreZone;
  lat: number;
  lng: number;
  addToTodayRoute?: boolean;
  initialOrderQty?: number;
  initialProductType?: string;
  gallonScheme?: GallonOwnershipScheme;
}

export type StoreRegistrationStatus = 'MENUNGGU_KONFIRMASI_ADMIN' | 'DISETUJUI' | 'DITOLAK';

export interface StoreRegistrationSubmission {
  id: string;
  name: string; // Nama Toko / Outlet
  category: 'Toko Mitra' | 'Residensial';
  ownerName: string; // Nama Pemilik
  phone: string; // Nomor WhatsApp
  address: string; // Alamat Lengkap
  landmark: string; // Patokan (Landmark)
  coordinates?: { lat: number; lng: number }; // Koordinat GPS
  mapsUrl?: string; // Link Google Maps
  priceTier: 'Pangkalan' | 'Toko' | 'Eceran'; // Default Tier Harga
  submittedByDriverName: string;
  submittedAt: string;
  status: StoreRegistrationStatus;
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  poNumber: string;
  date: string;
  supplier: string;
  items: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    recommendedQty: number;
    orderQty: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }>;
  totalAmount: number;
  status: 'DRAFT' | 'DIKIRIM_KE_PABRIK' | 'DIKONFIRMASI_PABRIK' | 'SELESAI';
  etaNote?: string;
  notes?: string;
}

export interface InboundDropItem {
  id: string;
  sjNumber: string; // No Surat Jalan Pabrik
  supplier: string; // Nama Pabrik / Supplier
  date: string;
  time: string;
  driverName?: string;
  vehiclePlate?: string;
  filledGallonsIn: number; // Tabung Terisi Masuk
  emptyGallonsExchanged: number; // Tabung Kosong Disetor (Tukar Guling)
  dusKemasanIn: number; // Kemasan Dus
  itemsDescription: string;
  damagedGallons?: number;
  status: 'SELESAI_BONGKAR' | 'SEDANG_BONGKAR';
  picWarehouse: string;
}

export type PettyCashCategory = 
  | 'BBM Armada'
  | 'Uang Makan / Jalan Supir'
  | 'Pembelian Tisu / Segel Galon'
  | 'Tambal Ban & Servis Ringan'
  | 'Maintenance Mesin Cuci / Filter'
  | 'Operasional Depo Lainnya';

export interface PettyCashItem {
  id: string;
  date: string;
  time: string;
  category: PettyCashCategory;
  amount: number;
  description: string;
  recipientName: string;
  status: 'DISETUJUI' | 'MENUNGGU_PERSETUJUAN' | 'DITOLAK';
  approvedBy?: string;
  approvedAt?: string;
}

export * from './types/nexaHubDistribution';

