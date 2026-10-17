import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MASTER_PRODUCTS, DRIVER_SETORAN, RECEIVABLES, CUSTOMER_MASTER, ARMADA_LIST, GALLON_CIRCULATION } from '../data/mockData';
import { PosCartItem, DriverSetoranItem, ReceivableItem, OrderItem, CustomerMasterItem, ArmadaItem, ProductMasterItem, StoreRegistrationSubmission, KasirTransaction } from '../types';
import { CustomerModal } from './CustomerModal';
import { ProductModal } from './ProductModal';
import { SpotOrderApprovalModal } from './SpotOrderApprovalModal';
import { getDepoProfile } from '../utils/depoProfile';
import { syncPosTransactionToGas, getGasWebhookUrl } from '../utils/cloudSync';
import { getNextReceiptNumber, getNextOrderNumber, getNextPiutangNumber } from '../utils/receiptCounter';
import { calculateStockWarning, StockWarningDetail } from '../utils/stockWarning';
import {
  saveMasterCache,
  enqueueOfflineTransaction,
  getPendingQueueCount,
  getCachedMasterData,
  processAndSyncOfflineQueue,
} from '../utils/offlineSyncEngine';

interface KasirViewProps {
  onNavigateWhatsApp: () => void;
  prefillOrder?: OrderItem | null;
  onClearPrefill?: () => void;
  orders?: OrderItem[];
  customers?: CustomerMasterItem[];
  products?: ProductMasterItem[];
  onAddProduct?: (newProduct: ProductMasterItem) => void;
  onAddCustomer?: (newCustomer: CustomerMasterItem) => void;
  onAddOrder?: (newOrder: OrderItem) => void;
  onAddReceivable?: (newReceivable: ReceivableItem) => void;
  armadaList?: ArmadaItem[];
  allowMultiDrop?: boolean;
  onToggleMultiDrop?: () => void;
  storeSubmissions?: StoreRegistrationSubmission[];
  onApproveStoreSubmission?: (submissionId: string) => void;
  onRejectStoreSubmission?: (submissionId: string) => void;
  onApproveDriverOrder?: (orderId: string) => void;
  onScheduleNextDrop?: (orderId: string) => void;
  kasirTransactions?: KasirTransaction[];
  onCompleteKasirTransaction?: (data: {
    trxId: string;
    customerName: string;
    customerType?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    cart: PosCartItem[];
    paymentMethod: string;
    grandTotal: number;
    subtotal?: number;
    discountAmount?: number;
    discountLabel?: string;
    ppnAmount?: number;
    cashReceived?: number;
    changeAmount?: number;
    deliveryType: 'pickup' | 'armada';
    newOrder?: OrderItem;
    newReceivable?: ReceivableItem;
  }) => void;
  onCompleteTransaction?: (data: any) => void;
  handleCheckout?: () => void;
  onShowToast?: (msg: string) => void;
  onLockSession?: () => void;
}

