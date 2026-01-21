import { API_BASE } from "./config.js";


document.addEventListener("DOMContentLoaded", () => {
  // Admin-Schutz
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!token || role !== "ROLE_ADMIN") {
      alert("Zugriff nur für Admins!");
      window.location.href = "login.html";
      return;
  }

  const username = localStorage.getItem("username");
  const formContainer = document.getElementById("formContainer");
  const questionList = document.getElementById("questionList");

  document.getElementById("username").textContent = username;

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // Buttons: Formulare anzeigen
  document.getElementById("addMCBtn").addEventListener("click", () => showForm("MC"));
  document.getElementById("addOpenBtn").addEventListener("click", () => showForm("OPEN"));

  loadQuestions();

  async function loadQuestions() {
    questionList.innerHTML = "<p>Lade Fragen...</p>";
    try {
      const res = await fetch(`${API_BASE}/api/admin/questions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      renderQuestions(data.questions);
    } catch (err) {
      questionList.innerHTML = `<p class="error">Fehler: ${err.message}</p>`;
    }
  }

  function renderQuestions(questions) {
    questionList.innerHTML = "<h3>Vorhandene Fragen</h3>";
    if (!questions || questions.length === 0) {
        questionList.innerHTML += "<p>Keine Fragen gefunden.</p>";
        return;
    }

    questions.forEach(q => {
      const div = document.createElement("div");
      div.className = "question-item";
      div.innerHTML = `
        <div class="question-info">
          <strong>${q.question}</strong>
          <div style="font-size: 0.8rem; color: #666;">Typ: ${q.type} | Kategorie: ${q.category}</div>
        </div>
        <button class="btn-logout" style="padding: 5px 10px;">Löschen</button>
      `;
      questionList.appendChild(div);
      div.querySelector("button").onclick = () => deleteQuestion(q._id);
    });
  }

  async function deleteQuestion(id) {
    if (!confirm("Frage wirklich löschen?")) return;
    try {
      await fetch(`${API_BASE}/api/admin/questions/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      loadQuestions();
    } catch (err) {
      alert("Fehler beim Löschen");
    }
  }

  function showForm(type) {
    formContainer.innerHTML = "";
    if (type === "MC") createMCForm();
    else createOpenForm();
    formContainer.scrollIntoView({ behavior: 'smooth' });
  }

  function createMCForm() {
    formContainer.innerHTML = `
      <div class="card" style="background: #f9f9fb; border: 1px solid #ddd;">
        <h3>Neue Multiple-Choice Frage</h3>
        <input type="text" id="mcCategory" placeholder="Kategorie (z.B. Biologie)">
        <input type="text" id="mcQuestion" placeholder="Fragetext">
        <div id="mcAnswersContainer"></div>
        <div style="margin-top: 10px; display: flex; gap: 10px;">
            <button id="addAnswerBtn" class="btn-nav" style="background: var(--success);">+ Antwort</button>
            <button id="submitMCBtn" class="btn-nav">Frage Speichern</button>
        </div>
      </div>
    `;

    const answersContainer = document.getElementById("mcAnswersContainer");
    document.getElementById("addAnswerBtn").onclick = () => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.gap = "10px";
      div.style.marginBottom = "5px";
      div.innerHTML = `
        <input type="text" placeholder="Antworttext" style="margin:0;">
        <label style="display:flex; align-items:center; gap:5px;">
          <input type="checkbox"> korrekt
        </label>
      `;
      answersContainer.appendChild(div);
    };

    document.getElementById("submitMCBtn").onclick = async () => {
      const category = document.getElementById("mcCategory").value.trim();
      const question = document.getElementById("mcQuestion").value.trim();
      const answers = Array.from(answersContainer.querySelectorAll("div")).map(div => ({
        text: div.querySelector("input[type=text]").value.trim(),
        correct: div.querySelector("input[type=checkbox]").checked
      }));

      if(!category || !question || answers.length < 2) {
          alert("Bitte Kategorie, Frage und mindestens 2 Antworten angeben!");
          return;
      }

      try {
        await fetch(`${API_BASE}/api/admin/questions`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ type: "MC", category, question, answers })
        });
        alert("Frage gespeichert!");
        formContainer.innerHTML = "";
        loadQuestions();
      } catch (err) {
        alert("Fehler beim Speichern");
      }
    };
  }

  function createOpenForm() {
    formContainer.innerHTML = `
      <div class="card" style="background: #f9f9fb; border: 1px solid #ddd;">
        <h3>Neue Offene Frage</h3>
        <input type="text" id="openCategory" placeholder="Kategorie">
        <input type="text" id="openQuestion" placeholder="Fragetext">
        <input type="text" id="solution" placeholder="Musterlösung">
        <input type="text" id="keywords" placeholder="Keywords (mit Komma trennen)">
        <button id="submitOpenBtn" class="btn-nav" style="margin-top:10px;">Frage Speichern</button>
      </div>
    `;

    document.getElementById("submitOpenBtn").onclick = async () => {
      const category = document.getElementById("openCategory").value.trim();
      const question = document.getElementById("openQuestion").value.trim();
      const solution = document.getElementById("solution").value.trim();
      const keywords = document.getElementById("keywords").value.split(",").map(k => k.trim());

      try {
        await fetch(`${API_BASE}/api/admin/questions`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ type: "OPEN", category, question, solution, keywords })
        });
        alert("Frage gespeichert!");
        formContainer.innerHTML = "";
        loadQuestions();
      } catch (err) {
        alert("Fehler beim Speichern");
      }
    };
  }
});