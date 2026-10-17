/**
 * NexaHub Pro Service: Depo Air Minum RO & FMCG Dual-Type Distribution
 * Manages dual-type logistics, physical gallon asset conservation, and 3-bucket tempo aging.
 */

import {
  NexaProductItem,
  NexaPartnerProfile,
  InvoiceTempoItem,
  PhysicalGallonMovementRecord,
  DriverRevisitPayload,
  DriverRevisitResult,
  AgingBucketSummary,
  PhysicalGallonInventorySummary,
  WaterProductSku,
  FmcgProductSku,
} from '../types/nexaHubDistribution';

export const INITIAL_NEXA_PRODUCTS: NexaProductItem[] = [
  // WATER RO & MINERAL LINE
  {
    sku: 'GALLON_RO_19L',
    name: 'Air Minum RO (Reverse Osmosis) 19L',
    category: 'WATER_RO',
    unit: 'Tabung 19L',
    basePrice: 19000,
    partnerPrice: 16000,
    currentStock: 320,
    description: 'Air murni hasil filtrasi RO membran 0.0001 mikron dengan TDS < 10 ppm, higienis & bebas mikroba.',
  },
  {
    sku: 'GALLON_19L',
    name: 'Air Mineral Alami Pegunungan 19L',
    category: 'WATER_RO',
    unit: 'Tabung 19L',
    basePrice: 18000,
    partnerPrice: 15000,
    currentStock: 260,
    description: 'Air mineral alami kaya elektrolit seimbang dengan pH 7.8, rasa segar alami pegunungan.',
  },
  {
    sku: 'CUP_240ML',
    name: 'Air RO Kemasan Cup 240ml',
    category: 'WATER_RO',
    unit: 'Dus (48 Cup)',
    basePrice: 26000,
    partnerPrice: 22500,
    currentStock: 180,
    description: 'Kemasan cup praktis untuk acara hajatan, arisan, pengajian, dan rapat kantor.',
  },
  {
    sku: 'BOTTLE_600ML',
    name: 'Air RO Botol Sedang 600ml',
    category: 'WATER_RO',
    unit: 'Dus (24 Botol)',
    basePrice: 42000,
    partnerPrice: 36000,
    currentStock: 140,
    description: 'Kemasan botol premium ergonomis untuk mobilitas santai dan pasokan warung.',
  },

  // FMCG / SEMBAKO LINE (DUAL-TYPE COMPANION)
  {
    sku: 'RICE_5KG',
    name: 'Beras Premium Setra Ramos 5kg',
    category: 'FMCG_SEMBAKO',
    unit: 'Karung 5kg',
    basePrice: 74000,
    partnerPrice: 68500,
    currentStock: 95,
    description: 'Beras pulen tanpa pemutih & pengawet, disukai pelanggan toko kelontong & warung makan.',
  },
  {
    sku: 'EGGS_TRAY',
    name: 'Telur Ayam Ras Segar 1 Tray',
    category: 'FMCG_SEMBAKO',
    unit: 'Tray (30 Butir)',
    basePrice: 56000,
    partnerPrice: 51000,
    currentStock: 70,
    description: 'Telur segar langsung dari peternakan binaan, cangkang tebal dan kualitas terjamin.',
  },
  {
    sku: 'COOKING_OIL_2L',
    name: 'Minyak Goreng Sawit Pouch 2L',
    category: 'FMCG_SEMBAKO',
    unit: 'Pouch 2 Liter',
    basePrice: 37500,
    partnerPrice: 34000,
    currentStock: 110,
    description: 'Minyak goreng jernih 2x penyaringan, tahan panas tinggi dan kaya vitamin A.',
  },
];

