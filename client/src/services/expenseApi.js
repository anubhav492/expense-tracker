const BASE_URL = "/api/expenses";

async function errorMessage(response, fallback) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

// GET all expenses
export async function getExpenses() {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to fetch expenses"));
  }

  return response.json();
}

export async function createExpense(expenseData) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expenseData),
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to create expense"));
  }

  return response.json();
}

export async function updateExpense(id, expenseData) {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expenseData),
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to update expense"));
  }

  return response.json();
}

export async function deleteExpense(id) {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to delete expense"));
  }
  // A successful DELETE returns 204 No Content, so there is no JSON to parse.
}
