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








