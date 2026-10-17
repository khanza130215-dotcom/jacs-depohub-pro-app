import React, { useState } from 'react';
import { EmployeeItem, CommissionSchemeConfig } from '../types';
import { EMPLOYEES, DEFAULT_COMMISSION_CONFIG } from '../data/mockData';

interface HrViewProps {
  onNavigateWhatsApp?: () => void;
  commissionConfig?: CommissionSchemeConfig;
  onUpdateCommissionConfig?: (newConfig: CommissionSchemeConfig) => void;
  employees?: EmployeeItem[];
  onUpdateEmployees?: (newEmployees: EmployeeItem[]) => void;
}

export const calculateEmployeeCommissionDetails = (
  emp: EmployeeItem,
  config: CommissionSchemeConfig
) => {
  const gallons = emp.deliveredGallons ?? emp.totalGallonsDeliveredToday ?? 0;
  const bottles = emp.deliveredBottles ?? 0;
  const cups = emp.deliveredCups ?? 0;

  const baseGallon = gallons * config.gallonBaseRate;
  const baseBottle = bottles * config.bottleBaseRate;
  const baseCup = cups * config.cupBaseRate;
  const totalBase = baseGallon + baseBottle + baseCup;

  const role = emp.role;
  const isSalesman = role === 'Salesman' || role.toLowerCase().includes('sales');
  const isCourier =
    role === 'Supir Armada' ||
    role === 'Kurir Motor Roda 3 (Viar)' ||
    role.toLowerCase().includes('kurir') ||
    role.toLowerCase().includes('supir') ||
    role.toLowerCase().includes('rider');

  let sharePercent = 100;
  let roleLabel = 'Tarif Normal';
  if (isSalesman) {
    sharePercent = config.salesmanSharePercent; // 25%
    roleLabel = `Salesman (${sharePercent}%)`;
  } else if (isCourier) {
    sharePercent = config.courierSharePercent; // 75%
    roleLabel = `Pengantar/Kurir (${sharePercent}%)`;
  }

  const netGallon = Math.round(baseGallon * (sharePercent / 100));
  const netBottle = Math.round(baseBottle * (sharePercent / 100));
  const netCup = Math.round(baseCup * (sharePercent / 100));
  const netCommission = Math.round(totalBase * (sharePercent / 100));

  return {
    gallons,
    bottles,
    cups,
    baseGallon,
    baseBottle,
    baseCup,
    totalBase,
    sharePercent,
    roleLabel,
    netGallon,
    netBottle,
    netCup,
    netCommission: netCommission > 0 ? netCommission : emp.dailyCommission,
    isSalesman,
    isCourier,
  };
};

export const generateStaffWhatsAppMessage = (
  emp: EmployeeItem,
  config: CommissionSchemeConfig
) => {
  const comm = calculateEmployeeCommissionDetails(emp, config);
  const totalTakeHome = emp.baseSalaryDaily + comm.netCommission;
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const salesmanShare = config.salesmanSharePercent;
  const courierShare = config.courierSharePercent;

  return `*JACS DEPOHUB - SLIP KOMISI & REKAP PENGANTARAN*
📅 Tanggal: ${todayStr}
👤 Staf: *${emp.name}*
🏷️ Jabatan: ${emp.role}
🚚 Armada/Wilayah: ${emp.assignedArmada || '-'}
⏰ Presensi: ${emp.attendanceStatus} (${emp.checkInTime || '-'})

📦 *Realisasi Pengantaran Hari Ini (3 Kategori Grosir):*
• [Galon 19L]: *${comm.gallons}* tabung
• [Air Kemasan Botol]: *${comm.bottles}* dus (Karton)
• [Air Kemasan Gelas/Cup]: *${comm.cups}* dus (Karton)

⚖️ *Skema Komisi Berjenjang (Dasar per Dus/Galon):*
• Galon: Rp ${config.gallonBaseRate.toLocaleString('id-ID')}/tbg | Dus Botol: Rp ${config.bottleBaseRate.toLocaleString('id-ID')}/dus | Dus Cup: Rp ${config.cupBaseRate.toLocaleString('id-ID')}/dus
• Pembagian Otomatis: Salesman (${salesmanShare}%) vs Kurir/Viar (${courierShare}%)
• Status Hak Staf: *${comm.roleLabel}* (Porsi ${comm.sharePercent}%)

💰 *Rincian Nilai Komisi Hak Staf:*
• Galon (${comm.sharePercent}%): ${comm.gallons} tbg × Rp ${Math.round(config.gallonBaseRate * (comm.sharePercent / 100)).toLocaleString('id-ID')} = *Rp ${comm.netGallon.toLocaleString('id-ID')}*
• Dus Botol (${comm.sharePercent}%): ${comm.bottles} dus × Rp ${Math.round(config.bottleBaseRate * (comm.sharePercent / 100)).toLocaleString('id-ID')}/dus = *Rp ${comm.netBottle.toLocaleString('id-ID')}*
• Dus Cup (${comm.sharePercent}%): ${comm.cups} dus × Rp ${Math.round(config.cupBaseRate * (comm.sharePercent / 100)).toLocaleString('id-ID')}/dus = *Rp ${comm.netCup.toLocaleString('id-ID')}*
────────────────────────
💵 *Subtotal Komisi:* Rp ${comm.netCommission.toLocaleString('id-ID')}
💼 *Gaji Pokok Harian:* Rp ${emp.baseSalaryDaily.toLocaleString('id-ID')}
⭐️ *TOTAL HAK DITERIMA: Rp ${totalTakeHome.toLocaleString('id-ID')}*

Terima kasih atas dedikasi dan kerja keras Anda menjaga pasokan air minum pelanggan depo! 🙏`;
};

