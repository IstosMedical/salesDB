(function enforceSession() {
  const SESSION_KEY = "istos-auth";
  const LAST_ACTIVE_KEY = "istos-last-active";
  const MAX_IDLE_TIME = 15 * 60 * 1000; // 15 minutes

  const isLoggedIn = sessionStorage.getItem(SESSION_KEY) === "true";
  const lastActive = parseInt(sessionStorage.getItem(LAST_ACTIVE_KEY), 10);
  const now = Date.now();

  const isSessionExpired = !lastActive || (now - lastActive > MAX_IDLE_TIME);

  if (!isLoggedIn || isSessionExpired) {
    showToast("Session expired. Please log in again.");
    sessionStorage.clear();
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000); // show toast for 2 seconds before redirect
  } else {
    sessionStorage.setItem(LAST_ACTIVE_KEY, now); // refresh activity
  }
})();

const username = sessionStorage.getItem("istos-user");
if (username) {
  document.getElementById("usernameDisplay").textContent = username.charAt(0).toUpperCase() + username.slice(1);
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.clear();
  showToast("You’ve been logged out.");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1500);
});


// Step 1: Global Setup and Error Handling

let crmData = [];
let crmDataFiltered = [];
let selectedYear = "";

function showLoadError() {
  const table = document.getElementById("crmTable");
  if (table) {
    table.innerHTML = "<tr><td colspan='8'>Unable to load data</td></tr>";
  }
}

window.addEventListener("error", e => {
  console.error("Global JS error:", e.message);
});

