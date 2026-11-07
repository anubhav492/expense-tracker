const express = require("express");
const pool = require("./db");
const expenseRoutes = require("./routes/expenses");

const app = express();

app.use(express.json());

// Register expense routes
app.use("/api/expenses", expenseRoutes);

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ message: "Database connected!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
