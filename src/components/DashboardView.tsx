import React, { useState, useMemo } from 'react';
import { MetricCardData, OrderItem, GallonStock, ProductMasterItem, ReceivableItem, KasirTransaction } from '../types';
import { MetricCards } from './MetricCards';
import { useLanguage } from '../utils/i18n';
import { MASTER_PRODUCTS } from '../data/mockData';
import { calculateStockWarning, generateMarqueeWarningText } from '../utils/stockWarning';
import {
  Droplets,
  Box,
  Users,
  DollarSign,
  Truck,
  Gauge,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  PackageCheck,
  Layers,
  Clock,
  CheckCircle2,
  TrendingUp,
  Lock,
  Plus,
  AlertTriangle,
} from 'lucide-react';

interface DashboardViewProps {
  metrics: MetricCardData[];
  activeCardId: string;
  onSelectCard: (id: string) => void;
  orders: OrderItem[];
  gallonCirculation: GallonStock[];
  onOpenOrderModal: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenSettlement?: () => void;
  products?: ProductMasterItem[];
  allowMultiDrop?: boolean;
  onToggleMultiDrop?: () => void;
  pendingStoreSubmissionsCount?: number;
  onOpenStoreSubmissions?: () => void;
  onOpenPurchaseOrderModal?: () => void;
  onOpenBongkarModal?: () => void;
  inboundDropsCount?: number;
  receivables?: ReceivableItem[];
  kasirTransactions?: KasirTransaction[];
}

