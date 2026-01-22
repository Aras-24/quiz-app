// index.js
import { API_BASE } from "./config.js"; 
import { escapeHtml } from "./escapeHtml.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- KONFIGURATION ---
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

  // Authentifizierungs-Check
  if (!state.token) {
    window.location.href = "login.html";
    return;
  }
  document.getElementById("username").textContent = escapeHtml(state.username);

  // --- NAVIGATION & TIMER ---

  // Führt zum Hauptmenü zurück, ohne Logout
  const resetToMenu = () => {
    if (state.timer) clearInterval(state.timer);
    window.location.reload();
  };

  const startGlobalTimer = (totalSeconds) => {
    if (state.timer) clearInterval(state.timer);
    state.timeLeft = totalSeconds;
    updateTimerUI();
    state.timer = setInterval(() => {
      state.timeLeft--;
      updateTimerUI();
      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        alert("Zeit abgelaufen!");
        finishQuiz();
      }
    }, 1000);
  };

  const updateTimerUI = () => {
    const timerEl = document.getElementById("examTimer");
    if (timerEl) {
      const min = Math.floor(state.timeLeft / 60);
      const sec = state.timeLeft % 60;
      timerEl.textContent = `Restzeit: ${min}:${sec < 10 ? "0" : ""}${sec}`;
      if (state.timeLeft <= 30) timerEl.style.color = "var(--danger)";
    }
  };

  // --- QUIZ LOGIK ---

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
      const res = await fetch(
       `${API_BASE}/api/quiz?category=${category}${limitParam}`,
        {
          headers: { Authorization: `Bearer ${state.token}`,"X-Requested-With": "XMLHttpRequest",  },
        },
      );
      const data = await res.json();
      state.questions = data.questions || [];

      if (isExam && state.questions.length > 0) {
        startGlobalTimer(
          state.questions.length * EXAM_CONFIG.SECONDS_PER_QUESTION,
        );
      }
      renderQuestion();
    } catch (e) {
      quizContainer.innerHTML = "<p>Fehler beim Laden.</p>";
    }
  };

  const renderQuestion = () => {
    if (state.currentIndex >= state.questions.length) return finishQuiz();

    const q = state.questions[state.currentIndex];
    const progress = (state.currentIndex / state.questions.length) * 100;

    quizContainer.innerHTML = `
            <div class="animate-in">
                <div class="progress-container"><div class="progress-bar" style="width: ${progress}%"></div></div>
                <div class="status-bar">
                    <button id="abortBtn" class="btn-logout" style="padding: 5px 15px; border: 1px solid var(--danger);">✖ Abbruch</button>
                    <span>Frage ${state.currentIndex + 1} von ${state.questions.length}</span>
                    ${state.isExamMode ? `<b id="examTimer" style="background:#eee; padding:5px 10px; border-radius:8px;"></b>` : "<span>Übung</span>"}
                </div>
                <div class="question-box">${escapeHtml(q.question)}</div>
                <div id="actionArea"></div>
                <div id="feedback" class="hidden animate-in" style="margin-top:20px; font-weight:bold; padding:20px; border-radius:15px; background:#f8fafc; border:1px solid #eee;"></div>
                <button id="nextBtn" class="btn-primary hidden" style="margin-top:15px;">Nächste Frage</button>
            </div>
        `;

    if (state.isExamMode) updateTimerUI();
    document.getElementById("abortBtn").onclick = resetToMenu;

    const area = document.getElementById("actionArea");
    if (q.type === "MC") {
      const grid = document.createElement("div");
      grid.className = "answer-grid";
      q.answers.forEach((ans, i) => {
        const btn = document.createElement("button");
        btn.className = "answer-btn";
        btn.textContent = escapeHtml(ans.text);
        btn.onclick = () => checkAnswer(i, btn);
        grid.appendChild(btn);
      });
      area.appendChild(grid);
    } else {
      area.innerHTML = `
                <input type="text" id="openInput" class="styled-input" placeholder="Deine Antwort..." autofocus>
                <button id="submitBtn" class="btn-primary" style="margin-top:10px;">Bestätigen</button>
            `;
      const input = document.getElementById("openInput");
      input.onkeypress = (e)  => {
        if (e.key === "Enter") checkAnswer(input.value.trim());
      };
      document.getElementById("submitBtn").onclick = () =>
        checkAnswer(input.value.trim());
    }
  };

  const checkAnswer = (choice, btn = null) => {
    if (
      !state.isExamMode &&
      !document.getElementById("nextBtn").classList.contains("hidden")
    )
      return;

    const q = state.questions[state.currentIndex];
    let isCorrect = false;
    let userText = choice;

    if (q.type === "MC") {
      isCorrect = q.answers[choice].correct;
      userText = q.answers[choice].text;
      if (!state.isExamMode) {
        if (isCorrect) btn.classList.add("correct-flash");
        else {
          btn.classList.add("shake", "wrong-flash");
          document.querySelectorAll(".answer-btn").forEach((b, idx) => {
            if (q.answers[idx].correct) b.classList.add("correct-flash");
          });
        }
      }
    } else {
      isCorrect = q.keywords.some((k) =>
        choice.toLowerCase().includes(k.toLowerCase()),
      );
    }

    if (isCorrect) state.score++;

    state.userAnswers.push({
      question: q.question,
      userChoice: userText,
      correctAnswer:
        q.type === "MC" ? q.answers.find((a) => a.correct).text : q.solution,
      isCorrect: isCorrect,
    });

    if (state.isExamMode) {
      state.currentIndex++;
      renderQuestion();
    } else {
      showFeedback(isCorrect, q);
    }
  };

  const showFeedback = (isCorrect, q) => {
    const fArea = document.getElementById("feedback");
    fArea.classList.remove("hidden");
    const solution =
      q.type === "MC" ? q.answers.find((a) => a.correct).text : q.solution;
    fArea.innerHTML = isCorrect
      ? `<p style="color:var(--success)">Richtig!</p>`
      : `<p style="color:var(--danger)"> Falsch. Lösung: ${escapeHtml(solution)}</p>`;
    document
      .querySelectorAll("#actionArea button, #actionArea input")
      .forEach((el) => (el.disabled = true));
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.classList.remove("hidden");
    nextBtn.onclick = () => {
      state.currentIndex++;
      renderQuestion();
    };
  };

  const finishQuiz = async () => {
    if (state.timer) clearInterval(state.timer);

    const timeUsed =
      state.questions.length * EXAM_CONFIG.SECONDS_PER_QUESTION -
      state.timeLeft;
    const percentage = (state.score / state.questions.length) * 100;
    const passed = percentage >= EXAM_CONFIG.PASS_PERCENTAGE;

    quizContainer.innerHTML = `
            <div class="animate-in" style="text-align:center;">
                <div style="font-size: 5rem;">${passed ? "🏆" : "📉"}</div>
                <h2>${state.isExamMode ? (passed ? "Bestanden!" : "Nicht gereicht") : "Training beendet!"}</h2>
                <div class="question-box" style="font-size:2.5rem; margin:1rem 0;">
                    ${state.score} / ${state.questions.length}
                </div>
                <p>Zeit: ${Math.floor(timeUsed / 60)}m ${timeUsed % 60}s</p>
                ${state.isExamMode ? `<button id="reviewBtn" class="btn-primary" style="background:#64748b; margin-bottom:10px;">Review</button>` : ""}
                <button onclick="location.reload()" class="btn-primary">Menü</button>
            </div>
        `;

    if (state.isExamMode) {
      document.getElementById("reviewBtn").onclick = renderReview;
      const res = await fetch(`${API_BASE}/api/quiz/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          score: state.score,
          isExam: true,
          timeUsed: timeUsed,
        }),
      });
      const result = await res.json();
      if (result.isNumberOne) showNumberOneAnimation();
    }
  };

  const renderReview = () => {
    let h = `<h3>Review</h3><div style="text-align:left; max-height: 400px; overflow-y: auto; margin-top:15px;">`;
    state.userAnswers.forEach((ans, i) => {
      h += `<div style="padding:15px; border-bottom:1px solid #eee; border-left: 5px solid ${ans.isCorrect ? "var(--success)" : "var(--danger)"}; margin-bottom:10px; background:#fff; border-radius:10px;">
                    <strong>${i + 1}. ${escapeHtml(ans.question)}</strong><br>
                    <span style="color:${ans.isCorrect ? "var(--success)" : "var(--danger)"}">Deine Antwort: ${ans.userChoice}</span><br>
                    ${!ans.isCorrect ? `<span style="color:var(--success)">Lösung: ${ans.correctAnswer}</span>` : ""}
                </div>`;
    });
    quizContainer.innerHTML =
      h +
      `</div><button onclick="location.reload()" class="btn-primary" style="margin-top:20px;">Menü</button>`;
  };

  const showNumberOneAnimation = () => {
    const overlay = document.createElement("div");
    overlay.className = "king-overlay";
    overlay.innerHTML = `
            <div style="font-size: 8rem; animation: crownBounce 1s infinite alternate;">👑</div>
            <h1 style="font-size: 3rem; margin:20px;">NEUE NUMMER 1!</h1>
            <p>Du bist der Champion!</p>
            <button id="closeKing" class="btn-primary" style="margin-top:30px; background:gold; color:black; width:auto; padding:10px 30px;">Wahnsinn!</button>
        `;
    document.body.appendChild(overlay);
    document.getElementById("closeKing").onclick = () => overlay.remove();
  };

  // --- EVENTS ---
  document.getElementById("startExamBtn").onclick = () =>
    startQuiz("all", true);

  document.getElementById("startLearningBtn").onclick = async () => {
    modeSelection.classList.add("hidden");
    quizContainer.classList.remove("hidden");
    quizContainer.innerHTML = "<h3>Lade Kategorien...</h3>";
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        headers: { Authorization: `Bearer ${state.token}`, "X-Requested-With": "XMLHttpRequest",},
      });
      const data = await res.json();
      quizContainer.innerHTML = `<h3>Thema wählen</h3><div id="catGrid" class="answer-grid"></div><button id="catBack" class="btn-primary" style="margin-top:20px; background:#444;">Zurück</button>`;
      document.getElementById("catBack").onclick = resetToMenu;
      data.categories.forEach((c) => {
        const b = document.createElement("button");
        b.className = "answer-btn";
        b.textContent = escapeHtml(c);
        b.onclick = () => startQuiz(c, false);
        document.getElementById("catGrid").appendChild(b);
      });
    } catch (e) {
      resetToMenu();
    }
  };

  document.getElementById("rankingBtn").onclick = async () => {
    modeSelection.classList.add("hidden");
    quizContainer.classList.remove("hidden");
    try {
      const res = await fetch(`${API_BASE}/api/ranking`, {
        headers: { Authorization: `Bearer ${state.token}`,"X-Requested-With": "XMLHttpRequest" },
      });
      const d = await res.json();
      let h = `<h3>🏆 Bestenliste</h3><table style="width:100%; margin-top:10px;">
                        <thead><tr style="text-align:left;"><th>#</th><th>Name</th><th>Pkt.</th><th>Zeit</th></tr></thead><tbody>`;
      d.ranking.forEach((r, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;

        // Prüfen, ob der Eintrag dem aktuell eingeloggten User gehört
        const isMe = r.username === state.username;

    h += `<tr class="${isMe ? 'ranking-row-me' : ''}">
            <td style="padding:15px; font-weight:bold;">${medal}</td>
            <td style="padding:15px;">${escapeHtml(r.username)}</td>
            <td style="padding:15px; text-align:right; font-weight:bold;">${r.score}</td>
            <td style="padding:15px; text-align:right;">${r.timeUsed}s</td>
          </tr>`;
      });
      quizContainer.innerHTML =
        h +
        `</tbody></table><button onclick="location.reload()" class="btn-primary" style="margin-top:20px;">Zurück</button>`;
    } catch (e) {
      resetToMenu();
    }
  };

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "login.html";
  };
});
