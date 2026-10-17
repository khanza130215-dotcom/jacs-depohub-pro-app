/**
 * Template Kode Google Apps Script (Styles.html & App.html)
 * Khusus untuk JacS DepoHub - Manajemen Distributor Air Mineral
 */

export const GAS_STYLES_HTML = `<!-- ==========================================
     JACS DEPOHUB - STYLES.HTML
     Salin kode ini ke file 'Styles.html' di Apps Script Editor
     ========================================== -->
<style>
  /* Import Google Fonts & Font Awesome 6 */
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

  :root {
    --bg-main: #0b0f19;
    --bg-card: rgba(15, 23, 42, 0.85);
    --border-subtle: rgba(255, 255, 255, 0.08);
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;

    /* Aksen Neon Khusus */
    --neon-cyan: #00e5ff;
    --cyan-shadow-primary: 0 0 12px rgba(0, 229, 255, 0.75), 0 0 25px rgba(0, 229, 255, 0.35), inset 0 0 8px rgba(0, 229, 255, 0.25);
    
    /* Aksen Navigasi & Status */
    --accent-sky: #0ea5e9;
    --accent-emerald: #10b981;
    --accent-violet: #8b5cf6;
    --accent-amber: #f59e0b;
    --accent-whatsapp: #22c55e;
    --accent-rose: #f43f5e;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--bg-main);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    overflow-x: hidden;
  }

  /* ================= LAYOUT UTAMA ================= */
  .app-container {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  /* ================= SIDEBAR MODERN ================= */
  .sidebar {
    width: 270px;
    background: rgba(11, 15, 25, 0.95);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    backdrop-filter: blur(16px);
    z-index: 50;
    flex-shrink: 0;
  }

  .brand-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 8px 24px 8px;
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 20px;
  }

  .brand-logo-badge {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(14, 165, 233, 0.4));
    border: 1.5px solid var(--neon-cyan);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--neon-cyan);
    font-size: 20px;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.35);
  }

  .brand-title {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #ffffff;
    line-height: 1.2;
  }

  .brand-subtitle {
    font-size: 11px;
    font-weight: 600;
    color: var(--neon-cyan);
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .nav-group-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--text-muted);
    text-transform: uppercase;
    padding: 12px 12px 6px 12px;
  }

  .nav-menu {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 10px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    border: 1px solid transparent;
  }

  .nav-item:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.08);
    transform: translateX(3px);
  }

  .nav-item.active {
    color: #ffffff;
    background: rgba(0, 229, 255, 0.08);
    border-color: rgba(0, 229, 255, 0.4);
    box-shadow: inset 0 0 12px rgba(0, 229, 255, 0.15);
  }

  .nav-item-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* Badge Ikon Berwarna Khusus Tiap Menu */
  .nav-icon-badge {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: transform 0.2s ease;
  }

  .nav-item:hover .nav-icon-badge {
    transform: scale(1.08);
  }

  /* Warna Ikon Khusus Sesuai Spesifikasi */
  .badge-sky {
    background: rgba(14, 165, 233, 0.15);
    color: #0ea5e9;
    border: 1px solid rgba(14, 165, 233, 0.3);
  }
  .badge-emerald {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  .badge-violet {
    background: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
    border: 1px solid rgba(139, 92, 246, 0.3);
  }
  .badge-amber {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  .badge-whatsapp {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .pill-count {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
  }

  .nav-item.active .pill-count {
    background: var(--neon-cyan);
    color: #000;
  }

  .sidebar-footer {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid var(--border-subtle);
  }

  .depo-status-box {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--border-subtle);
    padding: 12px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .depo-dot-live {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
    display: inline-block;
    margin-right: 6px;
  }

  /* ================= AREA KONTEN UTAMA (100VH LAYOUT TANPA SCROLL) ================= */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.06) 0%, rgba(11, 15, 25, 1) 75%);
  }

  /* Top Bar */
  .top-navbar {
    height: 52px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-subtle);
    background: rgba(11, 15, 25, 0.8);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 40;
    flex-shrink: 0;
  }

  .page-info-title {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.3px;
    color: #ffffff;
    line-height: 1.2;
  }

  .page-info-desc {
    font-size: 11px;
    color: var(--text-muted);
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn-quick {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .btn-quick-cyan {
    background: #00e5ff;
    color: #041019;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
  }

  .btn-quick-cyan:hover {
    background: #33ebff;
    box-shadow: 0 0 22px rgba(0, 229, 255, 0.7);
    transform: translateY(-1px);
  }

  .btn-outline {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    border-color: var(--border-subtle);
  }

  .btn-outline:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  /* Content Padding (100vh Layout Pas 1 Layar Tanpa Scroll) */
  .content-body {
    padding: 12px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: calc(100vh - 52px);
    overflow: hidden;
  }

  /* ================= EFEK NEON HOVER INTERAKTIF (REFERENSI DESAIN JACS ERP CARD) ================= */
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    flex-shrink: 0;
  }

  .metric-card-erp {
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px 14px;
    position: relative;
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Card 1: Cyan (Stok Galon 19L) */
  .card-erp-cyan {
    border-top: 3px solid #00e5ff !important;
  }
  .card-erp-cyan:hover {
    border: 2px solid #00e5ff !important;
    box-shadow: 0 0 16px rgba(0, 229, 255, 0.8), 0 0 32px rgba(0, 229, 255, 0.4), inset 0 0 10px rgba(0, 229, 255, 0.2) !important;
    transform: translateY(-3px);
    background: rgba(15, 23, 42, 0.95) !important;
  }
  .card-erp-cyan:hover .metric-label {
    color: #00e5ff !important;
    text-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
  }
  .card-erp-cyan:hover .metric-number {
    color: #ffffff !important;
    text-shadow: 0 0 12px rgba(0, 229, 255, 0.7);
  }

  /* Card 2: Emerald (Stok Kemasan Dus) */
  .card-erp-emerald {
    border-top: 3px solid #10b981 !important;
  }
  .card-erp-emerald:hover {
    border: 2px solid #10b981 !important;
    box-shadow: 0 0 16px rgba(16, 185, 129, 0.8), 0 0 32px rgba(16, 185, 129, 0.4), inset 0 0 10px rgba(16, 185, 129, 0.2) !important;
    transform: translateY(-3px);
    background: rgba(15, 23, 42, 0.95) !important;
  }
  .card-erp-emerald:hover .metric-label {
    color: #34d399 !important;
    text-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  }
  .card-erp-emerald:hover .metric-number {
    color: #ffffff !important;
    text-shadow: 0 0 12px rgba(16, 185, 129, 0.7);
  }

  /* Card 3: Violet (Varian Aktif Depo) */
  .card-erp-violet {
    border-top: 3px solid #8b5cf6 !important;
  }
  .card-erp-violet:hover {
    border: 2px solid #8b5cf6 !important;
    box-shadow: 0 0 16px rgba(139, 92, 246, 0.8), 0 0 32px rgba(139, 92, 246, 0.4), inset 0 0 10px rgba(139, 92, 246, 0.2) !important;
    transform: translateY(-3px);
    background: rgba(15, 23, 42, 0.95) !important;
  }
  .card-erp-violet:hover .metric-label {
    color: #a78bfa !important;
    text-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
  }
  .card-erp-violet:hover .metric-number {
    color: #ffffff !important;
    text-shadow: 0 0 12px rgba(139, 92, 246, 0.7);
  }

  /* Card 4: Amber (Omzet Kasir Hari Ini) */
  .card-erp-amber {
    border-top: 3px solid #f59e0b !important;
  }
  .card-erp-amber:hover {
    border: 2px solid #f59e0b !important;
    box-shadow: 0 0 16px rgba(245, 158, 11, 0.8), 0 0 32px rgba(245, 158, 11, 0.4), inset 0 0 10px rgba(245, 158, 11, 0.2) !important;
    transform: translateY(-3px);
    background: rgba(15, 23, 42, 0.95) !important;
  }
  .card-erp-amber:hover .metric-label {
    color: #fbbf24 !important;
    text-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
  }
  .card-erp-amber:hover .metric-number {
    color: #ffffff !important;
    text-shadow: 0 0 12px rgba(245, 158, 11, 0.7);
  }

  .metric-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .metric-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    transition: all 0.2s ease;
  }

  .metric-icon-box {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
  }

  /* 2. TIPOGRAFI MODERN & TAJAM UNTUK ANGKA METRIK */
  .metric-number {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.1;
    color: #ffffff;
    margin-bottom: 4px;
    transition: all 0.2s ease;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }

  .metric-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 500;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    margin-top: 6px;
  }

  .trend-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 4px;
  }

  .trend-up {
    color: #34d399;
    background: rgba(16, 185, 129, 0.12);
  }

  /* ================= SECTION PANEL GLASSMORPHISM (FILLS REMAINING HEIGHT) ================= */
  .dashboard-section-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 12px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .panel-box {
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .panel-box-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  .panel-title {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* Tabel Data Modern */
  .table-responsive {
    width: 100%;
    overflow-x: auto;
  }

  .custom-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .custom-table th {
    text-align: left;
    padding: 10px 14px;
    color: var(--text-muted);
    font-weight: 700;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .custom-table td {
    padding: 12px 14px;
    color: var(--text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    vertical-align: middle;
  }

  .custom-table tr:hover td {
    background: rgba(255, 255, 255, 0.02);
    color: #ffffff;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
  }

  .badge-delivered {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .badge-transit {
    background: rgba(14, 165, 233, 0.15);
    color: #0ea5e9;
    border: 1px solid rgba(14, 165, 233, 0.3);
  }

  .badge-pending {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  /* Sirkulasi Galon Visual Bar */
  .stock-bar-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .stock-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stock-item-head {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    font-weight: 600;
  }

  .progress-track {
    height: 7px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .progress-fill-cyan {
    height: 100%;
    background: linear-gradient(90deg, #0ea5e9, #00e5ff);
    box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
  }

  @media (max-width: 1024px) {
    .dashboard-section-grid {
      grid-template-columns: 1fr;
    }
    .sidebar {
      width: 80px;
      padding: 16px 8px;
    }
    .brand-title, .brand-subtitle, .nav-group-label, .nav-item span, .pill-count, .depo-status-box {
      display: none;
    }
    .nav-item {
      justify-content: center;
      padding: 10px 0;
    }
  }
</style>`;

