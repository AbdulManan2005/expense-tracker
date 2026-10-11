const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All transaction routes require a logged-in user
router.use(authMiddleware);

// Validates the request body for create and update
function validateTransaction(body) {
  const { type, amount, category, date } = body;

  if (!type || !amount || !category) {
    return "Type, amount and category are required";
  }
  if (!["income", "expense"].includes(type)) {
    return "Type must be either 'income' or 'expense'";
  }
  if (isNaN(amount) || Number(amount) <= 0) {
    return "Amount must be a number greater than 0";
  }
  if (date && isNaN(Date.parse(date))) {
    return "Date is invalid";
  }
  return null;
}

// CREATE a transaction
router.post("/", async (req, res) => {
  try {
    const error = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const { type, amount, category, note, date } = req.body;

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, category, note, date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE))
       RETURNING *`,
      [req.userId, type, amount, category, note || null, date || null]
    );

    res.status(201).json({
      message: "Transaction created successfully",
      transaction: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET all transactions of the logged-in user
// Optional filters: ?type=income&category=Food&from=2026-01-01&to=2026-12-31
router.get("/", async (req, res) => {
  try {
    const { type, category, from, to } = req.query;

    const conditions = ["user_id = $1"];
    const values = [req.userId];

    if (type) {
      values.push(type);
      conditions.push(`type = $${values.length}`);
    }
    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
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
      `SELECT * FROM transactions
       WHERE ${conditions.join(" AND ")}
       ORDER BY date DESC, id DESC`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE a transaction
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const error = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const { type, amount, category, note, date } = req.body;

    const result = await pool.query(
      `UPDATE transactions
       SET type = $1, amount = $2, category = $3, note = $4,
           date = COALESCE($5, date)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [type, amount, category, note || null, date || null, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({
      message: "Transaction updated successfully",
      transaction: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE a transaction
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;