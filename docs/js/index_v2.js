document.addEventListener("DOMContentLoaded", () => {
    // --- ZENTRALE KONFIGURATION ---
    const EXAM_CONFIG = {
        SECONDS_PER_QUESTION: 60,
        PASS_PERCENTAGE: 60,      
        QUESTIONS_LIMIT: 10       
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
        username: localStorage.getItem("username")
    };

    const modeSelection = document.getElementById("modeSelection");
    const quizContainer = document.getElementById("quizContainer");

    if (!state.token) { window.location.href = "login.html"; return; }
    document.getElementById("username").textContent = state.username;

    const startGlobalTimer = (totalSeconds) => {
        if (state.timer) clearInterval(state.timer);
        state.timeLeft = totalSeconds;
        updateTimerUI();
        state.timer = setInterval(() => {
            state.timeLeft--;
            updateTimerUI();
            if (state.timeLeft <= 0) {
                clearInterval(state.timer);
                alert("Zeit abgelaufen! Die Prüfung wird jetzt ausgewertet.");
                finishQuiz();
            }
        }, 1000);
    };

    const updateTimerUI = () => {
        const timerEl = document.getElementById("examTimer");
        if (timerEl) {
            const min = Math.floor(state.timeLeft / 60);
            const sec = state.timeLeft % 60;
            timerEl.textContent = `Restzeit: ${min}:${sec < 10 ? '0' : ''}${sec}`;
            if (state.timeLeft <= 30) timerEl.style.color = "#e74c3c";
        }
    };

    const goBack = () => {
        if (state.timer) clearInterval(state.timer);
        history.back();
    };

    const startQuiz = async (category, isExam) => {
        state.isExamMode = isExam;
        state.currentIndex = 0;
        state.score = 0;
        state.userAnswers = [];
        if (state.timer) clearInterval(state.timer);

        modeSelection.classList.add("hidden");
        quizContainer.classList.remove("hidden");
        quizContainer.innerHTML = "<h3>Fragen werden geladen...</h3>";

        try {
            const limitParam = isExam ? `&limit=${EXAM_CONFIG.QUESTIONS_LIMIT}` : "";
            const res = await fetch(`http://localhost:3000/api/quiz?category=${category}${limitParam}`, {
                headers: { "Authorization": `Bearer ${state.token}` }
            });
            const data = await res.json();
            state.questions = data.questions || [];

            if (isExam && state.questions.length > 0) {
                const totalDuration = state.questions.length * EXAM_CONFIG.SECONDS_PER_QUESTION;
                startGlobalTimer(totalDuration);
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
                <div class="status-bar" style="display:flex; justify-content:space-between; align-items:center;">
                    <button id="abortBtn" class="btn-logout" style="color:var(--danger); border:1px solid var(--danger); padding:5px 10px;">✖ Abbruch</button>
                    <span>Frage ${state.currentIndex + 1}/${state.questions.length}</span>
                    ${state.isExamMode ? `<b id="examTimer" style="background:#eee; padding:5px 10px; border-radius:8px;"></b>` : ''}
                </div>
                <div class="question-box">${q.question}</div>
                <div id="actionArea"></div>
                <div id="feedback" class="hidden animate-in" style="margin-top:20px; font-weight:bold; padding:15px; border-radius:12px; background:#f8fafc;"></div>
                <button id="nextBtn" class="btn-primary hidden" style="margin-top:15px;">Nächste Frage</button>
            </div>
        `;

        if (state.isExamMode) updateTimerUI();

        document.getElementById("abortBtn").onclick = goBack;
        const area = document.getElementById("actionArea");

        if (q.type === "MC") {
            const grid = document.createElement("div");
            grid.className = "answer-grid";
            q.answers.forEach((ans, i) => {
                const btn = document.createElement("button");
                btn.className = "answer-btn";
                btn.textContent = ans.text;
                btn.onclick = () => checkAnswer(i, btn);
                grid.appendChild(btn);
            });
            area.appendChild(grid);
        } else {
            area.innerHTML = `
                <input type="text" id="openInput" class="styled-input" placeholder="Deine Antwort..." autofocus>
                <button id="submitBtn" class="btn-primary" style="margin-top:10px; width:100%;">Senden</button>`;
            const input = document.getElementById("openInput");
            input.onkeypress = (e) => { if (e.key === "Enter") checkAnswer(input.value.trim()); };
            document.getElementById("submitBtn").onclick = () => checkAnswer(input.value.trim());
        }
    };

    const checkAnswer = (choice, btn = null) => {
        if (!state.isExamMode && !document.getElementById("nextBtn").classList.contains("hidden")) return;

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
            isCorrect = q.keywords.some(k => choice.toLowerCase().includes(k.toLowerCase()));
        }

        if (isCorrect) state.score++;

        state.userAnswers.push({
            question: q.question,
            userChoice: userText,
            correctAnswer: q.type === "MC" ? q.answers.find(a => a.correct).text : q.solution,
            isCorrect: isCorrect
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
        const solution = q.type === "MC" ? q.answers.find(a => a.correct).text : q.solution;
        fArea.innerHTML = isCorrect ? `<p style="color:var(--success)">✅ Richtig!</p>` : `<p style="color:var(--danger)">❌ Falsch. Lösung: ${solution}</p>`;
        document.querySelectorAll("#actionArea button, #actionArea input").forEach(el => el.disabled = true);
        const nextBtn = document.getElementById("nextBtn");
        nextBtn.classList.remove("hidden");
        nextBtn.onclick = () => { state.currentIndex++; renderQuestion(); };
    };

    // --- ÜBERARBEITETES FINISH QUIZ (MIT ZEIT & ANIMATION) ---
    const finishQuiz = async () => {
        if (state.timer) clearInterval(state.timer);
        
        const timeUsed = (state.questions.length * EXAM_CONFIG.SECONDS_PER_QUESTION) - state.timeLeft;
        const percentage = (state.score / state.questions.length) * 100;
        const passed = percentage >= EXAM_CONFIG.PASS_PERCENTAGE;

        quizContainer.innerHTML = `
            <div class="animate-in" style="text-align:center;">
                ${state.isExamMode ? `<div style="font-size: 5rem;">${passed ? '🏆' : '📉'}</div>` : ''}
                <h2>${state.isExamMode ? (passed ? 'Bestanden!' : 'Leider nicht gereicht') : 'Training beendet!'}</h2>
                <div class="question-box" style="font-size:2rem; margin:1rem 0;">
                    ${state.score} / ${state.questions.length}
                </div>
                <p>Zeit: ${Math.floor(timeUsed / 60)}m ${timeUsed % 60}s</p>
                ${state.isExamMode ? `<button id="reviewBtn" class="btn-primary" style="background:#64748b; margin-bottom:10px;">Antworten prüfen</button>` : ''}
                <button onclick="location.reload()" class="btn-primary">Zurück zum Menü</button>
            </div>
        `;

        if (state.isExamMode) {
            document.getElementById("reviewBtn").onclick = renderReview;
            const res = await fetch("http://localhost:3000/api/quiz/result", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.token}` },
                body: JSON.stringify({ score: state.score, isExam: true, timeUsed: timeUsed })
            });
            const result = await res.json();
            
            if (result.isNumberOne) showNumberOneAnimation();
            else if (result.newHighscore) alert("🔥 Neuer persönlicher Highscore!");
        }
    };

    const renderReview = () => {
        let h = `<h3>Review</h3><div style="text-align:left; max-height: 400px; overflow-y: auto; margin-top:15px;">`;
        state.userAnswers.forEach((ans, i) => {
            h += `<div style="padding:10px; border-bottom:1px solid #eee; border-left: 5px solid ${ans.isCorrect ? 'var(--success)' : 'var(--danger)'}; margin-bottom:10px;">
                    <strong>${i+1}. ${ans.question}</strong><br>
                    <span style="color:${ans.isCorrect ? 'green' : 'red'}">Deine Antwort: ${ans.userChoice}</span><br>
                    ${!ans.isCorrect ? `<span style="color:green">Lösung: ${ans.correctAnswer}</span>` : ''}
                </div>`;
        });
        quizContainer.innerHTML = h + `<button onclick="location.reload()" class="btn-primary" style="margin-top:20px;">Menü</button>`;
    };

    // --- NEUE HILFSFUNKTION: KÖNIGS-ANIMATION ---
    const showNumberOneAnimation = () => {
        const overlay = document.createElement("div");
        overlay.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999; color:gold; text-align:center; animation: fadeIn 0.5s;`;
        overlay.innerHTML = `
            <div style="font-size: 8rem; animation: crownBounce 1s infinite alternate;">👑</div>
            <h1 style="font-size: 3rem; margin:20px;">NEUE NUMMER 1!</h1>
            <p style="color:white; font-size:1.2rem;">Du hast den Thron bestiegen, ${state.username}!</p>
            <button id="closeKing" class="btn-primary" style="margin-top:30px; background:gold; color:black;">Unglaublich!</button>
        `;
        document.body.appendChild(overlay);
        document.getElementById("closeKing").onclick = () => overlay.remove();
    };

    // --- BUTTON EVENTS ---
    document.getElementById("startExamBtn").onclick = () => startQuiz("all", true);
    
    document.getElementById("startLearningBtn").onclick = async () => {
        modeSelection.classList.add("hidden");
        quizContainer.classList.remove("hidden");
        quizContainer.innerHTML = "<h3>Lade Kategorien...</h3>";
        try {
            const res = await fetch("http://localhost:3000/api/categories", { headers: { "Authorization": `Bearer ${state.token}` } });
            const data = await res.json();
            quizContainer.innerHTML = `<h3>Thema wählen</h3><div id="catGrid" class="answer-grid"></div><button onclick="location.reload()" class="btn-primary" style="margin-top:20px;">Abbrechen</button>`;
            data.categories.forEach(c => {
                const b = document.createElement("button");
                b.className = "answer-btn";
                b.textContent = c;
                b.onclick = () => startQuiz(c, false);
                document.getElementById("catGrid").appendChild(b);
            });
        } catch (e) { location.reload(); }
    };

    // --- ÜBERARBEITETES RANKING (TABELLE MIT ZEIT) ---
    document.getElementById("rankingBtn").onclick = async () => {
        modeSelection.classList.add("hidden");
        quizContainer.classList.remove("hidden");
        quizContainer.innerHTML = "<h3>Lade Highscores...</h3>";
        try {
            const res = await fetch("http://localhost:3000/api/ranking", { headers: { "Authorization": `Bearer ${state.token}` } });
            const d = await res.json();
            let h = `<h3>🏆 Bestenliste</h3><table style="width:100%; border-collapse:collapse; margin-top:10px;">
                        <thead>
                            <tr style="border-bottom:2px solid #ddd; text-align:left;">
                                <th style="padding:10px;">#</th>
                                <th style="padding:10px;">Name</th>
                                <th style="padding:10px; text-align:right;">Pkt.</th>
                                <th style="padding:10px; text-align:right;">Zeit</th>
                            </tr>
                        </thead><tbody>`;
            d.ranking.forEach((r, i) => { 
                const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1;
                const isMe = r.username === state.username;
                h += `<tr style="border-bottom:1px solid #eee; ${isMe ? 'background:#fef9c3; font-weight:bold;' : ''}">
                        <td style="padding:10px;">${medal}</td>
                        <td style="padding:10px;">${r.username}</td>
                        <td style="padding:10px; text-align:right;">${r.score}</td>
                        <td style="padding:10px; text-align:right; color:#666;">${r.timeUsed}s</td>
                      </tr>`; 
            });
            quizContainer.innerHTML = h + `</tbody></table><button onclick="location.reload()" class="btn-primary" style="margin-top:20px;">Zurück</button>`;
        } catch (e) { location.reload(); }
    };

    document.getElementById("logoutBtn").onclick = () => { localStorage.clear(); window.location.href = "login.html"; };
});