export const GAS_APP_HTML = `<!-- ==========================================
     JACS DEPOHUB - APP.HTML (Views.html)
     Salin kode ini ke file 'App.html' di Apps Script Editor
     ========================================== -->
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JacS DepoHub - Manajemen Distributor Air Mineral</title>
  <!-- Masukkan Styles.html melalui Apps Script include -->
  <?!= include('Styles'); ?>
</head>
<body>

  <div class="app-container">
    <!-- ================= SIDEBAR NAVIGASI DENGAN IKON BERWARNA ================= -->
    <aside class="sidebar">
      <div class="brand-header">
        <div class="brand-logo-badge">
          <i class="fa-solid fa-faucet-drip"></i>
        </div>
        <div>
          <h1 class="brand-title">JACS DEPOHUB</h1>
          <p class="brand-subtitle">AIR MINERAL SYSTEM</p>
        </div>
      </div>

      <!-- KATEGORI OPERASIONAL -->
      <div class="nav-group-label">OPERASIONAL</div>
      <ul class="nav-menu">
        <!-- 1. Dashboard: Bright Cyan / Sky Blue (#0ea5e9) -->
        <li class="nav-item active" onclick="switchTab('dashboard')">
          <div class="nav-item-left">
            <div class="nav-icon-badge badge-sky">
              <i class="fa-solid fa-chart-pie"></i>
            </div>
            <span>Dashboard</span>
          </div>
        </li>

        <!-- 2. Pelayanan Order: Emerald / Mint Green (#10b981) -->
        <li class="nav-item" onclick="switchTab('order')">
          <div class="nav-item-left">
            <div class="nav-icon-badge badge-emerald">
              <i class="fa-solid fa-clipboard-list"></i>
            </div>
            <span>Pelayanan Order</span>
          </div>
          <span class="pill-count">8 Baru</span>
        </li>

        <!-- 3. Master Data: Violet / Indigo (#8b5cf6) -->
        <li class="nav-item" onclick="switchTab('master')">
          <div class="nav-item-left">
            <div class="nav-icon-badge badge-violet">
              <i class="fa-solid fa-boxes-stacked"></i>
            </div>
            <span>Master Data</span>
          </div>
        </li>

        <!-- 4. Armada Distribusi: Amber / Warm Orange (#f59e0b) -->
        <li class="nav-item" onclick="switchTab('armada')">
          <div class="nav-item-left">
            <div class="nav-icon-badge badge-amber">
              <i class="fa-solid fa-truck-fast"></i>
            </div>
            <span>Armada Distribusi</span>
          </div>
          <span class="pill-count">3 Jalan</span>
        </li>

        <!-- 5. Sirkulasi Galon 19L: Violet / Indigo (#8b5cf6) -->
        <li class="nav-item" onclick="switchTab('sirkulasi')">
          <div class="nav-item-left">
            <div class="nav-icon-badge badge-violet">
              <i class="fa-solid fa-arrows-rotate"></i>
            </div>
            <span>Sirkulasi Galon 19L</span>
          </div>
        </li>
      </ul>

      <!-- KATEGORI KEUANGAN -->
      <div class="nav-group-label">KEUANGAN</div>
      <ul class="nav-menu">
        <!-- 6. Kasir & Pelunasan: Emerald / Mint Green (#10b981) -->
        <li class="nav-item" onclick="switchTab('kasir')">
          <div class="nav-item-left">
            <div class="nav-icon-badge badge-emerald">
              <i class="fa-solid fa-cash-register"></i>
            </div>
            <span>Kasir & Pelunasan</span>
          </div>
        </li>

        <!-- 7. Piutang & Tempo: Amber / Warm Orange (#f59e0b) -->
        <li class="nav-item" onclick="switchTab('piutang')">
          <div class="nav-item-left">
            <div class="nav-icon-badge badge-amber">
              <i class="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <span>Piutang & Tempo</span>
          </div>
          <span class="pill-count" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">4 Jatuh Tempo</span>
        </li>

        <!-- 8. Integrasi WhatsApp: Vibrant Green WhatsApp (#22c55e) -->
        <li class="nav-item" onclick="switchTab('whatsapp')">
          <div class="nav-item-left">
            <div class="nav-icon-badge badge-whatsapp">
              <i class="fa-brands fa-whatsapp"></i>
            </div>
            <span>Integrasi WhatsApp</span>
          </div>
        </li>
      </ul>

      <!-- Footer Sidebar Status Depo -->
      <div class="sidebar-footer">
        <div class="depo-status-box">
          <div>
            <div style="font-size: 12px; font-weight: 700; color: #fff;">
              <span class="depo-dot-live"></span>DEPO PUSAT BUKA
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">Shift Pagi: 07.00 - 17.00</div>
          </div>
          <i class="fa-solid fa-shield-halved" style="color: var(--neon-cyan);"></i>
        </div>
      </div>
    </aside>

    <!-- ================= AREA KONTEN UTAMA ================= -->
    <main class="main-content">
      <!-- Topbar Header -->
      <header class="top-navbar">
        <div>
          <h2 class="page-info-title">Dashboard Operasional & Distribusi</h2>
          <p class="page-info-desc">Pemantauan Real-time Stok Galon 19L, Penjualan Dus & Sirkulasi Tabung</p>
        </div>
        <div class="top-actions">
          <button class="btn-quick btn-outline" onclick="refreshData()">
            <i class="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
          <button class="btn-quick btn-quick-cyan" onclick="openOrderModal()">
            <i class="fa-solid fa-plus"></i> Input Order Baru
          </button>
        </div>
      </header>

      <!-- Content Body -->
      <div class="content-body">
        
        <!-- ================= EFEK NEON HOVER INTERAKTIF (REFERENSI DESAIN JACS ERP CARD) ================= -->
        <section class="metric-grid">
          
          <!-- CARD 1: STOK GALON 19L (CYAN) -->
          <div class="metric-card-erp card-erp-cyan">
            <div class="metric-header">
              <span class="metric-label">Stok Galon 19L</span>
              <div class="metric-icon-box badge-sky" style="border-color: #00e5ff; background: rgba(0, 229, 255, 0.2);">
                <i class="fa-solid fa-bottle-water" style="color: #00e5ff;"></i>
              </div>
            </div>
            <div class="metric-number">820 Tabung</div>
            <div class="metric-footer">
              <span>580 Terisi / 240 Kosong</span>
              <span class="trend-pill trend-up">
                <i class="fa-solid fa-arrow-up"></i> +14%
              </span>
            </div>
          </div>

          <!-- CARD 2: STOK KEMASAN DUS (EMERALD) -->
          <div class="metric-card-erp card-erp-emerald">
            <div class="metric-header">
              <span class="metric-label">Stok Kemasan Dus</span>
              <div class="metric-icon-box badge-emerald">
                <i class="fa-solid fa-box-open"></i>
              </div>
            </div>
            <div class="metric-number">1.420 Dus</div>
            <div class="metric-footer">
              <span>Botol 600ml & Cup 220ml</span>
              <span class="trend-pill trend-up">
                <i class="fa-solid fa-check"></i> Siap Kirim
              </span>
            </div>
          </div>

          <!-- CARD 3: VARIAN PRODUK AKTIF (VIOLET) -->
          <div class="metric-card-erp card-erp-violet">
            <div class="metric-header">
              <span class="metric-label">Varian Aktif Depo</span>
              <div class="metric-icon-box badge-violet">
                <i class="fa-solid fa-tags"></i>
              </div>
            </div>
            <div class="metric-number">4 Varian</div>
            <div class="metric-footer">
              <span>Aqua, Le Minerale, Vit, Cleo</span>
              <span style="color: var(--text-muted);">Depo Resmi</span>
            </div>
          </div>

          <!-- CARD 4: OMZET KASIR HARI INI (AMBER) -->
          <div class="metric-card-erp card-erp-amber">
            <div class="metric-header">
              <span class="metric-label">Omzet Kasir Hari Ini</span>
              <div class="metric-icon-box badge-amber">
                <i class="fa-solid fa-rupiah-sign"></i>
              </div>
            </div>
            <div class="metric-number">Rp 18.450.000</div>
            <div class="metric-footer">
              <span>24 Transaksi Selesai</span>
              <span class="trend-pill trend-up">
                <i class="fa-solid fa-arrow-trend-up"></i> +22.4%
              </span>
            </div>
          </div>

        </section>

        <!-- ================= PANEL SECTION: DAFTAR PENGIRIMAN & SIRKULASI ================= -->
        <div class="dashboard-section-grid">
          
          <!-- Bagian Kiri: Antrean Order & Pengiriman Terkini -->
          <div class="panel-box">
            <div class="panel-box-header">
              <div class="panel-title">
                <i class="fa-solid fa-truck-ramp-box" style="color: #0ea5e9;"></i>
                Jadwal Pengiriman & Status Order Aktif
              </div>
              <span style="font-size: 12px; color: var(--text-muted);">Update: Real-time</span>
            </div>
            
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>No. Order</th>
                    <th>Pelanggan / Alamat</th>
                    <th>Skema Galon</th>
                    <th>Muatan Produk</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Armada & Driver</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-weight: 700; color: #00e5ff;">ORD-2026-089</td>
                    <td>
                      <div style="font-weight: 700; color: #fff;">Pangkalan Berkah Sejahtera</div>
                      <div style="font-size: 11px; color: var(--text-muted);">Mitra Toko (B2B) • 08:30 WIB</div>
                    </td>
                    <td><span class="status-badge" style="background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(14,165,233,0.3);">Tukar Galon</span></td>
                    <td>80 Galon Aqua 19L, 20 Dus Vit</td>
                    <td style="font-weight: 700;">Rp 1.840.000</td>
                    <td><span class="status-badge badge-transit"><i class="fa-solid fa-truck"></i> Di Jalan</span></td>
                    <td>Pak Bambang (Carry Pickup)</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #00e5ff;">ORD-2026-088</td>
                    <td>
                      <div style="font-weight: 700; color: #fff;">Bpk. Hendra Gunawan</div>
                      <div style="font-size: 11px; color: var(--text-muted);">Rumah Tangga (B2C) • 09:15 WIB</div>
                      <div style="font-size: 10px; color: #00e5ff;">📍 Cluster Flamboyan Blok C2 No. 14</div>
                    </td>
                    <td><span class="status-badge" style="background: rgba(139,92,246,0.15); color: #c084fc; border: 1px solid rgba(139,92,246,0.3);">Pinjam Depo (Deposit)</span></td>
                    <td>2 Galon Aqua 19L (+ Deposit Tabung)</td>
                    <td style="font-weight: 700;">Rp 138.000</td>
                    <td><span class="status-badge badge-transit"><i class="fa-solid fa-motorcycle"></i> Di Jalan</span></td>
                    <td>Joko Susilo (Tossa Roda 3)</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #00e5ff;">ORD-2026-087</td>
                    <td>
                      <div style="font-weight: 700; color: #fff;">Ibu Ratna Kumala</div>
                      <div style="font-size: 11px; color: var(--text-muted);">Rumah Tangga (B2C) • 10:00 WIB</div>
                      <div style="font-size: 10px; color: #00e5ff;">📍 Jl. Melati Raya No. 45 RT 03/05</div>
                    </td>
                    <td><span class="status-badge" style="background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);">Beli Galon Baru</span></td>
                    <td>1 Galon Aqua Baru (+Tabung Lepas)</td>
                    <td style="font-weight: 700;">Rp 69.000</td>
                    <td><span class="status-badge badge-delivered"><i class="fa-solid fa-check-double"></i> Terkirim</span></td>
                    <td>Agus Salim (Motor Kurir)</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #00e5ff;">ORD-2026-086</td>
                    <td>
                      <div style="font-weight: 700; color: #fff;">Toko Sumber Rejeki Bu Siti</div>
                      <div style="font-size: 11px; color: var(--text-muted);">Mitra Toko (B2B) • 10:45 WIB</div>
                    </td>
                    <td><span class="status-badge" style="background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(14,165,233,0.3);">Tukar Galon</span></td>
                    <td>45 Galon Le Minerale, 15 Dus Cleo</td>
                    <td style="font-weight: 700;">Rp 1.125.000</td>
                    <td><span class="status-badge badge-pending"><i class="fa-solid fa-clock"></i> Diproses</span></td>
                    <td>Rian Prasetyo (Gran Max)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Bagian Kanan: Monitoring Sirkulasi Galon 19L -->
          <div class="panel-box">
            <div class="panel-box-header">
              <div class="panel-title">
                <i class="fa-solid fa-arrows-rotate" style="color: #8b5cf6;"></i>
                Sirkulasi Tabung Galon
              </div>
            </div>

            <div class="stock-bar-group">
              <div class="stock-item">
                <div class="stock-item-head">
                  <span style="color: #fff;">Aqua 19L Original</span>
                  <span style="color: #00e5ff; font-weight: 700;">380 Isi / 140 Kosong</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill-cyan" style="width: 72%;"></div>
                </div>
                <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
                  <span>520 Tabung di Pelanggan</span>
                  <span>Kapasitas: 1.052</span>
                </div>
              </div>

              <div class="stock-item">
                <div class="stock-item-head">
                  <span style="color: #fff;">Le Minerale 15L/19L</span>
                  <span style="color: #10b981; font-weight: 700;">240 Isi / 65 Kosong</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill-cyan" style="width: 65%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
                </div>
                <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
                  <span>310 Tabung di Pelanggan</span>
                  <span>Kapasitas: 619</span>
                </div>
              </div>

              <div class="stock-item">
                <div class="stock-item-head">
                  <span style="color: #fff;">Vit 19L</span>
                  <span style="color: #f59e0b; font-weight: 700;">120 Isi / 35 Kosong</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill-cyan" style="width: 55%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                </div>
                <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
                  <span>180 Tabung di Pelanggan</span>
                  <span>Kapasitas: 337</span>
                </div>
              </div>
            </div>

            <!-- Ringkasan Cepat Galon Hilang / Rusak -->
            <div style="margin-top: 24px; padding: 14px; border-radius: 10px; background: rgba(0, 0, 0, 0.3); border: 1px dashed var(--border-subtle);">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                <span style="color: var(--text-muted);">Total Tabung di Luar Depo:</span>
                <span style="color: #ffffff; font-weight: 700;">1.105 Tabung</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-top: 6px;">
                <span style="color: var(--text-muted);">Tabung Reject / Rusak:</span>
                <span style="color: #f43f5e; font-weight: 700;">19 Tabung (Klaim Pabrik)</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  </div>

  <script>
    // Tab switching sederhana untuk preview Google Apps Script
    function switchTab(tabId) {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      event.currentTarget.classList.add('active');
      console.log('Beralih ke tab:', tabId);
    }

    function refreshData() {
      // Panggil fungsi Apps Script server-side jika tersedia
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(response) {
            console.log('Data diperbarui dari server Google Apps Script');
          })
          .getDashboardMetrics();
      } else {
        alert('Memperbarui data dashboard...');
      }
    }

    function openOrderModal() {
      alert('Buka dialog Input Order Baru untuk kasir/admin depo');
    }
  </script>
</body>
</html>`;

