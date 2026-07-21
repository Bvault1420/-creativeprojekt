/* Le coin Internet – Quiz Vrai ou Faux + traduction */
(function () {
  "use strict";

  const FEEDBACK_DELAY_MS = 2200;
  const questions = window.LE_COIN_QUESTIONS;
  if (!questions || !questions.length) {
    console.error("Quiz: questions not loaded");
    return;
  }

  const el = {
    game: document.getElementById("quiz-game"),
    result: document.getElementById("quiz-result"),
    statement: document.getElementById("quiz-statement"),
    progress: document.getElementById("quiz-progress"),
    score: document.getElementById("quiz-score"),
    feedback: document.getElementById("quiz-feedback"),
    btnVrai: document.getElementById("btn-vrai"),
    btnFaux: document.getElementById("btn-faux"),
    btnValider: document.getElementById("btn-valider"),
    btnReplay: document.getElementById("btn-replay"),
    buttons: document.getElementById("quiz-buttons"),
    translate: document.getElementById("quiz-translate"),
    promptDE: document.getElementById("quiz-prompt-de"),
    input: document.getElementById("quiz-input"),
    progressFill: document.getElementById("quiz-progress-fill"),
    resultScore: document.getElementById("result-score"),
    resultMsg: document.getElementById("result-msg"),
    level: document.getElementById("quiz-level"),
  };

  let current = 0;
  let score = 0;
  let answered = false;
  let advanceTimer = null;

  function normalizeText(s) {
    return s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[.,!?;:]/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function checkTranslation(userInput, accepted) {
    const normalized = normalizeText(userInput);
    if (!normalized) return false;
    return accepted.some((a) => normalizeText(a) === normalized);
  }

  function setLevelBadge(q) {
    el.level.textContent = q.levelLabel;
    const levelClass = q.type === "translate" ? "translate" : q.level;
    el.level.className = "quiz__level quiz__level--" + levelClass;
  }

  function updateProgressBar(ratio) {
    el.progressFill.style.width = Math.round(ratio * 100) + "%";
  }

  function setFeedback(ok, message) {
    el.feedback.textContent = message;
    el.feedback.className =
      "quiz__feedback is-visible quiz__feedback--" + (ok ? "ok" : "bad");
  }

  function showFeedback(correct, q) {
    if (correct) {
      score += 1;
      el.score.textContent = String(score);
      setFeedback(true, "Bravo ! " + q.explain);
      return;
    }
    if (q.type === "translate") {
      setFeedback(false, "Dommage ! " + q.explain);
      return;
    }
    const bonne = q.answer ? "Vrai" : "Faux";
    setFeedback(false, "Dommage ! C'était " + bonne + ". " + q.explain);
  }

  function clearAdvanceTimer() {
    if (advanceTimer !== null) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
  }

  function nextQuestion() {
    clearAdvanceTimer();
    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      current += 1;
      if (current < questions.length) {
        showQuestion();
      } else {
        showResult();
      }
    }, FEEDBACK_DELAY_MS);
  }

  function setControlsEnabled(enabled) {
    el.btnVrai.disabled = !enabled;
    el.btnFaux.disabled = !enabled;
    el.btnValider.disabled = !enabled;
    el.input.disabled = !enabled;
  }

  function showQuestion() {
    answered = false;
    el.feedback.classList.remove(
      "is-visible",
      "quiz__feedback--ok",
      "quiz__feedback--bad"
    );

    const q = questions[current];
    const isTranslate = q.type === "translate";

    el.buttons.style.display = isTranslate ? "none" : "grid";
    el.translate.classList.toggle("is-visible", isTranslate);
    setControlsEnabled(true);

    if (isTranslate) {
      el.statement.textContent = "Écris cette phrase en français :";
      el.promptDE.textContent = "🇩🇪 " + q.german;
      el.input.value = "";
      setTimeout(() => el.input.focus(), 80);
    } else {
      el.statement.textContent = q.text;
    }

    setLevelBadge(q);
    el.progress.textContent =
      "Question " + (current + 1) + " / " + questions.length;
    el.score.textContent = String(score);
    updateProgressBar(current / questions.length);
  }

  function handleAnswer(userSaysVrai) {
    if (answered) return;
    answered = true;
    el.btnVrai.disabled = true;
    el.btnFaux.disabled = true;

    const q = questions[current];
    showFeedback(userSaysVrai === q.answer, q);
    nextQuestion();
  }

  function handleTranslation() {
    if (answered) return;
    const q = questions[current];
    const userText = el.input.value.trim();
    if (!userText) {
      el.input.focus();
      return;
    }

    answered = true;
    el.btnValider.disabled = true;
    el.input.disabled = true;

    showFeedback(checkTranslation(userText, q.accepted), q);
    nextQuestion();
  }

  function resultMessage(s) {
    if (s >= 8) return "Excellent ! Tu connais bien la France et Internet !";
    if (s >= 5) return "Pas mal ! Continue à apprendre !";
    return "Tu peux encore progresser. Rejoue !";
  }

  function showResult() {
    el.game.style.display = "none";
    el.result.classList.add("is-visible");
    updateProgressBar(1);
    el.resultScore.textContent =
      "Tu as " + score + " sur " + questions.length + " bonnes réponses !";
    el.resultMsg.textContent = resultMessage(score);
  }

  function resetQuiz() {
    clearAdvanceTimer();
    current = 0;
    score = 0;
    answered = false;
    el.game.style.display = "block";
    el.result.classList.remove("is-visible");
    showQuestion();
  }

  el.btnVrai.addEventListener("click", () => handleAnswer(true));
  el.btnFaux.addEventListener("click", () => handleAnswer(false));
  el.btnValider.addEventListener("click", handleTranslation);
  el.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleTranslation();
  });
  el.btnReplay.addEventListener("click", resetQuiz);

  showQuestion();
})();
