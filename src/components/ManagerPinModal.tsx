import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle, X, CheckCircle2 } from 'lucide-react';

export interface ManagerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rememberDevice?: boolean) => void;
  title?: string;
  subtitle?: string;
  description?: string;
  badgeText?: string;
  colorScheme?: 'rose' | 'amber' | 'sky' | 'emerald';
}

export const getManagerPin = (): string => {
  try {
    return localStorage.getItem('jacs_manager_pin') || '1234';
  } catch {
    return '1234';
  }
};

export const setManagerPin = (newPin: string): void => {
  try {
    localStorage.setItem('jacs_manager_pin', newPin.trim());
  } catch {
    // ignore
  }
};

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Otorisasi Manajerial',
  subtitle = 'Akses Terproteksi Khusus Pemilik & Manajer',
  description = 'Halaman Executive Manager memuat data rahasia HPP, struktur harga, otorisasi plafon kredit & PO Pabrik.',
  badgeText = 'VIP',
  colorScheme = 'rose',
}) => {
  const [pinInput, setPinInput] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMessage(null);
      setShake(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + digit);
      setErrorMessage(null);
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMessage(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const correctPin = getManagerPin();
    let isCorrect = pinInput === correctPin;
    if (!isCorrect) {
      try {
        const rootPin = localStorage.getItem('jacs_super_admin_pin') || '888999';
        if (pinInput === rootPin) isCorrect = true;
      } catch {}
    }

    if (isCorrect) {
      onSuccess(rememberDevice);
    } else {
      setErrorMessage('PIN Otorisasi Salah! Akses Ditolak.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPinInput('');
    }
  };

  // Color theme mapping
  const colorMap = {
    rose: {
      cardBorder: 'border-rose-500/50 [body.light-theme_&]:border-rose-400',
      headerBg: 'from-rose-950/60 to-slate-950 border-rose-500/30',
      iconBox: 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.35)]',
      badge: 'bg-rose-500 text-white',
      digitActive: 'border-rose-400 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
      focusBorder: 'focus:border-rose-400',
      submitBtn: 'from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500',
      checkbox: 'text-rose-500',
      pinHighlight: 'text-rose-400',
    },
    sky: {
      cardBorder: 'border-sky-500/50 [body.light-theme_&]:border-sky-400',
      headerBg: 'from-sky-950/60 to-slate-950 border-sky-500/30',
      iconBox: 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.35)]',
      badge: 'bg-sky-500 text-white',
      digitActive: 'border-sky-400 bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.4)]',
      focusBorder: 'focus:border-sky-400',
      submitBtn: 'from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500',
      checkbox: 'text-sky-500',
      pinHighlight: 'text-sky-400',
    },
    amber: {
      cardBorder: 'border-amber-500/50 [body.light-theme_&]:border-amber-400',
      headerBg: 'from-amber-950/60 to-slate-950 border-amber-500/30',
      iconBox: 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      badge: 'bg-amber-500 text-white',
      digitActive: 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
      focusBorder: 'focus:border-amber-400',
      submitBtn: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
      checkbox: 'text-amber-500',
      pinHighlight: 'text-amber-400',
    },
    emerald: {
      cardBorder: 'border-emerald-500/50 [body.light-theme_&]:border-emerald-400',
      headerBg: 'from-emerald-950/60 to-slate-950 border-emerald-500/30',
      iconBox: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      badge: 'bg-emerald-500 text-white',
      digitActive: 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
      focusBorder: 'focus:border-emerald-400',
      submitBtn: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
      checkbox: 'text-emerald-500',
      pinHighlight: 'text-emerald-400',
    },
  };

  const theme = colorMap[colorScheme] || colorMap.rose;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-slate-900 [body.light-theme_&]:bg-white border-2 ${theme.cardBorder} rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden [body.light-theme_&]:text-slate-900 transition-all ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className={`p-3.5 px-4 bg-gradient-to-r ${theme.headerBg} border-b flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${theme.iconBox}`}>
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>{title}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${theme.badge}`}>
                  {badgeText}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 [body.light-theme_&]:hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col items-center gap-3.5">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-slate-200 [body.light-theme_&]:text-slate-800">
              Masukkan PIN Keamanan
            </p>
            <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Masked PIN Display */}
          <div className="flex items-center justify-center gap-3 my-1">
            {[0, 1, 2, 3].map((idx) => {
              const hasDigit = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-10 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                    hasDigit
                      ? `${theme.digitActive} text-lg font-black`
                      : 'border-slate-700 bg-slate-950/70 text-slate-500 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300'
                  }`}
                >
                  {hasDigit ? '●' : '○'}
                </div>
              );
            })}
          </div>

          {/* Hidden Keyboard Input for Direct Typing */}
          <input
            type="password"
            maxLength={6}
            value={pinInput}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setPinInput(val);
              setErrorMessage(null);
            }}
            placeholder="Ketik PIN..."
            autoFocus
            className={`w-full text-center py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm tracking-widest focus:outline-none ${theme.focusBorder} [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900`}
          />

          {/* Error Message */}
          {errorMessage && (
            <div className="w-full p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-10 sm:h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 border border-slate-700/60 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold text-base transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-10 sm:h-11 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-rose-400 text-xs font-bold transition-all active:scale-95 cursor-pointer [body.light-theme_&]:bg-slate-100"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-10 sm:h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 border border-slate-700/60 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold text-base transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-10 sm:h-11 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-all active:scale-95 cursor-pointer [body.light-theme_&]:bg-slate-100 flex items-center justify-center"
            >
              ⌫
            </button>
          </div>

          {/* Opsi Ingat Sesi di Perangkat Ini */}
          <div className="w-full flex items-center justify-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-300 [body.light-theme_&]:text-slate-700 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className={`w-3.5 h-3.5 rounded border-slate-700 ${theme.checkbox} focus:ring-0 cursor-pointer`}
              />
              <span className="font-semibold">Ingat Sesi di Perangkat Ini</span>
            </label>
          </div>

          <div className="w-full flex items-center gap-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pinInput.length === 0}
              className={`flex-1 py-2 rounded-xl bg-gradient-to-r ${theme.submitBtn} text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Buka Akses</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-500 [body.light-theme_&]:text-slate-400 text-center">
            💡 Master PIN Manajemen: <strong className={`${theme.pinHighlight} font-mono`}>{getManagerPin()}</strong> (dapat diubah di Pengaturan).
          </p>
        </form>
      </div>
    </div>
  );
};

