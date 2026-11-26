// Edit this if the frontend (e.g. deployed on Netlify) is hosted separately from the backend API.
//
// - Running everything from the same Node server (npm start): leave this as "" (empty string).
//   All /api/... calls will go to the same origin the page was loaded from.
//
// - Deploying ONLY the "public" folder to Netlify (static hosting) while the Express + MongoDB
//   backend runs elsewhere (Render, Railway, Fly.io, a VPS, etc.): set this to that backend's
//   full URL, e.g.:
//     const OAS_API_BASE = "https://oas-bay-api.onrender.com";
//
// Netlify only serves static files — it cannot run this project's Node/Express/MongoDB backend
// directly. The backend must be deployed to a Node-capable host, and this value must point to it.
const OAS_API_BASE = "";
