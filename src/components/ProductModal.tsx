import React, { useState, useEffect } from 'react';
import { ProductMasterItem, ParentCategoryType, MultiUomType, ProductUomLevel } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: ProductMasterItem) => void;
  existingCount?: number;
  initialProduct?: ProductMasterItem | null;
}

export const PARENT_CATEGORY_CONFIG: {
  id: ParentCategoryType;
  label: string;
  icon: string;
  color: string;
  subCategories: string[];
  defaultUnit: string;
  isConsumable: boolean;
}[] = [
  {
    id: 'AIR_MINUM',
    label: '💧 Air Minum',
    icon: 'fa-solid fa-droplet',
    color: 'from-cyan-600 to-blue-600 text-cyan-300',
    subCategories: ['Air Minum & Galon', 'Galon 19L', 'Kemasan Botol / Dus', 'Kemasan Gelas / Cup', 'Air RO Curah Depo'],
    defaultUnit: 'Tabung / Galon',
    isConsumable: true,
  },
  {
    id: 'FMCG_FOOD',
    label: '🌾 Sembako',
    icon: 'fa-solid fa-bowl-rice',
    color: 'from-amber-600 to-orange-600 text-amber-300',
    subCategories: ['Sembako & Pangan', 'Beras & Karungan', 'Minyak Goreng', 'Telur Ayam', 'Gula Pasir & Pemanis', 'Mi Instan & Pasta', 'Kopi & Teh Kemasan'],
    defaultUnit: 'Karton / Dus',
    isConsumable: true,
  },
  {
    id: 'FMCG_NON_FOOD',
    label: '🧼 Homecare',
    icon: 'fa-solid fa-pump-soap',
    color: 'from-emerald-600 to-teal-600 text-emerald-300',
    subCategories: ['Homecare & Sabun', 'Sabun Cuci Piring', 'Deterjen & Pewangi', 'Pembersih Lantai', 'Sanitasi, Tisu & Segel'],
    defaultUnit: 'Karton / Dus',
    isConsumable: true,
  },
  {
    id: 'NON_FMCG_LOGISTIK',
    label: '📦 Non-FMCG',
    icon: 'fa-solid fa-boxes-stacked',
    color: 'from-purple-600 to-indigo-600 text-purple-300',
    subCategories: ['Perlengkapan & Logistik', 'Dispenser Air Galon', 'Pompa Galon Elektrik', 'Rak Galon Besi', 'Tabung Gas LPG', 'Krat & Keranjang Botol', 'Perlengkapan & Filter Depo'],
    defaultUnit: 'Pcs / Butir / Botol',
    isConsumable: false,
  },
];

export const UNIVERSAL_PURCHASE_UNITS = [
  'Pcs / Butir / Botol',
  'Karton / Dus',
  'Sak / Karung',
  'Renceng / Pack',
  'Tray',
  'Tabung / Galon',
  'Jerigen / Unit',
] as const;