export const KasirView: React.FC<KasirViewProps> = ({
  onNavigateWhatsApp,
  prefillOrder,
  onClearPrefill,
  orders = [],
  customers = CUSTOMER_MASTER,
  products: propProducts,
  onAddProduct,
  onAddCustomer,
  onAddOrder,
  onAddReceivable,
  armadaList = ARMADA_LIST,
  allowMultiDrop = false,
  onToggleMultiDrop,
  storeSubmissions = [],
  onApproveStoreSubmission,
  onRejectStoreSubmission,
  onApproveDriverOrder,
  onScheduleNextDrop,
  kasirTransactions = [],
  onCompleteKasirTransaction,
  onCompleteTransaction,
  onShowToast,
  onLockSession,
}) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'setoran' | 'riwayat'>('pos');
  const [gasSyncToast, setGasSyncToast] = useState<string | null>(null);
  const [isSavingToSheets, setIsSavingToSheets] = useState<boolean>(false);
  const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null);
  const [showB2cPullModal, setShowB2cPullModal] = useState(false);
  const [showStoreSubmissionsModal, setShowStoreSubmissionsModal] = useState(false);
  const [showSpotApprovalModal, setShowSpotApprovalModal] = useState(false);
  const [preselectedSpotOrderId, setPreselectedSpotOrderId] = useState<string | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState<'MENUNGGU' | 'SEMUA' | 'DISETUJUI' | 'DITOLAK'>('MENUNGGU');
  const [viewingReceiptTx, setViewingReceiptTx] = useState<KasirTransaction | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isSyncingAllHistory, setIsSyncingAllHistory] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; currentId: string }>({
    current: 0,
    total: 0,
    currentId: '',
  });

  const pendingSubmissionsCount = storeSubmissions.filter(
    (s) => s.status === 'MENUNGGU_KONFIRMASI_ADMIN'
  ).length;

  const pendingSpotOrdersCount = orders.filter(
    (o) => o.deliveryStatus === 'MENUNGGU_APPROVAL_ADMIN'
  ).length;

  // Products List State & Add SKU Modal
  const [productsList, setProductsList] = useState<ProductMasterItem[]>(propProducts || MASTER_PRODUCTS);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanUomMode, setScanUomMode] = useState<'eceran' | 'karton'>('eceran');
  const [emptyReturns, setEmptyReturns] = useState<{
    galon19L: number;
    kratBotol: number;
    tabungGas: number;
    palet: number;
  }>({
    galon19L: 0,
    kratBotol: 0,
    tabungGas: 0,
    palet: 0,
  });
  const [showContainerReturnSection, setShowContainerReturnSection] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeFeedback, setBarcodeFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [catalogCategory, setCatalogCategory] = useState<string>('Semua');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Deteksi Realtime Produk yang sedang diketik / discan pada Barcode Input (Threshold <= 30%)
  const scannedCandidateProduct = useMemo(() => {
    const q = barcodeInput.trim().toLowerCase();
    if (!q) return null;
    return (
      productsList.find((p) => p.id.toLowerCase() === q || (p.barcode && p.barcode.toLowerCase() === q)) ||
      productsList.find((p) => p.id.toLowerCase().startsWith(q)) ||
      productsList.find((p) => p.name.toLowerCase().includes(q))
    );
  }, [barcodeInput, productsList]);

  const scannedStockWarning = useMemo(() => {
    if (!scannedCandidateProduct) return null;
    const warn = calculateStockWarning(scannedCandidateProduct);
    return (warn.status === 'warning' || warn.status === 'critical') ? warn : null;
  }, [scannedCandidateProduct]);

  // Alert stok saat scan selesai dieksekusi atau item ditambahkan ke keranjang
  const [recentScanWarning, setRecentScanWarning] = useState<StockWarningDetail | null>(null);
  const activeStockWarning = scannedStockWarning || recentScanWarning;

  // Print Invoice & Surat Jalan States (A5 / Thermal)
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDocType, setPrintDocType] = useState<'invoice' | 'surat_jalan'>('invoice');
  const [printPaperSize, setPrintPaperSize] = useState<'a5' | 'thermal'>('a5');

  const handlePrintInvoice = () => {
    setPrintDocType('invoice');
    setShowPrintModal(true);
  };

  const handlePrintSuratJalan = () => {
    setPrintDocType('surat_jalan');
    setShowPrintModal(true);
  };

  useEffect(() => {
    if (propProducts) {
      setProductsList(propProducts);
    }
  }, [propProducts]);

  // Offline Engine State: status jaringan dan jumlah transaksi tertunda
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
      return window.navigator.onLine;
    }
    return true;
  });
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => getPendingQueueCount());

  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);

  // Auto-retry & flush background worker untuk antrean cloud kasir
  const triggerAutoSyncQueue = useCallback(async () => {
    const isCurrentlyOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
    if (!isCurrentlyOnline) return;
    const currentPending = getPendingQueueCount();
    if (currentPending === 0) return;

    setIsSyncingQueue(true);
    try {
      const res = await processAndSyncOfflineQueue();
      const updatedCount = getPendingQueueCount();
      setPendingQueueCount(updatedCount);
      if (res.syncedCount > 0) {
        const msg = `🟢 ${res.syncedCount} transaksi antrean cloud berhasil disinkronkan ke Google Sheets!`;
        setGasSyncToast(msg);
        if (onShowToast) onShowToast(msg);
        setTimeout(() => setGasSyncToast(null), 4000);
      }
    } catch (err) {
      console.warn('[Kasir POS] Auto-sync queue retry error:', err);
    } finally {
      setIsSyncingQueue(false);
      setPendingQueueCount(getPendingQueueCount());
    }
  }, [onShowToast]);

  // Listeners online / offline window events & auto-retry sinkronisasi cloud
  useEffect(() => {
    // Jalankan auto-sync segera saat inisialisasi agar transaksi tertunda langsung tuntas
    triggerAutoSyncQueue();

    const handleOnline = () => {
      setIsOnline(true);
      setPendingQueueCount(getPendingQueueCount());
      triggerAutoSyncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setPendingQueueCount(getPendingQueueCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-retry worker berjalan rutin tanpa menahan antrean lokal
    const interval = setInterval(() => {
      const count = getPendingQueueCount();
      setPendingQueueCount(count);
      if (typeof window !== 'undefined' && window.navigator.onLine && count > 0) {
        triggerAutoSyncQueue();
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [triggerAutoSyncQueue]);

  // Simpan master data katalog dan pelanggan ke Offline Cache saat online
  useEffect(() => {
    if (productsList && productsList.length > 0 && customers && customers.length > 0) {
      saveMasterCache(productsList, customers);
    }
  }, [productsList, customers]);

  // Pricing helper for customer tiers vs flat pricing
  const getProductUnitPriceForCustomer = (product: ProductMasterItem, customer: CustomerMasterItem | null): number => {
    // 1. Flat scheme or identical prices across tiers -> Flat price always applies to all buyers
    if (product.pricingScheme === 'flat' || (product.pricePangkalan === product.priceToko && product.priceToko === product.priceRetail)) {
      return product.flatPrice || product.priceRetail;
    }
    // 2. If customer is selected and is Pangkalan tier
    if (customer && (customer.priceTier === 'Pangkalan' || customer.b2bCategory === 'Agen / Pangkalan')) {
      return product.pricePangkalan || product.priceRetail;
    }
    // 3. If customer is selected and is Toko Kelontong tier
    if (customer && (customer.priceTier === 'Toko' || customer.b2bCategory === 'Toko Kelontong')) {
      return product.priceToko || product.priceRetail;
    }
    // 4. Default: Retail / Eceran (B2C / Walk-in)
    return product.priceRetail;
  };

  // Filtered catalog products for POS quick grid
  const filteredCatalogProducts = productsList.filter((prod) => {
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchId = prod.id.toLowerCase().includes(q);
      const matchCat = prod.category.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchCat) return false;
    }
    if (catalogCategory === 'Semua') return true;
    if (catalogCategory === '💧 Air & Minuman') return prod.parentCategory === 'AIR_MINUM' || prod.category.includes('Galon') || prod.category.includes('Botol') || prod.category.includes('Cup');
    if (catalogCategory === '🌾 FMCG Sembako') return prod.parentCategory === 'FMCG_FOOD' || prod.category.includes('Beras') || prod.category.includes('Minyak') || prod.category.includes('Telur');
    if (catalogCategory === '🧼 FMCG Homecare') return prod.parentCategory === 'FMCG_NON_FOOD' || prod.category.includes('Sabun') || prod.category.includes('Deterjen');
    if (catalogCategory === '📦 Non-FMCG Logistik') return prod.parentCategory === 'NON_FMCG_LOGISTIK' || prod.category.includes('Dispenser') || prod.category.includes('Pompa') || prod.category.includes('Rak');
    const cat = prod.category.toLowerCase();
    if (catalogCategory === 'Galon 19L') return cat.includes('galon');
    if (catalogCategory === 'Kemasan Botol / Dus') return cat.includes('botol') || cat.includes('dus') || cat.includes('karton');
    if (catalogCategory === 'Kemasan Gelas / Cup') return cat.includes('cup') || cat.includes('gelas');
    if (catalogCategory === 'Aksesoris & Peralatan') return cat.includes('aksesoris') || cat.includes('alat') || cat.includes('peralatan') || cat.includes('pompa') || cat.includes('rak');
    if (catalogCategory === 'Sanitasi & Tisu') return cat.includes('sanitasi') || cat.includes('tisu') || cat.includes('segel');
    if (catalogCategory === 'Lainnya') {
      return !cat.includes('galon') && !cat.includes('botol') && !cat.includes('cup') && !cat.includes('dus') && !cat.includes('alat') && !cat.includes('sanitasi');
    }
    return prod.category === catalogCategory;
  });

  // Customer Autocomplete & Selection State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMasterItem | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const [customerScanFeedback, setCustomerScanFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Audio Beep helper untuk scan sukses/error pada Kasir POS
  const playScanBeep = (type: 'success' | 'error' = 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 Note - high pleasant beep
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low warning buzz
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio playback silently ignored if audio context is blocked
    }
  };

  // Delivery Mode State: Walk-in (Depo) vs Kirim Armada (Open Dispatch)
  const [deliveryType, setDeliveryType] = useState<'depo' | 'armada'>('depo');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [landmarkNote, setLandmarkNote] = useState<string>('');
  const [mapsUrl, setMapsUrl] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Helper parsing GPS coordinates or Google Maps link
  const handleParseMapsInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setMapsUrl('');
      setCoordinates(null);
      return;
    }
    setMapsUrl(trimmed);

    // Check if it's "lat, lng" e.g. -6.5821, 107.7654 or -6.5821,107.7654
    const coordsMatch = trimmed.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lng = parseFloat(coordsMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCoordinates({ lat, lng });
        if (!trimmed.startsWith('http')) {
          setMapsUrl(`https://maps.google.com/?q=${lat},${lng}`);
        }
        return;
      }
    }

    // If it's a URL with q=lat,lng or @lat,lng
    const urlCoordMatch = trimmed.match(/[@?&]q?=?(-?\d+\.\d+)[,/](-?\d+\.\d+)/);
    if (urlCoordMatch) {
      const lat = parseFloat(urlCoordMatch[1]);
      const lng = parseFloat(urlCoordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCoordinates({ lat, lng });
      }
    }
  };

  // POS State
  const [cart, setCart] = useState<PosCartItem[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS Depo' | 'Transfer Bank' | 'Bayar Tempo'>('Tunai');
  
  // Tax (PPN) & Dual-Mode Discount State
  const [isPpnActive, setIsPpnActive] = useState<boolean>(false);
  const [ppnMode, setPpnMode] = useState<'11' | '12' | 'custom'>('11');
  const [customPpnRate, setCustomPpnRate] = useState<number>(10);
  const [discountMode, setDiscountMode] = useState<'rp' | 'percent'>('rp');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Effective PPN Rate calculation
  const effectivePpnRate = ppnMode === '11' ? 11 : ppnMode === '12' ? 12 : customPpnRate;

  const [cashReceived, setCashReceived] = useState<number>(0);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [transactionCompleted, setTransactionCompleted] = useState<string | null>(null);

  // Reset keranjang dan transaksi kasir saat sinyal reset global data dummy diterima
  useEffect(() => {
    const handleReset = () => {
      setCart([]);
      setTransactionCompleted(null);
      setViewingReceiptTx(null);
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setCashReceived(0);
    };
    window.addEventListener('depo_data_reset', handleReset);
    return () => window.removeEventListener('depo_data_reset', handleReset);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle customer selection
  const handleSelectCustomer = (cust: CustomerMasterItem) => {
    setSelectedCustomer(cust);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    if (cust.address) {
      setDeliveryAddress(cust.address);
    }
    setLandmarkNote(cust.landmarkNote || cust.landmark || '');
    if (cust.mapsUrl) {
      setMapsUrl(cust.mapsUrl);
    } else if (cust.coordinates) {
      setMapsUrl(`https://maps.google.com/?q=${cust.coordinates.lat},${cust.coordinates.lng}`);
    } else {
      setMapsUrl('');
    }
    setCoordinates(cust.coordinates || null);
    setCustomerSearchQuery(`[${cust.id}] ${cust.name} (${cust.type})`);
    setIsDropdownOpen(false);

    // Synchronize price tiers for products currently in the cart
    setCart((prev) =>
      prev.map((item) => {
        const prod = productsList.find((p) => p.id === item.productId);
        if (!prod) return item;

        // If product is flat price, keep flat price without discounts
        const isFlat = prod.pricingScheme === 'flat' || (prod.pricePangkalan === prod.priceToko && prod.priceToko === prod.priceRetail);
        const basePrice = isFlat ? (prod.flatPrice || prod.priceRetail) : getProductUnitPriceForCustomer(prod, cust);

        // Add gallon scheme surcharge if applicable
        const extraFee = item.gallonScheme === 'Beli Putus (+Rp 45.000)' ? 45000 : item.gallonScheme === 'Pinjam Deposit (+Rp 35.000)' ? 35000 : 0;
        const finalUnitPrice = basePrice + extraFee;

        const { fee, subtotal: itemSub } = calcItemSubtotal(
          item.qty,
          finalUnitPrice,
          item.isGalonRefill,
          item.emptyGallonsReturned,
          item.shortageResolution
        );

        return {
          ...item,
          unitPrice: finalUnitPrice,
          shortageFee: fee,
          subtotal: itemSub,
        };
      })
    );
  };

  const handleClearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerSearchQuery('');
    setDeliveryAddress('');
    setLandmarkNote('');
    setMapsUrl('');
    setCoordinates(null);
    if (paymentMethod === 'Bayar Tempo') {
      setPaymentMethod('Tunai');
      setCashReceived(100000);
    }

    // Revert cart items back to Retail prices (flat products remain flat)
    setCart((prev) =>
      prev.map((item) => {
        const prod = productsList.find((p) => p.id === item.productId);
        if (!prod) return item;

        const isFlat = prod.pricingScheme === 'flat' || (prod.pricePangkalan === prod.priceToko && prod.priceToko === prod.priceRetail);
        const basePrice = isFlat ? (prod.flatPrice || prod.priceRetail) : prod.priceRetail;
        const extraFee = item.gallonScheme === 'Beli Putus (+Rp 45.000)' ? 45000 : item.gallonScheme === 'Pinjam Deposit (+Rp 35.000)' ? 35000 : 0;
        const finalUnitPrice = basePrice + extraFee;

        const { fee, subtotal: itemSub } = calcItemSubtotal(
          item.qty,
          finalUnitPrice,
          item.isGalonRefill,
          item.emptyGallonsReturned,
          item.shortageResolution
        );

        return {
          ...item,
          unitPrice: finalUnitPrice,
          shortageFee: fee,
          subtotal: itemSub,
        };
      })
    );
  };

  const handleSaveNewCustomer = (newCust: CustomerMasterItem) => {
    if (onAddCustomer) {
      onAddCustomer(newCust);
    }
    handleSelectCustomer(newCust);
  };

  // Filter customers for dropdown (termasuk pencocokan barcode kartu member jika ada)
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      c.phone.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      (c.b2bCategory && c.b2bCategory.toLowerCase().includes(q)) ||
      (c.barcode && c.barcode.toLowerCase().includes(q)) ||
      (c.memberCode && c.memberCode.toLowerCase().includes(q))
    );
  });

  // Handler Scanner Barcode / QR Kartu Member & Penekanan Tombol Enter
  const handleCustomerScanOrEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const rawQuery = customerSearchQuery.trim();
    if (!rawQuery) return;

    const queryLower = rawQuery.toLowerCase();
    const queryDigits = rawQuery.replace(/\D/g, '');

    // 1. Prioritas Pertama: Pencocokan Eksak ID Pelanggan (misal: CUST-B2B-001)
    let matchedCust = customers.find((c) => c.id.toLowerCase() === queryLower);

    // 2. Prioritas Kedua: Pencocokan Barcode / Member Code Kartu Member
    if (!matchedCust) {
      matchedCust = customers.find(
        (c) =>
          (c.barcode && c.barcode.toLowerCase() === queryLower) ||
          (c.memberCode && c.memberCode.toLowerCase() === queryLower)
      );
    }

    // 3. Prioritas Ketiga: Pencocokan Nomor HP / WA (hanya jika ada angka)
    if (!matchedCust && queryDigits.length >= 4) {
      matchedCust = customers.find((c) => {
        const phoneDigits = c.phone.replace(/\D/g, '');
        return phoneDigits === queryDigits || phoneDigits.endsWith(queryDigits) || (queryDigits.length >= 8 && phoneDigits.includes(queryDigits));
      });
    }

    // 4. Prioritas Keempat: Pencocokan Nama Eksak
    if (!matchedCust) {
      matchedCust = customers.find((c) => c.name.toLowerCase() === queryLower);
    }

    // 5. Fallback: Cek Offline Master Member Cache jika database belum sinkron
    if (!matchedCust) {
      const cached = getCachedMasterData();
      const cachedMember = cached.members.find(
        (cm) =>
          cm.id.toLowerCase() === queryLower ||
          (cm.memberCardId && cm.memberCardId.toLowerCase() === queryLower) ||
          (cm.barcode && cm.barcode.toLowerCase() === queryLower) ||
          (cm.memberCode && cm.memberCode.toLowerCase() === queryLower) ||
          (queryDigits.length >= 4 && cm.phone.replace(/\D/g, '').includes(queryDigits)) ||
          cm.name.toLowerCase() === queryLower
      );
      if (cachedMember) {
        matchedCust = {
          id: cachedMember.id,
          name: cachedMember.name,
          type: cachedMember.type,
          phone: cachedMember.phone,
          address: cachedMember.address || 'Alamat Toko Binaan',
          barcode: cachedMember.barcode || cachedMember.memberCardId,
          memberCode: cachedMember.memberCode,
          ownerName: cachedMember.ownerName,
        };
      }
    }

    // 6. Fallback Terakhir: Ambil hasil teratas dari daftar filter
    if (!matchedCust && filteredCustomers.length > 0) {
      matchedCust = filteredCustomers[0];
    }

    if (matchedCust) {
      // Ditemukan: Pilih otomatis pelanggan, terapkan tier harga, bunyikan beep & notifikasi kilat
      handleSelectCustomer(matchedCust);
      playScanBeep('success');
      setCustomerScanFeedback({
        type: 'success',
        text: `✓ Member Terdeteksi: [${matchedCust.id}] ${matchedCust.name} (${matchedCust.type})`,
      });

      // Auto-focus kursor langsung ke kolom input scan produk/SKU
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
          barcodeInputRef.current.select();
        }
      }, 80);
    } else {
      // Benar-benar tidak ditemukan data pelanggan
      playScanBeep('error');
      setCustomerScanFeedback({
        type: 'error',
        text: `⚠️ Member "${rawQuery}" tidak terdaftar dalam database.`,
      });
    }

    // Bersihkan notifikasi kilat setelah 3.5 detik
    setTimeout(() => {
      setCustomerScanFeedback((prev) => (prev ? null : null));
    }, 3500);
  };

  // Handle prefill order when passed from OrderView or App
  const loadOrderIntoCart = (ord: OrderItem) => {
    setCustomerName(ord.customerName);
    setCustomerPhone(ord.phone || '');
    setLoadedOrderId(ord.id);

    // Try matching customer in master
    const matchedCust = customers.find(
      (c) => c.name.toLowerCase() === ord.customerName.toLowerCase() || (ord.phone && c.phone === ord.phone)
    );
    if (matchedCust) {
      setSelectedCustomer(matchedCust);
      setCustomerSearchQuery(`[${matchedCust.id}] ${matchedCust.name} (${matchedCust.type})`);
    } else {
      setCustomerSearchQuery(ord.customerName);
    }

    if (ord.deliveryAddress || ord.residentialDetail) {
      setDeliveryAddress(ord.deliveryAddress || ord.residentialDetail || '');
    }
    if (ord.landmarkNote) {
      setLandmarkNote(ord.landmarkNote);
    }
    if (ord.mapsUrl) {
      setMapsUrl(ord.mapsUrl);
    }
    if (ord.coordinates) {
      setCoordinates(ord.coordinates);
    }
    if (ord.deliveryStatus === 'MENUNGGU_DRIVER' || ord.deliveryStatus === 'Dalam Pengiriman' || ord.driver) {
      setDeliveryType('armada');
    }

    const scheme: 'Refill Tukar' | 'Beli Putus (+Rp 45.000)' | 'Pinjam Deposit (+Rp 35.000)' =
      ord.gallonScheme === 'Beli Galon Baru'
        ? 'Beli Putus (+Rp 45.000)'
        : ord.gallonScheme === 'Pinjam Galon Depo'
        ? 'Pinjam Deposit (+Rp 35.000)'
        : 'Refill Tukar';

    const basePrice = ord.priceTier === 'Pangkalan' ? 18500 : ord.priceTier === 'Toko' ? 19500 : 21000;
    const finalPrice =
      scheme === 'Beli Putus (+Rp 45.000)'
        ? basePrice + 45000
        : scheme === 'Pinjam Deposit (+Rp 35.000)'
        ? basePrice + 35000
        : basePrice;

    const newCart: PosCartItem[] = [
      {
        id: `cart-order-${ord.id}`,
        productId: 'PRD-01',
        name: `Aqua 19L (${ord.customerType || 'B2C Warga'})`,
        category: 'Galon 19L',
        unit: 'Tabung',
        unitPrice: finalPrice,
        qty: ord.totalGalon || 1,
        subtotal: (ord.totalGalon || 1) * finalPrice,
        isGalonRefill: true,
        gallonScheme: scheme,
        emptyGallonsReturned: ord.emptyGallonsReturned !== undefined ? ord.emptyGallonsReturned : ord.totalGalon,
      },
    ];

    setCart(newCart);
    setCashReceived(Math.max(50000, Math.ceil(ord.totalAmount / 50000) * 50000));
    setShowB2cPullModal(false);
  };

  useEffect(() => {
    if (prefillOrder) {
      loadOrderIntoCart(prefillOrder);
    }
  }, [prefillOrder]);

  // Setoran & Pelunasan State
  const [driverSetorans, setDriverSetorans] = useState<DriverSetoranItem[]>(DRIVER_SETORAN);
  const [receivables, setReceivables] = useState<ReceivableItem[]>(RECEIVABLES);
  const [searchInvoice, setSearchInvoice] = useState('');

  // Helper to calculate subtotal with shortage fee logic
  const calcItemSubtotal = (
    qty: number,
    unitPrice: number,
    isRefill?: boolean,
    returned?: number,
    shortageRes?: 'beli' | 'pinjam' | 'hutang'
  ): { fee: number; subtotal: number } => {
    let fee = 0;
    if (isRefill && returned !== undefined && qty > returned) {
      const shortage = qty - returned;
      if (shortageRes === 'beli') {
        fee = shortage * 50000;
      } else if (shortageRes === 'pinjam') {
        fee = shortage * 35000;
      }
    }
    return { fee, subtotal: qty * unitPrice + fee };
  };

  // Cart calculations with dual-mode Discount & PPN
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const calculatedDiscount = discountMode === 'percent'
    ? Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100)
    : Math.min(subtotal, Math.max(0, discountValue));

  const afterDiscount = Math.max(0, subtotal - calculatedDiscount);
  const ppnAmount = isPpnActive ? Math.round((afterDiscount * effectivePpnRate) / 100) : 0;
  const grandTotal = afterDiscount + ppnAmount;
  const changeAmount = paymentMethod === 'Bayar Tempo' ? 0 : cashReceived - grandTotal;
  const isCashSufficient = paymentMethod === 'Bayar Tempo' ? true : cashReceived >= grandTotal;

  const handleAddToCart = (product: ProductMasterItem, targetUom?: string) => {
    const hasHigherLevel = product.uomLevels && product.uomLevels.length > 0;
    const higherLevel = hasHigherLevel ? product.uomLevels![0] : null;
    const isHigherUom = Boolean(targetUom && higherLevel && targetUom === higherLevel.unit);
    const activeUom = isHigherUom ? higherLevel!.unit : (product.selectedUom || product.unit);

    let applicablePrice = getProductUnitPriceForCustomer(product, selectedCustomer);
    if (isHigherUom && higherLevel) {
      if (selectedCustomer?.priceTier === 'Pangkalan' && higherLevel.pricePangkalan > 0) {
        applicablePrice = higherLevel.pricePangkalan;
      } else if (selectedCustomer?.priceTier === 'Toko' && higherLevel.priceToko > 0) {
        applicablePrice = higherLevel.priceToko;
      } else if (higherLevel.priceRetail > 0) {
        applicablePrice = higherLevel.priceRetail;
      } else {
        applicablePrice = applicablePrice * higherLevel.conversionRatio;
      }
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id && (item.selectedUom || item.unit) === activeUom);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      if (updated[existingIndex].emptyGallonsReturned !== undefined && updated[existingIndex].gallonScheme === 'Refill Tukar') {
        updated[existingIndex].emptyGallonsReturned = updated[existingIndex].qty;
        updated[existingIndex].shortageResolution = undefined;
        updated[existingIndex].shortageFee = 0;
      }
      const { fee, subtotal: itemSub } = calcItemSubtotal(
        updated[existingIndex].qty,
        updated[existingIndex].unitPrice,
        updated[existingIndex].isGalonRefill,
        updated[existingIndex].emptyGallonsReturned,
        updated[existingIndex].shortageResolution
      );
      updated[existingIndex].shortageFee = fee;
      updated[existingIndex].subtotal = itemSub;
      setCart(updated);
    } else {
      const isRefill = product.category === 'Galon 19L';
      const cleanName = isRefill && !product.name.toLowerCase().includes('refill')
        ? `${product.name} (Refill)`
        : product.name;
      setCart([
        ...cart,
        {
          id: `cart-${Date.now()}-${product.id}-${activeUom}`,
          productId: product.id,
          name: cleanName,
          category: product.category,
          parentCategory: product.parentCategory,
          unit: activeUom,
          selectedUom: activeUom as any,
          uomMultiplier: isHigherUom ? higherLevel!.conversionRatio : 1,
          unitPrice: applicablePrice,
          qty: 1,
          subtotal: applicablePrice,
          batchNumber: product.batchNumber,
          expiredDate: product.expiredDate,
          isGalonRefill: isRefill,
          gallonScheme: isRefill ? 'Refill Tukar' : undefined,
          emptyGallonsReturned: isRefill ? 1 : undefined,
          shortageResolution: undefined,
          shortageFee: 0,
        },
      ]);
    }

    // Deteksi stok menipis / kritis saat item dimasukkan ke kasir
    const warn = calculateStockWarning(product);
    if (warn.status === 'critical' || warn.status === 'warning') {
      setRecentScanWarning(warn);
      setTimeout(() => {
        setRecentScanWarning((prev: StockWarningDetail | null) => (prev?.product.id === product.id ? null : prev));
      }, 7000);
    }
  };

  const handleSwitchCartItemUom = (cartId: string, newUom: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartId) return item;
        const prod = productsList.find((p) => p.id === item.productId);
        if (!prod) return item;

        const hasHigherLevel = prod.uomLevels && prod.uomLevels.length > 0;
        const higherLevel = hasHigherLevel ? prod.uomLevels![0] : null;
        const isHigher = Boolean(higherLevel && newUom === higherLevel.unit);

        let newUnitPrice = getProductUnitPriceForCustomer(prod, selectedCustomer);
        let multiplier = 1;

        if (isHigher && higherLevel) {
          multiplier = higherLevel.conversionRatio;
          if (selectedCustomer?.priceTier === 'Pangkalan' && higherLevel.pricePangkalan > 0) {
            newUnitPrice = higherLevel.pricePangkalan;
          } else if (selectedCustomer?.priceTier === 'Toko' && higherLevel.priceToko > 0) {
            newUnitPrice = higherLevel.priceToko;
          } else if (higherLevel.priceRetail > 0) {
            newUnitPrice = higherLevel.priceRetail;
          } else {
            newUnitPrice = newUnitPrice * higherLevel.conversionRatio;
          }
        }

        const { fee, subtotal: itemSub } = calcItemSubtotal(
          item.qty,
          newUnitPrice,
          item.isGalonRefill,
          item.emptyGallonsReturned,
          item.shortageResolution
        );

        return {
          ...item,
          unit: newUom,
          selectedUom: newUom as any,
          uomMultiplier: multiplier,
          unitPrice: newUnitPrice,
          subtotal: itemSub,
          shortageFee: fee,
        };
      })
    );
  };

  const handleSaveProductFromKasir = (newProduct: ProductMasterItem) => {
    if (onAddProduct) {
      onAddProduct(newProduct);
    } else {
      setProductsList((prev) => [newProduct, ...prev]);
    }
    // Automatically load newly added SKU to cart
    handleAddToCart(newProduct);
  };

  const handleBarcodeScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const qRaw = barcodeInput.trim();
    if (!qRaw) return;
    const q = qRaw.toLowerCase();
    const qClean = q.replace(/[^a-z0-9]/g, '');

    // 1. Exact match on SKU, Barcode, or Product ID
    let matched = productsList.find(
      (p) =>
        (p.sku && (p.sku.toLowerCase() === q || p.sku.toLowerCase().replace(/[^a-z0-9]/g, '') === qClean)) ||
        (p.barcode && (p.barcode.toLowerCase() === q || p.barcode.toLowerCase().replace(/[^a-z0-9]/g, '') === qClean)) ||
        p.id.toLowerCase() === q ||
        p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === qClean
    );

    // 2. Starts with SKU, Barcode, or Product ID
    if (!matched) {
      matched = productsList.find(
        (p) =>
          (p.sku && p.sku.toLowerCase().startsWith(q)) ||
          (p.barcode && p.barcode.toLowerCase().startsWith(q)) ||
          p.id.toLowerCase().startsWith(q)
      );
    }

    // 3. Name substring match
    if (!matched) {
      matched = productsList.find((p) => p.name.toLowerCase().includes(q));
    }

    // 4. Check if matched against Sirkulasi Wadah & Tabung Aset (GALLON_CIRCULATION)
    if (!matched) {
      const circMatch = GALLON_CIRCULATION.find(
        (c) =>
          (c.sku && (c.sku.toLowerCase() === q || c.sku.toLowerCase().replace(/[^a-z0-9]/g, '') === qClean)) ||
          (c.barcode && (c.barcode.toLowerCase() === q || c.barcode.toLowerCase().replace(/[^a-z0-9]/g, '') === qClean)) ||
          (c.id && c.id.toLowerCase() === q) ||
          c.category.toLowerCase().includes(q)
      );
      if (circMatch) {
        matched = {
          id: circMatch.sku || circMatch.id || `AST-${Date.now()}`,
          sku: circMatch.sku || circMatch.id,
          barcode: circMatch.barcode || circMatch.sku || circMatch.id,
          name: circMatch.category || `${circMatch.brand || 'Aset'} (${circMatch.unitName || 'Tabung'})`,
          category: circMatch.assetType === 'TABUNG_GAS' ? 'Tabung Gas' : 'Tabung Kosong',
          parentCategory: 'AIR_MINUM',
          brand: circMatch.brand || 'Depo Master',
          unit: circMatch.unitName || 'Tabung',
          stock: (circMatch.empty || 0) + (circMatch.filled || 0),
          minStock: 20,
          reorderPoint: 50,
          hpp: 38000,
          priceRetail: 50000,
          priceToko: 47000,
          pricePangkalan: 45000,
          pricingScheme: 'tier',
          supplier: 'Deposit Pelanggan & Pabrik',
        };
      }
    }

    // 5. Fallback ke Offline Master Catalog Cache jika belum termuat
    if (!matched) {
      const cached = getCachedMasterData();
      const cachedItem = cached.products.find(
        (cp) =>
          (cp.sku && (cp.sku.toLowerCase() === q || cp.sku.toLowerCase().replace(/[^a-z0-9]/g, '') === qClean)) ||
          (cp.barcode && (cp.barcode.toLowerCase() === q || cp.barcode.toLowerCase().replace(/[^a-z0-9]/g, '') === qClean)) ||
          cp.id.toLowerCase() === q ||
          cp.name.toLowerCase().includes(q)
      );
      if (cachedItem) {
        matched = {
          id: cachedItem.id,
          sku: cachedItem.sku,
          barcode: cachedItem.barcode,
          name: cachedItem.name,
          category: cachedItem.category,
          brand: cachedItem.brand || '',
          unit: cachedItem.unit,
          stock: cachedItem.stock,
          minStock: cachedItem.minStock || 5,
          reorderPoint: 10,
          hpp: cachedItem.hpp || 0,
          priceRetail: cachedItem.priceRetail,
          pricePangkalan: cachedItem.pricePangkalan,
          priceToko: cachedItem.priceToko,
          flatPrice: cachedItem.flatPrice,
          pricingScheme: cachedItem.pricingScheme || 'tier',
          supplier: 'Depo Master',
        };
      }
    }

    if (matched) {
      const targetUom = scanUomMode === 'karton'
        ? (matched.uomLevels && matched.uomLevels.length > 0 ? matched.uomLevels[0].unit : 'Dus')
        : (matched.selectedUom || matched.unit);
      handleAddToCart(matched, targetUom);
      const warn = calculateStockWarning(matched);
      setBarcodeInput('');
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 50);
      if (warn.status === 'critical' || warn.status === 'warning') {
        setRecentScanWarning(warn);
        setTimeout(() => {
          setRecentScanWarning((prev: StockWarningDetail | null) => (prev?.product.id === matched!.id ? null : prev));
        }, 7000);
      }
      if (warn.status === 'critical') {
        setBarcodeFeedback({
          text: `🚨 ${matched.name} ditambahkan! PERINGATAN: STOK KRITIS (Sisa: ${warn.currentStock} ${matched.unit} • <=10%)!`,
          type: 'error',
        });
      } else if (warn.status === 'warning') {
        setBarcodeFeedback({
          text: `⚠️ ${matched.name} ditambahkan! STOK MENIPIS (<30%)! Sisa: ${warn.currentStock} ${matched.unit}`,
          type: 'error',
        });
      } else {
        setBarcodeFeedback({
          text: `✅ ${matched.name} berhasil ditambahkan ke keranjang`,
          type: 'success',
        });
      }
      setTimeout(() => setBarcodeFeedback(null), 3500);
    } else {
      setBarcodeFeedback({
        text: `⚠️ Kode SKU / Barcode "${barcodeInput}" tidak ditemukan`,
        type: 'error',
      });
      setTimeout(() => setBarcodeFeedback(null), 3000);
    }
  };

  const handleUpdateQty = (cartId: string, delta: number) => {
    // Cek jika penambahan kuantitas mendekati atau melebihi sisa stok fisik
    const targetItem = cart.find((i) => i.id === cartId);
    if (targetItem && delta > 0) {
      const prod = productsList.find(
        (p) => p.id === targetItem.productId || p.name.toLowerCase() === targetItem.name.toLowerCase()
      );
      if (prod && targetItem.qty + delta > prod.stock) {
        const warningMsg = `⚠️ Peringatan: Qty pesanan (${targetItem.qty + delta}) melebihi sisa stok fisik depo (${prod.stock} ${prod.unit})!`;
        setGasSyncToast(warningMsg);
        if (onShowToast) onShowToast(warningMsg);
        setTimeout(() => setGasSyncToast(null), 3500);
      }
    }

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartId) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            const newReturned = item.emptyGallonsReturned !== undefined && item.gallonScheme === 'Refill Tukar'
              ? Math.min(item.emptyGallonsReturned, newQty)
              : item.emptyGallonsReturned;

            const shortage = item.isGalonRefill && newReturned !== undefined
              ? Math.max(0, newQty - newReturned)
              : 0;
            const res = shortage === 0 ? undefined : item.shortageResolution;

            const { fee, subtotal: itemSub } = calcItemSubtotal(
              newQty,
              item.unitPrice,
              item.isGalonRefill,
              newReturned,
              res
            );

            return {
              ...item,
              qty: newQty,
              emptyGallonsReturned: newReturned,
              shortageResolution: res,
              shortageFee: fee,
              subtotal: itemSub,
            };
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[]
    );
  };

  const handleUpdateGallonScheme = (
    cartId: string,
    scheme: 'Refill Tukar' | 'Beli Putus (+Rp 45.000)' | 'Pinjam Deposit (+Rp 35.000)'
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartId) return item;
        const baseProduct = MASTER_PRODUCTS.find((p) => p.id === item.productId);
        const basePrice = baseProduct ? baseProduct.priceRetail : 21000;
        let adjustedPrice = basePrice;
        let returned = item.emptyGallonsReturned;

        if (scheme === 'Beli Putus (+Rp 45.000)') {
          adjustedPrice = basePrice + 45000;
          returned = 0;
        } else if (scheme === 'Pinjam Deposit (+Rp 35.000)') {
          adjustedPrice = basePrice + 35000;
          returned = 0;
        } else {
          adjustedPrice = basePrice;
          returned = item.qty;
        }

        const { fee, subtotal: itemSub } = calcItemSubtotal(
          item.qty,
          adjustedPrice,
          item.isGalonRefill,
          returned,
          undefined
        );

        return {
          ...item,
          gallonScheme: scheme,
          unitPrice: adjustedPrice,
          emptyGallonsReturned: returned,
          shortageResolution: undefined,
          shortageFee: fee,
          subtotal: itemSub,
        };
      })
    );
  };

  const handleUpdateEmptyGallons = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartId) return item;
        const current = item.emptyGallonsReturned !== undefined ? item.emptyGallonsReturned : item.qty;
        const next = Math.max(0, Math.min(item.qty, current + delta));
        const shortage = Math.max(0, item.qty - next);

        let res = item.shortageResolution;
        if (shortage === 0) {
          res = undefined;
        }

        const { fee, subtotal: itemSub } = calcItemSubtotal(
          item.qty,
          item.unitPrice,
          item.isGalonRefill,
          next,
          res
        );

        return {
          ...item,
          emptyGallonsReturned: next,
          shortageResolution: res,
          shortageFee: fee,
          subtotal: itemSub,
        };
      })
    );
  };

  const handleSetShortageResolution = (
    cartId: string,
    resolution: 'beli' | 'pinjam' | 'hutang'
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartId) return item;
        const returned = item.emptyGallonsReturned ?? item.qty;
        const { fee, subtotal: itemSub } = calcItemSubtotal(
          item.qty,
          item.unitPrice,
          item.isGalonRefill,
          returned,
          resolution
        );
        return {
          ...item,
          shortageResolution: resolution,
          shortageFee: fee,
          subtotal: itemSub,
        };
      })
    );
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(cart.filter((item) => item.id !== cartId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountValue(0);
  };

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount);
  };

  const handleAddQuickCash = (add: number) => {
    setCashReceived((prev) => prev + add);
  };

  /**
   * Fungsi Pengiriman Payload Transaksi Kasir POS ke Google Apps Script Webhook
   * Menggunakan syncPosTransactionToGas dari cloudSync.ts
   */
  const syncOrderToGAS = async (
    orderId: string,
    customer: string,
    items: any[],
    total: number,
    paymentMethod: string
  ): Promise<boolean> => {
    const rincianFormatted = Array.isArray(items) && items.length > 0
      ? items.map((i: any) => `${i.qty || i.quantity || 1}x ${i.name || i.namaBarang || 'Barang'}`).join(', ')
      : 'Transaksi Depo';
    const tanggalFormatted = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';

    const res = await syncPosTransactionToGas({
      orderId,
      noFaktur: orderId,
      customerName: customer,
      pelanggan: customer,
      items,
      rincian: rincianFormatted,
      totalAmount: total,
      total,
      grandTotal: total,
      tanggal: tanggalFormatted,
      paymentMethod,
      cashier: 'Admin Kasir',
      supir: 'Kasir Depo',
    });

    setGasSyncToast('🟢 Transaksi berhasil disinkronkan ke Google Sheets!');
    if (onShowToast) {
      onShowToast('🟢 Transaksi berhasil disinkronkan ke Google Sheets!');
    }
    setTimeout(() => {
      setGasSyncToast(null);
    }, 4000);

    return res.success;
  };

  /**
   * Sinkronkan Seluruh 21+ Riwayat Transaksi Kasir POS ke Google Sheets secara berurutan
   */
  const handleSyncAllHistoryToGas = async () => {
    if (kasirTransactions.length === 0) {
      alert('Tidak ada riwayat transaksi kasir yang dapat disinkronkan.');
      return;
    }

    if (isSyncingAllHistory) return;

    const total = kasirTransactions.length;
    setIsSyncingAllHistory(true);
    setSyncProgress({ current: 0, total, currentId: '' });

    let successCount = 0;
    // Kirim seluruh transaksi kasir yang ada di riwayat lokal saat ini ke Google Sheets secara berurutan
    for (let i = 0; i < kasirTransactions.length; i++) {
      const tx = kasirTransactions[i];
      setSyncProgress({ current: i + 1, total, currentId: tx.id });
      try {
        await syncPosTransactionToGas(tx);
        successCount++;
        // Jeda 200ms antar pengiriman agar antrean di Apps Script tercatat rapi
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Gagal sinkronisasi transaksi ${tx.id} ke GAS:`, err);
      }
    }

    setIsSyncingAllHistory(false);
    const msg = `🟢 Berhasil menyinkronkan seluruh ${successCount} transaksi kasir ke Google Sheets!`;
    setGasSyncToast(msg);
    if (onShowToast) {
      onShowToast(msg);
    }
    setTimeout(() => {
      setGasSyncToast(null);
    }, 5000);
  };

  const handleCompleteTransaction = async () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }
    if (paymentMethod === 'Tunai' && !isCashSufficient) {
      alert('Nominal uang tunai diterima kurang dari total belanja!');
      return;
    }
    if (paymentMethod === 'Bayar Tempo' && !selectedCustomer) {
      alert('Metode pembayaran "Bayar Tempo / Bon Toko" hanya aktif jika Pelanggan Terdaftar dipilih! Silakan pilih pelanggan terlebih dahulu.');
      return;
    }

    const trxId = getNextReceiptNumber();

    // 1. Jika Bayar Tempo: Buat dan Sinkronkan Piutang Baru ke PiutangView.tsx (Default Jatuh Tempo 7 Hari)
    let newReceivable: ReceivableItem | undefined = undefined;
    if (paymentMethod === 'Bayar Tempo' && selectedCustomer) {
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 7);
      const dueDateStr = `${dueDateObj.getDate()} ${dueDateObj.toLocaleDateString('id-ID', { month: 'short' })} ${dueDateObj.getFullYear()}`;

      const totalGallonsShortage = cart.reduce((sum, item) => {
        if (item.isGalonRefill && item.emptyGallonsReturned !== undefined && item.qty > item.emptyGallonsReturned && item.shortageResolution !== 'beli') {
          return sum + (item.qty - item.emptyGallonsReturned);
        }
        return sum;
      }, 0);

      newReceivable = {
        id: getNextPiutangNumber(),
        orderId: getNextOrderNumber(),
        customerName: selectedCustomer.name,
        address: deliveryAddress || selectedCustomer.address || 'Alamat Toko Mitra',
        phone: selectedCustomer.phone || customerPhone || '0812-0000-0000',
        amount: grandTotal,
        gallonsLoaned: totalGallonsShortage,
        dueDate: dueDateStr,
        transactionDate: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        status: 'BELUM LUNAS',
      };

      if (!onCompleteKasirTransaction && onAddReceivable) {
        onAddReceivable(newReceivable);
      }
    }

    // 2. Jika Kirim via Armada: Otomatis kirim ke antrean tugas terbuka 'Portal Driver' dengan status 'MENUNGGU_DRIVER' (Open Dispatch)
    let newOrder: OrderItem | undefined = undefined;
    if (deliveryType === 'armada') {
      const finalAddress = deliveryAddress || selectedCustomer?.address || 'Kirim Armada (Open Dispatch)';
      const finalLandmark = landmarkNote || selectedCustomer?.landmarkNote || selectedCustomer?.landmark || '';
      const finalCoords = coordinates || selectedCustomer?.coordinates || undefined;
      const finalMapsUrl = mapsUrl || selectedCustomer?.mapsUrl || (finalCoords ? `https://maps.google.com/?q=${finalCoords.lat},${finalCoords.lng}` : undefined);

      newOrder = {
        id: getNextOrderNumber(),
        customerName: selectedCustomer ? selectedCustomer.name : (customerName.trim() || 'Pelanggan Langsung (Walk-In)'),
        customerType: selectedCustomer?.type === 'B2B'
          ? (selectedCustomer.b2bCategory === 'Agen / Pangkalan' ? 'Agen / Pangkalan' : 'Toko Kelontong')
          : 'Rumah Tangga',
        gallonScheme: cart.some(c => c.shortageResolution === 'beli' || c.gallonScheme === 'Beli Putus (+Rp 45.000)')
          ? 'Beli Galon Baru'
          : cart.some(c => c.shortageResolution === 'pinjam' || c.gallonScheme === 'Pinjam Deposit (+Rp 35.000)')
          ? 'Pinjam Galon Depo'
          : 'Tukar Galon',
        priceTier: selectedCustomer?.priceTier || 'Eceran',
        residentialDetail: finalAddress,
        phone: customerPhone || selectedCustomer?.phone || '0812-0000-0000',
        deliveryAddress: finalAddress,
        landmarkNote: finalLandmark,
        mapsUrl: finalMapsUrl,
        coordinates: finalCoords,
        assignedDriverId: null,
        items: cart.map(i => {
          const shortageTxt = i.shortageResolution === 'beli' ? ' (+Beli Tabung)' : i.shortageResolution === 'pinjam' ? ' (+Pinjam Tabung)' : '';
          return `${i.qty} ${i.name}${shortageTxt}`;
        }).join(', '),
        totalGalon: cart.filter(i => i.isGalonRefill).reduce((sum, i) => sum + i.qty, 0) || cart.reduce((sum, i) => sum + i.qty, 0),
        emptyGallonsReturned: cart.reduce((sum, i) => sum + (i.emptyGallonsReturned !== undefined ? i.emptyGallonsReturned : i.qty), 0),
        emptyGallonDebt: cart.reduce((sum, i) => sum + (i.isGalonRefill && i.emptyGallonsReturned !== undefined && i.shortageResolution !== 'beli' ? Math.max(0, i.qty - i.emptyGallonsReturned) : 0), 0),
        totalAmount: grandTotal,
        paymentStatus: paymentMethod === 'Bayar Tempo' ? 'Tempo / Hutang' : 'Lunas',
        deliveryStatus: 'MENUNGGU_DRIVER',
        status: 'MENUNGGU_DRIVER',
        driver: 'Belum Diambil (Antrean Terbuka)',
        time: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB`,
        hasCreditWarning: paymentMethod === 'Bayar Tempo',
        creditWarningNote: paymentMethod === 'Bayar Tempo' ? 'Nota Tempo Baru Toko (Jatuh tempo 7 hari)' : undefined,
      };

      if (!onCompleteKasirTransaction && onAddOrder) {
        onAddOrder(newOrder);
      }
    }

    if (selectedCustomer && emptyReturns.galon19L > 0) {
      selectedCustomer.emptyGallonDebt = Math.max(0, (selectedCustomer.emptyGallonDebt || 0) - emptyReturns.galon19L);
    }

    const finalCustName = selectedCustomer ? selectedCustomer.name : (customerName.trim() || 'Pelanggan Langsung (Walk-In)');
    const finalCustType = selectedCustomer?.type === 'B2B' ? (selectedCustomer.b2bCategory || 'Toko Mitra') : 'Pelanggan POS';
    const finalPhone = selectedCustomer?.phone || customerPhone.trim() || undefined;
    const finalAddress = deliveryAddress.trim() || selectedCustomer?.address || undefined;
    const finalCashVal = paymentMethod === 'Tunai' ? cashReceived : grandTotal;
    const finalChangeVal = paymentMethod === 'Tunai' ? Math.max(0, changeAmount) : 0;
    const finalDiscountLabel = calculatedDiscount > 0 ? (discountMode === 'percent' ? `${discountValue}%` : 'Nominal') : undefined;

    // Buat data struk & transaksi lengkap baru
    const newTransaction: KasirTransaction = {
      id: trxId,
      customerName: finalCustName,
      customerType: finalCustType,
      customerPhone: finalPhone,
      deliveryAddress: finalAddress,
      items: cart.map(i => `${i.qty} ${i.name}`).join(', '),
      totalAmount: grandTotal,
      subtotal,
      discountAmount: calculatedDiscount,
      discountLabel: finalDiscountLabel,
      ppnAmount: isPpnActive ? ppnAmount : 0,
      cashReceived: finalCashVal,
      changeAmount: finalChangeVal,
      paymentMethod,
      paymentStatus: paymentMethod === 'Bayar Tempo' ? 'Tempo / Hutang' : 'Lunas',
      time: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB`,
      timestamp: Date.now(),
      deliveryType: deliveryType === 'armada' ? 'armada' : 'pickup',
      cartItems: [...cart],
    };

    // 1. Tampilkan indikator loading putar "Menyimpan ke Google Sheets..."
    setIsSavingToSheets(true);

    const isCurrentlyOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
    let didSyncToCloud = false;

    // 2. Jika online, coba kirim ke GAS dengan safety timeout agar kasir tidak terblokir
    if (isCurrentlyOnline) {
      try {
        const webhookUrl = getGasWebhookUrl();
        const rincianFormatted =
          cart.map((i) => `${i.qty || (i as any).quantity || 1}x ${i.name || (i as any).namaBarang || 'Barang'}`).join(', ') || 'Transaksi Depo';
        const tanggalFormatted = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
        const totalNilai = grandTotal || 0;

        const gasPayload = {
          action: 'create_order',
          noFaktur: trxId,
          tanggal: tanggalFormatted,
          pelanggan: finalCustName || 'Pelanggan Kasir POS',
          supir: 'Kasir Depo',
          rincian: rincianFormatted,
          total: totalNilai,
          statusKirim: 'Selesai',
          statusBayar: paymentMethod === 'Bayar Tempo' ? 'Belum Lunas' : 'Lunas',
          metodeBayar: (paymentMethod || 'TUNAI').toUpperCase(),
        };

        if (webhookUrl) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 detik timeout
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(gasPayload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        }

        // Sinkronkan juga via cloudSync helper untuk pembaruan timestamp last sync
        await syncPosTransactionToGas({
          ...newTransaction,
          noFaktur: trxId,
          pelanggan: finalCustName,
          supir: 'Kasir Depo',
          rincian: rincianFormatted,
          items: cart,
          total: totalNilai,
          grandTotal: totalNilai,
          totalAmount: totalNilai,
          tanggal: tanggalFormatted,
          statusKirim: 'Selesai',
          statusBayar: paymentMethod === 'Bayar Tempo' ? 'Belum Lunas' : 'Lunas',
          metodeBayar: (paymentMethod || 'TUNAI').toUpperCase(),
        });

        didSyncToCloud = true;
        setGasSyncToast('🟢 Transaksi berhasil disinkronkan ke Google Sheets!');
        if (onShowToast) {
          onShowToast('🟢 Transaksi berhasil disinkronkan ke Google Sheets!');
        }
        setTimeout(() => {
          setGasSyncToast(null);
        }, 4000);
      } catch (err) {
        console.warn('[Kasir POS] Sinkronisasi cloud tertunda/gagal. Mengalihkan ke Antrean Offline:', err);
        didSyncToCloud = false;
      }
    }

    // 2b. Jika offline atau request cloud gagal: Simpan ke antrean offline tanpa blokir kasir
    if (!didSyncToCloud) {
      enqueueOfflineTransaction({
        id: trxId,
        receiptNo: trxId,
        customer: {
          id: selectedCustomer?.id,
          name: finalCustName,
          type: finalCustType,
          phone: finalPhone,
          memberCardId: selectedCustomer?.barcode || selectedCustomer?.memberCode,
          address: finalAddress,
        },
        items: cart.map((it) => ({
          productId: it.productId,
          name: it.name,
          barcode: it.productId,
          unit: it.unit,
          qty: it.qty,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
          isGalonRefill: it.isGalonRefill,
          emptyGallonsReturned: it.emptyGallonsReturned,
        })),
        total: grandTotal,
        subtotal,
        discountAmount: calculatedDiscount,
        ppnAmount: isPpnActive ? ppnAmount : 0,
        cashReceived: finalCashVal,
        changeAmount: finalChangeVal,
        paymentMethod,
        timestamp: Date.now(),
        time: newTransaction.time,
        deliveryType: newTransaction.deliveryType,
        syncStatus: 'pending',
      });

      // Update counter antrean di tampilan kasir
      setPendingQueueCount(getPendingQueueCount());

      const offlineMsg = '🔴 Mode Offline: Transaksi tersimpan di antrean lokal & stok terpotong!';
      setGasSyncToast(offlineMsg);
      if (onShowToast) {
        onShowToast(offlineMsg);
      }
      setTimeout(() => {
        setGasSyncToast(null);
      }, 4500);
    }

    // Langsung potong stok produk pada tampilan kasir lokal secara instan
    setProductsList((prev) =>
      prev.map((prod) => {
        const cartItem = cart.find(
          (c) => c.productId === prod.id || c.name.trim().toLowerCase() === prod.name.trim().toLowerCase()
        );
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.qty),
          };
        }
        return prod;
      })
    );

    setIsSavingToSheets(false);
    // Tampilkan struk pembayaran/thermal receipt (58mm/80mm) tetap berjalan normal
    setShowThermalReceipt(true);

    // 3. Simpan ke riwayat transaksi lokal SETELAH sinkronisasi ke GAS selesai ditunggu
    if (onCompleteKasirTransaction) {
      onCompleteKasirTransaction({
        trxId,
        customerName: finalCustName,
        customerType: finalCustType,
        customerPhone: finalPhone,
        deliveryAddress: finalAddress,
        cart: [...cart],
        paymentMethod,
        grandTotal,
        subtotal,
        discountAmount: calculatedDiscount,
        discountLabel: finalDiscountLabel,
        ppnAmount: isPpnActive ? ppnAmount : 0,
        cashReceived: finalCashVal,
        changeAmount: finalChangeVal,
        deliveryType: deliveryType === 'armada' ? 'armada' : 'pickup',
        newOrder,
        newReceivable,
      });
    }

    setViewingReceiptTx(newTransaction);
    setTransactionCompleted(trxId);

    if (onCompleteTransaction) {
      onCompleteTransaction(newTransaction);
    }

    // 1. Otomatis kosongkan daftar keranjang belanja (tabel kasir POS kembali bersih/kosong).
    setCart([]);
    setBarcodeInput('');
    setBarcodeFeedback(null);
    setCatalogSearch('');

    // 2. Reset input uang bayar kembali ke 0 / kosong, serta reset diskon dan PPN.
    setCashReceived(0);
    setDiscountValue(0);
    setDiscountMode('rp');
    setIsPpnActive(false);
    setPpnMode('11');
    setCustomPpnRate(10);

    // 3. Kosongkan kembali pilihan/pencarian pelanggan ke default (Walk-In Customer / Ambil Depo).
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setLandmarkNote('');
    setMapsUrl('');
    setCoordinates(null);
    setIsDropdownOpen(false);
    setDeliveryType('depo');
    setPaymentMethod('Tunai');
    setLoadedOrderId(null);
    if (onClearPrefill) onClearPrefill();
  };

  const handleSendWhatsAppReceipt = () => {
    const tx = viewingReceiptTx;
    const rawPhone = tx?.customerPhone || customerPhone || selectedCustomer?.phone || '0812-9988-7711';
    const phone = rawPhone.replace(/\D/g, '') || '6281234567890';
    const targetPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const trxId = tx?.id || transactionCompleted || `STR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const itemsSummary = tx
      ? (tx.cartItems && tx.cartItems.length > 0
          ? tx.cartItems.map((item) => {
              const shortageDetail = item.shortageResolution === 'beli'
                ? ` (+Beli ${item.qty - (item.emptyGallonsReturned ?? 0)} Tabung Baru @50rb = +Rp ${(item.shortageFee || 0).toLocaleString('id-ID')})`
                : item.shortageResolution === 'pinjam'
                ? ` (+Jaminan Pinjam ${item.qty - (item.emptyGallonsReturned ?? 0)} Tabung @35rb = +Rp ${(item.shortageFee || 0).toLocaleString('id-ID')})`
                : '';
              return `• ${item.name} (${item.qty}x @Rp ${item.unitPrice.toLocaleString('id-ID')}) = Rp ${item.subtotal.toLocaleString('id-ID')}${shortageDetail}`;
            }).join('%0A')
          : `• ${tx.items}`)
      : cart
          .map((item) => {
            const schemeInfo = item.gallonScheme ? ` [${item.gallonScheme}]` : '';
            const shortageDetail = item.shortageResolution === 'beli'
              ? ` (+Beli ${item.qty - (item.emptyGallonsReturned ?? 0)} Tabung Baru @50rb = +Rp ${(item.shortageFee || 0).toLocaleString('id-ID')})`
              : item.shortageResolution === 'pinjam'
              ? ` (+Jaminan Pinjam ${item.qty - (item.emptyGallonsReturned ?? 0)} Tabung @35rb = +Rp ${(item.shortageFee || 0).toLocaleString('id-ID')})`
              : item.isGalonRefill && item.emptyGallonsReturned !== undefined && item.qty > item.emptyGallonsReturned
              ? ` (Hutang Tabung: ${item.qty - item.emptyGallonsReturned} bh)`
              : '';
            return `• ${item.name}${schemeInfo} (${item.qty}x @Rp ${item.unitPrice.toLocaleString('id-ID')}) = Rp ${item.subtotal.toLocaleString('id-ID')}${shortageDetail}`;
          })
          .join('%0A');

    const isArmada = tx ? tx.deliveryType === 'armada' : deliveryType === 'armada';
    const deliveryInfo = isArmada
      ? `Tipe: *Kirim Armada (Open Dispatch)*%0AAlamat: ${deliveryAddress || selectedCustomer?.address || '-'}${landmarkNote ? ` (Patokan: ${landmarkNote})` : ''}${mapsUrl ? `%0ALokasi: ${mapsUrl}` : ''}`
      : `Tipe: *Bawa Langsung / Ambil di Depo*`;

    const payMethod = tx ? tx.paymentMethod : paymentMethod;
    const payStatus = tx ? tx.paymentStatus : (paymentMethod === 'Bayar Tempo' ? 'Tempo / Hutang' : 'Lunas');
    const totAmount = tx ? tx.totalAmount : grandTotal;

    const paymentInfo = payMethod === 'Bayar Tempo'
      ? `Metode: *Bayar Tempo / Bon Toko*%0AJatuh Tempo: *7 Hari (${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')})*%0AStatus: *Piutang Toko Tercatat di Admin*`
      : payMethod === 'Tunai'
      ? `Metode: *Tunai*%0ABayar: Rp ${(tx ? tx.totalAmount : (cashReceived || grandTotal)).toLocaleString('id-ID')}%0AStatus: *Lunas*`
      : `Metode: *${payMethod}*`;

    const custName = tx ? tx.customerName : (customerName || selectedCustomer?.name || 'Pelanggan Langsung (Walk-In)');

    const message = `*STRUK RESMI DEPO AIR MINERAL*%0A` +
      `No. Transaksi: *${trxId}*%0A` +
      `Tanggal: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB%0A` +
      `Pelanggan: ${custName}%0A` +
      `${deliveryInfo}%0A` +
      `----------------------------------------%0A` +
      `${itemsSummary}%0A` +
      `----------------------------------------%0A` +
      `*TOTAL TAGIHAN: Rp ${totAmount.toLocaleString('id-ID')}*%0A` +
      `${paymentInfo}%0A` +
      `----------------------------------------%0A` +
      `Terima kasih telah berlangganan di JacS DepoHub!%0ALayanan Antar & Info: 0812-9988-7711`;

    window.open(`https://wa.me/${targetPhone}?text=${message}`, '_blank');
  };

  const handleValidateDriverSetoran = (driverId: string) => {
    setDriverSetorans((prev) =>
      prev.map((d) =>
        d.driverId === driverId
          ? { ...d, status: 'Lengkap', receivedCash: d.targetCash, handoverTime: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB` }
          : d
      )
    );
  };

  const handlePayInvoice = (invoiceId: string) => {
    setReceivables((prev) => prev.filter((r) => r.id !== invoiceId));
    alert(`Faktur piutang ${invoiceId} berhasil dilunasi & kas masuk tercatat di kasir!`);
  };

  const handleCheckout = handleCompleteTransaction;

  useEffect(() => {
    (window as any).handleCheckout = handleCompleteTransaction;
    (window as any).onCompleteTransaction = handleCompleteTransaction;
    (window as any).syncOrderToGAS = syncOrderToGAS;
    (window as any).syncPosTransactionToGas = syncPosTransactionToGas;
    (window as any).handleSyncAllHistoryToGas = handleSyncAllHistoryToGas;
    return () => {
      delete (window as any).handleCheckout;
      delete (window as any).onCompleteTransaction;
      delete (window as any).syncOrderToGAS;
      delete (window as any).syncPosTransactionToGas;
      delete (window as any).handleSyncAllHistoryToGas;
    };
  });

  return (
    <div className="h-full flex flex-col gap-1.5 overflow-hidden [body.light-theme_&]:text-slate-800 relative">
      {/* Indikator Loading Putar: Menyimpan ke Google Sheets... */}
      {isSavingToSheets && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-150">
          <div className="p-6 rounded-2xl bg-slate-900 border-2 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.4)] flex flex-col items-center gap-3.5 text-center max-w-sm mx-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fa-solid fa-cloud-arrow-up text-cyan-400 text-lg"></i>
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">Menyimpan ke Google Sheets...</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Mengirimkan data transaksi via Form Data (URLSearchParams)
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Sinkronisasi Otomatis Google Apps Script</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi Sinkronisasi Google Sheets */}
      {gasSyncToast && (
        <div className="fixed top-5 right-5 z-[99999] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-400 text-xs font-bold text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{gasSyncToast}</span>
        </div>
      )}

      {/* Top Banner & Tab Navigation */}
      <div className="glass-panel p-2 px-3.5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm border-t-[3px] border-t-cyan-500 [body.light-theme_&]:border-t-cyan-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:border-cyan-600 [body.light-theme_&]:text-cyan-800 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(6,182,212,0.35)]">
            <i className="fa-solid fa-cash-register"></i>
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5 leading-none">
              Kasir & Admin
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-800 [body.light-theme_&]:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.35)]">
                PRO POS
              </span>

              {/* Dynamic Online / Offline Status Badge */}
              {isOnline && pendingQueueCount === 0 ? (
                <span
                  id="badge-pos-online-status"
                  className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 flex items-center gap-1 shadow-sm"
                  title="Koneksi internet aktif & seluruh transaksi tersinkron sempurna"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>🟢 Online (Tersinkron)</span>
                </span>
              ) : (
                <button
                  type="button"
                  id="badge-pos-offline-status"
                  onClick={triggerAutoSyncQueue}
                  disabled={isSyncingQueue}
                  className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.35)] cursor-pointer hover:bg-amber-500/30 transition-all active:scale-95"
                  title={
                    !isOnline
                      ? `Perangkat terputus dari internet. Transaksi masuk ke antrean offline (${pendingQueueCount} tertunda).`
                      : `Terdapat ${pendingQueueCount} transaksi antrean cloud. Klik untuk sinkronkan sekarang!`
                  }
                >
                  {isSyncingQueue ? (
                    <>
                      <i className="fa-solid fa-rotate text-[10px] animate-spin text-amber-300"></i>
                      <span>🟠 Menyinkronkan ({pendingQueueCount})...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>
                        {!isOnline ? '🔴 Mode Offline' : '🟠 Antrean Cloud'} ({pendingQueueCount} Transaksi Tertunda)
                      </span>
                    </>
                  )}
                </button>
              )}
            </h2>
          </div>
        </div>

        {/* Tab Buttons & B2C Order Pull */}
        <div className="flex items-center gap-1.5">
          {/* Badge Notifikasi: [ 🔔 Pengajuan Toko Baru (X) ] */}
          <button
            onClick={() => setShowStoreSubmissionsModal(true)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border ${
              pendingSubmissionsCount > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-400 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.35)] [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-950 [body.light-theme_&]:border-amber-400'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:bg-white [body.light-theme_&]:text-slate-700 [body.light-theme_&]:hover:bg-slate-50'
            }`}
            title="Tinjau dan verifikasi pengajuan pendaftaran toko baru dari supir lapangan"
          >
            <span>🔔</span>
            <span>Pengajuan Toko Baru ({pendingSubmissionsCount})</span>
            {pendingSubmissionsCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {/* Badge Notifikasi: [ ⚡ Approval Order Spot (X) ] */}
          <button
            onClick={() => {
              setPreselectedSpotOrderId(null);
              setShowSpotApprovalModal(true);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border ${
              pendingSpotOrdersCount > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-400 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-950 [body.light-theme_&]:border-amber-400'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:bg-white [body.light-theme_&]:text-slate-700 [body.light-theme_&]:hover:bg-slate-50'
            }`}
            title="Tinjau dan verifikasi pesanan spot dari supir lapangan (validasi ketersediaan muatan armada supir)"
          >
            <span>⚡</span>
            <span>Approval Order Spot ({pendingSpotOrdersCount})</span>
            {pendingSpotOrdersCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {/* Tarik Order B2C Button */}
          <button
            onClick={() => setShowB2cPullModal(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Tarik pesanan eceran warga B2C yang baru diinput ke kasir"
          >
            <i className="fa-solid fa-cloud-arrow-down text-slate-950 text-xs"></i>
            <span>Tarik Pesanan B2C</span>
            {orders.filter((o) => o.customerType === 'Rumah Tangga').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-950 text-emerald-400 font-mono font-bold">
                {orders.filter((o) => o.customerType === 'Rumah Tangga').length}
              </span>
            )}
          </button>

          {onLockSession && (
            <button
              type="button"
              onClick={onLockSession}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
              title="Kunci sesi Kasir & Admin"
            >
              <i className="fa-solid fa-lock text-xs"></i>
              <span className="hidden sm:inline">Kunci Sesi</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-900/90 [body.light-theme_&]:bg-slate-100 p-0.5 rounded-lg border border-slate-800 [body.light-theme_&]:border-slate-300">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pos');
                setIsCatalogModalOpen(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pos' && !isCatalogModalOpen
                  ? 'bg-cyan-600 text-white shadow-[0_0_14px_rgba(6,182,212,0.5)] [body.light-theme_&]:bg-cyan-700 [body.light-theme_&]:text-white font-black'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-white [body.light-theme_&]:hover:text-slate-950'
              }`}
            >
              <i className="fa-solid fa-table-list text-xs"></i>
              <span>📋 Tabel Kasir POS</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('pos');
                setIsCatalogModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isCatalogModalOpen
                  ? 'bg-purple-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.5)] font-black'
                  : 'text-purple-400 [body.light-theme_&]:text-purple-700 hover:text-purple-300 [body.light-theme_&]:hover:text-purple-900'
              }`}
              title="Buka modal katalog produk eceran / walk-in"
            >
              <i className="fa-solid fa-boxes-stacked text-xs"></i>
              <span>📦 Buka Katalog Cepat</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/25 [body.light-theme_&]:bg-purple-100 text-purple-300 [body.light-theme_&]:text-purple-900 font-bold border border-purple-400/40">
                {productsList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('riwayat');
                setIsCatalogModalOpen(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'riwayat'
                  ? 'bg-emerald-600 text-white shadow-[0_0_14px_rgba(16,185,129,0.5)] [body.light-theme_&]:bg-emerald-700 [body.light-theme_&]:text-white font-black'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-white [body.light-theme_&]:hover:text-slate-950'
              }`}
            >
              <i className="fa-solid fa-receipt text-xs"></i>
              <span>📜 Riwayat Transaksi</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 [body.light-theme_&]:bg-white text-emerald-400 [body.light-theme_&]:text-emerald-700 font-bold border border-slate-700 [body.light-theme_&]:border-slate-300">
                {kasirTransactions.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('setoran');
                setIsCatalogModalOpen(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'setoran'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)] font-black'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-white [body.light-theme_&]:hover:text-slate-950'
              }`}
            >
              <i className="fa-solid fa-hand-holding-dollar text-[10px]"></i>
              <span>Pelunasan & Setoran</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 [body.light-theme_&]:bg-white text-amber-400 [body.light-theme_&]:text-amber-800 font-bold border border-slate-700 [body.light-theme_&]:border-slate-300">
                {driverSetorans.filter((d) => d.status === 'Selisih').length + receivables.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner when B2C Order is Loaded */}
      {loadedOrderId && (
        <div className="p-1.5 px-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300 shrink-0">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
            <span className="font-extrabold">
              Pesanan #{loadedOrderId} ({customerName}) dimuat ke Kasir POS.
            </span>
            <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">
              Lakukan pembayaran tunai / QRIS dan cetak struk thermal kasir.
            </span>
          </div>
          <button
            onClick={() => {
              setLoadedOrderId(null);
              if (onClearPrefill) onClearPrefill();
            }}
            className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 cursor-pointer"
          >
            Selesai / Lepas
          </button>
        </div>
      )}

      {/* TAB 1: KASIR POS LANGSUNG - FULL WIDTH DEDICATED POS REGISTER */}
      {activeTab === 'pos' && (
        <div className="flex-1 min-h-0 w-full flex flex-col justify-between rounded-2xl p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-cyan-500/60 shadow-md dark:shadow-[0_0_15px_rgba(6,182,212,0.2)] [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 transition-all overflow-hidden border-t-[3px] border-t-cyan-500 [body.light-theme_&]:border-t-cyan-600">
          
          {/* Top Bar Section inside Kasir: Delivery Mode & Customer Selector */}
          <div className="space-y-1.5 shrink-0 mb-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/90 dark:bg-slate-950/70 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {/* Delivery Mode Toggle: Ambil Depo vs Kirim Armada */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-300 tracking-wider flex items-center gap-1 shrink-0">
                  <i className="fa-solid fa-route text-cyan-500 dark:text-cyan-400 text-xs"></i>
                  Tipe:
                </span>
                <div className="inline-flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('depo')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      deliveryType === 'depo'
                        ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white border border-cyan-400 shadow-sm font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-store text-[10px]"></i>
                    <span>🏬 Ambil Depo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('armada')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      deliveryType === 'armada'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border border-amber-400 shadow-sm font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-truck-fast text-[10px]"></i>
                    <span>🚚 Kirim Armada</span>
                  </button>
                </div>

                {/* Saklar Darurat Multi-Drop */}
                {onToggleMultiDrop && (
                  <button
                    type="button"
                    onClick={onToggleMultiDrop}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer flex items-center gap-1 border ${
                      allowMultiDrop
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)] font-black animate-pulse'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                    }`}
                    title="Saklar Darurat Multi-Drop supir"
                  >
                    <span>{allowMultiDrop ? '🔓 Multi-Drop Aktif' : '🔒 Multi-Drop'}</span>
                  </button>
                )}
              </div>

              {/* Customer Selector & Add Customer Shortcut */}
              <div className="flex items-center gap-2 flex-1 min-w-[260px] justify-end">
                {/* Searchable Autocomplete Customer Dropdown */}
                <div ref={dropdownRef} className="relative flex-1 max-w-sm">
                  <div className="flex items-center bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 focus-within:border-cyan-500 transition-all shadow-xs">
                    <i className="fa-solid fa-user-tag text-cyan-600 dark:text-cyan-400 text-xs mr-2 shrink-0"></i>
                    <input
                      ref={customerInputRef}
                      type="text"
                      placeholder="Cari Pelanggan (Nama / HP / Toko / Scan Barcode)..."
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setCustomerName(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      onKeyDown={handleCustomerScanOrEnter}
                      className="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
                    />
                    {customerSearchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSelectedCustomer}
                        className="text-slate-400 hover:text-rose-500 text-xs px-1 cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Notifikasi Kilat Deteksi Scanner Member */}
                  {customerScanFeedback && (
                    <div
                      className={`absolute left-0 right-0 top-full mt-1 z-40 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200 border ${
                        customerScanFeedback.type === 'success'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-rose-600 text-white border-rose-400'
                      }`}
                    >
                      <span className="truncate">{customerScanFeedback.text}</span>
                      <button
                        type="button"
                        onClick={() => setCustomerScanFeedback(null)}
                        className="ml-2 text-white/80 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Dropdown list */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-600 dark:text-slate-400">
                          Tidak ditemukan. Klik <strong>[+ Pelanggan Baru]</strong>.
                        </div>
                      ) : (
                        filteredCustomers.map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => handleSelectCustomer(cust)}
                            className="p-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition-colors flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                                <span>{cust.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  cust.type === 'B2B'
                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                                }`}>
                                  {cust.type}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                📞 {cust.phone} • {cust.address}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 block">
                                {cust.id}
                              </span>
                              {cust.emptyGallonDebt && cust.emptyGallonDebt > 0 ? (
                                <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold">
                                  Hutang: {cust.emptyGallonDebt} Gln
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shrink-0 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Daftarkan pelanggan baru langsung dari kasir"
                >
                  <i className="fa-solid fa-user-plus text-xs"></i>
                  <span className="hidden sm:inline">+ Pelanggan Baru</span>
                  <span className="sm:hidden">+ Baru</span>
                </button>

                {selectedCustomer ? (
                  <div className="hidden lg:flex items-center gap-1.5 text-[10.5px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 font-mono shadow-xs shrink-0">
                    <span className="font-bold text-cyan-700 dark:text-cyan-300">
                      {selectedCustomer.name}
                    </span>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      Pinjam: {selectedCustomer.emptyGallonDebt || 0}
                    </span>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold shrink-0">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span>
                    <span>Walk-In Customer (Ambil Depo)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Panel Alamat & GPS Jika Armada Aktif */}
            {deliveryType === 'armada' && (
              <div className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                    <i className="fa-solid fa-location-dot"></i>
                    Alamat:
                  </span>
                  <input
                    type="text"
                    placeholder="Alamat kirim armada..."
                    value={deliveryAddress || (selectedCustomer ? selectedCustomer.address : '')}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-amber-400/60 dark:border-amber-500/40 rounded px-2 py-0.5 text-[11px] text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Patokan..."
                    value={landmarkNote || (selectedCustomer ? selectedCustomer.landmarkNote || selectedCustomer.landmark || '' : '')}
                    onChange={(e) => setLandmarkNote(e.target.value)}
                    className="w-32 bg-white dark:bg-slate-900 border border-amber-400/40 dark:border-amber-500/40 rounded px-2 py-0.5 text-[10.5px] text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
                    📡 Antrean Terbuka Siar Supir
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Baris 2: Barcode Scanner / SKU Bar + Tombol Cepat Print & Katalog */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border-2 border-cyan-500/40 dark:border-cyan-500/50 shrink-0 mb-1.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Form Barcode Scanner Input dengan Mode Satuan Bertingkat (Eceran vs Karton/Dus) */}
              <form onSubmit={handleBarcodeScanSubmit} className="flex-1 min-w-[280px] flex items-center gap-2">
                {/* Selector Mode Satuan: Eceran vs Karton/Dus */}
                <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setScanUomMode('eceran')}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      scanUomMode === 'eceran'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-cyan-600'
                    }`}
                    title="Scan / ketik SKU dalam satuan Eceran (Pcs / Tabung)"
                  >
                    🛍️ Ecer
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanUomMode('karton')}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      scanUomMode === 'karton'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
                    }`}
                    title="Scan / ketik SKU langsung dalam satuan Grosir (Dus / Karton / Bal)"
                  >
                    📦 Dus/Ktn
                  </button>
                </div>

                <div className="relative flex-1">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-600 dark:text-cyan-400">
                    <i className="fa-solid fa-barcode text-sm"></i>
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder={
                      scanUomMode === 'karton'
                        ? "[ Mode Karton/Dus ] Scan Barcode / Ketik SKU untuk tambah Dus..."
                        : "[ Mode Eceran ] Scan Barcode / Ketik SKU untuk tambah Ecer..."
                    }
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeScanSubmit();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-cyan-400/80 dark:border-cyan-500/70 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-cyan-600 dark:focus:border-cyan-400 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs cursor-pointer shadow-sm transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                >
                  <i className="fa-solid fa-cart-plus text-xs"></i>
                  <span>+ Tambah</span>
                </button>
              </form>

              {/* Action Buttons: Buka Katalog Cepat, Print Invoice, Print Surat Jalan */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Tombol Buka Katalog Cepat */}
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                  title="Buka pop-up katalog lengkap produk eceran & walk-in"
                >
                  <i className="fa-solid fa-boxes-stacked text-xs"></i>
                  <span>📦 Buka Katalog Cepat</span>
                </button>

                {/* Tombol Print Invoice */}
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  disabled={cart.length === 0}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    cart.length === 0
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-600 cursor-pointer text-cyan-300'
                  }`}
                  title="Cetak Faktur Penjualan / Invoice Resmi (Format A5 / Thermal)"
                >
                  <i className="fa-solid fa-print text-xs"></i>
                  <span>Print Invoice</span>
                </button>

                {/* Tombol Print Surat Jalan */}
                <button
                  type="button"
                  onClick={handlePrintSuratJalan}
                  disabled={cart.length === 0}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    cart.length === 0
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 cursor-pointer'
                  }`}
                  title="Cetak Surat Jalan & Bukti Muatan Armada Pengiriman (Format A5 / Thermal)"
                >
                  <i className="fa-solid fa-file-lines text-xs"></i>
                  <span>Print Surat Jalan</span>
                </button>

                {/* Tombol Kosongkan */}
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                  >
                    Kosongkan
                  </button>
                )}
              </div>
            </div>

            {/* Live Realtime Scanned / Typed Stock Warning Badge (Threshold <= 30%) */}
            {activeStockWarning && (
              <div
                className={`mt-1.5 px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold animate-pulse transition-all shadow-md ${
                  activeStockWarning.status === 'critical'
                    ? 'bg-rose-500/25 text-rose-300 border-2 border-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.45)] [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-900 [body.light-theme_&]:border-rose-500'
                    : 'bg-amber-500/25 text-amber-300 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border-amber-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg">
                    {activeStockWarning.status === 'critical' ? '🚨' : '⚠️'}
                  </span>
                  <span>
                    <strong>
                      {activeStockWarning.status === 'critical' ? 'STOK KRITIS (<=10%)' : 'STOK MENIPIS (<30%)'}!
                    </strong>{' '}
                    Sisa:{' '}
                    <strong className="font-mono text-sm underline text-white [body.light-theme_&]:text-slate-900">
                      {activeStockWarning.currentStock} {activeStockWarning.product.unit}
                    </strong>{' '}
                    ({activeStockWarning.remainingPct}% dari kapasitas ideal {activeStockWarning.maxCapacity}) • SKU:{' '}
                    <strong>{activeStockWarning.product.name}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-black/60 text-white font-mono font-black tracking-wider">
                    ⚠️ Segera PO Restock Pabrik
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecentScanWarning(null)}
                    className="w-5 h-5 rounded-full hover:bg-black/20 flex items-center justify-center text-xs cursor-pointer opacity-70 hover:opacity-100 text-current"
                    title="Tutup notifikasi"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Inline Scanner Feedback */}
            {barcodeFeedback && (
              <div
                className={`mt-1.5 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-fadeIn ${
                  barcodeFeedback.type === 'success'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600'
                    : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-600'
                }`}
              >
                <span>{barcodeFeedback.text}</span>
              </div>
            )}
          </div>

          {/* Bagian 2: Struktur Tabel Horizontal POS (Kolom Jelas & Font Terbaca Utuh) */}
          <div className="flex-1 min-h-0 max-h-[260px] overflow-y-auto border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900/90 shadow-inner scrollbar-thin my-1.5">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider shadow-xs">
                <tr>
                  <th className="w-12 text-center py-2 px-3">NO</th>
                  <th className="w-40 py-2 px-3">KODE SKU / BARCODE</th>
                  <th className="py-2 px-3 min-w-[200px]">NAMA BARANG</th>
                  <th className="w-36 text-center py-2 px-3">JUMLAH (- QTY +)</th>
                  <th className="w-28 text-right py-2 px-3">@HARGA SATUAN</th>
                  <th className="w-32 text-right py-2 px-3">TOTAL HARGA</th>
                  <th className="w-16 text-center py-2 px-3">HAPUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <i className="fa-solid fa-basket-shopping text-2xl text-slate-400"></i>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Tabel transaksi kasir masih kosong
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Scan barcode, ketik kode SKU / nama barang di atas, atau klik{' '}
                          <button
                            type="button"
                            onClick={() => setIsCatalogModalOpen(true)}
                            className="text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                          >
                            [📦 Buka Katalog Cepat]
                          </button>{' '}
                          untuk memilih barang.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => {
                    const matchedProd = productsList.find(
                      (p) => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase()
                    );
                    const warn = matchedProd ? calculateStockWarning(matchedProd) : null;
                    const isCriticalStock = warn?.status === 'critical';
                    const isWarningStock = warn?.status === 'warning';
                    const isExceedingStock = matchedProd !== undefined && item.qty >= matchedProd.stock;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-all ${
                          isCriticalStock
                            ? 'bg-rose-500/20 dark:bg-rose-950/50 [body.light-theme_&]:bg-rose-100/95 border-l-4 border-l-rose-600 dark:border-l-rose-500 hover:bg-rose-500/30 shadow-[inset_0_0_16px_rgba(244,63,94,0.25)] animate-pulse'
                            : isWarningStock
                            ? 'bg-amber-400/20 dark:bg-amber-950/40 [body.light-theme_&]:bg-amber-100/95 border-l-4 border-l-amber-500 dark:border-l-amber-400 hover:bg-amber-400/30 shadow-[inset_0_0_14px_rgba(245,158,11,0.2)]'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {/* NO */}
                        <td className="text-center font-mono font-bold text-slate-400 dark:text-slate-500 py-2 px-3">
                          {idx + 1}
                        </td>

                        {/* KODE SKU / BARCODE */}
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-[11px] text-cyan-700 dark:text-cyan-400 select-all whitespace-nowrap">
                            {item.productId}
                          </span>
                        </td>

                        {/* NAMA BARANG */}
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-xs sm:max-w-md" title={item.name}>
                            {item.name}
                          </div>

                          {/* Multi-UoM Selector & Switcher */}
                          {matchedProd?.uomLevels && matchedProd.uomLevels.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[9.5px] text-slate-500 font-semibold">Satuan:</span>
                              <button
                                type="button"
                                onClick={() => handleSwitchCartItemUom(item.id, matchedProd.unit)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer transition-all ${
                                  item.unit === matchedProd.unit
                                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {matchedProd.unit} (Ecer)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSwitchCartItemUom(item.id, matchedProd.uomLevels![0].unit)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer transition-all ${
                                  item.unit === matchedProd.uomLevels![0].unit
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {matchedProd.uomLevels![0].unit} (isi {matchedProd.uomLevels![0].conversionRatio})
                              </button>
                            </div>
                          )}

                          {/* Info Batch & Expired Date jika ada */}
                          {(item.batchNumber || item.expiredDate) && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono">
                              {item.batchNumber && (
                                <span className="text-slate-400">Batch: #{item.batchNumber}</span>
                              )}
                              {item.expiredDate && (
                                <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                                  Exp: {item.expiredDate}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Badge Peringatan Stok Kritis / Menipis */}
                          {warn && (isCriticalStock || isWarningStock) && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[9.5px] px-2 py-0.5 rounded font-black tracking-wide border flex items-center gap-1 ${
                                  isCriticalStock
                                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-xs'
                                    : 'bg-amber-500 text-slate-950 border-amber-300 font-extrabold shadow-xs'
                                }`}
                              >
                                <span>{isCriticalStock ? '🚨' : '⚠️'}</span>
                                <span>
                                  {isCriticalStock
                                    ? `STOK KRITIS! Sisa: ${matchedProd?.stock} ${matchedProd?.unit} (<=10%)`
                                    : `STOK MENIPIS! Sisa: ${matchedProd?.stock} ${matchedProd?.unit} (<=30%)`}
                                </span>
                              </span>
                            </div>
                          )}

                          {/* Keterangan Refill Tabung Jika Relevan */}
                          {item.isGalonRefill && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/30 font-medium">
                                {item.gallonScheme || 'Refill Tukar'}
                              </span>
                              {item.shortageFee && item.shortageFee > 0 ? (
                                <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                                  +Rp {item.shortageFee.toLocaleString('id-ID')}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </td>

                        {/* JUMLAH (- QTY +) */}
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              className="w-5 h-5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all"
                            >
                              -
                            </button>
                            <span className={`w-7 text-center font-mono font-extrabold text-xs ${
                              isExceedingStock ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-900 dark:text-cyan-300'
                            }`}>
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className={`w-5 h-5 rounded font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all ${
                                isExceedingStock
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                              }`}
                            >
                              +
                            </button>
                          </div>
                          {isExceedingStock && matchedProd && (
                            <div className="text-[9px] font-black text-rose-600 dark:text-rose-400 mt-0.5 whitespace-nowrap animate-bounce">
                              ⚠️ Qty &ge; Sisa Stok ({matchedProd.stock})!
                            </div>
                          )}
                        </td>

                        {/* @HARGA SATUAN */}
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                          Rp {item.unitPrice.toLocaleString('id-ID')}
                        </td>

                        {/* TOTAL HARGA */}
                        <td className="py-2 px-3 text-right font-mono font-black text-cyan-700 dark:text-cyan-300 text-xs sm:text-[13px] whitespace-nowrap">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </td>

                        {/* HAPUS */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="w-6 h-6 mx-auto rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center justify-center cursor-pointer"
                            title="Hapus barang dari keranjang"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bagian 3: Kunci Panel Pembayaran di Bawah Tabel */}
          <div className="flex-shrink-0 border-t-2 border-slate-300 dark:border-slate-700 pt-2 mt-auto space-y-1.5">
            {/* COLLAPSIBLE MUTASI WADAH KOSONG & ASET KEMASAN */}
            <div className="rounded-xl border border-amber-400/40 bg-amber-500/5 dark:bg-amber-950/20 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowContainerReturnSection(!showContainerReturnSection)}
                className="w-full p-2 px-3 flex items-center justify-between text-left hover:bg-amber-500/10 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔄</span>
                  <span className="font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide text-[11px]">
                    Sirkulasi Wadah &amp; Aset Kemasan (Retur / Tukar Wadah Kosong)
                  </span>
                  {(emptyReturns.galon19L > 0 || emptyReturns.kratBotol > 0 || emptyReturns.tabungGas > 0 || emptyReturns.palet > 0) && (
                    <span className="px-2 py-0.2 rounded-full text-[9.5px] font-mono font-bold bg-amber-500 text-slate-950">
                      Aktif: {emptyReturns.galon19L} Gln, {emptyReturns.kratBotol} Krat, {emptyReturns.tabungGas} Gas
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                  {showContainerReturnSection ? '▲ Tutup' : '▼ Buka Form Mutasi'}
                </span>
              </button>

              {showContainerReturnSection && (
                <div className="p-2.5 pt-1 border-t border-amber-400/20 space-y-2 bg-white/60 dark:bg-slate-900/60">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Galon 19L Kosong Diterima */}
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        💧 Galon 19L Kosong
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setEmptyReturns((prev) => ({ ...prev, galon19L: Math.max(0, prev.galon19L - 1) }))}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-xs">
                          {emptyReturns.galon19L} Tbg
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmptyReturns((prev) => ({ ...prev, galon19L: prev.galon19L + 1 }))}
                          className="w-6 h-6 rounded bg-cyan-600 text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Krat Botol Kosong Diterima */}
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        🍾 Krat/Peti Botol Kaca
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setEmptyReturns((prev) => ({ ...prev, kratBotol: Math.max(0, prev.kratBotol - 1) }))}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs">
                          {emptyReturns.kratBotol} Krat
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmptyReturns((prev) => ({ ...prev, kratBotol: prev.kratBotol + 1 }))}
                          className="w-6 h-6 rounded bg-amber-600 text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Tabung Gas LPG Kosong */}
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        🧯 Tabung Gas LPG
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setEmptyReturns((prev) => ({ ...prev, tabungGas: Math.max(0, prev.tabungGas - 1) }))}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs">
                          {emptyReturns.tabungGas} Tbg
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmptyReturns((prev) => ({ ...prev, tabungGas: prev.tabungGas + 1 }))}
                          className="w-6 h-6 rounded bg-rose-600 text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Palet Kayu / Plastik */}
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        🪵 Palet Logistik
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setEmptyReturns((prev) => ({ ...prev, palet: Math.max(0, prev.palet - 1) }))}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-xs">
                          {emptyReturns.palet} Plt
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmptyReturns((prev) => ({ ...prev, palet: prev.palet + 1 }))}
                          className="w-6 h-6 rounded bg-purple-600 text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedCustomer && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                      <span>Hutang Tabung Galon Terdaftar di Toko: <strong>{selectedCustomer.emptyGallonDebt || 0} Tabung</strong></span>
                      <span>Sisa Setelah Diterima: <strong>{Math.max(0, (selectedCustomer.emptyGallonDebt || 0) - emptyReturns.galon19L)} Tabung</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Baris Ringkasan: TOTAL BELANJA, PPN, Diskon */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 uppercase font-black tracking-wide">
                  TOTAL BELANJA:
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
                {isPpnActive && (
                  <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                    (PPN {effectivePpnRate}%)
                  </span>
                )}
              </div>

              {/* Controls PPN & Diskon */}
              <div className="flex items-center gap-2">
                {/* PPN Switcher */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-1 px-2 rounded-lg border border-slate-300 dark:border-slate-800">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] font-bold text-slate-800 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={isPpnActive}
                      onChange={(e) => setIsPpnActive(e.target.checked)}
                      className="rounded accent-cyan-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>PPN</span>
                  </label>
                  {isPpnActive && (
                    <div className="flex items-center gap-1 pl-1.5 border-l border-slate-300 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPpnMode('11')}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold cursor-pointer transition-all ${
                          ppnMode === '11'
                            ? 'bg-cyan-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        11%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPpnMode('12')}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold cursor-pointer transition-all ${
                          ppnMode === '12'
                            ? 'bg-cyan-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        12%
                      </button>
                    </div>
                  )}
                </div>

                {/* Diskon Switcher */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-1 px-2 rounded-lg border border-slate-300 dark:border-slate-800">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Disc:</span>
                  <button
                    type="button"
                    onClick={() => setDiscountMode(discountMode === 'rp' ? 'percent' : 'rp')}
                    className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 border border-slate-300 dark:border-slate-700"
                  >
                    {discountMode === 'rp' ? 'Rp' : '%'}
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={discountMode === 'percent' ? 100 : subtotal}
                    step={discountMode === 'percent' ? 1 : 1000}
                    value={discountValue || ''}
                    placeholder="0"
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 text-[11px] text-right font-mono rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-cyan-300 focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Baris Metode Pembayaran: [Cash] [Transfer] [QRIS] [Tempo] */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('Tunai');
                  if (cashReceived === 0) setCashReceived(grandTotal);
                }}
                className={`h-8 px-2 rounded-lg text-xs font-extrabold border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs ${
                  paymentMethod === 'Tunai'
                    ? 'bg-cyan-600 text-white border-cyan-600 ring-2 ring-cyan-400/30 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-cyan-500'
                }`}
              >
                <i className="fa-solid fa-money-bill-wave text-xs"></i>
                <span>💵 Cash / Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('Transfer Bank');
                  setCashReceived(grandTotal);
                }}
                className={`h-8 px-2 rounded-lg text-xs font-extrabold border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs ${
                  paymentMethod === 'Transfer Bank'
                    ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-400/30 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-sky-500'
                }`}
              >
                <i className="fa-solid fa-building-columns text-xs"></i>
                <span>💳 Transfer Bank</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('QRIS Depo');
                  setCashReceived(grandTotal);
                  setShowQrisModal(true);
                }}
                className={`h-8 px-2 rounded-lg text-xs font-extrabold border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs ${
                  paymentMethod === 'QRIS Depo'
                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/30 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500'
                }`}
              >
                <i className="fa-solid fa-qrcode text-xs"></i>
                <span>📱 QRIS</span>
              </button>

              <button
                type="button"
                disabled={!selectedCustomer}
                onClick={() => {
                  if (!selectedCustomer) return;
                  setPaymentMethod('Bayar Tempo');
                  setCashReceived(0);
                }}
                title={!selectedCustomer ? 'Pilih pelanggan terdaftar terlebih dahulu untuk Bayar Tempo' : 'Catat sebagai piutang toko'}
                className={`h-8 px-2 rounded-lg text-xs font-extrabold border-2 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs ${
                  !selectedCustomer
                    ? 'opacity-40 bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : paymentMethod === 'Bayar Tempo'
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-500 ring-2 ring-amber-400/40 shadow-md cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-300 hover:border-amber-500 cursor-pointer'
                }`}
              >
                <i className="fa-solid fa-file-invoice text-xs"></i>
                <span>📝 Tempo</span>
              </button>
            </div>

            {/* Baris Pembayaran Tunai & Kembalian */}
            {paymentMethod === 'Tunai' ? (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/70 p-2 rounded-xl border border-slate-300 dark:border-slate-800 text-xs">
                {/* Input Uang Bayar */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase shrink-0">
                    Uang Bayar:
                  </span>
                  <div className="relative flex-1 flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 shadow-inner">
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 mr-1.5">
                      Rp
                    </span>
                    <input
                      type="number"
                      step="1000"
                      value={cashReceived || ''}
                      placeholder="0"
                      onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tombol Cepat Nominal */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(grandTotal)}
                    className="px-2 py-1 rounded text-[10.5px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-400/50 hover:bg-cyan-200 cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuickCash(20000)}
                    className="px-2 py-1 rounded text-[10.5px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-cyan-400 cursor-pointer"
                  >
                    +20rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuickCash(50000)}
                    className="px-2 py-1 rounded text-[10.5px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-cyan-400 cursor-pointer"
                  >
                    +50rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuickCash(100000)}
                    className="px-2 py-1 rounded text-[10.5px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-cyan-400 cursor-pointer"
                  >
                    +100rb
                  </button>
                </div>

                {/* Kembalian */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-700 shrink-0">
                  <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">
                    Kembalian:
                  </span>
                  <span
                    className={`font-mono font-black text-sm ${
                      isCashSufficient
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isCashSufficient
                      ? `Rp ${changeAmount.toLocaleString('id-ID')}`
                      : `Kurang Rp ${Math.abs(changeAmount).toLocaleString('id-ID')}`}
                  </span>
                </div>
              </div>
            ) : paymentMethod === 'Transfer Bank' ? (
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-building-columns text-sky-600 text-sm"></i>
                  <span className="font-bold text-slate-900 dark:text-white">
                    BCA 8090-1234-5678 (DEPO AIR MINERAL / JacS DepoHub) • Total: <strong>Rp {grandTotal.toLocaleString('id-ID')}</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  Non-Tunai Lunas
                </span>
              </div>
            ) : paymentMethod === 'QRIS Depo' ? (
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-qrcode text-emerald-600 text-sm"></i>
                  <span className="font-bold text-slate-900 dark:text-white">
                    QRIS Depo (Semua E-Wallet & Bank) • Total: <strong>Rp {grandTotal.toLocaleString('id-ID')}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrisModal(true)}
                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] cursor-pointer"
                >
                  Tampilkan QR
                </button>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-file-invoice text-amber-600 text-sm"></i>
                  <span className="font-bold text-amber-900 dark:text-amber-300">
                    Nota Bon Tempo Toko {selectedCustomer?.name} • Jatuh Tempo 7 Hari
                  </span>
                </div>
                <span className="font-mono font-black text-amber-900 dark:text-amber-300">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Baris Tombol Aksi Akhir */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleCompleteTransaction}
                disabled={cart.length === 0}
                className={`h-9 px-4 rounded-xl text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  cart.length === 0
                    ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 cursor-pointer active:scale-95'
                }`}
              >
                <i className="fa-solid fa-check-circle text-sm"></i>
                <span>🛒 Selesaikan Transaksi</span>
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppReceipt}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <i className="fa-brands fa-whatsapp text-sm font-bold"></i>
                <span>📱 Struk WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PELUNASAN NOTA & SETORAN ARMADA */}
      {activeTab === 'setoran' && (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 overflow-hidden">
          {/* Left: Serah Terima Setoran Harian Sopir Armada (6 cols) */}
          <div className="lg:col-span-6 flex flex-col min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 overflow-hidden shadow-sm border-t-[3px] border-t-amber-500">
            <div className="p-2 px-3 border-b border-slate-800 [body.light-theme_&]:border-sky-200 flex items-center justify-between shrink-0 bg-slate-900/60 [body.light-theme_&]:bg-sky-50/70">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-truck-ramp-box text-amber-400 text-xs"></i>
                <span className="font-bold text-xs text-white [body.light-theme_&]:text-slate-900">
                  Serah Terima Setoran Harian Sopir Armada
                </span>
              </div>
              <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 font-medium">
                Penerimaan fisik uang tunai pengiriman
              </span>
            </div>

            {/* Driver Cards List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2">
              {driverSetorans.map((driver) => {
                const diff = driver.receivedCash - driver.targetCash;
                const isMatched = driver.status === 'Lengkap';
                return (
                  <div
                    key={driver.driverId}
                    className="p-2.5 rounded-lg bg-slate-900/80 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-sky-200 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                          {driver.driverName}
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 [body.light-theme_&]:bg-sky-50 text-slate-300 [body.light-theme_&]:text-sky-800 border [body.light-theme_&]:border-sky-200">
                            {driver.vehicle}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5">
                          {driver.route} • {driver.totalInvoices} Faktur Dibawa
                        </div>
                      </div>

                      <span
                        className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isMatched
                            ? 'bg-emerald-500/20 text-emerald-400 [body.light-theme_&]:text-emerald-700 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 [body.light-theme_&]:text-rose-700 border-rose-500/40 animate-pulse'
                        }`}
                      >
                        {isMatched ? '✓ Lengkap / Setor' : '⚠️ Selisih / Tertunda'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-1.5 rounded bg-slate-950/50 [body.light-theme_&]:bg-sky-50/50 border border-slate-800/80 [body.light-theme_&]:border-sky-200 text-xs">
                      <div>
                        <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500">
                          Target Tagihan Tunai
                        </div>
                        <div className="font-mono font-bold text-slate-200 [body.light-theme_&]:text-slate-900">
                          Rp {driver.targetCash.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500">
                          Fisik Diterima Kasir
                        </div>
                        <div className="font-mono font-extrabold text-sky-400 [body.light-theme_&]:text-sky-700">
                          Rp {driver.receivedCash.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    {diff !== 0 && (
                      <div className="text-[10px] text-rose-300 [body.light-theme_&]:text-rose-700 bg-rose-950/30 [body.light-theme_&]:bg-rose-50 p-1 rounded flex items-center justify-between border [body.light-theme_&]:border-rose-200">
                        <span>Selisih: Rp {Math.abs(diff).toLocaleString('id-ID')} (1 Toko transfer langsung)</span>
                        <span className="font-semibold">Bukti dicek</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500 font-mono">
                        Jam Serah: {driver.handoverTime || '-'}
                      </span>
                      {!isMatched ? (
                        <button
                          onClick={() => handleValidateDriverSetoran(driver.driverId)}
                          className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-white text-[10.5px] font-bold cursor-pointer shadow-sm transition-all"
                        >
                          Terima & Validasi Fisik
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 [body.light-theme_&]:text-emerald-700 font-bold flex items-center gap-1">
                          <i className="fa-solid fa-circle-check"></i> Sudah Valid
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Pelunasan Faktur Piutang Tempo Toko / Pangkalan (6 cols) */}
          <div className="lg:col-span-6 flex flex-col min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 overflow-hidden shadow-sm border-t-[3px] border-t-sky-500 [body.light-theme_&]:border-t-sky-600">
            <div className="p-2 px-3 border-b border-slate-800 [body.light-theme_&]:border-sky-200 flex items-center justify-between shrink-0 bg-slate-900/60 [body.light-theme_&]:bg-sky-50/70">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-file-invoice-dollar text-sky-400 text-xs"></i>
                <span className="font-bold text-xs text-white [body.light-theme_&]:text-slate-900">
                  Pelunasan Faktur Tempo Toko / Pangkalan
                </span>
              </div>
              <input
                type="text"
                placeholder="Cari toko / invoice..."
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="px-2 py-0.5 text-[10.5px] rounded bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
              {receivables
                .filter(
                  (r) =>
                    r.customerName.toLowerCase().includes(searchInvoice.toLowerCase()) ||
                    r.id.toLowerCase().includes(searchInvoice.toLowerCase())
                )
                .map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2 rounded-lg bg-slate-900/80 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-sky-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sky-400 [body.light-theme_&]:text-sky-700 text-[10.5px]">
                          {rec.id}
                        </span>
                        <span className="font-bold text-white [body.light-theme_&]:text-slate-900 text-xs">
                          {rec.customerName}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5">
                        Jatuh Tempo: {rec.dueDate} • Pinjaman: {rec.gallonsLoaned} Tabung
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-mono font-extrabold text-xs text-white [body.light-theme_&]:text-slate-900">
                          Rp {rec.amount.toLocaleString('id-ID')}
                        </div>
                        <span
                          className={`text-[8.5px] font-bold px-1 rounded ${
                            rec.status === 'Lewat Tempo'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>

                      <button
                        onClick={() => handlePayInvoice(rec.id)}
                        className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-white font-bold text-[10.5px] cursor-pointer shadow-sm transition-all"
                      >
                        Pelunasan
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT TRANSAKSI KASIR */}
      {activeTab === 'riwayat' && (
        <div className="flex-1 min-h-0 flex flex-col glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 overflow-hidden shadow-sm border-t-[3px] border-t-emerald-500">
          {/* Top Bar with KPI Metrics & Search */}
          <div className="p-3 border-b border-slate-800 [body.light-theme_&]:border-sky-200 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-900/60 [body.light-theme_&]:bg-sky-50/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <i className="fa-solid fa-receipt text-xs"></i>
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white [body.light-theme_&]:text-slate-900">
                  Riwayat Transaksi Kasir POS
                </h2>
                <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">
                  Semua transaksi kasir tunai, QRIS, dan tempo tercatat realtime
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari No. Struk, Pelanggan, SKU..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-48 sm:w-64 px-2.5 py-1.5 pl-8 rounded-lg text-xs bg-slate-950/80 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-xs text-slate-500"></i>
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute right-2 top-2 text-xs text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Tombol Baru: 🔄 Sinkronkan Semua Riwayat ke Google Sheets */}
              <button
                type="button"
                id="btn-sync-all-history-to-gas"
                onClick={handleSyncAllHistoryToGas}
                disabled={isSyncingAllHistory || kasirTransactions.length === 0}
                className={`px-3 py-1.5 rounded-lg text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border ${
                  isSyncingAllHistory
                    ? 'bg-amber-600 border-amber-500 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                }`}
                title={`Kirim seluruh ${kasirTransactions.length} transaksi kasir di riwayat lokal ke Google Sheets`}
              >
                <i className={`fa-solid fa-arrows-rotate text-xs ${isSyncingAllHistory ? 'animate-spin' : ''}`}></i>
                <span>
                  {isSyncingAllHistory
                    ? `Menyinkronkan (${syncProgress.current}/${syncProgress.total})...`
                    : '🔄 Sinkronkan Semua Riwayat ke Google Sheets'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('pos');
                  setIsCatalogModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <i className="fa-solid fa-cart-plus text-xs"></i>
                <span>Transaksi POS Baru</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {(() => {
            const filteredTxs = kasirTransactions.filter((tx) => {
              const q = historySearchQuery.toLowerCase();
              return (
                tx.id.toLowerCase().includes(q) ||
                tx.customerName.toLowerCase().includes(q) ||
                tx.items.toLowerCase().includes(q) ||
                (tx.customerType && tx.customerType.toLowerCase().includes(q)) ||
                tx.paymentMethod.toLowerCase().includes(q)
              );
            });
            const lunasCount = kasirTransactions.filter((t) => t.paymentStatus === 'Lunas').length;
            const tempoCount = kasirTransactions.filter((t) => t.paymentStatus !== 'Lunas').length;
            const totalLunasRp = kasirTransactions
              .filter((t) => t.paymentStatus === 'Lunas')
              .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
            const totalTempoRp = kasirTransactions
              .filter((t) => t.paymentStatus !== 'Lunas')
              .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/40 [body.light-theme_&]:bg-slate-50 border-b border-slate-800 [body.light-theme_&]:border-slate-200 shrink-0">
                  <div className="p-2 rounded-lg bg-slate-900/90 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-200">
                    <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">Total Transaksi</span>
                    <div className="text-sm font-bold font-mono text-white [body.light-theme_&]:text-slate-900">
                      {kasirTransactions.length} Transaksi
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/90 [body.light-theme_&]:bg-white border border-emerald-500/30 [body.light-theme_&]:border-emerald-300">
                    <span className="text-[10px] text-emerald-400 [body.light-theme_&]:text-emerald-700">Omzet Tunai & Lunas</span>
                    <div className="text-sm font-bold font-mono text-emerald-400 [body.light-theme_&]:text-emerald-800">
                      Rp {totalLunasRp.toLocaleString('id-ID')} ({lunasCount})
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/90 [body.light-theme_&]:bg-white border border-amber-500/30 [body.light-theme_&]:border-amber-300">
                    <span className="text-[10px] text-amber-400 [body.light-theme_&]:text-amber-700">Piutang & Bon Tempo</span>
                    <div className="text-sm font-bold font-mono text-amber-400 [body.light-theme_&]:text-amber-800">
                      Rp {totalTempoRp.toLocaleString('id-ID')} ({tempoCount})
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/90 [body.light-theme_&]:bg-white border border-cyan-500/30 [body.light-theme_&]:border-sky-300">
                    <span className="text-[10px] text-cyan-400 [body.light-theme_&]:text-sky-700">Status Database</span>
                    <div className="text-xs font-bold text-cyan-300 [body.light-theme_&]:text-sky-800 flex items-center gap-1 mt-0.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Realtime Reaktif
                    </div>
                  </div>
                </div>

                {/* Progress Banner saat Sinkronisasi Seluruh Riwayat Berjalan */}
                {isSyncingAllHistory && (
                  <div className="mx-3 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-2">
                        <i className="fa-solid fa-spinner animate-spin text-amber-400"></i>
                        <span>
                          Sedang menyinkronkan transaksi ke Google Sheets:{' '}
                          <span className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {syncProgress.currentId || '...'}
                          </span>
                        </span>
                      </span>
                      <span className="font-mono text-amber-200">
                        {syncProgress.current} dari {syncProgress.total} ({Math.round((syncProgress.current / (syncProgress.total || 1)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-amber-500/30">
                      <div
                        className="bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-300 h-full transition-all duration-300"
                        style={{ width: `${Math.round((syncProgress.current / (syncProgress.total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Table Container */}
                <div className="flex-1 min-h-0 overflow-auto p-3">
                  {filteredTxs.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500">
                      <i className="fa-solid fa-inbox text-3xl mb-2 text-slate-600"></i>
                      <p className="text-xs font-bold text-slate-400">Tidak ada riwayat transaksi yang cocok</p>
                      <p className="text-[10px] text-slate-500">Selesaikan transaksi di tab kasir POS untuk mencatat nota baru.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 [body.light-theme_&]:border-slate-200 text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 uppercase font-mono tracking-wider bg-slate-950/60 [body.light-theme_&]:bg-slate-100">
                          <th className="p-2.5">No. Struk</th>
                          <th className="p-2.5">Waktu</th>
                          <th className="p-2.5">Pelanggan</th>
                          <th className="p-2.5">Item Terjual</th>
                          <th className="p-2.5">Pengiriman</th>
                          <th className="p-2.5 text-right">Total Belanja</th>
                          <th className="p-2.5 text-center">Metode & Status</th>
                          <th className="p-2.5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200 text-slate-200 [body.light-theme_&]:text-slate-800">
                        {filteredTxs.map((tx) => {
                          const isLunas = tx.paymentStatus === 'Lunas';
                          return (
                            <tr
                              key={tx.id}
                              className="hover:bg-slate-850/60 [body.light-theme_&]:hover:bg-slate-50 transition-colors"
                            >
                              <td className="p-2.5 font-mono font-bold text-cyan-400 [body.light-theme_&]:text-cyan-700 whitespace-nowrap">
                                {tx.id}
                              </td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 whitespace-nowrap">
                                {tx.time}
                              </td>
                              <td className="p-2.5">
                                <div className="font-bold text-white [body.light-theme_&]:text-slate-900">{tx.customerName}</div>
                                <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600">{tx.customerType || 'Pelanggan POS'}</div>
                              </td>
                              <td className="p-2.5 text-[11px] text-slate-300 [body.light-theme_&]:text-slate-700 max-w-[220px] truncate" title={tx.items}>
                                {tx.items}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                  tx.deliveryType === 'armada'
                                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 [body.light-theme_&]:bg-purple-50 [body.light-theme_&]:text-purple-800 [body.light-theme_&]:border-purple-200'
                                    : 'bg-slate-800/80 text-slate-300 border-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:border-slate-300'
                                }`}>
                                  {tx.deliveryType === 'armada' ? '🚚 Kirim Armada' : '🚶 Ambil di Depo'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-white [body.light-theme_&]:text-slate-900 whitespace-nowrap">
                                Rp {tx.totalAmount.toLocaleString('id-ID')}
                              </td>
                              <td className="p-2.5 text-center whitespace-nowrap">
                                <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">{tx.paymentMethod}</div>
                                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                                  isLunas
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800'
                                }`}>
                                  {isLunas ? '✓ Lunas' : '⏳ Tempo / Bon'}
                                </span>
                              </td>
                              <td className="p-2.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewingReceiptTx(tx);
                                      setTransactionCompleted(tx.id);
                                      setShowThermalReceipt(true);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-[10px] border border-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-cyan-700 [body.light-theme_&]:border-slate-300 cursor-pointer transition-all"
                                    title="Lihat / Cetak Ulang Struk"
                                  >
                                    <i className="fa-solid fa-receipt mr-1"></i> Struk
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text = `*STRUK RESMI DEPO AIR MINERAL*%0A` +
                                        `No. Transaksi: *${tx.id}*%0A` +
                                        `Waktu: ${tx.time}%0A` +
                                        `Pelanggan: *${tx.customerName}*%0A` +
                                        `Items: ${tx.items}%0A` +
                                        `Total: *Rp ${tx.totalAmount.toLocaleString('id-ID')}*%0A` +
                                        `Pembayaran: *${tx.paymentMethod} (${tx.paymentStatus})*%0A` +
                                        `Status: *Transaksi Berhasil Diselesaikan di Kasir Depo*`;
                                      window.open(`https://wa.me/6281234567890?text=${text}`, '_blank');
                                    }}
                                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer shadow-sm transition-all"
                                    title="Kirim Nota via WhatsApp"
                                  >
                                    <i className="fa-brands fa-whatsapp mr-1"></i> WA
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await syncPosTransactionToGas(tx);
                                        const msg = `🟢 Transaksi ${tx.id} berhasil disinkronkan ke Google Sheets!`;
                                        setGasSyncToast(msg);
                                        if (onShowToast) onShowToast(msg);
                                        setTimeout(() => setGasSyncToast(null), 3500);
                                      } catch {
                                        alert(`Gagal sync transaksi ${tx.id}`);
                                      }
                                    }}
                                    className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] cursor-pointer shadow-sm transition-all"
                                    title="Sinkronkan data transaksi ini ke Google Sheets"
                                  >
                                    <i className="fa-solid fa-cloud-arrow-up mr-1"></i> Sheets
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* THERMAL RECEIPT MODAL (58mm / 80mm POS Standard) */}
      {showThermalReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative bg-white text-slate-900 w-full max-w-[340px] rounded-xl shadow-2xl p-4 flex flex-col gap-3 font-mono text-xs border border-slate-300 animate-scaleIn">
            {/* Tombol Tutup Silang di Pojok Kanan Atas */}
            <button
              type="button"
              onClick={() => {
                setShowThermalReceipt(false);
                setViewingReceiptTx(null);
                setCart([]);
                setCashReceived(0);
                setDiscountValue(0);
                setDiscountMode('rp');
                setIsPpnActive(false);
                setPpnMode('11');
                setCustomPpnRate(10);
                setSelectedCustomer(null);
                setCustomerSearchQuery('');
                setCustomerName('');
                setCustomerPhone('');
                setDeliveryAddress('');
                setLandmarkNote('');
                setMapsUrl('');
                setCoordinates(null);
                setIsDropdownOpen(false);
                setDeliveryType('depo');
                setPaymentMethod('Tunai');
                setLoadedOrderId(null);
                setBarcodeInput('');
                setBarcodeFeedback(null);
                setCatalogSearch('');
                if (onClearPrefill) onClearPrefill();
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer"
              title="Tutup Struk"
            >
              ✕
            </button>

            <div className="text-center border-b border-dashed border-slate-400 pb-2">
              <h3 className="font-extrabold text-sm tracking-wider">JacS DepoHub Pro</h3>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">DISTRIBUTOR & FLEET MANAGEMENT</p>
              <p className="text-[10px] text-slate-600">Jl. Raya Utama No. 88, Cibinong</p>
              <p className="text-[10px] text-slate-600">Telp/WA: 0812-9988-7711</p>
              <div className="text-[9.5px] mt-1 text-slate-500">
                {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </div>
            </div>

            <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-1.5">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold">{viewingReceiptTx ? viewingReceiptTx.id : (transactionCompleted || 'STR-2026-9921')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>Admin Depo</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold">{viewingReceiptTx ? viewingReceiptTx.customerName : (customerName || selectedCustomer?.name || 'Walk-In Customer')}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe Order:</span>
                <span className="font-bold">
                  {viewingReceiptTx
                    ? (viewingReceiptTx.deliveryType === 'armada' ? 'Kirim (Open Dispatch)' : 'Ambil Depo')
                    : (deliveryType === 'armada' ? 'Kirim (Open Dispatch)' : 'Ambil Depo')}
                </span>
              </div>
              {(viewingReceiptTx?.deliveryAddress || (!viewingReceiptTx && deliveryType === 'armada' && (deliveryAddress || selectedCustomer?.address))) && (
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>Alamat:</span>
                  <span className="truncate max-w-[190px]">{viewingReceiptTx?.deliveryAddress || deliveryAddress || selectedCustomer?.address}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-2">
              {viewingReceiptTx && (!viewingReceiptTx.cartItems || viewingReceiptTx.cartItems.length === 0) ? (
                <div className="text-[10.5px]">
                  <div className="font-bold">{viewingReceiptTx.items}</div>
                  <div className="flex justify-between text-slate-700 text-[10px] mt-1">
                    <span>Total Belanja</span>
                    <span className="font-bold">Rp {viewingReceiptTx.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ) : (viewingReceiptTx?.cartItems || cart).map((item, idx) => (
                <div key={idx} className="text-[10.5px]">
                  <div className="font-bold">{item.name}</div>
                  <div className="flex justify-between text-slate-700 text-[10px]">
                    <span>
                      {item.qty} x Rp {item.unitPrice.toLocaleString('id-ID')}
                    </span>
                    <span>Rp {(item.qty * item.unitPrice).toLocaleString('id-ID')}</span>
                  </div>
                  {item.shortageFee && item.shortageFee > 0 ? (
                    <div className="flex justify-between text-amber-700 text-[9.5px] pl-1 font-semibold">
                      <span>+ {item.shortageResolution === 'beli' ? 'Beli' : 'Jaminan Pinjam'} {item.qty - (item.emptyGallonsReturned ?? 0)} Tabung:</span>
                      <span>+Rp {item.shortageFee.toLocaleString('id-ID')}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-0.5 text-[10.5px] border-b border-dashed border-slate-400 pb-2">
              {viewingReceiptTx ? (
                <>
                  {viewingReceiptTx.subtotal !== undefined && (
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rp {viewingReceiptTx.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {viewingReceiptTx.discountAmount !== undefined && viewingReceiptTx.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon {viewingReceiptTx.discountLabel ? `(${viewingReceiptTx.discountLabel})` : ''}:</span>
                      <span>-Rp {viewingReceiptTx.discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {viewingReceiptTx.ppnAmount !== undefined && viewingReceiptTx.ppnAmount > 0 && (
                    <div className="flex justify-between text-sky-700">
                      <span>PPN:</span>
                      <span>+Rp {viewingReceiptTx.ppnAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon ({discountMode === 'percent' ? `${discountValue}%` : 'Nominal'}):</span>
                      <span>-Rp {calculatedDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {isPpnActive && (
                    <div className="flex justify-between text-sky-700">
                      <span>PPN ({effectivePpnRate}%):</span>
                      <span>+Rp {ppnAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span>Rp {(viewingReceiptTx ? viewingReceiptTx.totalAmount : grandTotal).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span>Metode:</span>
                <span className="font-bold">{viewingReceiptTx ? viewingReceiptTx.paymentMethod : paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span>Status:</span>
                <span className={`font-bold ${(viewingReceiptTx ? viewingReceiptTx.paymentStatus : paymentMethod === 'Bayar Tempo' ? 'Tempo / Hutang' : 'Lunas') === 'Lunas' ? 'text-emerald-700' : 'text-amber-800'}`}>
                  {viewingReceiptTx ? viewingReceiptTx.paymentStatus : (paymentMethod === 'Bayar Tempo' ? 'Tempo / Hutang' : 'Lunas')}
                </span>
              </div>
              {((viewingReceiptTx && viewingReceiptTx.paymentMethod === 'Tunai') || (!viewingReceiptTx && paymentMethod === 'Tunai')) && (
                <>
                  <div className="flex justify-between">
                    <span>Tunai:</span>
                    <span>Rp {(viewingReceiptTx?.cashReceived ?? cashReceived).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Kembalian:</span>
                    <span>Rp {Math.max(0, viewingReceiptTx?.changeAmount ?? changeAmount).toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-slate-500 space-y-0.5">
              <p>*** TERIMA KASIH ***</p>
              <p>Air Bersih Higienis Keluarga Sehat</p>
              <p>Struk Sah Bukti Pembayaran Resmi</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-1.5 rounded bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800 flex items-center justify-center gap-1"
              >
                <i className="fa-solid fa-print"></i> Cetak Struk
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppReceipt}
                className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <i className="fa-brands fa-whatsapp"></i>
                <span>Kirim WA</span>
              </button>
              <button
                onClick={() => {
                  setShowThermalReceipt(false);
                  setViewingReceiptTx(null);
                  setCart([]);
                  setCashReceived(0);
                  setDiscountValue(0);
                  setDiscountMode('rp');
                  setIsPpnActive(false);
                  setPpnMode('11');
                  setCustomPpnRate(10);
                  setSelectedCustomer(null);
                  setCustomerSearchQuery('');
                  setCustomerName('');
                  setCustomerPhone('');
                  setDeliveryAddress('');
                  setLandmarkNote('');
                  setMapsUrl('');
                  setCoordinates(null);
                  setIsDropdownOpen(false);
                  setDeliveryType('depo');
                  setPaymentMethod('Tunai');
                  setLoadedOrderId(null);
                  setBarcodeInput('');
                  setBarcodeFeedback(null);
                  setCatalogSearch('');
                  if (onClearPrefill) onClearPrefill();
                }}
                className="px-3 py-1.5 rounded bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer hover:bg-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRIS POPUP MODAL */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 [body.light-theme_&]:bg-white border border-sky-400/60 [body.light-theme_&]:border-sky-300 rounded-xl p-4 w-full max-w-sm text-center shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-sky-100 pb-2">
              <span className="font-extrabold text-xs text-white [body.light-theme_&]:text-slate-900">QRIS DINAMIS DEPO RESMI</span>
              <button
                onClick={() => setShowQrisModal(false)}
                className="text-slate-400 hover:text-white [body.light-theme_&]:hover:text-slate-900 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white rounded-lg inline-block shadow-inner border border-sky-200">
              {/* QR Code Simulation Graphic */}
              <div className="w-48 h-48 bg-sky-50/50 flex flex-col items-center justify-center p-2 border border-sky-200 relative">
                <div className="absolute top-2 left-2 w-8 h-8 border-4 border-slate-900"></div>
                <div className="absolute top-2 right-2 w-8 h-8 border-4 border-slate-900"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-4 border-slate-900"></div>
                <i className="fa-solid fa-qrcode text-6xl text-slate-800"></i>
                <span className="text-[10px] font-mono font-bold text-slate-700 mt-2">
                  JACS-QRIS-{grandTotal}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs font-mono font-extrabold text-sky-400 [body.light-theme_&]:text-sky-700">
                Total: Rp {grandTotal.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-1">
                Scan menggunakan BCA Mobile, Livin Mandiri, GoPay, OVO, ShopeePay, atau QRIS Bank
              </p>
            </div>

            <button
              onClick={() => {
                setShowQrisModal(false);
                setCashReceived(grandTotal);
              }}
              className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs cursor-pointer shadow-[0_0_12px_rgba(14,165,233,0.35)] transition-all"
            >
              Konfirmasi QRIS Diterima
            </button>
          </div>
        </div>
      )}

      {/* Modal Tarik Order B2C Warga */}
      {showB2cPullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 [body.light-theme_&]:bg-white border border-emerald-500/40 [body.light-theme_&]:border-sky-300 rounded-2xl shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-sky-200 pb-2.5">
              <div>
                <h4 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                  <i className="fa-solid fa-house-chimney text-emerald-400"></i>
                  Tarik Pesanan Rumah Tangga (B2C) ke Kasir
                </h4>
                <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                  Pilih pesanan warga untuk langsung memproses pembayaran tunai/QRIS & cetak struk kasir
                </p>
              </div>
              <button
                onClick={() => setShowB2cPullModal(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-800/60 [body.light-theme_&]:divide-sky-100">
              {orders.filter((o) => o.customerType === 'Rumah Tangga').length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada pesanan B2C yang tercatat. Input pesanan via tombol '+ Order Rumah Tangga (B2C)'.
                </div>
              ) : (
                orders
                  .filter((o) => o.customerType === 'Rumah Tangga')
                  .map((ord) => (
                    <div
                      key={ord.id}
                      className="pt-2 flex items-center justify-between hover:bg-slate-800/30 [body.light-theme_&]:hover:bg-sky-50/50 p-2 rounded-lg transition-all"
                    >
                      <div>
                        <div className="font-extrabold text-white [body.light-theme_&]:text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{ord.customerName}</span>
                          <span className="font-mono text-[10px] text-emerald-400 [body.light-theme_&]:text-emerald-700">({ord.id})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5">
                          {ord.residentialDetail || 'Perumahan Warga'} • {ord.totalGalon} Galon [{ord.gallonScheme || 'Tukar Galon'}]
                        </div>
                        <div className="font-mono font-bold text-cyan-400 [body.light-theme_&]:text-sky-700 text-xs mt-0.5">
                          Rp {ord.totalAmount.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        onClick={() => loadOrderIntoCart(ord)}
                        className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35)] cursor-pointer flex items-center gap-1"
                      >
                        <i className="fa-solid fa-arrow-right-to-bracket text-[10px]"></i>
                        <span>Muat ke Kasir</span>
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENDAFTARAN PELANGGAN BARU (TERINTEGRASI KE MASTER DATA & POS) */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSaveCustomer={(newCust) => {
          if (onAddCustomer) {
            onAddCustomer(newCust);
          }
          handleSelectCustomer(newCust);
          setIsCustomerModalOpen(false);
        }}
      />

      {/* MODAL PENDAFTARAN SKU / PRODUK BARU DARI KASIR */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSaveProduct={handleSaveProductFromKasir}
        existingCount={productsList.length}
      />

      {/* MODAL KONFIRMASI PENGAJUAN TOKO BARU (VERIFIKASI ADMIN) */}
      {showStoreSubmissionsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border-t sm:border border-amber-400 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                  <span>🔔</span>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    PANEL KONFIRMASI PENGAJUAN TOKO BARU
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50">
                      Verifikasi Admin
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Tinjau pengajuan registrasi toko dari supir untuk disahkan ke Master Pelanggan aktif (CUSTOMER_MASTER)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowStoreSubmissionsModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 py-2.5 border-b border-slate-800/80 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSubmissionFilter('MENUNGGU')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  submissionFilter === 'MENUNGGU'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>⏳ Menunggu Konfirmasi</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] bg-slate-800 text-amber-400 font-mono font-bold">
                  {storeSubmissions.filter((s) => s.status === 'MENUNGGU_KONFIRMASI_ADMIN').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubmissionFilter('SEMUA')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  submissionFilter === 'SEMUA'
                    ? 'bg-sky-500 text-white font-black shadow-[0_0_10px_rgba(14,165,233,0.4)]'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>Semua Pengajuan</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] bg-slate-800 text-sky-400 font-mono font-bold">
                  {storeSubmissions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubmissionFilter('DISETUJUI')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  submissionFilter === 'DISETUJUI'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>✅ Disetujui</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] bg-slate-800 text-emerald-400 font-mono font-bold">
                  {storeSubmissions.filter((s) => s.status === 'DISETUJUI').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubmissionFilter('DITOLAK')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  submissionFilter === 'DITOLAK'
                    ? 'bg-rose-500 text-white font-black shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>❌ Ditolak</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] bg-slate-800 text-rose-400 font-mono font-bold">
                  {storeSubmissions.filter((s) => s.status === 'DITOLAK').length}
                </span>
              </button>
            </div>

            {/* List of Submissions */}
            <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-3 pr-1">
              {storeSubmissions.filter((sub) => {
                if (submissionFilter === 'MENUNGGU') return sub.status === 'MENUNGGU_KONFIRMASI_ADMIN';
                if (submissionFilter === 'DISETUJUI') return sub.status === 'DISETUJUI';
                if (submissionFilter === 'DITOLAK') return sub.status === 'DITOLAK';
                return true;
              }).length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="text-3xl">📭</div>
                  <div className="text-xs font-bold text-slate-300">
                    Tidak ada pengajuan toko pada kategori ini
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Pengajuan baru dari supir via Portal Driver akan muncul di sini secara real-time.
                  </div>
                </div>
              ) : (
                storeSubmissions
                  .filter((sub) => {
                    if (submissionFilter === 'MENUNGGU') return sub.status === 'MENUNGGU_KONFIRMASI_ADMIN';
                    if (submissionFilter === 'DISETUJUI') return sub.status === 'DISETUJUI';
                    if (submissionFilter === 'DITOLAK') return sub.status === 'DITOLAK';
                    return true;
                  })
                  .map((sub) => {
                    return (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-xl border space-y-2.5 transition-all ${
                          sub.status === 'MENUNGGU_KONFIRMASI_ADMIN'
                            ? 'bg-slate-950/80 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : sub.status === 'DISETUJUI'
                            ? 'bg-slate-950/40 border-emerald-500/40'
                            : 'bg-slate-950/40 border-rose-500/30 opacity-70'
                        }`}
                      >
                        {/* Header Toko & Badges */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base">
                                {sub.category === 'Toko Mitra' ? '🏪' : '🏠'}
                              </span>
                              <h4 className="font-black text-sm text-white">{sub.name}</h4>
                              <span className="text-[9.5px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {sub.id}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Diajukan oleh: <span className="text-cyan-300 font-bold">{sub.submittedByDriverName}</span> • <span className="font-mono">{sub.submittedAt}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Kategori Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                sub.category === 'Toko Mitra'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60'
                              }`}
                            >
                              {sub.category === 'Toko Mitra' ? 'Toko Mitra (B2B)' : 'Residensial (B2C)'}
                            </span>

                            {/* Price Tier Badge */}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                              Tier: {sub.priceTier}
                            </span>

                            {/* Status Badge */}
                            {sub.status === 'MENUNGGU_KONFIRMASI_ADMIN' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                                Menunggu Verifikasi
                              </span>
                            )}
                            {sub.status === 'DISETUJUI' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                                Disetujui (Aktif di Master)
                              </span>
                            )}
                            {sub.status === 'DITOLAK' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                                Ditolak
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rincian Identitas Pelanggan (Selaras CUSTOMER_MASTER) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                          {/* Sisi Kiri */}
                          <div className="space-y-1.5">
                            <div>
                              <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                                Nama Pemilik / PIC:
                              </span>
                              <span className="font-bold text-slate-200">{sub.ownerName || '-'}</span>
                            </div>

                            <div>
                              <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                                Nomor WhatsApp:
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-cyan-400 font-bold">{sub.phone}</span>
                                <a
                                  href={`https://wa.me/${sub.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[9.5px] font-bold border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <i className="fa-brands fa-whatsapp"></i>
                                  <span>Chat WA</span>
                                </a>
                              </div>
                            </div>

                            {sub.notes && (
                              <div>
                                <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                                  Catatan Tambahan Supir:
                                </span>
                                <span className="text-slate-300 italic text-[11px]">"{sub.notes}"</span>
                              </div>
                            )}
                          </div>

                          {/* Sisi Kanan: Alamat, Patokan & GPS */}
                          <div className="space-y-1.5">
                            <div>
                              <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                                Alamat Lengkap:
                              </span>
                              <span className="text-slate-200">{sub.address || '-'}</span>
                            </div>

                            <div>
                              <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                                Patokan (Landmark):
                              </span>
                              <span className="text-amber-300 font-medium">📍 {sub.landmark || '-'}</span>
                            </div>

                            <div>
                              <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                                Koordinat GPS & Lokasi Maps:
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {sub.coordinates ? (
                                  <span className="font-mono text-[10px] text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    {sub.coordinates.lat.toFixed(4)}, {sub.coordinates.lng.toFixed(4)}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Koordinat tidak tersedia</span>
                                )}
                                {(sub.mapsUrl || sub.coordinates) && (
                                  <a
                                    href={
                                      sub.mapsUrl ||
                                      (sub.coordinates
                                        ? `https://maps.google.com/?q=${sub.coordinates.lat},${sub.coordinates.lng}`
                                        : '#')
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[9.5px] font-bold border border-cyan-400/50 flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <i className="fa-solid fa-map-location-dot"></i>
                                    <span>Buka Maps</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tombol Aksi Admin */}
                        {sub.status === 'MENUNGGU_KONFIRMASI_ADMIN' && (
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                            {(() => {
                              const matchSpotOrder = orders.find(
                                (o) =>
                                  o.deliveryStatus === 'MENUNGGU_APPROVAL_ADMIN' &&
                                  (o.customerName.toLowerCase() === sub.name.toLowerCase() ||
                                    o.phone === sub.phone)
                              );
                              if (!matchSpotOrder) return <div />;
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreselectedSpotOrderId(matchSpotOrder.id);
                                    setShowSpotApprovalModal(true);
                                    setShowStoreSubmissionsModal(false);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                                  title="Tinjau order spot supir yang dibuat untuk toko ini"
                                >
                                  <span>⚡ Order Spot Terkait: #{matchSpotOrder.id} ({matchSpotOrder.totalGalon} Gln)</span>
                                </button>
                              );
                            })()}

                            <div className="flex items-center gap-2 ml-auto">
                              <button
                                type="button"
                                onClick={() => onRejectStoreSubmission?.(sub.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                              >
                                <span>❌</span>
                                <span>Tolak Pengajuan</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onApproveStoreSubmission?.(sub.id)}
                                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-[0_0_14px_rgba(16,185,129,0.4)] cursor-pointer transition-all active:scale-95"
                              >
                                <span>✅</span>
                                <span>Konfirmasi & Tambah ke Master</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {sub.status === 'DISETUJUI' && (
                          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400">
                            <div className="flex items-center gap-1.5">
                              <i className="fa-solid fa-circle-check"></i>
                              <span>Toko aktif di Master Pelanggan (CUSTOMER_MASTER) & siap transaksi.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const matchedCust = customers.find((c) => c.name === sub.name || c.phone === sub.phone);
                                if (matchedCust) {
                                  handleSelectCustomer(matchedCust);
                                  setShowStoreSubmissionsModal(false);
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] border border-emerald-400/50 cursor-pointer"
                            >
                              Pilih Toko di Kasir →
                            </button>
                          </div>
                        )}

                        {sub.status === 'DITOLAK' && (
                          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-rose-400">
                            <div className="flex items-center gap-1.5">
                              <i className="fa-solid fa-circle-xmark"></i>
                              <span>Permohonan toko ini telah ditolak oleh Admin.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onApproveStoreSubmission?.(sub.id)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10px] border border-slate-700 cursor-pointer"
                            >
                              Pulihkan & Tambah ke Master
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 shrink-0 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved text-cyan-400"></i>
                <span>Sinkronisasi otomatis ke Kasir POS, Peta Rayon, Order Antaran, &amp; Portal Driver.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowStoreSubmissionsModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER KATALOG CEPAT PRODUK (Dibuka lewat [📦 Buka Katalog Cepat]) */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border-2 border-purple-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white">
            {/* Header Modal */}
            <div className="p-3 px-4 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-sm shadow-md">
                  <i className="fa-solid fa-boxes-stacked"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 leading-none">
                    Katalog Cepat Produk Depo
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-600 font-bold">
                      {productsList.length} SKU
                    </span>
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                    Klik produk untuk langsung menambahkan ke tabel kasir POS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="Daftarkan SKU baru"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                  <span>+ SKU Baru</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filter Search & Category Pills */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-300 dark:border-slate-800 space-y-2 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama barang / SKU / kategori produk..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-purple-500 shadow-xs"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                {['Semua', '💧 Air & Minuman', '🌾 FMCG Sembako', '🧼 FMCG Homecare', '📦 Non-FMCG Logistik', 'Galon 19L', 'Kemasan Botol / Dus', 'Kemasan Gelas / Cup'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                      catalogCategory === cat
                        ? 'bg-purple-600 text-white font-bold border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid Cards */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredCatalogProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                  <i className="fa-solid fa-box-open text-3xl mb-2 block text-slate-400"></i>
                  Tidak ada produk yang cocok dengan pencarian "{catalogSearch}".
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSearch('');
                      setCatalogCategory('Semua');
                    }}
                    className="mt-2.5 block mx-auto text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                filteredCatalogProducts.map((prod) => {
                  const displayPrice = getProductUnitPriceForCustomer(prod, selectedCustomer);
                  const inCartQty = cart.find((c) => c.productId === prod.id)?.qty || 0;
                  const warn = calculateStockWarning(prod);
                  const isCriticalStock = warn.status === 'critical';
                  const isWarningStock = warn.status === 'warning';
                  const hasMultiUom = prod.uomLevels && prod.uomLevels.length > 0;

                  return (
                    <div
                      key={prod.id}
                      className={`p-2.5 rounded-xl text-left transition-all flex flex-col justify-between group shadow-xs hover:shadow-md relative overflow-hidden ${
                        isCriticalStock
                          ? 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 shadow-[0_0_14px_rgba(244,63,94,0.35)]'
                          : isWarningStock
                          ? 'border-2 border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                          : 'border-2 border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-white dark:bg-slate-800/90'
                      }`}
                    >
                      {inCartQty > 0 && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-purple-600 text-white shadow-xs z-10">
                          {inCartQty} di Kasir
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9.5px] uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400 block truncate">
                            {prod.category}
                          </span>
                          {isCriticalStock ? (
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                              {prod.stock === 0 ? 'HABIS (0)' : `KRITIS ≤10%`}
                            </span>
                          ) : isWarningStock ? (
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 font-bold">
                              MENIPIS ≤30%
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 mt-0.5">
                          {prod.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>SKU: {prod.id}</span>
                          {prod.expiredDate && (
                            <span className="text-[9px] text-amber-500 font-bold">Exp: {prod.expiredDate}</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700/80 w-full space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400">
                            Rp {displayPrice.toLocaleString('id-ID')}
                          </span>
                          <span className={`text-[10.5px] font-mono font-bold ${
                            isCriticalStock
                              ? 'text-rose-600 dark:text-rose-400 underline font-black animate-pulse'
                              : isWarningStock
                              ? 'text-amber-600 dark:text-amber-400 font-black'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            Stok: {prod.stock} {prod.unit}
                          </span>
                        </div>

                        {/* Tombol Tambah ke Kasir (Dual-UoM atau Single) */}
                        {hasMultiUom ? (
                          <div className="grid grid-cols-2 gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(prod, prod.unit)}
                              className="py-1 px-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold text-center cursor-pointer shadow-xs active:scale-95 transition-all truncate"
                              title={`Beli Eceran: ${prod.unit}`}
                            >
                              + {prod.unit}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(prod, prod.uomLevels![0].unit)}
                              className="py-1 px-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black text-center cursor-pointer shadow-xs active:scale-95 transition-all truncate"
                              title={`Beli Kemasan Grosir: ${prod.uomLevels![0].unit} (isi ${prod.uomLevels![0].conversionRatio} ${prod.unit})`}
                            >
                              + {prod.uomLevels![0].unit}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            className="w-full py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold text-center cursor-pointer shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <i className="fa-solid fa-cart-plus text-[10px]"></i>
                            <span>+ Keranjang ({prod.unit})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-3 px-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                Total di keranjang kasir:{' '}
                <strong className="text-purple-600 dark:text-purple-400 font-mono text-sm">
                  {cart.reduce((s, i) => s + i.qty, 0)} Item (Rp {grandTotal.toLocaleString('id-ID')})
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                Selesai & Kembali ke Kasir POS →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRINT DOKUMEN: INVOICE & SURAT JALAN (A5 / THERMAL) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          {/* Printable Media Styles scoped to #kasir-printable-doc */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #kasir-printable-doc, #kasir-printable-doc * {
                visibility: visible !important;
              }
              #kasir-printable-doc {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${printPaperSize === 'thermal' ? '80mm' : '148mm'} !important;
                max-width: ${printPaperSize === 'thermal' ? '80mm' : '148mm'} !important;
                margin: 0 !important;
                padding: ${printPaperSize === 'thermal' ? '6px' : '16px'} !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: Arial, sans-serif !important;
              }
            }
          `}</style>

          <div className="w-full max-w-2xl max-h-[95vh] bg-white dark:bg-slate-900 border-2 border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white">
            {/* Modal Header & Options */}
            <div className="p-3 px-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center text-sm shadow-md">
                  <i className="fa-solid fa-print"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">
                    Preview Cetak Dokumen Kasir
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Layout siap cetak langsung via window.print()
                  </p>
                </div>
              </div>

              {/* Format Switcher & Doc Switcher */}
              <div className="flex items-center gap-2">
                {/* Doc Switcher */}
                <div className="inline-flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPrintDocType('invoice')}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                      printDocType === 'invoice'
                        ? 'bg-cyan-600 text-white shadow-xs font-extrabold'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    📄 Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintDocType('surat_jalan')}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                      printDocType === 'surat_jalan'
                        ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    🚚 Surat Jalan
                  </button>
                </div>

                {/* Paper Size Switcher */}
                <div className="inline-flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPrintPaperSize('a5')}
                    className={`px-2 py-1 rounded-md text-[10.5px] transition-all cursor-pointer ${
                      printPaperSize === 'a5'
                        ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    A5
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintPaperSize('thermal')}
                    className={`px-2 py-1 rounded-md text-[10.5px] transition-all cursor-pointer ${
                      printPaperSize === 'thermal'
                        ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Thermal
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 text-xs flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Preview Area (Printable target) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-200 dark:bg-slate-950 flex justify-center">
              <div
                id="kasir-printable-doc"
                className={`bg-white text-slate-900 shadow-xl border border-slate-300 rounded-lg p-5 font-sans ${
                  printPaperSize === 'thermal' ? 'w-[320px] text-xs' : 'w-[520px] text-xs'
                }`}
              >
                {/* Header Kop Surat Depo */}
                {(() => {
                  const depoProf = getDepoProfile();
                  return (
                    <div className="border-b-2 border-slate-900 pb-2.5 mb-3 flex items-start justify-between">
                      <div>
                        <h2 className="text-base font-black tracking-wide uppercase text-slate-950">
                          {depoProf.name || 'JacS DepoHub Pro'}
                        </h2>
                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">
                          Distributor & Fleet Management Air Mineral
                        </p>
                        <p className="text-[9.5px] text-slate-600">
                          {depoProf.address} • Hotline: {depoProf.phone}{depoProf.nib ? ` • NIB: ${depoProf.nib}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-black uppercase rounded bg-slate-900 text-white tracking-wider">
                          {printDocType === 'invoice' ? 'FAKTUR PENJUALAN' : 'SURAT JALAN'}
                        </span>
                        <div className="text-[10px] font-mono font-bold mt-1 text-slate-800">
                          {printDocType === 'invoice'
                            ? `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`
                            : `SJ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Customer & Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] mb-3 pb-2 border-b border-dashed border-slate-400">
                  <div>
                    <div><span className="text-slate-500">Tanggal:</span> <strong className="font-mono">{new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong></div>
                    <div><span className="text-slate-500">Pelanggan:</span> <strong className="text-slate-950">{customerName || selectedCustomer?.name || 'Pelanggan Langsung (Walk-In)'}</strong></div>
                    {(customerPhone || selectedCustomer?.phone) && (
                      <div><span className="text-slate-500">No. Kontak:</span> <strong className="font-mono">{customerPhone || selectedCustomer?.phone}</strong></div>
                    )}
                  </div>
                  <div className="text-right">
                    <div><span className="text-slate-500">Tipe Layanan:</span> <strong>{deliveryType === 'armada' ? '🚚 Kirim Armada' : '🏬 Ambil Depo'}</strong></div>
                    {deliveryType === 'armada' && (deliveryAddress || selectedCustomer?.address) && (
                      <div><span className="text-slate-500">Tujuan:</span> <span>{deliveryAddress || selectedCustomer?.address}</span></div>
                    )}
                    <div><span className="text-slate-500">Metode Bayar:</span> <strong className="text-slate-950">{paymentMethod}</strong></div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse text-[10px] mb-3">
                  <thead>
                    <tr className="border-b-2 border-slate-800 bg-slate-100 font-bold uppercase text-slate-800">
                      <th className="py-1 px-1.5 text-center w-6">No</th>
                      <th className="py-1 px-1.5 w-24">SKU</th>
                      <th className="py-1 px-1.5">Barang</th>
                      <th className="py-1 px-1.5 text-center w-12">Qty</th>
                      {printDocType === 'invoice' && (
                        <>
                          <th className="py-1 px-1.5 text-right w-20">@Harga</th>
                          <th className="py-1 px-1.5 text-right w-24">Subtotal</th>
                        </>
                      )}
                      {printDocType === 'surat_jalan' && (
                        <>
                          <th className="py-1 px-1.5 text-center w-16">Cek Muat</th>
                          <th className="py-1 px-1.5 text-center w-20">Cek Tabung</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cart.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-1 px-1.5 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-1 px-1.5 font-mono font-semibold text-slate-800">{item.productId}</td>
                        <td className="py-1 px-1.5">
                          <div className="font-bold text-slate-950">{item.name}</div>
                          {item.shortageFee && item.shortageFee > 0 ? (
                            <div className="text-[9px] text-amber-800 italic">
                              +Biaya Tabung: Rp {item.shortageFee.toLocaleString('id-ID')}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-1 px-1.5 text-center font-mono font-bold">{item.qty} {item.unit || 'pcs'}</td>
                        {printDocType === 'invoice' && (
                          <>
                            <td className="py-1 px-1.5 text-right font-mono">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                            <td className="py-1 px-1.5 text-right font-mono font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                          </>
                        )}
                        {printDocType === 'surat_jalan' && (
                          <>
                            <td className="py-1 px-1.5 text-center font-mono">[  ] Ok</td>
                            <td className="py-1 px-1.5 text-center font-mono">{item.isGalonRefill ? '[  ] Tabung' : '-'}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Calculation Totals (for Invoice) */}
                {printDocType === 'invoice' && (
                  <div className="border-t border-slate-300 pt-2 space-y-0.5 text-[10px] text-right font-mono mb-4">
                    <div>Subtotal: Rp {subtotal.toLocaleString('id-ID')}</div>
                    {calculatedDiscount > 0 && (
                      <div className="text-rose-600">Diskon: -Rp {calculatedDiscount.toLocaleString('id-ID')}</div>
                    )}
                    {isPpnActive && (
                      <div>PPN ({effectivePpnRate}%): +Rp {ppnAmount.toLocaleString('id-ID')}</div>
                    )}
                    <div className="text-xs font-black pt-1 border-t border-slate-900 text-slate-950">
                      TOTAL TAGIHAN: Rp {grandTotal.toLocaleString('id-ID')}
                    </div>
                    {(() => {
                      const prof = getDepoProfile();
                      return (
                        <div className="text-[9px] text-slate-700 font-sans font-medium pt-1">
                          Transfer: <strong>{prof.bankName} {prof.bankAccount}</strong> (a/n {prof.bankHolder})
                        </div>
                      );
                    })()}
                    {paymentMethod === 'Tunai' && (
                      <div className="text-[9.5px] text-slate-600">
                        Bayar Tunai: Rp {cashReceived.toLocaleString('id-ID')} • Kembalian: Rp {Math.max(0, changeAmount).toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                )}

                {/* Tanda Tangan 2 Pihak / 3 Pihak */}
                <div className="mt-4 pt-3 border-t border-dashed border-slate-400 grid grid-cols-2 gap-4 text-center text-[9.5px]">
                  <div>
                    <div className="font-bold text-slate-800">Penerima Barang / Toko</div>
                    <div className="h-10"></div>
                    <div className="border-t border-slate-400 inline-block px-6 font-semibold">
                      ( {customerName || selectedCustomer?.name || '........................'} )
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      {printDocType === 'invoice' ? 'Kasir Depo' : 'Petugas Gudang / Supir'}
                    </div>
                    <div className="h-10"></div>
                    <div className="border-t border-slate-400 inline-block px-6 font-semibold">
                      ( Admin Operasional Depo )
                    </div>
                  </div>
                </div>

                <div className="text-center text-[8.5px] text-slate-500 mt-3 pt-2 border-t border-slate-200">
                  Dokumen sah dicetak secara otomatis oleh Sistem JacS DepoHub Pro • {new Date().toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-3 px-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Pilih printer A5 atau Thermal pada jendela cetak browser.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs cursor-pointer shadow-md transition-all flex items-center gap-2 active:scale-95"
                >
                  <i className="fa-solid fa-print"></i>
                  <span>Cetak Sekarang (window.print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer hover:bg-slate-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APPROVAL ORDER LAPANGAN / SPOT SUPIR */}
      <SpotOrderApprovalModal
        isOpen={showSpotApprovalModal}
        onClose={() => setShowSpotApprovalModal(false)}
        orders={orders}
        armadaList={armadaList}
        onApproveDriverOrder={(orderId) => onApproveDriverOrder?.(orderId)}
        onScheduleNextDrop={(orderId) => onScheduleNextDrop?.(orderId)}
        preselectedOrderId={preselectedSpotOrderId}
      />
    </div>
  );
};
