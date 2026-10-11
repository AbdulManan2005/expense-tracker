const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const messageBox = document.getElementById("message");

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  messageBox.hidden = false;
}

function hideMessage() {
  messageBox.hidden = true;
}

function showTab(tab) {
  const isLogin = tab === "login";
  loginTab.classList.toggle("active", isLogin);
  registerTab.classList.toggle("active", !isLogin);
  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;
  hideMessage();
}

loginTab.addEventListener("click", () => showTab("login"));
registerTab.addEventListener("click", () => showTab("register"));

// ---------- Login ----------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const button = loginForm.querySelector("button");

  button.disabled = true;
  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    saveSession(data.token, data.user);
    window.location.href = "dashboard.html";
  } catch (err) {
    showMessage(err.message, "error");
  } finally {
    button.disabled = false;
  }
});

// ---------- Register ----------
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const button = registerForm.querySelector("button");

  button.disabled = true;
  try {
    await apiRequest("/auth/register", {
      method: "POST",
      body: { name, email, password },
    });

    // Switch to login and prefill the email
    showTab("login");
    document.getElementById("loginEmail").value = email;
    showMessage("Account created successfully. Please log in.", "success");
    registerForm.reset();
  } catch (err) {
    showMessage(err.message, "error");
  } finally {
    button.disabled = false;
  }
});