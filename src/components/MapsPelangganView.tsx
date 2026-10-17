import React, { useState, useMemo } from 'react';
import { STORE_MAP_LOCATIONS } from '../data/mockData';
import { StoreMapItem, StoreZone, StoreMapStatus, CustomerMasterItem } from '../types';
import { CustomerModal } from './CustomerModal';
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  Search,
  Filter,
  Phone,
  ShoppingCart,
  ExternalLink,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Building2,
  Store,
  Home,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';

interface MapsPelangganViewProps {
  onCreateOrderForStore?: (store: StoreMapItem) => void;
  onNavigateWhatsApp?: () => void;
  stores?: StoreMapItem[];
  onAddCustomer?: (newCustomer: CustomerMasterItem, andAddToMap?: boolean) => void;
}

export const MapsPelangganView: React.FC<MapsPelangganViewProps> = ({
  onCreateOrderForStore,
  onNavigateWhatsApp,
  stores: propStores,
  onAddCustomer,
}) => {
  const [internalStores, setInternalStores] = useState<StoreMapItem[]>(STORE_MAP_LOCATIONS);
  const stores = propStores || internalStores;

  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>('MAP-01');
  const [selectedZone, setSelectedZone] = useState<string>('Semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [isRadarSweeping, setIsRadarSweeping] = useState<boolean>(true);
  const [hoveredStoreId, setHoveredStoreId] = useState<string | null>(null);

  // Filtered stores list for directory and map display
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchZone = selectedZone === 'Semua' || store.zone === selectedZone;
      const matchCategory = selectedCategory === 'Semua' || store.category === selectedCategory;
      const matchStatus =
        selectedStatus === 'Semua' ||
        (selectedStatus === 'active-order' && store.status === 'active-order') ||
        (selectedStatus === 'delivered-safe' && store.status === 'delivered-safe') ||
        (selectedStatus === 'empty-debt' && store.status === 'empty-debt');

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        store.name.toLowerCase().includes(q) ||
        store.ownerName.toLowerCase().includes(q) ||
        store.address.toLowerCase().includes(q) ||
        store.phone.includes(q) ||
        store.landmark.toLowerCase().includes(q);

      return matchZone && matchCategory && matchStatus && matchQuery;
    });
  }, [stores, selectedZone, selectedCategory, selectedStatus, searchQuery]);

  const selectedStore = useMemo(() => {
    return stores.find((s) => s.id === selectedStoreId) || null;
  }, [stores, selectedStoreId]);

  // Statistics
  const stats = useMemo(() => {
    const total = stores.length;
    const activeOrders = stores.filter((s) => s.status === 'active-order').length;
    const deliveredSafe = stores.filter((s) => s.status === 'delivered-safe').length;
    const emptyDebts = stores.filter((s) => s.status === 'empty-debt').length;
    const totalGallonsDebt = stores.reduce((acc, s) => acc + s.emptyGallonDebt, 0);
    return { total, activeOrders, deliveredSafe, emptyDebts, totalGallonsDebt };
  }, [stores]);

  const handleOpenGoogleMaps = (store: StoreMapItem) => {
    const query = `${store.name}, ${store.address}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const handleOpenWhatsApp = (store: StoreMapItem) => {
    const phone = store.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const msg = `Halo ${store.name} (${store.ownerName}), konfirmasi pengiriman air mineral JacS DepoHub hari ini. Kuota order: ${store.regularQuota} Galon. Ada yang perlu kami siapkan?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleOrderStore = (store: StoreMapItem) => {
    if (onCreateOrderForStore) {
      onCreateOrderForStore(store);
    }
  };

  const handleSaveProspect = (newCustomer: CustomerMasterItem) => {
    if (onAddCustomer) {
      onAddCustomer(newCustomer, true);
    } else {
      const newStore: StoreMapItem = {
        id: `MAP-${Date.now().toString().slice(-4)}`,
        name: newCustomer.name,
        ownerName: newCustomer.ownerName || newCustomer.name,
        category:
          newCustomer.b2bCategory === 'Agen / Pangkalan'
            ? 'Pangkalan Agen'
            : newCustomer.type === 'B2B'
            ? 'Toko Grosir'
            : 'Rumah Tangga',
        phone: newCustomer.phone,
        address: newCustomer.address,
        landmark: newCustomer.landmark || 'Didaftarkan Tim Salesman',
        zone: newCustomer.zone || 'Rayon Utara',
        x: Math.round(25 + Math.random() * 50),
        y: Math.round(25 + Math.random() * 50),
        status: 'delivered-safe',
        statusLabel: 'Toko Prospek Terdaftar',
        regularQuota: 20,
        emptyGallonDebt: newCustomer.emptyGallonDebt || 0,
        currentReceivable: 0,
        lastOrderDate: 'Baru Terdaftar',
        lat: -6.56 + (Math.random() - 0.5) * 0.04,
        lng: 107.65 + (Math.random() - 0.5) * 0.04,
      };
      setInternalStores((prev) => [newStore, ...prev]);
    }
  };

  // Center Depo Coordinate
  const centerDepo = { x: 50, y: 50 };

  return (
    <div className="h-full flex flex-col gap-2.5 overflow-hidden">
      {/* Top Header Card: Summary & Quick Actions */}
      <div className="glass-panel p-2.5 px-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm border-t-[3px] border-t-cyan-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:border-cyan-300 [body.light-theme_&]:text-cyan-800 flex items-center justify-center text-base shadow-[0_0_12px_rgba(6,182,212,0.35)] shrink-0">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2 leading-none">
              PETA & RADAR DISTRIBUSI TOKO PELANGGAN
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-800">
                LIVE GIS TELEMETRY
              </span>
            </h2>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2">
          {/* Active Orders Today */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 [body.light-theme_&]:bg-rose-50 [body.light-theme_&]:border-rose-200 [body.light-theme_&]:text-rose-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-mono font-bold">{stats.activeOrders}</span>
            <span className="text-[10px] hidden sm:inline">Order Aktif</span>
          </div>

          {/* Delivered Safe */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:border-emerald-200 [body.light-theme_&]:text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 [body.light-theme_&]:text-emerald-600" />
            <span className="font-mono font-bold">{stats.deliveredSafe}</span>
            <span className="text-[10px] hidden sm:inline">Terkirim Aman</span>
          </div>

          {/* Empty Gallon Debt */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 [body.light-theme_&]:bg-amber-50 [body.light-theme_&]:border-amber-200 [body.light-theme_&]:text-amber-800 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 [body.light-theme_&]:text-amber-600" />
            <span className="font-mono font-bold">{stats.totalGallonsDebt}</span>
            <span className="text-[10px] hidden sm:inline">Galon Tertahan</span>
          </div>

          {/* Radar Sweep Toggle */}
          <button
            onClick={() => setIsRadarSweeping(!isRadarSweeping)}
            className={`p-1.5 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isRadarSweeping
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-900'
                : 'bg-slate-900 border-slate-700 text-slate-400 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-600'
            }`}
            title="Nyalakan / Matikan Efek Sapuan Radar"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRadarSweeping ? 'animate-spin' : ''}`} />
            <span className="text-[10.5px]">Radar</span>
          </button>

          {/* Tombol Registrasi Toko Prospek Salesman / CRM */}
          <button
            type="button"
            onClick={() => setIsProspectModalOpen(true)}
            className="p-1.5 px-3 rounded-lg border-2 border-cyan-400 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs font-black shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Daftarkan Toko Prospek Baru dari Salesman (Sinkron Master Pelanggan & Maps)"
          >
            <Store className="w-3.5 h-3.5" />
            <span>+ Registrasi Toko Prospek</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left (7 Cols) = Map & Radar Canvas; Right (5 Cols) = Directory & Details */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
        {/* LEFT PANE: INTERACTIVE SVG RADAR MAP (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 h-full rounded-xl border-2 border-cyan-500/80 [body.light-theme_&]:border-cyan-600 overflow-hidden bg-slate-950 [body.light-theme_&]:bg-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.2)] relative select-none">
          {/* Top Canvas Controls Bar */}
          <div className="p-2 px-3 border-b border-cyan-500/30 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
                RADAR SUBANG-CIPEUNDEUY (RADIUS 15KM)
              </span>
            </div>

            {/* Map Legend */}
            <div className="flex items-center gap-2.5 text-[9.5px] font-mono">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Order Aktif
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Stok Aman
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Hutang Tabung
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMapZoom((z) => Math.min(1.4, z + 0.1))}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer border border-slate-700"
                title="Perbesar Peta"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMapZoom((z) => Math.max(0.8, z - 0.1))}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer border border-slate-700"
                title="Perkecil Peta"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMapZoom(1)}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer border border-slate-700"
                title="Reset Tampilan"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* SVG Map Canvas Area */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#070d18]">
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#06b6d4 1px, transparent 1px), linear-gradient(to right, rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.1) 1px, transparent 1px)',
                backgroundSize: '24px 24px, 48px 48px, 48px 48px',
              }}
            />

            {/* Interactive SVG Canvas */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full max-w-full max-h-full transition-transform duration-300 ease-out"
              style={{ transform: `scale(${mapZoom})` }}
            >
              <defs>
                {/* Radar Sweep Gradient */}
                <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Concentric Radar Distance Rings */}
              <circle cx="50" cy="50" r="14" fill="none" stroke="#0ea5e9" strokeWidth="0.25" strokeOpacity="0.3" strokeDasharray="1 1" />
              <circle cx="50" cy="50" r="26" fill="none" stroke="#0ea5e9" strokeWidth="0.3" strokeOpacity="0.4" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#0ea5e9" strokeWidth="0.35" strokeOpacity="0.3" strokeDasharray="2 1" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="#0ea5e9" strokeWidth="0.4" strokeOpacity="0.2" />

              {/* Azimuth / Crosshair Guidelines */}
              <line x1="50" y1="4" x2="50" y2="96" stroke="#06b6d4" strokeWidth="0.2" strokeOpacity="0.25" />
              <line x1="4" y1="50" x2="96" y2="50" stroke="#06b6d4" strokeWidth="0.2" strokeOpacity="0.25" />
              <line x1="17" y1="17" x2="83" y2="83" stroke="#06b6d4" strokeWidth="0.15" strokeOpacity="0.15" strokeDasharray="1 2" />
              <line x1="83" y1="17" x2="17" y2="83" stroke="#06b6d4" strokeWidth="0.15" strokeOpacity="0.15" strokeDasharray="1 2" />

              {/* Cardinal Labels */}
              <text x="50" y="7" textAnchor="middle" fill="#06b6d4" fontSize="2" fontFamily="monospace" opacity="0.6">U (KALIJATI)</text>
              <text x="50" y="96" textAnchor="middle" fill="#06b6d4" fontSize="2" fontFamily="monospace" opacity="0.6">S (PURWADADI)</text>
              <text x="94" y="51" textAnchor="end" fill="#06b6d4" fontSize="2" fontFamily="monospace" opacity="0.6">T (SUBANG KOTA)</text>
              <text x="6" y="51" textAnchor="start" fill="#06b6d4" fontSize="2" fontFamily="monospace" opacity="0.6">B (CIPEUNDEUY)</text>

              {/* Distance Badges */}
              <text x="50" y="37" textAnchor="middle" fill="#38bdf8" fontSize="1.6" fontFamily="monospace" opacity="0.5">5 KM</text>
              <text x="50" y="25" textAnchor="middle" fill="#38bdf8" fontSize="1.6" fontFamily="monospace" opacity="0.5">10 KM</text>
              <text x="50" y="13" textAnchor="middle" fill="#38bdf8" fontSize="1.6" fontFamily="monospace" opacity="0.5">15 KM</text>

              {/* Rotating Radar Sweep Cone Animation */}
              {isRadarSweeping && (
                <g className="origin-center" style={{ transformOrigin: '50px 50px' }}>
                  <path
                    d="M 50 50 L 50 4 A 46 46 0 0 1 82.5 17.5 Z"
                    fill="url(#radarSweep)"
                    className="animate-spin-slow origin-center"
                    style={{ transformOrigin: '50px 50px' }}
                  />
                  <line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="4"
                    stroke="#00f2fe"
                    strokeWidth="0.5"
                    strokeOpacity="0.8"
                    className="animate-spin-slow origin-center"
                    style={{ transformOrigin: '50px 50px' }}
                  />
                </g>
              )}

              {/* Connecting neon line from Depo Pusat to Selected Store */}
              {selectedStore && (
                <g>
                  <line
                    x1={centerDepo.x}
                    y1={centerDepo.y}
                    x2={selectedStore.x}
                    y2={selectedStore.y}
                    stroke="#00f2fe"
                    strokeWidth="0.6"
                    strokeDasharray="1.5 1"
                    className="animate-pulse"
                  />
                  {/* Midpoint Distance indicator */}
                  <circle
                    cx={(centerDepo.x + selectedStore.x) / 2}
                    cy={(centerDepo.y + selectedStore.y) / 2}
                    r="1.8"
                    fill="#0f172a"
                    stroke="#00f2fe"
                    strokeWidth="0.3"
                  />
                  <text
                    x={(centerDepo.x + selectedStore.x) / 2}
                    y={(centerDepo.y + selectedStore.y) / 2 + 0.6}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="1.2"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    RUTE
                  </text>
                </g>
              )}

              {/* Store Nodes / Pins */}
              {filteredStores.map((store) => {
                const isSelected = selectedStoreId === store.id;
                const isHovered = hoveredStoreId === store.id;

                let color = '#10b981'; // safe
                if (store.status === 'active-order') color = '#f43f5e'; // active order
                if (store.status === 'empty-debt') color = '#f59e0b'; // debt

                return (
                  <g
                    key={store.id}
                    onClick={() => setSelectedStoreId(store.id)}
                    onMouseEnter={() => setHoveredStoreId(store.id)}
                    onMouseLeave={() => setHoveredStoreId(null)}
                    className="cursor-pointer transition-transform duration-200"
                    style={{ transformOrigin: `${store.x}px ${store.y}px` }}
                  >
                    {/* Pulsing ring for active orders */}
                    {store.status === 'active-order' && (
                      <circle
                        cx={store.x}
                        cy={store.y}
                        r="3.5"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="0.4"
                        className="animate-ping"
                        opacity="0.8"
                      />
                    )}

                    {/* Selected Halo Ring */}
                    {isSelected && (
                      <circle
                        cx={store.x}
                        cy={store.y}
                        r="4"
                        fill="none"
                        stroke="#00f2fe"
                        strokeWidth="0.6"
                        strokeDasharray="1 0.8"
                        className="animate-spin"
                        style={{ transformOrigin: `${store.x}px ${store.y}px` }}
                      />
                    )}

                    {/* Outer Glow Ring */}
                    <circle
                      cx={store.x}
                      cy={store.y}
                      r={isSelected || isHovered ? '2.4' : '1.8'}
                      fill={color}
                      opacity={isSelected || isHovered ? '0.35' : '0.2'}
                    />

                    {/* Node Dot */}
                    <circle
                      cx={store.x}
                      cy={store.y}
                      r={isSelected ? '1.5' : '1.1'}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? '0.5' : '0.3'}
                      filter="url(#glow)"
                    />

                    {/* Store Micro Label */}
                    <text
                      x={store.x}
                      y={store.y + 3.2}
                      textAnchor="middle"
                      fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                      fontSize="1.7"
                      fontFamily="sans-serif"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="pointer-events-none drop-shadow-md select-none"
                    >
                      {store.name.split(' ')[0]} {store.name.split(' ')[1] || ''}
                    </text>
                  </g>
                );
              })}

              {/* CENTER: DEPO PUSAT NODE */}
              <g className="cursor-pointer">
                {/* Multi-layered Pulsing Aura */}
                <circle cx="50" cy="50" r="5.5" fill="none" stroke="#00f2fe" strokeWidth="0.3" opacity="0.3" className="animate-ping" />
                <circle cx="50" cy="50" r="4.2" fill="#00f2fe" opacity="0.2" />
                <circle cx="50" cy="50" r="2.8" fill="#0891b2" stroke="#ffffff" strokeWidth="0.6" />
                <circle cx="50" cy="50" r="1.2" fill="#ffffff" />
                <text
                  x="50"
                  y="55.5"
                  textAnchor="middle"
                  fill="#00f2fe"
                  fontSize="2.1"
                  fontFamily="sans-serif"
                  fontWeight="900"
                  className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                >
                  DEPO PUSAT #01
                </text>
              </g>
            </svg>

            {/* Floating Active Store Summary Card (Overlay inside Canvas) */}
            {selectedStore && (
              <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-80 bg-slate-900/95 border-2 border-cyan-400/90 rounded-xl p-3 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] z-20 transition-all text-xs">
                <div className="flex items-start justify-between gap-1.5 pb-2 border-b border-slate-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        selectedStore.status === 'active-order'
                          ? 'bg-rose-500 animate-ping'
                          : selectedStore.status === 'empty-debt'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`} />
                      <span className="font-extrabold text-white text-xs truncate">
                        {selectedStore.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                      {selectedStore.ownerName} • {selectedStore.category}
                    </div>
                  </div>

                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {selectedStore.zone}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 py-2 text-[10px] border-b border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block">Status Hari Ini:</span>
                    <span className={`font-bold ${
                      selectedStore.status === 'active-order'
                        ? 'text-rose-400'
                        : selectedStore.status === 'empty-debt'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {selectedStore.statusLabel}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Tabung Tertahan:</span>
                    <span className={`font-mono font-bold ${
                      selectedStore.emptyGallonDebt > 0 ? 'text-amber-300' : 'text-slate-300'
                    }`}>
                      {selectedStore.emptyGallonDebt > 0 ? `${selectedStore.emptyGallonDebt} Galon` : 'Nihil (Lengkap)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Kebutuhan Rutin:</span>
                    <span className="font-mono font-bold text-white">
                      {selectedStore.regularQuota} Galon / Kirim
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Piutang Berjalan:</span>
                    <span className={`font-mono font-bold ${
                      selectedStore.currentReceivable > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {selectedStore.currentReceivable > 0 ? `Rp ${selectedStore.currentReceivable.toLocaleString('id-ID')}` : 'Rp 0 (Lunas)'}
                    </span>
                  </div>
                </div>

                {/* Address & Landmark */}
                <div className="py-1.5 text-[9.5px] text-slate-300 leading-tight">
                  <span className="text-slate-400">Alamat:</span> {selectedStore.address}
                  <div className="text-cyan-400/90 font-medium mt-0.5">
                    📍 Patokan: {selectedStore.landmark}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-2">
                  <button
                    onClick={() => handleOpenGoogleMaps(selectedStore)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 hover:border-cyan-400 flex items-center justify-center gap-1 cursor-pointer transition-all"
                    title="Buka Navigasi Google Maps untuk Driver"
                  >
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                    <span>Maps</span>
                  </button>
                  <button
                    onClick={() => handleOpenWhatsApp(selectedStore)}
                    className="py-1.5 px-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center justify-center gap-1 cursor-pointer transition-all"
                    title="Hubungi Toko via WhatsApp"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleOrderStore(selectedStore)}
                    className="py-1.5 px-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1 cursor-pointer transition-all"
                    title="Buat Order Kasir untuk Toko Ini"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Order</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: DIRECTORY & FILTER LIST (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 h-full rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 glass-panel overflow-hidden shadow-sm">
          {/* Header & Filter Controls */}
          <div className="p-3 border-b border-slate-800 [body.light-theme_&]:border-slate-200 bg-slate-900/80 [body.light-theme_&]:bg-slate-50 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-cyan-400 [body.light-theme_&]:text-cyan-600" />
                <span className="font-extrabold text-xs text-white [body.light-theme_&]:text-slate-900">
                  Direktori Toko & Pangkalan ({filteredStores.length} Terdata)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 [body.light-theme_&]:text-slate-500">
                Pilih untuk Sorot Radar
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari toko, pemilik, patokan, alamat, telepon..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-950/80 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Filter Buttons Row: Zone & Status */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {/* Zone Filter */}
              <div className="flex items-center gap-1 bg-slate-950/60 [body.light-theme_&]:bg-white p-0.5 rounded border border-slate-800 [body.light-theme_&]:border-slate-200">
                <span className="text-[9px] text-slate-400 px-1 font-bold">Zona:</span>
                {(['Semua', 'Rayon Utara', 'Rayon Selatan', 'Residensial'] as const).map((z) => (
                  <button
                    key={z}
                    onClick={() => setSelectedZone(z)}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-semibold ${
                      selectedZone === z
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
                    }`}
                  >
                    {z === 'Semua' ? 'Semua' : z.replace('Rayon ', '')}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-950/60 [body.light-theme_&]:bg-white p-0.5 rounded border border-slate-800 [body.light-theme_&]:border-slate-200">
                <span className="text-[9px] text-slate-400 px-1 font-bold">Status:</span>
                {[
                  { id: 'Semua', label: 'Semua' },
                  { id: 'active-order', label: 'Order' },
                  { id: 'delivered-safe', label: 'Aman' },
                  { id: 'empty-debt', label: 'Hutang' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStatus(st.id)}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-semibold ${
                      selectedStatus === st.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stores Scrollable List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
            {filteredStores.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                <MapPin className="w-8 h-8 text-slate-600 mb-2" />
                <span className="text-xs font-semibold">Tidak ada toko yang sesuai filter</span>
                <span className="text-[10px]">Coba ubah kata kunci pencarian atau filter zona</span>
              </div>
            ) : (
              filteredStores.map((store) => {
                const isSelected = selectedStoreId === store.id;

                return (
                  <div
                    key={store.id}
                    onClick={() => setSelectedStoreId(store.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] [body.light-theme_&]:bg-cyan-50/70 [body.light-theme_&]:border-cyan-500'
                        : 'bg-slate-900/60 [body.light-theme_&]:bg-white border-slate-800 [body.light-theme_&]:border-slate-200 hover:border-slate-700 [body.light-theme_&]:hover:border-slate-300'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            store.status === 'active-order'
                              ? 'bg-rose-500 animate-ping'
                              : store.status === 'empty-debt'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`} />
                          <span className="font-extrabold text-xs text-white [body.light-theme_&]:text-slate-900 truncate">
                            {store.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
                          {store.ownerName} • 📞 {store.phone}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          store.category === 'Pangkalan Agen'
                            ? 'bg-amber-500/20 text-amber-300 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800 border border-amber-500/30'
                            : store.category === 'Toko Grosir'
                            ? 'bg-sky-500/20 text-sky-300 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-800 border border-sky-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 border border-emerald-500/30'
                        }`}>
                          {store.category}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 [body.light-theme_&]:text-slate-500">
                          {store.zone}
                        </span>
                      </div>
                    </div>

                    {/* Address & Landmark */}
                    <div className="text-[10px] text-slate-300 [body.light-theme_&]:text-slate-700 bg-slate-950/40 [body.light-theme_&]:bg-slate-50 p-1.5 rounded-lg border border-slate-800/80 [body.light-theme_&]:border-slate-200">
                      <div className="line-clamp-1">{store.address}</div>
                      <div className="text-cyan-400 [body.light-theme_&]:text-cyan-700 font-medium text-[9.5px] mt-0.5 line-clamp-1">
                        📍 Patokan: {store.landmark}
                      </div>
                    </div>

                    {/* Stock & Debt Metrics Pill */}
                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 [body.light-theme_&]:text-slate-600">
                          Rutin: <strong className="text-white [body.light-theme_&]:text-slate-900">{store.regularQuota} Galon</strong>
                        </span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${
                          store.emptyGallonDebt > 0
                            ? 'bg-amber-500/20 text-amber-300 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-600'
                        }`}>
                          Tabung: {store.emptyGallonDebt > 0 ? `${store.emptyGallonDebt} Dipinjam` : '0'}
                        </span>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenGoogleMaps(store)}
                          className="px-2 py-0.8 rounded text-[9.5px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-cyan-800 border border-slate-700 [body.light-theme_&]:border-slate-300 flex items-center gap-1 cursor-pointer transition-all"
                          title="Buka Navigasi Rute di Google Maps"
                        >
                          <Navigation className="w-2.5 h-2.5" />
                          <span>Maps</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(store)}
                          className="px-2 py-0.8 rounded text-[9.5px] font-bold bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition-all"
                          title="Kirim Pesan WhatsApp"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>WA</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOrderStore(store)}
                          className="px-2.5 py-0.8 rounded text-[9.5px] font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                          title="Input Order Kasir & POS"
                        >
                          <ShoppingCart className="w-2.5 h-2.5" />
                          <span>Order</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Registrasi Toko Prospek Salesman */}
      <CustomerModal
        isOpen={isProspectModalOpen}
        onClose={() => setIsProspectModalOpen(false)}
        onSaveCustomer={handleSaveProspect}
        defaultCategory="Toko Kelontong"
        defaultZone="Rayon Utara"
      />
    </div>
  );
};
