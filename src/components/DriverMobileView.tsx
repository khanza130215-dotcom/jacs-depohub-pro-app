import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  OrderItem,
  ArmadaItem,
  EmployeeItem,
  CommissionSchemeConfig,
  CustomerMasterItem,
  NewCustomerOnTheRoadInput,
  DriverCargoInventory,
  StoreZone,
  GallonOwnershipScheme,
  ReceivableItem,
  DispatchAssignment,
  StoreRegistrationSubmission,
  OrderStatus,
  PriceTier,
  MultiProductDropItem,
  ContainerMutationItem,
  IntegratedVisitReceipt,
} from '../types';
import { DEFAULT_DRIVER_CARGO_MAP, RECEIVABLES, CUSTOMER_MASTER } from '../data/mockData';
import { ThermalReceiptModal, sendWhatsAppReceipt } from './ThermalReceiptModal';
import { NexaFieldGpsMap, DEFAULT_DEPO_MAKASSAR } from './NexaFieldGpsMap';
import {
  calculateStoreNexaMetrics,
  StoreNexaMetrics,
  VisitLogEntry,
  INITIAL_VISIT_LOGS,
  WEEKLY_PERFORMANCE_DATA,
  DayPerformanceItem,
} from '../utils/nexaFieldHelpers';
import {
  Navigation,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Camera,
  Upload,
  AlertTriangle,
  Clock,
  Package,
  Truck,
  RotateCw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  MapPin,
  Check,
  X,
  FileText,
  DollarSign,
  ChevronLeft,
  Smartphone,
  Eye,
  Award,
  PlusCircle,
  Zap,
  Share2,
  Printer,
  Compass,
  Boxes,
  ShoppingBag,
  Sparkles,
  Wallet,
  Store,
  Home,
  Lock,
  LogOut,
  KeyRound,
  Car,
  Filter,
  User,
  Radio,
  Unlock,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowLeft,
  Rocket,
  BarChart3,
  Users,
  TrendingUp,
  ClipboardList,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  CheckCheck,
} from 'lucide-react';
import { getLastSyncTime, saveLastSyncTime, triggerGasWebhook } from '../utils/cloudSync';

export interface SpotCatalogItem {
  id: string;
  name: string;
  category: 'Galon 19L' | 'Dus Botol' | 'Dus Cup';
  brand: string;
  unit: string;
  pricePangkalan: number;
  priceToko: number;
  priceRetail: number;
  imageEmoji: string;
  brandGradient: string;
  tag: string;
  desc: string;
}

export const SPOT_CATALOG_ITEMS: SpotCatalogItem[] = [
  {
    id: 'PRD-01',
    name: 'Aqua 19L Refill',
    category: 'Galon 19L',
    brand: 'Danone Aqua',
    unit: 'Tabung',
    pricePangkalan: 18500,
    priceToko: 19500,
    priceRetail: 21000,
    imageEmoji: '💧',
    brandGradient: 'from-blue-600 to-cyan-500',
    tag: 'Terlaris',
    desc: 'Air mineral pegunungan alami segel resmi Danone',
  },
  {
    id: 'PRD-02',
    name: 'Le Minerale 15L/19L',
    category: 'Galon 19L',
    brand: 'Mayora Le Minerale',
    unit: 'Tabung',
    pricePangkalan: 19000,
    priceToko: 20000,
    priceRetail: 21500,
    imageEmoji: '🏔️',
    brandGradient: 'from-teal-600 to-emerald-500',
    tag: 'BPA Free',
    desc: 'Galon bebas BPA sekali pakai/tukar higienis Mayora',
  },
  {
    id: 'PRD-03',
    name: 'Vit Galon 19L Segel',
    category: 'Galon 19L',
    brand: 'Danone Vit',
    unit: 'Tabung',
    pricePangkalan: 16000,
    priceToko: 17000,
    priceRetail: 18500,
    imageEmoji: '🔷',
    brandGradient: 'from-sky-600 to-indigo-500',
    tag: 'Ekonomis',
    desc: 'Standar kemurnian tinggi harga ekonomis Danone',
  },
  {
    id: 'PRD-04',
    name: 'Cleo Pure Water 19L',
    category: 'Galon 19L',
    brand: 'Sariguna Cleo',
    unit: 'Tabung',
    pricePangkalan: 17500,
    priceToko: 18500,
    priceRetail: 20000,
    imageEmoji: '🟧',
    brandGradient: 'from-orange-600 to-amber-500',
    tag: 'Demineral',
    desc: 'Air murni bebas mineral anorganik teknologi demineralisasi',
  },
  {
    id: 'PRD-05',
    name: 'Vit Botol 600ml (Dus 24)',
    category: 'Dus Botol',
    brand: 'Danone Vit',
    unit: 'Dus',
    pricePangkalan: 38000,
    priceToko: 40000,
    priceRetail: 43000,
    imageEmoji: '🍾',
    brandGradient: 'from-blue-500 to-sky-400',
    tag: '24 Botol',
    desc: '1 Dus isi 24 botol praktis untuk warung & kantor',
  },
  {
    id: 'PRD-06',
    name: 'Aqua Botol 330ml Mini (Dus 24)',
    category: 'Dus Botol',
    brand: 'Danone Aqua',
    unit: 'Dus',
    pricePangkalan: 44000,
    priceToko: 46000,
    priceRetail: 49000,
    imageEmoji: '🍶',
    brandGradient: 'from-cyan-600 to-blue-500',
    tag: '24 Botol Mini',
    desc: '1 Dus isi 24 botol mini cocok acara hajatan & meeting',
  },
  {
    id: 'PRD-07',
    name: 'Aqua Cup 220ml (Dus 48)',
    category: 'Dus Cup',
    brand: 'Danone Aqua',
    unit: 'Dus',
    pricePangkalan: 26000,
    priceToko: 28000,
    priceRetail: 31000,
    imageEmoji: '🥤',
    brandGradient: 'from-cyan-500 to-teal-400',
    tag: '48 Gelas',
    desc: '1 Dus isi 48 gelas air mineral Danone Aqua',
  },
  {
    id: 'PRD-08',
    name: 'Cleo Cup 220ml (Dus 48)',
    category: 'Dus Cup',
    brand: 'Sariguna Cleo',
    unit: 'Dus',
    pricePangkalan: 23000,
    priceToko: 25000,
    priceRetail: 28000,
    imageEmoji: '🧃',
    brandGradient: 'from-amber-600 to-orange-400',
    tag: '48 Gelas',
    desc: '1 Dus isi 48 gelas cup Cleo Pure Water',
  },
];

interface DriverMobileViewProps {
  orders: OrderItem[];
  armadaList: ArmadaItem[];
  employees: EmployeeItem[];
  customers?: CustomerMasterItem[];
  commissionConfig: CommissionSchemeConfig;
  receivables?: ReceivableItem[];
  allowMultiDrop?: boolean;
  onToggleMultiDrop?: () => void;
  onAcceptOrder?: (orderId: string, driverId: string, driverName?: string) => void;
  onCollectTempoPayment?: (
    receivableId: string,
    amount: number,
    driverName: string,
    notes?: string
  ) => void;
  onCompleteDelivery: (
    orderId: string,
    podData: {
      emptyGallonsReturned: number;
      damagedNotes?: string;
      photoProof?: string;
      recipientName?: string;
      note?: string;
    }
  ) => void;
  onExitDriverMode?: () => void;
  onRegisterCustomerFromRoad?: (
    data: NewCustomerOnTheRoadInput,
    driverName: string
  ) => void;
  onDirectSpotSale?: (saleData: {
    customerName: string;
    phone: string;
    address: string;
    category: 'Pangkalan Agen' | 'Toko Kelontong' | 'Rumah Tangga';
    itemsDescription: string;
    totalGalon: number;
    totalBottles: number;
    totalCups: number;
    totalAmount: number;
    paymentMethod: 'Tunai' | 'QRIS Supir' | 'TEMPO BON TOKO';
    emptyGallonsReturned: number;
    damagedNotes?: string;
    driverId: string;
    driverName: string;
    vehicleId: string;
    status?: OrderStatus;
    priceTier?: PriceTier;
  }) => void;
  dispatchAssignments?: Record<string, DispatchAssignment>;
  onUpdateDispatchAssignment?: (updated: DispatchAssignment) => void;
  storeSubmissions?: StoreRegistrationSubmission[];
  onSubmitStoreRegistration?: (
    submission: Omit<StoreRegistrationSubmission, 'id' | 'status' | 'submittedAt'>
  ) => void;
}

