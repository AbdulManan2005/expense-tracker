// Redirect to the login page if the user is not logged in
if (!getToken()) {
  window.location.href = "index.html";
}

// ---------- Element references ----------
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const balanceEl = document.getElementById("balance");

const form = document.getElementById("transactionForm");
const formTitle = document.getElementById("formTitle");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const noteInput = document.getElementById("note");

const filterType = document.getElementById("filterType");
const filterFrom = document.getElementById("filterFrom");
const filterTo = document.getElementById("filterTo");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const transactionsBody = document.getElementById("transactionsBody");

// ---------- State ----------
let transactions = [];
let editingId = null;

// ---------- Helpers ----------
function formatMoney(value) {
  return (
    "Rs. " +
    Number(value).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : text;
  return div.innerHTML;
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function showFormMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `message ${type}`;
  formMessage.hidden = false;
}

function hideFormMessage() {
  formMessage.hidden = true;
}

function getFilterParams() {
  const params = new URLSearchParams();
  if (filterType.value) params.append("type", filterType.value);
  if (filterFrom.value) params.append("from", filterFrom.value);
  if (filterTo.value) params.append("to", filterTo.value);
  return params;
}

// ---------- Summary cards ----------
async function loadSummary() {
  try {
    const params = new URLSearchParams();
    if (filterFrom.value) params.append("from", filterFrom.value);
    if (filterTo.value) params.append("to", filterTo.value);
    const query = params.toString() ? `?${params.toString()}` : "";

    const data = await apiRequest(`/reports/summary${query}`);
    totalIncomeEl.textContent = formatMoney(data.totalIncome);
    totalExpenseEl.textContent = formatMoney(data.totalExpense);
    balanceEl.textContent = formatMoney(data.balance);
  } catch (err) {
    console.error(err);
  }
}

// ---------- Transactions list ----------
async function loadTransactions() {
  try {
    const params = getFilterParams();
    const query = params.toString() ? `?${params.toString()}` : "";
    transactions = await apiRequest(`/transactions${query}`);
    renderTransactions();
  } catch (err) {
    console.error(err);
    transactionsBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Failed to load transactions</td></tr>';
  }
}

function renderTransactions() {
  if (transactions.length === 0) {
    transactionsBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No transactions found</td></tr>';
    return;
  }

  transactionsBody.innerHTML = transactions
    .map((t) => {
      const sign = t.type === "income" ? "+" : "-";
      return `
        <tr>
          <td>${escapeHtml(t.date)}</td>
          <td><span class="badge ${t.type}">${escapeHtml(t.type)}</span></td>
          <td>${escapeHtml(t.category)}</td>
          <td>${escapeHtml(t.note)}</td>
          <td class="amount-${t.type}">${sign} ${formatMoney(t.amount)}</td>
          <td>
            <div class="row-actions">
              <button type="button" class="btn btn-secondary btn-small" data-action="edit" data-id="${t.id}">Edit</button>
              <button type="button" class="btn btn-danger btn-small" data-action="delete" data-id="${t.id}">Delete</button>
            </div>
          </td>
        </tr>`;
    })
    .join("");
}

// ---------- Charts ----------
let categoryChart = null;
let monthlyChart = null;

const CHART_COLORS = [
  "#4f46e5",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#0ea5e9",
  "#a855f7",
  "#14b8a6",
  "#f97316",
  "#64748b",
  "#ec4899",
];

function formatMonth(value) {
  // Converts "2026-10" to "Oct 2026"
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

async function loadCategoryChart() {
  const canvas = document.getElementById("categoryChart");
  const emptyMessage = document.getElementById("categoryEmpty");

  try {
    // Uses the same date filters as the summary cards
    const params = new URLSearchParams({ type: "expense" });
    if (filterFrom.value) params.append("from", filterFrom.value);
    if (filterTo.value) params.append("to", filterTo.value);

    const data = await apiRequest(`/reports/by-category?${params.toString()}`);

    if (categoryChart) {
      categoryChart.destroy();
      categoryChart = null;
    }

    const hasData = data.length > 0;
    canvas.hidden = !hasData;
    emptyMessage.hidden = hasData;
    if (!hasData) return;

    categoryChart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: data.map((item) => item.category),
        datasets: [
          {
            data: data.map((item) => item.total),
            backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${formatMoney(context.parsed)}`,
            },
          },
        },
      },
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadMonthlyChart() {
  const canvas = document.getElementById("monthlyChart");
  const emptyMessage = document.getElementById("monthlyEmpty");

  try {
    const data = await apiRequest("/reports/monthly");

    if (monthlyChart) {
      monthlyChart.destroy();
      monthlyChart = null;
    }

    const hasData = data.length > 0;
    canvas.hidden = !hasData;
    emptyMessage.hidden = hasData;
    if (!hasData) return;

    monthlyChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.map((item) => formatMonth(item.month)),
        datasets: [
          {
            label: "Income",
            data: data.map((item) => item.income),
            backgroundColor: "#16a34a",
          },
          {
            label: "Expenses",
            data: data.map((item) => item.expense),
            backgroundColor: "#dc2626",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true },
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${formatMoney(context.parsed.y)}`,
            },
          },
        },
      },
    });
  } catch (err) {
    console.error(err);
  }
}

