require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

// Only needed if the frontend is deployed separately (e.g. Netlify) from this backend.
// Set FRONTEND_ORIGIN in .env to that frontend's exact URL, e.g. https://oas-bay.netlify.app
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || null;
const isProduction = process.env.NODE_ENV === "production";

const authApi = require("./routes/api/auth");
const dashboardApi = require("./routes/api/dashboard");
const customersApi = require("./routes/api/customers");
const carsApi = require("./routes/api/cars");
const partsApi = require("./routes/api/parts");
const techniciansApi = require("./routes/api/technicians");
const visitsApi = require("./routes/api/visits");
const reportsApi = require("./routes/api/reports");

const app = express();

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// If the frontend is on a different origin (e.g. Netlify), it must send credentials, and this
// server must echo back that exact origin (not "*") with credentials allowed.
if (FRONTEND_ORIGIN) {
  app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "oas_bay_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      // Cross-site cookies (frontend on a different domain) require SameSite=None + Secure (HTTPS).
      sameSite: FRONTEND_ORIGIN ? "none" : "lax",
      secure: FRONTEND_ORIGIN ? true : isProduction,
    },
  })
);

// JSON API
app.use("/api/auth", authApi);
app.use("/api/dashboard", dashboardApi);
app.use("/api/customers", customersApi);
app.use("/api/cars", carsApi);
app.use("/api/parts", partsApi);
app.use("/api/technicians", techniciansApi);
app.use("/api/visits", visitsApi);
app.use("/api/reports", reportsApi);

// Static HTML/CSS/JS frontend
app.use(express.static(path.join(__dirname, "public")));

// Fallback: any unmatched non-API route goes to the login page
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`OAS Bay running on http://localhost:${PORT}`));
