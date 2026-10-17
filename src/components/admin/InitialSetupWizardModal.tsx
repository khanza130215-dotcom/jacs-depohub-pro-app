import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  saveMasterSuperAdmin,
  generateLicenseKey,
  getHardwareFingerprint,
} from '../../utils/rootAuthority';

interface InitialSetupWizardModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCompleted: (ownerName: string) => void;
}

export const InitialSetupWizardModal: React.FC<InitialSetupWizardModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [ownerName, setOwnerName] = useState('');
  const [masterEmail, setMasterEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePinInput = (val: string, setter: (v: string) => void) => {
    const numeric = val.replace(/\D/g, '').slice(0, 6);
    setter(numeric);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = ownerName.trim();
    const cleanEmail = masterEmail.trim();

    if (!cleanName || cleanName.length < 3) {
      setError('Nama Pemilik Depo minimal 3 karakter.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Format Email Master tidak valid. Contoh: owner@depojacs.com');
      return;
    }

    if (pin.length !== 6) {
      setError('PIN Keamanan Root harus tepat 6 digit angka.');
      return;
    }

    if (pin !== confirmPin) {
      setError('Konfirmasi PIN tidak cocok dengan PIN yang dibuat.');
      return;
    }

    setIsSubmitting(true);

    try {
      saveMasterSuperAdmin({
        ownerName: cleanName,
        masterEmail: cleanEmail,
        pin,
        licenseTier: 'Enterprise Lifetime Pro',
      });

      setTimeout(() => {
        setIsSubmitting(false);
        onCompleted(cleanName);
      }, 400);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Gagal menyimpan otorisasi Master Super Admin.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-600/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="p-4 bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border-b border-rose-600/40 relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.5)] border border-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs tracking-wider">
                  FIRST-RUN ROOT SETUP
                </span>
                <span className="text-[10px] text-rose-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Otoritas Tingkat Tertinggi
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide mt-0.5">
                Setup Otoritas Pemilik Depo (Root Admin)
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-[11px]">
                Selamat Datang di Sistem Manajemen Depo Air Minum JacS Enterprise
              </p>
              <p className="text-[10.5px] text-rose-200/90 mt-0.5">
                Sebagai pemilik depo, Anda perlu mendaftarkan identitas Master Super Admin dan membuat
                <strong> PIN Keamanan 6 Digit</strong> untuk mengunci akses konfigurasi inti, lisensi sistem, dan perbaikan database.
              </p>
            </div>
          </div>

          {/* Form Field 1: Nama Pemilik */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Nama Lengkap Pemilik Depo:</span>
              <span className="text-rose-400 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: H. Bambang Sukoco, S.T."
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm text-white placeholder-slate-500 outline-hidden transition-all"
            />
          </div>

          {/* Form Field 2: Email Master */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>Email Resmi Pemilik (Master Email):</span>
              <span className="text-rose-400 font-bold">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="owner@depojacs.com"
              value={masterEmail}
              onChange={(e) => setMasterEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm text-white placeholder-slate-500 outline-hidden transition-all"
            />
            <p className="text-[10px] text-slate-400">
              Digunakan untuk pemulihan lisensi darurat dan rekaman audit resmi.
            </p>
          </div>

          {/* Form Field 3: Buat PIN Root 6 Digit */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Buat PIN Keamanan Root (6 Digit Angka):</span>
                <span className="text-rose-400 font-bold">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[10.5px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPin ? 'Sembunyikan' : 'Tampilkan Angka'}</span>
              </button>
            </div>

            {/* Visual 6-Digit Display */}
            <div className="flex justify-center gap-2 my-1">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const digit = pin[idx];
                return (
                  <div
                    key={idx}
                    className={`w-10 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                      digit !== undefined
                        ? 'border-rose-500 bg-rose-600/20 text-rose-300 shadow-[0_0_12px_rgba(225,29,72,0.35)] text-lg font-black'
                        : 'border-slate-800 bg-slate-950 text-slate-600'
                    }`}
                  >
                    {digit !== undefined ? (showPin ? digit : '●') : '○'}
                  </div>
                );
              })}
            </div>

            <input
              type={showPin ? 'text' : 'password'}
              maxLength={6}
              inputMode="numeric"
              placeholder="Ketik 6 digit PIN (contoh: 123456)"
              value={pin}
              onChange={(e) => handlePinInput(e.target.value, setPin)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono tracking-widest text-base font-bold text-white focus:border-rose-500 outline-hidden"
            />
          </div>

          {/* Form Field 4: Konfirmasi PIN */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-rose-400" />
              <span>Konfirmasi Ulang PIN 6 Digit:</span>
              <span className="text-rose-400 font-bold">*</span>
            </label>
            <input
              type={showPin ? 'text' : 'password'}
              maxLength={6}
              inputMode="numeric"
              placeholder="Ulangi 6 digit PIN di atas"
              value={confirmPin}
              onChange={(e) => handlePinInput(e.target.value, setConfirmPin)}
              className={`w-full px-3.5 py-2 rounded-xl bg-slate-950 border text-center font-mono tracking-widest text-base font-bold text-white outline-hidden ${
                confirmPin.length === 6 && confirmPin !== pin
                  ? 'border-rose-500 text-rose-400 ring-1 ring-rose-500'
                  : confirmPin.length === 6 && confirmPin === pin
                  ? 'border-emerald-500 text-emerald-400 ring-1 ring-emerald-500'
                  : 'border-slate-700 focus:border-rose-500'
              }`}
            />
            {confirmPin.length === 6 && confirmPin === pin && (
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>PIN Cocok dan Siap Digunakan</span>
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* License & Device Identity Note */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-[10px] text-slate-400">
            <div className="flex items-center justify-between font-mono">
              <span>Hardware Device ID:</span>
              <strong className="text-slate-300">{getHardwareFingerprint()}</strong>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span>Tingkat Lisensi:</span>
              <strong className="text-amber-400 font-bold">ENTERPRISE ROOT EDITION</strong>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || pin.length !== 6 || pin !== confirmPin}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
              pin.length === 6 && pin === confirmPin && !isSubmitting
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isSubmitting ? 'MENYIMPAN OTORITAS ROOT...' : 'AKTIFKAN OTORITAS ROOT SEKARANG'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
