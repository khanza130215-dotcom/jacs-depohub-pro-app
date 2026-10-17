import React from 'react';
import { Droplets, Sparkles, Truck, Package, Clock, ShieldAlert } from 'lucide-react';
import { ActiveMenu } from '../types';

export interface RouteMeta {
  id: ActiveMenu;
  label: string;
  subLabel?: string;
  category: 'OPERASIONAL' | 'KEUANGAN' | 'DISTRIBUSI_DUAL_TYPE';
  badge?: string;
  description: string;
}

export const ROUTE_REGISTRY: Record<string, RouteMeta> = {
  water_fmcg: {
    id: 'water_fmcg',
    label: 'Distribusi Air & Sembako',
    subLabel: 'Depo Air RO & FMCG Dual-Type',
    category: 'DISTRIBUSI_DUAL_TYPE',
    badge: 'Dual-Type',
    description: 'Manajemen terpadu armada drop air galon RO dan pasokan sembako FMCG ke mitra toko & warung.',
  },
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    subLabel: 'Cockpit Telemetri',
    category: 'OPERASIONAL',
    description: 'Monitoring menyeluruh kinerja depo, ritase, dan penjualan.',
  },
  'driver-mobile': {
    id: 'driver-mobile',
    label: 'Sales & Distribusi',
    subLabel: 'NexaField Mobile',
    category: 'OPERASIONAL',
    badge: 'NexaField',
    description: 'Portal supir lapangan untuk pengantaran, rute toko, dan penerimaan order spot.',
  },
};

export const NavigationPlaceholders: React.FC<{
  menuId: ActiveMenu;
  onNavigate?: (menu: ActiveMenu) => void;
}> = ({ menuId, onNavigate }) => {
  const meta = ROUTE_REGISTRY[menuId] || {
    id: menuId,
    label: menuId,
    category: 'OPERASIONAL',
    description: 'Modul terintegrasi JacS DepoHub Pro.',
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">{meta.label}</h2>
            {meta.subLabel && <p className="text-xs text-cyan-400">{meta.subLabel}</p>}
          </div>
        </div>
        {meta.badge && (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            {meta.badge}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-400 leading-relaxed">{meta.description}</p>

      {onNavigate && (
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('water_fmcg')}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            Buka Distribusi Air &amp; Sembako (Dual-Type)
          </button>
        </div>
      )}
    </div>
  );
};

export default NavigationPlaceholders;
