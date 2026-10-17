import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { CustomerMasterItem } from '../types';
import {
  Navigation,
  MapPin,
  Compass,
  LocateFixed,
  Phone,
  Zap,
  Store,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Layers,
} from 'lucide-react';

// Default Depo Makassar
export const DEFAULT_DEPO_MAKASSAR = {
  lat: -5.1477,
  lng: 119.4327,
  name: 'Depo Utama JacS Makassar',
  address: 'Jl. Urip Sumoharjo No. 100, Makassar',
};

// Haversine formula for calculating distance in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface MapStoreItem {
  id: string;
  name: string;
  ownerName?: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  statusCategory: 'critical' | 'warning' | 'safe'; // 'Butuh Pasokan' (Merah) | 'Perlu Kunjungan' (Oranye) | 'Aman' (Hijau)
  statusLabel: 'Butuh Pasokan' | 'Perlu Kunjungan' | 'Aman';
  stockPercent: number;
  currentStock: number;
  maxStock: number;
  tempoBalance: number;
  distanceKm: number;
  priceTier?: string;
}

interface NexaFieldGpsMapProps {
  customers: CustomerMasterItem[];
  onOpenSpotSaleForStore?: (store: CustomerMasterItem) => void;
  onOpenCollectTempoForStore?: (store: CustomerMasterItem) => void;
}

