
const express = require("express");
const pool = require("../db");

const router = express.Router();

const fields = ["title", "amount", "category", "expense_date"];
const columns = "id, title, amount, category, expense_date, created_at";

const categories = ["Food", "Transport", "Shopping", "Entertainment", "Other"];

// Validate UUID
router.param("id", (req, res, next, id) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  next();
});

// Validate request body
function validateBody(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }

  const keys = Object.keys(body);

  if (!keys.length || keys.some(key => !fields.includes(key))) {
    return res.status(400).json({ error: "Invalid expense fields" });
  }

  if (
    req.method === "POST" &&
    fields.some(field => !Object.hasOwn(body, field))
  ) {
    return res.status(400).json({ error: "All expense fields are required" });
  }

  for (const field of ["title", "category"]) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return res.status(400).json({
          error: `${field} must be a non-empty string`
        });
      }

      body[field] = body[field].trim();
    }
  }

  if (Object.hasOwn(body, "title") && body.title.length > 100) {
    return res.status(400).json({ error: "Title is too long" });
  }

  if (
    Object.hasOwn(body, "category") &&
    !categories.includes(body.category)
  ) {
    return res.status(400).json({ error: "Invalid category" });
  }

  if (
    Object.hasOwn(body, "amount") &&
    (
      typeof body.amount !== "number" ||
      !Number.isFinite(body.amount) ||
      body.amount <= 0 ||
      body.amount > 99999999.99 ||
      Math.round(body.amount * 100) / 100 !== body.amount
    )
  ) {
    return res.status(400).json({
      error: "Amount must be positive with at most two decimal places"
    });
  }

  if (Object.hasOwn(body, "expense_date")) {
    const date = body.expense_date;

    const timestamp =
      typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? Date.parse(`${date}T00:00:00.000Z`)
        : NaN;

    if (
      !Number.isFinite(timestamp) ||
      date.startsWith("0000") ||
      new Date(timestamp).toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        error: "Invalid date. Use YYYY-MM-DD"
      });
    }
  }

  next();
}

// GET all expenses
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${columns} FROM expenses
       ORDER BY expense_date DESC, created_at DESC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET expense by ID
router.get("/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${columns} FROM expenses WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST create expense
router.post("/", validateBody, async (req, res, next) => {
  try {
    const result = await pool.query(
      `INSERT INTO expenses (title, amount, category, expense_date)
       VALUES ($1, $2, $3, $4)
       RETURNING ${columns}`,
      fields.map(field => req.body[field])
    );

    res
      .location(`/api/expenses/${result.rows[0].id}`)
      .status(201)
      .json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PATCH update expense
router.patch("/:id", validateBody, async (req, res, next) => {
  try {
    const keys = fields.filter(field =>
      Object.hasOwn(req.body, field)
    );

    const assignments = keys
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const result = await pool.query(
      `UPDATE expenses
       SET ${assignments}
       WHERE id = $${keys.length + 1}
       RETURNING ${columns}`,
      [...keys.map(field => req.body[field]), req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE expense
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Database error handling
router.use((error, req, res, next) => {
  const code =
    typeof error.code === "string" &&
    /^[A-Z0-9_]{2,40}$/.test(error.code)
      ? error.code
      : "DATABASE_ERROR";

  console.error("Expense database request failed", {
    method: req.method,
    code
  });

  if (
    ["22P02", "22003", "22007", "22008", "22001", "23502", "23514"].includes(code)
  ) {
    return res.status(400).json({
      error: "Invalid expense data"
    });
  }

  if (["23503", "23505"].includes(code)) {
    return res.status(409).json({
      error: "Expense conflicts with existing records"
    });
  }

  res.status(500).json({ error: "Database request failed" });
});

module.exports = router;
