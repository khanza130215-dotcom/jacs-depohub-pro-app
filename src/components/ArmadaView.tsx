import React, { useState } from 'react';
import { ArmadaItem, DispatchAssignment } from '../types';

interface ArmadaViewProps {
  armadaList: ArmadaItem[];
  onAddArmada?: (item: ArmadaItem) => void;
  onUpdateArmada?: (item: ArmadaItem) => void;
  dispatchAssignments?: Record<string, DispatchAssignment>;
  onUpdateDispatchAssignment?: (updated: DispatchAssignment) => void;
}

export const ArmadaView: React.FC<ArmadaViewProps> = ({
  armadaList,
  onAddArmada,
  onUpdateArmada,
  dispatchAssignments,
  onUpdateDispatchAssignment,
}) => {
  const [filterType, setFilterType] = useState<'Semua' | 'Mobil' | 'Viar'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState<'Motor Roda Tiga / Viar' | 'Suzuki Carry Pickup' | 'Daihatsu Gran Max' | 'Truk Mitsubishi Canter'>('Motor Roda Tiga / Viar');
  const [newPlateNumber, setNewPlateNumber] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newCapacityGalon, setNewCapacityGalon] = useState<number>(25); // default 25 (range 20-30 untuk Viar)
  const [newCurrentRoute, setNewCurrentRoute] = useState('Rute Pemukiman & Gang Toko Kelontong');
  const [newStatus, setNewStatus] = useState<ArmadaItem['status']>('Tersedia');

  // State for Quick Load Edit Modal (Pusat Logistik 1 Pintu)
  const [editingLoadItem, setEditingLoadItem] = useState<ArmadaItem | null>(null);
  const [tempLoadValue, setTempLoadValue] = useState<number>(0);
  const [tempEmptyLoadValue, setTempEmptyLoadValue] = useState<number>(0);

  // Auto-set capacity recommendations based on vehicle type
  const handleVehicleTypeChange = (type: typeof newVehicleType) => {
    setNewVehicleType(type);
    if (type === 'Motor Roda Tiga / Viar') {
      setNewCapacityGalon(25);
      setNewCurrentRoute('Rute Pemukiman & Gang Toko Kelontong');
    } else if (type === 'Suzuki Carry Pickup') {
      setNewCapacityGalon(90);
      setNewCurrentRoute('Rute Wilayah Barat & Ruko Boulevard');
    } else if (type === 'Daihatsu Gran Max') {
      setNewCapacityGalon(110);
      setNewCurrentRoute('Rute Wilayah Timur & Pasar Induk');
    } else if (type === 'Truk Mitsubishi Canter') {
      setNewCapacityGalon(320);
      setNewCurrentRoute('Drop Pabrik Curah & Pangkalan Besar');
    }
  };

  const handleSaveNewArmada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlateNumber.trim() || !newDriverName.trim()) {
      alert('Plat nomor dan nama supir/rider wajib diisi!');
      return;
    }

    const nextId = `ARM-${String(armadaList.length + 1).padStart(2, '0')}`;
    const newItem: ArmadaItem = {
      id: nextId,
      plateNumber: newPlateNumber.trim().toUpperCase(),
      driverName: newDriverName.trim(),
      vehicleType:
        newVehicleType === 'Motor Roda Tiga / Viar'
          ? `Motor Roda Tiga / Viar (${newCapacityGalon} Galon)`
          : newVehicleType,
      capacityGalon: Number(newCapacityGalon) || 25,
      currentLoad: 0,
      emptyGallonLoad: 0,
      status: newStatus,
      currentRoute: newCurrentRoute.trim() || 'Standby Depo Distribusi',
    };

    if (onAddArmada) {
      onAddArmada(newItem);
    }
    setIsAddModalOpen(false);
    // Reset
    setNewPlateNumber('');
    setNewDriverName('');
    setNewCapacityGalon(25);
  };

  const handleOpenLoadModal = (item: ArmadaItem) => {
    setEditingLoadItem(item);
    setTempLoadValue(item.currentLoad);
    setTempEmptyLoadValue(item.emptyGallonLoad || 0);
  };

  // Pusat 1-Pintu Logistik Armada: Status Otomatis & Kunci Manual Servis Darurat
  const handleSaveLoad = (forceStatus?: ArmadaItem['status']) => {
    if (!editingLoadItem) return;
    const clampedLoad = Math.min(editingLoadItem.capacityGalon, Math.max(0, tempLoadValue));
    const clampedEmpty = Math.max(0, tempEmptyLoadValue);

    // Status Otomatis:
    // - "Sedang Jalan" jika ada muatan aktif (clampedLoad > 0)
    // - "Tersedia" saat muatan kosong (clampedLoad === 0) dan tabung ditarik disetor
    // - "Servis" hanya untuk kondisi darurat
    let computedStatus: ArmadaItem['status'];
    if (forceStatus) {
      computedStatus = forceStatus;
    } else if (editingLoadItem.status === 'Servis' && clampedLoad === 0) {
      computedStatus = 'Servis';
    } else {
      computedStatus = clampedLoad > 0 ? 'Sedang Jalan' : 'Tersedia';
    }

    const updated: ArmadaItem = {
      ...editingLoadItem,
      currentLoad: clampedLoad,
      emptyGallonLoad: clampedEmpty,
      status: computedStatus,
    };
    if (onUpdateArmada) {
      onUpdateArmada(updated);
    }
    setEditingLoadItem(null);
  };

  // Toggle status darurat Servis manual
  const handleToggleEmergencyServis = (item: ArmadaItem) => {
    const isCurrentlyServis = item.status === 'Servis';
    const nextStatus: ArmadaItem['status'] = isCurrentlyServis
      ? (item.currentLoad > 0 ? 'Sedang Jalan' : 'Tersedia')
      : 'Servis';
    const updated: ArmadaItem = { ...item, status: nextStatus };
    if (onUpdateArmada) {
      onUpdateArmada(updated);
    }
  };

  const filteredArmada = armadaList.filter((item) => {
    const isViar =
      item.vehicleType.toLowerCase().includes('viar') ||
      item.vehicleType.toLowerCase().includes('roda') ||
      item.vehicleType.toLowerCase().includes('motor');
    if (filterType === 'Viar' && !isViar) return false;
    if (filterType === 'Mobil' && isViar) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPlate = item.plateNumber.toLowerCase().includes(q);
      const matchDriver = item.driverName.toLowerCase().includes(q);
      const matchRoute = item.currentRoute.toLowerCase().includes(q);
      const matchType = item.vehicleType.toLowerCase().includes(q);
      if (!matchPlate && !matchDriver && !matchRoute && !matchType) return false;
    }

    return true;
  });

  const totalMobil = armadaList.filter(
    (a) =>
      !a.vehicleType.toLowerCase().includes('viar') &&
      !a.vehicleType.toLowerCase().includes('roda') &&
      !a.vehicleType.toLowerCase().includes('motor')
  ).length;

  const totalViar = armadaList.filter(
    (a) =>
      a.vehicleType.toLowerCase().includes('viar') ||
      a.vehicleType.toLowerCase().includes('roda') ||
      a.vehicleType.toLowerCase().includes('motor')
  ).length;

  const countSedangJalan = armadaList.filter((a) => a.status === 'Sedang Jalan').length;
  const countStandby = armadaList.filter((a) => a.status === 'Tersedia').length;
  const countServis = armadaList.filter((a) => a.status === 'Servis').length;
  const countBongkarMuat = armadaList.filter((a) => a.status === 'Bongkar Muat').length;
  const totalKapasitas = armadaList.reduce((acc, a) => acc + a.capacityGalon, 0);
  const totalMuatanAktif = armadaList.reduce((acc, a) => acc + a.currentLoad, 0);

  return (
    <div className="h-full flex flex-col gap-2.5 overflow-hidden [body.light-theme_&]:text-slate-800">
      {/* Top Banner - Compact */}
      <div className="glass-panel p-2.5 px-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5 leading-none">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Armada Distribusi & Pengantaran (Mobil Truk & Motor Roda 3 Viar)
          </h3>
        </div>

        {/* Filter Badges & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950/70 [body.light-theme_&]:bg-slate-100 p-0.5 rounded-lg border border-slate-800 [body.light-theme_&]:border-slate-300 text-[11px] font-bold">
            <button
              onClick={() => setFilterType('Semua')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                filterType === 'Semua'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              Semua ({armadaList.length})
            </button>
            <button
              onClick={() => setFilterType('Mobil')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'Mobil'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-truck"></i>
              Mobil/Truk ({totalMobil})
            </button>
            <button
              onClick={() => setFilterType('Viar')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'Viar'
                  ? 'bg-emerald-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-motorcycle"></i>
              Motor Roda 3 Viar ({totalViar})
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)] flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-300"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>+ Tambah Armada / Viar</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar with Theme Neon Glow Borders on Hover */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        {/* Card 1: Armada Jalan / Muatan Aktif (Neon Cyan/Sky Glow) */}
        <div className="p-2.5 rounded-xl border border-slate-700/60 bg-cyan-950/20 [body.light-theme_&]:bg-white flex items-center gap-2.5 transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.45)] hover:-translate-y-1 cursor-default">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-sm shadow-xs shrink-0">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-bold uppercase tracking-wider truncate">
              Sedang Jalan / Di Rute
            </div>
            <div className="text-xs sm:text-sm font-black text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono leading-tight">
              {countSedangJalan} Unit <span className="text-[10px] font-medium text-slate-400">({totalMuatanAktif} Gln Diantar)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Armada Siap / Standby Depo (Neon Hijau Emerald Glow) */}
        <div className="p-2.5 rounded-xl border border-slate-700/60 bg-emerald-950/20 [body.light-theme_&]:bg-white flex items-center gap-2.5 transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.45)] hover:-translate-y-1 cursor-default">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-sm shadow-xs shrink-0">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-bold uppercase tracking-wider truncate">
              Siap / Standby Depo
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 font-mono leading-tight">
              {countStandby} Unit <span className="text-[10px] font-medium text-slate-400">(Siap Muat)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Armada Servis / Perbaikan (Neon Merah/Rose Glow) */}
        <div className="p-2.5 rounded-xl border border-slate-700/60 bg-rose-950/20 [body.light-theme_&]:bg-white flex items-center gap-2.5 transition-all duration-300 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.45)] hover:-translate-y-1 cursor-default">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-sm shadow-xs shrink-0">
            <i className="fa-solid fa-screwdriver-wrench"></i>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-bold uppercase tracking-wider truncate">
              Servis & Perbaikan
            </div>
            <div className="text-xs sm:text-sm font-black text-rose-400 [body.light-theme_&]:text-rose-700 font-mono leading-tight">
              {countServis} Unit <span className="text-[10px] font-medium text-slate-400">({countBongkarMuat} Muat)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Armada & Kapasitas (Neon Amber Glow) */}
        <div className="p-2.5 rounded-xl border border-slate-700/60 bg-amber-950/20 [body.light-theme_&]:bg-white flex items-center gap-2.5 transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.45)] hover:-translate-y-1 cursor-default">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-sm shadow-xs shrink-0">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-bold uppercase tracking-wider truncate">
              Total Daya Angkut
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-400 [body.light-theme_&]:text-amber-700 font-mono leading-tight">
              {totalKapasitas} Galon <span className="text-[10px] font-medium text-slate-400">({totalMobil} Truk, {totalViar} Viar)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-80">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
          <input
            type="text"
            placeholder="Cari plat nomor, supir/rider, atau rute..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 text-slate-200 [body.light-theme_&]:text-slate-800 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
          Menampilkan <strong className="text-white [body.light-theme_&]:text-slate-900">{filteredArmada.length}</strong> dari {armadaList.length} armada
        </div>
      </div>

      {/* Armada Cards Grid - Internal Scroll Only */}
      <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2.5 pr-0.5">
        {filteredArmada.map((item) => {
          const isViar =
            item.vehicleType.toLowerCase().includes('viar') ||
            item.vehicleType.toLowerCase().includes('roda') ||
            item.vehicleType.toLowerCase().includes('motor');
          const loadPercent = Math.min(100, Math.round((item.currentLoad / item.capacityGalon) * 100));

          const statusGlowClass =
            item.status === 'Sedang Jalan'
              ? 'border-2 border-slate-700/60 shadow-sm transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.45)] hover:-translate-y-1 bg-cyan-950/15 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-cyan-500'
              : item.status === 'Tersedia'
              ? 'border-2 border-slate-700/60 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.45)] hover:-translate-y-1 bg-emerald-950/15 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-emerald-500'
              : item.status === 'Servis'
              ? 'border-2 border-slate-700/60 shadow-sm transition-all duration-300 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.45)] hover:-translate-y-1 bg-rose-950/15 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-rose-500'
              : 'border-2 border-slate-700/60 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.45)] hover:-translate-y-1 bg-amber-950/15 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-amber-500';

          const progressBarHoverGlow =
            item.status === 'Tersedia'
              ? 'hover:border-emerald-400 hover:shadow-[0_0_16px_rgba(52,211,153,0.5)]'
              : item.status === 'Bongkar Muat'
              ? 'hover:border-amber-400 hover:shadow-[0_0_16px_rgba(251,191,36,0.5)]'
              : item.status === 'Sedang Jalan'
              ? 'hover:border-cyan-400 hover:shadow-[0_0_16px_rgba(6,182,212,0.5)]'
              : 'hover:border-rose-400 hover:shadow-[0_0_16px_rgba(244,63,94,0.5)]';

          return (
            <div
              key={item.id}
              className={`glass-panel rounded-xl p-3 flex flex-col justify-between transition-all ${statusGlowClass}`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 [body.light-theme_&]:border-slate-200">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm border ${
                        isViar
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 [body.light-theme_&]:text-emerald-700 [body.light-theme_&]:bg-emerald-100'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30 [body.light-theme_&]:text-amber-700 [body.light-theme_&]:bg-amber-100'
                      }`}
                    >
                      <i className={isViar ? 'fa-solid fa-motorcycle text-base' : 'fa-solid fa-truck-moving'}></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900">{item.plateNumber}</span>
                        {isViar && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500/25 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 border border-emerald-500/40">
                            🛵 Motor Roda 3 Viar (20-30 Galon)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 font-medium">{item.vehicleType}</div>
                    </div>
                  </div>

                  {/* Indikator Status Otomatis & Kunci Manual Servis Darurat */}
                  <div className="flex items-center gap-1.5">
                    {item.status === 'Servis' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-xs">
                          <i className="fa-solid fa-wrench text-rose-400"></i>
                          <span>🔧 Servis (Darurat)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleEmergencyServis(item)}
                          className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                          title="Kembalikan armada ke mode operasional"
                        >
                          Selesai
                        </button>
                      </div>
                    ) : item.currentLoad > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        <span>🚚 Sedang Jalan</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>✅ Tersedia</span>
                      </span>
                    )}

                    {item.status !== 'Servis' && (
                      <button
                        type="button"
                        onClick={() => handleToggleEmergencyServis(item)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 cursor-pointer transition-all"
                        title="Kunci status manual darurat jika armada rusak / masuk bengkel"
                      >
                        🔧 Servis
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 [body.light-theme_&]:text-slate-500">
                      {isViar ? 'Rider Viar Penanggung Jawab:' : 'Driver Penanggung Jawab:'}
                    </span>
                    <span className="font-bold text-slate-200 [body.light-theme_&]:text-slate-800 flex items-center gap-1">
                      <i className={isViar ? 'fa-solid fa-id-badge text-emerald-400 text-[10px]' : 'fa-solid fa-user text-amber-400 text-[10px]'}></i>
                      {item.driverName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 [body.light-theme_&]:text-slate-500">Rute Operasional:</span>
                    <span className="font-medium text-cyan-400 [body.light-theme_&]:text-cyan-700 text-right truncate max-w-[210px]" title={item.currentRoute}>
                      {item.currentRoute}
                    </span>
                  </div>

                  {/* Load progress with interactive border neon glow */}
                  <div className={`pt-1 bg-slate-950/40 [body.light-theme_&]:bg-slate-100/70 p-2 rounded-lg border border-slate-800/80 [body.light-theme_&]:border-slate-200 transition-all duration-300 cursor-pointer ${progressBarHoverGlow}`}>
                    <div className="flex justify-between items-center text-[10px] mb-1 font-bold">
                      <span className="text-slate-300 [body.light-theme_&]:text-slate-700 flex items-center gap-1">
                        <i className="fa-solid fa-boxes-packing text-cyan-400"></i>
                        <span>Muatan Galon Aktif (Kapasitas {item.capacityGalon} Galon):</span>
                      </span>
                      <span className="text-white [body.light-theme_&]:text-slate-900 font-mono">
                        {item.currentLoad} / {item.capacityGalon} ({loadPercent}%)
                      </span>
                    </div>
                    <div className={`w-full h-2.5 bg-slate-900 [body.light-theme_&]:bg-slate-300 rounded-full overflow-hidden border border-slate-800 [body.light-theme_&]:border-slate-300 transition-all duration-300`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 shadow-sm ${
                          item.status === 'Sedang Jalan'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                            : item.status === 'Tersedia'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                            : item.status === 'Bongkar Muat'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                            : 'bg-gradient-to-r from-rose-500 to-rose-400'
                        }`}
                        style={{ width: `${loadPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-1.5 flex-wrap gap-1">
                      <span>Setara: <strong>{item.capacityGalon * 2} Dus</strong> Botol / Cup</span>
                      <span className="text-emerald-400 [body.light-theme_&]:text-emerald-700 font-bold bg-emerald-500/10 [body.light-theme_&]:bg-emerald-100 px-1.5 py-0.5 rounded">
                        Komisi Kurir: 75% (Rp 750/galon)
                      </span>
                    </div>

                    {/* Retur / Tabung Kosong Armada (Check-in Sore) */}
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 [body.light-theme_&]:border-slate-200 flex items-center justify-between text-[9.5px]">
                      <span className="text-amber-400 [body.light-theme_&]:text-amber-700 font-bold flex items-center gap-1">
                        <i className="fa-solid fa-arrows-rotate text-[8.5px]"></i>
                        <span>Tabung Kosong Ditarik:</span>
                      </span>
                      <span className="font-mono font-black text-amber-300 [body.light-theme_&]:text-amber-800 bg-amber-500/15 [body.light-theme_&]:bg-amber-100 px-1.5 py-0.2 rounded border border-amber-500/30">
                        {item.emptyGallonLoad || 0} Gln (Siap Setor Depo)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions: [Set Muatan] sebagai satu-satunya pusat aksi logistik armada (1 pintu) */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                <span className="text-[9.5px] text-slate-500 font-mono">ID: {item.id}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenLoadModal(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                    title="Pusat Logistik 1-Pintu: Atur muatan galon isi & tabung kosong retur"
                  >
                    <i className="fa-solid fa-boxes-packing"></i>
                    <span>Set Muatan (1 Pintu)</span>
                  </button>
                  <button
                    onClick={() => alert(`Rute pengantaran ${item.plateNumber} (${item.driverName}):\n${item.currentRoute}\nKapasitas: ${item.capacityGalon} Galon\nMuatan saat ini: ${item.currentLoad} Galon`)}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center gap-1"
                    title="Pantau Rute"
                  >
                    <i className="fa-solid fa-map-location-dot"></i>
                    <span>Rute</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL TAMBAH ARMADA BARU (DENGAN TIPE MOTOR RODA 3 VIAR) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveNewArmada}
            className="w-full max-w-lg bg-slate-900 [body.light-theme_&]:bg-white border border-cyan-500/40 [body.light-theme_&]:border-sky-300 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-3.5 px-4 bg-slate-950 [body.light-theme_&]:bg-sky-50 border-b border-slate-800 [body.light-theme_&]:border-sky-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/40">
                  <i className="fa-solid fa-motorcycle"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white [body.light-theme_&]:text-slate-900">
                    Tambah Unit Armada Distribusi Baru
                  </h3>
                  <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                    Registrasi kendaraan pengangkut (Mobil Pickup atau Motor Roda 3 Viar)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
              {/* Tipe Kendaraan */}
              <div>
                <label className="text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
                  Tipe Kendaraan Armada *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleVehicleTypeChange('Motor Roda Tiga / Viar')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                      newVehicleType === 'Motor Roda Tiga / Viar'
                        ? 'bg-emerald-500/20 border-emerald-400 text-white [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-900 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200'
                    }`}
                  >
                    <i className="fa-solid fa-motorcycle text-emerald-400 text-lg mt-0.5"></i>
                    <div>
                      <div className="font-extrabold text-xs">Motor Roda Tiga / Viar</div>
                      <div className="text-[9.5px] text-emerald-300 [body.light-theme_&]:text-emerald-700">
                        Kapasitas 20-30 Galon / Setara Dus. Lincah masuk gang & pemukiman.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVehicleTypeChange('Suzuki Carry Pickup')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                      newVehicleType === 'Suzuki Carry Pickup'
                        ? 'bg-amber-500/20 border-amber-400 text-white [body.light-theme_&]:bg-amber-50 [body.light-theme_&]:text-amber-900 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200'
                    }`}
                  >
                    <i className="fa-solid fa-truck text-amber-400 text-lg mt-0.5"></i>
                    <div>
                      <div className="font-extrabold text-xs">Suzuki Carry / Pickup</div>
                      <div className="text-[9.5px] text-amber-300 [body.light-theme_&]:text-amber-700">
                        Kapasitas 80-100 Galon. Rute jalan raya, ruko, & pangkalan.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Plat Nomor & Nama Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
                    Plat Nomor Polisi *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlateNumber}
                    onChange={(e) => setNewPlateNumber(e.target.value)}
                    placeholder="Contoh: B 6890 VTR"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
                    {newVehicleType === 'Motor Roda Tiga / Viar' ? 'Nama Rider Viar *' : 'Nama Supir Penanggung Jawab *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    placeholder={newVehicleType === 'Motor Roda Tiga / Viar' ? 'Contoh: Samsul Arifin (Rider Viar)' : 'Contoh: Bambang Sukoco'}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Kapasitas Galon */}
              <div>
                <label className="text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 flex items-center justify-between mb-1">
                  <span>
                    Kapasitas Muatan Maksimal: <strong className="text-cyan-400 [body.light-theme_&]:text-cyan-800">{newCapacityGalon} Galon</strong>
                  </span>
                  <span className="text-slate-400 text-[9.5px]">
                    (Setara {newCapacityGalon * 2} Dus Botol/Cup)
                  </span>
                </label>
                {newVehicleType === 'Motor Roda Tiga / Viar' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {[20, 25, 30].map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => setNewCapacityGalon(cap)}
                          className={`flex-1 py-1.5 rounded-lg font-bold font-mono text-xs cursor-pointer border ${
                            newCapacityGalon === cap
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300'
                          }`}
                        >
                          {cap} Galon (Standar)
                        </button>
                      ))}
                    </div>
                    <p className="text-[9.5px] text-emerald-400 [body.light-theme_&]:text-emerald-700">
                      ✓ Sesuai regulasi: Kapasitas aman motor roda 3 Viar adalah 20 hingga 30 tabung galon 19L.
                    </p>
                  </div>
                ) : (
                  <input
                    type="number"
                    min="10"
                    max="500"
                    step="5"
                    value={newCapacityGalon}
                    onChange={(e) => setNewCapacityGalon(Number(e.target.value) || 25)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                )}
              </div>

              {/* Rute Operasional & Status Awal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
                    Rute Operasional Wilayah
                  </label>
                  <input
                    type="text"
                    value={newCurrentRoute}
                    onChange={(e) => setNewCurrentRoute(e.target.value)}
                    placeholder="Contoh: Rute Perumahan Blok A-C & Pasar"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
                    Status Operasional Awal
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Tersedia">✅ Tersedia di Depo</option>
                    <option value="Sedang Jalan">🚚 Sedang Jalan Antar</option>
                    <option value="Bongkar Muat">📦 Bongkar Muat</option>
                    <option value="Servis">🔧 Servis / Perbaikan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-4 bg-slate-950 [body.light-theme_&]:bg-sky-50 border-t border-slate-800 [body.light-theme_&]:border-sky-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer border border-emerald-300"
              >
                <i className="fa-solid fa-floppy-disk text-slate-950"></i>
                <span>Simpan Armada</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PUSAT AKSI LOGISTIK ARMADA (1 PINTU SET MUATAN) */}
      {editingLoadItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 [body.light-theme_&]:bg-white border border-cyan-500/40 [body.light-theme_&]:border-sky-300 rounded-2xl shadow-2xl p-4.5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-2.5">
              <h4 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs border border-cyan-500/30">
                  <i className="fa-solid fa-boxes-packing"></i>
                </div>
                <span>Pusat Logistik Muatan • {editingLoadItem.plateNumber}</span>
              </h4>
              <button
                onClick={() => setEditingLoadItem(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 [body.light-theme_&]:bg-slate-100 border border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white [body.light-theme_&]:text-slate-900">{editingLoadItem.driverName}</div>
                  <div className="text-[10px] text-slate-400">{editingLoadItem.vehicleType}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Daya Angkut Maks:</div>
                  <div className="font-mono font-bold text-cyan-400">{editingLoadItem.capacityGalon} Galon</div>
                </div>
              </div>

              {/* 1. Muatan Galon Terisi */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
                  1. Muatan Galon Terisi Aktif (0 - {editingLoadItem.capacityGalon} Galon)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={editingLoadItem.capacityGalon}
                    value={tempLoadValue}
                    onChange={(e) => setTempLoadValue(Math.max(0, Math.min(editingLoadItem.capacityGalon, Number(e.target.value) || 0)))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold text-base focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setTempLoadValue((prev) => Math.min(editingLoadItem.capacityGalon, prev + 10))}
                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempLoadValue(editingLoadItem.capacityGalon)}
                    className="px-2.5 py-2 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold cursor-pointer"
                  >
                    Penuh
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempLoadValue(0)}
                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                  >
                    Nol
                  </button>
                </div>
              </div>

              {/* 2. Tabung Kosong Ditarik / Bawa */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
                  2. Tabung Kosong Ditarik dari Toko (Siap Setor Depo)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={tempEmptyLoadValue}
                    onChange={(e) => setTempEmptyLoadValue(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 text-amber-400 font-mono font-bold text-base focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setTempEmptyLoadValue(0)}
                    className="px-3 py-2 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-500/40 text-[10px] font-bold whitespace-nowrap cursor-pointer hover:bg-amber-900/60"
                  >
                    Setor Habis (0)
                  </button>
                </div>
              </div>

              {/* Live Status Otomatis Preview */}
              <div className="p-2.5 rounded-xl border bg-slate-950 [body.light-theme_&]:bg-slate-50 border-slate-800 [body.light-theme_&]:border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Indikator Status Otomatis Armada:
                </div>
                {tempLoadValue > 0 ? (
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>🚚 Berubah ke &quot;Sedang Jalan&quot; (Ada muatan aktif {tempLoadValue} galon)</span>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>✅ Berubah ke &quot;Tersedia&quot; (Muatan kosong {tempEmptyLoadValue === 0 ? '& tabung kosong disetor' : ''})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Save */}
            <div className="pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTempLoadValue(0);
                    setTempEmptyLoadValue(0);
                    handleSaveLoad('Tersedia');
                  }}
                  className="flex-1 px-3 py-2 rounded-xl text-[11px] font-extrabold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  title="Selesaikan trip: Kosongkan muatan, setor tabung kosong, otomatis status Tersedia"
                >
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Selesai & Setor (Tersedia)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempLoadValue(editingLoadItem.capacityGalon);
                    handleSaveLoad('Sedang Jalan');
                  }}
                  className="flex-1 px-3 py-2 rounded-xl text-[11px] font-extrabold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  title="Muat penuh armada dan berangkat antar"
                >
                  <i className="fa-solid fa-truck-fast"></i>
                  <span>Muat Penuh (Jalan)</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveLoad('Servis')}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 cursor-pointer"
                  title="Kunci status darurat jika armada harus masuk bengkel"
                >
                  🔧 Kunci Servis Darurat
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLoadItem(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveLoad()}
                    className="px-4 py-1.5 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  >
                    Simpan Muatan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
