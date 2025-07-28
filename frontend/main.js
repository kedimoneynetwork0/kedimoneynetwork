// main.js

function redirectIfLoggedIn(page, type = null) {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "login.html";
  if (type) localStorage.setItem("transactionType", type);
  window.location.href = page;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "login.html";
}

function isLoggedIn() {
  return localStorage.getItem("token") !== null;
}

// Admin logout
function adminLogout() {
  localStorage.removeItem("isAdmin");
  window.location.href = "admin-login.html";
}

// Signup form handler
async function signupUser(event) {
  event.preventDefault();
  const form = event.target;

  const fullName = form.firstName.value.trim() + ' ' + form.lastName.value.trim();

  const data = {
    fullName,
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    username: form.username.value.trim(),
    password: form.password.value,
    confirmPassword: form.confirmPassword.value,
    paymentMethod: form.paymentMethod.value,
    txnId: form.txnId.value.trim(),
    referredBy: form.referralId.value.trim() || null,
  };

  if (data.password !== data.confirmPassword) {
    alert("Passwords ntizihuye!");
    return;
  }

  try {
    const res = await fetch("https://kedimoneynetwork.onrender.com/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      alert("Wiyandikishije neza! Tegereza ko admin akwemeza.");
      window.location.href = "login.html";
    } else {
      alert(result.message || "Habaye ikibazo mu kwiyandikisha.");
    }
  } catch (err) {
    alert("Ikibazo cyo guhuza na server.");
  }
}

// Login form handler
async function loginUser(event) {
  event.preventDefault();
  const form = event.target;
  const data = {
    username: form.username.value.trim(),
    password: form.password.value
  };

  try {
    const res = await fetch("https://kedimoneynetwork.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (res.ok) {
      localStorage.setItem("token", result.token);
      localStorage.setItem("username", result.user.fullName || result.user.username);
      window.location.href = "dashboard.html";
    } else {
      alert(result.message || "Login failed.");
    }
  } catch (err) {
    alert("Ikibazo cyo guhuza na server.");
  }
}

// Load username ku page nka dashboard
function loadUsername() {
  const username = localStorage.getItem("username");
  if (username) {
    const el = document.getElementById("username");
    if (el) el.textContent = username;
  }
}

// Load transaction history (dashboard)
async function loadTransactions() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("https://kedimoneynetwork.onrender.com/api/transactions", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const list = document.getElementById("transactionList");
    if (!list) return;
    list.innerHTML = "";

    data.forEach(txn => {
      const li = document.createElement("li");
      li.textContent = `${txn.type}: RWF ${txn.amount} - ${new Date(txn.createdAt).toLocaleDateString()}`;
      list.appendChild(li);
    });
  } catch (err) {
    alert("Ntibyakunze kubona amakuru y'amateka.");
  }
}

// Submit transaction form
async function submitTransaction(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Ugomba kwinjira mbere yo gukora transaction.");
    window.location.href = "login.html";
    return;
  }

  const form = event.target;
  const data = {
    type: form.type.value,
    amount: parseFloat(form.amount.value),
    txnId: form.txnId.value.trim(),
    description: form.description.value.trim()
  };

  try {
    const res = await fetch("https://kedimoneynetwork.onrender.com/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      alert("Transaction yakozwe neza!");
      form.reset();
      window.location.href = "dashboard.html";
    } else {
      alert(result.message || "Habaye ikibazo muri transaction.");
    }
  } catch (err) {
    alert("Ikibazo cyo guhuza na server.");
  }
}

// Load tree data
async function loadTreeData() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("https://kedimoneynetwork.onrender.com/api/users/tree", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    document.getElementById("total-users").textContent = data.totalUsers || 0;
    document.getElementById("total-transactions").textContent = data.totalTransactions || 0;
    document.getElementById("total-amount").textContent = data.totalAmount || 0;
    document.getElementById("tree-nodes").textContent = data.totalNodes || 0;

    const referralsDiv = document.getElementById("referrals");
    referralsDiv.innerHTML = "";

    data.referrals.forEach(ref => {
      const div = document.createElement("div");
      div.textContent = `👤 ${ref.name} - Referral ID: ${ref.referralId} - Downlines: ${ref.downlines.length}`;
      referralsDiv.appendChild(div);
    });
  } catch (err) {
    alert("Ntibyakunze kubona amakuru ya tree plan.");
  }
}

// Export functions for use in HTML
window.isLoggedIn = isLoggedIn;
window.logout = logout;
window.adminLogout = adminLogout;
window.signupUser = signupUser;
window.loginUser = loginUser;
window.loadUsername = loadUsername;
window.loadTransactions = loadTransactions;
window.submitTransaction = submitTransaction;
window.loadTreeData = loadTreeData;
