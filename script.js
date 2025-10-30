window.addEventListener("error", e => {
  console.error("Global JS error:", e.message);
});


// 🚀 Render Top 3 Instruments as Badges
function renderTopInstruments(data) {
  const badgeContainer = document.getElementById("topInstruments");
  if (!badgeContainer) return;

  badgeContainer.innerHTML = "";

  const countMap = {};
  data.forEach(row => {
    const name = row.D;
    countMap[name] = (countMap[name] || 0) + 1;
  });

  const top3 = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  top3.forEach(([name, count]) => {
    const badge = document.createElement("span");
    badge.className = "top-badge";
    badge.textContent = `${name} (${count})`;
    badgeContainer.appendChild(badge);
  });
}

// 🚀 Animate Count Display
function animateCount(id, target) {
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
    el.textContent = `🔢 Total Installations: ${count}`;
  }, 30);
}

// 🚀 Populate Instrument Dropdown
function populateInstrumentDropdown(data) {
  const dropdown = document.getElementById("instrumentDropdown");
  if (!dropdown) return;

  const instruments = [...new Set(data.map(row => row.D))].sort();
  instruments.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    dropdown.appendChild(option);
  });

  renderTopInstruments(data);
}

// 🚀 Dropdown Listener
function setupDropdownListener(data) {
  const dropdown = document.getElementById("instrumentDropdown");
  const display = document.getElementById("instrumentCount");
  if (!dropdown || !display) return;

  dropdown.addEventListener("change", e => {
    const selected = e.target.value;
    const count = data.filter(row => row.D === selected).length;

    if (selected) {
      animateCount("instrumentCount", count);
    } else {
      display.textContent = "Select an instrument";
    }
  });
}

// 🚀 Group Filter Function
function renderInstrumentGroups(groups) {
  const container = document.getElementById("instrumentGroups");
  if (!container) return;

  container.innerHTML = "";

  Object.entries(groups).forEach(([groupName, instruments]) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "instrument-group";

    const heading = document.createElement("h4");
    heading.textContent = groupName;
    groupDiv.appendChild(heading);

    const tagContainer = document.createElement("div");
    tagContainer.className = "instrument-tags";

    instruments.forEach(name => {
      const tag = document.createElement("button");
      tag.className = "instrument-tag";
      tag.textContent = name;

      tag.addEventListener("click", () => {
        const filtered = crmData.filter(row => row.D.toLowerCase() === name.toLowerCase());
        renderTable(filtered);
        updateSummary(filtered);
        setupExport(filtered);
      });

      tagContainer.appendChild(tag);
    });

    groupDiv.appendChild(tagContainer);
    container.appendChild(groupDiv);
  });
}


// 🚀 date column conversion

