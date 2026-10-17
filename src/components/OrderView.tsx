import React, { useState } from 'react';
import { OrderItem, GallonOwnershipScheme, ArmadaItem } from '../types';
import { SpotOrderApprovalModal } from './SpotOrderApprovalModal';
import { ThermalReceiptModal, sendWhatsAppReceipt } from './ThermalReceiptModal';

interface OrderViewProps {
  orders: OrderItem[];
  onOpenOrderModal: (mode?: 'B2C' | 'B2B') => void;
  onUpdateDeliveryStatus: (orderId: string, status: OrderItem['deliveryStatus']) => void;
  onTransferToKasir?: (order: OrderItem) => void;
  armadaList?: ArmadaItem[];
  onApproveDriverOrder?: (orderId: string) => void;
  onScheduleNextDrop?: (orderId: string) => void;
}

export const OrderView: React.FC<OrderViewProps> = ({
  orders,
  onOpenOrderModal,
  onUpdateDeliveryStatus,
  onTransferToKasir,
  armadaList = [],
  onApproveDriverOrder,
  onScheduleNextDrop,
}) => {
  const [filter, setFilter] = useState<string>('Semua');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('Semua');
  const [schemeFilter, setSchemeFilter] = useState<string>('Semua');
  const [search, setSearch] = useState('');
  const [printedSlipOrder, setPrintedSlipOrder] = useState<OrderItem | null>(null);
  const [thermalReceiptOrder, setThermalReceiptOrder] = useState<OrderItem | null>(null);
  const [showSpotApprovalModal, setShowSpotApprovalModal] = useState<boolean>(false);
  const [preselectedSpotOrderId, setPreselectedSpotOrderId] = useState<string | null>(null);

  const pendingApprovals = orders.filter((o) => o.deliveryStatus === 'MENUNGGU_APPROVAL_ADMIN');
  const nextDropOrders = orders.filter((o) => o.deliveryStatus === 'JADWAL_DROP_BERIKUTNYA');

  const filteredOrders = orders.filter((ord) => {
    const matchesFilter = filter === 'Semua' ? true : ord.deliveryStatus === filter;
    const matchesCustType = customerTypeFilter === 'Semua' ? true : ord.customerType === customerTypeFilter;
    const matchesScheme = schemeFilter === 'Semua' ? true : (ord.gallonScheme || 'Tukar Galon') === schemeFilter;
    const matchesSearch =
      ord.customerName.toLowerCase().includes(search.toLowerCase()) ||
      ord.id.toLowerCase().includes(search.toLowerCase()) ||
      ord.driver.toLowerCase().includes(search.toLowerCase()) ||
      (ord.residentialDetail && ord.residentialDetail.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesCustType && matchesScheme && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden [body.light-theme_&]:text-slate-800">
      {/* Top Banner & Control Bar with 2 Distinct Order Buttons */}
      <div className="glass-panel p-2.5 px-3.5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-sm">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5 leading-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Pelayanan Order & Surat Jalan
          </h3>
        </div>

        {/* 2 SEPARATE ORDER BUTTONS (B2C vs B2B) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-order-b2c"
            onClick={() => onOpenOrderModal('B2C')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
            title="Buka form input pesanan eceran warga perumahan (Tier Eceran Rp 21.000)"
          >
            <i className="fa-solid fa-house-chimney text-xs"></i>
            <span>+ Order Rumah Tangga (B2C)</span>
          </button>

          <button
            id="btn-order-b2b"
            onClick={() => onOpenOrderModal('B2B')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 shadow-[0_0_12px_rgba(0,229,255,0.4)] transition-all cursor-pointer"
            title="Buka form input pesanan grosir pangkalan/toko (Tier 1/Tier 2 & Limit Tempo)"
          >
            <i className="fa-solid fa-store text-xs"></i>
            <span>+ Order Toko / Pangkalan (B2B)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs, Customer Filter, Scheme Filter & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status Tab */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-200 text-[11px] font-bold overflow-x-auto">
            <button
              onClick={() => setFilter('Semua')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                filter === 'Semua'
                  ? 'bg-cyan-500/20 text-cyan-300 [body.light-theme_&]:bg-white [body.light-theme_&]:text-cyan-800 [body.light-theme_&]:shadow-sm border border-cyan-400/40'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white [body.light-theme_&]:hover:text-slate-900'
              }`}
            >
              Semua
            </button>

            {/* Tab Khusus: Menunggu Approval Admin */}
            <button
              onClick={() => setFilter('MENUNGGU_APPROVAL_ADMIN')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filter === 'MENUNGGU_APPROVAL_ADMIN'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-400 font-extrabold shadow-sm'
                  : pendingApprovals.length > 0
                  ? 'text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⏳ Menunggu Approval</span>
              {pendingApprovals.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 animate-pulse">
                  {pendingApprovals.length}
                </span>
              )}
            </button>

            {/* Tombol Cepat Buka Modal Approval Spot */}
            {pendingApprovals.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPreselectedSpotOrderId(null);
                  setShowSpotApprovalModal(true);
                }}
                className="px-2 py-1 rounded-md bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-[10px] cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.4)] active:scale-95 flex items-center gap-1"
                title="Buka Modal Approval Order Lapangan / Spot Supir"
              >
                <span>⚡ Modal Approval ({pendingApprovals.length})</span>
              </button>
            )}

            {/* Tab Khusus: Jadwal Drop Berikutnya */}
            <button
              onClick={() => setFilter('JADWAL_DROP_BERIKUTNYA')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filter === 'JADWAL_DROP_BERIKUTNYA'
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400 font-extrabold shadow-sm'
                  : nextDropOrders.length > 0
                  ? 'text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📅 Drop Besok</span>
              {nextDropOrders.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-500 text-white">
                  {nextDropOrders.length}
                </span>
              )}
            </button>

            {(['Diproses', 'Dalam Pengiriman', 'Terkirim'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  filter === tab
                    ? 'bg-cyan-500/20 text-cyan-300 [body.light-theme_&]:bg-white [body.light-theme_&]:text-cyan-800 [body.light-theme_&]:shadow-sm border border-cyan-400/40'
                    : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white [body.light-theme_&]:hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Customer Type Dropdown */}
          <select
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 text-[11px] font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="Semua">Semua Segmen</option>
            <option value="Agen / Pangkalan">B2B - Agen / Pangkalan</option>
            <option value="Toko Kelontong">B2B - Toko Kelontong</option>
            <option value="Resto / Cafe">B2B - Resto / Cafe</option>
            <option value="Rumah Tangga">B2C - Rumah Tangga</option>
          </select>

          {/* Scheme Filter */}
          <select
            value={schemeFilter}
            onChange={(e) => setSchemeFilter(e.target.value)}
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 text-[11px] font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="Semua">Semua Skema</option>
            <option value="Tukar Galon">Tukar Galon</option>
            <option value="Beli Galon Baru">Beli Baru</option>
            <option value="Pinjam Galon Depo">Pinjam Depo</option>
          </select>
        </div>

        <div className="relative w-full sm:w-56">
          <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]"></i>
          <input
            type="text"
            placeholder="Cari toko, driver, blok/RT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 text-[11px] text-white [body.light-theme_&]:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* 4. DEDICATED PANEL: ANTREAN APPROVAL ORDER SUPIR (VERIFIKASI ADMIN) */}
      {pendingApprovals.length > 0 && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/50 shadow-md space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔔 Antrean Approval Order Supir (Spot Kanvasing)</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 font-mono text-[10px]">
                  {pendingApprovals.length} Menunggu Persetujuan
                </span>
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">
              Verifikasi stok muatan armada supir sebelum disetujui
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {pendingApprovals.map((ord) => {
              const driverArmada = armadaList?.find(
                (a) =>
                  (ord.vehicleId && a.id === ord.vehicleId) ||
                  (ord.assignedDriverId && a.id === ord.assignedDriverId) ||
                  a.driverName.toLowerCase().includes(ord.driver.toLowerCase().split(' ')[0]) ||
                  (ord.driver && a.driverName.toLowerCase().includes(ord.driver.toLowerCase()))
              );
              const currentLoad = driverArmada?.currentLoad ?? 0;
              const isStockSufficient = currentLoad >= ord.totalGalon;
              const shortage = Math.max(0, ord.totalGalon - currentLoad);

              return (
                <div
                  key={ord.id}
                  className="p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/30 flex flex-col justify-between gap-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-amber-400 text-xs">#{ord.id}</span>
                        <span className="font-extrabold text-white text-xs truncate">{ord.customerName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {ord.customerType}
                        </span>
                        {ord.priceTier && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-950 text-purple-300 border border-purple-800">
                            🔒 Tier {ord.priceTier}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 truncate">
                        📦 {ord.items} • <strong className="text-amber-200">Total {ord.totalGalon} Galon</strong> •{' '}
                        <span className="font-mono text-emerald-300 font-bold">
                          Rp {ord.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <i className="fa-solid fa-truck text-[9px] text-slate-500"></i>
                        <span>Supir: <strong className="text-slate-200">{ord.driver}</strong></span>
                        {driverArmada && (
                          <span className="text-slate-400 font-mono">({driverArmada.vehicleType})</span>
                        )}
                      </div>
                    </div>

                    {/* Stock comparison badge */}
                    <div className="text-right shrink-0">
                      {isStockSufficient ? (
                        <div className="px-2 py-1 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-[9.5px]">
                          <span className="text-emerald-300 font-extrabold block">
                            ✅ Stok Cukup
                          </span>
                          <span className="text-[9px] text-emerald-400 font-mono">
                            Muatan: {currentLoad} Gln
                          </span>
                        </div>
                      ) : (
                        <div className="px-2 py-1 rounded-md bg-rose-950/70 border border-rose-500/40 text-[9.5px]">
                          <span className="text-rose-300 font-extrabold block">
                            ⚠️ Stok Kurang ({shortage} Gln)
                          </span>
                          <span className="text-[9px] text-rose-400 font-mono">
                            Muatan: {currentLoad} / {ord.totalGalon} Gln
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onScheduleNextDrop?.(ord.id)}
                      className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 cursor-pointer transition-all flex items-center gap-1"
                      title="Alihkan kekurangan armada supir ke Jadwal Drop Besok dari stok depo"
                    >
                      <i className="fa-solid fa-calendar-days text-[9px]"></i>
                      <span>📅 Drop Besok (Stok Depo)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onApproveDriverOrder?.(ord.id)}
                      className="px-3 py-1 rounded-md text-[10px] font-black bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-sm cursor-pointer transition-all flex items-center gap-1 active:scale-95"
                      title={
                        isStockSufficient
                          ? 'Setujui pesanan (stok armada supir terpotong & berstatus selesai/lunas)'
                          : 'Stok armada supir kurang, sistem otomatis mengalihkan kekurangan ke Drop Besok'
                      }
                    >
                      <i className="fa-solid fa-check text-[9px]"></i>
                      <span>✅ Setujui</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders Table - Internal Scroll Only */}
      <div className="flex-1 min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900/95 [body.light-theme_&]:bg-slate-100/95 backdrop-blur-md z-10">
              <tr className="border-b border-slate-800 [body.light-theme_&]:border-slate-200 text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase tracking-wider">
                <th className="py-1.5 px-2.5">No. Order</th>
                <th className="py-1.5 px-2.5">Pelanggan & Alamat</th>
                <th className="py-1.5 px-2.5">Skema Galon</th>
                <th className="py-1.5 px-2.5">Rincian Muatan Air</th>
                <th className="py-1.5 px-2.5">Total Nilai</th>
                <th className="py-1.5 px-2.5">Status Bayar</th>
                <th className="py-1.5 px-2.5">Pengiriman</th>
                <th className="py-1.5 px-2.5">Armada</th>
                <th className="py-1.5 px-2.5 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada order yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const scheme = ord.gallonScheme || 'Tukar Galon';
                  return (
                    <tr key={ord.id} className="hover:bg-slate-900/50 [body.light-theme_&]:hover:bg-slate-50 transition-colors">
                      <td className="py-1.5 px-2.5 font-mono font-bold text-cyan-400 [body.light-theme_&]:text-cyan-700 text-[11px]">
                        {ord.id}
                        <div className="text-[9px] text-slate-500 font-sans font-normal">{ord.time}</div>
                      </td>

                      <td className="py-1.5 px-2.5 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white [body.light-theme_&]:text-slate-900 text-xs">
                            {ord.customerName}
                          </span>
                          {ord.creditWarning && (
                            <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[8.5px] font-black" title="Peringatan Limit Kredit">
                              ⚠️ OVER LIMIT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 flex items-center gap-1 mt-0.2">
                          <i className="fa-brands fa-whatsapp text-emerald-400 text-[10px]"></i>
                          <span>{ord.phone}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-300 [body.light-theme_&]:text-slate-700">{ord.customerType}</span>
                          {ord.priceTier && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {ord.priceTier}
                            </span>
                          )}
                        </div>

                        {/* RESIDENTIAL ADDRESS BADGE IF PRESENT */}
                        {ord.residentialDetail && (
                          <div className="mt-1 p-1 rounded-md bg-cyan-950/40 border border-cyan-500/25 [body.light-theme_&]:bg-cyan-50 [body.light-theme_&]:border-cyan-200 text-[9.5px] text-cyan-300 [body.light-theme_&]:text-cyan-800 flex items-start gap-1">
                            <i className="fa-solid fa-location-dot text-cyan-400 mt-0.5 text-[8.5px]"></i>
                            <span className="leading-tight truncate">{ord.residentialDetail}</span>
                          </div>
                        )}
                      </td>

                      {/* 3 SKEMA KEPEMILIKAN BADGE */}
                      <td className="py-1.5 px-2.5">
                        {scheme === 'Tukar Galon' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-300 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:text-sky-700 border border-sky-500/30">
                            <i className="fa-solid fa-arrows-rotate text-[7px]"></i> Tukar
                          </span>
                        ) : scheme === 'Beli Galon Baru' ? (
                          <span className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-700 border border-emerald-500/30">
                              <i className="fa-solid fa-cart-plus text-[7px]"></i> Beli Baru
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/15 text-violet-300 [body.light-theme_&]:bg-violet-50 [body.light-theme_&]:text-violet-700 border border-violet-500/30">
                              <i className="fa-solid fa-hand-holding-hand text-[7px]"></i> Pinjam Depo
                            </span>
                            {ord.depositAmount ? (
                              <span className="text-[8.5px] font-mono font-semibold text-violet-400 [body.light-theme_&]:text-violet-600">
                                Dep: Rp {ord.depositAmount.toLocaleString('id-ID')}
                              </span>
                            ) : null}
                          </span>
                        )}
                      </td>

                      <td className="py-1.5 px-2.5">
                        <div className="text-slate-200 [body.light-theme_&]:text-slate-800 font-medium text-[11px] truncate max-w-[150px]">
                          {ord.items}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[9.5px] text-cyan-400 [body.light-theme_&]:text-cyan-700 font-semibold">
                            Total {ord.totalGalon} Galon
                          </span>
                          {ord.gallonDebt && ord.gallonDebt > 0 ? (
                            <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[8.5px] font-bold">
                              +{ord.gallonDebt} Hutang Tabung
                            </span>
                          ) : null}
                          {ord.isSpotSale && (
                            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800 border border-amber-500/40 text-[8px] font-bold flex items-center gap-0.5">
                              <i className="fa-solid fa-bolt text-[7px]"></i> Spot Kanvas
                            </span>
                          )}
                          {ord.damagedItemsNote && (
                            <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-800 border border-rose-500/40 text-[8px] font-bold" title={ord.damagedItemsNote}>
                              ⚠️ Retur: {ord.damagedItemsNote}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-1.5 px-2.5">
                        <div className="font-bold text-slate-100 [body.light-theme_&]:text-slate-900 font-mono text-xs">
                          Rp {ord.totalAmount.toLocaleString('id-ID')}
                        </div>
                      </td>

                      <td className="py-1.5 px-2.5">
                        {ord.paymentStatus === 'Lunas' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:bg-emerald-50 border border-emerald-500/30 [body.light-theme_&]:border-emerald-300">
                            <i className="fa-solid fa-circle-check text-[8px]"></i> Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 [body.light-theme_&]:text-amber-800 [body.light-theme_&]:bg-amber-50 border border-amber-500/30 [body.light-theme_&]:border-amber-300">
                            <i className="fa-solid fa-clock text-[8px]"></i> Tempo
                          </span>
                        )}
                      </td>

                      <td className="py-1.5 px-2.5">
                        {ord.deliveryStatus === 'MENUNGGU_APPROVAL_ADMIN' ? (
                          <div className="flex flex-col gap-1 items-start">
                            <button
                              type="button"
                              onClick={() => {
                                setPreselectedSpotOrderId(ord.id);
                                setShowSpotApprovalModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-black bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                              title="Buka Modal Peninjauan & Validasi Muatan Armada"
                            >
                              <span>⚡ Tinjau Approval</span>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onApproveDriverOrder?.(ord.id)}
                                className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[8.5px] cursor-pointer"
                                title="Setujui order (potong muatan armada supir & jadikan SELESAI)"
                              >
                                ✅ Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => onScheduleNextDrop?.(ord.id)}
                                className="px-1.5 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold text-[8.5px] cursor-pointer"
                                title="Alihkan kekurangan ke Drop Besok dari depo"
                              >
                                📅 Drop
                              </button>
                            </div>
                          </div>
                        ) : ord.deliveryStatus === 'SELESAI' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                            ✅ Selesai (Spot)
                          </span>
                        ) : ord.deliveryStatus === 'JADWAL_DROP_BERIKUTNYA' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/40 whitespace-nowrap">
                            📅 Drop Besok (Depo)
                          </span>
                        ) : (
                          <select
                            value={ord.deliveryStatus}
                            onChange={(e) =>
                              onUpdateDeliveryStatus(ord.id, e.target.value as OrderItem['deliveryStatus'])
                            }
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md border bg-slate-900 [body.light-theme_&]:bg-white cursor-pointer focus:outline-none ${
                                ord.deliveryStatus === 'Dalam Pengiriman' || ord.deliveryStatus === 'DIANTAR'
                                ? 'text-sky-400 [body.light-theme_&]:text-sky-700 border-sky-500/40'
                                 : ord.deliveryStatus === 'Terkirim'
                                ? 'text-emerald-400 [body.light-theme_&]:text-emerald-700 border-emerald-500/40'
                                : ord.deliveryStatus === 'MENUNGGU_DRIVER'
                                ? 'text-amber-400 [body.light-theme_&]:text-amber-700 border-amber-500/40 bg-amber-950/20'
                                : 'text-slate-400 [body.light-theme_&]:text-slate-700 border-slate-500/40'
                            }`}
                          >
                            <option value="MENUNGGU_DRIVER">📡 Antrean Driver</option>
                            <option value="DIANTAR">🚚 Sedang Diantar</option>
                            <option value="Diproses">⏳ Diproses</option>
                            <option value="Dalam Pengiriman">🚚 Jalan</option>
                            <option value="Terkirim">✅ Terkirim</option>
                            <option value="SELESAI">✅ Selesai</option>
                            <option value="MENUNGGU_APPROVAL_ADMIN">⏳ Menunggu Approval</option>
                            <option value="JADWAL_DROP_BERIKUTNYA">📅 Drop Besok (Depo)</option>
                          </select>
                        )}
                      </td>

                      <td className="py-1.5 px-2.5">
                        <div className="font-semibold text-slate-200 [body.light-theme_&]:text-slate-800 text-[11px] truncate max-w-[100px]">
                          {ord.driver}
                        </div>
                      </td>

                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {/* Tombol [🖨️ Struk / Nota Thermal] */}
                          <button
                            onClick={() => setThermalReceiptOrder(ord)}
                            className="px-1.5 py-0.5 rounded text-[9.5px] font-bold text-cyan-300 [body.light-theme_&]:text-cyan-800 bg-cyan-950/60 [body.light-theme_&]:bg-sky-50 border border-cyan-500/40 hover:bg-cyan-900/60 cursor-pointer flex items-center gap-0.5 shadow-sm active:scale-95"
                            title="Buka Modal Cetak Struk / Nota Thermal (58mm / 80mm)"
                          >
                            <span>🖨️ Struk</span>
                          </button>

                          {/* Tombol [📲 Kirim Nota WA ke Pelanggan] */}
                          <button
                            onClick={() =>
                              sendWhatsAppReceipt({
                                orderId: ord.id,
                                customerName: ord.customerName,
                                phone: ord.phone,
                                driverName: ord.driver,
                                vehicle: ord.vehicleId,
                                items: ord.items,
                                totalGalon: ord.totalGalon,
                                emptyGallonsReturned: ord.emptyGallonsReturned ?? ord.totalGalon,
                                emptyGallonDebt: ord.emptyGallonDebt,
                                totalAmount: ord.totalAmount,
                                paymentMethod: ord.paymentStatus === 'Lunas' ? 'Tunai / QRIS' : 'Tempo Bon Toko',
                                paymentStatus: ord.paymentStatus,
                                damagedNotes: ord.damagedItemsNote,
                                time: ord.time,
                              })
                            }
                            className="px-1.5 py-0.5 rounded text-[9.5px] font-bold text-emerald-300 [body.light-theme_&]:text-emerald-800 bg-emerald-950/60 [body.light-theme_&]:bg-emerald-50 border border-emerald-500/40 hover:bg-emerald-900/60 cursor-pointer flex items-center gap-0.5 shadow-sm active:scale-95"
                            title="Kirim Nota Struk WhatsApp ke Pelanggan"
                          >
                            <span>📲 WA</span>
                          </button>

                          {/* Tombol [SJ] */}
                          <button
                            onClick={() => setPrintedSlipOrder(ord)}
                            className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 bg-slate-800/80 [body.light-theme_&]:bg-slate-100 border border-slate-700 hover:bg-slate-700 cursor-pointer"
                            title="Cetak Surat Jalan & Tanda Terima"
                          >
                            <span>SJ</span>
                          </button>

                          {onTransferToKasir && (
                            <button
                              onClick={() => onTransferToKasir(ord)}
                              className="px-1.5 py-0.5 rounded text-[9.5px] font-bold text-amber-300 [body.light-theme_&]:text-amber-800 bg-amber-950/60 [body.light-theme_&]:bg-amber-50 border border-amber-500/40 hover:bg-amber-900/60 cursor-pointer flex items-center gap-0.5"
                              title="Tarik pesanan ini ke Kasir POS untuk bayar langsung di tempat / cetak struk kasir"
                            >
                              <span>POS</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SURAT JALAN PREVIEW MODAL */}
      {printedSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 [body.light-theme_&]:bg-white border border-cyan-500/40 [body.light-theme_&]:border-slate-300 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                  <i className="fa-solid fa-truck-ramp-box"></i>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900">
                    SURAT JALAN #{printedSlipOrder.id}
                  </h4>
                  <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                    JacS DepoHub - Distributor Air Mineral
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPrintedSlipOrder(null)}
                className="text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 cursor-pointer text-sm"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Penerima:</span>
                <span className="font-bold text-white [body.light-theme_&]:text-slate-900">{printedSlipOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kategori:</span>
                <span className="text-cyan-400 [body.light-theme_&]:text-cyan-700 font-semibold">{printedSlipOrder.customerType}</span>
              </div>
              {printedSlipOrder.residentialDetail && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Alamat Rumah:</span>
                  <span className="text-slate-200 [body.light-theme_&]:text-slate-800 text-right max-w-[65%] font-medium">
                    {printedSlipOrder.residentialDetail}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Skema Tabung:</span>
                <span className="font-bold text-emerald-400 [body.light-theme_&]:text-emerald-700">
                  {printedSlipOrder.gallonScheme || 'Tukar Galon'}
                </span>
              </div>
              {printedSlipOrder.depositAmount && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Titipan Deposit:</span>
                  <span className="font-bold font-mono text-violet-400">
                    Rp {printedSlipOrder.depositAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Muatan:</span>
                <span className="text-slate-200 [body.light-theme_&]:text-slate-800">{printedSlipOrder.items}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Armada & Driver:</span>
                <span className="text-slate-200 [body.light-theme_&]:text-slate-800">{printedSlipOrder.driver}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200 text-sm font-bold">
                <span className="text-slate-300 [body.light-theme_&]:text-slate-700">Total Tagihan:</span>
                <span className="text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono">
                  Rp {printedSlipOrder.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const ord = printedSlipOrder;
                    setPrintedSlipOrder(null);
                    setThermalReceiptOrder(ord);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 hover:bg-cyan-900/60 cursor-pointer flex items-center gap-1"
                >
                  <span>🖨️ Format Thermal (58/80mm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!printedSlipOrder) return;
                    sendWhatsAppReceipt({
                      orderId: printedSlipOrder.id,
                      customerName: printedSlipOrder.customerName,
                      phone: printedSlipOrder.phone,
                      driverName: printedSlipOrder.driver,
                      vehicle: printedSlipOrder.vehicleId,
                      items: printedSlipOrder.items,
                      totalGalon: printedSlipOrder.totalGalon,
                      emptyGallonsReturned: printedSlipOrder.emptyGallonsReturned ?? printedSlipOrder.totalGalon,
                      emptyGallonDebt: printedSlipOrder.emptyGallonDebt,
                      totalAmount: printedSlipOrder.totalAmount,
                      paymentMethod: printedSlipOrder.paymentStatus === 'Lunas' ? 'Tunai / QRIS' : 'Tempo Bon Toko',
                      paymentStatus: printedSlipOrder.paymentStatus,
                      damagedNotes: printedSlipOrder.damagedItemsNote,
                      time: printedSlipOrder.time,
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/60 cursor-pointer flex items-center gap-1"
                >
                  <span>📲 Kirim WA</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintedSlipOrder(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white [body.light-theme_&]:hover:text-slate-900 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setPrintedSlipOrder(null);
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.4)]"
                >
                  <i className="fa-solid fa-print mr-1"></i> Cetak Surat Jalan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK STRUK & NOTA THERMAL (58MM / 80MM) */}
      <ThermalReceiptModal
        isOpen={Boolean(thermalReceiptOrder)}
        onClose={() => setThermalReceiptOrder(null)}
        order={thermalReceiptOrder}
      />

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

