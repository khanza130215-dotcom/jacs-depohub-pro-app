import React, { useState, useMemo } from 'react';
import {
  Droplets,
  Package,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  PlusCircle,
  Search,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  User,
  ShieldAlert,
  Sparkles,
  Filter,
  ChevronRight,
  Share2,
  DollarSign,
  Boxes,
  Calendar,
  Send,
  X,
  Check,
} from 'lucide-react';
import {
  nexaWaterFmcgService,
  INITIAL_NEXA_PRODUCTS,
} from '../services/nexaWaterFmcgService';
import {
  NexaPartnerProfile,
  InvoiceTempoItem,
  WaterProductSku,
  FmcgProductSku,
  DriverRevisitPayload,
  PhysicalGallonMovementRecord,
} from '../types/nexaHubDistribution';

export const WaterFmcgArchitectureView: React.FC = () => {
  // Service states
  const [partners, setPartners] = useState<NexaPartnerProfile[]>(() =>
    nexaWaterFmcgService.getPartners()
  );
  const [invoices, setInvoices] = useState<InvoiceTempoItem[]>(() =>
    nexaWaterFmcgService.getInvoices()
  );
  const [movements, setMovements] = useState<PhysicalGallonMovementRecord[]>(() =>
    nexaWaterFmcgService.getGallonMovements()
  );

  // Active view sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'aging' | 'gallons' | 'movements'>(
    'simulator'
  );

  // Filter & Search
  const [searchPartnerTerm, setSearchPartnerTerm] = useState('');
  const [selectedBucketFilter, setSelectedBucketFilter] = useState<'ALL' | '0-7' | '8-14' | '>14'>(
    'ALL'
  );

  // SIMULATOR STATE
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partners[0]?.id || 'PTR-001');
  const [selectedDriverName, setSelectedDriverName] = useState<string>('Pak Bambang Sukoco (Armada Carry)');
  
  // Water drops
  const [qtyRo19L, setQtyRo19L] = useState<number>(30);
  const [qtyMineral19L, setQtyMineral19L] = useState<number>(10);
  const [qtyCup240ml, setQtyCup240ml] = useState<number>(5);
  const [qtyBottle600ml, setQtyBottle600ml] = useState<number>(3);

  // FMCG drops
  const [qtyRice5kg, setQtyRice5kg] = useState<number>(4);
  const [qtyEggsTray, setQtyEggsTray] = useState<number>(3);
  const [qtyOil2L, setQtyOil2L] = useState<number>(6);

  // Gallon return
  const [emptyGallonRetrieved, setEmptyGallonRetrieved] = useState<number>(35);

  // Settle previous invoice
  const [selectedPrevInvoiceId, setSelectedPrevInvoiceId] = useState<string>('');
  const [prevInvoicePayAmount, setPrevInvoicePayAmount] = useState<number>(0);

  // Payment method for new order
  const [newOrderPayMethod, setNewOrderPayMethod] = useState<'TEMPO_BON' | 'LUNAS_CASH' | 'LUNAS_QRIS'>(
    'TEMPO_BON'
  );

  // Notice alert
  const [revisitSuccessNotice, setRevisitSuccessNotice] = useState<string | null>(null);

  // Refresh service data
  const refreshData = () => {
    setPartners(nexaWaterFmcgService.getPartners());
    setInvoices(nexaWaterFmcgService.getInvoices());
    setMovements(nexaWaterFmcgService.getGallonMovements());
  };

  // Selected partner object
  const activePartner = useMemo(() => {
    return partners.find((p) => p.id === selectedPartnerId) || partners[0];
  }, [partners, selectedPartnerId]);

  // Unpaid invoices of selected partner for quick settlement
  const partnerUnpaidInvoices = useMemo(() => {
    return invoices.filter((i) => i.partnerId === selectedPartnerId && i.remainingBalance > 0);
  }, [invoices, selectedPartnerId]);

  // Pricing lookups from initial products
  const productsMap = useMemo(() => {
    const map = new Map<string, number>();
    INITIAL_NEXA_PRODUCTS.forEach((p) => {
      map.set(p.sku, p.partnerPrice);
    });
    return map;
  }, []);

  // Simulator live calculations
  const simCalculations = useMemo(() => {
    const pRo = productsMap.get('GALLON_RO_19L') || 16000;
    const pMineral = productsMap.get('GALLON_19L') || 15000;
    const pCup = productsMap.get('CUP_240ML') || 22500;
    const pBottle = productsMap.get('BOTTLE_600ML') || 36000;

    const pRice = productsMap.get('RICE_5KG') || 68500;
    const pEggs = productsMap.get('EGGS_TRAY') || 51000;
    const pOil = productsMap.get('COOKING_OIL_2L') || 34000;

    const totalWater =
      qtyRo19L * pRo + qtyMineral19L * pMineral + qtyCup240ml * pCup + qtyBottle600ml * pBottle;
    const totalFmcg = qtyRice5kg * pRice + qtyEggsTray * pEggs + qtyOil2L * pOil;
    const totalNewOrder = totalWater + totalFmcg;

    const total19LGallonsOut = qtyRo19L + qtyMineral19L;
    const netGallonShift = total19LGallonsOut - emptyGallonRetrieved;
    const simulatedHoldingGallonsAfter = Math.max(
      0,
      (activePartner?.holdingEmptyGallonDebt || 0) + netGallonShift
    );

    const cashCollected =
      (newOrderPayMethod !== 'TEMPO_BON' ? totalNewOrder : 0) + prevInvoicePayAmount;

    return {
      totalWater,
      totalFmcg,
      totalNewOrder,
      total19LGallonsOut,
      netGallonShift,
      simulatedHoldingGallonsAfter,
      cashCollected,
    };
  }, [
    productsMap,
    qtyRo19L,
    qtyMineral19L,
    qtyCup240ml,
    qtyBottle600ml,
    qtyRice5kg,
    qtyEggsTray,
    qtyOil2L,
    emptyGallonRetrieved,
    newOrderPayMethod,
    prevInvoicePayAmount,
    activePartner,
  ]);

  // Aging summary
  const agingSummary = useMemo(() => {
    return nexaWaterFmcgService.calculateAgingBuckets(invoices);
  }, [invoices]);

  // Gallon inventory summary
  const gallonSummary = useMemo(() => {
    return nexaWaterFmcgService.getPhysicalGallonSummary();
  }, [partners]);

  // Handle execute revisit simulation
  const handleRunRevisit = (e: React.FormEvent) => {
    e.preventDefault();

    const waterDrops: { sku: WaterProductSku; qty: number; unitPrice: number }[] = [];
    if (qtyRo19L > 0)
      waterDrops.push({ sku: 'GALLON_RO_19L', qty: qtyRo19L, unitPrice: productsMap.get('GALLON_RO_19L') || 16000 });
    if (qtyMineral19L > 0)
      waterDrops.push({ sku: 'GALLON_19L', qty: qtyMineral19L, unitPrice: productsMap.get('GALLON_19L') || 15000 });
    if (qtyCup240ml > 0)
      waterDrops.push({ sku: 'CUP_240ML', qty: qtyCup240ml, unitPrice: productsMap.get('CUP_240ML') || 22500 });
    if (qtyBottle600ml > 0)
      waterDrops.push({ sku: 'BOTTLE_600ML', qty: qtyBottle600ml, unitPrice: productsMap.get('BOTTLE_600ML') || 36000 });

    const fmcgDrops: { sku: FmcgProductSku; qty: number; unitPrice: number }[] = [];
    if (qtyRice5kg > 0)
      fmcgDrops.push({ sku: 'RICE_5KG', qty: qtyRice5kg, unitPrice: productsMap.get('RICE_5KG') || 68500 });
    if (qtyEggsTray > 0)
      fmcgDrops.push({ sku: 'EGGS_TRAY', qty: qtyEggsTray, unitPrice: productsMap.get('EGGS_TRAY') || 51000 });
    if (qtyOil2L > 0)
      fmcgDrops.push({ sku: 'COOKING_OIL_2L', qty: qtyOil2L, unitPrice: productsMap.get('COOKING_OIL_2L') || 34000 });

    const payload: DriverRevisitPayload = {
      partnerId: selectedPartnerId,
      driverId: 'DRV-01',
      driverName: selectedDriverName,
      waterDrops,
      fmcgDrops,
      emptyGallonRetrieved,
      previousInvoiceIdToSettle: selectedPrevInvoiceId || undefined,
      previousInvoicePaymentAmount: prevInvoicePayAmount > 0 ? prevInvoicePayAmount : undefined,
      newInvoicePaymentMethod: newOrderPayMethod,
      cashPaidForNewOrder: newOrderPayMethod !== 'TEMPO_BON' ? simCalculations.totalNewOrder : 0,
      notes: `Re-visit rute toko oleh ${selectedDriverName}. Dual-Type Air RO + Sembako.`,
    };

    const res = nexaWaterFmcgService.executeDriverRevisit(payload);
    refreshData();

    if (res.success) {
      setRevisitSuccessNotice(
        `✓ ${res.message} (Faktur Baru: Rp ${res.newOrderTotal.toLocaleString('id-ID')}, Setoran: Rp ${res.netCashCollected.toLocaleString('id-ID')})`
      );
      // Reset invoice settle fields
      setSelectedPrevInvoiceId('');
      setPrevInvoicePayAmount(0);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchPartner =
        searchPartnerTerm === '' ||
        inv.partnerName.toLowerCase().includes(searchPartnerTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchPartnerTerm.toLowerCase());

      if (!matchPartner) return false;

      if (selectedBucketFilter === '0-7') return inv.bucket === 'BUCKET_0_7_LANCAR';
      if (selectedBucketFilter === '8-14') return inv.bucket === 'BUCKET_8_14_JATUH_TEMPO';
      if (selectedBucketFilter === '>14') return inv.bucket === 'BUCKET_GT14_MENUNGGAK';

      return true;
    });
  }, [invoices, searchPartnerTerm, selectedBucketFilter]);

  // Quick Settle Invoice
  const handleQuickSettle = (inv: InvoiceTempoItem) => {
    nexaWaterFmcgService.settleInvoicePayment(inv.id, inv.remainingBalance, 'Tunai', 'Kasir Depo');
    refreshData();
    setRevisitSuccessNotice(`Pelunasan faktur ${inv.invoiceNumber} sebesar Rp ${inv.remainingBalance.toLocaleString('id-ID')} berhasil dicatat.`);
  };

  // WhatsApp Reminder Link
  const handleSendWaReminder = (inv: InvoiceTempoItem) => {
    const text = `Halo *${inv.partnerName}*, kami dari Manajemen Depo Air Minum RO & FMCG NexaHub Pro. Mengingatkan nota tempo nomor *${inv.invoiceNumber}* sebesar *Rp ${inv.remainingBalance.toLocaleString('id-ID')}* (jatuh tempo: ${inv.dueDate}, umur: ${inv.daysElapsed} hari). Mohon konfirmasi jadwal kunjungan supir untuk serah terima setoran & tukar tabung galon. Terima kasih.`;
    const partner = partners.find((p) => p.id === inv.partnerId);
    const phone = partner?.phone?.replace(/[^0-9]/g, '') || '6281234567890';
    const waPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16 sm:pb-8">
      {/* 1. HEADER ARSITEKTUR DUAL-TYPE & BADGES */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 shadow-xl space-y-3 [body.light-theme_&]:bg-gradient-to-br [body.light-theme_&]:from-slate-50 [body.light-theme_&]:via-white [body.light-theme_&]:to-cyan-50/50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(6,182,212,0.4)] [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:border-cyan-500 [body.light-theme_&]:text-cyan-800">
              <Droplets className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white [body.light-theme_&]:text-slate-950 tracking-wide">
                  Distribusi Air &amp; Sembako (Dual-Type Hub)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] uppercase [body.light-theme_&]:bg-cyan-600 [body.light-theme_&]:text-white">
                  NexaHub Pro
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 [body.light-theme_&]:border-emerald-300">
                  Konservasi Tabung Galon
                </span>
              </div>
              <p className="text-xs text-slate-300 dark:text-slate-300 [body.light-theme_&]:text-slate-800 mt-0.5 font-medium">
                Depo Air RO 19L &amp; FMCG Sembako • Tracking Tabung Fisik • Skema Tempo 7-14 Hari &amp; Aging 3-Bucket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={refreshData}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 [body.light-theme_&]:border-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronisasi Data</span>
            </button>
          </div>
        </div>

        {/* Dual-Type Specs Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 [body.light-theme_&]:border-slate-200 text-[11px]">
          <div className="p-2 rounded-xl border flex items-center gap-1.5 transition-colors bg-slate-800/80 text-slate-200 border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 [body.light-theme_&]:bg-slate-200/90 [body.light-theme_&]:text-slate-900 [body.light-theme_&]:border-slate-300">
            <span className="text-cyan-400 dark:text-cyan-400 [body.light-theme_&]:text-cyan-700 text-sm">💧</span>
            <span className="truncate text-slate-200 dark:text-slate-200 [body.light-theme_&]:text-slate-900 font-medium"><strong className="font-bold text-slate-100 dark:text-slate-100 [body.light-theme_&]:text-slate-950">Lini Air RO:</strong> 19L, Cup 240ml, Botol 600ml</span>
          </div>
          <div className="p-2 rounded-xl border flex items-center gap-1.5 transition-colors bg-slate-800/80 text-slate-200 border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 [body.light-theme_&]:bg-slate-200/90 [body.light-theme_&]:text-slate-900 [body.light-theme_&]:border-slate-300">
            <span className="text-amber-400 dark:text-amber-400 [body.light-theme_&]:text-amber-700 text-sm">🍚</span>
            <span className="truncate text-slate-200 dark:text-slate-200 [body.light-theme_&]:text-slate-900 font-medium"><strong className="font-bold text-slate-100 dark:text-slate-100 [body.light-theme_&]:text-slate-950">Lini Sembako:</strong> Beras 5kg, Telur, Minyak 2L</span>
          </div>
          <div className="p-2 rounded-xl border flex items-center gap-1.5 transition-colors bg-slate-800/80 text-slate-200 border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 [body.light-theme_&]:bg-slate-200/90 [body.light-theme_&]:text-slate-900 [body.light-theme_&]:border-slate-300">
            <span className="text-emerald-400 dark:text-emerald-400 [body.light-theme_&]:text-emerald-700 text-sm">🛡️</span>
            <span className="truncate text-slate-200 dark:text-slate-200 [body.light-theme_&]:text-slate-900 font-medium"><strong className="font-bold text-slate-100 dark:text-slate-100 [body.light-theme_&]:text-slate-950">Skema Tempo:</strong> 7-14 H Toko / 1-7 H Refil</span>
          </div>
          <div className="p-2 rounded-xl border flex items-center gap-1.5 transition-colors bg-slate-800/80 text-slate-200 border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 [body.light-theme_&]:bg-slate-200/90 [body.light-theme_&]:text-slate-900 [body.light-theme_&]:border-slate-300">
            <span className="text-purple-400 dark:text-purple-400 [body.light-theme_&]:text-purple-700 text-sm">📦</span>
            <span className="truncate text-slate-200 dark:text-slate-200 [body.light-theme_&]:text-slate-900 font-medium"><strong className="font-bold text-slate-100 dark:text-slate-100 [body.light-theme_&]:text-slate-950">Aset Tabung:</strong> Konservasi {gallonSummary.totalPhysicalAssetCount} Tabung</span>
          </div>
        </div>
      </div>

      {/* SUCCESS NOTICE BANNER */}
      {revisitSuccessNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-[0_0_16px_rgba(16,185,129,0.3)] animate-in fade-in duration-200 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:border-emerald-400 [body.light-theme_&]:text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 [body.light-theme_&]:text-emerald-700 shrink-0" />
            <span className="font-semibold">{revisitSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setRevisitSuccessNotice(null)}
            className="text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. RINGKASAN METRIK VITAL (4 KARTU) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Metrik 1: Tabung Tertahan di Toko Mitra */}
        <div className="relative overflow-hidden p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-1 shadow-sm transition-all duration-300 ease-in-out cursor-default select-none group hover:-translate-y-1 hover:border-amber-400/80 hover:shadow-md hover:shadow-slate-200/70 dark:bg-slate-900/90 dark:border-slate-800/80 dark:hover:border-amber-500/60 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200/90 [body.light-theme_&]:shadow-sm [body.light-theme_&]:shadow-slate-100 [body.light-theme_&]:hover:border-amber-400/80 [body.light-theme_&]:hover:shadow-md [body.light-theme_&]:hover:shadow-slate-200/70">
          {/* Top accent gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 opacity-75 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between text-slate-400 pt-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-bold">
              Tabung di Mitra
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center text-amber-500 dark:text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300 shrink-0">
              <Package className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-950">
            {gallonSummary.heldByPartners} Tabung
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 block font-mono font-medium">
            {Math.round((gallonSummary.heldByPartners / gallonSummary.totalPhysicalAssetCount) * 100)}% dari total aset fisik
          </span>
        </div>

        {/* Metrik 2: Tabung di Gudang Depo & Armada */}
        <div className="relative overflow-hidden p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-1 shadow-sm transition-all duration-300 ease-in-out cursor-default select-none group hover:-translate-y-1 hover:border-cyan-400/80 hover:shadow-md hover:shadow-slate-200/70 dark:bg-slate-900/90 dark:border-slate-800/80 dark:hover:border-cyan-500/60 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200/90 [body.light-theme_&]:shadow-sm [body.light-theme_&]:shadow-slate-100 [body.light-theme_&]:hover:border-cyan-400/80 [body.light-theme_&]:hover:shadow-md [body.light-theme_&]:hover:shadow-slate-200/70">
          {/* Top accent gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-400 via-sky-500 to-cyan-300 opacity-75 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between text-slate-400 pt-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 dark:text-cyan-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-bold">
              Stok Depo &amp; Armada
            </span>
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/15 flex items-center justify-center text-cyan-500 dark:text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300 shrink-0">
              <Droplets className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-950">
            {gallonSummary.depoWarehouseStock + gallonSummary.onFleetVehicles} Tabung
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 block font-mono font-medium">
            Depo: {gallonSummary.depoWarehouseStock} • Bak Truk: {gallonSummary.onFleetVehicles}
          </span>
        </div>

        {/* Metrik 3: Total Piutang Tempo Aktif */}
        <div className="relative overflow-hidden p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-1 shadow-sm transition-all duration-300 ease-in-out cursor-default select-none group hover:-translate-y-1 hover:border-rose-400/80 hover:shadow-md hover:shadow-slate-200/70 dark:bg-slate-900/90 dark:border-slate-800/80 dark:hover:border-rose-500/60 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200/90 [body.light-theme_&]:shadow-sm [body.light-theme_&]:shadow-slate-100 [body.light-theme_&]:hover:border-rose-400/80 [body.light-theme_&]:hover:shadow-md [body.light-theme_&]:hover:shadow-slate-200/70">
          {/* Top accent gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-rose-400 via-pink-500 to-rose-300 opacity-75 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between text-slate-400 pt-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 dark:text-emerald-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-bold">
              Total Piutang Tempo
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 dark:bg-rose-500/15 flex items-center justify-center text-rose-500 dark:text-rose-400 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300 shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-950">
            Rp {agingSummary.totalReceivables.toLocaleString('id-ID')}
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 block font-mono font-medium">
            {agingSummary.totalInvoices} nota tempo belum lunas
          </span>
        </div>

        {/* Metrik 4: Konservasi Fisik Total */}
        <div className="relative overflow-hidden p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-1 shadow-sm transition-all duration-300 ease-in-out cursor-default select-none group hover:-translate-y-1 hover:border-indigo-400/80 hover:shadow-md hover:shadow-slate-200/70 dark:bg-slate-900/90 dark:border-slate-800/80 dark:hover:border-indigo-500/60 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200/90 [body.light-theme_&]:shadow-sm [body.light-theme_&]:shadow-slate-100 [body.light-theme_&]:hover:border-indigo-400/80 [body.light-theme_&]:hover:shadow-md [body.light-theme_&]:hover:shadow-slate-200/70">
          {/* Top accent gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-300 opacity-75 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between text-slate-400 pt-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 dark:text-purple-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-bold">
              Total Aset Tabung
            </span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-500 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-950">
            {gallonSummary.totalPhysicalAssetCount} Tabung
          </div>
          <span className="text-[9px] text-purple-300/80 dark:text-purple-300/80 [body.light-theme_&]:text-slate-600 block font-mono font-medium">
            Rusak/Afkir: {gallonSummary.damagedOrScrapped} tabung
          </span>
        </div>
      </div>

      {/* 3. SUB-NAV TABS */}
      <div className="flex items-center gap-1 bg-slate-950 [body.light-theme_&]:bg-slate-200/90 p-1.5 rounded-2xl border border-slate-800 [body.light-theme_&]:border-slate-300 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('simulator')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'simulator'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-black [body.light-theme_&]:bg-cyan-600 [body.light-theme_&]:text-white'
              : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-700 [body.light-theme_&]:hover:text-slate-950'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Simulator Re-Visit Driver</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('aging')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'aging'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black [body.light-theme_&]:bg-amber-600 [body.light-theme_&]:text-white'
              : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-700 [body.light-theme_&]:hover:text-slate-950'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Aging Piutang 3-Bucket ({agingSummary.totalInvoices})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('gallons')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'gallons'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black [body.light-theme_&]:bg-emerald-600 [body.light-theme_&]:text-white'
              : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-700 [body.light-theme_&]:hover:text-slate-950'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Saldo Tabung per Mitra ({partners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('movements')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'movements'
              ? 'bg-indigo-500 text-white shadow-md font-black [body.light-theme_&]:bg-indigo-600 [body.light-theme_&]:text-white'
              : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-700 [body.light-theme_&]:hover:text-slate-950'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Log Sirkulasi Fisik ({movements.length})</span>
        </button>
      </div>

      {/* 4. CONTENT VIEW BERDASARKAN SUB-TAB */}

      {/* SUB-TAB 1: SIMULATOR RE-VISIT DRIVER INTERAKTIF */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* FORM SIMULATOR */}
          <form
            onSubmit={handleRunRevisit}
            className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 dark:bg-slate-900/90 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 space-y-4 shadow-xl [body.light-theme_&]:shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400 [body.light-theme_&]:text-blue-900" />
                <h3 className="text-xs font-black text-white dark:text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider">
                  Formulir Kunjungan Re-Visit Driver Lapangan
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 dark:text-cyan-300 bg-cyan-950/60 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-950 [body.light-theme_&]:border-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                Multi-Drop &amp; Tukar Galon
              </span>
            </div>

            {/* Pemilihan Toko Mitra */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase text-slate-300 dark:text-slate-300 [body.light-theme_&]:text-slate-800 [body.light-theme_&]:font-semibold font-black flex items-center justify-between">
                <span>PILIH TOKO MITRA KUNJUNGAN:</span>
                <span className="text-cyan-400 dark:text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono text-[9.5px]">
                  Plafon: {activePartner?.tenorDaysAllowed} Hari
                </span>
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:border-cyan-400 text-xs text-white [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900 outline-none font-bold cursor-pointer"
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.partnerType === 'TOKO_WARUNG' ? '🏪 Toko Mitra' : '💧 Refil Mandiri'}) • Tabung: {p.holdingEmptyGallonDebt} Gln
                  </option>
                ))}
              </select>

              {activePartner && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 dark:bg-slate-950 dark:border-slate-800/80 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 flex items-center justify-between text-[10px] font-mono flex-wrap gap-2">
                  <div>
                    <span className="text-slate-500 [body.light-theme_&]:text-slate-600 font-medium">Sales PIC: </span>
                    <span className="text-cyan-300 dark:text-cyan-300 [body.light-theme_&]:text-slate-900 font-bold">{activePartner.assignedSalesId || 'Binaan Depo (Direct)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 [body.light-theme_&]:text-slate-600 font-medium">Tabung Tertahan: </span>
                    <span className="text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-900 font-bold">{activePartner.holdingEmptyGallonDebt} / {activePartner.maxGallonHoldingQuota} Gln</span>
                  </div>
                  <div>
                    <span className="text-slate-500 [body.light-theme_&]:text-slate-600 font-medium">Piutang Aktif: </span>
                    <span className="text-rose-400 dark:text-rose-400 [body.light-theme_&]:text-slate-900 font-bold">Rp {activePartner.currentReceivableBalance.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Drop Lini Air RO & Mineral */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-cyan-500/30 dark:bg-slate-950/80 [body.light-theme_&]:bg-cyan-50/40 [body.light-theme_&]:border-cyan-200 space-y-2">
              <span className="text-[10.5px] uppercase tracking-wider text-cyan-300 dark:text-cyan-300 [body.light-theme_&]:text-blue-900 [body.light-theme_&]:font-bold font-black flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400 [body.light-theme_&]:text-blue-900" />
                <span>1. DROP LINI AIR MINUM RO &amp; MINERAL</span>
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* RO 19L */}
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-900 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-white dark:text-white [body.light-theme_&]:text-slate-900 block">Galon RO 19L</span>
                    <span className="text-[9px] font-mono text-cyan-400 dark:text-cyan-400 [body.light-theme_&]:text-slate-600 font-semibold">@Rp 16.000</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQtyRo19L((v) => Math.max(0, v - 5))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-900">{qtyRo19L}</span>
                    <button
                      type="button"
                      onClick={() => setQtyRo19L((v) => v + 5)}
                      className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 dark:bg-cyan-500/20 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-900 [body.light-theme_&]:border [body.light-theme_&]:border-cyan-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Mineral 19L */}
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-900 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-white dark:text-white [body.light-theme_&]:text-slate-900 block">Mineral 19L</span>
                    <span className="text-[9px] font-mono text-cyan-400 dark:text-cyan-400 [body.light-theme_&]:text-slate-600 font-semibold">@Rp 15.000</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQtyMineral19L((v) => Math.max(0, v - 5))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-900">{qtyMineral19L}</span>
                    <button
                      type="button"
                      onClick={() => setQtyMineral19L((v) => v + 5)}
                      className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 dark:bg-cyan-500/20 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-900 [body.light-theme_&]:border [body.light-theme_&]:border-cyan-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cup 240ml */}
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-900 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-white dark:text-white [body.light-theme_&]:text-slate-900 block">Cup 240ml</span>
                    <span className="text-[9px] font-mono text-cyan-400 dark:text-cyan-400 [body.light-theme_&]:text-slate-600 font-semibold">@Rp 22.500</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQtyCup240ml((v) => Math.max(0, v - 1))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-900">{qtyCup240ml}</span>
                    <button
                      type="button"
                      onClick={() => setQtyCup240ml((v) => v + 1)}
                      className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 dark:bg-cyan-500/20 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-900 [body.light-theme_&]:border [body.light-theme_&]:border-cyan-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Botol 600ml */}
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-900 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-white dark:text-white [body.light-theme_&]:text-slate-900 block">Botol 600ml</span>
                    <span className="text-[9px] font-mono text-cyan-400 dark:text-cyan-400 [body.light-theme_&]:text-slate-600 font-semibold">@Rp 36.000</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQtyBottle600ml((v) => Math.max(0, v - 1))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-900">{qtyBottle600ml}</span>
                    <button
                      type="button"
                      onClick={() => setQtyBottle600ml((v) => v + 1)}
                      className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 dark:bg-cyan-500/20 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-900 [body.light-theme_&]:border [body.light-theme_&]:border-cyan-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drop Lini Sembako FMCG */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 dark:bg-slate-950/80 [body.light-theme_&]:bg-amber-50/40 [body.light-theme_&]:border-amber-200 space-y-2">
              <span className="text-[10.5px] uppercase tracking-wider text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-blue-900 [body.light-theme_&]:font-bold font-black flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400 [body.light-theme_&]:text-blue-900" />
                <span>2. DROP LINI SEMBAKO</span>
              </span>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Beras 5kg */}
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-900 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:shadow-xs flex flex-col justify-between gap-1">
                  <div>
                    <span className="text-[10px] font-bold text-white dark:text-white [body.light-theme_&]:text-slate-900 block truncate">Beras Ramos 5kg</span>
                    <span className="text-[8.5px] font-mono text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-600 font-semibold">@Rp 68.500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setQtyRice5kg((v) => Math.max(0, v - 1))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-900">{qtyRice5kg}</span>
                    <button
                      type="button"
                      onClick={() => setQtyRice5kg((v) => v + 1)}
                      className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 dark:bg-amber-500/20 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border [body.light-theme_&]:border-amber-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Telur Tray */}
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-900 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:shadow-xs flex flex-col justify-between gap-1">
                  <div>
                    <span className="text-[10px] font-bold text-white dark:text-white [body.light-theme_&]:text-slate-900 block truncate">Telur</span>
                    <span className="text-[8.5px] font-mono text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-600 font-semibold">@Rp 51.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setQtyEggsTray((v) => Math.max(0, v - 1))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-900">{qtyEggsTray}</span>
                    <button
                      type="button"
                      onClick={() => setQtyEggsTray((v) => v + 1)}
                      className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 dark:bg-amber-500/20 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border [body.light-theme_&]:border-amber-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Minyak 2L */}
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-900 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:shadow-xs flex flex-col justify-between gap-1">
                  <div>
                    <span className="text-[10px] font-bold text-white dark:text-white [body.light-theme_&]:text-slate-900 block truncate">Minyak Sawit</span>
                    <span className="text-[8.5px] font-mono text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-600 font-semibold">@Rp 34.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setQtyOil2L((v) => Math.max(0, v - 1))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-white dark:text-white [body.light-theme_&]:text-slate-900">{qtyOil2L}</span>
                    <button
                      type="button"
                      onClick={() => setQtyOil2L((v) => v + 1)}
                      className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 dark:bg-amber-500/20 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border [body.light-theme_&]:border-amber-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarik Galon Kosong */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 dark:bg-slate-950 dark:border-slate-800 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 flex items-center justify-between">
              <div>
                <span className="text-[10.5px] uppercase text-white dark:text-white [body.light-theme_&]:text-blue-900 [body.light-theme_&]:font-bold font-black block">
                  3. TARIK TABUNG KOSONG
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600">
                  Total galon 19L yang turun: {simCalculations.total19LGallonsOut} tabung
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEmptyGallonRetrieved((v) => Math.max(0, v - 5))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 font-bold"
                >
                  -
                </button>
                <span className="font-mono font-black text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-900 text-sm w-8 text-center">
                  {emptyGallonRetrieved}
                </span>
                <button
                  type="button"
                  onClick={() => setEmptyGallonRetrieved((v) => v + 5)}
                  className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 dark:bg-amber-500/20 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border [body.light-theme_&]:border-amber-300 font-bold"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setEmptyGallonRetrieved(simCalculations.total19LGallonsOut)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 dark:bg-slate-800 dark:text-cyan-300 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:hover:bg-slate-300 [body.light-theme_&]:text-slate-900 [body.light-theme_&]:border-slate-300 text-[10px] font-bold border border-slate-700"
                >
                  Samakan ({simCalculations.total19LGallonsOut})
                </button>
              </div>
            </div>

            {/* Pelunasan Faktur Tempo Sebelumnya (Re-Visit Settlement) */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 dark:bg-slate-950 dark:border-slate-800 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] uppercase text-emerald-300 dark:text-emerald-300 [body.light-theme_&]:text-blue-900 [body.light-theme_&]:font-bold font-black flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400 [body.light-theme_&]:text-blue-900" />
                  <span>4. Pelunasan Faktur Tempo Sebelumnya di Lokasi</span>
                </span>
                <span className="text-[9.5px] font-mono text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600">
                  {partnerUnpaidInvoices.length} Nota Terbuka
                </span>
              </div>

              {partnerUnpaidInvoices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <select
                    value={selectedPrevInvoiceId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedPrevInvoiceId(id);
                      const inv = partnerUnpaidInvoices.find((i) => i.id === id);
                      if (inv) setPrevInvoicePayAmount(inv.remainingBalance);
                      else setPrevInvoicePayAmount(0);
                    }}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white dark:bg-slate-900 dark:border-slate-800 dark:text-white [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900 text-xs outline-none font-bold"
                  >
                    <option value="">-- Pilih Faktur Mau Dilunasi --</option>
                    {partnerUnpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} (Sisa: Rp {inv.remainingBalance.toLocaleString('id-ID')} • {inv.daysElapsed} H)
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-700 font-semibold">Setor:</span>
                    <input
                      type="number"
                      value={prevInvoicePayAmount}
                      onChange={(e) => setPrevInvoicePayAmount(Number(e.target.value))}
                      placeholder="Nominal bayar..."
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 dark:text-emerald-300 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900 font-mono font-bold text-xs outline-none"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-slate-500 [body.light-theme_&]:text-slate-600 italic">
                  Toko mitra ini tidak memiliki tunggakan faktur tempo sebelumnya.
                </p>
              )}
            </div>

            {/* Metode Bayar Order Baru */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-300 dark:text-slate-300 [body.light-theme_&]:text-blue-900 [body.light-theme_&]:font-bold font-black">
                5. Ketentuan Pembayaran Belanja Baru Ini:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'TEMPO_BON', label: 'Tempo Faktur (Bon)', sub: `Tenor ${activePartner?.tenorDaysAllowed} Hari` },
                  { id: 'LUNAS_CASH', label: 'Tunai Langsung (COD)', sub: 'Serah Terima Kasir' },
                  { id: 'LUNAS_QRIS', label: 'Transfer / QRIS', sub: 'Non-Tunai Lunas' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewOrderPayMethod(opt.id as any)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      newOrderPayMethod === opt.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-white dark:text-white [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:border-cyan-500 [body.light-theme_&]:text-cyan-950 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 dark:text-slate-400 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-700 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10.5px] font-bold block [body.light-theme_&]:text-slate-900">{opt.label}</span>
                    <span className="text-[8px] font-mono text-cyan-400 dark:text-cyan-400 [body.light-theme_&]:text-cyan-800 block font-semibold">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-400 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs shadow-[0_0_18px_rgba(6,182,212,0.45)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>SIMPAN RE-VISIT &amp; PERBARUI BUKU BESAR DUAL-TYPE</span>
            </button>
          </form>

          {/* RINGKASAN KALKULASI LANGSUNG (RIGHT COLUMN) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 dark:bg-slate-900/90 dark:border-cyan-500/30 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-2">
                <span className="text-xs font-black text-cyan-300 dark:text-cyan-200 [body.light-theme_&]:text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-300 [body.light-theme_&]:text-blue-950" />
                  <span>SIMULASI REKAPITULASI SEKETIKA</span>
                </span>
                <span className="text-[9.5px] font-mono text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 font-bold">Real-Time Ledger</span>
              </div>

              {/* Rincian Belanja Baru */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300 dark:text-slate-300 [body.light-theme_&]:text-slate-800">
                  <span className="[body.light-theme_&]:font-medium">Subtotal Air RO:</span>
                  <span className="text-cyan-300 dark:text-cyan-300 [body.light-theme_&]:text-slate-950 [body.light-theme_&]:font-extrabold font-bold">
                    Rp {simCalculations.totalWater.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 dark:text-slate-300 [body.light-theme_&]:text-slate-800">
                  <span className="[body.light-theme_&]:font-medium">Subtotal Sembako:</span>
                  <span className="text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-950 [body.light-theme_&]:font-extrabold font-bold">
                    Rp {simCalculations.totalFmcg.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-white dark:text-white [body.light-theme_&]:text-slate-800 text-sm pt-1.5 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
                  <span className="font-bold">Total Belanja Baru:</span>
                  <span className="font-black text-emerald-400 dark:text-emerald-400 [body.light-theme_&]:text-slate-950 [body.light-theme_&]:font-extrabold">
                    Rp {simCalculations.totalNewOrder.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Konservasi Tabung Galon Fisik */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 dark:bg-slate-950 dark:border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200 space-y-1.5 text-xs">
                <span className="text-[10px] font-black uppercase text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-800 block">
                  Mutasi Tabung Galon Fisik Toko:
                </span>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-700">Galon 19L Turun:</span>
                  <span className="text-cyan-300 dark:text-cyan-300 [body.light-theme_&]:text-slate-900 font-bold">+{simCalculations.total19LGallonsOut} Tabung</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-700">Galon Kosong Ditarik:</span>
                  <span className="text-emerald-400 dark:text-emerald-400 [body.light-theme_&]:text-slate-900 font-bold">-{emptyGallonRetrieved} Tabung</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-900 [body.light-theme_&]:border-slate-200">
                  <span className="text-slate-300 dark:text-slate-300 [body.light-theme_&]:text-slate-700">Pergeseran Saldo Netto:</span>
                  <span className={`font-black [body.light-theme_&]:text-slate-900 ${simCalculations.netGallonShift > 0 ? 'text-amber-400 dark:text-amber-400' : 'text-emerald-400 dark:text-emerald-400'}`}>
                    {simCalculations.netGallonShift > 0 ? `+${simCalculations.netGallonShift}` : simCalculations.netGallonShift} Tabung
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono font-bold pt-1 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
                  <span className="text-white dark:text-white [body.light-theme_&]:text-slate-800 font-bold">Saldo Tabung Tertahan Baru:</span>
                  <span className="text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-950 [body.light-theme_&]:font-extrabold font-black">
                    {simCalculations.simulatedHoldingGallonsAfter} Tabung
                  </span>
                </div>
              </div>

              {/* Setoran Uang Tunai Supir */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 dark:bg-emerald-950/30 dark:border-emerald-500/40 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:border-emerald-300 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 dark:text-emerald-300 [body.light-theme_&]:text-slate-800">Total Uang Diterima Supir:</span>
                  <span className="text-base font-mono font-black text-emerald-400 dark:text-emerald-400 [body.light-theme_&]:text-slate-950 [body.light-theme_&]:font-extrabold">
                    Rp {simCalculations.cashCollected.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-[9px] text-emerald-300/80 dark:text-emerald-300/80 [body.light-theme_&]:text-slate-600">
                  (Order baru: {newOrderPayMethod === 'TEMPO_BON' ? 'Tempo Bon' : 'Tunai Lunas'} • Nota lama: Rp {prevInvoicePayAmount.toLocaleString('id-ID')})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AGING PIUTANG 3-BUCKET */}
      {activeSubTab === 'aging' && (
        <div className="space-y-4">
          {/* 3 BUCKET STRIP CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bucket 1: 0-7 Hari */}
            <div
              onClick={() => setSelectedBucketFilter(selectedBucketFilter === '0-7' ? 'ALL' : '0-7')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedBucketFilter === '0-7'
                  ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.3)] [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:border-emerald-500'
                  : 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-400 dark:bg-slate-900/90 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 [body.light-theme_&]:border-emerald-300">
                  0 - 7 Hari (Lancar)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 dark:text-emerald-400 [body.light-theme_&]:text-slate-700">
                  {agingSummary.bucket0_7.invoiceCount} Nota
                </span>
              </div>
              <div className="text-lg font-mono font-black text-emerald-300 dark:text-emerald-300 [body.light-theme_&]:text-slate-950 mt-2">
                Rp {agingSummary.bucket0_7.totalAmount.toLocaleString('id-ID')}
              </div>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 block font-mono">
                {agingSummary.bucket0_7.percentage}% dari seluruh saldo piutang
              </span>
            </div>

            {/* Bucket 2: 8-14 Hari */}
            <div
              onClick={() => setSelectedBucketFilter(selectedBucketFilter === '8-14' ? 'ALL' : '8-14')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedBucketFilter === '8-14'
                  ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.3)] [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:border-amber-500'
                  : 'bg-slate-900/90 border-amber-500/30 hover:border-amber-400 dark:bg-slate-900/90 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border-amber-300">
                  8 - 14 Hari (Jatuh Tempo)
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 dark:text-amber-400 [body.light-theme_&]:text-slate-700">
                  {agingSummary.bucket8_14.invoiceCount} Nota
                </span>
              </div>
              <div className="text-lg font-mono font-black text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-950 mt-2">
                Rp {agingSummary.bucket8_14.totalAmount.toLocaleString('id-ID')}
              </div>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 block font-mono">
                {agingSummary.bucket8_14.percentage}% peringatan tindak lanjut supir
              </span>
            </div>

            {/* Bucket 3: >14 Hari */}
            <div
              onClick={() => setSelectedBucketFilter(selectedBucketFilter === '>14' ? 'ALL' : '>14')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedBucketFilter === '>14'
                  ? 'bg-rose-500/20 border-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.3)] [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:border-rose-500'
                  : 'bg-slate-900/90 border-rose-500/30 hover:border-rose-400 dark:bg-slate-900/90 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-900 [body.light-theme_&]:border-rose-300">
                  &gt;14 Hari (Menunggak)
                </span>
                <span className="text-xs font-mono font-bold text-rose-400 dark:text-rose-400 [body.light-theme_&]:text-slate-700">
                  {agingSummary.bucketGt14.invoiceCount} Nota
                </span>
              </div>
              <div className="text-lg font-mono font-black text-rose-300 dark:text-rose-300 [body.light-theme_&]:text-slate-950 mt-2">
                Rp {agingSummary.bucketGt14.totalAmount.toLocaleString('id-ID')}
              </div>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 block font-mono">
                {agingSummary.bucketGt14.percentage}% penangguhan drop galon baru
              </span>
            </div>
          </div>

          {/* DAFTAR FAKTUR TEMPO AGING */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 dark:bg-slate-900/90 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-2.5">
              <div>
                <h3 className="text-xs font-black text-white dark:text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400 [body.light-theme_&]:text-blue-900" />
                  <span>Daftar Faktur Tempo per Mitra ({filteredInvoices.length})</span>
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                  Filter aktif: {selectedBucketFilter === 'ALL' ? 'Seluruh Bucket' : `Bucket ${selectedBucketFilter} Hari`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchPartnerTerm}
                  onChange={(e) => setSearchPartnerTerm(e.target.value)}
                  placeholder="Cari nama toko / nomor faktur..."
                  className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white dark:bg-slate-950 dark:border-slate-800 dark:text-white [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 overflow-x-auto">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    inv.bucket === 'BUCKET_GT14_MENUNGGAK'
                      ? 'bg-rose-950/20 border-rose-500/40 dark:bg-rose-950/20 [body.light-theme_&]:bg-rose-50/70 [body.light-theme_&]:border-rose-300'
                      : inv.bucket === 'BUCKET_8_14_JATUH_TEMPO'
                      ? 'bg-amber-950/20 border-amber-500/40 dark:bg-amber-950/20 [body.light-theme_&]:bg-amber-50/70 [body.light-theme_&]:border-amber-300'
                      : 'bg-slate-950/70 border-slate-800 dark:bg-slate-950/70 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-white dark:text-white [body.light-theme_&]:text-slate-900 text-[11px]">
                        {inv.invoiceNumber}
                      </span>
                      <span className="font-black text-white dark:text-white [body.light-theme_&]:text-slate-900 text-xs">{inv.partnerName}</span>
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-black uppercase ${
                        inv.bucket === 'BUCKET_GT14_MENUNGGAK'
                          ? 'bg-rose-500 text-white'
                          : inv.bucket === 'BUCKET_8_14_JATUH_TEMPO'
                          ? 'bg-amber-500 text-slate-950 [body.light-theme_&]:bg-amber-500 [body.light-theme_&]:text-slate-950'
                          : 'bg-emerald-500/20 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-950'
                      }`}>
                        {inv.daysElapsed} Hari Terlewat
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 font-mono flex items-center gap-3">
                      <span>Jatuh Tempo: {inv.dueDate}</span>
                      <span>Air: {inv.waterSummary}</span>
                      {inv.fmcgSummary && inv.fmcgSummary !== 'Tidak ada' && (
                        <span className="text-amber-400 dark:text-amber-400 [body.light-theme_&]:text-amber-700 font-semibold">Sembako: {inv.fmcgSummary}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-black text-sm text-emerald-400 dark:text-emerald-400 [body.light-theme_&]:text-slate-950">
                        Rp {inv.remainingBalance.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[9px] text-slate-500 dark:text-slate-500 [body.light-theme_&]:text-slate-600 block font-mono">
                        Total Faktur: Rp {inv.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSendWaReminder(inv)}
                        className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 dark:bg-emerald-500/20 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 [body.light-theme_&]:border-emerald-300 cursor-pointer transition-all"
                        title="Kirim Peringatan WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickSettle(inv)}
                        className="py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10.5px] cursor-pointer transition-all active:scale-95 shadow-sm [body.light-theme_&]:bg-cyan-600 [body.light-theme_&]:hover:bg-cyan-700 [body.light-theme_&]:text-white"
                      >
                        Pelunasan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SALDO TABUNG PER MITRA */}
      {activeSubTab === 'gallons' && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 dark:bg-slate-900/90 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-2.5">
            <div>
              <h3 className="text-xs font-black text-white dark:text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-400 [body.light-theme_&]:text-blue-900" />
                <span>Konservasi Fisik Tabung Galon per Toko Mitra ({partners.length})</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                Plafon kuota tabung galon tertahan, deposit jaminan &amp; status risiko aset depo
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {partners.map((partner) => {
              const holdingPercent = Math.round(
                (partner.holdingEmptyGallonDebt / Math.max(1, partner.maxGallonHoldingQuota)) * 100
              );
              const isCritical = holdingPercent >= 90;
              const isWarning = holdingPercent >= 70;

              return (
                <div
                  key={partner.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 dark:bg-slate-950 dark:border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white dark:text-white [body.light-theme_&]:text-slate-900 text-xs">{partner.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono bg-slate-800 text-cyan-300 border border-slate-700 dark:bg-slate-800 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-900 [body.light-theme_&]:border-cyan-300 font-semibold">
                        {partner.partnerType === 'TOKO_WARUNG' ? '🏪 Toko Mitra' : '💧 Refil Mandiri'}
                      </span>
                      {partner.assignedSalesId && (
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                          Sales: {partner.assignedSalesId}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600">{partner.address} • PIC: {partner.ownerName}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono">
                    <div className="text-center sm:text-right">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-500 [body.light-theme_&]:text-slate-600 font-semibold block">
                        Tabung Tertahan
                      </span>
                      <span className={`text-sm font-black [body.light-theme_&]:text-slate-950 ${isCritical ? 'text-rose-400 dark:text-rose-400' : isWarning ? 'text-amber-400 dark:text-amber-400' : 'text-cyan-300 dark:text-cyan-300'}`}>
                        {partner.holdingEmptyGallonDebt} / {partner.maxGallonHoldingQuota} Gln ({holdingPercent}%)
                      </span>
                    </div>

                    <div className="text-center sm:text-right">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-500 [body.light-theme_&]:text-slate-600 font-semibold block">
                        Piutang Aktif
                      </span>
                      <span className="text-xs font-bold text-emerald-400 dark:text-emerald-400 [body.light-theme_&]:text-slate-950">
                        Rp {partner.currentReceivableBalance.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartnerId(partner.id);
                        setActiveSubTab('simulator');
                      }}
                      className="py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 dark:bg-cyan-500/20 dark:text-cyan-300 [body.light-theme_&]:bg-cyan-600 [body.light-theme_&]:text-white [body.light-theme_&]:border-cyan-700 [body.light-theme_&]:hover:bg-cyan-700 text-[10.5px] font-bold cursor-pointer transition-all"
                    >
                      Buka Re-Visit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LOG SIRKULASI FISIK */}
      {activeSubTab === 'movements' && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 dark:bg-slate-900/90 dark:border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-2.5">
            <div>
              <h3 className="text-xs font-black text-white dark:text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400 [body.light-theme_&]:text-blue-900" />
                <span>Log Riwayat Mutasi Sirkulasi Tabung Galon Fisik</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                Pencatatan real-time galon isi keluar &amp; galon kosong ditarik oleh armada
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {movements.map((mov) => (
              <div
                key={mov.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 dark:bg-slate-950 dark:border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 dark:text-cyan-400 [body.light-theme_&]:text-slate-900 font-bold">{mov.partnerName}</span>
                    <span className="text-slate-500 [body.light-theme_&]:text-slate-400">•</span>
                    <span className="text-slate-400 dark:text-slate-400 [body.light-theme_&]:text-slate-700 font-medium">{mov.driverName}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 [body.light-theme_&]:text-slate-600 font-sans mt-0.5">{mov.notes}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-cyan-300 dark:text-cyan-300 [body.light-theme_&]:text-cyan-800 font-bold block">
                      ↓ {mov.filledOut} Gln Isi Keluar
                    </span>
                    <span className="text-emerald-400 dark:text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold block">
                      ↑ {mov.emptyReturned} Gln Kosong Kembali
                    </span>
                  </div>
                  <div className="text-right pl-2 border-l border-slate-800 [body.light-theme_&]:border-slate-300">
                    <span className="text-amber-300 dark:text-amber-300 [body.light-theme_&]:text-slate-950 font-black block">
                      Sisa: {mov.holdingBalanceAfter} Gln
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-500 [body.light-theme_&]:text-slate-600">{mov.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterFmcgArchitectureView;