export const HrView: React.FC<HrViewProps> = ({
  commissionConfig = DEFAULT_COMMISSION_CONFIG,
  employees: propEmployees,
  onUpdateEmployees,
}) => {
  // Read saved commission config from localStorage or props
  const [activeConfig, setActiveConfig] = useState<CommissionSchemeConfig>(() => {
    try {
      const saved = localStorage.getItem('argus_commission_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return commissionConfig;
  });

  // Sync when prop updates from Master Data
  React.useEffect(() => {
    if (commissionConfig) {
      setActiveConfig(commissionConfig);
    }
  }, [commissionConfig]);

  const [internalEmployees, setInternalEmployees] = useState<EmployeeItem[]>(EMPLOYEES);

  const employees = propEmployees || internalEmployees;
  const setEmployees = (newVal: React.SetStateAction<EmployeeItem[]>) => {
    if (typeof newVal === 'function') {
      const updated = newVal(employees);
      if (onUpdateEmployees) onUpdateEmployees(updated);
      setInternalEmployees(updated);
    } else {
      if (onUpdateEmployees) onUpdateEmployees(newVal);
      setInternalEmployees(newVal);
    }
  };
  const [selectedRole, setSelectedRole] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [search, setSearch] = useState('');
  const [printedSlip, setPrintedSlip] = useState<EmployeeItem | null>(null);
  const [previewWaEmployee, setPreviewWaEmployee] = useState<EmployeeItem | null>(null);
  const [waCopied, setWaCopied] = useState(false);

  // Modal State for Tambah / Edit Karyawan
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formNik, setFormNik] = useState('');
  const [formBirthPlaceDate, setFormBirthPlaceDate] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmergencyContact, setFormEmergencyContact] = useState('');
  const [formRole, setFormRole] = useState<EmployeeItem['role']>('Supir Armada');
  const [formEmploymentStatus, setFormEmploymentStatus] = useState<EmployeeItem['employmentStatus']>('Tetap');
  const [formAssignedArmada, setFormAssignedArmada] = useState('Armada 01 (Engkel B 9241 KDA)');
  const [formDriverLicenseNumber, setFormDriverLicenseNumber] = useState('');
  const [formDriverLicenseExpiry, setFormDriverLicenseExpiry] = useState('');
  const [formBaseSalaryDaily, setFormBaseSalaryDaily] = useState<number>(120000);
  const [formRatePerTripOrGallon, setFormRatePerTripOrGallon] = useState<number>(750);
  const [formBankAccount, setFormBankAccount] = useState('');
  // 3 Volume Categories
  const [formDeliveredGallons, setFormDeliveredGallons] = useState<number>(0);
  const [formDeliveredBottles, setFormDeliveredBottles] = useState<number>(0);
  const [formDeliveredCups, setFormDeliveredCups] = useState<number>(0);

  const filteredEmployees = employees.filter((emp) => {
    const matchRole = selectedRole === 'Semua' ? true : emp.role === selectedRole;
    const matchStatus = selectedStatus === 'Semua' ? true : emp.attendanceStatus === selectedStatus;
    const matchSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase()) ||
      (emp.nik && emp.nik.includes(search));
    return matchRole && matchStatus && matchSearch;
  });

  const totalHadir = employees.filter((e) => e.attendanceStatus === 'Hadir').length;
  const totalIzin = employees.filter((e) => e.attendanceStatus !== 'Hadir').length;
  const totalGallonsDelivered = employees.reduce((sum, e) => sum + (e.deliveredGallons ?? e.totalGallonsDeliveredToday ?? 0), 0);
  const totalBottlesDelivered = employees.reduce((sum, e) => sum + (e.deliveredBottles ?? 0), 0);
  const totalCupsDelivered = employees.reduce((sum, e) => sum + (e.deliveredCups ?? 0), 0);

  const totalCommission = employees.reduce((sum, e) => {
    const comm = calculateEmployeeCommissionDetails(e, activeConfig);
    return sum + comm.netCommission;
  }, 0);

  const handleUpdateStatus = (id: string, newStatus: EmployeeItem['attendanceStatus']) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const now = new Date();
          const checkIn = newStatus === 'Hadir' ? `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB` : undefined;
          return { ...e, attendanceStatus: newStatus, checkInTime: checkIn };
        }
        return e;
      })
    );
  };

  const handleOpenAddModal = () => {
    setEditingEmployeeId(null);
    setFormName('');
    setFormNik('');
    setFormBirthPlaceDate('');
    setFormAddress('');
    setFormPhone('');
    setFormEmergencyContact('');
    setFormRole('Supir Armada');
    setFormEmploymentStatus('Tetap');
    setFormAssignedArmada('Armada 01 (Engkel B 9241 KDA)');
    setFormDriverLicenseNumber('');
    setFormDriverLicenseExpiry('');
    setFormBaseSalaryDaily(120000);
    setFormRatePerTripOrGallon(750);
    setFormBankAccount('');
    setFormDeliveredGallons(0);
    setFormDeliveredBottles(0);
    setFormDeliveredCups(0);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditModal = (emp: EmployeeItem) => {
    setEditingEmployeeId(emp.id);
    setFormName(emp.name);
    setFormNik(emp.nik || '');
    setFormBirthPlaceDate(emp.birthPlaceDate || '');
    setFormAddress(emp.address || '');
    setFormPhone(emp.phone);
    setFormEmergencyContact(emp.emergencyContact || '');
    setFormRole(emp.role);
    setFormEmploymentStatus(emp.employmentStatus || 'Tetap');
    setFormAssignedArmada(emp.assignedArmada || 'Standby Depo');
    setFormDriverLicenseNumber(emp.driverLicenseNumber || '');
    setFormDriverLicenseExpiry(emp.driverLicenseExpiry || '');
    setFormBaseSalaryDaily(emp.baseSalaryDaily);
    setFormRatePerTripOrGallon(emp.ratePerTripOrGallon);
    setFormBankAccount(emp.bankAccount || '');
    setFormDeliveredGallons(emp.deliveredGallons ?? emp.totalGallonsDeliveredToday ?? 0);
    setFormDeliveredBottles(emp.deliveredBottles ?? 0);
    setFormDeliveredCups(emp.deliveredCups ?? 0);
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      alert('Nama lengkap karyawan wajib diisi!');
      return;
    }

    if (formNik.trim().length > 0 && formNik.trim().length !== 16) {
      if (!confirm('NIK KTP umumnya terdiri dari 16 digit. Lanjutkan penyimpanan?')) {
        return;
      }
    }

    // Hitung komisi baru berdasarkan volume muatan
    const tempEmp = {
      role: formRole,
      deliveredGallons: formDeliveredGallons,
      totalGallonsDeliveredToday: formDeliveredGallons,
      deliveredBottles: formDeliveredBottles,
      deliveredCups: formDeliveredCups,
      dailyCommission: 0,
    } as EmployeeItem;
    const computedComm = calculateEmployeeCommissionDetails(tempEmp, activeConfig);

    if (editingEmployeeId) {
      // Update existing
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === editingEmployeeId) {
            return {
              ...emp,
              name: formName.trim(),
              nik: formNik.trim(),
              birthPlaceDate: formBirthPlaceDate.trim(),
              address: formAddress.trim(),
              phone: formPhone.trim(),
              emergencyContact: formEmergencyContact.trim(),
              role: formRole,
              employmentStatus: formEmploymentStatus,
              assignedArmada: formAssignedArmada,
              driverLicenseNumber:
                formRole === 'Supir Armada' || formRole === 'Kurir Motor Roda 3 (Viar)'
                  ? formDriverLicenseNumber.trim()
                  : undefined,
              driverLicenseExpiry:
                formRole === 'Supir Armada' || formRole === 'Kurir Motor Roda 3 (Viar)'
                  ? formDriverLicenseExpiry.trim()
                  : undefined,
              baseSalaryDaily: formBaseSalaryDaily,
              ratePerTripOrGallon: formRatePerTripOrGallon,
              bankAccount: formBankAccount.trim(),
              deliveredGallons: formDeliveredGallons,
              totalGallonsDeliveredToday: formDeliveredGallons,
              deliveredBottles: formDeliveredBottles,
              deliveredCups: formDeliveredCups,
              dailyCommission: computedComm.netCommission,
            };
          }
          return emp;
        })
      );
      setNotificationMsg(`✓ Data Karyawan "${formName}" berhasil diperbarui!`);
    } else {
      // Add new
      const nextNum = employees.length + 1;
      const newId = `EMP-${String(nextNum).padStart(3, '0')}`;
      const newEmp: EmployeeItem = {
        id: newId,
        name: formName.trim(),
        nik: formNik.trim(),
        birthPlaceDate: formBirthPlaceDate.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        emergencyContact: formEmergencyContact.trim(),
        role: formRole,
        employmentStatus: formEmploymentStatus,
        assignedArmada: formAssignedArmada,
        driverLicenseNumber:
          formRole === 'Supir Armada' || formRole === 'Kurir Motor Roda 3 (Viar)'
            ? formDriverLicenseNumber.trim()
            : undefined,
        driverLicenseExpiry:
          formRole === 'Supir Armada' || formRole === 'Kurir Motor Roda 3 (Viar)'
            ? formDriverLicenseExpiry.trim()
            : undefined,
        baseSalaryDaily: formBaseSalaryDaily,
        ratePerTripOrGallon: formRatePerTripOrGallon,
        bankAccount: formBankAccount.trim(),
        attendanceStatus: 'Hadir',
        checkInTime: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB`,
        totalTripsToday: formDeliveredGallons > 0 ? 1 : 0,
        totalGallonsDeliveredToday: formDeliveredGallons,
        deliveredGallons: formDeliveredGallons,
        deliveredBottles: formDeliveredBottles,
        deliveredCups: formDeliveredCups,
        dailyCommission: computedComm.netCommission,
      };

      setEmployees([newEmp, ...employees]);
      setNotificationMsg(`✓ Karyawan baru "${formName}" [${newId}] berhasil ditambahkan ke sistem!`);
    }

    setTimeout(() => setNotificationMsg(null), 5000);
    setIsEmployeeModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden [body.light-theme_&]:text-slate-800">
      {/* Top Banner */}
      <div className="glass-panel p-2.5 px-3.5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-sm border-t-[3px] border-t-cyan-500 [body.light-theme_&]:border-t-sky-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:border-sky-300 [body.light-theme_&]:text-sky-700 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(6,182,212,0.35)]">
            <i className="fa-solid fa-users-gear"></i>
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5 leading-none">
              SDM & HR OPERASIONAL DEPO
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-800 [body.light-theme_&]:border-sky-300">
                PRESENSI & KOMISI
              </span>
            </h2>
          </div>
        </div>

        {/* Quick Stats Pill & Tambah Karyawan */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-300"
            title="Daftarkan karyawan baru ke sistem"
          >
            <i className="fa-solid fa-user-plus text-slate-950 text-xs"></i>
            <span>+ Tambah Karyawan</span>
          </button>

          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:border-sky-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">Hadir:</span>
            <span className="font-extrabold text-white [body.light-theme_&]:text-slate-900">{totalHadir}</span>
            <span className="text-slate-500">/</span>
            <span className="text-[10px] text-rose-400">{totalIzin} Izin</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:border-sky-200 flex items-center gap-1.5">
            <i className="fa-solid fa-bottle-water text-cyan-400 text-[10px]"></i>
            <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">Ritase Terkirim:</span>
            <span className="font-extrabold text-cyan-400 [body.light-theme_&]:text-sky-700">{totalGallonsDelivered} Galon</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 [body.light-theme_&]:bg-sky-100/80 [body.light-theme_&]:border-sky-300 flex items-center gap-1.5">
            <i className="fa-solid fa-coins text-amber-400 text-[10px]"></i>
            <span className="text-[10px] text-cyan-300 [body.light-theme_&]:text-sky-900 font-semibold">Komisi Harian:</span>
            <span className="font-black text-white [body.light-theme_&]:text-slate-900 font-mono">Rp {totalCommission.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Notification Toast if Any */}
      {notificationMsg && (
        <div className="p-2 px-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-300 shrink-0">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
            <span className="font-extrabold">{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Role Filter */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-200 text-[11px] font-bold overflow-x-auto max-w-[80vw]">
            {(['Semua', 'Supir Armada', 'Kurir Motor Roda 3 (Viar)', 'Salesman', 'Kernet Pengiriman', 'Admin Kasir', 'Staf Gudang & Tabung'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  selectedRole === r
                    ? 'bg-cyan-500/20 text-cyan-300 [body.light-theme_&]:bg-white [body.light-theme_&]:text-cyan-800 [body.light-theme_&]:shadow-sm border border-cyan-400/40'
                    : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white [body.light-theme_&]:hover:text-slate-900'
                }`}
              >
                {r === 'Kurir Motor Roda 3 (Viar)' ? '🛵 Rider Viar' : r === 'Supir Armada' ? '🚚 Supir Mobil' : r === 'Salesman' ? '💼 Salesman' : r === 'Staf Gudang & Tabung' ? 'Gudang' : r}
              </button>
            ))}
          </div>

          {/* Attendance Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 text-[11px] font-semibold text-slate-300 [body.light-theme_&]:text-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="Semua">Semua Kehadiran</option>
            <option value="Hadir">✅ Hadir</option>
            <option value="Izin">🟡 Izin</option>
            <option value="Sakit">🔴 Sakit</option>
            <option value="Libur">⚪ Libur</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-48 sm:w-64">
          <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2 text-slate-400 text-xs"></i>
          <input
            type="text"
            placeholder="Cari nama / NIK / no HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 text-slate-200 [body.light-theme_&]:text-slate-800 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="flex-1 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-950/90 [body.light-theme_&]:bg-sky-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 [body.light-theme_&]:text-slate-600 border-b border-slate-800 [body.light-theme_&]:border-sky-200 backdrop-blur-md">
              <tr>
                <th className="py-2 px-3">ID, Nama & NIK Staf</th>
                <th className="py-2 px-3">Peran & Armada</th>
                <th className="py-2 px-3">Presensi</th>
                {/* 3 Kolom Kategori Muatan Terpisah */}
                <th className="py-2 px-2 text-center bg-cyan-950/40 [body.light-theme_&]:bg-sky-100/60 border-l border-slate-800 [body.light-theme_&]:border-sky-200">
                  <div className="flex items-center justify-center gap-1 text-cyan-400 [body.light-theme_&]:text-sky-800 font-extrabold">
                    <i className="fa-solid fa-bottle-water text-[10px]"></i>
                    <span>[Galon 19L]</span>
                  </div>
                </th>
                <th className="py-2 px-2 text-center bg-amber-950/30 [body.light-theme_&]:bg-amber-100/50 border-x border-slate-800 [body.light-theme_&]:border-sky-200">
                  <div className="flex items-center justify-center gap-1 text-amber-400 [body.light-theme_&]:text-amber-800 font-extrabold">
                    <i className="fa-solid fa-boxes-stacked text-[10px]"></i>
                    <span>[Dus Botol]</span>
                  </div>
                </th>
                <th className="py-2 px-2 text-center bg-emerald-950/30 [body.light-theme_&]:bg-emerald-100/50 border-r border-slate-800 [body.light-theme_&]:border-sky-200">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 [body.light-theme_&]:text-emerald-800 font-extrabold">
                    <i className="fa-solid fa-wine-glass text-[10px]"></i>
                    <span>[Dus Cup]</span>
                  </div>
                </th>
                <th className="py-2 px-3">Skema Komisi Berjenjang</th>
                <th className="py-2 px-3">Total Komisi Harian</th>
                <th className="py-2 px-3">Gaji Pokok Harian</th>
                <th className="py-2 px-3 text-center">Aksi, Slip & WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-sky-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada staf ditemukan sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const comm = calculateEmployeeCommissionDetails(emp, activeConfig);

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-800/40 [body.light-theme_&]:hover:bg-sky-50/50 transition-colors"
                    >
                      <td className="py-2 px-3">
                        <div className="font-extrabold text-white [body.light-theme_&]:text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{emp.name}</span>
                          {emp.employmentStatus && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700 font-semibold">
                              {emp.employmentStatus}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="font-mono text-cyan-400 [body.light-theme_&]:text-sky-700">{emp.id}</span>
                          <span>•</span>
                          <i className="fa-brands fa-whatsapp text-emerald-400 text-[10px]"></i>
                          <span>{emp.phone}</span>
                          {emp.nik && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[9px] text-slate-400" title="NIK KTP">
                                NIK: {emp.nik}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                            emp.role === 'Supir Armada'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 [body.light-theme_&]:bg-amber-50 [body.light-theme_&]:text-amber-800'
                              : emp.role === 'Kurir Motor Roda 3 (Viar)'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-800'
                              : emp.role === 'Salesman'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 [body.light-theme_&]:bg-cyan-50 [body.light-theme_&]:text-cyan-800'
                              : emp.role === 'Kernet Pengiriman'
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:text-sky-800'
                              : emp.role === 'Admin Kasir'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-800'
                              : 'bg-purple-500/15 text-purple-300 border-purple-500/30 [body.light-theme_&]:bg-purple-50 [body.light-theme_&]:text-purple-800'
                          }`}>
                            <i className={
                              emp.role === 'Supir Armada' ? 'fa-solid fa-truck' :
                              emp.role === 'Kurir Motor Roda 3 (Viar)' ? 'fa-solid fa-motorcycle' :
                              emp.role === 'Salesman' ? 'fa-solid fa-user-tie' :
                              emp.role === 'Kernet Pengiriman' ? 'fa-solid fa-people-carry-box' :
                              emp.role === 'Admin Kasir' ? 'fa-solid fa-cash-register' : 'fa-solid fa-warehouse'
                            }></i>
                            {emp.role}
                          </span>
                        </div>
                        {emp.assignedArmada && (
                          <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 truncate max-w-[170px] mt-0.5">
                            {emp.assignedArmada}
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={emp.attendanceStatus}
                            onChange={(e) => handleUpdateStatus(emp.id, e.target.value as any)}
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border bg-slate-900 [body.light-theme_&]:bg-white cursor-pointer focus:outline-none ${
                              emp.attendanceStatus === 'Hadir'
                                ? 'text-emerald-400 border-emerald-500/40 [body.light-theme_&]:text-emerald-800'
                                : emp.attendanceStatus === 'Izin'
                                ? 'text-amber-400 border-amber-500/40 [body.light-theme_&]:text-amber-800'
                                : 'text-rose-400 border-rose-500/40 [body.light-theme_&]:text-rose-800'
                            }`}
                          >
                            <option value="Hadir">✅ Hadir</option>
                            <option value="Izin">🟡 Izin</option>
                            <option value="Sakit">🔴 Sakit</option>
                            <option value="Libur">⚪ Libur</option>
                          </select>
                          {emp.checkInTime && (
                            <span className="text-[9.5px] font-mono text-slate-400 [body.light-theme_&]:text-slate-600">
                              {emp.checkInTime}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3 KOLOM KATEGORI MUATAN TERPISAH: [GALON], [BOTOL], [CUP] */}
                      {/* Kolom 1: Galon 19L */}
                      <td className="py-2 px-2 text-center border-l border-slate-800/60 [body.light-theme_&]:border-sky-100 bg-cyan-950/10 [body.light-theme_&]:bg-sky-50/40">
                        <div className="font-mono font-black text-xs text-cyan-300 [body.light-theme_&]:text-sky-800">
                          {comm.gallons}
                        </div>
                        <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500">
                          tabung
                        </div>
                        {emp.totalTripsToday > 0 && (
                          <div className="text-[8.5px] text-slate-500 font-semibold mt-0.5">
                            {emp.totalTripsToday} Rit
                          </div>
                        )}
                      </td>

                      {/* Kolom 2: Botol Kemasan */}
                      <td className="py-2 px-2 text-center border-x border-slate-800/60 [body.light-theme_&]:border-sky-100 bg-amber-950/10 [body.light-theme_&]:bg-amber-50/30">
                        <div className="font-mono font-black text-xs text-amber-300 [body.light-theme_&]:text-amber-800">
                          {comm.bottles}
                        </div>
                        <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500">
                          dus
                        </div>
                      </td>

                      {/* Kolom 3: Cup / Gelas */}
                      <td className="py-2 px-2 text-center border-r border-slate-800/60 [body.light-theme_&]:border-sky-100 bg-emerald-950/10 [body.light-theme_&]:bg-emerald-50/30">
                        <div className="font-mono font-black text-xs text-emerald-300 [body.light-theme_&]:text-emerald-800">
                          {comm.cups}
                        </div>
                        <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500">
                          dus
                        </div>
                      </td>

                      {/* Skema Komisi Berjenjang */}
                      <td className="py-2 px-3">
                        <div className="text-[10.5px]">
                          {comm.isSalesman ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-black text-[9px] bg-amber-500/20 text-amber-300 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 border border-amber-500/30">
                                💼 Salesman {activeConfig.salesmanSharePercent}%
                              </span>
                              <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
                                G: Rp {Math.round(activeConfig.gallonBaseRate * (activeConfig.salesmanSharePercent / 100)).toLocaleString('id-ID')} • B: Rp {Math.round(activeConfig.bottleBaseRate * (activeConfig.salesmanSharePercent / 100)).toLocaleString('id-ID')} • C: Rp {Math.round(activeConfig.cupBaseRate * (activeConfig.salesmanSharePercent / 100)).toLocaleString('id-ID')}
                              </div>
                            </div>
                          ) : comm.isCourier ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-black text-[9px] bg-emerald-500/20 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 border border-emerald-500/30">
                                🛵 Kurir/Viar {activeConfig.courierSharePercent}%
                              </span>
                              <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
                                G: Rp {Math.round(activeConfig.gallonBaseRate * (activeConfig.courierSharePercent / 100)).toLocaleString('id-ID')} • B: Rp {Math.round(activeConfig.bottleBaseRate * (activeConfig.courierSharePercent / 100)).toLocaleString('id-ID')} • C: Rp {Math.round(activeConfig.cupBaseRate * (activeConfig.courierSharePercent / 100)).toLocaleString('id-ID')}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-400 text-[10px]">Insentif Tetap Depo</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="font-black font-mono text-xs text-emerald-400 [body.light-theme_&]:text-emerald-700">
                          Rp {comm.netCommission.toLocaleString('id-ID')}
                        </div>
                        {comm.totalBase > 0 && comm.sharePercent < 100 && (
                          <div className="text-[9px] text-slate-500">
                            dari dasar Rp {comm.totalBase.toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-3">
                        <div className="font-mono text-xs text-slate-300 [body.light-theme_&]:text-slate-800">
                          Rp {emp.baseSalaryDaily.toLocaleString('id-ID')}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Detail / Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 [body.light-theme_&]:text-amber-800 bg-amber-950/60 [body.light-theme_&]:bg-amber-50 border border-amber-500/30 [body.light-theme_&]:border-amber-300 hover:bg-amber-900/60 cursor-pointer flex items-center gap-1"
                            title="Lihat & Edit Identitas Karyawan"
                          >
                            <i className="fa-solid fa-user-pen"></i>
                            <span>Edit</span>
                          </button>

                          {/* Slip Button */}
                          <button
                            onClick={() => setPrintedSlip(emp)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-cyan-300 [body.light-theme_&]:text-sky-800 bg-cyan-950/60 [body.light-theme_&]:bg-sky-50 border border-cyan-500/30 [body.light-theme_&]:border-sky-300 hover:bg-cyan-900/60 cursor-pointer"
                            title="Cetak Slip Insentif Harian (25% vs 75%)"
                          >
                            <i className="fa-solid fa-receipt mr-1"></i> Slip
                          </button>

                          {/* WA Button - Buka Preview & Kirim Lengkap */}
                          <button
                            onClick={() => {
                              setPreviewWaEmployee(emp);
                              setWaCopied(false);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-300 [body.light-theme_&]:text-emerald-800 bg-emerald-950/60 [body.light-theme_&]:bg-emerald-50 border border-emerald-500/40 [body.light-theme_&]:border-emerald-300 hover:bg-emerald-900/60 cursor-pointer flex items-center gap-1"
                            title="Preview & Kirim Rincian Slip via WhatsApp"
                          >
                            <i className="fa-brands fa-whatsapp text-emerald-400"></i>
                            <span>WA</span>
                          </button>
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

      {/* MODAL: FORMULIR INPUT & EDIT IDENTITAS KARYAWAN LENGKAP */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveEmployee}
            className="w-full max-w-2xl bg-slate-900 [body.light-theme_&]:bg-white border border-cyan-500/40 [body.light-theme_&]:border-sky-300 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          >
            {/* Modal Header with Back Button */}
            <div className="flex items-center justify-between p-3.5 px-4 border-b border-slate-800 [body.light-theme_&]:border-sky-200 bg-slate-950/80 [body.light-theme_&]:bg-sky-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 [body.light-theme_&]:bg-white [body.light-theme_&]:text-slate-800 border border-slate-700 [body.light-theme_&]:border-sky-300 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  title="Kembali ke Tabel Karyawan"
                >
                  <i className="fa-solid fa-arrow-left"></i>
                  <span>Kembali</span>
                </button>
                <div>
                  <h3 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                    <i className="fa-solid fa-id-card text-cyan-400"></i>
                    {editingEmployeeId ? `EDIT IDENTITAS KARYAWAN: ${editingEmployeeId}` : 'REGISTRASI IDENTITAS KARYAWAN BARU'}
                  </h3>
                  <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                    Lengkapi NIK, kontak darurat, unit armada, SIM supir, dan skema pembayaran gaji harian
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white [body.light-theme_&]:hover:text-slate-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* SECTION 1: IDENTITAS DIRI & KONTAK */}
              <div className="p-3 rounded-xl bg-slate-950/50 [body.light-theme_&]:bg-sky-50/50 border border-slate-800 [body.light-theme_&]:border-sky-200 space-y-2.5">
                <div className="text-[11px] font-extrabold text-cyan-400 [body.light-theme_&]:text-sky-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <i className="fa-solid fa-user-tag"></i>
                  1. Identitas Pribadi & Kontak
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      Nama Lengkap Karyawan *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Pak Bambang Sukoco"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                        NIK / No. KTP (16 Digit) *
                      </label>
                      <span className={`text-[9px] font-mono ${formNik.length === 16 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {formNik.length}/16 digit {formNik.length === 16 ? '✓' : ''}
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={16}
                      value={formNik}
                      onChange={(e) => setFormNik(e.target.value.replace(/\D/g, ''))}
                      placeholder="320108xxxxxxxxxx"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      Tempat & Tanggal Lahir
                    </label>
                    <input
                      type="text"
                      value={formBirthPlaceDate}
                      onChange={(e) => setFormBirthPlaceDate(e.target.value)}
                      placeholder="Contoh: Subang, 15 April 1982"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      No. WhatsApp / HP Aktif *
                    </label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      Alamat KTP / Domisili Lengkap
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Jl. Ahmad Yani No. 14, RT 02/05, Subang"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      Kontak Darurat (Nama Kerabat & No. HP)
                    </label>
                    <input
                      type="text"
                      value={formEmergencyContact}
                      onChange={(e) => setFormEmergencyContact(e.target.value)}
                      placeholder="Contoh: Endang (Istri) - 0812-9988-7722"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: JABATAN & PENUGASAN OPERASIONAL */}
              <div className="p-3 rounded-xl bg-slate-950/50 [body.light-theme_&]:bg-sky-50/50 border border-slate-800 [body.light-theme_&]:border-sky-200 space-y-2.5">
                <div className="text-[11px] font-extrabold text-amber-400 [body.light-theme_&]:text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <i className="fa-solid fa-truck"></i>
                  2. Jabatan, Status Kerja & Penugasan Armada
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      Jabatan / Posisi *
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => {
                        const newRole = e.target.value as EmployeeItem['role'];
                        setFormRole(newRole);
                        // Auto adjust default commission rate
                        if (newRole === 'Supir Armada' || newRole === 'Kurir Motor Roda 3 (Viar)') {
                          setFormRatePerTripOrGallon(750);
                        } else if (newRole === 'Salesman') {
                          setFormRatePerTripOrGallon(250);
                        } else if (newRole === 'Kernet Pengiriman') {
                          setFormRatePerTripOrGallon(300);
                        } else {
                          setFormRatePerTripOrGallon(0);
                        }
                      }}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option value="Supir Armada">Supir Armada (Mobil Engkel/Carry/Pickup)</option>
                      <option value="Kurir Motor Roda 3 (Viar)">Kurir Motor Roda 3 (Viar)</option>
                      <option value="Salesman">Salesman (Penghubung / Toko)</option>
                      <option value="Kernet Pengiriman">Kernet Pengiriman</option>
                      <option value="Admin Kasir">Admin Kasir</option>
                      <option value="Staf Gudang & Tabung">Staf Gudang & Tabung</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      Status Kepegawaian *
                    </label>
                    <select
                      value={formEmploymentStatus}
                      onChange={(e) => setFormEmploymentStatus(e.target.value as any)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option value="Tetap">Karyawan Tetap</option>
                      <option value="Kontrak">Karyawan Kontrak</option>
                      <option value="Harian Lepas">Harian Lepas</option>
                      <option value="Probation">Probation / Masa Percobaan</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      Penugasan Armada / Posisi Kerja
                    </label>
                    <select
                      value={formAssignedArmada}
                      onChange={(e) => setFormAssignedArmada(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-amber-400"
                    >
                      <option value="Armada 01 (Engkel B 9241 KDA)">Armada 01 (Engkel B 9241 KDA - 120 Galon)</option>
                      <option value="Armada 02 (Carry B 9812 TDB)">Armada 02 (Carry B 9812 TDB - 60 Galon)</option>
                      <option value="Armada 03 (Pickup B 9123 SDC)">Armada 03 (Pickup B 9123 SDC - 50 Galon)</option>
                      <option value="Armada 05 (Motor Roda 3 Viar Karya B 4812 VIP)">Armada 05 (Motor Roda 3 Viar Karya B 4812 VIP - 25 Galon)</option>
                      <option value="Armada 06 (Motor Roda 3 Viar Karya B 5192 WQT)">Armada 06 (Motor Roda 3 Viar Karya B 5192 WQT - 30 Galon)</option>
                      <option value="Standby Depo Kasir">Standby Depo Kasir</option>
                      <option value="Gudang Depo & Sorting">Gudang Depo & Sorting</option>
                    </select>
                  </div>

                  {/* KHUSUS SUPIR / KURIR VIAR: DATA SIM */}
                  {(formRole === 'Supir Armada' || formRole === 'Kurir Motor Roda 3 (Viar)') && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-amber-400 [body.light-theme_&]:text-amber-700">
                          {formRole === 'Kurir Motor Roda 3 (Viar)' ? 'No. SIM C Rider *' : 'No. & Golongan SIM Supir (B1) *'}
                        </label>
                        <input
                          type="text"
                          value={formDriverLicenseNumber}
                          onChange={(e) => setFormDriverLicenseNumber(e.target.value)}
                          placeholder={formRole === 'Kurir Motor Roda 3 (Viar)' ? 'Contoh: SIM C: 8204-5512-1109' : 'Contoh: SIM B1 Umum: 8204-1234-9981'}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-amber-50/40 border border-amber-500/40 text-amber-200 [body.light-theme_&]:text-amber-900 font-mono font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-amber-400 [body.light-theme_&]:text-amber-700">
                          Masa Berlaku SIM
                        </label>
                        <input
                          type="date"
                          value={formDriverLicenseExpiry}
                          onChange={(e) => setFormDriverLicenseExpiry(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-amber-50/40 border border-amber-500/40 text-amber-200 [body.light-theme_&]:text-amber-900 font-mono focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SECTION 3: SKEMA GAJI & REKENING BANK */}
              <div className="p-3 rounded-xl bg-slate-950/50 [body.light-theme_&]:bg-sky-50/50 border border-slate-800 [body.light-theme_&]:border-sky-200 space-y-2.5">
                <div className="text-[11px] font-extrabold text-emerald-400 [body.light-theme_&]:text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <i className="fa-solid fa-wallet"></i>
                  3. Skema Finansial & Transfer Gaji
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      Gaji Pokok Harian (Rp) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={formBaseSalaryDaily}
                      onChange={(e) => setFormBaseSalaryDaily(Number(e.target.value) || 0)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      Komisi Dasar Galon Default (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formRatePerTripOrGallon}
                      onChange={(e) => setFormRatePerTripOrGallon(Number(e.target.value) || 0)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-emerald-300 [body.light-theme_&]:text-emerald-700 font-mono font-bold focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500">
                      Kurir {activeConfig.courierSharePercent}%: Rp {Math.round(activeConfig.gallonBaseRate * (activeConfig.courierSharePercent / 100))}, Salesman {activeConfig.salesmanSharePercent}%: Rp {Math.round(activeConfig.gallonBaseRate * (activeConfig.salesmanSharePercent / 100))}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">
                      No. Rekening Bank Transfer Gaji (Bank - Rekening - a/n Pemilik)
                    </label>
                    <input
                      type="text"
                      value={formBankAccount}
                      onChange={(e) => setFormBankAccount(e.target.value)}
                      placeholder="Contoh: BCA 8210-983-112 a/n Bambang Sukoco"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: REALISASI MUATAN 3 KATEGORI & LIVE KOMISI */}
              <div className="p-3 rounded-xl bg-slate-950/50 [body.light-theme_&]:bg-sky-50/50 border border-slate-800 [body.light-theme_&]:border-sky-200 space-y-2.5">
                <div className="text-[11px] font-extrabold text-cyan-400 [body.light-theme_&]:text-sky-800 flex items-center justify-between uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-boxes-stacked"></i>
                    4. Realisasi Muatan Kirim Hari Ini (3 Kategori Produk)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">
                    (pembagian 25% salesman & 75% kurir)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between">
                      <span>🍶 Galon 19L (Tabung)</span>
                      <span className="text-[9px] text-cyan-400 font-mono">Rp {activeConfig.gallonBaseRate.toLocaleString('id-ID')}/tbg</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formDeliveredGallons}
                      onChange={(e) => setFormDeliveredGallons(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between">
                      <span>📦 Air Botol (Dus/Karton)</span>
                      <span className="text-[9px] text-amber-400 font-mono">Rp {activeConfig.bottleBaseRate.toLocaleString('id-ID')}/dus</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formDeliveredBottles}
                      onChange={(e) => setFormDeliveredBottles(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 flex items-center justify-between">
                      <span>🍵 Air Gelas/Cup (Dus/Karton)</span>
                      <span className="text-[9px] text-emerald-400 font-mono">Rp {activeConfig.cupBaseRate.toLocaleString('id-ID')}/dus</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formDeliveredCups}
                      onChange={(e) => setFormDeliveredCups(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Live Preview Card */}
                {(() => {
                  const previewEmp = {
                    role: formRole,
                    deliveredGallons: formDeliveredGallons,
                    deliveredBottles: formDeliveredBottles,
                    deliveredCups: formDeliveredCups,
                    dailyCommission: 0,
                  } as EmployeeItem;
                  const p = calculateEmployeeCommissionDetails(previewEmp, activeConfig);

                  return (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 [body.light-theme_&]:bg-sky-100/60 border border-slate-800 [body.light-theme_&]:border-sky-300 text-[11px] space-y-1 mt-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-300 [body.light-theme_&]:text-slate-800 flex items-center gap-1.5">
                          <i className="fa-solid fa-calculator text-cyan-400"></i>
                          Simulasi Komisi: <span className="text-amber-400 font-extrabold">{p.roleLabel}</span>
                        </span>
                        <span className="text-emerald-400 font-black font-mono text-xs">
                          Rp {p.netCommission.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>• Galon: {p.gallons} tbg = Rp {p.baseGallon.toLocaleString('id-ID')}</span>
                        <span>• Botol: {p.bottles} dus × Rp {activeConfig.bottleBaseRate.toLocaleString('id-ID')}/dus = Rp {p.baseBottle.toLocaleString('id-ID')}</span>
                        <span>• Cup: {p.cups} dus × Rp {activeConfig.cupBaseRate.toLocaleString('id-ID')}/dus = Rp {p.baseCup.toLocaleString('id-ID')}</span>
                        <span className="font-bold text-slate-300 [body.light-theme_&]:text-slate-700">= Total Dasar Rp {p.totalBase.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer with Clear Back Button */}
            <div className="p-3 px-4 bg-slate-950 [body.light-theme_&]:bg-sky-50 border-t border-slate-800 [body.light-theme_&]:border-sky-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-200 [body.light-theme_&]:bg-white [body.light-theme_&]:text-slate-800 border border-slate-700 [body.light-theme_&]:border-sky-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Kembali</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-[0_0_16px_rgba(6,182,212,0.5)] flex items-center gap-2 cursor-pointer transition-all border border-cyan-300"
              >
                <i className="fa-solid fa-floppy-disk text-slate-950"></i>
                <span>Simpan Data Karyawan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slip Modal Preview with 25% vs 75% Tier Breakdown */}
      {printedSlip && (() => {
        const comm = calculateEmployeeCommissionDetails(printedSlip, activeConfig);
        const totalTakeHome = printedSlip.baseSalaryDaily + comm.netCommission;
        const waText = generateStaffWhatsAppMessage(printedSlip, activeConfig);
        const cleanPhone = printedSlip.phone.replace(/^0/, '').replace(/-/g, '');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="w-full max-w-lg bg-slate-900 [body.light-theme_&]:bg-white border border-cyan-500/40 [body.light-theme_&]:border-sky-300 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-sky-200 pb-3">
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                    <i className="fa-solid fa-receipt text-cyan-400"></i>
                    SLIP KOMISI BERJENJANG & GAJI HARIAN
                  </h4>
                  <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                    JacS DepoHub - Distributor Resmi & Layanan Armada Mobil & Viar
                  </p>
                </div>
                <button
                  onClick={() => setPrintedSlip(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Data Staf Card */}
              <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-slate-950/60 [body.light-theme_&]:bg-sky-50/60 border border-slate-800 [body.light-theme_&]:border-sky-200">
                <div>
                  <span className="text-[10px] text-slate-400">Nama Lengkap:</span>
                  <div className="font-extrabold text-white [body.light-theme_&]:text-slate-900">{printedSlip.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">NIK: {printedSlip.nik || '-'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Peran & Armada:</span>
                  <div className="font-bold text-cyan-400 [body.light-theme_&]:text-sky-800">{printedSlip.role}</div>
                  <div className="text-[10px] text-slate-400 truncate">{printedSlip.assignedArmada || '-'}</div>
                </div>
              </div>

              {/* TABEL PERBANDINGAN SKEMA KOMISI BERJENJANG (25% vs 75%) */}
              <div className="rounded-xl border border-slate-800 [body.light-theme_&]:border-sky-200 overflow-hidden text-xs">
                <div className="p-2 px-3 bg-slate-950 [body.light-theme_&]:bg-sky-100/70 border-b border-slate-800 [body.light-theme_&]:border-sky-200 flex items-center justify-between">
                  <span className="font-extrabold text-white [body.light-theme_&]:text-slate-900 text-[10.5px] flex items-center gap-1.5">
                    <i className="fa-solid fa-scale-balanced text-amber-400"></i>
                    Rincian Komisi Berjenjang (3 Kategori)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 border border-emerald-500/40">
                    Porsi: {comm.roleLabel}
                  </span>
                </div>

                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950/80 [body.light-theme_&]:bg-sky-50 text-[9.5px] uppercase font-bold text-slate-400 border-b border-slate-800 [body.light-theme_&]:border-sky-200">
                    <tr>
                      <th className="py-1.5 px-2.5">Kategori</th>
                      <th className="py-1.5 px-2 text-center">Tarif Dasar</th>
                      <th className="py-1.5 px-2 text-center">Sales (25%)</th>
                      <th className="py-1.5 px-2 text-center">Kurir/Viar (75%)</th>
                      <th className="py-1.5 px-2 text-center">Realisasi</th>
                      <th className="py-1.5 px-2.5 text-right">Hak Komisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-sky-100">
                    {/* Galon */}
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2 px-2.5 font-bold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                        <i className="fa-solid fa-bottle-water text-cyan-400 text-xs"></i>
                        <span>Galon 19L</span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-400">Rp {activeConfig.gallonBaseRate.toLocaleString('id-ID')}/tbg</td>
                      <td className="py-2 px-2 text-center font-mono text-amber-400">Rp {Math.round(activeConfig.gallonBaseRate * 0.25).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-center font-mono text-emerald-400 font-bold">Rp {Math.round(activeConfig.gallonBaseRate * 0.75).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-white [body.light-theme_&]:text-slate-900">{comm.gallons} tbg</td>
                      <td className="py-2 px-2.5 text-right font-mono font-black text-cyan-300 [body.light-theme_&]:text-sky-800">Rp {comm.netGallon.toLocaleString('id-ID')}</td>
                    </tr>
                    {/* Botol */}
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2 px-2.5 font-bold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                        <i className="fa-solid fa-boxes-stacked text-amber-400 text-xs"></i>
                        <div>
                          <div>Air Kemasan Botol</div>
                          <div className="text-[9px] text-amber-400 font-normal">Dus/Karton</div>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-400">Rp {activeConfig.bottleBaseRate.toLocaleString('id-ID')}/dus</td>
                      <td className="py-2 px-2 text-center font-mono text-amber-400">Rp {Math.round(activeConfig.bottleBaseRate * 0.25).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-center font-mono text-emerald-400 font-bold">Rp {Math.round(activeConfig.bottleBaseRate * 0.75).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-white [body.light-theme_&]:text-slate-900">{comm.bottles} dus</td>
                      <td className="py-2 px-2.5 text-right font-mono font-black text-cyan-300 [body.light-theme_&]:text-sky-800">Rp {comm.netBottle.toLocaleString('id-ID')}</td>
                    </tr>
                    {/* Cup */}
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2 px-2.5 font-bold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                        <i className="fa-solid fa-wine-glass text-emerald-400 text-xs"></i>
                        <div>
                          <div>Air Kemasan Gelas/Cup</div>
                          <div className="text-[9px] text-emerald-400 font-normal">Dus/Karton</div>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-400">Rp {activeConfig.cupBaseRate.toLocaleString('id-ID')}/dus</td>
                      <td className="py-2 px-2 text-center font-mono text-amber-400">Rp {Math.round(activeConfig.cupBaseRate * 0.25).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-center font-mono text-emerald-400 font-bold">Rp {Math.round(activeConfig.cupBaseRate * 0.75).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-white [body.light-theme_&]:text-slate-900">{comm.cups} dus</td>
                      <td className="py-2 px-2.5 text-right font-mono font-black text-cyan-300 [body.light-theme_&]:text-sky-800">Rp {comm.netCup.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Summary Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
                  <span className="text-slate-400 [body.light-theme_&]:text-slate-600">Gaji Pokok Harian:</span>
                  <span className="font-mono font-bold text-white [body.light-theme_&]:text-slate-900">Rp {printedSlip.baseSalaryDaily.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
                  <span className="text-slate-400 [body.light-theme_&]:text-slate-600">Total Komisi 3 Kategori ({comm.roleLabel}):</span>
                  <span className="font-mono font-bold text-emerald-400 [body.light-theme_&]:text-emerald-700">Rp {comm.netCommission.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-2.5 bg-slate-950 [body.light-theme_&]:bg-sky-100/70 p-3 rounded-xl border border-cyan-500/40">
                  <span className="font-black text-white [body.light-theme_&]:text-slate-900">TOTAL HAK DITERIMA HARI INI:</span>
                  <span className="font-mono font-black text-cyan-400 [body.light-theme_&]:text-sky-800 text-base">
                    Rp {totalTakeHome.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Slip Modal Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-sky-200">
                <button
                  onClick={() => setPrintedSlip(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                >
                  Tutup
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/62${cleanPhone}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/80 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 border border-emerald-500/40 hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-brands fa-whatsapp text-emerald-400"></i>
                    <span>Kirim WA</span>
                  </a>

                  <button
                    onClick={() => {
                      alert('Slip komisi siap dicetak via printer thermal 58mm/80mm!\nFormat struk telah disesuaikan dengan rincian komisi berjenjang 25% vs 75%.');
                      setPrintedSlip(null);
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.4)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-print"></i>
                    <span>Cetak Thermal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL PREVIEW & SALIN PESAN WHATSAPP LENGKAP */}
      {previewWaEmployee && (() => {
        const waText = generateStaffWhatsAppMessage(previewWaEmployee, activeConfig);
        const cleanPhone = previewWaEmployee.phone.replace(/^0/, '').replace(/-/g, '');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-slate-900 [body.light-theme_&]:bg-white border border-emerald-500/40 [body.light-theme_&]:border-emerald-300 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 [body.light-theme_&]:border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/40">
                    <i className="fa-brands fa-whatsapp"></i>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-white [body.light-theme_&]:text-slate-900">
                      Rincian Pesan WhatsApp Staf
                    </h4>
                    <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                      Kepada: <strong>{previewWaEmployee.name}</strong> ({previewWaEmployee.phone})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewWaEmployee(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Message Preview Box */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 block mb-1">
                  Format Pesan WhatsApp (Memuat rincian 3 kategori & skema 25% vs 75%):
                </label>
                <textarea
                  readOnly
                  rows={13}
                  value={waText}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 [body.light-theme_&]:bg-emerald-50/50 [body.light-theme_&]:border-emerald-200 [body.light-theme_&]:text-emerald-950 font-mono text-[11px] leading-relaxed resize-none focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewWaEmployee(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                >
                  Tutup
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(waText);
                      setWaCopied(true);
                      setTimeout(() => setWaCopied(false), 3000);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <i className={waCopied ? 'fa-solid fa-check text-emerald-400' : 'fa-solid fa-copy'}></i>
                    <span>{waCopied ? 'Tersalin!' : 'Salin Pesan'}</span>
                  </button>

                  <a
                    href={`https://wa.me/62${cleanPhone}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setPreviewWaEmployee(null)}
                    className="px-4 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer border border-emerald-300"
                  >
                    <i className="fa-brands fa-whatsapp text-slate-950"></i>
                    <span>Buka WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
