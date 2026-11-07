const SUPABASE_URL = "https://srygivwnsjyjmacwokix.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeWdpdnduc2p5am1hY3dva2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NjUyNTgsImV4cCI6MjEwNTU0MTI1OH0.GhsqIHUaww0af6P2USDyUpw2FuY_IzrihtFXGbSp2SY";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentPage = 1;
let totalRows = 0;
let cachedFilteredDataForExcel = [];

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();
    setInterval(loadDashboardData, 30000); // Polling real-time 30 detik
});

function buildBaseQuery() {
    const site = document.getElementById('filterSite').value;
    const shift = document.getElementById('filterShift').value;
    const tx = document.getElementById('filterTx').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    let query = supabaseClient.from('fuel_logs').select('*', { count: 'exact' });

    if (site && site !== 'ALL') query = query.eq('site_name', site);
    if (shift && shift !== 'ALL') query = query.eq('shift', shift);
    if (tx && tx !== 'ALL') query = query.eq('receipt_issued', tx);
    
    if (startDate) query = query.gte('created_at', startDate + 'T00:00:00');
    if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');

    return query;
}

async function loadDashboardData() {
    const site = document.getElementById('filterSite').value;
    const limit = parseInt(document.getElementById('rowsPerPage').value) || 30;

    const siteLabelEl = document.getElementById('statActiveSite');
    if (siteLabelEl) siteLabelEl.innerText = site === 'ALL' ? 'ALL SITE' : site;

    // Ambil data analitik KPI
    const { data: allFilteredData, error: analyticsError } = await buildBaseQuery().select('no_unit, fuel_amount, material_type, pic_name, receipt_issued, fuel_storage, site_name, created_at');
    
    if (!analyticsError && allFilteredData) {
        cachedFilteredDataForExcel = allFilteredData;
        computeAndRenderAdvancedMetrics(allFilteredData);
    } else {
        console.error("Analytics Error:", analyticsError);
    }

    // Server-side pagination untuk tabel utama
    const from = (currentPage - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await buildBaseQuery()
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error loading table data:", error);
        document.getElementById('logsTableBody').innerHTML = `<tr><td colspan="14" class="p-8 text-center text-red-500 font-semibold">Gagal memuat data: ${error.message}</td></tr>`;
        return;
    }

    totalRows = count || 0;
    renderTable(data || []);
    updatePaginationInfo(limit);
}