export const INITIAL_NEXA_PARTNERS: NexaPartnerProfile[] = [
  {
    id: 'PTR-001',
    name: 'Pangkalan Berkah Sejahtera',
    ownerName: 'H. Abdul Rauf',
    phone: '0812-3456-7890',
    address: 'Jl. AP Pettarani No. 88, Makassar',
    partnerType: 'TOKO_WARUNG',
    assignedSalesId: 'SLS-MAKASSAR-01',
    assignedDriverId: 'DRV-01',
    tenorDaysAllowed: 14,
    creditLimit: 5000000,
    holdingEmptyGallonDebt: 45,
    maxGallonHoldingQuota: 60,
    depositHeldAmount: 500000,
    currentReceivableBalance: 1250000,
  },
  {
    id: 'PTR-002',
    name: 'Toko Berkah Rezeki Bu Siti',
    ownerName: 'Ibu Siti Aminah',
    phone: '0813-9876-5432',
    address: 'Jl. Pengayoman No. 12, Panakkukang',
    partnerType: 'TOKO_WARUNG',
    assignedSalesId: 'SLS-MAKASSAR-02',
    assignedDriverId: 'DRV-01',
    tenorDaysAllowed: 10,
    creditLimit: 3000000,
    holdingEmptyGallonDebt: 32,
    maxGallonHoldingQuota: 45,
    depositHeldAmount: 350000,
    currentReceivableBalance: 780000,
  },
  {
    id: 'PTR-003',
    name: 'Warung Madura Berkah Malam',
    ownerName: 'Cak Mahmud',
    phone: '0852-1122-3344',
    address: 'Jl. Perintis Kemerdekaan KM 9',
    partnerType: 'TOKO_WARUNG',
    assignedSalesId: undefined, // Opsional per spesifikasi
    assignedDriverId: 'DRV-02',
    tenorDaysAllowed: 7,
    creditLimit: 2000000,
    holdingEmptyGallonDebt: 28,
    maxGallonHoldingQuota: 35,
    depositHeldAmount: 200000,
    currentReceivableBalance: 980000,
  },
  {
    id: 'PTR-004',
    name: 'Depot Segar Mandiri Warga',
    ownerName: 'Pak Hendra Pratama',
    phone: '0878-5544-3322',
    address: 'Kompleks Bumi Tamalanrea Permai Blok C',
    partnerType: 'REFIL_MANDIRI',
    assignedSalesId: undefined,
    assignedDriverId: 'DRV-02',
    tenorDaysAllowed: 5,
    creditLimit: 1500000,
    holdingEmptyGallonDebt: 18,
    maxGallonHoldingQuota: 25,
    depositHeldAmount: 0,
    currentReceivableBalance: 320000,
  },
  {
    id: 'PTR-005',
    name: 'Kantin Resto Celebes Bahari',
    ownerName: 'Ibu Rosdiana',
    phone: '0821-6677-8899',
    address: 'Jl. Somba Opu No. 44, Ujung Pandang',
    partnerType: 'TOKO_WARUNG',
    assignedSalesId: 'SLS-MAKASSAR-01',
    assignedDriverId: 'DRV-01',
    tenorDaysAllowed: 14,
    creditLimit: 4000000,
    holdingEmptyGallonDebt: 40,
    maxGallonHoldingQuota: 50,
    depositHeldAmount: 400000,
    currentReceivableBalance: 1650000,
  },
];