async function refreshAll() {
  await Promise.all([
    loadSummary(),
    loadTransactions(),
    loadCategoryChart(),
    loadMonthlyChart(),
  ]);
}

// ---------- Form: add / edit ----------
function resetForm() {
  editingId = null;
  form.reset();
  dateInput.value = todayString();
  formTitle.textContent = "Add Transaction";
  submitBtn.textContent = "Add";
  cancelEditBtn.hidden = true;
}

function startEdit(transaction) {
  editingId = transaction.id;
  typeInput.value = transaction.type;
  amountInput.value = transaction.amount;
  categoryInput.value = transaction.category;
  dateInput.value = transaction.date;
  noteInput.value = transaction.note || "";

  formTitle.textContent = "Edit Transaction";
  submitBtn.textContent = "Update";
  cancelEditBtn.hidden = false;
  hideFormMessage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideFormMessage();

  const body = {
    type: typeInput.value,
    amount: Number(amountInput.value),
    category: categoryInput.value.trim(),
    date: dateInput.value,
    note: noteInput.value.trim(),
  };

  submitBtn.disabled = true;
  try {
    if (editingId) {
      await apiRequest(`/transactions/${editingId}`, { method: "PUT", body });
      showFormMessage("Transaction updated successfully", "success");
    } else {
      await apiRequest("/transactions", { method: "POST", body });
      showFormMessage("Transaction added successfully", "success");
    }
    resetForm();
    await refreshAll();
  } catch (err) {
    showFormMessage(err.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
});

cancelEditBtn.addEventListener("click", () => {
  resetForm();
  hideFormMessage();
});

// ---------- Edit / delete buttons in the table ----------
transactionsBody.addEventListener("click", async (e) => {
  const button = e.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "edit") {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) startEdit(transaction);
  }

  if (action === "delete") {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await apiRequest(`/transactions/${id}`, { method: "DELETE" });
      if (editingId === id) resetForm();
      await refreshAll();
    } catch (err) {
      alert(err.message);
    }
  }
});

// ---------- Filters ----------
[filterType, filterFrom, filterTo].forEach((input) => {
  input.addEventListener("change", refreshAll);
});

clearFiltersBtn.addEventListener("click", () => {
  filterType.value = "";
  filterFrom.value = "";
  filterTo.value = "";
  refreshAll();
});

// ---------- Logout ----------
logoutBtn.addEventListener("click", logout);

// ---------- Initial load ----------
const currentUser = getUser();
if (currentUser) {
  userName.textContent = `Hello, ${currentUser.name}`;
}
resetForm();
refreshAll();