function computeAndRenderAdvancedMetrics(rows) {
    let totalVol = 0;
    const unitMap = {};
    const materialMap = {};
    const picMap = {};

    rows.forEach(r => {
        const vol = parseFloat(r.fuel_amount) || 0;
        totalVol += vol;

        if (r.material_type) {
            const mat = r.material_type.toUpperCase();
            materialMap[mat] = (materialMap[mat] || 0) + vol;
        }

        if (r.no_unit && r.receipt_issued === 'ISSUED') {
            const unit = r.no_unit.trim().toUpperCase();
            unitMap[unit] = (unitMap[unit] || 0) + vol;
        }

        if (r.pic_name) {
            const pic = r.pic_name.trim();
            picMap[pic] = (picMap[pic] || 0) + 1;
        }
    });

    const statTxAmount = document.getElementById('statTxAmount');
    const statCount = document.getElementById('statCount');
    if (statTxAmount) statTxAmount.innerText = totalVol.toLocaleString('id-ID') + ' L';
    if (statCount) statCount.innerText = rows.length.toLocaleString('id-ID');

    // Kalkulasi Tangki Real-time
    const totalReceipt = rows.filter(r => r.receipt_issued === 'RECEIPT').reduce((a, c) => a + (parseFloat(c.fuel_amount) || 0), 0);
    const totalIssued = rows.filter(r => r.receipt_issued === 'ISSUED').reduce((a, c) => a + (parseFloat(c.fuel_amount) || 0), 0);
    const remainingStock = Math.max(0, totalReceipt - totalIssued);

    const tankPerc = totalReceipt > 0 ? Math.min(Math.max((remainingStock / totalReceipt) * 100, 5), 100) : 20;
    const tankFluid = document.getElementById('tankFluid');
    const tankVolume = document.getElementById('tankVolume');
    if (tankFluid) tankFluid.style.height = tankPerc + '%';
    if (tankVolume) tankVolume.innerText = remainingStock.toLocaleString('id-ID') + ' L';

    // Material Dominan
    let dominantMatText = "-";
    let maxMatVol = 0;
    for (const [mat, vol] of Object.entries(materialMap)) {
        if (vol > maxMatVol) {
            maxMatVol = vol;
            dominantMatText = `${mat} (${vol.toLocaleString('id-ID')} L)`;
        }
    }
    const dominantMaterial = document.getElementById('dominantMaterial');
    if (dominantMaterial) dominantMaterial.innerText = dominantMatText;

    // Top 3 Consuming Unit
    const sortedUnits = Object.entries(unitMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topUnitsContainer = document.getElementById('topUnitsContainer');
    if (topUnitsContainer) {
        topUnitsContainer.innerHTML = "";
        if (sortedUnits.length === 0) {
            topUnitsContainer.innerHTML = `<div class="col-span-3 bg-slate-50 p-2.5 rounded border border-slate-100 text-center text-xs text-slate-400">Belum ada data unit terpakai (Issued) pada filter ini.</div>`;
        } else {
            sortedUnits.forEach(([unit, vol], index) => {
                const card = document.createElement('div');
                card.className = "bg-slate-50 p-3 rounded border border-slate-200 flex flex-col justify-between shadow-xs";
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-800">${unit}</span>
                        <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">${index+1}</span>
                    </div>
                    <p class="text-sm font-extrabold mt-2 font-mono text-slate-900">${vol.toLocaleString('id-ID')} <span class="text-[10px] font-normal text-slate-500">Liter</span></p>
                `;
                topUnitsContainer.appendChild(card);
            });
        }
    }

    // PIC Teraktif
    let topPic = "-";
    let maxPicCount = 0;
    for (const [pic, count] of Object.entries(picMap)) {
        if (count > maxPicCount) {
            maxPicCount = count;
            topPic = pic;
        }
    }
    const topPicName = document.getElementById('topPicName');
    const topPicCount = document.getElementById('topPicCount');
    if (topPicName) topPicName.innerText = topPic;
    if (topPicCount) topPicCount.innerText = maxPicCount + ' Input';
}

function renderTable(rows) {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="14" class="p-8 text-center text-slate-400">Tidak ada data transaksi ditemukan.</td></tr>`;
        return;
    }

    rows.forEach(row => {
        const dateStr = row.created_at ? new Date(row.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/80 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="p-3 font-mono text-[11px] text-slate-500">${dateStr}</td>
            <td class="p-3 font-semibold text-slate-900">${row.site_name || '-'}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-medium ${row.shift === 'Day' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}">${row.shift || '-'}</span></td>
            <td class="p-3 text-slate-600">${row.fuel_storage || '-'}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${row.receipt_issued === 'ISSUED' ? 'bg-red-50 text-red-600 border border-red-200' : row.receipt_issued === 'TRANSFER' ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}">${row.receipt_issued || '-'}</span></td>
            <td class="p-3 font-mono font-bold text-slate-900">${row.no_unit || '-'}</td>
            <td class="p-3 text-slate-500 italic">${row.keterangan_unit || '-'}</td>
            <td class="p-3 font-medium text-slate-700">${row.material_type || '-'}</td>
            <td class="p-3 font-extrabold text-slate-900 font-mono">${row.fuel_amount ? row.fuel_amount.toLocaleString('id-ID') + ' L' : '0 L'}</td>
            <td class="p-3 font-mono text-slate-600">${row.hm_fuel_truck || '-'}</td>
            <td class="p-3 font-mono text-slate-500">${row.no_voucher || '-'}</td>
            <td class="p-3 font-medium text-slate-800">${row.pic_name || '-'}</td>
            <td class="p-3 text-center">
                <button onclick="openModal('${row.evidence_hm_url || ''}', '${row.evidence_liter_url || ''}')" class="px-2.5 py-1 text-[11px] font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded shadow-xs transition">View Photo</button>
            </td>
            <td class="p-3 text-center">
                <button onclick="openEditModal('${row.id}')" class="px-3 py-1 text-[11px] font-medium text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 rounded shadow-xs transition">Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openModal(hmUrl, literUrl) {
    const imgHm = document.getElementById('modalImgHm');
    const noHm = document.getElementById('noImgHm');
    if (hmUrl && hmUrl !== 'null' && hmUrl !== 'undefined') {
        imgHm.src = hmUrl;
        imgHm.classList.remove('hidden');
        noHm.classList.add('hidden');
    } else {
        imgHm.classList.add('hidden');
        noHm.classList.remove('hidden');
    }

    const imgLiter = document.getElementById('modalImgLiter');
    const noLiter = document.getElementById('noImgLiter');
    if (literUrl && literUrl !== 'null' && literUrl !== 'undefined') {
        imgLiter.src = literUrl;
        imgLiter.classList.remove('hidden');
        noLiter.classList.add('hidden');
    } else {
        imgLiter.classList.add('hidden');
        noLiter.classList.remove('hidden');
    }

    document.getElementById('imageModal').classList.remove('hidden');
    document.getElementById('imageModal').classList.add('flex');
}

function closeModal() {
    document.getElementById('imageModal').classList.add('hidden');
    document.getElementById('imageModal').classList.remove('flex');
}

function openEditModal(id) {
    const log = cachedFilteredDataForExcel.find(item => item.id == id);
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

    const { error } = await supabaseClient.from('fuel_logs').update(updatedData).eq('id', id);

    if (error) {
        alert("Gagal memperbarui data: " + error.message);
        return;
    }

    alert("Data berhasil diperbarui!");
    closeEditModal();
    loadDashboardData();
}

function updatePaginationInfo(limit) {
    const start = totalRows === 0 ? 0 : (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalRows);
    document.getElementById('paginationInfo').innerText = `Menampilkan ${start} - ${end} dari ${totalRows} data`;
    document.getElementById('pageIndicator').innerText = currentPage;

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = end >= totalRows;
}

function nextPage() { currentPage++; loadDashboardData(); }
function prevPage() { if (currentPage > 1) { currentPage--; loadDashboardData(); } }
function resetDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    currentPage = 1;
    loadDashboardData();
}

function exportToExcel() {
    if (cachedFilteredDataForExcel.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    const excelData = cachedFilteredDataForExcel.map((log, index) => {
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

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Fuel Logs");

    const siteFilter = document.getElementById('filterSite').value;
    XLSX.writeFile(wb, `Fuel_Monitoring_Report_${siteFilter}.xlsx`);
}