export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  existingCount = 8,
  initialProduct = null,
}) => {
  const [skuCode, setSkuCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  
  // 1. Parent Category & Sub-Category (Bagian C)
  const [parentCategory, setParentCategory] = useState<ParentCategoryType>('AIR_MINUM');
  const [subCategory, setSubCategory] = useState('Air Minum & Galon');
  const [customSubCategory, setCustomSubCategory] = useState('');
  const [packagingSize, setPackagingSize] = useState('');

  // 2. Base Unit / Satuan Pembelian (Bagian B)
  const [baseUnit, setBaseUnit] = useState<string>('Tabung / Galon');
  const [customBaseUnit, setCustomBaseUnit] = useState('');

  // 3. Multi-UoM (Satuan Bertingkat: e.g. Dus/Karton vs Pcs)
  const [hasMultiUom, setHasMultiUom] = useState(false);
  const [higherUom, setHigherUom] = useState<MultiUomType>('Karton/Dus');
  const [conversionRatio, setConversionRatio] = useState<number>(24); // 1 Dus = 24 Pcs
  const [higherPriceRetail, setHigherPriceRetail] = useState<number>(0);
  const [higherPriceToko, setHigherPriceToko] = useState<number>(0);
  const [higherPricePangkalan, setHigherPricePangkalan] = useState<number>(0);

  // 4. Batch No & Expired Date (Khusus Consumable)
  const [batchNumber, setBatchNumber] = useState('');
  const [expiredDate, setExpiredDate] = useState('');

  // Brand & Supplier
  const [brand, setBrand] = useState('');
  const [supplier, setSupplier] = useState('');

  // Pricing Scheme: 'tier' | 'flat'
  const [pricingScheme, setPricingScheme] = useState<'tier' | 'flat'>('tier');
  const [hpp, setHpp] = useState<number>(0);
  
  // Base Prices (Harga Satuan Dasar)
  const [flatPrice, setFlatPrice] = useState<number>(0);
  const [pricePangkalan, setPricePangkalan] = useState<number>(0);
  const [priceToko, setPriceToko] = useState<number>(0);
  const [priceRetail, setPriceRetail] = useState<number>(0);

  // Inventory & Safety
  const [stock, setStock] = useState<number>(50);
  const [minStock, setMinStock] = useState<number>(10);
  const [reorderPoint, setReorderPoint] = useState<number>(20);

  // E-Warning Stok & Ambang Toleransi Fleksibel
  const [warningMode, setWarningMode] = useState<'percentage' | 'quantity'>('percentage');
  const [maxCapacity, setMaxCapacity] = useState<number>(500);
  const [warningThresholdValue, setWarningThresholdValue] = useState<number>(30); // 30% atau 100 pcs

  // Load initial product for editing or reset for creating
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setSkuCode(initialProduct.sku || initialProduct.id);
        setBarcode(initialProduct.barcode || initialProduct.sku || initialProduct.id);
        setName(initialProduct.name);
        setParentCategory(initialProduct.parentCategory || 'AIR_MINUM');
        setSubCategory(initialProduct.category || 'Air Minum & Galon');
        setCustomSubCategory('');
        setPackagingSize(initialProduct.packagingSize || '');
        setBaseUnit(initialProduct.unit || 'Tabung / Galon');
        setCustomBaseUnit('');
        setBrand(initialProduct.brand || '');
        setSupplier(initialProduct.supplier || '');
        setPricingScheme(initialProduct.pricingScheme || 'tier');
        setHpp(initialProduct.hpp || 0);
        setFlatPrice(initialProduct.flatPrice || 0);
        setPricePangkalan(initialProduct.pricePangkalan || 0);
        setPriceToko(initialProduct.priceToko || 0);
        setPriceRetail(initialProduct.priceRetail || 0);
        setStock(initialProduct.stock || 0);
        setMinStock(initialProduct.minStock || 10);
        setReorderPoint(initialProduct.reorderPoint || 20);
        setWarningMode(initialProduct.warningMode || 'percentage');
        setMaxCapacity(initialProduct.maxCapacity || 500);
        setWarningThresholdValue(initialProduct.warningThresholdValue || 30);
        setBatchNumber(initialProduct.batchNumber || '');
        setExpiredDate(initialProduct.expiredDate || '');

        if (initialProduct.uomLevels && initialProduct.uomLevels.length > 0) {
          setHasMultiUom(true);
          const higher = initialProduct.uomLevels[0];
          setHigherUom(higher.unit);
          setConversionRatio(higher.conversionRatio);
          setHigherPriceRetail(higher.priceRetail);
          setHigherPriceToko(higher.priceToko);
          setHigherPricePangkalan(higher.pricePangkalan);
        } else {
          setHasMultiUom(false);
          setHigherUom('Karton/Dus');
          setConversionRatio(24);
          setHigherPriceRetail(0);
          setHigherPriceToko(0);
          setHigherPricePangkalan(0);
        }
      } else {
        const generatedId = `GLN-PROD-${String(existingCount + 1).padStart(2, '0')}`;
        setSkuCode(generatedId);
        setBarcode(generatedId);
        setName('');
        setParentCategory('AIR_MINUM');
        setSubCategory('Air Minum & Galon');
        setCustomSubCategory('');
        setPackagingSize('');
        setBaseUnit('Tabung / Galon');
        setCustomBaseUnit('');
        setBrand('');
        setSupplier('');
        setPricingScheme('tier');
        setHpp(15000);
        setFlatPrice(20000);
        setPricePangkalan(18500);
        setPriceToko(19500);
        setPriceRetail(21000);
        setStock(50);
        setMinStock(15);
        setReorderPoint(25);
        setWarningMode('percentage');
        setMaxCapacity(500);
        setWarningThresholdValue(30);
        setHasMultiUom(false);
        setHigherUom('Karton/Dus');
        setConversionRatio(24);
        setHigherPriceRetail(0);
        setHigherPriceToko(0);
        setHigherPricePangkalan(0);
        setBatchNumber('');
        setExpiredDate('');
      }
    }
  }, [isOpen, existingCount, initialProduct]);

  // Handle Parent Category Switch
  const handleParentCategoryChange = (cat: ParentCategoryType) => {
    setParentCategory(cat);
    const conf = PARENT_CATEGORY_CONFIG.find((c) => c.id === cat);
    if (conf) {
      setSubCategory(conf.subCategories[0] || 'Umum');
      setBaseUnit(conf.defaultUnit);
      if (cat === 'FMCG_FOOD' || cat === 'FMCG_NON_FOOD') {
        setHasMultiUom(true);
        setConversionRatio(24);
        setHigherUom('Karton/Dus');
      }
    }
  };

  if (!isOpen) return null;

  // Resolve final category & unit strings
  const resolvedCategory = subCategory === 'Lainnya'
    ? (customSubCategory.trim() || 'Lain-lain')
    : subCategory;

  const resolvedUnit = customBaseUnit.trim() ? customBaseUnit.trim() : baseUnit;

  const finalPangkalan = pricingScheme === 'flat' ? flatPrice : pricePangkalan;
  const finalToko = pricingScheme === 'flat' ? flatPrice : priceToko;
  const finalRetail = pricingScheme === 'flat' ? flatPrice : priceRetail;

  // Auto-calculate higher prices if empty
  const effHigherRetail = higherPriceRetail || (finalRetail * conversionRatio);
  const effHigherToko = higherPriceToko || (finalToko * conversionRatio);
  const effHigherPangkalan = higherPricePangkalan || (finalPangkalan * conversionRatio);

  // Expired alert helper
  const currentCategoryConf = PARENT_CATEGORY_CONFIG.find((c) => c.id === parentCategory);
  const isConsumable = currentCategoryConf ? currentCategoryConf.isConsumable : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama produk / barang wajib diisi!');
      return;
    }
    if (!skuCode.trim()) {
      alert('Kode SKU wajib diisi!');
      return;
    }

    const calculatedLimit = warningMode === 'percentage'
      ? Math.round(((Number(maxCapacity) || 0) * (Number(warningThresholdValue) || 0)) / 100)
      : Math.round(Number(warningThresholdValue) || 0);

    // Build multi-UOM structure if enabled
    const uomLevels: ProductUomLevel[] = hasMultiUom
      ? [
          {
            unit: higherUom,
            conversionRatio: Number(conversionRatio) || 24,
            priceRetail: Number(effHigherRetail) || 0,
            priceToko: Number(effHigherToko) || 0,
            pricePangkalan: Number(effHigherPangkalan) || 0,
            isDefault: false,
          },
        ]
      : [];

    const newProduct: ProductMasterItem = {
      id: skuCode.trim().toUpperCase(),
      sku: skuCode.trim().toUpperCase(),
      barcode: barcode.trim() ? barcode.trim() : skuCode.trim().toUpperCase(),
      name: name.trim(),
      category: resolvedCategory,
      parentCategory,
      brand: brand.trim() || '-',
      unit: resolvedUnit,
      packagingSize: packagingSize.trim() || undefined,
      stock: Number(stock) || 0,
      minStock: calculatedLimit || Number(minStock) || 0,
      reorderPoint: Number(reorderPoint) || (calculatedLimit * 1.25),
      hpp: Number(hpp) || 0,
      pricingScheme,
      flatPrice: pricingScheme === 'flat' ? Number(flatPrice) || 0 : undefined,
      pricePangkalan: Number(finalPangkalan) || 0,
      priceToko: Number(finalToko) || 0,
      priceRetail: Number(finalRetail) || 0,
      supplier: supplier.trim() || '-',
      warningMode,
      maxCapacity: Number(maxCapacity) || 500,
      warningThresholdValue: Number(warningThresholdValue) || (warningMode === 'percentage' ? 30 : 100),
      // Multi-UOM
      uomLevels: uomLevels.length > 0 ? uomLevels : undefined,
      selectedUom: baseUnit as any,
      // Consumables & Batch Tracking
      batchNumber: batchNumber.trim() || undefined,
      expiredDate: expiredDate.trim() || undefined,
      isConsumable,
    };

    onSaveProduct(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 [body.light-theme_&]:bg-white border-2 border-purple-500/60 [body.light-theme_&]:border-purple-300 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 [body.light-theme_&]:text-slate-900 border-t-[4px] border-t-purple-500">
        {/* Modal Header */}
        <div className="p-3.5 px-4 bg-slate-950/80 [body.light-theme_&]:bg-purple-50/80 border-b border-slate-800 [body.light-theme_&]:border-purple-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 [body.light-theme_&]:bg-purple-100 [body.light-theme_&]:text-purple-700 flex items-center justify-center text-sm font-bold border border-purple-400/40 shadow-[0_0_10px_rgba(168,85,247,0.35)]">
              <i className="fa-solid fa-boxes-packing"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900 leading-tight">
                {initialProduct ? `Edit Master SKU [${initialProduct.id}]` : 'Tambah Master Produk & SKU Multi-Distributor'}
              </h3>
              <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-500">
                Hub Terpadu: Air Minum Depo, FMCG Food/Non-Food &amp; Non-FMCG Durable
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-lg bg-slate-800 [body.light-theme_&]:bg-slate-100 text-slate-400 hover:text-white [body.light-theme_&]:hover:text-slate-900 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-xs">
          {/* SECTION 1: BAGIAN C: KATEGORI & UKURAN KEMASAN */}
          <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-purple-500/30 space-y-2.5">
            <label className="block text-[11px] font-black uppercase text-purple-300 [body.light-theme_&]:text-purple-800 tracking-wider">
              Bagian C: Kategori &amp; Ukuran Kemasan *
            </label>
            {/* 4 Tombol Tab Kategori Utama */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PARENT_CATEGORY_CONFIG.map((cat) => {
                const isActive = parentCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleParentCategoryChange(cat.id)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-400'
                        : 'bg-slate-900 [body.light-theme_&]:bg-white border-slate-800 [body.light-theme_&]:border-slate-300 text-slate-400 [body.light-theme_&]:text-slate-600 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <i className={`${cat.icon} text-sm ${isActive ? 'text-purple-300' : 'text-slate-500'}`}></i>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>}
                    </div>
                    <span className="font-extrabold text-[11px] mt-1 leading-snug">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 1 Kolom Input Teks Fleksibel Ukuran / Isi Kemasan (Opsional) */}
            <div className="pt-1">
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Ukuran / Isi Kemasan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Isi 24 botol, Netto 5 kg, 12 sachet, dll."
                value={packagingSize}
                onChange={(e) => setPackagingSize(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-purple-300 text-white [body.light-theme_&]:text-slate-900 font-medium focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
              />
            </div>

            {/* SKU & Barcode Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Kode SKU Internal (Unik) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: GLN-AQUA-19L, BTL-VIT-600"
                    value={skuCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSkuCode(val);
                      if (!barcode || barcode === skuCode) {
                        setBarcode(val);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 font-mono font-bold rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-purple-500/50 [body.light-theme_&]:border-purple-300 text-purple-300 [body.light-theme_&]:text-purple-800 focus:outline-none focus:border-purple-400 text-xs"
                  />
                  {!initialProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = parentCategory === 'AIR_MINUM' ? 'GLN' : parentCategory === 'FMCG_FOOD' ? 'FMC' : parentCategory === 'FMCG_NON_FOOD' ? 'HMC' : 'AST';
                        const rand = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
                        setSkuCode(rand);
                        setBarcode(rand);
                      }}
                      className="absolute right-1 top-1 bottom-1 px-1.5 rounded bg-slate-700 text-[9px] text-slate-300 hover:text-white cursor-pointer"
                      title="Acak / Re-generate SKU"
                    >
                      <i className="fa-solid fa-arrows-rotate"></i>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Barcode Scanner / EAN-13 (Unik)
                </label>
                <input
                  type="text"
                  placeholder="EAN-13 pabrik atau kode barcode scanner"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-mono font-bold rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-purple-300 text-cyan-300 [body.light-theme_&]:text-cyan-800 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
            </div>

            {/* Sub-Kategori Dropdown */}
            <div className="pt-1">
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Sub-Kategori Barang *
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-purple-300 text-white [body.light-theme_&]:text-slate-900 font-semibold focus:outline-none focus:border-purple-400 text-xs cursor-pointer"
              >
                {(currentCategoryConf?.subCategories || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="Lainnya">Kategori Lainnya (Input Manual)</option>
              </select>
                {subCategory === 'Lainnya' && (
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama sub-kategori baru..."
                    value={customSubCategory}
                    onChange={(e) => setCustomSubCategory(e.target.value)}
                    className="w-full mt-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-950 [body.light-theme_&]:bg-white border border-purple-400 text-purple-300 [body.light-theme_&]:text-purple-900 focus:outline-none"
                  />
                )}
              </div>
            </div>

          {/* SECTION 2: IDENTITAS BARANG */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Nama Produk / SKU Lengkap *
              </label>
              <input
                type="text"
                required
                placeholder="Cth: Beras Ramos 5kg, Minyak Goreng 2L, Sabun Cuci Piring 650ml, Pompa Galon Elektrik..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-purple-400 font-bold text-xs placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Merk / Brand
                </label>
                <input
                  type="text"
                  placeholder="Cth: Sania, Bimoli, Sunlight, Sanwa, Cosmos..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-purple-400 text-xs placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Supplier / Pabrik Pemasok
                </label>
                <input
                  type="text"
                  placeholder="Cth: PT Indofood, PT Unilever, Distributor Sembako Subang..."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-purple-400 text-xs placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: SATUAN PEMBELIAN & MULTI-UOM (BAGIAN B) */}
          <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-indigo-50/50 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase text-indigo-300 [body.light-theme_&]:text-indigo-800 tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-layer-group"></i>
                  <span>Bagian B: Satuan Pembelian &amp; Multi-UoM</span>
                </span>
                <p className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
                  Mendukung penjualan satuan ecer (Pcs/Tabung) maupun kemasan grosir (Dus/Karton/Bal)
                </p>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMultiUom}
                  onChange={(e) => setHasMultiUom(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                />
                <span className="text-[10.5px] font-bold text-indigo-300 [body.light-theme_&]:text-indigo-900">
                  Aktifkan Satuan Bertingkat
                </span>
              </label>
            </div>

            {/* Base Unit Selection (Universal Dropdown) */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Satuan Pembelian / Satuan Dasar (Bagian B) *
              </label>
              <select
                value={baseUnit}
                onChange={(e) => {
                  setBaseUnit(e.target.value);
                  setCustomBaseUnit('');
                }}
                className="w-full px-2.5 py-2 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-indigo-500/50 [body.light-theme_&]:border-indigo-300 text-indigo-300 [body.light-theme_&]:text-indigo-900 font-bold focus:outline-none focus:border-indigo-400 text-xs cursor-pointer"
              >
                {UNIVERSAL_PURCHASE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="Lainnya">Lainnya (Ketik Manual)</option>
              </select>
              {baseUnit === 'Lainnya' && (
                <input
                  type="text"
                  required
                  placeholder="Ketik nama satuan baru..."
                  value={customBaseUnit}
                  onChange={(e) => setCustomBaseUnit(e.target.value)}
                  className="w-full mt-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-950 [body.light-theme_&]:bg-white border border-indigo-400 text-indigo-300 [body.light-theme_&]:text-indigo-900 focus:outline-none"
                />
              )}
            </div>


            {/* Multi-UoM Fields if checked */}
            {hasMultiUom && (
              <div className="p-2.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-indigo-400/40 space-y-2.5 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-300 [body.light-theme_&]:text-indigo-800 mb-1">
                      Satuan Bertingkat (Grosir)
                    </label>
                    <select
                      value={higherUom}
                      onChange={(e) => setHigherUom(e.target.value as MultiUomType)}
                      className="w-full px-2 py-1.5 rounded bg-slate-800 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-bold"
                    >
                      <option value="Karton/Dus">Karton/Dus</option>
                      <option value="Bal">Bal</option>
                      <option value="Renceng">Renceng</option>
                      <option value="Pack">Pack</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-indigo-300 [body.light-theme_&]:text-indigo-800 mb-1">
                      Rasio Konversi (Isi per {higherUom})
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">1 {higherUom} =</span>
                      <input
                        type="number"
                        min="2"
                        value={conversionRatio}
                        onChange={(e) => setConversionRatio(Math.max(2, Number(e.target.value)))}
                        className="w-16 px-2 py-1.5 rounded bg-slate-800 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-cyan-300 font-mono font-black text-center"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">{baseUnit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-indigo-300 [body.light-theme_&]:text-indigo-800 mb-1">
                      Harga Jual Toko per {higherUom}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder={`Otomatis (${(finalToko * conversionRatio).toLocaleString('id-ID')})`}
                        value={higherPriceToko || ''}
                        onChange={(e) => setHigherPriceToko(Number(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded bg-slate-800 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300 text-amber-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between">
                  <span>💡 Kasir &amp; Delivery dapat memilih langsung transaksi dalam <strong>{baseUnit}</strong> atau <strong>{higherUom}</strong>.</span>
                  <span className="font-mono text-cyan-300 font-bold">1 {higherUom} = {conversionRatio} {baseUnit}</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: BATCH NUMBER & TANGGAL EXPIRED (FMCG CONSUMABLE) */}
          <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-amber-50/50 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-amber-300 [body.light-theme_&]:text-amber-800 tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-calendar-check"></i>
                <span>3. Batch No &amp; Tanggal Expired (FMCG &amp; Makanan)</span>
              </span>
              {isConsumable ? (
                <span className="px-2 py-0.5 rounded text-[8.5px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ✓ Barang Konsumsi
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[8.5px] font-mono bg-slate-800 text-slate-400">
                  Durable Goods
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Nomor Batch Produksi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Cth: BATCH-2026-X01, LOT-99A..."
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Tanggal Kedaluwarsa (Expired Date)
                </label>
                <input
                  type="date"
                  value={expiredDate}
                  onChange={(e) => setExpiredDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-amber-300 [body.light-theme_&]:text-amber-800 font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: SKEMA HARGA (MULTI-TIER / FLAT) */}
          <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-300 [body.light-theme_&]:text-slate-700 tracking-wider">
                4. Skema Harga Penjualan (Per {baseUnit})
              </span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPricingScheme('tier')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    pricingScheme === 'tier'
                      ? 'bg-purple-600 text-white font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Multi-Tier (3 Level)
                </button>
                <button
                  type="button"
                  onClick={() => setPricingScheme('flat')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    pricingScheme === 'flat'
                      ? 'bg-purple-600 text-white font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Harga Tunggal (Flat)
                </button>
              </div>
            </div>

            {/* HPP & JUAL */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-cyan-300 [body.light-theme_&]:text-indigo-800 mb-1">
                  HPP Tebus Modal (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={hpp}
                  onChange={(e) => setHpp(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-cyan-300 font-mono font-bold"
                />
              </div>

              {pricingScheme === 'flat' ? (
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-emerald-300 [body.light-theme_&]:text-emerald-800 mb-1">
                    Harga Jual Semua Pembeli (Flat Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={flatPrice}
                    onChange={(e) => setFlatPrice(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-emerald-300 font-mono font-bold"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                      Tier 1: Pangkalan
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={pricePangkalan}
                      onChange={(e) => setPricePangkalan(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-slate-200 [body.light-theme_&]:text-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-300 [body.light-theme_&]:text-amber-800 mb-1">
                      Tier 2: Toko
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={priceToko}
                      onChange={(e) => setPriceToko(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-amber-300 [body.light-theme_&]:text-amber-800 font-mono font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-300 [body.light-theme_&]:text-emerald-800 mb-1">
                      Tier 3: Eceran
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={priceRetail}
                      onChange={(e) => setPriceRetail(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-emerald-300 [body.light-theme_&]:text-emerald-800 font-mono font-bold"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 6: STOK & AMBANG TOLERANSI */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Stok Fisik Awal ({baseUnit}) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Kapasitas Maksimal Depo
              </label>
              <input
                type="number"
                min="10"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value) || 500)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-slate-200 [body.light-theme_&]:text-slate-900 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-rose-300 [body.light-theme_&]:text-rose-700 mb-1">
                Batas E-Warning Kritis ({warningMode === 'percentage' ? '%' : baseUnit})
              </label>
              <input
                type="number"
                min="1"
                value={warningThresholdValue}
                onChange={(e) => setWarningThresholdValue(Number(e.target.value) || 30)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-rose-500/50 [body.light-theme_&]:border-rose-300 text-rose-300 [body.light-theme_&]:text-rose-700 font-mono font-bold text-xs"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-black shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <i className="fa-solid fa-check"></i>
              <span>{initialProduct ? 'Simpan Perubahan SKU' : 'Simpan Master Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
