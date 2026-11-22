# Guardly Authentication System

A full-stack authentication project built with Node.js, Express, SQLite, and vanilla HTML/CSS/JavaScript.

It lets a user create an account, sign in, access a protected dashboard, and log out. Passwords are salted and hashed with `bcryptjs`; they are never stored as plain text.

## Features

- User registration with name, username, email, and password
- Password validation: at least 8 characters and at least 1 number
- Duplicate username and email protection
- Login using either a username or email
- Generic invalid-credential message, so the app does not reveal which field was incorrect
- Server-side session authentication using `express-session`
- Protected `/dashboard` route that redirects unauthenticated visitors to `/login`
- Logout that destroys the active session and returns the user to the login page
- Password visibility toggle on registration and login forms
- Responsive login, registration, and dashboard layouts
- Local SQLite database created automatically on first run

## Technology

| Area             | Tool                            |
| ---------------- | ------------------------------- |
| Server           | Node.js + Express               |
| Database         | SQLite via `sql.js`             |
| Password hashing | `bcryptjs`                      |
| Sessions         | `express-session`               |
| Client           | HTML5, CSS3, vanilla JavaScript |

`sql.js` is used because it provides SQLite without a native C++ build step. This avoids the `node-gyp` installation problem that can happen with native SQLite packages on newer Node.js versions.

## Project structure

```text
auth-system/
├── data/                 # Created automatically; contains auth.db
├── public/
│   ├── auth.js           # Registration and login form behavior
│   ├── dashboard.js      # Session check and logout behavior
│   ├── login.html
│   ├── register.html
│   └── styles.css
├── views/
│   └── dashboard.html    # Not publicly served without authentication
├── server.js             # Express server, routes, sessions, and database logic
├── package.json
└── README.md
```

## Installation

### 1. Requirements

Install a current LTS version of [Node.js](https://nodejs.org/). Node.js 20 or 22 LTS is recommended for a smoother development experience.

### 2. Install dependencies

Open PowerShell in the `auth-system` folder, then run:

```powershell
npm install
```

If an earlier failed install left a partial `node_modules` folder, first close any running Node process or editor using the project, then run:

```powershell
Remove-Item -LiteralPath .\node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath .\package-lock.json -Force -ErrorAction SilentlyContinue
npm install
```

### 3. Set a session secret

For local development, the app includes a fallback secret. Before deploying or sharing the application, create a strong random secret and set it in your terminal session:

```powershell
$env:SESSION_SECRET = "replace-this-with-a-long-random-secret"
```

### 4. Start the server

```powershell
npm start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

For development with automatic server restarts:

```powershell
npm run dev
```

## How to test the app

1. Open `/register` and create an account.
2. Try a password shorter than eight characters or without a number; the app should reject it.
3. Register successfully and confirm that you are redirected to `/dashboard`.
4. Open a private browser window and visit `/dashboard`; you should be redirected to `/login`.
5. Log out and verify that `/dashboard` is no longer available without logging in again.
6. Try registering with the same username or email; the app should display a duplicate-account message.
7. Try logging in with the wrong password; the app should show only the generic credential error.

## API routes

| Method | Route           | Purpose                                    |
| ------ | --------------- | ------------------------------------------ |
| `POST` | `/api/register` | Validates and creates a user account       |
| `POST` | `/api/login`    | Verifies credentials and creates a session |
| `GET`  | `/api/session`  | Returns the active authenticated user      |
| `POST` | `/api/logout`   | Destroys the active session                |
| `GET`  | `/dashboard`    | Protected dashboard page                   |

## Security notes

This project is intended for learning and portfolio demonstration. It follows important basics—bcrypt password hashing, HTTP-only session cookies, generic login errors, and server-side route protection—but a production application should also add:

- HTTPS and `secure: true` cookies
- A persistent session store instead of Express's default in-memory store
- CSRF protection
- Rate limiting on login and registration endpoints
- Password-reset and email-verification flows
- Environment-variable management with a `.env` file that is never committed
- Input sanitisation, security headers, and production logging

## Licence
