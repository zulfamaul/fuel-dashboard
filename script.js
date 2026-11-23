const SUPABASE_URL = "https://uahepttofqbbgzysfyqc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ibh4P-BuQxTtLLBIEtHwQg_8sJtDh5w";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allLogs = [];
let currentlyFilteredLogs = [];

// State Pagination
let currentPage = 1;
let rowsPerPage = 30;

// Sidebar & View Switcher
function toggleSidebar(forceState) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isClosed = sidebar.classList.contains('-translate-x-full');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : isClosed;

    if (shouldOpen) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

function switchSection(sectionName) {
    const dashEl = document.getElementById('sectionDashboard');
    const stockEl = document.getElementById('sectionStock');
    const navDash = document.getElementById('navDashboard');
    const navStock = document.getElementById('navStock');
    const pageTitle = document.getElementById('pageTitle');

    const activeClass = "w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-md bg-[#0000FF] text-white font-semibold transition text-left border border-[#00FFFF]/40";
    const inactiveClass = "w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-md text-slate-200 hover:bg-[#0000FF]/25 hover:text-[#00FFFF] font-medium transition text-left border border-transparent hover:border-[#00FFFF]/30";

    if (sectionName === 'stock') {
        dashEl.classList.add('hidden');
        stockEl.classList.remove('hidden');
        navStock.className = activeClass;
        navDash.className = inactiveClass;
        pageTitle.innerText = "Ringkasan Stok Site";
        renderStockSummary();
    } else {
        stockEl.classList.add('hidden');
        dashEl.classList.remove('hidden');
        navDash.className = activeClass;
        navStock.className = inactiveClass;
        pageTitle.innerText = "Fuel Monitoring System";
    }

    if (window.innerWidth < 1024) {
        toggleSidebar(false);
    }
}

function renderStockSummary() {
    const sites = ['SSB', 'KBB', 'IWACO', 'KDC'];
    const grid = document.getElementById('stockCardsGrid');
    if (!grid) return;

    grid.innerHTML = sites.map(site => {
        const siteRows = allLogs.filter(i => i.site_name === site);
        const receipt = siteRows
            .filter(i => (i.receipt_issued || '').toString().trim().toUpperCase() === 'RECEIPT')
            .reduce((acc, c) => acc + (parseFloat(c.fuel_amount) || 0), 0);
        const out = siteRows
            .filter(i => ['ISSUED', 'TRANSFER INTERN', 'TRANSFER SITE'].includes((i.receipt_issued || '').toString().trim().toUpperCase()))
            .reduce((acc, c) => acc + (parseFloat(c.fuel_amount) || 0), 0);
        const sisa = Math.max(0, receipt - out);

        return `
            <div class="p-4 rounded-md border border-slate-200 border-t-[3px] border-t-[#0000FF] bg-[#f4f6fa] space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold text-slate-950">SITE ${site}</span>
                    <span class="text-[11px] font-semibold text-[#0000FF]">${siteRows.length} trx</span>
                </div>
                <p class="text-xl font-extrabold text-[#0000FF]">${sisa.toLocaleString('id-ID')} L</p>
                <div class="text-[11px] text-slate-600 flex justify-between pt-1.5 border-t border-slate-200">
                    <span>In: ${receipt.toLocaleString('id-ID')} L</span>
                    <span class="text-[#FF0000] font-semibold">Out: ${out.toLocaleString('id-ID')} L</span>
                </div>
            </div>
        `;
    }).join('');
}

// Sinkronisasi input tanggal desktop & mobile
function syncDateInputs(sourceId) {
    const desktopStart = document.getElementById('startDate');
    const desktopEnd = document.getElementById('endDate');
    const mobileStart = document.getElementById('startDateMobile');
    const mobileEnd = document.getElementById('endDateMobile');

    if (sourceId === 'startDate' && mobileStart) mobileStart.value = desktopStart.value;
    if (sourceId === 'endDate' && mobileEnd) mobileEnd.value = desktopEnd.value;
    if (sourceId === 'startDateMobile' && desktopStart) desktopStart.value = mobileStart.value;
    if (sourceId === 'endDateMobile' && desktopEnd) desktopEnd.value = mobileEnd.value;
}

