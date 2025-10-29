// Sample data (replace with parsed Excel data)
const crmData = [
  {
    customer: "B J Wadia Hospital",
    city: "Mumbai",
    equipment: "Microtome",
    model: "3004 M",
    make: "PFM",
    doi: "2020-11-19",
    warranty: "2021-11-19"
  },
  {
    customer: "SRL Goregaon",
    city: "Mumbai",
    equipment: "Tissue processor",
    model: "EFTP",
    make: "Intelsint",
    doi: "2018-11-19",
    warranty: "2021-11-19"
  }
  // Add more rows from Excel
];

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

function updateSummary(data) {
  document.getElementById("totalEquipments").textContent = `Equipments: ${data.length}`;
  const customers = new Set(data.map(d => d.customer));
  const cities = new Set(data.map(d => d.city));
  document.getElementById("uniqueCustomers").textContent = `Customers: ${customers.size}`;
  document.getElementById("citiesCovered").textContent = `Cities: ${cities.size}`;
}

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

// Initial render
renderTable(crmData);
updateSummary(crmData);
