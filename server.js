require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

// Strip any accidental spaces or trailing slashes from FRONTEND_ORIGIN
const FRONTEND_ORIGIN = (
  process.env.FRONTEND_ORIGIN || "https://oas-bayrushdi.netlify.app"
)
  .trim()
  .replace(/\/+$/, "");

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

// Required on Render/Heroku so secure cross-site session cookies work behind HTTPS proxy
app.set("trust proxy", 1);

connectDB();

// Enable CORS for your Netlify frontend + preflight OPTIONS requests
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "oas_bay_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      sameSite: "none",
      secure: true,
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
