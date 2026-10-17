/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveMenu,
  OrderItem,
  CustomerMasterItem,
  CommissionSchemeConfig,
  ArmadaItem,
  StoreMapItem,
  EmployeeItem,
  NewCustomerOnTheRoadInput,
  ReceivableItem,
  ProductMasterItem,
  DispatchAssignment,
  StoreRegistrationSubmission,
  OrderStatus,
  PriceTier,
  InboundDropItem,
  PurchaseOrderItem,
  GallonStock,
  KasirTransaction,
  PosCartItem,
} from './types';
import {
  METRIC_CARDS,
  RECENT_ORDERS,
  GALLON_CIRCULATION,
  ARMADA_LIST,
  CUSTOMER_MASTER,
  DEFAULT_COMMISSION_CONFIG,
  EMPLOYEES,
  STORE_MAP_LOCATIONS,
  RECEIVABLES,
  MASTER_PRODUCTS,
  DEFAULT_DISPATCH_ASSIGNMENTS,
  INITIAL_STORE_SUBMISSIONS,
  DRIVER_SETORAN,
  INITIAL_INBOUND_DROPS,
  INITIAL_KASIR_TRANSACTIONS,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OrderView } from './components/OrderView';
import { MapsPelangganView } from './components/MapsPelangganView';
import { DriverMobileView } from './components/DriverMobileView';
import { MasterDataView } from './components/MasterDataView';
import { ArmadaView } from './components/ArmadaView';
import { SirkulasiGalonView } from './components/SirkulasiGalonView';
import { KasirView } from './components/KasirView';
import { KeuanganView } from './components/KeuanganView';
import { PiutangView } from './components/PiutangView';
import { WhatsAppView } from './components/WhatsAppView';
import { HrView } from './components/HrView';
import { AdminDokumenView } from './components/AdminDokumenView';
import { ExecutiveManagerView } from './components/ExecutiveManagerView';
import { SuperAdminView } from './components/SuperAdminView';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { InitialSetupWizardModal } from './components/admin/InitialSetupWizardModal';
import { ManagerPinModal } from './components/ManagerPinModal';
import { SuperAdminPinModal } from './components/SuperAdminPinModal';
import { hasMasterSuperAdmin, getMasterSuperAdmin } from './utils/rootAuthority';
import { AboutAppModal } from './components/AboutAppModal';
import { SettlementModal } from './components/SettlementModal';
import { OrderModal } from './components/OrderModal';
import { CodeExportModal } from './components/CodeExportModal';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { BongkarMuatModal } from './components/BongkarMuatModal';
import { getGasWebhookUrl, triggerGasWebhook, isValidGasUrl, SyncStatus } from './utils/cloudSync';
import { LanguageProvider } from './utils/i18n';
import { UserRole, getCurrentRole, setCurrentRole, isMenuAllowed, getAllowedMenus } from './utils/rbac';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { WaterFmcgArchitectureView } from './components/WaterFmcgArchitectureView';
import { BottomNavigation } from './components/BottomNavigation';

