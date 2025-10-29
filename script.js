// Sample data structure (replace with parsed Excel data)
const salesData = [
  {
    customer: "B J Wadia Hospital",
    city: "Mumbai",
    equipment: "Microtome",
    model: "3004 M",
    doi: "2020-11-19",
    warranty: "2021-11-19"
  },
  {
    customer: "SRL Goregaon",
    city: "Mumbai",
    equipment: "Tissue processor",
    model: "EFTP",
    doi: "2018-11-19",
    warranty: "2021-11-19"
  }
  // Add more rows from parsed Excel
];

function renderTable(data) {
  const tbody = document.querySelector("#salesTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.customer}</td>
      <td>${row.city}</td>
      <td>${row.equipment}</td>
      <td>${row.model}</td>
      <td>${row.doi}</td>
      <td>${row.warranty}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("applyFilters").addEventListener("click", () => {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  const equipment = document.getElementById("equipmentFilter").value.toLowerCase();
  const model = document.getElementById("modelFilter").value.toLowerCase();

  const filtered = salesData.filter(row => {
    const dateMatch =
      (!start || new Date(row.doi) >= new Date(start)) &&
      (!end || new Date(row.doi) <= new Date(end));
    const equipmentMatch = row.equipment.toLowerCase().includes(equipment);
    const modelMatch = row.model.toLowerCase().includes(model);
    return dateMatch && equipmentMatch && modelMatch;
  });

  renderTable(filtered);
});

// Initial render
renderTable(salesData);
