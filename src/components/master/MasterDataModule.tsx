import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ProductMasterItem,
  FactoryDeliveryReceipt,
  ReturnClaimItem,
  FactoryDeliveryReceiptItem,
  CustomerMasterItem,
  CommissionSchemeConfig,
  PriceTier,
  SupplierMasterItem,
  ParentCategoryType,
} from '../../types';
import { MASTER_PRODUCTS, SAMPLE_FACTORY_RECEIPTS, SAMPLE_RETURN_CLAIMS, CUSTOMER_MASTER, DEFAULT_COMMISSION_CONFIG } from '../../data/mockData';
import { ProductModal } from '../ProductModal';
import { CustomerModal } from '../CustomerModal';
import { calculateStockWarning } from '../../utils/stockWarning';
import { syncProductStockToGas } from '../../utils/cloudSync';
import {
  Barcode,
  Scan,
  Plus,
  Truck,
  Check,
  Save,
  RefreshCw,
  X,
  Building2,
  Phone,
  MapPin,
  Sparkles,
  DollarSign,
  ArrowRight,
  Package,
  Layers,
  Percent,
  Calculator,
  Search,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type MasterCustomerTier = 'Retail / Ecer' | 'Member' | 'Grosir / Toko';

export interface CustomerMasterItemEnhanced extends CustomerMasterItem {
  businessName?: string;
  memberCode?: string;
  kasirTier?: MasterCustomerTier;
}

export const DEFAULT_MASTER_SUPPLIERS: SupplierMasterItem[] = [
  {
    id: 'SUP-01',
    name: 'Pabrik Danone Subang',
    phone: '081122334455',
    address: 'PT Tirta Investama, Kawasan Industri Subang, Jawa Barat',
    picName: 'Pak Hendra (Sales Area Subang)',
  },
  {
    id: 'SUP-02',
    name: 'Depo Mayora Distribusi',
    phone: '081399887766',
    address: 'PT Tirta Fresindo Jaya, Pasuruan & Ciawi',
    picName: 'Ibu Rina (Key Account Mayora)',
  },
  {
    id: 'SUP-03',
    name: 'PT Sariguna Primatirta',
    phone: '081255443322',
    address: 'Kawasan Industri Surya Cipta, Karawang',
    picName: 'Bpk. Aris (Cleo Logistics)',
  },
  {
    id: 'SUP-04',
    name: 'Danone Vit Depo',
    phone: '081288776655',
    address: 'Depo Distribusi Vit Jawa Barat',
    picName: 'Pak Agus (Vit Spv)',
  },
  {
    id: 'SUP-05',
    name: 'Distributor Perlengkapan & Sanitasi',
    phone: '081233445566',
    address: 'Sentra Grosir Aksesoris Galon & Tisu Higienis, Bandung',
    picName: 'Ko David',
  },
];

export type PackagingSizeFormat =
  | '19L Galon'
  | '330ml Mini'
  | '600ml Sedang'
  | '1500ml Besar'
  | 'Cup Gelas 220ml'
  | 'Dus/Karton isi 24/48'
  | 'Sak 5kg'
  | 'Sak 10kg'
  | 'Sak 25kg'
  | 'Pouch 1L'
  | 'Pouch 2L'
  | 'Tray 30 Butir'
  | 'Dus isi 24'
  | 'Dus isi 48'
  | 'Pouch / Botol 500ml'
  | 'Jerigen 5L'
  | 'Renceng 12 Pcs'
  | 'Pack isi 10'
  | 'Unit Box'
  | 'Set / Rak'
  | 'Pcs';

export type QuickInputCategoryTab = 'AIR_MINUM' | 'FMCG_SEMBAKO' | 'HOMECARE' | 'NON_FMCG';

export interface MasterDataModuleProps {
  products?: ProductMasterItem[];
  onAddProduct?: (newProduct: ProductMasterItem) => void;
  onUpdateProducts?: (updatedProducts: ProductMasterItem[]) => void;
  customers?: CustomerMasterItem[];
  onAddCustomer?: (newCustomer: CustomerMasterItem, andAddToMap?: boolean) => void;
  commissionConfig?: CommissionSchemeConfig;
  onUpdateCommissionConfig?: (newConfig: CommissionSchemeConfig) => void;
}

export const MasterDataModule: React.FC<MasterDataModuleProps> = ({
  products: propProducts,
  onAddProduct,
  onUpdateProducts,
  customers: propCustomers = CUSTOMER_MASTER,
  onAddCustomer,
  commissionConfig = DEFAULT_COMMISSION_CONFIG,
  onUpdateCommissionConfig,
}) => {
  // Products state
  const [products, setProducts] = useState<ProductMasterItem[]>(propProducts || MASTER_PRODUCTS);
  const [editingProduct, setEditingProduct] = useState<ProductMasterItem | null>(null);

  // Sync prop products
  useEffect(() => {
    if (propProducts) {
      setProducts(propProducts);
    }
  }, [propProducts]);

  // Main Tabs
  type MainTab = 'produk' | 'kategori' | 'merek' | 'supplier' | 'pelanggan' | 'riwayat-do' | 'klaim-retur' | 'komisi';
  const [activeTab, setActiveTab] = useState<MainTab>('produk');

  // Sub-tabs in [📦 Produk & SKU]
  type ProductSubTab = 'semua' | 'retail' | 'wholesaler';
  const [productSubTab, setProductSubTab] = useState<ProductSubTab>('semua');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [productSearch, setProductSearch] = useState<string>('');

  // -------------------------------------------------------------------------
  // MASTER SUPPLIERS STATE (WITH LOCALSTORAGE PERSISTENCE)
  // -------------------------------------------------------------------------
  const [masterSuppliers, setMasterSuppliers] = useState<SupplierMasterItem[]>(() => {
    try {
      const saved = localStorage.getItem('jacs_master_suppliers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MASTER_SUPPLIERS;
  });

  // Modal State Tambah Supplier Baru
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('08');
  const [newSupAddress, setNewSupAddress] = useState('');
  const [newSupPic, setNewSupPic] = useState('');

  // -------------------------------------------------------------------------
  // BARCODE QUICK INTAKE & SEQUENTIAL STEP FOCUS STATES
  // -------------------------------------------------------------------------
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'detected_existing' | 'detected_new'>('idle');
  const [detectedProduct, setDetectedProduct] = useState<ProductMasterItem | null>(null);

  // Barcode quick intake collapsible toggle state
  const [isQuickInputExpanded, setIsQuickInputExpanded] = useState<boolean>(true);
  const [quickCategoryTab, setQuickCategoryTab] = useState<QuickInputCategoryTab>('AIR_MINUM');

  // Form Fields
  const [intakeSku, setIntakeSku] = useState<string>(`PRD-${String((propProducts || MASTER_PRODUCTS).length + 1).padStart(2, '0')}`);
  const [intakeName, setIntakeName] = useState<string>('');
  const [intakeBrand, setIntakeBrand] = useState<string>('Danone Aqua');
  const [intakeCategory, setIntakeCategory] = useState<string>('Galon 19L');
  const [intakeUnit, setIntakeUnit] = useState<string>('Tabung / Galon');

  // a. Supplier Pabrik
  const [intakeSupplier, setIntakeSupplier] = useState<string>('Pabrik Danone Subang');

  // b. Jumlah Pembelian (Qty Restock Masuk)
  const [intakeQty, setIntakeQty] = useState<number>(50);

  // c. Update Ukuran & Kemasan
  const [intakePackaging, setIntakePackaging] = useState<string>('');

  // d. Tier HPP (Pilihan Retail vs Grosir)
  const [intakeTargetTier, setIntakeTargetTier] = useState<'retail' | 'grosir'>('retail');
  const [intakeHpp, setIntakeHpp] = useState<number>(15200);

  // e. Kalkulator Persentase Margin Otomatis (Memunculkan Harga Jual)
  const [intakeMarginPercent, setIntakeMarginPercent] = useState<number>(25);
  const [intakePriceRetail, setIntakePriceRetail] = useState<number>(21000);
  const [intakePriceToko, setIntakePriceToko] = useState<number>(19500);
  const [intakePricePangkalan, setIntakePricePangkalan] = useState<number>(18500);

  // Syncing state
  const [isSyncingGas, setIsSyncingGas] = useState<boolean>(false);

  // Sequential Step Focus Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const supplierSelectRef = useRef<HTMLSelectElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const packagingSelectRef = useRef<HTMLSelectElement>(null);
  const hppInputRef = useRef<HTMLInputElement>(null);
  const marginInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Customer Management Enhanced State
  const [customers, setCustomers] = useState<CustomerMasterItemEnhanced[]>(() => {
    return (propCustomers || CUSTOMER_MASTER).map((c, index) => {
      // Map initial business name and tier
      let businessName = '-';
      let kasirTier: MasterCustomerTier = 'Retail / Ecer';

      if (c.type === 'B2B') {
        businessName = c.name;
        if (c.b2bCategory === 'Agen / Pangkalan' || c.priceTier === 'Pangkalan') {
          kasirTier = 'Grosir / Toko';
        } else {
          kasirTier = 'Grosir / Toko';
        }
      } else {
        if (c.priceTier === 'Toko') {
          kasirTier = 'Member';
          businessName = 'Member Residensial';
        } else {
          kasirTier = 'Retail / Ecer';
          businessName = 'Non-Toko / Personal';
        }
      }

      return {
        ...c,
        businessName: (c as any).businessName || businessName,
        memberCode: (c as any).memberCode || `MBR-${String(index + 1).padStart(3, '0')}`,
        kasirTier: (c as any).kasirTier || kasirTier,
      };
    });
  });

  // Sync if propCustomers changes
  useEffect(() => {
    if (propCustomers) {
      setCustomers((prev) => {
        return propCustomers.map((c, index) => {
          const existing = prev.find((p) => p.id === c.id);
          if (existing) {
            return {
              ...c,
              businessName: existing.businessName,
              memberCode: existing.memberCode,
              kasirTier: existing.kasirTier,
            };
          }
          let businessName = '-';
          let kasirTier: MasterCustomerTier = 'Retail / Ecer';
          if (c.type === 'B2B') {
            businessName = c.name;
            kasirTier = 'Grosir / Toko';
          } else {
            businessName = 'Non-Toko / Personal';
            kasirTier = 'Retail / Ecer';
          }
          return {
            ...c,
            businessName,
            memberCode: `MBR-${String(index + 1).padStart(3, '0')}`,
            kasirTier,
          };
        });
      });
    }
  }, [propCustomers]);

  // Customer Filter & Search
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customerTierFilter, setCustomerTierFilter] = useState<string>('Semua');

  // Customer Add Form Modal State
  const [isAddCustomerFormOpen, setIsAddCustomerFormOpen] = useState(false);
  const [newCustPic, setNewCustPic] = useState('');
  const [newCustBusiness, setNewCustBusiness] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('08');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustTier, setNewCustTier] = useState<MasterCustomerTier>('Grosir / Toko');

  // Skema Komisi State
  const [localCommission, setLocalCommission] = useState<CommissionSchemeConfig>(commissionConfig);
  const [simGallon, setSimGallon] = useState<number>(25);
  const [simBottle, setSimBottle] = useState<number>(10);
  const [simCup, setSimCup] = useState<number>(15);

  useEffect(() => {
    if (commissionConfig) {
      setLocalCommission(commissionConfig);
    }
  }, [commissionConfig]);

  // Factory Delivery & Return Claims State
  const [receipts, setReceipts] = useState<FactoryDeliveryReceipt[]>(SAMPLE_FACTORY_RECEIPTS);
  const [returnClaims, setReturnClaims] = useState<ReturnClaimItem[]>(SAMPLE_RETURN_CLAIMS);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // DO Form State
  const [doNumber, setDoNumber] = useState(`DO/TI-SBG/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplier, setSupplier] = useState('Danone Aqua Subang (PT Tirta Investama)');
  const [receivedDate, setReceivedDate] = useState(`${new Date().toISOString().slice(0, 10)} 09:30 WIB`);
  const [vehiclePlate, setVehiclePlate] = useState('B 9281 TDA (Tronton Pabrik)');
  const [receiverStaff, setReceiverStaff] = useState('Joko Prabowo (Kepala Gudang)');
  const [checkerStaff, setCheckerStaff] = useState('Agus Santoso (Checker Gudang)');
  const [emptyGallonsExchanged, setEmptyGallonsExchanged] = useState<number>(350);
  const [emptyGallonNotes, setEmptyGallonNotes] = useState('Tukar 1:1 Sesuai DO Pabrik (350 tabung kosong depo dibawa balik truk)');
  const [receiptItems, setReceiptItems] = useState<(FactoryDeliveryReceiptItem & { defectReason?: string })[]>([
    {
      productId: 'PRD-01',
      productName: 'Aqua Galon 19L Segel QR Code',
      totalReceived: 350,
      goodCondition: 348,
      damagedCondition: 2,
      unit: 'Tabung',
      defectReason: 'Leher galon bocor mikro & rembes segel pabrik',
    },
    {
      productId: 'PRD-06',
      productName: 'Aqua Botol 330ml Mini (1 Dus isi 24)',
      totalReceived: 50,
      goodCondition: 50,
      damagedCondition: 0,
      unit: 'Dus',
      defectReason: '',
    },
  ]);

  // ==========================================
  // OPTIMISASI USEMEMO (ANTI-LAG ZERO FREEZE)
  // ==========================================
  const totalHppValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.hpp * p.stock, 0);
  }, [products]);

  const totalRetailValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.priceToko * p.stock, 0);
  }, [products]);

  const stockWarningDetails = useMemo(() => {
    return products.map(calculateStockWarning);
  }, [products]);

  const criticalStockCount = useMemo(() => {
    return stockWarningDetails.filter((d) => d.isCritical).length;
  }, [stockWarningDetails]);

  const warningStockCount = useMemo(() => {
    return stockWarningDetails.filter((d) => d.isWarning).length;
  }, [stockWarningDetails]);

  // Filtered products with instant lookup and memoization
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Sub-tab filter (Retail vs Wholesaler)
      if (productSubTab === 'retail') {
        const isRetail = p.pricingScheme === 'flat' || p.priceRetail <= p.priceToko * 1.25;
        if (!isRetail && p.category.toLowerCase().includes('aksesoris')) return false;
      } else if (productSubTab === 'wholesaler') {
        // Wholesaler focus: bulk gallons & karton/dus
        const isBulk = p.category.toLowerCase().includes('galon') || p.category.toLowerCase().includes('dus') || p.category.toLowerCase().includes('karton') || p.pricePangkalan > 0;
        if (!isBulk) return false;
      }

      // 2. Category filter
      if (filterCategory !== 'Semua') {
        if (filterCategory === 'AIR_MINUM' && p.parentCategory !== 'AIR_MINUM') return false;
        if (filterCategory === 'FMCG_FOOD' && p.parentCategory !== 'FMCG_FOOD') return false;
        if (filterCategory === 'FMCG_NON_FOOD' && p.parentCategory !== 'FMCG_NON_FOOD') return false;
        if (filterCategory === 'NON_FMCG_LOGISTIK' && p.parentCategory !== 'NON_FMCG_LOGISTIK') return false;

        const cat = p.category.toLowerCase();
        if (filterCategory === 'Galon 19L' && !cat.includes('galon')) return false;
        if (filterCategory === 'Kemasan Botol / Dus' && !(cat.includes('botol') || cat.includes('dus') || cat.includes('karton'))) return false;
        if (filterCategory === 'Kemasan Gelas / Cup' && !(cat.includes('cup') || cat.includes('gelas'))) return false;
        if (filterCategory === 'Sembako & Beras' && !(cat.includes('beras') || cat.includes('minyak') || cat.includes('telur') || cat.includes('gula') || cat.includes('mi'))) return false;
        if (filterCategory === 'Homecare & Sabun' && !(cat.includes('sabun') || cat.includes('deterjen') || cat.includes('lantai'))) return false;
        if (filterCategory === 'Aksesoris & Peralatan' && !(cat.includes('aksesoris') || cat.includes('alat') || cat.includes('peralatan') || cat.includes('pompa') || cat.includes('rak'))) return false;
        if (filterCategory === 'Sanitasi & Tisu' && !(cat.includes('sanitasi') || cat.includes('tisu') || cat.includes('segel'))) return false;
      }

      // 3. Search filter
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [products, productSubTab, filterCategory, productSearch]);

  // Derived Categories (Auto-populated from products - no manual add)
  const categoriesList = useMemo(() => {
    const map = new Map<string, { count: number; totalStock: number; totalValue: number }>();
    products.forEach((p) => {
      const cat = p.category || 'Lainnya';
      const existing = map.get(cat) || { count: 0, totalStock: 0, totalValue: 0 };
      existing.count += 1;
      existing.totalStock += p.stock;
      existing.totalValue += p.stock * p.hpp;
      map.set(cat, existing);
    });
    return Array.from(map.entries()).map(([name, stat]) => ({
      name,
      count: stat.count,
      totalStock: stat.totalStock,
      totalValue: stat.totalValue,
    }));
  }, [products]);

  // Derived Brands (Auto-populated from products - no manual add)
  const brandsList = useMemo(() => {
    const map = new Map<string, { count: number; totalStock: number; principal: string }>();
    products.forEach((p) => {
      const brand = p.brand || 'Umum';
      const existing = map.get(brand) || {
        count: 0,
        totalStock: 0,
        principal: p.supplier || 'Distributor / Pabrik',
      };
      existing.count += 1;
      existing.totalStock += p.stock;
      map.set(brand, existing);
    });
    return Array.from(map.entries()).map(([name, stat]) => ({
      name,
      count: stat.count,
      totalStock: stat.totalStock,
      principal: stat.principal,
    }));
  }, [products]);

  // Derived Suppliers (Merged from masterSuppliers and products - with WhatsApp click-to-chat)
  const suppliersList = useMemo(() => {
    const map = new Map<string, { count: number; phone: string; address: string; picName?: string }>();

    // 1. Seed from masterSuppliers
    masterSuppliers.forEach((sup) => {
      map.set(sup.name, {
        count: 0,
        phone: sup.phone,
        address: sup.address,
        picName: sup.picName || 'Sales Depo / Pabrik',
      });
    });

    // 2. Count SKUs and capture any extra suppliers in products
    products.forEach((p) => {
      const sup = p.supplier || 'Pabrik Danone Subang';
      if (!map.has(sup)) {
        let phone = p.supplierContact || '08122334455';
        let address = p.supplierAddress || 'Kawasan Industri Subang, Jawa Barat';
        if (sup.toLowerCase().includes('danone') || sup.toLowerCase().includes('aqua')) {
          phone = '081122334455';
          address = 'PT Tirta Investama, Subang';
        } else if (sup.toLowerCase().includes('minerale') || sup.toLowerCase().includes('mayora')) {
          phone = '081399887766';
          address = 'PT Tirta Fresindo Jaya, Pasuruan';
        } else if (sup.toLowerCase().includes('cleo')) {
          phone = '081255443322';
          address = 'PT Sariguna Primatirta, Karawang';
        }
        map.set(sup, { count: 1, phone, address, picName: 'Sales Pabrik' });
      } else {
        const existing = map.get(sup)!;
        existing.count += 1;
      }
    });

    return Array.from(map.entries()).map(([name, stat]) => ({
      name,
      count: stat.count,
      phone: stat.phone,
      address: stat.address,
      picName: stat.picName,
    }));
  }, [products, masterSuppliers]);

  // Autofocus default ke barcode input scanner saat tab 'produk' aktif
  useEffect(() => {
    if (activeTab === 'produk') {
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Kalkulasi Realtime Harga Jual: HPP + (HPP * Margin / 100), pembulatan rapi ke ratusan terdekat
  const calculatedSellingPrice = useMemo(() => {
    const base = Number(intakeHpp) || 0;
    const margin = Number(intakeMarginPercent) || 0;
    const raw = base + (base * margin) / 100;
    return Math.max(0, Math.round(raw / 100) * 100);
  }, [intakeHpp, intakeMarginPercent]);

  // Sinkronisasi target harga jual berdasarkan tier (Retail vs Grosir)
  useEffect(() => {
    if (intakeTargetTier === 'retail') {
      setIntakePriceRetail(calculatedSellingPrice);
      setIntakePriceToko(Math.round((calculatedSellingPrice * 0.92) / 100) * 100);
      setIntakePricePangkalan(Math.round((calculatedSellingPrice * 0.88) / 100) * 100);
    } else {
      setIntakePriceToko(calculatedSellingPrice);
      setIntakePricePangkalan(Math.round((calculatedSellingPrice * 0.95) / 100) * 100);
      setIntakePriceRetail(Math.round((calculatedSellingPrice * 1.12) / 100) * 100);
    }
  }, [calculatedSellingPrice, intakeTargetTier]);

  // Logika Deteksi Barcode Scanner (Input Scanner USB / Bluetooth / Manual)
  const handleProcessBarcodeScan = (codeToSearch?: string) => {
    const raw = (codeToSearch !== undefined ? codeToSearch : barcodeInput).trim();
    if (!raw) return;

    // Search by SKU ID or barcode
    const match = products.find(
      (p) =>
        p.id.toLowerCase() === raw.toLowerCase() ||
        (p.barcode && p.barcode.toLowerCase() === raw.toLowerCase())
    );

    if (match) {
      // 1. Barcode cocok dengan SKU yang ada -> Otomatis muat data lengkap
      setScannerStatus('detected_existing');
      setDetectedProduct(match);
      setIntakeSku(match.id);
      setIntakeName(match.name);
      setIntakeBrand(match.brand || 'Danone Aqua');
      setIntakeCategory(match.category || 'Galon 19L');
      setIntakeUnit(match.unit || 'Tabung / Galon');
      setIntakeSupplier(match.supplier || 'Pabrik Danone Subang');
      setIntakeHpp(match.hpp || 15200);
      setIntakePackaging(match.packagingSize || '');
      setIntakeTargetTier(match.targetTier || 'retail');

      // Update quickCategoryTab to match scanned product's parent category
      if (match.parentCategory === 'AIR_MINUM' || match.category.toLowerCase().includes('galon') || match.category.toLowerCase().includes('air')) {
        setQuickCategoryTab('AIR_MINUM');
      } else if (match.parentCategory === 'FMCG_FOOD' || match.category.toLowerCase().includes('beras') || match.category.toLowerCase().includes('sembako') || match.category.toLowerCase().includes('minyak')) {
        setQuickCategoryTab('FMCG_SEMBAKO');
      } else if (match.parentCategory === 'FMCG_NON_FOOD' || match.category.toLowerCase().includes('sabun') || match.category.toLowerCase().includes('homecare')) {
        setQuickCategoryTab('HOMECARE');
      } else if (match.parentCategory === 'NON_FMCG_LOGISTIK') {
        setQuickCategoryTab('NON_FMCG');
      }

      const initialMargin = match.profitMarginPercent || (match.hpp > 0 ? Math.round(((match.priceRetail - match.hpp) / match.hpp) * 100) : 25);
      setIntakeMarginPercent(initialMargin);
      setIntakePriceRetail(match.priceRetail || 20000);
      setIntakePriceToko(match.priceToko || 18500);
      setIntakePricePangkalan(match.pricePangkalan || 17500);
      setIntakeQty(50);

      setNotificationMsg(`✓ Barcode Cocok: [${match.id}] ${match.name} • Supplier: ${match.supplier} (Stok Saat Ini: ${match.stock} ${match.unit})`);
      setTimeout(() => setNotificationMsg(null), 4000);

      // Alur Pengisian Berurutan: Fokus otomatis ke a. Supplier / Pemasok
      setTimeout(() => {
        supplierSelectRef.current?.focus();
      }, 100);
    } else {
      // 2. Barcode belum terdaftar: Buka formulir registrasi SKU baru
      setScannerStatus('detected_new');
      setDetectedProduct(null);
      setIntakeSku(raw);
      setIntakeName('');
      setIntakeBrand('Danone Aqua');
      setIntakeCategory('Galon 19L');
      setIntakeUnit('Tabung / Galon');
      setIntakePackaging('');
      setIntakeSupplier('Pabrik Danone Subang');
      setIntakeHpp(15000);
      setIntakeMarginPercent(25);
      setIntakeQty(50);
      setIntakeTargetTier('retail');

      setNotificationMsg(`⚡ Barcode Baru [${raw}] belum terdaftar. Formulir registrasi SKU baru terbuka otomatis.`);
      setTimeout(() => setNotificationMsg(null), 4500);

      // Fokus otomatis ke input nama produk baru
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  };

  // Handler Pilihan Cepat Format Kemasan/Ukuran dengan Auto-Adaptasi Unit & Kategori
  const handleSelectPackagingFormat = (format: PackagingSizeFormat) => {
    setIntakePackaging(format);
    if (format === '19L Galon') {
      setIntakeCategory('Galon 19L');
      setIntakeUnit('Tabung');
      setIntakeBrand((prev) => prev || 'Danone Aqua');
    } else if (format === '330ml Mini' || format === '600ml Sedang' || format === '1500ml Besar' || format === 'Dus/Karton isi 24/48') {
      setIntakeCategory('Kemasan Botol / Dus');
      setIntakeUnit('Karton');
      setIntakeBrand((prev) => prev || 'Mayora Le Minerale');
    } else if (format === 'Cup Gelas 220ml') {
      setIntakeCategory('Kemasan Gelas / Cup');
      setIntakeUnit('Dus');
      setIntakeBrand((prev) => prev || 'Sariguna Cleo');
    } else if (format === 'Sak 5kg' || format === 'Sak 10kg' || format === 'Sak 25kg') {
      setIntakeCategory('Sembako & Beras');
      setIntakeUnit('Sak');
      setIntakeBrand((prev) => prev || 'Beras Ramos Super');
    } else if (format === 'Pouch 1L' || format === 'Pouch 2L') {
      setIntakeCategory('Sembako & Beras');
      setIntakeUnit('Pouch');
      setIntakeBrand((prev) => prev || 'Minyak Sawit Bimoli');
    } else if (format === 'Tray 30 Butir') {
      setIntakeCategory('Sembako & Beras');
      setIntakeUnit('Tray');
      setIntakeBrand((prev) => prev || 'Telur Ayam Negeri');
    } else if (format === 'Dus isi 24' || format === 'Dus isi 48') {
      setIntakeCategory('Sembako & Beras');
      setIntakeUnit('Dus');
      setIntakeBrand((prev) => prev || 'Indofood Mi Instan');
    } else if (format === 'Pouch / Botol 500ml' || format === 'Jerigen 5L') {
      setIntakeCategory('Homecare & Sabun');
      setIntakeUnit('Pcs');
      setIntakeBrand((prev) => prev || 'Sunlight / Mama Lemon');
    } else if (format === 'Renceng 12 Pcs') {
      setIntakeCategory('Homecare & Sabun');
      setIntakeUnit('Renceng');
      setIntakeBrand((prev) => prev || 'SoKlin / Daia');
    } else if (format === 'Pack isi 10') {
      setIntakeCategory('Homecare & Sabun');
      setIntakeUnit('Pack');
      setIntakeBrand((prev) => prev || 'Tisu Sanitasi');
    } else if (format === 'Unit Box' || format === 'Set / Rak' || format === 'Pcs') {
      setIntakeCategory('Aksesoris & Peralatan');
      setIntakeUnit(format === 'Unit Box' ? 'Unit' : format === 'Set / Rak' ? 'Set' : 'Pcs');
      setIntakeBrand((prev) => prev || 'Miyako / Dispenser Hub');
    }

    // Auto-lanjutkan fokus ke urutan d. Tier HPP
    setTimeout(() => {
      hppInputRef.current?.focus();
    }, 80);
  };

  // Simpan Supplier Baru dari Modal
  const handleSaveNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) {
      alert('Nama Supplier / Pabrik wajib diisi!');
      return;
    }

    const newSup: SupplierMasterItem = {
      id: `SUP-${String(masterSuppliers.length + 1).padStart(2, '0')}`,
      name: newSupName.trim(),
      phone: newSupPhone.trim() || '08123456789',
      address: newSupAddress.trim() || 'Kawasan Industri Distribusi',
      picName: newSupPic.trim() || 'Sales Representative',
    };

    const updated = [...masterSuppliers, newSup];
    setMasterSuppliers(updated);
    try {
      localStorage.setItem('jacs_master_suppliers', JSON.stringify(updated));
    } catch {}

    setIntakeSupplier(newSup.name);
    setIsNewSupplierModalOpen(false);
    setNewSupName('');
    setNewSupPhone('08');
    setNewSupAddress('');
    setNewSupPic('');

    setNotificationMsg(`✓ Supplier baru '${newSup.name}' berhasil ditambahkan dan dipilih!`);
    setTimeout(() => setNotificationMsg(null), 3000);

    // Lanjut ke urutan b. Jumlah Pembelian (Qty)
    setTimeout(() => {
      qtyInputRef.current?.focus();
    }, 100);
  };

  // Eksekusi Simpan SKU & Multi-Sinkronisasi
  const handleSaveSkuIntake = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanSku = (intakeSku || barcodeInput).trim();
    if (!cleanSku) {
      alert('Kode Barcode / SKU tidak boleh kosong!');
      barcodeInputRef.current?.focus();
      return;
    }

    if (!intakeName.trim()) {
      alert('Nama Produk wajib diisi!');
      nameInputRef.current?.focus();
      return;
    }

    const currentSupObj = masterSuppliers.find((s) => s.name === intakeSupplier);
    const qtyNum = Number(intakeQty) || 0;
    const prevStock = detectedProduct ? detectedProduct.stock : 0;
    const finalStock = prevStock + qtyNum;

    const detectedParentCategory: ParentCategoryType =
      quickCategoryTab === 'AIR_MINUM'
        ? 'AIR_MINUM'
        : quickCategoryTab === 'FMCG_SEMBAKO'
        ? 'FMCG_FOOD'
        : quickCategoryTab === 'HOMECARE'
        ? 'FMCG_NON_FOOD'
        : 'NON_FMCG_LOGISTIK';

    const savedProduct: ProductMasterItem = {
      id: cleanSku,
      barcode: barcodeInput.trim() || cleanSku,
      name: intakeName.trim(),
      category: intakeCategory,
      parentCategory: detectedProduct?.parentCategory || detectedParentCategory,
      brand: intakeBrand.trim() || 'Umum',
      stock: finalStock,
      minStock: detectedProduct?.minStock || Math.max(10, Math.round(finalStock * 0.25)),
      reorderPoint: detectedProduct?.reorderPoint || Math.max(20, Math.round(finalStock * 0.4)),
      unit: intakeUnit,
      hpp: Number(intakeHpp) || 0,
      pricingScheme: 'tier',
      priceRetail: Number(intakePriceRetail) || 0,
      priceToko: Number(intakePriceToko) || Math.round(Number(intakePriceRetail) * 0.92),
      pricePangkalan: Number(intakePricePangkalan) || Math.round(Number(intakePriceRetail) * 0.88),
      supplier: intakeSupplier,
      packagingSize: intakePackaging,
      supplierContact: currentSupObj?.phone,
      supplierAddress: currentSupObj?.address,
      lastPurchaseQty: qtyNum,
      targetTier: intakeTargetTier,
      profitMarginPercent: Number(intakeMarginPercent),
      warningMode: detectedProduct?.warningMode || 'percentage',
      maxCapacity: detectedProduct?.maxCapacity || 500,
      warningThresholdValue: detectedProduct?.warningThresholdValue || 30,
    };

    let updatedProducts: ProductMasterItem[];
    const idx = products.findIndex((p) => p.id.toLowerCase() === savedProduct.id.toLowerCase());
    if (idx >= 0) {
      updatedProducts = [...products];
      updatedProducts[idx] = savedProduct;
    } else {
      updatedProducts = [savedProduct, ...products];
    }

    setProducts(updatedProducts);
    if (onUpdateProducts) onUpdateProducts(updatedProducts);
    if (idx < 0 && onAddProduct) onAddProduct(savedProduct);

    try {
      localStorage.setItem('argus_products', JSON.stringify(updatedProducts));
      localStorage.setItem('jacs_master_products', JSON.stringify(updatedProducts));
      window.dispatchEvent(new Event('products_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    // Multi-sinkronisasi ke tab 'StokProduk' di Google Sheets
    setIsSyncingGas(true);
    try {
      syncProductStockToGas(savedProduct).then((res) => {
        setIsSyncingGas(false);
        if (res.success) {
          console.log('✓ Sinkronisasi StokProduk Sheets berhasil:', res.message);
        }
      });
    } catch {
      setIsSyncingGas(false);
    }

    const actionDesc = detectedProduct ? `Restock +${qtyNum} ${savedProduct.unit}` : `Registrasi SKU Baru (+${qtyNum} ${savedProduct.unit})`;
    const successMsg = `✅ [${savedProduct.id}] ${savedProduct.name} berhasil diperbarui! ${actionDesc}. Total stok fisik: ${savedProduct.stock} ${savedProduct.unit}. Tersinkron ke Google Sheets 'StokProduk'.`;
    setNotificationMsg(successMsg);
    setTimeout(() => setNotificationMsg(null), 4500);

    // Reset input barcode dan autofocus kembali
    setBarcodeInput('');
    setScannerStatus('idle');
    setDetectedProduct(null);
    setIntakeQty(50);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 60);
  };

  // Filtered Customers with Memoization
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (customerTierFilter !== 'Semua' && c.kasirTier !== customerTierFilter) {
        return false;
      }
      if (customerSearch.trim()) {
        const q = customerSearch.toLowerCase();
        const bName = (c.businessName || '').toLowerCase();
        const pic = (c.ownerName || c.name || '').toLowerCase();
        const id = c.id.toLowerCase();
        const code = (c.memberCode || '').toLowerCase();
        const phone = c.phone.toLowerCase();
        return bName.includes(q) || pic.includes(q) || id.includes(q) || code.includes(q) || phone.includes(q);
      }
      return true;
    });
  }, [customers, customerTierFilter, customerSearch]);

  // Handler for [+ Add New] Pelanggan Form
  const handleAddNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustPic.trim() && !newCustBusiness.trim()) {
      alert('Nama Pelanggan (PIC) atau Nama Usaha wajib diisi!');
      return;
    }
    if (!newCustPhone.trim() || newCustPhone === '08') {
      alert('Nomor HP / WhatsApp wajib diisi!');
      return;
    }

    const nextIdx = customers.length + 1;
    const memberCode = `MBR-${String(nextIdx).padStart(3, '0')}`;
    const id = newCustBusiness.trim() ? `CUST-B2B-${String(nextIdx).padStart(3, '0')}` : `CUST-B2C-${String(nextIdx).padStart(3, '0')}`;

    const newCustomer: CustomerMasterItemEnhanced = {
      id,
      memberCode,
      name: newCustBusiness.trim() || newCustPic.trim(),
      ownerName: newCustPic.trim() || undefined,
      businessName: newCustBusiness.trim() || 'Non-Toko / Personal',
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || 'Subang Kota, Jawa Barat',
      type: newCustBusiness.trim() ? 'B2B' : 'B2C',
      kasirTier: newCustTier,
      priceTier: newCustTier === 'Grosir / Toko' ? 'Pangkalan' : newCustTier === 'Member' ? 'Toko' : 'Eceran',
      b2bCategory: newCustBusiness.trim() ? 'Toko Kelontong' : undefined,
      emptyGallonDebt: 0,
      currentReceivable: 0,
      lastTransactionDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastTransactionAmount: 0,
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    if (onAddCustomer) {
      onAddCustomer(newCustomer, true);
    }

    // Reset Form
    setNewCustPic('');
    setNewCustBusiness('');
    setNewCustPhone('08');
    setNewCustAddress('');
    setNewCustTier('Grosir / Toko');
    setIsAddCustomerFormOpen(false);

    setNotificationMsg(`✓ Pelanggan baru [${memberCode}] ${newCustomer.businessName} (${newCustPic}) berhasil disimpan dengan Tier ${newCustTier}!`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <div className="min-h-screen pb-24 overflow-y-auto flex flex-col gap-2 [body.light-theme_&]:text-slate-800">
      {/* Top Banner & Module Navigation Header */}
      <div className="glass-panel p-2.5 px-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm border-t-[3px] border-t-purple-500 [body.light-theme_&]:border-t-purple-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400 text-purple-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(168,85,247,0.35)]">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5 leading-none">
              MASTER DATA SKU, MITRA & SUPPLIER
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                DISTRIBUTOR RESMI
              </span>
            </h2>
          </div>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Module Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/90 [body.light-theme_&]:bg-slate-100 p-0.5 rounded-lg border border-slate-800 [body.light-theme_&]:border-slate-300 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('produk')}
              className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'produk'
                  ? 'bg-purple-600 text-white font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              <span>🏷️ Katalog & Harga</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kategori')}
              className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'kategori'
                  ? 'bg-purple-600 text-white font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              <span>⚙️ Pengaturan Kategori & Satuan</span>
              <span className="text-[9px] px-1 rounded bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700">
                {categoriesList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('merek')}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'merek'
                  ? 'bg-purple-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              <span>🏢 Merek</span>
              <span className="text-[9px] px-1 rounded bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700">
                {brandsList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('supplier')}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'supplier'
                  ? 'bg-purple-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              <span>🚚 Supplier</span>
              <span className="text-[9px] px-1 rounded bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700">
                {suppliersList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pelanggan')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'pelanggan'
                  ? 'bg-purple-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              <span>👥 Pelanggan</span>
              <span className="text-[9px] px-1 rounded bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700">
                {customers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('riwayat-do')}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'riwayat-do'
                  ? 'bg-purple-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              <span>Surat Jalan DO ({receipts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('komisi')}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'komisi'
                  ? 'bg-purple-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              <span>Skema Komisi</span>
            </button>
          </div>

          {/* Action Button: Modal Tambah SKU jika di tab Produk */}
          {activeTab === 'produk' && (
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 shadow-sm flex items-center gap-1 cursor-pointer transition-all border border-purple-400"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>+ Form Produk Lengkap</span>
            </button>
          )}

          {/* Action Button: [+ Add New] KHUSUS PELANGGAN */}
          {activeTab === 'pelanggan' && (
            <button
              type="button"
              onClick={() => setIsAddCustomerFormOpen(true)}
              className="px-3 py-1 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1.5 cursor-pointer transition-all border border-cyan-300 active:scale-95"
            >
              <i className="fa-solid fa-user-plus text-xs"></i>
              <span>+ Add New Pelanggan</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="p-2 px-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300 shrink-0">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
            <span className="font-extrabold">{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards with Dynamic Neon Borders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total SKU & Modal HPP (Neon Cyan Glow) */}
        <div className="glass-panel p-2.5 px-3 rounded-xl border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-cyan-950/20 [body.light-theme_&]:bg-white [body.light-theme_&]:border-cyan-500 [body.light-theme_&]:shadow-[0_0_10px_rgba(6,182,212,0.2)] flex items-center justify-between transition-all">
          <div>
            <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-700 font-bold uppercase tracking-wider">
              Total SKU & Modal HPP
            </div>
            <div className="text-base font-black text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono leading-tight mt-0.5">
              {products.length} SKU
            </div>
            <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5 font-mono">
              HPP: Rp {totalHppValue.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xs shrink-0">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
        </div>

        {/* Card 2: Buffer Stok Aman (Neon Hijau/Emerald Glow) */}
        <div className="glass-panel p-2.5 px-3 rounded-xl border-2 border-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.3)] bg-emerald-950/20 [body.light-theme_&]:bg-white [body.light-theme_&]:border-emerald-500 [body.light-theme_&]:shadow-[0_0_10px_rgba(52,211,153,0.2)] flex items-center justify-between transition-all">
          <div>
            <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-700 font-bold uppercase tracking-wider">
              Buffer Stok Aman
            </div>
            <div className="text-base font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 font-mono leading-tight mt-0.5">
              {Math.max(0, products.length - criticalStockCount - warningStockCount)} SKU Aman
            </div>
            <div className="text-[9px] text-emerald-400 [body.light-theme_&]:text-emerald-700 mt-0.5">
              Estimasi Jual: Rp {totalRetailValue.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs shrink-0">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
        </div>

        {/* Card 3: Peringatan Stok Menipis / Buffer Tipis (Neon Kuning/Amber Glow) */}
        <div className={`glass-panel p-2.5 px-3 rounded-xl border-2 transition-all flex items-center justify-between ${
          warningStockCount > 0
            ? 'border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.3)] bg-amber-950/20 [body.light-theme_&]:bg-white [body.light-theme_&]:border-amber-500 [body.light-theme_&]:shadow-[0_0_10px_rgba(251,191,36,0.2)]'
            : 'border-slate-800 bg-slate-900/60 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300'
        }`}>
          <div>
            <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-700 font-bold uppercase tracking-wider">
              Buffer Stok Menipis
            </div>
            <div className="text-base font-black text-amber-400 [body.light-theme_&]:text-amber-700 font-mono leading-tight mt-0.5">
              {warningStockCount} SKU Menipis
            </div>
            <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
              Mendekati safety margin PO pabrik
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xs shrink-0">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
        </div>

        {/* Card 4: SKU Kritis / E-Warning (Neon Merah Menyala Glow) */}
        <div className={`glass-panel p-2.5 px-3 rounded-xl border-2 transition-all flex items-center justify-between ${
          criticalStockCount > 0
            ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.35)] bg-rose-950/20 [body.light-theme_&]:bg-white [body.light-theme_&]:border-rose-500 [body.light-theme_&]:shadow-[0_0_10px_rgba(244,63,94,0.2)]'
            : 'border-emerald-500/60 shadow-[0_0_10px_rgba(52,211,153,0.2)] bg-emerald-950/15 [body.light-theme_&]:bg-white [body.light-theme_&]:border-emerald-400'
        }`}>
          <div>
            <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-700 font-bold uppercase tracking-wider">
              Safety Stock & Kritis
            </div>
            <div className="text-base font-black text-rose-400 [body.light-theme_&]:text-rose-700 font-mono leading-tight mt-0.5 flex items-center gap-1.5">
              {criticalStockCount} SKU Kritis
              {criticalStockCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>}
            </div>
            <div className="text-[9px] text-rose-400 [body.light-theme_&]:text-rose-600 mt-0.5 font-bold">
              {criticalStockCount > 0 ? 'Wajib segera PO pabrik' : 'Semua SKU aman terkendali'}
            </div>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 border ${
            criticalStockCount > 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: [📦 PRODUK & SKU] (Retail & Wholesaler Anti-Lag) */}
      {/* ======================================================== */}
      {activeTab === 'produk' && (
        <div className="glass-panel rounded-2xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 flex flex-col shadow-sm space-y-3 pb-8">
          {/* Sub-tab Navigation (Retail & Wholesaler) + Search & Filter */}
          <div className="p-2 px-3 bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Sub-tab buttons: Instant Switch (Anti-Lag via useMemo) */}
            <div className="flex items-center gap-1 bg-slate-900 [body.light-theme_&]:bg-slate-200 p-1 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setProductSubTab('semua')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  productSubTab === 'semua'
                    ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-white'
                }`}
              >
                Semua SKU ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setProductSubTab('retail')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  productSubTab === 'retail'
                    ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-white'
                }`}
              >
                <span>🛒 Modul Retail & Ecer</span>
              </button>
              <button
                type="button"
                onClick={() => setProductSubTab('wholesaler')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  productSubTab === 'wholesaler'
                    ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-white'
                }`}
              >
                <span>🏢 Modul Grosir & Wholesaler</span>
              </button>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  placeholder="Cari SKU / Nama Produk..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-purple-400 w-44"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-purple-400 cursor-pointer font-bold"
              >
                <option value="Semua">Semua Kategori (Universal)</option>
                <optgroup label="Klasifikasi Kategori Induk">
                  <option value="AIR_MINUM">💧 Lini Air &amp; Minuman</option>
                  <option value="FMCG_FOOD">🌾 FMCG Food &amp; Sembako</option>
                  <option value="FMCG_NON_FOOD">🧼 FMCG Non-Food / Homecare</option>
                  <option value="NON_FMCG_LOGISTIK">📦 Non-FMCG / Logistik</option>
                </optgroup>
                <optgroup label="Sub-Kategori Produk">
                  <option value="Galon 19L">Galon 19L Refill &amp; Botol</option>
                  <option value="Kemasan Botol / Dus">Kemasan Botol / Dus</option>
                  <option value="Kemasan Gelas / Cup">Kemasan Gelas / Cup</option>
                  <option value="Sembako &amp; Beras">Sembako (Beras, Minyak, Telur)</option>
                  <option value="Homecare &amp; Sabun">Homecare (Sabun, Deterjen)</option>
                  <option value="Aksesoris &amp; Peralatan">Aksesoris &amp; Peralatan Depo</option>
                  <option value="Sanitasi &amp; Tisu">Sanitasi &amp; Tisu</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MODUL INPUT CEPAT PRODUK BERBASIS BARCODE SCANNER & UNIVERSAL MULTI-PRODUK */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-slate-700/60 [body.light-theme_&]:border-slate-200 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 [body.light-theme_&]:from-purple-50/70 [body.light-theme_&]:via-white [body.light-theme_&]:to-indigo-50/70 shadow-sm transition-all duration-300">
            {/* Header Ribbon & Scanning Status Indicator with Collapsible Toggle */}
            <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 [body.light-theme_&]:border-purple-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 [body.light-theme_&]:bg-purple-100 [body.light-theme_&]:text-purple-700 border border-purple-400 flex items-center justify-center shadow-xs">
                  <Barcode className="w-4 h-4 text-purple-400 [body.light-theme_&]:text-purple-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wide">
                      Input Cepat Produk Berbasis Barcode Scanner
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-purple-600 text-white shadow-xs">
                      UNIVERSAL FMCG & AIR
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
                    Mendukung Barcode Scanner USB / Bluetooth (Auto-Enter) & input keyboard manual multi-kategori.
                  </p>
                </div>
              </div>

              {/* Status Indicator, Reset Button, and Collapsible Toggle */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 [body.light-theme_&]:text-emerald-800 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Scanner Aktif: Siap Scan</span>
                </div>

                {(scannerStatus !== 'idle' || barcodeInput.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBarcodeInput('');
                      setScannerStatus('idle');
                      setDetectedProduct(null);
                      setIntakeQty(50);
                      setTimeout(() => barcodeInputRef.current?.focus(), 60);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:text-slate-700 text-[10px] font-bold cursor-pointer transition-all border border-slate-700 [body.light-theme_&]:border-slate-300 flex items-center gap-1"
                    title="Bersihkan input & siap scan baru"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset Scan</span>
                  </button>
                )}

                {/* Collapsible Button */}
                <button
                  type="button"
                  id="btn-toggle-quick-input"
                  onClick={() => setIsQuickInputExpanded((prev) => !prev)}
                  className="px-3 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 [body.light-theme_&]:bg-purple-100 [body.light-theme_&]:text-purple-800 border border-purple-500/40 text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                  title={isQuickInputExpanded ? 'Sembunyikan Form Input Cepat' : 'Buka Form Input Cepat'}
                >
                  {isQuickInputExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Sembunyikan Form</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Buka Form Input Cepat</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Content Body */}
            {isQuickInputExpanded && (
              <div className="p-3 sm:p-4 space-y-3.5 animate-in fade-in duration-200">
                {/* 1. Barcode Scanner Input Field (Autofocus Default) */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-2.5 text-purple-400 flex items-center gap-1">
                        <Scan className="w-4 h-4 animate-pulse" />
                      </div>
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        id="input-master-barcode-scanner"
                        autoFocus
                        placeholder="Arahkan Barcode Scanner USB/Bluetooth atau ketik SKU lalu tekan 'Enter' (contoh: PRD-01 / 8992761111114)..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleProcessBarcodeScan();
                          }
                        }}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 [body.light-theme_&]:bg-white border-2 border-purple-500/50 [body.light-theme_&]:border-purple-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 text-xs sm:text-sm font-mono text-cyan-300 [body.light-theme_&]:text-purple-950 font-bold placeholder-slate-500 outline-hidden transition-all shadow-inner"
                      />
                    </div>

                    <button
                      type="button"
                      id="btn-trigger-barcode-scan"
                      onClick={() => handleProcessBarcodeScan()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-purple-950/40 flex items-center justify-center gap-1.5 active:scale-95 shrink-0 border border-purple-400/50"
                      title="Deteksi Barcode Scanner (atau tekan Enter di input)"
                    >
                      <Scan className="w-3.5 h-3.5 text-amber-300" />
                      <span>Scan / Deteksi Barcode</span>
                    </button>
                  </div>

                  {/* Status Banner Deteksi Barcode */}
                  {scannerStatus === 'detected_existing' && detectedProduct && (
                    <div className="p-2 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-900 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>Barcode Cocok (SKU Terdaftar):</strong> [{detectedProduct.id}] <strong>{detectedProduct.name}</strong> • Stok Depo: <strong className="text-white [body.light-theme_&]:text-emerald-950 font-mono">{detectedProduct.stock} {detectedProduct.unit}</strong> • Supplier: <strong>{detectedProduct.supplier}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                        Mode Restock &amp; Update Harga
                      </span>
                    </div>
                  )}

                  {scannerStatus === 'detected_new' && (
                    <div className="p-2 px-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 [body.light-theme_&]:bg-amber-50 [body.light-theme_&]:text-amber-900 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>Barcode Baru Belum Terdaftar:</strong> Kode <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-bold">{intakeSku}</code> siap didaftarkan ke katalog master produk.
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-600 text-slate-950">
                        Mode Registrasi SKU Baru
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Sequential Step Form Grid (3 Kolom Responsif Modern & Luwes) */}
                <form onSubmit={handleSaveSkuIntake} className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5">
                    {/* a. Identitas Produk & Supplier Pabrik (Span 4) */}
                    <div className="lg:col-span-4 p-3.5 rounded-2xl bg-slate-950/70 [body.light-theme_&]:bg-white border border-slate-700/60 [body.light-theme_&]:border-slate-200 space-y-2.5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-purple-400 [body.light-theme_&]:text-purple-700 tracking-wider flex items-center gap-1">
                            <span>a. Supplier &amp; Identitas SKU</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsNewSupplierModalOpen(true)}
                            className="text-[10.5px] font-bold text-cyan-400 hover:text-cyan-300 [body.light-theme_&]:text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                            title="Daftarkan supplier baru jika belum ada di daftar"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah Supplier Baru</span>
                          </button>
                        </div>

                        {/* Nama Produk Input */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block">
                            Nama Produk / SKU:
                          </label>
                          <input
                            ref={nameInputRef}
                            type="text"
                            required
                            placeholder="Contoh: Aqua Galon 19L Refill / Beras Ramos 5kg..."
                            value={intakeName}
                            onChange={(e) => setIntakeName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                supplierSelectRef.current?.focus();
                              }
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-bold focus:border-purple-400 focus:bg-white outline-hidden transition-colors"
                          />
                        </div>

                        {/* Dropdown Supplier Pabrik */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3 text-emerald-400" />
                              <span>Pabrik / Supplier Pemasok:</span>
                            </span>
                          </label>
                          <select
                            ref={supplierSelectRef}
                            value={intakeSupplier}
                            onChange={(e) => setIntakeSupplier(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                qtyInputRef.current?.focus();
                              }
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold focus:border-purple-400 outline-hidden cursor-pointer transition-colors"
                          >
                            {masterSuppliers.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Identitas Lengkap Supplier Terpilih */}
                        {(() => {
                          const curSup = masterSuppliers.find((s) => s.name === intakeSupplier) || masterSuppliers[0];
                          const cleanWa = (curSup?.phone || '').replace(/\D/g, '');
                          const waLink = `https://wa.me/62${cleanWa.startsWith('0') ? cleanWa.slice(1) : cleanWa}`;
                          return (
                            <div className="p-2 rounded-xl bg-slate-900/90 [body.light-theme_&]:bg-slate-100/80 border border-slate-800 [body.light-theme_&]:border-slate-200 text-[10px] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-cyan-400" />
                                  <span>PIC: {curSup?.picName || 'Sales Depo'}</span>
                                </span>
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 [body.light-theme_&]:text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>WA: {curSup?.phone}</span>
                                </a>
                              </div>
                              <p className="text-slate-400 [body.light-theme_&]:text-slate-500 truncate" title={curSup?.address}>
                                📍 {curSup?.address}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* b. Jumlah Pembelian & c. Update Kemasan (Span 4) */}
                    <div className="lg:col-span-4 p-3.5 rounded-2xl bg-slate-950/70 [body.light-theme_&]:bg-white border border-slate-700/60 [body.light-theme_&]:border-slate-200 space-y-2.5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-xs">
                      {/* b. Qty Pembelian (Restock Masuk) dengan Satuan Dinamis */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-purple-400 [body.light-theme_&]:text-purple-700 tracking-wider">
                            b. Jumlah Pembelian (Qty Restock)
                          </span>
                          <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">
                            Masuk Fisik Depo
                          </span>
                        </div>

                        {/* Input Jumlah + Dropdown Satuan Universal */}
                        <div className="flex items-center gap-2">
                          <input
                            ref={qtyInputRef}
                            type="number"
                            min="1"
                            required
                            value={intakeQty}
                            onChange={(e) => setIntakeQty(Math.max(1, Number(e.target.value)))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                hppInputRef.current?.focus();
                              }
                            }}
                            className="w-24 px-3 py-1.5 text-xs rounded-xl bg-slate-900 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:border-purple-400 outline-hidden transition-colors"
                          />

                          {/* Dropdown Pilihan Satuan Pembelian Universal (Bagian B) */}
                          <div className="flex-1">
                            <select
                              value={intakeUnit}
                              onChange={(e) => setIntakeUnit(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-900 [body.light-theme_&]:bg-purple-50 border border-purple-500/40 text-purple-300 [body.light-theme_&]:text-purple-900 font-bold focus:border-purple-400 outline-hidden cursor-pointer transition-colors"
                              title="Pilih satuan pembelian / barang universal"
                            >
                              <option value="Pcs / Butir / Botol">Pcs / Butir / Botol</option>
                              <option value="Karton / Dus">Karton / Dus</option>
                              <option value="Sak / Karung">Sak / Karung</option>
                              <option value="Renceng / Pack">Renceng / Pack</option>
                              <option value="Tray">Tray</option>
                              <option value="Tabung / Galon">Tabung / Galon</option>
                              <option value="Jerigen / Unit">Jerigen / Unit</option>
                            </select>
                          </div>
                        </div>

                        {/* Realtime Stock Calculation Badge */}
                        <div className="p-1.5 px-2.5 rounded-xl bg-slate-900/90 [body.light-theme_&]:bg-slate-100/80 border border-slate-800 [body.light-theme_&]:border-slate-200 text-[10px] flex items-center justify-between">
                          <span className="text-slate-400 [body.light-theme_&]:text-slate-600">
                            Stok Saat Ini: <strong className="text-slate-200 [body.light-theme_&]:text-slate-800">{detectedProduct?.stock || 0}</strong>
                          </span>
                          <span className="text-emerald-400 [body.light-theme_&]:text-emerald-700 font-bold">
                            ➔ Total Baru: {((detectedProduct?.stock || 0) + (Number(intakeQty) || 0)).toLocaleString('id-ID')} {intakeUnit}
                          </span>
                        </div>
                      </div>

                      {/* c. Kategori & Ukuran Kemasan */}
                      <div className="space-y-2 pt-1 border-t border-slate-800/80 [body.light-theme_&]:border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-purple-400 [body.light-theme_&]:text-purple-700 tracking-wider flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>c. Kategori &amp; Ukuran Kemasan</span>
                          </span>
                        </div>

                        {/* 4 Tombol Tab Kategori Utama */}
                        <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-slate-900 [body.light-theme_&]:bg-slate-100 border border-slate-800 [body.light-theme_&]:border-slate-200 text-[9.5px]">
                          {(
                            [
                              { key: 'AIR_MINUM', label: 'Air Minum', icon: '💧' },
                              { key: 'FMCG_SEMBAKO', label: 'Sembako', icon: '🌾' },
                              { key: 'HOMECARE', label: 'Homecare', icon: '🧼' },
                              { key: 'NON_FMCG', label: 'Non-FMCG', icon: '📦' },
                            ] as { key: QuickInputCategoryTab; label: string; icon: string }[]
                          ).map((tab) => (
                            <button
                              key={tab.key}
                              type="button"
                              onClick={() => {
                                setQuickCategoryTab(tab.key);
                              }}
                              className={`py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer truncate ${
                                quickCategoryTab === tab.key
                                  ? 'bg-purple-600 text-white shadow-xs font-black'
                                  : 'text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-white [body.light-theme_&]:hover:text-purple-900'
                              }`}
                            >
                              <span>{tab.icon} {tab.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* 1 Kolom Input Teks Fleksibel Ukuran / Isi Kemasan (Opsional) */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 flex items-center justify-between">
                            <span>Ukuran / Isi Kemasan (Opsional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Isi 24 botol, Netto 5 kg, 12 sachet, dll."
                            value={intakePackaging}
                            onChange={(e) => setIntakePackaging(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                hppInputRef.current?.focus();
                              }
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:border-purple-400 focus:bg-white outline-hidden transition-colors font-medium placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* d. Tier HPP & e. Kalkulator Margin Otomatis (Span 4) */}
                    <div className="lg:col-span-4 p-3.5 rounded-2xl bg-slate-950/70 [body.light-theme_&]:bg-white border border-slate-700/60 [body.light-theme_&]:border-slate-200 space-y-2.5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-xs">
                      {/* d. Tier HPP (Pilihan Retail vs Grosir) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-purple-400 [body.light-theme_&]:text-purple-700 tracking-wider">
                            d. Tier HPP (Tebus Supplier)
                          </span>
                          <div className="flex items-center gap-1 bg-slate-900 [body.light-theme_&]:bg-slate-100 p-0.5 rounded-lg border border-slate-800 [body.light-theme_&]:border-slate-200">
                            <button
                              type="button"
                              onClick={() => setIntakeTargetTier('retail')}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                intakeTargetTier === 'retail'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-white'
                              }`}
                            >
                              Retail / Toko Kecil
                            </button>
                            <button
                              type="button"
                              onClick={() => setIntakeTargetTier('grosir')}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                intakeTargetTier === 'grosir'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-white'
                              }`}
                            >
                              Grosir / Pangkalan / B2B
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">Rp</span>
                          <input
                            ref={hppInputRef}
                            type="number"
                            min="0"
                            step="100"
                            required
                            value={intakeHpp}
                            onChange={(e) => setIntakeHpp(Math.max(0, Number(e.target.value)))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                marginInputRef.current?.focus();
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-cyan-300 [body.light-theme_&]:text-indigo-900 font-mono font-bold focus:border-purple-400 outline-hidden transition-colors"
                            title="Harga Pokok Pembelian per unit"
                          />
                        </div>
                      </div>

                      {/* e. Kalkulator Persentase Margin Otomatis */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-purple-400 [body.light-theme_&]:text-purple-700 tracking-wider flex items-center gap-1">
                            <Percent className="w-3 h-3 text-amber-400" />
                            <span>e. Preset Margin Otomatis</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              ref={marginInputRef}
                              type="number"
                              step="0.5"
                              value={intakeMarginPercent}
                              onChange={(e) => setIntakeMarginPercent(Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveSkuIntake();
                                }
                              }}
                              className="w-14 px-1.5 py-0.5 text-[11px] rounded-lg bg-slate-900 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-amber-300 [body.light-theme_&]:text-amber-800 font-mono font-bold text-center outline-hidden"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                        </div>

                        {/* Preset margin cepat */}
                        <div className="flex items-center gap-1">
                          {[5, 10, 15, 20, 25].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setIntakeMarginPercent(pct)}
                              className={`flex-1 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                                intakeMarginPercent === pct
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:text-slate-700 border border-slate-700 [body.light-theme_&]:border-slate-300'
                              }`}
                            >
                              +{pct}%
                            </button>
                          ))}
                        </div>

                        {/* Hasil Kalkulasi Harga Jual Realtime */}
                        <div className="p-2 rounded-xl bg-purple-950/40 [body.light-theme_&]:bg-purple-100/70 border border-purple-500/30 text-[10.5px] space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-300 [body.light-theme_&]:text-slate-700">Harga Jual Target:</span>
                            <span className="text-emerald-400 [body.light-theme_&]:text-emerald-800 font-mono font-black text-xs">
                              Rp {calculatedSellingPrice.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">
                            <span>Laba Kotor: +Rp {(calculatedSellingPrice - Number(intakeHpp)).toLocaleString('id-ID')}</span>
                            <span>Retail: Rp {intakePriceRetail.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer & Execution Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-500/20 [body.light-theme_&]:border-purple-200">
                    <div className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      <span>
                        ⌨️ Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-900 [body.light-theme_&]:bg-slate-200 border border-slate-700 [body.light-theme_&]:border-slate-300 font-mono text-[10px] text-slate-200 [body.light-theme_&]:text-slate-800">Enter</kbd> untuk menyimpan langsung &amp; kursor otomatis kembali siap scan produk berikutnya!
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        ref={saveButtonRef}
                        type="submit"
                        id="btn-save-sku-barcode-intake"
                        disabled={isSyncingGas}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-950/50 flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-purple-400/50 disabled:opacity-60"
                      >
                        <Save className={`w-3.5 h-3.5 ${isSyncingGas ? 'animate-spin' : ''}`} />
                        <span>{isSyncingGas ? 'Menyinkronkan...' : '💾 Simpan & Perbarui Katalog SKU'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Product SKU Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 [body.light-theme_&]:border-slate-200">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="sticky top-0 bg-slate-900/95 [body.light-theme_&]:bg-slate-100 z-10 border-b-2 border-slate-800 [body.light-theme_&]:border-slate-300 text-[10px] font-extrabold uppercase text-slate-400 [body.light-theme_&]:text-slate-900">
                <tr>
                  <th className="py-2.5 px-3">Kode & Produk</th>
                  <th className="py-2.5 px-2">Kategori & Merek</th>
                  <th className="py-2.5 px-2">Supplier Pabrik</th>
                  <th className="py-2.5 px-2 text-right">Stok Fisik</th>
                  <th className="py-2.5 px-2 text-right">HPP Modal</th>
                  <th className="py-2.5 px-2 text-right">Tier 1: Pangkalan</th>
                  <th className="py-2.5 px-2 text-right">Tier 2: Toko</th>
                  <th className="py-2.5 px-2 text-right">Tier 3: Eceran</th>
                  <th className="py-2.5 px-2 text-center">Margin Depo</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200">
                {filteredProducts.map((prod) => {
                  const marginAmt = prod.priceToko - prod.hpp;
                  const marginPct = prod.priceToko > 0 ? ((marginAmt / prod.priceToko) * 100).toFixed(1) : '0';
                  const warn = calculateStockWarning(prod);

                  return (
                    <tr
                      key={prod.id}
                      className="border-b border-slate-800/60 [body.light-theme_&]:border-slate-200 hover:bg-slate-900/40 [body.light-theme_&]:hover:bg-purple-50/40 transition-colors"
                    >
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-cyan-400 [body.light-theme_&]:text-indigo-800 font-extrabold bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            SKU: {prod.sku || prod.id}
                          </span>
                          {prod.barcode && (
                            <span className="font-mono text-[9px] text-slate-300 [body.light-theme_&]:text-slate-700 bg-slate-900 [body.light-theme_&]:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-700/60 flex items-center gap-1">
                              <span>|||</span>
                              <span>{prod.barcode}</span>
                            </span>
                          )}
                          {prod.parentCategory === 'AIR_MINUM' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold">
                              💧 Air
                            </span>
                          )}
                          {prod.parentCategory === 'FMCG_FOOD' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                              🌾 Food
                            </span>
                          )}
                          {prod.parentCategory === 'FMCG_NON_FOOD' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                              🧼 Homecare
                            </span>
                          )}
                          {prod.parentCategory === 'NON_FMCG_LOGISTIK' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold">
                              📦 Non-FMCG
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white [body.light-theme_&]:text-slate-900 text-xs mt-1">
                          {prod.name}
                        </div>
                        <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center gap-2 mt-0.5">
                          <span>Satuan: <strong className="text-slate-300 [body.light-theme_&]:text-slate-800">{prod.unit}</strong></span>
                          {prod.uomLevels && prod.uomLevels.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 [body.light-theme_&]:text-indigo-800 font-bold border border-indigo-500/30">
                              Multi-UoM: 1 {prod.uomLevels[0].unit} = {prod.uomLevels[0].conversionRatio} {prod.unit}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold bg-purple-500/20 text-purple-300 [body.light-theme_&]:bg-purple-100 [body.light-theme_&]:text-purple-800 border border-purple-500/30">
                          {prod.category}
                        </span>
                        <div className="text-[10px] text-slate-300 [body.light-theme_&]:text-slate-700 font-semibold mt-0.5">
                          {prod.brand}
                        </div>
                        {(prod.batchNumber || prod.expiredDate) && (
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono">
                            {prod.batchNumber && (
                              <span className="text-slate-400 [body.light-theme_&]:text-slate-600">
                                #{prod.batchNumber}
                              </span>
                            )}
                            {prod.expiredDate && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 [body.light-theme_&]:text-rose-700 font-bold border border-rose-500/30">
                                Exp: {prod.expiredDate}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-[11px] text-slate-300 [body.light-theme_&]:text-slate-800">
                        {prod.supplier}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="font-mono font-black text-white [body.light-theme_&]:text-slate-900 text-xs">
                          {prod.stock.toLocaleString('id-ID')} {prod.unit}
                        </div>
                        <div
                          className={`text-[9px] font-bold ${
                            warn.isCritical
                              ? 'text-rose-400'
                              : warn.isWarning
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {warn.isCritical ? '⚠️ Kritis (PO)' : warn.isWarning ? '⚡ Waspada' : '✓ Aman'}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-cyan-300 [body.light-theme_&]:text-cyan-800">
                        Rp {prod.hpp.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-300 [body.light-theme_&]:text-slate-800">
                        Rp {prod.pricePangkalan.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-black text-amber-300 [body.light-theme_&]:text-amber-700">
                        Rp {prod.priceToko.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-emerald-300 [body.light-theme_&]:text-emerald-700">
                        Rp {prod.priceRetail.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[11px] text-emerald-400 [body.light-theme_&]:text-emerald-700 font-bold">
                        +{marginPct}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(prod)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:text-slate-800 text-[10px] font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: [🏷️ KATEGORI] (NO WhatsApp, NO Add New Button) */}
      {/* ======================================================== */}
      {activeTab === 'kategori' && (
        <div className="flex-1 min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 flex flex-col overflow-hidden shadow-sm">
          {/* Header Info Banner: Auto-Populate Notice */}
          <div className="p-2.5 px-3 bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">🏷️</span>
              <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900">
                Daftar Kategori Produk (Auto-Populate Terpadu)
              </span>
            </div>
            <div className="text-[10px] text-purple-300 [body.light-theme_&]:text-purple-800 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 font-semibold">
              ℹ️ Sinkron otomatis satu pintu dari Form Produk Retail & Wholesale (Tanpa Tombol Add Manual)
            </div>
          </div>

          {/* Table: Kategori (CLEAN: NO WHATSAPP ICON, NO ADD NEW BUTTON) */}
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="sticky top-0 bg-slate-900/95 [body.light-theme_&]:bg-slate-100 z-10 border-b-2 border-slate-800 [body.light-theme_&]:border-slate-300 text-[10px] font-extrabold uppercase text-slate-400 [body.light-theme_&]:text-slate-900">
                <tr>
                  <th className="py-2.5 px-4">Nama Kategori</th>
                  <th className="py-2.5 px-3 text-center">Jumlah SKU Terdaftar</th>
                  <th className="py-2.5 px-3 text-right">Total Stok Fisik</th>
                  <th className="py-2.5 px-3 text-right">Estimasi Modal HPP</th>
                  <th className="py-2.5 px-3 text-center">Status Sinkronisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200">
                {categoriesList.map((cat, idx) => (
                  <tr
                    key={cat.name}
                    className="border-b border-slate-800/60 [body.light-theme_&]:border-slate-200 hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white [body.light-theme_&]:text-slate-900 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                        Kelompok Barang SKU Depo #{idx + 1}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400 [body.light-theme_&]:text-indigo-800">
                      {cat.count} Produk
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-200 [body.light-theme_&]:text-slate-900">
                      {cat.totalStock.toLocaleString('id-ID')} Unit
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 [body.light-theme_&]:text-emerald-700">
                      Rp {cat.totalValue.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/20 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 border border-emerald-500/30">
                        ✓ Terintegrasi Form Produk
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: [🏢 MEREK] (NO WhatsApp, NO Add New Button) */}
      {/* ======================================================== */}
      {activeTab === 'merek' && (
        <div className="flex-1 min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 flex flex-col overflow-hidden shadow-sm">
          {/* Header Info Banner: Auto-Populate Notice */}
          <div className="p-2.5 px-3 bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">🏢</span>
              <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900">
                Daftar Merek / Brand (Auto-Populate Terpadu)
              </span>
            </div>
            <div className="text-[10px] text-purple-300 [body.light-theme_&]:text-purple-800 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 font-semibold">
              ℹ️ Sinkron otomatis satu pintu dari Form Produk (Tanpa Tombol Add Manual & Tanpa Ikon WA)
            </div>
          </div>

          {/* Table: Merek (CLEAN: NO WHATSAPP ICON, NO ADD NEW BUTTON) */}
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="sticky top-0 bg-slate-900/95 [body.light-theme_&]:bg-slate-100 z-10 border-b-2 border-slate-800 [body.light-theme_&]:border-slate-300 text-[10px] font-extrabold uppercase text-slate-400 [body.light-theme_&]:text-slate-900">
                <tr>
                  <th className="py-2.5 px-4">Nama Merek / Brand</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Varian SKU</th>
                  <th className="py-2.5 px-3 text-right">Total Stok Fisik</th>
                  <th className="py-2.5 px-3">Prinsipal Pabrik Terkait</th>
                  <th className="py-2.5 px-3 text-center">Status Lisensi Depo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200">
                {brandsList.map((b) => (
                  <tr
                    key={b.name}
                    className="border-b border-slate-800/60 [body.light-theme_&]:border-slate-200 hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white [body.light-theme_&]:text-slate-900 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        {b.name}
                      </div>
                      <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                        Brand Mitra Resmi Depo
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400 [body.light-theme_&]:text-indigo-800">
                      {b.count} SKU
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-200 [body.light-theme_&]:text-slate-900">
                      {b.totalStock.toLocaleString('id-ID')} Unit
                    </td>
                    <td className="py-3 px-3 text-slate-300 [body.light-theme_&]:text-slate-700 font-semibold">
                      {b.principal}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-cyan-500/20 text-cyan-300 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-800 border border-cyan-500/30">
                        Mitra Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: [🚚 SUPPLIER] (NO Add New Button, PERTAHANKAN ICON WHATSAPP UNTUK PO) */}
      {/* ========================================================================= */}
      {activeTab === 'supplier' && (
        <div className="flex-1 min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 flex flex-col overflow-hidden shadow-sm">
          {/* Header Info Banner: Auto-Populate Notice */}
          <div className="p-2.5 px-3 bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">🚚</span>
              <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900">
                Daftar Supplier & Pabrik Pengadaan
              </span>
            </div>
            <div className="text-[10px] text-emerald-300 [body.light-theme_&]:text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
              ℹ️ Ikon WhatsApp dipertahankan untuk kemudahan pemesanan / Purchase Order (PO) Pabrik
            </div>
          </div>

          {/* Table: Supplier (NO ADD NEW BUTTON, BUT WITH WHATSAPP CLICK TO CHAT) */}
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="sticky top-0 bg-slate-900/95 [body.light-theme_&]:bg-slate-100 z-10 border-b-2 border-slate-800 [body.light-theme_&]:border-slate-300 text-[10px] font-extrabold uppercase text-slate-400 [body.light-theme_&]:text-slate-900">
                <tr>
                  <th className="py-2.5 px-4">Nama Pabrik / Supplier</th>
                  <th className="py-2.5 px-3 text-center">Jumlah SKU</th>
                  <th className="py-2.5 px-3">Alamat / Wilayah Pabrik</th>
                  <th className="py-2.5 px-3">Kontak WhatsApp Logistik</th>
                  <th className="py-2.5 px-3 text-center">Aksi Pemesanan (PO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200">
                {suppliersList.map((sup) => {
                  const cleanPhone = sup.phone.replace(/[^0-9]/g, '');
                  const waText = encodeURIComponent(
                    `Halo Logistik/Supplier *${sup.name}*, kami dari Depo Sumber Segar ingin menanyakan konfirmasi jadwal restock barang & PO pabrik hari ini. Terima kasih.`
                  );
                  const waUrl = `https://wa.me/62${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=${waText}`;

                  return (
                    <tr
                      key={sup.name}
                      className="border-b border-slate-800/60 [body.light-theme_&]:border-slate-200 hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white [body.light-theme_&]:text-slate-900 text-xs flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          {sup.name}
                        </div>
                        <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                          Pabrik Pengadaan Resmi
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400 [body.light-theme_&]:text-indigo-800">
                        {sup.count} SKU
                      </td>
                      <td className="py-3 px-3 text-slate-300 [body.light-theme_&]:text-slate-700">
                        {sup.address}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-xs text-slate-200 [body.light-theme_&]:text-slate-900 font-bold">
                          {sup.phone}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {/* WA ICON RETAINED ON SUPPLIER FOR PO ORDERING */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 border border-emerald-500/40 text-xs font-bold transition-all"
                          title="Hubungi WhatsApp Logistik Pabrik untuk PO"
                        >
                          <i className="fa-brands fa-whatsapp text-emerald-400 text-sm"></i>
                          <span>Kirim Pesan PO</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: [👥 PELANGGAN] (Nama Usaha, Tier Kasir Slate/Cyan/Emerald, + Add New) */}
      {/* ========================================================================= */}
      {activeTab === 'pelanggan' && (
        <div className="flex-1 min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 flex flex-col overflow-hidden shadow-sm">
          {/* Header Controls: Search, Tier Filter & Add New */}
          <div className="p-2 px-3 bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-users text-cyan-400"></i>
              <span className="text-xs font-extrabold text-white [body.light-theme_&]:text-slate-900">
                Master Pelanggan & Penetapan Tier Kasir POS
              </span>
              <span className="text-[10px] font-mono text-slate-400 [body.light-theme_&]:text-slate-600 font-bold">
                ({filteredCustomers.length} Pelanggan)
              </span>
            </div>

            {/* Filter by Tier & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  placeholder="Cari Toko / PIC / No HP..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400 w-48"
                />
              </div>

              {/* Tier Filter Dropdown */}
              <select
                value={customerTierFilter}
                onChange={(e) => setCustomerTierFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="Semua">Semua Tier Kasir</option>
                <option value="Retail / Ecer">Retail / Ecer (Slate)</option>
                <option value="Member">Member (Cyan/Gold)</option>
                <option value="Grosir / Toko">Grosir / Toko (Emerald)</option>
              </select>

              {/* Prominent [+ Add New] Pelanggan */}
              <button
                type="button"
                onClick={() => setIsAddCustomerFormOpen(true)}
                className="px-3 py-1 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center gap-1.5 cursor-pointer transition-all border border-cyan-300 active:scale-95"
              >
                <i className="fa-solid fa-user-plus text-xs"></i>
                <span>+ Add New Pelanggan</span>
              </button>
            </div>
          </div>

          {/* Table: Master Pelanggan */}
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="sticky top-0 bg-slate-900/95 [body.light-theme_&]:bg-slate-100 z-10 border-b-2 border-slate-800 [body.light-theme_&]:border-slate-300 text-[10px] font-extrabold uppercase text-slate-400 [body.light-theme_&]:text-slate-900">
                <tr>
                  <th className="py-2.5 px-3">Kode Member & ID</th>
                  <th className="py-2.5 px-3">Nama Usaha / Toko</th>
                  <th className="py-2.5 px-3">Nama Pelanggan (PIC)</th>
                  <th className="py-2.5 px-3 text-center">Tier Harga Kasir</th>
                  <th className="py-2.5 px-3">No. HP / WhatsApp</th>
                  <th className="py-2.5 px-3">Alamat / Wilayah</th>
                  <th className="py-2.5 px-3 text-right">Hutang Tabung</th>
                  <th className="py-2.5 px-3 text-right">Sisa Piutang</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200">
                {filteredCustomers.map((c) => {
                  const picName = c.ownerName || (c.type === 'B2B' ? '-' : c.name);
                  const storeName = c.businessName || (c.type === 'B2B' ? c.name : 'Non-Toko / Personal');
                  const tier = c.kasirTier || (c.priceTier === 'Pangkalan' ? 'Grosir / Toko' : c.priceTier === 'Toko' ? 'Member' : 'Retail / Ecer');

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-slate-800/60 [body.light-theme_&]:border-slate-200 hover:bg-slate-900/40 [body.light-theme_&]:hover:bg-cyan-50/40 transition-colors"
                    >
                      {/* Kode Member (Auto) */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[11px] text-cyan-400 [body.light-theme_&]:text-indigo-800 font-extrabold">
                          {c.memberCode || `MBR-${c.id.slice(-3)}`}
                        </div>
                        <div className="font-mono text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500">
                          {c.id}
                        </div>
                      </td>

                      {/* Nama Usaha / Toko (Contoh: Toko Berkah / Non-Toko / Personal) */}
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-white [body.light-theme_&]:text-slate-900 text-xs">
                          {storeName}
                        </div>
                        {c.b2bCategory && (
                          <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500">
                            {c.b2bCategory}
                          </div>
                        )}
                      </td>

                      {/* Nama Pelanggan (PIC) */}
                      <td className="py-2.5 px-3 font-semibold text-slate-200 [body.light-theme_&]:text-slate-800">
                        {picName !== '-' ? picName : c.name}
                      </td>

                      {/* Tier Harga Kasir: Retail (Slate), Member (Cyan/Gold), Grosir/Toko (Emerald) */}
                      <td className="py-2.5 px-3 text-center">
                        {tier === 'Retail / Ecer' && (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-200 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:text-slate-800 border border-slate-600 [body.light-theme_&]:border-slate-300 shadow-sm">
                            Retail / Ecer
                          </span>
                        )}
                        {tier === 'Member' && (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800 border border-cyan-400 [body.light-theme_&]:border-amber-400 shadow-sm">
                            ★ Member
                          </span>
                        )}
                        {tier === 'Grosir / Toko' && (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 border border-emerald-400 [body.light-theme_&]:border-emerald-400 shadow-sm">
                            🏢 Grosir / Toko
                          </span>
                        )}
                      </td>

                      {/* WhatsApp / HP */}
                      <td className="py-2.5 px-3 font-mono text-slate-300 [body.light-theme_&]:text-slate-800 font-bold">
                        {c.phone}
                      </td>

                      {/* Alamat / Wilayah */}
                      <td className="py-2.5 px-3 max-w-xs truncate text-[11px] text-slate-300 [body.light-theme_&]:text-slate-700">
                        {c.address}
                      </td>

                      {/* Hutang Tabung */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400 [body.light-theme_&]:text-amber-800">
                        {c.emptyGallonDebt || 0} Tabung
                      </td>

                      {/* Sisa Piutang */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 [body.light-theme_&]:text-rose-700">
                        Rp {(c.currentReceivable || 0).toLocaleString('id-ID')}
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            // Cycle tier on click for rapid configuration
                            const nextTier: MasterCustomerTier =
                              tier === 'Retail / Ecer'
                                ? 'Member'
                                : tier === 'Member'
                                ? 'Grosir / Toko'
                                : 'Retail / Ecer';

                            setCustomers((prev) =>
                              prev.map((item) =>
                                item.id === c.id
                                  ? {
                                      ...item,
                                      kasirTier: nextTier,
                                      priceTier:
                                        nextTier === 'Grosir / Toko'
                                          ? 'Pangkalan'
                                          : nextTier === 'Member'
                                          ? 'Toko'
                                          : 'Eceran',
                                    }
                                  : item
                              )
                            );
                            setNotificationMsg(`✓ Tier harga kasir untuk ${c.name} diubah menjadi: ${nextTier}`);
                            setTimeout(() => setNotificationMsg(null), 3000);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:text-slate-800 font-bold cursor-pointer"
                          title="Klik untuk ubah Tier Kasir cepat"
                        >
                          Ubah Tier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: [📋 RIWAYAT DO PABRIK] */}
      {/* ======================================================== */}
      {activeTab === 'riwayat-do' && (
        <div className="flex-1 min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 flex flex-col overflow-hidden shadow-sm">
          <div className="p-2.5 px-3 bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
              <i className="fa-solid fa-truck-ramp-box text-emerald-400"></i>
              Riwayat Validasi Surat Jalan (DO) Masuk Pabrik
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Total {receipts.length} Dokumen Penerimaan
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="sticky top-0 bg-slate-900/95 [body.light-theme_&]:bg-slate-100 z-10 border-b-2 border-slate-800 [body.light-theme_&]:border-slate-300 text-[10px] font-extrabold uppercase text-slate-400 [body.light-theme_&]:text-slate-900">
                <tr>
                  <th className="py-2 px-3">No. DO Pabrik</th>
                  <th className="py-2 px-3">Tanggal & Jam</th>
                  <th className="py-2 px-3">Supplier & Ekspedisi</th>
                  <th className="py-2 px-3">Rincian Barang Diterima</th>
                  <th className="py-2 px-3 text-right">Tukar Tabung Kosong</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200">
                {receipts.map((rcv) => (
                  <tr key={rcv.id} className="border-b border-slate-800/60 [body.light-theme_&]:border-slate-200 hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 [body.light-theme_&]:text-indigo-800">
                      {rcv.doNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 [body.light-theme_&]:text-slate-700">
                      {rcv.receivedDate}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white [body.light-theme_&]:text-slate-900 text-xs">{rcv.supplier}</div>
                      <div className="text-[10px] text-slate-400">{rcv.vehiclePlate}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      {rcv.items.map((it, i) => (
                        <div key={i} className="text-[11px] text-slate-200 [body.light-theme_&]:text-slate-800">
                          • {it.productName}: <strong>{it.goodCondition}</strong> {it.unit}
                          {it.damagedCondition > 0 && <span className="text-rose-400 font-bold ml-1">({it.damagedCondition} rusak)</span>}
                        </div>
                      ))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400 [body.light-theme_&]:text-amber-800">
                      {rcv.emptyGallonsExchanged} Tabung
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/20 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 border border-emerald-500/30">
                        {rcv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: [💰 SKEMA KOMISI PRODUK] */}
      {/* ======================================================== */}
      {activeTab === 'komisi' && (
        <div className="flex-1 min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 flex flex-col overflow-hidden shadow-sm p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                <i className="fa-solid fa-hand-holding-dollar text-purple-400"></i>
                Skema Tarif Dasar Komisi per Kategori
              </h3>
              <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                Porsi Pengantar / Kurir ({localCommission.courierSharePercent}%) & Salesman ({localCommission.salesmanSharePercent}%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 [body.light-theme_&]:bg-slate-50">
              <div className="text-xs font-bold text-cyan-400 mb-1">Galon 19L (Per Tabung)</div>
              <div className="text-lg font-black text-white [body.light-theme_&]:text-slate-900 font-mono">
                Rp {localCommission.gallonBaseRate.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Kurir: Rp {Math.round(localCommission.gallonBaseRate * 0.75)} | Sales: Rp {Math.round(localCommission.gallonBaseRate * 0.25)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 [body.light-theme_&]:bg-slate-50">
              <div className="text-xs font-bold text-amber-400 mb-1">Kemasan Botol (Per Dus/Karton)</div>
              <div className="text-lg font-black text-white [body.light-theme_&]:text-slate-900 font-mono">
                Rp {localCommission.bottleBaseRate.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Kurir: Rp {Math.round(localCommission.bottleBaseRate * 0.75)} | Sales: Rp {Math.round(localCommission.bottleBaseRate * 0.25)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 [body.light-theme_&]:bg-slate-50">
              <div className="text-xs font-bold text-emerald-400 mb-1">Kemasan Gelas / Cup (Per Dus)</div>
              <div className="text-lg font-black text-white [body.light-theme_&]:text-slate-900 font-mono">
                Rp {localCommission.cupBaseRate.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Kurir: Rp {Math.round(localCommission.cupBaseRate * 0.75)} | Sales: Rp {Math.round(localCommission.cupBaseRate * 0.25)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: [+ ADD NEW] PELANGGAN (Requirement 4: Nama Usaha & Tier Kasir)   */}
      {/* ========================================================================= */}
      {isAddCustomerFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 [body.light-theme_&]:bg-white border-2 border-cyan-400/60 [body.light-theme_&]:border-cyan-300 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 [body.light-theme_&]:text-slate-900 flex flex-col">
            {/* Modal Header */}
            <div className="p-3.5 px-4 bg-slate-950/80 [body.light-theme_&]:bg-cyan-50/80 border-b border-slate-800 [body.light-theme_&]:border-cyan-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold border border-cyan-400/40">
                  <i className="fa-solid fa-user-plus"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900 leading-tight">
                    + Add New Pelanggan & Penetapan Tier Kasir
                  </h3>
                  <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                    Sinkron otomatis ke Kasir POS & penentuan harga jual aktif
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerFormOpen(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddNewCustomer} className="p-4 space-y-3.5 text-xs">
              {/* Kode Member (Auto) */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase">
                  Kode Member (Auto Generated)
                </label>
                <input
                  type="text"
                  value={`MBR-${String(customers.length + 1).padStart(3, '0')}`}
                  readOnly
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 [body.light-theme_&]:bg-slate-100 border border-slate-800 [body.light-theme_&]:border-slate-300 text-cyan-400 font-mono font-black"
                />
              </div>

              {/* Nama Usaha / Toko */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase">
                  Nama Usaha / Toko <span className="text-slate-500">(Beri strip (-) jika perorangan)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Toko Berkah, Warung Madura Bu Sri, CV Sinar Jaya"
                  value={newCustBusiness}
                  onChange={(e) => setNewCustBusiness(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>

              {/* Nama Pelanggan (PIC) */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase">
                  Nama Pelanggan (PIC / Penanggung Jawab) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ibu Sri Wahyuni, Bpk. Somad"
                  value={newCustPic}
                  onChange={(e) => setNewCustPic(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400 font-semibold"
                />
              </div>

              {/* Nomor HP / WhatsApp */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase">
                  Nomor HP / WhatsApp *
                </label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Alamat / Wilayah */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase">
                  Alamat Lengkap / Wilayah Pengantaran
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. Raya Subang No. 123, RT/RW, Patokan..."
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 text-xs focus:outline-none focus:border-cyan-400"
                ></textarea>
              </div>

              {/* Default Tier Harga Kasir (Dropdown: Ecer / Member / Grosir) */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase">
                  Default Tier Harga Kasir (Penentu Harga Aktif POS) *
                </label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewCustTier('Retail / Ecer')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                      newCustTier === 'Retail / Ecer'
                        ? 'bg-slate-700 text-white border-slate-500 shadow-md ring-2 ring-slate-400'
                        : 'bg-slate-950 [body.light-theme_&]:bg-slate-100 text-slate-400 border-slate-800'
                    }`}
                  >
                    <div>Retail / Ecer</div>
                    <div className="text-[9px] font-normal text-slate-300">Badge Slate</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCustTier('Member')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                      newCustTier === 'Member'
                        ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 shadow-md ring-2 ring-cyan-400'
                        : 'bg-slate-950 [body.light-theme_&]:bg-slate-100 text-slate-400 border-slate-800'
                    }`}
                  >
                    <div>Member</div>
                    <div className="text-[9px] font-normal text-cyan-300">Badge Cyan/Gold</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCustTier('Grosir / Toko')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                      newCustTier === 'Grosir / Toko'
                        ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-md ring-2 ring-emerald-400'
                        : 'bg-slate-950 [body.light-theme_&]:bg-slate-100 text-slate-400 border-slate-800'
                    }`}
                  >
                    <div>Grosir / Toko</div>
                    <div className="text-[9px] font-normal text-emerald-300">Badge Emerald</div>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 text-slate-950 text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  ✓ Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT MASTER DENGAN MULTI-UOM & EXPIRED DATE */}
      {editingProduct && (
        <ProductModal
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          initialProduct={editingProduct}
          onSaveProduct={(updatedProd) => {
            const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
            setProducts(updated);
            if (onUpdateProducts) onUpdateProducts(updated);
            setEditingProduct(null);
            setNotificationMsg(`✓ Berhasil memperbarui data SKU [${updatedProd.id}] ${updatedProd.name}!`);
            setTimeout(() => setNotificationMsg(null), 3500);
          }}
          existingCount={products.length}
        />
      )}

      {/* Existing Full Product Modal */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSaveProduct={(newProd) => {
            const updated = [newProd, ...products];
            setProducts(updated);
            if (onAddProduct) onAddProduct(newProd);
            if (onUpdateProducts) onUpdateProducts(updated);
            setIsProductModalOpen(false);
            setNotificationMsg(`✓ Produk [${newProd.id}] ${newProd.name} berhasil ditambahkan!`);
            setTimeout(() => setNotificationMsg(null), 3500);
          }}
          existingCount={products.length}
        />
      )}

      {/* Customer Modal Fallback */}
      {isCustomerModalOpen && (
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSaveCustomer={(newCust) => {
            const nextIdx = customers.length + 1;
            const enhancedCust: CustomerMasterItemEnhanced = {
              ...newCust,
              businessName: newCust.type === 'B2B' ? newCust.name : 'Non-Toko / Personal',
              memberCode: `MBR-${String(nextIdx).padStart(3, '0')}`,
              kasirTier: newCust.type === 'B2B' ? 'Grosir / Toko' : 'Retail / Ecer',
            };
            setCustomers([enhancedCust, ...customers]);
            if (onAddCustomer) onAddCustomer(newCust, true);
            setIsCustomerModalOpen(false);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRASI SUPPLIER PABRIK BARU                                    */}
      {/* ========================================================================= */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 [body.light-theme_&]:bg-white border-2 border-purple-500/40 shadow-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 [body.light-theme_&]:text-purple-600 shadow-inner">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                    <span>Tambah Supplier / Pabrik Baru</span>
                  </h3>
                  <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-500">
                    Daftarkan identitas mitra pemasok / principal barang depo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewSupplierModalOpen(false);
                  setTimeout(() => supplierSelectRef.current?.focus(), 60);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 [body.light-theme_&]:hover:bg-slate-100 text-slate-400 hover:text-white [body.light-theme_&]:hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewSupplier} className="space-y-3">
              {/* Nama Supplier / Pabrik */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 [body.light-theme_&]:text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Nama Supplier / Pabrik:</span>
                  </span>
                  <span className="text-[10px] text-rose-400 font-semibold">*Wajib</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: Pabrik Danone Subang / PT Sariguna Primatirta..."
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-bold focus:border-purple-400 outline-hidden"
                />
              </div>

              {/* No Telepon / WA Sales PIC */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 [body.light-theme_&]:text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>No. Telepon / WA Sales PIC:</span>
                  </span>
                  <span className="text-[10px] text-rose-400 font-semibold">*Wajib</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081122334455 / 08123456789"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:border-purple-400 outline-hidden"
                />
              </div>

              {/* Nama PIC / Sales */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 [body.light-theme_&]:text-slate-800 flex items-center gap-1">
                  <span>Nama Sales PIC / Kontak Depo:</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Hendra (Sales Area Subang) / Bu Rina..."
                  value={newSupPic}
                  onChange={(e) => setNewSupPic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-bold focus:border-purple-400 outline-hidden"
                />
              </div>

              {/* Alamat / Depo Asal */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 [body.light-theme_&]:text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Alamat / Depo Asal:</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kawasan Industri Subang / Surya Cipta Karawang..."
                  value={newSupAddress}
                  onChange={(e) => setNewSupAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-normal focus:border-purple-400 outline-hidden resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewSupplierModalOpen(false);
                    setTimeout(() => supplierSelectRef.current?.focus(), 60);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-950/50 cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 border border-purple-400/50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>💾 Simpan Supplier Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
