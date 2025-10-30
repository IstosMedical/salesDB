let crmData = []; // Global reference

const instruments = [
  "Cryostat",
  "Microtome",
  "Tissue Processor",
  "Embedding System",
  "Cassette Printer",
  "Slide drying table",
  "Tissue Flotation Bath",
  "Bone Band Saw",
  "Grossing Workstation",
  "Formaldehyde Meter",
  "Solvent Recyclling System",
  "Cytocentrifuge",
  "Manual slide stainer",
  "Slide Stainer",
  "Wax Dispenser",
  "Grossing camera"
];

// 🚀 Fetch data from GitHub Pages
async function fetchCRMData() {
  try {
    const response = await fetch("https://istosmedical.github.io/salesDB/sales-data.json");
    const json = await response.json();
    crmData = json.sales || json;
    renderTable(crmData);
    updateSummary(crmData);
    setupFilter(crmData);
    setupExport(crmData);
    renderInstrumentList(instruments);
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
    `;
    tbody.appendChild(tr);
  });
}

// 📦 Update summary cards
function updateSummary(data) {
  document.getElementById("totalEquipments").textContent = `📦 Equipments: ${data.length}`;
  const customers = new Set(data.map(d => d.A));
  const cities = new Set(data.map(d => d.B));
  document.getElementById("uniqueCustomers").textContent = `🏥 Customers: ${customers.size}`;
  document.getElementById("citiesCovered").textContent = `🌆 Cities: ${cities.size}`;
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
      const doi = row.F || "";
      const dateMatch =
        (!start || new Date(doi) >= new Date(start)) &&
        (!end || new Date(doi) <= new Date(end));
      return (
        dateMatch &&
        row.C.toLowerCase().includes(equipment) &&
        row.D.toLowerCase().includes(model) &&
        row.A.toLowerCase().includes(customer) &&
        row.B.toLowerCase().includes(city) &&
        row.E.toLowerCase().includes(make)
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
    const headers = ["Customer", "City", "Equipment", "Model", "Make", "DOI", "Warranty"];
    const rows = data.map(row => [
      row.A,
      row.B,
      row.C,
      row.D,
      row.E,
      row.F,
      row.G
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
      const filtered = crmData.filter(row => row.C.toLowerCase() === name.toLowerCase());
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