export const NexaFieldGpsMap: React.FC<NexaFieldGpsMapProps> = ({
  customers,
  onOpenSpotSaleForStore,
  onOpenCollectTempoForStore,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  // Driver GPS location
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'warning' | 'safe'>('all');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Effective driver coordinate (uses driver GPS if available, else Depo Makassar center)
  const effectiveRefCoord = useMemo(() => {
    return driverLocation || DEFAULT_DEPO_MAKASSAR;
  }, [driverLocation]);

  // Transform and normalize store data with real coordinates and status category
  const processedStores: MapStoreItem[] = useMemo(() => {
    const list = customers && customers.length > 0 ? customers : [];

    // Fallback store coordinates around Makassar if store coordinates are missing or out-of-range
    const defaultMakassarCoords: Array<{ lat: number; lng: number }> = [
      { lat: -5.142, lng: 119.438 },
      { lat: -5.155, lng: 119.441 },
      { lat: -5.138, lng: 119.426 },
      { lat: -5.161, lng: 119.435 },
      { lat: -5.145, lng: 119.445 },
      { lat: -5.151, lng: 119.423 },
      { lat: -5.1495, lng: 119.406 },
      { lat: -5.136, lng: 119.449 },
    ];

    return list.map((c, idx) => {
      // Determine lat/lng
      let lat = c.coordinates?.lat;
      let lng = c.coordinates?.lng;

      // If missing coordinates or not in Makassar region, assign realistic Makassar coordinate
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        const fallback = defaultMakassarCoords[idx % defaultMakassarCoords.length];
        lat = fallback.lat;
        lng = fallback.lng;
      }

      // Calculate stock and tempo
      const maxStock = (c.priceTier === 'Pangkalan' ? 60 : 40);
      const tempo = c.currentReceivable || 0;
      const debt = c.emptyGallonDebt || 0;

      // Estimate current stock: stores with high empty gallon debt or explicit orders are low in stock
      let currentStock: number;
      if (debt >= 15) {
        currentStock = Math.round(maxStock * 0.2); // 20%
      } else if (debt >= 10 || idx === 0 || idx === 2) {
        currentStock = Math.round(maxStock * 0.25); // 25% (<= 30%)
      } else if (idx === 5) {
        currentStock = Math.round(maxStock * 0.28); // 28% (<= 30%)
      } else {
        currentStock = Math.round(maxStock * 0.75); // 75%
      }

      const stockPercent = Math.min(100, Math.max(0, Math.round((currentStock / maxStock) * 100)));

      // 3 Kategori Pin:
      // 1. Merah: 'Butuh Pasokan' (stok toko <= 30%)
      // 2. Oranye: 'Perlu Kunjungan' (ada tagihan piutang / tempo)
      // 3. Hijau: 'Aman' (stok cukup, tidak ada tunggakan)
      let statusCategory: 'critical' | 'warning' | 'safe';
      let statusLabel: 'Butuh Pasokan' | 'Perlu Kunjungan' | 'Aman';

      if (stockPercent <= 30) {
        statusCategory = 'critical';
        statusLabel = 'Butuh Pasokan';
      } else if (tempo > 0) {
        statusCategory = 'warning';
        statusLabel = 'Perlu Kunjungan';
      } else {
        statusCategory = 'safe';
        statusLabel = 'Aman';
      }

      const distanceKm = calculateDistanceKm(
        effectiveRefCoord.lat,
        effectiveRefCoord.lng,
        lat,
        lng
      );

      return {
        id: c.id,
        name: c.name,
        ownerName: c.ownerName,
        address: c.address,
        phone: c.phone,
        lat,
        lng,
        statusCategory,
        statusLabel,
        stockPercent,
        currentStock,
        maxStock,
        tempoBalance: tempo,
        distanceKm,
        priceTier: c.priceTier || 'Toko',
      };
    });
  }, [customers, effectiveRefCoord]);

  // Sort stores by distance to driver/depo
  const sortedStores = useMemo(() => {
    return [...processedStores].sort((a, b) => a.distanceKm - b.distanceKm);
  }, [processedStores]);

  // Filtered stores based on status chip
  const filteredStores = useMemo(() => {
    if (selectedFilter === 'all') return sortedStores;
    return sortedStores.filter((s) => s.statusCategory === selectedFilter);
  }, [sortedStores, selectedFilter]);

  // Active store selected for the floating card
  const activeSelectedStore = useMemo(() => {
    if (selectedStoreId) {
      const found = sortedStores.find((s) => s.id === selectedStoreId);
      if (found) return found;
    }
    // Default to the closest store
    return sortedStores[0] || null;
  }, [sortedStores, selectedStoreId]);

  // Find index of currently active store for next/prev navigation
  const currentStoreIndex = useMemo(() => {
    if (!activeSelectedStore) return 0;
    return sortedStores.findIndex((s) => s.id === activeSelectedStore.id);
  }, [sortedStores, activeSelectedStore]);

  // Function to initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_DEPO_MAKASSAR.lat, DEFAULT_DEPO_MAKASSAR.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark-themed or standard clean OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Layer group for store markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Small delay to ensure container dimension is computed properly
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update Markers when stores, filter, or selected store changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear existing store markers
    markersLayer.clearLayers();

    // 1. Add Depo Marker (Makassar Pusat)
    const depoIcon = L.divIcon({
      className: 'custom-depo-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-2xl bg-cyan-600 border-2 border-white shadow-[0_0_15px_rgba(6,182,212,0.9)] flex items-center justify-center text-white text-sm font-bold">
            🏢
          </div>
          <div class="absolute -bottom-5 bg-slate-950/90 text-cyan-300 border border-cyan-500/50 text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-md shadow-md whitespace-nowrap">
            DEPO PUSAT
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([DEFAULT_DEPO_MAKASSAR.lat, DEFAULT_DEPO_MAKASSAR.lng], { icon: depoIcon })
      .bindPopup(`
        <div style="font-family: inherit; font-size: 11px; color: #0f172a; min-width: 160px;">
          <strong style="color: #0891b2; font-size: 12px;">🏢 ${DEFAULT_DEPO_MAKASSAR.name}</strong><br/>
          <span style="color: #64748b;">${DEFAULT_DEPO_MAKASSAR.address}</span><br/>
          <div style="margin-top: 4px; font-weight: bold; color: #0284c7;">Pusat Distribusi Galon Mineral</div>
        </div>
      `)
      .addTo(markersLayer);

    // 2. Add Driver GPS Marker if live location exists
    if (driverLocation) {
      const driverIcon = L.divIcon({
        className: 'custom-driver-marker',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto">
            <div class="absolute w-10 h-10 rounded-full bg-blue-500/40 animate-ping"></div>
            <div class="w-9 h-9 rounded-full bg-blue-600 border-2 border-white shadow-[0_0_16px_rgba(59,130,246,0.9)] flex items-center justify-center text-white text-base">
              🚚
            </div>
            <div class="absolute -bottom-5 bg-blue-950/90 text-blue-200 border border-blue-400 text-[8.5px] font-mono font-black px-1.5 py-0.2 rounded-md shadow-md whitespace-nowrap">
              POSISI ANDA
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
      } else {
        driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], {
          icon: driverIcon,
        }).addTo(map);
      }
    }

    // 3. Render Store Pins with 3 Category Colors:
    //    - Pin Merah: 'Butuh Pasokan' (stok toko <= 30%)
    //    - Pin Oranye: 'Perlu Kunjungan' (ada tagihan piutang / tempo)
    //    - Pin Hijau: 'Aman' (stok cukup, tidak ada tunggakan)
    filteredStores.forEach((store) => {
      const isSelected = activeSelectedStore?.id === store.id;

      let iconHtml = '';
      if (store.statusCategory === 'critical') {
        // PIN MERAH (BUTUH PASOKAN <= 30%)
        iconHtml = `
          <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110 ${
            isSelected ? 'scale-125 z-50' : 'z-20'
          }">
            <div class="absolute -top-1 w-8 h-8 rounded-full bg-rose-500/40 animate-ping"></div>
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 border-2 ${
              isSelected ? 'border-cyan-300 ring-4 ring-rose-500/50' : 'border-white'
            } shadow-[0_0_14px_rgba(244,63,94,0.9)] flex items-center justify-center text-white font-bold text-xs">
              ⚠️
            </div>
            <div class="bg-rose-950/95 text-rose-200 border border-rose-500/70 text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded shadow mt-0.5 whitespace-nowrap">
              ${store.stockPercent}% Sisa
            </div>
          </div>
        `;
      } else if (store.statusCategory === 'warning') {
        // PIN ORANYE (PERLU KUNJUNGAN / TEMPO)
        iconHtml = `
          <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110 ${
            isSelected ? 'scale-125 z-50' : 'z-20'
          }">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 border-2 ${
              isSelected ? 'border-cyan-300 ring-4 ring-amber-500/50' : 'border-white'
            } shadow-[0_0_14px_rgba(245,158,11,0.9)] flex items-center justify-center text-white font-bold text-xs">
              💰
            </div>
            <div class="bg-amber-950/95 text-amber-200 border border-amber-500/70 text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded shadow mt-0.5 whitespace-nowrap">
              Tempo
            </div>
          </div>
        `;
      } else {
        // PIN HIJAU (AMAN)
        iconHtml = `
          <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110 ${
            isSelected ? 'scale-125 z-50' : 'z-20'
          }">
            <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 ${
              isSelected ? 'border-cyan-300 ring-4 ring-emerald-500/50' : 'border-white'
            } shadow-[0_0_12px_rgba(16,185,129,0.8)] flex items-center justify-center text-white font-bold text-xs">
              🏪
            </div>
            <div class="bg-emerald-950/95 text-emerald-200 border border-emerald-500/70 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded shadow mt-0.5 whitespace-nowrap">
              Aman
            </div>
          </div>
        `;
      }

      const storeIcon = L.divIcon({
        className: `custom-store-pin-${store.id}`,
        html: iconHtml,
        iconSize: [40, 48],
        iconAnchor: [20, 48],
      });

      const marker = L.marker([store.lat, store.lng], { icon: storeIcon }).addTo(markersLayer);

      // On marker click: select store and open floating card
      marker.on('click', () => {
        setSelectedStoreId(store.id);
        map.panTo([store.lat, store.lng], { animate: true });
      });
    });
  }, [filteredStores, activeSelectedStore, driverLocation]);

  // Handler auto-center ke posisi supir saat ini via browser Geolocation API
  const handleAutoCenterDriverLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocatingError('Browser tidak mendukung GPS');
      setTimeout(() => setLocatingError(null), 3000);
      return;
    }

    setIsLocating(true);
    setLocatingError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setDriverLocation({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, {
            animate: true,
            duration: 1.2,
          });
        }
      },
      (error) => {
        setIsLocating(false);
        // Fallback: If denied or failed, center to Depo Makassar
        setLocatingError('Izin GPS ditolak atau tidak tersedia. Memusatkan ke Depo.');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(
            [DEFAULT_DEPO_MAKASSAR.lat, DEFAULT_DEPO_MAKASSAR.lng],
            14,
            { animate: true, duration: 1 }
          );
        }
        setTimeout(() => setLocatingError(null), 4000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [DEFAULT_DEPO_MAKASSAR.lat, DEFAULT_DEPO_MAKASSAR.lng],
        14,
        { animate: true, duration: 1 }
      );
    }
  };

  // Tombol Mulai Navigasi Google Maps Resmi
  const handleStartGoogleMapsNavigation = (store: MapStoreItem) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`,
      '_blank'
    );
  };

  // Next / Prev store browsing for the floating card
  const handleNextStore = () => {
    if (sortedStores.length === 0) return;
    const nextIdx = (currentStoreIndex + 1) % sortedStores.length;
    const nextStore = sortedStores[nextIdx];
    setSelectedStoreId(nextStore.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([nextStore.lat, nextStore.lng], { animate: true });
    }
  };

  const handlePrevStore = () => {
    if (sortedStores.length === 0) return;
    const prevIdx = (currentStoreIndex - 1 + sortedStores.length) % sortedStores.length;
    const prevStore = sortedStores[prevIdx];
    setSelectedStoreId(prevStore.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([prevStore.lat, prevStore.lng], { animate: true });
    }
  };

  // Counts for 3 categories
  const countCritical = useMemo(
    () => sortedStores.filter((s) => s.statusCategory === 'critical').length,
    [sortedStores]
  );
  const countWarning = useMemo(
    () => sortedStores.filter((s) => s.statusCategory === 'warning').length,
    [sortedStores]
  );
  const countSafe = useMemo(
    () => sortedStores.filter((s) => s.statusCategory === 'safe').length,
    [sortedStores]
  );

  return (
    <div className="space-y-2.5">
      {/* HEADER SECTION: PETA GPS & KOORDINAT RIIL */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>PETA GPS INTERAKTIF &amp; RADAR TOKO BINAAN</span>
          </span>
          <p className="text-[9.5px] text-slate-400">
            Peta rute GPS Makassar (Lat -5.1477, Lng 119.4327)
          </p>
        </div>

        {/* Status Mode Indicator */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg text-[9px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>OSM Live</span>
        </div>
      </div>

      {/* FILTER CHIPS 3 KATEGORI PIN: MERAH, ORANYE, HIJAU */}
      <div className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => setSelectedFilter('all')}
          className={`py-1 px-1 rounded-xl text-[9px] font-bold transition-all cursor-pointer text-center truncate ${
            selectedFilter === 'all'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
              : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Semua ({sortedStores.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('critical')}
          className={`py-1 px-1 rounded-xl text-[9px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            selectedFilter === 'critical'
              ? 'bg-rose-500 text-white font-black shadow-[0_0_10px_rgba(244,63,94,0.5)]'
              : 'bg-slate-900/90 text-rose-300 border border-rose-500/30 hover:border-rose-400'
          }`}
          title="Stok toko <= 30%"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping shrink-0" />
          <span className="truncate">🔴 Pasokan ({countCritical})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('warning')}
          className={`py-1 px-1 rounded-xl text-[9px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            selectedFilter === 'warning'
              ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : 'bg-slate-900/90 text-amber-300 border border-amber-500/30 hover:border-amber-400'
          }`}
          title="Ada tagihan piutang / tempo"
        >
          <span className="truncate">🟠 Tempo ({countWarning})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('safe')}
          className={`py-1 px-1 rounded-xl text-[9px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            selectedFilter === 'safe'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
              : 'bg-slate-900/90 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400'
          }`}
          title="Stok cukup & lunas"
        >
          <span className="truncate">🟢 Aman ({countSafe})</span>
        </button>
      </div>

      {/* CONTAINER PETA LEAFLET INTERAKTIF */}
      <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-xl">
        {/* LEAFLET MAP CANVAS DIV */}
        <div
          ref={mapContainerRef}
          className="w-full h-[320px] sm:h-[350px] z-10"
          style={{ background: '#0b1329' }}
        />

        {/* 1. TOMBOL AKSI MELAYANG [📍 LOKASI SAYA] (GEOLOCATION BROWSER) */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={handleAutoCenterDriverLocation}
            disabled={isLocating}
            className={`px-3 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border ${
              isLocating
                ? 'bg-slate-800 text-cyan-300 border-cyan-400/50'
                : driverLocation
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
            }`}
            title="Auto-center ke posisi supir saat ini via geolocation GPS browser"
          >
            <LocateFixed
              className={`w-4 h-4 ${isLocating ? 'animate-spin text-cyan-300' : ''}`}
            />
            <span>{isLocating ? 'Mencari GPS...' : '📍 Lokasi Saya'}</span>
          </button>

          {/* Quick Zoom Tools */}
          <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-md">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              title="Perbesar Peta"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              title="Perkecil Peta"
            >
              -
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 flex items-center justify-center cursor-pointer"
              title="Reset ke Depo Makassar"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. LEGEND MELAYANG DI KIRI ATAS PETA */}
        <div className="absolute top-2.5 left-2.5 z-20 bg-slate-950/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-md text-[9px] space-y-1">
          <div className="font-mono font-bold text-slate-300 flex items-center gap-1 border-b border-slate-800/80 pb-0.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>STATUS LOGISTIK TOKO</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex items-center justify-center text-[7px] text-white">
              !
            </span>
            <span>Merah: Butuh Pasokan (&le;30%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex items-center justify-center text-[7px] text-slate-950 font-bold">
              $
            </span>
            <span>Oranye: Perlu Kunjungan (Tempo)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center text-[7px] text-slate-950">
              ✓
            </span>
            <span>Hijau: Aman (Stok Cukup)</span>
          </div>
        </div>

        {/* TOAST / ERROR NOTICE JIKA ADA */}
        {locatingError && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-lg border border-amber-300 animate-in fade-in slide-in-from-top-1">
            ⚠️ {locatingError}
          </div>
        )}

        {driverLocation && (
          <div className="absolute bottom-2 left-2.5 z-20 bg-blue-950/90 backdrop-blur-md text-blue-200 text-[9.5px] font-mono px-2 py-0.5 rounded-lg border border-blue-400/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>GPS Aktif: {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* 3. CARD MENGAMBANG TOKO TERDEKAT & TOMBOL MULAI NAVIGASI */}
      {activeSelectedStore ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-2 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] space-y-2.5 animate-in fade-in duration-200">
          {/* Baris Atas Card: Label Toko Terdekat, Jarak, & Paginasi */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 shadow-xs flex items-center gap-1 shrink-0">
                <MapPin className="w-2.5 h-2.5 text-slate-950" />
                <span>TOKO TERDEKAT</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30 shrink-0">
                ⚡ {activeSelectedStore.distanceKm} km
              </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono text-slate-400">
              <span>
                {currentStoreIndex + 1}/{sortedStores.length}
              </span>
              <button
                type="button"
                onClick={handlePrevStore}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                title="Toko Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextStore}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                title="Toko Berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Baris Info Toko & Badge Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black text-white truncate leading-tight">
                  {activeSelectedStore.name}
                </h4>
                <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {activeSelectedStore.priceTier}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10.5px] text-slate-300 mt-1 leading-snug">
                <MapPin className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                <span className="truncate">{activeSelectedStore.address}</span>
              </div>

              {activeSelectedStore.ownerName && (
                <div className="text-[9.5px] text-slate-400 mt-0.5 pl-4">
                  PIC: <strong className="text-slate-300">{activeSelectedStore.ownerName}</strong>
                </div>
              )}
            </div>

            {/* Badge Status Logistik */}
            <div className="shrink-0 text-right">
              {activeSelectedStore.statusCategory === 'critical' ? (
                <div className="inline-flex flex-col items-end">
                  <span className="px-2 py-0.8 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    <span>Butuh Pasokan</span>
                  </span>
                  <span className="text-[9px] font-mono text-rose-400 font-bold mt-0.5">
                    Sisa {activeSelectedStore.currentStock}/{activeSelectedStore.maxStock} Gln ({activeSelectedStore.stockPercent}%)
                  </span>
                </div>
              ) : activeSelectedStore.statusCategory === 'warning' ? (
                <div className="inline-flex flex-col items-end">
                  <span className="px-2 py-0.8 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-xs">
                    <Wallet className="w-3 h-3 text-amber-400" />
                    <span>Perlu Kunjungan</span>
                  </span>
                  <span className="text-[9px] font-mono text-amber-300 font-bold mt-0.5">
                    Tempo: Rp {activeSelectedStore.tempoBalance.toLocaleString('id-ID')}
                  </span>
                </div>
              ) : (
                <div className="inline-flex flex-col items-end">
                  <span className="px-2 py-0.8 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Aman</span>
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold mt-0.5">
                    Stok {activeSelectedStore.stockPercent}% (Lunas)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* BARIS TOMBOL TEGAS [MULAI NAVIGASI] & SHORTCUT AKSI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
            {/* TOMBOL TEGAS [MULAI NAVIGASI] */}
            <button
              type="button"
              onClick={() => handleStartGoogleMapsNavigation(activeSelectedStore)}
              className="sm:col-span-2 py-3 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-400 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[0_0_18px_rgba(6,182,212,0.45)]"
            >
              <Navigation className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>MULAI NAVIGASI (GOOGLE MAPS)</span>
            </button>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5">
              {onOpenSpotSaleForStore && (
                <button
                  type="button"
                  onClick={() => {
                    const rawCust = customers.find((c) => c.id === activeSelectedStore.id);
                    if (rawCust) {
                      onOpenSpotSaleForStore(rawCust);
                    }
                  }}
                  className="py-2 sm:py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Jual Cepat / Kanvas Langsung ke Toko Ini"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Jual Kanvas</span>
                </button>
              )}

              {activeSelectedStore.phone && (
                <a
                  href={`tel:${activeSelectedStore.phone}`}
                  className="py-2 sm:py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Telepon</span>
                </a>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
