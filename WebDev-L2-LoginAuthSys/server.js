const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const initSqlJs = require("sql.js");

const app = express();
const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "public");
const dataDirectory = path.join(__dirname, "data");

fs.mkdirSync(dataDirectory, { recursive: true });
const databasePath = path.join(dataDirectory, "auth.db");
let database;

function getOne(sql, parameters = []) {
  const statement = database.prepare(sql);
  statement.bind(parameters);
  const result = statement.step() ? statement.getAsObject() : undefined;
  statement.free();
  return result;
}

function runStatement(sql, parameters = []) {
  database.run(sql, parameters);
  fs.writeFileSync(databasePath, Buffer.from(database.export()));
}

async function initializeDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) =>
      path.join(__dirname, "node_modules", "sql.js", "dist", file),
  });
  database = fs.existsSync(databasePath)
    ? new SQL.Database(fs.readFileSync(databasePath))
    : new SQL.Database();
  runStatement(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "replace-this-development-secret-before-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);
app.use("/assets", express.static(publicDirectory));

function isValidPassword(password) {
  return (
    typeof password === "string" && password.length >= 8 && /\d/.test(password)
  );
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
  };
}

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

app.get("/", (req, res) =>
  res.redirect(req.session.userId ? "/dashboard" : "/login"),
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(publicDirectory, "login.html")),
);
app.get("/register", (req, res) =>
  res.sendFile(path.join(publicDirectory, "register.html")),
);
app.get("/dashboard", requireAuth, (req, res) =>
  res.sendFile(path.join(__dirname, "views", "dashboard.html")),
);

app.get("/api/session", (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ authenticated: false });
  const user = getOne(
    "SELECT id, name, username, email FROM users WHERE id = ?",
    [req.session.userId],
  );
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ authenticated: false });
  }
  return res.json({ authenticated: true, user: safeUser(user) });
});

app.post("/api/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !username || !email || !password)
    return res.status(400).json({ message: "Please complete every field." });
  if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username))
    return res
      .status(400)
      .json({
        message:
          "Use 3–24 letters, numbers, dots, hyphens, or underscores for your username.",
      });
  if (!/^\S+@\S+\.\S+$/.test(email))
    return res.status(400).json({ message: "Enter a valid email address." });
  if (!isValidPassword(password))
    return res
      .status(400)
      .json({
        message: "Use at least 8 characters and include at least 1 number.",
      });

  const existingUser = getOne(
    "SELECT id FROM users WHERE username = ? OR email = ?",
    [username, email],
  );
  if (existingUser)
    return res
      .status(409)
      .json({ message: "That username or email is already registered." });

  const passwordHash = await bcrypt.hash(password, 12);
  runStatement(
    "INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)",
    [name, username, email, passwordHash],
  );
  req.session.userId = Number(
    database.exec("SELECT last_insert_rowid() AS id")[0].values[0][0],
  );
  return res
    .status(201)
    .json({ message: "Account created.", redirect: "/dashboard" });
});

app.post("/api/login", async (req, res) => {
  const identifier = String(req.body.identifier || "").trim();
  const password = String(req.body.password || "");
  if (!identifier || !password)
    return res
      .status(400)
      .json({ message: "Enter your username or email and password." });

  const user = getOne("SELECT * FROM users WHERE username = ? OR email = ?", [
    identifier,
    identifier.toLowerCase(),
  ]);
  const credentialsAreValid =
    user && (await bcrypt.compare(password, user.password_hash));
  if (!credentialsAreValid)
    return res
      .status(401)
      .json({ message: "Invalid username/email or password." });

  req.session.userId = user.id;
  return res.json({ message: "Welcome back.", redirect: "/dashboard" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ redirect: "/login" });
  });
});

initializeDatabase()
  .then(() =>
    app.listen(port, () =>
      console.log(`Secure auth demo running at http://localhost:${port}`),
    ),
  )
  .catch((error) => {
    console.error("Could not initialise the SQLite database:", error);
    process.exit(1);
  });
