import React, { useEffect } from 'react';
import { SettlementView } from './SettlementView';
import { OrderItem, ArmadaItem, EmployeeItem, GallonStock, DriverSetoranItem, ReceivableItem } from '../types';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders?: OrderItem[];
  armadaList?: ArmadaItem[];
  employees?: EmployeeItem[];
  gallonCirculation?: GallonStock[];
  driverSetoran?: DriverSetoranItem[];
  receivables?: ReceivableItem[];
  dailyReconciliationAddedCash?: number;
  onBookCommission?: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  armadaList = [],
  employees = [],
  gallonCirculation = [],
  driverSetoran = [],
  receivables = [],
  dailyReconciliationAddedCash = 0,
  onBookCommission,
}) => {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-5xl h-[92vh] max-h-[92vh] bg-slate-950 [body.light-theme_&]:bg-slate-50 border-2 border-cyan-400 rounded-2xl p-3 shadow-2xl flex flex-col overflow-hidden text-slate-100 [body.light-theme_&]:text-slate-900">
        <SettlementView
          orders={orders}
          armadaList={armadaList}
          employees={employees}
          gallonCirculation={gallonCirculation}
          driverSetoran={driverSetoran}
          receivables={receivables}
          dailyReconciliationAddedCash={dailyReconciliationAddedCash}
          onBookCommission={onBookCommission}
          onClose={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};
