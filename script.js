// Step 1: Global Setup and Error Handling

let crmData = [];

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
  const tbody = document.querySelector("#crmTable tbody");
  if (!tbody || !Array.isArray(data)) return;

  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.A}</td>
      <td>${row.B}</td>
      <td>${row.C}</td>
      <td>${row.D}</td>
      <td>${row.E}</td>
      <td>${row.F}</td>
      <td>${row.G ? excelSerialToDate(row.G) : "—"}</td>
      <td>${row.H ? excelSerialToDate(row.H) : "—"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Update Summary Cards

function updateSummary(data) {
  const instruments = new Set(data.map(d => d.D).filter(Boolean));
  const customers = new Set(data.map(d => d.B).filter(Boolean));
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

// Year Filter

function setupYearFilter(data) {
  const dropdown = document.getElementById("yearDropdown");
  if (!dropdown) return;

  dropdown.addEventListener("change", e => {
    const selectedYear = e.target.value;
    if (!selectedYear) {
      renderTable(data);
      updateSummary(data);
      return;
    }

    const filtered = data.filter(row => {
      const doi = row.G;
      if (!doi) return false;

      let date;
      if (!isNaN(doi)) {
        const baseDate = new Date(1900, 0, 1);
        baseDate.setDate(baseDate.getDate() + (doi - 1));
        date = baseDate;
      } else if (doi.includes("/")) {
        const [dd, mm, yyyy] = doi.split("/");
        date = new Date(`${yyyy}-${mm}-${dd}`);
      }

      return date.getFullYear() === Number(selectedYear);
    });

    renderTable(filtered);
    updateSummary(filtered);
  });
}

// Fetch and Initialize

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

    crmData = rawData.slice(1); // skip header
    renderTable(crmData);
    updateSummary(crmData);
    populateInstrumentDropdown(crmData);
    setupDropdownListener(crmData);
    setupYearFilter(crmData);

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

// Export to csv or Excel

function exportToCSV(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    alert("No data to export.");
    return;
  }

  let csv = "User's List of ISTOS Equipments\n";
  csv += "#s,Customer Name,Instrument,Model\n";

  data.forEach((row, index) => {
    const serial = index + 1;
    const name = row.B?.replace(/,/g, " ") || "";
    const instrument = row.D?.replace(/,/g, " ") || "";
    const model = row.E?.replace(/,/g, " ") || "";
    csv += `${serial},"${name}","${instrument}","${model}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ISTOS_Equipments.csv";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("✅ CSV downloaded successfully!");
}

function showToast(message = "Download complete!") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
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

updateTopModelsTable(crmData);


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


// Wrap Listener Inside DOM Ready - Extract csv

window.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.getElementById("exportPDF");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", () => {
    exportToCSV(crmDataFiltered || crmData);
  });
});
