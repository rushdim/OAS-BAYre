// Shared helpers used by every page. Depends on config.js being loaded first (defines OAS_API_BASE).

async function apiFetch(url, options = {}) {
  const base = typeof OAS_API_BASE !== "undefined" ? OAS_API_BASE : "";
  const res = await fetch(base + url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// Call at the top of every protected page. Redirects to login if not authenticated.
// If adminOnly is true, shows an access-denied message instead of the page content for non-admins.
async function requireAuth(adminOnly = false) {
  let user = null;
  try {
    const result = await apiFetch("/api/auth/me");
    user = result.user;
  } catch (err) {
    // Backend unreachable (e.g. frontend deployed without a configured API base) — treat as logged out.
    user = null;
  }

  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  if (adminOnly && user.role !== "admin") {
    document.querySelector(".main").innerHTML =
      '<div class="card"><h2>Access denied</h2><p>This page is only available to admin accounts.</p><a class="btn" href="dashboard.html">Back to dashboard</a></div>';
    throw new Error("access denied");
  }
  renderSidebar(user);
  return user;
}

function renderSidebar(user) {
  const el = document.getElementById("sidebar");
  if (!el) return;
  const page = window.location.pathname.split("/").pop() || "dashboard.html";
  const link = (href, label) => `<a href="${href}" class="${page === href ? "active" : ""}">${label}</a>`;

  el.innerHTML = `
    <div class="brand">
      <h1>OAS Bay</h1>
      <span>Oyera Auto Service Bay Ltd</span>
    </div>
    <nav>
      ${link("dashboard.html", "Dashboard")}
      ${link("visits.html", "Service Visits")}
      ${link("visit-new.html", "+ New Visit")}
      ${link("customers.html", "Customers")}
      ${link("cars.html", "Cars")}
      ${link("parts.html", "Parts Inventory")}
      ${link("technicians.html", "Technicians")}
      ${user.role === "admin" ? link("reports.html", "Reports") : ""}
    </nav>
    <div class="user-box">
      <div><strong>${escapeHtml(user.name)}</strong></div>
      <div style="opacity:.7;">${user.role}</div>
      <form id="logoutForm"><button type="submit">Log out</button></form>
    </div>
  `;

  document.getElementById("logoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "login.html";
  });

  setupResponsiveNav();
}

// Adds a hamburger toggle button (mobile only, via CSS) and wires it to open/close the sidebar,
// plus an overlay so tapping outside the menu closes it again.
function setupResponsiveNav() {
  if (document.getElementById("navToggle")) return; // already set up

  const toggle = document.createElement("button");
  toggle.id = "navToggle";
  toggle.className = "nav-toggle no-print";
  toggle.setAttribute("aria-label", "Toggle menu");
  toggle.innerHTML = "&#9776;";
  document.body.appendChild(toggle);

  const overlay = document.createElement("div");
  overlay.id = "navOverlay";
  overlay.className = "nav-overlay";
  document.body.appendChild(overlay);

  const sidebar = document.getElementById("sidebar");

  function closeNav() {
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
  }
  function openNav() {
    sidebar.classList.add("open");
    overlay.classList.add("visible");
  }

  toggle.addEventListener("click", () => {
    sidebar.classList.contains("open") ? closeNav() : openNav();
  });
  overlay.addEventListener("click", closeNav);

  // Close the menu after navigating (mobile) so it doesn't stay open on the next page load.
  sidebar.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", closeNav));
}

// Redirect away from login/register if already authenticated
async function redirectIfLoggedIn() {
  try {
    const { user } = await apiFetch("/api/auth/me");
    if (user) window.location.href = "dashboard.html";
  } catch (err) {
    // Backend unreachable — stay on the login/register page.
  }
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function money(n) {
  return Number(n || 0).toLocaleString();
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}
