// 🚀 Fetch data from local JSON server
async function fetchCRMData() {
  try {
    const response = await fetch("http://localhost:3000/sales");
    const crmData = await response.json();
    renderTable(crmData);
    updateSummary(crmData);
    setupFilter(crmData);
    setupExport(crmData);
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
      <td>${row.C}</td>
      <td>${row.E}</td>
      <td>${row.F}</td>
      <td>${row.H}</td>
      <td>${row.G}</td>
      <td>${row.J}</td>
      <td>${row.K}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 📦 Update summary cards
function updateSummary(data) {
  document.getElementById("totalEquipments").textContent = `📦 Equipments: ${data.length}`;
  const customers = new Set(data.map(d => d.C));
  const cities = new Set(data.map(d => d.E));
  document.getElementById("uniqueCustomers").textContent = `🏥 Customers: ${customers.size}`;
  document.getElementById("citiesCovered").textContent = `🌆 Cities: ${cities.size}`;
}

// 🔍 Setup filter logic
function setupFilter(crmData) {
  document.getElementById("applyFilters").addEventListener("click", () => {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    const equipment = document.getElementById("equipmentFilter").value.toLowerCase();
    const model = document.getElementById("modelFilter").value.toLowerCase();
    const customer = document.getElementById("customerFilter").value.toLowerCase();
    const city = document.getElementById("cityFilter").value.toLowerCase();
    const make = document.getElementById("makeFilter").value.toLowerCase();

    const filtered = crmData.filter(row => {
      const doi = row.J || "";
      const dateMatch =
        (!start || new Date(doi) >= new Date(start)) &&
        (!end || new Date(doi) <= new Date(end));
      return (
        dateMatch &&
        row.F.toLowerCase().includes(equipment) &&
        row.H.toLowerCase().includes(model) &&
        row.C.toLowerCase().includes(customer) &&
        row.E.toLowerCase().includes(city) &&
        row.G.toLowerCase().includes(make)
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
      row.C,
      row.E,
      row.F,
      row.H,
      row.G,
      row.J,
      row.K
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

// 🟢 Initialize dashboard
fetchCRMData();
