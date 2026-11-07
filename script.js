<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fuel Monitoring System - PT Bima Nusa Internasional</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Supabase JS -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <!-- SheetJS -->
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <!-- Inter Font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
        @keyframes wave {
            0% { transform: translateX(0) translateZ(0) scaleY(1); }
            50% { transform: translateX(-25%) translateZ(0) scaleY(0.85); }
            100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
        }
        .wave-animation { animation: wave 3s linear infinite; }
        /* Warna Aksen Konsisten */
        .border-t-custom-blue { border-top-color: #000080 !important; }
        .border-t-custom-red { border-top-color: #FF0000 !important; }
        
        /* Transisi Smooth untuk Toggle Sidebar */
        #sidebar { transition: transform 0.3s ease-in-out; }
        #mainWrapper { transition: margin-left 0.3s ease-in-out; }
    </style>
</head>
<body class="text-slate-800 antialiased min-h-screen flex overflow-x-hidden">

    <!-- Sidebar Navigation (Kiri) -->
    <aside id="sidebar" class="w-64 bg-slate-950 text-slate-300 flex flex-col fixed inset-y-0 left-0 z-40 border-r border-slate-800 shadow-xl transform translate-x-0">
        <!-- Brand / Logo Area -->
        <div class="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-900/50">
            <div class="flex items-center space-x-3">
                <img src="./BN.png" alt="BNI Logo" class="h-7 w-auto object-contain bg-white rounded p-0.5" onerror="this.onerror=null; this.src='logo.png';">
                <div>
                    <h1 class="text-xs font-bold text-white tracking-wider uppercase">Fuel Monitoring</h1>
                    <p class="text-[10px] text-slate-400">PT Bima Nusa Internasional</p>
                </div>
            </div>
        </div>

        <!-- Navigation Menu (Form Input Dihapus Sesuai Permintaan) -->
        <div class="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            <p class="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2 tracking-wider">Control Menu</p>
            
            <a href="#" class="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-[#000080] text-white text-xs font-semibold shadow-sm transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                <span>Dashboard Utama</span>
            </a>
        </div>

        <!-- Sidebar Footer / Status -->
        <div class="p-4 border-t border-slate-800 bg-slate-900/40">
            <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Status Sistem</span>
                <span class="flex items-center text-emerald-400 font-medium">
                    <span class="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Online
                </span>
            </div>
        </div>
    </aside>

    <!-- Main Wrapper (Kanan, bergeser otomatis saat sidebar di-hide) -->
    <div id="mainWrapper" class="flex-1 ml-64 flex flex-col min-h-screen">

        <!-- Top Header Bar -->
        <header class="bg-white border-b-2 border-[#FF0000] sticky top-0 z-30 shadow-xs">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center space-x-3">
                        <!-- Tombol Toggle Sidebar (Hide / Show) -->
                        <button onclick="toggleSidebar()" title="Sembunyikan/Tampilkan Sidebar" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">MONITORING CONTROL HO</span>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="text-xs text-slate-500">MoCo HO</span>
                        <div class="w-8 h-8 rounded-full bg-[#000080] text-white flex items-center justify-center font-bold text-xs shadow-xs">HO</div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content Container -->
        <main class="max-w-7xl w-full mx-auto px-6 py-6 space-y-6 flex-1">

            <!-- KPI Grid Atas (Garis Biru #000080 dengan Efek 3D Shadow) -->
            <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <!-- Card 1 -->
                <div class="bg-white p-4 rounded-xl border border-slate-200 border-t-[3px] border-t-custom-blue shadow-sm flex flex-col justify-between">
                    <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Transaksi</p>
                    <div class="mt-3 flex items-baseline justify-between">
                        <p id="statCount" class="text-2xl font-bold text-slate-900">0</p>
                        <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Records</span>
                    </div>
                </div>

                <!-- Card 2 -->
                <div class="bg-white p-4 rounded-xl border border-slate-200 border-t-[3px] border-t-custom-blue shadow-sm flex flex-col justify-between">
                    <p id="statTxLabel" class="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Fuel Volume</p>
                    <div class="mt-3 flex items-baseline justify-between">
                        <p id="statTxAmount" class="text-2xl font-bold text-emerald-600">0 L</p>
                        <span class="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">Liters</span>
                    </div>
                </div>

                <!-- Card 3 -->
                <div class="bg-white p-4 rounded-xl border border-slate-200 border-t-[3px] border-t-custom-blue shadow-sm flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Top volume fuel by Material</p>
                        <span id="statActiveSite" class="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">ALL SITE</span>
                    </div>
                    <div class="mt-3">
                        <p id="dominantMaterial" class="text-sm font-bold text-slate-800 truncate">-</p>
                        <p class="text-[10px] text-slate-400 mt-0.5">Distribusi material dominan</p>
                    </div>
                </div>

                <!-- Card 4 -->
                <div class="bg-white p-3.5 rounded-xl border border-slate-200 border-t-[3px] border-t-custom-blue shadow-sm flex items-center space-x-3.5">
                    <div class="relative w-12 h-16 bg-slate-900 border-2 border-slate-700 rounded-md overflow-hidden flex-shrink-0 flex flex-col justify-end shadow-inner">
                        <div id="tankFluid" class="w-[200%] bg-gradient-to-t from-cyan-600 to-blue-500 wave-animation transition-all duration-700 ease-out relative opacity-90" style="height: 0%;">
                            <div class="absolute top-0 left-0 w-full h-1 bg-cyan-300 shadow-sm"></div>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Actual Fuel Stock</p>
                        <p id="tankVolume" class="text-xl font-bold text-slate-900 truncate mt-1">0 L</p>
                    </div>
                </div>

            </section>

            <!-- Analytics Row Bawah (Garis Merah #FF0000 dengan Efek 3D Shadow) -->
            <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                <!-- Box 1: Top 3 Consuming Unit -->
                <div class="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 border-t-[3px] border-t-custom-red shadow-sm">
                    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Top 3 Consuming Unit</h3>
                        <span class="text-[10px] text-slate-400">Berdasarkan Filter Aktif</span>
                    </div>
                    <div id="topUnitsContainer" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <div class="bg-slate-50 p-2.5 rounded border border-slate-100 text-center text-xs text-slate-400">Memuat data unit...</div>
                        <div class="bg-slate-50 p-2.5 rounded border border-slate-100 text-center text-xs text-slate-400">Memuat data unit...</div>
                        <div class="bg-slate-50 p-2.5 rounded border border-slate-100 text-center text-xs text-slate-400">Memuat data unit...</div>
                    </div>
                </div>

                <!-- Box 2: Pic / Pelaksana Teraktif -->
                <div class="bg-white p-4 rounded-xl border border-slate-200 border-t-[3px] border-t-custom-red shadow-sm flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Pic / Pelaksana Teraktif</h3>
                        </div>
                        <div class="mt-3 space-y-2">
                            <div class="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-100">
                                <span id="topPicName" class="text-xs font-bold text-slate-800">-</span>
                                <span id="topPicCount" class="text-[11px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">0 Input</span>
                            </div>
                        </div>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-3 italic">*Pencatatan terbanyak pada periode ini.</p>
                </div>

            </section>

            <!-- Filter Bar -->
            <section class="bg-white p-3.5 rounded-xl border border-slate-200 border-t-2 border-t-slate-300 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span class="text-xs font-medium text-slate-500">Tanggal:</span>
                        <input type="date" id="startDate" onchange="loadDashboardData()" class="bg-transparent text-xs font-medium text-slate-700 outline-none">
                        <span class="text-xs text-slate-400">s/d</span>
                        <input type="date" id="endDate" onchange="loadDashboardData()" class="bg-transparent text-xs font-medium text-slate-700 outline-none">
                        <button onclick="resetDateFilter()" class="text-xs text-slate-400 hover:text-slate-600 px-1 font-bold">✕</button>
                    </div>
                    <div class="flex items-center space-x-1.5">
                        <label for="filterSite" class="text-xs font-medium text-slate-500">Site:</label>
                        <select id="filterSite" onchange="loadDashboardData()" class="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg px-2.5 py-1.5 outline-none">
                            <option value="ALL">All Site</option>
                            <option value="SSB">SSB</option>
                            <option value="KBB">KBB</option>
                            <option value="IWACO">IWACO</option>
                            <option value="KDC">KDC</option>
                        </select>
                    </div>
                    <div class="flex items-center space-x-1.5">
                        <label for="filterShift" class="text-xs font-medium text-slate-500">Shift:</label>
                        <select id="filterShift" onchange="loadDashboardData()" class="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg px-2.5 py-1.5 outline-none">
                            <option value="ALL">All Shift</option>
                            <option value="Day">Day</option>
                            <option value="Night">Night</option>
                        </select>
                    </div>
                    <div class="flex items-center space-x-1.5">
                        <label for="filterTx" class="text-xs font-medium text-slate-500">Transaction:</label>
                        <select id="filterTx" onchange="loadDashboardData()" class="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg px-2.5 py-1.5 outline-none">
                            <option value="ALL">All Trx</option>
                            <option value="ISSUED">Issued</option>
                            <option value="RECEIPT">Receipt</option>
                            <option value="TRANSFER">Transfer</option>
                        </select>
                    </div>
                </div>
                <button onclick="exportToExcel()" title="Download Excel" class="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition flex items-center justify-center shadow-xs">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </button>
            </section>

            <!-- Table Section -->
            <section class="bg-white border border-slate-200 border-t-2 border-t-slate-300 rounded-xl shadow-sm overflow-hidden">
                <div class="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
                    <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider">RIWAYAT TRANSAKSI</h2>
                    <span class="text-[11px] text-slate-400 font-medium">HO Monitoring Control</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-medium">
                            <tr>
                                <th class="p-3">Waktu Input</th>
                                <th class="p-3">Site</th>
                                <th class="p-3">Shift</th>
                                <th class="p-3">Storage</th>
                                <th class="p-3">Transaksi</th>
                                <th class="p-3">No Unit</th>
                                <th class="p-3">Keterangan Unit</th>
                                <th class="p-3">Material</th>
                                <th class="p-3">Liter</th>
                                <th class="p-3">HM Truck</th>
                                <th class="p-3">Voucher</th>
                                <th class="p-3">PIC</th>
                                <th class="p-3 text-center">Evidence</th>
                                <th class="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody id="logsTableBody" class="divide-y divide-slate-100 text-slate-700">
                            <tr><td colspan="14" class="p-8 text-center text-slate-400">Memuat data transaksi...</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination Bar -->
                <div class="px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                    <div class="flex items-center space-x-2">
                        <span>Tampilkan</span>
                        <select id="rowsPerPage" onchange="currentPage=1; loadDashboardData()" class="bg-white border border-slate-200 rounded px-2 py-1 outline-none shadow-xs">
                            <option value="15">15</option>
                            <option value="30" selected>30</option>
                            <option value="50">50</option>
                        </select>
                        <span id="paginationInfo">Memuat data...</span>
                    </div>
                    <div class="flex items-center space-x-1">
                        <button onclick="prevPage()" id="prevBtn" class="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 shadow-xs">Prev</button>
                        <span id="pageIndicator" class="px-2 font-medium">1</span>
                        <button onclick="nextPage()" id="nextBtn" class="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 shadow-xs">Next</button>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- Modal Dual Evidence (HM & Liter) -->
    <div id="imageModal" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-6 max-w-3xl w-full relative shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wide">TRANSACTION EVIDENCE</h3>
                <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-full bg-slate-100 hover:bg-slate-200 w-7 h-7 flex items-center justify-center transition">✕</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p class="text-xs font-semibold text-slate-600 mb-1.5">Evidence HM Unit</p>
                    <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-64 flex items-center justify-center shadow-inner">
                        <img id="modalImgHm" src="" class="w-full h-full object-contain hidden" alt="Evidence HM">
                        <span id="noImgHm" class="text-xs text-slate-400 italic">Tidak ada foto HM</span>
                    </div>
                </div>
                <div>
                    <p class="text-xs font-semibold text-slate-600 mb-1.5">Evidence Liter</p>
                    <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-64 flex items-center justify-center shadow-inner">
                        <img id="modalImgLiter" src="" class="w-full h-full object-contain hidden" alt="Evidence Liter">
                        <span id="noImgLiter" class="text-xs text-slate-400 italic">Tidak ada foto Liter</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Modal (CRUD Update) -->
    <div id="editModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-xl border border-slate-200">
            <button onclick="closeEditModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Edit Data Transaksi</h3>
            
            <form id="editForm" onsubmit="handleUpdate(event)" class="space-y-4 text-xs">
                <input type="hidden" id="editId">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">Site</label>
                        <select id="editSiteName" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                            <option value="SSB">SSB</option>
                            <option value="KBB">KBB</option>
                            <option value="IWACO">IWACO</option>
                            <option value="KDC">KDC</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">Shift</label>
                        <select id="editShift" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                            <option value="Day">Day</option>
                            <option value="Night">Night</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">Storage</label>
                        <input type="text" id="editFuelStorage" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                    </div>
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">Transaction</label>
                        <select id="editReceiptIssued" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                            <option value="ISSUED">ISSUED</option>
                            <option value="RECEIPT">RECEIPT</option>
                            <option value="TRANSFER">TRANSFER</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">No Unit</label>
                        <input type="text" id="editNoUnit" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                    </div>
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">Keterangan Unit</label>
                        <input type="text" id="editKeteranganUnit" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">Material Type</label>
                        <input type="text" id="editMaterialType" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                    </div>
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">Jumlah (Liter)</label>
                        <input type="number" step="any" id="editFuelAmount" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">HM Fuel Truck</label>
                        <input type="text" id="editHmFuelTruck" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                    </div>
                    <div>
                        <label class="block font-medium text-slate-600 mb-1">No Voucher</label>
                        <input type="text" id="editNoVoucher" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                    </div>
                </div>
                <div>
                    <label class="block font-medium text-slate-600 mb-1">PIC Name</label>
                    <input type="text" id="editPicName" class="w-full bg-slate-50 border border-slate-200 rounded p-2 outline-none">
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button type="button" onclick="closeEditModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition">Batal</button>
                    <button type="submit" class="px-4 py-2 bg-blue-900 text-white font-semibold rounded hover:bg-blue-800 transition">Simpan Perubahan</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Script Toggle Sidebar -->
    <script>
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const mainWrapper = document.getElementById('mainWrapper');
            
            if (sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('-translate-x-full');
                mainWrapper.classList.add('ml-64');
                mainWrapper.classList.remove('ml-0');
            } else {
                sidebar.classList.add('-translate-x-full');
                mainWrapper.classList.remove('ml-64');
                mainWrapper.classList.add('ml-0');
            }
        }
    </script>

    <!-- Script Utama (script.js) -->
    <script src="./script.js"></script>
</body>
</html>