function excelSerialToDate(serial) {
  const baseDate = new Date(1900, 0, 1); // Jan 1, 1900
  const offset = serial - 1; // Excel starts at 1
  baseDate.setDate(baseDate.getDate() + offset);
  const dd = String(baseDate.getDate()).padStart(2, '0');
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const yy = String(baseDate.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

// 🚀 Year dropdown filter

let crmData = []; // Global reference

const fullInstrumentList = [ "Auto Slide Stainer", "Cassette Printer", "Coverslipper", "Cryo console", "Cryostat",
  "Cytocentrifuge", "Bone Band Saw", "Dispensing Console", "Formadose",
  "Formaldehydemeter", "Formalin tank", "Grossing Imaging camera (Propath)", "Grossing station",
  "Manual slide stainer", "Microscope", "Microtome Manual","Microtome Semi Automated","Microtome Fully Automated","Procycler Solvent Recyclling System","Programmable Vibrotome","Slide Dryer","Slide Labeller","Slide Scanner","Slide Stainer","Specimen storage cabinet","Tissue Embedding Centre","Tissue Flotation Bath","Tissue processor","Tissue Water Bath","Wax Dispenser","Xylene Pump"
];

const yearDropdown = document.getElementById("yearDropdown");
if (yearDropdown) {
  yearDropdown.addEventListener("change", e => {
    const selectedYear = e.target.value;
    if (!selectedYear) {
      renderTable(crmData);
      updateSummary(crmData);
      setupExport(crmData);
      return;
    }

    const filtered = crmData.filter(row => {
      const doi = row.G;
      if (!doi) return false;

      let date;
      if (!isNaN(doi)) {
        const baseDate = new Date(1900, 0, 1);
        baseDate.setDate(baseDate.getDate() + (doi - 1));
        date = baseDate;
      } else if (doi.includes("/")) {
        const parts = doi.split("/");
        if (parts.length === 3) {
          const [dd, mm, yyyy] = parts;
          date = new Date(`${yyyy}-${mm}-${dd}`);
        } else {
          return false;
        }
      } else {
        return false;
      }

      return date.getFullYear() === Number(selectedYear);
    });

    renderTable(filtered);
    updateSummary(filtered);
    setupExport(filtered);
  });
}

// 🚀 Fetch and initialize CRM data from GitHub Pages
async function fetchCRMData() {
  const url = "https://istosmedical.github.io/salesDB/sales-data.json";

  try {
    const response = await fetch(url);
    const json = await response.json();

    // Validate and extract data
    const rawData = json.sales || json;
    if (!Array.isArray(rawData) || rawData.length < 2) {
      console.warn("CRM data is empty or malformed.");
      return;
    }

    // Skip header row
    crmData = rawData.slice(1);

    // ✅ Render dashboard components
    
    renderTable(crmData);
    updateSummary(crmData);
    setupExport(crmData);
    renderInstrumentGroups(instrumentGroups);
    populateInstrumentDropdown(crmData);
    updateStatewiseCounts(crmData);
    setupInstrumentDropdown(crmData);
    animateCards();

  } catch (error) {
    console.error("❌ Failed to fetch CRM data:", error);
  }
}

// 📊 Render table rows

function renderTable(data) {
  const tbody = document.querySelector("#crmTable tbody");
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
      <td>${excelSerialToDate(row.G)}</td>
      <td>${excelSerialToDate(row.H)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 📦 Animate counters

function animateCounter(id, target) {
  const el = document.getElementById(id);
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

// 🧠 Animate card entry

function animateCards() {
  const cards = document.querySelectorAll(".istos-card");
  cards.forEach((card, i) => {
    card.style.opacity = 0;
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "all 0.6s ease";
      card.style.opacity = 1;
      card.style.transform = "translateY(0)";
    }, i * 100);
  });
}

// 📦 Update summary cards with animation

function updateSummary(data) {
  const quotations = data.length;
  const instruments = new Set(data.map(d => d.D));
  const customers = new Set(data.map(d => d.B));

  animateCounter("cardQuotations", quotations);
  animateCounter("cardInstruments", instruments.size);
  animateCounter("cardCustomers", customers.size);
}

// 🧾 Export filtered data to CSV

function setupExport(data) {
  const exportBtn = document.getElementById("exportCSV");
  if (!exportBtn) return;

  exportBtn.onclick = () => {
    const headers = ["#", "Customer", "City", "Equipment", "Model", "Make", "DOI", "Warranty"];
    const rows = data.map(row => [
      row.A, row.B, row.C, row.D, row.E, row.F, row.G, row.H
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(v => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "crm-data.csv";
    link.click();
  };
}

// 🧠 Render and wire instrument tags

function renderInstrumentList(list) {
  const container = document.getElementById("instrumentList");
  container.innerHTML = "";

  list.forEach(name => {
    const tag = document.createElement("button");
    tag.className = "instrument-tag";
    tag.textContent = name;

    tag.addEventListener("click", () => {
      const filtered = crmData.filter(row => row.D.toLowerCase() === name.toLowerCase());
      renderTable(filtered);
      updateSummary(filtered);
      setupExport(filtered);
    });

    container.appendChild(tag);
  });
}

// 🔍 Live search for instrument tags
function setupInstrumentSearch() {
  const searchInput = document.getElementById("instrumentSearch");
  const clearBtn = document.getElementById("clearSearch");

  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const query = e.target.value.toLowerCase();
      const filtered = fullInstrumentList.filter(item =>
        item.toLowerCase().includes(query)
      );
      renderInstrumentList(filtered);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      renderTable(crmData);
      updateSummary(crmData);
      setupExport(crmData);
      const yearDropdown = document.getElementById("yearDropdown");
      if (yearDropdown) yearDropdown.value = "";
    });
  }
}

// Statewise sales

function updateStatewiseCounts(data) {
  const maharashtraCount = data.filter(row =>
    row.C.toLowerCase().includes("maharashtra")
  ).length;

  const karnatakaCount = data.filter(row =>
    row.C.toLowerCase().includes("karnataka")
  ).length;

  const mhEl = document.getElementById("cardMaharashtra");
  const kaEl = document.getElementById("cardKarnataka");

  if (mhEl) mhEl.textContent = maharashtraCount;
  if (kaEl) kaEl.textContent = karnatakaCount;
}

// Dropdown logic to show instrument count

function setupInstrumentDropdown(data) {
  const dropdown = document.getElementById("instrumentDropdown");
  const display = document.getElementById("instrumentCount");

  if (!dropdown || !display) return;

  dropdown.addEventListener("change", e => {
    const selected = e.target.value.trim().toLowerCase();

    if (!selected) {
      display.textContent = "Select an instrument";
      renderTable(data);
      updateSummary(data);
      setupExport(data);
      return;
    }

    const filtered = data.filter(row => {
      const instrument = row.D?.trim().toLowerCase();
      return instrument === selected;
    });

    display.textContent = `🔢 Total Installations: ${filtered.length}`;
    renderTable(filtered);
    updateSummary(filtered);
    setupExport(filtered);
  });
}


// 🟢 Initialize dashboard
fetchCRMData();
