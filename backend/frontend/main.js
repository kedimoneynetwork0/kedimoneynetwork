
// Basic helper to POST data
async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Handle login form
if (window.location.pathname.includes("login.html")) {
  document.querySelector("form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;
    const result = await postData("/api/login", { username, password });
    if (result.success) {
      localStorage.setItem("user", username);
      window.location.href = "dashboard.html";
    } else {
      alert("Login failed!");
    }
  });
}

// Handle signup form
if (window.location.pathname.includes("signup.html")) {
  document.querySelector("form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;
    const result = await postData("/api/signup", { username, password });
    if (result.success) {
      alert("Signup success! You can login now.");
      window.location.href = "login.html";
    }
  });
}

// Handle transaction forms
if (
  window.location.pathname.includes("fomukw.html") ||
  window.location.pathname.includes("kubikuza.html") ||
  window.location.pathname.includes("kugurizwa.html")
) {
  document.querySelector("form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {};
    formData.forEach((value, key) => (payload[key] = value));
    payload.user = localStorage.getItem("user");
    const result = await postData("/api/submit", payload);
    if (result.success) {
      alert("Transaction submitted!");
    }
  });
}

// Load history on history.html
if (window.location.pathname.includes("dashboard.html")) {
  fetch("/api/history")
    .then((res) => res.json())
    .then((data) => {
      const user = localStorage.getItem("user");
      const table = document.querySelector("#history");
      if (table) {
        data
          .filter((entry) => entry.user === user)
          .forEach((entry) => {
            const row = document.createElement("tr");
            Object.values(entry).forEach((val) => {
              const td = document.createElement("td");
              td.textContent = val;
              row.appendChild(td);
            });
            table.appendChild(row);
          });
      }
    });
}

// Set user name on dashboard
document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("user");
  if (user && document.getElementById("user-name")) {
    document.getElementById("user-name").textContent = user;
  }
});

// Logout function
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