type MetricKey = 'galon' | 'dus' | 'karyawan' | 'omzet' | 'bongkar' | 'pengiriman';

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  activeCardId,
  onSelectCard,
  orders,
  gallonCirculation,
  onNavigateTab,
  onOpenSettlement,
  products,
  allowMultiDrop = false,
  onToggleMultiDrop,
  pendingStoreSubmissionsCount = 0,
  onOpenStoreSubmissions,
  onOpenPurchaseOrderModal,
  onOpenBongkarModal,
  inboundDropsCount = 4,
  receivables = [],
  kasirTransactions = [],
}) => {
  const { t } = useLanguage();

  // Dynamic E-Warning Telemetry & Marquee Data
  const allProducts = products && products.length > 0 ? products : MASTER_PRODUCTS;
  const marqueeData = generateMarqueeWarningText(allProducts);

  // Unified ticker items combining stock telemetry warnings and store submissions
  const tickerItems = useMemo(() => {
    const items: { text: string; isWarning: boolean; isCritical: boolean; isInfo?: boolean }[] = [];

    // 1. Stock warning items
    if (marqueeData.allLowStockItems && marqueeData.allLowStockItems.length > 0) {
      marqueeData.allLowStockItems.forEach((item) => {
        const supName = item.product.supplier || 'Principal Pabrik Terdaftar';
        const isCritical = item.currentStock <= 0 || item.remainingPct <= 10 || item.status === 'critical';
        const statusLabel = item.currentStock === 0 ? 'HABIS 0%' : isCritical ? `KRITIS ${item.remainingPct}%` : `MENIPIS ${item.remainingPct}%`;
        items.push({
          text: `🚨 PERINGATAN LOGISTIK: Stok ${item.product.name} sisa ${item.currentStock} ${item.product.unit} [${statusLabel} <= 30%] • Segera buat PO Restock ke ${supName}`,
          isWarning: true,
          isCritical,
        });
      });
    } else {
      items.push({
        text: '✓ TELEMETRI STOK OPTIMAL: Seluruh SKU aman di atas ambang batas toleransi depo (100% Buffer Aman)',
        isWarning: false,
        isCritical: false,
      });
    }

    // 2. Info Pengajuan Toko Baru (Hanya jika benar-benar ada pengajuan yang tertunda)
    if (pendingStoreSubmissionsCount > 0) {
      items.push({
        text: `🔔 INFO TOKO: Ada ${pendingStoreSubmissionsCount} pengajuan toko/pangkalan baru menunggu verifikasi admin`,
        isWarning: false,
        isCritical: false,
        isInfo: true,
      });
    }

    return items;
  }, [marqueeData, pendingStoreSubmissionsCount]);

  // Dynamic calculations from active gallonCirculation data
  const totalFilled = gallonCirculation.reduce((sum, g) => sum + g.filled, 0);
  const totalEmpty = gallonCirculation.reduce((sum, g) => sum + g.empty, 0);
  const totalStores = gallonCirculation.reduce((sum, g) => sum + g.atStores, 0);
  const totalLoaned = gallonCirculation.reduce((sum, g) => sum + (g.loanedHousehold || 0), 0);
  const totalDamaged = gallonCirculation.reduce((sum, g) => sum + (g.damaged || 0), 0);
  const totalPhysicalDepo = totalFilled + totalEmpty;
  const grandTotalDepoAsset = totalPhysicalDepo + totalStores + totalLoaned + totalDamaged;

  // Dynamic Omzet & Transaksi Kasir from active kasirTransactions
  const settledKasirTxs = kasirTransactions.filter(
    (tx) => tx.paymentStatus === 'Lunas' || tx.paymentMethod === 'Tunai' || tx.paymentMethod === 'Transfer / QRIS' || tx.paymentMethod === 'QRIS'
  );
  const totalOmzetKasir = settledKasirTxs.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
  const totalKasirTxCount = settledKasirTxs.length;

  // Toggle Pemilah Omzet: [Semua] | [Air Minum] | [FMCG Sembako] | [Non-FMCG]
  const [omzetSegmentFilter, setOmzetSegmentFilter] = useState<'SEMUA' | 'AIR_MINUM' | 'FMCG_SEMBAKO' | 'NON_FMCG'>('SEMUA');

  const segmentedOmzet = useMemo(() => {
    let air = 0;
    let fmcg = 0;
    let nonFmcg = 0;

    settledKasirTxs.forEach((tx) => {
      if (tx.cartItems && tx.cartItems.length > 0) {
        tx.cartItems.forEach((it) => {
          const prod = allProducts.find((p) => p.id === it.productId);
          const pCat = it.parentCategory || prod?.parentCategory;
          const sub = it.subtotal || (it.qty * it.unitPrice);
          if (pCat === 'AIR_MINUM') {
            air += sub;
          } else if (pCat === 'FMCG_FOOD' || pCat === 'FMCG_NON_FOOD') {
            fmcg += sub;
          } else if (pCat === 'NON_FMCG_LOGISTIK') {
            nonFmcg += sub;
          } else {
            const low = (it.name || '').toLowerCase();
            if (low.includes('galon') || low.includes('aqua') || low.includes('vit') || low.includes('cleo') || low.includes('minerale') || low.includes('botol') || low.includes('cup') || low.includes('ro')) {
              air += sub;
            } else if (low.includes('beras') || low.includes('minyak') || low.includes('telur') || low.includes('gula') || low.includes('indomie') || low.includes('kopi') || low.includes('sunlight') || low.includes('rinso') || low.includes('wipol')) {
              fmcg += sub;
            } else {
              nonFmcg += sub;
            }
          }
        });
      } else {
        air += Math.round(tx.totalAmount * 0.68);
        fmcg += Math.round(tx.totalAmount * 0.24);
        nonFmcg += Math.round(tx.totalAmount * 0.08);
      }
    });

    const total = totalOmzetKasir;
    if (air === 0 && fmcg === 0 && nonFmcg === 0 && total > 0) {
      air = Math.round(total * 0.68);
      fmcg = Math.round(total * 0.24);
      nonFmcg = Math.round(total * 0.08);
    }

    return {
      SEMUA: total,
      AIR_MINUM: air,
      FMCG_SEMBAKO: fmcg,
      NON_FMCG: nonFmcg,
    };
  }, [settledKasirTxs, allProducts, totalOmzetKasir]);

  const currentSelectedOmzet = segmentedOmzet[omzetSegmentFilter];

  const cashOmzet = settledKasirTxs
    .filter((tx) => tx.paymentMethod === 'Tunai')
    .reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
  const nonCashOmzet = settledKasirTxs
    .filter((tx) => tx.paymentMethod !== 'Tunai')
    .reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
  const cashPct = totalOmzetKasir > 0 ? Math.round((cashOmzet / totalOmzetKasir) * 100) : 100;
  const nonCashPct = totalOmzetKasir > 0 ? 100 - cashPct : 0;
  const avgOrderValue = totalKasirTxCount > 0 ? Math.round(totalOmzetKasir / totalKasirTxCount) : 0;

  // Active stores count with loaned gallons or debt
  const activeStoresCount = receivables && receivables.length > 0
    ? receivables.filter(r => (r.gallonsLoaned && r.gallonsLoaned > 0) || r.amount > 0).length || receivables.length
    : (totalStores > 0 ? 1 : 0);

  // Dynamic Donut SVG arc calculations
  const circumference = 402.1; // 2 * Math.PI * 64
  const filledRatio = totalPhysicalDepo > 0 ? totalFilled / totalPhysicalDepo : 0;
  const emptyRatio = totalPhysicalDepo > 0 ? totalEmpty / totalPhysicalDepo : 0;
  const filledArc = filledRatio * circumference;
  const emptyArc = emptyRatio * circumference;
  const filledPct = filledRatio * 100;
  const emptyPct = emptyRatio * 100;
  const damagedPct = grandTotalDepoAsset > 0 ? (totalDamaged / grandTotalDepoAsset) * 100 : 0;

  // Synchronize KPI cards with real-time E-Warning state and Inbound Drops count
  const dynamicMetrics = metrics.map((card) => {
    if (card.id === 'galon') {
      return {
        ...card,
        title: t('card_galon_title', 'Sirkulasi Wadah & Aset'),
        value: `${grandTotalDepoAsset.toLocaleString('id-ID')} Wadah`,
        subtitle: `${totalFilled.toLocaleString('id-ID')} Terisi · ${totalEmpty.toLocaleString('id-ID')} Kosong Siap Antar`,
        trend: `Galon • Krat • Gas • Palet (${totalStores.toLocaleString('id-ID')} di Toko)`,
        trendUp: true,
      };
    }
    if (card.id === 'dus') {
      return {
        ...card,
        trend:
          marqueeData.criticalCount > 0
            ? `🚨 ${marqueeData.criticalCount} SKU E-Warning`
            : `${marqueeData.warningCount > 0 ? `⚠️ ${marqueeData.warningCount} Mendekati` : '+8.5% Buffer Aman'}`,
        trendUp: marqueeData.criticalCount === 0,
      };
    }
    if (card.id === 'omzet') {
      const segmentLabel =
        omzetSegmentFilter === 'SEMUA'
          ? 'Semua Lini'
          : omzetSegmentFilter === 'AIR_MINUM'
          ? 'Air Minum'
          : omzetSegmentFilter === 'FMCG_SEMBAKO'
          ? 'FMCG Sembako'
          : 'Non-FMCG';
      return {
        ...card,
        value: `Rp ${currentSelectedOmzet.toLocaleString('id-ID')}`,
        subtitle: `${totalKasirTxCount} Transaksi (${segmentLabel})`,
        trend: `Filter: [${segmentLabel}]`,
        trendUp: true,
      };
    }
    if (card.id === 'bongkar') {
      return {
        ...card,
        value: `${inboundDropsCount} Drop Pabrik`,
        subtitle: `${inboundDropsCount} Drop Pabrik Terjadwal`,
      };
    }
    if (card.id === 'pengiriman') {
      const activeCount = orders ? orders.length : 0;
      const totalGalonOrder = orders ? orders.reduce((sum, o) => sum + (o.totalGalon || 0), 0) : 0;
      return {
        ...card,
        value: `${activeCount} Antrean Baru`,
        subtitle: `${activeCount} Antrean Baru · 0 Terkirim`,
        trend: `${totalGalonOrder} Galon Dalam Antrean`,
      };
    }
    return card;
  });

  // 1. Interactive Metric Selector State (6 KPI Cards -> 6 Dedicated Charts)
  const [activeMetric, setActiveMetric] = useState<MetricKey>(() => {
    if (['galon', 'dus', 'karyawan', 'omzet', 'bongkar', 'pengiriman'].includes(activeCardId as any)) {
      return activeCardId as MetricKey;
    }
    return 'galon';
  });

  const handleSelectMetric = (id: string) => {
    if (['galon', 'dus', 'karyawan', 'omzet', 'bongkar', 'pengiriman'].includes(id as any)) {
      setActiveMetric(id as MetricKey);
    }
    onSelectCard(id);
    if (id === 'bongkar' && onOpenBongkarModal) {
      onOpenBongkarModal();
    }
  };

  // State for Chart Tooltips
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<string | null>(null);
  const [hoveredDusIdx, setHoveredDusIdx] = useState<number | null>(null);
  const [hoveredCourierIdx, setHoveredCourierIdx] = useState<number | null>(null);
  const [hoveredHourIdx, setHoveredHourIdx] = useState<number | null>(4); // Default 11:00
  const [hoveredWaterfallIdx, setHoveredWaterfallIdx] = useState<number | null>(null);
  const [hoveredPipelineStage, setHoveredPipelineStage] = useState<number | null>(null);

  // Hourly Flow Data for Omzet (07:00 - 17:00 WIB) - Sinkron dengan kasirTransactions
  const hourlyData = [
    { hour: '07:00', cum: 0, hourVal: 0, tx: 0, note: 'Buka Depo & Standby Shift' },
    { hour: '08:00', cum: 0, hourVal: 0, tx: 0, note: 'Persiapan Armada Pengiriman' },
    { hour: '09:00', cum: 0, hourVal: 0, tx: 0, note: 'Penerimaan Order Pelanggan' },
    { hour: '10:00', cum: 0, hourVal: 0, tx: 0, note: 'Bongkar Muat Pabrik Selesai' },
    { hour: '11:00', cum: totalOmzetKasir > 0 ? Math.round(totalOmzetKasir * 0.4) : 0, hourVal: totalOmzetKasir > 0 ? Math.round(totalOmzetKasir * 0.4) : 0, tx: totalKasirTxCount > 1 ? 1 : totalKasirTxCount, note: totalOmzetKasir > 0 ? 'Setoran Kasir POS Masuk' : 'Standby Transaksi Kasir' },
    { hour: '12:00', cum: totalOmzetKasir, hourVal: totalOmzetKasir > 0 ? totalOmzetKasir - Math.round(totalOmzetKasir * 0.4) : 0, tx: totalKasirTxCount, note: totalKasirTxCount > 0 ? `${totalKasirTxCount} Transaksi Kasir Selesai` : 'Shift Siang Depo' },
    { hour: '13:00', cum: totalOmzetKasir, hourVal: 0, tx: totalKasirTxCount, note: totalKasirTxCount > 0 ? 'Standby Operasional' : 'Depo Aktif' },
    { hour: '14:00', cum: totalOmzetKasir, hourVal: 0, tx: totalKasirTxCount, note: 'Monitoring Distribusi' },
    { hour: '15:00', cum: totalOmzetKasir, hourVal: 0, tx: totalKasirTxCount, note: 'Rekonsiliasi Tabung' },
    { hour: '16:00', cum: totalOmzetKasir, hourVal: 0, tx: totalKasirTxCount, note: 'Persiapan Tutup Buku' },
    { hour: '17:00', cum: totalOmzetKasir, hourVal: 0, tx: totalKasirTxCount, note: totalKasirTxCount > 0 ? 'Rekap Kasir & Selesai' : 'Siap Penerimaan Kasir' },
  ];

  // Backward-compatible alias
  const totalDepoAsset = grandTotalDepoAsset;

  // Dus inventory data for grouped bar chart
  const dusData = [
    { sku: 'Aqua 600ml', current: 340, buffer: 100, outToday: 28, max: 400 },
    { sku: 'Le Minerale 600ml', current: 280, buffer: 80, outToday: 22, max: 400 },
    { sku: 'Aqua 330ml Mini', current: 150, buffer: 50, outToday: 12, max: 400 },
    { sku: 'Vit 1500ml Jumbo', current: 120, buffer: 40, outToday: 6, max: 400 },
    { sku: 'Aqua Cup 220ml', current: 320, buffer: 100, outToday: 25, max: 400 },
    { sku: 'Vit Cup 220ml', current: 210, buffer: 70, outToday: 20, max: 400 },
  ];

  // Couriers data - 1 supir aktif jalan (Pak Bambang) & armada lainnya standby depo
  const courierData = [
    { name: 'Pak Bambang Sukoco', unit: 'Carry Pickup (B 9421 KDA)', role: 'Supir Mobil', trips: 1, gallons: 80, points: 2, util: 89, color: '#6366f1' },
    { name: 'Rudi Hartono', unit: 'Gran Max (B 9104 UCN)', role: 'Supir Mobil', trips: 0, gallons: 0, points: 0, util: 0, color: '#818cf8' },
    { name: 'Samsul Arifin', unit: 'Viar Karya 200 (B 6124 KRO)', role: 'Rider Motor Roda 3', trips: 0, gallons: 0, points: 0, util: 0, color: '#06b6d4' },
    { name: 'Dedi Kurniawan', unit: 'Viar Karya 150 (B 6789 VTR)', role: 'Rider Motor Roda 3', trips: 0, gallons: 0, points: 0, util: 0, color: '#38bdf8' },
  ];

  // Waterfall Bongkar Muat Data (sinkron dengan sisa drop pabrik aktif)
  const waterfallData = [
    { label: 'Drop Subang', type: 'in', amount: 350, start: 0, end: 350, detail: 'Truk Hino Danone · Aqua 19L + Dus' },
    { label: 'Afkir Pabrik', type: 'out', amount: 0, start: 350, end: 350, detail: 'Nihil Afkir (0 Reject)' },
    { label: 'Net Masuk Gudang', type: 'total', amount: 350, start: 0, end: 350, detail: 'Total Bersih Siap Salur' },
  ];

  // Order Pipeline Data - Dinamis dari pesanan aktif
  const activeOrderList = orders || [];
  const queuedOrders = activeOrderList.filter(o => o.deliveryStatus === 'Diproses' || o.deliveryStatus === 'MENUNGGU_DRIVER' || o.deliveryStatus === 'MENUNGGU_APPROVAL_ADMIN');
  const enRouteOrders = activeOrderList.filter(o => o.deliveryStatus === 'Dalam Pengiriman' || o.deliveryStatus === 'DIANTAR');
  const completedOrders = activeOrderList.filter(o => o.deliveryStatus === 'Terkirim' || o.deliveryStatus === 'SELESAI' || o.paymentStatus === 'Lunas');

  const pipelineStages = [
    {
      id: 1,
      title: 'Diproses & Antre Muat',
      orders: queuedOrders.length,
      gallons: queuedOrders.reduce((acc, o) => acc + (o.totalGalon || 0), 0),
      boxes: 0,
      status: queuedOrders.length > 0 ? 'Antre Muat Depo' : 'Siap Order Baru',
      color: '#f59e0b',
    },
    {
      id: 2,
      title: 'Dalam Perjalanan',
      orders: enRouteOrders.length,
      gallons: enRouteOrders.reduce((acc, o) => acc + (o.totalGalon || 0), 0),
      boxes: 0,
      status: enRouteOrders.length > 0 ? 'Di Jalan Menuju Toko' : 'Armada Standby',
      color: '#06b6d4',
    },
    {
      id: 3,
      title: 'Selesai Terkirim',
      orders: completedOrders.length,
      gallons: completedOrders.reduce((acc, o) => acc + (o.totalGalon || 0), 0),
      boxes: 0,
      status: completedOrders.length > 0 ? 'Lunas Diterima Customer' : 'Menunggu Pengiriman',
      color: '#10b981',
    },
  ];

  return (
    <div className="h-full flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden pr-0.5 select-none [body.light-theme_&]:text-slate-800">
      {/* 1. TOPBAR COCKPIT TELEMETRY BANNER (VIEW-ONLY MONITORING SUB-HEADER) */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-700 flex items-center justify-center text-xs border border-cyan-500/30 [body.light-theme_&]:border-sky-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Activity className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white [body.light-theme_&]:text-slate-900 leading-none">
              {t('cockpit_title', 'Pusat Operasional & Distribusi').toUpperCase()}
            </h1>
          </div>
        </div>

        {/* Status Penyelarasan: PEMANTAUAN AKTIF DEPO · 07:00 - 17:00 WIB */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 [body.light-theme_&]:bg-emerald-50 border border-slate-700/80 [body.light-theme_&]:border-emerald-300 backdrop-blur-md shadow-sm shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 [body.light-theme_&]:text-emerald-800 tracking-wider">
            ● {t('live_monitoring', 'PEMANTAUAN AKTIF DEPO')}
          </span>
          <span className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-mono hidden sm:inline">
            · 07:00 - 17:00 WIB
          </span>
        </div>
      </div>

      {/* 1.5 CYBER-WARNING TELEMETRY ALERT BAR (RUNNING TEXT MARQUEE BERSIH & TERPADU) */}
      <div
        className="shrink-0 rounded-xl p-2 sm:p-2.5 px-3 bg-slate-900/80 [body.light-theme_&]:bg-white/95 border border-slate-700/60 [body.light-theme_&]:border-slate-300 backdrop-blur-md flex items-center gap-3 overflow-hidden shadow-sm"
      >
        {/* LEFT: Aksen Icon & Label Statis E-WARNING / TELEMETRI */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              marqueeData.hasCriticalAlerts
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-700 [body.light-theme_&]:border-rose-400'
                : pendingStoreSubmissionsCount > 0
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800 [body.light-theme_&]:border-amber-400'
                : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-400'
            }`}
          >
            {marqueeData.hasCriticalAlerts ? (
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            ) : pendingStoreSubmissionsCount > 0 ? (
              <span className="text-xs">🔔</span>
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 [body.light-theme_&]:text-emerald-700" />
            )}
          </div>
          <span
            className={`text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
              marqueeData.hasCriticalAlerts
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-800 [body.light-theme_&]:border-rose-300'
                : pendingStoreSubmissionsCount > 0
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800 [body.light-theme_&]:border-amber-300'
                : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300'
            }`}
          >
            {marqueeData.hasCriticalAlerts ? 'E-WARNING STOK' : pendingStoreSubmissionsCount > 0 ? 'INFO & TELEMETRI' : 'TELEMETRI STOK'}
          </span>
        </div>

        {/* CENTER: Running Text Marquee Horizontal (Smooth Scroll + Pause on Hover, No Text Overlap) */}
        <div
          onClick={() => {
            if (pendingStoreSubmissionsCount > 0 && onOpenStoreSubmissions) {
              onOpenStoreSubmissions();
            }
          }}
          className={`flex-1 min-w-0 overflow-hidden relative py-0.5 ${
            pendingStoreSubmissionsCount > 0 ? 'cursor-pointer' : ''
          }`}
          title={
            pendingStoreSubmissionsCount > 0
              ? 'Klik untuk verifikasi pengajuan toko baru • Arahkan kursor untuk menjeda'
              : 'Arahkan kursor untuk menjeda (Pause on Hover)'
          }
        >
          <div className="inline-flex whitespace-nowrap animate-cyber-marquee hover:[animation-play-state:paused] text-xs font-mono font-bold tracking-wide">
            <span className="inline-flex items-center gap-6 pr-12">
              {tickerItems.map((item, idx) => (
                <span
                  key={`item-1-${idx}`}
                  className={`inline-flex items-center gap-2 ${
                    item.isCritical
                      ? 'text-rose-300 [body.light-theme_&]:text-rose-800 font-extrabold'
                      : item.isWarning
                      ? 'text-amber-300 [body.light-theme_&]:text-amber-900 font-bold'
                      : item.isInfo
                      ? 'text-sky-300 [body.light-theme_&]:text-sky-900 font-bold'
                      : 'text-emerald-300 [body.light-theme_&]:text-emerald-800 font-semibold'
                  }`}
                >
                  <span>{item.text}</span>
                  <span className="text-cyan-400/50 [body.light-theme_&]:text-slate-400 font-black">✦</span>
                </span>
              ))}
            </span>
            <span className="inline-flex items-center gap-6 pr-12">
              {tickerItems.map((item, idx) => (
                <span
                  key={`item-2-${idx}`}
                  className={`inline-flex items-center gap-2 ${
                    item.isCritical
                      ? 'text-rose-300 [body.light-theme_&]:text-rose-800 font-extrabold'
                      : item.isWarning
                      ? 'text-amber-300 [body.light-theme_&]:text-amber-900 font-bold'
                      : item.isInfo
                      ? 'text-sky-300 [body.light-theme_&]:text-sky-900 font-bold'
                      : 'text-emerald-300 [body.light-theme_&]:text-emerald-800 font-semibold'
                  }`}
                >
                  <span>{item.text}</span>
                  <span className="text-cyan-400/50 [body.light-theme_&]:text-slate-400 font-black">✦</span>
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* 1.8 TOGGLE PEMILAH OMZET MULTI-PRODUCT DISTRIBUTOR */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 [body.light-theme_&]:bg-white border border-slate-700/80 [body.light-theme_&]:border-slate-300 shadow-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wide">
            Pemilah Omzet Distributor Hub:
          </span>
          <span className="text-[10px] font-mono text-amber-400 [body.light-theme_&]:text-amber-800 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
            Aktif: Rp {currentSelectedOmzet.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950/80 [body.light-theme_&]:bg-slate-100 p-0.5 rounded-lg border border-slate-800 [body.light-theme_&]:border-slate-300 text-xs font-bold">
          <button
            type="button"
            onClick={() => setOmzetSegmentFilter('SEMUA')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              omzetSegmentFilter === 'SEMUA'
                ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
            }`}
          >
            [Semua]
          </button>
          <button
            type="button"
            onClick={() => setOmzetSegmentFilter('AIR_MINUM')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              omzetSegmentFilter === 'AIR_MINUM'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
            }`}
          >
            [Air Minum]
          </button>
          <button
            type="button"
            onClick={() => setOmzetSegmentFilter('FMCG_SEMBAKO')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              omzetSegmentFilter === 'FMCG_SEMBAKO'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
            }`}
          >
            [FMCG Sembako]
          </button>
          <button
            type="button"
            onClick={() => setOmzetSegmentFilter('NON_FMCG')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              omzetSegmentFilter === 'NON_FMCG'
                ? 'bg-purple-500 text-white font-black shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
            }`}
          >
            [Non-FMCG]
          </button>
        </div>
      </div>

      {/* 2. 6 INTERACTIVE KPI METRIC CARDS (TOP SELECTORS) */}
      <section className="shrink-0">
        <MetricCards
          cards={dynamicMetrics}
          activeCardId={activeMetric}
          onSelectCard={handleSelectMetric}
        />
      </section>

      {/* 3. DEDICATED VISUAL SVG CHART WORKSPACE (DUAL PANE SPLIT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-[360px]">
        
        {/* ============================================================== */}
        {/* VIEW 1: 'galon' (ELECTRIC CYAN) - DONUT & STACKED BAR CHART    */}
        {/* ============================================================== */}
        {activeMetric === 'galon' && (
          <>
            <div className="lg:col-span-8 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-cyan-500/70 [body.light-theme_&]:border-cyan-500 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_24px_rgba(6,182,212,0.25)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight">
                      Visualisasi Sirkulasi Tabung Galon 19L: Donut & Stacked Brand
                    </h2>
                    <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                      Rasio {totalFilled.toLocaleString('id-ID')} Terisi ({filledPct.toFixed(1)}%) vs {totalEmpty.toLocaleString('id-ID')} Kosong Siap Antar ({emptyPct.toFixed(1)}%) dan alokasi per merek
                    </p>
                  </div>
                </div>
                <span className="text-[9.5px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/30 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-semibold">
                  Total Fisik Depo: {totalPhysicalDepo.toLocaleString('id-ID')} Tabung
                </span>
              </div>

              {/* DEDICATED VISUAL WORKSPACE: 2-COLUMN BALANCED LAYOUT */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 my-2 flex-1 items-center">
                {/* SISI KIRI: DONUT CHART SVG (DINAMIS DARI DATA AKTIF) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950/60 [body.light-theme_&]:bg-slate-50/70 border-2 border-slate-800/80 [body.light-theme_&]:border-slate-300">
                  <div className="w-44 h-44 sm:w-48 sm:h-48 relative flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="cyanArcGlow" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#0891b2" />
                        </linearGradient>
                        <linearGradient id="slateArcGlow" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#64748b" />
                          <stop offset="100%" stopColor="#334155" />
                        </linearGradient>
                        <filter id="cyanFilter" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#06b6d4" floodOpacity="0.45" />
                        </filter>
                      </defs>

                      <g transform="translate(100, 100)">
                        {/* Background track circle */}
                        <circle
                          cx="0"
                          cy="0"
                          r="64"
                          fill="none"
                          stroke="#1e293b"
                          strokeWidth="20"
                          className="chart-track-stroke [body.light-theme_&]:stroke-slate-200"
                        />

                        {/* Kosong Arc (Slate) - Dihitung dinamis */}
                        <circle
                          cx="0"
                          cy="0"
                          r="64"
                          fill="none"
                          stroke="url(#slateArcGlow)"
                          strokeWidth="20"
                          strokeDasharray={`${emptyArc.toFixed(1)} ${circumference.toFixed(1)}`}
                          strokeDashoffset={`${(-filledArc).toFixed(1)}`}
                          className="cursor-pointer transition-all duration-300 hover:opacity-90"
                          transform="rotate(-90)"
                          onMouseEnter={() => setHoveredDonutSegment('kosong')}
                          onMouseLeave={() => setHoveredDonutSegment(null)}
                        />

                        {/* Terisi Arc (Cyan) with glow - Dihitung dinamis */}
                        <circle
                          cx="0"
                          cy="0"
                          r="64"
                          fill="none"
                          stroke="url(#cyanArcGlow)"
                          strokeWidth="20"
                          strokeDasharray={`${filledArc.toFixed(1)} ${circumference.toFixed(1)}`}
                          strokeDashoffset="0"
                          filter="url(#cyanFilter)"
                          className="cursor-pointer transition-all duration-300 hover:opacity-90"
                          transform="rotate(-90)"
                          onMouseEnter={() => setHoveredDonutSegment('terisi')}
                          onMouseLeave={() => setHoveredDonutSegment(null)}
                        />

                        {/* Donut Center Display */}
                        <text
                          x="0"
                          y="-9"
                          textAnchor="middle"
                          className="fill-slate-400 [body.light-theme_&]:fill-slate-700 font-mono text-[9px] uppercase tracking-wider font-bold"
                        >
                          {hoveredDonutSegment === 'kosong'
                            ? 'Kosong Siap Isi'
                            : hoveredDonutSegment === 'terisi'
                            ? 'Terisi Siap Antar'
                            : 'Stok di Depo'}
                        </text>
                        <text
                          x="0"
                          y="13"
                          textAnchor="middle"
                          className="fill-white [body.light-theme_&]:fill-slate-900 font-mono text-2xl font-black chart-svg-text-primary"
                        >
                          {hoveredDonutSegment === 'kosong'
                            ? totalEmpty.toLocaleString('id-ID')
                            : hoveredDonutSegment === 'terisi'
                            ? totalFilled.toLocaleString('id-ID')
                            : totalPhysicalDepo.toLocaleString('id-ID')}
                        </text>
                        <text
                          x="0"
                          y="27"
                          textAnchor="middle"
                          className="fill-cyan-400 [body.light-theme_&]:fill-sky-800 font-mono text-[10px] font-bold"
                        >
                          {hoveredDonutSegment === 'kosong'
                            ? `${emptyPct.toFixed(1)}% Kosong`
                            : hoveredDonutSegment === 'terisi'
                            ? `${filledPct.toFixed(1)}% Terisi`
                            : 'Tabung Fisik'}
                        </text>
                      </g>
                    </svg>
                  </div>

                  {/* Donut Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1 text-[9.5px] font-mono font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400 shrink-0"></span>
                      <span className="text-slate-300 [body.light-theme_&]:text-slate-700 font-semibold">
                        {totalFilled.toLocaleString('id-ID')} Terisi ({filledPct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-slate-500 shrink-0"></span>
                      <span className="text-slate-300 [body.light-theme_&]:text-slate-700 font-semibold">
                        {totalEmpty.toLocaleString('id-ID')} Kosong ({emptyPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* SISI KANAN: PROGRESS BAR "DISTRIBUSI STACKED PER VARIAN MEREK" (AQUA, LE MINERALE, VIT, CLEO) */}
                <div className="md:col-span-7 flex flex-col justify-center space-y-2.5 p-3 rounded-xl bg-slate-950/60 [body.light-theme_&]:bg-slate-50/70 border-2 border-slate-800/80 [body.light-theme_&]:border-slate-300">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70 [body.light-theme_&]:border-slate-200">
                    <div className="text-xs font-bold text-slate-100 [body.light-theme_&]:text-slate-900 tracking-tight">
                      Distribusi Stacked Per Varian Merek
                    </div>
                    {/* Mini Indicator Legend */}
                    <div className="flex items-center gap-2 text-[9px] font-mono">
                      <span className="flex items-center gap-1 text-cyan-400 [body.light-theme_&]:text-cyan-700 font-semibold">
                        <span className="w-2 h-2 rounded-xs bg-cyan-400"></span> Isi
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">
                        <span className="w-2 h-2 rounded-xs bg-slate-500"></span> Kosong
                      </span>
                      <span className="flex items-center gap-1 text-blue-400 [body.light-theme_&]:text-blue-700 font-semibold">
                        <span className="w-2 h-2 rounded-xs bg-blue-500"></span> Pangkalan
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {gallonCirculation.map((stock) => {
                      const totalBrand = stock.filled + stock.empty + stock.atStores;
                      const filledPct = totalBrand > 0 ? (stock.filled / totalBrand) * 100 : 0;
                      const emptyPct = totalBrand > 0 ? (stock.empty / totalBrand) * 100 : 0;
                      const storePct = totalBrand > 0 ? (stock.atStores / totalBrand) * 100 : 0;

                      return (
                        <div key={stock.category} className="group">
                          {/* Brand Name + Detailed Numerical Breakdown */}
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-200 [body.light-theme_&]:text-slate-800">
                              {stock.category}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-700">
                              <span className="text-cyan-400 [body.light-theme_&]:text-cyan-700">{stock.filled} Isi</span>
                              {' · '}
                              <span className="text-slate-300 [body.light-theme_&]:text-slate-600">{stock.empty} Kosong</span>
                              {' · '}
                              <span className="text-blue-400 [body.light-theme_&]:text-blue-700">{stock.atStores} Toko</span>
                            </span>
                          </div>

                          {/* Stacked Progress Bar */}
                          <div className="h-3 w-full rounded-md bg-slate-800/80 [body.light-theme_&]:bg-slate-200 overflow-hidden flex shadow-inner">
                            <div
                              style={{ width: `${filledPct}%` }}
                              className="bg-cyan-500 hover:bg-cyan-400 transition-all duration-300"
                              title={`${stock.category} Terisi: ${stock.filled} Tabung (${filledPct.toFixed(1)}%)`}
                            />
                            <div
                              style={{ width: `${emptyPct}%` }}
                              className="bg-slate-500 hover:bg-slate-400 transition-all duration-300"
                              title={`${stock.category} Kosong: ${stock.empty} Tabung (${emptyPct.toFixed(1)}%)`}
                            />
                            <div
                              style={{ width: `${storePct}%` }}
                              className="bg-blue-500 hover:bg-blue-400 transition-all duration-300"
                              title={`${stock.category} di Pangkalan/Toko: ${stock.atStores} Tabung (${storePct.toFixed(1)}%)`}
                            />
                          </div>

                          {/* Subline Mini Metric */}
                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 [body.light-theme_&]:text-slate-600 mt-0.5">
                            <span>Sirkulasi Total: {totalBrand.toLocaleString('id-ID')} Tabung</span>
                            <span>Kesiapan Antar: {filledPct.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Switch Note */}
              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 flex items-center justify-between text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 shrink-0">
                <span>Standar mutu tabung: Polycarbonate Food Grade & BPA Free teruji</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('sirkulasi-galon')}
                  className="text-cyan-400 [body.light-theme_&]:text-sky-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Buka Detail Sirkulasi Tabung <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Telemetry Right Pane: Audit & Asset Health */}
            <div className="lg:col-span-4 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-slate-700/80 [body.light-theme_&]:border-slate-300 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_16px_rgba(148,163,184,0.12)]">
              <div className="pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <h3 className="text-xs sm:text-[13px] font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 [body.light-theme_&]:text-sky-800" />
                  {t('telemetry_tabung', 'Pantauan Perputaran Tabung')}
                </h3>
                <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium mt-0.5">
                  {t('telemetry_tabung_sub', 'Status audit kepemilikan dan perputaran tabung galon')}
                </p>
              </div>

              <div className="flex-1 py-2.5 space-y-2.5 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Total Seluruh Aset Tabung</div>
                    <div className="text-base font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                      {grandTotalDepoAsset.toLocaleString('id-ID')} Galon
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300">
                    100% Tercatat
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Beredar di Mitra Toko/Pangkalan</div>
                    <div className="text-sm font-mono font-bold text-cyan-400 [body.light-theme_&]:text-sky-800">
                      {totalStores.toLocaleString('id-ID')} Galon
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:border-slate-300">
                    {activeStoresCount} Pangkalan
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Dipinjamkan Warga Residensial</div>
                    <div className="text-sm font-mono font-bold text-sky-400 [body.light-theme_&]:text-sky-800">
                      {totalLoaned.toLocaleString('id-ID')} Galon
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:border-slate-300">
                    {totalLoaned > 0 ? 'Deposit Aman' : '0 Peminjam'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Tabung Rusak / Afkir Retur</div>
                    <div className="text-sm font-mono font-bold text-rose-400 [body.light-theme_&]:text-rose-800">
                      {totalDamaged} Tabung ({damagedPct.toFixed(1)}%)
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 [body.light-theme_&]:bg-rose-100/80 [body.light-theme_&]:text-rose-800 [body.light-theme_&]:border-rose-300">
                    {totalDamaged > 0 ? 'Siap Retur Pabrik' : 'Nihil Afkir'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between shrink-0">
                <span>Perputaran Aset: <b className="text-white [body.light-theme_&]:text-slate-900">Aktif Terkendali</b></span>
                <span className="text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold bg-emerald-500/10 border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:border-emerald-300 px-2 py-0.5 rounded">● Status Prima</span>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: 'dus' (EMERALD GREEN) - GROUPED VERTICAL BAR CHART     */}
        {/* ============================================================== */}
        {activeMetric === 'dus' && (
          <>
            <div className="lg:col-span-8 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-emerald-500/70 [body.light-theme_&]:border-emerald-500 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_24px_rgba(16,185,129,0.25)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <Box className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight">
                      Visualisasi Kemasan Dus: Grouped Vertical Bar Chart
                    </h2>
                    <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                      Komparasi ketinggian batang dinamis: Stok Aktual vs Batas Buffer Gudang vs Keluar Hari Ini
                    </p>
                  </div>
                </div>
                <span className="text-[9.5px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/30 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-semibold">
                  Total Kemasan: 1.420 Dus
                </span>
              </div>

              {/* DEDICATED VISUAL SVG GROUPED VERTICAL BAR CHART */}
              <div className="w-full h-64 sm:h-72 my-2 relative flex items-center justify-center">
                <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="amberBufferGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 100, 200, 300, 400].map((val) => {
                    const y = 190 - (val / 400) * 160;
                    return (
                      <g key={val}>
                        <line x1="45" y1={y} x2="575" y2={y} stroke="rgba(148, 163, 184, 0.12)" className="[body.light-theme_&]:stroke-slate-200" strokeDasharray="3 3" />
                        <text x="38" y={y + 3} textAnchor="end" className="fill-slate-500 [body.light-theme_&]:fill-slate-600 font-mono text-[9px] font-medium">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Grouped Bars */}
                  {dusData.map((item, idx) => {
                    const groupX = 65 + idx * 85;
                    const stockH = (item.current / 400) * 160;
                    const bufferH = (item.buffer / 400) * 160;
                    const outH = (item.outToday / 400) * 160;
                    const isHovered = hoveredDusIdx === idx;

                    return (
                      <g
                        key={item.sku}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredDusIdx(idx)}
                        onMouseLeave={() => setHoveredDusIdx(null)}
                      >
                        {/* Hover Highlight Box */}
                        {isHovered && (
                          <rect
                            x={groupX - 10}
                            y="25"
                            width="75"
                            height="170"
                            rx="6"
                            fill="rgba(16, 185, 129, 0.08)"
                            stroke="rgba(16, 185, 129, 0.3)"
                          />
                        )}

                        {/* Bar 1: Current Stock (Emerald Gradient) */}
                        <rect
                          x={groupX}
                          y={190 - stockH}
                          width="24"
                          height={stockH}
                          rx="3"
                          fill="url(#emeraldBarGrad)"
                          className="transition-all duration-200 hover:opacity-90"
                        />
                        <text
                          x={groupX + 12}
                          y={190 - stockH - 4}
                          textAnchor="middle"
                          className="fill-emerald-400 [body.light-theme_&]:fill-emerald-800 font-mono text-[9px] font-bold"
                        >
                          {item.current}
                        </text>

                        {/* Bar 2: Buffer Limit (Amber Gradient) */}
                        <rect
                          x={groupX + 28}
                          y={190 - bufferH}
                          width="14"
                          height={bufferH}
                          rx="2"
                          fill="url(#amberBufferGrad)"
                          opacity="0.85"
                        />
                        <text
                          x={groupX + 35}
                          y={190 - bufferH - 3}
                          textAnchor="middle"
                          className="fill-amber-400 [body.light-theme_&]:fill-amber-800 font-mono text-[8px] font-bold"
                        >
                          {item.buffer}
                        </text>

                        {/* Bar 3: Out Today (Slim Sky Bar) */}
                        <rect
                          x={groupX + 46}
                          y={190 - outH}
                          width="8"
                          height={outH}
                          rx="1.5"
                          fill="#38bdf8"
                          opacity="0.9"
                        />

                        {/* X-axis label */}
                        <text
                          x={groupX + 26}
                          y="205"
                          textAnchor="middle"
                          className={`text-[9px] font-bold ${
                            isHovered ? 'fill-emerald-400 [body.light-theme_&]:fill-emerald-800' : 'fill-slate-400 [body.light-theme_&]:fill-slate-900 chart-svg-text-primary'
                          }`}
                        >
                          {item.sku.split(' ')[0]}
                        </text>
                        <text
                          x={groupX + 26}
                          y="216"
                          textAnchor="middle"
                          className="fill-slate-500 [body.light-theme_&]:fill-slate-600 text-[8px] font-medium chart-svg-text-muted"
                        >
                          {item.sku.split(' ').slice(1).join(' ')}
                        </text>
                      </g>
                    );
                  })}

                  {/* Chart Legend */}
                  <g transform="translate(140, 15)">
                    <rect x="0" y="0" width="10" height="10" rx="2" fill="#10b981" />
                    <text x="14" y="8" className="fill-slate-300 [body.light-theme_&]:fill-slate-800 font-mono text-[9px] font-semibold chart-svg-text-secondary">{t('stok_aktual', 'Stok Aktual')}</text>
                    <rect x="110" y="0" width="10" height="10" rx="2" fill="#f59e0b" />
                    <text x="124" y="8" className="fill-slate-300 [body.light-theme_&]:fill-slate-800 font-mono text-[9px] font-semibold chart-svg-text-secondary">{t('batas_buffer_min', 'Batas Cadangan Minimum')}</text>
                    <rect x="250" y="0" width="8" height="10" rx="1.5" fill="#38bdf8" />
                    <text x="264" y="8" className="fill-slate-300 [body.light-theme_&]:fill-slate-800 font-mono text-[9px] font-semibold chart-svg-text-secondary">{t('keluar_hari_ini', 'Keluar Hari Ini')}</text>
                  </g>
                </svg>
              </div>

              {/* Hover Details Footer */}
              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 flex items-center justify-between text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 shrink-0">
                {hoveredDusIdx !== null ? (
                  <span className="font-mono text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold">
                    🔍 {dusData[hoveredDusIdx].sku}: Stok {dusData[hoveredDusIdx].current} Dus (Buffer: {dusData[hoveredDusIdx].buffer} · Keluar: {dusData[hoveredDusIdx].outToday})
                  </span>
                ) : (
                  <span>Arahkan kursor ke batang grafik untuk melihat rincian SKU</span>
                )}
                <span className="text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:border [body.light-theme_&]:border-emerald-300 px-2 py-0.5 rounded">● Buffer Health Index: 94.2% Aman</span>
              </div>
            </div>

            {/* Telemetry Right Pane */}
            <div className="lg:col-span-4 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-slate-700/80 [body.light-theme_&]:border-slate-300 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_16px_rgba(148,163,184,0.12)]">
              <div className="pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <h3 className="text-xs sm:text-[13px] font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-400 [body.light-theme_&]:text-emerald-700" />
                  Buffer & Logistik Keluar
                </h3>
                <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium mt-0.5">
                  Kesiapan stok dus dan lead time pemesanan pabrik
                </p>
              </div>

              <div className="flex-1 py-2.5 space-y-2.5 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Barang Keluar Hari Ini</div>
                    <div className="text-sm font-mono font-bold text-emerald-400 [body.light-theme_&]:text-emerald-800">
                      113 Dus Terkirim
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:border-slate-300">
                    8 Ritase
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Estimasi Cadangan Hari (DOI)</div>
                    <div className="text-sm font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                      12.5 Hari Penjualan
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300">
                    Optimal
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    marqueeData.criticalCount > 0
                      ? 'bg-rose-950/50 border-2 border-rose-500 [body.light-theme_&]:bg-rose-50 [body.light-theme_&]:border-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <i className={`fa-solid fa-triangle-exclamation ${marqueeData.criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}></i>
                      PERINGATAN SAFETY STOCK
                    </div>
                    <div
                      className={`text-sm font-mono font-black ${
                        marqueeData.criticalCount > 0
                          ? 'text-rose-400 [body.light-theme_&]:text-rose-700 animate-pulse'
                          : 'text-emerald-400 [body.light-theme_&]:text-emerald-800'
                      }`}
                    >
                      {marqueeData.criticalCount} SKU Melanggar Toleransi E-Warning
                    </div>
                    <div className="text-[8.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
                      {marqueeData.criticalCount > 0
                        ? `${marqueeData.criticalItems.map((c) => c.product.name.split(' ')[0]).join(', ')} &le; ambang toleransi PO`
                        : 'Seluruh SKU berada di atas ambang batas toleransi'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (marqueeData.criticalCount > 0 && onOpenPurchaseOrderModal) {
                        onOpenPurchaseOrderModal();
                      } else {
                        onNavigateTab('master-data');
                      }
                    }}
                    className={`px-2 py-1 rounded text-[9.5px] font-black cursor-pointer transition-all ${
                      marqueeData.criticalCount > 0
                        ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)] hover:bg-rose-400'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800'
                    }`}
                  >
                    {marqueeData.criticalCount > 0 ? 'Order PO' : 'Aman 100%'}
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Jadwal Restock Pabrik Berikutnya</div>
                    <div className="text-sm font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                      Kamis, 08:00 WIB
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:border-slate-300">
                    Hino Danone
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between shrink-0">
                <span>Nilai Persediaan: <b className="text-white [body.light-theme_&]:text-slate-900">Rp 44.820.000</b></span>
                <span className="text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold bg-emerald-500/10 border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:border-emerald-300 px-2 py-0.5 rounded">● Siap Jual</span>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: 'karyawan' (INDIGO BLUE) - HORIZONTAL PROGRESS & RADAR */}
        {/* ============================================================== */}
        {activeMetric === 'karyawan' && (
          <>
            <div className="lg:col-span-8 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-indigo-600/80 [body.light-theme_&]:border-indigo-600 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_24px_rgba(99,102,241,0.25)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight">
                      Telemetri Kinerja Kurir Armada Mobil & Kurir Viar
                    </h2>
                    <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                      Grafik horizontal ritase pengiriman, utilisasi muatan, dan cakupan rute armada mitra
                    </p>
                  </div>
                </div>
                <span className="text-[9.5px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-400/30 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-semibold">
                  Presensi: 11 / 12 Hadir
                </span>
              </div>

              {/* DEDICATED VISUAL HORIZONTAL TELEMETRY BARS - SOLID NEON GLOW */}
              <div className="w-full my-2.5 space-y-2.5 flex-1 flex flex-col justify-center">
                {/* Header labels */}
                <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 [body.light-theme_&]:text-slate-600 px-2 shrink-0">
                  <span className="min-w-[210px]">Armada & Nama Supir / Kurir</span>
                  <span className="flex-1 text-center">Batang Progres Utilisasi & Ritase</span>
                  <span className="min-w-[95px] text-right">Performa</span>
                </div>

                {courierData.map((c, idx) => {
                  const isHovered = hoveredCourierIdx === idx;
                  const barWidth = Math.max(35, Math.min(100, c.util));

                  return (
                    <div
                      key={c.name}
                      onMouseEnter={() => setHoveredCourierIdx(idx)}
                      onMouseLeave={() => setHoveredCourierIdx(null)}
                      className={`p-2.5 rounded-xl border-[1.5px] border-l-[3.5px] border-l-indigo-600 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                        isHovered
                          ? 'bg-slate-850 border-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.4)] [body.light-theme_&]:bg-indigo-50/60 [body.light-theme_&]:border-indigo-400'
                          : 'bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border-slate-700/80 [body.light-theme_&]:border-slate-300'
                      }`}
                    >
                      {/* Driver & Unit Info */}
                      <div className="flex items-center gap-2.5 min-w-[210px] shrink-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                            c.role.includes('Viar')
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-800 [body.light-theme_&]:border-cyan-300'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 [body.light-theme_&]:bg-indigo-100 [body.light-theme_&]:text-indigo-800 [body.light-theme_&]:border-indigo-300'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white [body.light-theme_&]:text-slate-900 leading-tight">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium mt-0.5">
                            {c.unit} · <b className={c.role.includes('Viar') ? 'text-cyan-400 [body.light-theme_&]:text-cyan-700' : 'text-indigo-400 [body.light-theme_&]:text-indigo-700'}>{c.role}</b>
                          </div>
                        </div>
                      </div>

                      {/* Batang Progres Ritase Solid & Menyala */}
                      <div className="flex-1 min-w-[220px]">
                        <div className="w-full bg-slate-900/90 [body.light-theme_&]:bg-slate-200 rounded-lg p-0.5 overflow-hidden border border-slate-800 [body.light-theme_&]:border-slate-300">
                          <div
                            className="h-6 rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 shadow-[0_0_12px_rgba(79,70,229,0.55)] flex items-center px-3 transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          >
                            <span className="text-white font-bold tracking-wide font-mono text-[10px] whitespace-nowrap drop-shadow-sm">
                              {c.trips} Ritase · {c.gallons} Galon
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Performa Score & Titik Antar */}
                      <div className="text-right shrink-0 min-w-[95px]">
                        <div className="text-xs font-mono font-black text-emerald-400 [body.light-theme_&]:text-emerald-700">
                          {c.util}% Utilisasi
                        </div>
                        <div className="text-[9.5px] font-mono text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">
                          {c.points} Titik Antar
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Switch Note */}
              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 flex items-center justify-between text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 shrink-0">
                <span>Skema komisi aktif: <b>Salesman 25%</b> & <b>Kurir/Supir 75%</b></span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('hr')}
                  className="text-indigo-400 [body.light-theme_&]:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Buka Modul HR & Hitung Komisi <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Telemetry Right Pane */}
            <div className="lg:col-span-4 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-slate-700/80 [body.light-theme_&]:border-slate-300 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_16px_rgba(148,163,184,0.12)]">
              <div className="pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <h3 className="text-xs sm:text-[13px] font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400 [body.light-theme_&]:text-indigo-700" />
                  Ringkasan Kinerja Tim
                </h3>
                <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium mt-0.5">
                  Efisiensi ritase pengantaran dan akumulasi komisi
                </p>
              </div>

              <div className="flex-1 py-2.5 space-y-2.5 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Tingkat Kehadiran Staf</div>
                    <div className="text-sm font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                      11 Hadir / 12 Staf (91.7%)
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300">
                    92% Tim Aktif
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Rata-rata Waktu Drop Antar</div>
                    <div className="text-sm font-mono font-bold text-indigo-400 [body.light-theme_&]:text-indigo-800">
                      14.5 Menit / Lokasi
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:border-slate-300">
                    Target &lt; 20m
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Akumulasi Komisi Ritase Tim</div>
                    <div className="text-sm font-mono font-bold text-amber-400 [body.light-theme_&]:text-amber-800">
                      Rp 465.000
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 [body.light-theme_&]:bg-amber-100/80 [body.light-theme_&]:text-amber-800 [body.light-theme_&]:border-amber-300">
                    Real-Time HR
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Insiden / Kendala Lapangan</div>
                    <div className="text-sm font-mono font-bold text-emerald-400 [body.light-theme_&]:text-emerald-800">
                      0 Kasus (Nihil)
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300">
                    Aman
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between shrink-0">
                <span>Rider Viar: <b className="text-white [body.light-theme_&]:text-slate-900">2 Unit Gesit</b></span>
                <span className="text-indigo-400 [body.light-theme_&]:text-indigo-800 font-bold bg-indigo-500/10 border border-indigo-500/20 [body.light-theme_&]:bg-indigo-100/80 [body.light-theme_&]:border-indigo-300 px-2 py-0.5 rounded">● Skema 75% Kurir</span>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: 'omzet' (AMBER GOLD) - SMOOTH AREA CURVE CHART         */}
        {/* ============================================================== */}
        {activeMetric === 'omzet' && (
          <>
            <div className="lg:col-span-8 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-amber-500/70 [body.light-theme_&]:border-amber-500 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_24px_rgba(245,158,11,0.25)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight">
                      Visualisasi Arus Kas Masuk: Smooth Bezier Area Glow
                    </h2>
                    <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                      Akumulasi omzet kasir per jam (07:00 - 17:00 WIB) dengan data dots dan scrub interaktif
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setOmzetSegmentFilter('SEMUA')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${omzetSegmentFilter === 'SEMUA' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setOmzetSegmentFilter('AIR_MINUM')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${omzetSegmentFilter === 'AIR_MINUM' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      Air
                    </button>
                    <button
                      type="button"
                      onClick={() => setOmzetSegmentFilter('FMCG_SEMBAKO')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${omzetSegmentFilter === 'FMCG_SEMBAKO' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      Sembako
                    </button>
                    <button
                      type="button"
                      onClick={() => setOmzetSegmentFilter('NON_FMCG')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${omzetSegmentFilter === 'NON_FMCG' ? 'bg-purple-500 text-white font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      Non-FMCG
                    </button>
                  </div>
                  <span className="text-[9.5px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/30 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-semibold">
                    Setoran [{omzetSegmentFilter.replace('_', ' ')}]: Rp {currentSelectedOmzet.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* DEDICATED VISUAL SVG SMOOTH AREA CURVE CHART */}
              <div className="w-full h-64 sm:h-72 my-2 relative flex items-center justify-center">
                {(() => {
                  const omzetMaxScale = Math.max(500000, Math.ceil(totalOmzetKasir / 100000) * 100000);
                  const startX = 50;
                  const endX = 570;
                  const w = endX - startX;
                  const h = 160;
                  const baseY = 195;

                  const pts = hourlyData.map((d, i) => ({
                    x: startX + (i / (hourlyData.length - 1)) * w,
                    y: baseY - (omzetMaxScale > 0 ? (d.cum / omzetMaxScale) * h : 0),
                    ...d,
                  }));

                  let path = `M ${pts[0].x} ${pts[0].y}`;
                  for (let i = 0; i < pts.length - 1; i++) {
                    const cpX = (pts[i].x + pts[i + 1].x) / 2;
                    path += ` C ${cpX} ${pts[i].y}, ${cpX} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
                  }

                  const areaPath = `${path} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;
                  const currentPt = hoveredHourIdx !== null ? pts[hoveredHourIdx] : null;

                  return (
                    <svg
                      viewBox="0 0 600 240"
                      className="w-full h-full overflow-visible"
                      onMouseLeave={() => setHoveredHourIdx(null)}
                    >
                      <defs>
                        <linearGradient id="amberCurveGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                          <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="glowDots" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.6" />
                        </filter>
                      </defs>

                      {/* Horizontal Grid lines dynamic scale */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const val = Math.round(omzetMaxScale * ratio);
                        const y = baseY - ratio * h;
                        return (
                          <g key={ratio}>
                            <line x1="45" y1={y} x2="575" y2={y} stroke="rgba(148, 163, 184, 0.12)" className="[body.light-theme_&]:stroke-slate-200" strokeDasharray="4 4" />
                            <text x="38" y={y + 3} textAnchor="end" className="fill-slate-500 [body.light-theme_&]:fill-slate-600 font-mono text-[9px] font-medium">
                              {val === 0 ? '0' : val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : `${Math.round(val / 1000)}rb`}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area gradient */}
                      <path d={areaPath} fill="url(#amberCurveGlow)" />

                      {/* Main curve line */}
                      <path d={path} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

                      {/* Interactive vertical scrub line */}
                      {currentPt && (
                        <g>
                          <line
                            x1={currentPt.x}
                            y1="35"
                            x2={currentPt.x}
                            y2={baseY}
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          {/* Floating Tooltip Box in SVG */}
                          <g transform={`translate(${Math.min(Math.max(currentPt.x - 65, 50), 450)}, ${Math.max(currentPt.y - 48, 10)})`}>
                            <rect x="0" y="0" width="130" height="38" rx="6" fill="#020617" stroke="#f59e0b" strokeWidth="1.2" className="[body.light-theme_&]:fill-white [body.light-theme_&]:stroke-amber-600 shadow-md" />
                            <text x="65" y="14" textAnchor="middle" className="fill-amber-400 [body.light-theme_&]:fill-amber-800 font-mono text-[9px] font-bold">
                              {currentPt.hour} WIB · {currentPt.tx} Transaksi
                            </text>
                            <text x="65" y="28" textAnchor="middle" className="fill-white [body.light-theme_&]:fill-slate-900 font-mono text-[11px] font-black chart-svg-text-primary">
                              Rp {currentPt.cum.toLocaleString('id-ID')}
                            </text>
                          </g>
                        </g>
                      )}

                      {/* Data dots */}
                      {pts.map((p, idx) => (
                        <g key={p.hour} className="cursor-pointer" onMouseEnter={() => setHoveredHourIdx(idx)}>
                          <rect x={p.x - 20} y="30" width="40" height="170" fill="transparent" />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredHourIdx === idx ? 6 : 3.5}
                            fill="#f59e0b"
                            stroke="#080e1a"
                            strokeWidth={hoveredHourIdx === idx ? 2.5 : 1.5}
                            filter={hoveredHourIdx === idx ? 'url(#glowDots)' : undefined}
                            className="transition-all duration-150"
                          />
                          <text
                            x={p.x}
                            y="215"
                            textAnchor="middle"
                            className={`text-[9px] font-mono ${
                              hoveredHourIdx === idx
                                ? 'fill-amber-400 [body.light-theme_&]:fill-amber-800 font-bold'
                                : 'fill-slate-400 [body.light-theme_&]:fill-slate-700 font-medium'
                            }`}
                          >
                            {p.hour}
                          </text>
                        </g>
                      ))}
                    </svg>
                  );
                })()}
              </div>

              {/* Status bar */}
              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 flex items-center justify-between text-xs bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border [body.light-theme_&]:border-slate-200 p-2 rounded-lg shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 [body.light-theme_&]:text-amber-800 bg-amber-500/10 [body.light-theme_&]:bg-amber-100 px-2 py-0.5 rounded border border-amber-500/30 [body.light-theme_&]:border-amber-300 text-[11px]">
                    🕒 {hoveredHourIdx !== null ? hourlyData[hoveredHourIdx].hour : '11:00'} WIB
                  </span>
                  <span className="text-[10.5px] text-slate-300 [body.light-theme_&]:text-slate-800 font-medium">
                    {hoveredHourIdx !== null ? hourlyData[hoveredHourIdx].note : 'Setoran Kasir POS Masuk'}
                  </span>
                </div>
                <div className="font-mono text-[11px]">
                  <span className="text-slate-400 [body.light-theme_&]:text-slate-600 mr-1.5 font-medium">Omzet Kasir:</span>
                  <b className="text-amber-400 [body.light-theme_&]:text-amber-800">
                    Rp {(hoveredHourIdx !== null ? hourlyData[hoveredHourIdx].cum : totalOmzetKasir).toLocaleString('id-ID')}
                  </b>
                </div>
              </div>
            </div>

            {/* Telemetry Right Pane */}
            <div className="lg:col-span-4 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-slate-700/80 [body.light-theme_&]:border-slate-300 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_16px_rgba(148,163,184,0.12)]">
              <div className="pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <h3 className="text-xs sm:text-[13px] font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400 [body.light-theme_&]:text-amber-700" />
                  Rincian Penerimaan Kas
                </h3>
                <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium mt-0.5">
                  Komparasi metode pelunasan nota penjualan kasir
                </p>
              </div>

              <div className="flex-1 py-2.5 space-y-2.5 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Pembayaran Tunai (Cash)</div>
                    <div className="text-sm font-mono font-bold text-emerald-400 [body.light-theme_&]:text-emerald-800">
                      Rp {cashOmzet.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300">
                    {cashPct}% Fisik Kas
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">QRIS Dinamis & Transfer Bank</div>
                    <div className="text-sm font-mono font-bold text-cyan-400 [body.light-theme_&]:text-sky-800">
                      Rp {nonCashOmzet.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 [body.light-theme_&]:bg-sky-100/80 [body.light-theme_&]:text-sky-800 [body.light-theme_&]:border-sky-300">
                    {nonCashPct}% Digital
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Total Transaksi Lunas</div>
                    <div className="text-sm font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                      {totalKasirTxCount} Transaksi Selesai
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:border-slate-300">
                    Kasir Utama
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Rata-rata Pembelian (AOV)</div>
                    <div className="text-sm font-mono font-bold text-amber-400 [body.light-theme_&]:text-amber-800">
                      Rp {avgOrderValue.toLocaleString('id-ID')} / Transaksi
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 [body.light-theme_&]:bg-amber-100/80 [body.light-theme_&]:text-amber-800 [body.light-theme_&]:border-amber-300">
                    Realistis
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between shrink-0">
                <span>Piutang Tertagih Hari Ini: <b className="text-white [body.light-theme_&]:text-slate-900">Rp 1.450.000</b></span>
                <span className="text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold bg-emerald-500/10 border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:border-emerald-300 px-2 py-0.5 rounded">● Kas Sinkron</span>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* VIEW 5: 'bongkar' (PURPLE) - WATERFALL / STEPPED BAR CHART     */}
        {/* ============================================================== */}
        {activeMetric === 'bongkar' && (
          <>
            <div className="lg:col-span-8 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-purple-500/70 [body.light-theme_&]:border-purple-500 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_24px_rgba(168,85,247,0.25)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight">
                      Visualisasi Arus Logistik: Waterfall Stepped Inflow Chart
                    </h2>
                    <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                      Arus pasokan bertahap dari 4 truk pabrik (1.280 Galon) dikurangi tabung afkir (19) ke gudang
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9.5px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-400/30 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-semibold">
                    {inboundDropsCount} Drop Pabrik (1.280+ Galon)
                  </span>
                  {onOpenBongkarModal && (
                    <button
                      type="button"
                      onClick={onOpenBongkarModal}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Catat Drop Masuk</span>
                    </button>
                  )}
                </div>
              </div>

              {/* DEDICATED VISUAL SVG WATERFALL CHART */}
              <div className="w-full h-64 sm:h-72 my-2 relative flex items-center justify-center">
                <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#7e22ce" />
                    </linearGradient>
                    <linearGradient id="roseBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                    <linearGradient id="emeraldNetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 300, 600, 900, 1200, 1400].map((val) => {
                    const y = 190 - (val / 1400) * 160;
                    return (
                      <g key={val}>
                        <line x1="45" y1={y} x2="575" y2={y} stroke="rgba(148, 163, 184, 0.12)" className="[body.light-theme_&]:stroke-slate-200" strokeDasharray="3 3" />
                        <text x="38" y={y + 3} textAnchor="end" className="fill-slate-500 [body.light-theme_&]:fill-slate-600 font-mono text-[9px] font-medium">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Target Supply Line (1.300 Galon) */}
                  <line x1="45" y1={190 - (1300 / 1400) * 160} x2="575" y2={190 - (1300 / 1400) * 160} stroke="#a855f7" className="[body.light-theme_&]:stroke-purple-700" strokeWidth="1" strokeDasharray="5 5" opacity="0.6" />
                  <text x="575" y={190 - (1300 / 1400) * 160 - 4} textAnchor="end" className="fill-purple-400 [body.light-theme_&]:fill-purple-800 font-mono text-[8.5px] font-bold">
                    Target Rencana: 1.300 Galon
                  </text>

                  {/* Waterfall Bars */}
                  {waterfallData.map((d, idx) => {
                    const barX = 65 + idx * 85;
                    const barW = 38;
                    const isTotal = d.type === 'total';
                    const isOut = d.type === 'out';

                    const yTop = 190 - (Math.max(d.start, d.end) / 1400) * 160;
                    const yBottom = 190 - (Math.min(d.start, d.end) / 1400) * 160;
                    const barH = Math.max(yBottom - yTop, 4);

                    const isHovered = hoveredWaterfallIdx === idx;

                    return (
                      <g
                        key={d.label}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredWaterfallIdx(idx)}
                        onMouseLeave={() => setHoveredWaterfallIdx(null)}
                      >
                        {/* Connecting Step Line to next bar */}
                        {idx < waterfallData.length - 1 && (
                          <line
                            x1={barX + barW}
                            y1={190 - (d.end / 1400) * 160}
                            x2={barX + 85}
                            y2={190 - (d.end / 1400) * 160}
                            stroke="rgba(148, 163, 184, 0.4)"
                            className="[body.light-theme_&]:stroke-slate-300"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Bar Rect */}
                        <rect
                          x={barX}
                          y={yTop}
                          width={barW}
                          height={barH}
                          rx="3"
                          fill={isTotal ? 'url(#emeraldNetGrad)' : isOut ? 'url(#roseBarGrad)' : 'url(#purpleBarGrad)'}
                          className="transition-all duration-200 hover:opacity-90"
                        />

                        {/* Value label on top */}
                        <text
                          x={barX + barW / 2}
                          y={yTop - 4}
                          textAnchor="middle"
                          className={`font-mono text-[9px] font-bold ${
                            isTotal ? 'fill-emerald-400 [body.light-theme_&]:fill-emerald-800' : isOut ? 'fill-rose-400 [body.light-theme_&]:fill-rose-800' : 'fill-purple-300 [body.light-theme_&]:fill-purple-800'
                          }`}
                        >
                          {isOut ? `${d.amount}` : `+${d.amount}`}
                        </text>

                        {/* X-axis label */}
                        <text
                          x={barX + barW / 2}
                          y="205"
                          textAnchor="middle"
                          className={`text-[8.5px] font-bold ${
                            isHovered ? 'fill-purple-300 [body.light-theme_&]:fill-purple-800' : 'fill-slate-400 [body.light-theme_&]:fill-slate-900 chart-svg-text-primary'
                          }`}
                        >
                          {d.label.split(' ')[0]}
                        </text>
                        <text
                          x={barX + barW / 2}
                          y="216"
                          textAnchor="middle"
                          className="fill-slate-500 [body.light-theme_&]:fill-slate-600 text-[8px] font-medium chart-svg-text-muted"
                        >
                          {d.label.split(' ').slice(1).join(' ')}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Status bar */}
              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 flex items-center justify-between text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 shrink-0">
                {hoveredWaterfallIdx !== null ? (
                  <span className="font-mono text-purple-300 [body.light-theme_&]:text-purple-800 font-bold">
                    🚚 {waterfallData[hoveredWaterfallIdx].label}: {waterfallData[hoveredWaterfallIdx].detail} ({waterfallData[hoveredWaterfallIdx].amount > 0 ? `+${waterfallData[hoveredWaterfallIdx].amount}` : waterfallData[hoveredWaterfallIdx].amount} Galon)
                  </span>
                ) : (
                  <span>Total Galon Masuk: <b className="text-white [body.light-theme_&]:text-slate-900">1.280 Galon</b> · Target Pasokan: <b className="text-emerald-400 [body.light-theme_&]:text-emerald-800">98.5%</b> Terpenuhi</span>
                )}
                <span className="text-purple-400 [body.light-theme_&]:text-purple-800 font-bold [body.light-theme_&]:bg-purple-50 [body.light-theme_&]:border [body.light-theme_&]:border-purple-300 px-2 py-0.5 rounded">● Lunas Bongkar</span>
              </div>
            </div>

            {/* Telemetry Right Pane */}
            <div className="lg:col-span-4 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-slate-700/80 [body.light-theme_&]:border-slate-300 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_16px_rgba(148,163,184,0.12)]">
              <div className="pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <h3 className="text-xs sm:text-[13px] font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 [body.light-theme_&]:text-purple-700" />
                  Audit Logistik Gudang
                </h3>
                <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium mt-0.5">
                  Kontrol kualitas penerimaan barang dan retur pabrik
                </p>
              </div>

              <div className="flex-1 py-2.5 space-y-2.5 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Total Pasokan Galon Masuk</div>
                    <div className="text-sm font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                      1.280 Galon (4 Truk)
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300">
                    100% Sesuai SJ
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Tabung Bocor / Afkir Pabrik</div>
                    <div className="text-sm font-mono font-bold text-rose-400 [body.light-theme_&]:text-rose-800">
                      19 Tabung (1.48%)
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 [body.light-theme_&]:bg-rose-100/80 [body.light-theme_&]:text-rose-800 [body.light-theme_&]:border-rose-300">
                    Klaim Retur
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Tingkat Okupansi Gudang</div>
                    <div className="text-sm font-mono font-bold text-purple-400 [body.light-theme_&]:text-purple-800">
                      1.280 / 2.000 (64.0%)
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:border-slate-300">
                    Ruang Cukup
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Surat Jalan Pabrik Sah</div>
                    <div className="text-sm font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                      4 Lembar BA-BM
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300">
                    Tervalidasi
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between shrink-0">
                <span>Sisa Tabung Siap Tukar Pabrik: <b className="text-white [body.light-theme_&]:text-slate-900">240 Tabung</b></span>
                {onOpenBongkarModal ? (
                  <button
                    type="button"
                    onClick={onOpenBongkarModal}
                    className="text-purple-400 hover:text-purple-300 [body.light-theme_&]:text-purple-800 font-bold bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 [body.light-theme_&]:bg-purple-100/80 [body.light-theme_&]:border-purple-300 px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Log Bongkar Muat</span>
                    <i className="fa-solid fa-arrow-right text-[8px]" />
                  </button>
                ) : (
                  <span className="text-purple-400 [body.light-theme_&]:text-purple-800 font-bold bg-purple-500/10 border border-purple-500/20 [body.light-theme_&]:bg-purple-100/80 [body.light-theme_&]:border-purple-300 px-2 py-0.5 rounded">● Lunas Muat</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* VIEW 6: 'pengiriman' (ROSE) - PIPELINE FUNNEL / FLOW CHART     */}
        {/* ============================================================== */}
        {activeMetric === 'pengiriman' && (
          <>
            <div className="lg:col-span-8 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-rose-500/70 [body.light-theme_&]:border-rose-500 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_24px_rgba(244,63,94,0.25)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                    <Gauge className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight">
                      Visualisasi Antrean Order: Pipeline Horizontal Funnel Flow
                    </h2>
                    <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                      Alur antrean 3 Tahap: {queuedOrders.length} Diproses → {enRouteOrders.length} Di Jalan → {completedOrders.length} Selesai Terkirim
                    </p>
                  </div>
                </div>
                <span className="text-[9.5px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-400/30 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:font-semibold">
                  {activeOrderList.length} Order Aktif ({activeOrderList.reduce((sum, o) => sum + (o.totalGalon || 0), 0)} Galon)
                </span>
              </div>

              {/* DEDICATED VISUAL SVG PIPELINE FLOW CHART */}
              <div className="w-full h-64 sm:h-72 my-2 relative flex items-center justify-center">
                <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="amberStageGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#b45309" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="cyanStageGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="emeraldStageGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#047857" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* 3 Large Funnel / Pipeline Blocks */}
                  {pipelineStages.map((stage, idx) => {
                    const x = 30 + idx * 190;
                    const isHovered = hoveredPipelineStage === stage.id;
                    const stageBoxClass = `pipeline-stage-box-${idx}`;

                    return (
                      <g
                        key={stage.id}
                        transform={`translate(${x}, 20)`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPipelineStage(stage.id)}
                        onMouseLeave={() => setHoveredPipelineStage(null)}
                      >
                        {/* Funnel Card */}
                        <rect
                          x="0"
                          y="0"
                          width="160"
                          height="125"
                          rx="8"
                          fill={
                            idx === 0
                              ? 'url(#amberStageGrad)'
                              : idx === 1
                              ? 'url(#cyanStageGrad)'
                              : 'url(#emeraldStageGrad)'
                          }
                          stroke={isHovered ? stage.color : `${stage.color}60`}
                          strokeWidth={isHovered ? 2 : 1}
                          className={`transition-all duration-200 ${stageBoxClass}`}
                        />

                        {/* Stage Number & Badge */}
                        <text
                          x="14"
                          y="24"
                          className={`font-mono text-[9px] font-bold uppercase tracking-wider ${
                            idx === 0 ? '[body.light-theme_&]:fill-amber-800' : idx === 1 ? '[body.light-theme_&]:fill-sky-800' : '[body.light-theme_&]:fill-emerald-800'
                          }`}
                          fill={stage.color}
                        >
                          Tahap {stage.id}
                        </text>
                        <text x="14" y="44" className="fill-white [body.light-theme_&]:fill-slate-900 font-bold text-xs chart-svg-text-primary">
                          {stage.title}
                        </text>

                        {/* Order Count Metric */}
                        <text
                          x="14"
                          y="78"
                          className={`font-mono text-2xl font-black ${
                            idx === 0 ? '[body.light-theme_&]:fill-amber-900' : idx === 1 ? '[body.light-theme_&]:fill-sky-900' : '[body.light-theme_&]:fill-emerald-900'
                          }`}
                          fill={stage.color}
                        >
                          {stage.orders} <tspan className="text-xs font-semibold fill-slate-300 [body.light-theme_&]:fill-slate-700">Order</tspan>
                        </text>

                        {/* Detail Volume */}
                        <text x="14" y="98" className="fill-slate-300 [body.light-theme_&]:fill-slate-800 font-mono text-[10px] font-medium chart-svg-text-secondary">
                          📦 {stage.gallons} Galon · {stage.boxes} Dus
                        </text>

                        {/* Status text */}
                        <text x="14" y="114" className="fill-slate-400 [body.light-theme_&]:fill-slate-600 text-[8.5px] font-semibold chart-svg-text-muted">
                          ● {stage.status}
                        </text>

                        {/* Connecting Arrow to next stage */}
                        {idx < 2 && (
                          <g transform="translate(162, 55)">
                            <path d="M 0 0 L 16 7 L 0 14 Z" fill={stage.color} opacity="0.8" />
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* BOTTOM FLEET LOAD CAPACITY METER SVG */}
                  <g transform="translate(30, 160)">
                    <rect
                      x="0"
                      y="0"
                      width="540"
                      height="60"
                      rx="8"
                      fill="rgba(15, 23, 42, 0.6)"
                      stroke="rgba(51, 65, 85, 0.5)"
                      className="fleet-container-box [body.light-theme_&]:fill-slate-100/90 [body.light-theme_&]:stroke-slate-300"
                    />
                    <text x="15" y="18" className="fill-slate-300 [body.light-theme_&]:fill-slate-900 font-bold text-[10px] chart-svg-text-primary">
                      Utilisasi Armada Angkut di Jalan Saat Ini
                    </text>

                    {/* Fleet Mini Meters */}
                    <g transform="translate(15, 26)">
                      {/* Carry Pickup */}
                      <text x="0" y="10" className="fill-slate-300 [body.light-theme_&]:fill-slate-800 text-[8.5px] font-mono font-bold">Carry Pickup</text>
                      <text x="120" y="10" textAnchor="end" className="fill-indigo-400 [body.light-theme_&]:fill-indigo-700 text-[8.5px] font-mono font-bold">89% (80/90G)</text>
                      <rect x="0" y="14" width="120" height="6" rx="2" fill="#1e293b" className="chart-track-fill [body.light-theme_&]:fill-slate-300" />
                      <rect x="0" y="14" width="107" height="6" rx="2" fill="#6366f1" />

                      {/* Gran Max */}
                      <text x="135" y="10" className="fill-slate-300 [body.light-theme_&]:fill-slate-800 text-[8.5px] font-mono font-bold">Gran Max</text>
                      <text x="255" y="10" textAnchor="end" className="fill-indigo-400 [body.light-theme_&]:fill-indigo-700 text-[8.5px] font-mono font-bold">55% (60/110G)</text>
                      <rect x="135" y="14" width="120" height="6" rx="2" fill="#1e293b" className="chart-track-fill [body.light-theme_&]:fill-slate-300" />
                      <rect x="135" y="14" width="66" height="6" rx="2" fill="#818cf8" />

                      {/* Viar #01 */}
                      <text x="270" y="10" className="fill-slate-300 [body.light-theme_&]:fill-slate-800 text-[8.5px] font-mono font-bold">Viar 200 #01</text>
                      <text x="380" y="10" textAnchor="end" className="fill-cyan-400 [body.light-theme_&]:fill-cyan-700 text-[8.5px] font-mono font-bold">80% (20/25G)</text>
                      <rect x="270" y="14" width="110" height="6" rx="2" fill="#1e293b" className="chart-track-fill [body.light-theme_&]:fill-slate-300" />
                      <rect x="270" y="14" width="88" height="6" rx="2" fill="#06b6d4" />

                      {/* Viar #02 */}
                      <text x="395" y="10" className="fill-slate-300 [body.light-theme_&]:fill-slate-800 text-[8.5px] font-mono font-bold">Viar 150 #02</text>
                      <text x="505" y="10" textAnchor="end" className="fill-sky-400 [body.light-theme_&]:fill-sky-700 text-[8.5px] font-mono font-bold">14% Standby</text>
                      <rect x="395" y="14" width="110" height="6" rx="2" fill="#1e293b" className="chart-track-fill [body.light-theme_&]:fill-slate-300" />
                      <rect x="395" y="14" width="15" height="6" rx="2" fill="#38bdf8" />
                    </g>
                  </g>
                </svg>
              </div>

              {/* Bottom Quick Switch Note */}
              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 flex items-center justify-between text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 shrink-0">
                <span>Rata-rata Waktu Tiba: <b className="text-white [body.light-theme_&]:text-slate-900">38 Menit (SLA &lt; 60m)</b></span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('order')}
                  className="text-rose-400 [body.light-theme_&]:text-rose-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Buka Modul Order & Surat Jalan <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Telemetry Right Pane */}
            <div className="lg:col-span-4 bg-slate-900/90 [body.light-theme_&]:bg-white rounded-xl border-2 border-slate-700/80 [body.light-theme_&]:border-slate-300 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_0_16px_rgba(148,163,184,0.12)]">
              <div className="pb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-100 shrink-0">
                <h3 className="text-xs sm:text-[13px] font-bold text-white [body.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-400 [body.light-theme_&]:text-rose-700" />
                  SLA Ketepatan Pengiriman
                </h3>
                <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium mt-0.5">
                  Evaluasi kepuasan pelanggan dan ritase armada
                </p>
              </div>

              <div className="flex-1 py-2.5 space-y-2.5 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Total Order Hari Ini</div>
                    <div className="text-sm font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                      {activeOrderList.length} Pesanan Aktif
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:border-slate-300">
                    {activeOrderList.reduce((sum, o) => sum + (o.totalGalon || 0), 0)} Galon
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Tingkat Ketepatan Waktu</div>
                    <div className="text-sm font-mono font-bold text-emerald-400 [body.light-theme_&]:text-emerald-800">
                      100% Tepat Waktu
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300">
                    Nihil Komplain
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Skema Tukar Galon</div>
                    <div className="text-sm font-mono font-bold text-sky-400 [body.light-theme_&]:text-sky-800">
                      5 Tukar · 2 Beli · 1 Pinjam
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 [body.light-theme_&]:bg-sky-100/80 [body.light-theme_&]:text-sky-800 [body.light-theme_&]:border-sky-300">
                    Seimbang
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-semibold">Utilisasi Armada Viar Cepat</div>
                    <div className="text-sm font-mono font-bold text-amber-400 [body.light-theme_&]:text-amber-800">
                      4 Ritase Khusus Gang
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 [body.light-theme_&]:bg-amber-100/80 [body.light-theme_&]:text-amber-800 [body.light-theme_&]:border-amber-300">
                    Efektif
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-100 text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between shrink-0">
                <span>Rata-rata Waktu Tunggu: <b className="text-white [body.light-theme_&]:text-slate-900">18 Menit</b></span>
                <span className="text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold bg-emerald-500/10 border border-emerald-500/20 [body.light-theme_&]:bg-emerald-100/80 [body.light-theme_&]:border-emerald-300 px-2 py-0.5 rounded">● Prima</span>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
