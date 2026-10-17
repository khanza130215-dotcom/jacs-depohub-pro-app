import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Sparkles,
  Eye,
  EyeOff,
  UserCog,
  Store,
  Terminal,
} from 'lucide-react';
import {
  UserRole,
  getCurrentRole,
  setCurrentRole,
  validateRolePin,
  getRoleMeta,
  ROLE_DEFAULT_PINS,
} from '../utils/rbac';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChanged: (newRole: UserRole) => void;
  onShowToast?: (message: string) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChanged,
  onShowToast,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedRole(currentRole);
      setPinInput('');
      setErrorMessage(null);
      setShowPin(false);
    }
  }, [isOpen, currentRole]);

  if (!isOpen) return null;

  const handleSelectRoleCard = (role: UserRole) => {
    setSelectedRole(role);
    setPinInput('');
    setErrorMessage(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (selectedRole === currentRole) {
      onClose();
      return;
    }

    // Role Cashier tidak membutuhkan verifikasi PIN
    if (selectedRole === 'CASHIER') {
      setCurrentRole('CASHIER');
      onRoleChanged('CASHIER');
      if (onShowToast) {
        onShowToast('✓ Beralih ke Otoritas: [Role: Admin Kasir]');
      }
      onClose();
      return;
    }

    if (!pinInput.trim()) {
      setErrorMessage(
        `Masukkan PIN untuk verifikasi role ${selectedRole === 'DEVELOPER' ? 'Developer' : 'Owner'}.`
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const isValid = validateRolePin(selectedRole, pinInput);
      setIsSubmitting(false);

      if (isValid) {
        setCurrentRole(selectedRole);
        onRoleChanged(selectedRole);
        const meta = getRoleMeta(selectedRole);
        if (onShowToast) {
          onShowToast(`✓ Berhasil switch ke ${meta.badgeText}!`);
        }
        onClose();
      } else {
        setErrorMessage(
          selectedRole === 'DEVELOPER'
            ? 'PIN Developer salah! (Default PIN: 9999)'
            : 'PIN Owner salah! (Default PIN: 1234)'
        );
      }
    }, 250);
  };

  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 8) {
      setPinInput((prev) => prev + digit);
      setErrorMessage(null);
    }
  };

  const handleKeypadBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Switch Otoritas Role Pengguna</span>
              </h3>
              <p className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                Pilih tingkatan wewenang hak akses navigasi sistem JacS DepoHub
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Current Role */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-400 font-bold">Role Sesi Saat Ini:</span>
            <span
              className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs ${getRoleMeta(currentRole).bgClass}`}
            >
              {getRoleMeta(currentRole).badgeText}
            </span>
          </div>

          {/* Role Cards List */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-slate-800 dark:text-slate-300 block uppercase tracking-wider">
              Pilih Otoritas Akses Tujuan:
            </label>

            {/* 1. CASHIER CARD */}
            <div
              onClick={() => handleSelectRoleCard('CASHIER')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                selectedRole === 'CASHIER'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'border-slate-300 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === 'CASHIER'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Store className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-black text-slate-900 dark:text-white">Admin / Kasir Depo</strong>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                      CASHIER
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Tanpa PIN (Bebas)</span>
                </div>
                <p className="text-[10.5px] text-slate-700 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  Akses operasional: Kasir POS, Sirkulasi Galon 19L, Sales &amp; Distribusi, Armada, Master Data, SDM, WhatsApp. Menu manajerial &amp; keuangan otomatis terkunci.
                </p>
              </div>
            </div>

            {/* 2. OWNER CARD */}
            <div
              onClick={() => handleSelectRoleCard('OWNER')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                selectedRole === 'OWNER'
                  ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'border-slate-300 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === 'OWNER'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-black text-slate-900 dark:text-white">Pemilik Depo (Owner)</strong>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold">
                      OWNER
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold">PIN: 1234</span>
                </div>
                <p className="text-[10.5px] text-slate-700 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  Membuka Beranda, Executive Manager (Audit AI), Pelayanan Pesanan, Radar Live, dan Buku Piutang. (Tidak memiliki akses Super Admin ROOT).
                </p>
              </div>
            </div>

            {/* 3. DEVELOPER CARD */}
            <div
              onClick={() => handleSelectRoleCard('DEVELOPER')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                selectedRole === 'DEVELOPER'
                  ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'border-slate-300 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === 'DEVELOPER'
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Terminal className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-black text-slate-900 dark:text-white">Developer (Root System)</strong>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-800 dark:text-rose-300 font-mono font-bold">
                      DEVELOPER
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-mono font-bold">PIN: 9999</span>
                </div>
                <p className="text-[10.5px] text-slate-700 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  Hak akses tertinggi tak terbatas: Seluruh modul operasional &amp; eksekutif, serta hak akses penuh ke <strong>Super Admin 🔒 ROOT</strong>, Webhook &amp; AI System Doctor.
                </p>
              </div>
            </div>
          </div>

          {/* PIN Input Section (Active if Owner or Developer selected) */}
          {selectedRole !== 'CASHIER' && (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Masukkan PIN Otoritas {selectedRole === 'DEVELOPER' ? 'Developer' : 'Owner'}:</span>
                </span>
                <span className="text-[10.5px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                  Default PIN: <strong className="text-slate-900 dark:text-white font-bold">{selectedRole === 'DEVELOPER' ? '9999' : '1234'}</strong>
                </span>
              </div>

              {/* Input Box with Eye */}
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  id="input-role-switcher-pin"
                  placeholder="Ketik PIN (4 digit)..."
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                  autoFocus
                  maxLength={10}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-center font-mono text-base tracking-widest text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-hidden font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                  title={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Numeric Keypad Helper */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') setPinInput('');
                      else if (k === '⌫') handleKeypadBackspace();
                      else handleKeypadPress(k);
                    }}
                    className="py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 text-xs font-mono font-bold text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs"
                  >
                    {k}
                  </button>
                ))}
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
              selectedRole === 'CASHIER'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : selectedRole === 'OWNER'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Memverifikasi...'
                : selectedRole === 'CASHIER'
                ? '✓ Beralih ke Admin Kasir'
                : selectedRole === 'OWNER'
                ? '✓ Masuk sebagai Owner'
                : '✓ Masuk sebagai Developer'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
