import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, AlertCircle, X, ShieldAlert, UserCheck } from 'lucide-react';
import { getSuperAdminPin } from '../utils/depoProfile';
import { getMasterSuperAdmin, verifySuperAdminPin } from '../utils/rootAuthority';

interface SuperAdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenFirstRunWizard?: () => void;
}

export const SuperAdminPinModal: React.FC<SuperAdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenFirstRunWizard,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const masterAdmin = getMasterSuperAdmin();

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

    if (verifySuperAdminPin(pinInput)) {
      onSuccess();
    } else {
      setErrorMessage('PIN Super Admin Salah! Akses Root Ditolak.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-slate-900 [body.light-theme_&]:bg-white border-2 border-rose-600/70 [body.light-theme_&]:border-rose-500 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden [body.light-theme_&]:text-slate-900 transition-all ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="p-3.5 px-4 bg-gradient-to-r from-red-950/80 to-slate-950 border-b border-rose-600/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/25 text-rose-400 border border-rose-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.4)]">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Super Admin Access</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono font-black">
                  ROOT
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                Otorisasi Hak Tertinggi Sistem & Konfigurasi Inti
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col items-center gap-3">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-slate-200 [body.light-theme_&]:text-slate-800">
              Masukkan PIN Keamanan Root (6 Digit)
            </p>
            {masterAdmin ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[10.5px]">
                <UserCheck className="w-3 h-3 text-rose-400" />
                <span>Otoritas Pemilik: <strong>{masterAdmin.ownerName}</strong></span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600">
                Modul <strong>Super Admin</strong> memuat profil resmi depo, perbankan/rekening, server health, dan master security PIN.
              </p>
            )}
          </div>

          {/* Masked PIN Display (6 Slots) */}
          <div className="flex items-center justify-center gap-2 my-1">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const hasDigit = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                    hasDigit
                      ? 'border-rose-500 bg-rose-600/25 text-rose-300 shadow-[0_0_12px_rgba(225,29,72,0.45)] text-lg font-black'
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
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPinInput(val);
              setErrorMessage(null);
            }}
            placeholder="Ketik 6 digit PIN..."
            autoFocus
            className="w-full text-center py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-rose-500 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
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
                className="h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 border border-slate-700/60 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold text-base transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-rose-400 text-xs font-bold transition-all active:scale-95 cursor-pointer [body.light-theme_&]:bg-slate-100"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 border border-slate-700/60 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold text-base transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-all active:scale-95 cursor-pointer [body.light-theme_&]:bg-slate-100 flex items-center justify-center"
            >
              ⌫
            </button>
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
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Buka Super Admin</span>
            </button>
          </div>

          {!masterAdmin && onOpenFirstRunWizard && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFirstRunWizard();
              }}
              className="text-[10.5px] text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
            >
              Belum setup akun Root? Buka Setup Otoritas Pemilik
            </button>
          )}

          <p className="text-[10px] text-slate-500 [body.light-theme_&]:text-slate-400 text-center">
            🔒 Otorisasi Level ROOT • JacS Enterprise Architecture
          </p>
        </form>
      </div>
    </div>
  );
};
