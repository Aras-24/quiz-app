import { API_BASE } from "./config.js";


const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegister = document.getElementById("showRegister");
const message = document.getElementById("message");
const formTitle = document.getElementById("formTitle");
const toggleText = document.getElementById("toggleText");

// Umschalten zwischen Login und Registrierung
showRegister.addEventListener("click", (e) => {
  e.preventDefault();
  const isLoginVisible = !loginForm.classList.contains("hidden");

  if (isLoginVisible) {
    // Zu Registrierung wechseln
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    formTitle.textContent = "Konto erstellen";
    showRegister.textContent = "Zurück zum Login";
    toggleText.firstChild.textContent = "Bereits ein Konto? ";
  } else {
    // Zu Login wechseln
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden"); 
    formTitle.textContent = "Quiz App Login";
    showRegister.textContent = "Jetzt registrieren";
    toggleText.firstChild.textContent = "Noch kein Konto? ";
  }
  message.textContent = "";
});

// Hilfsfunktion für Nachrichten
function displayMessage(text, type) {
  message.textContent = text;
  message.className = type; // 'error' oder 'success'
}

// Login Event
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  displayMessage("", "");

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      displayMessage(data.error || "Login fehlgeschlagen", "error");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", username);
    localStorage.setItem("role", data.role);
    // Weiterleitung je nach Rolle
    if (data.role === "ROLE_ADMIN") {
      window.location.href = "admin.html"; // Admin Panel
    } else {
      window.location.href = "index.html"; // Normaler User
    }
    
  } catch (err) {
    displayMessage("Serverfehler. Bitte später erneut versuchen.", "error");
  }
});

// Registrierung Event
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  displayMessage("", "");

  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      displayMessage(data.error || "Registrierung fehlgeschlagen", "error");
      return;
    }

    displayMessage("Erfolgreich! Bitte logge dich jetzt ein.", "success");

    // Automatisch zum Login zurückwechseln nach 2 Sekunden
    setTimeout(() => {
      showRegister.click();
    }, 2000);
  } catch (err) {
    displayMessage("Serverfehler. Bitte später erneut versuchen.", "error");
  }
});
