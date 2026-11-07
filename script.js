const SUPABASE_URL = "https://srygivwnsjyjmacwokix.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeWdpdnduc2p5am1hY3dva2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NjUyNTgsImV4cCI6MjEwNTU0MTI1OH0.GhsqIHUaww0af6P2USDyUpw2FuY_IzrihtFXGbSp2SY";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allLogs = [];
let currentlyFilteredLogs = [];

// State Pagination
let currentPage = 1;
let rowsPerPage = 30;

// Set Default Tanggal Filter ke Hari Ini Secara Realtime saat Halaman Dimuat
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
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
}

function resetDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    currentPage = 1;
    renderTable();
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
        txAmount.className = "text-2xl font-semibold text-rose-600";
    } else if (filterTxVal === 'RECEIPT') {
        txLabel.innerText = "Total Solar Receipt";
        totalVolume = currentlyFilteredLogs
            .filter(i => (i.receipt_issued || '').toString().trim().toUpperCase() === 'RECEIPT')
            .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);
        txAmount.className = "text-2xl font-semibold text-emerald-600";
    } else if (filterTxVal === 'TRANSFER') {
        txLabel.innerText = "Total Solar Transfer";
        totalVolume = currentlyFilteredLogs
            .filter(i => (i.receipt_issued || '').toString().trim().toUpperCase() === 'TRANSFER')
            .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);
        txAmount.className = "text-2xl font-semibold text-sky-600";
    } else {
        txLabel.innerText = "Total Volume Solar";
        totalVolume = currentlyFilteredLogs
            .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);
        txAmount.className = "text-2xl font-semibold text-slate-900";
    }
    txAmount.innerText = `${totalVolume.toLocaleString('id-ID')} L`;

    // HITUNG SISA STOK REALTIME KHUSUS DARI SITE YANG SEDANG DIPILIH
    const siteLogsForStock = allLogs.filter(item => {
        return (filterSiteVal === 'ALL') || (item.site_name === filterSiteVal);
    });

    const totalReceiptSite = siteLogsForStock
        .filter(i => (i.receipt_issued || '').toString().trim().toUpperCase() === 'RECEIPT')
        .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);

    const totalIssuedSite = siteLogsForStock
        .filter(i => (i.receipt_issued || '').toString().trim().toUpperCase() === 'ISSUED')
        .reduce((acc, curr) => acc + (parseFloat(curr.fuel_amount) || 0), 0);

    const remainingFuel = Math.max(0, totalReceiptSite - totalIssuedSite);

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
        tbody.innerHTML = `<tr><td colspan="14" class="p-8 text-center text-slate-400">Tidak ada data transaksi yang sesuai filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = paginatedLogs.map((log) => {
        const dateObj = new Date(log.created_at);
        const timeStr = dateObj.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        const tx = log.receipt_issued ? log.receipt_issued.toString().trim().toUpperCase() : '';
        let badgeStyle = "bg-slate-100 text-slate-600";
        if (tx === 'ISSUED') badgeStyle = "bg-rose-50 text-rose-700 border border-rose-200";
        if (tx === 'RECEIPT') badgeStyle = "bg-emerald-50 text-emerald-700 border border-emerald-200";
        if (tx === 'TRANSFER') badgeStyle = "bg-sky-50 text-sky-700 border border-sky-200";

        const shiftVal = log.shift || '-';
        let shiftStyle = "bg-slate-100 text-slate-600";
        if (shiftVal.toLowerCase() === 'day') shiftStyle = "bg-amber-50 text-amber-700 border border-amber-200";
        if (shiftVal.toLowerCase() === 'night') shiftStyle = "bg-indigo-50 text-indigo-700 border border-indigo-200";

        const keteranganVal = log.keterangan_unit ? log.keterangan_unit : '-';

        return `
            <tr class="hover:bg-slate-50/80 transition">
                <td class="p-3 text-slate-500 whitespace-nowrap">${timeStr}</td>
                <td class="p-3 font-semibold text-slate-900">${log.site_name || '-'}</td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-medium ${shiftStyle}">
                        ${shiftVal}
                    </span>
                </td>
                <td class="p-3 text-slate-600">${log.fuel_storage || '-'}</td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${badgeStyle}">
                        ${tx || '-'}
                    </span>
                </td>
                <td class="p-3 font-medium text-slate-800">${log.no_unit || '-'}</td>
                <td class="p-3 text-slate-600 italic">${keteranganVal}</td>
                <td class="p-3 text-slate-600">${log.material_type || '-'}</td>
                <td class="p-3 font-semibold text-slate-900">${log.fuel_amount || 0} L</td>
                <td class="p-3 text-slate-600 font-mono text-[11px]">${log.hm_fuel_truck || '-'}</td>
                <td class="p-3 text-slate-500">${log.no_voucher || '-'}</td>
                <td class="p-3 text-slate-700">${log.pic_name || '-'}</td>
                <td class="p-3 text-center">
                    <button onclick="openModal('${log.evidence_hm_url}', '${log.evidence_liter_url}')" class="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-[11px] font-medium px-2.5 py-1 rounded transition border border-slate-200">
                        Lihat Foto
                    </button>
                </td>
                <td class="p-3 text-center">
                    <button onclick="openEditModal('${log.id}')" class="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 text-[11px] font-medium px-2.5 py-1 rounded transition border border-blue-200">
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

// Modal Evidence Handler
function openModal(urlHM, urlLiter) {
    document.getElementById('modalImgHM').src = (urlHM && urlHM !== 'null' && urlHM !== 'undefined') ? urlHM : '';
    document.getElementById('modalImgLiter').src = (urlLiter && urlLiter !== 'null' && urlLiter !== 'undefined') ? urlLiter : '';
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
    document.getElementById('editKeteranganUnit').value = log.keterangan_unit || '';
    document.getElementById('editMaterialType').value = log.material_type || '';
    document.getElementById('editFuelAmount').value = log.fuel_amount || 0;
    document.getElementById('editHmFuelTruck').value = log.hm_fuel_truck || '';
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
        keterangan_unit: document.getElementById('editKeteranganUnit').value,
        material_type: document.getElementById('editMaterialType').value,
        fuel_amount: parseFloat(document.getElementById('editFuelAmount').value) || 0,
        hm_fuel_truck: document.getElementById('editHmFuelTruck').value,
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

// Export Excel dengan Urutan Kolom Sesuai Referensi Gambar Anda
function exportToExcel() {
    if (currentlyFilteredLogs.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    const excelData = currentlyFilteredLogs.map((log, index) => {
        let tglStr = '-';
        let jamStr = '-';
        let bulanStr = '-';

        if (log.created_at) {
            const d = new Date(log.created_at);
            tglStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/\./g, '-');
            jamStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
            bulanStr = d.toLocaleDateString('id-ID', { month: 'long' }).toUpperCase();
        }

        return {
            "No": index + 1,
            "Tanggal": tglStr,
            "Jam": jamStr,
            "Shift": log.shift || '-',
            "Unit": log.no_unit || '-',
            "HM/KM": log.hm_fuel_truck || '-',
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
document.getElementById('startDate').addEventListener('change', () => { currentPage = 1; renderTable(); });
document.getElementById('endDate').addEventListener('change', () => { currentPage = 1; renderTable(); });

// Initial Load
setDefaultDate();
fetchLogs();

// Realtime polling setiap 30 detik agar data selalu ter-update otomatis
setInterval(fetchLogs, 30000);
