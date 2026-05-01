// script.js

const API_URL = "https://team-task-manager-production-8fb2.up.railway.app";

// Login
async function loginUser(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } else {
    alert("Login failed: " + (data.error || "Unknown error"));
  }
}

// Signup
async function signupUser(email, password, role) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role })
  });
  const data = await res.json();
  if (data.userId) {
    alert("Signup successful! Please login.");
  } else {
    alert("Signup failed: " + (data.error || "Unknown error"));
  }
}

// Get Projects
async function getProjects() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

// Get Dashboard Tasks
async function getDashboardTasks() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

// Add Task
async function addTask(title, description, projectId, assignedTo) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, description, projectId, assignedTo })
  });
  return res.json();
}
