// server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL connection (Railway provides DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Signup route
app.post("/auth/signup", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id",
      [email, hashedPassword, role]
    );
    res.json({ userId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Login route
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(403).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get projects (admin only)
app.get("/projects", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  try {
    const result = await pool.query("SELECT * FROM projects");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Add task (admin only)
app.post("/tasks", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const { title, description, projectId, assignedTo } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tasks (title, description, project_id, assigned_to) VALUES ($1, $2, $3, $4) RETURNING id",
      [title, description, projectId, assignedTo]
    );
    res.json({ taskId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add task" });
  }
});

// Update task status (member can update their own tasks)
app.put("/tasks/:id/status", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tasks SET status=$1 WHERE id=$2 AND assigned_to=$3 RETURNING id",
      [status, id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(403).json({ error: "Not allowed" });
    res.json({ taskId: result.rows[0].id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Dashboard (member sees their tasks)
app.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks WHERE assigned_to=$1", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

// Start server
app.listen(process.env.PORT || 8080, () => {
  console.log("Server running...");
});
