import React, { useState, useMemo } from 'react';
import { GallonStock, ContainerAssetType } from '../types';
import {
  Boxes,
  Layers,
  Flame,
  Wine,
  Package,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface SirkulasiGalonViewProps {
  gallonCirculation: GallonStock[];
  onUpdateGallonCirculation?: (updated: GallonStock[]) => void;
}

export type ContainerFilterType = 'ALL' | ContainerAssetType;

export const SirkulasiGalonView: React.FC<SirkulasiGalonViewProps> = ({
  gallonCirculation: initialCirculation,
  onUpdateGallonCirculation,
}) => {
  const [internalCirculation, setInternalCirculation] = useState<GallonStock[]>(initialCirculation);

  // Sync if prop changes externally
  React.useEffect(() => {
    setInternalCirculation(initialCirculation);
  }, [initialCirculation]);

  const gallonCirculation = internalCirculation;
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<ContainerFilterType>('ALL');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);

  // Form State for Berita Acara (Menggunakan SKU / Barcode produk individual)
  const [auditAssetType, setAuditAssetType] = useState<ContainerAssetType>('TABUNG_GALON');
  const [auditSku, setAuditSku] = useState<string>('AST-TBG-AQUA');
  const [auditBarcode, setAuditBarcode] = useState<string>('AST-TBG-AQUA');
  const [auditActivity, setAuditActivity] = useState<
    | 'Penerimaan Aset Terisi dari Pabrik / Principal'
    | 'Pengiriman Wadah Kosong untuk Refill Pabrik'
    | 'Penarikan Wadah Kosong dari Mitra Toko / Warung'
    | 'Pencatatan Retur Wadah Rusak / Bocor / Pecah'
    | 'Pengembalian Wadah Pinjaman Residensial (Refund Deposit)'
    | 'Stock Opname / Audit Fisik Berkala Gudang'
  >('Penerimaan Aset Terisi dari Pabrik / Principal');
  const [auditItemName, setAuditItemName] = useState('Aqua 19L Original');
  const [auditQty, setAuditQty] = useState(50);
  const [auditCondition, setAuditCondition] = useState<'BAGUS' | 'RETAK' | 'BOCOR_PECAH'>('BAGUS');
  const [auditNotes, setAuditNotes] = useState('');

  // Auto-sync SKU and Barcode when selecting product
  const handleSelectProduct = (skuCode: string) => {
    setAuditSku(skuCode);
    const target = gallonCirculation.find((item) => (item.sku || item.id) === skuCode);
    if (target) {
      setAuditItemName(target.category);
      setAuditBarcode(target.barcode || target.sku || target.id || '');
      if (target.assetType) {
        setAuditAssetType(target.assetType);
      }
    }
  };

  // Reaktif Update State Berita Acara ke Kartu Stok & Audit
  const handleSaveBeritaAcara = () => {
    const updated = internalCirculation.map((asset) => {
      const match = (asset.sku && asset.sku === auditSku) || (asset.id && asset.id === auditSku) || asset.category === auditItemName;
      if (!match) return asset;

      let newFilled = asset.filled;
      let newEmpty = asset.empty;
      let newAtStores = asset.atStores;
      let newLoaned = asset.loanedHousehold || 0;
      let newDamaged = asset.damaged;

      if (auditCondition === 'BOCOR_PECAH') {
        // Jika cacat berat/pecah, langsung alokasikan ke rusak/afkir
        newDamaged += auditQty;
      } else {
        switch (auditActivity) {
          case 'Penerimaan Aset Terisi dari Pabrik / Principal':
            // Terisi bertambah di depo (bisa tukar tabung kosong atau pasokan baru)
            newFilled += auditQty;
            if (newEmpty >= auditQty) {
              newEmpty -= auditQty;
            }
            break;
          case 'Pengiriman Wadah Kosong untuk Refill Pabrik':
            // Kosong di depo berkurang dikirim ke pabrik
            newEmpty = Math.max(0, newEmpty - auditQty);
            break;
          case 'Penarikan Wadah Kosong dari Mitra Toko / Warung':
            // Toko berkurang, kosong depo bertambah
            newEmpty += auditQty;
            newAtStores = Math.max(0, newAtStores - auditQty);
            break;
          case 'Pengembalian Wadah Pinjaman Residensial (Refund Deposit)':
            // Konsumen mengembalikan, kosong depo bertambah
            newEmpty += auditQty;
            newLoaned = Math.max(0, newLoaned - auditQty);
            break;
          case 'Pencatatan Retur Wadah Rusak / Bocor / Pecah':
            // Tabung rusak dicatat ke afkir
            newDamaged += auditQty;
            if (newEmpty >= auditQty) {
              newEmpty -= auditQty;
            }
            break;
          case 'Stock Opname / Audit Fisik Berkala Gudang':
            // Penyesuaian stok fisik langsung
            newFilled = auditQty;
            break;
          default:
            newFilled += auditQty;
            break;
        }
      }

      return {
        ...asset,
        filled: Math.max(0, newFilled),
        empty: Math.max(0, newEmpty),
        atStores: Math.max(0, newAtStores),
        loanedHousehold: Math.max(0, newLoaned),
        damaged: Math.max(0, newDamaged),
      };
    });

    setInternalCirculation(updated);
    if (onUpdateGallonCirculation) {
      onUpdateGallonCirculation(updated);
    }

    setShowAuditModal(false);
    setAuditSuccessMsg(
      `✓ Berita Acara Sukses: SKU [${auditSku}] ${auditItemName} (${auditQty} ${activeUnitLabel}) tercatat reaktif ke tabel & metrik.`
    );
  };

  // Filter items based on selected tab
  const filteredCirculation = useMemo(() => {
    if (selectedAssetFilter === 'ALL') return gallonCirculation;
    return gallonCirculation.filter((item) => {
      if (item.assetType) {
        return item.assetType === selectedAssetFilter;
      }
      // Fallback inference by name if assetType is omitted
      const cat = item.category.toLowerCase();
      if (selectedAssetFilter === 'TABUNG_GALON') return cat.includes('galon') || cat.includes('19l') || cat.includes('aqua') || cat.includes('cleo') || cat.includes('vit') || cat.includes('minerale');
      if (selectedAssetFilter === 'KRAT_BOTOL') return cat.includes('krat') || cat.includes('peti') || cat.includes('sosro') || cat.includes('coca');
      if (selectedAssetFilter === 'TABUNG_GAS') return cat.includes('gas') || cat.includes('elpiji') || cat.includes('bright') || cat.includes('lpg');
      if (selectedAssetFilter === 'PALET_KEMASAN') return cat.includes('palet') || cat.includes('hdpe') || cat.includes('pallet');
      return true;
    });
  }, [gallonCirculation, selectedAssetFilter]);

  const totalFilled = filteredCirculation.reduce((sum, g) => sum + g.filled, 0);
  const totalEmpty = filteredCirculation.reduce((sum, g) => sum + g.empty, 0);
  const totalAtStores = filteredCirculation.reduce((sum, g) => sum + g.atStores, 0);
  const totalLoaned = filteredCirculation.reduce((sum, g) => sum + (g.loanedHousehold ?? 0), 0);
  const totalSold = filteredCirculation.reduce((sum, g) => sum + (g.soldOutright ?? 0), 0);
  const totalDamaged = filteredCirculation.reduce((sum, g) => sum + g.damaged, 0);
  const grandTotalDepoAsset = totalFilled + totalEmpty + totalAtStores + totalLoaned + totalDamaged;

  const totalAssets = Math.max(grandTotalDepoAsset, 1);
  const filledPct = Math.round((totalFilled / totalAssets) * 100);
  const emptyPct = Math.round((totalEmpty / totalAssets) * 100);
  const storesPct = Math.round(((totalAtStores + totalLoaned) / totalAssets) * 100);
  const damagedPct = Math.max(1, Math.round((totalDamaged / totalAssets) * 100));

  // Determine appropriate unit label
  const activeUnitLabel = useMemo(() => {
    switch (selectedAssetFilter) {
      case 'TABUNG_GALON':
        return 'Tabung';
      case 'KRAT_BOTOL':
        return 'Krat';
      case 'TABUNG_GAS':
        return 'Tabung Gas';
      case 'PALET_KEMASAN':
        return 'Palet';
      default:
        return 'Wadah / Unit';
    }
  }, [selectedAssetFilter]);

  return (
    <div className="space-y-5 [body.light-theme_&]:text-slate-800">
      {/* Header Banner */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6]"></span>
            <h3 className="text-base font-extrabold text-white [body.light-theme_&]:text-slate-900 tracking-tight">
              Sirkulasi Wadah & Aset Kemasan (Multi-Container Hub)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Galon • Krat • Gas • Palet
            </span>
          </div>
          <p className="text-xs text-slate-400 [body.light-theme_&]:text-slate-600 mt-1">
            Monitoring sirkulasi aset kemasan fisik depo: tabung galon 19L, krat/peti botol kaca, tabung gas LPG, dan palet logistik.
          </p>
        </div>

        <button
          onClick={() => setShowAuditModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-violet-400 via-purple-300 to-violet-300 hover:from-violet-300 hover:to-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
        >
          <ClipboardCheck className="w-4 h-4 text-slate-950" />
          Input Berita Acara Wadah & Aset
        </button>
      </div>

      {auditSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{auditSuccessMsg}</span>
          </div>
          <button onClick={() => setAuditSuccessMsg(null)} className="cursor-pointer font-bold text-emerald-300 hover:text-white">✕</button>
        </div>
      )}

      {/* FILTER PILLS: TAB KATEGORI WADAH & ASET KEMASAN */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-950/60 [body.light-theme_&]:bg-slate-100 p-1.5 rounded-xl border border-slate-800 [body.light-theme_&]:border-slate-300">
        <button
          type="button"
          onClick={() => setSelectedAssetFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedAssetFilter === 'ALL'
              ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
              : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Semua Wadah & Aset ({gallonCirculation.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedAssetFilter('TABUNG_GALON')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedAssetFilter === 'TABUNG_GALON'
              ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Tabung Galon 19L</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedAssetFilter('KRAT_BOTOL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedAssetFilter === 'KRAT_BOTOL'
              ? 'bg-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
          }`}
        >
          <Wine className="w-3.5 h-3.5 text-amber-400" />
          <span>Krat / Peti Botol</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedAssetFilter('TABUNG_GAS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedAssetFilter === 'TABUNG_GAS'
              ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tabung Gas LPG</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedAssetFilter('PALET_KEMASAN')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedAssetFilter === 'PALET_KEMASAN'
              ? 'bg-sky-600 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)]'
              : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Palet Kemasan & Logistik</span>
        </button>
      </div>

      {/* 6 Audit Stat Cards with Hover Neon Glow */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Terisi Depo (Neon Cyan Glow) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 bg-cyan-950/20 [body.light-theme_&]:bg-white transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] text-cyan-400 [body.light-theme_&]:text-cyan-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Terisi (Depo)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-cyan-300 [body.light-theme_&]:text-cyan-800 font-mono drop-shadow-[0_0_8px_rgba(6,182,212,0.25)]">
            {totalFilled}
          </div>
          <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5 font-medium">
            Siap kirim order ({activeUnitLabel})
          </div>
        </div>

        {/* 2. Kosong Depo (Neon Sky/Biru Glow) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 bg-sky-950/20 [body.light-theme_&]:bg-white transition-all duration-300 hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] text-sky-400 [body.light-theme_&]:text-sky-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Kosong (Depo)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-sky-300 [body.light-theme_&]:text-sky-800 font-mono drop-shadow-[0_0_8px_rgba(56,189,248,0.25)]">
            {totalEmpty}
          </div>
          <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5 font-medium">
            Siap tukar pabrik ({activeUnitLabel})
          </div>
        </div>

        {/* 3. Di Mitra Toko B2B (Neon Amber Glow) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 bg-amber-950/20 [body.light-theme_&]:bg-white transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] text-amber-400 [body.light-theme_&]:text-amber-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Di Toko / Mitra B2B</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-300 [body.light-theme_&]:text-amber-800 font-mono drop-shadow-[0_0_8px_rgba(251,191,36,0.25)]">
            {totalAtStores}
          </div>
          <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5 font-medium">
            Sirkulasi grosir ({activeUnitLabel})
          </div>
        </div>

        {/* 4. Pinjam Konsumen / B2C (Neon Emerald Glow) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 bg-emerald-950/20 [body.light-theme_&]:bg-white transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] text-emerald-400 [body.light-theme_&]:text-emerald-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Pinjam Konsumen</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 [body.light-theme_&]:text-emerald-800 font-mono drop-shadow-[0_0_8px_rgba(52,211,153,0.25)]">
            {totalLoaned}
          </div>
          <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5 font-medium">
            Terjamin deposit ({activeUnitLabel})
          </div>
        </div>

        {/* 5. Terjual Putus (Neon Indigo Glow) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 bg-indigo-950/20 [body.light-theme_&]:bg-white transition-all duration-300 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(129,140,248,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] text-indigo-400 [body.light-theme_&]:text-indigo-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Beli Lepas Baru</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-300 [body.light-theme_&]:text-indigo-800 font-mono drop-shadow-[0_0_8px_rgba(129,140,248,0.25)]">
            {totalSold}
          </div>
          <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5 font-medium">
            Aset pelanggan ({activeUnitLabel})
          </div>
        </div>

        {/* 6. Afkir / Rusak / Defisit (Neon Rose Glow) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 bg-rose-950/20 [body.light-theme_&]:bg-white transition-all duration-300 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] text-rose-400 [body.light-theme_&]:text-rose-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Afkir / Rusak</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400 [body.light-theme_&]:text-rose-700 font-mono drop-shadow-[0_0_8px_rgba(244,63,94,0.25)]">
            {totalDamaged}
          </div>
          <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5 font-medium">
            Klaim pabrik ({activeUnitLabel})
          </div>
        </div>
      </div>

      {/* Progress Bar Multi-Segmen Rasio Sirkulasi */}
      <div className="glass-panel p-4 rounded-xl border border-slate-700/60 transition-all duration-300 hover:border-violet-400 hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 space-y-3 cursor-default">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6] animate-pulse"></span>
            <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900">
              Rasio Multi-Segmen Sirkulasi {selectedAssetFilter === 'ALL' ? 'Seluruh Wadah & Aset Kemasan' : activeUnitLabel}
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 font-bold">
            Total Populasi: {grandTotalDepoAsset.toLocaleString('id-ID')} {activeUnitLabel}
          </span>
        </div>

        {/* Multi-Segment Glowing Progress Bar */}
        <div className="w-full h-4 rounded-xl bg-slate-950 border border-slate-700/80 overflow-hidden flex p-0.5 shadow-inner">
          <div
            style={{ width: `${filledPct}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-lg shadow-[0_0_12px_rgba(16,185,129,0.7)] transition-all duration-500"
            title={`Isi di Gudang: ${totalFilled} (${filledPct}%)`}
          ></div>
          <div
            style={{ width: `${emptyPct}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_12px_rgba(6,182,212,0.7)] transition-all duration-500"
            title={`Kosong Siap Tukar: ${totalEmpty} (${emptyPct}%)`}
          ></div>
          <div
            style={{ width: `${storesPct}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.7)] transition-all duration-500"
            title={`Di Mitra Toko / Konsumen: ${totalAtStores + totalLoaned} (${storesPct}%)`}
          ></div>
          <div
            style={{ width: `${damagedPct}%` }}
            className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-r-lg shadow-[0_0_12px_rgba(244,63,94,0.7)] transition-all duration-500"
            title={`Afkir / Retur: ${totalDamaged} (${damagedPct}%)`}
          ></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10.5px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Isi Depo: <strong>{totalFilled} ({filledPct}%)</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Kosong Depo: <strong>{totalEmpty} ({emptyPct}%)</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Beredar Toko: <strong>{totalAtStores + totalLoaned} ({storesPct}%)</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Afkir/Susut: <strong>{totalDamaged} ({damagedPct}%)</strong></span>
          </div>
        </div>
      </div>

      {/* Grid Kartu Stok Wadah & Aset Kemasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredCirculation.map((asset) => {
          const totalAsset = asset.filled + asset.empty + asset.atStores + (asset.loanedHousehold || 0) + asset.damaged;
          const uName = asset.unitName || (asset.category.toLowerCase().includes('krat') ? 'Krat' : asset.category.toLowerCase().includes('gas') ? 'Tabung' : asset.category.toLowerCase().includes('palet') ? 'Palet' : 'Tabung');
          
          let badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
          let borderGlow = 'hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]';
          if (asset.assetType === 'KRAT_BOTOL') {
            badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            borderGlow = 'hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]';
          } else if (asset.assetType === 'TABUNG_GAS') {
            badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            borderGlow = 'hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]';
          } else if (asset.assetType === 'PALET_KEMASAN') {
            badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
            borderGlow = 'hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.35)]';
          }

          return (
            <div
              key={asset.id || asset.category}
              className={`glass-panel p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/60 [body.light-theme_&]:bg-white transition-all duration-300 ${borderGlow} hover:-translate-y-1 cursor-default`}
            >
              <div className="flex items-start justify-between gap-1 pb-1.5 mb-2 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
                <div className="min-w-0">
                  <div className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 truncate">
                    {asset.category}
                  </div>
                  <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 font-medium">
                    Kapasitas Aset: {asset.capacity} {uName}
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                  {totalAsset} {uName}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 [body.light-theme_&]:text-slate-600">Terisi di Depo:</span>
                  <strong className="text-emerald-400">{asset.filled} {uName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 [body.light-theme_&]:text-slate-600">Kosong di Depo:</span>
                  <strong className="text-cyan-400">{asset.empty} {uName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 [body.light-theme_&]:text-slate-600">Beredar di Toko:</span>
                  <strong className="text-amber-400">{asset.atStores} {uName}</strong>
                </div>
                {asset.loanedHousehold !== undefined && asset.loanedHousehold > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 [body.light-theme_&]:text-slate-600">Pinjam Warga (Deposit):</span>
                    <strong className="text-sky-400">{asset.loanedHousehold} {uName}</strong>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 [body.light-theme_&]:text-slate-600">Afkir / Retur:</span>
                  <strong className={asset.damaged > 0 ? 'text-rose-400' : 'text-slate-500'}>
                    {asset.damaged} {uName}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabel Rincian Sirkulasi Aset Kemasan */}
      <div className="glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900">
              Audit Buku Besar Konservasi Wadah & Kemasan Fisik
            </h4>
          </div>
          <span className="text-[10.5px] font-mono text-slate-400 [body.light-theme_&]:text-slate-600">
            {filteredCirculation.length} Baris SKU Wadah Terdata
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 [body.light-theme_&]:bg-slate-100 text-slate-400 [body.light-theme_&]:text-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Wadah & Kemasan</th>
                <th className="py-3 px-4">Kode SKU / Barcode</th>
                <th className="py-3 px-4">Tipe Aset</th>
                <th className="py-3 px-4">Terisi Depo</th>
                <th className="py-3 px-4">Kosong Depo</th>
                <th className="py-3 px-4">Mitra Toko</th>
                <th className="py-3 px-4">Pinjam Warga</th>
                <th className="py-3 px-4">Afkir/Klaim</th>
                <th className="py-3 px-4">Total Aset</th>
                <th className="py-3 px-4">Estimasi Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 [body.light-theme_&]:divide-slate-200 text-slate-300">
              {filteredCirculation.map((row) => {
                const totalAssetDepo = row.filled + row.empty + row.atStores + (row.loanedHousehold || 0) + row.damaged;
                const ratePerUnit = row.assetType === 'TABUNG_GAS' ? 140000 : row.assetType === 'KRAT_BOTOL' ? 75000 : row.assetType === 'PALET_KEMASAN' ? 180000 : 45000;
                const estValue = totalAssetDepo * ratePerUnit;
                const uName = row.unitName || 'Unit';

                return (
                  <tr key={row.category} className="hover:bg-slate-900/50 [body.light-theme_&]:hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-white [body.light-theme_&]:text-slate-900 text-xs">
                      <div>{row.category}</div>
                      {row.brand && <div className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-500 font-normal">{row.brand}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] font-bold text-cyan-400 [body.light-theme_&]:text-cyan-700">
                        {row.sku || row.id}
                      </div>
                      <div className="font-mono text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-500 flex items-center gap-1">
                        <span>Barcode:</span>
                        <span className="font-bold text-slate-300 [body.light-theme_&]:text-slate-600">{row.barcode || row.sku || row.id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700">
                        {row.assetType ? row.assetType.replace('_', ' ') : 'TABUNG'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-cyan-400 [body.light-theme_&]:text-cyan-700">
                      {row.filled} {uName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 [body.light-theme_&]:text-slate-700">
                      {row.empty} {uName}
                    </td>
                    <td className="py-3.5 px-4 text-amber-400 [body.light-theme_&]:text-amber-700 font-bold">
                      {row.atStores} {uName}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 [body.light-theme_&]:text-emerald-700 font-bold">
                      {row.loanedHousehold || 0} {uName}
                    </td>
                    <td className="py-3.5 px-4 text-rose-400 [body.light-theme_&]:text-rose-700 font-bold">
                      {row.damaged} {uName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100 [body.light-theme_&]:text-slate-900">
                      {totalAssetDepo} {uName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 [body.light-theme_&]:text-emerald-700">
                      Rp {estValue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BERITA ACARA MODAL INTERAKTIF */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-3">
              <h4 className="font-extrabold text-white [body.light-theme_&]:text-slate-900 text-sm flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-violet-400" />
                Input Berita Acara Wadah & Aset Kemasan
              </h4>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Pilihan Produk Individual Wajib SKU & Barcode */}
              <div>
                <label className="block font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Pilih Produk Individual (Wajib SKU / Barcode) *
                </label>
                <select
                  value={auditSku}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-bold focus:outline-none focus:border-violet-400"
                >
                  {gallonCirculation.map((item) => (
                    <option key={item.sku || item.id} value={item.sku || item.id} className="bg-slate-900 text-white">
                      [{item.sku || item.id}] {item.category} (Barcode: {item.barcode || item.sku || item.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Snapshot Stok Realtime Produk yang Dipilih */}
              {(() => {
                const target = gallonCirculation.find((item) => (item.sku || item.id) === auditSku);
                if (!target) return null;
                const uName = target.unitName || 'Unit';
                return (
                  <div className="p-2.5 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-100 border border-slate-800 [body.light-theme_&]:border-slate-200">
                    <div className="text-[10.5px] font-bold text-violet-400 [body.light-theme_&]:text-violet-700 mb-1.5 flex items-center justify-between">
                      <span>Status Stok Saat Ini: {target.category}</span>
                      <span className="font-mono text-[10px] text-slate-400">{target.sku || target.id}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                      <div className="bg-cyan-500/10 border border-cyan-500/30 p-1 rounded-lg">
                        <div className="text-[9px] text-slate-400">Terisi Depo</div>
                        <div className="text-xs font-black text-cyan-400">{target.filled} {uName}</div>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-lg">
                        <div className="text-[9px] text-slate-400">Kosong Depo</div>
                        <div className="text-xs font-black text-slate-200">{target.empty} {uName}</div>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 p-1 rounded-lg">
                        <div className="text-[9px] text-slate-400">Di Mitra Toko</div>
                        <div className="text-xs font-black text-amber-400">{target.atStores} {uName}</div>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/30 p-1 rounded-lg">
                        <div className="text-[9px] text-slate-400">Afkir/Rusak</div>
                        <div className="text-xs font-black text-rose-400">{target.damaged} {uName}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Jenis Aktivitas Mutasi Aset
                </label>
                <select
                  value={auditActivity}
                  onChange={(e) => setAuditActivity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900"
                >
                  <option value="Penerimaan Aset Terisi dari Pabrik / Principal">Penerimaan Aset Terisi dari Pabrik / Principal</option>
                  <option value="Pengiriman Wadah Kosong untuk Refill Pabrik">Pengiriman Wadah Kosong untuk Refill Pabrik</option>
                  <option value="Penarikan Wadah Kosong dari Mitra Toko / Warung">Penarikan Wadah Kosong dari Mitra Toko / Warung</option>
                  <option value="Pencatatan Retur Wadah Rusak / Bocor / Pecah">Pencatatan Retur Wadah Rusak / Bocor / Pecah</option>
                  <option value="Pengembalian Wadah Pinjaman Residensial (Refund Deposit)">Pengembalian Wadah Pinjaman Residensial (Refund Deposit)</option>
                  <option value="Stock Opname / Audit Fisik Berkala Gudang">Stock Opname / Audit Fisik Berkala Gudang</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                    Jumlah Fisik Mutasi
                  </label>
                  <input
                    type="number"
                    value={auditQty}
                    onChange={(e) => setAuditQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                    Kondisi Fisik
                  </label>
                  <select
                    value={auditCondition}
                    onChange={(e) => setAuditCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-bold"
                  >
                    <option value="BAGUS">Bagus / Laik Pakai</option>
                    <option value="RETAK">Retak / Cacat Ringan</option>
                    <option value="BOCOR_PECAH">Bocor / Pecah / Afkir</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Catatan / Petugas Lapangan
                </label>
                <input
                  type="text"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Contoh: DO Pabrik #DO-9921, diperiksa Checker Gudang Dani"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white [body.light-theme_&]:hover:text-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBeritaAcara}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-violet-400 hover:bg-violet-300 cursor-pointer shadow-[0_0_12px_rgba(139,92,246,0.4)] transition-all active:scale-95"
              >
                Simpan Berita Acara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
