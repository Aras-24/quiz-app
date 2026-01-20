document.addEventListener("DOMContentLoaded", () => {
  // Erkennt automatisch ob Render oder Localhost genutzt werden soll
  const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://quiz-app-9xz2.onrender.com";

  const EXAM_CONFIG = {
    SECONDS_PER_QUESTION: 60,
    PASS_PERCENTAGE: 60,
    QUESTIONS_LIMIT: 10,
  };

  const state = {
    questions: [],
    currentIndex: 0,
    score: 0,
    isExamMode: false,
    userAnswers: [],
    timer: null,
    timeLeft: 0,
    token: localStorage.getItem("token"),
    username: localStorage.getItem("username"),
  };

  const modeSelection = document.getElementById("modeSelection");
  const quizContainer = document.getElementById("quizContainer");

  if (!state.token) {
    window.location.href = "login.html";
    return;
  }
  
  // XSS Schutz für den Header-Namen
  document.getElementById("username").textContent = state.username;

  const resetToMenu = () => {
    if (state.timer) clearInterval(state.timer);
    window.location.reload();
  };

  // --- QUIZ FUNKTIONEN ---

  const startQuiz = async (category, isExam) => {
    state.isExamMode = isExam;
    state.currentIndex = 0;
    state.score = 0;
    state.userAnswers = [];

    modeSelection.classList.add("hidden");
    quizContainer.classList.remove("hidden");
    quizContainer.innerHTML = `<div class="animate-in" style="text-align:center;"><h3>Fragen werden geladen...</h3></div>`;

    try {
      const limitParam = isExam ? `&limit=${EXAM_CONFIG.QUESTIONS_LIMIT}` : "";
      const res = await fetch(`${API_BASE_URL}/api/quiz?category=${category}${limitParam}`, {
          headers: { Authorization: `Bearer ${state.token}` },
      });
      const data = await res.json();
      state.questions = data.questions || [];

      if (isExam && state.questions.length > 0) {
        startGlobalTimer(state.questions.length * EXAM_CONFIG.SECONDS_PER_QUESTION);
      }
      renderQuestion();
    } catch (e) {
      quizContainer.innerHTML = "<p>Fehler beim Laden vom Server.</p>";
    }
  };

  // --- SICHERES RANKING MIT XSS-SCHUTZ ---
  document.getElementById("rankingBtn").onclick = async () => {
    modeSelection.classList.add("hidden");
    quizContainer.classList.remove("hidden");
    quizContainer.innerHTML = "<h3>Lade Bestenliste...</h3>";
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/ranking`, {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      const d = await res.json();
      
      quizContainer.innerHTML = `<h3>🏆 Bestenliste</h3>`;
      const table = document.createElement("table");
      table.style.width = "100%";
      const tbody = document.createElement("tbody");

      d.ranking.forEach((r, i) => {
        const tr = document.createElement("tr");
        const isMe = r.username === state.username;
        if (isMe) tr.className = "ranking-row-me";

        // Zellen mit textContent erstellen (SICHER GEGEN XSS)
        const tdMedal = document.createElement("td");
        tdMedal.textContent = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
        
        const tdName = document.createElement("td");
        tdName.textContent = r.username; // HIER: Sonderzeichen werden einfach als Text gezeigt

        const tdScore = document.createElement("td");
        tdScore.textContent = r.score + " Pkt.";
        tdScore.style.textAlign = "right";

        const tdTime = document.createElement("td");
        tdTime.textContent = r.timeUsed + "s";
        tdTime.style.textAlign = "right";

        tr.append(tdMedal, tdName, tdScore, tdTime);
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      quizContainer.appendChild(table);
      
      const backBtn = document.createElement("button");
      backBtn.className = "btn-primary";
      backBtn.textContent = "Zurück";
      backBtn.style.marginTop = "20px";
      backBtn.onclick = resetToMenu;
      quizContainer.appendChild(backBtn);

    } catch (e) {
      resetToMenu();
    }
  };

  // ... (Restliche Timer & Question Logik bleibt gleich, verwende aber immer textContent für User-Inputs)

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "login.html";
  };
  
  document.getElementById("startExamBtn").onclick = () => startQuiz("all", true);
  
  // Hier weitere Event-Listener einfügen...
});