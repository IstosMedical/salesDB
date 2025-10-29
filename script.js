// 🔗 Fetch data from local JSON server
async function fetchCRMData() {
  try {
    const response = await fetch("http://localhost:3000/sales");
    const crmData = await response.json();
    renderTable(crmData);
    updateSummary(crmData);
    setupFilter(crmData);
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
      <td>${row.customer}</td>
      <td>${row.city}</td>
      <td>${row.equipment}</td>
      <td>${row.model}</td>
      <td>${row.make}</td>
      <td>${row.doi}</td>
      <td>${row.warranty}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 📦 Update summary cards
function updateSummary(data) {
  document.getElementById("totalEquipments").textContent = `📦 Equipments: ${data.length}`;
  const customers = new Set(data.map(d => d.customer));
  const cities = new Set(data.map(d => d.city));
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
      const dateMatch =
        (!start || new Date(row.doi) >= new Date(start)) &&
        (!end || new Date(row.doi) <= new Date(end));
      return (
        dateMatch &&
        row.equipment.toLowerCase().includes(equipment) &&
        row.model.toLowerCase().includes(model) &&
        row.customer.toLowerCase().includes(customer) &&
        row.city.toLowerCase().includes(city) &&
        row.make.toLowerCase().includes(make)
      );
    });

    renderTable(filtered);
    updateSummary(filtered);
  });
}

// 🚀 Initialize dashboard
fetchCRMData();
