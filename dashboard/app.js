/**
 * Retail Velocity & Assortment Command Center Logic
 * Single Source of Truth Analytics Engine
 */

let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 50;
let sortColumn = 'net_sales';
let sortAscending = false;

let velocityChartInstance = null;
let deadStockChartInstance = null;

// Total catalog constants for baseline share calculation
const TOTAL_CATALOG_SALES = 7712364.96;
const TOTAL_CATALOG_ROWS = 8843;

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupThemeToggle();
  setupFilterListeners();
  setupTableSortListeners();
  setupPaginationListeners();
  setupExportListener();
  await loadDataset();
});

// 1. Data Ingestion
async function loadDataset() {
  try {
    const csvUrl = 'item_velocity.csv';
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to load ${csvUrl}: HTTP ${response.status}`);
    }
    const csvText = await response.text();

    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function(results) {
        allData = results.data.map(row => ({
          item_name: String(row.item_name || '').trim(),
          location: String(row.location || '').trim(),
          parent_category: String(row.parent_category || '').trim(),
          category: String(row.category || '').trim(),
          vendor: String(row.vendor || '').trim(),
          quantity_sold: Number(row.quantity_sold) || 0,
          net_sales: Number(row.net_sales) || 0,
          gross_sales: Number(row.gross_sales) || 0,
          total_cogs: Number(row.total_cogs) || 0,
          margin_dollars: Number(row.margin_dollars) || 0,
          margin_pct: row.margin_pct !== null && row.margin_pct !== undefined ? Number(row.margin_pct) : null,
          percentile: Number(row.percentile) || 0,
          tier: String(row.tier || 'Slow Mover').trim()
        }));

        populateFilterOptions();
        applyFilters();
      }
    });
  } catch (error) {
    console.error("Error loading CSV dataset:", error);
    document.getElementById('table-body').innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: var(--accent-red); padding: 40px;">
          ⚠️ Error loading <code>item_velocity.csv</code>. If opening as a local file, please serve via <code>python -m http.server</code> or check path.
        </td>
      </tr>
    `;
  }
}

// 2. Filter Population
function populateFilterOptions() {
  const locations = [...new Set(allData.map(d => d.location))].sort();
  const parentCategories = [...new Set(allData.map(d => d.parent_category))].sort();
  const vendors = [...new Set(allData.map(d => d.vendor))].sort();

  const locSelect = document.getElementById('filter-location');
  const catSelect = document.getElementById('filter-parent-category');
  const vendorSelect = document.getElementById('filter-vendor');

  locations.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = `Location ${loc}`;
    locSelect.appendChild(opt);
  });

  parentCategories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });

  vendors.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    vendorSelect.appendChild(opt);
  });
}

// 3. Filter Application & State Management
function setupFilterListeners() {
  ['filter-location', 'filter-parent-category', 'filter-vendor', 'filter-tier'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      currentPage = 1;
      applyFilters();
    });
  });

  const searchInput = document.getElementById('search-item');
  searchInput.addEventListener('input', debounce(() => {
    currentPage = 1;
    applyFilters();
  }, 200));

  document.getElementById('reset-filters-btn').addEventListener('click', resetFilters);
}

function resetFilters() {
  document.getElementById('filter-location').value = 'ALL';
  document.getElementById('filter-parent-category').value = 'ALL';
  document.getElementById('filter-vendor').value = 'ALL';
  document.getElementById('filter-tier').value = 'ALL';
  document.getElementById('search-item').value = '';
  currentPage = 1;
  applyFilters();
}