export const INITIAL_INVOICES_TEMPO: InvoiceTempoItem[] = [
  // BUCKET 1: 0-7 HARI (LANCAR)
  {
    id: 'INV-2026-089',
    invoiceNumber: 'INV/2026/10/089',
    partnerId: 'PTR-001',
    partnerName: 'Pangkalan Berkah Sejahtera',
    partnerType: 'TOKO_WARUNG',
    assignedSalesId: 'SLS-MAKASSAR-01',
    invoiceDate: '2026-10-04',
    dueDate: '2026-10-18',
    tenorDays: 14,
    totalAmount: 960000,
    paidAmount: 0,
    remainingBalance: 960000,
    daysElapsed: 3,
    bucket: 'BUCKET_0_7_LANCAR',
    status: 'LANCAR',
    waterSummary: '40 Gln RO 19L + 8 Dus Cup 240ml',
    fmcgSummary: '4 Karung Beras 5kg + 4 Pouch Minyak 2L',
    filledGallonsOut: 40,
    emptyGallonsRetrieved: 35,
  },
  {
    id: 'INV-2026-092',
    invoiceNumber: 'INV/2026/10/092',
    partnerId: 'PTR-004',
    partnerName: 'Depot Segar Mandiri Warga',
    partnerType: 'REFIL_MANDIRI',
    invoiceDate: '2026-10-05',
    dueDate: '2026-10-10',
    tenorDays: 5,
    totalAmount: 320000,
    paidAmount: 0,
    remainingBalance: 320000,
    daysElapsed: 2,
    bucket: 'BUCKET_0_7_LANCAR',
    status: 'LANCAR',
    waterSummary: '20 Gln RO 19L',
    fmcgSummary: 'Tidak ada',
    filledGallonsOut: 20,
    emptyGallonsRetrieved: 18,
  },

  // BUCKET 2: 8-14 HARI (JATUH TEMPO)
  {
    id: 'INV-2026-074',
    invoiceNumber: 'INV/2026/09/074',
    partnerId: 'PTR-002',
    partnerName: 'Toko Berkah Rezeki Bu Siti',
    partnerType: 'TOKO_WARUNG',
    assignedSalesId: 'SLS-MAKASSAR-02',
    invoiceDate: '2026-09-27',
    dueDate: '2026-10-07',
    tenorDays: 10,
    totalAmount: 780000,
    paidAmount: 0,
    remainingBalance: 780000,
    daysElapsed: 10,
    bucket: 'BUCKET_8_14_JATUH_TEMPO',
    status: 'JATUH_TEMPO',
    waterSummary: '25 Gln RO 19L + 5 Dus Botol 600ml',
    fmcgSummary: '3 Tray Telur Ayam + 2 Pouch Minyak',
    filledGallonsOut: 25,
    emptyGallonsRetrieved: 20,
  },
  {
    id: 'INV-2026-077',
    invoiceNumber: 'INV/2026/09/077',
    partnerId: 'PTR-001',
    partnerName: 'Pangkalan Berkah Sejahtera',
    partnerType: 'TOKO_WARUNG',
    assignedSalesId: 'SLS-MAKASSAR-01',
    invoiceDate: '2026-09-25',
    dueDate: '2026-10-09',
    tenorDays: 14,
    totalAmount: 290000,
    paidAmount: 0,
    remainingBalance: 290000,
    daysElapsed: 12,
    bucket: 'BUCKET_8_14_JATUH_TEMPO',
    status: 'JATUH_TEMPO',
    waterSummary: '10 Gln Mineral 19L + 3 Dus Cup',
    fmcgSummary: '2 Pouch Minyak Goreng 2L',
    filledGallonsOut: 10,
    emptyGallonsRetrieved: 8,
  },

  // BUCKET 3: >14 HARI (MENUNGGAK)
  {
    id: 'INV-2026-051',
    invoiceNumber: 'INV/2026/09/051',
    partnerId: 'PTR-003',
    partnerName: 'Warung Madura Berkah Malam',
    partnerType: 'TOKO_WARUNG',
    invoiceDate: '2026-09-18',
    dueDate: '2026-09-25',
    tenorDays: 7,
    totalAmount: 980000,
    paidAmount: 0,
    remainingBalance: 980000,
    daysElapsed: 19,
    bucket: 'BUCKET_GT14_MENUNGGAK',
    status: 'MENUNGGAK',
    waterSummary: '30 Gln RO 19L',
    fmcgSummary: '5 Karung Beras 5kg + 4 Tray Telur',
    filledGallonsOut: 30,
    emptyGallonsRetrieved: 15,
  },
  {
    id: 'INV-2026-042',
    invoiceNumber: 'INV/2026/09/042',
    partnerId: 'PTR-005',
    partnerName: 'Kantin Resto Celebes Bahari',
    partnerType: 'TOKO_WARUNG',
    assignedSalesId: 'SLS-MAKASSAR-01',
    invoiceDate: '2026-09-15',
    dueDate: '2026-09-29',
    tenorDays: 14,
    totalAmount: 1650000,
    paidAmount: 0,
    remainingBalance: 1650000,
    daysElapsed: 22,
    bucket: 'BUCKET_GT14_MENUNGGAK',
    status: 'MENUNGGAK',
    waterSummary: '50 Gln RO 19L + 10 Dus Botol 600ml',
    fmcgSummary: '6 Karung Beras 5kg + 8 Pouch Minyak',
    filledGallonsOut: 50,
    emptyGallonsRetrieved: 35,
  },
];