// Set Default Tanggal Filter ke Hari Ini Secara Realtime saat Halaman Dimuat
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
    if (document.getElementById('startDateMobile')) document.getElementById('startDateMobile').value = today;
    if (document.getElementById('endDateMobile')) document.getElementById('endDateMobile').value = today;
}

async function fetchLogs() {
    const { data, error } = await supabaseClient
        .from('fuel_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error("Error fetching logs:", error);
        return;
    }

    allLogs = data;
    renderTable();
    if (!document.getElementById('sectionStock').classList.contains('hidden')) {
        renderStockSummary();
    }
}

function resetDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    if (document.getElementById('startDateMobile')) document.getElementById('startDateMobile').value = '';
    if (document.getElementById('endDateMobile')) document.getElementById('endDateMobile').value = '';
    currentPage = 1;
    renderTable();
}

function resetAllFilters() {
    document.getElementById('filterSite').value = 'ALL';
    document.getElementById('filterShift').value = 'ALL';
    document.getElementById('filterTx').value = 'ALL';
    resetDateFilter();
}

function renderTable() {
    const filterSiteVal = document.getElementById('filterSite').value;
    const filterShiftVal = document.getElementById('filterShift').value;
    const filterTxVal = document.getElementById('filterTx').value;
    const startDateVal = document.getElementById('startDate').value;
    const endDateVal = document.getElementById('endDate').value;

    const tbody = document.getElementById('logsTableBody');
    
    document.getElementById('statActiveSite').innerText = filterSiteVal === 'ALL' ? 'ALL SITE' : filterSiteVal;

    // Filter Data Sesuai Pilihan Dropdown & Tanggal
    currentlyFilteredLogs = allLogs.filter(item => {
        const matchSite = (filterSiteVal === 'ALL') || (item.site_name === filterSiteVal);
        
        const itemShift = item.shift ? item.shift.toString().trim() : '';
        const matchShift = (filterShiftVal === 'ALL') || (itemShift.toLowerCase() === filterShiftVal.toLowerCase());

        const txType = item.receipt_issued ? item.receipt_issued.toString().trim().toUpperCase() : '';
        const matchTx = (filterTxVal === 'ALL') || (txType === filterTxVal);

        let matchDate = true;
        if (item.created_at) {
            const itemDate = new Date(item.created_at);
            if (startDateVal) {
                const start = new Date(startDateVal);
                start.setHours(0, 0, 0, 0);
                if (itemDate < start) matchDate = false;
            }
            if (endDateVal) {
                const end = new Date(endDateVal);
                end.setHours(23, 59, 59, 999);
                if (itemDate > end) matchDate = false;
            }
        }

        return matchSite && matchShift && matchTx && matchDate;
    });

    // Update Jumlah Transaksi
    document.getElementById('statCount').innerText = currentlyFilteredLogs.length;

    // Update Kartu Statistik Jenis Transaksi Dinamis
    const txLabel = document.getElementById('statTxLabel');
    const txAmount = document.getElementById('statTxAmount');
    
    let totalVolume = 0;
    if (filterTxVal === 'ISSUED') {
        txLabel.innerText = "Total Solar Issued";
        totalVolume = currentlyFilteredLogs
            .filter(i => (i.receipt_issued || '').toString().trim().toUpperCase() === 'ISSUED')
            .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);
        txAmount.className = "text-2xl font-extrabold text-[#FF0000]";
    } else if (filterTxVal === 'RECEIPT') {
        txLabel.innerText = "Total Solar Receipt";
        totalVolume = currentlyFilteredLogs
            .filter(i => (i.receipt_issued || '').toString().trim().toUpperCase() === 'RECEIPT')
            .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);
        txAmount.className = "text-2xl font-extrabold text-[#0000FF]";
    } else if (filterTxVal.includes('TRANSFER')) {
        txLabel.innerText = `Total ${filterTxVal}`;
        totalVolume = currentlyFilteredLogs
            .filter(i => (i.receipt_issued || '').toString().trim().toUpperCase() === filterTxVal)
            .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);
        txAmount.className = "text-2xl font-extrabold text-[#0000FF]";
    } else {
        txLabel.innerText = "Total Volume Solar";
        totalVolume = currentlyFilteredLogs
            .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);
        txAmount.className = "text-2xl font-extrabold text-[#0000FF]";
    }
    txAmount.innerText = `${totalVolume.toLocaleString('id-ID')} L`;

    // HITUNG SISA STOK REALTIME KHUSUS DARI SITE YANG SEDANG DIPILIH
    const siteLogsForStock = allLogs.filter(item => {
        return (filterSiteVal === 'ALL') || (item.site_name === filterSiteVal);
    });

    const totalReceiptSite = siteLogsForStock
        .filter(i => (i.receipt_issued || '').toString().trim().toUpperCase() === 'RECEIPT')
        .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);

    const totalOutSite = siteLogsForStock
        .filter(i => ['ISSUED', 'TRANSFER INTERN', 'TRANSFER SITE'].includes((i.receipt_issued || '').toString().trim().toUpperCase()))
        .reduce((acc, curr) => acc + (parseFloat(c.fuel_amount) || 0), 0);

    const remainingFuel = Math.max(0, totalReceiptSite - totalOutSite);

    // Update Tampilan Volume Tangki & Visual Ketinggian Cairan
    document.getElementById('tankVolume').innerText = `${remainingFuel.toLocaleString('id-ID')} L`;

    let visualHeight = 0;
    if (totalReceiptSite > 0) {
        visualHeight = Math.min(100, Math.max(10, Math.round((remainingFuel / totalReceiptSite) * 100)));
    } else if (remainingFuel > 0) {
        visualHeight = 50;
    }
    document.getElementById('tankFluid').style.height = `${visualHeight}%`;

    // LOGIKA PAGINATION
    const totalItems = currentlyFilteredLogs.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

    const paginatedLogs = currentlyFilteredLogs.slice(startIndex, endIndex);

    // Update UI Informasi Pagination
    document.getElementById('paginationInfo').innerText = totalItems > 0 
        ? `Menampilkan ${startIndex + 1} - ${endIndex} dari ${totalItems} data`
        : `Menampilkan 0 data`;
    
    document.getElementById('pageIndicator').innerText = `Halaman ${currentPage} dari ${totalPages}`;
    document.getElementById('prevBtn').disabled = (currentPage === 1);
    document.getElementById('nextBtn').disabled = (currentPage === totalPages || totalItems === 0);

    // Render Baris Tabel
    if (paginatedLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="14" class="p-8 text-center text-slate-500 font-medium">Tidak ada data transaksi yang sesuai filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = paginatedLogs.map((log) => {
        const dateObj = new Date(log.created_at);
        const timeStr = dateObj.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        const tx = log.receipt_issued ? log.receipt_issued.toString().trim().toUpperCase() : '';
        let badgeStyle = "bg-slate-100 text-slate-800 border border-slate-300";
        if (tx === 'ISSUED') badgeStyle = "bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/40";
        if (tx === 'RECEIPT') badgeStyle = "bg-[#0000FF]/10 text-[#0000FF] border border-[#0000FF]/40";
        if (tx.includes('TRANSFER')) badgeStyle = "bg-[#00FFFF]/20 text-slate-950 border border-[#0000FF]/40";

        const shiftVal = log.shift || '-';
        let shiftStyle = "bg-slate-100 text-slate-800 border border-slate-300";
        if (shiftVal.toLowerCase() === 'day') shiftStyle = "bg-[#00FFFF]/25 text-slate-950 border border-[#0000FF]/35";
        if (shiftVal.toLowerCase() === 'night') shiftStyle = "bg-[#070b24] text-[#00FFFF] border border-[#0000FF]";

        const keteranganVal = log.unit_remark ? log.unit_remark : '-';

        return `
            <tr class="hover:bg-[#f4f6fa] transition">
                <td class="p-3 text-slate-600 whitespace-nowrap">${timeStr}</td>
                <td class="p-3 font-extrabold text-slate-950">${log.site_name || '-'}</td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${shiftStyle}">
                        ${shiftVal}
                    </span>
                </td>
                <td class="p-3 text-slate-700">${log.fuel_storage || '-'}</td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${badgeStyle}">
                        ${tx || '-'}
                    </span>
                </td>
                <td class="p-3 font-bold text-slate-900">${log.no_unit || '-'}</td>
                <td class="p-3 text-slate-600 italic">${keteranganVal}</td>
                <td class="p-3 text-slate-700">${log.material_type || '-'}</td>
                <td class="p-3 font-extrabold text-[#0000FF]">${log.fuel_amount || 0} L</td>
                <td class="p-3 text-slate-700 font-mono text-[11px]">${log.hm_fuel_unit || '-'}</td>
                <td class="p-3 text-slate-600">${log.no_voucher || '-'}</td>
                <td class="p-3 text-slate-800 font-medium">${log.pic_name || '-'}</td>
                <td class="p-3 text-center">
                    <button onclick="openModal('${log.evidence_hm_url}', '${log.evidence_liter_url}')" class="text-slate-900 hover:bg-[#00FFFF]/30 bg-[#f4f6fa] text-[11px] font-bold px-2.5 py-1 rounded transition border border-[#0000FF]/40">
                        Lihat Foto
                    </button>
                </td>
                <td class="p-3 text-center">
                    <button onclick="openEditModal('${log.id}')" class="text-[#0000FF] hover:bg-[#0000FF] hover:text-white bg-[#0000FF]/10 text-[11px] font-bold px-2.5 py-1 rounded transition border border-[#0000FF]/40">
                        Edit
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Pagination Handler Functions
function changeRowsPerPage() {
    rowsPerPage = parseInt(document.getElementById('rowsPerPageSelect').value);
    currentPage = 1;
    renderTable();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(currentlyFilteredLogs.length / rowsPerPage) || 1;
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

// Modal Evidence Handler dengan Google Drive Thumbnail API
function openModal(urlHM, urlLiter) {
    function convertDriveLink(url) {
        if (!url || url === 'null' || url === 'undefined') return '';
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        }
        return url;
    }

    document.getElementById('modalImgHM').src = convertDriveLink(urlHM);
    document.getElementById('modalImgLiter').src = convertDriveLink(urlLiter);
    document.getElementById('imageModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('imageModal').classList.add('hidden');
}

// Edit Modal Handler
function openEditModal(id) {
    const log = allLogs.find(item => item.id == id);
    if (!log) return;

    document.getElementById('editId').value = log.id;
    document.getElementById('editSiteName').value = log.site_name || 'SSB';
    document.getElementById('editShift').value = log.shift || 'Day';
    document.getElementById('editFuelStorage').value = log.fuel_storage || '';
    document.getElementById('editReceiptIssued').value = log.receipt_issued || 'ISSUED';
    document.getElementById('editNoUnit').value = log.no_unit || '';
    document.getElementById('editKeteranganUnit').value = log.unit_remark || '';
    document.getElementById('editMaterialType').value = log.material_type || '';
    document.getElementById('editFuelAmount').value = log.fuel_amount || 0;
    document.getElementById('editHmFuelTruck').value = log.hm_fuel_unit || '';
    document.getElementById('editNoVoucher').value = log.no_voucher || '';
    document.getElementById('editPicName').value = log.pic_name || '';

    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

async function handleUpdate(e) {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const updatedData = {
        site_name: document.getElementById('editSiteName').value,
        shift: document.getElementById('editShift').value,
        fuel_storage: document.getElementById('editFuelStorage').value,
        receipt_issued: document.getElementById('editReceiptIssued').value,
        no_unit: document.getElementById('editNoUnit').value,
        unit_remark: document.getElementById('editKeteranganUnit').value,
        material_type: document.getElementById('editMaterialType').value,
        fuel_amount: parseFloat(document.getElementById('editFuelAmount').value) || 0,
        hm_fuel_unit: document.getElementById('editHmFuelTruck').value,
        no_voucher: document.getElementById('editNoVoucher').value,
        pic_name: document.getElementById('editPicName').value
    };

    const { error } = await supabaseClient
        .from('fuel_logs')
        .update(updatedData)
        .eq('id', id);

    if (error) {
        alert("Gagal memperbarui data: " + error.message);
        return;
    }

    alert("Data berhasil diperbarui!");
    closeEditModal();
    fetchLogs();
}

// Export Excel dengan Penyesuaian Tanggal Produksi & Shift Sesuai Aturan Site
function exportToExcel() {
    if (currentlyFilteredLogs.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    const excelData = currentlyFilteredLogs.map((log, index) => {
        let tglStr = '-';
        let jamStr = '-';
        let bulanStr = '-';
        let shiftStr = log.shift || '-';

        if (log.created_at) {
            const d = new Date(log.created_at);
            let hour = d.getHours();

            if (hour < 7) {
                d.setDate(d.getDate() - 1);
                shiftStr = 'Night';
            } else if (hour >= 19) {
                shiftStr = 'Night';
            } else {
                shiftStr = 'Day';
            }

            tglStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/\./g, '-');
            
            const dOriginal = new Date(log.created_at);
            jamStr = dOriginal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
            bulanStr = d.toLocaleDateString('id-ID', { month: 'long' }).toUpperCase();
        }

        return {
            "No": index + 1,
            "Tanggal": tglStr,
            "Jam": jamStr,
            "Shift": shiftStr,
            "Unit": log.no_unit || '-',
            "HM/KM": log.hm_fuel_unit || '-',
            "Liter": log.fuel_amount || 0,
            "Fuel Storage": log.fuel_storage || '-',
            "Supply": "",
            "Transfer": "",
            "Driver": log.pic_name || '-',
            "Fuelman": log.pic_name || '-',
            "Workgroup": log.material_type || '-',
            "Bulan": bulanStr
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fuel Logs");

    const siteFilter = document.getElementById('filterSite').value;
    const fileName = `Fuel_Logs_${siteFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// Event Listener Filter Perubahan
document.getElementById('filterSite').addEventListener('change', () => { currentPage = 1; renderTable(); });
document.getElementById('filterShift').addEventListener('change', () => { currentPage = 1; renderTable(); });
document.getElementById('filterTx').addEventListener('change', () => { currentPage = 1; renderTable(); });
document.getElementById('startDate').addEventListener('change', () => { syncDateInputs('startDate'); currentPage = 1; renderTable(); });
document.getElementById('endDate').addEventListener('change', () => { syncDateInputs('endDate'); currentPage = 1; renderTable(); });
if (document.getElementById('startDateMobile')) {
    document.getElementById('startDateMobile').addEventListener('change', () => { syncDateInputs('startDateMobile'); currentPage = 1; renderTable(); });
}
if (document.getElementById('endDateMobile')) {
    document.getElementById('endDateMobile').addEventListener('change', () => { syncDateInputs('endDateMobile'); currentPage = 1; renderTable(); });
}

// Initial Load
setDefaultDate();
fetchLogs();

// Realtime polling setiap 30 detik
setInterval(fetchLogs, 30000);
