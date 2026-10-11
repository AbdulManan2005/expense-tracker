const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All report routes require a logged-in user
router.use(authMiddleware);

// SUMMARY: total income, total expense and balance
// Optional filters: ?from=2026-10-01&to=2026-10-31
router.get("/summary", async (req, res) => {
  try {
    const { from, to } = req.query;

    const conditions = ["user_id = $1"];
    const values = [req.userId];

    if (from) {
      values.push(from);
      conditions.push(`date >= $${values.length}`);
    }
    if (to) {
      values.push(to);
      conditions.push(`date <= $${values.length}`);
    }

    const result = await pool.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS total_income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expense
       FROM transactions
       WHERE ${conditions.join(" AND ")}`,
      values
    );

    const totalIncome = result.rows[0].total_income;
    const totalExpense = result.rows[0].total_expense;

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// BY CATEGORY: totals grouped by category
// Optional filters: ?type=expense&from=2026-10-01&to=2026-10-31
router.get("/by-category", async (req, res) => {
  try {
    const { type, from, to } = req.query;

    const conditions = ["user_id = $1"];
    const values = [req.userId];

    if (type) {
      values.push(type);
      conditions.push(`type = $${values.length}`);
    }
    if (from) {
      values.push(from);
      conditions.push(`date >= $${values.length}`);
    }
    if (to) {
      values.push(to);
      conditions.push(`date <= $${values.length}`);
    }

    const result = await pool.query(
      `SELECT category, type, SUM(amount) AS total
       FROM transactions
       WHERE ${conditions.join(" AND ")}
       GROUP BY category, type
       ORDER BY total DESC`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// MONTHLY: income and expense per month
// Optional filter: ?year=2026
router.get("/monthly", async (req, res) => {
  try {
    const { year } = req.query;

    const conditions = ["user_id = $1"];
    const values = [req.userId];

    if (year) {
      values.push(year);
      conditions.push(`EXTRACT(YEAR FROM date) = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT
         TO_CHAR(date, 'YYYY-MM') AS month,
         COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
       FROM transactions
       WHERE ${conditions.join(" AND ")}
       GROUP BY month
       ORDER BY month`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;