export const INITIAL_GALLON_MOVEMENTS: PhysicalGallonMovementRecord[] = [
  {
    id: 'MOV-101',
    partnerId: 'PTR-001',
    partnerName: 'Pangkalan Berkah Sejahtera',
    driverId: 'DRV-01',
    driverName: 'Pak Bambang Sukoco',
    timestamp: '2026-10-06 09:30 WITA',
    filledOut: 40,
    emptyReturned: 35,
    netShift: 5,
    holdingBalanceAfter: 45,
    depositRatePerGallon: 35000,
    bottleCondition: 'BAGUS',
    notes: 'Drop rutin pagi, 5 tabung tertahan di kasir depan.',
  },
  {
    id: 'MOV-102',
    partnerId: 'PTR-002',
    partnerName: 'Toko Berkah Rezeki Bu Siti',
    driverId: 'DRV-01',
    driverName: 'Pak Bambang Sukoco',
    timestamp: '2026-10-06 10:45 WITA',
    filledOut: 25,
    emptyReturned: 25,
    netShift: 0,
    holdingBalanceAfter: 32,
    depositRatePerGallon: 35000,
    bottleCondition: 'BAGUS',
    notes: 'Tukar pas 25 tabung, fisik tabung bersih.',
  },
  {
    id: 'MOV-103',
    partnerId: 'PTR-003',
    partnerName: 'Warung Madura Berkah Malam',
    driverId: 'DRV-02',
    driverName: 'Rudi Hartono (Rider Viar)',
    timestamp: '2026-10-06 14:15 WITA',
    filledOut: 15,
    emptyReturned: 10,
    netShift: 5,
    holdingBalanceAfter: 28,
    depositRatePerGallon: 35000,
    bottleCondition: 'BAGUS',
    notes: 'Pemilik minta titip tambahan 5 tabung galon untuk jualan malam.',
  },
];

class NexaWaterFmcgService {
  private products: NexaProductItem[] = [...INITIAL_NEXA_PRODUCTS];
  private partners: NexaPartnerProfile[] = [...INITIAL_NEXA_PARTNERS];
  private invoices: InvoiceTempoItem[] = [...INITIAL_INVOICES_TEMPO];
  private gallonMovements: PhysicalGallonMovementRecord[] = [...INITIAL_GALLON_MOVEMENTS];

  // Conservation counts: Total physical assets in circulation
  private totalPhysicalAssets: number = 1200;
  private damagedAfkirGallons: number = 24;

  public getProducts(): NexaProductItem[] {
    return [...this.products];
  }

  public getPartners(): NexaPartnerProfile[] {
    return [...this.partners];
  }

  public getInvoices(): InvoiceTempoItem[] {
    return [...this.invoices];
  }

  public getGallonMovements(): PhysicalGallonMovementRecord[] {
    return [...this.gallonMovements];
  }

  /**
   * Menghitung aging piutang 3-bucket:
   * 1. 0-7 hari: Lancar
   * 2. 8-14 hari: Jatuh Tempo
   * 3. >14 hari: Menunggak
   */
  public calculateAgingBuckets(customInvoices?: InvoiceTempoItem[]): AgingBucketSummary {
    const list = customInvoices || this.invoices;
    const unpaid = list.filter((inv) => inv.remainingBalance > 0);

    let amount0_7 = 0;
    let count0_7 = 0;

    let amount8_14 = 0;
    let count8_14 = 0;

    let amountGt14 = 0;
    let countGt14 = 0;

    unpaid.forEach((inv) => {
      if (inv.daysElapsed <= 7) {
        amount0_7 += inv.remainingBalance;
        count0_7 += 1;
      } else if (inv.daysElapsed <= 14) {
        amount8_14 += inv.remainingBalance;
        count8_14 += 1;
      } else {
        amountGt14 += inv.remainingBalance;
        countGt14 += 1;
      }
    });

    const total = amount0_7 + amount8_14 + amountGt14;

    return {
      bucket0_7: {
        label: '0-7 Hari (Lancar)',
        totalAmount: amount0_7,
        invoiceCount: count0_7,
        percentage: total > 0 ? Math.round((amount0_7 / total) * 100) : 0,
      },
      bucket8_14: {
        label: '8-14 Hari (Jatuh Tempo)',
        totalAmount: amount8_14,
        invoiceCount: count8_14,
        percentage: total > 0 ? Math.round((amount8_14 / total) * 100) : 0,
      },
      bucketGt14: {
        label: '>14 Hari (Menunggak)',
        totalAmount: amountGt14,
        invoiceCount: countGt14,
        percentage: total > 0 ? Math.round((amountGt14 / total) * 100) : 0,
      },
      totalReceivables: total,
      totalInvoices: unpaid.length,
    };
  }