// Step 2: Excel Serial Date Conversion

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return "—";
  const baseDate = new Date(1900, 0, 1);
  baseDate.setDate(baseDate.getDate() + (serial - 1));
  const dd = String(baseDate.getDate()).padStart(2, '0');
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const yy = String(baseDate.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

// Render Table Rows

function renderTable(data) {
  const tableBody = document.querySelector("#crmTable tbody");
  tableBody.innerHTML = "";

  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row["Customer Name"]}</td>
      <td>${row.City}</td>
      <td>${row.Instrument}</td>
      <td>${row.Model}</td>
      <td>${row.Make}</td>
      <td>${row.DOI}</td>
      <td>${row.Warranty}</td>
    `;
    tableBody.appendChild(tr);
  });
}


// Update Summary Cards

function updateSummary(data) {
  const instruments = new Set(data.map(d => d.D).filter(Boolean));
  const customers = new Set(data.map(d => d.B).filter(Boolean));
  const missingDOI = data.filter(d => d.G === "missing").length;
animateCounter("cardMissingDOI", missingDOI);

  const quotations = data.length;

  animateCounter("cardQuotations", quotations);
  animateCounter("cardCustomers", customers.size);
  animateCounter("cardMaharashtra", data.filter(d => d.C?.toLowerCase().includes("maharashtra")).length);
  animateCounter("cardKarnataka", data.filter(d => d.C?.toLowerCase().includes("karnataka")).length);
}

// Animate Counters

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;

  let count = 0;
  const step = Math.ceil(target / 30);
  const interval = setInterval(() => {
    count += step;
    if (count >= target) {
      count = target;
      clearInterval(interval);
    }
    el.textContent = count;
  }, 30);
}

// Populate Instrument Dropdown

function populateInstrumentDropdown(data) {
  const dropdown = document.getElementById("instrumentDropdown");
  if (!dropdown) return;

  const instruments = [...new Set(data.map(row => row.D).filter(Boolean))].sort();
  instruments.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    dropdown.appendChild(option);
  });
}

// Dropdown Listener

function setupDropdownListener(data) {
  const dropdown = document.getElementById("instrumentDropdown");
  const display = document.getElementById("instrumentCount");
  if (!dropdown || !display) return;

  const totalQuotations = data.length; // preserve original count

  dropdown.addEventListener("change", e => {
    const selected = e.target.value;
    const filtered = data.filter(row => row.D?.trim().toLowerCase() === selected.toLowerCase());

    if (selected) {
      renderTable(filtered);
      updateFilteredSummary(filtered, totalQuotations);
      display.textContent = `🔢 Total Installations: ${filtered.length}`;
    } else {
      renderTable(data);
      updateSummary(data);
      display.textContent = "***";
    }
  });
}

// This is defined to support - specific year logic

function filterByYear(data) {
  if (!selectedYear) return data;

  return data.filter(row => {
    const doi = row.G;

    if (selectedYear === "-") {
      return !doi || doi === "-";
    }

    if (!doi || doi === "-") return false;

    let date;
    if (!isNaN(doi)) {
      const baseDate = new Date(1900, 0, 1);
      baseDate.setDate(baseDate.getDate() + (doi - 1));
      date = baseDate;
    } else if (doi.includes("/")) {
      const [dd, mm, yyyy] = doi.split("/");
      date = new Date(`${yyyy}-${mm}-${dd}`);
    }

    return date && date.getFullYear() === Number(selectedYear);
  });
}


// Year Filter

function setupYearFilter(data) {
  const dropdown = document.getElementById("yearDropdown");
  if (!dropdown) return;

  dropdown.addEventListener("change", e => {
    selectedYear = e.target.value; // ✅ update global year

    if (!selectedYear) {
      crmDataFiltered = data;      // ✅ reset filtered data
      renderTable(data);
      return;
    }

    const filtered = filterByYear(data); // ✅ reuse logic
    crmDataFiltered = filtered;          // ✅ update global filtered data
    renderTable(filtered);
  });
}


// Sort of columns with indicators

let currentSortColumn = "Customer Name";
let currentSortOrder = "asc";

function sortCRMData(data, columnKey, order = "asc") {
  return [...data].sort((a, b) => {
    const valA = (a[columnKey] || "").toString().toLowerCase();
    const valB = (b[columnKey] || "").toString().toLowerCase();
    if (valA < valB) return order === "asc" ? -1 : 1;
    if (valA > valB) return order === "asc" ? 1 : -1;
    return 0;
  });
}

function updateSortIndicators(headers, activeIndex) {
  headers.forEach((th, i) => {
    th.textContent = th.textContent.replace(/ ▲| ▼/g, "");
    if (i === activeIndex) {
      th.textContent += currentSortOrder === "asc" ? " ▲" : " ▼";
    }
  });
}

function setupColumnSort() {
  const headers = document.querySelectorAll("#crmTable thead th");
  const columnMap = [
    "#", "Customer Name", "City", "Instrument",
    "Model", "Make", "DOI", "Warranty"
  ];

  headers.forEach((th, index) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      const clickedKey = columnMap[index];

      if (currentSortColumn === clickedKey) {
        currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
      } else {
        currentSortColumn = clickedKey;
        currentSortOrder = "asc";
      }

      const sorted = sortCRMData(crmData, currentSortColumn, currentSortOrder);
      renderTable(sorted);
      updateSortIndicators(headers, index);
    });
  });
}

async function fetchCRMData() {
  const url = "https://istosmedical.github.io/salesDB/sales.json";

  try {
    const response = await fetch(url);
    const json = await response.json();
    const rawData = json.sales || json;

    if (!Array.isArray(rawData) || rawData.length < 2) {
      showLoadError();
      return;
    }

    crmData = rawData.slice(1);

    const sortedData = sortCRMData(crmData, currentSortColumn, currentSortOrder);
    renderTable(sortedData);
    setupColumnSort();

    updateSummary(crmData);
    populateInstrumentDropdown(crmData);
    setupDropdownListener(crmData);
    setupYearFilter(crmData);
    populateModelDropdown(crmData);

    const modelDropdown = document.getElementById("modelDropdown");
    if (modelDropdown) {
      modelDropdown.addEventListener("change", e => {
        const selectedModel = e.target.value;
        if (selectedModel) {
          updateModelYearTable(crmData, selectedModel);
        }
      });
    }

  } catch (error) {
    console.error("❌ Failed to fetch CRM data:", error);
    showLoadError();
  }
}

window.addEventListener("DOMContentLoaded", fetchCRMData);

    

// First card always show full count

function updateFilteredSummary(filteredData, totalQuotations) {
  animateCounter("cardQuotations", totalQuotations); // always show full count
  animateCounter("cardCustomers", new Set(filteredData.map(d => d.B).filter(Boolean)).size);
  animateCounter("cardMaharashtra", filteredData.filter(d => d.C?.toLowerCase().includes("maharashtra")).length);
  animateCounter("cardKarnataka", filteredData.filter(d => d.C?.toLowerCase().includes("karnataka")).length);
}

// To tackle missing 

fetch('sales.json')
  .then(response => response.json())
  .then(data => {
    const sales = data.sales;

    sales.forEach(record => {
      // Place it here 👇
      const doi = record.G === "missing" ? "Missing" : record.G;
      const warranty = record.H === "missing" ? "Missing" : record.H;

      // Now use `doi` and `warranty` to render your table or summary
      // Example:
      const row = `
        <tr>
          <td>${record.B}</td>
          <td>${record.D}</td>
          <td>${doi}</td>
          <td>${warranty}</td>
        </tr>
      `;
      document.querySelector("#sales-table").innerHTML += row;
    });
  });


// Filter by year

function setupYearFilter(data) {
  const dropdown = document.getElementById("yearDropdown");
  if (!dropdown) return;

  dropdown.addEventListener("change", e => {
    const selectedYear = Number(e.target.value);
    if (!selectedYear) {
      renderTable(data);
      updateSummary(data);
      return;
    }

    const filtered = data.filter(row => {
      const doi = row.G;
      if (!doi) return false;

      let year;

      if (!isNaN(doi)) {
        // Excel serial date
        const baseDate = new Date(1900, 0, 1);
        baseDate.setDate(baseDate.getDate() + (doi - 1));
        year = baseDate.getFullYear();
      } else if (doi.includes("/")) {
        const parts = doi.split("/");
        if (parts.length === 3) {
          let [dd, mm, yy] = parts;
          yy = yy.length === 2 ? `20${yy}` : yy; // assume 20xx for 2-digit years
          const parsed = new Date(`${yy}-${mm}-${dd}`);
          year = parsed.getFullYear();
        }
      }

      return year === selectedYear;
    });

    renderTable(filtered);
    updateSummary(filtered);
  });
}


// ✅ XLSX Export (requires SheetJS)

function exportToXLSX(data) {
  const filtered = filterByYear(data);
  if (!filtered || filtered.length === 0) {
    showToast("⚠️ No data available to export.");
    return;
  }

  const sheetData = [["#", "Customer Name", "Instrument", "Model"]];
  filtered.forEach((row, index) => {
    sheetData.push([
      index + 1,
      row.B || "",
      row.D || "",
      row.E || ""
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = [
    { wch: 4 },
    { wch: 70 },
    { wch: 48 },
    { wch: 20 }
  ];

  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  };

  ["A1", "B1", "C1", "D1"].forEach(cell => {
    if (worksheet[cell]) worksheet[cell].s = headerStyle;
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ISTOS Data");
  XLSX.writeFile(workbook, "ISTOS_Equipments.xlsx");

  showToast("✅ Excel downloaded for selected year!");
}


// ✅ Toast Notification
function showToast(message = "Download complete!") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ✅ Attach listeners after DOM is ready

window.addEventListener("DOMContentLoaded", () => {
  const csvBtn = document.getElementById("exportCSV");
  const xlsxBtn = document.getElementById("exportXLSX");

  const getExportData = () => {
    const source = crmDataFiltered.length ? crmDataFiltered : crmData;
    return filterByYear(source);
  };

  if (csvBtn) {
    csvBtn.addEventListener("click", () => {
      const filtered = getExportData();
      exportToCSV(filtered);
    });
  }

  if (xlsxBtn) {
    xlsxBtn.addEventListener("click", () => {
      const filtered = getExportData();
      exportToXLSX(filtered);
    });
  }
});

// Show/Hide Badge Based on Selection

function setupYearFilter(data) {
  const dropdown = document.getElementById("yearDropdown");
  const badge = document.getElementById("missingBadge");
  if (!dropdown || !badge) return;

  dropdown.addEventListener("change", e => {
    selectedYear = e.target.value;

    if (selectedYear === "-") {
      badge.style.display = "block";
    } else {
      badge.style.display = "none";
    }

    const filtered = filterByYear(data);
    crmDataFiltered = filtered;
    renderTable(filtered);
  });
}


// Model-Year table

function populateModelDropdown(data) {
  const dropdown = document.getElementById("modelDropdown");
  if (!dropdown) return;

  const models = [...new Set(data.map(row => row.E).filter(Boolean))].sort();
  models.forEach(model => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    dropdown.appendChild(option);
  });
}

populateModelDropdown(crmData);

document.getElementById("modelDropdown").addEventListener("change", e => {
  const selectedModel = e.target.value;
  if (selectedModel) {
    updateModelYearTable(crmData, selectedModel);
  }
});

function updateModelYearTable(data, selectedModel) {
  const row = document.getElementById("modelYearRow");
  if (!row) return;

  const yearCounts = {};
  for (let y = 2016; y <= 2025; y++) yearCounts[y] = 0;

  data.forEach(row => {
    if (row.E?.trim().toLowerCase() === selectedModel.toLowerCase()) {
      const doi = row.G;
      let year;
      if (!isNaN(doi)) {
        const baseDate = new Date(1900, 0, 1);
        baseDate.setDate(baseDate.getDate() + (doi - 1));
        year = baseDate.getFullYear();
      } else if (doi?.includes("/")) {
        const parts = doi.split("/");
        if (parts.length === 3) {
          let yy = parts[2];
          year = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
        }
      }
      if (year && yearCounts[year] !== undefined) yearCounts[year]++;
    }
  });

  row.innerHTML =
    `<td><img src="istos-logo.png" alt="ISTOS Logo" class="istos-logo-tiny" /></td>` +
    Object.values(yearCounts).map(c => `<td>${c}</td>`).join("");
}
