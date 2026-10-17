import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  OrderItem,
  ProductMasterItem,
  GallonStock,
  ArmadaItem,
  EmployeeItem,
  ReceivableItem,
  KasirTransaction,
  PurchaseOrderItem,
  InboundDropItem,
  PettyCashItem,
} from '../types';
import { INITIAL_PETTY_CASH } from '../data/mockData';
import { GlowingChartsPanel } from './executive/GlowingChartsPanel';
import { PettyCashPanel } from './executive/PettyCashPanel';
import { FinancialReportPanel } from './executive/FinancialReportPanel';
import { ExecutiveAiAdvisor } from './executive/ExecutiveAiAdvisor';
import { calculateStockWarning, StockWarningDetail, generateMarqueeWarningText } from '../utils/stockWarning';
import {
  ShieldAlert,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Clock,
  Send,
  Plus,
  Check,
  Search,
  Percent,
  CircleDollarSign,
  FileSpreadsheet,
  AlertOctagon,
  BarChart3,
  Boxes,
  Wallet,
  FileText,
  Sparkles,
  Phone,
  ChevronDown,
} from 'lucide-react';

interface ExecutiveManagerViewProps {
  orders?: OrderItem[];
  products?: ProductMasterItem[];
  gallonCirculation?: GallonStock[];
  armadaList?: ArmadaItem[];
  employees?: EmployeeItem[];
  receivables?: ReceivableItem[];
  kasirTransactions?: KasirTransaction[];
  purchaseOrders?: PurchaseOrderItem[];
  inboundDrops?: InboundDropItem[];
  onUpdateGallonCirculation?: (newStock: GallonStock[]) => void;
  onLockSession: () => void;
}