  /**
   * Menghitung konservasi fisik tabung galon depo
   */
  public getPhysicalGallonSummary(): PhysicalGallonInventorySummary {
    const heldByPartners = this.partners.reduce(
      (acc, p) => acc + (p.holdingEmptyGallonDebt || 0),
      0
    );
    const onFleetVehicles = 160; // Tabung on-board 3 armada (Carry, GranMax, Viar)
    const depoWarehouseStock = Math.max(
      0,
      this.totalPhysicalAssets - heldByPartners - onFleetVehicles - this.damagedAfkirGallons
    );

    return {
      depoWarehouseStock,
      onFleetVehicles,
      heldByPartners,
      damagedOrScrapped: this.damagedAfkirGallons,
      totalPhysicalAssetCount: this.totalPhysicalAssets,
    };
  }

  /**
   * Re-Visit Driver Kunjungan:
   * 1. Catat drop galon isi (RO 19L / mineral) + sembako (beras, telur, minyak)
   * 2. Tarik galon kosong
   * 3. Pelunasan nota tempo sebelumnya (opsional)
   * 4. Perbarui sirkulasi fisik tabung & buku besar piutang
   */
  public executeDriverRevisit(payload: DriverRevisitPayload): DriverRevisitResult {
    const partnerIndex = this.partners.findIndex((p) => p.id === payload.partnerId);
    if (partnerIndex === -1) {
      return {
        success: false,
        message: 'Toko mitra tidak ditemukan.',
        revisitTransactionId: '',
        newOrderTotal: 0,
        previousPaymentRecorded: 0,
        netCashCollected: 0,
        netGallonShift: 0,
        updatedPartnerHoldingGallons: 0,
        updatedPartnerReceivable: 0,
      };
    }

    const partner = this.partners[partnerIndex];

    // 1. Hitung total nilai belanja baru (Water + FMCG)
    const waterTotal = payload.waterDrops.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
    const fmcgTotal = payload.fmcgDrops.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
    const newOrderTotal = waterTotal + fmcgTotal;

    // Hitung total galon isi 19L yang turun
    const totalGallons19LOut = payload.waterDrops
      .filter((i) => i.sku === 'GALLON_RO_19L' || i.sku === 'GALLON_19L')
      .reduce((acc, i) => acc + i.qty, 0);

    // 2. Sirkulasi galon fisik
    const netGallonShift = totalGallons19LOut - (payload.emptyGallonRetrieved || 0);
    const newHoldingDebt = Math.max(0, partner.holdingEmptyGallonDebt + netGallonShift);

    // 3. Pelunasan faktur tempo sebelumnya jika ada
    let previousPaymentRecorded = 0;
    if (
      payload.previousInvoiceIdToSettle &&
      payload.previousInvoicePaymentAmount &&
      payload.previousInvoicePaymentAmount > 0
    ) {
      const invIdx = this.invoices.findIndex((inv) => inv.id === payload.previousInvoiceIdToSettle);
      if (invIdx !== -1) {
        const inv = this.invoices[invIdx];
        const payVal = Math.min(inv.remainingBalance, payload.previousInvoicePaymentAmount);
        inv.paidAmount += payVal;
        inv.remainingBalance -= payVal;
        if (inv.remainingBalance <= 0) {
          inv.status = 'LUNAS';
        }
        previousPaymentRecorded = payVal;
      }
    }

    // 4. Pembayaran order baru & mutasi piutang
    let cashPaidForNewOrder = payload.cashPaidForNewOrder || 0;
    let createdInvoiceId: string | undefined = undefined;

    if (payload.newInvoicePaymentMethod === 'TEMPO_BON') {
      const newInvoiceNumber = `INV/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (partner.tenorDaysAllowed || 14));

      const newInvoice: InvoiceTempoItem = {
        id: `INV-${Date.now().toString().slice(-6)}`,
        invoiceNumber: newInvoiceNumber,
        partnerId: partner.id,
        partnerName: partner.name,
        partnerType: partner.partnerType,
        assignedSalesId: partner.assignedSalesId,
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: dueDate.toISOString().slice(0, 10),
        tenorDays: partner.tenorDaysAllowed || 14,
        totalAmount: newOrderTotal,
        paidAmount: cashPaidForNewOrder,
        remainingBalance: Math.max(0, newOrderTotal - cashPaidForNewOrder),
        daysElapsed: 0,
        bucket: 'BUCKET_0_7_LANCAR',
        status: newOrderTotal - cashPaidForNewOrder <= 0 ? 'LUNAS' : 'LANCAR',
        waterSummary: payload.waterDrops.map((w) => `${w.qty} ${w.sku}`).join(', ') || 'Nihil',
        fmcgSummary: payload.fmcgDrops.map((f) => `${f.qty} ${f.sku}`).join(', ') || 'Nihil',
        filledGallonsOut: totalGallons19LOut,
        emptyGallonsRetrieved: payload.emptyGallonRetrieved,
      };

      this.invoices.unshift(newInvoice);
      createdInvoiceId = newInvoice.id;
      partner.currentReceivableBalance += newInvoice.remainingBalance;
    } else {
      cashPaidForNewOrder = newOrderTotal;
    }

    // Kurangi piutang toko sebesar pembayaran nota lama
    partner.currentReceivableBalance = Math.max(
      0,
      partner.currentReceivableBalance - previousPaymentRecorded
    );
    partner.holdingEmptyGallonDebt = newHoldingDebt;

    // 5. Catat Log Pergerakan Tabung Galon Fisik
    const movementRecord: PhysicalGallonMovementRecord = {
      id: `MOV-${Date.now().toString().slice(-5)}`,
      partnerId: partner.id,
      partnerName: partner.name,
      driverId: payload.driverId,
      driverName: payload.driverName,
      timestamp: `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA`,
      filledOut: totalGallons19LOut,
      emptyReturned: payload.emptyGallonRetrieved,
      netShift: netGallonShift,
      holdingBalanceAfter: newHoldingDebt,
      depositRatePerGallon: 35000,
      bottleCondition: 'BAGUS',
      notes: payload.notes || `Re-visit supir ${payload.driverName}`,
    };
    this.gallonMovements.unshift(movementRecord);

    const netCashCollected = cashPaidForNewOrder + previousPaymentRecorded;

    return {
      success: true,
      message: `Re-visit berhasil dicatat! Turun ${totalGallons19LOut} galon, tarik ${payload.emptyGallonRetrieved} tabung kosong. Setoran supir: Rp ${netCashCollected.toLocaleString('id-ID')}`,
      revisitTransactionId: `REV-${Date.now().toString().slice(-6)}`,
      newOrderTotal,
      previousPaymentRecorded,
      netCashCollected,
      netGallonShift,
      updatedPartnerHoldingGallons: newHoldingDebt,
      updatedPartnerReceivable: partner.currentReceivableBalance,
      createdInvoiceId,
    };
  }

  /**
   * Pelunasan faktur tempo oleh kasir / admin
   */
  public settleInvoicePayment(
    invoiceId: string,
    amount: number,
    paymentMethod: string,
    collectedByDriverName: string = 'Kasir Depo'
  ): boolean {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (!inv || inv.remainingBalance <= 0) return false;

    const payment = Math.min(inv.remainingBalance, amount);
    inv.paidAmount += payment;
    inv.remainingBalance -= payment;

    if (inv.remainingBalance <= 0) {
      inv.status = 'LUNAS';
    }

    // Update partner profile receivable
    const partner = this.partners.find((p) => p.id === inv.partnerId);
    if (partner) {
      partner.currentReceivableBalance = Math.max(0, partner.currentReceivableBalance - payment);
    }

    return true;
  }
}

export const nexaWaterFmcgService = new NexaWaterFmcgService();
