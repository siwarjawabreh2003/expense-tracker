// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1
// Setup:
//   1. Create a database named expense_tracker and run schema.sql on it.
//   2. Copy .env.example to a new file named .env and write your PostgreSQL password.
//   3. npm install express cors pg dotenv
// Run:    node server.js   (restart it every time you change this file)
//
// Endpoints you need to build:
//   GET    /api/expenses        return all expenses
//   GET    /api/expenses/:id    return one expense (404 if not found)
//   POST   /api/expenses        add an expense (201, or 400 if the data is invalid)
//   PUT    /api/expenses/:id    update an expense (200, 400, or 404)
//   DELETE /api/expenses/:id    delete an expense (200, or 404)
//
// Tips:
//   - Create one Pool (from the "pg" library) with the values from .env,
//     and use pool.query(...) in every route.
//   - ALWAYS send the values as parameters: pool.query("... WHERE id = $1", [id]).
//     NEVER build the SQL text by joining strings with data from the user.
//   - Use RETURNING to get the new (or updated) row back from INSERT and UPDATE.
//   - The database creates the id. The client never sends one.
//   - pg returns NUMERIC as text and DATE as a JavaScript Date, so fix both in your SELECT.
//     Hint: amount::float8 and to_char(date, 'DD-MM-YYYY').
//   - Validate the data before the query, and answer 400 with a message that explains the problem.
//   - Check the id before the query. A text like "abc" makes PostgreSQL throw an error.
//   - Enable CORS so the frontend can talk to the server.
//   - Test every endpoint with Thunder Client BEFORE you connect the frontend.

const express = require("express");

const cors = require("cors");
require("dotenv").config()//بشغل المكتبه وبقرا الملف ;

const { Pool } = require("pg");
const app = express();

app.use(cors());//لنفعل الكور على جميع المسارات
app.use(express.json());// meddilewere  


const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query(// ترسل استعلام sql الى قاعده البيانات  وبتستقبل النتيجه منها 
      `SELECT
        id,
        title,
        amount::float8 AS amount, 
        category,
       to_char(date, 'DD-MM-YYYY') AS date
       FROM expenses
       ORDER BY id`
    );

    res.status(200).json(result.rows);//لحتلى يبعث البيانات للفروند

  } catch (error) {
    console.log(error.message);

    res.status(500).json({
      message: "Database error"
    });
  }
});


app.get("/api/expenses/:id", async (req, res) => {
  try {
    const idText = req.params.id;

    if (!/^\d+$/.test(idText)) {
      return res.status(404).json({
        message: "Invalid expense ID"
      });
    }
// بعد ما تاكدنا انه النص يحتوي عل ارقام هون بنحوله لنمبر
    const id = Number(idText);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(404).json({
        message: "Invalid expense ID"
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        title,
        amount::float8 AS amount,
        category,
        to_char(date, 'DD-MM-YYYY') AS date
       FROM expenses
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.log(error.message);

    res.status(500).json({
      message: "Database error"
    });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;//destructuring
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Invalid title"
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid amount"
      });
    }

    const categories = [
      "Food",
      "Transport",
      "Bills",
      "Entertainment",
      "Other"
    ];

    if (!categories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }


    const parsedDate =
      typeof date === "string"
        ? new Date(date + "T00:00:00Z")
        : null;
//هذا الـ validation يتأكد أن التاريخ string، وبصيغة YYYY-MM-DD، وقابل للتحويل إلى Date صالح، وأنه تاريخ حقيقي، وإذا فشل أي شرط نرجع 400 Invalid date."
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !parsedDate ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        message: "Invalid date"
      });
    }

    const result = await pool.query(
      `INSERT INTO expenses
        (title, amount, category, date)
       VALUES ($1, $2, $3, $4)
       RETURNING
        id,
        title,
        amount::float8 AS amount,
        category,
        to_char(date, 'DD-MM-YYYY') AS date`,
      [title.trim(), amount, category, date]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Database error"
    });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  try {
    const idText = req.params.id;

    if (!/^\d+$/.test(idText)) {
      return res.status(404).json({
        message: "Invalid expense ID"
      });
    }

    const id = Number(idText);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(404).json({
        message: "Invalid expense ID"
      });
    }

    const { title, amount, category, date } = req.body || {};

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100
    ) {
      return res.status(400).json({
        message: "Invalid title"
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid amount"
      });
    }

    const categories = [
      "Food",
      "Transport",
      "Bills",
      "Entertainment",
      "Other"
    ];

    if (!categories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }

    const parsedDate =
      typeof date === "string"
        ? new Date(date + "T00:00:00Z")
        : null;

    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !parsedDate ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        message: "Invalid date"
      });
    }

    const result = await pool.query(
      `UPDATE expenses
       SET
         title = $1,
         amount = $2,
         category = $3,
         date = $4
       WHERE id = $5
       RETURNING
         id,
         title,
         amount::float8 AS amount,
         category,
         to_char(date, 'DD-MM-YYYY') AS date`,
      [title.trim(), amount, category, date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Database error"
    });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const idText = req.params.id;

    if (!/^\d+$/.test(idText)) {
      return res.status(404).json({
        message: "Invalid expense ID"
      });
    }

    const id = Number(idText);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(404).json({
        message: "Invalid expense ID"
      });
    }

    const result = await pool.query(
      `DELETE FROM expenses
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    res.status(200).json({
      message: "Expense deleted successfully",
      id: result.rows[0].id
    });

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Database error"
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