export const ExecutiveManagerView: React.FC<ExecutiveManagerViewProps> = ({
  orders = [],
  products = [],
  gallonCirculation = [],
  armadaList = [],
  employees = [],
  receivables = [],
  kasirTransactions = [],
  purchaseOrders: propPurchaseOrders,
  inboundDrops = [],
  onUpdateGallonCirculation,
  onLockSession,
}) => {
  type ManagerTab = 'ai_advisor' | 'charts' | 'petty_cash' | 'laporan' | 'asset' | 'performance' | 'procurement';
  const [activeTab, setActiveTab] = useState<ManagerTab>('ai_advisor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Deteksi Realtime Produk Stok Kritis (Threshold <= 30%) untuk Ticker Khusus Executive Manager
  const marqueeInfo = useMemo(() => {
    return generateMarqueeWarningText(products);
  }, [products]);

  // Toggle Pemilah Omzet Eksekutif: [Semua] | [Air Minum] | [FMCG Sembako] | [Non-FMCG]
  const [execOmzetFilter, setExecOmzetFilter] = useState<'SEMUA' | 'AIR_MINUM' | 'FMCG_SEMBAKO' | 'NON_FMCG'>('SEMUA');

  const segmentedExecRevenue = useMemo(() => {
    let air = 0;
    let fmcg = 0;
    let nonFmcg = 0;

    orders.forEach((o) => {
      const low = (o.items || '').toLowerCase();
      if (low.includes('beras') || low.includes('minyak') || low.includes('telur') || low.includes('gula') || low.includes('indomie') || low.includes('kopi') || low.includes('sunlight') || low.includes('rinso')) {
        fmcg += o.totalAmount;
      } else if (low.includes('dispenser') || low.includes('pompa') || low.includes('rak') || low.includes('tisu')) {
        nonFmcg += o.totalAmount;
      } else {
        air += o.totalAmount;
      }
    });

    kasirTransactions.forEach((k) => {
      if (k.cartItems && k.cartItems.length > 0) {
        k.cartItems.forEach((it) => {
          const prod = products.find((p) => p.id === it.productId);
          const pCat = it.parentCategory || prod?.parentCategory;
          const sub = it.subtotal || (it.qty * it.unitPrice);
          if (pCat === 'AIR_MINUM') air += sub;
          else if (pCat === 'FMCG_FOOD' || pCat === 'FMCG_NON_FOOD') fmcg += sub;
          else if (pCat === 'NON_FMCG_LOGISTIK') nonFmcg += sub;
          else air += sub;
        });
      } else {
        air += Math.round((k.totalAmount || 0) * 0.70);
        fmcg += Math.round((k.totalAmount || 0) * 0.22);
        nonFmcg += Math.round((k.totalAmount || 0) * 0.08);
      }
    });

    const total = air + fmcg + nonFmcg || 1;
    return {
      SEMUA: total,
      AIR_MINUM: air,
      FMCG_SEMBAKO: fmcg,
      NON_FMCG: nonFmcg,
    };
  }, [orders, kasirTransactions, products]);

  const currentExecOmzet = segmentedExecRevenue[execOmzetFilter];

  // Auto-Scroll ke bagian atas saat ExecutiveManagerView dibuka atau tab navigasi berganti
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Petty Cash State
  const [pettyCashList, setPettyCashList] = useState<PettyCashItem[]>(() => {
    try {
      const saved = localStorage.getItem('argus_petty_cash');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PETTY_CASH;
  });

  const [pettyCashPlafon, setPettyCashPlafon] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('argus_petty_cash_plafon');
      if (saved) return Number(saved);
    } catch {}
    return 2500000;
  });

  const handleUpdatePettyCash = (items: PettyCashItem[]) => {
    setPettyCashList(items);
    try {
      localStorage.setItem('argus_petty_cash', JSON.stringify(items));
    } catch {}
    showToast('✓ Buku Kas Kecil Berhasil Disinkronkan');
  };

  const handleUpdatePlafon = (newPlafon: number) => {
    setPettyCashPlafon(newPlafon);
    try {
      localStorage.setItem('argus_petty_cash_plafon', newPlafon.toString());
    } catch {}
    showToast('✓ Plafon Kas Kecil Berhasil Diubah');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // TAB 1: AUDIT LABA RUGI & KEUANGAN DETAIL (CALCULATIONS)
  // -------------------------------------------------------------
  const pnlData = useMemo(() => {
    // 1. Gross Revenue (Omzet Kotor)
    const orderOmzet = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const kasirOmzet = kasirTransactions.reduce((sum, k) => sum + (k.totalAmount || 0), 0);
    const grossRevenue = orderOmzet + kasirOmzet;

    // Revenue Breakdown (Galon 19L vs Dus Kemasan)
    let revenueGallon = 0;
    let revenueDus = 0;
    orders.forEach((o) => {
      const itemsStr = (o.items || '').toLowerCase();
      if (itemsStr.includes('dus') || itemsStr.includes('botol') || itemsStr.includes('vit 600') || itemsStr.includes('330ml')) {
        const estDus = Math.round(o.totalAmount * 0.35);
        revenueDus += estDus;
        revenueGallon += (o.totalAmount - estDus);
      } else {
        revenueGallon += o.totalAmount;
      }
    });
    kasirTransactions.forEach((k) => {
      revenueGallon += (k.totalAmount || 0);
    });

    if (revenueGallon === 0 && revenueDus === 0 && grossRevenue > 0) {
      revenueGallon = Math.round(grossRevenue * 0.85);
      revenueDus = Math.round(grossRevenue * 0.15);
    }

    // 2. Total HPP (Cost of Goods Sold)
    let totalHpp = 0;
    orders.forEach((ord) => {
      const matchedProd = products.find((p) => ord.items?.toLowerCase().includes(p.name.toLowerCase()));
      const hppPerUnit = matchedProd?.hpp || 15500;
      totalHpp += (ord.totalGalon || 1) * hppPerUnit;
    });
    kasirTransactions.forEach((trx) => {
      if (trx.cartItems && Array.isArray(trx.cartItems)) {
        trx.cartItems.forEach((it) => {
          const prod = products.find((p) => p.id === it.productId);
          const unitHpp = prod?.hpp || 15000;
          totalHpp += it.qty * unitHpp;
        });
      }
    });

    if (totalHpp === 0 && grossRevenue > 0) {
      totalHpp = Math.round(grossRevenue * 0.76);
    }

    const hppGallon = Math.round(totalHpp * 0.86);
    const hppDus = totalHpp - hppGallon;

    // 3. Gross Profit (Laba Kotor)
    const grossProfit = Math.max(0, grossRevenue - totalHpp);
    const grossMarginPct = grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 100) : 24;

    // 4. Kas Kecil Breakdown (Real Data dari Petty Cash)
    const approvedPetty = pettyCashList.filter((it) => it.status === 'DISETUJUI');
    const fuelCost = approvedPetty.filter((it) => it.category === 'BBM Armada').reduce((s, it) => s + it.amount, 0);
    const driverMealCost = approvedPetty.filter((it) => it.category === 'Uang Makan / Jalan Supir').reduce((s, it) => s + it.amount, 0);
    const suppliesCost = approvedPetty.filter((it) => it.category === 'Pembelian Tisu / Segel Galon').reduce((s, it) => s + it.amount, 0);
    const repairCost = approvedPetty.filter((it) => it.category === 'Tambal Ban & Servis Ringan').reduce((s, it) => s + it.amount, 0);
    const maintenanceCost = approvedPetty.filter((it) => it.category === 'Maintenance Mesin Cuci / Filter').reduce((s, it) => s + it.amount, 0);
    const othersCost = approvedPetty.filter((it) => it.category === 'Operasional Depo Lainnya').reduce((s, it) => s + it.amount, 0);
    const totalPettyCash = approvedPetty.reduce((s, it) => s + it.amount, 0);

    // 5. Operating Expenses (Beban Operasional)
    const commissionCost = Math.round(orders.length * 15000 + kasirTransactions.length * 5000);
    const utilityDepoCost = 180000; // Listrik, air, depresiasi mesin cuci
    const totalOpex = commissionCost + totalPettyCash + utilityDepoCost;

    // 6. Net Profit (Estimasi Laba Bersih)
    const netProfit = grossProfit - totalOpex;
    const netMarginPct = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 15;

    // 7. Real Cashflow Harian
    const cashInflowCash = kasirTransactions.filter((k) => k.paymentMethod === 'Tunai').reduce((s, k) => s + (k.totalAmount || 0), 0);
    const cashInflowTransfer = kasirTransactions.filter((k) => k.paymentMethod === 'Transfer').reduce((s, k) => s + (k.totalAmount || 0), 0);
    const cashInflowQris = kasirTransactions.filter((k) => k.paymentMethod === 'QRIS').reduce((s, k) => s + (k.totalAmount || 0), 0);
    const cashInflowReceivables = 650000; // Pelunasan piutang toko hari ini
    const totalCashInflow = cashInflowCash + cashInflowTransfer + cashInflowQris + cashInflowReceivables;

    const cashOutflowPettyCash = totalPettyCash;
    const cashOutflowCommission = commissionCost;
    const cashOutflowPoProcurement = 4650000; // Pembayaran PO pabrik
    const totalCashOutflow = cashOutflowPettyCash + cashOutflowCommission + cashOutflowPoProcurement;
    const netCashflow = totalCashInflow - (cashOutflowPettyCash + cashOutflowCommission);

    // 8. Neraca Piutang Ringkas
    const totalReceivables = receivables.reduce((s, r) => s + (r.amount || 0), 0) || 4850000;
    const overdueReceivables = Math.round(totalReceivables * 0.28); // > 14 hari
    const currentReceivables = totalReceivables - overdueReceivables; // <= 14 hari
    const collectibilityRatioPct = Math.round((currentReceivables / (totalReceivables || 1)) * 100);

    return {
      grossRevenue,
      totalRevenue: grossRevenue,
      revenueGallon,
      revenueDus,
      totalHpp,
      hppGallon,
      hppDus,
      grossProfit,
      grossMarginPct,
      driverCommissionCost: commissionCost,
      pettyCashBreakdown: {
        fuelCost,
        driverMealCost,
        suppliesCost,
        repairCost,
        maintenanceCost,
        othersCost,
        totalPettyCash,
      },
      utilityCost: utilityDepoCost,
      totalOpex,
      netProfit,
      netMarginPct,
      // Cashflow
      cashInflowCash,
      cashInflowTransfer,
      cashInflowQris,
      cashInflowReceivables,
      totalCashInflow,
      cashOutflowPettyCash,
      cashOutflowCommission,
      cashOutflowPoProcurement,
      totalCashOutflow,
      netCashflow,
      // Piutang
      currentReceivables,
      overdueReceivables,
      totalReceivables,
      collectibilityRatioPct,
      receivablesList: receivables,
    };
  }, [orders, kasirTransactions, products, pettyCashList, receivables]);

  // -------------------------------------------------------------
  // TAB 2: AUDIT STOK & SUSUT ASET (DATA & CALCULATIONS)
  // -------------------------------------------------------------
  const assetData = useMemo(() => {
    const brandBreakdown = [
      {
        brand: 'Aqua 19L',
        totalAsset: 620,
        filled: 450,
        emptyInDepo: 90,
        loanedToStores: 80,
        damaged: 6,
        turnoverDays: 3.2,
        turnoverRate: 'Tinggi (Cepat)',
        color: '#06b6d4',
      },
      {
        brand: 'Le Minerale 15L',
        totalAsset: 280,
        filled: 190,
        emptyInDepo: 50,
        loanedToStores: 40,
        damaged: 4,
        turnoverDays: 4.1,
        turnoverRate: 'Stabil',
        color: '#10b981',
      },
      {
        brand: 'Cleo Smart Gallon',
        totalAsset: 160,
        filled: 110,
        emptyInDepo: 30,
        loanedToStores: 20,
        damaged: 2,
        turnoverDays: 4.8,
        turnoverRate: 'Sedang',
        color: '#f97316',
      },
      {
        brand: 'Vit 19L',
        totalAsset: 110,
        filled: 70,
        emptyInDepo: 25,
        loanedToStores: 15,
        damaged: 2,
        turnoverDays: 5.5,
        turnoverRate: 'Sedang',
        color: '#ec4899',
      },
    ];

    const totalPopulation = brandBreakdown.reduce((s, b) => s + b.totalAsset, 0);
    const totalFilled = brandBreakdown.reduce((s, b) => s + b.filled, 0);
    const totalEmptyDepo = brandBreakdown.reduce((s, b) => s + b.emptyInDepo, 0);
    const totalLoaned = brandBreakdown.reduce((s, b) => s + b.loanedToStores, 0);
    const totalDamaged = brandBreakdown.reduce((s, b) => s + b.damaged, 0);
    const estimatedLossRp = totalDamaged * 40000; // Rp 40.000 estimasi nilai per tabung rusak

    // Warung dengan galon tertahan > 14 hari
    const overdueStores = [
      {
        id: 'OV-01',
        storeName: 'Toko Sumber Rejeki (Pak Haris)',
        phone: '0812-3344-5566',
        daysHeld: 19,
        emptyGallonsHeld: 18,
        brand: 'Aqua 19L',
        depositHeld: 720000,
        address: 'Jl. Ahmad Yani No. 45, Subang',
      },
      {
        id: 'OV-02',
        storeName: 'Warung Bu Siti Cipeundeuy',
        phone: '0813-8877-9922',
        daysHeld: 16,
        emptyGallonsHeld: 12,
        brand: 'Aqua & Le Minerale',
        depositHeld: 480000,
        address: 'Pasar Baru Cipeundeuy Kios B-12',
      },
      {
        id: 'OV-03',
        storeName: 'Pangkalan Berkah Jaya (Kang Asep)',
        phone: '0857-1122-4499',
        daysHeld: 15,
        emptyGallonsHeld: 15,
        brand: 'Cleo 19L',
        depositHeld: 600000,
        address: 'Komplek Griya Asri Blok D No. 8',
      },
    ];

    return {
      brandBreakdown,
      totalPopulation,
      totalFilled,
      totalEmptyDepo,
      totalLoaned,
      totalDamaged,
      estimatedLossRp,
      overdueStores,
    };
  }, []);

  // -------------------------------------------------------------
  // TAB 3: KINERJA KARYAWAN & ARMADA (KPI & PRODUCTIVITY)
  // -------------------------------------------------------------
  const employeePerformance = useMemo(() => {
    return [
      {
        driverId: 'DRV-01',
        name: 'Pak Bambang Sukoco',
        role: 'Supir Utama Carry Pickup',
        vehicle: 'Carry Pickup (B 9421 KDA)',
        ritase: 4,
        gallonsDelivered: 165,
        casesDelivered: 42,
        avgDropSpeedMinutes: 19,
        successRatePct: 100,
        totalCommissionToday: 135000,
        fuelCostToday: 85000,
        fuelEfficiency: '2.4 Gln/Km',
        status: 'Sedang Mengantar (Drop #4)',
        rating: 4.9,
      },
      {
        driverId: 'DRV-02',
        name: 'Pak Supriadi',
        role: 'Supir Truk Canter Engkel',
        vehicle: 'Truk Canter (B 9012 SUB)',
        ritase: 3,
        gallonsDelivered: 240,
        casesDelivered: 60,
        avgDropSpeedMinutes: 24,
        successRatePct: 98,
        totalCommissionToday: 185000,
        fuelCostToday: 140000,
        fuelEfficiency: '2.8 Gln/Km',
        status: 'Bongkar Muatan di Depo',
        rating: 4.8,
      },
      {
        driverId: 'DRV-03',
        name: 'Kang Dian Kurnia',
        role: 'Kurir Motor Roda 3 Viar',
        vehicle: 'Motor Viar (D 4819 ZK)',
        ritase: 6,
        gallonsDelivered: 95,
        casesDelivered: 20,
        avgDropSpeedMinutes: 14,
        successRatePct: 100,
        totalCommissionToday: 95000,
        fuelCostToday: 40000,
        fuelEfficiency: '3.1 Gln/Km',
        status: 'Standby Rayon Dalam Kota',
        rating: 5.0,
      },
      {
        driverId: 'DRV-04',
        name: 'Pak Hendra Wijaya',
        role: 'Supir Cadangan / Logistik',
        vehicle: 'Carry Pickup (B 9553 KDA)',
        ritase: 2,
        gallonsDelivered: 75,
        casesDelivered: 15,
        avgDropSpeedMinutes: 22,
        successRatePct: 100,
        totalCommissionToday: 65000,
        fuelCostToday: 55000,
        fuelEfficiency: '2.2 Gln/Km',
        status: 'Selesai Antar',
        rating: 4.7,
      },
    ];
  }, []);

  // -------------------------------------------------------------
  // TAB 4: PENGADAAN & PO PABRIK (DATA & VALIDATION)
  // -------------------------------------------------------------
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>(() => {
    if (propPurchaseOrders && propPurchaseOrders.length > 0) return propPurchaseOrders;
    try {
      const saved = localStorage.getItem('argus_purchase_orders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'PO-2026-001',
        poNumber: 'PO/JACS/DANONE/2026/10/001',
        date: '2026-10-02',
        supplier: 'PT Tirta Investama (Aqua)',
        items: [
          {
            productId: 'SKU-GLN-001',
            productName: 'Aqua 19L Galon Asli',
            currentStock: 350,
            recommendedQty: 300,
            orderQty: 300,
            unit: 'Tabung',
            unitPrice: 15500,
            subtotal: 4650000,
          },
        ],
        totalAmount: 4650000,
        status: 'DIKONFIRMASI_PABRIK',
        etaNote: 'Truk Tronton Masuk 08:30 WIB Besok',
        notes: 'Penebusan PO Kuota Awal Bulan',
      },
      {
        id: 'PO-2026-002',
        poNumber: 'PO/JACS/MAYORA/2026/09/004',
        date: '2026-09-29',
        supplier: 'PT Mayora Tirta (Le Minerale)',
        items: [
          {
            productId: 'SKU-GLN-002',
            productName: 'Le Minerale 15L Galon',
            currentStock: 180,
            recommendedQty: 200,
            orderQty: 200,
            unit: 'Tabung',
            unitPrice: 14000,
            subtotal: 2800000,
          },
        ],
        totalAmount: 2800000,
        status: 'SELESAI',
        etaNote: 'Selesai Dibongkar',
        notes: 'Penebusan Stok Akhir Bulan',
      },
    ];
  });

  const [poForm, setPoForm] = useState({
    supplier: 'PT Tirta Investama (Aqua)',
    productName: 'Aqua 19L Galon Asli',
    qty: 300,
    unitPrice: 15500,
    etaNote: 'Estimasi Kedatangan: Besok Pagi 08:00 WIB',
  });

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const total = poForm.qty * poForm.unitPrice;
    const newPO: PurchaseOrderItem = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      poNumber: `PO/JACS/${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      supplier: poForm.supplier,
      items: [
        {
          productId: 'SKU-NEW',
          productName: poForm.productName,
          currentStock: 250,
          recommendedQty: poForm.qty,
          orderQty: poForm.qty,
          unit: 'Tabung',
          unitPrice: poForm.unitPrice,
          subtotal: total,
        },
      ],
      totalAmount: total,
      status: 'DIKIRIM_KE_PABRIK',
      etaNote: poForm.etaNote,
      notes: 'Penerbitan Kontrak Pengadaan Eksekutif',
    };
    const updated = [newPO, ...purchaseOrders];
    setPurchaseOrders(updated);
    try {
      localStorage.setItem('argus_purchase_orders', JSON.stringify(updated));
    } catch {}
    showToast(`✓ PO Pabrik #${newPO.poNumber} Berhasil Diterbitkan ke ${poForm.supplier}!`);
  };

  const handleValidateArrival = (poId: string) => {
    const target = purchaseOrders.find((p) => p.id === poId);
    if (!target) return;

    const updated = purchaseOrders.map((p) =>
      p.id === poId ? { ...p, status: 'SELESAI' as const } : p
    );
    setPurchaseOrders(updated);
    try {
      localStorage.setItem('argus_purchase_orders', JSON.stringify(updated));
    } catch {}

    // Update circulation if available
    if (onUpdateGallonCirculation && gallonCirculation.length > 0) {
      const addedQty = target.items.reduce((s, it) => s + it.orderQty, 0);
      const updatedCirc = gallonCirculation.map((g, idx) =>
        idx === 0 ? { ...g, filled: g.filled + addedQty, empty: Math.max(0, g.empty - addedQty) } : g
      );
      onUpdateGallonCirculation(updatedCirc);
      try {
        localStorage.setItem('argus_gallon_circulation', JSON.stringify(updatedCirc));
      } catch {}
    }

    showToast(`🎉 Validasi Bongkar Muat Selesai! Stok barang dari ${target.supplier} resmi masuk ke gudang.`);
  };

  const handleSendOverdueWarningWA = (store: any) => {
    const text = `Halo Yth. *${store.storeName}*,\n\nKami dari Manajemen Depo ingin mengonfirmasi bahwa saat ini tercatat ada *${store.emptyGallonsHeld} Tabung Galon Kosong (${store.brand})* yang tertahan selama *${store.daysHeld} hari* di lokasi Anda.\n\nMohon bantuannya untuk menyiapkan penarikan tabung kosong tersebut agar tidak terkena denda selisih saldo deposit galon. Terima kasih! 🙏💧`;
    const cleanPhone = store.phone.replace(/\D/g, '').replace(/^0/, '62');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Rekomendasi Restock PO Pabrik Realtime: Urutkan produk <= 30% di paling atas (critical <= 10% dahulu)
  const restockRecommendations = useMemo(() => {
    if (!products || products.length === 0) return [];
    const details = products.map(calculateStockWarning);
    return [...details].sort((a, b) => {
      const order = { critical: 0, warning: 1, safe: 2 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return a.remainingPct - b.remainingPct;
    });
  }, [products]);

  const [isRestockAccordionOpen, setIsRestockAccordionOpen] = useState(true);

  const handleSendWhatsAppPOFromManager = (d: StockWarningDetail) => {
    const supplierPhone = d.product.supplierContact || '081122334455';
    const cleanPhone = supplierPhone.replace(/\D/g, '').replace(/^0/, '62');
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const text =
      `*SURAT PESANAN RESTOCK (PURCHASE ORDER)*\n` +
      `Nomor PO: #${poNumber}\n` +
      `Kepada: *${d.product.supplier || 'Principal Pabrik Terdaftar'}* (Sales PIC Pabrik)\n` +
      `Dari: JacS DepoHub Logistik & Distribusi\n` +
      `----------------------------------------\n` +
      `Mohon konfirmasi dan proses pesanan restock darurat depo:\n` +
      `• *Produk:* ${d.product.name} [SKU: ${d.product.id}]\n` +
      `• *Sisa Stok Depo:* ${d.currentStock} ${d.product.unit} (Sisa ${d.remainingPct}%, Status: ${d.status === 'critical' ? 'KRITIS' : 'MENIPIS'})\n` +
      `• *Kuantitas Order:* *${d.restockRecommendedQty} ${d.product.unit}* (Target Buffer 100%)\n` +
      `• *Harga Tebus HPP:* Rp ${Number(d.product.hpp || 0).toLocaleString('id-ID')}/${d.product.unit}\n` +
      `• *Estimasi Nilai PO:* Rp ${d.estimatedCostRp.toLocaleString('id-ID')}\n` +
      `----------------------------------------\n` +
      `Mohon jadwal estimasi kedatangan armada pengiriman pabrik masuk ke depo. Terima kasih!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleApplyToPoForm = (d: StockWarningDetail) => {
    setPoForm({
      supplier: d.product.supplier || 'PT Tirta Investama (Aqua)',
      productName: d.product.name,
      qty: d.restockRecommendedQty,
      unitPrice: Number(d.product.hpp || 15000),
      etaNote: `Restock Darurat Stok ${d.remainingPct}%`,
    });
    showToast(`✓ Data ${d.product.name} dimasukkan ke Form PO`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden text-slate-100 [body.light-theme_&]:text-slate-800">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-rose-500 text-white font-bold text-xs shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar Executive Manager */}
      <div className="glass-panel p-3 sm:p-4 rounded-xl border border-rose-900/60 [body.light-theme_&]:bg-white [body.light-theme_&]:border-rose-300 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-pink-700 flex items-center justify-center text-white shadow-[0_0_16px_rgba(244,63,94,0.45)] border border-rose-400/50">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider">
                Executive Manager • Deep Monitoring
              </h2>
              <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                AUDIT DETAIL
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
              Audit Mikro Finansial Laba Rugi, Susut Aset Tabung, Produktivitas Armada & Pengadaan Pabrik
            </p>
          </div>
        </div>

        {/* Lock Session Button */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SESI MONITORING AKTIF</span>
          </div>

          <button
            type="button"
            onClick={onLockSession}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Kunci sesi manajer dan kembali ke tampilan Beranda"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci Sesi Manajer</span>
          </button>
        </div>
      </div>

      {/* 7 Executive Monitoring Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl shrink-0">
        <button
          onClick={() => setActiveTab('ai_advisor')}
          className={`flex-1 min-w-[145px] py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
            activeTab === 'ai_advisor'
              ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white border-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.55)]'
              : 'text-purple-900 hover:text-purple-950 dark:text-purple-300 dark:hover:text-white border-purple-300 dark:border-purple-500/30 bg-purple-100 dark:bg-purple-950/20 font-bold'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 animate-pulse" />
          <span>✨ AI Financial Advisor</span>
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 min-w-[130px] py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'charts'
              ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>1. Visual Chart & KPI Neon</span>
        </button>

        <button
          onClick={() => setActiveTab('petty_cash')}
          className={`flex-1 min-w-[130px] py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'petty_cash'
              ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>2. Kontrol Kas Kecil</span>
        </button>

        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex-1 min-w-[130px] py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'laporan'
              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>3. Laporan Keuangan & Bisnis</span>
        </button>

        <button
          onClick={() => setActiveTab('asset')}
          className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'asset'
              ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>4. Susut & Sirkulasi Aset</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'performance'
              ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>5. Kinerja Armada</span>
        </button>

        <button
          onClick={() => setActiveTab('procurement')}
          className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'procurement'
              ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>6. Pengadaan PO</span>
        </button>
      </div>

      {/* TOGGLE PEMILAH OMZET EKSEKUTIF */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 [body.light-theme_&]:bg-white border border-rose-900/60 [body.light-theme_&]:border-rose-200 shadow-sm">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wide">
            Pemilah Omzet & Analisis Segmen:
          </span>
          <span className="text-[10px] font-mono text-rose-300 [body.light-theme_&]:text-rose-800 font-bold px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30">
            Rp {currentExecOmzet.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950/80 [body.light-theme_&]:bg-slate-100 p-0.5 rounded-lg border border-slate-800 [body.light-theme_&]:border-slate-300 text-xs font-bold">
          <button
            type="button"
            onClick={() => setExecOmzetFilter('SEMUA')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              execOmzetFilter === 'SEMUA'
                ? 'bg-rose-600 text-white font-black shadow-sm'
                : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
            }`}
          >
            [Semua]
          </button>
          <button
            type="button"
            onClick={() => setExecOmzetFilter('AIR_MINUM')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              execOmzetFilter === 'AIR_MINUM'
                ? 'bg-cyan-600 text-white font-black shadow-sm'
                : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
            }`}
          >
            [Air Minum]
          </button>
          <button
            type="button"
            onClick={() => setExecOmzetFilter('FMCG_SEMBAKO')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              execOmzetFilter === 'FMCG_SEMBAKO'
                ? 'bg-emerald-600 text-white font-black shadow-sm'
                : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
            }`}
          >
            [FMCG Sembako]
          </button>
          <button
            type="button"
            onClick={() => setExecOmzetFilter('NON_FMCG')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              execOmzetFilter === 'NON_FMCG'
                ? 'bg-purple-600 text-white font-black shadow-sm'
                : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
            }`}
          >
            [Non-FMCG]
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
        
        {/* ========================================================
            TAB 0: AI FINANCIAL & OPERATIONAL ADVISOR
            ======================================================== */}
        {activeTab === 'ai_advisor' && (
          <ExecutiveAiAdvisor
            orders={orders}
            products={products}
            gallonCirculation={gallonCirculation}
            armadaList={armadaList}
            receivables={receivables}
            kasirTransactions={kasirTransactions}
            pettyCashList={pettyCashList}
            purchaseOrders={purchaseOrders}
            onNavigateTab={(tab) => setActiveTab(tab as ManagerTab)}
          />
        )}

        {/* ========================================================
            TAB 1: VISUAL CHART & KPI NEON
            ======================================================== */}
        {activeTab === 'charts' && (
          <GlowingChartsPanel
            grossRevenue={pnlData.grossRevenue}
            totalHpp={pnlData.totalHpp}
            pettyCashCost={pnlData.pettyCashBreakdown.totalPettyCash}
            netProfit={pnlData.netProfit}
            assetStats={{
              total: assetData.totalPopulation,
              filled: assetData.totalFilled,
              emptyInDepo: assetData.totalEmptyDepo,
              loanedToStores: assetData.totalLoaned,
              damaged: assetData.totalDamaged,
              estimatedLossRp: assetData.estimatedLossRp,
            }}
          />
        )}

        {/* ========================================================
            TAB 2: KONTROL KAS KECIL & OTORISASI BIAYA
            ======================================================== */}
        {activeTab === 'petty_cash' && (
          <PettyCashPanel
            pettyCashList={pettyCashList}
            plafon={pettyCashPlafon}
            onUpdatePettyCash={handleUpdatePettyCash}
            onUpdatePlafon={handleUpdatePlafon}
          />
        )}

        {/* ========================================================
            TAB 3: LAPORAN KEUANGAN & BISNIS (STANDAR AKUNTANSI)
            ======================================================== */}
        {activeTab === 'laporan' && (
          <div className="space-y-4">
            <FinancialReportPanel reportData={pnlData} />

            {/* Audit Mikro Transaksi Table */}
            <div className="glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-950/80 [body.light-theme_&]:bg-slate-100 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-rose-400" />
                  <span>Audit Detail Mikro Transaksi (Per Order Penjualan)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Menampilkan {orders.length} Faktur
                </span>
              </div>

              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-950 [body.light-theme_&]:bg-slate-200 text-[10px] font-black uppercase text-slate-400 [body.light-theme_&]:text-slate-700 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">No. Faktur / Toko</th>
                      <th className="py-2 px-3">Item Muatan</th>
                      <th className="py-2 px-3 text-right">Omzet Kotor</th>
                      <th className="py-2 px-3 text-right">Estimasi HPP</th>
                      <th className="py-2 px-3 text-right">Laba Kotor</th>
                      <th className="py-2 px-3 text-center">Metode / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200 font-mono text-[11px]">
                    {orders.map((ord) => {
                      const estHpp = Math.round(ord.totalAmount * 0.77);
                      const estMargin = ord.totalAmount - estHpp;
                      return (
                        <tr key={ord.id} className="hover:bg-slate-900/40 [body.light-theme_&]:hover:bg-slate-50">
                          <td className="py-2 px-3 font-sans">
                            <strong className="text-white [body.light-theme_&]:text-slate-900 block leading-tight">{ord.customerName}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">#{ord.id}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-300 [body.light-theme_&]:text-slate-700 truncate max-w-xs font-sans">
                            {ord.items}
                          </td>
                          <td className="py-2 px-3 text-right text-cyan-400 font-bold">
                            Rp {ord.totalAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-right text-rose-400">
                            Rp {estHpp.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                            +Rp {estMargin.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                              ord.paymentStatus === 'Lunas'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {ord.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: AUDIT STOK & SUSUT ASET
            ======================================================== */}
        {activeTab === 'asset' && (
          <div className="space-y-3">
            {/* Top 4 Asset Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Populasi Tabung Depo</span>
                <span className="text-base sm:text-lg font-black text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono">
                  {assetData.totalPopulation} Tabung
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Asset Modal Perusahaan</span>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Siaga Terisi di Gudang</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 font-mono">
                  {assetData.totalFilled} Tabung ({Math.round((assetData.totalFilled / assetData.totalPopulation) * 100)}%)
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Siap Dikirim Armada</span>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Beredar di Pelanggan</span>
                <span className="text-base sm:text-lg font-black text-amber-400 [body.light-theme_&]:text-amber-700 font-mono">
                  {assetData.totalLoaned} Tabung ({Math.round((assetData.totalLoaned / assetData.totalPopulation) * 100)}%)
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Dipinjamkan ke Warung</span>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-rose-500/50 [body.light-theme_&]:bg-white [body.light-theme_&]:border-rose-400 shadow-md">
                <span className="text-[10px] text-rose-400 uppercase font-black tracking-wider block">Susut Aset (Rusak/Afkir)</span>
                <span className="text-base sm:text-lg font-black text-rose-400 [body.light-theme_&]:text-rose-700 font-mono">
                  {assetData.totalDamaged} Tabung
                </span>
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">Nilai Rugi: Rp {assetData.estimatedLossRp.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Brand Circulation & Turnover Breakdown */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center justify-between">
                <span>Rasio Perputaran Sirkulasi Tabung per Merek (Turnover Analysis)</span>
                <span className="text-[10px] text-slate-400 font-mono">Audit Siklus Depo</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assetData.brandBreakdown.map((item) => {
                  const filledPct = Math.round((item.filled / item.totalAsset) * 100);
                  const emptyPct = Math.round((item.emptyInDepo / item.totalAsset) * 100);
                  const storePct = Math.round((item.loanedToStores / item.totalAsset) * 100);

                  return (
                    <div
                      key={item.brand}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200 space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <strong className="text-white [body.light-theme_&]:text-slate-900 text-xs font-black">{item.brand}</strong>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-bold">
                          Perputaran: {item.turnoverDays} Hari ({item.turnoverRate})
                        </span>
                      </div>

                      {/* Segmented Progress Bar */}
                      <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden flex">
                        <div style={{ width: `${filledPct}%`, backgroundColor: '#10b981' }} title={`Terisi: ${item.filled}`}></div>
                        <div style={{ width: `${emptyPct}%`, backgroundColor: '#06b6d4' }} title={`Kosong Depo: ${item.emptyInDepo}`}></div>
                        <div style={{ width: `${storePct}%`, backgroundColor: '#f59e0b' }} title={`Di Toko: ${item.loanedToStores}`}></div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-center pt-1 border-t border-slate-800">
                        <div>
                          <span className="text-emerald-400 block font-bold">{item.filled} Gln</span>
                          <span className="text-slate-500">Terisi ({filledPct}%)</span>
                        </div>
                        <div>
                          <span className="text-cyan-400 block font-bold">{item.emptyInDepo} Gln</span>
                          <span className="text-slate-500">Kosong ({emptyPct}%)</span>
                        </div>
                        <div>
                          <span className="text-amber-400 block font-bold">{item.loanedToStores} Gln</span>
                          <span className="text-slate-500">Di Warung ({storePct}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Susut Aset: Toko Macet Tabung > 14 Hari */}
            <div className="glass-panel p-4 rounded-xl border border-rose-900/60 [body.light-theme_&]:bg-white [body.light-theme_&]:border-rose-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Peringatan Risiko Aset: Galon Tertahan di Toko &gt; 14 Hari</span>
                  </h3>
                  <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
                    Toko yang menahan tabung kosong depo melewati batas wajar dan berpotensi menjadi kerugian aset.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold">
                  {assetData.overdueStores.length} Toko Berisiko
                </span>
              </div>

              <div className="space-y-2">
                {assetData.overdueStores.map((store) => (
                  <div
                    key={store.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-white [body.light-theme_&]:text-slate-900 font-black">{store.storeName}</strong>
                        <span className="text-[9.5px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">
                          Tertahan {store.daysHeld} Hari
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600">
                        {store.address} • Kontak: <strong className="text-cyan-400 font-mono">{store.phone}</strong>
                      </p>
                      <p className="text-[11px] text-amber-300 font-mono">
                        Jumlah Tabung: <strong>{store.emptyGallonsHeld} Tabung ({store.brand})</strong> • Jaminan Deposit: Rp {store.depositHeld.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendOverdueWarningWA(store)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Teguran WA Tagih Galon</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: KINERJA KARYAWAN & ARMADA
            ======================================================== */}
        {activeTab === 'performance' && (
          <div className="space-y-3">
            {/* Top Employee Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Armada Operasional</span>
                <span className="text-base sm:text-lg font-black text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono">
                  4 Kendaraan
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Carry, Canter, Viar</span>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Ritase Selesai</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 font-mono">
                  15 Trip
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Rata-rata 3.75 Trip/Supir</span>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Rata-rata Durasi Drop</span>
                <span className="text-base sm:text-lg font-black text-amber-400 [body.light-theme_&]:text-amber-700 font-mono">
                  19.7 Menit
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Per Toko / Warung</span>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Komisi Supir Dibukukan</span>
                <span className="text-base sm:text-lg font-black text-rose-400 [body.light-theme_&]:text-rose-700 font-mono">
                  Rp 480.000
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Komisi Pengantaran & Sales</span>
              </div>
            </div>

            {/* Driver Performance Table */}
            <div className="glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-950/80 [body.light-theme_&]:bg-slate-100 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-400" />
                  <span>Matriks Produktivitas & Efisiensi Supir Pengiriman</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Audit Kinerja Shift 07:00 - 17:00 WIB</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 [body.light-theme_&]:bg-slate-200 text-[10px] font-black uppercase text-slate-400 [body.light-theme_&]:text-slate-700 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Nama Supir & Armada</th>
                      <th className="py-2.5 px-3 text-center">Ritase Hari Ini</th>
                      <th className="py-2.5 px-3 text-right">Volume Diantar</th>
                      <th className="py-2.5 px-3 text-center">Kecepatan Drop</th>
                      <th className="py-2.5 px-3 text-center">Rasio Sukses</th>
                      <th className="py-2.5 px-3 text-right">Komisi Harian</th>
                      <th className="py-2.5 px-3 text-center">Status Operasional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200 font-mono text-[11px]">
                    {employeePerformance.map((emp) => (
                      <tr key={emp.driverId} className="hover:bg-slate-900/40 [body.light-theme_&]:hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans">
                          <strong className="text-white [body.light-theme_&]:text-slate-900 block leading-tight">{emp.name}</strong>
                          <span className="text-[10px] text-cyan-400 font-mono">{emp.vehicle}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold text-xs">
                            {emp.ritase} Trip
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <strong className="text-emerald-400">{emp.gallonsDelivered} Galon</strong>
                          <span className="text-[10px] text-slate-400 block">{emp.casesDelivered} Dus</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-300">
                          {emp.avgDropSpeedMinutes} Menit
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-emerald-400 font-black">{emp.successRatePct}%</span>
                          <span className="text-[9.5px] text-slate-500 block">★ {emp.rating}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-400 font-black">
                          Rp {emp.totalCommissionToday.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: PENGADAAN & PO PABRIK
            ======================================================== */}
        {activeTab === 'procurement' && (
          <div className="space-y-3">
            {/* Top 4 Procurement KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">PO Pabrik Aktif</span>
                <span className="text-base sm:text-lg font-black text-amber-400 [body.light-theme_&]:text-amber-700 font-mono">
                  {purchaseOrders.filter((p) => p.status !== 'SELESAI').length} Dokumen
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Menunggu Bongkar Muat</span>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Komitmen Anggaran PO</span>
                <span className="text-base sm:text-lg font-black text-rose-400 [body.light-theme_&]:text-rose-700 font-mono">
                  Rp {purchaseOrders.filter((p) => p.status !== 'SELESAI').reduce((s, p) => s + p.totalAmount, 0).toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Kewajiban Tebus Pabrik</span>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total PO Selesai Bulan Ini</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 font-mono">
                  {purchaseOrders.filter((p) => p.status === 'SELESAI').length} Batch
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Sudah Masuk Aset Gudang</span>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Prinsipal AMDK Terhubung</span>
                <span className="text-base sm:text-lg font-black text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono">
                  4 Pabrik
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Aqua, Le Minerale, Cleo, Vit</span>
              </div>
            </div>

            {/* BILAH / TICKER PERINGATAN LOGISTIK STOK MENIPIS (<= 30%) KHUSUS EXECUTIVE MANAGER */}
            {marqueeInfo.totalLowStockCount > 0 && (
              <div
                id="exec-stock-warning-ticker"
                className="w-full py-2 px-3 rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/60 [body.light-theme_&]:from-rose-50 [body.light-theme_&]:via-white [body.light-theme_&]:to-amber-50 shadow-md flex items-center gap-2.5 overflow-hidden select-none group shrink-0"
                title="Peringatan Stok Menipis (<= 30%) - Arahkan mouse untuk menjeda running text"
              >
                {/* Label Badge [E-WARNING STOK] */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider shrink-0 uppercase bg-rose-600 text-white shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>🚨 E-WARNING STOK ({marqueeInfo.totalLowStockCount} SKU &le; 30%)</span>
                </div>

                {/* Running Ticker Content */}
                <div className="flex-1 overflow-hidden relative">
                  <div className="inline-flex whitespace-nowrap animate-cyber-marquee group-hover:[animation-play-state:paused] text-xs font-mono tracking-wide">
                    <span className="inline-flex items-center gap-4 pr-12">
                      {marqueeInfo.allLowStockItems.map((item, idx) => {
                        const isCritical = item.currentStock <= 0 || item.remainingPct <= 10 || item.status === 'critical';
                        const supName = item.product.supplier || 'Principal Pabrik Terdaftar';
                        const pctTag = item.currentStock === 0 ? 'HABIS 0%' : isCritical ? `KRITIS ${item.remainingPct}%` : `MENIPIS ${item.remainingPct}%`;
                        return (
                          <span key={`${item.product.id}-${idx}`} className="inline-flex items-center gap-2">
                            <span className={`font-semibold tracking-wide ${isCritical ? 'text-rose-400 [body.light-theme_&]:text-rose-700' : 'text-amber-300 [body.light-theme_&]:text-amber-800'}`}>
                              <span>{isCritical ? '🚨' : '⚠️'} </span>
                              <span className="font-extrabold uppercase">PERINGATAN LOGISTIK:</span> Stok{' '}
                              <strong className="underline decoration-dotted font-black text-white [body.light-theme_&]:text-slate-900">{item.product.name}</strong>{' '}
                              sisa <span className="font-mono font-black">{item.currentStock} {item.product.unit}</span>{' '}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${isCritical ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-800' : 'bg-amber-950/80 text-amber-300 border-amber-500/50 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800'}`}>
                                {pctTag}
                              </span>
                              ! Segera buat PO Restock ke Supplier <span className="font-bold">{supName}</span>
                            </span>
                            <span className="font-black px-1.5 text-slate-500 [body.light-theme_&]:text-slate-400">✦</span>
                          </span>
                        );
                      })}
                    </span>
                    <span className="inline-flex items-center gap-4 pr-12">
                      {marqueeInfo.allLowStockItems.map((item, idx) => {
                        const isCritical = item.currentStock <= 0 || item.remainingPct <= 10 || item.status === 'critical';
                        const supName = item.product.supplier || 'Principal Pabrik Terdaftar';
                        const pctTag = item.currentStock === 0 ? 'HABIS 0%' : isCritical ? `KRITIS ${item.remainingPct}%` : `MENIPIS ${item.remainingPct}%`;
                        return (
                          <span key={`dup-${item.product.id}-${idx}`} className="inline-flex items-center gap-2">
                            <span className={`font-semibold tracking-wide ${isCritical ? 'text-rose-400 [body.light-theme_&]:text-rose-700' : 'text-amber-300 [body.light-theme_&]:text-amber-800'}`}>
                              <span>{isCritical ? '🚨' : '⚠️'} </span>
                              <span className="font-extrabold uppercase">PERINGATAN LOGISTIK:</span> Stok{' '}
                              <strong className="underline decoration-dotted font-black text-white [body.light-theme_&]:text-slate-900">{item.product.name}</strong>{' '}
                              sisa <span className="font-mono font-black">{item.currentStock} {item.product.unit}</span>{' '}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${isCritical ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-800' : 'bg-amber-950/80 text-amber-300 border-amber-500/50 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800'}`}>
                                {pctTag}
                              </span>
                              ! Segera buat PO Restock ke Supplier <span className="font-bold">{supName}</span>
                            </span>
                            <span className="font-black px-1.5 text-slate-500 [body.light-theme_&]:text-slate-400">✦</span>
                          </span>
                        );
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Accordion: 3. Rekomendasi Restock PO Pabrik (Prioritas Stok <= 30%) */}
            <div className="glass-panel rounded-xl border border-rose-500/40 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 overflow-hidden shadow-md">
              <button
                type="button"
                onClick={() => setIsRestockAccordionOpen(!isRestockAccordionOpen)}
                className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-900/40 [body.light-theme_&]:hover:bg-slate-50 transition-colors select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                      3. Rekomendasi Restock PO Pabrik
                    </h3>
                    <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
                      Prioritas otomatis SKU dengan stok menipis (&le; 30%) &amp; kritis (&le; 10%) beserta target buffer 100%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    restockRecommendations.some((r) => r.status === 'critical' || r.status === 'warning')
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {restockRecommendations.filter((r) => r.status === 'critical' || r.status === 'warning').length} Butuh Restock (&le; 30%)
                  </span>
                  <div className={`p-1 rounded-md text-slate-400 transition-transform ${isRestockAccordionOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {isRestockAccordionOpen && (
                <div className="p-3.5 pt-1 border-t border-slate-800 [body.light-theme_&]:border-slate-200 space-y-2.5 animate-in fade-in duration-200">
                  <div className="text-[11px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between">
                    <span>Daftar SKU diurutkan dari sisa persentase stok terkecil (Stok &le; 30% di urutan teratas):</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">Kalkulasi Buffer 100% Otomatis</span>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                    {restockRecommendations.map((d, idx) => {
                      const isCritical = d.status === 'critical';
                      const isWarning = d.status === 'warning';
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isCritical
                              ? 'bg-rose-500/15 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.25)] [body.light-theme_&]:bg-rose-50'
                              : isWarning
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)] [body.light-theme_&]:bg-amber-50'
                              : 'bg-slate-950/60 border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white [body.light-theme_&]:text-slate-900 text-xs sm:text-[13px]">
                                {d.product.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono tracking-wider ${
                                  isCritical
                                    ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                                    : isWarning
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                }`}
                              >
                                {d.currentStock === 0 ? 'HABIS (0%)' : isCritical ? `KRITIS (${d.remainingPct}% <= 10%)` : isWarning ? `MENIPIS (${d.remainingPct}% <= 30%)` : `AMAN (${d.remainingPct}%)`}
                              </span>
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-mono">
                              Sisa Stok: <strong className="text-white [body.light-theme_&]:text-slate-900">{d.currentStock} {d.product.unit}</strong> • Kapasitas Buffer Ideal: <strong className="text-white [body.light-theme_&]:text-slate-900">{d.maxCapacity} {d.product.unit}</strong> • Supplier: <strong className="text-cyan-400">{d.product.supplier || 'Principal Pabrik'}</strong>
                            </div>
                          </div>

                          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 shrink-0 w-full sm:w-auto justify-between">
                            <div className="text-left sm:text-right">
                              <div className="font-mono font-black text-cyan-400 text-xs sm:text-sm">
                                +{d.restockRecommendedQty} {d.product.unit} <span className="text-[10px] font-semibold text-slate-400">(Buffer 100%)</span>
                              </div>
                              <span className="text-[10px] text-rose-400 font-mono font-bold block">
                                ~Rp {d.estimatedCostRp.toLocaleString('id-ID')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppPOFromManager(d)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-black cursor-pointer shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                                title={`Kirim draf PO Restock resmi via WhatsApp ke ${d.product.supplier || 'Supplier'}`}
                              >
                                <Phone className="w-3 h-3 text-emerald-200" />
                                <span>📲 Buat PO WhatsApp ke Supplier</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyToPoForm(d)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] font-bold cursor-pointer transition-colors"
                                title="Masukkan data SKU ke form formulir PO di bawah"
                              >
                                📝 Isi Form PO
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick PO Form */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-rose-400" />
                  <span>Terbitkan Surat Pesanan Baru ke Pabrik (Purchase Order)</span>
                </span>
              </h3>

              <form onSubmit={handleCreatePO} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">Prinsipal Pabrik:</label>
                  <select
                    value={poForm.supplier}
                    onChange={(e) => setPoForm({ ...poForm, supplier: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  >
                    <option value="PT Tirta Investama (Aqua)">PT Tirta Investama (Aqua)</option>
                    <option value="PT Mayora Tirta (Le Minerale)">PT Mayora Tirta (Le Minerale)</option>
                    <option value="PT Sariguna Primatirta (Cleo)">PT Sariguna Primatirta (Cleo)</option>
                    <option value="PT Tirta Investama (Vit)">PT Tirta Investama (Vit)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">Nama Produk / SKU:</label>
                  <input
                    type="text"
                    required
                    value={poForm.productName}
                    onChange={(e) => setPoForm({ ...poForm, productName: e.target.value })}
                    placeholder="Contoh: Aqua 19L Galon Asli"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">Jumlah Pesanan (Tabung):</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={poForm.qty}
                    onChange={(e) => setPoForm({ ...poForm, qty: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono font-bold [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">Harga Kontrak Tebus HPP (Rp):</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={poForm.unitPrice}
                    onChange={(e) => setPoForm({ ...poForm, unitPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-rose-400 font-mono font-bold [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">Estimasi Jadwal Truk Masuk Gudang:</label>
                  <input
                    type="text"
                    value={poForm.etaNote}
                    onChange={(e) => setPoForm({ ...poForm, etaNote: e.target.value })}
                    placeholder="Misal: Truk Hino Danone Masuk 08:30 WIB Besok"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Terbitkan PO</span>
                  </button>
                </div>
              </form>
            </div>

            {/* PO List Table */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center justify-between">
                <span>Daftar Purchase Order & Validasi Barang Tiba (Bongkar Muat)</span>
                <span className="text-[10px] text-slate-400 font-mono">{purchaseOrders.length} Dokumen PO</span>
              </h3>

              <div className="space-y-2.5">
                {purchaseOrders.map((po) => (
                  <div
                    key={po.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-white [body.light-theme_&]:text-slate-900 font-black font-mono">{po.poNumber}</strong>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                          po.status === 'SELESAI'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                        }`}>
                          {po.status === 'SELESAI' ? 'BARANG DITERIMA' : 'DIKONFIRMASI PABRIK'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 [body.light-theme_&]:text-slate-700">
                        Prinsipal: <strong>{po.supplier}</strong> • Tanggal: {po.date}
                      </p>
                      <p className="text-[10.5px] text-cyan-400 font-mono">
                        {po.items.map((it) => `${it.productName}: ${it.orderQty} ${it.unit} @ Rp ${it.unitPrice.toLocaleString('id-ID')}`).join(' | ')}
                      </p>
                      {po.etaNote && (
                        <p className="text-[10px] text-slate-400 italic">🚚 {po.etaNote}</p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Nilai Kontrak:</span>
                        <span className="text-sm font-mono font-black text-rose-400">
                          Rp {po.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {po.status !== 'SELESAI' ? (
                        <button
                          type="button"
                          onClick={() => handleValidateArrival(po.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                          title="Validasi kedatangan barang pabrik dan tambah stok gudang"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Validasi Barang Tiba</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Stok Masuk Gudang</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
