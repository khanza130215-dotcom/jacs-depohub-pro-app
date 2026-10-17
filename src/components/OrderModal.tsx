import React, { useState, useEffect } from 'react';
import { OrderItem, GallonOwnershipScheme, PriceTier, CommissionSchemeConfig, ArmadaItem } from '../types';
import { RECEIVABLES, DEFAULT_COMMISSION_CONFIG, ARMADA_LIST } from '../data/mockData';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (newOrder: OrderItem, andTransferToKasir?: boolean) => void;
  initialMode?: 'B2C' | 'B2B';
  commissionConfig?: CommissionSchemeConfig;
  armadaList?: ArmadaItem[];
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onAddOrder,
  initialMode = 'B2C',
  commissionConfig = DEFAULT_COMMISSION_CONFIG,
  armadaList = ARMADA_LIST,
}) => {
  const [orderMode, setOrderMode] = useState<'B2C' | 'B2B'>(initialMode);

  // Common fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('0812-');
  const [gallonScheme, setGallonScheme] = useState<GallonOwnershipScheme>('Tukar Galon');
  const [galonAqua, setGalonAqua] = useState<number>(initialMode === 'B2C' ? 2 : 30);
  const [galonLeMinerale, setGalonLeMinerale] = useState<number>(initialMode === 'B2C' ? 0 : 10);
  const [dusKemasan, setDusKemasan] = useState<number>(0);
  const [emptyGallonsReturned, setEmptyGallonsReturned] = useState<number>(initialMode === 'B2C' ? 2 : 30);
  const [paymentStatus, setPaymentStatus] = useState<OrderItem['paymentStatus']>('Lunas');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer / QRIS' | 'TEMPO BON TOKO'>('Tunai');
  const [driver, setDriver] = useState('Pak Bambang (Carry Pickup)');

  // B2C specific fields
  const [residentialBlok, setResidentialBlok] = useState('');
  const [residentialRtRw, setResidentialRtRw] = useState('');
  const [residentialPatokan, setResidentialPatokan] = useState('');

  // B2B specific fields
  const [b2bTierType, setB2bTierType] = useState<'Agen / Pangkalan' | 'Toko Kelontong' | 'Resto / Cafe'>('Toko Kelontong');

  // Synchronize when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderMode(initialMode);
      if (initialMode === 'B2C') {
        setGalonAqua(2);
        setGalonLeMinerale(0);
        setEmptyGallonsReturned(2);
        setDusKemasan(0);
        setPaymentStatus('Lunas');
      } else {
        setGalonAqua(30);
        setGalonLeMinerale(10);
        setEmptyGallonsReturned(30);
        setDusKemasan(5);
      }
    }
  }, [isOpen, initialMode]);

  const totalGalon = Number(galonAqua) + Number(galonLeMinerale);

  // Synchronize empty gallons return default when totalGalon or scheme changes
  useEffect(() => {
    if (gallonScheme === 'Tukar Galon') {
      setEmptyGallonsReturned(totalGalon);
    } else {
      setEmptyGallonsReturned(0);
    }
  }, [totalGalon, gallonScheme]);

  if (!isOpen) return null;

  // Pricing rules:
  // B2C is strictly locked to Eceran (Tier 3)
  // B2B uses Pangkalan (Tier 1) or Toko (Tier 2)
  const priceTier: PriceTier =
    orderMode === 'B2C'
      ? 'Eceran'
      : b2bTierType === 'Agen / Pangkalan'
      ? 'Pangkalan'
      : 'Toko';

  // Dynamic Prices according to Master Data Tier:
  // Eceran: Aqua 19L Rp 21.000 | Le Minerale 19L Rp 22.000 | Dus Rp 42.000
  // Toko: Aqua 19L Rp 19.500 | Le Minerale 19L Rp 20.500 | Dus Rp 40.000
  // Pangkalan: Aqua 19L Rp 18.500 | Le Minerale 19L Rp 19.500 | Dus Rp 38.000
  const priceAqua = priceTier === 'Pangkalan' ? 18500 : priceTier === 'Toko' ? 19500 : 21000;
  const priceLeMinerale = priceTier === 'Pangkalan' ? 19500 : priceTier === 'Toko' ? 20500 : 22000;
  const priceDus = priceTier === 'Pangkalan' ? 38000 : priceTier === 'Toko' ? 40000 : 42000;

  // Fee tabung baru vs deposit pinjam
  const feePerGallonUnit = gallonScheme === 'Beli Galon Baru' ? 45000 : gallonScheme === 'Pinjam Galon Depo' ? 35000 : 0;

  const waterSubtotal = Number(galonAqua) * priceAqua + Number(galonLeMinerale) * priceLeMinerale;
  const dusSubtotal = Number(dusKemasan) * priceDus;
  const extraGallonCost = totalGalon * feePerGallonUnit;
  const depositAmount = gallonScheme === 'Pinjam Galon Depo' ? extraGallonCost : undefined;
  const totalAmount = waterSubtotal + dusSubtotal + extraGallonCost;

  // Gallon Debt Calculation: Galon Terkirim vs Fisik Galon Kosong Diterima
  const calculatedGallonDebt =
    gallonScheme === 'Tukar Galon'
      ? Math.max(0, totalGalon - Number(emptyGallonsReturned))
      : gallonScheme === 'Pinjam Galon Depo'
      ? totalGalon
      : 0;

  // Credit Limit Warning Check from RECEIVABLES
  const matchedDebtor = RECEIVABLES.find((r) =>
    customerName.trim().length > 2 &&
    (r.customerName.toLowerCase().includes(customerName.toLowerCase()) ||
      customerName.toLowerCase().includes(r.customerName.toLowerCase()))
  );

  const hasCreditWarning =
    Boolean(orderMode === 'B2B' && matchedDebtor && (matchedDebtor.status === 'Lewat Tempo' || matchedDebtor.amount > 3000000 || matchedDebtor.gallonsLoaned > 15));

  const handleFormSubmit = (andTransferToKasir = false) => {
    if (!customerName.trim()) return;

    let residentialDetail = '';
    if (orderMode === 'B2C') {
      const parts = [
        residentialBlok ? `Blok/No: ${residentialBlok}` : null,
        residentialRtRw ? `RT/RW: ${residentialRtRw}` : null,
        residentialPatokan ? `Patokan: ${residentialPatokan}` : null,
      ].filter(Boolean);
      residentialDetail = parts.join(' • ');
    }

    const itemsDesc = [
      galonAqua > 0 ? `${galonAqua} Galon Aqua 19L` : null,
      galonLeMinerale > 0 ? `${galonLeMinerale} Galon Le Minerale` : null,
      dusKemasan > 0 ? `${dusKemasan} Dus Kemasan` : null,
      gallonScheme !== 'Tukar Galon' ? `[${gallonScheme}]` : null,
    ]
      .filter(Boolean)
      .join(', ');

    const newOrder: OrderItem = {
      id: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName,
      customerType: orderMode === 'B2C' ? 'Rumah Tangga' : b2bTierType,
      residentialDetail: orderMode === 'B2C' ? residentialDetail : undefined,
      gallonScheme,
      depositAmount,
      phone,
      items: itemsDesc || `${totalGalon} Galon Air Mineral`,
      totalGalon,
      totalAmount,
      paymentStatus: andTransferToKasir
        ? 'Lunas'
        : paymentMethod === 'TEMPO BON TOKO'
        ? 'Tempo / Hutang'
        : paymentStatus,
      paymentMethod: paymentMethod === 'TEMPO BON TOKO' ? 'TEMPO BON TOKO' : paymentMethod,
      deliveryStatus: andTransferToKasir ? 'Diproses' : 'Diproses',
      driver: orderMode === 'B2C' ? 'Kurir Motor Depo' : driver,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      emptyGallonsReturned: Number(emptyGallonsReturned),
      gallonDebt: calculatedGallonDebt,
      priceTier,
      creditWarning: hasCreditWarning,
      creditWarningNote: matchedDebtor ? `Tunggakan Rp ${matchedDebtor.amount.toLocaleString('id-ID')} (${matchedDebtor.status})` : undefined,
    };

    onAddOrder(newOrder, andTransferToKasir);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300">
        
        {/* Header with Mode Toggle & Clear Back Button */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0 [body.light-theme_&]:bg-sky-50/90 [body.light-theme_&]:border-sky-200">
          <div className="flex items-center gap-2.5">
            {/* Clear Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-slate-800 [body.light-theme_&]:hover:bg-sky-100 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Kembali ke Tabel Order"
            >
              <i className="fa-solid fa-arrow-left text-[11px]"></i>
              <span>Kembali</span>
            </button>

            <div className="h-6 w-px bg-slate-800 [body.light-theme_&]:bg-sky-200"></div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 leading-tight flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${orderMode === 'B2C' ? 'bg-emerald-400' : 'bg-cyan-400'}`}></span>
                  {orderMode === 'B2C' ? 'Form Order Rumah Tangga (B2C)' : 'Form Order Toko / Pangkalan (B2B)'}
                </h3>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  orderMode === 'B2C'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-800'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:text-sky-800'
                }`}>
                  {orderMode === 'B2C' ? 'Eceran Warga' : 'Grosir & Agen'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                {orderMode === 'B2C' 
                  ? 'Terkunci Otomatis: Tier Eceran (Aqua 19L Rp 21.000) • Detail Alamat Perumahan & Skema Galon'
                  : 'Multi-Tier (Pangkalan Rp 18.500 / Toko Rp 19.500) • Cek Limit Piutang & Hutang Tabung'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300">
            <button
              type="button"
              onClick={() => setOrderMode('B2C')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                orderMode === 'B2C'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-house-user mr-1 text-[10px]"></i>
              B2C Warga
            </button>
            <button
              type="button"
              onClick={() => setOrderMode('B2B')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                orderMode === 'B2B'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-store mr-1 text-[10px]"></i>
              B2B Grosir
            </button>
          </div>
        </div>

        {/* CREDIT WARNING NOTIFICATION BANNER FOR B2B */}
        {hasCreditWarning && matchedDebtor && (
          <div className="px-4 py-2 bg-rose-500/15 border-b border-rose-500/40 flex items-center justify-between text-xs text-rose-300 [body.light-theme_&]:bg-rose-50 [body.light-theme_&]:text-rose-800">
            <div className="flex items-center gap-2 font-bold">
              <i className="fa-solid fa-triangle-exclamation text-rose-400 text-sm animate-pulse"></i>
              <span>
                🚨 PERINGATAN LIMIT KREDIT: Toko memiliki saldo tempo Rp {matchedDebtor.amount.toLocaleString('id-ID')} ({matchedDebtor.status}) & pinjaman {matchedDebtor.gallonsLoaned} tabung!
              </span>
            </div>
            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-rose-500 text-white font-black">
              TAGIH TERLEBIH DAHULU
            </span>
          </div>
        )}

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFormSubmit(false);
          }}
          className="p-4 space-y-3 text-xs overflow-y-auto flex-1"
        >
          {/* ========================================================================= */}
          {/* SECTION 1: IDENTITAS PEMESAN & KLASIFIKASI */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                {orderMode === 'B2C' ? 'Nama Pemesan / Warga' : 'Nama Toko / Agen Pangkalan'} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={orderMode === 'B2C' ? 'Contoh: Bu Ratna (Blok C) / Bpk Irfan' : 'Contoh: Toko Berkah Jaya / Agen Sumber Air'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <i className="fa-brands fa-whatsapp absolute left-2.5 top-2 text-emerald-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="0812-3456-7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: B2C RESIDENTIAL DETAILS OR B2B TIER CLASSIFICATION */}
          {/* ========================================================================= */}
          {orderMode === 'B2C' ? (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 [body.light-theme_&]:bg-emerald-50/60 [body.light-theme_&]:border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-300 [body.light-theme_&]:text-emerald-900 text-[11px] flex items-center gap-1.5">
                  <i className="fa-solid fa-map-location-dot text-emerald-400"></i>
                  Detail Alamat Pengantaran Residensial / Perumahan
                </span>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800">
                  🔒 Terkunci: Tier Eceran (Aqua Rp 21.000)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 mb-0.5">
                    Blok / Cluster / No. Rumah <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Cluster Bougenville Blok B-14 No. 05"
                    value={residentialBlok}
                    onChange={(e) => setResidentialBlok(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-emerald-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 [body.light-theme_&]:bg-white [body.light-theme_&]:border-emerald-300 [body.light-theme_&]:text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 mb-0.5">
                    RT / RW & Kelurahan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: RT 03 / RW 07, Kel. Mekar Jaya"
                    value={residentialRtRw}
                    onChange={(e) => setResidentialRtRw(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-emerald-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 [body.light-theme_&]:bg-white [body.light-theme_&]:border-emerald-300 [body.light-theme_&]:text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 mb-0.5">
                  Patokan Rumah / Catatan Pengantaran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pagar hitam depan lapangan basket / bel rumah sebelah kanan"
                  value={residentialPatokan}
                  onChange={(e) => setResidentialPatokan(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-emerald-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 [body.light-theme_&]:bg-white [body.light-theme_&]:border-emerald-300 [body.light-theme_&]:text-slate-900 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 [body.light-theme_&]:bg-sky-50/70 [body.light-theme_&]:border-sky-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-cyan-300 [body.light-theme_&]:text-sky-900 text-[11px] flex items-center gap-1.5">
                  <i className="fa-solid fa-tags text-cyan-400"></i>
                  Klasifikasi Harga Grosir B2B
                </span>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Level: Tier {priceTier} (Aqua Rp {priceAqua.toLocaleString('id-ID')})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['Agen / Pangkalan', 'Toko Kelontong', 'Resto / Cafe'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setB2bTierType(tier)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      b2bTierType === tier
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 [body.light-theme_&]:text-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs text-cyan-400 [body.light-theme_&]:text-sky-700">
                      {tier === 'Agen / Pangkalan' ? 'Tier 1 (Pangkalan)' : tier === 'Toko Kelontong' ? 'Tier 2 (Toko Warung)' : 'Tier 2 (Komersial/Resto)'}
                    </div>
                    <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5">
                      Aqua 19L: Rp {tier === 'Agen / Pangkalan' ? '18.500' : '19.500'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: 3 SKEMA KEPEMILIKAN TABUNG GALON 19L */}
          {/* ========================================================================= */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-sky-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 [body.light-theme_&]:text-slate-800 text-[10.5px] uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-bottle-water text-cyan-400"></i>
                Skema Kepemilikan Tabung Galon 19L
              </span>
              <span className="text-[10px] text-cyan-400 [body.light-theme_&]:text-sky-600 font-semibold">Tukar / Beli Baru / Pinjam Depo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div
                onClick={() => setGallonScheme('Tukar Galon')}
                className={`p-2 rounded-lg border cursor-pointer transition-all ${
                  gallonScheme === 'Tukar Galon'
                    ? 'bg-sky-500/15 border-sky-400 text-white shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-sky-400 [body.light-theme_&]:text-sky-600">1. Tukar Galon</span>
                  <i className="fa-solid fa-arrows-rotate text-xs text-sky-400 [body.light-theme_&]:text-sky-600"></i>
                </div>
                <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5">
                  Isi ulang biasa. Wajib serahkan tabung kosong.
                </div>
              </div>

              <div
                onClick={() => setGallonScheme('Beli Galon Baru')}
                className={`p-2 rounded-lg border cursor-pointer transition-all ${
                  gallonScheme === 'Beli Galon Baru'
                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-400 [body.light-theme_&]:text-emerald-600">2. Beli Baru (+Rp 45rb)</span>
                  <i className="fa-solid fa-cart-plus text-xs text-emerald-400 [body.light-theme_&]:text-emerald-600"></i>
                </div>
                <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5">
                  Tabung baru jadi hak milik pembeli.
                </div>
              </div>

              <div
                onClick={() => setGallonScheme('Pinjam Galon Depo')}
                className={`p-2 rounded-lg border cursor-pointer transition-all ${
                  gallonScheme === 'Pinjam Galon Depo'
                    ? 'bg-violet-500/15 border-violet-400 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 [body.light-theme_&]:text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-violet-400 [body.light-theme_&]:text-violet-600">3. Pinjam Depo (+Rp 35rb)</span>
                  <i className="fa-solid fa-hand-holding-hand text-xs text-violet-400 [body.light-theme_&]:text-violet-600"></i>
                </div>
                <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5">
                  Aset depo dipinjam dengan uang jaminan deposit.
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: JUMLAH ITEM PESANAN */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Aqua 19L (Rp {priceAqua.toLocaleString('id-ID')})
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={galonAqua}
                  onChange={(e) => setGalonAqua(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-sm [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-slate-900"
                />
                <span className="text-[11px] text-slate-400">Galon</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Le Minerale 19L (Rp {priceLeMinerale.toLocaleString('id-ID')})
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={galonLeMinerale}
                  onChange={(e) => setGalonLeMinerale(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-sm [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-slate-900"
                />
                <span className="text-[11px] text-slate-400">Galon</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Kemasan Dus (Rp {priceDus.toLocaleString('id-ID')})
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={dusKemasan}
                  onChange={(e) => setDusKemasan(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-sm [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-slate-900"
                />
                <span className="text-[11px] text-slate-400">Dus</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: SERAH TABUNG KOSONG & PENGIRIMAN */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gallonScheme === 'Tukar Galon' && (
              <div>
                <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                  Galon Kosong Diterima Kembali
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={emptyGallonsReturned}
                    onChange={(e) => setEmptyGallonsReturned(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-slate-900"
                  />
                  {calculatedGallonDebt > 0 && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-1 rounded border border-rose-500/40 shrink-0">
                      Hutang: {calculatedGallonDebt} Tabung
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                {orderMode === 'B2C' ? 'Petugas Antar / Kurir' : 'Armada & Supir/Rider Pengirim'}
              </label>
              {orderMode === 'B2C' ? (
                <select
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-400 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-slate-900 font-semibold"
                >
                  <option value="Rudi Hartono (Motor Roda Tiga Viar - B 6124 KRO)">🛵 Rudi Hartono (Motor Roda Tiga Viar - B 6124 KRO)</option>
                  <option value="Samsul Arifin (Motor Roda Tiga Viar - B 6789 VTR)">🛵 Samsul Arifin (Motor Roda Tiga Viar - B 6789 VTR)</option>
                  <option value="Kurir Motor Cepat Depo">🏍️ Kurir Motor Cepat Depo (Siap Antar Kilat)</option>
                </select>
              ) : (
                <select
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-400 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-slate-900"
                >
                  <option value="Pak Bambang (Carry Pickup)">Pak Bambang (Carry Pickup - B 9421 KDA - 90 Galon)</option>
                  <option value="Rudi Hartono (Motor Roda 3 Viar)">🛵 Rudi Hartono (Motor Roda Tiga Viar - B 6124 KRO - 25 Galon)</option>
                  <option value="Samsul Arifin (Motor Roda 3 Viar)">🛵 Samsul Arifin (Motor Roda Tiga Viar - B 6789 VTR - 20 Galon)</option>
                  <option value="Rian Prasetyo (Gran Max)">Rian Prasetyo (Gran Max - B 9104 UCN - 110 Galon)</option>
                  <option value="Hendra Gunawan (Mega Carry)">Hendra Gunawan (Mega Carry - B 9872 ZAF - 90 Galon)</option>
                  <option value="Dedi Kurniawan (Truk Canter)">Dedi Kurniawan (Truk Canter - B 9033 TCA - 320 Galon)</option>
                </select>
              )}
            </div>
          </div>

          {/* METODE PEMBAYARAN ORDER */}
          <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-sky-50/60 border border-slate-800 [body.light-theme_&]:border-sky-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-slate-300 [body.light-theme_&]:text-slate-800 flex items-center gap-1.5">
                <i className="fa-solid fa-credit-card text-amber-400"></i>
                <span>Metode Pembayaran Pesanan:</span>
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                paymentMethod === 'TEMPO BON TOKO'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {paymentMethod === 'TEMPO BON TOKO' ? '⏳ Tempo 7 Hari' : '✅ Lunas Kas'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('Tunai');
                  setPaymentStatus('Lunas');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  paymentMethod === 'Tunai'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 font-black'
                    : 'bg-slate-900 [body.light-theme_&]:bg-white text-slate-400 [body.light-theme_&]:text-slate-700 border-slate-800 [body.light-theme_&]:border-slate-300'
                }`}
              >
                💵 Tunai (Lunas)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('Transfer / QRIS');
                  setPaymentStatus('Lunas');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  paymentMethod === 'Transfer / QRIS'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-black'
                    : 'bg-slate-900 [body.light-theme_&]:bg-white text-slate-400 [body.light-theme_&]:text-slate-700 border-slate-800 [body.light-theme_&]:border-slate-300'
                }`}
              >
                📲 Transfer / QRIS
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('TEMPO BON TOKO');
                  setPaymentStatus('Tempo / Hutang');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                  paymentMethod === 'TEMPO BON TOKO'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-900 [body.light-theme_&]:bg-white text-slate-400 [body.light-theme_&]:text-slate-700 border-slate-800 [body.light-theme_&]:border-slate-300'
                }`}
              >
                💳 TEMPO BON TOKO
              </button>
            </div>

            {paymentMethod === 'TEMPO BON TOKO' && (
              <p className="text-[10px] text-amber-300/90 leading-tight pt-0.5">
                ⚡ Otomatis membukukan entri kartu piutang baru (Termin 7 hari, status BELUM LUNAS) saat pesanan disetujui / diproses.
              </p>
            )}
          </div>

          {/* ESTIMASI KOMISI BERJENJANG PENGIRIMAN (25% SALESMAN VS 75% KURIR) */}
          {(() => {
            const activeCfg = commissionConfig || DEFAULT_COMMISSION_CONFIG;
            const galonCount = totalGalon;
            const dusCount = Number(dusKemasan) || 0;
            const baseGalon = galonCount * activeCfg.gallonBaseRate;
            const baseDus = dusCount * activeCfg.bottleBaseRate;
            const totalBase = baseGalon + baseDus;
            const salesComm = Math.round(totalBase * (activeCfg.salesmanSharePercent / 100));
            const courierComm = Math.round(totalBase * (activeCfg.courierSharePercent / 100));

            return (
              <div className="p-2.5 px-3 rounded-xl bg-purple-950/30 [body.light-theme_&]:bg-purple-50/70 border border-purple-500/30 [body.light-theme_&]:border-purple-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-300 [body.light-theme_&]:text-purple-900 flex items-center gap-1.5 text-[11px]">
                    <i className="fa-solid fa-percent text-amber-400"></i>
                    Estimasi Hak Komisi Berjenjang Order Ini:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Dasar: Rp {totalBase.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 [body.light-theme_&]:bg-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-300 [body.light-theme_&]:text-amber-800 font-bold">💼 Salesman ({activeCfg.salesmanSharePercent}%):</span>
                      <div className="text-[9.5px] text-slate-400">Order Taker</div>
                    </div>
                    <span className="font-mono font-black text-amber-300 [body.light-theme_&]:text-amber-800 text-xs">
                      Rp {salesComm.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 [body.light-theme_&]:bg-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-300 [body.light-theme_&]:text-emerald-800 font-bold">🛵 Kurir/Viar ({activeCfg.courierSharePercent}%):</span>
                      <div className="text-[9.5px] text-slate-400">Pengantar Fisik</div>
                    </div>
                    <span className="font-mono font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 text-xs">
                      Rp {courierComm.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500 flex items-center justify-between pt-0.5">
                  <span>* Galon: Rp {activeCfg.gallonBaseRate}/tbg • Dus: Rp {activeCfg.bottleBaseRate}/dus</span>
                  <span className="text-emerald-400 [body.light-theme_&]:text-emerald-700 font-semibold">✓ Sinkron otomatis dengan SDM & HR</span>
                </div>
              </div>
            );
          })()}

          {/* TOTAL SUMMARY BANNER */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 [body.light-theme_&]:bg-sky-50/80 [body.light-theme_&]:border-sky-200 flex items-center justify-between">
            <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">
              <div>Subtotal Air: Rp {waterSubtotal.toLocaleString('id-ID')} | Dus: Rp {dusSubtotal.toLocaleString('id-ID')}</div>
              {extraGallonCost > 0 && (
                <div className="text-amber-400 font-semibold">
                  + Biaya {gallonScheme === 'Pinjam Galon Depo' ? 'Deposit Pinjam' : 'Beli Tabung Baru'}: Rp {extraGallonCost.toLocaleString('id-ID')}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold">Total Nilai Order:</span>
              <div className="text-lg font-black text-cyan-400 [body.light-theme_&]:text-sky-700 font-mono leading-none mt-0.5">
                Rp {totalAmount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-2 border-t border-slate-800 [body.light-theme_&]:border-sky-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Prominent Kembali Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:bg-white [body.light-theme_&]:text-slate-700 [body.light-theme_&]:hover:bg-slate-100 font-bold text-xs cursor-pointer shadow-sm transition-all"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Kembali</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Special B2C Direct Transfer to Kasir POS */}
              {orderMode === 'B2C' && (
                <button
                  type="button"
                  onClick={() => handleFormSubmit(true)}
                  className="px-3.5 py-1.5 rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 font-extrabold text-xs shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer flex items-center gap-1.5 transition-all"
                  title="Simpan order dan langsung buka di kasir POS untuk pembayaran langsung"
                >
                  <i className="fa-solid fa-cash-register"></i>
                  <span>Simpan & Bayar di POS</span>
                </button>
              )}

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 font-black text-xs shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <i className="fa-solid fa-check"></i>
                <span>Simpan Order</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