function applyFilters() {
  const selectedLoc = document.getElementById('filter-location').value;
  const selectedCat = document.getElementById('filter-parent-category').value;
  const selectedVendor = document.getElementById('filter-vendor').value;
  const selectedTier = document.getElementById('filter-tier').value;
  const searchQuery = document.getElementById('search-item').value.toLowerCase().trim();

  filteredData = allData.filter(item => {
    if (selectedLoc !== 'ALL' && item.location !== selectedLoc) return false;
    if (selectedCat !== 'ALL' && item.parent_category !== selectedCat) return false;
    if (selectedVendor !== 'ALL' && item.vendor !== selectedVendor) return false;
    if (selectedTier !== 'ALL' && item.tier !== selectedTier) return false;
    if (searchQuery && !item.item_name.toLowerCase().includes(searchQuery) && !item.category.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  updateActiveFilterBadge(selectedLoc, selectedCat, selectedVendor, selectedTier, searchQuery);
  updateKPIs();
  updateCharts();
  updateMoversLists();
  sortAndRenderTable();
}

function updateActiveFilterBadge(loc, cat, ven, tier, q) {
  let active = [];
  if (loc !== 'ALL') active.push(`Loc: ${loc}`);
  if (cat !== 'ALL') active.push(`Cat: ${cat}`);
  if (ven !== 'ALL') active.push(`Vendor: ${ven}`);
  if (tier !== 'ALL') active.push(`Tier: ${tier}`);
  if (q) active.push(`Search: "${q}"`);

  const tag = document.getElementById('active-filter-count');
  if (active.length === 0) {
    tag.textContent = 'All Dimensions Active (Unfiltered)';
    tag.style.color = 'var(--text-secondary)';
  } else {
    tag.textContent = `${active.length} Filter(s) Applied: ${active.join(' | ')}`;
    tag.style.color = 'var(--accent-blue)';
  }
}

// 4. Update KPI Cards
function updateKPIs() {
  const totalSales = filteredData.reduce((sum, d) => sum + d.net_sales, 0);
  const totalCOGS = filteredData.reduce((sum, d) => sum + d.total_cogs, 0);
  const totalMarginDollars = filteredData.reduce((sum, d) => sum + d.margin_dollars, 0);
  const totalQty = filteredData.reduce((sum, d) => sum + d.quantity_sold, 0);
  const skuCount = filteredData.length;

  const deadStockItems = filteredData.filter(d => d.tier === 'Dead Stock');
  const deadCount = deadStockItems.length;
  const deadCOGS = deadStockItems.reduce((sum, d) => sum + Math.max(d.total_cogs, 0), 0);

  const marginRate = totalSales > 0 ? (totalMarginDollars / totalSales) * 100 : 0;
  const salesShare = (totalSales / TOTAL_CATALOG_SALES) * 100;

  document.getElementById('val-net-sales').textContent = formatCurrency(totalSales);
  document.getElementById('val-sales-share').textContent = `${salesShare.toFixed(1)}% of Total Catalog Sales`;

  document.getElementById('val-margin-dollars').textContent = formatCurrency(totalMarginDollars);
  document.getElementById('val-margin-pct').textContent = `${marginRate.toFixed(2)}% Margin Rate`;

  document.getElementById('val-qty-sold').textContent = totalQty.toLocaleString();
  document.getElementById('val-sku-count').textContent = `${skuCount.toLocaleString()} Product Rows Filtered`;

  document.getElementById('val-dead-count').textContent = `${deadCount.toLocaleString()} SKUs`;
  document.getElementById('val-dead-cogs').textContent = `${formatCurrency(deadCOGS)} Trapped COGS`;
}

// 5. Update Charts
function updateCharts() {
  const isLight = document.body.classList.contains('light-mode');
  const textColor = isLight ? '#1f2937' : '#9ca3af';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';

  // Chart 1: Velocity Tier Profile
  const tierOrder = ['Fast Mover', 'Medium Mover', 'Slow Mover', 'Dead Stock'];
  const tierCounts = tierOrder.map(t => filteredData.filter(d => d.tier === t).length);
  const tierSales = tierOrder.map(t => filteredData.filter(d => d.tier === t).reduce((sum, d) => sum + d.net_sales, 0));

  const ctx1 = document.getElementById('velocityTierChart').getContext('2d');
  if (velocityChartInstance) velocityChartInstance.destroy();

  velocityChartInstance = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: tierOrder,
      datasets: [
        {
          label: 'SKU Count',
          data: tierCounts,
          backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)'],
          borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
          borderWidth: 1.5,
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Net Sales ($)',
          data: tierSales,
          type: 'line',
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 4,
          borderWidth: 2.5,
          tension: 0.2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: textColor, font: { family: 'Inter', size: 11, weight: 'bold' } } },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              if (ctx.datasetIndex === 0) return `SKUs: ${ctx.parsed.y.toLocaleString()}`;
              return `Net Sales: ${formatCurrency(ctx.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { display: false } },
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'SKU Count', color: textColor, font: { size: 10 } },
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Net Sales ($)', color: textColor, font: { size: 10 } },
          ticks: {
            color: textColor,
            callback: v => `$${(v/1000).toFixed(0)}k`
          },
          grid: { display: false }
        }
      }
    }
  });

  // Chart 2: Dead Stock $ Exposure by Category
  const deadStockByCat = {};
  filteredData.filter(d => d.tier === 'Dead Stock').forEach(d => {
    deadStockByCat[d.parent_category] = (deadStockByCat[d.parent_category] || 0) + Math.max(d.total_cogs, 0);
  });

  const sortedDeadCats = Object.entries(deadStockByCat).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const deadCatLabels = sortedDeadCats.map(e => e[0]);
  const deadCatValues = sortedDeadCats.map(e => e[1]);

  const ctx2 = document.getElementById('deadStockCategoryChart').getContext('2d');
  if (deadStockChartInstance) deadStockChartInstance.destroy();

  deadStockChartInstance = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: deadCatLabels.length ? deadCatLabels : ['No Dead Stock in Selection'],
      datasets: [{
        label: 'Trapped COGS ($)',
        data: deadCatValues.length ? deadCatValues : [0],
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderColor: '#ef4444',
        borderWidth: 1.5,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Trapped Capital: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: { ticks: { color: textColor, font: { size: 10, weight: 'bold' } }, grid: { display: false } },
        y: {
          ticks: {
            color: textColor,
            callback: v => `$${v.toLocaleString()}`
          },
          grid: { color: gridColor }
        }
      }
    }
  });
}

// 6. Update Top & Bottom Movers Lists
function updateMoversLists() {
  const topMovers = [...filteredData]
    .filter(d => d.tier === 'Fast Mover')
    .sort((a, b) => b.net_sales - a.net_sales)
    .slice(0, 5);

  const topDeadCapital = [...filteredData]
    .filter(d => d.tier === 'Dead Stock')
    .sort((a, b) => b.total_cogs - a.total_cogs)
    .slice(0, 5);

  const topContainer = document.getElementById('top-movers-list');
  const bottomContainer = document.getElementById('bottom-movers-list');

  topContainer.innerHTML = topMovers.length ? topMovers.map(d => `
    <div class="mover-item">
      <div class="mover-left">
        <span class="mover-name">${escapeHtml(d.item_name)}</span>
        <span class="mover-meta">${escapeHtml(d.parent_category)} • Loc ${d.location} • ${escapeHtml(d.vendor)}</span>
      </div>
      <div class="mover-right">
        <span class="mover-val" style="color: var(--accent-green);">${formatCurrency(d.net_sales)}</span>
        <span class="mover-badge">${d.quantity_sold.toLocaleString()} units • ${(d.margin_pct ? (d.margin_pct*100).toFixed(1) : 0)}% margin</span>
      </div>
    </div>
  `).join('') : '<p style="color: var(--text-muted); font-size: 12px; padding: 10px;">No Fast Movers in current filter.</p>';

  bottomContainer.innerHTML = topDeadCapital.length ? topDeadCapital.map(d => `
    <div class="mover-item">
      <div class="mover-left">
        <span class="mover-name">${escapeHtml(d.item_name)}</span>
        <span class="mover-meta">${escapeHtml(d.parent_category)} • Loc ${d.location} • ${escapeHtml(d.vendor)}</span>
      </div>
      <div class="mover-right">
        <span class="mover-val" style="color: var(--accent-red);">${formatCurrency(d.total_cogs)} COGS</span>
        <span class="mover-badge">${d.quantity_sold} sold • ${formatCurrency(d.net_sales)} sales</span>
      </div>
    </div>
  `).join('') : '<p style="color: var(--text-muted); font-size: 12px; padding: 10px;">No Dead Stock in current filter.</p>';
}

// 7. Table Sorting & Rendering
function setupTableSortListeners() {
  document.querySelectorAll('.data-table th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (sortColumn === col) {
        sortAscending = !sortAscending;
      } else {
        sortColumn = col;
        sortAscending = col === 'item_name' || col === 'parent_category' || col === 'vendor';
      }
      sortAndRenderTable();
    });
  });
}

function sortAndRenderTable() {
  filteredData.sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    if (valA === null || valA === undefined) valA = sortAscending ? Infinity : -Infinity;
    if (valB === null || valB === undefined) valB = sortAscending ? Infinity : -Infinity;

    if (typeof valA === 'string') {
      return sortAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAscending ? valA - valB : valB - valA;
  });

  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  const totalRecords = filteredData.length;
  document.getElementById('table-row-count').textContent = `Showing ${totalRecords.toLocaleString()} records`;

  const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * rowsPerPage;
  const pageRows = filteredData.slice(startIdx, startIdx + rowsPerPage);

  if (pageRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 30px;">No records match the current filters.</td></tr>`;
  } else {
    tbody.innerHTML = pageRows.map(row => {
      const tierClass = getTierBadgeClass(row.tier);
      const marginFormatted = row.margin_pct !== null && !isNaN(row.margin_pct) ? `${(row.margin_pct * 100).toFixed(1)}%` : 'N/A';
      const marginColor = row.margin_pct !== null && row.margin_pct < 0 ? 'color: var(--accent-red); font-weight: bold;' : '';

      return `
        <tr>
          <td><strong>${escapeHtml(row.item_name)}</strong></td>
          <td>${escapeHtml(row.location)}</td>
          <td>${escapeHtml(row.parent_category)}</td>
          <td>${escapeHtml(row.vendor)}</td>
          <td class="text-right">${row.quantity_sold.toLocaleString()}</td>
          <td class="text-right"><strong>${formatCurrency(row.net_sales)}</strong></td>
          <td class="text-right">${formatCurrency(row.total_cogs)}</td>
          <td class="text-right" style="${marginColor}">${marginFormatted}</td>
          <td class="text-right">${(row.percentile * 100).toFixed(0)}th</td>
          <td class="text-center"><span class="tier-badge ${tierClass}">${escapeHtml(row.tier)}</span></td>
        </tr>
      `;
    }).join('');
  }

  // Update pagination indicators
  document.getElementById('pagination-info').textContent = `Page ${currentPage} of ${totalPages} (${totalRecords.toLocaleString()} items)`;
  document.getElementById('current-page-badge').textContent = currentPage;
  document.getElementById('btn-prev').disabled = currentPage === 1;
  document.getElementById('btn-first').disabled = currentPage === 1;
  document.getElementById('btn-next').disabled = currentPage === totalPages;
  document.getElementById('btn-last').disabled = currentPage === totalPages;
}

function getTierBadgeClass(tier) {
  switch (tier) {
    case 'Fast Mover': return 'tier-fast';
    case 'Medium Mover': return 'tier-medium';
    case 'Slow Mover': return 'tier-slow';
    case 'Dead Stock': return 'tier-dead';
    default: return 'tier-slow';
  }
}

// 8. Pagination Controls
function setupPaginationListeners() {
  document.getElementById('btn-first').addEventListener('click', () => { currentPage = 1; renderTable(); });
  document.getElementById('btn-prev').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
  document.getElementById('btn-next').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (currentPage < totalPages) { currentPage++; renderTable(); }
  });
  document.getElementById('btn-last').addEventListener('click', () => {
    currentPage = Math.ceil(filteredData.length / rowsPerPage);
    renderTable();
  });
}

// 9. Export CSV
function setupExportListener() {
  document.getElementById('export-csv-btn').addEventListener('click', () => {
    if (!filteredData.length) return alert('No data to export.');
    const csvContent = Papa.unparse(filteredData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered_item_velocity_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// 10. Utilities & Theme Toggle
function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    toggleBtn.textContent = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
    updateCharts();
  });
}

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return '$0.00';
  const prefix = val < 0 ? '-$' : '$';
  return prefix + Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
