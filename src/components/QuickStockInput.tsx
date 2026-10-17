import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProductMasterItem, SupplierMasterItem, ParentCategoryType } from '../types';
import {
  Barcode,
  Scan,
  Plus,
  Truck,
  Building2,
  Phone,
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Package,
  Percent,
} from 'lucide-react';

export const UNIVERSAL_PURCHASE_UNITS = [
  'Pcs / Butir / Botol',
  'Karton / Dus',
  'Sak / Karung',
  'Renceng / Pack',
  'Tray',
  'Tabung / Galon',
  'Jerigen / Unit',
] as const;

export type UniversalPurchaseUnit = typeof UNIVERSAL_PURCHASE_UNITS[number];

export interface QuickStockInputProps {
  products: ProductMasterItem[];
  masterSuppliers: SupplierMasterItem[];
  onSaveProduct: (product: ProductMasterItem) => void;
  onOpenNewSupplierModal?: () => void;
  isSyncingGas?: boolean;
}

export const QuickStockInput: React.FC<QuickStockInputProps> = ({
  products,
  masterSuppliers,
  onSaveProduct,
  onOpenNewSupplierModal,
  isSyncingGas = false,
}) => {
  // Collapsible toggle
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Barcode input & scanner state
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'detected_existing' | 'detected_new'>('idle');
  const [detectedProduct, setDetectedProduct] = useState<ProductMasterItem | null>(null);

  // Bagian a: Identitas SKU & Supplier
  const [intakeSku, setIntakeSku] = useState<string>(`PRD-${String(products.length + 1).padStart(2, '0')}`);
  const [intakeName, setIntakeName] = useState<string>('');
  const [intakeBrand, setIntakeBrand] = useState<string>('Danone Aqua');
  const [intakeSupplier, setIntakeSupplier] = useState<string>(masterSuppliers[0]?.name || 'Pabrik Danone Subang');

  // Bagian b: Jumlah Pembelian & Satuan Universal
  const [intakeQty, setIntakeQty] = useState<number>(50);
  const [intakeUnit, setIntakeUnit] = useState<string>('Tabung / Galon');

  // Bagian c: Kategori Utama (4 Tombol) & Ukuran Kemasan Fleksibel
  const [intakeCategoryTab, setIntakeCategoryTab] = useState<'AIR_MINUM' | 'FMCG_SEMBAKO' | 'HOMECARE' | 'NON_FMCG'>('AIR_MINUM');
  const [intakePackaging, setIntakePackaging] = useState<string>('');

  // Bagian d: Tier HPP & e. Margin
  const [intakeTargetTier, setIntakeTargetTier] = useState<'retail' | 'grosir'>('retail');
  const [intakeHpp, setIntakeHpp] = useState<number>(15200);
  const [intakeMarginPercent, setIntakeMarginPercent] = useState<number>(25);

  // Refs for sequential focus
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const supplierSelectRef = useRef<HTMLSelectElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const packagingInputRef = useRef<HTMLInputElement>(null);
  const hppInputRef = useRef<HTMLInputElement>(null);
  const marginInputRef = useRef<HTMLInputElement>(null);

  // Autofocus default ke barcode input scanner saat mount
  useEffect(() => {
    const timer = setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Update default supplier when masterSuppliers loads
  useEffect(() => {
    if (masterSuppliers.length > 0 && !masterSuppliers.some((s) => s.name === intakeSupplier)) {
      setIntakeSupplier(masterSuppliers[0].name);
    }
  }, [masterSuppliers]);

  // Kalkulasi harga jual otomatis berdasarkan HPP & margin
  const calculatedSellingPrice = useMemo(() => {
    const base = Number(intakeHpp) || 0;
    const margin = Number(intakeMarginPercent) || 0;
    const raw = base + (base * margin) / 100;
    return Math.max(0, Math.round(raw / 100) * 100);
  }, [intakeHpp, intakeMarginPercent]);

  // Map Category Tab to ParentCategoryType and subcategory default
  const resolvedParentCategory = useMemo<ParentCategoryType>(() => {
    switch (intakeCategoryTab) {
      case 'AIR_MINUM':
        return 'AIR_MINUM';
      case 'FMCG_SEMBAKO':
        return 'FMCG_FOOD';
      case 'HOMECARE':
        return 'FMCG_NON_FOOD';
      case 'NON_FMCG':
        return 'NON_FMCG_LOGISTIK';
      default:
        return 'AIR_MINUM';
    }
  }, [intakeCategoryTab]);

  const resolvedSubCategory = useMemo<string>(() => {
    switch (intakeCategoryTab) {
      case 'AIR_MINUM':
        return 'Air Minum & Galon';
      case 'FMCG_SEMBAKO':
        return 'Sembako & Pangan';
      case 'HOMECARE':
        return 'Homecare & Sabun';
      case 'NON_FMCG':
        return 'Perlengkapan & Logistik';
      default:
        return 'Umum';
    }
  }, [intakeCategoryTab]);

  // Handler deteksi barcode scanner
  const handleProcessBarcodeScan = (codeToSearch?: string) => {
    const raw = (codeToSearch !== undefined ? codeToSearch : barcodeInput).trim();
    if (!raw) return;

    const match = products.find(
      (p) =>
        p.id.toLowerCase() === raw.toLowerCase() ||
        (p.barcode && p.barcode.toLowerCase() === raw.toLowerCase())
    );

    if (match) {
      setScannerStatus('detected_existing');
      setDetectedProduct(match);
      setIntakeSku(match.id);
      setIntakeName(match.name);
      setIntakeBrand(match.brand || 'Danone Aqua');
      setIntakeSupplier(match.supplier || masterSuppliers[0]?.name || 'Pabrik Danone Subang');
      setIntakeHpp(match.hpp || 15200);
      setIntakePackaging(match.packagingSize || '');
      setIntakeTargetTier(match.targetTier || 'retail');

      // Sync category tab
      if (match.parentCategory === 'AIR_MINUM' || match.category.toLowerCase().includes('galon') || match.category.toLowerCase().includes('air')) {
        setIntakeCategoryTab('AIR_MINUM');
      } else if (match.parentCategory === 'FMCG_FOOD' || match.category.toLowerCase().includes('beras') || match.category.toLowerCase().includes('sembako') || match.category.toLowerCase().includes('minyak')) {
        setIntakeCategoryTab('FMCG_SEMBAKO');
      } else if (match.parentCategory === 'FMCG_NON_FOOD' || match.category.toLowerCase().includes('sabun') || match.category.toLowerCase().includes('homecare')) {
        setIntakeCategoryTab('HOMECARE');
      } else if (match.parentCategory === 'NON_FMCG_LOGISTIK') {
        setIntakeCategoryTab('NON_FMCG');
      }

      // Check unit match or keep
      const matchedUnit = UNIVERSAL_PURCHASE_UNITS.find((u) => u.toLowerCase().includes(match.unit.toLowerCase()));
      if (matchedUnit) {
        setIntakeUnit(matchedUnit);
      }

      const initialMargin = match.profitMarginPercent || (match.hpp > 0 ? Math.round(((match.priceRetail - match.hpp) / match.hpp) * 100) : 25);
      setIntakeMarginPercent(initialMargin);
      setIntakeQty(50);

      setTimeout(() => {
        supplierSelectRef.current?.focus();
      }, 100);
    } else {
      setScannerStatus('detected_new');
      setDetectedProduct(null);
      setIntakeSku(raw);
      setIntakeName('');
      setIntakePackaging('');
      setIntakeHpp(15000);
      setIntakeMarginPercent(25);
      setIntakeQty(50);
      setIntakeTargetTier('retail');

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  };

  const handleResetScan = () => {
    setBarcodeInput('');
    setScannerStatus('idle');
    setDetectedProduct(null);
    setIntakeQty(50);
    setTimeout(() => barcodeInputRef.current?.focus(), 60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    // Hitung harga berdasarkan tier
    const retailPrice = intakeTargetTier === 'retail' ? calculatedSellingPrice : Math.round((calculatedSellingPrice * 1.12) / 100) * 100;
    const tokoPrice = intakeTargetTier === 'retail' ? Math.round((calculatedSellingPrice * 0.92) / 100) * 100 : calculatedSellingPrice;
    const pangkalanPrice = intakeTargetTier === 'retail' ? Math.round((calculatedSellingPrice * 0.88) / 100) * 100 : Math.round((calculatedSellingPrice * 0.95) / 100) * 100;

    const savedProduct: ProductMasterItem = {
      id: cleanSku,
      barcode: barcodeInput.trim() || cleanSku,
      name: intakeName.trim(),
      category: detectedProduct?.category || resolvedSubCategory,
      parentCategory: detectedProduct?.parentCategory || resolvedParentCategory,
      brand: intakeBrand.trim() || 'Umum',
      stock: finalStock,
      minStock: detectedProduct?.minStock || Math.max(10, Math.round(finalStock * 0.25)),
      reorderPoint: detectedProduct?.reorderPoint || Math.max(20, Math.round(finalStock * 0.4)),
      unit: intakeUnit,
      hpp: Number(intakeHpp) || 0,
      pricingScheme: 'tier',
      priceRetail: retailPrice,
      priceToko: tokoPrice,
      pricePangkalan: pangkalanPrice,
      supplier: intakeSupplier,
      packagingSize: intakePackaging.trim() || undefined,
      supplierContact: currentSupObj?.phone,
      supplierAddress: currentSupObj?.address,
      lastPurchaseQty: qtyNum,
      targetTier: intakeTargetTier,
      profitMarginPercent: Number(intakeMarginPercent),
      warningMode: detectedProduct?.warningMode || 'percentage',
      maxCapacity: detectedProduct?.maxCapacity || 500,
      warningThresholdValue: detectedProduct?.warningThresholdValue || 30,
    };

    onSaveProduct(savedProduct);
    handleResetScan();
  };

  const curSup = masterSuppliers.find((s) => s.name === intakeSupplier) || masterSuppliers[0];
  const cleanWa = (curSup?.phone || '').replace(/\D/g, '');
  const waLink = `https://wa.me/62${cleanWa.startsWith('0') ? cleanWa.slice(1) : cleanWa}`;

  return (
    <div className="rounded-2xl border border-slate-700/60 [body.light-theme_&]:border-slate-200 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 [body.light-theme_&]:from-purple-50/70 [body.light-theme_&]:via-white [body.light-theme_&]:to-indigo-50/70 shadow-sm transition-all duration-300">
      {/* Header Ribbon & Scanning Status Indicator */}
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
                UNIVERSAL FMCG &amp; AIR
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
              Mendukung Barcode Scanner USB / Bluetooth (Auto-Enter) &amp; input keyboard manual multi-kategori.
            </p>
          </div>
        </div>

        {/* Status & Collapse Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 [body.light-theme_&]:text-emerald-800 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Scanner Aktif: Siap Scan</span>
          </div>

          {(scannerStatus !== 'idle' || barcodeInput.trim()) && (
            <button
              type="button"
              onClick={handleResetScan}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:text-slate-700 text-[10px] font-bold cursor-pointer transition-all border border-slate-700 [body.light-theme_&]:border-slate-300 flex items-center gap-1"
              title="Bersihkan input &amp; siap scan baru"
            >
              <X className="w-3 h-3" />
              <span>Reset Scan</span>
            </button>
          )}

          <button
            type="button"
            id="btn-toggle-quick-input"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 [body.light-theme_&]:bg-purple-100 [body.light-theme_&]:text-purple-800 border border-purple-500/40 text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
            title={isExpanded ? 'Sembunyikan Form Input Cepat' : 'Buka Form Input Cepat'}
          >
            {isExpanded ? (
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

      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-3.5 animate-in fade-in duration-200">
          {/* 1. Barcode Scanner Input */}
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

            {/* Status Banner */}
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

          {/* Form Utama Input SKU */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5">
              
              {/* Bagian a: Supplier & Identitas SKU (Span 4) */}
              <div className="lg:col-span-4 p-3.5 rounded-2xl bg-slate-950/70 [body.light-theme_&]:bg-white border border-slate-700/60 [body.light-theme_&]:border-slate-200 space-y-2.5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-purple-400 [body.light-theme_&]:text-purple-700 tracking-wider flex items-center gap-1">
                      <span>a. Supplier &amp; Identitas SKU</span>
                    </span>
                    {onOpenNewSupplierModal && (
                      <button
                        type="button"
                        onClick={onOpenNewSupplierModal}
                        className="text-[10.5px] font-bold text-cyan-400 hover:text-cyan-300 [body.light-theme_&]:text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                        title="Daftarkan supplier baru jika belum ada di daftar"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Supplier Baru</span>
                      </button>
                    )}
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

                  {/* Identitas Lengkap Supplier */}
                  {curSup && (
                    <div className="p-2 rounded-xl bg-slate-900/90 [body.light-theme_&]:bg-slate-100/80 border border-slate-800 [body.light-theme_&]:border-slate-200 text-[10px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-cyan-400" />
                          <span>PIC: {curSup.picName || 'Sales Depo'}</span>
                        </span>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 [body.light-theme_&]:text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>WA: {curSup.phone}</span>
                        </a>
                      </div>
                      <p className="text-slate-400 [body.light-theme_&]:text-slate-500 truncate" title={curSup.address}>
                        📍 {curSup.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bagian b & c: Jumlah Pembelian & Kategori Kemasan (Span 4) */}
              <div className="lg:col-span-4 p-3.5 rounded-2xl bg-slate-950/70 [body.light-theme_&]:bg-white border border-slate-700/60 [body.light-theme_&]:border-slate-200 space-y-2.5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-xs">
                
                {/* Bagian B: Jumlah Pembelian (Qty Restock) & Satuan Universal */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-purple-400 [body.light-theme_&]:text-purple-700 tracking-wider">
                      b. Jumlah Pembelian &amp; Satuan Universal
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
                          packagingInputRef.current?.focus();
                        }
                      }}
                      className="w-24 px-3 py-1.5 text-xs rounded-xl bg-slate-900 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:border-purple-400 outline-hidden transition-colors"
                      title="Jumlah pembelian"
                    />

                    {/* Universal Purchase Unit Dropdown */}
                    <div className="flex-1">
                      <select
                        value={intakeUnit}
                        onChange={(e) => setIntakeUnit(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-900 [body.light-theme_&]:bg-purple-50 border border-purple-500/40 text-purple-300 [body.light-theme_&]:text-purple-900 font-bold focus:border-purple-400 outline-hidden cursor-pointer transition-colors"
                        title="Pilih satuan pembelian / barang universal"
                      >
                        {UNIVERSAL_PURCHASE_UNITS.map((unitOpt) => (
                          <option key={unitOpt} value={unitOpt}>
                            {unitOpt}
                          </option>
                        ))}
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

                {/* Bagian C: Kategori & Ukuran Kemasan */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80 [body.light-theme_&]:border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-purple-400 [body.light-theme_&]:text-purple-700 tracking-wider flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>c. Kategori &amp; Ukuran Kemasan</span>
                    </span>
                  </div>

                  {/* 4 Tombol Tab Kategori Utama */}
                  <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-slate-900 [body.light-theme_&]:bg-slate-100 border border-slate-800 [body.light-theme_&]:border-slate-200 text-[9.5px]">
                    {[
                      { key: 'AIR_MINUM' as const, label: 'Air Minum', icon: '💧' },
                      { key: 'FMCG_SEMBAKO' as const, label: 'Sembako', icon: '🌾' },
                      { key: 'HOMECARE' as const, label: 'Homecare', icon: '🧼' },
                      { key: 'NON_FMCG' as const, label: 'Non-FMCG', icon: '📦' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setIntakeCategoryTab(tab.key)}
                        className={`py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer truncate ${
                          intakeCategoryTab === tab.key
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
                      ref={packagingInputRef}
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

              {/* Bagian d & e: Tier HPP & Kalkulator Margin (Span 4) */}
              <div className="lg:col-span-4 p-3.5 rounded-2xl bg-slate-950/70 [body.light-theme_&]:bg-white border border-slate-700/60 [body.light-theme_&]:border-slate-200 space-y-2.5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-xs">
                
                {/* d. Tier HPP */}
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
                        Grosir / Pangkalan
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
                        className="w-14 px-1.5 py-0.5 text-[11px] rounded-lg bg-slate-900 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-amber-300 [body.light-theme_&]:text-amber-800 font-mono font-bold text-center outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Preset Margin Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    {[15, 20, 25, 30].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setIntakeMarginPercent(pct)}
                        className={`py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          intakeMarginPercent === pct
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-slate-900 [body.light-theme_&]:bg-slate-100 text-slate-400 [body.light-theme_&]:text-slate-700 border-slate-800 [body.light-theme_&]:border-slate-300 hover:text-white'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>

                  {/* Estimasi Harga Jual Output */}
                  <div className="p-2 rounded-xl bg-slate-900/90 [body.light-theme_&]:bg-purple-50/70 border border-slate-800 [body.light-theme_&]:border-purple-200 text-[10.5px] flex items-center justify-between">
                    <span className="text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                      Estimasi Harga Jual:
                    </span>
                    <span className="text-emerald-400 [body.light-theme_&]:text-emerald-800 font-mono font-black text-xs">
                      Rp {calculatedSellingPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-950/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-purple-400/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{detectedProduct ? 'Simpan Restock & Harga SKU' : 'Simpan & Daftarkan SKU Baru'}</span>
                    {isSyncingGas && <span className="text-[9px] text-cyan-200 animate-pulse">(Sync Sheets...)</span>}
                  </button>
                </div>

              </div>

            </div>
          </form>
        </div>
      )}
    </div>
  );
};