export const GAS_CODE_GS = `/**
 * =========================================================================
 * JACS DEPOHUB - GOOGLE APPS SCRIPT WEBHOOK & SPREADSHEET SYNC (Code.gs)
 * =========================================================================
 * Skrip ini bertindak sebagai Webhook Receiver otomatis untuk Depo Tirta Mandiri.
 * Menerima sinkronisasi data dari JacS DepoHub Pro dan mencatatnya ke 3 Sheet utama:
 *   1. Sheet 'Pesanan'   : Seluruh transaksi order reguler & spot supir
 *   2. Sheet 'Piutang'   : Monitoring kartu piutang toko (Tempo Bon Toko)
 *   3. Sheet 'RekapShift': Audit tutup buku harian (Kasir, QRIS, Setoran, Galon)
 *
 * CARA DEPLOY:
 * 1. Buka spreadsheet Google Sheets Anda.
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus kode bawaan di Code.gs, lalu tempelkan seluruh kode ini.
 * 4. Klik tombol 'Terapkan' (Deploy) > 'Penerapan baru' (New deployment).
 * 5. Pilih jenis: 'Aplikasi Web' (Web App).
 * 6. Setel 'Akses': 'Siapa saja' (Anyone / Anonim agar webhook browser dapat mengirim data).
 * 7. Salin URL Web App yang dihasilkan (awalan: https://script.google.com/macros/s/...)
 * 8. Tempelkan URL tersebut ke modal [<> Skrip GAS] di JacS DepoHub Pro.
 * =========================================================================
 */

// Konfigurasi Nama Sheet
const SHEET_ORDERS = 'Pesanan';
const SHEET_RECEIVABLES = 'Piutang';
const SHEET_SETTLEMENT = 'RekapShift';
const SHEET_BONGKAR_MUAT = 'BongkarMuat';
const SHEET_STOK = 'StokProduk';
const SHEET_GALON = 'SirkulasiGalon';

/**
 * Handle HTTP GET Request
 * Berguna untuk cek kesehatan koneksi (Health Check / Test Connection) dari web app.
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsSetup(ss);

    const response = {
      status: 'success',
      message: '🟢 JacS DepoHub Pro Cloud Sync Webhook Aktif & Siap!',
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      timestamp: new Date().toISOString(),
      sheets: [SHEET_ORDERS, SHEET_RECEIVABLES, SHEET_SETTLEMENT, SHEET_BONGKAR_MUAT, SHEET_STOK, SHEET_GALON]
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HTTP POST Request
 * Menerima payload JSON dari JacS DepoHub Pro untuk sinkronisasi otomatis.
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsSetup(ss);

    var payload = {};
    try {
      var contents = e && e.postData ? e.postData.contents : '';
      if (contents) {
        try {
          payload = JSON.parse(contents);
        } catch(jsonErr) {
          // Jika contents adalah form-urlencoded data
          payload = (e && e.parameter) ? e.parameter : {};
        }
      } else if (e && e.parameter) {
        payload = e.parameter;
      }
    } catch (err) {
      // fallback jika data masuk via parameter / Form Data
      payload = (e && e.parameter) ? e.parameter : {};
    }

    // Jika parameter URLSearchParams berisi 'data' bertipe JSON string
    if (payload.data && typeof payload.data === 'string') {
      try {
        payload.data = JSON.parse(payload.data);
      } catch(dErr) {}
    }

    const action = payload.action || (payload.data && payload.data.action) || 'sync_all';
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    let result = { action: action, timestamp: timestamp };

    switch (action) {
      case 'ping':
      case 'test_connection':
        result.message = 'Koneksi Webhook Google Apps Script Berhasil!';
        break;

      case 'create_order':
      case 'test_order':
        var orderData = payload.data || payload;
        if (orderData) {
          var rawItems = orderData.rincian || orderData.itemsSummary || orderData.items || payload.rincian || payload.itemsSummary || payload.items || '-';
          var itemsText = '-';
          var totalQty = 1;

          if (typeof rawItems === 'string' && (rawItems.startsWith('[') || rawItems.startsWith('{'))) {
            try {
              rawItems = JSON.parse(rawItems);
            } catch(pErr) {}
          }

          if (Array.isArray(rawItems)) {
            itemsText = rawItems.map(function(it) {
              return (it.qty || 1) + 'x ' + (it.name || it.productName || 'Produk');
            }).join(', ');
            totalQty = rawItems.reduce(function(sum, it) { return sum + (it.qty || 0); }, 0) || 1;
          } else {
            itemsText = String(rawItems);
          }

          var paymentMet = orderData.metodeBayar || orderData.paymentMethod || payload.metodeBayar || payload.paymentMethod || 'TUNAI';
          var payStatus = orderData.statusBayar || orderData.status || payload.statusBayar || payload.status || (paymentMet === 'Bayar Tempo' ? 'Tempo / Hutang' : 'Lunas');

          const ordData = {
            id: orderData.noFaktur || orderData.orderId || payload.noFaktur || payload.orderId || ('STR-' + Date.now()),
            customerName: orderData.pelanggan || orderData.customerName || payload.pelanggan || payload.customerName || 'Walk-In Customer',
            customerType: orderData.customerType || payload.customerType || 'Pelanggan POS',
            gallonScheme: 'Tukar Galon',
            priceTier: 'Eceran',
            phone: orderData.phone || payload.phone || '-',
            deliveryAddress: orderData.deliveryAddress || payload.deliveryAddress || 'Kasir POS (Ambil Depo)',
            items: itemsText,
            totalGalon: totalQty,
            totalAmount: Number(orderData.total || orderData.totalAmount || payload.total || payload.totalAmount || 0),
            paymentStatus: payStatus,
            deliveryStatus: orderData.statusKirim || orderData.deliveryStatus || payload.statusKirim || 'SELESAI',
            status: 'SELESAI',
            driver: orderData.supir || orderData.driverName || orderData.cashier || payload.supir || payload.driverName || payload.cashier || 'Kasir Depo',
            time: orderData.tanggal || payload.tanggal || (new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA')
          };
          saveOrderRow(ss, ordData, timestamp);
          result.message = 'Transaksi Kasir #' + ordData.id + ' (' + ordData.customerName + ') berhasil dicatat ke Sheet Pesanan.';
        }
        break;

      case 'clear_dummy_orders':
      case 'clear_orders':
        var targetSheet = ss.getSheetByName('Pesanan');
        if (targetSheet) {
          var lastRow = targetSheet.getLastRow();
          if (lastRow > 1) {
            targetSheet.deleteRows(2, lastRow - 1);
            result.message = 'Berhasil mengosongkan ' + (lastRow - 1) + ' baris transaksi dummy di Sheet Pesanan (Header baris 1 dipertahankan).';
          } else {
            result.message = 'Sheet Pesanan sudah dalam kondisi kosong (hanya ada Header baris 1).';
          }
        } else {
          result.message = 'Sheet Pesanan tidak ditemukan.';
        }
        break;

      case 'new_order':
      case 'spot_order':
      case 'approve_order':
        if (payload.order) {
          saveOrderRow(ss, payload.order, timestamp);
          result.message = 'Pesanan #' + payload.order.id + ' berhasil dicatat ke Sheet Pesanan.';
        }
        break;

      case 'pay_receivable':
      case 'update_receivable':
        if (payload.receivable) {
          saveReceivableRow(ss, payload.receivable, timestamp);
          result.message = 'Piutang #' + payload.receivable.id + ' berhasil disinkronkan ke Sheet Piutang.';
        }
        break;

      case 'settlement':
      case 'close_shift':
        if (payload.settlement) {
          saveSettlementRow(ss, payload.settlement, timestamp);
          result.message = 'Tutup Buku 17:00 WIB berhasil dibukukan ke Sheet RekapShift.';
        }
        break;

      case 'bongkar_muat':
      case 'mutasi_stok':
      case 'inbound_drop':
        if (payload.drop) {
          saveBongkarMuatRow(ss, payload.drop, timestamp);
          result.message = 'Bongkar muat Surat Jalan #' + (payload.drop.sjNumber || payload.drop.id) + ' berhasil dibukukan ke Sheet BongkarMuat.';
        }
        break;

      case 'sync_product':
      case 'sync_stock':
      case 'update_stock':
        var prodItem = payload.product || (payload.products && payload.products[0]);
        if (prodItem) {
          saveStockRow(ss, prodItem, timestamp);
          result.message = 'Katalog & Stok #' + prodItem.id + ' (' + (prodItem.name || 'Produk') + ') berhasil disinkronkan ke Sheet StokProduk.';
        }
        break;

      case 'sync_transactions':
        var txList = payload.transactions || payload.orders || [];
        if (Array.isArray(txList)) {
          txList.forEach(function(tx) {
            var rawItems = tx.items || '-';
            var itemsText = '-';
            var totalQty = tx.totalGalon || 1;

            if (typeof rawItems === 'string' && (rawItems.startsWith('[') || rawItems.startsWith('{'))) {
              try {
                rawItems = JSON.parse(rawItems);
              } catch(pErr) {}
            }

            if (Array.isArray(rawItems)) {
              itemsText = rawItems.map(function(it) {
                return (it.qty || 1) + 'x ' + (it.name || it.productName || 'Produk');
              }).join(', ');
              totalQty = rawItems.reduce(function(sum, it) { return sum + (it.qty || 0); }, 0) || 1;
            } else {
              itemsText = String(rawItems);
            }

            var ordData = {
              id: tx.id || tx.orderId || ('ORD-' + Date.now()),
              customerName: tx.customerName || tx.customer || 'Walk-In Customer',
              customerType: tx.customerType || 'Pelanggan POS',
              gallonScheme: tx.gallonScheme || 'Tukar Galon',
              priceTier: tx.priceTier || 'Eceran',
              phone: tx.phone || tx.customerPhone || '-',
              deliveryAddress: tx.deliveryAddress || 'Kasir POS (Ambil Depo)',
              items: itemsText,
              totalGalon: totalQty,
              totalAmount: Number(tx.totalAmount || tx.total || tx.grandTotal || 0),
              paymentStatus: (tx.paymentMethod || tx.payment) === 'Bayar Tempo' ? 'Tempo / Hutang' : 'Lunas',
              paymentMethod: tx.paymentMethod || tx.payment || 'Tunai',
              deliveryStatus: tx.deliveryStatus || 'SELESAI',
              status: tx.status || 'SELESAI',
              driver: tx.cashier || tx.driver || 'Admin Kasir',
              time: tx.time || timestamp
            };
            saveOrderRow(ss, ordData, timestamp);
          });
          result.message = txList.length + ' Transaksi berhasil dicatat ke Sheet Pesanan.';
        }
        break;

      case 'sync_all':
      default:
        // Sinkronisasi Massal (Orders, Receivables, Shift, BongkarMuat)
        var allOrders = payload.transactions || payload.orders;
        if (allOrders && Array.isArray(allOrders)) {
          allOrders.forEach(function(ord) {
            saveOrderRow(ss, ord, timestamp);
          });
        }
        if (payload.receivables && Array.isArray(payload.receivables)) {
          payload.receivables.forEach(function(rec) {
            saveReceivableRow(ss, rec, timestamp);
          });
        }
        if (payload.inboundDrops && Array.isArray(payload.inboundDrops)) {
          payload.inboundDrops.forEach(function(drp) {
            saveBongkarMuatRow(ss, drp, timestamp);
          });
        }
        if (payload.settlement) {
          saveSettlementRow(ss, payload.settlement, timestamp);
        }
        if (payload.products && Array.isArray(payload.products)) {
          payload.products.forEach(function(prod) {
            saveStockRow(ss, prod, timestamp);
          });
        }
        if (payload.gallonCirculation && Array.isArray(payload.gallonCirculation)) {
          payload.gallonCirculation.forEach(function(gal) {
            saveGallonCirculationRow(ss, gal, timestamp);
          });
        }
        result.message = 'Semua data operasional transaksi & stok berhasil disinkronkan ke Google Sheets!';
        break;
    }

    result.status = 'success';
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      error: err.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Memastikan 4 Sheet utama ada dan dilengkapi Header styling modern
 */
function ensureSheetsSetup(ss) {
  // 1. Sheet Pesanan
  let sheetOrders = ss.getSheetByName(SHEET_ORDERS);
  if (!sheetOrders) {
    sheetOrders = ss.insertSheet(SHEET_ORDERS);
    const headers = [
      'No. Faktur', 'Tanggal Transaksi', 'Nama Toko / Pelanggan',
      'Supir / Armada', 'Rincian Produk / Kemasan', 'Total Bayar (Rp)',
      'Status Pengiriman', 'Status Pembayaran', 'Metode Bayar', 'Waktu Sinkron'
    ];
    sheetOrders.appendRow(headers);
    formatHeaderRow(sheetOrders, '#0891b2'); // Cyan theme
  }

  // 2. Sheet Piutang
  let sheetReceivables = ss.getSheetByName(SHEET_RECEIVABLES);
  if (!sheetReceivables) {
    sheetReceivables = ss.insertSheet(SHEET_RECEIVABLES);
    const headers = [
      'ID Piutang', 'No. Faktur Terkait', 'Nama Toko / Mitra',
      'Nominal Tagihan (Rp)', 'Tanggal Transaksi', 'Jatuh Tempo',
      'Status Piutang', 'Galon Kosong Dipinjam (Tbg)', 'No. Telepon / WA', 'Waktu Sinkron'
    ];
    sheetReceivables.appendRow(headers);
    formatHeaderRow(sheetReceivables, '#d97706'); // Amber theme
  }

  // 3. Sheet RekapShift
  let sheetSettlement = ss.getSheetByName(SHEET_SETTLEMENT);
  if (!sheetSettlement) {
    sheetSettlement = ss.insertSheet(SHEET_SETTLEMENT);
    const headers = [
      'Tanggal Closing', 'Waktu Closing', 'Total Omzet Depo (Rp)',
      'Tunai Kasir (Rp)', 'QRIS / Transfer (Rp)', 'Setoran Supir (Rp)',
      'Pelunasan Piutang (Rp)', 'Target Kas Fisik (Rp)', 'Retur Galon Armada (Tbg)',
      'Selisih Galon', 'Status Audit', 'Penanggung Jawab / Validator', 'Waktu Sinkron'
    ];
    sheetSettlement.appendRow(headers);
    formatHeaderRow(sheetSettlement, '#059669'); // Emerald theme
  }

  // 4. Sheet BongkarMuat (Inbound Drop Pabrik)
  let sheetBongkar = ss.getSheetByName(SHEET_BONGKAR_MUAT);
  if (!sheetBongkar) {
    sheetBongkar = ss.insertSheet(SHEET_BONGKAR_MUAT);
    const headers = [
      'ID Drop', 'No. Surat Jalan Pabrik', 'Nama Supplier / Pabrik',
      'Tanggal Kedatangan', 'Jam Kedatangan', 'Tabung Terisi Masuk (Tbg)',
      'Tukar Guling Kosong (Tbg)', 'Kemasan Dus Masuk (Dus)', 'Rincian Muatan Barang',
      'Supir / Armada Truk', 'Petugas Gudang (PIC)', 'Status Penerimaan', 'Waktu Sinkron'
    ];
    sheetBongkar.appendRow(headers);
    formatHeaderRow(sheetBongkar, '#7c3aed'); // Violet/Purple theme
  }

  // 5. Sheet Stok & Produk (SKU Master & Inventory)
  let sheetStok = ss.getSheetByName(SHEET_STOK);
  if (!sheetStok) {
    sheetStok = ss.insertSheet(SHEET_STOK);
    const headers = [
      'ID SKU', 'Nama Produk / Kemasan', 'Kategori', 'Merek',
      'HPP Tebus Pabrik (Rp)', 'Harga Ecer Retail (Rp)', 'Harga Toko Grosir (Rp)',
      'Stok Fisik Depo', 'Batas Buffer Aman', 'Status Stok', 'Waktu Sinkron'
    ];
    sheetStok.appendRow(headers);
    formatHeaderRow(sheetStok, '#0284c7'); // Sky theme
  }

  // 6. Sheet Sirkulasi Galon
  let sheetGalon = ss.getSheetByName(SHEET_GALON);
  if (!sheetGalon) {
    sheetGalon = ss.insertSheet(SHEET_GALON);
    const headers = [
      'Merek / Jenis Tabung', 'Terisi Depo', 'Kosong Depo',
      'Beredar di Toko (B2B)', 'Pinjam Warga (B2C)', 'Beli Lepas', 'Afkir / Rusak',
      'Total Aset Tabung', 'Waktu Sinkron'
    ];
    sheetGalon.appendRow(headers);
    formatHeaderRow(sheetGalon, '#4f46e5'); // Indigo theme
  }
}

/**
 * Styling Header Baris 1
 */
function formatHeaderRow(sheet, hexBg) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground(hexBg)
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setFontFamily('Arial')
       .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

/**
 * Simpan atau perbarui baris Pesanan
 */
function saveOrderRow(ss, ord, timestamp) {
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(ord.id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowValues = [
    ord.id,
    ord.time || timestamp,
    ord.customerName || 'Pelanggan Umum',
    ord.driver || 'Kurir Depo',
    ord.items || (ord.totalGalon + ' Galon Air Mineral'),
    ord.totalAmount || 0,
    ord.deliveryStatus || 'Diproses',
    ord.paymentStatus || 'Lunas',
    ord.paymentMethod || (ord.paymentStatus === 'Tempo / Hutang' ? 'TEMPO BON TOKO' : 'Tunai'),
    timestamp
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

/**
 * Simpan atau perbarui baris Piutang
 */
function saveReceivableRow(ss, rec, timestamp) {
  const sheet = ss.getSheetByName(SHEET_RECEIVABLES);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(rec.id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowValues = [
    rec.id,
    rec.orderId || '-',
    rec.customerName || 'Toko Mitra',
    rec.amount || 0,
    rec.transactionDate || timestamp,
    rec.dueDate || '7 Hari',
    rec.status || 'BELUM LUNAS',
    rec.gallonsLoaned || 0,
    rec.phone || '-',
    timestamp
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

/**
 * Simpan baris RekapShift Tutup Buku
 */
function saveSettlementRow(ss, stl, timestamp) {
  const sheet = ss.getSheetByName(SHEET_SETTLEMENT);
  if (!sheet) return;

  const rowValues = [
    stl.date || new Date().toLocaleDateString('id-ID'),
    stl.time || '17:00 WIB',
    stl.grandTotalOmzet || 31190000,
    stl.kasirCashDirect || 11200000,
    stl.kasirQrisTransfer || 7250000,
    stl.driverSetoran || 12740000,
    stl.pelunasanTempo || 0,
    stl.expectedVaultCash || 23940000,
    stl.totalArmadaEmptyGallons || 300,
    stl.selisihGalon || 0,
    stl.isLocked ? 'TERKUNCI & SAH' : 'DRAFT',
    stl.lockedBy || 'Super Admin (Irfan Hakim)',
    timestamp
  ];

  sheet.appendRow(rowValues);
}

/**
 * Simpan baris Bongkar Muat (Inbound Pabrik)
 */
function saveBongkarMuatRow(ss, drop, timestamp) {
  const sheet = ss.getSheetByName(SHEET_BONGKAR_MUAT);
  if (!sheet) return;

  const rowValues = [
    drop.id || ('DROP-' + Math.floor(1000 + Math.random() * 9000)),
    drop.sjNumber || '-',
    drop.supplier || 'Pabrik Air Mineral',
    drop.date || new Date().toLocaleDateString('id-ID'),
    drop.time || '10:00 WIB',
    drop.filledGallonsIn || 0,
    drop.emptyGallonsExchanged || 0,
    drop.dusKemasanIn || 0,
    drop.itemsDescription || (drop.filledGallonsIn + ' Tabung Terisi Masuk'),
    (drop.driverName || 'Supir Pabrik') + (drop.vehiclePlate ? ' (' + drop.vehiclePlate + ')' : ''),
    drop.picWarehouse || 'Ahmad Fauzi (Staf Tabung)',
    drop.status || 'SELESAI_BONGKAR',
    timestamp
  ];

  sheet.appendRow(rowValues);
}

/**
 * Simpan atau perbarui baris Stok & Produk
 */
function saveStockRow(ss, prod, timestamp) {
  const sheet = ss.getSheetByName(SHEET_STOK);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(prod.id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  const statusStok = prod.stock <= (prod.minStock || 20) ? 'MENIPIS / ORDER ULANG' : 'AMAN';

  const rowValues = [
    prod.id,
    prod.name || '-',
    prod.category || '-',
    prod.brand || '-',
    prod.hpp || 0,
    prod.priceRetail || 0,
    prod.priceWholesale || 0,
    prod.stock || 0,
    prod.minStock || 20,
    statusStok,
    timestamp
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

/**
 * Simpan atau perbarui baris Sirkulasi Galon
 */
function saveGallonCirculationRow(ss, gal, timestamp) {
  const sheet = ss.getSheetByName(SHEET_GALON);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(gal.brand).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  const totalAset = (gal.filled || 0) + (gal.empty || 0) + (gal.atStores || 0) + (gal.loanedHousehold || 0) + (gal.soldOutright || 0) + (gal.damaged || 0);

  const rowValues = [
    gal.brand,
    gal.filled || 0,
    gal.empty || 0,
    gal.atStores || 0,
    gal.loanedHousehold || 0,
    gal.soldOutright || 0,
    gal.damaged || 0,
    totalAset,
    timestamp
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}
`;
