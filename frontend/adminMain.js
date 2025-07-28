// adminMain.js

document.addEventListener("DOMContentLoaded", () => {
  const adminForm = document.getElementById("adminLoginForm");
  const approveBtnClass = ".approve-btn";
  const rejectBtnClass = ".reject-btn";

  // Helper: Fata token y'admin
  function getAdminToken() {
    return localStorage.getItem("adminToken");
  }

  // ADMIN LOGIN
  if (adminForm) {
    adminForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("adminUsername").value.trim();
      const password = document.getElementById("adminPassword").value.trim();

      if (username === "kedimoneynetwork" && password === "kedimoney") {
        localStorage.setItem("adminToken", "valid");
        window.location.href = "admin.html";
      } else {
        alert("Invalid admin credentials.");
      }
    });
  }

  // Redirect niba atari admin yinjiriye ku admin.html
  if (!getAdminToken() && window.location.pathname.includes("admin.html")) {
    window.location.href = "admin-login.html";
  }

  // LOGOUT FUNCTION
  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("adminToken");
      window.location.href = "admin-login.html";
    });
  }

  // LOAD PENDING USERS
  async function loadPendingUsers() {
    if (!getAdminToken()) {
      window.location.href = "admin-login.html";
      return;
    }

    try {
      const res = await fetch("/api/admin/users/pending", {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Failed to load pending users.");

      const users = await res.json();
      const pendingUsersTable = document.getElementById("pendingUsersTable");
      if (!pendingUsersTable) return;
      pendingUsersTable.innerHTML = "";

      users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.firstName} ${user.lastName}</td>
          <td>${user.username}</td>
          <td>${user.phone}</td>
          <td>${user.paymentMethod}</td>
          <td>
            <button class="approve-btn" data-id="${user._id}">Approve</button>
            <button class="reject-btn" data-id="${user._id}">Reject</button>
          </td>
        `;
        pendingUsersTable.appendChild(row);
      });
    } catch (err) {
      alert(err.message);
    }
  }

  // HANDLE APPROVE/REJECT BUTTONS
  document.addEventListener("click", async (e) => {
    if (e.target.matches(approveBtnClass)) {
      const userId = e.target.dataset.id;
      try {
        const res = await fetch(`/api/admin/users/approve/${userId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${getAdminToken()}` },
        });
        if (!res.ok) throw new Error("Failed to approve user.");
        alert("User approved!");
        await loadPendingUsers();
      } catch (err) {
        alert(err.message);
      }
    }

    if (e.target.matches(rejectBtnClass)) {
      const userId = e.target.dataset.id;
      try {
        const res = await fetch(`/api/admin/users/reject/${userId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${getAdminToken()}` },
        });
        if (!res.ok) throw new Error("Failed to reject user.");
        alert("User rejected!");
        await loadPendingUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  });

  // LOAD ALL USERS
  async function loadAllUsers() {
    if (!getAdminToken()) {
      window.location.href = "admin-login.html";
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Failed to load all users.");

      const users = await res.json();
      const usersTable = document.getElementById("allUsersTable");
      if (!usersTable) return;
      usersTable.innerHTML = "";

      users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.firstName} ${user.lastName}</td>
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>${user.paymentMethod}</td>
          <td>${user.referralId || "-"}</td>
        `;
        usersTable.appendChild(row);
      });
    } catch (err) {
      alert(err.message);
    }
  }

  // LOAD TOTAL DEPOSITS
  async function loadTotalDeposits() {
    if (!getAdminToken()) return;
    try {
      const res = await fetch("/api/admin/deposits/total", {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Failed to load total deposits.");

      const data = await res.json();
      const totalBox = document.getElementById("totalDeposits");
      if (totalBox) totalBox.innerText = `${data.total} RWF`;
    } catch (err) {
      alert(err.message);
    }
  }

  // LOAD TOP USERS WHO RECEIVED BONUS
  async function loadTopBonusUsers() {
    if (!getAdminToken()) return;
    try {
      const res = await fetch("/api/admin/users/top-bonus", {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Failed to load top bonus users.");

      const users = await res.json();
      const topUsersTable = document.getElementById("topUsersTable");
      if (!topUsersTable) return;
      topUsersTable.innerHTML = "";

      users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.username}</td>
          <td>${user.totalDeposits} RWF</td>
          <td>${user.bonusGiven ? "✅" : "❌"}</td>
        `;
        topUsersTable.appendChild(row);
      });
    } catch (err) {
      alert(err.message);
    }
  }

  // Run loads if on admin.html page
  if (window.location.pathname.includes("admin.html")) {
    loadPendingUsers();
    loadAllUsers();
    loadTotalDeposits();
    loadTopBonusUsers();
  }
});