export default function App() {
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => getCurrentRole());
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(() => {
    const initialRole = getCurrentRole();
    return initialRole === 'CASHIER' ? 'kasir' : 'dashboard';
  });
  const [activeCardId, setActiveCardId] = useState<string>('galon');

  useEffect(() => {
    const handleRoleChange = () => {
      const updatedRole = getCurrentRole();
      setCurrentRoleState(updatedRole);
    };
    window.addEventListener('user_role_changed', handleRoleChange);
    return () => window.removeEventListener('user_role_changed', handleRoleChange);
  }, []);

  // Auto-scroll ke bagian atas saat tab navigasi berubah
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [activeMenu]);

  // Tangani event pembersihan seluruh data dummy & reset operasional dari SuperAdmin
  useEffect(() => {
    const handleDataReset = (event?: Event) => {
      const customDetail = (event as CustomEvent)?.detail;
      const preserveMasterSku = customDetail?.preserveMasterSku ?? true;

      // 1. Reset Transaksi & Antrean
      setOrders([]);
      setKasirTransactions([]);
      setReceivables([]);
      setInboundDrops([]);
      setPurchaseOrders([]);
      setStoreSubmissions((prev) =>
        prev.map((s) => (s.status === 'MENUNGGU_KONFIRMASI_ADMIN' ? { ...s, status: 'DISETUJUI' } : s))
      );

      // 2. Reset Status Armada: Semua idle / standby (Tersedia), muatan 0
      setArmadaList((prev) =>
        prev.map((armada) => ({
          ...armada,
          status: 'Tersedia',
          currentLoad: 0,
          emptyGallonLoad: 0,
          currentRoute: 'Standby Depo',
        }))
      );

      // 3. Reset Absensi Karyawan & Log: 0 hadir (Semua Standby / Libur), 0 komisi, 0 antar
      setEmployees((prev) =>
        prev.map((emp) => ({
          ...emp,
          attendanceStatus: 'Libur',
          checkInTime: undefined,
          totalTripsToday: 0,
          totalGallonsDeliveredToday: 0,
          deliveredGallons: 0,
          deliveredBottles: 0,
          deliveredCups: 0,
          dailyCommission: 0,
        }))
      );

      // 4. Kosongkan / Nolkan Stok Fisik & Audit Wadah
      setGallonCirculation((prev) =>
        prev.map((g) => ({
          ...g,
          filled: 0,
          empty: 0,
          atStores: 0,
          loanedHousehold: 0,
          soldOutright: 0,
          damaged: 0,
        }))
      );

      // 5. Nolkan stok produk katalog jika preserveMasterSku aktif
      if (preserveMasterSku) {
        setProducts((prev) =>
          prev.map((p) => ({
            ...p,
            stock: 0,
          }))
        );
      } else {
        setProducts([]);
      }
    };
    window.addEventListener('depo_data_reset', handleDataReset);
    return () => window.removeEventListener('depo_data_reset', handleDataReset);
  }, []);

  // Check if mock has been migrated to clean single-item testing dataset
  const isCleanMockActive = () => {
    try {
      return localStorage.getItem('jacshub_mock_version') === 'clean_operational_v3';
    } catch {
      return false;
    }
  };

  const [orders, setOrders] = useState<OrderItem[]>(() => {
    try {
      if (isCleanMockActive()) {
        const saved = localStorage.getItem('argus_orders');
        if (saved) return JSON.parse(saved);
      } else {
        localStorage.setItem('jacshub_mock_version', 'clean_operational_v3');
        localStorage.removeItem('argus_orders');
        localStorage.removeItem('argus_kasir_transactions');
      }
    } catch {
      // ignore
    }
    return RECENT_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('argus_orders', JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);
  const [customers, setCustomers] = useState<CustomerMasterItem[]>(() => {
    try {
      const saved = localStorage.getItem('argus_customers');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return CUSTOMER_MASTER;
  });

  useEffect(() => {
    try {
      localStorage.setItem('argus_customers', JSON.stringify(customers));
    } catch {
      // ignore
    }
  }, [customers]);

  const [storeSubmissions, setStoreSubmissions] = useState<StoreRegistrationSubmission[]>(() => {
    try {
      if (isCleanMockActive()) {
        const saved = localStorage.getItem('argus_store_submissions');
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_STORE_SUBMISSIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('argus_store_submissions', JSON.stringify(storeSubmissions));
    } catch {
      // ignore
    }
  }, [storeSubmissions]);
  const [products, setProducts] = useState<ProductMasterItem[]>(() => {
    try {
      const saved = localStorage.getItem('argus_products');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return MASTER_PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('argus_products', JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  const [kasirTransactions, setKasirTransactions] = useState<KasirTransaction[]>(() => {
    try {
      if (isCleanMockActive()) {
        const saved = localStorage.getItem('argus_kasir_transactions');
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_KASIR_TRANSACTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('argus_kasir_transactions', JSON.stringify(kasirTransactions));
    } catch {
      // ignore
    }
  }, [kasirTransactions]);
  const [storeMapLocations, setStoreMapLocations] = useState<StoreMapItem[]>(STORE_MAP_LOCATIONS);
  const [gallonCirculation, setGallonCirculation] = useState<GallonStock[]>(() => {
    try {
      if (isCleanMockActive()) {
        const saved = localStorage.getItem('argus_gallon_circulation');
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return GALLON_CIRCULATION;
  });

  useEffect(() => {
    try {
      localStorage.setItem('argus_gallon_circulation', JSON.stringify(gallonCirculation));
    } catch {
      // ignore
    }
  }, [gallonCirculation]);

  const [armadaList, setArmadaList] = useState<ArmadaItem[]>(() => {
    try {
      const saved = localStorage.getItem('argus_armada_list');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ARMADA_LIST;
  });

  useEffect(() => {
    try {
      localStorage.setItem('argus_armada_list', JSON.stringify(armadaList));
    } catch {
      // ignore
    }
  }, [armadaList]);

  const [employees, setEmployees] = useState<EmployeeItem[]>(EMPLOYEES);
  const [commissionConfig, setCommissionConfig] = useState<CommissionSchemeConfig>(() => {
    try {
      const saved = localStorage.getItem('argus_commission_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_COMMISSION_CONFIG;
  });
  const [receivables, setReceivables] = useState<ReceivableItem[]>(() => {
    try {
      if (isCleanMockActive()) {
        const saved = localStorage.getItem('argus_receivables');
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return RECEIVABLES;
  });
  const [dispatchAssignments, setDispatchAssignments] = useState<
    Record<string, DispatchAssignment>
  >(() => {
    try {
      if (isCleanMockActive()) {
        const saved = localStorage.getItem('argus_dispatch_assignments');
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_DISPATCH_ASSIGNMENTS;
  });

  // Ensure clean dataset migration on first load
  useEffect(() => {
    try {
      const MOCK_VERSION = 'clean_single_item_v3';
      if (localStorage.getItem('jacshub_mock_version') !== MOCK_VERSION) {
        localStorage.setItem('jacshub_mock_version', MOCK_VERSION);
        localStorage.removeItem('argus_orders');
        localStorage.removeItem('argus_receivables');
        localStorage.removeItem('argus_store_submissions');
        localStorage.removeItem('argus_inbound_drops');
        localStorage.removeItem('argus_dispatch_assignments');
        localStorage.removeItem('argus_gallon_circulation');
        localStorage.removeItem('argus_armada_list');
        setOrders(RECENT_ORDERS);
        setReceivables(RECEIVABLES);
        setStoreSubmissions(INITIAL_STORE_SUBMISSIONS);
        setInboundDrops(INITIAL_INBOUND_DROPS);
        setDispatchAssignments(DEFAULT_DISPATCH_ASSIGNMENTS);
        setArmadaList(ARMADA_LIST);
        setGallonCirculation(GALLON_CIRCULATION);
      }
    } catch {
      // ignore
    }
  }, []);
  const [allowMultiDrop, setAllowMultiDrop] = useState<boolean>(() => {
    try {
      return localStorage.getItem('argus_allow_multi_drop') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleMultiDrop = () => {
    setAllowMultiDrop((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('argus_allow_multi_drop', String(next));
      } catch {
        // ignore
      }
      showToast(
        next
          ? '🔓 Saklar Darurat: Mode Multi-Drop DIAKTIFKAN. Supir diizinkan membawa >1 antaran sekaligus!'
          : '🔒 Regulasi Antaran Tunggal KEMBALI DIAKTIFKAN: 1 Supir = 1 Antaran Aktif'
      );
      return next;
    });
  };

  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('jacs_logo_url') || '/logo-jacs.svg';
    } catch {
      return '/logo-jacs.svg';
    }
  });

  const handleUpdateLogoUrl = (newUrl: string) => {
    const trimmed = newUrl.trim();
    setLogoUrl(trimmed);
    try {
      localStorage.setItem('jacs_logo_url', trimmed);
    } catch {
      // ignore
    }
  };
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    return isValidGasUrl(getGasWebhookUrl()) ? 'synced' : 'offline';
  });
  const [dailyReconciliationAddedCash, setDailyReconciliationAddedCash] = useState<number>(() => {
    return Number(localStorage.getItem('argus_daily_recon_cash')) || 0;
  });
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalMode, setOrderModalMode] = useState<'B2C' | 'B2B'>('B2C');
  const [prefillOrderForKasir, setPrefillOrderForKasir] = useState<OrderItem | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isBongkarModalOpen, setIsBongkarModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isManagerUnlocked, setIsManagerUnlocked] = useState(false);
  const [isManagerPinModalOpen, setIsManagerPinModalOpen] = useState(false);
  const [isKasirUnlocked, setIsKasirUnlocked] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return (
          localStorage.getItem('jacs_remember_kasir_unlocked') === 'true' ||
          sessionStorage.getItem('jacs_session_kasir_unlocked') === 'true'
        );
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [isPiutangUnlocked, setIsPiutangUnlocked] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return (
          localStorage.getItem('jacs_remember_piutang_unlocked') === 'true' ||
          sessionStorage.getItem('jacs_session_piutang_unlocked') === 'true'
        );
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [modulePinTarget, setModulePinTarget] = useState<'manager' | 'kasir' | 'piutang' | null>(null);
  const [isSuperAdminUnlocked, setIsSuperAdminUnlocked] = useState(false);
  const [isSuperAdminPinModalOpen, setIsSuperAdminPinModalOpen] = useState(false);
  const [isFirstRunWizardOpen, setIsFirstRunWizardOpen] = useState(() => !hasMasterSuperAdmin());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [inboundDrops, setInboundDrops] = useState<InboundDropItem[]>(() => {
    try {
      const saved = localStorage.getItem('argus_inbound_drops');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_INBOUND_DROPS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('argus_purchase_orders');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const handleConfirmPO = (po: PurchaseOrderItem) => {
    setPurchaseOrders((prev) => {
      const updated = [po, ...prev];
      try {
        localStorage.setItem('argus_purchase_orders', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    showToast(`📤 Purchase Order #${po.poNumber} berhasil diterbitkan & dikirim via WA ke ${po.supplier}`);
  };

  const handleConfirmBongkar = (dropData: {
    sjNumber: string;
    supplier: string;
    filledGallonsIn: number;
    emptyGallonsExchanged: number;
    dusKemasanIn: number;
    selectedSkuId?: string;
    driverName?: string;
    vehiclePlate?: string;
    itemsDescription: string;
    picWarehouse?: string;
    notes?: string;
  }) => {
    const newDrop: InboundDropItem = {
      id: `DROP-${Date.now().toString().slice(-4)}`,
      sjNumber: dropData.sjNumber,
      supplier: dropData.supplier,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      driverName: dropData.driverName || 'Supir Pabrik',
      vehiclePlate: dropData.vehiclePlate || 'Truk Logistik',
      filledGallonsIn: dropData.filledGallonsIn,
      emptyGallonsExchanged: dropData.emptyGallonsExchanged,
      dusKemasanIn: dropData.dusKemasanIn,
      itemsDescription: dropData.itemsDescription,
      status: 'SELESAI_BONGKAR',
      picWarehouse: dropData.picWarehouse || 'Ahmad Fauzi (Staf Tabung)',
    };

    // 1. Tambah riwayat inbound drops
    setInboundDrops((prev) => {
      const updated = [newDrop, ...prev];
      try {
        localStorage.setItem('argus_inbound_drops', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // 2. Tambah kuota stok terisi gudang & normalkan status peringatan kritis pada SKU
    setProducts((prev) => {
      const updated = prev.map((p) => {
        // Target SKU spesifik atau SKU yang kritis
        if (dropData.selectedSkuId && p.id === dropData.selectedSkuId) {
          const addQty = p.unit.toLowerCase().includes('dus')
            ? dropData.dusKemasanIn || 200
            : dropData.filledGallonsIn || 200;
          return {
            ...p,
            stock: p.stock + addQty,
          };
        }

        // Jika Cleo Smart Gallon (PRD-04) dan ada galon masuk
        if (
          p.id === 'PRD-04' &&
          dropData.filledGallonsIn > 0 &&
          (!dropData.selectedSkuId || dropData.selectedSkuId === 'PRD-04')
        ) {
          return {
            ...p,
            stock: Math.max(p.stock + dropData.filledGallonsIn, 220), // Level aman di atas ambang batas toleransi
          };
        }

        // Jika Vit Botol 600ml (PRD-05) dan ada dus masuk
        if (
          p.id === 'PRD-05' &&
          dropData.dusKemasanIn > 0 &&
          (!dropData.selectedSkuId || dropData.selectedSkuId === 'PRD-05')
        ) {
          return {
            ...p,
            stock: Math.max(p.stock + dropData.dusKemasanIn, 350), // Level aman di atas ambang batas toleransi
          };
        }

        return p;
      });

      try {
        localStorage.setItem('argus_master_products', JSON.stringify(updated));
      } catch {
        // ignore
      }

      // 3. Sinkronisasi Telemetri & Cloud ke Webhook GAS (Sheet 'BongkarMuat' atau 'MutasiStok')
      if (getGasWebhookUrl()) {
        triggerGasWebhook('bongkar_muat', {
          drop: newDrop,
          updatedStock: updated.map((item) => ({ id: item.id, name: item.name, stock: item.stock })),
        }).then((res) => {
          if (res.success) {
            setSyncStatus('synced');
          }
        });
      }

      return updated;
    });

    // 4. Update sirkulasi galon (tambah terisi gudang, kurangi tabung kosong siap tukar)
    if (dropData.filledGallonsIn > 0 || dropData.emptyGallonsExchanged > 0) {
      setGallonCirculation((prev) =>
        prev.map((g, idx) => {
          if (idx === 0) {
            return {
              ...g,
              filled: g.filled + dropData.filledGallonsIn,
              empty: Math.max(0, g.empty - dropData.emptyGallonsExchanged),
            };
          }
          return g;
        })
      );
    }

    showToast(
      `✅ Konfirmasi Bongkar #${newDrop.sjNumber}: +${dropData.filledGallonsIn} Tabung Terisi, Tukar ${dropData.emptyGallonsExchanged} Kosong. Stok bertambah & E-Warning dinormalkan!`
    );
  };

  const handlePayReceivable = (id: string, amountPaid: number, note?: string) => {
    const target = receivables.find((r) => r.id === id);
    if (!target) return;

    setReceivables((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id) {
          const remaining = Math.max(0, r.amount - amountPaid);
          return {
            ...r,
            amount: remaining,
            status: (remaining === 0 ? 'LUNAS' : r.status) as any,
          };
        }
        return r;
      });
      try {
        localStorage.setItem('argus_receivables', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setCustomers((prev) =>
      prev.map((c) => {
        if (
          c.name.toLowerCase().includes(target.customerName.toLowerCase()) ||
          target.customerName.toLowerCase().includes(c.name.toLowerCase())
        ) {
          return {
            ...c,
            currentReceivable: Math.max(0, (c.currentReceivable || 0) - amountPaid),
          };
        }
        return c;
      })
    );

    // Tambah nominal pelunasan ke rekonsiliasi kas masuk harian (Tutup Buku 17:00 WIB)
    setDailyReconciliationAddedCash((prev) => {
      const next = prev + amountPaid;
      try {
        localStorage.setItem('argus_daily_recon_cash', next.toString());
      } catch {
        // ignore
      }
      return next;
    });

    // Background Sync ke Google Apps Script Webhook
    if (getGasWebhookUrl()) {
      triggerGasWebhook('pay_receivable', {
        receivable: {
          ...target,
          amount: Math.max(0, target.amount - amountPaid),
          status: target.amount - amountPaid <= 0 ? 'LUNAS' : target.status,
        },
        amountPaid,
        note,
      }).then((res) => {
        setSyncStatus(res.success ? 'synced' : 'offline');
      });
    }

    showToast(`✅ Pelunasan Rp ${amountPaid.toLocaleString('id-ID')} untuk ${target.customerName} berhasil dibukukan! Status diupdate LUNAS & masuk ke Kas Harian.`);
  };

  const handleAddReceivable = (newReceivable: ReceivableItem) => {
    setReceivables((prev) => {
      const updated = [newReceivable, ...prev];
      try {
        localStorage.setItem('argus_receivables', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setCustomers((prev) =>
      prev.map((c) => {
        if (
          c.name.toLowerCase().includes(newReceivable.customerName.toLowerCase()) ||
          newReceivable.customerName.toLowerCase().includes(c.name.toLowerCase())
        ) {
          return {
            ...c,
            currentReceivable: (c.currentReceivable || 0) + newReceivable.amount,
            emptyGallonDebt: (c.emptyGallonDebt || 0) + (newReceivable.gallonsLoaned || 0),
            lastTransactionDate: new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            lastTransactionAmount: newReceivable.amount,
          };
        }
        return c;
      })
    );

    showToast(
      `⏳ Piutang baru Rp ${newReceivable.amount.toLocaleString('id-ID')} (${newReceivable.customerName}) tercatat di modul Piutang Toko!`
    );
  };

  const handleCollectTempoFromDriver = (
    receivableId: string,
    amount: number,
    driverName: string,
    notes?: string
  ) => {
    const target = receivables.find((r) => r.id === receivableId);
    const targetName = target ? target.customerName : 'Toko Mitra';

    setReceivables((prev) => {
      const updated = prev.map((r) => {
        if (r.id === receivableId) {
          const remaining = Math.max(0, r.amount - amount);
          return {
            ...r,
            amount: remaining,
            status: remaining === 0 ? ('Aman' as const) : r.status,
          };
        }
        return r;
      });
      try {
        localStorage.setItem('argus_receivables', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setCustomers((prev) =>
      prev.map((c) => {
        if (
          target &&
          (c.name.toLowerCase().includes(target.customerName.toLowerCase()) ||
            target.customerName.toLowerCase().includes(c.name.toLowerCase()))
        ) {
          return {
            ...c,
            currentReceivable: Math.max(0, (c.currentReceivable || 0) - amount),
          };
        }
        return c;
      })
    );

    showToast(
      `💰 Setoran Tempo Rp ${amount.toLocaleString('id-ID')} dari ${targetName} diterima supir ${driverName}! Piutang otomatis berkurang di Admin.`
    );
  };

  const handleAddArmada = (newArmada: ArmadaItem) => {
    setArmadaList((prev) => [newArmada, ...prev]);
    showToast(`Armada baru [${newArmada.plateNumber}] ${newArmada.vehicleType} berhasil didaftarkan`);
  };

  const handleUpdateArmada = (updatedArmada: ArmadaItem) => {
    setArmadaList((prev) =>
      prev.map((a) => (a.id === updatedArmada.id ? updatedArmada : a))
    );
    showToast(`Status/muatan armada ${updatedArmada.plateNumber} diperbarui`);
  };

  const handleUpdateDispatchAssignment = (updated: DispatchAssignment) => {
    setDispatchAssignments((prev) => {
      const next = { ...prev, [updated.driverId]: updated };
      try {
        localStorage.setItem('argus_dispatch_assignments', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setArmadaList((prev) =>
      prev.map((armada) => {
        if (armada.id === updated.armadaId || armada.plateNumber === updated.vehiclePlate) {
          return {
            ...armada,
            driverName: updated.driverName,
            currentLoad: updated.currentLoadGallons,
            currentRoute: updated.priorityNote,
          };
        }
        return armada;
      })
    );

    showToast(
      `Penugasan unit: ${updated.driverName} ditugaskan membawa [${updated.vehicleName} ${updated.vehiclePlate}]`
    );
  };

  const handleUpdateCommissionConfig = (newConfig: CommissionSchemeConfig) => {
    setCommissionConfig(newConfig);
    try {
      localStorage.setItem('argus_commission_config', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
    showToast('Skema tarif dasar komisi produk & pembagian berjenjang diperbarui!');
  };

  // Auto-collapse sidebar when opening Kasir & POS, protect Kasir, Piutang, Executive Manager & Super Admin with PIN
  const handleSelectMenu = (menu: ActiveMenu) => {
    if (menu === activeMenu) return;

    if (!isMenuAllowed(menu, currentRole)) {
      setActiveMenu(menu);
      return;
    }
    const isRootBypassed = currentRole === 'DEVELOPER' || currentRole === 'SUPER_ADMIN' || isSuperAdminUnlocked;

    if (menu === 'admin-dokumen' && !isManagerUnlocked && !isRootBypassed) {
      setModulePinTarget('manager');
      return;
    }
    if (menu === 'super-admin' && !isSuperAdminUnlocked && currentRole !== 'DEVELOPER') {
      setIsSuperAdminPinModalOpen(true);
      return;
    }
    if (menu === 'kasir' && !isKasirUnlocked && !isRootBypassed) {
      setModulePinTarget('kasir');
      return;
    }
    if (menu === 'piutang' && !isPiutangUnlocked && !isRootBypassed) {
      setModulePinTarget('piutang');
      return;
    }

    setActiveMenu(menu);
    if (menu === 'kasir') {
      setIsSidebarCollapsed(true);
    }
  };

  const handleUnlockModule = (target: 'manager' | 'kasir' | 'piutang', rememberDevice?: boolean) => {
    if (target === 'manager') {
      setIsManagerUnlocked(true);
      if (rememberDevice) {
        try { localStorage.setItem('jacs_remember_manager_unlocked', 'true'); } catch {}
      }
      setIsManagerPinModalOpen(false);
      setActiveMenu('admin-dokumen');
      showToast('🔓 Otorisasi Berhasil! Selamat Datang, Pemilik / Executive Manager');
    } else if (target === 'kasir') {
      setIsKasirUnlocked(true);
      try {
        sessionStorage.setItem('jacs_session_kasir_unlocked', 'true');
        if (rememberDevice) {
          localStorage.setItem('jacs_remember_kasir_unlocked', 'true');
        }
      } catch {}
      setActiveMenu('kasir');
      setIsSidebarCollapsed(true);
      showToast('🔓 Otorisasi Berhasil! Akses Kasir & Admin Terbuka');
    } else if (target === 'piutang') {
      setIsPiutangUnlocked(true);
      try {
        sessionStorage.setItem('jacs_session_piutang_unlocked', 'true');
        if (rememberDevice) {
          localStorage.setItem('jacs_remember_piutang_unlocked', 'true');
        }
      } catch {}
      setActiveMenu('piutang');
      showToast('🔓 Otorisasi Berhasil! Akses Buku Piutang & Tempo Terbuka');
    }
    setModulePinTarget(null);
  };

  const handleLockManagerSession = () => {
    setIsManagerUnlocked(false);
    try {
      localStorage.removeItem('jacs_remember_manager_unlocked');
    } catch {}
    setActiveMenu('dashboard');
    showToast('🔒 Sesi Executive Manager Berhasil Dikunci (Auto-Lock Aktif)');
  };

  const handleLockKasirSession = () => {
    setIsKasirUnlocked(false);
    try {
      sessionStorage.removeItem('jacs_session_kasir_unlocked');
      localStorage.removeItem('jacs_remember_kasir_unlocked');
    } catch {}
    setActiveMenu('dashboard');
    showToast('🔒 Sesi Kasir & Admin Berhasil Dikunci');
  };

  const handleLockPiutangSession = () => {
    setIsPiutangUnlocked(false);
    try {
      sessionStorage.removeItem('jacs_session_piutang_unlocked');
      localStorage.removeItem('jacs_remember_piutang_unlocked');
    } catch {}
    setActiveMenu('dashboard');
    showToast('🔒 Sesi Buku Piutang & Tempo Berhasil Dikunci');
  };

  const handleSuperAdminPinSuccess = () => {
    setIsSuperAdminUnlocked(true);
    setIsSuperAdminPinModalOpen(false);
    setActiveMenu('super-admin');
    showToast('🔓 Otorisasi Root Berhasil! Akses Menu Super Admin Terbuka');
  };

  const handleLockSuperAdminSession = () => {
    setIsSuperAdminUnlocked(false);
    setActiveMenu('dashboard');
    showToast('🔒 Sesi Super Admin Berhasil Dikunci');
  };

  const handleExitToNormalMode = () => {
    // 1. Reset sesi ROOT / Super Admin menjadi terkunci
    setIsSuperAdminUnlocked(false);
    setIsManagerUnlocked(false);

    // 2. Ubah role aktif pengguna otomatis kembali ke mode default: 'CASHIER' (Kasir / Staf Operasional)
    setCurrentRole('CASHIER');
    setCurrentRoleState('CASHIER');

    // 3. Alihkan navigasi halaman (redirect) langsung kembali ke menu "kasir" atau "dashboard"
    setActiveMenu('kasir');

    // 4. Tampilkan toast notifikasi
    showToast('🚪 Sesi Developer ditutup. Berhasil kembali ke Mode Normal Operasional.');
  };

  const handleFirstRunWizardComplete = (ownerName: string) => {
    setIsFirstRunWizardOpen(false);
    showToast(`✓ Selamat Datang, ${ownerName}! Otoritas Pemilik Depo (Root Admin) Berhasil Diaktifkan.`);
  };

  const handleOpenOrderModal = (mode: 'B2C' | 'B2B' = 'B2C') => {
    setOrderModalMode(mode);
    setIsOrderModalOpen(true);
  };

  const handleTransferToKasir = (order: OrderItem) => {
    setPrefillOrderForKasir(order);
    handleSelectMenu('kasir');
    showToast(`Order #${order.id} (${order.customerName}) dimuat ke Kasir POS`);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-theme');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (!next) {
        document.body.classList.add('light-theme');
        document.documentElement.classList.remove('dark');
      } else {
        document.body.classList.remove('light-theme');
        document.documentElement.classList.add('dark');
      }
      return next;
    });
    showToast(!isDarkMode ? 'Beralih ke mode gelap (Dark Neon)' : 'Beralih ke mode terang (Light Clean)');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddOrder = (newOrder: OrderItem, andTransferToKasir = false) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Background Sync ke Google Apps Script Webhook
    if (getGasWebhookUrl()) {
      triggerGasWebhook('new_order', { order: newOrder }).then((res) => {
        setSyncStatus(res.success ? 'synced' : 'offline');
      });
    }

    if (andTransferToKasir) {
      setPrefillOrderForKasir(newOrder);
      handleSelectMenu('kasir');
      showToast(`Order #${newOrder.id} tersimpan & langsung dimuat ke Kasir POS`);
    } else {
      showToast(`Order #${newOrder.id} berhasil ditambahkan untuk ${newOrder.customerName}`);
    }
  };

  const handleAddProduct = (newProduct: ProductMasterItem) => {
    setProducts((prev) => {
      const updated = [newProduct, ...prev];
      try {
        localStorage.setItem('argus_products', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    showToast(`Produk baru [${newProduct.id}] ${newProduct.name} tersimpan di Master SKU & Kasir!`);
  };

  const handleUpdateProducts = (updatedProducts: ProductMasterItem[]) => {
    setProducts(updatedProducts);
    try {
      localStorage.setItem('argus_products', JSON.stringify(updatedProducts));
    } catch {
      // ignore
    }
  };

  const handleAddCustomer = (newCustomer: CustomerMasterItem, andAddToMap = true) => {
    setCustomers((prev) => [newCustomer, ...prev]);

    if (andAddToMap) {
      const newStoreMap: StoreMapItem = {
        id: `MAP-${Date.now().toString().slice(-4)}`,
        name: newCustomer.name,
        ownerName: newCustomer.ownerName || newCustomer.name,
        category: newCustomer.b2bCategory === 'Agen / Pangkalan' ? 'Pangkalan Agen' : newCustomer.type === 'B2B' ? 'Toko Grosir' : 'Rumah Tangga',
        phone: newCustomer.phone,
        address: newCustomer.address,
        landmark: newCustomer.landmark || 'Terdaftar dari Master Pelanggan',
        zone: newCustomer.zone || 'Rayon Utara',
        x: Math.round(20 + Math.random() * 60),
        y: Math.round(20 + Math.random() * 60),
        status: 'delivered-safe',
        statusLabel: 'Pelanggan Baru Terdaftar',
        regularQuota: newCustomer.type === 'B2B' ? 20 : 5,
        emptyGallonDebt: newCustomer.emptyGallonDebt || 0,
        currentReceivable: newCustomer.currentReceivable || 0,
        lastOrderDate: 'Baru Terdaftar',
        lat: -6.56 + (Math.random() - 0.5) * 0.04,
        lng: 107.65 + (Math.random() - 0.5) * 0.04,
      };
      setStoreMapLocations((prev) => [newStoreMap, ...prev]);
    }

    showToast(`Pelanggan baru [${newCustomer.id}] ${newCustomer.name} berhasil didaftarkan ke Master Data & Maps!`);
  };

  const handleCreateOrderFromMap = (store: StoreMapItem) => {
    const qty = store.regularQuota || 20;
    const pricePerUnit = store.category === 'Pangkalan Agen' ? 18500 : store.category === 'Toko Grosir' ? 19500 : 21000;
    const newOrder: OrderItem = {
      id: `ORD-MAP-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: store.name,
      customerType: store.category === 'Rumah Tangga' ? 'Rumah Tangga' : store.category === 'Pangkalan Agen' ? 'Agen / Pangkalan' : 'Toko Kelontong',
      items: `${qty} Galon Aqua 19L (Refill)`,
      totalGalon: qty,
      totalAmount: qty * pricePerUnit,
      deliveryStatus: 'Diproses',
      paymentStatus: 'Tempo / Hutang',
      driver: 'Armada Siaga',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      phone: store.phone,
      residentialDetail: `${store.address} (Patokan: ${store.landmark})`,
      gallonScheme: 'Tukar Galon',
      priceTier: store.category === 'Pangkalan Agen' ? 'Pangkalan' : store.category === 'Toko Grosir' ? 'Toko' : 'Eceran',
    };
    setPrefillOrderForKasir(newOrder);
    handleSelectMenu('kasir');
    showToast(`Order untuk ${store.name} siap ditransaksikan di Kasir & Admin`);
  };

  const handleUpdateDeliveryStatus = (
    orderId: string,
    status: OrderItem['deliveryStatus']
  ) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, deliveryStatus: status } : ord))
    );
    showToast(`Status pengiriman ${orderId} diperbarui: ${status}`);
  };

  const handleAcceptDriverOrder = (
    orderId: string,
    driverId: string,
    driverName?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            deliveryStatus: 'DIANTAR',
            assignedDriverId: driverId,
            driver: driverName || ord.driver || driverId,
          };
        }
        return ord;
      })
    );
    showToast(`✋ Order #${orderId} berhasil diambil! Status sekarang: DIANTAR`);
  };

  const handleCompleteDriverDelivery = (
    orderId: string,
    podData: {
      emptyGallonsReturned: number;
      damagedNotes?: string;
      photoProof?: string;
      recipientName?: string;
      note?: string;
    }
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const gallonsDelivered = targetOrder.totalGalon || 0;
    const courierRate = Math.round(
      commissionConfig.gallonBaseRate * (commissionConfig.courierSharePercent / 100)
    );
    const earnedCommission = gallonsDelivered * courierRate;

    // 1. Update Order Status in Pelayanan Order
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const debt = Math.max(0, (ord.totalGalon || 0) - podData.emptyGallonsReturned);
          return {
            ...ord,
            deliveryStatus: 'SELESAI',
            status: 'Terkirim',
            emptyGallonsReturned: podData.emptyGallonsReturned,
            emptyGallonDebt: debt,
            damagedItemsNote: podData.damagedNotes || ord.damagedItemsNote,
            photoProof: podData.photoProof || ord.photoProof,
            podRecipientName: podData.recipientName || ord.podRecipientName,
            podCompletedTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return ord;
      })
    );

    // 2. Update Armada Load
    setArmadaList((prev) =>
      prev.map((armada) => {
        const orderDriverStr = (targetOrder.driver || '').toLowerCase();
        const isMatchDriver =
          orderDriverStr &&
          (armada.driverName.toLowerCase().includes(orderDriverStr) ||
            orderDriverStr.includes(armada.driverName.toLowerCase().split(' ')[0]));

        if (isMatchDriver) {
          const newLoad = Math.max(0, armada.currentLoad - gallonsDelivered);
          return {
            ...armada,
            currentLoad: newLoad,
            status: newLoad === 0 ? 'Tersedia' : armada.status,
          };
        }
        return armada;
      })
    );

    // 3. Update Employee Record (Komisi Driver 75% otomatis masuk ke SDM & HR)
    setEmployees((prev) =>
      prev.map((emp) => {
        const orderDriverStr = (targetOrder.driver || '').toLowerCase();
        const isDriver =
          orderDriverStr &&
          (emp.name.toLowerCase().includes(orderDriverStr) ||
            orderDriverStr.includes(emp.name.toLowerCase().split(' ')[0]) ||
            emp.assignedArmada?.toLowerCase().includes('carry') ||
            emp.assignedArmada?.toLowerCase().includes('viar'));

        if (isDriver) {
          const updatedDelivered =
            (emp.deliveredGallons || emp.totalGallonsDeliveredToday || 0) + gallonsDelivered;
          const updatedCommission = (emp.dailyCommission || 0) + earnedCommission;
          return {
            ...emp,
            deliveredGallons: updatedDelivered,
            totalGallonsDeliveredToday: updatedDelivered,
            totalTripsToday: (emp.totalTripsToday || 0) + 1,
            dailyCommission: updatedCommission,
          };
        }
        return emp;
      })
    );

    showToast(
      `✔ POD Selesai! Order #${orderId} (${targetOrder.customerName}) terkirim. Komisi supir +Rp ${earnedCommission.toLocaleString('id-ID')} masuk ke HR`
    );
  };

  const handleRegisterCustomerFromRoad = (
    data: NewCustomerOnTheRoadInput,
    driverName: string
  ) => {
    // 1. Add to Customer Master (Master Data & Kasir)
    const newCustId = `CUST-ROAD-${Date.now().toString().slice(-4)}`;
    const newCustomerMaster: CustomerMasterItem = {
      id: newCustId,
      type: data.category === 'Rumah Tangga' ? 'B2C' : 'B2B',
      name: data.name,
      ownerName: data.ownerName || data.name,
      phone: data.phone,
      address: data.address,
      landmark: data.landmark,
      b2bCategory:
        data.category === 'Rumah Tangga'
          ? undefined
          : data.category === 'Pangkalan Agen'
          ? 'Agen / Pangkalan'
          : 'Toko Kelontong',
      priceTier:
        data.category === 'Pangkalan Agen'
          ? 'Pangkalan'
          : data.category === 'Toko Kelontong'
          ? 'Toko'
          : 'Eceran',
      creditLimit: data.category === 'Rumah Tangga' ? 0 : 3000000,
      emptyGallonDebt: 0,
      currentReceivable: 0,
      lastTransactionDate: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
    setCustomers((prev) => [newCustomerMaster, ...prev]);

    // 2. Add to Store Map Locations (Peta & Lokasi Toko)
    const newStoreMap: StoreMapItem = {
      id: `MAP-${Date.now().toString().slice(-4)}`,
      name: data.name,
      ownerName: data.ownerName || data.name,
      category:
        data.category === 'Pangkalan Agen'
          ? 'Pangkalan Agen'
          : data.category === 'Toko Kelontong'
          ? 'Toko Grosir'
          : 'Rumah Tangga',
      phone: data.phone,
      address: data.address,
      landmark: data.landmark,
      zone: data.zone,
      x: Math.round(25 + Math.random() * 50),
      y: Math.round(25 + Math.random() * 50),
      status: data.addToTodayRoute ? 'active-order' : 'delivered-safe',
      statusLabel: data.addToTodayRoute
        ? 'Order Baru di Jalan'
        : 'Pelanggan Baru Terdaftar',
      todayOrderQty: data.addToTodayRoute ? data.initialOrderQty || 5 : 0,
      regularQuota: data.initialOrderQty || 10,
      emptyGallonDebt: 0,
      currentReceivable: 0,
      lastOrderDate: `${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} ${new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })} WIB`,
      lat: data.lat,
      lng: data.lng,
    };
    setStoreMapLocations((prev) => [newStoreMap, ...prev]);

    // 3. If addToTodayRoute is true, create order in orders list
    if (data.addToTodayRoute) {
      const qty = data.initialOrderQty || 5;
      const unitPrice =
        data.category === 'Pangkalan Agen'
          ? 18500
          : data.category === 'Toko Kelontong'
          ? 19500
          : 21000;
      const newOrder: OrderItem = {
        id: `ORD-ROAD-${Date.now().toString().slice(-4)}`,
        customerName: data.name,
        customerType:
          data.category === 'Pangkalan Agen'
            ? 'Agen / Pangkalan'
            : data.category === 'Toko Kelontong'
            ? 'Toko Kelontong'
            : 'Rumah Tangga',
        phone: data.phone,
        residentialDetail: `${data.address} (Patokan: ${data.landmark})`,
        items: `${qty}x ${data.initialProductType || 'Galon Aqua 19L (Refill)'}`,
        totalGalon: qty,
        emptyGallonsReturned: 0,
        emptyGallonDebt: 0,
        totalAmount: qty * unitPrice,
        paymentStatus: 'Lunas',
        deliveryStatus: 'Dalam Pengiriman',
        driver: driverName,
        time: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        gallonScheme: data.gallonScheme || 'Tukar Galon',
        priceTier:
          data.category === 'Pangkalan Agen'
            ? 'Pangkalan'
            : data.category === 'Toko Kelontong'
            ? 'Toko'
            : 'Eceran',
      };
      setOrders((prev) => [newOrder, ...prev]);
    }

    showToast(
      `Pelanggan baru "${data.name}" terdaftar & tersinkronisasi ke Master Data, Peta, & Kasir!`
    );
  };

  const handleSubmitStoreRegistration = (
    submissionData: Omit<StoreRegistrationSubmission, 'id' | 'status' | 'submittedAt'>
  ) => {
    const newSubmission: StoreRegistrationSubmission = {
      ...submissionData,
      id: `REG-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      status: 'MENUNGGU_KONFIRMASI_ADMIN',
      submittedAt: `${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} ${new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })} WIB`,
    };

    setStoreSubmissions((prev) => [newSubmission, ...prev]);
    showToast(
      `✔ Pengajuan toko "${submissionData.name}" berhasil dikirim ke Admin! Status: MENUNGGU_KONFIRMASI_ADMIN`
    );
  };

  const handleApproveStoreSubmission = (submissionOrId: string | StoreRegistrationSubmission) => {
    const submissionId = typeof submissionOrId === 'string' ? submissionOrId : submissionOrId.id;
    const target = storeSubmissions.find((s) => s.id === submissionId);
    if (!target) return;

    // 1. Convert to CustomerMasterItem
    const isB2B = target.category === 'Toko Mitra';
    const newCustomerId = isB2B
      ? `CUST-B2B-${Date.now().toString().slice(-4)}`
      : `CUST-B2C-${Date.now().toString().slice(-4)}`;

    const newCustomer: CustomerMasterItem = {
      id: newCustomerId,
      type: isB2B ? 'B2B' : 'B2C',
      name: target.name,
      ownerName: target.ownerName || target.name,
      phone: target.phone,
      address: target.address,
      landmark: target.landmark,
      landmarkNote: target.landmark,
      coordinates: target.coordinates,
      mapsUrl:
        target.mapsUrl ||
        (target.coordinates
          ? `https://maps.google.com/?q=${target.coordinates.lat},${target.coordinates.lng}`
          : undefined),
      b2bCategory: isB2B
        ? target.priceTier === 'Pangkalan'
          ? 'Agen / Pangkalan'
          : 'Toko Kelontong'
        : undefined,
      priceTier: target.priceTier,
      creditLimit: isB2B ? (target.priceTier === 'Pangkalan' ? 5000000 : 3000000) : 0,
      emptyGallonDebt: 0,
      currentReceivable: 0,
      lastTransactionDate: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    // 2. Add to active customers (CUSTOMER_MASTER in app state)
    setCustomers((prev) => [newCustomer, ...prev]);

    // 3. Add to storeMapLocations for Peta & Lokasi Toko
    const newStoreMap: StoreMapItem = {
      id: `MAP-${Date.now().toString().slice(-4)}`,
      name: target.name,
      ownerName: target.ownerName || target.name,
      category: isB2B
        ? target.priceTier === 'Pangkalan'
          ? 'Pangkalan Agen'
          : 'Toko Grosir'
        : 'Rumah Tangga',
      phone: target.phone,
      address: target.address,
      landmark: target.landmark,
      zone: 'Rayon Utara',
      x: Math.round(20 + Math.random() * 60),
      y: Math.round(20 + Math.random() * 60),
      status: 'delivered-safe',
      statusLabel: 'Toko Baru Terverifikasi Admin',
      regularQuota: target.priceTier === 'Pangkalan' ? 50 : 20,
      emptyGallonDebt: 0,
      currentReceivable: 0,
      lastOrderDate: `${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      lat: target.coordinates?.lat || -6.5621,
      lng: target.coordinates?.lng || 107.6534,
    };
    setStoreMapLocations((prev) => [newStoreMap, ...prev]);

    // 4. Update status in storeSubmissions
    setStoreSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: 'DISETUJUI' as const } : s))
    );

    showToast(
      `✔ Toko "${target.name}" telah dikonfirmasi dan ditambahkan ke Master Pelanggan aktif (CUSTOMER_MASTER)!`
    );
  };

  const handleRejectStoreSubmission = (submissionId: string) => {
    const target = storeSubmissions.find((s) => s.id === submissionId);
    setStoreSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: 'DITOLAK' as const } : s))
    );
    showToast(`❌ Permohonan registrasi toko "${target?.name || ''}" ditolak.`);
  };

  const handleDirectSpotSale = (saleData: {
    customerName: string;
    phone: string;
    address: string;
    category: 'Pangkalan Agen' | 'Toko Kelontong' | 'Rumah Tangga';
    itemsDescription: string;
    totalGalon: number;
    totalBottles: number;
    totalCups: number;
    totalAmount: number;
    paymentMethod: 'Tunai' | 'QRIS Supir' | 'TEMPO' | 'TEMPO BON TOKO';
    emptyGallonsReturned: number;
    damagedNotes?: string;
    driverId: string;
    driverName: string;
    vehicleId: string;
    status?: OrderStatus;
    priceTier?: PriceTier;
  }) => {
    const isApprovalRequired = saleData.status === 'MENUNGGU_APPROVAL_ADMIN';
    const isTempoSale =
      saleData.paymentMethod === 'TEMPO' || saleData.paymentMethod === 'TEMPO BON TOKO';
    const spotOrderId = `ORD-SPOT-${Date.now().toString().slice(-4)}`;
    const debt = Math.max(0, saleData.totalGalon - saleData.emptyGallonsReturned);
    const newOrder: OrderItem = {
      id: spotOrderId,
      customerName: saleData.customerName,
      customerType:
        saleData.category === 'Pangkalan Agen'
          ? 'Agen / Pangkalan'
          : saleData.category === 'Toko Kelontong'
          ? 'Toko Kelontong'
          : 'Rumah Tangga',
      phone: saleData.phone,
      residentialDetail: saleData.address,
      items: saleData.itemsDescription,
      totalGalon: saleData.totalGalon,
      emptyGallonsReturned: saleData.emptyGallonsReturned,
      emptyGallonDebt: debt,
      totalAmount: saleData.totalAmount,
      paymentStatus: (isApprovalRequired || isTempoSale) ? 'Tempo / Hutang' : 'Lunas',
      paymentMethod: saleData.paymentMethod,
      deliveryStatus: isApprovalRequired ? 'MENUNGGU_APPROVAL_ADMIN' : 'Terkirim',
      driver: saleData.driverName,
      assignedDriverId: saleData.driverId,
      vehicleId: saleData.vehicleId,
      time: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      gallonScheme: 'Tukar Galon',
      priceTier:
        saleData.priceTier ||
        (saleData.category === 'Pangkalan Agen'
          ? 'Pangkalan'
          : saleData.category === 'Toko Kelontong'
          ? 'Toko'
          : 'Eceran'),
      damagedItemsNote: saleData.damagedNotes,
      isSpotSale: true,
      podRecipientName: saleData.customerName,
      podCompletedTime: isApprovalRequired
        ? undefined
        : new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Background Sync ke Google Apps Script Webhook
    if (getGasWebhookUrl()) {
      triggerGasWebhook('spot_order', { order: newOrder }).then((res) => {
        setSyncStatus(res.success ? 'synced' : 'offline');
      });
    }

    if (!isApprovalRequired && isTempoSale) {
      const now = new Date();
      const transactionDate = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const due = new Date();
      due.setDate(due.getDate() + 7);
      const dueDate = `${due.getDate()} ${due.toLocaleDateString('id-ID', { month: 'short' })} ${due.getFullYear()}`;

      const newRec: ReceivableItem = {
        id: `PIU-${spotOrderId.replace(/[^a-zA-Z0-9]/g, '')}`,
        orderId: spotOrderId,
        customerName: saleData.customerName,
        address: saleData.address || 'Alamat Toko Mitra',
        phone: saleData.phone || '0812-9876-5432',
        amount: saleData.totalAmount,
        gallonsLoaned: debt,
        dueDate: dueDate,
        transactionDate: transactionDate,
        status: 'BELUM LUNAS',
      };
      handleAddReceivable(newRec);
    }

    if (isApprovalRequired) {
      showToast(
        `⏳ Pesanan #${spotOrderId} (${saleData.customerName}) diajukan ke Admin. Status: MENUNGGU_APPROVAL_ADMIN.`
      );
      return;
    }

    // Update Armada Load for immediate spot sales
    setArmadaList((prev) =>
      prev.map((armada) => {
        if (
          armada.id === saleData.vehicleId ||
          armada.driverName.toLowerCase().includes(saleData.driverName.toLowerCase().split(' ')[0])
        ) {
          const newLoad = Math.max(0, armada.currentLoad - saleData.totalGalon);
          return {
            ...armada,
            currentLoad: newLoad,
            status: newLoad === 0 ? 'Tersedia' : armada.status,
          };
        }
        return armada;
      })
    );

    // Calculate Driver Commission for Galon (75%) + Bottles (75%) + Cups (75%)
    const gallonRate = Math.round(
      commissionConfig.gallonBaseRate * (commissionConfig.courierSharePercent / 100)
    );
    const bottleRate = Math.round(
      commissionConfig.bottleBaseRate * (commissionConfig.courierSharePercent / 100)
    );
    const cupRate = Math.round(
      commissionConfig.cupBaseRate * (commissionConfig.courierSharePercent / 100)
    );
    const earnedCommission =
      saleData.totalGalon * gallonRate +
      saleData.totalBottles * bottleRate +
      saleData.totalCups * cupRate;

    setEmployees((prev) =>
      prev.map((emp) => {
        const matchDriver =
          emp.id === saleData.driverId ||
          emp.name.toLowerCase().includes(saleData.driverName.toLowerCase().split(' ')[0]);

        if (matchDriver) {
          return {
            ...emp,
            deliveredGallons: (emp.deliveredGallons || 0) + saleData.totalGalon,
            deliveredBottles: (emp.deliveredBottles || 0) + saleData.totalBottles,
            deliveredCups: (emp.deliveredCups || 0) + saleData.totalCups,
            totalGallonsDeliveredToday:
              (emp.totalGallonsDeliveredToday || 0) + saleData.totalGalon,
            totalTripsToday: (emp.totalTripsToday || 0) + 1,
            dailyCommission: (emp.dailyCommission || 0) + earnedCommission,
          };
        }
        return emp;
      })
    );

    showToast(
      `⚡ Spot Kanvasing ${spotOrderId} selesai (Rp ${saleData.totalAmount.toLocaleString(
        'id-ID'
      )}). Komisi +Rp ${earnedCommission.toLocaleString('id-ID')} dicatat ke HR!`
    );
  };

  const handleApproveDriverOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Check matching armada
    const driverArmada = armadaList.find(
      (a) =>
        (targetOrder.vehicleId && a.id === targetOrder.vehicleId) ||
        (targetOrder.assignedDriverId && a.id === targetOrder.assignedDriverId) ||
        a.driverName.toLowerCase().includes(targetOrder.driver.toLowerCase().split(' ')[0]) ||
        (targetOrder.driver && a.driverName.toLowerCase().includes(targetOrder.driver.toLowerCase().split(' ')[0]))
    );

    const currentLoad = driverArmada?.currentLoad ?? 0;
    if (currentLoad < targetOrder.totalGalon) {
      showToast(
        `⚠️ Stok armada supir (${currentLoad} Gln) tidak cukup untuk order (${targetOrder.totalGalon} Gln). Sistem otomatis mengalihkan kekurangan ke [📅 Drop Besok]!`
      );
      handleScheduleNextDrop(orderId);
      return;
    }

    // 1. Deduct armada load and synchronize empty gallon return to armada circulation
    const returnedGallons =
      targetOrder.emptyGallonsReturned !== undefined
        ? targetOrder.emptyGallonsReturned
        : targetOrder.totalGalon || 0;

    if (driverArmada) {
      setArmadaList((prev) =>
        prev.map((a) => {
          if (a.id === driverArmada.id) {
            const newLoad = Math.max(0, a.currentLoad - targetOrder.totalGalon);
            const currentEmpty = a.emptyGallonLoad || 0;
            const newEmptyLoad = currentEmpty + returnedGallons;
            return {
              ...a,
              currentLoad: newLoad,
              emptyGallonLoad: newEmptyLoad,
              status: newLoad === 0 ? 'Tersedia' : a.status,
            };
          }
          return a;
        })
      );
    }

    // 2. Update order status to SELESAI & payment to Lunas or Tempo / Hutang
    const isTempo =
      targetOrder.paymentMethod?.toLowerCase().includes('tempo') ||
      targetOrder.paymentStatus === 'Tempo / Hutang' ||
      targetOrder.paymentMethod === 'TEMPO' ||
      targetOrder.paymentMethod === 'TEMPO BON TOKO';

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            deliveryStatus: 'SELESAI',
            paymentStatus: isTempo ? 'Tempo / Hutang' : 'Lunas',
            podCompletedTime: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        }
        return o;
      })
    );

    // Otomasi Sinkronisasi Buku Piutang & Tempo:
    // Setiap kali kasir/admin approve order TEMPO / TEMPO BON TOKO, otomatis buatkan entri kartu piutang baru
    if (isTempo) {
      const existing = receivables.find(
        (r) => r.orderId === targetOrder.id || r.id === `PIU-${targetOrder.id}`
      );
      if (!existing) {
        const now = new Date();
        const transactionDate = now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const due = new Date();
        due.setDate(due.getDate() + 7);
        const dueDate = `${due.getDate()} ${due.toLocaleDateString('id-ID', { month: 'short' })} ${due.getFullYear()}`;

        const newRec: ReceivableItem = {
          id: `PIU-${targetOrder.id.replace(/[^a-zA-Z0-9]/g, '')}`,
          orderId: targetOrder.id,
          customerName: targetOrder.customerName,
          address: targetOrder.deliveryAddress || targetOrder.residentialDetail || 'Alamat Toko Mitra',
          phone: targetOrder.phone || '0812-9876-5432',
          amount: targetOrder.totalAmount,
          gallonsLoaned:
            targetOrder.emptyGallonDebt ||
            (targetOrder.emptyGallonsReturned !== undefined
              ? Math.max(0, targetOrder.totalGalon - targetOrder.emptyGallonsReturned)
              : 0),
          dueDate: dueDate,
          transactionDate: transactionDate,
          status: 'BELUM LUNAS',
        };
        handleAddReceivable(newRec);
      }
    }

    // Background Sync ke Google Apps Script Webhook
    if (getGasWebhookUrl()) {
      triggerGasWebhook('approve_order', {
        order: {
          ...targetOrder,
          deliveryStatus: 'SELESAI',
          paymentStatus: isTempo ? 'Tempo / Hutang' : 'Lunas',
          emptyGallonsReturned: returnedGallons,
        },
      }).then((res) => {
        setSyncStatus(res.success ? 'synced' : 'offline');
      });
    }

    // 3. Record driver commission
    const gallonRate = Math.round(
      commissionConfig.gallonBaseRate * (commissionConfig.courierSharePercent / 100)
    );
    const earnedCommission = targetOrder.totalGalon * gallonRate;

    setEmployees((prev) =>
      prev.map((emp) => {
        const matchDriver =
          emp.id === targetOrder.assignedDriverId ||
          emp.name.toLowerCase().includes(targetOrder.driver.toLowerCase().split(' ')[0]);

        if (matchDriver) {
          return {
            ...emp,
            deliveredGallons: (emp.deliveredGallons || 0) + targetOrder.totalGalon,
            totalGallonsDeliveredToday:
              (emp.totalGallonsDeliveredToday || 0) + targetOrder.totalGalon,
            totalTripsToday: (emp.totalTripsToday || 0) + 1,
            dailyCommission: (emp.dailyCommission || 0) + earnedCommission,
          };
        }
        return emp;
      })
    );

    showToast(
      `✅ Pesanan #${targetOrder.id} (${targetOrder.customerName}) disetujui! Muatan armada terpotong -${targetOrder.totalGalon} galon, Tabung retur +${returnedGallons} galon masuk sirkulasi armada untuk check-in sore. Status: SELESAI.`
    );
  };

  const handleScheduleNextDrop = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            deliveryStatus: 'JADWAL_DROP_BERIKUTNYA',
            residentialDetail: `${o.residentialDetail || ''} [📅 Drop Besok dari Stok Depo - Alihan Kekurangan Armada]`.trim(),
          };
        }
        return o;
      })
    );

    showToast(
      `📅 Pesanan #${targetOrder.id} (${targetOrder.customerName}) dialihkan ke status JADWAL_DROP_BERIKUTNYA (Drop Besok dari stok depo)!`
    );
  };

  const handleCompleteKasirTransaction = (data: {
    trxId: string;
    customerName: string;
    customerType?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    cart: PosCartItem[];
    paymentMethod: string;
    grandTotal: number;
    subtotal?: number;
    discountAmount?: number;
    discountLabel?: string;
    ppnAmount?: number;
    cashReceived?: number;
    changeAmount?: number;
    deliveryType: 'pickup' | 'armada';
    newOrder?: OrderItem;
    newReceivable?: ReceivableItem;
  }) => {
    const isTempo = data.paymentMethod === 'Bayar Tempo';
    const nowTimeStr = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB`;

    // 1. Tambah ke riwayat transaksi kasir
    const newTx: KasirTransaction = {
      id: data.trxId,
      customerName: data.customerName,
      customerType: data.customerType || 'Pelanggan POS',
      customerPhone: data.customerPhone,
      deliveryAddress: data.deliveryAddress,
      items: data.cart.map((i) => `${i.qty} ${i.name}`).join(', '),
      totalAmount: data.grandTotal,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount,
      discountLabel: data.discountLabel,
      ppnAmount: data.ppnAmount,
      cashReceived: data.cashReceived,
      changeAmount: data.changeAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: isTempo ? 'Tempo / Hutang' : 'Lunas',
      time: nowTimeStr,
      timestamp: Date.now(),
      deliveryType: data.deliveryType,
      cartItems: data.cart,
    };
    setKasirTransactions((prev) => [newTx, ...prev]);

    // 2. Kurangi stok fisik tabung terisi (totalFilled) dan kembalian kosong pada gallonCirculation
    setGallonCirculation((prev) => {
      let isAnyMatched = false;
      const updated = prev.map((stock) => {
        let deduction = 0;
        let emptyReturn = 0;
        const catLower = stock.category.toLowerCase();

        data.cart.forEach((item) => {
          const nameLower = item.name.toLowerCase();
          const isAqua = catLower.includes('aqua') && nameLower.includes('aqua');
          const isLeMin = (catLower.includes('le minerale') || catLower.includes('minerale')) && (nameLower.includes('minerale') || nameLower.includes('le min'));
          const isVit = catLower.includes('vit') && nameLower.includes('vit');
          const isCleo = catLower.includes('cleo') && nameLower.includes('cleo');

          if (isAqua || isLeMin || isVit || isCleo) {
            isAnyMatched = true;
            deduction += item.qty;
            if (item.emptyGallonsReturned !== undefined && item.emptyGallonsReturned > 0) {
              emptyReturn += item.emptyGallonsReturned;
            }
          }
        });

        if (deduction > 0 || emptyReturn > 0) {
          return {
            ...stock,
            filled: Math.max(0, stock.filled - deduction),
            empty: stock.empty + emptyReturn,
          };
        }
        return stock;
      });

      // Fallback: If cart has gallon refill items that didn't match specific brand substring, deduct from first category
      const unmatchedGallonQty = data.cart
        .filter((item) => item.isGalonRefill || item.category === 'Galon 19L')
        .reduce((sum, item) => sum + item.qty, 0);

      if (!isAnyMatched && unmatchedGallonQty > 0 && updated.length > 0) {
        updated[0] = {
          ...updated[0],
          filled: Math.max(0, updated[0].filled - unmatchedGallonQty),
        };
      }

      return updated;
    });

    // Kurangi stok kemasan dus & produk di Master Products
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = data.cart.find(
          (c) =>
            c.productId === prod.id ||
            c.name.trim().toLowerCase() === prod.name.trim().toLowerCase()
        );
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.qty),
          };
        }
        return prod;
      })
    );

    // 3. Jika Bayar Tempo: Catat langsung sebagai tagihan baru di Buku Piutang & Tempo
    if (isTempo && data.newReceivable) {
      setReceivables((prev) => {
        if (prev.some((r) => r.id === data.newReceivable!.id)) return prev;
        return [data.newReceivable!, ...prev];
      });
    }

    // 4. Jika Kirim Armada: Masukkan order baru ke antrean pengiriman
    if (data.deliveryType === 'armada' && data.newOrder) {
      setOrders((prev) => {
        if (prev.some((o) => o.id === data.newOrder!.id)) return prev;
        return [data.newOrder!, ...prev];
      });
    }

    showToast(
      isTempo
        ? `Nota Tempo #${data.trxId} (Rp ${data.grandTotal.toLocaleString('id-ID')}) tercatat di Buku Piutang!`
        : `Transaksi #${data.trxId} (Rp ${data.grandTotal.toLocaleString('id-ID')}) berhasil & omzet kasir terupdate!`
    );
  };

  const handleRefresh = () => {
    showToast('Data inventaris & order depo telah diperbarui secara real-time.');
  };

  const activeTempoCount = receivables.filter(
    (r) => r.status !== 'LUNAS' && r.status !== 'Aman' && r.amount > 0
  ).length;

  const activeOrdersCount = orders.filter(
    (o) => o.deliveryStatus === 'Diproses' || o.deliveryStatus === 'MENUNGGU_DRIVER' || o.deliveryStatus === 'MENUNGGU_APPROVAL_ADMIN'
  ).length;

  const activeArmadaCount = useMemo(() => {
    return armadaList.filter(
      (a) => (a.currentLoad || 0) > 0 && a.status !== 'Servis'
    ).length;
  }, [armadaList]);

  return (
    <LanguageProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#080e1a] text-slate-100 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-cyan-400 text-xs font-semibold text-white shadow-[0_0_20px_rgba(0,229,255,0.3)] animate-bounce">
          <i className="fa-solid fa-circle-check text-cyan-400 text-sm"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern Sidebar with Colored Badges per Function */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={handleSelectMenu}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        logoUrl={logoUrl}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        activeTempoCount={activeTempoCount}
        activeOrdersCount={activeOrdersCount}
        activeArmadaCount={activeArmadaCount}
        syncStatus={syncStatus}
        isManagerUnlocked={isManagerUnlocked}
        isSuperAdminUnlocked={isSuperAdminUnlocked}
        isKasirUnlocked={isKasirUnlocked}
        isPiutangUnlocked={isPiutangUnlocked}
        currentRole={currentRole}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onExitToNormalMode={handleExitToNormalMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden min-h-0 transition-all duration-300">
        {/* Top Header */}
        <Header
          activeMenu={activeMenu}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onOpenOrderModal={() => setIsOrderModalOpen(true)}
          onOpenCodeModal={() => setIsCodeModalOpen(true)}
          onOpenAboutModal={() => setIsAboutModalOpen(true)}
          onRefresh={handleRefresh}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onSelectMenu={handleSelectMenu}
          allowMultiDrop={allowMultiDrop}
          onToggleMultiDrop={handleToggleMultiDrop}
          onOpenSettlement={() => setIsSettlementModalOpen(true)}
          currentRole={currentRole}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
          onExitToNormalMode={handleExitToNormalMode}
          products={products}
        />

        {/* Dynamic Content Views - Zero Outer Scroll for ALL modules */}
        <main className={`flex-1 p-2.5 sm:p-3 flex flex-col min-h-0 bg-radial-gradient ${activeMenu === 'master-data' ? 'overflow-y-auto pb-24' : 'overflow-hidden'}`}>
          <div className={`${activeMenu === 'kasir' || activeMenu === 'maps-pelanggan' || activeMenu === 'driver-mobile' ? 'w-full' : 'max-w-7xl mx-auto w-full'} ${activeMenu === 'master-data' ? 'min-h-full flex flex-col' : 'h-full flex flex-col overflow-hidden min-h-0'}`}>
            {!isMenuAllowed(activeMenu, currentRole) ? (
              <AccessRestrictedView
                currentRole={currentRole}
                attemptedMenu={activeMenu}
                onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
                onFallbackToAllowedMenu={() => {
                  const allowed = getAllowedMenus(currentRole);
                  setActiveMenu(allowed.includes('kasir') ? 'kasir' : allowed[0] || 'kasir');
                }}
              />
            ) : (
              <>
                {activeMenu === 'dashboard' && (
              <DashboardView
                metrics={METRIC_CARDS}
                activeCardId={activeCardId}
                onSelectCard={(id) => setActiveCardId(id)}
                orders={orders}
                gallonCirculation={gallonCirculation}
                onOpenOrderModal={() => handleOpenOrderModal('B2C')}
                onNavigateTab={(tab) => handleSelectMenu(tab)}
                onOpenSettlement={() => setIsSettlementModalOpen(true)}
                products={products}
                allowMultiDrop={allowMultiDrop}
                onToggleMultiDrop={handleToggleMultiDrop}
                pendingStoreSubmissionsCount={
                  storeSubmissions.filter((s) => s.status === 'MENUNGGU_KONFIRMASI_ADMIN').length
                }
                onOpenStoreSubmissions={() => handleSelectMenu('kasir')}
                onOpenPurchaseOrderModal={() => setIsPOModalOpen(true)}
                onOpenBongkarModal={() => setIsBongkarModalOpen(true)}
                inboundDropsCount={inboundDrops.length}
                receivables={receivables}
                kasirTransactions={kasirTransactions}
              />
            )}

            {activeMenu === 'water_fmcg' && (
              <WaterFmcgArchitectureView />
            )}

            {activeMenu === 'order' && (
              <OrderView
                orders={orders}
                onOpenOrderModal={handleOpenOrderModal}
                onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
                onTransferToKasir={handleTransferToKasir}
                armadaList={armadaList}
                onApproveDriverOrder={handleApproveDriverOrder}
                onScheduleNextDrop={handleScheduleNextDrop}
              />
            )}

            {activeMenu === 'maps-pelanggan' && (
              <MapsPelangganView
                stores={storeMapLocations}
                onCreateOrderForStore={handleCreateOrderFromMap}
                onNavigateWhatsApp={() => setActiveMenu('whatsapp')}
                onAddCustomer={handleAddCustomer}
              />
            )}

            {activeMenu === 'driver-mobile' && (
              <DriverMobileView
                orders={orders}
                armadaList={armadaList}
                employees={employees}
                customers={customers}
                commissionConfig={commissionConfig}
                receivables={receivables}
                dispatchAssignments={dispatchAssignments}
                onUpdateDispatchAssignment={handleUpdateDispatchAssignment}
                onCollectTempoPayment={handleCollectTempoFromDriver}
                onCompleteDelivery={handleCompleteDriverDelivery}
                onExitDriverMode={() => handleSelectMenu('dashboard')}
                onRegisterCustomerFromRoad={handleRegisterCustomerFromRoad}
                onDirectSpotSale={handleDirectSpotSale}
                onAcceptOrder={handleAcceptDriverOrder}
                allowMultiDrop={allowMultiDrop}
                onToggleMultiDrop={handleToggleMultiDrop}
                storeSubmissions={storeSubmissions}
                onSubmitStoreRegistration={handleSubmitStoreRegistration}
              />
            )}

            {activeMenu === 'master-data' && (
              <MasterDataView
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProducts={handleUpdateProducts}
                customers={customers}
                onAddCustomer={handleAddCustomer}
                commissionConfig={commissionConfig}
                onUpdateCommissionConfig={handleUpdateCommissionConfig}
              />
            )}

            {activeMenu === 'armada' && (
              <ArmadaView
                armadaList={armadaList}
                onAddArmada={handleAddArmada}
                onUpdateArmada={handleUpdateArmada}
                dispatchAssignments={dispatchAssignments}
                onUpdateDispatchAssignment={handleUpdateDispatchAssignment}
              />
            )}

            {activeMenu === 'sirkulasi-galon' && (
              <SirkulasiGalonView
                gallonCirculation={gallonCirculation}
                onUpdateGallonCirculation={setGallonCirculation}
              />
            )}

            {activeMenu === 'kasir' && (
              (isKasirUnlocked || isSuperAdminUnlocked || currentRole === 'DEVELOPER' || currentRole === 'SUPER_ADMIN') ? (
                <KasirView
                  onNavigateWhatsApp={() => setActiveMenu('whatsapp')}
                  prefillOrder={prefillOrderForKasir}
                  onClearPrefill={() => setPrefillOrderForKasir(null)}
                  orders={orders}
                  customers={customers}
                  products={products}
                  onAddProduct={handleAddProduct}
                  onAddCustomer={handleAddCustomer}
                  onAddOrder={handleAddOrder}
                  onAddReceivable={handleAddReceivable}
                  armadaList={armadaList}
                  allowMultiDrop={allowMultiDrop}
                  onToggleMultiDrop={handleToggleMultiDrop}
                  storeSubmissions={storeSubmissions}
                  onApproveStoreSubmission={handleApproveStoreSubmission}
                  onRejectStoreSubmission={handleRejectStoreSubmission}
                  onApproveDriverOrder={handleApproveDriverOrder}
                  onScheduleNextDrop={handleScheduleNextDrop}
                  kasirTransactions={kasirTransactions}
                  onCompleteKasirTransaction={handleCompleteKasirTransaction}
                  onShowToast={showToast}
                  onLockSession={handleLockKasirSession}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.4)] mb-4">
                    <i className="fa-solid fa-cash-register text-2xl"></i>
                  </div>
                  <h3 className="text-base font-black text-white [body.light-theme_&]:text-slate-900 mb-1">
                    Kasir &amp; Admin Depo Terkunci
                  </h3>
                  <p className="text-xs text-slate-400 [body.light-theme_&]:text-slate-600 max-w-md mb-5 leading-relaxed">
                    Halaman ini memuat transaksi finansial, pembayaran tunai/QRIS, cetak nota struk kasir, dan rekapitulasi kas harian. Masukkan PIN otorisasi untuk membuka.
                  </p>
                  <button
                    onClick={() => setModulePinTarget('kasir')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-black shadow-[0_0_15px_rgba(14,165,233,0.4)] cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <i className="fa-solid fa-key"></i>
                    <span>Buka Akses dengan PIN Kasir</span>
                  </button>
                  <p className="text-[10px] text-slate-500 mt-3 font-mono">
                    Default PIN Manajemen: 1234
                  </p>
                </div>
              )
            )}

            {activeMenu === 'piutang' && (
              (isPiutangUnlocked || isSuperAdminUnlocked || currentRole === 'DEVELOPER' || currentRole === 'SUPER_ADMIN') ? (
                <PiutangView
                  receivables={receivables}
                  onPayReceivable={handlePayReceivable}
                  onNavigateWhatsApp={() => setActiveMenu('whatsapp')}
                  onLockSession={handleLockPiutangSession}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] mb-4">
                    <i className="fa-solid fa-file-invoice-dollar text-2xl"></i>
                  </div>
                  <h3 className="text-base font-black text-white [body.light-theme_&]:text-slate-900 mb-1">
                    Buku Piutang &amp; Tagihan Tempo Terkunci
                  </h3>
                  <p className="text-xs text-slate-400 [body.light-theme_&]:text-slate-600 max-w-md mb-5 leading-relaxed">
                    Halaman ini memuat data tagihan tempo pangkalan dan toko kelontong binaan, saldo piutang, dan monitoring batas kredit galon. Masukkan PIN otorisasi untuk membuka.
                  </p>
                  <button
                    onClick={() => setModulePinTarget('piutang')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <i className="fa-solid fa-key"></i>
                    <span>Buka Akses dengan PIN Piutang</span>
                  </button>
                  <p className="text-[10px] text-slate-500 mt-3 font-mono">
                    Default PIN Manajemen: 1234
                  </p>
                </div>
              )
            )}

            {activeMenu === 'hr' && (
              <HrView
                commissionConfig={commissionConfig}
                onUpdateCommissionConfig={handleUpdateCommissionConfig}
                onNavigateWhatsApp={() => setActiveMenu('whatsapp')}
                employees={employees}
                onUpdateEmployees={setEmployees}
              />
            )}

            {activeMenu === 'admin-dokumen' && (
              (isManagerUnlocked || isSuperAdminUnlocked || currentRole === 'DEVELOPER' || currentRole === 'SUPER_ADMIN') ? (
                <ExecutiveManagerView
                  orders={orders}
                  products={products}
                  gallonCirculation={gallonCirculation}
                  armadaList={armadaList}
                  employees={employees}
                  receivables={receivables}
                  kasirTransactions={kasirTransactions}
                  purchaseOrders={purchaseOrders}
                  inboundDrops={inboundDrops}
                  onUpdateGallonCirculation={setGallonCirculation}
                  onLockSession={handleLockManagerSession}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)] mb-4">
                    <i className="fa-solid fa-user-shield text-2xl"></i>
                  </div>
                  <h3 className="text-base font-black text-white [body.light-theme_&]:text-slate-900 mb-1">
                    Executive Manager (Pusat Kendali Pemilik) Terkunci
                  </h3>
                  <p className="text-xs text-slate-400 [body.light-theme_&]:text-slate-600 max-w-md mb-5 leading-relaxed">
                    Halaman ini memuat audit mikro laba rugi, susut aset galon, kinerja produktivitas supir, dan riwayat PO pabrik. Masukkan PIN otorisasi untuk membuka.
                  </p>
                  <button
                    onClick={() => setModulePinTarget('manager')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black shadow-[0_0_15px_rgba(244,63,94,0.4)] cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <i className="fa-solid fa-key"></i>
                    <span>Buka Akses dengan PIN Manajer</span>
                  </button>
                  <p className="text-[10px] text-slate-500 mt-3 font-mono">
                    Default PIN: 1234
                  </p>
                </div>
              )
            )}

            {activeMenu === 'super-admin' && (
              isSuperAdminUnlocked ? (
                <SuperAdminDashboard
                  onLockSession={handleLockSuperAdminSession}
                  onExitToNormalMode={handleExitToNormalMode}
                  logoUrl={logoUrl}
                  onUpdateLogoUrl={handleUpdateLogoUrl}
                  onOpenFirstRunWizard={() => setIsFirstRunWizardOpen(true)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)] mb-4">
                    <i className="fa-solid fa-shield-halved text-2xl"></i>
                  </div>
                  <h3 className="text-base font-black text-white [body.light-theme_&]:text-slate-900 mb-1">
                    Super Admin (Hak Akses Root &amp; Konfigurasi Inti) Terkunci
                  </h3>
                  <p className="text-xs text-slate-400 [body.light-theme_&]:text-slate-600 max-w-md mb-2 leading-relaxed">
                    Halaman ini memuat status sistem &amp; server health, AI System Doctor, kontrol sinkronisasi database, lisensi enterprise, dan manajemen otorisasi PIN 6 digit tertinggi.
                  </p>

                  {hasMasterSuperAdmin() ? (
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
                      <i className="fa-solid fa-user-shield text-rose-400"></i>
                      <span>
                        Otoritas Root Terdaftar:{' '}
                        <strong className="text-white">
                          {getMasterSuperAdmin()?.ownerName}
                        </strong>{' '}
                        ({getMasterSuperAdmin()?.masterEmail})
                      </span>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => setIsFirstRunWizardOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600/30 border border-rose-500 text-rose-300 text-xs font-bold hover:bg-rose-600/40 cursor-pointer shadow-sm"
                      >
                        ⚡ Setup Otoritas Pemilik Depo (Root Admin)
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setIsSuperAdminPinModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-black shadow-[0_0_15px_rgba(225,29,72,0.4)] cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <i className="fa-solid fa-key"></i>
                    <span>Buka Akses Super Admin (PIN Root 6 Digit)</span>
                  </button>
                  <p className="text-[10px] text-slate-500 mt-3 font-mono">
                    Tingkat Keamanan: Root Authorization Protocol • SHA-256 Vault
                  </p>
                </div>
              )
            )}

            {activeMenu === 'whatsapp' && <WhatsAppView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Drawer & Bottom Navigation */}
      <BottomNavigation
        activeMenu={activeMenu}
        onSelectMenu={handleSelectMenu}
        allowedMenus={getAllowedMenus(currentRole)}
      />

      {/* Modal Tutup Buku Harian (Settlement 17:00 WIB) */}
      <SettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        orders={orders}
        armadaList={armadaList}
        employees={employees}
        gallonCirculation={gallonCirculation}
        driverSetoran={DRIVER_SETORAN}
        receivables={receivables}
        dailyReconciliationAddedCash={dailyReconciliationAddedCash}
        onBookCommission={() => {
          showToast('🔒 Komisi supir berhasil dibukukan & status transaksi hari ini resmi terkunci!');
          if (getGasWebhookUrl()) {
            triggerGasWebhook('settlement', {
              settlement: {
                date: new Date().toLocaleDateString('id-ID'),
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
                isLocked: true,
                grandTotalOmzet: 31190000 + dailyReconciliationAddedCash,
                kasirCashDirect: 11200000,
                kasirQrisTransfer: 7250000,
                driverSetoran: 12740000,
                pelunasanTempo: dailyReconciliationAddedCash,
                expectedVaultCash: 23940000 + dailyReconciliationAddedCash,
                totalArmadaEmptyGallons: 300,
                selisihGalon: 0,
                lockedBy: 'Super Admin (Irfan Hakim)',
              },
            }).then((res) => {
              setSyncStatus(res.success ? 'synced' : 'offline');
            });
          }
        }}
      />

      {/* Modal Input Order Baru (Supports B2C & B2B) */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onAddOrder={handleAddOrder}
        initialMode={orderModalMode}
        commissionConfig={commissionConfig}
        armadaList={armadaList}
      />

      {/* Modal Purchase Order (PO) Pabrik */}
      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        products={products}
        onConfirmPO={handleConfirmPO}
      />

      {/* Modal Bongkar Muat Barang (Inbound Supply Chain) */}
      <BongkarMuatModal
        isOpen={isBongkarModalOpen}
        onClose={() => setIsBongkarModalOpen(false)}
        inboundDrops={inboundDrops}
        products={products}
        onConfirmBongkar={handleConfirmBongkar}
        syncStatus={syncStatus}
      />

      {/* Modal Salin / Lihat Kode Google Apps Script & Cloud Sync */}
      <CodeExportModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        orders={orders}
        receivables={receivables}
        armadaList={armadaList}
        employees={employees}
        inboundDrops={inboundDrops}
        purchaseOrders={purchaseOrders}
        products={products}
        gallonCirculation={gallonCirculation}
        syncStatus={syncStatus}
        onSyncSuccess={() => setSyncStatus('synced')}
      />

      {/* Modal Tentang Aplikasi & Panduan SOP (JacS Enterprise) */}
      <AboutAppModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        logoUrl={logoUrl}
        onUpdateLogoUrl={handleUpdateLogoUrl}
      />

      {/* Modal PIN Otentikasi Dinamis (Executive Manager, Kasir & Admin, Buku Piutang & Tempo) */}
      <ManagerPinModal
        isOpen={Boolean(modulePinTarget) || isManagerPinModalOpen}
        onClose={() => {
          setModulePinTarget(null);
          setIsManagerPinModalOpen(false);
        }}
        onSuccess={(remember) => {
          const target = modulePinTarget || 'manager';
          handleUnlockModule(target, remember);
        }}
        title={
          modulePinTarget === 'kasir'
            ? 'Otorisasi Kasir & Admin'
            : modulePinTarget === 'piutang'
            ? 'Otorisasi Buku Piutang & Tempo'
            : 'Otorisasi Manajerial'
        }
        subtitle={
          modulePinTarget === 'kasir'
            ? 'Akses Terproteksi Transaksi & Pembukuan Kasir'
            : modulePinTarget === 'piutang'
            ? 'Akses Terproteksi Buku Piutang & Limit Kredit'
            : 'Akses Terproteksi Khusus Pemilik & Manajer'
        }
        description={
          modulePinTarget === 'kasir'
            ? 'Modul Kasir & Admin memuat transaksi penjualan langsung, penerimaan kas harian, dan pembayaran QRIS/Tunai. Masukkan PIN otorisasi untuk membuka.'
            : modulePinTarget === 'piutang'
            ? 'Modul Buku Piutang memuat daftar tagihan tempo toko langganan, pelunasan nota, dan monitoring plafon kredit. Masukkan PIN otorisasi untuk membuka.'
            : 'Halaman Executive Manager memuat data rahasia HPP, struktur harga, otorisasi plafon kredit & PO Pabrik.'
        }
        badgeText={
          modulePinTarget === 'kasir'
            ? 'KASIR'
            : modulePinTarget === 'piutang'
            ? 'TEMPO'
            : 'VIP'
        }
        colorScheme={
          modulePinTarget === 'kasir'
            ? 'sky'
            : modulePinTarget === 'piutang'
            ? 'amber'
            : 'rose'
        }
      />

      {/* Modal PIN Otentikasi Super Admin (Root Access) */}
      <SuperAdminPinModal
        isOpen={isSuperAdminPinModalOpen}
        onClose={() => setIsSuperAdminPinModalOpen(false)}
        onSuccess={handleSuperAdminPinSuccess}
        onOpenFirstRunWizard={() => setIsFirstRunWizardOpen(true)}
      />

      {/* Modal First-Run Setup Otoritas Pemilik Depo (Root Admin) */}
      <InitialSetupWizardModal
        isOpen={isFirstRunWizardOpen}
        onClose={() => setIsFirstRunWizardOpen(false)}
        onCompleted={handleFirstRunWizardComplete}
      />

      {/* Modal Switch Role / Hak Akses RBAC */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={currentRole}
        onRoleChanged={(newRole) => {
          setCurrentRoleState(newRole);
          if (newRole === 'DEVELOPER') {
            setIsSuperAdminUnlocked(true);
            setIsManagerUnlocked(true);
            setIsKasirUnlocked(true);
            setIsPiutangUnlocked(true);
          } else if (newRole === 'SUPER_ADMIN') {
            setIsSuperAdminUnlocked(true);
            setIsManagerUnlocked(true);
            setIsKasirUnlocked(true);
            setIsPiutangUnlocked(true);
          } else if (newRole === 'OWNER') {
            setIsManagerUnlocked(true);
            setIsKasirUnlocked(true);
            setIsPiutangUnlocked(true);
            setIsSuperAdminUnlocked(false);
            if (activeMenu === 'super-admin') {
              setActiveMenu('dashboard');
            }
          } else {
            setIsSuperAdminUnlocked(false);
            setIsManagerUnlocked(false);
            if (!isMenuAllowed(activeMenu, 'CASHIER')) {
              setActiveMenu('kasir');
            }
          }
        }}
        onShowToast={showToast}
      />
    </div>
    </LanguageProvider>
  );
}
