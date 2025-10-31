window.addEventListener("error", e => {
  console.error("Global JS error:", e.message);
});

// 📊 Render table rows with fallback and modular cell rendering
function renderTable(data) {
  const tbody = document.querySelector("#crmTable tbody");
  if (!tbody || !Array.isArray(data)) return;

  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = generateRowHTML(row);
    tbody.appendChild(tr);
  });
}

// 🧩 Generate HTML for a single row
function generateRowHTML(row) {
  return `
    <td>${sanitize(row.A)}</td>
    <td>${sanitize(row.B)}</td>
    <td>${sanitize(row.C)}</td>
    <td>${sanitize(row.D)}</td>
    <td>${sanitize(row.E)}</td>
    <td>${sanitize(row.F)}</td>
    <td>${formatDate(row.G)}</td>
    <td>${formatDate(row.H)}</td>
  `;
}

// 🧼 Sanitize cell content
function sanitize(value) {
  return value ?? "—";
}

// 📅 Format Excel serial date or fallback
function formatDate(serial) {
  return serial ? excelSerialToDate(serial) : "—";
}


// 📦 Update summary cards with animation

function updateSummary(data) {
  const instruments = new Set(data.map(d => d.D).filter(Boolean));
  const customers = new Set(data.map(d => d.B).filter(Boolean));
  const quotations = data.length;

  animateCounter("cardQuotations", quotations);
  animateCounter("cardInstruments", instruments.size);
  animateCounter("cardCustomers", customers.size);
}


// 🚀 Group Filter Function (Refactored)

function renderInstrumentGroups(groups) {
  const container = document.getElementById("instrumentGroups");
  if (!container || !crmData) return;

  container.innerHTML = "";

  const groupColors = {
    Microtomes: "#1976d2",
    Cryo: "#388e3c",
    Processors: "#f57c00",
    Imaging: "#6a1b9a",
    Workstations: "#c2185b",
    Others: "#455a64"
  };

  Object.entries(groups).forEach(([groupName, instruments]) => {
    if (!Array.isArray(instruments) || instruments.length === 0) return;

    const groupDiv = document.createElement("div");
    groupDiv.className = "instrument-group";

    const title = document.createElement("h4");
    title.textContent = groupName;
    groupDiv.appendChild(title);

    const tagContainer = document.createElement("div");
    tagContainer.className = "instrument-tags";

    instruments.forEach(name => {
      const normalizedName = name?.trim().toLowerCase();
      if (!normalizedName) return;

      const filtered = crmData.filter(row =>
        row.D?.trim().toLowerCase() === normalizedName
      );

      const tag = document.createElement("span");
      tag.className = "instrument-tag";
      tag.textContent = `${name} (${filtered.length})`;
      tag.style.backgroundColor = groupColors[groupName] || "#607d8b";

      tag.addEventListener("click", () => {
        renderTable(filtered);
        updateSummary(filtered);
        updateStatewiseCounts(filtered);
        document.getElementById("instrumentCount").textContent =
          `🔢 Total Installations: ${filtered.length}`;
      });

      tagContainer.appendChild(tag);
    });

    groupDiv.appendChild(tagContainer);
    container.appendChild(groupDiv);
  });
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
}

// 🚀 Group instruments by category for tag rendering

function groupInstruments(data) {
  const groups = {
    Microtomes: [],
    Cryo: [],
    Processors: [],
    Imaging: [],
    Workstations: [],
    Others: []
  };

  data.forEach(row => {
    const name = row.D?.trim();
    if (!name) return;

    if (/microtome/i.test(name)) {
      groups.Microtomes.push(name);
    } else if (/cryo|cryostat/i.test(name)) {
      groups.Cryo.push(name);
    } else if (/processor|embedding|bath|dryer|stainer/i.test(name)) {
      groups.Processors.push(name);
    } else if (/camera|imaging|printer/i.test(name)) {
      groups.Imaging.push(name);
    } else if (/station|console|workstation/i.test(name)) {
      groups.Workstations.push(name);
    } else {
      groups.Others.push(name);
    }
  });

  return groups;
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

// 🧠 Render and wire instrument tags

function renderInstrumentList(matches) {
  const container = document.getElementById("instrumentList");
  if (!container) return;

  container.innerHTML = "";

  matches.forEach(name => {
    const count = crmData.filter(row =>
      row.D?.trim().toLowerCase() === name.toLowerCase()
    ).length;

    const tag = document.createElement("span");
    tag.className = "instrument-tag";
    tag.textContent = `${name} (${count})`;

    tag.addEventListener("click", () => {
      const filtered = crmData.filter(row =>
        row.D?.trim().toLowerCase() === name.toLowerCase()
      );
      renderTable(filtered);
      updateSummary(filtered);
      updateStatewiseCounts(filtered);
      document.getElementById("instrumentCount").textContent =
        `🔢 Total Installations: ${filtered.length}`;
    });

    container.appendChild(tag);
  });
}

// 🔍 Live search for instrument tags

function setupInstrumentSearch() {
  const input = document.getElementById("instrumentSearch");
  if (!input) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    const matches = fullInstrumentList.filter(name =>
      name.toLowerCase().includes(query)
    );
    renderInstrumentList(matches);
  });
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

// 🌐 Global variable to track filtered data
let crmDataFiltered = null;

// 🎯 Dropdown logic to show instrument count and update filtered data

function setupInstrumentDropdown(data) {
  const dropdown = document.getElementById("instrumentDropdown");
  if (!dropdown) return;

  dropdown.addEventListener("change", () => {
    const selected = dropdown.value;
    if (!selected) return;

    const filtered = data.filter(row =>
      row.D?.trim().toLowerCase() === selected.toLowerCase()
    );

    crmDataFiltered = filtered;
    renderTable(filtered);
    updateSummary(filtered);
    updateStatewiseCounts(filtered);

    document.getElementById("instrumentCount").textContent =
      `🔢 Total Installations: ${filtered.length}`;
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
  });
}

// 🚀 Fetch and initialize CRM data from GitHub Pages

// ✅ Attach listener outside the function
window.addEventListener("DOMContentLoaded", fetchCRMData);

// ✅ Define the async function
async function fetchCRMData() {
  const url = "https://istosmedical.github.io/salesDB/sales.json";

  try {
    const response = await fetch(url);
    const json = await response.json();

    // ✅ Validate and extract data
    const rawData = json.sales || json;
    if (!Array.isArray(rawData) || rawData.length < 2) {
      console.warn("CRM data is empty or malformed.");
      document.getElementById("crmTable").innerHTML =
        "<tr><td colspan='8'>Unable to load data</td></tr>";
      return;
    }

    // ✅ Assign and render
    crmData = rawData.slice(1); // skip header row
    renderTable(crmData);
    updateSummary(crmData);
    const instrumentGroups = groupInstruments(crmData);
    renderInstrumentGroups(instrumentGroups);
    populateInstrumentDropdown(crmData);
    animateCards();

  } catch (error) {
    console.error("❌ Failed to fetch CRM data:", error);
    document.getElementById("crmTable").innerHTML =
      "<tr><td colspan='8'>Unable to load data</td></tr>";
  }
}


    // ✅ Render dashboard components
    renderTable(crmData);
    updateSummary(crmData);    
    renderInstrumentGroups(instrumentGroups);
    populateInstrumentDropdown(crmData);
    animateCards();

  } catch (error) {
    console.error("❌ Failed to fetch CRM data:", error);
    document.getElementById("crmTable").innerHTML =
      "<tr><td colspan='8'>Unable to load data</td></tr>";
  }
}

// 🟢 Initialize dashboard
fetchCRMData();
