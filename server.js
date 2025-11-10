const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const USERS_FILE = path.join(__dirname, "users.json");
const ATT_FILE = path.join(__dirname, "attendance.json");

// ---- Helpers ----
function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error("readJson error:", err);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---- SIGNUP ----
app.post("/signup", (req, res) => {
  const { name = "", email = "", password = "" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const users = readJson(USERS_FILE, []);
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.json({ success: false, message: "User already exists. Please log in." });
  }

  users.push({ name, email, password });
  writeJson(USERS_FILE, users);

  res.json({ success: true, message: "Signup successful!" });
});

// ---- LOGIN ----
app.post("/login", (req, res) => {
  const { email = "", password = "" } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required." });
  }

  // Admin fixed credentials
  if (email.toLowerCase() === "admin@gmail.com" && password === "admin123") {
    return res.json({ success: true, role: "admin", username: "Admin" });
  }

  const users = readJson(USERS_FILE, []);
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  res.json({ success: true, role: "user", username: user.name, email: user.email });
});

// ---- GET ALL USERS (for admin) ----
app.get("/users", (req, res) => {
  const users = readJson(USERS_FILE, []);
  res.json(users.map(u => ({ name: u.name, email: u.email })));
});

// ---- SAVE / UPDATE ATTENDANCE ----
app.post("/attendance", (req, res) => {
  const { username = "", status = "", checkin = "", checkout = "" } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: "Username required." });
  }

  const attendance = readJson(ATT_FILE, []);
  const today = new Date().toLocaleDateString();

  const idx = attendance.findIndex(a => a.username === username && a.date === today);
  const record = { username, status, checkin, checkout, date: today };

  if (idx !== -1) attendance[idx] = record;
  else attendance.push(record);

  writeJson(ATT_FILE, attendance);
  res.json({ success: true, message: `Attendance saved for ${username}` });
});

// ---- GET ATTENDANCE FOR A USER ----
app.get("/attendance/:username", (req, res) => {
  const username = req.params.username;
  const attendance = readJson(ATT_FILE, []);
  const today = new Date().toLocaleDateString();

  const record = attendance.find(a => a.username === username && a.date === today);
  if (!record) return res.json({ status: "--", checkin: "--", checkout: "--" });

  res.json(record);
});

// ---- Default route ----
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
