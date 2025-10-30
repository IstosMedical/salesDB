let crmData = []; // Global reference

const instruments = [
  "Cryostat", "Microtome", "Tissue Processor", "Embedding System", "Cassette Printer",
  "Slide drying table", "Tissue Flotation Bath", "Bone Band Saw", "Grossing Workstation",
  "Formaldehyde Meter", "Solvent Recyclling System", "Cytocentrifuge", "Manual slide stainer",
  "Slide Stainer", "Wax Dispenser", "Grossing camera"
];

// 🚀 Fetch data from GitHub Pages
async function fetchCRMData() {
  try {
    const response = await fetch("https://istosmedical.github.io/salesDB/sales-data.json");
    const json = await response.json();
    crmData = (json.sales || json).slice(1); // Skip header row
    renderTable(crmData);
    updateSummary(crmData);
    setupFilter(crmData);
    setupExport(crmData);
    renderInstrumentList(instruments);
    animateCards(); // 🔥 Animate card entry
  } catch (error) {
    console.error("Failed to fetch CRM data:", error);
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
      <td>${row.G}</td>
      <td>${row.H}</td>
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
    el.textContent = `(${count})`;
  }, 30);
}

// 🧠 Animate card entry
function animateCards() {
  const cards = document.querySelectorAll(".summary-card");
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
  const vendors = new Set(data.map(d => d.F)); // Assuming 'Make' maps to vendors

  document.getElementById("cardQuotations").textContent = quotations;
  document.getElementById("cardInstruments").textContent = instruments.size;
  document.getElementById("cardCustomers").textContent = customers.size;
  document.getElementById("cardVendors").textContent = vendors.size;
}

}

// 🔍 Setup filter logic
function setupFilter(dataSet) {
  document.getElementById("applyFilters").addEventListener("click", () => {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    const equipment = document.getElementById("equipmentFilter").value.toLowerCase();
    const model = document.getElementById("modelFilter").value.toLowerCase();
    const customer = document.getElementById("customerFilter").value.toLowerCase();
    const city = document.getElementById("cityFilter").value.toLowerCase();
    const make = document.getElementById("makeFilter").value.toLowerCase();

    const filtered = dataSet.filter(row => {
      const doi = row.G || "";
      const dateMatch =
        (!start || new Date(doi) >= new Date(start)) &&
        (!end || new Date(doi) <= new Date(end));
      return (
        dateMatch &&
        row.D.toLowerCase().includes(equipment) &&
        row.E.toLowerCase().includes(model) &&
        row.B.toLowerCase().includes(customer) &&
        row.C.toLowerCase().includes(city) &&
        row.F.toLowerCase().includes(make)
      );
    });

    renderTable(filtered);
    updateSummary(filtered);
    setupExport(filtered);
  });
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

  // 🔍 Live search
  document.getElementById("instrumentSearch").addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const filtered = list.filter(item => item.toLowerCase().includes(query));
    renderInstrumentList(filtered);
  });
}

// 🟢 Initialize dashboard
fetchCRMData();
