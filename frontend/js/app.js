const API_URL = "http://localhost:3000/api/expenses";
const expenseTableBody = document.getElementById("expenseTableBody");
const loading = document.getElementById("loading");
const alertContainer = document.getElementById("alertContainer");

const totalAmount = document.getElementById("totalAmount");
const expenseCount = document.getElementById("expenseCount");
const highestExpense = document.getElementById("highestExpense");

const expenseForm = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
let allExpenses = [];
const categoryFilter = document.getElementById("categoryFilter");
const editTitle = document.getElementById("editTitle");
const editAmount = document.getElementById("editAmount");
const editCategory = document.getElementById("editCategory");
const editDate = document.getElementById("editDate");
const editForm = document.getElementById("editForm");
const editModal = document.getElementById("editModal");
let editingExpenseId = null;

async function loadExpenses() {
  try {
    loading.classList.remove("d-none");

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to load expenses");
    }

    const expenses = await response.json();
    allExpenses = expenses;
    filterExpenses();
    updateSummary(expenses);
  } catch (error) {
    alertContainer.innerHTML = `
      <div class="alert alert-danger">
        Unable to load expenses.
      </div> 
    `;
  } finally {
    loading.classList.add("d-none");
  }
}
function displayExpenses(expenses) {
  expenseTableBody.innerHTML = "";

  expenses.forEach((expense) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${expense.title}</td>
      <td>${expense.amount}</td>
      <td>
        <span class="badge bg-info">
          ${expense.category}
        </span>
      </td>
      <td>${expense.date}</td>
      <td>
     <button
  class="btn btn-sm btn-primary edit-btn"
  data-id="${expense.id}"
  data-bs-toggle="modal"
  data-bs-target="#editModal"
>
  Edit
</button>
      <button
  class="btn btn-sm btn-danger delete-btn"
  data-id="${expense.id}"
>
  Delete
</button>
      </td>
    `;

    expenseTableBody.appendChild(row);
    const deleteButton = row.querySelector(".delete-btn");

    deleteButton.addEventListener("click", () => {
      deleteExpense(expense.id);
    });
    const editButton = row.querySelector(".edit-btn");

    editButton.addEventListener("click", () => {
      editingExpenseId = expense.id;

      editTitle.value = expense.title;
      editAmount.value = expense.amount;
      editCategory.value = expense.category;

      const [day, month, year] = expense.date.split("-");
      editDate.value = `${year}-${month}-${day}`;
    });
  });
}
async function deleteExpense(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alertContainer.innerHTML = `
        <div class="alert alert-danger">
          ${data.message}
        </div>
      `;

      return;
    }

    await loadExpenses();
  } catch (error) {
    alertContainer.innerHTML = `
      <div class="alert alert-danger">
        Unable to delete expense.
      </div>
    `;
  }
}
function updateSummary(expenses) {
  let total = 0;
  let highest = 0;

  expenses.forEach((expense) => {
    total += expense.amount;

    if (expense.amount > highest) {
      highest = expense.amount;
    }
  });

  totalAmount.textContent = total;
  expenseCount.textContent = expenses.length;
  highestExpense.textContent = highest;
}
expenseForm.addEventListener("submit", addExpense);

async function addExpense(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!title || !Number.isFinite(amount) || amount <= 0 || !category || !date) {
    alertContainer.innerHTML = `
      <div class="alert alert-danger">
        Please enter valid expense data.
      </div>
    `;

    return;
  }

  const newExpense = {
    title,
    amount,
    category,
    date,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newExpense),
    });

    const data = await response.json();

    if (!response.ok) {
      alertContainer.innerHTML = `
        <div class="alert alert-danger">
          ${data.message}
        </div>
      `;

      return;
    }

    expenseForm.reset();

    await loadExpenses();
  } catch (error) {
    alertContainer.innerHTML = `
      <div class="alert alert-danger">
        Unable to add expense.
      </div>
    `;
  }
}
categoryFilter.addEventListener("change", filterExpenses);
function filterExpenses() {
  const selectedCategory = categoryFilter.value;

  if (selectedCategory === "All") {
    displayExpenses(allExpenses);
    return;
  }

  const filteredExpenses = allExpenses.filter((expense) => {
    return expense.category === selectedCategory;
  });

  displayExpenses(filteredExpenses);
}
async function updateExpense(event) {
  event.preventDefault();

  const title = editTitle.value.trim();
  const amount = Number(editAmount.value);
  const category = editCategory.value;
  const date = editDate.value;

  if (!title || !Number.isFinite(amount) || amount <= 0 || !category || !date) {
    alertContainer.innerHTML = `
      <div class="alert alert-danger">
        Please enter valid expense data.
      </div>
    `;
    return;
  }

  const updatedExpense = {
    title,
    amount,
    category,
    date,
  };

  try {
    const response = await fetch(`${API_URL}/${editingExpenseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedExpense),
    });

    const data = await response.json();

    if (!response.ok) {
      alertContainer.innerHTML = `
        <div class="alert alert-danger">
          ${data.message || "Unable to update expense."}
        </div>
      `;

      return;
    }

    bootstrap.Modal.getInstance(editModal).hide();

    await loadExpenses();
  } catch (error) {
    alertContainer.innerHTML = `
      <div class="alert alert-danger">
        Unable to update expense.
      </div>
    `;
  }
}
editForm.addEventListener("submit", updateExpense);
loadExpenses();
