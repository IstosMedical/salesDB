// -------------------- Session & User --------------------

(function enforceSession() {
  const SESSION_KEY = "istos-auth";
  const LAST_ACTIVE_KEY = "istos-last-active";
  const MAX_IDLE_TIME = 15 * 60 * 1000;

  const isLoggedIn = sessionStorage.getItem(SESSION_KEY) === "true";
  const lastActive = parseInt(sessionStorage.getItem(LAST_ACTIVE_KEY), 10);
  const now = Date.now();

  if (!isLoggedIn || !lastActive || now - lastActive > MAX_IDLE_TIME) {
    showToast("Session expired. Please log in again.");
    sessionStorage.clear();
    setTimeout(() => (window.location.href = "index.html"), 2000);
  } else {
    sessionStorage.setItem(LAST_ACTIVE_KEY, now);
  }
})();

const username = sessionStorage.getItem("istos-user");
if (username) {
  document.getElementById("usernameDisplay").textContent =
    username.charAt(0).toUpperCase() + username.slice(1);
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  sessionStorage.clear();
  showToast("You’ve been logged out.");
  setTimeout(() => (window.location.href = "index.html"), 1500);
});

// -------------------- Globals --------------------

let crmData = [];
let crmDataFiltered = [];
let selectedYear = "";
let currentSortColumn = "B";
let currentSortOrder = "asc";

// -------------------- Utilities --------------------

function showToast(message = "Done!") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return "—";
  const baseDate = new Date(1900, 0, 1);
  baseDate.setDate(baseDate.getDate() + (serial - 1));
  return baseDate.toLocaleDateString("en-GB");
}

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

// -------------------- Table Rendering --------------------

function renderTable(data) {
  const tbody = document.querySelector("#crmTable tbody");
  if (!tbody || !Array.isArray(data)) return;
  tbody.innerHTML = "";

  data.forEach(row => {
    const doi = row.G === "missing" ? "—" : excelSerialToDate(row.G);
    const warranty = row.H === "missing" ? "—" : excelSerialToDate(row.H);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.A}</td>
      <td>${row.B}</td>
      <td>${row.C}</td>
      <td>${row.D}</td>
      <td>${row.E}</td>
      <td>${row.F}</td>
      <td>${doi}</td>
      <td>${warranty}</td>
    `;
    tbody.appendChild(tr);
  });
}

// -------------------- Sorting --------------------

function sortCRMData(data, columnKey, order = "asc") {
  return [...data].sort((a, b) => {
    const valA = (a[columnKey] || "").toString().toLowerCase();
    const valB = (b[columnKey] || "").toString().toLowerCase();
    return order === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });
}

function setupColumnSort() {
  const headers = document.querySelectorAll("#crmTable thead th");
  const columnMap = ["A", "B", "C", "D", "E", "F", "G", "H"];

  headers.forEach((th, index) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      const clickedKey = columnMap[index];
      currentSortOrder = currentSortColumn === clickedKey && currentSortOrder === "asc" ? "desc" : "asc";
      currentSortColumn = clickedKey;
      const sorted = sortCRMData(crmData, currentSortColumn, currentSortOrder);
      renderTable(sorted);
      updateSortIndicators(headers, index);
    });
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

// -------------------- Summary Cards --------------------

function updateSummary(data) {
  const instruments = new Set(data.map(d => d.D).filter(Boolean));
  const customers = new Set(data.map(d => d.B).filter(Boolean));
  const missingDOI = data.filter(d => d.G === "missing").length;

  animateCounter("cardMissingDOI", missingDOI);
  animateCounter("cardQuotations", data.length);
  animateCounter("cardCustomers", customers.size);
  animateCounter("cardMaharashtra", data.filter(d => d.C?.toLowerCase().includes("maharashtra")).length);
  animateCounter("cardKarnataka", data.filter(d => d.C?.toLowerCase().includes("karnataka")).length);
}

function updateFilteredSummary(filtered, total) {
  animateCounter("cardQuotations", total);
  animateCounter("cardCustomers", new Set(filtered.map(d => d.B).filter(Boolean)).size);
  animateCounter("cardMaharashtra", filtered.filter(d => d.C?.toLowerCase().includes("maharashtra")).length);
  animateCounter("cardKarnataka", filtered.filter(d => d.C?.toLowerCase().includes("karnataka")).length);
}

// -------------------- Filters --------------------

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

function setupDropdownListener(data) {
  const dropdown = document.getElementById("instrumentDropdown");
  const display = document.getElementById("instrumentCount");
  if (!dropdown || !display) return;

  const totalQuotations = data.length;

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

function filterByYear(data) {
  if (!selectedYear) return data;

  return data.filter(row => {
    const doi = row.G;
    if (selectedYear === "-") return !doi || doi === "-";
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

function setupYearFilter(data) {
  const dropdown = document.getElementById("yearDropdown");
  const badge = document.getElementById("missingBadge");
  if (!dropdown) return;

  dropdown.addEventListener("change", e => {
    selectedYear = e.target.value;
    if (badge) badge.style.display = selectedYear === "-" ? "block" : "none";
    const filtered = filterByYear(data);
    crmDataFiltered = filtered;
    renderTable(filtered);
  });
}

// -------------------- Model-Year Breakdown --------------------

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

function updateModelYearTable(data, selectedModel) {
  const row = document.getElementById("modelYearRow");