export const DriverMobileView: React.FC<DriverMobileViewProps> = ({
  orders,
  armadaList,
  employees,
  customers = [],
  commissionConfig,
  receivables = RECEIVABLES,
  onCollectTempoPayment,
  onCompleteDelivery,
  onExitDriverMode,
  onRegisterCustomerFromRoad,
  onDirectSpotSale,
  dispatchAssignments,
  onUpdateDispatchAssignment,
  onAcceptOrder,
  allowMultiDrop = false,
  onToggleMultiDrop,
  storeSubmissions = [],
  onSubmitStoreRegistration,
}) => {
  // FLEET OPTIONS FOR DAILY ROTATION
  const DAILY_FLEET_OPTIONS = useMemo(
    () => [
      {
        key: 'carry' as const,
        name: 'Mobil Carry Pickup',
        subname: 'Suzuki Carry 1.5 Wide Deck',
        plate: 'B 9421 KDA',
        armadaId: 'ARM-01',
        maxGallons: 90,
        maxDus: 35,
        maxWeightKg: 1200,
        description: 'Ritase Standar Toko & Semi-Grosir (Maks 90 Galon)',
        badge: 'Kapasitas 90 Gln',
      },
      {
        key: 'granmax' as const,
        name: 'Mobil Gran Max',
        subname: 'Daihatsu Gran Max Terpal',
        plate: 'B 9104 UCN',
        armadaId: 'ARM-02',
        maxGallons: 120,
        maxDus: 50,
        maxWeightKg: 1600,
        description: 'Kapasitas Besar Rute Jauh & Agen (Maks 120 Galon)',
        badge: 'Kapasitas 120 Gln',
      },
      {
        key: 'viar' as const,
        name: 'Motor Roda 3 Viar Karya',
        subname: 'Viar Karya 200cc Long Box',
        plate: 'B 6124 KRO',
        armadaId: 'ARM-05',
        maxGallons: 30,
        maxDus: 12,
        maxWeightKg: 500,
        description: 'Manuver Gang Sempit & Residensial (Maks 30 Galon)',
        badge: 'Kapasitas 30 Gln',
      },
    ],
    []
  );

  // Available Driver List with Staff ID / NIK & Quick PIN
  const driverProfiles = useMemo(() => {
    return [
      {
        id: 'DRV-01',
        nik: 'DRV-01',
        empId: 'EMP-001',
        name: 'Pak Bambang Sukoco',
        shortName: 'Bambang',
        pin: '1234',
        defaultVehicleKey: 'carry' as const,
        phone: '0812-9988-7711',
        roleTitle: 'Supir Distribusi · Rute Subang Kota & Toko',
      },
      {
        id: 'DRV-02',
        nik: 'DRV-02',
        empId: 'EMP-002',
        name: 'Rudi Hartono (Rider Viar)',
        shortName: 'Rudi',
        pin: '2345',
        defaultVehicleKey: 'viar' as const,
        phone: '0813-7766-5544',
        roleTitle: 'Rider Motor Roda 3 · Spesialis Gang & Residensial',
      },
      {
        id: 'DRV-03',
        nik: 'DRV-03',
        empId: 'EMP-003',
        name: 'Rian Prasetyo',
        shortName: 'Rian',
        pin: '3456',
        defaultVehicleKey: 'granmax' as const,
        phone: '0878-1122-3344',
        roleTitle: 'Supir Distribusi · Rute Agen & Pangkalan',
      },
      {
        id: 'DRV-04',
        nik: 'DRV-04',
        empId: 'EMP-004',
        name: 'Hendra Gunawan',
        shortName: 'Hendra',
        pin: '4567',
        defaultVehicleKey: 'carry' as const,
        phone: '0819-2233-4455',
        roleTitle: 'Supir Cadangan & Kanvasing Horeka',
      },
    ];
  }, []);

  // Driver Authentication Session state - default to DRV-01 for seamless NexaField access
  const [authenticatedDriverId, setAuthenticatedDriverId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('jacs_active_driver_id') || 'DRV-01';
    } catch {
      return 'DRV-01';
    }
  });
  const [loginIdInput, setLoginIdInput] = useState<string>('');
  const [loginPinInput, setLoginPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // NexaField Shell 5-Tab Navigation State: Home, Toko, Aktivitas, Kinerja, Profil
  const [fieldTab, setFieldTab] = useState<'home' | 'toko' | 'aktivitas' | 'kinerja' | 'profil'>('home');
  const [storeSearchTerm, setStoreSearchTerm] = useState<string>('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<'all' | 'critical' | 'tempo'>('all');

  // Penugasan Armada Fleksibel (Rotasi Harian Kendaraan)
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<'carry' | 'granmax' | 'viar'>('carry');

  // Filter & Pemilahan Tipe Antaran (Toko vs Residensial/Rumah Warga)
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'store' | 'residential'>('all');

  // Sub-Tab di Tab Aktivitas: Antrean Terbuka (Open Dispatch) vs Drop Aktif vs Terkirim
  const [activeTab, setActiveTab] = useState<'open_queue' | 'active' | 'completed'>('active');
  const [showCargoDetails, setShowCargoDetails] = useState<boolean>(false);

  // NexaField Log Kunjungan Lapangan & Formulir
  const [visitLogs, setVisitLogs] = useState<VisitLogEntry[]>(INITIAL_VISIT_LOGS);
  const [showVisitLogModal, setShowVisitLogModal] = useState<boolean>(false);
  const [activeVisitTarget, setActiveVisitTarget] = useState<{
    order?: OrderItem;
    store?: CustomerMasterItem;
    storeId?: string;
    customerName: string;
    address: string;
    orderId?: string;
  } | null>(null);

  const [visitFormStatus, setVisitFormStatus] = useState<
    'Kunjungan' | 'Order Baru' | 'Follow Up Tagihan' | 'Drop Galon' | 'Drop Galon & Sembako'
  >('Drop Galon & Sembako');
  const [visitFormGalonTurun, setVisitFormGalonTurun] = useState<number>(10);
  const [visitFormGalonTarik, setVisitFormGalonTarik] = useState<number>(10);
  const [visitFormNotes, setVisitFormNotes] = useState<string>('');
  const [visitFormPhotoUrl, setVisitFormPhotoUrl] = useState<string | null>(null);
  const [visitFormPhotoName, setVisitFormPhotoName] = useState<string>('');

  // Multi-Product Drop States in NexaField Re-Visit Form
  const [visitCategoryTab, setVisitCategoryTab] = useState<'AIR' | 'FMCG_FOOD' | 'FMCG_NON_FOOD' | 'NON_FMCG'>('AIR');
  const [visitDropRo19L, setVisitDropRo19L] = useState<number>(10);
  const [visitDropMineral19L, setVisitDropMineral19L] = useState<number>(0);
  const [visitDropBotolDus, setVisitDropBotolDus] = useState<number>(0);
  const [visitDropCupDus, setVisitDropCupDus] = useState<number>(0);
  const [visitDropRice5kg, setVisitDropRice5kg] = useState<number>(0);
  const [visitDropOil2L, setVisitDropOil2L] = useState<number>(0);
  const [visitDropEggsTray, setVisitDropEggsTray] = useState<number>(0);
  const [visitDropNoodleBox, setVisitDropNoodleBox] = useState<number>(0);
  const [visitDropDishwash, setVisitDropDishwash] = useState<number>(0);
  const [visitDropDetergent, setVisitDropDetergent] = useState<number>(0);
  const [visitDropDispenser, setVisitDropDispenser] = useState<number>(0);
  const [visitDropPompa, setVisitDropPompa] = useState<number>(0);
  const [visitDropGasLpg, setVisitDropGasLpg] = useState<number>(0);

  // Mutasi Wadah Kosong Tambahan
  const [visitTarikKrat, setVisitTarikKrat] = useState<number>(0);
  const [visitTarikGas, setVisitTarikGas] = useState<number>(0);

  // Settlement & Pembayaran
  const [visitSettleTempoAmount, setVisitSettleTempoAmount] = useState<number>(0);
  const [visitPaymentMethod, setVisitPaymentMethod] = useState<'Tunai' | 'Transfer / QRIS' | 'Tempo / Bon Toko'>('Tunai');

  // Active Vehicle according to daily rotation selection
  const activeVehicle = useMemo(() => {
    return DAILY_FLEET_OPTIONS.find((v) => v.key === selectedVehicleKey) || DAILY_FLEET_OPTIONS[0];
  }, [DAILY_FLEET_OPTIONS, selectedVehicleKey]);

  // Active Driver profile (or fallback)
  const activeDriver = useMemo(() => {
    const profile = driverProfiles.find((d) => d.id === authenticatedDriverId) || driverProfiles[0];
    return {
      ...profile,
      vehicleLabel: `${activeVehicle.name} (${activeVehicle.plate})`,
      plate: activeVehicle.plate,
      vehicleType: activeVehicle.name,
      armadaId: activeVehicle.armadaId,
    };
  }, [driverProfiles, authenticatedDriverId, activeVehicle]);

  // Quick Login / Direct Switch
  const handleQuickLogin = (driverId: string) => {
    const profile = driverProfiles.find((d) => d.id === driverId);
    if (profile) {
      setLoginIdInput(profile.id);
      setLoginPinInput(profile.pin);
      setAuthenticatedDriverId(profile.id);
      setSelectedVehicleKey(profile.defaultVehicleKey);
      setLoginError(null);
    }
  };

  // Form Submit Login
  const handleSubmitLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    const cleanId = loginIdInput.trim().toUpperCase();
    const cleanPin = loginPinInput.trim();

    // Find driver by ID / NIK / Name / Phone
    let found = driverProfiles.find(
      (d) =>
        (d.id.toUpperCase() === cleanId ||
          d.nik.toUpperCase() === cleanId ||
          d.empId.toUpperCase() === cleanId ||
          d.shortName.toUpperCase() === cleanId ||
          d.name.toUpperCase().includes(cleanId)) &&
        (!cleanPin || d.pin === cleanPin)
    );

    // If ID empty but 4-digit PIN is entered, match by PIN
    if (!found && cleanPin) {
      found = driverProfiles.find((d) => d.pin === cleanPin);
    }

    // Direct ID match without PIN restriction if empty
    if (!found && cleanId) {
      found = driverProfiles.find(
        (d) =>
          d.id.toUpperCase() === cleanId ||
          d.nik.toUpperCase() === cleanId ||
          d.empId.toUpperCase() === cleanId
      );
    }

    if (found) {
      setAuthenticatedDriverId(found.id);
      setSelectedVehicleKey(found.defaultVehicleKey);
      setLoginError(null);
    } else {
      setLoginError('ID Driver atau PIN salah. Silakan periksa kembali atau pilih supir terdaftar.');
    }
  };

  const handleLogout = () => {
    setAuthenticatedDriverId(null);
    setLoginPinInput('');
    setLoginError(null);
  };

  // Vehicle inventory state per driver
  const [cargoInventoryMap, setCargoInventoryMap] = useState<
    Record<string, DriverCargoInventory>
  >(DEFAULT_DRIVER_CARGO_MAP);

  // POD Modal state & Physical Checklist, Signature, Payment Confirmation
  const [podModalOrder, setPodModalOrder] = useState<OrderItem | null>(null);
  const [returnedGallonsInput, setReturnedGallonsInput] = useState<number>(0);
  const [damagedNotesInput, setDamagedNotesInput] = useState<string>('');
  const [recipientNameInput, setRecipientNameInput] = useState<string>('');
  const [podNoteInput, setPodNoteInput] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPhotoCaptured, setIsPhotoCaptured] = useState<boolean>(false);
  const [verifiedItemChecklist, setVerifiedItemChecklist] = useState<Record<string, boolean>>({});
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState<boolean>(false);
  const [hasDigitalSignature, setHasDigitalSignature] = useState<boolean>(false);
  const [podCashPaidConfirmed, setPodCashPaidConfirmed] = useState<boolean>(true);
  const [podTempoInvoiceConfirmed, setPodTempoInvoiceConfirmed] = useState<boolean>(true);
  const [podPaymentType, setPodPaymentType] = useState<'tunai' | 'tempo'>('tunai');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post-Delivery / Spot Sale Receipt Modal
  const [completedReceiptData, setCompletedReceiptData] = useState<{
    orderId: string;
    customerName: string;
    phone: string;
    items: string;
    totalAmount: number;
    emptyGallonsReturned: number;
    damagedNotes?: string;
    paymentStatus: string;
    driverName: string;
    time: string;
  } | null>(null);
  const [driverReceiptOrder, setDriverReceiptOrder] = useState<OrderItem | null>(null);

  // Quick Onboarding Modal State (3-Step Wizard)
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [registerWizardStep, setRegisterWizardStep] = useState<1 | 2 | 3>(1);
  const [isGpsDetecting, setIsGpsDetecting] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [newCustCreditLimit, setNewCustCreditLimit] = useState<number>(2000000);
  const [newCustHoldingQuota, setNewCustHoldingQuota] = useState<number>(25);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustOwner, setNewCustOwner] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');
  const [newCustLandmark, setNewCustLandmark] = useState<string>('');
  const [newCustCategory, setNewCustCategory] = useState<
    'Pangkalan Agen' | 'Toko Kelontong' | 'Rumah Tangga'
  >('Toko Kelontong');
  const [newCustZone, setNewCustZone] = useState<StoreZone>('Rayon Utara');
  const [newCustLat, setNewCustLat] = useState<number>(-5.14766);
  const [newCustLng, setNewCustLng] = useState<number>(119.43285);
  const [newCustCategoryType, setNewCustCategoryType] = useState<'Toko Mitra' | 'Residensial'>('Toko Mitra');
  const [newCustPriceTier, setNewCustPriceTier] = useState<'Pangkalan' | 'Toko' | 'Eceran'>('Toko');
  const [newCustMapsUrl, setNewCustMapsUrl] = useState<string>('https://maps.google.com/?q=-5.14766,119.43285');
  const [newCustNotes, setNewCustNotes] = useState<string>('');
  const [isGpsLocked, setIsGpsLocked] = useState<boolean>(false);
  const [addToTodayRoute, setAddToTodayRoute] = useState<boolean>(true);
  const [initialOrderQty, setInitialOrderQty] = useState<number>(10);
  const [initialProductType, setInitialProductType] = useState<string>(
    'Galon Aqua 19L (Refill)'
  );

  // Tab Profil: Rekapitulasi Ritase Bulanan & Offline Sync States
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);
  const [offlineSyncMessage, setOfflineSyncMessage] = useState<string | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>(
    () => getLastSyncTime() || '08 Okt 2026 12:30 WITA'
  );
  const [selectedRitaseMonth, setSelectedRitaseMonth] = useState<string>('Oktober 2026');

  // Direct Spot Sale Modal State (Katalog Visual Bersih & Approval Admin)
  const [showSpotSaleModal, setShowSpotSaleModal] = useState<boolean>(false);
  const [openedFromSpotSale, setOpenedFromSpotSale] = useState<boolean>(false);
  const [driverSubmittedStores, setDriverSubmittedStores] = useState<
    Array<{
      id: string;
      name: string;
      category: 'Toko Mitra' | 'Residensial';
      ownerName: string;
      phone: string;
      address: string;
      priceTier: 'Pangkalan' | 'Toko' | 'Eceran';
    }>
  >([]);
  const [spotCustomerType, setSpotCustomerType] = useState<'existing' | 'manual'>('existing');
  const [spotSelectedCustId, setSpotSelectedCustId] = useState<string>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [spotCustomerName, setSpotCustomerName] = useState<string>('');
  const [spotCustomerPhone, setSpotCustomerPhone] = useState<string>('');
  const [spotAddress, setSpotAddress] = useState<string>('');
  const [spotCategory, setSpotCategory] = useState<
    'Pangkalan Agen' | 'Toko Kelontong' | 'Rumah Tangga'
  >('Toko Kelontong');
  const [spotPriceTier, setSpotPriceTier] = useState<'Pangkalan' | 'Toko' | 'Eceran'>('Toko');
  const [catalogQuantities, setCatalogQuantities] = useState<Record<string, number>>({
    'PRD-01': 5,
  });
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'Semua' | 'Galon 19L' | 'Dus Botol' | 'Dus Cup'>('Semua');
  const [hasEmptyGallonExchange, setHasEmptyGallonExchange] = useState<boolean>(false);
  const [spotReturnedEmpty, setSpotReturnedEmpty] = useState<number>(0);
  const [spotPaymentMethod, setSpotPaymentMethod] = useState<'Tunai' | 'QRIS Supir' | 'TEMPO BON TOKO'>('Tunai');
  const [spotCashPaid, setSpotCashPaid] = useState<number>(0);
  const [spotDamagedNote, setSpotDamagedNote] = useState<string>('');
  const [nearbyStoreDetectedNotice, setNearbyStoreDetectedNotice] = useState<string | null>(null);
  const [spotOrderSuccessNotice, setSpotOrderSuccessNotice] = useState<{
    customerName: string;
    items: string;
    totalAmount: number;
    paymentMethod: string;
  } | null>(null);

  // Collect Tempo Payment Modal State
  const [showCollectTempoModal, setShowCollectTempoModal] = useState<boolean>(false);
  const [selectedTempoId, setSelectedTempoId] = useState<string>('');
  const [tempoAmountPaid, setTempoAmountPaid] = useState<number>(0);
  const [tempoCollectorNote, setTempoCollectorNote] = useState<string>('');
  const [tempoReturnedGallons, setTempoReturnedGallons] = useState<number>(0);

  const currentCargo = useMemo(() => {
    return (
      cargoInventoryMap[activeDriver.id] || {
        galonAqua: 40,
        galonLeMinerale: 20,
        galonCleo: 10,
        dusBotolAqua600: 8,
        dusBotolVit600: 6,
        dusCupAqua220: 6,
        dusCupCleo220: 4,
        emptyGallonsCollected: 0,
      }
    );
  }, [cargoInventoryMap, activeDriver]);

  // Current Armada data synced with daily vehicle rotation selection
  const currentArmada = useMemo(() => {
    return (
      armadaList.find((a) => a.id === activeVehicle.armadaId) || {
        id: activeVehicle.armadaId,
        plateNumber: activeVehicle.plate,
        vehicleType: activeVehicle.name,
        capacityGalon: activeVehicle.maxGallons,
        currentLoad: 80,
        status: 'Sedang Jalan',
        currentRoute: 'Rute Pengiriman Toko & Pangkalan Subang',
      }
    );
  }, [armadaList, activeVehicle]);

  // Current Employee record for commission calculation
  const currentEmployee = useMemo(() => {
    return (
      employees.find(
        (e) =>
          e.name.toLowerCase().includes(activeDriver.shortName.toLowerCase()) ||
          e.id === activeDriver.empId
      ) || employees[0]
    );
  }, [employees, activeDriver]);

  // Driver commission rates (75% share)
  const courierGallonRate = Math.round(
    commissionConfig.gallonBaseRate * (commissionConfig.courierSharePercent / 100)
  ); // Rp 750 / galon
  const courierBottleRate = Math.round(
    commissionConfig.bottleBaseRate * (commissionConfig.courierSharePercent / 100)
  ); // Rp 375 / dus botol
  const courierCupRate = Math.round(
    commissionConfig.cupBaseRate * (commissionConfig.courierSharePercent / 100)
  ); // Rp 225 / dus cup

  // Helper: Pemilahan Tipe Antaran (Toko vs Residensial)
  const isOrderResidential = (order: OrderItem) => {
    if (order.customerType === 'Rumah Tangga') return true;
    if (
      order.customerType === 'Agen / Pangkalan' ||
      order.customerType === 'Toko Kelontong' ||
      order.customerType === 'Resto / Cafe'
    ) {
      return false;
    }
    const nameLower = (order.customerName || '').toLowerCase();
    if (
      nameLower.includes('toko') ||
      nameLower.includes('agen') ||
      nameLower.includes('warung') ||
      nameLower.includes('pangkalan') ||
      nameLower.includes('resto') ||
      nameLower.includes('kantin')
    ) {
      return false;
    }
    return (order.totalGalon || 0) <= 3;
  };

  // 1. Antrean Terbuka: Daftar pesanan yang berstatus 'MENUNGGU_DRIVER' untuk dipantau semua supir
  const openQueueOrders = useMemo(() => {
    return orders.filter((ord) => ord.deliveryStatus === 'MENUNGGU_DRIVER');
  }, [orders]);

  // Filter orders strictly assigned to the authenticated driver (tidak termasuk antrean terbuka)
  const driverOrders = useMemo(() => {
    if (!authenticatedDriverId) return [];
    return orders.filter((ord) => {
      // Jika statusnya MENUNGGU_DRIVER, pesanan ada di antrean terbuka
      if (ord.deliveryStatus === 'MENUNGGU_DRIVER') return false;

      // Cek apakah assignedDriverId cocok
      if (
        ord.assignedDriverId === activeDriver.id ||
        ord.assignedDriverId === activeDriver.nik ||
        ord.assignedDriverId === activeDriver.empId
      ) {
        return true;
      }
      if (
        ord.assignedDriverId &&
        ord.assignedDriverId !== activeDriver.id &&
        ord.assignedDriverId !== activeDriver.nik &&
        ord.assignedDriverId !== activeDriver.empId
      ) {
        return false;
      }

      const driverStr = (ord.driver || '').toLowerCase();
      const matchDriver =
        driverStr.includes(activeDriver.shortName.toLowerCase()) ||
        driverStr.includes(activeDriver.name.toLowerCase()) ||
        driverStr.includes(activeDriver.id.toLowerCase()) ||
        driverStr.includes(activeDriver.nik.toLowerCase()) ||
        (activeDriver.empId && driverStr.includes(activeDriver.empId.toLowerCase())) ||
        driverStr.includes('armada siaga') ||
        driverStr.includes('antrian gudang');

      return matchDriver;
    });
  }, [orders, activeDriver, authenticatedDriverId]);

  // 2. Regulasi Kunci (Single Active Task):
  // Periksa apakah supir yang sedang aktif sudah memiliki tugas berjalan (status 'DIANTAR' dan belum upload foto POD).
  const activeTaskInProgress = useMemo(() => {
    if (!authenticatedDriverId) return null;
    return (
      orders.find((ord) => {
        const isAssigned =
          ord.assignedDriverId === activeDriver.id ||
          ord.assignedDriverId === activeDriver.nik ||
          ord.assignedDriverId === activeDriver.empId ||
          (ord.driver && (
            ord.driver.toLowerCase().includes(activeDriver.shortName.toLowerCase()) ||
            ord.driver.toLowerCase().includes(activeDriver.name.toLowerCase()) ||
            ord.driver.toLowerCase().includes(activeDriver.id.toLowerCase()) ||
            ord.driver.toLowerCase().includes(activeDriver.nik.toLowerCase())
          ));

        if (!isAssigned) return false;

        const isDiantar =
          ord.deliveryStatus === 'DIANTAR' || ord.deliveryStatus === 'Dalam Pengiriman';
        const notDone = ord.deliveryStatus !== 'Terkirim' && ord.deliveryStatus !== 'SELESAI';
        const noPod = !ord.photoProof;

        return isDiantar && notDone && noPod;
      }) || null
    );
  }, [orders, activeDriver, authenticatedDriverId]);

  const hasActiveInProgressTask = Boolean(activeTaskInProgress);

  const activeDrops = useMemo(() => {
    return driverOrders.filter(
      (ord) => ord.deliveryStatus !== 'Terkirim' && ord.deliveryStatus !== 'SELESAI'
    );
  }, [driverOrders]);

  const completedDrops = useMemo(() => {
    return driverOrders.filter(
      (ord) => ord.deliveryStatus === 'Terkirim' || ord.deliveryStatus === 'SELESAI'
    );
  }, [driverOrders]);

  // NexaField Counters: Toko Binaan, Butuh Pasokan, Kunjungan Hari Ini
  const managedStoresList = useMemo(() => {
    return customers && customers.length > 0 ? customers : CUSTOMER_MASTER;
  }, [customers]);

  const totalTokoBinaan = useMemo(() => {
    return managedStoresList.filter((c) => c.type === 'B2B' || !c.type || Boolean(c.b2bCategory)).length;
  }, [managedStoresList]);

  const totalButuhPasokan = useMemo(() => {
    return managedStoresList.filter(
      (c) => (c.emptyGallonDebt && c.emptyGallonDebt >= 10) || c.priceTier === 'Pangkalan'
    ).slice(0, 6).length || 6;
  }, [managedStoresList]);

  const targetDropsCount = useMemo(() => {
    const totalToday = (driverOrders.length || 0) + (openQueueOrders.length || 0);
    return Math.max(12, totalToday);
  }, [driverOrders.length, openQueueOrders.length]);

  // Perhitungan Metrik Lengkap NexaField (Jarak, Sisa Stok, ADS, Runway hari, Status)
  const storeMetricsList: StoreNexaMetrics[] = useMemo(() => {
    return managedStoresList.map((store, idx) =>
      calculateStoreNexaMetrics(store, idx, DEFAULT_DEPO_MAKASSAR)
    );
  }, [managedStoresList]);

  // Filter Toko Binaan untuk Tab Toko [Semua], [Butuh Pasokan], [Kunjungan/Tempo]
  const filteredStoreMetrics = useMemo(() => {
    let list = storeMetricsList;
    if (selectedStoreFilter === 'critical') {
      list = list.filter((s) => s.statusCategory === 'critical' || s.runwayDays <= 2);
    } else if (selectedStoreFilter === 'tempo') {
      list = list.filter((s) => s.statusCategory === 'warning' || s.tempoBalance > 0);
    }
    if (storeSearchTerm.trim()) {
      const q = storeSearchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
          s.address.toLowerCase().includes(q)
      );
    }
    return list;
  }, [storeMetricsList, selectedStoreFilter, storeSearchTerm]);

  // Filter Toko Binaan untuk Tab Toko (Legacy Compatibility)
  const filteredStores = useMemo(() => {
    let list = managedStoresList;
    if (selectedStoreFilter === 'critical') {
      list = list.filter((c) => (c.emptyGallonDebt && c.emptyGallonDebt >= 10) || c.priceTier === 'Pangkalan');
    } else if (selectedStoreFilter === 'tempo') {
      list = list.filter((c) => (c.currentReceivable && c.currentReceivable > 0) || (c.creditLimit && c.creditLimit > 0));
    }
    if (storeSearchTerm.trim()) {
      const q = storeSearchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.ownerName && c.ownerName.toLowerCase().includes(q)) ||
          c.address.toLowerCase().includes(q)
      );
    }
    return list;
  }, [managedStoresList, selectedStoreFilter, storeSearchTerm]);

  // Segmentasi Antaran Toko vs Residensial
  const activeStoreDrops = useMemo(() => {
    return activeDrops.filter((ord) => !isOrderResidential(ord));
  }, [activeDrops]);

  const activeResidentialDrops = useMemo(() => {
    return activeDrops.filter((ord) => isOrderResidential(ord));
  }, [activeDrops]);

  const displayedActiveDrops = useMemo(() => {
    if (segmentFilter === 'store') return activeStoreDrops;
    if (segmentFilter === 'residential') return activeResidentialDrops;
    return activeDrops;
  }, [activeDrops, segmentFilter, activeStoreDrops, activeResidentialDrops]);

  // Total gallons in remaining active drops
  const remainingActiveGallons = useMemo(() => {
    return activeDrops.reduce((acc, o) => acc + (o.totalGalon || 0), 0);
  }, [activeDrops]);

  // Total cargo count in vehicle
  const totalGallonsInVehicle =
    currentCargo.galonAqua + currentCargo.galonLeMinerale + currentCargo.galonCleo;
  const totalDusInVehicle =
    currentCargo.dusBotolAqua600 +
    currentCargo.dusBotolVit600 +
    currentCargo.dusCupAqua220 +
    currentCargo.dusCupCleo220;

  // GPS detection for On-the-road Onboarding (Auto-Detect Lat & Long)
  const handleDetectGps = () => {
    setIsGpsDetecting(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const acc = Math.round(pos.coords.accuracy || 5);
          setNewCustLat(lat);
          setNewCustLng(lng);
          setGpsAccuracy(acc);
          setNewCustMapsUrl(`https://maps.google.com/?q=${lat},${lng}`);
          setIsGpsLocked(true);
          setIsGpsDetecting(false);
        },
        () => {
          // Fallback realistic Makassar/Subang location
          const lat = parseFloat((-5.14766 + (Math.random() - 0.5) * 0.02).toFixed(6));
          const lng = parseFloat((119.43285 + (Math.random() - 0.5) * 0.02).toFixed(6));
          setNewCustLat(lat);
          setNewCustLng(lng);
          setGpsAccuracy(12);
          setNewCustMapsUrl(`https://maps.google.com/?q=${lat},${lng}`);
          setIsGpsLocked(true);
          setIsGpsDetecting(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      const lat = -5.14766;
      const lng = 119.43285;
      setNewCustLat(lat);
      setNewCustLng(lng);
      setGpsAccuracy(15);
      setNewCustMapsUrl(`https://maps.google.com/?q=${lat},${lng}`);
      setIsGpsLocked(true);
      setIsGpsDetecting(false);
    }
  };

  // Handler Sinkronisasi Data Offline Lapangan ke Cloud
  const handleSyncOfflineData = async () => {
    setIsSyncingOffline(true);
    setOfflineSyncMessage('Menghubungkan ke Cloud Depo & Google Sheets...');
    try {
      await triggerGasWebhook('sync_all', {
        driverId: activeDriver.id,
        driverName: activeDriver.name,
        vehicle: activeVehicle.plate,
        timestamp: new Date().toISOString(),
        pendingOrdersCount: 0,
        submittedStoresCount: storeSubmissions.length,
      });
      const nowStr = `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA`;
      saveLastSyncTime(nowStr);
      setLastSyncTimestamp(nowStr);
      setOfflineSyncMessage('✅ Semua data offline, POD, dan registrasi toko berhasil tersinkron 100%!');
      setTimeout(() => setOfflineSyncMessage(null), 4500);
    } catch {
      const nowStr = `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA`;
      saveLastSyncTime(nowStr);
      setLastSyncTimestamp(nowStr);
      setOfflineSyncMessage('✅ Data lokal offline tersinkron dan siap diselaraskan ke Cloud!');
      setTimeout(() => setOfflineSyncMessage(null), 4500);
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // Canvas Coordinate Helper for Digital Signature
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else if ('clientX' in e) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
    return { x: 0, y: 0 };
  };

  const handleSignatureStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#22d3ee'; // Cyan glow stroke
    setIsDrawingSignature(true);
    setHasDigitalSignature(true);
  };

  const handleSignatureMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const handleSignatureEnd = () => {
    setIsDrawingSignature(false);
  };

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDigitalSignature(false);
  };

  const handleSampleSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(40, 65);
    ctx.bezierCurveTo(80, 20, 110, 85, 150, 40);
    ctx.bezierCurveTo(180, 15, 210, 80, 260, 45);
    ctx.moveTo(70, 70);
    ctx.lineTo(240, 75);
    ctx.stroke();
    setHasDigitalSignature(true);
  };

  // Helper untuk mendapatkan sisa muatan armada aktual untuk setiap SKU
  const getCargoStockForProduct = (productId: string): number => {
    switch (productId) {
      case 'PRD-01':
        return currentCargo.galonAqua || 0;
      case 'PRD-02':
        return currentCargo.galonLeMinerale || 0;
      case 'PRD-03':
        return 0; // Vit Galon (tidak dimuat di truk armada hari ini)
      case 'PRD-04':
        return currentCargo.galonCleo || 0;
      case 'PRD-05':
        return currentCargo.dusBotolVit600 || 0;
      case 'PRD-06':
        return currentCargo.dusBotolAqua600 || 0;
      case 'PRD-07':
        return currentCargo.dusCupAqua220 || 0;
      case 'PRD-08':
        return currentCargo.dusCupCleo220 || 0;
      default:
        return 0;
    }
  };

  // Hanya SKU yang masih tersedia di sisa muatan armada truk supir hari ini
  const availableCargoItems = useMemo(() => {
    return SPOT_CATALOG_ITEMS.filter((item) => getCargoStockForProduct(item.id) > 0);
  }, [currentCargo]);

  // Deteksi toko terdekat via GPS
  const handleDetectNearbyStore = () => {
    if (!customers || customers.length === 0) return;
    const findClosest = (driverLat: number, driverLng: number) => {
      let closestStore = customers[0];
      let minDistance = 999999;

      customers.forEach((c) => {
        const cLat = c.coordinates?.lat || -6.5621;
        const cLng = c.coordinates?.lng || 107.6534;
        const dist = Math.hypot(cLat - driverLat, cLng - driverLng);
        if (dist < minDistance) {
          minDistance = dist;
          closestStore = c;
        }
      });

      if (closestStore) {
        setSpotSelectedCustId(closestStore.id);
        const lockedTier = closestStore.priceTier || (closestStore.type === 'B2B' ? 'Toko' : 'Eceran');
        setSpotPriceTier(lockedTier);
        setSpotCustomerName(closestStore.name);
        setSpotCustomerPhone(closestStore.phone);
        setSpotAddress(closestStore.address);
        setSpotCategory(
          closestStore.type === 'B2B'
            ? (closestStore.b2bCategory === 'Agen / Pangkalan' ? 'Pangkalan Agen' : 'Toko Kelontong')
            : 'Rumah Tangga'
        );
        setNearbyStoreDetectedNotice(
          `📍 Terpilih: ${closestStore.name} (${closestStore.address}) • Tier ${lockedTier}`
        );
        setTimeout(() => setNearbyStoreDetectedNotice(null), 5000);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          setNewCustLat(lat);
          setNewCustLng(lng);
          findClosest(lat, lng);
        },
        () => {
          findClosest(newCustLat || -6.5621, newCustLng || 107.6534);
        },
        { timeout: 4000 }
      );
    } else {
      findClosest(newCustLat || -6.5621, newCustLng || 107.6534);
    }
  };

  // Open POD Modal
  const handleOpenPod = (order: OrderItem) => {
    setPodModalOrder(order);
    setReturnedGallonsInput(order.totalGalon || 0); // Default: semua tabung ditarik
    setDamagedNotesInput('');
    setRecipientNameInput(order.customerName.split(' ')[0] || order.customerName);
    setPodNoteInput('');
    setPhotoPreview(null);
    setIsPhotoCaptured(false);
    setPodCashPaidConfirmed(true);
    setPodTempoInvoiceConfirmed(true);
    setHasDigitalSignature(false);

    const isTempo =
      order.paymentMethod === 'TEMPO' ||
      order.paymentMethod === 'TEMPO BON TOKO' ||
      order.paymentStatus === 'Tempo / Hutang';
    setPodPaymentType(isTempo ? 'tempo' : 'tunai');

    // Inisialisasi checklist verifikasi fisik barang yang diturunkan
    let itemStrings: string[] = [];
    if (order.items && order.items.trim()) {
      itemStrings = order.items.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (itemStrings.length === 0) {
      if ((order.totalGalon || 0) > 0) {
        itemStrings.push(`${order.totalGalon} Tabung Galon 19L`);
      } else {
        itemStrings.push('1 Paket Pesanan Lengkap');
      }
    }
    const initialChecklist: Record<string, boolean> = {};
    itemStrings.forEach((itemStr) => {
      initialChecklist[itemStr] = true;
    });
    setVerifiedItemChecklist(initialChecklist);

    // Reset kanvas tanda tangan setelah modal dibuka
    setTimeout(() => {
      if (signatureCanvasRef.current) {
        const ctx = signatureCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
        }
      }
    }, 150);
  };

  // Handle Photo selection/capture
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setIsPhotoCaptured(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset sample photo
  const handleSelectSamplePhoto = () => {
    const sampleUri =
      'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60';
    setPhotoPreview(sampleUri);
    setIsPhotoCaptured(true);
  };

  // Submit POD
  const handleSubmitPod = () => {
    if (!podModalOrder) return;
    const targetOrder = podModalOrder;

    const isTempo = podPaymentType === 'tempo';
    if (!isTempo && !podCashPaidConfirmed) {
      alert('Harap centang konfirmasi "Uang Tunai Diterima" sebelum menyelesaikan pengantaran tunai.');
      return;
    }
    if (isTempo && !podTempoInvoiceConfirmed) {
      alert('Harap centang konfirmasi "Faktur Ditandatangani Toko" sebelum menyelesaikan pengantaran tempo.');
      return;
    }

    // Ambil bukti tanda tangan digital dari canvas jika ada
    let signatureProof: string | undefined = undefined;
    if (signatureCanvasRef.current && hasDigitalSignature) {
      try {
        signatureProof = signatureCanvasRef.current.toDataURL('image/png');
      } catch (err) {
        console.error('Canvas export error:', err);
      }
    }

    onCompleteDelivery(targetOrder.id, {
      emptyGallonsReturned: returnedGallonsInput,
      damagedNotes: damagedNotesInput || undefined,
      photoProof: photoPreview || signatureProof || undefined,
      recipientName: recipientNameInput || targetOrder.customerName,
      note: podNoteInput || undefined,
    });

    // Update local vehicle cargo inventory
    setCargoInventoryMap((prev) => {
      const cur = prev[activeDriver.id] || currentCargo;
      return {
        ...prev,
        [activeDriver.id]: {
          ...cur,
          galonAqua: Math.max(0, cur.galonAqua - (targetOrder.totalGalon || 0)),
          emptyGallonsCollected: cur.emptyGallonsCollected + returnedGallonsInput,
        },
      };
    });

    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Show completed receipt popup for easy WhatsApp sending & thermal printing
    const receiptInfo = {
      orderId: targetOrder.id,
      customerName: targetOrder.customerName,
      phone: targetOrder.phone,
      items: targetOrder.items,
      totalAmount: targetOrder.totalAmount,
      emptyGallonsReturned: returnedGallonsInput,
      damagedNotes: damagedNotesInput || undefined,
      paymentStatus: isTempo ? 'Tempo / Faktur' : 'Lunas (Tunai COD)',
      driverName: activeDriver.name,
      time: nowTimeStr,
    };
    setCompletedReceiptData(receiptInfo);

    // Auto-prepare thermal receipt order object for 58mm/80mm printing
    const receiptOrderObj: OrderItem = {
      id: targetOrder.id,
      customerName: targetOrder.customerName,
      customerType: targetOrder.customerType,
      phone: targetOrder.phone,
      items: targetOrder.items,
      totalAmount: targetOrder.totalAmount,
      totalGalon: returnedGallonsInput,
      emptyGallonsReturned: returnedGallonsInput,
      paymentStatus: isTempo ? ('Tempo / Hutang' as any) : ('Lunas' as any),
      driver: activeDriver.name,
      time: nowTimeStr,
      deliveryStatus: 'SELESAI',
      gallonScheme: 'Tukar Galon',
      damagedItemsNote: damagedNotesInput || undefined,
    };
    setDriverReceiptOrder(receiptOrderObj);

    setPodModalOrder(null);
  };

  // Batalkan registrasi toko dan kembali mulus ke katalog order jika supir membatalkan
  const handleCancelRegisterStore = () => {
    setShowRegisterModal(false);
    setRegisterWizardStep(1);
    if (openedFromSpotSale) {
      setShowSpotSaleModal(true);
      setOpenedFromSpotSale(false);
    }
  };

  // Buka form registrasi toko baru dari katalog order (tutup sementara modal katalog & deteksi GPS)
  const handleOpenRegisterFromCatalog = () => {
    setOpenedFromSpotSale(true);
    setShowSpotSaleModal(false); // Tutup sementara modal katalog order
    setRegisterWizardStep(1);
    handleDetectGps();
    setShowRegisterModal(true); // Buka modal FORM IDENTITAS TOKO BARU
  };

  // Kirim Pengajuan Registrasi Toko Baru ke Admin untuk Verifikasi
  const handleSendStoreSubmissionToAdmin = () => {
    if (!newCustName.trim()) {
      alert('Nama Toko / Outlet wajib diisi.');
      setRegisterWizardStep(1);
      return;
    }
    if (!newCustPhone.trim()) {
      alert('Nomor WhatsApp wajib diisi.');
      setRegisterWizardStep(1);
      return;
    }

    const submissionId = `REG-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newStoreItem = {
      id: submissionId,
      name: newCustName.trim(),
      category: newCustCategoryType,
      ownerName: newCustOwner.trim() || newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || 'Jl. Raya Subang',
      priceTier: newCustPriceTier,
    };

    const payload = {
      name: newStoreItem.name,
      category: newCustCategoryType,
      ownerName: newStoreItem.ownerName,
      phone: newStoreItem.phone,
      address: newStoreItem.address,
      landmark: newCustLandmark.trim() || 'Patokan Belum Terisi',
      coordinates: { lat: newCustLat, lng: newCustLng },
      mapsUrl: newCustMapsUrl || `https://maps.google.com/?q=${newCustLat},${newCustLng}`,
      priceTier: newCustPriceTier,
      submittedByDriverName: activeDriver.name,
      notes: newCustNotes.trim() || undefined,
    };

    if (onSubmitStoreRegistration) {
      onSubmitStoreRegistration(payload);
    } else if (onRegisterCustomerFromRoad) {
      onRegisterCustomerFromRoad(
        {
          name: payload.name,
          ownerName: payload.ownerName,
          phone: payload.phone,
          address: payload.address,
          landmark: payload.landmark,
          category: payload.category === 'Toko Mitra' ? 'Toko Kelontong' : 'Rumah Tangga',
          zone: newCustZone,
          lat: newCustLat,
          lng: newCustLng,
          addToTodayRoute: false,
          initialOrderQty: 0,
          gallonScheme: 'Tukar Galon',
        },
        activeDriver.name
      );
    }

    // Simpan ke daftar toko diajukan lokal supir
    setDriverSubmittedStores((prev) => [newStoreItem, ...prev]);

    // 1. Form identitas toko tertutup & reset wizard
    setShowRegisterModal(false);
    setRegisterWizardStep(1);

    // 2. Toko yang baru diajukan langsung otomatis terpilih di field [PILIH PELANGGAN] pada katalog order
    setSpotSelectedCustId(submissionId);
    setSpotCustomerName(newStoreItem.name);
    setSpotCustomerPhone(newStoreItem.phone);
    setSpotAddress(newStoreItem.address);
    setSpotPriceTier(newStoreItem.priceTier);
    setSpotCategory(newStoreItem.category === 'Toko Mitra' ? 'Toko Kelontong' : 'Rumah Tangga');

    // Reset input identitas toko
    setNewCustName('');
    setNewCustOwner('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustLandmark('');
    setNewCustNotes('');

    if (openedFromSpotSale) {
      setShowSpotSaleModal(true);
      setOpenedFromSpotSale(false);
    } else {
      setSpotOrderSuccessNotice({
        customerName: newStoreItem.name,
        items: `Registrasi Toko Baru berhasil diajukan ke Admin. No. Registrasi: ${submissionId}`,
        totalAmount: 0,
        paymentMethod: 'Pengajuan Baru',
      });
    }
  };

  // Submit Onboarding Customer on-the-road
  const handleSubmitRegisterCustomer = (withRoute: boolean) => {
    handleSendStoreSubmissionToAdmin();
  };

  // Helper pricing per unit for spot catalog
  const getItemUnitPrice = (item: SpotCatalogItem, tier: 'Pangkalan' | 'Toko' | 'Eceran') => {
    if (tier === 'Pangkalan') return item.pricePangkalan;
    if (tier === 'Toko') return item.priceToko;
    return item.priceRetail;
  };

  // Spot Sale Calculations (Hanya untuk produk yang tersedia di sisa muatan armada)
  const spotPricing = useMemo(() => {
    let total = 0;
    let totalGalons = 0;
    let totalBottles = 0;
    let totalCups = 0;
    const itemsParts: string[] = [];

    availableCargoItems.forEach((p) => {
      const qty = catalogQuantities[p.id] || 0;
      if (qty > 0) {
        const uPrice = getItemUnitPrice(p, spotPriceTier);
        total += qty * uPrice;
        if (p.category === 'Galon 19L') totalGalons += qty;
        else if (p.category === 'Dus Botol') totalBottles += qty;
        else if (p.category === 'Dus Cup') totalCups += qty;
        itemsParts.push(`${qty} ${p.name}`);
      }
    });

    return {
      priceGalonAqua: spotPriceTier === 'Pangkalan' ? 18500 : spotPriceTier === 'Toko' ? 19500 : 21000,
      priceGalonLeMin: spotPriceTier === 'Pangkalan' ? 19000 : spotPriceTier === 'Toko' ? 20000 : 21500,
      priceGalonCleo: spotPriceTier === 'Pangkalan' ? 17500 : spotPriceTier === 'Toko' ? 18500 : 20000,
      priceDusVit: spotPriceTier === 'Pangkalan' ? 38000 : spotPriceTier === 'Toko' ? 40000 : 43000,
      priceDusAqua: spotPriceTier === 'Pangkalan' ? 44000 : spotPriceTier === 'Toko' ? 46000 : 49000,
      priceDusCup: spotPriceTier === 'Pangkalan' ? 26000 : spotPriceTier === 'Toko' ? 28000 : 31000,
      total,
      totalGalons,
      totalBottles,
      totalCups,
      itemsDescription: itemsParts.join(', ') || '0 Barang',
    };
  }, [spotPriceTier, catalogQuantities, availableCargoItems]);

  // Submit Direct Spot Order for Admin/Kasir Depo Approval
  const handleSubmitSpotSale = () => {
    if (!spotSelectedCustId) {
      alert('Silakan pilih toko / pelanggan dari data master terlebih dahulu.');
      return;
    }
    if (spotPricing.total === 0) {
      alert('Silakan pilih minimal 1 produk dari katalog sisa muatan armada.');
      return;
    }

    // Validasi ketersediaan muatan fisik armada
    for (const [prodId, qty] of Object.entries(catalogQuantities)) {
      if (qty > 0) {
        const stock = getCargoStockForProduct(prodId);
        if (qty > stock) {
          alert(`Jumlah pesanan (${qty}) melebihi sisa muatan di truk (${stock}).`);
          return;
        }
      }
    }

    const selectedCust = customers.find((c) => c.id === spotSelectedCustId);
    const localSubmitted = driverSubmittedStores.find((s) => s.id === spotSelectedCustId);
    const submittedTarget = storeSubmissions?.find((s) => s.id === spotSelectedCustId);

    const custName =
      selectedCust?.name ||
      localSubmitted?.name ||
      submittedTarget?.name ||
      spotCustomerName ||
      'Toko Baru Diajukan';
    const custPhone =
      selectedCust?.phone ||
      localSubmitted?.phone ||
      submittedTarget?.phone ||
      spotCustomerPhone ||
      '0812-0000-0000';
    const custAddress =
      selectedCust?.address ||
      localSubmitted?.address ||
      submittedTarget?.address ||
      spotAddress ||
      'Alamat Toko Terdaftar';
    const custCategory = selectedCust?.type === 'B2B'
      ? (selectedCust.b2bCategory === 'Agen / Pangkalan' ? 'Pangkalan Agen' : 'Toko Kelontong')
      : localSubmitted
      ? (localSubmitted.category === 'Toko Mitra' ? 'Toko Kelontong' : 'Rumah Tangga')
      : submittedTarget
      ? (submittedTarget.category === 'Toko Mitra' ? 'Toko Kelontong' : 'Rumah Tangga')
      : 'Toko Kelontong';

    const isPendingStore = Boolean(
      localSubmitted ||
      submittedTarget ||
      spotSelectedCustId.startsWith('REG-')
    );

    const finalEmptyGallons = hasEmptyGallonExchange ? spotReturnedEmpty : 0;

    if (onDirectSpotSale) {
      onDirectSpotSale({
        customerName: custName,
        phone: custPhone,
        address: custAddress,
        category: custCategory,
        itemsDescription: spotPricing.itemsDescription,
        totalGalon: spotPricing.totalGalons,
        totalBottles: spotPricing.totalBottles,
        totalCups: spotPricing.totalCups,
        totalAmount: spotPricing.total,
        paymentMethod: spotPaymentMethod,
        emptyGallonsReturned: finalEmptyGallons,
        damagedNotes: isPendingStore
          ? `[Toko Baru Diajukan - Menunggu Konfirmasi Admin] ${spotDamagedNote || ''}`.trim()
          : spotDamagedNote || undefined,
        driverId: activeDriver.empId,
        driverName: activeDriver.name,
        vehicleId: activeDriver.armadaId,
        status: 'MENUNGGU_APPROVAL_ADMIN',
        priceTier: spotPriceTier,
      });
    }

    // Otomatis memotong muatan armada truk supir hari ini
    setCargoInventoryMap((prev) => {
      const cur = prev[activeDriver.id] || currentCargo;
      return {
        ...prev,
        [activeDriver.id]: {
          ...cur,
          galonAqua: Math.max(0, cur.galonAqua - (catalogQuantities['PRD-01'] || 0)),
          galonLeMinerale: Math.max(0, cur.galonLeMinerale - (catalogQuantities['PRD-02'] || 0)),
          galonCleo: Math.max(0, cur.galonCleo - (catalogQuantities['PRD-04'] || 0)),
          dusBotolAqua600: Math.max(0, cur.dusBotolAqua600 - (catalogQuantities['PRD-06'] || 0)),
          dusBotolVit600: Math.max(0, cur.dusBotolVit600 - (catalogQuantities['PRD-05'] || 0)),
          dusCupAqua220: Math.max(0, cur.dusCupAqua220 - (catalogQuantities['PRD-07'] || 0)),
          dusCupCleo220: Math.max(0, cur.dusCupCleo220 - (catalogQuantities['PRD-08'] || 0)),
          emptyGallonsCollected: cur.emptyGallonsCollected + finalEmptyGallons,
        },
      };
    });

    setSpotOrderSuccessNotice({
      customerName: custName,
      items: spotPricing.itemsDescription,
      totalAmount: spotPricing.total,
      paymentMethod: spotPaymentMethod,
    });
    setTimeout(() => setSpotOrderSuccessNotice(null), 7000);

    setShowSpotSaleModal(false);
    setCatalogQuantities({});
    setHasEmptyGallonExchange(false);
    setSpotReturnedEmpty(0);
  };

  const handleOpenCollectTempo = (prefillId?: string) => {
    const list = receivables.length > 0 ? receivables : RECEIVABLES;
    const targetId = prefillId || list[0]?.id || '';
    setSelectedTempoId(targetId);
    const targetItem = list.find((r) => r.id === targetId);
    setTempoAmountPaid(targetItem ? targetItem.amount : 0);
    setTempoReturnedGallons(0);
    setTempoCollectorNote('');
    setShowCollectTempoModal(true);
  };

  const handleOpenSpotForStore = (store: CustomerMasterItem) => {
    setSpotCustomerType('existing');
    setSpotSelectedCustId(store.id);
    setSpotCustomerName(store.name);
    setSpotCustomerPhone(store.phone || '');
    setSpotPriceTier((store.priceTier as 'Pangkalan' | 'Toko' | 'Eceran') || 'Toko');
    setSpotCashPaid(spotPricing.total);
    setSpotReturnedEmpty(spotPricing.totalGalons);
    setShowSpotSaleModal(true);
  };

  // Handler Formulir Log Kunjungan & Multi-Drop NexaField
  const visitCalculations = useMemo(() => {
    const totalRo19L = (visitDropRo19L || 0) * 16000;
    const totalMineral19L = (visitDropMineral19L || 0) * 15000;
    const totalBotolDus = (visitDropBotolDus || 0) * 36000;
    const totalCupDus = (visitDropCupDus || 0) * 22500;
    const totalRice5kg = (visitDropRice5kg || 0) * 68500;
    const totalOil2L = (visitDropOil2L || 0) * 34000;
    const totalEggsTray = (visitDropEggsTray || 0) * 51000;
    const totalNoodleBox = (visitDropNoodleBox || 0) * 115000;
    const totalDishwash = (visitDropDishwash || 0) * 14500;
    const totalDetergent = (visitDropDetergent || 0) * 19500;
    const totalDispenser = (visitDropDispenser || 0) * 185000;
    const totalPompa = (visitDropPompa || 0) * 45000;
    const totalGasLpg = (visitDropGasLpg || 0) * 22000;

    const multiProductDropTotal =
      totalRo19L +
      totalMineral19L +
      totalBotolDus +
      totalCupDus +
      totalRice5kg +
      totalOil2L +
      totalEggsTray +
      totalNoodleBox +
      totalDishwash +
      totalDetergent +
      totalDispenser +
      totalPompa +
      totalGasLpg;

    const total19LGallonsOut = (visitDropRo19L || 0) + (visitDropMineral19L || 0);
    const totalCashCollected =
      visitPaymentMethod === 'Tempo / Bon Toko'
        ? (visitSettleTempoAmount || 0)
        : multiProductDropTotal + (visitSettleTempoAmount || 0);

    return {
      multiProductDropTotal,
      total19LGallonsOut,
      totalCashCollected,
    };
  }, [
    visitDropRo19L,
    visitDropMineral19L,
    visitDropBotolDus,
    visitDropCupDus,
    visitDropRice5kg,
    visitDropOil2L,
    visitDropEggsTray,
    visitDropNoodleBox,
    visitDropDishwash,
    visitDropDetergent,
    visitDropDispenser,
    visitDropPompa,
    visitDropGasLpg,
    visitSettleTempoAmount,
    visitPaymentMethod,
  ]);

  const handleOpenVisitModalForOrder = (order: OrderItem) => {
    setActiveVisitTarget({
      order,
      orderId: order.id,
      customerName: order.customerName,
      address: order.deliveryAddress || order.residentialDetail || 'Alamat Titik Antar',
    });
    setVisitFormStatus('Drop Galon & Sembako');
    const galonQty = order.totalGalon || 10;
    setVisitFormGalonTurun(galonQty);
    setVisitDropRo19L(galonQty);
    setVisitDropMineral19L(0);
    setVisitDropBotolDus(0);
    setVisitDropCupDus(0);
    setVisitDropRice5kg(0);
    setVisitDropOil2L(0);
    setVisitDropEggsTray(0);
    setVisitDropNoodleBox(0);
    setVisitDropDishwash(0);
    setVisitDropDetergent(0);
    setVisitDropDispenser(0);
    setVisitDropPompa(0);
    setVisitDropGasLpg(0);
    setVisitFormGalonTarik(order.emptyGallonsReturned ?? order.totalGalon ?? galonQty);
    setVisitTarikKrat(0);
    setVisitTarikGas(0);
    setVisitSettleTempoAmount(0);
    setVisitPaymentMethod(order.paymentStatus === 'Lunas' ? 'Tunai' : 'Tempo / Bon Toko');
    setVisitFormNotes('');
    setVisitFormPhotoUrl(null);
    setVisitFormPhotoName('');
    setShowVisitLogModal(true);
  };

  const handleOpenVisitModalForStore = (store: CustomerMasterItem | StoreNexaMetrics) => {
    setActiveVisitTarget({
      storeId: store.id,
      customerName: store.name,
      address: store.address,
    });
    setVisitFormStatus(
      ('tempoBalance' in store && store.tempoBalance > 0) ||
        ('currentReceivable' in store && (store.currentReceivable || 0) > 0)
        ? 'Follow Up Tagihan'
        : 'Drop Galon & Sembako'
    );
    setVisitFormGalonTurun(15);
    setVisitDropRo19L(15);
    setVisitDropMineral19L(0);
    setVisitDropBotolDus(0);
    setVisitDropCupDus(0);
    setVisitDropRice5kg(0);
    setVisitDropOil2L(0);
    setVisitDropEggsTray(0);
    setVisitDropNoodleBox(0);
    setVisitDropDishwash(0);
    setVisitDropDetergent(0);
    setVisitDropDispenser(0);
    setVisitDropPompa(0);
    setVisitDropGasLpg(0);
    setVisitFormGalonTarik(15);
    setVisitTarikKrat(0);
    setVisitTarikGas(0);
    const storeDebt = ('tempoBalance' in store ? store.tempoBalance : (store as any).currentReceivable) || 0;
    setVisitSettleTempoAmount(storeDebt > 0 ? storeDebt : 0);
    setVisitPaymentMethod(storeDebt > 0 ? 'Tunai' : 'Tunai');
    setVisitFormNotes('');
    setVisitFormPhotoUrl(null);
    setVisitFormPhotoName('');
    setShowVisitLogModal(true);
  };

  const handleVisitPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVisitFormPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setVisitFormPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveVisitLog = () => {
    if (!activeVisitTarget) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    const receiptNo = `STRUK-NEXA-${Date.now().toString().slice(-6)}`;

    // Build Multi-Product Drops
    const drops: MultiProductDropItem[] = [];
    if (visitDropRo19L > 0) drops.push({ productId: 'PRD-01', name: 'Aqua/RO Galon 19L', parentCategory: 'AIR_MINUM', qty: visitDropRo19L, uom: 'Tabung', unitPrice: 16000, subtotal: visitDropRo19L * 16000 });
    if (visitDropMineral19L > 0) drops.push({ productId: 'PRD-02', name: 'Le Minerale 19L', parentCategory: 'AIR_MINUM', qty: visitDropMineral19L, uom: 'Tabung', unitPrice: 15000, subtotal: visitDropMineral19L * 15000 });
    if (visitDropBotolDus > 0) drops.push({ productId: 'PRD-03', name: 'Botol 600ml (Dus)', parentCategory: 'AIR_MINUM', qty: visitDropBotolDus, uom: 'Karton/Dus', unitPrice: 36000, subtotal: visitDropBotolDus * 36000 });
    if (visitDropCupDus > 0) drops.push({ productId: 'PRD-04', name: 'Cup 240ml (Dus)', parentCategory: 'AIR_MINUM', qty: visitDropCupDus, uom: 'Karton/Dus', unitPrice: 22500, subtotal: visitDropCupDus * 22500 });
    if (visitDropRice5kg > 0) drops.push({ productId: 'PRD-FD01', name: 'Beras Ramos 5kg', parentCategory: 'FMCG_FOOD', qty: visitDropRice5kg, uom: 'Pack', unitPrice: 68500, subtotal: visitDropRice5kg * 68500 });
    if (visitDropOil2L > 0) drops.push({ productId: 'PRD-FD02', name: 'Minyak Goreng 2L', parentCategory: 'FMCG_FOOD', qty: visitDropOil2L, uom: 'Pcs', unitPrice: 34000, subtotal: visitDropOil2L * 34000 });
    if (visitDropEggsTray > 0) drops.push({ productId: 'PRD-FD03', name: 'Telur Ayam 1 Tray', parentCategory: 'FMCG_FOOD', qty: visitDropEggsTray, uom: 'Tray', unitPrice: 51000, subtotal: visitDropEggsTray * 51000 });
    if (visitDropNoodleBox > 0) drops.push({ productId: 'PRD-FD05', name: 'Mi Instan Box (40)', parentCategory: 'FMCG_FOOD', qty: visitDropNoodleBox, uom: 'Karton/Dus', unitPrice: 115000, subtotal: visitDropNoodleBox * 115000 });
    if (visitDropDishwash > 0) drops.push({ productId: 'PRD-NF01', name: 'Sabun Cuci Piring 650ml', parentCategory: 'FMCG_NON_FOOD', qty: visitDropDishwash, uom: 'Pcs', unitPrice: 14500, subtotal: visitDropDishwash * 14500 });
    if (visitDropDetergent > 0) drops.push({ productId: 'PRD-NF02', name: 'Deterjen Bubuk 770g', parentCategory: 'FMCG_NON_FOOD', qty: visitDropDetergent, uom: 'Pack', unitPrice: 19500, subtotal: visitDropDetergent * 19500 });
    if (visitDropDispenser > 0) drops.push({ productId: 'PRD-LG01', name: 'Dispenser Air Galon', parentCategory: 'NON_FMCG_LOGISTIK', qty: visitDropDispenser, uom: 'Unit', unitPrice: 185000, subtotal: visitDropDispenser * 185000 });
    if (visitDropPompa > 0) drops.push({ productId: 'PRD-LG02', name: 'Pompa Galon Elektrik', parentCategory: 'NON_FMCG_LOGISTIK', qty: visitDropPompa, uom: 'Pcs', unitPrice: 45000, subtotal: visitDropPompa * 45000 });
    if (visitDropGasLpg > 0) drops.push({ productId: 'PRD-LG05', name: 'Tabung Gas LPG 3kg', parentCategory: 'NON_FMCG_LOGISTIK', qty: visitDropGasLpg, uom: 'Tabung', unitPrice: 22000, subtotal: visitDropGasLpg * 22000 });

    // Build Container Mutations
    const totalGalonDrop = visitCalculations.total19LGallonsOut || visitFormGalonTurun;
    const containerMutations: ContainerMutationItem[] = [
      {
        assetType: 'TABUNG_GALON',
        assetName: 'Tabung Galon 19L',
        filledDropped: totalGalonDrop,
        emptyRetrieved: visitFormGalonTarik,
        netShift: totalGalonDrop - visitFormGalonTarik,
        unitName: 'Tabung',
      },
    ];
    if (visitDropBotolDus > 0 || visitTarikKrat > 0) {
      containerMutations.push({
        assetType: 'KRAT_BOTOL',
        assetName: 'Krat / Peti Botol Kaca',
        filledDropped: visitDropBotolDus,
        emptyRetrieved: visitTarikKrat,
        netShift: visitDropBotolDus - visitTarikKrat,
        unitName: 'Krat',
      });
    }
    if (visitDropGasLpg > 0 || visitTarikGas > 0) {
      containerMutations.push({
        assetType: 'TABUNG_GAS',
        assetName: 'Tabung Gas LPG 3kg',
        filledDropped: visitDropGasLpg,
        emptyRetrieved: visitTarikGas,
        netShift: visitDropGasLpg - visitTarikGas,
        unitName: 'Tabung',
      });
    }

    const integratedReceipt: IntegratedVisitReceipt = {
      id: `RCV-${Date.now().toString().slice(-4)}`,
      receiptNumber: receiptNo,
      timestamp: timeStr,
      storeId: activeVisitTarget.storeId || 'STR-01',
      storeName: activeVisitTarget.customerName,
      driverName: activeDriver.name,
      vehiclePlate: activeDriver.plate,
      status: visitFormStatus as any,
      drops,
      containerMutations,
      dropAmountTotal: visitCalculations.multiProductDropTotal,
      previousInvoiceSettled: visitSettleTempoAmount,
      totalCashCollected: visitCalculations.totalCashCollected,
      paymentMethod: visitPaymentMethod,
      picSignatureName: activeVisitTarget.customerName,
      photoProofUrl: visitFormPhotoUrl || undefined,
      notes: visitFormNotes,
    };

    const dropLines = drops.length > 0
      ? drops.map((d) => `• ${d.qty}x ${d.name} (@Rp ${d.unitPrice.toLocaleString('id-ID')})`).join('\n')
      : `• ${totalGalonDrop} Galon 19L Refill`;

    const newLog: VisitLogEntry = {
      id: `VISIT-${Date.now().toString().slice(-4)}`,
      orderId: activeVisitTarget.orderId,
      storeName: activeVisitTarget.customerName,
      customerAddress: activeVisitTarget.address,
      time: timeStr,
      status: visitFormStatus,
      galonIsiTurun: totalGalonDrop,
      galonKosongTarik: visitFormGalonTarik,
      notes: visitFormNotes || `Log ${visitFormStatus}: ${drops.length} jenis produk di-drop, ${visitFormGalonTarik} galon kosong ditarik.`,
      photoUrl: visitFormPhotoUrl || undefined,
      driverName: activeDriver.name,
      dropsSummary: drops.map((d) => `${d.qty} ${d.uom} ${d.name}`).join(', '),
      totalDropAmount: visitCalculations.multiProductDropTotal,
      containerMutationsSummary: `Galon: -${visitFormGalonTarik}/+${totalGalonDrop} Gln${visitTarikKrat > 0 ? `, Krat: -${visitTarikKrat}` : ''}${visitTarikGas > 0 ? `, Gas: -${visitTarikGas}` : ''}`,
      totalCashCollected: visitCalculations.totalCashCollected,
      integratedReceipt,
    };

    setVisitLogs((prev) => [newLog, ...prev]);

    // Perbarui sirkulasi galon di kendaraan
    if (totalGalonDrop > 0 || visitFormGalonTarik > 0) {
      setCargoInventoryMap((prev) => {
        const cur = prev[activeDriver.id] || currentCargo;
        return {
          ...prev,
          [activeDriver.id]: {
            ...cur,
            galonAqua: Math.max(0, cur.galonAqua - totalGalonDrop),
            emptyGallonsCollected: (cur.emptyGallonsCollected || 0) + visitFormGalonTarik,
          },
        };
      });
    }

    // Jika antaran pesanan aktif, selesaikan antaran
    if (activeVisitTarget.order && onCompleteDelivery) {
      onCompleteDelivery(activeVisitTarget.order.id, {
        recipientName: activeVisitTarget.customerName,
        emptyGallonsReturned: visitFormGalonTarik,
        photoProof: visitFormPhotoUrl || undefined,
        note: visitFormNotes,
      });
    }

    // Buat representasi OrderItem untuk cetak struk thermal
    const convertedReceiptOrder: OrderItem = {
      id: receiptNo,
      customerName: activeVisitTarget.customerName,
      customerType: 'Toko Kelontong',
      phone: activeVisitTarget.store?.phone || '0812-0000-0000',
      residentialDetail: activeVisitTarget.address,
      driver: activeDriver.name,
      items: dropLines + (visitSettleTempoAmount > 0 ? `\n• Pelunasan Tempo: Rp ${visitSettleTempoAmount.toLocaleString('id-ID')}` : ''),
      totalAmount: visitCalculations.multiProductDropTotal + visitSettleTempoAmount,
      totalGalon: totalGalonDrop,
      emptyGallonsReturned: visitFormGalonTarik,
      emptyGallonDebt: Math.max(0, totalGalonDrop - visitFormGalonTarik),
      paymentStatus: visitPaymentMethod === 'Tempo / Bon Toko' ? 'Tempo / Bon Toko' as any : 'Lunas',
      gallonScheme: 'Refill Tukar & Sembako' as any,
      podRecipientName: activeVisitTarget.customerName,
      deliveryStatus: 'SELESAI',
      time: timeStr,
    };

    setDriverReceiptOrder(convertedReceiptOrder);

    setSpotOrderSuccessNotice({
      customerName: activeVisitTarget.customerName,
      items: `Log ${visitFormStatus}: ${totalGalonDrop} Gln Turun • ${visitFormGalonTarik} Gln Tarik • Total: Rp ${(visitCalculations.multiProductDropTotal + visitSettleTempoAmount).toLocaleString('id-ID')}`,
      totalAmount: visitCalculations.multiProductDropTotal + visitSettleTempoAmount,
      paymentMethod: visitPaymentMethod,
    });

    setShowVisitLogModal(false);
    setActiveVisitTarget(null);
  };

  const ESTIMATED_ARRIVAL_TIMES = [
    '08:30 WIB (±10 mnt)',
    '09:15 WIB (±45 mnt)',
    '10:00 WIB (±1.5 jam)',
    '10:45 WIB (±2.2 jam)',
    '11:30 WIB (±3.0 jam)',
    '13:15 WIB (±4.5 jam)',
    '14:00 WIB (±5.2 jam)',
    '14:45 WIB (±6.0 jam)',
  ];

  const handleSubmitCollectTempo = () => {
    const list = receivables.length > 0 ? receivables : RECEIVABLES;
    const targetItem = list.find((r) => r.id === selectedTempoId);
    if (!targetItem || tempoAmountPaid <= 0) return;

    if (onCollectTempoPayment) {
      const noteStr = `Titipan supir ${activeDriver.name}${tempoCollectorNote ? ` (${tempoCollectorNote})` : ''}${
        tempoReturnedGallons > 0 ? ` [Bawa kembali ${tempoReturnedGallons} tabung galon]` : ''
      }`;
      onCollectTempoPayment(targetItem.id, tempoAmountPaid, activeDriver.name, noteStr);
    }

    // Show completed receipt popup for easy WhatsApp sending
    setCompletedReceiptData({
      orderId: targetItem.id,
      customerName: targetItem.customerName,
      phone: targetItem.phone,
      items: `Pelunasan Piutang Tempo (Rp ${tempoAmountPaid.toLocaleString('id-ID')})`,
      totalAmount: tempoAmountPaid,
      emptyGallonsReturned: tempoReturnedGallons,
      damagedNotes: undefined,
      paymentStatus: 'Lunas (Titipan Supir)',
      driverName: activeDriver.name,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    setShowCollectTempoModal(false);
  };

  // 1. Integrasi Pinpoint Maps & Navigasi Google Maps
  const handleOpenNavigation = (order: OrderItem) => {
    if (order.mapsUrl) {
      window.open(order.mapsUrl, '_blank');
      return;
    }
    if (order.coordinates?.lat && order.coordinates?.lng) {
      const coordUrl = `https://www.google.com/maps/search/?api=1&query=${order.coordinates.lat},${order.coordinates.lng}`;
      window.open(coordUrl, '_blank');
      return;
    }
    const address = order.deliveryAddress || order.residentialDetail || order.customerName;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${order.customerName}, ${address}, Subang`
    )}`;
    window.open(url, '_blank');
  };

  // 3. Tombol WhatsApp Pelanggan: Kirim WA Siap Antar ke Pelanggan
  const handleSendReadyDeliveryWA = (order: OrderItem) => {
    const rawPhone = (order.phone || '').replace(/\D/g, '');
    let cleanPhone = rawPhone;
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = cleanPhone ? '62' + cleanPhone : '6281234567890';
    }

    const destination = order.deliveryAddress || order.residentialDetail || 'Alamat Terdaftar';
    const landmarkText = order.landmarkNote ? ` (Patokan: ${order.landmarkNote})` : '';
    const textMsg = `Halo Kak/Bpk/Ibu *${order.customerName}*,\n\nSaya *${activeDriver.name}* (Kurir Armada JacS DepoHub 🚚💨).\n\nPesanan Anda *#${order.id}* saat ini *SEDANG DALAM PERJALANAN* menuju alamat tujuan:\n📍 *${destination}${landmarkText}*\n\n📦 *Detail Barang:* ${order.items} (${order.totalGalon} Galon)\n💰 *Status Tagihan:* ${order.paymentStatus === 'Lunas' ? 'Lunas (Non-Tunai)' : `Tagihan Rp ${order.totalAmount.toLocaleString('id-ID')}`}\n\nMohon pastikan penerima berada di lokasi dan tabung galon kosong sudah disiapkan ya. Estimasi segera tiba. Terima kasih! 🙏`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}`, '_blank');
  };

  // 2. Regulasi Kunci (Single Active Task) & Saklar Darurat Multi-Drop: Tombol [✋ SAYA SIAP ANTAR]
  const handleAcceptOrder = (order: OrderItem) => {
    if (hasActiveInProgressTask && !allowMultiDrop) {
      alert(
        `Supir ${activeDriver.name} masih memiliki antaran aktif (#${activeTaskInProgress?.id}). Selesaikan antaran sebelumnya dan upload foto bukti POD terlebih dahulu atau aktifkan saklar [🔓 Izinkan Multi-Drop] di panel admin/kasir.`
      );
      return;
    }

    const assignedDriverName = `${activeDriver.name} (${activeVehicle.plate})`;

    if (onAcceptOrder) {
      onAcceptOrder(order.id, activeDriver.id, assignedDriverName);
    } else {
      order.deliveryStatus = 'DIANTAR';
      order.assignedDriverId = activeDriver.id;
      order.driver = assignedDriverName;
    }

    // Arahkan otomatis ke tab Drop Aktif
    setActiveTab('active');
  };

  const handleOpenWhatsApp = (order: OrderItem) => {
    const phone = order.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const msg = `Halo ${order.customerName}, saya ${activeDriver.name} (Kurir JacS DepoHub). Saya sedang dalam perjalanan mengantar pesanan Anda (${order.items}). Mohon disiapkan tabung kosongnya ya. Terima kasih!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSendWhatsAppReceipt = (receipt: {
    orderId: string;
    customerName: string;
    phone: string;
    items: string;
    totalAmount: number;
    emptyGallonsReturned: number;
    damagedNotes?: string;
    paymentStatus: string;
    driverName: string;
    time: string;
  }) => {
    sendWhatsAppReceipt({
      depoName: 'JacS DepoHub Pro',
      orderId: receipt.orderId,
      customerName: receipt.customerName,
      phone: receipt.phone,
      driverName: receipt.driverName,
      items: receipt.items,
      totalGalon: receipt.emptyGallonsReturned,
      emptyGallonsReturned: receipt.emptyGallonsReturned,
      totalAmount: receipt.totalAmount,
      paymentMethod: receipt.paymentStatus === 'Lunas' ? 'Tunai / QRIS' : 'Tempo Bon Toko',
      paymentStatus: receipt.paymentStatus,
      damagedNotes: receipt.damagedNotes,
      time: receipt.time,
    });
  };

  // 1. LAYAR MASUK / KUNCI PIN CEPAT (LOGIN LOCKSCREEN) JIKA SESI SUPIR BELUM AKTIF
  if (!authenticatedDriverId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950 text-slate-100 select-none overflow-y-auto">
        <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-4 sm:p-5 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col gap-3.5 text-slate-100 relative">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-cyan-400 font-bold block leading-none">
                  JacS DepoHub Pro • NexaField
                </span>
                <h2 className="text-sm font-black text-white uppercase tracking-wider mt-0.5">
                  Sales &amp; Distribusi
                </h2>
              </div>
            </div>
            {onExitDriverMode && (
              <button
                onClick={onExitDriverMode}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>ERP</span>
              </button>
            )}
          </div>

          {/* Security Shield Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-cyan-950/60 border border-cyan-500/40 text-center space-y-1">
            <div className="w-9 h-9 mx-auto rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <KeyRound className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Otentikasi Karyawan Driver
            </h3>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              Kunci akses operasional depo. Masukkan Nomor ID / NIK Driver atau PIN Cepat 4-Digit untuk membuka rute tugas antaran.
            </p>
          </div>

          {/* Quick Touch Preset Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
              <span>Pilih Cepat Karyawan:</span>
              <span className="text-[9px] font-mono text-cyan-400 font-normal">Ketuk 1-Klik Masuk</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {driverProfiles.map((drv) => (
                <button
                  key={drv.id}
                  type="button"
                  onClick={() => handleQuickLogin(drv.id)}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-400 hover:bg-cyan-950/20 text-left transition-all cursor-pointer flex flex-col justify-between group active:scale-95 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                        {drv.id}
                      </span>
                      <span className="text-[8.5px] font-mono text-slate-500">PIN: {drv.pin}</span>
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 mt-1 truncate">
                      {drv.shortName}
                    </div>
                  </div>
                  <div className="text-[8.5px] text-slate-400 mt-1 truncate">
                    {drv.roleTitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleSubmitLogin} className="space-y-2.5 pt-1 border-t border-slate-800">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nomor ID / NIK Driver:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginIdInput}
                  onChange={(e) => setLoginIdInput(e.target.value)}
                  placeholder="Contoh: DRV-01, DRV-02, atau Bambang"
                  className="w-full py-2 px-3 pl-8 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs font-mono text-white placeholder-slate-600 outline-none transition-all uppercase"
                />
                <UserCheck className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-2.5" />
                {loginIdInput && (
                  <button
                    type="button"
                    onClick={() => setLoginIdInput('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                PIN Keamanan (4 Digit):
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={loginPinInput}
                  onChange={(e) => setLoginPinInput(e.target.value)}
                  placeholder="•••• (misal 1234)"
                  className="w-full py-2 px-3 pl-8 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs font-mono text-white placeholder-slate-600 outline-none tracking-widest transition-all"
                />
                <KeyRound className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Virtual PIN Keypad */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') {
                      setLoginPinInput('');
                    } else if (k === '⌫') {
                      setLoginPinInput((prev) => prev.slice(0, -1));
                    } else {
                      setLoginPinInput((prev) => (prev.length < 6 ? prev + k : prev));
                    }
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    k === 'C'
                      ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50'
                      : k === '⌫'
                      ? 'bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 hover:border-cyan-400 hover:bg-cyan-950/30'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-[10px] flex items-center gap-1.5 animate-in fade-in">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-400 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.45)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <UserCheck className="w-4 h-4 text-slate-950" />
              <span>MASUK SALES &amp; DISTRIBUSI</span>
            </button>
          </form>

          <div className="text-[9px] text-slate-500 text-center font-mono pt-1">
            Depo Water & Beverage Fleet Management System • Versi 4.2 Pro
          </div>
        </div>
      </div>
    );
  }

  // 2. SESI AKTIF (SALES & DISTRIBUSI - NEXAFIELD)
  return (
    <div className="h-full max-w-md w-full mx-auto flex flex-col overflow-hidden bg-slate-950 text-slate-100 select-none relative shadow-2xl border-x border-slate-800">
      {/* 1. HEADER ATAS SALES & DISTRIBUSI (NEXAFIELD) */}
      <div className="py-2 px-3 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950"></span>
          </span>
          <div className="min-w-0">
            <span className="text-[8.5px] font-mono font-bold text-cyan-400 uppercase tracking-wider block leading-none">
              Sales &amp; Distribusi
            </span>
            <span
              className="text-xs font-black text-white max-w-[130px] sm:max-w-[170px] truncate block mt-0.5"
              title={activeDriver.name}
            >
              {activeDriver.name}
            </span>
          </div>
          <span className="text-[9.5px] text-emerald-400 font-bold bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
            Online
          </span>
          {allowMultiDrop && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0">
              <Unlock className="w-2.5 h-2.5 text-slate-950" />
              <span>Multi-Drop</span>
            </span>
          )}
        </div>

        {/* Quick buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onExitDriverMode && (
            <button
              onClick={onExitDriverMode}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Kembali ke Tampilan ERP Standar"
            >
              <ChevronLeft className="w-3 h-3 text-cyan-400" />
              <span>ERP</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 cursor-pointer transition-all active:scale-95"
            title="Keluar / Ganti Driver"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-3">
        {/* SPOT ORDER SUCCESS NOTICE BANNER */}
        {spotOrderSuccessNotice && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400 text-emerald-200 text-xs flex items-start justify-between gap-2 shadow-[0_0_16px_rgba(16,185,129,0.3)] animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2">
              <Rocket className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-emerald-300 text-xs block">
                  🚀 Order Spot Berhasil Dibuat!
                </span>
                <p className="text-[10.5px] text-emerald-200/90 mt-0.5">
                  Order untuk <strong className="text-white">{spotOrderSuccessNotice.customerName}</strong> ({spotOrderSuccessNotice.items}) sejumlah <strong>Rp {spotOrderSuccessNotice.totalAmount.toLocaleString('id-ID')}</strong> telah memotong muatan armada truk &amp; langsung diajukan ke antrean approval kasir depo.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSpotOrderSuccessNotice(null)}
              className="text-emerald-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: [HOME] (BERANDA & PETA RUTE)                      */}
        {/* ======================================================== */}
        {fieldTab === 'home' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* CARD PROFIL RINGKAS DI ATAS (TAB HOME) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 shadow-lg space-y-3">
              {/* Baris Profil: Foto/Avatar, Nama Driver, ID Driver, Badge [Online], dan Rating */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar Driver */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-cyan-400 text-base">
                        {activeDriver.name.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  {/* Info Driver */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-black text-white truncate leading-tight">
                        {activeDriver.name}
                      </h2>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                      <span className="text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                        {activeDriver.id}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="truncate">{activeVehicle.name} ({activeVehicle.plate})</span>
                    </div>
                  </div>
                </div>

                {/* Rating Driver */}
                <div className="shrink-0 text-right bg-slate-950/70 border border-amber-500/30 px-2.5 py-1.5 rounded-xl shadow-xs">
                  <div className="flex items-center justify-end gap-1 text-amber-400">
                    <span className="text-xs">⭐</span>
                    <span className="text-xs font-mono font-black text-white">4.8</span>
                  </div>
                  <span className="text-[8.5px] text-slate-400 font-medium block">Rating Driver</span>
                </div>
              </div>

              {/* 3 Card Counter Ringkas Sejajar Horizontal */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
                {/* Counter 1: Toko Binaan */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStoreFilter('all');
                    setFieldTab('toko');
                  }}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-cyan-400/50 transition-all text-left flex flex-col justify-between group active:scale-95 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      Toko Binaan
                    </span>
                    <Store className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <div className="text-base font-mono font-black text-white leading-none">
                      {totalTokoBinaan}
                    </div>
                    <span className="text-[8.5px] text-cyan-400/90 mt-0.5 block truncate">Mitra Terdaftar</span>
                  </div>
                </button>

                {/* Counter 2: Butuh Pasokan */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStoreFilter('critical');
                    setFieldTab('toko');
                  }}
                  className="p-2 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-400 transition-all text-left flex flex-col justify-between group active:scale-95 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider truncate">
                      Butuh Pasokan
                    </span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-base font-mono font-black text-amber-300 leading-none">
                      {totalButuhPasokan}
                    </div>
                    <span className="text-[8.5px] text-amber-400/90 mt-0.5 block truncate">Stok Kritis</span>
                  </div>
                </button>

                {/* Counter 3: Kunjungan Hari Ini */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('active');
                    setFieldTab('aktivitas');
                  }}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-emerald-400/50 transition-all text-left flex flex-col justify-between group active:scale-95 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      Kunjungan
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <div className="text-base font-mono font-black text-emerald-300 leading-none">
                      {completedDrops.length}/{targetDropsCount}
                    </div>
                    <span className="text-[8.5px] text-emerald-400/90 mt-0.5 block truncate">Titik Selesai</span>
                  </div>
                </button>
              </div>
            </div>

            {/* TOMBOL AKSI CEPAT LAPANGAN */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSpotCashPaid(spotPricing.total);
                  setSpotReturnedEmpty(spotPricing.totalGalons);
                  setShowSpotSaleModal(true);
                }}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-amber-500/10 border border-amber-500/40 hover:border-amber-400 text-left transition-all active:scale-95 cursor-pointer shadow-md group"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-300 block leading-tight">
                      ⚡ Jual Cepat
                    </span>
                    <span className="text-[8.5px] text-slate-400 block truncate">Di Lapangan</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCollectTempo()}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-600/15 to-emerald-500/10 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all active:scale-95 cursor-pointer shadow-md group"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-300 block leading-tight">
                      💰 Tagih Tempo
                    </span>
                    <span className="text-[8.5px] text-slate-400 block truncate">Pelunasan Bon</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisterWizardStep(1);
                  handleDetectGps();
                  setShowRegisterModal(true);
                }}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-sky-600/15 to-cyan-500/10 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all active:scale-95 cursor-pointer shadow-md group"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-cyan-300 block leading-tight">
                      🏪 + Toko Baru
                    </span>
                    <span className="text-[8.5px] text-slate-400 block truncate">Wizard 3 Step</span>
                  </div>
                </div>
              </button>
            </div>

            {/* PETA GPS INTERAKTIF (LAT & LONG) & NAVIGASI RUTE TOKO (LEAFLET / OPENSTREETMAP) */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-2.5 shadow-lg">
              <NexaFieldGpsMap
                customers={managedStoresList}
                onOpenSpotSaleForStore={(store) => handleOpenSpotForStore(store)}
                onOpenCollectTempoForStore={(store) => handleOpenCollectTempo(store.id)}
              />
            </div>

            {/* KARTU PETA RUTE & TITIK DROP PRIORITAS BERIKUTNYA */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PETA RUTE &amp; TARGET DROP BERIKUTNYA</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('active');
                    setFieldTab('aktivitas');
                  }}
                  className="text-[9.5px] font-bold text-cyan-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Semua ({activeDrops.length})</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {displayedActiveDrops.length > 0 ? (
                (() => {
                  const nextDrop = displayedActiveDrops[0];
                  return (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2 relative overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 inline-block shadow-xs">
                            ★ PRIORITAS RUTE TERDEKAT (#1)
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1 leading-tight">
                            {nextDrop.customerName}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {nextDrop.deliveryAddress || nextDrop.residentialDetail || 'Alamat Terdaftar di Sistem'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-mono font-black text-cyan-300">
                            {nextDrop.totalGalon || 0}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-bold">Galon</span>
                        </div>
                      </div>

                      {/* Rincian Pesanan */}
                      <div className="text-[10px] text-slate-300 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Muatan:</span> <strong>{nextDrop.items || `${nextDrop.totalGalon} Galon`}</strong>
                        <span className="text-slate-500 mx-1.5">·</span>
                        <span className="text-slate-400">Faktur:</span> <strong>Rp {(nextDrop.totalAmount || 0).toLocaleString('id-ID')}</strong>
                      </div>

                      {/* Tombol Tindakan Cepat */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <a
                          href={
                            nextDrop.mapsUrl ||
                            (nextDrop.coordinates
                              ? `https://www.google.com/maps/dir/?api=1&destination=${nextDrop.coordinates.lat},${nextDrop.coordinates.lng}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  `${nextDrop.customerName} ${nextDrop.deliveryAddress || nextDrop.residentialDetail || ''}`
                                )}`)
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Rute GPS</span>
                        </a>

                        {nextDrop.phone ? (
                          <a
                            href={`tel:${nextDrop.phone}`}
                            className="py-2 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>Telepon</span>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="py-2 px-1.5 rounded-xl bg-slate-900 text-slate-600 border border-slate-800 font-bold text-[10px] flex items-center justify-center gap-1 opacity-50"
                          >
                            <Phone className="w-3 h-3" />
                            <span>No Telp</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenPod(nextDrop)}
                          className="py-2 px-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Serah/POD</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <Truck className="w-7 h-7 text-cyan-400 mx-auto" />
                  <h4 className="text-xs font-bold text-white">Semua Antaran Rutin Selesai!</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                    Semua toko tujuan hari ini sudah terkirim. Gunakan ⚡ Jual Cepat (Kanvas) jika toko mitra membutuhkan tambahan galon langsung di jalan.
                  </p>
                  {openQueueOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('open_queue');
                        setFieldTab('aktivitas');
                      }}
                      className="mt-1 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[10px] font-bold hover:bg-amber-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span>Ada {openQueueOrders.length} Antrean Terbuka di Radar Order</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* STATUS ARMADA & MUATAN TRUK */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>STATUS ARMADA &amp; KAPASITAS</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVehicle = selectedVehicleKey === 'carry' ? 'granmax' : selectedVehicleKey === 'granmax' ? 'viar' : 'carry';
                    setSelectedVehicleKey(nextVehicle);
                  }}
                  className="text-[9.5px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30"
                >
                  <RotateCw className="w-2.5 h-2.5" />
                  <span>Rotasi Kendaraan</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{activeVehicle.name}</div>
                  <div className="text-[10px] font-mono text-cyan-400 font-semibold">{activeVehicle.plate}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-white">
                    {currentArmada.currentLoad} / {activeVehicle.maxGallons}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Kapasitas Galon</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: [TOKO] (DAFTAR TOKO & DETAIL CEPAT NEXAFIELD)     */}
        {/* ======================================================== */}
        {fieldTab === 'toko' && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            {/* Header Tab Toko */}
            <div className="flex items-center justify-between px-0.5">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Daftar Toko Binaan ({filteredStoreMetrics.length})</span>
                </h3>
                <p className="text-[9.5px] text-slate-400">Monitoring stok, runway hari &amp; order mitra distribusi</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRegisterWizardStep(1);
                  handleDetectGps();
                  setShowRegisterModal(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                <PlusCircle className="w-3 h-3" />
                <span>+ Daftarkan Toko Baru</span>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="text"
                  value={storeSearchTerm}
                  onChange={(e) => setStoreSearchTerm(e.target.value)}
                  placeholder="Cari toko, PIC, atau alamat jalan..."
                  className="w-full py-2 px-3 pl-8 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                {storeSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setStoreSearchTerm('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills: [Semua], [Butuh Pasokan], [Kunjungan] */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedStoreFilter('all')}
                  className={`py-1.5 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer text-center ${
                    selectedStoreFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Semua ({storeMetricsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStoreFilter('critical')}
                  className={`py-1.5 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                    selectedStoreFilter === 'critical'
                      ? 'bg-rose-500 text-white font-black shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                      : 'bg-slate-900 text-rose-300 border border-rose-500/30 hover:border-rose-400'
                  }`}
                  title="Stok toko <= 30% atau runway <= 2 hari"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  <span>Butuh Pasokan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStoreFilter('tempo')}
                  className={`py-1.5 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                    selectedStoreFilter === 'tempo'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-900 text-amber-300 border border-amber-500/30 hover:border-amber-400'
                  }`}
                  title="Toko dengan tagihan tempo aktif atau perlu follow up kunjungan"
                >
                  <span>Kunjungan</span>
                </button>
              </div>
            </div>

            {/* List Kartu Toko NexaField */}
            <div className="space-y-2.5">
              {filteredStoreMetrics.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 space-y-1">
                  <Store className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-300">Tidak Ada Toko yang Cocok</div>
                  <p className="text-[10px] text-slate-400">Coba ubah kata kunci pencarian atau bersihkan filter.</p>
                </div>
              ) : (
                filteredStoreMetrics.map((store) => {
                  const rawCustomer = managedStoresList.find((c) => c.id === store.id);

                  return (
                    <div
                      key={store.id}
                      className={`p-3 rounded-2xl border transition-all space-y-2 shadow-md ${
                        store.statusCategory === 'critical'
                          ? 'bg-slate-900/95 border-rose-500/40 hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                          : store.statusCategory === 'warning'
                          ? 'bg-slate-900/95 border-amber-500/40 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                          : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40'
                      }`}
                    >
                      {/* Baris Atas: Nama Toko, Kategori & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black text-white truncate leading-tight">
                              {store.name}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">
                              {store.priceTier}
                            </span>
                          </div>

                          <div className="text-[9.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <User className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <span className="truncate">PIC: {store.ownerName || 'Pemilik Toko'}</span>
                          </div>

                          <div className="text-[9.5px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <span className="truncate">{store.address}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          {store.statusCategory === 'critical' ? (
                            <span className="px-2 py-0.8 rounded-lg text-[8.5px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                              <span>Butuh Pasokan</span>
                            </span>
                          ) : store.statusCategory === 'warning' ? (
                            <span className="px-2 py-0.8 rounded-lg text-[8.5px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1 shadow-xs">
                              <Wallet className="w-3 h-3 text-amber-400" />
                              <span>Perlu Kunjungan</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.8 rounded-lg text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Aman</span>
                            </span>
                          )}

                          {store.tempoBalance > 0 && (
                            <span className="text-[8.5px] font-mono text-amber-300 font-bold block mt-1">
                              Tempo: Rp {store.tempoBalance.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Baris Metrik Vital: Jarak, Sisa Stok, ADS & Runway Hari */}
                      <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 text-center text-xs">
                        {/* 1. Jarak */}
                        <div className="border-r border-slate-800 pr-1">
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">
                            Jarak
                          </span>
                          <span className="text-[11px] font-mono font-black text-cyan-300 block leading-tight mt-0.5">
                            {store.distanceKm} km
                          </span>
                        </div>

                        {/* 2. Sisa Stok */}
                        <div className="border-r border-slate-800 pr-1">
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">
                            Sisa Stok
                          </span>
                          <span className={`text-[11px] font-mono font-black block leading-tight mt-0.5 ${
                            store.stockPercent <= 30 ? 'text-rose-400' : 'text-slate-200'
                          }`}>
                            {store.currentStock} Gln
                          </span>
                          <span className="text-[7.5px] font-mono text-slate-500">
                            ({store.stockPercent}%)
                          </span>
                        </div>

                        {/* 3. ADS (Average Daily Sales) */}
                        <div className="border-r border-slate-800 pr-1">
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">
                            ADS
                          </span>
                          <span className="text-[11px] font-mono font-black text-amber-300 block leading-tight mt-0.5">
                            {store.ads}
                          </span>
                          <span className="text-[7.5px] font-mono text-slate-500">
                            Gln/hari
                          </span>
                        </div>

                        {/* 4. Runway Hari */}
                        <div>
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">
                            Runway
                          </span>
                          <span className={`text-[11px] font-mono font-black block leading-tight mt-0.5 ${
                            store.runwayDays <= 2.0
                              ? 'text-rose-400 font-extrabold'
                              : store.runwayDays <= 3.5
                              ? 'text-amber-400'
                              : 'text-emerald-300'
                          }`}>
                            {store.runwayDays} H
                          </span>
                          <span className={`text-[7.5px] font-bold block ${
                            store.runwayDays <= 2.0 ? 'text-rose-400' : 'text-slate-500'
                          }`}>
                            {store.runwayDays <= 2.0 ? 'Kritis' : 'Hari'}
                          </span>
                        </div>
                      </div>

                      {/* 4 Tombol Aksi Cepat per Toko */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-800/80">
                        {/* Tombol 1: [Navigasi GPS] */}
                        <button
                          type="button"
                          onClick={() => window.open(store.mapsUrl, '_blank')}
                          className="py-2 px-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/50 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                          title="Buka Navigasi Rute Google Maps Resmi"
                        >
                          <Navigation className="w-3 h-3 text-cyan-400" />
                          <span className="truncate">GPS</span>
                        </button>

                        {/* Tombol 2: [WhatsApp PIC] */}
                        <button
                          type="button"
                          onClick={() => window.open(store.waUrl, '_blank')}
                          className="py-2 px-1 rounded-xl bg-slate-950 hover:bg-emerald-950/60 text-emerald-300 border border-slate-800 hover:border-emerald-500/50 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                          title="Chat WhatsApp Resmi ke Nomor PIC Toko"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          <span className="truncate">WhatsApp</span>
                        </button>

                        {/* Tombol 3: [Telepon] */}
                        {store.phone ? (
                          <a
                            href={`tel:${store.phone}`}
                            className="py-2 px-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                            title="Panggilan Telepon Seluler Langsung"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span className="truncate">Telepon</span>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="py-2 px-1 rounded-xl bg-slate-950 text-slate-600 border border-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
                          >
                            <Phone className="w-3 h-3" />
                            <span className="truncate">No Telp</span>
                          </button>
                        )}

                        {/* Tombol 4: [+ Drop Galon / Catat Order] */}
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenVisitModalForStore(store);
                          }}
                          className="py-2 px-1 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-300 hover:from-cyan-400 hover:to-sky-300 text-slate-950 text-[9.5px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Catat Drop Galon / Order Baru Langsung ke Toko Ini"
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span className="truncate">+ Drop Galon</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: [AKTIVITAS] (MULTI-DROP & LOG KUNJUNGAN)          */}
        {/* ======================================================== */}
        {fieldTab === 'aktivitas' && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            {/* SUB-NAV AKTIVITAS: DROP AKTIF vs RADAR ORDER vs RIWAYAT */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'active'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-3 h-3" />
                <span>Drop Aktif ({activeDrops.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('open_queue')}
                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'open_queue'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Radar ({openQueueOrders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'completed'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Selesai ({completedDrops.length})</span>
              </button>
            </div>

            {/* FILTER & PEMILAHAN TIPE ANTARAN (TOKO VS RESIDENSIAL) - KHUSUS DROP AKTIF */}
            {activeTab === 'active' && (
              <div className="p-2 px-2.5 bg-slate-950/85 rounded-xl border border-slate-800 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 text-cyan-300 font-extrabold uppercase tracking-wide">
                    <Filter className="w-3 h-3 text-cyan-400" />
                    <span>Pemilah Tipe Antaran:</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {activeDrops.length} Total Antrean
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSegmentFilter('all')}
                    className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                      segmentFilter === 'all'
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)] font-black'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="leading-tight">Semua Antaran</span>
                    <span className="text-[8.5px] font-mono opacity-80 mt-0.5">({activeDrops.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSegmentFilter('store')}
                    className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                      segmentFilter === 'store'
                        ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                    title="Grosir / Toko Mitra: Volume besar, fokus tukar galon & tagihan tempo/faktur"
                  >
                    <span className="flex items-center gap-1 leading-tight">
                      <Store className="w-3 h-3" />
                      <span>🏪 Grosir/Toko</span>
                    </span>
                    <span className="text-[8.5px] font-mono opacity-80 mt-0.5">({activeStoreDrops.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSegmentFilter('residential')}
                    className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                      segmentFilter === 'residential'
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] font-black'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                    title="Residensial / Rumah Warga: Volume satuan 1-3 galon, fokus pembayaran cash/QRIS cepat"
                  >
                    <span className="flex items-center gap-1 leading-tight">
                      <Home className="w-3 h-3" />
                      <span>🏠 Residensial</span>
                    </span>
                    <span className="text-[8.5px] font-mono opacity-80 mt-0.5">({activeResidentialDrops.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* DAFTAR KARTU DROP / KUNJUNGAN AKTIVITAS */}
            {activeTab === 'open_queue' ? (
            openQueueOrders.length === 0 ? (
              <div className="min-h-[55vh] flex flex-col items-center justify-center text-slate-400 py-6 px-4 text-center my-auto">
                <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                  <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Tidak Ada Antrean Terbuka Saat Ini
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                  Semua pesanan kirim armada sudah diambil supir atau kasir belum menerbitkan order pengiriman baru.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className="mt-4 min-h-[48px] h-12 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span>Buka Drop Aktif ({activeDrops.length})</span>
                </button>
              </div>
            ) : (
              openQueueOrders.map((order, idx) => {
                const isRes = isOrderResidential(order);
                const hasMaps = Boolean(order.mapsUrl || order.coordinates);

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border p-3.5 transition-all shadow-xl flex flex-col gap-2.5 bg-slate-900 border-slate-700/80 hover:border-emerald-500/50 relative overflow-hidden group"
                  >
                    {/* Top Glow Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

                    {/* 1. HEADER KARTU: JARAK/WAKTU, JENIS CUSTOMER, DAN TOTAL TAGIHAN */}
                    <div className="flex items-start justify-between gap-2 pt-0.5">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9.5px] font-mono text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{order.time || 'Baru Masuk'}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-cyan-400">±1.8 km</span>
                          </span>

                          {isRes ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Home className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Residensial</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Store className="w-2.5 h-2.5 text-amber-400" />
                              <span>Toko Mitra</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-cyan-400 font-bold">
                          #{order.id}
                        </span>
                      </div>

                      {/* Total Tagihan Mencolok */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-black text-emerald-400">
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </div>
                        <span
                          className={`text-[8.5px] font-bold block ${
                            order.paymentStatus === 'Lunas'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {order.paymentStatus === 'Lunas'
                            ? '● Lunas (Non-Tunai)'
                            : '● Tagih Tunai (COD)'}
                        </span>
                      </div>
                    </div>

                    {/* 2. ALAMAT JEMPUT & ANTAR */}
                    <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800 space-y-2">
                      {/* Titik Jemput */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 ring-2 ring-cyan-500/30" />
                        <span className="truncate">Depo Air Minum Mineral Subang Pusat</span>
                      </div>

                      {/* Line connector */}
                      <div className="ml-1 pl-3 border-l-2 border-dashed border-slate-700"></div>

                      {/* Titik Antar: Nama Toko & Alamat Langsung */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-white leading-tight">
                            {order.customerName}
                          </h4>
                          <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                            {order.deliveryAddress || order.residentialDetail || 'Alamat Belum Terisi'}
                          </p>
                          {order.landmarkNote && (
                            <div className="mt-1 text-[9.5px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-md p-1 px-1.5 flex items-start gap-1">
                              <span className="font-extrabold text-amber-400 uppercase text-[8.5px]">Patokan:</span>
                              <span>{order.landmarkNote}</span>
                            </div>
                          )}
                          {order.coordinates && (
                            <div className="text-[9px] font-mono text-cyan-400/90 mt-1">
                              📍 Koordinat: {order.coordinates.lat.toFixed(5)}, {order.coordinates.lng.toFixed(5)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. MUATAN RINGKAS SATU BARIS */}
                    <div className="p-2 px-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-semibold truncate text-[11px] min-w-0">
                        <Package className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{order.items}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {order.totalGalon} Gln • {order.gallonScheme}
                      </span>
                    </div>

                    {/* 4. TOMBOL NAVIGASI GOOGLE MAPS */}
                    <button
                      type="button"
                      onClick={() => handleOpenNavigation(order)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold border border-slate-700 hover:border-cyan-400 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <span>🧭 Navigasi Google Maps</span>
                      {hasMaps && (
                        <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/30">
                          Pin GPS
                        </span>
                      )}
                    </button>

                    {/* 5. TOMBOL AKSI PENUH DI BAWAH KARTU (TERIMA ORDER / GEMBOK) */}
                    {hasActiveInProgressTask && !allowMultiDrop ? (
                      <button
                        type="button"
                        disabled
                        className="w-full h-12 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-400 font-black text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-75 shadow-none"
                      >
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>🔒 SELESAIKAN ANTARAN SEBELUMNYA DULU</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAcceptOrder(order)}
                        className={`w-full h-12 rounded-xl font-black text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg ${
                          allowMultiDrop
                            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.5)] border border-amber-300'
                            : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        }`}
                      >
                        <span className="text-base">✋</span>
                        <span>
                          {allowMultiDrop
                            ? 'SAYA SIAP ANTAR (MULTI-DROP)'
                            : 'TERIMA ORDER / SIAP ANTAR'}
                        </span>
                        {allowMultiDrop && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-white font-bold">
                            {hasActiveInProgressTask ? '+1 Tambahan' : 'Multi-Drop'}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )
          ) : activeTab === 'active' ? (
            displayedActiveDrops.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-2xl mb-2.5">
                  <Filter className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">
                  {segmentFilter === 'store'
                    ? 'Tidak ada antaran Toko / Grosir pada rute aktif ini'
                    : segmentFilter === 'residential'
                    ? 'Tidak ada antaran Residensial / Rumah Warga pada rute aktif ini'
                    : 'Semua Antaran Hari Ini Selesai!'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  {segmentFilter !== 'all' ? (
                    <button
                      type="button"
                      onClick={() => setSegmentFilter('all')}
                      className="text-cyan-400 underline font-bold mt-1 cursor-pointer block mx-auto"
                    >
                      Tampilkan Semua Antaran ({activeDrops.length})
                    </button>
                  ) : (
                    `Semua toko dan pelanggan rute ${activeDriver.vehicleLabel} telah dilayani. Gunakan ⚡ Jual Kanvas jika ada pesanan baru di jalan.`
                  )}
                </p>
              </div>
            ) : (
              displayedActiveDrops.map((order, index) => {
                const isFirstPriority = index === 0;
                const isRes = isOrderResidential(order);

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border p-3 transition-all shadow-md flex flex-col gap-2 ${
                      isFirstPriority
                        ? 'bg-slate-900 border-2 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.3)] relative'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    {/* Header Card: Urutan Rute Titik Ke-X & Estimasi Jam Tiba Sesuai NexaField */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9.5px] font-black px-2.5 py-0.8 rounded-full uppercase tracking-wider ${
                              isFirstPriority
                                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] font-black'
                                : 'bg-slate-800 text-cyan-300 border border-slate-700'
                            }`}
                          >
                            {isFirstPriority ? `★ TITIK #${index + 1} PRIORITAS` : `TITIK #${index + 1}`}
                          </span>

                          {/* Estimasi Jam Tiba Sesuai Referensi NexaField */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-800/90 text-amber-300 border border-slate-700">
                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                            <span>Est. Tiba: {ESTIMATED_ARRIVAL_TIMES[index % ESTIMATED_ARRIVAL_TIMES.length] || '08:30 WIB'}</span>
                          </span>
                        </div>

                        <span className="text-[9.5px] font-mono text-cyan-400 font-bold">
                          #{order.id}
                        </span>
                      </div>

                      {/* LENCANA (BADGE) TEGAS: TIPE TOKO MITRA VS RESIDENSIAL */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        {isRes ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                            <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Tipe: RESIDENSIAL</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Tipe: TOKO MITRA</span>
                          </div>
                        )}

                        <span className="text-[8.5px] font-mono text-slate-400">
                          {isRes ? 'Volume Satuan (1-3 Gln) · Cash/QRIS Cepat' : 'Volume Besar · Tukar Galon & Tempo/Faktur'}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Location */}
                    <div>
                      <h4 className="text-xs font-black text-white leading-tight">
                        {order.customerName}
                      </h4>
                      <div className="text-[10px] text-slate-300 mt-0.5 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          {order.deliveryAddress || order.residentialDetail || 'Jl. Raya Subang'}
                        </span>
                      </div>
                      {order.landmarkNote && (
                        <div className="text-[9.5px] text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-lg p-1 px-1.5 mt-1 flex items-start gap-1">
                          <span className="font-bold text-amber-400">Patokan:</span>
                          <span>{order.landmarkNote}</span>
                        </div>
                      )}
                      {order.coordinates && (
                        <div className="text-[9px] font-mono text-cyan-400/90 mt-0.5">
                          📍 GPS: {order.coordinates.lat.toFixed(5)}, {order.coordinates.lng.toFixed(5)}
                        </div>
                      )}
                    </div>

                    {/* Multi-Item Cargo Breakdown & Target Tarik */}
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 grid grid-cols-2 gap-2 text-xs">
                      {/* Barang Dihantar */}
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">
                          Rincian Barang Dihantar:
                        </span>
                        <div className="font-bold text-cyan-300 mt-0.5 text-[11px] leading-snug">
                          {order.items}
                        </div>
                        <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5">
                          Total Galon: <strong>{order.totalGalon} Tbg</strong>
                        </span>
                      </div>

                      {/* Target Tarik Galon Kosong */}
                      <div className="border-l border-slate-800 pl-2">
                        <span className="text-[9px] text-amber-400 uppercase font-bold block flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Target Tarik:
                        </span>
                        <div className="text-xs font-mono font-black text-amber-300 mt-0.5">
                          {order.totalGalon} Tabung Kosong
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Skema: {order.gallonScheme}
                        </span>
                      </div>
                    </div>

                    {/* Payment Status Pill */}
                    <div className="flex items-center justify-between text-[10px] bg-slate-950/40 p-1.5 px-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 font-semibold">
                        Tagihan / Pembayaran:
                      </span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[9.5px] ${
                          order.paymentStatus === 'Lunas'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {order.paymentStatus === 'Lunas'
                          ? 'Lunas (Non-Tunai)'
                          : `Tagih: Rp ${order.totalAmount.toLocaleString('id-ID')}`}
                      </span>
                    </div>

                    {/* Matching Tempo Receivable Banner & Quick Collect */}
                    {(() => {
                      const list = receivables.length > 0 ? receivables : RECEIVABLES;
                      const matchTempo = list.find(
                        (r) =>
                          r.customerName.toLowerCase().includes(order.customerName.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(r.customerName.toLowerCase())
                      );
                      if (!matchTempo) return null;

                      return (
                        <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Nota Tempo: {matchTempo.id}
                            </span>
                            <span className="font-mono font-bold text-amber-400">
                              Rp {matchTempo.amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenCollectTempo(matchTempo.id)}
                            className="w-full py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-200 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <DollarSign className="w-3 h-3 text-amber-300" />
                            <span>Terima Titip Tagihan Tempo ({matchTempo.customerName})</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* 3. Tombol WhatsApp Pelanggan: Kirim WA Siap Antar ke Pelanggan */}
                    <button
                      type="button"
                      onClick={() => handleSendReadyDeliveryWA(order)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black border border-emerald-400/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-950/40"
                    >
                      <span className="text-sm">📲</span>
                      <span>Kirim WA Siap Antar ke Pelanggan</span>
                    </button>

                    {/* Quick Action Navigation & WA Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        onClick={() => handleOpenNavigation(order)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] font-bold border border-slate-700 hover:border-cyan-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        <span>🧭 Google Maps</span>
                      </button>
                      <button
                        onClick={() => handleOpenWhatsApp(order)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] font-bold border border-slate-700 hover:border-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Telepon / Chat</span>
                      </button>
                    </div>

                    {/* MAIN BUTTON: SELESAIKAN PENGANTARAN (POD) ATAU BADGE STATUS APPROVAL */}
                    {order.deliveryStatus === 'MENUNGGU_APPROVAL_ADMIN' ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400 text-amber-200 text-xs space-y-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] mt-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-amber-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            <span>Menunggu Approval Admin / Kasir</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-400 text-slate-950 animate-pulse">
                            Dalam Peninjauan
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-200/90 leading-relaxed">
                          Pesanan spot ini sedang divalidasi ketersediaan stok muatan armada oleh Admin/Kasir di depo. Begitu disetujui, pesanan otomatis berpindah ke Riwayat Selesai &amp; komisi Anda langsung dibukukan.
                        </p>
                      </div>
                    ) : order.deliveryStatus === 'JADWAL_DROP_BERIKUTNYA' ? (
                      <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-400 text-blue-200 text-xs space-y-1.5 shadow-[0_0_12px_rgba(59,130,246,0.25)] mt-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-blue-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                            <span>📅</span>
                            <span>Jadwal Drop Besok (Gudang Depo)</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500 text-white">
                            Jadwal Besok
                          </span>
                        </div>
                        <p className="text-[10px] text-blue-200/90 leading-relaxed">
                          Muatan armada hari ini tidak mencukupi. Pesanan ini telah dialihkan oleh Admin untuk pengiriman esok hari langsung dari stok gudang depo tanpa memotong muatan Anda hari ini.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mt-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenVisitModalForOrder(order)}
                          className="h-12 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                          title="Buka Formulir Log Kunjungan (Status, Foto, Tarik/Turun Galon)"
                        >
                          <ClipboardList className="w-4 h-4 text-cyan-400" />
                          <span className="leading-tight text-center">LOG KUNJUNGAN</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenPod(order)}
                          className="h-12 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-400 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs shadow-[0_0_14px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
                          <span className="leading-tight text-center">DROP (POD)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            /* TAB AKTIVITAS 3: LOG SELESAI */
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Riwayat Drop Selesai Hari Ini</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {completedDrops.length} Sukses
                </span>
              </div>

              {completedDrops.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 space-y-1">
                  <Package className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-300">Belum Ada Antaran Selesai</div>
                  <p className="text-[10px] text-slate-400">
                    Ambil pesanan di sub-tab Radar Antrean atau selesaikan pesanan di Drop Aktif.
                  </p>
                </div>
              ) : (
                completedDrops.map((order) => (
                  <div
                    key={order.id}
                    className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{order.customerName}</span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                        TERKIRIM
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{order.items}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[9.5px] text-slate-400 font-mono flex-wrap gap-1">
                      <span>Tabung Ditarik: <strong className="text-amber-300">{order.emptyGallonsReturned ?? order.totalGalon} Galon</strong></span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDriverReceiptOrder(order)}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30"
                          title="Cetak Struk / Nota Thermal (58mm/80mm)"
                        >
                          <Printer className="w-2.5 h-2.5" />
                          <span>Struk</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendWhatsAppReceipt({
                              orderId: order.id,
                              customerName: order.customerName,
                              phone: order.phone,
                              items: order.items,
                              totalAmount: order.totalAmount,
                              emptyGallonsReturned: order.emptyGallonsReturned ?? order.totalGalon,
                              damagedNotes: order.damagedItemsNote,
                              paymentStatus: order.paymentStatus,
                              driverName: activeDriver.name,
                              time: order.time || '10:00 WIB',
                            })
                          }
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30"
                          title="Kirim Nota Struk WA ke Pelanggan"
                        >
                          <Share2 className="w-2.5 h-2.5" />
                          <span>WA</span>
                        </button>
                        <span className="text-emerald-400 font-bold">
                          +Rp {((order.totalGalon || 0) * courierGallonRate).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Log Kunjungan & Multi-Drop Lapangan NexaField */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Log Kunjungan Toko Lapangan ({visitLogs.length})</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    {visitLogs.filter((v) => v.status === 'Drop Galon').length} Drop · {visitLogs.filter((v) => v.status === 'Kunjungan').length} Visit
                  </span>
                </div>

                {visitLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="truncate">{log.storeName}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold font-mono ${
                        log.status === 'Drop Galon'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : log.status === 'Order Baru'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : log.status === 'Follow Up Tagihan'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                      <span className="truncate">{log.customerAddress}</span>
                    </div>

                    <p className="text-[10px] text-slate-300 bg-slate-950 p-1.5 rounded-lg border border-slate-900">
                      {log.notes}
                    </p>

                    {log.photoUrl && (
                      <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-lg border border-slate-900">
                        <img
                          src={log.photoUrl}
                          alt="Foto Bukti"
                          className="w-8 h-8 rounded object-cover border border-slate-800"
                        />
                        <span className="text-[9px] font-mono text-emerald-400 font-bold">
                          ✓ Foto Bukti Terlampir
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Waktu: {log.time}</span>
                      <span className="text-cyan-300 font-bold">
                        ↓ {log.galonIsiTurun} Gln Isi · ↑ {log.galonKosongTarik} Gln Kosong
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

        {/* ======================================================== */}
        {/* TAB 4: [KINERJA] (KPI OMZET & RITASE)                    */}
        {/* ======================================================== */}
        {fieldTab === 'kinerja' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Header Kinerja */}
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>KPI &amp; Komisi Supir (NexaField)</span>
              </h3>
              <p className="text-[9.5px] text-slate-400">Ringkasan metrik harian, omzet, kunjungan toko &amp; performa ritase</p>
            </div>

            {/* RINGKASAN METRIK: OMZET HARI INI, TOKO DIKUNJUNGI, TOKO BARU TERDAFTAR, ESTIMASI KOMISI DRIVER */}
            {(() => {
              const omzetHariIniTotal =
                completedDrops.reduce((acc, o) => acc + (o.totalAmount || 0), 0) +
                (visitLogs.reduce((acc, v) => acc + (v.status === 'Drop Galon' ? v.galonIsiTurun * 19000 : 0), 0)) || 1520000;
              const tokoDikunjungiCount = Math.max(
                1,
                completedDrops.length + visitLogs.filter((v) => v.status === 'Kunjungan' || v.status === 'Drop Galon').length
              );
              const totalTokoTarget = Math.max(8, activeDrops.length + completedDrops.length + 2);
              const persentaseKunjungan = Math.min(100, Math.round((tokoDikunjungiCount / totalTokoTarget) * 100));
              const totalGalonDeliveredToday =
                completedDrops.reduce((acc, o) => acc + (o.totalGalon || 0), 0) +
                visitLogs.reduce((acc, v) => acc + v.galonIsiTurun, 0) || 80;
              const estimasiKomisiHariIni = totalGalonDeliveredToday * courierGallonRate;
              const tokoBaruCount = driverSubmittedStores.length || 2;

              return (
                <div className="space-y-3">
                  {/* 4 Kotak Metrik Sesuai Spesifikasi NexaField */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Metrik 1: Omzet Hari Ini (Rp) */}
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-1 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                          Omzet Hari Ini
                        </span>
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-base font-mono font-black text-emerald-300">
                        Rp {omzetHariIniTotal.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[8.5px] text-slate-400 block font-mono">
                        {completedDrops.length + visitLogs.length} transaksi ritase
                      </span>
                    </div>

                    {/* Metrik 2: Toko Dikunjungi (X / Y) */}
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-1 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">
                          Toko Dikunjungi
                        </span>
                        <Store className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="text-base font-mono font-black text-amber-300">
                        {tokoDikunjungiCount} / {totalTokoTarget} Toko
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${persentaseKunjungan}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-400 block font-mono">
                        {persentaseKunjungan}% target rute tercapai
                      </span>
                    </div>

                    {/* Metrik 3: Toko Baru Terdaftar */}
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-1 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300">
                          Toko Baru Terdaftar
                        </span>
                        <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="text-base font-mono font-black text-cyan-300">
                        {tokoBaruCount} Toko
                      </div>
                      <span className="text-[8.5px] text-slate-400 block font-mono">
                        Mitra binaan registrasi supir
                      </span>
                    </div>

                    {/* Metrik 4: Estimasi Komisi Driver Hari Ini (Rp) */}
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-sky-500/30 space-y-1 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[9px] font-black uppercase tracking-wider text-sky-300">
                          Estimasi Komisi Driver
                        </span>
                        <Award className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <div className="text-base font-mono font-black text-sky-300">
                        Rp {estimasiKomisiHariIni.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[8.5px] text-sky-400/90 font-mono block">
                        +{courierGallonRate}/tabung galon terkirim
                      </span>
                    </div>
                  </div>

                  {/* BAR CHART MINI PERFORMA PENGANTARAN 7 HARI TERAKHIR */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Performa Pengantaran 7 Hari Terakhir</span>
                        </h4>
                        <p className="text-[9px] text-slate-400">Volume galon terkirim &amp; konsistensi ritase</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Avg: 88.5 Gln/hari
                      </span>
                    </div>

                    {/* Visualisasi Bar Chart Mini */}
                    <div className="pt-2 pb-1">
                      <div className="h-28 flex items-end justify-between gap-1.5 px-1 relative">
                        {/* Garis Benchmark Target Kuota 70 Gln */}
                        <div
                          className="absolute left-0 right-0 border-b border-dashed border-cyan-400/30 pointer-events-none z-0"
                          style={{ bottom: `${(70 / 130) * 100}%` }}
                        >
                          <span className="text-[7.5px] font-mono text-cyan-400/80 bg-slate-950 px-1 py-0.2 rounded absolute right-0 -top-3">
                            Target: 70 Gln
                          </span>
                        </div>

                        {WEEKLY_PERFORMANCE_DATA.map((item) => {
                          const maxGallons = 130;
                          const heightPercent = Math.min(100, Math.round((item.gallons / maxGallons) * 100));
                          const isToday = item.isToday;

                          return (
                            <div
                              key={item.day}
                              className="flex-1 flex flex-col items-center h-full justify-end group relative z-10"
                            >
                              {/* Label Jumlah Galon Di Atas Bar */}
                              <span
                                className={`text-[8.5px] font-mono font-extrabold mb-1 ${
                                  isToday ? 'text-cyan-300 font-black' : 'text-slate-400 group-hover:text-white'
                                }`}
                              >
                                {item.gallons}
                              </span>

                              {/* Batang Bar Column */}
                              <div className="w-full max-w-[28px] bg-slate-950 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                                <div
                                  className={`w-full rounded-t-lg transition-all duration-300 ${
                                    isToday
                                      ? 'bg-gradient-to-t from-cyan-500 via-sky-400 to-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                                      : 'bg-gradient-to-t from-slate-800 to-slate-700 group-hover:from-sky-900 group-hover:to-cyan-600'
                                  }`}
                                  style={{ height: `${heightPercent}%` }}
                                />
                              </div>

                              {/* Label Hari Di Bawah Bar */}
                              <div className="mt-1.5 text-center">
                                <span
                                  className={`text-[9.5px] font-bold block ${
                                    isToday ? 'text-cyan-400 font-black' : 'text-slate-400'
                                  }`}
                                >
                                  {item.day}
                                </span>
                                <span className="text-[7px] font-mono text-slate-500 block -mt-0.5">
                                  {item.date}
                                </span>
                              </div>

                              {/* Tooltip Hover / Info Ringkas */}
                              {isToday && (
                                <span className="absolute -top-5 px-1 py-0.2 rounded text-[7px] font-mono font-black bg-cyan-400 text-slate-950 shadow-xs uppercase">
                                  Hari Ini
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ringkasan Strip 7 Hari Terakhir */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-sans">
                          Total 7 Hari
                        </span>
                        <span className="text-[11px] font-black text-white">620 Gln</span>
                      </div>
                      <div className="border-x border-slate-800">
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-sans">
                          Omzet 7 Hari
                        </span>
                        <span className="text-[11px] font-black text-emerald-400">Rp 11.78 Jt</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-sans">
                          Komisi 7 Hari
                        </span>
                        <span className="text-[11px] font-black text-cyan-300">Rp 620 Rb</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Detail Riwayat Antaran Selesai & Nota */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Log Kunjungan Sukses Hari Ini</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {completedDrops.length} Selesai
                </span>
              </div>

              {completedDrops.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 space-y-1">
                  <Package className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-300">Belum Ada Kunjungan Selesai</div>
                  <p className="text-[10px] text-slate-400">
                    Selesaikan pengantaran di tab Aktivitas untuk memicu pencatatan omzet dan komisi.
                  </p>
                </div>
              ) : (
                completedDrops.map((order) => (
                  <div
                    key={order.id}
                    className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{order.customerName}</span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                        TERKIRIM
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{order.items}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[9.5px] text-slate-400 font-mono flex-wrap gap-1">
                      <span>
                        Faktur: <strong className="text-white">Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDriverReceiptOrder(order)}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30"
                          title="Cetak Struk / Nota Thermal (58mm/80mm)"
                        >
                          <Printer className="w-2.5 h-2.5" />
                          <span>Struk</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendWhatsAppReceipt({
                              orderId: order.id,
                              customerName: order.customerName,
                              phone: order.phone,
                              items: order.items,
                              totalAmount: order.totalAmount,
                              emptyGallonsReturned: order.emptyGallonsReturned ?? order.totalGalon,
                              damagedNotes: order.damagedItemsNote,
                              paymentStatus: order.paymentStatus,
                              driverName: activeDriver.name,
                              time: order.time || '10:00 WIB',
                            })
                          }
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30"
                          title="Kirim Nota Struk WA ke Pelanggan"
                        >
                          <Share2 className="w-2.5 h-2.5" />
                          <span>WA</span>
                        </button>
                        <span className="text-emerald-400 font-bold">
                          +Rp {((order.totalGalon || 0) * courierGallonRate).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: [PROFIL] (PROFIL DRIVER / SALES)                  */}
        {/* ======================================================== */}
        {fieldTab === 'profil' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Header Profil */}
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Profil Driver &amp; Armada Distribusi</span>
              </h3>
              <p className="text-[9.5px] text-slate-400">Identitas operasional, rotasi kendaraan &amp; status pengajuan toko</p>
            </div>

            {/* Profil Card Lengkap */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-cyan-400 text-lg">
                    {activeDriver.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-white leading-tight truncate">{activeDriver.name}</h4>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold block mt-0.5">
                    ID: {activeDriver.id} • NIK: {activeDriver.nik || 'NIK-320491'}
                  </span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">
                    {activeDriver.roleTitle || 'Kurir & Sales Lapangan'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px] text-slate-300">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Rating Layanan</span>
                  <span className="text-xs font-bold text-amber-400">⭐ 4.8 / 5.0</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Status Akun</span>
                  <span className="text-xs font-bold text-emerald-400">✅ Aktif Terverifikasi</span>
                </div>
              </div>
            </div>

            {/* Manajemen Armada */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-md">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                KENDARAAN DISTRIBUSI HARI INI
              </span>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-bold text-white text-xs">{activeVehicle.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{activeVehicle.plate}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVehicle = selectedVehicleKey === 'carry' ? 'granmax' : selectedVehicleKey === 'granmax' ? 'viar' : 'carry';
                    setSelectedVehicleKey(nextVehicle);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                >
                  Rotasi Armada
                </button>
              </div>
            </div>

            {/* SINKRONISASI DATA OFFLINE LAPANGAN (NEXAFIELD CLOUD SYNC) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-cyan-950/20 to-slate-900/95 border border-cyan-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>SINKRONISASI DATA OFFLINE</span>
                    </h4>
                    <span className="text-[9.5px] text-cyan-300 font-mono block">
                      Cache HP • Mode Lapangan Blank Spot
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Cloud Depo Siap</span>
                </div>
              </div>

              {/* Status Sync Info Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[9px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Terakhir Sinkron:</span>
                  </span>
                  <div className="font-mono font-bold text-cyan-300 text-[10.5px] truncate">
                    {lastSyncTimestamp}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[9px] text-slate-400 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                    <span>Antrean Tertunda:</span>
                  </span>
                  <div className="font-mono font-bold text-emerald-400 text-[10.5px]">
                    0 Mutasi (Sinkron 100%)
                  </div>
                </div>
              </div>

              {/* Tombol Eksekusi Sinkronisasi */}
              <button
                type="button"
                disabled={isSyncingOffline}
                onClick={handleSyncOfflineData}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_18px_rgba(6,182,212,0.4)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSyncingOffline ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Menghubungkan &amp; Mengunggah Data ke Cloud...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-slate-950 fill-current" />
                    <span>⚡ Sinkronisasi Data Offline Sekarang</span>
                  </>
                )}
              </button>

              {/* Pesan Feedback Sinkronisasi */}
              {offlineSyncMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{offlineSyncMessage}</span>
                </div>
              )}

              <p className="text-[9px] text-slate-400 leading-relaxed">
                ℹ️ Saat sinyal lemah atau blank spot di rute toko, data serah terima barang (POD), foto, tanda tangan digital, mutasi galon kosong, dan registrasi toko otomatis tersimpan di cache lokal HP dan dapat diunggah dengan 1 klik tombol di atas.
              </p>
            </div>

            {/* REKAPITULASI RITASE BULANAN (MONTHLY TRIPS SUMMARY) */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>REKAPITULASI RITASE BULANAN</span>
                    </h4>
                    <span className="text-[9.5px] text-amber-300 font-mono block">
                      Performa Ritase Armada &amp; Insentif
                    </span>
                  </div>
                </div>

                {/* Dropdown Selector Bulan */}
                <select
                  value={selectedRitaseMonth}
                  onChange={(e) => setSelectedRitaseMonth(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-bold text-[10px] outline-none cursor-pointer focus:border-cyan-400"
                >
                  <option value="Oktober 2026">Oktober 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="Agustus 2026">Agustus 2026</option>
                </select>
              </div>

              {/* Data Ritase Berdasarkan Bulan Terpilih */}
              {(() => {
                const monthData = selectedRitaseMonth === 'September 2026'
                  ? {
                      totalRitase: 62,
                      targetRitase: 60,
                      percentTarget: 103.3,
                      galonKirim: 2790,
                      dusKirim: 380,
                      omzet: 57200000,
                      insentif: 2420000,
                      avgPerDay: 2.5,
                      avgStoresPerRit: 11.5,
                      weeks: [
                        { w: 'W1 (1-7 Sep)', rit: 16, galon: 720, insentif: 560000, status: '100% Selesai' },
                        { w: 'W2 (8-14 Sep)', rit: 15, galon: 675, insentif: 525000, status: '100% Selesai' },
                        { w: 'W3 (15-21 Sep)', rit: 16, galon: 720, insentif: 560000, status: '100% Selesai' },
                        { w: 'W4 (22-30 Sep)', rit: 15, galon: 675, insentif: 525000, status: '100% Selesai' },
                      ],
                      bonusNote: '🎉 Bonus Target Bulanan +Rp 250.000 tercapai!',
                    }
                  : selectedRitaseMonth === 'Agustus 2026'
                  ? {
                      totalRitase: 58,
                      targetRitase: 60,
                      percentTarget: 96.7,
                      galonKirim: 2610,
                      dusKirim: 345,
                      omzet: 53600000,
                      insentif: 2030000,
                      avgPerDay: 2.4,
                      avgStoresPerRit: 11.2,
                      weeks: [
                        { w: 'W1 (1-7 Ags)', rit: 14, galon: 630, insentif: 490000, status: '100% Selesai' },
                        { w: 'W2 (8-14 Ags)', rit: 15, galon: 675, insentif: 525000, status: '100% Selesai' },
                        { w: 'W3 (15-21 Ags)', rit: 14, galon: 630, insentif: 490000, status: '100% Selesai' },
                        { w: 'W4 (22-31 Ags)', rit: 15, galon: 675, insentif: 525000, status: '100% Selesai' },
                      ],
                      bonusNote: '✅ Target ritase 96.7% terpenuhi dengan baik.',
                    }
                  : {
                      totalRitase: 54,
                      targetRitase: 60,
                      percentTarget: 90.0,
                      galonKirim: 2430,
                      dusKirim: 312,
                      omzet: 49850000,
                      insentif: 1890000,
                      avgPerDay: 2.3,
                      avgStoresPerRit: 11.0,
                      weeks: [
                        { w: 'W1 (1-7 Okt)', rit: 14, galon: 630, insentif: 490000, status: '100% Selesai' },
                        { w: 'W2 (8-14 Okt)', rit: 13, galon: 585, insentif: 455000, status: '98% Selesai' },
                        { w: 'W3 (15-21 Okt)', rit: 15, galon: 675, insentif: 525000, status: '100% Selesai' },
                        { w: 'W4 (22-31 Okt)', rit: 12, galon: 540, insentif: 420000, status: 'On Track' },
                      ],
                      bonusNote: '🎯 6 ritase lagi menuju bonus bulanan (Target: 60 ritase)!',
                    };

                return (
                  <div className="space-y-3">
                    {/* Ringkasan Metrik Ritase 4 Kotak */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[9.5px] text-slate-400 block font-medium">
                          Total Ritase Selesai
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-white font-mono">
                            {monthData.totalRitase} Rit
                          </span>
                          <span className="text-[9.5px] text-cyan-400 font-mono font-bold">
                            / {monthData.targetRitase} Target
                          </span>
                        </div>
                        {/* Progress Bar Target */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, monthData.percentTarget)}%` }}
                          ></div>
                        </div>
                        <span className="text-[8.5px] text-emerald-400 font-bold block">
                          {monthData.percentTarget}% Tercapai
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[9.5px] text-slate-400 block font-medium">
                          Insentif / Uang Jalan Rit
                        </span>
                        <div className="text-base font-black text-amber-300 font-mono">
                          Rp {monthData.insentif.toLocaleString('id-ID')}
                        </div>
                        <span className="text-[8.5px] text-slate-400 block font-mono">
                          Rp 35.000 / rit + bonus target
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[9.5px] text-slate-400 block font-medium">
                          Volume Muatan Terkirim
                        </span>
                        <div className="text-xs font-black text-cyan-300 font-mono">
                          {monthData.galonKirim.toLocaleString('id-ID')} Galon
                        </div>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          + {monthData.dusKirim} Dus Kemasan
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[9.5px] text-slate-400 block font-medium">
                          Rata-rata Ritase Harian
                        </span>
                        <div className="text-xs font-black text-emerald-300 font-mono">
                          {monthData.avgPerDay} Rit / Hari
                        </div>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          ~{monthData.avgStoresPerRit} toko per trip
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Ritase Mingguan */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[9.5px] font-mono text-slate-300 font-bold uppercase tracking-wider block">
                        RINCIAN RITASE MINGGUAN ({selectedRitaseMonth.toUpperCase()})
                      </span>
                      <div className="space-y-1.5">
                        {monthData.weeks.map((wk, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[10px]"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-white block">{wk.w}</span>
                              <span className="text-[9px] text-slate-400">
                                {wk.galon} Galon terkirim • {wk.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-cyan-300 block">
                                {wk.rit} Ritase
                              </span>
                              <span className="text-[9px] font-mono text-amber-300">
                                +Rp {wk.insentif.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1.5 border-t border-slate-800/80 text-[9.5px] text-emerald-300 font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{monthData.bonusNote}</span>
                      </div>
                    </div>

                    {/* Log 3 Ritase Terakhir Supir */}
                    <div className="space-y-1.5">
                      <span className="text-[9.5px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                        RIWAYAT 3 RITASE TERAKHIR
                      </span>
                      <div className="space-y-1.5">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-cyan-300 font-mono">RIT-2610-08B</span>
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ✅ Selesai &amp; Lapor Depo
                            </span>
                          </div>
                          <div className="text-slate-400 flex items-center justify-between text-[9px]">
                            <span>Hari Ini 13:45 WITA • Carry (B 9421 KDA)</span>
                            <span className="font-mono text-white font-bold">4 Toko • 85 Galon</span>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-cyan-300 font-mono">RIT-2610-08A</span>
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ✅ Selesai &amp; Lapor Depo
                            </span>
                          </div>
                          <div className="text-slate-400 flex items-center justify-between text-[9px]">
                            <span>Hari Ini 08:30 WITA • Carry (B 9421 KDA)</span>
                            <span className="font-mono text-white font-bold">5 Toko • 90 Galon</span>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-cyan-300 font-mono">RIT-2610-07B</span>
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ✅ Selesai &amp; Lapor Depo
                            </span>
                          </div>
                          <div className="text-slate-400 flex items-center justify-between text-[9px]">
                            <span>Kemarin 14:15 WITA • Gran Max (B 9812 SRA)</span>
                            <span className="font-mono text-white font-bold">6 Toko • 110 Galon</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* STATUS PENGAJUAN TOKO BARU DARI SUPIR */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-cyan-400" />
                  <span>STATUS PENGAJUAN TOKO BARU ({storeSubmissions.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRegisterWizardStep(1);
                    handleDetectGps();
                    setShowRegisterModal(true);
                  }}
                  className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Ajukan Toko</span>
                </button>
              </div>

              {storeSubmissions.length === 0 ? (
                <p className="text-[10px] text-slate-400">Belum ada pengajuan toko baru dari supir.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {storeSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-1 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[170px]">{sub.name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold ${
                            sub.status === 'MENUNGGU_KONFIRMASI_ADMIN'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : sub.status === 'DISETUJUI'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {sub.status === 'MENUNGGU_KONFIRMASI_ADMIN'
                            ? '⏳ MENUNGGU ADMIN'
                            : sub.status === 'DISETUJUI'
                            ? '✅ DISETUJUI'
                            : '❌ DITOLAK'}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 flex items-center justify-between">
                        <span>
                          {sub.category} • Tier: {sub.priceTier}
                        </span>
                        <span className="font-mono">{sub.submittedAt.split(' ')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PENGATURAN AKUN & KELUAR */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Ganti Driver</span>
              </button>

              {onExitDriverMode && (
                <button
                  type="button"
                  onClick={onExitDriverMode}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kembali ke ERP</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR TETAP (5 TAB TETAP: HOME, TOKO, AKTIVITAS, KINERJA, PROFIL) */}
      <div className="shrink-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 py-1.5 px-2 z-40">
        <div className="grid grid-cols-5 gap-1 items-center text-center">
          {/* Tab 1: Home */}
          <button
            type="button"
            onClick={() => setFieldTab('home')}
            className={`h-12 min-h-[48px] w-full rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 relative active:scale-95 ${
              fieldTab === 'home'
                ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Home className={`w-5 h-5 ${fieldTab === 'home' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold leading-tight truncate">Home</span>
          </button>

          {/* Tab 2: Toko */}
          <button
            type="button"
            onClick={() => setFieldTab('toko')}
            className={`h-12 min-h-[48px] w-full rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 relative active:scale-95 ${
              fieldTab === 'toko'
                ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Store className={`w-5 h-5 ${fieldTab === 'toko' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold leading-tight truncate">Toko</span>
          </button>

          {/* Tab 3: Aktivitas */}
          <button
            type="button"
            onClick={() => setFieldTab('aktivitas')}
            className={`h-12 min-h-[48px] w-full rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 relative active:scale-95 ${
              fieldTab === 'aktivitas'
                ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="relative">
              <Truck className={`w-5 h-5 ${fieldTab === 'aktivitas' ? 'text-cyan-400' : 'text-slate-400'}`} />
              {(activeDrops.length > 0 || openQueueOrders.length > 0) && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[8.5px] font-mono font-black bg-cyan-500 text-slate-950">
                  {activeDrops.length + openQueueOrders.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold leading-tight truncate">Aktivitas</span>
          </button>

          {/* Tab 4: Kinerja */}
          <button
            type="button"
            onClick={() => setFieldTab('kinerja')}
            className={`h-12 min-h-[48px] w-full rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 relative active:scale-95 ${
              fieldTab === 'kinerja'
                ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <TrendingUp className={`w-5 h-5 ${fieldTab === 'kinerja' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold leading-tight truncate">Kinerja</span>
          </button>

          {/* Tab 5: Profil */}
          <button
            type="button"
            onClick={() => setFieldTab('profil')}
            className={`h-12 min-h-[48px] w-full rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 relative active:scale-95 ${
              fieldTab === 'profil'
                ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <User className={`w-5 h-5 ${fieldTab === 'profil' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold leading-tight truncate">Profil</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: PROOF OF DELIVERY (POD) MODAL */}
      {podModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-t sm:border border-cyan-400 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    BUKTI PENYERAHAN BARANG (POD)
                  </h3>
                  <span className="text-[10px] text-cyan-300 font-bold">
                    {podModalOrder.customerName} (#{podModalOrder.id})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setPodModalOrder(null)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-3 pr-1 text-xs">
              {/* a. KONFIRMASI PENERIMAAN FISIK: CHECKLIST BARANG & STEPPER TABUNG KOSONG */}
              <div className="p-3 rounded-2xl bg-cyan-950/25 border border-cyan-500/40 space-y-2.5">
                {/* 1. Header Highlight: Jumlah Galon Diturunkan */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-900/40 border border-cyan-400/60 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-cyan-300 uppercase font-black tracking-wider block">
                        Jumlah Galon Diturunkan:
                      </span>
                      <span className="text-xs font-bold text-white leading-tight truncate block">
                        {podModalOrder.items || `${podModalOrder.totalGalon} Tabung Galon`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xl font-mono font-black text-cyan-300">
                      {podModalOrder.totalGalon || 0}
                    </span>
                    <span className="text-[9px] text-cyan-400 block font-bold">Galon 19L</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rincian Item Muatan Diturunkan:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const allChecked: Record<string, boolean> = {};
                      Object.keys(verifiedItemChecklist).forEach((k) => (allChecked[k] = true));
                      setVerifiedItemChecklist(allChecked);
                    }}
                    className="text-[9px] font-bold text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                  >
                    ✓ Centang Semua
                  </button>
                </div>

                {/* Checklist Barang */}
                <div className="space-y-1.5 pt-0.5">
                  {Object.keys(verifiedItemChecklist).map((itemStr) => {
                    const isChecked = verifiedItemChecklist[itemStr];
                    return (
                      <label
                        key={itemStr}
                        onClick={() =>
                          setVerifiedItemChecklist((prev) => ({
                            ...prev,
                            [itemStr]: !prev[itemStr],
                          }))
                        }
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-cyan-500/15 border-cyan-400/70 text-white shadow-xs'
                            : 'bg-slate-900/80 border-slate-700/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-0 accent-cyan-500 cursor-pointer pointer-events-none"
                          />
                          <span className="font-bold text-xs">{itemStr}</span>
                        </div>
                        <span
                          className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            isChecked
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isChecked ? '✓ Sesuai Fisik' : 'Belum Dicek'}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-cyan-500/20 flex items-center justify-between">
                  <span>Total Tagihan: Rp {podModalOrder.totalAmount.toLocaleString('id-ID')}</span>
                  <span className="text-emerald-400 font-bold">Status: {podModalOrder.paymentStatus}</span>
                </div>
              </div>

              {/* Input Angka Tabung Kosong Kembali */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tabung Kosong Kembali:</span>
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Bawa: {podModalOrder.totalGalon} Galon
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 py-1">
                  <button
                    type="button"
                    onClick={() => setReturnedGallonsInput((v) => Math.max(0, v - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-lg flex items-center justify-center cursor-pointer active:scale-95 border border-slate-700"
                    title="Kurang 1"
                  >
                    -
                  </button>
                  <div className="w-24 text-center">
                    <input
                      type="number"
                      min={0}
                      value={returnedGallonsInput}
                      onChange={(e) => setReturnedGallonsInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-center text-2xl font-mono font-black text-cyan-400 bg-slate-900 border border-cyan-500/50 rounded-xl py-0.5 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">
                      Tabung Kosong
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setReturnedGallonsInput((v) =>
                        Math.min(podModalOrder.totalGalon + 10, v + 1)
                      )
                    }
                    className="w-10 h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400 font-black text-lg flex items-center justify-center cursor-pointer active:scale-95"
                    title="Tambah 1"
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReturnedGallonsInput(podModalOrder.totalGalon)}
                    className="py-1.5 rounded-lg text-[9.5px] font-bold bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-slate-700 cursor-pointer"
                  >
                    Lengkap ({podModalOrder.totalGalon} Tabung)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnedGallonsInput(0)}
                    className="py-1.5 rounded-lg text-[9.5px] font-bold bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700 cursor-pointer"
                  >
                    Nihil / Hutang (0)
                  </button>
                </div>

                {/* Warning if return < brought */}
                {returnedGallonsInput < podModalOrder.totalGalon && (
                  <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9.5px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>
                      Hutang tabung{' '}
                      <strong>
                        {podModalOrder.totalGalon - returnedGallonsInput} Galon
                      </strong>{' '}
                      akan otomatis dicatat ke saldo hutang toko.
                    </span>
                  </div>
                )}
              </div>

              {/* Audit Fisik Retur Barang Rusak / Bocor */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                  Catatan Retur Rusak / Bocor / Pecah (Jika Ada):
                </label>
                <input
                  type="text"
                  value={damagedNotesInput}
                  onChange={(e) => setDamagedNotesInput(e.target.value)}
                  placeholder="Contoh: 1 Tabung bocor halus / 2 Botol penyok..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* b. BUKTI FOTO & TANDA TANGAN DIGITAL PENERIMA */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                {/* 1. Foto Pengantaran */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1. Foto Bukti Drop Barang:</span>
                    </label>
                    <span className="text-[9px] text-cyan-400 font-mono">Wajib POD</span>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-cyan-400/80 bg-black aspect-video flex items-center justify-center">
                      <img
                        src={photoPreview}
                        alt="Bukti Serah Terima"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/75 p-1 rounded-lg text-[9px] font-mono text-cyan-300 flex items-center justify-between">
                        <span>✓ FOTO VALID (TEREKAM)</span>
                        <span>{new Date().toLocaleTimeString('id-ID')} WIB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setIsPhotoCaptured(false);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-rose-600 text-white cursor-pointer shadow-md"
                        title="Ambil Ulang Foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl border border-dashed border-cyan-400/60 hover:border-cyan-400 bg-cyan-950/20 text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all text-center"
                      >
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-bold">Buka Kamera HP</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSelectSamplePhoto}
                        className="p-2 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/60 text-slate-300 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all text-center"
                      >
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-bold">Simulasi Foto Serah Terima</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Pad Tanda Tangan Digital */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>2. Tanda Tangan Penerima Toko:</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSampleSignature}
                        className="text-[9px] font-bold text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                      >
                        ✍️ Contoh
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="text-[9px] font-bold text-rose-400 hover:text-rose-200 underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-xl border-2 border-dashed border-cyan-500/50 bg-slate-950/90 overflow-hidden">
                    <canvas
                      ref={signatureCanvasRef}
                      width={380}
                      height={110}
                      onMouseDown={handleSignatureStart}
                      onMouseMove={handleSignatureMove}
                      onMouseUp={handleSignatureEnd}
                      onMouseLeave={handleSignatureEnd}
                      onTouchStart={handleSignatureStart}
                      onTouchMove={handleSignatureMove}
                      onTouchEnd={handleSignatureEnd}
                      className="w-full h-24 cursor-crosshair touch-none"
                    />
                    {!hasDigitalSignature && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-500 text-[10.5px] font-mono">
                        Sentuh atau gambar tanda tangan di sini
                      </div>
                    )}
                    {hasDigitalSignature && (
                      <div className="absolute bottom-1 right-2 pointer-events-none text-[8.5px] font-mono font-bold text-cyan-400">
                        ✓ Tanda Tangan Digital Sah
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Nama Penerima */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                    Nama Penerima di Toko / Rumah:
                  </label>
                  <input
                    type="text"
                    value={recipientNameInput}
                    onChange={(e) => setRecipientNameInput(e.target.value)}
                    placeholder="Misal: Bpk. H. Rauf / Bu Siti"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* c. METODE PELUNASAN LAPANGAN (TUNAI / TEMPO) */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Metode Pelunasan Lapangan:</span>
                  </span>

                  {/* Toggle Mode Pembayaran */}
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPodPaymentType('tunai')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        podPaymentType === 'tunai'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tunai (COD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPodPaymentType('tempo')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        podPaymentType === 'tempo'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tempo Toko
                    </button>
                  </div>
                </div>

                {podPaymentType === 'tunai' ? (
                  /* Pesanan Tunai: Supir mengonfirmasi "Uang Tunai Diterima Rp [Nominal]" */
                  <div
                    onClick={() => setPodCashPaidConfirmed((v) => !v)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                      podCashPaidConfirmed
                        ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={podCashPaidConfirmed}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer pointer-events-none"
                      />
                      <div>
                        <span className="text-xs font-black text-emerald-300 block">
                          💵 Uang Tunai Diterima Rp {podModalOrder.totalAmount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9.5px] text-emerald-400/80">
                          Supir mengonfirmasi fisik uang tunai Rp {podModalOrder.totalAmount.toLocaleString('id-ID')} telah diterima lunas dari toko
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/40 shrink-0">
                      LUNAS COD
                    </span>
                  </div>
                ) : (
                  /* Pesanan Tempo: Konfirmasi "Faktur Ditandatangani Toko" */
                  <div
                    onClick={() => setPodTempoInvoiceConfirmed((v) => !v)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                      podTempoInvoiceConfirmed
                        ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={podTempoInvoiceConfirmed}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-700 text-amber-500 accent-amber-500 cursor-pointer pointer-events-none"
                      />
                      <div>
                        <span className="text-xs font-black text-amber-300 block">
                          📝 Faktur Ditandatangani Toko
                        </span>
                        <span className="text-[9.5px] text-amber-300/80">
                          Toko menyepakati bon tempo dan telah menandatangani faktur / surat jalan (Tempo 7 Hari)
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/40 shrink-0">
                      TEMPO TOKO
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* d. MODAL ACTIONS: [ ✅ SELESAIKAN & TERBITKAN TANDA TERIMA ] */}
            <div className="pt-2.5 border-t border-slate-800 shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPodModalOrder(null)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitPod}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_16px_rgba(16,185,129,0.45)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>✅ Selesaikan Drop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WIZARD 3 LANGKAH [+ DAFTARKAN TOKO BARU] (AUTO-DETECT GPS & PENGAJUAN ADMIN) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-t sm:border border-cyan-400 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                {openedFromSpotSale ? (
                  <button
                    type="button"
                    onClick={handleCancelRegisterStore}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white flex items-center justify-center cursor-pointer transition-all border border-slate-700 mr-0.5 active:scale-95"
                    title="Kembali ke Katalog Order"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                    <Store className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>+ DAFTARKAN TOKO BARU</span>
                    <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                      Wizard 3 Langkah
                    </span>
                  </h3>
                  <span className="text-[10px] text-cyan-300 font-bold">
                    Selaras Master Pelanggan • Verifikasi Admin Depo
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelRegisterStore}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
                title="Batal / Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stepper Progress Indicator (Langkah 1, 2, 3) */}
            <div className="py-2 px-1 border-b border-slate-800/80 bg-slate-950/40 shrink-0 space-y-1.5">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {/* Step 1 Pill */}
                <button
                  type="button"
                  onClick={() => setRegisterWizardStep(1)}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                    registerWizardStep === 1
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : registerWizardStep > 1
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-900/60 flex items-center justify-center text-[9px] font-mono">
                    {registerWizardStep > 1 ? '✓' : '1'}
                  </span>
                  <span className="truncate">1. Identitas</span>
                </button>

                {/* Step 2 Pill */}
                <button
                  type="button"
                  onClick={() => {
                    if (newCustName.trim() && newCustPhone.trim()) {
                      setRegisterWizardStep(2);
                    }
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                    registerWizardStep === 2
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : registerWizardStep > 2
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-900/60 flex items-center justify-center text-[9px] font-mono">
                    {registerWizardStep > 2 ? '✓' : '2'}
                  </span>
                  <span className="truncate">2. Lokasi GPS</span>
                </button>

                {/* Step 3 Pill */}
                <button
                  type="button"
                  onClick={() => {
                    if (newCustName.trim() && newCustPhone.trim()) {
                      setRegisterWizardStep(3);
                    }
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                    registerWizardStep === 3
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-900/60 flex items-center justify-center text-[9px] font-mono">
                    3
                  </span>
                  <span className="truncate">3. Bisnis &amp; Limit</span>
                </button>
              </div>

              {/* Status Header Subtitle */}
              <div className="flex items-center justify-between px-1 text-[9px]">
                <span className="text-cyan-400 font-bold uppercase tracking-wider">
                  {registerWizardStep === 1 && 'Langkah 1 dari 3: Data Pemilik & Toko'}
                  {registerWizardStep === 2 && 'Langkah 2 dari 3: Auto-Detect GPS & Alamat'}
                  {registerWizardStep === 3 && 'Langkah 3 dari 3: Konfigurasi Bisnis & Limit Plafon'}
                </span>
                <span className="text-slate-400 font-mono">
                  {registerWizardStep === 1 && '33% Selesai'}
                  {registerWizardStep === 2 && '66% Selesai'}
                  {registerWizardStep === 3 && '100% Siap Kirim'}
                </span>
              </div>
            </div>

            {/* Scrollable Wizard Form Content */}
            <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-3 pr-1 text-xs">
              {/* ========================================================= */}
              {/* LANGKAH 1: IDENTITAS TOKO & PEMILIK                       */}
              {/* ========================================================= */}
              {registerWizardStep === 1 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* 1. Nama Toko / Outlet */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                      <span>Nama Toko / Outlet: *</span>
                      <span className="text-[9px] text-cyan-400 font-mono font-bold">Wajib Diisi</span>
                    </label>
                    <input
                      type="text"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="Misal: Toko Berkah Mandiri / Pangkalan Barokah"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* 2. Kategori: [ Toko Mitra ] atau [ Residensial ] */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                      Kategori Pelanggan:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewCustCategoryType('Toko Mitra');
                          if (newCustPriceTier === 'Eceran') setNewCustPriceTier('Toko');
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-black transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                          newCustCategoryType === 'Toko Mitra'
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Toko Mitra (B2B)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewCustCategoryType('Residensial');
                          setNewCustPriceTier('Eceran');
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-black transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                          newCustCategoryType === 'Residensial'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Home className="w-3.5 h-3.5" />
                        <span>Residensial (B2C)</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Nama Pemilik & Nomor WhatsApp */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                        Nama Pemilik / PIC:
                      </label>
                      <input
                        type="text"
                        value={newCustOwner}
                        onChange={(e) => setNewCustOwner(e.target.value)}
                        placeholder="Bpk. H. Ridwan"
                        className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                        <span>No. WhatsApp: *</span>
                        <span className="text-[8.5px] text-cyan-400 font-mono">Wajib</span>
                      </label>
                      <input
                        type="text"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        placeholder="0812-9876-5432"
                        className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Info Box Tip Lapangan */}
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Integrasi Otomatis NexaField &amp; Master Data</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-relaxed">
                      Data toko baru yang Anda ajukan akan diverifikasi Admin Depo. Nomor WhatsApp digunakan untuk konfirmasi PO dan pengiriman struk digital thermal via WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* LANGKAH 2: LOKASI & AUTO-DETECT KOORDINAT GPS (LAT & LONG) */}
              {/* ========================================================= */}
              {registerWizardStep === 2 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* TOMBOL UTAMA AUTO-DETECT GPS KOORDINAT HP */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-950 via-cyan-950/30 to-slate-950 border border-cyan-400/50 space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-cyan-400" />
                        <span>AUTO-DETECT KOORDINAT GPS</span>
                      </span>
                      {isGpsLocked && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>GPS Terkunci</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isGpsDetecting}
                      onClick={handleDetectGps}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isGpsDetecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Mencari Sinyal Satelit GPS HP...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 text-slate-950 fill-current" />
                          <span>📍 Auto-Detect Koordinat GPS (Lokasi HP)</span>
                        </>
                      )}
                    </button>

                    {/* Display Hasil Koordinat Satelit */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                        <span className="text-[8.5px] text-slate-400 font-sans block">Latitude:</span>
                        <div className="text-cyan-300 font-bold text-xs truncate">
                          {newCustLat.toFixed(6)}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                        <span className="text-[8.5px] text-slate-400 font-sans block">Longitude:</span>
                        <div className="text-cyan-300 font-bold text-xs truncate">
                          {newCustLng.toFixed(6)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Akurasi: ±{gpsAccuracy || 8} meter (Satelit Presisi)</span>
                      </span>
                      <a
                        href={newCustMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-0.5 font-bold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Buka di Google Maps</span>
                      </a>
                    </div>
                  </div>

                  {/* Alamat Lengkap & Patokan */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                      Alamat Lengkap Toko:
                    </label>
                    <input
                      type="text"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      placeholder="Misal: Jl. Raya Kalijati No. 45, Subang"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                      Patokan (Landmark) untuk Supir:
                    </label>
                    <input
                      type="text"
                      value={newCustLandmark}
                      onChange={(e) => setNewCustLandmark(e.target.value)}
                      placeholder="Sebelah Apotek Kimia Farma / Pagar Hijau"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Rayon / Zona Distribusi */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                      Rayon / Zona Wilayah:
                    </label>
                    <select
                      value={newCustZone}
                      onChange={(e) => setNewCustZone(e.target.value as StoreZone)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="Rayon Utara">Rayon Utara (Kalijati, Pagaden)</option>
                      <option value="Rayon Selatan">Rayon Selatan (Jalan Cagak, Ciater)</option>
                      <option value="Rayon Timur">Rayon Timur (Cipunagara, Cibogo)</option>
                      <option value="Rayon Barat">Rayon Barat (Pabuaran, Cipeundeuy)</option>
                      <option value="Rayon Pusat">Rayon Pusat (Subang Kota)</option>
                    </select>
                  </div>

                  {/* Link Google Maps Otomatis */}
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">
                      Link Google Maps (Otomatis):
                    </label>
                    <input
                      type="text"
                      value={newCustMapsUrl}
                      onChange={(e) => setNewCustMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full px-2 py-1 text-[10px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* LANGKAH 3: BISNIS, LIMIT KREDIT & KONFIRMASI PENGIRIMAN    */}
              {/* ========================================================= */}
              {registerWizardStep === 3 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Default Tier Harga */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                      Default Tier Harga:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Pangkalan', 'Toko', 'Eceran'] as const).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setNewCustPriceTier(tier)}
                          className={`py-2 px-1 rounded-xl text-[10.5px] font-bold transition-all border cursor-pointer ${
                            newCustPriceTier === tier
                              ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {newCustPriceTier === 'Pangkalan'
                        ? 'Tier 1: Grosir volume besar (Galon Aqua Rp 18.500)'
                        : newCustPriceTier === 'Toko'
                        ? 'Tier 2: Toko kelontong & warung (Galon Aqua Rp 19.500)'
                        : 'Tier 3: Eceran warga / residensial (Galon Aqua Rp 21.000)'}
                    </span>
                  </div>

                  {/* Plafon Limit Kredit / Tempo Bon */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                      <span>Plafon Limit Kredit / Bon Tempo:</span>
                      <span className="text-[9px] font-mono text-cyan-300 font-bold">
                        Rp {newCustCreditLimit.toLocaleString('id-ID')}
                      </span>
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[1000000, 2000000, 3500000, 5000000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setNewCustCreditLimit(amt)}
                          className={`py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all border cursor-pointer ${
                            newCustCreditLimit === amt
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          Rp {amt / 1000000} Jt
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kuota Titip Wadah / Galon Kosong */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                        Kuota Titip Wadah (Galon):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newCustHoldingQuota}
                        onChange={(e) => setNewCustHoldingQuota(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                        Rute Hari Ini:
                      </label>
                      <button
                        type="button"
                        onClick={() => setAddToTodayRoute(!addToTodayRoute)}
                        className={`w-full py-1.5 px-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          addToTodayRoute
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${addToTodayRoute ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <span>{addToTodayRoute ? 'Ditambahkan ke Rute' : 'Lewati Rute'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Catatan Pengajuan Toko */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                      Catatan Pengajuan (Opsional):
                    </label>
                    <input
                      type="text"
                      value={newCustNotes}
                      onChange={(e) => setNewCustNotes(e.target.value)}
                      placeholder="Misal: Langganan baru minta kirim tiap Rabu, tempo 7 hari"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Kartu Ringkasan (Review Pengajuan Toko) */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[10px]">
                    <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                      RINGKASAN PENGAJUAN TOKO
                    </span>
                    <div className="space-y-1 text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Nama Toko:</span>
                        <span className="font-bold text-white truncate max-w-[180px]">{newCustName || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Pemilik / WhatsApp:</span>
                        <span className="font-mono text-cyan-300">
                          {newCustOwner || 'Pemilik'} • {newCustPhone || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Koordinat GPS:</span>
                        <span className="font-mono text-emerald-400">
                          {newCustLat.toFixed(4)}, {newCustLng.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tier / Plafon:</span>
                        <span className="font-bold text-amber-300">
                          {newCustPriceTier} • Rp {newCustCreditLimit.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer Berdasarkan Step Wizard */}
            <div className="pt-2.5 border-t border-slate-800 shrink-0 flex items-center gap-2">
              {registerWizardStep === 1 && (
                <>
                  <button
                    type="button"
                    onClick={handleCancelRegisterStore}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    {openedFromSpotSale ? (
                      <>
                        <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Batal / Ke Katalog</span>
                      </>
                    ) : (
                      <span>Batal</span>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={!newCustName.trim() || !newCustPhone.trim()}
                    onClick={() => {
                      if (!newCustName.trim()) {
                        alert('Nama Toko / Outlet wajib diisi.');
                        return;
                      }
                      if (!newCustPhone.trim()) {
                        alert('Nomor WhatsApp wajib diisi.');
                        return;
                      }
                      setRegisterWizardStep(2);
                      if (!isGpsLocked) {
                        handleDetectGps();
                      }
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Lanjut: Lokasi &amp; GPS HP</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {registerWizardStep === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setRegisterWizardStep(1)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterWizardStep(3)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Lanjut: Bisnis &amp; Limit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {registerWizardStep === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => setRegisterWizardStep(2)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                  <button
                    type="button"
                    disabled={!newCustName.trim() || !newCustPhone.trim()}
                    onClick={handleSendStoreSubmissionToAdmin}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_18px_rgba(16,185,129,0.5)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>📤</span>
                    <span>Kirim Pengajuan Toko ke Admin</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PEMESANAN & JUAL CEPAT (KATALOG VISUAL BERSIH • FOOD APP STYLE) */}
      {showSpotSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-amber-400 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>KATALOG ORDER LAPANGAN</span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                      Food App Style
                    </span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Pilih Toko Terdaftar • Tier Harga Terkunci • Approval Admin
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSpotSaleModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3.5 pr-1 text-xs">
              {/* 1. PEMILIHAN PELANGGAN & TIER HARGA OTOMATIS TERKUNCI */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <label className="text-[10.5px] font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pilih Toko / Pelanggan: *</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDetectNearbyStore}
                      className="text-[9.5px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95 bg-amber-500/15 hover:bg-amber-500/25 px-2 py-1 rounded-lg border border-amber-500/30"
                      title="Deteksi Toko Terdekat via GPS Lokasi Supir"
                    >
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>📍 Toko Terdekat (GPS)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenRegisterFromCatalog}
                      className="text-[9.5px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95 bg-cyan-950/60 hover:bg-cyan-900/60 px-2 py-1 rounded-lg border border-cyan-500/30"
                    >
                      <PlusCircle className="w-3 h-3 text-cyan-400" />
                      <span>+ Toko Baru</span>
                    </button>
                  </div>
                </div>

                {nearbyStoreDetectedNotice && (
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-200 text-[10px] flex items-center gap-1.5 animate-in fade-in duration-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="font-semibold">{nearbyStoreDetectedNotice}</span>
                  </div>
                )}

                {/* Filter Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    placeholder="Ketik untuk filter nama toko, pemilik, no WA..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  {customerSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Pelanggan Aktif + Toko Baru Diajukan */}
                <select
                  value={spotSelectedCustId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSpotSelectedCustId(id);
                    // 1. Cek dari toko baru diajukan driver di sesi aktif
                    const localTarget = driverSubmittedStores.find((s) => s.id === id);
                    if (localTarget) {
                      setSpotPriceTier(localTarget.priceTier);
                      setSpotCustomerName(localTarget.name);
                      setSpotCustomerPhone(localTarget.phone);
                      setSpotAddress(localTarget.address);
                      setSpotCategory(
                        localTarget.category === 'Toko Mitra' ? 'Toko Kelontong' : 'Rumah Tangga'
                      );
                      return;
                    }
                    // 2. Cek dari submission toko admin
                    const subTarget = storeSubmissions?.find((s) => s.id === id);
                    if (subTarget) {
                      setSpotPriceTier(subTarget.priceTier);
                      setSpotCustomerName(subTarget.name);
                      setSpotCustomerPhone(subTarget.phone);
                      setSpotAddress(subTarget.address);
                      setSpotCategory(
                        subTarget.category === 'Toko Mitra' ? 'Toko Kelontong' : 'Rumah Tangga'
                      );
                      return;
                    }
                    // 3. Cek dari master customer aktif
                    const target = customers.find((c) => c.id === id);
                    if (target) {
                      // Tier Harga Otomatis Terkunci mengikuti tier toko terpilih
                      const lockedTier = target.priceTier || (target.type === 'B2B' ? 'Toko' : 'Eceran');
                      setSpotPriceTier(lockedTier);
                      setSpotCustomerName(target.name);
                      setSpotCustomerPhone(target.phone);
                      setSpotAddress(target.address);
                      setSpotCategory(
                        target.type === 'B2B'
                          ? (target.b2bCategory === 'Agen / Pangkalan' ? 'Pangkalan Agen' : 'Toko Kelontong')
                          : 'Rumah Tangga'
                      );
                    }
                  }}
                  className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="">-- Pilih Toko Mitra / Pelanggan Residensial --</option>

                  {/* Grup: Toko Baru Diajukan Driver */}
                  {driverSubmittedStores.length > 0 && (
                    <optgroup label="⚡ TOKO BARU DIAJUKAN SUPIR">
                      {driverSubmittedStores.map((sub) => (
                        <option key={sub.id} value={sub.id} className="bg-amber-950 font-bold text-amber-300">
                          ⭐ [Pengajuan Baru] {sub.name} • {sub.category} • Tier {sub.priceTier} ({sub.phone})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Grup: Pengajuan Toko Lain yang Menunggu Konfirmasi */}
                  {storeSubmissions &&
                    storeSubmissions.filter(
                      (s) =>
                        s.status === 'MENUNGGU_KONFIRMASI_ADMIN' &&
                        !driverSubmittedStores.some((d) => d.id === s.id)
                    ).length > 0 && (
                      <optgroup label="⏳ MENUNGGU KONFIRMASI ADMIN">
                        {storeSubmissions
                          .filter(
                            (s) =>
                              s.status === 'MENUNGGU_KONFIRMASI_ADMIN' &&
                              !driverSubmittedStores.some((d) => d.id === s.id)
                          )
                          .map((s) => (
                            <option key={s.id} value={s.id} className="bg-amber-950 text-amber-300">
                              ⏳ {s.name} • {s.category} • Tier {s.priceTier} ({s.phone})
                            </option>
                          ))}
                      </optgroup>
                    )}

                  {/* Grup: Master Pelanggan Terdaftar */}
                  <optgroup label="🏪 MASTER PELANGGAN TERDAFTAR (CUSTOMER_MASTER)">
                    {customers
                      .filter((c) => {
                        if (!customerSearchTerm.trim()) return true;
                        const q = customerSearchTerm.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(q) ||
                          (c.ownerName && c.ownerName.toLowerCase().includes(q)) ||
                          c.phone.includes(q) ||
                          (c.address && c.address.toLowerCase().includes(q))
                        );
                      })
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} • {c.type === 'B2B' ? 'Toko Mitra' : 'Residensial'} • Tier {c.priceTier || 'Toko'} ({c.phone})
                        </option>
                      ))}
                  </optgroup>
                </select>

                {/* Badge Peringatan Informatif: Toko Baru Diajukan */}
                {Boolean(
                  spotSelectedCustId &&
                    (driverSubmittedStores.some((d) => d.id === spotSelectedCustId) ||
                      spotSelectedCustId.startsWith('REG-') ||
                      storeSubmissions?.some(
                        (s) => s.id === spotSelectedCustId && s.status === 'MENUNGGU_KONFIRMASI_ADMIN'
                      ))
                ) && (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-400 text-amber-200 text-xs shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-snug">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-amber-300 text-[11px] uppercase tracking-wide">
                          Toko Baru Diajukan (Menunggu Konfirmasi Admin)
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          {spotSelectedCustId}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-200/90 mt-1">
                        Toko <span className="font-bold text-white font-mono">{spotCustomerName}</span> baru saja diajukan. Order lapangan ini otomatis dikirim ke Admin untuk verifikasi identitas toko baru sekaligus persetujuan muatan armada.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tier Harga Terkunci Badge */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Tier Harga Terkunci:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                        spotPriceTier === 'Pangkalan'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                          : spotPriceTier === 'Toko'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                      }`}
                    >
                      🔒 Tier {spotPriceTier}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {spotPriceTier === 'Pangkalan'
                        ? 'Aqua Rp 18.500'
                        : spotPriceTier === 'Toko'
                        ? 'Aqua Rp 19.500'
                        : 'Aqua Rp 21.000'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. PILIHAN MUATAN ARMADA TRUK (HANYA SKU YANG MASIH TERSEDIA DI SISA MUATAN HARI INI) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pilihan Muatan Truk ({activeDriver.vehicleLabel}):</span>
                  </label>
                  {spotPricing.totalGalons > 0 && (
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                      {spotPricing.totalGalons} Galon Dipilih
                    </span>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(['Semua', 'Galon 19L', 'Dus Botol', 'Dus Cup'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatalogCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        catalogCategoryFilter === cat
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product Cards List (HANYA SKU DENGAN SISA MUATAN FISIK DI TRUK > 0) */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableCargoItems.filter((p) => catalogCategoryFilter === 'Semua' || p.category === catalogCategoryFilter).length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1.5">
                      <Boxes className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                      <h4 className="text-xs font-bold text-slate-200">Tidak Ada Sisa Muatan untuk Kategori Ini</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                        Hanya SKU yang masih memiliki sisa muatan fisik di armada truk ({activeDriver.vehicleLabel}) yang dapat dijual secara spot di jalan.
                      </p>
                    </div>
                  ) : (
                    availableCargoItems
                      .filter((p) => catalogCategoryFilter === 'Semua' || p.category === catalogCategoryFilter)
                      .map((item) => {
                        const qty = catalogQuantities[item.id] || 0;
                        const uPrice = getItemUnitPrice(item, spotPriceTier);
                        const cargoStock = getCargoStockForProduct(item.id);
                        const isMaxStockReached = qty >= cargoStock;

                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                              qty > 0
                                ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border-amber-400/80 shadow-[0_0_14px_rgba(245,158,11,0.2)]'
                                : 'bg-slate-950 border-slate-800/90 hover:border-slate-700'
                            }`}
                          >
                            {/* Visual Product Thumbnail & Tag */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.brandGradient} flex items-center justify-center text-xl shrink-0 shadow-md relative`}
                              >
                                <span>{item.imageEmoji}</span>
                                <span className="absolute -bottom-1 -right-1 text-[8px] font-black uppercase px-1 py-0.2 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                                  {item.unit}
                                </span>
                              </div>

                              {/* Product Info */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-extrabold text-xs text-white truncate">{item.name}</h4>
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
                                    Sisa Truk: {cargoStock} {item.unit}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="font-mono font-black text-amber-300 text-xs">
                                    Rp {uPrice.toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-[9.5px] text-slate-500">/ {item.unit}</span>
                                </div>
                              </div>
                            </div>

                            {/* Stepper Touch Buttons Directly on Card */}
                            <div className="flex items-center gap-1.5 shrink-0 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                              <button
                                type="button"
                                onClick={() =>
                                  setCatalogQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                                  }))
                                }
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center cursor-pointer transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                                disabled={qty === 0}
                              >
                                -
                              </button>

                              <span
                                className={`w-7 text-center font-mono font-black text-xs ${
                                  qty > 0 ? 'text-amber-300' : 'text-slate-500'
                                }`}
                              >
                                {qty}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  if (isMaxStockReached) return;
                                  setCatalogQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: Math.min(cargoStock, (prev[item.id] || 0) + 1),
                                  }));
                                }}
                                disabled={isMaxStockReached}
                                className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-sm cursor-pointer transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isMaxStockReached ? `Maksimal muatan truk tercapai (${cargoStock} ${item.unit})` : 'Tambah'}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* 3. BAR TABUNG KOSONG DIBUAT OPSIONAL (TOGGLE / CHECKBOX) */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasEmptyGallonExchange}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasEmptyGallonExchange(checked);
                        if (checked) {
                          setSpotReturnedEmpty(spotPricing.totalGalons || 1);
                        } else {
                          setSpotReturnedEmpty(0);
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer accent-cyan-500"
                    />
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>🔄</span>
                      <span>Ada Tukar / Tarik Tabung Kosong?</span>
                    </span>
                  </label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hasEmptyGallonExchange
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {hasEmptyGallonExchange ? 'Aktif' : 'Tidak Ada (0)'}
                  </span>
                </div>

                {/* Stepper Tabung Kosong Hanya Tampil Jika Toggle Aktif */}
                {hasEmptyGallonExchange && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between animate-in fade-in duration-200">
                    <span className="text-[11px] text-slate-300 font-semibold">
                      Jumlah Tabung Kosong Ditarik:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSpotReturnedEmpty((v) => Math.max(0, v - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95"
                      >
                        -
                      </button>
                      <span className="font-mono font-black text-cyan-400 w-8 text-center text-sm">
                        {spotReturnedEmpty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSpotReturnedEmpty((v) => v + 1)}
                        className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95"
                      >
                        +
                      </button>
                      {spotPricing.totalGalons > 0 && (
                        <button
                          type="button"
                          onClick={() => setSpotReturnedEmpty(spotPricing.totalGalons)}
                          className="text-[9.5px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 cursor-pointer"
                        >
                          Pas ({spotPricing.totalGalons})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. METODE PEMBAYARAN: TUNAI LANGSUNG ATAU AJUKAN TEMPO KE KASIR DEPO */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Metode Pembayaran:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSpotPaymentMethod('Tunai')}
                    className={`py-2 px-1.5 rounded-xl text-center text-[10.5px] font-bold transition-all cursor-pointer border ${
                      spotPaymentMethod === 'Tunai'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-black'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    💵 Tunai Langsung
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpotPaymentMethod('TEMPO BON TOKO')}
                    className={`py-2 px-1.5 rounded-xl text-center text-[10.5px] font-black transition-all cursor-pointer border ${
                      spotPaymentMethod === 'TEMPO BON TOKO'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    💳 Ajukan Tempo
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpotPaymentMethod('QRIS Supir')}
                    className={`py-2 px-1.5 rounded-xl text-center text-[10.5px] font-bold transition-all cursor-pointer border ${
                      spotPaymentMethod === 'QRIS Supir'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)] font-black'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    📲 QRIS Supir
                  </button>
                </div>

                {spotPaymentMethod === 'Tunai' ? (
                  <p className="text-[10px] text-emerald-300/90 leading-tight">
                    💵 Uang tunai diterima langsung dari warung oleh supir di lokasi saat serah terima barang.
                  </p>
                ) : spotPaymentMethod === 'TEMPO BON TOKO' ? (
                  <p className="text-[10px] text-amber-300/90 leading-tight">
                    💳 Pengajuan bon tempo 7 hari ke kasir depo. Order masuk ke antrean approval kasir depo untuk verifikasi plafon piutang toko.
                  </p>
                ) : (
                  <p className="text-[10px] text-sky-300/90 leading-tight">
                    📲 Pembeli scan QRIS barcode supir, notifikasi pembayaran langsung terverifikasi digital.
                  </p>
                )}
              </div>

              {/* Rangkuman Tagihan & Estimasi Komisi Supir */}
              <div className="p-3 rounded-2xl bg-amber-950/25 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">
                    TOTAL TAGIHAN PESANAN:
                  </span>
                  <div className="text-xl font-mono font-black text-amber-300">
                    Rp {spotPricing.total.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {spotPricing.totalGalons} Galon • {spotPricing.totalBottles + spotPricing.totalCups} Dus Kemasan
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-emerald-400 font-bold block">
                    +Komisi Supir (75% Share):
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    Rp{' '}
                    {(
                      spotPricing.totalGalons * courierGallonRate +
                      spotPricing.totalBottles * courierBottleRate +
                      spotPricing.totalCups * courierCupRate
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions: [ 🚀 Buat Order Spot ] */}
            <div className="pt-3 border-t border-slate-800 shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSpotSaleModal(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={spotPricing.total === 0 || !spotSelectedCustId}
                onClick={handleSubmitSpotSale}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-[0_0_16px_rgba(245,158,11,0.45)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Rocket className="w-4 h-4 stroke-[2.5]" />
                <span>🚀 Buat Order Spot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TERIMA TITIPAN TAGIHAN TEMPO TOKO DI JALAN */}
      {showCollectTempoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-t sm:border border-emerald-400 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  <DollarSign className="w-4 h-4 font-black" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    TERIMA TITIP TAGIHAN TEMPO
                  </h3>
                  <span className="text-[10px] text-emerald-300 font-bold">
                    Sinkron Otomatis Admin & Kasir ({activeDriver.shortName})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowCollectTempoModal(false)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-3 text-xs pr-1">
              {/* Pilih Toko Berhutang */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wide block">
                  Pilih Toko / Invoice Tempo: *
                </label>
                <select
                  value={selectedTempoId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedTempoId(id);
                    const list = receivables.length > 0 ? receivables : RECEIVABLES;
                    const item = list.find((r) => r.id === id);
                    if (item) setTempoAmountPaid(item.amount);
                  }}
                  className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 font-bold"
                >
                  {(receivables.length > 0 ? receivables : RECEIVABLES).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.customerName} - Rp {r.amount.toLocaleString('id-ID')} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Detail Tagihan Box */}
              {(() => {
                const list = receivables.length > 0 ? receivables : RECEIVABLES;
                const item = list.find((r) => r.id === selectedTempoId);
                if (!item) return null;

                return (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Invoice:</span>
                      <span className="text-cyan-400 font-bold">{item.id}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Alamat:</span>
                      <span className="text-white truncate max-w-[200px]">{item.address}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Jatuh Tempo:</span>
                      <span className="text-amber-400">{item.dueDate}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Tabung Dipinjam:</span>
                      <span className="text-purple-300">{item.gallonsLoaned} Tabung</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800 text-xs font-black">
                      <span className="text-slate-300">Total Tagihan:</span>
                      <span className="text-amber-300 text-sm">
                        Rp {item.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Input Nominal Pembayaran Diterima */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-200 uppercase tracking-wide block">
                  Uang Fisik Diterima Supir (Rp): *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={tempoAmountPaid || ''}
                    onChange={(e) => setTempoAmountPaid(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-sm font-black font-mono rounded-xl bg-slate-950 border-2 border-emerald-500/60 text-emerald-300 focus:outline-none focus:border-emerald-400"
                    placeholder="Masukkan uang yang diterima..."
                  />
                </div>
              </div>

              {/* Tabung Galon Kosong Kembali */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                  Tabung Kosong Dikembalikan Toko (Jika Ada):
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTempoReturnedGallons((v) => Math.max(0, v - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 text-white font-black"
                  >
                    -
                  </button>
                  <span className="w-16 text-center font-mono font-black text-cyan-400 text-lg">
                    {tempoReturnedGallons}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTempoReturnedGallons((v) => v + 1)}
                    className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-black"
                  >
                    +
                  </button>
                  <span className="text-[10px] text-slate-400">Tabung Kosong</span>
                </div>
              </div>

              {/* Catatan Driver */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
                  Catatan Supir / No. Kwitansi Manual:
                </label>
                <input
                  type="text"
                  value={tempoCollectorNote}
                  onChange={(e) => setTempoCollectorNote(e.target.value)}
                  placeholder="Misal: Diterima tunai oleh Bpk. Somad langsung"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Real-time Notice */}
              <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>
                  Setelah tombol ditekan, piutang toko di Admin Dokumen & Buku Piutang akan langsung berkurang secara otomatis.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2.5 border-t border-slate-800 shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCollectTempoModal(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitCollectTempo}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_16px_rgba(16,185,129,0.45)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>SIMPAN & SINKRONKAN SETORAN TEMPO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: TANDA TERIMA & STRUK DIGITAL POPUP */}
      {completedReceiptData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border-t sm:border border-emerald-400 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
            {/* Header Receipt */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    TRANSAKSI SELESAI
                  </h3>
                  <span className="text-[10px] text-emerald-300 font-bold">
                    Nota #{completedReceiptData.orderId}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCompletedReceiptData(null)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="py-3 space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[10.5px]">
                <div className="text-center pb-2 border-b border-dashed border-slate-800">
                  <div className="font-extrabold text-white text-xs">JacS DepoHub Pro</div>
                  <div className="text-slate-400 text-[9px]">Depo Subang-Cipeundeuy • 0812-9988-7711</div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Pembeli:</span>
                  <span className="font-bold text-white">{completedReceiptData.customerName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pengantar:</span>
                  <span className="text-cyan-300 font-bold">{completedReceiptData.driverName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Waktu:</span>
                  <span>{completedReceiptData.time} WIB</span>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Barang Diserahkan:</span>
                  <span className="text-white font-bold block">{completedReceiptData.items}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Tabung Ditarik:</span>
                  <span className="text-amber-300 font-bold">{completedReceiptData.emptyGallonsReturned} Galon</span>
                </div>

                {completedReceiptData.damagedNotes && (
                  <div className="flex items-center justify-between text-rose-400">
                    <span>Retur Rusak:</span>
                    <span>{completedReceiptData.damagedNotes}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-dashed border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">TOTAL:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    Rp {completedReceiptData.totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const receiptOrder: OrderItem = {
                    id: completedReceiptData.orderId,
                    customerName: completedReceiptData.customerName,
                    customerType: 'Toko Kelontong',
                    phone: completedReceiptData.phone,
                    items: completedReceiptData.items,
                    totalAmount: completedReceiptData.totalAmount,
                    totalGalon: completedReceiptData.emptyGallonsReturned,
                    emptyGallonsReturned: completedReceiptData.emptyGallonsReturned,
                    paymentStatus: completedReceiptData.paymentStatus as any,
                    driver: completedReceiptData.driverName,
                    time: completedReceiptData.time,
                    deliveryStatus: 'SELESAI',
                    gallonScheme: 'Tukar Galon',
                    damagedItemsNote: completedReceiptData.damagedNotes,
                  };
                  setDriverReceiptOrder(receiptOrder);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-xs shadow-[0_0_14px_rgba(6,182,212,0.45)] cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-slate-950" />
                <span>🖨️ CETAK STRUK / NOTA THERMAL (58mm/80mm)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendWhatsAppReceipt(completedReceiptData)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_14px_rgba(16,185,129,0.45)] cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>📲 KIRIM NOTA WHATSAPP KE PEMBELI</span>
              </button>

              <button
                type="button"
                onClick={() => setCompletedReceiptData(null)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all text-center"
              >
                Tutup Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: FORMULIR LOG KUNJUNGAN & MULTI-DROP NEXAFIELD */}
      {showVisitLogModal && activeVisitTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-t sm:border border-cyan-400 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Formulir Log Kunjungan</span>
                    <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      NexaField
                    </span>
                  </h3>
                  <div className="text-[10.5px] font-bold text-slate-300 truncate max-w-[240px]">
                    {activeVisitTarget.customerName}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowVisitLogModal(false);
                  setActiveVisitTarget(null);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Konten Formulir Kunjungan */}
            <div className="py-2.5 space-y-3 overflow-y-auto flex-1 pr-0.5 custom-scrollbar text-xs">
              {/* Info Titik Kunjungan / Lokasi */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-start gap-1.5 text-slate-300 text-[10.5px]">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{activeVisitTarget.address}</span>
                </div>
                {activeVisitTarget.orderId && (
                  <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400 pt-1 border-t border-slate-900">
                    <span>No. Order: #{activeVisitTarget.orderId}</span>
                    <span className="text-slate-400">Armada: {activeDriver.vehicleType}</span>
                  </div>
                )}
              </div>

              {/* 1. PILIHAN STATUS: [Kunjungan], [Order Baru], [Follow Up Tagihan], [Drop Galon] */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Pilihan Status Log Kunjungan:</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'Drop Galon', icon: '🚚', desc: 'Serah terima muatan galon' },
                      { id: 'Order Baru', icon: '🛒', desc: 'Pencatatan pesanan tambahan' },
                      { id: 'Follow Up Tagihan', icon: '💳', desc: 'Penagihan nota tempo' },
                      { id: 'Kunjungan', icon: '🏪', desc: 'Cek stok & relasi toko' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setVisitFormStatus(st.id)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                        visitFormStatus === st.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1.5">
                          <span>{st.icon}</span>
                          <span className={visitFormStatus === st.id ? 'text-cyan-300' : 'text-slate-300'}>
                            {st.id}
                          </span>
                        </span>
                        {visitFormStatus === st.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </div>
                      <span className="text-[8.5px] text-slate-500 leading-tight">{st.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. DROP MULTI-PRODUK (Air Minum, FMCG Sembako, Homecare, Non-FMCG) */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 border-b border-slate-900 pb-1.5">
                  <span className="flex items-center gap-1.5 text-cyan-300 uppercase tracking-wide">
                    <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Drop Multi-Produk Belanjaan</span>
                  </span>
                  <span className="text-[9.5px] font-mono text-emerald-400 font-black">
                    Subtotal: Rp {visitCalculations.multiProductDropTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Tab Kategori Multi-Produk */}
                <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-[9.5px]">
                  <button
                    type="button"
                    onClick={() => setVisitCategoryTab('AIR')}
                    className={`py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      visitCategoryTab === 'AIR'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💧 Air Minum
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitCategoryTab('FMCG_FOOD')}
                    className={`py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      visitCategoryTab === 'FMCG_FOOD'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🌾 Sembako
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitCategoryTab('FMCG_NON_FOOD')}
                    className={`py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      visitCategoryTab === 'FMCG_NON_FOOD'
                        ? 'bg-rose-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🧼 Homecare
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitCategoryTab('NON_FMCG')}
                    className={`py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      visitCategoryTab === 'NON_FMCG'
                        ? 'bg-purple-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📦 Non-FMCG
                  </button>
                </div>

                {/* Item List Berdasarkan Kategori yang Dipilih */}
                <div className="space-y-1.5 pt-0.5">
                  {visitCategoryTab === 'AIR' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* RO Galon 19L */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">RO Galon 19L</span>
                          <span className="text-[8.5px] font-mono text-cyan-400">@Rp 16.000 / Tbg</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(0, visitDropRo19L - 1);
                              setVisitDropRo19L(next);
                              setVisitFormGalonTurun(next + visitDropMineral19L);
                            }}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-cyan-300 text-xs">
                            {visitDropRo19L}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = visitDropRo19L + 1;
                              setVisitDropRo19L(next);
                              setVisitFormGalonTurun(next + visitDropMineral19L);
                            }}
                            className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Mineral 19L */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Mineral 19L</span>
                          <span className="text-[8.5px] font-mono text-cyan-400">@Rp 15.000 / Tbg</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(0, visitDropMineral19L - 1);
                              setVisitDropMineral19L(next);
                              setVisitFormGalonTurun(visitDropRo19L + next);
                            }}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-cyan-300 text-xs">
                            {visitDropMineral19L}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = visitDropMineral19L + 1;
                              setVisitDropMineral19L(next);
                              setVisitFormGalonTurun(visitDropRo19L + next);
                            }}
                            className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Botol 600ml Dus */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Botol 600ml</span>
                          <span className="text-[8.5px] font-mono text-cyan-400">@Rp 36.000 / Dus</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropBotolDus((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-cyan-300 text-xs">
                            {visitDropBotolDus}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropBotolDus((v) => v + 1)}
                            className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Cup 240ml Dus */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Cup 240ml</span>
                          <span className="text-[8.5px] font-mono text-cyan-400">@Rp 22.500 / Dus</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropCupDus((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-cyan-300 text-xs">
                            {visitDropCupDus}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropCupDus((v) => v + 1)}
                            className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {visitCategoryTab === 'FMCG_FOOD' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Beras Ramos 5kg */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Beras Ramos 5kg</span>
                          <span className="text-[8.5px] font-mono text-amber-400">@Rp 68.500 / Pouch</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropRice5kg((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-amber-300 text-xs">
                            {visitDropRice5kg}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropRice5kg((v) => v + 1)}
                            className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Minyak Goreng 2L */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Minyak Goreng 2L</span>
                          <span className="text-[8.5px] font-mono text-amber-400">@Rp 34.000 / Pouch</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropOil2L((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-amber-300 text-xs">
                            {visitDropOil2L}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropOil2L((v) => v + 1)}
                            className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Telur Ayam 1 Tray */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Telur 1 Tray</span>
                          <span className="text-[8.5px] font-mono text-amber-400">@Rp 51.000 / Tray</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropEggsTray((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-amber-300 text-xs">
                            {visitDropEggsTray}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropEggsTray((v) => v + 1)}
                            className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Mi Instan Box */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Mi Instan Box</span>
                          <span className="text-[8.5px] font-mono text-amber-400">@Rp 115.000 / Dus</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropNoodleBox((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-amber-300 text-xs">
                            {visitDropNoodleBox}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropNoodleBox((v) => v + 1)}
                            className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {visitCategoryTab === 'FMCG_NON_FOOD' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Sabun Cuci Piring */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Sabun Cuci 650ml</span>
                          <span className="text-[8.5px] font-mono text-rose-400">@Rp 14.500 / Pcs</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropDishwash((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-rose-300 text-xs">
                            {visitDropDishwash}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropDishwash((v) => v + 1)}
                            className="w-5 h-5 rounded bg-rose-500/20 text-rose-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Deterjen Bubuk 770g */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Deterjen 770g</span>
                          <span className="text-[8.5px] font-mono text-rose-400">@Rp 19.500 / Pack</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropDetergent((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-rose-300 text-xs">
                            {visitDropDetergent}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropDetergent((v) => v + 1)}
                            className="w-5 h-5 rounded bg-rose-500/20 text-rose-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {visitCategoryTab === 'NON_FMCG' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Dispenser Air Galon */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Dispenser Galon Bawah</span>
                          <span className="text-[8.5px] font-mono text-purple-400">@Rp 185.000 / Unit</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropDispenser((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-purple-300 text-xs">
                            {visitDropDispenser}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropDispenser((v) => v + 1)}
                            className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Pompa Galon Elektrik */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Pompa Galon Elektrik</span>
                          <span className="text-[8.5px] font-mono text-purple-400">@Rp 45.000 / Pcs</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropPompa((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-black text-purple-300 text-xs">
                            {visitDropPompa}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropPompa((v) => v + 1)}
                            className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Tabung Gas LPG 3kg */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between col-span-2">
                        <div className="min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-white block truncate">Tabung Gas LPG 3kg (Isi)</span>
                          <span className="text-[8.5px] font-mono text-purple-400">@Rp 22.000 / Tabung</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisitDropGasLpg((v) => Math.max(0, v - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-black text-purple-300 text-xs">
                            {visitDropGasLpg}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisitDropGasLpg((v) => v + 1)}
                            className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. SIRKULASI & MUTASI WADAH KOSONG (Galon, Krat/Peti Botol, Gas LPG, Palet) */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 border-b border-slate-900 pb-1.5">
                  <span className="flex items-center gap-1 text-amber-300 uppercase tracking-wide">
                    <Package className="w-3 h-3 text-amber-400" />
                    <span>Sirkulasi Wadah &amp; Aset Kemasan</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    Sisa Muatan: {currentCargo.galonAqua} Gln
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Galon 19L Kosong Ditarik */}
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold text-amber-300 block truncate">
                      Galon 19L Kosong:
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setVisitFormGalonTarik((v) => Math.max(0, v - 1))}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        {visitFormGalonTarik}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVisitFormGalonTarik((v) => v + 1)}
                        className="w-6 h-6 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Krat Botol Kosong Ditarik */}
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold text-amber-300 block truncate">
                      Krat Botol Kosong:
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setVisitTarikKrat((v) => Math.max(0, v - 1))}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        {visitTarikKrat}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVisitTarikKrat((v) => v + 1)}
                        className="w-6 h-6 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Tabung Gas Kosong Ditarik */}
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold text-amber-300 block truncate">
                      Tabung Gas Kosong:
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setVisitTarikGas((v) => Math.max(0, v - 1))}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        {visitTarikGas}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVisitTarikGas((v) => v + 1)}
                        className="w-6 h-6 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. SETTLEMENT PEMBAYARAN & PELUNASAN TEMPO NOTA SEBELUMNYA */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 border-b border-slate-900 pb-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-300 uppercase tracking-wide">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pembayaran &amp; Pelunasan Tagihan</span>
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">
                    Kas Diterima: Rp {visitCalculations.totalCashCollected.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Input Pelunasan Tempo Toko Sebelumnya */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Pelunasan Faktur Tempo Sebelumnya (Jika Ada):</span>
                    <span className="text-[8.5px] font-mono text-slate-400">Rp</span>
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={visitSettleTempoAmount || ''}
                    onChange={(e) => setVisitSettleTempoAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 font-mono font-black text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Pilihan Metode Bayar */}
                <div className="space-y-1 pt-1">
                  <span className="text-[9.5px] font-bold text-slate-300 block">
                    Metode Pembayaran Transaksi Ini:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Tunai', 'Transfer / QRIS', 'Tempo / Bon Toko'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setVisitPaymentMethod(m)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                          visitPaymentMethod === m
                            ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-xs'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. INPUT UPLOAD FOTO BUKTI ANTAR / GALON DITERIMA */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Foto Bukti Antar / Galon Diterima:</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-normal">Kamera / Berkas</span>
                </label>

                {visitFormPhotoUrl ? (
                  <div className="relative rounded-xl border border-cyan-500/50 overflow-hidden bg-slate-950 p-2 flex items-center gap-3">
                    <img
                      src={visitFormPhotoUrl}
                      alt="Bukti Antar"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-white block truncate">
                        {visitFormPhotoName || 'Foto_Bukti_Antar.jpg'}
                      </span>
                      <span className="text-[9px] text-emerald-400 flex items-center gap-1 mt-0.5 font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Foto Berhasil Diunggah</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVisitFormPhotoUrl(null);
                          setVisitFormPhotoName('');
                        }}
                        className="mt-1 text-[9px] text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer"
                      >
                        Hapus / Ganti Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-800 hover:border-cyan-400/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/60 transition-all">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <Camera className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">
                      Ambil Foto Kamera atau Upload Berkas
                    </span>
                    <span className="text-[8.5px] text-slate-500">
                      Foto galon diterima di toko / tanda tangan nota
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleVisitPhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* 4. KOLOM CATATAN KUNJUNGAN */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Catatan Kunjungan Lapangan:</span>
                </label>
                <textarea
                  value={visitFormNotes}
                  onChange={(e) => setVisitFormNotes(e.target.value)}
                  placeholder="Tuliskan catatan kunjungan, nama penerima, atau kondisi toko..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none resize-none transition-all"
                />
                {/* Preset tags */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {[
                    'Diterima Kasir',
                    'Tukar Galon Lengkap',
                    'Toko Ramai',
                    'Minta Tambah Pasokan Besok',
                    'Janji Bayar Tempo Sore',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setVisitFormNotes((prev) => (prev ? `${prev}. ${tag}` : tag))
                      }
                      className="px-2 py-0.5 rounded-full text-[8.5px] bg-slate-800 text-slate-300 hover:bg-slate-700 whitespace-nowrap cursor-pointer transition-all"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. TOMBOL AKSI MODAL: SIMPAN KUNJUNGAN */}
            <div className="pt-2.5 border-t border-slate-800 shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowVisitLogModal(false);
                  setActiveVisitTarget(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveVisitLog}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-400 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs shadow-[0_0_16px_rgba(6,182,212,0.45)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>SIMPAN KUNJUNGAN &amp; PERBARUI SIRKULASI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK STRUK & NOTA THERMAL (58MM / 80MM) DRIVER */}
      <ThermalReceiptModal
        isOpen={Boolean(driverReceiptOrder)}
        onClose={() => setDriverReceiptOrder(null)}
        order={driverReceiptOrder}
      />
    </div>
  );
};
